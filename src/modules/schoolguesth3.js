// CROSS-PHASE H3 — verified school guest credentials and partner-hosted event invitations.
// Adapts 6A/6B Prom and 6C calendar/People, without enrolling guests or inventing court votes.
const SCHOOL_GUEST_H3_VERSION=1;
const SCHOOL_GUEST_H3_FINAL=new Set(['Attended','Declined','Missed','Cancelled','Expired']);
function schoolGuestStateH3(){
 if(!S.schoolGuestsH3||typeof S.schoolGuestsH3!=='object'||Array.isArray(S.schoolGuestsH3))S.schoolGuestsH3={schemaVersion:1,registrations:{},invitations:{},inquiries:{}};
 const a=S.schoolGuestsH3;a.schemaVersion=1;
 for(const k of ['registrations','invitations','inquiries'])if(!a[k]||typeof a[k]!=='object'||Array.isArray(a[k]))a[k]={};
 return a;
}
function schoolGuestSchoolH3(p){
 if(!p||!p.npcId)return {known:false,schoolId:null,source:'unverified'};
 const n=npcById(p.npcId);if(!n||!n.currentSchoolId||!schoolById(n.currentSchoolId))return {known:false,schoolId:null,source:'unverified'};
 const observed=personCurrentSchoolInfo4A4(p);
 const inquiry=schoolGuestStateH3().inquiries[p.id];
 if(observed?.known&&observed.schoolId===n.currentSchoolId||inquiry?.schoolId===n.currentSchoolId)
  return {known:true,schoolId:n.currentSchoolId,source:inquiry?.schoolId===n.currentSchoolId?'asked':'school_provenance'};
 return {known:false,schoolId:null,source:'not_yet_disclosed'};
}
function schoolGuestAskSchoolH3(personId){
 const p=personById(personId),st=schoolGuestStateH3();if(!p||isFamilyPerson(p)||p.movedAway)return {ok:false,reason:'person_unavailable'};
 const n=p.npcId&&npcById(p.npcId);
 if(!n||!n.currentSchoolId||!schoolById(n.currentSchoolId))return {ok:false,reason:'school_unverified'};
 if(st.inquiries[p.id]?.schoolId===n.currentSchoolId)return {ok:false,reason:'already_asked'};
 const a=npcStatusAt(p);if(!a.free)return {ok:false,reason:a.why||'person_busy'};
 st.inquiries[p.id]={personId:p.id,schoolId:n.currentSchoolId,askedDate:currentDate(),source:'conversation'};
 advanceTime(10,{silent:true});rememberPerson(p,`You learned that ${firstName(p)} attends ${schoolDisplayName(n.currentSchoolId)}.`,1);
 log('School conversation',`${displayName(p)} tells you about ${schoolDisplayName(n.currentSchoolId)}.`);
 return {ok:true,schoolId:n.currentSchoolId};
}
// Host-school Prom policy: admits invited/registered age-compatible guests, not automatic student status.
function schoolGuestPolicyH3(schoolId,eventType,age){
 const school=schoolById(schoolId);if(!school)return {ok:false,reason:'unverified_host_school'};
 if(!['prom','school_dance','school_show','school_awards','school_concert','graduation'].includes(eventType))return {ok:false,reason:'unsupported_event'};
 if(!Number.isFinite(age)||age<13||age>18)return {ok:false,reason:'guest_age_ineligible'};
 return {ok:true,visitorAreas:['school_show','school_awards','school_concert','graduation'].includes(eventType)?['auditorium','entrance']:['hall','entrance'],needsGuardian:age<18,needsHostApproval:true};
}
function schoolGuestRegKeyH3(eventId,personId){return `${eventId}::${personId}`;}
function schoolGuestRegistrationH3(eventId,personId){return schoolGuestStateH3().registrations[schoolGuestRegKeyH3(eventId,personId)]||null;}
function schoolGuestHostPromH3(pr=S?.school?.prom){
 const id=pr?.foundation6A1?.eventId;
 const ev=id&&(S.calendar||[]).find(x=>x.id===id&&x.type==='prom');
 return ev&&ev.schoolId===pr.foundation6A1.schoolId?ev:null;
}
function schoolGuestApplyH3(personId){
 const pr=S.school?.prom,ev=schoolGuestHostPromH3(pr),p=personById(personId),st=schoolGuestStateH3();
 if(!ev||!p||pr.partnerId!==p.id||!promRegistered6A1(pr)||!pr.dateISO||currentDate()>pr.dateISO)return {ok:false,reason:'no_confirmed_prom_companion'};
 if(p.deceased||p.movedAway||p.notGoingProm||p.promUnavailableDateISO===pr.dateISO)return {ok:false,reason:'companion_unavailable'};
 const s=schoolGuestSchoolH3(p);if(!s.known)return {ok:false,reason:'ask_about_school_first'};
 if(s.schoolId===ev.schoolId)return {ok:false,reason:'host_school_student_not_visitor'};
 const policy=schoolGuestPolicyH3(ev.schoolId,'prom',personAge(p));if(!policy.ok)return policy;
 const key=schoolGuestRegKeyH3(ev.id,p.id),prior=st.registrations[key];if(prior)return {ok:false,reason:'registration_already_exists',record:prior};
 // NPC consent to public festivities and independent life commitments are authoritative.
 if(p.boundaries?.includes('noParties'))return {ok:false,reason:'guest_does_not_want_parties'};
 const approvalRoll=hashOf(ev.id+'|visitor|'+p.id)%100;
 const schoolOK=approvalRoll<(schoolById(ev.schoolId).type==='private'?76:90);
 const parentOK=S.age>=18||personAge(p)>=18||hashOf(ev.id+'|family|'+p.id)%100<85;
 const record={schemaVersion:1,eventId:ev.id,hostSchoolId:ev.schoolId,personId:p.id,affiliationSchoolId:s.schoolId,role:'registered_visitor',status:schoolOK&&parentOK?'Approved':'Denied',rsvp:'Accepted',hostApproval:schoolOK?'Approved':'Denied',guardianApproval:parentOK?'Approved':'Denied',ticket:{required:true,covered:false,payer:null},credential:schoolOK&&parentOK?`GUEST-${hashOf(key+'|pass')}`:null,permittedAreas:policy.visitorAreas,arrival:null,checkout:null,createdAt:{dateISO:currentDate(),minute:currentMinute()},reason:schoolOK&&parentOK?null:!schoolOK?'Host school declined the guest request':'Guest guardian declined permission'};
 st.registrations[key]=record;advanceTime(10,{silent:true});
 log('Prom guest request',record.status==='Approved'?`${displayName(p)} has a school-approved visitor pass for your Prom.`:`Guest request for ${displayName(p)} was declined: ${record.reason}.`);
 return {ok:true,record};
}
function schoolGuestTicketH3(personId){
 const pr=S?.school?.prom,ev=schoolGuestHostPromH3(pr),r=ev&&schoolGuestRegistrationH3(ev.id,personId);
 if(!r||r.status!=='Approved'||r.ticket.covered)return {ok:false,reason:'guest_ticket_unavailable'};
 const price=promH2TicketPrice(pr);if((Number(S.money)||0)<price)return {ok:false,reason:`Guest ticket costs ${money(price)}; insufficient cash`};
 if(!spendOwn(price))return {ok:false,reason:'unable_to_pay'};
 r.ticket={required:true,covered:true,payer:'player',amount:price,paidAt:currentDate()};
 log('Guest Prom ticket',`You paid ${money(price)} for a visitor ticket for ${displayName(personById(personId))}.`);
 return {ok:true,record:r};
}
function schoolGuestRosterH3(pr,roster){
 const p=pr?.partnerId&&personById(pr.partnerId),ev=schoolGuestHostPromH3(pr);
 if(!p||!ev||!roster)return roster;
 const r=schoolGuestRegistrationH3(ev.id,p.id);if(!r)return roster;
 if(r.status==='Approved'&&r.ticket.covered&&r.rsvp==='Accepted'&&!p.notGoingProm&&!p.movedAway&&p.promUnavailableDateISO!==pr.dateISO){
  // External visitor is never injected into attendeeIds: that is the HOST SCHOOL enrolled roster.
  roster.companionId=p.npcId||null;roster.companionStatus='registered_guest';roster.reason=null;
 }else{roster.companionId=null;roster.companionStatus='unavailable';roster.reason=r.reason||(!r.ticket.covered?'Guest ticket required':'Guest approval or RSVP unavailable');}
 return roster;
}
function schoolGuestArriveH3(pr=S?.school?.prom){
 const n=promNightRecord6B1(pr),ev=schoolGuestHostPromH3(pr),r=ev&&schoolGuestRegistrationH3(ev.id,pr.partnerId);
 if(!n||n.status!=='attending'||!r||r.status!=='Approved'||!r.ticket.covered||r.arrival||currentDate()!==n.dateISO)return null;
 const p=personById(r.personId);if(!p||p.movedAway||p.notGoingProm||p.promUnavailableDateISO===n.dateISO)return null;
 r.arrival={dateISO:currentDate(),minute:currentMinute(),entrance:'event entrance',credential:r.credential};r.status='CheckedIn';
 n.companionStatus='present_guest';n.companionId=p.npcId||null;
 log('Prom guest arrived',`${displayName(p)} checks in with a visitor credential; they are not a host-school student.`);
 return r;
}
function schoolGuestCheckOutH3(pr=S?.school?.prom){
 const ev=schoolGuestHostPromH3(pr),r=ev&&schoolGuestRegistrationH3(ev.id,pr.partnerId);
 if(r&&r.arrival&&!r.checkout){r.checkout={dateISO:currentDate(),minute:currentMinute()};r.status='Attended';}return r||null;
}
// School-owned fictional timetable (not a claim about a real institution).
// Event identity is stable per school, type and calendar year, independent of player's Prom date.
function schoolGuestHostEventH3(schoolId,type,year){
 const school=schoolById(schoolId);if(!school||!['prom','school_dance','school_show','school_awards','school_concert','graduation'].includes(type))return null;
 const day=schoolSlug4A2(schoolId)+'|'+type+'|'+year;
 const month=type==='prom'?10:type==='school_dance'?11:type==='school_show'?9:type==='graduation'?5:type==='school_concert'?3:12;
 const start=['school_show','school_awards','school_concert','graduation'].includes(type)?1020:1140;
 let date=isoDate(new Date(Date.UTC(year,month-1,7+(hashOf(day)%20))));
 // Weekend events are a school-sponsored venue, not regular classes.
 const weekday=parseISO(date).getUTCDay();date=addDays(date,(6-weekday+7)%7);
 return {eventId:`h3-school-${schoolSlug4A2(schoolId)}-${type}-${year}`,schoolId,type,dateISO:date,startMinute:start,endMinute:['school_show','school_awards','school_concert','graduation'].includes(type)?1260:1380,entryCutoffMinute:start+60,location:school.name+(['school_show','school_awards','school_concert','graduation'].includes(type)?' Auditorium':' Hall'),visitorPolicy:'invited_guests_with_host_and_guardian_approval'};
}
function schoolGuestExternalInvitationH3(personId,type='prom'){
 const p=personById(personId),st=schoolGuestStateH3();if(!p||isFamilyPerson(p)||!isEstablishedPartner(p)||p.movedAway)return {ok:false,reason:'current_partner_required'};
 const info=schoolGuestSchoolH3(p);if(!info.known)return {ok:false,reason:'ask_about_school_first'};
 if(info.schoolId===playerCurrentSchoolId4A2())return {ok:false,reason:'same_school_use_own_events'};
 const npc=npcById(p.npcId);if(!npc||npc.currentSchoolId!==info.schoolId)return {ok:false,reason:'affiliation_not_verified'};
 if(npcAge(npc)<13||npcAge(npc)>18||personAge(p)<13||personAge(p)>18)return {ok:false,reason:'school_event_age_gate'};
 if(type==='graduation'&&npcEffectiveGradeNumber4A3(npc)!==12)return {ok:false,reason:'graduation_is_for_finishing_students'};
 const curYear=Number(currentDate().slice(0,4));let spec=schoolGuestHostEventH3(info.schoolId,type,curYear);
 if(spec&&spec.dateISO<=currentDate())spec=schoolGuestHostEventH3(info.schoolId,type,curYear+1);
 if(!spec)return {ok:false,reason:'no_school_event'};
 const policy=schoolGuestPolicyH3(spec.schoolId,type,S.age);if(!policy.ok)return policy;
 const prior=st.invitations[spec.eventId];if(prior)return {ok:false,reason:'invitation_already_recorded',invitation:prior};
 if(p.boundaries?.includes('noParties')&&['prom','school_dance'].includes(type))return {ok:false,reason:'partner_declines_parties'};
 const status=npcStatusAt(p);if(!status.free)return {ok:false,reason:status.why||'npc_busy'};
 // School profile is authoritative for affiliation; match availability and consent remain NPC-controlled.
 if(npc.available===false||npc.promUnavailableDateISO===spec.dateISO)return {ok:false,reason:'partner_has_other_commitment'};
 const roll=hashOf(spec.eventId+'|invite|'+p.id)%100;
 if(roll>=Math.min(93,55+(p.rel||0)*.2+(p.trust||50)*.12))return {ok:false,reason:'partner_prefers_not_to_invite'};
 const invite={schemaVersion:1,...spec,hostPersonId:p.id,guestPersonId:'player',rsvp:'Offered',status:'Offered',requestedAt:{dateISO:currentDate(),minute:currentMinute()},guardianApproval:S.age>=18?'NotRequired':'Pending',schoolApproval:'Pending',credential:null,ticket:{price:type==='prom'?40:0,paid:false},permittedAreas:policy.visitorAreas,arrivedAt:null,leftAt:null,activities:[],history:[]};
 st.invitations[spec.eventId]=invite;
 createCalendarEvent({id:spec.eventId,type:'schoolGuestEventH3',title:`${schoolDisplayName(spec.schoolId)} · ${type.replace('school_','')}`,schoolId:spec.schoolId,dateISO:spec.dateISO,startMinute:spec.startMinute,endMinute:spec.endMinute,location:spec.location,status:'Invited',source:'schoolGuestH3',payload:{personId:p.id,guestRole:'external_visitor',eventId:spec.eventId}});
 log('Invitation from partner',`${displayName(p)} invites you to ${spec.location} on ${formatDate(spec.dateISO)}. You may accept or decline.`);
 return {ok:true,invitation:invite};
}
function schoolGuestInviteDecisionH3(eventId,decision){
 const e=schoolGuestStateH3().invitations[eventId],p=e&&personById(e.hostPersonId);
 if(!e||e.status!=='Offered'||!p)return {ok:false,reason:'invitation_not_open'};
 if(!['accept','decline'].includes(decision))return {ok:false,reason:'invalid_decision'};
 const ev=(S.calendar||[]).find(x=>x.id===eventId&&x.type==='schoolGuestEventH3');
 if(!ev||currentDate()>e.dateISO)return {ok:false,reason:'event_expired'};
 e.rsvp=decision==='accept'?'Accepted':'Declined';e.status=decision==='accept'?'PendingApproval':'Declined';e.history.push({action:decision,dateISO:currentDate()});
 setCalendarStatus(ev,decision==='accept'?'Scheduled':'Declined',decision==='accept'?'Awaiting school approval and family permission':'Invitation declined');
 if(decision==='decline')rememberPerson(p,`You declined ${displayName(p)}'s invitation to ${e.location}.`,1);
 return {ok:true,invitation:e};
}
function schoolGuestApproveExternalH3(eventId){
 const e=schoolGuestStateH3().invitations[eventId],p=e&&personById(e.hostPersonId);
 if(!e||e.status!=='PendingApproval'||!p)return {ok:false,reason:'not_awaiting_approval'};
 if(currentDate()>e.dateISO)return {ok:false,reason:'event_expired'};
 const policy=schoolGuestPolicyH3(e.schoolId,e.type,S.age);if(!policy.ok)return policy;
 if(p.movedAway||p.boundaries?.includes('noParties')&&['prom','school_dance'].includes(e.type))return {ok:false,reason:'partner_unavailable'};
 const hostOK=hashOf(eventId+'|approval|player')%100< (schoolById(e.schoolId).type==='private'?76:90);
 const guardianOK=S.age>=18||caregiverApproval(8);
 e.schoolApproval=hostOK?'Approved':'Denied';e.guardianApproval=S.age>=18?'NotRequired':guardianOK?'Approved':'Denied';
 e.status=hostOK&&guardianOK?'Approved':'Denied';e.credential=e.status==='Approved'?`GUEST-${hashOf(eventId+'|player')}`:null;
 e.reason=hostOK&&guardianOK?null:!hostOK?'Host school denied admission':'Caregiver did not grant permission';
 e.history.push({action:'approval',status:e.status,dateISO:currentDate()});
 const ev=(S.calendar||[]).find(x=>x.id===eventId);if(ev)setCalendarStatus(ev,e.status==='Approved'?'Scheduled':'Cancelled',e.reason||'Visitor approved');
 advanceTime(10,{silent:true});return {ok:true,invitation:e};
}
function schoolGuestTicketExternalH3(eventId){
 const e=schoolGuestStateH3().invitations[eventId];if(!e||e.status!=='Approved'||e.ticket.paid)return {ok:false,reason:'ticket_unavailable'};
 const cost=e.ticket.price;if(cost>0&&((Number(S.money)||0)<cost||!spendOwn(cost)))return {ok:false,reason:'insufficient_funds'};
 e.ticket.paid=true;e.ticket.payer=cost?'player':'complimentary';e.ticket.amount=cost;e.ticket.dateISO=currentDate();return {ok:true,invitation:e};
}
function schoolGuestEntryH3(eventId){
 const e=schoolGuestStateH3().invitations[eventId],ev=(S.calendar||[]).find(x=>x.id===eventId),p=e&&personById(e.hostPersonId);
 if(!e||!ev||!p||e.status!=='Approved'||e.rsvp!=='Accepted'||!e.credential)return {ok:false,reason:'no_approved_guest_credential'};
 if(!e.ticket.paid)return {ok:false,reason:'ticket_required'};
 if(currentDate()!==e.dateISO||currentMinute()<e.startMinute||currentMinute()>e.entryCutoffMinute)return {ok:false,reason:'outside_checkin_window'};
 if(S.location!=='Home')return {ok:false,reason:'return_home_before_departure'};
 if(currentMinute()+25>e.entryCutoffMinute)return {ok:false,reason:'travel_too_late'};
 if(p.movedAway||p.deceased||p.promUnavailableDateISO===e.dateISO||p.available===false)return {ok:false,reason:'partner_unavailable'};
 const conflicts=(S.calendar||[]).find(x=>x.id!==eventId&&x.dateISO===e.dateISO&&!isTerminal(x.status)&&['schoolDay','exam','clubSession','plan','workDay'].includes(x.type)&&Number(x.startMinute)<e.endMinute&&Number(x.endMinute)>currentMinute());
 if(conflicts)return {ok:false,reason:'calendar_conflict'};
 advanceTime(25,{silent:true});setPlayerLocation4C1('School',{schoolId:e.schoolId,reason:'Authorized school guest arrival'});
 e.status='Attending';e.arrivedAt={dateISO:currentDate(),minute:currentMinute(),schoolId:e.schoolId,credential:e.credential};
 setCalendarStatus(ev,'Attending','External visitor checked in at authorized entrance');
 log('Visiting partner school',`Checked in at ${e.location} as a registered guest, not an enrolled student.`);
 return {ok:true,invitation:e};
}
function schoolGuestActivityH3(eventId,kind){
 const e=schoolGuestStateH3().invitations[eventId],p=e&&personById(e.hostPersonId);
 if(!e||e.status!=='Attending'||!p||S.location!=='School'||locationSchoolId4C1()!==e.schoolId||currentDate()!==e.dateISO)return {ok:false,reason:'not_present'};
 if(!['talk','photo','dance'].includes(kind)||kind==='dance'&&['school_show','school_awards'].includes(e.type))return {ok:false,reason:'activity_unavailable'};
 if(e.activities.some(x=>x.kind===kind))return {ok:false,reason:'activity_already_done'};
 const cost=kind==='talk'?10:kind==='photo'?12:20;if(currentMinute()+cost>e.endMinute)return {ok:false,reason:'event_closing'};
 let consent=true;
 if(kind==='dance')consent=!p.boundaries?.includes('noPublicAffection')&&hashOf(eventId+'|consent|'+p.id)%100<Math.min(92,42+(p.rel||0)*.3+(p.trust||50)*.2);
 e.activities.push({kind,consent,personId:p.id,dateISO:currentDate(),minute:currentMinute(),minutes:cost});advanceTime(cost,{silent:true});
 if(consent){p.rel=clamp((p.rel||0)+2);p.trust=clamp((p.trust??50)+1);rememberPerson(p,`You ${kind==='talk'?'talked':kind==='photo'?'took a photo':'shared a dance'} together at ${e.location}.`,2);}
 log('Partner school event',consent?`You ${kind==='talk'?'caught up':'photo'===kind?'took a photo':'shared a dance'} with ${displayName(p)}.`:`${displayName(p)} kindly declined to dance.`);
 return {ok:true,consent,eventId,kind};
}
function schoolGuestLeaveH3(eventId,reason='left'){const e=schoolGuestStateH3().invitations[eventId],ev=(S.calendar||[]).find(x=>x.id===eventId);
 if(!e||!ev||e.status!=='Attending')return {ok:false,reason:'not_attending'};
 e.status='Attended';e.leftAt={dateISO:currentDate(),minute:currentMinute(),reason};setCalendarStatus(ev,'Attended','Guest checked out and returned home');
 setPlayerLocation4C1('Home',{reason:'Left host school as a visitor'});advanceTime(25,{silent:true});
 log('School event memory',`You attended ${e.location} and returned home.`);return {ok:true,invitation:e};}
