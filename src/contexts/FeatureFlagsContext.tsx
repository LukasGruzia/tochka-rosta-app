import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { Platform } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { defaultFeatureFlags, resolveFeatureFlagsForPerformance, type FeatureFlags } from '@/config/features';
import { resolvePerformanceCapabilities, type PerformanceMode } from '@/config/performance';
import { useAppActivity } from '@/performance/memoryEvents';
import { setPerformanceMetric } from '@/performance/performanceLogger';
import { clearUiDiagnostics, recordUiAction } from '@/services/uiDiagnostics';
import { useAppStore } from '@/store/appStore';

interface FeatureFlagsValue {
  flags: FeatureFlags;
  configuredFlags: FeatureFlags;
  safeMode: boolean;
  performanceMode: PerformanceMode;
  resolvedPerformanceMode: Exclude<PerformanceMode, 'automatic'>;
  isAppActive: boolean;
  setPerformanceMode: (mode: PerformanceMode) => Promise<void>;
  setFlag: (name: keyof FeatureFlags, value: boolean) => void;
  setSafeMode: (enabled: boolean) => void;
  resetUiSettings: () => void;
}

const FeatureFlagsContext = createContext<FeatureFlagsValue>({
  flags: defaultFeatureFlags,
  configuredFlags: defaultFeatureFlags,
  safeMode: false,
  performanceMode: 'automatic',
  resolvedPerformanceMode: 'balanced',
  isAppActive: true,
  setPerformanceMode: async () => {},
  setFlag: () => {},
  setSafeMode: () => {},
  resetUiSettings: () => {},
});

export function FeatureFlagsProvider({ children }: PropsWithChildren) {
  const [configuredFlags, setConfiguredFlags] = useState(defaultFeatureFlags);
  const [safeMode, updateSafeMode] = useState(false);
  const performanceMode = useAppStore((state) => state.performanceMode);
  const setPerformanceMode = useAppStore((state) => state.setPerformanceMode);
  const reducedMotion = useReducedMotion();
  const { isAppActive } = useAppActivity();
  const setFlag = useCallback((name: keyof FeatureFlags, value: boolean) => {
    if (typeof __DEV__ !== 'undefined' && !__DEV__) return;
    setConfiguredFlags((current) => ({ ...current, [name]: value }));
    recordUiAction('button_pressed', `feature:${name}`, String(value));
  }, []);
  const setSafeMode = useCallback((enabled: boolean) => {
    updateSafeMode(enabled);
    recordUiAction('button_pressed', 'safe_mode', String(enabled));
  }, []);
  const resetUiSettings = useCallback(() => {
    if (typeof __DEV__ !== 'undefined' && !__DEV__) return;
    setConfiguredFlags(defaultFeatureFlags);
    updateSafeMode(false);
    clearUiDiagnostics();
  }, []);
  const capabilities = useMemo(() => resolvePerformanceCapabilities(safeMode ? 'safe' : performanceMode, { platform: Platform.OS, reducedMotion, appActive: isAppActive }), [isAppActive, performanceMode, reducedMotion, safeMode]);
  const flags = useMemo(() => resolveFeatureFlagsForPerformance(configuredFlags, capabilities), [capabilities, configuredFlags]);
  useEffect(() => { setPerformanceMetric('activeFlags', Object.entries(flags).filter(([, enabled]) => enabled).map(([name]) => name)); }, [flags]);
  const value = useMemo(
    () => ({
      flags,
      configuredFlags,
      safeMode,
      performanceMode,
      resolvedPerformanceMode: capabilities.resolvedMode,
      isAppActive,
      setPerformanceMode,
      setFlag,
      setSafeMode,
      resetUiSettings,
    }),
    [
      capabilities.resolvedMode,
      configuredFlags,
      flags,
      isAppActive,
      performanceMode,
      resetUiSettings,
      safeMode,
      setFlag,
      setPerformanceMode,
      setSafeMode,
    ],
  );
  return <FeatureFlagsContext.Provider value={value}>{children}</FeatureFlagsContext.Provider>;
}

export function useFeatureFlags() {
  return useContext(FeatureFlagsContext);
}
