import { describe, expect, it } from 'vitest';
import { migrationV7 } from './v7';

describe('migration v7', () => {
  it('adds stable UUIDs to remaining syncable entities without destructive SQL', () => {
    for (const table of [
      'diary_days',
      'rhythm_events',
      'rhythm_decisions',
      'rhythm_recommendations',
      'rhythm_feedback',
      'meal_plan_runs',
    ]) {
      expect(migrationV7).toContain(`ALTER TABLE ${table} ADD COLUMN uuid TEXT`);
      expect(migrationV7).toContain(`CREATE TRIGGER set_${table}_uuid_v7`);
    }
    expect(migrationV7).not.toMatch(/DROP\s+TABLE|DELETE\s+FROM/i);
  });
});
