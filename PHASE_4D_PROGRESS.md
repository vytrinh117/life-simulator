# PHASE 4D — COMPETITIONS / SCHOOL EVENTS

## Status

**PHASE 4D IN PROGRESS — 4D.3 COMPLETE**

Prerequisites verified before implementation:

- H3 COMPLETE
- HOTFIX-P1 COMPLETE
- Phase 3A COMPLETE
- Phase 3B COMPLETE
- Phase 3C COMPLETE
- Phase 4A COMPLETE
- Phase 4B COMPLETE
- Phase 4C COMPLETE
- CURRENT source inspected
- `BUILD.md` inspected; `src/` remains authoritative and root `game.js` / `style.css` remain generated outputs

## Phase 4D Checkpoint Tracker

- [x] 4D.1 — Canonical Event / Competition Lifecycle
- [x] 4D.2 — Discovery / Registration / Join / Decline / Withdrawal
- [x] 4D.3 — Preparation / Participation / Results / Consequences
- [ ] 4D.4 — School Calendar / Seasonal / Automatic Events / Notification Cleanup
- [ ] 4D.5 — Migration / Regression / Fuzz / Final QA

**Do not begin 4D.4 automatically.**

---

# Checkpoint completed

**4D.1 — Canonical Event / Competition Lifecycle**

## Implementation

Phase 4D.1 extends the game's existing `S.school.contests` + Calendar `schoolEvent` architecture instead of creating a second disconnected event store.

Canonical event foundation:

- legacy/current school competition objects remain in `S.school.contests`
- every canonicalized record receives a stable `eventId` independent from the legacy runtime `id`
- stable annual event identity is based on event template/name + academic school year + owning `schoolId`
- existing `id`, `status`, `prep`, `result`, pending-decision references and Calendar `contestId` payloads are retained for backwards compatibility
- canonical Calendar payloads additionally store stable `schoolEventId`
- `contestById()` now accepts either compatibility `id` or canonical `eventId`

School ownership and scope:

- school-specific events carry Phase 4A `schoolId`
- `schoolEventsForSchool4D1()` can resolve events for one school without relying on display name
- same-named annual event at a different school receives a different stable event instance
- event scope defaults to `school` while leaving hooks for future inter-school/regional/national scope

Canonical event metadata:

- `eventType`
- category (`academic_competition`, `sports_event`, `arts_performance`, `club_event`, `leadership_activity`, `school_ceremony`, or school-social fallback)
- host/scope metadata
- registration open/deadline timestamps
- event datetime, duration and location
- participant ID container
- canonical `playerStatus`
- preparation state synchronized with legacy `prep`
- result/resolution placeholders without fabricating outcomes
- annual/season metadata with academic school-year key
- Calendar reference

Explicit lifecycle foundation:

- announced
- registration_open
- registration_pending
- registered
- preparing
- participating
- completed
- declined
- registration_missed
- withdrawn
- missed
- eliminated
- disqualified
- cancelled
- archived

`canTransitionSchoolEvent4D1()` and `transitionSchoolEvent4D1()` provide a low-level legal transition model for later 4D checkpoints. 4D.1 does not expose new registration/withdrawal UI or automatically advance those future gameplay flows.

Compatibility synchronization:

- existing Find Event-created records are canonicalized immediately
- current registration/contest Calendar creation adds stable event linkage
- current completion/no-show/withdrawal paths refresh canonical metadata
- existing H3 preparation/result systems continue using the same contest objects
- `reconcileState()` now reconciles canonical event metadata after Calendar reconciliation

Duplicate integrity:

- repeated migration deduplicates events by stable canonical `eventId`
- same annual event / same school / same school year resolves to one canonical instance
- duplicate resolution is deterministic
- the more meaningful/advanced state is retained without rerolling a winner/result
- preparation progress is preserved conservatively
- pending decision and Calendar compatibility references are remapped to the surviving record

Explicitly NOT implemented in 4D.1:

- automatic event announcements
- registration UI/window behavior overhaul
- Join / Decline / Withdraw / Out gameplay
- eligibility overhaul
- Phase 4B membership/role entry requirements
- event-specific preparation actions
- new result/opponent calculation
- notification cleanup/countdowns
- annual scheduling/recreation engine
- stale Missed-notice expiry

Those remain checkpoints 4D.2–4D.4.

## Files changed

Authoritative source / build tooling:

- `src/modules/schoolevents4d1.js` — NEW canonical School Event / Competition lifecycle foundation
- `src/modules/core72.js` — canonical event lookup, Calendar cross-reference and reconciliation integration
- `tools/splice.py` — includes 4D.1 source module/migration and QA hooks; canonicalizes current legacy event actions without changing their gameplay meaning

Generated output:

- `game.js` — rebuilt from authoritative source
- `style.css` — rebuilt per `BUILD.md`; no 4D.1 style-source changes

QA / progress:

- `qa/t_4d1.py` — NEW focused 4D.1 suite
- `PHASE_4D_PROGRESS.md` — NEW Phase 4D tracker/report
- `CHANGELOG.md` — checkpoint summary

## Migration

`migrateSchoolEvents4D1()` is conservative and idempotent.

It does NOT fabricate historical competition results, registration decisions or lifecycle transitions.

Migration behavior:

- enriches existing `S.school.contests` in place
- keeps legacy runtime IDs and current status meaning
- adds deterministic stable event identity
- adds school ownership/category/type/repeat metadata
- links existing Calendar `schoolEvent` records with canonical `schoolEventId`
- preserves existing prep/results
- initializes lifecycle history as empty when old saves have no actual transition history
- deduplicates same annual event instance deterministically
- does not randomly register Player
- does not reactivate resolved contests
- repeated migration does not duplicate event records or change stable IDs

## Tests

### 4D.1 focused

`qa/t_4d1.py`: **21/21 PASS**

Covered:

- legacy contest canonicalization
- stable event IDs
- Phase 4A school ownership
- explicit event type/category
- lifecycle mapping without fake result
- annual/season metadata
- canonical registration/event timestamps
- Calendar stable event linkage
- legacy `contestId` compatibility
- valid lifecycle transitions
- invalid lifecycle jump/backtracking rejection
- real transition history only
- same-year duplicate annual collapse
- deterministic merge preserving stronger state/preparation
- lookup by stable and compatibility ID
- same-named event at another school remains separate
- save/reload persistence
- migration idempotence
- unique canonical event IDs
- no fabricated result/history
- no browser runtime errors

### Fresh regression after 4D.1

- Phase 4C focused/final acceptance: **111/111 PASS**
  - 4C.1: 20/20
  - 4C.2: 21/21
  - 4C.3: 20/20
  - 4C.4: 22/22
  - 4C.5 acceptance: 28/28
- Phase 4B final acceptance: **23/23 PASS**
- Phase 4A final acceptance clean rerun: **32/32 PASS**
- Phase 3C final acceptance: **29/29 PASS**
- Phase 3B final acceptance: **5/5 PASS**
- H3 focused regression: **50/50 PASS**

Fresh focused/acceptance checks explicitly rerun including 4D.1: **271/271 PASS**.

One Phase 4A acceptance invocation initially produced 30/32 because stochastic NPC/profile setup did not meet two profile/provenance fixture assumptions. A clean rerun with no source change passed **32/32**. No 4D production regression was identified.

### Syntax / reproducible build

- `node --check game.js` — PASS
- `node --check src/modules/schoolevents4d1.js` — PASS
- `node --check src/modules/core72.js` — PASS
- `tools/theme.py` — PASS (`remaining literal hex outside tokens: []`)

Authoritative rebuild is byte-identical:

- `game.js`: `33301c3ffa81ed9bf3007c0ecb9f45f4e46b54e36d26ecd6b2d434a50b088cd4`
- `style.css`: `801ca0d091146469420d32800e274bd14f3f3b8968f7ac567609dbba7d61f16d`
- shipped `qa/harness.py`: `9b681b9e0f3f896c094a54b0d2258c192c34f370b12042cdaff8024bf68ce488`

