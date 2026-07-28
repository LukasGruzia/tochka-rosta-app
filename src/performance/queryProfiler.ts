import { recordPerformanceEvent } from './performanceLogger';

export async function profileQuery<T>(label: string, query: () => Promise<T>) {
  const startedAt = performance.now();
  try { return await query(); }
  catch (error) {
    recordPerformanceEvent('error', `query:${label}`);
    throw error;
  } finally {
    recordPerformanceEvent('query', label, { durationMs: Math.round(performance.now() - startedAt) });
  }
}
