import { Pressable, StyleSheet, View } from 'react-native';
import { AppPressable } from './AppPressable';
import { AppIcon } from './AppIcon';
import { AppText } from './AppText';
import { radii } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';
import { getLocalDateKey } from '@/utils/date';

const titleFormatter = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' });
const subtitleFormatter = new Intl.DateTimeFormat('ru-RU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
export function shiftDiaryDate(date: string, amount: number) { const value = new Date(`${date}T12:00:00`); value.setDate(value.getDate() + amount); return getLocalDateKey(value); }
export function formatDiaryDateTitle(date: string) { const today = getLocalDateKey(); if (date === today) return 'Сегодня'; if (date === shiftDiaryDate(today, -1)) return 'Вчера'; if (date === shiftDiaryDate(today, 1)) return 'Завтра'; return titleFormatter.format(new Date(`${date}T12:00:00`)); }
export function formatDiaryDateSubtitle(date: string) { return subtitleFormatter.format(new Date(`${date}T12:00:00`)); }

export function DiaryDateHeader({ date, onChangeDay, onOpenCalendar }: { date: string; onChangeDay: (amount: -1 | 1) => void; onOpenCalendar: () => void }) {
  const { colors } = useTheme();
  return <View testID="diary-date-header" style={styles.dateNav}>
    <Pressable accessibilityRole="button" accessibilityLabel="Предыдущий день" style={[styles.arrow, { backgroundColor: colors.surface }]} onPress={() => onChangeDay(-1)}><View style={styles.previous}><AppIcon name="arrow" color={colors.textPrimary} /></View></Pressable>
    <AppPressable accessibilityRole="button" accessibilityLabel="Открыть календарь" accessibilityHint="Выбрать другую дату" actionLabel="Открыть календарь" haptic="selection" onPress={onOpenCalendar} style={styles.dateCopy} pressedStyle={styles.datePressed}>
      <View style={styles.dateContent}><AppText variant="heading">{formatDiaryDateTitle(date)}</AppText><AppText variant="caption" tone="muted" style={styles.subtitle}>{formatDiaryDateSubtitle(date)}</AppText></View>
    </AppPressable>
    <Pressable accessibilityRole="button" accessibilityLabel="Следующий день" style={[styles.arrow, { backgroundColor: colors.surface }]} onPress={() => onChangeDay(1)}><AppIcon name="arrow" color={colors.textPrimary} /></Pressable>
  </View>;
}

const styles = StyleSheet.create({
  dateNav: { width: '100%', flexDirection: 'row', alignItems: 'center' },
  arrow: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: radii.pill },
  previous: { transform: [{ rotate: '180deg' }] },
  dateCopy: { flex: 1, minHeight: 52 },
  dateContent: { minHeight: 52, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  datePressed: { opacity: 0.86 },
  subtitle: { textAlign: 'center' },
});
