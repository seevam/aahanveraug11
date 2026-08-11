import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text as RNText,
  View,
  type StyleProp,
  type TextProps,
  type TextStyle,
  type ViewProps,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '../theme/ThemeProvider';
import type { TypographyVariant } from '../theme/tokens';

type ToneName = 'default' | 'secondary' | 'muted' | 'primary' | 'success' | 'warning' | 'danger' | 'inverse';

export function Text({
  variant = 'body',
  tone = 'default',
  style,
  ...rest
}: TextProps & { variant?: TypographyVariant; tone?: ToneName }) {
  const theme = useTheme();

  const toneColor: Record<ToneName, string> = {
    default: theme.colors.text,
    secondary: theme.colors.textSecondary,
    muted: theme.colors.textMuted,
    primary: theme.colors.primary,
    success: theme.colors.success,
    warning: theme.colors.warning,
    danger: theme.colors.danger,
    inverse: theme.colors.textInverse,
  };

  const typeStyle = theme.typography[variant];

  return (
    <RNText
      // Respect the OS font-size setting, but stop runaway scaling from
      // breaking layouts the patient then cannot use at all.
      maxFontSizeMultiplier={1.6}
      style={[
        {
          fontSize: typeStyle.fontSize,
          lineHeight: typeStyle.lineHeight,
          fontWeight: typeStyle.fontWeight as TextStyle['fontWeight'],
          color: toneColor[tone],
        },
        style,
      ]}
      {...rest}
    />
  );
}

export function Screen({
  children,
  scroll = true,
  contentStyle,
  edges = ['top'],
}: {
  children: React.ReactNode;
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  edges?: Array<'top' | 'bottom' | 'left' | 'right'>;
}) {
  const theme = useTheme();
  const padding = { padding: theme.spacing.lg, paddingBottom: theme.spacing.xxxl };

  if (!scroll) {
    return (
      <SafeAreaView style={[styles.flex, { backgroundColor: theme.colors.background }]} edges={edges}>
        <View style={[styles.flex, padding, contentStyle]}>{children}</View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: theme.colors.background }]} edges={edges}>
      <ScrollView
        contentContainerStyle={[padding, contentStyle]}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function Card({ children, style, ...rest }: ViewProps) {
  const theme = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.lg,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: theme.colors.border,
          padding: theme.spacing.lg,
        },
        theme.elevation.card,
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

export function Row({ children, style, gap, ...rest }: ViewProps & { gap?: number }) {
  const theme = useTheme();
  return (
    <View
      style={[{ flexDirection: 'row', alignItems: 'center', gap: gap ?? theme.spacing.md }, style]}
      {...rest}
    >
      {children}
    </View>
  );
}

export function Spacer({ size = 'lg' }: { size?: keyof ReturnType<typeof useTheme>['spacing'] }) {
  const theme = useTheme();
  return <View style={{ height: theme.spacing[size] }} />;
}

export function Divider() {
  const theme = useTheme();
  return (
    <View
      style={{
        height: StyleSheet.hairlineWidth,
        backgroundColor: theme.colors.border,
        marginVertical: theme.spacing.md,
      }}
    />
  );
}

export function SectionHeading({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <Text
      variant="label"
      tone="muted"
      accessibilityRole="header"
      style={{
        textTransform: 'uppercase',
        letterSpacing: 0.6,
        marginBottom: theme.spacing.sm,
        marginTop: theme.spacing.lg,
      }}
    >
      {children}
    </Text>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: string;
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  const theme = useTheme();
  return (
    <View style={{ alignItems: 'center', paddingVertical: theme.spacing.xxl }}>
      <Text
        style={{ fontSize: 48, lineHeight: 56, marginBottom: theme.spacing.md }}
        accessibilityElementsHidden
        importantForAccessibility="no"
      >
        {icon}
      </Text>
      <Text variant="heading" style={{ textAlign: 'center' }}>
        {title}
      </Text>
      <Text
        variant="body"
        tone="secondary"
        style={{ textAlign: 'center', marginTop: theme.spacing.sm }}
      >
        {body}
      </Text>
      {action ? <View style={{ marginTop: theme.spacing.xl }}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
