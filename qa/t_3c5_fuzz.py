import asyncio
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
async def life(p,age,label):
    await p.fill('#c-name',f'Fuzz3C{label}'); await p.fill('#c-dob','2010-03-10'); await p.evaluate("()=>{document.getElementById('c-place').value='New York City, USA';document.getElementById('c-attraction').value='All genders'}"); await p.click('#begin'); await p.evaluate(f'__LIFE_SIM_TEST__.setAge({age})')
    await p.evaluate("item=>__LIFE_SIM_TEST__.grantItem(item)",'kidsWatch' if age<13 else 'phone')
    # Give several non-family contacts only to smartphone users. Child watch keeps family-only by default.
    if age>=13:
        s=await p.evaluate('__LIFE_SIM_TEST__.getState()'); ids=[x['id'] for x in s['people'] if x.get('role')=='friend'][:5]
        for i in ids: await p.evaluate("id=>__LIFE_SIM_TEST__.call('addContact3C1',id,{source:'exchange',initiatedBy:'player'})",i)
        if len(ids)>=3: await p.evaluate("ids=>__LIFE_SIM_TEST__.mutate(`S.groups=[{id:'fuzz-group',name:'Fuzz Crew',members:${JSON.stringify(ids.slice(0,3))},jokes:[],formed:S.clock.dateISO}]`)",ids)
    await p.evaluate("()=>{__LIFE_SIM_TEST__.call('migrateCommunication3C1');__LIFE_SIM_TEST__.call('migrateCommunication3C2');__LIFE_SIM_TEST__.call('migrateCommunication3C3');__LIFE_SIM_TEST__.call('migrateCommunication3C4')}")

