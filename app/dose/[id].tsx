import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Row, Spacer, Text } from '../../src/components/primitives';
import { Button } from '../../src/components/Button';
import { useTheme } from '../../src/theme/ThemeProvider';
import { useAppStore } from '../../src/stores/app-store';
import { doses as doseRepo, reminders as reminderRepo, type Dose } from '../../src/db/repositories';
import { markSkipped, markTaken, snooze } from '../../src/services/dose-actions';
import { minutesToHHMM } from '../../src/scheduling/engine';
import { utcToLocalMinute } from '../../src/scheduling/timezone';

/**
 * The full-screen dose prompt, opened by tapping a reminder notification.
 *
 * On a development build this is where Notifee's full-screen intent would
 * land the patient directly from the lock screen. With expo-notifications the
 * notification must be tapped first, which is the main capability gap of the
 * Expo Go path — the screen itself is already built for that future.
 */
export default function DoseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const { t } = useTranslation();

  const patients = useAppStore((s) => s.patients);
  const sync = useAppStore((s) => s.sync);

  const [dose, setDose] = useState<Dose | null>(null);
  const [snoozeMinutes, setSnoozeMinutes] = useState(10);
  const [snoozeExhausted, setSnoozeExhausted] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    void (async () => {
      const found = await doseRepo.get(id);
      setDose(found);
      if (found) {
        const reminder = await reminderRepo.get(found.reminderId);
        setSnoozeMinutes(reminder?.snoozeMinutes ?? 10);
        setSnoozeExhausted(found.snoozeCount >= (reminder?.snoozeLimit ?? 3));
      }
    })();
  }, [id]);

  const act = useCallback(
    async (action: () => Promise<unknown>, feedback: Haptics.NotificationFeedbackType) => {
      setBusy(true);
      try {
        await Haptics.notificationAsync(feedback).catch(() => {});
        await action();
        await sync();
        router.back();
      } finally {
        setBusy(false);
      }
    },
    [sync],
  );

  if (!dose) return null;

  const patient = patients.find((p) => p.id === dose.patientId);
  const time = minutesToHHMM(utcToLocalMinute(dose.scheduledAt, patient?.timezone ?? 'UTC'));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.primary }}>
      <View
        style={{
          flex: 1,
          padding: theme.spacing.xl,
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text
            variant="label"
            style={{ color: theme.colors.onPrimary, opacity: 0.85 }}
            accessibilityRole="header"
          >
            {t('alarm.timeFor')}
          </Text>

          <Spacer size="md" />
          <Text
            variant="clock"
            style={{ color: theme.colors.onPrimary, textAlign: 'center' }}
          >
            {time}
          </Text>

          <Spacer size="lg" />
          <Text
            variant="title"
            style={{ color: theme.colors.onPrimary, textAlign: 'center' }}
          >
            {dose.medicationName}
          </Text>

          <Spacer size="sm" />
          <Text
            variant="subheading"
            style={{ color: theme.colors.onPrimary, opacity: 0.9, textAlign: 'center' }}
          >
            {dose.dosage} · {t(`eye.${dose.eye}`)}
          </Text>

          {patient ? (
            <>
              <Spacer size="lg" />
              <Row
                style={{
                  backgroundColor: 'rgba(255,255,255,0.18)',
                  paddingHorizontal: theme.spacing.lg,
                  paddingVertical: theme.spacing.sm,
                  borderRadius: theme.radius.pill,
                }}
              >
                <Text variant="label" style={{ color: theme.colors.onPrimary }}>
                  {patient.name}
                </Text>
              </Row>
            </>
          ) : null}
        </View>

        <View style={{ gap: theme.spacing.md }}>
          <Button
            label={t('alarm.taken')}
            variant="success"
            size="large"
            icon="✓"
            loading={busy}
            onPress={() => act(() => markTaken(dose.id), Haptics.NotificationFeedbackType.Success)}
          />

          {snoozeExhausted ? (
            <Text
              variant="caption"
              style={{ color: theme.colors.onPrimary, textAlign: 'center', opacity: 0.9 }}
            >
              {t('alarm.snoozeLimitReached')}
            </Text>
          ) : (
            <Button
              label={t('alarm.snooze', { minutes: snoozeMinutes })}
              variant="secondary"
              size="large"
              disabled={busy}
              onPress={() => act(() => snooze(dose.id), Haptics.NotificationFeedbackType.Warning)}
            />
          )}

          <Button
            label={t('alarm.skip')}
            variant="ghost"
            disabled={busy}
            style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
            onPress={() => act(() => markSkipped(dose.id), Haptics.NotificationFeedbackType.Warning)}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
