// PHASE 6A.4 — event-bound Prom Court, on existing school/prom/calendar/NPC records.
// This is a school ballot, not a replacement for the Phase 4B Student Council elections.
const PROM_COURT_SCHEMA_6A4=1;
const PROM_COURT_CATEGORIES_6A4={king:'Prom King',queen:'Prom Queen',royalty:'Prom Royalty'};
function promCourtCategory6A4(g){const x=String(g||'').toLowerCase();return /female|girl|woman/.test(x)?'queen':/male|boy|man/.test(x)?'king':'royalty'}
function promCourtDates6A4(pr){return {nominationOpen:addDays(pr.dateISO,-21),nominationClose:addDays(pr.dateISO,-15),ballotOpen:addDays(pr.dateISO,-14),ballotClose:addDays(pr.dateISO,-4),resultDate:addDays(pr.dateISO,-3)}}
function promCourtSchoolPeer6A4(n,pr){
 if(!n||n.movedAway||!n.id||!pr?.foundation6A1)return false;
 // NPC school enrollment is the existing 4A.3 authority; never infer from name/age alone.
 return n.currentSchoolId===pr.foundation6A1.schoolId&&gradeNumberFromLabel4A3(n.schoolGrade)===pr.foundation6A1.grade&&npcAge(n)>=13&&npcAge(n)<=18;
}
function promCourtPlayerEligible6A4(pr){
 const f=pr?.foundation6A1,r=ensureRep();
 return !!f&&f.schoolId===playerCurrentSchoolId4A2()&&promSeasonEligibility6A1().ok&&promSeasonEligibility6A1().grade===f.grade
  &&promRegistered6A1(pr)&&S.school.behavior>=55&&S.school.attendance>=65&&(r.troublemaker||0)<70&&pr.plan!=='skip';
}
function promCourtPlayerStrength6A4(){const r=ensureRep(),friends=(S.people||[]).filter(p=>!isFamilyPerson(p)&&p.rel>=65&&schoolRelationNow4A4(p)!=='differentSchool').length;
 return Math.round(clamp(13+(r.social||0)*.28+(r.leadership||0)*.07+(r.kindness||0)*.08-(r.troublemaker||0)*.20+(S.looks??50)*.15+schoolAverage()*.06+(S.smart??50)*.03+(S.school.behavior??70)*.08+(S.school.attendance??85)*.05+Math.min(9,friends*1.5)));
}
function promCourtNpcStrength6A4(n){const tr=n.traits||[];return Math.round(clamp(20+(n.reputation??35)*.48+(n.looks??50)*.17+(n.smart??50)*.06+(tr.includes('Outgoing')?7:0)+(tr.includes('Kind')?5:0)+(tr.includes('Ambitious')?4:0)-(tr.includes('Troublemaker')?9:0),0,100))}
function promCourtRoster6A4(pr){return (S.npcs||[]).filter(n=>promCourtSchoolPeer6A4(n,pr)).sort((a,b)=>String(a.id).localeCompare(String(b.id)))}
function promCourtEnsurePeers6A4(pr){
 let pool=promCourtRoster6A4(pr),attempt=0;
 // Reuse existing household / NPC-school generator. Peers persist as real NPCs.
 while(attempt++<16&&(pool.filter(n=>promCourtCategory6A4(n.gender)==='king').length<3||pool.filter(n=>promCourtCategory6A4(n.gender)==='queen').length<3)){
  generateHousehold({kids:1,childAge:S.age,schoolId:pr.foundation6A1.schoolId,schoolGrade:S.school.grade,schoolClass:S.school.className});
  pool=promCourtRoster6A4(pr);
 }
 return pool;
}
function promCourtRecord6A4(pr=S?.school?.prom){return pr?.foundation6A1&&pr.court6A4?.eventId===pr.foundation6A1.eventId?pr.court6A4:null}
function ensurePromCourt6A4(pr=S?.school?.prom){
 const f=pr?.foundation6A1;if(!f||['Done','Skipped'].includes(pr.status))return promCourtRecord6A4(pr);
 const id=f.eventId;if(!pr.court6A4||pr.court6A4.eventId!==id){
  pr.court6A4={schemaVersion:PROM_COURT_SCHEMA_6A4,eventId:id,schoolId:f.schoolId,grade:f.grade,nominationRequested:false,nominationRequestDate:null,
   nominees:[],rosterIds:[],ballots:[],results:null,nominationsLocked:false,ballotLocked:false,nominationNotified:false,voteNotified:false};
 }
 const c=pr.court6A4;Object.assign(c,{schemaVersion:PROM_COURT_SCHEMA_6A4,...promCourtDates6A4(pr)});
 c.nominees=Array.isArray(c.nominees)?c.nominees:[];c.ballots=Array.isArray(c.ballots)?c.ballots:[];
 c.rosterIds=Array.isArray(c.rosterIds)?c.rosterIds:[];
 return c;
}
function promCourtRequest6A4(){
 const pr=ensureProm6A1(),c=pr&&ensurePromCourt6A4(pr);
 if(!c||c.nominationsLocked||c.nominationRequested)return {ok:false,reason:'already_closed_or_requested'};
 if(currentDate()<c.nominationOpen||currentDate()>c.nominationClose)return {ok:false,reason:'nomination_window_closed'};
 if(!promCourtPlayerEligible6A4(pr))return {ok:false,reason:'school_conduct_or_registration'};
 c.nominationRequested=true;c.nominationRequestDate=currentDate();c.nominationStrength=promCourtPlayerStrength6A4();
 resolveNotificationsFor(`${c.eventId}:court_nominations`);
 return {ok:true,status:'requested',category:promCourtCategory6A4(playerGender())};
}
function promCourtFreezeNominations6A4(pr,c){
 if(c.nominationsLocked)return;
 const peers=promCourtEnsurePeers6A4(pr),category=promCourtCategory6A4(playerGender());
 const candidates=[];
 for(const cat of ['king','queen','royalty']){
  // Prom Royalty is an inclusive open ballot only if a nonbinary player/peer needs a category.
  if(cat==='royalty'&&category!=='royalty'&&!peers.some(n=>promCourtCategory6A4(n.gender)==='royalty'))continue;
  const options=(cat==='royalty'?peers.filter(n=>!candidates.some(x=>x.personId===n.id)):peers.filter(n=>promCourtCategory6A4(n.gender)===cat))
   .map(n=>({personId:n.id,name:n.fullName,category:cat,score:promCourtNpcStrength6A4(n),schoolId:c.schoolId,grade:c.grade}))
   .sort((a,b)=>b.score-a.score||a.personId.localeCompare(b.personId));
  if(c.nominationRequested&&cat===category&&promCourtPlayerEligible6A4(pr)){
   options.push({personId:'player',name:S.name,category:cat,score:c.nominationStrength,schoolId:c.schoolId,grade:c.grade});
   options.sort((a,b)=>b.score-a.score||a.personId.localeCompare(b.personId));
  }
  // Requires competition; an uncontested crown is not awarded.
  if(options.length>=2)candidates.push(...options.slice(0,3));
 }
 c.nominees=candidates;c.nominationsLocked=true;c.nominationsLockedDate=currentDate();
 c.rosterIds=[...new Set(peers.map(n=>n.id))];
 // An optional school-calendar ballot deadline, not a second calendar engine.
 createCalendarEvent({id:`${c.eventId}:court-ballot`,type:'promCourtBallot',title:'Prom Court ballot deadline',dateISO:c.ballotClose,startMinute:930,endMinute:960,graceMinute:960,location:pr.venue,schoolId:c.schoolId,payload:{promSeasonId:c.eventId,schoolId:c.schoolId,grade:c.grade},required:false,source:'school'});
 resolveNotificationsFor(`${c.eventId}:court_nominations`);
}
function promCourtVoterValid6A4(pr,id){
 const c=promCourtRecord6A4(pr);if(!c?.nominationsLocked)return false;
 return id==='player'?!!promSeasonEligibility6A1().ok&&playerCurrentSchoolId4A2()===c.schoolId&&gradeNumber()===c.grade
  :c.rosterIds.includes(id);
}
function promCourtVoteWindow6A4(pr,c){return !!c&&c.nominationsLocked&&!c.ballotLocked&&currentDate()>=c.ballotOpen&&currentDate()<=c.ballotClose;}
function promCourtCast6A4(category,candidateId){
 const pr=ensureProm6A1(),c=pr&&ensurePromCourt6A4(pr);
 if(!promCourtVoteWindow6A4(pr,c))return {ok:false,reason:'ballot_closed'};
 if(!promCourtVoterValid6A4(pr,'player'))return {ok:false,reason:'not_eligible_voter'};
 if(!PROM_COURT_CATEGORIES_6A4[category]||!c.nominees.some(n=>n.category===category&&n.personId===candidateId))return {ok:false,reason:'not_on_ballot'};
 if(candidateId==='player')return {ok:false,reason:'no_self_voting'};
 if(c.ballots.some(b=>b.voterId==='player'&&b.category===category))return {ok:false,reason:'already_voted'};
 c.ballots.push({voterId:'player',category,candidateId,dateISO:currentDate(),source:'player'});
 resolveNotificationsFor(`${c.eventId}:court_voting`);
 return {ok:true,category,candidateId};
}
function promCourtNpcVotes6A4(pr,c){
 // One deterministic sealed NPC ballot per actual same-cohort pupil and category.
 for(const voterId of c.rosterIds){
  const voter=npcById(voterId);if(!promCourtSchoolPeer6A4(voter,pr))continue;
  for(const category of [...new Set(c.nominees.map(n=>n.category))]){
   if(c.ballots.some(b=>b.voterId===voterId&&b.category===category))continue;
   const options=c.nominees.filter(n=>n.category===category&&n.personId!==voterId);
   if(!options.length)continue;
   const ranked=options.map(n=>{
    const p=(S.people||[]).find(x=>x.npcId===voterId),sameCircle=p&&n.personId==='player'?(p.rel||40)*.10-(p.conflict||0)*.13:0;
    const support=(n.personId==='player'&&pr.social6A5?.eventId===c.eventId&&pr.social6A5.supporters?.includes(voterId))?8:0;
    const jitter=(hashOf(`${c.eventId}|${voterId}|${category}|${n.personId}`)%2500)/100-12.5;
    return {id:n.personId,weight:n.score*.55+sameCircle+support+jitter};
   }).sort((a,b)=>b.weight-a.weight||a.id.localeCompare(b.id));
   c.ballots.push({voterId,category,candidateId:ranked[0].id,dateISO:c.ballotOpen,source:'npc'});
  }
 }
}
function promCourtTally6A4(pr,c){
 if(c.ballotLocked)return c.results;
 if(!c.nominationsLocked)promCourtFreezeNominations6A4(pr,c);
 promCourtNpcVotes6A4(pr,c);
 const winners={},totals={};
 for(const category of [...new Set(c.nominees.map(n=>n.category))]){
  const options=c.nominees.filter(n=>n.category===category);
  const count=Object.fromEntries(options.map(n=>[n.personId,0]));
  for(const b of c.ballots)if(b.category===category&&Object.hasOwn(count,b.candidateId))count[b.candidateId]++;
  const sorted=[...options].sort((a,b)=>count[b.personId]-count[a.personId]||b.score-a.score||a.personId.localeCompare(b.personId));
  totals[category]=count;if(sorted.length>=2)winners[category]=sorted[0].personId;
 }
 c.results={winners,totals,dateISO:currentDate(),tiePolicy:'higher_frozen_nomination_score_then_id'};
 c.ballotLocked=true;c.ballotLockedDate=currentDate();
 const ballotEv=(S.calendar||[]).find(e=>e.id===`${c.eventId}:court-ballot`);if(ballotEv&&!isTerminal(ballotEv.status))setCalendarStatus(ballotEv,'Completed','Ballot closed and counted');
 resolveNotificationsFor(`${c.eventId}:court_voting`);
 return c.results;
}
function reconcilePromCourt6A4(pr=S?.school?.prom){
 const c=ensurePromCourt6A4(pr);if(!c)return null;
 const today=currentDate();
 if(today>=c.nominationOpen&&today<=c.nominationClose&&!c.nominationNotified){
  c.nominationNotified=true;notify('Prom Court nominations',`You can request consideration until ${formatDate(c.nominationClose)}. Academic standing, conduct and reputation matter.`,{sourceType:'promCourt',sourceId:`${c.eventId}:court_nominations`,tab:'home'});
 }
 if(today>c.nominationClose&&!c.nominationsLocked)promCourtFreezeNominations6A4(pr,c);
 if(today>c.nominationClose)resolveNotificationsFor(`${c.eventId}:court_nominations`);
 if(c.nominationsLocked&&today>=c.ballotOpen&&today<=c.ballotClose)promCourtNpcVotes6A4(pr,c);
 if(c.nominationsLocked&&today>=c.ballotOpen&&today<=c.ballotClose&&!c.voteNotified){
  c.voteNotified=true;notify('Prom Court school ballot',`One vote per award. School voting closes ${formatDate(c.ballotClose)}.`,{sourceType:'promCourt',sourceId:`${c.eventId}:court_voting`,tab:'home'});
 }
 if(today>c.ballotClose&&!c.ballotLocked)promCourtTally6A4(pr,c);
 if(c.ballotLocked)resolveNotificationsFor(`${c.eventId}:court_voting`);
 return c;
}
// HF-PA.2 — A read-only, provenance-aware nomination dossier; never changes the frozen ballot.
function promCourtProfilePA2(pr,category,candidateId){
 const c=promCourtRecord6A4(pr),row=c?.nominees?.find(n=>n.category===category&&n.personId===candidateId);
 if(!row)return null;
 const own=candidateId==='player',n=own?null:npcById(candidateId);
 // A missing NPC remains an archived nominee; never fabricate a replacement.
 const p=own?null:(S.people||[]).find(x=>x.npcId===candidateId);
 const publicRoleRecords=own?activeRolesForHolder4B1('player'):n?activeRolesForHolder4B1(n.id):[];
 const roles=publicRoleRecords.filter(x=>x.schoolId===c.schoolId).map(x=>`${x.roleName} — ${x.organizationName}`);
 const orgs=own?schoolOrganizationState4B1().organizations.filter(x=>x.schoolId===c.schoolId&&x.memberIds?.includes('player')):
  n?schoolOrganizationState4B1().organizations.filter(x=>x.schoolId===c.schoolId&&x.memberIds?.includes(n.id)):[];
 const participation=[...new Set(orgs.map(x=>x.name))].slice(0,8);
 const schoolId=own?playerCurrentSchoolId4A2():n?.currentSchoolId;
 const confirmedSchool=schoolId===c.schoolId;
 const age=own?S.age:n?npcAge(n):null;
 const clazz=own?S.school?.className:n?.schoolClass;
 const grade=own?S.school?.grade:n?.schoolGrade;
 // Looks are observable from an actual actor record. Smart is private until known or an actual school result is public.
 const looks=own?S.looks:n?.looks;
 const smart=own?S.smart:(p&&(p.rel>=35||p.schoolScoresKnown)?n?.smart:null);
 const explicitAppearance=own?(S.appearance||{}):(n?.appearance&&typeof n.appearance==='object'?n.appearance:{});
 const hair=explicitAppearance.hairColor||(!own&&n?.hairColor)||null;
 const hairstyle=explicitAppearance.hairStyle||(!own&&n?.hairStyle)||null;
 const face=explicitAppearance.faceFeatures||(!own&&n?.faceFeatures)||null;
 const appearanceVisible=own||!!p; // never reveal a stranger's non-public stored personal details
 const love=own?S.attraction:(p&&loveInterestKnown(p)?personIdentity(p).orientation:null);
 const status=own?(S.romance?.partnerId?'In a relationship':'Not disclosed'):
  p&&relStatusKnown(p)?npcRelStatus(p):null;
 const met=own?'You are the nominee':p?metLine(p):'Not yet acquainted';
 const interest=p&&p.rel>=20?(n?.interests||p.interests||[]):[];
 return {personId:row.personId,category,name:row.name,age:typeof age==='number'&&Number.isFinite(age)?age:null,
  school:confirmedSchool?schoolDisplayName(c.schoolId):null,grade:confirmedSchool?(grade||null):null,
  className:confirmedSchool?(clazz||null):null,looks:Number.isFinite(Number(looks))&&looks!=null?Math.round(Number(looks)):null,
  smart:Number.isFinite(Number(smart))&&smart!=null?Math.round(Number(smart)):null,
  hair:appearanceVisible?hair:null,hairstyle:appearanceVisible?hairstyle:null,face:appearanceVisible?face:null,
  love:love||null,status:status||null,activities:participation,roles,interests:interest,met,
  // No archived school awards are claimed unless explicit, person-specific evidence exists.
  achievements:roles.slice(),missingActor:!own&&!n};
}
function promCourtValuePA2(v){return v==null||v===''?'Not known':String(v)}
function promCourtProfileHtmlPA2(pr,category,id){
 const d=promCourtProfilePA2(pr,category,id);if(!d)return '<p class="muted-text">Candidate record unavailable.</p>';
 const line=(title,val)=>`<div class="prom-pa2-fact"><span>${esc(title)}</span><b>${esc(promCourtValuePA2(val))}</b></div>`;
 const arr=(title,values)=>`<div class="prom-pa2-fact"><span>${esc(title)}</span><b>${values.length?values.map(esc).join(' · '):'Not recorded'}</b></div>`;
 const c=promCourtRecord6A4(pr),myVote=c.ballots.find(b=>b.voterId==='player'&&b.category===category);
 const mayVote=promCourtVoteWindow6A4(pr,c)&&promCourtVoterValid6A4(pr,'player')&&!myVote&&id!=='player';
 return `<section class="prom-pa2-dossier" data-prom-pa2-profile="${esc(id)}"><p class="muted-text">${esc(PROM_COURT_CATEGORIES_6A4[category])} nominee · School ballot record</p><h3>${esc(d.name)}</h3>
 <div class="prom-pa2-facts">${line('Age',d.age)}${line('School',d.school)}${line('Grade',d.grade)}${line('Class / section',d.className)}${line('Looks (recorded)',d.looks)}${line('Smarts (known)',d.smart)}${line('Hair color',d.hair)}${line('Hair style',d.hairstyle)}${line('Face features',d.face)}${line('Love interest (disclosed)',d.love)}${line('Relationship status (known)',d.status)}${line('How you know them',d.met)}${arr('Recorded activities',d.activities)}${arr('School positions / achievements',d.achievements)}${arr('Known interests',d.interests)}</div>
 <p class="muted-text">Private details remain unknown until learned. Unrecorded awards are not assumed. Reading this profile never changes votes or relationships.</p>
 <div class="inline-actions">${mayVote?`<button class="small primary" data-prom-court6a4="vote" data-court-category="${esc(category)}" data-court-candidate="${esc(id)}">Review vote for ${esc(d.name)}</button>`:''}<button class="small ghost" data-prom-court6a4="close-profile">Back to candidates</button></div></section>`;
}
function promCourtSummaryHtml6A4(pr){
 const c=promCourtRecord6A4(pr);if(!c)return '';
 const chosen=c.nominees.some(n=>n.personId==='player');
 let html=`<section class="prom-court-6a4"><h4>Prom Court · Meet the candidates</h4><p class="muted-text">Nominations ${formatDate(c.nominationOpen)}–${formatDate(c.nominationClose)} · Student ballot ${formatDate(c.ballotOpen)}–${formatDate(c.ballotClose)}</p>`;
 if(!c.nominationsLocked){html+=`<p>${c.nominationRequested?'Nomination requested — the school will shortlist candidates.':'The school will choose nominees based on school standing.'}</p>`;
  if(currentDate()>=c.nominationOpen&&currentDate()<=c.nominationClose&&!c.nominationRequested&&promCourtPlayerEligible6A4(pr))html+='<button class="small" data-prom-court6a4="nominate">Request nomination</button>';
 }else{
  html+=`<p class="muted-text">${chosen?'You made the shortlist.':'Nominees are announced; you are not on the shortlist.'} Read profiles before choosing. Voting is optional and does not require a Prom date.</p>`;
  for(const cat of [...new Set(c.nominees.map(n=>n.category))]){
   html+=`<div class="prom-court-ballot"><h5>${esc(PROM_COURT_CATEGORIES_6A4[cat])}</h5>`;
   const myVote=c.ballots.find(b=>b.voterId==='player'&&b.category===cat);
   if(c.ballotLocked)html+='<p class="muted-text">School ballots counted. Winners will be presented at Prom Night.</p>';
   else if(myVote)html+=`<p class="muted-text">Your vote for ${esc(c.nominees.find(n=>n.category===cat&&n.personId===myVote.candidateId)?.name||'a candidate')} was submitted. Your vote is final.</p>`;
   else if(!promCourtVoteWindow6A4(pr,c)||!promCourtVoterValid6A4(pr,'player'))html+='<p class="muted-text">Ballot not currently open or you are not an eligible host-school voter. Profiles may still be viewed.</p>';
   html+=`<div class="prom-pa2-roster">${c.nominees.filter(n=>n.category===cat).map(n=>{
    const d=promCourtProfilePA2(pr,cat,n.personId),canVote=!c.ballotLocked&&!myVote&&promCourtVoteWindow6A4(pr,c)&&promCourtVoterValid6A4(pr,'player')&&n.personId!=='player';
    return `<article class="prom-pa2-candidate"><b>${esc(n.name)}</b><small>${esc(d?.className||'Class not recorded')} · ${esc(d?.activities[0]||'Activities not recorded')}</small><div class="inline-actions"><button class="small ghost" data-prom-court6a4="profile" data-court-category="${esc(cat)}" data-court-candidate="${esc(n.personId)}">View profile</button>${canVote?`<button class="small" data-prom-court6a4="vote" data-court-category="${esc(cat)}" data-court-candidate="${esc(n.personId)}">Vote for ${esc(n.name)}</button>`:''}</div></article>`}).join('')}</div>`;
   html+='</div>';
  }
 }
 return html+'</section>';
}
function promCourtClick6A4(b){
 const act=b?.dataset?.promCourt6a4;if(!act)return false;
 const cat=b.dataset.courtCategory,id=b.dataset.courtCandidate,pr=S?.school?.prom,c=promCourtRecord6A4(pr);
 if(act==='close-profile'){closeChoiceModal();return true}
 if(act==='profile'){
  const d=promCourtProfilePA2(pr,cat,id);
  if(!d){toast('That nominee is not on this ballot.');return true}
  openModal('Prom Court candidate',promCourtProfileHtmlPA2(pr,cat,id));return true;
 }
 if(act==='vote'){
  const d=promCourtProfilePA2(pr,cat,id);
  if(!d){toast('That nominee is not on this ballot.');return true}
  if(!promCourtVoteWindow6A4(pr,c)||!promCourtVoterValid6A4(pr,'player')||id==='player'||c.ballots.some(x=>x.voterId==='player'&&x.category===cat)){toast('This vote cannot be submitted.');return true}
  openModal('Confirm your final Prom Court vote',`<p>Submit your one final vote for <b>${esc(d.name)}</b> as <b>${esc(PROM_COURT_CATEGORIES_6A4[cat])}</b>?</p><p class="muted-text">You cannot change your ballot after submission.</p><div class="inline-actions"><button class="primary" data-prom-court6a4="confirm-vote" data-court-category="${esc(cat)}" data-court-candidate="${esc(id)}">Confirm final vote</button><button class="ghost" data-prom-court6a4="cancel-vote">Cancel</button></div>`);
  return true;
 }
 if(act==='cancel-vote'){closeChoiceModal();return true}
 const result=act==='nominate'?promCourtRequest6A4():act==='confirm-vote'?promCourtCast6A4(cat,id):{ok:false,reason:'unknown_action'};
 if(!result.ok)toast(`Prom Court: ${result.reason}`);
 if(result.ok&&act==='confirm-vote')closeChoiceModal();
 save();render();return true;
}
function promCourtNight6A4(sc){const pr=S?.school?.prom,c=promCourtRecord6A4(pr);
 if(!c||!c.ballotLocked||!c.results)return {title:'Prom Court',text:'The school has not confirmed this year’s ballot results.',choices:[{id:'ok',label:'Continue',primary:true}]};
 const cat=promCourtCategory6A4(playerGender()),win=c.results.winners[cat];
 sc.data.court=win==='player';sc.data.courtAward=win==='player'?PROM_COURT_CATEGORIES_6A4[cat]:null;
 const summary=Object.entries(c.results.winners).map(([type,id])=>`${PROM_COURT_CATEGORIES_6A4[type]}: ${id==='player'?S.name:(c.nominees.find(n=>n.personId===id)?.name||'Student')}`).join(' • ');
 return {title:'Prom Court',text:`Official school ballot results: ${summary||'No awards this year'}. ${sc.data.court?'Your name is called!':'You applaud the winners.'}`,choices:[{id:'ok',label:sc.data.court?'Receive your award':'Applaud',primary:true}]};
}
