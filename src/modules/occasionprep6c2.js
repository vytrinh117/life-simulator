// PHASE 6C.2 — event-scoped occasion planning; no gifts, RSVP, or party outcomes.
const OCC6C2_CHOICES={quiet:{minutes:15,cost:0},small_gathering:{minutes:35,cost:0},family_dinner:{minutes:30,cost:0},cake_prepare:{minutes:45,cost:0},cake_buy:{minutes:25,cost:25},decorate:{minutes:30,cost:12},invitations_prepare:{minutes:20,cost:0},food_select:{minutes:15,cost:0}};
function occasionPlan6C2(id){return occasionRecord6C1(id)?.planning6C2||null}
function occasionPlanningGate6C2(id,action='plan',option=null){
 const gate=occasionPreparationGate6C1(id);if(!gate.ok)return gate;
 const rec=gate.occasion,choice=OCC6C2_CHOICES[action],plan=rec.planning6C2;
 if(action!=='plan'&&action!=='budget'&&action!=='venue'&&action!=='cancel'&&!choice)return {ok:false,reason:'unknown_action'};
 if(S.age<5)return {ok:false,reason:'age_restricted'};
 if((action==='venue'||action==='small_gathering'||action==='family_dinner'||action==='decorate'||action==='cake_prepare'||action==='cake_buy')&&S.location!=='Home')return {ok:false,reason:'must_be_home'};
 if(action==='venue'&&!['Home','School when permitted','legitimate venue'].includes(option))return {ok:false,reason:'unsupported_venue'};
 if(action==='venue'&&option!=='Home')return {ok:false,reason:'venue_authorization_not_implemented'};
 if(action==='cancel'&&!plan)return {ok:false,reason:'no_plan'};
 if(choice&&plan?.steps?.some(s=>s.action===action))return {ok:false,reason:'already_prepared'};
 if(choice&&S.age<13&&action!=='quiet'&&action!=='invitations_prepare'&&action!=='food_select')return {ok:false,reason:'age_restricted'};
 // A paid action by a minor is denied until an explicit H3 approval workflow exists.
 if(choice?.cost&&S.age<18)return {ok:false,reason:'h3_approval_required'};
 if((action==='small_gathering'||action==='venue')&&S.age<18)return {ok:false,reason:'h3_approval_required'};
 if(choice?.cost&&S.money<choice.cost)return {ok:false,reason:'insufficient_funds'};
 if(choice&&stamp(currentDate(),currentMinute()+choice.minutes)>=stamp(rec.preparationDeadline.dateISO,rec.preparationDeadline.minute))return {ok:false,reason:'insufficient_time'};
 return {ok:true,occasion:rec,choice};
}
function occasionPrepare6C2(id,action,option=null){
 const gate=occasionPlanningGate6C2(id,action,option);if(!gate.ok)return gate;const rec=gate.occasion;
 if(action==='budget'&&(!Number.isSafeInteger(option)||option<0||option>10000000))return {ok:false,reason:'invalid_budget'};
 const plan=rec.planning6C2||(rec.planning6C2={schemaVersion:1,budget:0,estimatedCost:0,actualCost:0,steps:[],venue:null,choice:null,cancelled:false});
 if(action==='budget'){if(option<plan.actualCost)return {ok:false,reason:'below_actual_cost'};plan.budget=option;return {ok:true,plan}}
 if(action==='venue'){plan.venue=option;return {ok:true,plan}}
 if(action==='cancel'){plan.cancelled=true;plan.cancelledAt={dateISO:currentDate(),minute:currentMinute()};occasionTransition6C1(id,'Cancelled','Player cancelled preparation');return {ok:true,plan}}
 if(action==='plan')return {ok:true,plan};
 const c=gate.choice;
 if(c.cost&&plan.actualCost+c.cost>plan.budget)return {ok:false,reason:'over_budget'};
 if(c.cost){S.money-=c.cost;if(S.finance)S.finance.spent=(Number(S.finance.spent)||0)+c.cost;}
 plan.steps.push({action,dateISO:currentDate(),minute:currentMinute(),minutes:c.minutes,paid:c.cost});
 plan.actualCost+=c.cost;plan.estimatedCost=Math.max(plan.estimatedCost,plan.actualCost);
 if(!plan.choice&&['quiet','small_gathering','family_dinner'].includes(action))plan.choice=action;
 if(rec.status==='Preparation open')occasionTransition6C1(id,'Planned','Player began occasion preparation');
 advanceTime(c.minutes);return {ok:true,plan};
}
