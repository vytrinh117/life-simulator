// CROSS-PHASE H5 — one romance outcome ledger, context-bound quality time and stage-aware date UI.
// This module does not create a parallel date engine; Phase 3B.2 owns date plans and calendars.
const ROMANCE_H5_ACTIVITIES={
 chatDay:{label:'Talk about your day',group:'Talk',minutes:18,gain:2,trust:1,rel:1,mode:'meet',story:'You trade the small and important details of your day.'},
 shareWorry:{label:'Share exam worries',group:'Talk',minutes:24,gain:3,trust:2,rel:1,mode:'meet',story:'You listen to one another about pressure and offer reassurance.'},
 secrets:{label:'Share something personal',group:'Talk',minutes:25,gain:3,trust:3,rel:1,mode:'meet',story:'You take turns sharing something personal, keeping each other’s confidence.'},
 encourage:{label:'Cheer them up',group:'Talk',minutes:20,gain:3,trust:2,rel:1,mode:'meet',story:'You notice they have had a hard day and make time to listen.'},
 study:{label:'Study together',group:'Quality Time',minutes:60,gain:3,trust:1,rel:1,mode:'school',story:'You compare notes, help with tough questions and take a short break together.'},
 walkTogether:{label:'Walk and talk together',group:'Quality Time',minutes:35,gain:3,trust:1,rel:1,mode:'outside',story:'You share a short walk and conversation, without rushing.'},
 couplePhoto:{label:'Take a photo together',group:'Quality Time',minutes:15,gain:2,trust:0,rel:1,mode:'meet',story:'You ask to take a photo together and they smile for the camera.'},
  handmade:{label:'Give a handmade note',group:'Special Occasions',minutes:35,gain:3,trust:2,rel:1,mode:'meet',story:'You make something thoughtful and they appreciate the care.'},
 celebrate:{label:'Celebrate a small win',group:'Special Occasions',minutes:30,gain:3,trust:2,rel:1,mode:'meet',story:'You celebrate something that mattered to one of you.'},
 familyIntro:{label:'Introduce them to family',group:'Special Occasions',minutes:55,gain:4,trust:2,rel:1,mode:'home',story:'Your family meets your partner in a relaxed, respectful setting.'},
 apologize:{label:'Apologize and listen',group:'Talk',minutes:25,gain:2,trust:2,rel:0,mode:'meet',story:'You apologize, take responsibility and listen to their feelings.'},
 goodnight:{label:'Send a goodnight message',group:'Communication',minutes:5,gain:1,trust:1,rel:0,mode:'message',story:'You send a kind goodnight note; any reply depends on their availability.'},
 checkin:{label:'Send a supportive message',group:'Communication',minutes:5,gain:1,trust:1,rel:0,mode:'message',story:'You check in without demanding an immediate response.'}
};
function romanceH5CanonicalPartner(p){return !!p&&typeof isEstablishedPartner==='function'&&isEstablishedPartner(p)&&S.romance?.partnerId===p.id&&eligibleRomance(p)}
function romanceH5Store(p){const L=ensureLove(p);L.h5Outcomes=Array.isArray(L.h5Outcomes)?L.h5Outcomes:[];L.interactionDays=L.interactionDays&&typeof L.interactionDays==='object'?L.interactionDays:{};return L}
function romanceH5MeetGate(p,mode){
 if(!romanceH5CanonicalPartner(p))return {ok:false,reason:'Only an established, current partner can use these activities.'};
 if((p.conflict||0)>=80)return {ok:false,reason:'Your partner needs to resolve the serious disagreement first.'};
 if(mode==='message'){
  if(typeof canDirectCommunicate3C1!=='function'||!canDirectCommunicate3C1(p,'message'))return {ok:false,reason:'A usable device and an exchanged, unblocked contact are required.'};
  return {ok:true};
 }
 const atSchool=S.location==='School',atHome=(S.location||'Home')==='Home';
 const sameSchool=atSchool&&typeof playerCurrentSchoolId4A2==='function'&&p.npcId&&npcById(p.npcId)?.currentSchoolId&&npcById(p.npcId).currentSchoolId===playerCurrentSchoolId4A2();
 // Only a genuinely completed date or current matching school can establish co-location.
 const schoolFree=!(atSchool&&currentMinute()>=480&&currentMinute()<900);
 if(sameSchool&&!schoolFree)return {ok:false,reason:'You are in scheduled lessons. Meet during lunch or after dismissal.'};
 const recentDate=(S.plans||[]).some(x=>x.romantic&&x.personId===p.id&&x.status==='Completed'&&x.completedDate===currentDate()&&Number.isFinite(x.actualStart?.minute)&&currentMinute()>=x.actualStart.minute&&currentMinute()-x.actualStart.minute<=180&&String(x.location||'').toLowerCase().includes(String(S.location||'').toLowerCase())&&String(S.location||'Home').toLowerCase()!=='home');
 // Only 6C-confirmed, Home-venue guest attendance establishes a safe family visit.
 const actualHomeGuest=atHome&&typeof occasionRecords6C1==='function'&&occasionRecords6C1().some(rec=>rec.dateISO===currentDate()&&rec.planning6C2?.venue==='Home'&&(rec.guests6C4?.invitations||[]).some(x=>x.personId===p.id&&x.status==='Accepted'&&x.attended&&x.attendedAt?.dateISO===currentDate()&&Number.isFinite(x.attendedAt.minute)&&currentMinute()>=x.attendedAt.minute&&currentMinute()-x.attendedAt.minute<=180));
 if(mode==='home'&&!atHome)return {ok:false,reason:'Introduce family while at home.'};
 if(mode==='school'&&!sameSchool)return {ok:false,reason:'Study together requires both of you at the same school. Otherwise plan a study date.'};
 if(mode==='outside'&&!(recentDate||sameSchool))return {ok:false,reason:'You need to be together first. Plan a walk date and meet there.'};
 if(!(recentDate||sameSchool||actualHomeGuest))return {ok:false,reason:'You are not currently together. Plan a date, meet during a shared school day, or host a confirmed home occasion.'};
 if(mode==='home'&&!actualHomeGuest)return {ok:false,reason:'Introduce family during a genuinely attended, accepted home gathering.'};
 return {ok:true};
}
// Exactly-once outcome by stable source id (date-plan id or call id) or per-day activity.
// Existing callers pay time/cost separately; only interactive H5 activities spend time here.
function applyRelationshipOutcomeH5(personId,actionId,outcome,context={}){
 const p=personById(personId);if(!p)return {ok:false,reason:'Unknown person'};
 const L=romanceH5Store(p),accepted=['completed','accepted','great','good','okay','awkward'].includes(String(outcome).toLowerCase());
 if(!accepted)return {ok:false,reason:'No romantic progress: the action did not complete with consent.'};
 if(!romanceH5CanonicalPartner(p))return {ok:false,reason:'Romantic connection gains require a current established partner.'};
 const day=context.dateISO||currentDate(),token=String(context.transactionId||`${day}:${actionId}`);
 if(L.h5Outcomes.some(x=>x.token===token))return {ok:false,reused:true,reason:'This shared moment was already recorded.'};
 const interaction=L.interactionDays[day]||(L.interactionDays[day]={count:0,keys:[]});interaction.keys=Array.isArray(interaction.keys)?interaction.keys:[];
 const key=String(context.dailyKey||actionId);
 if(interaction.keys.includes(key))return {ok:false,reason:'This kind of moment has already counted today.'};
 if(interaction.count>=3)return {ok:false,reason:'Romantic connection has reached today’s 3-activity growth limit.'};
 const gain=Math.max(-3,Math.min(10,Number(context.gain)||2));
 // No mutation prior to all checks above. Never advance a stage or imply NPC commitment.
 const before=L.progress||0;L.progress=clamp(before+gain);interaction.keys.push(key);interaction.count++;
 p.trust=clamp((p.trust??50)+(Number(context.trust)||0));p.rel=clamp((p.rel??50)+(Number(context.rel)||0));
 if(context.conflict)p.conflict=clamp((p.conflict||0)+Number(context.conflict));
 L.h5Outcomes.push({token,actionId,day,outcome,gain:L.progress-before,personId:p.id});if(L.h5Outcomes.length>100)L.h5Outcomes.splice(0,L.h5Outcomes.length-100);
 return {ok:true,gain:L.progress-before,reason:L.progress===before?'Romantic connection is already at 100%.':`Romantic connection +${L.progress-before}; trust and friendship are tracked separately.`};
}
function romanceH5Activity(p,key){
 const a=ROMANCE_H5_ACTIVITIES[key];if(!p||!a)return false;
 const gate=romanceH5MeetGate(p,a.mode);if(!gate.ok){toast(gate.reason);return false}
 if(key==='apologize'&&(p.conflict||0)<5){toast('There is no disagreement that needs an apology.');return false}
 // Preflight daily limits to avoid spending time on a capped action.
 const L=romanceH5Store(p),rec=L.interactionDays[currentDate()]||{count:0,keys:[]};
 if((rec.keys||[]).includes('h5:'+key)||rec.count>=3){toast((rec.keys||[]).includes('h5:'+key)?'You have already done this together today.':'Romantic growth is capped at three distinct activities per day.');return false}
 // NPC autonomy: a genuine refusal uses no progress, keeps a modest proposal cost.
 const busy=(p.traits||[]).includes('Busy'),shy=(p.traits||[]).includes('Shy');
 if((p.conflict||0)>50||Math.random()<(busy?.24:0)+(shy?.08:0)){
  advanceTime(2,{silent:true});log('Not available',`${firstName(p)} cannot join you for ${a.label.toLowerCase()} right now. You respect their answer; nothing was scheduled or completed.`);return false;
 }
 const r=applyRelationshipOutcomeH5(p.id,'h5:'+key,'completed',{dailyKey:'h5:'+key,gain:a.gain,trust:a.trust,rel:a.rel});
 if(!r.ok){toast(r.reason);return false}
 advanceTime(a.minutes,{silent:true});
 if(a.mode==='message'&&typeof chatAdd==='function')chatAdd(p.id,'me',key==='goodnight'?'Goodnight. Hope you sleep well ❤️':'Checking in — I hope today is going okay.','romance');
 if(key==='apologize')p.conflict=clamp((p.conflict||0)-7);
 if(['handmade','familyIntro','couplePhoto'].includes(key))rememberPerson(p,a.story,2);
 log(a.label,`${a.story} ${r.reason}`);return true;
}
function romanceH5GroupHtml(p,opts,official){
 if(!official)return'';
 const groups=['Talk','Quality Time','Communication','Special Occasions'];
 return groups.map(group=>{
  const aa=Object.entries(ROMANCE_H5_ACTIVITIES).filter(([,a])=>a.group===group);
  return `<details class="h5-romance-group" ${group==='Talk'?'open':''}><summary>${esc(group)} · ${aa.length} options</summary><div class="modal-action-grid">${aa.map(([id,a])=>{
   const g=romanceH5MeetGate(p,a.mode);return `<button class="small" data-h5-action="${id}" data-person-id="${esc(p.id)}" ${g.ok?'':`title="${esc(g.reason)}"`}>${esc(a.label)}${g.ok?'': ' · check availability'}</button>`;
  }).join('')}</div></details>`;
 }).join('');
}
function romanceH5DateLabel(p){return (LOVE_IDX[ensureLove(p).stage]??0)>=LOVE_IDX.goingOut?'Plan a Date':'Ask on a First Date'}

function migrateRomanceH5(){
 if(!S||S.crossPhaseH5Version>=1)return;
 for(const p of S.people||[]){if(!p?.love)continue;romanceH5Store(p)}
 S.crossPhaseH5Version=1;
}
