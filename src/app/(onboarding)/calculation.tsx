import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { AppText } from '@/components/AppText';
import { GlassCard } from '@/components/GlassCard';
import { OnboardingShell } from '@/components/OnboardingShell';
import { PrimaryButton } from '@/components/PrimaryButton';
import { RhythmCharacter } from '@/features/rhythm/components/RhythmCharacter';
import { recordOnboardingEvent } from '@/features/onboarding/onboardingAnalytics';
import { goalLabels } from '@/constants/options';
import { calculateNutrition, roundNutrition } from '@/services/nutritionCalculator';
import { useAppStore } from '@/store/appStore';
import { spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

export default function CalculationScreen() {
  const { colors } = useTheme();
  const draft = useAppStore((state) => state.draft);
  const setCalculatedTarget = useAppStore((state) => state.setCalculatedTarget);
  const prepareOnboardingProfile = useAppStore((state) => state.prepareOnboardingProfile);
  const target = useMemo(() => calculateNutrition(draft), [draft]);
  const values = roundNutrition(target);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const viewed = useRef(false);

  useEffect(() => {
    setCalculatedTarget(target);
    if (!viewed.current) {
      viewed.current = true;
      void recordOnboardingEvent('result_viewed', { step: 'result' });
    }
  }, [setCalculatedTarget, target]);

  const firstEntry = async () => {
    setBusy(true);
    setError(null);
    try {
      await prepareOnboardingProfile();
      router.push('/(onboarding)/first-entry' as never);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не удалось сохранить ориентир');
    } finally {
      setBusy(false);
    }
  };

  return (
    <OnboardingShell showBack fallbackRoute="/(onboarding)/preferences" step={{ current: 4, total: 5 }} eyebrow="Персональный результат" title={draft.name ? `${draft.name}, твой ориентир готов` : 'Твой ориентир готов'}
      footer={<View style={styles.actions}><PrimaryButton label="Сделать первую запись" loading={busy} onPress={firstEntry} /><PrimaryButton label="Изменить данные" secondary disabled={busy} onPress={() => router.replace('/(onboarding)/personal-data')} /></View>}>
      <View style={styles.rhythm}><RhythmCharacter size="medium" emotion="motivated" action="celebrate" label="Ритм радуется готовому ориентиру" /></View>
      <GlassCard variant="accent" style={styles.hero} accessibilityLabel={`Дневной ориентир ${values.calories} килокалорий`}>
        <AppText variant="caption" tone="secondary">Дневной ориентир</AppText>
        <AppText variant="metric" style={styles.calories}>{values.calories.toLocaleString('ru-RU')}</AppText>
        <AppText tone="secondary">килокалорий</AppText>
      </GlassCard>
      <View style={styles.macros}>
        <Macro title="Белки" value={values.proteinG} color={colors.greenBright} />
        <Macro title="Жиры" value={values.fatG} color={colors.gold} />
        <Macro title="Углеводы" value={values.carbsG} color={colors.carbs} />
      </View>
      <GlassCard variant="compact"><AppText variant="caption" tone="secondary">Цель: {goalLabels[draft.goal]}</AppText></GlassCard>
      <AppText>«Это отправная точка, а не строгий предел. Ориентир можно изменить в любой момент.»</AppText>
      {draft.age < 18 ? <AppText variant="caption" tone="warning">Для возраста младше 18 лет применена только мягкая корректировка ориентира.</AppText> : null}
      {error ? <AppText accessibilityLiveRegion="polite" variant="caption" tone="warning">{error}</AppText> : null}
    </OnboardingShell>
  );
}

function Macro({ title, value, color }: { title: string; value: number; color: string }) {
  return <GlassCard variant="compact" style={styles.macro} accessibilityLabel={`${title} ${value} граммов`}><View style={[styles.dot, { backgroundColor: color }]} /><AppText variant="caption" tone="secondary">{title}</AppText><AppText variant="heading" style={styles.tabular}>{value} г</AppText></GlassCard>;
}

const styles = StyleSheet.create({
  actions: { gap: spacing.xs }, rhythm: { position: 'absolute', right: 4, top: -18, zIndex: 2 }, hero: { alignItems: 'flex-start', paddingRight: 110 }, calories: { marginTop: spacing.xs },
  macros: { flexDirection: 'row', gap: spacing.xs }, macro: { flex: 1, minWidth: 0 }, dot: { width: 8, height: 8, borderRadius: 4, marginBottom: spacing.xs }, tabular: { fontVariant: ['tabular-nums'] },
});
