import asyncio
from datetime import date, timedelta
from pathlib import Path
from playwright.async_api import async_playwright

ROOT=Path(__file__).resolve().parents[1]
CHROME='/usr/bin/chromium'
R=[]

def check(name,ok,detail=''):
    R.append((name,bool(ok),detail))
    print(('PASS ' if ok else 'FAIL ')+name+((' — '+str(detail)) if detail and not ok else ''))

async def page(b):
    p=await b.new_page(viewport={'width':1280,'height':900})
    p.errs=[]
    p.on('pageerror',lambda e:p.errs.append(str(e)))
    html=(ROOT/'index.html').read_text().replace('<script src="data.js"></script><script src="game.js"></script>','')
    await p.set_content(html,wait_until='load')
    await p.evaluate("""()=>{const mk=()=>{const m=new Map();return {getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(String(k),String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear(),key:i=>[...m.keys()][i]||null,get length(){return m.size}}};Object.defineProperty(window,'localStorage',{value:mk(),configurable:true});Object.defineProperty(window,'sessionStorage',{value:mk(),configurable:true})}""")
    await p.add_script_tag(content=(ROOT/'data.js').read_text())
    await p.add_script_tag(content=(ROOT/'game.js').read_text())
    return p

async def new_life(p):
    await p.fill('#c-name','H33Test')
    await p.fill('#c-dob','2011-03-10')
    await p.evaluate("()=>{const x=document.getElementById('c-place');if(!x.value)x.value='New York City, USA'}")
    await p.click('#begin')
    await p.evaluate('__LIFE_SIM_TEST__.setAge(15)')
    s=await p.evaluate('__LIFE_SIM_TEST__.getState()'); today=s['clock']['dateISO']; d=date.fromisoformat(today)
    decision=(d+timedelta(days=2)).isoformat(); event=(d+timedelta(days=8)).isoformat()
    await p.evaluate("([today,decision,event])=>__LIFE_SIM_TEST__.mutate(`S.school.contests=[{id:'h33contest',name:'Math Olympiad',status:'Registered',createdDate:'${today}',decisionDate:'${decision}',eventDate:'${event}',prep:0,result:null}]`)",[today,decision,event])

async def state(p):
    return await p.evaluate('__LIFE_SIM_TEST__.getState()')

async def call(p,name,*args):
    return await p.evaluate("([n,a])=>__LIFE_SIM_TEST__.call(n,...a)",[name,list(args)])