## Known limitations / deferred scope

Intentional checkpoint boundaries:

- existing Find Event / registration UI still uses legacy visible statuses; 4D.2 will turn discovery, registration, explicit Decline, missed registration and withdrawal into full canonical lifecycle actions
- event preparation remains the existing H3-integrated contest flow; event-specific preparation belongs to 4D.3
- result calculation/opponent field remains the existing contest implementation until 4D.3
- annual generation frequency, automatic announcements, countdowns and stale-notification cleanup remain 4D.4
- full Phase 4D migration/regression/fuzz closeout remains 4D.5
- Phase 5A and later systems have not started

## 4D.1 resume point (historical)

4D.2 — Discovery / Registration / Decline / Withdrawal (now completed)


---

# Checkpoint completed

**4D.2 — Discovery / Registration / Join / Decline / Withdrawal**

## Implementation

Phase 4D.2 extends the canonical `S.school.contests` event records created/refined in 4D.1. It does not create a second event store and does not replace the H3 preparation/result system reserved for 4D.3.

Discovery / announcements:

- canonical events now carry persistent discovery metadata (`discovered`, source, discovery timestamp, one-shot announcement state)
- eligible annual school events have an automatic school-announcement hook when registration is open
- `Find Event` reuses an existing undiscovered/known active opportunity before creating an optional minor opportunity
- repeated Find Event cannot reroll/duplicate the same active opportunity
- optional Find Event-created events are canonicalized immediately and use stable 4D.1 IDs
- school-scoped events from another `schoolId` are not exposed as Player-school opportunities

Registration window / lifecycle:

- registration availability derives from canonical `registrationOpenAt`, `registrationDeadline` and event datetime
- registration before open, after deadline or after the event is rejected by backend logic
- eligible Player registration uses the canonical `registration_open -> registered` transition
- registration creates the real existing Calendar `schoolEvent` obligation; no duplicate participation system is introduced
- under-13 registration uses the existing caregiver `contestApproval` pending-decision flow
- repeated under-13 registration attempts reuse the existing pending request instead of duplicating decisions
- caregiver approval/denial resolves through canonical 4D.2 registration/decline behavior

Explicit decline / missed registration:

- `Not Join / Decline` is a real `declined` lifecycle state
- explicit decline resolves registration nags and is never later converted into event `Missed`
- ignoring the deadline resolves as `registration_missed` / `Registration Closed`, which remains distinct from failing to attend a registered event
- late registration is blocked

Eligibility:

- school ownership (`schoolId`) is enforced
- optional grade, age, academic, attendance and behavior requirements are supported
- club/team membership requirements use Phase 4B canonical organizations and `memberIds`
- optional role requirements use active Phase 4B role state
- a Player cannot enter a team competition without actual team membership when the event requires it

Withdrawal / Out foundation:

- registered/preparing Player may withdraw before event day through canonical `withdrawn` state
- withdrawal cancels the active Calendar participation obligation
- late withdrawal retains the existing lightweight teacher-reaction consequence
- `Out` foundation is explicit through `eliminated` / `disqualified` lifecycle states and is distinct from `declined`

UI / action integration:

- School event cards use canonical lifecycle state and contextual actions
- Available: Register / Not participating
- Pending: caregiver-approval state
- Registered/Preparing: existing H3 Prepare + event-day action + Withdraw
- terminal states display status/result without dead registration buttons
- another-school school-scoped events are filtered from the Player-school event card list
- legacy `contestAction`, `withdrawContest`, `eventsClick` and `exploreSchoolEvent` entry points delegate into 4D.2 canonical behavior, preserving compatibility with the existing UI/test architecture

Explicitly NOT implemented in 4D.2:

- event-specific preparation types/quality overhaul
- event-day result/opponent calculation overhaul
- win/loss field simulation
- achievement consequence overhaul
- full notification retention/archive lifecycle
- annual/new-school-year recurrence engine overhaul

Those remain 4D.3–4D.4.

## Files changed

Authoritative source / build tooling:

- `src/modules/schooleventdiscovery4d2.js` — NEW discovery, registration, eligibility, decline, withdrawal and Out foundation
- `src/modules/schoolevents4d1.js` — compatibility hardening so explicit canonical `participating` state is not lost when legacy status remains `Registered`
- `src/modules/events73.js` — legacy Find/registration/withdrawal daily flows delegate/reconcile with canonical 4D.2 behavior
- `src/modules/core72.js` — 4D.2 reconciliation hook
- `src/modules/ui72.js` — canonical 4D.2 event-card rendering
- `tools/splice.py` — 4D.2 source module, migration and QA API wiring

Generated output:

- `game.js` — rebuilt from authoritative source
- `style.css` — rebuilt per `BUILD.md`; no 4D.2 style-source changes

QA / progress:

- `qa/t_4d2.py` — NEW focused 4D.2 suite
- `PHASE_4D_PROGRESS.md` — checkpoint tracker/report
- `CHANGELOG.md` — checkpoint summary

## Migration

`migrateSchoolEventDiscovery4D2()` is conservative and idempotent.

It enriches existing canonical 4D.1 event records in place with discovery/registration/eligibility metadata and then reconciles registration windows.

It does NOT:

- fabricate competition results
- randomly register the Player
- convert explicit Decline into Missed
- duplicate pending caregiver decisions
- duplicate Calendar event obligations
- duplicate annual event instances
- reset preparation/result state

Old explicit Open/Waiting/Registered/Declined/Registration Closed/Withdrawn states preserve their meaning through the canonical lifecycle mapping.

A 4D.1 compatibility edge case found by 4D.2 QA was fixed: `participating` is now preserved when legacy status is still the ambiguous compatibility value `Registered`, instead of being normalized backwards to `preparing`.

## Tests

### 4D.2 focused

`qa/t_4d2.py`: **22/22 PASS**

Covered:

- automatic eligible school-event announcement
- canonical registration-open state
- Find Event dedupe/reuse
- same-school eligibility
- successful registration
- real Calendar participation obligation
- explicit Decline
- Decline remains distinct from Missed after deadline
- ignored deadline -> registration_missed
- late-registration rejection
- grade eligibility
- team membership rejection for non-member
- Phase 4B membership unlock
- withdrawal
- Calendar cancellation on withdrawal
- Out/Eliminated distinct from Declined
- another-school eligibility rejection
- another-school event filtered from Player-school UI
- minor caregiver-pending registration
- no duplicate caregiver request
- migration/reconcile idempotence
- no browser runtime errors

### 4D.1 regression

`qa/t_4d1.py`: **21/21 PASS** after the canonical-state compatibility hardening.

### Fresh prerequisite regression after 4D.2

- Phase 4C.1–4C.4 focused: **83/83 PASS**
- Phase 4C.5 final acceptance: **28/28 PASS**
- Phase 4B.5 final acceptance: **23/23 PASS**
- Phase 4A.5 final acceptance: **32/32 PASS**
- Phase 3C.5 final acceptance: **29/29 PASS**
- Phase 3B.5 final acceptance: **5/5 PASS**
- H3 focused regression: **50/50 PASS**

No production regression was identified in these reruns.

## Known limitations / deferred scope

Intentional checkpoint boundaries:

- preparation still uses the existing H3-integrated generic contest preparation flow; 4D.3 adds event-specific preparation/location/result behavior
- participation/result/opponent field remains the existing contest implementation until 4D.3
- comprehensive countdowns, annual/new-year recurrence and stale notification archive/expiry remain 4D.4
- full Phase 4D migration/regression/fuzz closeout remains 4D.5
- Phase 5A and later systems have not started

## Exact resume point

**4D.3 — Preparation / Participation / Results / Consequences**

