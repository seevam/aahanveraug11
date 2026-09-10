import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useTheme } from '../theme/ThemeProvider';
import { capColours } from '../theme/tokens';
import { capColourFor } from '../medications/catalogue';
import { Text } from './primitives';

/**
 * The bottle-cap colour for a medication, shown as a small ring.
 *
 * Never rendered alone: callers always show the medication name alongside, and
 * the accessible label spells the colour out in words, because the whole point
 * is helping someone who cannot easily read the label — which includes people
 * who cannot distinguish the colours either.
 *
 * Renders nothing when the medication has no established cap convention, which
 * is deliberately the case for lubricants, anti-allergy drops, antivirals and
 * newer molecules.
 */
export function CapSwatch({
  medicationId,
  size = 14,
  showLabel = false,
}: {
  medicationId: string | null | undefined;
  size?: number;
  showLabel?: boolean;
}) {
  const theme = useTheme();
  const { t } = useTranslation();

  const colour = capColourFor(medicationId);
  if (!colour) return null;

  const label = t(`capColour.${colour}`);

  return (
    <View
      style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs }}
      accessible
      accessibilityLabel={t('capColour.describedAs', { colour: label })}
    >
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: capColours[colour],
          borderWidth: 1,
          borderColor: theme.colors.borderStrong,
        }}
      />
      {showLabel ? (
        <Text variant="caption" tone="muted">
          {label}
        </Text>
      ) : null}
    </View>
  );
}
