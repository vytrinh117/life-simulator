// =====================================================================
// PHASE 3C.4 — Group Chats + Relationship Communication + Memory/Blocking
// Builds on the canonical 3C.1 contacts and 3C.2 message/call stores.
// Group threads are separate from direct S.chats and are keyed by stable groupId.
// =====================================================================
const COMM3C4_VERSION=1;
const COMM3C4_PLAYER_ID='player';

function communication3C4State(){
 const c=ensureCommunication3C1();
 c.groupChats=c.groupChats&&typeof c.groupChats==='object'&&!Array.isArray(c.groupChats)?c.groupChats:{};
 c.groupLastIncoming=c.groupLastIncoming&&typeof c.groupLastIncoming==='object'?c.groupLastIncoming:{};
 c.romanceNextContact=c.romanceNextContact&&typeof c.romanceNextContact==='object'?c.romanceNextContact:{};
 c.memoryKeys=c.memoryKeys&&typeof c.memoryKeys==='object'?c.memoryKeys:{};
 c.phase3C4Version=Number(c.phase3C4Version)||0;
 return c
}
function groupById3C4(id){return (S.groups||[]).find(g=>g.id===id)||null}
function groupMemberIds3C4(g){return [...new Set((g?.members||[]).filter(id=>personById(id)))].slice(0,12)}
function maxDate3C4(xs){return xs.filter(Boolean).sort().slice(-1)[0]||currentDate()}
function groupChatCutoff3C4(g){
 const ds=[g?.formed,communicationDeviceDate3C1('smartphone')];
 for(const id of groupMemberIds3C4(g)){const r=contactRecord3C1(id);if(r?.exchangedDate)ds.push(r.exchangedDate)}
 return maxDate3C4(ds)
}
function groupChatEligibility3C4(gOrId){
 const g=typeof gOrId==='string'?groupById3C4(gOrId):gOrId;if(!g)return{ok:false,reason:'Friend group not found.'};
 if(!usableSmartphone3C1())return{ok:false,reason:'Group chat requires a usable smartphone.'};
 const ids=groupMemberIds3C4(g);if(ids.length<2)return{ok:false,reason:'This group does not have enough active members.'};
 const unavailable=ids.filter(id=>!canDirectCommunicate3C1(id,'message'));
 if(unavailable.length)return{ok:false,reason:`Exchange message-capable contact details with ${unavailable.map(id=>firstName(personById(id))).join(', ')} first.`,missingIds:unavailable};
 return{ok:true,group:g,memberIds:ids,device:'smartphone'}
}
function normalizeGroupMessage3C4(m,gid){
 if(!m||typeof m!=='object')m={};m.id=m.id||uid('gcm');m.groupId=gid;
 m.senderId=m.senderId||COMM3C4_PLAYER_ID;m.receiverId=`group:${gid}`;
 m.dateISO=m.dateISO||currentDate();m.minute=Number.isFinite(Number(m.minute))?Number(m.minute):currentMinute();
 m.timestamp=m.timestamp||messageStamp3C2(m.dateISO,m.minute);m.kind=m.kind||m.type||'groupChat';m.type=m.type||m.kind;
 m.read=m.senderId===COMM3C4_PLAYER_ID?true:!!m.read;return m
}
function normalizeGroupThread3C4(gid,raw){
 const g=groupById3C4(gid);if(!g)return null;const t=raw&&typeof raw==='object'?raw:{};t.groupId=gid;t.type='group';
 t.memberIds=groupMemberIds3C4(g);t.createdDate=t.createdDate||groupChatCutoff3C4(g);t.createdMinute=Number.isFinite(Number(t.createdMinute))?Number(t.createdMinute):0;
 t.msgs=(Array.isArray(t.msgs)?t.msgs:[]).map(m=>normalizeGroupMessage3C4(m,gid)).filter(m=>(m.dateISO||'0000-01-01')>=t.createdDate);
 if(t.msgs.length>120)t.msgs=t.msgs.slice(-120);return t
}
function migrateCommunication3C4(){
 migrateCommunication3C3();const c=communication3C4State();
 for(const [gid,t] of Object.entries(c.groupChats)){const n=normalizeGroupThread3C4(gid,t);if(n)c.groupChats[gid]=n;else delete c.groupChats[gid]}
 if(c.phase3C4Version<COMM3C4_VERSION){c.phase3C4Version=COMM3C4_VERSION;c.phase3C4MigratedDate=c.phase3C4MigratedDate||currentDate()}
 return c
}
function groupChatRecord3C4(gid,{create=false}={}){
 const c=communication3C4State(),old=c.groupChats[gid];if(old)return normalizeGroupThread3C4(gid,old);if(!create)return null;
 const gate=groupChatEligibility3C4(gid);if(!gate.ok)return null;const t=normalizeGroupThread3C4(gid,{groupId:gid,memberIds:gate.memberIds,createdDate:groupChatCutoff3C4(gate.group),createdMinute:currentMinute(),msgs:[]});c.groupChats[gid]=t;return t
}
function visibleGroupMessages3C4(gid){migrateCommunication3C4();const t=groupChatRecord3C4(gid);return t?t.msgs:[]}
function unreadGroup3C4(gid=null){
 migrateCommunication3C4();const ids=gid?[gid]:Object.keys(communication3C4State().groupChats);let n=0;
 for(const id of ids){const t=groupChatRecord3C4(id);if(t)n+=t.msgs.filter(m=>m.senderId!==COMM3C4_PLAYER_ID&&!m.read).length}return n
}
function groupChatAdd3C4(gid,senderId,text,kind='groupChat',extra={}){
 const gate=groupChatEligibility3C4(gid);if(!gate.ok)return null;if(senderId!==COMM3C4_PLAYER_ID&&!gate.memberIds.includes(senderId))return null;
 const t=groupChatRecord3C4(gid,{create:true});if(!t)return null;const m=normalizeGroupMessage3C4(Object.assign({id:uid('gcm'),senderId,text,kind,dateISO:currentDate(),minute:currentMinute(),read:senderId===COMM3C4_PLAYER_ID},extra),gid);t.msgs.push(m);if(t.msgs.length>120)t.msgs.splice(0,t.msgs.length-120);return m
}
function groupChatCanInitiate3C4(g){const c=communication3C4State(),last=c.groupLastIncoming[g.id];return !last||daysBetween(last,currentDate())>=3}
function groupMessageContext3C4(g,sender){
 const plan=(S.plans||[]).find(x=>x.groupId===g.id&&!isTerminal(x.status)&&x.dateISO>=currentDate()&&daysBetween(currentDate(),x.dateISO)<=2);
 if(plan)return{kind:'groupPlan',text:`Are we still good for ${plan.title.replace(/^Group outing \([^)]*\)/,'the group plan')} on ${formatDate(plan.dateISO)}?`};
 if(g.jokes?.length)return{kind:'insideJoke',text:`I just remembered ${g.jokes[0]} and started laughing again 😂`};
 const event=(S.calendar||[]).find(x=>!isTerminal(x.status)&&x.dateISO===currentDate()&&['schoolEvent','prom','program'].includes(x.type));
 if(event)return{kind:'event',text:`Good luck with ${event.title} today!`};
 return{kind:'coordinate',text:rand(['Anyone free this weekend?','Should we actually make plans instead of saying we will?','Who is around later?'])}
}
function maybeGroupMessage3C4(gOrId,{force=false}={}){
 const g=typeof gOrId==='string'?groupById3C4(gOrId):gOrId,gate=groupChatEligibility3C4(g);if(!g||!gate.ok||!groupChatCanInitiate3C4(g))return null;
 if(!force&&!chance(12))return null;const sender=personById(rand(gate.memberIds));if(!sender)return null;const ctx=groupMessageContext3C4(g,sender),m=groupChatAdd3C4(g.id,sender.id,ctx.text,ctx.kind,{device:'smartphone'});if(!m)return null;
 communication3C4State().groupLastIncoming[g.id]=currentDate();if(!SIM.skipping)notify(`💬 ${g.name}`,`${firstName(sender)}: ${m.text}`,{sourceType:'groupChat',sourceId:m.id,tab:'phone'});return m
}
function openGroupThread3C4(gid){
 const g=groupById3C4(gid),gate=groupChatEligibility3C4(g);if(!g||!gate.ok){toast(gate?.reason||'Group chat unavailable.');return}
 const t=groupChatRecord3C4(gid,{create:true});for(const m of t.msgs)if(m.senderId!==COMM3C4_PLAYER_ID&&!m.read){m.read=true;m.readAt=currentDate();resolveNotificationsFor(m.id)}
 const rows=t.msgs.slice(-20).map(m=>{const p=m.senderId===COMM3C4_PLAYER_ID?null:personById(m.senderId),who=m.senderId===COMM3C4_PLAYER_ID?'You':p?firstName(p):'Former member';return `<div class="bubble ${m.senderId===COMM3C4_PLAYER_ID?'me':'them'}"><b>${esc(who)}</b><span>${esc(m.text)}</span><small>${esc(messageTimeLabel3C2(m))}</small></div>`}).join('')||'<p class="muted-text">No messages yet.</p>';
 openModal(`${g.name} • Group chat`,`<div class="chat-thread">${rows}</div><div class="modal-action-grid"><button class="small" data-group-chat-send="hello" data-group-id="${g.id}">Say hi</button><button class="small" data-group-chat-send="plan" data-group-id="${g.id}">Suggest plans</button><button class="small" data-group-chat-send="joke" data-group-id="${g.id}">Share an inside joke</button><button class="ghost small" data-chat-back="1">All messages</button></div>`)
}
function sendGroupMessage3C4(gid,kind){
 const g=groupById3C4(gid);if(!g)return null;const text=kind==='plan'?'Anyone want to make plans this weekend?':kind==='joke'&&g.jokes?.length?`Still thinking about ${g.jokes[0]} 😂`:'hey everyone 👋';const m=groupChatAdd3C4(gid,COMM3C4_PLAYER_ID,text,kind,{device:'smartphone'});if(m){advanceTime(2,{silent:true});S.needs.social=clamp(S.needs.social+1)}return m
}

