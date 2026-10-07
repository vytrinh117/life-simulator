# PHASE 4C — DAILY SCHOOL REALISM

## Status

**PHASE 4C COMPLETE**

Prerequisites verified before implementation:

- H3 COMPLETE
- HOTFIX-P1 COMPLETE
- Phase 3A COMPLETE
- Phase 3B COMPLETE
- Phase 3C COMPLETE
- Phase 4A COMPLETE
- Phase 4B COMPLETE
- CURRENT source inspected
- `BUILD.md` inspected; `src/` remains authoritative and root `game.js` / `style.css` remain generated outputs

## Phase 4C Checkpoint Tracker

- [x] 4C.1 — School Day / Location / Time Foundation
- [x] 4C.2 — Classes / Teachers / Attendance / School Actions
- [x] 4C.3 — Lunch / Breaks / Needs / Campus Facilities
- [x] 4C.4 — Homework / After-School / Going Home / School Break Logic
- [x] 4C.5 — Migration / Regression / Fuzz / Final QA

**Phase 4C is complete. Do not begin Phase 4D automatically.**

---

# Checkpoint completed

**4C.1 — School Day / Location / Time Foundation**

## Implementation

Phase 4C.1 extends the existing clock/calendar/location architecture instead of creating a second school clock or a disconnected location system.

Canonical foundations:

- existing `S.clock.dateISO` and `S.clock.minute` remain the authoritative game datetime
- existing `S.location` remains the authoritative Player physical location
- Phase 4A `schoolId` remains the authoritative school identity
- new `S.schoolDayRuntime` stores only school-day runtime metadata such as the school bound to the current physical School location and the last physical transition
- `schoolDayState4C1()` derives the current school-day context from date, weekday, school calendar, school identity, grade/stage, current time and physical location

School operating state:

- formal school days distinguish campus opening, class hours, after-school window and campus closing
- stage-aware sane default hours are used only when the Phase 4A school entity does not provide better configured hours
- weekends, academic breaks and existing school closures do not behave like ordinary school days
- normal classes end around the existing 3 PM school-day end while campus may remain open for the later after-school window
- after campus close, impossible lingering School location is conservatively reconciled to Home

Physical location integrity:

- opening the School/Education panel does not alter physical location
- `playerAtSchool4C1()` is physical-location based and binds School to the actual Phase 4A `schoolId`
- `atSchool()` now delegates to this canonical physical check
- school attendance/session state is no longer treated as a substitute for physical location
- home-only actions such as Shower/Bath/Brush/Sleep/Nap/Family Meal/Cook/Comfort are backend-gated while Player is physically at School
- existing off-campus place travel inherits the physical `atSchool()` gate, preventing school -> mall/park/etc. teleporting without first leaving campus

Go To School:

- `goToSchool4C1()` performs a real transition instead of treating School panel access as arrival
- validates school day, school identity, campus hours and origin context
- advances time by a stage-appropriate commute duration using the existing clock
- binds physical School location to the current Phase 4A schoolId
- integrates the existing school-day obligation/check-in flow when arrival occurs within the existing attendance window
- no Phase 7 transportation/fare/vehicle system is introduced

Go Home:

- `goHomeFromSchool4C1()` provides a real campus exit
- advances time using the same commute hook
- changes physical location to Home
- closes an active attendance session when appropriate
- normal class dismissal no longer teleports Player home automatically
- after normal dismissal Player can remain physically on campus for the legitimate after-school window until choosing Go Home or reaching campus-close reconciliation

School UI context:

- the existing School area receives a compact context block rather than a new multi-tab dashboard
- shows current school/grade/class context, physical Location, current time and campus/class operating hours/state
- exposes contextual Go To School / Go Home transition controls

Explicitly NOT implemented in 4C.1:

- full class-period action model
- teacher availability / Ask Teacher overhaul
- new attendance statuses or absence/sick/skip-class lifecycle beyond existing systems
- school nurse behavior
- lunch/cafeteria/packed-lunch/facility overhaul
- contextual phone rules
- homework pacing overhaul
- after-school activity scheduling overhaul
- family-dinner integration
- Phase 4D competitions/events
- Phase 5A workbook system
- Phase 5B summer/tutoring expansion
- Phase 6 Prom expansion
- Phase 7 Transportation

## Files changed

Authoritative source / build tooling:

- `src/modules/schoolday4c1.js` — NEW canonical daily-school location/time foundation
- `src/modules/core72.js` — daily-school reconciliation hook
- `src/modules/school72.js` — physical at-school semantics, commute-backed attendance entry, explicit Go Home/dismissal behavior
- `src/modules/ui72.js` — compact school-day context and transition controls
- `tools/splice.py` — includes 4C.1 module, migration, backend action gate and QA exports

Generated output:

- `game.js` — rebuilt from authoritative source
- `style.css` — rebuilt per `BUILD.md`; no 4C.1 style-source change

QA / progress:

- `qa/t_4c1.py` — NEW focused 4C.1 suite
- `PHASE_4C_PROGRESS.md` — NEW Phase 4C tracker/report

## Migration

`migrateSchoolDay4C1()` is conservative and idempotent.

It does NOT fabricate historical school data.

Migration behavior:

