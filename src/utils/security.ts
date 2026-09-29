import { SecurityConfig } from '../types/invoice';

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
  } catch (err) {
    console.error('Failed to save security config:', err);
  }
};

/**
 * Checks if browser WebAuthn API is supported on this device
 */
export const isBiometricSupported = async (): Promise<boolean> => {
  if (typeof window === 'undefined' || !window.PublicKeyCredential) {
    return false;
  }
  try {
    if (typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function') {
      const isAvailable = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      return isAvailable;
    }
    return true;
  } catch {
    return false;
  }
};

/**
 * Registers WebAuthn platform authenticator (TouchID / FaceID / Android Fingerprint)
 */
export const registerBiometrics = async (rpName: string = 'InvoiceFlow'): Promise<{ success: boolean; credentialId?: string; error?: string }> => {
  if (typeof window === 'undefined' || !navigator.credentials) {
    return { success: false, error: 'WebAuthn is not supported in this environment.' };
  }

  try {
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);
    const userId = new Uint8Array(16);
    window.crypto.getRandomValues(userId);

    const hostname = window.location.hostname || 'localhost';
    const rpId = hostname === 'localhost' || hostname === '127.0.0.1' ? undefined : hostname;

    const options: CredentialCreationOptions = {
      publicKey: {
        challenge,
        rp: {
          name: rpName,
          ...(rpId ? { id: rpId } : {}),
        },
        user: {
          id: userId,
          name: 'store_owner',
          displayName: 'Store Owner',
        },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 }, // ES256
          { type: 'public-key', alg: -257 }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'preferred',
          requireResidentKey: false,
        },
        timeout: 60000,
        attestation: 'none',
      },
    };

    const credential = await navigator.credentials.create(options) as PublicKeyCredential | null;
    if (credential && credential.id) {
      return { success: true, credentialId: credential.id };
    }
    return { success: true, credentialId: 'biometric-active' };
  } catch (err: any) {
    console.warn('WebAuthn registration error:', err);
    return {
      success: false,
      error: err?.message || 'Biometric authentication was cancelled or not supported.',
    };
  }
};

/**
 * Prompts user for biometric verification (Fingerprint / Face ID)
 */
export const authenticateBiometrics = async (rpName: string = 'InvoiceFlow'): Promise<{ success: boolean; error?: string }> => {
  if (typeof window === 'undefined' || !navigator.credentials) {
    return { success: false, error: 'WebAuthn is not supported.' };
  }

  try {
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const hostname = window.location.hostname || 'localhost';
    const rpId = hostname === 'localhost' || hostname === '127.0.0.1' ? undefined : hostname;

    const options: CredentialRequestOptions = {
      publicKey: {
        challenge,
        ...(rpId ? { id: rpId } : {}),
        userVerification: 'preferred',
        timeout: 60000,
      },
    };

    const assertion = await navigator.credentials.get(options);
    if (assertion) {
      return { success: true };
    }
    return { success: false, error: 'Verification failed.' };
  } catch (err: any) {
    console.warn('Biometric unlock cancelled or failed:', err);
    return {
      success: false,
      error: err?.message || 'Biometric verification cancelled.',
    };
  }
};
