import asyncio
from pathlib import Path
from datetime import date, timedelta
from playwright.async_api import async_playwright

ROOT=Path(__file__).resolve().parents[1]
CHROME='/usr/bin/chromium'
R=[]
def check(name, ok, detail=''):
    R.append((name,bool(ok),detail)); print(('PASS ' if ok else 'FAIL ')+name+((' — '+str(detail)) if detail and not ok else ''))
async def make_page(b):
    p=await b.new_page(viewport={'width':1280,'height':900}); p.errs=[]; p.on('pageerror',lambda e:p.errs.append(str(e)))
    html=(ROOT/'index.html').read_text().replace('<script src="data.js"></script><script src="game.js"></script>','')
    await p.set_content(html,wait_until='load')
    await p.evaluate("""()=>{const mk=()=>{const m=new Map();return {getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(String(k),String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear(),key:i=>[...m.keys()][i]||null,get length(){return m.size}}};Object.defineProperty(window,'localStorage',{value:mk(),configurable:true});Object.defineProperty(window,'sessionStorage',{value:mk(),configurable:true})}""")
    await p.add_script_tag(content=(ROOT/'data.js').read_text()); await p.add_script_tag(content=(ROOT/'game.js').read_text()); return p
async def life(p,age,name='P3C5'):
    await p.fill('#c-name',name); await p.fill('#c-dob','2010-03-10'); await p.evaluate("()=>{document.getElementById('c-place').value='New York City, USA';document.getElementById('c-attraction').value='All genders'}"); await p.click('#begin'); await p.evaluate(f'__LIFE_SIM_TEST__.setAge({age})')
async def call(p,n,*a): return await p.evaluate("([n,a])=>__LIFE_SIM_TEST__.call(n,...a)",[n,list(a)])
async def st(p): return await p.evaluate('__LIFE_SIM_TEST__.getState()')

def fam(s): return [x for x in s['people'] if x.get('role') in ('parent','guardian','sibling') or x.get('relation') in ('mother','father','parent','guardian','sibling')]
def friends(s): return [x for x in s['people'] if x.get('role')=='friend']

