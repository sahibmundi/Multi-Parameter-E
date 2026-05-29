import { motion } from "framer-motion";
import { ParameterConfig, StatusLevel } from "@/hooks/use-sensor-data";
import { useTranslation } from "@/lib/i18n";
import { useAppStore } from "@/lib/store";
import {
  Wind, CloudFog, FlaskConical, Zap, Flame, CloudSnow,
  CloudRain, Gauge, Thermometer, Droplets, TrendingUp,
  CheckCircle2, AlertTriangle, AlertCircle,
} from "lucide-react";

const ICON_MAP: Record<string, React.FC<any>> = {
  Wind, CloudFog, FlaskConical, Zap, Flame, CloudSnow,
  CloudRain, Gauge, Thermometer, Droplets, TrendingUp,
};

const STATUS_CONFIG = {
  GOOD:      { bg: 'bg-emerald-500/12', border: 'border-emerald-500/35', text: 'text-emerald-600 dark:text-emerald-400', badge: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30', bar: 'bg-emerald-500', glow: 'status-glow-good' },
  MODERATE:  { bg: 'bg-amber-500/12',   border: 'border-amber-500/35',   text: 'text-amber-600 dark:text-amber-400',     badge: 'bg-amber-500/15   text-amber-600   dark:text-amber-400   border-amber-500/30',   bar: 'bg-amber-500',   glow: 'status-glow-moderate' },
  DANGEROUS: { bg: 'bg-rose-500/12',    border: 'border-rose-500/40',    text: 'text-rose-600   dark:text-rose-400',     badge: 'bg-rose-500/15    text-rose-600    dark:text-rose-400    border-rose-500/30',    bar: 'bg-rose-500',    glow: 'status-glow-danger' },
};

const STATUS_ICON = {
  GOOD:      CheckCircle2,
  MODERATE:  AlertCircle,
  DANGEROUS: AlertTriangle,
};

interface ParameterCardProps {
  config: ParameterConfig;
  data?: { value: number; status: StatusLevel };
  onClick?: () => void;
  isActive?: boolean;
}

export function ParameterCard({ config, data, onClick, isActive }: ParameterCardProps) {
  const { language } = useAppStore();
  const t = useTranslation(language);

  const status: StatusLevel = data?.status ?? 'GOOD';
  const value = data ? data.value.toFixed(1) : null;
  const cfg = data ? STATUS_CONFIG[status] : STATUS_CONFIG.GOOD;

  const ParamIcon = ICON_MAP[config.icon] ?? Wind;
  const StatusIcon = STATUS_ICON[status];

  // Progress bar width (clamped 4%–100%)
  const pct = data
    ? Math.min(100, Math.max(4, (data.value / config.maxRef) * 100))
    : 0;

  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.015 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`
        glass-card rounded-2xl p-4 cursor-pointer border transition-all duration-300 relative overflow-hidden
        ${data ? cfg.border : 'border-border/40'}
        ${data ? cfg.glow : ''}
        ${isActive ? 'active-card ring-2 ring-primary/50' : ''}
      `}
    >
      {/* Soft background tint */}
      {data && (
        <div className={`absolute inset-0 ${cfg.bg} rounded-2xl pointer-events-none`} />
      )}

      <div className="relative z-10 flex flex-col gap-3">
        {/* Header row */}
        <div className="flex items-start justify-between">
          <div className={`p-2 rounded-xl ${data ? cfg.bg : 'bg-secondary/60'} border ${data ? cfg.border : 'border-border/30'}`}>
            <ParamIcon className={`w-4 h-4 ${data ? cfg.text : 'text-muted-foreground'}`} />
          </div>
          {data && (
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wide border ${cfg.badge}`}>
              <StatusIcon className="w-2.5 h-2.5" />
              {t[`status${status.charAt(0) + status.slice(1).toLowerCase()}` as keyof typeof t] as string}
            </div>
          )}
        </div>

        {/* Value */}
        <div>
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">
            {t[config.nameKey as keyof typeof t] as string}
          </p>
          {value !== null ? (
            <div className="flex items-baseline gap-1">
              <span className={`text-2xl font-display font-bold ${cfg.text}`}>{value}</span>
              <span className="text-xs text-muted-foreground font-medium">{config.unit}</span>
            </div>
          ) : (
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-display font-bold text-muted-foreground/40">—</span>
              <span className="text-xs text-muted-foreground/40">{config.unit}</span>
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="h-1.5 w-full bg-secondary/80 rounded-full overflow-hidden">
          {data && (
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className={`h-full rounded-full ${cfg.bar}`}
            />
          )}
        </div>
      </div>
    </motion.div>
  );
}
