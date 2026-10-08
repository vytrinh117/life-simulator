// =====================================================================
// PHASE 3C.1 — Device Access + Contact Exchange + Communication Eligibility
// Extends the existing inventory-backed phone and person-ID chat model.
// No new inbox/call lifecycle is introduced here; later 3C checkpoints own that.
// =====================================================================
const COMM3C1_VERSION=1;
const COMM3C1_CONTACT_LIMIT=180;

function ensureCommunication3C1(){
 S.communication=S.communication&&typeof S.communication==='object'?S.communication:{};
 S.communication.version=Number(S.communication.version)||0;
 S.communication.contacts=S.communication.contacts&&typeof S.communication.contacts==='object'&&!Array.isArray(S.communication.contacts)?S.communication.contacts:{};
 S.communication.firstDeviceAt=S.communication.firstDeviceAt&&typeof S.communication.firstDeviceAt==='object'?S.communication.firstDeviceAt:{};
 S.communication.npcOfferAfter=S.communication.npcOfferAfter&&typeof S.communication.npcOfferAfter==='object'?S.communication.npcOfferAfter:{};
 return S.communication
}
function communicationItemDate3C1(it){return it?.acquiredDate||null}
function usableSmartphone3C1(){return canUsePhone()?activePhoneItem():null}
function usableKidsWatch3C1(){const it=findUsable('kidsWatch');if(!it)return null;const min=D.catalog?.kidsWatch?.minAge??5;return S.age>=min?it:null}
function communicationDeviceAccess3C1(){
 const phone=usableSmartphone3C1(),watch=usableKidsWatch3C1();
 return {
  smartphone:phone?{itemId:phone.id,name:phone.name,deviceType:'smartphone',message:true,call:true,video:true}:null,
  kidsWatch:watch?{itemId:watch.id,name:watch.name,deviceType:'kidsWatch',message:true,call:true,video:false,restricted:true}:null,
  hasAny:!!(phone||watch)
 }
}
function communicationDeviceDate3C1(kind){
 ensureCommunication3C1();const d=S.communication.firstDeviceAt?.[kind];if(d)return d;
 const items=kind==='smartphone'?phoneItems():S.inventoryItems.filter(i=>i.key==='kidsWatch');
 return items.map(communicationItemDate3C1).filter(Boolean).sort()[0]||null
}
function markFirstDeviceDate3C1(kind,dateISO=currentDate()){
 const c=ensureCommunication3C1();if(!c.firstDeviceAt[kind]||dateISO<c.firstDeviceAt[kind])c.firstDeviceAt[kind]=dateISO
}
function isImmediateFamilyContact3C1(p){if(!p||!isFamilyPerson(p))return false;const r=p.relation||'';return ['mother','father','parent','guardian','sibling','child'].includes(r)||['parent','guardian','older sibling','younger sibling','sibling','child'].includes(p.role)}
function contactRecord3C1(pOrId){const id=typeof pOrId==='string'?pOrId:pOrId?.id;if(!id)return null;return ensureCommunication3C1().contacts[id]||null}
function normalizeContact3C1(r,id){
 if(!r||typeof r!=='object')r={};r.personId=id||r.personId;r.status=['active','blocked','removed'].includes(r.status)?r.status:'active';r.source=r.source||'exchange';r.exchangedDate=r.exchangedDate||currentDate();r.exchangedMinute=Number.isFinite(Number(r.exchangedMinute))?Number(r.exchangedMinute):0;r.initiatedBy=r.initiatedBy||'unknown';r.channels=[...new Set((Array.isArray(r.channels)?r.channels:[]).filter(x=>['message','call','video'].includes(x)))];r.blocked=r.status==='blocked'||r.blocked===true;r.removed=r.status==='removed'||r.removed===true;return r
}
function defaultContactChannels3C1(p,source='exchange'){
 if(source==='family'&&usableKidsWatch3C1()&&!usableSmartphone3C1())return ['message','call'];
 return ['message','call','video']
}
function addContact3C1(pOrId,{source='exchange',initiatedBy='player',channels=null,dateISO=currentDate(),minute=currentMinute(),approvedForWatch=false,legacy=false}={}){
 const p=typeof pOrId==='string'?personById(pOrId):pOrId;if(!p)return null;const c=ensureCommunication3C1(),raw=c.contacts[p.id],old=raw?normalizeContact3C1(raw,p.id):null,wasActive=!!old&&old.status==='active';
 const r=old||{};r.personId=p.id;r.status='active';r.blocked=false;r.removed=false;r.source=wasActive?r.source:source;r.exchangedDate=wasActive?r.exchangedDate:dateISO;r.exchangedMinute=wasActive?r.exchangedMinute:minute;r.initiatedBy=wasActive?r.initiatedBy:initiatedBy;r.channels=[...new Set([...(r.channels||[]),...(channels||defaultContactChannels3C1(p,source))])];r.approvedForWatch=!!(r.approvedForWatch||approvedForWatch||source==='family');r.legacy=!!(r.legacy||legacy);c.contacts[p.id]=normalizeContact3C1(r,p.id);return c.contacts[p.id]
}
function removeInvalidContactRefs3C1(){const c=ensureCommunication3C1(),ids=Object.keys(c.contacts);if(ids.length<=COMM3C1_CONTACT_LIMIT)return;const keep=ids.filter(id=>personById(id));for(const id of ids)if(!keep.includes(id))delete c.contacts[id]}
function ensureFamilyContacts3C1(){
 const access=communicationDeviceAccess3C1();if(!access.hasAny)return;for(const p of S.people||[])if(isImmediateFamilyContact3C1(p))addContact3C1(p,{source:'family',initiatedBy:'family',approvedForWatch:true,channels:access.smartphone?['message','call','video']:['message','call']})
}
function earliestLegacyCommDate3C1(){
 const ds=[];for(const c of Object.values(S.chats||{}))for(const m of c?.msgs||[])if(m.dateISO)ds.push(m.dateISO);for(const m of S.messages||[])if(m.dateISO)ds.push(m.dateISO);return ds.sort()[0]||null
}
function existingCommunicationIds3C1(){
 const out=new Set();for(const [id,c] of Object.entries(S.chats||{}))if(personById(id)&&(c?.msgs||[]).length)out.add(id);for(const m of S.messages||[]){const id=m.fromId||m.toId;if(id&&personById(id))out.add(id)}return [...out]
}
function migrateCommunication3C1(){
 const c=ensureCommunication3C1();const access=communicationDeviceAccess3C1();
 if(c.version<COMM3C1_VERSION){
  const legacyDate=earliestLegacyCommDate3C1();
  if(access.smartphone){const d=communicationDeviceDate3C1('smartphone')||legacyDate||currentDate();markFirstDeviceDate3C1('smartphone',legacyDate&&legacyDate<d?legacyDate:d)}
  if(access.kidsWatch){const d=communicationDeviceDate3C1('kidsWatch')||currentDate();markFirstDeviceDate3C1('kidsWatch',d)}
  // Existing message/chat evidence may establish a legacy contact only when a valid
  // communication device already exists in this save. We never synthesize messages.
  if(access.hasAny)for(const id of existingCommunicationIds3C1()){const p=personById(id);if(p)addContact3C1(p,{source:'legacy',initiatedBy:'legacy',dateISO:legacyDate||currentDate(),legacy:true,approvedForWatch:isImmediateFamilyContact3C1(p)})}
  c.version=COMM3C1_VERSION;c.migratedDate=c.migratedDate||currentDate()
 }
 // Detect a newly acquired device without backdating it. This prevents old dormant
 // chat data from becoming a fabricated pre-device backlog later.
 if(access.smartphone&&!c.firstDeviceAt.smartphone)markFirstDeviceDate3C1('smartphone',communicationDeviceDate3C1('smartphone')||currentDate());
 if(access.kidsWatch&&!c.firstDeviceAt.kidsWatch)markFirstDeviceDate3C1('kidsWatch',communicationDeviceDate3C1('kidsWatch')||currentDate());
 for(const [id,r] of Object.entries(c.contacts))c.contacts[id]=normalizeContact3C1(r,id);ensureFamilyContacts3C1();removeInvalidContactRefs3C1();return c
}
function contactChannelKnown3C1(p,channel){const r=contactRecord3C1(p);return !!r&&r.status==='active'&&!r.blocked&&!r.removed&&(r.channels||[]).includes(channel)}
function communicationEligibility3C1(pOrId,channel='message'){
 const schoolGate=typeof schoolDeviceUseGate4C3==='function'?schoolDeviceUseGate4C3(channel):{ok:true};if(!schoolGate.ok)return {ok:false,reason:schoolGate.reason};
 const p=typeof pOrId==='string'?personById(pOrId):pOrId;if(!p)return {ok:false,reason:'That person is no longer available.'};migrateCommunication3C1();const r=contactRecord3C1(p);if(!r||r.status!=='active'||r.blocked||r.removed)return {ok:false,reason:isFamilyPerson(p)?'A communication contact is not available on your current device.':'You have not exchanged contact details with them yet.'};if(!(r.channels||[]).includes(channel))return {ok:false,reason:`That contact is not available for ${channel}.`};const a=communicationDeviceAccess3C1();
 if(a.smartphone)return {ok:true,device:'smartphone',itemId:a.smartphone.itemId,contact:r};
 if(a.kidsWatch&&r.approvedForWatch&&['message','call'].includes(channel))return {ok:true,device:'kidsWatch',itemId:a.kidsWatch.itemId,contact:r};
 return {ok:false,reason:phoneLockReason()||'You do not have a compatible communication device available.'}
}
function canDirectCommunicate3C1(pOrId,channel='message'){return communicationEligibility3C1(pOrId,channel).ok}
function contactExchangeEligibility3C1(pOrId){
 const p=typeof pOrId==='string'?personById(pOrId):pOrId;if(!p)return {ok:false,reason:'Person not found.'};migrateCommunication3C1();if(isFamilyPerson(p)){ensureFamilyContacts3C1();return {ok:true,already:!!contactRecord3C1(p),family:true}};const old=contactRecord3C1(p);if(old?.status==='active'&&!old.blocked&&!old.removed)return {ok:true,already:true};if(!usableSmartphone3C1())return {ok:false,reason:phoneLockReason()||'You need a usable smartphone before exchanging normal phone contact details.'};if((p.conflict||0)>=75)return {ok:false,reason:'There is too much conflict between you right now.'};return {ok:true,already:false}
}
function contactExchangeContext3C1(p){return {kind:'contactExchange',friendTier:friendTier(p)||'Acquaintance',trustBand:Math.floor((p.trust||50)/10),conflictBand:Math.floor((p.conflict||0)/15),lifeStage:S.age<18?'teen':'adult'}}
function contactExchangeScore3C1(p){const tr=p.traits||[],social=tr.includes('Social')||tr.includes('Outgoing')?10:0,shy=tr.includes('Shy')||tr.includes('Quiet')?-7:0,rom=typeof ensureLove==='function'?ensureLove(p):null,interest=rom?.mutual||rom?.npcInterest==='reciprocates'?10:0;return clamp(12+(p.rel||0)*.42+(p.trust||50)*.28-(p.conflict||0)*.42+social+shy+interest,5,94)}
function exchangeContact3C1(personId){
 const p=personById(personId),gate=contactExchangeEligibility3C1(p);if(!p||!gate.ok){toast(gate?.reason||'Cannot exchange contact right now.');return null}if(gate.already){toast('You already have their contact.');return contactRecord3C1(p)}
 const ctx=contactExchangeContext3C1(p),prior=findDecision('contactExchange',p.id,ctx,p.id);if(prior){log('Contact request',prior.reason);return prior.outcome==='Accepted'?contactRecord3C1(p):prior}
 const score=contactExchangeScore3C1(p),roll=Math.random()*100;let outcome,reason,reconsiderAfter=null;if(roll<score){outcome='Accepted';reason=`${firstName(p)} agrees to exchange contact details.`}else if(roll<Math.min(100,score+18)){outcome='Maybe';reason=`${firstName(p)} says, "Maybe later?"`;reconsiderAfter=addDays(currentDate(),4)}else{outcome='Declined';reason=`${firstName(p)} would rather not exchange contact details right now.`;reconsiderAfter=addDays(currentDate(),10)}
 const rec=recordDecision({requestType:'contactExchange',targetKey:p.id,decisionMakerId:p.id,context:ctx,outcome,reason,reconsiderAfter,resolved:true});advanceTime(5,{silent:true});if(outcome==='Accepted'){addContact3C1(p,{source:'exchange',initiatedBy:'player'});rememberPerson(p,'You exchanged contact details.',2);log('Contact exchanged',`${firstName(p)} is now in your contacts.`)}else log('Contact request',reason);return rec
}
function maybeNpcContactExchange3C1(){
 if(SIM.skipping||!usableSmartphone3C1())return false;const c=ensureCommunication3C1(),cand=(S.people||[]).filter(p=>!isFamilyPerson(p)&&!p.movedAway&&!contactRecord3C1(p)&&tierRank(p)>=2&&(p.trust||0)>=50&&(p.conflict||0)<45).filter(p=>!c.npcOfferAfter[p.id]||currentDate()>=c.npcOfferAfter[p.id]).sort((a,b)=>(b.rel+b.trust)-(a.rel+a.trust));if(!cand.length)return false;const p=cand[0],tr=p.traits||[],rate=tr.includes('Bold')||tr.includes('Social')?13:tr.includes('Shy')||tr.includes('Quiet')?4:8;if(!chance(rate))return false;c.npcOfferAfter[p.id]=addDays(currentDate(),14);queueEvent({type:'contactExchangeOffer',title:`${displayName(p)} wants to exchange contact details`,text:`${firstName(p)} asks if you want to exchange numbers so you can keep in touch.`,participants:[p.id],payload:{personId:p.id},priority:2,expiresDays:2,choices:[{id:'accept',label:'Exchange contacts'},{id:'later',label:'Maybe later'},{id:'decline',label:'Decline'}]});return true
}
function communication3C1EventChoice(e,id){if(e.type!=='contactExchangeOffer')return false;const p=personById(e.payload?.personId||e.participants?.[0]);if(!p)return true;const c=ensureCommunication3C1();if(id==='accept'){addContact3C1(p,{source:'exchange',initiatedBy:'npc'});rememberPerson(p,'You exchanged contact details.',2);log('Contact exchanged',`${firstName(p)} is now in your contacts.`)}else{c.npcOfferAfter[p.id]=addDays(currentDate(),id==='later'?7:21);log(id==='later'?'Maybe later':'Contact exchange declined',id==='later'?`You tell ${firstName(p)} maybe another time.`:`You decide not to exchange contact details with ${firstName(p)}.`)}return true}
function contactStatusText3C1(p){const r=contactRecord3C1(p);if(r?.status==='blocked')return 'Blocked';if(r?.status==='removed')return 'Contact removed';if(r?.status==='active')return 'Contact saved';return 'No contact exchanged'}
function directContactButtons3C1(p){
 migrateCommunication3C1();const bits=[];if(canDirectCommunicate3C1(p,'message'))bits.push(`<button data-person-action="message" data-person-id="${p.id}">Message</button>`);if(canDirectCommunicate3C1(p,'call'))bits.push(`<button data-person-action="call" data-person-id="${p.id}">Call</button>`);if(usableSmartphone3C1()&&canDirectCommunicate3C1(p,'video'))bits.push(`<button data-person-action="videoCall" data-person-id="${p.id}">Video call</button>`);const g=contactExchangeEligibility3C1(p);if(!isFamilyPerson(p)&&!g.already&&g.ok)bits.push(`<button data-contact-exchange="${p.id}">Exchange contact</button>`);if(typeof watchContactActionHtml3C3==='function'){const w=watchContactActionHtml3C3(p);if(w)bits.push(w)}return bits.join('')
}
function contactActionHtml3C1(p){const r=contactRecord3C1(p),g=contactExchangeEligibility3C1(p),w=typeof watchContactActionHtml3C3==='function'?watchContactActionHtml3C3(p):'';if(r?.status==='active')return `<span class="tag ok">${r.approvedForWatch&&!usableSmartphone3C1()?'Smartwatch contact':'Contact saved'}</span>${w}`;if(w)return w;if(!isFamilyPerson(p)&&g.ok)return `<button class="small ghost" data-contact-exchange="${p.id}">Exchange contact</button>`;return ''}
function communication3C1Click(b){const d=b.dataset;if(d.contactExchange){exchangeContact3C1(d.contactExchange);save();render();return true}return false}
function visibleChatMessages3C1(personId){const c=chatOf(personId),r=contactRecord3C1(personId);if(!r)return[];const first=communicationDeviceDate3C1(usableSmartphone3C1()?'smartphone':'kidsWatch')||r.exchangedDate;const cutoff=[r.exchangedDate,first].filter(Boolean).sort().slice(-1)[0]||'0000-01-01';return (c.msgs||[]).filter(m=>(m.dateISO||'0000-01-01')>=cutoff)}
function communicationContacts3C1(channel='message'){migrateCommunication3C1();return (S.people||[]).filter(p=>canDirectCommunicate3C1(p,channel))}


