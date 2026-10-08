// PHASE 6A.3 — Prom date invitations / consent / RSVP.
// Extends S.school.prom asked[] / received[] and Phase 3B People; no parallel romance or calendar.
const PROM_DATE_SCHEMA_6A3=1;
function promDateEvent6A3(pr=S.school?.prom){return pr?.foundation6A1?.eventId||null}
function promDateWindow6A3(pr=S.school?.prom){return !!pr&&pr.status==='Season'&&promRegistered6A1(pr)&&currentDate()>=pr.foundation6A1.announceDate&&currentDate()<=pr.dateISO&&(currentDate()<pr.dateISO||currentMinute()<1140)}
function promDateStudent6A3(p){
 if(!p||!S?.school||isFamilyPerson(p)||p.movedAway||!S.people?.some(x=>x.id===p.id))return false;
 const age=personAge(p);if(!Number.isFinite(age)||age<13||age>18||Math.abs(age-S.age)>2)return false;
 const n=p.npcId&&npcById(p.npcId);if(n&&(n.movedAway||npcEffectiveGradeNumber4A3(n)<8||npcEffectiveGradeNumber4A3(n)>12))return false;
 return true;
}
function promRomancePossible6A3(p){return !!(promDateStudent6A3(p)&&eligibleRomance(p)&&romanceCompatibility(p).eligible&&(!partnerBoundaryH1(p,'noParties'))&&(isEstablishedPartner(p)||(ensureRomanceProfile(p).romanceOpen&&!partnerBoundaryH1(p,'notReady'))));}
function promDateBusyReason6A3(p,pr=S.school?.prom){
 if(!promDateStudent6A3(p))return 'Not an eligible school-age guest';
 const other=personPromWith(p);
 if(other&&other!==S.name)return 'Already going with someone else';
 if(p.datingNpc)return 'Dating someone else';
 if(p.notGoingProm)return 'Not attending prom';
 if(p.promUnavailableDateISO===pr.dateISO)return 'A conflicting family or school commitment';
 return null;
}
function promDateStatus6A3(pr=S.school?.prom){return pr?.date6A3?.eventId===promDateEvent6A3(pr)?pr.date6A3:null;}
function promDateClearPerson6A3(p,id){
 if(!p)return;
 if(p.promWith===S.name&&(p.promEventId6A3===id||!p.promEventId6A3))p.promWith=null;
 if(p.promEventId6A3===id)p.promEventId6A3=null;
 const n=p.npcId&&npcById(p.npcId);
 if(n&&n.promWith===S.name&&(n.promEventId6A3===id||!n.promEventId6A3))n.promWith=null;
 if(n&&n.promEventId6A3===id)n.promEventId6A3=null;
}
function promDateReconcile6A3(pr=S.school?.prom){
 const id=promDateEvent6A3(pr);if(!id)return null;
 // Pairings created in past school years do not reserve a student forever.
 for(const o of [...(S.people||[]),...(S.npcs||[])]){
  if(o.promEventId6A3&&o.promEventId6A3!==id){o.promEventId6A3=null;o.promWith=null;}
 }
 if(!pr.date6A3||pr.date6A3.eventId!==id){
  pr.date6A3={schemaVersion:PROM_DATE_SCHEMA_6A3,eventId:id,partnerId:pr.partnerId||null,
   mode:pr.partnerId?(pr.asFriends?'friends':'date'):null,changes:[],lastDecisionDate:null};
 }
 const d=pr.date6A3;d.schemaVersion=PROM_DATE_SCHEMA_6A3;d.changes=Array.isArray(d.changes)?d.changes:[];
 pr.asked=Array.isArray(pr.asked)?pr.asked:[];pr.received=Array.isArray(pr.received)?pr.received:[];
 for(const rec of [...pr.asked,...pr.received]){
  // Old genuine records inherit only the current Prom identity; no decisions are synthesized.
  if(!rec.eventId)rec.eventId=id;
  if(!rec.requestId)rec.requestId=`${id}:${pr.asked.includes(rec)?'out':'in'}:${rec.personId}:${rec.dateISO||'legacy'}`;
 }
 if(pr.partnerId&&!personById(pr.partnerId)){
  d.changes.push({dateISO:currentDate(),action:'date_unavailable',personId:pr.partnerId});pr.partnerId=null;pr.asFriends=false;d.partnerId=null;d.mode=null;
 }
 // Retire orphaned/open offers from a previous school/cohort, including after a transfer.
 for(const e of S.events||[]){
  if(e.type==='promInvite'&&e.status==='Open'&&e.payload?.promEventId&&e.payload.promEventId!==id)
   supersedeEvent(e,'Prom school or school year changed');
 }
 // Pending RSVP must track the canonical event lifecycle, not stay actionable after expiry.
 for(const r of pr.received){
  if(r.status!=='Pending')continue;
  const ev=r.eventResponseId&&(S.events||[]).find(e=>e.id===r.eventResponseId);
  if(ev&&(ev.status!=='Open'||eventExpired(ev))){r.status='Expired';r.reason='Invitation expired unanswered';if(ev.status==='Open')supersedeEvent(ev,'Invitation expired');}
 }
 // Delayed answers and outstanding offers expire, without accepting or fabricating any reply.
 if(!promDateWindow6A3(pr)){
  for(const r of pr.asked)if(r.result==='Pending'){r.result='Expired';r.reason='Prom invitations are closed';}
  for(const r of pr.received)if(['Pending','Waiting'].includes(r.status)){r.status='Expired';r.reason='Prom invitations are closed';}
 }else{
  for(const r of pr.received)if(r.status==='Waiting'&&r.deadline&&currentDate()>r.deadline){r.status='Expired';r.reason='The response window passed';}
 }
 // Persist the existing actual companion, never construct a relationship from mere RSVP.
 d.partnerId=pr.partnerId||null;d.mode=pr.partnerId?(pr.asFriends?'friends':'date'):d.mode;
 return d;
}
function promDateCommit6A3(pr,p,mode,source){
 const d=promDateReconcile6A3(pr),id=promDateEvent6A3(pr);
 if(!promDateWindow6A3(pr)||pr.partnerId||!promDateStudent6A3(p)||promDateBusyReason6A3(p,pr))return {ok:false,reason:'date_no_longer_available'};
 pr.partnerId=p.id;pr.plan='date';pr.asFriends=mode==='friends';setPromWithPerson(p,S.name);
 // One confirmed date: any competing outstanding requests lose their actionable status.
 for(const r of pr.asked)if(r.result==='Pending'&&r.personId!==p.id){r.result='Withdrawn';r.reason='You confirmed another date';}
 for(const r of pr.received)if(r.status==='Pending'&&r.personId!==p.id){r.status='Declined';r.reason='You already confirmed another date';const ev=(S.events||[]).find(e=>e.id===r.eventResponseId&&e.status==='Open');if(ev)supersedeEvent(ev,'Already accepted a different date');}
 d.partnerId=p.id;d.mode=mode;d.lastDecisionDate=currentDate();
 d.changes.push({dateISO:currentDate(),action:'accepted',personId:p.id,mode,source});
 p.rel=clamp((p.rel||0)+(mode==='friends'?2:4));
 rememberPerson(p,`Agreed to attend ${pr.junior?'Junior Prom':'Prom'} together${mode==='friends'?' as friends':''}.`,2);
 const th=thread('prom',id,'Prom season');threadStep(th,mode==='friends'?'Going with a friend':'Got a prom date',displayName(p));
 if(!SIM.skipping)log('Prom RSVP confirmed',`${displayName(p)} agreed to go ${mode==='friends'?'as friends':'as your date'}.`,true);
 return {ok:true,status:'accepted',personId:p.id,mode};
}
function promCancelDate6A3(){
 const pr=S.school?.prom,d=promDateStatus6A3(pr),p=pr?.partnerId&&personById(pr.partnerId);
 if(!d||!promDateWindow6A3(pr)||!p)return {ok:false,reason:'no_changeable_date'};
 const id=d.eventId,oldMode=pr.asFriends?'friends':'date';
 promDateClearPerson6A3(p,id);pr.partnerId=null;pr.asFriends=false;pr.plan='wait';d.partnerId=null;d.mode=null;
 d.changes.push({dateISO:currentDate(),action:'cancelled',personId:p.id,mode:oldMode});
 p.rel=clamp((p.rel||0)-3);p.trust=clamp((p.trust??50)-2);
 rememberPerson(p,'You explained you needed to change your Prom plans.',2);
 if(!SIM.skipping)log('Prom plans changed',`You respectfully tell ${firstName(p)} you cannot go together after all. You can still go alone or with friends.`);
 return {ok:true,personId:p.id};
}
function promDatePlan6A3(plan){
 const pr=S.school?.prom;if(!['friends','alone','wait','skip'].includes(plan)||!promDateWindow6A3(pr))return {ok:false,reason:'unavailable'};
 if(pr.partnerId){const result=promCancelDate6A3();if(!result.ok)return result;}
 pr.plan=plan;const d=promDateStatus6A3(pr);if(d)d.changes.push({dateISO:currentDate(),action:'plan',plan});
 if(!SIM.skipping)log('Prom plan',({friends:'You plan to attend with friends. No date is required.',alone:'You plan to enjoy prom solo.',wait:'You will wait and see.',skip:'You decide not to go to prom.'})[plan]);
 return {ok:true,plan};
}
function promDateAskTarget6A3(personId){
 if(String(personId).startsWith('npc:')){
  const n=npcById(String(personId).slice(4));
  if(!n||n.movedAway||npcAge(n)<13||npcAge(n)>18||Math.abs(npcAge(n)-S.age)>2||npcEffectiveGradeNumber4A3(n)<8)return null;
  return addNeighborPerson(n,'neighbor');
 }
 return personById(personId);
}
function promDateCanAsk6A3(p,pr=S.school?.prom){
 if(!promDateWindow6A3(pr))return {ok:false,reason:'Prom registration or invitation window is closed'};
 if(!promDateStudent6A3(p))return {ok:false,reason:'Ineligible person'};
 if(pr.partnerId)return {ok:false,reason:'You already have a date; change plans first'};
 if(pr.asked.some(a=>a.personId===p.id))return {ok:false,reason:'Already asked this student for this Prom'};
 if(pr.asked.some(a=>a.result==='Pending'))return {ok:false,reason:'Wait for the outstanding answer'};
 if(pr.received.some(r=>r.personId===p.id&&r.status==='Pending'))return {ok:false,reason:'They already invited you; answer that invitation'};
 return {ok:true};
}
function promDateAskModal6A3(personId){
 const pr=S.school?.prom;if(!promDateWindow6A3(pr)){toast('Register for this Prom before inviting someone.');return;}
 const p=promDateAskTarget6A3(personId),v=promDateCanAsk6A3(p,pr);
 if(!v.ok){toast(v.reason);return}
 openModal(`Ask ${displayName(p)} to prom`,`<p class="muted-text">They can say yes, suggest going as friends, ask for time, or decline. You do not need a romantic match to invite a friend.</p><div class="modal-action-grid">${Object.entries(PROM_APPROACH).filter(([k])=>k!=='text'||canUsePhone()).map(([k,l])=>`<button data-prom-approach="${k}" data-person-id="${esc(p.id)}">${esc(l)}${k==='gift'?` • ${money(8)}`:k==='promposal'?` • ${money(10)}`:''}</button>`).join('')}<button class="ghost" data-close-modal="1">Not yet</button></div>`);
}
function promDateAsk6A3(personId,approach){
 const pr=ensureProm6A1();if(!promDateWindow6A3(pr))return {ok:false,reason:'Prom registration or invitation window is closed'};
 const p=promDateAskTarget6A3(personId),v=promDateCanAsk6A3(p,pr);
 if(!v.ok)return v;if(!PROM_APPROACH[approach])return {ok:false,reason:'unknown_approach'};
 if(approach==='text'&&!canUsePhone())return {ok:false,reason:'phone_required'};
 if(['gift','promposal'].includes(approach)&&!spendOwn(approach==='gift'?8:10))return {ok:false,reason:'insufficient_funds'};
 closeChoiceModal();ensureRomanceProfile(p);
 const id=promDateEvent6A3(pr),busy=promDateBusyReason6A3(p,pr),traits=p.traits||[],c=romanceCompatibility(p),romance=promRomancePossible6A3(p);
 let result='Rejected',reason='Not interested',mode=null;
 if(busy)reason=busy;
 else if(approach==='public'&&(traits.includes('Shy')||p.boundaries?.includes('noPublicAffection')))reason='Uncomfortable with a public invitation';
 else if((p.conflict||0)>28)reason='A recent disagreement';
 else if((p.rel||0)<35)reason='Not close enough yet';
 else{
  const bonus=approach==='private'&&traits.includes('Shy')?10:approach==='public'&&traits.includes('Outgoing')?8:approach==='promposal'?5:0;
  const score=(p.rel||0)*.43+(p.trust??50)*.2+(romance?(c.score||0)*.28:10)+bonus-(p.conflict||0)*.3;
  const roll=hashOf(`${id}:${p.id}:${approach}:answer`)%27;
  if(romance&&S.romance?.partnerId===p.id){result='Accepted';reason='Already together';mode='date'}
  else if(romance&&score+roll>=77){result='Accepted';reason='Mutual interest and availability';mode='date'}
  else if((p.rel||0)>=50&&score+roll>=51){result='Accepted as friends';reason=romance?'Would rather go as friends':'Happy to attend as friends';mode='friends'}
  else if(traits.includes('Shy')||p.boundaries?.includes('needsTime')){result='Pending';reason='Needs time to decide'}
  else reason=romance?'Not ready for a prom date':'Already has other plans with friends';
 }
 const rec={eventId:id,requestId:`${id}:out:${p.id}`,personId:p.id,dateISO:currentDate(),approach,result,reason};
 if(result==='Pending'){
  rec.deadline=addDays(currentDate(),2);scheduleFollowUp('promAnswer',{eventId:id,personId:p.id,requestId:rec.requestId},{days:2,minute:1020});
 }
 pr.asked.push(rec);
 if(mode){const done=promDateCommit6A3(pr,p,mode,'player_invitation');if(!done.ok){rec.result='Rejected';rec.reason=done.reason;result='Rejected'}}
 if(result==='Rejected'){p.rel=clamp((p.rel||0)-1);rememberPerson(p,`You invited them to Prom. They declined: ${rec.reason}.`,1)}
 else if(result==='Pending')rememberPerson(p,'You invited them to Prom. They asked for time to consider.',1);
 const th=thread('prom',id,'Prom season');threadStep(th,result,`${displayName(p)} — ${rec.reason}`);
 recordOutcome('Prom',`Invited ${displayName(p,'formal')} (${PROM_APPROACH[approach]})`,result,rec.reason);
 advanceTime(20);if(!SIM.skipping)log(`Prom invitation: ${result}`,`${firstName(p)} ${result==='Pending'?'wants time to decide':result==='Rejected'?'declines politely':mode==='friends'?'agrees to go as a friend':'accepts your invitation'}. ${rec.reason}.`,!!mode);
 return {ok:true,eventId:id,personId:p.id,result,reason:rec.reason};
}
function npcAsksToProm(p){
 const pr=S.school?.prom;if(!promDateWindow6A3(pr)||!promDateStudent6A3(p)||(!promRomancePossible6A3(p)&&(p.rel||0)<55)||pr.partnerId||promDateBusyReason6A3(p,pr)||pr.received.some(r=>r.personId===p.id)||pr.received.length>=3||pr.received.some(r=>r.status==='Pending'))return null;
 const id=promDateEvent6A3(pr),rec={eventId:id,requestId:`${id}:in:${p.id}`,personId:p.id,dateISO:currentDate(),status:'Pending'};
 const e=queueEvent({type:'promInvite',title:`${displayName(p)} asks about prom`,text:`${firstName(p)} asks whether you would like to go to ${pr.junior?'Junior Prom':'Prom'} together. You can also suggest going as friends.`,participants:[p.id],payload:{promEventId:id,requestId:rec.requestId},priority:4,expiresDays:2,choices:[...(promRomancePossible6A3(p)?[{id:'accept',label:'Accept as a date'}]:[]),{id:'friends',label:'Suggest going as friends'},{id:'time',label:'Ask for time'},{id:'decline',label:'Politely decline'},...(pr.partnerId?[{id:'have',label:'I already have a date'}]:[])]});
 if(!e)return null;rec.eventResponseId=e.id;pr.received.push(rec);return e;
}
function handlePromInvite(e,choice){
 const pr=S.school?.prom,id=promDateEvent6A3(pr),p=personById(e?.participants?.[0]);
 if(!e||e.type!=='promInvite'||!p||!id)return true;
 const rec=pr.received.find(r=>r.personId===p.id&&r.eventId===id&&r.requestId===e.payload?.requestId);
 if(!rec||rec.status!=='Pending'||e.payload?.promEventId!==id||rec.eventResponseId!==e.id||!promDateWindow6A3(pr)||eventExpired(e))return true;
 if(!['accept','friends','time','decline','have'].includes(choice))return true;
 if(['accept','friends'].includes(choice)){
  if(pr.partnerId||promDateBusyReason6A3(p,pr)){rec.status='Declined';rec.reason='A date is no longer available';return true}
  // A romantic RSVP is never converted into an automatic platonic yes.
  if(choice==='accept'&&!promRomancePossible6A3(p)){
   rec.status='Declined';rec.reason='Romantic compatibility or consent is missing';
   if(!SIM.skipping)log('Prom RSVP',`${firstName(p)} is not available for a romantic Prom date. Going together as friends is a separate choice.`);
   return true;
  }
  const mode=choice==='accept'?'date':'friends';
  const saved=promDateCommit6A3(pr,p,mode,'npc_invitation');rec.status=saved.ok?(mode==='friends'?'Accepted as friends':'Accepted'):'Declined';rec.reason=saved.ok?'Mutual invitation':saved.reason;
 }else if(choice==='time'){
  rec.status='Waiting';rec.deadline=addDays(currentDate(),2);scheduleFollowUp('promTimeout',{eventId:id,personId:p.id,requestId:rec.requestId},{days:2,minute:1080});
  if(!SIM.skipping)log('Prom RSVP deferred',`You ask ${firstName(p)} for time. They can make other plans after ${formatDate(rec.deadline)}.`);
 }else{
  rec.status='Declined';rec.reason=choice==='have'?'Already going with someone':'Politely declined';p.rel=clamp((p.rel||0)-1);
  rememberPerson(p,'You respectfully declined their Prom invitation.',1);
  if(!SIM.skipping)log('Prom invitation declined',`You thank ${firstName(p)} for asking and explain that you will not go together.`);
 }
 rec.decisionDate=currentDate();return true;
}
function promFollowUp6A3(f){
 if(!['promTimeout','promAnswer'].includes(f?.type))return false;
 const pr=S.school?.prom,id=promDateEvent6A3(pr),p=personById(f.payload?.personId);
 if(!pr||!id||!p||f.payload?.eventId&&f.payload.eventId!==id||!promDateWindow6A3(pr))return true;
 const list=f.type==='promAnswer'?pr.asked:pr.received;
 const rec=list.find(r=>r.personId===p.id&&r.eventId===id&&(!f.payload?.requestId||r.requestId===f.payload.requestId)&&(!f.payload?.eventId?f.createdDate===r.dateISO:true)&&r[f.type==='promAnswer'?'result':'status']===(f.type==='promAnswer'?'Pending':'Waiting'));
 if(!rec)return true;
 if(f.type==='promTimeout'){
  rec.status='Expired';rec.reason='The reply deadline passed';if(!SIM.skipping)log('Prom invitation expired',`${firstName(p)} made other plans after the reply window closed.`);return true;
 }
 const reason=promDateBusyReason6A3(p,pr),canAccept=!pr.partnerId&&!reason;
 const friendshipPossible=(p.rel||0)>=45;
 // Pending does not guarantee a yes. Original compatibility, trust and agency still count.
 const romantic=promRomancePossible6A3(p),score=(p.rel||0)*.43+(p.trust??50)*.2+(romantic?romanceCompatibility(p).score*.28:10);
 const yes=canAccept&&(score+hashOf(`${id}:${p.id}:delayed`)%21>=75);
 const asFriends=canAccept&&!yes&&friendshipPossible&&(score+hashOf(`${id}:${p.id}:friends`)%23>=62);
 if(yes||asFriends){const committed=promDateCommit6A3(pr,p,yes?'date':'friends','delayed_response');rec.result=committed.ok?(yes?'Accepted':'Accepted as friends'):'Rejected';rec.reason=committed.ok?'Accepted after thinking it over':committed.reason;}
 else{rec.result='Rejected';rec.reason=reason||'Decided not to go together';}
 if(!SIM.skipping)log('Prom invitation answered',`${firstName(p)} ${rec.result==='Rejected'?'says no':'says yes'}. ${rec.reason}.`,rec.result!=='Rejected');return true;
}
function promDateSummaryHtml6A3(pr=S.school?.prom){
 const d=promDateStatus6A3(pr);if(!d||!promRegistered6A1(pr))return '';
 const p=pr.partnerId&&personById(pr.partnerId),pending=pr.asked.find(a=>a.result==='Pending');
 return `<div class="prom-date-6a3"><h4>Prom invitations & RSVP</h4>`+
  `<p class="muted-text">${p?`Confirmed ${pr.asFriends?'friend':'date'}: ${esc(displayName(p))}`:pending?`Waiting for ${esc((personById(pending.personId)?displayName(personById(pending.personId)):'a student'))} to answer by ${formatDate(pending.deadline)}.`:pr.plan==='friends'?'Going with your friends; no date needed.':pr.plan==='alone'?'Going alone; no date needed.':'No date confirmed. You can still attend.'}</p>`+
  (p&&promDateWindow6A3(pr)?'<button class="small ghost" data-prom-date6a3="cancel">Cancel this date respectfully / change plans</button>':'')+
  (pr.asked.length?`<details><summary>Invitations sent (${pr.asked.length})</summary>${pr.asked.map(a=>`<p class="muted-text">${esc(personById(a.personId)?displayName(personById(a.personId)):a.personId)}: ${esc(a.result)}${a.reason?' — '+esc(a.reason):''}</p>`).join('')}</details>`:'')+
  (pr.received.length?`<details><summary>Invitations received (${pr.received.length})</summary>${pr.received.map(a=>`<p class="muted-text">${esc(personById(a.personId)?displayName(personById(a.personId)):a.personId)}: ${esc(a.status)}</p>`).join('')}</details>`:'')+'</div>';
}
function promDateClick6A3(b){if(b?.dataset?.promDate6a3!=='cancel')return false;const r=promCancelDate6A3();if(!r.ok)toast('No current confirmed Prom date to cancel.');save();render();return true;}
// Preserve original preparation and panel markup; append only checkpoint-specific RSVP details.
function promHtml(){const html=promHtmlLegacy6A3();return html&&promRegistered6A1(S.school?.prom)?html.replace(/<\/div>$/,promDateSummaryHtml6A3()+'</div>'):html;}
function promAskTarget(id){return promDateAskTarget6A3(id)}
function promAskModal(id){return promDateAskModal6A3(id)}
function askToProm(id,approach){const result=promDateAsk6A3(id,approach);if(!result.ok)toast(result.reason);return result;}
function setPromPlan(plan){if(plan==='committee'){toast('Only approved committee members may organize Prom.');return;}const r=promDatePlan6A3(plan);if(!r.ok)toast(r.reason);return r;}
function promClick(b){if(promDateClick6A3(b))return true;return promClickLegacy6A3(b)}

function setPromWithNpc(npcId,name){
 setPromWithNpcLegacy6A3(npcId,name);
 const id=promDateEvent6A3();if(!id)return;
 const n=npcById(npcId);if(n)n.promEventId6A3=id;
 for(const p of S.people||[])if(p.npcId===npcId)p.promEventId6A3=id;
}
function setPromWithPerson(p,name){
 setPromWithPersonLegacy6A3(p,name);
 const id=promDateEvent6A3();if(id&&p)p.promEventId6A3=id;
}
