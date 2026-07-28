import { describe, expect, it, vi } from 'vitest';
import { canRunPressAction, createPressController } from './pressController';

describe('shared press controller', () => {
  it('calls an async action once during rapid presses', async () => {
    const controller = createPressController();
    let release!: () => void;
    const pending = new Promise<void>((resolve) => { release = resolve; });
    const action = vi.fn(() => pending);
    const first = controller.run(action);
    const second = await controller.run(action);
    expect(second).toBe(false); expect(action).toHaveBeenCalledTimes(1);
    release(); await first;
  });

  it('releases loading after an error and accepts an undefined callback', async () => {
    const controller = createPressController(); const onError = vi.fn();
    expect(await controller.run(undefined, onError)).toBe(false);
    expect(await controller.run(async () => { throw new Error('boom'); }, onError)).toBe(false);
    expect(controller.isRunning()).toBe(false); expect(onError).toHaveBeenCalledTimes(1);
  });

  it('blocks disabled and loading controls', () => {
    expect(canRunPressAction({ disabled: true, hasAction: true })).toBe(false);
    expect(canRunPressAction({ loading: true, hasAction: true })).toBe(false);
    expect(canRunPressAction({ hasAction: false })).toBe(false);
    expect(canRunPressAction({ hasAction: true })).toBe(true);
  });
});
