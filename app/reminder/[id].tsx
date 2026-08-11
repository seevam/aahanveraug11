import React, { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Screen, Spacer, Text } from '../../src/components/primitives';
import { Button } from '../../src/components/Button';
import { ToggleRow } from '../../src/components/inputs';
import { ReminderForm, type ReminderFormValue } from '../../src/components/ReminderForm';
import { useAppStore, useSelectedPatient } from '../../src/stores/app-store';
import { reminders as reminderRepo } from '../../src/db/repositories';
import { resyncPatient, resyncReminder } from '../../src/services/schedule-service';
import type { ReminderSpec } from '../../src/scheduling/types';

export default function EditReminderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const patient = useSelectedPatient();
  const sync = useAppStore((s) => s.sync);

  const [value, setValue] = useState<ReminderFormValue | null>(null);
  const [active, setActive] = useState(true);
  const [others, setOthers] = useState<ReminderSpec[]>([]);
  const [busy, setBusy] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!id || !patient) return;
      void (async () => {
        const reminder = await reminderRepo.get(id);
        if (!reminder) {
          router.back();
          return;
        }
        setValue({
          medicationName: reminder.medicationName,
          medicationId: reminder.medicationId,
          dosage: reminder.dosage,
          eye: reminder.eye,
          config: reminder.config,
          daysOfWeek: reminder.daysOfWeek,
          startDate: reminder.startDate,
          endDate: reminder.endDate,
          snoozeMinutes: reminder.snoozeMinutes,
          snoozeLimit: reminder.snoozeLimit,
          soundEnabled: reminder.soundEnabled,
          vibrateEnabled: reminder.vibrateEnabled,
        });
        setActive(reminder.active);

        // Exclude this reminder from the conflict preview — otherwise it
        // collides with its own unedited copy.
        const list = await reminderRepo.listForPatient(patient.id, false);
        setOthers(list.filter((r) => r.id !== id));
      })();
    }, [id, patient]),
  );

  async function save() {
    if (!value || !id) return;
    setBusy(true);
    try {
      await reminderRepo.update(id, { ...value, active });
      await resyncReminder(id);
      await sync();
      router.back();
    } finally {
      setBusy(false);
    }
  }

  function confirmDelete() {
    if (!id || !patient) return;
    Alert.alert(t('reminders.deleteTitle'), t('reminders.deleteBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          await reminderRepo.remove(id);
          await resyncPatient(patient.id);
          await sync();
          router.back();
        },
      },
    ]);
  }

  if (!patient || !value) return null;

  return (
    <Screen>
      <Text variant="title" accessibilityRole="header">
        {t('reminders.editReminder')}
      </Text>

      <Spacer size="lg" />
      <ToggleRow
        label={active ? t('reminders.active') : t('reminders.paused')}
        value={active}
        onChange={setActive}
      />

      <Spacer size="md" />
      <ReminderForm
        value={value}
        onChange={setValue}
        onSubmit={save}
        submitLabel={t('common.save')}
        timezone={patient.timezone}
        otherReminders={others}
        reminderId={id}
        busy={busy}
      />

      <Spacer size="lg" />
      <Button label={t('reminders.deleteTitle')} variant="danger" onPress={confirmDelete} />
    </Screen>
  );
}
