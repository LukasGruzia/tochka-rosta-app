import { describe, expect, it } from 'vitest';

import { clearRecommendationCache, getCachedRecommendation, getRecommendationCacheSize, hasCachedRecommendation, setCachedRecommendation } from './recommendationCache';

describe('recommendation cache', () => {
  it('keeps a bounded set and distinguishes an empty recommendation from a miss', () => {
    clearRecommendationCache();
    setCachedRecommendation('empty');
    expect(hasCachedRecommendation('empty')).toBe(true);
    expect(getCachedRecommendation('empty')).toBeNull();
    for (let index = 0; index < 12; index += 1) setCachedRecommendation(`key-${index}`);
    expect(getRecommendationCacheSize()).toBe(8);
    expect(hasCachedRecommendation('key-11')).toBe(true);
  });
});
