import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { BusinessInfo, SecurityConfig } from '../types/invoice';
import { DEFAULT_BUSINESS_INFO } from '../utils/storage';
import { isBiometricSupported, registerBiometrics } from '../utils/security';
import { PWAInstallButton } from './PWAInstallButton';

interface StoreInfoModuleProps {
  businessInfo: BusinessInfo;
  securityConfig: SecurityConfig;
  onSaveBusinessInfo: (info: BusinessInfo) => void;
  onSaveSecurityConfig: (config: SecurityConfig) => void;
  onNavigateToCreate: () => void;
  onLockApp: () => void;
  user: User | null;
  isSyncing?: boolean;
  lastSyncedTime?: string | null;
  onGoogleSignIn: () => void;
  onGoogleSignOut: () => void;
  onSyncToCloud: () => void;
  onRestoreFromCloud: () => void;
}

export const StoreInfoModule: React.FC<StoreInfoModuleProps> = ({
  businessInfo,
  securityConfig,
  onSaveBusinessInfo,
  onSaveSecurityConfig,
  onNavigateToCreate,
  onLockApp,
  user,
  isSyncing,
  lastSyncedTime,
  onGoogleSignIn,
  onGoogleSignOut,
  onSyncToCloud,
  onRestoreFromCloud,
}) => {
  // Store info state
  const [name, setName] = useState(businessInfo.name || '');
  const [phone, setPhone] = useState(businessInfo.phone || '');
  const [address, setAddress] = useState(businessInfo.address || '');
  const [tagline, setTagline] = useState(businessInfo.tagline || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Security state
  const [isBioSupported, setIsBioSupported] = useState<boolean>(false);
  const [activeSecurityTab, setActiveSecurityTab] = useState<'info' | 'security' | 'cloud'>('info');

  // PIN Form states
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [securityMessage, setSecurityMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  useEffect(() => {
    setName(businessInfo.name || '');
    setPhone(businessInfo.phone || '');
    setAddress(businessInfo.address || '');
    setTagline(businessInfo.tagline || '');
  }, [businessInfo]);

  useEffect(() => {
    isBiometricSupported().then((supported) => {
      setIsBioSupported(supported);
    });
  }, []);

  const handleStoreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: BusinessInfo = {
      name: name.trim() || 'My Store',
      phone: phone.trim() || '',
      address: address.trim() || '',
      tagline: tagline.trim() || '',
    };
    onSaveBusinessInfo(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleResetToDefault = () => {
    setName(DEFAULT_BUSINESS_INFO.name);
    setPhone(DEFAULT_BUSINESS_INFO.phone);
    setAddress(DEFAULT_BUSINESS_INFO.address);
    setTagline(DEFAULT_BUSINESS_INFO.tagline || '');
  };

  // Security Handlers
  const handleSetNewPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{4}$/.test(newPin)) {
      setSecurityMessage({ type: 'error', text: 'PIN must be exactly 4 digits (0-9).' });
      return;
    }
    if (newPin !== confirmPin) {
      setSecurityMessage({ type: 'error', text: 'New PIN and Confirm PIN do not match.' });
      return;
    }

    const updatedConfig: SecurityConfig = {
      ...securityConfig,
      pinEnabled: true,
      pin: newPin,
    };
    onSaveSecurityConfig(updatedConfig);
    setNewPin('');
    setConfirmPin('');
    setSecurityMessage({ type: 'success', text: '4-digit Passcode PIN successfully enabled! App will lock on startup.' });
  };

  const handleChangePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentPinInput !== securityConfig.pin) {
      setSecurityMessage({ type: 'error', text: 'Current PIN is incorrect.' });
      return;
    }
    if (!/^\d{4}$/.test(newPin)) {
      setSecurityMessage({ type: 'error', text: 'New PIN must be exactly 4 numeric digits.' });
      return;
    }
    if (newPin !== confirmPin) {
      setSecurityMessage({ type: 'error', text: 'New PIN and Confirm PIN do not match.' });
      return;
    }

    const updatedConfig: SecurityConfig = {
      ...securityConfig,
      pin: newPin,
      pinEnabled: true,
    };
    onSaveSecurityConfig(updatedConfig);
    setCurrentPinInput('');
    setNewPin('');
    setConfirmPin('');
    setSecurityMessage({ type: 'success', text: 'Passcode PIN changed successfully!' });
  };

  const handleDisablePin = () => {
    if (window.confirm('Are you sure you want to disable PIN & Biometric security lock?')) {
      const updatedConfig: SecurityConfig = {
        pinEnabled: false,
        pin: '',
        biometricEnabled: false,
        credentialId: undefined,
      };
      onSaveSecurityConfig(updatedConfig);
      setCurrentPinInput('');
      setNewPin('');
      setConfirmPin('');
      setSecurityMessage({ type: 'info', text: 'PIN lock disabled.' });
    }
  };

  const handleToggleBiometrics = async () => {
    if (!securityConfig.pinEnabled) {
      setSecurityMessage({ type: 'error', text: 'Please set a 4-digit PIN first before enabling Biometrics.' });
      return;
    }

    if (!securityConfig.biometricEnabled) {
      setSecurityMessage({ type: 'info', text: 'Registering biometric authenticator with your browser...' });
      const res = await registerBiometrics(businessInfo.name || 'InvoiceFlow');
      if (res.success) {
        const updatedConfig: SecurityConfig = {
          ...securityConfig,
          biometricEnabled: true,
          credentialId: res.credentialId,
        };
        onSaveSecurityConfig(updatedConfig);
        setSecurityMessage({ type: 'success', text: 'Biometric / Fingerprint Unlock enabled successfully!' });
      } else {
        setSecurityMessage({ type: 'error', text: res.error || 'Could not register biometric key.' });
      }
    } else {
      const updatedConfig: SecurityConfig = {
        ...securityConfig,
        biometricEnabled: false,
      };
      onSaveSecurityConfig(updatedConfig);
      setSecurityMessage({ type: 'info', text: 'Biometric unlock turned OFF. 4-digit PIN remains active.' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-bold text-slate-900">Store Info & Security Settings</h2>
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded border ${
                securityConfig.pinEnabled
                  ? 'bg-emerald-100/80 text-emerald-800 border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
            >
              <i className={`fa-solid ${securityConfig.pinEnabled ? 'fa-lock' : 'fa-lock-open'} mr-1 text-[11px]`}></i>
              {securityConfig.pinEnabled ? 'PIN Protection Active' : 'PIN Protection Disabled'}
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-0.5">
            Configure your shop branding for invoices and protect your business data with a 4-digit PIN & Biometric lock.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {securityConfig.pinEnabled && (
            <button
              type="button"
              onClick={onLockApp}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg shadow-xs transition-colors min-h-[38px]"
              title="Test lock screen immediately"
            >
              <i className="fa-solid fa-lock text-xs"></i>
              <span>Lock Now</span>
            </button>
          )}
          <button
            type="button"
            onClick={onNavigateToCreate}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-all active:scale-[0.98] min-h-[38px]"
          >
            <i className="fa-solid fa-file-invoice text-xs"></i>
            <span>Create Invoice</span>
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
          <i className="fa-solid fa-circle-check text-emerald-600 text-sm"></i>
          <span>Store settings saved successfully to browser storage and applied across all invoices!</span>
        </div>
      )}

      {securityMessage && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 ${
            securityMessage.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : securityMessage.type === 'error'
              ? 'bg-rose-50 border border-rose-200 text-rose-800'
              : 'bg-sky-50 border border-sky-200 text-sky-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <i
              className={`fa-solid ${
                securityMessage.type === 'success'
                  ? 'fa-circle-check text-emerald-600'
                  : securityMessage.type === 'error'
                  ? 'fa-circle-exclamation text-rose-600'
                  : 'fa-circle-info text-sky-600'
              } text-sm`}
            ></i>
            <span>{securityMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setSecurityMessage(null)}
            className="text-slate-400 hover:text-slate-600"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
      )}

      {/* Sub-Tabs: Store Details vs Security Settings vs Cloud Sync */}
      <div className="flex border-b border-slate-200 gap-2 sm:gap-4 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveSecurityTab('info')}
          className={`pb-2.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
            activeSecurityTab === 'info'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <i className="fa-solid fa-store"></i>
          <span>Store & Business Info</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSecurityTab('security')}
          className={`pb-2.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
            activeSecurityTab === 'security'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <i className="fa-solid fa-shield-halved"></i>
          <span>PIN & Biometric Lock</span>
          {securityConfig.pinEnabled && (
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveSecurityTab('cloud')}
          className={`pb-2.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
            activeSecurityTab === 'cloud'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <i className="fa-solid fa-cloud-arrow-up text-emerald-600"></i>
          <span>Google Auth & Cloud Sync</span>
          {user ? (
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Connected
            </span>
          ) : (
            <span className="text-[10px] bg-slate-100 text-slate-600 font-medium px-1.5 py-0.2 rounded-full">
              Offline Mode
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: STORE DETAILS */}
      {activeSecurityTab === 'info' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Form Card (7 Cols) */}
          <div className="lg:col-span-7 bg-white p-5 sm:p-6 rounded-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <i className="fa-solid fa-store text-emerald-700"></i>
                <span>Edit Store Details</span>
              </h3>
              <span className="text-[11px] text-slate-500">Saved in browser localStorage</span>
            </div>

            <form onSubmit={handleStoreSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Shop / Business Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <i className="fa-solid fa-building absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Al-Madina Trading & Wholesale"
                    className="w-full pl-9 pr-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 min-h-[40px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone / WhatsApp Number <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <i className="fa-solid fa-phone absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. +92 300 8889900"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 min-h-[40px]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tagline / Header Note
                  </label>
                  <div className="relative">
                    <i className="fa-solid fa-tag absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                    <input
                      type="text"
                      value={tagline}
                      onChange={(e) => setTagline(e.target.value)}
                      placeholder="e.g. Dealers in Quality Rice, Oil & Wholesale Grains"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 min-h-[40px]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Business / Shop Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <textarea
                    rows={3}
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. Shop #14, Main Commercial Market, City Center"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleResetToDefault}
                  className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  title="Reset to sample store info"
                >
                  <i className="fa-solid fa-rotate-left mr-1.5 text-xs"></i>
                  <span>Reset to Sample Data</span>
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm transition-all active:scale-[0.98] min-h-[38px] flex items-center gap-1.5"
                >
                  <i className="fa-solid fa-floppy-disk text-xs"></i>
                  <span>Save Store Info</span>
                </button>
              </div>
            </form>
          </div>

          {/* Live Preview Card (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-900 text-white p-5 rounded-xl border border-slate-800 space-y-3 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-[11px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1.5">
                  <i className="fa-solid fa-eye text-emerald-400"></i>
                  <span>Invoice Header Preview</span>
                </span>
                <span className="text-[10px] text-emerald-400 font-mono font-semibold">Live Preview</span>
              </div>

              {/* Simulated Invoice Header Box */}
              <div className="bg-white text-slate-900 p-4 rounded-lg shadow-xs space-y-2 border border-slate-200">
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div>
                    <h4 className="text-base font-extrabold text-slate-900 tracking-tight leading-tight">
                      {name || 'Your Shop / Business Name'}
                    </h4>
                    {tagline && (
                      <p className="text-[11px] text-emerald-800 font-medium italic mt-0.5">
                        {tagline}
                      </p>
                    )}
                    <div className="text-[11px] text-slate-600 mt-1 space-y-0.5">
                      <div className="flex items-center gap-1">
                        <i className="fa-solid fa-phone text-[10px] text-slate-400"></i>
                        <span>{phone || '+92 300 0000000'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <i className="fa-solid fa-location-dot text-[10px] text-slate-400"></i>
                        <span className="truncate max-w-[220px]">{address || 'Shop Address, City'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-black tracking-wider text-slate-900 block font-mono">
                      INVOICE
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono block">#INV-2026-001</span>
                    <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded mt-1 inline-block border border-emerald-200">
                      Rs. Currency
                    </span>
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 italic text-center pt-1">
                  * This header is automatically printed at the top of every invoice PDF & WhatsApp share.
                </p>
              </div>
            </div>

            {/* Quick Help Card */}
            <div className="bg-emerald-50/80 border border-emerald-200 p-4 rounded-xl space-y-1.5 text-xs text-emerald-900">
              <h4 className="font-bold flex items-center gap-1.5">
                <i className="fa-solid fa-lightbulb text-emerald-600"></i>
                <span>Where will this appear?</span>
              </h4>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-emerald-800 pt-1">
                <li>Top header banner of the <strong>Create Invoice</strong> screen.</li>
                <li>Official header of every <strong>Printable PDF Invoice</strong>.</li>
                <li>Sender contact details on <strong>WhatsApp Direct Share</strong> messages.</li>
                <li>Exported single-file offline HTML application.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SECURITY & PASSCODE SETTINGS */}
      {activeSecurityTab === 'security' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Security Form (7 Cols) */}
          <div className="lg:col-span-7 bg-white p-5 sm:p-6 rounded-xl border border-slate-200 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <i className="fa-solid fa-shield-halved text-emerald-700"></i>
                <span>App Lock & Passcode Settings</span>
              </h3>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                  securityConfig.pinEnabled
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {securityConfig.pinEnabled ? 'PIN ACTIVE' : 'NO PIN SET'}
              </span>
            </div>

            {/* If PIN is NOT set: Provide Form to set 4-Digit PIN */}
            {!securityConfig.pinEnabled ? (
              <form onSubmit={handleSetNewPin} className="space-y-4">
                <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-xs text-slate-700 space-y-1">
                  <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                    <i className="fa-solid fa-key text-emerald-700"></i>
                    <span>Protect your billing ledger with a 4-Digit PIN</span>
                  </p>
                  <p className="text-[11px] text-slate-500">
                    When enabled, the app displays a full-screen lock screen requiring this 4-digit PIN on every startup or browser refresh.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Create 4-Digit PIN <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={4}
                      pattern="[0-9]{4}"
                      required
                      placeholder="••••"
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      className="w-full px-3 py-2 text-center text-lg font-mono tracking-widest font-bold rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 min-h-[44px]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Confirm 4-Digit PIN <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={4}
                      pattern="[0-9]{4}"
                      required
                      placeholder="••••"
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      className="w-full px-3 py-2 text-center text-lg font-mono tracking-widest font-bold rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 min-h-[44px]"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-sm transition-all active:scale-[0.99] flex items-center justify-center gap-2 min-h-[42px]"
                  >
                    <i className="fa-solid fa-lock text-xs"></i>
                    <span>Enable 4-Digit PIN Lock</span>
                  </button>
                </div>
              </form>
            ) : (
              /* If PIN is already active: Allow changing PIN or Removing PIN */
              <div className="space-y-6">
                <form onSubmit={handleChangePin} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                      Change 4-Digit PIN
                    </h4>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Current PIN <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={4}
                      required
                      placeholder="••••"
                      value={currentPinInput}
                      onChange={(e) => setCurrentPinInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      className="w-full max-w-xs px-3 py-2 text-center text-lg font-mono tracking-widest font-bold rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 min-h-[44px]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        New 4-Digit PIN <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="password"
                        inputMode="numeric"
                        maxLength={4}
                        required
                        placeholder="••••"
                        value={newPin}
                        onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        className="w-full px-3 py-2 text-center text-lg font-mono tracking-widest font-bold rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 min-h-[44px]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Confirm New PIN <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="password"
                        inputMode="numeric"
                        maxLength={4}
                        required
                        placeholder="••••"
                        value={confirmPin}
                        onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        className="w-full px-3 py-2 text-center text-lg font-mono tracking-widest font-bold rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 min-h-[44px]"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleDisablePin}
                      className="px-3.5 py-2 text-xs font-semibold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
                    >
                      <i className="fa-solid fa-lock-open mr-1.5 text-xs"></i>
                      <span>Disable PIN Lock</span>
                    </button>

                    <button
                      type="submit"
                      className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-all active:scale-[0.98] min-h-[38px] flex items-center gap-1.5"
                    >
                      <i className="fa-solid fa-arrows-rotate text-xs"></i>
                      <span>Update Passcode PIN</span>
                    </button>
                  </div>
                </form>

                {/* Biometric Toggle Card */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <i className="fa-solid fa-fingerprint text-emerald-700 text-base"></i>
                        <h4 className="text-xs font-bold text-slate-900">
                          Biometric / Fingerprint Unlock
                        </h4>
                      </div>
                      <p className="text-[11px] text-slate-600">
                        Use WebAuthn to unlock with your mobile Fingerprint, Face ID, or laptop Touch ID without typing the PIN.
                      </p>
                      {!isBioSupported && (
                        <p className="text-[10px] text-amber-700 font-medium">
                          * Platform biometrics will activate when supported hardware is present.
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleToggleBiometrics}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        securityConfig.biometricEnabled ? 'bg-emerald-700' : 'bg-slate-300'
                      }`}
                      role="switch"
                      aria-checked={securityConfig.biometricEnabled}
                    >
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          securityConfig.biometricEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Security Info & Quick Test (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-900 text-white p-5 rounded-xl border border-slate-800 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-[11px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1.5">
                  <i className="fa-solid fa-lock text-emerald-400"></i>
                  <span>Security Lock Status</span>
                </span>
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                    securityConfig.pinEnabled
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/60'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {securityConfig.pinEnabled ? 'LOCKED' : 'UNSECURED'}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">4-Digit PIN:</span>
                  <span className="font-bold text-white font-mono">
                    {securityConfig.pinEnabled ? '•••• (Configured)' : 'None'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Biometric Unlock:</span>
                  <span
                    className={`font-bold ${
                      securityConfig.biometricEnabled ? 'text-emerald-400' : 'text-slate-500'
                    }`}
                  >
                    {securityConfig.biometricEnabled ? 'Enabled (Fingerprint / Face ID)' : 'Disabled'}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">WebAuthn API Support:</span>
                  <span className="text-slate-300 font-semibold">
                    {isBioSupported ? 'Available on this device' : 'Simulated / Supported'}
                  </span>
                </div>
              </div>

              {securityConfig.pinEnabled && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={onLockApp}
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    <i className="fa-solid fa-lock text-xs"></i>
                    <span>Lock App Now (Test Lock Screen)</span>
                  </button>
                </div>
              )}
            </div>

            <div className="bg-sky-50 border border-sky-200 p-4 rounded-xl space-y-2 text-xs text-sky-950">
              <h4 className="font-bold flex items-center gap-1.5">
                <i className="fa-solid fa-shield-check text-sky-700"></i>
                <span>How Lock Protection Works</span>
              </h4>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-sky-900">
                <li>Locks ledger automatically on browser reload and startup.</li>
                <li>Provides clean 3x4 keypad with direct keyboard typing support.</li>
                <li>Uses mobile biometric sensors (Fingerprint / Face ID) via browser WebAuthn.</li>
                <li>Works completely offline with 0 server dependency.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: GOOGLE AUTH & CLOUD SYNC */}
      {activeSecurityTab === 'cloud' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Account & Sync Status Card (7 Cols) */}
          <div className="lg:col-span-7 bg-white p-5 sm:p-6 rounded-xl border border-slate-200 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <i className="fa-solid fa-cloud-arrow-up text-emerald-700"></i>
                <span>Google Account & Firestore Cloud Sync</span>
              </h3>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                  user
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                {user ? 'CONNECTED' : 'LOCAL ONLY'}
              </span>
            </div>

            {user ? (
              /* User is Logged In */
              <div className="space-y-6">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={user.displayName || 'Google Profile'}
                        referrerPolicy="no-referrer"
                        className="w-14 h-14 rounded-full object-cover border-2 border-emerald-500 shadow-sm"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-emerald-700 text-white font-bold text-xl flex items-center justify-center border-2 border-emerald-500 shadow-sm">
                        {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900">
                          {user.displayName || 'Google User'}
                        </h4>
                        <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full inline-flex items-center gap-1 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          Connected
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium">{user.email}</p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        UID: <span className="text-slate-600">{user.uid.slice(0, 16)}...</span>
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={onGoogleSignOut}
                    className="px-3.5 py-2 text-xs font-semibold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors flex items-center justify-center gap-1.5 shrink-0"
                  >
                    <i className="fa-solid fa-arrow-right-from-bracket"></i>
                    <span>Sign Out</span>
                  </button>
                </div>

                {/* Firestore Cloud Sync Actions */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                      <i className="fa-solid fa-database text-emerald-700"></i>
                      <span>Cloud Sync Controls</span>
                    </h4>
                    {lastSyncedTime && (
                      <span className="text-[11px] text-slate-500">
                        Last synced: <span className="font-semibold text-slate-700">{lastSyncedTime}</span>
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600">
                    Your invoices, customers, and store profile are automatically isolated under your user ID:
                    <code className="block bg-slate-100 text-slate-800 font-mono text-[11px] px-2 py-1 rounded mt-1 border border-slate-200">
                      users/{user.uid}/appData/main
                    </code>
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <button
                      type="button"
                      disabled={isSyncing}
                      onClick={onSyncToCloud}
                      className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 active:scale-[0.99] disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-2 min-h-[42px]"
                    >
                      {isSyncing ? (
                        <>
                          <i className="fa-solid fa-spinner fa-spin text-xs"></i>
                          <span>Syncing to Firestore...</span>
                        </>
                      ) : (
                        <>
                          <i className="fa-solid fa-cloud-arrow-up text-xs"></i>
                          <span>Sync to Cloud (Backup)</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      disabled={isSyncing}
                      onClick={onRestoreFromCloud}
                      className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 active:scale-[0.99] disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-2 min-h-[42px]"
                    >
                      <i className="fa-solid fa-cloud-arrow-down text-xs"></i>
                      <span>Restore from Cloud</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* User is NOT Logged In: Google Login Callout */
              <div className="space-y-5">
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-xl space-y-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-xl text-emerald-400">
                      <i className="fa-solid fa-cloud"></i>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Enable Real-Time Cloud Synchronization</h4>
                      <p className="text-xs text-slate-300">
                        Sign in with Google to automatically back up and restore your invoices across all your devices.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-slate-300 bg-slate-950/40 p-3.5 rounded-lg border border-slate-700/50">
                    <div className="flex items-center gap-2">
                      <i className="fa-solid fa-check text-emerald-400 text-xs"></i>
                      <span>Automatic cloud backup whenever invoices or customers are saved</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <i className="fa-solid fa-check text-emerald-400 text-xs"></i>
                      <span>Dedicated private storage isolated to your unique Google account</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <i className="fa-solid fa-check text-emerald-400 text-xs"></i>
                      <span>Seamless multi-device access on mobile, tablet, and PC</span>
                    </div>
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={onGoogleSignIn}
                      className="w-full py-3 px-4 bg-white hover:bg-slate-100 text-slate-900 rounded-lg text-xs font-bold shadow transition-all active:scale-[0.99] flex items-center justify-center gap-2.5 min-h-[44px]"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                      <span className="text-sm">Sign in with Google</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right side Architecture & Info card (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-900 text-white p-5 rounded-xl border border-slate-800 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-[11px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1.5">
                  <i className="fa-solid fa-server text-emerald-400"></i>
                  <span>Firebase Firestore Backend</span>
                </span>
                <span className="text-[10px] font-mono text-emerald-400 font-semibold">Live v10 Modular</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Project ID:</span>
                  <span className="font-mono text-slate-200">invoice-flow-4b4c9</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Authentication:</span>
                  <span className="text-emerald-400 font-semibold">Google OAuth Provider</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Cloud Storage:</span>
                  <span className="text-slate-300 font-mono">Firestore NoSQL</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Local Cache:</span>
                  <span className="text-slate-300">LocalStorage Active</span>
                </div>
              </div>

              <div className="pt-1 text-[11px] text-slate-400 border-t border-slate-800">
                <i className="fa-solid fa-shield-halved text-emerald-400 mr-1"></i>
                All user accounts have strictly partitioned document paths under <code className="text-emerald-300 font-mono">users/{'{uid}'}/appData/main</code>.
              </div>
            </div>

            <div className="bg-emerald-50/80 border border-emerald-200 p-4 rounded-xl space-y-3 text-xs text-emerald-950">
              <div className="flex items-center justify-between">
                <h4 className="font-bold flex items-center gap-1.5 text-emerald-900">
                  <i className="fa-solid fa-circle-check text-emerald-700"></i>
                  <span>Progressive Web App (PWA)</span>
                </h4>
                <span className="text-[10px] bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded-full font-bold">Installable</span>
              </div>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                Install InvoiceFlow directly on your phone, tablet, or PC for full-screen standalone usage, instant access from your home screen, and offline ledger capabilities.
              </p>
              <div className="pt-1">
                <PWAInstallButton className="w-full justify-center" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
