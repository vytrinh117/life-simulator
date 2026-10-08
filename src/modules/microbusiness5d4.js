// PHASE 5D.4 — Neighborhood customers and bounded, receipt-backed reputation.
// Does not create NPCs for walk-ins, grant friendship/romance, or replace the People authority.
const MICRO_CUSTOMER_BOOK_LIMIT_5D4=24;
function microbusinessState5D4(){
 const st=ensureMicrobusiness5D1();
 if(!st.reputations5D4||typeof st.reputations5D4!=='object'||Array.isArray(st.reputations5D4))st.reputations5D4={};
 if(!st.customerBook5D4||typeof st.customerBook5D4!=='object'||Array.isArray(st.customerBook5D4))st.customerBook5D4={};
 return st;
}
function migrateMicrobusiness5D4(){
 // Intentionally NO replay/backfill of earlier encounters, sales, People or reputation.
 const st=microbusinessState5D4();return {schemaVersion:1,customers:Object.keys(st.customerBook5D4).length,businesses:Object.keys(st.reputations5D4).length};
}
function microbusinessReputation5D4(businessId){
 const st=microbusinessState5D4();const key=String(businessId||'');
 if(!key||!microbusinessSource5D1(key))return null;
 if(!st.reputations5D4[key])st.reputations5D4[key]={score:50,positive:0,negative:0,feedback:[],dailyImpact:{}};
 return st.reputations5D4[key];
}
function microbusinessNeighborCandidates5D4(){
 // Only NPCs from already-established neighborhood households; do not call ensureNeighborhood(),
 // ensureRoster() or generateHousehold() just to produce shoppers.
 const households=new Set(S.neighborhood?.households||[]);
 return (S.npcs||[]).filter(n=>n?.id&&households.has(n.householdId)&&!n.movedAway);
}
function microbusinessAttachCustomer5D4(s,e){
 if(!s||!e||e.customerKey5D4)return e;
 const neighbors=microbusinessNeighborCandidates5D4();if(!neighbors.length)return e;
 const book=microbusinessState5D4().customerBook5D4;
 const returning=neighbors.filter(n=>book[n.id]?.purchases>0);
 // Preserve anonymous majority, even when a neighbor exists in the simulation.
 if(Math.random()>=.28)return e;
 const pool=returning.length&&Math.random()<.65?returning:neighbors;
 const n=pool[Math.floor(Math.random()*pool.length)];if(!n)return e;
 e.customerKey5D4=n.id;e.neighborhoodHouseholdId5D4=n.householdId;
 const p=(S.people||[]).find(p=>p.npcId===n.id&&!isFamilyPerson(p));
 if(p){e.personId=p.id;e.customerType='known_neighbor';}
 else if(book[n.id]?.purchases>0){e.customerType='returning_neighbor';}
 // No NPC name or identity is invented for otherwise anonymous customers.
 return e;
}
function microbusinessCustomerBookEntry5D4(npcId){
 const book=microbusinessState5D4().customerBook5D4;
 const n=npcById(npcId),neighbors=microbusinessNeighborCandidates5D4();
 if(!n||!neighbors.some(x=>x.id===npcId))return null;
 if(!book[npcId]){
  const ids=Object.keys(book);
  if(ids.length>=MICRO_CUSTOMER_BOOK_LIMIT_5D4){
   // Evict only an unlinked inactive visitor, never a People contact or active encounter.
   const eligible=ids.filter(id=>!book[id].personId&&!S.people.some(p=>p.npcId===id)&&!(S.microbusiness5D1.sessions||[]).some(s=>s.customerEncounters.some(e=>e.customerKey5D4===id&&['arrived','question','counter_offer','complaint'].includes(e.status))));
   if(!eligible.length)return null;
   eligible.sort((a,b)=>(book[a].lastSeenISO||'').localeCompare(book[b].lastSeenISO||''));delete book[eligible[0]];
  }
  book[npcId]={npcId,householdId:n.householdId,visits:0,purchases:0,distinctDates:[],sessionIds:[],conversations:0,personId:null,lastSeenISO:null,lastOutcome:null};
 }
 return book[npcId];
}
function microbusinessAdjustReputation5D4(s,e,event,delta,reason){
 const rep=microbusinessReputation5D4(s.businessId);if(!rep)return 0;
 e.reputationEvents5D4=e.reputationEvents5D4||[];
 if(e.reputationEvents5D4.includes(event))return 0;
 const today=currentDate(),used=rep.dailyImpact[today]||0;
 // Cap repeated stand sessions in one day; protect bounded neighborhood reputation.
 const allowed=delta>0?Math.max(0,8-Math.max(0,used)):Math.max(-10-Math.min(0,used),delta);
 const applied=delta>0?Math.min(delta,allowed):Math.max(delta,allowed);
 e.reputationEvents5D4.push(event);
 rep.score=clamp(rep.score+applied,0,100);
 rep.dailyImpact[today]=used+applied;
 if(applied>0)rep.positive+=applied;else if(applied<0)rep.negative+=Math.abs(applied);
 rep.feedback.push({encounterId:e.id,event,delta:applied,dateISO:today,reason});
 if(rep.feedback.length>80)rep.feedback.splice(0,rep.feedback.length-80);
 if(S.neighborhood?.rep&&Number.isFinite(S.neighborhood.rep.business))S.neighborhood.rep.business=clamp(S.neighborhood.rep.business+applied,0,100);
 return applied;
}
function microbusinessPromoteRegular5D4(s,e,entry){
 if(!entry||entry.personId)return entry?.personId||null;
 // A contact is established only through repeated transactions across different days,
 // plus a real customer conversation. A transaction alone never establishes friendship.
 if(entry.purchases<2||entry.distinctDates.length<2||entry.sessionIds.length<2||entry.conversations<1)return null;
 const n=npcById(entry.npcId);if(!n)return null;
 let p=(S.people||[]).find(p=>p.npcId===n.id);
 if(!p){
  if(S.people.filter(p=>!isFamilyPerson(p)).length>=50)return null;
  p=personFromNpc(n,'friend','neighbor customer');
  p.rel=22;p.trust=38;p.fun=45;p.respect=50;p.roleLabel='neighbor contact';
  const place=D.standLocations.find(l=>l.id===s.location)?.name||s.location;
  p.metAt=`at your ${BIZ_TYPES[s.businessType]?.label||s.businessType} stand (${place})`;
  p.metVia='repeat neighborhood customer';p.metDate=currentDate();
  if(typeof recordMeetingProvenance4A4==='function'){
   const m=recordMeetingProvenance4A4(p,{sourceType:'neighborhood',metAt:p.metAt,metVia:p.metVia,knownSinceAge:S.age});
   if(m){m.sourceType='neighborhood';m.metAt=p.metAt;m.metVia=p.metVia;}
  }
  S.people.push(p);
  rememberPerson(p,'You talked while they returned to your neighborhood stand on another day.',1);
 }
 entry.personId=p.id;e.personId=p.id;e.customerType='familiar_neighbor';
 return p.id;
}
function microbusinessCustomerSettlement5D4(s,e,stage){
 if(!s||!e||!['sale','walk','complaint_resolved'].includes(stage)||microbusinessSession5D1(s.id)!==s||!s.customerEncounters?.includes(e))return false;
 e.settlementStages5D4=e.settlementStages5D4||[];
 if(e.settlementStages5D4.includes(stage))return false;
 // Wait for an actual canonical sale receipt to avoid fictional positive feedback.
 if(stage==='sale'&&!s.transactions.some(t=>t.kind==='sale'&&t.transactionId===e.saleTransactionId))return false;
 if(stage==='complaint_resolved'&&(!e.saleTransactionId||!e.complaintResolution5D3))return false;
 if(stage==='walk'&&!['walked_away'].includes(e.status))return false;
 e.settlementStages5D4.push(stage);
 if(stage==='sale'){
  if(typeof microbusinessSaleEvidence5D5==='function')microbusinessSaleEvidence5D5(s,e);
  const b=s.batches.find(b=>b.batchId===e.batchId),raw=b?.quality;
  const quality=typeof raw==='number'?raw:({excellent:90,good:75,average:55,poor:25}[raw]||60);
  const fair=e.paidTotal<=e.listedTotal;
  const gained=e.status==='complaint'?-2:quality>=70&&fair?2:quality>=40&&fair?1:-1;
  microbusinessAdjustReputation5D4(s,e,'sale',gained,e.status==='complaint'?'customer complained':fair?'quality and fair pricing':'quality or pricing concern');
  if(e.status==='complaint')microbusinessAdjustReputation5D4(s,e,'complaint',-1,'unresolved customer complaint');
 }else if(stage==='complaint_resolved'){
  const delta={refund:2,replace:2,apologize:1,decline:-2}[e.complaintResolution5D3]||0;
  microbusinessAdjustReputation5D4(s,e,'resolution',delta,`complaint ${e.complaintResolution5D3}`);
 }else if(stage==='walk'&&e.outcome5D3==='refused'&&e.offerAccepted5D3>e.listedTotal*(e.budgetFactor||1)){
  microbusinessAdjustReputation5D4(s,e,'refusal',-1,'price too high');
 }
 if(stage!=='complaint_resolved'&&e.customerKey5D4){
  const entry=microbusinessCustomerBookEntry5D4(e.customerKey5D4);
  if(entry){
   entry.visits++;entry.lastSeenISO=currentDate();entry.lastOutcome=e.outcome5D3||e.status;
   if(stage==='sale'){
    entry.purchases++;
    if(!entry.distinctDates.includes(s.dateISO))entry.distinctDates.push(s.dateISO);
    if(!entry.sessionIds.includes(s.id))entry.sessionIds.push(s.id);
    if(e.turns>0)entry.conversations++;
    // Bound historical identifiers but preserve counts.
    if(entry.distinctDates.length>24)entry.distinctDates=entry.distinctDates.slice(-24);
    if(entry.sessionIds.length>24)entry.sessionIds=entry.sessionIds.slice(-24);
    microbusinessPromoteRegular5D4(s,e,entry);
   }
  }
 }
 return true;
}
