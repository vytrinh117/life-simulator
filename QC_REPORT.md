# Phase 3C — checkpoint 3C.1 QC

Status: **3C.1 COMPLETE / Phase 3C INCOMPLETE**

Focused and directly relevant regression results:

- `qa/t_3c1.py`: **22/22 PASS**
- Phase 3B focused (`t_3b1`–`t_3b4`): **76/76 PASS**
- H3 decision integrity (`t_h31`, `t_h32`): **25/25 PASS**
- `qa/t_people.py`: **14/14 PASS**
- `qa/t_profile.py`: **24/24 PASS**
- directly relevant total: **161/161 PASS**
- `node --check game.js`: PASS

The legacy People/Profile suites were run through a temporary local compatibility harness because the shipped harness contains environment-specific paths. The original `qa/harness.py` was restored afterward and is not modified by 3C.1.

3C.1 intentionally does not claim completion of the 3C.2 inbox/call/video notification overhaul, 3C.3 smartwatch gameplay, 3C.4 group chats, or 3C.5 full regression/fuzz.

# QC Report — Life Simulator v7.3 (complete: batches A → V2 on top of v7.2 phases 1–5b)


## Phase 3B Final QA — 3B.5 COMPLETE

Phase 3B finalization was run from the 3B.4 checkpoint with H3 already complete. The final pass covered focused 3B/H3 behavior, HOTFIX-P1/People/Profile/Friendship, directly relevant Phase 3A/2A/2B regressions, save/reload, migration idempotence, and randomized romance-state fuzz at teen/older-teen/adult stages.

**Phase 3B focused:** 76/76 PASS (`t_3b1` 13/13, `t_3b2` 17/17, `t_3b3` 23/23, `t_3b4` 23/23).  
**H3 focused:** 50/50 PASS.  
**3B final acceptance supplement:** 5/5 PASS.  
**3B final fuzz:** 13/13 PASS across 600 randomized in-browser operations (ages 14, 17, 25), including save/load and repeated-migration idempotence.  
**HOTFIX-P1:** 74/74 PASS after one Phase-3B descriptor fallback regression was repaired.  
**Phase 3A:** 13/13 PASS.  
**People/Profile/Friendship:** 14/14, 24/24, 17/17 PASS.  
**H2:** 22/22 PASS.  
**Phase 2A direct coverage:** `t_2a6` 13/13, `t_health` 23/23, `t_med` 15/15 PASS.  
**Phase 2B direct coverage:** `t_family2` 22/22, `t_family` 13/13 PASS in the final run.  
**Save/reload + migration:** `t_commit` 26/26 and `t_regress` 16/16 PASS.  
**Updated lifecycle regression:** `t_rst` 44/44 PASS.

Final QA found one genuine Phase 3B regression in HOTFIX-P1 Profile integration: a valid People record could receive a blank relationship badge when no persistent `friendStatus` string was present yet. `src/modules/romance3b1.js` now falls back to the canonical friendship tier while preserving romantic-partner / Ex precedence. P1/P1.2/P1.3 all pass after the repair.

The existing legacy `t_romance.py` remains **47/49**: the two failing Valentine/date-scene assertions are the same pre-existing failures documented from the 3B.2–3B.4 baseline. School/University suites (`t_sch`, `t_schoolyear`, `t_uni`) still expose unrelated pre-existing failures; their implicated modules were verified byte-identical to the H3 baseline and were not scope-crept into Phase 3B. Long Playwright suites `t_dev`, `t_hij`, `t_lmpq`, and the legacy UI round-trip `t_fuzz` exceed the available execution window under the portable compatibility setup; their test strength/loops were not reduced.

Temporary browser/path compatibility changes used only to execute legacy QA were fully restored. The shipped `qa/harness.py` is unchanged from the 3B.4 baseline. Phase 3B final acceptance criteria are **24/24 verified**. Phase 3C was not started.

Final build verification: `node --check game.js` PASS; two consecutive `tools/splice.py` builds produced byte-identical `game.js` SHA-256 `b643a7136214beddd9f9332e67c3a3b7175e33290c4a6581e222154c850cb7f6`; `style.css` remains the 3B.4 baseline SHA-256 `801ca0d091146469420d32800e274bd14f3f3b8968f7ac567609dbba7d61f16d`.

## Method
The v7.1 report marked features PASS when buttons were wired. Real play still exposed lifecycle bugs, so this QC was redone **from the player's perspective**. Every check drives the real game in headless Chromium (`index.html` + `game.js`) and follows the full lifecycle: **create → display → interact → resolve → leave the active UI → persist after reload → never reappear**.

The two confirmed bugs were reproduced with the **original v7.1 code**, and those exact saves are used as fixtures (`qa/fixture_*_v71.json`).

**Result (Hotfix P1 COMPLETE — final build): 1,272 checks passed, 0 failed — 48 suites (all project suites + `t_p1`, `t_p12`, `t_p13`). Fuzz at ages 14 and 25 with the Profile-render invariant: clean. Earlier intermittent items did not recur in this run and remain listed, not claimed fixed.** The QA harness runs with `?qa=1` and a default US birthplace; `t_creator.py` runs in normal player mode; the `qa/` scripts use the development environment's absolute paths.

