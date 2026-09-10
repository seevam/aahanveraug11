import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, View, type AppStateStatus } from 'react-native';
import { Stack, router } from 'expo-router';
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

  useEffect(() => {
    let cancelled = false;

    (async () => {
      await configure();
      const locked = await isLockEnabled();
      await bootstrap();
      if (cancelled) return;
      setBooted(true);
      await SplashScreen.hideAsync().catch(() => {});
      if (locked) router.replace('/lock');
    })();

    return () => {
      cancelled = true;
    };
  }, [bootstrap]);

  // Notification action buttons act without opening the app. Tapping the body
  // opens the full-screen dose screen instead.
  useEffect(() => {
    const responseSub = addResponseListener(async (doseId, action) => {
      if (action === 'taken') await markTaken(doseId);
      else if (action === 'skip') await markSkipped(doseId);
      else if (action === 'snooze') await snooze(doseId);
      else if (action === DEFAULT_ACTION) {
        router.push(`/dose/${doseId}`);
        return;
      }
      await sync();
    });

    // A fired notification means the rolling window has one free slot; top it
    // up so the far end of the schedule stays armed.
    const receivedSub = addReceivedListener(() => {
      invalidate();
      void sync();
    });

    return () => {
      responseSub.remove();
      receivedSub.remove();
    };
  }, [sync, invalidate]);

  // Re-sync on resume: the sweep that marks unanswered doses as missed only
  // runs while the app is awake.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next) => {
      const wasBackground = appState.current.match(/inactive|background/);
      appState.current = next;
      if (wasBackground && next === 'active' && booted) {
        void sync();
      }
    });
    return () => subscription.remove();
  }, [sync, booted]);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <StatusBar style="auto" />
        <RootNavigator />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
