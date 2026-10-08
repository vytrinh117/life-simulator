// PHASE 6A.1 — Prom season foundation on the EXISTING S.school.prom and S.calendar.
// Do not introduce a parallel student/notification/romance/calendar system.
const PROM_FOUNDATION_SCHEMA_6A1=1;
function promSeasonEligibility6A1(){
 const sc=S?.school,g=gradeNumber(),sid=typeof playerCurrentSchoolId4A2==='function'?playerCurrentSchoolId4A2():null;
 const stage=canonicalSchoolStage4A1(sc?.stage||stageOfSchool(sc));
 if(!sc||!needsFormalSchool()||g<8||g>12||!['middle','high'].includes(stage)||!sid)
  return {ok:false,reason:'Prom is only for eligible enrolled middle/high-school students in Grades 8–12.'};
 if(!Number.isInteger(sc.yearKey))return {ok:false,reason:'School year not established.'};
 return {ok:true,schoolId:sid,yearKey:sc.yearKey,grade:g,stage};
}
function promIdentity6A1(e=promSeasonEligibility6A1()){
 if(!e.ok)return null;
 const key=`${e.schoolId}:${e.yearKey}:g${e.grade}`;
 return {key,eventId:`prom-${schoolSlug4A2(e.schoolId)}-${e.yearKey}-g${e.grade}`,schoolId:e.schoolId,yearKey:e.yearKey,grade:e.grade};
}
function promApprovedVenue6A1(schoolId){
 const school=schoolById(schoolId);
 // Future committee-approved alternatives are explicitly handled by 6A.2.
 return `${school?.name||S.school?.name||'School'} Hall`;
}
function archiveProm6A1(pr){
 if(!pr?.foundation6A1?.eventId)return;
 S.promHistory6A1=Array.isArray(S.promHistory6A1)?S.promHistory6A1:[];
 if(S.promHistory6A1.some(r=>r.eventId===pr.foundation6A1.eventId))return;
 // Only facts already recorded in the player's actual Prom state are archived.
 S.promHistory6A1.push({eventId:pr.foundation6A1.eventId,schoolId:pr.foundation6A1.schoolId,
  yearKey:pr.year,grade:pr.foundation6A1.grade,dateISO:pr.dateISO,venue:pr.venue,
  registrationStatus:pr.foundation6A1.registrationStatus,registrationDecisionDate:pr.foundation6A1.registrationDecisionDate||null,
  eventStatus:pr.status,plan:pr.plan||null,
  ...(pr.date6A3?.eventId===pr.foundation6A1.eventId?{date6A3:{...pr.date6A3,changes:(pr.date6A3.changes||[]).map(r=>({...r}))},asked:(pr.asked||[]).map(r=>({...r})),received:(pr.received||[]).map(r=>({...r}))}:{}),
  ...(pr.night6B1?.eventId===pr.foundation6A1.eventId?{night6B1:JSON.parse(JSON.stringify(pr.night6B1))}:{}),
  ...(pr.court6A4?.eventId===pr.foundation6A1.eventId?{court6A4:JSON.parse(JSON.stringify(pr.court6A4))}:{}),
  ...(pr.social6A5?.eventId===pr.foundation6A1.eventId&&(pr.social6A5.actions?.length||pr.social6A5.rivalEncounters?.length||pr.social6A5.resultApplied)?{social6A5:JSON.parse(JSON.stringify(pr.social6A5))}:{}),
  ...(pr.committee6A2?.eventId===pr.foundation6A1.eventId?{committee6A2:{eventId:pr.committee6A2.eventId,status:pr.committee6A2.status,applicationDate:pr.committee6A2.applicationDate||null,rolePreference:pr.committee6A2.rolePreference||null,assignedRole:pr.committee6A2.assignedRole||null,work:(pr.committee6A2.work||[]).map(w=>({...w})),theme:pr.committee6A2.theme||null,decor:pr.committee6A2.decor||null}}:{} )});
 if(S.promHistory6A1.length>30)S.promHistory6A1.splice(0,S.promHistory6A1.length-30);
}
function promRegistrationOpen6A1(pr){
 const f=pr?.foundation6A1;
 return !!f&&f.registrationStatus==='not_registered'&&currentDate()>=f.announceDate&&currentDate()<=f.registrationDeadline&&currentDate()<pr.dateISO;
}
function promRegistered6A1(pr=S?.school?.prom){return pr?.foundation6A1?.registrationStatus==='registered'}
function ensureProm6A1(){
 const e=promSeasonEligibility6A1();if(!e.ok)return null;
 const identity=promIdentity6A1(e),sc=S.school,d=promDateFor(e.yearKey);
 let pr=sc.prom;
 if(pr&&(pr.year!==e.yearKey||(pr.foundation6A1?.schoolId&&pr.foundation6A1.schoolId!==e.schoolId)
  ||(pr.foundation6A1?.grade&&pr.foundation6A1.grade!==e.grade))){
  if(typeof closePromCommittee6A2==='function')closePromCommittee6A2(pr,'School change or academic-year rollover');archiveProm6A1(pr);if(pr.foundation6A1){resolveNotificationsFor(`${pr.foundation6A1.eventId}:registration`);resolveNotificationsFor(`${pr.foundation6A1.eventId}:court_nominations`);resolveNotificationsFor(`${pr.foundation6A1.eventId}:court_voting`);const v=(S.calendar||[]).find(x=>x.id===`${pr.foundation6A1.eventId}:court-ballot`);if(v&&!isTerminal(v.status))setCalendarStatus(v,'Cancelled','Former school or academic year');}pr=null;sc.prom=null;
 }
 if(!pr){
  if(d<=currentDate())return null; // No retrospective event/attendance from migration.
  pr={year:e.yearKey,junior:e.grade<=9,dateISO:d,venue:promApprovedVenue6A1(e.schoolId),dress:'Formal',
   status:'Upcoming',plan:null,partnerId:null,asFriends:false,asked:[],received:[],prep:{},committee:0,
   ticket:e.grade<=9?20:40,ticketBought:false};sc.prom=pr;
 }
 // Past saves: never rewrite completed attendance, prior memories, or adjudicated Prom.
 if(['Done','Skipped'].includes(pr.status)){if(typeof closePromCommittee6A2==='function')closePromCommittee6A2(pr,'Prom is complete');if(typeof reconcilePromSocial6A5==='function')reconcilePromSocial6A5(pr);if(typeof reconcilePromUi6A6==='function')reconcilePromUi6A6(pr);if(typeof reconcilePromNight6B1==='function')reconcilePromNight6B1(pr);return pr}
 pr.asked=Array.isArray(pr.asked)?pr.asked:[];
 pr.received=Array.isArray(pr.received)?pr.received:[];
 pr.prep=pr.prep&&typeof pr.prep==='object'?pr.prep:{};
 pr.dateISO=/^\d{4}-\d{2}-\d{2}$/.test(pr.dateISO||'')?pr.dateISO:d;
 const f=pr.foundation6A1&&typeof pr.foundation6A1==='object'?pr.foundation6A1:{};
 // Legacy 'prom-Y' must be mapped once to school/cohort-specific identity.
 const oldId=f.eventId||`prom-${e.yearKey}`;
 const legacy=S.calendar.find(v=>v.type==='prom'&&v.id===oldId&&!isTerminal(v.status));
 const canonical=S.calendar.find(v=>v.type==='prom'&&v.id===identity.eventId);
 if(legacy&&canonical&&legacy!==canonical)setCalendarStatus(legacy,'Cancelled','Duplicate prom identity');
 else if(legacy&&!canonical)legacy.id=identity.eventId;
 const venue=promApprovedVenue6A1(e.schoolId);
 pr.venue=venue;
 const announceDate=addDays(pr.dateISO,-28),deadline=addDays(pr.dateISO,-7);
 // Persist registration once; do not infer registration from a legacy ticket, plan or date.
 Object.assign(f,{schemaVersion:PROM_FOUNDATION_SCHEMA_6A1,eventId:identity.eventId,
  schoolId:e.schoolId,yearKey:e.yearKey,grade:e.grade,announceDate,registrationDeadline:deadline,
  registrationStatus:['not_registered','registered','declined','missed'].includes(f.registrationStatus)?f.registrationStatus:'not_registered',
  announcementSent:!!f.announcementSent});
 pr.foundation6A1=f;
 // A resolved season cannot be re-opened by a migrated clock or a rerender.
 if(!f.announcementSent&&currentDate()>=announceDate&&currentDate()<=deadline&&currentDate()<pr.dateISO){
  f.announcementSent=true;pr.status='Season';
  notify(`${pr.junior?'Junior Prom':'Prom'} registration open`,
   `${formatDate(pr.dateISO)} • ${venue}. Register by ${formatDate(deadline)}; attendance is optional.`,
   {sourceType:'promRegistration',sourceId:`${f.eventId}:registration`,tab:'home'});
  if(!SIM.skipping){const th=thread('prom',f.eventId,'Prom season');threadStep(th,'Prom announced',`${formatDate(pr.dateISO)} at ${venue}`);
   log('💃 Prom announced',`${formatDate(pr.dateISO)} at ${venue}. Registration closes ${formatDate(deadline)}.`,true)}
 }
 if(currentDate()>=announceDate&&currentDate()<=pr.dateISO&&pr.status==='Upcoming')pr.status='Season';
 if(f.registrationStatus==='not_registered'&&(currentDate()>deadline||currentDate()>=pr.dateISO)){
  f.registrationStatus='missed';f.registrationClosedDate=currentDate();
  resolveNotificationsFor(`${f.eventId}:registration`);
 }
 if(f.registrationStatus!=='not_registered')resolveNotificationsFor(`${f.eventId}:registration`);
 const found=S.calendar.find(v=>v.id===f.eventId&&v.type==='prom');
 const ev=found||createCalendarEvent({id:f.eventId,type:'prom',title:pr.junior?'Junior Prom':'Prom',
  dateISO:pr.dateISO,startMinute:1140,endMinute:1380,graceMinute:1230,location:venue,
  schoolId:e.schoolId,payload:{year:e.yearKey,grade:e.grade,schoolId:e.schoolId,promSeasonId:f.eventId},required:false,source:'school'});
 if(ev&&!isTerminal(ev.status)){
  ev.location=venue;ev.dateISO=pr.dateISO;ev.schoolId=e.schoolId;
  ev.payload={...ev.payload,year:e.yearKey,grade:e.grade,schoolId:e.schoolId,promSeasonId:f.eventId};
 }
 if(typeof reconcilePromCommittee6A2==='function')reconcilePromCommittee6A2(pr);
 if(typeof promDateReconcile6A3==='function')promDateReconcile6A3(pr);
 if(typeof reconcilePromCourt6A4==='function')reconcilePromCourt6A4(pr);
 if(typeof reconcilePromSocial6A5==='function')reconcilePromSocial6A5(pr);
 if(typeof reconcilePromUi6A6==='function')reconcilePromUi6A6(pr);
 if(typeof reconcilePromNight6B1==='function')reconcilePromNight6B1(pr);
 return pr;
}
function reconcilePromSeason6A1(){
 if(!S?.school){if(S&&typeof promUiNoticeCleanup6A6==='function')promUiNoticeCleanup6A6(null);return;}
 const pr=ensureProm6A1();if(!pr&&typeof promUiNoticeCleanup6A6==='function')promUiNoticeCleanup6A6(null);
}
function promRegistrationDecision6A1(decision){
 const pr=ensureProm6A1(),f=pr?.foundation6A1;
 if(!pr||!f)return {ok:false,reason:'not_eligible'};
 if(!['register','decline'].includes(decision))return {ok:false,reason:'invalid_action'};
 if(f.registrationStatus!=='not_registered')return {ok:false,reason:'already_decided'};
 if(!promRegistrationOpen6A1(pr))return {ok:false,reason:'registration_closed'};
 f.registrationStatus=decision==='register'?'registered':'declined';
 f.registrationDecisionDate=currentDate();f.attendanceIntent=decision==='register'?'attend':'skip';
 if(decision==='decline')pr.plan='skip';
 resolveNotificationsFor(`${f.eventId}:registration`);
 log('Prom registration',decision==='register'?`You registered for ${pr.junior?'Junior Prom':'Prom'} on ${formatDate(pr.dateISO)}. You can attend with a date, friends or alone.`:'You declined this year’s prom invitation.');
 return {ok:true,status:f.registrationStatus,eventId:f.eventId};
}
function promFoundationHtml6A1(pr){
 const f=pr.foundation6A1;if(!f)return '';
 const reg=f.registrationStatus;
 const headline=reg==='registered'?'Registered':reg==='declined'?'Declined':reg==='missed'?'Registration closed':'Registration is open';
 return `<div class="prom-registration-6a1"><p class="muted-text">${esc(headline)} • Sign-up deadline ${formatDate(f.registrationDeadline)} • ${esc(pr.venue)}</p>`+
  (promRegistrationOpen6A1(pr)?`<div class="inline-actions"><button class="small primary" data-prom-register6a1="register">Register for prom</button><button class="small ghost" data-prom-register6a1="decline">Do not participate</button></div>`:'')+
  (reg==='registered'?'<p class="muted-text">You can choose a date, attend with friends or go alone. Committee applications are separate from guest registration.</p>':'')+
  (typeof promCommitteeHtml6A2==='function'?promCommitteeHtml6A2(pr):'')+(typeof promCourtSummaryHtml6A4==='function'?promCourtSummaryHtml6A4(pr):'')+
  (typeof promSocialHtml6A5==='function'?promSocialHtml6A5(pr):'')+'</div>';
}
function promFoundationClick6A1(b){
 const action=b?.dataset?.promRegister6a1;if(!action)return false;
 const result=promRegistrationDecision6A1(action);
 if(!result.ok)toast(result.reason==='already_decided'?'Prom registration was already decided.':'Prom registration is unavailable.');
 save();render();return true;
}
