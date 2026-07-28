import { recordRender } from './performanceLogger';

export function useRenderTracker(component: string) {
  if (__DEV__) recordRender(component);
}
