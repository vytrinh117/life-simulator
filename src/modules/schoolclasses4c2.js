
// =====================================================================
// PHASE 4C.2 — CLASSES / TEACHERS / ATTENDANCE / SCHOOL ACTIONS
// Refines the existing timetable, schoolDay calendar event and teacher data.
// It deliberately does not create a second attendance or clock system.
// =====================================================================
const SCHOOL_CLASSES_SCHEMA_4C2=1;
function schoolClassRuntime4C2(){
 if(!S.school)return null;
 S.school.classRuntime4C2=S.school.classRuntime4C2&&typeof S.school.classRuntime4C2==='object'?S.school.classRuntime4C2:{};
 S.school.classRuntime4C2.schemaVersion=SCHOOL_CLASSES_SCHEMA_4C2;
 return S.school.classRuntime4C2
}
function schoolClassSession4C2(dateISO=currentDate(),minute=currentMinute()){
 const day=schoolDayState4C1(dateISO,minute),tt=day.isSchoolDay?timetableFor(dateISO):[],raw=tt.find(p=>minute>=p.start&&minute<p.end)||null,br=typeof schoolShortBreak4C3==='function'?schoolShortBreak4C3(minute):{active:false};
 const period=br.active?{id:`break-${br.id}`,start:br.start,end:br.end,label:br.label,kind:'break'}:raw;
 const idx=raw?tt.findIndex(p=>p.id===raw.id):-1,next=br.active&&raw?.kind==='class'?{...raw,start:br.end}:tt.find(p=>p.start>minute)||null;
 const sub=period?.kind==='class'?S.school?.subjects?.find(s=>s.name===period.subject)||null:null;
 const teacher=sub?ensureTeacher(sub):null;
 return {schemaVersion:SCHOOL_CLASSES_SCHEMA_4C2,dateISO,minute,schoolId:day.schoolId,atSchool:day.atSchool,isSchoolDay:day.isSchoolDay,campusOpen:day.campusOpen,classesRunning:day.classesRunning,period,index:idx,subject:sub?.name||null,teacher:teacher?.name||null,nextPeriod:next?{id:next.id,kind:next.kind,subject:next.subject||null,start:next.start,end:next.end}:null}
}
function teacherOfficeSubjects4C2(dateISO=currentDate(),mode='lunch'){
 const subs=S.school?.subjects||[];if(!subs.length)return [];
 const seed=(typeof hashOf==='function'?hashOf(`${dateISO}|${playerCurrentSchoolId4A2?.()||S.school?.name}|${mode}`):weekdayIndex(dateISO)*17);
 const count=mode==='after_school'?Math.min(2,subs.length):1,start=Math.abs(seed)%subs.length,out=[];
 for(let i=0;i<count;i++)out.push(subs[(start+i*2)%subs.length].name);
 return [...new Set(out)]
}
function teacherAvailability4C2(subjectName,minute=currentMinute(),dateISO=currentDate()){
 const sub=S.school?.subjects?.find(s=>s.name===subjectName);if(!sub)return {ok:false,reason:'That teacher is not part of your current school schedule.'};
 const day=schoolDayState4C1(dateISO,minute);if(!day.isSchoolDay)return {ok:false,reason:`School is closed — ${day.closedReason||'no regular classes today'}.`};
 if(!day.atSchool)return {ok:false,reason:'Ask Teacher is an in-person school action — you are at home.'};
 if(!day.campusOpen)return {ok:false,reason:'The campus is closed right now.'};
 const ctx=schoolClassSession4C2(dateISO,minute),teacher=ensureTeacher(sub),attendance=schoolDayEvent(dateISO);
 if(ctx.period?.kind==='class'){
  if(!attendance||attendance.status!=='Attending')return {ok:false,reason:'You need an active school-day session before asking a teacher during class.'};
  if(ctx.subject!==subjectName)return {ok:false,reason:`${teacher.name} is teaching another class right now.`};
  return {ok:true,mode:'class',teacher:teacher.name,subject:subjectName,until:ctx.period.end}
 }
 if(ctx.period?.kind==='lunch'){
  if(!attendance||attendance.status!=='Attending')return {ok:false,reason:'You need an active school-day session before using lunch teacher help.'};
  const available=teacherOfficeSubjects4C2(dateISO,'lunch');
  return available.includes(subjectName)?{ok:true,mode:'lunch',teacher:teacher.name,subject:subjectName,until:ctx.period.end}:{ok:false,reason:`${teacher.name} is not available during this lunch period.`}
 }
 const h=day.hours,helpEnd=Math.min(h.campusClose-30,h.classEnd+90);
 if(minute>=h.classEnd&&minute<helpEnd){
  if(!attendance||!['Attending','Attended'].includes(attendance.status))return {ok:false,reason:'Attend school before using after-school teacher help.'};
  const available=teacherOfficeSubjects4C2(dateISO,'after_school');
  return available.includes(subjectName)?{ok:true,mode:'after_school',teacher:teacher.name,subject:subjectName,until:helpEnd}:{ok:false,reason:`${teacher.name} is not holding help hours this afternoon.`}
 }
 if(minute>=helpEnd)return {ok:false,reason:'Teacher help hours have ended for today.'};
 return {ok:false,reason:'That teacher is not available at this time.'}
}
function askTeacher4C2(subjectName){
 const a=teacherAvailability4C2(subjectName);if(!a.ok){toast(a.reason);return false}
 const sub=S.school.subjects.find(s=>s.name===subjectName),t=ensureTeacher(sub),ctx=schoolClassSession4C2();
 const mins=Math.max(5,Math.min(a.mode==='class'?12:20,(a.until||currentMinute()+20)-currentMinute()));
 sub.prep=clamp(sub.prep+(a.mode==='class'?3:5));sub.skill=clamp(sub.skill+(a.mode==='class'?.35:.55));t.rel=clamp(t.rel+2);
 if(a.mode==='class'&&ctx.period){const ev=sessionEvent();if(!ev){toast('Your active class session is no longer available.');return false}ev.periods=ev.periods||{};ev.periods[ctx.period.id]=ev.periods[ctx.period.id]||'question'}
 advanceTime(mins,{silent:true});log(`Asked ${t.name} for help`,`${subjectName} • ${a.mode==='after_school'?'after-school help':a.mode==='lunch'?'lunch help':'during class'} • ${mins} min. The explanation clears up part of the topic.`);return true
}
function recordSchoolArrival4C2(ev,minute=currentMinute(),tardy=minute>SCHOOL_DAY.tardyAfter){
 if(!ev)return null;const h=schoolHours4C1(),late=Math.max(0,minute-h.classStart);ev.checkIn=minute;ev.arrivalMinutesLate=late;ev.periods=ev.periods||{};
 if(tardy){const tt=timetableFor(ev.dateISO||currentDate());for(const p of tt)if(p.kind==='class'&&p.end<=minute&&!ev.periods[p.id])ev.periods[p.id]='late_missed';if(late>=60)S.school.behavior=clamp(S.school.behavior-1)}
 return {state:tardy?'late':'present',minutesLate:late}
}
function attendanceState4C2(dateISO=currentDate()){
 const ev=schoolDayEvent(dateISO);if(!ev)return {state:isSchoolDay(dateISO)?'not_recorded':'closed',status:null};
 if(ev.status==='Excused')return {state:'excused',status:ev.attendanceStatus||'Excused absence',reason:ev.resolutionReason||null};
 if(ev.status==='Missed')return {state:'absent',status:ev.attendanceStatus||'Absent',reason:ev.resolutionReason||null};
 if(ev.status==='Attended')return {state:(ev.attendanceStatus||'').toLowerCase().includes('tardy')?'late':'present',status:ev.attendanceStatus||'Present',minutesLate:ev.arrivalMinutesLate||0};
 if(ev.status==='Attending')return {state:(ev.attendanceStatus||'').toLowerCase().includes('tardy')?'late':'present',status:ev.attendanceStatus||'Present',minutesLate:ev.arrivalMinutesLate||0};
 return {state:'pending',status:ev.status||'Scheduled'}
}
function genuineSchoolIllness4C2(){return !!(typeof condition==='function'&&condition())||S.health<70||!!S.healthState?.illness}
function callInSickSchool4C2(){
 if(!needsFormalSchool()||!isSchoolDay()){toast('There is no regular school day to call out from.');return false}
 if(atSchool()){toast('You are already at school. See the school nurse if you feel ill.');return false}
 const ev=ensureSchoolDayObligation();if(!ev||isTerminal(ev.status)){toast('Today\'s attendance is already resolved.');return false}
 if(!genuineSchoolIllness4C2()){toast('You do not currently have an illness or health state that supports a sick absence.');return false}
 const caregiver=S.age<18?(typeof caregiverPerson==='function'?caregiverPerson():null):null,reason=S.age<18?'Sick day (caregiver verified)':'Sick day';
 S.school.stayHome=S.school.stayHome||{};S.school.stayHome[currentDate()]='sick';markSchoolAbsence(ev,{excused:true,reason});
 log('Called in sick',S.age<18?`${caregiver?firstName(caregiver):'Your caregiver'} contacts the school. Today is recorded as an excused sick absence.`:'You notify the school that you are ill. Today is recorded as an excused absence.');return true
}
function classBehaviorAction4C2(kind,sub,t,minutes){
 if(kind==='notes'){sessionGain(sub,minutes,{focus:1.18,teacher:.5});sub.prep=clamp(sub.prep+2);return `${t.name} moves quickly, but your notes are organized enough to review later.`}
 if(kind==='question'){sessionGain(sub,minutes,{focus:1.2,teacher:2});return `You ask ${t.name} a focused question. They answer it for the whole class, and the concept finally clicks.`}
 if(kind==='daydream'){sessionGain(sub,minutes,{focus:.18});S.needs.fun=clamp(S.needs.fun+4);if(chance(t.style==='Strict'?30:15)){t.rel=clamp(t.rel-2);S.school.behavior=clamp(S.school.behavior-1);addRep('troublemaker',.5);return `${t.name} calls your name after noticing you staring out the window. You missed most of the explanation.`}return `Your attention drifts for most of ${sub.name}. The bell feels surprisingly early.`}
 return null
}
function schoolClassContextHtml4C2(){
 if(!S.school||!needsFormalSchool())return '';const c=schoolClassSession4C2(),att=attendanceState4C2();let cur='No active class';
 if(!c.isSchoolDay)cur='No regular classes today';else if(c.period?.kind==='class')cur=`${c.subject} • ${c.teacher}`;else if(c.period?.kind==='lunch')cur='Lunch period';else if(c.minute<schoolHours4C1().classStart)cur='Before classes';else if(c.minute>=schoolHours4C1().classEnd)cur='Classes finished';
 const next=c.nextPeriod?(c.nextPeriod.kind==='lunch'?`Lunch at ${timeLabel(c.nextPeriod.start)}`:`${c.nextPeriod.subject} at ${timeLabel(c.nextPeriod.start)}`):'No more scheduled classes today';
 const checks=(S.school.subjects||[]).map(s=>({s:s.name,a:teacherAvailability4C2(s.name)})),help=checks.filter(x=>x.a.ok&&x.a.mode!=='class').slice(0,2);
 const unavailable=!c.isSchoolDay?'Teacher help unavailable — school is closed.':!c.atSchool?'Teacher help unavailable — you are at home.':c.period?.kind==='class'?'Ask your current teacher during class.':help.length?'':'Teacher help unavailable at this time.';
 const sick=!c.atSchool&&c.isSchoolDay&&!isTerminal(schoolDayEvent()?.status)&&genuineSchoolIllness4C2()?'<button class="small ghost" data-school-sick-4c2="1">Call in sick</button>':'';
 return `<div class="mini-meta school-class-context-4c2"><span><b>Current:</b> ${esc(cur)}</span><span><b>Next:</b> ${esc(next)}</span><span><b>Attendance:</b> ${esc(att.status||att.state)}</span>${unavailable?`<span>${esc(unavailable)}</span>`:''}${help.map(x=>`<button class="small ghost" data-ask-teacher-4c2="${esc(x.s)}">Ask ${esc(x.a.teacher)} for help</button>`).join('')}${sick}</div>`
}
function schoolClassesClick4C2(b){
 if(b.dataset.askTeacher4c2){askTeacher4C2(b.dataset.askTeacher4c2);save();render();return true}
 if(b.dataset.schoolSick4c2){callInSickSchool4C2();save();render();return true}
 return false
}
function reconcileSchoolClasses4C2(reason='tick'){
 if(!S.school||!needsFormalSchool())return null;const r=schoolClassRuntime4C2();r.lastSchoolId=playerCurrentSchoolId4A2?.()||null;
 const ev=schoolDayEvent();if(ev&&ev.status==='Attending'){ev.periods=ev.periods||{};if(ev.checkIn!=null&&ev.arrivalMinutesLate==null)recordSchoolArrival4C2(ev,ev.checkIn,ev.attendanceStatus==='Tardy')}
 return {schemaVersion:r.schemaVersion,schoolId:r.lastSchoolId}
}
function migrateSchoolClasses4C2(){
 if(!S.school)return null;const r=schoolClassRuntime4C2();r.schemaVersion=SCHOOL_CLASSES_SCHEMA_4C2;
 // Current-day metadata only. Never backfill historical attendance, schedules, or absences.
 const ev=schoolDayEvent();if(ev&&ev.status==='Attending'&&ev.checkIn!=null&&ev.arrivalMinutesLate==null)recordSchoolArrival4C2(ev,ev.checkIn,ev.attendanceStatus==='Tardy');
 return {schemaVersion:r.schemaVersion,schoolId:playerCurrentSchoolId4A2?.()||null}
}
