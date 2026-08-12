import React from 'react';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmojiIcon } from '../../src/components/primitives';
import { useTheme } from '../../src/theme/ThemeProvider';

const ICON_SIZE = 24;

export default function TabsLayout() {
  const theme = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  // The bar has to fit an icon, its label, and the home indicator on phones
  // that have one. A fixed height ignores the inset and crops the icons, so
  // derive it instead.
  const barHeight = 58 + insets.bottom;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          height: barHeight,
          paddingTop: 6,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
        },
        tabBarIconStyle: {
          // Give the glyph a box at least as tall as its line height, so it is
          // centred rather than clipped.
          height: Math.ceil(ICON_SIZE * 1.35),
          width: Math.ceil(ICON_SIZE * 1.35),
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.today'),
          tabBarIcon: ({ color }) => <EmojiIcon symbol="💧" size={ICON_SIZE} color={color} />,
        }}
      />
      <Tabs.Screen
        name="reminders"
        options={{
          title: t('tabs.reminders'),
          tabBarIcon: ({ color }) => <EmojiIcon symbol="⏰" size={ICON_SIZE} color={color} />,
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: t('tabs.reports'),
          tabBarIcon: ({ color }) => <EmojiIcon symbol="📊" size={ICON_SIZE} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ color }) => <EmojiIcon symbol="👤" size={ICON_SIZE} color={color} />,
        }}
      />
    </Tabs>
  );
}
