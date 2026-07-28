import type { PerformanceCapabilities } from './performance';

export interface FeatureFlags {
  enableLiquidTabAnimation: boolean;
  enableLiquidTabDrag: boolean;
  enableAdvancedGlassBlur: boolean;
  enableFlowFlameIdleAnimation: boolean;
  enableFlowFlameSuccessAnimation: boolean;
  enableAnimatedThemeTransition: boolean;
  enableFloatingHeaders: boolean;
  enableAnimatedCharts: boolean;
  enableBackgroundGlowAnimation: boolean;
  enableCardEntryAnimations: boolean;
  enableHaptics: boolean;
  enableDebugPerformanceOverlay: boolean;
  enableSheetGestures: boolean;
}

export const defaultFeatureFlags: FeatureFlags = {
  enableLiquidTabAnimation: true,
  enableLiquidTabDrag: false,
  enableAdvancedGlassBlur: true,
  enableFlowFlameIdleAnimation: true,
  enableFlowFlameSuccessAnimation: true,
  enableAnimatedThemeTransition: true,
  enableFloatingHeaders: false,
  enableAnimatedCharts: true,
  enableBackgroundGlowAnimation: false,
  enableCardEntryAnimations: false,
  enableHaptics: true,
  enableDebugPerformanceOverlay: false,
  enableSheetGestures: false,
};

export const safeModeFeatureFlags: FeatureFlags = {
  enableLiquidTabAnimation: false,
  enableLiquidTabDrag: false,
  enableAdvancedGlassBlur: false,
  enableFlowFlameIdleAnimation: false,
  enableFlowFlameSuccessAnimation: false,
  enableAnimatedThemeTransition: false,
  enableFloatingHeaders: false,
  enableAnimatedCharts: false,
  enableBackgroundGlowAnimation: false,
  enableCardEntryAnimations: false,
  enableHaptics: false,
  enableDebugPerformanceOverlay: false,
  enableSheetGestures: false,
};

export function resolveFeatureFlags(flags: FeatureFlags, safeMode: boolean): FeatureFlags {
  return safeMode ? safeModeFeatureFlags : flags;
}

export function resolveFeatureFlagsForPerformance(flags: FeatureFlags, capabilities: PerformanceCapabilities): FeatureFlags {
  if (capabilities.resolvedMode === 'safe') return safeModeFeatureFlags;
  const reduced = capabilities.resolvedMode === 'reduced';
  return {
    ...flags,
    enableLiquidTabAnimation: reduced ? false : flags.enableLiquidTabAnimation,
    enableLiquidTabDrag: capabilities.dragNavigation && flags.enableLiquidTabDrag,
    enableAdvancedGlassBlur: capabilities.nativeBlur && flags.enableAdvancedGlassBlur,
    enableFlowFlameIdleAnimation: capabilities.idleAnimations && flags.enableFlowFlameIdleAnimation,
    enableFlowFlameSuccessAnimation: !reduced && flags.enableFlowFlameSuccessAnimation,
    enableAnimatedThemeTransition: capabilities.transitionAnimations && flags.enableAnimatedThemeTransition,
    enableAnimatedCharts: reduced ? false : flags.enableAnimatedCharts,
    enableBackgroundGlowAnimation: capabilities.idleAnimations && flags.enableBackgroundGlowAnimation,
    enableCardEntryAnimations: reduced ? false : flags.enableCardEntryAnimations,
    enableHaptics: reduced ? false : flags.enableHaptics,
    enableSheetGestures: capabilities.dragNavigation && flags.enableSheetGestures,
  };
}

export const featureFlagNames = Object.keys(defaultFeatureFlags) as (keyof FeatureFlags)[];
