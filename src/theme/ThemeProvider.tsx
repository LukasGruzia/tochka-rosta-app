import { createContext, useContext, useEffect, useMemo, useRef, type PropsWithChildren } from 'react';
import { Animated, StyleSheet, useColorScheme } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { useFeatureFlags } from '@/contexts/FeatureFlagsContext';
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

export function ThemeProvider({ children }: PropsWithChildren) {
  const { flags } = useFeatureFlags();
  const mode = useAppStore((state) => state.themeMode);
  const setMode = useAppStore((state) => state.setThemeMode);
  const system = useColorScheme();
  const resolvedMode = resolveThemeMode(mode, system);
  const reducedMotion = useReducedMotion();
  const opacity = useRef(new Animated.Value(1)).current;
  const previousMode = useRef(resolvedMode);

  useEffect(() => {
    if (previousMode.current === resolvedMode) return;
    previousMode.current = resolvedMode;
    if (!flags.enableAnimatedThemeTransition || reducedMotion) {
      opacity.setValue(1);
      return;
    }
    opacity.setValue(0.92);
    const animation = Animated.timing(opacity, { toValue: 1, duration: 260, useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [flags.enableAnimatedThemeTransition, opacity, reducedMotion, resolvedMode]);

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
  return <ThemeContext.Provider value={value}><Animated.View style={[styles.root, { opacity }]}>{children}</Animated.View></ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}

const styles = StyleSheet.create({ root: { flex: 1 } });
