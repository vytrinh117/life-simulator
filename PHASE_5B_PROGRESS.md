# PHASE 5B — SUMMER PROGRAMS / TUTORING / SUMMER JOBS

## Status

**PHASE 5B COMPLETE**

Prerequisites verified before implementation:

- H3 COMPLETE
- HOTFIX-P1 COMPLETE
- Phase 3A COMPLETE
- Phase 3B COMPLETE
- Phase 3C COMPLETE
- Phase 4A COMPLETE
- Phase 4B COMPLETE
- Phase 4C COMPLETE
- Phase 4D COMPLETE
- Phase 5A COMPLETE
- CURRENT source inspected
- `BUILD.md` inspected; `src/` remains authoritative and root `game.js` / `style.css` remain generated outputs

## Phase 5B Checkpoint Tracker

- [x] 5B.1 — Summer / After-School Program Foundation
- [x] 5B.2 — Formal Programs / Coaches / Attendance / Skills
- [x] 5B.3 — Tutoring / Summer Academics / Social Integration
- [x] 5B.4 — Summer Jobs / Shifts / Pay / Work-School Compatibility
- [x] 5B.5 — Migration / Regression / Fuzz / Final QA

Phase 5B is complete. Do not automatically begin Phase 5C.

---

# Checkpoint completed

**5B.1 — Summer / After-School Program Foundation**

## Architecture audit / implementation

Phase 5B.1 extends the already-shipped summer-program architecture instead of creating a parallel system.

Existing architecture retained:

- `PROGRAMS` remains the legacy/canonical template source for the existing summer activities/jobs.
- `S.programs` remains the Player program/enrollment state.
- Calendar `type:'program'` events remain the scheduling/obligation source.
- existing `CASUAL` + `casualPractice()` remains the flexible casual-practice path.
- existing skill/economy/Calendar/Decision Ledger systems remain authoritative.

New canonical foundation in `src/modules/programs5b1.js`:

- program definitions are normalized with category, provider/location, group/1:1/team format, formal-vs-job kind, season/scope and safety metadata
- the existing ten non-job program templates remain the meaningful formal catalog rather than being copied into a second store
- stable offering IDs use template + academic year/region + scope, e.g. `program:artClass:US-2025:summer`
- each enrollment in `S.programs` is enriched with stable `programId`, lifecycle, canonical schedule metadata, cost/provider/location/category/format and Calendar references
- summer/major-break state is read from the Phase 4C/academic calendar rather than from a new seasonal clock
- existing Music lessons and Summer soccer league can also form legitimate school-term extracurricular offerings when their schedules fit; summer-only camps remain summer-only
- casual practice remains separate, free/flexible, and does not create formal enrollment/attendance obligations

## Discovery

- `discoverProgramOffers5B1()` derives stable age/season/schedule-eligible offerings from the existing program templates
- discovery uses stable offering identity, so repeatedly opening/searching does not reroll a different copy of the same program
- discovery provenance is recorded as a school notice board for school-term extracurriculars or community listing for summer offerings
- no disposable `Find Program` reroll engine was created

## Enrollment lifecycle

Canonical Player enrollment states now distinguish:

- Available
- Permission needed
- Considering
- Declined
- Enrolled
- Active
- Done / Completed
- Dropped / Removed
- Superseded (migration-only duplicate cleanup)

Legacy `status` remains compatible while `lifecycle` exposes the canonical meaning.

Successful formal enrollment:

- writes one canonical `S.programs` enrollment record
- keeps a stable `programId`
- records the real program schedule/date range
- creates real Calendar `program` sessions using deterministic IDs
- persists through save/reload
- cannot silently duplicate the same offering

## Parent / guardian permission

Minor formal-program enrollment is routed through the existing H3 Central Decision Ledger:

- legal decision maker comes from `decisionAuthorityPerson()`
- ordinary older siblings/caregivers are not treated as legal program-enrollment authority
- decision context includes the canonical program, cost, schedule, age, wealth and school context
- permission scoring uses cost, family finances, trust/responsibility, household strictness, safety and academic context
- outcomes currently support Yes / Considering / No
- repeated clicking with unchanged context reuses the same Decision Ledger record and cannot reroll a decline
- reconsideration becomes possible only when the ledger's real reconsideration condition/date permits it

Program funding reuses existing Player money plus household-economy context. Comfortable/wealthier approved households may cover the fee; Modest/Struggling households may require a Player contribution. No second money balance was introduced.

## Schedule conflict validation / Calendar integration

Enrollment validates the entire proposed program schedule against existing non-terminal Calendar obligations before permission/payment is finalized.

Real overlap uses interval intersection (`start < otherEnd && otherStart < end`) across dates, so overlapping:

- plans
- school/club/event obligations
- another formal program
- work/family Calendar events

can block enrollment.

After-school offerings are scheduled only when their existing times fit the school calendar; summer offerings use the real academic-year summer window.

## Migration

`migratePrograms5B1()` is conservative and idempotent.

It:

- enriches existing `S.programs` records in place rather than replacing them
- preserves existing `attended`, `missed`, `streakMissed`, teammates, coach state, start/end dates and status
- assigns stable canonical program identity from explicit legacy template/start data
- links existing Calendar sessions without fabricating old attendance
- does not fabricate enrollment, instructors, certificates, job history or skill progression
- marks accidental duplicate live enrollments for the same canonical offering as `Superseded` rather than allowing two active copies
- repeated migration does not create new enrollment or Calendar duplicates