- initializes only the minimal current runtime metadata needed by 4C.1
- preserves existing canonical `S.location`
- binds an existing valid School location to the current Phase 4A `schoolId`
- normalizes impossible current School location when the Player is at School on a closed/non-school context
- does not retroactively mark historical dates absent/present
- does not fabricate old attendance records
- does not fabricate class schedules
- does not create homework records
- repeated migration does not repeatedly move a valid Player location or duplicate runtime state

## Tests

### 4C.1 focused

`qa/t_4c1.py`: **20/20 PASS**

Covered:

- weekday in-session school day
- weekend closure
- academic break closure
- before campus opening
- during class hours
- after-class / after-school campus window
- after campus close
- School panel does not teleport Player
- School UI context
- real Go To School transition with time cost
- Phase 4A schoolId binding
- existing school-day obligation integration
- backend home-action gating while at School
- save/reload location persistence
- real Go Home transition with time cost
- normal dismissal keeps Player on campus rather than teleporting Home
- migration of impossible weekend School location
- no fabricated attendance history
- migration idempotence
- no browser runtime errors

### Fresh post-build regression

- Phase 4B focused/acceptance: **136/136 PASS**
- Phase 4A final acceptance: **32/32 PASS**
- Phase 3C final acceptance: **29/29 PASS**
- Phase 3B final acceptance: **5/5 PASS**
- H3: **50/50 PASS**

**Fresh explicitly rerun checkpoint/core regression total: 272/272 PASS**

### Syntax / source-generated integrity

- `node --check game.js` — PASS
- `node --check src/modules/schoolday4c1.js` — PASS

A final authoritative rebuild produced byte-identical generated output:

- `game.js`: `80da893b9a43cac1fc122287b0b39859a780d3e0e4c350eba5610a295b573f59`
- `style.css`: `801ca0d091146469420d32800e274bd14f3f3b8968f7ac567609dbba7d61f16d`
- shipped `qa/harness.py`: `9b681b9e0f3f896c094a54b0d2258c192c34f370b12042cdaff8024bf68ce488`

The focused 4C.1 suite was rerun after that clean rebuild and remained **20/20 PASS**.

## Legacy harness note

Several historical School suites still ship with a hard-coded obsolete Chromium path and `file://` project URL. A QA-only local-HTTP attempt was made so their `page.reload()` behavior could work without editing the shipped tests, but this sandbox blocks Chromium loopback navigation with `ERR_BLOCKED_BY_ADMINISTRATOR`.

This is recorded as a QA environment/harness limitation, not as a production test failure. The shipped `qa/harness.py` remains byte-identical to its original Phase 4B hash. Full legacy School regression remains part of the Phase 4C.5 final regression matrix, using a compatible execution environment where available.

## Known limitations / deferred scope

Intentional checkpoint boundaries:

- 4C.1 establishes time/location/open-state foundations only; 4C.2 will implement the fuller class-session, teacher-availability and attendance behavior.
- Lunch, restroom, hygiene, short rest, same-school social availability and contextual phone use remain 4C.3.
- Homework pacing, after-school scheduling, campus-close obligation handling, family-dinner timing and fast-forward consequences remain 4C.4.
- Full migration/regression/fuzz closeout remains 4C.5.
- Full competitions/events remain Phase 4D.
- Workbook, summer-program, Prom and Transportation expansions remain their later phases.

## Exact resume point

**4C.2 — Classes / Teachers / Attendance / School Actions**

STOP. 4C.2 has NOT started.


---

# Checkpoint completed

**4C.2 — Classes / Teachers / Attendance / School Actions**

## Implementation

Phase 4C.2 refines the existing `schoolDay` calendar event, timetable, subject/teacher records, attendance record and Health school-nurse flow. It does not introduce a second clock, timetable, attendance ledger or teacher database.

Class/session model:

- existing `timetableFor()` remains the canonical manageable subject schedule
- new `schoolClassSession4C2()` derives current period, current subject/teacher and next period from the existing timetable plus the 4C.1 school-day/location context
- class actions remain attached to the real current `schoolDay` event through its existing `periods` map
- existing Pay attention / Participate / Skip behavior is preserved
- Take notes, Ask a question and Daydream add contextual alternatives with time/stat/teacher consequences
- class actions remain backend-gated by active at-school session and current class period

Teacher availability / Ask Teacher:

- new `teacherAvailability4C2()` requires the Player to be physically at the current school while campus is open
- during a class, only that class's teacher is available in person
- lunch help is limited to a deterministic subset of current teachers rather than making every teacher universally available
- after-school help is limited to a short help-hours window and a deterministic subset of teachers
- teachers are no longer treated as available all day merely because the School panel is open
- `askTeacher4C2()` consumes time and improves the existing subject preparation/skill plus existing teacher relationship
- School UI communicates current/next class, attendance state and why teacher help is unavailable when relevant

Attendance:

- existing `schoolDay` event status and `attendanceStatus` remain canonical
- existing `S.school.record` remains the year attendance aggregate
- `attendanceState4C2()` is a normalized read-only view over those records, not a duplicate ledger
- on-time arrivals remain Present
- late arrivals remain compatible with legacy `Tardy` status while recording `arrivalMinutesLate`
- sufficiently late arrivals annotate already-missed class periods as `late_missed` rather than converting the whole day into an absence
- unexcused absence continues through the existing calendar cutoff flow
- school-closed days do not create ordinary absence
- `callInSickSchool4C2()` requires an actual Health/illness state and creates an excused sick absence through the existing attendance record

