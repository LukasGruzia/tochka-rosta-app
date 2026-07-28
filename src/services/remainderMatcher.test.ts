import { describe, expect, it } from 'vitest';
import type { Product, ProfileDraft } from '@/types/domain';
import { calculateRemainder, matchRemainder } from './remainderMatcher';

const profile: ProfileDraft = { name: 'Лука', age: 30, calculationSex: 'male', heightCm: 175, weightKg: 70, activityLevel: 'medium', goal: 'balance', dietPreference: 'all', restrictions: ['nutFree'] };
function product(id:number,name:string,calories:number,proteinG:number,price:number,category='Основное',allergens:string[]=[]):Product{return{id,slug:String(id),name,originalName:null,description:'',ingredients:null,servingSizeG:100,packageSizeG:null,calories,proteinG,fatG:10,carbsG:35,caloriesPer100g:calories,proteinPer100g:proteinG,fatPer100g:10,carbsPer100g:35,fiberPer100g:null,sugarPer100g:null,sodiumPer100g:null,price,imageKey:'',imageUri:null,category,mealTags:['dinner'],goalTags:['balance'],dietTags:[],allergens,aliases:[],barcode:null,qrCode:null,isAvailable:true,dataStatus:'verified',sourceType:id%2?'tochka_rosta':'user_product',sourceId:String(id),sourceName:'test',sourceVersion:null,locale:'ru',isUserCreated:false,isFavorite:false,createdAt:null,updatedAt:null};}
const foods=[product(1,'Курица',320,42,230,'Белок'),product(2,'Рис',210,5,90,'Крупы'),product(3,'Йогурт',180,18,120,'Молочное'),product(4,'Ореховый батончик',260,8,160,'Перекус',['nuts']),product(5,'Овощи',110,4,80,'Овощи')];

describe('smart nutrition remainder matching',()=>{
  it('never returns negative remaining nutrients',()=>{
    expect(calculateRemainder({calories:2000,proteinG:120,fatG:70,carbsG:200},{calories:2200,proteinG:100,fatG:80,carbsG:150})).toEqual({calories:0,proteinG:20,fatG:0,carbsG:50});
  });
  it('creates transparent single or paired local matches',()=>{
    const result=matchRemainder(foods,{calories:500,proteinG:45,fatG:20,carbsG:55},{profile,mealType:'dinner'});
    expect(result.length).toBeGreaterThan(0);
    expect(result.some((match)=>match.items.length===2)).toBe(true);
    expect(result[0].score).toBeTypeOf('number');
    expect(result.every((match)=>match.items.every((item)=>item.product.id!==4))).toBe(true);
  });
  it('exposes an option that fits the configured meal budget',()=>{
    const result=matchRemainder(foods,{calories:450,proteinG:30,fatG:20,carbsG:50},{profile,mealType:'dinner',budget:{perMealBudget:250,dailyBudget:null,weeklyBudget:null,currency:'RUB',includeInRecommendations:true,showOnHome:true}});
    expect(result.some((match)=>match.total.price<=250)).toBe(true);
  });
});
