import { normalizeSearchText } from './productSearch';

export interface CatalogCanonicalCandidate {
  id: number;
  name: string;
  originalName?: string | null;
  servingSizeG: number;
  caloriesPer100g: number;
  proteinPer100g?: number | null;
  fatPer100g?: number | null;
  carbsPer100g?: number | null;
  canonicalKey?: string | null;
  preparationState?: string | null;
  sourcePriority?: number;
  sourceType: string;
  isUserCreated: boolean;
  barcode?: string | null;
  brand?: string | null;
  aliases?: string[];
}

export interface CatalogServingPlan { label: string; amount: number; unit: 'g' | 'ml' | 'piece' | 'serving'; gramsEquivalent: number; isDefault: boolean; sourceType: string; }
export interface CatalogCanonicalGroup { canonicalKey: string; displayName: string; preparationState: string | null; primary: CatalogCanonicalCandidate; members: CatalogCanonicalCandidate[]; aliases: string[]; servingOptions: CatalogServingPlan[]; unresolved: boolean; reason: 'size' | 'duplicate_source'; }

const sizeWords: Record<string, string> = {
  s: 'Маленький', small: 'Маленький', маленький: 'Маленький', маленькая: 'Маленькая', маленькое: 'Маленькое',
  m: 'Средний', medium: 'Средний', средний: 'Средний', средняя: 'Средняя', среднее: 'Среднее',
  l: 'Крупный', large: 'Крупный', большой: 'Крупный', большая: 'Крупная', большое: 'Крупное', крупный: 'Крупный', крупная: 'Крупная',
};
const everydayRaw = new Set(['банан', 'апельсин', 'мандарин', 'яблоко', 'груша', 'киви', 'персик', 'нектарин', 'абрикос', 'слива', 'виноград', 'ананас', 'манго', 'гранат', 'хурма', 'арбуз', 'дыня']);

function readableBase(value: string) {
  return value.replace(/\s*[—-]\s*(?:s|m|l)\b.*$/iu, '').replace(/[,\s]+(?:сырой|сырая|сырое)$/iu, '').replace(/\s+/g, ' ').trim();
}

function explicitOrdinaryKey(candidate: CatalogCanonicalCandidate) {
  const original=(candidate.originalName??'').toLowerCase();
  if (/^bananas?, (?:ripe and slightly ripe, )?raw$/.test(original)) return { key:'food:banana:raw', name:'Банан', state:'сырой' };
  if (/^oranges?, raw(?:, navels)?$/.test(original)) return { key:'food:orange:raw', name:'Апельсин', state:'сырой' };
  return null;
}

export function inspectCatalogCandidate(candidate: CatalogCanonicalCandidate) {
  if (candidate.isUserCreated || candidate.barcode || candidate.brand) return null;
  const explicit=explicitOrdinaryKey(candidate);
  const markerMatch=candidate.name.match(/(?:^|[\s,(—-])(s|m|l|small|medium|large|маленьк(?:ий|ая|ое)|средн(?:ий|яя|ее)|больш(?:ой|ая|ое)|крупн(?:ый|ая))(?=$|[\s,)—-])/iu);
  const gramsMatch=candidate.name.match(/\(\s*(\d+(?:[.,]\d+)?)\s*(?:г|мл)\s*\)\s*$/iu);
  if (!explicit&&!markerMatch&&!gramsMatch) return null;
  let displayName=explicit?.name??candidate.name;
  if (markerMatch) displayName=displayName.replace(markerMatch[0], markerMatch[0].slice(0,1).trim()?markerMatch[0][0]:'').replace(/\s+/g,' ').trim();
  if (gramsMatch) displayName=displayName.replace(gramsMatch[0],'').trim();
  displayName=readableBase(displayName);
  const normalizedBase=normalizeSearchText(displayName).replace(/\bсыр(?:ой|ая|ое)\b/gu,'').replace(/\s+/g,' ').trim();
  const state=explicit?.state??candidate.preparationState??null;
  const ordinary=everydayRaw.has(normalizedBase);
  if (ordinary&&state==='сырой') displayName=displayName.replace(/,?\s*сыр(?:ой|ая|ое)$/iu,'').trim();
  const marker=markerMatch?.[1]?.toLowerCase();
  const label=marker?`${sizeWords[marker]??'Типичная'} порция`:gramsMatch?`${Number(gramsMatch[1].replace(',','.'))} г`:'Типичная порция';
  return { canonicalKey:explicit?.key??`food:${normalizeSearchText(displayName).replace(/\s+/g,'-')}:${state??'default'}`, displayName, preparationState:state, label, reason:markerMatch||gramsMatch?'size' as const:'duplicate_source' as const };
}

