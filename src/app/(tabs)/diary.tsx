import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { AppIcon } from '@/components/AppIcon';
import { DiaryDateHeader, shiftDiaryDate } from '@/components/DiaryDateHeader';
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
import Animated, { cancelAnimation, runOnJS, type SharedValue, useAnimatedStyle, useReducedMotion, useSharedValue, withSpring } from 'react-native-reanimated';
import { mealLabels } from '@/constants/options';
import { useAppStore } from '@/store/appStore';
import { radii, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';
import type { DiaryEntry, MealType } from '@/types/domain';
import { getLocalDateKey } from '@/utils/date';
import { safelyRunHaptic } from '@/services/haptics';
import { useFeatureFlags } from '@/contexts/FeatureFlagsContext';
import { createSectionErrorBoundary } from '@/components/ScreenErrorFallback';
import { useRenderTracker } from '@/performance/renderTracker';

export const ErrorBoundary = createSectionErrorBoundary('DiaryScreen');

const mealOrder: MealType[] = ['breakfast', 'lunch', 'snack', 'dinner'];

function DiaryDateSwipe({children,offset,onChangeDay}:{children:ReactNode;offset:SharedValue<number>;onChangeDay:(amount:number)=>void}){'use no memo';const gesture=Gesture.Pan().activeOffsetX([-22,22]).failOffsetY([-12,12]).onBegin(()=>{cancelAnimation(offset);}).onUpdate((event)=>{offset.set(event.translationX*.22);}).onEnd((event)=>{if(Math.abs(event.translationX)>60)runOnJS(onChangeDay)(event.translationX<0?1:-1);offset.set(withSpring(0,{damping:20,stiffness:220}));}).onFinalize(()=>{offset.set(withSpring(0,{damping:20,stiffness:220}));});return <GestureDetector gesture={gesture}>{children}</GestureDetector>;}

export default function DiaryScreen() {
  useRenderTracker('DiaryScreen');
  const params=useLocalSearchParams<{calendar?:string}>();
  const { colors } = useTheme();
  const { flags } = useFeatureFlags();
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
  const changeDay=async(amount:number)=>{if(flags.enableHaptics)void safelyRunHaptic('selection');await setDate(shiftDiaryDate(diaryDate,amount));};
  const dateAnimated=useAnimatedStyle(()=>{const current=dragX.get();return{transform:[{translateX:reduced?0:current}],opacity:reduced?1:1-Math.min(.16,Math.abs(current)/180)};});
  const complete = () => Alert.alert('Закрыть день?', 'После закрытия записи этого дня нельзя будет изменить.', [{ text: 'Отмена', style: 'cancel' }, { text: 'Закрыть', onPress: async () => { try { await closeDay(); if (flags.enableHaptics) await safelyRunHaptic('success'); Alert.alert('Поток продолжается', 'День закрыт, а огонёк стал ярче.'); } catch (error) { Alert.alert('Не удалось закрыть день', error instanceof Error ? error.message : 'Попробуй ещё раз'); } } }]);
  const dateControl=<Animated.View style={dateAnimated}><DiaryDateHeader date={diaryDate} onChangeDay={(amount)=>{void changeDay(amount);}} onOpenCalendar={()=>setCalendar(true)}/></Animated.View>;
  return <>
    <TabScreen title="Дневник" subtitle="Питание и дневной баланс">
      {flags.enableSheetGestures?<DiaryDateSwipe offset={dragX} onChangeDay={(amount)=>{void changeDay(amount);}}>{dateControl}</DiaryDateSwipe>:dateControl}
      <View style={styles.tools}><Pressable accessibilityRole="button" accessibilityLabel="Копировать дневник" style={[styles.tool, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]} onPress={() => setCopying(true)}><AppIcon name="copy" size={20} color={colors.greenBright}/><AppText variant="caption">Копировать</AppText></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Открыть наборы еды" style={[styles.tool, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]} onPress={() => router.push('/meal-templates' as never)}><AppIcon name="collection" size={20} color={colors.greenBright}/><AppText variant="caption">Наборы еды</AppText></Pressable></View>
      <GlassCard variant="accent" style={styles.hero}><ProgressRing size={144} progress={target ? consumed / target : 0} value={String(Math.round(consumed))} label={`из ${Math.round(target)} ккал`}/><AppText tone={remaining >= 0 ? 'secondary' : 'warning'}>{remaining >= 0 ? `Осталось ${remaining} ккал` : `Сверх цели ${Math.abs(remaining)} ккал`}</AppText><View style={styles.macroGrid}><MacroProgress label="Б" value={diary?.consumedProteinG ?? 0} target={diary?.targetProteinG ?? 0}/><MacroProgress label="Ж" value={diary?.consumedFatG ?? 0} target={diary?.targetFatG ?? 0} color={colors.gold}/><MacroProgress label="У" value={diary?.consumedCarbsG ?? 0} target={diary?.targetCarbsG ?? 0} color="#60A5FA"/></View></GlassCard>
      {diary?.isCompleted ? <GlassCard variant="compact" selected><View style={styles.closedTitle}><AppIcon name="check" size={20} color={colors.greenBright}/><AppText variant="heading" tone="green">День закрыт</AppText></View><AppText tone="secondary">Записи сохранены в истории Потока.</AppText></GlassCard> : null}
      {!diary?.entries.length?<GlassCard variant="compact" style={styles.empty}><View style={[styles.emptyMark,{backgroundColor:colors.greenGlow}]}><AppIcon name="diary" size={26} color={colors.greenBright}/></View><View style={styles.emptyCopy}><AppText variant="heading">Сегодня пока ничего не добавлено</AppText><AppText tone="secondary">Начни с продукта, воды или сохранённого набора.</AppText></View></GlassCard>:null}
      {mealOrder.map((meal) => { const entries = diary?.entries.filter((entry) => entry.mealType === meal) ?? []; const mealCalories = entries.reduce((sum, entry) => sum + entry.calories, 0); return <GlassCard key={meal} variant="compact" style={styles.meal}>
        <View style={styles.mealHeader}><View><AppText variant="heading">{mealLabels[meal]}</AppText><AppText variant="caption" tone="muted">{Math.round(mealCalories)} ккал</AppText></View>{!diary?.isCompleted ? <Pressable accessibilityRole="button" accessibilityLabel={`Добавить в ${mealLabels[meal]}`} style={[styles.addButton, { backgroundColor: colors.greenGlow }]} onPress={() => router.push({ pathname: '/food-search' as never, params: { meal, date: diaryDate } } as never)}><AppIcon name="add" color={colors.greenBright}/></Pressable> : null}</View>
        {!entries.length ? <AppText tone="muted">Пока ничего не добавлено</AppText> : entries.map((entry) => <Pressable key={entry.id} disabled={diary?.isCompleted} style={[styles.entry, { borderTopColor: colors.glassBorder }]} onPress={() => setSelected(entry)}><View style={styles.entryCopy}><AppText style={styles.entryName}>{entry.productName}</AppText><AppText variant="caption" tone="secondary">{Math.round(entry.quantityG)} г · Б {entry.proteinG == null ? '—' : entry.proteinG.toFixed(1)} · Ж {entry.fatG == null ? '—' : entry.fatG.toFixed(1)} · У {entry.carbsG == null ? '—' : entry.carbsG.toFixed(1)}</AppText></View><AppText tone="green">{Math.round(entry.calories)}</AppText></Pressable>)}
      </GlassCard>; })}
      {!diary?.isCompleted && diaryDate <= getLocalDateKey() ? <PrimaryButton label="Закрыть день" disabled={!diary?.entries.length} onPress={complete}/> : null}
      <PrimaryButton label="Открыть баланс дня" secondary onPress={()=>router.push('/day-balance' as never)}/>
      {!diary?.isCompleted?<QuickAddButton onPress={()=>setQuick(true)}/>:null}
      <AppText variant="caption" tone="muted">Цель рассчитывается по данным профиля. История хранится локально на устройстве.</AppText>
    </TabScreen>
    {selected ? <EntryEditor entry={selected} onClose={() => setSelected(null)} onSave={async (entry, meal, grams) => { await editEntry(entry.id, meal, grams / entry.servingSizeG, grams); setSelected(null); }} onDelete={(entry) => Alert.alert('Удалить запись?', entry.productName, [{ text: 'Отмена', style: 'cancel' }, { text: 'Удалить', style: 'destructive', onPress: async () => { await removeEntry(entry.id); setSelected(null); } }])}/> : null}
    {targetNutrition && copying ? <CopyDiarySheet visible sourceDate={diaryDate} diary={diary} target={targetNutrition} onClose={() => setCopying(false)} onCopied={() => refresh(diaryDate)} /> : null}
    {calendar ? <DiaryCalendarSheet visible selectedDate={diaryDate} onClose={()=>setCalendar(false)} onOpen={(date)=>{void setDate(date);}}/> : null}
    {quick ? <QuickAddSheet visible onClose={()=>setQuick(false)} date={diaryDate}/> : null}
  </>;
}

function EntryEditor({ entry, onClose, onSave, onDelete }: { entry: DiaryEntry; onClose: () => void; onSave: (entry: DiaryEntry, meal: MealType, grams: number) => Promise<void>; onDelete: (entry: DiaryEntry) => void }) {
  const { colors } = useTheme();
  const [meal, setMeal] = useState<MealType>('snack'); const [quantity, setQuantity] = useState('100'); const [saving, setSaving] = useState(false);
  useEffect(() => { if (entry) { setMeal(entry.mealType); setQuantity(String(Math.round(entry.quantityG))); } }, [entry]);
  const grams = Number(quantity.replace(',', '.')) || 0;
  return <Modal visible transparent animationType="slide" onRequestClose={onClose}><Pressable style={[styles.scrim, { backgroundColor: colors.blackScrim }]} onPress={onClose}/><View style={[styles.sheet, { backgroundColor: colors.surfaceSolid, borderColor: colors.glassBorderStrong }]}><ScrollView contentContainerStyle={styles.sheetContent}><AppText variant="heading">Изменить запись</AppText><AppText tone="secondary">{entry.productName}</AppText><View style={styles.chips}>{mealOrder.map((item) => <FilterChip key={item} label={mealLabels[item]} selected={meal === item} onPress={() => setMeal(item)}/>)}</View><View style={[styles.quantity, { backgroundColor: colors.surface }]}><TextInput value={quantity} onChangeText={setQuantity} keyboardType="decimal-pad" style={[styles.input, { color: colors.textPrimary }]}/><AppText tone="secondary">г</AppText></View><PrimaryButton label={saving ? 'Сохраняем…' : 'Сохранить'} disabled={saving || grams <= 0} onPress={async () => { try { setSaving(true); await onSave(entry, meal, grams); } finally { setSaving(false); } }}/><PrimaryButton label="Удалить запись" secondary onPress={() => onDelete(entry)}/><PrimaryButton label="Отмена" secondary onPress={onClose}/></ScrollView></View></Modal>;
}

const styles = StyleSheet.create({ tools: { flexDirection: 'row', gap: spacing.sm }, tool: { flex: 1, minHeight: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, borderRadius: radii.md, borderWidth: 1 }, hero: { alignItems: 'center', gap: spacing.md }, macroGrid: { width: '100%', flexDirection: 'row', gap: spacing.sm }, meal: { gap: spacing.md }, mealHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, addButton: { width: 44, height: 44, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center' }, closedTitle:{flexDirection:'row',alignItems:'center',gap:spacing.xs}, entry: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: spacing.sm }, entryCopy: { flex: 1, gap: 3 }, entryName: { fontWeight: '700' },empty:{flexDirection:'row',alignItems:'center',gap:spacing.md},emptyMark:{width:52,height:52,borderRadius:26,alignItems:'center',justifyContent:'center'},emptyCopy:{flex:1,gap:3}, scrim: { ...StyleSheet.absoluteFillObject }, sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, maxHeight: '80%', borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl, borderWidth: 1 }, sheetContent: { padding: spacing.lg, paddingBottom: 40, gap: spacing.md }, chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }, quantity: { minHeight: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, borderRadius: radii.md }, input: { minWidth: 100, textAlign: 'center', fontSize: 30, fontWeight: '800' } });