## Files changed

Authoritative source / build tooling:

- `src/modules/programs5b1.js` — NEW canonical 5B.1 foundation and compatibility overrides
- `tools/splice.py` — adds 5B.1 module, migration order and QA-call hooks

Generated / QA / docs:

- `game.js` — rebuilt from source
- `style.css` — rebuilt per `BUILD.md`; no style-source change
- `qa/t_5b1.py` — NEW focused 5B.1 suite
- `PHASE_5B_PROGRESS.md` — NEW Phase 5B tracker/report
- `CHANGELOG.md`
- `MIGRATION_NOTES.md`
- `QC_REPORT.md`
- `README.md`

## Tests

### 5B.1 focused

`qa/t_5b1.py`: **17/17 PASS**

Covered:

1. Summer break recognized from canonical academic calendar.
2. Casual practice remains distinct from formal programs.
3. Existing catalog provides at least ten meaningful formal options.
4. Formal offering has stable program ID, real dates/time and cost.
5. Discovery identity/provenance is stable and non-rerolling.
6. Eligible Player can enroll.
7. Minor permission uses H3 legal parent/guardian authority.
8. Enrollment creates real Calendar sessions.
9. Enrollment persists through save/reload.
10. Declined permission cannot be spam-rerolled.
11. Backend rejects real schedule overlap before enrollment/payment.
12. Migration prevents duplicate active enrollment.
13. Migration reaches an idempotent fixed point.
14. Legacy program attendance/miss state is preserved while enriched.
15. Existing school-term Music offering can become a real after-school schedule.
16. Program UI clearly separates Formal Programs from Casual Practice.
17. Zero browser runtime errors.

### Fresh regression after 5B.1

- Phase 5A.1–5A.4 focused: **93/93 PASS**
- Phase 5A.5 acceptance: **24/24 PASS**
- Phase 5A.5 fuzz: **10/10 PASS / 200 randomized operations**
- Phase 4D.5 acceptance: **23/23 PASS**
- Phase 4D.5 fuzz: **21/21 PASS / 200 randomized operations**
- Phase 4C.5 acceptance: **28/28 PASS**
- Phase 4B.5 acceptance: **23/23 PASS**
- Phase 4A.5 acceptance: **32/32 PASS**
- Phase 3C.5 acceptance: **29/29 PASS**
- Phase 3B.5 acceptance: **5/5 PASS**
- H3 focused regression: **50/50 PASS**

No production regression was identified.

## Syntax / reproducible build

- `node --check game.js` — PASS
- `node --check src/modules/programs5b1.js` — PASS
- `tools/theme.py` — PASS (`remaining literal hex outside tokens: []`)

Clean authoritative rebuild is byte-identical:

- `game.js`: `00ab504f29d254ab7d8a4cbac9c339eb2d7eb6785e521ed785a2bddc578e1c9d`
- `style.css`: `801ca0d091146469420d32800e274bd14f3f3b8968f7ac567609dbba7d61f16d`
- shipped `qa/harness.py`: `9b681b9e0f3f896c094a54b0d2258c192c34f370b12042cdaff8024bf68ce488`

## Known limitations / intentional deferrals

5B.1 establishes program entities/enrollment/scheduling only.

Not yet implemented or overhauled:

- canonical instructor/coach records
- 1:1/group/team progression differences beyond metadata
- new attendance model and attended/late/excused/absent statuses
- 10-consecutive-absence removal rule (the pre-existing legacy program behavior remains until 5B.2)
- formal-vs-casual progression rebalance
- stable program participant People/social provenance
- tryout success/failure overhaul
- program completion/badges overhaul
- maximum-three formal summer academic subjects
- tutoring 1:1/group system
- Phase 3B/3C tutoring social/contact integration
- summer job age-16+/shift/pay overhaul (pre-existing legacy summer work remains untouched until 5B.4)
- Make Plans break wording/selector overhaul
- final fast-forward program/job obligation audit

These belong to 5B.2–5B.4.


---

# Checkpoint completed

**5B.2 — Formal Programs / Coaches / Attendance / Skills**

## Architecture / implementation

Phase 5B.2 extends the canonical 5B.1 `PROGRAMS` / `S.programs` / Calendar architecture; it does not create a second program scheduler or skill system.

New authoritative module: `src/modules/programs5b2.js`.

### Instructor / format context

- every formal non-job program has one stable lightweight instructor record keyed by canonical `programId`
- instructor records persist name, role (coach/instructor), quality and opinion without forcing every instructor into the full People graph
- 1:1, group and team formats remain canonical metadata and now affect progression rate/social context
- jobs remain legacy/deferred to 5B.4

### Attendance lifecycle

Formal program sessions now record explicit session attendance state:

- Attended
- Late
- Excused
- Absent
- Cancelled

Only a real unexcused `Absent` increments the consecutive-absence streak.

- Attended or Late resets the consecutive absence streak
- Excused does not count as absence
- provider/program cancellation does not count as absence
- 9 consecutive qualifying absences do not remove the Player
- the 10th consecutive qualifying absence changes the enrollment to `Removed`, cancels remaining scheduled program sessions and records a clear outcome

This replaces the old legacy 3-miss auto-drop behavior for formal programs.

### Progression / skill / talent integration

