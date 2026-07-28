import { useCallback, useEffect, useState } from 'react';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { CopyDiarySheet } from '@/components/CopyDiarySheet';
import { FilterChip } from '@/components/FilterChip';
import { GlassCard } from '@/components/GlassCard';
import { MacroProgress } from '@/components/MacroProgress';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ProgressRing } from '@/components/ProgressRing';
import { TabScreen } from '@/components/TabScreen';
import { DiaryCalendarSheet } from '@/components/DiaryCalendarSheet';
import { QuickAddButton, QuickAddSheet } from '@/components/QuickAddSheet';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useReducedMotion, useSharedValue, withSpring } from 'react-native-reanimated';
import { mealLabels } from '@/constants/options';
import { useAppStore } from '@/store/appStore';
import { radii, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';
import type { DiaryEntry, MealType } from '@/types/domain';
import { getLocalDateKey } from '@/utils/date';

const mealOrder: MealType[] = ['breakfast', 'lunch', 'snack', 'dinner'];
function shiftDate(date: string, amount: number) { const value = new Date(`${date}T12:00:00`); value.setDate(value.getDate() + amount); return getLocalDateKey(value); }
function formatDate(date: string) { const today = getLocalDateKey(); if (date === today) return 'Сегодня'; if (date === shiftDate(today, -1)) return 'Вчера'; if (date === shiftDate(today, 1)) return 'Завтра'; return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' }).format(new Date(`${date}T12:00:00`)); }

export default function DiaryScreen() {
  const params=useLocalSearchParams<{calendar?:string}>();
  const { colors } = useTheme();
  const diary = useAppStore((state) => state.diary);
  const diaryDate = useAppStore((state) => state.diaryDate);
  const refresh = useAppStore((state) => state.refreshDiary);
  const setDate = useAppStore((state) => state.setDiaryDate);
  const closeDay = useAppStore((state) => state.closeDay);
  const editEntry = useAppStore((state) => state.editDiaryEntry);
  const removeEntry = useAppStore((state) => state.removeDiaryEntry);
  const targetNutrition = useAppStore((state) => state.target);
  const [selected, setSelected] = useState<DiaryEntry | null>(null);
  const [copying, setCopying] = useState(false);
  const [calendar,setCalendar]=useState(false);const[quick,setQuick]=useState(false);const reduced=useReducedMotion();const dragX=useSharedValue(0);
  useEffect(()=>{if(params.calendar==='1')setCalendar(true);},[params.calendar]);
  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));
  const consumed = diary?.consumedCalories ?? 0; const target = diary?.targetCalories ?? 0;
  const remaining = Math.round(target - consumed);
  const changeDay=async(amount:number)=>{await Haptics.selectionAsync();await setDate(shiftDate(diaryDate,amount));};
  const daySwipe=Gesture.Pan().activeOffsetX([-22,22]).failOffsetY([-12,12]).onUpdate((event)=>{dragX.value=event.translationX*.22;}).onEnd((event)=>{if(Math.abs(event.translationX)>60)runOnJS(changeDay)(event.translationX<0?1:-1);dragX.value=withSpring(0,{damping:20,stiffness:220});}).onFinalize(()=>{dragX.value=withSpring(0,{damping:20,stiffness:220});});
  const dateAnimated=useAnimatedStyle(()=>({transform:[{translateX:reduced?0:dragX.value}],opacity:reduced?1:1-Math.min(.16,Math.abs(dragX.value)/180)}));
  const complete = () => Alert.alert('Закрыть день?', 'После закрытия записи этого дня нельзя будет изменить.', [{ text: 'Отмена', style: 'cancel' }, { text: 'Закрыть', onPress: async () => { try { await closeDay(); Alert.alert('День закрыт', 'Поток обновлён — отличная работа.'); } catch (error) { Alert.alert('Не удалось закрыть день', error instanceof Error ? error.message : 'Попробуй ещё раз'); } } }]);
  return <>
    <TabScreen title="Дневник" subtitle="Питание и дневной баланс">
      <GestureDetector gesture={daySwipe}><Animated.View style={[styles.dateNav,dateAnimated]}><Pressable accessibilityLabel="Предыдущий день" style={[styles.arrow, { backgroundColor: colors.surface }]} onPress={() => void changeDay(-1)}><AppText>‹</AppText></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Открыть календарь" onPress={() => setCalendar(true)} style={styles.dateCopy}><AppText variant="heading">{formatDate(diaryDate)}　▣</AppText><AppText variant="caption" tone="muted">{new Intl.DateTimeFormat('ru-RU',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(new Date(`${diaryDate}T12:00:00`))}</AppText></Pressable><Pressable accessibilityLabel="Следующий день" style={[styles.arrow, { backgroundColor: colors.surface }]} onPress={() => void changeDay(1)}><AppText>›</AppText></Pressable></Animated.View></GestureDetector>
      <View style={styles.tools}><Pressable style={[styles.tool, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]} onPress={() => setCopying(true)}><AppText tone="green">⇥</AppText><AppText variant="caption">Копировать</AppText></Pressable><Pressable style={[styles.tool, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]} onPress={() => router.push('/meal-templates' as never)}><AppText tone="green">▦</AppText><AppText variant="caption">Наборы еды</AppText></Pressable></View>
      <GlassCard variant="accent" style={styles.hero}><ProgressRing size={144} progress={target ? consumed / target : 0} value={String(Math.round(consumed))} label={`из ${Math.round(target)} ккал`}/><AppText tone={remaining >= 0 ? 'secondary' : 'warning'}>{remaining >= 0 ? `Осталось ${remaining} ккал` : `Сверх цели ${Math.abs(remaining)} ккал`}</AppText><View style={styles.macroGrid}><MacroProgress label="Б" value={diary?.consumedProteinG ?? 0} target={diary?.targetProteinG ?? 0}/><MacroProgress label="Ж" value={diary?.consumedFatG ?? 0} target={diary?.targetFatG ?? 0} color={colors.gold}/><MacroProgress label="У" value={diary?.consumedCarbsG ?? 0} target={diary?.targetCarbsG ?? 0} color="#60A5FA"/></View></GlassCard>
      {diary?.isCompleted ? <GlassCard variant="compact" selected><AppText variant="heading" tone="green">✓ День закрыт</AppText><AppText tone="secondary">Записи сохранены в истории Потока.</AppText></GlassCard> : null}
      {!diary?.entries.length?<GlassCard variant="compact" style={styles.empty}><View style={[styles.emptyMark,{backgroundColor:colors.greenGlow}]}><AppText tone="green" variant="title">◌</AppText></View><View style={styles.emptyCopy}><AppText variant="heading">Сегодня пока ничего не добавлено</AppText><AppText tone="secondary">Начни с продукта, воды или сохранённого набора.</AppText></View></GlassCard>:null}
      {mealOrder.map((meal) => { const entries = diary?.entries.filter((entry) => entry.mealType === meal) ?? []; const mealCalories = entries.reduce((sum, entry) => sum + entry.calories, 0); return <GlassCard key={meal} variant="compact" style={styles.meal}>
        <View style={styles.mealHeader}><View><AppText variant="heading">{mealLabels[meal]}</AppText><AppText variant="caption" tone="muted">{Math.round(mealCalories)} ккал</AppText></View>{!diary?.isCompleted ? <Pressable accessibilityLabel={`Добавить в ${mealLabels[meal]}`} style={[styles.addButton, { backgroundColor: colors.greenGlow }]} onPress={() => router.push({ pathname: '/food-search' as never, params: { meal, date: diaryDate } } as never)}><AppText tone="green">＋</AppText></Pressable> : null}</View>
        {!entries.length ? <AppText tone="muted">Пока ничего не добавлено</AppText> : entries.map((entry) => <Pressable key={entry.id} disabled={diary?.isCompleted} style={[styles.entry, { borderTopColor: colors.glassBorder }]} onPress={() => setSelected(entry)}><View style={styles.entryCopy}><AppText style={styles.entryName}>{entry.productName}</AppText><AppText variant="caption" tone="secondary">{Math.round(entry.quantityG)} г · Б {entry.proteinG == null ? '—' : entry.proteinG.toFixed(1)} · Ж {entry.fatG == null ? '—' : entry.fatG.toFixed(1)} · У {entry.carbsG == null ? '—' : entry.carbsG.toFixed(1)}</AppText></View><AppText tone="green">{Math.round(entry.calories)}</AppText></Pressable>)}
      </GlassCard>; })}
      {!diary?.isCompleted && diaryDate <= getLocalDateKey() ? <PrimaryButton label="Закрыть день" disabled={!diary?.entries.length} onPress={complete}/> : null}
      {!diary?.isCompleted?<QuickAddButton onPress={()=>setQuick(true)}/>:null}
      <AppText variant="caption" tone="muted">Цель рассчитывается по данным профиля. История хранится локально на устройстве.</AppText>
    </TabScreen>
    <EntryEditor entry={selected} onClose={() => setSelected(null)} onSave={async (entry, meal, grams) => { await editEntry(entry.id, meal, grams / entry.servingSizeG, grams); setSelected(null); }} onDelete={(entry) => Alert.alert('Удалить запись?', entry.productName, [{ text: 'Отмена', style: 'cancel' }, { text: 'Удалить', style: 'destructive', onPress: async () => { await removeEntry(entry.id); setSelected(null); } }])}/>
    {targetNutrition ? <CopyDiarySheet visible={copying} sourceDate={diaryDate} diary={diary} target={targetNutrition} onClose={() => setCopying(false)} onCopied={() => refresh(diaryDate)} /> : null}
    <DiaryCalendarSheet visible={calendar} selectedDate={diaryDate} onClose={()=>setCalendar(false)} onOpen={(date)=>{void setDate(date);}}/>
    <QuickAddSheet visible={quick} onClose={()=>setQuick(false)} date={diaryDate}/>
  </>;
}

