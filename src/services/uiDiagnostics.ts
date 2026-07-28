export type UiActionType =
  | 'screen_opened'
  | 'button_pressed'
  | 'navigation_requested'
  | 'navigation_completed'
  | 'bottom_sheet_opened'
  | 'database_request_started'
  | 'database_request_completed'
  | 'error_occurred';

export interface UiAction {
  id: number;
  type: UiActionType;
  label: string;
  timestamp: string;
  details?: string;
}

interface DiagnosticSnapshot {
  actions: readonly UiAction[];
  lastError: string | null;
  lastPressedButton: string | null;
  currentRoute: string;
  activeTab: string;
}

const listeners = new Set<() => void>();
let nextId = 1;
let snapshot: DiagnosticSnapshot = {
  actions: [],
  lastError: null,
  lastPressedButton: null,
  currentRoute: '/',
  activeTab: 'index',
};

function publish(patch: Partial<DiagnosticSnapshot>) {
  snapshot = { ...snapshot, ...patch };
  listeners.forEach((listener) => listener());
}

export function recordUiAction(type: UiActionType, label: string, details?: string) {
  if (typeof __DEV__ !== 'undefined' && !__DEV__) return;
  const entry: UiAction = { id: nextId++, type, label, timestamp: new Date().toISOString(), details };
  const actions = [...snapshot.actions, entry].slice(-100);
  publish({
    actions,
    lastPressedButton: type === 'button_pressed' ? label : snapshot.lastPressedButton,
    lastError: type === 'error_occurred' ? details ?? label : snapshot.lastError,
  });
}

export function recordRoute(route: string) {
  if (typeof __DEV__ !== 'undefined' && !__DEV__) return;
  const activeTab = route.match(/^\/\(tabs\)(?:\/([^/?]+))?/)?.[1] ?? (route === '/(tabs)' || route === '/' ? 'index' : snapshot.activeTab);
  publish({ currentRoute: route, activeTab });
  recordUiAction('screen_opened', route);
}

export function clearUiDiagnostics() {
  publish({ actions: [], lastError: null, lastPressedButton: null });
}

export function getUiDiagnosticsSnapshot() {
  return snapshot;
}

export function subscribeUiDiagnostics(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function buildTechnicalReport(input: { theme: string; databaseVersion: string | number; component?: string; error?: Error }) {
  const error = input.error;
  return [
    `time: ${new Date().toISOString()}`,
    `route: ${snapshot.currentRoute}`,
    `component: ${input.component ?? 'unknown'}`,
    `theme: ${input.theme}`,
    `database: ${input.databaseVersion}`,
    `last button: ${snapshot.lastPressedButton ?? 'none'}`,
    `error: ${error?.message ?? snapshot.lastError ?? 'unknown'}`,
    error?.stack ? `stack: ${error.stack}` : null,
  ].filter(Boolean).join('\n');
}
