// PHASE 6B.3 — School Hall arrival, real student encounters and date presence.
// Extends the 6B.1 attendance record; never creates ballot votes, romance or Prom awards.
const PROM_ARRIVAL_SCHEMA_6B3=1;
function promArrivalRecord6B3(pr=S?.school?.prom){
 const n=promNightRecord6B1(pr),a=n?.arrivals6B3;
 return a?.eventId===n.eventId?a:null;
}
function promArrivalAbsence6B3(n,pr){
 if(!promCourtSchoolPeer6A4(n,pr))return 'No longer enrolled in this Prom cohort';
 if(n.notGoingProm)return 'Declined to attend Prom';
 if(n.promUnavailableDateISO===pr.dateISO)return 'Another school or family commitment';
 if(n.available===false||n.busyUntilDateISO&&n.busyUntilDateISO>=pr.dateISO)return 'Unavailable due to an existing commitment';
 return null;
}
function promArrivalMinute6B3(n,defaultMinute){
 const v=Number(n?.promArrivalMinute);
 // Only a pre-existing, explicit NPC schedule may delay arrival; never randomize a no-show.
 return Number.isFinite(v)&&v>=0&&v<1440?v:defaultMinute;
}
function promArrivalCompanion6B3(pr,a){
 const person=pr?.partnerId?personById(pr.partnerId):null;
 if(!pr?.partnerId)return {personId:null,npcId:null,status:'none',reason:null};
 if(!person||!promDateStudent6A3(person))return {personId:pr.partnerId,npcId:null,status:'unavailable',reason:'Confirmed companion is no longer eligible'};
 if(person.notGoingProm||person.promUnavailableDateISO===pr.dateISO||person.available===false||person.busyUntilDateISO&&person.busyUntilDateISO>=pr.dateISO)
  return {personId:person.id,npcId:person.npcId||null,status:'no_show',reason:person.promUnavailableDateISO===pr.dateISO?'A family or school commitment':'Companion is unavailable'};
 const npc=person.npcId&&npcById(person.npcId);
 if(!npc)return {personId:person.id,npcId:null,status:'unverified',reason:'Cannot verify this student in the school roster'};
 const reason=promArrivalAbsence6B3(npc,pr);
 if(reason)return {personId:person.id,npcId:npc.id,status:'no_show',reason};
 if(a.attendeeIds.includes(npc.id))return {personId:person.id,npcId:npc.id,status:'present',reason:null};
 if(a.expectedIds.includes(npc.id))return {personId:person.id,npcId:npc.id,status:'expected_later',reason:'Arriving later according to their schedule'};
 return {personId:person.id,npcId:npc.id,status:'unverified',reason:'Companion is not recorded at the venue'};
}
function initializePromArrival6B3(pr=S?.school?.prom){
 const n=promNightRecord6B1(pr),ev=promNightEvent6B1(pr);
 if(!n||n.status!=='attending'||!n.attendanceRecorded||!ev||ev.id!==n.eventId||
   S.location!=='School'||currentDate()!==n.dateISO||currentMinute()>=n.endMinute||
   ev.status!=='Attending'||playerCurrentSchoolId4A2()!==n.schoolId||
   ev.location!==n.venue||ev.schoolId!==n.schoolId)return null;
 if(promArrivalRecord6B3(pr))return promArrivalRecord6B3(pr);
 const now=currentMinute(),original=[...new Set(n.attendeeIds||[])];
 const intended=pr.partnerId&&personById(pr.partnerId);
 const companionMissing=intended&&(intended.notGoingProm||intended.promUnavailableDateISO===pr.dateISO||intended.available===false||intended.busyUntilDateISO&&intended.busyUntilDateISO>=pr.dateISO);
 const verified=[],expected=[],absent=[];
 for(const id of original){
  const npc=npcById(id),reason=companionMissing&&intended.npcId===id?'Companion has an existing commitment':promArrivalAbsence6B3(npc,pr);
  if(reason){absent.push({npcId:id,reason});continue}
  const minute=promArrivalMinute6B3(npc,n.startMinute);
  if(minute>n.endMinute){absent.push({npcId:id,reason:'Scheduled arrival after the event ends'});continue}
  if(minute>now)expected.push(id);else verified.push(id);
 }
 // The previously accepted companion must be a REAL eligible enrolled NPC.
 const partner=pr.partnerId&&personById(pr.partnerId),npc=partner?.npcId&&npcById(partner.npcId);
 if(npc&&!companionMissing&&promCourtSchoolPeer6A4(npc,pr)&&!original.includes(npc.id)){
  const reason=promArrivalAbsence6B3(npc,pr);
  if(reason)absent.push({npcId:npc.id,reason});
  else if(promArrivalMinute6B3(npc,n.startMinute)>now)expected.push(npc.id);
  else verified.push(npc.id);
 }
 const a={schemaVersion:PROM_ARRIVAL_SCHEMA_6B3,eventId:n.eventId,schoolId:n.schoolId,venue:n.venue,
  recordedAt:{dateISO:currentDate(),minute:now},attendeeIds:[...new Set(verified)].sort(),expectedIds:[...new Set(expected)].sort(),
  absent,companion:null,greetings:[],arrivalDescription:null};
 n.arrivals6B3=a;n.attendeeIds=[...a.attendeeIds];
 a.companion=promArrivalCompanion6B3(pr,a);
 n.companionStatus=a.companion.status;n.companionReason=a.companion.reason;
 // Outfit can affect later reactions, but this is not a guaranteed social bonus.
 const ready=promReadySummary6B2(pr),quality=(ready?.outfitValid?ready.outfitQuality:0);
 a.arrivalDescription=quality>=75?'Your carefully chosen outfit feels right for the school hall.':
  quality>=40?'You arrive in an outfit you chose for tonight.':'The hall is dressed for Prom; you step inside as you are.';
 if(ready?.hairPrepared||ready?.makeupMethod&&ready.makeupMethod!=='none')a.arrivalDescription+=' Your prepared look gives you a little confidence.';
 return a;
}
function reconcilePromArrival6B3(pr=S?.school?.prom){
 const n=promNightRecord6B1(pr),a=promArrivalRecord6B3(pr);
 if(!a||n.status!=='attending'||S.location!=='School'||currentDate()!==n.dateISO||currentMinute()>=n.endMinute)return a;
 if(a.schoolId!==n.schoolId||a.venue!==n.venue)return a;
 const intended=pr.partnerId&&personById(pr.partnerId);
 const companionMissing=intended&&(intended.notGoingProm||intended.promUnavailableDateISO===pr.dateISO||intended.available===false||intended.busyUntilDateISO&&intended.busyUntilDateISO>=pr.dateISO);
 const remaining=[];
 for(const id of a.expectedIds){
  const npc=npcById(id),reason=companionMissing&&intended.npcId===id?'Companion has an existing commitment':promArrivalAbsence6B3(npc,pr);
  if(reason){if(!a.absent.some(x=>x.npcId===id))a.absent.push({npcId:id,reason});continue}
  if(currentMinute()>=promArrivalMinute6B3(npc,n.startMinute)){
   if(!a.attendeeIds.includes(id))a.attendeeIds.push(id);
  }else remaining.push(id);
 }
 a.expectedIds=remaining;a.attendeeIds.sort();n.attendeeIds=[...a.attendeeIds];
 a.companion=promArrivalCompanion6B3(pr,a);n.companionStatus=a.companion.status;n.companionReason=a.companion.reason;
 return a;
}
function promArrivalGate6B3(){
 const pr=S?.school?.prom,n=promNightRecord6B1(pr),ev=promNightEvent6B1(pr),a=promArrivalRecord6B3(pr);
 if(!n||n.status!=='attending'||!n.attendanceRecorded||!ev||ev.status!=='Attending'||!a||a.eventId!==n.eventId)return {ok:false,reason:'not_checked_in'};
 if(currentDate()!==n.dateISO||currentMinute()>=n.endMinute)return {ok:false,reason:'event_ended'};
 if(S.location!=='School'||locationSchoolId4C1()!==n.schoolId||ev.location!==a.venue)return {ok:false,reason:'not_at_approved_school_hall'};
 const e=promSeasonEligibility6A1(),id=promIdentity6A1(e);
 if(!e.ok||id?.eventId!==n.eventId)return {ok:false,reason:'school_changed'};
 return {ok:true};
}
function promArrivalGreet6B3(npcId){
 const g=promArrivalGate6B3();if(!g.ok)return g;
 const pr=S.school.prom,a=reconcilePromArrival6B3(pr),n=npcById(npcId);
 if(!n||!a.attendeeIds.includes(npcId)||!promCourtSchoolPeer6A4(n,pr))return {ok:false,reason:'student_not_present'};
 if(a.greetings.some(x=>x.npcId===npcId))return {ok:false,reason:'already_greeted'};
 if(currentMinute()+5>promNightRecord6B1(pr).endMinute)return {ok:false,reason:'not_enough_time'};
 let p=(S.people||[]).find(x=>x.npcId===npcId),introduced=false;
 if(!p){
  if((S.people||[]).filter(x=>!isFamilyPerson(x)).length>=50)return {ok:false,reason:'people_limit_reached'};
  p=addNeighborPerson(n,'met at School Prom');introduced=true;
  // Record factual provenance for this introduction; never claim a prior connection.
  p.metAt=pr.venue;p.metVia='School Prom';
  // New acquaintance: the actual introduction is the primary meeting context.
  if(p.schoolSocial?.meeting)p.schoolSocial.meeting.sourceType='schoolEvent';
  recordMeetingProvenance4A4(p,{sourceType:'schoolEvent',eventId:a.eventId,schoolId:a.schoolId,grade:pr.foundation6A1.grade,metAt:pr.venue,metVia:'School Prom'});
 }
 const companion=a.companion?.npcId===npcId&&a.companion.status==='present';
 const ready=promReadySummary6B2(pr),dressed=!!ready?.outfitValid&&ready.outfitQuality>=65;
 const greeting=companion?'Your Prom companion meets you by the entrance.':
  introduced?'You introduce yourselves beside the decorated entrance.':
  dressed?'They notice your outfit and say hello.':'You exchange a friendly greeting at the hall.';
 a.greetings.push({npcId,personId:p.id,dateISO:currentDate(),minute:currentMinute(),kind:companion?'companion':introduced?'introduction':'greeting',text:greeting});
 // A brief hello, not an automatic dance, kiss, relationship promotion, photo or vote.
 p.rel=clamp((p.rel??48)+1);
 rememberPerson(p,`Met at ${pr.venue} during Prom: ${greeting}`,1);
 advanceTime(5,{silent:true});log('Prom arrival',`${displayName(p)}: ${greeting}`);
 return {ok:true,personId:p.id,npcId,kind:companion?'companion':introduced?'introduction':'greeting'};
}
function promArrivalHtml6B3(pr=S?.school?.prom){
 const n=promNightRecord6B1(pr),a=promArrivalRecord6B3(pr);if(!n||n.status!=='attending'||!a)return '';
 const g=promArrivalGate6B3(),comp=a.companion||{status:'none'};
 const status={none:'Going solo or with friends',present:'Your confirmed companion is here',expected_later:'Companion expected later',no_show:'Companion cannot attend',unavailable:'Companion unavailable',unverified:'Companion not verified in the school roster'}[comp.status]||'Companion status unconfirmed';
 const all=a.attendeeIds.filter(id=>!!npcById(id)&&promCourtSchoolPeer6A4(npcById(id),pr));
 return `<section class="prom-arrival-6b3" data-prom-arrival6b3="${esc(a.eventId)}"><h4>Inside ${esc(n.venue)}</h4>`+
  `<p class="muted-text">${esc(a.arrivalDescription||'You have checked in at the school hall.')} ${esc(status)}${comp.reason?' · '+esc(comp.reason):''}. ${all.length} classmates are present.</p>`+
  (a.expectedIds.length?`<p class="muted-text">${a.expectedIds.length} student(s) are expected later according to their schedules.</p>`:'')+
  `<div class="prom-arrival-people-6b3">${all.slice(0,12).map(id=>{const npc=npcById(id),known=(S.people||[]).find(p=>p.npcId===id),met=a.greetings.some(x=>x.npcId===id);
   return `<div class="prom-arrival-person-6b3"><span>${esc(npc.fullName||'Classmate')}${a.companion?.npcId===id?' · Companion':''}${known?' · Known':' · New'}</span>${met?'<small>Greeted</small>':g.ok?`<button class="small ghost" data-prom-arrival-action6b3="greet" data-npc-id="${esc(id)}">${known?'Say hello':'Introduce yourself'}</button>`:''}</div>`}).join('')||'<p class="muted-text">No other students have been verified here yet.</p>'}</div>`+
  `<p class="muted-text">Arrivals and introductions only. Dancing, photos and the award ceremony arrive in later checkpoints.</p></section>`;
}
function promArrivalClick6B3(b){if(!b?.dataset?.promArrivalAction6b3)return false;
 const r=b.dataset.promArrivalAction6b3==='greet'?promArrivalGreet6B3(b.dataset.npcId):{ok:false,reason:'unknown_action'};
 if(!r.ok)toast('Prom arrival: '+r.reason.replaceAll('_',' '));save();render();return true;
}
