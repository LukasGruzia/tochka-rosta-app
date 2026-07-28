import type { DayBalanceItem, DiarySummary, WaterSummary } from '@/types/domain';
function status(value:number,target:number):DayBalanceItem['status']{if(target<=0)return'noData';const ratio=value/target;if(ratio<.7)return'supplement';if(ratio<=1.12)return'close';return'over';}
export function calculateDayBalance(diary:DiarySummary|null,water:WaterSummary|null):DayBalanceItem[]{if(!diary||!diary.entries.length)return[{key:'empty',label:'Баланс дня',status:'noData',detail:'Добавь еду, чтобы увидеть спокойный разбор дня.'}];const categories=new Set(diary.entries.map((entry)=>entry.productName));const meals=new Set(diary.entries.map((entry)=>entry.mealType));return[
  {key:'calories',label:'Калорийность',status:status(diary.consumedCalories,diary.targetCalories),detail:`${Math.round(diary.consumedCalories)} из ${Math.round(diary.targetCalories)} ккал`},
  {key:'protein',label:'Белок',status:status(diary.consumedProteinG,diary.targetProteinG),detail:`${Math.round(diary.consumedProteinG)} из ${Math.round(diary.targetProteinG)} г`},
  {key:'fat',label:'Жиры',status:status(diary.consumedFatG,diary.targetFatG),detail:`${Math.round(diary.consumedFatG)} из ${Math.round(diary.targetFatG)} г`},
  {key:'carbs',label:'Углеводы',status:status(diary.consumedCarbsG,diary.targetCarbsG),detail:`${Math.round(diary.consumedCarbsG)} из ${Math.round(diary.targetCarbsG)} г`},
  {key:'meals',label:'Регулярность',status:meals.size>=3?'enough':'supplement',detail:`Заполнено приёмов пищи: ${meals.size}`},
  {key:'variety',label:'Разнообразие',status:categories.size>=5?'enough':'supplement',detail:`Разных позиций: ${categories.size}`},
  {key:'fiber',label:'Клетчатка',status:'noData',detail:'Показывается, когда состав продуктов содержит эти данные'},
  {key:'produce',label:'Овощи и фрукты',status:diary.entries.some((entry)=>/овощ|фрукт|яблок|банан|томат|огур|капуст/i.test(entry.productName))?'enough':'supplement',detail:'Можно дополнить день овощами, фруктами или ягодами'},
  {key:'water',label:'Вода',status:water?status(water.totalMl,water.goalMl):'noData',detail:water?`${water.totalMl} из ${water.goalMl} мл`:'Нет данных'},
];}
