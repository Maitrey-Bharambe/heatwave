// Reference content seeded into PostgreSQL (safety_tips, emergency_contacts).
// Shared by prisma/seed.mjs and scripts/generate-supabase-sql.mjs.

// General heat-health guidance, based on publicly available NDMA (India) heatwave
// guidelines and WHO heat-health advice. riskLevel = null means "applies always".
export const SAFETY_TIPS = [
  // Hydration
  [null, 'Hydration', 'Drink water regularly', 'Drink water frequently even if you do not feel thirsty. Thirst is a late sign of dehydration.'],
  [null, 'Hydration', 'Use ORS and home-made drinks', 'Oral Rehydration Solution (ORS), lassi, lemon water, buttermilk and coconut water help replace salts lost through sweat.'],
  [null, 'Hydration', 'Limit alcohol, tea, coffee and sugary drinks', 'These can increase fluid loss. Prefer water and electrolyte drinks during hot weather.'],
  // Prevention
  [null, 'Prevention', 'Wear light, loose cotton clothing', 'Light-coloured, loose, breathable clothes reflect heat and let sweat evaporate. Cover your head with a cap, cloth or umbrella outdoors.'],
  [null, 'Prevention', 'Keep your home cool', 'Use curtains or shades on sun-facing windows during the day and ventilate at night when it is cooler outside.'],
  [null, 'Prevention', 'Never leave anyone in a parked vehicle', 'Temperatures inside a closed vehicle rise dangerously within minutes. Never leave children, elderly people or pets inside.'],
  // Heat illness
  [null, 'Heat exhaustion', 'Recognise heat exhaustion', 'Heavy sweating, weakness, dizziness, headache, nausea, muscle cramps and fast pulse. Move to a cool place, loosen clothing, sip water or ORS and rest.'],
  [null, 'Heatstroke', 'Recognise heatstroke — a medical emergency', 'Very high body temperature, hot dry or red skin, confusion, slurred speech, seizures or unconsciousness. Call 108 or 112 immediately.'],
  [null, 'First aid', 'First aid while waiting for help', 'Move the person to shade, remove excess clothing, cool the body with wet cloths, fanning or water on the skin, and place ice packs at neck, armpits and groin. Do not give fluids to an unconscious person.'],
  // Vulnerable people
  [null, 'Vulnerable people', 'Check on vulnerable people', 'Infants, young children, older adults, pregnant women, outdoor workers and people with heart, kidney or respiratory conditions are at higher risk. Check on them at least twice a day during hot spells.'],
  [null, 'Outdoor safety', 'Plan outdoor work for cooler hours', 'Schedule strenuous activity for early morning or evening. Take frequent breaks in shade and drink water every 15–20 minutes while working.'],
  // Risk-specific
  ['VERY_LOW', 'Outlook', 'Normal precautions are sufficient', 'Heat stress is unlikely. Stay hydrated as usual and keep an eye on the forecast for rising temperatures.'],
  ['LOW', 'Outlook', 'Stay hydrated during the afternoon', 'Some heat stress is possible during the hottest hours. Carry water when going out and take breaks in the shade.'],
  ['MEDIUM', 'Outlook', 'Limit afternoon sun exposure', 'Avoid strenuous outdoor activity between 12 noon and 3 PM. Keep ORS available and check on elderly neighbours.'],
  ['MEDIUM', 'Outdoor safety', 'Protect outdoor workers', 'Employers should provide shade, drinking water and rest breaks, and shift heavy work to cooler hours.'],
  ['HIGH', 'Outlook', 'Avoid going out in the afternoon', 'Stay indoors between 12 noon and 4 PM where possible. Postpone non-essential travel and outdoor exercise.'],
  ['HIGH', 'Vulnerable people', 'Prepare for heat illness', 'Keep ORS, a thermometer and wet cloths ready. Know the warning signs of heat exhaustion and heatstroke, and save 108 / 112 on your phone.'],
  ['EXTREME', 'Outlook', 'Treat heat as a health emergency risk', 'Stay in the coolest place available, avoid all strenuous activity, drink water every hour and follow advisories issued by IMD and your State Disaster Management Authority.'],
  ['EXTREME', 'Vulnerable people', 'Do not leave vulnerable people alone', 'Ensure infants, elderly and ill people are in a cool space and are checked frequently. Seek medical help at the first sign of confusion or very high body temperature.'],
];

// Verified national emergency numbers in India.
export const EMERGENCY_CONTACTS = [
  ['National Emergency Number (ERSS)', '112', 'Single emergency number for police, fire and medical emergencies, available nationwide.', 'Emergency Response Support System, Ministry of Home Affairs (112.gov.in)'],
  ['Ambulance', '108', 'Emergency medical ambulance service operated by state governments in most states and UTs.', 'National Health Mission, MoHFW'],
  ['Ambulance (maternal & child health)', '102', 'Patient transport, primarily for pregnant women and sick infants.', 'National Health Mission, MoHFW'],
  ['Police', '100', 'Police emergency (being integrated with 112 in most states).', 'Ministry of Home Affairs'],
  ['Fire', '101', 'Fire and rescue services.', 'Ministry of Home Affairs'],
  ['State Disaster Control Room', '1070', 'State Emergency Operation Centre for disasters, including heatwaves.', 'National Disaster Management Authority (NDMA)'],
  ['District Disaster Control Room', '1077', 'District Emergency Operation Centre / district control room.', 'National Disaster Management Authority (NDMA)'],
  ['National Disaster Helpline', '1078', 'National Emergency Operation Centre helpline.', 'National Disaster Management Authority (NDMA)'],
];