STOP. 4D.3 has NOT started.

---

# Checkpoint completed

**4D.3 — Preparation / Participation / Results / Consequences**

## Implementation

Phase 4D.3 extends the same canonical `S.school.contests` records from 4D.1–4D.2 and keeps H3 contest-preparation integrity intact.

Preparation:

- event-specific preparation options now vary by category:
  - academic competitions: review material, practice questions, teacher coaching, mock test
  - sports: drills, team training, strategy review
  - arts/performance: rehearsal, project refinement, advisor feedback
- preparation is backend-gated by Phase 4C location/time context
- teacher/advisor preparation requires a realistic in-person school help window
- Home/school-study preparation is allowed only in legitimate contexts
- H3 remains authoritative for daily preparation integrity:
  - session 1: +10 preparation
  - session 2: +6
  - session 3: +3
  - session 4+: no further preparation progression that day
  - every allowed session consumes 75 minutes, Energy -7, Stress +2
- 4D.3 records preparation type/quality/history without changing H3's canonical progression contract
- first useful preparation moves canonical lifecycle from `registered` to `preparing`

Participation / location:

- event-day participation now requires the correct physical venue/context
- a School event cannot be attended from Home merely because the event button exists
- event time/check-in window is enforced
- registered Player can genuinely no-show and becomes canonical `missed`
- explicitly declined Player remains `declined` and is not converted to Missed
- weekend/holiday school events can use one narrow special-event campus-access exception during the actual Calendar event window; this does not reopen campus for ordinary school actions

Opponent field / result calculation:

- competition events now have a persistent lightweight opponent field
- same-school stable NPCs are used where available, supplemented by lightweight stable competitor records rather than generating hundreds of NPCs
- opponent field strength is deterministic/persistent for a given event instance
- result scoring uses multiple factors appropriate to category, including:
  - preparation
  - relevant skill
  - Smart where appropriate
  - academic standing where relevant
  - Health
  - Energy
  - Stress
  - teacher/coach support
  - prior event experience
  - Luck / bounded deterministic event variance
  - lateness penalty
- no single stat is a guaranteed win button
- stronger preparation improves the Player score but does not guarantee victory
- result placement is calculated against the actual persistent field
- result records persist structured score/rank/field/factor data

Results / consequences:

- supported result labels include Winner / 1st, Runner-up / 2nd, finalist/placement and participant result
- top results provide modest context-appropriate reputation/happiness/teacher effects
- major top-two achievements enter school event history and milestones once
- ordinary participation does not create a permanent milestone
- outcome history is deduplicated by stable `eventId`
- existing development/talent evidence hook `devContestResult()` remains integrated

Integration hardening discovered during QA:

1. 4D.3 initially made preparation gain/time/energy quality-variable. H3.3 regression correctly rejected this. The implementation was corrected so H3's exact 10/6/3, 75-minute, Energy -7, Stress +2 contract remains unchanged; preparation quality is recorded/used for result context instead of replacing H3 progression.
2. A weekend event venue bug was found: Player could be physically at the School event venue, but `advanceTime()` invoked 4C location reconciliation and teleported them Home because it was a weekend. A narrow `schoolEventCampusAccess4D3()` hook now preserves School location only during a legitimate registered/preparing/participating Calendar event window.

Explicitly NOT implemented in 4D.3:

- countdown/registration countdown overhaul
- stale notification retention/cleanup
- annual/new-school-year event recreation engine
- full automatic seasonal scheduling cleanup
- Phase 4D final migration/fuzz closeout

Those remain 4D.4–4D.5.

## Files changed

Authoritative source / build tooling:

- `src/modules/schooleventparticipation4d3.js` — NEW 4D.3 preparation/participation/result layer
- `src/modules/core72.js` — routes contest attendance/result/no-show through 4D.3 and reconciles 4D.3 state
- `src/modules/events73.js` — generic legacy Prepare action delegates to canonical 4D.3 preparation while retaining H3 integrity
- `src/modules/schooleventdiscovery4d2.js` — active event card delegates to 4D.3 contextual preparation UI/click handling
- `src/modules/schoolday4c1.js` — narrow special-event campus-access exception only during a valid school-event Calendar window
- `tools/splice.py` — includes 4D.3 module/migration/test hooks

