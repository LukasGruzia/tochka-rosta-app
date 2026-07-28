import { useAppStore } from '@/store/appStore';
import { normalizeDisplayName } from '@/services/profileIdentity';
export { normalizeDisplayName } from '@/services/profileIdentity';
export function useUserDisplayName(){return useAppStore(state=>normalizeDisplayName(state.profile?.name??state.draft.name));}
