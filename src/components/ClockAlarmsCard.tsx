import React, { useCallback, useEffect, useState } from 'react';
import { Alert, AppState, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Card, Spacer, Text } from './primitives';
import { Button } from './Button';
import { useTheme } from '../theme/ThemeProvider';
import { useAppStore } from '../stores/app-store';
import {
  addMissingToClock,
  forgetStaleClockAlarms,
  getClockStatus,
  showClockAlarms,
  type ClockStatus,
} from '../services/clock-alarms';
import type { ClockAlarm } from '../scheduling/clock-plan';

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

/**
 * Keeps the phone's Clock app in step with the reminders.
 *
 * Android lets an app add Clock alarms but not remove them, so this card is
 * the whole sync loop: add what is missing with one tap, and list what the
 * user has to delete by hand — by time and label, as the Clock app shows them.
 *
 * `onlyWhenOutOfSync` is for the Today screen, which should stay quiet unless
 * there is something to do.
 */
export function ClockAlarmsCard({ onlyWhenOutOfSync = false }: { onlyWhenOutOfSync?: boolean }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const dataVersion = useAppStore((s) => s.dataVersion);

  const [status, setStatus] = useState<ClockStatus | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setStatus(await getClockStatus().catch(() => null));
  }, []);

  useEffect(() => {
    void load();
  }, [load, dataVersion]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'active') void load();
    });
    return () => subscription.remove();
  }, [load]);

  if (!status) return null;
  const { toAdd, stale } = status;
  const inSync = toAdd.length === 0 && stale.length === 0;
  if (onlyWhenOutOfSync && inSync) return null;

  function describe(alarm: ClockAlarm): string {
    const time = `${String(alarm.hour).padStart(2, '0')}:${String(alarm.minute).padStart(2, '0')}`;
    const days =
      alarm.days.length === 7
        ? t('reminders.everyDay')
        : alarm.days.map((d) => t(`days.${DAY_KEYS[d - 1]!}`)).join(', ');
    return `${time} · ${alarm.label} · ${days}`;
  }

  async function add() {
    setBusy(true);
    try {
      setStatus(await addMissingToClock());
    } catch {
      Alert.alert(t('clock.title'), t('clock.addFailed'));
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function confirmDeleted() {
    await forgetStaleClockAlarms();
    await load();
  }

  const warn = !inSync;

  return (
    <Card
      style={
        warn
          ? { backgroundColor: theme.colors.warningSubtle, borderColor: theme.colors.warning }
          : undefined
      }
    >
      <Text
        variant="bodyStrong"
        style={warn ? { color: theme.colors.onWarningSubtle } : undefined}
      >
        {inSync ? t('clock.upToDate') : t('clock.needsUpdate')}
      </Text>

      {toAdd.length > 0 ? (
        <>
          <Spacer size="sm" />
          <Text variant="caption" style={{ color: theme.colors.onWarningSubtle }}>
            {t('clock.toAdd', { count: toAdd.length })}
          </Text>
          <Spacer size="md" />
          <Button label={t('clock.addAction')} loading={busy} onPress={add} />
        </>
      ) : null}

      {stale.length > 0 ? (
        <>
          <Spacer size="md" />
          <Text variant="caption" style={{ color: theme.colors.onWarningSubtle }}>
            {t('clock.staleIntro')}
          </Text>
          <Spacer size="sm" />
          <View style={{ gap: theme.spacing.xs }}>
            {stale.map((alarm) => (
              <Text key={describe(alarm)} variant="body" style={{ color: theme.colors.onWarningSubtle }}>
                • {describe(alarm)}
              </Text>
            ))}
          </View>
          <Spacer size="md" />
          <Button
            label={t('clock.openClock')}
            variant="secondary"
            onPress={() => void showClockAlarms()}
          />
          <Spacer size="sm" />
          <Button label={t('clock.deletedAction')} variant="ghost" onPress={confirmDeleted} />
        </>
      ) : null}

      {inSync ? (
        <>
          <Spacer size="sm" />
          <Text variant="caption" tone="muted">
            {t('clock.inSyncBody')}
          </Text>
          <Spacer size="md" />
          <Button
            label={t('clock.openClock')}
            variant="secondary"
            onPress={() => void showClockAlarms()}
          />
        </>
      ) : null}
    </Card>
  );
}
