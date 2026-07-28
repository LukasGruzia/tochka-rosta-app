export function createPressController() {
  let running = false;
  return {
    isRunning: () => running,
    async run(action?: () => void | Promise<void>, onError?: (error: unknown) => void) {
      if (!action || running) return false;
      running = true;
      try {
        await action();
        return true;
      } catch (error) {
        onError?.(error);
        return false;
      } finally {
        running = false;
      }
    },
  };
}

export function canRunPressAction(input: { disabled?: boolean; loading?: boolean; hasAction: boolean }) {
  return !input.disabled && !input.loading && input.hasAction;
}
