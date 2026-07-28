import { describe, expect, it } from 'vitest';
import type { NutritionResult, Product, ProfileDraft, WeeklyPlanSettings } from '@/types/domain';
import { copyWeeklyDay, generateWeeklyPlan, moveWeeklyItem } from './weeklyPlanner';

const profile:ProfileDraft={name:'Лука',age:30,calculationSex:'male',heightCm:175,weightKg:70,activityLevel:'medium',goal:'balance',dietPreference:'all',restrictions:[]};
const target:NutritionResult={bmr:1700,tdee:2200,calories:2000,proteinG:120,fatG:67,carbsG:225,goal:'balance',activityFactor:1.55};
function makeProduct(id:number):Product{return{id,slug:String(id),name:`Блюдо ${id}`,originalName:null,description:'',ingredients:null,servingSizeG:200,packageSizeG:null,calories:350+(id%4)*30,proteinG:20+(id%5),fatG:12,carbsG:40,caloriesPer100g:180,proteinPer100g:10,fatPer100g:6,carbsPer100g:20,fiberPer100g:null,sugarPer100g:null,sodiumPer100g:null,price:80+id*7,imageKey:'',imageUri:null,category:id%3?'Основное':'Готовые блюда',mealTags:['breakfast','lunch','snack','dinner'],goalTags:['balance'],dietTags:[],allergens:[],aliases:[],barcode:null,qrCode:null,isAvailable:true,dataStatus:'verified',sourceType:id%2?'tochka_rosta':'user_product',sourceId:String(id),sourceName:'test',sourceVersion:null,locale:'ru',isUserCreated:false,isFavorite:false,createdAt:null,updatedAt:null};}
const products=Array.from({length:40},(_,index)=>makeProduct(index+1));
const settings=(mealsPerDay:3|4|5):WeeklyPlanSettings=>({mealsPerDay,mode:'mixed',maxRepeats:2,trainingDays:[],awayDays:[],quickDays:[]});

describe('weekly meal planning',()=>{
  it.each([3,4,5] as const)('builds seven days with %i meals per day',(count)=>{
    const plan=generateWeeklyPlan('2026-07-27',products,target,profile,settings(count));
    expect(plan.items).toHaveLength(7*count);
    expect(new Set(plan.items.map((item)=>item.date))).toHaveLength(7);
    const repeats=plan.items.reduce<Record<number,number>>((map,item)=>({...map,[item.product.id]:(map[item.product.id]??0)+1}),{});
    expect(Math.max(...Object.values(repeats))).toBeLessThanOrEqual(2);
  });
  it('moves an item and replaces a copied target day without touching the source',()=>{
    const plan=generateWeeklyPlan('2026-07-27',products,target,profile,settings(3));
    const moved=moveWeeklyItem(plan,plan.items[0].uuid,'2026-07-28');
    expect(moved.items.find((item)=>item.uuid===plan.items[0].uuid)?.date).toBe('2026-07-28');
    const copied=copyWeeklyDay(plan,'2026-07-27','2026-07-28');
    expect(copied.items.filter((item)=>item.date==='2026-07-28')).toHaveLength(3);
    expect(copied.items.filter((item)=>item.date==='2026-07-27')).toHaveLength(3);
  });
});
