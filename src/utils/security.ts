import { SecurityConfig } from '../types/invoice';
import {
  hasDevicePasskey,
  setDevicePasskeyRegistered,
  isBiometricSupported,
  registerBiometrics,
  authenticateBiometrics,
  bufferToBase64,
  base64ToUint8Array,
  getRelyingPartyId,
  getStoredPasskeyRawId,
} from './webauthn';

export {
  hasDevicePasskey,
  setDevicePasskeyRegistered,
  isBiometricSupported,
  registerBiometrics,
  authenticateBiometrics,
  bufferToBase64,
  base64ToUint8Array,
  getRelyingPartyId,
  getStoredPasskeyRawId,
};

const STORAGE_KEY_SECURITY = 'invoicegen_security_v1';

export const getUserPinKey = (uid?: string | null): string => {
  return uid ? `pwa_pin_${uid}` : 'pwa_pin_guest';
};

export const getUserBioKey = (uid?: string | null): string => {
  return uid ? `pwa_bio_enabled_${uid}` : 'pwa_bio_enabled_guest';
};

export const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  pinEnabled: false,
  pin: '',
  biometricEnabled: false,
  credentialId: undefined,
  autoLockOnIdle: false,
};

export const getStoredSecurityConfig = (uid?: string | null): SecurityConfig => {
  try {
    if (typeof localStorage === 'undefined') return DEFAULT_SECURITY_CONFIG;

    const pinKey = getUserPinKey(uid);
    const bioKey = getUserBioKey(uid);

    const scopedPin = localStorage.getItem(pinKey);
    const scopedBio = localStorage.getItem(bioKey);

    // Also check legacy or global security config object
    const raw = localStorage.getItem(STORAGE_KEY_SECURITY);
    let parsed: any = null;
    if (raw) {
      try {
        parsed = JSON.parse(raw);
      } catch {
        parsed = null;
      }
    }

    // Prioritize user-scoped PIN if available, otherwise check legacy
    const resolvedPin = scopedPin ?? (parsed?.pin || '');
    const resolvedPinEnabled = Boolean(resolvedPin && resolvedPin.length === 4);
    const resolvedBioEnabled = scopedBio !== null ? scopedBio === 'true' : Boolean(parsed?.biometricEnabled);

    return {
      pinEnabled: resolvedPinEnabled,
      pin: resolvedPin,
      biometricEnabled: resolvedBioEnabled,
      credentialId: parsed?.credentialId,
      autoLockOnIdle: Boolean(parsed?.autoLockOnIdle),
    };
  } catch {
    return DEFAULT_SECURITY_CONFIG;
  }
};

export const saveStoredSecurityConfig = (config: SecurityConfig, uid?: string | null): void => {
  try {
    if (typeof localStorage === 'undefined') return;

    const pinKey = getUserPinKey(uid);
    const bioKey = getUserBioKey(uid);

    // Save permanently scoped to user ID (never wiped on logout)
    if (config.pinEnabled && config.pin) {
      localStorage.setItem(pinKey, config.pin);
    } else {
      localStorage.removeItem(pinKey);
    }

    localStorage.setItem(bioKey, String(Boolean(config.biometricEnabled)));

    // Also keep legacy object updated for backward compatibility
    localStorage.setItem(STORAGE_KEY_SECURITY, JSON.stringify(config));

    if (!config.biometricEnabled) {
      setDevicePasskeyRegistered(false);
    }
  } catch (err) {
    console.error('Failed to save security config:', err);
  }
};
