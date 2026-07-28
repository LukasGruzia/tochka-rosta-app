export function createLatestRequestGuard() {
  let current = 0;
  return {
    next() { current += 1; return current; },
    isCurrent(id: number) { return id === current; },
    invalidate() { current += 1; },
  };
}
