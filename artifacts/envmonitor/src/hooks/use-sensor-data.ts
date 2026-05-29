import { useQuery } from '@tanstack/react-query';
import { processUnifiedReading, processHistoricalReadings, type UnifiedReading } from '@/lib/processing/unified-readings';

const DEFAULT_CH1_ID = '3307420';
const DEFAULT_CH2_ID = '3307422';

function getChannelUrl(channel: 1 | 2, results: number) {
  const ch1Id = localStorage.getItem('ts_channel1_id') || DEFAULT_CH1_ID;
  const ch2Id = localStorage.getItem('ts_channel2_id') || DEFAULT_CH2_ID;
  const id = channel === 1 ? ch1Id : ch2Id;
  return `/api/thingspeak/channel${channel}?results=${results}&channelId=${encodeURIComponent(id)}`;
}

export type StatusLevel = 'GOOD' | 'MODERATE' | 'DANGEROUS';

export interface ParameterConfig {
  id: keyof Omit<UnifiedReading, 'timestamp'>;
  nameKey: string;
  unit: string;
  channel: 1 | 2;
  field: string;
  icon: string;
  evaluate: (val: number) => StatusLevel;
  maxRef: number;
}

export const PARAMETERS: ParameterConfig[] = [
  { id: 'co2',         nameKey: 'CO2',         unit: 'ppm',   channel: 1, field: 'field1', icon: 'Wind',         maxRef: 5000,  evaluate: (v) => v > 2000 ? 'DANGEROUS' : v > 1000 ? 'MODERATE' : 'GOOD' },
  { id: 'smoke',       nameKey: 'Smoke',       unit: 'idx',   channel: 1, field: 'field2', icon: 'CloudFog',     maxRef: 500,   evaluate: (v) => v > 300  ? 'DANGEROUS' : v > 100  ? 'MODERATE' : 'GOOD' },
  { id: 'nh3',         nameKey: 'NH3',         unit: 'ppm',   channel: 1, field: 'field3', icon: 'FlaskConical', maxRef: 150,   evaluate: (v) => v > 50   ? 'DANGEROUS' : v > 25   ? 'MODERATE' : 'GOOD' },
  { id: 'benzene',     nameKey: 'Benzene',     unit: 'ppb',   channel: 1, field: 'field4', icon: 'Zap',          maxRef: 30,    evaluate: (v) => v > 10   ? 'DANGEROUS' : v > 5    ? 'MODERATE' : 'GOOD' },
  { id: 'lpg',         nameKey: 'LPG',         unit: 'ppm',   channel: 1, field: 'field5', icon: 'Flame',        maxRef: 3000,  evaluate: (v) => v > 2000 ? 'DANGEROUS' : v > 1000 ? 'MODERATE' : 'GOOD' },
  { id: 'dust',        nameKey: 'Dust',        unit: 'μg/m³', channel: 1, field: 'field6', icon: 'CloudSnow',    maxRef: 150,   evaluate: (v) => v > 75   ? 'DANGEROUS' : v > 35   ? 'MODERATE' : 'GOOD' },
  { id: 'rain',        nameKey: 'Rain',        unit: '%',     channel: 1, field: 'field7', icon: 'CloudRain',    maxRef: 100,   evaluate: (v) => v > 80   ? 'DANGEROUS' : v > 40   ? 'MODERATE' : 'GOOD' },
  { id: 'pressure',    nameKey: 'Pressure',    unit: 'hPa',   channel: 1, field: 'field8', icon: 'Gauge',        maxRef: 1050,  evaluate: (v) => v < 960  ? 'DANGEROUS' : v < 1000 ? 'MODERATE' : 'GOOD' },
  { id: 'temperature', nameKey: 'Temperature', unit: '°C',    channel: 2, field: 'field1', icon: 'Thermometer',  maxRef: 50,    evaluate: (v) => v > 38 || v < 5 ? 'DANGEROUS' : v > 30 || v < 15 ? 'MODERATE' : 'GOOD' },
  { id: 'humidity',    nameKey: 'Humidity',    unit: '%',     channel: 2, field: 'field2', icon: 'Droplets',     maxRef: 100,   evaluate: (v) => v > 85   ? 'DANGEROUS' : v > 70   ? 'MODERATE' : 'GOOD' },
  { id: 'altitude',    nameKey: 'Altitude',    unit: 'm',     channel: 2, field: 'field3', icon: 'TrendingUp',   maxRef: 4000,  evaluate: () => 'GOOD' },
  // PMS7003 particulate sensors (Channel 2, Fields 4–6)
  { id: 'pms1',        nameKey: 'PM1.0',       unit: 'μg/m³', channel: 2, field: 'field4', icon: 'Wind',         maxRef: 75,    evaluate: (v) => v > 35  ? 'DANGEROUS' : v > 12  ? 'MODERATE' : 'GOOD' },
  { id: 'pms25',       nameKey: 'PM2.5',       unit: 'μg/m³', channel: 2, field: 'field5', icon: 'Wind',         maxRef: 150,   evaluate: (v) => v > 55  ? 'DANGEROUS' : v > 25  ? 'MODERATE' : 'GOOD' },
  { id: 'pms10',       nameKey: 'PM10',        unit: 'μg/m³', channel: 2, field: 'field6', icon: 'CloudSnow',    maxRef: 300,   evaluate: (v) => v > 150 ? 'DANGEROUS' : v > 50  ? 'MODERATE' : 'GOOD' },
];

async function fetchThingSpeak(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch ThingSpeak data');
  return res.json();
}

export function useSensorData(resultsLimit: number = 100) {
  const ch1Query = useQuery({
    queryKey: ['thingspeak', 1, resultsLimit],
    queryFn: () => fetchThingSpeak(getChannelUrl(1, resultsLimit)),
    refetchInterval: 30000,
  });

  const ch2Query = useQuery({
    queryKey: ['thingspeak', 2, resultsLimit],
    queryFn: () => fetchThingSpeak(getChannelUrl(2, resultsLimit)),
    refetchInterval: 30000,
  });

  const isLoading = ch1Query.isLoading || ch2Query.isLoading;
  const isError = ch1Query.isError || ch2Query.isError;
  const isConnected = ch1Query.isSuccess && ch2Query.isSuccess;

  const ch1Feeds = ch1Query.data?.feeds ?? null;
  const ch2Feeds = ch2Query.data?.feeds ?? null;

  // Unified canonical reading (validated + cleaned)
  const unified = processUnifiedReading(ch1Feeds, ch2Feeds);
  const historicalData = processHistoricalReadings(ch1Feeds, ch2Feeds);

  // Build latestData and score from unified reading via PARAMETERS config
  const latestData: Record<string, { value: number; status: StatusLevel; raw: UnifiedReading }> = {};
  let score = 100;
  let dangerousCount = 0;

  if (isConnected) {
    PARAMETERS.forEach(param => {
      const val = unified[param.id] as number | null;
      if (val !== null && val !== undefined) {
        const status = param.evaluate(val);
        latestData[param.id] = { value: val, status, raw: unified };
        if (status === 'DANGEROUS' && param.id !== 'altitude') { score -= 20; dangerousCount++; }
        else if (status === 'MODERATE' && param.id !== 'altitude') score -= 5;
      }
    });
    score = Math.max(0, score);
  }

  const lastUpdated = unified.timestamp ? new Date(unified.timestamp) : null;

  return {
    latestData,
    historicalData,
    unified,
    score,
    dangerousCount,
    lastUpdated,
    isLoading,
    isError,
    isConnected,
    raw: { ch1: ch1Feeds, ch2: ch2Feeds },
  };
}