| Suite | Checks | Covers |
|---|---|---|
| `t_regress.py` | 16 | §50 kindergarten regression, v7.1 exam/calendar mismatch repair |
| `t_exam.py` | 34 | §51 take exam, §52 missed exam, make-up grant/deny branches |
| `t_day.py` | 29 | §121 Next Day, sleep/nap, school-day windows, homework lifecycle, kindergarten auto-decision, invitation expiry |
| `t_commit.py` | 24 | Club attendance/warnings/removal, contest attendance/no-show, absence → caregiver chain, Age Up year simulation |
| `t_balance.py` | 1 | Six consecutive Age Ups: grades/attendance stay plausible |
| `t_ui.py` | 50 | Education screen at 7 viewports, hero content, modals |
| `t_items.py` | 50 | §53 item tests, phone sync, slots, multiple ownership, books/rereading, diminishing returns, perishables, gifts, store, card fields, v7.1 item migration |
| `t_jordan.py` | 13 | Player's real v7.2 save: loads cleanly, primary-school name fixed, kindergarten graduation 2010, assessments de-stacked, interactive school day (check-in at 8:00, period timing, blocked home actions, lunch, dismissal) |
| `t_holidays.py` | 57 | §54 holiday dates by region (incl. Lunar 2007 VN/CN, fallback 2051, Easter ×4, UK/AU/CA/KR variants), one-time triggers, Halloween activities, seasonal shop, month grid/navigation/agenda/markers, forgotten Mother's Day, planner at 1920/1366, key switching, page height, no overflow at 1366/390 |
| `t_theme.py` | 30 | §55 default Light; Light/Dark/Life × 4 screens: no neutral-dark hardcoded surfaces in light themes and WCAG contrast ≥ 4.5:1 for body, headings, muted text, buttons, primary, active tab, tags, nav, needs, hero; persistence across reload (creator and in game); not stored in the save; quick toggle; Auto follows OS dark/light; nav and needs use the SVG icon set |
| `t_social.py` | 50 | §122 111-NPC name stress test (unique IDs, no duplicate full names, ≥35 distinct first names, sibling surnames, varied conventions, persistence after reload); VN family-first order and parents' own surnames; player-save name migration; §102 availability (school, night, busy modal with alternatives); §94–95 RSVP (accept with reason, calendar, attend with story, early cancel vs no-show, next-day confrontation, NPC invitation with deadline, Maybe expiry); §96 strict household denial with negotiate/defy; §120 club QC (open sign-up, decline, tryout scheduled, weak fail with component reason, recovery date, retry, diminishing practice, strong success with ladder rank, reputation, outcome history, resolved thread, election opponents, campaign, win sets Captain, loss with NPC winner and recovery, reload persistence, Journal, identity) |
| `t_romance.py` | 48 | **Safety**: 16-year-old cannot romance a 26-year-old (logic and UI), intimacy refused for minors at the logic level, minor romance menu without intimate options, minor date endings without kiss/invite, minors cannot sneak a partner over, unknown actions ignored safely; adult consent: a "no" is respected with trust up and no penalty, a mutual yes fades to black. **§119 Prom**: season, reject with reason, reason in outcome history, already-has-a-date refusal, ask another → crush accepts, free prep, hero on prom night, 6-stage night resolves, memory, no Due afterwards, NPC asks, "need time" expires and they ask someone else, alone / friends / skip (with alternative evening) all resolve. Dates/Valentine scenes; gifts (loved / already had one / awkward); neighborhood events with households and reputation; friend group; rival creation and evolution; NPC–NPC dating; narrated relationship actions; end-of-year awards; sneaking discovery |
| `t_creator.py` | 35 | Player mode: Surprise me fills all; each per-field Random changes only its field (name, birth date, place, gender, attraction, wealth, home, personality, talents); horoscope has no manual input, follows the birth date, and is correct at 6 cutoff dates; birth date limited to the current year, random dates in the current year, a typed 2005 date starts in the current year; city disabled until a country is chosen; country fills its cities; place stored as "City, Country"; no free-text birthplace; Fill the rest keeps typed values; Hanoi → VN profile; phone usable at 13; legacy message linked by ID and reply affects that friend (via the real Messages app path); person-window tiles on one row and memory dates on their own line. Run 4× consecutively to check stability |
| `t_schoolyear.py` | 55 | Grade 1 waits for the first day of school (not the 6th birthday), kindergarten not closed early; US school-day calendar (Thanksgiving, winter, New Year, semester break, spring break, a normal day, summer); Semester 1 report card; Semester 2 start with new exams; next year → Grade 2; birth after the cutoff starts a year later; KR / JP / AU / VN year starts; VN Tết week off; Grades 7–12 correct on the first school day; no prom in Grade 7; Junior Prom / Prom mid semester 2 on a Saturday from day one; elections closed in Grade 7, open in Grades 8–12; calendar 2 years ahead and next year's prom planned; graduation after Grade 12; migration keeps the grade, then exactly +1; prom pairs always two-way; neighbors can be asked; a close-ish friend near prom night usually says yes; meeting 0–2 people on outings; a real mall trip can introduce someone; Attendance tab |
| `t_growth.py` | 28 | B: Sports talent +25%, Curious +15%, the same practice grows faster with a talent, Traits & talents card, ★ markers, result line names the bonus. C: crossing 10 points → Level 2 with notification and milestone; higher levels slower but never zero; skills and reputation shown in levels. D: 30 min < 1 h < 3 h; grade gain ≤ 2.0 and one decimal; skill gain 1–5; 4th session in a subject blocked, other subjects still allowed; lamp + workbook bonus; Advanced exercises once per day; the same grade gives different real exam scores depending on needs, mood and stress. E: mood reasons (hungry, lonely, stressed, exhausted, success); low mood/needs lower focus; mood drifts toward life conditions; Mood card on Home. F: relationship gains 100% → 65% → 40% → blocked; needs exempt; same-skill practice capped at 3 |
| `t_hij.py` | 39 | I: New York cold in January and warm in July; snow in a New York winter but never in July; no snow in Miami or Ho Chi Minh City; typhoons only in Hanoi's season; tomorrow usually matches the forecast; weather in the Life Planner and not in World; extreme weather closes school (no obligation, assessment rescheduled, announced); severe weather → caregiver asks, staying home is excused; outdoor outing blocked in a storm. H: random lateness only sometimes, always with a reason, reasons tracked; 10 absences → teacher call, 20 → parents' meeting, 35 → formal warning, 45 → hearing (probation or transfer); behavior < 30% → call home; conference notice + calendar each semester, a hidden notice resolves (never left open); asking the night before; really sick → usually approved; strict parents usually refuse "don't want to go". J: menu with 5 options; time passes with a summary; stops on an assessment morning; every school day on autopilot attended; refuses to start while an invitation waits; summer "End of break" reaches the first school day, stopping for decisions on the way |
| `t_knx.py` | 44 | K: tier names, level-up and drift-down notices, tier on cards; no free time in school hours, free after school, "Free …" on the calendar; a close rested friend mostly says yes; a drained battery gives reluctant/maybe/no; asking too often backfires; unavailable times → counter-offer; UI: day → time chips, "both free" offered, two times → a plan or counter-offer (accepting adds closeness); a no-show drops reliability; "I'm busy" can be discovered; group outing with members. N: everyone has a birthday; 3-day reminder; wish button on the day, closeness up; forgetting a best friend −8; close friends' party invitation; friends' gifts and texts on your birthday; new own-birthday options. X: incoming message in a thread; 3+ contextual replies + write-your-own; listening helps, the advice talk continues; custom text sent as written; left on read costs a little; incoming call choices; answering distress matters; declined → missed call + voicemail; past curfew → parent calls; calling someone asleep → no answer; class confiscation and lockout; Grade 1 smartwatch; video call with grandparents |
| `t_lmpq.py` | 36 | L: teen curfew 22:30 / 23:00 / midnight by strictness; a sleepover at 15 → parents notified, not asked; every activity offer has ≤ 2 days to decide. M: summer window open in July; Activities shows programs + casual practice; enrolling creates the session schedule; a session takes the hero; first day brings 1–2 teammates; casual practice grows slower than a coached session; 3 missed in a row → dropped; full program → final result + milestone; summer job pays per shift; no programs in October. P: baking makes a batch of homemade treats and grows Baking; heart cookies only in Valentine season; Wrap button; wrapped item; recipient opens it; homemade treats loved by a close friend; one main Valentine's plan; anonymous admirer note; one per person per year. Q: no family outing during school; an outing takes hours and energy (same day); the proposal shows destination/transport/dates/length ≤ 30 with Yes/No/Tomorrow; trip school days excused; away on the trip; home again with a memory; staying home → relative (age 9) or home alone (15); "tomorrow" re-asks; ≤ 3 proposals per year |
| `t_rst.py` | 42 | R40 (teen): admitting you like someone → at least a one-sided crush; going out; "official" only after time together; official with a milestone; In love and Super in love happen automatically; promise ring at 16+ → Serious; SAFETY: no adult step for a minor and adult steps refused in logic; breakup resets the stage and asks about the ring; no ring under 16. R40 (adults): move in, propose → engaged, wedding on the calendar → married, adoption → the child arrives. R59/60: ≥ 28 peers; NPC families in the person window; matchmaking creates a two-way couple; breakup with a reason clears both; couples go to prom together; a crush dating someone else is a real situation. S: two columns (history wider on the left), memories filtered, full log kept, partner card shows the love stage, no matchmaking on your partner. T: no Growing Up tab, Daily Life → Independence, House rules + Love life under Family |
| `t_biz.py` | 16 | Type dropdown with all six kinds; three at once; a fourth refused; no duplicate type; close / closed cannot sell / reopen; shifts sell and earn; restock adds stock; severe weather stops outdoor selling; retiring frees a slot with a final tally; yard sale lists real items; sold yard items leave inventory and pay; an old single stand converts with stock and revenue kept |
| `t_uni.py` | 29 | Senior year = Grade 12; counselor in semester 1; a 2-month application window at the start of semester 2; loan window mid-semester 2; list ≤ 10; no applying before the window; the essay improves; 10 applications max; loan refused outside its window and approved inside (interest-free); top grades → top 3 → merit scholarship ≥ $10k; decisions for every application; email delivery with a laptop; acceptance → family celebration; enrolling; high school ends after Grade 12; Education stays visible; university year 1 in the fall with tuition; University panel; studying raises GPA; dorm for students; rent on the 1st; eviction after 2 missed months; degree after 4 years; no moving out before 18; rejected everywhere → comfort from a close family |
| `t_work.py` | 27 | Degree → start above Intern (Associate from a top school); manager and coworkers are people; weekday workdays 9–5, none on weekends; at 9:00 the workday takes the hero with Go to work; attending → points, manager closeness, time to 5 PM; late after 9:15 noticed; sick day used and excused; leave today and tomorrow; no-show by 11:00 (−10 performance); no promotion before a full bar; promotion with a salary increase; 60-day cooldown; raises every 6 months only, then possible; the ladder tops out at CEO; salary on the 1st prorated for unpaid days; student loan repaid from salary; work panel; 3 no-shows → fired; no degree → Intern; Fast Forward goes to work; quitting cancels workdays; teen part-time unchanged |
| `t_sch.py` | 25 | Rank 1 → Valedictorian and $15k; tying the #1/#2 classmates → tied ranks (competition ranking); tied #1 → Co-Valedictorian with the top award; rank 2 → $12k + Salutatorian; rank 3 → $10k (run when classmates' averages are far enough apart to place between them); outside the top 3 → top-10-school $5k; the senior scholarship only mid-semester 2; separate essay; application sent; results even with no university applications; an outstanding valedictorian → 100% with a reason; honors count; tiers follow profile strength (≥ 4 distinct incl. 100 and none); full scholarship covers tuition with the rest as a ≤ $3k stipend; scholarships → parents order; semester GPA and cumulative GPA; a 2-week window after the semester; results 2 weeks later; Dean's List + need grant applied to next semester; GPA < 3.0 drops one tier; University panel |
| `t_o.py` | 14 | A friend's invitation shows from (with tier), what, where, when and answer-by, all visible on screen; an incoming call is "right now, your phone"; neighborhood events show who, where and when; a family trip proposal shows destination, dates and answer-by; a prom invitation shows venue and date; 2–3 friend groups with no overlap; one plan button per group; a group outing uses that group's members; romance on by default for teens; turning it off removes romance options; the toggle is in Family; it cannot be turned off while in a relationship |
| `t_campus.py` | 21 | 12 unique tuitions; fees differ; the same tier differs in tuition and admission bar; tuition follows prestige; elite facilities; the art school has studios but no stadium; the community college has no dorms or Greek life; the brochure shows every section; missing facilities marked; the campus gym builds fitness; no pool → refused; dorm rent is the school's own; Greek Row parties can introduce people; clubs from the school's list; the panel's campus actions match the school; no dorm at the community college; the annual alumna concert and its memory; Learn more on all 12 schools |
| `t_major.py` | 14 | CS at a tech school with a Programming talent → +30% and +10%; no match → no bonus; a talent match at a school not known for it → +30% only; the panel asks for a major and marks talent matches ★; declaring; one change in the first year; a matched major studies ~40% faster; a second change refused; no change after year 1; the degree records the major; CS fits developer, not designer; a matching degree starts one level higher; the graduated panel shows the major |
| `t_ident.py` | 20 | Names map to gender (and unisex names stay open); Mom female, Dad male; everyone has gender and love interest; NPC genders match their names; love interests varied but mostly opposite-gender; "Not sure yet" only under 16; the card line shows age, gender and "Interested in: Unknown"; asking with low trust is refused, with high trust they tell you; becoming Good Friends reveals it; the person window shows it; confessing to someone not into your gender gets a kind no (at most a one-sided crush) and reveals their interest; compatible interest is detected; under 13 shows age and gender only; incompatible NPCs do not become a couple, compatible ones can |
| `t_context.py` | 28 | Term phases (summer, named winter break, weekends in term); a full summer walked day by day: no homework, no assessments, no school days, no club sessions, no new contests; event discovery blocked with the reason and resume date; no teacher study in summer; summer programs still enroll; at home 9 PM → no teacher (really blocked, no time passes); at school in hours → available; after 4:30 PM → gone; living at home → household messages; moved out → own household, no household commands, social messages instead; a household message queued before moving out arrives as social; no chores (no pay, no time) with the reason; a warm reply raises family closeness |
| `t_events.py` | 22 | Annual events publish themselves as Upcoming with open < close < event dates; Math Olympiad in semester 1 ~week 9 on a school day; once per year; Find event no longer creates them; registration opens with one notification; Not participating → no penalty; never registered → not missed; doing nothing → Registration Closed with exactly one notification, cleared after ~2 days, record kept; register; withdraw cancels the calendar entry; registered and absent → No-show; legacy Missed converted; throttle over 60 days: ≤ 3 per 7 days, same friend ≥ 5 days apart, sleepovers ≥ 25 days apart, a natural total |
| `t_ff2.py` | 18 | Term targets (next term, start of year, no "season"); summer target = first school day; the run pauses on real interruptions; every pause keeps the original target; the original target is reached; soft options (respond/decline/decide/decide for the rest); hard options (play/simulate/cancel); after "decide for the rest" invitations stop pausing; grouped summary; simulated hard items leave nothing stale; Stop & respond keeps the session paused; the button shows the paused target; the paused session survives save/reload; Continue really continues to the target; Cancel ends early; Next month simulates ~a month incl. school; routine high vs low shows in the summary; no JS errors on any page |
| `t_health.py` | 23 | Health tab at ages 3/6/12/16 with age-appropriate rows; Looks/Smart for player (in Identity) and all NPCs; stable across reload; Health ≠ Energy; Random Surname/Looks/Smart change only their field (20× each); creator values used (surname = family name); a forced mild cold with symptoms, unknown diagnosis, lower focus, morning energy drain, rest passes time, telling a parent, survives reload, panel shows it, recovers over days with history; 14-day cooldown; risk scales with health/sleep/stress; 0–3 illnesses in 120 healthy days |
| `t_med.py` | 15 | Not sick → no benefit; wrong medicine → none; suitable → relief, not cured; no repeat while active; relief helps focus; an 8-year-old cannot self-medicate, a caregiver can; Pharmacy category in the store; buying costs money and adds 6 uses; not sick → no use spent; sick → one use spent, still ill; immediate reuse refused; last use removes the item; an 8-year-old's parent gives it |
| `t_nurse.py` | 23 | Age-11 acceptance core: term school day; no nurse from home; feeling worse in period 2; teacher → nurse narrated; condition becomes known; NURSE PASS for periods 2–3, excused not skipped; nurse office UI; rest passes real time; not better → recommend home; caregiver picks up, location home; day excused ("Sent home sick", no left-early); no behavior loss; club session excused; afternoon quiz → one make-up; parent waits while the nurse's dose works, later buys medicine into the inventory; relief, not cured; reload keeps everything; recovery over days; nothing stale; not sick → back to class without a pass |
| `t_care.py` | 22 | Genuine sick morning → excused sick day; fake believed → caught later (trust down); fake refused; mild → no hospital (redirected, no time); clinic for moderate → known, follow-up, not cured; recovery cancels follow-up; severe → hospital (better, prescription, follow-up); follow-up attended; missed follow-up resolves; adult pays by coverage; no money → paid clinic refused, community clinic works; hospital never refused → bill; old Checkup no instant cure; legacy illness flag |
| `t_2a6.py` | 13 | Sickness is a mood reason; Mood drops clearly while Happiness barely moves; recovery raises the Mood target; Mood card shows both; Troublemaker 0–100 without levels; a sick day changes neither Troublemaker nor Behavior; emergency = hard FF interrupt; a mild cold in a skipped month is summarized under Health with nothing stale; acceptance start at age 11 |
| `t_bday.py` | 16 | Age 2 family-only; age 5 no "go out", forcing it is refused, the Chloe/Jade regression (no "You celebrate out with… karaoke"); age 7 caregiver-organized outing with supervision and an age-appropriate activity, ends at home; age 8 without friends → no friend options, no invented guests; age 10 strict refusal → you don't go, three alternatives, accepting → family dinner; age 11 approved → dropped off and picked up; age 15 go out with friends; age 18 independent; friends can decline with a reason |
| `t_h2.py` | 22 | Legacy anonymous events not eligible; 40 forced random events, none anonymous; queueEvent rejects an actor-less invitation; acceptance (age 7, Olivier Fournier, close friend, birthday in 5 days): invitation references his ID, FROM/WHAT/WHERE/WHEN/ANSWER BY, party on his real birthday, no "Someone your age" on screen, no duplicates, identical after reload, accept (caregiver agrees) → his plan on the calendar, no other friend affected, still in People; caregiver refusal → plan does not happen and the log explains why; decline affects only him; old anonymous birthdayInvite/friendInvite retired without penalty, hero cleared, no return after reload; a matching real birthday becomes a proper invitation; missing-person invitation invalidated safely; a normal friend invitation has full meta |
| `t_family.py` | 13 | 30 new families: grandparents at home only in some, in the tree otherwise; sibling counts 0/1/2+; brothers and sisters; gender-matched names; aunts/uncles never at home; maternal surnames; caregiver always in the household; sibling identities persist; Household + Family tree UI; an old save keeps its grandmother at home and every member; old siblings get a gender once |
| `t_family2.py` | 22 | Baby eligible → news → born on time as a named, gender-matched younger sibling with a milestone; no immediate second baby; none when the family is complete or parents are past the range; sibling requests (real person, four answers); yes → time passes, closer; kind sibling accepts no; later → reminder; stubborn sibling negotiates (deal → closer + chore help; still no → hurt); ask a parent → yes / not today; lend → returned; House rules in the left dashboard, not in Family, own rules when living alone |
| `t_people.py` | 14 | Compact card content, no numbers on the card, family-first order, Unknown private info, core profile fields, revealed when close, friendship / official milestones without duplicates, Relationship log + Milestones, milestones exclude routine, Conflict tile inside the window with all four borders, persistence |
| `t_friend.py` | 17 | Legacy tier migration; Stranger; no day-one Best/Close friend; time + shared days → Close, + milestone → Best; respect, conflict and trust gates; 50-friend network drift without deleting or demoting close friends; Acquaintances still possible; Old Friend after months; Reconnect keeps the same person |
| `t_narrative.py` | 20 | Real tryout/exam/contest outcomes drive follow-ups (not selected, real score, missed, withdrew); no follow-up before the outcome; postponed exams wait; one follow-up per day; no duplicates; max 3 open; resolved threads never re-asked; stale expiry; persistence; UI; support evidence → milestone |
| `t_profile.py` | 24 | Weak acquaintance: personality / life goals / relationship status Unknown, no parents; header order; Busy learned from repeated counter-offers; Busy under Personality vs a separate "Right now" row; more traits at Casual Friend; goals hidden at low trust, real goal at enough trust, no goal stays Unknown; NPC couple hidden from a weak acquaintance and in the person window, known when close; own partner known (Girlfriend); parents when known; Mom descriptor; persistence; casual/close milestones without duplicates on wobble; Friendship faded once; Reconnected + Became close again after real separation; legacy milestone kept; calendar party keeps its organizer |
| `t_dev.py` | 22 | Focused 3A.6 items 1–18: migration keeps traits/talents, bonuses via the canonical lists, no auto-fill over 8 months, same-action farming creates nothing (one day ×200 and 40 days of the same context), maxed skills ≠ talent, one isolated outstanding event ≠ talent, accumulated evidence → Emerging Strength story without a talent, no meters, sustained evidence → recognized talent in `S.talents` with history and milestone, caps at 5/5, persistence, idempotent migration, People/Profile intact; plus a developed trait from varied sustained behaviour |
| `t_3a7.py` | 13 | Real legacy save loads with traits/talents kept (core/recognized, not filled) and is unchanged by three reloads; rich Phase 3A state survives save→reload ×3 and repeated migrations with no duplicates; same event id counts once; first load only syncs a cached tier; Former Friend persists; core/recognized kept; descriptor stable; family excluded from active count; only new ladder labels |
| `t_p1.py` | 22 | Hotfix P1.1: unified card header, normal-case names, specific family labels from relation data (renaming-proof), child is family, gated love interest, single-name Profile header, Romantic status separate, two-column profile + metrics grid, no stretched cards / overflow at 1280–1440 px, legacy relation migration idempotent |
| `t_p12.py` | 24 | Hotfix P1.2: no Family sidebar item; People | Friend Groups | Plans; category rules (family vs relatives by relation, not residence; partner once under Closest Bonds; friends; acquaintances; past connections); Family overview + conversation + events; groups in own subtab with only real actions; Plans intact; old Family route → People › Family; no name-based family lookups |
| `t_p13.py` | 28 | Hotfix P1.3 A2 Profile: single header with pill badge (no "|"), six Personal-details tiles, Social & lifestyle tiles, Life goals strip with real Ask action (gated), composed How-you-know-them (no Unknown pieces, data preserved), six metric tiles, sprite-only icons, column counts and no overflow / blank cells at 1280/1366/1440/820/480 px with long text, representative profiles (family, acquaintance, friends, partner) |
| `t_fuzz.py` | 7 | 840 random player clicks (ages 3–17, run per age pair) with reloads, Next Day, Age Up and heavy Money & Items use; cross-system + inventory invariants every 10 steps |

