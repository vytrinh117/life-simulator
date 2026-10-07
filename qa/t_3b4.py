import asyncio
from pathlib import Path
from datetime import date,timedelta
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parents[1]; CHROME='/usr/bin/chromium'; R=[]
def check(name,ok,detail=''):
    R.append((name,bool(ok),detail)); print(('PASS ' if ok else 'FAIL ')+name+((' — '+str(detail)) if detail and not ok else ''))
def add_iso(d,n): return (date.fromisoformat(d)+timedelta(days=n)).isoformat()
async def make_page(b):
    p=await b.new_page(viewport={'width':1280,'height':900}); p.errs=[]; p.on('pageerror',lambda e:p.errs.append(str(e)))
    html=(ROOT/'index.html').read_text().replace('<script src="data.js"></script><script src="game.js"></script>','')
    await p.set_content(html,wait_until='load')
    await p.evaluate("""()=>{const mk=()=>{const m=new Map();return {getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(String(k),String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear(),key:i=>[...m.keys()][i]||null,get length(){return m.size}}};Object.defineProperty(window,'localStorage',{value:mk(),configurable:true});Object.defineProperty(window,'sessionStorage',{value:mk(),configurable:true})}""")
    await p.add_script_tag(content=(ROOT/'data.js').read_text()); await p.add_script_tag(content=(ROOT/'game.js').read_text()); return p
async def new_life(p):
    await p.fill('#c-name','P3B4Test'); await p.fill('#c-dob','2008-03-10'); await p.evaluate("()=>{document.getElementById('c-place').value='New York City, USA';document.getElementById('c-attraction').value='All genders'}"); await p.click('#begin'); await p.evaluate('__LIFE_SIM_TEST__.setAge(16)')
