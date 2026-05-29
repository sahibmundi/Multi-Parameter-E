import { useMemo } from 'react';
import { calculateAQI, type AQIResult, type AQIInput } from '@/lib/engines/aqi';
import { calculateHealthRisks, type HealthRisk, type HealthRiskInput } from '@/lib/engines/health-risk';
import { calculatePollen, type PollenResult, type PollenInput } from '@/lib/engines/pollen';
import { calculateSafetyScore, type SafetyScoreResult, type SafetyScoreInput } from '@/lib/engines/safety-score';
import { assessSensorReliability, SENSOR_BOUNDS, type ReliabilityResult, type ReliabilityInput } from '@/lib/engines/sensor-reliability';

interface SensorValues {
  co2?: number | null;
  smoke?: number | null;
  nh3?: number | null;
  benzene?: number | null;
  lpg?: number | null;
  dust?: number | null;
  rain?: number | null;
  pressure?: number | null;
  temperature?: number | null;
  humidity?: number | null;
  altitude?: number | null;
}

interface HistoricalValues {
  [sensorId: string]: { value: number; timestamp: string }[];
}

export interface IntelligenceData {
  aqi: AQIResult;
  healthRisks: HealthRisk[];
  pollen: PollenResult;
  safetyScore: SafetyScoreResult;
  reliability: ReliabilityResult;
  overallRiskLevel: 'Low' | 'Moderate' | 'High' | 'Critical';
}

export function useIntelligence(
  latest: SensorValues,
  historical: HistoricalValues,
): IntelligenceData {
  return useMemo(() => {
    const aqiInput: AQIInput = {
      dust: latest.dust, co2: latest.co2,
      smoke: latest.smoke, nh3: latest.nh3,
      benzene: latest.benzene, lpg: latest.lpg,
    };
    const aqi = calculateAQI(aqiInput);

    const pollenInput: PollenInput = {
      temperature: latest.temperature, humidity: latest.humidity,
      rain: latest.rain, dust: latest.dust, pressure: latest.pressure,
    };
    const pollen = calculatePollen(pollenInput);

    const safetyInput: SafetyScoreInput = {
      aqiScore: aqi.score, dust: latest.dust, co2: latest.co2,
      smoke: latest.smoke, nh3: latest.nh3, benzene: latest.benzene,
      lpg: latest.lpg, temperature: latest.temperature,
      humidity: latest.humidity, rain: latest.rain,
      pollenScore: 100 - pollen.outdoorSafetyScore,
    };
    const safetyScore = calculateSafetyScore(safetyInput);

    const healthInput: HealthRiskInput = {
      dust: latest.dust, smoke: latest.smoke, co2: latest.co2,
      nh3: latest.nh3, benzene: latest.benzene, lpg: latest.lpg,
      temperature: latest.temperature, humidity: latest.humidity,
      pressure: latest.pressure, rain: latest.rain,
      aqiScore: aqi.score,
    };
    const healthRisks = calculateHealthRisks(healthInput);

    const reliabilityInputs: ReliabilityInput[] = Object.entries(SENSOR_BOUNDS).map(([id, bounds]) => ({
      id,
      name: bounds.name,
      unit: '',
      currentValue: (latest as Record<string, number | null | undefined>)[id],
      history: historical[id] ?? [],
      physicalMin: bounds.min,
      physicalMax: bounds.max,
    }));
    const reliability = assessSensorReliability(reliabilityInputs);

    // Derive overall risk level from health risks
    const criticalCount = healthRisks.filter(r => r.riskLevel === 'Critical').length;
    const highCount     = healthRisks.filter(r => r.riskLevel === 'High').length;
    let overallRiskLevel: IntelligenceData['overallRiskLevel'] = 'Low';
    if (criticalCount > 0)       overallRiskLevel = 'Critical';
    else if (highCount > 1)      overallRiskLevel = 'High';
    else if (highCount > 0)      overallRiskLevel = 'Moderate';

    return { aqi, healthRisks, pollen, safetyScore, reliability, overallRiskLevel };
  }, [
    latest.co2, latest.smoke, latest.nh3, latest.benzene, latest.lpg,
    latest.dust, latest.rain, latest.pressure, latest.temperature,
    latest.humidity, latest.altitude, historical,
  ]);
}
