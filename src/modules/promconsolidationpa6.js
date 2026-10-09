// HF-PA.6: presentation-only consolidation. All game state and delegated actions stay with PA.1–PA.5.
// No migration: this module renders canonical records without allocating any additional gameplay state.
function promPA6Overview(pr){
 const remaining=daysBetween(currentDate(),pr.dateISO),partner=(S.people||[]).find(p=>isEstablishedPartner(p)),companion=pr.partnerId&&personById(pr.partnerId);
 const f=pr.foundation6A1||{},c=pr.court6A4||{},ready=pr.night6B1?.gettingReady6B2||{};
 const ballotOpen=!!c.nominationsLocked&&!c.ballotLocked&&currentDate()>=c.ballotOpen&&currentDate()<=c.ballotClose;
 const needConsent=!!companion&&!!partnerBoundaryH1(companion,'noParties')&&!pa1EventAllows(companion,promDateEvent6A3(pr));
 const companionText=companion?(isEstablishedPartner(companion)?pa1RelationshipLabel(companion):'Prom companion')+': '+displayName(companion,'formal'):
   partner?'Partner: '+displayName(partner,'formal')+' · invitation not confirmed':pr.plan==='alone'?'Going alone':pr.plan==='friends'?'Going with friends':'No confirmed companion';
 const ticketText=pr.ticketBought?'Ticket arranged':`Ticket not arranged · ${money(promH2TicketPrice(pr))}`;
 const prepared=!!ready.hair&&!!ready.makeup;
 let next,link;
 if(needConsent){next='Discuss this event with your companion before seeking school admission.';link='prom-pa6-companion';}
 else if(!pr.ticketBought&&pr.plan!=='skip'){next='Arrange a ticket or request a waiver.';link='prom-pa6-prep';}
 else if(ballotOpen){next='Meet the Court candidates and choose whether to vote.';link='prom-pa6-school';}
 else if(pr.plan!=='skip'&&remaining>0&&(!ready.plannedHair||!ready.plannedMakeup)){next='Plan hair, makeup and a real outfit now; apply the look on Prom day.';link='prom-pa6-prep';}
 else if(remaining===0&&!prepared){next='Get ready at Home before the check-in deadline; makeup is optional.';link='prom-pa6-night';}
 else {next=remaining===0?'Check the Hall arrival requirements below.':'Review the next school deadline or event plan.';link=remaining===0?'prom-pa6-night':'prom-pa6-school';}
 return `<section class="prom-pa6-overview" aria-label="Prom at a glance"><div class="prom-pa6-top"><div><h4>Your Prom checklist · ${remaining===0?'Today':remaining>0?remaining+' days away':'Event passed'}</h4><small>The steps below use your actual school Prom, attendance records and inventory</small></div><span class="tag">${esc(f.registrationStatus==='registered'?'Registered':f.registrationStatus||'Registration open')}</span></div>
 <div class="prom-pa6-status"><div><small>Companion</small><b>${esc(companionText)}</b></div><div><small>Entry</small><b>${esc(ticketText)}</b></div><div><small>Appearance</small><b>${esc(prepared?'Ready':ready.plannedHair&&ready.plannedMakeup?'Planned · not applied':'Planning available')}</b></div></div>
 <p class="prom-pa6-next"><b>What to do next:</b> ${esc(next)} <a href="#${link}">Go to this step ↓</a></p>
 <nav class="prom-pa6-nav" aria-label="Prom sections"><a href="#prom-pa6-companion">Companion & admission</a><a href="#prom-pa6-prep">Ticket & appearance</a><a href="#prom-pa6-school">Court & school</a><a href="#prom-pa6-night">Prom Night</a></nav></section>`;
}
// The PA.1 wrapper previously appended this detailed card after Court, RSVP and preparation.
// Present it before invitations, while keeping the original H2 candidate rows and delegated controls.
promHtml=function(){
 const pr=S?.school?.prom;if(!pr||pr.status!=='Season')return '';
 if(!promRegistered6A1(pr))return `<div class="holiday-card prom-card"><b>💃 ${pr.junior?'Junior Prom':'Prom'} · ${formatDate(pr.dateISO)}</b>${promFoundationHtml6A1(pr)}</div>`;
 const court=pr.court6A4;
 const courtOpen=!court||!court.ballotLocked; // accessible without extra clicks while nominations/voting are live
 const plans=pr.plan==='skip'?'':`<div class="prom-h2-plans"><h4>Attendance options</h4><div class="holiday-acts">${['friends','alone','wait','skip'].filter(x=>x!==pr.plan).map(x=>`<button class="small ghost" data-prom-plan="${x}">${{friends:'Go with friends',alone:'Go alone',wait:'Wait to be asked',skip:'Skip Prom'}[x]}</button>`).join('')}</div></div>`;
 return `<div class="holiday-card prom-card prom-h2-card prom-pa6-screen" data-prom-pa6="1">
 ${promPA6Overview(pr)}
 <section id="prom-pa6-companion" class="prom-pa6-section" aria-label="Companion and admission">${pa1CompanionHtml(pr)}${pr.partnerId?schoolGuestHostHtmlH3(pr):''}${promH2InvitationsHtml(pr)}${plans}${promDateSummaryHtml6A3(pr)}</section>
 <section id="prom-pa6-prep" class="prom-pa6-section" aria-label="Ticket and preparation">${promH2PrepHtml(pr)}</section>
 <details id="prom-pa6-school" class="prom-pa6-school" ${courtOpen?'open':''}><summary>Prom Court, committee and school activities <small>${court?.ballotLocked?'Voting finished · review results':'Nomination and voting information'}</small></summary>${promFoundationHtml6A1(pr)}</details>
 </div>`;
};
// The stage panel retains one canonical Prom Night and Getting Ready renderer, not an extra set of actions.
const promPA6OldNightHtml=promNightHtml6B1;
promNightHtml6B1=function(pr=S?.school?.prom){const html=promPA6OldNightHtml(pr);return html?`<section id="prom-pa6-night" class="prom-pa6-night">${html}</section>`:''};
// Move the existing PA.5 allowance panel next to Cash/Savings, then present chore earnings
// separately before the long inventory/store catalog. Do not clone any buttons or ledgers.
const promPA6OldBusinessPanel=businessPanel;
businessPanel=function(){
 let html=promPA6OldBusinessPanel();const allowanceStart=html.indexOf('<section class="card wide allowance-pa5"');
 const allowanceEnd=allowanceStart>=0?html.indexOf('</section>',allowanceStart)+10:-1;
 const choresStart=html.indexOf('<section class="card wide"><h3>Chore earnings</h3>');
 const choresEnd=choresStart>=0?html.indexOf('</section>',choresStart)+10:-1;
 const inventoryStart=html.indexOf('<section class="card wide"><div class="section-heading"><div><h3>Your things</h3>');
 if(allowanceStart<0||allowanceEnd<=10||inventoryStart<0)return html;
 const allowance=html.slice(allowanceStart,allowanceEnd);
 const chores=choresStart>=0&&choresEnd>choresStart?html.slice(choresStart,choresEnd):'';
 const cut=[[allowanceStart,allowanceEnd],...(chores?[[choresStart,choresEnd]]:[])].sort((a,b)=>b[0]-a[0]);
 for(const [start,end] of cut)html=html.slice(0,start)+html.slice(end);
 const i=html.indexOf('<section class="card wide"><div class="section-heading"><div><h3>Your things</h3>');
 return html.slice(0,i)+`<div class="prom-pa6-finance-intro"><b>Family money</b><small>Weekly allowance is a caregiver agreement. Chore earnings are optional and do not move payday.</small></div>`+allowance+chores+html.slice(i);
};
