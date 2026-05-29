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
  unit: string;
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

  // Offline: no data at all
  if (currentValue === null || currentValue === undefined || isNaN(currentValue)) {
    return { status: 'Offline', message: 'No data received from sensor.' };
  }

  // Invalid: outside physical range
  if (currentValue < physicalMin || currentValue > physicalMax) {
    return {
      status: 'Invalid',
      message: `Value ${currentValue.toFixed(1)} is outside physical range [${physicalMin}–${physicalMax}].`,
    };
  }

  // Need at least 3 history points for frozen / spike detection
  if (history.length >= 3) {
    const recent = history.slice(-5).map(h => h.value).filter(v => !isNaN(v));

    // Frozen: last 5 readings identical
    if (recent.length >= 4) {
      const allSame = recent.every(v => Math.abs(v - recent[0]) < 0.001);
      if (allSame) {
        return { status: 'Frozen', message: `Sensor value stuck at ${recent[0].toFixed(2)} for ${recent.length} consecutive readings.` };
      }
    }

    // Spike: current value deviates >3× std dev from recent mean
    if (recent.length >= 3) {
      const mean = recent.reduce((a, b) => a + b, 0) / recent.length;
      const variance = recent.reduce((a, b) => a + (b - mean) ** 2, 0) / recent.length;
      const std = Math.sqrt(variance);
      if (std > 0.1 && Math.abs(currentValue - mean) > 3 * std && Math.abs(currentValue - mean) > 10) {
        return {
          status: 'Spike',
          message: `Abnormal spike detected: ${currentValue.toFixed(1)} vs mean ${mean.toFixed(1)} (±${std.toFixed(1)}).`,
        };
      }
    }
  }

  return { status: 'Online', message: 'Sensor operating normally.' };
}

function statusColor(status: SensorStatus): string {
  switch (status) {
    case 'Online':  return '#22c55e';
    case 'Offline': return '#6b7280';
    case 'Frozen':  return '#3b82f6';
    case 'Spike':   return '#f97316';
    case 'Invalid': return '#ef4444';
  }
}

export function assessSensorReliability(inputs: ReliabilityInput[]): ReliabilityResult {
  const sensors: SensorReliability[] = inputs.map(inp => {
    const { status, message } = detectStatus(inp);
    return {
      id: inp.id,
      name: inp.name,
      status,
      message,
      color: statusColor(status),
      lastValidValue: inp.currentValue ?? undefined,
    };
  });

  const offlineCount   = sensors.filter(s => s.status === 'Offline' || s.status === 'Invalid').length;
  const degradedCount  = sensors.filter(s => s.status === 'Frozen'  || s.status === 'Spike').length;
  const allHealthy     = offlineCount === 0 && degradedCount === 0;
  const hasMaintenanceAlert = offlineCount > 0 || degradedCount > 1;

  return { sensors, offlineCount, degradedCount, allHealthy, hasMaintenanceAlert };
}

// Physical range bounds for each sensor
export const SENSOR_BOUNDS: Record<string, { min: number; max: number; name: string }> = {
  co2:         { min: 300,    max: 10000, name: 'CO₂'         },
  smoke:       { min: 0,      max: 1000,  name: 'Smoke'       },
  nh3:         { min: 0,      max: 500,   name: 'NH₃'         },
  benzene:     { min: 0,      max: 1000,  name: 'Benzene'     },
  lpg:         { min: 0,      max: 10000, name: 'LPG'         },
  dust:        { min: 0,      max: 1000,  name: 'Dust PM2.5'  },
  rain:        { min: 0,      max: 100,   name: 'Rain'        },
  pressure:    { min: 870,    max: 1085,  name: 'Pressure'    },
  temperature: { min: -40,    max: 85,    name: 'Temperature' },
  humidity:    { min: 0,      max: 100,   name: 'Humidity'    },
  altitude:    { min: -500,   max: 9000,  name: 'Altitude'    },
};
