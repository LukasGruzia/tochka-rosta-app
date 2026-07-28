import { describe, expect, it } from 'vitest';
import type { Product, WeeklyPlan } from '@/types/domain';
import { buildShoppingList, shoppingListAsText, toggleShoppingItem } from './shoppingList';

const product={id:1,name:'Гречка',sourceType:'user_product',category:'Крупы'} as Product;
const plan:WeeklyPlan={uuid:'plan',weekStartDate:'2026-07-27',targetBudget:2000,estimatedCost:180,status:'planned',settings:{mealsPerDay:3,mode:'mixed',maxRepeats:3,trainingDays:[],awayDays:[],quickDays:[]},items:[
  {uuid:'one',date:'2026-07-27',product,mealType:'lunch',amountG:200,servings:1,estimatedCost:80,isAddedToDiary:false},
  {uuid:'two',date:'2026-07-28',product,mealType:'dinner',amountG:150,servings:1,estimatedCost:60,isAddedToDiary:false},
]};

describe('shopping lists',()=>{
  it('merges duplicate ingredients and estimates totals',()=>{
    const list=buildShoppingList(plan);
    expect(list.items).toHaveLength(1);
    expect(list.items[0]).toMatchObject({name:'Гречка',amount:350,estimatedCost:140});
  });
  it('tracks checked and already-at-home states and excludes them from sharing',()=>{
    const list=buildShoppingList(plan);const uuid=list.items[0].uuid;
    const checked={...list,items:toggleShoppingItem(list.items,uuid,'isChecked')};
    expect(checked.items[0].isChecked).toBe(true);
    expect(shoppingListAsText(checked)).toBe('');
    expect(shoppingListAsText(list)).toContain('Крупы: Гречка');
  });
});
