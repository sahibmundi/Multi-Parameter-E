export type RiskLevel = 'Low' | 'Moderate' | 'High' | 'Critical';

export interface HealthRisk {
  id: string;
  condition: string;
  riskLevel: RiskLevel;
  color: string;
  icon: string;
  description: string;
  triggers: string[];
}

export interface HealthRiskInput {
  dust?: number | null;
  smoke?: number | null;
  co2?: number | null;
  nh3?: number | null;
  benzene?: number | null;
  lpg?: number | null;
  temperature?: number | null;
  humidity?: number | null;
  pressure?: number | null;
  rain?: number | null;
  aqiScore?: number;
}

function riskColor(level: RiskLevel): string {
  switch (level) {
    case 'Low':      return '#22c55e';
    case 'Moderate': return '#eab308';
    case 'High':     return '#f97316';
    case 'Critical': return '#ef4444';
  }
}

function riskLevel(score: number): RiskLevel {
  if (score <= 25) return 'Low';
  if (score <= 50) return 'Moderate';
  if (score <= 75) return 'High';
  return 'Critical';
}

export function calculateHealthRisks(input: HealthRiskInput): HealthRisk[] {
  const dust   = input.dust        ?? 0;
  const smoke  = input.smoke       ?? 0;
  const co2    = input.co2         ?? 400;
  const nh3    = input.nh3         ?? 0;
  const benz   = input.benzene     ?? 0;
  const lpg    = input.lpg         ?? 0;
  const temp   = input.temperature ?? 25;
  const hum    = input.humidity    ?? 50;
  const aqi    = input.aqiScore    ?? 0;

  const risks: HealthRisk[] = [];

  // 1. Asthma — triggered by dust + smoke + co2 combo
  {
    const s = Math.min(100,
      (dust  > 75 ? 40 : dust  > 35 ? 20 : dust  > 12 ? 8 : 0) +
      (smoke > 150 ? 35 : smoke > 50 ? 18 : smoke > 20 ? 6 : 0) +
      (co2   > 2000 ? 25 : co2 > 1000 ? 12 : 0)
    );
    const triggers = [];
    if (dust > 12) triggers.push(`Dust ${dust.toFixed(0)} μg/m³`);
    if (smoke > 20) triggers.push(`Smoke ${smoke.toFixed(0)}`);
    if (co2 > 1000) triggers.push(`CO₂ ${co2.toFixed(0)} ppm`);
    risks.push({
      id: 'asthma', condition: 'Asthma', riskLevel: riskLevel(s), color: riskColor(riskLevel(s)),
      icon: 'Wind',
      description: s > 50 ? 'High particle and gas concentrations may trigger asthma attacks.' : s > 25 ? 'Moderate air quality may aggravate asthma.' : 'Low asthma risk under current conditions.',
      triggers,
    });
  }

  // 2. Respiratory Irritation — smoke + NH3 + benzene
  {
    const s = Math.min(100,
      (smoke > 100 ? 35 : smoke > 50 ? 18 : 0) +
      (nh3   > 50  ? 35 : nh3   > 25  ? 18 : 0) +
      (benz  > 10  ? 30 : benz  > 5   ? 15 : 0)
    );
    const triggers = [];
    if (smoke > 50) triggers.push(`Smoke ${smoke.toFixed(0)}`);
    if (nh3 > 25) triggers.push(`NH₃ ${nh3.toFixed(1)} ppm`);
    if (benz > 5) triggers.push(`Benzene ${benz.toFixed(1)} ppb`);
    risks.push({
      id: 'resp_irritation', condition: 'Respiratory Irritation', riskLevel: riskLevel(s), color: riskColor(riskLevel(s)),
      icon: 'CloudFog',
      description: s > 50 ? 'Airway irritants detected at concerning levels. Breathing may be difficult.' : s > 25 ? 'Mild irritants present. Sensitive individuals may experience discomfort.' : 'Respiratory conditions appear normal.',
      triggers,
    });
  }

  // 3. Allergic Rhinitis — dust + humidity high
  {
    const s = Math.min(100,
      (dust  > 35 ? 40 : dust  > 12 ? 20 : 0) +
      (hum   > 80 ? 35 : hum   > 65 ? 15 : 0) +
      (smoke > 50 ? 25 : smoke > 20 ? 10 : 0)
    );
    const triggers = [];
    if (dust > 12) triggers.push(`Dust ${dust.toFixed(0)} μg/m³`);
    if (hum > 65) triggers.push(`Humidity ${hum.toFixed(0)}%`);
    risks.push({
      id: 'allergic_rhinitis', condition: 'Allergic Rhinitis', riskLevel: riskLevel(s), color: riskColor(riskLevel(s)),
      icon: 'Flower2',
      description: s > 50 ? 'Dust and humidity levels may provoke nasal allergy symptoms.' : s > 25 ? 'Moderate allergy risk. Keep antihistamines available.' : 'Allergy risk is currently low.',
      triggers,
    });
  }

  // 4. Bronchitis — sustained smoke + co2
  {
    const s = Math.min(100,
      (smoke > 200 ? 50 : smoke > 100 ? 30 : smoke > 50 ? 12 : 0) +
      (co2   > 2000 ? 35 : co2   > 1000 ? 18 : 0) +
      (dust  > 55  ? 15 : dust  > 35   ? 8  : 0)
    );
    const triggers = [];
    if (smoke > 50) triggers.push(`Smoke ${smoke.toFixed(0)}`);
    if (co2 > 1000) triggers.push(`CO₂ ${co2.toFixed(0)} ppm`);
    risks.push({
      id: 'bronchitis', condition: 'Bronchitis', riskLevel: riskLevel(s), color: riskColor(riskLevel(s)),
      icon: 'Activity',
      description: s > 50 ? 'Smoke and CO₂ levels may inflame bronchial passages.' : s > 25 ? 'Mild bronchitis risk from airborne particles.' : 'Bronchitis risk is low.',
      triggers,
    });
  }

  // 5. Air Pollution Exposure — directly from AQI
  {
    const s = Math.min(100, aqi > 200 ? 100 : aqi > 150 ? 75 : aqi > 100 ? 50 : aqi > 50 ? 25 : 5);
    risks.push({
      id: 'air_pollution', condition: 'Air Pollution Exposure', riskLevel: riskLevel(s), color: riskColor(riskLevel(s)),
      icon: 'Gauge',
      description: s > 75 ? 'Very unhealthy air quality. Limit all outdoor activities.' : s > 50 ? 'Unhealthy air. Sensitive groups should stay indoors.' : s > 25 ? 'Moderate pollution. Outdoor precautions advised.' : 'Air pollution exposure is within safe limits.',
      triggers: [`AQI ${aqi}`],
    });
  }

  // 6. Heat Stress — temp + humidity
  {
    const heatIndex = temp > 27 ? temp + 0.33 * hum - 4 : temp;
    const s = Math.min(100,
      (heatIndex > 54 ? 100 : heatIndex > 40 ? 75 : heatIndex > 32 ? 45 : heatIndex > 27 ? 20 : 0)
    );
    const triggers: string[] = [];
    if (temp > 30) triggers.push(`Temp ${temp.toFixed(1)}°C`);
    if (hum > 60 && temp > 27) triggers.push(`Humidity ${hum.toFixed(0)}%`);
    risks.push({
      id: 'heat_stress', condition: 'Heat Stress', riskLevel: riskLevel(s), color: riskColor(riskLevel(s)),
      icon: 'Thermometer',
      description: s > 75 ? 'Extreme heat stress. Avoid outdoor exertion. Risk of heat stroke.' : s > 50 ? 'High heat load. Hydrate frequently and seek shade.' : s > 25 ? 'Moderate heat stress. Limit strenuous activity.' : 'Heat stress risk is low.',
      triggers,
    });
  }

  // 7. Dehydration — high temp, low humidity or very high humidity
  {
    const s = Math.min(100,
      (temp > 38 ? 55 : temp > 33 ? 35 : temp > 28 ? 15 : 0) +
      (hum < 30 ? 30 : hum < 40 ? 15 : 0) +
      (hum > 80 && temp > 30 ? 20 : 0)
    );
    const triggers: string[] = [];
    if (temp > 28) triggers.push(`Temp ${temp.toFixed(1)}°C`);
    if (hum < 40) triggers.push(`Low humidity ${hum.toFixed(0)}%`);
    risks.push({
      id: 'dehydration', condition: 'Dehydration', riskLevel: riskLevel(s), color: riskColor(riskLevel(s)),
      icon: 'Droplets',
      description: s > 50 ? 'High dehydration risk. Drink water every 15–20 minutes.' : s > 25 ? 'Moderate dehydration risk. Increase fluid intake.' : 'Dehydration risk is normal.',
      triggers,
    });
  }

  // 8. Eye Irritation — smoke + NH3 + benzene
  {
    const s = Math.min(100,
      (smoke > 100 ? 40 : smoke > 50 ? 20 : 0) +
      (nh3   > 25  ? 35 : nh3   > 10  ? 15 : 0) +
      (benz  > 5   ? 25 : benz  > 2   ? 10 : 0)
    );
    const triggers: string[] = [];
    if (smoke > 50) triggers.push(`Smoke ${smoke.toFixed(0)}`);
    if (nh3 > 10) triggers.push(`NH₃ ${nh3.toFixed(1)} ppm`);
    if (benz > 2) triggers.push(`Benzene ${benz.toFixed(1)} ppb`);
    risks.push({
      id: 'eye_irritation', condition: 'Eye Irritation', riskLevel: riskLevel(s), color: riskColor(riskLevel(s)),
      icon: 'Eye',
      description: s > 50 ? 'Chemical concentrations may cause significant eye irritation.' : s > 25 ? 'Mild eye irritation possible. Avoid rubbing eyes.' : 'Eye irritation risk is low.',
      triggers,
    });
  }

  // 9. Skin Irritation — benzene + NH3
  {
    const s = Math.min(100,
      (benz > 10  ? 50 : benz > 5  ? 25 : 0) +
      (nh3  > 50  ? 40 : nh3  > 25 ? 20 : 0) +
      (temp > 38 && hum > 70 ? 20 : 0)
    );
    const triggers: string[] = [];
    if (benz > 5) triggers.push(`Benzene ${benz.toFixed(1)} ppb`);
    if (nh3 > 25) triggers.push(`NH₃ ${nh3.toFixed(1)} ppm`);
    risks.push({
      id: 'skin_irritation', condition: 'Skin Irritation', riskLevel: riskLevel(s), color: riskColor(riskLevel(s)),
      icon: 'PersonStanding',
      description: s > 50 ? 'VOC and chemical exposure may cause dermal irritation.' : s > 25 ? 'Mild skin irritation possible on prolonged exposure.' : 'Skin irritation risk is low.',
      triggers,
    });
  }

  // 10. General Respiratory Discomfort — broad combo
  {
    const s = Math.min(100,
      (co2   > 1000 ? 20 : 0) +
      (dust  > 35   ? 25 : dust > 12 ? 10 : 0) +
      (smoke > 50   ? 25 : smoke > 20 ? 10 : 0) +
      (nh3   > 25   ? 20 : nh3 > 10 ? 8 : 0) +
      (lpg   > 1000 ? 10 : 0)
    );
    const triggers: string[] = [];
    if (co2 > 1000) triggers.push('Elevated CO₂');
    if (dust > 12) triggers.push('Particles');
    if (smoke > 20) triggers.push('Smoke');
    risks.push({
      id: 'resp_discomfort', condition: 'General Respiratory Discomfort', riskLevel: riskLevel(s), color: riskColor(riskLevel(s)),
      icon: 'AlertCircle',
      description: s > 50 ? 'Multiple airway irritants present. Breathing may feel difficult.' : s > 25 ? 'Mild respiratory discomfort possible for sensitive individuals.' : 'Respiratory conditions are comfortable.',
      triggers,
    });
  }

  return risks;
}
