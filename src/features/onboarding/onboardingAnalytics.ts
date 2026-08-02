import { getSetting, setSetting } from '@/database/repositories/settingsRepository';

export const onboardingEventNames = [
  'onboarding_started',
  'welcome_completed',
  'goal_selected',
  'profile_completed',
  'restrictions_completed',
  'result_viewed',
  'first_entry_started',
  'first_entry_completed',
  'onboarding_completed',
  'onboarding_abandoned',
] as const;

export type OnboardingEventName = (typeof onboardingEventNames)[number];

export interface LocalOnboardingEvent {
  name: OnboardingEventName;
  occurredAt: string;
  step?: string;
  skipped?: boolean;
  durationMs?: number;
  errorCount?: number;
}

const ANALYTICS_KEY = 'first_minute_analytics_v2';

function parseEvents(raw: string | null): LocalOnboardingEvent[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((item): item is LocalOnboardingEvent => Boolean(
        item && typeof item === 'object' && onboardingEventNames.includes((item as LocalOnboardingEvent).name),
      )).slice(-200)
      : [];
  } catch {
    return [];
  }
}

export async function recordOnboardingEvent(
  name: OnboardingEventName,
  metadata: Omit<LocalOnboardingEvent, 'name' | 'occurredAt'> = {},
) {
  const events = parseEvents(await getSetting(ANALYTICS_KEY));
  events.push({ name, occurredAt: new Date().toISOString(), ...metadata });
  await setSetting(ANALYTICS_KEY, JSON.stringify(events.slice(-200)));
}

export async function loadOnboardingEvents() {
  return parseEvents(await getSetting(ANALYTICS_KEY));
}

export async function clearOnboardingResearchData() {
  await setSetting(ANALYTICS_KEY, '[]');
  await setSetting('first_minute_demo_state', '{}');
}

export function buildOnboardingResearchSummary(events: LocalOnboardingEvent[]) {
  const counts = Object.fromEntries(onboardingEventNames.map((name) => [name, 0])) as Record<OnboardingEventName, number>;
  for (const event of events) counts[event.name] += 1;
  const completions = events.filter((event) => event.name === 'onboarding_completed' && typeof event.durationMs === 'number');
  return {
    counts,
    latestDurationMs: completions.at(-1)?.durationMs ?? null,
    totalEvents: events.length,
  };
}
