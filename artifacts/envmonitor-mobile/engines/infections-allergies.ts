export type RiskLevel = 'Low' | 'Moderate' | 'High' | 'Critical';

export interface InfectionRisk {
  id: string;
  name: string;
  category: 'Infection' | 'Allergy' | 'Respiratory' | 'Skin' | 'Environmental';
  riskLevel: RiskLevel;
  color: string;
  icon: string;
  description: string;
  warnings: string[];
  protections: string[];
}

export interface InfectionsInput {
  pms1?:       number | null;
  pms25?:      number | null;
  pms10?:      number | null;
  dust?:       number | null;
  smoke?:      number | null;
  co2?:        number | null;
  nh3?:        number | null;
  benzene?:    number | null;
  temperature?: number | null;
  humidity?:   number | null;
  rain?:       number | null;
  aqiScore?:   number;
}

function rl(score: number): RiskLevel {
  if (score < 25) return 'Low';
  if (score < 50) return 'Moderate';
  if (score < 75) return 'High';
  return 'Critical';
}

function rc(l: RiskLevel): string {
  return l === 'Low' ? '#22c55e' : l === 'Moderate' ? '#eab308' : l === 'High' ? '#f97316' : '#ef4444';
}

export function calculateInfectionsAllergies(input: InfectionsInput): InfectionRisk[] {
  const pms1  = input.pms1  ?? input.dust ?? 0;
  const pms25 = input.pms25 ?? input.dust ?? 0;
  const pms10 = input.pms10 ?? input.dust ?? 0;
  const dust  = input.dust  ?? pms10 ?? 0;
  const smoke = input.smoke ?? 0;
  const co2   = input.co2   ?? 400;
  const nh3   = input.nh3   ?? 0;
  const benz  = input.benzene ?? 0;
  const temp  = input.temperature ?? 22;
  const hum   = input.humidity ?? 50;
  const rain  = input.rain ?? 0;
  const aqi   = input.aqiScore ?? 0;

  const items: { id: string; name: string; category: InfectionRisk['category']; icon: string; score: number; desc: (s: number) => string; warn: (s: number) => string[]; prot: (s: number) => string[] }[] = [
    {
      id: 'viral_resp', name: 'Viral Respiratory Infection', category: 'Infection', icon: '🦠',
      score: Math.min(100, (pms25 > 35 ? 35 : pms25 > 12 ? 18 : pms25 > 5 ? 8 : 0) + (pms1 > 15 ? 25 : pms1 > 5 ? 12 : 0) + (co2 > 1000 ? 20 : co2 > 800 ? 10 : 0) + (hum > 70 ? 10 : hum < 30 ? 8 : 0)),
      desc: (s) => s > 50 ? 'High PM & CO₂ — aerosol viral transmission risk is elevated.' : s > 25 ? 'Moderate aerosol risk in enclosed spaces.' : 'Low viral transmission risk.',
      warn: (s) => s > 50 ? ['High virus transmission conditions', 'Avoid crowded indoors'] : s > 25 ? ['Ventilate rooms regularly'] : [],
      prot: (s) => s > 50 ? ['Wear N95 mask', 'Open windows', 'Sanitize surfaces'] : s > 25 ? ['Surgical mask in crowds', 'Wash hands frequently'] : ['Good hand hygiene'],
    },
    {
      id: 'pneumonia', name: 'Pneumonia Risk', category: 'Infection', icon: '🫁',
      score: Math.min(100, (pms10 > 50 ? 35 : pms10 > 25 ? 18 : 0) + (pms25 > 25 ? 30 : pms25 > 12 ? 15 : 0) + (smoke > 100 ? 20 : smoke > 50 ? 10 : 0) + (temp < 10 ? 10 : 0)),
      desc: (s) => s > 50 ? 'Coarse particle overload is straining respiratory defenses.' : s > 25 ? 'Elevated particles may weaken lung immunity.' : 'Pneumonia risk is low.',
      warn: (s) => s > 50 ? ['Severe lung risk — stay indoors', 'Elderly/children at high risk'] : s > 25 ? ['Avoid outdoor exercise'] : [],
      prot: (s) => s > 50 ? ['N95 mask mandatory', 'Air purifier on', 'Seek doctor if breathing difficulty'] : s > 25 ? ['Surgical mask outdoors'] : ['Normal precautions'],
    },
    {
      id: 'asthma_trigger', name: 'Asthma Attack Trigger', category: 'Respiratory', icon: '💨',
      score: Math.min(100, (pms25 > 35 ? 40 : pms25 > 12 ? 22 : pms25 > 5 ? 8 : 0) + (pms1 > 20 ? 25 : pms1 > 8 ? 12 : 0) + (smoke > 100 ? 20 : smoke > 50 ? 10 : 0) + (aqi > 150 ? 5 : 0)),
      desc: (s) => s > 50 ? 'PM2.5 and smoke at dangerous levels — high asthma attack probability.' : s > 25 ? 'Fine particles may provoke asthma symptoms.' : 'Low asthma trigger risk.',
      warn: (s) => s > 50 ? ['CARRY RESCUE INHALER', 'Move to clean air if symptoms start'] : s > 25 ? ['Keep inhaler accessible'] : [],
      prot: (s) => s > 50 ? ['N95 mask', 'Stay in filtered/AC space', 'Use rescue bronchodilator'] : s > 25 ? ['Reduce outdoor time', 'Pre-medicate per doctor'] : ['Continue maintenance therapy'],
    },
    {
      id: 'dust_mite', name: 'Dust Mite Allergy', category: 'Allergy', icon: '🧹',
      score: Math.min(100, (hum > 75 ? 45 : hum > 60 ? 25 : hum > 50 ? 10 : 0) + (pms10 > 25 ? 30 : pms10 > 12 ? 15 : 0) + (dust > 35 ? 20 : dust > 12 ? 10 : 0)),
      desc: (s) => s > 50 ? 'High humidity and particles — ideal for dust mite proliferation.' : s > 25 ? 'Moderate dust mite activity likely.' : 'Dust mite allergy risk is low.',
      warn: (s) => s > 50 ? ['Bedding is a high-risk allergen reservoir'] : [],
      prot: (s) => s > 50 ? ['Allergen-proof mattress covers', 'Wash bedding at 60°C', 'Dehumidify to <50%'] : s > 25 ? ['Keep humidity below 60%', 'Damp dust surfaces'] : ['Regular cleaning'],
    },
    {
      id: 'mold_allergy', name: 'Mold & Fungal Allergy', category: 'Allergy', icon: '🍄',
      score: Math.min(100, (hum > 80 ? 50 : hum > 70 ? 30 : hum > 60 ? 10 : 0) + (pms10 > 35 ? 25 : pms10 > 15 ? 12 : 0) + (rain > 50 ? 10 : rain > 20 ? 5 : 0)),
      desc: (s) => s > 50 ? 'High humidity & rain — mold spores at high levels.' : s > 25 ? 'Moderate mold spore activity.' : 'Mold allergy risk is minimal.',
      warn: (s) => s > 50 ? ['Mold likely present in damp areas'] : [],
      prot: (s) => s > 50 ? ['N95 mask if mold visible', 'Dehumidifier', 'Clean AC filters'] : s > 25 ? ['Keep humidity below 55%'] : ['Monitor humidity'],
    },
    {
      id: 'hay_fever', name: 'Hay Fever (Rhinitis)', category: 'Allergy', icon: '🌿',
      score: Math.min(100, (pms10 > 35 ? 35 : pms10 > 15 ? 18 : 0) + (pms25 > 15 ? 20 : pms25 > 8 ? 10 : 0) + (dust > 25 ? 20 : dust > 10 ? 10 : 0) + (hum > 65 ? 10 : 0)),
      desc: (s) => s > 50 ? 'High airborne particle load carrying allergens — sneezing/congestion expected.' : s > 25 ? 'Moderate allergen levels — take antihistamines.' : 'Allergen levels are low.',
      warn: (s) => s > 50 ? ['Avoid outdoor activity during peak pollen (6–10 AM)'] : [],
      prot: (s) => s > 50 ? ['Take antihistamines', 'Wraparound sunglasses outdoors', 'Shower after outdoor exposure'] : s > 25 ? ['Antihistamine standby', 'Reduce outdoor time'] : ['Monitor symptoms'],
    },
    {
      id: 'chemical_exposure', name: 'Chemical Sensitivity', category: 'Environmental', icon: '⚗️',
      score: Math.min(100, (benz > 10 ? 50 : benz > 5 ? 28 : benz > 2 ? 10 : 0) + (nh3 > 50 ? 30 : nh3 > 25 ? 15 : nh3 > 10 ? 5 : 0) + (smoke > 200 ? 20 : smoke > 100 ? 10 : 0)),
      desc: (s) => s > 50 ? 'DANGER: Toxic chemical concentrations. Evacuate immediately.' : s > 25 ? 'Chemical levels above comfort thresholds — harmful on prolonged exposure.' : 'Chemical exposure is within safe limits.',
      warn: (s) => s > 75 ? ['EVACUATE IMMEDIATELY', 'Call emergency if dizziness/vomiting'] : s > 50 ? ['Do not remain in this area', 'Remove source'] : [],
      prot: (s) => s > 75 ? ['Evacuate', 'Call emergency services', 'Fresh air only'] : s > 50 ? ['Leave area', 'Identify and remove source'] : s > 25 ? ['Wear chemical mask', 'Ventilate'] : ['Standard ventilation'],
    },
    {
      id: 'conjunctivitis', name: 'Eye Infection & Conjunctivitis', category: 'Allergy', icon: '👁️',
      score: Math.min(100, (nh3 > 25 ? 35 : nh3 > 10 ? 18 : 0) + (smoke > 100 ? 25 : smoke > 50 ? 12 : 0) + (benz > 5 ? 20 : benz > 2 ? 10 : 0) + (pms10 > 35 ? 15 : pms10 > 15 ? 8 : 0)),
      desc: (s) => s > 50 ? 'Chemical irritants and particles can cause chemical conjunctivitis.' : s > 25 ? 'Mild eye irritation likely from particles/chemicals.' : 'Eye infection risk is low.',
      warn: (s) => s > 50 ? ['Chemical eye injury risk — wear protection'] : [],
      prot: (s) => s > 50 ? ['Sealed safety goggles', 'Rinse eyes with clean water if irritated'] : s > 25 ? ['Sunglasses outdoors', 'Avoid rubbing eyes'] : ['Normal eye care'],
    },
    {
      id: 'dermatitis', name: 'Skin Dermatitis', category: 'Skin', icon: '🩹',
      score: Math.min(100, (benz > 10 ? 45 : benz > 5 ? 25 : benz > 2 ? 8 : 0) + (nh3 > 50 ? 35 : nh3 > 25 ? 18 : nh3 > 10 ? 6 : 0) + (hum > 80 ? 10 : hum < 25 ? 10 : 0)),
      desc: (s) => s > 50 ? 'Benzene and ammonia at levels causing chemical dermatitis.' : s > 25 ? 'Mild chemical irritants — sensitive skin may react.' : 'Skin irritation risk is low.',
      warn: (s) => s > 50 ? ['Exposed skin is at risk'] : [],
      prot: (s) => s > 50 ? ['Cover exposed skin', 'Chemical-resistant gloves', 'Shower after exposure'] : s > 25 ? ['Apply barrier cream', 'Minimize skin exposure'] : ['Normal moisturizing'],
    },
    {
      id: 'legionella', name: 'Waterborne Infection Risk', category: 'Infection', icon: '💧',
      score: Math.min(100, (hum > 85 ? 40 : hum > 70 ? 20 : 0) + (temp > 35 ? 30 : temp > 28 ? 15 : temp > 25 ? 5 : 0) + (rain > 60 ? 20 : rain > 30 ? 10 : 0)),
      desc: (s) => s > 50 ? 'Hot & humid conditions with water — ideal for Legionella bacteria.' : s > 25 ? 'Warm humid conditions may support bacterial growth in stagnant water.' : 'Waterborne infection risk is low.',
      warn: (s) => s > 50 ? ['Flush infrequently used water outlets', 'Check AC condensers'] : [],
      prot: (s) => s > 50 ? ['Flush water systems weekly', 'Maintain water temp >60°C or <20°C', 'Test cooling towers'] : s > 25 ? ['Avoid inhaling water spray', 'Check AC drainage'] : ['Regular water maintenance'],
    },
    {
      id: 'strep', name: 'Bacterial Throat Infection', category: 'Infection', icon: '🧫',
      score: Math.min(100, (pms25 > 25 ? 30 : pms25 > 12 ? 15 : 0) + (pms1 > 15 ? 20 : pms1 > 5 ? 10 : 0) + (hum > 70 ? 20 : 0) + (temp < 15 ? 20 : temp < 20 ? 10 : 0) + (co2 > 1200 ? 15 : co2 > 800 ? 8 : 0)),
      desc: (s) => s > 50 ? 'Fine particles, humidity and poor ventilation — high streptococcal risk.' : s > 25 ? 'Moderate bacterial pathogen risk. Throat infections may increase.' : 'Bacterial respiratory risk is low.',
      warn: (s) => s > 50 ? ['Avoid sharing utensils', 'Sore throat? Test promptly'] : [],
      prot: (s) => s > 50 ? ['Surgical mask in crowds', 'Improve ventilation', 'Seek throat culture if symptomatic'] : s > 25 ? ['Frequent handwashing', 'Avoid face touching'] : ['Normal hygiene'],
    },
    {
      id: 'copd', name: 'COPD Exacerbation', category: 'Respiratory', icon: '🌬️',
      score: Math.min(100, (pms25 > 35 ? 40 : pms25 > 25 ? 28 : pms25 > 12 ? 15 : 0) + (pms1 > 20 ? 25 : pms1 > 10 ? 12 : 0) + (smoke > 150 ? 20 : smoke > 75 ? 10 : 0) + (aqi > 150 ? 5 : 0)),
      desc: (s) => s > 50 ? 'PM2.5/PM1 & smoke at levels that can trigger severe COPD flare-ups.' : s > 25 ? 'Elevated fine particles may worsen COPD symptoms.' : 'COPD exacerbation risk is low.',
      warn: (s) => s > 50 ? ['COPD patients must NOT go outdoors', 'Prepare rescue medications'] : s > 25 ? ['COPD patients limit outdoor exposure'] : [],
      prot: (s) => s > 50 ? ['Stay indoors with air purifier', 'Use prescribed bronchodilators/steroids', 'Emergency contact at hand'] : s > 25 ? ['N95 mask if outing essential', 'Reduce activity level'] : ['Continue maintenance inhalers'],
    },
    {
      id: 'valley_fever', name: 'Soil Fungal Infection', category: 'Infection', icon: '🌾',
      score: Math.min(100, (pms10 > 75 ? 45 : pms10 > 35 ? 25 : pms10 > 15 ? 10 : 0) + (hum < 30 ? 30 : hum < 40 ? 15 : 0) + (dust > 75 ? 20 : dust > 35 ? 10 : 0) + (temp > 35 ? 10 : 0)),
      desc: (s) => s > 50 ? 'Dry, dusty and warm — ideal for Coccidioides spores to go airborne.' : s > 25 ? 'Elevated dust and low humidity increase soil fungal spore risk.' : 'Soil fungal infection risk is low.',
      warn: (s) => s > 50 ? ['Avoid disturbing soil in dry conditions', 'High-dust areas are infection zones'] : [],
      prot: (s) => s > 50 ? ['N95 mask for all outdoor activity', 'Stay indoors during dust storms', 'Dampen soil before digging'] : s > 25 ? ['N95 for outdoor dusty work'] : ['Standard dust precautions'],
    },
    {
      id: 'gastro', name: 'Gastrointestinal Infection', category: 'Infection', icon: '🦠',
      score: Math.min(100, (rain > 70 ? 35 : rain > 40 ? 18 : 0) + (pms10 > 50 ? 25 : pms10 > 25 ? 12 : 0) + (hum > 80 ? 15 : 0) + (temp > 30 ? 10 : 0)),
      desc: (s) => s > 50 ? 'Heavy rain and particles increase risk of food/water contamination.' : s > 25 ? 'Rain and humidity may affect food/water safety.' : 'Gastrointestinal infection risk is low.',
      warn: (s) => s > 50 ? ['Water sources may be contaminated after heavy rain'] : [],
      prot: (s) => s > 50 ? ['Boil/filter drinking water', 'Avoid raw vegetables', 'Thorough food cooking', 'Wash hands before meals'] : s > 25 ? ['Prefer bottled water', 'Wash food thoroughly'] : ['Standard food hygiene'],
    },
    {
      id: 'tb', name: 'TB Transmission Risk', category: 'Infection', icon: '🔬',
      score: Math.min(100, (pms1 > 10 ? 40 : pms1 > 5 ? 20 : 0) + (pms25 > 25 ? 25 : pms25 > 12 ? 12 : 0) + (co2 > 1500 ? 25 : co2 > 1000 ? 12 : 0) + (hum > 80 ? 10 : 0)),
      desc: (s) => s > 50 ? 'Very fine particles and poor ventilation — TB bacteria can persist in air.' : s > 25 ? 'Moderate risk of airborne pathogen persistence.' : 'TB transmission risk is low.',
      warn: (s) => s > 50 ? ['Prolonged crowded indoors is high-risk'] : [],
      prot: (s) => s > 50 ? ['N95/P100 respirator', 'Open windows and cross-ventilate', 'UV-C air purifier recommended'] : s > 25 ? ['N95 mask in closed spaces'] : ['Standard hygiene'],
    },
  ];

  return items.map(item => ({
    id: item.id,
    name: item.name,
    category: item.category,
    riskLevel: rl(item.score),
    color: rc(rl(item.score)),
    icon: item.icon,
    description: item.desc(item.score),
    warnings: item.warn(item.score),
    protections: item.prot(item.score),
  }));
}
