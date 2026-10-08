// PHASE 6A.7 acceptance-only runtime harness.
// Called exclusively by the existing __LIFE_SIM_TEST__ test interface;
// no gameplay menu, persistent field, or separate Prom system is added.
function promFuzzEpisode6A7(seed,steps=50){
 let randomSeed=(Number(seed)||6072026)>>>0;
 const draw=()=>{randomSeed=(Math.imul(1664525,randomSeed)+1013904223)>>>0;return randomSeed/4294967296};
 const pick=a=>a[Math.floor(draw()*a.length)];
 const violations=[],push=(reason,i)=>{if(violations.length<16)violations.push(`${i}: ${reason}`)};
 const prom=ensureProm(),id=prom?.foundation6A1?.eventId,schoolId=prom?.foundation6A1?.schoolId,date=prom?.dateISO;
 if(!prom)return {steps:0,violations:['No eligible Prom']};
 let sealed=null,completed=0;
 for(let i=0;i<steps;i++){
  // Forward-only progression with repeated days to stress reconciliation and UI idempotence.
  const offset=-24+Math.floor(i*26/steps);
  S.clock.dateISO=addDays(date,offset);S.clock.minute=pick([600,900,960,1020,1200]);S.location=pick(['Home','School']);
  try{
   ensureProm();const before=S.school.prom,oldCourt=before.court6A4;
   switch(pick(['ensure','nominate','vote','committee','campaign','plan','invalid','register','approve','reconcile'])){
    case 'ensure':ensureProm();ensureProm();break;
    case 'nominate':promCourtRequest6A4();break;
    case 'vote':{
     const possible=(oldCourt?.nominees||[]).filter(n=>n.personId!=='player');
     if(possible.length){const option=pick(possible);promCourtCast6A4(option.category,option.personId)}break;
    }
    case 'committee':promCommitteeWork6A2(pick(['posters','playlist','floorplan','decorations']));break;
    case 'campaign':promSocialCampaign6A5('volunteer');break;
    case 'plan':promDatePlan6A3(pick(['friends','alone','wait']));break;
    case 'invalid':promCourtCast6A4('bogus','fake');break;
    case 'register':promRegistrationDecision6A1(pick(['register','decline']));break;
    case 'approve':promCommitteeApproved6A2();break;
    case 'reconcile':reconcilePromUi6A6(before);break;
   }
   const pr=ensureProm(),f=pr.foundation6A1,c=pr.court6A4,com=pr.committee6A2,so=pr.social6A5;
   if(f.eventId!==id||f.schoolId!==schoolId)push('Event identity drift',i);
   if(S.calendar.filter(x=>x.id===id&&x.type==='prom').length!==1)push('Duplicate/missing Prom calendar',i);
   const pairs=c.ballots.map(v=>v.voterId+'|'+v.category);
   if(new Set(pairs).size!==pairs.length)push('Duplicate ballot',i);
   const nominees=c.nominees.map(n=>n.personId+'|'+n.category);
   if(new Set(nominees).size!==nominees.length)push('Duplicate nominee',i);
   if(c.ballots.some(v=>v.voterId!=='player'&&!c.rosterIds.includes(v.voterId)))push('Invalid NPC voter',i);
   if(c.ballots.some(v=>!c.nominees.some(n=>n.personId===v.candidateId&&n.category===v.category)))push('Unknown candidate',i);
   if(c.results&&(!c.ballotLocked||Object.entries(c.results.winners).some(([cat,w])=>!c.nominees.some(n=>n.category===cat&&n.personId===w))))push('Unsealed or invalid results',i);
   if(sealed!==null&&JSON.stringify(c.results)!==sealed)push('Re-rolled sealed results',i);
   if(c.ballotLocked)sealed=JSON.stringify(c.results);
   if(com.budgetSpent<0||com.budgetSpent>com.budgetAllocated)push('Committee budget violation',i);
   if(new Set(com.work.map(w=>w.key)).size!==com.work.length)push('Duplicate committee work',i);
   if(so.actions.length>4)push('Campaign farm',i);
   if(!['not_registered','registered','declined','missed'].includes(f.registrationStatus))push('Invalid RSVP',i);
   const sources=(S.notifications||[]).map(x=>x.sourceId).filter(x=>typeof x==='string'&&x.startsWith(id+':')&&/(registration|committee_signup|committee_result|court_nominations|court_voting)$/.test(x));
   if(new Set(sources).size!==sources.length)push('Duplicate lifecycle notice',i);
   completed++;
  }catch(e){push(`Runtime exception: ${String(e?.message||e)}`,i);break;}
 }
 return {steps:completed,violations,eventId:id,schoolId,registrationStatus:S.school.prom?.foundation6A1?.registrationStatus||null};
}
