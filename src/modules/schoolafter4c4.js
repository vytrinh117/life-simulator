// =====================================================================
// Phase 4C.4 — Homework / After-school / Go Home / School-break logic
// Extends the canonical clock, calendar, homework, location and club systems.
// =====================================================================
const SCHOOL_AFTER_SCHEMA_4C4=1;
function schoolAfterRuntime4C4(){S.schoolAfterRuntime=Object.assign({schemaVersion:SCHOOL_AFTER_SCHEMA_4C4,lastReconcile:null,dinner:{}},S.schoolAfterRuntime||{});S.schoolAfterRuntime.dinner=S.schoolAfterRuntime.dinner||{};return S.schoolAfterRuntime}
function schoolSemesterStart4C4(dateISO=currentDate()){
 const a=academicInfo(dateISO);if(!a.semester)return null;return a.semester===1?a.start:a.sem2Start
}
function schoolInstructionDayIndex4C4(dateISO=currentDate()){
 const start=schoolSemesterStart4C4(dateISO);if(!start||dateISO<start||!isSchoolDay(dateISO))return 0;let d=start,n=0,guard=0;
 while(d<=dateISO&&guard++<220){if(isSchoolDay(d))n++;d=addDays(d,1)}return n
}
function homeworkLoadPolicy4C4(dateISO=currentDate()){
 const a=academicInfo(dateISO),day=schoolInstructionDayIndex4C4(dateISO);if(!needsFormalSchool()||!a.semester||!isSchoolDay(dateISO))return {allowed:false,day,maxActive:0,chance:0,reason:noSchoolReason(dateISO)};
 if(day<=2)return {allowed:false,day,maxActive:0,chance:0,reason:'Orientation / first days'};
 if(day<=5)return {allowed:true,day,maxActive:1,chance:18,reason:'Light first-week workload'};
 if(day<=10)return {allowed:true,day,maxActive:2,chance:24,reason:'Early-term workload'};
 return {allowed:true,day,maxActive:3,chance:28,reason:'Normal term workload'}
}
function nextHomeworkDue4C4(seed=0,used=new Set()){
 let d=currentDate(),steps=2+((Math.abs(Number(seed)||0)+schoolInstructionDayIndex4C4())%4);
 for(let i=0;i<steps;i++)d=nextSchoolDay(addDays(d,1));
 for(let guard=0;guard<8&&used.has(d);guard++)d=nextSchoolDay(addDays(d,1));return d
}
function homeworkEstimate4C4(sub,index=0){const g=Math.max(1,gradeNumber()||1),base=g<=5?30:g<=8?45:60;return Math.min(150,base+15*((index+g)%4))}
function homeworkStudyContext4C4(){
 if(!needsFormalSchool())return {ok:false,reason:'You are not enrolled in formal school.'};
 if(S.location==='Home')return {ok:true,mode:'home'};
 if(typeof playerAtSchool4C1==='function'&&playerAtSchool4C1()){const d=schoolDayState4C1();if(d.afterSchoolWindow&&d.campusOpen)return {ok:true,mode:'after_school_study'};return {ok:false,reason:d.classesRunning?'Homework is for home or a real study period, not during class.':'Use homework at home or during the after-school study window.'}}
 if(/library|study/i.test(String(S.location||'')))return {ok:true,mode:'study_space'};
 return {ok:false,reason:'Homework needs a legitimate home or study location.'}
}
function timedSchoolConflict4C4(dateISO,start,end,ignoreId=null){
 const mutuallyExclusive=new Set(['clubSession','tryout','plan','schoolEvent','leadershipSelection','conference','workDay','program','prom','wedding','trip','election']);
 return (S.calendar||[]).filter(e=>e&&e.id!==ignoreId&&e.dateISO===dateISO&&!isTerminal(e.status)&&mutuallyExclusive.has(e.type)&&Number.isFinite(Number(e.startMinute))&&Number.isFinite(Number(e.endMinute))).find(e=>start<Number(e.endMinute)&&Number(e.startMinute)<end)||null
}
function afterSchoolActivityGate4C4(ev){
 if(!ev)return {ok:false,reason:'No activity is scheduled.'};const day=schoolDayState4C1(ev.dateISO,currentMinute()),hours=schoolHours4C1(ev.dateISO);
 if(ev.dateISO!==currentDate())return {ok:false,reason:`This activity is scheduled for ${formatDate(ev.dateISO)}.`};
 if(!day.isSchoolDay)return {ok:false,reason:day.closedReason||'School is closed.'};
 if(ev.startMinute<hours.classEnd)return {ok:false,reason:'This is not an after-school activity slot.'};
 if(ev.endMinute>hours.campusClose)return {ok:false,reason:`The activity would run past campus closing at ${timeLabel(hours.campusClose)}.`};
 if(!playerAtSchool4C1())return {ok:false,reason:'You need to be physically at school for this after-school activity.'};
 const conflict=timedSchoolConflict4C4(ev.dateISO,ev.startMinute,ev.endMinute,ev.id);if(conflict)return {ok:false,reason:`Schedule conflict with ${conflict.title} (${timeLabel(conflict.startMinute)}–${timeLabel(conflict.endMinute)}).`,conflictId:conflict.id};
 return {ok:true,reason:'After-school activity can proceed.'}
}
function nextAfterSchoolObligation4C4(dateISO=currentDate()){
 if(!S.school)return null;const hours=schoolHours4C1(dateISO);return (S.calendar||[]).filter(e=>e.dateISO===dateISO&&!isTerminal(e.status)&&Number(e.startMinute)>=hours.classEnd&&Number(e.startMinute)<hours.campusClose&&Number(e.endMinute)<=hours.campusClose&&['clubSession','tryout','leadershipSelection','conference'].includes(e.type)).sort((a,b)=>a.startMinute-b.startMinute)[0]||null
}
function familyDinnerWindow4C4(){return {start:1140,end:1200,label:'7:00–8:00 PM'}}
function familyDinnerRecord4C4(dateISO=currentDate()){const r=schoolAfterRuntime4C4();return r.dinner[dateISO]||(r.dinner[dateISO]={dateISO,status:'Pending',reminded:false,missedReason:null})}
function hasPersonalCommunicationDevice4C4(){if(typeof communicationDeviceAccess3C1!=='function')return false;const a=communicationDeviceAccess3C1();return !!(a?.smartphone||a?.watch)}
function reconcileFamilyDinner4C4(reason='tick'){
 if(!S||S.age>=18&&typeof livesWithParents==='function'&&!livesWithParents())return null;const rec=familyDinnerRecord4C4(),w=familyDinnerWindow4C4(),m=currentMinute();
 if(rec.status==='Attended'||rec.status==='Leftovers')return rec;
 if(m>=w.start&&m<w.end&&S.location!=='Home'&&!rec.reminded&&hasPersonalCommunicationDevice4C4()){rec.reminded=true;notify('Dinner is ready at home','Your family is eating around 7:00 / 7:30 PM. If you stay out too long, you may miss dinner.',{sourceType:'familyDinner',sourceId:`dinner-${currentDate()}`,tab:'home'})}
 if(m>=w.end&&S.location!=='Home'&&rec.status==='Pending'){rec.status='Missed';rec.missedReason=`Away from home at ${timeLabel(m)}`;if(!SIM.skipping)log('Missed family dinner','You are still out after family dinner. When you get home, the shared meal and family time will already be over.')}
 return rec
}
function familyMeal(){
 if(typeof requireAction==='function'&&!requireAction('familyMeal'))return false;if(S.location!=='Home'){toast('Go home before having a family meal.');return false}
 const rec=familyDinnerRecord4C4(),w=familyDinnerWindow4C4(),late=rec.status==='Missed'||currentMinute()>=w.end;
 if(late){rec.status='Leftovers';rec.ateMinute=currentMinute();S.needs.hunger=clamp(S.needs.hunger-30);S.needs.social=clamp(S.needs.social+1);advanceTime(20);feedback('Ate leftovers','The family meal is over • Hunger improved a little',20);return true}
 rec.status='Attended';rec.ateMinute=currentMinute();S.needs.hunger=clamp(S.needs.hunger-52);S.needs.social=clamp(S.needs.social+10);S.family.closeness=clamp(S.family.closeness+2);advanceTime(45);feedback('Ate with family','Hunger improved • family closeness +2',45);return true
}
function reconcileAfterSchool4C4(reason='tick'){
 const r=schoolAfterRuntime4C4();r.lastReconcile={dateISO:currentDate(),minute:currentMinute(),reason};
 if(typeof reconcileSchoolDay4C1==='function')reconcileSchoolDay4C1(reason);
 reconcileFamilyDinner4C4(reason);return {schemaVersion:r.schemaVersion,location:S.location,dinner:familyDinnerRecord4C4()}
}
function migrateSchoolAfter4C4(){
 const r=schoolAfterRuntime4C4();r.schemaVersion=SCHOOL_AFTER_SCHEMA_4C4;
 if(S.school?.subjects)for(const sub of S.school.subjects){const hw=sub.homework;if(hw&&HW_OPEN.includes(hw.status)){hw.assignedDate=hw.assignedDate||currentDate();hw.estimatedMinutes=Number(hw.estimatedMinutes)||homeworkEstimate4C4(sub,S.school.subjects.indexOf(sub));}}
 reconcileAfterSchool4C4('migration');return {schemaVersion:r.schemaVersion,location:S.location}
}
function schoolAfterSchoolHtml4C4(){
 if(!S.school||!needsFormalSchool())return '';const d=schoolDayState4C1(),p=homeworkLoadPolicy4C4(),next=nextAfterSchoolObligation4C4(),study=homeworkStudyContext4C4(),w=familyDinnerWindow4C4(),dr=familyDinnerRecord4C4();
 const hw=(S.school.subjects||[]).filter(s=>HW_OPEN.includes(s.homework?.status));
 return `<div class="session-card school-after-4c4"><div class="session-head"><div><b>After school & homework</b><small>${p.allowed?`Instruction day ${p.day} • ${p.reason}`:esc(p.reason||'No normal homework generation')}</small></div><span class="tag ${d.afterSchoolWindow?'ok':''}">${d.afterSchoolWindow?'After-school window':d.isSchoolDay?'School day':'School closed'}</span></div><div class="mini-meta"><span>${hw.length?`${hw.length} active homework assignment${hw.length===1?'':'s'}`:'No active homework'}</span><span>${study.ok?`Homework location: ${study.mode.replaceAll('_',' ')}`:`Homework unavailable here: ${esc(study.reason)}`}</span><span>Campus closes ${timeLabel(d.hours.campusClose)}</span><span>Dinner ${timeLabel(w.start)}–${timeLabel(w.end)}${dr.status!=='Pending'?` • ${esc(dr.status)}`:''}</span>${next?`<span>Next after-school: ${esc(next.title)} at ${timeLabel(next.startMinute)}</span>`:''}</div></div>`
}
