// PHASE 6A.2 — school-approved Prom committee and preparation, scoped to canonical Prom.
// Organizer membership is a real 4B.1 school-organization membership, not a new council.
const PROM_COMMITTEE_SCHEMA_6A2=1;
const PROM_COMMITTEE_ROLES_6A2={decor:'Decorations',music:'Music & programme',logistics:'Venue logistics',publicity:'Publicity'};
const PROM_COMMITTEE_THEMES_6A2={starlight:'Starlight',garden:'Garden Evening',classic:'Classic Formal'};
const PROM_COMMITTEE_DECOR_6A2={simple:{label:'Reuse school decorations',cost:15},lights:{label:'Warm lights and fabric',cost:70},flowers:{label:'Paper flowers and backdrop',cost:45}};
const PROM_COMMITTEE_TASKS_6A2={posters:{label:'Prepare school-approved posters',cost:15,role:'publicity'},playlist:{label:'Review music requests',cost:0,role:'music'},floorplan:{label:'Check seating and safe exits',cost:0,role:'logistics'},decorations:{label:'Set up approved decorations',cost:20,role:'decor'}};
function promCommitteeDates6A2(pr){return {applicationDeadline:addDays(pr.dateISO,-18),decisionDate:addDays(pr.dateISO,-17),preparationDeadline:addDays(pr.dateISO,-2)}}
function promCommitteeIdentity6A2(pr){return pr?.foundation6A1?.eventId||null}
function promCommitteeOrganization6A2(pr){const sid=pr?.foundation6A1?.schoolId;return sid?ensureOrganization4B1({schoolId:sid,name:'Prom Planning Committee',type:'school_committee',memberIds:[],roles:[]}):null}
function ensurePromCommittee6A2(pr=S.school?.prom){
 const id=promCommitteeIdentity6A2(pr);if(!id||['Done','Skipped'].includes(pr.status))return null;
 let c=pr.committee6A2;
 if(!c||c.eventId!==id){c={schemaVersion:PROM_COMMITTEE_SCHEMA_6A2,eventId:id,schoolId:pr.foundation6A1.schoolId,status:'not_applied',applicationDate:null,rolePreference:null,assignedRole:null,decisionDateActual:null,noticeSent:false,decisionNoticeSent:false,decisionLocked:false,work:[],theme:null,decor:null,budgetAllocated:100,budgetSpent:0};pr.committee6A2=c}
 const dates=promCommitteeDates6A2(pr);
 Object.assign(c,{schemaVersion:PROM_COMMITTEE_SCHEMA_6A2,applicationDeadline:dates.applicationDeadline,decisionDate:dates.decisionDate,preparationDeadline:dates.preparationDeadline});
 c.work=Array.isArray(c.work)?c.work:[];c.budgetAllocated=100;
 c.budgetSpent=c.work.reduce((sum,w)=>sum+(PROM_COMMITTEE_TASKS_6A2[w.key]?.cost||0),0)+(PROM_COMMITTEE_DECOR_6A2[c.decor]?.cost||0);
 return c;
}
function promCommitteeRoleContext6A2(){
 const existing=typeof promOrganizationEligibility4B4==='function'?promOrganizationEligibility4B4():{ok:false};
 // The 4B.4 check has no 6A.2 approval shortcut until there is a committee appointment.
 const roles=typeof currentSchoolRoles4B4==='function'?currentSchoolRoles4B4('player'):[];
 const priority=roles.some(x=>{const o=schoolOrganizationById4B1(x.organizationId);return o?.type==='student_council'||/event committee/i.test(o?.name||'')});
 return {priority,source:priority?'school_leadership':existing.source||null};
}
function promCommitteeApplicationOpen6A2(pr){const c=ensurePromCommittee6A2(pr);return !!c&&c.status==='not_applied'&&currentDate()>=pr.foundation6A1.announceDate&&currentDate()<=c.applicationDeadline&&currentDate()<pr.dateISO}
function promCommitteeScore6A2(priority){
 const r=typeof ensureRep==='function'?ensureRep():{},behavior=Number(S.school?.behavior??70),attendance=Number(S.school?.attendance??96),teacher=teacherOpinion4B4();
 return Math.round(behavior*.27+attendance*.18+teacher*.22+Math.min(100,Number(r.leadership||0))*.13+Math.min(100,Number(r.kindness||0))*.10+Math.min(100,Number(r.social||0))*.10+(priority?22:0)-Math.min(30,Number(r.troublemaker||0)*.2));
}
function applyPromCommittee6A2(role){
 const pr=ensureProm6A1(),c=pr&&ensurePromCommittee6A2(pr);
 if(!c)return {ok:false,reason:'no_eligible_prom'};
 if(!PROM_COMMITTEE_ROLES_6A2[role])return {ok:false,reason:'invalid_role'};
 if(!promCommitteeApplicationOpen6A2(pr))return {ok:false,reason:'application_closed_or_already_applied'};
 const ctx=promCommitteeRoleContext6A2();c.status='applied';c.applicationDate=currentDate();c.rolePreference=role;c.applicationScore=promCommitteeScore6A2(ctx.priority);c.leadershipPriority=ctx.priority;c.leadershipSource=ctx.source;
 resolveNotificationsFor(`${c.eventId}:committee_signup`);
 if(!SIM.skipping)log('Prom planning application',`You apply for the ${PROM_COMMITTEE_ROLES_6A2[role]} team. The faculty adviser will decide on ${formatDate(c.decisionDate)}.`);
 return {ok:true,status:c.status,decisionDate:c.decisionDate};
}
function declinePromCommittee6A2(){
 const pr=ensureProm6A1(),c=pr&&ensurePromCommittee6A2(pr);
 if(!c||!promCommitteeApplicationOpen6A2(pr))return {ok:false,reason:'application_unavailable'};
 c.status='declined';c.applicationDate=currentDate();resolveNotificationsFor(`${c.eventId}:committee_signup`);
 return {ok:true,status:c.status};
}
function promCommitteeApproved6A2(pr=S.school?.prom){const c=pr?.committee6A2,f=pr?.foundation6A1;return !!c&&!!f&&c.eventId===f.eventId&&c.schoolId===playerCurrentSchoolId4A2()&&c.status==='approved'&&c.decisionLocked&&currentDate()<=c.preparationDeadline&&currentDate()<pr.dateISO}
function closePromCommittee6A2(pr,reason='Prom season ended'){
 const c=pr?.committee6A2;if(!c||c.eventId!==pr?.foundation6A1?.eventId)return;
 if(c.status==='approved'){c.status='closed';c.closedDate=c.closedDate||currentDate();c.closedReason=c.closedReason||reason}
 const org=c.organizationId&&schoolOrganizationById4B1(c.organizationId);
 if(org)org.memberIds=org.memberIds.filter(id=>id!=='player');
 resolveNotificationsFor(`${c.eventId}:committee_signup`);
}
function reconcilePromCommittee6A2(pr=S.school?.prom){
 const c=ensurePromCommittee6A2(pr);if(!c)return null;
 const now=currentDate(),signupSource=`${c.eventId}:committee_signup`;
 if(c.status==='not_applied'&&now>=pr.foundation6A1.announceDate&&now<=c.applicationDeadline&&!c.noticeSent){
  c.noticeSent=true;notify('Prom planning committee applications',`Apply by ${formatDate(c.applicationDeadline)} for a faculty-approved planning role. Joining is optional.`,{sourceType:'promCommittee',sourceId:signupSource,tab:'home'});
 }
 if(c.status==='not_applied'&&now>c.applicationDeadline){c.status='missed';c.closedDate=now;resolveNotificationsFor(signupSource)}
 if(c.status!=='not_applied')resolveNotificationsFor(signupSource);
 if(c.status==='applied'&&!c.decisionLocked&&now>=c.decisionDate){
  c.decisionLocked=true;c.decisionDateActual=now;
  // One adviser decision from application-time school context. Reload cannot reroll it.
  const approved=c.applicationScore>=63 || (c.leadershipPriority&&c.applicationScore>=50);
  c.status=approved?'approved':'rejected';
  if(approved){c.assignedRole=c.rolePreference;const org=promCommitteeOrganization6A2(pr);if(org&&!org.memberIds.includes('player'))org.memberIds.push('player');c.organizationId=org?.organizationId||null}
 }
 if(['approved','rejected'].includes(c.status)&&!c.decisionNoticeSent){
  c.decisionNoticeSent=true;notify(c.status==='approved'?'Prom committee appointment approved':'Prom committee application not selected',c.status==='approved'?`The faculty adviser approved your ${PROM_COMMITTEE_ROLES_6A2[c.assignedRole]} role. Attend after-school planning sessions by ${formatDate(c.preparationDeadline)}.`:'The faculty adviser filled the available planning roles this year.',{sourceType:'promCommitteeDecision',sourceId:`${c.eventId}:committee_result`,tab:'home'});
 }
 if(c.status==='approved'&&(now>c.preparationDeadline||now>=pr.dateISO))closePromCommittee6A2(pr,'Preparation deadline passed')
 return c;
}
function promCommitteeSessionGate6A2(pr=S.school?.prom){
 const c=pr&&reconcilePromCommittee6A2(pr);
 if(!c||!promCommitteeApproved6A2(pr))return {ok:false,reason:'Only faculty-approved current committee members may organize Prom before the preparation deadline.'};
 const day=schoolDayState4C1();
 if(!day.isSchoolDay||!day.afterSchoolWindow||!day.campusOpen||!day.atSchool)return {ok:false,reason:'Committee sessions take place at school after classes on an open school day.'};
 if(currentMinute()+45>day.hours.campusClose)return {ok:false,reason:'There is not enough time before campus closes.'};
 if(c.work.some(w=>w.dateISO===currentDate())||c.themeDate===currentDate()||c.decorDate===currentDate())return {ok:false,reason:'Only one committee responsibility per school day.'};
 const conflict=timedSchoolConflict4C4(currentDate(),currentMinute(),currentMinute()+45,c.eventId);
 if(conflict)return {ok:false,reason:`Planning conflicts with ${conflict.title}.`};
 return {ok:true,committee:c};
}
function promCommitteeWork6A2(key){
 const pr=ensureProm6A1(),cfg=PROM_COMMITTEE_TASKS_6A2[key],gate=promCommitteeSessionGate6A2(pr);
 if(!cfg)return {ok:false,reason:'invalid_task'};if(!gate.ok)return gate;
 const c=gate.committee;
 if(c.work.some(w=>w.key===key))return {ok:false,reason:'already_completed'};
 if(c.work.length>=3)return {ok:false,reason:'work_limit_reached'};
 if(key==='decorations'&&!c.decor)return {ok:false,reason:'Choose an approved decoration plan first.'};
 if(c.budgetSpent+cfg.cost>c.budgetAllocated)return {ok:false,reason:'School budget is insufficient.'};
 c.work.push({key,dateISO:currentDate(),minutes:45,cost:cfg.cost,schoolId:c.schoolId,role:c.assignedRole});
 c.budgetSpent+=cfg.cost;pr.committee=Math.max(Number(pr.committee)||0,c.work.length);
 advanceTime(45,{silent:true});addRep('leadership',cfg.role===c.assignedRole?2:1);if(!SIM.skipping)log('Prom committee',`${cfg.label}. The ${PROM_COMMITTEE_ROLES_6A2[c.assignedRole]} team checks the results with the adviser.`);
 return {ok:true,task:key,completed:c.work.length,budgetRemaining:c.budgetAllocated-c.budgetSpent};
}
function promCommitteeProposal6A2(kind,value){
 const pr=ensureProm6A1(),gate=promCommitteeSessionGate6A2(pr);if(!gate.ok)return gate;
 const c=gate.committee;
 if(kind==='theme'){
  if(!PROM_COMMITTEE_THEMES_6A2[value])return {ok:false,reason:'theme_not_school_approved'};
  if(c.theme)return {ok:false,reason:'theme_already_selected'};
  c.theme=value;c.themeDate=currentDate();
 }else if(kind==='decor'){
  const opt=PROM_COMMITTEE_DECOR_6A2[value];if(!opt)return {ok:false,reason:'decor_not_school_approved'};
  if(c.decor)return {ok:false,reason:'decor_already_selected'};
  if(c.budgetSpent+opt.cost>c.budgetAllocated)return {ok:false,reason:'school_budget_exceeded'};
  c.decor=value;c.decorDate=currentDate();c.budgetSpent+=opt.cost;
 }else return {ok:false,reason:'invalid_proposal'};
 advanceTime(45,{silent:true});addRep('leadership',1);
 if(!SIM.skipping)log('School-approved Prom planning',kind==='theme'?`The faculty adviser approves the ${PROM_COMMITTEE_THEMES_6A2[value]} theme.`:`The faculty adviser approves ${PROM_COMMITTEE_DECOR_6A2[value].label.toLowerCase()}.`);
 return {ok:true,kind,value,budgetRemaining:c.budgetAllocated-c.budgetSpent};
}
function promCommitteeHtml6A2(pr){
 const c=pr&&reconcilePromCommittee6A2(pr);if(!c)return '';
 const status={not_applied:'Applications open',applied:'Awaiting faculty decision',approved:'Approved member',rejected:'Not selected',declined:'Declined',missed:'Application closed',closed:'Preparations closed'}[c.status]||c.status;
 const selectButtons=c.status==='not_applied'&&promCommitteeApplicationOpen6A2(pr)?`<div class="inline-actions">${Object.entries(PROM_COMMITTEE_ROLES_6A2).map(([key,label])=>`<button class="small ghost" data-prom-committee6a2="apply:${key}">Apply: ${esc(label)}</button>`).join('')}<button class="small ghost" data-prom-committee6a2="decline">Do not apply</button></div>`:'';
 let controls='';if(promCommitteeApproved6A2(pr)){
  const gate=promCommitteeSessionGate6A2(pr);controls=`<p class="muted-text">Role: ${esc(PROM_COMMITTEE_ROLES_6A2[c.assignedRole]||'Member')} • School budget remaining ${money(c.budgetAllocated-c.budgetSpent)} • Sessions: after classes at school, one per day, by ${formatDate(c.preparationDeadline)}</p>`;
  if(!c.theme)controls+=`<div class="inline-actions">${Object.entries(PROM_COMMITTEE_THEMES_6A2).map(([k,label])=>`<button class="small ghost" data-prom-committee6a2="theme:${k}">${esc(label)} theme</button>`).join('')}</div>`;
  if(!c.decor)controls+=`<div class="inline-actions">${Object.entries(PROM_COMMITTEE_DECOR_6A2).map(([k,v])=>`<button class="small ghost" data-prom-committee6a2="decor:${k}">${esc(v.label)} • ${money(v.cost)}</button>`).join('')}</div>`;
  controls+=`<div class="inline-actions">${Object.entries(PROM_COMMITTEE_TASKS_6A2).filter(([key])=>!c.work.some(w=>w.key===key)).map(([key,v])=>`<button class="small ghost" data-prom-committee6a2="work:${key}">${esc(v.label)}</button>`).join('')}</div>`;
  if(!gate.ok)controls+=`<small class="muted-text">${esc(gate.reason)}</small>`;
 }
 return `<div class="prom-committee-6a2"><h4>School Prom committee • ${esc(status)}</h4><p class="muted-text">Faculty selection ${formatDate(c.decisionDate)} • Application deadline ${formatDate(c.applicationDeadline)} • Committee work closes ${formatDate(c.preparationDeadline)}. Organizing is not automatic.</p>${selectButtons}${controls}${c.work.length?`<small class="muted-text">Completed: ${c.work.map(w=>esc(PROM_COMMITTEE_TASKS_6A2[w.key]?.label||w.key)).join(' · ')}</small>`:''}</div>`;
}
function promCommitteeClick6A2(b){const action=b?.dataset?.promCommittee6a2;if(!action)return false;
 const [kind,value]=action.split(':');let r;
 if(kind==='apply')r=applyPromCommittee6A2(value);
 else if(kind==='decline')r=declinePromCommittee6A2();
 else if(kind==='theme'||kind==='decor')r=promCommitteeProposal6A2(kind,value);
 else if(kind==='work')r=promCommitteeWork6A2(value);
 else r={ok:false,reason:'invalid_action'};
 if(!r.ok)toast(String(r.reason||'Prom committee action unavailable.').replaceAll('_',' '));save();render();return true;
}
