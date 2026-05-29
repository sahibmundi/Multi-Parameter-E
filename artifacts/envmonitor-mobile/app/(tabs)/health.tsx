import { Feather } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import { Platform, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HealthAlertCard from '@/components/HealthAlertCard';
import { useApp } from '@/context/AppContext';
import { generateHealthConditions, getOverallScore, AlertLevel } from '@/constants/thresholds';
import { t, Lang } from '@/constants/translations';
import { computeIntelligence } from '@/engines/intelligence';
import type { HealthRisk } from '@/engines/health-risk';
import type { InfectionRisk } from '@/engines/infections-allergies';

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

function HealthRiskCard({ risk, lang }: { risk: HealthRisk; lang: Lang }) {
  const [expanded, setExpanded] = useState(false);
  const c = RISK_COLORS[risk.riskLevel] ?? '#6B8CAE';
  return (
    <TouchableOpacity
      onPress={() => { Haptics.selectionAsync(); setExpanded(!expanded); }}
      style={[styles.card, { borderColor: c + '44' }]}
      activeOpacity={0.8}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.dot, { backgroundColor: c }]} />
        <Text style={styles.cardName} numberOfLines={1}>{risk.condition}</Text>
        <View style={[styles.badge, { backgroundColor: c + '22', borderColor: c + '55' }]}>
          <Text style={[styles.badgeText, { color: c }]}>{risk.riskLevel}</Text>
        </View>
        <Feather name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color="#6B8CAE" />
      </View>
      {expanded && (
        <View style={styles.cardBody}>
          <Text style={styles.cardDesc}>{risk.description}</Text>
          {risk.triggers.length > 0 && (
            <View style={styles.triggerRow}>
              <Text style={styles.triggerLabel}>{lang === 'pa' ? 'ਕਾਰਨ:' : lang === 'hi' ? 'कारण:' : 'Triggers:'}</Text>
              {risk.triggers.map(tr => (
                <View key={tr} style={styles.triggerChip}><Text style={styles.triggerText}>{tr}</Text></View>
              ))}
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

function InfectionCard({ risk, lang }: { risk: InfectionRisk; lang: Lang }) {
  const [expanded, setExpanded] = useState(false);
  const c = RISK_COLORS[risk.riskLevel] ?? '#6B8CAE';
  return (
    <TouchableOpacity
      onPress={() => { Haptics.selectionAsync(); setExpanded(!expanded); }}
      style={[styles.card, { borderColor: c + '44' }]}
      activeOpacity={0.8}
    >
      <View style={styles.cardHeader}>
        <Text style={{ fontSize: 16 }}>{risk.icon}</Text>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.cardName} numberOfLines={1}>{risk.name}</Text>
          <Text style={[styles.catTag, { color: c + 'CC' }]}>{risk.category}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: c + '22', borderColor: c + '55' }]}>
          <Text style={[styles.badgeText, { color: c }]}>{risk.riskLevel}</Text>
        </View>
        <Feather name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color="#6B8CAE" />
      </View>
      {expanded && (
        <View style={styles.cardBody}>
          <Text style={styles.cardDesc}>{risk.description}</Text>
          {risk.warnings.length > 0 && (
            <View style={styles.warningBox}>
              {risk.warnings.map(w => (
                <View key={w} style={styles.warningRow}>
                  <Feather name="alert-triangle" size={11} color="#FF3366" />
                  <Text style={styles.warningText}>{w}</Text>
                </View>
              ))}
            </View>
          )}
          {risk.protections.length > 0 && (
            <View style={styles.protList}>
              <Text style={styles.protTitle}>{lang === 'pa' ? 'ਸੁਰੱਖਿਆ ਕਦਮ:' : lang === 'hi' ? 'सुरक्षा उपाय:' : 'Protective Actions:'}</Text>
              {risk.protections.slice(0, 4).map(p => (
                <View key={p} style={styles.protRow}>
                  <Feather name="shield" size={11} color="#00F5FF" />
                  <Text style={styles.protText}>{p}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

type TabId = 'infections' | 'health' | 'pollen' | 'sensors' | 'classic';

export default function HealthScreen() {
  const insets = useSafeAreaInsets();
  const { readings, isLoading, refresh, lang } = useApp();
  const [activeTab, setActiveTab] = useState<TabId>('infections');
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

  const severeCount    = conditions.filter(c => c.level === 'severe').length;
  const unhealthyCount = conditions.filter(c => c.level === 'unhealthy').length;
  const moderateCount  = conditions.filter(c => c.level === 'moderate').length;
  const overallLevel: AlertLevel = severeCount > 0 ? 'severe' : unhealthyCount > 0 ? 'unhealthy' : moderateCount > 0 ? 'moderate' : 'safe';
  const overallColor = LEVEL_COLORS[overallLevel];

  const critInfections = intel.infectionsAllergies.filter(r => r.riskLevel === 'Critical').length;
  const highInfections = intel.infectionsAllergies.filter(r => r.riskLevel === 'High').length;
  const sortedInfections = [...intel.infectionsAllergies].sort(
    (a, b) => ['Critical','High','Moderate','Low'].indexOf(a.riskLevel) - ['Critical','High','Moderate','Low'].indexOf(b.riskLevel)
  );

  const announceAll = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (conditions.length === 0) { speak(t(lang, 'noAlerts'), lang); return; }
    speak(conditions.map(c => c.title[lang]).join('. '), lang);
  };

  const TABS: { id: TabId; label: string }[] = [
    { id: 'infections', label: lang === 'pa' ? 'ਇਨਫੈਕਸ਼ਨਾਂ' : lang === 'hi' ? 'संक्रमण' : 'Infections' },
    { id: 'health',     label: lang === 'pa' ? 'ਸਿਹਤ ਜੋਖਮ' : lang === 'hi' ? 'स्वास्थ्य जोखिम' : 'Health Risks' },
    { id: 'pollen',     label: lang === 'pa' ? 'ਪਰਾਗ' : lang === 'hi' ? 'पराग' : 'Pollen' },
    { id: 'sensors',    label: lang === 'pa' ? 'ਸੈਂਸਰ' : lang === 'hi' ? 'सेंसर' : 'Sensors' },
    { id: 'classic',    label: lang === 'pa' ? 'ਚੇਤਾਵਨੀਆਂ' : lang === 'hi' ? 'चेतावनियां' : 'Alerts' },
  ];

  return (
    <View style={[styles.root, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t(lang, 'healthAlerts')}</Text>
        <TouchableOpacity onPress={announceAll} style={styles.speakBtn}>
          <Feather name="volume-2" size={18} color="#00F5FF" />
        </TouchableOpacity>
      </View>

      {/* Quick strip */}
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
          <Text style={[styles.stripValue, { color: overallColor, fontSize: 13 }]}>{overallLevel.toUpperCase()}</Text>
          <Text style={styles.stripLabel}>{lang === 'pa' ? 'ਸਥਿਤੀ' : lang === 'hi' ? 'स्थिति' : 'Status'}</Text>
        </View>
        <View style={[styles.stripItem, { borderColor: critInfections > 0 ? '#ef4444' + '44' : '#eab308' + '44' }]}>
          <Text style={[styles.stripValue, { color: critInfections > 0 ? '#ef4444' : '#eab308', fontSize: 18 }]}>
            {critInfections > 0 ? critInfections : highInfections}
          </Text>
          <Text style={styles.stripLabel}>{critInfections > 0 ? 'Critical' : highInfections > 0 ? 'High Risk' : 'Infections'}</Text>
        </View>
      </View>

      {/* Tab bar — scrollable */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={styles.tabBar}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.id}
            onPress={() => { Haptics.selectionAsync(); setActiveTab(tab.id); }}
            style={[styles.tabBtn, activeTab === tab.id && styles.tabBtnActive]}
          >
            <Text style={[styles.tabLabel, activeTab === tab.id && styles.tabLabelActive]}>{tab.label}</Text>
            {tab.id === 'infections' && (critInfections > 0 || highInfections > 0) && (
              <View style={styles.tabDot} />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: botPad + 24 }]}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} tintColor="#00F5FF" />}
        showsVerticalScrollIndicator={false}
      >

        {/* ── INFECTIONS & ALLERGIES ── */}
        {activeTab === 'infections' && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {lang === 'pa' ? '15 ਇਨਫੈਕਸ਼ਨ ਅਤੇ ਐਲਰਜੀ ਜੋਖਮ' : lang === 'hi' ? '15 संक्रमण और एलर्जी जोखिम' : '15 Infection & Allergy Risks'}
              </Text>
              <Text style={styles.sectionSub}>
                {lang === 'pa' ? 'PMS7003 ਅਤੇ ਸਾਰੇ ਸੈਂਸਰ ਡੇਟਾ ਤੋਂ' : lang === 'hi' ? 'PMS7003 और सभी सेंसर डेटा से' : 'Computed from PMS7003 + all sensor data'}
              </Text>
            </View>

            {/* Summary tiles */}
            <View style={styles.summaryRow}>
              {(['Critical', 'High', 'Moderate', 'Low'] as const).map(lvl => {
                const n = intel.infectionsAllergies.filter(r => r.riskLevel === lvl).length;
                const c = RISK_COLORS[lvl];
                return (
                  <View key={lvl} style={[styles.summaryTile, { borderColor: c + '44' }]}>
                    <Text style={[styles.summaryNum, { color: c }]}>{n}</Text>
                    <Text style={styles.summaryLabel}>{lvl}</Text>
                  </View>
                );
              })}
            </View>

            {critInfections > 0 && (
              <View style={styles.critBanner}>
                <Feather name="alert-triangle" size={13} color="#FF3366" />
                <Text style={styles.critText}>
                  {lang === 'pa' ? `${critInfections} ਗੰਭੀਰ ਸਥਿਤੀਆਂ — ਤੁਰੰਤ ਕਾਰਵਾਈ ਕਰੋ`
                    : lang === 'hi' ? `${critInfections} गंभीर स्थितियां — तुरंत कार्रवाई करें`
                    : `${critInfections} critical condition${critInfections > 1 ? 's' : ''} — take immediate action`}
                </Text>
              </View>
            )}

            {sortedInfections.map(risk => (
              <InfectionCard key={risk.id} risk={risk} lang={lang} />
            ))}
          </>
        )}

        {/* ── HEALTH RISKS ── */}
        {activeTab === 'health' && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{lang === 'pa' ? '10 ਸਿਹਤ ਜੋਖਮ ਵਿਸ਼ਲੇਸ਼ਣ' : lang === 'hi' ? '10 स्वास्थ्य जोखिम' : '10-Condition Health Risk Analysis'}</Text>
            </View>
            {intel.healthRisks.map(risk => (
              <HealthRiskCard key={risk.id} risk={risk} lang={lang} />
            ))}
          </>
        )}

        {/* ── POLLEN ── */}
        {activeTab === 'pollen' && (
          <View style={[styles.pollenCard, { borderColor: intel.pollen.color + '44' }]}>
            <Text style={[styles.pollenTitle, { color: intel.pollen.color }]}>{lang === 'pa' ? 'ਪਰਾਗ ਗਤੀਵਿਧੀ' : lang === 'hi' ? 'पराग गतिविधि' : 'Pollen Activity'}</Text>
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
        )}

        {/* ── SENSOR STATUS ── */}
        {activeTab === 'sensors' && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{lang === 'pa' ? 'ਸੈਂਸਰ ਭਰੋਸੇਯੋਗਤਾ' : lang === 'hi' ? 'सेंसर विश्वसनीयता' : 'Sensor Reliability Monitor'}</Text>
              <Text style={styles.sectionSub}>{lang === 'pa' ? 'ਔਫਲਾਈਨ, ਫ੍ਰੋਜ਼ਨ, ਸਪਾਈਕ ਅਤੇ ਅਵੈਧ ਰੀਡਿੰਗਾਂ ਦੀ ਖੋਜ' : lang === 'hi' ? 'ऑफलाइन, फ्रोजन, स्पाइक और अमान्य रीडिंग की पहचान' : 'Detects offline, frozen, spike, and invalid readings'}</Text>
            </View>
            {!intel.reliability.allHealthy && (
              <View style={styles.maintBanner}>
                <Feather name="tool" size={13} color="#FFD700" />
                <Text style={styles.maintText}>
                  {lang === 'pa'
                    ? `ਰੱਖ-ਰਖਾਅ ਅਲਰਟ: ${intel.reliability.offlineCount > 0 ? `${intel.reliability.offlineCount} ਸੈਂਸਰ ਔਫਲਾਈਨ` : `${intel.reliability.degradedCount} ਸੈਂਸਰ ਅਸਧਾਰਨ ਰੀਡਿੰਗ`}`
                    : lang === 'hi'
                    ? `रखरखाव अलर्ट: ${intel.reliability.offlineCount > 0 ? `${intel.reliability.offlineCount} सेंसर ऑफलाइन` : `${intel.reliability.degradedCount} सेंसर असामान्य रीडिंग`}`
                    : `Maintenance alert: ${intel.reliability.offlineCount > 0 ? `${intel.reliability.offlineCount} sensor(s) offline/invalid` : `${intel.reliability.degradedCount} sensor(s) abnormal`} — check hardware`}
                </Text>
              </View>
            )}
            <View style={styles.sensorGrid}>
              {intel.reliability.sensors.map(sensor => (
                <View key={sensor.id} style={[styles.sensorChip, { borderColor: sensor.color + '55' }]}>
                  <View style={[styles.sensorDot, { backgroundColor: sensor.color }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sensorName} numberOfLines={1}>{sensor.name}</Text>
                    <Text style={[styles.sensorStatus, { color: sensor.color }]}>{sensor.status}</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {/* ── CLASSIC ALERTS ── */}
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
                  <Text style={styles.overallSub}>{conditions.length} active alert{conditions.length !== 1 ? 's' : ''}</Text>
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
            {conditions.map(c => <HealthAlertCard key={c.id} condition={c} lang={lang} />)}
          </>
        )}

        <Text style={styles.disclaimer}>
          {lang === 'pa' ? '⚠ WHO/EPA ਦਿਸ਼ਾ-ਨਿਰਦੇਸ਼ਾਂ ਤੇ ਆਧਾਰਿਤ। ਡਾਕਟਰੀ ਸਲਾਹ ਦਾ ਬਦਲ ਨਹੀਂ।'
            : lang === 'hi' ? '⚠ WHO/EPA दिशानिर्देशों पर आधारित। चिकित्सीय सलाह का विकल्प नहीं।'
            : '⚠ Based on WHO/EPA guidelines. Not a substitute for medical advice.'}
        </Text>
      </ScrollView>
    </View>
  );
}

const S = StyleSheet;
const styles = S.create({
  root: { flex: 1, backgroundColor: '#0A1628' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(0,245,255,0.1)', backgroundColor: 'rgba(13,31,60,0.9)' },
  headerTitle: { fontSize: 15, fontWeight: '800', color: '#FFFFFF', flex: 1 },
  speakBtn: { padding: 6 },
  quickStrip: { flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 10, gap: 8, backgroundColor: 'rgba(13,31,60,0.6)', borderBottomWidth: 1, borderBottomColor: 'rgba(0,245,255,0.08)' },
  stripItem: { flex: 1, backgroundColor: '#0D1F3C', borderRadius: 10, borderWidth: 1, padding: 8, alignItems: 'center' },
  stripValue: { fontSize: 18, fontWeight: '800' },
  stripLabel: { fontSize: 9, color: '#6B8CAE', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 1 },
  tabScroll: { maxHeight: 46, backgroundColor: 'rgba(13,31,60,0.4)', borderBottomWidth: 1, borderBottomColor: 'rgba(0,245,255,0.08)' },
  tabBar: { paddingHorizontal: 14, paddingVertical: 8, gap: 6, flexDirection: 'row', alignItems: 'center' },
  tabBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, backgroundColor: 'rgba(0,245,255,0.05)', borderWidth: 1, borderColor: 'rgba(0,245,255,0.1)', flexDirection: 'row', alignItems: 'center', gap: 4 },
  tabBtnActive: { backgroundColor: 'rgba(0,245,255,0.15)', borderColor: 'rgba(0,245,255,0.4)' },
  tabLabel: { fontSize: 11, fontWeight: '700', color: '#6B8CAE' },
  tabLabelActive: { color: '#00F5FF' },
  tabDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FF3366' },
  content: { padding: 14, gap: 10 },
  sectionHeader: { gap: 2 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: '#FFFFFF' },
  sectionSub: { fontSize: 10, color: '#6B8CAE' },
  summaryRow: { flexDirection: 'row', gap: 8 },
  summaryTile: { flex: 1, backgroundColor: '#0D1F3C', borderRadius: 10, borderWidth: 1, padding: 10, alignItems: 'center' },
  summaryNum: { fontSize: 22, fontWeight: '800' },
  summaryLabel: { fontSize: 9, color: '#6B8CAE', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  critBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,51,102,0.1)', borderWidth: 1, borderColor: 'rgba(255,51,102,0.3)', borderRadius: 10, padding: 10 },
  critText: { flex: 1, color: '#FF3366', fontSize: 12, fontWeight: '600' },
  card: { backgroundColor: '#0D1F3C', borderWidth: 1, borderRadius: 12, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  cardName: { flex: 1, fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
  catTag: { fontSize: 9, fontWeight: '600', textTransform: 'uppercase' },
  badge: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  badgeText: { fontSize: 10, fontWeight: '800' },
  cardBody: { paddingHorizontal: 12, paddingBottom: 12, gap: 8 },
  cardDesc: { fontSize: 11, color: '#6B8CAE', lineHeight: 16 },
  triggerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, alignItems: 'center' },
  triggerLabel: { fontSize: 10, color: '#6B8CAE', fontWeight: '700' },
  triggerChip: { backgroundColor: 'rgba(0,245,255,0.08)', borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 },
  triggerText: { fontSize: 10, color: '#00F5FF', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  warningBox: { backgroundColor: 'rgba(255,51,102,0.08)', borderRadius: 8, padding: 8, gap: 5, borderWidth: 1, borderColor: 'rgba(255,51,102,0.2)' },
  warningRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  warningText: { flex: 1, fontSize: 11, color: '#FF3366', fontWeight: '600', lineHeight: 15 },
  protList: { gap: 5 },
  protTitle: { fontSize: 10, color: '#6B8CAE', fontWeight: '700' },
  protRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  protText: { flex: 1, fontSize: 11, color: '#CCDDEE', lineHeight: 15 },
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
  sensorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sensorChip: { width: '48%', backgroundColor: '#0D1F3C', borderWidth: 1, borderRadius: 10, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
  sensorDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  sensorName: { fontSize: 11, fontWeight: '700', color: '#FFFFFF' },
  sensorStatus: { fontSize: 10, fontWeight: '600' },
  maintBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,215,0,0.1)', borderWidth: 1, borderColor: 'rgba(255,215,0,0.3)', borderRadius: 10, padding: 10 },
  maintText: { flex: 1, color: '#FFD700', fontSize: 11, fontWeight: '600' },
  overallCard: { backgroundColor: '#0D1F3C', borderWidth: 1, borderRadius: 16, padding: 16 },
  overallTop: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  scoreBadge: { width: 72, height: 72, borderRadius: 36, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  scoreNum: { fontSize: 28, fontWeight: '800' },
  scoreOf: { fontSize: 10, fontWeight: '700', marginTop: -4 },
  overallInfo: { flex: 1, gap: 4 },
  overallLevel: { fontSize: 18, fontWeight: '800', letterSpacing: 1 },
  overallSub: { color: '#6B8CAE', fontSize: 12 },
  safeCard: { backgroundColor: '#0D1F3C', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(0,255,136,0.3)', padding: 32, alignItems: 'center', gap: 10 },
  safeTitle: { fontSize: 20, fontWeight: '800', color: '#00FF88' },
  safeSub: { color: '#6B8CAE', fontSize: 13, textAlign: 'center', lineHeight: 19 },
  disclaimer: { color: '#4A5568', fontSize: 10, textAlign: 'center', lineHeight: 15, marginTop: 4 },
});
