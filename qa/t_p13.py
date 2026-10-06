from harness import *
async def C(pg,fn,*a): return await T(pg,"call("+",".join([json.dumps(fn)]+[json.dumps(x) for x in a])+")")
async def M(pg,code): return await pg.evaluate("c=>__LIFE_SIM_TEST__.mutate(c)",code)
async def open_profile(pg,pid):
    await T(pg,"call('closeChoiceModal')"); await T(pg,"openTab('people')")
    b=await pg.query_selector("[data-people-filter='all']")
    if b: await b.click()
    await pg.click(f"[data-profile-open='{pid}']"); await pg.wait_for_timeout(80)
LAYOUT="""()=>{const m=document.querySelector('.modal:has(.pf)'),c=document.querySelector('#choice-content');const cols=s=>getComputedStyle(document.querySelector(s)).gridTemplateColumns.split(' ').length;
 const over=[...c.querySelectorAll('.pf-tile,.pf-metric,.pf-strip,.pf-head')].filter(e=>e.scrollWidth>e.clientWidth+1).length;
 const blank=[...c.querySelectorAll('.pf-grid')].some(g=>{const n=g.children.length,k=getComputedStyle(g).gridTemplateColumns.split(' ').length;if(k<=1)return false;const last=g.lastElementChild;const spans=getComputedStyle(last).gridColumnStart==='1'&&getComputedStyle(last).gridColumnEnd==='-1';return n%k!==0&&!spans});
 const ask=document.querySelector('.pf-ask');let askOk=true;if(ask){const r=ask.getBoundingClientRect();const el=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);askOk=!!el&&(el===ask||ask.contains(el))}
 return {pd:cols('.pf-sec .pf-3'),met:cols('.pf-metrics'),soc:cols('.pf-2'),overX:c.scrollWidth>c.clientWidth+1,pageX:document.documentElement.scrollWidth>document.documentElement.clientWidth+1,tilesOver:over,blank,askOk,modalW:m?m.getBoundingClientRect().width:0}}"""
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path=CHROME); errs=[]
    pg=await new_page(b,1366,1000); await new_life(pg); await T(pg,"setAge(15)")
    s=await st(pg); fr=[x for x in s['people'] if x['role']=='friend' and x.get('npcId')]; mom=await C(pg,'familyByRelation','mother')
    f=fr[0]
    await M(pg,f"const p=S.people.find(x=>x.id==='{f['id']}');p.rel=30;p.trust=40;p.goalsKnown=false;p.relStatusKnown=false;p.observedTraits=[];p.tier='Acquaintance';p.metAt=null;p.metVia=null;p.introducedBy=null")
    await open_profile(pg,f['id']); head=await pg.inner_text('.pf-head'); full=[x for x in (await st(pg))['people'] if x['id']==f['id']][0]; fn=full.get('fullName') or full['name']
    vis=await pg.inner_text('#choice-overlay .modal')
    check('19.1/19.2/19.3: one header — name (age) followed by a relationship badge, no "|"', '|' not in head and await pg.inner_text('.pf-head .rel-badge')==await C(pg,'relationshipDescriptor',f['id']) and vis.count(fn)==1, head[:120])
    bg=await pg.evaluate("getComputedStyle(document.querySelector('.pf-head .rel-badge')).borderRadius"); check('3: the relationship is a rounded pill badge', bg.endswith('px') and float(bg[:-2])>=20, bg)
    labels=await pg.evaluate("[...document.querySelectorAll('.pf-sec')][0].innerText")
    check('19.5/19.6: Personal details = Birthday, Zodiac, Looks, Health, Smart, Mood only, as tiles', await pg.evaluate("[...document.querySelectorAll('.pf-sec')][0].querySelectorAll('.pf-tile').length")==6 and all(k in labels for k in ['Birthday','Zodiac','Looks','Health','Smart','Mood']) and not any(k in labels for k in ['Right now','Romantic','Interests','Life goals']))
    soc=await pg.evaluate("[...document.querySelectorAll('.pf-sec')][1].innerText")
    check('19.7/19.8/19.9: Social & lifestyle is a separate section with Right now, Romantic status, Interests, Dislikes', 'SOCIAL & LIFESTYLE' in soc.upper() and all(k in soc for k in ['Right now','Romantic status','Interests','Dislikes']))
    check('7: no "Relationship status" label anywhere; badge = relationship to player, Romantic status separate', 'Relationship status' not in vis and 'Romantic status' in vis)
    strips=await pg.evaluate("[...document.querySelectorAll('.pf-strip')].map(s=>s.innerText)")
    check('19.10: Life goals is its own full-width strip', any('LIFE GOALS' in x.upper() for x in strips))
    check('3A.5 rule kept: no Ask button for a mere acquaintance (no dead or premature action)', await pg.query_selector('.pf-strip .pf-ask') is None)
    hk=[x for x in strips if 'HOW YOU KNOW THEM' in x.upper()][0]
    check('19.12/19.13: How you know them is one summary; unknown pieces omitted (no "Unknown", no "How met")', 'Unknown' not in hk and 'How met' not in hk and 'known since age' in hk, hk)
    check('4 gating: weak acquaintance → romantic status, life goals, personality Unknown; love interest Unknown in the header', 'Romantic status\nUnknown' in soc and 'Personality / Lifestyle\nUnknown' in soc and any('Unknown' in x for x in strips if 'LIFE GOALS' in x.upper()) and 'Love interest: Unknown' in head)
    await M(pg,f"const q=S.people.find(x=>x.id==='{f['id']}');q.rel=50;q.trust=45;q.conflict=0"); await open_profile(pg,f['id'])
    check('19.11: for a Casual Friend the Ask action sits inside the Life goals strip', await pg.query_selector('.pf-strip .pf-ask') is not None)
    await M(pg,f"S.people.find(x=>x.id==='{f['id']}').trust=70"); await pg.click('.pf-ask'); s2=await st(pg)
    check('19.11/19.18: Ask about their plans is a real action (with enough trust the goal becomes known)', [x for x in s2['people'] if x['id']==f['id']][0].get('goalsKnown') or not (full.get('goals')), [x for x in s2['people'] if x['id']==f['id']][0].get('goalsKnown'))
    # composed meeting summary from stored data, data untouched
    g=fr[1]; await M(pg,f"const p=S.people.find(x=>x.id==='{f['id']}');p.metAt='at summer camp';p.metVia='met during swimming practice';p.introducedBy='{g['id']}'")
    await open_profile(pg,f['id']); hk=[x for x in await pg.evaluate("[...document.querySelectorAll('.pf-strip')].map(s=>s.innerText)") if 'HOW YOU KNOW THEM' in x.upper()][0]
    gname=(g.get('fullName') or g['name'])
    check('9: How you know them composes real data — "Summer camp · met during swimming practice · introduced by … · known since age …"', 'Summer camp · met during swimming practice · introduced by '+gname in hk and 'known since age' in hk, repr(hk)+' | expected introducer: '+gname)
    pp=[x for x in (await st(pg))['people'] if x['id']==f['id']][0]
    check('9: the stored meeting data is preserved (metAt, metVia, introducedBy unchanged)', pp['metAt']=='at summer camp' and pp['metVia']=='met during swimming practice' and pp['introducedBy']==g['id'])
    # long text wraps cleanly
    await M(pg,f"const p=S.people.find(x=>x.id==='{f['id']}');p.goalsKnown=true;p.goals=['artSchool','travelWorld','startBusiness','doctor'];const n=S.npcs.find(x=>x.id===p.npcId);if(n){{n.interests=['Photography','Skateboarding','Theater','Video games','Chess','Swimming'];}}p.metVia='met during an extremely long and rainy regional swimming championship weekend'")
    # widths
    for w in (1280,1366,1440,820,480):
        await pg.set_viewport_size({'width':w,'height':900}); await open_profile(pg,f['id']); L=await pg.evaluate(LAYOUT)
        exp=(3,3,2) if w>=1000 else (2,2,2) if w>600 else (1,1,1)
        check(f'13/14/20 @{w}px: columns {exp} (details, metrics, social); no modal/page overflow; no value escapes a tile; no blank grid cell; Ask clickable', (L['pd'],L['met'],L['soc'])==exp and not L['overX'] and not L['pageX'] and L['tilesOver']==0 and not L['blank'] and L['askOk'], (w,L))
    await pg.set_viewport_size({'width':1366,'height':1000})
    # representative profiles render cleanly
    s=await st(pg); best,close=fr[2],fr[3]
    await M(pg,f"const b=S.people.find(x=>x.id==='{best['id']}');b.rel=92;b.trust=88;b.respect=70;b.reliability=80;b.conflict=0;const c=S.people.find(x=>x.id==='{close['id']}');c.rel=80;c.trust=70;c.conflict=0;S.romance.partnerId='{fr[4]['id']}'")
    kinds={'family (mother)':mom,'acquaintance':fr[5]['id'] if len(fr)>5 else fr[1]['id'],'casual/known':f['id'],'close friend':close['id'],'best friend':best['id'],'partner':fr[4]['id']}
    for k,pid in kinds.items():
        await open_profile(pg,pid); L=await pg.evaluate(LAYOUT); head=await pg.inner_text('.pf-head'); txt=await pg.inner_text('#choice-content')
        nm=[x for x in (await st(pg))['people'] if x['id']==pid][0]; nmv=nm.get('fullName') or nm['name']
        ok=not L['overX'] and L['tilesOver']==0 and not L['blank'] and txt.count(nmv)==1 and '|' not in head
        if k.startswith('family'): ok=ok and 'Romantic status' not in txt and 'Love interest' not in head and 'Mother' in head
        if k=='partner': ok=ok and any(x in head for x in ['Boyfriend','Girlfriend','Partner'])
        check(f'20: {k} profile renders cleanly (one name, badge, no overflow/blank cell; family hides romance fields)', ok, (k,L,head[:80]))
    m=await pg.evaluate("[...document.querySelectorAll('.pf-metrics .pf-metric')].map(x=>x.innerText.replace(/\\s+/g,' '))")
    check('10/19.14: six metric tiles (Closeness, Trust, Fun, Respect, Reliability, Conflict) with value and bar', len(m)==6 and all(any(k in x for x in m) for k in ['Closeness','Trust','Fun','Respect','Reliability','Conflict']) and await pg.evaluate("document.querySelectorAll('.pf-metrics .pf-bar em').length")==6, m)
    icons=await pg.evaluate("[...document.querySelectorAll('#choice-content svg.ico use')].map(u=>u.getAttribute('href'))")
    syms=await pg.evaluate("ids=>ids.every(i=>!!document.querySelector(i))",icons)
    check('12: icons come from the game\'s own SVG sprite and every referenced symbol exists (no external library)', icons and syms and not await pg.evaluate("!!document.querySelector('#choice-content img, #choice-content link')"))
    check('16: nothing hard-coded from the mockup (no Samuel Hughes / Nora Hughes)', 'Samuel Hughes' not in await pg.inner_text('#choice-content') and 'Nora Hughes' not in open('/home/claude/proj/game.js').read())
    errs+=pg.errs; check('P1.3: no JS errors', not errs, errs[:3]); await b.close()
asyncio.run(main())