function schoolGuestReconcileH3(){
 const st=schoolGuestStateH3(),today=currentDate();
 for(const e of Object.values(st.invitations)){
  if(!e||SCHOOL_GUEST_H3_FINAL.has(e.status))continue;
  const ev=(S.calendar||[]).find(x=>x.id===e.eventId);
  if(e.status==='Attending'&&(today>e.dateISO||today===e.dateISO&&currentMinute()>=e.endMinute)){schoolGuestLeaveH3(e.eventId,'event_ended');continue;}
  if(today>e.dateISO||today===e.dateISO&&currentMinute()>e.entryCutoffMinute){e.status=e.rsvp==='Declined'?'Declined':'Missed';e.history.push({action:'expired',dateISO:today});if(ev&&!isTerminal(ev.status))setCalendarStatus(ev,'Missed','Guest did not check in');}
 }
}
function schoolGuestNpcTickH3(){
 const st=schoolGuestStateH3(),today=currentDate();if(st.lastNpcDay===today)return;st.lastNpcDay=today;
 if(S.age<13||S.age>18)return;
 const partner=(S.people||[]).find(p=>isEstablishedPartner(p)&&p.npcId&&!p.movedAway);
 if(!partner||!schoolGuestSchoolH3(partner).known||schoolGuestSchoolH3(partner).schoolId===playerCurrentSchoolId4A2())return;
 if(hashOf(today+'|guest-invite|'+partner.id)%100>=10)return;
 schoolGuestExternalInvitationH3(partner.id,'prom');
}
function schoolGuestHostHtmlH3(pr=S?.school?.prom){
 const p=pr?.partnerId&&personById(pr.partnerId),ev=schoolGuestHostPromH3(pr);if(!p||!ev)return '';
 const s=schoolGuestSchoolH3(p);if(!s.known)return `<div class="prom-h3-guest"><h5>Guest admission</h5><p>School affiliation is not yet verified for ${esc(displayName(p))}. RSVP alone does not grant entry.</p><button class="small" data-h3-action="inquire" data-h3-person="${esc(p.id)}">Ask about their school</button></div>`;
 if(s.schoolId===ev.schoolId)return '';
 const r=schoolGuestRegistrationH3(ev.id,p.id);const row=r?`<p>${esc(r.status)} · Host approval: ${esc(r.hostApproval)} · Guardian: ${esc(r.guardianApproval)} · Guest ticket: ${r.ticket.covered?'Paid':'Not arranged'}</p>${r.reason?`<small>${esc(r.reason)}</small>`:''}`:'<p>Confirmed date, but school visitor approval has not been requested.</p>';
 return `<div class="prom-h3-guest" data-h3-host="${esc(ev.id)}"><h5>Outside-school Prom guest</h5><p>${esc(displayName(p))} · ${esc(schoolDisplayName(s.schoolId))} · separate visitor credential required.</p>${row}${!r?`<button class="small" data-h3-action="apply" data-h3-person="${esc(p.id)}">Request guest admission</button>`:r.status==='Approved'&&!r.ticket.covered?`<button class="small" data-h3-action="guest-ticket" data-h3-person="${esc(p.id)}">Buy guest ticket · ${money(promH2TicketPrice(pr))}</button>`:''}</div>`;
}
function schoolGuestInvitationHtmlH3(){
 const st=schoolGuestStateH3(),partner=(S.people||[]).find(p=>isEstablishedPartner(p)&&p.npcId&&!p.movedAway);
 const known=partner&&schoolGuestSchoolH3(partner),external=partner&&known?.known&&known.schoolId!==playerCurrentSchoolId4A2();
 const pending=Object.values(st.invitations).filter(x=>x&&x.dateISO>=currentDate()&&!SCHOOL_GUEST_H3_FINAL.has(x.status)).sort((a,b)=>a.dateISO.localeCompare(b.dateISO));
 if(!external&&!pending.length)return '';
 return `<section class="card wide schoolguest-h3" data-h3-section="1"><h3>Partner's school events</h3><p class="muted-text">Guest entry is distinct from attending your own school. Invitations require RSVP, school permission, guardian consent where applicable, and a ticket if priced.</p>`+
 (external?`<p><b>${esc(displayName(partner))}</b> · ${esc(schoolDisplayName(known.schoolId))}</p><div class="holiday-acts"><button class="small ghost" data-h3-action="invite" data-h3-person="${esc(partner.id)}" data-h3-type="prom">Ask about their Prom</button><button class="small ghost" data-h3-action="invite" data-h3-person="${esc(partner.id)}" data-h3-type="school_show">Ask about school show</button><button class="small ghost" data-h3-action="invite" data-h3-person="${esc(partner.id)}" data-h3-type="school_awards">Ask about awards night</button><button class="small ghost" data-h3-action="invite" data-h3-person="${esc(partner.id)}" data-h3-type="school_dance">Ask about school dance</button><button class="small ghost" data-h3-action="invite" data-h3-person="${esc(partner.id)}" data-h3-type="school_concert">Ask about school concert</button></div>`:partner&&!known.known?`<button class="small" data-h3-action="inquire" data-h3-person="${esc(partner.id)}">Ask ${esc(firstName(partner))} about their school</button>`:'')+
 pending.map(e=>`<div class="prom-h3-guest" data-h3-invite="${esc(e.eventId)}"><b>${esc(e.location)}</b><p>${formatDate(e.dateISO)} · ${timeLabel(e.startMinute)} · ${esc(e.status)} · ${esc(schoolDisplayName(e.schoolId))}</p>${e.reason?`<small>${esc(e.reason)}</small>`:''}<div class="holiday-acts">`+
 (e.status==='Offered'?`<button class="small" data-h3-action="accept" data-h3-id="${esc(e.eventId)}">Accept invitation</button><button class="small ghost" data-h3-action="decline" data-h3-id="${esc(e.eventId)}">Decline</button>`:'')+
 (e.status==='PendingApproval'?`<button class="small" data-h3-action="approve" data-h3-id="${esc(e.eventId)}">Request school & guardian approval</button>`:'')+
 (e.status==='Approved'&&!e.ticket.paid?`<button class="small" data-h3-action="ticket" data-h3-id="${esc(e.eventId)}">Arrange ${e.ticket.price?money(e.ticket.price):'free'} guest ticket</button>`:'')+
 (e.status==='Approved'&&e.ticket.paid?`<p>Visitor credential ${esc(e.credential)} · Event areas: ${esc(e.permittedAreas.join(', '))}</p><button class="small" data-h3-action="enter" data-h3-id="${esc(e.eventId)}">Travel & check in</button>`:'')+
 (['PendingApproval','Approved'].includes(e.status)?`<button class="small ghost" data-h3-action="cancel" data-h3-id="${esc(e.eventId)}">Cancel RSVP</button>`:'')+
 (e.status==='Attending'?`<p>Checked in at ${esc(e.location)} · Visitor areas only</p>${['talk','photo',...(['prom','school_dance'].includes(e.type)?['dance']:[])].filter(a=>!e.activities.some(v=>v.kind===a)).map(a=>`<button class="small ghost" data-h3-action="${a}" data-h3-id="${esc(e.eventId)}">${a==='talk'?'Talk together':a==='photo'?'Take photo':'Ask to dance'}</button>`).join('')}<button class="small" data-h3-action="leave" data-h3-id="${esc(e.eventId)}">Check out / Go Home</button>`:'')+
 `</div></div>`).join('')+`</section>`;
}
function schoolGuestClickH3(b){
 const d=b?.dataset;if(!d?.h3Action)return false;
 let r={ok:false,reason:'invalid_action'};
 switch(d.h3Action){
  case 'inquire':r=schoolGuestAskSchoolH3(d.h3Person);break;
  case 'apply':r=schoolGuestApplyH3(d.h3Person);break;
  case 'guest-ticket':r=schoolGuestTicketH3(d.h3Person);break;
  case 'invite':r=schoolGuestExternalInvitationH3(d.h3Person,d.h3Type);break;
  case 'accept':case 'decline':r=schoolGuestInviteDecisionH3(d.h3Id,d.h3Action);break;
  case 'approve':r=schoolGuestApproveExternalH3(d.h3Id);break;
  case 'ticket':r=schoolGuestTicketExternalH3(d.h3Id);break;
  case 'cancel':r=schoolGuestCancelH3(d.h3Id);break;
  case 'enter':r=schoolGuestEntryH3(d.h3Id);break;
  case 'talk':case 'photo':case 'dance':r=schoolGuestActivityH3(d.h3Id,d.h3Action);break;
  case 'leave':r=schoolGuestLeaveH3(d.h3Id);break;
 }
 if(!r?.ok)toast(`School event: ${r?.reason||'Unavailable'}`);
 save();render();return true;
}
// Adapt the EXISTING Prom roster, scene and game navigation, not competing student attendance.
const schoolGuestOriginalRosterH3=promNightRoster6B1;
promNightRoster6B1=function(pr){return schoolGuestRosterH3(pr,schoolGuestOriginalRosterH3(pr))};
const schoolGuestOriginalEnterPromH3=enterPromNight6B1;
enterPromNight6B1=function(){const result=schoolGuestOriginalEnterPromH3();if(result?.ok)schoolGuestArriveH3();return result};
const schoolGuestOriginalLeavePromH3=leavePromNight6B1;
leavePromNight6B1=function(reason){schoolGuestCheckOutH3();return schoolGuestOriginalLeavePromH3(reason)};
const schoolGuestOriginalPromH2=promHtml;
promHtml=function(){const html=schoolGuestOriginalPromH2();return html&&S.school?.prom?.partnerId?html.replace(/<\/div>\s*$/,schoolGuestHostHtmlH3(S.school.prom)+'</div>'):html};
const schoolGuestOriginalPromClickH3=promClick;
promClick=function(b){if(schoolGuestClickH3(b))return true;return schoolGuestOriginalPromClickH3(b)};
const schoolGuestOriginalHomeH3=promUiHomeHtml6A6;
promUiHomeHtml6A6=function(){return schoolGuestOriginalHomeH3()+schoolGuestInvitationHtmlH3()};
const schoolGuestOriginalSchoolH3=promUiSchoolHtml6A6;
promUiSchoolHtml6A6=function(){return schoolGuestOriginalSchoolH3()+(!promUiEligibleEvent6A6()?schoolGuestInvitationHtmlH3():'')};
const schoolGuestOriginalPromTickH3=promTick;
promTick=function(){schoolGuestOriginalPromTickH3();schoolGuestReconcileH3();schoolGuestNpcTickH3()};
// Verified visitor moments at the PLAYER'S school Prom are separate from the 6B
// enrolled-student activity ledger, but share its canonical eventId and actual check-in.
function schoolGuestHostMomentH3(kind){
 const pr=S?.school?.prom,night=promNightRecord6B1(pr),ev=schoolGuestHostPromH3(pr),r=ev&&schoolGuestRegistrationH3(ev.id,pr.partnerId),p=r&&personById(r.personId);
 if(!night||night.status!=='attending'||!r||r.status!=='CheckedIn'||!r.arrival||!p||S.location!=='School'||locationSchoolId4C1()!==r.hostSchoolId)return {ok:false,reason:'external_guest_not_present'};
 if(currentDate()!==night.dateISO||currentMinute()>=night.endMinute)return {ok:false,reason:'event_closed'};
 if(!['talk','photo','dance'].includes(kind))return {ok:false,reason:'unknown_activity'};
 r.moments=r.moments||[];
 if(r.moments.some(x=>x.kind===kind))return {ok:false,reason:'already_shared_this_moment'};
 const cost=kind==='dance'?20:kind==='photo'?12:10;
 if(currentMinute()+cost>night.endMinute)return {ok:false,reason:'not_enough_time'};
 const consent=kind!=='dance'||!partnerBoundaryH1(p,'noPublicAffection')&&hashOf(ev.id+'|guest_dance|'+p.id)%100<Math.min(94,35+(p.rel||0)*.35+(p.trust||50)*.23);
 r.moments.push({kind,accepted:consent,dateISO:currentDate(),minute:currentMinute(),cost});
 advanceTime(cost,{silent:true});
 if(consent){p.rel=clamp((p.rel||0)+2);p.trust=clamp((p.trust??50)+1);rememberPerson(p,`You ${kind==='talk'?'caught up':kind==='photo'?'took a couple photo':'danced'} with your visiting partner at your school's Prom.`,2)}
 log('Prom guest moment',consent?`Shared a ${kind} moment with ${displayName(p)}.`:`${displayName(p)} politely declined the dance.`);
 return {ok:true,eventId:ev.id,consent,kind};
}
function schoolGuestHostMomentsHtmlH3(){
 const pr=S?.school?.prom,ev=schoolGuestHostPromH3(pr),r=ev&&schoolGuestRegistrationH3(ev.id,pr.partnerId),night=promNightRecord6B1(pr),p=r&&personById(r.personId);
 if(!r||!night||night.status!=='attending'||!r.arrival||!p)return '';
 const done=new Set((r.moments||[]).map(m=>m.kind));
 return `<div class="prom-h3-guest" data-h3-guest-moments="${esc(ev.id)}"><h5>Your visiting companion</h5><p>${esc(displayName(p))} checked in with an event-only visitor pass. They cannot vote in the host-school Prom Court.</p><div class="holiday-acts">${[['talk','Talk together'],['photo','Take couple photo'],['dance','Ask to dance']].filter(([key])=>!done.has(key)).map(([key,label])=>`<button class="small ghost" data-h3-action="host-${key}">${label}</button>`).join('')}</div></div>`;
}
const schoolGuestBeforeNightHtmlH3=promNightHtml6B1;
promNightHtml6B1=function(pr){const html=schoolGuestBeforeNightHtmlH3(pr);return html+schoolGuestHostMomentsHtmlH3()};
const schoolGuestBeforeClickH3=promClick;
promClick=function(b){if(b?.dataset?.h3Action?.startsWith('host-')){
 const res=schoolGuestHostMomentH3(b.dataset.h3Action.slice(5));if(!res.ok)toast(`Guest moment: ${res.reason}`);save();render();return true;
 }return schoolGuestBeforeClickH3(b)};

