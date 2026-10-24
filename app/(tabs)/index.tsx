import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card, EmptyState, Row, SectionHeading, Spacer, Text } from '../../src/components/primitives';
import { Button } from '../../src/components/Button';
import { DoseCard } from '../../src/components/DoseCard';
import { PatientSwitcher } from '../../src/components/PatientSwitcher';
import { useTheme } from '../../src/theme/ThemeProvider';
import { useAppStore, useSelectedPatient } from '../../src/stores/app-store';
import { doses as doseRepo, type Dose } from '../../src/db/repositories';
import { markSkipped, markTaken, snooze, undoAction } from '../../src/services/dose-actions';
import { minutesToHHMM } from '../../src/scheduling/engine';
import { todayIn, utcToLocalMinute } from '../../src/scheduling/timezone';
import { batteryOptimised, exactAlarmsAllowed } from '../../src/notifications/service';
import { getAlarmStyle } from '../../src/services/clock-alarms';
import { ClockAlarmsCard } from '../../src/components/ClockAlarmsCard';

export default function TodayScreen() {
  const theme = useTheme();
  const { t } = useTranslation();

  const patient = useSelectedPatient();
  const dataVersion = useAppStore((s) => s.dataVersion);
  const sync = useAppStore((s) => s.sync);
  const permission = useAppStore((s) => s.notificationPermission);

  const [doses, setDoses] = useState<Dose[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  // Only the settings Android lets us read back. A fresh install on Android
  // 14+ starts with exact alarms off, so this is what most new users will see.
  const [alarmsNeedSetup, setAlarmsNeedSetup] = useState(false);
  const [ringsInClock, setRingsInClock] = useState(false);

  const load = useCallback(async () => {
    if (!patient) {
      setDoses([]);
      setLoading(false);
      return;
    }
    const today = todayIn(patient.timezone);
    setDoses(await doseRepo.forDate(patient.id, today));
    setLoading(false);
    const [exact, battery] = await Promise.all([
      exactAlarmsAllowed().catch(() => null),
      batteryOptimised().catch(() => null),
    ]);
    setAlarmsNeedSetup(exact === false || battery === true);
    setRingsInClock((await getAlarmStyle()) === 'clock');
  }, [patient]);

  useEffect(() => {
    void load();
  }, [load, dataVersion]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const act = useCallback(
    async (action: () => Promise<unknown>) => {
      await action();
      await load();
      void sync();
    },
    [load, sync],
  );

  if (!patient) return null;

  const now = Date.now();
  const upcoming = doses.filter((d) => d.status === 'pending' || d.status === 'snoozed');
  const past = doses.filter((d) => d.status !== 'pending' && d.status !== 'snoozed');
  const nextDose = upcoming.find((d) => d.scheduledAt >= now) ?? upcoming[0];
  const allDone = doses.length > 0 && upcoming.length === 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: theme.spacing.xxxl }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await sync();
              await load();
              setRefreshing(false);
            }}
            tintColor={theme.colors.primary}
          />
        }
      >
        <Row style={{ justifyContent: 'space-between' }}>
          <PatientSwitcher />
        </Row>

        <Spacer size="lg" />
        <Text variant="display" accessibilityRole="header">
          {t('today.title')}
        </Text>

        {upcoming.length > 0 ? (
          <Text variant="body" tone="secondary" style={{ marginTop: theme.spacing.xs }}>
            {t('today.remaining', { count: upcoming.length })}
          </Text>
        ) : null}

        {permission !== 'granted' ? (
          <>
            <Spacer size="lg" />
            <Card
              style={{
                backgroundColor: theme.colors.warningSubtle,
                borderColor: theme.colors.warning,
              }}
            >
              <Text variant="bodyStrong" style={{ color: theme.colors.onWarningSubtle }}>
                {t('onboarding.notificationsTitle')}
              </Text>
              <Text
                variant="caption"
                style={{ color: theme.colors.onWarningSubtle, marginTop: theme.spacing.xs }}
              >
                {t('onboarding.notificationsBody')}
              </Text>
              <Spacer size="md" />
              <Button
                label={t('onboarding.notificationsEnable')}
                variant="secondary"
                onPress={() => router.push('/(tabs)/profile')}
              />
            </Card>
          </>
        ) : null}

        {permission === 'granted' && alarmsNeedSetup ? (
          <>
            <Spacer size="lg" />
            <Card
              style={{
                backgroundColor: theme.colors.warningSubtle,
                borderColor: theme.colors.warning,
              }}
            >
              <Text variant="bodyStrong" style={{ color: theme.colors.onWarningSubtle }}>
                {t('today.alarmSetupTitle')}
              </Text>
              <Text
                variant="caption"
                style={{ color: theme.colors.onWarningSubtle, marginTop: theme.spacing.xs }}
              >
                {t('today.alarmSetupBody')}
              </Text>
              <Spacer size="md" />
              <Button
                label={t('today.alarmSetupAction')}
                variant="secondary"
                onPress={() => router.push('/(tabs)/profile')}
              />
            </Card>
          </>
        ) : null}

        {/* After any schedule change the Clock app is behind until the user
            taps through; say so where they will see it. */}
        {ringsInClock ? (
          <>
            <Spacer size="lg" />
            <ClockAlarmsCard onlyWhenOutOfSync />
          </>
        ) : null}

        {nextDose && !allDone ? (
          <>
            <Spacer size="xl" />
            <Card style={{ backgroundColor: theme.colors.primarySubtle, borderColor: theme.colors.primary }}>
              <Text variant="label" tone="primary">
                {t('today.nextDose')}
              </Text>
              <Row style={{ marginTop: theme.spacing.sm, gap: theme.spacing.lg }}>
                <Text variant="clock" tone="primary">
                  {minutesToHHMM(utcToLocalMinute(nextDose.scheduledAt, patient.timezone))}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text variant="subheading">{nextDose.medicationName}</Text>
                  <Text variant="body" tone="secondary">
                    {nextDose.dosage} · {t(`eye.${nextDose.eye}`)}
                  </Text>
                </View>
              </Row>
            </Card>
          </>
        ) : null}

        {loading ? null : doses.length === 0 ? (
          <>
            <Spacer size="xl" />
            <EmptyState
              icon="💧"
              title={t('today.noDosesTitle')}
              body={t('today.noDosesBody')}
              action={
                <Button
                  label={t('reminders.addReminder')}
                  size="large"
                  onPress={() => router.push('/reminder/new')}
                />
              }
            />
          </>
        ) : allDone ? (
          <>
            <Spacer size="xl" />
            <EmptyState icon="✅" title={t('today.allDoneTitle')} body={t('today.allDoneBody')} />
          </>
        ) : null}

        {upcoming.length > 0 ? (
          <>
            <SectionHeading>{t('today.upcoming')}</SectionHeading>
            {upcoming.map((dose) => (
              <DoseCard
                key={dose.id}
                dose={dose}
                timezone={patient.timezone}
                onTaken={() => act(() => markTaken(dose.id))}
                onSnooze={() => act(() => snooze(dose.id))}
                onSkip={() => act(() => markSkipped(dose.id))}
              />
            ))}
          </>
        ) : null}

        {past.length > 0 ? (
          <>
            <SectionHeading>{t('today.earlier')}</SectionHeading>
            {past.map((dose) => (
              <DoseCard
                key={dose.id}
                dose={dose}
                timezone={patient.timezone}
                onUndo={() => act(() => undoAction(dose.id))}
              />
            ))}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
