import { describe, expect, it } from 'vitest';
import { buildBetaFeedbackReport } from './betaTesting';

describe('beta feedback export', () => {
  it('attaches only the approved technical context', () => {
    const report = buildBetaFeedbackReport({ activity: 'Первый запуск', unclear: '', screen: 'Welcome', usabilityRating: 8, designRating: 9, rhythmRating: 8, wouldUse: 'yes', comment: '' }, { version: '0.4.0', buildNumber: '2', route: '/welcome', theme: 'dark', performanceMode: 'automatic', databaseVersion: 9, appVariant: 'preview' });
    expect(report.technical.route).toBe('/welcome');
    expect(JSON.stringify(report.technical)).not.toMatch(/weight|age|allerg|diary|name/i);
  });
});
