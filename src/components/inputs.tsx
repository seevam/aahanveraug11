import React, { useState } from 'react';
import { Pressable, StyleSheet, Switch, TextInput, View } from 'react-native';

import { useTheme } from '../theme/ThemeProvider';
import { Row, Text } from './primitives';
import { hhmmToMinutes, minutesToHHMM } from '../scheduling/engine';
import type { Weekday } from '../scheduling/types';

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  const theme = useTheme();
  return (
    <View style={{ marginBottom: theme.spacing.lg }}>
      <Text variant="label" style={{ marginBottom: theme.spacing.sm }}>
        {label}
      </Text>
      {children}
      {hint && !error ? (
        <Text variant="caption" tone="muted" style={{ marginTop: theme.spacing.xs }}>
          {hint}
        </Text>
      ) : null}
      {error ? (
        <Text
          variant="caption"
          tone="danger"
          style={{ marginTop: theme.spacing.xs }}
          accessibilityLiveRegion="polite"
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}

export function TextField({
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  autoFocus,
  maxLength,
  accessibilityLabel,
  onBlur,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'number-pad' | 'decimal-pad';
  autoFocus?: boolean;
  maxLength?: number;
  accessibilityLabel?: string;
  onBlur?: () => void;
}) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={theme.colors.textMuted}
      keyboardType={keyboardType}
      autoFocus={autoFocus}
      maxLength={maxLength}
      accessibilityLabel={accessibilityLabel}
      onFocus={() => setFocused(true)}
      onBlur={() => {
        setFocused(false);
        onBlur?.();
      }}
      maxFontSizeMultiplier={1.6}
      style={{
        minHeight: theme.touchTarget.comfortable,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        borderRadius: theme.radius.md,
        borderWidth: focused ? 2 : 1,
        borderColor: focused ? theme.colors.focusRing : theme.colors.border,
        backgroundColor: theme.colors.surface,
        color: theme.colors.text,
        fontSize: theme.typography.body.fontSize,
      }}
    />
  );
}

/** Vertical option list — better than a horizontal segmented control when the
 *  labels are sentences and the font may be scaled up. */
export function OptionList<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Array<{ value: T; label: string; hint?: string }>;
  value: T;
  onChange: (value: T) => void;
}) {
  const theme = useTheme();

  return (
    <View style={{ gap: theme.spacing.sm }}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={option.label}
            accessibilityHint={option.hint}
            style={({ pressed }) => ({
              minHeight: theme.touchTarget.comfortable,
              padding: theme.spacing.lg,
              borderRadius: theme.radius.md,
              borderWidth: selected ? 2 : 1,
              borderColor: selected ? theme.colors.primary : theme.colors.border,
              backgroundColor: selected ? theme.colors.primarySubtle : theme.colors.surface,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Row>
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  borderWidth: 2,
                  borderColor: selected ? theme.colors.primary : theme.colors.borderStrong,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {selected ? (
                  <View
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: theme.colors.primary,
                    }}
                  />
                ) : null}
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong">{option.label}</Text>
                {option.hint ? (
                  <Text variant="caption" tone="muted" style={{ marginTop: 2 }}>
                    {option.hint}
                  </Text>
                ) : null}
              </View>
            </Row>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Horizontal segmented control, for short mutually exclusive labels. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
}) {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: theme.colors.surfaceSunken,
        borderRadius: theme.radius.md,
        padding: 3,
        gap: 3,
      }}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={option.label}
            style={{
              flex: 1,
              minHeight: theme.touchTarget.min - 6,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: theme.radius.sm,
              backgroundColor: selected ? theme.colors.surface : 'transparent',
            }}
          >
            <Text
              variant="label"
              style={{ color: selected ? theme.colors.text : theme.colors.textMuted }}
              numberOfLines={1}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/**
 * Numeric stepper. Typing a number on a phone keypad is error-prone for the
 * audience, so +/- buttons are the primary interaction and the value is a
 * large, readable readout rather than an editable field.
 */
export function Stepper({
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix,
  accessibilityLabel,
}: {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  accessibilityLabel: string;
}) {
  const theme = useTheme();

  const button = (delta: number, symbol: string, hint: string) => {
    const next = value + delta;
    const disabled = next < min || next > max;
    return (
      <Pressable
        onPress={() => onChange(next)}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={hint}
        style={({ pressed }) => ({
          width: theme.touchTarget.comfortable,
          height: theme.touchTarget.comfortable,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: theme.radius.md,
          backgroundColor: theme.colors.surfaceSunken,
          opacity: disabled ? 0.35 : pressed ? 0.7 : 1,
        })}
      >
        <Text variant="heading">{symbol}</Text>
      </Pressable>
    );
  };

  return (
    <Row
      accessible
      accessibilityLabel={`${accessibilityLabel}: ${value}${suffix ? ` ${suffix}` : ''}`}
      style={{
        justifyContent: 'space-between',
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        padding: theme.spacing.sm,
      }}
    >
      {button(-step, '−', `Decrease ${accessibilityLabel}`)}
      <Text variant="subheading">
        {value}
        {suffix ? ` ${suffix}` : ''}
      </Text>
      {button(step, '+', `Increase ${accessibilityLabel}`)}
    </Row>
  );
}

/**
 * Time input as two steppers.
 *
 * A deliberate choice over the platform time picker: the wheel picker is
 * fiddly with imperfect motor control, and this renders identically on iOS and
 * Android, which keeps the create-reminder flow one design instead of two.
 */
