// PHASE 5D.2 — stock sourced from actual purchases or owned Inventory.
// These APIs are backend-only. Customer choices/UI are reserved for 5D.3/5D.6.
const MICRO_BAKE_ITEMS_5D2=Object.freeze({cookies:['bakedCookies','heartCookies'],cupcakes:['cupcakes']});
const MICRO_CENTS_5D2=n=>Math.round(n*100)/100;
function microbusinessBatchProduct5D2(kind){return D.standProducts.find(p=>p.id===BIZ_TYPES[kind]?.product)||null}
function microbusinessBatch5D2(s,batchId){return s.batches.find(b=>b.batchId===batchId)||null}
function microbusinessPrice5D2(kind,price){const n=Number(price);return Number.isFinite(n)&&n>=0.5&&n<= (kind==='yard'?10000:500)&&MICRO_CENTS_5D2(n)===n}
function microbusinessPreparationGate5D2(s){
 if(!s||s.status!=='preparing')return {ok:false,reason:'invalid_session_state'};
 const source=microbusinessSource5D1(s.businessId);
 if(!source||source.kind!==s.businessType)return {ok:false,reason:'business_no_longer_valid'};
 if(s.dateISO!==currentDate())return {ok:false,reason:'session_expired'};
 const gate=microbusinessEligibility5D1(s.businessType,s.location);
 if(!gate.ok)return gate;
 const permission=microbusinessPermission5D1(s.businessType,s.location);
 if(!permission.ok)return {ok:false,reason:'permission_denied'};
 return {ok:true};
}
function microbusinessValidateYardItem5D2(itemId,{sessionId=null,businessId=null}={}){
 const it=(S.inventoryItems||[]).find(x=>x.id===itemId);
 if(!it)return {ok:false,reason:'item_not_owned'};
 if(it.equipped||it.stored||it.wrapped||it.locked||it.questLocked||it.isSpare===false||S.phone?.activeItemId===it.id||
     catalogItem(it.key)?.phone||it.lifecycleType==='perishable'&&isSpoiled(it))return {ok:false,reason:'item_ineligible'};
 if(!catalogItem(it.key)||!Number.isInteger(it.quantity||1)||(it.quantity||1)<=0||itemValue(it)<=0)return {ok:false,reason:'item_ineligible'};
 // Reservations held by active canonical sessions cannot be sold elsewhere.
 if(ensureMicrobusiness5D1().sessions.some(s=>s.id!==sessionId&&!['completed','cancelled'].includes(s.status)&&s.batches.some(b=>b.itemId===itemId&&b.remaining>0)))return {ok:false,reason:'item_reserved'};
 if((Array.isArray(S.businesses)?S.businesses:[]).some(b=>(!businessId||b.id!==businessId)&&b.status!=='Retired'&&(b.listed||[]).some(l=>l.itemId===itemId&&!l.sold)))return {ok:false,reason:'item_reserved'};
 return {ok:true,item:it,value:Math.max(1,Math.round(itemValue(it)/(it.quantity||1)))};
}
function microbusinessSetPrice5D2(sessionId,batchId,price){
 const s=microbusinessSession5D1(sessionId),gate=microbusinessPreparationGate5D2(s);
 if(!gate.ok)return gate;
 const b=microbusinessBatch5D2(s,batchId);
 if(!b)return {ok:false,reason:'unknown_batch'};
 if(!microbusinessPrice5D2(s.businessType,price))return {ok:false,reason:'invalid_price'};
 if(s.businessType==='yard'&&Number(price)>Math.max(5,Math.ceil((b.valueAtListing||0)*2.5)))return {ok:false,reason:'price_exceeds_value'};
 b.unitPrice=Number(price);s.pricing[b.batchId]=b.unitPrice;return {ok:true,batch:b};
}
function microbusinessPrepareBatch5D2(sessionId,{batchId,quantity,unitPrice,itemId=null,storedBatchId=null}={}){
 const s=microbusinessSession5D1(sessionId),gate=microbusinessPreparationGate5D2(s);
 if(!gate.ok)return gate;
 const duplicate=microbusinessBatch5D2(s,batchId);
 if(duplicate){const sig=JSON.stringify({quantity,unitPrice:Number(unitPrice),itemId,storedBatchId});return duplicate.preparationSignature5D2===sig?{ok:true,reused:true,batch:duplicate,cost:0}:{ok:false,reason:'duplicate_batch_conflict'}};
 if(typeof batchId!=='string'||!batchId.trim()||!Number.isInteger(quantity)||quantity<=0||quantity>200||!microbusinessPrice5D2(s.businessType,unitPrice))return {ok:false,reason:'invalid_batch'};
 const kind=s.businessType,product=microbusinessBatchProduct5D2(kind),signature=JSON.stringify({quantity,unitPrice:Number(unitPrice),itemId,storedBatchId});
 if(kind==='yard'){
  if(quantity!==1||!itemId)return {ok:false,reason:'yard_item_required'};
  const valid=microbusinessValidateYardItem5D2(itemId,{sessionId:s.id});if(!valid.ok)return valid;
  if(Number(unitPrice)>Math.max(5,Math.ceil(valid.value*2.5)))return {ok:false,reason:'price_exceeds_value'};
  if(s.batches.some(b=>b.itemId===itemId&&b.remaining>0))return {ok:false,reason:'item_reserved'};
  const result=microbusinessRegisterBatch5D1(s.id,{batchId,productId:valid.item.key,quantity:1,unitPrice});
  if(!result.ok)return result;
  Object.assign(result.batch,{source:'owned_item',itemId,condition:valid.item.condition,valueAtListing:valid.value,quality:valid.item.quality||null,expiryDateISO:null,preparationSignature5D2:signature});
  return {...result,cost:0};
 }
 if(itemId&&MICRO_BAKE_ITEMS_5D2[kind]){
  const it=(S.inventoryItems||[]).find(x=>x.id===itemId),keys=MICRO_BAKE_ITEMS_5D2[kind];
  if(!it||!keys.includes(it.key)||it.opened||it.stored||it.wrapped||isSpoiled(it)||it.freshUntil&&currentDate()>it.freshUntil||(it.quantity||1)<quantity)return {ok:false,reason:'baked_stock_unavailable'};
  const expiry=it.freshUntil||null,quality=it.quality||'good',sourceCopy={key:it.key,quality,expiryDateISO:expiry,source:'baked_inventory'};
  // No new ingredient charge: baking() already paid for ingredients when applicable.
  const result=microbusinessRegisterBatch5D1(s.id,{batchId,productId:product.id,quantity,unitPrice});if(!result.ok)return result;
  if((it.quantity||1)===quantity)removeItem(itemId);
  else{it.quantity-=quantity;syncLegacyInventory();}
  Object.assign(result.batch,sourceCopy,{itemId,itemKey5D2:it.key,preparationCost:0,preparationSignature5D2:signature});return {...result,cost:0};
 }
 if(storedBatchId){
  const biz=(S.businesses||[]).find(b=>b.id===s.businessId);
  const carry=(biz?.storedBatches5D2||[]).find(x=>x.id===storedBatchId&&x.status==='stored');
  if(!carry||carry.productId!==product?.id||carry.quantity!==quantity||carry.expiryDateISO&&currentDate()>carry.expiryDateISO)return {ok:false,reason:'carried_stock_unavailable'};
  const result=microbusinessRegisterBatch5D1(s.id,{batchId,productId:product.id,quantity,unitPrice});if(!result.ok)return result;
  carry.status='transferred';carry.transferredTo=sessionId;
  Object.assign(result.batch,{source:'carried_stock',quality:carry.quality,expiryDateISO:carry.expiryDateISO||null,preparationCost:0,preparationSignature5D2:signature});return {...result,cost:0};
 }
 if(itemId||!product||!microbusinessBatchProduct5D2(kind))return {ok:false,reason:'invalid_product_source'};
 if(MICRO_BAKE_ITEMS_5D2[kind])return {ok:false,reason:'baking_required'};
 // Procurement uses current stand-product supply prices, not fictitious Inventory ingredients.
 const cost=MICRO_CENTS_5D2(quantity*product.baseCost);
 if(cost<=0)return {ok:false,reason:'invalid_supply_cost'};
 if(S.money<cost)return {ok:false,reason:'insufficient_cash'};
 const receipt=microbusinessCommit5D1(s.id,{transactionId:`supply5d2:${sessionId}:${batchId}`,kind:'expense',amount:cost});
 if(!receipt.ok)return receipt;
 const result=microbusinessRegisterBatch5D1(s.id,{batchId,productId:product.id,quantity,unitPrice});
 // All batch inputs were validated above; registration cannot fail unless state was modified synchronously.
 if(!result.ok)return {ok:false,reason:'batch_registration_failed',receipt:receipt.receipt};
 Object.assign(result.batch,{preparationSignature5D2:signature,source:'purchased_supplies',quality:Math.round(clamp(50+(S.skills?.[BIZ_TYPES[kind].skill]||30)*.4)),expiryDateISO:kind==='lemonade'?addDays(currentDate(),1):null,preparationCost:cost});
 return {...result,cost,receipt:receipt.receipt};
}
function microbusinessFinishStock5D2(sessionId,{action='store',cancel=false}={}){
 const s=microbusinessSession5D1(sessionId);
 if(!s)return {ok:false,reason:'unknown_session'};
 if(['completed','cancelled'].includes(s.status)&&s.leftoversResolved5D2)return {ok:true,reused:true,leftovers:s.leftoversResolved5D2};
 if(!['open','preparing'].includes(s.status)||!['store','discard'].includes(action))return {ok:false,reason:'invalid_session_state'};
 const source=microbusinessSource5D1(s.businessId);
 if(!source)return {ok:false,reason:'business_no_longer_valid'};
 const biz=(S.businesses||[]).find(b=>b.id===s.businessId);
 if(action==='store'&&!biz)return {ok:false,reason:'storage_unavailable'};
 const leftovers=[];
 for(const batch of s.batches){
  const q=batch.remaining||0;if(!q)continue;
  const spoiled=!!batch.expiryDateISO&&currentDate()>batch.expiryDateISO;
  const disposition=action==='store'&&!spoiled?'stored':'discarded';
  const rec={id:`leftover5d2:${s.id}:${batch.batchId}`,batchId:batch.batchId,productId:batch.productId,quantity:q,quality:batch.quality||null,expiryDateISO:batch.expiryDateISO||null,status:disposition};
  if(disposition==='stored'&&batch.source==='baked_inventory'){
   const itemKey=batch.itemKey5D2;
   // Restore real food with its original expiry, no wallet or purchase credit.
   const itm=makeItemInstance(itemKey,'returned unsold batch');itm.quantity=q;itm.freshUntil=batch.expiryDateISO;itm.quality=batch.quality;itm.microbusinessBatchReturn5D2=rec.id;S.inventoryItems.push(itm);syncLegacyInventory();
   rec.status='returned_to_inventory';
  }else if(batch.source==='owned_item'){
   rec.status=(S.inventoryItems||[]).some(x=>x.id===batch.itemId)?'unlisted':'item_unavailable'; // Never discard the owner's item.
  }else if(disposition==='stored'&&['purchased_supplies','carried_stock'].includes(batch.source)){
   biz.storedBatches5D2=Array.isArray(biz.storedBatches5D2)?biz.storedBatches5D2:[];
   biz.storedBatches5D2.push(rec);
  }else if(disposition==='stored'){rec.status='unbacked_void'}
  batch.remaining=0;s.stock[batch.batchId]=0;batch.leftoverDisposition5D2=rec.status;leftovers.push(rec);
 }
 s.leftoversResolved5D2=leftovers;
 const done=microbusinessTransition5D1(s.id,cancel||s.status==='preparing'?'cancelled':'completed');if(!done.ok)return done;
 return {ok:true,leftovers};
}
