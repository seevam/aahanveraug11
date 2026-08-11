/**
 * Optional app lock.
 *
 * There are no accounts in this app — data never leaves the device — so this
 * is not authentication. It is a privacy screen over health data on a phone
 * that may be shared within a family, which is common in the launch market.
 *
 * On the PIN hash: the real protection is the OS keystore that SecureStore
 * writes to. A salted SHA-256 of a 4-digit PIN is brute-forceable in
 * microseconds by anyone who can already read the keystore, so it is not
 * claimed as a security boundary — it only avoids storing the PIN in
 * plaintext, and keeps the stored value useless if it is ever logged or
 * included in a backup by mistake.
 */

import * as Crypto from 'expo-crypto';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const PIN_KEY = 'app_lock_pin';
const SALT_KEY = 'app_lock_salt';
const BIOMETRIC_KEY = 'app_lock_biometric';

async function hashPin(pin: string, salt: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}:${pin}`);
}

function randomSalt(): string {
  const bytes = Crypto.getRandomBytes(16);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function isLockEnabled(): Promise<boolean> {
  try {
    return (await SecureStore.getItemAsync(PIN_KEY)) !== null;
  } catch {
    // SecureStore is stubbed in some environments; treat as no lock rather
    // than locking the patient out of their own reminders.
    return false;
  }
}

export async function setPin(pin: string): Promise<void> {
  const salt = randomSalt();
  const hash = await hashPin(pin, salt);
  await SecureStore.setItemAsync(SALT_KEY, salt);
  await SecureStore.setItemAsync(PIN_KEY, hash);
}

export async function verifyPin(pin: string): Promise<boolean> {
  try {
    const [salt, stored] = await Promise.all([
      SecureStore.getItemAsync(SALT_KEY),
      SecureStore.getItemAsync(PIN_KEY),
    ]);
    if (!salt || !stored) return false;
    return (await hashPin(pin, salt)) === stored;
  } catch {
    return false;
  }
}

export async function disableLock(): Promise<void> {
  await SecureStore.deleteItemAsync(PIN_KEY);
  await SecureStore.deleteItemAsync(SALT_KEY);
  await SecureStore.deleteItemAsync(BIOMETRIC_KEY);
}

export async function isBiometricAvailable(): Promise<boolean> {
  try {
    const [hasHardware, enrolled] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
    ]);
    return hasHardware && enrolled;
  } catch {
    return false;
  }
}

export async function isBiometricEnabled(): Promise<boolean> {
  try {
    return (await SecureStore.getItemAsync(BIOMETRIC_KEY)) === 'true';
  } catch {
    return false;
  }
}

export async function setBiometricEnabled(enabled: boolean): Promise<void> {
  await SecureStore.setItemAsync(BIOMETRIC_KEY, enabled ? 'true' : 'false');
}

export async function authenticateWithBiometrics(prompt: string): Promise<boolean> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: prompt,
      // Always leave the PIN as a way in: a patient who cannot authenticate
      // must never be locked out of their own medication schedule.
      disableDeviceFallback: false,
    });
    return result.success;
  } catch {
    return false;
  }
}
