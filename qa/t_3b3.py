import asyncio
from pathlib import Path
from datetime import date, timedelta
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
    await p.fill('#c-name','P3B3Test'); await p.fill('#c-dob','2008-03-10'); await p.evaluate("()=>{document.getElementById('c-place').value='New York City, USA'}"); await p.click('#begin'); await p.evaluate('__LIFE_SIM_TEST__.setAge(16)')
async def call(p,n,*a): return await p.evaluate("([n,a])=>__LIFE_SIM_TEST__.call(n,...a)",[n,list(a)])
async def st(p): return await p.evaluate('__LIFE_SIM_TEST__.getState()')
async def prep(p,pid,stage='goingOut',official=False):
    s=await st(p); d=s['clock']['dateISO']; since=add_iso(d,-40); d1=add_iso(d,-20); d2=add_iso(d,-10); d3=add_iso(d,-3)
    code=f"""S.npcCouples=[];const p=S.people.find(x=>x.id==='{pid}');p.age=S.age;p.rel=92;p.trust=90;p.conflict=0;p.romanceOpen=true;p.boundaries=[];p.attraction=94;p.romanceInit=false;p.datingNpc=null;p.love={{stage:'{stage}',progress:70,since:'{since}',playerCrush:true,npcAttraction:94,npcInterest:'reciprocates',mutual:true,dateHistory:[{{dateISO:'{d1}',activityId:'cafe',outcome:'Good date'}},{{dateISO:'{d2}',activityId:'walk',outcome:'Great date'}},{{dateISO:'{d3}',activityId:'movie',outcome:'Good date'}}],inviteHistory:[],interactionDays:{{}},commitmentHistory:[]}};p.romanceStage='{stage}'==='goingOut'?'dating':'partner';const n=S.npcs.find(x=>x.id===p.npcId);if(n){{n.birthYear=new Date(S.clock.dateISO).getUTCFullYear()-S.age;n.orientation='All genders'}};S.romance.partnerId={'p.id' if official else 'null'};S.romance.partner={"p.fullName||p.name" if official else 'null'};S.romance.status={'\'In a relationship\'' if official else '\'Single\''};S.romance.relationshipStartDate={'\''+since+'\'' if official else 'null'};if({str(official).lower()}){{p.love.stage='official';p.romanceStage='partner';p.love.relationshipStartDate='{since}'}}"""
    await p.evaluate("code=>__LIFE_SIM_TEST__.mutate(code)",code); await call(p,'migrateRomance3B3')
