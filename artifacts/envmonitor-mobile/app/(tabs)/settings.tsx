import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/context/AppContext';
import { t, Lang } from '@/constants/translations';

const LANG_OPTIONS: { code: Lang; label: string; native: string }[] = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'hi', label: 'Hindi', native: 'हिंदी' },
  { code: 'pa', label: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
];

function speak(text: string, lang: Lang) {
  Speech.stop();
  Speech.speak(text, {
    language: lang === 'pa' ? 'pa-IN' : lang === 'hi' ? 'hi-IN' : 'en-US',
    pitch: 0.95,
    rate: Platform.OS === 'ios' ? 0.5 : 0.9,
    onDone: () => {},
    onError: () => {
      // If pa-IN fails, fall back to hi-IN
      if (lang === 'pa') {
        Speech.speak(text, { language: 'hi-IN', pitch: 0.95, rate: Platform.OS === 'ios' ? 0.5 : 0.9 });
      }
    },
  });
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { lang, setLang, ch1Id, ch2Id, saveChannels, autoRefresh, setAutoRefresh, isConnected } = useApp();
  const [c1, setC1] = useState(ch1Id);
  const [c2, setC2] = useState(ch2Id);
  const [saving, setSaving] = useState(false);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const handleSave = async () => {
    if (!c1.trim() || !c2.trim()) {
      Alert.alert('Error', 'Please enter both channel IDs');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSaving(true);
    await saveChannels(c1.trim(), c2.trim());
    setSaving(false);
    Alert.alert(
      lang === 'pa' ? 'ਸਫਲ' : lang === 'hi' ? 'सफल' : 'Connected',
      lang === 'pa' ? 'ThingSpeak ਨਾਲ ਜੁੜ ਗਿਆ!' : lang === 'hi' ? 'ThingSpeak से जुड़ गया!' : 'Successfully connected to ThingSpeak!'
    );
  };

  const testVoice = () => {
    Haptics.selectionAsync();
    const msg = lang === 'pa'
      ? 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਵਾਤਾਵਰਣ ਨਿਗਰਾਨੀ ਪ੍ਰਣਾਲੀ ਕੰਮ ਕਰ ਰਹੀ ਹੈ।'
      : lang === 'hi'
      ? 'नमस्ते! पर्यावरण निगरानी प्रणाली कार्य कर रही है।'
      : 'Hello! Environmental monitoring system is working correctly.';
    speak(msg, lang);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: topPad }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t(lang, 'settings')}</Text>
        <View style={[styles.connBadge, { borderColor: isConnected ? '#00FF8844' : '#FF336644', backgroundColor: isConnected ? '#00FF8811' : '#FF336611' }]}>
          <View style={[styles.connDot, { backgroundColor: isConnected ? '#00FF88' : '#FF3366' }]} />
          <Text style={[styles.connText, { color: isConnected ? '#00FF88' : '#FF3366' }]}>
            {isConnected ? t(lang, 'connected') : t(lang, 'disconnected')}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: botPad + 24 }]} showsVerticalScrollIndicator={false}>

        {/* Language */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t(lang, 'language')}</Text>
          <View style={styles.langRow}>
            {LANG_OPTIONS.map((opt) => {
              const active = lang === opt.code;
              return (
                <TouchableOpacity
                  key={opt.code}
                  onPress={() => { Haptics.selectionAsync(); setLang(opt.code); }}
                  style={[styles.langBtn, { borderColor: active ? '#00F5FF' : 'rgba(0,245,255,0.2)', backgroundColor: active ? 'rgba(0,245,255,0.15)' : 'transparent' }]}
                >
                  <Text style={[styles.langCode, { color: active ? '#00F5FF' : '#6B8CAE' }]}>{opt.code.toUpperCase()}</Text>
                  <Text style={[styles.langNative, { color: active ? '#FFFFFF' : '#4A5568' }]}>{opt.native}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Voice */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t(lang, 'voiceAssistant')}</Text>
          <View style={styles.card}>
            <Text style={styles.cardDesc}>
              {lang === 'pa'
                ? 'ਆਵਾਜ਼ ਅਸਿਸਟੈਂਟ ਸੈਂਸਰ ਰੀਡਿੰਗ ਅਤੇ ਸਿਹਤ ਚੇਤਾਵਨੀਆਂ ਸੁਣਾਉਂਦਾ ਹੈ।'
                : lang === 'hi'
                ? 'वॉइस असिस्टेंट सेंसर रीडिंग और स्वास्थ्य अलर्ट पढ़ता है।'
                : 'Voice assistant reads sensor readings and health alerts in your chosen language.'}
            </Text>
            <View style={styles.voiceInfo}>
              <Feather name="info" size={12} color="#6B8CAE" />
              <Text style={styles.voiceInfoText}>
                {lang === 'pa'
                  ? 'ਪੰਜਾਬੀ TTS ਲਈ: Android ਤੇ Google TTS ਵਿੱਚ Punjabi ਭਾਸ਼ਾ ਡਾਊਨਲੋਡ ਕਰੋ।'
                  : lang === 'hi'
                  ? 'हिंदी TTS के लिए: Google TTS में Hindi भाषा डाउनलोड करें।'
                  : 'For best results, ensure the language pack is installed in your device TTS settings.'}
              </Text>
            </View>
            <TouchableOpacity onPress={testVoice} style={styles.testBtn}>
              <Feather name="volume-2" size={15} color="#0A1628" />
              <Text style={styles.testBtnText}>{t(lang, 'testVoice')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Auto refresh */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {lang === 'pa' ? 'ਡੇਟਾ ਤਾਜ਼ਾ ਕਰਨਾ' : lang === 'hi' ? 'डेटा रीफ्रेश' : 'Data Refresh'}
          </Text>
          <View style={styles.card}>
            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.switchLabel}>{t(lang, 'autoRefresh')}</Text>
                <Text style={styles.switchSub}>
                  {lang === 'pa' ? 'ਹਰ 30 ਸਕਿੰਟ ਵਿੱਚ ਆਪਣੇ ਆਪ ਅਪਡੇਟ ਹੁੰਦਾ ਹੈ' : lang === 'hi' ? 'हर 30 सेकंड में अपने आप अपडेट' : 'Automatically updates every 30 seconds'}
                </Text>
              </View>
              <Switch
                value={autoRefresh}
                onValueChange={(v) => { Haptics.selectionAsync(); setAutoRefresh(v); }}
                trackColor={{ false: '#1E3A5F', true: 'rgba(0,245,255,0.4)' }}
                thumbColor={autoRefresh ? '#00F5FF' : '#4A5568'}
              />
            </View>
          </View>
        </View>

        {/* ThingSpeak channels */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ThingSpeak</Text>
          <View style={styles.card}>
            <Text style={styles.cardDesc}>
              {lang === 'pa'
                ? 'ਡਿਫੌਲਟ ਚੈਨਲ ਪਹਿਲਾਂ ਤੋਂ ਭਰੇ ਹੋਏ ਹਨ। ਆਪਣੇ ਚੈਨਲ IDs ਦਾਖਲ ਕਰੋ ਜੇ ਵੱਖਰੇ ਸੈਂਸਰ ਹਨ।'
                : lang === 'hi'
                ? 'डिफ़ॉल्ट चैनल पहले से भरे हैं। अपने चैनल IDs दर्ज करें।'
                : 'Default channels are pre-configured. Enter custom channel IDs to connect different sensors.'}
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t(lang, 'channel1')}</Text>
              <TextInput
                value={c1}
                onChangeText={setC1}
                style={styles.input}
                keyboardType="numeric"
                placeholder="e.g. 3307420"
                placeholderTextColor="#4A5568"
                selectionColor="#00F5FF"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t(lang, 'channel2')}</Text>
              <TextInput
                value={c2}
                onChangeText={setC2}
                style={styles.input}
                keyboardType="numeric"
                placeholder="e.g. 3307422"
                placeholderTextColor="#4A5568"
                selectionColor="#00F5FF"
              />
            </View>

            <TouchableOpacity onPress={handleSave} disabled={saving} style={[styles.saveBtn, saving && { opacity: 0.6 }]}>
              <Feather name="link" size={15} color="#0A1628" />
              <Text style={styles.saveBtnText}>{saving ? (lang === 'pa' ? 'ਜੁੜ ਰਿਹਾ ਹੈ...' : lang === 'hi' ? 'जोड़ रहा है...' : 'Connecting...') : t(lang, 'saveChannels')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* App info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>EnvMonitor Mobile · v1.0.0</Text>
          <Text style={styles.appInfoText}>Channels: {ch1Id} · {ch2Id}</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  headerTitle: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },
  connBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4,
  },
  connDot: { width: 6, height: 6, borderRadius: 3 },
  connText: { fontSize: 10, fontWeight: '700' },
  content: { padding: 14, gap: 20 },
  section: { gap: 10 },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: '#6B8CAE', letterSpacing: 1.5, textTransform: 'uppercase' },
  card: {
    backgroundColor: '#0D1F3C', borderWidth: 1,
    borderColor: 'rgba(0,245,255,0.15)', borderRadius: 14, padding: 14, gap: 12,
  },
  cardDesc: { color: '#6B8CAE', fontSize: 12, lineHeight: 18 },
  langRow: { flexDirection: 'row', gap: 10 },
  langBtn: {
    flex: 1, alignItems: 'center', borderWidth: 1.5,
    borderRadius: 12, paddingVertical: 12, gap: 3,
  },
  langCode: { fontSize: 16, fontWeight: '800', letterSpacing: 1 },
  langNative: { fontSize: 12, fontWeight: '600' },
  voiceInfo: {
    flexDirection: 'row', gap: 6, alignItems: 'flex-start',
    backgroundColor: 'rgba(0,245,255,0.05)', borderRadius: 8, padding: 10,
  },
  voiceInfoText: { flex: 1, color: '#6B8CAE', fontSize: 11, lineHeight: 16 },
  testBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: '#00F5FF', borderRadius: 10, paddingVertical: 12,
  },
  testBtnText: { color: '#0A1628', fontSize: 14, fontWeight: '800' },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  switchLabel: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  switchSub: { color: '#6B8CAE', fontSize: 11, marginTop: 2 },
  inputGroup: { gap: 6 },
  inputLabel: { color: '#6B8CAE', fontSize: 11, fontWeight: '600', letterSpacing: 0.5 },
  input: {
    backgroundColor: 'rgba(0,245,255,0.05)', borderWidth: 1,
    borderColor: 'rgba(0,245,255,0.2)', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 11,
    color: '#FFFFFF', fontSize: 15, fontFamily: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }),
  },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: '#00F5FF', borderRadius: 10, paddingVertical: 13,
  },
  saveBtnText: { color: '#0A1628', fontSize: 14, fontWeight: '800' },
  appInfo: { alignItems: 'center', gap: 3 },
  appInfoText: { color: '#2A3A4C', fontSize: 10 },
});
