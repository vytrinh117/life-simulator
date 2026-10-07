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
async def new_life(p,dob='2011-03-10'):
    await p.fill('#c-name','P3C2Test'); await p.fill('#c-dob',dob); await p.evaluate("()=>{document.getElementById('c-place').value='New York City, USA'}"); await p.click('#begin')
async def call(p,n,*a): return await p.evaluate("([n,a])=>__LIFE_SIM_TEST__.call(n,...a)",[n,list(a)])
async def st(p): return await p.evaluate('__LIFE_SIM_TEST__.getState()')

async def main():
  async with async_playwright() as pw:
    b=await pw.chromium.launch(executable_path=CHROME,args=['--no-sandbox'])
    p=await page(b); await new_life(p); await p.evaluate('__LIFE_SIM_TEST__.setAge(15)'); await p.evaluate("__LIFE_SIM_TEST__.grantItem('phone')")
    s=await st(p); friends=[x for x in s['people'] if x.get('role')=='friend']; f1,f2=friends[0],friends[1]
    # Make call-availability assertions deterministic: this suite tests 3C.2 call records, not random study/vacation schedules.
    await p.evaluate("ids=>__LIFE_SIM_TEST__.mutate(`ids=${JSON.stringify(ids)};ids.forEach(id=>{const p=S.people.find(x=>x.id===id);if(p)p.goals=[];const n=p&&S.npcs.find(x=>x.id===p.npcId);if(n)n.vacationUntil=null})`)",[f1['id'],f2['id']])
    await call(p,'addContact3C1',f1['id'],{'source':'exchange','initiatedBy':'player'}); await call(p,'addContact3C1',f2['id'],{'source':'exchange','initiatedBy':'player'})

    # Canonical direct-message records.
    m1=await call(p,'chatAdd',f1['id'],'them','hello there','chitchat')
    check('1 incoming message has stable sender/receiver IDs',m1['senderId']==f1['id'] and m1['receiverId']=='player',m1)
    check('2 message preserves game timestamp/read state',bool(m1.get('timestamp')) and m1['read'] is False and m1['dateISO'] and isinstance(m1['minute'],(int,float)),m1)
    m2=await call(p,'chatAdd',f2['id'],'them','second thread','chitchat')
    check('3 unread count is per real direct threads',(await call(p,'unreadDirect3C2'))==2)
    await call(p,'openThread',f1['id']); s=await st(p)
    c1=s['chats'][f1['id']]['msgs'][-1]; c2=s['chats'][f2['id']]['msgs'][-1]
    check('4 opening one thread marks only that thread read',c1['read'] is True and c2['read'] is False,(c1,c2))
    check('5 unread count updates without marking unrelated thread',(await call(p,'unreadDirect3C2'))==1)
    txt=await p.inner_text('#choice-content')
    check('6 thread renders meaningful date + time','Today' in txt and ('AM' in txt or 'PM' in txt),txt[:500])
    await call(p,'closeChoiceModal')

    # Outgoing voice call and availability/time-of-day.
    await p.evaluate("__LIFE_SIM_TEST__.mutate(`S.clock.minute=1140;S.location='Park'`)")
    await p.evaluate("window.__oldRandom=Math.random;Math.random=()=>0")
    out=await call(p,'outgoingCall3C2',f1['id'],False)
    await p.evaluate("Math.random=window.__oldRandom;delete window.__oldRandom")
    check('7 completed outgoing call creates real call history',out and out['direction']=='outgoing' and out['callType']=='voice' and out['outcome']=='completed' and out['duration']>0,out)
    await p.evaluate("__LIFE_SIM_TEST__.mutate(`S.clock.minute=120`)")
    late=await call(p,'outgoingCall3C2',f1['id'],False)
    ss=await st(p); last=ss['callLog'][0]
    check('8 time-of-day can make a call unavailable',late is None and last['outcome']=='unavailable',last)

    # Missed incoming call is distinct from unread messages.
    await p.evaluate("__LIFE_SIM_TEST__.mutate(`S.clock.minute=1080`)")
    before_unread=await call(p,'unreadDirect3C2')
    await call(p,'logMissedCall',f1['id'] if False else f1,'chat','') if False else None
    # call helper expects a Person object; execute inside page for exact object identity.
    await call(p,'logMissedCall3C2',f1['id'],'chat','Test missed call','smartphone')
    check('9 missed-call badge is separate from unread messages',(await call(p,'missedCalls3C2'))==1 and (await call(p,'unreadDirect3C2'))==before_unread)
    await call(p,'openCallsModal3C2'); calls_txt=await p.inner_text('#choice-content')
    check('10 Calls UI shows call history and missed status','missed call' in calls_txt.lower() and ('Today' in calls_txt or 'Yesterday' in calls_txt),calls_txt[:700])
    check('11 opening Calls reviews missed-call badge without changing messages',(await call(p,'missedCalls3C2'))==0 and (await call(p,'unreadDirect3C2'))==before_unread)
    await call(p,'closeChoiceModal')

    # Video calls use channel/device eligibility and are contextual, not renamed voice calls.
    await p.evaluate("__LIFE_SIM_TEST__.mutate(`S.clock.minute=1260`)")
    await p.evaluate("window.__oldRandom=Math.random;Math.random=()=>0")
    vid=await call(p,'outgoingCall3C2',f1['id'],True)
    await p.evaluate("Math.random=window.__oldRandom;delete window.__oldRandom")
    check('12 smartphone video call records video call type',vid and vid['callType']=='video' and vid['outcome']=='completed',vid)

    # Incoming communication frequency protection.
    await p.evaluate("window.__oldRandom=Math.random;Math.random=()=>0")
    a=await call(p,'incomingMessage',f1['id'] if False else None,'chitchat') if False else None
    first=await call(p,'incomingMessage3C2',f1['id'],'chitchat')
    second=await call(p,'incomingMessage3C2',f1['id'],'chitchat')
    await p.evaluate("Math.random=window.__oldRandom;delete window.__oldRandom")
    check('13 same NPC cannot spam generic incoming messages same day',first is not None and second is None,(first,second))

    # Birthday quick reply options exist in current message engine.
    opts=await call(p,'birthdayReplyOptions3C2')
    labels=[x[1] for x in opts]
    check('14 birthday wish has natural quick replies','Thank you!' in labels and "That's so sweet" in labels,labels)

    # Save/reload and repeated migration preserve canonical IDs/history without duplication.
    snap=await st(p); nmsg=sum(len(x.get('msgs',[])) for x in snap.get('chats',{}).values()); ncalls=len(snap.get('callLog',[]))
    await p.evaluate("s=>__LIFE_SIM_TEST__.loadState(s)",snap); await call(p,'migrateCommunication3C2'); await p.evaluate('__LIFE_SIM_TEST__.migrate()'); await call(p,'migrateCommunication3C2'); s2=await st(p)
    nmsg2=sum(len(x.get('msgs',[])) for x in s2.get('chats',{}).values())
    check('15 save/reload preserves canonical message/call state',nmsg2==nmsg and len(s2.get('callLog',[]))==ncalls,(nmsg,nmsg2,ncalls,len(s2.get('callLog',[]))))
    check('16 repeated communication migration is idempotent',s2['communication'].get('threadVersion')==1 and all((m.get('senderId') and m.get('receiverId') and m.get('timestamp')) for c in s2.get('chats',{}).values() for m in c.get('msgs',[])))
    check('3C.2 smartphone runtime has no page errors',not p.errs,p.errs)
    await p.close()

    # Kids smartwatch: message/call supported for family, video not supported.
    p=await page(b); await new_life(p,'2018-03-10'); await p.evaluate('__LIFE_SIM_TEST__.setAge(8)'); await p.evaluate("__LIFE_SIM_TEST__.grantItem('kidsWatch')")
    s=await st(p); mother=next(x for x in s['people'] if x.get('relation')=='mother')
    msg=await call(p,'communicationEligibility3C1',mother['id'],'message'); voice=await call(p,'communicationEligibility3C1',mother['id'],'call'); video=await call(p,'communicationEligibility3C1',mother['id'],'video')
    check('17 limited device supports appropriate message/call channels',msg['ok'] and voice['ok'] and msg['device']=='kidsWatch',(msg,voice))
    check('18 kids smartwatch does not gain smartphone video capability',not video['ok'],video)
    # Dormant pre-device call rows must not become visible later merely because a device is acquired.
    nf=next(x for x in s['people'] if x.get('role')=='friend')
    await p.evaluate("id=>__LIFE_SIM_TEST__.mutate(`S.callLog=[{id:'old-pre-device-call',personId:'${id}',dateISO:S.clock.dateISO,minute:500,missed:true}]`)",nf['id'])
    await call(p,'migrateCommunication3C2'); await p.evaluate('__LIFE_SIM_TEST__.setAge(15)'); await p.evaluate("__LIFE_SIM_TEST__.grantItem('phone')"); await call(p,'migrateCommunication3C2')
    viscalls=await call(p,'visibleCallLog3C2')
    check('19 pre-device dormant call history is not fabricated into the later phone UI',all(x.get('id')!='old-pre-device-call' for x in viscalls),viscalls)
    check('3C.2 watch runtime has no page errors',not p.errs,p.errs)
    await p.close(); await b.close()

  failed=[x for x in R if not x[1]]; print(f'3C.2 focused: {len(R)-len(failed)}/{len(R)} passed'); raise SystemExit(1 if failed else 0)
asyncio.run(main())