function groupHtml(){
 migrateCommunication3C4();const gs=S.groups||[];if(!gs.length)return '<p class="muted-text">A friend group forms naturally once you have a few close friends (up to 3 groups).</p>';
 return gs.map(g=>{const gate=groupChatEligibility3C4(g),un=unreadGroup3C4(g.id);return `<div class="group-block"><p><b>${esc(g.name)}</b> • since ${formatDate(g.formed)}</p><p class="muted-text">${g.members.map(id=>personById(id)).filter(Boolean).map(p=>esc(displayName(p))).join(', ')}</p>${g.jokes.length?`<small class="muted-text">Inside jokes: ${g.jokes.map(esc).join(' • ')}</small>`:''}<div class="inline-actions"><button class="small" data-group-plan="${g.id}">Plan a group outing (this weekend)</button>${gate.ok?`<button class="small ghost" data-group-chat-open="${g.id}">Group chat${un?` (${un})`:''}</button>`:`<span class="tag">Chat locked</span>`}</div>${!gate.ok?`<small class="muted-text">${esc(gate.reason)}</small>`:''}</div>`}).join('')
}

function contactControlHtml3C4(p){
 const r=contactRecord3C1(p);if(!r||isFamilyPerson(p))return'';if(r.status==='blocked'||r.blocked)return `<button class="ghost" data-contact-unblock="${p.id}">Unblock contact</button>`;if(r.status==='active')return `<button class="ghost" data-contact-block="${p.id}">Block</button><button class="ghost" data-contact-remove="${p.id}">Remove contact</button>`;return''
}
function directContactButtons3C1(p){
 migrateCommunication3C4();const bits=[],r=contactRecord3C1(p);if(r?.status==='blocked'||r?.blocked){bits.push(`<button class="ghost" data-contact-unblock="${p.id}">Unblock contact</button>`);return bits.join('')}
 if(canDirectCommunicate3C1(p,'message'))bits.push(`<button data-person-action="message" data-person-id="${p.id}">Message</button>`);if(canDirectCommunicate3C1(p,'call'))bits.push(`<button data-person-action="call" data-person-id="${p.id}">Call</button>`);if(usableSmartphone3C1()&&canDirectCommunicate3C1(p,'video'))bits.push(`<button data-person-action="videoCall" data-person-id="${p.id}">Video call</button>`);
 const g=contactExchangeEligibility3C1(p);if(!isFamilyPerson(p)&&!g.already&&g.ok)bits.push(`<button data-contact-exchange="${p.id}">Exchange contact</button>`);if(typeof watchContactActionHtml3C3==='function'){const w=watchContactActionHtml3C3(p);if(w)bits.push(w)}if(r?.status==='active'&&!isFamilyPerson(p))bits.push(contactControlHtml3C4(p));return bits.join('')
}
function setContactStatus3C4(personId,status){
 migrateCommunication3C4();const p=personById(personId),r=contactRecord3C1(personId);if(!p||!r)return null;if(!['active','blocked','removed'].includes(status))return null;
 r.status=status;r.blocked=status==='blocked';r.removed=status==='removed';r.statusChangedDate=currentDate();r.statusChangedMinute=currentMinute();if(status==='blocked')r.blockedDate=currentDate();if(status==='removed')r.removedDate=currentDate();
 if(status==='active'){r.unblockedDate=currentDate();r.blocked=false;r.removed=false}return r
}
function blockContact3C4(id){const p=personById(id),r=setContactStatus3C4(id,'blocked');if(r)log('Contact blocked',`${firstName(p)} can no longer send normal direct messages or calls. Your People history is unchanged.`);return r}
function unblockContact3C4(id){const p=personById(id),r=setContactStatus3C4(id,'active');if(r)log('Contact unblocked',`${firstName(p)} can contact you again through the saved channels.`);return r}
function removeContact3C4(id){const p=personById(id),r=setContactStatus3C4(id,'removed');if(r)log('Contact removed',`${firstName(p)} remains in People, but the saved communication path is removed.`);return r}

