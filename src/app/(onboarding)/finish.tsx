import { useEffect } from 'react';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, ZoomIn, useReducedMotion } from 'react-native-reanimated';
import { AppBackground } from '@/components/AppBackground';
import { AppIcon } from '@/components/AppIcon';
import { AppText } from '@/components/AppText';
import { spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

export default function FinishScreen() {
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();
  useEffect(() => { const timer = setTimeout(() => router.replace('/(tabs)'), reducedMotion ? 100 : 900); return () => clearTimeout(timer); }, [reducedMotion]);
  return <AppBackground><View style={styles.root}><Animated.View entering={reducedMotion ? undefined : ZoomIn.duration(350)} style={[styles.check, { backgroundColor: colors.greenBright }]}><AppIcon name="check" size={48} color={colors.backgroundPrimary}/></Animated.View><Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(180)} style={styles.copy}><AppText variant="title">Всё готово</AppText><AppText tone="secondary" style={styles.center}>Твой персональный ритм сохранён на этом устройстве.</AppText></Animated.View></View></AppBackground>;
}
const styles = StyleSheet.create({ root: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg, padding: spacing.lg }, check: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center' }, copy: { alignItems: 'center', gap: spacing.sm }, center: { textAlign: 'center' } });
