# First Minute and Beta audit

Date: 2026-08-02  
Baseline commit: `a2960f93819b925be46c974f2b9aec6600a6bb29`

## Existing first-run flow

The launch route initializes SQLite and shows a React launch screen after the native splash. A new user then follows nine routes:

1. Welcome.
2. Name.
3. Sex and age.
4. Height and weight.
5. Activity.
6. Goal.
7. Diet and restrictions.
8. Calculation.
9. Automatic finish screen.

The optional “Что внутри” path adds a four-slide marketing carousel before the name screen, making ten routes and thirteen visible states. The shortest path requires eight CTA presses after launch.

The required calculation inputs are age, calculation sex, height, weight, activity and goal. The previous UI also made the name mandatory. Diet had a selected default; restrictions were optional.

## Findings

- The first useful result appears only after all profile screens.
- There is no real diary entry inside onboarding.
- The optional introduction is a four-slide horizontal carousel.
- No onboarding screen enables the existing explicit back button.
- Skip is available only in the optional carousel; optional profile details cannot be deferred clearly.
- Draft data is saved only after a step CTA. Edits made on the active screen can be lost if the process is interrupted.
- Persistence uses `onboarding_step` and `onboarding_draft`, but has no version, timestamps, duration, resume counter or first-entry state.
- A profile marked complete is protected from onboarding. Existing users therefore do not normally repeat it after an update.
- The new-user launch route adds a fixed 1,750 ms delay and the returning-user route adds 650 ms after initialization.
- The native and React launch surfaces share the same dark brand background, but the extra fixed delay makes the launch feel duplicated.
- Camera and photo permissions are already requested in context by scanner/image-picker flows, not during onboarding.
- Form fields use safe areas and `KeyboardAvoidingView`, but age/height/weight are split across screens and the primary action does not move with a persisted per-field draft.
- Error handling exists at the router root, but there is no onboarding-specific boundary or recovery copy.

## Design-system audit

The project already has a strong reusable base: semantic theme objects, a 4–48 spacing scale, radii, shadows, glass surfaces, Dynamic Type caps, reduced-motion checks, a 44×44 back button and accessible tab labels.

Gaps for this sprint:

- Several requested semantic aliases are missing (`surfacePrimary`, `surfaceElevated`, `surfaceSelected`, `surfaceGlass`, `textTertiary`, `accentPrimary`, `accentSoft`, `success`, `borderSubtle`, `separator`, `shadow`, `goldAccent`).
- Typography lacks explicit `largeTitle`, `callout`, `button` and public `metric` variants.
- The primary button has no loading announcement and exposes secondary styling through a boolean rather than a complete action hierarchy.
- Choice cards convey selection visually and through their label, but do not expose `accessibilityState.selected`.
- Content cards and real blur are already separated; the sprint should retain that approach rather than adding blur to lists.

## Navigation and home audit

- Root tabs already match the required five sections: Home, Diary, Catalog, Flow and Profile.
- Nested screens use the shared `AppBackButton`, fallback routes and iOS stack navigation.
- The home screen already calculates a smart meal prompt, but it appears after a four-action grid and does not model all requested `NextBestAction` states.
- Empty-state copy exists in several areas and remains non-judgmental.

## App and build audit

- Expo SDK: 54 (`expo ~54.0.0`).
- App version: 0.3.0.
- iOS bundle identifier: `ru.tochkarosta.app`.
- Android package: `ru.tochkarosta.app`.
- Scheme: `tochkarostaapp`.
- Icon and splash assets are configured.
- Camera and photo permission descriptions are configured.
- `eas.json` is absent.
- `owner`, EAS `projectId`, build numbers, runtime version and update URL are absent.
- `expo-updates` is not explicitly configured, so EAS Update must not be enabled automatically.
- `expo-dev-client` is not installed at the baseline.

## Target architecture

The replacement flow uses six user-controlled interactive screens after launch:

1. Welcome.
2. Goal.
3. Compact profile parameters.
4. Diet and optional restrictions.
5. Personalized result.
6. Optional first diary entry.

Name, budget, schedule, favorites, avatar, notifications, animation/performance choices and weekly planning move to progressive onboarding. Onboarding state is versioned and persisted locally after meaningful changes. The isolated demo uses no real profile or diary writes.
