// =====================================================================
// PHASE 5A.4 — SCHOOL / EXAM / COMPETITION / UI INTEGRATION
// Workbook ownership/progression/session state remains canonical in 5A.1–5A.3.
// This layer only consumes real learned progress for modest academic hooks,
// teacher/parent support, evidence, and a compact Advanced Study UI.
// =====================================================================
const WORKBOOK_INTEGRATION_SCHEMA_5A4=4;
const WORKBOOK_TALENT_BY_SUBJECT_5A4={
 'Mathematics':'Math','Science':'Science','English / Language':'Languages','Technology':'Programming','Art':'Art','Music':'Music','Physical Education':'Sports'
};
function ensureWorkbookIntegration5A4(){
 S.workbookIntegration5A4=Object.assign({schemaVersion:WORKBOOK_INTEGRATION_SCHEMA_5A4,recommendations:{},subjectStudy:{},selectedSubject:null},S.workbookIntegration5A4||{});
 const st=S.workbookIntegration5A4;st.schemaVersion=WORKBOOK_INTEGRATION_SCHEMA_5A4;
 if(!st.recommendations||typeof st.recommendations!=='object'||Array.isArray(st.recommendations))st.recommendations={};
 if(!st.subjectStudy||typeof st.subjectStudy!=='object'||Array.isArray(st.subjectStudy))st.subjectStudy={};
 return st
}
function workbookSubjectLearning5A4(subject,grade=currentWorkbookGrade5A1()){
 const levels=[];let weighted=0;
 for(let level=1;level<=3;level++){
  const itemId=workbookKey5A1(subject,grade,level),d=workbookDefinition5A1(itemId),r=workbookLearningRecord5A2(itemId,false),progress=r?clamp(Number(r.progress)||0):0,completed=!!r?.completed;
  const weight=[1,.9,.8][level-1];weighted+=progress*weight;levels.push({itemId,level,workbookLevel:d?.workbookLevel||WORKBOOK_LEVELS_5A1[level-1],progress,completed,owned:workbookOwned5A1(itemId),state:workbookDisplayState5A2(itemId)})
 }
 const maxWeighted=100*(1+.9+.8),strength=maxWeighted?clamp(weighted/maxWeighted*100):0;
 return {subject,grade,levels,strength:Math.round(strength*10)/10,hasLearning:levels.some(x=>x.progress>0||x.completed)}
}
function workbookRecentSession5A4(subject,days=21){
 const sessions=ensureWorkbookSessions5A3().sessionsByDate||{};let best=null;
 for(const [dateISO,s] of Object.entries(sessions))if(s?.subject===subject&&dateISO<=currentDate()&&daysBetween(dateISO,currentDate())<=days&&daysBetween(dateISO,currentDate())>=0){if(!best||dateISO>best.dateISO)best=s}
 return best
}
function workbookExamSupport5A4(subject){
 const g=currentWorkbookGrade5A1();if(!subject||g==null)return {bonus:0,strength:0,subject,grade:g,reason:'No current workbook context.'};
 const l=workbookSubjectLearning5A4(subject,g);if(!l.hasLearning)return {bonus:0,strength:l.strength,subject,grade:g,reason:'No studied workbook progress.'};
 const p=l.levels.map(x=>x.progress),recent=workbookRecentSession5A4(subject,14),bonus=clamp(p[0]*.018+p[1]*.012+p[2]*.010+(recent?.gain||0)*.05,0,4);
 return {bonus:Math.round(bonus*10)/10,strength:l.strength,subject,grade:g,recentDate:recent?.dateISO||null,reason:'Studied workbook progress supports exam readiness modestly.'}
}
function workbookCompetitionSupport5A4(idOrEvent){
 const c=typeof idOrEvent==='object'?idOrEvent:schoolEventById4D1?.(idOrEvent);if(!c||c.category!=='academic_competition')return {bonus:0,subject:null,reason:'Not an academic competition.'};
 const sub=typeof eventPrimarySubject4D3==='function'?eventPrimarySubject4D3(c):null,subject=sub?.name||null;if(!subject)return {bonus:0,subject:null,reason:'No matching school subject.'};
 const exam=workbookExamSupport5A4(subject),recent=workbookRecentSession5A4(subject,14),bonus=clamp(exam.bonus*.65+(recent?.gain||0)*.08,0,3);
 return {bonus:Math.round(bonus*10)/10,subject,progressStrength:exam.strength,recentDate:recent?.dateISO||null,reason:'Relevant workbook study supports this academic competition without changing contest-prep sessions.'}
}
function recordWorkbookStudyIntegration5A4(session){
 if(!session?.itemId||!session.subject)return null;const st=ensureWorkbookIntegration5A4(),r=st.subjectStudy[session.subject]||{sessions:0,totalProgress:0,days:[],lastDate:null};
 r.sessions=Math.max(0,Number(r.sessions)||0)+1;r.totalProgress=Math.round(((Number(r.totalProgress)||0)+(Number(session.gain)||0))*10)/10;r.lastDate=session.dateISO||currentDate();r.days=Array.isArray(r.days)?r.days:[];if(!r.days.includes(r.lastDate))r.days.push(r.lastDate);if(r.days.length>120)r.days=r.days.slice(-120);st.subjectStudy[session.subject]=r;
 const eventId=`wb-study-${session.dateISO||currentDate()}-${session.itemId}`,quality=clamp(.65+(Number(session.gain)||0)/5*.55,.65,1.2);
 if(typeof recordTraitEvidence==='function'){recordTraitEvidence('Responsible',{source:'voluntary advanced workbook study',system:'workbook',eventId,context:session.subject,quality});recordTraitEvidence('Curious',{source:'voluntary advanced workbook study',system:'workbook',eventId:eventId+'-curious',context:session.subject,quality:Math.max(.55,quality*.85)})}
 const talent=WORKBOOK_TALENT_BY_SUBJECT_5A4[session.subject];if(talent&&typeof recordTalentEvidence==='function')recordTalentEvidence(talent,{source:'advanced workbook study',system:'workbook',eventId:eventId+'-talent',context:session.subject,quality:Math.max(.55,quality*.9)});
 return JSON.parse(JSON.stringify(r))
}
function workbookTeacherRecommendationCandidate5A4(subject){
 const g=currentWorkbookGrade5A1(),sub=S.school?.subjects?.find(x=>x.name===subject);if(g==null||!sub)return null;
 let level=1;
 if(workbookCompleted5A2(workbookKey5A1(subject,g,2)))level=3;
 else if(workbookCompleted5A2(workbookKey5A1(subject,g,1)))level=2;
 else if(workbookProgress5A2(workbookKey5A1(subject,g,1))>=60)level=2;
 const itemId=workbookKey5A1(subject,g,level),d=workbookDefinition5A1(itemId);if(!d||workbookOwned5A1(itemId))return null;
 const t=ensureTeacher(sub),performance=Number(sub.score||0)*.55+Number(sub.skill||0)*.25+Number(t.rel||50)*.20;
 if(level===1&&performance<58)return null;if(level>1&&performance<65)return null;
 return {itemId,subject,grade:g,level:d.workbookLevel,teacher:t.name,performance:Math.round(performance),reason:level===1?`${t.name} thinks a structured ${subject} workbook could help you stretch beyond classwork.`:`${t.name} thinks you are ready to plan ahead for ${d.name}.`}
}
function workbookTeacherRecommendationGate5A4(subject){
 const candidate=workbookTeacherRecommendationCandidate5A4(subject);if(!candidate)return {ok:false,reason:'No new workbook recommendation is appropriate right now.'};
 if(typeof teacherAvailability4C2==='function'){const a=teacherAvailability4C2(subject);if(!a.ok)return {ok:false,reason:a.reason,candidate}}
 return {ok:true,candidate}
}
function requestWorkbookTeacherRecommendation5A4(subject){
 const gate=workbookTeacherRecommendationGate5A4(subject);if(!gate.ok){toast(gate.reason);return Object.assign({ok:false},gate)};
 const c=gate.candidate,st=ensureWorkbookIntegration5A4();st.recommendations[subject]={subject,itemId:c.itemId,grade:c.grade,level:c.level,teacher:c.teacher,dateISO:currentDate(),reason:c.reason};
 log(`${c.teacher} recommends a workbook`,`${workbookDefinition5A1(c.itemId).name}. ${c.reason} This is only a recommendation — you still need to obtain the book normally.`);return {ok:true,recommendation:JSON.parse(JSON.stringify(st.recommendations[subject]))}
}
function workbookRecommendation5A4(subject){const r=ensureWorkbookIntegration5A4().recommendations?.[subject];return r&&workbookDefinition5A1(r.itemId)?r:null}
function requestWorkbookSupport5A4(itemId){
 const d=workbookDefinition5A1(itemId);if(!d)return {ok:false,reason:'Unknown workbook.'};if(workbookOwned5A1(itemId))return {ok:false,reason:'You already own this workbook.'};if(S.age>=18)return {ok:false,reason:'As an adult, purchase the workbook directly.'};
 const before=(S.inventoryItems||[]).length,authority=typeof decisionAuthorityPerson==='function'?decisionAuthorityPerson():null;if(!authority)return {ok:false,reason:'No parent or guardian authority is available.'};
 caregiverRequestOptions(itemId);return {ok:true,itemId,decisionMakerId:authority.id,ownedNow:(S.inventoryItems||[]).length>before&&workbookOwned5A1(itemId),authorityRole:authority.relation||authority.role||'guardian'}
}
function advancedStudySelectedSubject5A4(){
 const st=ensureWorkbookIntegration5A4(),subjects=(S.school?.subjects||[]).map(x=>x.name).filter(x=>WORKBOOK_SUBJECT_CODES_5A1[x]);if(!subjects.length)return null;
 if(!subjects.includes(st.selectedSubject))st.selectedSubject=subjects.find(s=>ownedWorkbooks5A1(s,currentWorkbookGrade5A1()).length)||subjects[0];return st.selectedSubject
}
function workbookLevelRowsHtml5A4(subject){
 const g=currentWorkbookGrade5A1();if(g==null)return '';return [1,2,3].map(level=>{const itemId=workbookKey5A1(subject,g,level),d=workbookDefinition5A1(itemId),state=workbookDisplayState5A2(itemId),owned=workbookOwned5A1(itemId);return `<div class="row"><span><b>Level ${esc(d?.workbookLevel||WORKBOOK_LEVELS_5A1[level-1])}</b><br><small>${owned?'Owned':'Not owned'} • ${esc(state.label)}</small></span>${state.progress!=null&&state.status!=='not_owned'?`<span>${Math.round(state.progress)}%</span>`:''}</div>`}).join('')
}
function advancedStudyPanel5A4(explicitSubject=null){
 if(!S.school||!needsFormalSchool())return '<p class="muted-text">Advanced Study becomes available with formal school subjects and owned workbooks.</p>';
 const subjects=(S.school.subjects||[]).map(x=>x.name).filter(x=>WORKBOOK_SUBJECT_CODES_5A1[x]),selected=explicitSubject?(subjects.includes(explicitSubject)?explicitSubject:null):advancedStudySelectedSubject5A4();if(!selected)return '<p class="muted-text">No workbook-supported subjects are available for this grade.</p>';
 const grade=currentWorkbookGrade5A1(),candidate=workbookStudyCandidate5A2(selected,grade),gate=advancedStudySessionGate5A3(selected),recommend=workbookRecommendation5A4(selected),possible=workbookTeacherRecommendationCandidate5A4(selected),study=ensureWorkbookIntegration5A4().subjectStudy?.[selected],breakNote=typeof isSchoolBreak==='function'&&isSchoolBreak()?'<small class="muted-text">School break • workbook study is optional self-study, not mandatory homework.</small>':'';
 const focus=candidate?workbookDefinition5A1(candidate.key):null,status=gate.ok?`Available today • ${gate.minutes} min`:gate.reason;
 const recItem=recommend?.itemId?workbookDefinition5A1(recommend.itemId):null;
 return `<div class="advanced-study-5a4"><div class="section-heading"><div>${explicitSubject?`<b>${esc(selected)} · Extra Credit</b>`:`<label><b>Subject</b> <select data-advanced-study-subject5a4="1">${subjects.map(s=>`<option value="${esc(s)}" ${s===selected?'selected':''}>${esc(s)}</option>`).join('')}</select></label>`}<p class="muted-text">Grade ${grade} • one progression session per game day.</p></div><span class="tag">${esc(status)}</span></div>${breakNote}<div class="workbook-focus">${focus?`<b>${esc(focus.name)}</b><small>Progress ${Math.round(workbookProgress5A2(focus.workbookItemId)*10)/10}% • Level difficulty ×${workbookLevelDifficulty5A2(focus.workbookItemId).toFixed(2)}</small><div class="progress"><i style="width:${clamp(workbookProgress5A2(focus.workbookItemId))}%"></i></div><div class="inline-actions"><button class="small primary" data-workbook-study5a4="${esc(selected)}" ${gate.ok?'':'disabled'}>Study</button></div>`:`<b>No usable owned workbook for ${esc(selected)}</b><small>${esc(workbookStudyReason5A2(selected,grade))}</small><div class="inline-actions"><button class="small ghost" data-tab-jump="business">Open Shop</button></div>`}</div><div class="mini-meta">${study?`<span>Voluntary study: ${study.sessions} session${study.sessions===1?'':'s'} across ${study.days?.length||0} day${study.days?.length===1?'':'s'}</span>`:''}${workbookExamSupport5A4(selected).bonus>0?`<span>Exam readiness support: +${workbookExamSupport5A4(selected).bonus.toFixed(1)} max points</span>`:''}</div><div class="workbook-levels-5a4">${workbookLevelRowsHtml5A4(selected)}</div>${recItem?`<div class="stage-note"><b>Teacher recommendation • ${esc(recommend.teacher)}</b><small>${esc(recItem.name)} • ${esc(recommend.reason||'')}</small><div class="inline-actions">${!workbookOwned5A1(recommend.itemId)&&S.age<18?`<button class="small" data-workbook-support5a4="${esc(recommend.itemId)}">Ask caregiver</button>`:''}<button class="small ghost" data-tab-jump="business">View in Shop</button></div></div>`:possible?`<div class="inline-actions"><button class="small ghost" data-workbook-recommend5a4="${esc(selected)}">Ask teacher for workbook recommendation</button></div>`:''}</div>`
}
function handlePanelChange5A4(e){const s=e?.target?.closest?.('[data-advanced-study-subject5a4]');if(!s||!S)return false;ensureWorkbookIntegration5A4().selectedSubject=s.value;save();render();return true}
function workbook5a4Click(b){
 if(b.dataset.workbookStudy5a4){performAdvancedStudy5A3(b.dataset.workbookStudy5a4);save();render();return true}
 if(b.dataset.workbookRecommend5a4){requestWorkbookTeacherRecommendation5A4(b.dataset.workbookRecommend5a4);save();render();return true}
 if(b.dataset.workbookSupport5a4){const r=requestWorkbookSupport5A4(b.dataset.workbookSupport5a4);if(!r.ok)toast(r.reason);save();render();return true}
 return false
}
function migrateWorkbooks5A4(){
 migrateWorkbooks5A3();const st=ensureWorkbookIntegration5A4(),clean={};
 for(const [subject,r] of Object.entries(st.recommendations||{})){if(!WORKBOOK_SUBJECT_CODES_5A1[subject]||!r?.itemId||!workbookDefinition5A1(r.itemId))continue;clean[subject]={subject,itemId:r.itemId,grade:Number(workbookDefinition5A1(r.itemId).grade),level:workbookDefinition5A1(r.itemId).workbookLevel,teacher:String(r.teacher||''),dateISO:/^\d{4}-\d{2}-\d{2}$/.test(r.dateISO||'')?r.dateISO:null,reason:String(r.reason||'')}}st.recommendations=clean;
 const studies={};for(const [subject,r] of Object.entries(st.subjectStudy||{})){if(!WORKBOOK_SUBJECT_CODES_5A1[subject]||!r)continue;const days=[...new Set((Array.isArray(r.days)?r.days:[]).filter(x=>/^\d{4}-\d{2}-\d{2}$/.test(x)))].sort();studies[subject]={sessions:Math.max(0,Number(r.sessions)||0),totalProgress:Math.max(0,Number(r.totalProgress)||0),days,lastDate:/^\d{4}-\d{2}-\d{2}$/.test(r.lastDate||'')?r.lastDate:(days.length?days[days.length-1]:null)}}st.subjectStudy=studies;
 const subjects=(S.school?.subjects||[]).map(x=>x.name).filter(x=>WORKBOOK_SUBJECT_CODES_5A1[x]);if(st.selectedSubject&&!subjects.includes(st.selectedSubject))st.selectedSubject=null;return true
}
