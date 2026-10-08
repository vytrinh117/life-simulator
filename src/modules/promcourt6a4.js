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
function promCourtSummaryHtml6A4(pr){
 const c=promCourtRecord6A4(pr);if(!c)return '';
 const chosen=c.nominees.some(n=>n.personId==='player');
 let html=`<section class="prom-court-6a4"><h4>Prom Court</h4><p class="muted-text">Nominations ${formatDate(c.nominationOpen)}–${formatDate(c.nominationClose)} • Student ballot ${formatDate(c.ballotOpen)}–${formatDate(c.ballotClose)}</p>`;
 if(!c.nominationsLocked){html+=`<p>${c.nominationRequested?'Nomination requested — the school will shortlist candidates.':'The school will choose nominees based on school standing.'}</p>`;
  if(currentDate()>=c.nominationOpen&&currentDate()<=c.nominationClose&&!c.nominationRequested&&promCourtPlayerEligible6A4(pr))html+='<button class="small" data-prom-court6a4="nominate">Request nomination</button>';
 }else{
  html+=`<p class="muted-text">${chosen?'You made the shortlist.':'Nominees are announced; you are not on the shortlist.'} Voting is optional and does not require a prom date.</p>`;
  for(const cat of [...new Set(c.nominees.map(n=>n.category))]){
   html+=`<div class="prom-court-ballot"><b>${PROM_COURT_CATEGORIES_6A4[cat]}</b>`;
   const myVote=c.ballots.find(b=>b.voterId==='player'&&b.category===cat);
   if(c.ballotLocked){html+='<p class="muted-text">School ballots counted. Winners will be presented at Prom Night.</p>'}
   else if(myVote)html+='<p class="muted-text">Ballot submitted. Your vote is final.</p>';
   else if(promCourtVoteWindow6A4(pr,c)&&promCourtVoterValid6A4(pr,'player'))html+=c.nominees.filter(n=>n.category===cat&&n.personId!=='player').map(n=>`<button class="small ghost" data-prom-court6a4="vote" data-court-category="${cat}" data-court-candidate="${esc(n.personId)}">Vote ${esc(n.name)}</button>`).join('');
   else html+='<p class="muted-text">Ballot not currently open.</p>';
   html+='</div>';
  }
 }
 return html+'</section>';
}
function promCourtClick6A4(b){const act=b?.dataset?.promCourt6a4;if(!act)return false;
 const result=act==='nominate'?promCourtRequest6A4():act==='vote'?promCourtCast6A4(b.dataset.courtCategory,b.dataset.courtCandidate):{ok:false,reason:'unknown_action'};
 if(!result.ok)toast(`Prom Court: ${result.reason}`);
 save();render();return true;
}
function promCourtNight6A4(sc){const pr=S?.school?.prom,c=promCourtRecord6A4(pr);
 if(!c||!c.ballotLocked||!c.results)return {title:'Prom Court',text:'The school has not confirmed this year’s ballot results.',choices:[{id:'ok',label:'Continue',primary:true}]};
 const cat=promCourtCategory6A4(playerGender()),win=c.results.winners[cat];
 sc.data.court=win==='player';sc.data.courtAward=win==='player'?PROM_COURT_CATEGORIES_6A4[cat]:null;
 const summary=Object.entries(c.results.winners).map(([type,id])=>`${PROM_COURT_CATEGORIES_6A4[type]}: ${id==='player'?S.name:(c.nominees.find(n=>n.personId===id)?.name||'Student')}`).join(' • ');
 return {title:'Prom Court',text:`Official school ballot results: ${summary||'No awards this year'}. ${sc.data.court?'Your name is called!':'You applaud the winners.'}`,choices:[{id:'ok',label:sc.data.court?'Receive your award':'Applaud',primary:true}]};
}
