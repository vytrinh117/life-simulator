// PHASE 5C.3.2 — canonical outdoor execution; later 5C.3 modules add social and stories.
function outdoorInterval5C32(activityId,dateISO,startMinute){
 const def=seasonalOutdoorDefinition5C31(activityId),start=Number(startMinute);
 if(!def||!Number.isInteger(start)||start<0||start>=1440)return {ok:false,reason:'time'};
 const minutes=activityId==='camping_weekend'?1200:Number(def.duration),total=start+minutes;
 return {ok:true,dateISO,startMinute:start,endDateISO:addDays(dateISO,Math.floor(total/1440)),endMinute:total%1440,minutes};
}
function outdoorScheduleConflict5C32(interval,ignoreId=null){
 if(!interval.ok)return null;
 let d=interval.dateISO;
 while(d<=interval.endDateISO){
  const start=d===interval.dateISO?interval.startMinute:0,end=d===interval.endDateISO?interval.endMinute:1440;
  const ignored=new Set([ignoreId,ignoreId&&ignoreId.startsWith('plan-')?'outdoor-overnight-'+ignoreId.slice(5):null]);
  const conflict=(S.calendar||[]).find(ev=>ev&&ev.dateISO===d&&!ignored.has(ev.id)&&!isTerminal(ev.status)&&Number.isFinite(Number(ev.startMinute))&&Number.isFinite(Number(ev.endMinute))&&(ev.required!==false||['plan','exam','schoolDay','workDay','program'].includes(ev.type))&&start<Number(ev.endMinute)&&Number(ev.startMinute)<end);
  if(conflict)return conflict;
  d=addDays(d,1);
 }
 return null;
}
function outdoorWeather5C32(dateISO,activityId){
 const w=S.weather?.dateISO===dateISO?S.weather:(S.weather?.forecast||[]).find(x=>x.dateISO===dateISO);
 if(!w)return {ok:true,severity:0,unknown:true,weather:'Unforecast'};
 const severity=Number(w.severity||0),type=String(w.type||'');
 const severe=severity>=3||(/storm|blizzard|hurricane|tornado|flood|lightning/i.test(type)&&severity>=2);
 return {ok:!severe,reason:severe?'severe_weather':null,severity,weather:type,unpleasant:severity>=2||/rain|snow|wind/i.test(type)};
}
function outdoorEquipment5C32(activityId,opts={}){
 if(activityId!=='camping_weekend')return {ok:true,mode:'day_hike',cost:0};
 const owned=!!(findUsable('tent')&&findUsable('sleepingBag'));
 if(owned)return {ok:true,mode:'owned',cost:0};
 const mode=String(opts.gearAccess||'').toLowerCase();
 if(mode==='provider'&&['family','friend'].includes(opts.participantMode)&&opts.supervisorId&&legitimateCampingSupervisor5C31(opts.supervisorId).ok)return {ok:true,mode:'family_provider',cost:0};
 if(mode==='rent')return {ok:true,mode:'rent',cost:RENTAL_COST_5C44.camping_weekend};
 return {ok:false,reason:'gear',detail:'Camping requires a usable tent and sleeping bag, a legitimate adult provider, or paid rental.'};
}
function outdoorExecutionGate5C32(activityId,opts={}){
 const def=seasonalOutdoorDefinition5C31(activityId);if(!def)return {ok:false,reason:'activity'};
 const dateISO=opts.dateISO||currentDate(),startMinute=Number(opts.startMinute??currentMinute()),location=opts.location||S.location;
 const base=seasonalOutdoorPlanGate5C31(activityId,{...opts,dateISO,startMinute,location});if(!base.ok)return base;
 const season=seasonalSeasonGate5C1(def,dateISO),place=seasonalLocationGate5C1(def,location,dateISO);
 if(!season.ok)return {ok:false,reason:'season'};if(!place.ok)return {ok:false,reason:'location'};
 if(activityId==='camping_weekend'&&(![0,6].includes(parseISO(dateISO).getUTCDay())||startMinute<480||startMinute>1020))return {ok:false,reason:'weekend',detail:'Camping departures are Saturday/Sunday, 08:00–17:00.'};
 const interval=outdoorInterval5C32(activityId,dateISO,startMinute),conflict=outdoorScheduleConflict5C32(interval,opts.ignoreCalendarId||null);
 if(conflict)return {ok:false,reason:'conflict',conflictId:conflict.id};
 const today=outdoorWeather5C32(dateISO,activityId),tomorrow=activityId==='camping_weekend'?outdoorWeather5C32(interval.endDateISO,activityId):{ok:true};
 if(!today.ok||!tomorrow.ok)return {ok:false,reason:'severe_weather',weather:!today.ok?today:tomorrow};
 const gear=outdoorEquipment5C32(activityId,{...opts,supervisorId:base.supervisorId||opts.supervisorId});if(!gear.ok)return gear;
 return {ok:true,interval,weather:today,weatherNext:tomorrow,gear,supervision:base.supervision,permission:base.permission};
}
function executeOutdoor5C32(activityId,opts={}){
 const dateISO=currentDate(),startMinute=currentMinute();const gate=outdoorExecutionGate5C32(activityId,{...opts,dateISO,startMinute});
 if(!gate.ok)return gate;
 if(S.age<18){const perm=requestSeasonalPermission5C1(activityId,{dateISO,startMinute},{location:opts.location||S.location,participantMode:opts.participantMode||'alone',personId:opts.personId||null,supervisorId:opts.supervisorId||null});if(!perm.ok)return {ok:false,reason:'permission_denied',permission:perm};}
 const baseCost=Number(seasonalActivityDefinition5C1(activityId).cost||0),total=baseCost+gate.gear.cost;
 if(total&&availableFunds()<total)return {ok:false,reason:'money',requiredCost:total};
 const rental=gate.gear.mode==='rent'?acquireSeasonalRental5C44(activityId,{extraCost:baseCost}):null;
 if(rental&&!rental.ok)return rental;
 if(baseCost&&!spendOwn(baseCost))return {ok:false,reason:'money',requiredCost:total};
 const loc=opts.location||S.location;advanceTime(gate.interval.minutes,{silent:true});
 if(rental?.rental)finishSeasonalRental5C44(rental.rental);
 S.energy=clamp(S.energy-(activityId==='camping_weekend'?19:12));S.needs.fun=clamp(S.needs.fun+(gate.weather.unpleasant?6:12));S.needs.hunger=clamp(S.needs.hunger+10);
 if(gate.weather.unpleasant)S.energy=clamp(S.energy-3);
 const rec={id:uid('seasonal'),activityId,dateISO,startMinute,endDateISO:currentDate(),endMinute:currentMinute(),location:loc,participantMode:opts.participantMode||'alone',participantIds:Array.isArray(opts.participantIds)?opts.participantIds.slice():(opts.personId?[opts.personId]:[]),romanticContext:false,gearAccess:gate.gear.mode,rentalId:rental?.rental?.id||null,costPaid:total,weather:gate.weather.weather,weatherInconvenience:!!gate.weather.unpleasant};
 if(typeof outdoorExperience5C34==='function'){const story=outdoorExperience5C34(rec);rec.romanticContext=!!story?.romanticMoment;}
 applySeasonalGearBenefits5C45(rec);applySeasonalEquipmentUse5C43(rec);const hist=ensureSeasonalState5C1().history;hist.unshift(rec);if(hist.length>80)hist.length=80;
 return {ok:true,record:rec,minutes:gate.interval.minutes,outcome:{weather:gate.weather.weather,gear:gate.gear.mode}};
}
