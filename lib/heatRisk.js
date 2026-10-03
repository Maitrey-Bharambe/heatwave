// ClimateIQ heat-risk engine — "System-Generated Heat-Risk Estimate".
//
// A deterministic, transparent scoring model (not machine learning). Each factor maps a
// real weather variable onto a 0–1 sub-score using fixed linear ramps; the weighted sum
// is normalised to 0–100. Factors whose input data is unavailable are excluded and the
// remaining weights are renormalised, so a missing value never becomes a fake one.
//
// Thresholds are project-defined for an Indian context and are documented in README.md.
import { riskLevelForScore } from './riskLevels.js';

export const HOT_DAY_THRESHOLD_C = 38; // a "hot day" = forecast max temperature ≥ 38 °C

export const FACTOR_DEFINITIONS = [
  { key: 'temperature', label: 'Temperature', weight: 30, ramp: [30, 45], unit: '°C',
    describe: 'Maximum air temperature (30 °C → 0, 45 °C → full weight)' },
  { key: 'apparent', label: 'Feels like', weight: 25, ramp: [32, 52], unit: '°C',
    describe: 'Maximum apparent ("feels like") temperature (32 °C → 0, 52 °C → full weight)' },
  { key: 'humidity', label: 'Humidity', weight: 10, ramp: [40, 80], unit: '%',
    describe: 'Relative humidity 40 % → 0, 80 % → full weight, scaled by how hot it is (28–36 °C)' },
  { key: 'hotDays', label: 'Hot-day trend', weight: 15, ramp: [0, 5], unit: 'days',
    describe: `Consecutive forecast days with max ≥ ${HOT_DAY_THRESHOLD_C} °C (0 → 0, 5+ → full weight)` },
  { key: 'forecast', label: 'Forecast trend', weight: 10, ramp: [32, 43], unit: '°C',
    describe: 'Mean forecast maximum over the coming days (32 °C → 0, 43 °C → full weight)' },
  { key: 'historical', label: 'Historical difference', weight: 10, ramp: [0, 6], unit: '°C',
    describe: 'Next-3-day mean maximum minus the 5-year same-season average (0 → 0, +6 °C → full weight)' },
];

const clamp01 = (x) => Math.max(0, Math.min(1, x));
const ramp = (v, [lo, hi]) => clamp01((v - lo) / (hi - lo));
const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
const round1 = (v) => Math.round(v * 10) / 10;
const mean = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;

function band(sub) {
  if (sub >= 0.66) return 'High';
  if (sub >= 0.33) return 'Moderate';
  return 'Low';
}

/**
 * @param {object} input
 * @param {number} input.maxTemp            peak temperature for the period (°C)
 * @param {number} input.apparentMax        peak apparent temperature (°C)
 * @param {number} [input.humidity]         relative humidity (%)
 * @param {number[]} [input.upcomingMax]    forecast daily max temps starting at the evaluated day
 * @param {number} [input.baselineMax]      5-year same-season mean daily max (°C)
 */
export function computeHeatRisk({ maxTemp, apparentMax, humidity, upcomingMax = [], baselineMax }) {
  const upcoming = upcomingMax.filter(isNum);
  const values = {};

  if (isNum(maxTemp)) values.temperature = { value: round1(maxTemp), sub: ramp(maxTemp, [30, 45]) };
  if (isNum(apparentMax)) values.apparent = { value: round1(apparentMax), sub: ramp(apparentMax, [32, 52]) };
  if (isNum(humidity) && isNum(maxTemp)) {
    values.humidity = { value: Math.round(humidity), sub: ramp(humidity, [40, 80]) * ramp(maxTemp, [28, 36]) };
  }
  if (upcoming.length >= 2) {
    let streak = 0;
    for (const t of upcoming) { if (t >= HOT_DAY_THRESHOLD_C) streak += 1; else break; }
    values.hotDays = { value: streak, sub: ramp(streak, [0, 5]) };
    const m = mean(upcoming);
    values.forecast = { value: round1(m), sub: ramp(m, [32, 43]) };
  }
  if (isNum(baselineMax) && upcoming.length >= 1) {
    const next3 = mean(upcoming.slice(0, 3));
    const diff = next3 - baselineMax;
    values.historical = { value: round1(diff), sub: ramp(diff, [0, 6]), baseline: round1(baselineMax) };
  }

  const factors = FACTOR_DEFINITIONS.filter((d) => values[d.key]).map((d) => {
    const v = values[d.key];
    return {
      key: d.key,
      label: d.label,
      value: v.value,
      unit: d.unit,
      weight: d.weight,
      subScore: Math.round(v.sub * 100) / 100,
      points: Math.round(v.sub * d.weight * 10) / 10,
      level: band(v.sub),
      ...(v.baseline !== undefined ? { baseline: v.baseline } : {}),
    };
  });

  if (!factors.length) return null;
  const totalWeight = factors.reduce((a, f) => a + f.weight, 0);
  const raw = factors.reduce((a, f) => a + f.subScore * f.weight, 0);
  const score = Math.round((raw / totalWeight) * 100);
  const missing = FACTOR_DEFINITIONS.filter((d) => !values[d.key]).map((d) => d.key);

  return { score, riskLevel: riskLevelForScore(score), factors, missingFactors: missing, explanation: explain(factors) };
}

