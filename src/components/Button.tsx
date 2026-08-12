import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '../theme/ThemeProvider';
import { EmojiIcon, Text } from './primitives';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'success' | 'danger';
export type ButtonSize = 'regular' | 'large';

/**
 * Every button clears the 48dp minimum target, and `large` reaches 64dp for
 * the dose actions — those get pressed in a hurry, sometimes one-handed with
 * a bottle in the other hand.
 */
export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'regular',
  disabled = false,
  loading = false,
  icon,
  style,
  accessibilityHint,
}: {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
}) {
  const theme = useTheme();
  const isDisabled = disabled || loading;

  const surfaces: Record<ButtonVariant, { bg: string; fg: string; border: string }> = {
    primary: {
      bg: theme.colors.primary,
      fg: theme.colors.onPrimary,
      border: theme.colors.primary,
    },
    secondary: {
      bg: theme.colors.surface,
      fg: theme.colors.text,
      border: theme.colors.borderStrong,
    },
    ghost: { bg: 'transparent', fg: theme.colors.primary, border: 'transparent' },
    success: { bg: theme.colors.success, fg: theme.colors.textInverse, border: theme.colors.success },
    danger: { bg: theme.colors.dangerSubtle, fg: theme.colors.onDangerSubtle, border: theme.colors.dangerSubtle },
  };

  const surface = surfaces[variant];
  const height = size === 'large' ? theme.touchTarget.primary : theme.touchTarget.min;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }) => [
        {
          minHeight: height,
          paddingHorizontal: theme.spacing.xl,
          borderRadius: theme.radius.md,
          backgroundColor: surface.bg,
          borderWidth: variant === 'secondary' ? 1 : 0,
          borderColor: surface.border,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: theme.spacing.sm,
          opacity: isDisabled ? 0.45 : pressed ? 0.82 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={surface.fg} />
      ) : (
        <>
          {icon ? (
            <EmojiIcon symbol={icon} size={18} color={surface.fg} />
          ) : null}
          <Text
            variant={size === 'large' ? 'subheading' : 'bodyStrong'}
            style={{ color: surface.fg, textAlign: 'center' }}
          >
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

/** A pressable row used for list items and settings entries. */
export function PressableRow({
  onPress,
  children,
  accessibilityLabel,
  accessibilityHint,
  style,
}: {
  onPress?: () => void;
  children: React.ReactNode;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [
        {
          minHeight: theme.touchTarget.comfortable,
          paddingVertical: theme.spacing.md,
          paddingHorizontal: theme.spacing.lg,
          backgroundColor: pressed ? theme.colors.surfaceSunken : theme.colors.surface,
          borderRadius: theme.radius.md,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: theme.colors.border,
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.spacing.md,
        },
        style,
      ]}
    >
      {children}
    </Pressable>
  );
}

export function Chip({
  label,
  selected,
  onPress,
  accessibilityLabel,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected }}
      style={({ pressed }) => ({
        minHeight: theme.touchTarget.min,
        minWidth: theme.touchTarget.min,
        paddingHorizontal: theme.spacing.lg,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: theme.radius.pill,
        backgroundColor: selected ? theme.colors.primary : theme.colors.surface,
        borderWidth: 1,
        borderColor: selected ? theme.colors.primary : theme.colors.border,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <Text
        variant="label"
        style={{ color: selected ? theme.colors.onPrimary : theme.colors.textSecondary }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/** Status badge. Colour is never the only signal — the label carries the meaning. */
export function StatusPill({ label, tone }: { label: string; tone: 'success' | 'warning' | 'danger' | 'neutral' }) {
  const theme = useTheme();

  const tones = {
    success: { bg: theme.colors.successSubtle, fg: theme.colors.onSuccessSubtle },
    warning: { bg: theme.colors.warningSubtle, fg: theme.colors.onWarningSubtle },
    danger: { bg: theme.colors.dangerSubtle, fg: theme.colors.onDangerSubtle },
    neutral: { bg: theme.colors.surfaceSunken, fg: theme.colors.textSecondary },
  } as const;

  const t = tones[tone];

  return (
    <View
      style={{
        backgroundColor: t.bg,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.radius.pill,
      }}
    >
      <Text variant="caption" style={{ color: t.fg, fontWeight: '600' }}>
        {label}
      </Text>
    </View>
  );
}