function communicationMemoryKey3C4(p,key){return `${p.id}:${key}`}
function rememberCommunication3C4(p,key,text,importance=3){const c=communication3C4State(),k=communicationMemoryKey3C4(p,key);if(c.memoryKeys[k])return false;c.memoryKeys[k]=currentDate();rememberPerson(p,text,importance);return true}
function communicationMemoryFromMessage3C4(p,m){if(!p||!m)return;if(['romanceResolve','support'].includes(m.kind))rememberCommunication3C4(p,`msg:${m.kind}`,m.kind==='romanceResolve'?'You had a serious relationship conversation by message.':'They checked in when you needed support.',3)}
function communicationMemoryFromCall3C4(p,call,ctx=''){if(!p||!call||call.outcome!=='completed')return;const late=(call.minute>=1260||call.minute<300);if(late&&tierRank(p)>=3)rememberCommunication3C4(p,'lateCall','You shared your first meaningful late-night call.',3);if(ctx&&/support|serious|romanc/i.test(ctx))rememberCommunication3C4(p,'meaningfulCall',`A meaningful ${call.callType==='video'?'video ':''}call became part of your relationship history.`,3)}

function romanticCommunicationPerson3C4(){const p=partnerPerson?.();if(p&&canDirectCommunicate3C1(p,'message'))return p;return null}
function romanticMessageKind3C4(p){
 const L=ensureLove(p),today=currentDate(),soon=(S.plans||[]).find(x=>x.romantic&&x.personId===p.id&&x.status==='Accepted'&&x.dateISO>=today&&daysBetween(today,x.dateISO)<=1);if(soon)return'dateConfirm';
 const last=(L.dateHistory||[]).at(-1);if(last&&daysBetween(last.dateISO,today)<=1)return'postDate';if((p.conflict||0)>=20)return'romanceResolve';
 if(L.relationshipStartDate&&L.relationshipStartDate.slice(5)===today.slice(5))return'anniversaryHook';return currentMinute()<60?'goodnight':'partnerCheckin'
}
function scheduleRomanticCommunication3C4(){
 const p=romanticCommunicationPerson3C4();if(!p||SIM.skipping)return false;const c=communication3C4State(),next=c.romanceNextContact[p.id];if(next&&currentDate()<next)return false;const kind=romanticMessageKind3C4(p),important=['dateConfirm','postDate','romanceResolve','anniversaryHook'].includes(kind);if(!important&&!chance(34))return false;
 const minute=kind==='goodnight'?1260+Math.floor(Math.random()*90):kind==='dateConfirm'?1020+Math.floor(Math.random()*180):840+Math.floor(Math.random()*360);c.romanceNextContact[p.id]=addDays(currentDate(),important?1:2+Math.floor(Math.random()*3));
 if(kind==='goodnight'&&usableSmartphone3C1()&&canDirectCommunicate3C1(p,'video')&&chance(20)){scheduleFollowUp('incomingCall',{personId:p.id,why:'romanceVideo'},{minute});return true}
 scheduleFollowUp('incomingMsg',{personId:p.id,kind},{minute});return true
}
function communicationKnowledgeCanMention3C4(senderOrId,topic,targetId=null){
 const p=typeof senderOrId==='string'?personById(senderOrId):senderOrId;if(!p)return false;
 if(topic==='ownRelationship')return p.id===S.romance?.partnerId;
 if(topic==='groupShared')return !!groupsOf(p.id).length;
 if(topic==='playerRomance'){if(p.id===S.romance?.partnerId)return true;const known=[...(p.knownRomanceIds||[]),...(p.observedRelationshipIds||[])];return !!targetId&&known.includes(targetId)}
 return false
}
function communication3C4Daily(){
 migrateCommunication3C4();scheduleRomanticCommunication3C4();if(!usableSmartphone3C1())return;for(const g of S.groups||[])if(groupChatEligibility3C4(g).ok&&groupChatCanInitiate3C4(g)&&chance(8))maybeGroupMessage3C4(g,{force:true})
}

