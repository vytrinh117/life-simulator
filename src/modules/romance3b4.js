// =====================================================================
// PHASE 3B.4 — Matchmaking / Blind Dates / Multiple Prospects
// Builds on 3B.1 canonical romance, 3B.2 date lifecycle, 3B.3 commitment,
// and H3 decision integrity. No Phone/Prom/Transportation expansion here.
// =====================================================================
function ensureRomance3B4State(){
 S.romance=S.romance||{};const mm=S.romance.matchmaking&&typeof S.romance.matchmaking==='object'?S.romance.matchmaking:{};
 mm.offers=Array.isArray(mm.offers)?mm.offers:[];mm.history=Array.isArray(mm.history)?mm.history:[];
 if(mm.offers.length>50)mm.offers=mm.offers.slice(-50);if(mm.history.length>100)mm.history=mm.history.slice(-100);
 S.romance.matchmaking=mm;return mm
}
function migrateRomance3B4(){
 if(!S)return;const mm=ensureRomance3B4State();const seen=new Set();mm.offers=mm.offers.filter(o=>{if(!o||!o.id||seen.has(o.id))return false;seen.add(o.id);o.status=o.status||'Pending';o.createdDate=o.createdDate||currentDate();o.source=o.source||'player';return true});
 for(const p of S.people||[]){const L=ensureLove(p);if(L.matchmakingOfferId&&!mm.offers.some(o=>o.id===L.matchmakingOfferId))L.matchmakingOfferId=null}
 S.romance3B4Migrated=true
}
function playerPreferenceAllows3B4(p){const g=personIdentity(p).gender,pref=String(S.attraction||'Not sure yet');if(pref==='Men')return g==='Male';if(pref==='Women')return g==='Female';return true}
function matchmakerEligible3B4(p){
 if(!p||S.age<13||S.romance?.optOut||S.romance?.partnerId)return false;if(p.id===S.romance?.partnerId)return false;
 if(isFamilyPerson(p))return ['older sibling','younger sibling','sibling','aunt','uncle','relative'].includes(p.role)||['sibling','aunt','uncle'].includes(p.relation);
 const tier=friendshipTier(p);return ['Close Friend','Best Friend'].includes(tier)&&(p.trust??0)>=50
}
function matchmakingCooldownActive3B4(matchmaker){const mm=ensureRomance3B4State(),d=matchmaker?.matchmakingNextDate||mm.nextNpcOfferDate;return !!(d&&currentDate()<d)}
function priorMatchOffersFor3B4(candidateId){return ensureRomance3B4State().offers.filter(o=>o.candidateId===candidateId)}
function candidateRejected3B4(candidateId){return priorMatchOffersFor3B4(candidateId).some(o=>o.status==='Declined')}
function candidateAlreadyUsed3B4(candidateId){return priorMatchOffersFor3B4(candidateId).some(o=>['Accepted','Scheduled','Completed'].includes(o.status))}
function candidateMaybeBlocked3B4(candidateId){return priorMatchOffersFor3B4(candidateId).some(o=>o.status==='Maybe'&&(!o.reconsiderDate||currentDate()<o.reconsiderDate))}
function candidatePersonEligible3B4(p){
 if(!p||p.movedAway||isFamilyPerson(p)||p.id===S.romance?.partnerId||p.formerPartner)return false;if(!eligibleRomance(p)||!playerPreferenceAllows3B4(p))return false;
 const c=romanceCompatibility(p),L=ensureLove(p);if(!c.orientationOK||c.committedElsewhere||loveStageIndex3B3(L.stage)>=LOVE_IDX.official)return false;
 if(candidateRejected3B4(p.id)||candidateAlreadyUsed3B4(p.id)||candidateMaybeBlocked3B4(p.id))return false;return true
}
function npcCandidateEligible3B4(n){
 if(!n||n.movedAway)return false;ensureIdentity(n,n.firstName,npcAge(n));ensureNpcTraits(n);ensureInterests(n);const age=npcAge(n);if(S.age<18){if(age<13||age>=18||Math.abs(age-S.age)>2)return false}else if(age<18)return false;
 if(!orientationIncludes(n.orientation,playerGender(),n.id))return false;const fake={gender:n.gender};if(!playerPreferenceAllows3B4(fake))return false;if(partnerNpcOf(n.id)||coupleOf(n.id))return false;
 const existing=(S.people||[]).find(p=>p.npcId===n.id);if(existing)return candidatePersonEligible3B4(existing);return !priorMatchOffersFor3B4('npc:'+n.id).some(o=>o.status==='Declined')
}
function matchHowKnown3B4(matchmaker,candidate){
 if(isFamilyPerson(matchmaker))return personAge(candidate)<18?`${familyRelationLabel(matchmaker)} knows them through school/community connections`:`${familyRelationLabel(matchmaker)} knows them through friends in the community`;
 const t=friendshipTier(matchmaker);return personAge(candidate)<18?`${t} knows them through school or mutual friends`:`${t} knows them through mutual friends or the local community`
}
function matchCandidateContext3B4(candidate){if(candidate.work)return candidate.roleLabel||'Work contact';if(personAge(candidate)<18)return 'Student';return candidate.roleLabel&&/work|college|university|campus/i.test(candidate.roleLabel)?candidate.roleLabel:'Local community contact'}
function materializeMatchCandidate3B4(n,matchmaker){
 let p=(S.people||[]).find(x=>x.npcId===n.id);if(!p){p=personFromNpc(n,'friend',`introduced by ${displayName(matchmaker,'formal')}`);p.rel=30;p.trust=35;p.respect=50;p.introducedBy=matchmaker.id;p.metVia='matchmaker introduction';p.roleLabel='matchmaker introduction';S.people.push(p)}
 ensureRomanceProfile(p);ensureNpcTraits(n);ensureInterests(n);return p
}
function matchCandidatePool3B4(matchmaker){
 ensureRoster();const people=(S.people||[]).filter(p=>p.id!==matchmaker.id&&candidatePersonEligible3B4(p));const knownNpc=new Set(people.map(p=>p.npcId).filter(Boolean));
 const fresh=(S.npcs||[]).filter(n=>!knownNpc.has(n.id)&&npcCandidateEligible3B4(n));return {people,fresh}
}
function chooseMatchCandidate3B4(matchmaker){
 const pool=matchCandidatePool3B4(matchmaker);if(pool.fresh.length){const ordered=[...pool.fresh].sort((a,b)=>(hashOf(`${matchmaker.id}|${currentDate()}|${a.id}`)%1000)-(hashOf(`${matchmaker.id}|${currentDate()}|${b.id}`)%1000));return materializeMatchCandidate3B4(ordered[0],matchmaker)}
 return pool.people.sort((a,b)=>romanceCompatibility(b).score-romanceCompatibility(a).score)[0]||null
}
function matchCandidateInfo3B4(offerOrId){
 const offer=typeof offerOrId==='string'?ensureRomance3B4State().offers.find(o=>o.id===offerOrId):offerOrId;if(!offer)return null;const p=personById(offer.candidateId),m=personById(offer.matchmakerId);if(!p||!m)return null;const n=npcById(p.npcId);if(n){ensureNpcTraits(n);ensureIdentity(n,n.firstName,npcAge(n))}const id=personIdentity(p),known=loveInterestKnown(p);
 return {offerId:offer.id,candidateId:p.id,fullName:displayName(p,'formal'),age:personAge(p),gender:id.gender,orientation:known?id.orientation:'Unknown',compatibility:romanceCompatibility(p).orientationOK?'Compatible in principle':'Not compatible',looks:n?looksLabel(n.looks):'Unknown',context:matchCandidateContext3B4(p),howKnown:offer.howKnown||matchHowKnown3B4(m,p),status:offer.status}
}
function activeMatchOfferFor3B4(matchmakerId){return [...ensureRomance3B4State().offers].reverse().find(o=>o.matchmakerId===matchmakerId&&(o.status==='Pending'||(o.status==='Maybe'&&o.reconsiderDate&&currentDate()>=o.reconsiderDate)))||null}
function createMatchOffer3B4(matchmaker,source='player'){
 if(typeof matchmaker==='string')matchmaker=personById(matchmaker);if(!matchmaker||!matchmakerEligible3B4(matchmaker)||S.romance?.partnerId)return null;const mm=ensureRomance3B4State(),existing=activeMatchOfferFor3B4(matchmaker.id);if(existing)return existing;
 if(matchmakingCooldownActive3B4(matchmaker))return null;const candidate=chooseMatchCandidate3B4(matchmaker);if(!candidate)return null;const offer={id:uid('match'),matchmakerId:matchmaker.id,candidateId:candidate.id,createdDate:currentDate(),source,status:'Pending',howKnown:matchHowKnown3B4(matchmaker,candidate)};mm.offers.push(offer);matchmaker.matchmakingNextDate=addDays(currentDate(),source==='npc'?35:14);ensureLove(candidate).matchmakingOfferId=offer.id;rememberPerson(candidate,`${displayName(matchmaker,'formal')} introduced you.`,1);return offer
}
function openMatchOffer3B4(offerId){
 const offer=ensureRomance3B4State().offers.find(o=>o.id===offerId);if(!offer)return;const x=matchCandidateInfo3B4(offer);if(!x)return;openModal(`An introduction from ${esc(displayName(personById(offer.matchmakerId),'formal'))}`,`<p><b>${esc(x.fullName)}</b> • ${x.age} • ${esc(x.gender)}</p><p><b>Looks:</b> ${esc(x.looks)}<br><b>Context:</b> ${esc(x.context)}<br><b>How they know them:</b> ${esc(x.howKnown)}<br><b>Interested in:</b> ${esc(x.orientation)}<br><b>Romantic compatibility:</b> ${esc(x.compatibility)}</p><p class="muted-text">This is only an introduction. Accepting does not force either person into a date or relationship.</p><div class="modal-action-grid"><button class="primary" data-mm-offer-action="accept" data-offer-id="${offer.id}">I'm open to meeting them</button><button data-mm-offer-action="maybe" data-offer-id="${offer.id}">Maybe later</button><button class="ghost" data-mm-offer-action="decline" data-offer-id="${offer.id}">No thanks</button></div>`)
}
// Overrides the old NPC-to-NPC setup modal with the Phase 3B Player matchmaking flow.
function matchmakeModal(personId){
 const m=personById(personId);if(!m)return;if(S.romance?.partnerId){toast('You are already in a committed relationship.');return}if(!matchmakerEligible3B4(m)){toast(`${firstName(m)} is not close enough to arrange a personal introduction.`);return}
 const old=activeMatchOfferFor3B4(m.id);if(old){openMatchOffer3B4(old.id);return}const offer=createMatchOffer3B4(m,'player');if(!offer){toast(matchmakingCooldownActive3B4(m)?`${firstName(m)} does not have another introduction for you yet.`:'They cannot think of a compatible single person to introduce right now.');return}advanceTime(15,{silent:true});openMatchOffer3B4(offer.id)
}
function recordMatchHistory3B4(offer,outcome){const mm=ensureRomance3B4State();if(!mm.history.some(h=>h.offerId===offer.id&&h.outcome===outcome)){mm.history.push({offerId:offer.id,candidateId:offer.candidateId,matchmakerId:offer.matchmakerId,dateISO:currentDate(),outcome});if(mm.history.length>100)mm.history.shift()}}
function respondMatchOffer3B4(offerId,action){
 const offer=ensureRomance3B4State().offers.find(o=>o.id===offerId),p=offer&&personById(offer.candidateId),m=offer&&personById(offer.matchmakerId);if(!offer||!p||!m)return false;closeChoiceModal();
 if(action==='decline'){offer.status='Declined';offer.resolvedDate=currentDate();recordMatchHistory3B4(offer,'Declined');ensureLove(p).matchmakingOfferId=null;log('No blind date',`You tell ${firstName(m)} that ${firstName(p)} does not sound like the right match. They do not keep pushing the same person.`);return true}
 if(action==='maybe'){offer.status='Maybe';offer.reconsiderDate=addDays(currentDate(),14);recordMatchHistory3B4(offer,'Maybe');log('Maybe later',`You ask ${firstName(m)} to keep the introduction in mind. ${firstName(p)} can be reconsidered after some time, not by immediate re-clicking.`);return true}
 if(action==='accept'){offer.status='Accepted';offer.acceptedDate=currentDate();recordMatchHistory3B4(offer,'Accepted');const L=ensureLove(p);L.matchmakingOfferId=offer.id;L.npcInterest=L.npcInterest==='incompatible'?'unknown':L.npcInterest;rememberPerson(p,`You agreed to an introduction arranged by ${displayName(m,'formal')}.`,2);log('Introduction accepted',`${firstName(m)} connects you with ${displayName(p,'formal')}. You can now plan a normal date; ${firstName(p)} still has their own say.`);openRomanceDatePlanner3B2(p.id,true);return true}return false
}
function noteMatchmakingPlan3B4(p,plan){const id=ensureLove(p)?.matchmakingOfferId,offer=id&&ensureRomance3B4State().offers.find(o=>o.id===id);if(!offer)return;plan.matchmakingOfferId=offer.id;plan.blindDate=true;offer.planId=plan.id;offer.status='Scheduled';recordMatchHistory3B4(offer,'Scheduled')}
function noteMatchmakingDateOutcome3B4(p,plan,tier){const offer=plan?.matchmakingOfferId&&ensureRomance3B4State().offers.find(o=>o.id===plan.matchmakingOfferId);if(!offer)return;offer.status='Completed';offer.outcome=tier;offer.completedDate=currentDate();recordMatchHistory3B4(offer,`Completed: ${tier}`);ensureLove(p).matchmakingOfferId=null}
function romanceProspects3B4(){return (S.people||[]).filter(p=>{if(isFamilyPerson(p)||p.id===S.romance?.partnerId)return false;const st=ensureLove(p).stage;return ['crushOne','crushMutual','goingOut'].includes(st)})}
function pauseOtherProspects3B4(partner){for(const p of romanceProspects3B4())if(p.id!==partner.id){const L=ensureLove(p);L.commitmentPaused=true;L.pausedByPartnerId=partner.id;rememberPerson(p,'Romantic progression paused when you entered an exclusive relationship.',2)}}
function romanceNpcMatchmakingInitiative3B4(){
 if(S.age<13||S.romance?.optOut||S.romance?.partnerId||SIM.skipping)return false;const mm=ensureRomance3B4State();if(mm.nextNpcOfferDate&&currentDate()<mm.nextNpcOfferDate)return false;if(mm.offers.some(o=>o.status==='Pending'||o.status==='Maybe'&&(!o.reconsiderDate||currentDate()<o.reconsiderDate)))return false;
 const ms=(S.people||[]).filter(matchmakerEligible3B4).filter(m=>!matchmakingCooldownActive3B4(m));if(!ms.length)return false;ms.sort((a,b)=>(b.rel??0)+(b.trust??0)-(a.rel??0)-(a.trust??0));const m=ms[0],pct=isFamilyPerson(m)?5:(friendshipTier(m)==='Best Friend'?8:5);if(!chance(pct))return false;const offer=createMatchOffer3B4(m,'npc');if(!offer)return false;mm.nextNpcOfferDate=addDays(currentDate(),45);const p=personById(offer.candidateId);queueEvent({type:'matchmakingOffer',title:`${displayName(m)} wants to introduce you to someone`,text:`${firstName(m)} says, "I know someone named ${displayName(p,'formal')} who might be worth meeting. Want to hear about them?"`,participants:[m.id,p.id],payload:{offerId:offer.id},priority:3,expiresDays:3,choices:[{id:'review',label:'Tell me about them'},{id:'maybe',label:'Maybe later'},{id:'decline',label:'No thanks'}]});return true
}
function romance3B4EventChoice(e,id){if(e.type!=='matchmakingOffer')return false;const offer=ensureRomance3B4State().offers.find(o=>o.id===e.payload?.offerId);if(!offer)return true;if(id==='review'){openMatchOffer3B4(offer.id);return true}return respondMatchOffer3B4(offer.id,id)}
function romance3B4Click(b){const d=b.dataset;if(d.mmOfferAction){respondMatchOffer3B4(d.offerId,d.mmOfferAction);save();render();return true}return false}
