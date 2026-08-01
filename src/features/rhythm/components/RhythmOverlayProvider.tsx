import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';
import { Keyboard, StyleSheet, View } from 'react-native';
import { router, usePathname } from 'expo-router';
import { useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '@/store/appStore';
import { spacing } from '@/theme/tokens';
import { loadRhythmSettings, recordRhythmDecision, saveRhythmSettings } from '../repositories/rhythmRepository';
import { collectRhythmContext } from '../services/contextService';
import { decideRhythmResponse } from '../services/decisionEngine';
import { subscribeToRhythmEvents } from '../services/eventService';
import type { RhythmDecision, RhythmEvent, RhythmSettings } from '../types/rhythm';
import { RhythmReactionToast } from './RhythmReactionToast';

interface RhythmOverlayValue { settings:RhythmSettings|null;updateSettings:(next:RhythmSettings)=>Promise<void>;reloadSettings:()=>Promise<void>;dismiss:()=>void; }
const RhythmOverlayContext=createContext<RhythmOverlayValue>({settings:null,updateSettings:async()=>{},reloadSettings:async()=>{},dismiss:()=>{}});

export function RhythmOverlayProvider({children}:PropsWithChildren){
  const pathname=usePathname();const insets=useSafeAreaInsets();const reducedMotion=useReducedMotion();const status=useAppStore(state=>state.status);const[settings,setSettings]=useState<RhythmSettings|null>(null);const[queue,setQueue]=useState<RhythmDecision[]>([]);const[keyboardVisible,setKeyboardVisible]=useState(false);
  const opened=useRef(false);
  const reloadSettings=useCallback(async()=>setSettings(await loadRhythmSettings()),[]);
  const updateSettings=useCallback(async(next:RhythmSettings)=>{await saveRhythmSettings(next);setSettings(next);if(!next.enabled)setQueue([]);},[]);
  const processEvent=useCallback(async(event:RhythmEvent,currentSettings:RhythmSettings)=>{const state=useAppStore.getState();const context=await collectRhythmContext({route:event.route??pathname,profile:state.profile,target:state.target,diary:state.diary,flow:state.flow,performanceMode:state.performanceMode,reducedMotion});const decision=decideRhythmResponse(event,context,currentSettings);if(!decision)return;await recordRhythmDecision(decision,context.contextHash);setQueue(current=>[...current.filter(item=>item.templateId!==decision.templateId),decision].sort((a,b)=>b.priority-a.priority).slice(0,3));},[pathname,reducedMotion]);
  useEffect(()=>{if(status!=='ready')return;void reloadSettings();},[reloadSettings,status]);
  useEffect(()=>{if(!settings||status!=='ready')return;const unsubscribe=subscribeToRhythmEvents(event=>{void processEvent(event,settings);});const type=opened.current?'SCREEN_OPENED':'APP_OPENED';opened.current=true;void processEvent({type,route:pathname},settings);return unsubscribe;},[pathname,processEvent,settings,status]);
  useEffect(()=>{const show=Keyboard.addListener('keyboardDidShow',()=>setKeyboardVisible(true));const hide=Keyboard.addListener('keyboardDidHide',()=>setKeyboardVisible(false));return()=>{show.remove();hide.remove();};},[]);
  const dismiss=useCallback(()=>setQueue(current=>current.slice(1)),[]);const active=queue[0]??null;
  const value=useMemo(()=>({settings,updateSettings,reloadSettings,dismiss}),[dismiss,reloadSettings,settings,updateSettings]);
  const animationsEnabled=Boolean(settings?.animationsEnabled&&useAppStore.getState().performanceMode!=='safe'&&!reducedMotion);
  return <RhythmOverlayContext.Provider value={value}>{children}{active&&!keyboardVisible&&settings?<View pointerEvents="box-none" style={[styles.overlay,{bottom:Math.max(insets.bottom,spacing.md)+(pathname.includes('(tabs)')||['/','/diary','/catalog','/flow','/profile'].includes(pathname)?88:12)}]}><RhythmReactionToast decision={active} mode={settings.mode} hapticsEnabled={settings.hapticsEnabled} animated={animationsEnabled} onDismiss={dismiss} onOpen={()=>{dismiss();router.push('/rhythm-center');}}/></View>:null}</RhythmOverlayContext.Provider>;
}
export function useRhythmOverlay(){return useContext(RhythmOverlayContext);}
const styles=StyleSheet.create({overlay:{position:'absolute',left:spacing.md,right:spacing.md,zIndex:1000,elevation:20}});
