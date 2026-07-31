import type { RhythmRecommendation, RhythmScoreBreakdown } from '../types/rhythm';

export function explainRhythmScore(score: RhythmScoreBreakdown, itemCount = 1) {
  const ranked = [
    [score.proteinFit, 'помогает дополнить белок'], [score.calorieFit, 'подходит к остатку калорий'],
    [score.mealFit, 'подходит для этого приёма пищи'], [score.budgetFit, 'учитывает выбранный бюджет'],
    [score.preferenceFit, 'учитывает твои прошлые решения'], [score.diversityFit, 'добавляет разнообразие'],
  ] as const;
  const reasons: string[] = [...ranked].sort((a, b) => b[0] - a[0]).filter(([value]) => value >= 0.55).slice(0, 3).map(([, text]) => text);
  if (itemCount > 1) reasons.unshift('сочетание дополняет друг друга');
  return reasons.length ? reasons : ['доступный вариант с подходящими данными'];
}

export function explainRecommendation(recommendation: RhythmRecommendation) {
  return recommendation.reasons.join(' · ');
}
