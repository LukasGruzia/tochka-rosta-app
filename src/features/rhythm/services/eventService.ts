import { recordRhythmEvent } from '../repositories/rhythmRepository';
import type { RhythmEvent } from '../types/rhythm';

type Listener=(event:RhythmEvent)=>void;
const listeners=new Set<Listener>();

export function subscribeToRhythmEvents(listener:Listener){listeners.add(listener);return()=>{listeners.delete(listener);};}
export async function publishRhythmEvent(event:RhythmEvent){
  const normalized={...event,createdAt:event.createdAt??new Date().toISOString()};
  await recordRhythmEvent(normalized).catch(()=>undefined);
  listeners.forEach(listener=>listener(normalized));
}
