import React, { useState, useEffect, useCallback } from 'react';
import { BusinessInfo, SecurityConfig } from '../types/invoice';
import { authenticateBiometrics } from '../utils/security';

interface SecurityLockScreenProps {
  businessInfo: BusinessInfo;
  securityConfig: SecurityConfig;
  onUnlock: () => void;
  onEmergencyReset?: () => void;
}

export const SecurityLockScreen: React.FC<SecurityLockScreenProps> = ({
  businessInfo,
  securityConfig,
  onUnlock,
  onEmergencyReset,
}) => {
  const [pinDigits, setPinDigits] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [isBiometricPrompting, setIsBiometricPrompting] = useState<boolean>(false);

  const verifyPin = useCallback(
    (enteredPin: string) => {
      if (enteredPin === securityConfig.pin) {
        setErrorMessage('');
        onUnlock();
      } else {
        setIsShaking(true);
        setErrorMessage('Incorrect PIN. Please try again.');
        setTimeout(() => {
          setIsShaking(false);
          setPinDigits([]);
        }, 500);
      }
    },
    [securityConfig.pin, onUnlock]
  );

  const handleDigitPress = useCallback(
    (digit: string) => {
      if (pinDigits.length < 4) {
        const next = [...pinDigits, digit];
        setPinDigits(next);
        setErrorMessage('');
        if (next.length === 4) {
          const fullPin = next.join('');
          verifyPin(fullPin);
        }
      }
    },
    [pinDigits, verifyPin]
  );

  const handleDelete = useCallback(() => {
    setPinDigits((prev) => prev.slice(0, -1));
    setErrorMessage('');
  }, []);

  const handleClear = useCallback(() => {
    setPinDigits([]);
    setErrorMessage('');
  }, []);

  const handleBiometricUnlock = useCallback(async () => {
    setIsBiometricPrompting(true);
    setErrorMessage('');
    try {
      const result = await authenticateBiometrics(businessInfo.name || 'InvoiceFlow');
      if (result.success) {
        onUnlock();
      } else if (result.error && !result.error.toLowerCase().includes('cancel')) {
        setErrorMessage(result.error);
      }
    } catch {
      setErrorMessage(
        'No fingerprint registered for this device yet. Please unlock using your 4-digit PIN first, then register your fingerprint in Settings.'
      );
    } finally {
      setIsBiometricPrompting(false);
    }
  }, [businessInfo.name, onUnlock]);

  // Physical keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        handleDigitPress(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleDelete();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleClear();
      } else if (e.key === 'Enter' && pinDigits.length === 4) {
        e.preventDefault();
        verifyPin(pinDigits.join(''));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDigitPress, handleDelete, handleClear, verifyPin, pinDigits]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col items-center justify-center p-4 selection:bg-emerald-500 selection:text-white">
      {/* Decorative ambient background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-sky-500/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center text-center space-y-6">
        {/* Brand Shield & Shop Title */}
        <div className="space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-emerald-400 text-white flex items-center justify-center text-2xl shadow-lg shadow-emerald-950 mx-auto border border-emerald-300/30">
            <i className="fa-solid fa-lock"></i>
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white">{businessInfo.name || 'InvoiceFlow Ledger'}</h1>
            <p className="text-xs text-emerald-400 font-medium tracking-wide mt-0.5">
              <i className="fa-solid fa-shield-halved mr-1"></i> Security Lock Screen
            </p>
          </div>
          <p className="text-xs text-slate-400">Enter your 4-digit Passcode PIN to unlock the ledger</p>
        </div>

        {/* 4-Digit PIN Indicators */}
        <div
          className={`flex items-center justify-center gap-4 py-3 transition-transform ${
            isShaking ? 'animate-bounce text-rose-500' : ''
          }`}
        >
          {[0, 1, 2, 3].map((index) => {
            const isFilled = index < pinDigits.length;
            return (
              <div
                key={index}
                className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                  isFilled
                    ? 'bg-emerald-400 border-emerald-400 shadow-md shadow-emerald-500/50 scale-110'
                    : 'bg-slate-800 border-slate-600'
                }`}
              />
            );
          })}
        </div>

        {/* Error / Status Text */}
        <div className="min-h-[22px] flex items-center justify-center">
          {errorMessage ? (
            <span className="text-xs font-semibold text-rose-400 bg-rose-950/60 px-3 py-1 rounded-full border border-rose-800/60">
              <i className="fa-solid fa-triangle-exclamation mr-1.5"></i>
              {errorMessage}
            </span>
          ) : isBiometricPrompting ? (
            <span className="text-xs font-semibold text-sky-400 animate-pulse">
              <i className="fa-solid fa-fingerprint mr-1.5"></i>
              Scanning Biometrics / Fingerprint...
            </span>
          ) : null}
        </div>

        {/* Keypad Grid 3x4 */}
        <div className="grid grid-cols-3 gap-3.5 w-full max-w-[280px]">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigitPress(digit)}
              className="h-14 rounded-2xl bg-slate-900/90 hover:bg-slate-800 active:bg-emerald-700 text-white font-mono text-xl font-bold border border-slate-800 hover:border-slate-700 shadow-sm transition-all duration-150 active:scale-95 flex items-center justify-center"
            >
              {digit}
            </button>
          ))}

          {/* Bottom Row: Biometric or Clear | 0 | Backspace */}
          {securityConfig.biometricEnabled ? (
            <button
              type="button"
              onClick={handleBiometricUnlock}
              className="h-14 rounded-2xl bg-emerald-950/70 hover:bg-emerald-900 active:bg-emerald-800 text-emerald-400 font-medium border border-emerald-700/50 transition-all duration-150 active:scale-95 flex flex-col items-center justify-center gap-0.5"
              title="Unlock with Fingerprint / Face ID"
            >
              <i className="fa-solid fa-fingerprint text-lg"></i>
              <span className="text-[9px] font-semibold tracking-tight">Biometric</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleClear}
              className="h-14 rounded-2xl bg-slate-900/50 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-all duration-150 active:scale-95 flex items-center justify-center text-xs font-bold uppercase tracking-wider"
              title="Clear PIN"
            >
              Clear
            </button>
          )}

          <button
            type="button"
            onClick={() => handleDigitPress('0')}
            className="h-14 rounded-2xl bg-slate-900/90 hover:bg-slate-800 active:bg-emerald-700 text-white font-mono text-xl font-bold border border-slate-800 hover:border-slate-700 shadow-sm transition-all duration-150 active:scale-95 flex items-center justify-center"
          >
            0
          </button>

          <button
            type="button"
            onClick={handleDelete}
            className="h-14 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-rose-400 border border-slate-800 hover:border-slate-700 transition-all duration-150 active:scale-95 flex items-center justify-center text-lg"
            title="Backspace"
          >
            <i className="fa-solid fa-delete-left"></i>
          </button>
        </div>

        {/* Biometric Prompt Button (if enabled) */}
        {securityConfig.biometricEnabled && (
          <div className="pt-2 w-full max-w-[280px]">
            <button
              type="button"
              onClick={handleBiometricUnlock}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-900/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              <i className="fa-solid fa-fingerprint text-base"></i>
              <span>Unlock with Fingerprint / Face ID</span>
            </button>
          </div>
        )}

        {/* Emergency Reset or Demo Recovery */}
        {onEmergencyReset && (
          <div className="pt-4 border-t border-slate-900 w-full text-center">
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Reset PIN and restore default ledger settings? All invoices will be preserved.')) {
                  onEmergencyReset();
                }
              }}
              className="text-[11px] text-slate-500 hover:text-slate-400 underline"
            >
              Forgot 4-digit PIN?
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
