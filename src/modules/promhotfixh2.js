// CROSS-PHASE H2 — Prom invitations, candidate discovery, truthful guest status and ticket accounting.
// Extend existing 6A/6B Prom invitations; separate H3 school visitor authority lives in schoolguesth3.js.
const PROM_H2_SCHEMA=1;
function promH2SchoolStatus(p,pr=S?.school?.prom){
 if(!p||!pr)return 'unknown';
 const n=p.npcId&&npcById(p.npcId),schoolId=pr.foundation6A1?.schoolId;
 if(n?.currentSchoolId){return n.currentSchoolId===schoolId?'host-school':'other-school';}
 // A People-card introduction is not evidence of enrollment. Never infer from age or name.
 return 'unknown';
}
function promH2SchoolLabel(p,pr){
 const s=promH2SchoolStatus(p,pr);
 return s==='host-school'?'School peer (enrollment known)':s==='other-school'?'Different school · guest permission required':'School unverified · ask about their school';
}
function promH2RSVP(p,pr){
 if(pr.partnerId===p.id)return {kind:'confirmed',label:'Confirmed '+(pr.asFriends?'as friends':'as date'),reason:null};
 const outgoing=(pr.asked||[]).filter(r=>r.personId===p.id&&(!r.eventId||r.eventId===promDateEvent6A3(pr))).at(-1);
 const incoming=(pr.received||[]).filter(r=>r.personId===p.id&&(!r.eventId||r.eventId===promDateEvent6A3(pr))).at(-1);
 if(outgoing)return {kind:'asked',label:outgoing.result==='Pending'?'Pending response':outgoing.result==='Accepted'?'Accepted':outgoing.result==='Accepted as friends'?'Accepted as friends':outgoing.result==='Rejected'?'Declined':outgoing.result==='Expired'?'Expired':outgoing.result==='Withdrawn'?'Withdrawn':String(outgoing.result),reason:outgoing.reason||null};
 if(incoming)return {kind:'received',label:incoming.status==='Pending'?'They invited you · reply needed':incoming.status==='Declined'?'Declined':incoming.status==='Waiting'?'Waiting':String(incoming.status),reason:incoming.reason||null};
 return {kind:'new',label:'Not yet invited',reason:null};
}
function promH2Available(p,pr){
 if(pr.partnerId&&pr.partnerId!==p.id)return 'You already have a Prom companion';
 const reason=promDateBusyReason6A3(p,pr);
 if(reason)return reason;
 const r=promH2RSVP(p,pr);
 if(r.kind!=='new')return r.label;
 const gate=promDateCanAsk6A3(p,pr);
 return gate.ok?null:gate.reason;
}
function promH2CandidateGroup(p,pr){
 const r=promH2RSVP(p,pr),busy=promDateBusyReason6A3(p,pr);
 if(r.kind==='received'&&r.label.includes('reply'))return 'pending';
 if(r.kind==='asked'&&r.label==='Pending response')return 'pending';
 if(r.kind!=='new'&&(r.label==='Declined'||r.label==='Expired'||r.label==='Withdrawn'))return 'unavailable';
 if(busy||r.kind==='confirmed'||pr.partnerId&&pr.partnerId!==p.id)return 'unavailable';
 return 'available';
}
function promH2PersonRow(p,pr,featured=false){
 const gate=promDateCanAsk6A3(p,pr),reason=promH2Available(p,pr),r=promH2RSVP(p,pr),name=displayName(p,'formal');
 const group=promH2CandidateGroup(p,pr),school=promH2SchoolLabel(p,pr),confirmed=pr.partnerId===p.id;
 return `<div class="prom-h2-person${featured?' prom-h2-featured':''}" data-prom-h2-candidate="${esc(p.id)}" data-prom-h2-name="${esc(String(name).toLowerCase())}" data-prom-h2-group="${group}">
 <div class="prom-h2-person-info"><b>${esc(name)}</b><small>${esc(school)} · Age ${esc(String(personAge(p)))}</small><small>${esc(r.label)}${r.reason?' · '+esc(r.reason):''}</small>${!gate.ok&&reason&&!confirmed?`<small class="prom-h2-warning">${esc(reason)}</small>`:''}</div>
 ${gate.ok?`<button class="small" data-prom-ask="${esc(p.id)}">Ask to Prom</button>`:`<span class="prom-h2-pill">${esc(r.kind==='new'?(reason||'Unavailable'):r.label)}</span>`}</div>`;
}
function promH2NeighbourRow(n,pr){
 // Do not instantiate a Person or presume access merely to list known neighbours.
 const same=(S.people||[]).some(p=>p.npcId===n.id);if(same)return '';
 return `<div class="prom-h2-person" data-prom-h2-candidate="npc:${esc(n.id)}" data-prom-h2-name="${esc(String(n.fullName||n.name||'').toLowerCase())}" data-prom-h2-group="available"><div class="prom-h2-person-info"><b>${esc(n.fullName||n.name||'Neighbour')}</b><small>Neighbour · School guest eligibility not verified</small><small>Not yet invited</small></div><button class="small ghost" data-prom-ask="npc:${esc(n.id)}">Ask to Prom</button></div>`;
}
function promH2InvitationsHtml(pr){
 const all=(S.people||[]).filter(p=>promDateStudent6A3(p)),partner=(S.people||[]).find(p=>isEstablishedPartner(p));
 const pending=(pr.asked||[]).some(r=>r.result==='Pending');
 const disabled=!!pr.partnerId||pr.plan==='skip';
 const groups={available:[],pending:[],unavailable:[]};
 for(const p of all){if(partner&&p.id===partner.id)continue;groups[promH2CandidateGroup(p,pr)].push(p);}
 for(const g of Object.keys(groups))groups[g].sort((a,b)=>displayName(a,'formal').localeCompare(displayName(b,'formal'))||String(a.id).localeCompare(String(b.id)));
 const neighbours=neighborPromCandidates().filter(n=>!all.some(p=>p.npcId===n.id)).sort((a,b)=>String(a.fullName||'').localeCompare(String(b.fullName||'')));
 const partnerCard=partner?`<div class="prom-h2-partner"><h5>Your Partner</h5>${promDateStudent6A3(partner)?promH2PersonRow(partner,pr,true):`<div class="prom-h2-person prom-h2-featured"><div class="prom-h2-person-info"><b>${esc(displayName(partner))}</b><small>Official partner · age/event eligibility not satisfied</small><small>Cannot invite to this Prom under current rules</small></div></div>`}</div>`:'';
 const section=(group,title,collapsed)=>groups[group].length?`${collapsed?'<details class="prom-h2-group" data-prom-h2-details="1"><summary>':'<div class="prom-h2-group"><h5>'}${esc(title)} (${groups[group].length})${collapsed?'</summary>':'</h5>'}<div class="prom-h2-candidates">${groups[group].map(p=>promH2PersonRow(p,pr)).join('')}</div>${collapsed?'</details>':'</div>'}`:'';
 return `<div class="prom-h2-invitations" data-prom-h2="1"><h4>Prom invitations</h4><p class="muted-text">Invitations require a reply. An accepted invitation does not grant external visitor entry. Ask about school affiliation, request guest approval, and arrange a visitor ticket as needed.</p>${partnerCard}
 ${pr.partnerId?`<p class="muted-text">You have confirmed a companion. You can review the RSVP or cancel respectfully below before asking someone else.</p>`:pr.plan==='skip'?'<p class="muted-text">You chose to skip Prom. Change your attendance plan if you want to invite someone.</p>':`<label class="prom-h2-search-label" for="prom-h2-search">Find someone to ask</label><input type="search" id="prom-h2-search" data-prom-h2-search="1" placeholder="Search all known students and neighbours" autocomplete="off" aria-label="Search Prom candidates"/>
 <div class="prom-h2-results" data-prom-h2-results="1">${section('available','Available people',false)}${neighbours.length?`<details class="prom-h2-group"><summary>Neighbours / unknown school (${neighbours.length})</summary><div class="prom-h2-candidates">${neighbours.map(n=>promH2NeighbourRow(n,pr)).join('')}</div></details>`:''}${section('pending','Already invited / pending',true)}${section('unavailable','Unavailable / declined',true)}${!all.length&&!neighbours.length?'<p class="muted-text">No eligible people known yet. Meet friends at school or in your neighborhood.</p>':''}</div>${pending?'<p class="muted-text">One invitation is awaiting an answer. You cannot send another until it resolves.</p>':''}`}
 </div>`;
}
function promH2TicketPrice(pr=S?.school?.prom){return pr?.ticket!=null&&Number.isFinite(Number(pr.ticket))&&Number(pr.ticket)>=0?Number(pr.ticket):(pr?.junior?20:40)}
function promH2TicketAction(key){
 const pr=S?.school?.prom;if(!pr||!promRegistered6A1(pr)||pr.status!=='Season'||pr.plan==='skip')return {ok:false,reason:'Prom ticket action unavailable'};
 if(pr.ticketBought)return {ok:false,reason:'Ticket already arranged'};
 if(!['ticket','waiver'].includes(key))return {ok:false,reason:'Unknown ticket action'};
 const price=promH2TicketPrice(pr),id=promDateEvent6A3(pr);
 if(key==='waiver'&&!chance(70))return {ok:false,reason:'No school waiver is available this time. You can ask a caregiver or buy a ticket.'};
 let payer='waiver',amount=0;
 if(key==='ticket'){
  // A caregiver may cover an under-18 student. Otherwise only charge what the visible ticket says.
  if(S.age<18&&caregiverYes(S.wealth==='Struggling'?-25:0))payer='caregiver';
  else {if((Math.max(0,Number(S.money)||0)+Math.max(0,Number(S.finance?.savings)||0))<price||!spendOwn(price))return {ok:false,reason:`A ticket costs ${money(price)}. Choose a free waiver or save enough first.`};payer='player';amount=price;}
 }
 pr.ticketBought=true;pr.prep=pr.prep||{};pr.prep.ticket=key==='waiver'?'waiver':'bought';
 pr.ticketPaymentH2={schemaVersion:PROM_H2_SCHEMA,eventId:id,method:key==='waiver'?'waiver':'purchase',payer,amount,listedPrice:price,dateISO:currentDate()};
 advanceTime(30);log('Prom ticket',payer==='waiver'?'Your school-approved ticket waiver is confirmed.':payer==='caregiver'?`${primaryCaregiver()} covers your ${money(price)} Prom ticket.`:`You buy your ${money(price)} Prom ticket.`);
 return {ok:true,price,payer,amount,eventId:id};
}
// Idempotent conservative metadata: prior purchases and waivers are NOT retroactively charged or invented.
function promH2ReconcileTicket(pr){
 if(!pr?.foundation6A1?.eventId)return;
 if(pr.ticketPaymentH2&&pr.ticketPaymentH2.eventId!==pr.foundation6A1.eventId)delete pr.ticketPaymentH2;
 if(pr.ticketBought&&!pr.ticketPaymentH2)pr.ticketPaymentH2={schemaVersion:PROM_H2_SCHEMA,eventId:pr.foundation6A1.eventId,method:'legacy_recorded',payer:'unverified',amount:null,listedPrice:promH2TicketPrice(pr),dateISO:null};
}
function promH2TicketHtml(pr){
 promH2ReconcileTicket(pr);const paid=pr.ticketPaymentH2;
 return `<div class="prom-prep"><b>Ticket · ${money(promH2TicketPrice(pr))}</b>${pr.ticketBought?`<span class="tag ok">${esc(pr.prep.ticket==='waiver'?'Waiver approved':'Arranged')}</span><small class="muted-text">${paid?.payer==='unverified'?'Legacy ticket recorded · original payer/amount unknown':paid?.payer==='caregiver'?'Covered by caregiver':paid?.payer==='player'?'Paid '+money(paid.amount):paid?.payer==='waiver'?'School waiver confirmed':'Ticket confirmed'}</small>`:`<button class="small" data-prom-prep="ticket">Buy · ${money(promH2TicketPrice(pr))}</button><button class="small ghost" data-prom-prep="waiver">Ask for waiver · Free</button>`}</div>`;
}
function promH2PrepHtml(pr){
 const show=pr.plan!=='skip';if(!show)return '';
 const x=pr.prep||{},step=(name,keys)=>`<div class="prom-prep"><b>${esc(name)}</b>${x[name.toLowerCase()]?`<span class="tag ok">${esc(x[name.toLowerCase()])}</span>`:keys.map(k=>`<button class="small ${PROM_PREP[k][1]?'':'ghost'}" data-prom-prep="${k}">${esc(PROM_PREP[k][0])}${PROM_PREP[k][1]?' · '+money(PROM_PREP[k][1]):''}</button>`).join('')}</div>`;
 const group=(label,contents,open)=>`<details class="prom-h2-prep-group"${open?' open':''}><summary>${esc(label)}</summary>${contents}</details>`;
 return `<div class="prom-h2-preparation"><h4>Prom preparation</h4>${group('1 · Ticket / waiver',promH2TicketHtml(pr),!pr.ticketBought)}${group('2 · Outfit and appearance',`<p class="muted-text">For hair, makeup, and outfit choices, use the event's Getting Ready panel at home near Prom night. No phantom clothing purchases.</p>${['US','UK','CA','AU'].includes(calendarProfile().region)?step('Corsage',['corsage']):''}`,false)}${group('3 · Transport',step('Transport',['rideParents','rideCarpool','rideLimo']),false)}${group('4 · Dinner and photos',step('Dinner',['dinnerHome','dinnerOut'])+step('Photos',['photos']),false)}<small class="muted-text">Free alternatives available. Final-night outfit preparation is in the existing Getting Ready section.</small></div>`;
}
// Replace only the composite candidate/preparation markup; original 6A/6B handlers remain authoritative.
function promHtml(){
 const pr=S?.school?.prom;if(!pr||pr.status!=='Season')return '';
 if(!promRegistered6A1(pr))return `<div class="holiday-card prom-card"><b>💃 ${pr.junior?'Junior Prom':'Prom'} • ${formatDate(pr.dateISO)}</b>${promFoundationHtml6A1(pr)}</div>`;
 const d=promDaysLeft(),companion=pr.partnerId&&personById(pr.partnerId);
 return `<div class="holiday-card prom-card prom-h2-card"><div class="holiday-head"><span class="holiday-icon">💃</span><div><b>Prom · ${d===0?'tonight':`in ${d} day${d===1?'':'s'}`}</b><small>${formatDate(pr.dateISO)} · ${esc(pr.venue)} · Formal${companion?' · with '+esc(displayName(companion)):''}</small></div></div>
 ${promFoundationHtml6A1(pr)}${promH2InvitationsHtml(pr)}<div class="prom-h2-plans"><h4>Your attendance plan</h4><div class="holiday-acts">${['friends','alone','wait','skip'].filter(x=>x!==pr.plan).map(x=>`<button class="small ghost" data-prom-plan="${x}">${{friends:'Go with friends',alone:'Go alone',wait:'Wait to be asked',skip:'Skip Prom'}[x]}</button>`).join('')}</div></div>${promH2PrepHtml(pr)}${promDateSummaryHtml6A3(pr)}</div>`;
}
const promPrepBeforeH2=promPrep;
promPrep=function(key){if(key==='ticket'||key==='waiver')return promH2TicketAction(key);return promPrepBeforeH2(key);};
// Do not rerender the whole game while typing; all candidates already exist in the DOM.
if(typeof document!=='undefined')document.addEventListener('input',function(e){
 if(!e.target?.matches?.('[data-prom-h2-search]'))return;
 const panel=e.target.closest('.prom-h2-invitations'),q=String(e.target.value||'').trim().toLowerCase();if(!panel)return;
 for(const item of panel.querySelectorAll('.prom-h2-results [data-prom-h2-candidate]')){
  const ok=!q||item.getAttribute('data-prom-h2-name').includes(q);item.hidden=!ok;
  if(ok&&q){const details=item.closest('details');if(details)details.open=true;}
 }
});
