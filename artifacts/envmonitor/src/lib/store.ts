import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Language = 'en' | 'hi' | 'pa';

interface AppState {
  theme: 'dark' | 'light';
  language: Language;
  setTheme: (theme: 'dark' | 'light') => void;
  setLanguage: (lang: Language) => void;
  
  // Voice Assistant State
  isListening: boolean;
  setIsListening: (val: boolean) => void;
  voiceTranscript: string;
  setVoiceTranscript: (val: string) => void;
  voiceResponse: string;
  setVoiceResponse: (val: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: 'dark',
      language: 'en',
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      
      isListening: false,
      setIsListening: (isListening) => set({ isListening }),
      voiceTranscript: '',
      setVoiceTranscript: (voiceTranscript) => set({ voiceTranscript }),
      voiceResponse: '',
      setVoiceResponse: (voiceResponse) => set({ voiceResponse }),
    }),
    {
      name: 'env-monitor-storage',
      partialize: (state) => ({ theme: state.theme, language: state.language }), // only persist theme/lang
    }
  )
);