async def main():
  async with async_playwright() as pw:
    b=await pw.chromium.launch(executable_path=CHROME,args=['--no-sandbox']); p=await make_page(b); await new_life(p)
    s=await st(p); f=next(x for x in s['people'] if x.get('role')=='friend'); pid=f['id']
    await prep(p,pid,'goingOut',False)
    await call(p,'romanceMenu',pid); html=await p.locator('#choice-overlay .modal').inner_text()
    check('1 teen menu exposes contextual affection',all(x in html for x in ['Hold hands','Hug','Cheek kiss','First kiss','Plan a date']),html)
    check('2 teen menu excludes adult intimacy','Private intimate evening' not in html,html)
    await p.evaluate('Math.random=()=>0.5')
    ok=await call(p,'romanceAffection3B3',pid,'firstKiss'); sf=await st(p); pf=next(x for x in sf['people'] if x['id']==pid); n1=sum(1 for x in sf.get('decisionLedger',[]) if x.get('requestType')=='romanceAffection' and x.get('targetKey')==pid+':firstKiss')
    check('3 first kiss creates one milestone',ok is True and sum(1 for m in pf.get('milestones',[]) if m.get('type')=='firstKiss')==1,pf.get('milestones',[]))
    # A first-only action is intentionally blocked after its milestone, so use repeatable Kiss
    # to verify H3 request reuse and anti-farming independently of the first-kiss gate.
    prog0=pf['love']['progress']; first_kiss_repeat=await call(p,'romanceAffection3B3',pid,'kiss'); sk1=await st(p); progk1=next(x for x in sk1['people'] if x['id']==pid)['love']['progress']; nk1=sum(1 for x in sk1.get('decisionLedger',[]) if x.get('requestType')=='romanceAffection' and x.get('targetKey')==pid+':kiss')
    replay=await call(p,'romanceAffectionResponse3B3',pid,'kiss'); again=await call(p,'romanceAffection3B3',pid,'kiss'); sf2=await st(p); nk2=sum(1 for x in sf2.get('decisionLedger',[]) if x.get('requestType')=='romanceAffection' and x.get('targetKey')==pid+':kiss'); prog1=next(x for x in sf2['people'] if x['id']==pid)['love']['progress']
    check('4 same affection request reuses H3 decision',first_kiss_repeat is True and replay.get('reused') is True and nk1==nk2==1,(replay,nk1,nk2))
    check('5 repeated click does not farm progress',again is True and progk1>=prog0 and prog1==progk1,(prog0,progk1,prog1))
    await call(p,'romanceMenu',pid); html2=await p.locator('#choice-overlay .modal').inner_text(); check('6 First Kiss is not repeat-special after milestone','First kiss' not in html2 and 'Kiss' in html2,html2)
    d=sf2['clock']['dateISO']; await p.evaluate("([id,d])=>__LIFE_SIM_TEST__.mutate(`S.clock.dateISO='${d}';const p=S.people.find(x=>x.id==='${id}');p.conflict=70`)",[pid,add_iso(d,2)])
    no=await call(p,'romanceAffectionResponse3B3',pid,'kiss'); check('7 previous success is not permanent consent',no['kind']=='no',no)
    await p.evaluate("id=>__LIFE_SIM_TEST__.mutate(`const p=S.people.find(x=>x.id==='${id}');p.conflict=0;p.rel=94;p.trust=94;p.love.progress=80`)",pid)
    elig=await call(p,'officialEligibility3B3',pid); check('8 official readiness uses mutual/history/trust',elig['ready'] is True,elig)
    off=await call(p,'romanceOfficialConversation3B3',pid,'player'); so=await st(p); po=next(x for x in so['people'] if x['id']==pid)
    check('9 mutual decision can become official',off is True and so['romance']['partnerId']==pid and po['love']['stage']=='official',(so['romance'],po['love']))
    check('10 canonical relationship start date preserved',bool(po['love'].get('relationshipStartDate')) and po['love']['relationshipStartDate']==so['romance'].get('relationshipStartDate'),(po['love'].get('relationshipStartDate'),so['romance'].get('relationshipStartDate')))
    desc=await call(p,'relationshipDescriptor',pid); check('11 People descriptor prioritizes partner',desc in ['Boyfriend','Girlfriend','Partner'],desc)
    await p.evaluate("id=>__LIFE_SIM_TEST__.mutate(`const p=S.people.find(x=>x.id==='${id}');p.conflict=30;p.love.interactionDays={}`)",pid)
    sb0=await st(p); c0=next(x for x in sb0['people'] if x['id']==pid)['conflict']; a=await call(p,'romancePartnerInteraction3B3',pid,'resolve'); b2=await call(p,'romancePartnerInteraction3B3',pid,'resolve'); sb1=await st(p); c1=next(x for x in sb1['people'] if x['id']==pid)['conflict']; check('12 partner conflict repair is useful but anti-farmed',a is True and b2 is False and c1<c0,(a,b2,c0,c1))
    tier0=await call(p,'friendshipTier',pid); start=next(x for x in sb1['people'] if x['id']==pid)['love']['relationshipStartDate']; await call(p,'endRelationship3B3',pid,'different goals',{'byNpc':False}); sx=await st(p); px=next((x for x in sx['people'] if x['id']==pid),None); tier1=await call(p,'friendshipTier',pid); exdesc=await call(p,'relationshipDescriptor',pid)
    check('13 breakup preserves Person and friendship state',px is not None and tier0==tier1,(tier0,tier1))
    check('14 ex preserves start/end dates and history',px['love']['stage']=='ex' and px.get('formerPartner') and px['love'].get('relationshipStartDate')==start and bool(px['love'].get('relationshipEndDate')) and any(h.get('personId')==pid and h.get('startDate')==start for h in sx['romance'].get('history',[])),(px['love'],sx['romance'].get('history',[])))
    check('15 profile descriptor reflects Ex',exdesc=='Ex',exdesc)
    early=await call(p,'reconcileEligibility3B3',pid); check('16 reconciliation is not immediate',early['ready'] is False,early)
    end=px['love']['relationshipEndDate']; d35=add_iso(end,35); await p.evaluate("([id,d])=>__LIFE_SIM_TEST__.mutate(`S.clock.dateISO='${d}';const p=S.people.find(x=>x.id==='${id}');p.rel=90;p.trust=90;p.conflict=5`)",[pid,d35]); await p.evaluate('Math.random=()=>0.5')
    re=await call(p,'reconcileRequest3B3',pid); sr=await st(p); pr=next(x for x in sr['people'] if x['id']==pid); check('17 later changed context can reconcile slowly',re is True and pr['love']['stage']=='goingOut' and pr.get('formerPartner') is True and any(m.get('type')=='reconciled' for m in pr.get('milestones',[])),pr['love'])
    await prep(p,pid,'goingOut',False); await p.evaluate('Math.random=()=>0')
    ini=await call(p,'romanceNpcRelationshipInitiative3B3'); sn=await st(p); ev=next((e for e in sn.get('events',[]) if e.get('type')=='romanceOfficialInvite'),None); check('18 NPC can initiate official conversation',ini is True and ev is not None,ev)
    if ev:
        handled=await call(p,'romance3B3EventChoice',ev,'accept'); ss=await st(p); pp=next(x for x in ss['people'] if x['id']==pid); check('19 accepting NPC proposal stores official date',handled is True and ss['romance']['partnerId']==pid and bool(pp['love'].get('relationshipStartDate')),(ss['romance'],pp['love']))
    # contextual older-teen sneaking
    await p.evaluate("id=>__LIFE_SIM_TEST__.mutate(`S.age=16;const p=S.people.find(x=>x.id==='${id}');p.age=16;S.location='Home';S.clock.minute=900;p.love.stage='official';S.romance.partnerId=p.id`)",pid); noon=await call(p,'romanceSneakOption3B3',pid,'over'); await p.evaluate("()=>__LIFE_SIM_TEST__.mutate(`S.clock.minute=1385`)"); late=await call(p,'romanceSneakOption3B3',pid,'over'); check('20 older-teen sneak option is late/home contextual',noon is False and late is True,(noon,late))
    # adult consent / fade to black
    await p.evaluate("id=>__LIFE_SIM_TEST__.mutate(`S.age=19;const p=S.people.find(x=>x.id==='${id}');p.age=19;const n=S.npcs.find(x=>x.id===p.npcId);if(n)n.birthYear=new Date(S.clock.dateISO).getUTCFullYear()-19;p.rel=95;p.trust=95;p.conflict=0;p.love.stage='official';p.love.mutual=true;p.love.npcInterest='reciprocates';S.romance.partnerId=p.id`)",pid); await p.evaluate('Math.random=()=>0.5'); ai=await call(p,'adultIntimacy3B3',pid); sa=await st(p); recs=[x for x in sa.get('decisionLedger',[]) if x.get('requestType')=='romanceAdultIntimacy' and x.get('targetKey')==pid]; check('21 adult intimacy is consent-based and fade-to-black',ai is True and len(recs)==1 and 'fade to black' in recs[0].get('reason','').lower(),recs)
    mm0=len(next(x for x in sa['people'] if x['id']==pid).get('milestones',[])); await call(p,'migrateRomance3B3'); await call(p,'migrateRomance3B3'); sm=await st(p); mm1=len(next(x for x in sm['people'] if x['id']==pid).get('milestones',[])); check('22 3B.3 migration is idempotent',mm0==mm1,(mm0,mm1))
    check('3B.3 runtime has no page errors',not p.errs,p.errs)
    await p.close(); await b.close()
  failed=[x for x in R if not x[1]]; print(f'3B.3 focused: {len(R)-len(failed)}/{len(R)} passed'); raise SystemExit(1 if failed else 0)
asyncio.run(main())
