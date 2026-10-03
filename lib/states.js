// Static geographic reference data for India's 28 States and 8 Union Territories.
// Used to seed PostgreSQL and to map GeoJSON features to database rows.
//
// - code: ISO 3166-2:IN style state code (used in URLs, e.g. /dashboard?state=MH)
// - geoName: the exact `st_nm` property used in /public/geojson/india-states.geojson
// - points: fixed monitoring locations (real city coordinates). The first point is the
//   state's REPRESENTATIVE location (usually the capital or largest city).
//   No weather values are stored here; weather is always fetched live from Open-Meteo.

export const STATES = [
  { code: 'AP', name: 'Andhra Pradesh', type: 'STATE', capital: 'Amaravati', points: [['Vijayawada', 16.5062, 80.648], ['Visakhapatnam', 17.6868, 83.2185], ['Kurnool', 15.8281, 78.0373]] },
  { code: 'AR', name: 'Arunachal Pradesh', type: 'STATE', capital: 'Itanagar', points: [['Itanagar', 27.0844, 93.6053]] },
  { code: 'AS', name: 'Assam', type: 'STATE', capital: 'Dispur', points: [['Guwahati', 26.1445, 91.7362], ['Silchar', 24.8333, 92.7789]] },
  { code: 'BR', name: 'Bihar', type: 'STATE', capital: 'Patna', points: [['Patna', 25.5941, 85.1376], ['Gaya', 24.7914, 85.0002]] },
  { code: 'CG', name: 'Chhattisgarh', type: 'STATE', capital: 'Raipur', points: [['Raipur', 21.2514, 81.6296]] },
  { code: 'GA', name: 'Goa', type: 'STATE', capital: 'Panaji', points: [['Panaji', 15.4909, 73.8278]] },
  { code: 'GJ', name: 'Gujarat', type: 'STATE', capital: 'Gandhinagar', points: [['Ahmedabad', 23.0225, 72.5714], ['Rajkot', 22.3039, 70.8022], ['Surat', 21.1702, 72.8311]] },
  { code: 'HR', name: 'Haryana', type: 'STATE', capital: 'Chandigarh', points: [['Hisar', 29.1492, 75.7217], ['Gurugram', 28.4595, 77.0266]] },
  { code: 'HP', name: 'Himachal Pradesh', type: 'STATE', capital: 'Shimla', points: [['Shimla', 31.1048, 77.1734]] },
  { code: 'JH', name: 'Jharkhand', type: 'STATE', capital: 'Ranchi', points: [['Ranchi', 23.3441, 85.3096], ['Jamshedpur', 22.8046, 86.2029]] },
  { code: 'KA', name: 'Karnataka', type: 'STATE', capital: 'Bengaluru', points: [['Bengaluru', 12.9716, 77.5946], ['Kalaburagi', 17.3297, 76.8343], ['Mangaluru', 12.9141, 74.856]] },
  { code: 'KL', name: 'Kerala', type: 'STATE', capital: 'Thiruvananthapuram', points: [['Thiruvananthapuram', 8.5241, 76.9366], ['Kochi', 9.9312, 76.2673], ['Palakkad', 10.7867, 76.6548]] },
  { code: 'MP', name: 'Madhya Pradesh', type: 'STATE', capital: 'Bhopal', points: [['Bhopal', 23.2599, 77.4126], ['Gwalior', 26.2183, 78.1828], ['Jabalpur', 23.1815, 79.9864]] },
  { code: 'MH', name: 'Maharashtra', type: 'STATE', capital: 'Mumbai', points: [['Mumbai', 19.076, 72.8777], ['Nagpur', 21.1458, 79.0882], ['Pune', 18.5204, 73.8567], ['Chandrapur', 19.9615, 79.2961]] },
  { code: 'MN', name: 'Manipur', type: 'STATE', capital: 'Imphal', points: [['Imphal', 24.817, 93.9368]] },
  { code: 'ML', name: 'Meghalaya', type: 'STATE', capital: 'Shillong', points: [['Shillong', 25.5788, 91.8933]] },
  { code: 'MZ', name: 'Mizoram', type: 'STATE', capital: 'Aizawl', points: [['Aizawl', 23.7271, 92.7176]] },
  { code: 'NL', name: 'Nagaland', type: 'STATE', capital: 'Kohima', points: [['Kohima', 25.6751, 94.1086]] },
  { code: 'OD', name: 'Odisha', type: 'STATE', capital: 'Bhubaneswar', points: [['Bhubaneswar', 20.2961, 85.8245], ['Sambalpur', 21.4669, 83.9812]] },
  { code: 'PB', name: 'Punjab', type: 'STATE', capital: 'Chandigarh', points: [['Ludhiana', 30.901, 75.8573], ['Amritsar', 31.634, 74.8723]] },
  { code: 'RJ', name: 'Rajasthan', type: 'STATE', capital: 'Jaipur', points: [['Jaipur', 26.9124, 75.7873], ['Jodhpur', 26.2389, 73.0243], ['Bikaner', 28.0229, 73.3119], ['Kota', 25.2138, 75.8648]] },
  { code: 'SK', name: 'Sikkim', type: 'STATE', capital: 'Gangtok', points: [['Gangtok', 27.3389, 88.6065]] },
  { code: 'TN', name: 'Tamil Nadu', type: 'STATE', capital: 'Chennai', points: [['Chennai', 13.0827, 80.2707], ['Madurai', 9.9252, 78.1198], ['Coimbatore', 11.0168, 76.9558]] },
  { code: 'TG', name: 'Telangana', type: 'STATE', capital: 'Hyderabad', points: [['Hyderabad', 17.385, 78.4867], ['Ramagundam', 18.7557, 79.474]] },
  { code: 'TR', name: 'Tripura', type: 'STATE', capital: 'Agartala', points: [['Agartala', 23.8315, 91.2868]] },
  { code: 'UP', name: 'Uttar Pradesh', type: 'STATE', capital: 'Lucknow', points: [['Lucknow', 26.8467, 80.9462], ['Prayagraj', 25.4358, 81.8463], ['Agra', 27.1767, 78.0081], ['Varanasi', 25.3176, 82.9739]] },
  { code: 'UK', name: 'Uttarakhand', type: 'STATE', capital: 'Dehradun', points: [['Dehradun', 30.3165, 78.0322]] },
  { code: 'WB', name: 'West Bengal', type: 'STATE', capital: 'Kolkata', points: [['Kolkata', 22.5726, 88.3639], ['Siliguri', 26.7271, 88.3953]] },

  { code: 'AN', name: 'Andaman and Nicobar Islands', type: 'UNION_TERRITORY', capital: 'Sri Vijaya Puram', points: [['Sri Vijaya Puram (Port Blair)', 11.6234, 92.7265]] },
  { code: 'CH', name: 'Chandigarh', type: 'UNION_TERRITORY', capital: 'Chandigarh', points: [['Chandigarh', 30.7333, 76.7794]] },
  { code: 'DH', name: 'Dadra and Nagar Haveli and Daman and Diu', type: 'UNION_TERRITORY', capital: 'Daman', points: [['Daman', 20.3974, 72.8328], ['Silvassa', 20.2766, 73.0169]] },
  { code: 'DL', name: 'Delhi', type: 'UNION_TERRITORY', capital: 'New Delhi', points: [['New Delhi', 28.6139, 77.209]] },
  { code: 'JK', name: 'Jammu and Kashmir', type: 'UNION_TERRITORY', capital: 'Srinagar (summer) / Jammu (winter)', points: [['Srinagar', 34.0837, 74.7973], ['Jammu', 32.7266, 74.857]] },
  { code: 'LA', name: 'Ladakh', type: 'UNION_TERRITORY', capital: 'Leh', points: [['Leh', 34.1526, 77.5771]] },
  { code: 'LD', name: 'Lakshadweep', type: 'UNION_TERRITORY', capital: 'Kavaratti', points: [['Kavaratti', 10.5669, 72.642]] },
  { code: 'PY', name: 'Puducherry', type: 'UNION_TERRITORY', capital: 'Puducherry', points: [['Puducherry', 11.9416, 79.8083]] },
].map((s) => ({ ...s, geoName: s.name }));

export const DEFAULT_STATE_CODE = 'MH';

const BY_CODE = new Map(STATES.map((s) => [s.code, s]));
const BY_GEONAME = new Map(STATES.map((s) => [s.geoName.toLowerCase(), s]));

export function getStaticState(code) {
  return code ? BY_CODE.get(String(code).toUpperCase()) || null : null;
}

// Mapping layer between the GeoJSON `st_nm` property and our state codes.
export function stateCodeFromGeoName(geoName) {
  return BY_GEONAME.get(String(geoName || '').toLowerCase())?.code || null;
}

export function isValidStateCode(code) {
  return BY_CODE.has(String(code || '').toUpperCase());
}
