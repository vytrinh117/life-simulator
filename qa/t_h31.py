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

async def new_life(p,dob='2011-03-10'):
    await p.fill('#c-name','H3Test')
    await p.fill('#c-dob',dob)
    await p.evaluate("()=>{const x=document.getElementById('c-place');if(!x.value)x.value='New York City, USA'}")
    await p.click('#begin')

async def state(p):
    return await p.evaluate('__LIFE_SIM_TEST__.getState()')

async def call(p,name,*args):
    return await p.evaluate("([n,a])=>__LIFE_SIM_TEST__.call(n,...a)",[name,list(args)])

async def main():
  async with async_playwright() as pw:
    b=await pw.chromium.launch(executable_path=CHROME,args=['--no-sandbox'])

    # Authority resolver: mother -> father -> actual guardian. No generic caregiver fallback.
    p=await page(b); await new_life(p)
    rel=await call(p,'decisionAuthorityRelation')
    check('1a Mother can be decision authority',rel=='mother',rel)
    await p.evaluate("__LIFE_SIM_TEST__.mutate(\"for(const x of S.people)if(x.relation==='mother')x.deceased=true\")")
    rel=await call(p,'decisionAuthorityRelation')
    check('1b Father can be decision authority',rel=='father',rel)
    await p.evaluate("__LIFE_SIM_TEST__.mutate(\"for(const x of S.people)if(x.relation==='father')x.deceased=true;S.people.push({id:'guard1',name:'Avery Guardian',firstName:'Avery',fullName:'Avery Guardian',role:'guardian',relation:'guardian',age:42,residence:'home',rel:70,trust:70,history:[]})\")")
    auth=await call(p,'decisionAuthorities')
    check('1c Actual guardian can be decision authority',auth and auth[0]=='guard1',auth)
    await p.close()

    p=await page(b); await new_life(p); await p.evaluate('__LIFE_SIM_TEST__.setAge(15)')
    await p.evaluate("__LIFE_SIM_TEST__.mutate(\"S.people.push({id:'sibH3',name:'Older Brother',firstName:'Older',fullName:'Older Brother',role:'older sibling',relation:'sibling',age:S.age+4,gender:'Male',residence:'home',rel:65,trust:60,history:[]})\")")
    carers=await call(p,'householdCaregivers')
    auth=await call(p,'decisionAuthorities')
    carer_ids=[x.get('id') for x in carers]
    check('2 Ordinary older sibling is not purchase authority','sibH3' not in auth,auth)
    check('3 Older sibling remains caregiver/support','sibH3' in carer_ids,carer_ids)

    # Actual parent purchase request: whatever rich outcome RNG gives, immediate repeat must reuse it.
    await p.evaluate("__LIFE_SIM_TEST__.requestItem('phone')")
    s1=await state(p)
    ph1=[x for x in s1.get('decisionLedger',[]) if x.get('requestType')=='parentPurchase' and x.get('targetKey')=='phone']
    check('4a Phone request creates one central decision record',len(ph1)==1,ph1)
    rec1=ph1[-1]; n1=len(s1['decisionLedger'])
    await p.evaluate("__LIFE_SIM_TEST__.requestItem('phone')")
    s2=await state(p)
    ph2=[x for x in s2['decisionLedger'] if x.get('requestType')=='parentPurchase' and x.get('targetKey')=='phone']
    rec2=ph2[-1]
    check('4 Same phone request/context/day does not reroll',len(ph2)==1 and len(s2['decisionLedger'])==n1 and rec2['outcome']==rec1['outcome'],(n1,len(s2['decisionLedger']),rec1['outcome'],rec2['outcome']))
    check('5 Same result keeps same decisionMakerId',rec2.get('decisionMakerId')==rec1.get('decisionMakerId') and bool(rec1.get('decisionMakerId')),(rec1.get('decisionMakerId'),rec2.get('decisionMakerId')))

    # Save/reload and repeated migration.
    saved=s2
    await p.evaluate("s=>__LIFE_SIM_TEST__.loadState(s)",saved)
    s3=await state(p)
    rr=[x for x in s3['decisionLedger'] if x['id']==rec1['id']]
    check('6 Save/reload preserves pending/recent decision',len(rr)==1 and rr[0]['outcome']==rec1['outcome'] and rr[0]['decisionMakerId']==rec1['decisionMakerId'],rr)
    before=len(s3['decisionLedger'])
    await p.evaluate('__LIFE_SIM_TEST__.migrate()'); await p.evaluate('__LIFE_SIM_TEST__.migrate()')
    s4=await state(p)
    check('7 Repeated migration does not duplicate decisions',len(s4['decisionLedger'])==before and len({x['id'] for x in s4['decisionLedger']})==len(s4['decisionLedger']),(before,len(s4['decisionLedger'])))

    # A genuine counter-condition makes the old decision non-reusable; clicking did not.
    chores=s4.get('choresDone',0) or 0
    r=await call(p,'recordDecision',{'id':'cond-h31','requestType':'parentPurchase','targetKey':'condition-test','outcome':'Complete chores first','requirements':{'type':'chores','target':chores+2},'resolved':False,'context':{'test':'condition'}})
    rid=r['id']
    before_reuse=await call(p,'decisionReusableById',rid)
    await p.evaluate("__LIFE_SIM_TEST__.mutate('S.choresDone=(S.choresDone||0)+2')")
    after_reuse=await call(p,'decisionReusableById',rid)
    check('8 Genuine changed condition allows reconsideration',before_reuse is True and after_reuse is False,(before_reuse,after_reuse))
    check('9 Clicking repeatedly does not count as changed condition',len(ph2)==1 and ph2[0]['id']==ph1[0]['id'],[(x['id'],x['outcome']) for x in ph2])

    # Rich semantics remain strings/data, not reduced to boolean, across migration.
    rich=['Maybe','Considering','Ask Later','Birthday','Christmas','Partial payment','Save money first','Complete chores first','Improve grades first']
    for v in rich:
        await call(p,'recordDecision',{'id':'rich-'+v,'requestType':'semantic-test','targetKey':v,'outcome':v,'reason':'keep semantic','resolved':False,'context':{'v':v}})
    await call(p,'normalizeDecisionLedger'); await p.evaluate('__LIFE_SIM_TEST__.migrate()'); await call(p,'normalizeDecisionLedger')
    s6=await state(p)
    got={x['outcome'] for x in s6['decisionLedger'] if x.get('requestType')=='semantic-test'}
    check('10 Maybe/Considering/Ask Later/etc. semantics survive',set(rich).issubset(got),sorted(got))

    allowed={'Yes','No','Considering','Birthday','Christmas','Partial payment','Improve grades first','Complete chores first'}
    current=[x for x in s6['decisionLedger'] if x.get('requestType')=='parentPurchase' and x.get('targetKey')=='phone']
    linked=True
    if current:
        pend=[x for x in s6['pendingDecisions'] if x.get('decisionId')==current[-1]['id'] and not x.get('resolved')]
        if pend: linked=all(x.get('decisionMakerId')==current[-1].get('decisionMakerId') for x in pend)
    check('11 Existing request outcomes still work',len(current)==1 and current[-1]['outcome'] in allowed and linked,(current,linked))
    check('H3.1 runtime has no page errors',not p.errs,p.errs)

    await p.close(); await b.close()

  failed=[x for x in R if not x[1]]
  print(f'H3.1 focused: {len(R)-len(failed)}/{len(R)} passed')
  raise SystemExit(1 if failed else 0)

asyncio.run(main())