- formal attended sessions grant progression only to the program's relevant canonical skill
- instructor quality, format, attendance quality, Player talent/personality and existing skill diminishing returns all affect the result through existing skill/evidence architecture
- formal sessions generally outpace equivalent casual practice
- Late attendance grants reduced effectiveness rather than full normal progression
- skipped sessions grant no progression
- repeated real training contributes gradual Phase 3A talent/Responsible evidence; one session cannot instantly create a Talent
- instructor opinion / legacy coach standing responds moderately to attendance without creating a duplicate relationship stat system

### Program People / provenance

Group/team programs may occasionally introduce one stable peer rather than generating a new friend every session.

When promoted into People:

- the existing NPC/person identity is reused
- canonical `programId` is stored in meeting provenance
- `metAt` / `metVia` preserve the real program context
- the participant ID is stored on the enrollment and survives save/reload
- 1:1 programs do not fabricate peer classmates

No tutoring-specific romance/contact automation is implemented here; that remains 5B.3.

### Competitive-program tryout hooks

Competitive Basketball/Soccer formal offerings now require a real tryout before enrollment.

- tryout score uses relevant skill, Talent evidence, Health, Energy, athletic standing and stable field strength
- the same offering cannot be rerolled by reopening UI
- Player can succeed or fail
- paying does not bypass a failed selection
- failed current-period tryout blocks enrollment but leaves casual practice/future-period opportunity possible
- successful tryout unlocks the normal 5B.1 enrollment/permission/payment path
- the Program UI exposes a functional `Try out` action; it is not a dead button

### Program completion

Program completion is now a persistent/idempotent record with:

- attendance rate
- bounded multi-factor completion score
- completion tier
- completion date

Meaningful finish/result hooks reuse the existing outcome, milestone, reputation and Phase 3A evidence systems without creating a second award engine.

## Migration

`migratePrograms5B2()` is conservative and idempotent.

It:

- enriches existing 5B.1 formal enrollments in place
- preserves explicit attended/missed/streak state
- maps legacy `streakMissed` into the canonical consecutive-absence field without fabricating new absences
- creates only deterministic lightweight instructor identity for an already-existing formal enrollment
- preserves existing teammate/participant IDs and deduplicates them
- does not invent historical session attendance, tryout results, skill gains, participants, completion results or certificates
- repeated migration keeps attendance, instructor identity, participants and lifecycle stable

## Files changed

Authoritative source / build tooling:

- `src/modules/programs5b2.js` — NEW 5B.2 formal-program instructor/attendance/progression/tryout layer
- `tools/splice.py` — adds 5B.2 module, migration order and QA-call hooks

Generated / QA / docs:

- `game.js` — rebuilt from authoritative source
- `style.css` — rebuilt per `BUILD.md`; no style-source change
- `qa/t_5b2.py` — NEW focused 5B.2 suite
- `PHASE_5B_PROGRESS.md`
- `CHANGELOG.md`
- `MIGRATION_NOTES.md`
- `QC_REPORT.md`

## Tests

### 5B.2 focused

`qa/t_5b2.py`: **19/19 PASS**

Covered:

1. Stable instructor context.
2. Explicit group/1:1/team format.
3. Attended session records attendance and relevant progression.
4. Attendance resets absence streak.
5. Late is distinct and tracked.
6. Stable program participant People provenance.
7. Instructor/participant context persists save/reload.
8. Formal progression generally outpaces casual practice.
9. Nine consecutive absences do not remove.
10. Tenth consecutive qualifying absence removes.
11. Cancelled session is not Player absence.
12. Attendance resets prior streak.
13. Competitive-program tryout can fail.
14. Competitive-program tryout can succeed.
15. Excused session is not absence.
16. Program completion is persistent/idempotent.
17. Migration is idempotent and preserves attendance.
18. UI surfaces instructor/attendance/streak context.
19. Zero browser runtime errors.

### Fresh regression after 5B.2

- 5B.1 focused: **17/17 PASS**
- Phase 5A focused/final acceptance: **117/117 PASS**
- Phase 5A.5 fuzz: **10/10 PASS / 200 randomized operations**
- Phase 4D focused/final acceptance: **110/110 PASS**
- Phase 4D.5 fuzz: **21/21 PASS / 200 randomized operations**
- Phase 4C focused/final acceptance: **111/111 PASS**
- Phase 4B.5 acceptance: **23/23 PASS**
- Phase 4A.5 acceptance: **32/32 PASS**
- Phase 3C.5 acceptance: **29/29 PASS**
- Phase 3B.5 acceptance: **5/5 PASS**
- H3 focused regression: **50/50 PASS**

Explicit focused/acceptance matrix: **513/513 PASS**. Dedicated prior-phase fuzz rerun: **31/31 PASS / 400 randomized operations**.

No production regression was identified.

## Syntax / reproducible build

- `node --check game.js` — PASS
- `node --check src/modules/programs5b2.js` — PASS
- `tools/theme.py` — PASS (`remaining literal hex outside tokens: []`)

Clean authoritative rebuild is byte-identical:

- `game.js`: `8ad65e8775df95f8e1829888ad86570bb110a951391cb9964a3ff003ff815cb6`
- `style.css`: `801ca0d091146469420d32800e274bd14f3f3b8968f7ac567609dbba7d61f16d`
- shipped `qa/harness.py`: `9b681b9e0f3f896c094a54b0d2258c192c34f370b12042cdaff8024bf68ce488`

## Known limitations / intentional deferrals

5B.2 does not implement:

