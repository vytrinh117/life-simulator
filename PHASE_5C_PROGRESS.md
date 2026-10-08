# PHASE 5C — SEASONAL ACTIVITIES / FUNCTIONAL STORE

## Status

**PHASE 5C IN PROGRESS — 5C.2 COMPLETE**

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
- Phase 5B COMPLETE
- CURRENT source inspected
- `BUILD.md` inspected; `src/` remains authoritative and root `game.js` / `style.css` remain generated outputs

## Phase 5C Checkpoint Tracker

- [x] 5C.1 — Seasonal Activity Foundation
- [x] 5C.2 — Summer / Winter Activities
- [ ] 5C.3 — Autumn / Outdoor / Social Group Activities
- [ ] 5C.4 — Functional Store / Gear / Consumables / Equipment
- [ ] 5C.5 — Migration / Regression / Fuzz / Final QA

Do not begin 5C.3 automatically.

---

# Checkpoint completed

**5C.1 — Seasonal Activity Foundation**

## Architecture audit / implementation

Phase 5C.1 extends existing systems rather than creating parallel ones.

Existing architecture retained:

- `season()` / canonical game date and regional `seasonNow()` logic remain the season/time source.
- existing `S.weather` remains the weather hook.
- existing `S.location` remains physical-context state.
- existing `S.plans` remains the social-plan record store.
- Calendar `type:'plan'` remains the schedule/obligation source for accepted seasonal outings.
- existing `npcStatusAt()` remains NPC availability authority.
- existing H3 Central Decision Ledger remains parent/guardian decision authority.
- existing Phase 3B romance compatibility/state remains the romantic-participant authority.
- existing family-trip state (`S.trip` / `onTrip()`) is reused for narrowly-scoped travel-season/location overrides.

New canonical foundation lives in `src/modules/seasonal5c1.js`.

## Canonical seasonal activity definitions

The foundation provides stable activity IDs and reusable metadata for the later 5C activity checkpoints:

- `beach_day`
- `casual_swim`
- `sunbathe`
- `scuba_outing`
- `ski_day`
- `build_snowman`
- `camping_weekend`
- `autumn_hike`

Each definition records:

- stable `activityId`
- allowed season(s)
- age floor
- legitimate locations
- duration
- cost
- supported social participation modes
- minor permission metadata
- narrow travel-context tags
- intended implementation checkpoint for detailed activity outcomes

The definitions are foundation records only; 5C.2 and 5C.3 still own the activity-specific equipment, safety, weather, skill and narrative behavior.

## Season / travel context

`seasonForDate5C1(dateISO)` derives season from the real game date and preserves the existing southern-hemisphere handling for Australia.

`seasonalSeasonGate5C1()` blocks out-of-season activities by default.

A mismatched local season can only be overridden by a legitimate current trip carrying compatible seasonal context. Existing trip destinations provide only conservative obvious tags (for example coast/beach trips may expose `warm_coast`). The foundation does not globally allow skiing in summer simply because the Player is traveling.

## Location context

`seasonalLocationGate5C1()` validates activity context against the canonical definition.

Examples at foundation level:

- Beach outing → Beach / legitimate warm-coast Trip context
- Ski day → Ski Resort / explicit snow-destination travel context
- Scuba outing → Beach / Dive Center / legitimate provider/travel context
- Camping → Campground

Immediate activity execution from an incompatible location such as Home is backend-blocked.

## Time and schedule integration

Every canonical activity has a real duration.

`seasonalScheduleConflict5C1()` checks the existing Calendar and rejects true interval overlap with committed obligations including:

- school day / exams
- clubs / tryouts
- school events
- existing plans
- work days
- Phase 5B programs/tutoring/jobs
- wedding/prom/trip/election/leadership/conference obligations

Accepted seasonal plans remain `S.plans` records and create ordinary Calendar `plan` events instead of a new seasonal calendar.

`attendPlan()` now delegates records marked `seasonal5C1` to `attendSeasonalPlan5C1()`; ordinary plans retain the prior path unchanged.

## Social participation / RSVP

The foundation supports participation modes:

- Alone
- Family (definition hook)
- Friend
- Group (definition hook)
- Partner

Friend/partner records use real stable People IDs.

`seasonalRsvp5C1()` uses:

- NPC schedule/availability
- relationship closeness
- trust/fun/conflict
- personality
- cost context
- a stable deterministic tie-break

The RSVP is persisted in `S.seasonal5C1.rsvps` using person + activity + date + start time. Repeating the same request reuses the prior answer, so a decline cannot be spam-rerolled.

`createSeasonalNpcInvitation5C1()` creates a real pending `S.plans` record plus lifecycle event rather than a one-off text-only invitation. Accept/decline handling is routed through the existing event lifecycle.

## Phase 3B romance foundation

Partner-mode participation delegates eligibility to Phase 3B state/compatibility.

