import { useCallback, useEffect, useMemo, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { InteractionManager, Modal, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon } from '@/components/AppIcon';
import { AppText } from '@/components/AppText';
import { GlassCard } from '@/components/GlassCard';
import { HomeBackground } from '@/components/HomeBackground';
import { HomeHeader } from '@/components/HomeHeader';
import { HomeQuickActions } from '@/components/HomeQuickActions';
import { NutritionHeroCard } from '@/components/NutritionHeroCard';
import { TabScreen } from '@/components/TabScreen';
import { WaterCard } from '@/components/WaterCard';
import { QuickAddSheet } from '@/components/QuickAddSheet';
import { useTabBarLayout } from '@/contexts/TabBarLayoutContext';
import { loadProductsPage } from '@/database/repositories/productRepository';
import { useRenderTracker } from '@/performance/renderTracker';
import { useScreenProfiler } from '@/performance/screenProfiler';
import { mealLabels } from '@/constants/options';
import { roundNutrition } from '@/services/nutritionCalculator';
import { rankPersonalRecommendations } from '@/services/personalRecommendations';
import { getCachedRecommendation, hasCachedRecommendation, setCachedRecommendation } from '@/services/recommendationCache';
import { seedDataVersion } from '@/database/database';
import { getSmartNextStep } from '@/services/smartNextStep';
import { useAppStore } from '@/store/appStore';
import { useTheme } from '@/theme/ThemeProvider';
import { getHomeLayout } from '@/theme/layout';
import { radii, spacing } from '@/theme/tokens';
import { getDayGreeting, getLocalDateKey } from '@/utils/date';
import type { MealType, Product } from '@/types/domain';

const meals: MealType[] = ['breakfast', 'lunch', 'snack', 'dinner'];

export default function HomeScreen() {
  useRenderTracker('HomeScreen');
  useScreenProfiler('home');
  const profile = useAppStore((state) => state.profile);
  const target = useAppStore((state) => state.target);
  const diary = useAppStore((state) => state.diary);
  const flow = useAppStore((state) => state.flow);
  const setDiaryDate = useAppStore((state) => state.setDiaryDate);
  const refreshFlow = useAppStore((state) => state.refreshFlow);
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const { contentInset } = useTabBarLayout();
  const [details, setDetails] = useState(false);
  const [quickAdd, setQuickAdd] = useState(false);
  const [recommendation, setRecommendation] = useState<Product | undefined>();
  useFocusEffect(useCallback(() => { void Promise.all([setDiaryDate(getLocalDateKey()), refreshFlow()]); }, [refreshFlow, setDiaryDate]));
  const next = getSmartNextStep(diary, new Date().getHours());
  useEffect(() => {
    if (!profile || !target) { setRecommendation(undefined); return; }
    const recommendationKey = [seedDataVersion, profile.goal, profile.dietPreference, profile.restrictions.join(','), target.calories, Math.round((diary?.consumedCalories ?? 0) / 50), next.meal].join('|');
    if (hasCachedRecommendation(recommendationKey)) {
      setRecommendation(getCachedRecommendation(recommendationKey) ?? undefined);
      return;
    }
    let active = true;
    const task = InteractionManager.runAfterInteractions(() => {
      void loadProductsPage({ limit: 24 }).then((products) => {
        const nextRecommendation = rankPersonalRecommendations(products, profile, Math.max(0, target.calories - (diary?.consumedCalories ?? 0)), next.meal)[0];
        setCachedRecommendation(recommendationKey, nextRecommendation);
        if (active) setRecommendation(nextRecommendation);
      }).catch((error) => { if (__DEV__) console.warn('[HomeScreen] recommendation', error); });
    });
    return () => { active = false; task.cancel(); };
  }, [diary?.consumedCalories, next.meal, profile, target]);
  const quickActions = useMemo(() => [
    { icon: 'add' as const, label: 'Добавить блюдо', onPress: () => setQuickAdd(true) },
    { icon: 'target' as const, label: 'Закрыть остаток', onPress: () => router.push({ pathname: '/remainder-match' as never, params: { meal: next.meal } } as never) },
    { icon: 'calendar' as const, label: 'План на неделю', onPress: () => router.push('/my-week' as never) },
    { icon: 'cart' as const, label: 'Список покупок', onPress: () => router.push('/shopping-list' as never) },
  ], [next.meal]);

  if (!profile || !target) return <TabScreen title="Загружаем профиль…"><AppText tone="secondary">Данные появятся через мгновение.</AppText></TabScreen>;
  const rounded = roundNutrition(target);
  const consumed = Math.round(diary?.consumedCalories ?? 0);
  const remaining = rounded.calories - consumed;
  const progress = rounded.calories ? consumed / rounded.calories : 0;
  const layout = getHomeLayout(width);

  return <>
    <HomeBackground><SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.scroll, { paddingHorizontal: layout.horizontalPadding, paddingBottom: contentInset }]}>
      <HomeHeader greeting={getDayGreeting()} name={profile.name} avatarUri={profile.avatarUri} onProfile={() => router.push('/(tabs)/profile')} />
      <AppText tone="secondary">Небольшие действия складываются в устойчивый результат.</AppText>
      <NutritionHeroCard
        compact={layout.compact}
        consumed={consumed}
        target={rounded.calories}
        remaining={remaining}
        progress={progress}
        protein={diary?.consumedProteinG ?? 0}
        proteinTarget={rounded.proteinG}
        fat={diary?.consumedFatG ?? 0}
        fatTarget={rounded.fatG}
        carbs={diary?.consumedCarbsG ?? 0}
        carbsTarget={rounded.carbsG}
        onAdd={() => setQuickAdd(true)}
        onDetails={() => setDetails(true)}
      />

      <HomeQuickActions actions={quickActions} />

      <GlassCard variant="interactive" onPress={() => router.push({ pathname: '/food-search' as never, params: { meal: next.meal } } as never)} accessibilityLabel={next.title}>
        <View style={styles.next}><View style={[styles.nextIcon, { backgroundColor: colors.greenGlow }]}><AppText tone="green">→</AppText></View><View style={styles.nextCopy}><AppText variant="heading">{next.title}</AppText><AppText tone="secondary">{next.description}</AppText></View><AppText tone="muted">›</AppText></View>
      </GlassCard>

      <View style={styles.sectionTitle}><AppText variant="heading">Сегодня</AppText><Pressable onPress={() => router.push('/(tabs)/diary')}><AppText variant="caption" tone="green">Открыть дневник</AppText></Pressable></View>
      {diary?.entries.length && remaining > 120 && remaining < 1200 ? <GlassCard variant="interactive" onPress={() => router.push({ pathname: '/remainder-match' as never, params: { meal: next.meal } } as never)}><View style={styles.next}><View style={[styles.nextIcon,{backgroundColor:colors.greenGlow}]}><AppText tone="green">◎</AppText></View><View style={styles.nextCopy}><AppText variant="heading">Закрыть остаток</AppText><AppText tone="secondary">Подобрать еду на оставшиеся {remaining} ккал и КБЖУ.</AppText></View><AppText tone="muted">›</AppText></View></GlassCard> : null}
      <GlassCard variant="default" style={styles.plan}>{meals.map((meal, index) => { const entries = diary?.entries.filter((entry) => entry.mealType === meal) ?? []; const calories = entries.reduce((sum, entry) => sum + entry.calories, 0); return <Pressable key={meal} onPress={() => router.push({ pathname: '/food-search' as never, params: { meal } } as never)} style={[styles.meal, index > 0 && { borderTopColor: colors.glassBorder, borderTopWidth: 1 }]}><View><AppText style={styles.bold}>{mealLabels[meal]}</AppText><AppText variant="caption" tone="muted">{entries.length ? `${entries.length} · ${Math.round(calories)} ккал` : 'Пока ничего не добавлено'}</AppText></View><AppText tone="green">+</AppText></Pressable>; })}</GlassCard>

      <WaterCard onOpen={() => router.push('/water-tracker' as never)} />

      <GlassCard variant="compact" onPress={() => router.push('/(tabs)/flow')}><View style={styles.flow}><View style={[styles.flowIcon, { backgroundColor: colors.greenGlow }]}><AppIcon name="flow" size={32} color={colors.greenBright} /></View><View style={styles.nextCopy}><AppText style={styles.bold}>Поток · {flow?.currentStreak ?? 0} дней</AppText><AppText variant="caption" tone="secondary">{flow?.currentStreak ? `Лучшая серия — ${flow.longestStreak}` : 'Закрой первый день, чтобы начать серию'}</AppText></View><AppText tone="muted">›</AppText></View></GlassCard>

      {recommendation ? <GlassCard variant="compact" onPress={() => router.push(`/product/${recommendation.id}` as never)}><AppText variant="caption" tone="green">РЕКОМЕНДАЦИЯ ДНЯ</AppText><AppText variant="heading">{recommendation.name}</AppText><AppText tone="secondary">{Math.round(recommendation.caloriesPer100g)} ккал на 100 г · открыть карточку</AppText></GlassCard> : null}
      </ScrollView>
    </SafeAreaView></HomeBackground>
    {details ? <CalorieDetails visible onClose={() => setDetails(false)} consumed={consumed} target={rounded.calories} bmr={target.bmr} tdee={target.tdee} /> : null}
    {quickAdd ? <QuickAddSheet visible onClose={() => setQuickAdd(false)} date={getLocalDateKey()} mealType={next.meal}/> : null}
  </>;
}

