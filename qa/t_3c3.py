import asyncio
from pathlib import Path
from datetime import date, timedelta
from playwright.async_api import async_playwright

ROOT=Path(__file__).resolve().parents[1]
CHROME='/usr/bin/chromium'
R=[]
def check(name,ok,detail=''):
    R.append((name,bool(ok),detail)); print(('PASS ' if ok else 'FAIL ')+name+((' — '+str(detail)) if detail and not ok else ''))
async def page(b):
    p=await b.new_page(viewport={'width':1280,'height':900}); p.errs=[]; p.on('pageerror',lambda e:p.errs.append(str(e)))
    html=(ROOT/'index.html').read_text().replace('<script src="data.js"></script><script src="game.js"></script>','')
    await p.set_content(html,wait_until='load')
    await p.evaluate("""()=>{const mk=()=>{const m=new Map();return {getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(String(k),String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear(),key:i=>[...m.keys()][i]||null,get length(){return m.size}}};Object.defineProperty(window,'localStorage',{value:mk(),configurable:true});Object.defineProperty(window,'sessionStorage',{value:mk(),configurable:true})}""")
    await p.add_script_tag(content=(ROOT/'data.js').read_text()); await p.add_script_tag(content=(ROOT/'game.js').read_text()); return p
async def new_life(p,dob='2018-03-10'):
    await p.fill('#c-name','P3C3Test'); await p.fill('#c-dob',dob); await p.evaluate("()=>{document.getElementById('c-place').value='New York City, USA'}"); await p.click('#begin')
async def call(p,n,*a): return await p.evaluate("([n,a])=>__LIFE_SIM_TEST__.call(n,...a)",[n,list(a)])
async def st(p): return await p.evaluate('__LIFE_SIM_TEST__.getState()')