- summer academic max-three-subject enrollment
- full 1:1/group tutoring product/schedule system
- tutoring-specific peer/crush/contact integration
- Phase 3C contact exchange from tutoring/program peers
- 5B.4 summer-job age-16+/shift/pay overhaul
- Make Plans school-break selector wording overhaul
- final fast-forward obligation audit

Those belong to 5B.3–5B.5.

## Exact resume point

**5B.3 — Tutoring / Summer Academics / Social Integration**

STOP here. Do not begin 5B.3 automatically.


---

# Checkpoint completed

**5B.3 — Tutoring / Summer Academics / Social Integration**

## Architecture / implementation

5B.3 extends the 5B.1/5B.2 canonical `S.programs` + Calendar architecture instead of creating a tutoring/summer-school scheduler in parallel.

- Added subject-specific academic program definitions derived from the Player's actual current school subjects.
- Academic offerings use stable template/program IDs and the existing formal-program lifecycle, permission, funding, Calendar, attendance, instructor, completion and migration systems.
- Summer academics expose real subject-specific group classes and 1:1 tutor options instead of the old generic "summerSchool buffs weakest subject" behavior.
- School-term tutoring exposes group and 1:1 after-school schedules with real dates/times/costs.
- Workbook self-study from Phase 5A remains separate and consumes no formal summer-academic slot.
- Structured Summer academics are capped at three concurrent subjects; a fourth distinct summer academic subject is backend-blocked.
- Low-scoring subjects expose optional support/remedial recommendations; strong subjects expose enrichment; neither auto-enrolls or recreates mandatory summer school.
- 1:1 tutoring costs more and gives a higher subject-specific learning gain than group tutoring; both remain bounded and do not guarantee perfect grades.
- Academic session progress targets the actual enrolled subject rather than the globally lowest subject.
- Group tutoring/summer classes may occasionally create one stable People peer using the existing 5B.2 participant system and canonical program provenance.
- 1:1 tutoring does not fabricate classmates.
- Program peers are not automatically Phone contacts; Phase 3C contact exchange remains required.
- Romance eligibility is delegated to Phase 3B compatibility; meeting someone in tutoring does not auto-create romance.

## Integration bug fixed during focused QA

The first 5B.3 run exposed a real schedule-definition mismatch: a 1:1 tutoring Calendar slot could start at a subject-specific time such as 4:30 PM while the dynamic program definition still reported a default 4:00 PM start. The 5B.2 attendance engine therefore treated an on-time arrival as `Late`, reducing 1:1 academic gain to group-level gain. 5B.3 now derives both the canonical definition and Calendar offering from the same `academicSchedule5B3()` source, so attendance and progression agree on the real session time.

## Migration

`migratePrograms5B3()` is conservative and idempotent.

It:

- enriches only explicit 5B.3 academic program records already present in `S.programs`
- restores subject/format/provider/location metadata from stable academic program IDs
- preserves existing 5B.1/5B.2 enrollment, attendance, instructor and participant state
- does not invent academic enrollments, tutoring history, peers, Phone contacts, romance history or academic gains
- does not reinterpret legacy generic `summerSchool` records as a guessed subject
- repeated migration reaches a fixed point

## Files changed

Authoritative source / build tooling:

- `src/modules/programs5b1.js` — dynamic academic-program definition hook
- `src/modules/programs5b2.js` — subject-aware academic-session hook, tutoring provenance/instructor support, compact 5B.3 UI/click integration
- `src/modules/programs5b3.js` — NEW tutoring/summer-academic/social integration
- `tools/splice.py` — module order, migration order, QA-call hooks and subject-selector change handling

Generated / QA / docs:

- `game.js` — rebuilt from source
- `style.css` — rebuilt per `BUILD.md`; no style-source change
- `qa/t_5b3.py` — NEW focused 5B.3 suite
- `PHASE_5B_PROGRESS.md`
- `CHANGELOG.md`
- `MIGRATION_NOTES.md`
- `QC_REPORT.md`

## Tests

### 5B.3 focused

`qa/t_5b3.py`: **20/20 PASS**

Covered:

1. Summer break remains canonical and academic enrollment optional.
2. Summer academic offerings are real subject-specific formal programs.
3. 1:1 and group tutoring remain distinct in format/cost/identity.
4. Remedial/enrichment are recommendations, not forced enrollment.
5. Phase 5A workbook study does not consume a formal summer subject slot.
6. Player can enroll in three distinct summer academic subjects.
7. Fourth distinct summer academic subject is backend-blocked.
8. Academic enrollment creates real Calendar sessions.
9. Enrollment survives save/reload.
10. School-year 1:1 tutoring consumes real scheduled time.
11. Academic gain targets the enrolled subject and remains modest.
12. 1:1 tutoring produces stronger subject progress than group tutoring.
13. Group tutoring can create stable People provenance.
14. Tutoring peer is not automatically a Phone contact.
15. Romance eligibility delegates to Phase 3B compatibility.
16. 1:1 tutoring creates no fabricated classmate.
17. Summer academics do not reintroduce ordinary mandatory homework.
18. 5B.3 migration is idempotent and social-history safe.
19. UI exposes compact subject selector plus 1:1/group options.
20. Zero browser runtime errors.

### Fresh regression after 5B.3

