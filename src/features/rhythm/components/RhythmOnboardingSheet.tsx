import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { PrimaryButton } from '@/components/PrimaryButton';
import { spacing } from '@/theme/tokens';
import { useRhythmOverlay } from './RhythmOverlayProvider';
import { RhythmCenterSheet } from './RhythmCenterSheet';
import { RhythmCharacter } from './RhythmCharacter';

const pages=[
  {title:'Привет, я Ритм',text:'Я живу в Потоке и помогаю замечать небольшие шаги без оценок и давления.',emotion:'happy' as const,action:'wave' as const},
  {title:'Подсказки из твоих данных',text:'Я работаю локально: смотрю на дневник, цели, ограничения и доступный каталог. Интернет и чат мне не нужны.',emotion:'thinking' as const,action:'presentAdvice' as const},
  {title:'Ты управляешь Ритмом',text:'Выбирай активный, сбалансированный, тихий режим или полностью отключай помощника в профиле.',emotion:'supportive' as const,action:'point' as const},
];
export function RhythmOnboardingSheet(){const{settings,updateSettings}=useRhythmOverlay();const[page,setPage]=useState(0);if(!settings)return null;const finish=()=>updateSettings({...settings,onboardingCompleted:true});const item=pages[page];return <RhythmCenterSheet visible={!settings.onboardingCompleted} title={item.title} onClose={()=>{void finish();}}><View style={styles.hero}><RhythmCharacter size="large" mode={settings.mode} emotion={item.emotion} action={item.action}/><AppText tone="secondary" style={styles.center}>{item.text}</AppText><AppText variant="caption" tone="muted">{page+1} из {pages.length}</AppText></View>{page<pages.length-1?<PrimaryButton label="Продолжить" onPress={()=>setPage(current=>current+1)}/>:<PrimaryButton label="Начать" onPress={finish}/>}<PrimaryButton label="Позже" secondary onPress={finish}/></RhythmCenterSheet>;}
const styles=StyleSheet.create({hero:{alignItems:'center',gap:spacing.md},center:{textAlign:'center'}});

