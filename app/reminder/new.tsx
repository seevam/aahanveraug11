import React, { useCallback, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Screen, Spacer, Text } from '../../src/components/primitives';
import {
  ReminderForm,
  emptyFormValue,
  type ReminderFormValue,
} from '../../src/components/ReminderForm';
import { useAppStore, useSelectedPatient } from '../../src/stores/app-store';
import { reminders as reminderRepo } from '../../src/db/repositories';
import { resyncReminder } from '../../src/services/schedule-service';
import type { ReminderSpec } from '../../src/scheduling/types';

const PREVIEW_ID = '__new__';

export default function NewReminderScreen() {
  const { t } = useTranslation();
  const patient = useSelectedPatient();
  const sync = useAppStore((s) => s.sync);

  const [value, setValue] = useState<ReminderFormValue>(() =>
    emptyFormValue(patient?.timezone ?? 'UTC'),
  );
  const [others, setOthers] = useState<ReminderSpec[]>([]);
  const [busy, setBusy] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!patient) return;
      void (async () => {
        const list = await reminderRepo.listForPatient(patient.id, false);
        setOthers(list);
      })();
    }, [patient]),
  );

  async function save() {
    if (!patient) return;
    setBusy(true);
    try {
      const created = await reminderRepo.create({
        patientId: patient.id,
        medicationName: value.medicationName,
        medicationId: value.medicationId,
        dosage: value.dosage,
        eye: value.eye,
        config: value.config,
        daysOfWeek: value.daysOfWeek,
        startDate: value.startDate,
        endDate: value.endDate,
        snoozeMinutes: value.snoozeMinutes,
        snoozeLimit: value.snoozeLimit,
        soundEnabled: value.soundEnabled,
        vibrateEnabled: value.vibrateEnabled,
      });
      await resyncReminder(created.id);
      await sync();
      router.back();
    } finally {
      setBusy(false);
    }
  }

  if (!patient) return null;

  return (
    <Screen>
      <Text variant="title" accessibilityRole="header">
        {t('reminders.addReminder')}
      </Text>
      <Spacer size="lg" />
      <ReminderForm
        value={value}
        onChange={setValue}
        onSubmit={save}
        submitLabel={t('form.saveReminder')}
        timezone={patient.timezone}
        otherReminders={others}
        reminderId={PREVIEW_ID}
        busy={busy}
      />
    </Screen>
  );
}
