// PHASE 6B.4 — School Prom dancing and bounded interactive activities.
// All actions extend the actual B1/B3 venue attendance. No award or romance inference.
const PROM_MOMENTS_SCHEMA_6B4=1;
const PROM_MOMENTS_COST_6B4={solo:15,dance:15,talk:10,break:10,refresh:8,moment:12};
function promMomentsRecord6B4(pr=S?.school?.prom){
 const n=promNightRecord6B1(pr),m=n?.moments6B4;
 return n&&m?.eventId===n.eventId&&m.schoolId===n.schoolId&&m.venue===n.venue?m:null;
}
function ensurePromMoments6B4(pr=S?.school?.prom){
 const n=promNightRecord6B1(pr),a=promArrivalRecord6B3(pr);
 if(!n||!a||a.eventId!==n.eventId||!n.attendanceRecorded)return null;
 if(promMomentsRecord6B4(pr))return n.moments6B4;
 // Backfill ONLY the empty activity ledger for real checked-in events, not historical Prom claims.
 if(n.status!=='attending'||!promArrivalGate6B3().ok)return null;
 n.moments6B4={schemaVersion:PROM_MOMENTS_SCHEMA_6B4,eventId:n.eventId,schoolId:n.schoolId,venue:n.venue,
  activities:[],danceAttempts:[],talkedNpcIds:[],soloCount:0,breakCount:0,refreshCount:0,momentCount:0};
 return n.moments6B4;
}
function promMomentsGate6B4(kind,npcId=null){
 const g=promArrivalGate6B3();if(!g.ok)return g;
 const pr=S.school.prom,n=promNightRecord6B1(pr),a=reconcilePromArrival6B3(pr),m=ensurePromMoments6B4(pr);
 if(!m||m.eventId!==a.eventId)return {ok:false,reason:'activity_not_available'};
 if(!Object.hasOwn(PROM_MOMENTS_COST_6B4,kind))return {ok:false,reason:'unknown_activity'};
 const cost=PROM_MOMENTS_COST_6B4[kind];
 if(currentMinute()+cost>n.endMinute)return {ok:false,reason:'not_enough_time'};
 if(kind==='solo'&&m.soloCount>=2||kind==='break'&&m.breakCount>=2||kind==='refresh'&&m.refreshCount>=2||kind==='moment'&&m.momentCount>=2)return {ok:false,reason:'activity_limit'};
 let npc=null,person=null;
 if(kind==='dance'||kind==='talk'){
  npc=npcById(npcId);
  if(!npc||!a.attendeeIds.includes(npcId)||!promCourtSchoolPeer6A4(npc,pr))return {ok:false,reason:'student_not_present'};
  // Introduce yourself first; no ungrounded social connections or fabricated People entries.
  person=(S.people||[]).find(p=>p.npcId===npcId&&!isFamilyPerson(p));
  if(!person||!a.greetings.some(x=>x.npcId===npcId))return {ok:false,reason:'greet_first'};
  if(kind==='dance'&&m.danceAttempts.some(x=>x.npcId===npcId))return {ok:false,reason:'already_asked_to_dance'};
  if(kind==='talk'&&m.talkedNpcIds.includes(npcId))return {ok:false,reason:'already_talked'};
 }
 return {ok:true,pr,n,a,m,npc,person,cost};
}
function promMomentsDanceConsent6B4(g){
 const p=g.person,n=g.npc,comp=g.a.companion?.status==='present'&&g.a.companion.npcId===n.id;
 // A companion still has agency. Trust, closeness and documented temperament influence the response.
 if(p.available===false||n.available===false||n.promDeclinesDance===true)return {accepted:false,reason:'They politely decline to dance.'};
 const closeness=Number(p.rel??45),trust=Number(p.trust??45);
 const disposition=(n.traits||[]).includes('Shy')?-14:(n.traits||[]).includes('Outgoing')?9:0;
 const likelihood=Math.max(12,Math.min(94,30+closeness*.36+trust*.17+(comp?17:0)+disposition));
 const roll=hashOf(`${g.m.eventId}|dance|${n.id}`)%100;
 return roll<likelihood?{accepted:true,reason:comp?'Your companion agrees to share a dance.':'They smile and agree to dance.'}:
  {accepted:false,reason:comp?'Your companion would rather rest for this song.':'They politely decline this dance.'};
}
function promMomentsAction6B4(kind,npcId=null){
 const g=promMomentsGate6B4(kind,npcId);if(!g.ok)return g;
 const {m,person,npc,cost}=g,at={dateISO:currentDate(),minute:currentMinute()};
 let accepted=true,description='',effects={fun:0,social:0,energy:0,hunger:0};
 if(kind==='dance'){
  const consent=promMomentsDanceConsent6B4(g);accepted=consent.accepted;description=consent.reason;
  m.danceAttempts.push({npcId,personId:person.id,accepted,reason:description,...at});
  effects=accepted?{fun:9,social:7,energy:-7,hunger:0}:{fun:-1,social:0,energy:-2,hunger:0};
  if(accepted){person.rel=clamp((person.rel??48)+2);person.trust=clamp((person.trust??40)+1);rememberPerson(person,`You danced together at ${g.pr.venue} during Prom.`,2)}
 }else if(kind==='talk'){
  m.talkedNpcIds.push(npcId);description=`You catch up with ${displayName(person)} about the music and school year.`;
  person.rel=clamp((person.rel??48)+2);effects={fun:3,social:8,energy:-2,hunger:0};
  rememberPerson(person,'You chatted together at your school Prom.',1);
 }else if(kind==='solo'){
  m.soloCount++;description='You join the dance floor for a favorite song, enjoying your own company.';
  effects={fun:10,social:3,energy:-6,hunger:0};
 }else if(kind==='break'){
  m.breakCount++;description='You find a seat at the edge of the decorated hall and take a breather.';
  effects={fun:2,social:0,energy:6,hunger:0};
 }else if(kind==='refresh'){
  m.refreshCount++;description='You enjoy a glass of water and a small snack from the school event table.';
  effects={fun:3,social:1,energy:2,hunger:-9};
 }else if(kind==='moment'){
  const scenes=['A familiar song comes on and the hall breaks into a singalong.',
   'A decoration drifts down, making your table laugh before staff put it back.',
   'You and nearby students share a laugh over an unexpectedly energetic DJ announcement.'];
  description=scenes[hashOf(`${m.eventId}|moment|${m.momentCount}`)%scenes.length];
  m.momentCount++;effects={fun:6,social:2,energy:-3,hunger:0};
 }
 const record={kind,npcId:kind==='dance'||kind==='talk'?npcId:null,personId:person?.id||null,accepted,description,...at,cost};
 m.activities.push(record);
 // Canonical time progression owns routine needs changes; bounded contextual adjustments.
 advanceTime(cost,{silent:true});
 if(S.needs){S.needs.fun=clamp((S.needs.fun??50)+effects.fun);S.needs.social=clamp((S.needs.social??50)+effects.social);
  S.needs.hunger=clamp((S.needs.hunger??50)+effects.hunger)}
 S.energy=clamp((S.energy??50)+effects.energy);
 log('Prom Night · '+kind,description);
 return {ok:true,kind,accepted,description,eventId:m.eventId,minutes:cost};
}
function promMomentsHtml6B4(pr=S?.school?.prom){
 const n=promNightRecord6B1(pr),a=promArrivalRecord6B3(pr);
 if(!n||n.status!=='attending'||!a)return '';
 const m=ensurePromMoments6B4(pr),g=promArrivalGate6B3();if(!m)return '';
 const allow=(kind,id)=>g.ok&&promMomentsGate6B4(kind,id).ok;
 const options=a.attendeeIds.filter(id=>a.greetings.some(x=>x.npcId===id))
  .map(id=>({id,npc:npcById(id),p:(S.people||[]).find(x=>x.npcId===id&&!isFamilyPerson(x))})).filter(x=>x.npc&&x.p);
 const btn=(kind,label)=>`<button class="small ghost" data-prom-moment6b4="${kind}" ${allow(kind)?'':'disabled'}>${label}</button>`;
 return `<section class="prom-moments-6b4" data-prom-moments6b4="${esc(m.eventId)}"><h4>Prom Night · Dance floor & lounge</h4>`+
 `<p class="muted-text">Your choices take real time. Classmates may decline dances. Nothing here changes Court ballots or grants automatic romance.</p>`+
 `<div class="prom-moment-actions-6b4">${btn('solo','Dance on your own · 15 min')}${btn('break','Take a break · 10 min')}${btn('refresh','Water & snacks · 8 min')}${btn('moment','Enjoy the atmosphere · 12 min')}</div>`+
 `<div class="prom-moment-people-6b4">${options.slice(0,12).map(x=>`<div class="prom-moment-person-6b4"><span>${esc(displayName(x.p))}${a.companion?.npcId===x.id?' · Prom companion':''}</span><div class="inline-actions"><button class="small ghost" data-prom-moment6b4="talk" data-npc-id="${esc(x.id)}" ${allow('talk',x.id)?'':'disabled'}>Talk</button><button class="small ghost" data-prom-moment6b4="dance" data-npc-id="${esc(x.id)}" ${allow('dance',x.id)?'':'disabled'}>Ask to dance</button></div></div>`).join('')||'<p class="muted-text">Greet an attendee above to unlock conversations or dance invitations.</p>'}</div>`+
 `<p class="muted-text">Recorded activities: ${m.activities.length} · Solo dances: ${m.soloCount}/2 · Breaks: ${m.breakCount}/2 · Refreshments: ${m.refreshCount}/2</p>`+
 (m.activities.length?`<div class="prom-moment-history-6b4">${m.activities.slice(-3).reverse().map(x=>`<p class="muted-text">${esc(x.description)}</p>`).join('')}</div>`:'')+'</section>';
}
function promMomentsClick6B4(b){const k=b?.dataset?.promMoment6b4;if(!k)return false;
 const r=promMomentsAction6B4(k,b.dataset.npcId||null);
 if(!r.ok)toast('Prom activity: '+r.reason.replaceAll('_',' '));save();render();return true;
}
