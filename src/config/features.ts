export interface FeatureFlags {
  enableLiquidTabAnimation: boolean;
  enableLiquidTabDrag: boolean;
  enableFlowFlameAnimation: boolean;
  enableFloatingHeaders: boolean;
  enableAnimatedThemeTransition: boolean;
  enableAdvancedGlassBlur: boolean;
  enableSheetGestures: boolean;
}

export const defaultFeatureFlags: FeatureFlags = {
  enableLiquidTabAnimation: true,
  // Drag stays opt-in until it passes the physical-device stress test.
  enableLiquidTabDrag: false,
  enableFlowFlameAnimation: true,
  enableFloatingHeaders: false,
  enableAnimatedThemeTransition: false,
  enableAdvancedGlassBlur: true,
  enableSheetGestures: false,
};

export const safeModeFeatureFlags: FeatureFlags = {
  enableLiquidTabAnimation: false,
  enableLiquidTabDrag: false,
  enableFlowFlameAnimation: false,
  enableFloatingHeaders: false,
  enableAnimatedThemeTransition: false,
  enableAdvancedGlassBlur: false,
  enableSheetGestures: false,
};

export function resolveFeatureFlags(flags: FeatureFlags, safeMode: boolean): FeatureFlags {
  return safeMode ? safeModeFeatureFlags : flags;
}

export const featureFlagNames = Object.keys(defaultFeatureFlags) as (keyof FeatureFlags)[];
