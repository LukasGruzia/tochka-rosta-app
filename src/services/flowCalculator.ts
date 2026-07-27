import { getLocalDateKey } from '../utils/date';

function addDays(dateKey: string, days: number) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(year, month - 1, day + days, 12);
  return getLocalDateKey(date);
}

export function calculateStreaks(dateKeys: string[], today = getLocalDateKey()) {
  const dates = [...new Set(dateKeys)].sort();
  let longestStreak = 0;
  let running = 0;
  let previous: string | null = null;
  for (const date of dates) {
    running = previous && addDays(previous, 1) === date ? running + 1 : 1;
    longestStreak = Math.max(longestStreak, running);
    previous = date;
  }
  const latest = dates.at(-1) ?? null;
  let currentStreak = 0;
  if (latest === today || latest === addDays(today, -1)) {
    currentStreak = 1;
    for (let index = dates.length - 2; index >= 0; index -= 1) {
      if (addDays(dates[index], 1) !== dates[index + 1]) break;
      currentStreak += 1;
    }
  }
  return { currentStreak, longestStreak, lastCompletedDate: latest };
}

export const flowMilestones = [
  { days: 3, title: 'Первый ритм' },
  { days: 7, title: 'Неделя в потоке' },
  { days: 14, title: 'Баланс укрепляется' },
  { days: 30, title: 'Стабильная привычка' },
] as const;

export function getFlowMilestone(streak: number) {
  const achieved = [...flowMilestones].reverse().find((item) => streak >= item.days) ?? null;
  const next = flowMilestones.find((item) => streak < item.days) ?? null;
  return { achieved, next };
}
