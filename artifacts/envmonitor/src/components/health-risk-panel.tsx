import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { HealthRisk, RiskLevel } from '@/lib/engines/health-risk';

interface HealthRiskPanelProps {
  risks: HealthRisk[];
}

const LEVEL_ORDER: RiskLevel[] = ['Critical', 'High', 'Moderate', 'Low'];

export function HealthRiskPanel({ risks }: HealthRiskPanelProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const sorted = [...risks].sort(
    (a, b) => LEVEL_ORDER.indexOf(a.riskLevel) - LEVEL_ORDER.indexOf(b.riskLevel)
  );
  const visible = showAll ? sorted : sorted.slice(0, 5);

  const critCount = risks.filter(r => r.riskLevel === 'Critical').length;
  const highCount = risks.filter(r => r.riskLevel === 'High').length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="glass-card rounded-2xl p-5 flex flex-col gap-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-display font-bold text-foreground text-base">Health Risk Engine</h3>
        <div className="flex gap-1.5">
          {critCount > 0 && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-500 border border-rose-500/30">
              {critCount} Critical
            </span>
          )}
          {highCount > 0 && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-500 border border-orange-500/30">
              {highCount} High
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {visible.map(risk => (
          <div key={risk.id}>
            <button
              onClick={() => setExpanded(expanded === risk.id ? null : risk.id)}
              className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-secondary/60 transition-colors text-left"
            >
              <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: risk.color }}
              />
              <span className="flex-1 text-sm font-semibold text-foreground">{risk.condition}</span>
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0"
                style={{ backgroundColor: risk.color + '22', color: risk.color }}
              >
                {risk.riskLevel}
              </span>
              {expanded === risk.id
                ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              }
            </button>

            <AnimatePresence>
              {expanded === risk.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-3 space-y-2">
                    <p className="text-xs text-muted-foreground leading-relaxed">{risk.description}</p>
                    {risk.triggers.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        <span className="text-[10px] text-muted-foreground font-semibold">Triggered by:</span>
                        {risk.triggers.map(tr => (
                          <span key={tr} className="text-[10px] px-1.5 py-0.5 bg-secondary rounded-md text-foreground font-mono">
                            {tr}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {sorted.length > 5 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="self-center text-xs font-semibold text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
        >
          {showAll ? <><ChevronUp className="w-3.5 h-3.5" /> Show less</> : <><ChevronDown className="w-3.5 h-3.5" /> Show all {sorted.length}</>}
        </button>
      )}
    </motion.div>
  );
}
