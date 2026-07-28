import { useIsFocused } from '@react-navigation/native';
import { useReducedMotion } from 'react-native-reanimated';
import { useFeatureFlags } from '@/contexts/FeatureFlagsContext';

export function useScreenActivity() {
  const isFocused = useIsFocused();
  const reducedMotion = useReducedMotion();
  const { isAppActive, resolvedPerformanceMode } = useFeatureFlags();
  return {
    isFocused,
    isAppActive,
    reducedMotion,
    performanceMode: resolvedPerformanceMode,
    canAnimate:
      isFocused &&
      isAppActive &&
      !reducedMotion &&
      resolvedPerformanceMode !== 'reduced' &&
      resolvedPerformanceMode !== 'safe',
  };
}
