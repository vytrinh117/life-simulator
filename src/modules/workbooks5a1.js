// =====================================================================
// PHASE 5A.1 — WORKBOOK DATA / STORE / OWNERSHIP FOUNDATION
// Canonical workbook definitions live in the existing D.catalog and
// ownership lives in S.inventoryItems. No duplicate inventory/store.
// =====================================================================
const WORKBOOK_LEVELS_5A1=['I','II','III'];
const WORKBOOK_SUBJECT_CODES_5A1={
 'Mathematics':'math','English / Language':'english','Science':'science','History':'history','Geography':'geography','Art':'art','Music':'music','Physical Education':'pe','Technology':'technology','Elective':'elective'
};
function workbookStageForGrade5A1(grade){grade=Number(grade)||1;return grade<=6?'primary':grade<=9?'middle':'high'}
function workbookGradeForAge5A1(age=S?.age??6){return Math.max(1,Math.min(12,Math.round(Number(age)||6)-5))}
function workbookSubjectsForGrade5A1(grade){
 const age=Math.max(6,Math.min(18,(Number(grade)||1)+5));
 return subjectNames(age).filter(x=>WORKBOOK_SUBJECT_CODES_5A1[x])
}
function workbookSubjectCode5A1(subject){return WORKBOOK_SUBJECT_CODES_5A1[subject]||String(subject||'subject').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'')}
function workbookKey5A1(subject,grade,level=1){
 const li=typeof level==='string'?Math.max(1,WORKBOOK_LEVELS_5A1.indexOf(level)+1):Math.max(1,Math.min(3,Number(level)||1));
 return `wb_g${String(Math.max(1,Math.min(12,Number(grade)||1))).padStart(2,'0')}_${workbookSubjectCode5A1(subject)}_l${li}`
}
function workbookPrice5A1(grade,level){return Math.round(9+Math.max(1,Math.min(12,Number(grade)||1))*.7+(Math.max(1,Math.min(3,Number(level)||1))-1)*4)}
function workbookDefinition5A1(key){const d=D.catalog[key];return d?.workbook5A?d:null}
function workbookDefinitions5A1(){return Object.entries(D.catalog).filter(([,d])=>d?.workbook5A).map(([itemId,d])=>Object.assign({itemId},d))}
function registerWorkbookCatalog5A1(){
 for(let grade=1;grade<=12;grade++)for(const subject of workbookSubjectsForGrade5A1(grade))for(let level=1;level<=3;level++){
  const itemId=workbookKey5A1(subject,grade,level),roman=WORKBOOK_LEVELS_5A1[level-1],prereq=level>1?workbookKey5A1(subject,grade,level-1):null;
  const existing=D.catalog[itemId]||{};
  D.catalog[itemId]=Object.assign(existing,{
   name:`${subject} — Grade ${grade} — Level ${roman}`,
   icon:'📘',price:workbookPrice5A1(grade,level),category:'School supplies',minAge:6,permissionPrice:30,
   lifecycleType:'durable',condition:100,repairable:false,agingPerYear:.4,
   workbook5A:true,workbookItemId:itemId,subject,grade,educationStage:workbookStageForGrade5A1(grade),workbookLevel:roman,workbookLevelIndex:level,prerequisiteItemId:prereq,
   description:`Reusable ${subject} practice workbook for Grade ${grade}, Level ${roman}. Advanced Exercise access depends on owning the correct workbook.`,
   effectLabels:['Advanced study',subject]
  })
 }
 // Keep old saves intact, but stop selling the old generic all-subject workbook.
 if(D.catalog.workbook){D.catalog.workbook.shopHidden=true;D.catalog.workbook.legacyWorkbook5A1=true;D.catalog.workbook.description='Legacy general workbook kept for older saves. It no longer unlocks subject-specific Advanced Exercise.'}
 return workbookDefinitions5A1().length
}
function applyWorkbookMetadata5A1(it,d=catalogItem(it?.key)){
 if(!it||!d?.workbook5A)return it;
 it.workbook5A=true;it.workbookItemId=d.workbookItemId||it.key;it.subject=d.subject;it.grade=d.grade;it.educationStage=d.educationStage;it.workbookLevel=d.workbookLevel;it.workbookLevelIndex=d.workbookLevelIndex;it.prerequisiteItemId=d.prerequisiteItemId||null;
 if(typeof applyWorkbookLearningMirror5A2==='function')applyWorkbookLearningMirror5A2(it);
 return it
}
function workbookOwned5A1(key){return !!S?.inventoryItems?.some(i=>i.key===key)}
function ownedWorkbooks5A1(subject=null,grade=null){return (S?.inventoryItems||[]).filter(i=>{const d=workbookDefinition5A1(i.key);return !!d&&(!subject||d.subject===subject)&&(grade==null||Number(d.grade)===Number(grade))})}
function currentWorkbookGrade5A1(){return S?.school&&S.school.grade!=='Kindergarten'?workbookGradeForAge5A1(S.age):null}
function workbookShopVisible5A1(d){
 if(!d?.workbook5A)return true;const g=currentWorkbookGrade5A1();return g!=null&&Number(d.grade)===Number(g)
}
function workbookStudyCandidate5A1(subject,grade=currentWorkbookGrade5A1()){
 if(typeof workbookStudyCandidate5A2==='function')return workbookStudyCandidate5A2(subject,grade);
 if(!subject||grade==null)return null;
 const key=workbookKey5A1(subject,grade,1),it=(S.inventoryItems||[]).find(x=>x.key===key&&!x.stored);
 return it?applyWorkbookMetadata5A1(it):null
}
function advancedExerciseWorkbook5A1(subject){return workbookStudyCandidate5A1(subject,currentWorkbookGrade5A1())}
function workbookOwnershipReason5A1(subject){if(typeof workbookStudyReason5A2==='function')return workbookStudyReason5A2(subject,currentWorkbookGrade5A1());const g=currentWorkbookGrade5A1();if(g==null)return 'Advanced Exercise requires a current school-grade workbook.';return `Own ${subject} — Grade ${g} — Level I to use Advanced Exercise.`}
function migrateWorkbooks5A1(){
 registerWorkbookCatalog5A1();
 S.workbookFoundation5A1=Object.assign({schemaVersion:1,migratedAt:null},S.workbookFoundation5A1||{});S.workbookFoundation5A1.schemaVersion=1;
 for(const it of S.inventoryItems||[]){
  if(it.key==='workbook'){it.legacyWorkbook5A1=true;continue}
  let d=workbookDefinition5A1(it.key);
  if(!d&&it.name){const pair=Object.entries(D.catalog).find(([,x])=>x?.workbook5A&&x.name===it.name);if(pair){it.key=pair[0];d=pair[1]}}
  if(d)applyWorkbookMetadata5A1(it,d)
 }
 // Durable canonical workbooks are unique by item ID. Collapse accidental duplicate
 // physical copies deterministically without touching any future learning-history state.
 const seen=new Set();S.inventoryItems=S.inventoryItems.filter(it=>{if(!workbookDefinition5A1(it.key))return true;if(seen.has(it.key))return false;seen.add(it.key);return true});
 syncLegacyInventory();return true
}
function workbookShopHtml5A1(){const prev=shopCat;shopCat='School supplies';const html=storeHtml();shopCat=prev;return html}
function legacyWorkbookInfo5A1(){const d=D.catalog.workbook||{};return {shopHidden:!!d.shopHidden,legacyWorkbook5A1:!!d.legacyWorkbook5A1,description:d.description||''}}
