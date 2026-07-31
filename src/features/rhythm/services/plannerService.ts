import type { BudgetSettings, MealType, NutritionResult, Product, ProfileDraft } from '@/types/domain';
import { buildRhythmDayPlans } from '../algorithms/beamMealPlanner';
import { createRhythmContextHash } from '../algorithms/contextHash';
import { matchRhythmCombinations } from '../algorithms/combinationMatcher';
import { loadCachedRecommendations, loadProductPreferenceWeights, recordMealPlanRun, saveRhythmRecommendations } from '../repositories/rhythmRepository';

interface MatchInput { products:Product[];profile:ProfileDraft;target:NutritionResult;mealType:MealType;remaining:{calories:number;proteinG:number;fatG:number;carbsG:number};budget?:BudgetSettings|null;usedProductIds?:number[]; }
export async function getRhythmRecommendations(input:MatchInput){
  const contextHash=createRhythmContextHash({productVersion:input.products.map(p=>[p.id,p.updatedAt]),profile:input.profile,target:input.target,mealType:input.mealType,remaining:input.remaining,budget:input.budget,used:input.usedProductIds});
  const cached=await loadCachedRecommendations(contextHash);if(cached.length)return cached;
  const started=Date.now();const preferenceWeights=await loadProductPreferenceWeights();const result=matchRhythmCombinations(input.products,{...input,preferenceWeights,contextHash});await Promise.all([saveRhythmRecommendations(result),recordMealPlanRun({contextHash,mode:'remainder',candidateCount:input.products.length,durationMs:Date.now()-started,result})]);return result;
}
export async function getRhythmDayPlans(input:{products:Product[];profile:ProfileDraft;target:NutritionResult;budget?:BudgetSettings|null}){const started=Date.now();const preferenceWeights=await loadProductPreferenceWeights();const result=buildRhythmDayPlans(input.products,{...input,preferenceWeights});await recordMealPlanRun({contextHash:createRhythmContextHash(input.target),mode:'daily',candidateCount:input.products.length,durationMs:Date.now()-started,result});return result;}

