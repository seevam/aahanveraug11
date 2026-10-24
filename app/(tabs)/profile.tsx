import React, { useCallback, useState } from 'react';
import { Alert, Linking, Platform, View } from 'react-native';
import Constants from 'expo-constants';
import { router, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';

import {
  Card,
  EmojiIcon,
  Row,
  Screen,
  SectionHeading,
  Spacer,
  Text,
} from '../../src/components/primitives';
import { Button, PressableRow, StatusPill } from '../../src/components/Button';
import { Field, Segmented, TextField, ToggleRow } from '../../src/components/inputs';
import { ImpactCard } from '../../src/components/ImpactCard';
import { Avatar } from '../../src/components/PatientSwitcher';
import { useTheme } from '../../src/theme/ThemeProvider';
import { useAppStore } from '../../src/stores/app-store';
import { patients as patientRepo } from '../../src/db/repositories';
import { SUPPORTED_LANGUAGES, type LanguageCode } from '../../src/i18n';
import { openAlarmSettings, requestPermission } from '../../src/notifications/service';
import { backupStats, exportBackup, importBackup } from '../../src/services/backup';
import {
  disableLock,
  isBiometricAvailable,
  isBiometricEnabled,
  isLockEnabled,
  setBiometricEnabled,
  setPin,
} from '../../src/services/security';

export default function ProfileScreen() {
  const theme = useTheme();
  const { t } = useTranslation();

  const patients = useAppStore((s) => s.patients);
  const language = useAppStore((s) => s.language);
  const setLanguage = useAppStore((s) => s.setLanguage);
  const permission = useAppStore((s) => s.notificationPermission);
  const refreshPermission = useAppStore((s) => s.refreshPermission);
  const reloadPatients = useAppStore((s) => s.reloadPatients);
  const sync = useAppStore((s) => s.sync);

  const [lockOn, setLockOn] = useState(false);
  const [biometricOn, setBiometricOn] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [lastBackup, setLastBackup] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // PIN entry, shown inline when the patient turns the lock on.
  const [pinStage, setPinStage] = useState<'idle' | 'set' | 'confirm'>('idle');
  const [pin, setPinValue] = useState('');
  const [firstPin, setFirstPin] = useState('');
  const [pinError, setPinError] = useState<string | undefined>();

  const load = useCallback(async () => {
    setLockOn(await isLockEnabled());
    setBiometricOn(await isBiometricEnabled());
    setBiometricAvailable(await isBiometricAvailable());
    setLastBackup((await backupStats()).lastBackupAt);
    await refreshPermission();
  }, [refreshPermission]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  async function handlePinSubmit() {
    if (pin.length !== 4) return;
    if (pinStage === 'set') {
      setFirstPin(pin);
      setPinValue('');
      setPinStage('confirm');
      return;
    }
    if (pin !== firstPin) {
      setPinError(t('security.pinMismatch'));
      setPinValue('');
      setFirstPin('');
      setPinStage('set');
      return;
    }
    await setPin(pin);
    setPinValue('');
    setFirstPin('');
    setPinStage('idle');
    setPinError(undefined);
    setLockOn(true);
  }

  async function toggleLock(next: boolean) {
    if (next) {
      setPinStage('set');
      setPinValue('');
      setPinError(undefined);
    } else {
      await disableLock();
      setLockOn(false);
      setBiometricOn(false);
      setPinStage('idle');
    }
  }

  async function doExport() {
    setBusy(true);
    try {
      const result = await exportBackup();
      setLastBackup((await backupStats()).lastBackupAt);
      Alert.alert(
        t('backup.title'),
        result.ok ? t('backup.exportSuccess') : t('backup.exportFailed'),
      );
    } finally {
      setBusy(false);
    }
  }

  function doImport() {
    Alert.alert(t('backup.importWarningTitle'), t('backup.importWarningBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('backup.importAction'),
        style: 'destructive',
        onPress: async () => {
          setBusy(true);
          try {
            const result = await importBackup();
            if (result.ok) {
              await reloadPatients();
              await sync();
              Alert.alert(
                t('backup.title'),
                t('backup.importSuccess', {
                  patients: result.patients,
                  reminders: result.reminders,
                }),
              );
            } else if (result.reason !== 'cancelled') {
              Alert.alert(
                t('backup.title'),
                result.reason === 'version'
                  ? t('backup.importVersionMismatch')
                  : t('backup.importFailed'),
              );
            }
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  }

  function confirmDelete(id: string, name: string) {
    const isLast = patients.length === 1;
    Alert.alert(
      t('profile.deletePersonTitle', { name }),
      isLast ? t('profile.deleteLastPersonBody') : t('profile.deletePersonBody'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            await patientRepo.remove(id);
            await reloadPatients();
            await sync();
          },
        },
      ],
    );
  }

  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <Screen>
      <Text variant="display" accessibilityRole="header">
        {t('profile.title')}
      </Text>

      {/* ------------------------------------------------------------ people */}
      <SectionHeading>{t('profile.people')}</SectionHeading>
      {patients.map((patient) => (
        <Card key={patient.id} style={{ marginBottom: theme.spacing.sm }}>
          <Row>
            <Avatar name={patient.name} />
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong">{patient.name}</Text>
              <Text variant="caption" tone="muted">
                {patient.relationship ?? patient.timezone}
              </Text>
            </View>
            <Button
              label={t('common.delete')}
              variant="danger"
              onPress={() => confirmDelete(patient.id, patient.name)}
            />
          </Row>
        </Card>
      ))}
      <Button
        label={t('profile.addPerson')}
        variant="secondary"
        icon="+"
        onPress={() => router.push('/patient/new')}
      />

      {/* ----------------------------------------------------- notifications */}
      <SectionHeading>{t('profile.notificationsStatus')}</SectionHeading>
      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <Text variant="body" style={{ flex: 1 }}>
            {t('profile.notificationsStatus')}
          </Text>
          <StatusPill
            label={permission === 'granted' ? t('profile.notificationsOn') : t('profile.notificationsOff')}
            tone={permission === 'granted' ? 'success' : 'danger'}
          />
        </Row>
        {permission !== 'granted' ? (
          <>
            <Spacer size="md" />
            <Button
              label={t('onboarding.notificationsEnable')}
              onPress={async () => {
                const next = await requestPermission();
                await refreshPermission();
                // Once permanently denied, only the OS settings screen can fix it.
                if (next === 'denied') void Linking.openSettings();
                else await sync();
              }}
            />
          </>
        ) : null}
      </Card>

      {/* Android 14+ does not pre-grant exact alarms, and we deliberately do
          not claim USE_EXACT_ALARM (Google restricts it to alarm-clock and
          calendar apps). So tell the patient how to grant it rather than
          letting their doses quietly drift by several minutes. */}
      {Platform.OS === 'android' ? (
        <>
          <Spacer size="md" />
          <Card>
            <Text variant="bodyStrong">{t('profile.exactAlarms')}</Text>
            <Spacer size="sm" />
            <Text variant="caption" tone="muted">
              {t('profile.exactAlarmsBody')}
            </Text>
            <Spacer size="md" />
            <Button
              label={t('profile.openSystemSettings')}
              variant="secondary"
              onPress={() => void openAlarmSettings()}
            />
          </Card>
        </>
      ) : null}

      {/* ------------------------------------------------------------- learn */}
      <SectionHeading>{t('instructions.title')}</SectionHeading>
      <PressableRow
        onPress={() => router.push('/instructions')}
        accessibilityLabel={t('instructions.linkLabel')}
      >
        <EmojiIcon symbol="💧" size={22} />
        <Text variant="body" style={{ flex: 1 }}>
          {t('instructions.linkLabel')}
        </Text>
        <Text variant="body" tone="muted">
          ›
        </Text>
      </PressableRow>

      {/* ---------------------------------------------------------- language */}
      <SectionHeading>{t('profile.language')}</SectionHeading>
      <Segmented
        value={language}
        onChange={(code) => setLanguage(code as LanguageCode)}
        options={SUPPORTED_LANGUAGES.map((l) => ({ value: l.code, label: l.endonym }))}
      />

      {/* ------------------------------------------------------------ security */}
      <SectionHeading>{t('profile.security')}</SectionHeading>
      <Card>
        <ToggleRow
          label={t('security.title')}
          hint={t('security.description')}
          value={lockOn || pinStage !== 'idle'}
          onChange={toggleLock}
        />

        {pinStage !== 'idle' ? (
          <>
            <Spacer size="md" />
            <Field
              label={pinStage === 'set' ? t('security.setPin') : t('security.confirmPin')}
              error={pinError}
            >
              <TextField
                value={pin}
                onChangeText={(v) => {
                  const digits = v.replace(/\D/g, '').slice(0, 4);
                  setPinValue(digits);
                  if (pinError) setPinError(undefined);
                }}
                keyboardType="number-pad"
                maxLength={4}
                autoFocus
                accessibilityLabel={pinStage === 'set' ? t('security.setPin') : t('security.confirmPin')}
              />
            </Field>
            <Button
              label={t('common.done')}
              disabled={pin.length !== 4}
              onPress={handlePinSubmit}
            />
          </>
        ) : null}

        {lockOn && biometricAvailable ? (
          <ToggleRow
            label={t('security.useBiometric')}
            value={biometricOn}
            onChange={async (next) => {
              await setBiometricEnabled(next);
              setBiometricOn(next);
            }}
          />
        ) : null}
      </Card>

      {/* -------------------------------------------------------------- backup */}
      <SectionHeading>{t('profile.backup')}</SectionHeading>
      <Card>
        <Text variant="caption" tone="muted">
          {t('backup.description')}
        </Text>
        <Spacer size="md" />
        <Text variant="caption" tone="muted">
          {lastBackup
            ? t('backup.lastBackup', { date: new Date(lastBackup).toLocaleDateString() })
            : t('backup.neverBackedUp')}
        </Text>
        <Spacer size="md" />
        <Button label={t('backup.exportAction')} icon="↓" loading={busy} onPress={doExport} />
        <Spacer size="sm" />
        <Button
          label={t('backup.importAction')}
          variant="secondary"
          icon="↑"
          disabled={busy}
          onPress={doImport}
        />
      </Card>

      {/* -------------------------------------------------------------- impact */}
      <Spacer size="xl" />
      <ImpactCard />

      {/* --------------------------------------------------------------- about */}
      <SectionHeading>{t('profile.about')}</SectionHeading>
      <Card>
        <Text variant="bodyStrong">{t('common.appName')}</Text>
        <Text variant="caption" tone="muted">
          {t('common.tagline')}
        </Text>
        <Spacer size="md" />
        <Text variant="caption" tone="muted">
          {t('profile.version', { version })}
        </Text>
        <Spacer size="sm" />
        <Text variant="caption" tone="muted">
          {t('profile.dataNote')}
        </Text>
      </Card>
    </Screen>
  );
}
