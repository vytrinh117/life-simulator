// =====================================================================
// PHASE 3C.3 — Kids Smartwatch + Parent/Family Communication
// Extends 3C.1/3C.2; no parallel phone/contact/thread system is created.
// =====================================================================
const COMM3C3_VERSION=1;

function communication3C3State(){
 const c=ensureCommunication3C1();
 c.watch=c.watch&&typeof c.watch==='object'?c.watch:{};
 c.watch.version=Number(c.watch.version)||0;
 c.watch.locationSharing=c.watch.locationSharing!==false;
 c.watch.lastKnown=c.watch.lastKnown&&typeof c.watch.lastKnown==='object'?c.watch.lastKnown:null;
 c.watch.lastLocationNotice=c.watch.lastLocationNotice||null;
 c.familyComm=c.familyComm&&typeof c.familyComm==='object'?c.familyComm:{};
 c.familyComm.lastLogisticsDate=c.familyComm.lastLogisticsDate||null;
 return c
}
function watchFamilyPreapproved3C3(p){
 if(!p||p.deceased)return false;
 if(isActualGuardian(p))return true;
 const r=p.relation||'';
 return ['mother','father','parent','guardian','sibling','grandmother','grandfather','grandparent'].includes(r)||['parent','guardian','older sibling','younger sibling','sibling','grandparent'].includes(p.role)
}
function ensureWatchFamilyContacts3C3(){
 const watch=usableKidsWatch3C1();if(!watch)return;
 for(const p of S.people||[])if(watchFamilyPreapproved3C3(p))addContact3C1(p,{source:'family',initiatedBy:'family',approvedForWatch:true,channels:['message','call']})
}
function migrateCommunication3C3(){
 migrateCommunication3C2();const c=communication3C3State();
 if(c.watch.version<COMM3C3_VERSION){c.watch.version=COMM3C3_VERSION;c.watch.migratedDate=c.watch.migratedDate||currentDate()}
 ensureWatchFamilyContacts3C3();return c
}
function watchLocationSharingActive3C3(){return !!usableKidsWatch3C1()&&S.age<18&&livesWithParents()&&communication3C3State().watch.locationSharing!==false}
function watchLocationAuthority3C3(){if(!watchLocationSharingActive3C3())return null;return decisionAuthorityPerson()||null}
function watchLocationSnapshot3C3(reason='status'){
 migrateCommunication3C3();const p=watchLocationAuthority3C3(),enabled=!!p;
 if(!enabled)return {enabled:false,authorityId:null,location:null,dateISO:null,minute:null,reason};
 const s={enabled:true,authorityId:p.id,location:S.location||'Home',dateISO:currentDate(),minute:currentMinute(),reason};communication3C3State().watch.lastKnown=s;return s
}
function watchContactApprovalEligibility3C3(pOrId){
 const p=typeof pOrId==='string'?personById(pOrId):pOrId;if(!p)return{ok:false,reason:'Person not found.'};migrateCommunication3C3();
 if(!usableKidsWatch3C1())return{ok:false,reason:'You need a usable kids smartwatch.'};
 if(watchFamilyPreapproved3C3(p)){ensureWatchFamilyContacts3C3();return{ok:true,already:true,family:true}};
 const r=contactRecord3C1(p);if(r?.status==='active'&&r.approvedForWatch)return{ok:true,already:true};
 if(S.age>=18)return{ok:false,reason:'Kids smartwatch approval is only relevant while you are a minor.'};
 if(!decisionAuthorityPerson())return{ok:false,reason:'No parent or guardian authority is available.'};
 if(isFamilyPerson(p)&&!watchFamilyPreapproved3C3(p))return{ok:true,already:false,relative:true};
 if(tierRank(p)<1||(p.trust||0)<35)return{ok:false,reason:'Your parent or guardian does not know this contact well enough yet.'};
 if((p.conflict||0)>=70)return{ok:false,reason:'There is too much conflict for a smartwatch contact request right now.'};
 return{ok:true,already:false}
}
function watchApprovalContext3C3(p){return{kind:'kidsWatchContact',friendTier:friendTier(p)||'Acquaintance',trustBand:Math.floor((p.trust||50)/10),conflictBand:Math.floor((p.conflict||0)/15),family:!!isFamilyPerson(p)}}
function requestWatchContactApproval3C3(personId){
 const p=personById(personId),g=watchContactApprovalEligibility3C3(p);if(!p||!g.ok){toast(g?.reason||'That contact cannot be added.');return null}if(g.already){toast('That contact is already approved for your smartwatch.');return contactRecord3C1(p)}
 const ctx=watchApprovalContext3C3(p),q=requestDecision({requestType:'watchContactApproval',targetKey:p.id,context:ctx,decide:(maker)=>{const r=familyRules(),score=clamp(52+(p.trust||50)*.18+(p.rel||0)*.16-(p.conflict||0)*.3+(r.respect-50)*.15-(r.strictness-50)*.2+(isFamilyPerson(p)?18:0),12,92),ok=chance(score),who=decisionMakerLabel(maker);return ok?{outcome:'Yes',reason:`${who} approves ${firstName(p)} as a smartwatch contact.`,resolved:true}:{outcome:'No',reason:`${who} does not approve ${firstName(p)} as a smartwatch contact right now.`,reconsiderAfter:addDays(currentDate(),7),resolved:true}}});
 if(q.error){toast(q.error);return null}const rec=q.record;if(rec.outcome==='Yes'){addContact3C1(p,{source:'watchApproval',initiatedBy:'guardian',approvedForWatch:true,channels:['message','call']});rememberPerson(p,'Your parent/guardian approved them as a kids smartwatch contact.',1);log('Smartwatch contact approved',rec.reason)}else log('Smartwatch contact request',rec.reason);return rec
}
function watchContactActionHtml3C3(p){const g=watchContactApprovalEligibility3C3(p);if(!g.ok||g.already)return'';return `<button class="small ghost" data-watch-contact-approve="${p.id}">⌚ Ask to add to smartwatch</button>`}
function communication3C3Click(b){const d=b.dataset;if(d.watchContactApprove){requestWatchContactApproval3C3(d.watchContactApprove);save();render();return true}return false}
function smartwatchPhoneApp3C3(name){
 if(!usableKidsWatch3C1())return false;migrateCommunication3C3();
 if(name==='Messages'){openMessagesModal();return true}
 if(name==='Calls'){openCallsModal3C2();return true}
 return false
}
function smartwatchPanel3C3(){
 migrateCommunication3C3();const w=usableKidsWatch3C1();if(!w)return'';const contacts=communicationContacts3C1('message'),unread=unreadDirect3C2(),missed=missedCalls3C2(),loc=watchLocationSnapshot3C3('panel'),who=loc.authorityId?decisionMakerLabel(loc.authorityId):'Parent/guardian';
 return `<div class="dashboard"><section class="card wide"><div class="section-heading"><div><h3>⌚ ${esc(w.name)}</h3><p class="muted-text">Limited kids device • ${unread} unread message${unread===1?'':'s'} • ${missed} missed call${missed===1?'':'s'} • ${contacts.length} approved contact${contacts.length===1?'':'s'}</p></div><span class="tag">Kids smartwatch</span></div><div class="phone-grid"><button class="phone-app" data-phone-app="Messages"><b>Messages</b><small>${unread?`${unread} unread`:'Family / approved contacts'}</small></button><button class="phone-app" data-phone-app="Calls"><b>Calls</b><small>${missed?`${missed} missed`:'Approved contacts only'}</small></button><button class="phone-app locked" disabled><b>Social media</b><small>🔒 Not supported</small></button><button class="phone-app locked" disabled><b>Apps</b><small>🔒 Limited device</small></button></div></section><section class="card"><h3>Approved contacts</h3>${contacts.slice(0,8).map(p=>`<div class="row"><span>${esc(displayName(p))}</span><b>${esc(familyRelationLabel(p)||friendTier(p)||'Approved')}</b></div>`).join('')||'<p class="muted-text">No approved contacts yet.</p>'}</section><section class="card"><h3>Location sharing</h3><p>${loc.enabled?`${esc(who)} can see your current watch location when needed.`:'Location sharing is not active.'}</p><p class="muted-text">This is a family-safety gameplay hook; it does not unlock Maps, Transport, social media, shopping or banking.</p></section></div>`
}
function familyMessageKind3C3(p){
 if(!livesWithParents())return'parentSocial';
 if(typeof isSick==='function'&&isSick())return'familyCheckIn3C3';
 const m=currentMinute(),cf=curfewMinute();if((S.location||'Home')!=='Home'&&cf&&m>=cf-60)return'familyWhere3C3';
 const soon=(S.calendar||[]).find(e=>e.dateISO===currentDate()&&!isTerminal(e.status)&&e.startMinute>=m&&e.startMinute<=m+240);if(soon)return'familyReminder3C3';
 return'parent'
}
function bedtimeCommunicationGate3C3(p,channel,device){
 if(S.age>=18||!livesWithParents()||isFamilyPerson(p)||!isAtHome())return{ok:true};const cf=curfewMinute(),m=currentMinute();if(!cf||m<cf)return{ok:true};const r=familyRules(),late=Math.max(0,m-cf),notice=clamp(8+(r.strictness||50)*.42+late*.18-(S.family.trust??60)*.12,8,88);if(!chance(notice))return{ok:true,quiet:true};S.family.tension=clamp((S.family.tension||0)+2);log('Late call noticed',`${decisionMakerLabel(decisionAuthorityPerson())} notices you trying to ${channel==='video'?'video call':'call'} ${firstName(p)} after curfew and tells you to end it.`);return{ok:false,reason:'A parent/guardian noticed the late call and told you to end it.'}
}
function communication3C3Daily(){migrateCommunication3C3();if(watchLocationSharingActive3C3())watchLocationSnapshot3C3('daily')}
// Override the pre-3C curfew call hook: communication still requires a real device/channel,
// and a location-sharing smartwatch gives the parent/guardian a legitimate reason to know.
function curfewCallCheck(){
 if(S.age>=18||SIM.skipping||S.location==='Home'||S.location==='School')return;const cf=curfewMinute(),m=currentMinute();if(!cf||m<cf+15||(S.flags.curfewCall===currentDate()))return;const aware=watchLocationSharingActive3C3(),cg=aware?watchLocationAuthority3C3():(decisionAuthorityPerson()||S.people.find(x=>x.role==='parent')||null);if(!cg||!canDirectCommunicate3C1(cg,'call'))return;S.flags.curfewCall=currentDate();if(aware){const st=watchLocationSnapshot3C3('late');communication3C3State().watch.lastLocationNotice=currentDate();log('⌚ Location check',`${decisionMakerLabel(cg)} can see from your smartwatch that you are still at ${st.location||'your current location'} after curfew.`)}incomingCall(cg,'parentLate')
}
CHAT_KINDS.familyWhere3C3=CHAT_KINDS.familyWhere3C3||{texts:['Where are you? Please tell me when you are heading home.','Are you on your way home? Let me know where you are.','Text me when you leave so I know when to expect you.'],opts:[['onmyway','On my way'],['ok','Okay! 👍'],['ignore','Ignore it']]};
CHAT_KINDS.familyCheckIn3C3=CHAT_KINDS.familyCheckIn3C3||{texts:['How are you feeling? Need anything?','Checking in — are you resting?','Let me know if you need water, food, or help.'],opts:[['warm','Thanks ❤️'],['ok','I’m okay'],['ignore','Ignore it']]};
CHAT_KINDS.familyReminder3C3=CHAT_KINDS.familyReminder3C3||{texts:['Don’t forget what you have later today.','Quick reminder — check your schedule before you go.','Remember your event later. Text if plans change.'],opts:[['ok','Got it 👍'],['warm','Thanks for reminding me'],['ignore','Ignore it']]};
