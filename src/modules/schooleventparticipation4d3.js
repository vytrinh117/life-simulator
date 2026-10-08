// =====================================================================
// PHASE 4D.3 — PREPARATION / PARTICIPATION / RESULTS / CONSEQUENCES
// Extends canonical 4D.1/4D.2 school-event records. H3's three useful
// preparation sessions/day remain the integrity cap; this module adds
// event-specific preparation, Phase 4C location/time gating, stable fields,
// multi-factor results, and meaningful outcome history.
// =====================================================================
const SCHOOL_EVENT_SCHEMA_4D3=1;
const EVENT_PREP_BASE_GAINS_4D3=[10,6,3];

function eventRelevantSkills4D3(c){
 const n=String(c?.name||'').toLowerCase(),cat=c?.category||eventCategory4D1(c?.name,c?.eventType);
 if(cat==='sports_event')return /swim/.test(n)?['fitness','sports']:/race|track|run/.test(n)?['fitness','sports']:['sports','fitness'];
 if(cat==='arts_performance')return /music/.test(n)?['music','creativity']:/art|photo/.test(n)?['art','creativity']:/drama|film|play/.test(n)?['creativity','writing']:['creativity','art'];
 if(cat==='academic_competition')return /coding|robot/.test(n)?['programming','knowledge']:/debate|poetry|spelling|reading/.test(n)?['writing','knowledge']:['knowledge','writing'];
 return ['knowledge','creativity'];
}
function eventPrimarySubject4D3(c){
 const n=String(c?.name||'').toLowerCase(),subs=S.school?.subjects||[];
 const pick=rx=>subs.find(s=>rx.test(String(s.name||'').toLowerCase()));
 return (/math/.test(n)&&pick(/math/))||(/science|robot/.test(n)&&pick(/science/))||(/coding/.test(n)&&pick(/computer|coding|technology/))||(/debate|reading|spelling|poetry/.test(n)&&pick(/english|language|literature/))||subs[0]||null
}
function eventPreparationOptions4D3(idOrEvent){
 const c=typeof idOrEvent==='object'?idOrEvent:schoolEventById4D1(idOrEvent);if(!c)return [];
 const cat=c.category||eventCategory4D1(c.name,c.eventType);
 if(cat==='sports_event')return [
  {id:'drills',label:'Skill drills',minutes:75,place:'school_free',skill:eventRelevantSkills4D3(c)[0]},
  {id:'team_training',label:'Team training',minutes:90,place:'school_free',skill:eventRelevantSkills4D3(c)[1]},
  {id:'strategy',label:'Review strategy',minutes:60,place:'home_or_school_free',skill:'knowledge'}];
 if(cat==='arts_performance')return [
  {id:'rehearse',label:'Rehearse',minutes:75,place:'home_or_school_free',skill:eventRelevantSkills4D3(c)[0]},
  {id:'refine',label:'Refine project',minutes:90,place:'home',skill:eventRelevantSkills4D3(c)[1]},
  {id:'feedback',label:'Advisor feedback',minutes:45,place:'teacher',skill:eventRelevantSkills4D3(c)[0]}];
 if(cat==='academic_competition')return [
  {id:'review',label:'Review material',minutes:60,place:'home_or_school_free',skill:eventRelevantSkills4D3(c)[0]},
  {id:'practice_questions',label:'Practice questions',minutes:75,place:'home_or_school_free',skill:eventRelevantSkills4D3(c)[0]},
  {id:'teacher_coaching',label:'Study with teacher',minutes:60,place:'teacher',skill:eventRelevantSkills4D3(c)[1]},
  {id:'mock_test',label:'Mock test',minutes:90,place:'home',skill:eventRelevantSkills4D3(c)[0]}];
 return [{id:'focused_practice',label:'Focused preparation',minutes:75,place:'home_or_school_free',skill:eventRelevantSkills4D3(c)[0]}]
}
function eventPreparationLocationGate4D3(c,opt){
 const loc=String(S.location||'Home'),school=typeof playerAtSchool4C1==='function'&&playerAtSchool4C1(),fc=typeof schoolFacilityContext4C3==='function'?schoolFacilityContext4C3():null;
 if(opt.place==='home')return loc==='Home'?{ok:true,mode:'home'}:{ok:false,reason:'This preparation needs to be done at home.'};
 if(opt.place==='school_free')return school&&fc?.freeWindow?{ok:true,mode:fc.afterSchool?'after_school':'school_break'}:{ok:false,reason:school?'This preparation needs a break, lunch, or after-school window.':'You need to be at school for this preparation.'};
 if(opt.place==='home_or_school_free')return loc==='Home'?{ok:true,mode:'home'}:school&&fc?.freeWindow?{ok:true,mode:fc.afterSchool?'after_school':'school_break'}:{ok:false,reason:school?'Wait for a break/lunch/after-school study window.':'Use Home or a legitimate school free period for this preparation.'};
 if(opt.place==='teacher'){
  if(!school)return {ok:false,reason:'Teacher coaching requires you to be physically at school.'};
  if(!fc?.freeWindow)return {ok:false,reason:'Teacher coaching is available only at a realistic school help time.'};
  const sub=eventPrimarySubject4D3(c),a=typeof teacherAvailability4C2==='function'?teacherAvailability4C2(sub?.name||null):{available:true};
  return a?.available?{ok:true,mode:'teacher',subject:sub?.name||null}:{ok:false,reason:a?.reason||'The teacher is not available now.'}
 }
 return {ok:false,reason:'No valid preparation context.'}
}
function eventPrepQuality4D3(c,opt){
 ensureSkills?.();const skills=eventRelevantSkills4D3(c),skill=Math.max(...skills.map(k=>Number(S.skills?.[k])||0),Number(S.school?.subjects?.find(s=>s.name===eventPrimarySubject4D3(c)?.name)?.skill)||0),smart=clamp(S.smart??50),health=clamp(S.health??70),energy=clamp(S.energy??60),stress=clamp(S.stress??30),support=clamp(typeof teacherCoachOpinion4B4==='function'?teacherCoachOpinion4B4(c.eligibility?.organizationId||null):50);
 const cat=c.category;let q=skill*.30+health*.14+energy*.16+(100-stress)*.12+support*.10+50*.18;if(cat==='academic_competition')q+=smart*.18-9;if(cat==='sports_event')q+=Number(S.skills?.fitness||0)*.12-6;if(cat==='arts_performance')q+=Number(S.skills?.creativity||0)*.12-6;return clamp(q)
}
function normalizeSchoolEventParticipation4D3(c){
 if(typeof c!=='object')c=schoolEventById4D1(c);if(!c)return null;normalizeSchoolEventDiscovery4D2(c);c.schemaVersion4D3=SCHOOL_EVENT_SCHEMA_4D3;c.preparationState=Object.assign({progress:clamp(Number(c.prep)||0),sessionsByDate:{},history:[]},c.preparationState||{});c.preparationState.sessionsByDate=c.preparationState.sessionsByDate&&typeof c.preparationState.sessionsByDate==='object'?c.preparationState.sessionsByDate:{};c.preparationState.history=Array.isArray(c.preparationState.history)?c.preparationState.history:[];c.preparationState.progress=clamp(Math.max(Number(c.prep)||0,Number(c.preparationState.progress)||0));c.prep=c.preparationState.progress;c.opponentField=Array.isArray(c.opponentField)?c.opponentField:null;c.resultRecord=c.resultRecord&&typeof c.resultRecord==='object'?c.resultRecord:null;return c
}
function eventPrepDay4D3(c,dateISO=currentDate()){
 normalizeSchoolEventParticipation4D3(c);const rec=c.preparationState.sessionsByDate[dateISO]||{dateISO,count:0,totalGain:0,types:[]};rec.count=Math.max(0,Math.min(3,Number(rec.count)||0));rec.totalGain=Number(rec.totalGain)||0;rec.types=Array.isArray(rec.types)?rec.types:[];c.preparationState.sessionsByDate[dateISO]=rec;c.prepDaily={dateISO,count:rec.count};return rec
}
function eventPrepSessionsToday4D3(c){return eventPrepDay4D3(c).count}
function prepareSchoolEvent4D3(idOrEvent,type='auto'){
 const c=typeof idOrEvent==='object'?idOrEvent:schoolEventById4D1(idOrEvent);if(!c)return {ok:false,reason:'event-missing'};normalizeSchoolEventParticipation4D3(c);if(!['registered','preparing'].includes(c.lifecycleState))return {ok:false,reason:'state-'+c.lifecycleState};if(c.eventDate<currentDate())return {ok:false,reason:'event-passed'};if((c.prep||0)>=100)return {ok:false,reason:'fully-prepared'};
 const day=eventPrepDay4D3(c);if(day.count>=3)return {ok:false,reason:'daily-cap',sessions:day.count,progress:c.prep};
 const options=eventPreparationOptions4D3(c);let opt=type==='auto'?options.find(o=>eventPreparationLocationGate4D3(c,o).ok):options.find(o=>o.id===type);if(!opt)return {ok:false,reason:'prep-type-invalid'};const gate=eventPreparationLocationGate4D3(c,opt);if(!gate.ok)return {ok:false,reason:'wrong-location',detail:gate.reason};if((S.energy??50)<8)return {ok:false,reason:'low-energy'};
 const quality=eventPrepQuality4D3(c,opt),gain=EVENT_PREP_BASE_GAINS_4D3[day.count],minutes=75,before=Number(c.prep)||0;
 day.count++;day.totalGain+=gain;day.types.push(opt.id);c.preparationState.progress=clamp(before+gain);c.prep=c.preparationState.progress;c.prepDaily={dateISO:currentDate(),count:day.count};c.preparationState.history.push({dateISO:currentDate(),minute:currentMinute(),type:opt.id,label:opt.label,gain,quality:Math.round(quality*10)/10,minutes,location:S.location});if(c.preparationState.history.length>30)c.preparationState.history.splice(0,c.preparationState.history.length-30);
 if(c.lifecycleState==='registered')transitionSchoolEvent4D1(c,'preparing',{reason:'Preparation started'});S.energy=clamp(S.energy-7);S.stress=clamp(S.stress+2);advanceTime(minutes,{silent:true});feedback(`Prepared for ${c.name}`,`${opt.label} • preparation ${Math.round(c.prep)}% • session ${day.count}/3 today`,minutes);return {ok:true,event:c,type:opt.id,gain,quality,sessions:day.count,progress:c.prep,minutes}
}
function opponentStrength4D3(c,id,index=0){
 const n=id&&id!=='player'?npcById(id):null,cat=c.category,seed=hashOf(`${c.eventId}|${id||index}|field`)%1700/100-8.5;let base=55+seed;if(n){if(cat==='academic_competition')base=(n.smart??50)*.62+(n.reputation??35)*.18+20+seed*.35;else if(cat==='sports_event')base=45+(n.reputation??35)*.25+(n.traits||[]).includes('Athletic')*12+seed;else if(cat==='arts_performance')base=43+(n.looks??50)*.08+(n.reputation??35)*.25+(n.traits||[]).includes('Creative')*12+seed}return clamp(base)}
