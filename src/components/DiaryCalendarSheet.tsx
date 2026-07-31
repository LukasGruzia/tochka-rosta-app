import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { cancelAnimation, runOnJS, type SharedValue, useAnimatedStyle, useReducedMotion, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFeatureFlags } from '@/contexts/FeatureFlagsContext';
import { loadCalendarMonth } from '@/database/repositories/calendarRepository';
import { buildMonthGrid, formatMonthTitle, getCalendarAccessibilityLabel, shiftMonth } from '@/services/calendar';
import { safelyRunHaptic } from '@/services/haptics';
import { recordUiAction } from '@/services/uiDiagnostics';
import { useTheme } from '@/theme/ThemeProvider';
import { motion, radii, spacing } from '@/theme/tokens';
import type { CalendarDayStatus } from '@/types/domain';
import { getLocalDateKey } from '@/utils/date';
import { AppText } from './AppText';
import { AppIcon } from './AppIcon';
import { PrimaryButton } from './PrimaryButton';
import { ScreenState } from './ScreenStates';

const weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export function MonthCalendar({ monthKey, selectedDate, statuses, onSelect, onMonthChange, compact = false }: { monthKey: string; selectedDate?: string; statuses: CalendarDayStatus[]; onSelect?: (date: string) => void; onMonthChange?: (month: string) => void; compact?: boolean }) {
  const { colors } = useTheme();
  const today = getLocalDateKey();
  const cells = useMemo(() => buildMonthGrid(monthKey), [monthKey]);
  const statusMap = useMemo(() => new Map(statuses.map((item) => [item.date, item])), [statuses]);
  return <View accessible={false}>
    <View style={styles.week}>{weekdays.map((day) => <AppText key={day} variant="caption" tone="muted" style={styles.weekday}>{day}</AppText>)}</View>
    <View style={styles.grid}>{cells.map((cell) => {
      const status = statusMap.get(cell.date) ?? { date: cell.date, entryCount: 0, isCompleted: false, isPaused: false, isMilestone: false, kind: cell.date < today ? 'missed' : cell.date > today ? 'future' : 'empty' as const };
      const selected = selectedDate === cell.date;
      const isToday = cell.date === today;
      return <Pressable key={cell.date} accessibilityRole="button" accessibilityLabel={getCalendarAccessibilityLabel(cell, status, selected, today)} accessibilityState={{ selected }} onPress={() => { if (!cell.inCurrentMonth) onMonthChange?.(cell.date.slice(0, 7)); onSelect?.(cell.date); }} style={[styles.cell, compact && styles.compactCell, selected && { backgroundColor: colors.greenPrimary }, isToday && !selected && { borderColor: colors.greenBright, borderWidth: 1 }, status.isMilestone && { borderColor: colors.gold, borderWidth: 1 }]}>
        <AppText variant="caption" tone={selected ? 'primary' : cell.inCurrentMonth ? 'secondary' : 'muted'} style={selected && styles.selectedText}>{cell.day}</AppText>
        <View style={styles.markers}>{status.isCompleted ? <AppText style={[styles.flame, { color: status.isMilestone ? colors.gold : colors.greenBright }]}>◆</AppText> : status.entryCount ? <View style={[styles.dot, { backgroundColor: colors.greenBright }]} /> : status.kind === 'missed' ? <View style={[styles.dot, { backgroundColor: colors.textMuted, opacity: 0.35 }]} /> : null}{status.isPaused ? <View style={[styles.pause, { borderColor: colors.gold }]} /> : null}</View>
      </Pressable>;
    })}</View>
  </View>;
}

function CalendarSheetDrag({ children, offset, onClose }: { children: ReactNode; offset: SharedValue<number>; onClose: () => void }) {
  'use no memo';
  const drag = Gesture.Pan().activeOffsetY(12).onBegin(() => {
    cancelAnimation(offset);
  }).onUpdate((event) => {
    offset.set(Math.max(0, event.translationY));
  }).onEnd((event) => {
    if (event.translationY > 90 || event.velocityY > 750) runOnJS(onClose)();
    else offset.set(withSpring(0, motion.spring.soft));
  });
  return <GestureDetector gesture={drag}>{children}</GestureDetector>;
}

function CalendarMonthSwipe({ children, month, onMonthChange }: { children: ReactNode; month: string; onMonthChange: (month: string) => void }) {
  const swipe = Gesture.Pan().activeOffsetX([-18, 18]).failOffsetY([-12, 12]).onEnd((event) => {
    if (Math.abs(event.translationX) > 55) runOnJS(onMonthChange)(shiftMonth(month, event.translationX < 0 ? 1 : -1));
  });
  return <GestureDetector gesture={swipe}><View>{children}</View></GestureDetector>;
}

