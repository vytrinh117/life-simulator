// PHASE 5D.3 — Interactive, bounded customer encounters. No persistent NPCs or UI.
// All cash/Inventory changes go through 5D.1/5D.2 authoritative receipts.
const MICRO_CUSTOMER_STAGES_5D3=Object.freeze(['arrived','question','counter_offer','complaint']);
const microCents5D3=n=>Math.round(n*100)/100;
function microbusinessCustomerGate5D3(sessionId){
 const s=microbusinessSession5D1(sessionId);
 if(!s||s.status!=='open')return {ok:false,reason:'session_not_open'};
 if(s.dateISO!==currentDate())return {ok:false,reason:'session_expired'};
 const src=microbusinessSource5D1(s.businessId);
 if(!src||src.kind!==s.businessType)return {ok:false,reason:'business_no_longer_valid'};
 const gate=microbusinessEligibility5D1(s.businessType,s.location,'operate');if(!gate.ok)return gate;
 const perm=microbusinessPermission5D1(s.businessType,s.location);if(!perm.ok)return {ok:false,reason:'permission_denied'};
 const supervision=microbusinessSupervisionGate5D7(s);if(!supervision.ok)return supervision;
 return {ok:true,session:s};
}
function microbusinessTrafficLimit5D3(s){
 const loc=D.standLocations.find(l=>l.id===s.location);
 if(!loc)return 0;
 if((S.weather?.severity||0)>=2&&s.location!=='home')return 0;
 const traffic=Math.max(0,Number(loc.traffic)||0);
 const time=currentMinute(),daylight=time>=480&&time<1140;
 // Session-wide quota, captured at the first customer; no infinite click farming.
 const market=typeof microbusinessMarketContext5D5==='function'?microbusinessMarketContext5D5(s):{trafficDelta:0};
 return Math.max(0,Math.min(12,Math.floor((traffic+30)/14)+(daylight?2:0)-((S.weather?.severity||0)>0?2:0)+market.trafficDelta));
}
function microbusinessNextCustomer5D3(sessionId,{batchId=null}={}){
 const gate=microbusinessCustomerGate5D3(sessionId);if(!gate.ok)return gate;
 const s=gate.session;
 const busy=s.customerEncounters.find(e=>MICRO_CUSTOMER_STAGES_5D3.includes(e.status));
 if(busy)return {ok:true,reused:true,encounter:busy};
 if(!Number.isInteger(s.customerLimit5D3))s.customerLimit5D3=microbusinessTrafficLimit5D3(s);
 if(s.customerEncounters.length>=s.customerLimit5D3)return {ok:false,reason:'no_more_customers'};
 const available=s.batches.filter(b=>b.remaining>0&&(!b.expiryDateISO||currentDate()<=b.expiryDateISO));
 const b=batchId==null?available[Math.floor(Math.random()*available.length)]:available.find(b=>b.batchId===batchId);
 if(!b)return {ok:false,reason:'no_stock'};
 const q=s.businessType==='yard'?1:Math.min(b.remaining,1+Math.floor(Math.random()*3));
 const kinds=['direct','question','bargain','browse'];
 const kind=kinds[Math.floor(Math.random()*kinds.length)];
 const buyer={id:uid('customer5d3'),sessionId:s.id,status:'arrived',kind,batchId:b.batchId,quantity:q,
  listUnitPrice:b.unitPrice,listedTotal:microCents5D3(b.unitPrice*q),
  budgetFactor:microCents5D3(.75+Math.random()*.65),patience:Math.floor(Math.random()*101),
  friendliness:Math.floor(Math.random()*101),buyRoll:Math.floor(Math.random()*100),tipRoll:Math.floor(Math.random()*100),
  complaintRoll:Math.floor(Math.random()*100),arrivalDateISO:currentDate(),arrivalMinute:currentMinute(),
  customerType:'anonymous',personId:null,turns:0};
 buyer.offerTotal=microCents5D3(Math.max(.01,buyer.listedTotal*(.70+Math.random()*.16)));
 if(typeof microbusinessAttachCustomer5D4==='function')microbusinessAttachCustomer5D4(s,buyer);
 s.customerEncounters.push(buyer);return {ok:true,reused:false,encounter:buyer};
}
function microbusinessCustomerScore5D3(s,e,total){
 const b=s.batches.find(x=>x.batchId===e.batchId);if(!b)return -100;
 const quality=typeof b.quality==='number'?b.quality:typeof b.quality==='string'?({excellent:90,good:75,average:55,poor:25}[b.quality]||60):65;
 const original=e.listedTotal||1;
 const pricePressure=(total-original)/original*70;
 const affordability=(e.budgetFactor-1)*50;
 const reputation=typeof microbusinessReputation5D4==='function'?microbusinessReputation5D4(s.businessId)?.score??50:50;
 const market=typeof microbusinessMarketContext5D5==='function'?microbusinessMarketContext5D5(s):{scoreDelta:0};
 return clamp(48+affordability-pricePressure+(quality-60)*.35+(e.friendliness-50)*.08+(e.turns?6:0)+(reputation-50)*.16+market.scoreDelta,3,94);
}
function microbusinessRespond5D3(sessionId,encounterId,choice){
 const gate=microbusinessCustomerGate5D3(sessionId);if(!gate.ok)return gate;
 const s=gate.session,e=s.customerEncounters.find(x=>x.id===encounterId);if(!e)return {ok:false,reason:'unknown_encounter'};
 if(typeof choice!=='string')return {ok:false,reason:'invalid_choice'};
 if(e.status==='resolved'||e.status==='walked_away')return e.decision5D3===choice?{ok:true,reused:true,encounter:e}:{ok:false,reason:'encounter_already_resolved'};
 if(e.status==='complaint')return {ok:false,reason:'complaint_pending'};
 if(!['arrived','question','counter_offer'].includes(e.status))return {ok:false,reason:'invalid_encounter_state'};
 const valid=['recommend','answer','keep_price','discount','counter','accept_offer','decline'];
 if(!valid.includes(choice))return {ok:false,reason:'invalid_choice'};
 if(choice==='answer'||choice==='recommend'){
  if(e.status==='counter_offer')return {ok:false,reason:'invalid_choice'};
  if(e.turns>=1)return {ok:false,reason:'already_answered'};
  e.status='question';e.turns=1;return {ok:true,encounter:e,requiresResponse:true};
 }
 if(choice==='counter'){
  if(e.kind!=='bargain'||e.status==='counter_offer')return {ok:false,reason:'not_negotiating'};
  e.status='counter_offer';e.turns=1;e.counterTotal=microCents5D3((e.offerTotal+e.listedTotal)/2);
  return {ok:true,encounter:e,requiresResponse:true};
 }
 if(choice==='accept_offer'&&e.kind!=='bargain')return {ok:false,reason:'not_negotiating'};
 if(choice==='decline'){
  e.status='walked_away';e.decision5D3=choice;e.outcome5D3='declined';if(typeof microbusinessCustomerSettlement5D4==='function')microbusinessCustomerSettlement5D4(s,e,'walk');return {ok:true,encounter:e};
 }
 const batch=s.batches.find(x=>x.batchId===e.batchId);
 if(!batch||batch.remaining<e.quantity)return {ok:false,reason:'no_stock'};
 const total=choice==='accept_offer'?(e.status==='counter_offer'?e.counterTotal:e.offerTotal):choice==='discount'?microCents5D3(e.listedTotal*.90):choice==='keep_price'?e.listedTotal:e.status==='counter_offer'?e.counterTotal:e.listedTotal;
 if(!(total>0))return {ok:false,reason:'invalid_price'};
 // Customer response was fixed when this encounter was generated, not re-rolled per click.
 const accepted=e.buyRoll<microbusinessCustomerScore5D3(s,e,total);
 if(!accepted){e.status='walked_away';e.decision5D3=choice;e.outcome5D3='refused';e.offerAccepted5D3=total;if(typeof microbusinessCustomerSettlement5D4==='function')microbusinessCustomerSettlement5D4(s,e,'walk');return {ok:true,encounter:e};}
 const saleId=`micro5d3:sale:${e.id}`;
 const sale=microbusinessCommit5D1(s.id,{transactionId:saleId,kind:'sale',batchId:e.batchId,quantity:e.quantity,amount:total,encounterId:e.id,personId:e.personId||null});
 if(!sale.ok)return sale;
 e.saleTransactionId=saleId;e.paidTotal=total;e.decision5D3=choice;e.outcome5D3='purchased';
 // Tips require a sale, depend on a persisted customer roll, and remain optional.
 const quality=typeof batch.quality==='number'?batch.quality:batch.quality==='excellent'?90:batch.quality==='poor'?25:70;
 if(e.tipRoll<Math.max(0,Math.min(35,Math.floor((e.friendliness+quality-95)/4)))){
  const tipValue=microCents5D3(Math.min(2,Math.max(.25,total*.05)));
  const tip=microbusinessCommit5D1(s.id,{transactionId:`micro5d3:tip:${e.id}`,kind:'tip',amount:tipValue,encounterId:e.id,personId:e.personId||null});
  if(tip.ok)e.tipTransactionId=tip.receipt.transactionId;
 }
 const complaintOdds=clamp(Math.floor((60-quality)*.5)+Math.floor((e.friendliness<20?10:0)),0,40);
 e.status=e.complaintRoll<complaintOdds?'complaint':'resolved';
 if(typeof microbusinessCustomerSettlement5D4==='function')microbusinessCustomerSettlement5D4(s,e,'sale');
 return {ok:true,encounter:e,sale:sale.receipt,complaint:e.status==='complaint'};
}
function microbusinessResolveComplaint5D3(sessionId,encounterId,choice){
 const gate=microbusinessCustomerGate5D3(sessionId);if(!gate.ok)return gate;
 const s=gate.session,e=s.customerEncounters.find(x=>x.id===encounterId);if(!e)return {ok:false,reason:'unknown_encounter'};
 if(e.complaintResolution5D3)return e.complaintResolution5D3===choice?{ok:true,reused:true,encounter:e}:{ok:false,reason:'complaint_already_resolved'};
 if(e.status!=='complaint'||!e.saleTransactionId)return {ok:false,reason:'no_active_complaint'};
 if(!['apologize','refund','replace','decline'].includes(choice))return {ok:false,reason:'invalid_choice'};
 if(choice==='refund'){
  const result=microbusinessCommit5D1(s.id,{transactionId:`micro5d3:refund:${e.id}`,kind:'refund',against:e.saleTransactionId,amount:e.paidTotal,encounterId:e.id,personId:e.personId||null});
  if(!result.ok)return result;
  e.refundTransactionId=result.receipt.transactionId;
 }else if(choice==='replace'){
  if(s.businessType==='yard')return {ok:false,reason:'item_cannot_be_remade'};
  const result=microbusinessCommit5D1(s.id,{transactionId:`micro5d3:replacement:${e.id}`,kind:'replacement',against:e.saleTransactionId,batchId:e.batchId,quantity:e.quantity,amount:0,encounterId:e.id,personId:e.personId||null});
  if(!result.ok)return result;
  e.replacementTransactionId=result.receipt.transactionId;
 }
 e.complaintResolution5D3=choice;e.status='resolved';if(typeof microbusinessCustomerSettlement5D4==='function')microbusinessCustomerSettlement5D4(s,e,'complaint_resolved');return {ok:true,encounter:e};
}
