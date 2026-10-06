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

async def main():
  async with async_playwright() as pw:
    b=await pw.chromium.launch(executable_path=CHROME,args=['--no-sandbox'])
    p=await page(b); await new_life(p)

    # Deterministic eligible peer who will reject: no RNG can turn this first answer into yes.
    await p.evaluate("""__LIFE_SIM_TEST__.mutate(`S.people.push({id:'romH32',name:'Taylor Reed',firstName:'Taylor',fullName:'Taylor Reed',role:'friend',relation:'friend',age:15,gender:'Female',orientation:'All genders',rel:60,trust:60,fun:55,respect:55,reliability:55,conflict:0,history:[],romanceInit:true,romanceOpen:false,romanceStage:'none',orientationMismatch:false,attraction:70,boundaries:[]})`)""")
    eligible=await call(p,'eligibleRomance','romH32')
    check('1 Existing ask-out target is romance-eligible',eligible is True,eligible)

    await call(p,'romanceAction','romH32','askOut')
    s1=await state(p)
    recs1=[x for x in s1.get('decisionLedger',[]) if x.get('requestType')=='romanceAsk' and x.get('targetKey')=='romH32']
    peer1=next(x for x in s1['people'] if x['id']=='romH32')
    check('2 First existing ask creates central romance decision',len(recs1)==1,recs1)
    rec1=recs1[0]
    check('3 Rejection stores NPC as decisionMakerId',rec1.get('outcome')=='No' and rec1.get('decisionMakerId')=='romH32',rec1)
    asks1=peer1.get('romanceAsks',0); rel1=peer1.get('rel'); ledger_n=len(s1.get('decisionLedger',[]))

    # Immediate repeat must replay memory: no second record and no repeat relationship penalty / ask count.
    await call(p,'romanceAction','romH32','askOut')
    s2=await state(p)
    recs2=[x for x in s2.get('decisionLedger',[]) if x.get('requestType')=='romanceAsk' and x.get('targetKey')=='romH32']
    peer2=next(x for x in s2['people'] if x['id']=='romH32')
    check('4 Immediate same proposal does not reroll',len(recs2)==1 and len(s2['decisionLedger'])==ledger_n and recs2[0]['id']==rec1['id'] and recs2[0]['outcome']=='No',recs2)
    check('5 Replay does not count as a fresh romance ask',peer2.get('romanceAsks',0)==asks1,(asks1,peer2.get('romanceAsks',0)))
    check('6 Replay does not stack rejection relationship penalty',peer2.get('rel')==rel1,(rel1,peer2.get('rel')))

    # Save/reload keeps the exact decision and still blocks reroll.
    saved=s2
    await p.evaluate('s=>__LIFE_SIM_TEST__.loadState(s)',saved)
    await call(p,'romanceAction','romH32','askOut')
    s3=await state(p)
    recs3=[x for x in s3.get('decisionLedger',[]) if x.get('requestType')=='romanceAsk' and x.get('targetKey')=='romH32']
    check('7 Save/reload preserves romance ask integrity',len(recs3)==1 and recs3[0]['id']==rec1['id'] and recs3[0]['decisionMakerId']=='romH32',recs3)

    # A real cooldown expiry permits a new decision. 14 days is the closed-to-romance cooldown here.
    await p.evaluate('__LIFE_SIM_TEST__.advanceDays(15,true)')
    await call(p,'romanceAction','romH32','askOut')
    s4=await state(p)
    recs4=[x for x in s4.get('decisionLedger',[]) if x.get('requestType')=='romanceAsk' and x.get('targetKey')=='romH32']
    check('8 Cooldown expiry allows legitimate reconsideration',len(recs4)==2 and recs4[-1]['id']!=rec1['id'],[(x['id'],x.get('reconsiderAfter')) for x in recs4])

    # Decisions are isolated by NPC identity, not globally shared.
    await p.evaluate("""__LIFE_SIM_TEST__.mutate(`S.people.push({id:'romH32b',name:'Jordan Lee',firstName:'Jordan',fullName:'Jordan Lee',role:'friend',relation:'friend',age:15,gender:'Male',orientation:'All genders',rel:60,trust:60,fun:55,respect:55,reliability:55,conflict:0,history:[],romanceInit:true,romanceOpen:false,romanceStage:'none',orientationMismatch:false,attraction:70,boundaries:[]})`)""")
    await call(p,'romanceAction','romH32b','askOut')
    s5=await state(p)
    other=[x for x in s5.get('decisionLedger',[]) if x.get('requestType')=='romanceAsk' and x.get('targetKey')=='romH32b']
    check('9 Different NPC gets a separate decision identity',len(other)==1 and other[0].get('decisionMakerId')=='romH32b',other)

    # Scope guard: no Phase 3B system flags/state introduced by H3.2 test path.
    forbidden=['matchmakingQueue','blindDates','exclusiveNegotiation','datePaymentNegotiation','sneakOutRomance']
    check('10 H3.2 does not introduce Phase 3B state',all(k not in s5 for k in forbidden),[k for k in forbidden if k in s5])
    check('H3.2 runtime has no page errors',not p.errs,p.errs)

    await p.close(); await b.close()

  failed=[x for x in R if not x[1]]
  print(f'H3.2 focused: {len(R)-len(failed)}/{len(R)} passed')
  raise SystemExit(1 if failed else 0)

asyncio.run(main())
