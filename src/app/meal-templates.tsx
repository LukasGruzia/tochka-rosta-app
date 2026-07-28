import { useCallback, useEffect, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { AppText } from '@/components/AppText';
import { FilterChip } from '@/components/FilterChip';
import { FormField } from '@/components/FormField';
import { GlassCard } from '@/components/GlassCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { TabScreen } from '@/components/TabScreen';
import { mealLabels } from '@/constants/options';
import { deleteMealTemplate, loadMealTemplates, saveMealTemplate } from '@/database/repositories/mealTemplateRepository';
import { getMealTemplateCalories } from '@/services/mealOperations';
import { useAppStore } from '@/store/appStore';
import { useTheme } from '@/theme/ThemeProvider';
import { radii, spacing } from '@/theme/tokens';
import type { MealTemplate, MealTemplateItem, MealType } from '@/types/domain';

const meals: MealType[] = ['breakfast', 'lunch', 'snack', 'dinner'];

export default function MealTemplatesScreen() {
  const diary = useAppStore((state) => state.diary); const products = useAppStore((state) => state.products); const addToDiary = useAppStore((state) => state.addToDiary); const diaryDate = useAppStore((state) => state.diaryDate); const ensureProductsLoaded = useAppStore((state) => state.ensureProductsLoaded);
  const { colors } = useTheme(); const [templates, setTemplates] = useState<MealTemplate[]>([]); const [creating, setCreating] = useState(false); const [name, setName] = useState(''); const [meal, setMeal] = useState<MealType>('breakfast'); const [busy, setBusy] = useState<number | null>(null);
  const refresh = useCallback(async () => setTemplates(await loadMealTemplates()), []); useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));
  useEffect(() => { if (creating) { setName(`${mealLabels[meal]} · мой набор`); void ensureProductsLoaded(); } }, [creating, ensureProductsLoaded, meal]);

  const currentItems = (): MealTemplateItem[] => (diary?.entries.filter((entry) => entry.mealType === meal) ?? []).flatMap((entry) => { const product = products.find((item) => item.id === entry.productId); return product ? [{ product, mealType: meal, servings: entry.servings, quantityG: entry.quantityG }] : []; });
  const save = async () => { try { await saveMealTemplate({ name, defaultMealType: meal, items: currentItems() }); setCreating(false); await refresh(); } catch (error) { Alert.alert('Не удалось создать набор', error instanceof Error ? error.message : 'Проверь данные.'); } };
  const apply = async (template: MealTemplate) => { if (busy !== null) return; try { setBusy(template.id); for (const item of template.items) await addToDiary({ product: item.product, mealType: item.mealType, servings: item.servings, quantityG: item.quantityG, date: diaryDate }); Alert.alert('Набор добавлен', `${template.name} · ${diaryDate}`); } catch (error) { Alert.alert('Не удалось добавить набор', error instanceof Error ? error.message : 'Попробуй ещё раз.'); } finally { setBusy(null); } };
  const remove = (template: MealTemplate) => Alert.alert('Удалить набор?', template.name, [{ text: 'Отмена', style: 'cancel' }, { text: 'Удалить', style: 'destructive', onPress: () => { void deleteMealTemplate(template.id).then(refresh); } }]);

  return <>
    <TabScreen title="Наборы еды" subtitle="Повторяющиеся приёмы пищи в одно касание" headerRight={<Pressable onPress={() => router.back()} style={[styles.close, { backgroundColor: colors.surface }]}><AppText>×</AppText></Pressable>}>
      <PrimaryButton label="Сохранить текущий приём пищи" onPress={() => setCreating(true)} />
      {templates.length ? templates.map((template) => <GlassCard key={template.id} variant="compact" onPress={() => { void apply(template); }} accessibilityLabel={`Добавить набор ${template.name}`}><View style={styles.templateHead}><View style={styles.copy}><AppText variant="heading">{template.name}</AppText><AppText variant="caption" tone="secondary">{mealLabels[template.defaultMealType]} · {template.items.length} позиций · {getMealTemplateCalories(template.items)} ккал</AppText></View><AppText tone={busy === template.id ? 'muted' : 'green'}>{busy === template.id ? '…' : '+'}</AppText></View><Pressable onPress={() => remove(template)} hitSlop={8}><AppText variant="caption" tone="muted">Удалить набор</AppText></Pressable></GlassCard>) : <GlassCard><AppText variant="heading">Наборов пока нет</AppText><AppText tone="secondary">Заполни любой приём пищи в дневнике и сохрани его как набор. Потом всё добавится одним нажатием.</AppText></GlassCard>}
    </TabScreen>
    <Modal visible={creating} transparent animationType="slide" onRequestClose={() => setCreating(false)}><View style={[styles.scrim, { backgroundColor: colors.blackScrim }]}><View style={[styles.sheet, { backgroundColor: colors.backgroundSecondary, borderColor: colors.glassBorder }]}><View style={styles.sheetHead}><AppText variant="heading">Новый набор</AppText><Pressable onPress={() => setCreating(false)}><AppText>×</AppText></Pressable></View><AppText tone="secondary">Будут сохранены позиции выбранного приёма пищи за {diaryDate}.</AppText><View style={styles.chips}>{meals.map((item) => <FilterChip key={item} label={mealLabels[item]} selected={meal === item} onPress={() => setMeal(item)} />)}</View><FormField label="Название" value={name} onChangeText={setName} /><AppText variant="caption" tone={currentItems().length ? 'green' : 'warning'}>{currentItems().length ? `${currentItems().length} позиций готовы к сохранению` : 'В этом приёме пока нет подходящих позиций'}</AppText><PrimaryButton label="Сохранить набор" disabled={!currentItems().length} onPress={save} /><PrimaryButton label="Отмена" secondary onPress={() => setCreating(false)} /></View></View></Modal>
  </>;
}

const styles = StyleSheet.create({
  close: { width: 42, height: 42, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center' }, templateHead: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' }, copy: { flex: 1, gap: spacing.xs },
  scrim: { flex: 1, justifyContent: 'flex-end' }, sheet: { gap: spacing.md, padding: spacing.lg, paddingBottom: spacing.xl, borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl, borderWidth: 1 }, sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
