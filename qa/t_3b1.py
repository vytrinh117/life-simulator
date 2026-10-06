import asyncio
from pathlib import Path
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
async def new_life(p,dob='2008-03-10'):
    await p.fill('#c-name','P3BTest'); await p.fill('#c-dob',dob); await p.evaluate("()=>{document.getElementById('c-place').value='New York City, USA'}"); await p.click('#begin')
async def call(p,n,*a): return await p.evaluate("([n,a])=>__LIFE_SIM_TEST__.call(n,...a)",[n,list(a)])
async def st(p): return await p.evaluate('__LIFE_SIM_TEST__.getState()')
async def main():
  async with async_playwright() as pw:
    b=await pw.chromium.launch(executable_path=CHROME,args=['--no-sandbox'])
    p=await page(b); await new_life(p); await p.evaluate('__LIFE_SIM_TEST__.setAge(16)')
    s=await st(p); f=next(x for x in s['people'] if x.get('role')=='friend')
    await p.evaluate("id=>__LIFE_SIM_TEST__.mutate(`const p=S.people.find(x=>x.id==='${id}');p.age=16;p.romanceInit=false;p.romanceStage='crush';p.love=null;p.attraction=95;p.rel=80;p.trust=75;p.conflict=0;const n=S.npcs.find(x=>x.id===p.npcId);if(n){n.birthYear=new Date(S.clock.dateISO).getUTCFullYear()-16;n.orientation='All genders'}`)",f['id'])
    L=await call(p,'ensureLove',f['id'])
    check('1 legacy crush migrates as one-sided player crush',L['stage']=='crushOne' and L['playerCrush'] and not L['mutual'] and L['npcInterest']=='unknown',L)
    check('2 high attraction alone does not create mutual romance',L['npcAttraction']>=90 and L['stage']!='crushMutual',L)
    await call(p,'setNpcRomanticInterest',f['id'],'reciprocates'); L=await call(p,'ensureLove',f['id'])
    check('3 explicit NPC reciprocity can create mutual attraction',L['mutual'] and L['stage']=='crushMutual',L)
    await p.evaluate("id=>__LIFE_SIM_TEST__.mutate(`const p=S.people.find(x=>x.id==='${id}');const n=S.npcs.find(x=>x.id===p.npcId);if(n)n.orientation='Not interested in romance';p.loveKnown=false;p.orientationMismatch=false;p.romanceInit=false`)",f['id'])
    await call(p,'ensureRomanceProfile',f['id']); c=await call(p,'romanceCompatibility',f['id']); s2=await st(p); pf=next(x for x in s2['people'] if x['id']==f['id'])
    check('4 orientation compatibility blocks romance',not c['orientationOK'] and not c['eligible'] and pf.get('orientationMismatch') is True,c)
    check('5 orientation mismatch does not destroy friendship',pf.get('rel',0)>=80 and pf.get('trust',0)>=75,(pf.get('rel'),pf.get('trust')))
    # profile knowledge: unknown until Phase 3A knowledge hooks allow it
    await p.evaluate("id=>__LIFE_SIM_TEST__.mutate(`const p=S.people.find(x=>x.id==='${id}');p.rel=30;p.trust=30;p.relStatusKnown=false`)",f['id'])
    known=await call(p,'romanceKnownAvailability',f['id']); check('6 romantic availability knowledge can remain Unknown',known=='Unknown',known)
    await p.evaluate("id=>__LIFE_SIM_TEST__.mutate(`const p=S.people.find(x=>x.id==='${id}');p.relStatusKnown=true`)",f['id'])
    known2=await call(p,'romanceKnownAvailability',f['id']); check('7 known availability reveals actual status',known2!='Unknown',known2)
    # established partner survives migration and gets reciprocal canonical state
    await p.evaluate("id=>__LIFE_SIM_TEST__.mutate(`const p=S.people.find(x=>x.id==='${id}');S.romance.partnerId=p.id;S.romance.partner=p.fullName||p.name;S.romance.status='In a relationship';p.romanceStage='partner';p.love=null;p.orientationMismatch=false;const n=S.npcs.find(x=>x.id===p.npcId);if(n)n.orientation='All genders'`)",f['id'])
    await call(p,'migrateRomance3B1'); Lp=await call(p,'ensureLove',f['id']); desc=await call(p,'relationshipDescriptor',f['id'])
    check('8 existing partner preserved by migration',Lp['stage'] in ('official','inLove','superInLove','serious','livingTogether','engaged','married','family') and Lp['mutual'],Lp)
    check('9 profile descriptor prioritizes romantic partner',desc in ('Boyfriend','Girlfriend','Partner','Spouse','Fiancé/Fiancée'),desc)
    # idempotence / no duplicate milestones
    before=await st(p); m0=len(next(x for x in before['people'] if x['id']==f['id']).get('milestones',[]))
    await call(p,'migrateRomance3B1'); await call(p,'migrateRomance3B1'); after=await st(p); pp=next(x for x in after['people'] if x['id']==f['id']); m1=len(pp.get('milestones',[]))
    check('10 migration is idempotent for romance history/milestones',m1==m0,(m0,m1))
    # age gating remains
    await p.evaluate('__LIFE_SIM_TEST__.setAge(10)'); elig=await call(p,'eligibleRomance',f['id']); check('11 under-teen romance remains gated',elig is False,elig)
    # friendship state remains independent of canonical love
    await p.evaluate('__LIFE_SIM_TEST__.setAge(16)'); before_tier=await call(p,'friendTier',f['id']); await call(p,'setLoveStage',f['id'],'official'); after_tier=await call(p,'friendTier',f['id']); L3=await call(p,'ensureLove',f['id']); check('12 friendship tier remains separate from romance state',before_tier==after_tier and L3['stage']=='official',(before_tier,after_tier,L3['stage']))
    check('3B.1 runtime has no page errors',not p.errs,p.errs)
    await p.close(); await b.close()
  failed=[x for x in R if not x[1]]; print(f'3B.1 focused: {len(R)-len(failed)}/{len(R)} passed'); raise SystemExit(1 if failed else 0)
asyncio.run(main())
