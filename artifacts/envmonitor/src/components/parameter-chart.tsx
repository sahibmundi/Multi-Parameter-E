import { useState } from "react";
import { ParameterConfig } from "@/hooks/use-sensor-data";
import { useTranslation } from "@/lib/i18n";
import { useAppStore } from "@/lib/store";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from "date-fns";
import { Download } from "lucide-react";
import { exportToCSV } from "@/lib/utils";

interface ParameterChartProps {
  config: ParameterConfig;
  data: any[];
}

export function ParameterChart({ config, data }: ParameterChartProps) {
  const { language, theme } = useAppStore();
  const t = useTranslation(language);
  const [timeFilter, setTimeFilter] = useState(100);

  const filteredData = data.slice(-timeFilter);

  const strokeColor = theme === 'dark' ? 'hsl(199 89% 60%)' : 'hsl(199 85% 42%)';
  const fillId = `fill_${config.id}`;
  const gridColor = theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)';
  const textColor = theme === 'dark' ? '#64748b' : '#94a3b8';

  return (
    <div className="glass-card p-5 rounded-2xl flex flex-col" style={{ height: 340 }}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 gap-3">
        <div className="flex items-center gap-2">
          <div className="w-1 h-6 rounded-full" style={{ backgroundColor: strokeColor }} />
          <div>
            <h3 className="font-display font-bold text-foreground text-base leading-tight">
              {t[config.nameKey as keyof typeof t] as string}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">{config.unit}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-secondary/60 p-0.5 rounded-xl border border-border/40 gap-0.5">
            {[{ label: '30', value: 30 }, { label: '60', value: 60 }, { label: '100', value: 100 }].map(f => (
              <button
                key={f.value}
                onClick={() => setTimeFilter(f.value)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  timeFilter === f.value
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => exportToCSV(filteredData, `export_${config.id}`)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/25 rounded-xl transition-all text-xs font-bold"
            title="Download CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.downloadCSV}</span>
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 w-full">
        {filteredData.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-2 text-muted-foreground/50">
            <div className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center">
              <Download className="w-5 h-5" />
            </div>
            <p className="text-sm">No data available</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={filteredData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor={strokeColor} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={strokeColor} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(ts) => format(new Date(ts), 'HH:mm')}
                stroke="transparent"
                tick={{ fill: textColor, fontSize: 10 }}
                minTickGap={32}
              />
              <YAxis
                stroke="transparent"
                tick={{ fill: textColor, fontSize: 10 }}
                domain={['auto', 'auto']}
                width={40}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: theme === 'dark' ? 'hsl(215 38% 12%)' : '#ffffff',
                  border: `1px solid ${gridColor}`,
                  borderRadius: '12px',
                  boxShadow: '0 10px 32px rgba(0,0,0,0.2)',
                  padding: '8px 12px',
                }}
                labelStyle={{ color: textColor, fontSize: 11, marginBottom: 4 }}
                itemStyle={{ color: strokeColor, fontWeight: 700, fontSize: 13 }}
                labelFormatter={(label) => format(new Date(label), 'MMM d, HH:mm:ss')}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={strokeColor}
                strokeWidth={2}
                fillOpacity={1}
                fill={`url(#${fillId})`}
                dot={false}
                activeDot={{ r: 4, fill: strokeColor, stroke: 'white', strokeWidth: 2 }}
                animationDuration={600}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
