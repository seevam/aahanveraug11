import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Card, EmptyState, Row, Screen, Spacer, Text } from '../../src/components/primitives';
import { Button, StatusPill } from '../../src/components/Button';
import { PatientSwitcher } from '../../src/components/PatientSwitcher';
import { useTheme } from '../../src/theme/ThemeProvider';
import { useAppStore, useSelectedPatient } from '../../src/stores/app-store';
import { reminders as reminderRepo, type Reminder } from '../../src/db/repositories';
import { minutesForConfig, minutesToHHMM } from '../../src/scheduling/engine';
import { ALL_WEEKDAYS, type Weekday } from '../../src/scheduling/types';

function useDayLabels(): Record<Weekday, string> {
  const { t } = useTranslation();
  return {
    0: t('days.sun'),
    1: t('days.mon'),
    2: t('days.tue'),
    3: t('days.wed'),
    4: t('days.thu'),
    5: t('days.fri'),
    6: t('days.sat'),
  };
}

function ReminderRow({ reminder, onPress }: { reminder: Reminder; onPress: () => void }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const dayLabels = useDayLabels();

  const times = minutesForConfig(reminder.config);
  const isEveryDay = reminder.daysOfWeek.length === ALL_WEEKDAYS.length;
  const dayText = isEveryDay
    ? t('reminders.everyDay')
    : reminder.daysOfWeek.map((d) => dayLabels[d]).join(', ');

  // Showing every time gets unreadable past a handful; summarise instead.
  const timeText =
    times.length <= 4
      ? times.map(minutesToHHMM).join(' · ')
      : `${minutesToHHMM(times[0] ?? 0)} – ${minutesToHHMM(times[times.length - 1] ?? 0)}`;

  return (
    <Card style={{ marginBottom: theme.spacing.md, opacity: reminder.active ? 1 : 0.6 }}>
      <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <Text variant="subheading">{reminder.medicationName}</Text>
          <Text variant="body" tone="secondary" style={{ marginTop: 2 }}>
            {reminder.dosage} · {t(`eye.${reminder.eye}`)}
          </Text>
        </View>
        <StatusPill
          label={reminder.active ? t('reminders.active') : t('reminders.paused')}
          tone={reminder.active ? 'success' : 'neutral'}
        />
      </Row>

      <Spacer size="md" />
      <Text variant="body">{timeText}</Text>
      <Text variant="caption" tone="muted" style={{ marginTop: 2 }}>
        {t('reminders.perDay', { count: times.length })} · {dayText}
      </Text>

      <Spacer size="md" />
      <Button label={t('common.edit')} variant="secondary" onPress={onPress} />
    </Card>
  );
}

export default function RemindersScreen() {
  const { t } = useTranslation();
  const patient = useSelectedPatient();
  const dataVersion = useAppStore((s) => s.dataVersion);

  const [list, setList] = useState<Reminder[]>([]);

  const load = useCallback(async () => {
    if (!patient) {
      setList([]);
      return;
    }
    setList(await reminderRepo.listForPatient(patient.id));
  }, [patient]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load, dataVersion]),
  );

  if (!patient) return null;

  return (
    <Screen>
      <PatientSwitcher />
      <Spacer size="lg" />
      <Row style={{ justifyContent: 'space-between' }}>
        <Text variant="display" accessibilityRole="header">
          {t('reminders.title')}
        </Text>
      </Row>

      <Spacer size="lg" />
      <Button
        label={t('reminders.addReminder')}
        icon="+"
        size="large"
        onPress={() => router.push('/reminder/new')}
      />

      <Spacer size="xl" />

      {list.length === 0 ? (
        <EmptyState icon="⏰" title={t('reminders.emptyTitle')} body={t('reminders.emptyBody')} />
      ) : (
        list.map((reminder) => (
          <ReminderRow
            key={reminder.id}
            reminder={reminder}
            onPress={() => router.push(`/reminder/${reminder.id}`)}
          />
        ))
      )}
    </Screen>
  );
}
