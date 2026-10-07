import asyncio
from pathlib import Path
from datetime import date,timedelta
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
    await p.fill('#c-name','P3C4Test'); await p.fill('#c-dob',dob); await p.evaluate("()=>{document.getElementById('c-place').value='New York City, USA'}"); await p.click('#begin')
async def call(p,n,*a): return await p.evaluate("([n,a])=>__LIFE_SIM_TEST__.call(n,...a)",[n,list(a)])
async def st(p): return await p.evaluate('__LIFE_SIM_TEST__.getState()')

async def main():
  async with async_playwright() as pw:
    b=await pw.chromium.launch(executable_path=CHROME,args=['--no-sandbox'])
    p=await page(b); await new_life(p); await p.evaluate('__LIFE_SIM_TEST__.setAge(15)')
    s=await st(p); friends=[x for x in s['people'] if x.get('role')=='friend'][:3]; ids=[x['id'] for x in friends]
    await p.evaluate("ids=>__LIFE_SIM_TEST__.mutate(`S.groups=[{id:'grp-test',name:'The Crew',members:${JSON.stringify(ids)},jokes:['the potato thing'],formed:S.clock.dateISO}]`)",ids)

    g0=await call(p,'groupChatEligibility3C4','grp-test')
    check('1 group chat requires compatible device',not g0['ok'] and 'smartphone' in g0['reason'].lower(),g0)
    await p.evaluate("__LIFE_SIM_TEST__.grantItem('phone')")
    g1=await call(p,'groupChatEligibility3C4','grp-test')
    check('2 group chat requires member contact compatibility',not g1['ok'] and len(g1.get('missingIds',[]))==3,g1)
    for x in ids: await call(p,'addContact3C1',x,{'source':'exchange','initiatedBy':'player'})
    g2=await call(p,'groupChatEligibility3C4','grp-test')
    check('3 group chat becomes eligible after real contacts exist',g2['ok'] and set(g2['memberIds'])==set(ids),g2)

    t=await call(p,'groupChatRecord3C4','grp-test',{'create':True})
    check('4 canonical group thread stores stable groupId/member personIds',t and t['groupId']=='grp-test' and set(t['memberIds'])==set(ids) and t['msgs']==[],t)
    m=await call(p,'groupChatAdd3C4','grp-test',ids[0],'Anyone free later?','coordinate')
    check('5 group message preserves sender/group/timestamp/unread',m and m['senderId']==ids[0] and m['groupId']=='grp-test' and m['receiverId']=='group:grp-test' and m['read'] is False and bool(m.get('timestamp')),m)
    await call(p,'chatAdd',ids[1],'them','direct unread','chitchat')
    check('6 group unread is separate from direct unread',(await call(p,'unreadGroup3C4'))==1 and (await call(p,'unreadDirect3C2'))==1,((await call(p,'unreadGroup3C4')),(await call(p,'unreadDirect3C2'))))
    await call(p,'openGroupThread3C4','grp-test')
    check('7 opening group marks only that group read',(await call(p,'unreadGroup3C4'))==0 and (await call(p,'unreadDirect3C2'))==1)
    txt=await p.inner_text('#choice-content'); title=await p.inner_text('#choice-title')
    expected_sender=friends[0].get('nickname') or friends[0].get('firstName') or friends[0].get('name','').split(' • ')[0].split(' ')[0]
    check('8 group thread renders member identity plus date/time','The Crew' in title and expected_sender in txt and ('Today' in txt or 'Yesterday' in txt) and ('AM' in txt or 'PM' in txt),(title,txt[:600],expected_sender))
    await call(p,'closeChoiceModal')

    # Friend Groups UI gets a real group chat action, not a fake label.
    await p.click('[data-tab="people"]'); await p.click('[data-subtab="groups"]'); body=await p.inner_text('#panel-host')
    check('9 HOTFIX-P1 Friend Groups surface exposes functional group chat','Friend groups' in body and 'Group chat' in body,body[:900])

    # Contextual group incoming message uses real group state and cooldown.
    forced=await call(p,'maybeGroupMessage3C4','grp-test',{'force':True}); again=await call(p,'maybeGroupMessage3C4','grp-test',{'force':True})
    check('10 group incoming frequency is cooldown-protected',forced is not None and again is None,(forced,again))

    # Blocking uses canonical contact state and blocks both direct + group eligibility without deleting People/history.
    before=await st(p); pf=next(x for x in before['people'] if x['id']==ids[0]); hist=len(pf.get('history',[])); count=len(before['people'])
    br=await call(p,'blockContact3C4',ids[0]); direct=await call(p,'communicationEligibility3C1',ids[0],'message'); gg=await call(p,'groupChatEligibility3C4','grp-test'); afterb=await st(p)
    check('11 blocking prevents normal direct communication',br and br['status']=='blocked' and not direct['ok'],(br,direct))
    check('12 blocked member also makes current group chat ineligible',not gg['ok'] and ids[0] in gg.get('missingIds',[]),gg)
    pf2=next(x for x in afterb['people'] if x['id']==ids[0])
    check('13 blocking does not delete NPC or relationship history',len(afterb['people'])==count and len(pf2.get('history',[]))==hist,(count,len(afterb['people']),hist,len(pf2.get('history',[]))))
    ur=await call(p,'unblockContact3C4',ids[0]); check('14 unblock restores saved communication path',ur and ur['status']=='active' and (await call(p,'communicationEligibility3C1',ids[0],'message'))['ok'])
    rr=await call(p,'removeContact3C4',ids[2]); check('15 remove contact preserves person but removes communication path',rr and rr['status']=='removed' and not (await call(p,'communicationEligibility3C1',ids[2],'message'))['ok'] and any(x['id']==ids[2] for x in (await st(p))['people']))
    # restore for later group checks
    await call(p,'addContact3C1',ids[2],{'source':'exchange','initiatedBy':'player'})

    # No omniscient romance gossip without provenance.
    know0=await call(p,'communicationKnowledgeCanMention3C4',ids[1],'playerRomance',ids[0])
    await p.evaluate("([id,target])=>__LIFE_SIM_TEST__.mutate(`S.people.find(x=>x.id==='${id}').knownRomanceIds=['${target}']`)",[ids[1],ids[0]])
    know1=await call(p,'communicationKnowledgeCanMention3C4',ids[1],'playerRomance',ids[0])
    check('16 communication knowledge requires provenance',know0 is False and know1 is True,(know0,know1))

    # Migration/save reload: no fake history, no duplication.
    snap=await st(p); gcount=sum(len(x.get('msgs',[])) for x in snap['communication'].get('groupChats',{}).values())
    await p.evaluate('s=>__LIFE_SIM_TEST__.loadState(s)',snap); await call(p,'migrateCommunication3C4'); await call(p,'migrateCommunication3C4'); s2=await st(p)
    gcount2=sum(len(x.get('msgs',[])) for x in s2['communication'].get('groupChats',{}).values())
    check('17 save/reload preserves group communication state',gcount2==gcount and s2['communication']['groupChats']['grp-test']['groupId']=='grp-test',(gcount,gcount2))
    check('18 repeated 3C.4 migration is idempotent',s2['communication'].get('phase3C4Version')==1 and gcount2==gcount)
    check('3C.4 teen runtime has no page errors',not p.errs,p.errs)
    await p.close()

    # Adult official partner: relationship communication reuses 3B state and 3C.2 lifecycle.
    p=await page(b); await new_life(p,'2001-03-10'); await p.evaluate('__LIFE_SIM_TEST__.setAge(25)'); await p.evaluate("__LIFE_SIM_TEST__.grantItem('phone')")
    s=await st(p); partner=next(x for x in s['people'] if x.get('role')=='friend')
    await call(p,'addContact3C1',partner['id'],{'source':'exchange','initiatedBy':'player'})
    await p.evaluate("id=>__LIFE_SIM_TEST__.mutate(`{const p=S.people.find(x=>x.id==='${id}');p.rel=82;p.trust=80;p.conflict=0;p.romanceStage='partner';p.attraction=82;p.love=Object.assign({},p.love||{},{stage:'official',playerCrush:true,npcInterest:'reciprocates',mutual:true,npcAttraction:82,relationshipStartDate:S.clock.dateISO,dateHistory:[]});S.romance.partnerId=p.id;S.romance.partner=p.fullName||p.name;S.romance.status='In a relationship';S.romance.relationshipStartDate=S.clock.dateISO}`)",partner['id'])
    # Real accepted romantic plan tomorrow should drive date-confirm communication.
    tomorrow=(date.fromisoformat((await st(p))['clock']['dateISO'])+timedelta(days=1)).isoformat()
    await p.evaluate("([id,d])=>__LIFE_SIM_TEST__.mutate(`S.plans.push({id:'rom-plan-test',type:'date',romantic:true,activityId:'cafe',title:'Cafe date',personId:'${id}',hostIsPlayer:true,inviter:'player',acceptanceState:'Accepted',dateISO:'${d}',startMinute:1080,endMinute:1140,expectedDuration:60,location:'Cafe',status:'Accepted',createdDate:S.clock.dateISO,payment:{mode:'split',playerCost:10},transportHook:'existing-world-movement'})`)",[partner['id'],tomorrow])
    await p.evaluate("window.__oldRandom=Math.random;Math.random=()=>0")
    sched=await call(p,'scheduleRomanticCommunication3C4')
    await p.evaluate("Math.random=window.__oldRandom;delete window.__oldRandom")
    s=await st(p); fu=[x for x in s.get('followUps',[]) if x.get('status')=='Scheduled' and x.get('payload',{}).get('personId')==partner['id']]
    check('19 official relationship schedules contextual communication without changing romance state',sched and any(x.get('payload',{}).get('kind')=='dateConfirm' for x in fu) and s['romance']['partnerId']==partner['id'],fu)
    # Trigger date confirmation; it must be a real direct message with meaningful kind.
    target=next(x for x in fu if x.get('payload',{}).get('kind')=='dateConfirm'); await p.evaluate("([d,m])=>__LIFE_SIM_TEST__.setClock(d,m)",[target['dateISO'],target['minute']]); await p.evaluate('__LIFE_SIM_TEST__.advanceMinutes(1)')
    msgs=await call(p,'visibleChatMessages3C1',partner['id']); check('20 date confirmation uses canonical direct thread',any(x.get('kind')=='dateConfirm' and x.get('senderId')==partner['id'] for x in msgs),msgs[-3:])

    # Force a late romantic video-call invitation on a later day; existing 3C.2 call event handles it.
    cur=(await st(p))['clock']['dateISO']; nxt=(date.fromisoformat(cur)+timedelta(days=3)).isoformat(); await p.evaluate("([d])=>__LIFE_SIM_TEST__.setClock(d,0)",[nxt]);
    await p.evaluate("id=>__LIFE_SIM_TEST__.mutate(`S.communication.romanceNextContact['${id}']=null;S.plans=[]`)",partner['id'])
    await p.evaluate("window.__oldRandom=Math.random;Math.random=()=>0")
    sched2=await call(p,'scheduleRomanticCommunication3C4')
    await p.evaluate("Math.random=window.__oldRandom;delete window.__oldRandom")
    s=await st(p); rfu=[x for x in s.get('followUps',[]) if x.get('status')=='Scheduled' and x.get('payload',{}).get('why')=='romanceVideo']
    check('21 romantic goodnight communication may use real video-call lifecycle',sched2 and bool(rfu),rfu)
    if rfu:
        f=rfu[-1]; await p.evaluate("([d,m])=>__LIFE_SIM_TEST__.setClock(d,m)",[f['dateISO'],f['minute']]); await p.evaluate('__LIFE_SIM_TEST__.advanceMinutes(1)'); s=await st(p); ev=next((e for e in s.get('events',[]) if e.get('status')=='Open' and e.get('type')=='incomingCall' and e.get('payload',{}).get('callType')=='video'),None)
        check('22 scheduled romantic video contact becomes a video-call event',ev is not None,ev)
        if ev: await p.evaluate("eid=>__LIFE_SIM_TEST__.eventChoice(eid,'answer')",ev['id'])
    s=await st(p); pp=next(x for x in s['people'] if x['id']==partner['id'])
    check('23 meaningful late romantic call can feed relationship memory',any('late-night call' in h.get('text','').lower() or 'meaningful video' in h.get('text','').lower() for h in pp.get('history',[])),pp.get('history',[])[:8])
    check('24 Phase 3B official partner state remains intact',s['romance']['partnerId']==partner['id'] and s['people'] and any(x['id']==partner['id'] for x in s['people']))
    check('3C.4 adult runtime has no page errors',not p.errs,p.errs)
    await p.close(); await b.close()

  failed=[x for x in R if not x[1]]; print(f'3C.4 focused: {len(R)-len(failed)}/{len(R)} passed'); raise SystemExit(1 if failed else 0)
asyncio.run(main())
