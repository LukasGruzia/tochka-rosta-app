import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { AppText } from '@/components/AppText';
import { ChoiceCard } from '@/components/ChoiceCard';
import { GlassCard } from '@/components/GlassCard';
import { OnboardingShell } from '@/components/OnboardingShell';
import { PrimaryButton } from '@/components/PrimaryButton';
import { RhythmCharacter } from '@/features/rhythm/components/RhythmCharacter';
import { goalOptions } from '@/constants/options';
import { calculateNutrition, roundNutrition } from '@/services/nutritionCalculator';
import type { Goal, ProfileDraft } from '@/types/domain';
import { spacing } from '@/theme/tokens';

const demoBase: ProfileDraft = { name: '', age: 30, calculationSex: 'female', heightCm: 168, weightKg: 62, activityLevel: 'medium', goal: 'balance', dietPreference: 'all', restrictions: [] };

export default function FirstMinuteDemoScreen() {
  const [stage, setStage] = useState(0);
  const [goal, setGoal] = useState<Goal>('balance');
  const values = useMemo(() => roundNutrition(calculateNutrition({ ...demoBase, goal })), [goal]);

  if (stage === 0) return <OnboardingShell showBack fallbackRoute="/(onboarding)/welcome" eyebrow="Изолированное демо" title="Выбери цель для примера" description="Демо не меняет реальный профиль и не записывает данные в дневник."
    footer={<PrimaryButton label="Показать ориентир" onPress={() => setStage(1)} />}>
    {goalOptions.map((option) => <ChoiceCard key={option.value} title={option.title} description={option.description} selected={goal === option.value} onPress={() => setGoal(option.value)} />)}
  </OnboardingShell>;

  if (stage === 1) return <OnboardingShell showBack title="Демо-ориентир готов" description="Так выглядит персональный результат после короткой настройки."
    footer={<PrimaryButton label="Попробовать первую запись" onPress={() => setStage(2)} />}>
    <View style={styles.rhythm}><RhythmCharacter size="large" emotion="motivated" action="celebrate" animated={false} /></View>
    <GlassCard variant="accent"><AppText variant="caption" tone="secondary">Дневной ориентир</AppText><AppText variant="metric">{values.calories.toLocaleString('ru-RU')}</AppText><AppText>ккал · Б {values.proteinG} · Ж {values.fatG} · У {values.carbsG}</AppText></GlassCard>
  </OnboardingShell>;

  if (stage === 2) return <OnboardingShell showBack title="Первая запись в демо" description="Ниже — только предварительный просмотр. SQLite и настоящий дневник не изменяются."
    footer={<PrimaryButton label="Добавить только в демо" onPress={() => setStage(3)} />}>
    <GlassCard variant="interactive" selected><AppText variant="heading">Банан</AppText><AppText tone="secondary">120 г · 107 ккал · Перекус</AppText></GlassCard>
  </OnboardingShell>;

  return <OnboardingShell eyebrow="Демо завершено" title="Вот как начинается твой день" description="Одна запись обновляет баланс и даёт понятный следующий шаг."
    footer={<PrimaryButton label="Настроить мой Поток" onPress={() => router.replace('/(onboarding)/welcome')} />}>
    <View style={styles.rhythm}><RhythmCharacter size="large" emotion="happy" action="lookAtCard" animated={false} /></View>
    <GlassCard variant="accent"><AppText variant="heading">Отличное начало</AppText><AppText tone="secondary">Сегодняшний баланс уже считается.</AppText></GlassCard>
    <GlassCard variant="interactive"><AppText variant="heading">Следующий шаг</AppText><AppText tone="secondary">Продолжить дневник, когда будет удобно.</AppText></GlassCard>
    <AppText variant="caption" tone="secondary" style={styles.center}>Реальные данные не были изменены.</AppText>
  </OnboardingShell>;
}

const styles = StyleSheet.create({ rhythm: { minHeight: 210, alignItems: 'center', justifyContent: 'center' }, center: { textAlign: 'center', marginTop: spacing.sm } });