## Scenarios (selected)
**§50 Kindergarten.** v7.1 save: age 6, Grade 1, "Waiting for your preference". After load: Grade 1 intact; record `Superseded` / "Primary school age reached"; absent from Home and Calendar pending lists; journal entry kept; still resolved after reload; no errors. Normal flow: a 3-year-old who never answers → "Family discussing" after 14 days → family decides 2 days later.

**§51 Exam.** At 9:00 the hero shows the Math assessment with Preparation/Skill/Sleep/Stress and a Take Assessment button, and the calendar shows `Due`. After taking it: exam `Completed` with a score, calendar `Completed`, hero cleared, gone from the upcoming strip, notification `Resolved`, school day counted as attended. It cannot be taken twice, does not reappear the next day, and persists after reload.

**§52 Missed exam.** Doing nothing from 7:00 to 12:00 gives: exam `Missed`, calendar `Missed`, hero switches to "You missed Mathematics", teacher relationship reduced, `examsMissed = 1` and the school day marked absent. After three more days the consequence has **not** repeated; the follow-up is answerable during its 3-day window and expires afterwards. A make-up exam was both granted and denied across runs; a granted make-up replaces the original record.

**§121 Next Day.** A free Saturday advances with no warnings and shows the morning summary. On an exam day, a warning modal appears; Return keeps the day, and Advance anyway gives exam `Missed` and one absence, counted exactly once, waking the next morning. Reload keeps the state. Sleeping at 9 PM reaches the next morning; sleeping at 2 PM is a nap on the same day.

