// H9.5 / EDU-UI.1 — Education portal presentation and UI-only route state.
// Reuses authoritative Phase 4D school events, H3/H9 visitors, PA.6 Prom, Phase 5A workbooks.
// Does not introduce a gameplay event, workbook, permission, or election ledger.
function education95Prefs(){
 if(!UI.education95||typeof UI.education95!=='object')UI.education95={};
 const p=UI.education95;
 if(!['clubs','events','contests'].includes(p.folder))p.folder='clubs';
 if(!['upcoming','my','past'].includes(p.eventFilter))p.eventFilter='upcoming';
 return p;
}
function education95Classify(c){
 // Explicit canonical type wins. Category is secondary; ambiguous pre-4D saves
 // default to general Events so history never disappears.
 const t=String(c?.eventType||'').toLowerCase(),category=String(c?.category||'').toLowerCase();
 if(['competition','contest','olympiad','tournament','academic_competition'].includes(t)||t.endsWith('_competition')||t.endsWith('_contest'))return 'contests';
 if(['school_event','show','concert','ceremony','festival','dance','social','public_event'].includes(t))return 'events';
 if(['competition','academic_competition','contest','olympiad','tournament'].includes(category))return 'contests';
 return 'events';
}
function education95Events(folder){
 const sid=playerCurrentSchoolId4A2?.()||S.school?.currentSchoolId;
 return (S.school?.contests||[]).filter(c=>c&&(!sid||c.schoolId===sid)&&c.discovery?.discovered!==false&&education95Classify(c)===folder)
  .sort((a,b)=>String(a.eventDate||'').localeCompare(String(b.eventDate||''))||String(a.eventId||a.id).localeCompare(String(b.eventId||b.id)));
}
function education95Bucket(c){
 const st=String(c.lifecycleState||'');
 if(['completed','declined','registration_missed','withdrawn','missed','eliminated','disqualified','cancelled','archived'].includes(st)||c.eventDate&&c.eventDate<currentDate())return 'past';
 if(['registration_pending','registered','preparing','participating'].includes(st))return 'my';
 return 'upcoming';
}
function education95EventDetail(c){
 const st=c.lifecycleState||'',label=typeof schoolEventStatusLabel4D2==='function'?schoolEventStatusLabel4D2(c):st;
 const id=esc(c.id),date=c.eventDate||c.dateISO;
 const count=date?daysBetween(currentDate(),date):null;
 const elig=typeof eventEligibility4D2==='function'?eventEligibility4D2(c):{eligible:true,labels:[]};
 const active=['registered','preparing','participating'].includes(st);
 const detail=active&&typeof schoolEventActiveCard4D3==='function'?schoolEventActiveCard4D3(c):
 st==='registration_open'?`<div class="inline-actions"><button class="small primary" data-contest-enter="${id}" ${elig.eligible?'':'disabled'}>${S.age<13?'Ask caregiver to register':'Register'}</button><button class="small ghost" data-contest-decline="${id}">Not participating</button></div>${!elig.eligible?`<p class="muted-text">${esc((elig.labels||[]).join(' · '))}</p>`:''}`:
 `<p class="muted-text">${esc(st==='announced'?'Registration not open yet':label)}. ${['completed','archived'].includes(st)?'Past results remain in your school history.':''}</p>`;
 return `<div class="education95-detail"><p><b>${esc(c.name)}</b> · ${esc(label)}${date?` · ${esc(formatDate(date))} (${count===0?'today':count>0?count+' days away':'past'})`:''}</p><p class="muted-text">${esc(schoolDisplayName(c.schoolId)||S.school?.name||'School')} · ${esc(c.category||c.eventType||'School activity')} · Registration and attendance use the existing school records.</p>${detail}${c.result?`<p class="muted-text">Result: ${esc(c.result)}</p>`:''}</div>`;
}
function education95EventList(folder){
 const p=education95Prefs(),records=education95Events(folder),filter=p.eventFilter;
 const filtered=records.filter(c=>education95Bucket(c)===filter);
 const history=(S.school?.eventHistory||[]).filter(h=>h&&!records.some(c=>c.eventId===h.eventId||c.id===h.id)&&(!h.schoolId||h.schoolId===playerCurrentSchoolId4A2?.())&&folder==='contests'&&education95Classify(h)===folder);
 return `<nav class="education95-filter" aria-label="Event time filters">${[['upcoming','Upcoming'],['my','My Events'],['past','Past Events']].map(([id,label])=>`<button class="small ${id===filter?'primary':'ghost'}" data-edu95-filter="${id}" aria-pressed="${id===filter}">${label}</button>`).join('')}</nav>`+
 (filtered.map(c=>{const id=c.eventId||c.id,opened=p.detail===id&&p.detailFolder===folder;
  return `<article class="education95-event" data-edu95-event="${esc(id)}"><div class="education95-event-head"><div><b>${esc(c.name)}</b><small>${esc(c.eventType||'School event')} · ${c.eventDate?formatDate(c.eventDate):'Date unknown'} · ${esc(schoolEventStatusLabel4D2(c))}</small></div><button class="small ${opened?'primary':'ghost'}" data-edu95-detail="${esc(id)}" data-edu95-kind="${folder}" aria-expanded="${opened}">${opened?'Close details':'View details'}</button></div>${opened?education95EventDetail(c):''}</article>`}).join('')||`<p class="muted-text">No ${filter} ${folder} in the current school records.</p>`)+
 (filter==='past'&&history.length?`<div class="subsection"><h4>Archived results</h4>${history.slice(0,10).map(h=>`<div class="opportunity-row"><b>${esc(h.name||'School activity')}</b><small>${esc(h.result||h.status||'Recorded')}</small></div>`).join('')}</div>`:'');
}
function education95PromSection(prNode){
 const p=education95Prefs(),pr=S.school?.prom,valid=pr?.foundation6A1?.eventId;
 if(!valid&&!prNode)return '';
 const id=valid||'school-prom',opened=p.detail===id&&p.detailFolder==='events',eventDate=pr?.dateISO;
 return `<article class="education95-event education95-prom" data-edu95-prom="${esc(id)}"><div class="education95-event-head"><div><b>School Prom</b><small>${eventDate?formatDate(eventDate):'School event'} · ${esc(pr?.status||'Historical')}</small></div><button class="small ${opened?'primary':'ghost'}" data-edu95-detail="${esc(id)}" data-edu95-kind="events" aria-expanded="${opened}">${opened?'Back to Events':'Open Prom'}</button></div>${opened?(prNode?prNode.innerHTML:`<p class="muted-text">Prom ended. Existing saved memories and calendar entries remain available.</p>`):''}</article>`;
}
function education95ClubSection(node){
 const p=education95Prefs(),clubs=S.school?.clubs||[],active=clubs.filter(c=>c.status==='Active'),offers=S.school?.activityOffers||[];
 const previews=active.map(c=>`<div class="education95-event-head"><div><b>${esc(c.name)}</b><small>${esc(c.position||'Member')} · Attendance ${typeof clubAttendanceRate==='function'?clubAttendanceRate(c):'—'}% · Skill ${Math.round(c.skill||0)}%</small></div></div>`).join('');
 if(node)for(const card of [...node.querySelectorAll('.club-card')]){const label=card.querySelector('b')?.textContent?.trim()||'Club';const part=document.createElement('details');part.className='education95-club-detail';part.setAttribute('name','education95-club');const summary=document.createElement('summary');summary.textContent=label+' · View attendance, activities and leadership';part.append(summary,card.cloneNode(true));card.replaceWith(part)}
 return `<div class="education95-compact-clubs">${previews||'<p class="muted-text">No active clubs yet.</p>'}<p class="muted-text">${offers.filter(o=>['Offered','Waiting'].includes(o.status)).length} current offer(s) · ${clubs.filter(c=>c.status!=='Active').length} past membership record(s)</p></div>`+
 `<details class="education95-club-management" ${p.clubOpen?'open':''}><summary>Manage clubs, tryouts, leadership and history</summary>${node?node.innerHTML:'<p class="muted-text">No club controls available.</p>'}</details>`;
}
function education95Next(){
 const clubs=(S.school?.clubs||[]).filter(c=>c.status==='Active').map(c=>clubSessionEvent(c)).filter(Boolean).filter(e=>e.dateISO>=currentDate());
 const events=(S.school?.contests||[]).filter(c=>['registration_open','registration_pending','registered','preparing'].includes(c.lifecycleState)&&c.eventDate>=currentDate());
 const next=[...clubs.map(e=>({name:'Club session',date:e.dateISO})),...events.map(c=>({name:c.name,date:c.eventDate}))].sort((a,b)=>a.date.localeCompare(b.date))[0];
 return next?`<small><b>What’s next:</b> ${esc(next.name)} · ${formatDate(next.date)}</small>`:'<small>No scheduled club meeting or registered school event is due soon.</small>';
}
function education95Activities(clubNode,promNode,publicNode){
 const p=education95Prefs(),folder=p.folder,pr=S.school?.prom;
 const folderHtml=folder==='clubs'?education95ClubSection(clubNode):
 folder==='contests'?education95EventList('contests'):
 (pr?.foundation6A1?.eventId||promNode?education95PromSection(promNode):'')+education95EventList('events')+
 (publicNode?`<details class="education95-visitors"><summary>Visiting another school · public event desk</summary>${publicNode.innerHTML}</details>`:'');
 return `<section class="card wide education95-school-activities" data-sub="activities"><div class="section-heading"><div><h3>School Activities</h3><p class="muted-text">Clubs, events and contests share the original school rules and calendars.</p>${education95Next()}</div></div><nav class="education95-folders" aria-label="School Activities folders">${[['clubs','Clubs'],['events','Events'],['contests','Contests']].map(([id,label])=>`<button class="${id===folder?'primary':'ghost'}" data-edu95-folder="${id}" aria-pressed="${id===folder}">${label}</button>`).join('')}</nav><div class="education95-folder-content" data-edu95-content="${folder}">${folderHtml}</div></section>`;
}
function education95WorkbookHtml(subject){
 const grade=currentWorkbookGrade5A1();if(grade==null||!WORKBOOK_SUBJECT_CODES_5A1[subject]||!workbookDefinition5A1(workbookKey5A1(subject,grade,1)))return '';
 const p=education95Prefs(),open=p.extra===subject;
 const owned=ownedWorkbooks5A1(subject,grade).length;
 return `<details class="education95-extra" data-edu95-extra="${esc(subject)}" ${open?'open':''}><summary>Extra Credit (Workbooks) <small>${owned} owned · optional</small></summary><div class="education95-extra-body">${open?advancedStudyPanel5A4(subject):''}</div></details>`;
}
function education95SubjectCards(section){
 if(!section)return;
 for(const [i,card] of [...section.querySelectorAll('.subject-card')].entries()){
  const subject=S.school?.subjects?.[i]?.name;if(!subject)continue;
  const frag=document.createElement('div');frag.innerHTML=education95WorkbookHtml(subject);
  const disclosure=frag.firstElementChild;if(disclosure)card.append(disclosure);
 }
}
const education95OriginalSchoolPanel=schoolPanel;
schoolPanel=function(){
 const html=education95OriginalSchoolPanel();
 // H9's public-event security desk substitutes the entire school view for visitors.
 if(!S?.school||S.school.grade==='Kindergarten'||Object.values(h9State().passes).some(r=>h9ActualPresence(r)))return html;
 const host=document.createElement('div');host.innerHTML=html;const dashboard=host.querySelector('.dashboard');if(!dashboard)return html;
 const sections=[...dashboard.children].filter(e=>e.tagName==='SECTION');
 const take=pred=>{const el=sections.find(pred);if(el)el.remove();return el};
 const clubs=take(e=>/Clubs & activities/.test(e.querySelector('h3')?.textContent||''));
 take(e=>/Competitions & school events/.test(e.querySelector('h3')?.textContent||''));
 take(e=>e.querySelector('h3')?.textContent?.trim()==='Advanced Study');
 const prom=take(e=>e.hasAttribute('data-prom-school6a6'));
 const publicSchool=take(e=>e.hasAttribute('data-h9-panel'));
 const subjects=sections.find(e=>/Subjects, teachers & homework/.test(e.querySelector('h3')?.textContent||''));
 education95SubjectCards(subjects);
 const activity=document.createElement('div');activity.innerHTML=education95Activities(clubs,prom,publicSchool);
 if(activity.firstElementChild)dashboard.append(activity.firstElementChild);
 return dashboard.outerHTML;
};
function education95Route(folder='events',detail=null,{filter=null}={}){
 const p=education95Prefs();if(!S?.school||S.school.grade==='Kindergarten')return false;
 if(!['clubs','events','contests'].includes(folder))return false;
 p.folder=folder;p.detail=detail;p.detailFolder=folder;if(filter)p.eventFilter=filter;
 UI.subTab.school='activities';active='school';saveUI();render();return true;
}
function education95NoticeEvent(note){
 if(!note||note.sourceType!=='contest'||!note.sourceId)return null;
 let id=String(note.sourceId).replace(/^(?:event-reg-|event-missed-|reg-|closed-)/,'');
 let ev=schoolEventById4D1(id);if(!ev){const cal=(S.calendar||[]).find(x=>x.id===id&&x.type==='schoolEvent');if(cal)ev=schoolEventById4D1(cal.payload?.schoolEventId||cal.payload?.contestId)}
 return ev||null;
}
function education95Click(b){const d=b?.dataset;if(!d)return false;const p=education95Prefs();
 if(d.edu95Folder){p.folder=d.edu95Folder;p.detail=null;p.detailFolder=null;saveUI();render();return true;}
 if(d.edu95Filter){p.eventFilter=d.edu95Filter;p.detail=null;saveUI();render();return true;}
 if(d.edu95Detail){const id=d.edu95Detail,folder=d.edu95Kind;if(!['events','contests'].includes(folder))return false;
  const real=(folder==='events'&&S.school?.prom?.foundation6A1?.eventId===id)||education95Events(folder).some(c=>(c.eventId||c.id)===id);
  if(!real)return false;
  p.detail=p.detail===id&&p.detailFolder===folder?null:id;p.detailFolder=folder;saveUI();render();return true;}
 if(d.edu95Open){return education95Route(d.edu95Open,d.edu95Id||null,{filter:d.edu95Filter||null});}
 if(d.edu95Subject){const name=d.edu95Subject;if(!S.school?.subjects?.some(s=>s.name===name))return false;
  UI.subTab.school='subjects';p.extra=d.edu95Reveal==='true'?name:p.extra;active='school';saveUI();render();return true;}
 return false;
}
const education95PriorPanelClick=handlePanelClick;
handlePanelClick=function(e){const b=e?.target?.closest?.('button');if(b&&education95Click(b))return;
 const note=b?.dataset?.noteOpen?(S.notifications||[]).find(n=>n.id===b.dataset.noteOpen):null;
 const event=education95NoticeEvent(note),id=event?.eventId||event?.id,kind=event?education95Classify(event):null;
 const result=education95PriorPanelClick(e);
 if(id&&kind)education95Route(kind,id,{filter:education95Bucket(event)});return result;
};
const education95PriorCalendarPanel=calendarPanel;
calendarPanel=function(){const html=education95PriorCalendarPanel();
 if(!S?.school||S.school.grade==='Kindergarten')return html;
 const list=(S.school.contests||[]).filter(c=>c?.discovery?.discovered&&c?.eventDate>=currentDate()&&c.schoolId===playerCurrentSchoolId4A2?.()).slice(0,4);
 if(!list.length)return html;
 const links=`<section class="card wide education95-calendar-shortcuts" data-sub="upcoming"><h3>School Activities coming up</h3>${list.map(c=>`<div class="education95-event-head"><span>${esc(c.name)} · ${formatDate(c.eventDate)}</span><button class="small ghost" data-edu95-open="${education95Classify(c)}" data-edu95-id="${esc(c.eventId||c.id)}" data-edu95-filter="${education95Bucket(c)}">Open details</button></div>`).join('')}</section>`;
 return html.replace(/<\/div>\s*$/,links+'</div>');
};
// Native details owns focus and Enter/Space. Keep disclosure purely in UI local state.
document.addEventListener('toggle',function(e){
 if(!S||!e.target?.matches?.('#panel-host .education95-extra,#panel-host .education95-club-management'))return;
 const p=education95Prefs(),node=e.target;
 if(node.classList.contains('education95-club-management')){p.clubOpen=node.open;saveUI();return;}
 const name=node.dataset.edu95Extra;if(node.open){p.extra=name;
  for(const other of document.querySelectorAll('#panel-host .education95-extra'))if(other!==node&&other.open)other.open=false;
  // The renderer only creates contents for the opened subject; populate lazily.
  const body=node.querySelector('.education95-extra-body');if(body&&!body.children.length)body.innerHTML=advancedStudyPanel5A4(name);
 }else if(p.extra===name)p.extra=null;
 saveUI();
},true);
