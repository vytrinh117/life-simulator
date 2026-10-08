// PHASE 6C.6 — Canonical holiday bridge, real-person anniversary gestures,
// and bounded consequences only for explicit, witnessed commitments.
// No parallel HOLIDAYS/Calendar, dates, Store/Inventory, People, RSVP or romance.
const OCC6C6_DAY_ACTIONS=new Set(['acknowledge','give_card','share_meal','reflect']);
const OCC6C6_PREP_ACTIONS=new Set(['prepare_card','promise']);
function occasionSocialLedger6C6(rec){return rec.social6C6||(rec.social6C6={schemaVersion:1,actions:[],commitments:[],consequenceProcessed:false})}
function occasionMeaningfulSocial6C6(rec,personId=null){
 const a=rec.social6C6?.actions||[];
 if(a.some(x=>x.kind!=='prepare_card'&&x.kind!=='promise'&&(personId===null||x.personId===personId)))return true;
 if((rec.gifts6C3?.transfers||[]).some(x=>personId===null||x.personId===personId))return true;
 if((rec.guests6C4?.attendance||[]).some(x=>personId===null||x.personId===personId))return true;
 if(rec.occasionType==='holiday'&&(S.holidayLog?.[`${rec.sourceKey}-${rec.occurrenceYear}`]||[]).length)return true;
 return rec.surprise6C5?.status==='completed'&&(!personId||rec.surprise6C5.celebrantPersonId===personId||rec.surprise6C5.actualAttendeeIds?.includes(personId));
}
function occasionValidSocialPerson6C6(rec,personId){
 const p=personById(personId);if(!p||p.deceased||p.movedAway)return false;
 if(rec.occasionType==='dating_anniversary'||rec.occasionType==='wedding_anniversary')return rec.celebrantPersonId===personId&&S.romance?.partnerId===personId&&
  (rec.occasionType!=='wedding_anniversary'||!!occasionWeddingDate6C1(p));
 if(rec.occasionType==='parents_anniversary')return !!S.family?.parentsAnniversaryDate&&isFamilyPerson(p)&&['mother','father'].includes(p.relation);
 if(rec.occasionType==='birthday')return rec.celebrantPersonId?rec.celebrantPersonId===personId:
  isFamilyPerson(p)||(rec.guests6C4?.attendance||[]).some(x=>x.personId===personId);
 if(rec.occasionType!=='holiday'||!HOLIDAYS.some(h=>h.id===rec.sourceKey&&holidayObserved(h)))return false;
 if(rec.sourceKey==='mothersDay')return p.relation==='mother';
 if(rec.sourceKey==='fathersDay')return p.relation==='father';
 if(['womensDay','vnWomensDay'].includes(rec.sourceKey))return p.gender==='Female'&&isFamilyPerson(p);
 if(rec.sourceKey==='valentines')return S.romance?.partnerId===personId&&!!occasionRelationshipDate6C1(p);
 if(rec.sourceKey==='teachersDay')return false; // Existing School/Holiday teacher action is authoritative.
 return isFamilyPerson(p)||(rec.guests6C4?.attendance||[]).some(x=>x.personId===personId);
}
function occasionSocialPresence6C6(personId){
 if(S.location!=='Home')return false;
 // Real co-resident family or an already accepted, actually present Home Plan.
 return occasionSurpriseHomeActor6C5(personId,currentDate(),currentMinute());
}
function occasionSocialGate6C6(id,kind,personId=null){
 const rec=occasionRecord6C1(id);if(!rec)return {ok:false,reason:'occasion_not_found'};
 if(OCCASION6C1_TERMINAL.has(rec.status))return {ok:false,reason:'occasion_terminal'};
 if(!OCC6C6_DAY_ACTIONS.has(kind)&&!OCC6C6_PREP_ACTIONS.has(kind))return {ok:false,reason:'invalid_action'};
 if(S.age<(kind==='prepare_card'?5:kind==='promise'?7:3))return {ok:false,reason:'age_restricted'};
 const day=OCC6C6_DAY_ACTIONS.has(kind);
 if(day&&(currentDate()<rec.dateISO||currentDate()>rec.endDateISO))return {ok:false,reason:'not_occasion_day'};
 if(!day){const g=occasionPreparationGate6C1(id);if(!g.ok)return g}
 if(kind==='reflect'&&!['dating_anniversary','wedding_anniversary','parents_anniversary'].includes(rec.occasionType))return {ok:false,reason:'anniversary_only'};
 if(kind!=='reflect'&&!occasionValidSocialPerson6C6(rec,personId))return {ok:false,reason:'invalid_celebrant_or_relationship'};
 if(S.location!=='Home')return {ok:false,reason:'must_be_home'};
 if(['promise','give_card','acknowledge','share_meal'].includes(kind)&&!occasionSocialPresence6C6(personId))return {ok:false,reason:'person_not_present'};
 const ledger=rec.social6C6;
 if(kind==='promise'&&ledger?.commitments?.some(x=>x.personId===personId))return {ok:false,reason:'already_promised'};
 if(kind==='give_card'&&!ledger?.actions?.some(x=>x.kind==='prepare_card'&&x.personId===personId))return {ok:false,reason:'card_not_prepared'};
 if(kind==='give_card'&&ledger?.actions?.some(x=>x.kind==='give_card'&&x.personId===personId))return {ok:false,reason:'card_already_given'};
 if(kind!=='promise'&&ledger?.actions?.some(x=>x.kind===kind&&x.personId===personId))return {ok:false,reason:'already_done'};
 const minutes={promise:5,prepare_card:25,give_card:10,acknowledge:10,share_meal:60,reflect:15}[kind];
 if(currentMinute()+minutes>1439)return {ok:false,reason:'insufficient_time'};
 if(!day&&stamp(currentDate(),currentMinute()+minutes)>=stamp(rec.preparationDeadline.dateISO,0))return {ok:false,reason:'preparation_deadline_passed'};
 return {ok:true,occasion:rec,minutes};
}
function occasionSocialAction6C6(id,kind,personId=null){
 const gate=occasionSocialGate6C6(id,kind,personId);if(!gate.ok)return gate;
 const rec=gate.occasion,ledger=occasionSocialLedger6C6(rec),p=personId?personById(personId):null;
 const entry={kind,personId:personId||null,dateISO:currentDate(),minute:currentMinute(),minutes:gate.minutes};
 ledger.actions.push(entry);
 if(kind==='promise')ledger.commitments.push({personId,dateISO:currentDate(),minute:currentMinute(),status:'promised'});
 if(p&&['acknowledge','give_card','share_meal'].includes(kind)){
  const delta=p.rel>=35&&p.conflict<70?kind==='share_meal'?2:1:0;
  if(delta)p.rel=clamp((p.rel||0)+delta);
  rememberPerson(p,`${rec.title}: ${kind==='give_card'?'received your handmade card':kind==='share_meal'?'spent time together at home':'received your personal wishes'}.`,1);
 }
 if(rec.status==='Preparation open'&&['promise','prepare_card'].includes(kind))occasionTransition6C1(id,'Planned','Explicit social preparation');
 advanceTime(gate.minutes);
 return {ok:true,action:entry};
}
function occasionHolidayAction6C6(id,activityId){
 const rec=occasionRecord6C1(id);if(!rec)return {ok:false,reason:'occasion_not_found'};
 if(rec.occasionType!=='holiday')return {ok:false,reason:'not_holiday'};
 if(OCCASION6C1_TERMINAL.has(rec.status))return {ok:false,reason:'occasion_terminal'};
 const holiday=HOLIDAYS.find(h=>h.id===rec.sourceKey&&holidayObserved(h));
 if(!holiday||holidayDate(holiday,rec.occurrenceYear)!==rec.dateISO)return {ok:false,reason:'holiday_authority_mismatch'};
 const x=holidayWindow().find(y=>y.h.id===holiday.id&&y.year===rec.occurrenceYear);
 if(!x)return {ok:false,reason:'outside_holiday_window'};
 const a=availableActivities(x).find(a=>a.id===activityId);
 if(!a)return {ok:false,reason:'activity_unavailable'};
 // This compatibility bridge must not turn school or unverifiable social scenes
 // into claimed participation, or circumvent H3 spending authorization.
 if(holiday.school||a.teacher)return {ok:false,reason:'school_authorization_required'};
 if(a.cost&&S.age<18)return {ok:false,reason:'h3_approval_required'};
 if(a.rel?.target==='friend'||a.crush||a.meet)return {ok:false,reason:'unverified_social_participant'};
 if(a.family&&!S.people.some(p=>isFamilyPerson(p)&&inHousehold(p)&&occasionSurpriseAvailable6C5(p.id,currentDate(),currentMinute())))return {ok:false,reason:'family_not_present'};
 // Navigation-only actions do not establish participation; existing People/romance
 // gift and dating interfaces remain their own authorities.
 if(a.jump||a.giftTarget||a.scene)return {ok:false,reason:'use_existing_interface'};
 const before=(S.holidayLog?.[`${holiday.id}-${x.year}`]||[]).length;
 doHolidayActivity(`${holiday.id}:${activityId}`);
 const after=(S.holidayLog?.[`${holiday.id}-${x.year}`]||[]).length;
 if(after!==before+1)return {ok:false,reason:'holiday_action_not_completed'};
 return {ok:true,holidayId:holiday.id,activityId,occasionId:id,authority:'holidayLog'};
}
function occasionReconcileConsequences6C6(rec){
 const ledger=rec.social6C6;
 if(!ledger||ledger.consequenceProcessed||!OCCASION6C1_TERMINAL.has(rec.status))return;
 if(currentDate()<=rec.endDateISO)return; // No premature penalties on the day.
 ledger.consequenceProcessed=true;
 for(const commitment of ledger.commitments||[]){
  if(commitment.status!=='promised')continue;
  const p=personById(commitment.personId);
  if(occasionMeaningfulSocial6C6(rec,commitment.personId)){
   commitment.status='honored';continue;
  }
  if(rec.status==='Cancelled'||rec.status==='Declined'||!p||p.movedAway||p.deceased||p.rel<60||p.conflict>=60||!occasionSurpriseAvailable6C5(p.id,rec.dateISO,1080)){
   commitment.status='excused';continue;
  }
  // The only omission penalty is a *player-made promise*, once, bounded,
  // to a real available person who was close enough to have expectations.
  p.trust=clamp((p.trust||0)-1);
  commitment.status='missed';
  rememberPerson(p,`You had promised to acknowledge ${rec.title}, but did not follow through.`,1);
 }
}
