import { useMemo } from 'react';
import { useAppStore } from '@/store/appStore';
import { getProfileInitials, normalizeDisplayName } from '@/services/profileIdentity';

export function useUserProfile() {
  const profile = useAppStore((state) => state.profile);
  const draftName = useAppStore((state) => state.draft.name);
  const avatarStatus = useAppStore((state) => state.avatarStatus);
  const reloadAvatar = useAppStore((state) => state.reloadProfile);
  const updateAvatar = useAppStore((state) => state.setAvatar);
  const userName = normalizeDisplayName(profile?.name ?? draftName) ?? 'Точка Роста';
  const storedAvatarUri = profile?.avatarUri ?? null;
  const avatarUri = avatarStatus === 'ready' ? storedAvatarUri : null;
  const avatarCacheKey = storedAvatarUri ? `${storedAvatarUri}|${profile?.updatedAt ?? ''}` : undefined;

  return useMemo(() => ({
    profile,
    avatarUri,
    storedAvatarUri,
    avatarCacheKey,
    userName,
    initials: getProfileInitials(userName),
    isLoading: avatarStatus === 'loading',
    avatarStatus,
    reloadAvatar,
    updateAvatar,
  }), [avatarCacheKey, avatarStatus, avatarUri, profile, reloadAvatar, storedAvatarUri, updateAvatar, userName]);
}
