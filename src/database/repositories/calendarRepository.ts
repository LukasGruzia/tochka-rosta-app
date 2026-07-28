import type { CalendarDayStatus } from '@/types/domain';
import { getLocalDateKey } from '@/utils/date';
import { profileQuery } from '@/performance/queryProfiler';
import { getDatabase } from '../database';

const MAX_CACHED_MONTHS = 4;
const monthCache = new Map<string, Promise<CalendarDayStatus[]>>();

function monthBounds(monthKey: string) { const [year, month] = monthKey.split('-').map(Number); const start = getLocalDateKey(new Date(year, month - 1, 1, 12)); const end = getLocalDateKey(new Date(year, month, 0, 12)); return { start, end }; }

async function queryCalendarMonth(monthKey: string): Promise<CalendarDayStatus[]> {
  const db = await getDatabase();
  const { start, end } = monthBounds(monthKey);
  return profileQuery('calendar:month', async () => {
    const [days, pauses] = await Promise.all([
      db.getAllAsync<{ date: string; is_completed: number; entry_count: number; streak_after_completion: number | null }>(`SELECT d.date,d.is_completed,COUNT(e.id) AS entry_count,fh.streak_after_completion FROM diary_days d LEFT JOIN diary_entries e ON e.diary_day_id=d.id AND e.deleted_at IS NULL LEFT JOIN flow_history fh ON fh.date=d.date AND fh.deleted_at IS NULL WHERE d.date BETWEEN ? AND ? GROUP BY d.id ORDER BY d.date`, start, end),
      db.getAllAsync<{ date: string }>('SELECT date FROM flow_pauses WHERE date BETWEEN ? AND ?', start, end),
    ]);
    const pauseSet = new Set(pauses.map((row) => row.date));
    const today = getLocalDateKey();
    return days.map((row) => {
      const entryCount = row.entry_count ?? 0; const isCompleted = row.is_completed === 1; const isPaused = pauseSet.has(row.date);
      const kind: CalendarDayStatus['kind'] = isCompleted ? 'completed' : entryCount ? 'filled' : row.date < today ? 'missed' : row.date > today ? 'future' : 'empty';
      return { date: row.date, entryCount, isCompleted, isPaused, isMilestone: [3, 7, 14, 30, 60].includes(row.streak_after_completion ?? 0), kind };
    });
  });
}

export function loadCalendarMonth(monthKey: string): Promise<CalendarDayStatus[]> {
  const existing = monthCache.get(monthKey);
  if (existing) return existing;
  const request = queryCalendarMonth(monthKey).catch((error) => { monthCache.delete(monthKey); throw error; });
  monthCache.set(monthKey, request);
  while (monthCache.size > MAX_CACHED_MONTHS) monthCache.delete(monthCache.keys().next().value as string);
  return request;
}

export function invalidateCalendarMonth(dateOrMonth: string) { monthCache.delete(dateOrMonth.slice(0, 7)); }
export function clearCalendarCache() { monthCache.clear(); }
export function getCalendarCacheSize() { return monthCache.size; }

export async function loadWeeklyFlowSummary(start: string, end: string) {
  const db = await getDatabase();
  const row = await profileQuery('flow:weekly_summary', () => db.getFirstAsync<{ closed_days: number; entry_count: number; avg_accuracy: number; avg_protein: number }>(`SELECT SUM(CASE WHEN d.is_completed=1 THEN 1 ELSE 0 END) AS closed_days,COUNT(e.id) AS entry_count,AVG(CASE WHEN d.target_calories>0 AND d.consumed_calories>0 THEN MAX(0,100-ABS(d.consumed_calories-d.target_calories)*100.0/d.target_calories) END) AS avg_accuracy,AVG(CASE WHEN d.consumed_calories>0 THEN d.consumed_protein_g END) AS avg_protein FROM diary_days d LEFT JOIN diary_entries e ON e.diary_day_id=d.id AND e.deleted_at IS NULL WHERE d.date BETWEEN ? AND ?`, start, end));
  return { closedDays: row?.closed_days ?? 0, entryCount: row?.entry_count ?? 0, averageAccuracy: row?.avg_accuracy ?? 0, averageProtein: row?.avg_protein ?? 0 };
}
