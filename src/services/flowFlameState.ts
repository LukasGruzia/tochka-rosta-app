export type FlowFlameLevel = 'seed' | 'steady' | 'bright' | 'strong' | 'legendary';

export function getFlowFlameLevel(streak: number): FlowFlameLevel {
  if (streak <= 0) return 'seed';
  if (streak < 3) return 'steady';
  if (streak < 7) return 'bright';
  if (streak < 14) return 'strong';
  return 'legendary';
}

export const flowFlameConfig: Record<FlowFlameLevel, { scale: number; glow: number; speed: number }> = {
  seed: { scale: 0.82, glow: 0.2, speed: 3600 }, steady: { scale: 0.9, glow: 0.3, speed: 3300 }, bright: { scale: 1, glow: 0.42, speed: 3000 }, strong: { scale: 1.08, glow: 0.58, speed: 2700 }, legendary: { scale: 1.16, glow: 0.74, speed: 2400 },
};
