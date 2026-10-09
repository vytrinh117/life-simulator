// =====================================================================
// PHASE 3C.2 — Messages + Calls + Video Calls + Notifications
// Extends the 3C.1 device/contact source of truth. S.chats remains the
// canonical direct-thread store and S.callLog remains the canonical call log.
// =====================================================================
const COMM3C2_VERSION=1;
const COMM3C2_PLAYER_ID='player';

function communication3C2State(){
 const c=ensureCommunication3C1();
 c.threadVersion=Number(c.threadVersion)||0;
 c.lastIncoming=c.lastIncoming&&typeof c.lastIncoming==='object'?c.lastIncoming:{};
 return c
}
function messageStamp3C2(dateISO,minute){return `${dateISO||currentDate()}T${String(Math.floor((minute||0)/60)).padStart(2,'0')}:${String((minute||0)%60).padStart(2,'0')}:00`}
function normalizeMessage3C2(m,personId){
 if(!m||typeof m!=='object')m={};
 const incoming=m.from==='them'||(m.senderId&&m.senderId!==COMM3C2_PLAYER_ID);
 m.id=m.id||uid('cm');m.personId=personId;
 m.senderId=m.senderId||(incoming?personId:COMM3C2_PLAYER_ID);
 m.receiverId=m.receiverId||(incoming?COMM3C2_PLAYER_ID:personId);
 m.from=incoming?'them':'me';m.dateISO=m.dateISO||currentDate();
 m.minute=Number.isFinite(Number(m.minute))?Number(m.minute):currentMinute();
 m.timestamp=m.timestamp||messageStamp3C2(m.dateISO,m.minute);
 m.type=m.type||m.kind||'chat';m.kind=m.kind||m.type||'chat';
 m.read=m.senderId===COMM3C2_PLAYER_ID?true:!!m.read;
 return m
}
function normalizeThread3C2(personId){
 const c=chatOf(personId);c.personId=personId;c.type='direct';c.msgs=Array.isArray(c.msgs)?c.msgs:[];
 c.msgs=c.msgs.map(m=>normalizeMessage3C2(m,personId));return c
}
function callOutcome3C2(x){if(x.outcome)return x.outcome;if(x.missed)return'missed';return x.completed===false?'unavailable':'completed'}
function normalizeCall3C2(x){
 if(!x||typeof x!=='object')x={};x.id=x.id||uid('call');x.personId=x.personId||null;
 x.dateISO=x.dateISO||currentDate();x.minute=Number.isFinite(Number(x.minute))?Number(x.minute):currentMinute();
 x.timestamp=x.timestamp||messageStamp3C2(x.dateISO,x.minute);x.direction=x.direction||'incoming';x.callType=x.callType||x.type||'voice';
 x.outcome=callOutcome3C2(x);x.duration=Number.isFinite(Number(x.duration))?Number(x.duration):0;
 x.missed=x.outcome==='missed';x.seen=x.seen===true||(!x.missed&&x.seen!==false);return x
}
function earliestLegacyCallDate3C2(){return (S.callLog||[]).map(x=>x?.dateISO).filter(Boolean).sort()[0]||null}
function migrateCommunication3C2(){
 migrateCommunication3C1();const c=communication3C2State();
 if(c.threadVersion<COMM3C2_VERSION){
  // Preserve actual legacy call evidence only when a valid device existed in the save.
  const access=communicationDeviceAccess3C1(),oldCall=earliestLegacyCallDate3C2();
  if(access.hasAny&&oldCall){if(access.smartphone)markFirstDeviceDate3C1('smartphone',oldCall);for(const x of S.callLog||[]){const p=personById(x.personId);if(p&&!contactRecord3C1(p))addContact3C1(p,{source:'legacy',initiatedBy:'legacy',dateISO:x.dateISO||oldCall,legacy:true,approvedForWatch:isImmediateFamilyContact3C1(p)})}}
  c.threadVersion=COMM3C2_VERSION;c.threadMigratedDate=c.threadMigratedDate||currentDate()
 }
 S.chats=S.chats||{};for(const id of Object.keys(S.chats))if(personById(id))normalizeThread3C2(id);
 S.callLog=(Array.isArray(S.callLog)?S.callLog:[]).map(normalizeCall3C2).filter(x=>!x.personId||personById(x.personId)).slice(0,80);
 return c
}
function chatAdd(id,from,text,kind='chat',extra={}){
 const p=personById(id);if(!p)return null;const c=normalizeThread3C2(id),incoming=from==='them';
 const m=normalizeMessage3C2(Object.assign({id:uid('cm'),from:incoming?'them':'me',text,kind,dateISO:currentDate(),minute:currentMinute(),read:!incoming},extra),id);
 c.msgs.push(m);if(c.msgs.length>80)c.msgs.splice(0,c.msgs.length-80);return m
}
function canonicalMessages3C2(personId){migrateCommunication3C2();return (typeof visibleChatMessages3C1==='function'?visibleChatMessages3C1(personId):normalizeThread3C2(personId).msgs).map(m=>normalizeMessage3C2(m,personId))}
function unreadDirect3C2(personId=null){
 migrateCommunication3C2();const ids=personId?[personId]:Object.keys(S.chats||{});let n=0;
 for(const id of ids)if(personById(id))n+=canonicalMessages3C2(id).filter(m=>m.senderId===id&&!m.read).length;return n
}
function unreadChats(){return unreadDirect3C2()}
function unreadMessages(){return communicationDeviceAccess3C1().hasAny?unreadDirect3C2():0}
function messageTimeLabel3C2(m){
 const d=m.dateISO||currentDate(),diff=daysBetween(d,currentDate()),day=diff===0?'Today':diff===1?'Yesterday':formatDate(d);return `${day} · ${timeLabel(m.minute||0)}`
}
function recordCall3C2(p,{direction='outgoing',callType='voice',outcome='completed',duration=0,device=null,why=null,voicemail=null,seen=null}={}){
 if(!p)return null;migrateCommunication3C2();const x=normalizeCall3C2({id:uid('call'),personId:p.id,dateISO:currentDate(),minute:currentMinute(),direction,callType,outcome,duration,device,why,voicemail,seen:seen==null?outcome!=='missed':seen});
 S.callLog.unshift(x);if(S.callLog.length>80)S.callLog.length=80;if(typeof communicationMemoryFromCall3C4==='function')communicationMemoryFromCall3C4(p,x,why||'');return x
}
function callCutoff3C2(personId){const r=contactRecord3C1(personId);if(!r||r.status!=='active'||r.blocked||r.removed)return null;const device=communicationDeviceAccess3C1().smartphone?'smartphone':'kidsWatch',first=communicationDeviceDate3C1(device),xs=[r.exchangedDate,first].filter(Boolean).sort();return xs.length?xs[xs.length-1]:'0000-01-01'}
function visibleCallLog3C2(){migrateCommunication3C2();return S.callLog.filter(x=>{const cut=callCutoff3C2(x.personId);return !!cut&&(x.dateISO||'0000-01-01')>=cut})}
function missedCalls3C2(personId=null){return visibleCallLog3C2().filter(x=>x.outcome==='missed'&&!x.seen&&(!personId||x.personId===personId)).length}
function callAvailability3C2(p){
 if(!p)return{ok:false,reason:'Unavailable'};const m=currentMinute(),status=npcStatusAt(p);
 if((m<390||m>=1410)&&!isImmediateFamilyContact3C1(p))return{ok:false,reason:'They are probably asleep.'};
 if(!status.free)return{ok:false,reason:status.why||'They are busy right now.'};return{ok:true,reason:'Available'}
}
function callContext3C2(p,video=false){
 const l=typeof ensureLove==='function'?ensureLove(p):null;if(video&&l&&['official','exclusive','dating'].includes(l.stage))return'romantic video call';
 if(isFamilyPerson(p))return'family check-in';if(S.school&&needsFormalSchool()&&chance(24))return'study catch-up';return video?'video catch-up':'phone catch-up'
}
function outgoingCall3C2(personId,video=false){
 const p=typeof personId==='string'?personById(personId):personId;if(!p)return null;const channel=video?'video':'call',g=communicationEligibility3C1(p,channel);if(!g.ok){toast(g.reason);return null}
 if(g.device==='smartphone'&&classConfiscation())return null;if(typeof bedtimeCommunicationGate3C3==='function'){const hg=bedtimeCommunicationGate3C3(p,channel,g.device);if(!hg.ok){advanceTime(1,{silent:true});toast(hg.reason);return null}}const av=callAvailability3C2(p);
 if(!av.ok){recordCall3C2(p,{direction:'outgoing',callType:video?'video':'voice',outcome:'unavailable',duration:0,device:g.device});advanceTime(2,{silent:true});log(`${video?'Video call':'Call'} • ${firstName(p)}`,av.reason);return null}
 const m=currentMinute(),answerChance=clamp(72+tierRank(p)*5+(m>=1080&&m<=1320?5:0),55,96);
 if(!chance(answerChance)){recordCall3C2(p,{direction:'outgoing',callType:video?'video':'voice',outcome:'missed',duration:0,device:g.device,seen:true});advanceTime(2,{silent:true});log(`No answer • ${firstName(p)}`,`${firstName(p)} does not pick up.`);return null}
 const dur=video?20+Math.floor(Math.random()*26):12+Math.floor(Math.random()*24),ctx=callContext3C2(p,video);recordCall3C2(p,{direction:'outgoing',callType:video?'video':'voice',outcome:'completed',duration:dur,device:g.device});advanceTime(dur,{silent:true});if(typeof applyRelationshipOutcomeH5==='function')applyRelationshipOutcomeH5(p.id,video?'videoCall':'voiceCall','completed',{transactionId:'call:'+S.callLog[0]?.id,dailyKey:video?'videoCall':'voiceCall',gain:video?3:2});p.rel=clamp(p.rel+(video?2:1.5));p.trust=clamp(p.trust+1);S.needs.social=clamp(S.needs.social+(video?8:6));rememberPerson(p,video?`You had a ${ctx}.`:'You caught up by phone.');log(`${video?'Video call':'Call'} with ${firstName(p)}`,`${ctx[0].toUpperCase()+ctx.slice(1)} • ${dur} min.`);return S.callLog[0]
}
function callHistoryTime3C2(x){return messageTimeLabel3C2(x)}
function openCallsModal3C2(){
 migrateCommunication3C2();const before=missedCalls3C2(),visible=visibleCallLog3C2(),rows=visible.slice(0,18).map(x=>{const p=personById(x.personId),label=x.callType==='video'?'Video':'Voice',out=x.outcome==='completed'?`${x.duration||0} min`:x.outcome[0].toUpperCase()+x.outcome.slice(1);return `<div class="message-row"><b>${p?esc(displayName(p)):'Unknown contact'}</b><span>${esc(label)} • ${esc(x.direction)} • ${esc(out)}</span><small>${esc(callHistoryTime3C2(x))}</small></div>`}).join('')||'<p class="muted-text">No calls yet.</p>';
 const contacts=communicationContacts3C1('call').slice(0,12);openModal('Calls',`${before?`<p><span class="tag warn">${before} missed call${before===1?'':'s'}</span></p>`:''}${rows}<h4>Call a contact</h4><div class="modal-action-grid">${contacts.map(p=>`<button class="small" data-call-person="${p.id}">📞 ${esc(displayName(p))}</button>${canDirectCommunicate3C1(p,'video')?`<button class="small ghost" data-video-person="${p.id}">📹 ${esc(firstName(p))}</button>`:''}`).join('')||'<p class="muted-text">No call-capable contacts.</p>'}</div>`);for(const x of visible)if(x.outcome==='missed')x.seen=true
}
function communicationFrequencyKey3C2(p,channel){return `${channel}:${p.id}`}
function communicationCanInitiate3C2(p,channel='message'){
 const c=communication3C2State(),last=c.lastIncoming[communicationFrequencyKey3C2(p,channel)];if(!last)return true;const d=daysBetween(last,currentDate()),rank=tierRank(p);return d>=(rank>=3?2:rank>=2?3:5)
}
function markIncomingCommunication3C2(p,channel='message'){communication3C2State().lastIncoming[communicationFrequencyKey3C2(p,channel)]=currentDate()}
function contextualMessageKind3C2(p,pool=[]){
 const soon=(S.plans||[]).find(x=>x.personId===p.id&&!isTerminal(x.status)&&daysBetween(currentDate(),x.dateISO)>=0&&daysBetween(currentDate(),x.dateISO)<=1);if(soon&&CHAT_KINDS.planReminder)return'planReminder';
 if(isSick()&&tierRank(p)>=2&&CHAT_KINDS.checkin)return'checkin';return rand(pool.length?pool:['chitchat'])
}
function incomingMessage(p,kind,opts={}){
 const k=CHAT_KINDS[kind];if(!k||!p||!canDirectCommunicate3C1(p,'message'))return null;
 // Initiative/frequency is checked when a message is scheduled. Once a follow-up has
 // already been committed to the calendar, do not silently drop it at delivery time
 // just because another communication happened meanwhile. Direct unscheduled calls
 // still use the normal frequency gate.
 if(!opts.committed&&!communicationCanInitiate3C2(p,'message'))return null;
 const gate=communicationEligibility3C1(p,'message'),m=chatAdd(p.id,'them',rand(k.texts),kind,{turn:1,device:gate.device});markIncomingCommunication3C2(p,'message');if(typeof communicationMemoryFromMessage3C4==='function')communicationMemoryFromMessage3C4(p,m);if(!SIM.skipping)notify(`💬 ${displayName(p)}`,m.text,{sourceType:'chat',sourceId:m.id,tab:'phone'});return m
}
function scheduleMessages(){
 if(SIM.skipping)return;migrateCommunication3C2();const access=communicationDeviceAccess3C1();if(!access.hasAny)return;
 const fam=S.people.filter(p=>isImmediateFamilyContact3C1(p)&&canDirectCommunicate3C1(p,'message')),fr=access.smartphone?S.people.filter(p=>!isFamilyPerson(p)&&tierRank(p)>=1&&!p.movedAway&&canDirectCommunicate3C1(p,'message')):[];
 const unique=[...fr].sort(()=>Math.random()-.5).slice(0,Math.min(2,fr.length));for(const p of unique)if(communicationCanInitiate3C2(p,'message')&&chance(tierRank(p)>=3?32:18)){const pool=Object.entries(CHAT_KINDS).filter(([k,x])=>!['parent','parentSocial','bdayWish','wish'].includes(k)&&S.age>=(x.minAge||0)&&(!x.school||needsFormalSchool())).map(([k])=>k);scheduleFollowUp('incomingMsg',{personId:p.id,kind:contextualMessageKind3C2(p,pool)},{minute:660+Math.floor(Math.random()*600)})}
 if(fam.length&&chance(42)){const p=rand(fam);if(communicationCanInitiate3C2(p,'message'))scheduleFollowUp('incomingMsg',{personId:p.id,kind:typeof familyMessageKind3C3==='function'?familyMessageKind3C3(p):parentMessageKind()},{minute:960+Math.floor(Math.random()*180)})}
 if(access.smartphone&&fr.length&&chance(10)){const p=rand(fr.filter(x=>tierRank(x)>=2).concat(fr));if(p&&communicationCanInitiate3C2(p,'call'))scheduleFollowUp('incomingCall',{personId:p.id,why:tierRank(p)>=3&&chance(20)?'distress':'chat'},{minute:1020+Math.floor(Math.random()*180)})}
}
function incomingCall(p,why){
 const video=why==='romanceVideo',channel=video?'video':'call';if(!p||!canDirectCommunicate3C1(p,channel)||(why!=='parentLate'&&!communicationCanInitiate3C2(p,channel)))return null;const gate=communicationEligibility3C1(p,channel);if(typeof bedtimeCommunicationGate3C3==='function'&&!isFamilyPerson(p)){const hg=bedtimeCommunicationGate3C3(p,channel,gate.device);if(!hg.ok){logMissedCall(p,why,hg.reason,gate.device,video?'video':'voice');return null}}markIncomingCommunication3C2(p,channel);if(atSchool()&&periodAt()?.kind==='class'){logMissedCall(p,why,'Your device was on silent in class.',gate.device,video?'video':'voice');return null}
 const t=why==='parentLate'?`${firstName(p)} is calling. It is past your curfew.`:why==='distress'?`${firstName(p)} is calling. They sound upset.`:video?`${firstName(p)} wants to video call before bed.`:`${firstName(p)} is calling.`;queueEvent({type:'incomingCall',title:`${video?'📹':'📞'} ${displayName(p)}`,text:t,participants:[p.id],payload:{why,device:gate.device,callType:video?'video':'voice'},priority:why==='chat'?3:5,expiresAt:{dateISO:currentDate(),minute:Math.min(1439,currentMinute()+15)},choices:[{id:'answer',label:'Answer'},{id:'decline',label:'Decline'},{id:'later',label:'Text "call you later"'}]});return true
}
function logMissedCall(p,why,note='',device=null,callType='voice'){const v=why==='distress'?'"Hey… call me back when you can. It\'s kind of important."':why==='parentLate'?'"Where are you? Call me NOW."':'"Hey, just calling to talk. Call me back!"';recordCall3C2(p,{direction:'incoming',callType,outcome:'missed',duration:0,device,why,voicemail:v,seen:false});if(why==='distress'&&tierRank(p)>=3)p.rel=clamp(p.rel-1);if(why==='parentLate'){S.family.tension=clamp(S.family.tension+4);S.family.trust=clamp((S.family.trust??60)-4)}if(!SIM.skipping)log(`Missed call • ${firstName(p)}`,`${note?note+' ':''}Voicemail: ${v}`)}
function handleIncomingCall(e,id){
 const p=personById(e.participants?.[0]),why=e.payload?.why,callType=e.payload?.callType||'voice',device=e.payload?.device||communicationEligibility3C1(p,callType==='video'?'video':'call')?.device;if(!p)return true;
 if(id==='answer'){let dur=25;if(why==='parentLate'){dur=5;S.family.tension=clamp(S.family.tension+2);log('Mom/Dad on the phone','"You were supposed to be home already. Come home. Now." You head back.');S.location='Home'}else if(why==='distress'){dur=40;advanceTime(dur,{silent:true});p.rel=clamp(p.rel+5);p.trust=clamp(p.trust+5);rememberPerson(p,'You picked up when they needed someone.',3);log(`On the phone with ${firstName(p)}`,`${firstName(p)} needed someone to listen. By the end they sound calmer.`)}else{advanceTime(dur,{silent:true});p.rel=clamp(p.rel+2);S.needs.social=clamp(S.needs.social+8);log(`Call with ${firstName(p)}`,relationshipStory(p,'call'))}recordCall3C2(p,{direction:'incoming',callType,outcome:'completed',duration:dur,device,why})}
 else if(id==='later'){chatAdd(p.id,'me','can\'t talk rn, call you later!','reply',{device});recordCall3C2(p,{direction:'incoming',callType,outcome:'declined',duration:0,device,why});if(why==='parentLate')S.family.tension=clamp(S.family.tension+3);log('Call you later',`You text ${firstName(p)} that you will call back.`)}
 else{recordCall3C2(p,{direction:'incoming',callType,outcome:'declined',duration:0,device,why});if(why!=='parentLate')p.rel=clamp(p.rel-(tierRank(p)>=3?1:0));log('Declined call',`You decline ${firstName(p)}'s call.`)}return true
}
function communication3C2Click(b){const d=b.dataset;if(d.callPerson){outgoingCall3C2(d.callPerson,false);save();render();return true}if(d.videoPerson){outgoingCall3C2(d.videoPerson,true);save();render();return true}return false}

// Add contextual message kinds to the existing reply engine. These are intentionally
// lightweight; richer romantic/group communication belongs to 3C.4.
CHAT_KINDS.planReminder=CHAT_KINDS.planReminder||{texts:['Still good for our plan tomorrow?','Just checking — are we still on for later?'],opts:[['agree','Yep, see you then!'],['warm','Looking forward to it!'],['later','I need to check and get back to you.']]};
CHAT_KINDS.checkin=CHAT_KINDS.checkin||{texts:['Hey, how are you feeling today?','Just checking in — are you doing okay?'],opts:[['warm','Thanks for checking on me ❤️'],['comfort','I’m doing a little better.'],['short','I’m okay.']]};
CHAT_KINDS.bdayWish=CHAT_KINDS.bdayWish||{texts:[],opts:[['warm','Thank you!'],['comfort',"That's so sweet"],['agree','Grateful ❤️']]};
CHAT_KINDS.wish=CHAT_KINDS.wish||CHAT_KINDS.bdayWish;