Skipping / discipline:

- Skip Class continues to write into the current `schoolDay.periods`
- existing `classesSkipped`, Troublemaker reputation, teacher reaction, behavior and parent-notice hooks are preserved
- no random punishment is added without an actual behavior action

School nurse:

- the Phase 2A Health nurse implementation is reused
- Nurse access remains dependent on active school attendance + physical School location
- Nurse access from Home remains blocked
- 4C.2 does not turn the nurse into a hospital or duplicate Health treatment state

Explicitly NOT implemented in 4C.2:

- cafeteria / packed lunch / vending overhaul
- restroom / wash-hands / short-rest school facilities
- contextual phone-at-school rules
- homework pacing overhaul
- after-school club/tutoring schedule overhaul
- family-dinner timing
- Phase 4D competitions/events lifecycle

## Files changed

Authoritative source / build tooling:

- `src/modules/schoolclasses4c2.js` — NEW class, teacher-availability and attendance refinement layer
- `src/modules/school72.js` — class-action refinements, arrival metadata hook and canonical teacher-help routing
- `src/modules/core72.js` — 4C.2 reconciliation hook
- `src/modules/ui72.js` — compact Current / Next / Attendance school context
- `tools/splice.py` — includes 4C.2 module, migration and QA exports

Generated output:

- `game.js` — rebuilt from authoritative source
- `style.css` — rebuilt per `BUILD.md`; no new style-source dependency

QA / progress:

- `qa/t_4c2.py` — NEW focused 4C.2 suite
- `PHASE_4C_PROGRESS.md` — updated checkpoint tracker/report

## Migration

`migrateSchoolClasses4C2()` is conservative and idempotent.

It initializes only current runtime schema metadata and, for a currently active attendance session, derives missing late-arrival metadata from the already-existing check-in record.

It does NOT:

- fabricate historical attendance
- create past absences
- create fake class schedules
- backfill old teacher interactions
- create homework
- reroll teacher identities

Repeated migration reaches the same current-state result.

## Tests

### 4C.2 focused

`qa/t_4c2.py`: **21/21 PASS**

Covered:

- coherent active class / subject / teacher context
- current teacher available during correct class
- successful in-person Ask Teacher
- unrelated teacher unavailable during another class
- Ask Teacher blocked from Home without time/stat side effects
- Present attendance
- Take Notes academic effect
- completed Present day
- Late arrival is not converted into absence
- late/missed-period metadata
- Unexcused absence after attendance cutoff
- genuine Health-driven Excused sick absence
- Skip Class recorded on actual school-day session
- discipline / Troublemaker integration
- school-nurse at-school gating
- school-nurse blocked from Home
- teacher help-hours end before all campus hours end
- closed day creates no normal absence
- migration idempotence / no fabricated attendance history
- School UI Current / Next / Attendance context
- no browser runtime errors

### Fresh regression after 4C.2 integration

- 4C.1 focused: **20/20 PASS**
- Phase 4B focused/final acceptance: **136/136 PASS**
- Phase 4A final acceptance: **32/32 PASS**
- Phase 3C final acceptance: **29/29 PASS**
- Phase 3B final acceptance: **5/5 PASS**
- H3 focused/regression: **50/50 PASS**

**Fresh explicitly rerun checkpoint/core total: 293/293 PASS**

### Syntax / reproducible build

- `node --check game.js` — PASS
- `node --check src/modules/schoolclasses4c2.js` — PASS
- `node --check src/modules/school72.js` — PASS

Final authoritative rebuild is byte-identical:

- `game.js`: `0013d68f265e63541206d9a4e9ea16e80b90f07f657c6cffc4f23b62d87514c8`
- `style.css`: `801ca0d091146469420d32800e274bd14f3f3b8968f7ac567609dbba7d61f16d`
- shipped `qa/harness.py`: `9b681b9e0f3f896c094a54b0d2258c192c34f370b12042cdaff8024bf68ce488`

After the clean rebuild:

- 4C.1 remained **20/20 PASS**
- 4C.2 remained **21/21 PASS**

## Known limitations / deferred scope

Intentional checkpoint boundaries:

- 4C.2 uses the existing compact timetable rather than building a timetable editor.
- Lunch-period realism, packed lunch, facilities, same-school social availability and phone rules remain 4C.3.
- Homework pacing, no-break homework generation, after-school schedule conflicts, campus-close obligation handling, family-dinner timing and fast-forward consequences remain 4C.4.
- Full Phase 4C migration/regression/fuzz closeout remains 4C.5.
- Full competition registration/event lifecycle remains Phase 4D.

## Exact resume point

**4C.3 — Lunch / Breaks / Needs / Campus Facilities**

STOP. 4C.3 has NOT started.

---

# Checkpoint completed

**4C.3 — Lunch / Breaks / Needs / Campus Facilities**

## Implementation

