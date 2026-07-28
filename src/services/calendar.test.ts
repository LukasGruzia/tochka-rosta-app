import { describe, expect, it } from 'vitest';
import { buildMonthGrid, formatMonthTitle, getCalendarAccessibilityLabel, getWeekStart, shiftMonth } from './calendar';

describe('diary calendar', () => {
  it('builds a stable 6-week Monday-first month grid', () => {
    const grid = buildMonthGrid('2026-07');
    expect(grid).toHaveLength(42);
    expect(grid[0]).toMatchObject({ date: '2026-06-29', inCurrentMonth: false });
    expect(grid[2]).toMatchObject({ date: '2026-07-01', day: 1, inCurrentMonth: true });
  });

  it('shifts months and calculates Monday week starts across boundaries', () => {
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
    expect(shiftMonth('2026-12', 1)).toBe('2027-01');
    expect(getWeekStart('2026-08-02')).toBe('2026-07-27');
    expect(formatMonthTitle('2026-07')).toContain('2026');
  });

  it('announces selection, today and completion to VoiceOver', () => {
    const cell = { date: '2026-07-28', day: 28, inCurrentMonth: true };
    const label = getCalendarAccessibilityLabel(cell, { date: cell.date, entryCount: 3, isCompleted: true, isPaused: false, isMilestone: true, kind: 'completed' }, true, cell.date);
    expect(label).toContain('выбрано');
    expect(label).toContain('сегодня');
    expect(label).toContain('день закрыт');
    expect(label).toContain('этап Потока');
  });
});
