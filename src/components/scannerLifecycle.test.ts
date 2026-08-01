import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const scanner = readFileSync(resolve(process.cwd(), 'src/app/scanner.tsx'), 'utf8');

describe('scanner torch lifecycle', () => {
  it('wires torch state to CameraView and keeps the control below the frame', () => {
    expect(scanner).toContain('enableTorch={torch}');
    expect(scanner).toMatch(/<View style=\{styles\.frame\}\/><Pressable[^>]+accessibilityRole="switch"/);
    expect(scanner).toContain('accessibilityState={{ checked: torch }}');
    expect(scanner).toContain('Фонарик включён');
  });

  it('turns camera activity and torch off on blur and in background', () => {
    expect(scanner).toContain('useFocusEffect');
    expect(scanner).toContain("AppState.addEventListener('change'");
    expect(scanner).toContain('setTorch(false); setPaused(true)');
  });

  it('keeps permission, retry, manual entry and offline lookup fallbacks', () => {
    for (const value of ['requestPermission', 'findProductByCode', 'getCachedExternalFood', 'fetchOpenFoodFactsProduct', 'Ввести код вручную', 'Попробуй ещё раз']) expect(scanner).toContain(value);
  });
});