// ---------- 3C.1 UI/backend agreement ----------
// The existing Phone destination stays the smartphone UI. A kids smartwatch is
// intentionally not promoted to a full Phone screen in this checkpoint.
function openPeopleChooser(action){
 const channel=action==='call'?'call':'message';
 const people=typeof communicationContacts3C1==='function'?communicationContacts3C1(channel):(S.people||[]);
 openModal(action==='call'?'Who do you want to call?':'Choose someone',`<div class="modal-action-grid">${people.map(p=>`<button data-person-action="${action}" data-person-id="${p.id}">${esc(p.name)}</button>`).join('')||'<p class="muted-text">No eligible contacts yet.</p>'}</div>`)
}
function phonePanel(){
 if(typeof smartwatchPanel3C3==='function'&&usableKidsWatch3C1()&&!usableSmartphone3C1())return smartwatchPanel3C3();
 if(S.age<D.ageRules.phone)return `<div class="dashboard"><section class="card wide"><h3>📱 Phone milestone</h3><p class="locked-note">${esc(phoneLockReason())}</p><p>You can still save money and ask for phones in <b>Money & Items</b>. Owning a phone early does not grant unrestricted smartphone access early.</p><button data-tab-jump="business">Go to phones & shopping</button></section></div>`;
 const phone=activePhoneItem();
 if(!phone)return `<div class="dashboard"><section class="card wide"><h3>📱 You don't own a phone yet</h3><p class="muted-text">Browse used, standard and flagship phones in Money & Items. You can save, ask parents/guardians, or request one for a future occasion.</p><button data-tab-jump="business">Browse phones</button></section></div>`;
 if(!canUsePhone())return `<div class="dashboard"><section class="card wide"><h3>📱 ${esc(phone.name)} unavailable</h3><p class="locked-note">${esc(phoneLockReason()||'Your phone is not usable right now.')}</p><p class="muted-text">Phone-dependent apps stay unavailable until the device is usable again.</p><button data-tab-jump="business">Open Money & Items</button></section></div>`;
 migrateCommunication3C1();if(typeof migrateCommunication3C2==='function')migrateCommunication3C2();ensurePhoneApps();const gunread=typeof unreadGroup3C4==='function'?unreadGroup3C4():0,all=['Messages','Calls','Camera','Photos','Social media','Music','Games','Maps','Shopping','School portal','Food delivery','Transport','Job finder','Banking','Dating'],contacts=communicationContacts3C1('message'),unread=typeof unreadDirect3C2==='function'?unreadDirect3C2():0,missed=typeof missedCalls3C2==='function'?missedCalls3C2():0;
 return `<div class="dashboard"><section class="card wide"><div class="section-heading"><div><h3>📱 ${esc(S.phone.model)}</h3><p class="muted-text">Condition ${Math.round(S.phone.condition)}% • ${unread} unread direct message${unread===1?'':'s'} • ${gunread} unread group message${gunread===1?'':'s'} • ${missed} missed call${missed===1?'':'s'} • ${contacts.length} contact${contacts.length===1?'':'s'} • ${esc(S.age<18?(dailyAccess().phone?'caregiver phone permission approved today':'caregiver permission required today'):'independent access')}</p></div><span class="tag">Usable</span></div><div class="phone-grid">${all.map(name=>{const internal=name==='Social media'?'Social':name,unlocked=S.phone.appsUnlocked.includes(name)||name==='Social media'&&S.age>=15,reason=name==='Dating'?'18+':name==='Job finder'?'16+':'Age/ownership rules',status=name==='Messages'?((unread||gunread)?`${unread} direct · ${gunread} group unread`:'No unread'):name==='Calls'?(missed?`${missed} missed`:'Call history'):'Open';return unlocked?`<button class="phone-app" data-phone-app="${esc(internal)}"><b>${esc(name)}</b><small>${esc(status)}</small></button>`:`<button class="phone-app locked" disabled><b>${esc(name)}</b><small>🔒 ${reason}</small></button>`}).join('')}</div></section><section class="card"><h3>Online presence</h3>${statRow('Followers',S.social.followers)}${statRow('Posts',S.social.posts)}${statRow('Reputation',Math.round(S.social.reputation)+'%')}${statRow('Fame',Math.round(S.social.fame)+'%')}<button data-act="socialPost">Post / interact</button></section><section class="card"><h3>Communication access</h3><p class="muted-text">Messages and calls are available only for family-authorized or exchanged contacts. Knowing someone in People does not automatically add their number.</p>${contacts.slice(0,5).map(p=>`<div class="row"><span>${esc(displayName(p))}</span><b>${esc(contactStatusText3C1(p))}</b></div>`).join('')||'<p class="muted-text">No eligible contacts yet.</p>'}</section></div>`
}
