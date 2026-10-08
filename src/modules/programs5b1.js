// =====================================================================
// PHASE 5B.1 — Summer / After-School Program Foundation
// Extends the existing PROGRAMS + S.programs + Calendar architecture.
// No parallel scheduler, inventory, skill, or employment system is created.
// =====================================================================
const PROGRAM_SCHEMA_5B1=1;
const PROGRAM_META_5B1=Object.freeze({
 bballCamp:{category:'Basketball',provider:'Community Sports Center',location:'Community gym',format:'group',scope:'summer',formal:true,safety:'medium'},
 soccerLeague:{category:'Soccer',provider:'Community Sports League',location:'Community field',format:'team',scope:'both',formal:true,safety:'medium'},
 swim:{category:'Swimming',provider:'Aquatic Center',location:'Aquatic center',format:'group',scope:'summer',formal:true,safety:'high'},
 artClass:{category:'Arts',provider:'Community Arts Center',location:'Art studio',format:'group',scope:'summer',formal:true,safety:'low'},
 music:{category:'Music',provider:'Community Music School',location:'Music studio',format:'1:1',scope:'both',formal:true,safety:'low'},
 theater:{category:'Theater',provider:'Youth Arts Center',location:'Community theater',format:'group',scope:'summer',formal:true,safety:'low'},
 codingCamp:{category:'Coding',provider:'Technology Learning Center',location:'Computer lab',format:'group',scope:'summer',formal:true,safety:'low'},
 scienceCamp:{category:'Science',provider:'Science Center',location:'Science center',format:'group',scope:'summer',formal:true,safety:'low'},
 bakingClass:{category:'Baking',provider:'Community Kitchen',location:'Teaching kitchen',format:'group',scope:'summer',formal:true,safety:'medium'},
 summerSchool:{category:'Academic',provider:'Local School District',location:'School',format:'group',scope:'summer',formal:true,safety:'low',academic:true}
});
function ensureProgramFoundation5B1(){
 S.programs=Array.isArray(S.programs)?S.programs:[];
 S.programFoundation5B1=Object.assign({schema:PROGRAM_SCHEMA_5B1,discovered:{},lastDiscoveryDate:null},S.programFoundation5B1||{});
 if(!S.programFoundation5B1.discovered||typeof S.programFoundation5B1.discovered!=='object')S.programFoundation5B1.discovered={};
 S.programFoundation5B1.schema=PROGRAM_SCHEMA_5B1;return S.programFoundation5B1
}
function programDefinition5B1(id){
 if(typeof summerJobDefinition5B4==='function'){const j=summerJobDefinition5B4(id);if(j)return j}
 if(typeof academicProgramDefinition5B3==='function'){const a=academicProgramDefinition5B3(id);if(a)return a}
 const pg=PROGRAMS.find(x=>x.id===id);if(!pg)return null;const meta=PROGRAM_META_5B1[id]||{};
 return Object.assign({},pg,{templateId:pg.id,formal:!pg.job&&(meta.formal!==false),kind:pg.job?'legacy_job':'formal_program',category:meta.category||(pg.academic?'Academic':'Activity'),provider:meta.provider||'Community provider',location:meta.location||(pg.job?'Work':'Program'),format:meta.format||'group',scope:meta.scope||(pg.job?'summer':'summer'),safety:meta.safety||'low',academic:!!(meta.academic||pg.academic)})
}
function programDefinitions5B1(){return PROGRAMS.map(x=>programDefinition5B1(x.id)).filter(Boolean)}
function programMode5B1(id){if(CASUAL[id])return {mode:'casual',formal:false,label:CASUAL[id].label,skill:CASUAL[id].skill};const d=programDefinition5B1(id);return d?{mode:d.kind==='legacy_job'?'job':'formal',formal:!!d.formal,label:d.name,category:d.category}:null}
function schoolBreakState5B1(dateISO=currentDate()){
 const a=academicInfo(dateISO),r=noSchoolReason(dateISO)||'';if(a.phase==='summer')return {onBreak:true,major:true,kind:'summer',reason:r||'Summer break',academicYear:a.key};
 if(a.phase==='semBreak')return {onBreak:true,major:true,kind:'semester',reason:r||'Semester break',academicYear:a.key};
 const b=breakOn(dateISO,a);if(b){const txt=String(b.name||r);return {onBreak:true,major:/winter|summer|christmas|t[eế]t|holiday|vacation/i.test(txt),kind:/winter|christmas/i.test(txt)?'winter':'scheduled',reason:txt,academicYear:a.key}}
 if(!isSchoolDay(dateISO)&&r&&!/Weekend/i.test(r))return {onBreak:true,major:false,kind:'holiday',reason:r,academicYear:a.key};
 return {onBreak:false,major:false,kind:'term',reason:r||'School term',academicYear:a.key}
}
function programSeasonKey5B1(dateISO=currentDate()){const a=academicInfo(dateISO);return `${a.region}-${a.key}`}
function programOfferingId5B1(def,scope,dateISO=currentDate()){return `program:${def.id}:${programSeasonKey5B1(dateISO)}:${scope}`}
function datesForWeekdays5B1(def,from,to,{afterSchool=false}={}){
 const out=[],wanted=new Set(def.days||[]),target=Math.max(1,Number(def.weeks||1))*Math.max(1,wanted.size||1);let d=from,guard=0;
 while(d<=to&&out.length<target&&guard++<180){const wd=parseISO(d).getUTCDay();if(wanted.has(wd)){
   if(!afterSchool||isWeekend(d)||isSchoolDay(d))out.push(d)
  }d=addDays(d,1)}return out
}
function programOffer5B1(defOrId,{dateISO=currentDate()}={}){
 const def=typeof defOrId==='string'?programDefinition5B1(defOrId):programDefinition5B1(defOrId?.id);if(!def||def.job||!def.formal||S.age<def.minAge||S.age>def.maxAge)return null;
 const a=academicInfo(dateISO),breakState=schoolBreakState5B1(dateISO);let scope=null,from=null,to=null,dates=[];
 if((def.scope==='summer'||def.scope==='both')){
  const w=summerWindow();if(w.open){scope='summer';from=addDays(w.from<dateISO?dateISO:w.from,2);to=w.to;dates=datesForWeekdays5B1(def,from,to)}
 }
 if(!scope&&def.scope==='both'&&!breakState.onBreak&&a.semester){scope='after_school';from=addDays(dateISO,1);to=a.semester===1?a.sem1End:a.end;dates=datesForWeekdays5B1(def,from,to,{afterSchool:true})}
 if(!scope||!dates.length)return null;
 const startDate=dates[0],endDate=dates[dates.length-1],programId=programOfferingId5B1(def,scope,startDate);
 return {programId,templateId:def.id,progId:def.id,name:def.name,kind:'formal_program',formal:true,category:def.category,provider:def.provider,location:def.location,format:def.format,scope,academic:!!def.academic,minAge:def.minAge,maxAge:def.maxAge,cost:Number(def.cost||0),skill:def.skill||null,startDate,endDate,startMinute:def.start,endMinute:def.end,days:[...(def.days||[])],dates,durationSessions:dates.length,safety:def.safety||'low'}
}
function activeProgramEnrollment5B1(programId){return (S.programs||[]).find(r=>r.programId===programId&&!['Completed','Done','Dropped','Removed','Superseded','Cancelled'].includes(r.status))||null}
function programEnrollmentByProgramId5B1(programId){return (S.programs||[]).find(r=>r.programId===programId)||null}
function programLifecycle5B1(status){return ({Available:'available','Permission needed':'permission_needed',Considering:'considering',Enrolled:'enrolled',Active:'active',Done:'completed',Completed:'completed',Dropped:'dropped',Removed:'removed',Declined:'declined',Superseded:'archived',Cancelled:'cancelled'})[status]||String(status||'available').toLowerCase().replace(/\s+/g,'_')}
function normalizeProgramEnrollment5B1(rec){
 if(!rec)return null;ensureProgramFoundation5B1();const def=programDefinition5B1(rec.progId||rec.templateId);if(!def)return rec;
 rec.schema5B1=PROGRAM_SCHEMA_5B1;rec.templateId=rec.templateId||rec.progId||def.id;rec.progId=rec.progId||rec.templateId;rec.kind=def.job?'legacy_job':'formal_program';rec.formal=!def.job;rec.category=rec.category||def.category;rec.provider=rec.provider||def.provider;rec.location=rec.location||def.location;rec.format=rec.format||def.format;rec.cost=Number.isFinite(Number(rec.cost))?Number(rec.cost):Number(def.cost||0);rec.status=rec.status||'Enrolled';rec.lifecycle=programLifecycle5B1(rec.status);
 const seedDate=rec.start||rec.startDate||currentDate(),scope=rec.scope||(def.scope==='both'&&!schoolBreakState5B1(seedDate).onBreak?'after_school':'summer');rec.scope=scope;rec.programId=rec.programId||programOfferingId5B1(def,scope,seedDate);
 rec.startDate=rec.startDate||rec.start||null;rec.endDate=rec.endDate||rec.end||null;rec.start=rec.start||rec.startDate;rec.end=rec.end||rec.endDate;rec.schedule=Object.assign({days:[...(def.days||[])],startMinute:def.start,endMinute:def.end,startDate:rec.startDate,endDate:rec.endDate},rec.schedule||{});rec.calendarIds=Array.isArray(rec.calendarIds)?rec.calendarIds:[];rec.attended=Number(rec.attended||0);rec.missed=Number(rec.missed||0);rec.streakMissed=Number(rec.streakMissed||0);rec.teammates=Array.isArray(rec.teammates)?rec.teammates:[];return rec
}
function programCalendarEvents5B1(rec){return (S.calendar||[]).filter(e=>e.type==='program'&&(e.payload?.recId===rec.id||e.payload?.programId===rec.programId))}
function programScheduleConflicts5B1(offer){
 const hits=[];for(let i=0;i<offer.dates.length;i++){const d=offer.dates[i],start=offer.startMinute,end=offer.endMinute;for(const ev of S.calendar||[]){if(ev.dateISO!==d||isTerminal(ev.status))continue;const es=Number(ev.startMinute??ev.minute??0),ee=Number(ev.endMinute??es+60);if(start<ee&&es<end)hits.push({dateISO:d,eventId:ev.id,title:ev.title||ev.type,type:ev.type,startMinute:es,endMinute:ee})}}
 return hits
}
function programDiscoverySource5B1(offer){return offer.scope==='after_school'?'school notice board':'community listing'}
function discoverProgramOffers5B1(){
 const f=ensureProgramFoundation5B1(),out=[];for(const def of programDefinitions5B1().filter(x=>x.formal)){const offer=programOffer5B1(def);if(!offer)continue;let d=f.discovered[offer.programId];if(!d)d=f.discovered[offer.programId]={programId:offer.programId,templateId:offer.templateId,source:programDiscoverySource5B1(offer),discoveredDate:currentDate(),status:'Discovered'};out.push(Object.assign({},offer,{discovery:d}))}f.lastDiscoveryDate=currentDate();return out
}
function programPermissionContext5B1(offer){return {kind:'formalProgramEnrollment5B1',programId:offer.programId,cost:offer.cost,scope:offer.scope,schedule:`${offer.days.join(',')}@${offer.startMinute}-${offer.endMinute}`,wealth:S.wealth,age:S.age,schoolBand:S.school?Math.floor(schoolAverage()/10)*10:null}}
function programPermissionScore5B1(offer){
 const wealth=({Struggling:-24,Modest:-10,'Middle class':2,Comfortable:10,Wealthy:16})[S.wealth]??0,r=familyRules(),trust=S.family?.trust??60,resp=S.family?.responsibility||0,costPenalty=Math.min(24,offer.cost/15),safety=offer.safety==='high'?10:offer.safety==='medium'?4:0,academic=offer.academic?4:0;
 return clamp(62+wealth+(trust-60)*.18+(resp-50)*.12-(r.strictness-50)*.08-costPenalty-safety+academic,5,95)
}
function requestProgramPermission5B1(offer){
 if(S.age>=18)return {record:null,reused:false,maker:null,approved:true};const context=programPermissionContext5B1(offer),q=requestDecision({requestType:'programEnrollment',targetKey:offer.programId,context,decide:(maker)=>{const score=programPermissionScore5B1(offer),who=decisionMakerLabel(maker);if(score>=58)return {outcome:'Yes',reason:`${who} approves ${offer.name}.`,resolved:true,meta:{score}};if(score>=42)return {outcome:'Considering',reason:`${who} wants time to think about the cost and schedule.`,reconsiderAfter:addDays(currentDate(),3),resolved:false,meta:{score}};return {outcome:'No',reason:`${who} says no for now because the cost, schedule, safety, or family situation does not work.`,reconsiderAfter:addDays(currentDate(),7),resolved:true,meta:{score}}}});if(q.error)return Object.assign(q,{approved:false});return Object.assign(q,{approved:q.record?.outcome==='Yes'})
}
function programRequestRecord5B1(offer){
 let rec=programEnrollmentByProgramId5B1(offer.programId);if(rec)return normalizeProgramEnrollment5B1(rec);rec={id:`enroll:${offer.programId}`,programId:offer.programId,progId:offer.templateId,templateId:offer.templateId,name:offer.name,status:'Available',lifecycle:'available',scope:offer.scope,kind:'formal_program',formal:true,category:offer.category,provider:offer.provider,location:offer.location,format:offer.format,cost:offer.cost,start:offer.startDate,end:offer.endDate,startDate:offer.startDate,endDate:offer.endDate,total:offer.dates.length,attended:0,missed:0,streakMissed:0,teammates:[],coach:50,schedule:{days:[...offer.days],startMinute:offer.startMinute,endMinute:offer.endMinute,startDate:offer.startDate,endDate:offer.endDate},calendarIds:[]};S.programs.unshift(rec);return normalizeProgramEnrollment5B1(rec)
}
function programFunding5B1(offer,rec){
 const cost=Number(offer.cost||0);if(cost<=0){rec.payment={cost:0,payer:'none',playerContribution:0,familyContribution:0};return {ok:true}}
 if(S.age>=18){if(!spendOwn(cost))return {ok:false,reason:`${offer.name} costs ${money(cost)}.`};rec.payment={cost,payer:'player',playerContribution:cost,familyContribution:0};return {ok:true}}
 const share=({Struggling:.6,Modest:.3,'Middle class':0,Comfortable:0,Wealthy:0})[S.wealth]??.25,player=Math.round(cost*share),family=cost-player;if(player>0&&!spendOwn(player))return {ok:false,reason:`Your family will help with ${money(family)}, but you still need ${money(player)} of your own.`};rec.payment={cost,payer:player?'shared':'family',playerContribution:player,familyContribution:family};return {ok:true}
}
function scheduleProgramCalendar5B1(rec,offer){
 rec.calendarIds=[];offer.dates.forEach((dateISO,i)=>{const id=`program:${offer.programId}:session:${String(i+1).padStart(2,'0')}`;const ev=createCalendarEvent({id,type:'program',title:i===offer.dates.length-1&&programDefinition5B1(offer.templateId)?.final?`${offer.name}: ${programDefinition5B1(offer.templateId).final}`:offer.name,dateISO,startMinute:offer.startMinute,endMinute:offer.endMinute,graceMinute:Math.min(1439,offer.startMinute+30),location:offer.location,payload:{recId:rec.id,programId:offer.programId,sessionIndex:i,last:i===offer.dates.length-1,formal:true},required:true,source:'program'});rec.calendarIds.push(ev.id)});return rec.calendarIds
}
function programEnrollmentGate5B1(offer){
 const existing=programEnrollmentByProgramId5B1(offer.programId);if(existing&&['Enrolled','Active','Done','Completed'].includes(existing.status))return {ok:false,reason:`You are already ${existing.status==='Done'||existing.status==='Completed'?'finished with':'enrolled in'} this program.`,existing};const conflicts=programScheduleConflicts5B1(offer);if(conflicts.length)return {ok:false,reason:`Schedule conflict with ${conflicts[0].title} on ${formatDate(conflicts[0].dateISO)}.`,conflicts};return {ok:true,existing}
}
function enrollFormalProgram5B1(offer){
 ensureProgramFoundation5B1();const gate=programEnrollmentGate5B1(offer);if(!gate.ok){toast(gate.reason);return gate.existing||null}const rec=programRequestRecord5B1(offer),perm=requestProgramPermission5B1(offer);if(perm.error){rec.status='Permission needed';rec.lifecycle='permission_needed';rec.permissionReason=perm.error;toast(perm.error);return rec}if(S.age<18){rec.decisionId=perm.record?.id||rec.decisionId;rec.decisionMakerId=perm.record?.decisionMakerId||rec.decisionMakerId;if(!perm.approved){rec.status=perm.record?.outcome==='Considering'?'Considering':'Declined';rec.lifecycle=programLifecycle5B1(rec.status);rec.permissionReason=perm.record?.reason||'';rec.reconsiderAfter=perm.record?.reconsiderAfter||null;log(`${offer.name} request`,perm.record?.reason||'Your parent or guardian has not approved it.');return rec}}
 const pay=programFunding5B1(offer,rec);if(!pay.ok){rec.status='Considering';rec.lifecycle='considering';rec.paymentReason=pay.reason;toast(pay.reason);return rec}
 rec.status='Enrolled';rec.lifecycle='enrolled';rec.enrolledDate=currentDate();rec.enrolledMinute=currentMinute();rec.start=offer.startDate;rec.end=offer.endDate;rec.startDate=offer.startDate;rec.endDate=offer.endDate;rec.total=offer.dates.length;rec.schedule={days:[...offer.days],startMinute:offer.startMinute,endMinute:offer.endMinute,startDate:offer.startDate,endDate:offer.endDate};scheduleProgramCalendar5B1(rec,offer);log(`Enrolled: ${offer.name}`,`${offer.dates.length} scheduled session${offer.dates.length===1?'':'s'} • ${formatDate(offer.startDate)}–${formatDate(offer.endDate)} • ${timeLabel(offer.startMinute)}–${timeLabel(offer.endMinute)}.`,true);return rec
}
function legacyJobDates5B1(pg){const w=summerWindow();if(!w.open||S.age<pg.minAge||S.age>pg.maxAge)return null;if((S.programs||[]).some(x=>x.progId===pg.id&&['Enrolled','Active'].includes(x.status)))return null;const from=addDays(w.from<currentDate()?currentDate():w.from,2),dates=programDates(pg,from);if(!dates.length||dates[dates.length-1]>w.to)return null;return dates}
function enrollLegacyJob5B1(pg,dates){
 if(pg.req&&(S.skills?.[pg.req.skill]||0)<pg.req.min){toast(`You need ${pg.req.skill} level ${Math.ceil(pg.req.min/10)} for this job.`);return null}if(S.age<13&&!caregiverYes(pg.cost>150?-10:0)){log('Not this summer',`Your caregiver says no to ${pg.name.toLowerCase()} this year.`);return null}
 S.programs=S.programs||[];const rec={id:uid('prog'),progId:pg.id,name:pg.name,status:'Enrolled',start:dates[0],end:dates[dates.length-1],total:dates.length,attended:0,missed:0,streakMissed:0,teammates:[],coach:50};S.programs.unshift(rec);normalizeProgramEnrollment5B1(rec);dates.forEach((d,i)=>createCalendarEvent({id:`prog-${rec.id}-${i}`,type:'program',title:pg.name,dateISO:d,startMinute:pg.start,endMinute:pg.end,graceMinute:pg.start+30,location:'Work',payload:{recId:rec.id,i,last:i===dates.length-1},required:true,source:'program'}));log(`Hired: ${pg.name}`,`${dates.length} shifts from ${formatDate(dates[0])} to ${formatDate(rec.end)} • ${money(pg.pay)} per shift. Show up on time.`,true);return rec
}
// Compatibility override: callers using the legacy helper now receive canonical dates.
function programAvailable(pg){if(!pg)return null;if(pg.job)return legacyJobDates5B1(pg);const offer=programOffer5B1(pg);if(!offer)return null;const old=programEnrollmentByProgramId5B1(offer.programId);if(old&&['Enrolled','Active','Done','Completed','Dropped','Removed'].includes(old.status))return null;return offer.dates}
// Compatibility override used by the existing UI click router.
function enrollProgram(id){
 const def=programDefinition5B1(id);if(!def){toast('Program not found.');return null}if(def.job){const dates=legacyJobDates5B1(def);if(!dates){toast('Not available right now.');return null}return enrollLegacyJob5B1(def,dates)}const offer=programOffer5B1(def);if(!offer){toast('Not available right now.');return null}return enrollFormalProgram5B1(offer)
}
function programOfferHtml5B1(offer){
 const rec=programEnrollmentByProgramId5B1(offer.programId),state=rec?.status||'Available',conf=programScheduleConflicts5B1(offer),blocked=conf.length>0||['Enrolled','Active','Done','Completed'].includes(state),reason=conf.length?`Conflict: ${conf[0].title}`:state;
 return `<div class="calendar-row"><div><b>${esc(offer.name)}</b><small>${esc(offer.category)} • ${esc(offer.provider)} • ${offer.format} • ${offer.cost?money(offer.cost):'Free'}<br>${formatDate(offer.startDate)}–${formatDate(offer.endDate)} • ${timeLabel(offer.startMinute)}–${timeLabel(offer.endMinute)} • ${offer.durationSessions} sessions</small></div><div class="inline-actions">${statusTag(reason)}<button class="small primary" data-program="${esc(offer.templateId)}" ${blocked?'disabled':''}>${state==='Considering'?'Ask again':state==='Declined'?'Ask again':'Enroll'}</button></div></div>`
}
function programsHtml(){
 ensureProgramFoundation5B1();const br=schoolBreakState5B1(),offers=discoverProgramOffers5B1(),mine=(S.programs||[]).filter(r=>['Enrolled','Active','Considering','Declined'].includes(r.status)&&r.formal!==false),cas=Object.entries(CASUAL).filter(([,c])=>S.age>=c.minAge),jobs=PROGRAMS.filter(x=>x.job).map(pg=>({pg,d:legacyJobDates5B1(pg)})).filter(x=>x.d);
 return `<div class="card"><h3>☀️ Programs & free time</h3><p class="muted-text">${br.onBreak?`${esc(br.reason)} — normal school-term classes are not running. Free time is yours unless you enroll in something.`:'School term — formal extracurriculars must fit around the real school timetable.'}</p>${mine.length?`<h4>Your programs</h4>${mine.map(r=>`<div class="calendar-row"><div><b>${esc(r.name)}</b><small>${esc(r.category||'Program')} • ${r.startDate?formatDate(r.startDate):''}${r.endDate?`–${formatDate(r.endDate)}`:''}</small></div>${statusTag(r.status)}</div>`).join('')}`:''}<h4>Formal programs</h4>${offers.length?offers.map(programOfferHtml5B1).join(''):'<p class="muted-text">No formal program currently fits your age, season and schedule.</p>'}<h4>Casual practice (free & flexible)</h4><div class="inline-actions">${cas.map(([k,c])=>`<button class="small ghost" data-casual="${k}">${esc(c.label)}</button>`).join('')}</div>${jobs.length?`<h4>Existing summer work options</h4><div class="prog-list">${jobs.map(({pg,d})=>`<button class="prog-opt" data-program="${pg.id}"><b>${esc(pg.name)}</b><small>${money(pg.pay)}/shift • ${d.length} shifts • ${formatDate(d[0])}–${formatDate(d[d.length-1])}</small></button>`).join('')}</div>`:''}</div>`
}
function migratePrograms5B1(){
 ensureProgramFoundation5B1();const seen=new Map();for(const rec of S.programs){normalizeProgramEnrollment5B1(rec);if(!rec.programId)continue;const live=!['Done','Completed','Dropped','Removed','Superseded','Cancelled'].includes(rec.status);if(live&&seen.has(rec.programId)){rec.status='Superseded';rec.lifecycle='archived';rec.supersededBy=seen.get(rec.programId).id;for(const ev of programCalendarEvents5B1(rec))if(!isTerminal(ev.status))setCalendarStatus(ev,'Cancelled','Duplicate program enrollment migrated')}else if(live)seen.set(rec.programId,rec);rec.calendarIds=[...new Set(programCalendarEvents5B1(rec).map(e=>e.id))]}
 return S.programs
}
