import { describe, expect, it } from 'vitest';
import { derivePersonalInsights, type InsightDay } from './personalInsights';

function days(count:number):InsightDay[]{return Array.from({length:count},(_,index)=>{const date=new Date(2026,6,1+index,12);const key=`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;const weekend=[0,6].includes(date.getDay());return{date:key,entryCount:3,breakfastCount:index%3===0?1:0,proteinG:100,calories:weekend?2450:1900,isCompleted:index%2===0,hasPlan:index<5};});}

describe('personal insights',()=>{
  it('stays silent before seven filled days',()=>{expect(derivePersonalInsights(days(6))).toEqual([]);});
  it('creates evidence-backed observations after seven days',()=>{const result=derivePersonalInsights(days(7));expect(result.some((item)=>item.type==='breakfast')).toBe(true);expect(result.every((item)=>item.periodStart&&item.periodEnd&&item.action)).toBe(true);});
  it('may compare weekends only after fourteen filled days',()=>{expect(derivePersonalInsights(days(14)).some((item)=>item.type==='weekend')).toBe(true);});
});