function EntryEditor({ entry, onClose, onSave, onDelete }: { entry: DiaryEntry | null; onClose: () => void; onSave: (entry: DiaryEntry, meal: MealType, grams: number) => Promise<void>; onDelete: (entry: DiaryEntry) => void }) {
  const { colors } = useTheme();
  const [meal, setMeal] = useState<MealType>('snack'); const [quantity, setQuantity] = useState('100'); const [saving, setSaving] = useState(false);
  useEffect(() => { if (entry) { setMeal(entry.mealType); setQuantity(String(Math.round(entry.quantityG))); } }, [entry]);
  if (!entry) return null; const grams = Number(quantity.replace(',', '.')) || 0;
  return <Modal visible transparent animationType="slide" onRequestClose={onClose}><Pressable style={[styles.scrim, { backgroundColor: colors.blackScrim }]} onPress={onClose}/><View style={[styles.sheet, { backgroundColor: colors.surfaceSolid, borderColor: colors.glassBorderStrong }]}><ScrollView contentContainerStyle={styles.sheetContent}><AppText variant="heading">Изменить запись</AppText><AppText tone="secondary">{entry.productName}</AppText><View style={styles.chips}>{mealOrder.map((item) => <FilterChip key={item} label={mealLabels[item]} selected={meal === item} onPress={() => setMeal(item)}/>)}</View><View style={[styles.quantity, { backgroundColor: colors.surface }]}><TextInput value={quantity} onChangeText={setQuantity} keyboardType="decimal-pad" style={[styles.input, { color: colors.textPrimary }]}/><AppText tone="secondary">г</AppText></View><PrimaryButton label={saving ? 'Сохраняем…' : 'Сохранить'} disabled={saving || grams <= 0} onPress={async () => { try { setSaving(true); await onSave(entry, meal, grams); } finally { setSaving(false); } }}/><PrimaryButton label="Удалить запись" secondary onPress={() => onDelete(entry)}/><PrimaryButton label="Отмена" secondary onPress={onClose}/></ScrollView></View></Modal>;
}