Phase 4C.3 extends the existing 4C school-day context and reuses the canonical needs, inventory, school identity and Phase 3C device systems. It does not introduce school-only duplicate Hunger/Bladder/Hygiene/device state.

Lunch / food:

- the existing timetable Lunch period remains the canonical lunch window
- cafeteria lunch is backend-gated to the actual lunch period and cannot behave as an all-day restaurant
- cafeteria lunch writes `ateLunch` / `lunchSource` onto the existing current `schoolDay` event
- packed lunch uses the real inventory-backed `sandwich` item rather than an invisible school-food counter
- packed lunch may come from an already-owned sandwich, a legitimate in-household caregiver, or age/skill-appropriate self-preparation
- caregiver-backed packed lunches retain stable caregiver `personId` provenance
- eating a packed lunch consumes the actual inventory item
- vending-machine snacks use the existing `snackPack` / `juiceBox` item definitions, spend Player funds, create a real inventory item and consume that item immediately
- missing lunch while actually attending school produces a one-time canonical Hunger / Energy consequence rather than a duplicate school-only need

Breaks / facilities:

- two short deterministic school-break windows provide limited free-action context without creating a second school clock
- class actions are suppressed during those break windows
- `schoolClassSession4C2()` now reports a break context during those minutes so UI/class context does not contradict facilities state
- restroom uses the existing canonical Toilet/Bladder need
- non-urgent restroom use is deferred during class; urgent restroom use remains possible
- Wash Hands uses the existing Hygiene need with only a modest gain
- short school rest is limited to break/lunch/after-school context, consumes only the available short window and is daily-capped
- Shower, Bath, Nap and full Sleep remain backend-blocked as normal school actions

School social availability:

- lunch social candidates are filtered through Phase 4A school identity
- known People/NPCs must currently belong to the Player's school to be selected for an at-school lunch interaction
- an NPC transferred to another school no longer appears magically in the same-school lunch pool
- generic classmate fallback remains possible without inventing a known out-of-school friend

Phone / smartwatch context:

- Phase 3C remains the canonical device/contact system
- `schoolDeviceUseGate4C3()` adds only school-context permission
- smartphone / smartwatch direct communication is blocked during ordinary class time
- appropriate break, lunch and after-school context permits device use where the school-stage rule allows it
- primary-school device use remains more restrictive than middle/high-school use
- `canUsePhone()`, `phoneLockReason()` and Phase 3C communication eligibility now agree with the school-context backend gate
- no duplicate school phone state or separate message history is created

School UI:

- the existing School area gains a compact Facilities context rather than another tab/dashboard
- shows lunch/break/after-school facility state, packed-lunch provenance when relevant, and contextual phone availability
- exposes only functional actions: cafeteria, packed lunch, same-school social lunch, restroom, wash hands, short rest and vending where appropriate

Explicitly NOT implemented in 4C.3:

- homework timing/staggering overhaul
- school-break homework suppression
- full after-school scheduling/conflict lifecycle
- family-dinner timing consequences
- fast-forward/Next Day school-obligation overhaul
- Phase 4D competition/event lifecycle
- Phase 5A workbook system
- Phase 5B summer/tutoring catalog
- Phase 6 Prom expansion
- Phase 7 Transportation

## Files changed

Authoritative source / build tooling:

- `src/modules/schoolfacilities4c3.js` — NEW canonical 4C.3 lunch/facilities/social/device-context layer
- `src/modules/schoolday4c1.js` — packed-lunch preparation hook and facility-aware backend action gate
- `src/modules/schoolclasses4c2.js` — short-break context integration
- `src/modules/school72.js` — canonical 4C.3 lunch routing, break-aware class action gating and facility click routing
- `src/modules/core72.js` — 4C.3 reconciliation hook
- `src/modules/ui72.js` — compact School facilities context
- `src/modules/inv72.js` — school-context phone gate agreement
- `src/modules/communication3c1.js` — school-context communication eligibility agreement
- `tools/splice.py` — includes 4C.3 module, migration and QA exports

Generated output:

- `game.js` — rebuilt from authoritative source
- `style.css` — unchanged/generated per current build baseline

QA / progress:

- `qa/t_4c3.py` — NEW focused 4C.3 suite
- `PHASE_4C_PROGRESS.md` — updated checkpoint tracker/report

## Migration

`migrateSchoolFacilities4C3()` is conservative and idempotent.

It initializes only the minimal per-date facility runtime metadata required by current/future school days.

It does NOT:

- fabricate historical meals
- fabricate missed-lunch penalties for old dates
- create fake caregiver meal history
- create old vending purchases
- create duplicate needs state
- create duplicate phone/contact state
- create fake school-social relationships

Existing valid inventory items, `schoolDay` attendance events, needs values, People/NPC school identities and Phase 3C communication state remain canonical.

## Tests

### 4C.3 focused

`qa/t_4c3.py`: **20/20 PASS**

Covered:

