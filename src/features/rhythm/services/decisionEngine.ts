import { rhythmConfig, rhythmModeRank } from '../config/rhythmConfig';
import { formatRhythmModeMessage, getRhythmModeConfig, resolveRhythmAction } from '../config/rhythmModes';
import { rhythmScenarios } from '../config/rhythmScenarios';
import { formatRhythmMessage, selectRhythmMessage } from './messageService';
import type { RhythmContext, RhythmDecision, RhythmEvent, RhythmSettings } from '../types/rhythm';

export function decideRhythmResponse(event:RhythmEvent,context:RhythmContext,settings:RhythmSettings):RhythmDecision|null{
  if(!settings.enabled)return null;
  const mode=getRhythmModeConfig(settings.mode);
  if(!settings.reactionsEnabled&&['MEAL_ADDED','MEAL_REMOVED','MEAL_UPDATED'].includes(event.type))return null;
  if(!settings.recommendationsEnabled&&['MEAL_PLAN_CREATED','REMAINDER_MATCH_OPENED'].includes(event.type))return null;
  if(!settings.budgetEnabled&&['BUDGET_APPROACHING','BUDGET_EXCEEDED'].includes(event.type))return null;
  const scenario=rhythmScenarios[event.type];
  if(!settings.showOnOtherScreens&&!context.route.includes('flow')&&!scenario.requested)return null;
  const initiative=!scenario.requested;
  const importantQuietEvent=['DAY_COMPLETED','FLOW_MILESTONE','WEEK_COMPLETED'].includes(event.type);
  if(initiative&&!mode.proactiveSuggestionsEnabled&&!importantQuietEvent)return null;
  if(initiative&&context.recentRejections>=rhythmConfig.rejectionSuppressionCount)return null;
  if(initiative&&context.lastInitiativeAt&&Date.now()-new Date(context.lastInitiativeAt).getTime()<mode.proactiveCooldownMinutes*60*1000)return null;
  let category=scenario.category;
  if(settings.mode==='quiet'&&!scenario.requested)category='quiet';
  const template=selectRhythmMessage(category,context.recentTemplateIds,`${event.type}-${context.contextHash}`);
  if(!template||(!scenario.requested&&rhythmModeRank[settings.mode]<rhythmModeRank[template.minMode??'quiet']))return null;
  const variables={calories:context.remaining?.calories,streak:context.flow?.currentStreak,...event.payload};
  const emotion=settings.mode==='quiet'?(importantQuietEvent?'supportive':'neutralAttention'):settings.mode==='active'&&template.action==='holdFood'?'food':template.emotion;
  return{eventType:event.type,templateId:template.id,message:formatRhythmModeMessage(settings.mode,formatRhythmMessage(template.text,variables)),visual:{emotion,action:resolveRhythmAction(settings.mode,template.action),intensity:mode.animationIntensity},priority:scenario.priority,kind:event.type==='MEAL_PLAN_CREATED'||event.type==='REMAINDER_MATCH_OPENED'?'card':'toast',route:event.route??context.route};
}

