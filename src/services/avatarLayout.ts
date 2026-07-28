export function getProfileAvatarSize(screenWidth: number) {
  if (screenWidth < 350) return Math.round(Math.max(88, Math.min(96, screenWidth * 0.28)));
  if (screenWidth >= 430) return Math.round(Math.max(108, Math.min(116, screenWidth * 0.26)));
  return Math.round(Math.max(96, Math.min(108, screenWidth * 0.26)));
}
