import { useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { recordPerformanceEvent } from './performanceLogger';

export function useScreenProfiler(screen: string) {
  useFocusEffect(useCallback(() => {
    const openedAt = performance.now();
    recordPerformanceEvent('screen', `${screen}:open`);
    return () => recordPerformanceEvent('screen', `${screen}:close`, { durationMs: Math.round(performance.now() - openedAt) });
  }, [screen]));
}

export async function profileTask<T>(label: string, task: () => Promise<T>) {
  const startedAt = performance.now();
  try { return await task(); }
  finally { recordPerformanceEvent('task', label, { durationMs: Math.round(performance.now() - startedAt) }); }
}
