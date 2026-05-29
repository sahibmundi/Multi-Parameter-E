export type PollenActivity = 'Very Low' | 'Low' | 'Moderate' | 'High' | 'Very High';
export type AllergyRisk   = 'Low' | 'Moderate' | 'High' | 'Very High';
export type OutdoorSafety = 'Safe' | 'Caution' | 'Limit Exposure' | 'Stay Indoors';

export interface PollenResult {
  pollenActivity: PollenActivity;
  allergyRisk: AllergyRisk;
  outdoorSafetyScore: number;
  outdoorSafety: OutdoorSafety;
  recommendation: string;
  color: string;
  activityScore: number;
}

export interface PollenInput {
  temperature?: number | null;
  humidity?: number | null;
  rain?: number | null;
  dust?: number | null;
  pressure?: number | null;
}

function pollenActivityScore(input: PollenInput): number {
  const temp  = input.temperature ?? 20;
  const hum   = input.humidity    ?? 50;
  const rain  = input.rain        ?? 0;
  const dust  = input.dust        ?? 0;
  const press = input.pressure    ?? 1013;

  let score = 40;
  if (temp >= 15 && temp <= 28) score += 20;
  else if (temp >= 10 && temp < 15) score += 8;
  else if (temp > 28 && temp <= 35) score += 5;
  else if (temp < 10 || temp > 38) score -= 15;

  if (hum < 40) score += 20;
  else if (hum < 55) score += 10;
  else if (hum > 75) score -= 20;
  else if (hum > 90) score -= 35;

  if (rain > 70) score -= 35;
  else if (rain > 40) score -= 20;
  else if (rain > 20) score -= 10;
  else if (rain < 10) score += 10;

  if (dust > 50) score += 15;
  else if (dust > 25) score += 8;

  if (press > 1020) score += 8;
  else if (press < 990) score -= 10;

  return Math.max(0, Math.min(100, score));
}

export function calculatePollen(input: PollenInput): PollenResult {
  const score = pollenActivityScore(input);
  const rain  = input.rain ?? 0;
  const hum   = input.humidity ?? 50;

  let pollenActivity: PollenActivity;
  if (score <= 20) pollenActivity = 'Very Low';
  else if (score <= 40) pollenActivity = 'Low';
  else if (score <= 60) pollenActivity = 'Moderate';
  else if (score <= 80) pollenActivity = 'High';
  else pollenActivity = 'Very High';

  let allergyRisk: AllergyRisk;
  if (score <= 25) allergyRisk = 'Low';
  else if (score <= 50) allergyRisk = 'Moderate';
  else if (score <= 75) allergyRisk = 'High';
  else allergyRisk = 'Very High';

  const outdoorSafetyScore = Math.max(0, Math.min(100, 100 - score));

  let outdoorSafety: OutdoorSafety;
  if (outdoorSafetyScore >= 75) outdoorSafety = 'Safe';
  else if (outdoorSafetyScore >= 50) outdoorSafety = 'Caution';
  else if (outdoorSafetyScore >= 30) outdoorSafety = 'Limit Exposure';
  else outdoorSafety = 'Stay Indoors';

  let recommendation: string;
  if (score <= 20) recommendation = 'Safe for all outdoor activities. Very low pollen dispersal.';
  else if (score <= 40) recommendation = 'Generally safe outdoors. Low allergy risk today.';
  else if (score <= 60) recommendation = rain > 30 ? 'Rainfall is reducing pollen. Moderate caution for allergy sufferers.' : 'Moderate pollen. Allergy sufferers should carry medication.';
  else if (score <= 80) recommendation = 'High pollen levels. Wear a mask outdoors. Keep windows closed.';
  else recommendation = hum < 40 ? 'Very high pollen — dry conditions increase dispersal. Avoid outdoor exposure.' : 'Very high pollen. Sensitive individuals should remain indoors.';

  let color: string;
  if (score <= 20) color = '#22c55e';
  else if (score <= 40) color = '#84cc16';
  else if (score <= 60) color = '#eab308';
  else if (score <= 80) color = '#f97316';
  else color = '#ef4444';

  return { pollenActivity, allergyRisk, outdoorSafetyScore, outdoorSafety, recommendation, color, activityScore: score };
}
