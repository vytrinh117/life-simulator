// =====================================================================
// PHASE 5C.1 — CANONICAL SEASONAL ACTIVITY FOUNDATION
// Reuses S.plans + Calendar + People + H3 Decision Ledger + Phase 3B.
// Detailed skiing/beach/scuba/camping outcomes belong to 5C.2/5C.3.
// =====================================================================
const SEASONAL_SCHEMA_5C1=1;
const SEASONAL_ACTIVITY_DEFS_5C1={
 beach_day:{activityId:'beach_day',name:'Beach outing',seasons:['summer'],minAge:3,locations:['Beach'],duration:240,cost:18,socialModes:['alone','family','friend','partner'],permission:{under:16},travelTags:['warm_coast'],phase:'5C.2'},
 casual_swim:{activityId:'casual_swim',name:'Casual swimming',seasons:['summer'],minAge:4,locations:['Beach','Pool'],duration:90,cost:5,socialModes:['alone','family','friend','partner'],permission:{under:13},travelTags:['warm_coast'],phase:'5C.2'},
 sunbathe:{activityId:'sunbathe',name:'Sunbathe',seasons:['summer'],minAge:10,locations:['Beach'],duration:75,cost:0,socialModes:['alone','friend','partner'],permission:{under:13},travelTags:['warm_coast'],phase:'5C.2'},
 scuba_outing:{activityId:'scuba_outing',name:'Scuba outing',seasons:['summer'],minAge:13,locations:['Beach','Dive Center'],duration:240,cost:95,socialModes:['family','friend','partner'],permission:{under:18,highRisk:true},travelTags:['warm_coast','dive_access'],phase:'5C.2'},
 ski_day:{activityId:'ski_day',name:'Ski day',seasons:['winter'],minAge:6,locations:['Ski Resort'],duration:300,cost:90,socialModes:['family','friend','partner'],permission:{under:18,highRisk:true},travelTags:['snow_destination'],phase:'5C.2'},
 build_snowman:{activityId:'build_snowman',name:'Build a snowman',seasons:['winter'],minAge:3,locations:['Snow Park','Home'],duration:90,cost:0,socialModes:['alone','family','friend','partner'],permission:{under:8},travelTags:['snow_destination'],phase:'5C.2'},
 camping_weekend:{activityId:'camping_weekend',name:'Camping trip',seasons:['autumn'],minAge:6,locations:['Campground'],duration:720,cost:35,socialModes:['family','friend','group','partner'],permission:{under:18,overnight:true},travelTags:['campground'],phase:'5C.3'},
 autumn_hike:{activityId:'autumn_hike',name:'Autumn hike',seasons:['autumn'],minAge:7,locations:['Hiking Trail'],duration:180,cost:5,socialModes:['alone','family','friend','group','partner'],permission:{under:13},travelTags:['outdoor_trail'],phase:'5C.3'}
};
function ensureSeasonalState5C1(){
 S.seasonal5C1=S.seasonal5C1&&typeof S.seasonal5C1==='object'?S.seasonal5C1:{};
 S.seasonal5C1.schema=SEASONAL_SCHEMA_5C1;
 S.seasonal5C1.rsvps=S.seasonal5C1.rsvps&&typeof S.seasonal5C1.rsvps==='object'?S.seasonal5C1.rsvps:{};
 S.seasonal5C1.history=Array.isArray(S.seasonal5C1.history)?S.seasonal5C1.history:[];
 return S.seasonal5C1
}
function seasonalActivities5C1(){return Object.values(SEASONAL_ACTIVITY_DEFS_5C1).map(x=>({...x,locations:[...x.locations],seasons:[...x.seasons],socialModes:[...x.socialModes],travelTags:[...(x.travelTags||[])]}))}
function seasonalActivityDefinition5C1(id){return SEASONAL_ACTIVITY_DEFS_5C1[id]||null}
function seasonForDate5C1(dateISO=currentDate()){
 const m=parseISO(dateISO).getUTCMonth()+1,south=calendarProfile?.().country==='Australia';
 const north=m<=2||m===12?'winter':m<=5?'spring':m<=8?'summer':'autumn';
 return south?({winter:'summer',summer:'winter',spring:'autumn',autumn:'spring'})[north]:north
}
function seasonalTravelTags5C1(dateISO=currentDate()){
 if(!(typeof onTrip==='function'&&onTrip(dateISO)))return [];
 const explicit=Array.isArray(S.trip?.seasonalTags)?S.trip.seasonalTags:[];
 const dest=String(S.trip?.dest||'').toLowerCase(),tags=[...explicit];
 if(/beach|coast|caribbean|cruise/.test(dest))tags.push('warm_coast');
 if(/camp|campsite|lake cabin/.test(dest))tags.push('campground','outdoor_trail');
 return [...new Set(tags)]
}
function seasonalSeasonGate5C1(def,dateISO=currentDate()){
 if(!def)return {ok:false,reason:'Unknown seasonal activity.'};const s=seasonForDate5C1(dateISO);
 if((def.seasons||[]).includes(s))return {ok:true,season:s,travelOverride:false};
 const tags=seasonalTravelTags5C1(dateISO),match=(def.travelTags||[]).some(t=>tags.includes(t));
 return match?{ok:true,season:s,travelOverride:true,travelTags:tags}:{ok:false,season:s,reason:`${def.name} is not normally available in ${s}.`}
}
function normalizeSeasonalLocation5C1(x){return String(x||'').trim().toLowerCase()}
function seasonalLocationGate5C1(def,location=S.location,dateISO=currentDate()){
 if(!def)return {ok:false,reason:'Unknown seasonal activity.'};const here=normalizeSeasonalLocation5C1(location),allowed=(def.locations||[]).map(normalizeSeasonalLocation5C1);
 if(allowed.includes(here))return {ok:true,location};
 if(here==='trip'){const tags=seasonalTravelTags5C1(dateISO),match=(def.travelTags||[]).some(t=>tags.includes(t));if(match)return {ok:true,location:'Trip',travelContext:true}}
 return {ok:false,reason:`${def.name} needs ${def.locations.join(' or ')} context.`}
}
function seasonalScheduleConflict5C1(dateISO,start,end,ignoreId=null){
 const committed=new Set(['schoolDay','exam','clubSession','schoolEvent','tryout','plan','workDay','program','wedding','prom','trip','election','leadershipSelection','conference']);
 return (S.calendar||[]).find(ev=>ev&&ev.id!==ignoreId&&ev.dateISO===dateISO&&!isTerminal(ev.status)&&Number.isFinite(Number(ev.startMinute))&&Number.isFinite(Number(ev.endMinute))&&(ev.required!==false||committed.has(ev.type))&&start<Number(ev.endMinute)&&Number(ev.startMinute)<end)||null
}
function seasonalActivityEligibility5C1(activityId,{dateISO=currentDate(),location=S.location,checkLocation=true,startMinute=null,ignoreCalendarId=null}={}){
 const def=seasonalActivityDefinition5C1(activityId);if(!def)return {ok:false,reason:'unknown_activity'};
 if(S.age<Number(def.minAge||0)||def.maxAge!=null&&S.age>Number(def.maxAge))return {ok:false,reason:'age',detail:`${def.name} is not appropriate at this age.`,activity:def};
 const sg=seasonalSeasonGate5C1(def,dateISO);if(!sg.ok)return {ok:false,reason:'season',detail:sg.reason,activity:def,season:sg.season};
 if(checkLocation){const lg=seasonalLocationGate5C1(def,location,dateISO);if(!lg.ok)return {ok:false,reason:'location',detail:lg.reason,activity:def,season:sg.season};}
 const start=startMinute==null?currentMinute():Number(startMinute),end=Math.min(1439,start+Number(def.duration||60)),conf=seasonalScheduleConflict5C1(dateISO,start,end,ignoreCalendarId);
 if(conf)return {ok:false,reason:'conflict',detail:`Schedule conflict with ${conf.title}.`,conflictId:conf.id,activity:def};
 return {ok:true,activity:def,season:sg.season,travelOverride:!!sg.travelOverride,startMinute:start,endMinute:end}
}
function seasonalParticipantGate5C1(personId,mode='friend'){
 if(mode==='alone')return {ok:true,mode,person:null};const p=personById(personId);if(!p||p.movedAway)return {ok:false,reason:'person_unavailable'};
 if(mode==='partner'){
  const c=typeof romanceCompatibility==='function'?romanceCompatibility(p):{eligible:false};const L=typeof ensureLove==='function'?ensureLove(p):null,stage=L?.stage||p.romanceStage||'none';const established=S.romance?.partnerId===p.id||['goingOut','official','engaged','married'].includes(stage);
  if(!c.eligible&&!established)return {ok:false,reason:'romance_ineligible',compatibility:c};if(!established)return {ok:false,reason:'not_partner',compatibility:c};return {ok:true,mode,person:p,compatibility:c,romantic:true}
 }
 if(isFamilyPerson(p)&&mode==='friend')return {ok:false,reason:'not_friend'};
 return {ok:true,mode,person:p,romantic:false}
}
function seasonalRsvpKey5C1(personId,activityId,slot){return `${personId}|${activityId}|${slot.dateISO}|${Number(slot.startMinute??slot.start??0)}`}
function seasonalRsvp5C1(personId,activityId,slot,{mode='friend'}={}){
 const st=ensureSeasonalState5C1(),gate=seasonalParticipantGate5C1(personId,mode);if(!gate.ok)return {ok:false,answer:'Declined',reason:gate.reason};const p=gate.person,key=seasonalRsvpKey5C1(personId,activityId,slot),old=st.rsvps[key];if(old)return {...old,reused:true};
 const def=seasonalActivityDefinition5C1(activityId),start=Number(slot.startMinute??slot.start??0),availability=npcStatusAt(p,slot.dateISO,start);let answer,why;
 if(!availability.free){answer='Declined';why=availability.why||'They are unavailable then.'}
 else {const traits=p.traits||[],base=(p.rel||0)*.55+(p.trust??50)*.25+(p.fun??50)*.12-(p.conflict||0)*.35+(traits.includes('Outgoing')?7:0)+(traits.includes('Busy')?-7:0)+(traits.includes('Shy')?-2:0)-(Number(def?.cost||0)>40?4:0),stable=(hashOf(`${key}|rsvp`)%17)-8,score=base+stable;answer=score>=48?'Accepted':'Declined';why=answer==='Accepted'?`"${traits.includes('Shy')?'Okay… that actually sounds nice.':'Yes, I’m in.'}"`:`"I can’t make that one. Maybe another time."`}
 const rec={key,personId,activityId,dateISO:slot.dateISO,startMinute:start,answer,why,createdDate:currentDate(),mode};st.rsvps[key]=rec;return {...rec,reused:false}
}
function seasonalPermissionNeeded5C1(def,slot){
 if(S.age>=18||!def)return false;const p=def.permission||{},end=Number(slot.startMinute??slot.start??0)+Number(def.duration||60),cf=typeof curfewMinute==='function'?curfewMinute():null;return S.age<Number(p.under??0)||!!p.highRisk||!!p.overnight||(cf!=null&&end>cf)
}
function seasonalPermissionContext5C1(def,slot,opts={}){const base={kind:'seasonalActivity',activityId:def.activityId,dateISO:slot.dateISO,startMinute:Number(slot.startMinute??slot.start??0),location:opts.location||def.locations?.[0]||'',cost:Number(def.cost||0),participantMode:opts.participantMode||'alone',personId:opts.personId||null,highRisk:!!def.permission?.highRisk,overnight:!!def.permission?.overnight};if(typeof seasonalPermissionContextExtension5C31==='function')Object.assign(base,seasonalPermissionContextExtension5C31(def,slot,opts)||{});return base}
function requestSeasonalPermission5C1(activityId,slot,opts={}){
 const def=seasonalActivityDefinition5C1(activityId);if(!def)return {ok:false,reason:'unknown_activity'};if(!seasonalPermissionNeeded5C1(def,slot))return {ok:true,required:false};
 const context=seasonalPermissionContext5C1(def,slot,opts),req=requestDecision({requestType:'seasonalActivityPermission',targetKey:`${activityId}:${slot.dateISO}:${Number(slot.startMinute??slot.start??0)}`,context,decide:(maker)=>{const r=familyRules(),wealth={Struggling:-14,Modest:-7,'Middle class':0,Comfortable:7,Wealthy:11,'Extremely wealthy':14}[S.wealth]||0,trust=S.family?.trust??60,responsibility=S.family?.responsibility||0,risk=def.permission?.highRisk?-18:0,overnight=def.permission?.overnight?-10:0,costPenalty=Math.min(18,Number(def.cost||0)/8),score=58-r.strictness*.22+(trust-50)*.28+responsibility*.18+wealth+risk+overnight-costPenalty,roll=hashOf(`${maker?.id||'guardian'}|${decisionContextSignature('seasonalActivityPermission',context.activityId,context)}`)%100,yes=roll<clamp(score,8,94);return {outcome:yes?'Yes':'No',reason:yes?`${decisionMakerLabel(maker)} approved the outing.`:`${decisionMakerLabel(maker)} did not approve this outing.`,resolved:true}}});
 const yes=['Yes','Approved'].includes(req.record?.outcome);return {ok:yes,required:true,reused:req.reused,record:req.record,makerId:req.record?.decisionMakerId||req.maker?.id||null,reason:req.record?.reason||req.error||''}
}
function seasonalPlanById5C1(id){return (S.plans||[]).find(p=>p.id===id&&p.seasonal5C1)||null}
function createSeasonalPlan5C1(activityId,{dateISO=currentDate(),startMinute=null,location=null,participantMode='alone',personId=null,participantIds=[],groupId=null,supervisorId=null,gearAccess=null}={}){
 ensureSeasonalState5C1();const def=seasonalActivityDefinition5C1(activityId);if(!def)return {ok:false,reason:'unknown_activity'};dateISO=dateISO||currentDate();startMinute=Number(startMinute??(dateISO===currentDate()?Math.max(currentMinute()+30,600):600));location=location||def.locations[0];const end=Math.min(1439,startMinute+def.duration);
 const outdoor=typeof seasonalOutdoorPlanGate5C31==='function'?seasonalOutdoorPlanGate5C31(activityId,{dateISO,startMinute,location,participantMode,personId,participantIds,groupId,supervisorId}):{ok:true,handled:false};if(!outdoor.ok)return outdoor;supervisorId=outdoor.supervisorId||supervisorId;
 const elig=seasonalActivityEligibility5C1(activityId,{dateISO,location,checkLocation:true,startMinute});if(!elig.ok)return elig;
 if(seasonalOutdoorDefinition5C31(activityId)){const outdoorGate=outdoorExecutionGate5C32(activityId,{dateISO,startMinute,location,participantMode,personId,participantIds,groupId,supervisorId,gearAccess});if(!outdoorGate.ok)return outdoorGate;}
 const social=typeof outdoorParticipants5C33==='function'&&seasonalOutdoorDefinition5C31(activityId)?outdoorParticipants5C33(activityId,{participantMode,personId,participantIds,groupId,dateISO,startMinute,supervisorId}):null;if(social&&!social.ok)return social;if(social&&activityId==='camping_weekend'&&S.age<13&&outdoor.supervisorId&&!social.acceptedIds.includes(outdoor.supervisorId))return {ok:false,reason:'supervisor_not_attending',responses:social.responses};const pGate=seasonalParticipantGate5C1(personId,participantMode==='group'?'alone':participantMode);if(!pGate.ok)return {ok:false,reason:pGate.reason,compatibility:pGate.compatibility||null};let rsvp=null;if(personId&&!social){rsvp=seasonalRsvp5C1(personId,activityId,{dateISO,startMinute},{mode:participantMode});if(rsvp.answer!=='Accepted')return {ok:false,reason:'rsvp_declined',rsvp}}
 const perm=requestSeasonalPermission5C1(activityId,{dateISO,startMinute},{location,participantMode,personId,supervisorId});if(!perm.ok)return {ok:false,reason:'permission_denied',permission:perm,rsvp,supervision:outdoor.supervision||null};
 const conflict=seasonalScheduleConflict5C1(dateISO,startMinute,end);if(conflict)return {ok:false,reason:'conflict',conflictId:conflict.id};
 const plan={id:uid('plan'),type:'seasonal',seasonal5C1:true,seasonalActivityId:activityId,title:personId?`${def.name} with ${displayName(pGate.person)}`:def.name,personId:personId||null,participantIds:social?social.acceptedIds:(personId?[personId]:[]),groupId:social?.groupId||null,participantRsvps:social?.responses||null,participantMode,hostIsPlayer:true,dateISO,startMinute,endMinute:end,location,status:'Accepted',createdDate:currentDate(),cost:Number(def.cost||0),permissionDecisionId:perm.record?.id||null,rsvpKey:rsvp?.key||null,romanticContext:participantMode==='partner'};
 if(seasonalOutdoorDefinition5C31(activityId)){const span=outdoorInterval5C32(activityId,dateISO,startMinute);plan.endDateISO=span.endDateISO;plan.endMinute=span.endMinute;plan.durationMinutes=span.minutes;plan.gearAccess=gearAccess||null;}
 if(supervisorId)plan.supervisorId=supervisorId;if(outdoor.supervision?.source)plan.supervisionSource=outdoor.supervision.source;
 S.plans.unshift(plan);if(S.plans.length>80)S.plans.length=80;schedulePlanCalendar(plan);return {ok:true,plan,rsvp,permission:perm,supervision:outdoor.supervision||null}
}
function performSeasonalActivity5C1(activityId,{location=S.location,personId=null,participantMode='alone'}={}){
 const def=seasonalActivityDefinition5C1(activityId),gate=seasonalActivityEligibility5C1(activityId,{location,checkLocation:true});if(!gate.ok)return gate;const pGate=seasonalParticipantGate5C1(personId,participantMode);if(!pGate.ok)return {ok:false,reason:pGate.reason};if(S.age>=18&&def.cost&&!spendOwn(def.cost))return {ok:false,reason:'money',detail:`You need ${money(def.cost)}.`};
 const before={dateISO:currentDate(),minute:currentMinute()};advanceTime(def.duration,{silent:true});S.energy=clamp(S.energy-Math.max(4,Math.round(def.duration/45)));S.needs.fun=clamp(S.needs.fun+10);if(personId){S.needs.social=clamp(S.needs.social+8);pGate.person.rel=clamp((pGate.person.rel||0)+2);rememberPerson(pGate.person,`${def.name} together on ${formatDate(before.dateISO)}.`,1)}
 const rec={id:uid('seasonal'),activityId,dateISO:before.dateISO,startMinute:before.minute,endDateISO:currentDate(),endMinute:currentMinute(),location,participantMode,participantIds:personId?[personId]:[],romanticContext:participantMode==='partner'};ensureSeasonalState5C1().history.unshift(rec);if(S.seasonal5C1.history.length>80)S.seasonal5C1.history.length=80;return {ok:true,record:rec,minutes:def.duration}
}
function attendSeasonalPlan5C1(planId){
 const plan=seasonalPlanById5C1(planId);if(plan&&typeof validateOutdoorAttendance5C33==='function'&&seasonalOutdoorDefinition5C31(plan.seasonalActivityId)){const social=validateOutdoorAttendance5C33(plan);if(!social.ok)return social;}if(!plan||plan.status!=='Accepted')return {ok:false,reason:'inactive'};const def=seasonalActivityDefinition5C1(plan.seasonalActivityId);if(!def)return {ok:false,reason:'unknown_activity'};const ev=planEvent(plan);if(!ev||isTerminal(ev.status))return {ok:false,reason:'resolved'};if(plan.dateISO!==currentDate())return {ok:false,reason:'date'};if(currentMinute()<plan.startMinute){if(plan.startMinute-currentMinute()>120)return {ok:false,reason:'early'};advanceTime(plan.startMinute-currentMinute(),{silent:true})}if(currentMinute()>ev.graceMinute){processCalendar();return {ok:false,reason:'late'};}
 const seasonGate=seasonalSeasonGate5C1(def,currentDate());if(!seasonGate.ok)return {ok:false,reason:'season',detail:seasonGate.reason};const locGate=seasonalLocationGate5C1(def,plan.location,currentDate());if(!locGate.ok)return {ok:false,reason:'location',detail:locGate.reason};const conflict=seasonalScheduleConflict5C1(currentDate(),currentMinute(),Math.min(1439,currentMinute()+def.duration),ev.id);if(conflict)return {ok:false,reason:'conflict',conflictId:conflict.id};
 if(S.age>=18&&def.cost&&!spendOwn(def.cost))return {ok:false,reason:'money'};setCalendarStatus(ev,'Attending','Seasonal outing started');const old=S.location;S.location=plan.location;const result=performSeasonalActivity5C1(plan.seasonalActivityId,{location:plan.location,personId:plan.personId,participantMode:plan.participantMode});S.location=old==='Trip'?'Trip':'Home';if(!result.ok){setCalendarStatus(ev,'Scheduled','Could not start');return result}plan.status='Attended';setCalendarStatus(ev,'Attended','Attended');recordOutcome('Seasonal activity',plan.title,'Attended',`${def.name} at ${plan.location}.`);return {ok:true,planId:plan.id,record:result.record}
}
function createSeasonalNpcInvitation5C1(personId,activityId,{dateISO=null,startMinute=null,location=null,participantMode='friend',supervisorId=null}={}){
 const p=personById(personId),def=seasonalActivityDefinition5C1(activityId);if(!p||!def)return null;dateISO=dateISO||addDays(currentDate(),1);startMinute=Number(startMinute??840);location=location||def.locations[0];const outdoor=typeof seasonalOutdoorPlanGate5C31==='function'?seasonalOutdoorPlanGate5C31(activityId,{dateISO,startMinute,location,participantMode,personId,supervisorId}):{ok:true,handled:false};if(!outdoor.ok)return null;if(typeof outdoorInvitationCooldown5C33==='function'&&!outdoorInvitationCooldown5C33(personId,activityId,dateISO))return null;supervisorId=outdoor.supervisorId||supervisorId;const elig=seasonalActivityEligibility5C1(activityId,{dateISO,location,checkLocation:true,startMinute});if(!elig.ok)return null;const pGate=seasonalParticipantGate5C1(personId,participantMode);if(!pGate.ok)return null;const conf=seasonalScheduleConflict5C1(dateISO,startMinute,Math.min(1439,startMinute+def.duration));if(conf)return null;const plan={id:uid('plan'),type:'seasonal',seasonal5C1:true,seasonalActivityId:activityId,title:`${def.name} with ${displayName(p)}`,personId:p.id,participantIds:[p.id],participantMode,hostIsPlayer:false,dateISO,startMinute,endMinute:Math.min(1439,startMinute+def.duration),location,status:'Pending',createdDate:currentDate(),cost:Number(def.cost||0),romanticContext:participantMode==='partner'};if(supervisorId)plan.supervisorId=supervisorId;if(outdoor.supervision?.source)plan.supervisionSource=outdoor.supervision.source;if(typeof outdoorInvitationStamp5C33==='function')outdoorInvitationStamp5C33(personId,activityId);S.plans.unshift(plan);queueEvent({type:'seasonalInvitation5C1',title:`${displayName(p)} invites you: ${def.name.toLowerCase()}`,text:`${formatDate(dateISO)} at ${timeLabel(startMinute)} • ${location}.`,participants:[p.id],payload:{planId:plan.id},priority:3,expiresDays:2,choices:[{id:'accept',label:'Accept'},{id:'decline',label:'Decline'}]});return plan
}
function seasonalActivityEventChoice5C1(e,id){
 if(e.type!=='seasonalInvitation5C1')return false;const plan=seasonalPlanById5C1(e.payload?.planId),p=plan&&personById(plan.personId);if(!plan)return true;if(id!=='accept'){plan.status='Declined';if(p)rememberPerson(p,`You declined ${plan.title}.`,1);return true}const outdoor=typeof seasonalOutdoorPlanGate5C31==='function'?seasonalOutdoorPlanGate5C31(plan.seasonalActivityId,{dateISO:plan.dateISO,startMinute:plan.startMinute,location:plan.location,participantMode:plan.participantMode,personId:plan.personId,participantIds:plan.participantIds,supervisorId:plan.supervisorId}):{ok:true};if(!outdoor.ok){plan.status='Declined';plan.reason=outdoor.reason;return true}if(outdoor.supervisorId)plan.supervisorId=outdoor.supervisorId;if(typeof validateOutdoorInvitation5C33==='function'){const valid=validateOutdoorInvitation5C33(plan);if(!valid.ok){plan.status='Declined';plan.reason=valid.reason;return true}}const perm=requestSeasonalPermission5C1(plan.seasonalActivityId,{dateISO:plan.dateISO,startMinute:plan.startMinute},{location:plan.location,participantMode:plan.participantMode,personId:plan.personId,supervisorId:plan.supervisorId});if(!perm.ok){plan.status='Declined';plan.reason='Permission denied';return true}const conf=seasonalScheduleConflict5C1(plan.dateISO,plan.startMinute,plan.endMinute);if(conf){plan.status='Declined';plan.reason=`Schedule conflict with ${conf.title}`;return true}plan.status='Accepted';plan.permissionDecisionId=perm.record?.id||null;schedulePlanCalendar(plan);return true
}
function migrateSeasonalActivities5C1(){
 const st=ensureSeasonalState5C1(),seen=new Set();const clean={};for(const [k,v] of Object.entries(st.rsvps||{})){if(!v||!v.personId||!v.activityId||!v.dateISO)continue;const key=seasonalRsvpKey5C1(v.personId,v.activityId,{dateISO:v.dateISO,startMinute:v.startMinute});if(seen.has(key))continue;seen.add(key);clean[key]={key,personId:v.personId,activityId:v.activityId,dateISO:v.dateISO,startMinute:Number(v.startMinute)||0,answer:v.answer==='Accepted'?'Accepted':'Declined',why:String(v.why||''),createdDate:v.createdDate||v.dateISO,mode:v.mode||'friend'}}st.rsvps=clean;
 const histSeen=new Set();st.history=(st.history||[]).filter(x=>{if(!x||!x.activityId||!x.dateISO)return false;const id=x.id||`seasonal:${x.activityId}:${x.dateISO}:${x.startMinute||0}:${(x.participantIds||[]).join(',')}`;if(histSeen.has(id))return false;histSeen.add(id);x.id=id;x.participantIds=Array.isArray(x.participantIds)?x.participantIds:[];return true});
 for(const p of S.plans||[]){if(!p?.seasonalActivityId||!seasonalActivityDefinition5C1(p.seasonalActivityId))continue;p.seasonal5C1=true;p.type='seasonal';p.participantIds=Array.isArray(p.participantIds)?p.participantIds:(p.personId?[p.personId]:[]);p.participantMode=p.participantMode|| (p.personId?'friend':'alone');p.cost=Number.isFinite(Number(p.cost))?Number(p.cost):Number(seasonalActivityDefinition5C1(p.seasonalActivityId).cost||0)}
 return st
}
