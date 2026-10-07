// =====================================================================
// PHASE 3B.2 — Ask Out / NPC Initiative / Scheduling / Date Lifecycle
// Reuses Phase 3A People, H3 Decision Ledger, K scheduling/calendar, and
// the existing state-aware date scene. No Phase 3B.3 commitment/breakup work.
// =====================================================================
const ROMANCE_DATE_ACTIVITIES={
 cafe:{label:'Café',placeId:'cafe',location:'the cafe',minutes:90,cost:12,minAge:13},
 restaurant:{label:'Restaurant',placeId:'restaurant',location:'the restaurant',minutes:120,cost:22,minAge:13},
 park:{label:'Park date',placeId:'park',location:'the park',minutes:90,cost:0,minAge:13,outdoor:true},
 picnic:{label:'Picnic',placeId:'park',location:'the park',minutes:120,cost:6,minAge:13,outdoor:true},
 mall:{label:'Mall',placeId:'mall',location:'the mall',minutes:150,cost:8,minAge:13},
 movie:{label:'Movie',placeId:'cinema',location:'the cinema',minutes:180,cost:18,minAge:13},
 walk:{label:'Walk together',placeId:'park',location:'the park',minutes:75,cost:0,minAge:13,outdoor:true},
 casualMeal:{label:'Casual meal',placeId:'restaurant',location:'a casual restaurant',minutes:90,cost:14,minAge:13}
};
let romanceDateDraft=null;
function ensureRomance3B2State(){
 S.romance=S.romance||{};S.romance.dateHistory=Array.isArray(S.romance.dateHistory)?S.romance.dateHistory:[];
 if(S.romance.dateHistory.length>80)S.romance.dateHistory=S.romance.dateHistory.slice(-80);
 for(const p of S.people||[]){const L=ensureLove(p);L.dateHistory=Array.isArray(L.dateHistory)?L.dateHistory:[];if(L.dateHistory.length>24)L.dateHistory=L.dateHistory.slice(-24);L.inviteHistory=Array.isArray(L.inviteHistory)?L.inviteHistory:[];if(L.inviteHistory.length>20)L.inviteHistory=L.inviteHistory.slice(-20)}
}
function migrateRomance3B2(){
 if(!S)return;ensureRomance3B2State();
 for(const plan of S.plans||[]){if(plan.romantic){plan.inviter=plan.inviter|| (plan.hostIsPlayer?'player':plan.personId);plan.acceptanceState=plan.acceptanceState||plan.status;plan.transportHook=plan.transportHook||'existing-world-movement';plan.activityId=plan.activityId||romanceActivityFromPlan(plan)?.id||'walk'}}
 S.romance3B2Migrated=true;if(typeof migrateRomance3B3==='function')migrateRomance3B3()
}
function romanceActivityFromPlan(plan){if(!plan)return null;if(plan.activityId&&ROMANCE_DATE_ACTIVITIES[plan.activityId])return {id:plan.activityId,...ROMANCE_DATE_ACTIVITIES[plan.activityId]};const x=Object.entries(ROMANCE_DATE_ACTIVITIES).find(([,a])=>a.location===plan.location);return x?{id:x[0],...x[1]}:null}
function dateActivitiesFor(p){
 ensureRomance3B2State();const recent=(ensureLove(p).dateHistory||[]).slice(-3).map(x=>x.activityId),last=recent.at(-1),traits=p.traits||[];
 let arr=Object.entries(ROMANCE_DATE_ACTIVITIES).filter(([,a])=>S.age>=a.minAge&&(!a.outdoor||!['Stormy'].includes(S.weather?.type))).map(([id,a])=>({id,...a}));
 const pref=a=>(traits.includes('Shy')||traits.includes('Quiet'))&&['cafe','walk','park'].includes(a.id)?4:traits.includes('Outgoing')&&['mall','movie','restaurant'].includes(a.id)?4:traits.includes('Practical')&&a.cost<=12?3:traits.includes('Romantic')&&['picnic','cafe','restaurant'].includes(a.id)?4:0;
 arr.sort((a,b)=>(b.id!==last?3:0)+pref(b)-((a.id!==last?3:0)+pref(a)));return arr
}
function romanceDatePayment(p,activity,inviter){
 if(!activity?.cost)return {mode:'free',totalCost:0,playerCost:0,label:'Free activity'};
 const traits=p.traits||[],h=hashOf(`${p.id}|${currentDate()}|${activity.id}|${inviter}`)%100;let mode;
 if(traits.includes('Generous')&&h<55)mode='npc';else if(inviter==='npc'&&h<48)mode='npc';else if(inviter==='player'&&h<38)mode='player';else mode='split';
 const playerCost=mode==='npc'?0:mode==='split'?Math.ceil(activity.cost/2):activity.cost;
 return {mode,totalCost:activity.cost,playerCost,label:mode==='npc'?`${firstName(p)} offers to treat`:mode==='player'?'You plan to treat':'Split the bill'}
}
function romanceCalendarConflict(dateISO,start,end,excludeId=null){
 const committed=new Set(['schoolDay','exam','clubSession','schoolEvent','tryout','plan','workDay','wedding','prom']);
 return (S.calendar||[]).find(ev=>ev.id!==excludeId&&ev.dateISO===dateISO&&!isTerminal(ev.status)&&ev.startMinute!=null&&ev.endMinute!=null&&(ev.required!==false||committed.has(ev.type))&&start<ev.endMinute&&ev.startMinute<end)||null
}
function conflictText3B2(ev){return ev?`${ev.title} • ${formatDate(ev.dateISO)} • ${timeLabel(ev.startMinute)}–${timeLabel(ev.endMinute)}${ev.location?` • ${ev.location}`:''}`:''}
function romanceDateSlots(p,day,activity){return sharedSlots(p,day,activity.minutes).filter(m=>!romanceCalendarConflict(day,m,Math.min(1439,m+activity.minutes)))}
function romanceDateDays(p,activity){const out=[];for(let i=0;i<14;i++){const d=addDays(currentDate(),i);if(romanceDateSlots(p,d,activity).length)out.push(d)}return out}
function romanticAskCooldownActive(p){const until=ensureLove(p).askCooldownUntil;return !!(until&&currentDate()<until)}
function romanceAskOut3B2(p){
 if(!p||!eligibleRomance(p))return;ensureRomanceProfile(p);const c=romanceCompatibility(p),L=ensureLove(p);
 if(S.romance.partnerId&&S.romance.partnerId!==p.id){log('Not like this',`You are already in a relationship with ${S.romance.partner}.`);return}
 if(!c.orientationOK){p.loveKnown=true;L.npcInterest='incompatible';L.mutual=false;log(`${firstName(p)}`,`"I really like you, but not in that way," ${firstName(p)} says kindly.`);return}
 if(c.committedElsewhere){log('Not available',`${firstName(p)} is already in a committed relationship.`);return}
 if(romanticAskCooldownActive(p)){log('Not yet',`${firstName(p)} has already given you an answer recently. Give it some time before asking again.`);return}
 setPlayerCrush(p,true);openRomanceDatePlanner3B2(p.id,true)
}
function openRomanceDatePlanner3B2(personId,reset=false){
 const p=personById(personId);if(!p||!eligibleRomance(p))return;if(reset||!romanceDateDraft||romanceDateDraft.personId!==p.id)romanceDateDraft={personId:p.id,activityId:null,day:null,time:null};const d=romanceDateDraft;
 if(!d.activityId){const acts=dateActivitiesFor(p).slice(0,6);openModal(`Ask ${displayName(p)} on a date`,`<p class="muted-text">Pick something that fits both of you. Choosing a free time does not make ${firstName(p)} agree.</p><div class="modal-action-grid">${acts.map(a=>`<button data-date-step="activity" data-v="${a.id}" data-person-id="${p.id}">${esc(a.label)}${a.cost?` • ${money(a.cost)}`:' • free'}</button>`).join('')}</div>`);return}
 const a={id:d.activityId,...ROMANCE_DATE_ACTIVITIES[d.activityId]};
 if(!d.day){const days=romanceDateDays(p,a).slice(0,8);openModal(`${a.label} with ${displayName(p)}`,`<h4>Choose a day</h4><div class="day-pick">${days.map(x=>`<button data-date-step="day" data-v="${x}" data-person-id="${p.id}"><b>${x===currentDate()?'Today':x===addDays(currentDate(),1)?'Tomorrow':new Date(x+'T00:00:00Z').toLocaleDateString(undefined,{weekday:'short',timeZone:'UTC'})}</b><small>${formatDate(x)}</small></button>`).join('')||'<p class="muted-text">No shared free time in the next two weeks.</p>'}</div><button class="ghost" data-date-step="back" data-person-id="${p.id}">Back</button>`);return}
 const slots=romanceDateSlots(p,d.day,a).slice(0,14);openModal(`Find a time we're both free`,`<p class="muted-text">Availability only finds a possible slot. ${firstName(p)} still decides whether they want the date.</p><p>${formatDate(d.day)} • ${esc(a.label)} • about ${a.minutes} min</p><div class="time-chips">${slots.map(m=>`<button class="small" data-date-step="time" data-v="${m}" data-person-id="${p.id}">${timeLabel(m)} ✓</button>`).join('')||'<span class="muted-text">No shared free slot.</span>'}</div><div class="modal-action-grid"><button class="ghost" data-date-step="back-day" data-person-id="${p.id}">Choose another day</button></div>`)
}
function romanceDateDecisionContext(p,a,day,start){return {kind:'dateProposal',activityId:a.id,dateISO:day,startMinute:start,romanceStage:ensureLove(p).stage}}
function romanceDateResponse(p,a,day,start){
 const L=ensureLove(p),ctx=romanceDateDecisionContext(p,a,day,start),prior=findDecision('romanceDateAsk',p.id,ctx,p.id);if(prior)return {kind:prior.outcome==='Accepted'?'yes':prior.outcome==='Counter'?'counter':prior.outcome==='Maybe'?'maybe':'no',why:prior.reason,prior,day:prior.counterCondition?.dateISO,time:prior.counterCondition?.startMinute};
 const c=romanceCompatibility(p);let kind='no',why='';
 if(!c.ageOK)why='"I do not think this is appropriate for us."';
 else if(!c.orientationOK)why='"I really like you, but not in that way."';
 else if(c.committedElsewhere)why='"I am already seeing someone."';
 else if((p.conflict||0)>=45)why='"I think we need to sort some things out before calling this a date."';
 else if((p.trust||0)<32)why='"I do not know if I am ready for that yet."';
 else {const traits=p.traits||[],busy=(p.goals||[]).includes('goodGrades')&&needsFormalSchool()&&isSchoolDay(day),score=c.score+(L.npcInterest==='reciprocates'?14:0)+(L.playerCrush?2:0)+(traits.includes('Bold')?5:0)-(traits.includes('Shy')?3:0)-(busy?7:0)+Math.random()*14-7;
  if(score>=67){kind='yes';why=traits.includes('Shy')?`"Yeah… I'd like that," ${firstName(p)} says, smiling.`:`"Yes. That sounds really nice," ${firstName(p)} says.`}
  else if(score>=55){const alt=romanceDateSlots(p,day,a).find(m=>m!==start)??romanceDateSlots(p,addDays(day,1),a)[0];if(alt!=null){kind='counter';const ad=romanceDateSlots(p,day,a).includes(alt)?day:addDays(day,1);return recordRomanceDateDecision(p,ctx,'Counter',`"I can't do that time. What about ${formatDate(ad)} at ${timeLabel(alt)}?"`,{dateISO:ad,startMinute:alt})}kind='maybe';why='"Maybe later? This week is a lot."'}
  else if(score>=46){kind='maybe';why='"Maybe later? I want to think about it."'}
  else why=L.npcAttraction<40?'"You are great, but I do not feel that kind of spark."':busy?'"I have too much going on right now."':'"Can we stay friends for now?"';
 }
 return recordRomanceDateDecision(p,ctx,kind==='yes'?'Accepted':kind==='maybe'?'Maybe':'No',why)
}
function recordRomanceDateDecision(p,ctx,outcome,reason,counterCondition=null){
 const days=outcome==='No'?(p.boundaries?.includes('needsTime')?21:10):outcome==='Maybe'?7:outcome==='Counter'?3:0,rec=recordDecision({requestType:'romanceDateAsk',targetKey:p.id,decisionMakerId:p.id,context:ctx,outcome,reason,counterCondition,reconsiderAfter:days?addDays(currentDate(),days):null,resolved:true});
 if(days)ensureLove(p).askCooldownUntil=addDays(currentDate(),days);return {kind:outcome==='Accepted'?'yes':outcome==='Counter'?'counter':outcome==='Maybe'?'maybe':'no',why:reason,prior:rec,day:counterCondition?.dateISO,time:counterCondition?.startMinute}
}
function makeRomanceDatePlan(p,a,day,start,{inviter='player',status='Accepted',reason='',payment=null}={}){
 const end=Math.min(1439,start+a.minutes),conf=romanceCalendarConflict(day,start,end);if(conf)return {conflict:conf};
 const inviterValue=inviter==='player'?'player':p.id,plan={id:uid('plan'),type:'date',romantic:true,activityId:a.id,title:`${a.label} date with ${displayName(p)}`,personId:p.id,hostIsPlayer:inviter==='player',inviter:inviterValue,acceptanceState:status,dateISO:day,startMinute:start,endMinute:end,expectedDuration:a.minutes,location:a.location,status,createdDate:currentDate(),reason,payment:payment||romanceDatePayment(p,a,inviter),transportHook:'existing-world-movement'};
 S.plans.unshift(plan);if(S.plans.length>60)S.plans.length=60;if(typeof noteMatchmakingPlan3B4==='function')noteMatchmakingPlan3B4(p,plan);if(status==='Accepted')schedulePlanCalendar(plan);thread('romanceDate',plan.id,plan.title,[p.id]);return {plan}
}
function submitRomanceDateProposal3B2(p,a,day,start){
 const end=Math.min(1439,start+a.minutes),conf=romanceCalendarConflict(day,start,end);if(conf){openModal('Schedule conflict',`<p>This date overlaps an existing commitment.</p><p><b>${esc(conflictText3B2(conf))}</b></p><p>Choose another slot; nothing was overwritten.</p><button data-date-step="back-day" data-person-id="${p.id}">Choose another time</button>`);return}
 const r=romanceDateResponse(p,a,day,start);closeChoiceModal();
 if(r.kind==='yes'){setNpcRomanticInterest(p,'reciprocates');const made=makeRomanceDatePlan(p,a,day,start,{inviter:'player',reason:r.why});if(made.conflict){log('Schedule conflict',conflictText3B2(made.conflict));return}threadStep(thread('romanceDate',made.plan.id,made.plan.title,[p.id]),'Accepted',r.why);log(`${firstName(p)} said yes`,`${r.why} ${made.plan.title} is scheduled for ${formatDate(day)} at ${timeLabel(start)}.`,true)}
 else if(r.kind==='counter'){openModal(`${firstName(p)} suggests another time`,`<p>${esc(r.why)}</p><div class="modal-action-grid"><button class="primary" data-date-counter="yes" data-person-id="${p.id}" data-activity="${a.id}" data-day="${r.day}" data-time="${r.time}">Accept</button><button data-date-counter="no" data-person-id="${p.id}">Decline</button></div>`)}
 else if(r.kind==='maybe'){log('Maybe later',r.why);rememberPerson(p,'They asked for more time before a date.')}
 else {p.rel=clamp(p.rel-1);log('Not this time',r.why);rememberPerson(p,'They declined a date invitation.',2)}
 romanceDateDraft=null;advanceTime(5,{silent:true})
}
function prepareRomanceDate3B2(planId){const plan=(S.plans||[]).find(x=>x.id===planId&&x.romantic);if(!plan||plan.status!=='Accepted'||plan.prepared)return false;plan.prepared=true;plan.preparedAt={dateISO:currentDate(),minute:currentMinute()};S.stress=clamp(S.stress-2);advanceTime(20,{silent:true});log('Getting ready',`You take a little time to get ready for your date with ${firstName(personById(plan.personId))}.`);return true}
function beginRomanceDateScene3B2(plan){
 const p=personById(plan.personId),a=romanceActivityFromPlan(plan);if(!p||!a)return false;const ev=planEvent(plan);if(!ev||isTerminal(ev.status))return false;
 if(plan.dateISO>currentDate()){toast(`That is on ${formatDate(plan.dateISO)}.`);return true}if(currentMinute()<plan.startMinute){if(plan.startMinute-currentMinute()>120){toast(`It starts at ${timeLabel(plan.startMinute)}.`);return true}advanceTime(plan.startMinute-currentMinute(),{silent:true})}if(currentMinute()>ev.graceMinute){processCalendar();toast('You are too late — they have moved on.');return true}
 let pay=plan.payment||romanceDatePayment(p,a,plan.inviter);plan.payment=pay;if(pay.playerCost>0&&!spendOwn(pay.playerCost)){plan.payment={mode:'fallback',totalCost:0,playerCost:0,label:'Changed to a free walk because money was tight'};plan.activityId='walk';plan.location=ROMANCE_DATE_ACTIVITIES.walk.location;plan.title=`Walk date with ${displayName(p)}`;log('Changed the date plan',`You cannot cover your part of the original plan, so you and ${firstName(p)} switch to a free walk instead.`)}
 setCalendarStatus(ev,'Attending','Arrived');plan.status='Attending';plan.actualStart={dateISO:currentDate(),minute:currentMinute()};noteOuting('date');adjustReliability(p,3);
 const aa=romanceActivityFromPlan(plan)||a,arrival=`You meet ${firstName(p)} at ${aa.location}. ${plan.payment?.label||''}`.trim();S.scene={id:uid('scene'),kind:'date',step:1,score:plan.prepared?54:50,lines:[arrival],data:{personId:p.id,planId:plan.id,place:aa.id,plannedActivity:true,payment:plan.payment}};renderScene();return true
}
function finishRomanceDate3B2(sc,p,tier){
 if(!sc?.data?.planId||!p)return;const plan=(S.plans||[]).find(x=>x.id===sc.data.planId);if(!plan)return;const ev=planEvent(plan);plan.status='Completed';plan.acceptanceState='Completed';plan.outcome=tier;plan.completedDate=currentDate();if(ev)completeCalendarEvent(ev,'Completed',tier);
 const L=ensureLove(p);L.npcAttraction=clamp(p.attraction??L.npcAttraction);L.dateHistory.push({planId:plan.id,dateISO:plan.dateISO,activityId:plan.activityId,outcome:tier,inviter:plan.inviter});if(L.dateHistory.length>24)L.dateHistory.shift();S.romance.dateHistory.push({planId:plan.id,personId:p.id,dateISO:plan.dateISO,activityId:plan.activityId,outcome:tier});if(S.romance.dateHistory.length>80)S.romance.dateHistory.shift();
 setPlayerCrush(p,true);setNpcRomanticInterest(p,'reciprocates');if(LOVE_IDX[L.stage]<LOVE_IDX.goingOut)setLoveStage(p,'goingOut','after your first date');if(typeof romanceDateProgress3B3==='function')romanceDateProgress3B3(p,tier,plan);if(typeof noteMatchmakingDateOutcome3B4==='function')noteMatchmakingDateOutcome3B4(p,plan,tier);addPersonMilestone(p,'firstDate',`${plan.title} — ${tier}.`);threadStep(thread('romanceDate',plan.id,plan.title,[p.id]),'Completed',tier,{resolve:true});rememberPerson(p,`${tier} at ${plan.location}.`,2)
}
function handleRomanceDateInvite3B2(e,id){
 const plan=(S.plans||[]).find(x=>x.id===e.payload?.planId&&x.romantic),p=plan&&personById(plan.personId);if(!plan||!p)return false;
 if(id==='decline'||id==='busy'){plan.status='Declined';plan.acceptanceState='Declined';ensureLove(p).nextInitiativeDate=addDays(currentDate(),id==='busy'?8:14);p.rel=clamp(p.rel+(id==='busy'?0:-1));threadStep(thread('romanceDate',plan.id,plan.title,[p.id]),'Declined',id==='busy'?'Player was busy':'Player declined',{resolve:true});log('Date invitation declined',id==='busy'?`You tell ${firstName(p)} you are busy. They take it fine.`:`You tell ${firstName(p)} no. They look disappointed, but respect the answer.`);return true}
 if(id==='maybe'){plan.status='Maybe';plan.playerMaybe=true;plan.acceptanceState='Maybe';plan.answerBy={dateISO:addDays(currentDate(),1),minute:1080};ensureLove(p).nextInitiativeDate=addDays(currentDate(),7);notify('Answer pending',`${plan.title} — ${formatDate(plan.dateISO)} at ${timeLabel(plan.startMinute)}.`,{sourceType:'plan',sourceId:plan.id,tab:'calendar'});log('Maybe',`You tell ${firstName(p)} you need time to decide.`);return true}
 const conf=romanceCalendarConflict(plan.dateISO,plan.startMinute,plan.endMinute);if(conf){plan.status='Declined';plan.acceptanceState='Schedule conflict';log('Schedule conflict',`You cannot accept without overlapping ${conflictText3B2(conf)}. Nothing was overwritten.`);return true}
 const perm=needsPermissionForRomanceDate3B2(plan);if(perm.need&&!caregiverYes(0)){plan.status='Declined';plan.acceptanceState='Permission denied';log('Not allowed',`Your caregiver says no (${perm.reasons.join(', ')}). You tell ${firstName(p)}, who understands.`);return true}
 plan.status='Accepted';plan.acceptanceState='Accepted';schedulePlanCalendar(plan);setPlayerCrush(p,true);setNpcRomanticInterest(p,'reciprocates');p.rel=clamp(p.rel+1);threadStep(thread('romanceDate',plan.id,plan.title,[p.id]),'Accepted','You accepted their invitation');log('Date scheduled',`${plan.title} • ${formatDate(plan.dateISO)} at ${timeLabel(plan.startMinute)}.`);return true
}
function needsPermissionForRomanceDate3B2(plan){if(S.age>=18)return {need:false,reasons:[]};const reasons=[],cf=curfewMinute();if(cf!=null&&plan.endMinute>cf)reasons.push(`it ends after your ${timeLabel(cf)} curfew`);if(S.age<16&&plan.startMinute>=1140)reasons.push('an evening date needs caregiver approval');return {need:reasons.length>0,reasons}}
function createNpcDateInvitation3B2(p,{activityId=null,day=null,start=null}={}){
 if(!p||!eligibleRomance(p)||S.romance?.optOut)return null;const c=romanceCompatibility(p);let L=ensureLove(p);if(!c.eligible||c.score<48||romanticAskCooldownActive(p)||L.nextInitiativeDate&&currentDate()<L.nextInitiativeDate)return null;
 const a=(activityId&&ROMANCE_DATE_ACTIVITIES[activityId]?{id:activityId,...ROMANCE_DATE_ACTIVITIES[activityId]}:dateActivitiesFor(p)[0]);if(!a)return null;const days=day?[day]:romanceDateDays(p,a);day=day||days.find(d=>d>currentDate())||days[0];if(!day)return null;const slots=romanceDateSlots(p,day,a);start=start??slots[0];if(start==null)return null;
 const made=makeRomanceDatePlan(p,a,day,start,{inviter:'npc',status:'Pending',reason:'NPC invited you'});if(made.conflict)return null;L=ensureLove(p);L.lastNpcInviteDate=currentDate();const personality=(p.traits||[]).includes('Shy')?'carefully':(p.traits||[]).includes('Bold')?'directly':'warmly';L.inviteHistory.push({dateISO:currentDate(),kind:'date',activityId:a.id,by:'npc'});L.nextInitiativeDate=addDays(currentDate(),(p.traits||[]).includes('Busy')?21:(p.traits||[]).includes('Shy')?16:12);
 queueEvent({type:'invitation',title:`${displayName(p)} asks you on a date`,text:`${firstName(p)} ${personality} asks if you want to go to ${a.label.toLowerCase()} on ${formatDate(day)} at ${timeLabel(start)}. ${made.plan.payment.label}.`,participants:[p.id],payload:{planId:made.plan.id,romantic:true},priority:4,expiresDays:1,choices:[{id:'accept',label:'Accept'},{id:'maybe',label:'Maybe later'},{id:'decline',label:'Decline'},{id:'busy',label:"Say you're busy"}]});return made.plan
}
function romanceNpcInitiative3B2(){
 if(typeof romanceNpcRelationshipInitiative3B3==='function'&&romanceNpcRelationshipInitiative3B3())return true;if(typeof romanceNpcMatchmakingInitiative3B4==='function'&&romanceNpcMatchmakingInitiative3B4())return true;
 if(S.age<13||S.romance?.optOut||SIM.skipping)return false;ensureRomance3B2State();const candidates=(S.people||[]).filter(p=>!isFamilyPerson(p)&&!p.movedAway&&eligibleRomance(p)).filter(p=>{const c=romanceCompatibility(p),L=ensureLove(p);return c.eligible&&c.score>=52&&L.npcAttraction>=48&&(!L.nextInitiativeDate||currentDate()>=L.nextInitiativeDate)}).sort((a,b)=>romanceCompatibility(b).score-romanceCompatibility(a).score);if(!candidates.length)return false;
 const p=candidates[0],traits=p.traits||[],base=traits.includes('Bold')?16:traits.includes('Shy')||traits.includes('Quiet')?5:10;if(!chance(base))return false;return !!createNpcDateInvitation3B2(p)
}
// Overrides the old mostly-friend-only initiative entry point while preserving it.
function npcInitiative(){
 if(!S.people.length||!chance(28))return;if(typeof maybeNpcContactExchange3C1==='function'&&maybeNpcContactExchange3C1())return;if(romanceNpcInitiative3B2())return;const p=rand(S.people);if(!p)return;if(p.role==='parent'&&S.school&&chance(45)){queueEvent({type:'parentSchool',title:`${p.name} asks about school`,text:'They want to know how grades, homework and stress are going.',participants:[p.id],choices:[{id:'honest',label:'Be honest'},{id:'hide',label:'Downplay problems'},{id:'help',label:'Ask for help'}]});return}if(p.role==='friend'&&S.age>=6){const canMsg=typeof canDirectCommunicate3C1==='function'?canDirectCommunicate3C1(p,'message'):canUsePhone();if(canMsg&&chance(50)){incomingMessage(p,'chitchat')}else npcInvitesPlayer(p)}
}
function romance3B2EventChoice(e,id,label){if(typeof romance3B4EventChoice==='function'&&romance3B4EventChoice(e,id,label))return true;if(typeof romance3B3EventChoice==='function'&&romance3B3EventChoice(e,id,label))return true;if(e.type==='invitation'&&e.payload?.romantic)return handleRomanceDateInvite3B2(e,id);return false}
function romance3B2Click(b){if(typeof romance3B4Click==='function'&&romance3B4Click(b))return true;if(typeof romance3B3Click==='function'&&romance3B3Click(b))return true;const d=b.dataset;if(d.dateStep){const p=personById(d.personId),x=romanceDateDraft;if(!p||!x)return true;if(d.dateStep==='activity'){x.activityId=d.v;x.day=null;x.time=null}else if(d.dateStep==='day'){x.day=d.v;x.time=null}else if(d.dateStep==='time'){x.time=Number(d.v);const a={id:x.activityId,...ROMANCE_DATE_ACTIVITIES[x.activityId]};submitRomanceDateProposal3B2(p,a,x.day,x.time);return true}else if(d.dateStep==='back'){x.activityId=null;x.day=null}else if(d.dateStep==='back-day'){x.day=null;x.time=null}openRomanceDatePlanner3B2(p.id);return true}
 if(d.dateCounter){const p=personById(d.personId);closeChoiceModal();if(d.dateCounter==='yes'&&p){const a={id:d.activity,...ROMANCE_DATE_ACTIVITIES[d.activity]},made=makeRomanceDatePlan(p,a,d.day,Number(d.time),{inviter:'player',reason:'Accepted their counterproposal'});if(made.conflict)log('Schedule conflict',conflictText3B2(made.conflict));else{setNpcRomanticInterest(p,'reciprocates');threadStep(thread('romanceDate',made.plan.id,made.plan.title,[p.id]),'Accepted','Counterproposal accepted');log('Date scheduled',`${made.plan.title} • ${formatDate(made.plan.dateISO)} at ${timeLabel(made.plan.startMinute)}.`)}}else if(p)log('No date this time',`You turn down ${firstName(p)}'s suggested time.`);save();render();return true}
 if(d.datePrep){prepareRomanceDate3B2(d.datePrep);save();render();return true}return false}
