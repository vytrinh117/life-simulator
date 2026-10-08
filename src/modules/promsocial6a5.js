// PHASE 6A.5 — event-scoped school Prom Court social interactions.
// Builds on 6A.4 immutable nominees/ballots and existing People/reputation state.
const PROM_SOCIAL_SCHEMA_6A5=1;
function promSocialRecord6A5(pr=S?.school?.prom){return pr?.foundation6A1&&pr.social6A5?.eventId===pr.foundation6A1.eventId?pr.social6A5:null}
function ensurePromSocial6A5(pr=S?.school?.prom){
 const f=pr?.foundation6A1;
 if(!f||['Done','Skipped'].includes(pr.status))return promSocialRecord6A5(pr);
 if(!pr.social6A5||pr.social6A5.eventId!==f.eventId){
  pr.social6A5={schemaVersion:PROM_SOCIAL_SCHEMA_6A5,eventId:f.eventId,schoolId:f.schoolId,grade:f.grade,
   actions:[],supporters:[],rivalEncounters:[],resultApplied:false,consequences:[]};
 }
 const s=pr.social6A5;s.schemaVersion=PROM_SOCIAL_SCHEMA_6A5;
 for(const key of ['actions','supporters','rivalEncounters','consequences'])if(!Array.isArray(s[key]))s[key]=[];
 return s;
}
function promSocialCampaignGate6A5(pr=S?.school?.prom){
 const c=promCourtRecord6A4(pr),s=promSocialRecord6A5(pr);
 if(!c||!s||!promCourtPlayerEligible6A4(pr)||!c.nominationRequested)return {ok:false,reason:'Only registered students requesting Prom Court consideration may campaign.'};
 if(c.nominationsLocked||currentDate()<c.nominationOpen||currentDate()>c.nominationClose)return {ok:false,reason:'The campaign window is closed.'};
 if(s.actions.length>=4)return {ok:false,reason:'You have completed the available campaign activities.'};
 const day=schoolDayState4C1();
 if(!day.isSchoolDay||!day.atSchool||!day.afterSchoolWindow||!day.campusOpen||currentMinute()+30>day.hours.campusClose)
  return {ok:false,reason:'Campaign activities require a supervised after-school period on campus.'};
 if(s.actions.some(a=>a.dateISO===currentDate()))return {ok:false,reason:'Only one campaign activity per school day.'};
 const conflict=timedSchoolConflict4C4(currentDate(),currentMinute(),currentMinute()+30,c.eventId);
 if(conflict)return {ok:false,reason:`Conflicts with ${conflict.title}.`};
 return {ok:true,court:c,social:s};
}
function promSocialKnownPeer6A5(pr,personId){
 const p=personById(personId),c=promCourtRecord6A4(pr),n=p?.npcId&&npcById(p.npcId);
 return p&&!isFamilyPerson(p)&&n&&c&&promCourtSchoolPeer6A4(n,pr)&&p.movedAway!==true?p:null;
}
function promSocialCampaign6A5(kind,personId){
 const pr=S?.school?.prom,gate=promSocialCampaignGate6A5(pr);if(!gate.ok)return gate;
 const {court:c,social:s}=gate;
 if(!['volunteer','support','bribe'].includes(kind))return {ok:false,reason:'invalid_action'};
 if(kind==='bribe')return {ok:false,reason:'Buying votes is forbidden by school rules.'};
 let p=null,n=null,accepted=false,reason='';
 if(kind==='support'){
  p=promSocialKnownPeer6A5(pr,personId);if(!p)return {ok:false,reason:'Only known students in your own school cohort can be asked for support.'};
  n=npcById(p.npcId);
  if(s.actions.some(a=>a.kind==='support'&&a.personId===p.id))return {ok:false,reason:'This student already answered.'};
  const threshold=40+(p.conflict||0)*.35;
  const score=(p.rel||0)*.6+(p.trust??50)*.3+hashOf(`${c.eventId}|support|${n.id}`)%23-10;
  accepted=score>=threshold;
  reason=accepted?'They agree to tell classmates they support your candidacy.':'They prefer not to take sides this year.';
  if(accepted){s.supporters.push(n.id);p.rel=clamp((p.rel||0)+1);p.trust=clamp((p.trust??50)+1)}
  else p.rel=clamp((p.rel||0)-1);
  rememberPerson(p,`Prom Court: you asked for support. ${reason}`,1);
 }else{
  if(s.actions.some(a=>a.kind==='volunteer'))return {ok:false,reason:'You already completed the school service effort.'};
  accepted=true;reason='You distribute faculty-issued Prom Court information without pressuring anyone to vote.';
  addRep('kindness',2);addRep('leadership',1);
 }
 s.actions.push({kind,personId:p?.id||null,npcId:n?.id||null,dateISO:currentDate(),accepted,reason});
 // Campaign helps, but a top-three nomination and every ballot are still competitive.
 if(accepted)c.nominationStrength=Math.min(100,(Number(c.nominationStrength)||0)+(kind==='volunteer'?3:2));
 advanceTime(30,{silent:true});
 if(!SIM.skipping)log('Prom Court campaign',reason);
 return {ok:true,accepted,reason,actions:s.actions.length};
}
function promSocialRivalGate6A5(pr=S?.school?.prom){
 const c=promCourtRecord6A4(pr),s=promSocialRecord6A5(pr);
 if(!c||!s||!c.nominationsLocked||c.ballotLocked||currentDate()<c.ballotOpen||currentDate()>c.ballotClose)
  return {ok:false,reason:'The Prom Court candidate period has closed.'};
 if(!promCourtPlayerEligible6A4(pr)||!c.nominees.some(n=>n.personId==='player'))return {ok:false,reason:'Only official Prom Court candidates may join candidate discussions.'};
 if(s.rivalEncounters.length>=2)return {ok:false,reason:'You have already had two candidate conversations.'};
 const day=schoolDayState4C1();if(!day.isSchoolDay||!day.atSchool||!day.afterSchoolWindow||!day.campusOpen||currentMinute()+20>day.hours.campusClose)
  return {ok:false,reason:'Candidate discussions happen at school after classes.'};
 if(s.rivalEncounters.some(a=>a.dateISO===currentDate()))return {ok:false,reason:'Only one candidate discussion each day.'};
 return {ok:true,court:c,social:s};
}
function promSocialRival6A5(kind,npcId){
 const pr=S?.school?.prom,gate=promSocialRivalGate6A5(pr);if(!gate.ok)return gate;
 const {court:c,social:s}=gate;
 if(!['respect','rumor'].includes(kind))return {ok:false,reason:'invalid_action'};
 const opponent=c.nominees.find(x=>x.personId===npcId&&x.personId!=='player'&&x.category===promCourtCategory6A4(playerGender()));
 if(!opponent||!promCourtSchoolPeer6A4(npcById(npcId),pr))return {ok:false,reason:'The student is not a valid rival nominee.'};
 if(s.rivalEncounters.some(x=>x.npcId===npcId))return {ok:false,reason:'You have already had this conversation.'};
 const p=(S.people||[]).find(x=>x.npcId===npcId)||null;
 const reason=kind==='respect'?`You congratulate ${opponent.name} and agree to respect the ballot.`:`You spread an unkind rumor about ${opponent.name}; classmates question your fairness.`;
 s.rivalEncounters.push({kind,npcId,dateISO:currentDate(),reason});
 if(kind==='respect'){addRep('kindness',2);addRep('social',1);if(p){p.rel=clamp((p.rel||0)+2);p.trust=clamp((p.trust??50)+1)}}
 else{addRep('troublemaker',4);addRep('kindness',-4);addRep('social',-3);if(p){p.rel=clamp((p.rel||0)-4);p.conflict=clamp((p.conflict||0)+3)}}
 if(p)rememberPerson(p,`Prom Court: ${reason}`,1);
 advanceTime(20,{silent:true});if(!SIM.skipping)log('Prom Court candidates',reason);
 return {ok:true,kind,npcId};
}
function reconcilePromSocial6A5(pr=S?.school?.prom){
 const s=ensurePromSocial6A5(pr),c=promCourtRecord6A4(pr);if(!s||!c||s.resultApplied||!c.ballotLocked||!c.results)return s;
 // Keep official awards sealed until Prom Night begins; no advance-result spoilers.
 if(currentDate()<pr.dateISO||(currentDate()===pr.dateISO&&currentMinute()<1140))return s;
 // Election reactions are applied once after the official result is sealed; never roll the election again.
 s.resultApplied=true;s.resultDate=currentDate();
 const category=promCourtCategory6A4(playerGender()),win=c.results.winners[category];
 const nominated=c.nominees.some(n=>n.personId==='player');
 const outcome=win==='player'?'win':nominated?'loss':c.nominationRequested?'not_shortlisted':'observer';
 s.outcome=outcome;
 if(outcome==='win'){addRep('leadership',3);addRep('social',2)}
 else if(outcome==='loss'){addRep('leadership',1)}
 else if(outcome==='not_shortlisted')addRep('kindness',1);
 if(outcome!=='observer'){
  const msg=outcome==='win'?'The school has counted the ballots. You will be recognized at Prom Night.':outcome==='loss'?'You were not chosen, but your school community respects a fair campaign.':'You did not make the official shortlist this year.';
  s.consequences.push({type:'official_result',dateISO:currentDate(),outcome,message:msg});
  const t=thread('prom',`${s.eventId}:social`,'Prom Court social season');threadStep(t,'Court outcome recorded',msg,{resolve:true});
  recordOutcome('Prom Court',`School Court campaign ${s.eventId}`,outcome,msg);
 }
 // Only genuinely known, supportive school People are recorded as reacting; no synthetic romance milestones.
 for(const npcId of s.supporters){
  const p=(S.people||[]).find(x=>x.npcId===npcId);
  if(!p||!promSocialKnownPeer6A5(pr,p.id))continue;
  const msg=outcome==='win'?'They congratulate you on the Prom Court result.':outcome==='loss'?'They encourage you after the vote.':'They appreciate your effort in the school campaign.';
  p.rel=clamp((p.rel||0)+1);rememberPerson(p,`Prom Court: ${msg}`,1);
  s.consequences.push({type:'supporter_reaction',dateISO:currentDate(),personId:p.id,npcId,message:msg});
 }
 return s;
}
function promSocialHtml6A5(pr){
 const s=promSocialRecord6A5(pr),c=promCourtRecord6A4(pr);if(!s||!c)return '';
 const campaign=promSocialCampaignGate6A5(pr),rival=promSocialRivalGate6A5(pr);
 let html='<section class="prom-social-6a5"><h4>Prom Court • classmates & campaign</h4>';
 html+=`<p class="muted-text">${s.actions.length} campaign activity/activities · ${s.supporters.length} confirmed peer supporter(s) · ${s.rivalEncounters.length} candidate conversation(s). Fair play matters.</p>`;
 if(campaign.ok){
  if(!s.actions.some(a=>a.kind==='volunteer'))html+='<button class="small ghost" data-prom-social6a5="volunteer">Share official Court notices</button>';
  for(const p of (S.people||[]).filter(p=>promSocialKnownPeer6A5(pr,p.id)&&!s.actions.some(x=>x.personId===p.id)).slice(0,8))
   html+=`<button class="small ghost" data-prom-social6a5="support" data-prom-peer="${esc(p.id)}">Ask ${esc(displayName(p))} for support</button>`;
 }
 if(rival.ok)for(const n of c.nominees.filter(n=>n.personId!=='player'&&n.category===promCourtCategory6A4(playerGender())&&!s.rivalEncounters.some(x=>x.npcId===n.personId)))
  html+=`<div class="inline-actions"><small>${esc(n.name)}</small><button class="small ghost" data-prom-social6a5="respect" data-prom-peer="${esc(n.personId)}">Congratulate respectfully</button><button class="small ghost" data-prom-social6a5="rumor" data-prom-peer="${esc(n.personId)}">Spread a rumor (risk)</button></div>`;
 if(s.resultApplied&&s.outcome!=='observer')html+=`<p class="muted-text">The official court season outcome has been recorded. Awards are presented at Prom Night.</p>`;
 if(s.actions.length||s.rivalEncounters.length)html+=`<details><summary>Campaign and classmate interactions</summary>${[...s.actions,...s.rivalEncounters].map(x=>`<p class="muted-text">${esc(x.dateISO)} — ${esc(x.reason)}</p>`).join('')}</details>`;
 return html+'</section>';
}
function promSocialClick6A5(b){const k=b?.dataset?.promSocial6a5;if(!k)return false;
 const r=['volunteer','support'].includes(k)?promSocialCampaign6A5(k,b.dataset.promPeer):promSocialRival6A5(k,b.dataset.promPeer);
 if(!r.ok)toast(`Prom Court: ${r.reason}`);save();render();return true;
}
