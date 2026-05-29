import { Feather } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import React, { useState } from 'react';
import { Platform, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HealthAlertCard from '@/components/HealthAlertCard';
import { useApp } from '@/context/AppContext';
import { generateHealthConditions, getOverallScore, AlertLevel } from '@/constants/thresholds';
import { t, Lang } from '@/constants/translations';
import { computeIntelligence } from '@/engines/intelligence';
import type { HealthRisk } from '@/engines/health-risk';
import * as Haptics from 'expo-haptics';

const LEVEL_COLORS: Record<AlertLevel, string> = {
  safe: '#00FF88', moderate: '#FFD700', unhealthy: '#FF8C00', severe: '#FF3366',
};

const RISK_COLORS: Record<string, string> = {
  Low: '#22c55e', Moderate: '#eab308', High: '#f97316', Critical: '#ef4444',
};

function speak(text: string, lang: Lang) {
  Speech.stop();
  Speech.speak(text, { language: lang === 'pa' ? 'pa-IN' : lang === 'hi' ? 'hi-IN' : 'en-US', pitch: 0.95, rate: Platform.OS === 'ios' ? 0.5 : 0.9 });
}

function RiskCard({ risk, lang }: { risk: HealthRisk; lang: Lang }) {
  const [expanded, setExpanded] = useState(false);
  const c = RISK_COLORS[risk.riskLevel] ?? '#6B8CAE';
  return (
    <TouchableOpacity
      onPress={() => { Haptics.selectionAsync(); setExpanded(!expanded); }}
      style={[styles.riskCard, { borderColor: c + '44' }]}
      activeOpacity={0.8}
    >
      <View style={styles.riskHeader}>
        <View style={[styles.riskDot, { backgroundColor: c }]} />
        <Text style={styles.riskName} numberOfLines={1}>{risk.condition}</Text>
        <View style={[styles.riskBadge, { backgroundColor: c + '22', borderColor: c + '55' }]}>
          <Text style={[styles.riskBadgeText, { color: c }]}>{risk.riskLevel}</Text>
        </View>
        <Feather name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color="#6B8CAE" />
      </View>
      {expanded && (
        <View style={styles.riskBody}>
          <Text style={styles.riskDesc}>{risk.description}</Text>
          {risk.triggers.length > 0 && (
            <View style={styles.triggerRow}>
              <Text style={styles.triggerLabel}>
                {lang === 'pa' ? 'ਕਾਰਨ:' : lang === 'hi' ? 'कारण:' : 'Triggers:'}
              </Text>
              {risk.triggers.map((tr) => (
                <View key={tr} style={styles.triggerChip}>
                  <Text style={styles.triggerText}>{tr}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function HealthScreen() {
  const insets = useSafeAreaInsets();
  const { readings, isLoading, refresh, lang } = useApp();
  const [activeTab, setActiveTab] = useState<'classic' | 'risks' | 'pollen'>('risks');
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const numericReadings: Record<string, number> = {};
  if (readings) {
    for (const [k, v] of Object.entries(readings)) {
      if (v !== null && typeof v === 'number') numericReadings[k] = v;
    }
  }

  const score      = getOverallScore(numericReadings);
  const conditions = generateHealthConditions(numericReadings);
  const intel      = computeIntelligence(readings);

  const severeCount    = conditions.filter((c) => c.level === 'severe').length;
  const unhealthyCount = conditions.filter((c) => c.level === 'unhealthy').length;
  const moderateCount  = conditions.filter((c) => c.level === 'moderate').length;
  const overallLevel: AlertLevel = severeCount > 0 ? 'severe' : unhealthyCount > 0 ? 'unhealthy' : moderateCount > 0 ? 'moderate' : 'safe';
  const overallColor = LEVEL_COLORS[overallLevel];

  const critCount = intel.healthRisks.filter(r => r.riskLevel === 'Critical').length;
  const highCount = intel.healthRisks.filter(r => r.riskLevel === 'High').length;

  const announceAll = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (conditions.length === 0) { speak(t(lang, 'noAlerts'), lang); return; }
    const summary = conditions.map((c) => c.title[lang]).join('. ');
    speak(`${lang === 'pa' ? 'ਸਕੋਰ' : lang === 'hi' ? 'स्कोर' : 'Score'} ${score}. ${summary}`, lang);
  };

  const TABS = [
    { id: 'risks' as const,   label: lang === 'pa' ? 'ਸਿਹਤ ਜੋਖਮ' : lang === 'hi' ? 'स्वास्थ्य जोखिम' : 'Health Risks' },
    { id: 'pollen' as const,  label: lang === 'pa' ? 'ਪਰਾਗ' : lang === 'hi' ? 'पराग' : 'Pollen' },
    { id: 'classic' as const, label: lang === 'pa' ? 'ਚੇਤਾਵਨੀਆਂ' : lang === 'hi' ? 'चेतावनियां' : 'Alerts' },
  ];

  return (
    <View style={[styles.root, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t(lang, 'healthAlerts')}</Text>
        <TouchableOpacity onPress={announceAll} style={styles.speakBtn}>
          <Feather name="volume-2" size={18} color="#00F5FF" />
        </TouchableOpacity>
      </View>

      {/* AQI + Safety quick strip */}
      <View style={styles.quickStrip}>
        <View style={[styles.stripItem, { borderColor: intel.aqi.color + '44' }]}>
          <Text style={[styles.stripValue, { color: intel.aqi.color }]}>{intel.aqi.score}</Text>
          <Text style={styles.stripLabel}>AQI</Text>
        </View>
        <View style={[styles.stripItem, { borderColor: intel.safetyScore.color + '44' }]}>
          <Text style={[styles.stripValue, { color: intel.safetyScore.color }]}>{intel.safetyScore.score}</Text>
          <Text style={styles.stripLabel}>{lang === 'pa' ? 'ਸੁਰੱਖਿਆ' : lang === 'hi' ? 'सुरक्षा' : 'Safety'}</Text>
        </View>
        <View style={[styles.stripItem, { borderColor: overallColor + '44' }]}>
          <Text style={[styles.stripValue, { color: overallColor, fontSize: 14 }]}>{overallLevel.toUpperCase()}</Text>
          <Text style={styles.stripLabel}>{lang === 'pa' ? 'ਸਥਿਤੀ' : lang === 'hi' ? 'स्थिति' : 'Status'}</Text>
        </View>
        {(critCount > 0 || highCount > 0) && (
          <View style={[styles.stripItem, { borderColor: '#ef4444' + '44' }]}>
            <Text style={[styles.stripValue, { color: '#ef4444', fontSize: 14 }]}>{critCount > 0 ? `${critCount}⚠` : `${highCount}!`}</Text>
            <Text style={styles.stripLabel}>{lang === 'pa' ? 'ਜੋਖਮ' : lang === 'hi' ? 'जोखिम' : critCount > 0 ? 'Critical' : 'High'}</Text>
          </View>
        )}
      </View>

      {/* Tab selector */}
      <View style={styles.tabBar}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.id}
            onPress={() => { Haptics.selectionAsync(); setActiveTab(tab.id); }}
            style={[styles.tabBtn, activeTab === tab.id && styles.tabBtnActive]}
          >
            <Text style={[styles.tabLabel, activeTab === tab.id && styles.tabLabelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: botPad + 24 }]}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} tintColor="#00F5FF" />}
        showsVerticalScrollIndicator={false}
      >
        {/* ── HEALTH RISKS TAB ── */}
        {activeTab === 'risks' && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {lang === 'pa' ? '10 ਸਿਹਤ ਜੋਖਮ ਵਿਸ਼ਲੇਸ਼ਣ' : lang === 'hi' ? '10 स्वास्थ्य जोखिम विश्लेषण' : '10-Condition Health Risk Analysis'}
              </Text>
              <Text style={styles.sectionSub}>
                {lang === 'pa' ? 'ਲਾਈਵ ਸੈਂਸਰ ਡੇਟਾ ਤੋਂ ਗਣਨਾ ਕੀਤੀ ਗਈ' : lang === 'hi' ? 'लाइव सेंसर डेटा से गणना' : 'Computed from live sensor combinations'}
              </Text>
            </View>
            {intel.healthRisks.map(risk => (
              <RiskCard key={risk.id} risk={risk} lang={lang} />
            ))}
          </>
        )}

        {/* ── POLLEN TAB ── */}
        {activeTab === 'pollen' && (
          <>
            <View style={[styles.pollenCard, { borderColor: intel.pollen.color + '44' }]}>
              <Text style={[styles.pollenTitle, { color: intel.pollen.color }]}>
                {lang === 'pa' ? 'ਪਰਾਗ ਗਤੀਵਿਧੀ' : lang === 'hi' ? 'पराग गतिविधि' : 'Pollen Activity'}
              </Text>
              <Text style={[styles.pollenValue, { color: intel.pollen.color }]}>{intel.pollen.pollenActivity}</Text>

              <View style={styles.pollenGrid}>
                {[
                  { label: lang === 'pa' ? 'ਐਲਰਜੀ ਖਤਰਾ' : lang === 'hi' ? 'एलर्जी जोखिम' : 'Allergy Risk', value: intel.pollen.allergyRisk },
                  { label: lang === 'pa' ? 'ਬਾਹਰ ਸੁਰੱਖਿਆ' : lang === 'hi' ? 'बाहर सुरक्षा' : 'Outdoor Safety', value: `${intel.pollen.outdoorSafetyScore}/100` },
                  { label: lang === 'pa' ? 'ਸਲਾਹ' : lang === 'hi' ? 'सुझाव' : 'Advice', value: intel.pollen.outdoorSafety },
                ].map(item => (
                  <View key={item.label} style={styles.pollenGridItem}>
                    <Text style={styles.pollenGridLabel}>{item.label}</Text>
                    <Text style={[styles.pollenGridValue, { color: intel.pollen.color }]}>{item.value}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.pollenBar}>
                <View style={[styles.pollenBarFill, { width: `${intel.pollen.outdoorSafetyScore}%` as any, backgroundColor: intel.pollen.color }]} />
              </View>
              <Text style={styles.pollenRec}>{intel.pollen.recommendation}</Text>
            </View>
          </>
        )}

        {/* ── CLASSIC ALERTS TAB ── */}
        {activeTab === 'classic' && (
          <>
            <View style={[styles.overallCard, { borderColor: overallColor + '44' }]}>
              <View style={styles.overallTop}>
                <View style={[styles.scoreBadge, { backgroundColor: overallColor + '22', borderColor: overallColor + '55' }]}>
                  <Text style={[styles.scoreNum, { color: overallColor }]}>{score}</Text>
                  <Text style={[styles.scoreOf, { color: overallColor }]}>/100</Text>
                </View>
                <View style={styles.overallInfo}>
                  <Text style={[styles.overallLevel, { color: overallColor }]}>{overallLevel.toUpperCase()}</Text>
                  <Text style={styles.overallSub}>
                    {lang === 'pa' ? `${conditions.length} ਸਰਗਰਮ ਚੇਤਾਵਨੀਆਂ` : lang === 'hi' ? `${conditions.length} सक्रिय चेतावनियां` : `${conditions.length} active alert${conditions.length !== 1 ? 's' : ''}`}
                  </Text>
                  <View style={styles.counters}>
                    {severeCount > 0 && <View style={[styles.counter, { backgroundColor: '#FF336622', borderColor: '#FF336655' }]}><Text style={[styles.counterText, { color: '#FF3366' }]}>{severeCount} Severe</Text></View>}
                    {unhealthyCount > 0 && <View style={[styles.counter, { backgroundColor: '#FF8C0022', borderColor: '#FF8C0055' }]}><Text style={[styles.counterText, { color: '#FF8C00' }]}>{unhealthyCount} Unhealthy</Text></View>}
                    {moderateCount > 0 && <View style={[styles.counter, { backgroundColor: '#FFD70022', borderColor: '#FFD70055' }]}><Text style={[styles.counterText, { color: '#FFD700' }]}>{moderateCount} Moderate</Text></View>}
                  </View>
                </View>
              </View>
            </View>
            {conditions.length === 0 && (
              <View style={styles.safeCard}>
                <Feather name="check-circle" size={40} color="#00FF88" />
                <Text style={styles.safeTitle}>{lang === 'pa' ? 'ਸਭ ਕੁਝ ਸੁਰੱਖਿਅਤ ਹੈ!' : lang === 'hi' ? 'सब कुछ सुरक्षित है!' : 'All Clear!'}</Text>
                <Text style={styles.safeSub}>{t(lang, 'noAlerts')}</Text>
              </View>
            )}
            {conditions.map((c) => <HealthAlertCard key={c.id} condition={c} lang={lang} />)}
          </>
        )}

        <Text style={styles.disclaimer}>
          {lang === 'pa' ? '⚠ ਥ੍ਰੈਸ਼ਹੋਲਡ WHO/EPA ਦਿਸ਼ਾ-ਨਿਰਦੇਸ਼ਾਂ ਤੇ ਆਧਾਰਿਤ ਹਨ। ਡਾਕਟਰੀ ਸਲਾਹ ਦਾ ਬਦਲ ਨਹੀਂ।'
            : lang === 'hi' ? '⚠ थ्रेशोल्ड WHO/EPA दिशानिर्देशों पर आधारित हैं। चिकित्सीय सलाह का विकल्प नहीं।'
            : '⚠ Thresholds based on WHO/EPA guidelines. Not a substitute for medical advice.'}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A1628' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(0,245,255,0.1)', backgroundColor: 'rgba(13,31,60,0.9)' },
  headerTitle: { fontSize: 15, fontWeight: '800', color: '#FFFFFF', flex: 1 },
  speakBtn: { padding: 6 },
  quickStrip: { flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 10, gap: 8, backgroundColor: 'rgba(13,31,60,0.6)', borderBottomWidth: 1, borderBottomColor: 'rgba(0,245,255,0.08)' },
  stripItem: { flex: 1, backgroundColor: '#0D1F3C', borderRadius: 10, borderWidth: 1, padding: 8, alignItems: 'center' },
  stripValue: { fontSize: 18, fontWeight: '800' },
  stripLabel: { fontSize: 9, color: '#6B8CAE', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 1 },
  tabBar: { flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 8, gap: 6, backgroundColor: 'rgba(13,31,60,0.4)' },
  tabBtn: { flex: 1, paddingVertical: 7, paddingHorizontal: 4, borderRadius: 8, alignItems: 'center', backgroundColor: 'rgba(0,245,255,0.05)', borderWidth: 1, borderColor: 'rgba(0,245,255,0.1)' },
  tabBtnActive: { backgroundColor: 'rgba(0,245,255,0.15)', borderColor: 'rgba(0,245,255,0.4)' },
  tabLabel: { fontSize: 11, fontWeight: '700', color: '#6B8CAE' },
  tabLabelActive: { color: '#00F5FF' },
  content: { padding: 14, gap: 10 },
  sectionHeader: { gap: 2 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: '#FFFFFF' },
  sectionSub: { fontSize: 10, color: '#6B8CAE' },
  riskCard: { backgroundColor: '#0D1F3C', borderWidth: 1, borderRadius: 12, overflow: 'hidden' },
  riskHeader: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 8 },
  riskDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  riskName: { flex: 1, fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
  riskBadge: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  riskBadgeText: { fontSize: 10, fontWeight: '800' },
  riskBody: { paddingHorizontal: 12, paddingBottom: 12, gap: 8 },
  riskDesc: { fontSize: 11, color: '#6B8CAE', lineHeight: 16 },
  triggerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, alignItems: 'center' },
  triggerLabel: { fontSize: 10, color: '#6B8CAE', fontWeight: '700' },
  triggerChip: { backgroundColor: 'rgba(0,245,255,0.08)', borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 },
  triggerText: { fontSize: 10, color: '#00F5FF', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  pollenCard: { backgroundColor: '#0D1F3C', borderWidth: 1, borderRadius: 14, padding: 16, gap: 10 },
  pollenTitle: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  pollenValue: { fontSize: 32, fontWeight: '800' },
  pollenGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pollenGridItem: { backgroundColor: 'rgba(0,245,255,0.05)', borderRadius: 8, padding: 10, flex: 1, minWidth: '28%', gap: 3 },
  pollenGridLabel: { fontSize: 9, color: '#6B8CAE', fontWeight: '700', textTransform: 'uppercase' },
  pollenGridValue: { fontSize: 13, fontWeight: '800' },
  pollenBar: { height: 6, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' },
  pollenBarFill: { height: '100%', borderRadius: 3 },
  pollenRec: { fontSize: 11, color: '#6B8CAE', lineHeight: 17 },
  overallCard: { backgroundColor: '#0D1F3C', borderWidth: 1, borderRadius: 16, padding: 16 },
  overallTop: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  scoreBadge: { width: 72, height: 72, borderRadius: 36, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  scoreNum: { fontSize: 28, fontWeight: '800' },
  scoreOf: { fontSize: 10, fontWeight: '700', marginTop: -4 },
  overallInfo: { flex: 1, gap: 4 },
  overallLevel: { fontSize: 18, fontWeight: '800', letterSpacing: 1 },
  overallSub: { color: '#6B8CAE', fontSize: 12 },
  counters: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 4 },
  counter: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  counterText: { fontSize: 10, fontWeight: '700' },
  safeCard: { backgroundColor: '#0D1F3C', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(0,255,136,0.3)', padding: 32, alignItems: 'center', gap: 10 },
  safeTitle: { fontSize: 20, fontWeight: '800', color: '#00FF88' },
  safeSub: { color: '#6B8CAE', fontSize: 13, textAlign: 'center', lineHeight: 19 },
  disclaimer: { color: '#4A5568', fontSize: 10, textAlign: 'center', lineHeight: 15, marginTop: 4 },
});