**School-day windows.** "Attend" at 11 PM gives no credit (day marked Missed). Arriving at 9:20 is marked `Tardy` and returns home at 3 PM. Absences schedule a delayed school notice.

**Homework.** Assigned → Late after the due date → Missing after the late window (not Late forever). Finishing it gives Submitted / Submitted late.

**Clubs.** Joining schedules a real session; a due session takes the hero; attending counts and schedules the next one. Telling the leader beforehand is `Excused`. Repeated no-shows → warning event; 4 in a row → `Removed` with no live sessions; persists after reload.

**Contests.** Registration alone gives no result; checking in runs the competition; absence gives `No-show` / "Did not attend".

**§46 Consequence chain.** The second absence → a caregiver conversation that evening (not instantly). The choice resolves with a narrative.

**§11 Age Up.** The year summary shows realistic attendance (91–97% across runs, with unexcused/excused/late days), completed and missed assessments, make-ups and homework. No past obligation is left active.

**UI** (1920×1080, 1440×900, 1366×768, 1180×820, 820×1180, 768×1024, 390×844): no horizontal overflow; subject name and teacher never touch; Skill/Prep/Exam spaced; subject buttons never overlap; due-assessment CTA in both the card and the hero; hero never empty.

**Fuzz invariants (never violated).** Exam/calendar status always agree; no active past calendar entries; no dangling "Attending"; no exam stuck "In progress"; no active kindergarten at 6+; no open event past expiry; no active notification for a resolved exam; no homework Late for more than 4 days; the hero never points at a resolved source; no duplicate or orphaned club sessions.

**Deployment.** `?smoke=1` passes; all paths relative; `.nojekyll` and the Pages workflow unchanged; localStorage save/reload verified in tests.

**Phase 2 items (§53 and related).** Buying 3 snack packs gives one stack ×3. Eating 25% leaves 2 unopened + 1 opened at 75%; half of what remains → 37.5%; "all" eats only the 37.5% (≈11 hunger, not a full serving); only the opened unit disappears. A toy survives 120 plays, loses under 15 points in the first 10, and eventually goes Good → Worn. Art supplies decrease per session, raise art skill and fun, and are removed at 0%. The water bottle drops 600 → 500 ml, stays when empty, an empty bottle gives no water, and Refill restores 600. Phone: after 25 uses inventory and Phone page match (97/97), and still match after repair (95/95); battery drains and charges. A second phone triggers the switch/keep/sell/give choice. Two books and two bikes can be owned. Sweater + raincoat + sunglasses + backpack can be worn together; a hoodie replaces only the sweater. Reading gains over six sessions in one day: 2.5 → 1.84 → 1.21 → 0.72 → 0.18 → 0.08. A book finishes after 4 sessions and rereading yields ~half. A sandwich goes stale, then is thrown out. Giving one greeting card from a stack of 2 raises trust. Store: category filter and a quantity purchase of 3 juice boxes. Cards: snack shows "2 unopened" (no condition), phone shows condition + battery, bottle shows ml. No overflow at 1440 and 390 px. The v7.1 item save (generated with the original code) migrates to: snacks ×3 stack, makeup 84% remaining, phone 83% = 83% (was 83 vs 100), one top equipped, all items with lifecycle metadata. Unused items age over years.

**Fuzz inventory invariants (never violated).** Phone item condition = phone page; at most one item per slot; quantities ≥ 1; no used-up supplies lingering; container contents within capacity; every item has a lifecycle.

**Phase 3 assertion updates (new design, not regressions):** taking an exam now leaves you checked in at school (`Attending`) instead of at 3 PM; arriving at 9:20 leaves the clock at 9:20 (tardy) and dismissal at 3 PM finalizes attendance; school-day contests run 13:00–15:00, so the attend/absent tests reach that slot; the shop, inventory and "Use your things" sections are reached through their sub-tabs; the calendar test checks that nothing is still *waiting* (the resolved kindergarten record legitimately shows in the day agenda as history).

**Phase 5b fuzz invariants:** a romantic partner is always age-appropriate (minor ↔ minor within 2 years, adult ↔ adult); prom never stuck in season after its date; neighborhood exists for ages 3+.

**Unreproduced flake:** in one of ~6 fuzz runs at ages 14→17, the state read immediately after a scripted page reload + "Load last" returned no life. Four instrumented reruns (step-level checks) did not reproduce it; save size was ~73 KB (far below quota). It is most likely a harness timing race around reload, but it is listed here rather than claimed fixed.

**Phase 5a fuzz invariants:** accepted plans always have a calendar entry and are never in the past; no election stuck in campaign after its date; no tryout stuck scheduled after its date; no duplicate NPC full names.

**Phase 3 fuzz invariants:** `Attending` only for today's school day during school hours while at School; no NPC event created between 9:30 PM and 6:30 AM.

