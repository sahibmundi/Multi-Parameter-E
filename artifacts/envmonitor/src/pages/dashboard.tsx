import { useState, useEffect } from "react";
import Layout from "@/components/layout";
import { PARAMETERS, useSensorData } from "@/hooks/use-sensor-data";
import { ParameterCard } from "@/components/parameter-card";
import { ParameterChart } from "@/components/parameter-chart";
import { VoiceAssistantFAB } from "@/components/voice-assistant-fab";
import { useTranslation } from "@/lib/i18n";
import { useAppStore } from "@/lib/store";
import { format } from "date-fns";
import { AlertTriangle, Download, RefreshCw, Zap, Settings, X, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { exportToCSV } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";

export default function Dashboard() {
  const { language } = useAppStore();
  const t = useTranslation(language);
  const { latestData, historicalData, score, dangerousCount, lastUpdated, isLoading, isError, raw } = useSensorData(100);
  
  const [selectedParamId, setSelectedParamId] = useState<string>(PARAMETERS[0].id);
  const [showConfig, setShowConfig] = useState(false);
  const [ch1Id, setCh1Id] = useState(() => localStorage.getItem('ts_channel1_id') || '');
  const [ch2Id, setCh2Id] = useState(() => localStorage.getItem('ts_channel2_id') || '');
  const queryClient = useQueryClient();

  const needsConfig = !localStorage.getItem('ts_channel1_id') || !localStorage.getItem('ts_channel2_id');

  const saveConfig = () => {
    if (ch1Id.trim()) localStorage.setItem('ts_channel1_id', ch1Id.trim());
    if (ch2Id.trim()) localStorage.setItem('ts_channel2_id', ch2Id.trim());
    queryClient.invalidateQueries({ queryKey: ['thingspeak'] });
    setShowConfig(false);
  };

  // Handle Full Download
  const handleDownloadAll = () => {
    if (!raw.ch1 || !raw.ch2) return;
    
    // Simplistic merge for download based on index (assuming synchronous feeds)
    const merged = raw.ch1.map((feed1, i) => {
      const feed2 = raw.ch2?.[i] || {};
      return { ...feed1, ...feed2, timestamp: feed1.created_at || feed2.created_at };
    });
    
    exportToCSV(merged, 'full_env_data');
  };

  const selectedParamConfig = PARAMETERS.find(p => p.id === selectedParamId)!;
  const selectedParamData = historicalData[selectedParamId] || [];

  return (
    <Layout>
      {/* Critical Alert Overlay */}
      <AnimatePresence>
        {dangerousCount > 2 && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 pointer-events-none flex flex-col items-center justify-center bg-red-950/20 backdrop-blur-[2px]"
          >
            <div className="absolute inset-0 shadow-[inset_0_0_150px_rgba(239,68,68,0.5)] animate-pulse-fast"></div>
            <div className="bg-red-600/90 text-white px-8 py-4 rounded-full font-display font-bold text-3xl shadow-[0_0_50px_rgba(239,68,68,1)] flex items-center gap-4 animate-bounce">
              <AlertTriangle className="w-10 h-10" />
              {t.criticalAlert}
              <AlertTriangle className="w-10 h-10" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Channel ID Config Modal */}
      <AnimatePresence>
        {showConfig && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && setShowConfig(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass-card rounded-2xl p-8 w-full max-w-md mx-4 shadow-2xl border border-primary/30"
            >
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <Settings className="w-6 h-6 text-primary" />
                  <h2 className="text-xl font-display font-bold text-foreground">ThingSpeak Setup</h2>
                </div>
                <button onClick={() => setShowConfig(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <p className="text-sm text-muted-foreground mb-6">
                Enter your ThingSpeak Channel IDs to connect your sensor data. You can find the Channel ID on your ThingSpeak channel page.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">
                    Channel 1 ID <span className="text-muted-foreground font-normal normal-case">(CO₂, Smoke, NH₃, Benzene, LPG, Dust)</span>
                  </label>
                  <input
                    type="text"
                    value={ch1Id}
                    onChange={(e) => setCh1Id(e.target.value)}
                    placeholder="e.g. 2967551"
                    className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono"
                  />
                </div>
                
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">
                    Channel 2 ID <span className="text-muted-foreground font-normal normal-case">(Rain, Pressure, Temperature, Humidity, Altitude)</span>
                  </label>
                  <input
                    type="text"
                    value={ch2Id}
                    onChange={(e) => setCh2Id(e.target.value)}
                    placeholder="e.g. 2967552"
                    className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono"
                  />
                </div>
              </div>

              <div className="mt-6 bg-primary/10 border border-primary/20 rounded-xl p-3 text-xs text-muted-foreground">
                <p>API Keys are pre-configured: <code className="text-primary">14MJF61H...</code> and <code className="text-primary">VJHHEWZO...</code></p>
              </div>

              <button
                onClick={saveConfig}
                disabled={!ch1Id.trim() || !ch2Id.trim()}
                className="w-full mt-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_hsl(var(--primary)/0.4)] hover:shadow-[0_0_25px_hsl(var(--primary)/0.6)] transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                Connect to ThingSpeak
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-8 pb-32">
        {/* Setup Banner */}
        {needsConfig && !showConfig && (
          <div className="glass-card rounded-2xl p-5 border border-yellow-500/40 bg-yellow-500/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Settings className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-foreground">Setup Required</h3>
                <p className="text-sm text-muted-foreground mt-0.5">Enter your ThingSpeak Channel IDs to connect live sensor data to the dashboard.</p>
              </div>
            </div>
            <button
              onClick={() => setShowConfig(true)}
              className="px-5 py-2 bg-yellow-500 text-black font-bold rounded-xl hover:bg-yellow-400 transition-colors whitespace-nowrap flex-shrink-0"
            >
              Configure Now
            </button>
          </div>
        )}
        {/* Top Section: Score & Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Score Card */}
          <div className="lg:col-span-1 glass-card p-8 rounded-3xl flex flex-col items-center justify-center relative overflow-hidden">
            <div className={`absolute -inset-10 opacity-20 blur-3xl rounded-full ${score > 80 ? 'bg-green-500' : score > 50 ? 'bg-yellow-500' : 'bg-red-500'}`} />
            
            <h2 className="text-xl font-display text-muted-foreground uppercase tracking-widest z-10">
              {t.overallScore}
            </h2>
            
            <div className="relative mt-6 z-10 flex items-center justify-center">
              <svg className="w-48 h-48 transform -rotate-90">
                <circle cx="96" cy="96" r="88" className="stroke-secondary/50" strokeWidth="12" fill="none" />
                <circle 
                  cx="96" cy="96" r="88" 
                  className={`transition-all duration-1000 ease-out ${score > 80 ? 'stroke-green-500' : score > 50 ? 'stroke-yellow-500' : 'stroke-red-500'}`} 
                  strokeWidth="12" 
                  fill="none" 
                  strokeDasharray="552.92" // 2 * PI * 88
                  strokeDashoffset={552.92 - (552.92 * score) / 100}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-6xl font-display font-bold text-foreground text-shadow-neon-cyan">
                  {isLoading ? '--' : score}
                </span>
                <span className="text-sm font-bold text-muted-foreground">/ 100</span>
              </div>
            </div>
            
            <div className="mt-6 text-center z-10">
              <span className="text-sm text-muted-foreground block mb-1">{t.lastUpdated}</span>
              <span className="font-mono text-foreground font-medium">
                {lastUpdated ? format(lastUpdated, 'MMM dd, yyyy HH:mm:ss') : 'Connecting...'}
              </span>
            </div>
          </div>

          {/* AI Insights & Alerts */}
          <div className="lg:col-span-2 glass-card p-6 rounded-3xl flex flex-col relative overflow-hidden">
             <div className="flex items-center gap-2 mb-4 text-primary">
                <Zap className="w-6 h-6" />
                <h2 className="text-xl font-display font-bold text-foreground">{t.aiInsights}</h2>
             </div>
             
             <div className="flex-1 flex flex-col justify-center space-y-4 relative z-10">
                {isLoading ? (
                  <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-secondary rounded w-3/4"></div>
                    <div className="h-4 bg-secondary rounded w-1/2"></div>
                  </div>
                ) : isError ? (
                  <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500">
                    Connection Error: Unable to reach ThingSpeak API.
                  </div>
                ) : (
                  <>
                    <p className="text-lg leading-relaxed text-muted-foreground border-l-4 border-primary pl-4 py-1">
                      {dangerousCount === 0 
                        ? (score < 100 ? t.insightWarning : t.insightSafe)
                        : t.insightDanger}
                    </p>
                    
                    {dangerousCount > 0 && (
                      <div className="mt-4 p-4 bg-red-500/10 border border-red-500/50 rounded-xl">
                        <h4 className="font-bold text-red-500 dark:text-red-400 mb-2 flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5" /> {t.voiceWarning}
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {PARAMETERS.filter(p => latestData[p.id]?.status === 'DANGEROUS').map(p => (
                            <span key={p.id} className="px-3 py-1 bg-red-500/20 text-red-600 dark:text-red-400 font-bold rounded-lg border border-red-500/30">
                              {t[p.nameKey as keyof typeof t] as string}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
             </div>

             <div className="absolute -bottom-10 -right-10 opacity-5 pointer-events-none">
                <Zap className="w-48 h-48" />
             </div>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 py-2 border-b border-border/50">
          <h2 className="text-2xl font-display font-bold text-foreground">{t.parameters}</h2>
          <div className="flex gap-3">
            <button 
              onClick={() => setShowConfig(true)}
              className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-xl transition-colors font-medium"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-xl transition-colors font-medium">
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Sensor Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 items-start">
          {PARAMETERS.map((config) => (
            <ParameterCard 
              key={config.id} 
              config={config} 
              data={latestData[config.id]} 
              isActive={selectedParamId === config.id}
              onClick={() => setSelectedParamId(config.id)}
            />
          ))}
        </div>

        {/* Historical Analysis — all parameters */}
        <div className="mt-10">
          <div className="flex items-center gap-3 mb-6 pb-3 border-b border-border/50">
            <div className="w-1 h-8 bg-primary rounded-full shadow-[0_0_10px_hsl(var(--primary))]" />
            <h2 className="text-2xl font-display font-bold text-foreground tracking-wide">
              Historical Analysis
            </h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
