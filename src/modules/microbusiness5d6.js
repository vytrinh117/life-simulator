// PHASE 5D.6 — Compact, actual-button microbusiness integration.
// Existing 5D.1–5D.5 receipts/Inventory/H3/Calendar remain authoritative.
// Legacy businesses retain historical balances; opt-in only controls FUTURE auto-selling.
function migrateMicrobusiness5D6(){
 const st=ensureMicrobusiness5D1();
 if(!st.ui5D6||typeof st.ui5D6!=='object'||Array.isArray(st.ui5D6))st.ui5D6={};
 st.ui5D6.schemaVersion=1;
 if(typeof st.ui5D6.message!=='string')st.ui5D6.message='';
 return {schemaVersion:1,sessions:st.sessions.length};
}
function microbusinessUIMessage5D6(r,success='Updated'){
 const ui=migrateMicrobusiness5D6()&&ensureMicrobusiness5D1().ui5D6;
 ui.message=r?.ok?success:`Cannot do that: ${String(r?.reason||r?.permission?.reason||'unavailable').replace(/_/g,' ')}`;
 return r;
}
function microbusinessActiveSession5D6(businessId){
 return ensureMicrobusiness5D1().sessions.filter(s=>s.businessId===businessId&&!['completed','cancelled'].includes(s.status)).slice(-1)[0]||null;
}
function microbusinessStartBusiness5D6(kind,location){
 const t=BIZ_TYPES[kind],loc=D.standLocations.find(x=>x.id===location);
 if(!t||!loc)return {ok:false,reason:'unknown_business_or_location'};
 if(bizActive().length>=BIZ_MAX||bizActive().some(b=>b.kind===kind))return {ok:false,reason:'business_limit_or_duplicate'};
 const gate=microbusinessEligibility5D1(kind,location);if(!gate.ok)return gate;
 const perm=microbusinessPermission5D1(kind,location);if(!perm.ok)return {ok:false,reason:'permission_denied'};
 const b={id:uid('biz'),kind,name:t.name,location,price:t.yard?0:bizProduct({kind})?.basePrice||3,stock:0,quality:60,status:'Open',revenue:0,costs:0,customers:0,reputation:50,opened:currentDate(),listed:[],microbusinessMode5D6:true};
 bizList().push(b);
 const created=microbusinessCreateSession5D1({businessId:b.id});
 if(!created.ok){S.businesses=S.businesses.filter(x=>x.id!==b.id);return created}
 const prep=microbusinessTransition5D1(created.session.id,'preparing');
 if(!prep.ok){S.businesses=S.businesses.filter(x=>x.id!==b.id);ensureMicrobusiness5D1().sessions=ensureMicrobusiness5D1().sessions.filter(s=>s.id!==created.session.id);return prep}
 return {ok:true,business:b,session:created.session};
}
function microbusinessStartSession5D6(businessId){
 const b=bizList().find(x=>x.id===businessId&&x.status==='Open');if(!b)return {ok:false,reason:'business_closed'};
 const existing=microbusinessActiveSession5D6(businessId);
 if(existing){
  if(existing.dateISO===currentDate())return {ok:true,reused:true,session:existing};
  // Old open sessions cannot transact on a new day; settle leftovers, without replaying sales.
  if(existing.status==='planned')microbusinessTransition5D1(existing.id,'cancelled');
  else microbusinessFinishStock5D2(existing.id,{action:'store',cancel:existing.status==='preparing'});
  if(microbusinessActiveSession5D6(businessId))return {ok:false,reason:'prior_session_not_closed'};
 }
 const created=microbusinessCreateSession5D1({businessId});if(!created.ok)return created;
 const moved=microbusinessTransition5D1(created.session.id,'preparing');if(!moved.ok)return moved;
 // Switch off legacy automatic/shift income ONLY after permission and session creation succeed.
 b.microbusinessMode5D6=true;
 return {ok:true,session:created.session};
}
function microbusinessResumeLegacy5D6(businessId){
 const b=bizList().find(x=>x.id===businessId&&x.status==='Open');
 if(!b||!b.microbusinessMode5D6)return {ok:false,reason:'not_interactive_business'};
 if(microbusinessActiveSession5D6(businessId))return {ok:false,reason:'finish_interactive_session_first'};
 if(!(b.stock>0||(b.listed||[]).some(l=>!l.sold)))return {ok:false,reason:'no_legacy_stock'};
 // No historical balances or stock are transferred or replayed; only the existing
 // pre-5D operator is re-enabled while no canonical session is active.
 b.microbusinessMode5D6=false;return {ok:true,business:b};
}
function microbusinessFinishSession5D6(sessionId,action='store'){
 const s=microbusinessSession5D1(sessionId);if(!s)return {ok:false,reason:'unknown_session'};
 if(s.status==='planned')return microbusinessTransition5D1(sessionId,'cancelled');
 return microbusinessFinishStock5D2(sessionId,{action,cancel:s.status==='preparing'});
}
function microbusinessOption5D6(value,label){return `<option value="${esc(String(value))}">${esc(String(label))}</option>`}
function microbusinessButtons5D6(items,id){return items.map(([action,text])=>`<button type="button" class="small ghost" data-micro-action="${action}" data-micro-session="${esc(id)}">${esc(text)}</button>`).join('')}
function microbusinessSessionHtml5D6(b){
 const s=microbusinessActiveSession5D6(b.id),history=ensureMicrobusiness5D1().sessions.filter(x=>x.businessId===b.id).slice(-3);
 if(!s)return `<div class="micro-note"><button class="small primary" data-micro-action="session" data-micro-business="${esc(b.id)}">Prepare a selling session</button>${(b.stock>0||(b.listed||[]).some(l=>!l.sold))?`<small>Earlier purchased/listed legacy stock remains separate. No second charge or automatic transfer.</small>${b.microbusinessMode5D6?`<button class="small ghost" data-micro-action="legacy" data-micro-business="${esc(b.id)}">Return to classic selling with earlier stock</button>`:''}`:''}</div>${microbusinessHistoryHtml5D6(history)}`;
 const prep=s.status==='preparing',open=s.status==='open',orders=(microbusinessState5D5().orders5D5||[]).filter(o=>o.businessId===b.id&&!['Completed','Missed','Cancelled'].includes(o.status));
 const stock=s.batches.reduce((n,x)=>n+(x.remaining||0),0),rep=microbusinessReputation5D4(b.id)?.score??50;
 const batches=s.batches.map(x=>`<div class="micro-line"><span>${esc(x.productId)} • ${x.remaining}/${x.quantity} • ${money(x.unitPrice)}${x.expiryDateISO?' • until '+esc(x.expiryDateISO):''}</span>${prep?`<label>Price <input type="number" min="0.5" max="500" step="0.01" data-micro-price="${esc(x.batchId)}" value="${x.unitPrice}"></label><button class="small ghost" data-micro-action="price" data-micro-session="${esc(s.id)}" data-micro-batch="${esc(x.batchId)}">Set price</button>`:''}</div>`).join('');
 const financial=`<div class="micro-stats"><span>Stock <b>${stock}</b></span><span>Reputation <b>${Math.round(rep)}/100</b></span><span>Gross <b>${money(s.grossRevenue)}</b></span><span>Tips <b>${money(s.tips)}</b></span><span>Costs <b>${money(s.actualCosts)}</b></span><span>Refunds <b>${money(s.refunds)}</b></span><span>Net <b>${money(s.netProfit)}</b></span></div>`;
 let work='';
 if(prep){
  const perishable=['cookies','cupcakes'].includes(s.businessType),yard=s.businessType==='yard';
  const items=(S.inventoryItems||[]).filter(it=>yard?microbusinessValidateYardItem5D2(it.id,{sessionId:s.id}).ok:(s.businessType==='cookies'?['bakedCookies','heartCookies']:['cupcakes']).includes(it.key)&&!isSpoiled(it)&&!it.stored&&!it.opened).slice(0,60);
  const stored=((S.businesses||[]).find(x=>x.id===b.id)?.storedBatches5D2||[]).filter(x=>x.status==='stored'&&(!x.expiryDateISO||x.expiryDateISO>=currentDate()));
  work=`<div class="micro-prepare"><div class="micro-form" data-micro-form="${esc(s.id)}"><label>${yard?'Owned item':perishable?'Baked food from Inventory':'Supplies / saved stock'}<select data-micro-field="source">${yard||perishable?items.map(it=>microbusinessOption5D6(it.id,`${it.name} (${it.quantity||1})`)).join(''):microbusinessOption5D6('new','Buy real supplies')+stored.map(x=>microbusinessOption5D6('stored:'+x.id,`Reuse ${x.quantity} unsold (${x.productId})`)).join('')}</select></label><label>Quantity<input type="number" min="1" max="200" value="${yard?1:10}" data-micro-field="quantity"></label><label>Unit price<input type="number" min="0.5" max="500" step="0.01" value="${s.batches.slice(-1)[0]?.unitPrice||bizProduct(b)?.basePrice||3}" data-micro-field="price"></label><button class="small primary" data-micro-action="batch" data-micro-session="${esc(s.id)}" ${((yard||perishable)&&!items.length)?'disabled':''}>Prepare stock</button></div>${(yard||perishable)&&!items.length?`<small>${yard?'You need an eligible owned item.':'Bake food first, then return here.'}</small>`:''}</div><div class="inline-actions">${microbusinessButtons5D6([['open','Open for customers'],['cancel','Cancel session']],s.id)}</div>`;
 }else if(open){
  const e=s.customerEncounters.find(x=>['arrived','question','counter_offer','complaint'].includes(x.status));
  const eventHtml=e?`<div class="micro-encounter"><b>${esc(e.customerType==='anonymous'?'A customer':e.customerType?.replace(/_/g,' ')||'Customer')}</b> wants ${e.quantity} × ${esc(s.batches.find(x=>x.batchId===e.batchId)?.productId||'item')}. Listed ${money(e.listedTotal)}${e.kind==='bargain'?`, offers ${money(e.offerTotal)}`:''}${e.counterTotal?`, counter ${money(e.counterTotal)}`:''}.<small>${esc(e.status==='complaint'?'Customer has raised a complaint.':e.status==='counter_offer'?'Awaiting decision on your counteroffer.':e.kind==='question'?'Customer is asking about quality or ingredients.':e.kind==='browse'?'Customer is browsing.':'Customer is considering the price.')}</small><div class="inline-actions">${e.status==='complaint'?microbusinessButtons5D6([['apologize','Apologize'],['refund','Refund'],...(s.businessType==='yard'?[]:[['replace','Replace']]),['complaint_decline','Decline complaint']],s.id):microbusinessButtons5D6([...(e.turns?[]:[['answer','Answer'],['recommend','Recommend']]),['keep_price','Keep price'],['discount','10% discount'],...(e.kind==='bargain'?[['counter','Counteroffer'],['accept_offer','Accept offer']]:[]),['decline','Decline sale']],s.id)}</div><input type="hidden" data-micro-encounter="${esc(e.id)}"></div>`:'';
  work=`<div class="inline-actions"><button class="small primary" data-micro-action="customer" data-micro-session="${esc(s.id)}" ${e?'disabled':''}>${e?'Customer waiting':'Next customer'}</button>${microbusinessButtons5D6([['finish','Close & store unsold'],['discard','Close & discard unsold']],s.id)}</div>${eventHtml}${!e&&s.customerEncounters.length?`<small>${esc(s.customerEncounters.slice(-1)[0].outcome5D3||'Customer left')} • ${s.customerEncounters.length}/${s.customerLimit5D3??'?'} visits</small>`:''}`;
 }
 const caregivers=S.age<18&&['preparing','open'].includes(s.status)?householdCaregivers().filter(p=>p.id).slice(0,5):[];
 const helpHtml=caregivers.length?`<details><summary>Family assistance</summary><div class="micro-form" data-micro-help="${esc(s.id)}"><select data-micro-helper>${caregivers.map(p=>microbusinessOption5D6(p.id,p.name)).join('')}</select><select data-micro-purpose>${[['supervise','Supervise'],['prepare','Help prepare'],['supplies','Help source supplies'],['encourage','Encourage']].map(x=>microbusinessOption5D6(...x)).join('')}</select><button class="small ghost" data-micro-action="help" data-micro-session="${esc(s.id)}">Ask caregiver</button></div><small>Permission uses household decisions; approval never creates free ingredients.</small></details>`:'';
 const customerIDs=[...new Set(s.customerEncounters.filter(e=>e.saleTransactionId&&e.customerKey5D4&&microbusinessOrderCustomer5D5(s,e.customerKey5D4)).map(e=>e.customerKey5D4))];
 const orderForm=open&&customerIDs.length&&s.businessType!=='yard'?`<details><summary>Schedule a returning customer order</summary><div class="micro-form" data-micro-order="${esc(s.id)}"><select data-micro-order-customer>${customerIDs.map(n=>microbusinessOption5D6(n,(S.npcs||[]).find(x=>x.id===n)?.firstName||n)).join('')}</select><select data-micro-order-batch>${s.batches.filter(x=>x.remaining>0).map(x=>microbusinessOption5D6(x.batchId,`${x.productId} (${x.remaining})`)).join('')}</select><label>Qty<input type="number" min="1" max="12" value="1" data-micro-order-qty></label><label>Pickup in days<input type="number" min="1" max="7" value="1" data-micro-order-days></label><label>Hour (9–18)<input type="number" min="9" max="18" value="12" data-micro-order-hour></label><button class="small primary" data-micro-action="order" data-micro-session="${esc(s.id)}">Schedule order</button></div></details>`:'';
 const orderRows=orders.map(o=>`<div class="micro-line"><span>${esc(o.status)} • ${o.quantity} × ${esc(o.productId)} • ${esc(o.pickupDateISO)} ${timeLabel(o.pickupMinute)}</span><div class="inline-actions">${o.status==='Due'&&open?`<button class="small primary" data-micro-action="fulfill" data-micro-session="${esc(s.id)}" data-micro-order-id="${esc(o.id)}">Complete pickup</button>`:''}<button class="small ghost" data-micro-action="cancel_order" data-micro-order-id="${esc(o.id)}">Cancel order</button></div></div>`).join('');
 const market=open?microbusinessMarketContext5D5(s):null;
 return `<div class="micro-session"><div class="micro-line"><b>Interactive session • ${esc(s.status)}</b><small>${esc(s.dateISO)} • ${timeLabel(s.startMinute)}${market?` • nearby competitors ${market.competition}`:''}</small></div>${financial}${batches}${work}${helpHtml}${orderForm}${orderRows?`<details open><summary>Pickup commitments (${orders.length})</summary>${orderRows}</details>`:''}</div>${microbusinessHistoryHtml5D6(history)}`;
}
function microbusinessHistoryHtml5D6(rows){return rows.length?`<details class="micro-history"><summary>Session history (${rows.length} recent)</summary>${rows.map(s=>`<div class="micro-line"><span>${esc(s.dateISO)} • ${esc(s.status)}</span><small>Revenue ${money(s.grossRevenue)} • net ${money(s.netProfit)} • ${s.transactions.length} receipts</small></div>`).join('')}</details>`:''}
function microbusinessClick5D6(button){
 const d=button.dataset,action=d.microAction;if(!action)return false;
 const id=d.microSession,s=id?microbusinessSession5D1(id):null;
 const parent=button.closest('.micro-session,.biz-card,.business-builder')||document;
 const field=(selector)=>parent.querySelector(selector);
 let r={ok:false,reason:'unknown_action'},label='Updated';
 if(action==='session'){r=microbusinessStartSession5D6(d.microBusiness);label='Business session ready';}
 else if(action==='legacy'){r=microbusinessResumeLegacy5D6(d.microBusiness);label='Classic selling restored for earlier stock';}
 else if(action==='batch'&&s){const form=field('[data-micro-form]'),source=form?.querySelector('[data-micro-field="source"]')?.value||'new',quantity=Number(form?.querySelector('[data-micro-field="quantity"]')?.value),unitPrice=Number(form?.querySelector('[data-micro-field="price"]')?.value),stored=source.startsWith('stored:');r=microbusinessPrepareBatch5D2(id,{batchId:`ui5d6:${id}:${s.batches.length+1}`,quantity,unitPrice,...(stored?{storedBatchId:source.slice(7)}:source==='new'?{}:{itemId:source})});label='Stock prepared';}
 else if(action==='price'&&s){r=microbusinessSetPrice5D2(id,d.microBatch,Number(field(`[data-micro-price="${d.microBatch}"]`)?.value));label='Price updated';}
 else if(action==='open'&&s){const gate=microbusinessSupervisorGate5D5(s);r=gate.ok?microbusinessTransition5D1(id,'open'):gate;label='Customers welcome';}
 else if(action==='cancel'&&s){r=microbusinessFinishSession5D6(id,'store');label='Session cancelled';}
 else if(action==='finish'&&s){r=microbusinessFinishSession5D6(id,'store');label='Unsold stock stored';}
 else if(action==='discard'&&s){r=microbusinessFinishSession5D6(id,'discard');label='Unsold stock discarded';}
 else if(action==='customer'&&s){r=microbusinessNextCustomer5D3(id);label=r.reused?'Existing customer still waiting':'Customer arrived';}
 else if(['answer','recommend','keep_price','discount','counter','accept_offer','decline'].includes(action)&&s){const e=field('[data-micro-encounter]')?.dataset.microEncounter;r=microbusinessRespond5D3(id,e,action);label=r.encounter?.outcome5D3==='purchased'?'Sale completed':r.requiresResponse?'Customer conversation continues':'Customer decision recorded';}
 else if(['apologize','refund','replace','complaint_decline'].includes(action)&&s){r=microbusinessResolveComplaint5D3(id,field('[data-micro-encounter]')?.dataset.microEncounter,action==='complaint_decline'?'decline':action);label='Complaint resolved';}
 else if(action==='help'&&s){r=microbusinessFamilyHelp5D5(id,field('[data-micro-helper]')?.value,field('[data-micro-purpose]')?.value);label='Family request recorded';}
 else if(action==='order'&&s){const form=field('[data-micro-order]'),batch=s.batches.find(x=>x.batchId===form?.querySelector('[data-micro-order-batch]')?.value);r=batch?microbusinessCreateOrder5D5({requestId:`ui-${s.id}-${microbusinessState5D5().orders5D5.length+1}`,sessionId:id,customerNpcId:form.querySelector('[data-micro-order-customer]').value,productId:batch.productId,quantity:Number(form.querySelector('[data-micro-order-qty]').value),unitPrice:batch.unitPrice,pickupDateISO:addDays(currentDate(),Number(form.querySelector('[data-micro-order-days]').value)),pickupMinute:Number(form.querySelector('[data-micro-order-hour]').value)*60}):{ok:false,reason:'no_stock'};label='Pickup added to Calendar';}
 else if(action==='fulfill'&&s){const o=microbusinessOrder5D5(d.microOrderId),batch=s.batches.find(x=>x.productId===o?.productId&&x.remaining>=o.quantity&&x.unitPrice>=o.unitPrice);r=microbusinessFulfillOrder5D5(d.microOrderId,id,batch?.batchId||'');label='Pickup completed';}
 else if(action==='cancel_order'){r=microbusinessCancelOrder5D5(d.microOrderId);label='Order cancelled';}
 // Explicit gameplay actions consume time; read-only price edits, H3 questions and
 // failed operations never advance the clock. The canonical receipt remains once-only.
 if(r?.ok&&!r.reused){
  const minutes=action==='batch'?20:action==='customer'?6:
   ['answer','recommend','keep_price','discount','counter','accept_offer','decline','apologize','refund','replace','complaint_decline'].includes(action)?5:action==='order'?10:0;
  if(minutes)advanceTime(minutes,{silent:true});
 }
 microbusinessUIMessage5D6(r,label);save();render();return true;
}
