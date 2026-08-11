import React, { useState } from 'react';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Screen, Spacer, Text } from '../../src/components/primitives';
import { Button } from '../../src/components/Button';
import { Field, TextField } from '../../src/components/inputs';
import { useAppStore } from '../../src/stores/app-store';
import { patients as patientRepo } from '../../src/db/repositories';

export default function NewPatientScreen() {
  const { t } = useTranslation();
  const reloadPatients = useAppStore((s) => s.reloadPatients);
  const selectPatient = useAppStore((s) => s.selectPatient);

  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);

  async function save() {
    if (name.trim().length === 0) {
      setError(t('validation.nameRequired'));
      return;
    }
    setBusy(true);
    try {
      const patient = await patientRepo.create({
        name,
        relationship: relationship.trim() || null,
      });
      await reloadPatients();
      // Switch to the new person so the next thing the caregiver does —
      // adding their drops — lands on the right profile.
      await selectPatient(patient.id);
      router.back();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <Text variant="title" accessibilityRole="header">
        {t('profile.addPerson')}
      </Text>
      <Spacer size="lg" />

      <Field label={t('onboarding.nameLabel')} error={error}>
        <TextField
          value={name}
          onChangeText={(v) => {
            setName(v);
            if (error) setError(undefined);
          }}
          placeholder={t('onboarding.namePlaceholder')}
          autoFocus
          accessibilityLabel={t('onboarding.nameLabel')}
        />
      </Field>

      <Field label={`${t('onboarding.relationshipLabel')} (${t('common.optional')})`}>
        <TextField
          value={relationship}
          onChangeText={setRelationship}
          placeholder={t('onboarding.relationshipPlaceholder')}
          accessibilityLabel={t('onboarding.relationshipLabel')}
        />
      </Field>

      <Spacer size="lg" />
      <Button label={t('common.save')} size="large" loading={busy} onPress={save} />
      <Spacer size="sm" />
      <Button label={t('common.cancel')} variant="ghost" onPress={() => router.back()} />
    </Screen>
  );
}
