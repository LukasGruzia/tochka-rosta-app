import { create } from 'zustand';
import { initializeDatabase } from '@/database/database';
import { addDiaryEntry, deleteDiaryEntry, ensureDiaryDay, ensureTodayDiary, loadDiary, repeatDiaryEntry as repeatDiaryEntryRepository, restoreDiaryEntry as restoreDiaryEntryRepository, updateDiaryEntry } from '@/database/repositories/diaryRepository';
import { completeDiaryDay, loadFlowState } from '@/database/repositories/flowRepository';
import { clearMealPlan, loadMealPlan, saveMealPlan } from '@/database/repositories/mealPlanRepository';
import { addFavorite as addFavoriteRepository, loadProducts, loadProductsPage, PRODUCT_PAGE_SIZE, toggleFavorite as toggleFavoriteRepository } from '@/database/repositories/productRepository';
import { loadProfileAndTarget, saveProfileAndTarget, updateProfileAvatar, updateWaterGoal } from '@/database/repositories/profileRepository';
import { addWater as addWaterRepository, loadWaterSummary, removeWaterEntry } from '@/database/repositories/waterRepository';
import { getSetting, resetApplicationData, setSetting } from '@/database/repositories/settingsRepository';
import { generateMealPlan } from '@/services/mealPlanner';
import { calculateNutrition } from '@/services/nutritionCalculator';
import { deleteStoredAvatar, prepareStoredAvatar } from '@/services/avatarStorage';
import { loadBudgetSettings } from '@/database/repositories/budgetRepository';
import type { DailyPlanOptions } from '@/services/mealPlanner';
import type { DiaryEntryInput, DiarySummary, FlowState, MealPlan, MealType, NutritionResult, Product, ProfileDraft, SavedProfile, ThemeMode, WaterSummary } from '@/types/domain';
import { getLocalDateKey } from '@/utils/date';
import { isPerformanceMode, type PerformanceMode } from '@/config/performance';
import { setPerformanceMetric } from '@/performance/performanceLogger';
import { invalidateCalendarMonth } from '@/database/repositories/calendarRepository';
import { publishRhythmEvent } from '@/features/rhythm/services/eventService';
import { recordRhythmFeedback } from '@/features/rhythm/repositories/rhythmRepository';

export const defaultDraft: ProfileDraft = {
  name: '', age: 30, calculationSex: 'male', heightCm: 175, weightKg: 70,
  activityLevel: 'medium', goal: 'balance', dietPreference: 'all', restrictions: [],
};

