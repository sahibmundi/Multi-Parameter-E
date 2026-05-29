import { useState } from "react";
import Layout from "@/components/layout";
import { PARAMETERS, useSensorData, StatusLevel } from "@/hooks/use-sensor-data";
import { ParameterCard } from "@/components/parameter-card";
import { ParameterChart } from "@/components/parameter-chart";
import { VoiceAssistantFAB } from "@/components/voice-assistant-fab";
import { useTranslation } from "@/lib/i18n";
import { useAppStore } from "@/lib/store";
import { format } from "date-fns";
import {
  AlertTriangle, Download, RefreshCw, Settings, X,
  CheckCircle, Thermometer, Droplets, Gauge, CloudRain,
  Wind, TrendingUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { exportToCSV } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";

const SCORE_LABEL = (s: number) => s >= 80 ? 'Excellent' : s >= 60 ? 'Good' : s >= 40 ? 'Fair' : 'Critical';
const SCORE_COLOR = (s: number) =>
  s >= 80 ? { ring: 'score-ring-fill-good',   text: 'text-emerald-500 dark:text-emerald-400',  bg: 'bg-emerald-500/10' } :
  s >= 60 ? { ring: 'score-ring-fill-mod',    text: 'text-amber-500   dark:text-amber-400',    bg: 'bg-amber-500/10'   } :
             { ring: 'score-ring-fill-danger', text: 'text-rose-500    dark:text-rose-400',     bg: 'bg-rose-500/10'    };

// Compact weather-tile params for hero row
const HERO_PARAMS = ['temperature', 'humidity', 'pressure', 'rain', 'co2', 'dust'] as const;

export default function Dashboard() {
  const { language } = useAppStore();
  const t = useTranslation(language);
  const { latestData, historicalData, score, dangerousCount, lastUpdated, isLoading, isError, raw } = useSensorData(100);

  const [selectedParamId, setSelectedParamId] = useState<string>(PARAMETERS[0].id);
  const [showConfig, setShowConfig] = useState(false);
  const [ch1Id, setCh1Id] = useState(() => localStorage.getItem('ts_channel1_id') || '3307420');
  const [ch2Id, setCh2Id] = useState(() => localStorage.getItem('ts_channel2_id') || '3307422');
  const queryClient = useQueryClient();

  const sc = SCORE_COLOR(score);
  const circumference = 2 * Math.PI * 54; // r=54

  const saveConfig = () => {
    if (ch1Id.trim()) localStorage.setItem('ts_channel1_id', ch1Id.trim());
    if (ch2Id.trim()) localStorage.setItem('ts_channel2_id', ch2Id.trim());
    queryClient.invalidateQueries({ queryKey: ['thingspeak'] });
    setShowConfig(false);
  };

  const handleDownloadAll = () => {
    if (!raw.ch1 || !raw.ch2) return;
    const merged = raw.ch1.map((f1: any, i: number) => {
      const f2 = raw.ch2?.[i] || {};
      return { ...f1, ...f2, timestamp: f1.created_at || f2.created_at };
    });
    exportToCSV(merged, 'env_monitor_full_export');
  };

  // Dangerous params for alert list
  const dangerParams = PARAMETERS.filter(p => latestData[p.id]?.status === 'DANGEROUS');
  const moderateParams = PARAMETERS.filter(p => latestData[p.id]?.status === 'MODERATE');

  return (
    <Layout>
      {/* ── Critical Overlay ──────────────────────────────────── */}
      <AnimatePresence>
        {dangerousCount > 2 && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 pointer-events-none flex items-start justify-center pt-20"
          >
            <div className="absolute inset-0 bg-rose-600/10 backdrop-blur-[1px]" />
            <motion.div
              initial={{ y: -20, scale: 0.9 }} animate={{ y: 0, scale: 1 }}
              className="relative bg-rose-600 text-white px-8 py-4 rounded-2xl font-display font-bold text-2xl shadow-2xl flex items-center gap-3 pointer-events-auto"
            >
              <AlertTriangle className="w-7 h-7 animate-bounce" />
              {t.criticalAlert}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Settings Modal ─────────────────────────────────────── */}
      <AnimatePresence>
        {showConfig && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm px-4"
            onClick={(e) => e.target === e.currentTarget && setShowConfig(false)}
          >
            <motion.div
              initial={{ scale: 0.94, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.94, y: 16 }}
              className="glass-card rounded-2xl p-7 w-full max-w-md shadow-2xl"
            >
              <div className="flex justify-between items-center mb-5">
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-primary" />
                  <h2 className="font-display font-bold text-lg text-foreground">ThingSpeak Channels</h2>
                </div>
                <button onClick={() => setShowConfig(false)} className="p-1 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
                Channels <span className="font-mono text-foreground">3307420</span> and <span className="font-mono text-foreground">3307422</span> are pre-configured. Update below to connect different sensors.
              </p>

              <div className="space-y-4">
                {[
                  { label: 'Channel 1 ID', hint: 'CO₂, Smoke, NH₃, Benzene, LPG, Dust, Rain, Pressure', val: ch1Id, set: setCh1Id },
                  { label: 'Channel 2 ID', hint: 'Temperature, Humidity, Altitude', val: ch2Id, set: setCh2Id },
                ].map(({ label, hint, val, set }) => (
                  <div key={label}>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                      {label} <span className="normal-case font-normal text-muted-foreground/60">— {hint}</span>
                    </label>
                    <input
                      type="text"
                      value={val}
                      onChange={(e) => set(e.target.value)}
                      className="w-full px-4 py-2.5 bg-secondary/50 border border-border rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono text-sm transition-shadow"
                    />
                  </div>
                ))}
              </div>

              <button
                onClick={saveConfig}
                className="w-full mt-5 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-lg flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Save & Reconnect
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-8 pb-32">

        {/* ── Hero: Score + Status ───────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

          {/* Score ring */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}
            className="lg:col-span-2 glass-card rounded-2xl p-7 flex flex-col items-center justify-center gap-4 relative overflow-hidden"
          >
            <div className={`absolute inset-0 ${sc.bg} rounded-2xl pointer-events-none`} />
            <p className="font-display font-bold text-sm uppercase tracking-widest text-muted-foreground z-10">{t.overallScore}</p>

            <div className="relative z-10">
              <svg width="140" height="140" className="-rotate-90">
                <circle cx="70" cy="70" r="54" strokeWidth="10" fill="none" className="score-ring-track" />
                <circle
                  cx="70" cy="70" r="54" strokeWidth="10" fill="none"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={isLoading ? circumference : circumference - (circumference * score) / 100}
                  className={`${sc.ring} transition-all duration-1000 ease-out`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-4xl font-display font-black ${sc.text}`}>
                  {isLoading ? '—' : score}
                </span>
                <span className="text-xs font-bold text-muted-foreground">/ 100</span>
              </div>
            </div>

            <div className="z-10 text-center">
              <span className={`text-lg font-display font-bold ${sc.text}`}>
                {isLoading ? '…' : SCORE_LABEL(score)}
              </span>
              <p className="text-xs text-muted-foreground mt-1">
                {lastUpdated ? `${t.lastUpdated}: ${format(lastUpdated, 'HH:mm:ss')}` : 'Connecting…'}
              </p>
            </div>
          </motion.div>

          {/* Status + Insights */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-3 glass-card rounded-2xl p-6 flex flex-col gap-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-foreground text-lg">{t.aiInsights}</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowConfig(true)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                  title="Settings"
                >
                  <Settings className="w-4 h-4" />
                </button>
                <button
                  onClick={() => queryClient.invalidateQueries({ queryKey: ['thingspeak'] })}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                  title="Refresh"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {isLoading ? (
              <div className="space-y-3 flex-1">
                {[3, 2, 1.5].map((w, i) => (
                  <div key={i} className="h-3 bg-secondary rounded-full animate-pulse" style={{ width: `${w * 25}%` }} />
                ))}
              </div>
            ) : isError ? (
              <div className="flex-1 flex items-center">
                <div className="w-full p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-600 dark:text-rose-400 text-sm font-medium">
                  Unable to reach ThingSpeak. Check your connection or channel IDs.
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col gap-3">
                <p className={`text-sm leading-relaxed border-l-2 pl-3 py-0.5 ${
                  dangerousCount > 0 ? 'border-rose-500 text-rose-600 dark:text-rose-400' :
                  moderateParams.length > 0 ? 'border-amber-500 text-amber-600 dark:text-amber-400' :
                  'border-emerald-500 text-muted-foreground'
                }`}>
                  {dangerousCount > 0 ? t.insightDanger : moderateParams.length > 0 ? t.insightWarning : t.insightSafe}
                </p>

                {(dangerParams.length > 0 || moderateParams.length > 0) && (
                  <div className="flex flex-wrap gap-2">
                    {dangerParams.map(p => (
                      <span key={p.id} className="flex items-center gap-1 px-2.5 py-1 bg-rose-500/12 border border-rose-500/30 rounded-lg text-xs font-bold text-rose-600 dark:text-rose-400">
                        <AlertTriangle className="w-3 h-3" />
                        {t[p.nameKey as keyof typeof t] as string}
                      </span>
                    ))}
                    {moderateParams.map(p => (
                      <span key={p.id} className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/12 border border-amber-500/30 rounded-lg text-xs font-semibold text-amber-600 dark:text-amber-400">
                        {t[p.nameKey as keyof typeof t] as string}
                      </span>
                    ))}
                  </div>
                )}

                {/* Quick weather snapshot */}
                <div className="mt-auto grid grid-cols-3 gap-2">
                  {[
                    { id: 'temperature', icon: Thermometer, label: '°C' },
                    { id: 'humidity',    icon: Droplets,    label: '%' },
                    { id: 'pressure',    icon: Gauge,       label: 'hPa' },
                  ].map(({ id, icon: Icon, label }) => {
                    const d = latestData[id];
                    return (
                      <div key={id} className="flex items-center gap-2 bg-secondary/50 rounded-xl px-3 py-2">
                        <Icon className="w-3.5 h-3.5 text-primary shrink-0" />
                        <div>
                          <p className="text-[10px] text-muted-foreground capitalize">{id}</p>
                          <p className="text-sm font-bold text-foreground leading-tight">
                            {d ? `${d.value.toFixed(0)}${label}` : '—'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* ── Sensor Grid ───────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-xl text-foreground">{t.parameters}</h2>
            <button
              onClick={handleDownloadAll}
              disabled={!raw.ch1}
              className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/25 rounded-xl transition-all text-sm font-bold disabled:opacity-40"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">{t.downloadAll}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3">
            {PARAMETERS.map((config, i) => (
              <motion.div
                key={config.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.04 }}
              >
                <ParameterCard
                  config={config}
                  data={latestData[config.id]}
                  isActive={selectedParamId === config.id}
                  onClick={() => setSelectedParamId(config.id)}
                />
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── Historical Charts ──────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-1 h-7 bg-primary rounded-full" />
            <h2 className="font-display font-bold text-xl text-foreground">{t.historicalData}</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {PARAMETERS.map((config) => (
              <ParameterChart
                key={config.id}
                config={config}
                data={historicalData[config.id] || []}
              />
            ))}
          </div>
        </div>
      </div>

      <VoiceAssistantFAB />
    </Layout>
  );
}
