import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Animated, Platform, RefreshControl,
  ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScoreRing from '@/components/ScoreRing';
import SensorCard from '@/components/SensorCard';
import { useApp } from '@/context/AppContext';
import { SENSOR_CONFIGS, generateHealthConditions, getOverallScore, AlertLevel } from '@/constants/thresholds';
import { t, sensorLabel, Lang } from '@/constants/translations';
import { computeIntelligence } from '@/engines/intelligence';

const LEVEL_COLORS: Record<AlertLevel, string> = {
  safe: '#00FF88', moderate: '#FFD700', unhealthy: '#FF8C00', severe: '#FF3366',
};

function processVoiceQuery(query: string, readings: Record<string, number>, lang: Lang): string {
  const q = query.toLowerCase().trim();
  for (const cfg of SENSOR_CONFIGS) {
    const keys = [cfg.id.toLowerCase(), sensorLabel('en', cfg.id).toLowerCase(), sensorLabel(lang, cfg.id).toLowerCase()];
    if (keys.some((k) => q.includes(k))) {
      const val = readings[cfg.id];
      if (val === undefined || val === null) return lang === 'pa' ? `${sensorLabel('pa', cfg.id)} ਦਾ ਡੇਟਾ ਉਪਲਬਧ ਨਹੀਂ।` : lang === 'hi' ? `${sensorLabel('hi', cfg.id)} का डेटा उपलब्ध नहीं।` : `No data for ${sensorLabel('en', cfg.id)}.`;
      const status = lang === 'pa' ? (val > 75 ? 'ਖਤਰਨਾਕ' : val > 35 ? 'ਮੱਧਮ' : 'ਚੰਗਾ') : lang === 'hi' ? (val > 75 ? 'खतरनाक' : val > 35 ? 'मध्यम' : 'अच्छा') : (val > 75 ? 'dangerous' : val > 35 ? 'moderate' : 'good');
      return lang === 'pa' ? `${sensorLabel('pa', cfg.id)} ${val.toFixed(1)} ${cfg.unit} ਹੈ। ਸਥਿਤੀ ${status} ਹੈ।` : lang === 'hi' ? `${sensorLabel('hi', cfg.id)} ${val.toFixed(1)} ${cfg.unit} है। स्थिति ${status} है।` : `${sensorLabel('en', cfg.id)} is ${val.toFixed(1)} ${cfg.unit}. Status is ${status}.`;
    }
  }
  const score = getOverallScore(readings);
  if (q.includes('score') || q.includes('ਸਕੋਰ') || q.includes('स्कोर')) {
    return lang === 'pa' ? `ਵਾਤਾਵਰਣ ਸਕੋਰ ${score} ਹੈ।` : lang === 'hi' ? `पर्यावरण स्कोर ${score} है।` : `Environment score is ${score} out of 100.`;
  }
  if (q.includes('aqi') || q.includes('air quality') || q.includes('ਹਵਾ ਗੁਣਵੱਤਾ') || q.includes('वायु गुणवत्ता')) {
    return lang === 'pa' ? `AQI ਸਕੋਰ ਜਲਦ ਉਪਲਬਧ ਹੋਵੇਗਾ। ਹੈਲਥ ਟੈਬ ਦੇਖੋ।` : lang === 'hi' ? `AQI जानकारी के लिए Health Tab देखें।` : `Check the Health tab for full AQI and risk analysis.`;
  }
  if (q.includes('safe') || q.includes('ਸੁਰੱਖਿਅਤ') || q.includes('सुरक्षित') || q.includes('air') || q.includes('quality')) {
    const alerts = generateHealthConditions(readings);
    if (alerts.length === 0) return lang === 'pa' ? 'ਸਾਰੇ ਪੈਰਾਮੀਟਰ ਸੁਰੱਖਿਅਤ ਹਨ।' : lang === 'hi' ? 'सभी पैरामीटर सुरक्षित हैं।' : 'All parameters are within safe limits.';
    const names = alerts.map((a) => a.title[lang]).join(', ');
    return lang === 'pa' ? `ਚੇਤਾਵਨੀ: ${names}` : lang === 'hi' ? `चेतावनी: ${names}` : `Warning: ${names}`;
  }
  return lang === 'pa' ? 'ਮੈਂ ਸਮਝ ਨਹੀਂ ਸਕਿਆ। ਤਾਪਮਾਨ, CO2, ਜਾਂ ਸਕੋਰ ਬਾਰੇ ਪੁੱਛੋ।' : lang === 'hi' ? 'मैं समझ नहीं पाया। तापमान, CO2, या स्कोर के बारे में पूछें।' : 'I did not understand. Ask about temperature, CO2, smoke, or score.';
}

