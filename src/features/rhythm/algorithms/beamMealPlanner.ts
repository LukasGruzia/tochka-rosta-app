import type { BudgetSettings, MealType, NutritionResult, Product, ProfileDraft } from '@/types/domain';
import { rhythmConfig } from '../config/rhythmConfig';
import { createRhythmContextHash } from './contextHash';
import { scoreRhythmProduct } from './productScoring';

export interface RhythmDayPlan { id:string; items:{mealType:MealType;product:Product}[]; score:number; calories:number;proteinG:number;fatG:number;carbsG:number;price:number; reasons:string[]; }
interface Options { profile:ProfileDraft;target:NutritionResult;budget?:BudgetSettings|null;preferenceWeights?:Record<number,number>;mealTypes?:MealType[]; }
const defaultMeals:MealType[]=['breakfast','lunch','snack','dinner'];

export function buildRhythmDayPlans(products:Product[],options:Options):RhythmDayPlan[]{
  const meals=options.mealTypes??defaultMeals;let beam:{items:{mealType:MealType;product:Product}[];score:number}[]=[{items:[],score:0}];
  for(const mealType of meals){const next:typeof beam=[];for(const state of beam){const used=state.items.map(i=>i.product.id);const remaining={calories:Math.max(0,options.target.calories-state.items.reduce((s,i)=>s+i.product.calories,0)),proteinG:Math.max(0,options.target.proteinG-state.items.reduce((s,i)=>s+(i.product.proteinG??0),0)),fatG:Math.max(0,options.target.fatG-state.items.reduce((s,i)=>s+(i.product.fatG??0),0)),carbsG:Math.max(0,options.target.carbsG-state.items.reduce((s,i)=>s+(i.product.carbsG??0),0))};const candidates=products.map(product=>({product,score:scoreRhythmProduct(product,{profile:options.profile,target:options.target,mealType,remaining,budget:options.budget,usedProductIds:used,preferenceWeights:options.preferenceWeights})})).filter(x=>Number.isFinite(x.score.total)).sort((a,b)=>b.score.total-a.score.total).slice(0,rhythmConfig.planner.perStepCandidates);for(const candidate of candidates)next.push({items:[...state.items,{mealType,product:candidate.product}],score:state.score+candidate.score.total});}beam=next.sort((a,b)=>b.score-a.score).slice(0,rhythmConfig.planner.beamWidth);}
  return beam.map(state=>{const totals=state.items.reduce((sum,item)=>({calories:sum.calories+item.product.calories,proteinG:sum.proteinG+(item.product.proteinG??0),fatG:sum.fatG+(item.product.fatG??0),carbsG:sum.carbsG+(item.product.carbsG??0),price:sum.price+item.product.price}),{calories:0,proteinG:0,fatG:0,carbsG:0,price:0});const targetPenalty=Math.abs(totals.calories-options.target.calories)/Math.max(1,options.target.calories)*30;return{id:createRhythmContextHash(state.items.map(i=>[i.mealType,i.product.id])),items:state.items,score:state.score/meals.length-targetPenalty,...totals,reasons:['распределение по приёмам пищи','учтены ограничения и доступность','варианты отличаются составом']};}).sort((a,b)=>b.score-a.score).filter((plan,index,all)=>index===all.findIndex(other=>other.items.map(i=>i.product.id).sort().join(',')===plan.items.map(i=>i.product.id).sort().join(','))).slice(0,rhythmConfig.planner.resultCount);
}

