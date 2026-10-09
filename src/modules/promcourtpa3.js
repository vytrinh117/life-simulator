// HF-PA.3 — event-scoped coronation choices and genuine, attendance-verified encounters.
// Uses locked 6A Court winners, 6B ceremony/arrival, H3 visitor credentials and H4/H5 romance.
const PROM_PA3_SCHEMA=1;
const PROM_PA3_COST={anticipate:5,meet:5,compliment:8,refreshment:10,dance:15,photo:12,admire:6,approach:10,farewell:5,
 speechThanks:4,speechFriends:4,speechQuiet:4,speechPartner:4,partnerTalk:10,partnerDance:15,partnerPhoto:12,partnerHands:8,partnerKiss:10};
function promPA3Record(pr=S?.school?.prom){
 const n=promNightRecord6B1(pr),r=n?.courtStoryPA3;
 return n&&r?.eventId===n.eventId&&r?.schoolId===n.schoolId?r:null;
}
function promPA3Ensure(pr=S?.school?.prom){
 const n=promNightRecord6B1(pr);if(!n?.attendanceRecorded||n.status!=='attending'||!promArrivalGate6B3().ok)return null;
 if(promPA3Record(pr))return n.courtStoryPA3;
 n.courtStoryPA3={schemaVersion:PROM_PA3_SCHEMA,eventId:n.eventId,schoolId:n.schoolId,records:[],speech:null};
 return n.courtStoryPA3;
}
function promPA3Winners(pr=S?.school?.prom){
 const c=promCourtRecord6A4(pr),r=promCeremonyRecord6B5(pr),n=promNightRecord6B1(pr);
 if(!c?.ballotLocked||!c.results?.winners||!r?.ceremony||r.ceremony.ballotEventId!==n?.eventId)return [];
 // Read the original locked ceremony and its official nominee identities; never recalculate winners.
 return (r.ceremony.results||[]).filter(x=>c.results.winners[x.category]===x.personId&&c.nominees.some(y=>y.personId===x.personId&&y.category===x.category));
}
function promPA3Partner(pr,a){
 const p=S.romance?.partnerId&&personById(S.romance.partnerId);
 if(!p||!romanceH5CanonicalPartner(p)||!eligibleRomance(p))return null;
 const npc=p.npcId&&npcById(p.npcId);
 const student=!!npc&&a.attendeeIds.includes(npc.id)&&promCourtSchoolPeer6A4(npc,pr);
 const ev=typeof schoolGuestHostPromH3==='function'?schoolGuestHostPromH3(pr):null;
 const guest=ev&&typeof schoolGuestRegistrationH3==='function'?schoolGuestRegistrationH3(ev.id,p.id):null;
 const admitted=!!guest&&guest.personId===p.id&&guest.status==='CheckedIn'&&!!guest.arrival&&guest.arrival.dateISO===currentDate()&&guest.hostSchoolId===pr.foundation6A1.schoolId;
 return student||admitted?{p,npc,student,guest:admitted}:null;
}
function promPA3Gate(kind,npcId=null){
 const g=promArrivalGate6B3();if(!g.ok)return g;
 const pr=S.school.prom,n=promNightRecord6B1(pr),a=reconcilePromArrival6B3(pr),c=promCourtRecord6A4(pr);
 const s=promPA3Ensure(pr);if(!s||!c?.ballotLocked||!c.results)return {ok:false,reason:'court_not_available'};
 if(!Object.hasOwn(PROM_PA3_COST,kind))return {ok:false,reason:'unknown_scene'};
 const cost=PROM_PA3_COST[kind];if(currentMinute()+cost>n.endMinute)return {ok:false,reason:'not_enough_time'};
 const key=kind+'|'+(npcId||'player');
 if(s.records.some(x=>x.key===key))return {ok:false,reason:'scene_already_completed'};
 const ceremony=promCeremonyRecord6B5(pr)?.ceremony;
 if(kind==='anticipate'){
  if(ceremony)return {ok:false,reason:'ceremony_already_finished'};
  return {ok:true,pr,n,a,c,s,cost,key};
 }
 if(!ceremony)return {ok:false,reason:'attend_ceremony_first'};
 if(kind.startsWith('speech')){
  if(!promPA3Winners(pr).some(x=>x.personId==='player'))return {ok:false,reason:'not_a_court_winner'};
  if(s.speech)return {ok:false,reason:'speech_already_given'};
  if(kind==='speechPartner'&&!promPA3Partner(pr,a))return {ok:false,reason:'partner_not_present'};
  return {ok:true,pr,n,a,c,s,cost,key};
 }
 if(kind.startsWith('partner')){
  const partner=promPA3Partner(pr,a);if(!partner)return {ok:false,reason:'partner_not_checked_in'};
  if(['partnerHands','partnerKiss'].includes(kind)&&partnerBoundaryH1(partner.p,'noPublicAffection'))return {ok:false,reason:'partner_private_affection_boundary'};
  if(kind==='partnerKiss'&&(partnerBoundaryH1(partner.p,'notReady')||partner.p.trust<60||partner.p.rel<65))return {ok:false,reason:'not_ready_for_a_kiss'};
  return {ok:true,pr,n,a,c,s,cost,key,person:partner.p,npc:partner.npc};
 }
 const winner=promPA3Winners(pr).find(x=>x.personId===npcId&&x.personId!=='player');
 if(!winner)return {ok:false,reason:'not_an_official_winner'};
 const npc=npcById(npcId);
 if(!npc||!a.attendeeIds.includes(npcId)||!promCourtSchoolPeer6A4(npc,pr)||npc.available===false)return {ok:false,reason:'winner_not_present'};
 const person=(S.people||[]).find(p=>p.npcId===npcId&&!isFamilyPerson(p));
 const greeted=a.greetings.some(x=>x.npcId===npcId);
 if(kind==='meet'){
  if(greeted)return {ok:false,reason:'already_introduced'};
  if(!person&&(S.people||[]).filter(p=>!isFamilyPerson(p)).length>=50)return {ok:false,reason:'people_limit_reached'};
 }else if(!greeted||!person)return {ok:false,reason:'introduce_yourself_first'};
 if(kind==='admire'&&(S.romance?.partnerId||!eligibleRomance(person)||!orientationIncludes(S.attraction,personIdentity(person).gender,person.id)||!!person.datingNpc||!!(person.npcId&&partnerNpcOf(person.npcId))))return {ok:false,reason:'romance_not_available'};
 return {ok:true,pr,n,a,c,s,cost,key,npc,person,winner};
}
function promPA3Consent(g,kind){
 const p=g.person,n=g.npc;
 if(p?.available===false||n?.available===false)return false;
 if(kind==='partnerKiss'&&(partnerBoundaryH1(p,'noPublicAffection')||partnerBoundaryH1(p,'notReady')))return false;
 if(kind==='partnerHands'&&partnerBoundaryH1(p,'notReady'))return false;
 if(['approach','dance','partnerDance','partnerKiss','partnerHands','photo','partnerPhoto'].includes(kind)){
  if(n?.promDeclinesDance===true&&kind.toLowerCase().includes('dance'))return false;
  const shy=(n?.traits||p?.traits||[]).includes('Shy')?-12:0;
  const base=kind==='partnerKiss'?60:kind.startsWith('partner')?70:kind==='approach'?22:44;
  const notice=kind==='approach'?((S.looks??50)-50)*.18:0;
  const score=Math.max(5,Math.min(94,base+(p?.rel||40)*.15+(p?.trust||50)*.1+shy+notice-(p?.conflict||0)*.3));
  return hashOf(g.n.eventId+'|pa3-consent|'+kind+'|'+(g.npc?.id||p?.id))%100<score;
 }
 return true;
}
function promPA3Action(kind,npcId=null){
 const g=promPA3Gate(kind,npcId);if(!g.ok)return g;
 if(kind==='meet'){
  const result=promArrivalGreet6B3(npcId);if(!result.ok)return result;
  g.s.records.push({key:g.key,kind,personId:result.personId,npcId,dateISO:currentDate(),minute:currentMinute()-5,accepted:true,description:'Introduced to a real winner at the school Prom.'});
  return {ok:true,kind,accepted:true};
 }
 const {s,n,cost,person,npc}=g,at={dateISO:currentDate(),minute:currentMinute()};
 let accepted=promPA3Consent(g,kind),description='';
 if(kind==='anticipate')description='You listen to the buzz about tonight’s school awards without guessing who will win.';
 else if(kind.startsWith('speech')){
  s.speech=kind;
  description=kind==='speechThanks'?'You thank the students and the school staff for the honor.':kind==='speechFriends'?'You acknowledge the friends and classmates who supported you.':kind==='speechPartner'?`You thank ${displayName(person)} for being there for you.`:'You accept the school award with a quiet smile.';
 }else if(kind.startsWith('partner')){
  if(!accepted)description=`${displayName(person)} gently declines this moment, and you respect their answer.`;
  else description=kind==='partnerTalk'?`You and ${displayName(person)} share a quiet conversation after the ceremony.`:kind==='partnerDance'?`You and ${displayName(person)} share a dance.`:kind==='partnerPhoto'?`You and ${displayName(person)} take a photo together.`:kind==='partnerHands'?`You and ${displayName(person)} hold hands while the music plays.`:`You and ${displayName(person)} share a brief, mutual kiss.`;
 }else{
  description=!accepted?`${npc.fullName||npc.name} politely declines, and you respect their choice.`:
   kind==='compliment'?`You congratulate ${npc.fullName||npc.name} on winning the school vote.`:
   kind==='refreshment'?`You and ${npc.fullName||npc.name} share water and snacks at the school refreshment table.`:
   kind==='dance'?`${npc.fullName||npc.name} agrees to a dance after the ceremony.`:
   kind==='photo'?`${npc.fullName||npc.name} agrees to a photograph together.`:
   kind==='admire'?`You privately acknowledge a small crush on ${npc.fullName||npc.name}; you do not assume they feel the same.`:
   kind==='approach'?`${npc.fullName||npc.name} starts a friendly conversation after noticing you in the crowd.`:
   `You wish ${npc.fullName||npc.name} a good evening before heading out.`;
 }
 const row={key:g.key,kind,npcId:npc?.id||null,personId:person?.id||null,accepted,description,...at,cost};
 s.records.push(row); // Event receipt first: replay, re-render and reload cannot duplicate effects.
 advanceTime(cost,{silent:true});
 if(accepted&&person){
  if(kind.startsWith('partner')){
   const outcome=applyRelationshipOutcomeH5(person.id,'pa3:'+kind,'completed',{
    transactionId:`${n.eventId}:court-pa3:${g.key}`,dailyKey:'prom-pa3:'+kind,
    gain:kind==='partnerKiss'?3:kind==='partnerDance'?3:2,rel:1,trust:1});
   row.romance=outcome.ok?{gain:outcome.gain,reason:outcome.reason}:{gain:0,reason:outcome.reason};
   if(kind==='partnerHands'&&!hasMs(person,'holdingHands'))addPersonMilestone(person,'holdingHands','You held hands at the school Prom for the first time.');
   if(kind==='partnerKiss'&&!hasMs(person,'firstKiss'))addPersonMilestone(person,'firstKiss','Your first kiss together, after both agreed at school Prom.');
   if(['partnerPhoto','partnerDance','partnerHands','partnerKiss'].includes(kind))rememberPerson(person,description,2);
   // H5 owns romantic points; the existing 3B milestone type/uniqueness rules own firsts.
  }else if(kind==='admire'){
   if(eligibleRomance(person)&&!S.romance?.partnerId&&!(person.datingNpc||person.npcId&&partnerNpcOf(person.npcId)))setPlayerCrush(person,true);
  }else{
   person.rel=clamp((person.rel??45)+(kind==='dance'||kind==='approach'?2:1));
   if(['dance','photo','compliment','approach'].includes(kind))rememberPerson(person,description,1);
  }
 }
 log('Prom Court · '+kind,description);
 return {ok:true,kind,accepted,eventId:n.eventId,personId:person?.id||null,description};
}
function promPA3Html(pr=S?.school?.prom){
 const n=promNightRecord6B1(pr),a=promArrivalRecord6B3(pr),c=promCourtRecord6A4(pr);
 if(!n||n.status!=='attending'||!a||!c?.ballotLocked||!c.results)return '';
 const s=promPA3Ensure(pr),gate=promArrivalGate6B3();if(!s||!gate.ok)return '';
 const ceremony=promCeremonyRecord6B5(pr)?.ceremony;
 const action=(kind,label,id=null)=>{const g=promPA3Gate(kind,id);return `<button class="small ghost" data-pa3-action="${esc(kind)}" ${id?`data-pa3-id="${esc(id)}"`:''} ${g.ok?'':`disabled title="${esc(String(g.reason).replaceAll('_',' '))}"`}>${esc(label)}</button>`};
 let html=`<section class="prom-pa3-stories" data-pa3-event="${esc(n.eventId)}"><h4>Coronation & Prom Stories</h4><p class="muted-text">Only counted Court results and people actually here. Sharing a moment never guarantees attraction or affection.</p>`;
 if(!ceremony){html+=action('anticipate','Listen to Court-night anticipation · 5 min');return html+'<p class="muted-text">Attend the 9 PM ceremony to reveal and interact with the winners.</p></section>'}
 const winners=promPA3Winners(pr),myWin=winners.some(x=>x.personId==='player');
 if(myWin)html+=`<div class="prom-pa3-award"><b>You received ${esc(winners.filter(x=>x.personId==='player').map(x=>x.award).join(', '))}</b><p class="muted-text">Choose how to respond to the official award (one response).</p>${s.speech?`<p>${esc(s.records.find(x=>x.kind===s.speech)?.description||'Your response is recorded.')}</p>`:`<div class="inline-actions">${action('speechThanks','Thank the school')}${action('speechFriends','Thank classmates')}${action('speechPartner','Acknowledge partner')}${action('speechQuiet','Quiet smile')}</div>`}</div>`;
 html+=`<div class="prom-pa3-winners"><h5>Meet the actual winners</h5>`;
 for(const w of winners){if(w.personId==='player')continue;
  const npc=npcById(w.personId),present=!!npc&&a.attendeeIds.includes(w.personId)&&promCourtSchoolPeer6A4(npc,pr),p=(S.people||[]).find(x=>x.npcId===w.personId);
  const greeted=a.greetings.some(x=>x.npcId===w.personId);
  html+=`<article class="prom-pa3-winner"><b>${esc(w.award)} · ${esc(w.name)}</b><small>${present?' Present in the Hall':' Not in the Hall — no meeting possible'}</small>`;
  if(present)html+=`<div class="inline-actions">${!greeted?action('meet','Introduce yourself',w.personId):[
   action('compliment','Congratulate',w.personId),action('refreshment','Share refreshments',w.personId),action('photo','Ask for photo',w.personId),action('dance','Ask to dance',w.personId),action('approach','See if they approach',w.personId),action('admire','Admit a crush (optional)',w.personId),action('farewell','Say goodbye',w.personId)].join('')}</div>`;
  html+='</article>';
 }
 html+='</div>';
 const partner=promPA3Partner(pr,a);
 if(partner)html+=`<div class="prom-pa3-partner"><h5>${esc(displayName(partner.p))} · Your partner is here</h5><p class="muted-text">Private boundaries and consent still apply. No romantic reward beyond the H5 daily cap.</p><div class="inline-actions">${action('partnerTalk','Quiet conversation')}${action('partnerDance','Share a dance')}${action('partnerPhoto','Couple photo')}${action('partnerHands','Hold hands')}${action('partnerKiss','Ask for a kiss')}</div></div>`;
 const rec=s.records.slice(-6);if(rec.length)html+=`<details><summary>Moments recorded · ${s.records.length}</summary>${rec.map(x=>`<p class="muted-text">${esc(x.description)}</p>`).join('')}</details>`;
 return html+'</section>';
}
const promPA3OldCeremonyHtml=promCeremonyHtml6B5;
promCeremonyHtml6B5=function(pr=S?.school?.prom){return promPA3OldCeremonyHtml(pr)+promPA3Html(pr)};
const promPA3OldClick=promClick;
promClick=function(b){if(b?.dataset?.pa3Action){const r=promPA3Action(b.dataset.pa3Action,b.dataset.pa3Id||null);if(!r.ok)toast('Prom Court story: '+String(r.reason).replaceAll('_',' '));save();render();return true}return promPA3OldClick(b)};

