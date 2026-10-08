// PHASE 5C.3.3 — social participants and persistent invitations; no stories.
function outdoorGroup5C33(id){return (S.groups||[]).find(g=>g.id===id)||null}
function outdoorParticipants5C33(activityId,opts={}){
 const mode=opts.participantMode||'alone',group=mode==='group'?outdoorGroup5C33(opts.groupId):null;
 if(mode==='group'&&!group)return {ok:false,reason:'group_missing'};
 const requested=mode==='group'?group.members:mode==='family'&&(!opts.personId)&&!(opts.participantIds||[]).length?(S.people||[]).filter(isFamilyPerson).map(p=>p.id):[opts.personId,...(opts.participantIds||[])];
 const ids=[...new Set(requested.filter(Boolean))];if(mode==='group'&&!ids.length)return {ok:false,reason:'empty_group'};
 const acceptedIds=[],responses={};const slot={dateISO:opts.dateISO||currentDate(),startMinute:Number(opts.startMinute??600)};
 for(const id of ids){const p=personById(id);if(!p){responses[id]='Unavailable';continue}
  const role=isFamilyPerson(p)?'family':mode==='partner'?'partner':'friend';const gate=seasonalParticipantGate5C1(id,role);
  if(!gate.ok){responses[id]='Unavailable';continue}
  const r=seasonalRsvp5C1(id,activityId,slot,{mode:role});responses[id]=r.answer==='Accepted'?'Accepted':'Declined';if(r.answer==='Accepted')acceptedIds.push(id);
 }
 if(mode==='group'&&!acceptedIds.length)return {ok:false,reason:'no_attendees',responses};
 if(['friend','partner'].includes(mode)&&opts.personId&&!acceptedIds.includes(opts.personId))return {ok:false,reason:'rsvp_declined',responses};
 return {ok:true,groupId:group?.id||null,acceptedIds,responses,requestedIds:ids};
}
function validateOutdoorAttendance5C33(plan){
 if(!plan||!seasonalOutdoorDefinition5C31(plan.seasonalActivityId))return {ok:true};
 for(const id of plan.participantIds||[]){const p=personById(id);if(!p||p.deceased||p.movedAway)return {ok:false,reason:'attendee_unavailable',personId:id};const availability=npcStatusAt(p,plan.dateISO,plan.startMinute);if(!availability.free)return {ok:false,reason:'attendee_unavailable',personId:id}}
 const gate=seasonalOutdoorPlanGate5C31(plan.seasonalActivityId,{dateISO:plan.dateISO,startMinute:plan.startMinute,location:plan.location,participantMode:plan.participantMode,personId:plan.personId,participantIds:plan.participantIds,groupId:plan.groupId,supervisorId:plan.supervisorId});if(!gate.ok)return gate;
 if(plan.participantMode==='group'&&!(plan.participantIds||[]).length)return {ok:false,reason:'no_attendees'};
 return {ok:true};
}
function outdoorInvitationState5C33(){const st=ensureSeasonalState5C1();if(!st.outdoorInvitations||typeof st.outdoorInvitations!=='object'||Array.isArray(st.outdoorInvitations))st.outdoorInvitations={};return st.outdoorInvitations}
function outdoorInvitationCooldown5C33(personId,activityId,dateISO){if(!seasonalOutdoorDefinition5C31(activityId))return true;const state=outdoorInvitationState5C33(),last=state[`${personId}|${activityId}`];return !last||daysBetween(last,currentDate())>=21}
function outdoorInvitationStamp5C33(personId,activityId){if(seasonalOutdoorDefinition5C31(activityId))outdoorInvitationState5C33()[`${personId}|${activityId}`]=currentDate()}
function validateOutdoorInvitation5C33(plan){if(!seasonalOutdoorDefinition5C31(plan.seasonalActivityId))return {ok:true};const interval=outdoorInterval5C32(plan.seasonalActivityId,plan.dateISO,plan.startMinute);const conflict=outdoorScheduleConflict5C32(interval);if(conflict)return {ok:false,reason:'conflict'};const gate=outdoorExecutionGate5C32(plan.seasonalActivityId,{dateISO:plan.dateISO,startMinute:plan.startMinute,location:plan.location,participantMode:plan.participantMode,personId:plan.personId,supervisorId:plan.supervisorId,gearAccess:plan.gearAccess});return gate.ok?{ok:true}:gate}
function migrateOutdoorSocial5C33(){const st=outdoorInvitationState5C33();for(const [k,v] of Object.entries(st))if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v))delete st[k];for(const p of S.plans||[])if(seasonalOutdoorDefinition5C31(p?.seasonalActivityId)){p.participantIds=[...new Set((p.participantIds||[]).filter(id=>!!personById(id)))];if(p.participantRsvps&&typeof p.participantRsvps==='object')p.participantRsvps=Object.fromEntries(Object.entries(p.participantRsvps).filter(([id])=>!!personById(id)));}return {ok:true}}
