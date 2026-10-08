// =====================================================================
// PHASE 5D.1 — Canonical MICROBUSINESS CONTRACTS ONLY.
// New explicit sessions do not backfill or replay legacy S.businesses/S.stall.
// 5D.2 supplies canonical product sourcing; 5D.3+ will connect customers/UI.
// =====================================================================
const MICRO_STATES_5D1=Object.freeze(['planned','preparing','open','completed','cancelled']);
const MICRO_TRANSITIONS_5D1=Object.freeze({planned:['preparing','cancelled'],preparing:['open','cancelled'],open:['completed','cancelled'],completed:[],cancelled:[]});
function microbusinessTypes5D1(){return Object.keys(BIZ_TYPES)} // existing kinds are the stable activity identifiers
function ensureMicrobusiness5D1(){
 if(!S.microbusiness5D1||typeof S.microbusiness5D1!=='object'||Array.isArray(S.microbusiness5D1))S.microbusiness5D1={};
 const st=S.microbusiness5D1;st.schemaVersion=1;
 if(!Array.isArray(st.sessions))st.sessions=[];
 return st;
}
function migrateMicrobusiness5D1(){
 // Intentionally do not call bizList(): it converts legacy S.stall to S.businesses
 // and mutates the original stall. Neither legacy revenue nor expenses is replayed.
 return ensureMicrobusiness5D1();
}
function microbusinessEligibility5D1(kind,location,phase='plan'){
 const t=BIZ_TYPES[kind];if(!t)return {ok:false,reason:'unknown_business_type'};
 const min=Math.max(Number(D.ageRules.smallBusiness)||6,Number(t.minAge)||0);
 if(S.age<min)return {ok:false,reason:'age',minAge:min};
 const loc=D.standLocations.find(x=>x.id===location);if(!loc)return {ok:false,reason:'unknown_location'};
 if(S.age<Number(loc.minAge||0))return {ok:false,reason:'location_age'};
 if(S.age<18&&isGrounded())return {ok:false,reason:'grounded'};
 if(phase==='operate'){
  if(atSchool())return {ok:false,reason:'at_school'};
  if(currentMinute()>=1200)return {ok:false,reason:'closing_time'};
  const curfew=typeof curfewMinute==='function'?curfewMinute():null;
  if(S.age<18&&curfew!=null&&currentMinute()>=curfew)return {ok:false,reason:'curfew'};
 }
 if(S.age<16&&!decisionAuthorityPerson())return {ok:false,reason:'guardian_required'};
 return {ok:true,minAge:min,permissionRequired:S.age<16,supervisionRequired:S.age<12};
}
function microbusinessPermission5D1(kind,location){
 const gate=microbusinessEligibility5D1(kind,location);
 if(!gate.ok||!gate.permissionRequired)return gate;
 // Stable H3 context/target prevents re-rolling the same decision by repeating a click.
 const context={kind,location,category:'informal_microbusiness',ageBand:S.age<12?'child':'teen'};
 const q=requestDecision({requestType:'microbusinessPermission5D1',targetKey:`${kind}:${location}`,context,decide:(maker)=>{
  const r=familyRules(),trust=Number(S.family?.trust??60),responsibility=Number(S.family?.responsibility||0);
  const threshold=clamp(57-r.strictness*.23+(trust-50)*.23+responsibility*.18+(S.age>=13?8:0),10,93);
  const roll=hashOf(`${maker.id}|${decisionContextSignature('microbusinessPermission5D1',`${kind}:${location}`,context)}`)%100;
  const yes=roll<threshold;
  return {outcome:yes?'Yes':'No',resolved:true,reason:yes?'Guardian approves supervised informal selling.':'Guardian declines this microbusiness request.',...(yes?{}:{reconsiderAfter:addDays(currentDate(),7)})};
 }});
 return {ok:q.record?.outcome==='Yes'||q.record?.outcome==='Approved',permissionRequired:true,supervisionRequired:gate.supervisionRequired,decisionId:q.record?.id||null,reused:!!q.reused,reason:q.error||q.record?.reason||''};
}
function microbusinessSource5D1(businessId){
 // Neither formal S.career nor Phase 5B S.programs is ever a business source.
 const b=(Array.isArray(S.businesses)?S.businesses:[]).find(x=>x.id===businessId&&BIZ_TYPES[x.kind]);
 if(b&&b.status!=='Retired')return {businessId:b.id,kind:b.kind,location:b.location,source:'businesses'};
 const old=S.stall;if(old&&old.id===businessId){const kind=old.type==='Yard Sale'?'yard':Object.keys(BIZ_TYPES).find(k=>BIZ_TYPES[k].product===old.product);if(kind)return {businessId:old.id,kind,location:old.location||D.standLocations[0].id,source:'legacy_stall'}}
 return null;
}
function microbusinessCreateSession5D1({businessId,dateISO=currentDate(),startMinute=currentMinute()}={}){
 const source=microbusinessSource5D1(businessId);if(!source)return {ok:false,reason:'unknown_business'};
 if(dateISO!==currentDate()||!Number.isInteger(startMinute)||startMinute<0||startMinute>1439)return {ok:false,reason:'invalid_time'};
 const eligibility=microbusinessEligibility5D1(source.kind,source.location);
 if(!eligibility.ok)return eligibility;
 const perm=microbusinessPermission5D1(source.kind,source.location);if(!perm.ok)return {ok:false,reason:'permission_denied',permission:perm};
 const s={id:uid('micro5d'),businessId:source.businessId,businessType:source.kind,source:source.source,ageAtStart:S.age,dateISO,location:source.location,startMinute,endMinute:null,status:'planned',permissionDecisionId:perm.decisionId||null,batches:[],pricing:{},stock:{},actualCosts:0,grossRevenue:0,tips:0,refunds:0,netProfit:0,customerEncounters:[],transactions:[]};
 ensureMicrobusiness5D1().sessions.push(s);return {ok:true,session:s};
}
function microbusinessSession5D1(id){return ensureMicrobusiness5D1().sessions.find(x=>x.id===id)||null}
function microbusinessTransition5D1(id,next){
 const s=microbusinessSession5D1(id);if(!s)return {ok:false,reason:'unknown_session'};
 if(!MICRO_STATES_5D1.includes(next)||!MICRO_TRANSITIONS_5D1[s.status]?.includes(next))return {ok:false,reason:'invalid_transition'};
 // 5D.2: never strand paid/prepared stock on a direct cancellation/completion call.
 if(['completed','cancelled'].includes(next)&&s.batches.some(b=>b.remaining>0)&&!s.leftoversResolved5D2)return microbusinessFinishStock5D2(id,{action:'store',cancel:next==='cancelled'});
 if(next==='open'){
  if(s.dateISO!==currentDate())return {ok:false,reason:'wrong_day'};
  const gate=microbusinessEligibility5D1(s.businessType,s.location,'operate');if(!gate.ok)return gate;
  const perm=microbusinessPermission5D1(s.businessType,s.location);if(!perm.ok)return {ok:false,reason:'permission_denied'};
  const supervision=microbusinessSupervisionGate5D7(s);if(!supervision.ok)return supervision;
  s.permissionDecisionId=perm.decisionId||null;
 }
 if(['completed','cancelled'].includes(next)){
  // Close unresolved customer invitations; never fabricate a sale or clear actual receipts.
  for(const e of s.customerEncounters||[])if(['arrived','question','counter_offer'].includes(e.status)){e.status='walked_away';e.outcome5D3='stand_closed'}
  s.endMinute=currentMinute();
 }
 s.status=next;return {ok:true,session:s};
}
function microbusinessRegisterBatch5D1(id,{batchId,productId,quantity,unitPrice}={}){
 // Contract-only 5D.1 stock fixture; no ingredients, Inventory or income are created.
 // Actual prepared stock must be wired to Store/Inventory in 5D.2.
 const s=microbusinessSession5D1(id);if(!s||!['planned','preparing'].includes(s.status))return {ok:false,reason:'invalid_session_state'};
 if(!batchId||!productId||!Number.isInteger(quantity)||quantity<=0||!Number.isFinite(unitPrice)||unitPrice<=0)return {ok:false,reason:'invalid_batch'};
 if(s.batches.some(x=>x.batchId===batchId))return {ok:false,reason:'duplicate_batch'};
 const b={batchId:String(batchId),productId:String(productId),quantity,remaining:quantity,unitPrice:Math.round(unitPrice*100)/100};
 s.batches.push(b);s.stock[b.batchId]=quantity;s.pricing[b.batchId]=b.unitPrice;return {ok:true,batch:b};
}
function microbusinessCommit5D1(id,tx={}){
 // Explicit idempotent receipt gateway; no UI or automatic legacy sales call it in 5D.1.
 const s=microbusinessSession5D1(id);if(!s)return {ok:false,reason:'session_not_open'};
 if(!(s.status==='open'||(tx.kind==='expense'&&s.status==='preparing')))return {ok:false,reason:'session_not_open'};
 const source=microbusinessSource5D1(s.businessId);
 if(!source||source.kind!==s.businessType)return {ok:false,reason:'business_no_longer_valid'};
 if(s.dateISO!==currentDate())return {ok:false,reason:'session_expired'};
 const eligibility=microbusinessEligibility5D1(s.businessType,s.location,tx.kind==='expense'&&s.status==='preparing'?'plan':'operate');if(!eligibility.ok)return eligibility;
 const permission=microbusinessPermission5D1(s.businessType,s.location);if(!permission.ok)return {ok:false,reason:'permission_denied'};
 if(s.status==='open'){const supervision=microbusinessSupervisionGate5D7(s);if(!supervision.ok)return supervision;}
 const transactionId=typeof tx.transactionId==='string'?tx.transactionId.trim():'';
 if(!transactionId)return {ok:false,reason:'missing_transaction_id'};
 const kind=tx.kind,amount=Number(tx.amount),quantity=Number(tx.quantity||0),batchId=String(tx.batchId||''),against=String(tx.against||'');
 if(!['sale','tip','expense','refund','replacement'].includes(kind)||!Number.isFinite(amount)||(kind==='replacement'?amount!==0:amount<=0)||Math.round(amount*100)/100!==amount)return {ok:false,reason:'invalid_transaction'};
 const signature=JSON.stringify({kind,amount,quantity,batchId,against,encounterId:String(tx.encounterId||'')});
 const old=ensureMicrobusiness5D1().sessions.flatMap(x=>x.transactions||[]).find(x=>x.transactionId===transactionId);
 if(old)return old.sessionId===id&&old.signature===signature?{ok:true,reused:true,receipt:old}:{ok:false,reason:'transaction_id_conflict'};
 let batch=null,refSale=null;
 if(kind==='sale'||kind==='replacement'){
  batch=s.batches.find(x=>x.batchId===batchId);
  if(!batch||!Number.isInteger(quantity)||quantity<=0||batch.remaining<quantity||(kind==='sale'&&amount>Math.round(quantity*batch.unitPrice*100)/100))return {ok:false,reason:'invalid_stock_or_price'};
  if(batch.expiryDateISO&&currentDate()>batch.expiryDateISO)return {ok:false,reason:'expired_stock'};
  if(s.businessType==='yard'){
   if(kind==='replacement')return {ok:false,reason:'item_cannot_be_remade'};
   if(batch.source!=='owned_item'||quantity!==1||!batch.itemId)return {ok:false,reason:'unbacked_yard_stock'};
   const valid=microbusinessValidateYardItem5D2(batch.itemId,{sessionId:s.id});if(!valid.ok)return valid;
  }
 }
 if(kind==='replacement'){
  refSale=s.transactions.find(x=>x.transactionId===against&&x.kind==='sale'&&x.batchId===batchId);
  const already=s.transactions.filter(x=>x.kind==='replacement'&&x.against===against).reduce((v,x)=>v+x.quantity,0);
  if(!refSale||refSale.encounterId!==tx.encounterId||quantity>refSale.quantity-already||!tx.encounterId)return {ok:false,reason:'invalid_replacement'};
 }
 if(kind==='refund'){
  refSale=s.transactions.find(x=>x.transactionId===against&&x.kind==='sale');
  const already=s.transactions.filter(x=>x.kind==='refund'&&x.against===against).reduce((v,x)=>v+x.amount,0);
  if(!refSale||(tx.encounterId&&refSale.encounterId!==tx.encounterId)||amount>Math.round((refSale.amount-already)*100)/100)return {ok:false,reason:'invalid_refund'};
 }
 if((kind==='expense'||kind==='refund')&&S.money<amount)return {ok:false,reason:'insufficient_cash'};
 if(tx.personId&&!personById(tx.personId))return {ok:false,reason:'unknown_customer'};
 // Apply exactly once, after all validations. S.money remains the sole wallet authority.
 if(batch){
  if(s.businessType==='yard'){const removed=removeItem(batch.itemId,true);if(!removed)return {ok:false,reason:'item_not_owned'}}
  batch.remaining-=quantity;s.stock[batchId]=batch.remaining;if(kind==='sale')s.grossRevenue=Math.round((s.grossRevenue+amount)*100)/100
 }
 else if(kind==='tip')s.tips=Math.round((s.tips+amount)*100)/100;
 else if(kind==='expense')s.actualCosts=Math.round((s.actualCosts+amount)*100)/100;
 else if(kind==='refund')s.refunds=Math.round((s.refunds+amount)*100)/100;
 if(kind!=='replacement')S.money=Math.round((S.money+(kind==='sale'||kind==='tip'?amount:-amount))*100)/100;
 if(kind==='sale'||kind==='tip')S.finance.earned=Math.round(((S.finance.earned||0)+amount)*100)/100;
 s.netProfit=Math.round((s.grossRevenue+s.tips-s.refunds-s.actualCosts)*100)/100;
 const receipt={transactionId,sessionId:id,kind,amount,quantity:kind==='sale'||kind==='replacement'?quantity:0,batchId:kind==='sale'||kind==='replacement'?batchId:null,against:kind==='refund'||kind==='replacement'?against:null,encounterId:tx.encounterId||null,personId:tx.personId||null,dateISO:currentDate(),minute:currentMinute(),signature};
 s.transactions.push(receipt);return {ok:true,reused:false,receipt};
}
