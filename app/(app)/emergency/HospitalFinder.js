'use client';
import { useState } from 'react';
import { ExternalLink, Hospital, Navigation } from 'lucide-react';
import { useSelectedState } from '@/components/SelectedStateProvider';

// Finds hospitals near the user without storing any hospital data ourselves:
// links open OpenStreetMap's live search around the chosen coordinates.
// Location permission is optional — the representative city is used otherwise.
export default function HospitalFinder() {
  const { selected } = useSelectedState();
  const [coords, setCoords] = useState(null);
  const [status, setStatus] = useState('');
  const [query, setQuery] = useState('');

  const locate = () => {
    if (!('geolocation' in navigator)) { setStatus('Location is not supported by this browser. Search by city instead.'); return; }
    setStatus('Requesting your location…');
    navigator.geolocation.getCurrentPosition(
      (pos) => { setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }); setStatus('Using your current location.'); },
      () => setStatus('Location permission denied. Search by city or use the selected state below.'),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 },
    );
  };

  const near = coords || { lat: selected.latitude, lon: selected.longitude };
  const osmNear = `https://www.openstreetmap.org/search?query=${encodeURIComponent('hospital')}#map=14/${near.lat.toFixed(4)}/${near.lon.toFixed(4)}`;
  const osmCity = query.trim() ? `https://www.openstreetmap.org/search?query=${encodeURIComponent(`hospitals in ${query.trim()}`)}` : null;

  return (
    <section className="card">
      <div className="card-header">
        <div><div className="eyebrow">Nearby care</div><h2>Find hospitals near you</h2><div className="sub">Opens a live OpenStreetMap search. ClimateIQ does not store hospital data.</div></div>
        <Hospital size={20} className="faint" />
      </div>
      <div className="stack">
        <div className="row" style={{ flexWrap: 'wrap' }}>
          <button type="button" className="btn" onClick={locate}><Navigation size={15} /> Use my location</button>
          <a className="btn btn-primary" href={osmNear} target="_blank" rel="noopener noreferrer">
            {coords ? 'Hospitals near me' : `Hospitals near ${selected.name}'s representative city`} <ExternalLink size={14} />
          </a>
        </div>
        {status && <p className="small muted" role="status">{status}</p>}
        <form className="row" style={{ flexWrap: 'wrap' }} onSubmit={(e) => { e.preventDefault(); if (osmCity) window.open(osmCity, '_blank', 'noopener'); }}>
          <input className="input" style={{ maxWidth: 280 }} placeholder="Or type a city / town…" aria-label="City or town" value={query} onChange={(e) => setQuery(e.target.value)} />
          <button className="btn" type="submit" disabled={!osmCity}>Search</button>
        </form>
      </div>
    </section>
  );
}
