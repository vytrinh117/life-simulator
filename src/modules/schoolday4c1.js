// =====================================================================
// PHASE 4C.1 — SCHOOL DAY / LOCATION / TIME FOUNDATION
// Refines the existing canonical clock/calendar and S.location.  This
// module deliberately does not introduce a second clock or location model.
// =====================================================================
const SCHOOL_DAY_SCHEMA_4C1=1;

function schoolDayRuntime4C1(){
 S.schoolDayRuntime=S.schoolDayRuntime&&typeof S.schoolDayRuntime==='object'?S.schoolDayRuntime:{};
 S.schoolDayRuntime.schemaVersion=SCHOOL_DAY_SCHEMA_4C1;
 S.schoolDayRuntime.locationSchoolId=S.schoolDayRuntime.locationSchoolId||null;
 S.schoolDayRuntime.lastTransition=S.schoolDayRuntime.lastTransition||null;
 return S.schoolDayRuntime
}
function schoolHours4C1(schoolId=typeof playerCurrentSchoolId4A2==='function'?playerCurrentSchoolId4A2():null){
 const ent=schoolId&&typeof schoolById==='function'?schoolById(schoolId):null;
 const custom=ent?.schoolHours||ent?.hours||null;
 if(custom&&Number.isFinite(Number(custom.campusOpen))&&Number.isFinite(Number(custom.classStart))&&Number.isFinite(Number(custom.classEnd))&&Number.isFinite(Number(custom.campusClose)))return {campusOpen:Number(custom.campusOpen),classStart:Number(custom.classStart),classEnd:Number(custom.classEnd),campusClose:Number(custom.campusClose),tardyAfter:Number(custom.tardyAfter??SCHOOL_DAY.tardyAfter),attendanceCutoff:Number(custom.attendanceCutoff??SCHOOL_DAY.cutoff),source:'school'};
 const stage=typeof canonicalSchoolStage4A1==='function'?canonicalSchoolStage4A1(ent?.educationLevel||S.school?.stage||stageOfSchool(S.school)):stageOfSchool(S.school);
 const byStage={kindergarten:{campusOpen:450,classStart:480,classEnd:900,campusClose:1020},primary:{campusOpen:450,classStart:480,classEnd:900,campusClose:1050},middle:{campusOpen:435,classStart:480,classEnd:900,campusClose:1080},high:{campusOpen:420,classStart:480,classEnd:900,campusClose:1080}};
 const h=byStage[stage]||{campusOpen:450,classStart:SCHOOL_DAY.start,classEnd:SCHOOL_DAY.end,campusClose:1080};
 return {...h,tardyAfter:SCHOOL_DAY.tardyAfter,attendanceCutoff:SCHOOL_DAY.cutoff,source:'default'}
}
function playerSchoolLocationKey4C1(){return S.location==='School'?'school':S.location==='Home'?'home':'other'}
function locationSchoolId4C1(){const r=schoolDayRuntime4C1();return playerSchoolLocationKey4C1()==='school'?(r.locationSchoolId||playerCurrentSchoolId4A2?.()||null):null}
function setPlayerLocation4C1(location,{schoolId=null,reason='Location changed',quiet=true}={}){
 const r=schoolDayRuntime4C1(),prev=S.location||'Home';
 S.location=location||'Home';
 r.locationSchoolId=S.location==='School'?(schoolId||playerCurrentSchoolId4A2?.()||null):null;
 if(prev!==S.location||r.lastTransition==null)r.lastTransition={from:prev,to:S.location,schoolId:r.locationSchoolId,dateISO:currentDate(),minute:currentMinute(),reason};
 if(!quiet&&prev!==S.location)log('Location',`${prev} → ${S.location}. ${reason}`);
 return S.location
}
function playerAtSchool4C1(){
 if((S.location||'Home')!=='School')return false;
 const sid=playerCurrentSchoolId4A2?.()||null,bound=locationSchoolId4C1();
 return !!sid&&(!bound||bound===sid)
}
function schoolDayState4C1(dateISO=currentDate(),minute=currentMinute()){
 const schoolId=playerCurrentSchoolId4A2?.()||null,school=schoolId&&schoolById?.(schoolId),hours=schoolHours4C1(schoolId),formal=!!S.school&&needsFormalSchool(),schoolDay=formal&&isSchoolDay(dateISO),reason=schoolDay?null:(formal?noSchoolReason(dateISO):'Not enrolled in formal school');
 let phase='closed';
 if(schoolDay){if(minute<hours.campusOpen)phase='before_open';else if(minute<hours.classStart)phase='arrival';else if(minute<hours.classEnd)phase='classes';else if(minute<hours.campusClose)phase='after_school';else phase='closed_after_hours'}
 const campusOpen=schoolDay&&minute>=hours.campusOpen&&minute<hours.campusClose;
 return {schemaVersion:SCHOOL_DAY_SCHEMA_4C1,dateISO,minute,schoolId,schoolName:school?.name||S.school?.name||null,grade:S.school?.grade||null,classId:S.school?.className||null,formalSchool:formal,isSchoolDay:!!schoolDay,closedReason:reason,hours,phase,campusOpen,classesRunning:schoolDay&&minute>=hours.classStart&&minute<hours.classEnd,afterSchoolWindow:schoolDay&&minute>=hours.classEnd&&minute<hours.campusClose,location:S.location||'Home',locationKey:playerSchoolLocationKey4C1(),locationSchoolId:locationSchoolId4C1(),atSchool:playerAtSchool4C1()}
}
function schoolCommuteMinutes4C1(){
 const st=canonicalSchoolStage4A1?.(currentSchoolForPlayer4A2?.()?.educationLevel||S.school?.stage||stageOfSchool(S.school));
 return st==='primary'?20:st==='middle'?25:st==='high'?30:20
}
function schoolTravelEligibility4C1(){
 const x=schoolDayState4C1();
 if(!x.formalSchool)return {ok:false,reason:'You are not currently enrolled in formal school.',state:x};
 if(!x.schoolId)return {ok:false,reason:'Your current school identity is not available.',state:x};
 if(!x.isSchoolDay)return {ok:false,reason:`School is closed — ${x.closedReason}.`,state:x};
 if(x.phase==='before_open')return {ok:false,reason:`Campus opens at ${timeLabel(x.hours.campusOpen)}.`,state:x};
 if(x.phase==='closed_after_hours')return {ok:false,reason:`Campus closed at ${timeLabel(x.hours.campusClose)}.`,state:x};
 if(x.atSchool)return {ok:false,reason:'You are already at school.',state:x};
 if((S.location||'Home')!=='Home')return {ok:false,reason:`Finish your current outing and return home before going to school.`,state:x};
 const commute=schoolCommuteMinutes4C1();if(currentMinute()+commute>=x.hours.campusClose)return {ok:false,reason:'There is not enough time to reach campus before it closes.',state:x};
 return {ok:true,state:x,commute}
}
function goToSchool4C1(opts={}){
 const g=schoolTravelEligibility4C1();if(!g.ok){toast(g.reason);return false}
 const depart=currentMinute(),sid=g.state.schoolId;advanceTime(g.commute,{silent:true});setPlayerLocation4C1('School',{schoolId:sid,reason:'Commute to school'});
 const ev=ensureSchoolDayObligation();
 if(ev&&!isTerminal(ev.status)&&currentMinute()<=g.state.hours.attendanceCutoff)checkInToSchool(opts);
 else if(ev&&!isTerminal(ev.status)&&currentMinute()>g.state.hours.attendanceCutoff)processCalendar();
 if(typeof preparePackedLunch4C3==='function')preparePackedLunch4C3('auto');
 const late=currentMinute()>g.state.hours.tardyAfter;
 log('Went to school',`${localTransport()} • ${g.commute} min commute from ${timeLabel(depart)}${late?' • arrived after the on-time window':''}.`);
 return true
}
function goHomeFromSchool4C1({quiet=false}={}){
 if(!playerAtSchool4C1()){toast('You are not at school.');return false}
 const hours=schoolHours4C1(),ev=schoolDayEvent(),leaveMinute=currentMinute(),early=!!ev&&ev.status==='Attending'&&leaveMinute<hours.classEnd;
 if(ev&&ev.status==='Attending')finishSchoolDay(ev,{early,quiet:true,stayAtSchool:false});
 const mins=schoolCommuteMinutes4C1();if(S.location!=='Home')setPlayerLocation4C1('Home',{reason:early?'Left school early':'Went home after school'});advanceTime(mins,{silent:true});
 if(!quiet)log(early?'Went home early':'Went home from school',`${localTransport()} • ${mins} min commute${early?' • the early departure remains on your attendance record':''}.`);
 return true
}
function schoolLocationActionGate4C1(id){
 if(!playerAtSchool4C1())return null;
 if(typeof schoolFacilityActionGate4C3==='function'){const facilityWhy=schoolFacilityActionGate4C3(id);if(facilityWhy)return facilityWhy}
 const homeOnly=new Set(['shower','bath','brush','sleep','nap','familyMeal','cook','comfort']);
 if(homeOnly.has(id))return `You are at school. Go home before ${id==='familyMeal'?'having a family meal':id==='comfort'?'using home comforts':id==='cook'?'cooking at home':id==='sleep'||id==='nap'?'sleeping at home':id+'ing'}.`;
 return null
}
function canLeaveCampusForPlace4C1(){if(!playerAtSchool4C1())return {ok:true};return {ok:false,reason:'You are at school. Use Go Home / leave campus before starting an off-campus outing.'}}
function reconcileSchoolDay4C1(reason='tick'){
 const r=schoolDayRuntime4C1(),sid=playerCurrentSchoolId4A2?.()||null;
 if(S.location!=='School'){r.locationSchoolId=null;return schoolDayState4C1()}
 if(!r.locationSchoolId&&sid)r.locationSchoolId=sid;
 const x=schoolDayState4C1();
 let why=null;
 if(!sid||!x.formalSchool)why='No active school enrollment';
 else if(r.locationSchoolId!==sid)why='School changed';
 else if(!x.isSchoolDay&&!(typeof schoolEventCampusAccess4D3==='function'&&schoolEventCampusAccess4D3()))why=x.closedReason||'School closed';
 else if(x.phase==='before_open'&&!(typeof schoolEventCampusAccess4D3==='function'&&schoolEventCampusAccess4D3()))why='Campus not open yet';
 else if(x.phase==='closed_after_hours'&&!(typeof schoolEventCampusAccess4D3==='function'&&schoolEventCampusAccess4D3()))why='Campus closed for the day';
 if(why)setPlayerLocation4C1('Home',{reason:`${why}; normalized school location`,quiet:true});
 return schoolDayState4C1()
}
function migrateSchoolDay4C1(){
 const r=schoolDayRuntime4C1();
 if(!['Home','School'].includes(S.location||'Home')&&typeof S.location!=='string')S.location='Home';
 reconcileSchoolDay4C1('migration');r.schemaVersion=SCHOOL_DAY_SCHEMA_4C1;return {schemaVersion:r.schemaVersion,location:S.location,locationSchoolId:r.locationSchoolId}
}
function schoolDayContextHtml4C1(){
 if(!S.school||!needsFormalSchool())return '';
 const x=schoolDayState4C1(),closed=!x.isSchoolDay?x.closedReason:x.phase==='before_open'?`Campus opens ${timeLabel(x.hours.campusOpen)}`:x.phase==='closed_after_hours'?`Campus closed ${timeLabel(x.hours.campusClose)}`:null;
 const current=x.classesRunning?'Classes in session':x.afterSchoolWindow?'After-school window':x.phase==='arrival'?'Arrival window':closed||'School day';
 const action=x.atSchool?`<button class="small primary" data-school-home4c1="1">Go Home</button>`:x.isSchoolDay&&['arrival','classes','after_school'].includes(x.phase)?`<button class="small primary" data-school-go4c1="1">Go to School</button>`:'';
 return `<div class="session-card school-context-4c1"><div class="session-head"><div><b>${esc(x.schoolName||'School')} • ${esc(x.grade||'')}</b><small>${esc(x.classId||'')} • Location: ${esc(x.location)} • ${timeLabel(x.minute)}</small></div><span class="tag ${x.campusOpen?'ok':''}">${esc(current)}</span></div><div class="mini-meta"><span>Campus ${timeLabel(x.hours.campusOpen)}–${timeLabel(x.hours.campusClose)}</span><span>Classes ${timeLabel(x.hours.classStart)}–${timeLabel(x.hours.classEnd)}</span>${closed?`<span>${esc(closed)}</span>`:''}</div>${action?`<div class="session-actions">${action}</div>`:''}</div>`
}
function schoolDayClick4C1(b){
 if(b.dataset.schoolGo4c1){goToSchool4C1();save();render();return true}
 if(b.dataset.schoolHome4c1){goHomeFromSchool4C1();save();render();return true}
 return false
}
