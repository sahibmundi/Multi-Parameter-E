export type AQICategory =
  | 'Good'
  | 'Moderate'
  | 'Unhealthy for Sensitive Groups'
  | 'Unhealthy'
  | 'Very Unhealthy'
  | 'Hazardous';

export interface AQIResult {
  score: number;
  category: AQICategory;
  color: string;
  dominantPollutant: string;
  severity: 'low' | 'moderate' | 'high' | 'critical';
}

function linearScale(val: number, lo: number, hi: number, aqiLo: number, aqiHi: number): number {
  return Math.round(((aqiHi - aqiLo) / (hi - lo)) * (val - lo) + aqiLo);
}

function pm25ToAQI(pm: number): number {
  if (pm <= 12.0)    return linearScale(pm, 0,     12.0,  0,   50);
  if (pm <= 35.4)    return linearScale(pm, 12.1,  35.4,  51,  100);
  if (pm <= 55.4)    return linearScale(pm, 35.5,  55.4,  101, 150);
  if (pm <= 150.4)   return linearScale(pm, 55.5,  150.4, 151, 200);
  if (pm <= 250.4)   return linearScale(pm, 150.5, 250.4, 201, 300);
  return linearScale(pm, 250.5, 500, 301, 500);
}

function co2ToSubIndex(co2: number): number {
  if (co2 <= 600)  return 10;
  if (co2 <= 1000) return linearScale(co2, 600, 1000, 10, 50);
  if (co2 <= 2000) return linearScale(co2, 1000, 2000, 50, 150);
  if (co2 <= 5000) return linearScale(co2, 2000, 5000, 150, 300);
  return 400;
}

function smokeToSubIndex(smoke: number): number {
  if (smoke <= 30)  return 10;
  if (smoke <= 100) return linearScale(smoke, 30, 100, 10, 80);
  if (smoke <= 300) return linearScale(smoke, 100, 300, 80, 200);
  return 300;
}

function gasToSubIndex(nh3: number, benzene: number, lpg: number): number {
  const nh3i = nh3 <= 10 ? 0 : nh3 <= 50 ? linearScale(nh3, 10, 50, 0, 100) : 200;
  const beni = benzene <= 2 ? 0 : benzene <= 10 ? linearScale(benzene, 2, 10, 0, 150) : 300;
  const lpgi = lpg <= 500 ? 0 : lpg <= 2000 ? linearScale(lpg, 500, 2000, 0, 100) : 200;
  return Math.max(nh3i, beni, lpgi);
}

function aqiToCategory(aqi: number): AQICategory {
  if (aqi <= 50)  return 'Good';
  if (aqi <= 100) return 'Moderate';
  if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
  if (aqi <= 200) return 'Unhealthy';
  if (aqi <= 300) return 'Very Unhealthy';
  return 'Hazardous';
}

function aqiColor(aqi: number): string {
  if (aqi <= 50)  return '#22c55e';
  if (aqi <= 100) return '#eab308';
  if (aqi <= 150) return '#f97316';
  if (aqi <= 200) return '#ef4444';
  if (aqi <= 300) return '#a855f7';
  return '#7f1d1d';
}

function aqiSeverity(aqi: number): AQIResult['severity'] {
  if (aqi <= 50)  return 'low';
  if (aqi <= 100) return 'moderate';
  if (aqi <= 200) return 'high';
  return 'critical';
}

export interface AQIInput {
  dust?: number | null;
  co2?: number | null;
  smoke?: number | null;
  nh3?: number | null;
  benzene?: number | null;
  lpg?: number | null;
  /** PMS7003 PM2.5 — preferred over optical dust when available */
  pms25?: number | null;
  /** PMS7003 PM10 */
  pms10?: number | null;
}

export function calculateAQI(input: AQIInput): AQIResult {
  // Prefer PMS7003 PM2.5 over optical dust sensor for AQI calculation
  const pm25Source = input.pms25 ?? input.dust;
  const pm10Source = input.pms10;

  const pm25Aqi  = pm25Source != null ? pm25ToAQI(pm25Source) : 0;
  const pm10Aqi  = pm10Source != null ? Math.round(pm10Source > 50 ? linearScale(pm10Source, 50, 300, 100, 300) : pm10Source > 25 ? linearScale(pm10Source, 25, 50, 50, 100) : linearScale(pm10Source, 0, 25, 0, 50)) : 0;
  const co2Aqi   = input.co2   != null ? co2ToSubIndex(input.co2)     : 0;
  const smokeAqi = input.smoke != null ? smokeToSubIndex(input.smoke) : 0;
  const gasAqi   = gasToSubIndex(input.nh3 ?? 0, input.benzene ?? 0, input.lpg ?? 0);

  const particleAqi = Math.max(pm25Aqi, pm10Aqi);

  const components = [
    { name: 'PM2.5',  val: pm25Aqi    },
    { name: 'PM10',   val: pm10Aqi    },
    { name: 'CO₂',    val: co2Aqi     },
    { name: 'Smoke',  val: smokeAqi   },
    { name: 'Gas',    val: gasAqi     },
  ];

  const dominant = components.reduce((a, b) => a.val > b.val ? a : b);
  const score = Math.min(500, Math.max(0, Math.round(
    particleAqi * 0.50 + smokeAqi * 0.20 + co2Aqi * 0.15 + gasAqi * 0.15
  )));

  return {
    score,
    category:          aqiToCategory(score),
    color:             aqiColor(score),
    dominantPollutant: dominant.val > 0 ? dominant.name : 'None',
    severity:          aqiSeverity(score),
  };
}