async def call(p,n,*a): return await p.evaluate("([n,a])=>__LIFE_SIM_TEST__.call(n,...a)",[n,list(a)])
async def st(p): return await p.evaluate('__LIFE_SIM_TEST__.getState()')
async def mutate(p,code): return await p.evaluate('code=>__LIFE_SIM_TEST__.mutate(code)',code)
async def main():
  async with async_playwright() as pw:
    b=await pw.chromium.launch(executable_path=CHROME,args=['--no-sandbox']); p=await make_page(b); await new_life(p)
    s=await st(p); friends=[x for x in s['people'] if x.get('role')=='friend']; fam=[x for x in s['people'] if x.get('relation')=='sibling' or 'sibling' in x.get('role','')]
    if not fam:
        await mutate(p,"S.people.push({id:'qa-3b4-sibling',name:'Avery Test',fullName:'Avery Test',firstName:'Avery',surname:'Test',role:'older sibling',relation:'sibling',age:S.age+2,rel:70,trust:70,respect:60,reliability:65,conflict:0,history:[],milestones:[]})")
        s=await st(p); fam=[x for x in s['people'] if x.get('relation')=='sibling' or 'sibling' in x.get('role','')]
    m=friends[0]; mid=m['id']; today=s['clock']['dateISO']
    # create a genuine close-friend history and one ordinary acquaintance
    hist=','.join([f"{{dateISO:'{add_iso(today,-d)}',age:S.age,text:'Shared day',importance:1}}" for d in [1,4,8,12,18,24,31]])
    await mutate(p,f"const m=S.people.find(x=>x.id==='{mid}');m.rel=82;m.trust=76;m.respect=60;m.reliability=80;m.conflict=0;m.metDate='{add_iso(today,-50)}';m.history=[{hist}];m.milestones=[{{type:'moment',dateISO:'{add_iso(today,-20)}',age:S.age,label:'Shared memory'}}];")
    good=await call(p,'matchmakerEligible3B4',mid); check('1 Close Friend can be a matchmaker',good is True,good)
    if len(friends)>1:
        aid=friends[1]['id']; await mutate(p,f"const a=S.people.find(x=>x.id==='{aid}');a.rel=45;a.trust=40;a.metDate=S.clock.dateISO;a.history=[];a.milestones=[];")
        bad=await call(p,'matchmakerEligible3B4',aid); check('2 ordinary acquaintance is not a matchmaker',bad is False,bad)
    if fam:
        sid=fam[0]['id']; sib=await call(p,'matchmakerEligible3B4',sid); check('3 sibling can remain a valid close matchmaker',sib is True,sib)
    offer=await call(p,'createMatchOffer3B4',mid,'player'); check('4 player can ask eligible NPC for an introduction',bool(offer),offer)
    s1=await st(p); off=next((o for o in s1['romance']['matchmaking']['offers'] if o['id']==offer['id']),None); cand=next((x for x in s1['people'] if x['id']==offer['candidateId']),None)
    check('5 offered candidate becomes a stable Person',cand is not None and cand.get('introducedBy')==mid,(cand or {}).get('introducedBy'))
    info=await call(p,'matchCandidateInfo3B4',offer['id']); check('6 review includes basic candidate information',all(info.get(k) not in [None,''] for k in ['fullName','age','gender','looks','context','howKnown']),info)
    check('7 hidden orientation is not exposed automatically',info.get('orientation')=='Unknown',info.get('orientation'))
    compat=await call(p,'candidatePersonEligible3B4',offer['candidateId']); check('8 candidate passes age/orientation/availability compatibility',compat is True,compat)
    offer2=await call(p,'createMatchOffer3B4',mid,'player'); check('9 immediate retry reuses same pending offer',offer2 and offer2['id']==offer['id'] and offer2['candidateId']==offer['candidateId'],offer2)
    await call(p,'respondMatchOffer3B4',offer['id'],'maybe'); sm=await st(p); om=next(o for o in sm['romance']['matchmaking']['offers'] if o['id']==offer['id']); check('10 Maybe Later stores a real reconsideration date',om['status']=='Maybe' and bool(om.get('reconsiderDate')),om)
    blocked=await call(p,'createMatchOffer3B4',mid,'player'); check('11 Maybe Later cannot be spam-replaced immediately',blocked is None,blocked)
    await mutate(p,f"S.clock.dateISO='{add_iso(today,15)}';const m=S.people.find(x=>x.id==='{mid}');m.matchmakingNextDate=null;")
    same=await call(p,'createMatchOffer3B4',mid,'player'); check('12 Maybe Later may revisit same candidate after cooldown',same and same['id']==offer['id'] and same['candidateId']==offer['candidateId'],same)
    await call(p,'respondMatchOffer3B4',offer['id'],'decline'); declined_id=offer['candidateId']; await mutate(p,f"const m=S.people.find(x=>x.id==='{mid}');m.matchmakingNextDate=null;S.romance.matchmaking.nextNpcOfferDate=null;")
    replacement=await call(p,'createMatchOffer3B4',mid,'player'); check('13 clear rejection is not endlessly reoffered',replacement is None or replacement['candidateId']!=declined_id,replacement)
    # accept a valid current offer (existing replacement or create after clearing cooldown)
    if not replacement:
        await mutate(p,f"const m=S.people.find(x=>x.id==='{mid}');m.matchmakingNextDate=null;")
        replacement=await call(p,'createMatchOffer3B4',mid,'player')
    check('14 another compatible candidate can be offered later',bool(replacement),replacement)
    cid=replacement['candidateId']; await call(p,'respondMatchOffer3B4',replacement['id'],'accept'); sa=await st(p); oa=next(o for o in sa['romance']['matchmaking']['offers'] if o['id']==replacement['id']); check('15 accepting introduction does not auto-create a relationship',oa['status']=='Accepted' and sa['romance'].get('partnerId') is None,oa)
    # normal date plan must inherit blind-date metadata, proving shared lifecycle
    day=add_iso(sa['clock']['dateISO'],2); await p.evaluate('Math.random=()=>0.5'); made=await call(p,'makeRomanceDatePlan',cid,'cafe',day,1020,{'inviter':'player','status':'Accepted','reason':'blind-date test'})
    sb=await st(p); plan=next((x for x in sb['plans'] if x['id']==made.get('plan',{}).get('id')),None); ob=next(o for o in sb['romance']['matchmaking']['offers'] if o['id']==replacement['id']); check('16 blind date reuses normal 3B.2 plan/calendar engine',plan is not None and plan.get('romantic') and plan.get('blindDate') and plan.get('matchmakingOfferId')==replacement['id'] and ob['status']=='Scheduled',(plan,ob))
    await call(p,'finishRomanceDate3B2',cid,'Good date'); sc=await st(p); oc=next(o for o in sc['romance']['matchmaking']['offers'] if o['id']==replacement['id']); pc=next(x for x in sc['people'] if x['id']==cid); check('17 blind-date outcome flows into normal romance progression',oc['status']=='Completed' and pc['love']['stage']=='goingOut',(oc,pc['love']))
    # multiple prospects before exclusivity
    other=next(x for x in sc['people'] if x.get('role')=='friend' and x['id'] not in [mid,cid]); oid=other['id']; await mutate(p,f"const a=S.people.find(x=>x.id==='{cid}'),b=S.people.find(x=>x.id==='{oid}');a.love.stage='goingOut';a.love.mutual=true;b.age=S.age;b.rel=80;b.trust=75;b.romanceOpen=true;b.romanceInit=false;b.attraction=80;b.love={{stage:'goingOut',progress:40,since:S.clock.dateISO,playerCrush:true,npcAttraction:80,npcInterest:'reciprocates',mutual:true,dateHistory:[],inviteHistory:[],interactionDays:{{}},commitmentHistory:[]}};b.romanceStage='dating';const n=S.npcs.find(x=>x.id===b.npcId);if(n){{n.birthYear=new Date(S.clock.dateISO).getUTCFullYear()-S.age;n.orientation='All genders'}};S.romance.partnerId=null;S.romance.partner=null;S.romance.status='Single';")
    prospects=await call(p,'romanceProspects3B4'); check('18 multiple Talking/going-out prospects can coexist before exclusivity',cid in prospects and oid in prospects,prospects)
    await call(p,'commitOfficial3B3',cid,{'initiator':'player'}); sd=await st(p); od=next(x for x in sd['people'] if x['id']==oid); check('19 official commitment pauses other prospect progression',sd['romance']['partnerId']==cid and od['love'].get('commitmentPaused') is True,(sd['romance'].get('partnerId'),od['love']))
    disabled=await call(p,'matchmakerEligible3B4',mid); ini=await call(p,'romanceNpcMatchmakingInitiative3B4'); check('20 official partner disables ordinary matchmaking both directions',disabled is False and ini is False,(disabled,ini))
    # migration idempotence / no duplicate offers
    n0=len(sd['romance']['matchmaking']['offers']); await call(p,'migrateRomance3B4'); await call(p,'migrateRomance3B4'); se=await st(p); n1=len(se['romance']['matchmaking']['offers']); ids=[o['id'] for o in se['romance']['matchmaking']['offers']]; check('21 3B.4 migration is idempotent',n0==n1==len(set(ids)),(n0,n1,ids))
    check('22 friendship tiers remain independent',await call(p,'friendshipTier',mid) in ['Close Friend','Best Friend'],await call(p,'friendshipTier',mid))
    check('23 3B.4 runtime has no page errors',not p.errs,p.errs)
    await p.close(); await b.close()
  fail=[x for x in R if not x[1]]; print(f'3B.4 focused: {len(R)-len(fail)}/{len(R)} passed'); raise SystemExit(1 if fail else 0)
asyncio.run(main())
