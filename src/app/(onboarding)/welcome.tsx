import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { AppText } from '@/components/AppText';
import { GlassCard } from '@/components/GlassCard';
import { OnboardingShell } from '@/components/OnboardingShell';
import { PrimaryButton } from '@/components/PrimaryButton';
import { RhythmCharacter } from '@/features/rhythm/components/RhythmCharacter';
import { useAppStore } from '@/store/appStore';
import { radii, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

const benefits = ['Личный ориентир', 'Быстрый дневник', 'Поддержка Ритма'];

export default function WelcomeScreen() {
  const { colors } = useTheme();
  const profile = useAppStore((state) => state.profile);
  const target = useAppStore((state) => state.target);
  const beginOnboarding = useAppStore((state) => state.beginOnboarding);
  const completeOnboarding = useAppStore((state) => state.completeOnboarding);
  const [busy, setBusy] = useState(false);

  const begin = async () => {
    setBusy(true);
    try {
      await beginOnboarding('organic');
      router.push('/(onboarding)/goal');
    } finally {
      setBusy(false);
    }
  };

  const openExisting = async () => {
    if (!profile || !target) {
      Alert.alert('Профиль не найден', 'Начни короткую настройку — введённые данные будут сохраняться на устройстве.');
      return;
    }
    setBusy(true);
    try {
      await completeOnboarding({ wasSkipped: true });
      router.replace('/(tabs)');
    } finally {
      setBusy(false);
    }
  };

  return (
    <OnboardingShell
      eyebrow="Точка Роста"
      title="Питание, которое подстраивается под тебя"
      description="Настроим личный ориентир и сделаем первую запись меньше чем за минуту."
      footer={<View style={styles.actions}>
        <PrimaryButton label="Настроить мой Поток" loading={busy} onPress={begin} />
        <PrimaryButton label="Посмотреть демо" secondary disabled={busy} onPress={() => router.push('/(onboarding)/demo' as never)} />
        <PrimaryButton label="Уже настраивал" secondary disabled={busy} onPress={openExisting} />
      </View>}
    >
      <View style={styles.visual}>
        <View style={[styles.glow, { backgroundColor: colors.greenGlow }]} />
        <RhythmCharacter size="large" emotion="supportive" action="lookAtCard" label="Ритм приветствует и помогает настроить питание" />
        <GlassCard variant="accent" style={styles.balanceCard}>
          <AppText variant="caption" tone="secondary">Сегодняшний баланс</AppText>
          <AppText variant="metric" style={styles.metric}>2 180</AppText>
          <AppText variant="caption" tone="green">личный ориентир появится здесь</AppText>
        </GlassCard>
      </View>
      <View style={styles.benefits}>
        {benefits.map((benefit) => <View key={benefit} style={styles.benefit}>
          <View style={[styles.dot, { backgroundColor: colors.greenPrimary }]} />
          <AppText>{benefit}</AppText>
        </View>)}
      </View>
      <AppText variant="caption" tone="secondary" style={styles.privacy}>Данные питания сохраняются на устройстве.</AppText>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  actions: { gap: spacing.xs },
  visual: { minHeight: 270, alignItems: 'center', justifyContent: 'center' },
  glow: { position: 'absolute', width: 240, height: 240, borderRadius: 120 },
  balanceCard: { position: 'absolute', right: 0, bottom: 8, width: 172, borderRadius: radii.lg },
  metric: { fontSize: 32, lineHeight: 37, marginVertical: spacing.xxs },
  benefits: { gap: spacing.sm },
  benefit: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: { width: 8, height: 8, borderRadius: 4 },
  privacy: { textAlign: 'center', paddingVertical: spacing.sm },
});