// Replace the 3C.2 Messages landing view with one that keeps direct and group
// unread states separate. Direct S.chats remains untouched.
function openMessagesModal(){
 migrateCommunication3C4();chatView=null;const available=communicationContacts3C1('message');const ids=available.map(p=>p.id).filter(id=>personById(id)).sort((a,b)=>{const aa=visibleChatMessages3C1(a),bb=visibleChatMessages3C1(b),la=aa.slice(-1)[0],lb=bb.slice(-1)[0];return stamp(lb?.dateISO||'0000-01-01',lb?.minute||0).localeCompare(stamp(la?.dateISO||'0000-01-01',la?.minute||0))});
 const direct=ids.length?ids.map(id=>{const p=personById(id),msgs=visibleChatMessages3C1(id),last=msgs.slice(-1)[0],un=msgs.filter(m=>m.from==='them'&&!m.read).length;return `<button class="chat-row" data-chat-open="${id}"><b>${esc(displayName(p))}</b><small>${esc(friendTier(p)||p.role)} • ${esc((last?.from==='me'?'You: ':'')+(last?.text||'No messages yet'))}</small>${un?`<em class="subtab-badge">${un}</em>`:''}</button>`}).join(''):'<p class="muted-text">No available direct contacts yet.</p>';
 const groups=(S.groups||[]).filter(g=>groupChatEligibility3C4(g).ok),groupRows=groups.length?groups.map(g=>{const msgs=visibleGroupMessages3C4(g.id),last=msgs.slice(-1)[0],un=unreadGroup3C4(g.id),sender=last?.senderId===COMM3C4_PLAYER_ID?'You':last?.senderId?firstName(personById(last.senderId)):'No one';return `<button class="chat-row" data-group-chat-open="${g.id}"><b>${esc(g.name)}</b><small>Group • ${esc(last?`${sender}: ${last.text}`:'No messages yet')}</small>${un?`<em class="subtab-badge">${un}</em>`:''}</button>`}).join(''):'<p class="muted-text">No eligible group chats yet.</p>';
 openModal('Messages',`<h4>Direct messages ${unreadDirect3C2()?`<span class="tag">${unreadDirect3C2()} unread</span>`:''}</h4>${direct}<h4>Group chats ${unreadGroup3C4()?`<span class="tag">${unreadGroup3C4()} unread</span>`:''}</h4>${groupRows}<p class="muted-text">Group chat needs a smartphone and message-capable contacts for every current member.</p>`)
}

