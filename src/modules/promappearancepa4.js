// HF-PA.4 — one event-scoped appearance plan; real 6B.2 inventory and Getting Ready remain authoritative.
// Planning is a read/write preference only. Physical preparation and item consumption go through 6B.2.
const PROM_PA4_HAIR={natural:['Natural / loose',12],ponytail:['Ponytail',18],braid:['Braid',24],curls:['Curls / waves',32],updo:['Elegant updo',35],sleek:['Sleek style',18]};
const PROM_PA4_MAKEUP={none:['No makeup',0],natural:['Natural',1.5],soft:['Soft glam',2.2],classic:['Classic evening',3.3],shimmer:['Shimmer / festive',3.3],bold:['Bold (age appropriate)',4]};
function promPA4QualityDelta(kind,style){return kind==='hair'?({braid:2,curls:3,updo:4,sleek:1}[style]||0):({soft:2,classic:1,shimmer:3,bold:2}[style]||0);}
function promPA4HairMinutes(style){return PROM_PA4_HAIR[style]?.[1]||20;}
function promPA4MakeupUnits(style){return PROM_PA4_MAKEUP[style]?.[1]??3.3;}
function promPA4Selected(kind,r=promReadyRecord6B2()){
 const key=kind==='hair'?'plannedHair':'plannedMakeup';
 const choices=kind==='hair'?PROM_PA4_HAIR:PROM_PA4_MAKEUP;
 return Object.hasOwn(choices,r?.[key])?r[key]:kind==='hair'?'natural':'classic';
}
function promPA4ValidStyle(kind,choice){
 const opts=kind==='hair'?PROM_PA4_HAIR:PROM_PA4_MAKEUP;if(!Object.hasOwn(opts,choice))return false;
 if(kind==='hair'){
  const len=S.appearance?.hairLength||S.hairLength||null;
  if(len==='short'&&['updo','braid','ponytail'].includes(choice))return false;
 }
 return true;
}
function promPA4Gate(pr=S?.school?.prom){
 const n=promNightRecord6B1(pr);
 if(!n||pr?.status!=='Season'||!promRegistered6A1(pr)||pr.plan==='skip'||['attending','completed','missed','cancelled'].includes(n.status))return {ok:false,reason:'No active registered Prom'};
 const e=promSeasonEligibility6A1(),id=promIdentity6A1(e),ev=promNightEvent6B1(pr);
 if(!e.ok||!id||id.eventId!==n.eventId||!ev||isTerminal(ev.status))return {ok:false,reason:'School/event eligibility changed'};
 if(currentDate()>n.dateISO||currentDate()===n.dateISO&&currentMinute()>=n.entryCutoffMinute)return {ok:false,reason:'Prom check-in cutoff has passed'};
 return {ok:true,n};
}
function promPA4Choose(kind,choice){
 const pr=S?.school?.prom,g=promPA4Gate(pr);if(!g.ok)return g;
 if(!['hair','makeup','outfit'].includes(kind))return {ok:false,reason:'unknown_plan'};
 if(kind==='outfit'){
  const i=(S.inventoryItems||[]).find(x=>x.id===choice);
  if(!i||i.lifecycleType!=='wearable'||catalogItem(i.key)?.category!=='Clothes'||!catalogItem(i.key)?.slot)return {ok:false,reason:'not_owned_clothing'};
  if(i.stored||i.condition<=0)return {ok:false,reason:'item_stored_or_unusable'};
  const r=ensurePromReady6B2(pr);if(!r)return {ok:false,reason:'no_active_prom'};
  r.schemaVersion=Math.max(2,r.schemaVersion||1);r.plannedOutfitItemId=i.id;
  return {ok:true,planned:true,itemId:i.id};
 }
 if(!promPA4ValidStyle(kind,choice))return {ok:false,reason:'style_incompatible_or_unknown'};
 const r=ensurePromReady6B2(pr);if(!r)return {ok:false,reason:'no_active_prom'};
 if(kind==='hair'&&r.hair||kind==='makeup'&&r.makeup)return {ok:false,reason:'already_applied_cannot_change'};
 r.schemaVersion=Math.max(2,r.schemaVersion||1);
 r[kind==='hair'?'plannedHair':'plannedMakeup']=choice;
 return {ok:true,planned:true,kind,choice};
}
function promPA4KitState(style='classic'){
 const req=promPA4MakeupUnits(style),kits=(S.inventoryItems||[]).filter(i=>i?.key==='makeup'&&i.lifecycleType==='finite');
 const usable=kits.find(i=>!i.stored&&Number(i.remaining)>=req);
 if(usable)return {ok:true,item:usable,required:req};
 if(!kits.length)return {ok:false,reason:'No makeup set owned. Purchase a real Makeup set in the Store.',required:req};
 if(kits.some(i=>i.stored&&Number(i.remaining)>=req))return {ok:false,reason:'Your makeup kit is stored. Retrieve it from Inventory first.',required:req};
 const max=Math.max(...kits.filter(i=>!i.stored).map(i=>Number(i.remaining)||0),0);
 return {ok:false,reason:`Not enough makeup in an available kit: ${max.toFixed(1)} units remain; ${req.toFixed(1)} required.`,required:req};
}
function promPA4NoMakeup(){
 const pr=S?.school?.prom,g=promReadyWindow6B2(pr);if(!g.ok)return g;
 const day=promDayOnly6B2(pr);if(!day.ok)return day;
 const r=ensurePromReady6B2(pr);if(!r)return {ok:false,reason:'no_active_prom'};
 if(r.makeup)return {ok:false,reason:'makeup_already_prepared'};
 if(promPA4Selected('makeup',r)!=='none')return {ok:false,reason:'plan_no_makeup_first'};
 r.makeup={method:'none',style:'none',quality:0,dateISO:currentDate(),minute:currentMinute()};
 if(pr.prep)pr.prep.makeup='none';log('Prom appearance','You choose to go without makeup. Your natural look is ready.');
 return {ok:true};
}
function promPA4PlanHtml(pr=S?.school?.prom){
 const g=promPA4Gate(pr);if(!g.ok)return `<small class="muted-text">${esc(g.reason)}</small>`;
 const r=promReadyRecord6B2(pr),hair=r?.plannedHair||'natural',makeup=r?.plannedMakeup||'classic',wear=promWearableOptions6B2();
 const outfit=(S.inventoryItems||[]).find(i=>i.id===r?.plannedOutfitItemId);
 const kit=promPA4KitState(makeup);
 const controls=(kind,choices,pick)=>`<div class="prom-pa4-choices" role="group" aria-label="Choose ${esc(kind)} style">${Object.entries(choices).map(([id,meta])=>{
 const valid=promPA4ValidStyle(kind,id),active=id===pick;
 return `<button class="small ${active?'':'ghost'}" data-prom-pa4-plan="${kind}" data-prom-pa4-choice="${id}" aria-pressed="${active?'true':'false'}" ${valid?'':'disabled'}>${esc(meta[0])}</button>`;}).join('')}</div>`;
 return `<div class="prom-pa4-planning" data-prom-pa4-plan-panel="${esc(g.n.eventId)}"><h5>Plan ahead · your look</h5><p class="muted-text">Choose a look now, even weeks early. These choices are only a plan: no time, money, or cosmetics are spent. Apply hair and makeup at Home on Prom day after noon, before check-in closes.</p>`+
 `<div class="prom-pa4-step"><b>Outfit from your wardrobe</b><small>${outfit?`Planned: ${esc(outfit.name)} · ${outfit.stored?'stored, retrieve first':outfit.condition<=0?'unusable': 'owned'}`:'Nothing planned; ordinary clothes are allowed.'}</small><div class="prom-pa4-choices">${wear.map(i=>`<button class="small ${r?.plannedOutfitItemId===i.id?'':'ghost'}" data-prom-pa4-plan="outfit" data-prom-pa4-choice="${esc(i.id)}" aria-pressed="${r?.plannedOutfitItemId===i.id?'true':'false'}">${esc(i.name)} (${Math.round(i.condition)}%)</button>`).join('')||'<small>No usable clothing; browse the Store or retrieve clothing from Inventory.</small>'}</div></div>`+
 `<div class="prom-pa4-step"><b>Hair · ${esc(PROM_PA4_HAIR[hair]?.[0]||'Natural')}</b>${controls('hair',PROM_PA4_HAIR,hair)}<small>Hair length limitations apply when recorded.</small></div>`+
 `<div class="prom-pa4-step"><b>Makeup · ${esc(PROM_PA4_MAKEUP[makeup]?.[0]||'Classic')}</b>${controls('makeup',PROM_PA4_MAKEUP,makeup)}<small>${makeup==='none'?'No kit or consumption required.':esc(kit.ok?`Owned kit ready (${Number(kit.item.remaining).toFixed(1)} units; ${kit.required.toFixed(1)} for this look).`:kit.reason)} Makeup is always optional.</small></div><small class="muted-text">Next: <a href="#prom-pa4-ready-${esc(g.n.eventId)}">Getting Ready · actual preparation</a>, at Home on Prom day (from noon). Planning never applies products.</small></div>`;
}
function promPA4GettingReadyHtml(pr=S?.school?.prom){
 const n=promNightRecord6B1(pr);if(!n)return '';
 const r=promReadyRecord6B2(pr),s=promReadySummary6B2(pr),g=promReadyWindow6B2(pr),days=daysBetween(currentDate(),n.dateISO),day=promDayOnly6B2(pr);
 const hair=promPA4Selected('hair',r),makeup=promPA4Selected('makeup',r),kit=promPA4KitState(makeup),helpers=promHelperCandidates6B2();
 const wear=promWearableOptions6B2();const outfit=(S.inventoryItems||[]).find(i=>i.id===r?.plannedOutfitItemId);
 const status=!g.ok?({'prepare_at_home':'Return Home to get ready.','preparation_window_closed':'Outfit dressing opens during the final 7 days before Prom.','too_late':'Check-in is closed.','not_available':'This Prom is over or attendance is closed.'}[g.reason]||`Getting Ready: ${g.reason.replaceAll('_',' ')}`):!day.ok?`Planned styles are saved. Hair and makeup can be applied on Prom day after noon at Home.`:null;
 const enabled=g.ok&&day.ok;
 const readyText=`Outfit: ${s?.outfitValid?esc(s.outfitName):s?.outfitName?'Selected item is not currently wearable':'not worn'} · Hair: ${r?.hair?esc(PROM_PA4_HAIR[r.hair.style]?.[0]||'styled'):esc(PROM_PA4_HAIR[hair][0])+' planned'} · Makeup: ${r?.makeup?esc(PROM_PA4_MAKEUP[r.makeup.style]?.[0]||r.makeup.method):esc(PROM_PA4_MAKEUP[makeup][0])+' planned'}.`;
 return `<div class="prom-ready-6b2 prom-pa4-ready" id="prom-pa4-ready-${esc(n.eventId)}" data-prom-ready6b2="${esc(n.eventId)}"><h4>Getting Ready · School Prom</h4><p class="muted-text">${readyText}</p>${status?`<p class="muted-text">${esc(status)}</p>`:''}`+
 (g.ok?`<div class="prom-pa4-step"><b>1 · Wear a real outfit</b><div class="inline-actions">${wear.map(i=>`<button class="small ghost" data-prom-ready-action6b2="outfit" data-item-id="${esc(i.id)}" ${r?.outfitItemId===i.id?'disabled':''}>Wear ${esc(i.name)}${outfit?.id===i.id?' · planned':''}</button>`).join('')||'<small>No usable clothes in your current Inventory.</small>'}</div></div>`:'')+
 `<div class="prom-pa4-step"><b>2 · Hair (${esc(PROM_PA4_HAIR[hair][0])})</b>${r?.hair?'<span class="tag ok">Styled</span>':`<button class="small ghost" data-prom-ready-action6b2="hair" ${enabled?'':'disabled'}>Style hair · ${promPA4HairMinutes(hair)} min</button>`}</div>`+
 `<div class="prom-pa4-step"><b>3 · Makeup (${esc(PROM_PA4_MAKEUP[makeup][0])})</b>${r?.makeup?'<span class="tag ok">Finished</span>':makeup==='none'?`<button class="small ghost" data-prom-pa4-action="none" ${enabled?'':'disabled'}>Confirm no makeup</button>`:
 `${S.age>=13?`<button class="small ghost" data-prom-ready-action6b2="self" ${enabled&&kit.ok?'':'disabled'}>Apply own makeup · ${kit.required.toFixed(1)} units</button>`:'<small>Self makeup is available from age 13.</small>'}${helpers.map(p=>`<button class="small ghost" data-prom-ready-action6b2="helper" data-person-id="${esc(p.id)}" ${enabled?'':'disabled'}>Ask ${esc(displayName(p))} to help</button>`).join('')}`}${!r?.makeup&&makeup!=='none'?`<small>${esc(kit.ok?'Usable makeup kit found.':kit.reason)} A genuine available caregiver may help without your own kit.</small>`:''}</div></div>`;
}
function promPA4Click(b){
 if(!b?.dataset)return false;
 if(b.dataset.promPa4Plan){const r=promPA4Choose(b.dataset.promPa4Plan,b.dataset.promPa4Choice);if(!r.ok)toast('Prom appearance: '+r.reason.replaceAll('_',' '));save();render();return true;}
 if(b.dataset.promPa4Action==='none'){const r=promPA4NoMakeup();if(!r.ok)toast('Prom appearance: '+r.reason.replaceAll('_',' '));save();render();return true;}
 return false;
}