- packed lunch is a real inventory sandwich
- packed-lunch caregiver identity is legitimate
- packed lunch works only in lunch context and affects canonical Hunger
- packed lunch is consumed from inventory
- cafeteria works during lunch
- cafeteria is unavailable as a normal lunch at 4 PM
- missing lunch affects Hunger once
- missed-lunch consequence is idempotent
- school restroom affects canonical Toilet/Bladder need
- Wash Hands affects Hygiene modestly
- full Shower / full Sleep remain unavailable at school
- short break recognized and short rest fits the available break duration
- at-school social candidates are same-school only
- another-school NPC is excluded from the school social pool
- after-lunch vending uses real money/item lifecycle
- smartphone/communication blocked during class
- smartphone available during lunch context when otherwise eligible
- migration idempotence
- School UI Facilities / Phone context
- no browser runtime errors

### Fresh regression after 4C.3 integration

- 4C.1 focused: **20/20 PASS**
- 4C.2 focused: **21/21 PASS**
- Phase 4B.1: **23/23 PASS**
- Phase 4B.2: **27/27 PASS**
- Phase 4B.3: **33/33 PASS**
- Phase 4B.4: **30/30 PASS**
- Phase 4B.5 acceptance: **23/23 PASS**
- Phase 4B.5 fuzz: **17/17 PASS** (720 randomized operations)
- Phase 4A final acceptance: **32/32 PASS**
- Phase 3C final acceptance: **29/29 PASS**
- Phase 3B final acceptance: **5/5 PASS**
- H3 focused/regression: **50/50 PASS**

No production regression was found in the rerun matrix.

### Syntax / reproducible build

- `node --check game.js` — PASS
- `node --check src/modules/schoolfacilities4c3.js` — PASS
- `node --check src/modules/schoolclasses4c2.js` — PASS
- `node --check src/modules/schoolday4c1.js` — PASS
- `node --check src/modules/school72.js` — PASS
- `node --check src/modules/inv72.js` — PASS
- `node --check src/modules/communication3c1.js` — PASS

Final authoritative rebuild is byte-identical:

- `game.js`: `2144651ea2c544afa2b488e359dba934e4cabab9c5e2ace43b72a2b04adc3a2c`
- `style.css`: `801ca0d091146469420d32800e274bd14f3f3b8968f7ac567609dbba7d61f16d`
- shipped `qa/harness.py`: `9b681b9e0f3f896c094a54b0d2258c192c34f370b12042cdaff8024bf68ce488`

`tools/theme.py` continues to report the pre-existing unmapped `rgba(30,24,16,.42)` token documented in `QC_REPORT.md`. The tool does not modify the validated `style.css` in this state; 4C.3 adds no CSS/theme dependency, so that pre-existing build-tool mapping issue remains out of scope.

After the clean rebuild, 4C.3 was rerun and remained **20/20 PASS**.

## Known limitations / deferred scope

Intentional checkpoint boundaries:

- 4C.3 does not change homework generation/pacing; that remains 4C.4.
- Full after-school obligation conflict resolution, campus-close behavior, family-dinner interaction and fast-forward attendance/obligation handling remain 4C.4.
- Full Phase 4C migration/regression/fuzz closeout remains 4C.5.
- Full competition/event registration lifecycle remains Phase 4D.

## Exact resume point

**4C.4 — Homework / After-School / Going Home / School Break Logic**

STOP. 4C.4 has NOT started.

---

# Checkpoint completed

**4C.4 — Homework / After-School / Going Home / School Break Logic**

## Implementation

Phase 4C.4 hardens the existing homework, calendar, club, location/time, family-meal and Next Day flows rather than adding parallel schedulers.

Homework pacing and due dates:

- `homeworkLoadPolicy4C4()` derives workload from the actual instructional day of the current semester.
- the first two instructional days do not generate routine normal homework.
- days 3–5 use a deliberately light workload (maximum one active assignment).
- days 6–10 ramp gradually, and established-term days return to the existing multi-subject workload ceiling.
- even forced/internal homework generation cannot bypass a school break or the first-day suppression rule.
- `nextHomeworkDue4C4()` uses actual future school days and avoids assigning all currently active subjects the same due date.
- assignments now retain `assignedDate` and a grade-appropriate `estimatedMinutes` value.
- Summer/Winter/other academic closures suppress routine homework generation through the existing school calendar; no Phase 5B summer-school system is introduced.

Homework location:

- `doHomework()` now uses `homeworkStudyContext4C4()` as a backend rule.
- Home remains the normal study location.
- a legitimate library/study context is allowed where available.
- School permits homework only in the after-school study window while campus is still open.
- ordinary in-class time does not permit homework farming.

After-school scheduling and conflict integrity:

- existing `clubSession` calendar events remain canonical.
- `afterSchoolActivityGate4C4()` requires the event to be on the current school day, after normal class dismissal, before campus close, while the Player is physically at School.
- `timedSchoolConflict4C4()` rejects true overlaps between mutually exclusive school/work/event obligations.
- exact endpoint adjacency is not treated as an overlap.
- `attendClubSession()` now enforces this backend gate instead of relying only on UI availability.
- a real scheduled after-school obligation gives the Player a legitimate reason to remain on campus after class dismissal.
- normal classes do not extend beyond the existing class-day end.

Campus closing / Go Home:

- 4C.1 remains the canonical physical-location system.
- time advancement now reconciles 4C.4 after-school state, which in turn reuses 4C.1 campus-close handling.
- a Player left at School after campus close is normalized Home instead of retaining an all-night school state.
- explicit `goHomeFromSchool4C1()` remains the canonical Go Home transition and continues to consume commute time.

