import { useCallback, useMemo, useState } from 'react';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { AppIcon } from '@/components/AppIcon';
import { AppText } from '@/components/AppText';
import { GlassCard } from '@/components/GlassCard';
import { MacroProgress } from '@/components/MacroProgress';
import { ProgressRing } from '@/components/ProgressRing';
import { TabScreen } from '@/components/TabScreen';
import { WaterCard } from '@/components/WaterCard';
import { QuickAddSheet } from '@/components/QuickAddSheet';
import { mealLabels } from '@/constants/options';
import { roundNutrition } from '@/services/nutritionCalculator';
import { rankPersonalRecommendations } from '@/services/personalRecommendations';
import { getSmartNextStep } from '@/services/smartNextStep';
import { useAppStore } from '@/store/appStore';
import { useTheme } from '@/theme/ThemeProvider';
import { radii, spacing } from '@/theme/tokens';
import { getDayGreeting, getLocalDateKey } from '@/utils/date';
import type { MealType } from '@/types/domain';

const meals: MealType[] = ['breakfast', 'lunch', 'snack', 'dinner'];

export default function HomeScreen() {
  const { profile, target, diary, flow, products, setDiaryDate, refreshFlow } = useAppStore();
  const { colors } = useTheme();
  const [details, setDetails] = useState(false);
  const [quickAdd, setQuickAdd] = useState(false);
  useFocusEffect(useCallback(() => { void Promise.all([setDiaryDate(getLocalDateKey()), refreshFlow()]); }, [refreshFlow, setDiaryDate]));
  const next = getSmartNextStep(diary, new Date().getHours());
  const recommendation = useMemo(() => profile && target ? rankPersonalRecommendations(products, profile, Math.max(0, target.calories - (diary?.consumedCalories ?? 0)), next.meal)[0] : undefined, [diary?.consumedCalories, next.meal, products, profile, target]);

  if (!profile || !target) return <TabScreen title="Загружаем профиль…"><AppText tone="secondary">Данные появятся через мгновение.</AppText></TabScreen>;
  const rounded = roundNutrition(target);
  const consumed = Math.round(diary?.consumedCalories ?? 0);
  const remaining = rounded.calories - consumed;
  const progress = rounded.calories ? consumed / rounded.calories : 0;
  const initials = profile.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();

  return <>
    <TabScreen title={`${getDayGreeting()}, ${profile.name}`} subtitle="Небольшие действия складываются в устойчивый результат."
      headerRight={<Pressable accessibilityRole="button" accessibilityLabel="Открыть профиль" onPress={() => router.push('/(tabs)/profile')} style={[styles.avatar, { borderColor: colors.glassBorderStrong, backgroundColor: colors.surfaceStrong }]}>{profile.avatarUri ? <Image source={{ uri: profile.avatarUri }} contentFit="cover" style={StyleSheet.absoluteFill} /> : <AppText tone="green" style={styles.initials}>{initials}</AppText>}</Pressable>}>
      <GlassCard variant="accent" style={styles.calorieCard} onPress={() => setDetails(true)} accessibilityLabel="Открыть подробности дневной нормы">
        <ProgressRing progress={progress} size={168} value={String(consumed)} label="ккал съедено" />
        <View style={styles.calorieCopy}><AppText variant="heading" tone={remaining < 0 ? 'warning' : 'primary'}>{remaining >= 0 ? `${remaining.toLocaleString('ru-RU')} осталось` : `${Math.abs(remaining).toLocaleString('ru-RU')} сверх цели`}</AppText><AppText variant="caption" tone="secondary">Дневная цель · {rounded.calories.toLocaleString('ru-RU')} ккал · нажми подробнее</AppText></View>
        <View style={[styles.macroPanel, { backgroundColor: colors.blackScrim }]}><MacroProgress label="Б" value={diary?.consumedProteinG ?? 0} target={rounded.proteinG} /><MacroProgress label="Ж" value={diary?.consumedFatG ?? 0} target={rounded.fatG} color={colors.gold} /><MacroProgress label="У" value={diary?.consumedCarbsG ?? 0} target={rounded.carbsG} color={colors.carbs} /></View>
      </GlassCard>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickActions}>
        <QuickAction icon="+" label="Добавить" onPress={() => setQuickAdd(true)} />
        <QuickAction icon="◎" label="Закрыть остаток" onPress={() => router.push({ pathname: '/remainder-match' as never, params: { meal: next.meal } } as never)} />
        <QuickAction icon="▦" label="План на неделю" onPress={() => router.push('/my-week' as never)} />
        <QuickAction icon="✓" label="Список покупок" onPress={() => router.push('/shopping-list' as never)} />
      </ScrollView>

      <GlassCard variant="interactive" onPress={() => router.push({ pathname: '/food-search' as never, params: { meal: next.meal } } as never)} accessibilityLabel={next.title}>
        <View style={styles.next}><View style={[styles.nextIcon, { backgroundColor: colors.greenGlow }]}><AppText tone="green">→</AppText></View><View style={styles.nextCopy}><AppText variant="heading">{next.title}</AppText><AppText tone="secondary">{next.description}</AppText></View><AppText tone="muted">›</AppText></View>
      </GlassCard>

      <View style={styles.sectionTitle}><AppText variant="heading">Сегодня</AppText><Pressable onPress={() => router.push('/(tabs)/diary')}><AppText variant="caption" tone="green">Открыть дневник</AppText></Pressable></View>
      {diary?.entries.length && remaining > 120 && remaining < 1200 ? <GlassCard variant="interactive" onPress={() => router.push({ pathname: '/remainder-match' as never, params: { meal: next.meal } } as never)}><View style={styles.next}><View style={[styles.nextIcon,{backgroundColor:colors.greenGlow}]}><AppText tone="green">◎</AppText></View><View style={styles.nextCopy}><AppText variant="heading">Закрыть остаток</AppText><AppText tone="secondary">Подобрать еду на оставшиеся {remaining} ккал и КБЖУ.</AppText></View><AppText tone="muted">›</AppText></View></GlassCard> : null}
      <GlassCard variant="default" style={styles.plan}>{meals.map((meal, index) => { const entries = diary?.entries.filter((entry) => entry.mealType === meal) ?? []; const calories = entries.reduce((sum, entry) => sum + entry.calories, 0); return <Pressable key={meal} onPress={() => router.push({ pathname: '/food-search' as never, params: { meal } } as never)} style={[styles.meal, index > 0 && { borderTopColor: colors.glassBorder, borderTopWidth: 1 }]}><View><AppText style={styles.bold}>{mealLabels[meal]}</AppText><AppText variant="caption" tone="muted">{entries.length ? `${entries.length} · ${Math.round(calories)} ккал` : 'Пока ничего не добавлено'}</AppText></View><AppText tone="green">+</AppText></Pressable>; })}</GlassCard>

      <WaterCard onOpen={() => router.push('/water-tracker' as never)} />

      <GlassCard variant="compact" onPress={() => router.push('/(tabs)/flow')}><View style={styles.flow}><View style={[styles.flowIcon, { backgroundColor: colors.greenGlow }]}><AppIcon name="flow" size={32} color={colors.greenBright} /></View><View style={styles.nextCopy}><AppText style={styles.bold}>Поток · {flow?.currentStreak ?? 0} дней</AppText><AppText variant="caption" tone="secondary">{flow?.currentStreak ? `Лучшая серия — ${flow.longestStreak}` : 'Закрой первый день, чтобы начать серию'}</AppText></View><AppText tone="muted">›</AppText></View></GlassCard>

      {recommendation ? <GlassCard variant="compact" onPress={() => router.push(`/product/${recommendation.id}` as never)}><AppText variant="caption" tone="green">РЕКОМЕНДАЦИЯ ДНЯ</AppText><AppText variant="heading">{recommendation.name}</AppText><AppText tone="secondary">{Math.round(recommendation.caloriesPer100g)} ккал на 100 г · открыть карточку</AppText></GlassCard> : null}
    </TabScreen>
    <CalorieDetails visible={details} onClose={() => setDetails(false)} consumed={consumed} target={rounded.calories} bmr={target.bmr} tdee={target.tdee} />
    <QuickAddSheet visible={quickAdd} onClose={() => setQuickAdd(false)} date={getLocalDateKey()} mealType={next.meal}/>
  </>;
}

