/**
 * Unified Reading Processor
 *
 * Single source of truth that merges Channel 1 (gas/particle sensors) and
 * Channel 2 (climate + PMS7003) raw ThingSpeak feeds into a validated,
 * cleaned, default-filled typed object consumed by all intelligence engines
 * and the dashboard UI.
 */

export interface UnifiedReading {
  // Channel 1 — Gas / Particle sensors
  co2:         number | null;  // field1 – ppm
  smoke:       number | null;  // field2 – idx
  nh3:         number | null;  // field3 – ppm
  benzene:     number | null;  // field4 – ppb
  lpg:         number | null;  // field5 – ppm
  dust:        number | null;  // field6 – μg/m³ (GP2Y1010 optical)
  rain:        number | null;  // field7 – %
  pressure:    number | null;  // field8 – hPa

  // Channel 2 — Climate + PMS7003
  temperature: number | null;  // field1 – °C
  humidity:    number | null;  // field2 – %
  altitude:    number | null;  // field3 – m
  pms1:        number | null;  // field4 – PM1.0 μg/m³
  pms25:       number | null;  // field5 – PM2.5 μg/m³
  pms10:       number | null;  // field6 – PM10  μg/m³

  /** ISO timestamp of the most recent reading */
  timestamp: string | null;
}

/** Physical plausibility bounds — values outside are set to null */
const BOUNDS: Record<keyof Omit<UnifiedReading, 'timestamp'>, [number, number]> = {
  co2:         [300,    10000],
  smoke:       [0,      1000 ],
  nh3:         [0,      500  ],
  benzene:     [0,      1000 ],
  lpg:         [0,      10000],
  dust:        [0,      1000 ],
  rain:        [0,      100  ],
  pressure:    [870,    1085 ],
  temperature: [-40,    85   ],
  humidity:    [0,      100  ],
  altitude:    [-500,   9000 ],
  pms1:        [0,      1000 ],
  pms25:       [0,      1000 ],
  pms10:       [0,      2000 ],
};

function parseAndValidate(raw: string | null | undefined, key: keyof typeof BOUNDS): number | null {
  if (raw == null || raw === '') return null;
  const n = parseFloat(raw);
  if (isNaN(n)) return null;
  const [lo, hi] = BOUNDS[key];
  if (n < lo || n > hi) return null;
  return n;
}

export interface RawFeed {
  created_at?: string;
  [key: string]: string | number | null | undefined;
}

/**
 * Merge two ThingSpeak channel feed arrays (last entry used for latest values).
 * ch1: Gas sensors, ch2: Climate + PMS7003.
 */
export function processUnifiedReading(
  ch1Feeds: RawFeed[] | null | undefined,
  ch2Feeds: RawFeed[] | null | undefined,
): UnifiedReading {
  const f1 = ch1Feeds?.at(-1) ?? null;
  const f2 = ch2Feeds?.at(-1) ?? null;

  const ts1 = f1?.created_at ? String(f1.created_at) : null;
  const ts2 = f2?.created_at ? String(f2.created_at) : null;
  const timestamp = ts1 && ts2
    ? (new Date(ts1) > new Date(ts2) ? ts1 : ts2)
    : ts1 ?? ts2;

  return {
    // Channel 1
    co2:      parseAndValidate(f1?.field1 as string, 'co2'),
    smoke:    parseAndValidate(f1?.field2 as string, 'smoke'),
    nh3:      parseAndValidate(f1?.field3 as string, 'nh3'),
    benzene:  parseAndValidate(f1?.field4 as string, 'benzene'),
    lpg:      parseAndValidate(f1?.field5 as string, 'lpg'),
    dust:     parseAndValidate(f1?.field6 as string, 'dust'),
    rain:     parseAndValidate(f1?.field7 as string, 'rain'),
    pressure: parseAndValidate(f1?.field8 as string, 'pressure'),
    // Channel 2
    temperature: parseAndValidate(f2?.field1 as string, 'temperature'),
    humidity:    parseAndValidate(f2?.field2 as string, 'humidity'),
    altitude:    parseAndValidate(f2?.field3 as string, 'altitude'),
    pms1:        parseAndValidate(f2?.field4 as string, 'pms1'),
    pms25:       parseAndValidate(f2?.field5 as string, 'pms25'),
    pms10:       parseAndValidate(f2?.field6 as string, 'pms10'),
    timestamp,
  };
}

/**
 * Build time-series arrays (for charts / reliability) for every sensor from
 * the raw feed arrays.
 */
export function processHistoricalReadings(
  ch1Feeds: RawFeed[] | null | undefined,
  ch2Feeds: RawFeed[] | null | undefined,
): Record<string, { value: number; timestamp: string }[]> {
  const ch1Map: Record<string, keyof typeof BOUNDS> = {
    field1: 'co2', field2: 'smoke', field3: 'nh3', field4: 'benzene',
    field5: 'lpg', field6: 'dust', field7: 'rain', field8: 'pressure',
  };
  const ch2Map: Record<string, keyof typeof BOUNDS> = {
    field1: 'temperature', field2: 'humidity', field3: 'altitude',
    field4: 'pms1', field5: 'pms25', field6: 'pms10',
  };

  const result: Record<string, { value: number; timestamp: string }[]> = {};

  for (const [field, sensor] of Object.entries(ch1Map)) {
    result[sensor] = (ch1Feeds ?? [])
      .map(f => {
        const v = parseAndValidate(f[field] as string, sensor);
        if (v === null) return null;
        return { value: v, timestamp: String(f.created_at ?? '') };
      })
      .filter((x): x is { value: number; timestamp: string } => x !== null);
  }

  for (const [field, sensor] of Object.entries(ch2Map)) {
    result[sensor] = (ch2Feeds ?? [])
      .map(f => {
        const v = parseAndValidate(f[field] as string, sensor);
        if (v === null) return null;
        return { value: v, timestamp: String(f.created_at ?? '') };
      })
      .filter((x): x is { value: number; timestamp: string } => x !== null);
  }

  return result;
}