function speak(text: string, lang: Lang) {
  Speech.stop();
  Speech.speak(text, { language: lang === 'pa' ? 'pa-IN' : lang === 'hi' ? 'hi-IN' : 'en-US', pitch: 0.95, rate: Platform.OS === 'ios' ? 0.5 : 0.9 });
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { readings, isLoading, isConnected, error, lastUpdated, refresh, lang, setVoiceResult, voiceQuery, voiceResponse } = useApp();
  const [isListening, setIsListening] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const numericReadings: Record<string, number> = {};
  if (readings) {
    for (const [k, v] of Object.entries(readings)) {
      if (v !== null && typeof v === 'number') numericReadings[k] = v;
    }
  }
  const score        = getOverallScore(numericReadings);
  const healthAlerts = generateHealthConditions(numericReadings);
  const intel        = computeIntelligence(readings);

  useEffect(() => {
    if (!isListening) { pulseAnim.setValue(1); return; }
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.25, duration: 600, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [isListening, pulseAnim]);

  const handleMic = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isListening) { setIsListening(false); return; }
    setIsListening(true);
    speak(lang === 'pa' ? 'ਕਿਰਪਾ ਕਰਕੇ ਆਪਣਾ ਸਵਾਲ ਕਹੋ।' : lang === 'hi' ? 'कृपया अपना प्रश्न बोलें।' : 'Please ask your question.', lang);
    setTimeout(() => setIsListening(false), 4000);
  }, [isListening, lang]);

  const handleQuickQuery = useCallback((query: string) => {
    Haptics.selectionAsync();
    const response = processVoiceQuery(query, numericReadings, lang);
    setVoiceResult(query, response);
    speak(response, lang);
  }, [numericReadings, lang, setVoiceResult]);

  const lastTime = lastUpdated
    ? `${String(lastUpdated.getHours()).padStart(2, '0')}:${String(lastUpdated.getMinutes()).padStart(2, '0')}:${String(lastUpdated.getSeconds()).padStart(2, '0')}`
    : '';

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  return (
    <View style={[styles.root, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>{t(lang, 'appTitle')}</Text>
          <View style={styles.connRow}>
            <View style={[styles.dot, { backgroundColor: isConnected ? '#00FF88' : '#FF3366' }]} />
            <Text style={styles.connText}>{isConnected ? t(lang, 'connected') : t(lang, 'disconnected')}</Text>
            {lastTime ? <Text style={styles.timeText}> · {lastTime}</Text> : null}
          </View>
        </View>
        <TouchableOpacity onPress={() => { Haptics.selectionAsync(); refresh(); }} style={styles.refreshBtn}>
          {isLoading ? <ActivityIndicator size="small" color="#00F5FF" /> : <Feather name="refresh-cw" size={18} color="#00F5FF" />}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: botPad + 90 }]}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} tintColor="#00F5FF" />}
        showsVerticalScrollIndicator={false}
      >
        {error && (
          <View style={styles.errorBanner}>
            <Feather name="wifi-off" size={14} color="#FF3366" />
            <Text style={styles.errorText}>{t(lang, 'errorFetch')}</Text>
          </View>
        )}

        {/* Score + Alerts summary */}
        {!isLoading && (
          <View style={styles.scoreRow}>
            <View style={styles.scoreCard}>
              <ScoreRing score={score} size={100} />
              <Text style={styles.scoreLabel}>{t(lang, 'envScore')}</Text>
            </View>
            <View style={styles.insightCard}>
              <Text style={styles.insightTitle}>
                {healthAlerts.length === 0
                  ? t(lang, 'allSafe')
                  : lang === 'pa' ? `${healthAlerts.length} ਚੇਤਾਵਨੀਆਂ`
                  : lang === 'hi' ? `${healthAlerts.length} चेतावनियां`
                  : `${healthAlerts.length} Alert${healthAlerts.length > 1 ? 's' : ''}`}
              </Text>
              {healthAlerts.slice(0, 3).map((a) => (
                <View key={a.id} style={[styles.alertRow, { borderLeftColor: LEVEL_COLORS[a.level] }]}>
                  <Text style={[styles.alertRowText, { color: LEVEL_COLORS[a.level] }]} numberOfLines={1}>{a.title[lang]}</Text>
                </View>
              ))}
              {healthAlerts.length === 0 && <Feather name="check-circle" size={28} color="#00FF88" style={{ marginTop: 8 }} />}
            </View>
          </View>
        )}

        {/* AQI + Safety Score row */}
        {!isLoading && (
          <View style={styles.intelRow}>
            <View style={[styles.intelCard, { borderColor: intel.aqi.color + '44' }]}>
              <Text style={styles.intelLabel}>
                {lang === 'pa' ? 'ਹਵਾ ਗੁਣਵੱਤਾ ਸੂਚਕਾਂਕ' : lang === 'hi' ? 'वायु गुणवत्ता सूचकांक' : 'Air Quality Index'}
              </Text>
              <Text style={[styles.intelScore, { color: intel.aqi.color }]}>{intel.aqi.score}</Text>
              <Text style={[styles.intelCategory, { color: intel.aqi.color }]} numberOfLines={2}>{intel.aqi.category}</Text>
            </View>
            <View style={[styles.intelCard, { borderColor: intel.safetyScore.color + '44' }]}>
              <Text style={styles.intelLabel}>
                {lang === 'pa' ? 'ਸੁਰੱਖਿਆ ਸਕੋਰ' : lang === 'hi' ? 'सुरक्षा स्कोर' : 'Safety Score'}
              </Text>
              <Text style={[styles.intelScore, { color: intel.safetyScore.color }]}>{intel.safetyScore.score}</Text>
              <Text style={[styles.intelCategory, { color: intel.safetyScore.color }]}>{intel.safetyScore.category}</Text>
            </View>
            <View style={[styles.intelCard, { borderColor: intel.pollen.color + '44' }]}>
              <Text style={styles.intelLabel}>
                {lang === 'pa' ? 'ਪਰਾਗ ਖਤਰਾ' : lang === 'hi' ? 'पराग जोखिम' : 'Pollen Risk'}
              </Text>
              <Text style={[styles.intelScore, { color: intel.pollen.color, fontSize: 14 }]}>{intel.pollen.pollenActivity}</Text>
              <Text style={[styles.intelCategory, { color: intel.pollen.color }]}>{intel.pollen.allergyRisk}</Text>
            </View>
          </View>
        )}

        {/* Pollen recommendation */}
        {!isLoading && intel.pollen.outdoorSafetyScore < 70 && (
          <View style={[styles.pollenBanner, { borderColor: intel.pollen.color + '55', backgroundColor: intel.pollen.color + '12' }]}>
            <Feather name="alert-circle" size={13} color={intel.pollen.color} />
            <Text style={[styles.pollenText, { color: intel.pollen.color }]} numberOfLines={3}>
              {intel.pollen.recommendation}
            </Text>
          </View>
        )}

        {isLoading && readings === null && (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#00F5FF" />
            <Text style={styles.loadingText}>{t(lang, 'loading')}</Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>
          {lang === 'pa' ? 'ਲਾਈਵ ਸੈਂਸਰ ਰੀਡਿੰਗਾਂ' : lang === 'hi' ? 'लाइव सेंसर रीडिंग' : 'Live Sensor Readings'}
        </Text>
        <View style={styles.grid}>
          {SENSOR_CONFIGS.map((cfg) => (
            <View key={cfg.id} style={styles.gridCell}>
              <SensorCard id={cfg.id} value={readings?.[cfg.id as keyof typeof readings] as number | null ?? null} lang={lang} onPress={() => handleQuickQuery(cfg.id)} />
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>{t(lang, 'voiceAssistant')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickRow} contentContainerStyle={{ gap: 8, paddingRight: 16 }}>
          {['Temperature', 'CO2', 'Smoke', 'Humidity', 'score', 'safe'].map((q) => (
            <TouchableOpacity key={q} onPress={() => handleQuickQuery(q)} style={styles.quickChip}>
              <Text style={styles.quickChipText}>{sensorLabel(lang, q) || (lang === 'pa' ? (q === 'score' ? 'ਸਕੋਰ' : 'ਸੁਰੱਖਿਅਤ') : lang === 'hi' ? (q === 'score' ? 'स्कोर' : 'सुरक्षित') : q)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {(voiceQuery || voiceResponse) && (
          <View style={styles.voiceCard}>
            {voiceQuery ? <Text style={styles.voiceQuery}>"{voiceQuery}"</Text> : null}
            {voiceResponse ? <Text style={styles.voiceResp}>{voiceResponse}</Text> : null}
          </View>
        )}
      </ScrollView>

      <View style={[styles.micWrap, { bottom: botPad + 20 }]}>
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <TouchableOpacity
            onPress={handleMic}
            style={[styles.mic, { borderColor: isListening ? '#FF3366' : '#00F5FF', backgroundColor: isListening ? 'rgba(255,51,102,0.15)' : 'rgba(0,245,255,0.12)' }]}
          >
            <Feather name={isListening ? 'mic-off' : 'mic'} size={26} color={isListening ? '#FF3366' : '#00F5FF'} />
          </TouchableOpacity>
        </Animated.View>
        {isListening && <Text style={styles.listeningText}>{t(lang, 'listening')}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A1628' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(0,245,255,0.1)', backgroundColor: 'rgba(13,31,60,0.9)' },
  headerLeft: { flex: 1 },
  title: { fontSize: 16, fontWeight: '800', color: '#00F5FF', letterSpacing: 1.5 },
  connRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  connText: { fontSize: 10, color: '#6B8CAE', fontWeight: '600' },
  timeText: { fontSize: 10, color: '#4A5568' },
  refreshBtn: { padding: 8 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 14, paddingTop: 14, gap: 14 },
  errorBanner: { flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: 'rgba(255,51,102,0.1)', borderWidth: 1, borderColor: 'rgba(255,51,102,0.3)', borderRadius: 10, padding: 12 },
  errorText: { flex: 1, color: '#FF3366', fontSize: 12 },
  scoreRow: { flexDirection: 'row', gap: 12 },
  scoreCard: { flex: 1, backgroundColor: '#0D1F3C', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(0,245,255,0.15)', alignItems: 'center', justifyContent: 'center', padding: 14, gap: 6 },
  scoreLabel: { fontSize: 10, color: '#6B8CAE', fontWeight: '700', letterSpacing: 0.8 },
  insightCard: { flex: 2, backgroundColor: '#0D1F3C', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(0,245,255,0.15)', padding: 14, gap: 6 },
  insightTitle: { fontSize: 13, fontWeight: '700', color: '#FFFFFF', marginBottom: 2 },
  alertRow: { borderLeftWidth: 2, paddingLeft: 8, paddingVertical: 2 },
  alertRowText: { fontSize: 11, fontWeight: '600' },
  intelRow: { flexDirection: 'row', gap: 8 },
  intelCard: { flex: 1, backgroundColor: '#0D1F3C', borderRadius: 12, borderWidth: 1, padding: 10, gap: 3 },
  intelLabel: { fontSize: 9, color: '#6B8CAE', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  intelScore: { fontSize: 22, fontWeight: '800', lineHeight: 26 },
  intelCategory: { fontSize: 10, fontWeight: '600', lineHeight: 13 },
  pollenBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderWidth: 1, borderRadius: 10, padding: 10 },
  pollenText: { flex: 1, fontSize: 11, fontWeight: '600', lineHeight: 16 },
  loadingWrap: { alignItems: 'center', paddingVertical: 32, gap: 10 },
  loadingText: { color: '#6B8CAE', fontSize: 13 },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: '#6B8CAE', letterSpacing: 1.5, textTransform: 'uppercase' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  gridCell: { width: '48%' },
  quickRow: { marginHorizontal: -14, paddingLeft: 14 },
  quickChip: { backgroundColor: 'rgba(0,245,255,0.1)', borderWidth: 1, borderColor: 'rgba(0,245,255,0.3)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  quickChipText: { color: '#00F5FF', fontSize: 12, fontWeight: '600' },
  voiceCard: { backgroundColor: '#0D1F3C', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(0,245,255,0.2)', padding: 14, gap: 8 },
  voiceQuery: { color: '#6B8CAE', fontSize: 12, fontStyle: 'italic' },
  voiceResp: { color: '#00F5FF', fontSize: 14, fontWeight: '600', lineHeight: 20 },
  micWrap: { position: 'absolute', right: 16, alignItems: 'center', gap: 4 },
  mic: { width: 58, height: 58, borderRadius: 29, borderWidth: 2, alignItems: 'center', justifyContent: 'center', shadowColor: '#00F5FF', shadowOpacity: 0.5, shadowRadius: 12, elevation: 8 },
  listeningText: { color: '#FF3366', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
});
