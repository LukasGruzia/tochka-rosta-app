import { useCallback } from 'react';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppIcon } from '@/components/AppIcon';
import { AppText } from '@/components/AppText';
import { GlassCard } from '@/components/GlassCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ProgressRing } from '@/components/ProgressRing';
import { TabScreen } from '@/components/TabScreen';
import { mealLabels } from '@/constants/options';
import { roundNutrition } from '@/services/nutritionCalculator';
import { useAppStore } from '@/store/appStore';
import { colors, radii, spacing } from '@/theme/tokens';
import { getDayGreeting } from '@/utils/date';
import type { MealType } from '@/types/domain';

export default function HomeScreen() {
  const { profile, target, diary, refreshDiary } = useAppStore();
  useFocusEffect(useCallback(() => { void refreshDiary(); }, [refreshDiary]));
  if (!profile || !target) return <TabScreen title="Загружаем профиль…"><AppText tone="secondary">Данные появятся через мгновение.</AppText></TabScreen>;
  const rounded = roundNutrition(target);
  const consumed = Math.round(diary?.consumedCalories ?? 0);
  const remaining = Math.max(0, rounded.calories - consumed);
  const progress = rounded.calories ? consumed / rounded.calories : 0;
  return <TabScreen title={`${getDayGreeting()}, ${profile.name}`} subtitle="Сегодня ты продолжаешь свой путь."
    headerRight={<Pressable accessibilityRole="button" accessibilityLabel="Открыть профиль" onPress={() => router.push('/(tabs)/profile')} style={styles.avatar}><Image source={require('../../../assets/brand/logo-mark.png')} contentFit="contain" style={styles.avatarImage}/></Pressable>}>
    <GlassCard variant="accent" style={styles.calorieCard}>
      <ProgressRing progress={progress} size={170} value={String(consumed)} label="ккал съедено" />
      <View style={styles.calorieCopy}><AppText variant="heading">{remaining.toLocaleString('ru-RU')} осталось</AppText><AppText variant="caption" tone="secondary">Дневная цель · {rounded.calories.toLocaleString('ru-RU')} ккал</AppText></View>
      <View style={styles.macroRow}><Macro label="Белки" value={rounded.proteinG}/><Macro label="Жиры" value={rounded.fatG}/><Macro label="Углеводы" value={rounded.carbsG}/></View>
    </GlassCard>
    <View style={styles.sectionTitle}><AppText variant="heading">Твой план на день</AppText></View>
    <GlassCard variant="default" style={styles.plan}>
      {(Object.keys(mealLabels) as MealType[]).map((meal, index) => { const count = diary?.entries.filter((entry) => entry.mealType === meal).length ?? 0; return <View key={meal} style={[styles.meal, index > 0 && styles.divider]}><View><AppText style={styles.mealTitle}>{mealLabels[meal]}</AppText><AppText variant="caption" tone="muted">{count ? `${count} ${count === 1 ? 'блюдо' : 'блюда'}` : 'Ничего не добавлено'}</AppText></View><AppText tone="green">＋</AppText></View>; })}
      <PrimaryButton label="Добавить блюдо" secondary onPress={() => router.push('/(tabs)/catalog')} />
    </GlassCard>
    <GlassCard variant="compact" style={styles.flow}><View style={styles.fire}><AppIcon name="flow" size={34} color={colors.greenBright}/></View><View style={styles.flowCopy}><AppText style={styles.mealTitle}>Поток начат · 0 дней</AppText><AppText variant="caption" tone="secondary">Закрой первый день, чтобы начать серию</AppText></View></GlassCard>
    <GlassCard variant="compact"><AppText variant="heading">Начни с малого</AppText><AppText tone="secondary">Добавь первый приём пищи и посмотри, как изменится дневной баланс.</AppText></GlassCard>
  </TabScreen>;
}
function Macro({ label, value }: { label: string; value: number }) { return <View style={styles.macro}><AppText variant="caption" tone="secondary">{label}</AppText><AppText style={styles.macroValue}>{value} г</AppText></View>; }
const styles = StyleSheet.create({
  avatar: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, borderColor: colors.glassBorderStrong, backgroundColor: colors.surfaceStrong, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, avatarImage: { width: 58, height: 42 },
  calorieCard: { alignItems: 'center', gap: spacing.md }, calorieCopy: { alignItems: 'center', gap: 3 }, macroRow: { width: '100%', flexDirection: 'row', backgroundColor: colors.blackScrim, borderRadius: radii.md, paddingVertical: spacing.sm }, macro: { flex: 1, alignItems: 'center', gap: 2 }, macroValue: { fontWeight: '700' },
  sectionTitle: { marginTop: spacing.sm }, plan: { gap: 0 }, meal: { minHeight: 62, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, divider: { borderTopWidth: 1, borderTopColor: colors.glassBorder }, mealTitle: { fontWeight: '700' },
  flow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md }, fire: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.greenGlow }, flowCopy: { flex: 1, gap: 4 },
});
