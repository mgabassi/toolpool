import React, { useState, useEffect } from 'react';
import { Download, Share, X } from 'lucide-react';

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Kontrollera om appen redan körs som hemskärmsapp
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (isStandalone) return;

    // Detektera iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(ios);

    if (ios) {
      setShowPrompt(true);
    }

    // Fånga install-eventet för Android/Chrome
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  async function handleInstallClick() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  }

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-slate-700 z-50 max-w-md mx-auto flex items-center justify-between">
      <div className="flex items-center gap-3 pr-2">
        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0">
          <Download className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-xs font-bold">Spara ToolPool som app</p>
          {isIOS ? (
            <p className="text-[11px] text-slate-300 flex items-center gap-1 mt-0.5">
              Tryck på dela-knappen <Share className="w-3 h-3 inline text-indigo-400" /> och välj <b>"Lägg till på hemskärmen"</b>.
            </p>
          ) : (
            <p className="text-[11px] text-slate-300">Lägg till på hemskärmen för en snabbare upplevelse.</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {!isIOS && deferredPrompt && (
          <button
            onClick={handleInstallClick}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl cursor-pointer"
          >
            Spara
          </button>
        )}
        <button
          onClick={() => setShowPrompt(false)}
          className="text-slate-400 hover:text-white p-1 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}