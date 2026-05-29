export type AlertLevel = 'safe' | 'moderate' | 'unhealthy' | 'severe';

export interface SensorConfig {
  id: string;
  label: { en: string; hi: string; pa: string };
  unit: string;
  channel: 1 | 2;
  field: string;
  icon: string;
  thresholds: {
    moderate: number;
    unhealthy: number;
    severe?: number;
    min?: number; // for range-based (pressure/humidity)
    maxModerate?: number;
    maxSafe?: number;
  };
  isRange?: boolean;
  informational?: boolean;
}

export const SENSOR_CONFIGS: SensorConfig[] = [
  {
    id: 'CO2', label: { en: 'CO₂', hi: 'CO₂', pa: 'CO₂' },
    unit: 'ppm', channel: 1, field: 'field1', icon: 'cloud',
    thresholds: { moderate: 1000, unhealthy: 2000, severe: 5000 },
  },
  {
    id: 'Smoke', label: { en: 'Smoke', hi: 'धुआं', pa: 'ਧੂੰਆਂ' },
    unit: 'idx', channel: 1, field: 'field2', icon: 'wind',
    thresholds: { moderate: 50, unhealthy: 150, severe: 300 },
  },
  {
    id: 'NH3', label: { en: 'Ammonia', hi: 'अमोनिया', pa: 'ਅਮੋਨੀਆ' },
    unit: 'ppm', channel: 1, field: 'field3', icon: 'alert-triangle',
    thresholds: { moderate: 25, unhealthy: 50, severe: 100 },
  },
  {
    id: 'Benzene', label: { en: 'Benzene', hi: 'बेंजीन', pa: 'ਬੈਂਜੀਨ' },
    unit: 'ppb', channel: 1, field: 'field4', icon: 'zap',
    thresholds: { moderate: 5, unhealthy: 10, severe: 25 },
  },
  {
    id: 'LPG', label: { en: 'LPG', hi: 'LPG', pa: 'LPG' },
    unit: 'ppm', channel: 1, field: 'field5', icon: 'alert-octagon',
    thresholds: { moderate: 500, unhealthy: 1000, severe: 2000 },
  },
  {
    id: 'Dust', label: { en: 'Dust PM2.5', hi: 'धूल PM2.5', pa: 'ਧੂੜ PM2.5' },
    unit: 'µg/m³', channel: 1, field: 'field6', icon: 'circle',
    thresholds: { moderate: 35, unhealthy: 75, severe: 150 },
  },
  {
    id: 'Rain', label: { en: 'Rain', hi: 'बारिश', pa: 'ਮੀਂਹ' },
    unit: '%', channel: 1, field: 'field7', icon: 'cloud-drizzle',
    thresholds: { moderate: 50, unhealthy: 80 },
    informational: true,
  },
  {
    id: 'Pressure', label: { en: 'Pressure', hi: 'दबाव', pa: 'ਦਬਾਅ' },
    unit: 'hPa', channel: 1, field: 'field8', icon: 'activity',
    thresholds: { moderate: 960, unhealthy: 940, maxModerate: 1040, maxSafe: 1020 },
    isRange: true,
  },
  {
    id: 'Temperature', label: { en: 'Temperature', hi: 'तापमान', pa: 'ਤਾਪਮਾਨ' },
    unit: '°C', channel: 2, field: 'field1', icon: 'thermometer',
    thresholds: { moderate: 35, unhealthy: 40, severe: 45 },
  },
  {
    id: 'Humidity', label: { en: 'Humidity', hi: 'नमी', pa: 'ਨਮੀ' },
    unit: '%', channel: 2, field: 'field2', icon: 'droplet',
    thresholds: { moderate: 70, unhealthy: 85, min: 30, maxSafe: 60, maxModerate: 80 },
    isRange: true,
  },
  {
    id: 'Altitude', label: { en: 'Altitude', hi: 'ऊंचाई', pa: 'ਉਚਾਈ' },
    unit: 'm', channel: 2, field: 'field3', icon: 'map-pin',
    thresholds: { moderate: 2500, unhealthy: 3500 },
    informational: true,
  },
];

