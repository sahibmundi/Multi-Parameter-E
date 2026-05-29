import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { HealthCondition, AlertLevel } from '@/constants/thresholds';
import { t, Lang } from '@/constants/translations';

const LEVEL_CONFIG: Record<AlertLevel, { color: string; icon: 'check-circle' | 'alert-circle' | 'alert-triangle' | 'x-octagon'; label: string }> = {
  safe:      { color: '#00FF88', icon: 'check-circle',    label: 'SAFE' },
  moderate:  { color: '#FFD700', icon: 'alert-circle',    label: 'MODERATE' },
  unhealthy: { color: '#FF8C00', icon: 'alert-triangle',  label: 'UNHEALTHY' },
  severe:    { color: '#FF3366', icon: 'x-octagon',       label: 'SEVERE' },
};

interface Props {
  condition: HealthCondition;
  lang: Lang;
}

export default function HealthAlertCard({ condition, lang }: Props) {
  const [expanded, setExpanded] = useState(false);
  const { color, icon, label } = LEVEL_CONFIG[condition.level];

  return (
    <TouchableOpacity
      onPress={() => setExpanded((p) => !p)}
      activeOpacity={0.8}
      style={[styles.card, { borderColor: color + '44' }]}
    >
      <View style={styles.header}>
        <View style={[styles.iconWrap, { backgroundColor: color + '22' }]}>
          <Feather name={icon} size={18} color={color} />
        </View>
        <View style={styles.titleWrap}>
          <Text style={[styles.title, { color }]}>{condition.title[lang]}</Text>
          <View style={[styles.badge, { backgroundColor: color + '22', borderColor: color + '55' }]}>
            <Text style={[styles.badgeText, { color }]}>{label}</Text>
          </View>
        </View>
        <Feather name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color="#4A5568" />
      </View>

      {expanded && (
        <View style={styles.body}>
          <Text style={styles.desc}>{condition.description[lang]}</Text>
          <View style={[styles.recBox, { borderColor: color + '33', backgroundColor: color + '11' }]}>
            <Feather name="shield" size={12} color={color} />
            <Text style={[styles.recText, { color }]}>{condition.recommendation[lang]}</Text>
          </View>
          <View style={styles.triggers}>
            {condition.triggeredBy.map((s) => (
              <View key={s} style={[styles.trigger, { borderColor: color + '44' }]}>
                <Text style={[styles.triggerText, { color }]}>{s}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0D1F3C',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  titleWrap: { flex: 1, gap: 4 },
  title: { fontSize: 14, fontWeight: '700' },
  badge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  badgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
  body: { marginTop: 12, gap: 10 },
  desc: { fontSize: 13, color: '#8FA8C8', lineHeight: 19 },
  recBox: {
    flexDirection: 'row',
    gap: 8,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'flex-start',
  },
  recText: { flex: 1, fontSize: 12, lineHeight: 18, fontWeight: '600' },
  triggers: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  trigger: {
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  triggerText: { fontSize: 10, fontWeight: '700' },
});
