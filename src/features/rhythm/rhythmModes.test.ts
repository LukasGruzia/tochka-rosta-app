import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { formatRhythmModeMessage, getRhythmModeConfig, normalizeRhythmMode, resolveRhythmAction, rhythmModes } from './config/rhythmModes';
import { decideRhythmResponse } from './services/decisionEngine';
import type { RhythmContext, RhythmSettings } from './types/rhythm';

const settings:RhythmSettings={mode:'balanced',enabled:true,showOnOtherScreens:true,animationsEnabled:true,hapticsEnabled:true,reactionsEnabled:true,recommendationsEnabled:true,budgetEnabled:true,historyEnabled:true,interfaceSoundsEnabled:false,onboardingCompleted:true};
const context:RhythmContext={now:'2026-08-02T12:00:00.000Z',route:'/flow',profile:null,target:null,diary:null,flow:null,budget:null,performanceMode:'automatic',reducedMotion:false,remaining:null,mealCounts:{},recentTemplateIds:[],recentRejections:0,lastInitiativeAt:null,contextHash:'mode-test'};
const source=(path:string)=>readFileSync(path,'utf8');

describe('distinct Rhythm personality modes',()=>{
  it('centralizes expressive Active behavior',()=>{const mode=getRhythmModeConfig('active');expect(mode.bodyMotion).toBe('expressive');expect(mode.animationIntensity).toBe(3);expect(mode.allowedActions).toContain('wave');expect(mode.allowedActions).toContain('smallJump');expect(mode.proactiveSuggestionsEnabled).toBe(true);});
  it('keeps Balanced soft and default-friendly',()=>{expect(rhythmModes.balanced.bodyMotion).toBe('soft');expect(rhythmModes.balanced.previewAction).toBe('lookAtCard');expect(rhythmModes.balanced.proactiveCooldownMinutes).toBeGreaterThan(rhythmModes.active.proactiveCooldownMinutes);});
  it('blocks proactive Quiet overlays without disabling a requested planner',()=>{expect(decideRhythmResponse({type:'SCREEN_OPENED'},context,{...settings,mode:'quiet'})).toBeNull();expect(decideRhythmResponse({type:'REMAINDER_MATCH_OPENED'},context,{...settings,mode:'quiet'})).not.toBeNull();expect(rhythmModes.quiet.hapticsEnabled).toBe(false);expect(resolveRhythmAction('quiet','wave')).toBe('none');});
  it('normalizes legacy off values without keeping off in the strict type',()=>{expect(normalizeRhythmMode('off')).toBe('balanced');expect(normalizeRhythmMode('active')).toBe('active');});
  it('defines one-shot previews and one global timer lifecycle',()=>{const settingsSource=source('src/app/rhythm-settings.tsx');const characterSource=source('src/features/rhythm/components/RhythmCharacter.tsx');expect(settingsSource).toContain('previewSequence');expect(settingsSource).toContain('key={`${settings.mode}-${previewSequence}`}');expect(characterSource).toContain('startGlobalBlinkLoop');expect(characterSource).toContain('clearTimeout(blinkTimer)');expect(characterSource).toContain('activity.canAnimate');expect(characterSource).toContain("performance mode:");});
  it('uses the expected preview personalities',()=>{expect(rhythmModes.active.previewAction).toBe('wave');expect(rhythmModes.balanced.previewAction).toBe('lookAtCard');expect(rhythmModes.quiet.animationIntensity).toBe(0);expect(rhythmModes.quiet.bodyMotion).toBe('minimal');});
  it('keeps Quiet copy concise while preserving other mode copy',()=>{const text='Первая короткая фраза. Вторая подробная фраза.';expect(formatRhythmModeMessage('quiet',text)).toBe('Первая короткая фраза.');expect(formatRhythmModeMessage('balanced',text)).toBe(text);});
});