async def main():
  async with async_playwright() as pw:
    b=await pw.chromium.launch(executable_path=CHROME,args=['--no-sandbox'])
    total=0
    for age,label in [(8,'child-watch'),(15,'teen-phone'),(25,'adult-phone')]:
      p=await make_page(b); await life(p,age,label)
      result=await p.evaluate("""([age,steps])=>{const T=window.__LIFE_SIM_TEST__;let seed=age*104729+31;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};const errs=[],ops={};
        const S0=()=>T.getState(), people=()=>S0().people||[], family=()=>people().filter(p=>['parent','guardian','sibling'].includes(p.role)||['mother','father','parent','guardian','sibling'].includes(p.relation)), friends=()=>people().filter(p=>p.role==='friend');
        const doCall=(n,...a)=>{ops[n]=(ops[n]||0)+1;try{return T.call(n,...a)}catch(e){errs.push(n+': '+e.message);return null}};
        for(let i=0;i<steps;i++){const st=S0(),fs=friends(),fam=family(),all=[...fam,...fs],q=all.length?all[Math.floor(rnd()*all.length)]:null,k=Math.floor(rnd()*18);
          if(k===0)doCall('migrateCommunication3C1');
          else if(k===1)doCall('migrateCommunication3C2');
          else if(k===2)doCall('migrateCommunication3C3');
          else if(k===3)doCall('migrateCommunication3C4');
          else if(k===4&&q)doCall('communicationEligibility3C1',q.id,'message');
          else if(k===5&&q)doCall('communicationEligibility3C1',q.id,'call');
          else if(k===6&&q)doCall('communicationEligibility3C1',q.id,'video');
          else if(k===7&&q)doCall('contactRecord3C1',q.id);
          else if(k===8&&age>=13&&fs.length){const x=fs[Math.floor(rnd()*fs.length)];doCall('addContact3C1',x.id,{source:'exchange',initiatedBy:'player'});}
          else if(k===9&&age>=13&&fs.length){const x=fs[Math.floor(rnd()*fs.length)];const r=doCall('contactRecord3C1',x.id);if(r&&r.status==='active')doCall('blockContact3C4',x.id);}
          else if(k===10&&age>=13&&fs.length){const x=fs[Math.floor(rnd()*fs.length)];const r=doCall('contactRecord3C1',x.id);if(r&&r.status==='blocked')doCall('unblockContact3C4',x.id);}
          else if(k===11&&q){const g=doCall('communicationEligibility3C1',q.id,'message');if(g&&g.ok)doCall('incomingMessage3C2',q.id,['chitchat','how','support'][Math.floor(rnd()*3)]);}
          else if(k===12&&q){const g=doCall('communicationEligibility3C1',q.id,'call');if(g&&g.ok)doCall('outgoingCall3C2',q.id,false);}
          else if(k===13&&age>=13&&fs.length){const x=fs[Math.floor(rnd()*fs.length)];const g=doCall('communicationEligibility3C1',x.id,'video');if(g&&g.ok)doCall('outgoingCall3C2',x.id,true);}
          else if(k===14&&age<13)doCall('watchLocationSnapshot3C3','fuzz');
          else if(k===15&&age>=13&&(st.groups||[]).length){const g=st.groups[0];doCall('groupChatEligibility3C4',g.id);if(rnd()<.45)doCall('maybeGroupMessage3C4',g.id,{force:true});}
          else if(k===16)doCall('unreadDirect3C2');
          else if(k===17)doCall('missedCalls3C2');
        }
        const S=S0(),bad=[],ids=new Set((S.people||[]).map(p=>p.id));const C=S.communication||{},contacts=C.contacts||{};
        for(const [id,r] of Object.entries(contacts)){if(!ids.has(id)||r.personId!==id)bad.push('invalid contact '+id);if(!['active','blocked','removed'].includes(r.status))bad.push('bad contact status '+id);}
        for(const [id,t] of Object.entries(S.chats||{})){if(!ids.has(id))bad.push('chat person missing '+id);for(const m of t.msgs||[]){if(!m.id||!m.timestamp||!m.dateISO||typeof m.minute!=='number')bad.push('bad message metadata '+id);if(m.senderId!=='player'&&!ids.has(m.senderId))bad.push('bad sender '+m.senderId);if(m.receiverId!=='player'&&!ids.has(m.receiverId))bad.push('bad receiver '+m.receiverId);}}
        const allowedCall=new Set(['answered','missed','declined','unavailable','completed']);for(const c of S.callLog||[]){if(!ids.has(c.personId))bad.push('call person missing');if(!allowedCall.has(c.outcome))bad.push('bad call outcome '+c.outcome);if(!c.timestamp||!c.dateISO)bad.push('bad call timestamp');}
        for(const [gid,t] of Object.entries(C.groupChats||{})){if(t.groupId!==gid)bad.push('bad group id');if(new Set(t.memberIds||[]).size!==(t.memberIds||[]).length)bad.push('dup group member');for(const id of t.memberIds||[])if(!ids.has(id))bad.push('missing group member '+id);for(const m of t.msgs||[]){if(m.groupId!==gid||!m.timestamp)bad.push('bad group msg');}}
        for(const [id,r] of Object.entries(contacts))if(r.status==='blocked'){const e=doCall('communicationEligibility3C1',id,'message');if(e&&e.ok)bad.push('blocked contact eligible '+id);}
        const dev=doCall('communicationDeviceAccess3C1');if(age<13){if(dev.smartphone)bad.push('child unexpectedly has smartphone');for(const p of family()){const v=doCall('communicationEligibility3C1',p.id,'video');if(v&&v.ok)bad.push('watch video allowed');}}
        if(C.version!==1||C.threadVersion!==1||!C.watch||C.watch.version!==1||C.phase3C4Version!==1)bad.push('migration version missing');
        return {errs,bad,ops,state:S};}""",[age,200])
      total+=200
      check(f'3C.5 fuzz {label}: 200 randomized communication operations complete',not result['errs'],result['errs'][:8])
      check(f'3C.5 fuzz {label}: communication invariants hold',not result['bad'],result['bad'][:12])
      before=result['state']; C=before.get('communication',{}); key0=(len(C.get('contacts',{})),sum(len(x.get('msgs',[])) for x in before.get('chats',{}).values()),len(before.get('callLog',[])),sum(len(x.get('msgs',[])) for x in C.get('groupChats',{}).values()))
      await p.evaluate('s=>__LIFE_SIM_TEST__.loadState(s)',before)
      for fn in ['migrateCommunication3C1','migrateCommunication3C2','migrateCommunication3C3','migrateCommunication3C4','migrateCommunication3C1','migrateCommunication3C4']:
        await p.evaluate("n=>__LIFE_SIM_TEST__.call(n)",fn)
      after=await p.evaluate('__LIFE_SIM_TEST__.getState()'); C2=after.get('communication',{}); key1=(len(C2.get('contacts',{})),sum(len(x.get('msgs',[])) for x in after.get('chats',{}).values()),len(after.get('callLog',[])),sum(len(x.get('msgs',[])) for x in C2.get('groupChats',{}).values()))
      check(f'3C.5 fuzz {label}: save/load + repeated migration is idempotent',key0==key1,(key0,key1))
      check(f'3C.5 fuzz {label}: no browser JS errors',not p.errs,p.errs[:5]); await p.close()
    check('3C.5 required fuzz covered child smartwatch + teen smartphone + adult smartphone',total==600,total)
    await b.close()
  failed=[x for x in R if not x[1]]; print(f'3C.5 fuzz: {len(R)-len(failed)}/{len(R)} passed'); raise SystemExit(1 if failed else 0)

asyncio.run(main())
