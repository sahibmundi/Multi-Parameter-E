export type SensorStatus = 'Online' | 'Offline' | 'Frozen' | 'Spike' | 'Invalid';

export interface SensorReliability {
  id: string;
  name: string;
  status: SensorStatus;
  message: string;
  color: string;
  lastValidValue?: number;
}

export interface ReliabilityInput {
  id: string;
  name: string;
  currentValue: number | null | undefined;
  history: { value: number; timestamp: string }[];
  physicalMin: number;
  physicalMax: number;
}

export interface ReliabilityResult {
  sensors: SensorReliability[];
  offlineCount: number;
  degradedCount: number;
  allHealthy: boolean;
  hasMaintenanceAlert: boolean;
}

function detectStatus(input: ReliabilityInput): { status: SensorStatus; message: string } {
  const { currentValue, history, physicalMin, physicalMax } = input;

  if (currentValue === null || currentValue === undefined || isNaN(currentValue)) {
    return { status: 'Offline', message: 'No data received from sensor.' };
  }

  if (currentValue < physicalMin || currentValue > physicalMax) {
    return {
      status: 'Invalid',
      message: `Value ${currentValue.toFixed(1)} is outside physical range [${physicalMin}–${physicalMax}].`,
    };
  }

  if (history.length >= 3) {
    const recent = history.slice(-5).map(h => h.value).filter(v => !isNaN(v));

    if (recent.length >= 4) {
      const allSame = recent.every(v => Math.abs(v - recent[0]) < 0.001);
      if (allSame) {
        return { status: 'Frozen', message: `Sensor stuck at ${recent[0].toFixed(2)} for ${recent.length} readings.` };
      }
    }

    if (recent.length >= 3) {
      const mean = recent.reduce((a, b) => a + b, 0) / recent.length;
      const std  = Math.sqrt(recent.reduce((a, b) => a + (b - mean) ** 2, 0) / recent.length);
      if (std > 0.1 && Math.abs(currentValue - mean) > 3 * std && Math.abs(currentValue - mean) > 10) {
        return {
          status: 'Spike',
          message: `Abnormal spike: ${currentValue.toFixed(1)} vs mean ${mean.toFixed(1)} (±${std.toFixed(1)}).`,
        };
      }
    }
  }

  return { status: 'Online', message: 'Sensor operating normally.' };
}

function statusColor(s: SensorStatus): string {
  switch (s) {
    case 'Online':  return '#00FF88';
    case 'Offline': return '#6B8CAE';
    case 'Frozen':  return '#3b82f6';
    case 'Spike':   return '#FF8C00';
    case 'Invalid': return '#FF3366';
  }
}

export const SENSOR_BOUNDS: Record<string, { min: number; max: number; name: string }> = {
  CO2:         { min: 300,  max: 10000, name: 'CO₂'          },
  Smoke:       { min: 0,    max: 1000,  name: 'Smoke'         },
  NH3:         { min: 0,    max: 500,   name: 'NH₃'           },
  Benzene:     { min: 0,    max: 1000,  name: 'Benzene'       },
  LPG:         { min: 0,    max: 10000, name: 'LPG'           },
  Dust:        { min: 0,    max: 1000,  name: 'Dust PM2.5'    },
  Rain:        { min: 0,    max: 100,   name: 'Rain'          },
  Pressure:    { min: 870,  max: 1085,  name: 'Pressure'      },
  Temperature: { min: -40,  max: 85,    name: 'Temperature'   },
  Humidity:    { min: 0,    max: 100,   name: 'Humidity'      },
  Altitude:    { min: -500, max: 9000,  name: 'Altitude'      },
  PMS1:        { min: 0,    max: 1000,  name: 'PM1.0'         },
  PMS25:       { min: 0,    max: 1000,  name: 'PM2.5'         },
  PMS10:       { min: 0,    max: 2000,  name: 'PM10'          },
};

export function assessSensorReliability(
  readings: Record<string, number | null>,
  history: Record<string, { value: number; timestamp: string }[]>,
): ReliabilityResult {
  const sensors: SensorReliability[] = Object.entries(SENSOR_BOUNDS).map(([id, bounds]) => {
    const inp: ReliabilityInput = {
      id,
      name: bounds.name,
      currentValue: readings[id] ?? null,
      history: history[id] ?? [],
      physicalMin: bounds.min,
      physicalMax: bounds.max,
    };
    const { status, message } = detectStatus(inp);
    return { id, name: bounds.name, status, message, color: statusColor(status), lastValidValue: readings[id] ?? undefined };
  });

  const offlineCount  = sensors.filter(s => s.status === 'Offline' || s.status === 'Invalid').length;
  const degradedCount = sensors.filter(s => s.status === 'Frozen'  || s.status === 'Spike').length;

  return {
    sensors,
    offlineCount,
    degradedCount,
    allHealthy: offlineCount === 0 && degradedCount === 0,
    hasMaintenanceAlert: offlineCount > 0 || degradedCount > 1,
  };
}
