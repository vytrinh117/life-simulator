// =====================================================================
// PHASE 6C.1 — UNIVERSAL OCCASION FOUNDATION
// Stable occurrence identity + canonical-source references + lifecycle.
// This is orchestration only: no gift, RSVP, party, budget or reward flow.
// =====================================================================
const OCCASION6C1_SCHEMA=1;
const OCCASION6C1_TERMINAL=new Set(['Completed','Declined','Missed','Cancelled','Expired']);
const OCCASION6C1_TRANSITIONS={
 'Upcoming':new Set(['Preparation open','Planned','Active','Declined','Cancelled','Expired']),
 'Preparation open':new Set(['Planned','Active','Declined','Cancelled','Expired']),
 'Planned':new Set(['Preparation open','Active','Completed','Missed','Cancelled','Expired']),
 'Active':new Set(['Completed','Missed','Cancelled','Expired']),
 'Completed':new Set(), 'Declined':new Set(), 'Missed':new Set(), 'Cancelled':new Set(), 'Expired':new Set()
};
function occasionState6C1(){
 if(!S.occasions6C1||typeof S.occasions6C1!=='object'||Array.isArray(S.occasions6C1))S.occasions6C1={schemaVersion:OCCASION6C1_SCHEMA,occurrences:{}};
 S.occasions6C1.schemaVersion=OCCASION6C1_SCHEMA;
 if(!S.occasions6C1.occurrences||typeof S.occasions6C1.occurrences!=='object'||Array.isArray(S.occasions6C1.occurrences))S.occasions6C1.occurrences={};
 return S.occasions6C1
}
function occasionSafeKey6C1(v){return String(v??'none').replace(/[^a-zA-Z0-9._-]+/g,'_')}
function occasionId6C1(type,sourceKey,year){return `occ6c1:${occasionSafeKey6C1(type)}:${occasionSafeKey6C1(sourceKey)}:${Number(year)}`}
function occasionYear6C1(dateISO){return Number(String(dateISO).slice(0,4))}
function occasionAnnualDate6C1(monthDayOrISO,year){
 const md=String(monthDayOrISO||'').slice(-5),m=Number(md.slice(0,2)),d=Number(md.slice(3,5));if(!m||!d)return null;
 return isoDate(new Date(Date.UTC(Number(year),m-1,d)))
}
function occasionDefinitionCatalog6C1(){
 return {
  birthday:{recurrence:'annual',defaultPreparationDays:14,allowedParticipantModes:['family','friends','partner','school_when_permitted'],allowedLocations:['Home','School when permitted','legitimate venue']},
  holiday:{recurrence:'annual',defaultPreparationDays:7,allowedParticipantModes:['family','friends','partner','school_when_applicable','neighborhood_when_applicable'],allowedLocations:['Home','School when applicable','Community','legitimate venue']},
  dating_anniversary:{recurrence:'annual',defaultPreparationDays:7,allowedParticipantModes:['established_partner'],allowedLocations:['Home','legitimate venue']},
  wedding_anniversary:{recurrence:'annual',defaultPreparationDays:14,allowedParticipantModes:['spouse','family','friends'],allowedLocations:['Home','legitimate venue']},
  parents_anniversary:{recurrence:'annual',defaultPreparationDays:14,allowedParticipantModes:['existing_family'],allowedLocations:['Home','legitimate venue']}
 }
}
function occasionPermissionContext6C1(){return S.age<18?{authority:'H3',requiredWhen:'spending_venue_travel_or_supervision_requires_it',adultIndependent:false}:{authority:'self',requiredWhen:null,adultIndependent:true}}
function occasionPreparationDays6C1(type,source=null){
 const base=occasionDefinitionCatalog6C1()[type]?.defaultPreparationDays||7;
 if(type==='holiday'&&source?.activities?.length)return Math.max(base,...source.activities.map(a=>Number(a.days)||0));
 return base
}
function occasionCalendarReference6C1(type,sourceKey,extra={}){
 if(type==='holiday')return {authority:'HOLIDAYS',holidayId:sourceKey,region:calendarProfile().region};
 if(type==='birthday')return extra.player?{authority:'PlayerDOB'}:{authority:'People',personId:sourceKey};
 if(type==='dating_anniversary'||type==='wedding_anniversary')return {authority:'Romance',personId:sourceKey,relationshipDate:extra.relationshipDate||null};
 if(type==='parents_anniversary')return {authority:'Family',field:'parentsAnniversaryDate'};
 return {authority:'Calendar'}
}
function occasionStatusForDate6C1(rec){
 const today=currentDate();if(today<rec.preparationWindow.opensISO)return 'Upcoming';
 if(today<rec.dateISO)return 'Preparation open';
 if(today<=rec.endDateISO)return 'Active';
 return 'Expired'
}
function occasionTransition6C1(id,next,reason=''){
 const rec=occasionState6C1().occurrences[id];if(!rec)return {ok:false,reason:'occasion_not_found'};
 if(rec.status===next)return {ok:false,reason:'already_'+String(next).toLowerCase().replace(/\s+/g,'_'),occasion:rec};
 if(OCCASION6C1_TERMINAL.has(rec.status))return {ok:false,reason:'occasion_terminal',occasion:rec};
 if(!OCCASION6C1_TRANSITIONS[rec.status]?.has(next))return {ok:false,reason:'invalid_transition',occasion:rec};
 rec.history=Array.isArray(rec.history)?rec.history:[];rec.history.push({from:rec.status,to:next,dateISO:currentDate(),minute:currentMinute(),reason:reason||''});if(rec.history.length>16)rec.history.shift();
 rec.status=next;if(OCCASION6C1_TERMINAL.has(next))rec.resolvedAt={dateISO:currentDate(),minute:currentMinute(),reason:reason||''};return {ok:true,occasion:rec}
}
function occasionEvidenceCompleted6C1(rec){
 if(typeof occasionMeaningfulSocial6C6==='function'&&occasionMeaningfulSocial6C6(rec))return true;
 if(rec.occasionType==='holiday')return !!(S.holidayLog?.[`${rec.sourceKey}-${rec.occurrenceYear}`]||[]).length;
 if(rec.occasionType==='birthday'&&rec.celebrantPersonId){const p=personById(rec.celebrantPersonId);return !!p&&typeof birthdayAcknowledged==='function'&&birthdayAcknowledged(p,String(rec.occurrenceYear))}
 if(rec.occasionType==='birthday'&&rec.celebrantKind==='player')return rec.endDateISO<currentDate()&&ageFromDate(S.dob,rec.endDateISO)>=Number(rec.metadata?.turningAge||0);
 return false
}
function occasionNormalizePersonRefs6C1(rec){
 rec.participantPersonIds=Array.isArray(rec.participantPersonIds)?rec.participantPersonIds.filter((id,i,a)=>!!personById(id)&&a.indexOf(id)===i):[];
 if(rec.hostPersonId&&!personById(rec.hostPersonId))rec.hostPersonId=null;
 if(rec.celebrantPersonId&&!personById(rec.celebrantPersonId)&&!OCCASION6C1_TERMINAL.has(rec.status))occasionTransition6C1(rec.occasionId,'Cancelled','Celebrant no longer exists in People');
}
function occasionUpsert6C1(spec){
 const st=occasionState6C1(),id=occasionId6C1(spec.occasionType,spec.sourceKey,spec.occurrenceYear),existing=st.occurrences[id],prepDays=Math.max(0,Number(spec.preparationDays)||0),endDateISO=spec.endDateISO||spec.dateISO;
 const canonical={schemaVersion:OCCASION6C1_SCHEMA,occasionId:id,occasionType:spec.occasionType,sourceKey:String(spec.sourceKey),occurrenceYear:Number(spec.occurrenceYear),title:spec.title||'Occasion',celebrantKind:spec.celebrantKind||null,celebrantPersonId:spec.celebrantPersonId||null,hostPersonId:spec.hostPersonId||null,participantPersonIds:Array.isArray(spec.participantPersonIds)?spec.participantPersonIds:[],dateISO:spec.dateISO,endDateISO,location:spec.location||null,recurrence:'annual',preparationWindow:{days:prepDays,opensISO:addDays(spec.dateISO,-prepDays)},preparationDeadline:{dateISO:spec.dateISO,minute:0},deadline:{dateISO:endDateISO,minute:1439},allowedParticipantModes:[...(spec.allowedParticipantModes||[])],allowedLocations:[...(spec.allowedLocations||[])],ageRules:spec.ageRules||{minAge:0},permissionContext:occasionPermissionContext6C1(),calendarReference:spec.calendarReference||null,metadata:spec.metadata||{},status:'Upcoming',history:[]};
 canonical.status=occasionStatusForDate6C1(canonical);
 if(!existing){st.occurrences[id]=canonical;return canonical}
 // Future/current metadata may follow its canonical source. Never rewrite a terminal historical occurrence.
 if(!OCCASION6C1_TERMINAL.has(existing.status)){
  const preserve={status:existing.status,history:existing.history||[],resolvedAt:existing.resolvedAt,createdAt:existing.createdAt,hostPersonId:existing.hostPersonId,participantPersonIds:existing.participantPersonIds||[],location:existing.location};
  Object.assign(existing,canonical,preserve);existing.permissionContext=occasionPermissionContext6C1()
 }
 occasionNormalizePersonRefs6C1(existing);return existing
}
function occasionNextYearFor6C1(resolveDate,endForYear=null){
 const today=currentDate(),y=Number(today.slice(0,4));let d=resolveDate(y),end=endForYear?endForYear(y,d):d;
 if(!d||end<today){d=resolveDate(y+1);return {year:y+1,dateISO:d}}
 return {year:y,dateISO:d}
}
function occasionAddHoliday6C1(h){
 if(!holidayObserved(h))return null;const n=occasionNextYearFor6C1(y=>holidayDate(h,y),(y,d)=>addDays(d,(h.durationDays||1)-1));if(!n.dateISO)return null;
 const def=occasionDefinitionCatalog6C1().holiday;return occasionUpsert6C1({occasionType:'holiday',sourceKey:h.id,occurrenceYear:n.year,title:h.name,dateISO:n.dateISO,endDateISO:addDays(n.dateISO,(h.durationDays||1)-1),preparationDays:occasionPreparationDays6C1('holiday',h),allowedParticipantModes:def.allowedParticipantModes,allowedLocations:h.school?['Home','School when permitted','Community']:def.allowedLocations,ageRules:{minAge:0},calendarReference:occasionCalendarReference6C1('holiday',h.id),metadata:{holidayId:h.id,region:calendarProfile().region,durationDays:h.durationDays||1,school:!!h.school}})
}
function occasionAddPlayerBirthday6C1(){
 const n=occasionNextYearFor6C1(y=>occasionAnnualDate6C1(S.dob,y));if(!n.dateISO)return null;const def=occasionDefinitionCatalog6C1().birthday;
 return occasionUpsert6C1({occasionType:'birthday',sourceKey:'player',occurrenceYear:n.year,title:`${S.name}'s birthday`,celebrantKind:'player',dateISO:n.dateISO,preparationDays:def.defaultPreparationDays,allowedParticipantModes:def.allowedParticipantModes,allowedLocations:def.allowedLocations,ageRules:{minAge:0},calendarReference:occasionCalendarReference6C1('birthday','player',{player:true}),metadata:{turningAge:ageFromDate(S.dob,n.dateISO)}})
}
function occasionAddPersonBirthday6C1(p){
 if(!p?.id||!p.bday)return null;const n=occasionNextYearFor6C1(y=>occasionAnnualDate6C1(p.bday,y));if(!n.dateISO)return null;const def=occasionDefinitionCatalog6C1().birthday;
 return occasionUpsert6C1({occasionType:'birthday',sourceKey:p.id,occurrenceYear:n.year,title:`${displayName(p)}'s birthday`,celebrantKind:'person',celebrantPersonId:p.id,dateISO:n.dateISO,preparationDays:def.defaultPreparationDays,allowedParticipantModes:def.allowedParticipantModes,allowedLocations:def.allowedLocations,ageRules:{minAge:0},calendarReference:occasionCalendarReference6C1('birthday',p.id),metadata:{personRole:p.role||null}})
}
function occasionRelationshipDate6C1(p){return p?.love?.relationshipStartDate||S.romance?.relationshipStartDate||null}
function occasionWeddingDate6C1(p){
 if(!p)return null;const direct=S.romance?.married?.personId===p.id&&/^\d{4}-\d{2}-\d{2}$/.test(S.romance.married.dateISO||'')?S.romance.married.dateISO:null;const ms=(p.milestones||[]).filter(m=>m.type==='married'&&/^\d{4}-\d{2}-\d{2}$/.test(m.dateISO||'')).sort((a,b)=>a.dateISO.localeCompare(b.dateISO));return direct||ms[0]?.dateISO||null
}
function occasionAddRelationshipAnniversaries6C1(){
 const pid=S.romance?.partnerId,p=pid&&personById(pid);if(!p)return;const stage=p.love?.stage||p.romanceStage||'';
 const start=occasionRelationshipDate6C1(p);if(start&&['goingOut','official','inLove','superInLove','serious','livingTogether','engaged','married','family','dating','partner'].includes(stage)){
  const n=occasionNextYearFor6C1(y=>occasionAnnualDate6C1(start,y)),def=occasionDefinitionCatalog6C1().dating_anniversary;
  if(n.dateISO)occasionUpsert6C1({occasionType:'dating_anniversary',sourceKey:p.id,occurrenceYear:n.year,title:`Anniversary with ${displayName(p)}`,celebrantKind:'relationship',celebrantPersonId:p.id,dateISO:n.dateISO,preparationDays:def.defaultPreparationDays,allowedParticipantModes:def.allowedParticipantModes,allowedLocations:def.allowedLocations,ageRules:{minAge:13},calendarReference:occasionCalendarReference6C1('dating_anniversary',p.id,{relationshipDate:start}),metadata:{relationshipStartDate:start}})
 }
 const wed=occasionWeddingDate6C1(p);if(wed&&['married','family'].includes(stage)){
  const n=occasionNextYearFor6C1(y=>occasionAnnualDate6C1(wed,y)),def=occasionDefinitionCatalog6C1().wedding_anniversary;
  if(n.dateISO)occasionUpsert6C1({occasionType:'wedding_anniversary',sourceKey:p.id,occurrenceYear:n.year,title:`Wedding anniversary with ${displayName(p)}`,celebrantKind:'relationship',celebrantPersonId:p.id,dateISO:n.dateISO,preparationDays:def.defaultPreparationDays,allowedParticipantModes:def.allowedParticipantModes,allowedLocations:def.allowedLocations,ageRules:{minAge:18},calendarReference:occasionCalendarReference6C1('wedding_anniversary',p.id,{relationshipDate:wed}),metadata:{weddingDate:wed}})
 }
}
function occasionAddKnownParentsAnniversary6C1(){
 // Legacy builds could synthesize S.family.anniversary for vacation flavor. 6C.1
 // preserves that field but does not promote an unverifiable date into an occasion.
 const iso=S.family?.parentsAnniversaryDate||null;if(!/^\d{4}-\d{2}-\d{2}$/.test(iso||''))return null;
 const n=occasionNextYearFor6C1(y=>occasionAnnualDate6C1(iso,y)),def=occasionDefinitionCatalog6C1().parents_anniversary;if(!n.dateISO)return null;
 return occasionUpsert6C1({occasionType:'parents_anniversary',sourceKey:'parents',occurrenceYear:n.year,title:"Parents' anniversary",celebrantKind:'family',dateISO:n.dateISO,preparationDays:def.defaultPreparationDays,allowedParticipantModes:def.allowedParticipantModes,allowedLocations:def.allowedLocations,ageRules:{minAge:0},calendarReference:occasionCalendarReference6C1('parents_anniversary','parents'),metadata:{knownDate:iso}})
}
function migrateOccasions6C1(){occasionState6C1();return S.occasions6C1}
function reconcileOccasions6C1(reason='reconcile'){
 if(!S)return null;migrateOccasions6C1();
 for(const h of HOLIDAYS)occasionAddHoliday6C1(h);occasionAddPlayerBirthday6C1();for(const p of S.people||[])occasionAddPersonBirthday6C1(p);occasionAddRelationshipAnniversaries6C1();occasionAddKnownParentsAnniversary6C1();
 for(const rec of Object.values(S.occasions6C1.occurrences)){
  occasionNormalizePersonRefs6C1(rec);if(typeof occasionReconcileSurprise6C5==='function')occasionReconcileSurprise6C5(rec);if(OCCASION6C1_TERMINAL.has(rec.status)){if(typeof occasionReconcileConsequences6C6==='function')occasionReconcileConsequences6C6(rec);continue;}
  const desired=occasionStatusForDate6C1(rec);
  if(desired==='Expired')occasionTransition6C1(rec.occasionId,occasionEvidenceCompleted6C1(rec)?'Completed':'Expired',occasionEvidenceCompleted6C1(rec)?'Existing source recorded participation':'Occasion window passed without recorded participation');
  else if(desired!==rec.status&&!(rec.status==='Planned'&&['Upcoming','Preparation open'].includes(desired)))occasionTransition6C1(rec.occasionId,desired,`Canonical date lifecycle (${reason})`)
  if(typeof occasionReconcileConsequences6C6==='function')occasionReconcileConsequences6C6(rec);
  if(typeof occasionNpcInitiative6C5==='function'&&rec.occasionType==='birthday'&&rec.celebrantKind==='player'&&!OCCASION6C1_TERMINAL.has(rec.status))occasionNpcInitiative6C5(rec.occasionId);
 }
 if(typeof occasionNotify6C7==='function')occasionNotify6C7();
 return S.occasions6C1
}
function occasionPreparationGate6C1(id){
 const rec=occasionState6C1().occurrences[id];if(!rec)return {ok:false,reason:'occasion_not_found'};
 if(OCCASION6C1_TERMINAL.has(rec.status))return {ok:false,reason:'occasion_terminal'};
 const now=nowStamp(),open=stamp(rec.preparationWindow.opensISO,0),deadline=stamp(rec.preparationDeadline.dateISO,rec.preparationDeadline.minute);
 if(now<open)return {ok:false,reason:'preparation_not_open',opensISO:rec.preparationWindow.opensISO};if(now>=deadline)return {ok:false,reason:'preparation_deadline_passed'};
 if(!['Preparation open','Planned'].includes(rec.status))return {ok:false,reason:'preparation_not_available'};return {ok:true,occasion:rec}
}
function occasionRecord6C1(id){return occasionState6C1().occurrences[id]||null}
function occasionRecords6C1(){return Object.values(occasionState6C1().occurrences).sort((a,b)=>a.dateISO.localeCompare(b.dateISO)||a.occasionId.localeCompare(b.occasionId))}
