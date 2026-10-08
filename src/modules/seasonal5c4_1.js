// =====================================================================
// PHASE 5C.4.1 — SEASONAL ITEM METADATA / COMPATIBLE INVENTORY CONTRACT
// Foundation only. Existing Inventory owns item lifecycle and purchase flow;
// 5C.2/5C.3 remain the final authorities for activity equipment access.
// =====================================================================
const SEASONAL_ITEM_SCHEMA_5C41=1;
// Roles here describe catalog IDs; they never grant equipment or ownership.
// 5C.4.2 adds real Store entries for the previously missing required gear.
const SEASONAL_ITEM_ROLES_5C41=Object.freeze({
 skiGear:{tags:['ski','safety'],activities:['ski_day'],role:'mandatory',temporary:['rent','provider']},
 skiJacket:{tags:['ski','cold','insulation'],activities:['ski_day','build_snowman'],role:'optional'},
 skiPants:{tags:['ski','cold','waterproof'],activities:['ski_day','build_snowman'],role:'optional'},
 skiBoots:{tags:['ski','footwear'],activities:['ski_day'],role:'optional'},
 skiHelmet:{tags:['ski','safety'],activities:['ski_day'],role:'optional'},
 winterGloves:{tags:['cold','insulation'],activities:['ski_day','build_snowman'],role:'optional'},
 snowBoots:{tags:['snow','footwear'],activities:['build_snowman','ski_day'],role:'optional'},
 swimsuit:{tags:['swim','beach','clothing'],activities:['casual_swim','beach_day'],role:'optional'},
 swimGoggles:{tags:['swim','eye_protection'],activities:['casual_swim'],role:'optional'},
 swimCap:{tags:['swim','hair_protection'],activities:['casual_swim'],role:'optional'},
 beachTowel:{tags:['beach','comfort'],activities:['beach_day','casual_swim','sunbathe'],role:'optional'},
 snorkelSet:{tags:['snorkel','surface_water'],activities:['beach_day'],role:'optional'},
 campingMat:{tags:['camping','comfort'],activities:['camping_weekend'],role:'optional'},
 campingLantern:{tags:['camping','light'],activities:['camping_weekend'],role:'optional'},
 flashlight:{tags:['camping','hiking','light'],activities:['camping_weekend','autumn_hike'],role:'optional'},
 campingCookware:{tags:['camping','cooking'],activities:['camping_weekend'],role:'optional'},
 hikingBoots:{tags:['hiking','footwear'],activities:['autumn_hike'],role:'optional'},

 scubaGear:{tags:['scuba','diving'],activities:['scuba_outing'],role:'mandatory',temporary:['rent','provider']},
 tent:{tags:['camping','shelter'],activities:['camping_weekend'],role:'mandatory',temporary:['rent','family_provider']},
 sleepingBag:{tags:['camping','sleep'],activities:['camping_weekend'],role:'mandatory',temporary:['rent','family_provider']},
 sunscreen:{tags:['sun','skin_protection'],activities:['beach_day','sunbathe'],role:'optional'},
 sunglasses:{tags:['sun','eye_protection'],activities:['beach_day','sunbathe','autumn_hike'],role:'optional'},
 cap:{tags:['sun','shade'],activities:['beach_day','autumn_hike'],role:'optional'},
 umbrella:{tags:['rain','weather_protection'],activities:['autumn_hike','camping_weekend'],role:'optional'},
 raincoat:{tags:['rain','weather_protection'],activities:['autumn_hike','camping_weekend'],role:'optional'},
 sweater:{tags:['cold','insulation'],activities:['ski_day','camping_weekend'],role:'optional'},
 hoodie:{tags:['cold','insulation'],activities:['camping_weekend'],role:'optional'},
 waterBottle:{tags:['hydration','hiking'],activities:['autumn_hike','camping_weekend'],role:'optional'},
 backpack:{tags:['storage','hiking'],activities:['autumn_hike','camping_weekend'],role:'optional'}
});
function registerSeasonalItemMetadata5C41(){
 // 5C.2 alone is authorized to register the already-implemented sunscreen.
 registerSeasonalCatalog5C2();
 let registered=0,missing=[];
 for(const [key,role] of Object.entries(SEASONAL_ITEM_ROLES_5C41)){
  const d=D.catalog[key];if(!d){missing.push(key);continue}
  // Add only absent 5C.4 metadata; never replace the catalog object or its
  // existing lifecycle, price, category, age, or other authorititative fields.
  if(!d.seasonalEquipment5C4)d.seasonalEquipment5C4={schema:SEASONAL_ITEM_SCHEMA_5C41,tags:[...role.tags],activities:[...role.activities],role:role.role,temporary:[...(role.temporary||[])]};
  registered++;
 }
 return {registered,missing};
}
function seasonalItemMetadata5C41(key){
 const d=D.catalog[key];if(!d)return null;
 const m=d.seasonalEquipment5C4;if(!m)return null;
 const lt=lifecycleOf(d);
 return {key,category:d.category,lifecycleType:lt,consumable:['consumable','perishable','finite'].includes(lt),
  maxUses:key==='sunscreen'?5:(Number.isFinite(d.units)?d.units:null),
  maxCondition:hasCondition(lt)?100:null,repairable:!!d.repairable&&hasCondition(lt),
  rentalEligible:!!m.temporary?.includes('rent'),minAge:d.minAge??0,
  permissionPrice:d.permissionPrice??null,
  equipmentTags:[...(m.tags||[])],activityCompatibility:[...(m.activities||[])],
  role:m.role,temporaryAccess:[...(m.temporary||[])]};
}
function seasonalEquipmentRequirements5C41(activityId){
 const required=Object.entries(SEASONAL_ITEM_ROLES_5C41).filter(([,v])=>v.role==='mandatory'&&v.activities.includes(activityId)).map(([key])=>key);
 const optional=Object.entries(SEASONAL_ITEM_ROLES_5C41).filter(([,v])=>v.role==='optional'&&v.activities.includes(activityId)).map(([key])=>key);
 return {activityId,required,optional,missingCatalog:required.filter(key=>!D.catalog[key]),
  // Advisory metadata only: does not supersede seasonalGearAccess5C2 / outdoorEquipment5C32.
  authority:activityId==='camping_weekend'?'outdoorEquipment5C32':'seasonalGearAccess5C2'};
}
function seasonalOwnedItemView5C41(itemId){
 const it=(S.inventoryItems||[]).find(i=>i.id===itemId);if(!it)return null;
 const meta=seasonalItemMetadata5C41(it.key);if(!meta)return null;
 const usable=!it.stored&&(!hasCondition(it.lifecycleType)||it.condition>0)&&(it.lifecycleType!=='finite'||it.remaining>0);
 return {id:it.id,key:it.key,quantity:it.quantity,remaining:it.remaining,condition:it.condition,
  usable,metadata:meta};
}
function migrateSeasonalItems5C41(){
 const audit=registerSeasonalItemMetadata5C41();let normalized=0;
 // Only normalize explicit, already-owned, recognized seasonal item instances.
 // No addItem(), no new state container, no rentals copied into ownership.
 for(const it of S.inventoryItems||[]){
  if(!it||!D.catalog[it.key]||!SEASONAL_ITEM_ROLES_5C41[it.key])continue;
  const lt=it.lifecycleType||lifecycleOf(D.catalog[it.key]);
  if(!Number.isFinite(it.quantity)||it.quantity<1||it.quantity%1!==0){it.quantity=Math.max(1,Math.floor(Number(it.quantity)||1));normalized++}
  if(lt==='finite'&&(!Number.isFinite(it.remaining)||it.remaining<0||it.remaining>100)){
   it.remaining=Number.isFinite(it.remaining)?Math.max(0,Math.min(100,it.remaining)):100;normalized++;
  }
  if(hasCondition(lt)&&(!Number.isFinite(it.condition)||it.condition<0||it.condition>100)){
   it.condition=Number.isFinite(it.condition)?Math.max(0,Math.min(100,it.condition)):100;normalized++;
  }
 }
 return {...audit,normalized,schema:SEASONAL_ITEM_SCHEMA_5C41};
}
