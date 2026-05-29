export type SafetyCategory = 'Safe' | 'Caution' | 'Risky' | 'Dangerous';

export interface SafetyScoreResult {
  score: number; // 0–100
  category: SafetyCategory;
  color: string;
  components: { label: string; contribution: number; penalty: number }[];
}

export interface SafetyScoreInput {
  aqiScore?: number;
  dust?: number | null;
  co2?: number | null;
  smoke?: number | null;
  nh3?: number | null;
  benzene?: number | null;
  lpg?: number | null;
  temperature?: number | null;
  humidity?: number | null;
  rain?: number | null;
  pollenScore?: number; // 0–100 pollen activity score
}

export function calculateSafetyScore(input: SafetyScoreInput): SafetyScoreResult {
  const aqi    = input.aqiScore    ?? 0;
  const dust   = input.dust        ?? 0;
  const co2    = input.co2         ?? 400;
  const smoke  = input.smoke       ?? 0;
  const nh3    = input.nh3         ?? 0;
  const benz   = input.benzene     ?? 0;
  const lpg    = input.lpg         ?? 0;
  const temp   = input.temperature ?? 25;
  const hum    = input.humidity    ?? 50;
  const rain   = input.rain        ?? 0;
  const pollen = input.pollenScore ?? 40;

  const components: SafetyScoreResult['components'] = [];

  // AQI penalty (0–30 pts)
  const aqiPenalty = Math.min(30, aqi > 300 ? 30 : aqi > 200 ? 24 : aqi > 150 ? 18 : aqi > 100 ? 12 : aqi > 50 ? 6 : 0);
  components.push({ label: 'Air Quality (AQI)', contribution: 30, penalty: aqiPenalty });

  // Dust penalty (0–20 pts)
  const dustPenalty = Math.min(20, dust > 150 ? 20 : dust > 75 ? 15 : dust > 55 ? 10 : dust > 35 ? 6 : dust > 12 ? 2 : 0);
  components.push({ label: 'Dust PM2.5', contribution: 20, penalty: dustPenalty });

  // Gas penalty (0–25 pts) — combined dangerous gases
  let gasPenalty = 0;
  gasPenalty += lpg > 2000 ? 12 : lpg > 1000 ? 8 : lpg > 500 ? 4 : 0;
  gasPenalty += benz > 10 ? 8 : benz > 5 ? 4 : 0;
  gasPenalty += nh3 > 100 ? 5 : nh3 > 50 ? 3 : nh3 > 25 ? 1 : 0;
  gasPenalty += co2 > 5000 ? 5 : co2 > 2000 ? 3 : co2 > 1000 ? 1 : 0;
  gasPenalty = Math.min(25, gasPenalty);
  components.push({ label: 'Gas Concentrations', contribution: 25, penalty: gasPenalty });

  // Weather penalty (0–15 pts)
  let wxPenalty = 0;
  if (temp > 40) wxPenalty += 8;
  else if (temp > 35) wxPenalty += 4;
  else if (temp < 5) wxPenalty += 3;
  if (hum > 90) wxPenalty += 4;
  else if (hum < 20) wxPenalty += 3;
  if (rain > 80) wxPenalty += 3;
  wxPenalty = Math.min(15, wxPenalty);
  components.push({ label: 'Weather Conditions', contribution: 15, penalty: wxPenalty });

  // Pollen penalty (0–10 pts)
  const pollenPenalty = Math.min(10, Math.round(pollen / 10));
  components.push({ label: 'Pollen Risk', contribution: 10, penalty: pollenPenalty });

  const totalPenalty = aqiPenalty + dustPenalty + gasPenalty + wxPenalty + pollenPenalty;
  const score = Math.max(0, Math.min(100, 100 - totalPenalty));

  let category: SafetyCategory;
  if (score >= 75)      category = 'Safe';
  else if (score >= 50) category = 'Caution';
  else if (score >= 25) category = 'Risky';
  else                   category = 'Dangerous';

  let color: string;
  if (score >= 75)      color = '#22c55e';
  else if (score >= 50) color = '#eab308';
  else if (score >= 25) color = '#f97316';
  else                   color = '#ef4444';

  return { score, category, color, components };
}