- 5B.1: **17/17 PASS**
- 5B.2: **19/19 PASS**
- Phase 5A focused/final acceptance: **117/117 PASS**
- Phase 5A fuzz: **10/10 PASS / 200 randomized operations**
- Phase 4D.5 acceptance: **23/23 PASS**
- Phase 4D.5 fuzz: **21/21 PASS / 200 randomized operations**
- Phase 4C.5 acceptance: **28/28 PASS**
- Phase 4B.5 acceptance: **23/23 PASS**
- Phase 4A.5 acceptance: **32/32 PASS**
- Phase 3C.5 acceptance: **29/29 PASS**
- Phase 3B.5 acceptance: **5/5 PASS**
- H3 focused regression: **50/50 PASS**

Primary fresh focused/acceptance matrix: **363/363 PASS**. Dedicated prior-phase fuzz rerun: **31/31 PASS / 400 randomized operations**.

## Syntax / reproducible build

- `node --check game.js` — PASS
- `node --check src/modules/programs5b1.js` — PASS
- `node --check src/modules/programs5b2.js` — PASS
- `node --check src/modules/programs5b3.js` — PASS
- `tools/theme.py` — PASS (`remaining literal hex outside tokens: []`)

Clean authoritative rebuild is byte-identical:

- `game.js`: `02f3148896dd9d452ce26d80c8e478a3b41f39a9872887894d53e464bf6ba28c`
- `style.css`: `801ca0d091146469420d32800e274bd14f3f3b8968f7ac567609dbba7d61f16d`
- shipped `qa/harness.py`: `9b681b9e0f3f896c094a54b0d2258c192c34f370b12042cdaff8024bf68ce488`

## Known limitations / intentional deferrals

5B.3 does not implement the 5B.4 summer-job overhaul. Legacy job options remain untouched until 5B.4, where age-16+ eligibility, application/employment state, shift attendance, per-shift pay, missed/late consequences and end-of-summer compatibility are due.

5B.3 also does not auto-create Phone contacts or romance relationships from program peers. Those systems intentionally remain governed by Phase 3C and Phase 3B.

## Exact resume point

**5B.4 — Summer Jobs / Shifts / Pay / Work-School Compatibility**

Do not begin 5B.4 automatically.


---

# Checkpoint completed

**5B.4 — Summer Jobs / Shifts / Pay / Work-School Compatibility**

## Architecture / implementation

5B.4 upgrades the existing teen summer-work path instead of creating an incompatible second employment engine.

- The adult career system in `work73.js` / `S.career.job` remains unchanged.
- Teen summer employment stays inside the existing `S.programs` + Calendar obligation architecture used by the legacy summer jobs and 5B.1–5B.3.
- New standard summer employment is limited to ages **16–17**. Younger `babysit` / `lawn` legacy records are preserved for old saves but are not offered as standard 5B.4 employee jobs; younger side-hustle overhaul remains Phase 5D scope.
- Four canonical summer-job definitions are available when Summer dates/schedule allow:
  - Café Assistant / Food Service
  - Retail Assistant / Retail
  - Recreation Assistant / Recreation
  - Library Assistant / Community
- Stable employment IDs use job definition + academic/summer season, while stable manager/coworker lightweight identities derive from the canonical employment `programId`.
- Application is a real eligibility step rather than instant ownership of a job. Age, current schedule, relevant skill/responsibility/academic context and a stable field component contribute to the application score.
- An application may be accepted or rejected; paying money is not part of obtaining employment.
- Accepted employment writes one canonical summer-job record in `S.programs` and creates deterministic required Calendar shift events.
- Enrollment/application validates the full shift schedule against tutoring, formal programs and other live Calendar obligations before employment is created.

## Shift attendance / pay

Summer-job shifts reuse Calendar `type:'program'` obligations, so existing obligation notifications, fast-forward simulation hooks and the `Go` action remain compatible. `attendProgram()` / `programMissed()` delegate to the summer-job handler when the record is a 5B.4 employment record.

Shift state distinguishes:

- attended
- late
- missed

Completed shift behavior:

- pay is credited only when the shift is completed
- the shift ID is added to `paidShiftIds`
- save/reload or repeated calls cannot pay the same shift twice
- relevant work skill receives only modest progression
- Energy / Stress respond to actually working the shift
- manager/coworker lightweight opinion hooks update
- Responsibility evidence may be recorded through the existing Phase 3A evidence system

Missed shift behavior:

- no pay
- manager opinion and job performance fall
- one ordinary miss does not fire the Player
- repeated serious misses / very low performance can end the job

Late shift behavior:

- the shift is still a completed attendance event
- Calendar status is terminal `Attended` with `attendanceStatus='Late'`
- pay is reduced for the missed portion and tips are unavailable
- the shift cannot later be reprocessed as a no-show

## QA bug fixed during 5B.4

The first implementation marked a completed late shift with Calendar status `Late`. Core Calendar terminal statuses do not include `Late`, so a completed shift could later pass the grace window and be processed again as Missed. 5B.4 now follows the adult Work convention: completed late shifts use Calendar status `Attended` plus `attendanceStatus='Late'`. This preserves detail while making the obligation terminal and prevents contradictory late/no-show state or duplicate processing.

## End-of-summer compatibility

`summerJobsDaily5B4()` runs through the existing daily lifecycle. When the summer employment period ends / the school term returns, live summer employment becomes Completed and any remaining unresolved summer shifts are cancelled. The summer schedule is not silently carried into the school term.

Migration intentionally does **not** perform this daily transition during `migrate()`; migration only normalizes existing records. This prevents load/migration from fabricating an employment ending. The real daily lifecycle owns the summer-end transition.

