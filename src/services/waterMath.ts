import type { WaterEntry } from '@/types/domain';

export function getWaterProgress(totalMl: number, goalMl: number) {
  return goalMl > 0 ? Math.min(1, Math.max(0, totalMl / goalMl)) : 0;
}

export function sumWater(entries: Pick<WaterEntry, 'amountMl'>[]) {
  return entries.reduce((sum, item) => sum + item.amountMl, 0);
}
