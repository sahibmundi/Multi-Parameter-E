import { ReactNode, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { Moon, Sun, Leaf, Wifi, WifiOff } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { useSensorData } from "@/hooks/use-sensor-data";
import { format } from "date-fns";

export default function Layout({ children }: { children: ReactNode }) {
  const { theme, setTheme, language, setLanguage } = useAppStore();
  const t = useTranslation(language);
  const { isConnected, lastUpdated } = useSensorData(1);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  return (
    <div className="min-h-screen flex flex-col selection:bg-primary/20 selection:text-primary">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full glass border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="font-display font-800 text-base leading-tight text-foreground">
                {t.appTitle}
              </h1>
              <p className="text-[10px] text-muted-foreground leading-none mt-0.5 font-medium tracking-wide uppercase">
                Environmental Monitor
              </p>
            </div>
            <h1 className="sm:hidden font-display font-bold text-base text-foreground">{t.appTitle}</h1>
          </div>

          {/* Center — connection + timestamp */}
          <div className="hidden md:flex items-center gap-3 flex-1 justify-center">
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
              isConnected
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                : 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400'
            }`}>
              {isConnected ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-60" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  {t.connected}
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3" />
                  {t.disconnected}
                </>
              )}
            </div>
            {lastUpdated && isConnected && (
              <span className="text-xs text-muted-foreground font-mono">
                {format(lastUpdated, 'HH:mm:ss')}
              </span>
            )}
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Mobile connection dot */}
            <div className={`md:hidden w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`} />

            {/* Language selector */}
            <div className="flex bg-secondary/60 p-1 rounded-xl border border-border/50 gap-0.5">
              {(['en', 'hi', 'pa'] as const).map(l => (
                <button
                  key={l}
                  onClick={() => setLanguage(l)}
                  className={`px-2.5 py-1 text-xs font-bold uppercase rounded-lg transition-all duration-200 ${
                    language === l
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-secondary/60 hover:bg-secondary border border-border/50 text-muted-foreground hover:text-foreground transition-all duration-200"
              title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile timestamp row */}
        <div className="md:hidden border-t border-border/40 px-4 py-1.5 flex justify-between items-center text-xs text-muted-foreground bg-background/40">
          <div className="flex items-center gap-1.5">
            {isConnected ? <Wifi className="w-3 h-3 text-emerald-500" /> : <WifiOff className="w-3 h-3 text-red-500" />}
            <span>{isConnected ? t.connected : t.disconnected}</span>
          </div>
          <span className="font-mono">{lastUpdated ? format(lastUpdated, 'HH:mm:ss') : '—'}</span>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {children}
      </main>
    </div>
  );
}
