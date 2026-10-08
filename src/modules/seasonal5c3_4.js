// PHASE 5C.3.4 — narrative only after a successful real outdoor execution.
function outdoorExperience5C34(record){
 if(!record||!['camping_weekend','autumn_hike'].includes(record.activityId))return null;
 if(record.outdoorStory5C34)return record.outdoorStory5C34;
 const camp=record.activityId==='camping_weekend',wet=!!record.weatherInconvenience;
 const choices=camp?['Setting up camp together','Sharing a simple outdoor meal','Talking around the campfire','Looking at the night sky']:['Finding the trail together','Taking a rest at the viewpoint','Talking during the walk','Helping each other across a tricky path'];
 const index=Array.from(String(record.id||record.dateISO)).reduce((n,c)=>n+c.charCodeAt(0),0)%choices.length;
 const scene=wet?(camp?'Dealing with damp camping supplies':'Working around a muddy trail'):choices[index];
 const ids=[...new Set(Array.isArray(record.participantIds)?record.participantIds:[])];
 const attended=ids.map(id=>personById(id)).filter(p=>p&&!p.deceased&&!p.movedAway);
 const outcome={scene,attendees:attended.map(p=>p.id),romanticMoment:false,weatherInconvenience:wet};
 S.needs.social=clamp(S.needs.social+(attended.length?Math.min(9,3+attended.length*2):0));
 S.needs.fun=clamp(S.needs.fun+(wet?-2:3));
 if(wet)S.energy=clamp(S.energy-2);
 for(const p of attended){
  const disagreement=wet&&(Number(p.conflict||0)>65);const family=isFamilyPerson(p);
  p.rel=clamp(Number(p.rel||0)+(disagreement?-1:family?3:2));
  p.trust=clamp(Number(p.trust||0)+(disagreement?0:1));
  if(disagreement)p.conflict=clamp(Number(p.conflict||0)+1);
  const label=disagreement?`You and ${displayName(p)} disagreed while ${scene.toLowerCase()}.`:`You and ${displayName(p)} shared ${scene.toLowerCase()} at ${record.location}.`;
  rememberPerson(p,label,1);
  const kind=camp?'camping':'hiking';const key=`outdoor-first-${kind}`;
  p.outdoorFirsts5C34=p.outdoorFirsts5C34||{};
  if(!p.outdoorFirsts5C34[key]){p.outdoorFirsts5C34[key]=record.id;addPersonMilestone(p,'moment',`First ${kind} outing together at ${record.location}.`)}
  if(record.participantMode==='partner'&&ids.length===1&&p.id===ids[0]&&seasonalParticipantGate5C1(p.id,'partner').ok){
   outcome.romanticMoment=true;outcome.romanticPersonId=p.id;
   // Established Phase 3B partner context only; no automatic dating, kiss, or stage transitions.
  }
 }
 record.outdoorStory5C34=outcome;return outcome;
}
function outdoorMeetingProvenance5C34(personId,record){
 const p=personById(personId);
 if(!p||!record||!['camping_weekend','autumn_hike'].includes(record.activityId)||!(record.participantIds||[]).includes(personId))return false;
 // Never replace established provenance: only explicitly newly met attendees can be attributed.
 if(p.metAt||p.meetingProvenance||p.knownSince<S.age||p.history?.length)return false;
 p.metAt=record.activityId==='camping_weekend'?'at a campground':'on a hiking trail';return true;
}
