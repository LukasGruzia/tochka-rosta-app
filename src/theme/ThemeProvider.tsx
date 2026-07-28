import { createContext, useContext, useEffect, useMemo, type PropsWithChildren } from 'react';
import { LayoutAnimation, Platform, UIManager, useColorScheme } from 'react-native';
import { useAppStore } from '@/store/appStore';
import { darkColors, lightColors, type ThemeColors } from './tokens';
import type { ThemeMode } from '@/types/domain';
import { resolveThemeMode } from './themeMode';

interface ThemeValue {
  mode: ThemeMode;
  resolvedMode: 'dark' | 'light';
  colors: ThemeColors;
  isDark: boolean;
  setMode: (mode: ThemeMode) => Promise<void>;
}

const ThemeContext = createContext<ThemeValue>({
  mode: 'system',
  resolvedMode: 'dark',
  colors: darkColors,
  isDark: true,
  setMode: async () => {},
});

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export function ThemeProvider({ children }: PropsWithChildren) {
  const mode = useAppStore((state) => state.themeMode);
  const setMode = useAppStore((state) => state.setThemeMode);
  const system = useColorScheme();
  const resolvedMode = resolveThemeMode(mode, system);

  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }, [resolvedMode]);

  const value = useMemo<ThemeValue>(
    () => ({
      mode,
      resolvedMode,
      colors: resolvedMode === 'light' ? lightColors : darkColors,
      isDark: resolvedMode === 'dark',
      setMode,
    }),
    [mode, resolvedMode, setMode],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
