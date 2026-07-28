import { calculateStreaks } from '@/services/flowCalculator';
import { assertDayCompletable } from '@/services/diaryMath';
import type { FlowPreferences, FlowState, FlowPause } from '@/types/domain';
import { canUseFlowPause } from '@/services/flowGoals';
import { createStableUuid } from '@/services/uuid';
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
    const count = await txn.getFirstAsync<{ count: number }>('SELECT COUNT(*) AS count FROM diary_entries WHERE diary_day_id=?', day.id);
    assertDayCompletable({ date, isCompleted: day.is_completed === 1, entryCount: count?.count ?? 0 }, getLocalDateKey());
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

export async function loadFlowPreferences():Promise<FlowPreferences>{const db=await getDatabase();const row=await db.getFirstAsync<{weekly_goal_days:number;pause_tokens:number;total_pauses:number}>('SELECT weekly_goal_days,pause_tokens,total_pauses FROM flow_state WHERE id=1');return{weeklyGoalDays:row?.weekly_goal_days??5,pauseTokens:row?.pause_tokens??0,totalPauses:row?.total_pauses??0};}
export async function setWeeklyFlowGoal(days:number){if(days<1||days>7)throw new Error('Цель должна быть от 1 до 7 дней');const db=await getDatabase();await db.runAsync('UPDATE flow_state SET weekly_goal_days=?,updated_at=? WHERE id=1',days,new Date().toISOString());}
export async function loadFlowPauses():Promise<FlowPause[]>{const db=await getDatabase();const rows=await db.getAllAsync<{id:number;date:string;reason:string;created_at:string}>('SELECT id,date,reason,created_at FROM flow_pauses ORDER BY date DESC');return rows.map((row)=>({id:row.id,date:row.date,reason:row.reason,createdAt:row.created_at}));}
export async function useFlowPause(date:string,reason='День паузы'){const db=await getDatabase();const [preferences,existing]=await Promise.all([loadFlowPreferences(),loadFlowPauses()]);if(!canUseFlowPause(date,existing.map((item)=>item.date),preferences.pauseTokens))throw new Error('День паузы нельзя применить к этой дате');const now=new Date().toISOString();await db.withExclusiveTransactionAsync(async(txn)=>{await txn.runAsync('INSERT INTO flow_pauses(uuid,date,reason,created_at) VALUES(?,?,?,?)',createStableUuid(),date,reason,now);await txn.runAsync('UPDATE flow_state SET pause_tokens=pause_tokens-1,total_pauses=total_pauses+1,updated_at=? WHERE id=1',now);});}
