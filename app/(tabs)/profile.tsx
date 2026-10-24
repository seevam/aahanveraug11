import React, { useCallback, useEffect, useState } from 'react';
import { Alert, AppState, Linking, Platform, View } from 'react-native';
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
import {
  batteryOptimised,
  exactAlarmsAllowed,
  hasManufacturerPowerSettings,
  NEEDS_FULL_SCREEN_GRANT,
  openAlarmSettings,
  openAlarmSoundSettings,
  openBatterySettings,
  openFullScreenAlarmSettings,
  openManufacturerPowerSettings,
  requestPermission,
} from '../../src/notifications/service';
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
  const [exactAlarms, setExactAlarms] = useState<boolean | null>(null);
  const [battery, setBattery] = useState<boolean | null>(null);
  const [manufacturerPower, setManufacturerPower] = useState(false);

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
    setExactAlarms(await exactAlarmsAllowed().catch(() => null));
    setBattery(await batteryOptimised().catch(() => null));
    setManufacturerPower(await hasManufacturerPowerSettings().catch(() => false));
    await refreshPermission();
  }, [refreshPermission]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  // The alarm-setup steps send the patient to system settings and back; show
  // the new state as soon as they return, not on the next tab switch.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'active') void load();
    });
    return () => subscription.remove();
  }, [load]);

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

      {/* ------------------------------------------------------ alarm setup
          Everything Android and the phone's manufacturer can do to stop an
          alarm from ringing, as a checklist. None of it can be switched on by
          the app itself; each step opens the exact system screen instead. */}
      {Platform.OS === 'android' ? (
        <>
          <SectionHeading>{t('profile.alarmSetup')}</SectionHeading>

          {/* Without this grant, alarms still fire but may be minutes late:
              see strongestAlarmType in service.ts. We deliberately do not
              claim USE_EXACT_ALARM, which Google reserves for clock apps. */}
          <SetupStep
            title={t('profile.exactAlarms')}
            body={t('profile.exactAlarmsBody')}
            ok={exactAlarms}
            onPress={() => void openAlarmSettings()}
          />

          {/* Android 14+ grants full-screen alarms only to apps the user
              allows, and offers no reliable way to read that back from JS. */}
          {NEEDS_FULL_SCREEN_GRANT ? (
            <SetupStep
              title={t('profile.fullScreenAlarms')}
              body={t('profile.fullScreenAlarmsBody')}
              onPress={() => void openFullScreenAlarmSettings()}
            />
          ) : null}

          <SetupStep
            title={t('profile.alarmSound')}
            body={t('profile.alarmSoundBody')}
            onPress={() => void openAlarmSoundSettings()}
          />

          <SetupStep
            title={t('profile.battery')}
            body={t('profile.batteryBody')}
            ok={battery === null ? null : !battery}
            onPress={() => void openBatterySettings()}
          />

          {manufacturerPower ? (
            <SetupStep
              title={t('profile.autoLaunch')}
              body={t('profile.autoLaunchBody')}
              onPress={() => void openManufacturerPowerSettings()}
            />
          ) : null}

          <Text variant="caption" tone="muted">
            {t('profile.alarmVolumeHint')}
          </Text>
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

/**
 * One alarm-setup step. `ok` shows a status pill where Android lets us read
 * the setting back; null or absent means it cannot be read, so no pill.
 */
function SetupStep({
  title,
  body,
  ok,
  onPress,
}: {
  title: string;
  body: string;
  ok?: boolean | null;
  onPress: () => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  return (
    <Card style={{ marginBottom: theme.spacing.md }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Text variant="bodyStrong" style={{ flex: 1 }}>
          {title}
        </Text>
        {ok === true || ok === false ? (
          <StatusPill
            label={ok ? t('profile.allowed') : t('profile.notAllowed')}
            tone={ok ? 'success' : 'danger'}
          />
        ) : null}
      </Row>
      <Spacer size="sm" />
      <Text variant="caption" tone="muted">
        {body}
      </Text>
      <Spacer size="md" />
      <Button label={t('profile.openSystemSettings')} variant="secondary" onPress={onPress} />
    </Card>
  );
}