async def main():
  async with async_playwright() as pw:
    b=await pw.chromium.launch(executable_path=CHROME,args=['--no-sandbox'])
    p=await page(b); await new_life(p)

    s0=await state(p); e0=s0['energy']; st0=s0['stress']; m0=s0['clock']['minute'];
    gains=[]
    for i in range(3):
        before=await state(p); c0=before['school']['contests'][0]['prep']
        await call(p,'contestAction','h33contest','practice')
        after=await state(p); c1=after['school']['contests'][0]['prep']
        gains.append(c1-c0)
    s3=await state(p); c3=s3['school']['contests'][0]
    check('1 First three preparation sessions grant progression',all(x>0 for x in gains),gains)
    check('2 Preparation gains have diminishing returns',gains[0]>gains[1]>gains[2],gains)
    check('3 Daily count records exactly three sessions',c3.get('prepDaily',{}).get('count')==3,c3.get('prepDaily'))
    check('4 Allowed sessions apply normal time/energy/stress consequences',s3['energy']<=e0-21 and s3['stress']==st0+6 and ((s3['clock']['minute']-m0)%1440)==225,(e0,s3['energy'],st0,s3['stress'],m0,s3['clock']['minute']))

    before4=await state(p); c_before=before4['school']['contests'][0]
    await call(p,'contestAction','h33contest','practice')
    after4=await state(p); c_after=after4['school']['contests'][0]
    check('5 Fourth same-day session grants no contest progression',c_after['prep']==c_before['prep'],(c_before['prep'],c_after['prep']))
    check('6 Blocked fourth session consumes no time/energy/stress',after4['clock']['minute']==before4['clock']['minute'] and after4['energy']==before4['energy'] and after4['stress']==before4['stress'],(before4['clock']['minute'],after4['clock']['minute'],before4['energy'],after4['energy'],before4['stress'],after4['stress']))

    # Different contests have independent per-day buckets.
    cur=await state(p); today=cur['clock']['dateISO']; d=date.fromisoformat(today); decision=(d+timedelta(days=2)).isoformat(); event=(d+timedelta(days=8)).isoformat()
    await p.evaluate("([today,decision,event])=>__LIFE_SIM_TEST__.mutate(`S.school.contests.push({id:'h33contest2',name:'Science Fair',status:'Registered',createdDate:'${today}',decisionDate:'${decision}',eventDate:'${event}',prep:0,result:null})`)",[today,decision,event])
    await call(p,'contestAction','h33contest2','practice')
    sd=await state(p); c2=next(x for x in sd['school']['contests'] if x['id']=='h33contest2')
    check('7 Per-day cap is isolated per contest',c2['prep']==10 and c2.get('prepDaily',{}).get('count')==1,c2)

    # Save/reload must preserve today's cap.
    saved=sd
    await p.evaluate('s=>__LIFE_SIM_TEST__.loadState(s)',saved)
    sr=await state(p); c_reload=next(x for x in sr['school']['contests'] if x['id']=='h33contest')
    pre=(c_reload['prep'],sr['clock']['minute'],sr['energy'],sr['stress'])
    await call(p,'contestAction','h33contest','practice')
    sr2=await state(p); c_reload2=next(x for x in sr2['school']['contests'] if x['id']=='h33contest')
    post=(c_reload2['prep'],sr2['clock']['minute'],sr2['energy'],sr2['stress'])
    check('8 Save/reload preserves same-day preparation cap',pre==post,(pre,post,c_reload2.get('prepDaily')))

    # A real new calendar day resets availability without needing migration or a history log.
    await p.evaluate('__LIFE_SIM_TEST__.advanceDays(1,true)')
    day_before=await state(p); cc=next(x for x in day_before['school']['contests'] if x['id']=='h33contest'); prep_before=cc['prep']
    await call(p,'contestAction','h33contest','practice')
    day_after=await state(p); cc2=next(x for x in day_after['school']['contests'] if x['id']=='h33contest')
    check('9 New day permits preparation again',cc2['prep']>prep_before and cc2.get('prepDaily',{}).get('count')==1,(prep_before,cc2['prep'],cc2.get('prepDaily')))
    check('10 New-day first session returns to strongest gain',cc2['prep']-prep_before==10,(prep_before,cc2['prep']))

    # Old/legacy contest with no prepDaily remains valid; no migration prerequisite.
    cur=await state(p); today=cur['clock']['dateISO']; event=(date.fromisoformat(today)+timedelta(days=5)).isoformat()
    await p.evaluate("([today,event])=>__LIFE_SIM_TEST__.mutate(`S.school.contests.push({id:'h33legacy',name:'Legacy Contest',status:'Registered',eventDate:'${event}',decisionDate:'${today}',prep:20})`)",[today,event])
    await call(p,'contestAction','h33legacy','practice')
    sl=await state(p); lc=next(x for x in sl['school']['contests'] if x['id']=='h33legacy')
    check('11 Legacy contest without H3.3 fields initializes safely',lc['prep']==30 and lc.get('prepDaily',{}).get('count')==1,lc)
    check('12 H3.3 runtime has no page errors',not p.errs,p.errs)

    await p.close(); await b.close()

  failed=[x for x in R if not x[1]]
  print(f'H3.3 focused: {len(R)-len(failed)}/{len(R)} passed')
  raise SystemExit(1 if failed else 0)

asyncio.run(main())