## Migration

`migratePrograms5B4()` is conservative and idempotent.

It:

- enriches only explicit canonical 5B.4 employment records
- preserves pay history, attendance, performance, manager/coworker lightweight identities, dates and existing Calendar links
- marks legacy `babysit` / `lawn` / `cafe` / `lifeguard` program records as legacy 5B.4-compatible history without rewriting their past into new canonical employment
- does not fabricate applications, accepted employment, shifts, wages, manager/coworker history or old attendance
- does not repay completed shifts
- repeated migration reaches a fixed point

## Files changed

Authoritative source / build tooling:

- `src/modules/summerjobs5b4.js` — NEW canonical 5B.4 summer-employment / shift / pay integration
- `src/modules/programs5b1.js` — canonical dynamic definition hook for 5B.4 job definitions
- `src/modules/programs5b2.js` — shift attendance delegation, 5B.4 UI/click integration
- `src/modules/lmpq73.js` — daily summer-employment lifecycle hook
- `tools/splice.py` — module/migration order and QA-call hooks

Generated / QA / docs:

- `game.js` — rebuilt from authoritative source
- `style.css` — rebuilt per `BUILD.md`; no style-source change
- `qa/t_5b4.py` — NEW focused 5B.4 suite
- `PHASE_5B_PROGRESS.md`
- `CHANGELOG.md`
- `MIGRATION_NOTES.md`
- `QC_REPORT.md`

## Tests

### 5B.4 focused

`qa/t_5b4.py`: **21/21 PASS**

Covered:

1. Age-15 Player cannot access standard summer employee jobs.
2. Age-16 Player sees four canonical job categories.
3. Jobs have real schedules and meaningful per-shift pay.
4. Eligible teen passes backend application gate.
5. Accepted application creates persistent employment state.
6. Application itself pays nothing.
7. Employment creates real required Calendar shifts.
8. Manager/coworker hooks have stable identities.
9. Completed shift pays and records attendance.
10. Completed shift builds only relevant work skill modestly.
11. Save/reload cannot duplicate wages.
12. Manager/coworker identity persists across reload.
13. Missed shift pays nothing.
14. Missed shift affects standing without instant dismissal.
15. Late shift is terminal completed attendance, not later no-show.
16. Late shift still pays once with an appropriate adjustment.
17. Real tutoring/program overlap blocks job application.
18. Job application can be rejected without money/shift side effects.
19. Employment ends cleanly when Summer ends.
20. Migration is idempotent and UI exposes canonical 16+ work rather than legacy child jobs.
21. Zero browser runtime errors.

### Fresh regression after 5B.4

- 5B.1: **17/17 PASS**
- 5B.2: **19/19 PASS**
- 5B.3: **20/20 PASS**
- 5B.4: **21/21 PASS**
- Phase 5A.5 acceptance: **24/24 PASS**
- Phase 5A.5 fuzz: **10/10 PASS / 200 randomized operations**
- Phase 4D.5 acceptance: **23/23 PASS**
- Phase 4D.5 fuzz: **21/21 PASS / 200 randomized operations**
- Phase 4C.5 acceptance: **28/28 PASS**
- Phase 4B.5 acceptance: **23/23 PASS**
- Phase 4A.5 acceptance: **32/32 PASS**
- Phase 3C.5 acceptance: **29/29 PASS**
- Phase 3B.5 acceptance: **5/5 PASS**
- H3 focused regression: **50/50 PASS**

No production regression was identified.

## Syntax / reproducible build

- `node --check game.js` — PASS
- `node --check src/modules/summerjobs5b4.js` — PASS
- `tools/theme.py` — PASS (`remaining literal hex outside tokens: []`)

Clean authoritative rebuild is byte-identical:

- `game.js`: `f763317b8c2fc573f789b3c5aaf7d21789cc4c92cd7abbd0cf3c9205cd065a20`
- `style.css`: `801ca0d091146469420d32800e274bd14f3f3b8968f7ac567609dbba7d61f16d`
- shipped `qa/harness.py`: `9b681b9e0f3f896c094a54b0d2258c192c34f370b12042cdaff8024bf68ce488`

## Known limitations / intentional deferrals

5B.4 does not perform the Phase 5B final audit/fuzz. The remaining Make Plans school-break wording/date-time selector audit, full fast-forward obligation audit, broad old-save migration matrix, cross-system final fuzz and formal 50-point acceptance verification belong to 5B.5.

The adult career system is intentionally unchanged. Full customer negotiation/business behavior remains Phase 5D scope.

## Exact resume point

**5B.5 — Migration / Regression / Fuzz / Final QA**

STOP here. Do not begin 5B.5 automatically.


---

# Checkpoint completed

**5B.5 — Migration / Regression / Fuzz / Final QA**

## Final integration audit

5B.5 did not add a new program, tutoring, employment, Calendar, money, skill, NPC or migration subsystem. It audited the cumulative 5B.1–5B.4 architecture against the final Phase 5B acceptance contract and changed production code only where a real cross-system integration bug was found.

### Fast-forward obligation fix

Final integration audit found one production defect in `src/modules/ff73.js`: required Calendar `program` obligations were not included in the Fast Forward hard-obligation set. As a result, an enrolled formal program, tutoring session or paid summer-job shift could be silently auto-resolved while skipping forward.