Family dinner hook:

- existing family dinner behavior is preserved rather than replaced by a new meal system.
- 4C.4 tracks only current-date dinner timing metadata.
- the dinner window is approximately 7:00–8:00 PM.
- if the Player remains away through the meal window, the dinner can become `Missed`.
- where an eligible communication device exists, the hook can surface one household timing notification without creating a duplicate communication system.
- returning after a missed dinner provides a lighter leftovers outcome rather than granting the full family-meal closeness benefit retroactively.

Next Day / time advancement:

- existing time/calendar processing remains canonical.
- school-day obligations continue to resolve while time advances.
- using Next Day on an unattended required school day cannot silently erase the attendance consequence.
- 4C.4 does not block fast-forward globally; it preserves the existing obligation-resolution behavior.

School UI:

- the existing School area gains a compact **After school & homework** context block.
- it communicates current homework load/pacing, legitimate study-location state, campus closing time, dinner timing/status and the next scheduled after-school obligation.
- no new multi-tab dashboard is introduced.

Explicitly NOT implemented in 4C.4:

- Phase 4D competition registration/discovery lifecycle
- Phase 5A workbook Level I/II/III system
- Phase 5B tutoring/summer-program catalogs
- Phase 6 Prom expansion
- Phase 7 transportation fares/vehicle systems
- Phase 4C.5 final migration/regression/fuzz closeout

## Files changed

Authoritative source / build tooling:

- `src/modules/schoolafter4c4.js` — NEW 4C.4 homework pacing, after-school conflict, dinner and reconciliation layer
- `src/modules/core72.js` — homework generation/location gating, club attendance backend gate, 4C.4 reconciliation
- `src/modules/misc72.js` — canonical time-advance reconciliation hook
- `src/modules/ui72.js` — compact after-school/homework School context
- `tools/splice.py` — includes 4C.4 module, migration and QA exports

Generated output:

- `game.js` — rebuilt from authoritative source
- `style.css` — rebuilt per `BUILD.md`; no 4C.4 style-source change

QA / progress:

- `qa/t_4c4.py` — NEW focused 4C.4 suite
- `PHASE_4C_PROGRESS.md` — updated checkpoint tracker/report

## Migration

`migrateSchoolAfter4C4()` is conservative and idempotent.

It initializes only current runtime metadata needed for after-school/dinner handling and may fill safe metadata (`assignedDate`, `estimatedMinutes`) on currently active legacy homework.

It does NOT:

- fabricate historical attendance
- fabricate old missed dinners
- create historical homework records
- retroactively generate assignment workloads
- fabricate old after-school events
- reroll existing calendar outcomes

Repeated migration reaches the same current-state result.

## Tests

### 4C.4 focused

`qa/t_4c4.py`: **22/22 PASS**

Covered:

- no first-school-day routine homework spam
- lighter early-term workload
- normal later-term homework load
- staggered due dates
- assignment date / estimated duration metadata
- in-class homework blocked by backend
- Home homework works
- legitimate after-school study works
- Summer/break routine homework suppression
- scheduled after-school reason to remain on campus
- after-school club attendance in the valid window
- true schedule overlap detection
- conflicting club attendance rejection
- endpoint-touching is not treated as overlap
- campus-close reconciliation
- explicit Go Home completion
- missed family dinner while staying out
- leftovers instead of full dinner benefit after a missed dinner
- Next Day preserves attendance consequence
- migration idempotence / no attendance fabrication
- School UI after-school context
- no browser runtime errors

### Regression after 4C.4 integration

- 4C.1 focused: **20/20 PASS**
- 4C.2 focused: **21/21 PASS** on clean rerun
- 4C.3 focused: **20/20 PASS**
- Phase 4B.5 acceptance: **23/23 PASS**
- Phase 4B.5 fuzz: **17/17 PASS** (720 randomized operations)
- Phase 4A final acceptance: **32/32 PASS**
- Phase 3C final acceptance: **29/29 PASS**
- Phase 3B final acceptance: **5/5 PASS**
- H3 focused/regression: **50/50 PASS**

One post-build 4C.2 run hit the existing stochastic `morningDelay()` path (6% base chance) and therefore recorded the nominal on-time test arrival as tardy. An immediate clean rerun was **21/21 PASS**. No 4C.4 production change was made to suppress that pre-existing gameplay event or weaken the earlier test.

### Syntax / reproducible build

- `node --check game.js` — PASS
- `node --check src/modules/schoolafter4c4.js` — PASS
- `node --check src/modules/core72.js` — PASS
- `node --check src/modules/misc72.js` — PASS

Final authoritative rebuild is byte-identical:

- `game.js`: `b253b1685f9425e2d0eb123241d3059f04742842c21b8997af16ba4e64553836`
- `style.css`: `801ca0d091146469420d32800e274bd14f3f3b8968f7ac567609dbba7d61f16d`
- shipped `qa/harness.py`: `9b681b9e0f3f896c094a54b0d2258c192c34f370b12042cdaff8024bf68ce488`

`tools/theme.py` completed successfully and reported no remaining literal hex outside tokens. The final 4C.4 focused suite was rerun after rebuild and remained **22/22 PASS**.

