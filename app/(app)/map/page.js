import LiveMap from '@/components/LiveMap';
import { RISK_DISCLAIMER } from '@/lib/riskLevels';

export const metadata = { title: 'Live Heat-Risk Map' };

export default function MapPage() {
  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">Live heat-risk monitoring</div>
          <h1>India Heat-Risk Map</h1>
          <p className="lead">Every point is a real city location. Temperature, humidity and risk are fetched live from Open-Meteo and scored on the server. Use the filter to emphasise a risk level.</p>
        </div>
      </div>
      <LiveMap variant="full" />
      <p className="tiny faint">{RISK_DISCLAIMER} State shading shows the highest risk among that state&apos;s monitoring points; it is not a state-wide average.</p>
    </>
  );
}
