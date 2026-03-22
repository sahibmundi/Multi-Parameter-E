import { useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { PARAMETERS, useSensorData } from './use-sensor-data';
import { translations } from '@/lib/i18n';

// Extend Window interface for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export function useVoiceAssistant() {
  const { language, isListening, setIsListening, setVoiceTranscript, setVoiceResponse } = useAppStore();
  const { latestData, score, isConnected } = useSensorData(1);
  const recognitionRef = useRef<any>(null);
  const t = translations[language];

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      
      // Set language based on app state
      const langMap = { en: 'en-US', hi: 'hi-IN', pa: 'pa-IN' };
      recognitionRef.current.lang = langMap[language];

      recognitionRef.current.onstart = () => {
        setIsListening(true);
      };

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setVoiceTranscript(transcript);
        processCommand(transcript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
        setVoiceResponse("Sorry, I didn't catch that.");
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    } else {
      console.warn("Speech Recognition API not supported in this browser.");
    }
  }, [language]);

  const speak = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Try to find a male voice, ideally matching language
      const voices = window.speechSynthesis.getVoices();
      const langMap = { en: 'en', hi: 'hi', pa: 'hi' }; // Fallback pa to hi for synth if pa not available
      const targetLangPrefix = langMap[language];
      
      let selectedVoice = voices.find(v => v.lang.startsWith(targetLangPrefix) && (v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('guy')));
      
      // Fallback 1: Any voice in language
      if (!selectedVoice) {
         selectedVoice = voices.find(v => v.lang.startsWith(targetLangPrefix));
      }
      
      // Fallback 2: Google UK English Male
      if (!selectedVoice) {
         selectedVoice = voices.find(v => v.name === 'Google UK English Male');
      }

      if (selectedVoice) utterance.voice = selectedVoice;
      
      // Adjust params for more natural AI feel
      utterance.pitch = 0.9;
      utterance.rate = 1.0;
      
      setVoiceResponse(text);
      window.speechSynthesis.speak(utterance);
    }
  }, [language, setVoiceResponse]);

  const processCommand = useCallback((transcript: string) => {
    if (!isConnected) {
        speak(language === 'en' ? "System is disconnected." : "ਸਿਸਟਮ ਡਿਸਕਨੈਕਟ ਹੈ।");
        return;
    }

    const lowerStr = transcript.toLowerCase();
    let response = "";
    let handled = false;

    // Check for specific parameters
    for (const param of PARAMETERS) {
        const paramName = t[param.nameKey as keyof typeof t].toString().toLowerCase();
        // Also check english ID as fallback alias
        if (lowerStr.includes(paramName) || lowerStr.includes(param.id)) {
            const data = latestData[param.id];
            if (data) {
                let statusStr = "";
                if (data.status === 'GOOD') statusStr = t.statusGood;
                if (data.status === 'MODERATE') statusStr = t.statusModerate;
                if (data.status === 'DANGEROUS') statusStr = t.statusDangerous;

                if (language === 'en') {
                    response = `The ${paramName} is currently ${data.value.toFixed(2)} ${param.unit}. The status is ${statusStr}.`;
                } else if (language === 'hi') {
                    response = `वर्तमान ${paramName} ${data.value.toFixed(2)} ${param.unit} है। स्थिति ${statusStr} है।`;
                } else {
                    response = `ਮੌਜੂਦਾ ${paramName} ${data.value.toFixed(2)} ${param.unit} ਹੈ। ਸਥਿਤੀ ${statusStr} ਹੈ।`;
                }
                handled = true;
                break;
            }
        }
    }

    // Check for overall score/quality
    if (!handled && (lowerStr.includes('score') || lowerStr.includes('quality') || lowerStr.includes('overall') || lowerStr.includes('ਸਕੋਰ') || lowerStr.includes('स्कोर'))) {
        if (language === 'en') {
            response = `The overall environment score is ${score} out of 100. ${score < 50 ? 'Please take caution.' : 'Conditions are optimal.'}`;
        } else if (language === 'hi') {
            response = `कुल पर्यावरण स्कोर 100 में से ${score} है।`;
        } else {
            response = `ਕੁੱਲ ਵਾਤਾਵਰਣ ਸਕੋਰ 100 ਵਿੱਚੋਂ ${score} ਹੈ।`;
        }
        handled = true;
    }

    if (!handled) {
        response = language === 'en' ? "I'm not sure about that. Try asking about temperature or air quality." : 
                   language === 'hi' ? "मुझे इसके बारे में पक्का नहीं पता। तापमान के बारे में पूछने का प्रयास करें।" :
                   "ਮੈਨੂੰ ਇਸ ਬਾਰੇ ਪੱਕਾ ਪਤਾ ਨਹੀਂ ਹੈ। ਤਾਪਮਾਨ ਬਾਰੇ ਪੁੱਛਣ ਦੀ ਕੋਸ਼ਿਸ਼ ਕਰੋ।";
    }

    speak(response);
  }, [isConnected, latestData, score, speak, language, t]);

  const toggleListen = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setVoiceTranscript('');
      setVoiceResponse('');
      try {
        recognitionRef.current?.start();
      } catch (e) {
        console.error("Could not start recognition", e);
      }
    }
  };

  return { toggleListen, speak };
}