## Known limitations / deferred scope

Intentional checkpoint boundary:

- 4C.4 does not perform the full Phase 4C migration/regression/fuzz matrix; that is 4C.5.
- existing `morningDelay()` remains intentionally stochastic and can make an “on-time” QA setup arrive late unless the random event does not fire; this is pre-existing gameplay, not a 4C.4 regression.
- full competitions/events, workbook progression, summer/tutoring expansion, Prom and Transportation remain later phases.

## Exact resume point

**4C.5 — Migration / Regression / Fuzz / Final QA**

STOP. 4C.5 has NOT started.



---

# Checkpoint completed

**4C.5 — Migration / Regression / Fuzz / Final QA**

## Final implementation / hardening

4C.5 did not add a new gameplay subsystem. It audited and hardened the completed 4C.1–4C.4 architecture, added final acceptance/fuzz coverage, and fixed one real backend edge case found by fuzzing.

Production fix found during final fuzz:

- `teacherAvailability4C2()` previously considered physical School location + class time sufficient for in-class teacher access.
- A malformed/edge runtime state could therefore report a teacher as available even when there was no active `schoolDay` attendance session.
- `askTeacher4C2()` then attempted to write to `sessionEvent().periods`, causing a null dereference.
- 4C.5 now requires an active `Attending` school-day session for in-class/lunch teacher help, and `Attending` or `Attended` attendance evidence for after-school teacher help.
- `askTeacher4C2()` also has a defensive session guard before writing class-period state.
- This preserves the 4C rule that physical location alone is not enough to fabricate school participation.

No Phase 4D, Phase 5A/5B, Phase 6, or Phase 7 gameplay was added.

## Files changed in 4C.5

Authoritative source:

- `src/modules/schoolclasses4c2.js` — hardened teacher availability / active-session integrity discovered by final fuzz

QA / closeout:

- `qa/t_4c5_accept.py` — NEW final representative-scenario and migration acceptance suite
- `qa/t_4c5_fuzz.py` — NEW randomized 4C invariant/fixed-point fuzz suite
- `PHASE_4C_PROGRESS.md` — final checkpoint + Phase 4C closeout
- `CHANGELOG.md` — Phase 4C completion note
- `QC_REPORT.md` — final QA summary and legacy-suite notes
- `MIGRATION_NOTES.md` — 4C migration fixed-point note

Generated outputs:

- `game.js` — rebuilt from authoritative source
- `style.css` — rebuilt from `src/style_before_theme.css`; no 4C.5 style-source change

## Migration / save integrity

Final migration validation runs the 4C migrations repeatedly in canonical order:

1. `migrateSchoolDay4C1()`
2. `migrateSchoolClasses4C2()`
3. `migrateSchoolFacilities4C3()`
4. `migrateSchoolAfter4C4()`

Verified properties:

- repeated migration reaches a fixed point
- no duplicate `schoolDay` obligations are fabricated
- no historical attendance is invented
- no historical absence is retroactively added by migration
- no routine homework history is fabricated
- active legacy homework receives only safe current metadata where already permitted by 4C.4
- physical location / bound `schoolId` stays coherent
- save → load preserves semantic daily-school state
- volatile reconciliation metadata (`lastReconcile`, `lastTransition`) may naturally refresh on load and is not treated as gameplay-state drift

## 4C.5 acceptance

`qa/t_4c5_accept.py`: **28/28 PASS**

Representative scenarios covered:

- elementary school day
- middle-school day
- high-school day
- no-device child
- smartphone teen
- physical School / Home transition integrity
- save/reload while at School
- home-only action blocked at School
- Ask Teacher blocked from Home
- Present attendance
- Late attendance with minutes-late metadata
- skipped class + discipline consequence
- whole-day unexcused absence through time advancement
- genuine sick / excused absence
- school nurse location/session gate
- lunch-time cafeteria behavior
- cafeteria unavailable as an all-day restaurant
- short-break duration/context
- class phone restriction vs lunch availability
- Winter/holiday closure
- Summer break closure / no normal homework
- later-term homework pacing + staggered due dates
- after-school campus activity eligibility
- campus closing reconciliation
- explicit Go Home transition
- missed family dinner while staying out
- Phase 4B organization ownership still intact
- full 4C migration fixed point
- no fabricated school/homework history
- semantic save/reload stability
- no browser runtime errors

## 4C.5 fuzz

`qa/t_4c5_fuzz.py`: **21/21 PASS**

- **800 randomized operations**
- profiles: elementary child, middle-school student, high-school student without phone, high-school student with smartphone
- 25 randomized school days per profile
- randomized transitions/actions include school travel, Go Home, class actions, teacher help attempts, facilities, device-use checks, homework generation/completion, migration, reconciliation and save/load
- invariants checked repeatedly:
  - Needs stay bounded
  - School physical location implies valid canonical School context
  - School location cannot survive campus-closed state
  - bound `locationSchoolId` matches current school
  - no duplicate daily `schoolDay` obligation per date
  - open homework retains due-date integrity
  - repeated full 4C migration reaches a fixed point
  - save/reload preserves semantic state
  - no browser JS errors

## Fresh Phase 4C totals

