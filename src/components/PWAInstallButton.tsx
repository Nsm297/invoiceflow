import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  compact?: boolean;
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  compact = false,
  className = '',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  // If already installed and opened as a standalone app, hide the button
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    setIsInstalling(true);
    await install();
    setIsInstalling(false);
  };

  // Chromium / Android / Desktop Install Button
  if (isInstallable) {
    if (compact) {
      return (
        <button
          type="button"
          onClick={handleInstallClick}
          disabled={isInstalling}
          title="Install InvoiceFlow App on your device"
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition active:scale-95 cursor-pointer ${className}`}
        >
          <i className="fa-solid fa-download text-[11px]"></i>
          <span>Install App</span>
        </button>
      );
    }

    return (
      <button
        type="button"
        onClick={handleInstallClick}
        disabled={isInstalling}
        className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md hover:shadow-lg transition active:scale-95 cursor-pointer ${className}`}
      >
        <i className="fa-solid fa-cloud-arrow-down text-sm"></i>
        <span>Install InvoiceFlow</span>
      </button>
    );
  }

  // iOS Safari Flow with Step-by-Step Instructions
  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition active:scale-95 cursor-pointer ${className}`}
        >
          <i className="fa-brands fa-apple text-xs"></i>
          <span>Install App</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white">
                    <i className="fa-solid fa-file-invoice text-lg text-sky-400"></i>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Install InvoiceFlow</h3>
                    <p className="text-[11px] text-slate-500">Add to iPhone or iPad Home Screen</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 text-sm"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 space-y-3 text-xs text-slate-700 border border-slate-200">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 font-bold flex items-center justify-center shrink-0 text-xs">
                    1
                  </div>
                  <p>
                    Tap the <strong>Share</strong> button <i className="fa-solid fa-arrow-up-from-bracket text-sky-600 mx-1"></i> at the bottom of Safari.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 font-bold flex items-center justify-center shrink-0 text-xs">
                    2
                  </div>
                  <p>
                    Scroll down and tap <strong>Add to Home Screen</strong> <i className="fa-regular fa-square-plus text-slate-700 mx-1"></i>.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 font-bold flex items-center justify-center shrink-0 text-xs">
                    3
                  </div>
                  <p>
                    Tap <strong>Add</strong> in the top-right corner to launch full screen like a native app.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Generic fallback if browser has not fired beforeinstallprompt yet
  return (
    <button
      type="button"
      onClick={() => {
        alert('To install InvoiceFlow: tap your browser menu (⋮ or Share) and select "Add to Home Screen" or "Install App".');
      }}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition active:scale-95 cursor-pointer ${className}`}
      title="Install App"
    >
      <i className="fa-solid fa-mobile-screen-button text-[11px]"></i>
      <span>Install App</span>
    </button>
  );
};
