import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * Notice banner displayed if the user opens the web application
 * inside an in-app browser (like WhatsApp, Instagram, Messenger, or Facebook webview).
 */
export const InAppBrowserWarning: React.FC = () => {
  const { isInAppBrowser } = useAuth();
  const [dismissed, setDismissed] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  if (!isInAppBrowser || dismissed) return null;

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      try {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } catch (err) {
        console.error('Failed to copy link:', err);
      }
    }
  };

  return (
    <div
      role="alert"
      className="bg-amber-400 text-slate-950 px-4 py-2 text-xs font-semibold shadow-xs flex items-center justify-between gap-3 border-b border-amber-500 z-50 sticky top-0"
    >
      <div className="flex items-center gap-2 flex-1">
        <i className="fa-solid fa-triangle-exclamation text-amber-950 text-sm shrink-0"></i>
        <span>
          <strong>In-App Browser Detected:</strong> For permanent login, please open in Chrome or Safari browser.
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleCopyLink}
          className="px-2.5 py-1 bg-slate-900 text-white rounded text-[11px] font-bold hover:bg-slate-800 transition-colors flex items-center gap-1 shadow-xs active:scale-[0.97]"
          title="Copy web link to paste into Chrome or Safari"
        >
          <i className={`fa-solid ${copied ? 'fa-check text-emerald-400' : 'fa-copy'}`}></i>
          <span>{copied ? 'Copied Link' : 'Copy Link'}</span>
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 text-slate-900 hover:text-black hover:bg-amber-500/50 transition-colors rounded"
          aria-label="Dismiss in-app browser notice"
          title="Dismiss notice"
        >
          <i className="fa-solid fa-xmark text-sm"></i>
        </button>
      </div>
    </div>
  );
};
