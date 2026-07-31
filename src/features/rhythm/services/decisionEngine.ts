import { rhythmConfig, rhythmModeRank } from '../config/rhythmConfig';
import { rhythmScenarios } from '../config/rhythmScenarios';
import { formatRhythmMessage, selectRhythmMessage } from './messageService';
import type { RhythmContext, RhythmDecision, RhythmEvent, RhythmSettings } from '../types/rhythm';

export function decideRhythmResponse(event:RhythmEvent,context:RhythmContext,settings:RhythmSettings):RhythmDecision|null{
  if(!settings.enabled||settings.mode==='off')return null;
  if(!settings.reactionsEnabled&&['MEAL_ADDED','MEAL_REMOVED','MEAL_UPDATED'].includes(event.type))return null;
  if(!settings.recommendationsEnabled&&['MEAL_PLAN_CREATED','REMAINDER_MATCH_OPENED'].includes(event.type))return null;
  if(!settings.budgetEnabled&&['BUDGET_APPROACHING','BUDGET_EXCEEDED'].includes(event.type))return null;
  const scenario=rhythmScenarios[event.type];
  if(!settings.showOnOtherScreens&&!context.route.includes('flow')&&!scenario.requested)return null;
  const initiative=!scenario.requested;
  if(initiative&&context.recentRejections>=rhythmConfig.rejectionSuppressionCount)return null;
  if(initiative&&context.lastInitiativeAt&&Date.now()-new Date(context.lastInitiativeAt).getTime()<rhythmConfig.initiativeCooldownMs)return null;
  let category=scenario.category;
  if(settings.mode==='quiet'&&!scenario.requested)category='quiet';
  const template=selectRhythmMessage(category,context.recentTemplateIds,`${event.type}-${context.contextHash}`);
  if(!template||rhythmModeRank[settings.mode]<rhythmModeRank[template.minMode??'quiet'])return null;
  const variables={calories:context.remaining?.calories,streak:context.flow?.currentStreak,...event.payload};
  return{eventType:event.type,templateId:template.id,message:formatRhythmMessage(template.text,variables),visual:{emotion:template.emotion,action:template.action},priority:scenario.priority,kind:event.type==='MEAL_PLAN_CREATED'||event.type==='REMAINDER_MATCH_OPENED'?'card':'toast',route:event.route??context.route};
}

