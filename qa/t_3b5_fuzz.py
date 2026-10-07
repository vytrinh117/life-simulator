import asyncio, json
from pathlib import Path
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parents[1]; CHROME='/usr/bin/chromium'; R=[]
def check(name,ok,detail=''):
    R.append((name,bool(ok),detail)); print(('PASS ' if ok else 'FAIL ')+name+((' — '+str(detail)) if detail and not ok else ''))
async def make_page(b):
    p=await b.new_page(viewport={'width':1280,'height':900}); p.errs=[]; p.on('pageerror',lambda e:p.errs.append(str(e)))
    html=(ROOT/'index.html').read_text().replace('<script src="data.js"></script><script src="game.js"></script>','')
    await p.set_content(html,wait_until='load')
    await p.evaluate("""()=>{const mk=()=>{const m=new Map();return {getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(String(k),String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear(),key:i=>[...m.keys()][i]||null,get length(){return m.size}}};Object.defineProperty(window,'localStorage',{value:mk(),configurable:true});Object.defineProperty(window,'sessionStorage',{value:mk(),configurable:true})}""")
    await p.add_script_tag(content=(ROOT/'data.js').read_text()); await p.add_script_tag(content=(ROOT/'game.js').read_text()); return p
async def life(p,age):
    await p.fill('#c-name',f'Fuzz{age}'); await p.fill('#c-dob','2008-03-10'); await p.evaluate("()=>{document.getElementById('c-place').value='New York City, USA';document.getElementById('c-attraction').value='All genders'}"); await p.click('#begin'); await p.evaluate('__LIFE_SIM_TEST__.setAge(%d)'%age)
    await p.evaluate("""age=>__LIFE_SIM_TEST__.mutate(`S.people.filter(p=>p.role==='friend').slice(0,8).forEach((p,i)=>{p.age=${age};p.rel=55+(i%4)*10;p.trust=50+(i%3)*12;p.conflict=i%5===0?20:0;p.romanceOpen=true;p.boundaries=[];p.romanceInit=false;p.love=null;p.romanceStage=i%3===0?'crush':'none';p.attraction=55+(i%4)*10;const n=S.npcs.find(x=>x.id===p.npcId);if(n){n.birthYear=new Date(S.clock.dateISO).getUTCFullYear()-${age};n.orientation='All genders'}})` )""",age)
async def main():
  async with async_playwright() as pw:
    b=await pw.chromium.launch(executable_path=CHROME,args=['--no-sandbox'])
    total=0
    for age,label in [(14,'teen'),(17,'older teen'),(25,'adult')]:
      p=await make_page(b); await life(p,age)
      result=await p.evaluate("""([age,steps])=>{const T=window.__LIFE_SIM_TEST__;let seed=age*7919+17;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};const errs=[];const ops={};
        const people=()=>T.getState().people.filter(p=>p.role==='friend'&&p.npcId).slice(0,8);
        const doCall=(n,...a)=>{ops[n]=(ops[n]||0)+1;try{return T.call(n,...a)}catch(e){errs.push(n+': '+e.message);return null}};
        for(let i=0;i<steps;i++){const ps=people();if(!ps.length)break;const q=ps[Math.floor(rnd()*ps.length)],id=q.id,k=Math.floor(rnd()*16);
          if(k===0)doCall('ensureLove',id); else if(k===1)doCall('romanceCompatibility',id); else if(k===2)doCall('migrateRomance3B1'); else if(k===3)doCall('migrateRomance3B2'); else if(k===4)doCall('migrateRomance3B3'); else if(k===5)doCall('migrateRomance3B4'); else if(k===6)doCall('setNpcRomanticInterest',id,rnd()<.55?'reciprocates':'unknown'); else if(k===7)doCall('relationshipDescriptor',id); else if(k===8)doCall('romanceKnownAvailability',id); else if(k===9)doCall('romanceProspects3B4'); else if(k===10)doCall('candidatePersonEligible3B4',id); else if(k===11)doCall('romanceAffectionResponse3B3',id,'hug'); else if(k===12)doCall('createNpcDateInvitation3B2',id,{}); else if(k===13)doCall('romanceNpcRelationshipInitiative3B3'); else if(k===14)doCall('romanceNpcMatchmakingInitiative3B4'); else {const m=ps.find(x=>{try{return T.call('matchmakerEligible3B4',x.id)}catch(e){return false}});if(m)doCall('createMatchOffer3B4',m.id,'player')}
        }
        const S=T.getState(),bad=[];const uniq=(xs,key)=>new Set(xs.map(x=>x&&x[key]).filter(Boolean)).size===xs.map(x=>x&&x[key]).filter(Boolean).length;
        if(!uniq(S.people||[],'id'))bad.push('duplicate person id');if(!uniq(S.decisionLedger||[],'id'))bad.push('duplicate decision id');if(!uniq(S.plans||[],'id'))bad.push('duplicate plan id');const offers=S.romance&&S.romance.matchmaking&&S.romance.matchmaking.offers||[];if(!uniq(offers,'id'))bad.push('duplicate match offer id');
        if(S.romance&&S.romance.partnerId&&!S.people.some(p=>p.id===S.romance.partnerId))bad.push('partner missing from People');const stages=new Set(['noticing','crushOne','crushMutual','goingOut','official','inLove','superInLove','serious','livingTogether','engaged','married','family','ex']);for(const p of S.people||[])if(p.love&&!stages.has(p.love.stage))bad.push('bad love stage '+p.love.stage);
        if(age<18){for(const p of S.people||[])if(p.love&&['livingTogether','engaged','married','family'].includes(p.love.stage))bad.push('minor adult love stage')}
        const prospects=T.call('romanceProspects3B4')||[];for(const id of prospects){const p=S.people.find(x=>x.id===id);if(p&&['mother','father','parent','sibling','child','grandparent','aunt','uncle','relative'].includes(p.relation||p.role))bad.push('family romance prospect')}
        return {errs,bad,ops,state:S};}""",[age,200])
      total+=200
      check(f'3B.5 fuzz {label}: 200 randomized operations complete',not result['errs'],result['errs'][:5])
      check(f'3B.5 fuzz {label}: canonical invariants hold',not result['bad'],result['bad'][:8])
      before=result['state']; key_before=(len(before.get('people',[])),len(before.get('decisionLedger',[])),len(before.get('plans',[])),len(before.get('romance',{}).get('matchmaking',{}).get('offers',[])),before.get('romance',{}).get('partnerId'))
      await p.evaluate('s=>__LIFE_SIM_TEST__.loadState(s)',before)
      for fn in ['migrateRomance3B1','migrateRomance3B2','migrateRomance3B3','migrateRomance3B4','migrateRomance3B4']:
          await p.evaluate("n=>__LIFE_SIM_TEST__.call(n)",fn)
      after=await p.evaluate('__LIFE_SIM_TEST__.getState()'); key_after=(len(after.get('people',[])),len(after.get('decisionLedger',[])),len(after.get('plans',[])),len(after.get('romance',{}).get('matchmaking',{}).get('offers',[])),after.get('romance',{}).get('partnerId'))
      check(f'3B.5 fuzz {label}: save/load + repeated migration is idempotent',key_before==key_after,(key_before,key_after))
      check(f'3B.5 fuzz {label}: no browser JS errors',not p.errs,p.errs[:4]); await p.close()
    check('3B.5 required fuzz covered teen + older teen + adult',total==600,total)
    await b.close()
  failed=[x for x in R if not x[1]]; print(f'3B.5 fuzz: {len(R)-len(failed)}/{len(R)} passed'); raise SystemExit(1 if failed else 0)
asyncio.run(main())
