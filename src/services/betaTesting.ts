import { getSetting, setSetting } from '@/database/repositories/settingsRepository';

const CHECKLIST_KEY = 'beta_checklist_v1';

export interface BetaFeedbackDraft {
  activity: string;
  unclear: string;
  screen: string;
  usabilityRating: number;
  designRating: number;
  rhythmRating: number;
  wouldUse: 'yes' | 'maybe' | 'no';
  comment: string;
}

export interface BetaTechnicalContext {
  version: string;
  buildNumber: string;
  route: string;
  theme: string;
  performanceMode: string;
  databaseVersion: string | number;
  appVariant: string;
}

export async function loadBetaChecklistState() {
  const raw = await getSetting(CHECKLIST_KEY);
  if (!raw) return [] as string[];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [] as string[];
  }
}

export async function saveBetaChecklistState(ids: string[]) {
  await setSetting(CHECKLIST_KEY, JSON.stringify([...new Set(ids)]));
}

export async function clearBetaChecklistState() {
  await setSetting(CHECKLIST_KEY, '[]');
}

export function buildBetaFeedbackReport(draft: BetaFeedbackDraft, technical: BetaTechnicalContext) {
  return {
    kind: 'tochka-rosta-beta-feedback',
    createdAt: new Date().toISOString(),
    feedback: { ...draft },
    technical: { ...technical },
    privacy: 'Отчёт не содержит имя, возраст, вес, дневник, аллергены или фотографии.',
  };
}