function CalorieDetails({ visible, onClose, consumed, target, bmr, tdee }: { visible: boolean; onClose: () => void; consumed: number; target: number; bmr: number; tdee: number }) {
  const { colors } = useTheme();
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}><Pressable style={[styles.scrim, { backgroundColor: colors.blackScrim }]} onPress={onClose} /><View style={[styles.sheet, { backgroundColor: colors.backgroundSecondary, borderColor: colors.glassBorder }]}><View style={styles.sheetHead}><AppText variant="heading">Дневная энергия</AppText><Pressable onPress={onClose}><AppText>×</AppText></Pressable></View><View style={styles.detailRow}><AppText tone="secondary">Съедено</AppText><AppText style={styles.bold}>{consumed} ккал</AppText></View><View style={styles.detailRow}><AppText tone="secondary">Цель</AppText><AppText style={styles.bold}>{target} ккал</AppText></View><View style={styles.detailRow}><AppText tone="secondary">Базовый обмен</AppText><AppText>{Math.round(bmr)} ккал</AppText></View><View style={styles.detailRow}><AppText tone="secondary">Расход с активностью</AppText><AppText>{Math.round(tdee)} ккал</AppText></View><AppText variant="caption" tone="muted">Цель рассчитана по данным профиля и выбранной цели. Это ориентир, а не медицинская рекомендация.</AppText></View></Modal>;
}

const styles = StyleSheet.create({
  safe: { flex: 1 }, scroll: { flexGrow: 1, paddingTop: spacing.sm, gap: spacing.md }, bold: { fontWeight: '700' },
  next: { flexDirection: 'row', alignItems: 'center', gap: spacing.md }, nextIcon: { width: 44, height: 44, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center' }, nextCopy: { flex: 1, gap: 3 }, sectionTitle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm }, plan: { gap: 0 }, meal: { minHeight: 62, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  flow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md }, flowIcon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  scrim: { ...StyleSheet.absoluteFillObject }, sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, gap: spacing.md, padding: spacing.lg, paddingBottom: spacing.xl, borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl, borderWidth: 1 }, sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, detailRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
});
