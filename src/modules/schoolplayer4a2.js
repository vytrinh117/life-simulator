// =====================================================================
// PHASE 4A.2 — PLAYER SCHOOL ASSIGNMENT / PROGRESSION
// Canonical currentSchoolId + continuous enrollment history for Player.
// Keeps legacy yearly S.schoolHistory untouched for attendance/reporting.
// =====================================================================
const PLAYER_SCHOOL_SCHEMA_4A2=1;
function schoolSlug4A2(v){return String(v||'school').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'').slice(0,48)||'school'}
function ensureLegacySchoolEntity4A2(name,stage){
 const known=schoolIdFromLegacyName(name);if(known)return known;
 const clean=String(name||'').trim();if(!clean)return null;const st=canonicalSchoolStage4A1(stage)||'unknown';
 const id=`legacy_${st}_${schoolSlug4A2(clean)}`,w=schoolWorldState4A1();
 if(!w.customSchools[id])w.customSchools[id]={schoolId:id,name:clean,educationLevel:st,type:'unknown',area:null,reputation:null,academicStrength:null,sportsStrength:null,artsStrength:null,facilities:[],programs:[],calendarProfile:null,legacy:true};
 return id
}
function resolvePlayerSchoolId4A2(sc,stageHint=null,{allowLegacy=true}={}){
 if(!sc)return null;const st=canonicalSchoolStage4A1(stageHint||sc.stage||stageOfSchool(sc));
 for(const id of [sc.currentSchoolId,sc.schoolId])if(id&&schoolById(id))return id;
 const known=schoolIdFromLegacyName(sc.name);if(known)return known;
 return allowLegacy?ensureLegacySchoolEntity4A2(sc.name,st):null
}
function attachPlayerSchoolIdentity4A2(sc,stageHint=null,carry=null){
 if(!sc)return sc;const st=canonicalSchoolStage4A1(stageHint||sc.stage||stageOfSchool(sc));
 let id=null;
 if(carry&&canonicalSchoolStage4A1(carry.stage||stageOfSchool(carry))===st&&carry.currentSchoolId&&schoolById(carry.currentSchoolId))id=carry.currentSchoolId;
 id=id||resolvePlayerSchoolId4A2(sc,st,{allowLegacy:true});
 if(id){sc.currentSchoolId=id;const ent=schoolById(id);if(ent?.name&&!sc.name)sc.name=ent.name}
 sc.stage=st||sc.stage;return sc
}
function playerSchoolEnrollments4A2(){S.education=Object.assign({graduations:[]},S.education||{});S.education.schoolEnrollments=Array.isArray(S.education.schoolEnrollments)?S.education.schoolEnrollments:[];return S.education.schoolEnrollments}
function activePlayerSchoolEnrollment4A2(){return playerSchoolEnrollments4A2().find(x=>!x.endDate)||null}
function yearOf4A2(d){try{return parseISO(d).getUTCFullYear()}catch(e){return null}}
function closePlayerSchoolEnrollment4A2(reason='School changed',dateISO=currentDate()){
 const x=activePlayerSchoolEnrollment4A2();if(!x)return null;x.endDate=x.endDate||dateISO;x.endYear=x.endYear||yearOf4A2(x.endDate);x.reason=x.reason||reason;return x
}
function syncPlayerSchoolEnrollment4A2({reason='Enrolled'}={}){
 const arr=playerSchoolEnrollments4A2(),sc=S.school;if(!sc)return null;attachPlayerSchoolIdentity4A2(sc);
 const id=sc.currentSchoolId;if(!id||!schoolById(id))return null;const st=canonicalSchoolStage4A1(sc.stage||stageOfSchool(sc));let cur=activePlayerSchoolEnrollment4A2();
 if(cur&&(cur.schoolId!==id||canonicalSchoolStage4A1(cur.stage)!==st)){closePlayerSchoolEnrollment4A2(reason==='Enrolled'?'School/stage transition':reason);cur=null}
 if(!cur){const start=sc.startedDate||sc.yearStarted||currentDate();cur={schoolId:id,stage:st,startDate:start,startYear:yearOf4A2(start),endDate:null,endYear:null,gradesAttended:[],reasonStarted:reason};arr.push(cur)}
 if(sc.grade&&!cur.gradesAttended.includes(sc.grade))cur.gradesAttended.push(sc.grade);return cur
}
function playerCurrentSchoolId4A2(){return S?.school?.currentSchoolId&&schoolById(S.school.currentSchoolId)?S.school.currentSchoolId:null}
function currentSchoolForPlayer4A2(){return schoolById(playerCurrentSchoolId4A2())}
function syncCurrentSchoolEvents4A2(){const id=playerCurrentSchoolId4A2(),sc=currentSchoolForPlayer4A2();if(!id||!sc)return;for(const ev of S.calendar||[]){if(!schoolOwnedEventType4A1(ev)||isTerminal(ev.status))continue;const legacy=ev.payload?.school;if(legacy&&legacy!==S.school?.name&&schoolIdFromLegacyName(legacy)!==id)continue;ev.payload=ev.payload||{};ev.schoolId=id;ev.payload.schoolId=id;if(!ev.payload.school)ev.payload.school=sc.name}}
function migratePlayerSchool4A2(){
 migrateSchoolWorld4A1();playerSchoolEnrollments4A2();
 // Normalize only records already present; never fabricate years of history.
 S.education.schoolEnrollments=S.education.schoolEnrollments.filter(x=>x&&typeof x==='object').map(x=>{const y={...x};if(!y.schoolId&&y.school)y.schoolId=schoolIdFromLegacyName(y.school)||ensureLegacySchoolEntity4A2(y.school,y.stage);if(y.schoolId&&!schoolById(y.schoolId))y.schoolId=null;y.stage=canonicalSchoolStage4A1(y.stage)||y.stage||null;y.gradesAttended=Array.isArray(y.gradesAttended)?[...new Set(y.gradesAttended.filter(Boolean))]:[];return y});
 if(S.school){attachPlayerSchoolIdentity4A2(S.school);syncPlayerSchoolEnrollment4A2({reason:'Migrated current enrollment'});syncCurrentSchoolEvents4A2()}
 return {schemaVersion:PLAYER_SCHOOL_SCHEMA_4A2,currentSchoolId:playerCurrentSchoolId4A2(),history:S.education.schoolEnrollments}
}
function transferPlayerSchool4A2(targetSchoolId,reason='School transfer'){
 const target=schoolById(targetSchoolId),sc=S.school;if(!target||!sc)return false;const curStage=canonicalSchoolStage4A1(sc.stage||stageOfSchool(sc));if(canonicalSchoolStage4A1(target.educationLevel)!==curStage)return false;if(sc.currentSchoolId===target.schoolId)return true;
 closePlayerSchoolEnrollment4A2(reason);sc.currentSchoolId=target.schoolId;sc.name=target.name;sc.stage=target.educationLevel;sc.startedDate=currentDate();
 for(const ev of S.calendar||[])if(schoolOwnedEventType4A1(ev)&&!isTerminal(ev.status)&&ev.dateISO>=currentDate()){ev.payload=ev.payload||{};ev.schoolId=target.schoolId;ev.payload.schoolId=target.schoolId;ev.payload.school=target.name;if(ev.type==='schoolDay')ev.title=`School • ${target.name}`}
 syncPlayerSchoolEnrollment4A2({reason});return true
}
function playerSchoolIdentityRows4A2(){const sc=currentSchoolForPlayer4A2();if(!sc)return '';const type=sc.type?String(sc.type).replace(/_/g,' '):'Unknown';const stage=STAGE_LABEL[sc.educationLevel]||sc.educationLevel||'';return `${statRow('School type',esc(type[0]?.toUpperCase()+type.slice(1)))}${stage?statRow('Stage',esc(stage)):''}`}
