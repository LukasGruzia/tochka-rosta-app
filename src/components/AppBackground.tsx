import type { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/theme/tokens';

export function AppBackground({ children }: PropsWithChildren) {
  return (
    <LinearGradient colors={[colors.backgroundPrimary, colors.backgroundSecondary, colors.backgroundPrimary]} style={styles.root}>
      <View pointerEvents="none" style={styles.glowTop} />
      <View pointerEvents="none" style={styles.glowBottom} />
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  glowTop: { position: 'absolute', width: 260, height: 260, borderRadius: 130, backgroundColor: colors.greenGlow, top: -120, right: -90 },
  glowBottom: { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(198,164,91,0.07)', bottom: 30, left: -120 },
});
