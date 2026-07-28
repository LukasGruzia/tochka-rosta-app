import { getLocalDateKey } from '../utils/date';

function addDays(dateKey: string, days: number) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(year, month - 1, day + days, 12);
  return getLocalDateKey(date);
}

export function calculateStreaks(dateKeys: string[], today = getLocalDateKey(), pauseKeys: string[] = []) {
  const completed = new Set(dateKeys);const pauses=new Set(pauseKeys.filter((date)=>!completed.has(date)));const dates=[...new Set([...completed,...pauses])].sort();
  let longestStreak = 0;
  let running = 0;
  let previous: string | null = null;
  for (const date of dates) {
    running = previous && addDays(previous, 1) === date ? running + (completed.has(date)?1:0) : completed.has(date)?1:0;
    longestStreak = Math.max(longestStreak, running);
    previous = date;
  }
  const latest = dates.at(-1) ?? null;const lastCompletedDate=[...completed].sort().at(-1)??null;
  let currentStreak = 0;
  if (latest === today || latest === addDays(today, -1)) {
    currentStreak = completed.has(latest!)?1:0;
    for (let index = dates.length - 2; index >= 0; index -= 1) {
      if (addDays(dates[index], 1) !== dates[index + 1]) break;
      if(completed.has(dates[index]))currentStreak += 1;
    }
  }
  return { currentStreak, longestStreak, lastCompletedDate };
}

export const flowMilestones = [
  { days: 3, title: 'Первый ритм', reward:'Этап привычки' },
  { days: 7, title: 'Неделя в потоке', reward:'Достижение' },
  { days: 14, title: 'Баланс укрепляется', reward:'Концептуальная награда' },
  { days: 30, title: 'Стабильная привычка', reward:'Будущий бонус программы' },
  { days: 60, title: 'Новый уровень', reward:'Достижение' },
] as const;

export function getFlowMilestone(streak: number) {
  const achieved = [...flowMilestones].reverse().find((item) => streak >= item.days) ?? null;
  const next = flowMilestones.find((item) => streak < item.days) ?? null;
  return { achieved, next };
}
export function getFlowSubtitle(streak:number){if(streak<=0)return'Начни с одного завершённого дня.';if(streak<7)return'Ты находишь свой ритм.';if(streak<14)return'Неделя уже стала частью пути.';if(streak<30)return'Баланс становится устойчивее.';return'Стабильность превращается в привычку.';}
export function getFlowProgress(streak:number){const next=flowMilestones.find((item)=>streak<item.days)??null;const previous=[...flowMilestones].reverse().find((item)=>streak>=item.days)?.days??0;if(!next)return{next:null,remaining:0,progress:1};return{next,remaining:next.days-streak,progress:Math.min(1,(streak-previous)/Math.max(1,next.days-previous))};}
