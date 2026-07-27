import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { GlassCard } from '@/components/GlassCard';
import { OnboardingShell } from '@/components/OnboardingShell';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useAppStore } from '@/store/appStore';
import { colors, radii, spacing } from '@/theme/tokens';

export default function WelcomeScreen() {
  const saveDraft = useAppStore((state) => state.saveDraft);
  const go = async (inside: boolean) => {
    await saveDraft({}, inside ? 'introduction' : 'name');
    router.push(inside ? '/(onboarding)/introduction' : '/(onboarding)/name');
  };
  return (
    <OnboardingShell eyebrow="Новый ритм питания" title={'Добро пожаловать\nв Точку Роста.'}
      description="Готовые блюда, персональный расчёт и ежедневный прогресс — в одной системе."
      footer={<View style={styles.actions}><PrimaryButton label="Начать путь" onPress={() => go(false)} /><PrimaryButton label="Что внутри" secondary onPress={() => go(true)} /></View>}>
      <View style={styles.visual}>
        <View style={styles.glow} />
        <Image source={require('../../../assets/brand/logo-main.png')} contentFit="contain" style={styles.logo} accessibilityLabel="Точка Роста" />
        <GlassCard variant="elevated" style={styles.foodCard}>
          <Image source={require('../../../assets/food/chicken-rice-bowl.jpg')} contentFit="cover" style={styles.heroFood} accessibilityLabel="Боул с курицей и рисом" />
          <View style={styles.foodCopy}><AppText style={styles.foodTitle}>Баланс в каждой детали</AppText><AppText variant="caption" tone="secondary">Рацион под твой ритм</AppText></View>
        </GlassCard>
        <Image source={require('../../../assets/food/caesar.jpg')} contentFit="cover" style={[styles.orbitFood, styles.orbitLeft]} />
        <Image source={require('../../../assets/food/syrniki.jpg')} contentFit="cover" style={[styles.orbitFood, styles.orbitRight]} />
        <View style={styles.growthLine} />
      </View>
    </OnboardingShell>
  );
}
const styles = StyleSheet.create({
  actions: { gap: spacing.sm }, visual: { flex: 1, minHeight: 340, alignItems: 'center', justifyContent: 'center' }, glow: { position: 'absolute', width: 240, height: 240, borderRadius: 120, backgroundColor: colors.greenGlow },
  logo: { width: 155, height: 88, position: 'absolute', top: -20, zIndex: 3 }, foodCard: { width: '82%', padding: 0, transform: [{ rotate: '-2deg' }] },
  heroFood: { height: 175, borderTopLeftRadius: radii.lg, borderTopRightRadius: radii.lg }, foodCopy: { padding: spacing.md, gap: 3 }, foodTitle: { fontWeight: '700' },
  orbitFood: { position: 'absolute', width: 90, height: 90, borderRadius: 45, borderWidth: 2, borderColor: colors.glassBorderStrong }, orbitLeft: { left: -12, bottom: 18, transform: [{ rotate: '-8deg' }] },
  orbitRight: { right: -8, top: 36, transform: [{ rotate: '9deg' }] }, growthLine: { position: 'absolute', width: '92%', height: 1, bottom: 4, backgroundColor: colors.greenPrimary, transform: [{ rotate: '-5deg' }], opacity: 0.45 },
});
