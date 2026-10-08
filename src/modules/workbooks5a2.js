// =====================================================================
// PHASE 5A.2 — LEVEL I / II / III PROGRESSION
// Learning progress belongs to the Player and is keyed by canonical
// workbook itemId. Inventory remains the source of truth for ownership.
// =====================================================================
function ensureWorkbookLearning5A2(){
 S.workbookLearning5A2=Object.assign({schemaVersion:2,records:{},completionHistory:[]},S.workbookLearning5A2||{});
 S.workbookLearning5A2.schemaVersion=2;
 if(!S.workbookLearning5A2.records||typeof S.workbookLearning5A2.records!=='object'||Array.isArray(S.workbookLearning5A2.records))S.workbookLearning5A2.records={};
 if(!Array.isArray(S.workbookLearning5A2.completionHistory))S.workbookLearning5A2.completionHistory=[];
 return S.workbookLearning5A2
}
function workbookLearningRecord5A2(itemId,create=false){
 const d=workbookDefinition5A1(itemId);if(!d)return null;const st=ensureWorkbookLearning5A2();
 let r=st.records[itemId]||null;
 if(!r&&create){r={itemId,subject:d.subject,grade:Number(d.grade),educationStage:d.educationStage,workbookLevel:d.workbookLevel,workbookLevelIndex:Number(d.workbookLevelIndex),progress:0,completed:false,completedDate:null,lastProgressDate:null};st.records[itemId]=r}
 if(r){r.itemId=itemId;r.subject=d.subject;r.grade=Number(d.grade);r.educationStage=d.educationStage;r.workbookLevel=d.workbookLevel;r.workbookLevelIndex=Number(d.workbookLevelIndex);r.progress=clamp(Number(r.progress)||0);r.completed=!!r.completed||r.progress>=100;if(r.completed)r.progress=100;if(r.completedDate==null)r.completedDate=null;if(r.lastProgressDate==null)r.lastProgressDate=null}
 return r
}
function workbookProgress5A2(itemId){const r=workbookLearningRecord5A2(itemId,false);return r?clamp(Number(r.progress)||0):0}
function workbookCompleted5A2(itemId){const r=workbookLearningRecord5A2(itemId,false);return !!r?.completed||workbookProgress5A2(itemId)>=100}
function workbookPrerequisite5A2(itemId){const d=workbookDefinition5A1(itemId);if(!d)return {required:null,complete:false};if(!d.prerequisiteItemId)return {required:null,complete:true};return {required:d.prerequisiteItemId,complete:workbookCompleted5A2(d.prerequisiteItemId)}}
function workbookGradeState5A2(itemId){
 const d=workbookDefinition5A1(itemId),cur=currentWorkbookGrade5A1();if(!d||cur==null)return {kind:'unavailable',currentGrade:cur,workbookGrade:d?.grade??null};
 const g=Number(d.grade);if(g>cur)return {kind:'future',currentGrade:cur,workbookGrade:g};if(g<cur)return {kind:'old',currentGrade:cur,workbookGrade:g};return {kind:'current',currentGrade:cur,workbookGrade:g}
}
function workbookEligibility5A2(itemId){
 const d=workbookDefinition5A1(itemId);if(!d)return {ok:false,status:'invalid',reason:'Unknown workbook.'};
 const owned=workbookOwned5A1(itemId),grade=workbookGradeState5A2(itemId),pr=workbookPrerequisite5A2(itemId),completed=workbookCompleted5A2(itemId),progress=workbookProgress5A2(itemId);
 if(!owned)return {ok:false,status:'not_owned',owned:false,completed,progress,reason:'You do not own this workbook.',gradeState:grade.kind,prerequisiteItemId:d.prerequisiteItemId||null};
 if(completed)return {ok:false,status:'completed',owned:true,completed:true,progress:100,reason:'This workbook level is complete.',reviewOnly:true,gradeState:grade.kind,prerequisiteItemId:d.prerequisiteItemId||null};
 if(grade.kind==='future')return {ok:false,status:'future_grade',owned:true,completed:false,progress,reason:`This Grade ${d.grade} workbook is above your current Grade ${grade.currentGrade} level.`,gradeState:grade.kind,prerequisiteItemId:d.prerequisiteItemId||null};
 if(grade.kind==='old')return {ok:false,status:'outgrown',owned:true,completed:false,progress,reason:`This Grade ${d.grade} workbook is now review material; it no longer grants normal advanced-study progression.`,reviewOnly:true,gradeState:grade.kind,prerequisiteItemId:d.prerequisiteItemId||null};
 if(!pr.complete)return {ok:false,status:'prerequisite_locked',owned:true,completed:false,progress,reason:`Complete ${workbookDefinition5A1(pr.required)?.name||'the previous level'} first.`,gradeState:grade.kind,prerequisiteItemId:pr.required};
 return {ok:true,status:'available',owned:true,completed:false,progress,reason:'Available to study.',gradeState:grade.kind,prerequisiteItemId:d.prerequisiteItemId||null}
}
function workbookLevelDifficulty5A2(itemId){const d=workbookDefinition5A1(itemId);if(!d)return 1;return [1,1.12,1.28][Math.max(1,Math.min(3,Number(d.workbookLevelIndex)||1))-1]}
function workbookDisplayState5A2(itemId){
 const d=workbookDefinition5A1(itemId),e=workbookEligibility5A2(itemId);if(!d)return {label:'Unavailable',status:'invalid',progress:0};
 if(e.status==='completed')return {label:'Completed ✓',status:e.status,progress:100};
 if(e.status==='prerequisite_locked')return {label:`Locked — complete Level ${WORKBOOK_LEVELS_5A1[Math.max(0,(Number(d.workbookLevelIndex)||2)-2)]} first`,status:e.status,progress:e.progress};
 if(e.status==='future_grade')return {label:`Locked — future Grade ${d.grade}`,status:e.status,progress:e.progress};
 if(e.status==='outgrown')return {label:`Review only • ${Math.round(e.progress)}%`,status:e.status,progress:e.progress};
 if(e.status==='not_owned')return {label:'Not owned',status:e.status,progress:e.progress};
 return {label:`${Math.round(e.progress)}%`,status:e.status,progress:e.progress}
}
function workbookCompletionHistory5A2(subject=null,grade=null){
 const h=ensureWorkbookLearning5A2().completionHistory||[];return h.filter(x=>(!subject||x.subject===subject)&&(grade==null||Number(x.grade)===Number(grade)))
}
function recordWorkbookCompletion5A2(itemId,dateISO=currentDate()){
 const d=workbookDefinition5A1(itemId),r=workbookLearningRecord5A2(itemId,true);if(!d||!r)return null;
 r.progress=100;r.completed=true;if(!r.completedDate)r.completedDate=dateISO||null;
 const h=ensureWorkbookLearning5A2().completionHistory;if(!h.some(x=>x.itemId===itemId))h.push({itemId,subject:d.subject,grade:Number(d.grade),workbookLevel:d.workbookLevel,workbookLevelIndex:Number(d.workbookLevelIndex),completedDate:r.completedDate||null});
 for(const it of S.inventoryItems||[])if(it.key===itemId)applyWorkbookLearningMirror5A2(it);
 return r
}
function advanceWorkbookProgress5A2(itemId,amount,opts={}){
 const e=workbookEligibility5A2(itemId);if(!e.ok&&!opts.force)return {ok:false,reason:e.reason,status:e.status,progress:e.progress||0};
 const r=workbookLearningRecord5A2(itemId,true),before=r.progress,delta=Math.max(0,Number(amount)||0);r.progress=clamp(before+delta);r.lastProgressDate=opts.dateISO||currentDate();
 if(r.progress>=100)recordWorkbookCompletion5A2(itemId,opts.dateISO||currentDate());
 for(const it of S.inventoryItems||[])if(it.key===itemId)applyWorkbookLearningMirror5A2(it);
 return {ok:true,itemId,before,after:r.progress,gain:r.progress-before,completed:r.completed}
}
function applyWorkbookLearningMirror5A2(it){
 if(!it||!workbookDefinition5A1(it.key))return it;const r=workbookLearningRecord5A2(it.key,false);it.workbookProgress5A2=r?clamp(Number(r.progress)||0):0;it.workbookCompleted5A2=!!r?.completed;if(r?.completedDate)it.workbookCompletedDate5A2=r.completedDate;else delete it.workbookCompletedDate5A2;return it
}
function workbookStudyCandidate5A2(subject,grade=currentWorkbookGrade5A1()){
 if(!subject||grade==null)return null;
 const defs=[1,2,3].map(l=>workbookDefinition5A1(workbookKey5A1(subject,grade,l))).filter(Boolean);
 for(let i=defs.length-1;i>=0;i--){const d=defs[i],e=workbookEligibility5A2(d.workbookItemId);if(e.ok){const it=(S.inventoryItems||[]).find(x=>x.key===d.workbookItemId&&!x.stored);if(it)return applyWorkbookLearningMirror5A2(applyWorkbookMetadata5A1(it,d))}}
 return null
}
function workbookStudyReason5A2(subject,grade=currentWorkbookGrade5A1()){
 if(!subject||grade==null)return 'Advanced Exercise requires a current school-grade workbook.';
 for(let level=1;level<=3;level++){
  const key=workbookKey5A1(subject,grade,level),d=workbookDefinition5A1(key),owned=workbookOwned5A1(key),done=workbookCompleted5A2(key);
  if(!owned){if(level===1||workbookCompleted5A2(workbookKey5A1(subject,grade,level-1)))return `Own ${d?.name||`${subject} — Grade ${grade} — Level ${WORKBOOK_LEVELS_5A1[level-1]}`} to continue Advanced Exercise.`}
  else if(!done){const e=workbookEligibility5A2(key);return e.reason}
 }
 return `All ${subject} workbook levels for Grade ${grade} are complete.`
}
function migrateWorkbooks5A2(){
 registerWorkbookCatalog5A1();const st=ensureWorkbookLearning5A2();
 // Normalize any existing records first. Unknown records are preserved only if their
 // canonical definition still exists; this prevents old unrelated progress blobs from
 // becoming workbook history.
 for(const key of Object.keys(st.records)){if(!workbookDefinition5A1(key)){delete st.records[key];continue}workbookLearningRecord5A2(key,false)}
 for(const it of S.inventoryItems||[]){
  const d=workbookDefinition5A1(it.key);if(!d)continue;applyWorkbookMetadata5A1(it,d);
  let r=st.records[it.key]||null;
  const explicitProgress=Number.isFinite(Number(it.workbookProgress5A2))?Number(it.workbookProgress5A2):Number.isFinite(Number(it.workbookProgress))?Number(it.workbookProgress):null;
  const explicitCompleted=it.workbookCompleted5A2===true||it.workbookCompleted===true;
  if(!r&&(explicitProgress!=null||explicitCompleted))r=workbookLearningRecord5A2(it.key,true);
  if(r&&explicitProgress!=null)r.progress=Math.max(Number(r.progress)||0,clamp(explicitProgress));
  if(r&&(explicitCompleted||r.progress>=100)){r.progress=100;r.completed=true;if(!r.completedDate)r.completedDate=it.workbookCompletedDate5A2||it.workbookCompletedDate||null}
  applyWorkbookLearningMirror5A2(it)
 }
 // Reconcile completion history deterministically without inventing dates/results.
 const dedup=[];for(const x of st.completionHistory||[]){if(!x?.itemId||!workbookDefinition5A1(x.itemId)||dedup.some(y=>y.itemId===x.itemId))continue;const d=workbookDefinition5A1(x.itemId),r=workbookLearningRecord5A2(x.itemId,true);r.progress=100;r.completed=true;if(!r.completedDate&&x.completedDate)r.completedDate=x.completedDate;dedup.push({itemId:x.itemId,subject:d.subject,grade:Number(d.grade),workbookLevel:d.workbookLevel,workbookLevelIndex:Number(d.workbookLevelIndex),completedDate:r.completedDate||x.completedDate||null})}
 for(const [key,r0] of Object.entries(st.records)){const r=workbookLearningRecord5A2(key,false);if(r?.completed&&!dedup.some(x=>x.itemId===key)){const d=workbookDefinition5A1(key);dedup.push({itemId:key,subject:d.subject,grade:Number(d.grade),workbookLevel:d.workbookLevel,workbookLevelIndex:Number(d.workbookLevelIndex),completedDate:r.completedDate||null})}}
 dedup.sort((a,b)=>a.itemId.localeCompare(b.itemId));st.completionHistory=dedup;
 for(const it of S.inventoryItems||[])if(workbookDefinition5A1(it.key))applyWorkbookLearningMirror5A2(it);
 return true
}