const styles = StyleSheet.create({ dateNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, arrow: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: radii.pill }, dateCopy: { alignItems: 'center',flex:1 }, tools: { flexDirection: 'row', gap: spacing.sm }, tool: { flex: 1, minHeight: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, borderRadius: radii.md, borderWidth: 1 }, hero: { alignItems: 'center', gap: spacing.md }, macroGrid: { width: '100%', flexDirection: 'row', gap: spacing.sm }, meal: { gap: spacing.md }, mealHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, addButton: { width: 42, height: 42, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center' }, entry: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: spacing.sm }, entryCopy: { flex: 1, gap: 3 }, entryName: { fontWeight: '700' },empty:{flexDirection:'row',alignItems:'center',gap:spacing.md},emptyMark:{width:52,height:52,borderRadius:26,alignItems:'center',justifyContent:'center'},emptyCopy:{flex:1,gap:3}, scrim: { ...StyleSheet.absoluteFillObject }, sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, maxHeight: '80%', borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl, borderWidth: 1 }, sheetContent: { padding: spacing.lg, paddingBottom: 40, gap: spacing.md }, chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }, quantity: { minHeight: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, borderRadius: radii.md }, input: { minWidth: 100, textAlign: 'center', fontSize: 30, fontWeight: '800' } });
