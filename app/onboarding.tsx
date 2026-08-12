import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Card, EmojiIcon, Row, Screen, Spacer, Text } from '../src/components/primitives';
import { Button } from '../src/components/Button';
import { Field, TextField } from '../src/components/inputs';
import { useTheme } from '../src/theme/ThemeProvider';
import { useAppStore } from '../src/stores/app-store';
import { patients as patientRepo } from '../src/db/repositories';
import { requestPermission } from '../src/notifications/service';
import { SUPPORTED_LANGUAGES } from '../src/i18n';

type Step = 'welcome' | 'profile' | 'notifications';

/**
 * Three steps, no account.
 *
 * There is no server to authenticate against, so asking for a phone number
 * would be theatre. The fastest path from install to a working reminder is:
 * who is this for, then may we notify you.
 */
export default function Onboarding() {
  const theme = useTheme();
  const { t } = useTranslation();

  const [step, setStep] = useState<Step>('welcome');
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);

  const language = useAppStore((s) => s.language);
  const setLanguage = useAppStore((s) => s.setLanguage);
  const reloadPatients = useAppStore((s) => s.reloadPatients);
  const selectPatient = useAppStore((s) => s.selectPatient);
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);
  const refreshPermission = useAppStore((s) => s.refreshPermission);

  async function createPatient() {
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
      await selectPatient(patient.id);
      setStep('notifications');
    } finally {
      setBusy(false);
    }
  }

  async function finish(askForPermission: boolean) {
    setBusy(true);
    try {
      if (askForPermission) await requestPermission();
      await refreshPermission();
      await completeOnboarding();
      router.replace('/(tabs)');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen contentStyle={{ flexGrow: 1, justifyContent: 'center' }}>
      {step === 'welcome' ? (
        <View>
          <EmojiIcon symbol="👁️" size={64} />
          <Spacer size="xl" />
          <Text variant="display" accessibilityRole="header" style={{ textAlign: 'center' }}>
            {t('onboarding.welcomeTitle')}
          </Text>
          <Spacer size="md" />
          <Text variant="body" tone="secondary" style={{ textAlign: 'center' }}>
            {t('onboarding.welcomeBody')}
          </Text>

          <Spacer size="xxl" />

          {/* Language up front: a patient who cannot read the next screen
              cannot complete onboarding at all. */}
          <Row style={{ justifyContent: 'center', gap: theme.spacing.sm, flexWrap: 'wrap' }}>
            {SUPPORTED_LANGUAGES.map((lang) => (
              <Button
                key={lang.code}
                label={lang.endonym}
                variant={language === lang.code ? 'primary' : 'secondary'}
                onPress={() => setLanguage(lang.code)}
              />
            ))}
          </Row>

          <Spacer size="xxl" />
          <Button
            label={t('onboarding.getStarted')}
            size="large"
            onPress={() => setStep('profile')}
          />
        </View>
      ) : null}

      {step === 'profile' ? (
        <View>
          <Text variant="title" accessibilityRole="header">
            {t('onboarding.profileTitle')}
          </Text>
          <Spacer size="sm" />
          <Text variant="body" tone="secondary">
            {t('onboarding.profileBody')}
          </Text>
          <Spacer size="xl" />

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
          <Button
            label={t('common.next')}
            size="large"
            loading={busy}
            onPress={createPatient}
          />
          <Spacer size="sm" />
          <Button label={t('common.back')} variant="ghost" onPress={() => setStep('welcome')} />
        </View>
      ) : null}

      {step === 'notifications' ? (
        <View>
          <EmojiIcon symbol="🔔" size={56} />
          <Spacer size="lg" />
          <Text variant="title" accessibilityRole="header" style={{ textAlign: 'center' }}>
            {t('onboarding.notificationsTitle')}
          </Text>
          <Spacer size="md" />
          <Text variant="body" tone="secondary" style={{ textAlign: 'center' }}>
            {t('onboarding.notificationsBody')}
          </Text>

          <Spacer size="xl" />
          <Card>
            <Text variant="caption" tone="muted">
              {t('profile.dataNote')}
            </Text>
          </Card>

          <Spacer size="xxl" />
          <Button
            label={t('onboarding.notificationsEnable')}
            size="large"
            loading={busy}
            onPress={() => finish(true)}
          />
          <Spacer size="sm" />
          <Button
            label={t('onboarding.notificationsLater')}
            variant="ghost"
            onPress={() => finish(false)}
          />
        </View>
      ) : null}
    </Screen>
  );
}
