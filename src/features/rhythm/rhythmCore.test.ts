import { describe, expect, it } from 'vitest';
import type { NutritionResult, Product, ProfileDraft } from '@/types/domain';
import { migrationV6 } from '../../database/migrations/v6';
import { buildRhythmDayPlans } from './algorithms/beamMealPlanner';
import { matchRhythmCombinations } from './algorithms/combinationMatcher';
import { createRhythmContextHash } from './algorithms/contextHash';
import { isRhythmProductAllowed, scoreRhythmProduct } from './algorithms/productScoring';
import { rhythmMessageLibrary } from './messages/messageLibrary';
import { decideRhythmResponse } from './services/decisionEngine';
import { formatRhythmMessage } from './services/messageService';
import type { RhythmContext, RhythmSettings } from './types/rhythm';

const profile:ProfileDraft={name:'Лука',age:30,calculationSex:'male',heightCm:175,weightKg:70,activityLevel:'medium',goal:'balance',dietPreference:'all',restrictions:['nutFree']};
const target:NutritionResult={bmr:1700,tdee:2200,calories:2000,proteinG:120,fatG:67,carbsG:225,goal:'balance',activityFactor:1.55};
function product(id:number,category=`Категория ${id%4}`,allergens:string[]=[]):Product{return{id,slug:String(id),name:`Блюдо ${id}`,originalName:null,description:'',ingredients:null,servingSizeG:200,packageSizeG:null,calories:280+id*5,proteinG:20+id%5,fatG:10,carbsG:32,caloriesPer100g:150,proteinPer100g:10,fatPer100g:5,carbsPer100g:16,fiberPer100g:2,sugarPer100g:2,sodiumPer100g:100,price:120+id,imageKey:'',imageUri:null,category,mealTags:['breakfast','lunch','snack','dinner'],goalTags:['balance'],dietTags:[],allergens,aliases:[],barcode:null,qrCode:null,isAvailable:true,dataStatus:'verified',sourceType:'tochka_rosta',sourceId:String(id),sourceName:'test',sourceVersion:null,locale:'ru',isUserCreated:false,isFavorite:false,createdAt:null,updatedAt:null};}
const products=Array.from({length:22},(_,index)=>product(index+1));
const settings:RhythmSettings={mode:'balanced',enabled:true,showOnOtherScreens:true,animationsEnabled:true,hapticsEnabled:true,onboardingCompleted:true};
const context:RhythmContext={now:'2026-07-31T10:00:00.000Z',route:'/diary',profile,target,diary:null,flow:{currentStreak:7,longestStreak:7,completedDays:7,completedDates:[],lastCompletedDate:null},budget:null,performanceMode:'automatic',reducedMotion:false,remaining:{calories:600,proteinG:40,fatG:20,carbsG:60},mealCounts:{},recentTemplateIds:[],recentRejections:0,lastInitiativeAt:null,contextHash:'test'};

describe('Rhythm local assistant core',()=>{
  it('ships the requested local history tables without touching existing tables',()=>{for(const table of ['rhythm_settings','rhythm_events','rhythm_decisions','rhythm_recommendations','rhythm_feedback','rhythm_preferences','rhythm_cooldowns','rhythm_message_history','meal_plan_runs'])expect(migrationV6).toContain(`CREATE TABLE IF NOT EXISTS ${table}`);expect(migrationV6).not.toContain('DROP TABLE');});
  it('contains at least 64 safe message templates',()=>{expect(rhythmMessageLibrary.length).toBeGreaterThanOrEqual(64);for(const item of rhythmMessageLibrary)expect(formatRhythmMessage(item.text,{})).not.toMatch(/undefined|NaN/);});
  it('formats missing and invalid variables safely',()=>{expect(formatRhythmMessage('{{calories}} / {{missing}}',{calories:Number.NaN})).toBe('— / —');});
  it('respects off mode, cooldown and rejection suppression',()=>{expect(decideRhythmResponse({type:'MEAL_ADDED'},context,{...settings,mode:'off',enabled:false})).toBeNull();expect(decideRhythmResponse({type:'MEAL_ADDED'},{...context,recentRejections:2},settings)).toBeNull();expect(decideRhythmResponse({type:'MEAL_ADDED'},{...context,lastInitiativeAt:new Date().toISOString()},settings)).toBeNull();expect(decideRhythmResponse({type:'DAY_COMPLETED'},context,settings)?.visual.emotion).toBe('celebrating');});
  it('hard-filters restrictions before scoring',()=>{const nuts=product(99,'Перекус',['nuts']);expect(isRhythmProductAllowed(nuts,profile)).toBe(false);expect(scoreRhythmProduct(nuts,{profile,target,mealType:'snack',remaining:context.remaining!}).total).toBe(Number.NEGATIVE_INFINITY);});
  it('produces bounded distinct combinations with explanations',()=>{const result=matchRhythmCombinations(products,{profile,target,mealType:'dinner',remaining:context.remaining!,contextHash:'a'});expect(result.length).toBeGreaterThan(0);expect(result.length).toBeLessThanOrEqual(5);expect(result.every(item=>item.items.length<=3&&item.reasons.length>0)).toBe(true);});
  it('uses a stable context hash and bounded beam',()=>{expect(createRhythmContextHash({b:2,a:1})).toBe(createRhythmContextHash({a:1,b:2}));const plans=buildRhythmDayPlans(products,{profile,target});expect(plans.length).toBeGreaterThan(0);expect(plans.length).toBeLessThanOrEqual(4);expect(plans.every(plan=>plan.items.length===4)).toBe(true);});
});
