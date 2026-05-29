import { motion } from 'framer-motion';
import type { SafetyScoreResult } from '@/lib/engines/safety-score';
import { Shield } from 'lucide-react';

interface SafetyScoreWidgetProps {
  result: SafetyScoreResult;
}

export function SafetyScoreWidget({ result }: SafetyScoreWidgetProps) {
  const circumference = 2 * Math.PI * 38;
  const offset = circumference - (circumference * result.score) / 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.05 }}
      className="glass-card rounded-2xl p-5 flex flex-col gap-3"
    >
      <div className="flex items-center gap-2">
        <Shield className="w-4 h-4" style={{ color: result.color }} />
        <h3 className="font-display font-bold text-foreground text-base">Environmental Safety Score</h3>
      </div>

      <div className="flex items-center gap-5">
        {/* Mini ring */}
        <div className="relative shrink-0">
          <svg width="90" height="90" className="-rotate-90">
            <circle cx="45" cy="45" r="38" strokeWidth="8" fill="none" className="stroke-secondary" />
            <motion.circle
              cx="45" cy="45" r="38" strokeWidth="8" fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1, ease: 'easeOut' }}
              style={{ stroke: result.color }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-display font-black" style={{ color: result.color }}>
              {result.score}
            </span>
          </div>
        </div>

        {/* Category + breakdown */}
        <div className="flex-1 flex flex-col gap-2">
          <span
            className="self-start text-sm font-bold px-2.5 py-0.5 rounded-lg"
            style={{ backgroundColor: result.color + '22', color: result.color }}
          >
            {result.category}
          </span>
          <div className="space-y-1">
            {result.components.map(c => (
              <div key={c.label} className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: c.penalty > c.contribution * 0.6 ? '#ef4444' : c.penalty > c.contribution * 0.3 ? '#f97316' : '#22c55e' }}
                    initial={{ width: '0%' }}
                    animate={{ width: `${((c.contribution - c.penalty) / c.contribution) * 100}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground w-32 shrink-0">{c.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
