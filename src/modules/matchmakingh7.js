// =====================================================================
// H7 — evidence-based matchmaking; introductory meeting before any date.
// The Phase 3B.4 offer/plan authority remains canonical. No rival scheduler.
// =====================================================================
const MATCHMAKING_H7_SCHEMA=1;
function h7State(){
 const mm=ensureRomance3B4State();
 mm.h7SchemaVersion=MATCHMAKING_H7_SCHEMA;
 for(const o of mm.offers){
  if(o&&o.h7Version==null){o.legacyBeforeH7=true;o.h7Version=1;}
 }
 return mm;
}
// Parent/guardian introductions are eligible only with genuine social evidence.
function matchmakerEligible3B4(p){
 if(!p||S.age<13||S.romance?.optOut||S.romance?.partnerId||p.movedAway)return false;
 if(isFamilyPerson(p))return ['parent','guardian','older sibling','younger sibling','sibling','aunt','uncle','relative'].includes(p.role)||['parent','guardian','sibling','aunt','uncle'].includes(p.relation);
 return ['Close Friend','Best Friend'].includes(friendshipTier(p))&&(p.trust??0)>=50&&p.id!==S.romance?.partnerId;
}
function h7Edge(matchmaker,npcId){
 if(typeof matchmaker==='string')matchmaker=personById(matchmaker);
 if(!matchmaker?.id||!npcId)return null;
 const candidate=(S.people||[]).find(p=>p.npcId===npcId),n=npcById(npcId);
 if(!n||n.movedAway||candidate?.id===matchmaker.id)return null;
 // Group membership is a recorded relationship, not an inferred shared school.
 for(const g of S.groups||[]){
  if(!Array.isArray(g.members)||!g.members.includes(matchmaker.id)||!candidate||!g.members.includes(candidate.id))continue;
  if(!personById(matchmaker.id)||!personById(candidate.id))continue;
  return {kind:'sharedGroup',groupId:g.id,matchmakerId:matchmaker.id,candidateNpcId:npcId,label:`Both are recorded members of ${g.name||'the same friend group'}.`};
 }
 // Explicit NPC graph edges are eligible. Merely sharing a school/household is not.
 const mn=npcById(matchmaker.npcId),linked=[matchmaker.knownNpcIds,matchmaker.friendNpcIds,mn?.knownNpcIds,mn?.friendNpcIds,mn?.friendsIds].filter(Array.isArray);
 if(linked.some(ids=>ids.includes(npcId)))return {kind:'explicitNpcLink',matchmakerId:matchmaker.id,candidateNpcId:npcId,label:`${displayName(matchmaker,'formal')} has a recorded personal connection to this person.`};
 // Existing affirmative introduction data may reflect H3/older unverified heuristics.
 // Never treat introducedById alone as independent proof of a real social link.
 return null;
}
function h7LinkedCandidates(matchmaker){
 if(typeof matchmaker==='string')matchmaker=personById(matchmaker);
 if(!matchmaker||!matchmakerEligible3B4(matchmaker))return [];
 const known=new Set((S.people||[]).map(p=>p.npcId).filter(Boolean));
 const npcList=(S.npcs||[]).filter(n=>{
  if(!n?.id||!h7Edge(matchmaker,n.id))return false;
  const p=(S.people||[]).find(x=>x.npcId===n.id);
  if(p)return candidatePersonEligible3B4(p);
  return !known.has(n.id)&&npcCandidateEligible3B4(n);
 });
 return npcList.map(n=>({npcId:n.id,personId:(S.people||[]).find(p=>p.npcId===n.id)?.id||null,evidence:h7Edge(matchmaker,n.id)}));
}
function h7ChooseLink(matchmaker){
 const mm=h7State(),pool=h7LinkedCandidates(matchmaker);
 const rejected=new Set(mm.offers.filter(o=>['Declined','MeetingDeclined','Completed','Scheduled','Met','AwaitingMeet','Accepted'].includes(o.status)).map(o=>o.candidateNpcId||personById(o.candidateId)?.npcId).filter(Boolean));
 const usable=pool.filter(x=>!rejected.has(x.npcId));
 return usable.sort((a,b)=>hashOf(`${currentDate()}|${matchmaker.id}|${a.npcId}`)-hashOf(`${currentDate()}|${matchmaker.id}|${b.npcId}`))[0]||null;
}
function createMatchOffer3B4(matchmaker,source='player'){
 if(typeof matchmaker==='string')matchmaker=personById(matchmaker);
 if(!matchmaker||!matchmakerEligible3B4(matchmaker)||S.romance?.partnerId)return null;
 const mm=h7State(),old=[...mm.offers].reverse().find(o=>o.matchmakerId===matchmaker.id&&(['Pending','AwaitingMeet','Met'].includes(o.status)||(o.status==='Maybe'&&o.reconsiderDate&&currentDate()>=o.reconsiderDate)));if(old)return old;
 if(matchmakingCooldownActive3B4(matchmaker))return null;
 const link=h7ChooseLink(matchmaker);if(!link)return null;
 const offer={id:uid('match'),h7Version:1,matchmakerId:matchmaker.id,candidateId:link.personId,candidateNpcId:link.npcId,createdDate:currentDate(),source,status:'Pending',evidence:link.evidence,howKnown:link.evidence.label};
 mm.offers.push(offer);if(mm.offers.length>50)mm.offers.splice(0,mm.offers.length-50);
 matchmaker.matchmakingNextDate=addDays(currentDate(),source==='npc'?35:14);
 return offer; // No contact, Person, love, history, or memory from simply suggesting someone.
}
function h7Candidate(offer){
 return offer?.candidateId?personById(offer.candidateId):offer?.candidateNpcId?(S.people||[]).find(p=>p.npcId===offer.candidateNpcId):null;
}
function matchCandidateInfo3B4(offerOrId){
 const offer=typeof offerOrId==='string'?h7State().offers.find(o=>o.id===offerOrId):offerOrId;if(!offer)return null;
 const p=h7Candidate(offer),n=npcById(offer.candidateNpcId||p?.npcId),m=personById(offer.matchmakerId);
 if(!m||!p&&!n)return null;
 const id=p?personIdentity(p):null,age=p?personAge(p):npcAge(n),fullname=p?displayName(p,'formal'):n.fullName||[n.firstName,n.surname].filter(Boolean).join(' ');
 return {offerId:offer.id,candidateId:p?.id||null,fullName:fullname,age,gender:id?.gender||n?.gender||'Not known',orientation:p&&loveInterestKnown(p)?id.orientation:'Unknown',compatibility:'Not determined by an introduction',looks:p?.npcId&&n?.looks!=null?looksLabel(n.looks):'Not known',context:p?matchCandidateContext3B4(p):'Introducer connection',howKnown:offer.evidence?.label||'Historical offer — connection not independently verified',status:offer.status};
}
function openMatchOffer3B4(offerId){
 const o=h7State().offers.find(x=>x.id===offerId),x=matchCandidateInfo3B4(o);if(!o||!x)return;
 const pending=['Pending','Maybe'].includes(o.status),meeting=o.status==='AwaitingMeet'||o.status==='Accepted',met=['Met','Scheduled','Completed'].includes(o.status);
 const name=esc(x.fullName),edge=esc(x.howKnown),status=esc(o.status);
 const buttons=pending?`<button class="primary" data-mm-offer-action="accept" data-offer-id="${o.id}">I'm open to an introduction</button><button data-mm-offer-action="maybe" data-offer-id="${o.id}">Maybe later</button><button class="ghost" data-mm-offer-action="decline" data-offer-id="${o.id}">No thanks</button>`:meeting?`<button class="primary" data-mm-offer-action="meet" data-offer-id="${o.id}">Meet in a public place (when available)</button><button class="ghost" data-mm-offer-action="decline" data-offer-id="${o.id}">Cancel introduction</button>`:met?`<button data-mm-offer-action="contact" data-offer-id="${o.id}">Ask to exchange contacts</button><button data-mm-offer-action="date" data-offer-id="${o.id}">Discuss a date (NPC decides)</button>`:'<p class="muted-text">This introduction is closed.</p>';
 openModal(`An introduction from ${esc(displayName(personById(o.matchmakerId),'formal'))}`,`<p><b>${name}</b> · ${x.age} · ${esc(x.gender)}</p><p><b>Connection evidence:</b> ${edge}<br><b>Known interests:</b> ${esc(x.orientation)}<br><b>Context:</b> ${esc(x.context)}<br><b>Status:</b> ${status}</p><p class="muted-text">An offer is not a meeting, contact exchange, crush or date. Meet in town at a suitable time; the other person can decline.</p>${o.blockReason?`<p class="muted-text">${esc(o.blockReason)}</p>`:''}<div class="modal-action-grid">${buttons}</div>`);
}
// The introducer's People action must reopen accepted meetings on a later day.
function matchmakeModal(personId){
 const m=personById(personId);
 if(!m||S.romance?.partnerId){toast('You are already in a committed relationship.');return;}
 if(!matchmakerEligible3B4(m)){toast('A close, trusted connection is needed before someone can introduce you.');return;}
 const mm=h7State(),existing=[...mm.offers].reverse().find(o=>o.matchmakerId===m.id&&(['Pending','AwaitingMeet','Met'].includes(o.status)||(o.status==='Maybe'&&o.reconsiderDate&&currentDate()>=o.reconsiderDate)));
 if(existing){openMatchOffer3B4(existing.id);return;}
 const offer=createMatchOffer3B4(m,'player');
 if(!offer){toast(matchmakingCooldownActive3B4(m)?'Give them time before asking again.':'They have no verified friend-group or personal connection to introduce right now.');return;}
 advanceTime(15,{silent:true});openMatchOffer3B4(offer.id);
}
function h7History(offer,action){const mm=h7State();if(mm.history.some(h=>h.offerId===offer.id&&h.outcome===action))return false;recordMatchHistory3B4(offer,action);return true}
function h7MeetingGate(o){
 if(!o||!['AwaitingMeet','Accepted'].includes(o.status))return {ok:false,reason:'No pending introduction.'};
 if(S.romance?.partnerId)return {ok:false,reason:'You are in an established relationship.'};
 const m=personById(o.matchmakerId),n=npcById(o.candidateNpcId||h7Candidate(o)?.npcId),p=h7Candidate(o);
 if(!m||!n||n.movedAway||p?.movedAway)return {ok:false,reason:'The introduction is no longer available.'};
 if(S.location!=='Out'||currentMinute()<540||currentMinute()>1170||SIM.skipping)return {ok:false,reason:'Meet at a public spot in town between 9 AM and 7:30 PM.'};
 if(!npcStatusAt(m).free||!npcStatusAt(p||{id:n.id,npcId:n.id,age:npcAge(n),role:'friend',name:n.firstName}).free)return {ok:false,reason:'One of the people is unavailable right now. Try another time.'};
 if((S.people||[]).filter(x=>!isFamilyPerson(x)).length>=50&&!p)return {ok:false,reason:'Your People list is full.'};
 return {ok:true,m,n,p};
}
function h7Meet(offerId){
 const o=h7State().offers.find(x=>x.id===offerId),gate=h7MeetingGate(o);if(!gate.ok){if(o)o.blockReason=gate.reason;return {ok:false,reason:gate.reason}};
 // One event-scoped, deterministic decision. Never change a refusal by repeated clicks.
 const prior=o.meetingDecision;
 const p=gate.p,n=gate.n,unwilling=(p?.conflict||0)>=65||p?.boundaries?.includes('noNewPeople');
 const roll=hashOf(`h7Meet|${o.id}|${o.createdDate}|${n.id}`)%100;
 // Explicit boundaries win over score; other people still have agency.
 const accepts=!unwilling&&roll<Math.max(20,Math.min(92,60+(p?.trust||40)*.23-(p?.conflict||0)*.4));
 if(prior){return {ok:prior==='Accepted',reason:prior==='Accepted'?'Already met.':'They declined this meeting.'}};
 if(!accepts){o.meetingDecision='Declined';o.status='MeetingDeclined';o.resolvedDate=currentDate();o.blockReason='They do not feel comfortable meeting right now.';h7History(o,'MeetingDeclined');advanceTime(10,{silent:true});log('Introduction declined',`${n.fullName||n.firstName} decides not to meet. You respect the decision.`);return {ok:false,reason:o.blockReason}}
 let person=p;
 if(!person){person=personFromNpc(n,'friend',`introduced by ${displayName(gate.m,'formal')}`);person.rel=22;person.trust=43;person.respect=50;person.knownSince=S.age;person.metAt='public place in town';person.metVia='in-person introduction';person.introducedById=gate.m.id;person.introducedBy=gate.m.id;
  if(typeof recordMeetingProvenance4A4==='function')recordMeetingProvenance4A4(person,{sourceType:'mutualFriend',introducedById:gate.m.id,metAt:person.metAt,metVia:'in-person introduction'});
  S.people.push(person);
 }
 o.candidateId=person.id;o.meetingDecision='Accepted';o.metDate=currentDate();o.status='Met';o.blockReason=null;
 const L=ensureLove(person);L.matchmakingOfferId=o.id;
 h7History(o,'Met');advanceTime(20,{silent:true});rememberPerson(person,`First in-person introduction by ${displayName(gate.m,'formal')}.`,2);log('Introduced in person',`${displayName(gate.m,'formal')} introduces ${displayName(person,'formal')} in town. You talk briefly. Neither person has promised a date.`);
 return {ok:true,personId:person.id};
}
function respondMatchOffer3B4(offerId,action){
 const o=h7State().offers.find(x=>x.id===offerId);if(!o)return false;
 const m=personById(o.matchmakerId),p=h7Candidate(o);if(!m)return false;
 if(action==='meet')return h7Meet(offerId).ok;
 if(action==='contact'){if(o.status!=='Met'||!p)return false;exchangeContact3C1(p.id);return true;}
 if(action==='date'){if(o.status!=='Met'||!p||S.romance?.partnerId)return false;openRomanceDatePlanner3B2(p.id,true);return true;}
 if(!['Pending','Maybe','AwaitingMeet','Accepted'].includes(o.status))return false;
 if(action==='decline'){o.status='Declined';o.resolvedDate=currentDate();h7History(o,'Declined');if(p&&ensureLove(p).matchmakingOfferId===o.id)ensureLove(p).matchmakingOfferId=null;log('No introduction',`You tell ${firstName(m)} that you would rather not continue this introduction.`);closeChoiceModal();return true;}
 if(action==='maybe'&&['Pending','Maybe'].includes(o.status)){o.status='Maybe';o.reconsiderDate=addDays(currentDate(),14);h7History(o,'Maybe');log('Maybe later',`${firstName(m)} gives you time to think about meeting.`);closeChoiceModal();return true;}
 if(action==='accept'&&['Pending','Maybe'].includes(o.status)){
  if(S.romance?.partnerId)return false;
  o.status='AwaitingMeet';o.acceptedDate=currentDate();h7History(o,'AwaitingMeet');log('Introduction requested',`${firstName(m)} offers to introduce you in person. You still have to meet, and the other person may decline.`);openMatchOffer3B4(o.id);return true;
 }return false;
}
function noteMatchmakingPlan3B4(p,plan){
 const id=ensureLove(p)?.matchmakingOfferId,o=id&&h7State().offers.find(o=>o.id===id);
 if(!o||!['Met','Scheduled'].includes(o.status)||o.meetingDecision!=='Accepted')return;
 plan.matchmakingOfferId=o.id;plan.blindDate=true;o.planId=plan.id;o.status='Scheduled';h7History(o,'Scheduled');
}
function romanceNpcMatchmakingInitiative3B4(){
 if(S.age<13||S.romance?.optOut||S.romance?.partnerId||SIM.skipping)return false;
 const mm=h7State();if(mm.nextNpcOfferDate&&currentDate()<mm.nextNpcOfferDate)return false;
 if(mm.offers.some(o=>['Pending','AwaitingMeet'].includes(o.status)||o.status==='Maybe'&&(!o.reconsiderDate||currentDate()<o.reconsiderDate)))return false;
 const ms=(S.people||[]).filter(matchmakerEligible3B4).filter(m=>!matchmakingCooldownActive3B4(m)&&h7LinkedCandidates(m).length);
 if(!ms.length)return false;const selected=ms.sort((a,b)=>hashOf(`h7|${currentDate()}|${a.id}`)-hashOf(`h7|${currentDate()}|${b.id}`))[0];
 if(!chance(isFamilyPerson(selected)?5:7))return false;
 const o=createMatchOffer3B4(selected,'npc');if(!o)return false;
 mm.nextNpcOfferDate=addDays(currentDate(),40);
 queueEvent({type:'matchmakingOffer',title:`${displayName(selected,'formal')} knows someone you could meet`,text:`${firstName(selected)} has an actual connection and offers to introduce you. You can review it without promising a date.`,participants:[selected.id],payload:{offerId:o.id},priority:3,expiresDays:3,choices:[{id:'review',label:'Hear about them'},{id:'maybe',label:'Maybe later'},{id:'decline',label:'No thanks'}]});return true;
}
function romance3B4Click(b){const d=b.dataset;if(!d.mmOfferAction)return false;respondMatchOffer3B4(d.offerId,d.mmOfferAction);if(d.mmOfferAction!=='accept'&&d.mmOfferAction!=='date')closeChoiceModal();save();render();return true;}
