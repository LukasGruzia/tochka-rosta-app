# Beta 1 product audit

Development-only notes captured before the Beta 1 changes. The audit was made from
`feature/beta-1-product-polish` at `403af56`; it is not shown in the application and
does not contain user data.

## Confirmed baseline

- Expo SDK 54, Expo Router 6 and Expo Go compatibility are already intentional.
- The app already separates most data access as UI -> store/hooks -> services ->
  repositories -> SQLite. No route imports `getDatabase` directly.
- The theme already has colors, typography, spacing, radii, shadows, glass, motion,
  sizes and separate light/dark palettes.
- Catalog uses a 32-item SQL page, a virtualized `FlatList`, stable keys, debounced
  search and a bounded first page. Calendar queries one month and caches four.
- Root and tab-level error boundaries, Safe Mode, performance modes, research mode,
  jury demo, local analytics, Rhythm settings and an isolated Rhythm boundary exist.
- Existing tests, TypeScript and ESLint are green before this sprint (57 files,
  168 tests). `npm install` is reproducible from the current lockfile.

## Confirmed gaps and risks

### Data safety

- Diary deletion is a hard delete and has no time-limited Undo, although the UI
  requirement promises recovery.
- The versioned backup omits all SDK-v6 Rhythm tables and `meal_plan_runs`, so Rhythm
  preferences and recommendation history are not restored.
- UUID coverage is good for profile, products, recipes, diary entries, plans, water,
  weight, Flow history, achievements and research sessions, but missing for diary
  days and the new Rhythm event/recommendation entities.
- The USDA seed has 950 rows and no normalized-name duplicates, but nine meat/fish
  rows contain small negative carbohydrate values. Seed versioning prevents repeated
  imports, but an explicit normalization pass is required to repair existing installs.

### UI states and consistency

- Loading/empty/error UI is handwritten per route. Catalog has a local skeleton,
  while diary, product, Rhythm, profile and planner use unrelated placeholders.
- Diary cannot distinguish initial loading from an empty day and its empty state does
  not provide the requested direct first-add action.
- Catalog swallows its load error and renders the same state as an empty result, so a
  database/query failure has no retry action.
- Food search has no visible loading/error state and uses an 80-result one-shot query
  instead of paginating search results.
- Product detail shows source name but maps quality status with a partial inline
  conditional and does not show an explicit update date.
- Several secondary routes still use text glyphs for close/search/check controls;
  these are polish debt, not a blocker for core Beta workflows.

### Workflow and architecture

- The main routes already use narrow Zustand selectors; no large `useAppStore()`
  subscription was found.
- `flow.tsx`, `developer.tsx`, `RecipeForm.tsx` and `CustomProductForm.tsx` remain large
  components. Their database work is delegated, but presentation/orchestration should
  be extracted incrementally rather than rewritten during stabilization.
- Quick Add already remembers the last action and supports search, recent, favorite,
  scan, product, recipe, template, water, weight and meal repeat. The two repeat paths
  add immediately; preview remains available for manual day/meal copy.
- Entry editing is already inline in a bottom sheet, but the requested contextual
  actions (move, repeat, favorite) are not grouped in one explicit menu.

### Lifecycle and performance

- Inspected timers, keyboard/AppState listeners and Reanimated loops have cleanup.
  Rhythm assets are size-specific and animations respect focus/performance settings.
- `loadProducts()` still intentionally loads the full local catalog for planners; it
  is guarded behind `ensureProductsLoaded` and must not be moved into list screens.
- The home/profile routes log and then hide some read errors; their content should
  retain stale data or expose a retry rather than silently look empty.

## Beta 1 implementation order

1. Add shared, reduced-motion-safe state primitives and adopt them in core routes.
2. Add recoverable diary deletion and focused quick workflow polish.
3. Surface catalog/search failures and keep paging bounded.
4. Normalize seed values and centralize product source labels.
5. Extend backup/restore coverage and complete UUID/migration guarantees.
6. Add regression tests and developer Beta checklist/documentation.
7. Run dependency, bundle and Metro checks; keep physical-device claims explicit.

## Deliberately out of scope for this stabilization branch

- Backend/sync, subscription, social features, public profiles, AI chat and payment.
- A new visual identity or global rewrite of working screens.
- Claims about 20-30 minute use, camera behavior or physical iPhone stability without
  an attached device and a human completing those steps.
