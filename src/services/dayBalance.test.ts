import { describe, expect, it } from 'vitest';
import type { DiarySummary, WaterSummary } from '@/types/domain';
import { calculateDayBalance } from './dayBalance';

const diary:DiarySummary={dayId:1,date:'2026-07-28',targetCalories:2000,targetProteinG:120,targetFatG:70,targetCarbsG:220,consumedCalories:1950,consumedProteinG:118,consumedFatG:69,consumedCarbsG:214,isCompleted:false,completedAt:null,entries:[
  {id:1,productId:1,productName:'Овощной салат',imageKey:'',imageUri:null,sourceType:'user_product',mealType:'breakfast',servings:1,servingSizeG:200,quantityG:200,calories:300,proteinG:15,fatG:10,carbsG:30,createdAt:''},
  {id:2,productId:2,productName:'Курица',imageKey:'',imageUri:null,sourceType:'user_product',mealType:'lunch',servings:1,servingSizeG:200,quantityG:200,calories:700,proteinG:55,fatG:20,carbsG:60,createdAt:''},
  {id:3,productId:3,productName:'Яблоко',imageKey:'',imageUri:null,sourceType:'user_product',mealType:'dinner',servings:1,servingSizeG:200,quantityG:200,calories:950,proteinG:48,fatG:39,carbsG:124,createdAt:''},
]};
const water:WaterSummary={date:'2026-07-28',totalMl:1900,goalMl:2000,entries:[]};

describe('daily nutrition balance',()=>{
  it('does not invent conclusions for an empty day',()=>{expect(calculateDayBalance(null,null)).toEqual([expect.objectContaining({status:'noData'})]);});
  it('separates close, enough and missing-source states',()=>{const result=calculateDayBalance(diary,water);expect(result.find((item)=>item.key==='calories')?.status).toBe('close');expect(result.find((item)=>item.key==='meals')?.status).toBe('enough');expect(result.find((item)=>item.key==='fiber')?.status).toBe('noData');expect(result.find((item)=>item.key==='produce')?.status).toBe('enough');expect(result.find((item)=>item.key==='water')?.status).toBe('close');});
});
