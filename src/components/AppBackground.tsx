import type { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/theme/ThemeProvider';

export function AppBackground({ children }: PropsWithChildren) {
  const { colors } = useTheme();
  return (
    <LinearGradient colors={[colors.backgroundPrimary, colors.backgroundSecondary, colors.backgroundPrimary]} style={styles.root}>
      <View pointerEvents="none" style={[styles.glowTop, { backgroundColor: colors.greenGlow }]} />
      <View pointerEvents="none" style={[styles.glowBottom, { backgroundColor: colors.gold, opacity: 0.07 }]} />
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  glowTop: { position: 'absolute', width: 260, height: 260, borderRadius: 130, top: -120, right: -90 },
  glowBottom: { position: 'absolute', width: 220, height: 220, borderRadius: 110, bottom: 30, left: -120 },
});
