import type { RhythmAction, RhythmEmotion } from '../types/rhythm';

export const rhythmAssets = {
  idleHero: require('../../../../assets/rhythm/rhythm-idle.png'),
} as const;

export const rhythmAssetContract: Record<RhythmEmotion, { action: RhythmAction; asset: keyof typeof rhythmAssets | 'vector' }> = {
  idle: { action: 'none', asset: 'idleHero' },
  thinking: { action: 'presentAdvice', asset: 'vector' },
  happy: { action: 'wave', asset: 'vector' },
  motivated: { action: 'point', asset: 'vector' },
  caring: { action: 'holdFood', asset: 'vector' },
  surprised: { action: 'blink', asset: 'vector' },
  supportive: { action: 'presentAdvice', asset: 'vector' },
  celebrating: { action: 'celebrate', asset: 'vector' },
  sleeping: { action: 'rest', asset: 'vector' },
  neutralAttention: { action: 'none', asset: 'vector' },
};