A seasonal outing does not create romance merely because a friend attends. The plan only records `romanticContext:true` when the selected participant is already a valid established romantic partner/context under Phase 3B.

5C.1 does not add kiss/date progression or new romance stages; detailed contextual moments remain 5C.2/5C.3 and existing Phase 3B rules remain authoritative.

## Parent / guardian permission

Minor seasonal permission uses H3 `requestDecision()` and `decisionAuthorityPerson()`.

The decision context records:

- activity ID
- date/time
- location
- cost
- participant mode/person
- risk / overnight context

Permission scoring may consider existing household strictness, trust/responsibility, wealth/cost and risk context, but the chosen result is stored in the H3 Decision Ledger. Repeating the unchanged request reuses the same record.

Ordinary older siblings/caregivers do not become legal decision authority.

## Migration

`migrateSeasonalActivities5C1()` is conservative and idempotent.

It:

- initializes only the 5C.1 state container
- normalizes/deduplicates explicit seasonal RSVP records
- normalizes/deduplicates explicit seasonal activity history if already present
- enriches only plans already carrying a valid `seasonalActivityId`
- preserves existing Plans/Calendar/Inventory/relationships
- does not infer old generic outings into seasonal history
- does not fabricate romantic memories
- does not auto-buy gear
- does not fabricate permission outcomes
- does not create historical activities on migration

## Files changed

Authoritative source / build tooling:

- `src/modules/seasonal5c1.js` — NEW canonical 5C.1 foundation
- `src/modules/plans72.js` — routes seasonal plan attendance to the 5C.1 executor
- `src/modules/core72.js` — lifecycle hook for NPC seasonal invitation response
- `tools/splice.py` — adds 5C.1 module, migration order and QA-call exports

Generated / QA / docs:

- `game.js` — rebuilt from source
- `style.css` — rebuilt per `BUILD.md`; no style-source change
- `qa/t_5c1.py` — NEW focused 5C.1 suite
- `PHASE_5C_PROGRESS.md` — NEW Phase 5C tracker/report
- `CHANGELOG.md`
- `MIGRATION_NOTES.md`
- `QC_REPORT.md`
- `README.md`

## Tests

### 5C.1 focused

`qa/t_5c1.py`: **18/18 PASS**

Covered:

1. canonical definitions have stable IDs/context metadata
2. summer does not expose winter activity without valid travel context
3. invalid location blocks activity
4. correct season + location allows activity
5. activity consumes real game time
6. Calendar overlap is rejected
7. friend can accept
8. friend can decline
9. repeated decline reuses prior RSVP rather than rerolling
10. partner eligibility reuses Phase 3B
11. minor permission uses H3 legal parent/guardian authority
12. seasonal plan reuses existing Plans + Calendar
13. save/reload preserves plan
14. valid travel context can narrowly override local season
15. NPC invitation hook creates real pending plan/event
16. migration does not fabricate activity history
17. migration is idempotent
18. zero browser runtime errors

### Fresh regression after 5C.1

- Phase 5B.1–5B.4 focused: **77/77 PASS**
- Phase 5B.5 acceptance: **26/26 PASS** (one stochastic soft-event-first run was clean-rerun without source changes)
- Phase 5B.5 fuzz: **17/17 PASS / 200 randomized operations**
- Phase 5A.1–5A.4 focused: **93/93 PASS**
- Phase 5A.5 acceptance: **24/24 PASS**
- Phase 5A.5 fuzz: **10/10 PASS / 200 randomized operations**
- Phase 4D.5 acceptance: **23/23 PASS**
- Phase 4D.5 fuzz: **21/21 PASS / 200 randomized operations**
- Phase 4C.5 acceptance: **28/28 PASS**
- Phase 4C.5 fuzz: **21/21 PASS / 800 randomized operations**
- Phase 4B.5 acceptance: **23/23 PASS**
- Phase 4A.5 acceptance: **32/32 PASS**
- Phase 3C.5 acceptance: **29/29 PASS**
- Phase 3C.5 fuzz: **13/13 PASS / 600 randomized operations**
- Phase 3B.5 acceptance: **5/5 PASS**
- Phase 3B.5 fuzz: **13/13 PASS / 600 randomized operations**
- H3 focused regression: **50/50 PASS**

No production regression was identified.

## Syntax / reproducible build

- `node --check game.js` — PASS
- `node --check src/modules/seasonal5c1.js` — PASS
- `tools/theme.py` — PASS (`remaining literal hex outside tokens: []`)

Clean authoritative rebuild is byte-identical:

- `game.js`: `0221236f24426af8129f390a82a7ae65c7efa80cb4b2d506e05dd81ed546a981`
- `style.css`: `801ca0d091146469420d32800e274bd14f3f3b8968f7ac567609dbba7d61f16d`
- shipped `qa/harness.py`: `9b681b9e0f3f896c094a54b0d2258c192c34f370b12042cdaff8024bf68ce488`

