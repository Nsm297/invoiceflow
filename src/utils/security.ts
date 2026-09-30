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

export const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  pinEnabled: false,
  pin: '',
  biometricEnabled: false,
  credentialId: undefined,
  autoLockOnIdle: false,
};

export const getStoredSecurityConfig = (): SecurityConfig => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SECURITY);
    if (!raw) {
      return DEFAULT_SECURITY_CONFIG;
    }
    const parsed = JSON.parse(raw);
    return {
      pinEnabled: Boolean(parsed.pinEnabled && parsed.pin),
      pin: parsed.pin || '',
      biometricEnabled: Boolean(parsed.biometricEnabled),
      credentialId: parsed.credentialId,
      autoLockOnIdle: Boolean(parsed.autoLockOnIdle),
    };
  } catch {
    return DEFAULT_SECURITY_CONFIG;
  }
};

export const saveStoredSecurityConfig = (config: SecurityConfig): void => {
  try {
    localStorage.setItem(STORAGE_KEY_SECURITY, JSON.stringify(config));
    if (!config.biometricEnabled) {
      setDevicePasskeyRegistered(false);
    }
  } catch (err) {
    console.error('Failed to save security config:', err);
  }
};
