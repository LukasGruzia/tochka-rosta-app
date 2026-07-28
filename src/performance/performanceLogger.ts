export type PerformanceEventType = 'screen' | 'render' | 'query' | 'task' | 'animation' | 'lifecycle' | 'navigation' | 'error' | 'list';

export interface PerformanceEvent {
  id: number;
  timestamp: string;
  type: PerformanceEventType;
  label: string;
  durationMs?: number;
  value?: number | string | boolean;
}

export interface PerformanceSnapshot {
  events: readonly PerformanceEvent[];
  renderCounts: Readonly<Record<string, number>>;
  activeAnimations: number;
  loadedProducts: number;
  currentListSize: number;
  lastQueryLabel: string | null;
  lastQueryDurationMs: number | null;
  lastError: string | null;
  databaseVersion: number | null;
  activeRoute: string;
  activeFlags: readonly string[];
}

const MAX_EVENTS = 160;
let sequence = 0;
let events: PerformanceEvent[] = [];
let renderCounts: Record<string, number> = {};
let state = {
  activeAnimations: 0,
  loadedProducts: 0,
  currentListSize: 0,
  lastQueryLabel: null as string | null,
  lastQueryDurationMs: null as number | null,
  lastError: null as string | null,
  databaseVersion: null as number | null,
  activeRoute: '/',
  activeFlags: [] as string[],
};
let snapshot: PerformanceSnapshot = { events, renderCounts, ...state };
const listeners = new Set<() => void>();

function publish() {
  snapshot = { events, renderCounts, ...state };
  listeners.forEach((listener) => listener());
}

export function recordPerformanceEvent(type: PerformanceEventType, label: string, data: Pick<PerformanceEvent, 'durationMs' | 'value'> = {}) {
  if (!__DEV__) return;
  const event: PerformanceEvent = { id: ++sequence, timestamp: new Date().toISOString(), type, label, ...data };
  events = [...events.slice(-(MAX_EVENTS - 1)), event];
  if (type === 'query') {
    state = { ...state, lastQueryLabel: label, lastQueryDurationMs: data.durationMs ?? null };
  } else if (type === 'error') {
    state = { ...state, lastError: label };
  }
  publish();
}

export function recordRender(component: string) {
  if (!__DEV__) return 0;
  const count = (renderCounts[component] ?? 0) + 1;
  renderCounts = { ...renderCounts, [component]: count };
  // Avoid turning diagnostics into a performance problem.
  if (count === 1 || count === 5 || count % 20 === 0) recordPerformanceEvent('render', component, { value: count });
  else publish();
  return count;
}

export function setPerformanceMetric<K extends keyof typeof state>(key: K, value: (typeof state)[K]) {
  if (!__DEV__) return;
  if (state[key] === value) return;
  state = { ...state, [key]: value };
  publish();
}

export function getPerformanceSnapshot() { return snapshot; }
export function subscribePerformance(listener: () => void) { listeners.add(listener); return () => listeners.delete(listener); }
export function clearPerformanceEvents() { events = []; renderCounts = {}; state = { ...state, lastError: null, lastQueryLabel: null, lastQueryDurationMs: null }; publish(); }
