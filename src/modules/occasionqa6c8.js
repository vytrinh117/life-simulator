// PHASE 6C.8 — QA-only deterministic production-action fuzz runner.
// Invoked exclusively from the existing Playwright test bridge.
// Never runs during regular gameplay or persists test metadata.
function occasionReleaseFuzz6C8(seed=620608,steps=80){
 let x=(Number(seed)>>>0)||1;
 const roll=(n)=>{x^=x<<13;x^=x>>>17;x^=x<<5;return (x>>>0)%n};
 const failures=[],count={};
 const person=S.people.find(p=>p?.id&&!p.deceased&&!p.movedAway);
 const cYear=2028,personId=person?.id;
 const calendarOriginal=JSON.stringify(S.calendar||[]),plansOriginal=JSON.stringify(S.plans||[]);
 function invariant(step){
  const occ=occasionState6C1().occurrences,ids=Object.keys(occ),persons=new Set((S.people||[]).map(p=>p.id));
  if(new Set(ids).size!==ids.length)failures.push(`${step}:duplicate_occurrence_keys`);
  if(!Number.isFinite(S.money)||S.money<0)failures.push(`${step}:negative_or_invalid_money`);
  if(JSON.stringify(S.calendar||[])!==calendarOriginal)failures.push(`${step}:unexpected_calendar_mutation`);
  if(JSON.stringify(S.plans||[])!==plansOriginal)failures.push(`${step}:unexpected_plans_mutation`);
  for(const [id,r] of Object.entries(occ)){
   if(r.occasionId!==id||!id.endsWith(':'+r.occurrenceYear))failures.push(`${step}:broken_occurrence_identity`);
   if(r.celebrantPersonId&&!persons.has(r.celebrantPersonId)&&!OCCASION6C1_TERMINAL.has(r.status))failures.push(`${step}:invalid_celebrant`);
   if((r.guests6C4?.invitations||[]).length!==new Set((r.guests6C4?.invitations||[]).map(y=>y.personId)).size)failures.push(`${step}:duplicate_rsvp`);
   for(const a of r.guests6C4?.attendance||[]){const inv=r.guests6C4.invitations.find(y=>y.personId===a.personId);if(!inv||inv.status!=='Accepted'||!inv.attended)failures.push(`${step}:false_attendance`)}
   const transfers=r.gifts6C3?.transfers||[];
   if(transfers.length!==new Set(transfers.map(t=>t.itemId)).size)failures.push(`${step}:duplicate_gift_transfer`);
   for(const t of transfers)if(!persons.has(t.personId)||(S.inventoryItems||[]).some(i=>i.id===t.itemId))failures.push(`${step}:gift_not_transferred`);
   if(r.surprise6C5?.actualAttendeeIds?.some(pid=>!persons.has(pid)))failures.push(`${step}:fictitious_party_guest`);
   if(r.planning6C2?.actualCost>r.planning6C2?.budget)failures.push(`${step}:over_budget`);
  }
  if((S.inventoryItems||[]).some(i=>Number.isFinite(i.quantity)&&i.quantity<0))failures.push(`${step}:negative_inventory`);
 }
 const dateOptions=['2028-03-01','2028-03-07','2028-03-10','2028-03-12','2029-03-01','2029-03-07','2029-03-10','2029-03-12'];
 let last='';for(let step=0;step<steps;step++){
  // Keep operation sequences chronological within each annual episode.
  const date=dateOptions[Math.min(dateOptions.length-1,Math.floor(step*dateOptions.length/steps))];
  S.clock.dateISO=date;S.clock.minute=600+(roll(3)*120);S.location='Home';
  try{
   reconcileOccasions6C1('release-fuzz');
   const yr=Number(date.slice(0,4)),rid=occasionId6C1('birthday','player',yr),r=occasionRecord6C1(rid);
   if(!r) {failures.push(`${step}:missing_player_birthday`);continue}
   const action=roll(17);const k=['budget','quiet','food_select','invitations_prepare','invite','repeat_invite','social','invalid_gift','invalid_attendance','cancel','reconcile','wrong_venue','bad_budget','purchase','gift_select','gift_deliver','age_progress'][action];count[k]=(count[k]||0)+1;
   let out;
   switch(k){
    case 'budget':out=occasionPrepare6C2(rid,'budget',50+roll(5)*50);break;
    case 'quiet':out=occasionPrepare6C2(rid,'quiet');break;
    case 'food_select':out=occasionPrepare6C2(rid,'food_select');break;
    case 'invitations_prepare':out=occasionPrepare6C2(rid,'invitations_prepare');break;
    case 'invite':out=occasionInvite6C4(rid,personId,1080);break;
    case 'repeat_invite':out=occasionInvite6C4(rid,personId,1080);break;
    case 'social':out=occasionSocialAction6C6(rid,'prepare_card',personId);break;
    case 'invalid_gift':out=occasionGiveGift6C3(rid,'missing-item',personId);break;
    case 'invalid_attendance':out=occasionConfirmAttendance6C4(rid,personId);break;
    case 'cancel':out=occasionPrepare6C2(rid,'cancel');break;
    case 'reconcile':{const cash=S.money,items=JSON.stringify(S.inventoryItems),before=JSON.stringify(r.gifts6C3||null);reconcileOccasions6C1('repeat');if(S.money!==cash||JSON.stringify(S.inventoryItems)!==items||JSON.stringify(r.gifts6C3||null)!==before)failures.push(`${step}:projection_reward`);break}
    case 'wrong_venue':out=occasionPrepare6C2(rid,'venue','Unverified Venue');break;
    case 'bad_budget':out=occasionPrepare6C2(rid,'budget',-50);break;
    case 'purchase':{
     const beforeCash=S.money,beforeCount=S.inventoryItems.length;
     // Use the genuine Store/Inventory purchase path, never manufacture an item.
     buyWithOwnMoney('greetingCard');
     if(S.inventoryItems.length>beforeCount&&S.money>=beforeCash)failures.push(`${step}:unpaid_store_item`);
     break;
    }
    case 'gift_select':{
     const item=S.inventoryItems.find(it=>it.key==='greetingCard'&&!it.stored&&!it.equipped
       &&!Object.values(occasionState6C1().occurrences).some(oc=>oc.gifts6C3?.selected?.some(z=>z.itemId===it.id)));
     if(item)out=occasionSelectGift6C3(rid,item.id,personId);
     break;
    }
    case 'gift_deliver':{
     const item=r.gifts6C3?.selected?.find(z=>z.personId===personId&&S.inventoryItems.some(it=>it.id===z.itemId));
     if(item){const c=S.money;out=occasionGiveGift6C3(rid,item.itemId,personId);if(out.ok&&S.money!==c)failures.push(`${step}:double_charged_delivery`)}
     break;
    }
    case 'age_progress':S.age=[12,16,25,30][roll(4)];break;
   }
   if((k==='invalid_gift'||k==='wrong_venue'||k==='bad_budget')&&out?.ok)failures.push(`${step}:invalid_action_accepted_${k}`);
   invariant(step);last=k;
  }catch(e){failures.push(`${step}:exception:${String(e?.stack||e).slice(0,130)}`)}
 }
 return {steps,seed,failures:failures.slice(0,25),totalFailures:failures.length,counts:count,last,years:Object.keys(occasionState6C1().occurrences).filter(k=>k.startsWith('occ6c1:birthday:player:')).sort()};
}
