export type Lang = 'en' | 'hi' | 'pa';

const T = {
  appTitle:       { en: 'ENV Monitor', hi: 'ENV मॉनिटर', pa: 'ENV ਮਾਨੀਟਰ' },
  dashboard:      { en: 'Dashboard', hi: 'डैशबोर्ड', pa: 'ਡੈਸ਼ਬੋਰਡ' },
  health:         { en: 'Health', hi: 'स्वास्थ्य', pa: 'ਸਿਹਤ' },
  history:        { en: 'History', hi: 'इतिहास', pa: 'ਇਤਿਹਾਸ' },
  settings:       { en: 'Settings', hi: 'सेटिंग्स', pa: 'ਸੈਟਿੰਗਾਂ' },
  envScore:       { en: 'Env Score', hi: 'पर्यावरण स्कोर', pa: 'ਵਾਤਾਵਰਣ ਸਕੋਰ' },
  allSafe:        { en: 'All parameters safe', hi: 'सभी पैरामीटर सुरक्षित', pa: 'ਸਾਰੇ ਪੈਰਾਮੀਟਰ ਸੁਰੱਖਿਅਤ' },
  loading:        { en: 'Loading...', hi: 'लोड हो रहा है...', pa: 'ਲੋਡ ਹੋ ਰਿਹਾ ਹੈ...' },
  refresh:        { en: 'Refresh', hi: 'रीफ्रेश', pa: 'ਤਾਜ਼ਾ ਕਰੋ' },
  lastUpdated:    { en: 'Updated', hi: 'अपडेट', pa: 'ਅਪਡੇਟ' },
  good:           { en: 'Good', hi: 'अच्छा', pa: 'ਚੰਗਾ' },
  moderate:       { en: 'Moderate', hi: 'मध्यम', pa: 'ਮੱਧਮ' },
  unhealthy:      { en: 'Unhealthy', hi: 'अस्वस्थ', pa: 'ਅਸਿਹਤਮੰਦ' },
  severe:         { en: 'Severe', hi: 'गंभीर', pa: 'ਗੰਭੀਰ' },
  safe:           { en: 'Safe', hi: 'सुरक्षित', pa: 'ਸੁਰੱਖਿਅਤ' },
  noData:         { en: 'No Data', hi: 'डेटा नहीं', pa: 'ਡੇਟਾ ਨਹੀਂ' },
  errorFetch:     { en: 'Failed to fetch data. Pull to retry.', hi: 'डेटा लोड नहीं हुआ।', pa: 'ਡੇਟਾ ਲੋਡ ਨਹੀਂ ਹੋਇਆ।' },
  noAlerts:       { en: 'All conditions are within safe limits.', hi: 'सभी स्थितियां सुरक्षित सीमा में हैं।', pa: 'ਸਾਰੀਆਂ ਸਥਿਤੀਆਂ ਸੁਰੱਖਿਅਤ ਸੀਮਾ ਵਿੱਚ ਹਨ।' },
  healthAlerts:   { en: 'Health Alerts & Environmental Warnings', hi: 'स्वास्थ्य चेतावनियां', pa: 'ਸਿਹਤ ਚੇਤਾਵਨੀਆਂ' },
  recommendation: { en: 'Recommendation', hi: 'सिफारिश', pa: 'ਸਿਫ਼ਾਰਿਸ਼' },
  language:       { en: 'Language', hi: 'भाषा', pa: 'ਭਾਸ਼ਾ' },
  channel1:       { en: 'Channel 1 ID', hi: 'चैनल 1 ID', pa: 'ਚੈਨਲ 1 ID' },
  channel2:       { en: 'Channel 2 ID', hi: 'चैनल 2 ID', pa: 'ਚੈਨਲ 2 ID' },
  saveChannels:   { en: 'Save & Connect', hi: 'सहेजें और कनेक्ट करें', pa: 'ਸੇਵ ਕਰੋ ਅਤੇ ਕਨੈਕਟ ਕਰੋ' },
  voiceAssistant: { en: 'Voice Assistant', hi: 'वॉइस असिस्टेंट', pa: 'ਵੌਇਸ ਅਸਿਸਟੈਂਟ' },
  listening:      { en: 'Listening...', hi: 'सुन रहा हूं...', pa: 'ਸੁਣ ਰਿਹਾ ਹਾਂ...' },
  tapToSpeak:     { en: 'Tap mic to ask about sensors', hi: 'माइक दबाएं', pa: 'ਮਾਈਕ ਦਬਾਓ' },
  connected:      { en: 'Live', hi: 'लाइव', pa: 'ਲਾਈਵ' },
  disconnected:   { en: 'Offline', hi: 'ऑफलाइन', pa: 'ਆਫਲਾਈਨ' },
  autoRefresh:    { en: 'Auto Refresh (30s)', hi: 'ऑटो रीफ्रेश (30s)', pa: 'ਆਟੋ ਤਾਜ਼ਾ (30s)' },
  testVoice:      { en: 'Test Voice', hi: 'आवाज़ टेस्ट करें', pa: 'ਅਵਾਜ਼ ਟੈਸਟ ਕਰੋ' },
  recentReadings: { en: 'Recent Readings', hi: 'हाल की रीडिंग', pa: 'ਤਾਜ਼ਾ ਰੀਡਿੰਗ' },
  fetchingHistory:{ en: 'Loading historical data...', hi: 'ऐतिहासिक डेटा लोड हो रहा है...', pa: 'ਇਤਿਹਾਸਕ ਡੇਟਾ ਲੋਡ ਹੋ ਰਿਹਾ ਹੈ...' },
};

export function t(lang: Lang, key: keyof typeof T): string {
  return T[key][lang] ?? T[key]['en'];
}

export function sensorLabel(lang: Lang, id: string): string {
  const labels: Record<string, { en: string; hi: string; pa: string }> = {
    CO2:         { en: 'CO₂', hi: 'CO₂', pa: 'CO₂' },
    Smoke:       { en: 'Smoke', hi: 'धुआं', pa: 'ਧੂੰਆਂ' },
    NH3:         { en: 'Ammonia', hi: 'अमोनिया', pa: 'ਅਮੋਨੀਆ' },
    Benzene:     { en: 'Benzene', hi: 'बेंजीन', pa: 'ਬੈਂਜੀਨ' },
    LPG:         { en: 'LPG', hi: 'LPG', pa: 'LPG' },
    Dust:        { en: 'Dust', hi: 'धूल', pa: 'ਧੂੜ' },
    Rain:        { en: 'Rain', hi: 'बारिश', pa: 'ਮੀਂਹ' },
    Pressure:    { en: 'Pressure', hi: 'दबाव', pa: 'ਦਬਾਅ' },
    Temperature: { en: 'Temperature', hi: 'तापमान', pa: 'ਤਾਪਮਾਨ' },
    Humidity:    { en: 'Humidity', hi: 'नमी', pa: 'ਨਮੀ' },
    Altitude:    { en: 'Altitude', hi: 'ऊंचाई', pa: 'ਉਚਾਈ' },
  };
  return labels[id]?.[lang] ?? id;
}