// Human-readable "Why this risk?" bullets, generated only from factors that have real data.
export function explain(factors) {
  const f = Object.fromEntries(factors.map((x) => [x.key, x]));
  const out = [];
  if (f.temperature) {
    out.push(f.temperature.level === 'High'
      ? `Maximum temperature is very high (${f.temperature.value} °C)`
      : f.temperature.level === 'Moderate'
        ? `Maximum temperature is elevated (${f.temperature.value} °C)`
        : `Maximum temperature is moderate (${f.temperature.value} °C)`);
  }
  if (f.apparent && f.temperature) {
    const gap = Math.round((f.apparent.value - f.temperature.value) * 10) / 10;
    if (gap >= 3) out.push(`It feels ${gap} °C hotter than the air temperature (feels like ${f.apparent.value} °C)`);
    else if (f.apparent.level !== 'Low') out.push(`Apparent temperature is elevated (feels like ${f.apparent.value} °C)`);
  }
  if (f.humidity) {
    if (f.humidity.level !== 'Low') out.push(`Humidity of ${f.humidity.value}% is increasing apparent heat stress`);
    else if (f.humidity.value >= 60) out.push(`Humidity is high (${f.humidity.value}%) but temperatures are not high enough to add much heat stress`);
  }
  if (f.hotDays) {
    if (f.hotDays.value >= 2) out.push(`${f.hotDays.value} consecutive hot days (max ≥ ${HOT_DAY_THRESHOLD_C} °C) are expected`);
    else if (f.hotDays.value === 1) out.push(`A hot day (max ≥ ${HOT_DAY_THRESHOLD_C} °C) is expected, but it is not forecast to persist`);
    else out.push(`No hot days (max ≥ ${HOT_DAY_THRESHOLD_C} °C) are forecast`);
  }
  if (f.forecast) {
    out.push(f.forecast.level === 'Low'
      ? `Forecast maximum temperatures average ${f.forecast.value} °C — not persistently hot`
      : `Forecast maximum temperatures remain elevated (average ${f.forecast.value} °C)`);
  }
  if (f.historical) {
    const d = f.historical.value;
    if (d >= 1) out.push(`The next 3 days are ${d} °C warmer than the 5-year average for this time of year (${f.historical.baseline} °C)`);
    else if (d <= -1) out.push(`The next 3 days are ${Math.abs(d)} °C cooler than the 5-year average for this time of year`);
    else out.push('Temperatures are close to the 5-year average for this time of year');
  }
  return out;
}

/**
 * Risk for a monitoring point "now": combines current conditions with today's forecast.
 * daily = normalised Open-Meteo daily arrays (see openMeteo.js).
 */
export function computeCurrentRisk(current, daily, baselineMax) {
  const todayMax = daily?.maxTemperature?.[0];
  const todayApp = daily?.apparentMax?.[0];
  const maxTemp = [current?.temperature, todayMax].filter(isNum);
  const app = [current?.apparentTemperature, todayApp].filter(isNum);
  return computeHeatRisk({
    maxTemp: maxTemp.length ? Math.max(...maxTemp) : undefined,
    apparentMax: app.length ? Math.max(...app) : undefined,
    humidity: current?.humidity,
    upcomingMax: daily?.maxTemperature || [],
    baselineMax,
  });
}

/** Risk estimate for each forecast day d (uses that day's values and the days after it). */
export function computeDailyRisks(daily, baselineMax) {
  if (!daily?.dates) return [];
  return daily.dates.map((_, d) =>
    computeHeatRisk({
      maxTemp: daily.maxTemperature[d],
      apparentMax: daily.apparentMax[d],
      humidity: daily.humidityMean?.[d],
      upcomingMax: daily.maxTemperature.slice(d),
      baselineMax,
    }),
  );
}
