export type FlowFlameLevel = 'seed' | 'ember' | 'growing' | 'deep' | 'gilded' | 'premium' | 'legendary';

export function getFlowFlameLevel(streak: number): FlowFlameLevel {
  if (streak <= 0) return 'seed';
  if (streak < 3) return 'ember';
  if (streak < 7) return 'growing';
  if (streak < 14) return 'deep';
  if (streak < 30) return 'gilded';
  if (streak < 60) return 'premium';
  return 'legendary';
}

export const flowFlameConfig: Record<FlowFlameLevel, { scale: number; glow: number; speed: number; gold:number }> = {
  seed: { scale: 0.76, glow: 0.12, speed: 3800,gold:0 }, ember:{scale:.84,glow:.24,speed:3700,gold:0},growing:{scale:.92,glow:.36,speed:3600,gold:0},deep:{scale:1,glow:.48,speed:3500,gold:0},gilded:{scale:1.05,glow:.58,speed:3400,gold:.28},premium:{scale:1.1,glow:.68,speed:3300,gold:.48},legendary: { scale: 1.14, glow: 0.76, speed: 3200,gold:.7 },
};

export function shouldAnimateFlowFlame(reducedMotion: boolean, isVisible = true) {
  return isVisible && !reducedMotion;
}
