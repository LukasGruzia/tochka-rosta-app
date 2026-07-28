import type { Product } from '@/types/domain';

const MAX_RECOMMENDATIONS = 8;
const cache = new Map<string, Product | null>();

export function getCachedRecommendation(key: string) {
  return cache.get(key);
}

export function hasCachedRecommendation(key: string) {
  return cache.has(key);
}

export function setCachedRecommendation(key: string, product?: Product) {
  cache.delete(key);
  cache.set(key, product ?? null);
  while (cache.size > MAX_RECOMMENDATIONS) {
    cache.delete(cache.keys().next().value as string);
  }
}

export function clearRecommendationCache() {
  cache.clear();
}

export function getRecommendationCacheSize() {
  return cache.size;
}
