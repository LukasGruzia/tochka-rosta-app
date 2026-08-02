import { useEffect } from 'react';
import { Image } from 'expo-image';
import { router, type Href } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, useReducedMotion } from 'react-native-reanimated';
import { AppBackground } from '@/components/AppBackground';
import { AppText } from '@/components/AppText';
import { PrimaryButton } from '@/components/PrimaryButton';
import { resolveInitialAppRoute } from '@/features/onboarding/routes';
import { useAppStore } from '@/store/appStore';
import { spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

export default function SplashRoute() {
  const { colors } = useTheme();
  const status = useAppStore((state) => state.status);
  const error = useAppStore((state) => state.error);
  const onboardingCompleted = useAppStore((state) => state.onboardingCompleted);
  const onboardingStep = useAppStore((state) => state.onboardingStep);
  const initialize = useAppStore((state) => state.initialize);
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    if (status !== 'ready') return;
    const delay = 0;
    const timer = setTimeout(() => {
      const destination = resolveInitialAppRoute(onboardingCompleted, onboardingStep);
      router.replace(destination as Href);
    }, delay);
    return () => clearTimeout(timer);
  }, [status, onboardingCompleted, onboardingStep, reducedMotion]);

  return (
    <AppBackground>
      <View style={styles.root}>
        <Animated.View entering={reducedMotion ? undefined : FadeIn.duration(550)} style={styles.markWrap}>
          <View style={[styles.halo, { borderColor: colors.greenBright, shadowColor: colors.greenBright }]} />
          <Image source={require('../../assets/rhythm/rhythm-idle-medium.png')} contentFit="contain" style={styles.logo} accessibilityLabel="Ритм — огонёк Точки Роста" />
        </Animated.View>
        <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(350).duration(500)} style={styles.copy}>
          <AppText variant="heading" style={styles.brand}>ТОЧКА РОСТА</AppText>
          <AppText tone="secondary">Сила в балансе</AppText>
        </Animated.View>
        {status === 'booting' ? <ActivityIndicator color={colors.greenPrimary} style={styles.loader} /> : null}
        {status === 'error' ? <View style={styles.error}><AppText tone="warning">{error}</AppText><PrimaryButton label="Повторить" onPress={initialize} /></View> : null}
      </View>
    </AppBackground>
  );
}
const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg }, markWrap: { width: 176, height: 176, alignItems: 'center', justifyContent: 'center' },
  halo: { position: 'absolute', width: 152, height: 152, borderRadius: 76, borderWidth: 1, shadowOpacity: 0.65, shadowRadius: 24 },
  logo: { width: 174, height: 174 }, copy: { alignItems: 'center', gap: spacing.xs, marginTop: spacing.lg }, brand: { letterSpacing: 2.8 }, loader: { position: 'absolute', bottom: 70 },
  error: { position: 'absolute', left: spacing.lg, right: spacing.lg, bottom: 50, gap: spacing.md },
});
