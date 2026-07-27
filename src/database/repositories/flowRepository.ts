import { calculateStreaks } from '@/services/flowCalculator';
import type { FlowState } from '@/types/domain';
import { getLocalDateKey } from '@/utils/date';
import { getDatabase } from '../database';

export async function loadFlowState(): Promise<FlowState> {
  const db = await getDatabase();
  const dates = await db.getAllAsync<{ date: string }>('SELECT date FROM diary_days WHERE is_completed=1 ORDER BY date');
  const calculated = calculateStreaks(dates.map((item) => item.date));
  const row = await db.getFirstAsync<{ longest_streak: number; last_completed_date: string | null }>('SELECT longest_streak, last_completed_date FROM flow_state WHERE id=1');
  return {
    currentStreak: calculated.currentStreak,
    longestStreak: Math.max(calculated.longestStreak, row?.longest_streak ?? 0),
    completedDays: dates.length,
    completedDates: dates.map((item) => item.date),
    lastCompletedDate: calculated.lastCompletedDate ?? row?.last_completed_date ?? null,
  };
}

export async function completeDiaryDay(date: string) {
  if (date > getLocalDateKey()) throw new Error('Будущий день закрыть нельзя');
  const db = await getDatabase();
  await db.withExclusiveTransactionAsync(async (txn) => {
    const day = await txn.getFirstAsync<{ id: number; is_completed: number }>('SELECT id, is_completed FROM diary_days WHERE date=?', date);
    if (!day) throw new Error('День не найден');
    if (day.is_completed) throw new Error('Этот день уже закрыт');
    const count = await txn.getFirstAsync<{ count: number }>('SELECT COUNT(*) AS count FROM diary_entries WHERE diary_day_id=?', day.id);
    if (!count?.count) throw new Error('Добавь хотя бы одно блюдо перед закрытием дня');
    const completedDates = await txn.getAllAsync<{ date: string }>('SELECT date FROM diary_days WHERE is_completed=1 UNION SELECT ? AS date ORDER BY date', date);
    const streaks = calculateStreaks(completedDates.map((item) => item.date), getLocalDateKey());
    const now = new Date().toISOString();
    await txn.runAsync('UPDATE diary_days SET is_completed=1, completed_at=?, updated_at=? WHERE id=?', now, now, day.id);
    await txn.runAsync(`INSERT INTO flow_history (date, was_completed, streak_after_completion, created_at) VALUES (?, 1, ?, ?)
      ON CONFLICT(date) DO UPDATE SET streak_after_completion=excluded.streak_after_completion`, date, streaks.currentStreak, now);
    await txn.runAsync(`UPDATE flow_state SET current_streak=?, longest_streak=MAX(longest_streak, ?), last_completed_date=?, updated_at=? WHERE id=1`,
      streaks.currentStreak, streaks.longestStreak, streaks.lastCompletedDate, now);
  });
  return loadFlowState();
}

export async function resetFlow() {
  const db = await getDatabase();
  await db.execAsync(`DELETE FROM flow_history;
    UPDATE diary_days SET is_completed=0, completed_at=NULL;
    UPDATE flow_state SET current_streak=0, longest_streak=0, last_completed_date=NULL, updated_at=CURRENT_TIMESTAMP WHERE id=1;`);
}
