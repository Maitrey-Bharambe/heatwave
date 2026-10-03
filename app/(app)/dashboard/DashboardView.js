'use client';
import { useSelectedState } from '@/components/SelectedStateProvider';
import StateSelector from '@/components/StateSelector';
import LiveMap from '@/components/LiveMap';
import WeatherCard from '@/components/WeatherCard';
import HeatRiskCard from '@/components/HeatRiskCard';
import ForecastPanel from '@/components/ForecastPanel';
import HistoricalComparison from '@/components/HistoricalComparison';
import SafetyCard from '@/components/SafetyCard';
import { FavoriteButton, FavoritesList, RecentSearches } from '@/components/UserData';
import { Notice } from '@/components/ui';
import { RISK_DISCLAIMER } from '@/lib/riskLevels';

export default function DashboardView() {
  const { user, selected } = useSelectedState();
  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">Climate monitoring console</div>
          <h1>{user ? `Welcome back, ${user.fullName.split(' ')[0]}` : 'Welcome to ClimateIQ'}</h1>
          <p className="lead">Live heat risk across India · selected: <strong style={{ color: 'var(--text)' }}>{selected.name}</strong></p>
        </div>
        <div className="row" style={{ flexWrap: 'wrap' }}>
          <StateSelector />
          <FavoriteButton />
        </div>
      </div>

      {!user && <Notice>You are exploring as a guest. <a href="/register">Create an account</a> to save favorite states and your search history.</Notice>}

      <div className="grid grid-dash">
        <LiveMap />
        <div className="side-col">
          <WeatherCard />
          <HeatRiskCard />
        </div>
      </div>

      <div className="grid grid-2">
        <ForecastPanel />
        <HistoricalComparison />
      </div>

      <div className="grid grid-3">
        <SafetyCard />
        <FavoritesList compact />
        <RecentSearches compact />
      </div>

      <p className="tiny faint">{RISK_DISCLAIMER} Weather data: Open-Meteo.</p>
    </>
  );
}
