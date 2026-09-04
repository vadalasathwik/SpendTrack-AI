import React, { useState, useEffect } from 'react';
import { Download, X, Sparkles } from 'lucide-react';

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if already running in standalone mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone ||
      document.referrer.includes('android-app://');

    if (isStandalone) {
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Check if user previously dismissed prompt in this session
      if (!sessionStorage.getItem('pwa_prompt_dismissed')) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the PWA install prompt');
    }
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 md:bottom-6 md:left-auto md:right-6 md:max-w-md z-50 animate-in slide-in-from-bottom-5 duration-300">
      <div className="bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-3xl shadow-2xl border border-slate-700/80 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shrink-0 shadow-md shadow-emerald-500/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-white">Install SpendTrack App</h4>
            <p className="text-xs text-slate-300">Add to home screen for full-screen PWA access</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleInstallClick}
            className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Install</span>
          </button>
          <button
            onClick={handleDismiss}
            className="p-2 text-slate-400 hover:text-white rounded-full transition-colors cursor-pointer"
            aria-label="Dismiss install prompt"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
