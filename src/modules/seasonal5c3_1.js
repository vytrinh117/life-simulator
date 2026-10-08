// =====================================================================
// PHASE 5C.3.1 — AUTUMN / OUTDOOR ELIGIBILITY FOUNDATION
// Recovery integration, age bands, legitimate supervision and H3 overnight
// permission rules. Camping/hiking execution is handled by 5C.3.2.
// =====================================================================
const SEASONAL_OUTDOOR_IDS_5C31=new Set(['camping_weekend','autumn_hike']);
function seasonalOutdoorDefinition5C31(activityId){
 const def=seasonalActivityDefinition5C1(activityId);return def&&SEASONAL_OUTDOOR_IDS_5C31.has(activityId)&&def.phase==='5C.3'?def:null
}
function seasonalParticipantContext5C31({participantMode='alone',personId=null,participantIds=[],groupId=null,supervisorId=null}={}){
 const requested=[];if(personId)requested.push(personId);if(Array.isArray(participantIds))requested.push(...participantIds);
 const ids=[...new Set(requested.filter(Boolean))],valid=[],invalid=[];for(const id of ids)(personById(id)?valid:invalid).push(id);
 const group=groupId?(S.groups||[]).find(g=>g.id===groupId)||null:null;
 return {participantMode,personId:personId||null,participantIds:valid,invalidParticipantIds:invalid,groupId:group?.id||null,supervisorId:supervisorId||null}
}
function legitimateCampingSupervisor5C31(personId){
 const p=personById(personId);if(!p)return {ok:false,reason:'supervisor_missing',person:null};
 if(p.deceased||p.movedAway)return {ok:false,reason:'supervisor_unavailable',person:p};
 const age=Number(personAge(p));if(!Number.isFinite(age)||age<18)return {ok:false,reason:'supervisor_not_adult',person:p,age};
 const family=!!(isFamilyPerson(p)||isActualGuardian(p));
 const friendsFamily=p.role==='friend parent'||p.relation==='friend parent'||p.supervisionRole==='friend_family_adult';
 const organized=p.supervisionRole==='organized_adult'&&p.isAdultSupervisor===true;
 if(!family&&!friendsFamily&&!organized)return {ok:false,reason:'supervisor_not_legitimate',person:p,age};
 return {ok:true,person:p,personId:p.id,age,source:family?'family':friendsFamily?'friends_family':'organized'}
}
function inferredFamilyCampingSupervisor5C31(){
 const candidates=(S.people||[]).filter(p=>!p.deceased&&!p.movedAway&&isFamilyPerson(p)&&Number(personAge(p))>=18);
 const home=candidates.filter(p=>typeof inHousehold==='function'&&inHousehold(p));
 const rank=p=>isActualGuardian(p)?0:p.role==='parent'?1:p.role==='grandparent'?2:['aunt','uncle'].includes(p.role)?3:4;
 return [...(home.length?home:candidates)].sort((a,b)=>rank(a)-rank(b)||Number(personAge(b))-Number(personAge(a)))[0]||null
}
function campingSupervisionEligibility5C31(context={}){
 const def=seasonalOutdoorDefinition5C31('camping_weekend');if(!def)return {ok:false,reason:'definition_missing'};
 if(S.age<Number(def.minAge||0))return {ok:false,reason:'age',required:false,detail:`Camping requires age ${def.minAge} or older.`};
 if(S.age>=13)return {ok:true,required:false,supervisorId:null,source:null};
 const ctx=seasonalParticipantContext5C31(context);let chosen=null;
 if(ctx.supervisorId)chosen=legitimateCampingSupervisor5C31(ctx.supervisorId);
 else {
  for(const id of ctx.participantIds){const c=legitimateCampingSupervisor5C31(id);if(c.ok){chosen=c;break}}
  if(!chosen&&ctx.participantMode==='family'){const p=inferredFamilyCampingSupervisor5C31();if(p)chosen=legitimateCampingSupervisor5C31(p.id)}
 }
 if(!chosen)return {ok:false,reason:'supervision_required',required:true,detail:'A pre-teen camping trip needs a legitimate adult supervisor.'};
 if(!chosen.ok)return {ok:false,reason:chosen.reason,required:true,supervisorId:ctx.supervisorId||null,detail:'The selected camping supervisor is not a legitimate available adult.'};
 return {ok:true,required:true,supervisorId:chosen.personId,source:chosen.source,age:chosen.age}
}
function campingOvernightPermissionEligibility5C31(slot={},context={}){
 const def=seasonalOutdoorDefinition5C31('camping_weekend');if(!def)return {ok:false,reason:'definition_missing'};
 if(S.age<Number(def.minAge||0))return {ok:false,reason:'age',required:false};
 const supervision=campingSupervisionEligibility5C31(context);if(!supervision.ok)return {ok:false,reason:supervision.reason,required:S.age<18,supervision};
 if(S.age>=18)return {ok:true,required:false,authorityId:null,supervision};
 const maker=decisionAuthorityPerson();if(!maker)return {ok:false,reason:'no_guardian_authority',required:true,supervision};
 return {ok:true,required:true,authorityId:maker.id,supervision,overnight:true,dateISO:slot.dateISO||currentDate(),startMinute:Number(slot.startMinute??slot.start??0)}
}
function seasonalPermissionContextExtension5C31(def,slot,opts={}){
 if(def?.activityId!=='camping_weekend')return {};
 const sup=opts.supervisorId?legitimateCampingSupervisor5C31(opts.supervisorId):null;
 return {supervisorId:sup?.ok?sup.personId:null,supervisionSource:sup?.ok?sup.source:null}
}
function seasonalOutdoorPlanGate5C31(activityId,opts={}){
 const def=seasonalOutdoorDefinition5C31(activityId);if(!def)return {ok:true,handled:false};
 if(S.age<Number(def.minAge||0))return {ok:false,reason:'age',detail:`${def.name} is not appropriate at this age.`,activity:def};
 const participants=seasonalParticipantContext5C31(opts);if(participants.invalidParticipantIds.length)return {ok:false,reason:'invalid_participant',participantContext:participants};
 if(activityId==='camping_weekend'){
  const supervision=campingSupervisionEligibility5C31(participants);if(!supervision.ok)return {ok:false,reason:supervision.reason,detail:supervision.detail||'',supervision,participantContext:participants};
  const permission=campingOvernightPermissionEligibility5C31({dateISO:opts.dateISO,startMinute:opts.startMinute},Object.assign({},participants,{supervisorId:supervision.supervisorId||participants.supervisorId}));if(!permission.ok)return {ok:false,reason:permission.reason,supervision,permission,participantContext:participants};
  return {ok:true,handled:true,activity:def,participantContext:participants,supervision,permission,supervisorId:supervision.supervisorId||null}
 }
 // Hiking keeps its canonical day-activity metadata. It does not inherit camping's
 // overnight or pre-teen adult-supervision requirement.
 return {ok:true,handled:true,activity:def,participantContext:participants,supervision:{ok:true,required:false},permission:{ok:true,required:seasonalPermissionNeeded5C1(def,{dateISO:opts.dateISO||currentDate(),startMinute:Number(opts.startMinute??0)}),overnight:false}}
}
function seasonalOutdoorExecutionValidation5C31(activityId,opts={}){
 const def=seasonalOutdoorDefinition5C31(activityId);if(!def)return {ok:true,handled:false};
 const gate=seasonalOutdoorPlanGate5C31(activityId,Object.assign({dateISO:currentDate(),startMinute:currentMinute()},opts));if(!gate.ok)return gate;
 if(activityId==='camping_weekend'&&S.age<18){
  const permission=requestSeasonalPermission5C1(activityId,{dateISO:opts.dateISO||currentDate(),startMinute:Number(opts.startMinute??currentMinute())},{location:opts.location||S.location,participantMode:opts.participantMode||'alone',personId:opts.personId||null,supervisorId:gate.supervisorId||opts.supervisorId||null});
  if(!permission.ok)return {ok:false,reason:'permission_denied',permission,supervision:gate.supervision,participantContext:gate.participantContext};
  gate.permissionRecord=permission.record||null;
 }
 return Object.assign(gate,{ok:true,executionDeferred:false,executionHandledBy:'5C.3.2'})
}
function migrateSeasonalActivities5C31(){
 // 5C.3.1 introduces no parallel state container and fabricates no history.
 // Preserve optional explicit supervision fields on existing seasonal plans only.
 for(const p of S.plans||[]){
  if(!p||p.seasonalActivityId!=='camping_weekend')continue;
  if(p.supervisorId!=null&&!personById(p.supervisorId))delete p.supervisorId;
  if(p.supervisionSource!=null&&!['family','friends_family','organized'].includes(p.supervisionSource))delete p.supervisionSource;
 }
 return {schema:1,stateIntroduced:false}
}
