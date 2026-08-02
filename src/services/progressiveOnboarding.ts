export const progressivePromptCooldownMs = 7 * 24 * 60 * 60 * 1000;

export function shouldShowProgressivePrompt(entryCount: number, dismissedAt: string | null, now = Date.now()) {
  if (entryCount < 2) return false;
  if (!dismissedAt) return true;
  const dismissed = new Date(dismissedAt).getTime();
  return !Number.isFinite(dismissed) || now - dismissed >= progressivePromptCooldownMs;
}
