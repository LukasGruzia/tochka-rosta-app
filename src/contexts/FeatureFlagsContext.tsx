import { createContext, useCallback, useContext, useMemo, useState, type PropsWithChildren } from 'react';
import { defaultFeatureFlags, resolveFeatureFlags, type FeatureFlags } from '@/config/features';
import { clearUiDiagnostics, recordUiAction } from '@/services/uiDiagnostics';

interface FeatureFlagsValue {
  flags: FeatureFlags;
  configuredFlags: FeatureFlags;
  safeMode: boolean;
  setFlag: (name: keyof FeatureFlags, value: boolean) => void;
  setSafeMode: (enabled: boolean) => void;
  resetUiSettings: () => void;
}

const FeatureFlagsContext = createContext<FeatureFlagsValue>({
  flags: defaultFeatureFlags,
  configuredFlags: defaultFeatureFlags,
  safeMode: false,
  setFlag: () => {},
  setSafeMode: () => {},
  resetUiSettings: () => {},
});

export function FeatureFlagsProvider({ children }: PropsWithChildren) {
  const [configuredFlags, setConfiguredFlags] = useState(defaultFeatureFlags);
  const [safeMode, updateSafeMode] = useState(false);
  const setFlag = useCallback((name: keyof FeatureFlags, value: boolean) => {
    if (typeof __DEV__ !== 'undefined' && !__DEV__) return;
    setConfiguredFlags((current) => ({ ...current, [name]: value }));
    recordUiAction('button_pressed', `feature:${name}`, String(value));
  }, []);
  const setSafeMode = useCallback((enabled: boolean) => {
    if (typeof __DEV__ !== 'undefined' && !__DEV__) return;
    updateSafeMode(enabled);
    recordUiAction('button_pressed', 'safe_mode', String(enabled));
  }, []);
  const resetUiSettings = useCallback(() => {
    if (typeof __DEV__ !== 'undefined' && !__DEV__) return;
    setConfiguredFlags(defaultFeatureFlags);
    updateSafeMode(false);
    clearUiDiagnostics();
  }, []);
  const flags = useMemo(() => resolveFeatureFlags(configuredFlags, safeMode), [configuredFlags, safeMode]);
  const value = useMemo(() => ({ flags, configuredFlags, safeMode, setFlag, setSafeMode, resetUiSettings }), [configuredFlags, flags, resetUiSettings, safeMode, setFlag, setSafeMode]);
  return <FeatureFlagsContext.Provider value={value}>{children}</FeatureFlagsContext.Provider>;
}

export function useFeatureFlags() {
  return useContext(FeatureFlagsContext);
}
