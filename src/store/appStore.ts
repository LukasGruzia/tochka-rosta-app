import { create } from 'zustand';
import { initializeDatabase } from '@/database/database';
import { addDiaryEntry, deleteDiaryEntry, ensureDiaryDay, ensureTodayDiary, loadDiary, updateDiaryEntry } from '@/database/repositories/diaryRepository';
import { completeDiaryDay, loadFlowState } from '@/database/repositories/flowRepository';
import { clearMealPlan, loadMealPlan, saveMealPlan } from '@/database/repositories/mealPlanRepository';
import { loadProducts, toggleFavorite as toggleFavoriteRepository } from '@/database/repositories/productRepository';
import { loadProfileAndTarget, saveProfileAndTarget, updateProfileAvatar, updateWaterGoal } from '@/database/repositories/profileRepository';
import { addWater as addWaterRepository, loadWaterSummary, removeWaterEntry } from '@/database/repositories/waterRepository';
import { getSetting, resetApplicationData, setSetting } from '@/database/repositories/settingsRepository';
import { generateMealPlan } from '@/services/mealPlanner';
import { calculateNutrition } from '@/services/nutritionCalculator';
import { deleteStoredAvatar } from '@/services/avatarStorage';
import type { DiaryEntryInput, DiarySummary, FlowState, MealPlan, MealType, NutritionResult, Product, ProfileDraft, SavedProfile, ThemeMode, WaterSummary } from '@/types/domain';
import { getLocalDateKey } from '@/utils/date';

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
  diaryDate: string;
  diary: DiarySummary | null;
  flow: FlowState | null;
  mealPlan: MealPlan | null;
  themeMode: ThemeMode;
  water: WaterSummary | null;
  initialize: () => Promise<void>;
  saveDraft: (patch: Partial<ProfileDraft>, completedStep?: string) => Promise<void>;
  setCalculatedTarget: (target: NutritionResult) => void;
  completeOnboarding: () => Promise<void>;
  updateProfile: (draft: ProfileDraft) => Promise<void>;
  recalculate: () => Promise<void>;
  refreshProducts: () => Promise<void>;
  setDiaryDate: (date: string) => Promise<void>;
  addToDiary: (input: Omit<DiaryEntryInput, 'date'> & { date?: string }) => Promise<void>;
  addProduct: (product: Product, mealType?: MealType) => Promise<void>;
  editDiaryEntry: (id: number, mealType: MealType, servings: number, quantityG?: number) => Promise<void>;
  removeDiaryEntry: (id: number) => Promise<void>;
  refreshDiary: (date?: string) => Promise<void>;
  toggleFavorite: (productId: number) => Promise<void>;
  closeDay: () => Promise<void>;
  refreshFlow: () => Promise<void>;
  generatePlan: (date?: string, replacements?: Partial<Record<MealType, number>>) => Promise<void>;
  loadPlan: (date?: string) => Promise<void>;
  resetPlan: (date?: string) => Promise<void>;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  setAvatar: (uri: string | null) => Promise<void>;
  refreshWater: (date?: string) => Promise<void>;
  addWater: (amountMl: number, date?: string) => Promise<void>;
  removeWater: (id: number) => Promise<void>;
  setWaterGoal: (goalMl: number) => Promise<void>;
  reset: () => Promise<void>;
}

function parseDraft(value: string | null): ProfileDraft {
  if (!value) return defaultDraft;
  try { return { ...defaultDraft, ...(JSON.parse(value) as Partial<ProfileDraft>) }; }
  catch { return defaultDraft; }
}