- 4C.1 focused: **20/20 PASS**
- 4C.2 focused: **21/21 PASS**
- 4C.3 focused: **20/20 PASS**
- 4C.4 focused: **22/22 PASS**
- 4C.5 acceptance: **28/28 PASS**
- focused / acceptance subtotal: **111/111 PASS**
- 4C.5 fuzz: **21/21 PASS — 800 randomized operations**
- formal Phase 4C acceptance criteria: **50/50 verified**

Acceptance criteria 1–50 were cross-checked against the 4C.1–4C.5 focused/acceptance/fuzz suites, including location, school open/closed state, class/teacher/attendance behavior, Health sick leave, lunch/needs/facilities, school-aware social/device behavior, homework pacing/break suppression, after-school scheduling/campus closing, family dinner, fast-forward consequences, prior-phase integrity, migration, save/reload and reproducible generation.

## Fresh required prior-phase regression

Completed after 4C.5 integration:

- Phase 4B focused/acceptance: **136/136 PASS**
- Phase 4B fuzz: **17/17 PASS — 720 randomized operations**
- Phase 4A focused/acceptance: **114/114 PASS**
- Phase 4A fuzz: **17/17 PASS**
- Phase 3C focused/acceptance: **118/118 PASS**
- Phase 3C fuzz: **13/13 PASS**
- Phase 3B focused/acceptance: **81/81 PASS**
- Phase 3B fuzz: **13/13 PASS**
- H3: **50/50 PASS**
- HOTFIX-P1 through QA-only portable harness: **74/74 PASS** (`22/22 + 24/24 + 28/28`)
- Phase 3A final validation `t_3a7`: **13/13 PASS**

Additional required system regression completed:

- Health: `t_health` **23/23**, `t_med` **15/15**, `t_nurse` **23/23**, `t_care` **22/22**
- Family: `t_family` **13/13**, `t_family2` **22/22**
- Calendar/Holidays: `t_holidays` **57/57**
- Needs/balance: `t_balance` **1/1**
- School/system suites completed cleanly: `t_campus` **21/21**, `t_context` **28/28**, `t_events` **22/22**

`qa/harness.py` was never shipped with QA-path edits. QA-only portable runs used `set_content` + the current `game.js/style.css` because sandbox Chromium blocks the legacy `file://` navigation path; the original harness was restored to SHA-256 `9b681b9e0f3f896c094a54b0d2258c192c34f370b12042cdaff8024bf68ce488`.

## Legacy-suite notes / not counted as fresh passes

These are documented rather than used to weaken current production behavior:

- `t_exam.py`: its legacy §51 path assumes clicking **Take Assessment from Home** implicitly checks the Player into School. Phase 4C intentionally forbids that teleport; current 4C requires real location/time/session context. The relevant modern 4C tests pass.
- `t_schoolyear.py`: uses a fixed 2016–2017 academic timeline that no longer matches the current canonical creator/calendar progression; several checks fail before later state is even created.
- `t_sch.py`: its legacy university/scholarship setup expects `schEssay` state that the current setup path no longer creates; it exits before completing that tail.
- `t_day.py`, `t_regress.py`, old generic `t_fuzz.py`: contain real page `reload()` flows. The QA-only `set_content` compatibility harness cannot emulate browser navigation reload/localStorage semantics in this sandbox. Dedicated 4C.5 save/load and fuzz tests cover current semantic persistence directly.
- `t_hij.py`: exceeded the sandbox execution window in the legacy harness run; no assertion failure was observed before timeout.
- `t_jordan.py`: its legacy fixture expects Grade 1 / primary-school identity on a historical setup that now migrates to the current canonical school identity; the run reached **9 PASS / 1 legacy expectation mismatch** before timing out in an old chat-wait path. It is not counted as a fresh current-architecture pass.
- a first 4A.4 regression run was stochastic at **16/18**; an immediate clean rerun completed **18/18 PASS**. No source change was made to suppress randomness.

## Reproducible build

Final authoritative rebuild is byte-identical before/after rebuild:

- `game.js`: `7a0afa3f27ddfc5228dd16c2d5a3b34301abca8e5f92d8823e759214fe161686`
- `style.css`: `801ca0d091146469420d32800e274bd14f3f3b8968f7ac567609dbba7d61f16d`
- `qa/harness.py`: `9b681b9e0f3f896c094a54b0d2258c192c34f370b12042cdaff8024bf68ce488`

Validation:

- `node --check game.js` — PASS
- `node --check src/modules/schoolclasses4c2.js` — PASS
- `tools/splice.py` rebuild — byte-identical
- `tools/theme.py` — PASS, `remaining literal hex outside tokens: []`

## Known limitations / deferred scope

Intentionally deferred beyond Phase 4C:

- Phase 4D competition registration/discovery / Join–Not Join–Withdraw–Out lifecycle
- Phase 5A workbook Level I/II/III overhaul
- Phase 5B summer-school/tutoring/program expansion
- Phase 6 Prom expansion
- Phase 7 transportation fares/passes/fuel/maintenance/school-bus lifecycle

## Exact next resume point

**Phase 4D — Competitions / School Events**

STOP. Phase 4D has NOT started.

**PHASE 4C COMPLETE — Ready for final audit before Phase 4D.**
