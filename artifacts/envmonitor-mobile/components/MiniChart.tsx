import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Polyline } from 'react-native-svg';
import type { HistoryPoint } from '@/services/thingspeak';

interface Props {
  data: HistoryPoint[];
  color: string;
  width?: number;
  height?: number;
}

export default function MiniChart({ data, color, width = 300, height = 80 }: Props) {
  if (data.length < 2) {
    return (
      <View style={[styles.empty, { width, height }]}>
        <Text style={styles.emptyText}>Not enough data</Text>
      </View>
    );
  }

  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pad = 8;

  const points = data.map((d, i) => {
    const x = pad + (i / (data.length - 1)) * (width - pad * 2);
    const y = pad + ((max - d.value) / range) * (height - pad * 2);
    return `${x},${y}`;
  }).join(' ');

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height}>
        <Polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: '#4A5568', fontSize: 12 },
});
