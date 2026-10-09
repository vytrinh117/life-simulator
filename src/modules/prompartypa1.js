// HF-PA.1 — event-scoped Prom willingness. Complements, never replaces, 6A/6B Prom,
// H3 school visitor authority, H4 relationship stages or H5 outcome ledger.
const PROM_PARTY_PA1_VERSION=1;
function pa1PartyState(){
 if(!S.promPartyWillingnessPA1||typeof S.promPartyWillingnessPA1!=='object'||Array.isArray(S.promPartyWillingnessPA1)) S.promPartyWillingnessPA1={schemaVersion:1,events:{}};
 const s=S.promPartyWillingnessPA1;s.schemaVersion=1;
 if(!s.events||typeof s.events!=='object'||Array.isArray(s.events))s.events={};
 return s;
}
function pa1PartyKey(eventId,personId){return `${eventId}::${personId}`;}
function pa1PartyRecord(eventId,personId){return eventId&&personId?pa1PartyState().events[pa1PartyKey(eventId,personId)]||null:null;}
function pa1PartyApproved(eventId,personId){const x=pa1PartyRecord(eventId,personId);return !!x&&['accepted_full','accepted_limited'].includes(x.status);}
function pa1EventAllows(p,eventId){return !!p&&(!partnerBoundaryH1(p,'noParties')||pa1PartyApproved(eventId,p.id));}
function pa1IsParty(type){return type==='prom'||type==='school_dance';}
function pa1LegacyNeedsConfirmation(pr=S.school?.prom,p=pr?.partnerId&&personById(pr.partnerId)){
 if(!p||!partnerBoundaryH1(p,'noParties')||!pr?.partnerId||pr.partnerId!==p.id)return false;
 const id=promDateEvent6A3(pr),x=pa1PartyRecord(id,p.id);
 return !x||x.status==='needs_confirmation';
}
// Conservative optional migration: never alter a legacy RSVP, romance, tickets or logged answers.
function migratePromPartyPA1(){
 const s=pa1PartyState(),pr=S?.school?.prom,p=pr?.partnerId&&personById(pr.partnerId),id=promDateEvent6A3(pr);
 if(id&&p&&partnerBoundaryH1(p,'noParties')&&!pa1PartyRecord(id,p.id))s.events[pa1PartyKey(id,p.id)]={schemaVersion:1,eventId:id,personId:p.id,status:'needs_confirmation',origin:'unverified_legacy_rsvp',updatedAt:null,history:[]};
 return s;
}
function pa1SetWillingness(eventId,p,status,kind,reason){
 const s=pa1PartyState(),key=pa1PartyKey(eventId,p.id),old=s.events[key];
 if(old&&old.status===status)return old;
 const history=Array.isArray(old?.history)?old.history:[];
 const change={status,action:kind,dateISO:currentDate(),minute:currentMinute(),reason};
 const x={schemaVersion:1,eventId,personId:p.id,status,origin:old?.origin||'npc_event_conversation',updatedAt:{dateISO:currentDate(),minute:currentMinute()},reason,history:[...history,change]};
 s.events[key]=x;return x;
}
function pa1Decision(p,eventId,action){
 if(!p||!eventId||!pa1IsParty(action.type))return {ok:false,reason:'not_a_party_event'};
 const prev=pa1PartyRecord(eventId,p.id),declined=prev?.status==='declined';
 if(declined)return {ok:false,reason:'They already declined this event. Respect their decision.'};
 if(prev&&['accepted_full','accepted_limited'].includes(prev.status))return {ok:false,reason:'Event willingness already confirmed'};
 if(prev?.status==='considering'&&action.kind==='discuss')return {ok:false,reason:'They are considering. You may offer a shorter visit.'};
 if(action.kind==='compromise'&&prev?.status!=='considering'&&prev?.status!=='needs_confirmation')return {ok:false,reason:'Talk about the event before offering a shorter visit'};
 if(p.movedAway||p.deceased)return {ok:false,reason:'Person unavailable'};
 const availability=npcStatusAt(p);if(!availability.free)return {ok:false,reason:availability.why||'They are busy'};
 const trust=Math.max(0,Math.min(100,Number(p.trust)||0)),rel=Math.max(0,Math.min(100,Number(p.rel)||0));
 const roll=hashOf(`${eventId}|${p.id}|pa1|${action.kind}`)%100;
 const cautious=partnerBoundaryH1(p,'noParties');
 let status,reason;
 if(!cautious){status=roll<Math.min(90,35+rel*.35+trust*.2)?'accepted_full':'considering';reason=status==='accepted_full'?'They would enjoy attending this event together.':'They will check their schedule before deciding.';}
 else if(action.kind==='compromise'){
  status=roll<Math.min(72,10+trust*.27+rel*.2)?'accepted_limited':'declined';
  reason=status==='accepted_limited'?'They agree to a short, quieter visit to this specific event, with the option to leave early.':'Even a brief visit feels uncomfortable; they politely decline.';
 }else{
  status=roll<25?'declined':roll<Math.min(45,10+trust*.15+rel*.1)?'accepted_limited':'considering';
  reason=status==='declined'?'They would rather not attend this party.':status==='accepted_limited'?'They explicitly agree to attend only briefly, and may leave early.':'They are not comfortable with a full party; they might consider a shorter visit.';
 }
 const x=pa1SetWillingness(eventId,p,status,action.kind,reason);
 advanceTime(10,{silent:true});
 rememberPerson(p,`Discussed ${action.title||'school event'} plans: ${reason}`,1);
 log('Event plans',`${displayName(p)}: ${reason}`);
 return {ok:true,eventId,personId:p.id,status,reason,willingness:x};
}
function pa1OwnEvent(pr=S.school?.prom){return promDateEvent6A3(pr);}
function pa1DiscussOwn(personId,kind='discuss'){
 const pr=S.school?.prom,p=personById(personId),id=pa1OwnEvent(pr);
 if(!pr||!promDateWindow6A3(pr)||!promDateStudent6A3(p)||!id)return {ok:false,reason:'Prom discussion unavailable'};
 if(pr.partnerId&&pr.partnerId!==p.id)return {ok:false,reason:'Already going with another companion'};
 return pa1Decision(p,id,{kind,type:'prom',title:'your school Prom'});
}
function pa1ExternalSpec(personId,type){
 const p=personById(personId),school=p&&schoolGuestSchoolH3(p);
 if(!p||!school?.known||school.schoolId===playerCurrentSchoolId4A2())return null;
 const year=Number(currentDate().slice(0,4));let spec=schoolGuestHostEventH3(school.schoolId,type,year);
 if(spec?.dateISO<=currentDate())spec=schoolGuestHostEventH3(school.schoolId,type,year+1);
 return spec;
}
function pa1DiscussExternal(personId,type,kind='discuss'){
 const p=personById(personId),spec=pa1ExternalSpec(personId,type);
 if(!p||!isEstablishedPartner(p)||!spec||!pa1IsParty(type))return {ok:false,reason:'Partner event information unavailable'};
 return pa1Decision(p,spec.eventId,{kind,type,title:`${schoolDisplayName(spec.schoolId)} ${type==='prom'?'Prom':'dance'}`});
}
function pa1WillingnessLabel(eventId,p){
 if(!p)return 'Companion unknown';
 const x=pa1PartyRecord(eventId,p.id);
 if(!partnerBoundaryH1(p,'noParties'))return x?.status==='declined'?'Declined this event':'No party preference restriction recorded';
 const labels={needs_confirmation:'Needs confirmation — an older RSVP conflicts with their dislike of parties',considering:'Considering a short visit — NOT confirmed',accepted_limited:'Explicitly agreed: short visit / may leave early',accepted_full:'Agreed to attend this event',declined:'Declined this party — no guest admission'};
 return labels[x?.status]||'Party preference not yet discussed — attendance NOT confirmed';
}
function pa1RelationshipLabel(p){if(!isEstablishedPartner(p))return 'Prom companion'; const g=String(p?.gender||'').toLowerCase();return /^(male|boy|man)$/.test(g)?'Your boyfriend':/^(female|girl|woman)$/.test(g)?'Your girlfriend':'Your partner';}
function pa1CompanionHtml(pr){
 const p=pr?.partnerId&&personById(pr.partnerId),partner=(S.people||[]).find(x=>isEstablishedPartner(x));
 const target=p||partner;if(!target||!promRegistered6A1(pr))return '';
 const eventId=promDateEvent6A3(pr),isCompanion=!!p&&target.id===p.id,legacy=isCompanion&&pa1LegacyNeedsConfirmation(pr,p),w=pa1PartyRecord(eventId,target.id);
 const school=schoolGuestSchoolH3(target),host=schoolGuestHostPromH3(pr),registration=host&&schoolGuestRegistrationH3(host.id,target.id);
 const guest=school.known&&school.schoolId!==pr.foundation6A1?.schoolId;
 const canDiscuss=promDateWindow6A3(pr)&&partnerBoundaryH1(target,'noParties')&&(!w||w.status==='needs_confirmation'||w.status==='considering');
 const stage=isCompanion?(legacy?'Needs confirmation':partnerBoundaryH1(target,'noParties')&&!pa1EventAllows(target,eventId)?'Attendance unconfirmed':`RSVP: ${pr.asFriends?'Going together socially':'Going as a date'}`):'Not yet invited';
 return `<section class="prom-h3-guest prom-pa1-card" data-pa1-companion="${esc(eventId)}"><h4>Companion & admission</h4><p><b>${esc(displayName(target))}</b> · ${esc(pa1RelationshipLabel(target))}</p><p>${esc(stage)} · ${esc(pa1WillingnessLabel(eventId,target))}</p>${legacy?'<p class="prom-h2-warning">Legacy RSVP kept intact. Talk with your partner to verify they truly want this event before requesting visitor admission.</p>':''}<p class="muted-text">Host approval: ${esc(registration?.hostApproval|| (guest?'Not requested':'Not applicable / school status unverified'))} · Guardian: ${esc(registration?.guardianApproval||'Pending if required')} · Visitor ticket: ${esc(registration?.ticket?.covered?'Arranged':'Not arranged')} · Check-in: ${esc(registration?.arrival?'Arrived':'Not checked in')}</p><div class="holiday-acts">${canDiscuss?`<button class="small" data-pa1-action="discuss" data-pa1-person="${esc(target.id)}">Talk about Prom plans</button>${w?.status==='considering'?`<button class="small ghost" data-pa1-action="compromise" data-pa1-person="${esc(target.id)}">Offer a short Prom visit</button>`:''}`:''}</div></section>`;
}
// Keep one H2 candidate list, one 6A RSVP and one H3 visitor card. PA.1 adds
// reconciliation status without converting a social RSVP into friendship.
const pa1BeforePromSummary=promDateSummaryHtml6A3;
promDateSummaryHtml6A3=function(pr){
 const original=pa1BeforePromSummary(pr),p=pr?.partnerId&&personById(pr.partnerId);
 if(!p)return original;
 const role=`${esc(displayName(p))} — ${esc(pa1RelationshipLabel(p))}`;
 const status=pa1LegacyNeedsConfirmation(pr,p)?'Needs confirmation · partner dislikes parties':!pa1EventAllows(p,promDateEvent6A3(pr))?'Attendance NOT confirmed · party declined or still being considered':pr.asFriends?'Attending together socially':'Attending as a date';
 return original.replace(/<p class="muted-text">.*?<\/p>/,`<p class="muted-text">${role} · ${esc(status)}. ${esc(pa1WillingnessLabel(promDateEvent6A3(pr),p))}</p>`);
};
const pa1BeforeH2RSVP=promH2RSVP;
promH2RSVP=function(p,pr){const r=pa1BeforeH2RSVP(p,pr);if(pr?.partnerId===p?.id){
 if(pa1LegacyNeedsConfirmation(pr,p))return {...r,label:'Needs confirmation (legacy RSVP)',reason:'Discuss party willingness before guest admission'};
 if(!pa1EventAllows(p,promDateEvent6A3(pr)))return {...r,label:'Attendance unconfirmed',reason:'Party preference declined or unresolved; previous RSVP preserved'};
 if(isEstablishedPartner(p)&&pr.asFriends)return {...r,label:'Confirmed social companion · still your partner'};
 }return r};