## Bugs found during this QC and fixed
- Phase 3A: four overlapping `.modal-stats` CSS rules plus `.row:last-child{border-bottom:0}` clipped the Conflict tile (spec 218). The first milestone migration ran lazily and duplicated "Relationship:" log lines as milestones (now at load, excluding them). Older test `t_rst` R40 mis-read a one-sided crush as mutual (root cause of its intermittent failures).
- Phase 2B (own code): duplicate function name `babyArrives` (would have silently overridden the player's-own-child arrival); sibling borrow requests read a non-existent inventory `category` field.
- Phase 2B (own code, caught by `t_family`): the new family generator read the country from game state while the new life's state did not exist yet, so no new life could start; it now reads the creator's inputs. The P3 name classifier did not know the family-name pools (female family names classified male); fixed without breaking unisex names.
- Hotfix H2: anonymous legacy `birthdayInvite`/`friendInvite` random events; the `bestNonFamily()` fallback applied invitation consequences to an unrelated friend; no per-year guard on NPC birthday invitations; the invitation FROM row used a nickname and the party place was generic ("a friend's house").
- Hotfix H1: birthday "Go out with friends" for any age ≥ 3 with a karaoke/laser-tag pool and no caregiver involvement; a second label-based birthday resolver; the old `t_knx` N47 check asserted that behavior.
- Phase 2A: no illness system existed; the Health tab was hidden until 18; "Checkup" cured instantly; studying-with-a-teacher style inconsistencies were already fixed in 1A. Found by tests during 2A: the parent bought medicine while the nurse's dose still worked; the first medicine draft assumed a non-existent `units` inventory field (corrected to the existing `remaining` % model).
- Audit correction: the Phase 0 claim that Troublemaker was displayed as a level was wrong (verified in 2A.6).
- Phase 1B part 2 (design, found by `t_ff2`): treating every non-critical event as a soft interruption paused a 4-month fast forward 40+ times. Routine NPC/neighborhood events are now background (handled by your character and listed in the summary), and soft interruptions offer "decide for me for the rest of this fast forward".
- Phase 1B part 2 (own code, found before running): the summary used a variable named `money` that shadowed the `money()` formatter; three helper names assumed in the new module did not exist (`eventChoice`, a callable `SKILL_KEY_LABEL`, a `span` inside the Fast Forward button). All corrected before testing.

**Phase 1B test updates (new behavior by design, not regressions):** `t_hij` J-checks now expect context-aware target keys (`nextTerm`/`endBreak`) and continue paused sessions instead of restarting Fast Forward; the "refuses to skip while an invitation waits" check now clears the weekly invitation budget first (the new throttle had legitimately blocked the test's invitation); the severe-weather check now retries up to 4 school days because forecasts are right only ~90% of the time by design (an older intermittent flake).
- Phase 1B: unregistered contests were marked "Missed" in three places (late registration, the deadline sweep, an unanswered caregiver request). Now "Registration Closed".
- Phase 1B: the original deadline sweep closed registration before the new lifecycle tick could notify, so no "registration closed" notice appeared. Notification now happens once for any newly closed contest.
- Phase 1B (design consequence caught by `t_commit`): removing the annual events from "Find event" left nothing to find for ages ~10+. Find event now has its own pool of smaller events.
- Phase 1A (found by fuzz): a parents' household message scheduled before moving out could arrive after moving out. The message type is now decided on delivery.
- Phase 1A (found while verifying the audit): studying with a teacher had no location/time/break restriction; school-event discovery worked during breaks.
- Phase 1A (test bugs): one check compared the clock with itself (always true) and was fixed; a hand-built follow-up in a test lacked the `status` field and was replaced with the real `scheduleFollowUp`.
- Phase P3: genders and love interests were only assigned to NPCs during the one-time migration, which ran when a new life still had no NPCs, so later NPCs had none (found by the distribution test). Assignment now runs on every reconcile; only the one-time romance and couple migration is flagged.

**P3 test updates (new rules or test bugs, not game bugs):** `t_rst` matchmaking now uses two NPCs whose love interests match (random NPCs may legitimately be incompatible); `t_o` accepts a friend's nickname in "From" (close friends are shown by nickname); one `t_ident` check that always passed (`or True`) was replaced by a real one.
- Phase B2 (test flakiness, not game bugs): in `t_sch`, the "honors count" check read the profile after days of skipped time had lowered grades below #1 (it now sets the grade right before reading); and the tie checks rounded classmates' averages with Python's banker's rounding while the game uses `Math.round` (x.x5 cases differed). The test now rounds exactly like the game.
- Phase B1 (test update, not a bug): two `t_sch` stacking checks used the old fixed tuitions ($12,000 / $28,000). They now read each school's tuition from the game data.
- QA tooling (important): `t_fuzz.py` silently ignored any starting age outside its built-in list and still reported "invariants held over 0 random player steps" as a PASS. Earlier fuzz results were unaffected (they always used listed ages), but adult ages had never actually been fuzzed. The fuzz now runs any requested age and fails if no steps ran.
- Phase O: a new constant name collided with an existing one (`INVITE_TYPES`); caught by the syntax check and renamed.
- Phase V3: senior-scholarship results were only sent together with university decisions, so a student who applied for the scholarship but to no university never got a result.

**V3 test update (new behavior):** `t_uni` now checks that studying counts toward the semester GPA (the GPA updates at the end of each semester instead of after every study session).
- Final full regression (test pacing vs. the anti-farming rule from batch B–F): `t_items` §53 "toy eventually Worn" played 120 times while only advancing time every 10 plays, so the 3-uses-per-day cap blocked most plays and the condition hovered near the threshold (intermittent). The test now advances a day every 3 plays and plays until worn (≤ 220).
- Final full regression: `t_lmpq` "science camp final event" failed once. Most likely cause: the same random caregiver refusal already proven for basketball camp (under 13, enrolling needs approval); the test now asks again and prints when refused. In the two re-runs the caregiver did not refuse, so this cause is **not directly confirmed**.
- Phase V1: the first daily update of senior year wiped any school list and applications already made that year (the record was treated as last year's, because its year was empty). Found by the application-count test; the record is now tied to the current school year when it is created.
- Phase U (balance, found by a test): yard-sale items almost never sold (about 19% per item per 2-hour shift at home, even when discounted). Discounts now count relative to the item's value: about 30% per item per shift at home, higher at busier places.
- Phase U (own edit): an edit to the old-stall conversion broke a variable declaration (`ReferenceError`); caught by the legacy-conversion test.
- v7.3 R/S/T (design, found by a test): a rejected confession sent the love stage back to "Noticing". You have shown you like them, so it is now a one-sided crush.
- v7.3 R/S/T (UI, found on visual review): the "Set them up with someone" button appeared on your own partner; the partner's card showed "Serious" while the love stage said "In love".
- v7.3 R/S/T (QA tooling): test-hook keys were declared twice (the later plain versions overrode the id-wrapped ones), and a hook received a copy of a couple object instead of the live one. Both fixed.

**Unreproduced intermittent failure:** `t_items` "gift: one card from the stack given, trust up" failed once, then passed 7 consecutive runs. Diagnostics (card stack sizes and sources, trust before/after, the reaction) are now printed if it fails again. It is not claimed fixed.

**R/S/T test updates (intended randomness, not regressions):** `t_rst` retries consent steps up to 4 times (the game deliberately leaves about a 4% chance of "no" even at maximum closeness); `t_lmpq` retries asking a caregiver for a summer camp (under 13, approval is random); `t_romance` §62 now checks real NPC couples (and their age rules) instead of the old name-only dating.
- v7.3 L/M/P/Q: the store showed homemade treats for $0 (caught by the store category test).
- v7.3 L/M/P/Q: "homemade" gift reactions only partly worked (checked `origin`, while items store `source`).

**L/M/P/Q investigations (resolved, not game bugs):**
- *Intermittent `t_items` check 16* (switch phone + sell the old one): diagnostics showed the old phone was kept and no money was received. Cause: under 18, selling the old phone needs a caregiver's approval (random), and refusal keeps it as a backup with a message. The test now accepts both valid outcomes (sold with money up, or kept with the backup message). The earlier version also contained a vacuous `or True`, which was removed.
- *`t_knx` outgoing call returned "Permission denied"*: the preceding curfew test left the parents at strictness 90, and daily phone permission is re-asked each day and is much harder late at night with strict parents. That is correct game behavior; the test now grants the day's phone access and resets strictness first.

**L/M/P/Q test updates (new rules, not regressions):** `t_social` §96 now checks that a strict household refuses a *sleepover at 12*, while a party at 15 only needs telling your parents; `t_knx` checks the parent call at the character's actual curfew (teens: 22:30–24:00).
- v7.3 K/N/X: old messages were never migrated into chats, because the migration ran before old messages were linked to senders (found by the regression suite).
- v7.3 K/N/X: the Games app created "online friends" in the old name format with no surname or NPC record.
- v7.3 K/N/X (UX, found while testing): reopening Messages jumped into the last thread instead of the list; plan time options started at 7:00 AM (now 9:00 AM).

**K/N/X test updates (new behavior, not regressions):** `t_creator` replies to legacy messages through the new chat thread; `t_jordan` accepts a check-in after 8:00 when it comes with a late reason (random lateness from H); `t_hij` uses 10 tries for the "don't want to go" refusal rate (about 10% approval by design).
- v7.3 H/I/J: tooling — a build-script edit briefly broke the chain of replacements (fixed before testing); the new weather functions initially coexisted with the originals (duplicate definitions), caught by the duplicate-function check.

**H/I/J test updates (new rules, not regressions):** `t_commit` now expects the caregiver conversation at the 4th absence (the new threshold schedule) instead of the 2nd.

**Known probabilistic behavior covered by tests:** forecasts are wrong about 10% of the time and parents refuse a real sick day about 10% of the time; the tests account for both instead of assuming certainty.
- v7.3 B–F (QA tooling): the first version of the new fuzz invariant for the 3-per-day cap read the wrong field and checked nothing; it was corrected before the final runs.
- v7.3 G (playtest report): prom refusals could form inconsistent chains (A "going with" B while B is "going with" C). Pairings are now symmetric and verified by a test.
- v7.3 A2 misread: Grade 9 was excluded from elections; fixed to Grades 8–12.
- v7.3 A2: high school repeated "Grade 12" at ages 17 and 18; school now ends after age 17.
- v7.3 A2: rolling assessments could land after the school year ended (seen as cancelled future exams in Recently resolved).
- v7.3 A2: an early version of the prom date rule ("at least 30 days after the year starts") left some birthdays with no prom that year; caught by the multi-birthday test.

**A2 test updates (new rules, not regressions):** the social suite's club and election scenario now runs in Grade 10 (Grade 9 cannot run). In the romance suite, the rival test picks an NPC you have not met (an existing neighbor correctly keeps their label), and the neighborhood check verifies the event kind and named households instead of matching keywords in the text.
- v7.3 A: the zodiac calculation (from the original code) returned Capricorn for every date after a sign's cutoff day; found while testing the new automatic horoscope.
- v7.3 A: the first version of legacy-message linking matched by first name only and attached a friend's message to Dad when they shared a first name; it now prefers non-family people with the matching role.
- Phase 5b (safety): the legacy romance action had no partner-age check. It was replaced by an age-gated system and covered by tests and a fuzz invariant.
- Phase 5b: the new NPC gift-reaction function initially had the same name as the existing player gift-reaction function (`giftReaction`) and would have silently overwritten it. It was renamed `npcGiftReaction`.
- Phase 5b: the neighborhood state was only created on the first neighborhood event; it is now created during reconciliation, including for old saves.
- Phase 5b: `romanceAction` crashed on an unknown action kind; it now ignores it safely.
- Phase 5a: name migration replaced a known friend's given name ("Mia" → "Léo") when it was not in the regional pool. Given names are now always kept.
- Phase 5a: parents could get cross-gender names (Mom "Nathan"); family members now use gendered family-name lists.
- Phase 5a: `addStagePeople` ran before name migration and added duplicate neighbors/classmates to old saves; migration now runs first.
- Phase 5a: retrying a failed tryout returned the old record instead of scheduling a new attempt.
- Phase 5a: `minutesUntil` was referenced but never defined (plan cancellation crashed).
- Phase 4: the Life theme's pink primary button measured **4.19:1** (below AA); the accent was darkened to #c2336d (≈5.3:1).
- Phase 4: switching themes briefly showed the previous theme's colors on buttons (CSS transitions); transitions are now suppressed for one frame during a switch.
- Phase 4: the SVG sprite's `i-family` id collided with the Identity panel's `i-family` element, which blanked the Family field and hid the nav icon. Sprite ids now use the `ico-` prefix.
- Phase 3: reordering the Education screen initially targeted the kindergarten branch (identical markup), which produced a `rec` initialization error for 3-year-olds. The fuzzer caught it; it is fixed and covered.
- Age Up marked every school day absent (end-of-day processing took the "missed" path instead of simulation).
- "Attend school" at 11 PM left the day "Scheduled" until time passed.
- Simulated exams dragged grades down every year; they now assume a typical year of study, and attendance slowly builds skill.

## Known limitations
- Nothing in the game currently makes the character ill, so "excused for illness" only occurs in Age Up simulation and on approved family trips.
- School breaks are fixed (Dec 23–Jan 2, Jun 12–Aug 24, northern-hemisphere style). Regional calendars come with the holiday engine.
- Inventory: the gift reaction system is basic (price/personal/wear/sentiment). NPC interests and occasion-awareness come with the social phase. Item uses are not yet tied to clubs/tryouts.
- Holidays: school breaks are still a fixed northern-hemisphere schedule; Thanksgiving/Lunar New Year days off are not yet school holidays. A family cannot yet change which holidays it observes from the UI (the profile supports overrides).
- School: kindergarten days still resolve in one step; the interactive timetable starts in Grade 1.
- Themes: contrast was measured on the main screens; rarely seen modals and phone apps were reviewed visually but not measured. Item/holiday emoji remain (by design).
- Social: up to 3 friend groups. Adult sneaking-in is not modeled.
- All spec phases (1–5b) are now implemented. Remaining work is depth and balance tuning rather than missing systems.
- Tests use a QC-only clock jump (`setClock`). In normal play time always passes through the processors; a few test-only artifacts (e.g. homework shown "Late" right after a jump) do not occur in real play.

## Running QC
Install Playwright with Chromium (`pip install playwright && playwright install chromium`), then from `qa/` run e.g. `python3 t_exam.py`. If needed, change `URL` and `CHROME` in `qa/harness.py` to match your setup.


## H3 Final QA
- H3 focused suites: 51/51 checks passed.
- Phase 3A, H2, Health, Family core, HOTFIX-P1, medicine and birthday/social regressions executed; required fuzz covered ages 3/6/8/11/14/17 and 840 random steps without reported invariant/JS failure.
- Legacy browser navigation is blocked in this environment; a temporary non-shipped set_content harness was used. Reload/direct-file-navigation-only limitations are documented in H3_PROGRESS.md.
- One `t_family.py` stochastic grandparent-residence assertion reproduces identically on H3.0 baseline and is not an H3 regression.

## Phase 3B.2 Checkpoint QA
- 3B.2 focused: **17/17 PASS**.
- 3B.1 regression: **13/13 PASS**.
- H3 decision regressions: H3.1 **15/15 PASS**, H3.2 **10/10 PASS**.
- People/Profile/Friendship directly relevant regressions: **14/14**, **24/24**, **17/17 PASS**.
- Existing romance suite: **47/49** under the portable harness. The two remaining Valentine/date-scene checks reproduce the pre-existing issue documented at 3B.1/H3 baseline; the old instant-partner ask-out expectation was updated to the approved 3B.2 planner behavior and passes.
- 3B.2 does not implement 3B.3 commitment/physical-affection/breakup work or 3B.4 matchmaking.



## Phase 3B.3 Checkpoint QA
- 3B.3 focused: **23/23 PASS**.
- 3B.1 regression: **13/13 PASS**; 3B.2 regression: **17/17 PASS**.
- H3 decision integrity: H3.1 **15/15 PASS**, H3.2 **10/10 PASS**.
- People/Profile/Friendship: **14/14**, **24/24**, **17/17 PASS** under the temporary portable harness; shipped `qa/harness.py` restored unchanged.
- Existing romance suite: **47/49**. The two remaining Valentine/date-scene failures reproduce the already documented 3B.2 baseline issue; two old assertions superseded by approved 3B.3 behavior were updated (older-teen contextual nonsexual sneak-in, and no immediate reroll after declined adult intimacy).
- 3B.3 does not implement 3B.4 matchmaking/blind dates/multiple prospects.

## Phase 3B.4 Checkpoint QA
- 3B.4 focused: **23/23 PASS** repeatedly after fixing stable-ID orientation compatibility.
- 3B.1 regression: **13/13 PASS**; 3B.2: **17/17 PASS**; 3B.3: **23/23 PASS**.
- H3 decision integrity: H3.1 **15/15 PASS**, H3.2 **10/10 PASS**.
- People/Profile/Friendship: **14/14**, **24/24**, **17/17 PASS** under the temporary portable harness; shipped `qa/harness.py` restored byte-identically.
- Existing romance suite: **47/49**. The two failures are the same previously documented Valentine/date-scene assertions from the 3B.2/3B.3 baseline; no new 3B.4 romance regression was observed.
- `node --check game.js` PASS; final `tools/splice.py` deterministic rebuild verified before packaging. `style.css` remains unchanged from 3B.3.
- `tools/theme.py` still reports a pre-existing unmapped `rgba(30,24,16,.42)` source token; 3B.4 is JS-only and does not alter CSS, so this build-tool mapping issue is documented rather than modified out of scope.
- 3B.4 does not begin 3B.5 final full regression/fuzz.



## Phase 3C.2 Checkpoint QA
- 3C.2 focused: **21/21 PASS**.
- 3C.1 regression: **22/22 PASS**.
- Phase 3B focused regressions: **76/76 PASS**.
- H3 decision integrity: **25/25 PASS**.
- People/Profile: **14/14**, **24/24 PASS** under a temporary portable harness; shipped `qa/harness.py` restored byte-identically.
- Directly relevant checkpoint total: **182/182 PASS**.
- `node --check game.js` PASS; final deterministic rebuild verified before packaging. `style.css` is unchanged from 3C.1.
- 3C.2 intentionally does not start kids-smartwatch expansion (3C.3), group chat (3C.4), or final full-project fuzz/regression (3C.5).

# Phase 3C.3 checkpoint QA

Status: **PASS for authorized 3C.3 scope**.

Focused / directly relevant totals:

- `qa/t_3c3.py`: **20/20 PASS**
- `qa/t_3c1.py`: **22/22 PASS**
- `qa/t_3c2.py`: **21/21 PASS** (repeated 3 times after 3C.3 integration; the call-schema setup explicitly avoids the separate late-at-home house-rule gate)
- Phase 3B focused (`t_3b1`–`t_3b4`): **76/76 PASS**
- H3 decision integrity (`t_h31`, `t_h32`): **25/25 PASS**
- People: **14/14 PASS**
- Profile: **24/24 PASS**
- directly relevant total: **202/202 PASS**

3C.3 additionally caught and fixed a real build-precedence issue: generated runtime had two `phonePanel()` definitions, allowing the legacy base panel to override the canonical 3C panel. The authoritative build now removes the superseded base function; final generated runtime contains one canonical `phonePanel()`.

A temporary portable Playwright harness was used only to execute People/Profile regression in this environment because the shipped harness keeps historical hard-coded browser/file paths. The original `qa/harness.py` was restored before packaging; no compatibility workaround is shipped.

Final checkpoint build verification is recorded in `PHASE_3C_PROGRESS.md`. Full cross-project regression/fuzz remains intentionally deferred to 3C.5.

Final 3C.3 build verification: `game.js` rebuilt twice byte-identically (`ad2d2f82db4744dfb26e88e90eea51ed49ab4531baa9ca69c6a73f1444116f96`), `node --check` passed, `style.css` remained unchanged from 3C.2, and generated runtime contains exactly one canonical `phonePanel()`.

# Phase 3C.4 checkpoint QA

Status: **PASS for authorized 3C.4 scope**.

Focused / directly relevant totals:

- `qa/t_3c4.py`: **26/26 PASS**
- `qa/t_3c1.py`: **22/22 PASS**
- `qa/t_3c2.py`: **21/21 PASS**
- `qa/t_3c3.py`: **20/20 PASS**
- Phase 3B focused (`t_3b1`–`t_3b4`): **76/76 PASS**
- H3 decision integrity (`t_h31`, `t_h32`): **25/25 PASS**
- People: **14/14 PASS**
- Profile: **24/24 PASS**
- Friendship: **17/17 PASS**
- HOTFIX-P1: **74/74 PASS** (`P1.1 22/22`, `P1.2 24/24`, `P1.3 28/28`)
- directly relevant total: **319/319 PASS**

3C.4 verifies real group threads/unread state, contact/channel eligibility, contextual cooldown, block/remove/unblock behavior, relationship communication, knowledge provenance, save/reload and idempotent migration.

Legacy HOTFIX-P1 tests contain historical absolute Chromium/project/fixture paths. A temporary portable harness and temporary path mappings were used only to execute those unchanged assertions in this environment. The shipped `qa/harness.py` was restored byte-identically and compatibility paths were removed before packaging.

Full cross-project regression, final migration matrix and required age-targeted fuzz remain intentionally deferred to 3C.5.

Final 3C.4 build verification: `game.js` rebuilt twice byte-identically (`d1ca073540146829fd19c5057cdfbabb041aff3afb6aae08e7f25bbd6d6664d8`), `node --check` passed, `style.css` remained at `801ca0d091146469420d32800e274bd14f3f3b8968f7ac567609dbba7d61f16d`, generated runtime contains one canonical `phonePanel()` and one 3C.4 module, and the shipped `qa/harness.py` is byte-identical to 3C.3. Final `qa/t_3c4.py` rerun: **26/26 PASS**.

3C.4 stability follow-up: a final repeated run exposed a test-only display-name mismatch (raw fixture `name` vs the game's canonical `firstName(p)` rule). The assertion was corrected without changing production code; `qa/t_3c4.py` subsequently passed **26/26 on 5 consecutive runs**.


## Phase 3C.5 Final QA — Phase 3C COMPLETE

Final Phase 3C focused/acceptance/fuzz results:

- 3C.1: 22/22 PASS
- 3C.2: 21/21 PASS
- 3C.3: 20/20 PASS
- 3C.4: 26/26 PASS
- Phase 3C focused subtotal: 89/89 PASS
- 3C.5 acceptance supplement: 29/29 PASS
- 3C.5 representative-age fuzz: 13/13 PASS, 600 randomized operations
- Phase 3B focused regression: 76/76 PASS
- H3 full focused regression: 50/50 PASS
- HOTFIX-P1 final rerun: P1.1/P1.2/P1.3 PASS
- Phase 3A.7: 13/13 PASS
- save/reload + legacy migration (`t_commit`, `t_regress`): PASS
- final `t_context`, `t_knx`, `t_o`: PASS under approved Phase 3C contact/cooldown rules

Acceptance: all 30 Phase 3C criteria verified.

In-scope regression found/fixed during 3C.5: committed incoming-message follow-ups were incorrectly subject to a second frequency roll at delivery. They are now frequency-gated when scheduled, then delivered as committed follow-ups while still re-evaluating residence context (including parent → parentSocial after moving out).

Broad legacy-matrix notes: `t_holidays.py` retains a non-3C Holiday hero assertion failure with the Holiday module byte-identical to the 3C.4 input. Very long legacy browser suites can exceed this environment's command runtime and the final direct-file navigation segment of `t_theme.py` can be blocked by browser policy; no workloads/assertion thresholds were reduced to manufacture a pass. The dedicated 3C.5 fuzz covers the required child-smartwatch / teen-smartphone / adult-smartphone communication state space without weakening old tests.


### Phase 3C final build integrity
- `game.js` authoritative rebuild is byte-identical across two consecutive builds: `70f6941106dbe7901b2d1b119155a8ddca4699a6cb219c3dd2f5c7ee7b6cfa63`.
- `style.css` remains baseline-identical: `801ca0d091146469420d32800e274bd14f3f3b8968f7ac567609dbba7d61f16d`.
- `node --check game.js`: PASS.
- Shipped `qa/harness.py` is restored byte-identical to 3C.4 (`9b681b9e0f3f896c094a54b0d2258c192c34f370b12042cdaff8024bf68ce488`).
- 3C.2 focused call tests passed 21/21 on five consecutive deterministic-fixture runs; production availability behavior was not weakened.

### Phase 3C.5 re-execution note

A fresh closeout run from `3C.4-complete-current` reconfirmed the final Phase 3C focused/acceptance/fuzz matrix and the directly relevant cross-phase regressions. In this rerun `t_biz.py` and `t_holidays.py` both passed; the older Holiday-hero failure noted above did not reproduce. `t_health.py` exceeded the environment's per-command Playwright window before final summary and is therefore recorded as a timeout for this rerun, not as a fresh pass or failure. No workload was shortened to manufacture a green result.


## Phase 4A.1 checkpoint QA

Status: **PASS for authorized 4A.1 scope**.

Fresh directly executed results:
- `qa/t_4a1.py`: **13/13 PASS**
- `qa/t_4a1_regress.py`: **14/14 PASS**
- `qa/t_3c1.py`: **22/22 PASS**
- `qa/t_3c4.py`: **26/26 PASS**
- directly executed subtotal: **75/75 PASS**

The focused suite verifies unique IDs, valid centralized lookups, multiple differentiated schools, registry stability, save/reload, idempotent migration and school-owned event identity. The school compatibility suite verifies current primary/middle/high state, School UI, exams/calendar and non-destructive migration. Phase 3C communication regressions remain green.

Legacy `t_sch.py`, `t_schoolyear.py` and `t_exam.py` retain historical absolute/file navigation assumptions that are blocked by this environment before assertions. They are not counted as passes. The shipped `qa/harness.py` is preserved unchanged.

Final reproducible-build hash is appended after the authoritative packaging rebuild.

Final 4A.1 build verification:
- `game.js` rebuilt twice byte-identically: `4abeb0921ab52a43814ac21c4fd1d6e0dd899d1aa7d8d34bd04166219f98bc4b`
- `style.css`: `801ca0d091146469420d32800e274bd14f3f3b8968f7ac567609dbba7d61f16d` (unchanged from input)
- `node --check game.js`: PASS
- shipped `qa/harness.py`: `9b681b9e0f3f896c094a54b0d2258c192c34f370b12042cdaff8024bf68ce488` (unchanged)
- final 4A.1 focused + school compatibility rerun: 27/27 PASS

## Phase 4A.2 QC
- Focused Player school identity/progression: 19/19 PASS.
- 4A.1 registry: 13/13 PASS.
- School compatibility regression: 14/14 PASS.
- Phase 3C contact/device regression: 22/22 PASS.
- Phase 3C group/relationship communication regression: 26/26 PASS.
- Directly executed total: 94/94 PASS.
- Legacy file-navigation QA remains environment-blocked and is not counted as pass.
- Final authoritative `game.js` hash: `5c13bcfa0c1ec1ccc785ad09cacb05c7920f49e428e93d742f6ff547f3b9f7d8` (two identical rebuilds).
- Final packaged-build 4A.2 + School compatibility rerun: 33/33 PASS.


## Phase 4A.3 checkpoint QA

Status: **PASS for authorized 4A.3 scope**.

Directly relevant results:
- 4A.3 focused: **18/18 PASS**
- 4A.1 registry: **13/13 PASS**
- 4A.2 Player assignment/progression: **19/19 PASS**
- School compatibility: **14/14 PASS**
- Phase 3C device/contact: **22/22 PASS**
- Phase 3C group/relationship communication: **26/26 PASS**
- Phase 3B focused: **76/76 PASS**
- People: **14/14 PASS**
- Profile: **24/24 PASS**
- Friendship: **17/17 PASS**
- directly relevant total: **243/243 PASS**

The 4A.3 focused suite verifies one current school per school-age NPC, deterministic persistence, multiple schools in the world, classmate/same-school/different-school distinctions, one active enrollment, save/reload and idempotent migration, stage transition history, new-NPC integration, student lookup, and K–12 aging-out behavior.

A temporary QA-only portable Playwright harness was used for People/Profile/Friendship because this environment blocks the shipped harness's historical `file://` navigation and Chromium path. Real `style.css`, `data.js` and generated `game.js` were injected. The shipped harness was restored unchanged before packaging.

Final reproducible-build hash and packaged-build rerun are appended after authoritative rebuild.


Final 4A.3 build verification:
- `game.js` rebuilt twice byte-identically: `dc8db6cdd7bb914a9115efbf476e43c439290946f30663a835c595bec6ee13cd`
- `style.css`: `801ca0d091146469420d32800e274bd14f3f3b8968f7ac567609dbba7d61f16d` (unchanged)
- `node --check game.js`: PASS
- shipped `qa/harness.py`: `9b681b9e0f3f896c094a54b0d2258c192c34f370b12042cdaff8024bf68ce488` (unchanged/restored)
- final generated-build checkpoint rerun: **112/112 PASS**
- directly relevant checkpoint total: **243/243 PASS**

## Phase 4A.4 QC
- Focused cross-school provenance: 18/18 PASS.
- 4A.1–4A.3 + School compatibility: 64/64 PASS.
- Phase 3C directly relevant communication: 48/48 PASS.
- Phase 3B romance: 76/76 PASS.
- People/Profile/Friendship: 55/55 PASS.
- HOTFIX-P1.2/P1.3: 52/52 PASS.
- Directly relevant total: **313/313 PASS**.
- Temporary portable Playwright harness/path mappings were QA-only and were removed; shipped harness restored byte-for-byte.
- Full project migration/regression/fuzz is intentionally deferred to checkpoint 4A.5.

### 4A.4 final packaged-build verification
- `game.js` reproducible SHA-256: `67a2fa39ad6ff730d14c11a4afd8c4b399d59737b5f01673511aa8266f58f5f7`
- `style.css` unchanged SHA-256: `801ca0d091146469420d32800e274bd14f3f3b8968f7ac567609dbba7d61f16d`
- shipped `qa/harness.py` unchanged SHA-256: `9b681b9e0f3f896c094a54b0d2258c192c34f370b12042cdaff8024bf68ce488`
- final generated-build focused rerun: **82/82 PASS**.


## Phase 4A.5 — Final QA / Phase 4A closeout

Status: **PHASE 4A COMPLETE**.

Final Phase 4A results:
- 4A.1: 13/13 PASS
- 4A.2: 19/19 PASS
- 4A.3: 18/18 PASS
- 4A.4: 18/18 PASS
- School compatibility: 14/14 PASS
- 4A.5 acceptance runtime: 32/32 PASS
- focused/acceptance subtotal: **114/114 PASS**
- Phase 4A fuzz: **600 randomized operations**, **20/20 scenario checks PASS**
- all **32/32 formal Phase 4A acceptance criteria verified** (build/source criterion verified by deterministic rebuild)

Fresh required prior-phase results:
- Phase 3C: **131/131 PASS** including its 600-op fuzz
- Phase 3B: **94/94 PASS** including its 600-op fuzz
- H3: **50/50 PASS**
- HOTFIX-P1: **74/74 PASS**
- People/Profile/Friendship: **55/55 PASS**
- Save/reload and legacy migration suites `t_commit`, `t_regress`, `t_rst`: PASS
- Existing school scholarship/exam suites `t_sch`, `t_exam`: PASS

Additional legacy/full-regression suites that completed were green; long-running or direct-navigation suites that could not complete are documented in `PHASE_4A_PROGRESS.md` and are not counted as passes.

Final build:
- `game.js`: `67a2fa39ad6ff730d14c11a4afd8c4b399d59737b5f01673511aa8266f58f5f7`
- `style.css`: `801ca0d091146469420d32800e274bd14f3f3b8968f7ac567609dbba7d61f16d`
- `qa/harness.py`: `9b681b9e0f3f896c094a54b0d2258c192c34f370b12042cdaff8024bf68ce488` (restored original)
- repeated authoritative rebuild: byte-identical
- `node --check game.js`: PASS
- production `src/` and `tools/` are unchanged from validated 4A.4 during 4A.5.

Exact next resume point: **Phase 4B — School Organizations / Roles / Elections**.


## Phase 4B.5 — Final Migration / Regression / Fuzz / QA — COMPLETE

Status: **PHASE 4B COMPLETE**.

Final Phase 4B results:
- 4B.1: 23/23 PASS
- 4B.2: 27/27 PASS
- 4B.3: 33/33 PASS
- 4B.4: 30/30 PASS
- 4B.5 acceptance: 23/23 PASS
- Phase 4B focused/acceptance subtotal: **136/136 PASS**
- Phase 4B fuzz: **720 randomized operations / 17/17 checks PASS**
- formal Phase 4B acceptance criteria: **46/46 verified**

Fresh required cross-phase results:
- Phase 4A: **114/114 PASS**, plus 600-op fuzz / 17/17
- Phase 3C: **131/131 PASS** including 600-op fuzz
- Phase 3B: **94/94 PASS** including 600-op fuzz
- H3: **50/50 PASS**
- HOTFIX-P1: **74/74 PASS**
- Phase 3A: **13/13 PASS**
- People/Profile/Friendship: **55/55 PASS**
- save/reload + legacy migration (`t_commit`, `t_regress`, `t_rst`): **86/86 PASS**
- completed School/existing-system set (`t_exam`, `t_campus`, `t_context`, `t_events`): **100/100 PASS**

Final migration/fuzz validation confirms stable organization IDs, valid school/class ownership, one-holder unique offices, persistent real NPC opponents/incumbents, locked election/selection results, role-history preservation, transfer/graduation cleanup and repeated 4B.1→4B.4 migration idempotence.

Historical-suite notes are recorded in `PHASE_4B_PROGRESS.md`: `t_sch.py`, `t_schoolyear.py` and the club-election tail of `t_social.py` contain assumptions superseded by the current academic/4B architecture and are not counted as fresh passes. No production rule or assertion was weakened to force these old suites green. The old generic fuzz completed age 3 (140 random steps) and the age-6 invocation exceeded the execution window; dedicated 4B/4A/3B/3C fuzz completed **2,520 randomized operations** total.

4B.5 made **no production source or build-tool changes** from the validated 4B.4 checkpoint. `src/` and `tools/` diff cleanly against the 4B.4 input.

Final reproducible build:
- `game.js`: `e37ebe47ff68f119226af9d4c23a7bcbdb1955594b898190842dee9cb2fa5cb2`
- `style.css`: `801ca0d091146469420d32800e274bd14f3f3b8968f7ac567609dbba7d61f16d`
- `qa/harness.py`: `9b681b9e0f3f896c094a54b0d2258c192c34f370b12042cdaff8024bf68ce488` (restored original)
- repeated authoritative rebuild: byte-identical
- Node syntax checks for generated game and all 4B source modules: PASS

**PHASE 4B COMPLETE — Ready for final audit before Phase 4C.**

Exact next resume point: **Phase 4C — Daily School Realism**.

## Phase 4C.5 final QA

Status: **PHASE 4C COMPLETE**.

- 4C.1: 20/20 PASS
- 4C.2: 21/21 PASS
- 4C.3: 20/20 PASS
- 4C.4: 22/22 PASS
- 4C.5 acceptance: 28/28 PASS
- Phase 4C focused/acceptance subtotal: **111/111 PASS**
- Phase 4C fuzz: **21/21 PASS / 800 randomized operations**
- Phase 4C formal acceptance criteria: **50/50 verified**

Final fuzz discovered and fixed a real teacher-session integrity edge case in `schoolclasses4c2.js`; all affected 4C.2 and final acceptance tests remain green after the fix.

Fresh prior-phase results include Phase 4B 136/136 + fuzz 17/17, Phase 4A 114/114 + fuzz 17/17, Phase 3C 118/118 + fuzz 13/13, Phase 3B 81/81 + fuzz 13/13, H3 50/50, HOTFIX-P1 74/74 and Phase 3A final validation 13/13.

Additional required system regression completed cleanly for Health (83 checks), Family (35), Calendar/Holidays (57), Needs/balance (1), and current School/system suites `t_campus` (21), `t_context` (28), `t_events` (22).

Legacy-suite exceptions are documented in `PHASE_4C_PROGRESS.md`; notably old `t_exam` assumes Home→exam auto-check-in/teleport behavior that Phase 4C explicitly removes, while several other historical suites depend on superseded academic timelines or browser navigation/reload behavior unavailable to the sandbox QA compatibility harness. Production behavior/tests were not weakened to force those suites green.

Final reproducible build:
- game.js SHA-256 `7a0afa3f27ddfc5228dd16c2d5a3b34301abca8e5f92d8823e759214fe161686`
- style.css SHA-256 `801ca0d091146469420d32800e274bd14f3f3b8968f7ac567609dbba7d61f16d`
- qa/harness.py SHA-256 `9b681b9e0f3f896c094a54b0d2258c192c34f370b12042cdaff8024bf68ce488`


## Phase 4D final QA

- 4D.1–4D.5 focused/acceptance: 110/110 PASS
- 4D.5 fuzz: 21/21 PASS / 200 randomized lifecycle operations
- Phase 4C regression: 111/111 PASS
- Phase 4B final acceptance/fuzz: 40/40 PASS
- Phase 4A final acceptance: 32/32 PASS
- Phase 3C final acceptance: 29/29 PASS
- Phase 3B final acceptance: 5/5 PASS
- H3: 50/50 PASS
- Reproducible build: byte-identical game.js/style.css
- Phase 4D COMPLETE; Phase 5A not started

## Phase 5A.1 checkpoint QA

- Focused workbook foundation: **23/23 PASS**.
- Phase 4D focused/final acceptance: **110/110 PASS**; 4D fuzz **21/21 PASS / 200 ops**.
- Phase 4C final acceptance **28/28**, Phase 4B final acceptance **23/23**, Phase 4A **32/32**, Phase 3C **29/29**, Phase 3B **5/5**, H3 **50/50**.
- Clean rebuild byte-identical; `game.js` SHA-256 `f0181cc400131743c7aacb5dfd8e37b0508d867a1d5873e8f280949ef72e846b`.
- Legacy `t_growth.py` contains a now-superseded assumption that Advanced Exercise can be clicked without owning a subject/grade workbook; test left unchanged.

## Phase 5A.2 QC
Focused progression/prerequisite suite: 23/23 PASS. 5A.1 regression: 23/23 PASS. Fresh prerequisite matrix (4D.5, 4C.5, 4B.5, 4A.5, 3C.5, 3B.5, H3) remained green; explicit validated total including 5A.1/5A.2: 257/257 PASS. Clean rebuild reproduced identical `game.js` / `style.css` / shipped harness hashes.


## Phase 5A.3 QC
- 5A.3 focused: **23/23 PASS**.
- 5A.1 regression: **23/23 PASS**; 5A.2 regression: **23/23 PASS**.
- Phase 4D.5 acceptance/fuzz **44/44**, Phase 4C.5 **28/28**, Phase 4B.5 **23/23**, Phase 4A.5 **32/32**, Phase 3C.5 **29/29**, Phase 3B.5 **5/5**, H3 **50/50**.
- Explicit validated focused/acceptance matrix including 5A.1–5A.3: **280/280 PASS**.
- Clean rebuild byte-identical; `game.js` SHA-256 `1fc0c653918c7ea01f1422aaf2e1600dfe68b31a182bbfe23b19f2567b1da3f4`.
- `style.css` and shipped `qa/harness.py` hashes remain unchanged.
- Exact next resume point: **5A.4 — School / Exam / Skill Integration + UI**.


## Phase 5A.4 QC
- 5A.4 focused: **24/24 PASS**.
- 5A.1 / 5A.2 / 5A.3 regression: **69/69 PASS**.
- Phase 4D.5 acceptance/fuzz: **44/44 PASS / 200 randomized operations**; directly affected 4D.3 focused: **23/23 PASS**.
- Phase 4C.5 **28/28**, Phase 4B.5 **23/23**, Phase 4A.5 **32/32**, Phase 3C.5 **29/29**, Phase 3B.5 **5/5**, H3 **50/50**.
- Primary fresh focused/acceptance matrix including 5A.1–5A.4: **304/304 PASS**.
- Reproducible build is byte-identical; `game.js` SHA-256 `a9151c7c791d47114f6078cef092c647c60a6122b6984d794141e09221d9d7df`.
- `style.css` and shipped `qa/harness.py` hashes remain unchanged.
- Legacy People/Profile scripts still depend on the obsolete repository browser/file-navigation path in this sandbox; current Phase 4A acceptance including Profile knowledge/provenance remains **32/32 PASS**.
- Exact next resume point: **5A.5 — Migration / Regression / Fuzz / Final QA**.

## Phase 5A final QA closeout

- Phase 5A focused/acceptance: **117/117 PASS**.
- Phase 5A.5 dedicated fuzz: **10/10 PASS / 200 randomized operations**.
- Formal Phase 5A acceptance criteria: **47/47 verified**.
- Current 4D/4C/4B/4A/3C/3B/H3 regression suites remain green; prerequisite fuzz suites also remain green.
- HOTFIX-P1 and Phase 3A were rechecked with QA-only portable browser harnesses; shipped `qa/harness.py` was restored byte-for-byte.
- Clean authoritative rebuild is byte-identical; no production source change was required in 5A.5.
- Known legacy exceptions are documented in `PHASE_5A_PROGRESS.md` and are not 5A.5 production regressions.

