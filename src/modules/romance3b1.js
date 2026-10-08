// =====================================================================
// PHASE 3B.1 — Canonical Romance State + Reciprocity
// p.love is the canonical per-person romance record.
// Legacy p.romanceStage / p.attraction remain compatibility mirrors only.
// =====================================================================
const ROMANCE_CANONICAL_STAGES=new Set(['noticing','crushOne','crushMutual','goingOut','official','inLove','superInLove','serious','livingTogether','engaged','married','family','ex']);
function deterministicNpcAttraction(p){
 const old=Number(p?.attraction);if(Number.isFinite(old))return clamp(old);
 const base=35+(hashOf((p?.id||p?.name||'person')+'-3b-attraction')%31);
 const lookEffect=((S.looks??50)-50)*.12;
 const shared=Array.isArray(p?.interests)&&Array.isArray(S.interests)?p.interests.filter(x=>S.interests.includes(x)).length:0;
 return clamp(Math.round(base+lookEffect+shared*3));
}
function canonicalRomanceStageFromLegacy(p){
 const rs=p?.romanceStage||'none';
 if(rs==='ex'||p?.formerPartner)return 'ex';
 if(rs==='partner')return 'official';
 if(rs==='dating')return 'goingOut';
 if(rs==='crush')return 'crushOne';
 return 'noticing';
}
function ensureLove(p){
 if(!p)return null;
 const legacyStage=canonicalRomanceStageFromLegacy(p),old=p.love&&typeof p.love==='object'?p.love:{};
 let stage=ROMANCE_CANONICAL_STAGES.has(old.stage)?old.stage:legacyStage;
 // Existing writers still set the legacy mirror. Preserve stronger established states
 // during the 3B transition instead of letting a stale canonical placeholder downgrade them.
 // formerPartner is historical identity, not the current romance state.  It may
 // help migrate a truly legacy record with no canonical state, but must never
 // force a reconciled/active relationship back to Ex.
 if((p.romanceStage==='ex'&&!(S.romance?.partnerId===p.id&&ROMANCE_CANONICAL_STAGES.has(old.stage)&&old.stage!=='ex'))||(p.formerPartner&&!ROMANCE_CANONICAL_STAGES.has(old.stage)&&!['crush','dating','partner'].includes(p.romanceStage)))stage='ex';
 else if(p.romanceStage==='partner'&&(!ROMANCE_CANONICAL_STAGES.has(old.stage)||LOVE_IDX[stage]<LOVE_IDX.official))stage='official';
 else if(p.romanceStage==='dating'&&(!ROMANCE_CANONICAL_STAGES.has(old.stage)||LOVE_IDX[stage]<LOVE_IDX.goingOut))stage='goingOut';
 // A legacy romanceStage="crush" alone is one-sided. Mutuality requires an
 // already-explicit mutual stage or an actual established relationship.
 const established=(S.romance?.partnerId===p.id&&stage!=='ex')||['goingOut','official','inLove','superInLove','serious','livingTogether','engaged','married','family'].includes(stage);
 const explicitMutual=old.stage==='crushMutual'||established;
 const playerCrush=old.playerCrush!=null?!!old.playerCrush:(p.romanceStage==='crush'||stage==='crushOne'||stage==='crushMutual'||established);
 const legacyAttraction=Number(p.attraction);
 const npcAttraction=Number.isFinite(legacyAttraction)&&(!Number.isFinite(Number(old.npcAttraction))||legacyAttraction!==Number(old.npcAttraction))?clamp(legacyAttraction):Number.isFinite(Number(old.npcAttraction))?clamp(Number(old.npcAttraction)):deterministicNpcAttraction(p);
 const npcInterest=old.npcInterest||((explicitMutual||established)?'reciprocates':'unknown');
 if(stage==='crushMutual'&&npcInterest!=='reciprocates')stage='crushOne';
 p.love={...old,stage,progress:clamp(old.progress??0),since:old.since||currentDate(),playerCrush,npcAttraction,npcInterest,mutual:!!(explicitMutual&&npcInterest==='reciprocates')};
 p.attraction=npcAttraction; // compatibility mirror for existing balancing/UI
 p.romanceStage=stage==='ex'?'ex':stage==='crushOne'||stage==='crushMutual'?'crush':stage==='goingOut'?'dating':LOVE_IDX?.[stage]>=LOVE_IDX?.official?'partner':'none';
 return p.love;
}
// H1 — A current partnership is keyed by the canonical Person ID, not by a
// stale romance initiation flag or by a similarly named world NPC.
function isEstablishedPartner(pOrId){
 const id=typeof pOrId==='string'?pOrId:pOrId?.id,p=typeof pOrId==='string'?(S.people||[]).find(x=>x.id===id):pOrId;
 if(!p||!id||isFamilyPerson(p)||S.romance?.partnerId!==id)return false;
 const stage=p.love?.stage,legacy=p.romanceStage;
 // An explicit breakup is not undone merely because an old partnerId survived.
 if(stage==='ex'||(legacy==='ex'&&!ROMANCE_CANONICAL_STAGES.has(stage)))return false;
 return ['official','inLove','superInLove','serious','livingTogether','engaged','married','family'].includes(stage)||legacy==='partner'||S.romance?.status==='In a relationship';
}
function relationshipStatus(pOrId){
 const p=typeof pOrId==='string'?(S.people||[]).find(x=>x.id===pOrId):pOrId;
 if(!p)return {kind:'unknown',personId:null};
 const current=isEstablishedPartner(p),stage=p.love?.stage||canonicalRomanceStageFromLegacy(p);
 return {kind:current?'official':stage==='ex'||p.romanceStage==='ex'?'ex':stage==='goingOut'?'dating':'single',personId:p.id,stage,currentPartner:current};
}
function partnerBoundaryH1(p,boundary){return !!p?.boundaries?.includes(boundary)}
function romanceCompatibility(p){
 if(!p||isFamilyPerson(p))return {eligible:false,reason:'family'};
 const ageOK=eligibleRomance(p),orientationOK=ageOK&&(isEstablishedPartner(p)||npcInterestedInPlayer(p));
 const committedElsewhere=!!p.datingNpc||!!(p.npcId&&partnerNpcOf(p.npcId));
 const conflict=clamp(p.conflict||0),trust=clamp(p.trust??50),close=clamp(p.rel??0),looks=clamp(S.looks??50);
 const traits=p.traits||[],shared=Array.isArray(p.interests)&&Array.isArray(S.interests)?p.interests.filter(x=>S.interests.includes(x)).length:0;
 const personalityBonus=traits.includes('Bold')?3:traits.includes('Shy')||traits.includes('Quiet')?-2:0;
 const score=clamp(close*.28+trust*.23+looks*.12+ensureLove(p).npcAttraction*.27+shared*4+personalityBonus-conflict*.25);
 return {eligible:ageOK&&orientationOK&&!committedElsewhere,ageOK,orientationOK,committedElsewhere,score};
}
function romanceActualAvailability(p){
 if(!p)return 'Unknown';
 if(isEstablishedPartner(p)){const st=ensureLove(p).stage;if(st==='married'||S.romance?.married?.personId===p.id)return 'Married';if(st==='engaged')return 'Engaged';return 'In a relationship'}
 if(p.datingNpc||p.npcId&&partnerNpcOf(p.npcId))return 'In a relationship';
 const st=ensureLove(p).stage;if(st==='goingOut')return 'Seeing someone';if(st==='crushMutual'||st==='crushOne')return 'Single';return 'Single';
}
function romanceKnownAvailability(p){return relStatusKnown(p)?romanceActualAvailability(p):'Unknown'}
function setPlayerCrush(p,on=true){const L=ensureLove(p);if(!L)return;L.playerCrush=!!on;if(on&&L.stage==='noticing')L.stage='crushOne';if(!on&&L.stage==='crushOne'&&L.npcInterest!=='reciprocates')L.stage='noticing';p.romanceStage=L.stage==='crushOne'||L.stage==='crushMutual'?'crush':p.romanceStage;}
function setNpcRomanticInterest(p,state='reciprocates'){
 const L=ensureLove(p);if(!L)return;L.npcInterest=state;
 L.mutual=state==='reciprocates'&&!!L.playerCrush;
 if(L.mutual&&LOVE_IDX[L.stage]<LOVE_IDX.crushMutual){L.stage='crushMutual';addPersonMilestone(p,'mutualAttraction','You realized the attraction was mutual.')}
 else if(!L.mutual&&L.stage==='crushMutual')L.stage=L.playerCrush?'crushOne':'noticing';
 p.romanceStage=['crushOne','crushMutual'].includes(L.stage)?'crush':p.romanceStage;
}
function setLoveStage(p,id,why=''){
 const L=ensureLove(p),prev=L.stage;if(prev===id)return;if(!ROMANCE_CANONICAL_STAGES.has(id))return;
 const mt={goingOut:'firstDate',official:'official',engaged:'engaged',married:'married',ex:'breakup'}[id];if(mt)addPersonMilestone(p,mt,why||'');
 L.stage=id;L.progress=0;L.since=currentDate();
 if(id==='crushOne'){L.playerCrush=true;L.mutual=false}
 if(id==='crushMutual'){L.playerCrush=true;L.npcInterest='reciprocates';L.mutual=true}
 if(['goingOut','official','inLove','superInLove','serious','livingTogether','engaged','married','family'].includes(id)){L.playerCrush=true;L.npcInterest='reciprocates';L.mutual=true}
 p.romanceStage=id==='ex'?'ex':id==='crushOne'||id==='crushMutual'?'crush':id==='goingOut'?'dating':LOVE_IDX[id]>=LOVE_IDX.official?'partner':'none';
 if(LOVE_IDX[id]>=LOVE_IDX.official&&S.romance.partnerId!==p.id)setPartner(p,'partner');
 if(LOVE_IDX[id]>=LOVE_IDX.goingOut&&!SIM.skipping){S.milestones.unshift({dateISO:currentDate(),age:S.age,title:`💗 ${LOVE[LOVE_IDX[id]].label}`,text:`${displayName(p,'formal')}${why?` — ${why}`:''}.`});notify('Relationship stage',`${displayName(p)}: ${LOVE[LOVE_IDX[id]].label}`,{sourceType:'love',sourceId:`love-${p.id}-${id}`,tab:'people'})}
 rememberPerson(p,`Relationship: ${id==='ex'?'Former partner':LOVE[LOVE_IDX[id]]?.label||id}.`,3)
}
function syncLoveAfterRomance(p,kind,before){if(!p||!eligibleRomance(p))return;const L=ensureLove(p);
 if(kind==='admire'){setPlayerCrush(p,true);if(L.npcInterest==='reciprocates'&&LOVE_IDX[L.stage]<LOVE_IDX.crushMutual)setLoveStage(p,'crushMutual')}
 if(kind==='askOut'&&S.romance.partnerId===p.id&&LOVE_IDX[L.stage]<LOVE_IDX.goingOut){setNpcRomanticInterest(p,'reciprocates');setLoveStage(p,'goingOut','started going out')}
 if(kind==='official'&&p.romanceStage==='partner'&&LOVE_IDX[L.stage]<LOVE_IDX.official)setLoveStage(p,'official');
 if(kind==='breakUp'){L.stage='ex';L.progress=0;L.mutual=false;p.formerPartner=true;ringOnBreakup(p)}
 if(kind==='talkRel')addLove(p,6);if(kind==='intimate')addLove(p,5)}
