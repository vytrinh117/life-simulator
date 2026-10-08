// PHASE 5D.7 — Final release guard for *interactive* under-12 operations.
// The original legacy simulation and the 5D.1–5D.5 non-UI contract fixtures
// remain backward-compatible; a business explicitly in interactive mode must
// not bypass the same H3-backed caregiver supervision enforced by the UI.
function microbusinessSupervisionGate5D7(session){
 if(!session)return {ok:false,reason:'unknown_session'};
 if(S.age>=12)return {ok:true};
 const business=(S.businesses||[]).find(b=>b.id===session.businessId);
 if(!business?.microbusinessMode5D6)return {ok:true};
 return microbusinessSupervisorGate5D5(session);
}
