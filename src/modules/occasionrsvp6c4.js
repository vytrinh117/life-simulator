// PHASE 6C.4 — invitation ledger layered over existing occasion, People and Plans authorities.
// RSVP never manufactures a Plan/calendar entry or attendance.
function occasionGuestLedger6C4(id){return occasionRecord6C1(id)?.guests6C4||null}
function occasionGuestGate6C4(id,personId,minute=1080){
 const base=occasionPreparationGate6C1(id);if(!base.ok)return base;
 const rec=base.occasion,p=personById(personId),m=Number(minute);
 if(!p)return {ok:false,reason:'missing_person'};
 if(p.deceased||p.movedAway)return {ok:false,reason:'recipient_unavailable'};
 if(!Number.isInteger(m)||m<420||m>1320)return {ok:false,reason:'invalid_time'};
 if(rec.celebrantPersonId===personId&&rec.occasionType==='birthday')return {ok:false,reason:'celebrant_not_guest'};
 if(S.age<6)return {ok:false,reason:'age_restricted'};
 if(S.age<18&&((rec.planning6C2?.venue&&rec.planning6C2.venue!=='Home')||m>Math.min(1200,curfewMinute()??1200)))return {ok:false,reason:'h3_approval_required'};
 if(rec.metadata?.school&&rec.planning6C2?.venue==='School when permitted')return {ok:false,reason:'school_authorization_required'};
 if((rec.guests6C4?.invitations||[]).some(x=>x.personId===personId))return {ok:false,reason:'already_invited'};
 return {ok:true,occasion:rec,person:p,minute:m};
}
function occasionInvite6C4(id,personId,minute=1080){
 const gate=occasionGuestGate6C4(id,personId,minute);if(!gate.ok)return gate;
 const rec=gate.occasion,p=gate.person,day=rec.dateISO,m=gate.minute;
 // The existing NPC availability routine remains the scheduling authority.
 const available=npcStatusAt(p,day,m);
 const conflicts=(S.plans||[]).some(x=>x.personId===personId&&x.dateISO===day&&['Accepted','Attending','Attended'].includes(x.status)&&m>=x.startMinute-120&&m<=x.endMinute);
 const status=(!available.free||conflicts)?'Unavailable':p.boundaries?.includes('noParties')&&rec.planning6C2?.choice==='small_gathering'?'Declined':
 (dayHash(`${rec.occasionId}|${personId}|rsvp`)<Math.max(8,Math.min(92,Math.round((p.rel??45)*.55+(p.trust??50)*.3-(p.conflict??0)*.4))))?'Accepted':'Declined';
 const ledger=rec.guests6C4||(rec.guests6C4={schemaVersion:1,invitations:[],attendance:[]});
 const record={personId,status,dateISO:day,startMinute:m,invitedAt:{dateISO:currentDate(),minute:currentMinute()},reason:status==='Unavailable'?(conflicts?'existing_plan_conflict':available.why||'busy'):status==='Declined'?'npc_declined':null,attended:false};
 ledger.invitations.push(record);
 return {ok:true,invitation:record};
}
function occasionAttendanceGate6C4(id,personId){
 const rec=occasionRecord6C1(id),entry=rec?.guests6C4?.invitations.find(x=>x.personId===personId);
 if(!rec||!entry)return {ok:false,reason:'not_invited'};
 if(entry.status!=='Accepted')return {ok:false,reason:'not_accepted'};
 if(entry.attended)return {ok:false,reason:'already_attended'};
 if(currentDate()!==rec.dateISO||currentMinute()<entry.startMinute||currentMinute()>Math.min(1439,entry.startMinute+180))return {ok:false,reason:'outside_event_window'};
 if(!personById(personId))return {ok:false,reason:'missing_person'};
 if(personById(personId).deceased||personById(personId).movedAway)return {ok:false,reason:'recipient_unavailable'};
 if(OCCASION6C1_TERMINAL.has(rec.status))return {ok:false,reason:'occasion_terminal'};
 const a=npcStatusAt(personById(personId),rec.dateISO,currentMinute());if(!a.free)return {ok:false,reason:'npc_unavailable'};
 if((S.plans||[]).some(x=>x.personId===personId&&x.dateISO===rec.dateISO&&['Accepted','Attending'].includes(x.status)&&currentMinute()>=x.startMinute&&currentMinute()<=x.endMinute))return {ok:false,reason:'existing_plan_conflict'};
 if(rec.planning6C2?.venue&&rec.planning6C2.venue!=='Home')return {ok:false,reason:'venue_not_verified'};
 if(S.location!=='Home')return {ok:false,reason:'wrong_location'};
 return {ok:true,occasion:rec,invitation:entry};
}
function occasionConfirmAttendance6C4(id,personId){
 const g=occasionAttendanceGate6C4(id,personId);if(!g.ok)return g;
 const rec=g.occasion,entry=g.invitation;entry.attended=true;entry.attendedAt={dateISO:currentDate(),minute:currentMinute()};
 rec.guests6C4.attendance.push({personId,dateISO:currentDate(),minute:currentMinute()});
 if(!rec.participantPersonIds.includes(personId))rec.participantPersonIds.push(personId);
 return {ok:true,attendance:entry};
}
