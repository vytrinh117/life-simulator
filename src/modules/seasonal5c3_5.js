// PHASE 5C.3.5 — conservative outdoor persistence and a small Daily Life entry point.
// Plans, Calendar, RSVP, People, H3 and Inventory remain the only authorities.
function migrateOutdoorIntegration5C35(){
 const st=ensureSeasonalState5C1();
 // Do not create visits, invitations, rental records, permissions or memories.
 // Repair only explicitly persisted valid outdoor plans and their calendar reservations.
 const validIds=new Set((S.people||[]).map(p=>p.id));
 for(const plan of S.plans||[]){
  if(!plan||!seasonalOutdoorDefinition5C31(plan.seasonalActivityId))continue;
  if(Array.isArray(plan.participantIds))plan.participantIds=[...new Set(plan.participantIds.filter(id=>validIds.has(id)))];
  if(plan.participantRsvps&&typeof plan.participantRsvps==='object'&&!Array.isArray(plan.participantRsvps)){
   for(const id of Object.keys(plan.participantRsvps))if(!validIds.has(id)||!['Accepted','Declined','Unavailable'].includes(plan.participantRsvps[id]))delete plan.participantRsvps[id];
  }
  if(plan.seasonalActivityId!=='camping_weekend'||!/^\d{4}-\d{2}-\d{2}$/.test(plan.dateISO||'')||!Number.isInteger(Number(plan.startMinute)))continue;
  const interval=outdoorInterval5C32(plan.seasonalActivityId,plan.dateISO,Number(plan.startMinute));
  if(!interval.ok)continue;
  // An existing plan needs its proper cross-date span; never infer a new outing.
  if(plan.endDateISO!==interval.endDateISO)plan.endDateISO=interval.endDateISO;
  if(plan.endMinute!==interval.endMinute)plan.endMinute=interval.endMinute;
  if(plan.durationMinutes!==interval.minutes)plan.durationMinutes=interval.minutes;
  const holdId='outdoor-overnight-'+plan.id,hold=(S.calendar||[]).find(e=>e.id===holdId);
  const main=(S.calendar||[]).find(e=>e.id==='plan-'+plan.id&&e.type==='plan');
  const active=plan.status==='Accepted'&&main&&!isTerminal(main.status);
  if(active&&interval.endDateISO>interval.dateISO&&!hold){
   createCalendarEvent({id:holdId,type:'outdoorReservation',title:plan.title+' (overnight)',dateISO:interval.endDateISO,startMinute:0,endMinute:interval.endMinute,payload:{overnightPlanId:plan.id},location:plan.location,required:true,source:'seasonal'});
  }
  if(hold&&outdoorTerminalPlanStatus5C35(plan.status)&&!isTerminal(hold.status))setCalendarStatus(hold,outdoorHoldStatus5C35(plan.status),'Outdoor plan ended');
 }
 // Story/first-experience markers are retained as saved, never inferred from history.
 return {ok:true,historyCount:st.history.length};
}
function outdoorTerminalPlanStatus5C35(status){return ['Attended','Cancelled','Declined','Missed','Expired','Cancelled by you','Cancelled by them','No-show'].includes(status)}
function outdoorHoldStatus5C35(status){return status==='Attended'?'Attended':['Cancelled by you','Cancelled by them','No-show'].includes(status)?'Cancelled':status}
function settleOutdoorReservation5C35(plan){
 if(plan?.seasonalActivityId!=='camping_weekend')return;
 const hold=(S.calendar||[]).find(e=>e.id==='outdoor-overnight-'+plan.id);
 if(hold&&!isTerminal(hold.status)&&outdoorTerminalPlanStatus5C35(plan.status))setCalendarStatus(hold,outdoorHoldStatus5C35(plan.status),'Outdoor plan ended');
}
function outdoorUiSlot5C35(activityId){
 let d=currentDate();
 if(activityId==='camping_weekend'){
  let tries=0;while((![0,6].includes(parseISO(d).getUTCDay())||d===currentDate()&&currentMinute()>=900)&&tries++<9)d=addDays(d,1);
 }else if(currentMinute()>=900)d=addDays(d,1);
 return {dateISO:d,startMinute:600};
}
function outdoorUiOptions5C35(){
 const family=(S.people||[]).filter(p=>isFamilyPerson(p)&&!p.deceased&&!p.movedAway);
 const friends=(S.people||[]).filter(p=>!isFamilyPerson(p)&&!p.deceased&&!p.movedAway).slice(0,50);
 const option=(p)=>`<option value="${esc(p.id)}">${esc(displayName(p))}</option>`;
 return {family,friends,peopleOptions:family.concat(friends).map(option).join(''),groupOptions:(S.groups||[]).filter(g=>Array.isArray(g.members)&&g.members.length).map(g=>`<option value="${esc(g.id)}">${esc(g.name||g.id)}</option>`).join('')};
}
function outdoorPanel5C35(){
 if(S.age<6)return '';
 const opts=outdoorUiOptions5C35(),recent=(S.plans||[]).filter(p=>seasonalOutdoorDefinition5C31(p?.seasonalActivityId)).slice(0,8);
 const modeOptions=['alone','family','friend','group','partner'].map(m=>`<option value="${m}">${m.charAt(0).toUpperCase()+m.slice(1)}</option>`).join('');
 const planRows=recent.map(p=>`<div class="timeline-entry"><b>${esc(p.title||p.seasonalActivityId)} • ${esc(p.status)}</b><p>${esc(p.dateISO)} ${timeLabel(p.startMinute)} · ${esc(p.location||'')} · ${esc(p.participantMode||'alone')} · ${p.participantIds?.length||0} attending</p>${p.participantRsvps&&Object.keys(p.participantRsvps).length?`<p class="muted-text">${Object.entries(p.participantRsvps).map(([id,answer])=>`${esc(displayName(personById(id))||id)}: ${esc(answer)}`).join(" · ")}</p>`:''}${p.status==='Accepted'&&p.dateISO===currentDate()?`<button class="small" data-outdoor-attend5c35="${esc(p.id)}">Attend planned outing</button>`:''}</div>`).join('');
 const camp=outdoorUiSlot5C35('camping_weekend'),hike=outdoorUiSlot5C35('autumn_hike');
 return `<section class="card wide"><h3>Autumn outdoors</h3><p class="muted-text">Camping needs autumn, a weekend, an overnight schedule, weather-safe conditions and a tent/sleeping bag or rental. Under-13 campers need a real adult; all minors need caregiver approval for overnight stays. Hiking is a day trip with its own age rules.</p><div class="inline-actions"><label>Outing <select data-outdoor-activity5c35><option value="camping_weekend">Camping weekend</option><option value="autumn_hike">Autumn hike</option></select></label><label>Date <input type="date" data-outdoor-date5c35 value="${camp.dateISO}" min="${currentDate()}"></label><label>Start <select data-outdoor-time5c35><option value="600">10:00</option><option value="840">14:00</option></select></label></div><div class="inline-actions"><label>Company <select data-outdoor-mode5c35>${modeOptions}</select></label><label>Person <select data-outdoor-person5c35><option value="">Choose person (when needed)</option>${opts.peopleOptions}</select></label><label>Friend group <select data-outdoor-group5c35><option value="">Choose group</option>${opts.groupOptions}</select></label></div><div class="inline-actions"><label>Adult supervisor (if required) <select data-outdoor-supervisor5c35><option value="">Auto family supervisor</option>${opts.family.concat(opts.friends.filter(p=>legitimateCampingSupervisor5C31(p.id).ok)).map(p=>`<option value="${esc(p.id)}">${esc(displayName(p))}</option>`).join('')}</select></label><label>Camping equipment <select data-outdoor-gear5c35><option value="owned">Use my gear</option><option value="rent">Rent temporary gear ($24)</option><option value="provider">Adult provider</option></select></label></div><div class="inline-actions"><button class="small primary" data-outdoor-plan5c35="1">Plan outing</button><small class="muted-text">Hiking: ${esc(hike.dateISO)} default; camping: ${esc(camp.dateISO)} default. Planning does not buy equipment or force NPC attendance.</small></div>${seasonalKitSummaryHtml5C45('camping_weekend')}${seasonalKitSummaryHtml5C45('autumn_hike')}${recent.length?`<h4>Outdoor plans</h4>${planRows}`:''}</section>`;
}
function outdoorClick5C35(button){
 if(!button.dataset.outdoorPlan5c35&&!button.dataset.outdoorAttend5c35)return false;
 let result;
 if(button.dataset.outdoorAttend5c35){result=attendSeasonalPlan5C1(button.dataset.outdoorAttend5c35)}
 else{
  const host=button.closest('section');if(!host)return true;
  const val=n=>host.querySelector(`[data-${n}]`)?.value||'';
  const activityId=val('outdoor-activity5c35'),dateISO=val('outdoor-date5c35'),startMinute=Number(val('outdoor-time5c35'));
  if(!seasonalOutdoorDefinition5C31(activityId)||!/^\d{4}-\d{2}-\d{2}$/.test(dateISO)||dateISO<currentDate()){toast('Choose a valid future outdoor date.');return true}
  const participantMode=val('outdoor-mode5c35'),personId=['friend','partner'].includes(participantMode)?val('outdoor-person5c35'):null;
  const groupId=participantMode==='group'?val('outdoor-group5c35'):null;
  if((['friend','partner'].includes(participantMode)&&!personId)||(participantMode==='group'&&!groupId)){toast('Choose a person or friend group for this outing.');return true}
  const supervisorId=val('outdoor-supervisor5c35')||null,gearAccess=val('outdoor-gear5c35');
  result=createSeasonalPlan5C1(activityId,{dateISO,startMinute,location:seasonalActivityDefinition5C1(activityId).locations[0],participantMode,personId,groupId,supervisorId,gearAccess});
 }
 if(result?.ok)toast(button.dataset.outdoorAttend5c35?'Outdoor outing completed.':'Outdoor outing planned.');
 else toast('Cannot '+(button.dataset.outdoorAttend5c35?'attend':'plan')+' outing: '+String(result?.detail||result?.reason||'unavailable'));
 save();render();return true;
}
function outdoorChange5C35(e){
 if(!e?.target?.matches?.('[data-outdoor-activity5c35]'))return false;
 const section=e.target.closest('section'),slot=outdoorUiSlot5C35(e.target.value);
 const input=section?.querySelector('[data-outdoor-date5c35]');if(input)input.value=slot.dateISO;
 return true;
}
