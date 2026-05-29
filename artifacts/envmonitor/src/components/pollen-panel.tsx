import { motion } from 'framer-motion';
import { Flower2, Wind, Droplets, Thermometer } from 'lucide-react';
import type { PollenResult } from '@/lib/engines/pollen';

interface PollenPanelProps {
  pollen: PollenResult;
}

export function PollenPanel({ pollen }: PollenPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      className="glass-card rounded-2xl p-5 flex flex-col gap-3"
    >
      <div className="flex items-center gap-2">
        <Flower2 className="w-4 h-4" style={{ color: pollen.color }} />
        <h3 className="font-display font-bold text-foreground text-base">Pollen Prediction</h3>
      </div>

      {/* Activity + Allergy row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-secondary/50 rounded-xl p-3 space-y-1">
          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Pollen Activity</p>
          <p className="text-sm font-bold" style={{ color: pollen.color }}>{pollen.pollenActivity}</p>
        </div>
        <div className="bg-secondary/50 rounded-xl p-3 space-y-1">
          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Allergy Risk</p>
          <p className="text-sm font-bold" style={{ color: pollen.color }}>{pollen.allergyRisk}</p>
        </div>
      </div>

      {/* Outdoor safety bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground font-medium">Outdoor Safety Score</span>
          <span className="text-xs font-bold" style={{ color: pollen.color }}>
            {pollen.outdoorSafetyScore}/100 — {pollen.outdoorSafety}
          </span>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: pollen.color }}
            initial={{ width: '0%' }}
            animate={{ width: `${pollen.outdoorSafetyScore}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Recommendation */}
      <div
        className="text-xs leading-relaxed p-3 rounded-xl border"
        style={{ backgroundColor: pollen.color + '12', borderColor: pollen.color + '33', color: 'inherit' }}
      >
        <span className="font-semibold text-foreground">Recommendation: </span>
        <span className="text-muted-foreground">{pollen.recommendation}</span>
      </div>
    </motion.div>
  );
}
