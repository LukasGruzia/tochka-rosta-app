export type FoodInputAvailability='unavailable'|'planned'|'experimental';
export interface FoodInputResult{title:string;rawText?:string;confidence?:number;}
export interface FoodInputProvider{readonly id:string;readonly title:string;readonly availability:FoodInputAvailability;isAvailable():Promise<boolean>;open():Promise<FoodInputResult|null>;}
export interface VoiceFoodInputProvider extends FoodInputProvider{readonly id:'voice';}
export interface LabelScanProvider extends FoodInputProvider{readonly id:'label_scan';}
export interface PhotoMealProvider extends FoodInputProvider{readonly id:'photo_meal';}
function planned<T extends FoodInputProvider>(value:Pick<T,'id'|'title'|'availability'>):T{return{...value,isAvailable:async()=>false,open:async()=>null}as T;}
export const futureFoodInputProviders:FoodInputProvider[]=[planned<VoiceFoodInputProvider>({id:'voice',title:'Голосовой ввод',availability:'planned'}),planned<LabelScanProvider>({id:'label_scan',title:'Сканирование этикетки',availability:'experimental'}),planned<PhotoMealProvider>({id:'photo_meal',title:'Распознавание блюда по фото',availability:'planned'})];