export const useAppStore = create<AppState>((set, get) => ({
  status: 'booting', error: null, onboardingCompleted: false, onboardingStep: 'welcome',
  draft: defaultDraft, profile: null, target: null, products: [], diaryDate: getLocalDateKey(), diary: null,
  flow: null, mealPlan: null, themeMode: 'system', water: null,

  initialize: async () => {
    try {
      await initializeDatabase();
      const [completedValue, stepValue, draftValue, themeValue, saved, products, flow] = await Promise.all([
        getSetting('onboarding_completed'), getSetting('onboarding_step'), getSetting('onboarding_draft'),
        getSetting('theme_mode'),
        loadProfileAndTarget(), loadProducts(), loadFlowState(),
      ]);
      const completed = completedValue === 'true' && saved !== null;
      if (completed && saved) await ensureTodayDiary(saved.target);
      const diaryDate = getLocalDateKey();
      const [diary, mealPlan, water] = completed ? await Promise.all([loadDiary(diaryDate), loadMealPlan(diaryDate), loadWaterSummary(diaryDate)]) : [null, null, null];
      set({
        status: 'ready', onboardingCompleted: completed, onboardingStep: stepValue ?? 'welcome',
        draft: saved?.profile ?? parseDraft(draftValue), profile: saved?.profile ?? null,
        target: saved?.target ?? null, products, diaryDate, diary, flow, mealPlan, water,
        themeMode: themeValue === 'dark' || themeValue === 'light' ? themeValue : 'system', error: null,
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
    await ensureTodayDiary(target);
    await Promise.all([setSetting('onboarding_completed', 'true'), setSetting('onboarding_step', 'finish')]);
    const saved = await loadProfileAndTarget();
    set({ onboardingCompleted: true, profile: saved?.profile ?? null, target: saved?.target ?? target, diary: await loadDiary(getLocalDateKey()), water: await loadWaterSummary(getLocalDateKey()) });
  },

  updateProfile: async (draft) => {
    const target = calculateNutrition(draft);
    await saveProfileAndTarget(draft, target);
    await ensureTodayDiary(target);
    const saved = await loadProfileAndTarget();
    set({ draft, profile: saved?.profile ?? null, target: saved?.target ?? target });
    await get().refreshDiary();
  },

  recalculate: async () => {
    const profile = get().profile;
    if (profile) await get().updateProfile(profile);
  },

  refreshProducts: async () => set({ products: await loadProducts() }),

  setDiaryDate: async (date) => {
    const target = get().target;
    if (target) await ensureDiaryDay(date, target);
    set({ diaryDate: date, diary: await loadDiary(date), mealPlan: await loadMealPlan(date), water: await loadWaterSummary(date) });
  },

  addToDiary: async (input) => {
    const date = input.date ?? get().diaryDate;
    await addDiaryEntry({ ...input, date }, get().target ?? undefined);
    if (date === get().diaryDate) set({ diary: await loadDiary(date) });
  },

  addProduct: async (product, mealType = 'snack') => get().addToDiary({ product, mealType, servings: 1 }),

  editDiaryEntry: async (id, mealType, servings, quantityG) => {
    await updateDiaryEntry(id, { mealType, servings, quantityG });
    set({ diary: await loadDiary(get().diaryDate) });
  },

  removeDiaryEntry: async (id) => {
    await deleteDiaryEntry(id);
    set({ diary: await loadDiary(get().diaryDate) });
  },

  refreshDiary: async (date) => {
    const selectedDate = date ?? get().diaryDate;
    if (get().target) await ensureDiaryDay(selectedDate, get().target!);
    set({ diaryDate: selectedDate, diary: await loadDiary(selectedDate) });
  },

  toggleFavorite: async (productId) => {
    await toggleFavoriteRepository(productId);
    set({ products: await loadProducts() });
  },

  closeDay: async () => {
    const flow = await completeDiaryDay(get().diaryDate);
    set({ flow, diary: await loadDiary(get().diaryDate) });
  },

  refreshFlow: async () => set({ flow: await loadFlowState() }),

  generatePlan: async (date, replacements) => {
    const selectedDate = date ?? get().diaryDate;
    const { products, target, profile } = get();
    if (!target || !profile) throw new Error('Сначала заполни профиль');
    const plan = generateMealPlan(selectedDate, products.filter((product) => product.sourceType === 'tochka_rosta' || product.isUserCreated), target, profile, replacements);
    await saveMealPlan(plan);
    set({ mealPlan: plan });
  },

  loadPlan: async (date) => set({ mealPlan: await loadMealPlan(date ?? get().diaryDate) }),

  resetPlan: async (date) => {
    await clearMealPlan(date ?? get().diaryDate);
    set({ mealPlan: null });
  },

  setThemeMode: async (mode) => { set({ themeMode: mode }); await setSetting('theme_mode', mode); },

  setAvatar: async (uri) => { const previous=get().profile?.avatarUri;if(previous&&previous!==uri)await deleteStoredAvatar(previous);await updateProfileAvatar(uri); const profile=get().profile; if(profile)set({profile:{...profile,avatarUri:uri},draft:{...get().draft,avatarUri:uri}}); },

  refreshWater: async (date) => set({ water: await loadWaterSummary(date ?? get().diaryDate) }),
  addWater: async (amountMl,date) => { const selected=date??get().diaryDate; await addWaterRepository(amountMl,selected); if(selected===get().diaryDate)set({water:await loadWaterSummary(selected)}); },
  removeWater: async (id) => { await removeWaterEntry(id); set({water:await loadWaterSummary(get().diaryDate)}); },
  setWaterGoal: async (goalMl) => { const value=await updateWaterGoal(goalMl); const profile=get().profile;if(profile)set({profile:{...profile,waterGoalMl:value},water:get().water?{...get().water!,goalMl:value}:null}); },

  reset: async () => {
    await deleteStoredAvatar(get().profile?.avatarUri);
    await resetApplicationData();
    set({ onboardingCompleted: false, onboardingStep: 'welcome', draft: defaultDraft, profile: null, target: null,
      diaryDate: getLocalDateKey(), diary: null, flow: await loadFlowState(), mealPlan: null, products: await loadProducts(), water:null, themeMode:'system' });
  },
}));
