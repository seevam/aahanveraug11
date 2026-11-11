import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo';

type AlarmAudioNative = {
  getVolume(): { current: number; min: number; max: number };
  setVolume(level: number): number;
  startTestTone(): void;
  stopTestTone(): void;
};

/** Android only: iOS has no separate alarm volume to read or set. */
const native =
  Platform.OS === 'android' ? requireOptionalNativeModule<AlarmAudioNative>('AlarmAudio') : null;

export type AlarmVolume = { current: number; min: number; max: number };

/** The alarm volume, or null where it cannot be read. */
export function getAlarmVolume(): AlarmVolume | null {
  try {
    return native?.getVolume() ?? null;
  } catch {
    return null;
  }
}

/** Sets the alarm volume and returns the level Android actually applied. */
export function setAlarmVolume(level: number): number | null {
  try {
    return native?.setVolume(level) ?? null;
  } catch {
    return null;
  }
}

export function startTestTone(): boolean {
  try {
    native?.startTestTone();
    return native !== null;
  } catch {
    return false;
  }
}

export function stopTestTone(): void {
  try {
    native?.stopTestTone();
  } catch {
    // Already stopped.
  }
}
