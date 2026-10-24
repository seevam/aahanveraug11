/**
 * The alarm's vibration, kept apart from `service.ts` so it can be tested
 * without the native notification layer.
 *
 * Notifee passes this straight to Android, where the values alternate
 * wait / vibrate / wait / vibrate, starting with a wait. Long pulses, repeated:
 * a pattern meant to wake someone, not to notify them.
 *
 * Notifee rejects any pattern that has an odd length or a value that is not
 * strictly positive, so the opening wait is 1 ms rather than 0. A rejected
 * pattern fails channel creation, and with it app startup — see
 * `tests/alarm-pattern.test.ts`.
 */
export const ALARM_VIBRATION_PATTERN = [1, 800, 400, 800, 400, 800];
