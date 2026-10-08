// PHASE 6B.7 — QA-only browser fuzz harness. No gameplay UI or persisted new state.
function promNightFuzz6B7(initialSeed,steps=60){

let nSteps=0,problems=[],actions={},seed=Number(initialSeed)||620260;
const rnd=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return seed>>>0};
const pick=x=>x[rnd()%x.length];
const pid=S.school.prom.foundation6A1.eventId;
const safe=(fn)=>{try {const result=fn();return result;}catch(e){problems.push('exception '+String(e));return null;}};
const verify=()=>{
 const pr=S.school.prom,n=pr?.night6B1;
 if(!pr||!n||pr.foundation6A1.eventId!==pid||n.eventId!==pid)problems.push('lost canonical identity');
 if(!n)return;
 const a=n.arrivals6B3,m=n.moments6B4,c=n.ceremony6B5,x=n.after6B6;
 if(n.schoolId!==pr.foundation6A1.schoolId||n.venue!==pr.venue)problems.push('wrong school/venue');
 if(a){if(new Set(a.attendeeIds).size!==a.attendeeIds.length)problems.push('duplicate attendee');for(const id of a.attendeeIds){if(!S.npcs.some(z=>z.id===id))problems.push('imaginary NPC');}}
 if(m){if(m.soloCount>2||m.breakCount>2||m.refreshCount>2||m.momentCount>2)problems.push('activity farm');if(new Set(m.danceAttempts.map(z=>z.npcId)).size!==m.danceAttempts.length)problems.push('repeat dance coercion');if(new Set(m.talkedNpcIds).size!==m.talkedNpcIds.length)problems.push('repeat conversation');}
 if(c){if(c.photos.length>4||new Set(c.photoIds).size!==c.photoIds.length)problems.push('duplicate photos');if(c.ceremony&&c.ceremony.ballotEventId!==pid)problems.push('wrong Court results');}
 if(x){if(new Set(x.farewells.map(z=>z.npcId)).size!==x.farewells.length)problems.push('farewell farm');if(x.checkout&&n.status!=='completed')problems.push('checkout but not completed');}
 if(S.milestones.filter(z=>z.promKind6B6==='first_attended_prom').length>1)problems.push('repeated first-Prom milestone');
 if(n.status==='completed'&&S.location==='School')problems.push('completed still at school');
 if(n.status==='completed'&&S.calendar.some(z=>z.id===pid&&z.status==='Attending'))problems.push('stale attending calendar');
};
for(let i=0;i<steps;i++){
 if(i===0){S.clock.dateISO=S.school.prom.dateISO;S.clock.minute=1020;S.location='Home';}
 if(i===8){S.clock.minute=1140;S.location='Home';safe(()=>ensureProm());}
 if(i===35){S.clock.minute=1260;safe(()=>ensureProm());}
 if(i===50){safe(()=>leavePromNight6B1());}
 const pr=S.school.prom, night=pr.night6B1,a=night.arrivals6B3,ids=a?.attendeeIds||[];
 const candidate=ids.length?pick(ids):'not-a-student';
 const options=[
 ['reconcile',()=>reconcilePromNight6B1()],
 ['tryEntry',()=>enterPromNight6B1()],
 ['greet',()=>promArrivalGreet6B3(candidate)],
 ['talk',()=>promMomentsAction6B4('talk',candidate)],
 ['dance',()=>promMomentsAction6B4('dance',candidate)],
 ['solo',()=>promMomentsAction6B4('solo')],
 ['rest',()=>promMomentsAction6B4('break')],
 ['refresh',()=>promMomentsAction6B4('refresh')],
 ['atmosphere',()=>promMomentsAction6B4('moment')],
 ['photoSolo',()=>promPhotoTake6B5('solo',[])],
 ['photoPair',()=>promPhotoTake6B5('paired',[candidate])],
 ['ceremony',()=>promCeremonyPresent6B5()],
 ['farewell',()=>promFarewell6B6(candidate)],
 ['hair',()=>promHair6B2()],
 ['makeup',()=>promMakeupSelf6B2()],
 ['homeResponse',()=>promHomeResponse6B6('quiet')],
 ];
 let [name,fn]=pick(options);
 if(i===9) [name,fn]=options[1];
 if(i===36) [name,fn]=options[11];
 if(i===52) [name,fn]=options[15];
 const result=safe(fn);actions[name]=(actions[name]||0)+1;nSteps++;
 if(result&&typeof result==='object'&&result.ok===false&&result.reason==='unknown_action')problems.push('unknown operation '+name);
 verify();
}
return {steps:nSteps,violations:problems.slice(0,25),actions,status:S.school.prom.night6B1.status,
 eventId:pid,ceremony:!!S.school.prom.night6B1.ceremony6B5?.ceremony,photos:S.school.prom.night6B1.ceremony6B5?.photos.length||0,
 milestones:S.milestones.filter(z=>z.promKind6B6==='first_attended_prom').length};

}
