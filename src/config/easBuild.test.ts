import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (file: string) => readFileSync(resolve(process.cwd(), file), 'utf8');

describe('EAS build configuration', () => {
  it('contains development, preview and production profiles', () => {
    const eas = JSON.parse(read('eas.json')) as { build: Record<string, Record<string, unknown>> };
    expect(Object.keys(eas.build)).toEqual(['development', 'preview', 'production']);
    expect(eas.build.development).toMatchObject({ developmentClient: true, distribution: 'internal', channel: 'development' });
    expect(eas.build.preview).toMatchObject({ distribution: 'internal', channel: 'preview' });
    expect(eas.build.production).toMatchObject({ channel: 'production' });
  });

  it('gives Dev and Beta unique identifiers without changing production', () => {
    const config = read('app.config.js');
    expect(config).toContain("isDevelopment ? '.dev' : isPreview ? '.beta' : ''");
    expect(config).toContain('ru.tochkarosta.app${suffix}');
    expect(config).toContain('app-icon-beta.png');
    expect(config).toContain('app-icon-dev.png');
  });

  it('uses the SDK-compatible dev client and an appVersion runtime', () => {
    const pkg = JSON.parse(read('package.json')) as { dependencies: Record<string, string> };
    const app = JSON.parse(read('app.json')) as { expo: { runtimeVersion: { policy: string } } };
    expect(pkg.dependencies['expo-dev-client']).toMatch(/^~6\./);
    expect(app.expo.runtimeVersion.policy).toBe('appVersion');
  });
});
