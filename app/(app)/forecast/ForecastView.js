'use client';
import { useSelectedState } from '@/components/SelectedStateProvider';
import StateSelector from '@/components/StateSelector';
import { ForecastChart, ForecastStrip, useForecast } from '@/components/ForecastPanel';
import { DataStatus, ErrorState, LoadingLine, RiskBadge, Skeleton, WeatherIcon } from '@/components/ui';
import { fmtDate, fmtNum, fmtTemp, fmtWeekday } from '@/lib/format';

export default function ForecastView() {
  const { selected } = useSelectedState();
  const { data, error, loading, reload } = useForecast();

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">Forecast · next 7 days</div>
          <h1>{selected.name} forecast</h1>
          <p className="lead">{data ? <>Representative location: <strong>{data.location.name}</strong>. Forecast values from Open-Meteo; heat-risk estimates calculated by ClimateIQ.</> : 'Daily forecast from Open-Meteo.'}</p>
        </div>
        <div className="row" style={{ flexWrap: 'wrap' }}>
          <StateSelector />
          {data && <DataStatus meta={data.meta} />}
        </div>
      </div>

      {loading && !data ? (
        <div className="card stack"><LoadingLine>Fetching forecast…</LoadingLine><Skeleton h={90} /><Skeleton h={260} /></div>
      ) : error && !data ? (
        <div className="card"><ErrorState title="Forecast unavailable" message={error.message} onRetry={reload} /></div>
      ) : data ? (
        <>
          <section className="card">
            <ForecastStrip days={data.days} />
          </section>

          <section className="card">
            <div className="card-header"><div><div className="eyebrow">Chart</div><h2>Temperature forecast</h2><div className="sub">Daily maximum, minimum and maximum apparent (“feels like”) temperature</div></div></div>
            <ForecastChart days={data.days} height={300} />
          </section>

          <div className="grid grid-2">
            <section className="card">
              <div className="card-header"><div><h2>Maximum temperature</h2></div></div>
              <ForecastChart days={data.days} height={220} series={['max', 'app']} />
            </section>
            <section className="card">
              <div className="card-header"><div><h2>Minimum temperature</h2><div className="sub">Warm nights limit the body&apos;s recovery from daytime heat</div></div></div>
              <ForecastChart days={data.days} height={220} series={['min']} />
            </section>
          </div>

          <section className="card card-flush">
            <div className="card-header" style={{ padding: '1rem 1.2rem 0' }}><div><h2>Daily details</h2></div></div>
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr><th>Day</th><th>Date</th><th>Condition</th><th>Min</th><th>Max</th><th>Feels like (max)</th><th>Humidity</th><th>Precipitation</th><th>Wind (max)</th><th>Heat-risk estimate</th></tr>
                </thead>
                <tbody>
                  {data.days.map((d, i) => (
                    <tr key={d.date}>
                      <td><strong>{i === 0 ? 'Today' : fmtWeekday(d.date, 'long')}</strong></td>
                      <td className="num">{fmtDate(d.date)}</td>
                      <td><span className="row"><WeatherIcon code={d.weatherCode} size={16} /> {d.weatherCondition}</span></td>
                      <td className="num">{fmtTemp(d.minTemperature)}</td>
                      <td className="num">{fmtTemp(d.maxTemperature)}</td>
                      <td className="num">{fmtTemp(d.apparentMax)}</td>
                      <td className="num">{fmtNum(d.humidityMean, '%')}</td>
                      <td className="num">{fmtNum(d.precipitation, ' mm', 1)}</td>
                      <td className="num">{fmtNum(d.windSpeedMax, ' km/h')}</td>
                      <td>{d.risk ? <RiskBadge level={d.risk.riskLevel} score={d.risk.score} /> : <span className="faint">—</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <p className="tiny faint">Daily heat-risk estimates use that day&apos;s forecast maximum, apparent temperature and mean humidity, plus the days that follow. They are project-defined estimates, not official warnings.</p>
        </>
      ) : null}
    </>
  );
}
