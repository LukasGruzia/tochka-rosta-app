import { useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { GlassCard } from '@/components/GlassCard';
import { OnboardingShell } from '@/components/OnboardingShell';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ProgressRing } from '@/components/ProgressRing';
import { activityLabels, goalLabels } from '@/constants/options';
import { calculateNutrition, roundNutrition } from '@/services/nutritionCalculator';
import { useAppStore } from '@/store/appStore';
import { spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

export default function CalculationScreen() {
  const { colors } = useTheme();
  const draft = useAppStore((state) => state.draft);
  const setCalculatedTarget = useAppStore((state) => state.setCalculatedTarget);
  const completeOnboarding = useAppStore((state) => state.completeOnboarding);
  const target = useMemo(() => calculateNutrition(draft), [draft]);
  const values = roundNutrition(target);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => setCalculatedTarget(target), [setCalculatedTarget, target]);
  const open = async () => {
    try { setSaving(true); setError(null); await completeOnboarding(); await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); router.replace('/(onboarding)/finish'); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Не удалось сохранить профиль'); setSaving(false); }
  };
  return (
    <OnboardingShell progress={92} eyebrow="Персональный ориентир" title={`Твой ориентир готов, ${draft.name}.`}
      footer={<PrimaryButton label={saving ? 'Сохраняем…' : 'Открыть Точку Роста'} disabled={saving} onPress={open} />}>
      <GlassCard variant="accent" style={styles.hero}>
        <ProgressRing progress={1} size={190} value={values.calories.toLocaleString('ru-RU')} label="ккал в день" />
        <AppText variant="caption" tone="secondary">BMR {values.bmr} · TDEE {values.tdee}</AppText>
      </GlassCard>
      <View style={styles.macros}><Macro title="Белки" value={values.proteinG} color={colors.greenBright}/><Macro title="Жиры" value={values.fatG} color={colors.gold}/><Macro title="Углеводы" value={values.carbsG} color={colors.warning}/></View>
      <GlassCard variant="compact"><AppText variant="caption" tone="secondary">Цель: {goalLabels[draft.goal]}</AppText><AppText variant="caption" tone="secondary">Активность: {activityLabels[draft.activityLevel]}</AppText></GlassCard>
      <AppText variant="caption" tone="secondary">Это стартовая оценка, а не медицинская рекомендация. Позже показатели можно изменить в профиле.</AppText>
      {error ? <AppText variant="caption" tone="warning">{error}</AppText> : null}
    </OnboardingShell>
  );
}
function Macro({ title, value, color }: { title: string; value: number; color: string }) { return <GlassCard variant="compact" style={styles.macro}><View style={[styles.macroDot, { backgroundColor: color }]} /><AppText variant="caption" tone="secondary">{title}</AppText><AppText variant="heading">{value} г</AppText></GlassCard>; }
const styles = StyleSheet.create({ hero: { alignItems: 'center', gap: spacing.sm }, macros: { flexDirection: 'row', gap: spacing.sm }, macro: { flex: 1, minWidth: 0 }, macroDot: { width: 8, height: 8, borderRadius: 4, marginBottom: 6 } });
