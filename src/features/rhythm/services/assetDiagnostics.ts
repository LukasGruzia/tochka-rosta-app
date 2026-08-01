import type { RhythmEmotion, RhythmSize } from '../types/rhythm';

export interface RhythmAssetDiagnosticsSnapshot { emotion:RhythmEmotion;assetKey:string;requestedKey:string;displaySize:RhythmSize;fileName:string;pixelSize:string;fileBytes:number;fallbackUsed:boolean;loadError:string|null;performanceMode:string;activeBlinkTimers:number;animationPausedReason:string|null;approximateFps:number|null;updatedAt:string; }
let snapshot:RhythmAssetDiagnosticsSnapshot={emotion:'idle',assetKey:'idle.compact',requestedKey:'idle.compact',displaySize:'compact',fileName:'rhythm-idle-compact.png',pixelSize:'171×256',fileBytes:38841,fallbackUsed:false,loadError:null,performanceMode:'automatic',activeBlinkTimers:0,animationPausedReason:'not mounted',approximateFps:null,updatedAt:new Date(0).toISOString()};
const listeners=new Set<()=>void>();
export function getRhythmAssetDiagnostics(){return snapshot;}
export function subscribeRhythmAssetDiagnostics(listener:()=>void){listeners.add(listener);return()=>{listeners.delete(listener);};}
export function recordRhythmAssetDiagnostics(next:Omit<RhythmAssetDiagnosticsSnapshot,'updatedAt'|'activeBlinkTimers'|'animationPausedReason'|'approximateFps'>){snapshot={...snapshot,...next,updatedAt:new Date().toISOString()};listeners.forEach(listener=>listener());}
export function recordRhythmRuntimeDiagnostics(next:Partial<Pick<RhythmAssetDiagnosticsSnapshot,'activeBlinkTimers'|'animationPausedReason'|'approximateFps'>>){snapshot={...snapshot,...next,updatedAt:new Date().toISOString()};listeners.forEach(listener=>listener());}

