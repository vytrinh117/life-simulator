import asyncio
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
    await p.fill('#c-name','H32Test')
    await p.fill('#c-dob','2011-03-10')
    await p.evaluate("()=>{const x=document.getElementById('c-place');if(!x.value)x.value='New York City, USA'}")
    await p.click('#begin')
    await p.evaluate('__LIFE_SIM_TEST__.setAge(15)')

async def state(p):
    return await p.evaluate('__LIFE_SIM_TEST__.getState()')

async def call(p,name,*args):
    return await p.evaluate("([n,a])=>__LIFE_SIM_TEST__.call(n,...a)",[name,list(args)])

async def add_peer(p,pid,name):
    await p.evaluate("([id,n])=>__LIFE_SIM_TEST__.mutate(`S.people.push({id:'${id}',name:'${n}',firstName:'${n.split(' ')[0]}',fullName:'${n}',role:'friend',relation:'friend',age:15,gender:'Female',orientation:'Not interested in romance',rel:60,trust:60,fun:55,respect:55,reliability:55,conflict:0,history:[],romanceInit:true,romanceOpen:true,romanceStage:'crush',orientationMismatch:false,attraction:70,boundaries:[]})`)",[pid,name])

async def main():
  async with async_playwright() as pw:
    b=await pw.chromium.launch(executable_path=CHROME,args=['--no-sandbox'])
    p=await page(b); await new_life(p)
    await add_peer(p,'romH32','Taylor Reed')
    eligible=await call(p,'eligibleRomance','romH32')
    check('1 Existing ask-out target is romance-age-eligible',eligible is True,eligible)

    s0=await state(p); day=s0['clock']['dateISO']; start=1020
    # 3B.2 supersedes the old instant askOut roll: H3 integrity now protects the
    # concrete date proposal decision, which is where willingness is decided.
    r1=await call(p,'romanceDateResponse','romH32','cafe',day,start)
    s1=await state(p)
    recs1=[x for x in s1.get('decisionLedger',[]) if x.get('requestType')=='romanceDateAsk' and x.get('targetKey')=='romH32']
    check('2 First concrete date proposal creates central romance decision',len(recs1)==1,recs1)
    rec1=recs1[0]
    check('3 Rejection stores NPC as decisionMakerId',r1['kind']=='no' and rec1.get('outcome')=='No' and rec1.get('decisionMakerId')=='romH32',(r1,rec1))
    ledger_n=len(s1.get('decisionLedger',[]))

    r2=await call(p,'romanceDateResponse','romH32','cafe',day,start)
    s2=await state(p)
    recs2=[x for x in s2.get('decisionLedger',[]) if x.get('requestType')=='romanceDateAsk' and x.get('targetKey')=='romH32']
    check('4 Immediate same proposal does not reroll',r2['kind']=='no' and r2['why']==r1['why'] and len(recs2)==1 and len(s2['decisionLedger'])==ledger_n and recs2[0]['id']==rec1['id'],recs2)
    check('5 Replay keeps the exact decision maker identity',recs2[0].get('decisionMakerId')=='romH32',recs2[0])

    saved=s2
    await p.evaluate('s=>__LIFE_SIM_TEST__.loadState(s)',saved)
    r3=await call(p,'romanceDateResponse','romH32','cafe',day,start)
    s3=await state(p)
    recs3=[x for x in s3.get('decisionLedger',[]) if x.get('requestType')=='romanceDateAsk' and x.get('targetKey')=='romH32']
    check('6 Save/reload preserves romance ask integrity',r3['kind']=='no' and len(recs3)==1 and recs3[0]['id']==rec1['id'] and recs3[0]['decisionMakerId']=='romH32',recs3)

    # The rejected proposal uses a 10-day reconsideration window unless a stronger
    # boundary requires longer. Expiry is a legitimate future context change.
    await p.evaluate('__LIFE_SIM_TEST__.advanceDays(11,true)')
    r4=await call(p,'romanceDateResponse','romH32','cafe',day,start)
    s4=await state(p)
    recs4=[x for x in s4.get('decisionLedger',[]) if x.get('requestType')=='romanceDateAsk' and x.get('targetKey')=='romH32']
    check('7 Cooldown expiry allows legitimate reconsideration',len(recs4)==2 and recs4[-1]['id']!=rec1['id'],[(x['id'],x.get('reconsiderAfter')) for x in recs4])

    await add_peer(p,'romH32b','Jordan Lee')
    r5=await call(p,'romanceDateResponse','romH32b','cafe',day,start)
    s5=await state(p)
    other=[x for x in s5.get('decisionLedger',[]) if x.get('requestType')=='romanceDateAsk' and x.get('targetKey')=='romH32b']
    check('8 Different NPC gets a separate decision identity',r5['kind']=='no' and len(other)==1 and other[0].get('decisionMakerId')=='romH32b',other)

    check('9 H3 ledger remains canonical for 3B.2 romance willingness',all(x.get('requestType')!='romanceAsk' for x in s5.get('decisionLedger',[])),[x.get('requestType') for x in s5.get('decisionLedger',[])])
    check('H3.2 runtime has no page errors',not p.errs,p.errs)
    await p.close(); await b.close()

  failed=[x for x in R if not x[1]]
  print(f'H3.2 regression: {len(R)-len(failed)}/{len(R)} passed')
  raise SystemExit(1 if failed else 0)

asyncio.run(main())