function nutritionConflict(group: CatalogCanonicalCandidate[]) {
  const values=group.map(item=>item.caloriesPer100g).filter(value=>Number.isFinite(value)&&value>0);
  if(values.length<2)return false;
  return Math.max(...values)/Math.min(...values)>1.2;
}

export function buildCatalogCanonicalizationPlan(candidates: CatalogCanonicalCandidate[]): CatalogCanonicalGroup[] {
  const inspected=candidates.map(candidate=>({candidate,inspection:inspectCatalogCandidate(candidate)})).filter((item):item is {candidate:CatalogCanonicalCandidate;inspection:NonNullable<ReturnType<typeof inspectCatalogCandidate>>}=>item.inspection!==null);
  const grouped=new Map<string,typeof inspected>();
  for(const item of inspected)grouped.set(item.inspection.canonicalKey,[...(grouped.get(item.inspection.canonicalKey)??[]),item]);
  const result:CatalogCanonicalGroup[]=[];
  for(const [canonicalKey,items] of grouped){
    if(items.length<2)continue;
    const ordered=[...items].sort((a,b)=>(b.candidate.sourcePriority??0)-(a.candidate.sourcePriority??0)||a.candidate.id-b.candidate.id);
    const primary=ordered[0].candidate;
    const aliases=[...new Set(items.flatMap(item=>[item.candidate.name,item.candidate.originalName??'',...(item.candidate.aliases??[])]).filter(Boolean))];
    const options:CatalogServingPlan[]=[{label:'100 г',amount:100,unit:'g',gramsEquivalent:100,isDefault:false,sourceType:'system'}];
    for(const item of items){
      if(!Number.isFinite(item.candidate.servingSizeG)||item.candidate.servingSizeG<=5)continue;
      const grams=Math.round(item.candidate.servingSizeG*10)/10;
      if(options.some(option=>Math.abs(option.gramsEquivalent-grams)<.1))continue;
      options.push({label:item.inspection.label,amount:1,unit:'serving',gramsEquivalent:grams,isDefault:item.candidate.id===primary.id,sourceType:item.candidate.sourceType});
    }
    result.push({canonicalKey,displayName:ordered[0].inspection.displayName,preparationState:ordered[0].inspection.preparationState,primary,members:ordered.map(item=>item.candidate),aliases,servingOptions:options,unresolved:nutritionConflict(items.map(item=>item.candidate)),reason:items.some(item=>item.inspection.reason==='size')?'size':'duplicate_source'});
  }
  return result;
}

export const seedPresentationOverrides: Record<number, { name:string; aliases:string[] }> = {
  2710832:{name:'Мандарин',aliases:['мандарин','mandarin']},
  327357:{name:'Нектарин',aliases:['нектарин','nectarine']},
  2710815:{name:'Абрикос',aliases:['абрикос','apricot']},
  2710837:{name:'Слива',aliases:['слива','plum']},
  2346398:{name:'Ананас',aliases:['ананас','pineapple']},
  2709279:{name:'Клюква',aliases:['клюква','cranberry']},
  2685570:{name:'Тыква баттернат',aliases:['тыква баттернат','butternut squash']},
  2709619:{name:'Шпинат приготовленный с маслом',aliases:['шпинат','spinach']},
  2709918:{name:'Кукуруза приготовленная с маслом',aliases:['кукуруза','corn']},
  2709967:{name:'Зелёный горошек приготовленный с маслом',aliases:['зелёный горошек','green peas']},
};

export function getSeedCanonicalOverride(fdcId:number) {
  if(fdcId===1105314)return{canonicalKey:'food:banana:raw',name:'Банан',isActive:true,preparationState:'сырой'};
  if(fdcId===2709224)return{canonicalKey:'food:banana:raw',name:'Банан — прежняя справочная запись',isActive:false,preparationState:'сырой'};
  if(fdcId===746771)return{canonicalKey:'food:orange:raw',name:'Апельсин',isActive:true,preparationState:'сырой'};
  if(fdcId===2709171)return{canonicalKey:'food:orange:raw',name:'Апельсин — прежняя справочная запись',isActive:false,preparationState:'сырой'};
  if(fdcId===1105073)return{canonicalKey:'food:banana:overripe',name:'Банан перезрелый',isActive:true,preparationState:'сырой'};
  return null;
}
