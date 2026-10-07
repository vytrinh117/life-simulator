import asyncio
from pathlib import Path
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parents[1]; CHROME='/usr/bin/chromium'; R=[]
def check(name,ok,detail=''):
    R.append((name,bool(ok),detail)); print(('PASS ' if ok else 'FAIL ')+name+((' — '+str(detail)) if detail and not ok else ''))
async def page(b):
    p=await b.new_page(viewport={'width':1280,'height':900}); p.errs=[]; p.on('pageerror',lambda e:p.errs.append(str(e)))
    html=(ROOT/'index.html').read_text().replace('<script src="data.js"></script><script src="game.js"></script>','')
    await p.set_content(html,wait_until='load')
    await p.evaluate("""()=>{const mk=()=>{const m=new Map();return {getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(String(k),String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear(),key:i=>[...m.keys()][i]||null,get length(){return m.size}}};Object.defineProperty(window,'localStorage',{value:mk(),configurable:true});Object.defineProperty(window,'sessionStorage',{value:mk(),configurable:true})}""")
    await p.add_script_tag(content=(ROOT/'data.js').read_text()); await p.add_script_tag(content=(ROOT/'game.js').read_text()); return p
async def new_life(p):
    await p.fill('#c-name','P3B2Test'); await p.fill('#c-dob','2008-03-10'); await p.evaluate("()=>{document.getElementById('c-place').value='New York City, USA'}"); await p.click('#begin'); await p.evaluate('__LIFE_SIM_TEST__.setAge(16)')
