'use client';
import { useSyncExternalStore } from 'react';
import { Moon, Sun } from 'lucide-react';

// Theme lives on <html data-theme>. An inline script in app/layout.js applies the saved
// theme before first paint, so there is no flash and no hydration mismatch.
function subscribe(cb) {
  const obs = new MutationObserver(cb);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  return () => obs.disconnect();
}
export function useTheme() {
  return useSyncExternalStore(subscribe, () => document.documentElement.dataset.theme || 'light', () => 'light');
}

export default function ThemeToggle({ className = 'btn btn-ghost icon-btn' }) {
  const theme = useTheme();
  const next = theme === 'dark' ? 'light' : 'dark';
  return (
    <button
      type="button"
      className={className}
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
      onClick={() => {
        document.documentElement.dataset.theme = next;
        try { localStorage.setItem('ciq-theme', next); } catch {}
      }}
    >
      {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