5B.5 adds Calendar `program` to `HARD_CAL`. Fast Forward now pauses before these required obligations and offers the existing Play / Simulate / Cancel handling instead of silently skipping them. This reuses the existing Fast Forward and Calendar architecture; no 5B-specific fast-forward engine was created.

### Make Plans during school breaks

The final audit confirmed that the active Make Plans flow already uses real selectable day/time/free-block controls and does not hard-code `tomorrow after school` during Summer/Winter break. No production change was required for this acceptance point. A dead legacy constant may still contain historical wording, but it is not the active planning path.

## Final migration validation

The complete Phase 5B migration chain reaches a semantic fixed point:

- `migratePrograms5B1()` — canonical offerings/enrollment/calendar foundation
- `migratePrograms5B2()` — instructor/attendance/progression/participant foundation
- `migratePrograms5B3()` — subject-specific summer academics/tutoring
- `migratePrograms5B4()` — canonical age-16+ summer employment/shifts/pay

Repeated migration does not:

- duplicate live enrollments or canonical program IDs
- duplicate Calendar session/shift IDs
- duplicate instructors or participants
- reset attendance or consecutive-absence state
- fabricate program attendance, skill progress, tutoring history or social relationships
- fabricate summer-job applications/employment/work history
- duplicate `paidShiftIds` or repay completed shifts
- reroll already-resolved eligibility/permission/tryout/employment outcomes
- fabricate contacts, romance, certificates or job history

Legacy useful activity/skill/employment state is preserved conservatively. Load/migration alone does not perform end-of-summer lifecycle transitions that belong to the real daily tick.

## 5B.5 acceptance QA

`qa/t_5b5_accept.py`: **26/26 PASS**

Representative coverage includes:

1. Summer break stops ordinary mandatory school workload.
2. Casual and formal activities remain distinct.
3. Formal enrollment has real cost/schedule/instructor/Calendar state.
4. Nine consecutive qualifying absences do not remove the Player.
5. The tenth qualifying consecutive absence removes the Player.
6. Formal-program runtime remains error-free.
7. Three concurrent formal summer academic subjects are allowed.
8. A fourth concurrent formal summer academic subject is blocked.
9. Phase 5A workbook self-study does not consume a formal summer-academic slot.
10. 1:1 and group tutoring remain materially distinct.
11. Tutoring consumes real time and gives bounded relevant academic support.
12. Tutoring/program peer identity and meeting provenance are stable.
13. A tutoring peer is not automatically a Phone contact.
14. Tutoring runtime remains error-free.
15. An eligible 16-year-old sees four canonical standard summer jobs.
16. A completed shift pays exactly once and affects existing needs.
17. Save/reload cannot duplicate summer-job wages.
18. A 15-year-old is blocked from standard summer employee jobs.
19. Fast Forward pauses before a required program/tutoring/job obligation.
20. Summer-job/Fast-Forward integration has no runtime error.
21. Make Plans during break does not use an after-school default.
22. Make Plans exposes real day/time availability selection.
23. Migration preserves useful legacy state without fabricating history.
24. Full Phase 5B migration reaches a fixed point.
25. Save/reload preserves program/job semantic state.
26. Migration/planning integration has zero browser runtime errors.

## 5B.5 fuzz

`qa/t_5b5_fuzz.py`: **17/17 PASS — 200 randomized operations**

Profiles:

- elementary child
- middle-school student
- Summer-academic teen
- working age-16 teen

Fuzz invariants include:

- unique Calendar IDs
- no duplicate live `programId` enrollment
- non-negative consecutive-absence counters
- unique `paidShiftIds`
- a missed summer-job shift cannot be paid
- no summer-academic load above the canonical three-subject cap
- full 5B migration remains idempotent after randomized operations
- save/reload preserves semantic program/job state
- no browser runtime errors

A larger combined browser batch can exceed the sandbox process-duration limit. Final fuzz therefore runs in bounded representative profiles; the standalone suite completes normally and reports all assertions rather than treating environment timeout as a gameplay failure.

## Full Phase 5B focused / acceptance totals

- 5B.1: **17/17 PASS**
- 5B.2: **19/19 PASS**
- 5B.3: **20/20 PASS**
- 5B.4: **21/21 PASS**
- 5B.5 acceptance: **26/26 PASS**

**Phase 5B focused/acceptance total: 103/103 PASS**

5B.5 dedicated fuzz: **17/17 PASS / 200 randomized operations**.

## Fresh prerequisite regression

Modern focused/acceptance regression:

- Phase 5A: **117/117 PASS**
- Phase 4D: **110/110 PASS**
- Phase 4C: **111/111 PASS**
- Phase 4B: **136/136 PASS**
- Phase 4A: **114/114 PASS**
- Phase 3C: **118/118 PASS**
- Phase 3B: **81/81 PASS**
- H3: **50/50 PASS**
- HOTFIX-P1 portable legacy regression: **74/74 PASS**
- Phase 3A final validation: **13/13 PASS**

Including Phase 5B, the explicitly rerun focused/acceptance matrix is **1027/1027 PASS**.

Prerequisite fuzz rerun:

- Phase 5A: **10/10 PASS / 200 randomized operations**
- Phase 4D: **21/21 PASS / 200 randomized operations**
- Phase 4C: **21/21 PASS / 800 randomized operations**
- Phase 4B: **17/17 PASS / 720 randomized operations**
- Phase 4A: **17/17 PASS / 600 randomized operations**
- Phase 3C: **13/13 PASS / 600 randomized operations**
- Phase 3B: **13/13 PASS / 600 randomized operations**

