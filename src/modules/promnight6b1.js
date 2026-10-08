// PHASE 6B.1 — Canonical Prom Night lifecycle; owns only attendance/venue/roster.
// Existing 6A season, Court, RSVP, Calendar, NPC IDs and school travel remain authoritative.
const PROM_NIGHT_SCHEMA_6B1=1;
function promNightEvent6B1(pr=S?.school?.prom){
 const f=pr?.foundation6A1;
 if(!f?.eventId)return null;
 return (S.calendar||[]).find(e=>e.type==='prom'&&e.id===f.eventId)||null;
}
function promNightRecord6B1(pr=S?.school?.prom){
 return pr?.foundation6A1&&pr.night6B1?.eventId===pr.foundation6A1.eventId?pr.night6B1:null;
}
function promNightWindow6B1(pr=S?.school?.prom){
 const ev=promNightEvent6B1(pr);
 return ev?{start:ev.startMinute,cutoff:ev.graceMinute,end:ev.endMinute,dateISO:ev.dateISO,venue:ev.location}:null;
}
function promNightAvailable6B1(pr=S?.school?.prom){
 const w=promNightWindow6B1(pr);
 return !!w&&currentDate()===w.dateISO&&currentMinute()>=w.start&&currentMinute()<=w.cutoff;
}
function promNightPeerEligible6B1(n,pr){
 return !!n&&promCourtSchoolPeer6A4(n,pr)&&!n.notGoingProm&&n.promUnavailableDateISO!==pr.dateISO;
}
function promNightRoster6B1(pr=S?.school?.prom){
 const f=pr?.foundation6A1;
 if(!f)return {attendeeIds:[],companionId:null,companionStatus:'none',reason:null};
 // Stable deterministic participation from EXISTING enrolled student records only.
 // A school ballot voter or candidate is not automatically a Prom attendee.
 const attendees=(S.npcs||[]).filter(n=>promNightPeerEligible6B1(n,pr))
  .filter(n=>n.promWith||hashOf(`${f.eventId}|prom-night|${n.id}`)%100<62)
  .map(n=>n.id).sort();
 let companionId=null,companionStatus='none',reason=null;
 const p=pr.partnerId?personById(pr.partnerId):null;
 if(pr.partnerId){
  if(!p||!promDateStudent6A3(p)||p.notGoingProm||p.promUnavailableDateISO===pr.dateISO){companionStatus='unavailable';reason=p?.promUnavailableDateISO===pr.dateISO?'Conflicting school or family commitment':'Companion no longer available';}
  else if(p.npcId){
   const n=npcById(p.npcId);
   if(n&&promNightPeerEligible6B1(n,pr)){companionId=n.id;companionStatus='expected';if(!attendees.includes(n.id))attendees.push(n.id);attendees.sort();}
   else {companionStatus='unavailable';reason='Companion is not enrolled in the eligible cohort';}
  }else { // A known person without a linked enrolled NPC is not added as an invented student.
   companionStatus='unverified';reason='Companion school attendance could not be verified';
  }
 }
 return {attendeeIds:attendees,companionId,companionStatus,reason};
}
function ensurePromNight6B1(pr=S?.school?.prom){
 const f=pr?.foundation6A1,ev=promNightEvent6B1(pr);if(!f||!ev||ev.dateISO!==pr.dateISO||ev.schoolId!==f.schoolId||ev.location!==pr.venue)return null;
 if(promNightRecord6B1(pr))return pr.night6B1;
 // Never backfill past attendance, legacy Done/Skipped Prom or historical memories.
 if(['Done','Skipped'].includes(pr.status)||isTerminal(ev.status)||currentDate()>pr.dateISO)return null;
 const w=promNightWindow6B1(pr);
 pr.night6B1={schemaVersion:PROM_NIGHT_SCHEMA_6B1,eventId:f.eventId,schoolId:f.schoolId,yearKey:f.yearKey,grade:f.grade,
  dateISO:pr.dateISO,venue:pr.venue,startMinute:w.start,entryCutoffMinute:w.cutoff,endMinute:w.end,
  status:'scheduled',enteredAt:null,leftAt:null,attendeeIds:[],companionId:null,companionStatus:'none',attendanceRecorded:false};
 return pr.night6B1;
}
function promNightConflict6B1(pr,from,to){
 const f=pr.foundation6A1;
 const committed=new Set(['schoolDay','exam','clubSession','schoolEvent','tryout','plan','workDay','program','wedding','trip','election','leadershipSelection','conference']);
 return (S.calendar||[]).find(e=>e.id!==f.eventId&&e.dateISO===pr.dateISO&&!isTerminal(e.status)&&committed.has(e.type)
  &&Number.isFinite(Number(e.startMinute))&&Number.isFinite(Number(e.endMinute))&&from<Number(e.endMinute)&&Number(e.startMinute)<to)||null;
}
function promNightEntryGate6B1(){
 const pr=S?.school?.prom,f=pr?.foundation6A1,n=promNightRecord6B1(pr),ev=promNightEvent6B1(pr);
 if(!pr||!f||!ev||!n)return {ok:false,reason:'no_current_prom'};
 const e=promSeasonEligibility6A1(),id=promIdentity6A1(e);
 if(!e.ok||!id||id.eventId!==f.eventId||e.schoolId!==n.schoolId||e.grade!==n.grade)return {ok:false,reason:'school_or_grade_ineligible'};
 if(n.status==='attending')return {ok:false,reason:'already_attending'};
 if(['completed','missed','cancelled'].includes(n.status)||isTerminal(ev.status)||['Done','Skipped'].includes(pr.status))return {ok:false,reason:'event_closed'};
 if(!promRegistered6A1(pr)||f.attendanceIntent==='skip'||pr.plan==='skip')return {ok:false,reason:'not_registered_or_declined'};
 if(!pr.ticketBought)return {ok:false,reason:'ticket_or_waiver_required'};
 if(currentDate()!==pr.dateISO||currentMinute()<ev.startMinute)return {ok:false,reason:'entry_not_open'};
 if(currentMinute()>ev.graceMinute)return {ok:false,reason:'entry_closed'};
 if(!['Home','School'].includes(S.location))return {ok:false,reason:'finish_existing_outing_first'};
 if(S.location==='School'&&typeof playerCurrentSchoolId4A2==='function'&&playerCurrentSchoolId4A2()!==f.schoolId)return {ok:false,reason:'wrong_school'};
 // Special event admission, not ordinary school-day travel after campus closes.
 const travel=S.location==='Home'?20:0;
 if(currentMinute()+travel>ev.graceMinute)return {ok:false,reason:'cannot_arrive_before_cutoff'};
 const conf=promNightConflict6B1(pr,currentMinute(),ev.endMinute);
 if(conf)return {ok:false,reason:'calendar_conflict',conflictId:conf.id};
 return {ok:true,eventId:f.eventId,travelMinutes:travel,venue:ev.location};
}
function enterPromNight6B1(){
 let pr=S?.school?.prom;ensurePromNight6B1(pr);const g=promNightEntryGate6B1();if(!g.ok)return g;
 const ev=promNightEvent6B1(pr),n=promNightRecord6B1(pr);
 const roster=promNightRoster6B1(pr);n.attendeeIds=roster.attendeeIds;n.companionId=roster.companionId;n.companionStatus=roster.companionStatus;
 n.companionReason=roster.reason;n.status='attending';n.enteredAt={dateISO:currentDate(),minute:currentMinute()+g.travelMinutes};n.attendanceRecorded=true;
 setCalendarStatus(ev,'Attending','Checked in at '+n.venue);
 if(typeof setPlayerLocation4C1==='function')setPlayerLocation4C1('School',{schoolId:n.schoolId,reason:'School Hall Prom entry'});else S.location='School';
 if(g.travelMinutes)advanceTime(g.travelMinutes,{silent:true});
 if(typeof initializePromArrival6B3==='function')initializePromArrival6B3(pr);
 log('Prom Night arrival',`Checked in at ${n.venue} (${timeLabel(currentMinute())}).`);
 return {ok:true,status:n.status,eventId:n.eventId,rosterCount:n.attendeeIds.length};
}
function leavePromNight6B1(reason='left_early'){
 const pr=S?.school?.prom,n=promNightRecord6B1(pr),ev=promNightEvent6B1(pr);
 if(!n||n.status!=='attending'||!ev||ev.status!=='Attending')return {ok:false,reason:'not_attending'};
 if(typeof finalizePromAfter6B6==='function')finalizePromAfter6B6(reason);
 n.status='completed';n.leftAt={dateISO:currentDate(),minute:currentMinute()};n.exitReason=reason;
 pr.status='Done';setCalendarStatus(ev,'Attended',reason==='event_ended'?'Stayed until venue closing':'Left school hall');
 if(typeof setPlayerLocation4C1==='function')setPlayerLocation4C1('Home',{reason:'Left Prom venue'});else S.location='Home';
 if(typeof promAfterRecord6B6==='function'&&promAfterRecord6B6(pr)?.checkout)advanceTime(PROM_AFTER_TRAVEL_MINUTES_6B6,{silent:true});
 // The 6B.1 record means physical attendance only; no fabricated awards, photos, dances or social rewards.
 log('Prom Night departure',reason==='event_ended'?'Prom has closed for the night.':'You checked out of Prom and returned home.');
 return {ok:true,eventId:n.eventId,status:n.status};
}
function missPromNight6B1(ev,reason='entry_window_expired'){
 const pr=S?.school?.prom,n=promNightRecord6B1(pr);
 if(!pr||!ev||ev.type!=='prom'||!n||ev.id!==n.eventId)return {ok:false,reason:'invalid_event'};
 if(n.status==='attending')return leavePromNight6B1('event_ended');
 if(currentDate()<n.dateISO||currentDate()===n.dateISO&&currentMinute()<=n.entryCutoffMinute)return {ok:false,reason:'entry_window_not_expired'};
 if(['completed','missed','cancelled'].includes(n.status)||isTerminal(ev.status))return {ok:false,reason:'already_resolved'};
 const skip=pr.plan==='skip'||!promRegistered6A1(pr);
 n.status=skip?'cancelled':'missed';n.leftAt=null;pr.status=skip?'Skipped':'Done';
 setCalendarStatus(ev,skip?'Completed':'Missed',skip?'Prom was declined':'Did not attend Prom');
 resolveNotificationsFor(ev.id);return {ok:true,status:n.status};
}
function reconcilePromNight6B1(pr=S?.school?.prom){
 let n=promNightRecord6B1(pr);
 if(!n){if(pr?.status==='Done'||pr?.status==='Skipped')return null;n=ensurePromNight6B1(pr)}
 if(!n)return null;
 const ev=promNightEvent6B1(pr),e=promSeasonEligibility6A1(),id=promIdentity6A1(e);
 if(!ev||!e.ok||!id||id.eventId!==n.eventId||n.schoolId!==e.schoolId){
  if(!['completed','missed','cancelled'].includes(n.status)){n.status='cancelled';n.exitReason='school_or_event_changed';}
  return n;
 }
 if(['completed','missed','cancelled'].includes(n.status))return n;
 if(n.status==='attending'){
  if(ev.status!=='Attending'){if(isTerminal(ev.status)){n.status='completed';n.exitReason='calendar_resolved';}else setCalendarStatus(ev,'Attending','Reconciled active Prom check-in');}
  if(currentDate()>n.dateISO||currentDate()===n.dateISO&&currentMinute()>=n.endMinute)leavePromNight6B1('event_ended');
  else if(typeof reconcilePromArrival6B3==='function'){
   if(typeof initializePromArrival6B3==='function')initializePromArrival6B3(pr);
   reconcilePromArrival6B3(pr);
  }
 }else if(currentDate()>n.dateISO||currentDate()===n.dateISO&&currentMinute()>n.entryCutoffMinute)missPromNight6B1(ev);
 else n.status=promNightAvailable6B1(pr)?'entry_open':currentDate()===n.dateISO?'preparation_available':'scheduled';
 return n;
}
function promNightHtml6B1(pr=S?.school?.prom){
 const n=promNightRecord6B1(pr);if(!n)return '';
 const g=promNightEntryGate6B1();const label=n.status==='attending'?'At the School Hall':n.status==='completed'?'Attended':n.status==='missed'?'Missed':n.status==='cancelled'?'Cancelled':currentDate()===n.dateISO?'Prom day':'Upcoming';
 return `<div class="prom-night-6b1" data-prom-night6b1="${esc(n.eventId)}"><h4>Prom Night · ${esc(label)}</h4><p class="muted-text">${esc(n.venue)} · ${timeLabel(n.startMinute)}–${timeLabel(n.endMinute)} · Check-in closes ${timeLabel(n.entryCutoffMinute)}.</p>`+
 (typeof promGettingReadyHtml6B2==='function'?promGettingReadyHtml6B2(pr):'')+
 (n.status==='attending'?`${typeof promArrivalHtml6B3==='function'?promArrivalHtml6B3(pr):''}${typeof promMomentsHtml6B4==='function'?promMomentsHtml6B4(pr):''}${typeof promCeremonyHtml6B5==='function'?promCeremonyHtml6B5(pr):''}${typeof promAfterHtml6B6==='function'?promAfterHtml6B6(pr):''}<button class="small" data-prom-night-action6b1="leave">Leave Prom / Go Home</button>`:
 n.status==='completed'?(typeof promAfterHtml6B6==='function'?promAfterHtml6B6(pr):''):
 g.ok?`<button class="small" data-prom-night-action6b1="enter">Enter School Hall</button>`:
 `<p class="muted-text">${esc({entry_not_open:'Doors open at 7:00 PM.',entry_closed:'Check-in is closed.',ticket_or_waiver_required:'Arrange your Prom ticket or waiver.',not_registered_or_declined:'Only registered students can attend.',calendar_conflict:'Resolve the overlapping commitment before attending.'}[g.reason]||'Entry is unavailable right now.')}</p>`)+`</div>`;
}
function promNightClick6B1(b){const k=b?.dataset?.promNightAction6b1;if(!k)return false;
 const r=k==='enter'?enterPromNight6B1():k==='leave'?leavePromNight6B1():{ok:false,reason:'unknown_action'};
 if(!r.ok)toast(`Prom entry: ${r.reason}`);save();render();return true;
}
