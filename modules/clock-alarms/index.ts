import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo';

type ClockAlarmsNative = {
  isAvailable(): boolean;
  setAlarm(
    hour: number,
    minute: number,
    label: string,
    days: number[],
    vibrate: boolean,
    silent: boolean,
  ): Promise<void>;
  showAlarms(): Promise<void>;
};

/** Absent on iOS, which has no API for creating Clock alarms, and in Expo Go. */
const native =
  Platform.OS === 'android' ? requireOptionalNativeModule<ClockAlarmsNative>('ClockAlarms') : null;

export function isClockAvailable(): boolean {
  try {
    return native?.isAvailable() ?? false;
  } catch {
    return false;
  }
}

export async function setClockAlarm(alarm: {
  hour: number;
  minute: number;
  label: string;
  /** java.util.Calendar numbering: Sunday = 1 … Saturday = 7. */
  days: number[];
  vibrate: boolean;
  silent: boolean;
}): Promise<void> {
  if (!native) throw new Error('Clock alarms are not available on this device.');
  await native.setAlarm(alarm.hour, alarm.minute, alarm.label, alarm.days, alarm.vibrate, alarm.silent);
}

export async function showClockAlarms(): Promise<void> {
  await native?.showAlarms();
}
