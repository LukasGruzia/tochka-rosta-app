import { describe, expect, it } from 'vitest';
import { createBuildInfo, normalizeAppVariant } from './buildInfo';

describe('build information', () => {
  it('normalizes safe public variants', () => {
    expect(normalizeAppVariant('development')).toBe('development');
    expect(normalizeAppVariant('preview')).toBe('preview');
    expect(normalizeAppVariant('random')).toBe('production');
  });

  it('does not require an update id before EAS Update is configured', () => {
    const info = createBuildInfo({ version: '0.4.0', appVariant: 'preview', updateChannel: 'preview' });
    expect(info.appVariant).toBe('preview');
    expect(info.updateChannel).toBe('preview');
    expect(info.updateId).toBeNull();
  });
});
