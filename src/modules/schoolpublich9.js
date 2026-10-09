// H9 — Public school-event visitor permissions (GAP-18).
// Reuses H3 fictional school-owned event dates and the canonical school/location/clock.
// A school visitor credential never confers enrolled-student, classroom or court privileges.
const H9_PUBLIC_TYPES=Object.freeze(['school_show','school_concert','school_awards']);
const H9_TERMINAL=new Set(['Attended','Missed','Cancelled','Denied']);
function h9State(){
 if(!S.schoolPublicH9||typeof S.schoolPublicH9!=='object'||Array.isArray(S.schoolPublicH9))S.schoolPublicH9={schemaVersion:1,passes:{},history:[]};
 const s=S.schoolPublicH9;s.schemaVersion=1;
 if(!s.passes||typeof s.passes!=='object'||Array.isArray(s.passes))s.passes={};
 if(!Array.isArray(s.history))s.history=[];
 return s;
}
function migrateSchoolPublicH9(){return h9State();} // No invented historical event attendance.
function h9PublicEvent(schoolId,type,year){
 if(!H9_PUBLIC_TYPES.includes(type)||!schoolById(schoolId)||!Number.isInteger(Number(year)))return null;
 const venue=(schoolById(schoolId).facilities||[]).find(x=>/auditorium|theater|arts center|performing arts/i.test(x));
 if(!venue)return null; // The public event needs a real facility in the canonical school registry.
 const e=schoolGuestHostEventH3(schoolId,type,Number(year));
 if(!e||e.schoolId!==schoolId)return null;
 return {...e,hostEventId:e.eventId,eventId:'h9-public-'+e.eventId,location:schoolDisplayName(schoolId)+' '+venue,publicAccess:true,visitorPolicy:'public_event_registration_with_school_security',ticketPrice:type==='school_concert'?8:0};
}
function h9Policy(schoolId,type,age){
 if(!schoolById(schoolId)||!H9_PUBLIC_TYPES.includes(type))return {ok:false,reason:'unknown_event_or_school'};
 if(!Number.isFinite(age)||age<13)return {ok:false,reason:'visitor_age_ineligible'};
 return {ok:true,visitorAreas:['entrance','auditorium'],needsGuardian:age<18,needsHostApproval:true};
}
function h9KnownSchools(){
 const ids=new Set(), own=playerCurrentSchoolId4A2?.();
 if(own&&schoolById(own))ids.add(own);
 for(const p of S.people||[]){const k=p?.npcId&&schoolGuestSchoolH3(p);if(k?.known&&schoolById(k.schoolId))ids.add(k.schoolId);}
 // Publicly advertised neighborhood listings are tied to a verified home-school district.
 const base=schoolById(own);
 if(base){for(const sc of schoolRegistry(base.educationLevel)){
  // Public community listings are advertisements, not private student identities.
  if((sc.facilities||[]).some(f=>/auditorium|theater|arts center|performing arts/i.test(f)))ids.add(sc.schoolId);
 }}else{for(const sc of schoolRegistry('high'))if((sc.facilities||[]).some(f=>/auditorium|theater|arts center|performing arts/i.test(f)))ids.add(sc.schoolId);}
 if(![...ids].some(id=>(schoolById(id)?.facilities||[]).some(f=>/auditorium|theater|arts center|performing arts/i.test(f)))){
  for(const sc of schoolRegistry('high'))if((sc.facilities||[]).some(f=>/auditorium|theater|arts center|performing arts/i.test(f)))ids.add(sc.schoolId);
 }
 return [...ids].filter(id=>schoolById(id)).slice(0,8);
}
function h9Listings(){
 if(S.age<13)return [];
 const today=currentDate(),year=Number(today.slice(0,4));let out=[];
 for(const sid of h9KnownSchools())for(const type of H9_PUBLIC_TYPES)for(const y of [year,year+1]){
  const e=h9PublicEvent(sid,type,y);if(e&&e.dateISO>=today&&e.dateISO<=addDays(today,300))out.push(e);
 }
 return out.sort((a,b)=>a.dateISO.localeCompare(b.dateISO)||a.eventId.localeCompare(b.eventId)).slice(0,12);
}
function h9Pass(eventId){return h9State().passes[eventId]||null;}
function h9Gate(event){
 if(!event)return {ok:false,reason:'event_not_published'};
 if(S.age<13)return {ok:false,reason:'visitor_age_ineligible'};
 if(!schoolById(event.schoolId))return {ok:false,reason:'unknown_school'};
 if(event.schoolId===playerCurrentSchoolId4A2())return {ok:false,reason:'own_school_no_visitor_pass_needed'};
 if(event.dateISO<currentDate())return {ok:false,reason:'event_ended'};
 if(S.location!=='Home')return {ok:false,reason:'return_home_before_registration'};
 return h9Policy(event.schoolId,event.type,S.age);
}
function h9Register(schoolId,type,year){
 const e=h9PublicEvent(schoolId,type,year),g=h9Gate(e);
 if(!g.ok)return g;
 if(!h9Listings().some(x=>x.eventId===e.eventId))return {ok:false,reason:'event_not_in_public_listings'};
 const st=h9State(),old=st.passes[e.eventId];if(old)return {ok:false,reason:'registration_already_recorded',record:old};
 const hostApproved=hashOf(e.eventId+'|h9|visitor|player')%100<(schoolById(e.schoolId).type==='private'?75:90);
 const guardianApproved=S.age>=18||caregiverApproval(8);
 const approved=hostApproved&&guardianApproved;
 const r={schemaVersion:1,id:'h9-'+e.eventId,eventId:e.eventId,schoolId:e.schoolId,type:e.type,dateISO:e.dateISO,startMinute:e.startMinute,endMinute:e.endMinute,entryCutoffMinute:e.entryCutoffMinute,role:'public_event_visitor',status:approved?'Approved':'Denied',hostApproval:hostApproved?'Approved':'Denied',guardianApproval:S.age>=18?'NotRequired':guardianApproved?'Approved':'Denied',credential:approved?'H9-VIS-'+hashOf(e.eventId+'|player'):null,visitorAreas:['entrance','auditorium'],ticket:{price:e.ticketPrice,paid:e.ticketPrice===0,payer:e.ticketPrice===0?'complimentary':null},arrival:null,checkout:null,contacts:{},actions:[],history:[{action:'registered',status:approved?'Approved':'Denied',dateISO:currentDate(),minute:currentMinute()}]};
 st.passes[e.eventId]=r;
 if(!S.calendar)S.calendar=[];
 if(!(S.calendar||[]).some(x=>x.id===e.eventId))S.calendar.push({id:e.eventId,type:'schoolPublicVisitH9',title:`Public ${e.type.replace('school_','').replace('_',' ')} · ${schoolDisplayName(e.schoolId)}`,dateISO:e.dateISO,startMinute:e.startMinute,endMinute:e.endMinute,schoolId:e.schoolId,status:approved?'Scheduled':'Cancelled',source:'school_public_h9',payload:{visitorRole:'public_event_visitor',permittedAreas:['entrance','auditorium']}});
 advanceTime(10,{silent:true});log('Public school visitor',approved?`School office approved public-event visitor registration at ${schoolDisplayName(e.schoolId)}.`:`A visitor approval was declined for ${schoolDisplayName(e.schoolId)}.`);
 return {ok:true,record:r};
}
function h9Ticket(eventId){
 const r=h9Pass(eventId);if(!r||r.status!=='Approved'||r.ticket.paid)return {ok:false,reason:'ticket_not_available'};
 if((Number(S.money)||0)<r.ticket.price||!spendOwn(r.ticket.price))return {ok:false,reason:'insufficient_funds'};
 r.ticket.paid=true;r.ticket.payer='player';r.ticket.paidAt=currentDate();r.ticket.amount=r.ticket.price;
 r.history.push({action:'ticket',dateISO:currentDate(),amount:r.ticket.price});
 return {ok:true,record:r};
}
function h9TravelGate(eventId){
 const r=h9Pass(eventId);
 if(!r||r.status!=='Approved'||!r.credential)return {ok:false,reason:'visitor_approval_required'};
 if(!r.ticket.paid)return {ok:false,reason:'ticket_required'};
 if(currentDate()!==r.dateISO||currentMinute()<r.startMinute||currentMinute()+25>r.entryCutoffMinute)return {ok:false,reason:'outside_event_checkin_window'};
 if(S.location!=='Home')return {ok:false,reason:'depart_from_home'};
 if(S.age<18&&typeof isGrounded==='function'&&isGrounded())return {ok:false,reason:'guardian_restriction_grounded'};
 const conflicts=(S.calendar||[]).find(x=>x.id!==eventId&&x.dateISO===r.dateISO&&!isTerminal(x.status)&&['schoolDay','exam','clubSession','plan','workDay'].includes(x.type)&&Number(x.startMinute)<r.endMinute&&Number(x.endMinute)>currentMinute());
 if(conflicts)return {ok:false,reason:'calendar_conflict'};
 return {ok:true,record:r};
}
function h9CheckIn(eventId){
 const g=h9TravelGate(eventId);if(!g.ok)return g;
 const r=g.record;
 advanceTime(25,{silent:true});
 setPlayerLocation4C1('School',{schoolId:r.schoolId,reason:'H9 visitor desk check-in'});
 r.status='Attending';r.arrival={dateISO:currentDate(),minute:currentMinute(),credential:r.credential,area:'entrance'};
 r.history.push({action:'security_checkin',dateISO:currentDate(),minute:currentMinute(),area:'entrance'});
 const ev=(S.calendar||[]).find(x=>x.id===eventId);if(ev)setCalendarStatus(ev,'Attending','Visitor security desk checked in; auditorium only');
 log('School visitor check-in',`Checked in at ${schoolDisplayName(r.schoolId)} security desk. This is not classroom or student access.`);
 return {ok:true,record:r};
}
function h9ActualPresence(r){return !!r&&r.status==='Attending'&&S.location==='School'&&locationSchoolId4C1()===r.schoolId&&currentDate()===r.dateISO&&currentMinute()>=r.startMinute&&currentMinute()<r.endMinute;}
function h9GuestInvite(eventId,personId){
 const r=h9Pass(eventId),p=personById(personId);
 if(!r||!['Approved','Attending'].includes(r.status))return {ok:false,reason:'no_public_event_registration'};
 if(!p||isFamilyPerson(p)||p.movedAway||p.deceased||!p.npcId)return {ok:false,reason:'known_available_person_required'};
 if(r.contacts[personId])return {ok:false,reason:'invitation_already_decided'};
 const affiliation=schoolGuestSchoolH3(p);if(!affiliation.known)return {ok:false,reason:'school_affiliation_unknown'};
 if(affiliation.schoolId===r.schoolId)return {ok:false,reason:'host_school_student_not_visitor'};
 const policy=h9Policy(r.schoolId,r.type,personAge(p));if(!policy.ok)return policy;
 if(currentDate()>r.dateISO||currentDate()===r.dateISO&&currentMinute()>r.entryCutoffMinute)return {ok:false,reason:'guest_registration_closed'};
 const npc=npcById(p.npcId);if(!npc||npc.currentSchoolId!==affiliation.schoolId)return {ok:false,reason:'school_affiliation_unverified'};
 const roll=hashOf(eventId+'|h9-invite|'+personId)%100;
 const yes=roll<Math.min(88,35+Math.round((p.rel||40)*.4));
 const staff=yes&&(hashOf(eventId+'|h9-staff|'+personId)%100<90);
 const guardian=staff&&(personAge(p)>=18||hashOf(eventId+'|h9-guardian|'+personId)%100<85);
 const status=!yes?'Declined':!staff||!guardian?'Denied':'Accepted';
 const v={personId,npcId:p.npcId,schoolId:affiliation.schoolId,status,consent:yes,hostApproval:staff?'Approved':'Denied',guardianApproval:guardian?'Approved':'Denied',credential:status==='Accepted'?'H9-GUEST-'+hashOf(eventId+'|'+personId):null,ticket:{price:r.ticket.price,paid:r.ticket.price===0,payer:r.ticket.price===0?'complimentary':null},arrivedAt:null};
 r.contacts[personId]=v;r.history.push({action:'invite_contact',personId,status,dateISO:currentDate()});advanceTime(10,{silent:true});
 log('Public event guest',`${displayName(p)}: ${status==='Accepted'?'agreed, with event-only school/guardian approval':'cannot attend this event'} .`);
 return {ok:true,record:v};
}
function h9VisitorTicket(eventId,personId){
 const r=h9Pass(eventId),v=r?.contacts?.[personId];
 if(!r||!v||v.status!=='Accepted'||!v.credential||v.ticket?.paid)return {ok:false,reason:'guest_ticket_unavailable'};
 if((Number(S.money)||0)<v.ticket.price||!spendOwn(v.ticket.price))return {ok:false,reason:'insufficient_funds'};
 v.ticket.paid=true;v.ticket.payer='player';v.ticket.amount=v.ticket.price;v.ticket.paidAt=currentDate();
 r.history.push({action:'guest_ticket',personId,amount:v.ticket.price,dateISO:currentDate()});return {ok:true,record:v};
}
function h9VisitorArrive(eventId,personId){
 const r=h9Pass(eventId),v=r?.contacts?.[personId],p=personById(personId);
 if(!h9ActualPresence(r))return {ok:false,reason:'player_not_at_verified_event'};
 if(currentMinute()>r.entryCutoffMinute)return {ok:false,reason:'guest_security_checkin_closed'};
 if(!v||v.status!=='Accepted'||!v.credential||!p||p.movedAway||p.deceased)return {ok:false,reason:'guest_not_approved'};
 if(!v.ticket?.paid)return {ok:false,reason:'guest_ticket_required'};
 if(v.arrivedAt)return {ok:false,reason:'guest_already_checked_in'};
 if(p.available===false||p.promUnavailableDateISO===r.dateISO)return {ok:false,reason:'guest_unavailable'};
 v.arrivedAt={dateISO:currentDate(),minute:currentMinute(),schoolId:r.schoolId,area:'auditorium',credential:v.credential};
 r.history.push({action:'contact_checkin',personId,dateISO:currentDate(),minute:currentMinute()});
 return {ok:true,record:v};
}
function h9Moment(eventId,personId,kind){
 const r=h9Pass(eventId),v=r?.contacts?.[personId],p=personById(personId);
 if(!h9ActualPresence(r)||!v?.arrivedAt||v.arrivedAt.schoolId!==r.schoolId||!p)return {ok:false,reason:'not_colocated_with_approved_guest'};
 if(!['talk','photo'].includes(kind))return {ok:false,reason:'event_areas_only'};
 if(r.actions.some(x=>x.personId===personId&&x.kind===kind))return {ok:false,reason:'already_shared'};
 const minutes=kind==='photo'?12:10;
 if(currentMinute()+minutes>r.endMinute)return {ok:false,reason:'event_ending'};
 const consent=kind==='talk'||hashOf(eventId+'|h9-photo|'+personId)%100<Math.min(90,45+(p.rel||0)*.35);
 r.actions.push({personId,kind,consent,dateISO:currentDate(),minute:currentMinute()});advanceTime(minutes,{silent:true});
 if(consent){rememberPerson(p,`You ${kind==='talk'?'talked':'took a photo'} together at a public school event in ${schoolDisplayName(r.schoolId)}.`,1);}
 log('School public event',consent?`You ${kind==='talk'?'talked with':'took a photo with'} ${displayName(p)} in the auditorium.`:`${displayName(p)} declined the photo.`);
 return {ok:true,consent};
}
function h9CheckOut(eventId,automatic=false){
 const r=h9Pass(eventId);if(!r||r.status!=='Attending')return {ok:false,reason:'not_checked_in'};
 r.status='Attended';r.checkout={dateISO:currentDate(),minute:currentMinute(),automatic};r.history.push({action:'security_checkout',dateISO:currentDate(),minute:currentMinute(),automatic});
 const ev=(S.calendar||[]).find(x=>x.id===eventId);if(ev&&!isTerminal(ev.status))setCalendarStatus(ev,'Attended','Visitor checked out');
 if(S.location==='School'&&locationSchoolId4C1()===r.schoolId)setPlayerLocation4C1('Home',{reason:'Public event visitor checkout'});
 if(!automatic)advanceTime(25,{silent:true});
 log('School visitor checkout',`Visitor pass closed for ${schoolDisplayName(r.schoolId)}.`);
 return {ok:true,record:r};
}
function h9Cancel(eventId){
 const r=h9Pass(eventId);if(!r||r.status!=='Approved'||currentDate()>r.dateISO)return {ok:false,reason:'cancellation_unavailable'};
 const refund=r.ticket.paid&&r.ticket.payer==='player'&&!r.ticket.refundedAt?(r.ticket.amount||0):0;
 let totalRefund=refund;
 if(refund){S.money+=refund;r.ticket.refundedAt=currentDate();r.ticket.refund=refund;}
 for(const v of Object.values(r.contacts||{})){if(v.ticket?.paid&&v.ticket.payer==='player'&&!v.ticket.refundedAt){const extra=v.ticket.amount||0;S.money+=extra;totalRefund+=extra;v.ticket.refundedAt=currentDate();v.ticket.refund=extra;}}
 r.status='Cancelled';r.credential=null;r.history.push({action:'cancel',refund:totalRefund,dateISO:currentDate()});
 const ev=(S.calendar||[]).find(x=>x.id===eventId);if(ev&&!isTerminal(ev.status))setCalendarStatus(ev,'Cancelled','Public visitor registration cancelled');
 return {ok:true,refund:totalRefund};
}
function h9Tick(){let changes=0;for(const r of Object.values(h9State().passes)){
 if(r.status==='Attending'&&(currentDate()>r.dateISO||currentDate()===r.dateISO&&currentMinute()>=r.endMinute)){h9CheckOut(r.eventId,true);changes++;}
 else if(r.status==='Approved'&&(currentDate()>r.dateISO||currentDate()===r.dateISO&&currentMinute()>r.entryCutoffMinute)){
  r.status='Missed';r.history.push({action:'missed',dateISO:currentDate()});const ev=(S.calendar||[]).find(x=>x.id===r.eventId);if(ev&&!isTerminal(ev.status))setCalendarStatus(ev,'Missed','Public event visitor did not check in');changes++;
 }
}return changes;}
function h9CalendarTick(ev){if(ev?.type!=='schoolPublicVisitH9')return 0;const r=h9Pass(ev.id);if(!r)return 0;const updates=h9Tick();if(r.status==='Approved'&&currentDate()===r.dateISO&&currentMinute()>=r.startMinute&&!isTerminal(ev.status)&&ev.status!=='Due')setCalendarStatus(ev,'Due','Public event visitor may check in through the visitor desk');return updates;}
function h9PublicHtml(){
 if(S.age<13)return '';
 const passes=Object.values(h9State().passes).filter(r=>r&&(!H9_TERMINAL.has(r.status)||r.dateISO>=addDays(currentDate(),-2))).sort((a,b)=>a.dateISO.localeCompare(b.dateISO));
 const listings=h9Listings().filter(e=>e.schoolId!==playerCurrentSchoolId4A2()&&!h9Pass(e.eventId)).slice(0,5);
 if(!passes.length&&!listings.length)return '';
 return `<section class="card wide school-public-h9" data-h9-panel="1"><div class="section-heading"><div><h3>Public school events & visitor desk</h3><p class="muted-text">Public auditorium events only. A visitor pass does not allow lessons, classrooms, student elections or campus roaming.</p></div></div>`+
 passes.map(r=>`<div class="session-card" data-h9-pass="${esc(r.eventId)}"><b>${esc(schoolDisplayName(r.schoolId))} · ${esc(r.type.replace('school_','').replace('_',' '))}</b><p>${esc(formatDate(r.dateISO))} · ${timeLabel(r.startMinute)} · ${esc(r.status)} · ${esc(r.hostApproval)} school / ${esc(r.guardianApproval)} guardian</p>${r.status==='Approved'?`<small>Security visitor ID: ${esc(r.credential)} · ${r.ticket.paid?'Ticket covered':`Ticket ${money(r.ticket.price)} required`}</small><div class="holiday-acts">${!r.ticket.paid?`<button class="small" data-h9-act="ticket" data-h9-id="${esc(r.eventId)}">Buy event ticket</button>`:`<button class="small" data-h9-act="enter" data-h9-id="${esc(r.eventId)}">Travel / security check-in</button>`}<button class="small ghost" data-h9-act="cancel" data-h9-id="${esc(r.eventId)}">Cancel RSVP</button></div>`:''}${r.status==='Attending'?`<p>Checked in · auditorium/entrance only · exits through the visitor desk</p><div class="holiday-acts"><button class="small" data-h9-act="leave" data-h9-id="${esc(r.eventId)}">Check out & go home</button></div>`:''}${['Approved','Attending'].includes(r.status)?`<details><summary>Invite an actual known person (optional)</summary><div class="holiday-acts">${(S.people||[]).filter(p=>p&&p.npcId&&!isFamilyPerson(p)&&schoolGuestSchoolH3(p).known).slice(0,15).map(p=>{const v=r.contacts[p.id];return `<div class="mini-meta"><span>${esc(displayName(p))} · ${esc(v?.status||'Not invited')}</span>${!v?`<button class="small ghost" data-h9-act="invite" data-h9-id="${esc(r.eventId)}" data-h9-person="${esc(p.id)}">Invite</button>`:v.status==='Accepted'&&!v.ticket?.paid?`<button class="small ghost" data-h9-act="guest-ticket" data-h9-id="${esc(r.eventId)}" data-h9-person="${esc(p.id)}">Buy guest ticket · ${money(v.ticket.price)}</button>`:v.status==='Accepted'&&r.status==='Attending'&&!v.arrivedAt?`<button class="small ghost" data-h9-act="guest-arrive" data-h9-id="${esc(r.eventId)}" data-h9-person="${esc(p.id)}">Confirm guest check-in</button>`:v.arrivedAt?['talk','photo'].filter(k=>!r.actions.some(x=>x.personId===p.id&&x.kind===k)).map(k=>`<button class="small ghost" data-h9-act="${k}" data-h9-id="${esc(r.eventId)}" data-h9-person="${esc(p.id)}">${k==='talk'?'Talk':'Ask for photo'}</button>`).join(''):''}</div>`}).join('')||'<p class="muted-text">No known people with verified school affiliation yet.</p>'}</div></details>`:''}</div>`).join('')+
 (listings.length?`<details ${passes.length?'':'open'}><summary>Discover published school public events (${listings.length})</summary>${listings.map(e=>`<div class="mini-meta"><span><b>${esc(schoolDisplayName(e.schoolId))}</b> · ${esc(e.type.replace('school_',''))} · ${formatDate(e.dateISO)} ${timeLabel(e.startMinute)} · ${e.ticketPrice?money(e.ticketPrice):'Free'}</span><button class="small ghost" data-h9-act="register" data-h9-school="${esc(e.schoolId)}" data-h9-type="${esc(e.type)}" data-h9-year="${e.dateISO.slice(0,4)}">Request public visitor pass</button></div>`).join('')}</details>`:'')+`</section>`;
}
function h9Click(b){const d=b?.dataset;if(!d?.h9Act)return false;
 let r={ok:false,reason:'unsupported_action'};
 switch(d.h9Act){case 'register':r=h9Register(d.h9School,d.h9Type,Number(d.h9Year));break;case 'ticket':r=h9Ticket(d.h9Id);break;case 'enter':r=h9CheckIn(d.h9Id);break;case 'leave':r=h9CheckOut(d.h9Id);break;case 'cancel':r=h9Cancel(d.h9Id);break;case 'invite':r=h9GuestInvite(d.h9Id,d.h9Person);break;case 'guest-ticket':r=h9VisitorTicket(d.h9Id,d.h9Person);break;case 'guest-arrive':r=h9VisitorArrive(d.h9Id,d.h9Person);break;case 'talk':case 'photo':r=h9Moment(d.h9Id,d.h9Person,d.h9Act);break;}
 if(!r.ok)toast(`Public school visitor: ${r.reason||'Unavailable'}`);
 save();render();return true;
}
// At foreign school, only a recorded checked-in event pass prevents the standard
// school's timetable reconciler from mistaking the legitimate visitor for an enrollee.
const h9BeforeSchoolReconcile=reconcileSchoolDay4C1;
reconcileSchoolDay4C1=function(reason){
 const active=Object.values(h9State().passes).some(r=>h9ActualPresence(r));
 return active?schoolDayState4C1():h9BeforeSchoolReconcile(reason);
};
const h9BeforeHomePanel=homePanel;
homePanel=function(){const html=h9BeforeHomePanel();return html.replace(/<\/div>\s*$/,h9PublicHtml()+'</div>');};
const h9BeforeSchoolPanel=schoolPanel;
schoolPanel=function(){
 const atAnother=Object.values(h9State().passes).some(r=>h9ActualPresence(r));
 if(atAnother)return `<div class="dashboard">${h9PublicHtml()}</div>`;
 const html=h9BeforeSchoolPanel();return html.replace(/<\/div>\s*$/,h9PublicHtml()+'</div>');
};
const h9BeforePanelClick=handlePanelClick;
handlePanelClick=function(e){const b=e?.target?.closest?.('[data-h9-act]');if(b&&h9Click(b))return;return h9BeforePanelClick(e);};
const h9BeforePromTick=promTick;
promTick=function(){h9BeforePromTick();h9Tick();};

