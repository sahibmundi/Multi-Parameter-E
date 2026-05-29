export type RiskLevel = 'Low' | 'Moderate' | 'High' | 'Critical';
export type ProtectionLevel = 'None' | 'Basic' | 'Enhanced' | 'Full';

export interface InfectionAllergyRisk {
  id: string;
  name: string;
  category: 'Infection' | 'Allergy' | 'Respiratory' | 'Skin' | 'Environmental';
  riskLevel: RiskLevel;
  color: string;
  icon: string;
  description: string;
  primaryTriggers: string[];
  warnings: string[];
  protections: string[];
  protectionLevel: ProtectionLevel;
}

export interface InfectionsAllergyInput {
  pms1?:       number | null;
  pms25?:      number | null;
  pms10?:      number | null;
  dust?:       number | null;
  smoke?:      number | null;
  co2?:        number | null;
  nh3?:        number | null;
  benzene?:    number | null;
  lpg?:        number | null;
  temperature?: number | null;
  humidity?:   number | null;
  rain?:       number | null;
  aqiScore?:   number;
}

function level(score: number): RiskLevel {
  if (score < 25) return 'Low';
  if (score < 50) return 'Moderate';
  if (score < 75) return 'High';
  return 'Critical';
}

function levelColor(l: RiskLevel): string {
  return l === 'Low' ? '#22c55e' : l === 'Moderate' ? '#eab308' : l === 'High' ? '#f97316' : '#ef4444';
}

function protectionLevel(l: RiskLevel): ProtectionLevel {
  return l === 'Low' ? 'None' : l === 'Moderate' ? 'Basic' : l === 'High' ? 'Enhanced' : 'Full';
}

