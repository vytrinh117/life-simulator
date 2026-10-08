// PHASE 6B.5 — Official school Prom Court ceremony and factual photograph album.
// Only uses already-locked Phase 6A ballots and actual Phase 6B.3 Hall attendees.
const PROM_CEREMONY_SCHEMA_6B5=1;
const PROM_CEREMONY_START_6B5=1260; // 21:00 school-approved stage presentation
const PROM_CEREMONY_MINUTES_6B5=20;
const PROM_PHOTO_COST_6B5={solo:8,paired:10,group:12};
function promCeremonyRecord6B5(pr=S?.school?.prom){
 const n=promNightRecord6B1(pr),r=n?.ceremony6B5;
 return n&&r?.eventId===n.eventId&&r.schoolId===n.schoolId&&r.venue===n.venue?r:null;
}
function ensurePromCeremony6B5(pr=S?.school?.prom){
 const n=promNightRecord6B1(pr),a=promArrivalRecord6B3(pr);
 if(!n?.attendanceRecorded||!a||a.eventId!==n.eventId)return null;
 if(promCeremonyRecord6B5(pr))return n.ceremony6B5;
 // Do not infer past ceremony/photo events for completed or transferred saves.
 if(n.status!=='attending'||!promArrivalGate6B3().ok)return null;
 n.ceremony6B5={schemaVersion:PROM_CEREMONY_SCHEMA_6B5,eventId:n.eventId,schoolId:n.schoolId,venue:n.venue,
  ceremony:null,photos:[],photoIds:[],awardMilestoneRecorded:false,photoMilestoneRecorded:false};
 return n.ceremony6B5;
}
function promCeremonyGate6B5(action,ids=[]){
 const v=promArrivalGate6B3();if(!v.ok)return v;
 const pr=S.school.prom,n=promNightRecord6B1(pr),a=reconcilePromArrival6B3(pr),r=ensurePromCeremony6B5(pr);
 if(!r||r.eventId!==n.eventId)return {ok:false,reason:'no_active_prom_ledger'};
 const c=promCourtRecord6A4(pr);
 if(action==='ceremony'){
  if(r.ceremony)return {ok:false,reason:'ceremony_already_attended'};
  if(currentMinute()<PROM_CEREMONY_START_6B5)return {ok:false,reason:'ceremony_not_started'};
  if(currentMinute()+PROM_CEREMONY_MINUTES_6B5>n.endMinute)return {ok:false,reason:'not_enough_time'};
  if(!c||!c.ballotLocked||!c.results?.winners||c.eventId!==n.eventId)return {ok:false,reason:'official_ballot_not_final'};
  return {ok:true,pr,n,a,r,c,cost:PROM_CEREMONY_MINUTES_6B5};
 }
 if(!Object.hasOwn(PROM_PHOTO_COST_6B5,action))return {ok:false,reason:'unknown_photo_type'};
 const cost=PROM_PHOTO_COST_6B5[action];
 if(currentMinute()+cost>n.endMinute)return {ok:false,reason:'not_enough_time'};
 if(r.photos.length>=4)return {ok:false,reason:'photo_limit'};
 if(!Array.isArray(ids))return {ok:false,reason:'invalid_participants'};
 const normalized=[...new Set(ids)].sort();
 if(normalized.length!==ids.length)return {ok:false,reason:'duplicate_participant'};
 if(action==='solo'&&normalized.length!==0||action==='paired'&&normalized.length!==1||action==='group'&&(normalized.length<2||normalized.length>4))return {ok:false,reason:'invalid_participants'};
 for(const id of normalized){
  const npc=npcById(id);
  if(!npc||!a.attendeeIds.includes(id)||!promCourtSchoolPeer6A4(npc,pr))return {ok:false,reason:'student_not_present'};
  const known=(S.people||[]).some(p=>p.npcId===id&&!isFamilyPerson(p));
  const companion=a.companion?.status==='present'&&a.companion.npcId===id;
  if(!known||!a.greetings.some(x=>x.npcId===id)&&!companion)return {ok:false,reason:'introduce_first'};
 }
 const key=action+'|'+normalized.join('|');
 if(r.photoIds.includes(key))return {ok:false,reason:'photo_already_taken'};
 return {ok:true,pr,n,a,r,c,cost,ids:normalized,key};
}
function promCeremonyPresent6B5(){
 const g=promCeremonyGate6B5('ceremony');if(!g.ok)return g;
 const {pr,n,a,r,c,cost}=g;
 // Read-only view of the persisted Phase 6A winners. NEVER call tally or alter ballots.
 const results=Object.entries(c.results.winners).map(([category,id])=>{
  const nominee=c.nominees.find(x=>x.category===category&&x.personId===id);
  const attendee=id==='player'||a.attendeeIds.includes(id);
  return {category,award:PROM_COURT_CATEGORIES_6A4[category]||category,personId:id,name:id==='player'?S.name:(nominee?.name||'Student'),present:attendee};
 });
 const win=results.filter(x=>x.personId==='player');
 r.ceremony={dateISO:currentDate(),minute:currentMinute(),duration:cost,schoolId:n.schoolId,venue:n.venue,
  ballotEventId:c.eventId,officialResultsDate:c.results.dateISO||null,results,playerAwards:win.map(x=>x.award),
  response:win.length?'accepted_school_award':'applauded'};
 if(win.length&&!r.awardMilestoneRecorded){
  S.milestones=S.milestones||[];
  const key=`${n.eventId}:court-ceremony`;
  if(!S.milestones.some(m=>m.promEventKey===key))S.milestones.unshift({dateISO:currentDate(),age:S.age,title:'🏅 Prom Court',text:`Received ${win.map(x=>x.award).join(', ')} at ${n.venue}, following the official school ballot.`,promEventKey:key});
  r.awardMilestoneRecorded=true;
 }
 advanceTime(cost,{silent:true});
 log('Prom Court ceremony',win.length?`The school announces the counted ballot winners. You receive ${win.map(x=>x.award).join(', ')}.`:
  'You applaud as the school presents the official Prom Court results.');
 return {ok:true,results,playerAwards:r.ceremony.playerAwards,eventId:n.eventId,minutes:cost};
}
function promPhotoTake6B5(kind,ids=[]){
 const g=promCeremonyGate6B5(kind,ids);if(!g.ok)return g;
 const {n,r,cost}=g;
 const photo={id:`${n.eventId}:photo:${r.photos.length+1}`,eventId:n.eventId,dateISO:currentDate(),minute:currentMinute(),
  schoolId:n.schoolId,venue:n.venue,kind,studentNpcIds:[...g.ids],personIds:g.ids.map(id=>(S.people||[]).find(p=>p.npcId===id&&!isFamilyPerson(p))?.id).filter(Boolean)};
 r.photos.push(photo);r.photoIds.push(g.key);
 // Record factual People memories only for genuine participants; no relationship bonus or romantic milestone.
 for(const personId of photo.personIds){const p=personById(personId);if(p)rememberPerson(p,`Took a ${kind==='group'?'group':'shared'} photo at the school Prom Hall.`,1)}
 if(!r.photoMilestoneRecorded){
  S.milestones=S.milestones||[];const key=`${n.eventId}:first-photo`;
  if(!S.milestones.some(m=>m.promEventKey===key))S.milestones.unshift({dateISO:currentDate(),age:S.age,title:'📷 Prom photograph',text:`Took a real ${kind==='solo'?'solo':kind==='paired'?'two-person':'group'} photograph at ${n.venue}.`,promEventKey:key});
  r.photoMilestoneRecorded=true;
 }
 advanceTime(cost,{silent:true});log('Prom photograph',kind==='solo'?'A photographer takes your portrait.':`You take a ${kind} photograph with actual classmates.`);
 return {ok:true,photo,eventId:n.eventId,minutes:cost};
}
function promCeremonyHtml6B5(pr=S?.school?.prom){
 const n=promNightRecord6B1(pr),a=promArrivalRecord6B3(pr);
 if(n?.status!=='attending'||!a)return '';
 const r=ensurePromCeremony6B5(pr);if(!r)return '';
 const ceremonyGate=promCeremonyGate6B5('ceremony');
 const full=!!r.ceremony;
 const label=x=>x.personId==='player'?'You':x.name;
 const present=r.ceremony?.results||[];
 const candidates=a.attendeeIds.filter(id=>a.greetings.some(x=>x.npcId===id)||a.companion?.status==='present'&&a.companion.npcId===id)
  .map(id=>({id,npc:npcById(id)})).filter(x=>x.npc).slice(0,12);
 const available=kind=>promCeremonyGate6B5(kind,[]).ok;
 // Individual/group photos require known real classmates; generic photos are always an option.
 const paired=candidates.map(x=>`<button class="small ghost" data-prom-photo6b5="paired" data-photo-npcs="${esc(x.id)}" ${promCeremonyGate6B5('paired',[x.id]).ok?'':'disabled'}>Photo with ${esc(x.npc.fullName||x.npc.name||'student')}</button>`).join('');
 const groupIds=candidates.slice(0,3).map(x=>x.id);
 return `<section class="prom-ceremony-6b5" data-prom-ceremony6b5="${esc(r.eventId)}"><h4>Prom Court Ceremony & Photos</h4>`+
  `<p class="muted-text">School ceremony at 9:00 PM · Official ballots are final. Photos use only classmates at the School Hall.</p>`+
  (full?`<p class="prom-ceremony-outcome-6b5">${present.map(x=>`${esc(x.award)}: ${esc(label(x))}${x.present?'':' (not present to receive)'}`).join(' · ')||'No Court awards this year.'}</p>`:
   `<button class="small" data-prom-ceremony-action6b5="present" ${ceremonyGate.ok?'':'disabled'}>Attend Court ceremony · 20 min</button>`+
   `<p class="muted-text">${currentMinute()<PROM_CEREMONY_START_6B5?'Ceremony begins at 9:00 PM.':ceremonyGate.ok?'The school is ready to present its official results.':'Ceremony is unavailable: '+esc(ceremonyGate.reason.replaceAll('_',' '))}</p>`)+
  `<div class="prom-ceremony-photos-6b5"><button class="small ghost" data-prom-photo6b5="solo" ${available('solo')?'':'disabled'}>Solo portrait · 8 min</button>${paired}`+
  (groupIds.length>=2?`<button class="small ghost" data-prom-photo6b5="group" data-photo-npcs="${esc(groupIds.join(','))}" ${promCeremonyGate6B5('group',groupIds).ok?'':'disabled'}>Group photo · 12 min</button>`:'')+`</div>`+
  `<p class="muted-text">Actual photos recorded: ${r.photos.length}/4${r.photos.length?' · '+r.photos.map(x=>esc(x.kind)).join(', '):''}</p></section>`;
}
function promCeremonyClick6B5(b){
 const k=b?.dataset?.promCeremonyAction6b5,photo=b?.dataset?.promPhoto6b5;
 if(!k&&!photo)return false;
 const r=k==='present'?promCeremonyPresent6B5():photo?promPhotoTake6B5(photo,b.dataset.photoNpcs?b.dataset.photoNpcs.split(','):[]):{ok:false,reason:'unknown_action'};
 if(!r.ok)toast('Prom ceremony: '+String(r.reason).replaceAll('_',' '));save();render();return true;
}
