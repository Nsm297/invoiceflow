/**
 * WebAuthn Passkey & Platform Biometric Utilities
 * Supports Touch ID, Face ID, and Android Fingerprint authenticators.
 */

const STORAGE_KEY_PASSKEY_FLAG = 'invoicegen_device_has_passkey';
const STORAGE_KEY_PASSKEY_RAWID = 'invoicegen_device_passkey_rawid';

/**
 * Encodes an ArrayBuffer into a standard Base64 string
 */
export function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

/**
 * Decodes a Base64 / Base64URL string into a Uint8Array with a concrete ArrayBuffer
 */
export function base64ToUint8Array(base64: string): Uint8Array {
  let cleanBase64 = base64.replace(/-/g, '+').replace(/_/g, '/');
  while (cleanBase64.length % 4 !== 0) {
    cleanBase64 += '=';
  }
  const binary = window.atob(cleanBase64);
  const arrayBuffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(arrayBuffer);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Checks if this device currently has a registered passkey
 */
export function hasDevicePasskey(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    localStorage.getItem(STORAGE_KEY_PASSKEY_FLAG) === 'true' ||
    Boolean(localStorage.getItem(STORAGE_KEY_PASSKEY_RAWID))
  );
}

/**
 * Sets passkey registration flag & raw credential ID
 */
export function setDevicePasskeyRegistered(registered: boolean, rawIdBase64?: string): void {
  if (typeof window === 'undefined') return;
  if (registered) {
    localStorage.setItem(STORAGE_KEY_PASSKEY_FLAG, 'true');
    if (rawIdBase64) {
      localStorage.setItem(STORAGE_KEY_PASSKEY_RAWID, rawIdBase64);
    }
  } else {
    localStorage.removeItem(STORAGE_KEY_PASSKEY_FLAG);
    localStorage.removeItem(STORAGE_KEY_PASSKEY_RAWID);
  }
}

/**
 * Gets the stored Base64 Credential ID if present
 */
export function getStoredPasskeyRawId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEY_PASSKEY_RAWID);
}

/**
 * Checks if browser WebAuthn API is supported on this device
 */
export async function isBiometricSupported(): Promise<boolean> {
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
}

/**
 * Resolves the Relying Party identifier (rpId) strictly from the current window.location.hostname
 */
export function getRelyingPartyId(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  const hostname = window.location.hostname;
  if (!hostname || hostname === 'localhost' || hostname === '127.0.0.1') {
    return undefined;
  }
  return hostname;
}

/**
 * Registers WebAuthn platform authenticator (TouchID / FaceID / Android Fingerprint)
 * Stores the credential.rawId in localStorage as a clean Base64 string.
 */
export async function registerBiometrics(
  rpName: string = 'InvoiceFlow'
): Promise<{ success: boolean; credentialId?: string; error?: string }> {
  if (typeof window === 'undefined' || !navigator.credentials) {
    return {
      success: false,
      error: 'Biometric authentication (WebAuthn) is not supported in this browser.',
    };
  }

  try {
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);
    const userId = new Uint8Array(16);
    window.crypto.getRandomValues(userId);

    const rpId = getRelyingPartyId();

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

    const credential = (await navigator.credentials.create(options)) as PublicKeyCredential | null;
    if (!credential) {
      return { success: false, error: 'No credential was created by the device.' };
    }

    let base64Id = '';
    if (credential.rawId) {
      base64Id = bufferToBase64(credential.rawId);
    } else if (credential.id) {
      base64Id = credential.id;
    }

    setDevicePasskeyRegistered(true, base64Id);
    return { success: true, credentialId: base64Id };
  } catch (err: any) {
    console.warn('WebAuthn registration error:', err);
    const errName = err?.name || '';
    const errMsg = (err?.message || '').toLowerCase();

    if (errName === 'AbortError' || errMsg.includes('cancel') || errMsg.includes('abort')) {
      return { success: false, error: 'Biometric registration was cancelled.' };
    }
    return {
      success: false,
      error: 'Could not register biometric key. Ensure your device has fingerprint or Face ID enabled.',
    };
  }
}

/**
 * Prompts user for biometric verification (Fingerprint / Face ID)
 * Converts stored Base64 ID into Uint8Array for allowCredentials, with fallback for client-only passkeys.
 */
export async function authenticateBiometrics(
  rpName: string = 'InvoiceFlow'
): Promise<{ success: boolean; error?: string }> {
  const defaultFriendlyError =
    'No fingerprint registered for this device yet. Please unlock using your 4-digit PIN first, then register your fingerprint in Settings.';

  if (typeof window === 'undefined' || !navigator.credentials) {
    return {
      success: false,
      error: defaultFriendlyError,
    };
  }

  const storedRawId = getStoredPasskeyRawId();
  const rpId = getRelyingPartyId();

  // Attempt 1: Verify with allowCredentials using the converted Uint8Array buffer
  if (storedRawId) {
    try {
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);
      const credBuffer = base64ToUint8Array(storedRawId);

      const options: CredentialRequestOptions = {
        publicKey: {
          challenge,
          ...(rpId ? { id: rpId } : {}),
          allowCredentials: [
            {
              id: credBuffer.buffer as ArrayBuffer,
              type: 'public-key',
            },
          ],
          userVerification: 'preferred',
          timeout: 60000,
        },
      };

      const assertion = await navigator.credentials.get(options);
      if (assertion) {
        return { success: true };
      }
    } catch (primaryErr: any) {
      console.warn('Primary allowCredentials passkey check notice:', primaryErr);
      const errName = primaryErr?.name || '';
      const errMsg = (primaryErr?.message || '').toLowerCase();
      if (errName === 'AbortError' || errMsg.includes('user cancelled') || errMsg.includes('abort')) {
        return { success: false, error: 'Biometric scan cancelled.' };
      }
      // Fall through to Attempt 2 fallback
    }
  }

  // Attempt 2: Fallback for client-only passkeys (without strict allowCredentials so browser matches any passkey for this domain)
  try {
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const fallbackOptions: CredentialRequestOptions = {
      publicKey: {
        challenge,
        ...(rpId ? { id: rpId } : {}),
        userVerification: 'preferred',
        timeout: 60000,
      },
    };

    const assertion = await navigator.credentials.get(fallbackOptions);
    if (assertion) {
      return { success: true };
    }
    return {
      success: false,
      error: defaultFriendlyError,
    };
  } catch (err: any) {
    console.warn('Fallback biometric unlock check caught:', err);
    const errName = err?.name || '';
    const errMsg = (err?.message || '').toLowerCase();

    if (errName === 'AbortError' || errMsg.includes('user cancelled') || errMsg.includes('abort')) {
      return { success: false, error: 'Biometric scan cancelled.' };
    }

    return {
      success: false,
      error: defaultFriendlyError,
    };
  }
}