// One optional after-Prom follow-up. Requires an already-exchanged legitimate contact.
function promPA3FollowupGate(npcId){
 const pr=S?.school?.prom,n=promNightRecord6B1(pr),story=promPA3Record(pr),a=promArrivalRecord6B3(pr);
 if(!n||n.status!=='completed'||!n.attendanceRecorded||!story||!a)return {ok:false,reason:'prom_not_completed'};
 if(S.location!=='Home'||daysBetween(n.dateISO,currentDate())<0||daysBetween(n.dateISO,currentDate())>1)return {ok:false,reason:'followup_window_closed'};
 if(!promPA3Winners(pr).some(x=>x.personId===npcId&&x.personId!=='player'))return {ok:false,reason:'not_an_official_winner'};
 if(!a.greetings.some(x=>x.npcId===npcId))return {ok:false,reason:'not_met_at_prom'};
 const p=(S.people||[]).find(x=>x.npcId===npcId&&!isFamilyPerson(x));
 if(!p||!canDirectCommunicate3C1(p,'message'))return {ok:false,reason:'contact_exchange_and_device_required'};
 const key='followup|'+npcId;
 if(story.records.some(x=>x.key===key))return {ok:false,reason:'already_followed_up'};
 return {ok:true,pr,n,story,person:p,key};
}
function promPA3Followup(npcId){
 const g=promPA3FollowupGate(npcId);if(!g.ok)return g;
 const at={dateISO:currentDate(),minute:currentMinute()};
 const msg=chatAdd(g.person.id,'me',`Congrats again on Prom Court! It was nice seeing you at the school Hall.`,'chat');
 if(!msg)return {ok:false,reason:'message_not_available'};
 g.story.records.push({key:g.key,kind:'followup',npcId,personId:g.person.id,accepted:true,description:`You sent ${displayName(g.person)} a friendly congratulatory message. A reply is not guaranteed.`,...at,cost:5,messageId:msg.id});
 advanceTime(5,{silent:true});log('After Prom',`You message ${displayName(g.person)} to congratulate them. You do not assume an immediate reply.`);
 return {ok:true,messageId:msg.id};
}
function promPA3AfterHtml(pr=S?.school?.prom){
 const n=promNightRecord6B1(pr),s=promPA3Record(pr);
 if(!n||n.status!=='completed'||!s||S.location!=='Home')return '';
 const c=promCourtRecord6A4(pr),w=promPA3Winners(pr);
 const ids=w.filter(x=>x.personId!=='player'&&promArrivalRecord6B3(pr)?.greetings?.some(g=>g.npcId===x.personId));
 return `<section class="prom-pa3-stories"><h5>After the crowns · Keep in touch</h5><p class="muted-text">Only message someone you truly met and exchanged contacts with. Replies are up to them.</p><div class="inline-actions">${ids.map(x=>{const gate=promPA3FollowupGate(x.personId);return `<button class="small ghost" data-pa3-followup="${esc(x.personId)}" ${gate.ok?'':`disabled title="${esc(gate.reason.replaceAll('_',' '))}"`}>Congratulate ${esc(x.name)} by message</button>`}).join('')||'<p class="muted-text">No eligible Court contacts from this Prom.</p>'}</div></section>`;
}
const promPA3OriginalAfterHtml=promAfterHtml6B6;
promAfterHtml6B6=function(pr=S?.school?.prom){return promPA3OriginalAfterHtml(pr)+promPA3AfterHtml(pr)};
const promPA3WithFollowupClick=promClick;
promClick=function(b){if(b?.dataset?.pa3Followup){const r=promPA3Followup(b.dataset.pa3Followup);if(!r.ok)toast('After Prom: '+r.reason.replaceAll('_',' '));save();render();return true}return promPA3WithFollowupClick(b)};
