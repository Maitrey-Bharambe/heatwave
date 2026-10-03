// WMO weather interpretation codes used by Open-Meteo.
const CODES = {
  0: ['Clear sky', 'sun'],
  1: ['Mainly clear', 'sun'],
  2: ['Partly cloudy', 'cloud-sun'],
  3: ['Overcast', 'cloud'],
  45: ['Fog', 'fog'],
  48: ['Depositing rime fog', 'fog'],
  51: ['Light drizzle', 'drizzle'],
  53: ['Moderate drizzle', 'drizzle'],
  55: ['Dense drizzle', 'drizzle'],
  56: ['Light freezing drizzle', 'drizzle'],
  57: ['Dense freezing drizzle', 'drizzle'],
  61: ['Slight rain', 'rain'],
  63: ['Moderate rain', 'rain'],
  65: ['Heavy rain', 'rain'],
  66: ['Light freezing rain', 'rain'],
  67: ['Heavy freezing rain', 'rain'],
  71: ['Slight snowfall', 'snow'],
  73: ['Moderate snowfall', 'snow'],
  75: ['Heavy snowfall', 'snow'],
  77: ['Snow grains', 'snow'],
  80: ['Slight rain showers', 'rain'],
  81: ['Moderate rain showers', 'rain'],
  82: ['Violent rain showers', 'rain'],
  85: ['Slight snow showers', 'snow'],
  86: ['Heavy snow showers', 'snow'],
  95: ['Thunderstorm', 'storm'],
  96: ['Thunderstorm with slight hail', 'storm'],
  99: ['Thunderstorm with heavy hail', 'storm'],
};

export function describeWeatherCode(code) {
  const hit = CODES[code];
  return { condition: hit ? hit[0] : 'Unknown', icon: hit ? hit[1] : 'cloud' };
}
