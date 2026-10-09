// =====================================================================
// H6 — bounded, world-grounded NPC encounters and optional contact exchange.
// No second romance/date/contact authority; never create a Person on a glance.
// =====================================================================
const H6_ENCOUNTER_SCHEMA=1;
function h6State(){
 const x=S.socialEncountersH6&&typeof S.socialEncountersH6==='object'?S.socialEncountersH6:(S.socialEncountersH6={});
 if(x.version!==H6_ENCOUNTER_SCHEMA)x.version=H6_ENCOUNTER_SCHEMA;
 x.records=x.records&&typeof x.records==='object'&&!Array.isArray(x.records)?x.records:{};
 x.history=Array.isArray(x.history)?x.history.slice(-100):[];
 return x;
}
function migrateWorldEncountersH6(){return h6State()}
function h6Venue(){
 if(SIM.skipping||S.age<8)return null;
 const m=currentMinute();
 if(S.location==='School'&&typeof playerCurrentSchoolId4A2==='function'&&playerCurrentSchoolId4A2()&&m>=600&&m<=1080&&typeof periodAt==='function'&&periodAt()?.kind!=='class')return 'School';
 if(S.location==='Out'&&m>=540&&m<=1200)return 'Out';
 return null; // Home and bedrooms are not public encounter locations.
}
function h6OpportunityRate(looks=S.looks,context='Out'){
 const l=Number.isFinite(Number(looks))?clamp(Number(looks)):50;
 const rep=clamp(Number(S.social?.reputation??45));
 // Appearance changes the chance to be noticed, not who reciprocates or agrees.
 return Math.min(21,Math.max(3,7+(l-50)*.13+(rep-45)*.018+(context==='School'?1:0)));
}
function h6CandidatePool(venue){
 if(!venue)return [];
 const taken=new Set((S.people||[]).map(p=>p.npcId).filter(Boolean));
 if((S.people||[]).filter(p=>!isFamilyPerson(p)).length>=50)return [];
 const sid=venue==='School'?playerCurrentSchoolId4A2():null;
 return (S.npcs||[]).filter(n=>{
  if(!n?.id||!n.fullName||taken.has(n.id)||n.movedAway)return false;
  const age=npcAge(n),delta=Math.abs(age-S.age);
  if(S.age<18?(age<8||age>18||delta>2):(age<18||delta>8))return false;
  if(venue==='School'&&(!sid||n.currentSchoolId!==sid))return false;
  const rec=h6State().records[n.id];if(rec?.declinedUntil&&currentDate()<rec.declinedUntil)return false;
  if(rec?.lastNoticed&&daysBetween(rec.lastNoticed,currentDate())<21)return false;
  const probe={id:n.id,npcId:n.id,age,traits:n.traits||[],goals:n.goals||[]};
  const availability=npcStatusAt(probe);
  if(venue==='School')return availability.atSchool||availability.free;
  return availability.free===true;
 });
}
function h6PickCandidate(venue){
 const pool=h6CandidatePool(venue);
 if(!pool.length)return null;
 // Seeded rotation avoids permanently favoring the highest-rated person.
 return [...pool].sort((a,b)=>hashOf(`${currentDate()}|${venue}|${a.id}`)-hashOf(`${currentDate()}|${venue}|${b.id}`))[0];
}
function h6Log(rec,kind,extra={}){
 const s=h6State(),entry={kind,npcId:rec.npcId,personId:rec.personId||null,dateISO:currentDate(),venue:rec.venue,...extra};
 s.history.push(entry);if(s.history.length>100)s.history.shift();return entry;
}
function h6MaybeNotice(venue=h6Venue(),{force=false}={}){
 if(!venue||h6Venue()!==venue)return false;
 const s=h6State();if(s.lastOpportunity&&daysBetween(s.lastOpportunity,currentDate())<5)return false;
 if((S.events||[]).some(e=>e.status==='Open'&&/^h6/.test(e.type)))return false;
 if(!force&&Math.random()*100>=h6OpportunityRate(S.looks,venue))return false;
 const n=h6PickCandidate(venue);if(!n)return false;
 s.lastOpportunity=currentDate();
 const r=s.records[n.id]||{npcId:n.id,stage:'unmet'};r.lastNoticed=currentDate();r.venue=venue;s.records[n.id]=r;
 const traits=n.traits||[],outgoing=traits.includes('Outgoing')||traits.includes('Bold'),shy=traits.includes('Shy')||traits.includes('Quiet');
 const place=venue==='School'?'the school common area':'a public spot in town';
 const text=outgoing?`Someone about your age notices you nearby in ${place}. They smile and approach, but leave you room to respond.`:shy?`Someone about your age catches your eye in ${place}. They offer a quick, uncertain smile before returning to what they were doing.`:`You cross paths with someone around your age in ${place}. You could say hello and learn their name, or keep going.`;
 h6Log(r,'noticed');
 return !!queueEvent({type:'h6Notice',title:outgoing?'Someone approaches you':'A chance encounter',text,participants:[],payload:{npcId:n.id,venue,dateISO:currentDate()},priority:2,expiresDays:1,choices:[{id:'hello',label:'Say hello'},{id:'smile',label:'Smile and carry on'},{id:'leave',label:'Keep walking'}]});
}
function h6Meet(n,venue){
 const s=h6State(),r=s.records[n.id];if(!r)return null;
 let p=(S.people||[]).find(x=>x.npcId===n.id);
 if(!p){
  if((S.people||[]).filter(x=>!isFamilyPerson(x)).length>=50)return null;
  const label=venue==='School'?'school friend':'met out in town';
  p=personFromNpc(n,'friend',label);p.rel=18;p.trust=45;p.fun=50;p.knownSince=S.age;p.metAt=venue==='School'?'school common area':'a public place in town';
  if(typeof recordMeetingProvenance4A4==='function'){
   if(venue==='School'&&typeof recordCurrentSchoolMeeting4A4==='function')recordCurrentSchoolMeeting4A4(p,'sameSchool');
   else recordMeetingProvenance4A4(p,{sourceType:'neighborhood',metAt:p.metAt,metVia:'first conversation'});
  }
  S.people.push(p);
 }
 r.personId=p.id;r.stage='met';r.metDate=r.metDate||currentDate();r.lastChat=currentDate();r.nextFollowUp=addDays(currentDate(),3);
 h6Log(r,'firstChat');rememberPerson(p,`You met ${displayName(p,'formal')} at ${p.metAt}.`,2);
 return p;
}
function h6ConversationEvent(p,r){
 const n=npcById(r.npcId),interest=Array.isArray(n?.traits)&&n.traits.includes('Shy')?'They speak quietly, but seem interested in a short chat.':'They seem happy to exchange a few words.';
 return queueEvent({type:'h6Conversation',title:`Getting to know ${displayName(p,'formal')}`,text:`${interest} Getting acquainted does not mean either of you has a crush.`,participants:[p.id],payload:{npcId:r.npcId,personId:p.id,venue:r.venue},priority:2,expiresDays:1,choices:[{id:'chat',label:'Talk about shared interests'},{id:'contact',label:'Ask to exchange contacts'},{id:'goodbye',label:'Say goodbye politely'}]});
}
function h6MaybeFollowUp(venue=h6Venue(),{force=false}={}){
 if(!venue||h6Venue()!==venue)return false;
 const s=h6State();if((S.events||[]).some(e=>e.status==='Open'&&/^h6/.test(e.type)))return false;
 const possibilities=Object.values(s.records).filter(r=>r.personId&&r.stage==='met'&&r.nextFollowUp&&r.nextFollowUp<=currentDate()&&r.venue===venue).map(r=>({r,p:personById(r.personId)})).filter(x=>{
  if(!x.p||x.p.movedAway||x.p.friendStatus==='Former Friend')return false;
  const n=npcById(x.r.npcId);if(!n)return false;
  if(venue==='School'&&n.currentSchoolId!==playerCurrentSchoolId4A2())return false;
  const a=npcStatusAt(x.p);return venue==='School'?(a.atSchool||a.free):a.free;
 });
 if(!possibilities.length)return false;
 const {r,p}=possibilities.sort((a,b)=>a.r.nextFollowUp.localeCompare(b.r.nextFollowUp)||a.r.npcId.localeCompare(b.r.npcId))[0];
 if(!force&&!chance(32))return false;
 r.nextFollowUp=addDays(currentDate(),14);h6Log(r,'followUpOffered');
 return !!queueEvent({type:'h6FollowUp',title:`${displayName(p,'formal')} remembers you`,text:`You cross paths again ${venue==='School'?'between school activities':'in town'}. ${firstName(p)} asks whether you have a moment to catch up.`,participants:[p.id],payload:{npcId:r.npcId,personId:p.id,venue},priority:2,expiresDays:1,choices:[{id:'talk',label:'Catch up'},{id:'later',label:'Another time'},{id:'decline',label:'Not interested'}]});
}
function h6NpcOpportunity(){
 const venue=h6Venue();if(!venue)return false;
 return h6MaybeFollowUp(venue)||h6MaybeNotice(venue);
}
// Retain the existing social, romance and matchmaking initiative routes.
function npcInitiative(){
 if(SIM.skipping)return;
 if(h6NpcOpportunity())return;
 if(!S.people.length||!chance(28))return;
 if(typeof maybeNpcContactExchange3C1==='function'&&maybeNpcContactExchange3C1())return;
 // Committed characters receive their own partner's initiative, never a
 // stranger's automatically scheduled romantic date (H6 exclusivity contract).
 if(S.romance?.partnerId){
  if(typeof romanceNpcRelationshipInitiative3B3==='function'&&romanceNpcRelationshipInitiative3B3())return;
  const partner=personById(S.romance.partnerId);
  if(partner&&eligibleRomance(partner)&&chance(10)&&createNpcDateInvitation3B2(partner))return;
 }else if(romanceNpcInitiative3B2())return;
 const p=rand(S.people);if(!p)return;
 if(p.role==='parent'&&S.school&&chance(45)){queueEvent({type:'parentSchool',title:`${p.name} asks about school`,text:'They want to know how grades, homework and stress are going.',participants:[p.id],choices:[{id:'honest',label:'Be honest'},{id:'hide',label:'Downplay problems'},{id:'help',label:'Ask for help'}]});return}
 if(p.role==='friend'&&S.age>=6){const canMsg=typeof canDirectCommunicate3C1==='function'?canDirectCommunicate3C1(p,'message'):canUsePhone();if(canMsg&&chance(50))incomingMessage(p,'chitchat');else npcInvitesPlayer(p)}
}
function npcSchoolInitiative(){
 if(h6NpcOpportunity())return;
 const p=rand(S.people.filter(x=>x.role==='friend'));
 if(!p)return;queueEvent({type:'schoolSocial',title:`Something happens with ${p.name}`,text:'A school-day interaction could strengthen or strain the relationship.',participants:[p.id],choices:[{id:'talk',label:'Talk it out'},{id:'joke',label:'Make a joke'},{id:'ignore',label:'Ignore it'}]});
}
function h6EventChoice(e,id){
 if(!['h6Notice','h6Conversation','h6FollowUp'].includes(e?.type))return false;
 const s=h6State(),r=s.records[e.payload?.npcId],n=npcById(e.payload?.npcId),p=r?.personId&&personById(r.personId);
 if(!r||!n)return true;
 if(e.type==='h6Notice'){
  if(r.stage==='met')return true;
  if(id==='hello'&&h6Venue()===e.payload.venue){const met=h6Meet(n,e.payload.venue);if(met){advanceTime(8,{silent:true});log('A new acquaintance',`You introduce yourself to ${displayName(met,'formal')}. Neither of you has promised anything.`);h6ConversationEvent(met,r)}else log('Crowded social circle','You are keeping your circle small right now.');return true}
  r.stage='unmet';r.declinedUntil=addDays(currentDate(),id==='leave'?25:12);h6Log(r,id==='smile'?'acknowledged':'passedBy');log('A passing encounter',id==='smile'?`You exchange a friendly smile with the stranger. Perhaps you will meet properly another day.`:'You continue with your day. Nobody follows you.');return true;
 }
 if(!p)return true;
 if(h6Venue()!==r.venue){h6Log(r,'missedConnection');log('Missed encounter',`${firstName(p)} is not here anymore. You can try to reconnect another day.`);return true}
 if(e.type==='h6Conversation'){
  if(id==='contact'){
   const gate=contactExchangeEligibility3C1(p);
   if(!gate.ok)log('Contact exchange unavailable',gate.reason);
   else exchangeContact3C1(p.id); // Existing device, consent, refusal and decision authority.
   h6Log(r,'contactRequested');return true;
  }
  if(id==='chat'){advanceTime(12,{silent:true});p.rel=clamp(p.rel+3);p.trust=clamp(p.trust+2);r.conversations=(r.conversations||0)+1;r.lastChat=currentDate();rememberPerson(p,'You chatted about shared interests after meeting.',1);h6Log(r,'friendlyChat');log('First conversation',`You and ${firstName(p)} find a few things to talk about. It may grow into a friendship.`)}
  else {h6Log(r,'goodbye');log('See you around',`You say goodbye to ${firstName(p)}.`)}return true;
 }
 if(e.type==='h6FollowUp'){
  if(id==='talk'){advanceTime(15,{silent:true});p.rel=clamp(p.rel+3);p.trust=clamp(p.trust+1);r.conversations=(r.conversations||0)+1;r.lastChat=currentDate();h6Log(r,'reconnected');rememberPerson(p,'You caught up again after your first meeting.',1);log('A familiar face',`${firstName(p)} remembers your conversation. You share a relaxed chat.`);
   // A genuinely friendly NPC may ask for contact details after a real second
   // conversation; 3C.1 owns the player's answer, device and contact ledger.
   if(r.conversations>=2&&(!r.contactOfferAfter||r.contactOfferAfter<=currentDate())&&typeof contactExchangeEligibility3C1==='function'){
    const gate=contactExchangeEligibility3C1(p),traits=p.traits||[];
    if(gate.ok&&!gate.already&&chance(traits.includes('Outgoing')?42:traits.includes('Shy')?12:26)){
     r.contactOfferAfter=addDays(currentDate(),30);h6Log(r,'npcContactRequested');
     queueEvent({type:'contactExchangeOffer',title:`${displayName(p,'formal')} asks to keep in touch`,text:`After getting to know you, ${firstName(p)} asks whether you would like to exchange numbers. You may decline.`,participants:[p.id],payload:{personId:p.id,source:'worldEncounterH6'},priority:2,expiresDays:2,choices:[{id:'accept',label:'Exchange contacts'},{id:'later',label:'Maybe later'},{id:'decline',label:'No thanks'}]});
    }
   }

   // Genuine NPC date initiatives still belong to the existing 3B planner.
   if(S.age>=13&&!S.romance?.partnerId&&r.conversations>=2&&typeof eligibleRomance==='function'&&eligibleRomance(p)){
    const c=romanceCompatibility(p),L=ensureLove(p);
    if(c.eligible&&L.npcAttraction>=62&&c.score>=56&&chance(15))createNpcDateInvitation3B2(p);
   }
  }else if(id==='later'){r.nextFollowUp=addDays(currentDate(),7);h6Log(r,'rescheduled');log('Maybe another day',`${firstName(p)} understands and leaves you to your plans.`)}
  else{r.nextFollowUp=addDays(currentDate(),45);r.declinedUntil=addDays(currentDate(),45);h6Log(r,'declined');log('Respecting distance',`${firstName(p)} gives you space.`)}return true;
 }
 return true;
}
