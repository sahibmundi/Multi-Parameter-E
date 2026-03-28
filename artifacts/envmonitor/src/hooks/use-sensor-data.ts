import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '@/lib/store';

// ThingSpeak proxy via backend API (avoids CORS issues)
// Channel IDs can be overridden via localStorage if user sets them in the UI
function getChannelUrl(channel: 1 | 2, results: number) {
  const ch1Id = localStorage.getItem('ts_channel1_id') || '';
  const ch2Id = localStorage.getItem('ts_channel2_id') || '';
  const id = channel === 1 ? ch1Id : ch2Id;
  const channelParam = id ? `&channelId=${encodeURIComponent(id)}` : '';
  return `/api/thingspeak/channel${channel}?results=${results}${channelParam}`;
}

export type StatusLevel = 'GOOD' | 'MODERATE' | 'DANGEROUS';

export interface ParameterConfig {
  id: string;
  nameKey: string; // Key in translations
  unit: string;
  channel: 1 | 2;
  field: string;
  evaluate: (val: number) => StatusLevel;
}

export const PARAMETERS: ParameterConfig[] = [
  // Channel 1: field1-field8
  { id: 'co2',         nameKey: 'CO2',         unit: 'ppm',   channel: 1, field: 'field1', evaluate: (v) => v > 2000 ? 'DANGEROUS' : v > 1000 ? 'MODERATE' : 'GOOD' },
  { id: 'smoke',       nameKey: 'Smoke',       unit: 'ppm',   channel: 1, field: 'field2', evaluate: (v) => v > 500  ? 'DANGEROUS' : v > 200  ? 'MODERATE' : 'GOOD' },
  { id: 'nh3',         nameKey: 'NH3',         unit: 'ppm',   channel: 1, field: 'field3', evaluate: (v) => v > 50   ? 'DANGEROUS' : v > 25   ? 'MODERATE' : 'GOOD' },
  { id: 'benzene',     nameKey: 'Benzene',     unit: 'ppb',   channel: 1, field: 'field4', evaluate: (v) => v > 5    ? 'DANGEROUS' : v > 1    ? 'MODERATE' : 'GOOD' },
  { id: 'lpg',         nameKey: 'LPG',         unit: 'ppm',   channel: 1, field: 'field5', evaluate: (v) => v > 2000 ? 'DANGEROUS' : v > 1000 ? 'MODERATE' : 'GOOD' },
  { id: 'dust',        nameKey: 'Dust',        unit: 'μg/m³', channel: 1, field: 'field6', evaluate: (v) => v > 35   ? 'DANGEROUS' : v > 12   ? 'MODERATE' : 'GOOD' },
  { id: 'rain',        nameKey: 'Rain',        unit: '%',     channel: 1, field: 'field7', evaluate: (v) => v > 80   ? 'DANGEROUS' : v > 40   ? 'MODERATE' : 'GOOD' },
  { id: 'pressure',    nameKey: 'Pressure',    unit: 'hPa',   channel: 1, field: 'field8', evaluate: (v) => v < 980  ? 'DANGEROUS' : v < 1000 ? 'MODERATE' : 'GOOD' },
  // Channel 2: field1-field3
  { id: 'temperature', nameKey: 'Temperature', unit: '°C',    channel: 2, field: 'field1', evaluate: (v) => v > 35 || v < 10 ? 'DANGEROUS' : v > 28 || v < 18 ? 'MODERATE' : 'GOOD' },
  { id: 'humidity',    nameKey: 'Humidity',    unit: '%',     channel: 2, field: 'field2', evaluate: (v) => v > 80   ? 'DANGEROUS' : v > 60   ? 'MODERATE' : 'GOOD' },
  { id: 'altitude',    nameKey: 'Altitude',    unit: 'm',     channel: 2, field: 'field3', evaluate: () => 'GOOD' },
];

interface FeedData {
  created_at: string;
  [key: string]: string; // field1, field2, etc
}

async function fetchThingSpeak(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch ThingSpeak data');
  return res.json();
}

export function useSensorData(resultsLimit: number = 100) {
  // We manipulate the results limit dynamically via the URL parameter if needed
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

  // Process latest data
  const latestData: Record<string, { value: number, status: StatusLevel, raw: any }> = {};
  const historicalData: Record<string, any[]> = {};
  
  let score = 100;
  let dangerousCount = 0;
  let lastUpdated = null;

  if (isConnected) {
    const feeds1: FeedData[] = ch1Query.data?.feeds || [];
    const feeds2: FeedData[] = ch2Query.data?.feeds || [];
    
    // Find the absolute latest timestamp across both channels
    const d1 = feeds1.length ? new Date(feeds1[feeds1.length - 1].created_at) : null;
    const d2 = feeds2.length ? new Date(feeds2[feeds2.length - 1].created_at) : null;
    if (d1 && d2) lastUpdated = d1 > d2 ? d1 : d2;
    else lastUpdated = d1 || d2 || new Date();

    PARAMETERS.forEach(param => {
      const feeds = param.channel === 1 ? feeds1 : feeds2;
      
      // Process historical series
      historicalData[param.id] = feeds.map(f => ({
        timestamp: f.created_at,
        value: parseFloat(f[param.field]) || 0
      })).filter(d => !isNaN(d.value));

      // Process latest value
      const latestFeed = feeds[feeds.length - 1];
      if (latestFeed) {
        const val = parseFloat(latestFeed[param.field]) || 0;
        const status = param.evaluate(val);
        latestData[param.id] = { value: val, status, raw: latestFeed };

        // Score deduction logic
        if (status === 'DANGEROUS' && param.id !== 'altitude') {
          score -= 20;
          dangerousCount++;
        } else if (status === 'MODERATE' && param.id !== 'altitude') {
          score -= 5;
        }
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
    raw: {
        ch1: ch1Query.data?.feeds,
        ch2: ch2Query.data?.feeds
    }
  };
}
