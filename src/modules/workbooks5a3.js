// =====================================================================
// PHASE 5A.3 — ADVANCED EXERCISE SESSION ENGINE
// One meaningful workbook-progression session per Player per game date.
// Uses 5A.1 Inventory ownership + 5A.2 player-learning progress.
// =====================================================================
const WORKBOOK_SESSION_SCHEMA_5A3=3;
function ensureWorkbookSessions5A3(){
 S.workbookSessions5A3=Object.assign({schemaVersion:WORKBOOK_SESSION_SCHEMA_5A3,lastProgressDate:null,sessionsByDate:{}},S.workbookSessions5A3||{});
 const st=S.workbookSessions5A3;st.schemaVersion=WORKBOOK_SESSION_SCHEMA_5A3;
 if(!st.sessionsByDate||typeof st.sessionsByDate!=='object'||Array.isArray(st.sessionsByDate))st.sessionsByDate={};
 if(st.lastProgressDate==null)st.lastProgressDate=null;
 return st
}
function advancedStudySessionToday5A3(dateISO=currentDate()){return ensureWorkbookSessions5A3().sessionsByDate?.[dateISO]||null}
function advancedStudyUsedToday5A3(dateISO=currentDate()){return !!advancedStudySessionToday5A3(dateISO)}
function workbookSessionDuration5A3(itemId){const d=workbookDefinition5A1(itemId),level=Math.max(1,Math.min(3,Number(d?.workbookLevelIndex)||1));return [60,90,120][level-1]}
function advancedStudyLocationGate5A3(itemId=null){
 if(SIM?.sleeping)return {ok:false,reason:'Finish sleeping before starting Advanced Study.'};
 if(typeof onTrip==='function'&&onTrip(currentDate())||String(S.location||'').toLowerCase()==='trip')return {ok:false,reason:'Advanced Study is unavailable while traveling.'};
 if(S.location==='Home')return {ok:true,mode:'home',reason:'Home study'};
 const loc=String(S.location||'');if(/library|study/i.test(loc))return {ok:true,mode:'study_space',reason:'Study space'};
 if(typeof playerAtSchool4C1==='function'&&playerAtSchool4C1()){
  const day=schoolDayState4C1();
  if(day.classesRunning)return {ok:false,reason:'Advanced Study is not available during an active class.'};
  if(day.afterSchoolWindow&&day.campusOpen)return {ok:true,mode:'after_school_study',reason:'After-school study area'};
  return {ok:false,reason:'Use Advanced Study at home, a library, or a legitimate after-school study area.'}
 }
 return {ok:false,reason:'Advanced Study needs a legitimate home, library, or study-area location.'}
}
function advancedStudyScheduleGate5A3(itemId,start=currentMinute()){
 const minutes=workbookSessionDuration5A3(itemId),end=start+minutes;
 if(typeof schoolDayState4C1==='function'&&typeof needsFormalSchool==='function'&&needsFormalSchool()){
  const day=schoolDayState4C1(currentDate(),start);if(day.isSchoolDay&&day.classesRunning)return {ok:false,reason:'School is in session right now. Advanced Study cannot overlap class.',minutes,end}
 }
 const conflict=typeof timedSchoolConflict4C4==='function'?timedSchoolConflict4C4(currentDate(),start,end):null;
 if(conflict)return {ok:false,reason:`Schedule conflict with ${conflict.title} (${timeLabel(conflict.startMinute)}–${timeLabel(conflict.endMinute)}).`,minutes,end,conflictId:conflict.id};
 return {ok:true,minutes,end}
}
function advancedStudyContextFactor5A3(){
 const energy=clamp(Number(S.energy??S.needs?.energy??60)),health=clamp(Number(S.health??70)),stress=clamp(Number(S.stress??30)),mood=clamp(Number(S.happiness??50));
 return clamp(1+(energy-50)/250+(health-60)/400-(stress-30)/500+(mood-50)/500,.75,1.12)
}
function advancedStudyProgressGain5A3(itemId,dateISO=currentDate()){
 const d=workbookDefinition5A1(itemId);if(!d)return 0;
 const smart=clamp(Number(S.smart??50)),levelDifficulty=workbookLevelDifficulty5A2(itemId),grade=Math.max(1,Math.min(12,Number(d.grade)||1)),gradeDifficulty=1+Math.max(0,grade-6)*.015,context=advancedStudyContextFactor5A3();
 const jitter=((hashOf(`${itemId}|${dateISO}|${S.name||''}|5A3`)%61)-30)/100;
 const raw=((1.1+smart*.038)*context)/(levelDifficulty*gradeDifficulty)+jitter;
 return Math.round(clamp(raw,1,5)*10)/10
}
function advancedStudyNarrative5A3(itemId,gain,context=advancedStudyContextFactor5A3()){
 const d=workbookDefinition5A1(itemId);let text;
 if(gain>=4)text='Concepts clicked quickly and you finished a challenging section.';
 else if(gain>=3)text='You found a useful pattern and worked through the harder questions.';
 else if(gain>=2)text='You made steady progress, pausing to check a few difficult steps.';
 else text='The material was demanding, so you slowed down and learned from the worked examples.';
 if(context<.9)text+=' Low energy, health, mood, or high stress made concentration harder.';
 else if(context>1.05)text+=' You were focused and in good study condition.';
 return `${d?.name||'Advanced Study'} — ${text}`
}
function advancedStudySessionGate5A3(subject,itemId=null){
 const grade=currentWorkbookGrade5A1(),it=itemId?(S.inventoryItems||[]).find(x=>x.key===itemId&&!x.stored):workbookStudyCandidate5A2(subject,grade),key=itemId||it?.key;
 if(!key)return {ok:false,status:'no_workbook',reason:workbookStudyReason5A2(subject,grade),itemId:null};
 const eligible=workbookEligibility5A2(key);if(!eligible.ok)return {ok:false,status:eligible.status,reason:eligible.reason,itemId:key};
 const prior=advancedStudySessionToday5A3();if(prior)return {ok:false,status:'daily_limit',reason:"You've already completed an advanced study session today.",itemId:key,previousSession:prior};
 if(Number(S.energy??S.needs?.energy??60)<15)return {ok:false,status:'exhausted',reason:'You are too exhausted for a meaningful Advanced Study session.',itemId:key};
 if(Number(S.health??70)<20)return {ok:false,status:'unwell',reason:'You are too unwell for a demanding Advanced Study session.',itemId:key};
 const loc=advancedStudyLocationGate5A3(key);if(!loc.ok)return Object.assign({status:'location',itemId:key},loc);
 const sch=advancedStudyScheduleGate5A3(key);if(!sch.ok)return Object.assign({status:'schedule',itemId:key},sch,{locationMode:loc.mode});
 return {ok:true,status:'available',itemId:key,workbook:workbookDefinition5A1(key),inventoryItem:it||null,locationMode:loc.mode,minutes:sch.minutes,endMinute:sch.end}
}
function advancedStudyButtonReason5A3(subject){
 const gate=advancedStudySessionGate5A3(subject);return gate.ok?`Available today • ${gate.minutes} min`:gate.reason
}
function performAdvancedStudy5A3(subject,itemId=null){
 const gate=advancedStudySessionGate5A3(subject,itemId);if(!gate.ok){toast(gate.reason);return Object.assign({ok:false},gate)};
 const key=gate.itemId,d=workbookDefinition5A1(key),dateISO=currentDate(),before=workbookProgress5A2(key),context=advancedStudyContextFactor5A3(),gain=advancedStudyProgressGain5A3(key,dateISO),progress=advanceWorkbookProgress5A2(key,gain,{dateISO});
 if(!progress.ok){toast(progress.reason||'Advanced Study is unavailable.');return progress}
 const level=Math.max(1,Math.min(3,Number(d.workbookLevelIndex)||1)),energyCost=5+level*2,stressCost=1+level;
 const sub=S.school?.subjects?.find(x=>x.name===d.subject);
 if(sub){sub.skill=clamp((Number(sub.skill)||0)+Math.min(1.8,gain*.35));sub.prep=clamp((Number(sub.prep)||0)+Math.min(4,gain));sub.score=Math.round(clamp((Number(sub.score)||0)+Math.min(.7,gain*.12))*10)/10;sub.lastStudyDate=dateISO}
 S.energy=clamp((Number(S.energy??S.needs?.energy??60))-energyCost);if(S.needs&&Number.isFinite(Number(S.needs.energy)))S.needs.energy=clamp(Number(S.needs.energy)-Math.max(2,energyCost-2));
 S.stress=clamp((Number(S.stress)||0)+stressCost);
 const narrative=advancedStudyNarrative5A3(key,progress.gain,context),session={dateISO,itemId:key,subject:d.subject,grade:Number(d.grade),workbookLevel:d.workbookLevel,workbookLevelIndex:Number(d.workbookLevelIndex),before:progress.before,after:progress.after,gain:progress.gain,completed:!!progress.completed,smart:clamp(Number(S.smart??50)),contextFactor:Math.round(context*1000)/1000,minutes:gate.minutes,locationMode:gate.locationMode,narrative};
 const st=ensureWorkbookSessions5A3();st.sessionsByDate[dateISO]=session;st.lastProgressDate=dateISO;
 if(typeof recordWorkbookStudyIntegration5A4==='function')recordWorkbookStudyIntegration5A4(session);
 advanceTime(gate.minutes);
 feedback(`${d.subject} • Level ${d.workbookLevel}`,`${narrative} Progress ${Math.round(session.before*10)/10}% → ${Math.round(session.after*10)/10}%${session.completed?' • COMPLETE':''}`,gate.minutes);
 return {ok:true,session:JSON.parse(JSON.stringify(session)),progress}
}
// Preserve the existing UI/action name while routing it through the canonical
// workbook session engine. Academic effects remain modest; exam/competition
// integrations are intentionally deferred to 5A.4.
function extraExercise(name){return performAdvancedStudy5A3(name)}
function migrateWorkbooks5A3(){
 migrateWorkbooks5A2();const st=ensureWorkbookSessions5A3();
 const clean={};for(const [dateISO,raw] of Object.entries(st.sessionsByDate||{})){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(dateISO)||!raw||!workbookDefinition5A1(raw.itemId))continue;
  const d=workbookDefinition5A1(raw.itemId);clean[dateISO]={dateISO,itemId:raw.itemId,subject:d.subject,grade:Number(d.grade),workbookLevel:d.workbookLevel,workbookLevelIndex:Number(d.workbookLevelIndex),before:clamp(Number(raw.before)||0),after:clamp(Number(raw.after)||0),gain:Math.max(0,Number(raw.gain)||0),completed:!!raw.completed,smart:clamp(Number(raw.smart??50)),contextFactor:Math.max(.5,Math.min(1.5,Number(raw.contextFactor)||1)),minutes:Math.max(30,Math.min(180,Number(raw.minutes)||workbookSessionDuration5A3(raw.itemId))),locationMode:raw.locationMode||'unknown',narrative:String(raw.narrative||'')}
 }
 st.sessionsByDate=clean;
 if(st.lastProgressDate&&!st.sessionsByDate[st.lastProgressDate])st.lastProgressDate=null;
 if(!st.lastProgressDate){const ds=Object.keys(st.sessionsByDate).sort();st.lastProgressDate=ds.length?ds[ds.length-1]:null}
 return true
}
