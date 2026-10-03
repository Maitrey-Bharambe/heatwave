// Unit tests for the deterministic heat-risk engine.  Run: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeHeatRisk, computeCurrentRisk, computeDailyRisks } from '../lib/heatRisk.js';
import { riskLevelForScore } from '../lib/riskLevels.js';

test('risk bands match the project-defined thresholds', () => {
  assert.equal(riskLevelForScore(0), 'VERY_LOW');
  assert.equal(riskLevelForScore(24), 'VERY_LOW');
  assert.equal(riskLevelForScore(25), 'LOW');
  assert.equal(riskLevelForScore(39), 'LOW');
  assert.equal(riskLevelForScore(40), 'MEDIUM');
  assert.equal(riskLevelForScore(59), 'MEDIUM');
  assert.equal(riskLevelForScore(60), 'HIGH');
  assert.equal(riskLevelForScore(79), 'HIGH');
  assert.equal(riskLevelForScore(80), 'EXTREME');
  assert.equal(riskLevelForScore(100), 'EXTREME');
});

test('mild weather scores very low', () => {
  const r = computeHeatRisk({ maxTemp: 27, apparentMax: 28, humidity: 70, upcomingMax: [27, 26, 27, 28, 27, 26, 27], baselineMax: 28 });
  assert.equal(r.score, 0);
  assert.equal(r.riskLevel, 'VERY_LOW');
});

test('a severe, persistent heatwave scores extreme', () => {
  const r = computeHeatRisk({ maxTemp: 46.5, apparentMax: 49, humidity: 20, upcomingMax: [46.5, 46, 45.8, 45, 44.6, 44, 43], baselineMax: 40.5 });
  assert.ok(r.score >= 80, `expected >= 80, got ${r.score}`);
  assert.equal(r.riskLevel, 'EXTREME');
  assert.equal(r.factors.find((f) => f.key === 'hotDays').value, 7);
});

test('humidity only adds stress when it is hot', () => {
  const coolHumid = computeHeatRisk({ maxTemp: 26, apparentMax: 28, humidity: 95 });
  const hotHumid = computeHeatRisk({ maxTemp: 36, apparentMax: 44, humidity: 80 });
  assert.equal(coolHumid.factors.find((f) => f.key === 'humidity').subScore, 0);
  assert.equal(hotHumid.factors.find((f) => f.key === 'humidity').subScore, 1);
});

test('score is monotonic in temperature', () => {
  let prev = -1;
  for (let t = 28; t <= 48; t += 1) {
    const { score } = computeHeatRisk({ maxTemp: t, apparentMax: t + 2, humidity: 40, upcomingMax: [t, t, t], baselineMax: 35 });
    assert.ok(score >= prev, `score dropped at ${t} °C`);
    prev = score;
  }
});

test('missing data is excluded, never invented, and weights are rescaled', () => {
  const r = computeHeatRisk({ maxTemp: 45, apparentMax: 52 });
  assert.deepEqual(r.missingFactors.sort(), ['forecast', 'historical', 'hotDays', 'humidity'].sort());
  assert.equal(r.score, 100); // both available factors are at their maximum
  assert.equal(computeHeatRisk({}), null);
});

test('explanations only mention factors with data', () => {
  const r = computeHeatRisk({ maxTemp: 41, apparentMax: 45, humidity: 35 });
  assert.ok(r.explanation.every((e) => !/5-year|consecutive|Forecast/.test(e)));
});

test('current and daily risk use real forecast arrays', () => {
  const daily = {
    dates: ['2026-05-01', '2026-05-02', '2026-05-03'],
    maxTemperature: [44, 45, 39],
    apparentMax: [46, 47, 40],
    humidityMean: [25, 22, 40],
  };
  const now = computeCurrentRisk({ temperature: 41, apparentTemperature: 43, humidity: 30 }, daily, 41);
  assert.equal(now.factors.find((f) => f.key === 'temperature').value, 44); // today's max beats current
  const days = computeDailyRisks(daily, 41);
  assert.equal(days.length, 3);
  assert.ok(days[1].score > days[2].score);
});
