import { describe, expect, it } from 'vitest';

import { ALARM_VIBRATION_PATTERN } from '../src/notifications/alarm-pattern';

/**
 * Mirrors `isValidVibratePattern` in @notifee/react-native
 * (dist/validators/validate.js). Notifee's own copy cannot be imported here
 * because its module graph pulls in react-native.
 *
 * This matters more than it looks: a pattern Notifee rejects makes
 * `createChannel` throw, which left the app stuck on its splash screen.
 */
function notifeeAccepts(pattern: number[]): boolean {
  return pattern.length % 2 === 0 && pattern.every((ms) => typeof ms === 'number' && ms > 0);
}

describe('alarm vibration pattern', () => {
  it('is accepted by Notifee', () => {
    expect(notifeeAccepts(ALARM_VIBRATION_PATTERN)).toBe(true);
  });

  it('starts vibrating immediately', () => {
    // Android reads the first value as the delay before the first pulse.
    expect(ALARM_VIBRATION_PATTERN[0]).toBeLessThanOrEqual(10);
  });

  it('would have caught the original pattern', () => {
    expect(notifeeAccepts([0, 800, 400, 800, 400, 800])).toBe(false);
  });
});