export function calculateInfectionsAllergies(input: InfectionsAllergyInput): InfectionAllergyRisk[] {
  const pms1  = input.pms1        ?? input.dust ?? 0;
  const pms25 = input.pms25       ?? input.dust ?? 0;
  const pms10 = input.pms10       ?? input.dust ?? 0;
  const dust  = input.dust        ?? pms10 ?? 0;
  const smoke = input.smoke       ?? 0;
  const co2   = input.co2         ?? 400;
  const nh3   = input.nh3         ?? 0;
  const benz  = input.benzene     ?? 0;
  const temp  = input.temperature ?? 22;
  const hum   = input.humidity    ?? 50;
  const rain  = input.rain        ?? 0;
  const aqi   = input.aqiScore    ?? 0;

  const risks: InfectionAllergyRisk[] = [];

  // 1. Viral Respiratory Infection (COVID-19 / Influenza-like)
  {
    const s = Math.min(100,
      (pms25 > 35 ? 35 : pms25 > 12 ? 18 : pms25 > 5 ? 8 : 0) +
      (pms1  > 15 ? 25 : pms1  > 5  ? 12 : 0) +
      (co2   > 1000 ? 20 : co2 > 800 ? 10 : 0) +
      (hum   > 70 ? 10 : hum < 30 ? 8 : 0) +
      (temp  > 30 ? 5 : 0));
    const rl = level(s);
    risks.push({
      id: 'viral_resp', name: 'Viral Respiratory Infection', category: 'Infection',
      riskLevel: rl, color: levelColor(rl), icon: '🦠', protectionLevel: protectionLevel(rl),
      description: s > 50 ? 'High fine-particle and CO₂ levels create ideal aerosol transmission conditions for airborne viruses.' : s > 25 ? 'Moderate aerosol risk. Enclosed spaces with poor ventilation elevate viral transmission.' : 'Low viral transmission risk under current conditions.',
      primaryTriggers: [
        ...(pms25 > 12 ? [`PM2.5: ${pms25.toFixed(0)} μg/m³`] : []),
        ...(co2 > 800  ? [`CO₂: ${co2.toFixed(0)} ppm`]        : []),
        ...(hum > 70   ? [`Humidity: ${hum.toFixed(0)}%`]       : []),
      ],
      warnings: s > 50 ? ['Crowded indoor spaces — high transmission risk', 'Poor air circulation detected'] : s > 25 ? ['Improve room ventilation', 'Avoid prolonged indoor crowding'] : [],
      protections: s > 50 ? ['Wear N95/FFP2 mask indoors', 'Open windows immediately', 'Limit time in enclosed spaces', 'Sanitize frequently touched surfaces'] : s > 25 ? ['Wear surgical mask in crowds', 'Ventilate rooms regularly', 'Wash hands frequently'] : ['Maintain good hand hygiene'],
    });
  }

  // 2. Pneumonia / Bronchopneumonia
  {
    const s = Math.min(100,
      (pms10 > 50 ? 35 : pms10 > 25 ? 18 : 0) +
      (pms25 > 25 ? 30 : pms25 > 12 ? 15 : 0) +
      (smoke > 100 ? 20 : smoke > 50 ? 10 : 0) +
      (temp < 10   ? 10 : temp > 38 ? 5 : 0) +
      (co2  > 1500 ? 10 : 0));
    const rl = level(s);
    risks.push({
      id: 'pneumonia', name: 'Pneumonia / Bronchopneumonia', category: 'Infection',
      riskLevel: rl, color: levelColor(rl), icon: '🫁', protectionLevel: protectionLevel(rl),
      description: s > 50 ? 'Coarse and fine particle overload combined with smoke is severely straining respiratory defenses.' : s > 25 ? 'Elevated particles and smoke may weaken lung immunity, increasing pneumonia risk.' : 'Pneumonia risk is low under current air conditions.',
      primaryTriggers: [
        ...(pms10 > 25 ? [`PM10: ${pms10.toFixed(0)} μg/m³`] : []),
        ...(pms25 > 12 ? [`PM2.5: ${pms25.toFixed(0)} μg/m³`] : []),
        ...(smoke > 50 ? [`Smoke: ${smoke.toFixed(0)}`] : []),
      ],
      warnings: s > 50 ? ['Risk of severe lower respiratory infection', 'Vulnerable groups (elderly/children) should stay indoors'] : s > 25 ? ['Avoid outdoor exercise', 'High-risk individuals wear mask'] : [],
      protections: s > 50 ? ['N95 mask mandatory', 'Keep windows closed — air purifier on', 'Seek medical advice if breathing difficulty'] : s > 25 ? ['Wear surgical mask outdoors', 'Avoid smoky environments'] : ['Normal precautions sufficient'],
    });
  }

  // 3. Tuberculosis Risk
  {
    const s = Math.min(100,
      (pms1  > 10 ? 40 : pms1  > 5 ? 20 : 0) +
      (pms25 > 25 ? 25 : pms25 > 12 ? 12 : 0) +
      (co2   > 1500 ? 25 : co2  > 1000 ? 12 : 0) +
      (hum   > 80   ? 10 : 0));
    const rl = level(s);
    risks.push({
      id: 'tuberculosis', name: 'Tuberculosis Transmission Risk', category: 'Infection',
      riskLevel: rl, color: levelColor(rl), icon: '🔬', protectionLevel: protectionLevel(rl),
      description: s > 50 ? 'Very fine particles (PM1.0) and poor ventilation (high CO₂) indicate conditions where TB bacteria can persist in air.' : s > 25 ? 'Moderate risk of airborne pathogen persistence due to fine particles and limited airflow.' : 'TB transmission risk is low.',
      primaryTriggers: [
        ...(pms1 > 5    ? [`PM1.0: ${pms1.toFixed(0)} μg/m³ (fine droplets)`] : []),
        ...(co2  > 1000 ? [`CO₂: ${co2.toFixed(0)} ppm (poor ventilation)`]   : []),
      ],
      warnings: s > 50 ? ['Prolonged indoor crowding is high-risk', 'Air not circulating — pathogen accumulation'] : [],
      protections: s > 50 ? ['N95/P100 respirator required', 'Open windows and cross-ventilate', 'UV-C air purifier recommended'] : s > 25 ? ['N95 mask in closed spaces', 'Increase air changes per hour'] : ['Standard hygiene measures'],
    });
  }

  // 4. Dust Mite Allergy
  {
    const s = Math.min(100,
      (hum   > 75 ? 45 : hum > 60 ? 25 : hum > 50 ? 10 : 0) +
      (pms10 > 25 ? 30 : pms10 > 12 ? 15 : 0) +
      (dust  > 35 ? 20 : dust > 12 ? 10 : 0) +
      (temp  > 25 && hum > 60 ? 10 : 0));
    const rl = level(s);
    risks.push({
      id: 'dust_mite', name: 'Dust Mite Allergy', category: 'Allergy',
      riskLevel: rl, color: levelColor(rl), icon: '🧹', protectionLevel: protectionLevel(rl),
      description: s > 50 ? 'High humidity and particulate levels are ideal for dust mite proliferation — major allergy trigger.' : s > 25 ? 'Moderate dust mite activity. Allergy sufferers may experience symptoms.' : 'Dust mite allergy risk is low.',
      primaryTriggers: [
        ...(hum   > 60 ? [`Humidity: ${hum.toFixed(0)}%`]   : []),
        ...(pms10 > 12 ? [`PM10: ${pms10.toFixed(0)} μg/m³`] : []),
      ],
      warnings: s > 50 ? ['Bedding and carpets are high-risk allergen reservoirs'] : [],
      protections: s > 50 ? ['Use allergen-proof mattress/pillow covers', 'Wash bedding at 60°C', 'Dehumidify to below 50%', 'HEPA vacuum carpets'] : s > 25 ? ['Keep humidity below 60%', 'Regular dusting with damp cloth'] : ['Regular cleaning'],
    });
  }

  // 5. Mold & Fungal Allergy
  {
    const s = Math.min(100,
      (hum   > 80 ? 50 : hum > 70 ? 30 : hum > 60 ? 10 : 0) +
      (pms10 > 35 ? 25 : pms10 > 15 ? 12 : 0) +
      (pms25 > 25 ? 15 : pms25 > 12 ? 8 : 0) +
      (temp  > 22 && hum > 65 ? 10 : 0) +
      (rain  > 50 ? 10 : rain > 20 ? 5 : 0));
    const rl = level(s);
    risks.push({
      id: 'mold_allergy', name: 'Mold & Fungal Allergy', category: 'Allergy',
      riskLevel: rl, color: levelColor(rl), icon: '🍄', protectionLevel: protectionLevel(rl),
      description: s > 50 ? 'High humidity and rain promote mold growth. Fungal spores in air can trigger severe allergic reactions.' : s > 25 ? 'Moderate mold spore activity likely. Allergy sufferers should take precautions.' : 'Mold allergy risk is minimal.',
      primaryTriggers: [
        ...(hum  > 70 ? [`Humidity: ${hum.toFixed(0)}%`]    : []),
        ...(rain > 20 ? [`Rain: ${rain.toFixed(0)}%`]        : []),
        ...(pms10 > 15 ? [`PM10: ${pms10.toFixed(0)} μg/m³`] : []),
      ],
      warnings: s > 50 ? ['Mold may be growing on walls/ceilings', 'Check damp areas: bathrooms, basements, AC units'] : [],
      protections: s > 50 ? ['N95 mask indoors if mold is visible', 'Use dehumidifier', 'Inspect and clean AC filters', 'Fix water leaks immediately'] : s > 25 ? ['Keep indoor humidity below 55%', 'Ventilate kitchen/bathroom'] : ['Monitor humidity'],
    });
  }

  // 6. Seasonal Allergic Rhinitis (Hay Fever)
  {
    const s = Math.min(100,
      (pms10 > 35 ? 35 : pms10 > 15 ? 18 : 0) +
      (pms25 > 15 ? 20 : pms25 > 8 ? 10 : 0) +
      (dust  > 25 ? 20 : dust > 10 ? 10 : 0) +
      (hum   > 65 ? 10 : 0) +
      (temp > 18 && temp < 28 ? 5 : 0));
    const rl = level(s);
    risks.push({
      id: 'hay_fever', name: 'Seasonal Allergic Rhinitis', category: 'Allergy',
      riskLevel: rl, color: levelColor(rl), icon: '🌿', protectionLevel: protectionLevel(rl),
      description: s > 50 ? 'High airborne particle load is carrying significant allergen content — expect sneezing, nasal congestion, and itching.' : s > 25 ? 'Moderate pollen and particle levels. Hay fever sufferers should take antihistamines.' : 'Allergen levels are low.',
      primaryTriggers: [
        ...(pms10 > 15 ? [`PM10: ${pms10.toFixed(0)} μg/m³ (allergen carrier)`] : []),
        ...(dust  > 10  ? [`Dust: ${dust.toFixed(0)} μg/m³`]  : []),
      ],
      warnings: s > 50 ? ['Avoid outdoor activities during peak pollen hours (6–10 AM)'] : [],
      protections: s > 50 ? ['Take prescribed antihistamines', 'Wear wraparound sunglasses outdoors', 'Shower after outdoor exposure', 'Keep windows closed during peak hours'] : s > 25 ? ['Antihistamine standby', 'Reduce outdoor time'] : ['Monitor symptoms'],
    });
  }

  // 7. Asthma Attack Trigger
  {
    const s = Math.min(100,
      (pms25 > 35 ? 40 : pms25 > 12 ? 22 : pms25 > 5 ? 8 : 0) +
      (pms1  > 20 ? 25 : pms1  > 8  ? 12 : 0) +
      (smoke > 100 ? 20 : smoke > 50 ? 10 : 0) +
      (co2   > 1000 ? 10 : 0) +
      (aqi   > 150  ? 5  : 0));
    const rl = level(s);
    risks.push({
      id: 'asthma_trigger', name: 'Asthma Attack Trigger', category: 'Respiratory',
      riskLevel: rl, color: levelColor(rl), icon: '💨', protectionLevel: protectionLevel(rl),
      description: s > 50 ? 'PM2.5 and smoke at dangerous levels — high probability of triggering acute asthma attacks.' : s > 25 ? 'Elevated fine particles may provoke mild to moderate asthma symptoms.' : 'Asthma trigger risk is low.',
      primaryTriggers: [
        ...(pms25 > 12 ? [`PM2.5: ${pms25.toFixed(0)} μg/m³`] : []),
        ...(pms1  > 8  ? [`PM1.0: ${pms1.toFixed(0)} μg/m³`]  : []),
        ...(smoke > 50  ? [`Smoke: ${smoke.toFixed(0)}`]        : []),
      ],
      warnings: s > 50 ? ['CARRY RESCUE INHALER', 'Move to clean air immediately if symptoms start'] : s > 25 ? ['Avoid outdoor exercise', 'Keep inhaler accessible'] : [],
      protections: s > 50 ? ['Use rescue bronchodilator as prescribed', 'N95 mask if going outside', 'Stay in air-conditioned/filtered space', 'Call doctor if symptoms worsen'] : s > 25 ? ['Reduce outdoor time', 'Pre-medicate per doctor advice'] : ['Continue maintenance therapy'],
    });
  }

  // 8. Chemical Sensitivity / Toxic Exposure
  {
    const s = Math.min(100,
      (benz > 10 ? 50 : benz > 5 ? 28 : benz > 2 ? 10 : 0) +
      (nh3  > 50 ? 30 : nh3  > 25 ? 15 : nh3 > 10 ? 5 : 0) +
      (smoke> 200 ? 20 : smoke > 100 ? 10 : 0));
    const rl = level(s);
    risks.push({
      id: 'chemical_exposure', name: 'Chemical Sensitivity & Toxic Exposure', category: 'Environmental',
      riskLevel: rl, color: levelColor(rl), icon: '⚗️', protectionLevel: protectionLevel(rl),
      description: s > 50 ? 'DANGER: Benzene and/or ammonia at toxic concentrations. Immediate evacuation recommended.' : s > 25 ? 'VOC and chemical levels above comfort thresholds. Prolonged exposure is harmful.' : 'Chemical exposure risk is within safe limits.',
      primaryTriggers: [
        ...(benz > 2  ? [`Benzene: ${benz.toFixed(1)} ppb`]   : []),
        ...(nh3  > 10 ? [`NH₃: ${nh3.toFixed(1)} ppm`]        : []),
        ...(smoke> 100 ? [`Smoke: ${smoke.toFixed(0)}`]        : []),
      ],
      warnings: s > 75 ? ['EVACUATE AREA IMMEDIATELY', 'Contact emergency services if dizziness/vomiting'] : s > 50 ? ['Do not remain in this area', 'Shut off potential sources (gas, cleaning agents)'] : [],
      protections: s > 75 ? ['Evacuate immediately', 'Call emergency services', 'Fresh air only', 'DO NOT re-enter until cleared'] : s > 50 ? ['Leave area and ventilate', 'Identify and remove source', 'Seek medical attention'] : s > 25 ? ['Wear chemical-grade mask', 'Increase ventilation'] : ['Standard ventilation'],
    });
  }

  // 9. Conjunctivitis (Eye Infection/Allergy)
  {
    const s = Math.min(100,
      (nh3  > 25 ? 35 : nh3  > 10 ? 18 : 0) +
      (smoke> 100 ? 25 : smoke > 50 ? 12 : 0) +
      (benz > 5  ? 20 : benz > 2  ? 10 : 0) +
      (pms10> 35  ? 15 : pms10 > 15 ? 8 : 0) +
      (hum  > 80 ? 10 : 0));
    const rl = level(s);
    risks.push({
      id: 'conjunctivitis', name: 'Eye Infection & Conjunctivitis', category: 'Allergy',
      riskLevel: rl, color: levelColor(rl), icon: '👁️', protectionLevel: protectionLevel(rl),
      description: s > 50 ? 'Chemical irritants and particles at levels that can cause chemical conjunctivitis and eye inflammation.' : s > 25 ? 'Mild to moderate eye irritation likely from airborne particles and chemicals.' : 'Eye infection risk is low.',
      primaryTriggers: [
        ...(nh3  > 10 ? [`NH₃: ${nh3.toFixed(1)} ppm`]        : []),
        ...(smoke> 50  ? [`Smoke: ${smoke.toFixed(0)}`]         : []),
        ...(pms10 > 15 ? [`PM10: ${pms10.toFixed(0)} μg/m³`]   : []),
      ],
      warnings: s > 50 ? ['Chemical eye injury risk — wear eye protection'] : s > 25 ? ['Avoid rubbing eyes outdoors'] : [],
      protections: s > 50 ? ['Wear sealed safety goggles', 'Rinse eyes with clean water if irritated', 'Consult ophthalmologist if redness persists'] : s > 25 ? ['Sunglasses or safety glasses outdoors', 'Artificial tears standby'] : ['Normal eye care'],
    });
  }

  // 10. Skin Dermatitis & Irritation
  {
    const s = Math.min(100,
      (benz > 10 ? 45 : benz > 5 ? 25 : benz > 2 ? 8 : 0) +
      (nh3  > 50 ? 35 : nh3  > 25 ? 18 : nh3 > 10 ? 6 : 0) +
      (hum  > 80 ? 10 : hum < 25 ? 10 : 0) +
      (pms10> 75  ? 10 : 0));
    const rl = level(s);
    risks.push({
      id: 'dermatitis', name: 'Skin Dermatitis & Irritation', category: 'Skin',
      riskLevel: rl, color: levelColor(rl), icon: '🩹', protectionLevel: protectionLevel(rl),
      description: s > 50 ? 'Benzene and ammonia at levels that cause direct skin damage and chemical dermatitis on prolonged contact.' : s > 25 ? 'Mild chemical irritants present. Sensitive skin may react to prolonged exposure.' : 'Skin irritation risk is low.',
      primaryTriggers: [
        ...(benz > 2  ? [`Benzene: ${benz.toFixed(1)} ppb`]    : []),
        ...(nh3  > 10 ? [`NH₃: ${nh3.toFixed(1)} ppm`]         : []),
      ],
      warnings: s > 50 ? ['Exposed skin is at risk of chemical irritation'] : [],
      protections: s > 50 ? ['Cover exposed skin', 'Wear chemical-resistant gloves', 'Apply barrier cream', 'Shower after exposure'] : s > 25 ? ['Apply moisturizer', 'Minimize skin exposure time'] : ['Normal moisturizing'],
    });
  }

  // 11. Legionella / Waterborne Infection
  {
    const s = Math.min(100,
      (hum  > 85 ? 40 : hum > 70 ? 20 : 0) +
      (temp > 35 ? 30 : temp > 28 ? 15 : temp > 25 ? 5 : 0) +
      (rain > 60 ? 20 : rain > 30 ? 10 : 0) +
      (pms10> 25 ? 10 : 0));
    const rl = level(s);
    risks.push({
      id: 'legionella', name: 'Legionella & Waterborne Infection', category: 'Infection',
      riskLevel: rl, color: levelColor(rl), icon: '💧', protectionLevel: protectionLevel(rl),
      description: s > 50 ? 'Hot and humid conditions with water presence are ideal for Legionella bacteria in water systems.' : s > 25 ? 'Warm humid conditions may support Legionella growth in stagnant water.' : 'Legionella risk is low under current conditions.',
      primaryTriggers: [
        ...(hum  > 70 ? [`Humidity: ${hum.toFixed(0)}%`]       : []),
        ...(temp > 25 ? [`Temp: ${temp.toFixed(1)}°C`]          : []),
        ...(rain > 30  ? [`Rain: ${rain.toFixed(0)}%`]          : []),
      ],
      warnings: s > 50 ? ['Check and flush infrequently used water outlets', 'Cool towers and AC condensers are high risk'] : [],
      protections: s > 50 ? ['Flush water systems weekly', 'Maintain water temp >60°C or <20°C', 'Test water cooling systems', 'Seek medical help for fever + cough + pneumonia signs'] : s > 25 ? ['Avoid inhaling water spray', 'Check AC condensate drainage'] : ['Regular water system maintenance'],
    });
  }

  // 12. Gastrointestinal Infection
  {
    const s = Math.min(100,
      (rain  > 70 ? 35 : rain  > 40 ? 18 : 0) +
      (pms10 > 50 ? 25 : pms10 > 25 ? 12 : 0) +
      (hum   > 80 ? 15 : 0) +
      (temp  > 30 ? 10 : 0) +
      (co2   > 1500 ? 10 : 0));
    const rl = level(s);
    risks.push({
      id: 'gastro', name: 'Gastrointestinal Infection Risk', category: 'Infection',
      riskLevel: rl, color: levelColor(rl), icon: '🦠', protectionLevel: protectionLevel(rl),
      description: s > 50 ? 'Heavy rain and high particulate load increase risk of fecal contamination in water and food.' : s > 25 ? 'Rain and humidity may affect water and food safety. Practice elevated hygiene.' : 'Gastrointestinal infection risk is low.',
      primaryTriggers: [
        ...(rain  > 40 ? [`Rain: ${rain.toFixed(0)}%`]          : []),
        ...(pms10 > 25 ? [`PM10: ${pms10.toFixed(0)} μg/m³`]    : []),
        ...(hum   > 80 ? [`Humidity: ${hum.toFixed(0)}%`]        : []),
      ],
      warnings: s > 50 ? ['Water sources may be contaminated after heavy rainfall', 'Street food risk elevated'] : [],
      protections: s > 50 ? ['Boil or filter drinking water', 'Avoid raw vegetables washed with tap water', 'Thorough food cooking', 'Handwashing with soap before meals'] : s > 25 ? ['Prefer bottled/boiled water', 'Wash food thoroughly'] : ['Standard food hygiene'],
    });
  }

  // 13. Valley Fever / Soil Fungal Infection
  {
    const s = Math.min(100,
      (pms10 > 75 ? 45 : pms10 > 35 ? 25 : pms10 > 15 ? 10 : 0) +
      (hum   < 30 ? 30 : hum < 40 ? 15 : 0) +
      (dust  > 75 ? 20 : dust > 35 ? 10 : 0) +
      (temp  > 35 ? 10 : 0));
    const rl = level(s);
    risks.push({
      id: 'valley_fever', name: 'Soil Fungal Infection (Valley Fever)', category: 'Infection',
      riskLevel: rl, color: levelColor(rl), icon: '🌾', protectionLevel: protectionLevel(rl),
      description: s > 50 ? 'Dry, dusty and warm conditions are ideal for Coccidioides fungal spores to become airborne.' : s > 25 ? 'Elevated dust and low humidity increase risk of inhaling soil-borne fungal spores.' : 'Soil fungal infection risk is low.',
      primaryTriggers: [
        ...(pms10 > 15 ? [`PM10: ${pms10.toFixed(0)} μg/m³ (coarse dust)`]  : []),
        ...(hum   < 40 ? [`Low humidity: ${hum.toFixed(0)}%`]                : []),
        ...(dust  > 35 ? [`Dust: ${dust.toFixed(0)} μg/m³`]                  : []),
      ],
      warnings: s > 50 ? ['Avoid disturbing soil or digging in dry conditions', 'High-dust areas are infection zones'] : [],
      protections: s > 50 ? ['N95 mask for all outdoor activity', 'Stay indoors during dust storms', 'Dampen soil before digging', 'Seek medical attention for persistent flu-like illness'] : s > 25 ? ['N95 during outdoor dusty work', 'Wet mop rather than sweep'] : ['Standard dust precautions'],
    });
  }

  // 14. Streptococcal / Bacterial Upper Respiratory
  {
    const s = Math.min(100,
      (pms25 > 25 ? 30 : pms25 > 12 ? 15 : 0) +
      (pms1  > 15 ? 20 : pms1  > 5  ? 10 : 0) +
      (hum   > 70 ? 20 : 0) +
      (temp  < 15 ? 20 : temp < 20 ? 10 : 0) +
      (co2   > 1200 ? 15 : co2 > 800 ? 8 : 0));
    const rl = level(s);
    risks.push({
      id: 'strep', name: 'Streptococcal / Bacterial Respiratory', category: 'Infection',
      riskLevel: rl, color: levelColor(rl), icon: '🧫', protectionLevel: protectionLevel(rl),
      description: s > 50 ? 'Fine particles, humidity and poor ventilation create high-risk conditions for streptococcal respiratory infections.' : s > 25 ? 'Moderate bacterial pathogen risk. Throat infections may increase in these conditions.' : 'Bacterial respiratory infection risk is low.',
      primaryTriggers: [
        ...(pms25  > 12 ? [`PM2.5: ${pms25.toFixed(0)} μg/m³`]  : []),
        ...(co2    > 800 ? [`CO₂: ${co2.toFixed(0)} ppm`]         : []),
        ...(hum    > 70  ? [`Humidity: ${hum.toFixed(0)}%`]        : []),
      ],
      warnings: s > 50 ? ['Avoid sharing utensils/drinks', 'Sore throat? Test and treat promptly'] : [],
      protections: s > 50 ? ['Surgical mask in indoor crowds', 'Improve ventilation', 'Throat lozenges or gargle with salt water', 'Seek throat culture if symptoms develop'] : s > 25 ? ['Frequent handwashing', 'Avoid face touching'] : ['Normal hygiene'],
    });
  }

  // 15. COPD Exacerbation Risk
  {
    const s = Math.min(100,
      (pms25 > 35 ? 40 : pms25 > 25 ? 28 : pms25 > 12 ? 15 : 0) +
      (pms1  > 20 ? 25 : pms1  > 10 ? 12 : 0) +
      (smoke > 150 ? 20 : smoke > 75 ? 10 : 0) +
      (co2   > 1000 ? 10 : 0) +
      (aqi   > 150  ? 5 : 0));
    const rl = level(s);
    risks.push({
      id: 'copd', name: 'COPD Exacerbation Risk', category: 'Respiratory',
      riskLevel: rl, color: levelColor(rl), icon: '🌬️', protectionLevel: protectionLevel(rl),
      description: s > 50 ? 'PM2.5, PM1.0 and smoke are at levels that can trigger severe COPD flare-ups requiring hospitalization.' : s > 25 ? 'Elevated fine particles may worsen chronic obstructive pulmonary disease symptoms.' : 'COPD exacerbation risk is low.',
      primaryTriggers: [
        ...(pms25 > 12 ? [`PM2.5: ${pms25.toFixed(0)} μg/m³`] : []),
        ...(pms1  > 10 ? [`PM1.0: ${pms1.toFixed(0)} μg/m³`]  : []),
        ...(smoke > 75  ? [`Smoke: ${smoke.toFixed(0)}`]        : []),
      ],
      warnings: s > 50 ? ['COPD patients should NOT go outdoors', 'Prepare rescue medications', 'Hospitalization may be needed'] : s > 25 ? ['COPD patients limit outdoor exposure'] : [],
      protections: s > 50 ? ['Stay indoors with air purifier', 'Use prescribed bronchodilators and steroids', 'Emergency contact at hand', 'Oxygen therapy if available'] : s > 25 ? ['Reduce activity level', 'N95 mask if outing essential'] : ['Continue maintenance inhalers'],
    });
  }

  return risks;
}
