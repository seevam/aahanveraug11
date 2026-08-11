import React from 'react';
import type { ColorValue } from 'react-native';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Text } from '../../src/components/primitives';
import { useTheme } from '../../src/theme/ThemeProvider';

/**
 * Emoji tab icons keep the app icon-library-free, which keeps the bundle small
 * and avoids a native font dependency that Expo Go would have to resolve.
 * Labels are always shown — icon-only tabs are a usability problem for the
 * audience.
 */
function TabIcon({ symbol, color }: { symbol: string; color: ColorValue }) {
  return (
    <Text style={{ fontSize: 22, color }} accessibilityElementsHidden importantForAccessibility="no">
      {symbol}
    </Text>
  );
}

export default function TabsLayout() {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.today'),
          tabBarIcon: ({ color }) => <TabIcon symbol="💧" color={color} />,
        }}
      />
      <Tabs.Screen
        name="reminders"
        options={{
          title: t('tabs.reminders'),
          tabBarIcon: ({ color }) => <TabIcon symbol="⏰" color={color} />,
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: t('tabs.reports'),
          tabBarIcon: ({ color }) => <TabIcon symbol="📊" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ color }) => <TabIcon symbol="👤" color={color} />,
        }}
      />
    </Tabs>
  );
}