const pa1BeforeH2Row=promH2PersonRow;
promH2PersonRow=function(p,pr,featured=false){
 let html=pa1BeforeH2Row(p,pr,featured);
 if(partnerBoundaryH1(p,'noParties')&&!pa1EventAllows(p,promDateEvent6A3(pr))){
  const replacement=featured?'<span class="prom-h2-pill">Discuss party preference before inviting</span>':`<button class="small ghost" data-pa1-action="discuss" data-pa1-person="${esc(p.id)}">Talk about Prom plans</button>`;
  html=html.replace(/<button class="small" data-prom-ask="[^"]+">Ask to Prom<\/button>/,replacement);
 }
 return html;
};
const pa1BeforePromDateAsk=promDateAsk6A3;
promDateAsk6A3=function(personId,approach){
 const pr=S.school?.prom,p=promDateAskTarget6A3(personId),id=pa1OwnEvent(pr);
 if(p&&partnerBoundaryH1(p,'noParties')){
  if(!pa1EventAllows(p,id))return {ok:false,reason:'Talk about this event first; party preference is not consent.'};
  const v=promDateCanAsk6A3(p,pr);if(!v.ok)return v;
  if(!PROM_APPROACH[approach]||approach==='text'&&!canUsePhone())return {ok:false,reason:'Unavailable approach'};
  const busy=promDateBusyReason6A3(p,pr);if(busy)return {ok:false,reason:busy};
  if(['gift','promposal'].includes(approach)&&!spendOwn(approach==='gift'?8:10))return {ok:false,reason:'insufficient_funds'};
  closeChoiceModal();const mode=isEstablishedPartner(p)?'date':'friends';
  const rec={eventId:id,requestId:`${id}:out:${p.id}`,personId:p.id,dateISO:currentDate(),approach,result:mode==='date'?'Accepted':'Accepted as friends',reason:'Explicit event-specific willingness confirmed',pa1ConsentStatus:pa1PartyRecord(id,p.id).status};
  pr.asked.push(rec);const saved=promDateCommit6A3(pr,p,mode,'event_willingness_pa1');
  if(!saved.ok){rec.result='Rejected';rec.reason=saved.reason;return saved;}
  advanceTime(20);log('Prom plans',`${displayName(p)} confirmed ${mode==='date'?'going together':'going together socially'} after discussing this particular event.`);
  return {ok:true,eventId:id,personId:p.id,result:rec.result,reason:rec.reason};
 }
 return pa1BeforePromDateAsk(personId,approach);
};
const pa1BeforeCommit=promDateCommit6A3;
promDateCommit6A3=function(pr,p,mode,source){
 if(p&&partnerBoundaryH1(p,'noParties')&&!pa1EventAllows(p,promDateEvent6A3(pr)))return {ok:false,reason:'party_willingness_not_confirmed'};
 return pa1BeforeCommit(pr,p,mode,source);
};
const pa1BeforeNpcAsks=npcAsksToProm;
npcAsksToProm=function(p){if(p&&partnerBoundaryH1(p,'noParties')&&!pa1EventAllows(p,pa1OwnEvent()))return null;return pa1BeforeNpcAsks(p)};
const pa1BeforeExternalInvite=schoolGuestExternalInvitationH3;
schoolGuestExternalInvitationH3=function(personId,type='prom'){
 const p=personById(personId),spec=pa1ExternalSpec(personId,type);
 if(pa1IsParty(type)&&p&&partnerBoundaryH1(p,'noParties')&&spec){
  const x=pa1PartyRecord(spec.eventId,p.id);
  if(!x||x.status==='needs_confirmation')return pa1DiscussExternal(personId,type,'discuss');
  if(x.status==='considering')return {ok:false,reason:'Partner is considering: offer a shorter visit first'};
  if(x.status==='declined')return {ok:true,discussion:true,status:'declined',reason:'Partner declined this event; no invitation created',eventId:spec.eventId};
 }
 return pa1BeforeExternalInvite(personId,type);
};
const pa1BeforeApply=schoolGuestApplyH3;
schoolGuestApplyH3=function(personId){
 const pr=S.school?.prom,p=personById(personId);
 if(p&&pr?.partnerId===p.id&&partnerBoundaryH1(p,'noParties')&&!pa1EventAllows(p,pa1OwnEvent(pr)))return {ok:false,reason:'needs_event_willingness_confirmation'};
 return pa1BeforeApply(personId);
};
const pa1BeforeApproveExternal=schoolGuestApproveExternalH3;
schoolGuestApproveExternalH3=function(eventId){
 const e=schoolGuestStateH3().invitations[eventId],p=e&&personById(e.hostPersonId);
 if(e&&p&&pa1IsParty(e.type)&&partnerBoundaryH1(p,'noParties')&&!pa1EventAllows(p,eventId))return {ok:false,reason:'event_willingness_not_confirmed'};
 return pa1BeforeApproveExternal(eventId);
};
const pa1BeforeHostHtml=schoolGuestHostHtmlH3;
schoolGuestHostHtmlH3=function(pr){
 const html=pa1BeforeHostHtml(pr),p=pr?.partnerId&&personById(pr.partnerId);
 if(!p||pa1EventAllows(p,promDateEvent6A3(pr)))return html;
 return html.replace(/Confirmed date, but school visitor approval has not been requested\./,'Social RSVP recorded; visitor admission awaits event confirmation.').replace(/<button class="small" data-h3-action="apply"[^>]*>Request guest admission<\/button>/,'<span class="prom-h2-warning">Visitor request paused until genuine event willingness is confirmed.</span>');
};
const pa1BeforeExternalHtml=schoolGuestInvitationHtmlH3;
schoolGuestInvitationHtmlH3=function(){
 const html=pa1BeforeExternalHtml(),p=(S.people||[]).find(x=>isEstablishedPartner(x)&&!x.movedAway);
 if(!p||!partnerBoundaryH1(p,'noParties'))return html;
 const parts=[];for(const t of ['prom','school_dance']){const spec=pa1ExternalSpec(p.id,t);if(!spec)continue;const x=pa1PartyRecord(spec.eventId,p.id);if(!x)continue;
  parts.push(`<p>${esc(t==='prom'?'Partner-school Prom':'School dance')} · ${esc(pa1WillingnessLabel(spec.eventId,p))}</p>${x.status==='considering'?`<button class="small ghost" data-pa1-action="external-compromise" data-pa1-person="${esc(p.id)}" data-pa1-type="${t}">Offer a short visit</button>`:''}`);
 }
 if(!parts.length)return html;
 return html.replace('</section>',`<div class="prom-pa1-discussions">${parts.join('')}</div></section>`);
};
const pa1BeforePromHtml=promHtml;
promHtml=function(){const html=pa1BeforePromHtml(),pr=S.school?.prom;if(!html||!pr||!promRegistered6A1(pr))return html;return html.replace(/<\/div>\s*$/,pa1CompanionHtml(pr)+'</div>');};
const pa1BeforePromClick=promClick;
promClick=function(b){
 const key=b?.dataset?.pa1Action;if(!key)return pa1BeforePromClick(b);
 const id=b.dataset.pa1Person,kind=key==='compromise'||key==='external-compromise'?'compromise':'discuss';
 const r=key==='external-compromise'?pa1DiscussExternal(id,b.dataset.pa1Type,kind):pa1DiscussOwn(id,kind);
 if(!r.ok)toast(`Prom discussion: ${r.reason}`);
 save();render();return true;
};
const pa1BeforePromTick=promTick;
promTick=function(){pa1BeforePromTick();migratePromPartyPA1()};
// First import/new-life migration is intentionally conservative: it may add
// a needs-confirmation marker, never retroactively accept or cancel an RSVP.
const pa1BeforeMigrate=migrate;
migrate=function(){const result=pa1BeforeMigrate();migratePromPartyPA1();return result;};
