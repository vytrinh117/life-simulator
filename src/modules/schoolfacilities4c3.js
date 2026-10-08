// =====================================================================
// PHASE 4C.3 — LUNCH / BREAKS / NEEDS / CAMPUS FACILITIES
// Reuses S.needs, inventory, Phase 3C device access, and Phase 4A school IDs.
// =====================================================================
const SCHOOL_FACILITIES_SCHEMA_4C3=1;
function schoolFacilitiesRuntime4C3(){
 const r=schoolDayRuntime4C1();r.facilities4C3=r.facilities4C3&&typeof r.facilities4C3==='object'?r.facilities4C3:{};r.facilities4C3.schemaVersion=SCHOOL_FACILITIES_SCHEMA_4C3;r.facilities4C3.days=r.facilities4C3.days&&typeof r.facilities4C3.days==='object'?r.facilities4C3.days:{};return r.facilities4C3
}
function schoolFacilityDay4C3(dateISO=currentDate()){
 const r=schoolFacilitiesRuntime4C3();let d=r.days[dateISO];if(!d||typeof d!=='object')d=r.days[dateISO]={dateISO,schoolId:playerCurrentSchoolId4A2?.()||null,packedLunch:null,missedLunchApplied:false,vendingUses:0,restUses:0};
 if(!d.schoolId)d.schoolId=playerCurrentSchoolId4A2?.()||null;return d
}
function schoolLunchPeriod4C3(dateISO=currentDate()){return timetableFor(dateISO).find(p=>p.kind==='lunch')||{id:'lunch',start:660,end:720,label:'Lunch',kind:'lunch'}}
function schoolShortBreak4C3(minute=currentMinute()){
 const day=schoolDayState4C1();if(!day.isSchoolDay||!day.atSchool||!day.campusOpen)return {active:false};
 const windows=[{id:'morning',start:600,end:610,label:'Morning break'},{id:'afternoon',start:780,end:790,label:'Afternoon break'}];const w=windows.find(x=>minute>=x.start&&minute<x.end);return w?{active:true,...w,minutesLeft:w.end-minute}:{active:false}
}
function schoolFacilityContext4C3(dateISO=currentDate(),minute=currentMinute()){
 const day=schoolDayState4C1(dateISO,minute),lunch=schoolLunchPeriod4C3(dateISO),period=day.atSchool?periodAt(minute):null,br=schoolShortBreak4C3(minute);
 const lunchActive=day.atSchool&&day.isSchoolDay&&minute>=lunch.start&&minute<lunch.end;
 const afterSchool=day.atSchool&&day.afterSchoolWindow;
 const freeWindow=lunchActive||br.active||afterSchool||day.phase==='arrival';
 return {schemaVersion:SCHOOL_FACILITIES_SCHEMA_4C3,dateISO,minute,day,lunch,period,break:br,lunchActive,afterSchool,freeWindow,atSchool:day.atSchool}
}
function eligiblePackedLunchCaregivers4C3(){return typeof householdCaregivers==='function'?householdCaregivers().filter(p=>p&&!p.movedAway):[]}
function packedLunchItem4C3(rec=schoolFacilityDay4C3()){
 const id=rec?.packedLunch?.itemId;if(!id)return null;const it=S.inventoryItems.find(x=>x.id===id);return it&&it.key==='sandwich'?it:null
}
function preparePackedLunch4C3(mode='auto'){
 if(!S.school||!isSchoolDay())return null;const rec=schoolFacilityDay4C3();if(rec.packedLunch&&packedLunchItem4C3(rec))return rec.packedLunch;
 let it=findUsable('sandwich'),source='inventory',caregiver=null;
 if(!it){const caregivers=eligiblePackedLunchCaregivers4C3();if(mode==='caregiver'||(mode==='auto'&&caregivers.length&&hashOf(`${currentDate()}|${playerCurrentSchoolId4A2?.()||''}|packed`)%100<68)){caregiver=caregivers[Math.abs(hashOf(`${currentDate()}|caregiver`))%caregivers.length];it=addItem('sandwich',`from ${displayName(caregiver)}`);source='caregiver'}
  else if(mode==='self'||(mode==='auto'&&S.age>=10&&(S.development?.skills?.cooking||0)>=20)){it=addItem('sandwich','prepared at home');source='self'}
 }
 if(!it)return null;rec.packedLunch={itemId:it.id,source,caregiverId:caregiver?.id||null,preparedBy:caregiver?displayName(caregiver):source==='self'?S.name:'Already in inventory',dateISO:currentDate()};return rec.packedLunch
}
function consumeSchoolFoodItem4C3(itemId,{label='Food',minutes=10}={}){
 const it=S.inventoryItems.find(x=>x.id===itemId);if(!it)return false;const d=catalogItem(it.key);if(!d||!['consumable','perishable'].includes(lifecycleOf(d))){toast('That is not school food.');return false}if(isSpoiled(it)){toast(`${it.name} is spoiled.`);return false}
 const before=S.needs.hunger;S.needs.hunger=clamp(S.needs.hunger-(d.hunger||20));if(d.comfort)S.needs.comfort=clamp(S.needs.comfort+d.comfort);if(d.healthy)S.health=clamp(S.health+1);S.energy=clamp(S.energy+(it.key==='sandwich'?5:1));removeItem(it.id,true);advanceTime(minutes,{silent:true});log(label,`${it.name} • Hunger ${Math.round(before)} → ${Math.round(S.needs.hunger)}.`);return true
}
function cafeteriaLunch4C3(){
 const c=schoolFacilityContext4C3();if(!c.atSchool){toast('You are not at school.');return false}if(!c.lunchActive){toast(`Cafeteria lunch is available during lunch (${timeLabel(c.lunch.start)}–${timeLabel(c.lunch.end)}).`);return false}
 const ev=sessionEvent();if(!ev){toast('You do not have an active school session.');return false}if(ev.ateLunch){toast('You already ate lunch.');return false}
 const mins=Math.max(5,Math.min(20,c.lunch.end-currentMinute()));const before=S.needs.hunger;S.needs.hunger=clamp(S.needs.hunger-50);S.energy=clamp(S.energy+5);ev.ateLunch=true;ev.lunchSource='cafeteria';advanceTime(mins,{silent:true});log('Lunch • cafeteria',`You eat a normal school lunch. Hunger ${Math.round(before)} → ${Math.round(S.needs.hunger)}.`);return true
}
function eatPackedLunch4C3(){
 const c=schoolFacilityContext4C3();if(!c.atSchool){toast('You are not at school.');return false}if(!c.lunchActive){toast(`Packed lunch is for the lunch period (${timeLabel(c.lunch.start)}–${timeLabel(c.lunch.end)}).`);return false}const ev=sessionEvent();if(!ev)return false;if(ev.ateLunch){toast('You already ate lunch.');return false}
 const rec=schoolFacilityDay4C3(),p=rec.packedLunch||preparePackedLunch4C3('auto'),it=p&&packedLunchItem4C3(rec);if(!it){toast('You do not have a packed lunch today.');return false}const ok=consumeSchoolFoodItem4C3(it.id,{label:'Lunch • packed lunch',minutes:15});if(ok){ev.ateLunch=true;ev.lunchSource='packed';rec.packedLunchConsumed=true}return ok
}
function vendingSnack4C3(kind='snackPack'){
 const c=schoolFacilityContext4C3();if(!c.atSchool){toast('You are not at school.');return false}if(!c.freeWindow||c.day.classesRunning&&!c.break.active&&!c.lunchActive){toast('The vending machines are for breaks, lunch, or after school — not during class.');return false}
 if(currentMinute()<c.lunch.end&&!c.break.active&&!c.lunchActive){toast('Save vending-machine snacks for a break or after lunch.');return false}const key=kind==='juiceBox'?'juiceBox':'snackPack',price=key==='juiceBox'?2:3;if(!spendOwn(price)){toast(`You need ${money(price)} for the vending machine.`);return false}
 const it=addItem(key,'school vending machine');const ok=consumeSchoolFoodItem4C3(it.id,{label:'School vending machine',minutes:5});if(ok)schoolFacilityDay4C3().vendingUses++;return ok
}
function schoolRestroom4C3(){
 const c=schoolFacilityContext4C3();if(!c.atSchool){toast('You are not at school.');return false}if(c.day.classesRunning&&!c.break.active&&!c.lunchActive&&S.needs.toilet<75){toast('You are in class. Use the restroom at break unless it is urgent.');return false}basicAction('toilet');return true
}
function schoolWashHands4C3(){const c=schoolFacilityContext4C3();if(!c.atSchool){toast('You are not at school.');return false}if(c.day.classesRunning&&!c.break.active&&!c.lunchActive){toast('Wash your hands at break, lunch, or after class.');return false}basicAction('washHands');return true}
function shortSchoolRest4C3(){
 const c=schoolFacilityContext4C3();if(!c.atSchool){toast('You are not at school.');return false}if(!(c.break.active||c.lunchActive||c.afterSchool)){toast('A short rest is only realistic during break, lunch, or after school.');return false}const rec=schoolFacilityDay4C3();if((rec.restUses||0)>=2){toast('You have already taken enough short rests at school today.');return false}const max=c.break.active?Math.min(8,c.break.minutesLeft):12;if(max<5){toast('There is not enough break time left to rest.');return false}advanceTime(max,{silent:true});S.energy=clamp(S.energy+5);S.needs.sleep=clamp(S.needs.sleep+4);S.stress=clamp(S.stress-2);rec.restUses=(rec.restUses||0)+1;log('Short school rest',`${max} min • Energy +5 • Stress -2.`);return true
}
function schoolSocialCandidates4C3(){
 if(!playerAtSchool4C1())return [];return (S.people||[]).filter(p=>!isFamilyPerson(p)&&!p.movedAway&&typeof sameSchool4A3==='function'&&sameSchool4A3('player',p)).filter(p=>{const a=actorSchoolState4A3(p);return !!a?.currentSchoolId})
}
function schoolLunchSocial4C3(personId=null){
 const c=schoolFacilityContext4C3();if(!c.atSchool||!c.lunchActive){toast('Lunch social time is available during the lunch period at school.');return false}const list=schoolSocialCandidates4C3(),p=personId?list.find(x=>x.id===personId):list.sort((a,b)=>(b.rel||0)-(a.rel||0))[0];if(!p){advanceTime(Math.min(15,c.lunch.end-currentMinute()),{silent:true});S.needs.social=clamp(S.needs.social+6);log('Lunch with classmates','You sit near classmates from your school and make light conversation.');return true}p.rel=clamp(p.rel+3);p.trust=clamp(p.trust+1);S.needs.social=clamp(S.needs.social+14);rememberPerson(p,'You spent lunch together at school.');advanceTime(Math.max(5,Math.min(20,c.lunch.end-currentMinute())),{silent:true});log('Lunch with a friend',`${displayName(p)} joins you. You talk through most of lunch.`);return true
}
function schoolDeviceUseGate4C3(channel='phone'){
 if(!playerAtSchool4C1())return {ok:true};const c=schoolFacilityContext4C3();if(!c.day.campusOpen)return {ok:false,reason:'School device use is unavailable while campus is closed.'};if(c.day.classesRunning&&!c.break.active&&!c.lunchActive)return {ok:false,reason:'Phone and smartwatch use is not allowed during class. Wait for break or lunch.'};const stage=canonicalSchoolStage4A1?.(currentSchoolForPlayer4A2?.()?.educationLevel||S.school?.stage||stageOfSchool(S.school));if(stage==='primary'&&!c.afterSchool)return {ok:false,reason:'This school restricts personal device use until after classes.'};return {ok:true,context:c.lunchActive?'lunch':c.break.active?'break':c.afterSchool?'after_school':'campus'}
}
function schoolFacilityActionGate4C3(id){
 if(!playerAtSchool4C1())return null;const c=schoolFacilityContext4C3();if(id==='eat')return 'At school, use the cafeteria or your packed lunch during the lunch period.';if(id==='rest')return 'At school, use the short-rest option during break, lunch, or after school.';if(['shower','bath','sleep','nap'].includes(id))return 'That is a home routine, not a normal school action.';
 if(id==='toilet'&&c.day.classesRunning&&!c.break.active&&!c.lunchActive&&S.needs.toilet<75)return 'You are in class. Use the restroom at break unless it is urgent.';if(['washHands','washFace'].includes(id)&&c.day.classesRunning&&!c.break.active&&!c.lunchActive)return 'Wait until break or lunch for that hygiene action.';if(id==='snack'&&c.day.classesRunning&&!c.break.active&&!c.lunchActive)return 'Snacks are for breaks, lunch, or after school.';return null
}
function resolveMissedLunch4C3(){
 if(!S.school||!isSchoolDay())return false;const rec=schoolFacilityDay4C3(),lp=schoolLunchPeriod4C3(),ev=schoolDayEvent();if(rec.missedLunchApplied||currentMinute()<lp.end||!ev||!['Attending','Attended'].includes(ev.status)||ev.ateLunch)return false;rec.missedLunchApplied=true;S.needs.hunger=clamp(S.needs.hunger+12);S.energy=clamp(S.energy-3);if(!SIM.skipping)log('Missed lunch','You make it through lunch without a proper meal. Hunger rises and your afternoon energy dips.');return true
}
function reconcileSchoolFacilities4C3(reason='tick'){if(!S.school)return null;schoolFacilitiesRuntime4C3();resolveMissedLunch4C3();return schoolFacilityDay4C3()}
function migrateSchoolFacilities4C3(){if(!S.school)return null;const r=schoolFacilitiesRuntime4C3();for(const [d,rec] of Object.entries(r.days)){if(!rec||typeof rec!=='object'){delete r.days[d];continue}rec.dateISO=rec.dateISO||d;rec.schoolId=rec.schoolId||playerCurrentSchoolId4A2?.()||null;if(rec.packedLunch&&!rec.packedLunch.itemId)rec.packedLunch=null}return {schemaVersion:r.schemaVersion,days:Object.keys(r.days).length}}
function schoolFacilitiesHtml4C3({embedded=false}={}){
 if(!S.school||!needsFormalSchool())return '';const c=schoolFacilityContext4C3(),rec=schoolFacilityDay4C3(),ev=schoolDayEvent(),packed=rec.packedLunch&&packedLunchItem4C3(rec),phone=schoolDeviceUseGate4C3();
 if(!c.atSchool)return embedded?'<div class="school-today-facility-note muted-text">Campus facilities are available when you are physically at school.</div>':`<div class="mini-meta school-facilities-4c3"><span><b>Campus facilities:</b> Available when you are physically at school.</span></div>`;
 let actions=[];if(c.lunchActive){if(!ev?.ateLunch)actions.push('<button class="small primary" data-school-cafeteria4c3="1">Cafeteria lunch</button>');if(!ev?.ateLunch&&packed)actions.push('<button class="small" data-school-packed4c3="1">Eat packed lunch</button>');actions.push('<button class="small ghost" data-school-social4c3="1">Sit with school friends</button>')}
 if(c.break.active||c.lunchActive||c.afterSchool){actions.push('<button class="small ghost" data-school-restroom4c3="1">Restroom</button>','<button class="small ghost" data-school-wash4c3="1">Wash hands</button>','<button class="small ghost" data-school-rest4c3="1">Short rest</button>')}
 if((c.break.active&&c.minute>=c.lunch.end)||c.lunchActive||c.afterSchool)actions.push('<button class="small ghost" data-school-vending4c3="snackPack">Vending snack</button>');
 const status=c.lunchActive?`Lunch until ${timeLabel(c.lunch.end)}`:c.break.active?`${c.break.label} • ${c.break.minutesLeft} min left`:c.afterSchool?'After-school campus time':c.day.classesRunning?'Class in session':'Campus time';
 const details=`<span><b>Facilities:</b> ${esc(status)}</span><span><b>Phone:</b> ${phone.ok?'Allowed in this context':esc(phone.reason)}</span>${packed&&!ev?.ateLunch?`<span><b>Packed lunch:</b> ${esc(rec.packedLunch.preparedBy||'Ready')}</span>`:''}`;
 if(embedded)return `<div class="school-today-facility-meta">${details}</div><div class="school-today-action-group"><h4>Campus needs & facilities</h4><div class="school-today-buttons">${actions.join('')||'<span class="muted-text">No facility action available during this period.</span>'}</div></div>`;
 return `<div class="mini-meta school-facilities-4c3">${details}${actions.join('')}</div>`
}
function schoolFacilitiesClick4C3(b){const d=b.dataset;if(d.schoolCafeteria4c3){cafeteriaLunch4C3();save();render();return true}if(d.schoolPacked4c3){eatPackedLunch4C3();save();render();return true}if(d.schoolSocial4c3){schoolLunchSocial4C3();save();render();return true}if(d.schoolRestroom4c3){schoolRestroom4C3();save();render();return true}if(d.schoolWash4c3){schoolWashHands4C3();save();render();return true}if(d.schoolRest4c3){shortSchoolRest4C3();save();render();return true}if(d.schoolVending4c3){vendingSnack4C3(d.schoolVending4c3);save();render();return true}return false}
