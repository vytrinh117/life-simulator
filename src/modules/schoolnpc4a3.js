// =====================================================================
// PHASE 4A.3 — NPC SCHOOL IDENTITY / HISTORY
// Persistent currentSchoolId + coherent stage/grade/class state for NPCs.
// People entities continue to reference NPCs by npcId; school identity is
// not duplicated onto each People record.
// =====================================================================
const NPC_SCHOOL_SCHEMA_4A3=1;
function npcSchoolAge4A3(n){const a=npcAge(n);return a>=3&&a<=17}
function npcSchoolStage4A3(n){if(!n||!npcSchoolAge4A3(n))return null;return canonicalSchoolStage4A1(stageForAge(npcAge(n)))}
function npcGradeNumber4A3(n){const a=npcAge(n);return a<6?0:Math.min(12,Math.max(1,a-5))}
function gradeNumberFromLabel4A3(v){if(!v)return null;const m=String(v).match(/Grade\s+(\d+)/i)||String(v).match(/^(\d+)-/);return m?Number(m[1]):String(v)==='Kindergarten'?0:null}
function npcEffectiveGradeNumber4A3(n){const base=npcGradeNumber4A3(n);if(base<=0)return 0;return Math.min(12,Math.max(1,base+Number(n?.schoolGradeOffset||0)))}
function npcGradeLabel4A3(n){const g=npcEffectiveGradeNumber4A3(n);return g<=0?'Kindergarten':gradeLabelFor(g)}
function npcSchoolClassDefault4A3(n,grade=npcEffectiveGradeNumber4A3(n)){if(grade<=0)return ['Sun','Moon','Rainbow','Bears'][hashOf((n?.id||'npc')+'kg')%4];return `${grade}-${String.fromCharCode(65+(hashOf((n?.id||'npc')+'class')%4))}`}
function npcSchoolHistory4A3(nOrId){const n=typeof nOrId==='string'?npcById(nOrId):nOrId;if(!n)return [];if(!Array.isArray(n.schoolHistory))n.schoolHistory=[];for(let i=n.schoolHistory.length-1;i>=0;i--)if(!n.schoolHistory[i]||typeof n.schoolHistory[i]!=='object')n.schoolHistory.splice(i,1);return n.schoolHistory}
function activeNpcSchoolEnrollment4A3(nOrId){return npcSchoolHistory4A3(nOrId).find(x=>!x.endDate)||null}
function legacyNpcSchoolName4A3(n){if(!n)return null;if(typeof n.school==='string')return n.school;if(n.school&&typeof n.school==='object')return n.school.name||null;return n.schoolName||n.currentSchoolName||null}
function npcSchoolSeed4A3(n,stage){return hashOf(`${n?.householdId||n?.id||'npc'}|${stage}|school`)}
function chooseNpcSchoolId4A3(n,stage,{preferPlayer=false}={}){
 const st=canonicalSchoolStage4A1(stage),pid=typeof playerCurrentSchoolId4A2==='function'?playerCurrentSchoolId4A2():null,ps=pid&&schoolById(pid);
 if(preferPlayer&&pid&&ps&&canonicalSchoolStage4A1(ps.educationLevel)===st)return pid;
 const ids=schoolIdsForStage(st);return ids.length?ids[npcSchoolSeed4A3(n,st)%ids.length]:null
}
function resolveNpcSchoolId4A3(n,stageHint=null){
 if(!n)return null;const st=canonicalSchoolStage4A1(stageHint||npcSchoolStage4A3(n));
 if(n.currentSchoolId&&schoolById(n.currentSchoolId)&&canonicalSchoolStage4A1(schoolStage(n.currentSchoolId))===st)return n.currentSchoolId;
 if(n.schoolId&&schoolById(n.schoolId)&&canonicalSchoolStage4A1(schoolStage(n.schoolId))===st)return n.schoolId;
 const legacy=legacyNpcSchoolName4A3(n);if(legacy){const known=schoolIdFromLegacyName(legacy);if(known&&canonicalSchoolStage4A1(schoolStage(known))===st)return known;return ensureLegacySchoolEntity4A2(legacy,st)}
 return chooseNpcSchoolId4A3(n,st)
}
function closeNpcSchoolEnrollment4A3(n,reason='School changed',dateISO=currentDate()){
 const x=activeNpcSchoolEnrollment4A3(n);if(!x)return null;x.endDate=x.endDate||dateISO;x.endYear=x.endYear||yearOf4A2(x.endDate);x.reason=x.reason||reason;return x
}
function ensureNpcSchoolEnrollment4A3(n,{reason='Enrolled'}={}){
 if(!n||!n.currentSchoolId)return null;const h=npcSchoolHistory4A3(n),st=n.schoolStage||npcSchoolStage4A3(n);let cur=activeNpcSchoolEnrollment4A3(n);
 if(cur&&(cur.schoolId!==n.currentSchoolId||canonicalSchoolStage4A1(cur.stage)!==canonicalSchoolStage4A1(st))){closeNpcSchoolEnrollment4A3(n,reason==='Enrolled'?'School/stage transition':reason);cur=null}
 if(!cur){cur={schoolId:n.currentSchoolId,stage:st,startDate:currentDate(),startYear:yearOf4A2(currentDate()),endDate:null,endYear:null,gradesAttended:[],reasonStarted:reason};h.push(cur)}
 cur.gradesAttended=Array.isArray(cur.gradesAttended)?cur.gradesAttended:[];if(n.schoolGrade&&!cur.gradesAttended.includes(n.schoolGrade))cur.gradesAttended.push(n.schoolGrade);return cur
}
function setNpcSchoolIdentity4A3(n,schoolId,{grade=null,className=null,reason='Assigned school',replaceBaseline=false}={}){
 if(!n)return null;const ent=schoolById(schoolId);if(!ent)return null;const st=canonicalSchoolStage4A1(ent.educationLevel),old=n.currentSchoolId||null,active=activeNpcSchoolEnrollment4A3(n);
 if(old&&old!==schoolId){
  if(replaceBaseline&&active&&npcSchoolHistory4A3(n).length===1&&!active.endDate){active.schoolId=schoolId;active.stage=st;active.reasonStarted=reason}
  else closeNpcSchoolEnrollment4A3(n,reason)
 }
 const baseGrade=npcGradeNumber4A3(n),explicitGrade=gradeNumberFromLabel4A3(grade);if(explicitGrade!=null&&baseGrade>0)n.schoolGradeOffset=explicitGrade-baseGrade;else if(n.schoolGradeOffset==null)n.schoolGradeOffset=0;
 n.currentSchoolId=schoolId;n.schoolStage=st;n.schoolGrade=grade||npcGradeLabel4A3(n);n.schoolClass=className||npcSchoolClassDefault4A3(n,npcEffectiveGradeNumber4A3(n));n.schoolSchemaVersion=NPC_SCHOOL_SCHEMA_4A3;
 const cur=ensureNpcSchoolEnrollment4A3(n,{reason});if(cur){cur.stage=st;if(n.schoolGrade&&!cur.gradesAttended.includes(n.schoolGrade))cur.gradesAttended.push(n.schoolGrade)}return n
}
function syncNpcSchool4A3(n,{reason='Reconciled NPC school'}={}){
 if(!n)return null;n.schoolHistory=npcSchoolHistory4A3(n);
 if(!npcSchoolAge4A3(n)){
  if(n.currentSchoolId)closeNpcSchoolEnrollment4A3(n,npcAge(n)>17?'Completed school-age education':'No current school');n.currentSchoolId=null;n.schoolStage=null;n.schoolGrade=null;n.schoolClass=null;n.schoolSchemaVersion=NPC_SCHOOL_SCHEMA_4A3;return n
 }
 const st=npcSchoolStage4A3(n),current=n.currentSchoolId&&schoolById(n.currentSchoolId)?schoolById(n.currentSchoolId):null;
 let id=current&&canonicalSchoolStage4A1(current.educationLevel)===st?n.currentSchoolId:(current?chooseNpcSchoolId4A3(n,st):resolveNpcSchoolId4A3(n,st));
 if(!id||canonicalSchoolStage4A1(schoolStage(id))!==st)id=chooseNpcSchoolId4A3(n,st);
 if(!id)return n;
 const stageChanged=!!(current&&canonicalSchoolStage4A1(current.educationLevel)!==st);if(stageChanged)closeNpcSchoolEnrollment4A3(n,'Education stage transition');
 const priorGradeNum=gradeNumberFromLabel4A3(n.schoolGrade);n.currentSchoolId=id;n.schoolStage=st;n.schoolGrade=npcGradeLabel4A3(n);const nowGradeNum=npcEffectiveGradeNumber4A3(n);
 if(!n.schoolClass||stageChanged||priorGradeNum!==nowGradeNum||!/^(?:\d+-[A-D]|Sun|Moon|Rainbow|Bears)$/.test(n.schoolClass))n.schoolClass=npcSchoolClassDefault4A3(n,nowGradeNum);
 n.schoolSchemaVersion=NPC_SCHOOL_SCHEMA_4A3;ensureNpcSchoolEnrollment4A3(n,{reason:stageChanged?'Education stage transition':reason});return n
}
function initializeNpcSchool4A3(n,ctx={}){if(!n)return n;syncNpcSchool4A3(n,{reason:ctx.reason||'NPC created'});if(ctx.schoolId)setNpcSchoolIdentity4A3(n,ctx.schoolId,{grade:ctx.grade,className:ctx.className,reason:ctx.reason||'NPC created',replaceBaseline:true});return n}
function npcKnownToPlayer4A3(n){return !!(n&&(S.people||[]).some(p=>p.npcId===n.id))}
function ensureNpcSchoolForRole4A3(n,roleLabel){
 if(!n||!npcSchoolAge4A3(n))return n;syncNpcSchool4A3(n);const role=String(roleLabel||'').toLowerCase(),pid=playerCurrentSchoolId4A2(),ps=pid&&schoolById(pid),st=npcSchoolStage4A3(n);
 if(!pid||!ps||canonicalSchoolStage4A1(ps.educationLevel)!==st)return n;
 if(role==='classmate'||/\bclassmate\b/.test(role))return setNpcSchoolIdentity4A3(n,pid,{grade:S.school?.grade||npcGradeLabel4A3(n),className:S.school?.className||npcSchoolClassDefault4A3(n),reason:'Introduced as classmate',replaceBaseline:!npcKnownToPlayer4A3(n)});
 if(/school friend|same school/.test(role)){
  let cls=npcSchoolClassDefault4A3(n,npcEffectiveGradeNumber4A3(n));if(S.school?.grade===npcGradeLabel4A3(n)&&cls===S.school?.className){const g=npcGradeNumber4A3(n);cls=`${g}-${String.fromCharCode(65+((S.school.className.charCodeAt(S.school.className.length-1)-65+1)%4))}`}
  return setNpcSchoolIdentity4A3(n,pid,{grade:npcGradeLabel4A3(n),className:cls,reason:'Introduced as school friend',replaceBaseline:!npcKnownToPlayer4A3(n)})
 }
 return n
}
function migrateNpcSchools4A3(){
 migratePlayerSchool4A2();S.npcs=Array.isArray(S.npcs)?S.npcs:[];for(const n of S.npcs){
  n.schoolHistory=npcSchoolHistory4A3(n).map(x=>{const y={...x};if(!y.schoolId&&y.school)y.schoolId=schoolIdFromLegacyName(y.school)||ensureLegacySchoolEntity4A2(y.school,y.stage);if(y.schoolId&&!schoolById(y.schoolId))y.schoolId=null;y.stage=canonicalSchoolStage4A1(y.stage)||y.stage||null;y.gradesAttended=Array.isArray(y.gradesAttended)?[...new Set(y.gradesAttended.filter(Boolean))]:[];return y});
  syncNpcSchool4A3(n,{reason:'Migrated current NPC enrollment'})
 }
 return {schemaVersion:NPC_SCHOOL_SCHEMA_4A3,count:S.npcs.length,schoolAge:S.npcs.filter(npcSchoolAge4A3).length}
}
function actorSchoolState4A3(ref){
 if(ref==='player'||ref==null)return {kind:'player',id:'player',currentSchoolId:playerCurrentSchoolId4A2(),grade:S.school?.grade||null,className:S.school?.className||null,history:playerSchoolEnrollments4A2()};
 let n=null;if(typeof ref==='object'&&ref){n=ref.npcId?npcById(ref.npcId):(ref.birthYear!=null?ref:null)}else{const p=personById(ref);n=p?.npcId?npcById(p.npcId):npcById(ref)}if(!n)return null;syncNpcSchool4A3(n);return {kind:'npc',id:n.id,currentSchoolId:n.currentSchoolId||null,grade:n.schoolGrade||null,className:n.schoolClass||null,history:npcSchoolHistory4A3(n)}
}
function currentSchoolForPerson4A3(ref){const a=actorSchoolState4A3(ref);return a?.currentSchoolId?schoolById(a.currentSchoolId):null}
function sameSchool4A3(a,b){const x=actorSchoolState4A3(a),y=actorSchoolState4A3(b);return !!(x?.currentSchoolId&&y?.currentSchoolId&&x.currentSchoolId===y.currentSchoolId)}
function sameGrade4A3(a,b){const x=actorSchoolState4A3(a),y=actorSchoolState4A3(b);return !!(sameSchool4A3(a,b)&&x?.grade&&y?.grade&&x.grade===y.grade)}
function sameClass4A3(a,b){const x=actorSchoolState4A3(a),y=actorSchoolState4A3(b);return !!(sameGrade4A3(a,b)&&x?.className&&y?.className&&x.className===y.className)}
function schoolHistoryForPerson4A3(ref){return actorSchoolState4A3(ref)?.history||[]}
function studentsAtSchool4A3(schoolId){const out=(S.npcs||[]).filter(n=>{syncNpcSchool4A3(n);return n.currentSchoolId===schoolId}).map(n=>n.id);if(playerCurrentSchoolId4A2()===schoolId)out.unshift('player');return out}
function npcSchoolSummary4A3(id){const n=npcById(id);if(!n)return null;syncNpcSchool4A3(n);return {id:n.id,currentSchoolId:n.currentSchoolId||null,schoolName:schoolDisplayName(n.currentSchoolId),stage:n.schoolStage||null,grade:n.schoolGrade||null,className:n.schoolClass||null,history:npcSchoolHistory4A3(n)}}