export function getLevel(cfg: SensorConfig, value: number): AlertLevel {
  if (cfg.informational) return 'safe';
  if (cfg.isRange) {
    const { moderate: minMod, unhealthy: minUnhealthy, maxSafe = 9999, maxModerate = 9999 } = cfg.thresholds;
    if (value < minUnhealthy || value > (cfg.thresholds.severe ?? maxModerate * 1.1)) return 'severe';
    if (value < minMod || value > maxModerate) return 'unhealthy';
    if (value < (cfg.thresholds.min ?? 0) + 20 || value > maxSafe) return 'moderate';
    return 'safe';
  }
  const { moderate, unhealthy, severe } = cfg.thresholds;
  if (severe && value >= severe) return 'severe';
  if (value >= unhealthy) return 'unhealthy';
  if (value >= moderate) return 'moderate';
  return 'safe';
}

export interface HealthCondition {
  id: string;
  title: { en: string; hi: string; pa: string };
  description: { en: string; hi: string; pa: string };
  recommendation: { en: string; hi: string; pa: string };
  level: AlertLevel;
  triggeredBy: string[];
}

export function generateHealthConditions(
  readings: Record<string, number>
): HealthCondition[] {
  const conditions: HealthCondition[] = [];

  const dust = readings['Dust'] ?? 0;
  const smoke = readings['Smoke'] ?? 0;
  const co2 = readings['CO2'] ?? 0;
  const nh3 = readings['NH3'] ?? 0;
  const benzene = readings['Benzene'] ?? 0;
  const temp = readings['Temperature'] ?? 0;
  const humidity = readings['Humidity'] ?? 0;
  const lpg = readings['LPG'] ?? 0;

  // Dust / allergy
  if (dust > 35) {
    const level: AlertLevel = dust > 150 ? 'severe' : dust > 75 ? 'unhealthy' : 'moderate';
    conditions.push({
      id: 'dust_allergy',
      title: { en: 'Dust Allergy Risk', hi: 'धूल एलर्जी खतरा', pa: 'ਧੂੜ ਐਲਰਜੀ ਖਤਰਾ' },
      description: {
        en: `PM2.5 at ${dust.toFixed(1)} µg/m³ exceeds safe limits. Risk of respiratory irritation, asthma aggravation, and allergic rhinitis.`,
        hi: `PM2.5 ${dust.toFixed(1)} µg/m³ है। श्वसन जलन और एलर्जी का खतरा।`,
        pa: `PM2.5 ${dust.toFixed(1)} µg/m³ ਹੈ। ਸਾਹ ਦੀ ਸਮੱਸਿਆ ਅਤੇ ਐਲਰਜੀ ਦਾ ਖਤਰਾ।`,
      },
      recommendation: {
        en: 'Wear N95 mask. Avoid outdoor exposure. Use air purifier indoors.',
        hi: 'N95 मास्क पहनें। बाहर जाने से बचें। घर में एयर प्यूरीफायर चलाएं।',
        pa: 'N95 ਮਾਸਕ ਪਹਿਨੋ। ਬਾਹਰ ਜਾਣ ਤੋਂ ਬਚੋ। ਘਰ ਵਿੱਚ ਏਅਰ ਪਿਊਰੀਫਾਇਰ ਵਰਤੋ।',
      },
      level,
      triggeredBy: ['Dust'],
    });
  }

  // Smoke / respiratory
  if (smoke > 50) {
    const level: AlertLevel = smoke > 300 ? 'severe' : smoke > 150 ? 'unhealthy' : 'moderate';
    conditions.push({
      id: 'smoke_respiratory',
      title: { en: 'Smoke Exposure Warning', hi: 'धुएं का खतरा', pa: 'ਧੂੰਏ ਦਾ ਖਤਰਾ' },
      description: {
        en: `Smoke index at ${smoke.toFixed(0)}. Bronchitis risk and COPD aggravation. Eye and throat irritation likely.`,
        hi: `धुआं सूचकांक ${smoke.toFixed(0)}। ब्रोंकाइटिस और आंखों में जलन का खतरा।`,
        pa: `ਧੂੰਆਂ ਸੂਚਕਾਂਕ ${smoke.toFixed(0)}। ਸਾਹ ਦੀਆਂ ਸਮੱਸਿਆਵਾਂ ਅਤੇ ਅੱਖਾਂ ਵਿੱਚ ਜਲਣ ਦਾ ਖਤਰਾ।`,
      },
      recommendation: {
        en: 'Stay indoors. Close windows. Seek fresh air if irritation occurs.',
        hi: 'घर के अंदर रहें। खिड़कियां बंद रखें। जलन होने पर ताजी हवा लें।',
        pa: 'ਘਰ ਦੇ ਅੰਦਰ ਰਹੋ। ਖਿੜਕੀਆਂ ਬੰਦ ਰੱਖੋ। ਜੇ ਜਲਣ ਹੋਵੇ ਤਾਂ ਤਾਜ਼ੀ ਹਵਾ ਲਓ।',
      },
      level,
      triggeredBy: ['Smoke'],
    });
  }

  // CO2 / cognitive
  if (co2 > 1000) {
    const level: AlertLevel = co2 > 5000 ? 'severe' : co2 > 2000 ? 'unhealthy' : 'moderate';
    conditions.push({
      id: 'co2_cognitive',
      title: { en: 'CO₂ — Reduced Air Quality', hi: 'CO₂ — वायु गुणवत्ता कम', pa: 'CO₂ — ਹਵਾ ਦੀ ਗੁਣਵੱਤਾ ਘੱਟ' },
      description: {
        en: `CO₂ at ${co2.toFixed(0)} ppm. Risk of headache, dizziness, and cognitive decline. Above 2000 ppm causes fatigue.`,
        hi: `CO₂ ${co2.toFixed(0)} ppm। सिरदर्द, चक्कर और थकान का खतरा।`,
        pa: `CO₂ ${co2.toFixed(0)} ppm। ਸਿਰਦਰਦ, ਚੱਕਰ ਅਤੇ ਥਕਾਵਟ ਦਾ ਖਤਰਾ।`,
      },
      recommendation: {
        en: 'Ventilate the area immediately. Open windows and doors.',
        hi: 'तुरंत कमरे में हवा आने दें। खिड़कियां और दरवाजे खोलें।',
        pa: 'ਤੁਰੰਤ ਕਮਰੇ ਵਿੱਚ ਹਵਾ ਦਿਓ। ਖਿੜਕੀਆਂ ਅਤੇ ਦਰਵਾਜ਼ੇ ਖੋਲ੍ਹੋ।',
      },
      level,
      triggeredBy: ['CO2'],
    });
  }

  // NH3 / ammonia
  if (nh3 > 25) {
    const level: AlertLevel = nh3 > 100 ? 'severe' : nh3 > 50 ? 'unhealthy' : 'moderate';
    conditions.push({
      id: 'nh3_toxic',
      title: { en: 'Ammonia Exposure', hi: 'अमोनिया खतरा', pa: 'ਅਮੋਨੀਆ ਖਤਰਾ' },
      description: {
        en: `Ammonia at ${nh3.toFixed(1)} ppm. Causes respiratory discomfort, eye irritation, and skin irritation.`,
        hi: `अमोनिया ${nh3.toFixed(1)} ppm। सांस की तकलीफ और आंखों में जलन।`,
        pa: `ਅਮੋਨੀਆ ${nh3.toFixed(1)} ppm। ਸਾਹ ਦੀ ਤਕਲੀਫ਼ ਅਤੇ ਅੱਖਾਂ ਵਿੱਚ ਜਲਣ।`,
      },
      recommendation: {
        en: 'Move to fresh air. Avoid area. Seek medical attention if symptomatic.',
        hi: 'ताजी हवा में जाएं। क्षेत्र से दूर रहें।',
        pa: 'ਤਾਜ਼ੀ ਹਵਾ ਵੱਲ ਜਾਓ। ਉਸ ਥਾਂ ਤੋਂ ਦੂਰ ਰਹੋ।',
      },
      level,
      triggeredBy: ['NH3'],
    });
  }

  // Benzene / carcinogen
  if (benzene > 5) {
    const level: AlertLevel = benzene > 25 ? 'severe' : benzene > 10 ? 'unhealthy' : 'moderate';
    conditions.push({
      id: 'benzene_risk',
      title: { en: 'VOC / Benzene Risk', hi: 'बेंजीन जोखिम', pa: 'ਬੈਂਜੀਨ ਜੋਖਮ' },
      description: {
        en: `Benzene at ${benzene.toFixed(1)} ppb. Known carcinogen. Risk of dizziness, headache, and long-term health effects.`,
        hi: `बेंजीन ${benzene.toFixed(1)} ppb। चक्कर और दीर्घकालिक स्वास्थ्य खतरा।`,
        pa: `ਬੈਂਜੀਨ ${benzene.toFixed(1)} ppb। ਚੱਕਰ ਅਤੇ ਲੰਬੇ ਸਮੇਂ ਦੇ ਸਿਹਤ ਖਤਰੇ।`,
      },
      recommendation: {
        en: 'Evacuate area. Identify source. Contact authorities if levels remain high.',
        hi: 'क्षेत्र खाली करें। स्रोत की पहचान करें।',
        pa: 'ਖੇਤਰ ਖਾਲੀ ਕਰੋ। ਸਰੋਤ ਦੀ ਪਛਾਣ ਕਰੋ।',
      },
      level,
      triggeredBy: ['Benzene'],
    });
  }

  // LPG / explosion risk
  if (lpg > 500) {
    const level: AlertLevel = lpg > 2000 ? 'severe' : lpg > 1000 ? 'unhealthy' : 'moderate';
    conditions.push({
      id: 'lpg_explosive',
      title: { en: 'LPG Gas Leak Risk', hi: 'LPG गैस रिसाव', pa: 'LPG ਗੈਸ ਲੀਕ ਖਤਰਾ' },
      description: {
        en: `LPG at ${lpg.toFixed(0)} ppm. Explosion and suffocation risk. Evacuate immediately if above 1000 ppm.`,
        hi: `LPG ${lpg.toFixed(0)} ppm। विस्फोट और दम घुटने का खतरा।`,
        pa: `LPG ${lpg.toFixed(0)} ppm। ਧਮਾਕੇ ਅਤੇ ਦਮ ਘੁੱਟਣ ਦਾ ਖਤਰਾ।`,
      },
      recommendation: {
        en: '🚨 Turn off gas. Open windows. Do NOT use switches or lighters. Evacuate!',
        hi: '🚨 गैस बंद करें। खिड़कियां खोलें। स्विच न चलाएं। बाहर जाएं!',
        pa: '🚨 ਗੈਸ ਬੰਦ ਕਰੋ। ਖਿੜਕੀਆਂ ਖੋਲ੍ਹੋ। ਸਵਿੱਚ ਨਾ ਲਗਾਓ। ਬਾਹਰ ਜਾਓ!',
      },
      level,
      triggeredBy: ['LPG'],
    });
  }

  // High temperature
  if (temp > 35) {
    const level: AlertLevel = temp > 45 ? 'severe' : temp > 40 ? 'unhealthy' : 'moderate';
    conditions.push({
      id: 'heat_risk',
      title: { en: 'Heat Stress Risk', hi: 'गर्मी का खतरा', pa: 'ਗਰਮੀ ਦਾ ਖਤਰਾ' },
      description: {
        en: `Temperature at ${temp.toFixed(1)}°C. Risk of heat exhaustion, dehydration, and cardiovascular stress.`,
        hi: `तापमान ${temp.toFixed(1)}°C। हीट स्ट्रोक और डिहाइड्रेशन का खतरा।`,
        pa: `ਤਾਪਮਾਨ ${temp.toFixed(1)}°C। ਹੀਟ ਸਟ੍ਰੋਕ ਅਤੇ ਡੀਹਾਈਡ੍ਰੇਸ਼ਨ ਦਾ ਖਤਰਾ।`,
      },
      recommendation: {
        en: 'Stay hydrated. Avoid direct sun. Rest in cool environment.',
        hi: 'पानी पीते रहें। सीधी धूप से बचें। ठंडी जगह पर रहें।',
        pa: 'ਪਾਣੀ ਪੀਂਦੇ ਰਹੋ। ਸਿੱਧੀ ਧੁੱਪ ਤੋਂ ਬਚੋ। ਠੰਡੀ ਜਗ੍ਹਾ ਤੇ ਰਹੋ।',
      },
      level,
      triggeredBy: ['Temperature'],
    });
  }

  // Humidity extremes
  if (humidity > 80 || humidity < 30) {
    const level: AlertLevel = humidity > 90 || humidity < 20 ? 'unhealthy' : 'moderate';
    conditions.push({
      id: 'humidity_risk',
      title: {
        en: humidity > 80 ? 'High Humidity Warning' : 'Low Humidity Warning',
        hi: humidity > 80 ? 'उच्च नमी चेतावनी' : 'कम नमी चेतावनी',
        pa: humidity > 80 ? 'ਉੱਚ ਨਮੀ ਚੇਤਾਵਨੀ' : 'ਘੱਟ ਨਮੀ ਚੇਤਾਵਨੀ',
      },
      description: {
        en: `Humidity at ${humidity.toFixed(0)}%. ${humidity > 80 ? 'Promotes mold growth and respiratory issues.' : 'Causes dry skin, throat irritation, and static buildup.'}`,
        hi: `नमी ${humidity.toFixed(0)}%। ${humidity > 80 ? 'फफूंदी और सांस की समस्याएं।' : 'त्वचा और गले में सूखापन।'}`,
        pa: `ਨਮੀ ${humidity.toFixed(0)}%। ${humidity > 80 ? 'ਉੱਲੀ ਅਤੇ ਸਾਹ ਦੀਆਂ ਸਮੱਸਿਆਵਾਂ।' : 'ਚਮੜੀ ਅਤੇ ਗਲੇ ਵਿੱਚ ਖੁਸ਼ਕੀ।'}`,
      },
      recommendation: {
        en: humidity > 80 ? 'Use dehumidifier. Ensure ventilation.' : 'Use humidifier. Drink more water.',
        hi: humidity > 80 ? 'डिह्यूमिडिफायर चलाएं। वेंटिलेशन सुनिश्चित करें।' : 'ह्यूमिडिफायर चलाएं। अधिक पानी पिएं।',
        pa: humidity > 80 ? 'ਡੀਹਿਊਮਿਡੀਫਾਇਰ ਵਰਤੋ। ਹਵਾ ਦਾ ਪ੍ਰਵਾਹ ਯਕੀਨੀ ਕਰੋ।' : 'ਹਿਊਮਿਡੀਫਾਇਰ ਵਰਤੋ। ਵਧੇਰੇ ਪਾਣੀ ਪੀਓ।',
      },
      level,
      triggeredBy: ['Humidity'],
    });
  }

  return conditions;
}

export function getOverallScore(readings: Record<string, number>): number {
  if (Object.keys(readings).length === 0) return 100;
  let score = 100;
  for (const cfg of SENSOR_CONFIGS) {
    if (cfg.informational) continue;
    const val = readings[cfg.id];
    if (val === undefined) continue;
    const lvl = getLevel(cfg, val);
    if (lvl === 'severe') score -= 25;
    else if (lvl === 'unhealthy') score -= 15;
    else if (lvl === 'moderate') score -= 5;
  }
  return Math.max(0, Math.min(100, score));
}
