import { rhythmConfig, rhythmModeRank } from '../config/rhythmConfig';
import { formatRhythmMessage, selectRhythmMessage } from './messageService';
import type { RhythmContext, RhythmDecision, RhythmEvent, RhythmMessageCategory, RhythmSettings } from '../types/rhythm';

const categoryByEvent:Record<RhythmEvent['type'],RhythmMessageCategory>={APP_OPENED:'support',SCREEN_OPENED:'support',MEAL_ADDED:'mealAdded',MEAL_REMOVED:'support',MEAL_UPDATED:'mealAdded',WATER_ADDED:'support',WEIGHT_ADDED:'support',MEAL_PLAN_CREATED:'planner',REMAINDER_MATCH_OPENED:'planner',RECOMMENDATION_ACCEPTED:'mealAdded',RECOMMENDATION_REJECTED:'quiet',RECOMMENDATION_REPLACED:'planner',DAY_READY_TO_CLOSE:'balance',DAY_COMPLETED:'flow',FLOW_MILESTONE:'flow',WEEK_COMPLETED:'flow',BUDGET_APPROACHING:'balance',BUDGET_EXCEEDED:'support',EMPTY_MEAL_DETECTED:'emptyMeal',INSIGHT_CREATED:'balance'};
const priorityByEvent:Partial<Record<RhythmEvent['type'],number>>={FLOW_MILESTONE:95,DAY_COMPLETED:90,RECOMMENDATION_ACCEPTED:82,MEAL_ADDED:75,MEAL_PLAN_CREATED:70,DAY_READY_TO_CLOSE:65,BUDGET_EXCEEDED:60,EMPTY_MEAL_DETECTED:45,APP_OPENED:20,SCREEN_OPENED:10};
const requestedEvents=new Set<RhythmEvent['type']>(['REMAINDER_MATCH_OPENED','MEAL_PLAN_CREATED','RECOMMENDATION_ACCEPTED','RECOMMENDATION_REJECTED','RECOMMENDATION_REPLACED','DAY_COMPLETED','FLOW_MILESTONE']);

export function decideRhythmResponse(event:RhythmEvent,context:RhythmContext,settings:RhythmSettings):RhythmDecision|null{
  if(!settings.enabled||settings.mode==='off')return null;
  if(!settings.showOnOtherScreens&&!context.route.includes('flow')&&!requestedEvents.has(event.type))return null;
  const initiative=!requestedEvents.has(event.type);
  if(initiative&&context.recentRejections>=rhythmConfig.rejectionSuppressionCount)return null;
  if(initiative&&context.lastInitiativeAt&&Date.now()-new Date(context.lastInitiativeAt).getTime()<rhythmConfig.initiativeCooldownMs)return null;
  let category=categoryByEvent[event.type];
  if(settings.mode==='quiet'&&!requestedEvents.has(event.type))category='quiet';
  const template=selectRhythmMessage(category,context.recentTemplateIds,`${event.type}-${context.contextHash}`);
  if(!template||rhythmModeRank[settings.mode]<rhythmModeRank[template.minMode??'quiet'])return null;
  const variables={calories:context.remaining?.calories,streak:context.flow?.currentStreak,...event.payload};
  return{eventType:event.type,templateId:template.id,message:formatRhythmMessage(template.text,variables),visual:{emotion:template.emotion,action:template.action},priority:priorityByEvent[event.type]??50,kind:event.type==='MEAL_PLAN_CREATED'||event.type==='REMAINDER_MATCH_OPENED'?'card':'toast',route:event.route??context.route};
}

