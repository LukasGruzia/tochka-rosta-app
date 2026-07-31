import type { RhythmEmotion, RhythmSize } from '../types/rhythm';

export interface RhythmAssetDiagnosticsSnapshot { emotion:RhythmEmotion;assetKey:string;requestedKey:string;displaySize:RhythmSize;fileName:string;pixelSize:string;fileBytes:number;fallbackUsed:boolean;loadError:string|null;performanceMode:string;updatedAt:string; }
let snapshot:RhythmAssetDiagnosticsSnapshot={emotion:'idle',assetKey:'idle.compact',requestedKey:'idle.compact',displaySize:'compact',fileName:'rhythm-idle-compact.png',pixelSize:'171×256',fileBytes:38841,fallbackUsed:false,loadError:null,performanceMode:'automatic',updatedAt:new Date(0).toISOString()};
const listeners=new Set<()=>void>();
export function getRhythmAssetDiagnostics(){return snapshot;}
export function subscribeRhythmAssetDiagnostics(listener:()=>void){listeners.add(listener);return()=>{listeners.delete(listener);};}
export function recordRhythmAssetDiagnostics(next:Omit<RhythmAssetDiagnosticsSnapshot,'updatedAt'>){snapshot={...next,updatedAt:new Date().toISOString()};listeners.forEach(listener=>listener());}

