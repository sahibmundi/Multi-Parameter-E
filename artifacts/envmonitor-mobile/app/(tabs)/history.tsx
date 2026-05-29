import { Feather } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MiniChart from '@/components/MiniChart';
import { useApp } from '@/context/AppContext';
import { SENSOR_CONFIGS, getLevel, AlertLevel } from '@/constants/thresholds';
import { sensorLabel } from '@/constants/translations';
import { fetchSensorHistory, HistoryPoint } from '@/services/thingspeak';

const LEVEL_COLORS: Record<AlertLevel, string> = {
  safe: '#00FF88', moderate: '#FFD700', unhealthy: '#FF8C00', severe: '#FF3366',
};

interface SensorHistory { id: string; data: HistoryPoint[]; loading: boolean }

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const { ch1Id, ch2Id, readings, lang } = useApp();
  const [selected, setSelected] = useState('Temperature');
  const [history, setHistory] = useState<SensorHistory[]>(
    SENSOR_CONFIGS.map((c) => ({ id: c.id, data: [], loading: false }))
  );

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  useEffect(() => {
    loadHistory(selected);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, ch1Id, ch2Id]);

  async function loadHistory(id: string) {
    setHistory((prev) => prev.map((h) => h.id === id ? { ...h, loading: true } : h));
    const data = await fetchSensorHistory(ch1Id, ch2Id, id, 40);
    setHistory((prev) => prev.map((h) => h.id === id ? { ...h, data, loading: false } : h));
  }

  const current = history.find((h) => h.id === selected);
  const cfg = SENSOR_CONFIGS.find((c) => c.id === selected);
  const latestVal = readings?.[selected as keyof typeof readings] as number | null ?? null;
  const level: AlertLevel = cfg && latestVal !== null ? getLevel(cfg, latestVal) : 'safe';
  const color = LEVEL_COLORS[level];

  const chartData = current?.data ?? [];
  const values = chartData.map((d) => d.value);
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 0;
  const avg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;

  return (
    <View style={[styles.root, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {lang === 'pa' ? 'ਇਤਿਹਾਸਕ ਡੇਟਾ' : lang === 'hi' ? 'ऐतिहासिक डेटा' : 'Historical Data'}
        </Text>
      </View>

      {/* Sensor picker */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.picker} contentContainerStyle={{ gap: 8, paddingHorizontal: 14, paddingVertical: 10 }}>
        {SENSOR_CONFIGS.map((c) => {
          const val = readings?.[c.id as keyof typeof readings] as number | null ?? null;
          const lvl: AlertLevel = val !== null ? getLevel(c, val) : 'safe';
          const col = LEVEL_COLORS[lvl];
          const isSelected = selected === c.id;
          return (
            <TouchableOpacity
              key={c.id}
              onPress={() => setSelected(c.id)}
              style={[
                styles.pickerChip,
                { borderColor: isSelected ? col : 'rgba(0,245,255,0.2)', backgroundColor: isSelected ? col + '22' : 'transparent' },
              ]}
            >
              <View style={[styles.pickerDot, { backgroundColor: col }]} />
              <Text style={[styles.pickerText, { color: isSelected ? col : '#6B8CAE' }]}>
                {sensorLabel(lang, c.id)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: botPad + 24 }]} showsVerticalScrollIndicator={false}>
        {/* Chart card */}
        <View style={[styles.chartCard, { borderColor: color + '44' }]}>
          <View style={styles.chartHeader}>
            <Text style={[styles.chartTitle, { color }]}>{sensorLabel(lang, selected)}</Text>
            <Text style={styles.chartUnit}>{cfg?.unit}</Text>
            {latestVal !== null && (
              <Text style={[styles.liveVal, { color }]}>{latestVal.toFixed(1)}</Text>
            )}
          </View>

          {current?.loading ? (
            <View style={styles.chartLoading}>
              <ActivityIndicator color="#00F5FF" />
              <Text style={styles.chartLoadingText}>
                {lang === 'pa' ? 'ਡੇਟਾ ਲੋਡ ਹੋ ਰਿਹਾ ਹੈ...' : lang === 'hi' ? 'डेटा लोड हो रहा है...' : 'Loading data...'}
              </Text>
            </View>
          ) : chartData.length < 2 ? (
            <View style={styles.chartLoading}>
              <Feather name="bar-chart-2" size={32} color="#4A5568" />
              <Text style={styles.chartLoadingText}>
                {lang === 'pa' ? 'ਕਾਫ਼ੀ ਡੇਟਾ ਨਹੀਂ' : lang === 'hi' ? 'पर्याप्त डेटा नहीं' : 'Not enough data yet'}
              </Text>
            </View>
          ) : (
            <View style={styles.chartWrap}>
              <View style={styles.yAxis}>
                <Text style={styles.axisLabel}>{max.toFixed(0)}</Text>
                <Text style={styles.axisLabel}>{avg.toFixed(0)}</Text>
                <Text style={styles.axisLabel}>{min.toFixed(0)}</Text>
              </View>
              <MiniChart data={chartData} color={color} width={270} height={120} />
            </View>
          )}

          {/* Stats row */}
          <View style={styles.stats}>
            {[
              { label: lang === 'pa' ? 'ਘੱਟੋ' : lang === 'hi' ? 'न्यूनतम' : 'Min', val: min },
              { label: lang === 'pa' ? 'ਔਸਤ' : lang === 'hi' ? 'औसत' : 'Avg', val: avg },
              { label: lang === 'pa' ? 'ਵੱਧੋ' : lang === 'hi' ? 'अधिकतम' : 'Max', val: max },
            ].map((s) => (
              <View key={s.label} style={styles.statCell}>
                <Text style={styles.statLabel}>{s.label}</Text>
                <Text style={[styles.statVal, { color }]}>{s.val.toFixed(1)}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity onPress={() => loadHistory(selected)} style={styles.reloadBtn}>
            <Feather name="refresh-cw" size={12} color="#00F5FF" />
            <Text style={styles.reloadText}>{lang === 'pa' ? 'ਤਾਜ਼ਾ ਕਰੋ' : lang === 'hi' ? 'रीफ्रेश' : 'Refresh'}</Text>
          </TouchableOpacity>
        </View>

        {/* Recent readings table */}
        <Text style={styles.tableTitle}>
          {lang === 'pa' ? 'ਤਾਜ਼ਾ ਰੀਡਿੰਗਾਂ' : lang === 'hi' ? 'हाल की रीडिंग' : 'Recent Readings'}
        </Text>
        <View style={styles.table}>
          <View style={styles.tableHead}>
            <Text style={styles.tableHeadText}>{lang === 'pa' ? 'ਸਮਾਂ' : lang === 'hi' ? 'समय' : 'Time'}</Text>
            <Text style={styles.tableHeadText}>{lang === 'pa' ? 'ਮੁੱਲ' : lang === 'hi' ? 'मान' : 'Value'}</Text>
            <Text style={styles.tableHeadText}>{lang === 'pa' ? 'ਸਥਿਤੀ' : lang === 'hi' ? 'स्थिति' : 'Status'}</Text>
          </View>
          {chartData.slice(-10).reverse().map((d, i) => {
            const lvl: AlertLevel = cfg ? getLevel(cfg, d.value) : 'safe';
            return (
              <View key={i} style={[styles.tableRow, { backgroundColor: i % 2 === 0 ? 'rgba(0,245,255,0.03)' : 'transparent' }]}>
                <Text style={styles.tableCell}>{d.time}</Text>
                <Text style={[styles.tableCell, { color: LEVEL_COLORS[lvl] }]}>{d.value.toFixed(1)} {cfg?.unit}</Text>
                <View style={[styles.statusPill, { backgroundColor: LEVEL_COLORS[lvl] + '22', borderColor: LEVEL_COLORS[lvl] + '44' }]}>
                  <Text style={[styles.statusText, { color: LEVEL_COLORS[lvl] }]}>{lvl.toUpperCase()}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A1628' },
  header: {
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: 'rgba(0,245,255,0.1)',
    backgroundColor: 'rgba(13,31,60,0.9)',
  },
  headerTitle: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },
  picker: { flexGrow: 0, borderBottomWidth: 1, borderBottomColor: 'rgba(0,245,255,0.08)' },
  pickerChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
  },
  pickerDot: { width: 6, height: 6, borderRadius: 3 },
  pickerText: { fontSize: 11, fontWeight: '600' },
  content: { padding: 14, gap: 14 },
  chartCard: {
    backgroundColor: '#0D1F3C', borderWidth: 1, borderRadius: 16, padding: 16, gap: 12,
  },
  chartHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  chartTitle: { fontSize: 16, fontWeight: '800', flex: 1 },
  chartUnit: { color: '#4A5568', fontSize: 11 },
  liveVal: { fontSize: 22, fontWeight: '800' },
  chartLoading: { height: 120, alignItems: 'center', justifyContent: 'center', gap: 8 },
  chartLoadingText: { color: '#4A5568', fontSize: 12 },
  chartWrap: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  yAxis: { height: 120, justifyContent: 'space-between', paddingVertical: 4 },
  axisLabel: { color: '#4A5568', fontSize: 9, textAlign: 'right', width: 28 },
  stats: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: 'rgba(0,245,255,0.08)', paddingTop: 10 },
  statCell: { flex: 1, alignItems: 'center', gap: 2 },
  statLabel: { color: '#4A5568', fontSize: 10, fontWeight: '600' },
  statVal: { fontSize: 16, fontWeight: '800' },
  reloadBtn: {
    flexDirection: 'row', gap: 5, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 6,
  },
  reloadText: { color: '#00F5FF', fontSize: 11, fontWeight: '600' },
  tableTitle: {
    fontSize: 11, fontWeight: '800', color: '#6B8CAE',
    letterSpacing: 1.5, textTransform: 'uppercase',
  },
  table: { backgroundColor: '#0D1F3C', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(0,245,255,0.1)', overflow: 'hidden' },
  tableHead: {
    flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: 'rgba(0,245,255,0.1)',
    backgroundColor: 'rgba(0,245,255,0.05)',
  },
  tableHeadText: { flex: 1, color: '#6B8CAE', fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  tableRow: { flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 9, alignItems: 'center' },
  tableCell: { flex: 1, color: '#FFFFFF', fontSize: 12 },
  statusPill: { borderWidth: 1, borderRadius: 5, paddingHorizontal: 6, paddingVertical: 1 },
  statusText: { fontSize: 8, fontWeight: '800', letterSpacing: 0.8 },
});
