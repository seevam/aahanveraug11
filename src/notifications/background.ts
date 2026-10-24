/**
 * Alarm actions handled while the app is not running.
 *
 * Notifee keeps foreground and background events in separate registries, and
 * the background one must be registered **before the app mounts** — hence the
 * custom entry point in `index.js` rather than a hook inside a component.
 *
 * Without this, pressing Taken on a lock-screen alarm would do nothing unless
 * the app happened to already be open, which is precisely when it is least
 * likely to be.
 */

import notifee, { EventType, type Event } from '@notifee/react-native';

import { markSkipped, markTaken, snooze } from '../services/dose-actions';

async function handle(event: Event): Promise<void> {
  if (event.type !== EventType.ACTION_PRESS) return;

  const doseId = event.detail.notification?.data?.doseId;
  const action = event.detail.pressAction?.id;
  if (typeof doseId !== 'string' || !action) return;

  try {
    if (action === 'taken') await markTaken(doseId);
    else if (action === 'skip') await markSkipped(doseId);
    else if (action === 'snooze') await snooze(doseId);
  } catch {
    // A failure here must not crash the background task; the dose stays
    // pending and the next app launch sweeps or re-arms it.
  }

  // Clear the ongoing alarm now that it has been answered. It is deliberately
  // not auto-cancelling, so nothing else will remove it.
  const id = event.detail.notification?.id;
  if (id) {
    await notifee.cancelNotification(id).catch(() => {});
  }
}

notifee.onBackgroundEvent(handle);
