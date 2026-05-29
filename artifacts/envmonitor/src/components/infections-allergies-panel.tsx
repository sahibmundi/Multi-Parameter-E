import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Shield, AlertTriangle } from 'lucide-react';
import type { InfectionAllergyRisk, RiskLevel } from '@/lib/engines/infections-allergies';

interface InfectionsAllergiesPanelProps {
  risks: InfectionAllergyRisk[];
}

const CATEGORY_COLORS: Record<string, string> = {
  Infection:     'text-rose-500    bg-rose-500/10    border-rose-500/30',
  Allergy:       'text-amber-500   bg-amber-500/10   border-amber-500/30',
  Respiratory:   'text-orange-500  bg-orange-500/10  border-orange-500/30',
  Skin:          'text-purple-500  bg-purple-500/10  border-purple-500/30',
  Environmental: 'text-red-600     bg-red-500/10     border-red-500/30',
};

const LEVEL_ORDER: RiskLevel[] = ['Critical', 'High', 'Moderate', 'Low'];

function RiskCard({ risk, index }: { risk: InfectionAllergyRisk; index: number }) {
  const [open, setOpen] = useState(false);
  const catClass = CATEGORY_COLORS[risk.category] ?? CATEGORY_COLORS.Infection;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.03 }}
      className="border rounded-xl overflow-hidden bg-background/50"
      style={{ borderColor: risk.color + '33' }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 p-3 text-left hover:bg-secondary/30 transition-colors"
      >
        <span className="text-lg leading-none">{risk.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-foreground">{risk.name}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${catClass}`}>
              {risk.category}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{risk.description}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className="text-xs font-bold px-2.5 py-1 rounded-full border"
            style={{ color: risk.color, borderColor: risk.color + '55', backgroundColor: risk.color + '15' }}
          >
            {risk.riskLevel}
          </span>
          {open ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-border/50 pt-3">
              {/* Triggers */}
              {risk.primaryTriggers.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Triggers</p>
                  <div className="flex flex-wrap gap-1.5">
                    {risk.primaryTriggers.map(tr => (
                      <span key={tr} className="font-mono text-[10px] px-2 py-0.5 rounded bg-secondary text-foreground border border-border">
                        {tr}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Warnings */}
              {risk.warnings.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Warnings</p>
                  <div className="space-y-1">
                    {risk.warnings.map(w => (
                      <div key={w} className="flex items-start gap-2 text-[11px] text-rose-600 dark:text-rose-400 font-semibold">
                        <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                        {w}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Protections */}
              {risk.protections.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Protective Actions</p>
                  <div className="space-y-1">
                    {risk.protections.map(p => (
                      <div key={p} className="flex items-start gap-2 text-[11px] text-foreground">
                        <Shield className="w-3 h-3 mt-0.5 shrink-0 text-primary" />
                        {p}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function InfectionsAllergiesPanel({ risks }: InfectionsAllergiesPanelProps) {
  const [filterLevel, setFilterLevel] = useState<RiskLevel | 'All'>('All');

  const sorted = [...risks].sort(
    (a, b) => LEVEL_ORDER.indexOf(a.riskLevel) - LEVEL_ORDER.indexOf(b.riskLevel)
  );
  const filtered = filterLevel === 'All' ? sorted : sorted.filter(r => r.riskLevel === filterLevel);

  const counts = {
    Critical: risks.filter(r => r.riskLevel === 'Critical').length,
    High:     risks.filter(r => r.riskLevel === 'High').length,
    Moderate: risks.filter(r => r.riskLevel === 'Moderate').length,
    Low:      risks.filter(r => r.riskLevel === 'Low').length,
  };

  return (
    <div className="space-y-4">
      {/* Summary strip */}
      <div className="grid grid-cols-4 gap-2">
        {(['Critical', 'High', 'Moderate', 'Low'] as RiskLevel[]).map(lvl => {
          const colors: Record<RiskLevel, string> = {
            Critical: '#ef4444', High: '#f97316', Moderate: '#eab308', Low: '#22c55e',
          };
          const c = colors[lvl];
          return (
            <button
              key={lvl}
              onClick={() => setFilterLevel(filterLevel === lvl ? 'All' : lvl)}
              className="rounded-xl p-2.5 text-center transition-all border"
              style={{
                borderColor: filterLevel === lvl || filterLevel === 'All' ? c + '55' : 'transparent',
                backgroundColor: filterLevel === lvl ? c + '20' : 'transparent',
              }}
            >
              <p className="text-lg font-black" style={{ color: c }}>{counts[lvl]}</p>
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide">{lvl}</p>
            </button>
          );
        })}
      </div>

      {/* Warning banner for critical */}
      {counts.Critical > 0 && (
        <div className="flex items-start gap-2 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-600 dark:text-rose-400 font-semibold">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{counts.Critical} critical condition{counts.Critical > 1 ? 's' : ''} detected. Take immediate protective action — see details below.</span>
        </div>
      )}

      {/* Risk cards */}
      <div className="space-y-2">
        {filtered.map((risk, i) => (
          <RiskCard key={risk.id} risk={risk} index={i} />
        ))}
      </div>

      <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
        Risk assessments are computed from live sensor readings using epidemiological thresholds.<br />
        Not a substitute for medical advice — consult a healthcare professional if symptomatic.
      </p>
    </div>
  );
}