export function TimeField({
  minutes,
  onChange,
  accessibilityLabel,
}: {
  minutes: number;
  onChange: (minutes: number) => void;
  accessibilityLabel: string;
}) {
  const theme = useTheme();
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  const adjust = (deltaHours: number, deltaMinutes: number) => {
    const total = (hours + deltaHours) * 60 + (mins + deltaMinutes);
    // Wrap within the day so stepping past midnight is forgiving rather than stuck.
    onChange(((total % 1440) + 1440) % 1440);
  };

  const arrow = (label: string, symbol: string, onPress: () => void) => (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => ({
        width: theme.touchTarget.min,
        height: theme.touchTarget.min,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: theme.radius.sm,
        backgroundColor: theme.colors.surfaceSunken,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Text variant="bodyStrong">{symbol}</Text>
    </Pressable>
  );

  return (
    <View
      accessible={false}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.lg,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        paddingVertical: theme.spacing.md,
      }}
    >
      <View style={{ alignItems: 'center', gap: theme.spacing.xs }}>
        {arrow(`Increase ${accessibilityLabel} hour`, '▲', () => adjust(1, 0))}
        <Text variant="title" accessibilityLabel={`${accessibilityLabel} ${minutesToHHMM(minutes)}`}>
          {String(hours).padStart(2, '0')}
        </Text>
        {arrow(`Decrease ${accessibilityLabel} hour`, '▼', () => adjust(-1, 0))}
      </View>

      <Text variant="title" tone="muted">
        :
      </Text>

      <View style={{ alignItems: 'center', gap: theme.spacing.xs }}>
        {arrow(`Increase ${accessibilityLabel} minute`, '▲', () => adjust(0, 5))}
        <Text variant="title">{String(mins).padStart(2, '0')}</Text>
        {arrow(`Decrease ${accessibilityLabel} minute`, '▼', () => adjust(0, -5))}
      </View>
    </View>
  );
}

export function DayPicker({
  value,
  onChange,
  labels,
}: {
  value: Weekday[];
  onChange: (days: Weekday[]) => void;
  labels: Record<Weekday, string>;
}) {
  const theme = useTheme();
  const order: Weekday[] = [1, 2, 3, 4, 5, 6, 0]; // Monday-first

  return (
    <View style={{ flexDirection: 'row', gap: theme.spacing.xs, justifyContent: 'space-between' }}>
      {order.map((day) => {
        const selected = value.includes(day);
        return (
          <Pressable
            key={day}
            onPress={() =>
              onChange(
                selected ? value.filter((d) => d !== day) : [...value, day].sort((a, b) => a - b),
              )
            }
            accessibilityRole="checkbox"
            accessibilityState={{ checked: selected }}
            accessibilityLabel={labels[day]}
            style={({ pressed }) => ({
              flex: 1,
              minHeight: theme.touchTarget.min,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: theme.radius.sm,
              borderWidth: selected ? 0 : 1,
              borderColor: theme.colors.border,
              backgroundColor: selected ? theme.colors.primary : theme.colors.surface,
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Text
              variant="caption"
              numberOfLines={1}
              style={{
                color: selected ? theme.colors.onPrimary : theme.colors.textSecondary,
                fontWeight: '600',
              }}
            >
              {labels[day]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function ToggleRow({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  hint?: string;
}) {
  const theme = useTheme();
  return (
    <Row
      style={{
        minHeight: theme.touchTarget.comfortable,
        justifyContent: 'space-between',
        paddingVertical: theme.spacing.sm,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text variant="body">{label}</Text>
        {hint ? (
          <Text variant="caption" tone="muted">
            {hint}
          </Text>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        accessibilityLabel={label}
        trackColor={{ true: theme.colors.primary, false: theme.colors.borderStrong }}
      />
    </Row>
  );
}

/** Editable list of specific times, used by the "at specific times" mode. */
export function TimeList({
  minutes,
  onChange,
  addLabel,
  removeLabel,
}: {
  minutes: number[];
  onChange: (minutes: number[]) => void;
  addLabel: string;
  removeLabel: string;
}) {
  const theme = useTheme();

  return (
    <View style={{ gap: theme.spacing.sm }}>
      {minutes.map((minute, index) => (
        <Row key={`${minute}-${index}`}>
          <View style={{ flex: 1 }}>
            <TimeField
              minutes={minute}
              accessibilityLabel={`Time ${index + 1}`}
              onChange={(next) => {
                const copy = [...minutes];
                copy[index] = next;
                onChange(copy);
              }}
            />
          </View>
          <Pressable
            onPress={() => onChange(minutes.filter((_, i) => i !== index))}
            accessibilityRole="button"
            accessibilityLabel={`${removeLabel} ${minutesToHHMM(minute)}`}
            style={{
              width: theme.touchTarget.min,
              height: theme.touchTarget.min,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: theme.radius.sm,
              backgroundColor: theme.colors.dangerSubtle,
            }}
          >
            <Text style={{ color: theme.colors.onDangerSubtle, fontSize: 20 }}>✕</Text>
          </Pressable>
        </Row>
      ))}

      <Pressable
        onPress={() => {
          const last = minutes[minutes.length - 1] ?? hhmmToMinutes('08:00');
          onChange([...minutes, Math.min(1439, last + 60)]);
        }}
        accessibilityRole="button"
        accessibilityLabel={addLabel}
        style={({ pressed }) => ({
          minHeight: theme.touchTarget.min,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: theme.radius.md,
          borderWidth: 1,
          borderStyle: 'dashed',
          borderColor: theme.colors.borderStrong,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Text variant="label" tone="primary">
          + {addLabel}
        </Text>
      </Pressable>
    </View>
  );
}

export const inputStyles = StyleSheet.create({
  hairline: { height: StyleSheet.hairlineWidth },
});
