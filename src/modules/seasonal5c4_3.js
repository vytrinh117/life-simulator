// =====================================================================
// PHASE 5C.4.3 — SEASONAL CONSUMABLES / REAL EQUIPMENT WEAR
// Reuses existing Inventory instances, condition, useLog, and activity
// executors. No rental ownership, repair service, or parallel lifecycle.
// =====================================================================
const SEASONAL_WEAR_5C43=Object.freeze({
 ski_day:{skiGear:1.1,skiJacket:.3,skiPants:.3,skiBoots:.55,skiHelmet:.2,winterGloves:.2},
 scuba_outing:{scubaGear:.9},
 camping_weekend:{tent:1.1,sleepingBag:.7,campingMat:.35,campingLantern:.35,flashlight:.2,campingCookware:.4},
 autumn_hike:{hikingBoots:.7,backpack:.25,raincoat:.15,flashlight:.15,waterBottle:.1},
 beach_day:{beachTowel:.15,swimsuit:.2},casual_swim:{swimsuit:.3,swimGoggles:.2,swimCap:.15},
 build_snowman:{winterGloves:.2,snowBoots:.35,skiJacket:.2},sunbathe:{beachTowel:.12}
});
// One existing owned instance per SKU. Optional items are used only when
// actively equipped. A stored, depleted or broken item is never selected.
function seasonalWearItem5C43(key,mandatory){
 const matches=(S.inventoryItems||[]).filter(it=>it.key===key&&!it.stored&&hasCondition(it.lifecycleType)&&Number(it.condition)>0&&Number(it.quantity||1)>0&&(mandatory||it.equipped));
 return matches.sort((a,b)=>Number(b.condition)-Number(a.condition)||String(a.id).localeCompare(String(b.id)))[0]||null;
}
function applySeasonalEquipmentUse5C43(record){
 if(!record||!SEASONAL_WEAR_5C43[record.activityId])return [];
 // The completed activity record is the idempotency authority. It is never
 // populated by planning, weather cancellation, failure or migration.
 if(Array.isArray(record.equipmentUse5C43))return record.equipmentUse5C43;
 const wear=SEASONAL_WEAR_5C43[record.activityId],entries=[];
 const required=seasonalEquipmentRequirements5C41(record.activityId).required;
 const owned=record.gearAccess==='owned';
 for(const [key,loss] of Object.entries(wear)){
  const mandatory=required.includes(key);
  // Provider/rented required equipment cannot silently wear a personal item.
  if(mandatory&&!owned)continue;
  const it=seasonalWearItem5C43(key,mandatory);if(!it)continue;
  const before=Number(it.condition);setItemCondition(it,Math.max(0,before-loss));
  it.timesUsed=Math.max(0,Number(it.timesUsed)||0)+1;
  it.lastUsedDate=record.dateISO||currentDate();
  const prev=it.useLog?.date===it.lastUsedDate?Math.max(0,Number(it.useLog.count)||0):0;
  it.useLog={date:it.lastUsedDate,count:prev+1};
  entries.push({itemId:it.id,key,before,after:it.condition});
 }
 record.equipmentUse5C43=entries;return entries;
}
// 5C.2 sunscreen remains a five-application finite supply (20% per use).
// The common helper handles unopened stacks using the existing openOne()
// semantics, records real usage and removes only the exhausted instance.
function consumeSeasonalSupply5C43(key,percent){
 const meta=seasonalItemMetadata5C41(key),size=Number(percent);
 if(!meta||!meta.consumable||meta.lifecycleType!=='finite'||!Number.isFinite(size)||size<=0||size>100)return {ok:false,reason:'unsupported_supply'};
 // Finish a previously opened bottle before splitting a new unopened stack.
 const source=(S.inventoryItems||[]).find(it=>it.key===key&&it.opened&&!it.stored&&Number(it.remaining)>0)||findUsable(key);if(!source)return {ok:false,reason:key==='sunscreen'?'no_sunscreen':'no_supply'};
 const it=openOne(source),before=Math.max(0,Math.min(100,Number(it.remaining)||0));
 if(before<=0)return {ok:false,reason:'depleted'};
 it.remaining=Math.max(0,before-size);
 it.timesUsed=Math.max(0,Number(it.timesUsed)||0)+1;
 const date=currentDate(),previous=it.useLog?.date===date?Math.max(0,Number(it.useLog.count)||0):0;
 it.useLog={date,count:previous+1};it.lastUsedDate=date;
 const result={ok:true,itemId:it.id,remaining:it.remaining};
 if(it.remaining<=.5)removeItem(it.id);
 return result;
}