async def main():
  async with async_playwright() as pw:
    b=await pw.chromium.launch(executable_path=CHROME,args=['--no-sandbox'])

    # Elementary child + kids smartwatch
    p=await make_page(b); await life(p,8,'WatchKid'); s=await st(p); f=fam(s); fr=friends(s)[0]
    g=await call(p,'communicationEligibility3C1',fr['id'],'message')
    check('1 no device/channel means no magical texting',not g['ok'],g)
    await p.evaluate("__LIFE_SIM_TEST__.grantItem('kidsWatch')")
    await call(p,'migrateCommunication3C1'); await call(p,'migrateCommunication3C3')
    s=await st(p); family_ids={x['id'] for x in fam(s)}; contacts=s.get('communication',{}).get('contacts',{})
    check('2 family contacts initialize legitimately on compatible device',bool(family_ids) and family_ids.issubset(set(contacts.keys())),(family_ids,list(contacts.keys())))
    check('3 non-family NPC is not auto-added merely because they exist',fr['id'] not in contacts,contacts.get(fr['id']))
    parent=next((x for x in fam(s) if x.get('relation') in ('mother','father','parent','guardian') or x.get('role') in ('parent','guardian')),None)
    if parent:
        pm=await call(p,'communicationEligibility3C1',parent['id'],'message'); pc=await call(p,'communicationEligibility3C1',parent['id'],'call'); pv=await call(p,'communicationEligibility3C1',parent['id'],'video')
        check('4 kids smartwatch supports limited family message/call but not video',pm['ok'] and pc['ok'] and not pv['ok'],(pm,pc,pv))
    loc=await call(p,'watchLocationSnapshot3C3','acceptance')
    check('5 parent/guardian location-awareness hook works on smartwatch',bool(loc and loc.get('authorityId')),loc)
    auth_ids=await call(p,'decisionAuthorities'); sib=next((x for x in fam(s) if x.get('relation')=='sibling' or x.get('role')=='sibling'),None)
    check('6 ordinary older sibling is not legal contact-approval authority',not sib or sib['id'] not in auth_ids,(sib and sib['id'],auth_ids))
    # No historical backlog should be synthesized by migration.
    before=sum(len(c.get('msgs',[])) for c in s.get('chats',{}).values()); await call(p,'migrateCommunication3C1'); await call(p,'migrateCommunication3C2'); s2=await st(p); after=sum(len(c.get('msgs',[])) for c in s2.get('chats',{}).values())
    check('7 migration does not fabricate pre-device message backlog',before==after==0,(before,after))
    check('smartwatch scenario has no browser errors',not p.errs,p.errs); await p.close()

    # Teen + smartphone direct communication and decision integrity
    p=await make_page(b); await life(p,15,'PhoneTeen'); await p.evaluate("__LIFE_SIM_TEST__.grantItem('phone')"); s=await st(p); fr=friends(s)[0]
    g=await call(p,'communicationEligibility3C1',fr['id'],'message'); check('8 friend without exchanged contact cannot message',not g['ok'],g)
    # Force a declined exchange twice and confirm same Decision Ledger record is reused.
    await p.evaluate("window.__savedRandom=Math.random;Math.random=()=>0.99999")
    r1=await call(p,'exchangeContact3C1',fr['id']); r2=await call(p,'exchangeContact3C1',fr['id'])
    await p.evaluate("Math.random=window.__savedRandom;delete window.__savedRandom")
    s=await st(p); led=[x for x in s.get('decisionLedger',[]) if x.get('requestType')=='contactExchange' and x.get('targetKey')==fr['id']]
    check('9 declined contact exchange cannot be spam-rerolled',len(led)==1 and r1.get('id')==r2.get('id'),(r1,r2,led))
    # Advance beyond reconsideration and accept.
    d=date.fromisoformat(s['clock']['dateISO'])+timedelta(days=12); await p.evaluate("([d])=>__LIFE_SIM_TEST__.setClock(d,600)",[d.isoformat()])
    await p.evaluate("window.__savedRandom=Math.random;Math.random=()=>0")
    r3=await call(p,'exchangeContact3C1',fr['id']); await p.evaluate("Math.random=window.__savedRandom;delete window.__savedRandom")
    s=await st(p); cr=s['communication']['contacts'].get(fr['id'])
    check('10 successful exchange creates stable personId contact',r3 and cr and cr.get('personId')==fr['id'] and cr.get('status')=='active',cr)
    # Canonical message metadata/read state.
    m=await call(p,'chatAdd',fr['id'],'them','Meet after class?','planReminder')
    msgs=await call(p,'visibleChatMessages3C1',fr['id']); last=msgs[-1]
    check('11 messages preserve sender/receiver/timestamp/read state',last.get('senderId')==fr['id'] and last.get('receiverId')=='player' and bool(last.get('timestamp')) and last.get('read') is False,last)
    check('12 unread is tracked per direct thread',(await call(p,'unreadDirect3C2',fr['id']))==1,(await call(p,'unreadDirect3C2',fr['id'])))
    await call(p,'openThread',fr['id']); check('13 opening one thread marks that thread read',(await call(p,'unreadDirect3C2',fr['id']))==0)
    # Missed calls remain a separate concept.
    await call(p,'logMissedCall3C2',fr['id'],'chat','',None); check('14 missed calls are separate from unread messages',(await call(p,'missedCalls3C2'))==1 and (await call(p,'unreadDirect3C2'))==0)
    # Time labels contain date context and clock time.
    await call(p,'openThread',fr['id']); label=await p.inner_text('#choice-content')
    check('15 message history formats meaningful date plus time',('AM' in label or 'PM' in label) and ('Today' in label or 'Yesterday' in label or ',' in label or 'Oct' in label or 'Mar' in label),label[:500])
    # Blocking should preserve People/history but deny backend communications.
    s=await st(p); pc=len(s['people']); h0=len(next(x for x in s['people'] if x['id']==fr['id']).get('history',[])); await call(p,'blockContact3C4',fr['id']); ge=await call(p,'communicationEligibility3C1',fr['id'],'message'); s=await st(p); h1=len(next(x for x in s['people'] if x['id']==fr['id']).get('history',[]))
    check('16 blocking actually prevents incoming/direct communication',not ge['ok'],ge)
    check('17 blocking does not delete NPC or relationship history',len(s['people'])==pc and h1==h0,(pc,len(s['people']),h0,h1))
    await call(p,'unblockContact3C4',fr['id'])
    # Save/reload/repeated migrations preserve exact contact/thread/ledger cardinalities.
    snap=await st(p); key0=(len(snap.get('communication',{}).get('contacts',{})),sum(len(x.get('msgs',[])) for x in snap.get('chats',{}).values()),len(snap.get('callLog',[])),len(snap.get('decisionLedger',[])))
    await p.evaluate('s=>__LIFE_SIM_TEST__.loadState(s)',snap)
    for fn in ['migrateCommunication3C1','migrateCommunication3C2','migrateCommunication3C3','migrateCommunication3C4','migrateCommunication3C1','migrateCommunication3C4']:
        await call(p,fn)
    s=await st(p); key1=(len(s.get('communication',{}).get('contacts',{})),sum(len(x.get('msgs',[])) for x in s.get('chats',{}).values()),len(s.get('callLog',[])),len(s.get('decisionLedger',[])))
    check('18 save/reload preserves communication state',key0==key1,(key0,key1))
    check('19 repeated communication migration is idempotent',key0==key1 and s['communication'].get('phase3C4Version')==1,key1)
    check('teen scenario has no browser errors',not p.errs,p.errs); await p.close()

    # Adult smartphone: schedule, video, group chat, moved-out family messaging, 3B state integrity.
    p=await make_page(b); await life(p,25,'AdultPhone'); await p.evaluate("__LIFE_SIM_TEST__.grantItem('phone')"); s=await st(p); fs=friends(s)[:3]
    for x in fs: await call(p,'addContact3C1',x['id'],{'source':'exchange','initiatedBy':'player'})
    # Video requires compatible phone/contact; record at a normal free-ish time.
    await p.evaluate("__LIFE_SIM_TEST__.setClock(__LIFE_SIM_TEST__.getState().clock.dateISO,1140)")
    vg=await call(p,'communicationEligibility3C1',fs[0]['id'],'video'); check('20 video-call eligibility requires and recognizes compatible smartphone path',vg['ok'] and vg.get('device')=='smartphone',vg)
    # Group chat with stable groupId/member IDs and separate unread.
    ids=[x['id'] for x in fs]; await p.evaluate("ids=>__LIFE_SIM_TEST__.mutate(`S.groups=[{id:'grp-3c5',name:'Crew',members:${JSON.stringify(ids)},jokes:[],formed:S.clock.dateISO}]`)",ids)
    gg=await call(p,'groupChatEligibility3C4','grp-3c5'); gm=await call(p,'groupChatAdd3C4','grp-3c5',ids[0],'Who is free this weekend?','coordinate'); gt=await call(p,'groupChatRecord3C4','grp-3c5',{'create':True})
    check('21 Friend Group supports real stable group chat',gg['ok'] and gt['groupId']=='grp-3c5' and set(gt['memberIds'])==set(ids) and gm.get('groupId')=='grp-3c5',(gg,gt,gm))
    check('22 group unread is separate from direct unread',(await call(p,'unreadGroup3C4'))==1 and (await call(p,'unreadDirect3C2'))==0,((await call(p,'unreadGroup3C4')),(await call(p,'unreadDirect3C2'))))
    # Knowledge provenance gate.
    k0=await call(p,'communicationKnowledgeCanMention3C4',ids[1],'playerRomance',ids[0]); await p.evaluate("([id,t])=>__LIFE_SIM_TEST__.mutate(`S.people.find(x=>x.id==='${id}').knownRomanceIds=['${t}']`)",[ids[1],ids[0]]); k1=await call(p,'communicationKnowledgeCanMention3C4',ids[1],'playerRomance',ids[0])
    check('23 communication respects knowledge provenance',k0 is False and k1 is True,(k0,k1))
    # Establish official 3B partner and make sure communication migrations do not corrupt it.
    partner=fs[0]; await p.evaluate("id=>__LIFE_SIM_TEST__.mutate(`{const p=S.people.find(x=>x.id==='${id}');p.rel=85;p.trust=82;p.conflict=0;p.love=Object.assign({},p.love||{},{stage:'official',mutual:true,npcInterest:'reciprocates',relationshipStartDate:S.clock.dateISO});p.romanceStage='partner';S.romance.partnerId=p.id;S.romance.partner=p.fullName||p.name;S.romance.status='In a relationship';S.romance.relationshipStartDate=S.clock.dateISO}`)",partner['id'])
    await call(p,'migrateCommunication3C4'); s=await st(p); check('24 Phase 3B romance state remains intact through communication migration',s.get('romance',{}).get('partnerId')==partner['id'] and next(x for x in s['people'] if x['id']==partner['id']).get('love',{}).get('stage')=='official')
    # Moving out: an already-committed household logistics follow-up must not arrive as household text.
    par=next((x for x in fam(s) if x.get('relation') in ('mother','father','parent','guardian') or x.get('role') in ('parent','guardian')),None)
    if par:
        # schedule at current day + 30 min through canonical follow-up system
        await call(p,'scheduleFollowUp','incomingMsg',{'personId':par['id'],'kind':'parent'},{'minute':1170})
        await p.evaluate("__LIFE_SIM_TEST__.setMoney(25000,0,0)"); await call(p,'moveTo','apartment'); await p.evaluate('__LIFE_SIM_TEST__.advanceMinutes(40)')
        ms=await call(p,'visibleChatMessages3C1',par['id']); kinds=[x.get('kind') for x in ms]
        check('25 moving out converts/suppresses household-specific messaging',('parentSocial' in kinds) and ('parent' not in kinds),kinds[-5:])
    # Late bedtime/house-rule communication hook still exists but adult should not be treated as minor.
    gate=await call(p,'bedtimeCommunicationGate3C3',partner['id'],'video','smartphone'); check('26 adult communication is not subject to minor bedtime restriction',not gate.get('restricted',False),gate)
    check('adult scenario has no browser errors',not p.errs,p.errs); await p.close(); await b.close()

  failed=[x for x in R if not x[1]]; print(f'3C.5 acceptance supplement: {len(R)-len(failed)}/{len(R)} passed'); raise SystemExit(1 if failed else 0)

asyncio.run(main())
