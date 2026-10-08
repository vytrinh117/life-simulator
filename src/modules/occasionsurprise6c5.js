// PHASE 6C.5 — event-scoped, verified surprise celebrations.
// Canonical Occasion, People, NPC availability, 6C.2 planner, 6C.4 guest attendance;
// no duplicate calendar, checkout, inventory, money, attendance or romance authority.
const OCC6C5_REACTIONS=new Set(['happy','grateful','embarrassed','overwhelmed','disappointed']);
function occasionSurpriseRecord6C5(id){return occasionRecord6C1(id)?.surprise6C5||null}
function occasionSurpriseConflict6C5(personId,day,minute){
 return (S.plans||[]).some(p=>p.personId===personId&&p.dateISO===day&&p.location!=='Home'&&['Accepted','Attending'].includes(p.status)&&minute>=Number(p.startMinute||0)-60&&minute<=Number(p.endMinute||0));
}
function occasionSurpriseAvailable6C5(personId,day,minute){
 const p=personById(personId);
 if(!p||p.movedAway||p.deceased)return false;
 return !!npcStatusAt(p,day,minute).free&&!occasionSurpriseConflict6C5(personId,day,minute);
}
function occasionSurpriseHomeVisit6C5(personId,day,minute,acceptedOnly=false){
 return (S.plans||[]).some(p=>p.personId===personId&&p.dateISO===day&&p.location==='Home'&&
 (acceptedOnly?['Accepted','Attending'].includes(p.status):p.status==='Attending')&&
 minute>=Number(p.startMinute||0)&&minute<=Number(p.endMinute||0));
}
function occasionSurpriseHomeActor6C5(personId,day,minute){
 const p=personById(personId);
 if(!p||!occasionSurpriseAvailable6C5(personId,day,minute))return false;
 if(livesWithParents()&&inHousehold(p))return true;
 // A non-household organizer must have a real, already-arrived Home plan.
 // Never treat mere acceptance as physical attendance at the reveal.
 return S.age>=18&&occasionSurpriseHomeVisit6C5(personId,day,minute);
}
function occasionSurpriseOtherPartyGate6C5(id){
 const prep=occasionPreparationGate6C1(id);if(!prep.ok)return prep;
 const rec=prep.occasion;
 if(rec.occasionType!=='birthday'||rec.celebrantKind!=='person'||!personById(rec.celebrantPersonId))return {ok:false,reason:'not_npc_birthday'};
 if(S.age<18)return {ok:false,reason:'h3_approval_required'};
 if(!occasionSurpriseHomeActor6C5(rec.celebrantPersonId,rec.dateISO,1140)&&!(occasionSurpriseAvailable6C5(rec.celebrantPersonId,rec.dateISO,1140)&&occasionSurpriseHomeVisit6C5(rec.celebrantPersonId,rec.dateISO,1140,true)))return {ok:false,reason:'celebrant_home_unverified'};
 if(!rec.planning6C2||rec.planning6C2.cancelled||rec.planning6C2.choice!=='small_gathering')return {ok:false,reason:'gathering_plan_required'};
 if(rec.planning6C2.venue!=='Home'||S.location!=='Home')return {ok:false,reason:'home_venue_required'};
 if(rec.surprise6C5)return {ok:false,reason:'surprise_already_decided'};
 if(currentMinute()+20>=1440||stamp(currentDate(),currentMinute()+20)>=stamp(rec.preparationDeadline.dateISO,0))return {ok:false,reason:'insufficient_preparation_time'};
 return {ok:true,occasion:rec};
}
function occasionPlanSurprise6C5(id,minute=1140){
 const g=occasionSurpriseOtherPartyGate6C5(id);if(!g.ok)return g;
 if(!Number.isInteger(minute)||minute<720||minute>1200)return {ok:false,reason:'invalid_start_minute'};
 const rec=g.occasion;
 // Only the player's actual home can be booked at this checkpoint; 6C.7 may
 // expand verified school/other-home/venue permissions later.
 const plan={schemaVersion:1,occasionId:id,kind:'player_for_npc',organizer:'player',celebrantPersonId:rec.celebrantPersonId,venue:'Home',startMinute:minute,status:'secret_planned',secret:true,createdAt:{dateISO:currentDate(),minute:currentMinute()},invitedPersonIds:[],actualAttendeeIds:[],outcome:null,actualCost:0};
 rec.surprise6C5=plan;advanceTime(20);return {ok:true,surprise:plan};
}
function occasionNpcSurpriseCandidates6C5(day,minute){
 // An autonomous home event must have a verifiable co-resident organizer.
 // Friends and partners living elsewhere require independently verified plans;
 // they cannot simply appear in the player's house.
 return (S.people||[]).filter(p=>{
  if(p.movedAway||p.deceased||personAge(p)<16||p.rel<35||(p.conflict||0)>=60||!occasionSurpriseAvailable6C5(p.id,day,minute))return false;
  if(isFamilyPerson(p))return livesWithParents()&&inHousehold(p);
  // Friend/established partner initiative requires a real accepted Home plan.
  // A remotely acquainted NPC does not gain access to a player's home.
  const establishedPartner=S.romance?.partnerId===p.id;
  return S.age>=18&&personAge(p)>=18&&(establishedPartner||tierRank(p)>=2)&&occasionSurpriseHomeVisit6C5(p.id,day,minute,true);
 }).sort((a,b)=>(b.rel+(b.trust||0)*.25)-(a.rel+(a.trust||0)*.25)||a.id.localeCompare(b.id));
}
function occasionNpcInitiative6C5(id){
 const rec=occasionRecord6C1(id);if(!rec)return {ok:false,reason:'occasion_not_found'};
 if(rec.occasionType!=='birthday'||rec.celebrantKind!=='player')return {ok:false,reason:'not_player_birthday'};
 if(rec.surprise6C5)return {ok:true,reused:true,surprise:rec.surprise6C5};
 if(OCCASION6C1_TERMINAL.has(rec.status))return {ok:false,reason:'occasion_terminal'};
 if(currentDate()<rec.preparationWindow.opensISO||currentDate()>rec.dateISO)return {ok:false,reason:'outside_initiative_window'};
 if(rec.dateISO===currentDate()&&currentMinute()>=1140)return {ok:false,reason:'planning_window_passed'};
 const host=occasionNpcSurpriseCandidates6C5(rec.dateISO,1140)[0];
 // A deterministic single decision per birthday, independent of rerenders.
 const wealth=S.wealth==='Struggling'?-13:['Wealthy','Extremely wealthy'].includes(S.wealth)?8:0;
 const threshold=host?Math.max(5,Math.min(62,Math.round(18+(host.rel||40)*.26+(host.trust||40)*.12-(host.conflict||0)*.3+wealth))):0;
 const decided=!!host&&dayHash(`${id}|npc-initiative-6c5`)<threshold;
 const plan={schemaVersion:1,occasionId:id,kind:'npc_for_player',organizerPersonId:decided?host.id:null,celebrantKind:'player',venue:decided?'Home':null,startMinute:1140,status:decided?'secret_planned':'not_planned',secret:decided,createdAt:{dateISO:currentDate(),minute:currentMinute()},actualAttendeeIds:[],outcome:null,actualCost:0,decisionScore:dayHash(`${id}|npc-initiative-6c5`)};
 rec.surprise6C5=plan;return {ok:true,surprise:plan};
}
function occasionSurpriseEventGate6C5(id,kind){
 const rec=occasionRecord6C1(id),plan=rec?.surprise6C5;
 if(!rec||!plan)return {ok:false,reason:'no_surprise_plan'};
 if(plan.kind!==kind)return {ok:false,reason:'wrong_surprise_kind'};
 if(plan.status!=='secret_planned'&&!(kind==='npc_for_player'&&plan.status==='discovered_early'))return {ok:false,reason:'surprise_not_pending'};
 if(OCCASION6C1_TERMINAL.has(rec.status))return {ok:false,reason:'occasion_terminal'};
 if(currentDate()!==rec.dateISO||currentMinute()<plan.startMinute||currentMinute()>Math.min(plan.startMinute+120,1439))return {ok:false,reason:'outside_event_window'};
 if(S.location!=='Home'||plan.venue!=='Home')return {ok:false,reason:'wrong_venue'};
 if(currentMinute()+20>1439)return {ok:false,reason:'insufficient_event_time'};
 if(kind==='npc_for_player'){
  if(!occasionSurpriseHomeActor6C5(plan.organizerPersonId,rec.dateISO,currentMinute()))return {ok:false,reason:'organizer_unavailable'};
 }else{
  if(S.age<18)return {ok:false,reason:'h3_approval_required'};
  if(!personById(plan.celebrantPersonId))return {ok:false,reason:'missing_celebrant'};
  // The celebrant must genuinely live at this address; unavailable visitors
  // cannot be conjured into a surprise venue.
  if(!occasionSurpriseHomeActor6C5(plan.celebrantPersonId,rec.dateISO,currentMinute()))return {ok:false,reason:'celebrant_not_at_venue'};
  if(rec.planning6C2?.cancelled)return {ok:false,reason:'plan_cancelled'};
 }
 return {ok:true,occasion:rec,surprise:plan};
}
function occasionDiscoverSurprise6C5(id){
 const rec=occasionRecord6C1(id),plan=rec?.surprise6C5;
 if(!plan||plan.kind!=='npc_for_player'||plan.status!=='secret_planned')return {ok:false,reason:'no_hidden_surprise'};
 if(currentDate()>=rec.dateISO||currentDate()<rec.preparationWindow.opensISO)return {ok:false,reason:'not_discovery_window'};
 if(S.location!=='Home'||S.age<7)return {ok:false,reason:'cannot_investigate_here'};
 if(!occasionSurpriseHomeActor6C5(plan.organizerPersonId,rec.dateISO,plan.startMinute))return {ok:false,reason:'organizer_unavailable'};
 if(plan.discoveryAttempted)return {ok:false,reason:'already_investigated'};
 if(currentMinute()+10>1439)return {ok:false,reason:'insufficient_time'};
 plan.discoveryAttempted=true;
 const discovered=dayHash(`${id}|${plan.organizerPersonId}|early-clue`)<32;
 if(discovered){plan.status='discovered_early';plan.secret=false;plan.discoveredAt={dateISO:currentDate(),minute:currentMinute()}}
 advanceTime(10);return {ok:true,discovered,surprise:plan};
}
function occasionCancelSurprise6C5(id){
 const rec=occasionRecord6C1(id),plan=rec?.surprise6C5;
 if(!rec||!plan)return {ok:false,reason:'no_surprise_plan'};
 if(plan.kind!=='player_for_npc')return {ok:false,reason:'not_player_organized'};
 if(plan.status!=='secret_planned'||OCCASION6C1_TERMINAL.has(rec.status))return {ok:false,reason:'surprise_not_pending'};
 plan.status='cancelled';plan.outcome='cancelled';plan.cancelledAt={dateISO:currentDate(),minute:currentMinute()};return {ok:true,surprise:plan};
}
function occasionResolveSurprise6C5(id,reaction='happy'){
 if(!OCC6C5_REACTIONS.has(reaction))return {ok:false,reason:'invalid_reaction'};
 const rec=occasionRecord6C1(id),plan=rec?.surprise6C5;if(!plan)return {ok:false,reason:'no_surprise_plan'};
 const gate=occasionSurpriseEventGate6C5(id,plan.kind);if(!gate.ok)return gate;
 const guests=(rec.guests6C4?.attendance||[]).filter(x=>x.dateISO===rec.dateISO&&personById(x.personId)&&x.personId!==rec.celebrantPersonId)
 .map(x=>x.personId).filter((v,i,a)=>a.indexOf(v)===i);
 // Only previously confirmed 6C.4 guests count. In the NPC case a real
 // co-resident host alone can arrange a small surprise at Home.
 const hostId=plan.kind==='npc_for_player'?plan.organizerPersonId:null;
 const participants=(hostId?[hostId]:[]).concat(guests.filter(pid=>occasionSurpriseAvailable6C5(pid,rec.dateISO,currentMinute())));
 const actual=[...new Set(participants)].filter(pid=>pid===hostId?occasionSurpriseHomeActor6C5(pid,rec.dateISO,currentMinute()):occasionSurpriseAvailable6C5(pid,rec.dateISO,currentMinute()));
 // A player-arranged party without a verified second person besides its
 // celebrant is a private surprise rather than a fabricated group gathering.
 const surpriseSeed=dayHash(`${id}|${plan.celebrantPersonId||'player'}|surprise-reveal`);
 const outcome=plan.status==='discovered_early'?'discovered_early':
  plan.kind==='player_for_npc'?(actual.length?(surpriseSeed<17?'discovered_early':surpriseSeed<30?'partially_spoiled':'celebrated'):(surpriseSeed<17?'discovered_early':'small_private_surprise')):'celebrated';
 if(rec.status!=='Active'){
  const started=occasionTransition6C1(id,'Active','Verified occasion-day arrival at Home');if(!started.ok)return started;
 }
 const transition=occasionTransition6C1(id,'Completed','Verified 6C.5 home surprise');if(!transition.ok)return transition;
 plan.status='completed';plan.secret=false;plan.outcome=outcome;plan.reaction=reaction;plan.actualAttendeeIds=actual;plan.resolvedAt={dateISO:currentDate(),minute:currentMinute()};
 if(plan.kind==='npc_for_player'){
  const host=personById(hostId);if(host){host.rel=clamp((host.rel||0)+({happy:2,grateful:2,embarrassed:1,overwhelmed:0,disappointed:-1}[reaction]));rememberPerson(host,`Organized a small surprise at home for your birthday; you felt ${reaction}.`,1)}
  S.happiness=clamp((S.happiness||0)+({happy:3,grateful:3,embarrassed:1,overwhelmed:0,disappointed:-2}[reaction]));
 }else{
  const celebrant=personById(plan.celebrantPersonId);if(celebrant){celebrant.rel=clamp((celebrant.rel||0)+({happy:2,grateful:2,embarrassed:1,overwhelmed:0,disappointed:-1}[reaction]));rememberPerson(celebrant,`You organized a ${outcome==='celebrated'?'surprise gathering':'quiet surprise'} for their birthday; their reaction was ${reaction}.`,1)}
 }
 advanceTime(20);return {ok:true,outcome,surprise:plan};
}

function occasionReconcileSurprise6C5(rec){
 const plan=rec?.surprise6C5;
 if(!plan||!['secret_planned','discovered_early'].includes(plan.status))return;
 if(currentDate()>rec.endDateISO||(currentDate()===rec.endDateISO&&currentMinute()>plan.startMinute+120)){
  plan.status='missed';plan.outcome='missed';plan.resolvedAt={dateISO:currentDate(),minute:currentMinute()};
 }
}
