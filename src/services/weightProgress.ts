import type { WeightLog, WeightProgress } from '@/types/domain';

export function calculateWeightProgress(entries: WeightLog[]): WeightProgress {
  const values = entries.map((item) => item.weightKg);
  return {
    entries,
    initialWeight: values[0] ?? null,
    currentWeight: values.at(-1) ?? null,
    changeKg: values.length > 1 ? values.at(-1)! - values[0] : 0,
    minWeight: values.length ? Math.min(...values) : null,
    maxWeight: values.length ? Math.max(...values) : null,
  };
}
