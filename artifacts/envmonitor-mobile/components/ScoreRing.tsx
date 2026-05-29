import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface Props {
  score: number;
  size?: number;
}

function scoreColor(score: number): string {
  if (score >= 80) return '#00FF88';
  if (score >= 60) return '#FFD700';
  if (score >= 40) return '#FF8C00';
  return '#FF3366';
}

function scoreLabel(score: number): string {
  if (score >= 80) return 'GOOD';
  if (score >= 60) return 'MODERATE';
  if (score >= 40) return 'POOR';
  return 'CRITICAL';
}

export default function ScoreRing({ score, size = 110 }: Props) {
  const r = (size - 16) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = scoreColor(score);

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2} cy={size / 2} r={r}
          stroke="rgba(0,245,255,0.1)"
          strokeWidth={10}
          fill="transparent"
        />
        <Circle
          cx={size / 2} cy={size / 2} r={r}
          stroke={color}
          strokeWidth={10}
          fill="transparent"
          strokeDasharray={`${dash} ${circ}`}
          strokeDashoffset={0}
          strokeLinecap="round"
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={styles.center}>
        <Text style={[styles.num, { color }]}>{score}</Text>
        <Text style={[styles.lbl, { color }]}>{scoreLabel(score)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  center: { position: 'absolute', alignItems: 'center' },
  num: { fontSize: 28, fontWeight: '800' },
  lbl: { fontSize: 8, fontWeight: '800', letterSpacing: 1, marginTop: -2 },
});
