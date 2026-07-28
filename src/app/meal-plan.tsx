import { useCallback, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { FilterChip } from '@/components/FilterChip';
import { QuickAddButton, QuickAddSheet } from '@/components/QuickAddSheet';
import { AppText } from '@/components/AppText';
import { GlassCard } from '@/components/GlassCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { TabScreen } from '@/components/TabScreen';
import { mealLabels } from '@/constants/options';
import { markMealPlanItemAdded } from '@/database/repositories/mealPlanRepository';
import { useAppStore } from '@/store/appStore';
import { colors, radii, spacing } from '@/theme/tokens';
import type { MealPlanItem } from '@/types/domain';

export default function MealPlanScreen() {
  const { diaryDate, mealPlan, generatePlan, loadPlan, resetPlan, addToDiary } = useAppStore(); const [busy, setBusy] = useState(false);const[quick,setQuick]=useState(false);const[meals,setMeals]=useState<3|4|5>(4);const[mode,setMode]=useState<'mixed'|'budget'|'highProtein'|'quick'>('mixed');
  useFocusEffect(useCallback(() => { void loadPlan(); }, [loadPlan]));
  const generate = async () => { try { setBusy(true); await generatePlan(undefined,undefined,{mealsPerDay:meals,mode}); } catch (error) { Alert.alert('Не удалось собрать рацион', error instanceof Error ? error.message : 'Попробуй позже'); } finally { setBusy(false); } };
  const addItem = async (item: MealPlanItem) => { if (item.isAddedToDiary) return; await addToDiary({ date: diaryDate, product: item.product, mealType: item.mealType, servings: item.servings }); if (item.id) await markMealPlanItemAdded(item.id); await loadPlan(); };
  const addAll = async () => { if (!mealPlan) return; try { setBusy(true); for (const item of mealPlan.items.filter((value) => !value.isAddedToDiary)) await addItem(item); Alert.alert('Готово', 'Рацион добавлен в дневник.'); } finally { setBusy(false); } };
  return <><TabScreen title="Рацион на день" subtitle={`${diaryDate} · локальная рекомендация`} headerRight={<Pressable style={styles.close} onPress={() => router.back()}><AppText>×</AppText></Pressable>}>
    <GlassCard variant="compact"><AppText variant="heading">Настройки плана</AppText><View style={styles.options}>{([3,4,5]as const).map((count)=><FilterChip key={count} label={`${count} приёма`} selected={meals===count} onPress={()=>setMeals(count)}/>)}</View><View style={styles.options}>{([['mixed','Смешанный'],['budget','Бюджетный'],['highProtein','Высокобелковый'],['quick','Быстрый']]as const).map(([value,label])=><FilterChip key={value} label={label} selected={mode===value} onPress={()=>setMode(value)}/>)}</View><Pressable onPress={()=>router.push('/nutrition-budget' as never)}><AppText variant="caption" tone="green">Настроить бюджет питания</AppText></Pressable></GlassCard>
    {!mealPlan ? <GlassCard variant="accent" style={styles.empty}><AppText variant="heading">Собрать сбалансированный день</AppText><AppText tone="secondary" style={styles.center}>Рацион учитывает твою цель, ограничения, теги приёмов пищи и дневную норму. Никакие данные не отправляются в интернет.</AppText><PrimaryButton label={busy ? 'Собираем…' : 'Собрать рацион'} disabled={busy} onPress={generate}/></GlassCard> : <>
      <GlassCard variant="accent" style={styles.summary}><AppText variant="caption" tone="green">ИТОГО</AppText><AppText variant="title">{Math.round(mealPlan.calories)} ккал</AppText><AppText tone="secondary">Б {Math.round(mealPlan.proteinG)} · Ж {Math.round(mealPlan.fatG)} · У {Math.round(mealPlan.carbsG)}</AppText>{mealPlan.price > 0 ? <AppText variant="caption" tone="muted">Ориентировочно {Math.round(mealPlan.price)} ₽</AppText> : null}</GlassCard>
      {mealPlan.items.map((item) => <GlassCard key={`${item.mealType}-${item.product.id}`} variant="compact"><View style={styles.row}><View style={styles.copy}><AppText variant="caption" tone="green">{mealLabels[item.mealType].toUpperCase()}</AppText><AppText style={styles.name}>{item.product.name}</AppText><AppText variant="caption" tone="secondary">{Math.round(item.product.calories * item.servings)} ккал · {Math.round(item.product.servingSizeG * item.servings)} г</AppText></View><Pressable disabled={item.isAddedToDiary} style={[styles.add, item.isAddedToDiary && styles.done]} onPress={() => void addItem(item)}><AppText tone="green">{item.isAddedToDiary ? '✓' : '＋'}</AppText></Pressable></View></GlassCard>)}
      <PrimaryButton label="Добавить всё в дневник" disabled={busy || mealPlan.items.every((item) => item.isAddedToDiary)} onPress={addAll}/><PrimaryButton label="Собрать заново" secondary onPress={async () => { await resetPlan(); await generate(); }}/><AppText variant="caption" tone="muted">Это ориентир, а не медицинская рекомендация. Любое блюдо можно заменить вручную через каталог.</AppText>
    </>}
    <QuickAddButton onPress={()=>setQuick(true)}/><PrimaryButton label="Добавить в недельный план" secondary onPress={()=>router.push('/my-week' as never)}/>
  </TabScreen><QuickAddSheet visible={quick} onClose={()=>setQuick(false)} date={diaryDate}/></>;
}
const styles = StyleSheet.create({ close: { width: 42, height: 42, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface }, empty: { gap: spacing.lg, alignItems: 'center' }, center: { textAlign: 'center' }, summary: { alignItems: 'center', gap: spacing.xs }, row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md }, copy: { flex: 1, gap: spacing.xs }, name: { fontWeight: '700' }, add: { width: 46, height: 46, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.greenGlow }, done: { opacity: 0.55 },options:{flexDirection:'row',flexWrap:'wrap',gap:spacing.xs,marginTop:spacing.sm} });
