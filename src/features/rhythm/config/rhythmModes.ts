import type { RhythmAction, RhythmEmotion, RhythmMode } from '../types/rhythm';

export interface RhythmModeConfig {
  label: string;
  description: string;
  confirmation: string;
  idleEmotion: RhythmEmotion;
  previewEmotion: RhythmEmotion;
  previewAction: RhythmAction;
  animationIntensity: 0 | 1 | 2 | 3;
  proactiveSuggestionsEnabled: boolean;
  proactiveCooldownMinutes: number;
  reactionDurationMs: number;
  blinkFrequency: 'rare' | 'normal' | 'frequent';
  bodyMotion: 'minimal' | 'soft' | 'expressive';
  hapticsEnabled: boolean;
  glowIntensity: number;
  messageStyle: 'energetic' | 'supportive' | 'minimal';
  allowedActions: readonly RhythmAction[];
}

export const rhythmModes: Record<RhythmMode, RhythmModeConfig> = {
  active: {
    label: 'Активный', description: 'Живее реагирует и чаще предлагает уместные следующие шаги.',
    confirmation: 'Буду чаще подсказывать и ярче реагировать.', idleEmotion: 'happy', previewEmotion: 'happy', previewAction: 'wave',
    animationIntensity: 3, proactiveSuggestionsEnabled: true, proactiveCooldownMinutes: 90, reactionDurationMs: 1120,
    blinkFrequency: 'frequent', bodyMotion: 'expressive', hapticsEnabled: true, glowIntensity: 1, messageStyle:'energetic',
    allowedActions: ['none', 'blink', 'wave', 'point', 'smallJump', 'presentAdvice', 'holdFood', 'celebrate', 'lookAtCard'],
  },
  balanced: {
    label: 'Сбалансированный', description: 'Спокойно реагирует на важные действия и умеренно предлагает помощь.',
    confirmation: 'Буду появляться, когда смогу действительно помочь.', idleEmotion: 'idle', previewEmotion: 'supportive', previewAction: 'lookAtCard',
    animationIntensity: 2, proactiveSuggestionsEnabled: true, proactiveCooldownMinutes: 150, reactionDurationMs: 840,
    blinkFrequency: 'normal', bodyMotion: 'soft', hapticsEnabled: true, glowIntensity: 0.58, messageStyle:'supportive',
    allowedActions: ['none', 'blink', 'presentAdvice', 'holdFood', 'celebrate', 'lookAtCard', 'rest'],
  },
  quiet: {
    label: 'Тихий', description: 'Остаётся рядом без инициативных подсказок и лишнего движения.',
    confirmation: 'Останусь рядом, но не буду отвлекать.', idleEmotion: 'neutralAttention', previewEmotion: 'caring', previewAction: 'rest',
    animationIntensity: 0, proactiveSuggestionsEnabled: false, proactiveCooldownMinutes: 720, reactionDurationMs: 360,
    blinkFrequency: 'rare', bodyMotion: 'minimal', hapticsEnabled: false, glowIntensity: 0.16, messageStyle:'minimal',
    allowedActions: ['none', 'blink', 'rest'],
  },
};

export const rhythmModeValues = Object.freeze(['active', 'balanced', 'quiet'] as const);
export const blinkIntervals: Record<RhythmModeConfig['blinkFrequency'], readonly [number, number]> = {
  rare: [6200, 9200], normal: [3000, 5600], frequent: [2100, 3900],
};

export function getRhythmModeConfig(mode: RhythmMode) { return rhythmModes[mode]; }
export function normalizeRhythmMode(value: unknown): RhythmMode { return rhythmModeValues.includes(value as RhythmMode) ? value as RhythmMode : 'balanced'; }
export function resolveRhythmAction(mode: RhythmMode, action: RhythmAction): RhythmAction {
  const config = rhythmModes[mode];
  if (config.allowedActions.includes(action)) return action;
  if (action === 'celebrate' && mode === 'quiet') return 'rest';
  return mode === 'balanced' ? 'lookAtCard' : 'none';
}
export function formatRhythmModeMessage(mode:RhythmMode,message:string){if(rhythmModes[mode].messageStyle!=='minimal')return message;return message.match(/^.*?[.!?](?:\s|$)/u)?.[0].trim()??message.trim();}
