import { create } from 'zustand';
import { initializeDatabase } from '@/database/database';
import { addProductToToday, ensureTodayDiary, loadTodayDiary } from '@/database/repositories/diaryRepository';
import { loadProducts } from '@/database/repositories/productRepository';
import { loadProfileAndTarget, saveProfileAndTarget } from '@/database/repositories/profileRepository';
import { getSetting, resetApplicationData, setSetting } from '@/database/repositories/settingsRepository';
import { calculateNutrition } from '@/services/nutritionCalculator';
import type { DiarySummary, NutritionResult, Product, ProfileDraft, SavedProfile } from '@/types/domain';

export const defaultDraft: ProfileDraft = {
  name: '', age: 30, calculationSex: 'male', heightCm: 175, weightKg: 70,
  activityLevel: 'medium', goal: 'balance', dietPreference: 'all', restrictions: [],
};

type AppStatus = 'booting' | 'ready' | 'error';
interface AppState {
  status: AppStatus;
  error: string | null;
  onboardingCompleted: boolean;
  onboardingStep: string;
  draft: ProfileDraft;
  profile: SavedProfile | null;
  target: NutritionResult | null;
  products: Product[];
  diary: DiarySummary | null;
  initialize: () => Promise<void>;
  saveDraft: (patch: Partial<ProfileDraft>, completedStep?: string) => Promise<void>;
  setCalculatedTarget: (target: NutritionResult) => void;
  completeOnboarding: () => Promise<void>;
  updateProfile: (draft: ProfileDraft) => Promise<void>;
  recalculate: () => Promise<void>;
  addProduct: (product: Product) => Promise<void>;
  refreshDiary: () => Promise<void>;
  reset: () => Promise<void>;
}

function parseDraft(value: string | null): ProfileDraft {
  if (!value) return defaultDraft;
  try { return { ...defaultDraft, ...(JSON.parse(value) as Partial<ProfileDraft>) }; }
  catch { return defaultDraft; }
}

export const useAppStore = create<AppState>((set, get) => ({
  status: 'booting', error: null, onboardingCompleted: false, onboardingStep: 'welcome',
  draft: defaultDraft, profile: null, target: null, products: [], diary: null,

  initialize: async () => {
    try {
      await initializeDatabase();
      const [completedValue, stepValue, draftValue, saved, products] = await Promise.all([
        getSetting('onboarding_completed'), getSetting('onboarding_step'), getSetting('onboarding_draft'),
        loadProfileAndTarget(), loadProducts(),
      ]);
      const completed = completedValue === 'true' && saved !== null;
      if (completed && saved) await ensureTodayDiary(saved.target.calories);
      const diary = completed ? await loadTodayDiary() : null;
      set({
        status: 'ready', onboardingCompleted: completed, onboardingStep: stepValue ?? 'welcome',
        draft: saved?.profile ?? parseDraft(draftValue), profile: saved?.profile ?? null,
        target: saved?.target ?? null, products, diary, error: null,
      });
    } catch (error) {
      set({ status: 'error', error: error instanceof Error ? error.message : 'Не удалось открыть локальную базу' });
    }
  },

  saveDraft: async (patch, completedStep) => {
    const draft = { ...get().draft, ...patch };
    set({ draft, onboardingStep: completedStep ?? get().onboardingStep });
    await setSetting('onboarding_draft', JSON.stringify(draft));
    if (completedStep) await setSetting('onboarding_step', completedStep);
  },

  setCalculatedTarget: (target) => set({ target }),

  completeOnboarding: async () => {
    const draft = get().draft;
    const target = get().target ?? calculateNutrition(draft);
    await saveProfileAndTarget(draft, target);
    await ensureTodayDiary(target.calories);
    await Promise.all([setSetting('onboarding_completed', 'true'), setSetting('onboarding_step', 'finish')]);
    const saved = await loadProfileAndTarget();
    set({ onboardingCompleted: true, profile: saved?.profile ?? null, target: saved?.target ?? target, diary: await loadTodayDiary() });
  },

  updateProfile: async (draft) => {
    const target = calculateNutrition(draft);
    await saveProfileAndTarget(draft, target);
    await ensureTodayDiary(target.calories);
    const saved = await loadProfileAndTarget();
    set({ draft, profile: saved?.profile ?? null, target: saved?.target ?? target, diary: await loadTodayDiary() });
  },

  recalculate: async () => {
    const profile = get().profile;
    if (!profile) return;
    await get().updateProfile(profile);
  },

  addProduct: async (product) => {
    await addProductToToday(product);
    set({ diary: await loadTodayDiary() });
  },

  refreshDiary: async () => set({ diary: await loadTodayDiary() }),

  reset: async () => {
    await resetApplicationData();
    set({ onboardingCompleted: false, onboardingStep: 'welcome', draft: defaultDraft, profile: null, target: null, diary: null });
  },
}));