function buildOpponentField4D3(c){
 c=normalizeSchoolEventParticipation4D3(c);if(!c)return [];if(Array.isArray(c.opponentField)&&c.opponentField.length)return c.opponentField;
 const ids=typeof studentsAtSchool4A3==='function'?studentsAtSchool4A3(c.schoolId).filter(id=>id!=='player').sort():[],field=[];for(const id of ids.slice(0,3)){const n=npcById(id);field.push({id,personId:id,label:n?displayName(n,'formal'):'School competitor',schoolId:c.schoolId,strength:Math.round(opponentStrength4D3(c,id,field.length)*10)/10})}
 const externalCount=Math.max(3,6-field.length);for(let i=0;i<externalCount;i++)field.push({id:`${c.eventId}:field:${i+1}`,personId:null,label:`Competitor ${field.length+1}`,schoolId:null,strength:Math.round(opponentStrength4D3(c,null,i+17)*10)/10});c.opponentField=field;return field
}
function eventExperience4D3(c){const hist=S.school?.eventHistory||[];return Math.min(100,hist.filter(x=>x.category===c.category&&x.status==='completed').length*12)}
function eventResultFactors4D3(c,{late=0}={}){
 c=normalizeSchoolEventParticipation4D3(c);if(!c)return {score:0};ensureSkills?.();const skills=eventRelevantSkills4D3(c),skill=Math.max(...skills.map(k=>Number(S.skills?.[k])||0),0),prep=clamp(Number(c.prep)||0),smart=clamp(S.smart??50),health=clamp(S.health??70),energy=clamp(S.energy??60),stress=clamp(S.stress??30),support=clamp(typeof teacherCoachOpinion4B4==='function'?teacherCoachOpinion4B4(c.eligibility?.organizationId||null):50),experience=eventExperience4D3(c),academic=clamp(schoolAverage()),luck=clamp(S.luck??50),workbook=typeof workbookCompetitionSupport5A4==='function'?workbookCompetitionSupport5A4(c):{bonus:0};let core;
 if(c.category==='academic_competition')core=academic*.22+smart*.17+skill*.13+prep*.24+health*.05+energy*.05+(100-stress)*.05+support*.04+experience*.02+luck*.03+(workbook.bonus||0);
 else if(c.category==='sports_event')core=skill*.28+prep*.22+health*.12+energy*.11+(100-stress)*.06+support*.07+experience*.05+luck*.04+smart*.05;
 else if(c.category==='arts_performance')core=skill*.24+prep*.23+smart*.08+health*.06+energy*.07+(100-stress)*.06+support*.07+experience*.05+luck*.05+academic*.09;
 else core=skill*.18+prep*.24+smart*.10+health*.08+energy*.08+(100-stress)*.08+support*.08+experience*.06+luck*.05+academic*.05;
 const deterministicVariance=(hashOf(`${c.eventId}|result-roll|${c.repeat?.schoolYearKey||''}`)%1601)/100-8;return {academic,smart,skill,prep,health,energy,stress,support,experience,luck,workbookBonus:Number(workbook.bonus)||0,workbookSubject:workbook.subject||null,variance:deterministicVariance,latePenalty:Math.min(10,Math.max(0,late)/4),score:clamp(core+deterministicVariance-Math.min(10,Math.max(0,late)/4))}
}
function resultLabel4D3(rank,total){if(rank===1)return {type:'winner',label:'Winner / 1st'};if(rank===2)return {type:'runner_up',label:'Runner-up / 2nd'};if(rank<=Math.max(3,Math.ceil(total*.35)))return {type:'finalist',label:`Finalist / ${rank}${rank===3?'rd':'th'}`};return {type:'participant',label:`Participant / ${rank} of ${total}`}}
function recordSchoolEventHistory4D3(c,record){
 S.school.eventHistory=Array.isArray(S.school.eventHistory)?S.school.eventHistory:[];const key=`${c.eventId}|${record.status}`;if(!S.school.eventHistory.some(x=>x.key===key))S.school.eventHistory.unshift({key,eventId:c.eventId,name:c.name,category:c.category,status:record.status,result:record.label||record.reason||null,rank:record.rank??null,dateISO:currentDate(),schoolId:c.schoolId});if(S.school.eventHistory.length>80)S.school.eventHistory.length=80;
 if(record.status==='completed'&&record.rank<=2){S.milestones=S.milestones||[];if(!S.milestones.some(m=>m.eventId===c.eventId))S.milestones.unshift({eventId:c.eventId,dateISO:currentDate(),age:S.age,title:record.rank===1?`🏆 Won ${c.name}`:`🥈 Placed 2nd in ${c.name}`,text:`${record.label} at ${c.name}.`})}
}
function applyEventConsequences4D3(c,record,{simulated=false}={}){
 const rep=c.category==='sports_event'?'athletic':c.category==='arts_performance'?'creative':'academic',top=record.rank===1,strong=record.rank<=3;addRep(rep,top?6:strong?3:1);S.happiness=clamp(S.happiness+(top?10:strong?5:1));if(record.rank<=2&&typeof teacherOpinion4B4==='function'){const sub=eventPrimarySubject4D3(c);if(sub)ensureTeacher(sub).rel=clamp((ensureTeacher(sub).rel||50)+(top?3:2))}devContestResult(c,record.score);recordSchoolEventHistory4D3(c,record);if(SIM.summary)SIM.summary.contests.push({name:c.name,result:record.label});if(!simulated){const text=top?`Your preparation pays off — you finish first in a field of ${record.fieldSize}.`:strong?`You finish ${record.label.toLowerCase()} against a competitive field.`:`You complete the event and learn what the stronger entries looked like.`;log(top?'🏆 '+c.name:strong?'⭐ '+c.name:'🎖️ '+c.name,`${text} (${record.label})`,top)}
}
function resolveSchoolEventResult4D3(idOrEvent,{late=0,simulated=false}={}){
 const c=typeof idOrEvent==='object'?idOrEvent:schoolEventById4D1(idOrEvent);if(!c)return {ok:false,reason:'event-missing'};normalizeSchoolEventParticipation4D3(c);if(c.resultRecord&&c.lifecycleState==='completed')return {ok:true,event:c,result:c.resultRecord,unchanged:true};if(!['participating','registered','preparing'].includes(c.lifecycleState))return {ok:false,reason:'state-'+c.lifecycleState};if(c.lifecycleState!=='participating'){const t=transitionSchoolEvent4D1(c,'participating',{reason:'Event participation began'});if(!t.ok)return t}
 const field=buildOpponentField4D3(c),f=eventResultFactors4D3(c,{late}),score=Math.round(f.score*10)/10,rank=1+field.filter(o=>Number(o.strength)>score).length,total=field.length+1,label=resultLabel4D3(rank,total),record={status:'completed',score,rank,fieldSize:total,type:label.type,label:label.label,fieldAverage:Math.round(field.reduce((a,b)=>a+Number(b.strength||0),0)/Math.max(1,field.length)*10)/10,factors:{prep:Math.round(f.prep),skill:Math.round(f.skill),smart:Math.round(f.smart),health:Math.round(f.health),energy:Math.round(f.energy),stress:Math.round(f.stress),support:Math.round(f.support),experience:Math.round(f.experience),workbook:Math.round((f.workbookBonus||0)*10)/10,workbookSubject:f.workbookSubject||null},resolvedAt:{dateISO:currentDate(),minute:currentMinute()}};
 c.resultRecord=record;c.result=record.label;transitionSchoolEvent4D1(c,'completed',{reason:`Result: ${record.label}`});c.resolvedAt=record.resolvedAt;applyEventConsequences4D3(c,record,{simulated});return {ok:true,event:c,result:record}
}
function schoolEventCampusAccess4D3(dateISO=currentDate(),minute=currentMinute()){
 if(!S.school||S.location!=='School')return false;const sid=playerCurrentSchoolId4A2?.()||null;return (S.calendar||[]).some(ev=>{if(ev.type!=='schoolEvent'||ev.dateISO!==dateISO||isTerminal(ev.status))return false;const c=contestById(ev.payload?.contestId||ev.payload?.schoolEventId);if(!c||c.schoolId!==sid||!['registered','preparing','participating'].includes(c.lifecycleState))return false;return minute>=Math.max(0,Number(ev.startMinute||0)-180)&&minute<=Math.min(1439,Number(ev.endMinute||0)+60)})
}
function schoolEventVenueGate4D3(c,ev){
 const loc=String(c.location||ev?.location||'School');if(/school|hall|gym|field|campus/i.test(loc)){if(typeof playerAtSchool4C1==='function'&&!playerAtSchool4C1())return {ok:false,reason:'You need to be physically at school / the school venue before participating.'};return {ok:true,mode:'school'}}if(String(S.location||'').toLowerCase()===loc.toLowerCase())return {ok:true,mode:'venue'};return {ok:false,reason:`You are not at the event location (${loc}).`}
}
function attendSchoolEvent4D3(contestId){
 const c=schoolEventById4D1(contestId);if(!c)return {ok:false,reason:'event-missing'};normalizeSchoolEventParticipation4D3(c);if(!['registered','preparing'].includes(c.lifecycleState))return {ok:false,reason:'state-'+c.lifecycleState};const ev=contestEvent(c)||contestCalendar(c);if(ev.dateISO>currentDate()){toast(`${c.name} is on ${formatDate(ev.dateISO)}.`);return {ok:false,reason:'future'}}if(ev.dateISO<currentDate()||currentMinute()>ev.graceMinute){processCalendar();toast('Check-in has closed.');return {ok:false,reason:'closed'}}if(currentMinute()<ev.startMinute){if(ev.startMinute-currentMinute()>180){toast(`Check-in opens at ${timeLabel(ev.startMinute)}.`);return {ok:false,reason:'too-early'}}advanceTime(ev.startMinute-currentMinute(),{silent:true})}
 const venue=schoolEventVenueGate4D3(c,ev);if(!venue.ok){toast(venue.reason);return {ok:false,reason:'wrong-location',detail:venue.reason}}if(S.age<13&&!caregiverApproval(30)){log('No ride',`${primaryCaregiver()} cannot get you to ${c.name} in time.`);return resolveSchoolEventAttendance4D3(ev,'Withdrew')}
 const conflict=typeof timedSchoolConflict4C4==='function'?timedSchoolConflict4C4(ev.dateISO,ev.startMinute,ev.endMinute,ev.id):null;if(conflict&&conflict.type!=='schoolDay'){toast(`Schedule conflict with ${conflict.title}.`);return {ok:false,reason:'schedule-conflict',conflictId:conflict.id}}
 setCalendarStatus(ev,'Attending','Checked in');transitionSchoolEvent4D1(c,'participating',{reason:'Checked in at event'});const late=Math.max(0,currentMinute()-ev.startMinute);advanceTime(Math.max(45,ev.endMinute-currentMinute()),{silent:true});const r=resolveSchoolEventResult4D3(c,{late});setCalendarStatus(ev,'Attended',late?'Arrived late':'Attended');return r
}
function resolveSchoolEventAttendance4D3(ev,status,{simulated=false}={}){
 const c=contestById(ev?.payload?.contestId||ev?.payload?.schoolEventId);if(ev)setCalendarStatus(ev,status,status==='No-show'?'Did not check in':'Withdrew');if(!c)return {ok:false,reason:'event-missing'};normalizeSchoolEventParticipation4D3(c);
 if(status==='No-show'){
  if(['declined','registration_missed','withdrawn','completed','eliminated','disqualified','archived'].includes(c.lifecycleState))return {ok:true,unchanged:true,event:c};const tr=transitionSchoolEvent4D1(c,'missed',{reason:'Registered but did not attend'});if(!tr.ok)return tr;c.result='Did not attend';const rec={status:'missed',reason:'Did not attend',label:'Missed',resolvedAt:{dateISO:currentDate(),minute:currentMinute()}};c.resultRecord=rec;recordSchoolEventHistory4D3(c,rec);S.stress=clamp(S.stress+2);S.social.reputation=clamp((S.social?.reputation||50)-1);if(!simulated)log(`Missed • ${c.name}`,'You were registered, but the check-in window closes without you.');return {ok:true,event:c,state:'missed'}
 }
 if(status==='Withdrew'){if(['registered','preparing'].includes(c.lifecycleState))transitionSchoolEvent4D1(c,'withdrawn',{reason:'Unable to attend'});c.result='Withdrew';const rec={status:'withdrawn',reason:'Unable to attend',label:'Withdrawn',resolvedAt:{dateISO:currentDate(),minute:currentMinute()}};c.resultRecord=c.resultRecord||rec;recordSchoolEventHistory4D3(c,rec);if(!simulated)log(`Withdrew • ${c.name}`,'You could not take part this time.');return {ok:true,event:c,state:'withdrawn'}}return {ok:false,reason:'attendance-status-invalid'}
}
function migrateSchoolEventParticipation4D3(){if(!S.school)return {count:0};reconcileSchoolEventDiscovery4D2('4d3-migrate');for(const c of S.school.contests||[])normalizeSchoolEventParticipation4D3(c);S.school.eventHistory=Array.isArray(S.school.eventHistory)?S.school.eventHistory:[];return {count:S.school.contests.length,history:S.school.eventHistory.length}}
function reconcileSchoolEventParticipation4D3(reason='tick'){if(!S.school)return {count:0};for(const c of S.school.contests||[])normalizeSchoolEventParticipation4D3(c);return {count:S.school.contests.length,reason}}
function schoolEventActiveCard4D3(c){
 normalizeSchoolEventParticipation4D3(c);const ev=contestEvent(c),d=daysBetween(currentDate(),c.eventDate),live=ev&&ev.dateISO===currentDate()&&currentMinute()<=ev.graceMinute,opts=eventPreparationOptions4D3(c),sessions=eventPrepSessionsToday4D3(c),buttons=opts.slice(0,3).map(o=>{const g=eventPreparationLocationGate4D3(c,o);return `<button class="small ghost" data-contest-prep4d3="${esc(o.id)}" data-contest-id4d3="${esc(c.id)}" ${sessions>=3||(c.prep||0)>=100||!g.ok?'disabled':''}>${esc(o.label)}</button>`}).join('');return `<div class="commitment-card"><div><b>${esc(c.name)}</b><small>${d<=0?`Today • check-in ${timeLabel(ev?.startMinute??600)}–${timeLabel(ev?.graceMinute??690)}`:`Event in ${d} day${d===1?'':'s'} • ${formatDate(c.eventDate)}`} • preparation ${Math.round(c.prep||0)}% • ${sessions}/3 useful sessions today</small><div class="progress"><i style="width:${clamp(c.prep||0)}%"></i></div></div><div class="inline-actions">${live?`<button class="small primary" data-contest-attend="${c.id}">Go to the event</button>`:''}${buttons}<button class="small ghost" data-contest-withdraw="${c.id}">Withdraw</button></div></div>`
}
function schoolEventParticipationClick4D3(b){if(b.dataset.contestPrep4d3){const r=prepareSchoolEvent4D3(b.dataset.contestId4d3,b.dataset.contestPrep4d3);if(!r.ok)toast(r.detail||r.reason);save();render();return true}return false}
