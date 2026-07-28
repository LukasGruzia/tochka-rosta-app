export const glass = {
  base: { blur: 16, borderWidth: 1, shadowOpacity: 0.10, shadowRadius: 14 },
  raised: { blur: 24, borderWidth: 1, shadowOpacity: 0.15, shadowRadius: 20 },
  interactive: { blur: 22, borderWidth: 1, shadowOpacity: 0.13, shadowRadius: 16 },
  accent: { blur: 28, borderWidth: 1, shadowOpacity: 0.18, shadowRadius: 24 },
  overlay: { blur: 32, borderWidth: 1, shadowOpacity: 0.22, shadowRadius: 28 },
  navigation: { blur: 30, borderWidth: 1, shadowOpacity: 0.20, shadowRadius: 22 },
  blurIntensity: 22,
  blurElevated: 28,
  navigationBlur: 30,
} as const;
