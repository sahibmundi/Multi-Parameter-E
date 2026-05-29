import { useQuery } from '@tanstack/react-query';

// Default channels — pre-configured, no setup required
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
  id: string;
  nameKey: string;
  unit: string;
  channel: 1 | 2;
  field: string;
  icon: string;
  evaluate: (val: number) => StatusLevel;
  maxRef: number; // reference max for progress bar
}

export const PARAMETERS: ParameterConfig[] = [
  { id: 'co2',         nameKey: 'CO2',         unit: 'ppm',   channel: 1, field: 'field1', icon: 'Wind',        maxRef: 5000,  evaluate: (v) => v > 2000 ? 'DANGEROUS' : v > 1000 ? 'MODERATE' : 'GOOD' },
  { id: 'smoke',       nameKey: 'Smoke',       unit: 'idx',   channel: 1, field: 'field2', icon: 'CloudFog',    maxRef: 500,   evaluate: (v) => v > 300  ? 'DANGEROUS' : v > 100  ? 'MODERATE' : 'GOOD' },
  { id: 'nh3',         nameKey: 'NH3',         unit: 'ppm',   channel: 1, field: 'field3', icon: 'FlaskConical',maxRef: 150,   evaluate: (v) => v > 50   ? 'DANGEROUS' : v > 25   ? 'MODERATE' : 'GOOD' },
  { id: 'benzene',     nameKey: 'Benzene',     unit: 'ppb',   channel: 1, field: 'field4', icon: 'Zap',         maxRef: 30,    evaluate: (v) => v > 10   ? 'DANGEROUS' : v > 5    ? 'MODERATE' : 'GOOD' },
  { id: 'lpg',         nameKey: 'LPG',         unit: 'ppm',   channel: 1, field: 'field5', icon: 'Flame',       maxRef: 3000,  evaluate: (v) => v > 2000 ? 'DANGEROUS' : v > 1000 ? 'MODERATE' : 'GOOD' },
  { id: 'dust',        nameKey: 'Dust',        unit: 'μg/m³', channel: 1, field: 'field6', icon: 'CloudSnow',   maxRef: 150,   evaluate: (v) => v > 75   ? 'DANGEROUS' : v > 35   ? 'MODERATE' : 'GOOD' },
  { id: 'rain',        nameKey: 'Rain',        unit: '%',     channel: 1, field: 'field7', icon: 'CloudRain',   maxRef: 100,   evaluate: (v) => v > 80   ? 'DANGEROUS' : v > 40   ? 'MODERATE' : 'GOOD' },
  { id: 'pressure',    nameKey: 'Pressure',    unit: 'hPa',   channel: 1, field: 'field8', icon: 'Gauge',       maxRef: 1050,  evaluate: (v) => v < 960  ? 'DANGEROUS' : v < 1000 ? 'MODERATE' : 'GOOD' },
  { id: 'temperature', nameKey: 'Temperature', unit: '°C',    channel: 2, field: 'field1', icon: 'Thermometer', maxRef: 50,    evaluate: (v) => v > 38 || v < 5 ? 'DANGEROUS' : v > 30 || v < 15 ? 'MODERATE' : 'GOOD' },
  { id: 'humidity',    nameKey: 'Humidity',    unit: '%',     channel: 2, field: 'field2', icon: 'Droplets',    maxRef: 100,   evaluate: (v) => v > 85   ? 'DANGEROUS' : v > 70   ? 'MODERATE' : 'GOOD' },
  { id: 'altitude',    nameKey: 'Altitude',    unit: 'm',     channel: 2, field: 'field3', icon: 'TrendingUp',  maxRef: 4000,  evaluate: () => 'GOOD' },
];

interface FeedData {
  created_at: string;
  [key: string]: string;
}

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

  const latestData: Record<string, { value: number; status: StatusLevel; raw: any }> = {};
  const historicalData: Record<string, any[]> = {};

  let score = 100;
  let dangerousCount = 0;
  let lastUpdated: Date | null = null;

  if (isConnected) {
    const feeds1: FeedData[] = ch1Query.data?.feeds || [];
    const feeds2: FeedData[] = ch2Query.data?.feeds || [];

    const d1 = feeds1.length ? new Date(feeds1[feeds1.length - 1].created_at) : null;
    const d2 = feeds2.length ? new Date(feeds2[feeds2.length - 1].created_at) : null;
    if (d1 && d2) lastUpdated = d1 > d2 ? d1 : d2;
    else lastUpdated = d1 || d2 || new Date();

    PARAMETERS.forEach(param => {
      const feeds = param.channel === 1 ? feeds1 : feeds2;

      historicalData[param.id] = feeds.map(f => ({
        timestamp: f.created_at,
        value: parseFloat(f[param.field]) || 0,
      })).filter(d => !isNaN(d.value) && d.value !== 0);

      const latestFeed = feeds[feeds.length - 1];
      if (latestFeed) {
        const val = parseFloat(latestFeed[param.field]) || 0;
        const status = param.evaluate(val);
        latestData[param.id] = { value: val, status, raw: latestFeed };
        if (status === 'DANGEROUS' && param.id !== 'altitude') { score -= 20; dangerousCount++; }
        else if (status === 'MODERATE' && param.id !== 'altitude') score -= 5;
      }
    });

    score = Math.max(0, score);
  }

  return {
    latestData,
    historicalData,
    score,
    dangerousCount,
    lastUpdated,
    isLoading,
    isError,
    isConnected,
    raw: { ch1: ch1Query.data?.feeds, ch2: ch2Query.data?.feeds },
  };
}
