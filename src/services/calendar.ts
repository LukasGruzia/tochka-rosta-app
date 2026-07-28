import type { CalendarDayStatus } from '@/types/domain';
import { getLocalDateKey } from '@/utils/date';

export interface CalendarCell { date: string; day: number; inCurrentMonth: boolean; }

export function parseLocalDate(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
}

export function shiftLocalDate(dateKey: string, days: number) {
  const date = parseLocalDate(dateKey); date.setDate(date.getDate() + days); return getLocalDateKey(date);
}
export function getWeekStart(dateKey=getLocalDateKey()){const date=parseLocalDate(dateKey);const offset=(date.getDay()+6)%7;date.setDate(date.getDate()-offset);return getLocalDateKey(date);}

export function shiftMonth(monthKey: string, amount: number) {
  const [year, month] = monthKey.split('-').map(Number); return getLocalDateKey(new Date(year, month - 1 + amount, 1, 12)).slice(0, 7);
}

export function formatMonthTitle(monthKey: string) {
  const [year, month] = monthKey.split('-').map(Number);
  const value = new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' }).format(new Date(year, month - 1, 1, 12));
  return value.charAt(0).toLocaleUpperCase('ru-RU') + value.slice(1);
}

export function buildMonthGrid(monthKey: string): CalendarCell[] {
  const [year, month] = monthKey.split('-').map(Number); const first = new Date(year, month - 1, 1, 12); const mondayOffset = (first.getDay() + 6) % 7;
  const start = new Date(year, month - 1, 1 - mondayOffset, 12);
  return Array.from({ length: 42 }, (_, index) => { const date = new Date(start); date.setDate(start.getDate() + index); const key = getLocalDateKey(date); return { date: key, day: date.getDate(), inCurrentMonth: date.getMonth() === month - 1 }; });
}

export function getCalendarAccessibilityLabel(cell: CalendarCell, status: CalendarDayStatus | undefined, selected: boolean, today = getLocalDateKey()) {
  const date = new Intl.DateTimeFormat('ru-RU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(parseLocalDate(cell.date));
  const states = [selected ? 'выбрано' : '', cell.date === today ? 'сегодня' : '', status?.isCompleted ? 'день закрыт' : status?.entryCount ? 'есть записи' : '', status?.isPaused ? 'день паузы' : '', status?.isMilestone ? 'этап Потока' : ''].filter(Boolean);
  return `${date}${states.length ? `, ${states.join(', ')}` : ''}`;
}
