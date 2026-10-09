// =====================================================================
// H8 — mutually agreed calls, night-device permissions, curfew consistency.
// Reuse 3C1 permissions, 3C2 S.callLog and H5 outcome recorder.
// =====================================================================
const H8_CALL_VERSION=1;
function h8State(){
 const c=ensureCommunication3C1();
 c.nightCallsH8=c.nightCallsH8&&typeof c.nightCallsH8==='object'&&!Array.isArray(c.nightCallsH8)?c.nightCallsH8:{};
 const r=c.nightCallsH8;r.version=H8_CALL_VERSION;
 r.records=Array.isArray(r.records)?r.records.filter(x=>x&&typeof x==='object'&&x.id&&x.personId&&x.dateISO&&Number.isInteger(Number(x.minute))).slice(-80):[];
 return r;
}
function migrateNightCallsH8(){return h8State()}
function h8MinuteNow(day=currentDate(),minute=currentMinute()){return day===currentDate()?minute:day<currentDate()?1440:-1}
function h8CallChannel(video){return video?'video':'call'}
function h8SlotKey(personId,dateISO,minute,video){return `${personId}|${dateISO}|${minute}|${video?'video':'voice'}`}
function h8TimeValid(dateISO,minute){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(String(dateISO||''))||!Number.isInteger(minute))return false;
 const diff=daysBetween(currentDate(),dateISO);
 return diff>=0&&diff<=7&&minute>=1140&&minute<=1410&&minute+20<=1440&&(diff!==0||minute>currentMinute()+10);
}
function h8NpcAvailability(p,dateISO,minute){
 if(!p||p.deceased||p.movedAway)return {ok:false,reason:'This person is not available.'};
 if(minute<390||minute>=1410)return {ok:false,reason:'Calling at this hour would disturb their sleep.'};
 const st=npcStatusAt(p,dateISO,minute);
 if(!st.free)return {ok:false,reason:st.why||'They are not available at that time.'};
 // A teen's late-night device use is not automatic even if they like the player.
 const age=typeof personAge==='function'?personAge(p):(p.age||S.age);
 if(age<18&&minute>=1350)return {ok:false,reason:'Their household has a 10:30 PM bedtime.'};
 return {ok:true,reason:'A possible free time, not yet an agreement.'};
}
function h8PlayerPermissionNeeded(minute){return S.age<18&&livesWithParents()&&minute>=bedtimeMinute()}
function h8CallSlotGate(p,dateISO,minute,video=false){
 const ch=h8CallChannel(video),comm=communicationEligibility3C1(p,ch);
 if(!comm.ok)return {ok:false,reason:comm.reason||'A usable authorized device and exchanged contact are required.'};
 if(!h8TimeValid(dateISO,minute))return {ok:false,reason:'Choose a future evening slot within seven days (19:00–23:30), at least ten minutes ahead.'};
 if(S.age<13&&!isFamilyPerson(p)&&minute>=bedtimeMinute())return {ok:false,reason:'Ask for an earlier call while you are this young.'};
 const av=h8NpcAvailability(p,dateISO,minute);if(!av.ok)return av;
 if(S.age<18&&S.location==='School'&&dateISO===currentDate()&&minute<=currentMinute()+30)return {ok:false,reason:'Arrange this after school.'};
 const overlap=h8State().records.some(x=>x.status==='Accepted'&&x.dateISO===dateISO&&Math.abs(x.minute-minute)<30);
 if(overlap)return {ok:false,reason:'You already have an accepted call around that time.'};
 const conflict=(S.calendar||[]).find(e=>e.dateISO===dateISO&&!isTerminal(e.status)&&e.startMinute!=null&&e.endMinute!=null&&minute<e.endMinute&&e.startMinute<minute+20&&(e.required===true||['prom','party','wedding','workDay','plan','schoolEvent'].includes(e.type)));
 if(conflict)return {ok:false,reason:`This would overlap ${conflict.title||'another commitment'}. Choose a different time.`};
 return {ok:true,device:comm.device,needsGuardian:h8PlayerPermissionNeeded(minute)};
}
function h8ResponseScore(p,dateISO,minute){
 const traits=p.traits||[],busy=traits.includes('Busy')?12:0,shy=traits.includes('Shy')?7:0;
 return clamp(52+(p.rel||0)*.20+(p.trust||50)*.16-(p.conflict||0)*.25-busy-shy-(minute>=1320?9:0),14,91)
}
function h8Propose(personId,dateISO,minute,video=false){
 const p=personById(personId),m=Number(minute),ch=h8CallChannel(!!video),key=h8SlotKey(personId,dateISO,m,!!video),s=h8State();
 const existing=s.records.find(x=>x.key===key);if(existing)return {ok:true,reused:true,record:existing};
 const gate=h8CallSlotGate(p,dateISO,m,!!video);if(!gate.ok)return {ok:false,reason:gate.reason};
 let guardian='not_required';
 if(gate.needsGuardian){
  if(!decisionAuthorityPerson())return {ok:false,reason:'A parent or guardian must approve a call after bedtime.'};
  const rules=familyRules(),score=clamp(69-(rules.strictness||50)*.35+(S.family.trust??60)*.22-(m-bedtimeMinute())*.16,9,88);
  if(!chance(score)){
   const rec={id:uid('nightCall'),key,personId,dateISO,minute:m,video:!!video,requestedDate:currentDate(),status:'Declined',response:'Guardian declined',guardianApproval:'declined',reason:'Your caregiver does not agree to this call after bedtime.'};s.records.unshift(rec);log('Late call declined',rec.reason);return {ok:true,record:rec};
  }
  guardian='approved';
 }
 const score=h8ResponseScore(p,dateISO,m),accepted=chance(score),reason=accepted?`${firstName(p)} agrees to ${video?'video chat':'call'} at ${timeLabel(m)}.`:`${firstName(p)} cannot promise a call at that time. They suggest trying another day.`;
 const rec={id:uid('nightCall'),key,personId,dateISO,minute:m,video:!!video,requestedDate:currentDate(),status:accepted?'Accepted':'Declined',response:accepted?'Accepted':'Declined',guardianApproval:guardian,guardianId:gate.needsGuardian?decisionAuthorityPerson()?.id||null:null,deviceAtRequest:gate.device,reason};
 s.records.unshift(rec);if(s.records.length>80)s.records.length=80;
 if(accepted)createCalendarEvent({id:'h8-call-'+rec.id,type:'scheduledCallH8',title:`${video?'Video':'Phone'} call with ${displayName(p)}`,dateISO,startMinute:m,endMinute:m+20,graceMinute:m+20,required:false,location:'Phone',status:'Scheduled',source:'H8',sourceId:rec.id,participants:[p.id],payload:{callId:rec.id}});
 log(accepted?'Call agreed':'Call not arranged',reason);return {ok:true,record:rec};
}
function h8JoinGate(rec){
 if(!rec||rec.status!=='Accepted')return {ok:false,reason:'This call is not an active agreement.'};
 const p=personById(rec.personId);if(!p)return {ok:false,reason:'Contact unavailable.'};
 const gate=communicationEligibility3C1(p,h8CallChannel(rec.video));if(!gate.ok)return {ok:false,reason:gate.reason||'Device/contact permission is no longer valid.'};
 if(currentDate()!==rec.dateISO||currentMinute()<rec.minute||currentMinute()>rec.minute+20)return {ok:false,reason:'Join during the agreed twenty-minute check-in window.'};
 if(S.age<18&&rec.minute>=bedtimeMinute()&&rec.guardianApproval!=='approved')return {ok:false,reason:'A caregiver must have approved this late call.'};
 if(S.age<18&&S.location==='School')return {ok:false,reason:'You cannot join from class.'};
 if(S.age<18&&S.location!=='Home'&&curfewMinute()!=null&&currentMinute()>=curfewMinute())return {ok:false,reason:'Go home first; a phone call is not permission to remain out past curfew.'};
 const av=h8NpcAvailability(p,currentDate(),currentMinute());if(!av.ok)return av;
 return {ok:true,device:gate.device,person:p};
}
function h8Join(id){
 const rec=h8State().records.find(x=>x.id===id),g=h8JoinGate(rec);
 if(!g.ok)return{ok:false,reason:g.reason};
 const p=g.person,duration=Math.max(1,Math.min(20,1440-currentMinute(),(personAge(p)<18?1350:1410)-currentMinute()));
 if(duration<5)return{ok:false,reason:'Too close to bedtime for a proper conversation.'};
 // Canonical 3C2 call and H5 exactly-once outcome, rather than a second phone ledger.
 rec.status='Completed';rec.completedDate=currentDate();rec.completedMinute=currentMinute();
 const record=recordCall3C2(p,{direction:'outgoing',callType:rec.video?'video':'voice',outcome:'completed',duration,device:g.device,why:'scheduledNightH8'});
 rec.callId=record?.id||null;h8UpdateCalendar(rec,'Completed','Joined scheduled call');
 if(typeof applyRelationshipOutcomeH5==='function'&&record)applyRelationshipOutcomeH5(p.id,rec.video?'videoCall':'voiceCall','completed',{transactionId:'call:'+record.id,dailyKey:rec.video?'videoCall':'voiceCall',gain:rec.video?3:2});
 p.rel=clamp((p.rel||0)+1);p.trust=clamp((p.trust||0)+1);S.needs.social=clamp(S.needs.social+6);
 rememberPerson(p,`You had a mutually planned ${rec.video?'video':'voice'} call.`);
 log('Scheduled call completed',`You and ${firstName(p)} catch up for ${duration} minutes.`,true);
 advanceTime(duration,{silent:true});return {ok:true,record:rec,call:record};
}
function h8Tick(){
 if(!S?.communication?.nightCallsH8?.records)return 0;
 let changed=0;
 for(const rec of S.communication.nightCallsH8.records){
  if(rec.status!=='Accepted')continue;
  if(currentDate()>rec.dateISO||(currentDate()===rec.dateISO&&currentMinute()>rec.minute+20)){
   rec.status='Missed';rec.reason='The agreed time passed without a completed call.';rec.missedDate=currentDate();h8UpdateCalendar(rec,'Missed',rec.reason);changed++;
  }
 }
 return changed;
}
function h8CalendarTickById(id){const ev=(S.calendar||[]).find(x=>x.id===id);return ev?h8CalendarTick(ev):null}
function h8UpdateCalendar(rec,status,reason=''){
 const ev=(S.calendar||[]).find(e=>e.id==='h8-call-'+rec.id);
 if(ev)setCalendarStatus(ev,status,reason);
}
function h8CalendarTick(ev){
 const rec=h8State().records.find(x=>x.id===ev.payload?.callId);
 if(!rec){setCalendarStatus(ev,'Cancelled','Call agreement not found');return}
 if(['Completed','Missed','Cancelled'].includes(rec.status)){h8UpdateCalendar(rec,rec.status,rec.reason||'Call state reconciled');return}
 if(rec.status!=='Accepted'){setCalendarStatus(ev,'Cancelled','No accepted call');return}
 if(currentDate()>rec.dateISO||(currentDate()===rec.dateISO&&currentMinute()>rec.minute+20)){h8Tick();return}
 if(currentDate()===rec.dateISO&&currentMinute()>=rec.minute&&ev.status==='Scheduled'){
  setCalendarStatus(ev,'Due','Scheduled call time');
  if(!SIM.skipping)notify('📞 Scheduled call now',`${firstName(personById(rec.personId))} agreed to ${rec.video?'video chat':'call'} at ${timeLabel(rec.minute)}. Join from Phone → Calls.`,{sourceType:'calendar',sourceId:ev.id,tab:'phone'});
 }
}
function h8Cancel(id){const r=h8State().records.find(x=>x.id===id);if(!r||r.status!=='Accepted')return{ok:false};r.status='Cancelled';r.reason='You cancelled ahead of the call.';h8UpdateCalendar(r,'Cancelled',r.reason);log('Call cancelled',r.reason);return{ok:true}}
function h8CallPanel(personId=null){
 const s=h8State(),contacts=communicationContacts3C1('call').filter(p=>!personId||p.id===personId).slice(0,12);
 const entries=s.records.slice(0,6).map(r=>{const p=personById(r.personId),when=`${formatDate(r.dateISO)} · ${timeLabel(r.minute)}`;
 const join=h8JoinGate(r);return `<div class="opportunity-row"><div><b>${esc(p?displayName(p):'Unknown contact')}</b><small>${esc(when)} · ${r.video?'Video':'Voice'} · ${esc(r.status)}${r.reason?' · '+esc(r.reason):''}</small></div><div class="inline-actions">${r.status==='Accepted'&&join.ok?`<button class="small primary" data-h8-join="${esc(r.id)}">Join call</button>`:''}${r.status==='Accepted'?`<button class="small ghost" data-h8-cancel="${esc(r.id)}">Cancel</button>`:''}</div></div>`}).join('')||'<p class="muted-text">No planned calls yet.</p>';
 const options=contacts.map(p=>`<button class="small ghost" data-h8-plan="${esc(p.id)}">Choose time · ${esc(displayName(p))}</button>`).join('')||'<p class="muted-text">Exchange phone-capable contacts before planning a call.</p>';
 return `<section class="card wide" data-h8-panel="1"><h3>📞 Planned calls</h3><p class="muted-text">An agreed time is not an automatic call. Join when both of you are available. After-bedtime calls require permission, and a phone agreement never permits a late-night outing.</p><h4>Your call arrangements</h4>${entries}<h4>Plan another call</h4><div class="inline-actions">${options}</div></section>`;
}
function h8OpenPersonSlots(personId){
 const p=personById(personId);if(!p||!canDirectCommunicate3C1(p,'call'))return;
 const days=[currentDate(),addDays(currentDate(),1)],slots=[1200,1260,1320,1330],videoOK=canDirectCommunicate3C1(p,'video');
 const rows=days.map(d=>`<h4>${d===currentDate()?'Today':'Tomorrow'} · ${esc(formatDate(d))}</h4><div class="inline-actions">${slots.map(m=>{
  const choices=[false,...(videoOK?[true]:[])];return choices.map(video=>{const g=h8CallSlotGate(p,d,m,video),label=`${timeLabel(m)} ${video?'Video':'Voice'}`;
   return g.ok?`<button class="small" data-h8-offer="${esc(p.id)}" data-h8-day="${d}" data-h8-minute="${m}" data-h8-video="${video?'1':'0'}">${esc(label)}${g.needsGuardian?' · ask caregiver':''}</button>`:`<span class="muted-text" title="${esc(g.reason||'Not available')}">${esc(label)} · unavailable</span>`;
  }).join('')}).join('')}</div>`).join('');
 openModal(`Plan a call with ${displayName(p)}`,`<p class="muted-text">Check their schedule and your own bedtime. A real NPC can still decline. Video needs a smartphone; kids' watches support voice only.</p>${rows}<button class="ghost" data-h8-view="1">Back to calls</button>`)
}
function h8Click(b){const d=b?.dataset;if(!d)return false;
 if(d.h8Offer){const x=h8Propose(d.h8Offer,d.h8Day,Number(d.h8Minute),d.h8Video==='1');if(!x.ok)toast(x.reason);else toast(x.record.reason);save();render();return true}
 if(d.h8Join){const x=h8Join(d.h8Join);if(!x.ok)toast(x.reason);save();render();return true}
 if(d.h8Cancel){h8Cancel(d.h8Cancel);save();render();return true}
 if(d.h8Plan){h8OpenPersonSlots(d.h8Plan);return true}
 if(d.h8View){openModal('Scheduled calls',h8CallPanel());return true}
 return false;
}
// Existing UI router and calls screen remain authoritative for actual dialing.
const h8PreviousLifecycle=handleLifecycleClick;
handleLifecycleClick = function(b){if(h8Click(b))return true;return h8PreviousLifecycle(b)}
const h8PreviousCalls=openCallsModal3C2;
openCallsModal3C2 = function(){h8PreviousCalls();const el=typeof document!=='undefined'?document.querySelector('#choice-content'):null; // Renderer-independent fallback via the Phone panel below.
 if(el&&el.querySelector&&!el.querySelector('[data-h8-panel]'))el.insertAdjacentHTML('beforeend',h8CallPanel());
}
const h8PreviousPhonePanel=phonePanel;
phonePanel = function(){const html=h8PreviousPhonePanel();if(!S||(!usableSmartphone3C1()&&!usableKidsWatch3C1()))return html;return html.replace(/<\/div>\s*$/,`${h8CallPanel()}</div>`)}
// Preserve the 3C.2 distinction between attempted/unavailable and completed
// calls. A blocked late dial is visible as unavailable, never rewarded.
const h8PreviousOutgoingCall=outgoingCall3C2;
outgoingCall3C2 = function(personId,video=false){
 const p=typeof personId==='string'?personById(personId):personId;
 if(p&&!isFamilyPerson(p)&&S.age<18&&livesWithParents()&&(currentMinute()>=bedtimeMinute()||currentMinute()<360)){
  const g=communicationEligibility3C1(p,video?'video':'call');
  if(!g.ok){toast(g.reason||'No authorized contact.');return null}
  recordCall3C2(p,{direction:'outgoing',callType:video?'video':'voice',outcome:'unavailable',duration:0,device:g.device,why:'bedtime_h8'});
  advanceTime(2,{silent:true});log('Call unavailable',`It is past your ${timeLabel(bedtimeMinute())} bedtime. Ask to plan a call instead.`);return null;
 }
 return h8PreviousOutgoingCall(personId,video);
};
const h8PreviousCallGate=bedtimeCommunicationGate3C3;
bedtimeCommunicationGate3C3 = function(p,channel,device){
 if(!S||!p||isFamilyPerson(p)||S.age>=18||!livesWithParents())return h8PreviousCallGate(p,channel,device);
 if(currentMinute()>=bedtimeMinute()||currentMinute()<360)return {ok:false,restricted:true,reason:`Your bedtime is ${timeLabel(bedtimeMinute())}. Ask to arrange an approved call earlier; do not dial unexpectedly after bedtime.`};
 return h8PreviousCallGate(p,channel,device);
}
const h8PreviousProcessCalendar=processCalendar;
processCalendar = function(opts){const r=h8PreviousProcessCalendar(opts);h8Tick();return r}
// The old world action gate allowed age 12 while the Romance menu required 16.
const h8PreviousCanSneak=canSneak;
canSneak = function(p){return S.age>=16&&S.age<18&&isAtHome()&&!isGrounded()&&h8PreviousCanSneak(p)}
const h8PreviousSneakOut=sneakOut;
sneakOut = function(personId,mode){
 const p=personById(personId);
 if(!canSneak(p)){toast(S.age<16?'Late-night visits are not available at your age. Arrange a daytime plan instead.':'You cannot leave after curfew in this situation.');return false}
 if(!['meet','over'].includes(mode)||!canDirectCommunicate3C1(p,'message')){toast('An agreed, reachable contact is required. Try a daytime plan.');return false}
 if(!npcStatusAt(p).free){toast(`${firstName(p)} is unavailable or asleep. Respect their schedule.`);return false}
 h8PreviousSneakOut(personId,mode);return true;
}
