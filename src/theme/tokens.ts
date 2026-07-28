export const darkColors = {
  backgroundPrimary: '#061009', backgroundSecondary: '#09150E',
  surface: 'rgba(16, 34, 23, 0.64)', surfaceStrong: 'rgba(19, 42, 28, 0.86)', surfaceSolid: '#102217',
  glassBorder: 'rgba(126, 255, 172, 0.14)', glassBorderStrong: 'rgba(105, 245, 154, 0.42)',
  greenPrimary: '#38D978', greenBright: '#69F59A', greenDark: '#123A24', greenGlow: 'rgba(56, 217, 120, 0.18)',
  textPrimary: '#F5F8F5', textSecondary: '#A3B0A7', textMuted: '#718078',
  gold: '#C6A45B', danger: '#FF7676', warning: '#E5B85C', carbs: '#62C7B7', transparent: 'transparent', blackScrim: 'rgba(0, 0, 0, 0.46)',
} as const;
export const lightColors: ThemeColors = {
  backgroundPrimary: '#F4F7F2', backgroundSecondary: '#EAF1EA', surface: 'rgba(255,255,255,0.68)', surfaceStrong: 'rgba(255,255,255,0.90)', surfaceSolid: '#F9FBF8', glassBorder: 'rgba(15,80,42,0.12)', glassBorderStrong: 'rgba(23,128,68,0.35)', greenPrimary: '#178044', greenBright: '#2BAF61', greenDark: '#D9EBDD', greenGlow: 'rgba(43,175,97,0.14)', textPrimary: '#102017', textSecondary: '#536158', textMuted: '#758078', gold: '#A47E2C', danger: '#B43F3F', warning: '#9B6B18', carbs: '#258C83', transparent: 'transparent', blackScrim: 'rgba(5,20,10,0.28)',
};
export type ThemeColors = { [K in keyof typeof darkColors]: string };
export const colors: ThemeColors = darkColors;
export const spacing = { xs: 6, sm: 10, md: 16, lg: 24, xl: 32, xxl: 44 } as const;
export const radii = { sm: 14, md: 18, lg: 24, xl: 28, pill: 999 } as const;
export const typography = { display: { fontSize: 36, lineHeight: 40, fontWeight: '800' as const }, title: { fontSize: 28, lineHeight: 33, fontWeight: '800' as const }, heading: { fontSize: 21, lineHeight: 26, fontWeight: '700' as const }, body: { fontSize: 16, lineHeight: 23, fontWeight: '400' as const }, caption: { fontSize: 13, lineHeight: 18, fontWeight: '500' as const } } as const;
export const shadows = { card: { shadowOpacity: 0.22, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 5 }, floating: { shadowOpacity: 0.28, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 9 } } as const;
export const glass = { blurIntensity: 22, blurElevated: 34, navigationBlur: 32 } as const;
export const animations = { fast: 180, normal: 280, slow: 420, flameCycle: 3200 } as const;
export const sizes = { touch: 44, tabBarBase: 64, avatar: 104, productThumb: 76 } as const;
export const theme = { colors, spacing, radii, typography, shadows, glass, animations, sizes } as const;