function ensureRomanceProfile(p){
 if(!p)return p;const first=!p.romanceInit;p.romanceInit=true;const L=ensureLove(p);
 p.romanceOpen=p.romanceOpen??(dayHash(p.id+'open')>=18);
 const c=romanceCompatibility(p);if(loveInterestVisible(p)&&!isEstablishedPartner(p)&&!c.orientationOK){p.romanceOpen=false;p.orientationMismatch=true;L.npcInterest='incompatible';L.mutual=false}
 else if(p.orientationMismatch&&c.orientationOK){p.orientationMismatch=false}
 if(!p.boundaries){const t=p.traits||[],b=[];if(t.includes('Shy')||t.includes('Quiet'))b.push('noPublicAffection');if(t.includes('Generous')||dayHash(p.id+'giftBoundary')<20)b.push('noExpensiveGifts');if(dayHash(p.id+'timeBoundary')<25)b.push('needsTime');if(t.includes('Shy')||dayHash(p.id+'partyBoundary')<15)b.push('noParties');if(!p.romanceOpen)b.push('notReady');p.boundaries=[...new Set(b)]}
 if(first&&L.playerCrush)addPersonMilestone(p,'firstCrush','A crush began to develop.');return p
}
function relationshipDescriptor(p){if(!p)return '';if(isEstablishedPartner(p)){const st=ensureLove(p).stage;if(st==='married')return 'Spouse';if(st==='engaged')return 'Fiancé/Fiancée';const g=personIdentity(p).gender;return g==='Male'?'Boyfriend':g==='Female'?'Girlfriend':'Partner'}if(ensureLove(p).stage==='ex'||p.formerPartner)return 'Ex';if(isFamilyPerson(p))return familyRelationLabel(p);const status=friendStatusLabel(p),tier=friendTier(p);return status||tier||'Acquaintance'}
function migrateCanonicalIdentityH1(){
 if(!S||S.crossPhaseH1Version>=1)return;
 for(const p of S.people||[]){
  if(isSibling(p))ensureSiblingBirthOrderH1(p);
  // Old friendTier() returned romantic "Dating"/"Serious" and caused false
  // downgrade notifications. Restore the actual friendship tier silently.
  if(isEstablishedPartner(p)&&['Dating','Serious'].includes(p.tier))p.tier=friendStatusLabel(p)||friendshipTier(p);
  for(const m of p.milestones||[]){
   if(m.type==='holdingHands'&&m.text==='Your first kiss together.')m.text='You held hands for the first time.';
  }
 }
 S.crossPhaseH1Version=1;
}
function migrateRomance3B1(){
 if(!S)return;S.romance=Object.assign({status:'Single',partner:null,partnerId:null,history:[]},S.romance||{});S.romance.history=Array.isArray(S.romance.history)?S.romance.history:[];
 Object.assign(MILESTONE_TYPES,{firstCrush:'First crush',mutualAttraction:'Mutual attraction discovered',breakup:'Breakup'});
 // Legacy name-only saves: recover a missing ID only from ONE unambiguous
 // matching Person in a non-single relationship. Never arbitrarily assign
 // the first of several NPCs who happen to share the same display name.
 if(!S.romance.partnerId&&S.romance.partner&&S.romance.status!=='Single'){
  const matches=(S.people||[]).filter(p=>displayName(p,'formal')===S.romance.partner||p.name===S.romance.partner);
  if(matches.length===1&&!isFamilyPerson(matches[0]))S.romance.partnerId=matches[0].id;
 }
 // Explicitly ended partner + Single status: retire only the stale pointer.
 // Never change their historical milestones or reconstruct a new relationship.
 const stale=S.romance.partnerId&&(S.people||[]).find(p=>p.id===S.romance.partnerId);
 if(stale&&(stale.love?.stage==='ex'||(stale.romanceStage==='ex'&&!stale.love))&&S.romance.status==='Single'){S.romance.partnerId=null;S.romance.partner=null}
 for(const p of S.people||[]){const L=ensureLove(p);ensureRomanceProfile(p);if(S.romance.partnerId===p.id){L.playerCrush=true;L.npcInterest='reciprocates';L.mutual=true;if(LOVE_IDX[L.stage]<LOVE_IDX.goingOut)L.stage=S.romance.status==='In a relationship'?'official':'goingOut'}if(L.stage==='ex')p.formerPartner=true}
 migrateCanonicalIdentityH1();S.romance3B1Migrated=true;if(typeof migrateRomance3B2==='function')migrateRomance3B2();
}
