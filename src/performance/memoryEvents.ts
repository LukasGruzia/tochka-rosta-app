import { useEffect, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { recordPerformanceEvent, setPerformanceMetric } from './performanceLogger';

let activeAnimations = 0;

export function beginTrackedAnimation(label: string) {
  activeAnimations += 1;
  setPerformanceMetric('activeAnimations', activeAnimations);
  recordPerformanceEvent('animation', `${label}:start`);
  let ended = false;
  return () => {
    if (ended) return;
    ended = true;
    activeAnimations = Math.max(0, activeAnimations - 1);
    setPerformanceMetric('activeAnimations', activeAnimations);
    recordPerformanceEvent('animation', `${label}:stop`);
  };
}

export function useAppActivity() {
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next) => {
      setAppState(next);
      recordPerformanceEvent('lifecycle', `app:${next}`);
    });
    return () => subscription.remove();
  }, []);
  return { appState, isAppActive: appState === 'active' };
}
