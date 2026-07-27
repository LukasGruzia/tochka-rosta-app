export const colors = {
  backgroundPrimary: '#061009', backgroundSecondary: '#09150E',
  surface: 'rgba(16, 34, 23, 0.64)', surfaceStrong: 'rgba(19, 42, 28, 0.86)', surfaceSolid: '#102217',
  glassBorder: 'rgba(126, 255, 172, 0.14)', glassBorderStrong: 'rgba(105, 245, 154, 0.42)',
  greenPrimary: '#38D978', greenBright: '#69F59A', greenDark: '#123A24', greenGlow: 'rgba(56, 217, 120, 0.18)',
  textPrimary: '#F5F8F5', textSecondary: '#A3B0A7', textMuted: '#718078',
  gold: '#C6A45B', danger: '#FF6B6B', warning: '#E5B85C', transparent: 'transparent', blackScrim: 'rgba(0, 0, 0, 0.38)',
} as const;

export const spacing = { xs: 6, sm: 10, md: 16, lg: 24, xl: 32, xxl: 44 } as const;
export const radii = { sm: 14, md: 18, lg: 24, xl: 28, pill: 999 } as const;
export const typography = {
  display: { fontSize: 36, lineHeight: 40, fontWeight: '800' as const },
  title: { fontSize: 28, lineHeight: 33, fontWeight: '800' as const },
  heading: { fontSize: 21, lineHeight: 26, fontWeight: '700' as const },
  body: { fontSize: 16, lineHeight: 23, fontWeight: '400' as const },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '500' as const },
} as const;
export const theme = { colors, spacing, radii, typography } as const;
