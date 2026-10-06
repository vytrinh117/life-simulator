import asyncio
from datetime import date, timedelta
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
    await p.fill('#c-name','H34Test')
    await p.fill('#c-dob','2008-03-10')
    await p.evaluate("()=>{const x=document.getElementById('c-place');if(!x.value)x.value='New York City, USA'}")
    await p.click('#begin')
    await p.evaluate('__LIFE_SIM_TEST__.setAge(18)')

async def state(p): return await p.evaluate('__LIFE_SIM_TEST__.getState()')
async def call(p,name,*args): return await p.evaluate("([n,a])=>__LIFE_SIM_TEST__.call(n,...a)",[name,list(args)])

async def main():
  async with async_playwright() as pw:
    b=await pw.chromium.launch(executable_path=CHROME,args=['--no-sandbox'])
    p=await page(b); await new_life(p)

    # H3.4 birthday: attending a real birthday plan is canonical acknowledgment.
    s=await state(p); today=s['clock']['dateISO']; y=today[:4]; md=today[5:]
    friend=next(x for x in s['people'] if x.get('role')=='friend')
    fid=friend['id']
    await p.evaluate("([fid,today,md])=>__LIFE_SIM_TEST__.mutate(`const p=S.people.find(x=>x.id==='${fid}');p.bday='${md}';p.rel=80;p.trust=80;p.bdayWished={};S.clock.minute=600;S.plans.unshift({id:'h34bday',type:'party',title:p.name+' Birthday Party',personId:p.id,birthdayOf:p.id,hostIsPlayer:false,dateISO:'${today}',startMinute:600,endMinute:630,location:p.name+' house',status:'Accepted',createdDate:'${today}'});S.calendar.unshift({id:'plan-h34bday',type:'plan',title:p.name+' Birthday Party',dateISO:'${today}',startMinute:600,endMinute:630,graceMinute:630,payload:{planId:'h34bday'},location:p.name+' house',participants:[p.name],required:true,source:'social',status:'Scheduled'})`)",[fid,today,md])
    await call(p,'attendPlan','h34bday')
    s1=await state(p); pp1=next(x for x in s1['people'] if x['id']==fid); plan=next(x for x in s1['plans'] if x['id']=='h34bday')
    check('1 Attending a birthday party marks the plan Attended',plan['status']=='Attended',plan)
    check('2 Attending birthday party counts as birthday acknowledgment',bool(pp1.get('bdayWished',{}).get(y)),pp1.get('bdayWished'))
    check('3 Canonical birthday acknowledgment state is shared with existing wish/forget logic',bool(pp1.get('bdayWished',{}).get(y)),pp1.get('bdayWished'))

    # Next-day forgot-birthday check must not penalize this person.
    tomorrow=(date.fromisoformat(today)+timedelta(days=1)).isoformat()
    await p.evaluate("([fid,tomorrow])=>__LIFE_SIM_TEST__.mutate(`S.clock.dateISO='${tomorrow}';S.clock.minute=600;const p=S.people.find(x=>x.id==='${fid}');p.rel=90;p.history=(p.history||[]).filter(h=>!String(h.text||h).includes('forgot their birthday'))`)",[fid,tomorrow])
    await call(p,'birthdayTick')
    s2=await state(p); pp2=next(x for x in s2['people'] if x['id']==fid)
    hist=' '.join(str(h.get('text','')) if isinstance(h,dict) else str(h) for h in pp2.get('history',[]))
    check('4 Attendee is not later penalized as having forgotten the birthday',pp2['rel']==90 and 'forgot their birthday' not in hist.lower(),(pp2['rel'],hist))

    # Explicit wish remains a valid acknowledgment path.
    other=next(x for x in s2['people'] if x.get('role')=='friend' and x['id']!=fid)
    oid=other['id']
    await p.evaluate("([oid,today,md])=>__LIFE_SIM_TEST__.mutate(`S.clock.dateISO='${today}';S.clock.minute=700;const p=S.people.find(x=>x.id==='${oid}');p.bday='${md}';p.bdayWished={}`)",[oid,today,md])
    await call(p,'wishBirthday',oid,'inperson')
    sw=await state(p); op=next(x for x in sw['people'] if x['id']==oid)
    check('5 Existing explicit birthday wish still records acknowledgment',bool(op.get('bdayWished',{}).get(y)),op.get('bdayWished'))

    # H3.4 medicine regression: preserve symptom/category matching; wrong medicine cannot cure.
    await call(p,'recoverIllness')
    await call(p,'startIllness','cold',{'severity':'mild','symptoms':['Cough','Runny nose']})
    sm0=await state(p); cond0=sm0['healthState'].get('condition'); cid=cond0.get('id') if cond0 else None
    wrong=await call(p,'applyMedicine','stomachRelief','self')
    sm1=await state(p); cond1=sm1['healthState'].get('condition')
    check('6 Wrong medicine is rejected for non-matching symptoms',not wrong['ok'] and not await call(p,'reliefActive'),wrong)
    check('7 Wrong medicine does not cure/remove/change underlying illness',bool(cond1) and cond1.get('id')==cid,(cid,cond1 and cond1.get('id')))
    right=await call(p,'applyMedicine','coldRelief','self')
    sm2=await state(p); cond2=sm2['healthState'].get('condition')
    check('8 Matching medicine provides temporary relief',right['ok'] and await call(p,'reliefActive'),right)
    check('9 Matching medicine still does not magically remove underlying disease',bool(cond2) and cond2.get('id')==cid,(cid,cond2 and cond2.get('id')))

    check('10 H3.4 runtime has no page errors',not p.errs,p.errs)
    await p.close(); await b.close()

  failed=[x for x in R if not x[1]]
  print(f'H3.4 focused: {len(R)-len(failed)}/{len(R)} passed')
  raise SystemExit(1 if failed else 0)

asyncio.run(main())
