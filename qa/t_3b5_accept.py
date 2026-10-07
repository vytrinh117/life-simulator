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
async def call(p,n,*a): return await p.evaluate("([n,a])=>__LIFE_SIM_TEST__.call(n,...a)",[n,list(a)])
async def st(p): return await p.evaluate('__LIFE_SIM_TEST__.getState()')
async def main():
  async with async_playwright() as pw:
    b=await pw.chromium.launch(executable_path=CHROME,args=['--no-sandbox']); p=await page(b)
    await p.fill('#c-name','P3B5Accept'); await p.fill('#c-dob','2008-03-10'); await p.evaluate("()=>{document.getElementById('c-place').value='New York City, USA';document.getElementById('c-attraction').value='All genders'}"); await p.click('#begin'); await p.evaluate('__LIFE_SIM_TEST__.setAge(16)')
    s=await st(p); f=next(x for x in s['people'] if x.get('role')=='friend' and x.get('npcId')); fid=f['id']
    await p.evaluate("id=>__LIFE_SIM_TEST__.mutate(`const p=S.people.find(x=>x.id==='${id}');p.rel=95;p.trust=95;p.respect=80;p.reliability=85;p.conflict=0;p.metDate='2020-01-01';p.history=[{dateISO:S.clock.dateISO,age:S.age,text:'Shared day',importance:2},{dateISO:S.clock.dateISO,age:S.age,text:'Shared day 2',importance:2},{dateISO:S.clock.dateISO,age:S.age,text:'Shared day 3',importance:2},{dateISO:S.clock.dateISO,age:S.age,text:'Shared day 4',importance:2},{dateISO:S.clock.dateISO,age:S.age,text:'Shared day 5',importance:2},{dateISO:S.clock.dateISO,age:S.age,text:'Shared day 6',importance:2},{dateISO:S.clock.dateISO,age:S.age,text:'Shared day 7',importance:2}];p.milestones=[{type:'moment',dateISO:S.clock.dateISO,age:S.age,label:'Shared memory'}];p.matchmakingNextDate=null;S.romance.partnerId=null;S.romance.partner=null;S.romance.matchmaking.nextNpcOfferDate=null;S.romance.matchmaking.offers=[]`)",fid)
    await p.evaluate('Math.random=()=>0')
    ok=await call(p,'romanceNpcMatchmakingInitiative3B4'); s1=await st(p); pending=[o for o in s1['romance']['matchmaking']['offers'] if o['status']=='Pending']; ev=[e for e in s1['events'] if e.get('type')=='matchmakingOffer' and e.get('status')=='Open']
    check('1 Phase 3B acceptance: NPC can proactively offer matchmaking',ok is True and bool(pending) and bool(ev),(ok,pending,ev))
    if pending:
        info=await call(p,'matchCandidateInfo3B4',pending[0]['id']); check('2 Phase 3B acceptance: NPC-offered candidate is compatibility-validated and knowledge-safe',info and str(info.get('compatibility','')).startswith('Compatible') and info.get('orientation') in ['Unknown','All genders','Men','Women','Not sure yet'],info)
        before=(pending[0]['id'],pending[0]['candidateId']); state=await st(p); await p.evaluate('s=>__LIFE_SIM_TEST__.loadState(s)',state); await call(p,'migrateRomance3B4'); await call(p,'migrateRomance3B4'); s2=await st(p); hit=next((o for o in s2['romance']['matchmaking']['offers'] if o['id']==before[0]),None); check('3 Phase 3B acceptance: matchmaking offer survives save/load + repeated migration without duplication',hit is not None and hit['candidateId']==before[1] and sum(1 for o in s2['romance']['matchmaking']['offers'] if o['id']==before[0])==1,hit)
    await p.evaluate("id=>__LIFE_SIM_TEST__.mutate(`S.romance.partnerId='${id}';S.romance.partner=S.people.find(x=>x.id==='${id}').fullName;S.romance.matchmaking.nextNpcOfferDate=null`)",fid); blocked=await call(p,'romanceNpcMatchmakingInitiative3B4'); check('4 Phase 3B acceptance: official partner blocks NPC blind-date offers',blocked is False,blocked)
    check('Phase 3B acceptance supplement: no browser JS errors',not p.errs,p.errs); await b.close()
  bad=[x for x in R if not x[1]]; print(f'3B.5 acceptance supplement: {len(R)-len(bad)}/{len(R)} passed'); raise SystemExit(1 if bad else 0)
asyncio.run(main())
