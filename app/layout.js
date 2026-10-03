import { Inter, Space_Grotesk } from 'next/font/google';
import '@/styles/globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const display = Space_Grotesk({ subsets: ['latin'], variable: '--font-display-face', display: 'swap' });

export const metadata = {
  title: { default: 'ClimateIQ — Heatwave Early Warning System for India', template: '%s · ClimateIQ' },
  description: 'Climate Intelligence & Heatwave Early Warning System for India: live heat-risk map, forecasts, historical analysis and safety guidance.',
};

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f7f5f0' },
    { media: '(prefers-color-scheme: dark)', color: '#070d1a' },
  ],
};

// Applies the saved (or system) theme before first paint to avoid a flash.
const themeScript = `(function(){try{var t=localStorage.getItem('ciq-theme');if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.dataset.theme=t}catch(e){}})();`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${display.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
