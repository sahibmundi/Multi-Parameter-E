import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, X } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useVoiceAssistant } from "@/hooks/use-voice-assistant";
import { useTranslation } from "@/lib/i18n";

export function VoiceAssistantFAB() {
  const { isListening, voiceTranscript, voiceResponse } = useAppStore();
  const { toggleListen } = useVoiceAssistant();
  const { language } = useAppStore();
  const t = useTranslation(language);

  return (
    <>
      <AnimatePresence>
        {(voiceTranscript || voiceResponse || isListening) && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-24 right-6 w-80 glass-card p-4 rounded-2xl z-50 shadow-2xl border-primary/30"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isListening ? 'bg-red-500 animate-pulse' : 'bg-primary'}`} />
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  AI Assistant
                </span>
              </div>
              <button 
                onClick={() => { useAppStore.getState().setVoiceTranscript(''); useAppStore.getState().setVoiceResponse(''); }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-3 mt-3">
              {voiceTranscript && (
                <div className="bg-secondary/50 rounded-lg p-3 text-sm text-foreground/80 italic border border-border/50 self-end ml-4">
                  "{voiceTranscript}"
                </div>
              )}
              
              {voiceResponse ? (
                <div className="bg-primary/10 rounded-lg p-3 text-sm text-primary font-medium border border-primary/20 mr-4 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
                  {voiceResponse}
                </div>
              ) : isListening ? (
                <div className="flex gap-1 items-center px-2 py-1 h-8">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  <span className="ml-2 text-xs text-muted-foreground">{t.listening}</span>
                </div>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={toggleListen}
        className={`fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center z-50 shadow-xl transition-all duration-300
          ${isListening 
            ? 'bg-red-500 text-white shadow-[0_0_25px_rgba(239,68,68,0.6)] animate-pulse-fast' 
            : 'bg-primary text-primary-foreground shadow-[0_0_20px_hsl(var(--primary)/0.4)] hover:shadow-[0_0_30px_hsl(var(--primary)/0.6)]'
          }`}
      >
        {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
      </motion.button>
    </>
  );
}
