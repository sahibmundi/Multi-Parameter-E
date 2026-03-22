import { useState } from "react";
import { ParameterConfig } from "@/hooks/use-sensor-data";
import { useTranslation } from "@/lib/i18n";
import { useAppStore } from "@/lib/store";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { format } from "date-fns";
import { Download, Clock } from "lucide-react";
import { exportToCSV } from "@/lib/utils";

interface ParameterChartProps {
  config: ParameterConfig;
  data: any[];
}

export function ParameterChart({ config, data }: ParameterChartProps) {
  const { language, theme } = useAppStore();
  const t = useTranslation(language);
  const [timeFilter, setTimeFilter] = useState<number>(100); // number of results

  const filteredData = data.slice(-timeFilter);

  // Theme-aware colors
  const strokeColor = theme === 'dark' ? 'hsl(190 100% 50%)' : 'hsl(221 83% 53%)';
  const gridColor = theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  const textColor = theme === 'dark' ? '#9ca3af' : '#4b5563';

  return (
    <div className="glass-card p-6 rounded-2xl flex flex-col h-[400px]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h3 className="text-xl font-display font-bold text-foreground flex items-center gap-2">
            {t[config.nameKey as keyof typeof t] as string}
            <span className="text-sm font-sans text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
              {config.unit}
            </span>
          </h3>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-secondary/50 p-1 rounded-lg border border-border/50">
            {[
               { label: '30', value: 30 },
               { label: '60', value: 60 },
               { label: '100', value: 100 }
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => setTimeFilter(f.value)}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1
                  ${timeFilter === f.value 
                    ? 'bg-primary text-primary-foreground shadow-md' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                  }`}
              >
                <Clock className="w-3 h-3 hidden sm:block" />
                {f.label} pts
              </button>
            ))}
          </div>

          <button 
            onClick={() => exportToCSV(filteredData, `export_${config.id}`)}
            className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-lg transition-colors text-sm font-bold"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">{t.downloadCSV}</span>
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 w-full relative">
        {filteredData.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            No data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={filteredData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id={`colorValue_${config.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={strokeColor} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={strokeColor} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis 
                dataKey="timestamp" 
                tickFormatter={(timeStr) => format(new Date(timeStr), 'HH:mm')}
                stroke={gridColor}
                tick={{ fill: textColor, fontSize: 12 }}
                minTickGap={30}
              />
              <YAxis 
                stroke={gridColor}
                tick={{ fill: textColor, fontSize: 12 }}
                domain={['auto', 'auto']}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
                }}
                labelStyle={{ color: 'hsl(var(--muted-foreground))', marginBottom: '4px' }}
                itemStyle={{ color: strokeColor, fontWeight: 'bold' }}
                labelFormatter={(label) => format(new Date(label), 'MMM dd, HH:mm:ss')}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke={strokeColor} 
                strokeWidth={2}
                fillOpacity={1} 
                fill={`url(#colorValue_${config.id})`} 
                animationDuration={500}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
