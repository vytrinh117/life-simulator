// CROSS-PHASE H4 — canonical public glossary + conservative 1-time migration.
// Existing p.love.stage keys are retained; the display glossary is not a migration
// of consent, previous commitments, orientation, milestones, or dates.
const LOVE_LADDER_H4=[
 ['noticing','No Romantic Interest'],['crushOne','One-Sided Crush'],
 ['crushMutual','Mutual Interest'],['talking','Talking / Getting to Know Each Other'],
 ['goingOut','Dating / Seeing Each Other'],['exclusive','Exclusive Dating'],
 ['official','Official Partners'],['inLove','In Love'],['superInLove','Deeply Committed']
];
const LOVE_COMMITMENTS_H4={serious:'Promise ring',livingTogether:'Living Together',engaged:'Engaged',married:'Married',family:'Family Milestone'};
function romanceDisplayLabelH4(p){
 if(!p)return 'No Romantic Interest';const L=ensureLove(p),id=L.stage;
 if(id==='ex')return 'Former Partner';
 if(id==='crushOne')return 'You Have a Crush';
 if(id==='crushThem')return 'They Have a Crush'; // Only after an explicit revealed NPC confession.
 if(id==='family'||id==='married'||id==='engaged'||id==='livingTogether'||id==='serious')return 'Deeply Committed';
 return LOVE[LOVE_IDX[id]]?.label||'Relationship Status Unknown';
}
function romanceCommitmentLabelH4(p){
 const id=ensureLove(p)?.stage;
 return LOVE_COMMITMENTS_H4[id]||null;
}
function loveLadderHtmlH4(p){
 const L=ensureLove(p),idx=LOVE_IDX[L.stage]??-1,step=clamp(L.progress||0),ex=L.stage==='ex';
 const ladder=LOVE_LADDER_H4.map(([id,label])=>{
  const cur=id===L.stage||(id==='superInLove'&&idx>LOVE_IDX.superInLove&&!ex)||(id==='crushOne'&&L.stage==='crushThem');
  const done=!ex&&idx>LOVE_IDX[id];
  const shown=id==='crushOne'?(L.stage==='crushThem'?'They Have a Crush':L.stage==='crushOne'?'You Have a Crush':label):label;
  return `<span class="ladder-step ${cur?'on':done?'done':''}" ${cur?'aria-current="step"':''}>${esc(shown)}</span>`;
 }).join('');
 const commitment=romanceCommitmentLabelH4(p);
 const stage=romanceDisplayLabelH4(p);
 const progressInfo=ex?'Former relationship — progression is paused until a consensual reconciliation.':
  idx>=LOVE_IDX.official?'Emotional growth is separate from friendship and from major life commitments.':
  'Talking, dating and exclusivity require actual mutual conversations or shared experiences. No automatic agreement at 100%.';
 const meter=!ex?`<div class="h4-metric-grid">
  <div class="love-line"><small>Closeness (friendship) · ${Math.round(p.rel||0)}%</small><div class="progress"><i style="width:${clamp(p.rel||0)}%"></i></div></div>
  <div class="love-line"><small>Romantic connection · ${Math.round(step)}%</small><div class="progress"><i style="width:${step}%"></i></div></div>
  <div class="love-line"><small>Trust · ${Math.round(p.trust??50)}%</small><div class="progress"><i style="width:${clamp(p.trust??50)}%"></i></div></div>
 </div>`:'';
 return `<div class="h4-love-panel" data-h4-love="${esc(p.id)}"><p class="h4-current">Current stage: <b>${esc(stage)}</b></p>
 <div class="love-ladder" aria-label="Relationship stages">${ladder}</div>
 ${commitment?`<p class="h4-commitment">Life commitment / milestone: <b>${esc(commitment)}</b> — not an automatic romance level.</p>`:''}
 ${meter}<p class="muted-text h4-note">${esc(progressInfo)}</p></div>`;
}
function migrateLoveH4(){
 if(!S||S.crossPhaseH4Version>=1)return;
 for(const p of S.people||[]){
  if(!p||!p.love)continue;const L=p.love;
  // No guessing at one-sided feelings, exclusivity, or historical promise rings.
  // Old 'goingOut' is displayed as dating, but unchanged in the save.
  if(L.stage==='exclusive'&&L.exclusivityAgreedAt&&S.romance?.partnerId!==p.id){
   S.romance.exclusivePartnerId=S.romance.exclusivePartnerId||p.id;
  }
  L.stageSchemaVersion=4;
 }
 S.crossPhaseH4Version=1;
}
function romanceStageConversationH4(p,kind){
 if(!p||!eligibleRomance(p))return false;
 const L=ensureLove(p),talk=kind==='talkingH4',target=talk?'talking':'exclusive';
 const valid=talk?L.stage==='crushMutual':L.stage==='goingOut';
 if(!valid){toast('That conversation is not available at this relationship stage.');return false}
 if(S.romance?.partnerId&&S.romance.partnerId!==p.id){toast('You already have a committed partner.');return false}
 if(S.romance?.exclusivePartnerId&&S.romance.exclusivePartnerId!==p.id){toast('You already agreed to exclusive dating with someone else.');return false}
 const ctx={stage:L.stage,kind,dateBand:Math.min(3,(L.dateHistory||[]).length)};
 const prev=findDecision('h4StageConversation',`${p.id}:${target}`,ctx,p.id);
 if(prev){log('Their answer is unchanged',prev.reason);return false}
 const compat=romanceCompatibility(p),enough=talk?L.mutual&&p.trust>=35:L.mutual&&(L.dateHistory||[]).length>=1&&p.trust>=52&&p.rel>=55;
 const eligible=enough&&compat.orientationOK&&!compat.committedElsewhere;
 const score=clamp((compat.score||0)+((p.trust||50)-50)*.2-(p.conflict||0)*.3,5,93);
 const accept=eligible&&chance(score);
 const reason=accept?(talk?`${firstName(p)} agrees to spend time getting to know each other without rushing a label.`:`${firstName(p)} agrees that you will only date each other for now. You have not yet agreed to become official partners.`):
  `${firstName(p)} would rather take more time. Their answer does not imply an agreement or a breakup.`;
 recordDecision({requestType:'h4StageConversation',targetKey:`${p.id}:${target}`,decisionMakerId:p.id,context:ctx,outcome:accept?'Accepted':'Declined',reason,reconsiderAfter:addDays(currentDate(),accept?1:14),resolved:true});
 advanceTime(20,{silent:true});closeChoiceModal();
 if(accept){setLoveStage(p,target,talk?'agreed to get to know each other':'mutually agreed to date exclusively');if(!talk){const fresh=ensureLove(p);fresh.exclusivityAgreedAt=currentDate();S.romance.exclusivePartnerId=p.id;} }
 log(accept?(talk?'Getting to know each other':'Exclusive dating'):'Not right now',reason,accept);return accept;
}

function loveSummaryHtmlH4(p){
 const L=ensureLove(p),cl=clamp(p.rel||0),rom=clamp(L.progress||0),tr=clamp(p.trust??50),commit=romanceCommitmentLabelH4(p);
 return `<div class="h4-summary" data-h4-summary="${esc(p.id)}"><p><b>${esc(romanceDisplayLabelH4(p))}</b>${commit?` · ${esc(commit)}`:''}</p>
  <div class="h4-metric-grid"><div class="love-line"><small>Closeness · ${Math.round(cl)}%</small><div class="progress"><i style="width:${cl}%"></i></div></div>
  <div class="love-line"><small>Romantic connection · ${Math.round(rom)}%</small><div class="progress"><i style="width:${rom}%"></i></div></div>
  <div class="love-line"><small>Trust · ${Math.round(tr)}%</small><div class="progress"><i style="width:${tr}%"></i></div></div></div></div>`;
}
