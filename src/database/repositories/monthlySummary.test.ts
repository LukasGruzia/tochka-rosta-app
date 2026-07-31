import { describe, expect, it, vi } from 'vitest';
import { loadMonthlySummary } from './analyticsRepository';

const state = vi.hoisted(() => ({ filledDays: 18 }));
const db = vi.hoisted(() => ({
  getFirstAsync: vi.fn(async (sql:string) => {
    if (sql.includes('filled_days')) return {filled_days:state.filledDays,completed_days:12,average_protein:124};
    if (sql.includes("meal_type='breakfast'")) return {name:'Сырники'};
    if (sql.includes('MAX(streak_after_completion)')) return {best_streak:7};
    if (sql.includes("feedback_type='accepted'")) return {count:5};
    return null;
  }),
}));

vi.mock('../database',()=>({getDatabase:async()=>db}));
vi.mock('@/utils/date',()=>({getLocalDateKey:()=> '2026-07-31'}));
vi.mock('@/services/historyAnalytics',()=>({calculateHistoryAverages:vi.fn()}));
vi.mock('@/performance/queryProfiler',()=>({profileQuery:async(_label:string,run:()=>unknown)=>run()}));

describe('monthly personal summary',()=>{
  it('uses only real local aggregates',async()=>{
    state.filledDays=18;
    await expect(loadMonthlySummary('2026-07')).resolves.toMatchObject({filledDays:18,completedDays:12,averageProteinG:124,favoriteBreakfast:'Сырники',bestStreak:7,acceptedRhythmRecommendations:5});
  });
  it('does not invent an insight without filled days',async()=>{
    state.filledDays=0;
    await expect(loadMonthlySummary('2026-07')).resolves.toBeNull();
  });
});