## Known limitations / intentional deferrals

5C.1 is foundation only.

Not yet implemented here:

- detailed skiing/snowman/beach/swimming/tanning/scuba execution and outcomes
- sunscreen consumption / sunburn logic
- ski/scuba gear or rental gameplay
- camping supervision/group RSVP/weather outcomes
- functional seasonal Shop item expansion
- durable seasonal equipment condition/use rules
- activity-specific UI cards and detailed context flows

Those belong to 5C.2–5C.4.

## Exact resume point

**5C.2 — Summer / Winter Activities**

**5C.1 COMPLETE**

Ready to resume from 5C.2.

STOP here. Do not begin 5C.2 automatically.


---

# Checkpoint completed

**5C.2 — Summer / Winter Activities**

## Implementation

Phase 5C.2 extends the canonical 5C.1 `S.plans` / Calendar path rather than adding a parallel activity engine.

Implemented concrete activity behavior for:

- Ski day: winter + ski-location gate, equipment/rental access, several-hour duration, gradual sports progression and bounded minor-fall risk.
- Build a snowman: lightweight winter/family/social activity with modest Fun/Social effects.
- Beach outing: family/friend/partner participation through the existing participant/RSVP model.
- Casual swimming: separate from formal Phase 5B training and grants only modest swimming-skill progression.
- Sunbathing / sun exposure: contextual bounded sunburn risk rather than guaranteed damage.
- Sunscreen: a real multi-use Inventory consumable; each use reduces remaining quantity and materially reduces sun-risk calculation.
- Scuba: Teen+ age gate, coastal/dive-location gate, equipment/provider access, legitimate adult/instructor supervision for minors, and H3 parent/guardian permission through the existing Decision Ledger.
- Contextual partner moments: only when Phase 3B already recognizes an established romantic context; friend outings do not auto-create romance.

Rental access is temporary 5C.2 state and never becomes permanent Inventory ownership. Full seasonal Store/gear condition/rental UI remains 5C.4.

## Production issue fixed during QA

The first 5C.2 migration helper attempted to reassign the read-only `D.catalog` reference while registering sunscreen. The catalog itself is intentionally shared/fixed; canonical entries can be added directly. The helper now mutates only `D.catalog.sunscreen` and does not reassign `D.catalog`.

## Migration

`migrateSeasonalActivities5C2()` is conservative and idempotent. It initializes only explicit 5C.2 state, deduplicates temporary rental records, preserves existing 5C.1 plans/history, and does not fabricate prior activity, rental, sun exposure, skills, permissions, romance, or permanent equipment ownership.

## Files changed

Authoritative source / build tooling:

- `src/modules/seasonal5c2.js` — NEW concrete 5C.2 activity behavior
- `tools/splice.py` — 5C.2 module, migration order and QA-call exports

Generated / QA / docs:

- `game.js` — rebuilt from source
- `style.css` — rebuilt per `BUILD.md`; no style-source change
- `qa/t_5c2.py` — NEW focused 5C.2 suite
- `PHASE_5C_PROGRESS.md`
- `CHANGELOG.md`
- `MIGRATION_NOTES.md`
- `QC_REPORT.md`

## Tests

### 5C.2 focused

`qa/t_5c2.py`: **20/20 PASS**

Covered skiing context/gear/rental/time/skill, snowman family activity, beach friend/family participation, casual swimming, sunscreen quantity and protection, bounded sun exposure, scuba age/supervision/authority/location, Phase 3B partner context, friend-not-romance, migration fixed point and browser runtime safety.

### Regression

- 5C.1: **18/18 PASS**
- Phase 5B final acceptance/fuzz: **43/43 PASS**
- Phase 5A final acceptance: **24/24 PASS**
- Phase 4D final acceptance: **23/23 PASS**
- Phase 4C final acceptance: **28/28 PASS**
- Phase 3C final acceptance: **29/29 PASS**
- Phase 3B final acceptance: **5/5 PASS**
- H3: **50/50 PASS**

No production regression was found after the 5C.2 catalog-registration fix.

## Reproducible build

Clean rebuild is byte-identical.

- `game.js`: `d55647a7988cfa4d5d04730b1d888da5743f14dc6ca0e43a73198e29167be1ca`
- `style.css`: `801ca0d091146469420d32800e274bd14f3f3b8968f7ac567609dbba7d61f16d`
- `qa/harness.py`: `9b681b9e0f3f896c094a54b0d2258c192c34f370b12042cdaff8024bf68ce488`

## Known limitations / intentionally deferred

5C.2 does not implement autumn camping/group RSVP/weather memories (5C.3) or the full functional seasonal Store, durable gear condition, broken-equipment validation, broader rental UI and parent purchase flow (5C.4).

## Exact resume point

**5C.3 — Autumn / Outdoor / Social Group Activities**

Do not begin 5C.3 automatically.
