import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, View, type AppStateStatus } from 'react-native';
import { Stack, router, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';

import { ThemeProvider, useTheme } from '../src/theme/ThemeProvider';
import { useAppStore } from '../src/stores/app-store';
import {
  addReceivedListener,
  addResponseListener,
  configure,
  DEFAULT_ACTION,
  getInitialAlarmDoseId,
  getRingingDoseId,
} from '../src/notifications/service';
import { markSkipped, markTaken, snooze } from '../src/services/dose-actions';
import { isLockEnabled } from '../src/services/security';

SplashScreen.preventAutoHideAsync().catch(() => {
  // Already hidden — not a failure worth surfacing.
});

function RootNavigator() {
  const theme = useTheme();
  const ready = useAppStore((s) => s.ready);

  if (!ready) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors.background,
        }}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.background },
        headerTintColor: theme.colors.text,
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="lock" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="dose/[id]" options={{ presentation: 'fullScreenModal', headerShown: false }} />
      <Stack.Screen name="reminder/new" options={{ presentation: 'modal', title: '' }} />
      <Stack.Screen name="reminder/[id]" options={{ presentation: 'modal', title: '' }} />
      <Stack.Screen name="patient/new" options={{ presentation: 'modal', title: '' }} />
      <Stack.Screen name="instructions" options={{ presentation: 'modal', title: '' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const bootstrap = useAppStore((s) => s.bootstrap);
  const sync = useAppStore((s) => s.sync);
  const invalidate = useAppStore((s) => s.invalidate);
  const [booted, setBooted] = useState(false);

  const appState = useRef<AppStateStatus>(AppState.currentState);

  // Opening the dose screen is triggered from several places at once — launch,
  // resume, delivery — so it must be a no-op when that dose is already showing.
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;
  const openDose = useCallback((doseId: string) => {
    const target = `/dose/${doseId}`;
    if (pathnameRef.current === target) return;
    pathnameRef.current = target;
    router.push(target);
  }, []);

  // Only the launch notification is consulted at cold start: it can describe
  // an alarm that has since been answered, so it must not be re-read later.
  const openRingingDose = useCallback(
    async (atLaunch: boolean) => {
      const ringing =
        (atLaunch ? await getInitialAlarmDoseId() : null) ?? (await getRingingDoseId());
      if (ringing) openDose(ringing);
    },
    [openDose],
  );

  useEffect(() => {
    let cancelled = false;

    (async () => {
      // Nothing here may leave the app stuck on its splash screen. A broken
      // alarm channel is serious, but the patient can still see and record
      // doses without it, so it is reported and startup carries on.
      try {
        await configure();
      } catch (error) {
        console.error('Alarm channel setup failed', error);
      }

      let locked = false;
      try {
        locked = await isLockEnabled();
        await bootstrap();
      } finally {
        if (!cancelled) {
          setBooted(true);
          await SplashScreen.hideAsync().catch(() => {});
        }
      }
      if (cancelled) return;
      // A ringing alarm is answered over the lock, like a phone's own alarm
      // clock; acting on it returns to the lock screen. It shows only what the
      // notification already showed on the lock screen.
      if (locked) router.replace('/lock');

      // A full-screen alarm launches the app, not a route. Land on the dose
      // that is actually ringing.
      await openRingingDose(true).catch(() => {});
    })();

    return () => {
      cancelled = true;
    };
  }, [bootstrap, openRingingDose]);

  // Notification action buttons act without opening the app. Tapping the body
  // opens the full-screen dose screen instead.
  useEffect(() => {
    const responseSub = addResponseListener(async (doseId, action) => {
      if (action === 'taken') await markTaken(doseId);
      else if (action === 'skip') await markSkipped(doseId);
      else if (action === 'snooze') await snooze(doseId);
      else if (action === DEFAULT_ACTION) {
        openDose(doseId);
        return;
      }
      await sync();
    });

    // An alarm going off while the app is open takes over the screen, as it
    // would on the lock screen — a banner is easy to miss mid-task. It also
    // frees a slot in the rolling window, so top that up.
    const receivedSub = addReceivedListener((doseId) => {
      openDose(doseId);
      invalidate();
      void sync();
    });

    return () => {
      responseSub.remove();
      receivedSub.remove();
    };
  }, [sync, invalidate, openDose]);

  // On resume: re-sync, because the sweep that marks unanswered doses as
  // missed only runs while the app is awake; and open any alarm that is
  // ringing, because a full-screen alarm that brings a running app to the
  // front fires no event of its own.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next) => {
      const wasBackground = appState.current.match(/inactive|background/);
      appState.current = next;
      if (wasBackground && next === 'active' && booted) {
        void sync();
        void openRingingDose(false).catch(() => {});
      }
    });
    return () => subscription.remove();
  }, [sync, booted, openRingingDose]);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <StatusBar style="auto" />
        <RootNavigator />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