Together with 5B.5 fuzz: **129/129 fuzz checks PASS across 3,920 randomized operations**.

## Legacy/domain regression notes

Old QA files are retained unchanged even where their harness hard-codes a retired Chromium path. For verification only, temporary local harness copies/temporary harness substitutions were used with `/usr/bin/chromium` and inline CSS/runtime injection, then the shipped `qa/harness.py` was restored byte-for-byte.

Verified domain behavior includes Inventory ownership/stacking/condition/migration, Needs/balance, adult Work/pay/attendance/promotion/firing, Calendar/Holiday calculations, HOTFIX-P1 and Phase 3A. Remaining legacy exceptions are not Phase 5B regressions:

- one old Inventory test expects obsolete Phone condition wording even though canonical Phone condition/battery state assertions pass
- one old holiday test expects the holiday hero to always win over another contextual hero
- one old 390px School overflow assertion reflects an older responsive-layout expectation
- `t_day.py` uses raw browser reload, which a QA-only `set_content` portability harness cannot preserve; modern Phase 5B/5A/4D/4C save-reload tests cover persistence directly

No production behavior was weakened merely to satisfy these stale/environment-specific assertions.

## Phase 5B acceptance criteria

**50/50 VERIFIED**

1. School break differs from school term.
2. Mandatory school workload does not continue through Summer.
3. Casual practice and formal programs are distinct.
4. Casual practice remains flexible/slower.
5. Formal programs use real schedules.
6. Formal programs can carry real cost.
7. Parent permission uses H3 authority.
8. Older siblings are not promoted to legal authority.
9. Declined program decisions cannot be spam-rerolled.
10. Formal enrollment persists.
11. Schedule overlaps are rejected by the backend.
12. Programs use canonical Calendar/time.
13. Formal programs have stable instructors where appropriate.
14. 1:1/group/team formats differ.
15. Attendance matters.
16. Skipped sessions grant no normal progression.
17. Consecutive absences are tracked.
18. Ten qualifying consecutive absences cause removal.
19. Valid attendance resets the absence streak.
20. Cancelled sessions are not Player absences.
21. Formal training can outpace casual practice.
22. Only relevant skills progress.
23. Talent can influence but does not replace skill.
24. Tryout may succeed or fail.
25. Paying/enrolling does not guarantee competitive selection.
26. Program participants can become stable People NPCs.
27. Meeting provenance remains program-specific.
28. Not every session creates a new friend.
29. Summer academics remain optional.
30. Formal Summer academics are capped at about three concurrent subjects.
31. Phase 5A workbook self-study remains separate.
32. Summer tutoring supports distinct 1:1 and group formats.
33. Tutoring uses real time/schedule.
34. New tutoring peers are not automatically contacts.
35. Romance remains Phase 3B-compatible.
36. Standard summer employment requires age 16+.
37. Four meaningful canonical summer jobs exist.
38. Jobs have real shifts.
39. Pay is earned per completed shift.
40. Missed shifts do not pay.
41. Save/reload does not duplicate wages.
42. Program/tutoring/job schedules conflict realistically.
43. Summer employment ends/adjusts when school returns.
44. Existing Energy/Stress/Mood systems respond to busy schedules.
45. Make Plans during break does not assume `after school`.
46. Fast Forward respects required program/tutoring/job obligations.
47. Migration preserves useful existing activity/skill data.
48. Migration does not fabricate enrollment/job history.
49. Migration is idempotent.
50. Generated outputs rebuild reproducibly from authoritative source.

## Files changed in 5B.5

Production source:

- `src/modules/ff73.js` — required Calendar `program` obligations now hard-interrupt Fast Forward

QA / docs:

- `qa/t_5b5_accept.py` — NEW final acceptance suite
- `qa/t_5b5_fuzz.py` — NEW dedicated randomized lifecycle/invariant suite
- `PHASE_5B_PROGRESS.md`
- `CHANGELOG.md`
- `MIGRATION_NOTES.md`
- `QC_REPORT.md`
- `README.md`
- generated `game.js` rebuilt from authoritative source

`style.css` has no source-level 5B.5 change and is rebuilt only for reproducibility verification.

## Reproducible build

Final clean authoritative rebuild is byte-identical:

- `game.js`: `36319638670eaf3cb5f13e5b2cbf2fccf90d91e80a9445992495cedcec7f563a`
- `style.css`: `801ca0d091146469420d32800e274bd14f3f3b8968f7ac567609dbba7d61f16d`
- shipped `qa/harness.py`: `9b681b9e0f3f896c094a54b0d2258c192c34f370b12042cdaff8024bf68ce488`

`node --check game.js` and `tools/theme.py` both pass.

## Known limitations / intentional deferrals

Phase 5B deliberately does not implement Phase 5C seasonal-leisure/store functionality, Phase 5D microbusiness overhaul, Phase 6 Prom/Occasion Engine, Phase 7 Transportation or Phase 8 University academics.

The existing broad legacy QA collection contains several environment/stale-expectation cases documented above; current canonical systems are covered by portable modern focused/acceptance/save-reload/fuzz suites instead of weakening production rules to match obsolete assumptions.

## Exact next resume point

**Phase 5C — Seasonal Activities / Functional Store**

**PHASE 5B COMPLETE**

Ready for final audit before Phase 5C.

STOP here. Do not begin Phase 5C automatically.