function communication3C4Click(b){const d=b.dataset;
 if(d.groupChatOpen){openGroupThread3C4(d.groupChatOpen);return true}
 if(d.groupChatSend){sendGroupMessage3C4(d.groupId,d.groupChatSend);openGroupThread3C4(d.groupId);save();return true}
 if(d.contactBlock){blockContact3C4(d.contactBlock);closeChoiceModal();save();render();return true}
 if(d.contactUnblock){unblockContact3C4(d.contactUnblock);closeChoiceModal();save();render();return true}
 if(d.contactRemove){removeContact3C4(d.contactRemove);closeChoiceModal();save();render();return true}
 return false
}

CHAT_KINDS.dateConfirm=CHAT_KINDS.dateConfirm||{texts:['Still excited for our date? ❤️','Just confirming — we are still on for our date, right?'],opts:[['warm','Definitely ❤️'],['agree','Yes, see you then!'],['later','I need to check something.']]};
CHAT_KINDS.postDate=CHAT_KINDS.postDate||{texts:['I had a really nice time with you today.','Made it home. I keep smiling about earlier ❤️'],opts:[['warm','Me too ❤️'],['agree','I had a great time.'],['short','Glad you got home safe.']]};
CHAT_KINDS.goodnight=CHAT_KINDS.goodnight||{texts:['Goodnight ❤️ sleep well','Before I sleep: I hope tomorrow is kind to you.'],opts:[['warm','Goodnight ❤️'],['comfort','Sleep well too.'],['short','night!']]};
CHAT_KINDS.partnerCheckin=CHAT_KINDS.partnerCheckin||{texts:['How is your day actually going?','Checking in. You okay?'],opts:[['warm','Better now that you asked ❤️'],['comfort','A little stressed, honestly.'],['short','I’m okay.']]};
CHAT_KINDS.romanceResolve=CHAT_KINDS.romanceResolve||{texts:['Can we talk about what has felt off lately? I do not want to ignore it.','I hate that things feel tense between us. Can we talk?'],opts:[['listen','I’m listening.'],['direct','Yes. We should talk honestly.'],['later','Can we talk later when I can focus?']]};
CHAT_KINDS.anniversaryHook=CHAT_KINDS.anniversaryHook||{texts:['I know we are not making a huge thing of it, but I remembered what today is ❤️','Do you realize what day it is? I remembered us.'],opts:[['warm','I remembered too ❤️'],['agree','That means a lot.'],['joke','Look at you remembering dates 😄']]};
