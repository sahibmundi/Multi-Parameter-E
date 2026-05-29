import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SENSOR_CONFIGS, getLevel, AlertLevel } from '@/constants/thresholds';
import { sensorLabel, Lang } from '@/constants/translations';

const LEVEL_COLORS: Record<AlertLevel, string> = {
  safe: '#00FF88',
  moderate: '#FFD700',
  unhealthy: '#FF8C00',
  severe: '#FF3366',
};

interface Props {
  id: string;
  value: number | null;
  lang: Lang;
  onPress?: () => void;
}

export default function SensorCard({ id, value, lang, onPress }: Props) {
  const cfg = SENSOR_CONFIGS.find((c) => c.id === id);
  const level: AlertLevel = cfg && value !== null ? getLevel(cfg, value) : 'safe';
  const color = value === null ? '#4A5568' : LEVEL_COLORS[level];

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75} style={styles.card}>
      <View style={[styles.border, { borderColor: color + '44' }]}>
        <View style={styles.top}>
          <Feather name={(cfg?.icon as any) ?? 'circle'} size={14} color={color} />
          <Text style={[styles.label, { color }]}>{sensorLabel(lang, id)}</Text>
        </View>
        <Text style={[styles.value, { color }]}>
          {value !== null ? value.toFixed(1) : '--'}
        </Text>
        <Text style={styles.unit}>{cfg?.unit ?? ''}</Text>
        <View style={[styles.pill, { backgroundColor: color + '22', borderColor: color + '55' }]}>
          <Text style={[styles.pillText, { color }]}>
            {value === null ? 'NO DATA' : level.toUpperCase()}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1 },
  border: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    backgroundColor: '#0D1F3C',
    padding: 12,
    gap: 4,
  },
  top: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  label: { fontSize: 11, fontWeight: '600', letterSpacing: 0.5, flex: 1 },
  value: { fontSize: 26, fontWeight: '700', marginTop: 2 },
  unit: { fontSize: 10, color: '#4A5568', marginTop: -2 },
  pill: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 4,
  },
  pillText: { fontSize: 8, fontWeight: '800', letterSpacing: 1 },
});
