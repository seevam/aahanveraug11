import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';

import {
  darkColors,
  elevation,
  lightColors,
  radius,
  spacing,
  touchTarget,
  typography,
  type ColorScheme,
} from './tokens';

export type Theme = {
  colors: ColorScheme;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
  touchTarget: typeof touchTarget;
  elevation: typeof elevation;
  isDark: boolean;
};

const ThemeContext = createContext<Theme | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const value = useMemo<Theme>(
    () => ({
      colors: isDark ? darkColors : lightColors,
      spacing,
      radius,
      typography,
      touchTarget,
      elevation,
      isDark,
    }),
    [isDark],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const theme = useContext(ThemeContext);
  if (!theme) {
    throw new Error('useTheme must be used inside a ThemeProvider');
  }
  return theme;
}