type AppStatus = 'booting' | 'ready' | 'error';
export type AvatarStatus = 'loading' | 'ready' | 'missing' | 'empty';
interface AppState {
  status: AppStatus;
  error: string | null;
  onboardingCompleted: boolean;
  onboardingStep: string;
  draft: ProfileDraft;
  profile: SavedProfile | null;
  target: NutritionResult | null;
  products: Product[];
  productsFullyLoaded: boolean;
  diaryDate: string;
  diary: DiarySummary | null;
  flow: FlowState | null;
  mealPlan: MealPlan | null;
  themeMode: ThemeMode;
  performanceMode: PerformanceMode;
  water: WaterSummary | null;
  avatarStatus: AvatarStatus;
  initialize: () => Promise<void>;
  saveDraft: (patch: Partial<ProfileDraft>, completedStep?: string) => Promise<void>;
  setCalculatedTarget: (target: NutritionResult) => void;
  completeOnboarding: () => Promise<void>;
  updateProfile: (draft: ProfileDraft) => Promise<void>;
  recalculate: () => Promise<void>;
  refreshProducts: () => Promise<void>;
  ensureProductsLoaded: () => Promise<void>;
  setDiaryDate: (date: string) => Promise<void>;
  addToDiary: (input: Omit<DiaryEntryInput, 'date'> & { date?: string }) => Promise<void>;
  addProduct: (product: Product, mealType?: MealType) => Promise<void>;
  editDiaryEntry: (id: number, mealType: MealType, servings: number, quantityG?: number) => Promise<void>;
  removeDiaryEntry: (id: number) => Promise<void>;
  restoreDiaryEntry: (id: number) => Promise<void>;
  repeatDiaryEntry: (id: number) => Promise<void>;
  addFavorite: (productId: number) => Promise<void>;
  refreshDiary: (date?: string) => Promise<void>;
  toggleFavorite: (productId: number) => Promise<boolean>;
  closeDay: () => Promise<void>;
  refreshFlow: () => Promise<void>;
  generatePlan: (date?: string, replacements?: Partial<Record<MealType, number>>, options?: DailyPlanOptions) => Promise<void>;
  loadPlan: (date?: string) => Promise<void>;
  resetPlan: (date?: string) => Promise<void>;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  setPerformanceMode: (mode: PerformanceMode) => Promise<void>;
  setAvatar: (uri: string | null) => Promise<void>;
  reloadProfile: () => Promise<void>;
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

let fullProductsPromise: Promise<Product[]> | null = null;
let initializationPromise: Promise<void> | null = null;
let diaryLoadGeneration = 0;

async function prepareProfileAvatar(saved: Awaited<ReturnType<typeof loadProfileAndTarget>>) {
  if (!saved?.profile.avatarUri) return { saved, avatarStatus: 'empty' as const };
  const previous = saved.profile.avatarUri;
  const prepared = await prepareStoredAvatar(previous);
  if (!prepared.available) return { saved, avatarStatus: 'missing' as const };
  if (!prepared.migrated) return { saved, avatarStatus: 'ready' as const };
  try {
    const updatedAt = await updateProfileAvatar(prepared.uri);
    return {
      saved: { ...saved, profile: { ...saved.profile, avatarUri: prepared.uri, updatedAt } },
      avatarStatus: 'ready' as const,
    };
  } catch (error) {
    await deleteStoredAvatar(prepared.uri).catch(() => undefined);
    throw error;
  }
}

export const useAppStore = create<AppState>((set, get) => ({
  status: 'booting', error: null, onboardingCompleted: false, onboardingStep: 'welcome',
  draft: defaultDraft, profile: null, target: null, products: [], productsFullyLoaded: false, diaryDate: getLocalDateKey(), diary: null,
  flow: null, mealPlan: null, themeMode: 'system', performanceMode: 'automatic', water: null, avatarStatus: 'loading',

  initialize: async () => {
    if (initializationPromise) return initializationPromise;
    initializationPromise = (async () => {
      try {
      await initializeDatabase();
      const [completedValue, stepValue, draftValue, themeValue, performanceValue, saved, products, flow] = await Promise.all([
        getSetting('onboarding_completed'), getSetting('onboarding_step'), getSetting('onboarding_draft'),
        getSetting('theme_mode'), getSetting('performance_mode'),
        loadProfileAndTarget(), loadProductsPage({ limit: PRODUCT_PAGE_SIZE }), loadFlowState(),
      ]);
       const preparedProfile = await prepareProfileAvatar(saved);
       const currentSaved = preparedProfile.saved;
       const completed = completedValue === 'true' && currentSaved !== null;
       if (completed && currentSaved) await ensureTodayDiary(currentSaved.target);
      const diaryDate = getLocalDateKey();
      const [diary, mealPlan, water] = completed ? await Promise.all([loadDiary(diaryDate), loadMealPlan(diaryDate), loadWaterSummary(diaryDate)]) : [null, null, null];
      set({
        status: 'ready', onboardingCompleted: completed, onboardingStep: stepValue ?? 'welcome',
         draft: currentSaved?.profile ?? parseDraft(draftValue), profile: currentSaved?.profile ?? null,
         target: currentSaved?.target ?? null, products, productsFullyLoaded: false, diaryDate, diary, flow, mealPlan, water,
         avatarStatus: preparedProfile.avatarStatus,
        themeMode: themeValue === 'dark' || themeValue === 'light' ? themeValue : 'system',
        performanceMode: isPerformanceMode(performanceValue) ? performanceValue : 'automatic', error: null,
      });
      setPerformanceMetric('loadedProducts', products.length);
      } catch (error) {
        set({ status: 'error', error: error instanceof Error ? error.message : 'Не удалось открыть локальную базу' });
      }
    })();
    try {
      await initializationPromise;
    } finally {
      initializationPromise = null;
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

  refreshProducts: async () => {
    const products = await loadProductsPage({ limit: PRODUCT_PAGE_SIZE });
    set({ products, productsFullyLoaded: false });
    setPerformanceMetric('loadedProducts', products.length);
  },

  ensureProductsLoaded: async () => {
    if (get().productsFullyLoaded) return;
    fullProductsPromise ??= loadProducts().finally(() => { fullProductsPromise = null; });
    const products = await fullProductsPromise;
    set({ products, productsFullyLoaded: true });
    setPerformanceMetric('loadedProducts', products.length);
  },

  setDiaryDate: async (date) => {
    if (date === get().diaryDate && get().diary) return;
    const generation = ++diaryLoadGeneration;
    const target = get().target;
    if (target) await ensureDiaryDay(date, target);
    const [diary, mealPlan, water] = await Promise.all([loadDiary(date), loadMealPlan(date), loadWaterSummary(date)]);
    if (generation !== diaryLoadGeneration) return;
    set({ diaryDate: date, diary, mealPlan, water });
  },

  addToDiary: async (input) => {
    const date = input.date ?? get().diaryDate;
    await addDiaryEntry({ ...input, date }, get().target ?? undefined);
    invalidateCalendarMonth(date);
    if (date === get().diaryDate) set({ diary: await loadDiary(date) });
    void publishRhythmEvent({ type: 'MEAL_ADDED', route: '/diary', payload: { mealType: input.mealType, productName: input.product.name } });
  },

  addProduct: async (product, mealType = 'snack') => get().addToDiary({ product, mealType, servings: 1 }),

  editDiaryEntry: async (id, mealType, servings, quantityG) => {
    await updateDiaryEntry(id, { mealType, servings, quantityG });
    invalidateCalendarMonth(get().diaryDate);
    set({ diary: await loadDiary(get().diaryDate) });
    void publishRhythmEvent({ type: 'MEAL_UPDATED', route: '/diary', payload: { mealType } });
  },

  removeDiaryEntry: async (id) => {
    const removed = get().diary?.entries.find((entry) => entry.id === id);
    await deleteDiaryEntry(id);
    invalidateCalendarMonth(get().diaryDate);
    set({ diary: await loadDiary(get().diaryDate) });
    if (removed?.productId && Date.now() - new Date(removed.createdAt).getTime() < 15 * 60 * 1000) void recordRhythmFeedback('removedSoon', { productIds: [removed.productId] });
    void publishRhythmEvent({ type: 'MEAL_REMOVED', route: '/diary', payload: { mealType: removed?.mealType } });
  },

  restoreDiaryEntry: async (id) => {
    await restoreDiaryEntryRepository(id);
    invalidateCalendarMonth(get().diaryDate);
    set({ diary: await loadDiary(get().diaryDate) });
  },

  repeatDiaryEntry: async (id) => {
    await repeatDiaryEntryRepository(id);
    invalidateCalendarMonth(get().diaryDate);
    set({ diary: await loadDiary(get().diaryDate) });
  },

  addFavorite: async (productId) => {
    await addFavoriteRepository(productId);
    set({ products: get().products.map((product) => product.id === productId ? { ...product, isFavorite: true } : product) });
    void recordRhythmFeedback('favorite', { productIds: [productId] });
  },

  refreshDiary: async (date) => {
    const selectedDate = date ?? get().diaryDate;
    const generation = ++diaryLoadGeneration;
    if (get().target) await ensureDiaryDay(selectedDate, get().target!);
    const diary = await loadDiary(selectedDate);
    if (generation === diaryLoadGeneration) set({ diaryDate: selectedDate, diary });
  },

  toggleFavorite: async (productId) => {
    const isFavorite = await toggleFavoriteRepository(productId);
    set({ products: get().products.map((product) => product.id === productId ? { ...product, isFavorite } : product) });
    if (isFavorite) void recordRhythmFeedback('favorite', { productIds: [productId] });
    return isFavorite;
  },

  closeDay: async () => {
    const flow = await completeDiaryDay(get().diaryDate);
    invalidateCalendarMonth(get().diaryDate);
    set({ flow, diary: await loadDiary(get().diaryDate) });
    void publishRhythmEvent({ type: 'DAY_COMPLETED', route: '/flow', payload: { streak: flow.currentStreak } });
    if ([3, 7, 14, 30, 50, 100].includes(flow.currentStreak)) void publishRhythmEvent({ type: 'FLOW_MILESTONE', route: '/flow', payload: { streak: flow.currentStreak } });
  },

  refreshFlow: async () => set({ flow: await loadFlowState() }),

  generatePlan: async (date, replacements, options) => {
    const selectedDate = date ?? get().diaryDate;
    await get().ensureProductsLoaded();
    const { products, target, profile } = get();
    if (!target || !profile) throw new Error('Сначала заполни профиль');
    const budget=options?.budget??await loadBudgetSettings();
    const plan = generateMealPlan(selectedDate, products, target, profile, replacements,{...options,budget});
    await saveMealPlan(plan);
    set({ mealPlan: plan });
    void publishRhythmEvent({ type: 'MEAL_PLAN_CREATED', route: '/meal-plan', payload: { itemCount: plan.items.length } });
  },

  loadPlan: async (date) => set({ mealPlan: await loadMealPlan(date ?? get().diaryDate) }),

  resetPlan: async (date) => {
    await clearMealPlan(date ?? get().diaryDate);
    set({ mealPlan: null });
  },

  setThemeMode: async (mode) => { set({ themeMode: mode }); await setSetting('theme_mode', mode); },
  setPerformanceMode: async (mode) => { set({ performanceMode: mode }); await setSetting('performance_mode', mode); },

  setAvatar: async (uri) => {
    const previous = get().profile?.avatarUri;
    const updatedAt = await updateProfileAvatar(uri);
    const profile = get().profile;
    if (profile) set({
      profile: { ...profile, avatarUri: uri, updatedAt },
      draft: { ...get().draft, avatarUri: uri },
      avatarStatus: uri ? 'ready' : 'empty',
    });
    if (previous && previous !== uri) void deleteStoredAvatar(previous).catch(() => undefined);
  },

  reloadProfile: async () => {
    set({ avatarStatus: 'loading' });
    const prepared = await prepareProfileAvatar(await loadProfileAndTarget());
    if (!prepared.saved) {
      set({ profile: null, target: null, avatarStatus: 'empty' });
      return;
    }
    set({
      profile: prepared.saved.profile,
      target: prepared.saved.target,
      draft: prepared.saved.profile,
      avatarStatus: prepared.avatarStatus,
    });
  },

  refreshWater: async (date) => set({ water: await loadWaterSummary(date ?? get().diaryDate) }),
  addWater: async (amountMl,date) => { const selected=date??get().diaryDate; await addWaterRepository(amountMl,selected); if(selected===get().diaryDate)set({water:await loadWaterSummary(selected)}); void publishRhythmEvent({type:'WATER_ADDED',route:'/water-tracker',payload:{amountMl}}); },
  removeWater: async (id) => { await removeWaterEntry(id); set({water:await loadWaterSummary(get().diaryDate)}); },
  setWaterGoal: async (goalMl) => { const value=await updateWaterGoal(goalMl); const profile=get().profile;if(profile)set({profile:{...profile,waterGoalMl:value},water:get().water?{...get().water!,goalMl:value}:null}); },

  reset: async () => {
    await deleteStoredAvatar(get().profile?.avatarUri);
    await resetApplicationData();
    set({ onboardingCompleted: false, onboardingStep: 'welcome', draft: defaultDraft, profile: null, target: null,
      diaryDate: getLocalDateKey(), diary: null, flow: await loadFlowState(), mealPlan: null, products: await loadProductsPage({ limit: PRODUCT_PAGE_SIZE }), productsFullyLoaded: false, water:null, themeMode:'system', performanceMode:'automatic', avatarStatus:'empty' });
  },
}));
