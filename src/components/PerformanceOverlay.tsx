import { useSyncExternalStore } from 'react';
import { StyleSheet, View } from 'react-native';

import { useFeatureFlags } from '@/contexts/FeatureFlagsContext';
import { getPerformanceSnapshot, subscribePerformance } from '@/performance/performanceLogger';
import { useTheme } from '@/theme/ThemeProvider';

import { AppText } from './AppText';

export function PerformanceOverlay() {
  const { flags } = useFeatureFlags();
  if (!__DEV__ || !flags.enableDebugPerformanceOverlay) return null;
  return <ActivePerformanceOverlay />;
}

function ActivePerformanceOverlay() {
  const { colors } = useTheme();
  const snapshot = useSyncExternalStore(subscribePerformance, getPerformanceSnapshot, getPerformanceSnapshot);
  return (
    <View pointerEvents="none" style={[styles.root, { backgroundColor: colors.surfaceSolid, borderColor: colors.glassBorderStrong }]}>
      <AppText variant="caption">{snapshot.activeRoute}</AppText>
      <AppText variant="caption" tone="green">anim {snapshot.activeAnimations} · list {snapshot.currentListSize}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    zIndex: 1000,
    top: 54,
    right: 8,
    maxWidth: 190,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    opacity: 0.9,
  },
});
