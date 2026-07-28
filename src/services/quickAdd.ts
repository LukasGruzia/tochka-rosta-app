export type QuickAddAction='search'|'scan'|'recent'|'favorites'|'product'|'recipe'|'template'|'repeat'|'yesterday'|'water'|'weight';
export interface QuickAddOption{key:QuickAddAction;label:string;hint:string;symbol:string;}
export const quickAddOptions:QuickAddOption[]=[
  {key:'search',label:'Найти продукт',hint:'Универсальный поиск',symbol:'⌕'},
  {key:'scan',label:'Сканировать код',hint:'QR или штрихкод',symbol:'▣'},
  {key:'recent',label:'Добавить недавнее',hint:'Последние продукты',symbol:'↺'},
  {key:'favorites',label:'Из избранного',hint:'Сохранённые позиции',symbol:'★'},
  {key:'product',label:'Создать продукт',hint:'Своя пищевая ценность',symbol:'＋'},
  {key:'recipe',label:'Создать рецепт',hint:'Несколько ингредиентов',symbol:'◫'},
  {key:'template',label:'Сохранённый набор',hint:'Добавить весь приём',symbol:'▦'},
  {key:'repeat',label:'Повторить последний приём',hint:'Одним действием',symbol:'⇥'},
  {key:'yesterday',label:'Скопировать со вчера',hint:'Тот же приём пищи',symbol:'←'},
  {key:'water',label:'Внести воду',hint:'Быстрый объём',symbol:'◒'},
  {key:'weight',label:'Внести вес',hint:'Динамика профиля',symbol:'↘'},
];
export function prioritizeQuickActions(last:QuickAddAction|null){return last?[...quickAddOptions].sort((a,b)=>a.key===last?-1:b.key===last?1:0):quickAddOptions;}