function schoolGuestCancelH3(eventId){
 const e=schoolGuestStateH3().invitations[eventId],cal=(S.calendar||[]).find(x=>x.id===eventId);
 if(!e||!['PendingApproval','Approved'].includes(e.status)||currentDate()>e.dateISO)return {ok:false,reason:'cancellation_not_available'};
 const refund=e.ticket?.paid&&e.ticket?.payer==='player'&&!e.ticket?.refundedAmount?e.ticket.amount||0:0;
 if(refund){S.money+=refund;e.ticket.refundedAmount=refund;e.ticket.refundedAt=currentDate()}
 e.status='Cancelled';e.rsvp='Cancelled';e.credential=null;
 e.history.push({action:'cancel',dateISO:currentDate(),minute:currentMinute(),refund});
 if(cal&&!isTerminal(cal.status))setCalendarStatus(cal,'Cancelled','Visitor RSVP cancelled before check-in');
 log('School invitation cancelled',`Your reservation at ${e.location} was cancelled${refund?' and the ticket refunded':''}.`);
 return {ok:true,invitation:e};
}
const schoolGuestPreviousDateCancelH3=promCancelDate6A3;
promCancelDate6A3=function(){
 const pr=S?.school?.prom,oldId=pr?.partnerId,ev=schoolGuestHostPromH3(pr);
 const result=schoolGuestPreviousDateCancelH3();
 if(result?.ok&&oldId&&ev){const r=schoolGuestRegistrationH3(ev.id,oldId);
  if(r&&['Approved','CheckedIn'].includes(r.status)&&!r.arrival){r.status='Cancelled';r.reason='Player cancelled or changed Prom companion';r.credential=null;}}
 return result;
};
// 6B.3 arrival exposes the verified visitor honestly without enrolling them.
const schoolGuestPreviousArrivalCompanionH3=promArrivalCompanion6B3;
promArrivalCompanion6B3=function(pr,a){
 const ev=schoolGuestHostPromH3(pr),r=ev&&schoolGuestRegistrationH3(ev.id,pr?.partnerId);
 if(r?.status==='CheckedIn'&&r.arrival&&r.eventId===a?.eventId&&personById(r.personId))
  return {personId:r.personId,npcId:personById(r.personId).npcId||null,status:'visitor_present',reason:'Authorized visitor, not an enrolled student'};
 return schoolGuestPreviousArrivalCompanionH3(pr,a);
};
