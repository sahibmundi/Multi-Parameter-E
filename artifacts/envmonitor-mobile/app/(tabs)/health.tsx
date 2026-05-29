import { Feather } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import React from 'react';
import { Platform, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HealthAlertCard from '@/components/HealthAlertCard';
import { useApp } from '@/context/AppContext';
import { generateHealthConditions, getOverallScore, AlertLevel } from '@/constants/thresholds';
import { t, Lang } from '@/constants/translations';
import * as Haptics from 'expo-haptics';

const LEVEL_COLORS: Record<AlertLevel, string> = {
  safe: '#00FF88', moderate: '#FFD700', unhealthy: '#FF8C00', severe: '#FF3366',
};

function speak(text: string, lang: Lang) {
  Speech.stop();
  Speech.speak(text, {
    language: lang === 'pa' ? 'pa-IN' : lang === 'hi' ? 'hi-IN' : 'en-US',
    pitch: 0.95,
    rate: Platform.OS === 'ios' ? 0.5 : 0.9,
  });
}

export default function HealthScreen() {
  const insets = useSafeAreaInsets();
  const { readings, isLoading, refresh, lang } = useApp();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const numericReadings: Record<string, number> = {};
  if (readings) {
    for (const [k, v] of Object.entries(readings)) {
      if (v !== null && typeof v === 'number') numericReadings[k] = v;
    }
  }

  const score = getOverallScore(numericReadings);
  const conditions = generateHealthConditions(numericReadings);

  const severeCount = conditions.filter((c) => c.level === 'severe').length;
  const unhealthyCount = conditions.filter((c) => c.level === 'unhealthy').length;
  const moderateCount = conditions.filter((c) => c.level === 'moderate').length;

  const overallLevel: AlertLevel =
    severeCount > 0 ? 'severe' :
    unhealthyCount > 0 ? 'unhealthy' :
    moderateCount > 0 ? 'moderate' : 'safe';

  const overallColor = LEVEL_COLORS[overallLevel];

  const announceAll = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (conditions.length === 0) {
      speak(t(lang, 'noAlerts'), lang);
      return;
    }
    const summary = conditions.map((c) => c.title[lang]).join('. ');
    const score100 = `${lang === 'pa' ? 'ਸਕੋਰ' : lang === 'hi' ? 'स्कोर' : 'Score'} ${score}. ${summary}`;
    speak(score100, lang);
  };

  return (
    <View style={[styles.root, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t(lang, 'healthAlerts')}</Text>
        <TouchableOpacity onPress={announceAll} style={styles.speakBtn}>
          <Feather name="volume-2" size={18} color="#00F5FF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: botPad + 24 }]}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} tintColor="#00F5FF" />}
        showsVerticalScrollIndicator={false}
      >
        {/* Overall status card */}
        <View style={[styles.overallCard, { borderColor: overallColor + '44' }]}>
          <View style={styles.overallTop}>
            <View style={[styles.scoreBadge, { backgroundColor: overallColor + '22', borderColor: overallColor + '55' }]}>
              <Text style={[styles.scoreNum, { color: overallColor }]}>{score}</Text>
              <Text style={[styles.scoreOf, { color: overallColor }]}>/100</Text>
            </View>
            <View style={styles.overallInfo}>
              <Text style={[styles.overallLevel, { color: overallColor }]}>
                {overallLevel.toUpperCase()}
              </Text>
              <Text style={styles.overallSub}>
                {lang === 'pa' ? `${conditions.length} ਸਰਗਰਮ ਚੇਤਾਵਨੀਆਂ`
                  : lang === 'hi' ? `${conditions.length} सक्रिय चेतावनियां`
                  : `${conditions.length} active alert${conditions.length !== 1 ? 's' : ''}`}
              </Text>
              <View style={styles.counters}>
                {severeCount > 0 && <View style={[styles.counter, { backgroundColor: '#FF336622', borderColor: '#FF336655' }]}><Text style={[styles.counterText, { color: '#FF3366' }]}>{severeCount} Severe</Text></View>}
                {unhealthyCount > 0 && <View style={[styles.counter, { backgroundColor: '#FF8C0022', borderColor: '#FF8C0055' }]}><Text style={[styles.counterText, { color: '#FF8C00' }]}>{unhealthyCount} Unhealthy</Text></View>}
                {moderateCount > 0 && <View style={[styles.counter, { backgroundColor: '#FFD70022', borderColor: '#FFD70055' }]}><Text style={[styles.counterText, { color: '#FFD700' }]}>{moderateCount} Moderate</Text></View>}
              </View>
            </View>
          </View>
        </View>

        {/* Alert legend */}
        <View style={styles.legend}>
          {(['safe', 'moderate', 'unhealthy', 'severe'] as AlertLevel[]).map((lvl) => (
            <View key={lvl} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: LEVEL_COLORS[lvl] }]} />
              <Text style={styles.legendText}>{lvl.charAt(0).toUpperCase() + lvl.slice(1)}</Text>
            </View>
          ))}
        </View>

        {/* No alerts */}
        {conditions.length === 0 && (
          <View style={styles.safeCard}>
            <Feather name="check-circle" size={40} color="#00FF88" />
            <Text style={styles.safeTitle}>
              {lang === 'pa' ? 'ਸਭ ਕੁਝ ਸੁਰੱਖਿਅਤ ਹੈ!' : lang === 'hi' ? 'सब कुछ सुरक्षित है!' : 'All Clear!'}
            </Text>
            <Text style={styles.safeSub}>{t(lang, 'noAlerts')}</Text>
          </View>
        )}

        {/* Alert cards */}
        {conditions.map((c) => (
          <HealthAlertCard key={c.id} condition={c} lang={lang} />
        ))}

        {/* Disclaimer */}
        <Text style={styles.disclaimer}>
          {lang === 'pa' ? '⚠ ਥ੍ਰੈਸ਼ਹੋਲਡ WHO/EPA ਦਿਸ਼ਾ-ਨਿਰਦੇਸ਼ਾਂ ਤੇ ਆਧਾਰਿਤ ਹਨ।'
            : lang === 'hi' ? '⚠ थ्रेशोल्ड WHO/EPA दिशानिर्देशों पर आधारित हैं।'
            : '⚠ Thresholds based on WHO/EPA guidelines. Not a substitute for medical advice.'}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A1628' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: 'rgba(0,245,255,0.1)',
    backgroundColor: 'rgba(13,31,60,0.9)',
  },
  headerTitle: { fontSize: 15, fontWeight: '800', color: '#FFFFFF', flex: 1 },
  speakBtn: { padding: 6 },
  content: { padding: 14, gap: 12 },
  overallCard: {
    backgroundColor: '#0D1F3C', borderWidth: 1, borderRadius: 16, padding: 16,
  },
  overallTop: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  scoreBadge: {
    width: 72, height: 72, borderRadius: 36,
    borderWidth: 2, alignItems: 'center', justifyContent: 'center',
  },
  scoreNum: { fontSize: 28, fontWeight: '800' },
  scoreOf: { fontSize: 10, fontWeight: '700', marginTop: -4 },
  overallInfo: { flex: 1, gap: 4 },
  overallLevel: { fontSize: 18, fontWeight: '800', letterSpacing: 1 },
  overallSub: { color: '#6B8CAE', fontSize: 12 },
  counters: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 4 },
  counter: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  counterText: { fontSize: 10, fontWeight: '700' },
  legend: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { color: '#6B8CAE', fontSize: 11 },
  safeCard: {
    backgroundColor: '#0D1F3C', borderRadius: 16, borderWidth: 1,
    borderColor: 'rgba(0,255,136,0.3)', padding: 32,
    alignItems: 'center', gap: 10,
  },
  safeTitle: { fontSize: 20, fontWeight: '800', color: '#00FF88' },
  safeSub: { color: '#6B8CAE', fontSize: 13, textAlign: 'center', lineHeight: 19 },
  disclaimer: { color: '#4A5568', fontSize: 10, textAlign: 'center', lineHeight: 15, marginTop: 4 },
});