async def call(p,n,*a): return await p.evaluate("([n,a])=>__LIFE_SIM_TEST__.call(n,...a)",[n,list(a)])
async def st(p): return await p.evaluate('__LIFE_SIM_TEST__.getState()')
async def main():
  async with async_playwright() as pw:
    b=await pw.chromium.launch(executable_path=CHROME,args=['--no-sandbox']); p=await page(b); await new_life(p)
    s=await st(p); f=next(x for x in s['people'] if x.get('role')=='friend')
    # Make age/orientation deterministic and compatible for scheduler tests.
    await p.evaluate("id=>__LIFE_SIM_TEST__.mutate(`const p=S.people.find(x=>x.id==='${id}');p.age=16;p.rel=82;p.trust=78;p.conflict=0;p.romanceOpen=true;p.boundaries=[];p.love=null;p.romanceStage='crush';p.attraction=82;const n=S.npcs.find(x=>x.id===p.npcId);if(n){n.birthYear=new Date(S.clock.dateISO).getUTCFullYear()-16;n.orientation='All genders'}`)",f['id'])
    await call(p,'migrateRomance3B2')
    acts=await call(p,'romanceDateActivities',f['id']); check('1 date activities use current accessible world choices',len(acts)>=4 and all(x['id'] in ['cafe','restaurant','park','picnic','mall','movie','walk','casualMeal'] for x in acts),acts)
    s=await st(p); day=s['clock']['dateISO']
    # Same rejected proposal is ledger-stable.
    await p.evaluate("id=>__LIFE_SIM_TEST__.mutate(`const p=S.people.find(x=>x.id==='${id}');const n=S.npcs.find(x=>x.id===p.npcId);if(n)n.orientation='Not interested in romance';p.romanceInit=false;p.orientationMismatch=false;p.love=null;p.romanceStage='crush'`)",f['id'])
    r1=await call(p,'romanceDateResponse',f['id'],'cafe',day,1020); s1=await st(p); n1=len([x for x in s1.get('decisionLedger',[]) if x.get('requestType')=='romanceDateAsk'])
    r2=await call(p,'romanceDateResponse',f['id'],'cafe',day,1020); s2=await st(p); n2=len([x for x in s2.get('decisionLedger',[]) if x.get('requestType')=='romanceDateAsk'])
    check('2 same rejected date proposal does not reroll',r1['kind']=='no' and r2['kind']=='no' and r1['why']==r2['why'] and n1==n2==1,(r1,r2,n1,n2))
    # Availability alone does not imply willingness: compatible but low trust/conflict can still decline.
    await p.evaluate("id=>__LIFE_SIM_TEST__.mutate(`const p=S.people.find(x=>x.id==='${id}');const n=S.npcs.find(x=>x.id===p.npcId);if(n)n.orientation='All genders';p.romanceInit=false;p.orientationMismatch=false;p.love=null;p.romanceStage='crush';p.attraction=70;p.rel=45;p.trust=20;p.conflict=60`)",f['id'])
    slots=await call(p,'romanceDateSlots',f['id'],day,'walk'); r3=await call(p,'romanceDateResponse',f['id'],'walk',day,slots[0] if slots else 1020)
    check("3 find-free-time does not force acceptance",len(slots)>=0 and r3['kind']=='no',r3)
    # Restore compatible high relationship and future day.
    await p.evaluate("id=>__LIFE_SIM_TEST__.mutate(`const p=S.people.find(x=>x.id==='${id}');p.rel=85;p.trust=82;p.conflict=0;p.romanceInit=false;p.orientationMismatch=false;p.love=null;p.romanceStage='crush';p.attraction=88;const n=S.npcs.find(x=>x.id===p.npcId);if(n)n.orientation='All genders'`)",f['id'])
    s=await st(p); day2=(await p.evaluate("d=>{const x=new Date(d+'T00:00:00Z');x.setUTCDate(x.getUTCDate()+2);return x.toISOString().slice(0,10)}",s['clock']['dateISO']))
    slots2=await call(p,'romanceDateSlots',f['id'],day2,'cafe'); start=slots2[0] if slots2 else 1020
    made=await call(p,'makeRomanceDatePlan',f['id'],'cafe',day2,start,{'inviter':'player','status':'Accepted','reason':'QC'})
    ss=await st(p); plan=next((x for x in ss['plans'] if x.get('romantic') and x.get('personId')==f['id']),None); cal=next((x for x in ss['calendar'] if plan and x.get('payload',{}).get('planId')==plan['id']),None)
    check('4 accepted date is a real plan/calendar object',plan is not None and cal is not None and plan['status']=='Accepted',(plan,cal))
    check('5 date planning record preserves required fields',all(k in plan for k in ['personId','dateISO','startMinute','endMinute','location','inviter','acceptanceState','payment','transportHook']),plan)
    # Overlap detection rejects another committed date in the same window.
    made2=await call(p,'makeRomanceDatePlan',f['id'],'walk',day2,start,{'inviter':'player','status':'Accepted'})
    check('6 schedule overlap is blocked before overwrite',bool(made2.get('conflict')) and not made2.get('plan'),made2)
    # Payment responsibility is contextual but stored, not always player-pays.
    check('7 paid date stores contextual payment responsibility',plan['payment']['mode'] in ['player','npc','split'] and plan['payment']['playerCost']<=plan['payment']['totalCost'],plan['payment'])
    # Location variety: after recording same recent location, it should not remain top if alternatives exist.
    await p.evaluate("id=>__LIFE_SIM_TEST__.mutate(`const p=S.people.find(x=>x.id==='${id}');p.love=p.love||{};p.love.dateHistory=[{dateISO:S.clock.dateISO,activityId:'cafe',outcome:'Good date'}]`)",f['id'])
    acts2=await call(p,'romanceDateActivities',f['id']); check('8 recent location is deprioritized when alternatives exist',acts2[0]['id']!='cafe',acts2[:3])
    # NPC initiative creates a pending invitation and dedicated cooldown.
    # remove conflicting player date first
    await p.evaluate("id=>__LIFE_SIM_TEST__.mutate(`for(const x of S.calendar)if(x.payload&&S.plans.some(p=>p.id===x.payload.planId&&p.personId==='${id}'))x.status='Cancelled';S.plans=S.plans.filter(x=>x.personId!=='${id}');const p=S.people.find(x=>x.id==='${id}');p.love.askCooldownUntil=null;p.love.nextInitiativeDate=null;p.rel=90;p.trust=90;p.conflict=0;p.attraction=92;p.love.npcAttraction=92`)",f['id'])
    invite=await call(p,'createNpcDateInvitation3B2',f['id'],{'activityId':'walk','day':day2,'start':start}); si=await st(p); ev=next((x for x in si['events'] if x.get('payload',{}).get('romantic')),None); ip=next((x for x in si['plans'] if x.get('romantic') and x.get('inviter')==f['id']),None)
    check('9 NPC can initiate a date with a pending plan',invite is not None and ev is not None and ip is not None and ip['status']=='Pending',(invite,ev,ip))
    L=next(x for x in si['people'] if x['id']==f['id'])['love']; check('10 NPC date initiative has anti-spam cooldown',bool(L.get('nextInitiativeDate')) and L['nextInitiativeDate']>si['clock']['dateISO'],L.get('nextInitiativeDate'))
    # Accepting NPC invitation schedules the same plan; no instant date scene/stat button.
    ok=await call(p,'handleRomanceDateInvite3B2',ev['id'],'accept'); sa=await st(p); ip2=next(x for x in sa['plans'] if x['id']==ip['id']); ca=next((x for x in sa['calendar'] if x.get('payload',{}).get('planId')==ip['id']),None)
    check('11 accepting NPC invite schedules date rather than instantly finishing it',ok is True and ip2['status']=='Accepted' and ca is not None and sa.get('scene') is None,(ip2,ca,sa.get('scene')))
    # At the scheduled time the real plan enters the existing contextual date scene.
    await p.evaluate("([d,m])=>__LIFE_SIM_TEST__.setClock(d,m)",[ip2['dateISO'],ip2['startMinute']])
    started=await call(p,'attendPlan',ip2['id']); ssn=await st(p)
    check('12 scheduled date starts a real date scene at attendance time',started is True and ssn.get('scene',{}).get('kind')=='date' and ssn.get('scene',{}).get('data',{}).get('planId')==ip2['id'],ssn.get('scene'))
    # Completion hook preserves history/milestone and advances canonical state only after actual date completion.
    await call(p,'finishRomanceDate3B2',f['id'],'Good date'); sf=await st(p); pf=next(x for x in sf['people'] if x['id']==f['id'])
    check('13 completed date records history and canonical progression',pf['love']['stage'] in ['goingOut','official','inLove','superInLove','serious','livingTogether','engaged','married','family'] and len(pf['love'].get('dateHistory',[]))>=1,pf['love'])
    check('14 first-date milestone is de-duplicated foundation',sum(1 for m in pf.get('milestones',[]) if m.get('type')=='firstDate')<=1,pf.get('milestones',[]))
    # Migration idempotence / no duplicate date history.
    before=len(sf['romance'].get('dateHistory',[])); await call(p,'migrateRomance3B2'); await call(p,'migrateRomance3B2'); sm=await st(p); after=len(sm['romance'].get('dateHistory',[])); check('15 3B.2 migration is idempotent',before==after,(before,after))
    await p.evaluate('__LIFE_SIM_TEST__.setAge(10)'); elig=await call(p,'eligibleRomance',f['id']); check('16 under-teen date system remains gated',elig is False,elig)
    check('3B.2 runtime has no page errors',not p.errs,p.errs)
    await p.close(); await b.close()
  failed=[x for x in R if not x[1]]; print(f'3B.2 focused: {len(R)-len(failed)}/{len(R)} passed'); raise SystemExit(1 if failed else 0)
asyncio.run(main())
