import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Screen, Spacer, Text } from '../src/components/primitives';
import { Button } from '../src/components/Button';
import { Field, TextField } from '../src/components/inputs';
import { useTheme } from '../src/theme/ThemeProvider';
import {
  authenticateWithBiometrics,
  isBiometricAvailable,
  isBiometricEnabled,
  verifyPin,
} from '../src/services/security';

export default function LockScreen() {
  const theme = useTheme();
  const { t } = useTranslation();

  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [biometricReady, setBiometricReady] = useState(false);

  const unlock = useCallback(() => {
    router.replace('/(tabs)');
  }, []);

  const tryBiometrics = useCallback(async () => {
    if (await authenticateWithBiometrics(t('security.biometricPrompt'))) {
      unlock();
    }
  }, [t, unlock]);

  useEffect(() => {
    void (async () => {
      const enabled = (await isBiometricEnabled()) && (await isBiometricAvailable());
      setBiometricReady(enabled);
      // Prompt immediately when biometrics are on — one fewer step for a
      // patient who just wants to record a dose.
      if (enabled) await tryBiometrics();
    })();
  }, [tryBiometrics]);

  async function submit() {
    if (await verifyPin(pin)) {
      unlock();
    } else {
      setError(t('security.wrongPin'));
      setPin('');
    }
  }

  return (
    <Screen scroll={false} contentStyle={{ justifyContent: 'center' }}>
      <View style={{ alignItems: 'center' }}>
        <Text style={{ fontSize: 56 }} accessibilityElementsHidden>
          🔒
        </Text>
        <Spacer size="lg" />
        <Text variant="title" accessibilityRole="header">
          {t('security.unlockTitle')}
        </Text>
      </View>

      <Spacer size="xl" />

      <Field label={t('security.unlockTitle')} error={error}>
        <TextField
          value={pin}
          onChangeText={(v) => {
            setPin(v.replace(/\D/g, '').slice(0, 4));
            if (error) setError(undefined);
          }}
          keyboardType="number-pad"
          maxLength={4}
          autoFocus={!biometricReady}
          accessibilityLabel={t('security.unlockTitle')}
        />
      </Field>

      <Button
        label={t('common.done')}
        size="large"
        disabled={pin.length !== 4}
        onPress={submit}
      />

      {biometricReady ? (
        <>
          <Spacer size="md" />
          <Button label={t('security.useBiometric')} variant="ghost" onPress={tryBiometrics} />
        </>
      ) : null}

      <Spacer size="xl" />
      <Text variant="caption" tone="muted" style={{ textAlign: 'center' }}>
        {t('profile.dataNote')}
      </Text>
      <View style={{ height: theme.spacing.xxl }} />
    </Screen>
  );
}
