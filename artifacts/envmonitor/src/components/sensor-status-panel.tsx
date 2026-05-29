import { motion } from 'framer-motion';
import { CheckCircle, AlertTriangle, WifiOff, Pause, Zap } from 'lucide-react';
import type { ReliabilityResult, SensorStatus } from '@/lib/engines/sensor-reliability';

interface SensorStatusPanelProps {
  reliability: ReliabilityResult;
}

const STATUS_ICONS: Record<SensorStatus, React.ComponentType<{ className?: string }>> = {
  Online:  CheckCircle,
  Offline: WifiOff,
  Frozen:  Pause,
  Spike:   Zap,
  Invalid: AlertTriangle,
};

export function SensorStatusPanel({ reliability }: SensorStatusPanelProps) {
  const { sensors, allHealthy, offlineCount, degradedCount } = reliability;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="glass-card rounded-2xl p-5 flex flex-col gap-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-display font-bold text-foreground text-base">Sensor Reliability</h3>
        {allHealthy ? (
          <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full">
            <CheckCircle className="w-3 h-3" />All Online
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-xs font-bold text-amber-500 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-full">
            <AlertTriangle className="w-3 h-3" />
            {offlineCount > 0 ? `${offlineCount} Offline` : `${degradedCount} Degraded`}
          </span>
        )}
      </div>

      {!allHealthy && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-600 dark:text-amber-400">
          Maintenance alert: {offlineCount > 0 ? `${offlineCount} sensor(s) offline or invalid.` : `${degradedCount} sensor(s) showing abnormal readings.`} Check hardware connections.
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {sensors.map(sensor => {
          const Icon = STATUS_ICONS[sensor.status];
          return (
            <div
              key={sensor.id}
              className="flex items-center gap-2 p-2 rounded-xl bg-secondary/40 border border-border/50"
              title={sensor.message}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: sensor.color }} />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">{sensor.name}</p>
                <p className="text-[10px] font-medium" style={{ color: sensor.color }}>{sensor.status}</p>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
