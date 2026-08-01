import type { RhythmEmotion, RhythmSize } from '../types/rhythm';

export type RhythmRasterSize = 'compact' | 'medium' | 'hero';
export interface RhythmAssetMetadata { key:string;fileName:string;width:number;height:number;bytes:number;source:number; }
type EmotionAssets = Partial<Record<RhythmRasterSize, RhythmAssetMetadata>>;

const idleAssets = {
  compact: { key:'idle.compact',fileName:'rhythm-idle-compact.png',width:171,height:256,bytes:38841,source:require('../../../../assets/rhythm/rhythm-idle-compact.png') },
  medium: { key:'idle.medium',fileName:'rhythm-idle-medium.png',width:341,height:512,bytes:130253,source:require('../../../../assets/rhythm/rhythm-idle-medium.png') },
  hero: { key:'idle.hero',fileName:'rhythm-idle-hero.png',width:683,height:1024,bytes:454000,source:require('../../../../assets/rhythm/rhythm-idle-hero.png') },
} as const satisfies Record<RhythmRasterSize, RhythmAssetMetadata>;

export const rhythmEmotionValues:RhythmEmotion[]=['idle','thinking','happy','motivated','caring','surprised','supportive','celebrating','sleeping','neutralAttention','food'];

// Only production-quality 3D renders belong here. Missing emotions deliberately
// resolve to the volumetric idle character instead of a flat drawn substitute.
export const rhythmAssets:Record<RhythmEmotion,EmotionAssets>={
  idle:idleAssets,thinking:{},happy:{},motivated:{},caring:{},surprised:{},supportive:{},celebrating:{},sleeping:{},neutralAttention:{},food:{},
};

const rasterSizeByDisplaySize:Record<RhythmSize,RhythmRasterSize>={small:'compact',compact:'compact',medium:'medium',large:'hero',hero:'hero'};

export interface ResolvedRhythmAsset extends RhythmAssetMetadata { requestedKey:string;requestedEmotion:RhythmEmotion;requestedSize:RhythmRasterSize;fallbackUsed:boolean; }
export function resolveRhythmAsset(emotion:RhythmEmotion,size:RhythmSize):ResolvedRhythmAsset{
  const requestedSize=rasterSizeByDisplaySize[size];const requestedKey=`${emotion}.${requestedSize}`;
  const exact=rhythmAssets[emotion][requestedSize];const sameEmotionMedium=rhythmAssets[emotion].medium;
  const idleForSize=idleAssets[requestedSize];const fallback=exact??sameEmotionMedium??idleForSize??idleAssets.compact??idleAssets.medium;
  return{...fallback,requestedKey,requestedEmotion:emotion,requestedSize,fallbackUsed:fallback.key!==requestedKey};
}

export const rhythmMasterAsset={fileName:'rhythm-idle.png',width:1024,height:1536,bytes:584199} as const;

