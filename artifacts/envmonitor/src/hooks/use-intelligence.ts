import { useMemo } from 'react';
import { calculateAQI, type AQIResult } from '@/lib/engines/aqi';
import { calculateHealthRisks, type HealthRisk } from '@/lib/engines/health-risk';
import { calculatePollen, type PollenResult } from '@/lib/engines/pollen';
import { calculateSafetyScore, type SafetyScoreResult } from '@/lib/engines/safety-score';
import { assessSensorReliability, SENSOR_BOUNDS, type ReliabilityResult } from '@/lib/engines/sensor-reliability';
import { calculateInfectionsAllergies, type InfectionAllergyRisk } from '@/lib/engines/infections-allergies';
import type { UnifiedReading } from '@/lib/processing/unified-readings';

export interface IntelligenceData {
  aqi: AQIResult;
  healthRisks: HealthRisk[];
  pollen: PollenResult;
  safetyScore: SafetyScoreResult;
  reliability: ReliabilityResult;
  infectionsAllergies: InfectionAllergyRisk[];
  overallRiskLevel: 'Low' | 'Moderate' | 'High' | 'Critical';
}

export function useIntelligence(
  unified: UnifiedReading,
  historical: Record<string, { value: number; timestamp: string }[]>,
): IntelligenceData {
  return useMemo(() => {
    const aqi = calculateAQI({
      dust: unified.dust, co2: unified.co2, smoke: unified.smoke,
      nh3: unified.nh3, benzene: unified.benzene, lpg: unified.lpg,
      pms25: unified.pms25, pms10: unified.pms10,
    });

    const pollen = calculatePollen({
      temperature: unified.temperature, humidity: unified.humidity,
      rain: unified.rain, dust: unified.dust, pressure: unified.pressure,
    });

    const safetyScore = calculateSafetyScore({
      aqiScore: aqi.score, dust: unified.dust, co2: unified.co2,
      smoke: unified.smoke, nh3: unified.nh3, benzene: unified.benzene,
      lpg: unified.lpg, temperature: unified.temperature,
      humidity: unified.humidity, rain: unified.rain,
      pollenScore: pollen.outdoorSafetyScore,
    });

    const healthRisks = calculateHealthRisks({
      dust: unified.dust, smoke: unified.smoke, co2: unified.co2,
      nh3: unified.nh3, benzene: unified.benzene, lpg: unified.lpg,
      temperature: unified.temperature, humidity: unified.humidity,
      aqiScore: aqi.score,
    });

    const infectionsAllergies = calculateInfectionsAllergies({
      pms1: unified.pms1, pms25: unified.pms25, pms10: unified.pms10,
      dust: unified.dust, smoke: unified.smoke, co2: unified.co2,
      nh3: unified.nh3, benzene: unified.benzene, lpg: unified.lpg,
      temperature: unified.temperature, humidity: unified.humidity,
      rain: unified.rain, aqiScore: aqi.score,
    });

    // Explicit key map avoids unsafe cast — SENSOR_BOUNDS keys match UnifiedReading field names
    const unifiedValueMap: Record<keyof typeof SENSOR_BOUNDS, number | null> = {
      co2: unified.co2, smoke: unified.smoke, nh3: unified.nh3,
      benzene: unified.benzene, lpg: unified.lpg, dust: unified.dust,
      rain: unified.rain, pressure: unified.pressure,
      temperature: unified.temperature, humidity: unified.humidity,
      altitude: unified.altitude, pms1: unified.pms1, pms25: unified.pms25, pms10: unified.pms10,
    };

    const reliabilityInputs = Object.entries(SENSOR_BOUNDS).map(([id, bounds]) => ({
      id,
      name: bounds.name,
      unit: '',
      currentValue: unifiedValueMap[id as keyof typeof SENSOR_BOUNDS],
      history: historical[id] ?? [],
      physicalMin: bounds.min,
      physicalMax: bounds.max,
    }));
    const reliability = assessSensorReliability(reliabilityInputs);

    const criticalCount = healthRisks.filter(r => r.riskLevel === 'Critical').length;
    const highCount     = healthRisks.filter(r => r.riskLevel === 'High').length;
    const critInfect    = infectionsAllergies.filter(r => r.riskLevel === 'Critical').length;
    const highInfect    = infectionsAllergies.filter(r => r.riskLevel === 'High').length;

    let overallRiskLevel: IntelligenceData['overallRiskLevel'] = 'Low';
    if (criticalCount > 0 || critInfect > 0)   overallRiskLevel = 'Critical';
    else if (highCount > 1 || highInfect > 1)   overallRiskLevel = 'High';
    else if (highCount > 0 || highInfect > 0)   overallRiskLevel = 'Moderate';

    return { aqi, healthRisks, pollen, safetyScore, reliability, infectionsAllergies, overallRiskLevel };
  }, [
    unified.co2, unified.smoke, unified.nh3, unified.benzene, unified.lpg,
    unified.dust, unified.rain, unified.pressure, unified.temperature,
    unified.humidity, unified.altitude, unified.pms1, unified.pms25, unified.pms10,
    historical,
  ]);
}
