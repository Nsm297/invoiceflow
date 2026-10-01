import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface ResetSecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newPin?: string) => void;
  title?: string;
  description?: string;
}

export const ResetSecurityModal: React.FC<ResetSecurityModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  title = 'Verify Identity to Reset PIN',
  description = 'To protect your business ledger, please verify your Firebase account credentials before modifying or resetting security.',
}) => {
  const {
    user,
    isGoogleUser,
    reauthenticateWithPassword,
    reauthenticateWithGoogle,
    verifyCredentials,
  } = useAuth();

  // Verification state
  const [password, setPassword] = useState<string>('');
  const [emailInput, setEmailInput] = useState<string>(user?.email || '');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Step state: 1 = verify, 2 = set new pin
  const [step, setStep] = useState<'verify' | 'set_pin'>('verify');
  const [newPin, setNewPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [disableSecurity, setDisableSecurity] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleVerifyPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!user && !emailInput.trim()) {
      setErrorMsg('Please enter your account email address.');
      return;
    }
    if (!password) {
      setErrorMsg('Please enter your account password.');
      return;
    }

    try {
      setIsVerifying(true);
      if (user) {
        await reauthenticateWithPassword(password);
      } else {
        await verifyCredentials(emailInput.trim(), password);
      }
      setStep('set_pin');
      setErrorMsg('');
    } catch (err: any) {
      console.error('Password verification error:', err);
      const code = err?.code || '';
      if (
        code === 'auth/wrong-password' ||
        code === 'auth/invalid-credential' ||
        code === 'auth/user-not-found'
      ) {
        setErrorMsg('Incorrect password. Please verify and try again.');
      } else if (code === 'auth/too-many-requests') {
        setErrorMsg('Too many failed attempts. Please wait a moment.');
      } else {
        setErrorMsg(err?.message || 'Verification failed. Please check your credentials.');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleVerifyGoogle = async () => {
    setErrorMsg('');
    try {
      setIsVerifying(true);
      await reauthenticateWithGoogle();
      setStep('set_pin');
      setErrorMsg('');
    } catch (err: any) {
      console.error('Google reauth error:', err);
      if (err?.code !== 'auth/popup-closed-by-user') {
        setErrorMsg(err?.message || 'Google verification failed.');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSaveNewPin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (disableSecurity) {
      onSuccess('');
      handleClose();
      return;
    }

    if (!/^\d{4}$/.test(newPin)) {
      setErrorMsg('New PIN must be exactly 4 numeric digits.');
      return;
    }
    if (newPin !== confirmPin) {
      setErrorMsg('New PIN and Confirm PIN do not match.');
      return;
    }

    onSuccess(newPin);
    handleClose();
  };

  const handleClose = () => {
    setPassword('');
    setEmailInput(user?.email || '');
    setShowPassword(false);
    setIsVerifying(false);
    setErrorMsg('');
    setStep('verify');
    setNewPin('');
    setConfirmPin('');
    setDisableSecurity(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-md w-full p-6 text-white shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Glow ambient */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center text-lg">
              <i className="fa-solid fa-shield-halved"></i>
            </div>
            <div>
              <h2 className="text-base font-bold text-white">{title}</h2>
              <p className="text-xs text-slate-400 mt-0.5">{description}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg text-lg transition-colors"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-950/70 border border-rose-800 text-rose-300 text-xs rounded-xl flex items-center gap-2">
            <i className="fa-solid fa-triangle-exclamation text-rose-400 shrink-0"></i>
            <span>{errorMsg}</span>
          </div>
        )}

        {step === 'verify' ? (
          <div>
            {isGoogleUser ? (
              <div className="space-y-4">
                <div className="p-3 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-slate-300">
                  <span className="text-slate-400">Authenticated with Google:</span>
                  <div className="font-semibold text-white mt-0.5">{user?.email}</div>
                </div>

                <p className="text-xs text-slate-400">
                  Click below to confirm your Google account identity and authorize security modifications.
                </p>

                <button
                  type="button"
                  onClick={handleVerifyGoogle}
                  disabled={isVerifying}
                  className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm flex items-center justify-center gap-3 shadow-md transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {isVerifying ? (
                    <i className="fa-solid fa-spinner fa-spin text-base"></i>
                  ) : (
                    <i className="fa-brands fa-google text-rose-500 text-base"></i>
                  )}
                  <span>{isVerifying ? 'Verifying with Google...' : 'Re-authenticate with Google'}</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleVerifyPassword} className="space-y-4">
                {!user && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Account Email Address
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                        <i className="fa-solid fa-envelope text-xs"></i>
                      </span>
                      <input
                        type="email"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        placeholder="store@example.com"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                        required
                      />
                    </div>
                  </div>
                )}

                {user && (
                  <div className="p-3 bg-slate-800/70 border border-slate-700 rounded-xl text-xs text-slate-300">
                    <span className="text-slate-400">Target Account:</span>
                    <div className="font-semibold text-emerald-400 mt-0.5">{user.email}</div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Firebase Account Password
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                      <i className="fa-solid fa-key text-xs"></i>
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your login password"
                      className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300"
                    >
                      <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-xs`}></i>
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isVerifying}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-[0.98] disabled:opacity-50 flex items-center gap-2"
                  >
                    {isVerifying ? (
                      <>
                        <i className="fa-solid fa-spinner fa-spin"></i>
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-unlock"></i>
                        <span>Verify Password</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          <form onSubmit={handleSaveNewPin} className="space-y-4">
            <div className="p-3 bg-emerald-950/60 border border-emerald-700/60 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
              <i className="fa-solid fa-circle-check text-emerald-400 text-sm"></i>
              <span>Identity verified! You may now configure a new 4-digit PIN.</span>
            </div>

            <div className="p-3 bg-slate-800/80 border border-slate-700 rounded-xl space-y-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-200">
                <input
                  type="checkbox"
                  checked={disableSecurity}
                  onChange={(e) => setDisableSecurity(e.target.checked)}
                  className="rounded border-slate-700 text-emerald-600 focus:ring-emerald-500"
                />
                <span>Disable PIN lock protection completely</span>
              </label>
              <p className="text-[11px] text-slate-400 pl-5">
                Ledger will open immediately without requesting a passcode.
              </p>
            </div>

            {!disableSecurity && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    New 4-Digit Passcode PIN
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="e.g. 1234"
                    className="w-full text-center tracking-[0.5em] font-mono font-bold text-lg py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-emerald-400 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Confirm New 4-Digit PIN
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="Repeat 4 digits"
                    className="w-full text-center tracking-[0.5em] font-mono font-bold text-lg py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-emerald-400 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </>
            )}

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center gap-2"
              >
                <i className="fa-solid fa-floppy-disk"></i>
                <span>{disableSecurity ? 'Disable & Unlock' : 'Save PIN & Unlock'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