async def main():
  async with async_playwright() as pw:
    b=await pw.chromium.launch(executable_path=CHROME,args=['--no-sandbox'])
    p=await page(b); await new_life(p); await p.evaluate('__LIFE_SIM_TEST__.setAge(8)')

    # No watch = no smartwatch path.
    access=await call(p,'communicationDeviceAccess3C1')
    check('1 child without device has no communication device path',not access['hasAny'],access)

    # Kids watch is a limited real device.
    await p.evaluate("__LIFE_SIM_TEST__.grantItem('kidsWatch')"); await call(p,'migrateCommunication3C3')
    access=await call(p,'communicationDeviceAccess3C1'); panel=await call(p,'smartwatchPanel3C3')
    check('2 child with kids smartwatch gets limited device access',access['kidsWatch'] and not access['smartphone'],access)
    check('3 smartwatch panel exposes Messages/Calls but not full smartphone apps','Messages' in panel and 'Calls' in panel and 'Not supported' in panel and 'Limited device' in panel,panel[:500])
    navtxt=await p.locator('[data-tab="phone"]').inner_text(); await p.click('[data-tab="phone"]'); body=await p.inner_text('#panel-host')
    check('3b child can open the limited Smartwatch destination from navigation','Smartwatch' in navtxt and 'Kids smartwatch' in body and 'Social media' in body,(navtxt,body[:400]))

    s=await st(p); mother=next(x for x in s['people'] if x.get('relation')=='mother'); father=next(x for x in s['people'] if x.get('relation')=='father')
    mr=await call(p,'contactRecord3C1',mother['id']); fr=await call(p,'contactRecord3C1',father['id'])
    check('4 parents are legitimate pre-approved smartwatch contacts',mr and fr and mr.get('approvedForWatch') and fr.get('approvedForWatch'),(mr,fr))
    me=await call(p,'communicationEligibility3C1',mother['id'],'message'); vc=await call(p,'communicationEligibility3C1',mother['id'],'video')
    check('5 smartwatch supports family message/call but not smartphone video',me['ok'] and me['device']=='kidsWatch' and not vc['ok'],(me,vc))

    # Friend requires parent/guardian approval; ordinary sibling is not authority.
    s=await st(p); friend=next(x for x in s['people'] if not x.get('relation') and x.get('role')=='friend')
    await p.evaluate("id=>__LIFE_SIM_TEST__.mutate(`{const p=S.people.find(x=>x.id==='${id}');p.rel=70;p.trust=70;p.conflict=0}`)",friend['id'])
    gate=await call(p,'watchContactApprovalEligibility3C3',friend['id'])
    check('6 known friend can be submitted for smartwatch approval',gate['ok'] and not gate['already'],gate)
    await p.evaluate("window.__oldRandom=Math.random;Math.random=()=>0.999")
    d1=await call(p,'requestWatchContactApproval3C3',friend['id'])
    await p.evaluate("Math.random=()=>0")
    d2=await call(p,'requestWatchContactApproval3C3',friend['id'])
    await p.evaluate("Math.random=window.__oldRandom;delete window.__oldRandom")
    check('7 declined watch-contact request is H3 repeat-stable',d1 and d2 and d1['id']==d2['id'] and d1['outcome']=='No' and d2['outcome']=='No',(d1,d2))
    maker=next((x for x in s['people'] if x['id']==d1.get('decisionMakerId')),None)
    check('8 decision maker is parent/guardian, not ordinary older sibling',maker and (maker.get('relation') in ('mother','father','guardian') or maker.get('role')=='guardian'),maker)

    # Changed day after reconsideration can create a real new decision and approval.
    cur=(await st(p))['clock']['dateISO']; nxt=(date.fromisoformat(cur)+timedelta(days=8)).isoformat(); await p.evaluate("([d])=>__LIFE_SIM_TEST__.setClock(d,null)",[nxt])
    await p.evaluate("window.__oldRandom=Math.random;Math.random=()=>0")
    yes=await call(p,'requestWatchContactApproval3C3',friend['id'])
    await p.evaluate("Math.random=window.__oldRandom;delete window.__oldRandom")
    rec=await call(p,'contactRecord3C1',friend['id']); msg=await call(p,'communicationEligibility3C1',friend['id'],'message'); video=await call(p,'communicationEligibility3C1',friend['id'],'video')
    check('9 legitimate reconsideration can approve selected friend',yes and yes.get('outcome')=='Yes' and rec and rec.get('approvedForWatch'),(yes,rec))
    check('10 approved friend gets watch message/call channels but no video',msg['ok'] and msg['device']=='kidsWatch' and not video['ok'],(msg,video))

    # Watch location hook uses actual parent/guardian authority.
    await p.evaluate("__LIFE_SIM_TEST__.mutate(`S.location='Park';S.clock.minute=1320`)")
    loc=await call(p,'watchLocationSnapshot3C3','test')
    check('11 location-sharing hook identifies real parent/guardian authority',loc['enabled'] and loc['authorityId'] in (mother['id'],father['id']) and loc['location']=='Park',loc)

    # Curfew check can use smartwatch location to trigger a real parent call.
    await p.evaluate("__LIFE_SIM_TEST__.mutate(`S.clock.minute=1430;S.flags.curfewCall=null`)")
    await call(p,'curfewCallCheck')
    ss=await st(p); open_calls=[e for e in ss.get('events',[]) if e.get('status')=='Open' and e.get('type')=='incomingCall']
    check('12 late smartwatch location can trigger parent/guardian curfew call',bool(open_calls) and ss['communication']['watch'].get('lastLocationNotice')==ss['clock']['dateISO'],open_calls[-1] if open_calls else ss['communication']['watch'])

    # Bedtime/curfew family rule can stop a non-family late call without permanent blanket denial.
    await p.evaluate("__LIFE_SIM_TEST__.mutate(`S.location='Home';S.clock.minute=1430;S.family.rules.strictness=100`)")
    await p.evaluate("window.__oldRandom=Math.random;Math.random=()=>0")
    late=await call(p,'bedtimeCommunicationGate3C3',friend['id'],'call','kidsWatch')
    await p.evaluate("Math.random=window.__oldRandom;delete window.__oldRandom")
    check('13 late non-family call can be noticed under strict house rules',late and late['ok'] is False,late)

    # Unavailable/broken/stored watch removes active access while state/history remains.
    await p.evaluate("__LIFE_SIM_TEST__.mutate(`{const w=S.inventoryItems.find(x=>x.key==='kidsWatch');w.stored=true}`)")
    off=await call(p,'communicationEligibility3C1',mother['id'],'message')
    check('14 stored/unavailable watch blocks backend communication',not off['ok'],off)
    await p.evaluate("__LIFE_SIM_TEST__.mutate(`{const w=S.inventoryItems.find(x=>x.key==='kidsWatch');w.stored=false}`)")

    # Migration/save reload preserves state and does not fabricate history.
    before=await st(p); msgs=sum(len(x.get('msgs',[])) for x in before.get('chats',{}).values()); calls=len(before.get('callLog',[])); led=len(before.get('decisionLedger',[]))
    await p.evaluate("s=>__LIFE_SIM_TEST__.loadState(s)",before); await call(p,'migrateCommunication3C3'); await call(p,'migrateCommunication3C3'); after=await st(p)
    check('15 save/reload preserves smartwatch approval/location state',after['communication']['watch'].get('version')==1 and after['communication']['contacts'].get(friend['id'],{}).get('approvedForWatch') is True)
    check('16 repeated 3C.3 migration is idempotent and fabricates no history',sum(len(x.get('msgs',[])) for x in after.get('chats',{}).values())==msgs and len(after.get('callLog',[]))==calls and len(after.get('decisionLedger',[]))==led,(msgs,calls,led))
    check('3C.3 child runtime has no page errors',not p.errs,p.errs)
    await p.close()

    # Adult living independently: family contact remains natural but no household dinner-text assumption.
    p=await page(b); await new_life(p,'2001-03-10'); await p.evaluate('__LIFE_SIM_TEST__.setAge(25)'); await p.evaluate("__LIFE_SIM_TEST__.grantItem('phone')")
    s=await st(p); mom=next(x for x in s['people'] if x.get('relation')=='mother')
    await p.evaluate("__LIFE_SIM_TEST__.mutate(`S.housing={type:'own'};S.location='Home'`)")
    kind=await call(p,'familyMessageKind3C3',mom['id'])
    check('17 moved-out adult gets social family communication, not household logistics',kind=='parentSocial',kind)
    check('3C.3 adult runtime has no page errors',not p.errs,p.errs)
    await p.close(); await b.close()

  failed=[x for x in R if not x[1]]; print(f'3C.3 focused: {len(R)-len(failed)}/{len(R)} passed'); raise SystemExit(1 if failed else 0)
asyncio.run(main())
