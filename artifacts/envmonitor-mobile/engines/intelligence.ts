import { calculateAQI, type AQIResult } from './aqi';
import { calculateHealthRisks, type HealthRisk } from './health-risk';
import { calculatePollen, type PollenResult } from './pollen';
import { calculateSafetyScore, type SafetyScoreResult } from './safety-score';
import { assessSensorReliability, SENSOR_BOUNDS, type ReliabilityResult } from './sensor-reliability';
import { calculateInfectionsAllergies, type InfectionRisk } from './infections-allergies';
import type { SensorReadings } from '@/services/thingspeak';
import type { SensorHistory } from '@/context/AppContext';

export interface IntelligenceData {
  aqi: AQIResult;
  healthRisks: HealthRisk[];
  pollen: PollenResult;
  safetyScore: SafetyScoreResult;
  reliability: ReliabilityResult;
  infectionsAllergies: InfectionRisk[];
  overallRiskLevel: 'Low' | 'Moderate' | 'High' | 'Critical';
}

/**
 * Build the flat readings map expected by assessSensorReliability.
 * Keys match SENSOR_BOUNDS (PascalCase on mobile).
 */
function buildReadingsMap(readings: SensorReadings): Record<string, number | null> {
  return {
    CO2: readings.CO2, Smoke: readings.Smoke, NH3: readings.NH3,
    Benzene: readings.Benzene, LPG: readings.LPG, Dust: readings.Dust,
    Rain: readings.Rain, Pressure: readings.Pressure,
    Temperature: readings.Temperature, Humidity: readings.Humidity,
    Altitude: readings.Altitude, PMS1: readings.PMS1,
    PMS25: readings.PMS25, PMS10: readings.PMS10,
  };
}

export function computeIntelligence(
  readings: SensorReadings | null,
  history: SensorHistory = {},
): IntelligenceData {
  if (!readings) {
    const aqi             = calculateAQI({});
    const pollen          = calculatePollen({});
    const safetyScore     = calculateSafetyScore({});
    const healthRisks     = calculateHealthRisks({ aqiScore: 0 });
    const infectionsAllergies = calculateInfectionsAllergies({});
    const reliability     = assessSensorReliability({}, {});
    return { aqi, healthRisks, pollen, safetyScore, reliability, infectionsAllergies, overallRiskLevel: 'Low' };
  }

  const aqi = calculateAQI({
    dust: readings.Dust, co2: readings.CO2, smoke: readings.Smoke,
    nh3: readings.NH3, benzene: readings.Benzene, lpg: readings.LPG,
    pms25: readings.PMS25, pms10: readings.PMS10,
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

  const infectionsAllergies = calculateInfectionsAllergies({
    pms1: readings.PMS1, pms25: readings.PMS25, pms10: readings.PMS10,
    dust: readings.Dust, smoke: readings.Smoke, co2: readings.CO2,
    nh3: readings.NH3, benzene: readings.Benzene,
    temperature: readings.Temperature, humidity: readings.Humidity,
    rain: readings.Rain, aqiScore: aqi.score,
  });

  // Build flat readings map and pass rolling history for full frozen/spike detection
  const readingsMap = buildReadingsMap(readings);
  const reliability = assessSensorReliability(readingsMap, history);

  const criticalCount = healthRisks.filter(r => r.riskLevel === 'Critical').length;
  const highCount     = healthRisks.filter(r => r.riskLevel === 'High').length;
  const critInfect    = infectionsAllergies.filter(r => r.riskLevel === 'Critical').length;
  const highInfect    = infectionsAllergies.filter(r => r.riskLevel === 'High').length;

  let overallRiskLevel: IntelligenceData['overallRiskLevel'] = 'Low';
  if (criticalCount > 0 || critInfect > 0)    overallRiskLevel = 'Critical';
  else if (highCount > 1 || highInfect > 1)    overallRiskLevel = 'High';
  else if (highCount > 0 || highInfect > 0)    overallRiskLevel = 'Moderate';

  return { aqi, healthRisks, pollen, safetyScore, reliability, infectionsAllergies, overallRiskLevel };
}
