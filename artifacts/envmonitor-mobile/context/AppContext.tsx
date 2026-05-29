import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { fetchAllReadings, SensorReadings } from '@/services/thingspeak';
import type { Lang } from '@/constants/translations';

const DEFAULT_CH1 = '3307420';
const DEFAULT_CH2 = '3307422';

interface AppContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  ch1Id: string;
  ch2Id: string;
  saveChannels: (c1: string, c2: string) => Promise<void>;
  readings: SensorReadings | null;
  isLoading: boolean;
  isConnected: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => Promise<void>;
  autoRefresh: boolean;
  setAutoRefresh: (v: boolean) => void;
  voiceQuery: string;
  voiceResponse: string;
  setVoiceResult: (q: string, r: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');
  const [ch1Id, setCh1Id] = useState(DEFAULT_CH1);
  const [ch2Id, setCh2Id] = useState(DEFAULT_CH2);
  const [readings, setReadings] = useState<SensorReadings | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefreshState] = useState(true);
  const [voiceQuery, setVoiceQuery] = useState('');
  const [voiceResponse, setVoiceResponse] = useState('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const ch1Ref = useRef(ch1Id);
  const ch2Ref = useRef(ch2Id);

  useEffect(() => { ch1Ref.current = ch1Id; }, [ch1Id]);
  useEffect(() => { ch2Ref.current = ch2Id; }, [ch2Id]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchAllReadings(ch1Ref.current, ch2Ref.current);
      setReadings(data);
      setIsConnected(true);
      setLastUpdated(new Date());
    } catch (e) {
      setIsConnected(false);
      setError(String(e));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => fetchData(), 30000);
  }, [fetchData]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  // Load prefs on mount
  useEffect(() => {
    (async () => {
      try {
        const [savedLang, savedCh1, savedCh2, savedAuto] = await Promise.all([
          AsyncStorage.getItem('lang'),
          AsyncStorage.getItem('ch1Id'),
          AsyncStorage.getItem('ch2Id'),
          AsyncStorage.getItem('autoRefresh'),
        ]);
        if (savedLang) setLangState(savedLang as Lang);
        const c1 = savedCh1 ?? DEFAULT_CH1;
        const c2 = savedCh2 ?? DEFAULT_CH2;
        setCh1Id(c1);
        setCh2Id(c2);
        ch1Ref.current = c1;
        ch2Ref.current = c2;
        const auto = savedAuto !== 'false';
        setAutoRefreshState(auto);
        await fetchData();
        if (auto) startTimer();
      } catch {
        await fetchData();
        startTimer();
      }
    })();
    return () => stopTimer();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setLang = useCallback(async (l: Lang) => {
    setLangState(l);
    await AsyncStorage.setItem('lang', l);
  }, []);

  const saveChannels = useCallback(async (c1: string, c2: string) => {
    const t1 = c1.trim() || DEFAULT_CH1;
    const t2 = c2.trim() || DEFAULT_CH2;
    setCh1Id(t1);
    setCh2Id(t2);
    ch1Ref.current = t1;
    ch2Ref.current = t2;
    await AsyncStorage.multiSet([['ch1Id', t1], ['ch2Id', t2]]);
    await fetchData();
    if (autoRefresh) startTimer();
  }, [autoRefresh, fetchData, startTimer]);

  const setAutoRefresh = useCallback(async (v: boolean) => {
    setAutoRefreshState(v);
    await AsyncStorage.setItem('autoRefresh', String(v));
    if (v) startTimer();
    else stopTimer();
  }, [startTimer, stopTimer]);

  const setVoiceResult = useCallback((q: string, r: string) => {
    setVoiceQuery(q);
    setVoiceResponse(r);
  }, []);

  return (
    <AppContext.Provider value={{
      lang, setLang,
      ch1Id, ch2Id, saveChannels,
      readings, isLoading, isConnected, error, lastUpdated,
      refresh: fetchData,
      autoRefresh, setAutoRefresh,
      voiceQuery, voiceResponse, setVoiceResult,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
