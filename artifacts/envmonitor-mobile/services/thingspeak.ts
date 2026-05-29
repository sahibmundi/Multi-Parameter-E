export interface ThingSpeakFeed {
  created_at: string;
  entry_id: number;
  field1?: string | null;
  field2?: string | null;
  field3?: string | null;
  field4?: string | null;
  field5?: string | null;
  field6?: string | null;
  field7?: string | null;
  field8?: string | null;
}

export interface ThingSpeakResponse {
  channel: { id: number; name: string; updated_at: string };
  feeds: ThingSpeakFeed[];
}

const BASE = 'https://api.thingspeak.com';

const API_KEYS: Record<string, string> = {
  '3307420': '14MJF61HHABCGD9P',
  '3307422': 'VJHHEWZOX2O3AX5Q',
};

function getApiKey(channelId: string): string {
  return API_KEYS[channelId] ?? '';
}

function parseVal(v: string | null | undefined): number | null {
  if (!v || v.trim() === '') return null;
  const n = parseFloat(v);
  return isNaN(n) ? null : n;
}

export async function fetchLatest(channelId: string): Promise<ThingSpeakFeed | null> {
  try {
    const key = getApiKey(channelId);
    const keyParam = key ? `?api_key=${key}` : '';
    const res = await fetch(`${BASE}/channels/${channelId}/feeds/last.json${keyParam}`, {
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return null;
    const data: ThingSpeakFeed = await res.json();
    return data;
  } catch {
    return null;
  }
}

export async function fetchHistory(channelId: string, results = 50): Promise<ThingSpeakFeed[]> {
  try {
    const key = getApiKey(channelId);
    const keyParam = key ? `&api_key=${key}` : '';
    const res = await fetch(
      `${BASE}/channels/${channelId}/feeds.json?results=${results}${keyParam}`,
      { signal: AbortSignal.timeout(15000) }
    );
    if (!res.ok) return [];
    const data: ThingSpeakResponse = await res.json();
    return data.feeds ?? [];
  } catch {
    return [];
  }
}

export interface SensorReadings {
  // Channel 1 — gas sensors
  CO2:      number | null;
  Smoke:    number | null;
  NH3:      number | null;
  Benzene:  number | null;
  LPG:      number | null;
  Dust:     number | null;
  Rain:     number | null;
  Pressure: number | null;
  // Channel 2 — climate + PMS7003 (fields 4–6)
  Temperature: number | null;
  Humidity:    number | null;
  Altitude:    number | null;
  PMS1:        number | null;  // PM1.0  μg/m³
  PMS25:       number | null;  // PM2.5  μg/m³
  PMS10:       number | null;  // PM10   μg/m³
  timestamp: Date | null;
}

export async function fetchAllReadings(
  ch1Id: string,
  ch2Id: string,
): Promise<SensorReadings> {
  const [f1, f2] = await Promise.all([fetchLatest(ch1Id), fetchLatest(ch2Id)]);

  return {
    CO2:         parseVal(f1?.field1),
    Smoke:       parseVal(f1?.field2),
    NH3:         parseVal(f1?.field3),
    Benzene:     parseVal(f1?.field4),
    LPG:         parseVal(f1?.field5),
    Dust:        parseVal(f1?.field6),
    Rain:        parseVal(f1?.field7),
    Pressure:    parseVal(f1?.field8),
    Temperature: parseVal(f2?.field1),
    Humidity:    parseVal(f2?.field2),
    Altitude:    parseVal(f2?.field3),
    PMS1:        parseVal(f2?.field4),
    PMS25:       parseVal(f2?.field5),
    PMS10:       parseVal(f2?.field6),
    timestamp:   f1?.created_at ? new Date(f1.created_at) : null,
  };
}

export interface HistoryPoint {
  time: string;
  value: number;
}

export async function fetchSensorHistory(
  ch1Id: string,
  ch2Id: string,
  sensorId: string,
  results = 40,
): Promise<HistoryPoint[]> {
  const fieldMap: Record<string, { ch: '1' | '2'; field: keyof ThingSpeakFeed }> = {
    CO2:         { ch: '1', field: 'field1' },
    Smoke:       { ch: '1', field: 'field2' },
    NH3:         { ch: '1', field: 'field3' },
    Benzene:     { ch: '1', field: 'field4' },
    LPG:         { ch: '1', field: 'field5' },
    Dust:        { ch: '1', field: 'field6' },
    Rain:        { ch: '1', field: 'field7' },
    Pressure:    { ch: '1', field: 'field8' },
    Temperature: { ch: '2', field: 'field1' },
    Humidity:    { ch: '2', field: 'field2' },
    Altitude:    { ch: '2', field: 'field3' },
    PMS1:        { ch: '2', field: 'field4' },
    PMS25:       { ch: '2', field: 'field5' },
    PMS10:       { ch: '2', field: 'field6' },
  };
  const cfg = fieldMap[sensorId];
  if (!cfg) return [];
  const feeds = await fetchHistory(cfg.ch === '1' ? ch1Id : ch2Id, results);
  return feeds
    .map((f) => {
      const raw = f[cfg.field];
      const val = parseVal(raw as string);
      if (val === null) return null;
      const d = new Date(f.created_at);
      return { time: `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`, value: val };
    })
    .filter((x): x is HistoryPoint => x !== null);
}
