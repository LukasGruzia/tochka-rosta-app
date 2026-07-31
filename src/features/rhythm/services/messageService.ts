import { getRhythmMessages } from '../messages/messageLibrary';
import type { RhythmMessageCategory, RhythmMessageTemplate } from '../types/rhythm';

export function formatRhythmMessage(template:string,variables:Record<string,unknown>={}){
  return template.replace(/\{\{(\w+)\}\}/g,(_,key:string)=>{const value=variables[key];if(value==null)return '—';if(typeof value==='number')return Number.isFinite(value)?String(Math.max(0,Math.round(value))):'—';return String(value).trim()||'—';});
}

export function selectRhythmMessage(category:RhythmMessageCategory,recentIds:string[],seed:string):RhythmMessageTemplate|null{
  const candidates=getRhythmMessages(category).filter(item=>!recentIds.includes(item.id));
  const pool=candidates;
  if(!pool.length)return null;
  let hash=0;for(let index=0;index<seed.length;index+=1)hash=(hash*31+seed.charCodeAt(index))|0;
  return pool[Math.abs(hash)%pool.length];
}
