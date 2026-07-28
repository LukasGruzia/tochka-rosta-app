import type { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/theme/ThemeProvider';

export function HomeBackground({ children }: PropsWithChildren) {
  const { colors, isDark } = useTheme();
  return <LinearGradient colors={[colors.backgroundPrimary, colors.backgroundSecondary, colors.backgroundPrimary]} locations={[0, 0.48, 1]} style={styles.root}>
    <View pointerEvents="none" style={[styles.aurora, styles.auroraTop, { backgroundColor: colors.greenGlow, opacity: isDark ? 0.72 : 0.48 }]} />
    <View pointerEvents="none" style={[styles.aurora, styles.auroraMiddle, { backgroundColor: colors.surfaceAccent, opacity: isDark ? 0.55 : 0.7 }]} />
    <View pointerEvents="none" style={[styles.aurora, styles.auroraBottom, { backgroundColor: colors.gold, opacity: isDark ? 0.045 : 0.035 }]} />
    {children}
  </LinearGradient>;
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden' },
  aurora: { position: 'absolute' },
  auroraTop: { width: 380, height: 300, borderRadius: 190, top: -168, right: -145, transform: [{ rotate: '-15deg' }] },
  auroraMiddle: { width: 290, height: 390, borderRadius: 160, top: 190, left: -220, transform: [{ rotate: '18deg' }] },
  auroraBottom: { width: 320, height: 240, borderRadius: 180, bottom: 80, right: -230 },
});