function QuickAction({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  const { colors } = useTheme();
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.quick, { backgroundColor: colors.surface, borderColor: colors.glassBorder }, pressed && styles.pressed]}><View style={[styles.quickIcon, { backgroundColor: colors.greenGlow }]}><AppText tone="green" variant="heading">{icon}</AppText></View><AppText variant="caption" style={styles.bold}>{label}</AppText></Pressable>;
}

function CalorieDetails({ visible, onClose, consumed, target, bmr, tdee }: { visible: boolean; onClose: () => void; consumed: number; target: number; bmr: number; tdee: number }) {
  const { colors } = useTheme();
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}><Pressable style={[styles.scrim, { backgroundColor: colors.blackScrim }]} onPress={onClose} /><View style={[styles.sheet, { backgroundColor: colors.backgroundSecondary, borderColor: colors.glassBorder }]}><View style={styles.sheetHead}><AppText variant="heading">Дневная энергия</AppText><Pressable onPress={onClose}><AppText>×</AppText></Pressable></View><View style={styles.detailRow}><AppText tone="secondary">Съедено</AppText><AppText style={styles.bold}>{consumed} ккал</AppText></View><View style={styles.detailRow}><AppText tone="secondary">Цель</AppText><AppText style={styles.bold}>{target} ккал</AppText></View><View style={styles.detailRow}><AppText tone="secondary">Базовый обмен</AppText><AppText>{Math.round(bmr)} ккал</AppText></View><View style={styles.detailRow}><AppText tone="secondary">Расход с активностью</AppText><AppText>{Math.round(tdee)} ккал</AppText></View><AppText variant="caption" tone="muted">Цель рассчитана по данным профиля и выбранной цели. Это ориентир, а не медицинская рекомендация.</AppText></View></Modal>;
}

const styles = StyleSheet.create({
  avatar: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, initials: { fontWeight: '800' }, calorieCard: { alignItems: 'center', gap: spacing.md }, calorieCopy: { alignItems: 'center', gap: 3 },
  macroPanel: { width: '100%', flexDirection: 'row', gap: spacing.md, borderRadius: radii.md, padding: spacing.md }, quickActions: { gap: spacing.sm }, quick: { width: 82, minHeight: 86, borderRadius: radii.lg, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.xs }, quickIcon: { width: 38, height: 38, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center' }, pressed: { opacity: 0.65, transform: [{ scale: 0.98 }] }, bold: { fontWeight: '700' },
  next: { flexDirection: 'row', alignItems: 'center', gap: spacing.md }, nextIcon: { width: 44, height: 44, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center' }, nextCopy: { flex: 1, gap: 3 }, sectionTitle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm }, plan: { gap: 0 }, meal: { minHeight: 62, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  flow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md }, flowIcon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  scrim: { ...StyleSheet.absoluteFillObject }, sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, gap: spacing.md, padding: spacing.lg, paddingBottom: spacing.xl, borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl, borderWidth: 1 }, sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, detailRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
});