export function DiaryCalendarSheet({ visible, selectedDate, onClose, onOpen }: { visible: boolean; selectedDate: string; onClose: () => void; onOpen: (date: string) => void }) {
  'use no memo';
  const { colors } = useTheme();
  const { flags } = useFeatureFlags();
  const insets = useSafeAreaInsets();
  const [month, setMonth] = useState(selectedDate.slice(0, 7));
  const [selected, setSelected] = useState(selectedDate);
  const [statuses, setStatuses] = useState<CalendarDayStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const offset = useSharedValue(0);
  const reduced = useReducedMotion();
  useEffect(() => () => cancelAnimation(offset), [offset]);
  useEffect(() => {
    if (visible) {
      recordUiAction('bottom_sheet_opened', 'diary_calendar');
      setSelected(selectedDate);
      setMonth(selectedDate.slice(0, 7));
    }
  }, [selectedDate, visible]);
  useEffect(() => {
    if (!visible) return;
    let active = true;
    setLoading(true);
    setLoadError(null);
    void loadCalendarMonth(month).then((items) => { if (active) setStatuses(items); }).catch((error) => {
      if (!active) return;
      setStatuses([]);
      setLoadError(error instanceof Error ? error.message : 'Не удалось загрузить календарь');
      recordUiAction('error_occurred', 'calendar_load', error instanceof Error ? error.message : 'Calendar load failed');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [month, retryKey, visible]);
  const dismiss = () => { offset.set(0); onClose(); };
  const animated = useAnimatedStyle(() => ({ transform: [{ translateY: reduced ? 0 : offset.get() }] }));
  const calendar = loading ? <View style={styles.calendarLoading}><AppText tone="secondary">Загружаем месяц…</AppText></View> : loadError ? <ScreenState tone="error" icon="calendar" title="Не удалось загрузить календарь" message="Дневник и выбранная дата не изменены." actionLabel="Попробовать снова" onAction={()=>setRetryKey((value)=>value+1)}/> : <MonthCalendar monthKey={month} selectedDate={selected} statuses={statuses} onSelect={(date) => { if (flags.enableHaptics) void safelyRunHaptic('selection'); setSelected(date); }} onMonthChange={setMonth} />;
  const sheet = <Animated.View style={[styles.sheet, { backgroundColor: colors.surfaceSolid, borderColor: colors.glassBorderStrong, paddingBottom: Math.max(24, insets.bottom + 16) }, animated]}>
    <View style={[styles.handle, { backgroundColor: colors.textMuted }]} />
    <View style={styles.header}>
      <Pressable accessibilityRole="button" accessibilityLabel="Предыдущий месяц" style={[styles.arrow, { backgroundColor: colors.surface }]} onPress={() => setMonth(shiftMonth(month, -1))}><View style={styles.previous}><AppIcon name="arrow" color={colors.textPrimary}/></View></Pressable>
      <View style={styles.title}><AppText variant="heading">{formatMonthTitle(month)}</AppText><Pressable onPress={() => { const today = getLocalDateKey(); setSelected(today); setMonth(today.slice(0, 7)); }}><AppText variant="caption" tone="green">Сегодня</AppText></Pressable></View>
      <Pressable accessibilityRole="button" accessibilityLabel="Следующий месяц" style={[styles.arrow, { backgroundColor: colors.surface }]} onPress={() => setMonth(shiftMonth(month, 1))}><AppIcon name="arrow" color={colors.textPrimary}/></Pressable>
    </View>
    {flags.enableSheetGestures ? <CalendarMonthSwipe month={month} onMonthChange={setMonth}>{calendar}</CalendarMonthSwipe> : calendar}
    <View style={styles.legend}><AppText variant="caption" tone="muted">● запись</AppText><AppText variant="caption" tone="muted">◆ закрыт</AppText><AppText variant="caption" style={{ color: colors.gold }}>◇ этап / пауза</AppText></View>
    <PrimaryButton label="Открыть выбранный день" disabled={loading || Boolean(loadError)} onPress={() => { onOpen(selected); dismiss(); }} />
  </Animated.View>;
  return <Modal visible={visible} transparent animationType={reduced ? 'none' : 'fade'} onRequestClose={dismiss}>
    <Pressable style={[styles.scrim, { backgroundColor: colors.blackScrim }]} onPress={dismiss} />
    {flags.enableSheetGestures ? <CalendarSheetDrag offset={offset} onClose={dismiss}>{sheet}</CalendarSheetDrag> : sheet}
  </Modal>;
}

const styles = StyleSheet.create({
  scrim: { ...StyleSheet.absoluteFillObject }, sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, minHeight: '70%', maxHeight: '86%', borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl, borderWidth: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.sm, gap: spacing.md },
  handle: { width: 42, height: 5, borderRadius: 3, alignSelf: 'center', opacity: 0.45 }, header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, arrow: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' }, previous:{transform:[{rotate:'180deg'}]}, title: { alignItems: 'center', gap: 3 },
  week: { flexDirection: 'row' }, weekday: { width: `${100 / 7}%`, textAlign: 'center' }, grid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.xs }, cell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: radii.pill }, compactCell: { aspectRatio: 1.08 }, selectedText: { color: '#031108', fontWeight: '800' },
  markers: { height: 9, flexDirection: 'row', alignItems: 'center', gap: 2 }, dot: { width: 4, height: 4, borderRadius: 2 }, flame: { fontSize: 7 }, pause: { width: 6, height: 6, borderRadius: 3, borderWidth: 1 }, calendarLoading:{minHeight:300,alignItems:'center',justifyContent:'center'},legend: { flexDirection: 'row', justifyContent: 'center', gap: spacing.md },
});
