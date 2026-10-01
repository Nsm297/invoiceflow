import React, { useState, useEffect, useCallback } from 'react';

interface PinConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  requiredPin?: string;
  actionTitle: string;
  actionDescription: string;
  itemDetails?: string;
}

export const PinConfirmModal: React.FC<PinConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  requiredPin,
  actionTitle,
  actionDescription,
  itemDetails,
}) => {
  const [pinDigits, setPinDigits] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isShaking, setIsShaking] = useState<boolean>(false);

  const hasPinProtection = Boolean(requiredPin && requiredPin.length === 4);

  const handleClear = useCallback(() => {
    setPinDigits([]);
    setErrorMessage('');
  }, []);

  const handleClose = useCallback(() => {
    handleClear();
    onClose();
  }, [handleClear, onClose]);

  const verifyAndExecute = useCallback(
    (enteredPin: string) => {
      if (!hasPinProtection || enteredPin === requiredPin) {
        setErrorMessage('');
        onConfirm();
        handleClose();
      } else {
        setIsShaking(true);
        setErrorMessage('Incorrect Security PIN. Authorization rejected.');
        setTimeout(() => {
          setIsShaking(false);
          setPinDigits([]);
        }, 500);
      }
    },
    [hasPinProtection, requiredPin, onConfirm, handleClose]
  );

  const handleDigitPress = useCallback(
    (digit: string) => {
      if (pinDigits.length < 4) {
        const next = [...pinDigits, digit];
        setPinDigits(next);
        setErrorMessage('');
        if (next.length === 4) {
          verifyAndExecute(next.join(''));
        }
      }
    },
    [pinDigits, verifyAndExecute]
  );

  const handleDeleteDigit = useCallback(() => {
    setPinDigits((prev) => prev.slice(0, -1));
    setErrorMessage('');
  }, []);

  // Keyboard support when modal is open
  useEffect(() => {
    if (!isOpen || !hasPinProtection) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        handleDigitPress(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleDeleteDigit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      } else if (e.key === 'Enter' && pinDigits.length === 4) {
        e.preventDefault();
        verifyAndExecute(pinDigits.join(''));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, hasPinProtection, handleDigitPress, handleDeleteDigit, handleClose, verifyAndExecute, pinDigits]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-rose-900/60 rounded-2xl max-w-sm w-full p-6 text-white shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col items-center text-center">
        {/* Ambient warning halo */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-rose-500/10 rounded-full blur-2xl pointer-events-none"></div>

        {/* Warning Icon Badge */}
        <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center text-2xl mb-3 shadow-lg shadow-rose-950/50">
          <i className="fa-solid fa-triangle-exclamation"></i>
        </div>

        <h2 className="text-base font-bold text-white tracking-tight">{actionTitle}</h2>
        <p className="text-xs text-rose-300 font-medium mt-1">{actionDescription}</p>

        {itemDetails && (
          <div className="my-3 px-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-lg text-xs font-mono text-slate-300 w-full truncate">
            {itemDetails}
          </div>
        )}

        {hasPinProtection ? (
          <div className="w-full mt-2 flex flex-col items-center">
            <p className="text-xs text-slate-400 mb-2">
              <i className="fa-solid fa-lock text-emerald-400 mr-1"></i>
              Enter 4-digit PIN to confirm deletion
            </p>

            {/* PIN indicators */}
            <div
              className={`flex items-center justify-center gap-3.5 my-3 ${
                isShaking ? 'animate-bounce text-rose-500' : ''
              }`}
            >
              {[0, 1, 2, 3].map((idx) => {
                const isFilled = idx < pinDigits.length;
                return (
                  <div
                    key={idx}
                    className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-150 ${
                      isFilled
                        ? 'bg-rose-500 border-rose-400 shadow-md shadow-rose-500/50 scale-110'
                        : 'bg-slate-800 border-slate-700'
                    }`}
                  />
                );
              })}
            </div>

            {/* Error Message */}
            <div className="min-h-[22px] flex items-center justify-center mb-2">
              {errorMessage && (
                <span className="text-[11px] font-semibold text-rose-400 bg-rose-950/80 px-2.5 py-0.5 rounded-full border border-rose-800">
                  <i className="fa-solid fa-circle-exclamation mr-1"></i>
                  {errorMessage}
                </span>
              )}
            </div>

            {/* 3x4 Keypad */}
            <div className="grid grid-cols-3 gap-2.5 w-full max-w-[240px]">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleDigitPress(digit)}
                  className="h-11 rounded-xl bg-slate-800/90 hover:bg-slate-700 active:bg-rose-700 text-white font-mono text-lg font-bold border border-slate-700 transition-all active:scale-95 flex items-center justify-center shadow-sm"
                >
                  {digit}
                </button>
              ))}

              <button
                type="button"
                onClick={handleClear}
                className="h-11 rounded-xl bg-slate-800/50 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 text-[11px] font-bold uppercase transition-all active:scale-95 flex items-center justify-center"
              >
                Clear
              </button>

              <button
                type="button"
                onClick={() => handleDigitPress('0')}
                className="h-11 rounded-xl bg-slate-800/90 hover:bg-slate-700 active:bg-rose-700 text-white font-mono text-lg font-bold border border-slate-700 transition-all active:scale-95 flex items-center justify-center shadow-sm"
              >
                0
              </button>

              <button
                type="button"
                onClick={handleDeleteDigit}
                className="h-11 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-rose-400 border border-slate-700 transition-all active:scale-95 flex items-center justify-center"
              >
                <i className="fa-solid fa-delete-left text-sm"></i>
              </button>
            </div>

            <div className="mt-4 w-full">
              <button
                type="button"
                onClick={handleClose}
                className="w-full py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors"
              >
                Cancel Action
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-4 w-full flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onConfirm();
                handleClose();
              }}
              className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
            >
              <i className="fa-solid fa-trash-can"></i>
              <span>Confirm Delete</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
