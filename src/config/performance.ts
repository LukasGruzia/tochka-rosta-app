export type PerformanceMode = 'automatic' | 'full' | 'balanced' | 'reduced' | 'safe';

export const visiblePerformanceModes = ['automatic', 'full', 'balanced', 'reduced'] as const;

export const performanceModeLabels: Record<PerformanceMode, string> = {
  automatic: 'Автоматически',
  full: 'Максимум',
  balanced: 'Сбалансировано',
  reduced: 'Экономно',
  safe: 'Безопасный режим',
};

export interface PerformanceEnvironment {
  platform: 'ios' | 'android' | 'web' | string;
  reducedMotion: boolean;
  appActive: boolean;
}

export interface PerformanceCapabilities {
  requestedMode: PerformanceMode;
  resolvedMode: Exclude<PerformanceMode, 'automatic'>;
  nativeBlur: boolean;
  idleAnimations: boolean;
  transitionAnimations: boolean;
  dragNavigation: boolean;
}

export function resolvePerformanceCapabilities(mode: PerformanceMode, environment: PerformanceEnvironment): PerformanceCapabilities {
  let resolvedMode: Exclude<PerformanceMode, 'automatic'> = mode === 'automatic' ? 'balanced' : mode;
  if (environment.reducedMotion && resolvedMode !== 'safe') resolvedMode = 'reduced';
  const isFull = resolvedMode === 'full';
  const isBalanced = resolvedMode === 'balanced';
  const motionAllowed = environment.appActive && (isFull || isBalanced);
  return {
    requestedMode: mode,
    resolvedMode,
    nativeBlur: environment.platform === 'ios' && (isFull || isBalanced),
    idleAnimations: motionAllowed,
    transitionAnimations: motionAllowed,
    // Drag stays disabled until a physical-device endurance test succeeds.
    dragNavigation: isFull && environment.appActive,
  };
}

export function isPerformanceMode(value: unknown): value is PerformanceMode {
  return value === 'automatic' || value === 'full' || value === 'balanced' || value === 'reduced' || value === 'safe';
}
