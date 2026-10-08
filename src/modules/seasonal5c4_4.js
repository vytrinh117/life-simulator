// PHASE 5C.4.4 — Temporary seasonal rental transactions and seasonal gear services.
// Inventory remains the only ownership source; H3 the only minor authority.
const RENTAL_COST_5C44=Object.freeze({ski_day:38,scuba_outing:42,camping_weekend:24});
function seasonalRentalStore5C44(){
 const rentals=ensureSeasonalState5C2().rentals;
 // Lazy expiry of newly issued rentals only; do not rewrite legacy rental history.
 for(const r of rentals)if(r.id?.startsWith('rental44:')&&r.status==='active'&&r.expiresDateISO&&currentDate()>r.expiresDateISO){r.status='expired';r.closedDateISO=currentDate()}
 return rentals;
}
function seasonalGearServicePermission5C44(kind,key,cost,context={}){
 if(S.age>=18)return {ok:true,required:false};
 const d=catalogItem(key)||{name:key,category:'Weather & outdoors',price:cost,description:'Safety equipment'};
 const q=requestDecision({requestType:`seasonal${kind}Permission`,targetKey:key,context:{...context,cost,kind},decide:maker=>{
  const score=purchaseScore({...d,price:cost},false)-(kind==='Rental'?2:0),ok=score>=45;
  return {outcome:ok?'Yes':'No',resolved:true,reason:ok?`${decisionMakerLabel(maker)} approves this ${kind.toLowerCase()}.`:`${decisionMakerLabel(maker)} declines this ${kind.toLowerCase()}.`};
 }});
 if(q.error)return {ok:false,reason:'no_guardian',detail:q.error};
 return {ok:q.record.outcome==='Yes',required:true,record:q.record,reused:q.reused,reason:q.record.outcome==='Yes'?null:'permission_denied'};
}
function seasonalRentalKey5C44(activityId,dateISO,startMinute){return `rental44:${activityId}:${dateISO}:${startMinute}`}
function acquireSeasonalRental5C44(activityId,{dateISO=currentDate(),startMinute=currentMinute(),extraCost=0}={}){
 const cost=RENTAL_COST_5C44[activityId];if(!cost)return {ok:false,reason:'unsupported_rental'};
 const def=seasonalActivityDefinition5C1(activityId);if(!def||S.age<def.minAge)return {ok:false,reason:'age'};
 const rentals=seasonalRentalStore5C44(),id=seasonalRentalKey5C44(activityId,dateISO,startMinute),old=rentals.find(r=>r.id===id);
 if(old){if(old.status==='active')return {ok:true,mode:'rent',rental:old,reused:true,charged:0};return {ok:false,reason:'rental_already_settled',rental:old}}
 const permission=seasonalGearServicePermission5C44('Rental',activityId,cost,{dateISO,startMinute,activityId});
 if(!permission.ok)return {ok:false,reason:permission.reason||'permission_denied',permission};
 if(availableFunds()<cost+Number(extraCost||0))return {ok:false,reason:'money',detail:`Rental and outing cost ${money(cost+Number(extraCost||0))}.`};
 if(!spendOwn(cost))return {ok:false,reason:'money'};
 const rec={id,activityId,dateISO,startMinute,cost,temporary:true,status:'active',expiresDateISO:activityId==='camping_weekend'?addDays(dateISO,1):dateISO,permissionDecisionId:permission.record?.id||null};
 rentals.push(rec);return {ok:true,mode:'rent',rental:rec,charged:cost};
}
function finishSeasonalRental5C44(rec,status='returned'){
 if(!rec)return null;const r=seasonalRentalStore5C44().find(x=>x.id===rec.id);
 if(!r)return null;if(r.status==='active'){r.status=status==='cancelled'?'cancelled':'returned';r.closedDateISO=currentDate();r.closedMinute=currentMinute()}
 return r;
}
function seasonalRentalStatus5C44(id){const r=seasonalRentalStore5C44().find(x=>x.id===id);return r?{...r}:null}
function seasonalRepairQuote5C44(itemId){
 const it=(S.inventoryItems||[]).find(x=>x.id===itemId),d=it&&catalogItem(it.key);
 if(!it||!d||!seasonalItemMetadata5C41(it.key))return {ok:false,reason:'not_seasonal_gear'};
 if(!hasCondition(it.lifecycleType)||!d.repairable)return {ok:false,reason:'not_repairable'};
 if(!Number.isFinite(it.condition)||it.condition>=90)return {ok:false,reason:'no_repair_needed'};
 const cost=Math.max(3,Math.round(d.price*.12*((100-it.condition)/50)));
 return {ok:true,itemId:it.id,key:it.key,before:it.condition,cost,after:Math.min(it.condition<=0?70:95,it.condition+45)};
}
function repairSeasonalGear5C44(itemId){
 const quote=seasonalRepairQuote5C44(itemId);if(!quote.ok)return quote;
 const permission=seasonalGearServicePermission5C44('Repair',quote.key,quote.cost,{itemId,dateISO:currentDate(),condition:quote.before});
 if(!permission.ok)return {ok:false,reason:permission.reason||'permission_denied',permission};
 if(!spendOwn(quote.cost))return {ok:false,reason:'money',cost:quote.cost};
 const it=S.inventoryItems.find(x=>x.id===itemId);setItemCondition(it,quote.after);advanceTime(30);
 log(`Repaired ${it.name.toLowerCase()}`,`Condition ${Math.round(quote.before)}% → ${Math.round(it.condition)}% • ${money(quote.cost)}.`);
 return {ok:true,cost:quote.cost,itemId:it.id,before:quote.before,after:it.condition,permissionDecisionId:permission.record?.id||null};
}
function replaceSeasonalGear5C44(itemId){
 const it=(S.inventoryItems||[]).find(x=>x.id===itemId),d=it&&catalogItem(it.key);
 if(!it||!d||!seasonalItemMetadata5C41(it.key)||!hasCondition(it.lifecycleType))return {ok:false,reason:'not_seasonal_gear'};
 if(it.condition>0)return {ok:false,reason:'not_broken'};
 if(S.age<d.minAge)return {ok:false,reason:'age'};
 // Replace exactly one broken instance. Existing unbroken inventory is never touched.
 const permission=seasonalGearServicePermission5C44('Replacement',it.key,d.price,{itemId,dateISO:currentDate(),condition:0});
 if(!permission.ok)return {ok:false,reason:permission.reason||'permission_denied',permission};
 if(!spendOwn(d.price))return {ok:false,reason:'money',cost:d.price};
 const oldKey=it.key;removeItem(itemId,true);const fresh=addItem(oldKey,'replacement purchase');
 if(!fresh){return {ok:false,reason:'catalog_missing'}}
 // Existing addItem() records free-priced non-own-money sources; correct only this transaction.
 const history=S.purchaseHistory.find(x=>x.key===oldKey&&x.source==='replacement purchase'&&x.dateISO===currentDate());
 if(history)history.price=d.price;
 advanceTime(15);log('Replaced broken equipment',`${d.name} replaced for ${money(d.price)}.`);
 return {ok:true,oldItemId:itemId,itemId:fresh.id,cost:d.price,permissionDecisionId:permission.record?.id||null};
}
