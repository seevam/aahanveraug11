import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Card, Row, Spacer, Text } from './primitives';
import { Button } from './Button';
import { useTheme } from '../theme/ThemeProvider';
import {
  getAlarmVolume,
  setAlarmVolume,
  startTestTone,
  stopTestTone,
  type AlarmVolume,
} from '../../modules/alarm-audio';

/** The test tone loops so the volume can be adjusted while listening; this caps it. */
const TEST_TONE_MAX_MS = 20_000;

/**
 * Controls the phone's alarm volume — the one both this app's alarms and the
 * Clock app's ring at, and the one the ringer and media buttons do not touch.
 *
 * Steps rather than a slider: two large buttons and a bar that shows the
 * level at a glance are easier to hit and to read than a thumb on a track.
 *
 * Renders nothing where the volume cannot be read (iOS, Expo Go).
 */
export function AlarmVolumeCard({ onVolumeChange }: { onVolumeChange?: (v: AlarmVolume) => void }) {
  const theme = useTheme();
  const { t } = useTranslation();

  const [volume, setVolume] = useState<AlarmVolume | null>(() => getAlarmVolume());
  const [testing, setTesting] = useState(false);
  const stopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = useCallback(() => {
    const next = getAlarmVolume();
    setVolume((prev) =>
      prev && next && prev.current === next.current && prev.max === next.max ? prev : next,
    );
    if (next) onVolumeChange?.(next);
  }, [onVolumeChange]);

  const stopTest = useCallback(() => {
    if (stopTimer.current) clearTimeout(stopTimer.current);
    stopTimer.current = null;
    stopTestTone();
    setTesting(false);
  }, []);

  // The volume buttons change this stream while the test tone plays, and other
  // apps change it at any time, so poll while the card is on screen.
  useEffect(() => {
    const poll = setInterval(refresh, 700);
    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'active') refresh();
      else stopTest();
    });
    return () => {
      clearInterval(poll);
      subscription.remove();
      stopTest();
    };
  }, [refresh, stopTest]);

  useFocusEffect(
    useCallback(() => {
      refresh();
      return stopTest;
    }, [refresh, stopTest]),
  );

  if (!volume) return null;

  const { current, min, max } = volume;
  const levels = Math.max(1, max - min);
  const filled = Math.max(0, current - min);

  function change(delta: number) {
    const applied = setAlarmVolume(Math.min(max, Math.max(min, current + delta)));
    if (applied !== null) setVolume({ ...volume!, current: applied });
    refresh();
  }

  function toggleTest() {
    if (testing) {
      stopTest();
      return;
    }
    if (!startTestTone()) return;
    setTesting(true);
    stopTimer.current = setTimeout(stopTest, TEST_TONE_MAX_MS);
  }

  const silent = current <= 0;

  return (
    <Card
      style={
        silent
          ? { backgroundColor: theme.colors.warningSubtle, borderColor: theme.colors.warning }
          : undefined
      }
    >
      <Text variant="bodyStrong" style={silent ? { color: theme.colors.onWarningSubtle } : undefined}>
        {t('volume.title')}
      </Text>
      <Spacer size="sm" />
      <Text variant="caption" tone={silent ? undefined : 'muted'} style={silent ? { color: theme.colors.onWarningSubtle } : undefined}>
        {silent ? t('volume.silentWarning') : t('volume.body')}
      </Text>
      <Spacer size="md" />

      <Row style={{ gap: theme.spacing.md }}>
        <Button
          label="−"
          variant="secondary"
          size="large"
          disabled={current <= min}
          onPress={() => change(-1)}
          accessibilityLabel={t('volume.quieter')}
          style={{ minWidth: 64 }}
        />

        <View
          style={{ flex: 1, flexDirection: 'row', gap: 3, height: 28 }}
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel={t('volume.title')}
          accessibilityValue={{ min: 0, max: levels, now: filled }}
        >
          {Array.from({ length: levels }, (_, i) => (
            <View
              key={i}
              style={{
                flex: 1,
                borderRadius: 4,
                backgroundColor: i < filled ? theme.colors.primary : theme.colors.border,
              }}
            />
          ))}
        </View>

        <Button
          label="+"
          variant="secondary"
          size="large"
          disabled={current >= max}
          onPress={() => change(1)}
          accessibilityLabel={t('volume.louder')}
          style={{ minWidth: 64 }}
        />
      </Row>

      <Spacer size="sm" />
      <Text variant="caption" tone="muted" style={{ textAlign: 'center' }}>
        {t('volume.level', { current: filled, max: levels })}
      </Text>

      <Spacer size="md" />
      <Button
        label={testing ? t('volume.stopTest') : t('volume.test')}
        variant={testing ? 'danger' : 'secondary'}
        icon={testing ? '■' : '▶'}
        onPress={toggleTest}
      />
    </Card>
  );
}
