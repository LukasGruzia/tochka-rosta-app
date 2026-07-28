import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (file: string) => readFileSync(resolve(process.cwd(), file), 'utf8');

describe('local image pipeline', () => {
  it('persists bounded JPEG copies for avatars and food photos', () => {
    const avatar = read('src/services/avatarStorage.ts');
    const food = read('src/services/foodImageStorage.ts');
    expect(avatar).toContain('width: 512');
    expect(avatar).toContain('compress: 0.82');
    expect(food).toContain('width: 800');
    expect(food).toContain('compress: 0.8');
    expect(food).toContain('documentDirectory');
  });
});
