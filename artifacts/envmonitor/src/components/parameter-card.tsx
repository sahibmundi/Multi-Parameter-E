import { motion } from "framer-motion";
import { ParameterConfig, StatusLevel } from "@/hooks/use-sensor-data";
import { useTranslation } from "@/lib/i18n";
import { useAppStore } from "@/lib/store";
import { Activity, AlertTriangle, CheckCircle2 } from "lucide-react";

interface ParameterCardProps {
  config: ParameterConfig;
  data?: { value: number; status: StatusLevel };
  onClick?: () => void;
  isActive?: boolean;
}

export function ParameterCard({ config, data, onClick, isActive }: ParameterCardProps) {
  const { language } = useAppStore();
  const t = useTranslation(language);

  const value = data ? data.value.toFixed(1) : "--";
  const status = data?.status || "MODERATE"; // Fallback to avoid aggressive red if loading

  let glowClass = "glow-cyan";
  let textClass = "text-cyan-500 dark:text-cyan-400";
  let icon = <Activity className="w-5 h-5" />;

  if (data) {
    if (status === 'GOOD') {
      glowClass = "glow-green";
      textClass = "text-green-600 dark:text-green-400";
      icon = <CheckCircle2 className="w-5 h-5" />;
    } else if (status === 'MODERATE') {
      glowClass = "glow-yellow";
      textClass = "text-yellow-600 dark:text-yellow-400";
      icon = <Activity className="w-5 h-5" />;
    } else if (status === 'DANGEROUS') {
      glowClass = "glow-red border-red-500";
      textClass = "text-red-600 dark:text-red-400 font-bold";
      icon = <AlertTriangle className="w-5 h-5" />;
    }
  } else {
    // Loading state styling
    glowClass = "border-border/50";
    textClass = "text-muted-foreground";
  }

  // Active state styling overrides
  if (isActive) {
    glowClass += " ring-2 ring-primary/50 shadow-xl scale-[1.02] z-10";
  }

  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`glass-card p-3 rounded-xl cursor-pointer transition-all duration-300 relative overflow-hidden group ${glowClass} ${status === 'DANGEROUS' && data ? 'animate-pulse-fast' : ''}`}
    >
      {/* Decorative background grid line for cyberpunk feel */}
      <div className="absolute inset-0 opacity-10 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%,transparent_100%)] bg-[length:4px_4px] mix-blend-overlay group-hover:opacity-20 transition-opacity"></div>
      
      <div className="relative z-10 flex justify-between items-start">
        <div className="flex flex-col">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
            {t[config.nameKey as keyof typeof t] as string}
          </span>
          <div className="flex items-baseline gap-1">
            <span className={`text-2xl font-display font-bold ${textClass}`}>
              {value}
            </span>
            <span className="text-xs text-muted-foreground font-medium ml-1">
              {config.unit}
            </span>
          </div>
        </div>
        
        <div className={`p-2 rounded-lg bg-background/50 backdrop-blur-sm border ${glowClass.replace('glow-', 'border-').replace('shadow-', '')} shadow-none`}>
          <div className={textClass}>{icon}</div>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between">
        <span className={`text-xs font-bold uppercase tracking-widest ${textClass}`}>
          {data ? t[`status${status.charAt(0) + status.slice(1).toLowerCase()}` as keyof typeof t] as string : "---"}
        </span>
        <div className="h-1 flex-1 mx-3 bg-secondary rounded-full overflow-hidden">
          {data && (
            <div 
              className={`h-full ${status === 'GOOD' ? 'bg-green-500' : status === 'MODERATE' ? 'bg-yellow-500' : 'bg-red-500'}`}
              style={{ width: `${Math.min(100, Math.max(10, (data.value / (config.evaluate(100000) === 'DANGEROUS' ? data.value*2 : 100)) * 100))}%` }} // pseudo-bar width logic
            />
          )}
        </div>
      </div>
    </motion.div>
  );
}
