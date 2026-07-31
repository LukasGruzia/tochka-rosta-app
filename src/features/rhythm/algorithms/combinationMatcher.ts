import type { MealType, NutritionResult, Product, ProfileDraft, BudgetSettings } from '@/types/domain';
import { rhythmConfig } from '../config/rhythmConfig';
import { explainRhythmScore } from '../services/explanationService';
import type { RhythmCandidateItem, RhythmRecommendation } from '../types/rhythm';
import { mergeScoreBreakdowns, scoreRhythmProduct } from './productScoring';

interface Options { profile: ProfileDraft; target: NutritionResult; mealType: MealType; remaining: { calories:number;proteinG:number;fatG:number;carbsG:number }; budget?:BudgetSettings|null; usedProductIds?:number[]; preferenceWeights?:Record<number,number>; contextHash:string; }

function asItem(product: Product, divisor = 1): RhythmCandidateItem {
  const servings = Math.max(0.5, Math.round((1 / divisor) * 4) / 4);
  return { product, servings, quantityG: product.servingSizeG * servings };
}

function totals(items: RhythmCandidateItem[]) { return items.reduce((sum,item)=>({calories:sum.calories+item.product.calories*item.servings,proteinG:sum.proteinG+(item.product.proteinG??0)*item.servings,fatG:sum.fatG+(item.product.fatG??0)*item.servings,carbsG:sum.carbsG+(item.product.carbsG??0)*item.servings,price:sum.price+item.product.price*item.servings}),{calories:0,proteinG:0,fatG:0,carbsG:0,price:0}); }
function sensible(items: Product[]) { return new Set(items.map((item)=>item.id)).size===items.length && new Set(items.map((item)=>item.category)).size>1; }

export function matchRhythmCombinations(products: Product[], options: Options): RhythmRecommendation[] {
  const scoring = { profile:options.profile,target:options.target,mealType:options.mealType,remaining:options.remaining,budget:options.budget,usedProductIds:options.usedProductIds,preferenceWeights:options.preferenceWeights };
  const ranked = products.map((product)=>({product,score:scoreRhythmProduct(product,scoring)})).filter((item)=>Number.isFinite(item.score.total)).sort((a,b)=>b.score.total-a.score.total).slice(0,rhythmConfig.planner.maxSingles);
  const groups: { items: RhythmCandidateItem[]; scores: ReturnType<typeof scoreRhythmProduct>[] }[] = ranked.map(({product,score})=>({items:[asItem(product)],scores:[score]}));
  let pairs=0;
  for(let a=0;a<ranked.length&&pairs<rhythmConfig.planner.maxPairs;a+=1) for(let b=a+1;b<ranked.length&&pairs<rhythmConfig.planner.maxPairs;b+=1){if(!sensible([ranked[a].product,ranked[b].product]))continue;groups.push({items:[asItem(ranked[a].product,2),asItem(ranked[b].product,2)],scores:[ranked[a].score,ranked[b].score]});pairs+=1;}
  let triples=0;const top=ranked.slice(0,10);
  for(let a=0;a<top.length&&triples<rhythmConfig.planner.maxTriples;a+=1)for(let b=a+1;b<top.length&&triples<rhythmConfig.planner.maxTriples;b+=1)for(let c=b+1;c<top.length&&triples<rhythmConfig.planner.maxTriples;c+=1){if(!sensible([top[a].product,top[b].product,top[c].product]))continue;groups.push({items:[asItem(top[a].product,3),asItem(top[b].product,3),asItem(top[c].product,3)],scores:[top[a].score,top[b].score,top[c].score]});triples+=1;}
  return groups.map(({items,scores})=>{const amount=totals(items);const breakdown=mergeScoreBreakdowns(scores);const caloriePenalty=Math.abs(amount.calories-options.remaining.calories)/Math.max(250,options.remaining.calories)*14;const score=breakdown.total-caloriePenalty;return{id:`rr-${items.map(i=>i.product.id).join('-')}`,items,score,breakdown,...amount,reasons:explainRhythmScore(breakdown,items.length),contextHash:options.contextHash};}).sort((a,b)=>b.score-a.score).filter((item,index,all)=>index===all.findIndex((other)=>other.items.map(i=>i.product.category).sort().join('|')===item.items.map(i=>i.product.category).sort().join('|'))).slice(0,5);
}

