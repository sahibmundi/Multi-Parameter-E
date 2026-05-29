import { motion } from 'framer-motion';
import type { AQIResult } from '@/lib/engines/aqi';

interface AQIPanelProps {
  aqi: AQIResult;
}

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  'Good': 'Air quality is satisfactory. Little or no risk.',
  'Moderate': 'Acceptable quality. Unusually sensitive people should limit prolonged outdoor exertion.',
  'Unhealthy for Sensitive Groups': 'Sensitive groups may experience health effects. General public is less likely affected.',
  'Unhealthy': 'Everyone may begin to experience health effects. Sensitive groups may experience more serious effects.',
  'Very Unhealthy': 'Health alert. Everyone may experience serious health effects.',
  'Hazardous': 'Health warning of emergency conditions. The entire population is likely to be affected.',
};

const TICK_POSITIONS = [0, 50, 100, 150, 200, 300, 400, 500];
const BAND_COLORS = ['#22c55e', '#eab308', '#f97316', '#ef4444', '#a855f7', '#7f1d1d'];

export function AQIPanel({ aqi }: AQIPanelProps) {
  const pct = Math.min(100, (aqi.score / 500) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass-card rounded-2xl p-5 flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-display font-bold text-foreground text-base">Air Quality Index</h3>
        <span
          className="text-xs font-bold px-2.5 py-1 rounded-full"
          style={{ backgroundColor: aqi.color + '22', color: aqi.color, border: `1px solid ${aqi.color}44` }}
        >
          {aqi.category}
        </span>
      </div>

      {/* Score */}
      <div className="flex items-end gap-3">
        <span className="text-5xl font-display font-black" style={{ color: aqi.color }}>
          {aqi.score}
        </span>
        <div className="mb-1.5">
          <p className="text-xs text-muted-foreground">out of 500</p>
          <p className="text-xs font-semibold text-muted-foreground">
            Dominant: <span className="text-foreground">{aqi.dominantPollutant}</span>
          </p>
        </div>
      </div>

      {/* Gauge bar */}
      <div className="space-y-1">
        <div className="relative h-3 rounded-full overflow-hidden flex">
          {BAND_COLORS.map((c, i) => (
            <div key={i} className="flex-1" style={{ backgroundColor: c + '55' }} />
          ))}
          {/* Indicator */}
          <motion.div
            className="absolute top-0 h-full w-1 rounded-full"
            style={{ backgroundColor: aqi.color, left: `${pct}%`, transform: 'translateX(-50%)' }}
            initial={{ left: '0%' }}
            animate={{ left: `${pct}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
        <div className="flex justify-between text-[9px] text-muted-foreground font-mono">
          {TICK_POSITIONS.map(t => <span key={t}>{t}</span>)}
        </div>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">
        {CATEGORY_DESCRIPTIONS[aqi.category]}
      </p>
    </motion.div>
  );
}
