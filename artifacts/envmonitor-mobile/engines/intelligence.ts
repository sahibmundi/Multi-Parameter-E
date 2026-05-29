import { calculateAQI, type AQIResult } from './aqi';
import { calculateHealthRisks, type HealthRisk } from './health-risk';
import { calculatePollen, type PollenResult } from './pollen';
import { calculateSafetyScore, type SafetyScoreResult } from './safety-score';
import type { SensorReadings } from '@/services/thingspeak';

export interface IntelligenceData {
  aqi: AQIResult;
  healthRisks: HealthRisk[];
  pollen: PollenResult;
  safetyScore: SafetyScoreResult;
  overallRiskLevel: 'Low' | 'Moderate' | 'High' | 'Critical';
}

export function computeIntelligence(readings: SensorReadings | null): IntelligenceData {
  if (!readings) {
    const aqi  = calculateAQI({});
    const pollen = calculatePollen({});
    const safetyScore = calculateSafetyScore({});
    const healthRisks = calculateHealthRisks({ aqiScore: 0 });
    return { aqi, healthRisks, pollen, safetyScore, overallRiskLevel: 'Low' };
  }

  const aqi = calculateAQI({
    dust: readings.Dust, co2: readings.CO2, smoke: readings.Smoke,
    nh3: readings.NH3, benzene: readings.Benzene, lpg: readings.LPG,
  });

  const pollen = calculatePollen({
    temperature: readings.Temperature, humidity: readings.Humidity,
    rain: readings.Rain, dust: readings.Dust, pressure: readings.Pressure,
  });

  const safetyScore = calculateSafetyScore({
    aqiScore: aqi.score, dust: readings.Dust, co2: readings.CO2,
    smoke: readings.Smoke, nh3: readings.NH3, benzene: readings.Benzene,
    lpg: readings.LPG, temperature: readings.Temperature,
    humidity: readings.Humidity, rain: readings.Rain,
    pollenActivityScore: pollen.activityScore,
  });

  const healthRisks = calculateHealthRisks({
    dust: readings.Dust, smoke: readings.Smoke, co2: readings.CO2,
    nh3: readings.NH3, benzene: readings.Benzene, lpg: readings.LPG,
    temperature: readings.Temperature, humidity: readings.Humidity,
    aqiScore: aqi.score,
  });

  const criticalCount = healthRisks.filter(r => r.riskLevel === 'Critical').length;
  const highCount     = healthRisks.filter(r => r.riskLevel === 'High').length;
  let overallRiskLevel: IntelligenceData['overallRiskLevel'] = 'Low';
  if (criticalCount > 0)  overallRiskLevel = 'Critical';
  else if (highCount > 1) overallRiskLevel = 'High';
  else if (highCount > 0) overallRiskLevel = 'Moderate';

  return { aqi, healthRisks, pollen, safetyScore, overallRiskLevel };
}
