import { ReactNode, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { Moon, Sun, Globe, Wifi, WifiOff, Volume2 } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { useSensorData } from "@/hooks/use-sensor-data";
import { format } from "date-fns";

export default function Layout({ children }: { children: ReactNode }) {
  const { theme, setTheme, language, setLanguage } = useAppStore();
  const t = useTranslation(language);
  const { isConnected, lastUpdated } = useSensorData(1);

  // Apply theme class to HTML body
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  return (
    <div className="min-h-screen relative flex flex-col selection:bg-primary/30 selection:text-primary">
      {/* Background image mapped from requirements */}
      {theme === 'dark' && (
        <div 
          className="fixed inset-0 z-[-3] opacity-40 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url('${import.meta.env.BASE_URL}images/cyber-bg.png')` }}
        />
      )}
      <div className="scanline" />

      {/* Header */}
      <header className="sticky top-0 z-40 w-full glass border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.5)]">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-foreground to-foreground/70 dark:from-cyan-400 dark:to-fuchsia-500 text-shadow-neon-cyan">
              {t.appTitle}
            </h1>
          </div>

          <div className="flex items-center gap-4 sm:gap-6">
            {/* Connection Status */}
            <div className="hidden sm:flex items-center gap-2">
              {isConnected ? (
                <>
                  <div className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 shadow-[0_0_10px_#22c55e]"></span>
                  </div>
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">{t.connected}</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-medium text-red-500">{t.disconnected}</span>
                </>
              )}
            </div>

            {/* Language Selector */}
            <div className="flex bg-secondary/50 p-1 rounded-lg border border-border/50">
              {(['en', 'hi', 'pa'] as const).map(l => (
                <button
                  key={l}
                  onClick={() => setLanguage(l)}
                  className={`px-2 py-1 text-xs font-bold uppercase rounded-md transition-all ${
                    language === l 
                      ? 'bg-primary text-primary-foreground shadow-md' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>

            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-full bg-secondary/50 hover:bg-secondary text-foreground border border-border/50 transition-all hover:scale-110 active:scale-95"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>
        
        {/* Mobile secondary header row for timestamp & status */}
        <div className="sm:hidden border-t border-border/50 px-4 py-2 flex justify-between items-center text-xs text-muted-foreground bg-background/50">
           <div className="flex items-center gap-1">
              {isConnected ? <Wifi className="w-3 h-3 text-green-500" /> : <WifiOff className="w-3 h-3 text-red-500" />}
              <span>{isConnected ? t.connected : t.disconnected}</span>
           </div>
           <span>{lastUpdated ? format(lastUpdated, 'HH:mm:ss') : '...'}</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {children}
      </main>
    </div>
  );
}
