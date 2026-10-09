// PHASE 6A.6 — presentation and notification integration for existing Prom Season.
// No parallel Prom ledger, calendar engine, votes, communication, or relationships.
const PROM_UI_MILESTONES_6A6=[
 ['Registration',p=>p.foundation6A1?.registrationDeadline],
 ['Committee application',p=>p.committee6A2?.applicationDeadline],
 ['Court nominations',p=>p.court6A4?.nominationClose],
 ['Court ballot',p=>p.court6A4?.ballotClose],
 ['Committee preparation',p=>p.committee6A2?.preparationDeadline]
];
function promUiEligibleEvent6A6(){
 const p=S?.school?.prom,f=p?.foundation6A1;
 if(!f||!f.eventId||p.status==='Done'||p.status==='Skipped'||!promSeasonEligibility6A1().ok)return null;
 if(f.schoolId!==playerCurrentSchoolId4A2()||f.eventId!==promIdentity6A1()?.eventId)return null;
 // UI draws from the canonical calendar; a stale orphan must not be advertised.
 const ev=(S.calendar||[]).find(x=>x.id===f.eventId&&x.type==='prom');
 return ev&&!['Cancelled','Expired'].includes(ev.status)?p:null;
}
function promUiStatus6A6(pr){
 const f=pr.foundation6A1,c=pr.committee6A2,court=pr.court6A4;
 const date=pr.partnerId?personById(pr.partnerId):null;
 const invitation=(pr.asked||[]).some(x=>x.result==='Pending');
 const reg={registered:'Registered',declined:'Declined',missed:'Closed',not_registered:promRegistrationOpen6A1(pr)?'Open':'Not open'}[f.registrationStatus]||'Not open';
 const com={not_applied:'Not applied',applied:'Awaiting approval',approved:'Approved',rejected:'Not selected',declined:'Declined',missed:'Closed',closed:'Closed'}[c?.status]||'Not open';
 const rsvp=date?`${pr.asFriends?'Friends':'Date'}: ${displayName(date)}`:invitation?'Invitation pending':pr.plan==='friends'?'With friends':pr.plan==='alone'?'Going alone':'No date required';
 const courtText=court?.ballotLocked?'Votes sealed':court?.nominationsLocked?'Ballot phase':court?.nominationRequested?'Requested nomination':'Not nominated';
 return [{label:'Attendance',value:reg},{label:'Committee',value:com},{label:'Prom company',value:rsvp},{label:'Prom Court',value:courtText}];
}
function promUiHeader6A6(pr,{compact=false}={}){
 const f=pr.foundation6A1,days=daysBetween(currentDate(),pr.dateISO),title=pr.junior?'Junior Prom':'Senior Prom';
 const count=days===0?'Today':days>0?`${days} days away`:'Event passed';
 const all=promUiStatus6A6(pr);
 const next=PROM_UI_MILESTONES_6A6.map(([name,fn])=>({name,date:fn(pr)})).filter(x=>x.date&&x.date>=currentDate()&&x.date<=pr.dateISO).sort((a,b)=>a.date.localeCompare(b.date));
 return `<div class="prom-ui-head-6a6" data-prom-season-id="${esc(f.eventId)}"><div class="prom-ui-topline"><div><strong>💃 ${title}</strong><small>${formatDate(pr.dateISO)} · ${esc(pr.venue)} · ${esc(S.school.name||'School')}</small></div><span class="prom-ui-countdown">${count}</span></div>`+
 `<div class="prom-ui-status-6a6">${all.map(s=>`<div class="prom-ui-status-item"><small>${esc(s.label)}</small><b>${esc(s.value)}</b></div>`).join('')}</div>`+
 `<p class="prom-ui-deadlines-6a6"><b>Next deadline:</b> ${next.length?`${esc(next[0].name)} · ${formatDate(next[0].date)}`:'No remaining registration or voting deadlines'}</p>`+
 (compact?'<button class="small ghost" data-tab-jump="home">Open Prom actions</button>':'')+'</div>';
}
function promUiSchoolHtml6A6(){
 const pr=promUiEligibleEvent6A6();if(!pr)return '';
 const controls=pr.status==='Season'?promHtml():'';
 return `<section class="card wide prom-school-6a6" data-prom-school6a6="1"><h3>Prom season</h3>${promUiHeader6A6(pr)}`+
 (controls?`<div class="prom-ui-actions-6a6">${controls}</div>`:'<p class="muted-text">School announcements, registration and applications open closer to Prom.</p>')+promNightHtml6B1(pr)+'</section>';
}
function promUiHomeHtml6A6(){
 // Keep an actual post-Prom debrief visible briefly AFTER canonical Calendar completion.
 // Old Done/Skipped saves never gain retrospective attendance or a fictional after-party.
 const done=S?.school?.prom,night=typeof promNightRecord6B1==='function'?promNightRecord6B1(done):null;
 if(done?.status==='Done'&&night?.status==='completed'&&night?.after6B6?.checkout&&
    typeof promAfterRecord6B6==='function'&&promAfterRecord6B6(done)&&
    daysBetween(night.dateISO,currentDate())>=0&&daysBetween(night.dateISO,currentDate())<=1){
  return `<section class="card wide prom-home-6a6" data-prom-home6a6="1"><h3>Prom Night memories</h3>${promNightHtml6B1(done)}</section>`;
 }
 const pr=promUiEligibleEvent6A6();if(!pr||pr.status!=='Season')return '';
 return `<section class="card wide prom-home-6a6" data-prom-home6a6="1"><h3>Prom season</h3>${promUiHeader6A6(pr,{compact:true})}<button class="small primary" data-edu95-open="events" data-edu95-id="${esc(pr.foundation6A1.eventId)}">Open School Prom in Education → Events</button></section>`;
}
function promUiCalendarHtml6A6(){
 const pr=promUiEligibleEvent6A6();if(!pr)return '';
 const f=pr.foundation6A1,ev=(S.calendar||[]).find(x=>x.id===f.eventId&&x.type==='prom');if(!ev)return '';
 const days=daysBetween(currentDate(),ev.dateISO),dates=PROM_UI_MILESTONES_6A6.map(([label,fn])=>({label,date:fn(pr)})).filter(x=>x.date&&x.date>=currentDate()&&x.date<=pr.dateISO).sort((a,b)=>a.date.localeCompare(b.date));
 return `<section class="card wide prom-calendar-6a6" data-sub="month" data-prom-calendar6a6="1"><h3>School Prom · ${days===0?'Today':days+' days remaining'}</h3><p class="muted-text">${formatDate(ev.dateISO)} · ${timeLabel(ev.startMinute)} · ${esc(ev.location)} · ${esc(f.registrationStatus)}</p>`+
 `<div class="prom-ui-calendar-dates">${dates.map(x=>`<div><b>${esc(x.label)}</b><small>${formatDate(x.date)} · ${daysBetween(currentDate(),x.date)}d</small></div>`).join('')||'<p class="muted-text">Registration and ballot deadlines have passed.</p>'}</div><button class="small ghost" data-edu95-open="events" data-edu95-id="${esc(f.eventId)}">See Prom in School Activities</button></section>`;
}
function promUiNoticeCleanup6A6(pr){
 const f=pr?.foundation6A1,live=f?.eventId;
 for(const note of S.notifications||[]){
  if(!['Unread','Read'].includes(note.status)||!note.sourceId||!note.sourceId.startsWith('prom-'))continue;
  const id=note.sourceId;
  // Only known Prom lifecycle sources; never touch other notifications or historical memories.
  const known=/(?:registration|committee_signup|committee_result|court_nominations|court_voting)$/.test(id);
  if(!known)continue;
  const current=!!live&&id.startsWith(live+':');
  const suffix=id.substring(id.lastIndexOf(':')+1);
  const stale=!current||pr?.status==='Done'||pr?.status==='Skipped'||!!pr?.dateISO&&currentDate()>pr.dateISO;
  const closed=!!pr&&(suffix==='registration'&&!!f&&f.registrationStatus!=='not_registered'||
   suffix==='committee_signup'&&pr.committee6A2?.status!=='not_applied'||
   suffix==='court_nominations'&&!!pr.court6A4?.nominationsLocked||
   suffix==='court_voting'&&!!pr.court6A4?.ballotLocked||
   suffix==='committee_result'&&currentDate()>pr.committee6A2?.preparationDeadline);
  if(stale||closed){note.status='Resolved';note.read=true;note.resolvedDate=currentDate()}
 }
}
function reconcilePromUi6A6(pr){promUiNoticeCleanup6A6(pr)}
// Keep Education's existing page structure intact; insert one Prom section.
const originalSchoolPanel6A6=schoolPanel;
schoolPanel=function(){
 const html=originalSchoolPanel6A6();const panel=promUiSchoolHtml6A6();
 return panel?html.replace(/<\/div>\s*$/,panel+'</div>'):html;
};