Generated output:

- `game.js` — rebuilt from authoritative source
- `style.css` — rebuilt per `BUILD.md`; no 4D.3 style-source changes

QA / progress:

- `qa/t_4d3.py` — NEW focused 4D.3 suite
- `PHASE_4D_PROGRESS.md` — checkpoint update
- `CHANGELOG.md` — checkpoint summary

## Migration

`migrateSchoolEventParticipation4D3()` is conservative and idempotent.

It:

- enriches canonical 4D.1/4D.2 events in place
- preserves existing `prep`, `prepDaily`, lifecycle, result and Calendar identity
- initializes structured preparation/result containers without fabricating outcomes
- never creates a winner/result for unresolved legacy events
- does not generate event history merely because an old contest exists
- preserves existing stable event IDs and registration state
- repeated migration does not duplicate result history or milestones

## Tests

### 4D.3 focused

`qa/t_4d3.py`: **23/23 PASS**

Covered:

- event-specific academic preparation actions
- first three preparation sessions progress
- diminishing returns
- H3 daily cap on 4th+ session
- real time cost
- lifecycle `registered -> preparing`
- wrong-location preparation rejection
- stronger preparation improves result score input
- stable opponent/field strength
- Player can win
- structured multi-factor result persistence
- major achievement history/milestone
- Player can lose
- one high stat does not guarantee victory
- event-day wrong-location rejection
- correct time/place participation
- genuine registered-event Missed state
- Declined remains distinct from Missed
- save/reload result persistence
- migration/history idempotence
- contextual preparation UI controls
- no browser runtime errors

### 4D.1 / 4D.2 regression

- 4D.1: **21/21 PASS**
- 4D.2: **22/22 PASS**

### Fresh prerequisite regression after 4D.3

- Phase 4C focused/final acceptance: **111/111 PASS**
  - 4C.1: 20/20
  - 4C.2: 21/21
  - 4C.3: 20/20
  - 4C.4: 22/22
  - 4C.5 acceptance: 28/28
- Phase 4B.5 final acceptance: **23/23 PASS**
- Phase 4A.5 final acceptance: **32/32 PASS**
- Phase 3C.5 final acceptance: **29/29 PASS**
- Phase 3B.5 final acceptance: **5/5 PASS**
- H3 focused regression: **50/50 PASS**

Fresh focused/acceptance checks explicitly rerun including 4D.1–4D.3: **316/316 PASS**.

### Syntax / reproducible build

- `node --check game.js` — PASS
- `node --check src/modules/schooleventparticipation4d3.js` — PASS
- `node --check src/modules/schoolday4c1.js` — PASS
- `tools/theme.py` — PASS (`remaining literal hex outside tokens: []`)

Authoritative rebuild is byte-identical:

- `game.js`: `35f56265d2c047fd9df9b97950d52757eb902baa47570c99a487afe8fb9554d8`
- `style.css`: `801ca0d091146469420d32800e274bd14f3f3b8968f7ac567609dbba7d61f16d`
- shipped `qa/harness.py`: `9b681b9e0f3f896c094a54b0d2258c192c34f370b12042cdaff8024bf68ce488`

## Known limitations / deferred scope

Intentional checkpoint boundaries:

- event count-down and registration-deadline countdown lifecycle remains 4D.4
- stale Missed/Completed/Declined notification cleanup and archive retention remains 4D.4
- automatic annual/new-school-year recreation remains 4D.4
- full Phase 4D migration/regression/fuzz closeout remains 4D.5
- Phase 5A and later systems have not started

## Exact resume point

**4D.4 — School Calendar / Seasonal / Automatic Events / Notification Cleanup**

STOP. 4D.4 has NOT started.

