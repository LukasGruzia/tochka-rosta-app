export const motion = {
  duration: { fast: 160, normal: 260, slow: 420 },
  spring: {
    soft: { damping: 20, stiffness: 180 },
    snappy: { damping: 19, stiffness: 310 },
    liquid: { damping: 18, stiffness: 235, mass: 0.82 },
  },
  pressScale: 0.985,
  cardEnter: 260,
  sheetEnter: 320,
  tabMorph: 260,
  successPulse: 520,
  themeFade: 260,
  flameIdle: 3600,
  // Backward-compatible aliases while existing screens migrate.
  fast: 160,
  normal: 260,
  slow: 420,
  timing: { fast: 160, normal: 260, slow: 420 },
  press: { scale: 0.985 },
  card: { enter: 260 },
  tab: { move: 260 },
  sheet: { open: 320 },
  success: { pulse: 520 },
} as const;

export const animations = { fast: 160, normal: 260, slow: 420, flameCycle: 3600 } as const;
