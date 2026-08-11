import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useTheme } from '../theme/ThemeProvider';
import { Card, Row, Text } from './primitives';
import { Button, StatusPill } from './Button';
import { minutesToHHMM } from '../scheduling/engine';
import { utcToLocalMinute } from '../scheduling/timezone';
import { DEFAULT_GAP_MINUTES } from '../scheduling/types';
import type { Dose } from '../db/repositories';
import type { DoseStatus } from '../scheduling/adherence';

const STATUS_TONE: Record<DoseStatus, 'success' | 'warning' | 'danger' | 'neutral'> = {
  taken: 'success',
  snoozed: 'warning',
  skipped: 'neutral',
  missed: 'danger',
  pending: 'neutral',
};

/** Icon alongside every status, so colour is never the only signal. */
const STATUS_ICON: Record<DoseStatus, string> = {
  taken: '✓',
  snoozed: '⏱',
  skipped: '⤼',
  missed: '!',
  pending: '•',
};

export function DoseCard({
  dose,
  timezone,
  onTaken,
  onSnooze,
  onSkip,
  onUndo,
}: {
  dose: Dose;
  timezone: string;
  onTaken?: () => void;
  onSnooze?: () => void;
  onSkip?: () => void;
  onUndo?: () => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation();

  const time = minutesToHHMM(utcToLocalMinute(dose.scheduledAt, timezone));
  const actionable = dose.status === 'pending' || dose.status === 'snoozed';
  const eyeLabel = t(`eye.${dose.eye}`);
  const statusLabel = t(`status.${dose.status}`);

  return (
    <Card
      style={{
        marginBottom: theme.spacing.md,
        borderLeftWidth: 4,
        borderLeftColor:
          dose.status === 'taken'
            ? theme.colors.success
            : dose.status === 'missed'
              ? theme.colors.danger
              : dose.status === 'snoozed'
                ? theme.colors.warning
                : theme.colors.primary,
      }}
      accessible={false}
    >
      <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <Text variant="heading" accessibilityRole="header">
            {time}
          </Text>
          <Text variant="bodyStrong" style={{ marginTop: 2 }}>
            {dose.medicationName}
          </Text>
          <Text variant="body" tone="secondary">
            {dose.dosage} · {eyeLabel}
          </Text>
        </View>
        <StatusPill
          label={`${STATUS_ICON[dose.status]} ${statusLabel}`}
          tone={STATUS_TONE[dose.status]}
        />
      </Row>

      {dose.shiftedBy > 0 ? (
        <Text variant="caption" tone="muted" style={{ marginTop: theme.spacing.sm }}>
          {t('today.movedFor', { time, minutes: DEFAULT_GAP_MINUTES })}
        </Text>
      ) : null}

      {actionable ? (
        <View style={{ marginTop: theme.spacing.lg, gap: theme.spacing.sm }}>
          <Button
            label={t('today.markTaken')}
            variant="success"
            size="large"
            icon="✓"
            onPress={onTaken}
            accessibilityHint={`${dose.medicationName}, ${time}`}
          />
          <Row style={{ gap: theme.spacing.sm }}>
            <Button
              label={t('today.snooze')}
              variant="secondary"
              onPress={onSnooze}
              style={{ flex: 1 }}
            />
            <Button
              label={t('today.skipDose')}
              variant="secondary"
              onPress={onSkip}
              style={{ flex: 1 }}
            />
          </Row>
        </View>
      ) : dose.status !== 'missed' && onUndo ? (
        <View style={{ marginTop: theme.spacing.md, alignItems: 'flex-start' }}>
          <Button label={t('today.undo')} variant="ghost" onPress={onUndo} />
        </View>
      ) : null}
    </Card>
  );
}
