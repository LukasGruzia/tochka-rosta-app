import { loadBudgetSettings } from '@/database/repositories/budgetRepository';
import type { DiarySummary, FlowState, NutritionResult, ProfileDraft } from '@/types/domain';
import { createRhythmContextHash } from '../algorithms/contextHash';
import { loadRecentRhythmState } from '../repositories/rhythmRepository';
import type { RhythmContext } from '../types/rhythm';

interface ContextInput { route:string;profile:ProfileDraft|null;target:NutritionResult|null;diary:DiarySummary|null;flow:FlowState|null;performanceMode:string;reducedMotion:boolean; }

export async function collectRhythmContext(input:ContextInput):Promise<RhythmContext>{
  const [budget,recent]=await Promise.all([loadBudgetSettings(),loadRecentRhythmState()]);
  const remaining=input.diary?{calories:Math.max(0,input.diary.targetCalories-input.diary.consumedCalories),proteinG:Math.max(0,input.diary.targetProteinG-input.diary.consumedProteinG),fatG:Math.max(0,input.diary.targetFatG-input.diary.consumedFatG),carbsG:Math.max(0,input.diary.targetCarbsG-input.diary.consumedCarbsG)}:null;
  const mealCounts=input.diary?.entries.reduce<RhythmContext['mealCounts']>((counts,item)=>({...counts,[item.mealType]:(counts[item.mealType]??0)+1}),{})??{};
  const contextHash=createRhythmContextHash({route:input.route,date:input.diary?.date,target:input.target,remaining,mealCounts,streak:input.flow?.currentStreak,budget});
  return{now:new Date().toISOString(),...input,budget,remaining,mealCounts,...recent,contextHash};
}

