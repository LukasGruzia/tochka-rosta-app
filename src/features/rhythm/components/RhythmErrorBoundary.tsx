import { Component, type ErrorInfo, type PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { spacing } from '@/theme/tokens';
import { RhythmCharacter } from './RhythmCharacter';

interface State{failed:boolean;}
export class RhythmErrorBoundary extends Component<PropsWithChildren,State>{state={failed:false};static getDerivedStateFromError(){return{failed:true};}componentDidCatch(error:Error,info:ErrorInfo){if(__DEV__)console.warn('[Rhythm] isolated UI error',error.message,info.componentStack);}render(){if(this.state.failed)return <View style={styles.fallback}><RhythmCharacter size="compact" emotion="neutralAttention" action="none" animated={false}/><AppText tone="secondary">Ритм временно отдыхает. Остальные функции приложения доступны.</AppText></View>;return this.props.children;}}
const styles=StyleSheet.create({fallback:{flexDirection:'row',alignItems:'center',gap:spacing.sm,padding:spacing.md}});

