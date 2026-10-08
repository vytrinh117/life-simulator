// =====================================================================
// PHASE 5C.4.5 — SEASONAL EQUIPMENT INTEGRATION / PRESENTATION / MIGRATION
// Catalog, Inventory and established activity gates remain authoritative.
// Advisory previews grant no activity eligibility or temporary ownership.
// =====================================================================
const SEASONAL_INTEGRATION_SCHEMA_5C45=1;
function seasonalGearPreview5C45(activityId){
 const spec=seasonalEquipmentRequirements5C41(activityId);
 const details=keys=>keys.map(key=>{
  const d=catalogItem(key),owned=(S.inventoryItems||[]).filter(i=>i.key===key),ready=owned.filter(i=>!i.stored&&Number(i.quantity)>0&&(!hasCondition(i.lifecycleType)||Number(i.condition)>0)&&(!['finite','consumable','perishable'].includes(i.lifecycleType)||Number(i.remaining)>0));
  const broken=owned.some(i=>hasCondition(i.lifecycleType)&&Number(i.condition)<=0);
  return {key,name:d?.name||key,owned:owned.length>0,usable:ready.length>0,broken:!ready.length&&broken,optionalEquipped:ready.some(i=>i.equipped),itemIds:ready.map(i=>i.id)};
 });
 const required=details(spec.required),optional=details(spec.optional);
 // A preview is not a safety/location/age/permission decision: those are
 // performed by seasonalGearAccess5C2() / outdoorExecutionGate5C32().
 return {activityId,required,optional,hasOwnedRequired:required.every(x=>x.usable),
  rentalAvailable:Object.prototype.hasOwnProperty.call(RENTAL_COST_5C44,activityId),
  rentalPrice:RENTAL_COST_5C44[activityId]||0,
  providerConditional:['ski_day','scuba_outing','camping_weekend'].includes(activityId),
  authority:spec.authority};
}
function seasonalItemDetail5C45(itemId){
 const it=(S.inventoryItems||[]).find(i=>i.id===itemId);if(!it)return null;
 const m=seasonalItemMetadata5C41(it.key);if(!m)return null;
 const hasCon=hasCondition(it.lifecycleType),cond=hasCon?Math.max(0,Math.min(100,Number(it.condition)||0)):null;
 const remaining=it.lifecycleType==='finite'?Math.max(0,Math.min(100,Number(it.remaining)||0)):null;
 return {id:it.id,key:it.key,activities:m.activityCompatibility.slice(),condition:cond,
  remainingPercent:remaining,remainingUses:remaining!=null&&m.maxUses?Math.ceil(remaining*m.maxUses/100)+Math.max(0,Math.floor(Number(it.quantity)||1)-1)*m.maxUses:null,
  usable:!it.stored&&Number(it.quantity)>0&&(cond==null||cond>0)&&(remaining==null||remaining>0),
  broken:cond!=null&&cond<=0,stored:!!it.stored,repairable:m.repairable,
  owned:true,rental:false};
}
function seasonalKitSummaryHtml5C45(activityId){
 const v=seasonalGearPreview5C45(activityId);if(!v.required.length&&!v.optional.length)return '';
 const status=x=>`${esc(x.name)}: ${x.usable?'usable owned':x.broken?'broken':x.owned?'stored/unavailable':'not owned'}`;
 const mandatory=v.required.length?`<p class="muted-text">Essential gear: ${v.required.map(status).join(' · ')}</p>`:'';
 const alternate=v.rentalAvailable?`<p class="muted-text">Temporary rental: ${money(v.rentalPrice)} when eligible; returned after outing. Provider access requires a legitimate provider; never adds Inventory ownership.</p>`:'';
 const optional=v.optional.length?`<p class="muted-text">Optional: ${v.optional.filter(x=>x.optionalEquipped).map(x=>esc(x.name)).join(', ')||'No eligible gear equipped'}${v.optional.some(x=>x.broken)?' · broken optional gear provides no benefit':''}</p>`:'';
 return `<div class="seasonal-kit" data-seasonal-kit="${esc(activityId)}">${mandatory}${alternate}${optional}</div>`;
}
function seasonalInventoryDetailsHtml5C45(itemId){
 const x=seasonalItemDetail5C45(itemId);if(!x)return '';
 const names=x.activities.map(id=>seasonalActivityDefinition5C1(id)?.name||id).join(' / ');
 const state=x.broken?'Broken — cannot satisfy gear checks':x.stored?'Stored — take out to use':x.usable?'Available for outings':'Unavailable';
 return `<small class="item-sub">Outdoors: ${esc(names)} · ${esc(state)}${x.remainingUses!=null?` · ${x.remainingUses} use${x.remainingUses===1?'':'s'} left`:''}${x.condition!=null?` · Condition ${Math.round(x.condition)}%`:''}</small>`;
}
// Only equipped, usable, personally owned optional items can confer benefits.
// Apply AFTER an outing succeeds, and only once per completed record.
// The gain is deliberately small; it cannot override any activity gate.
function applySeasonalGearBenefits5C45(record){
 if(!record||!SEASONAL_WEAR_5C43[record.activityId])return [];
 if(Array.isArray(record.equipmentBenefits5C45))return record.equipmentBenefits5C45;
 const cfg=record.activityId==='autumn_hike'||record.activityId==='camping_weekend'
  ?(record.weatherInconvenience?['raincoat','umbrella']:record.activityId==='autumn_hike'?['hikingBoots']:['campingMat'])
  :record.activityId==='ski_day'?['skiJacket','winterGloves']
  :['beach_day','casual_swim','sunbathe'].includes(record.activityId)?['beachTowel','swimsuit']:[];
 const selected=cfg.map(key=>seasonalWearItem5C43(key,false)).filter(Boolean);
 const unique=selected.filter((it,i,arr)=>arr.findIndex(j=>j.id===it.id)===i).slice(0,2);
 const gains=[];
 if(unique.length){
  const protect=!!record.weatherInconvenience;
  if(protect)S.energy=clamp(S.energy+Math.min(2,unique.length));
  else S.needs.fun=clamp(S.needs.fun+Math.min(2,unique.length));
  for(const it of unique)gains.push({itemId:it.id,key:it.key,effect:protect?'weather_comfort':'outing_comfort',value:1});
 }
 record.equipmentBenefits5C45=gains;
 return gains;
}
function migrateSeasonalIntegration5C45(){
 // Earlier migrations normalize existing Inventory and the 5C.2 rental store.
 // Do not create state, infer prior gear use, convert rentals to ownership,
 // repair broken gear, grant permissions, or rewrite old outing history.
 const audit=registerSeasonalItemMetadata5C41();
 return {schema:SEASONAL_INTEGRATION_SCHEMA_5C45,registered:audit.registered,
  missingCatalog:audit.missing,ownedSeasonal:(S.inventoryItems||[]).filter(i=>!!seasonalItemMetadata5C41(i.key)).length,
  rentals:(S.seasonal5C2?.rentals||[]).length};
}
