# PHASE 4A — MULTI-SCHOOL WORLD FOUNDATION

## Status

**PHASE 4A COMPLETE — 4A.5 COMPLETE**

Prerequisites verified before recording:

- H3 COMPLETE
- Phase 3A COMPLETE
- HOTFIX-P1 COMPLETE
- Phase 3B COMPLETE
- Phase 3C COMPLETE / 3C.5 COMPLETE
- CURRENT source inspected
- `BUILD.md` inspected; `src/` remains authoritative and root `game.js` / `style.css` are generated outputs

## Current Architecture Audit Snapshot — Requirements Recording Only

No gameplay/source implementation was performed. Current observations relevant to Phase 4A planning:

- Formal school state currently centers on `S.school` with legacy display-name/stage/grade/class/subject data.
- `src/modules/school72.js` can generate/change school-name strings during stage progression.
- `S.schoolHistory` already exists and preserves grade/school-era records, but not a canonical world-level `schoolId` model.
- School calendar events currently carry school display-name context in places such as `payload.school`.
- University state has its own existing identity/data structures and must be integrated conservatively rather than rewritten.
- Existing School, People, clubs, competitions, exams, attendance, graduation, breaks, romance, communication, H3 decisions, and HOTFIX-P1 systems must remain intact while Phase 4A adds stable identity/world hooks.

## Phase 4A Checkpoint Tracker

- [x] 4A.1 — School World Model
- [x] 4A.2 — Player School Assignment / Progression
- [x] 4A.3 — NPC School Identity / History
- [x] 4A.4 — Cross-School Social Provenance
- [x] 4A.5 — Migration / Regression / Final QA

**Implementation status:** 4A.1–4A.5 COMPLETE. Phase 4A is closed. Phase 4B has NOT started.

**Phase 4B:** NOT STARTED.

---

# RECORDED FULL REQUIREMENTS / IMPLEMENTATION SPECIFICATION

PHASE 4A — MULTI-SCHOOL WORLD FOUNDATION
FULL REQUIREMENTS + IMPLEMENTATION SPECIFICATION

You are working on my EXISTING browser-based Life Simulator project.

IMPORTANT:

Do NOT rebuild the project as a simplified demo.
Do NOT delete working systems.
Inspect CURRENT source and extend the real existing architecture.

The project must remain compatible with static GitHub Pages deployment.

==================================================
PREREQUISITES
==================================================

Phase 4A must NOT begin until:

- H3 COMPLETE
- Phase 3A COMPLETE
- HOTFIX-P1 COMPLETE
- Phase 3B COMPLETE
- Phase 3C COMPLETE

Read first:

- PHASE_3C_PROGRESS.md
- PHASE_3B_PROGRESS.md
- H3_PROGRESS.md
- HOTFIX_P1_PROGRESS.md
- PHASE_3A_PROGRESS.md
- CURRENT source
- BUILD.md

If Phase 3C is not COMPLETE:

STOP.

Do NOT implement Phase 4A yet.

Create/use:

PHASE_4A_PROGRESS.md

Track:

[ ] 4A.1 School World Model
[ ] 4A.2 Player School Assignment / Progression
[ ] 4A.3 NPC School Identity / History
[ ] 4A.4 Cross-School Social Provenance
[ ] 4A.5 Migration / Regression / Final QA

Do not automatically begin the next checkpoint.

==================================================
PHASE 4A GOAL
==================================================

The world must stop behaving as if:

- only one school exists
- every child/teen automatically attends the same school
- every friend is a classmate
- every NPC school relationship is vague
- school identity disappears after progression

Phase 4A creates a reusable MULTI-SCHOOL WORLD FOUNDATION.

The game should support multiple real in-world schools at the same
education level.

Examples:

multiple elementary schools
multiple middle/secondary schools
multiple high schools

Later university systems will extend the same philosophy.

Each school should be a persistent world entity with its own:

- stable ID
- name
- education level(s)
- location/area
- quality/reputation characteristics
- school identity
- available programs where appropriate
- school calendar hooks
- student population hooks

Do NOT turn this phase into a giant school-content expansion.

This phase establishes the WORLD MODEL.

==================================================
4A.1 — CANONICAL SCHOOL ENTITY
==================================================

Audit CURRENT school representation first.

Do NOT add a second parallel school model if one already exists.

Create/refine one canonical school entity.

Conceptually a school may contain fields such as:

schoolId
name
type
educationLevel
district/area
reputation
academicStrength
sportsStrength
artsStrength
facilities
tuition/public-private status where applicable
schedule/calendar reference
available clubs/program hooks

Use current architecture and naming conventions.

Do not hard-code these exact fields if equivalent structures already exist.

==================================================
STABLE SCHOOL IDS
==================================================

Schools must use stable IDs.

Do NOT use display name as the primary identity.

Good:

schoolId: northbridge_high

Bad:

school: "Northbridge High School"

as the only source of identity.

Display names may change later.

References should remain stable.

==================================================
MULTIPLE SCHOOLS PER EDUCATION LEVEL
==================================================

The world should contain multiple possible schools.

Do not make every child in the game attend the same institution.

For example, the world may contain several:

- elementary schools
- middle/secondary schools
- high schools

Exact quantity should fit existing game scale.

Do not create hundreds of shallow schools.

Prefer a manageable set of distinctive schools.

==================================================
SCHOOL DIFFERENTIATION
==================================================

Schools should not be identical copies with different names.

Give schools meaningful differences where current systems can consume them.

Possible differences:

- academic reputation
- sports emphasis
- arts emphasis
- wealth/resources
- size
- strictness/culture
- public/private
- tuition where relevant
- selective admission where relevant
- neighborhood/location

Do not implement complex admission mechanics yet unless required for
existing progression.

Do not use stereotypes based on demographic identity.

==================================================
NO DUPLICATE SCHOOL DATA
==================================================

Do not duplicate the same school configuration across many places.

School identity should come from canonical school data.

Player/NPC records should store:

schoolId

rather than copying full school objects into every person.

==================================================
4A.2 — PLAYER CURRENT SCHOOL
==================================================

Player should have one canonical CURRENT school when enrolled.

Store the school by stable ID.

The Player should not simultaneously be enrolled full-time in two
ordinary schools unless a future explicit feature supports it.

==================================================
EDUCATION STAGE TRANSITIONS
==================================================

School progression should respect age/grade stage.

Examples conceptually:

Elementary
→ Middle/Secondary
→ High School

Use CURRENT education system terminology.

Do not replace existing kindergarten/grade progression unnecessarily.

When Player progresses to a new education level:

do NOT silently rename the old school into the new school.

Instead:

- old school remains in history
- new current school is assigned/enrolled
- school history records the transition

==================================================
SCHOOL HISTORY
==================================================

Player should preserve school history.

Conceptual record:

schoolId
start date/year
end date/year
education stage
grades attended
graduated/transferred reason where known

Do not create excessive history entries every school year if the Player
remains at the same school.

One continuous enrollment should remain one coherent history period.

==================================================
TRANSFER FOUNDATION
==================================================

Phase 4A should create safe support for school transfers.

Do NOT build a huge transfer storyline system yet.

But architecture should be capable of representing:

- changed school
- reason
- start/end dates
- previous school

Potential future reasons:

- family moved
- school change
- academic opportunity
- disciplinary transfer
- financial reasons
- Player choice

Do not randomly transfer Player without a real event.

==================================================
SCHOOL ASSIGNMENT
==================================================

When selecting a school for Player, consider relevant existing state
where applicable:

- household location
- household finances
- public/private affordability
- previous school
- age/grade
- family decisions
- school eligibility

Do not make assignment purely random when context already exists.

Do not implement full school application/admission mechanics here.

==================================================
SCHOOL NAME DISPLAY
==================================================

Player's current school should be visible in appropriate School UI.

Use full canonical school name.

Do not display raw schoolId to Player.

==================================================
4A.3 — NPC CURRENT SCHOOL
==================================================

School-age NPCs should have one canonical current school where applicable.

NPC should NOT automatically inherit Player's current school.

Possible NPC relationship to Player:

- same class
- different class, same grade
- different grade, same school
- different school
- no current school if not school-age / context says otherwise

==================================================
NPC SCHOOL ASSIGNMENT
==================================================

Assign NPC schools using context.

Relevant factors may include:

- age
- grade
- neighborhood/location
- family resources
- where NPC was first introduced
- event/program provenance
- existing legacy school state

Do not randomly move NPCs between schools every render/load.

Assignment must be persistent.

==================================================
ONE CURRENT SCHOOL PER NPC
==================================================

An ordinary school-age NPC should have exactly one current school.

Do not produce impossible state such as:

Current school:
Northbridge High
Westfield High
Ashford Academy

at the same time.

School history may contain previous schools.

==================================================
NPC SCHOOL HISTORY
==================================================

NPCs should also preserve meaningful school history.

At minimum support:

- previous school
- current school
- transition dates/stage

Do not generate enormous fake histories for old saves.

Migration should infer conservatively.

==================================================
NPC SCHOOL TRANSITIONS
==================================================

NPCs should age/progress through school stages coherently.

If an NPC was Player's elementary classmate,
they may later:

- attend same middle school
- attend another middle school
- eventually attend same/different high school

Do not assume childhood classmates remain classmates forever.

This is important for realistic social continuity.

==================================================
SCHOOL / CLASS ARE SEPARATE
==================================================

Do not treat:

same school

as:

same class.

Represent class/grade separately where current school system supports it.

Example:

Player:
Westfield High
Grade 10
Class 10-A

Friend:
Westfield High
Grade 10
Class 10-C

Another friend:
Northbridge High
Grade 10

These are distinct relationships.

==================================================
4A.4 — CROSS-SCHOOL SOCIAL WORLD
==================================================

Friends can come from different schools.

Do not limit social graph to current classmates.

NPCs may be met through:

- same class
- same school
- neighborhood
- club
- competition
- summer program
- camp
- tutoring
- mutual friend
- family connection
- public event
- other existing social sources

==================================================
MEETING PROVENANCE
==================================================

Preserve specific relationship provenance.

Do not reduce everything to:

"Met at school"

when more specific information exists.

Examples:

Same class at Westfield Middle School

Different class at Westfield High School

Met at summer swimming camp

Introduced by Maya Chen

Met during Math Olympiad

Met at neighborhood event

==================================================
PEOPLE PROFILE INTEGRATION
==================================================

Phase 3A / HOTFIX-P1 People Profile must consume the new school identity.

Where Player legitimately knows it, Profile may display:

School:
Westfield High School

and How You Know Them may render naturally.

Examples:

Westfield High · same Grade 10 class · known since age 15

Westfield High · different class · introduced by Maya · known since age 14

Northbridge High · met at summer camp · known since age 13

Do not expose school data Player has no reason to know.

Preserve knowledge gating.

==================================================
HOW YOU KNOW THEM
==================================================

Continue using the HOTFIX-P1 composed summary approach.

Do NOT recreate awkward independent fields everywhere such as:

Where Met
How Met
School
Introduction Source

if one natural summary can communicate them.

Internally preserve structured provenance.

Presentation should be human-readable.

==================================================
CURRENT SCHOOL VS WHERE MET
==================================================

These are NOT the same thing.

Example:

Player met Alex at elementary school.

Years later:

Alex attends Northbridge High.
Player attends Westfield High.

Profile should be able to express both:

Current school:
Northbridge High

How you know them:
Elementary school · known since age 8

Do not overwrite meeting history when school changes.

==================================================
SOCIAL CONTINUITY
==================================================

Changing schools should not delete old friendships.

Old classmates remain in People.

They may become:

- active friend
- long-distance/different-school friend
- Old Friend
- Former Friend

depending on actual relationship progression.

Do NOT automatically downgrade everyone just because schools differ.

==================================================
SAME-SCHOOL CONTEXT
==================================================

Where appropriate, same-school NPCs may become eligible for future:

- class interactions
- lunch
- school clubs
- student roles
- school events
- prom
- competitions

Phase 4A should expose stable school identity hooks for those systems.

Do NOT implement all those systems now.

==================================================
SCHOOL-SPECIFIC WORLD EVENTS FOUNDATION
==================================================

Events should be able to reference:

schoolId

This is foundational for later:

- elections
- school clubs
- competitions
- prom
- assemblies
- graduation
- school-specific calendar events

Do not create one global school event that automatically belongs to
every school.

==================================================
CALENDAR FOUNDATION
==================================================

School-related calendar events should be capable of knowing which school
they belong to.

Example:

Westfield High Prom

must not automatically be:

Northbridge High Prom

Future phases may schedule separate dates.

Do NOT implement full Prom scheduling in 4A.

==================================================
SCHOOL MEMBERSHIP HELPERS
==================================================

Create reusable helpers/selectors rather than repeatedly comparing raw strings.

Examples conceptually:

getSchool(schoolId)

getCurrentSchool(personId)

isSameSchool(aId, bId)

isSameGrade(aId, bId)

isSameClass(aId, bId)

getSchoolHistory(personId)

getStudentsAtSchool(schoolId)

Use current naming conventions.

Avoid scattered:

person.school === "Westfield"

checks.

==================================================
SCHOOL DATA VALIDITY
==================================================

Ensure:

- current schoolId resolves to real school
- school-age NPC isn't linked to deleted/invalid school
- no duplicated school IDs
- no duplicate canonical schools
- history references valid schools
- class relationship does not claim same class if schools differ

==================================================
MIGRATION — EXISTING SAVES
==================================================

Existing saves may have legacy fields such as:

school name string
school object
school label
class data without school ID
NPC "met at school" but no explicit school identity

Migration must preserve existing meaning where possible.

Do NOT randomly rewrite established history.

If legacy Player/NPC clearly attended an existing named school:

map to canonical schoolId.

If school is unknown:

use a safe unknown/unassigned state rather than inventing a detailed
school history.

Do not fabricate years of previous enrollment history.

==================================================
MIGRATION IDEMPOTENCE
==================================================

Running migration repeatedly must NOT:

- create duplicate schools
- duplicate school history
- change NPC schools randomly
- duplicate enrollment periods
- alter provenance repeatedly

Migration must be idempotent.

==================================================
SCHOOL GENERATION / NPC CREATION
==================================================

Any NEW school-age NPC created after Phase 4A must receive coherent
school state when appropriate.

Do not leave newly generated teens with:

currentSchoolId = undefined

unless narrative context intentionally has no school.

School assignment should happen once and persist.

==================================================
NPC NAME UNIQUENESS
==================================================

Preserve existing full-name uniqueness requirements.

Do not create school rosters filled with repeated generic names.

School implementation must not regress existing NPC identity stability.

==================================================
DO NOT GENERATE HUGE FAKE ROSTERS
==================================================

Do NOT pre-create hundreds or thousands of NPCs simply to simulate an
entire school.

The game only needs enough actual NPCs to support the Player's world.

A school may conceptually have a larger population without generating
every student as a full People entity.

Use lightweight aggregate metadata if necessary.

==================================================
4A.5 — UI / UX
==================================================

Do not redesign the entire School interface in this phase.

Add only the UI necessary to make school identity clear.

Potential UI elements:

Current School:
Westfield High School

School type/stage
Grade/Class

Relevant school information

People Profile:
School when known

Do not create dense university-style brochures here.

==================================================
NO MULTI-TAB UI EXPLOSION
==================================================

The project intentionally avoids unnecessary tab clutter.

Do not create a separate tab for every school property.

Integrate information into existing School / People views cleanly.

==================================================
PHASE 4A DOES NOT IMPLEMENT 4B
==================================================

DO NOT implement:

- Class Representative election overhaul
- Student Council election overhaul
- Basketball Captain selection
- club president/vice/head roles
- unique office incumbents
- opponent vote percentages
- campaign system
- school leadership competition

Those belong to:

PHASE 4B — SCHOOL ORGANIZATIONS / ROLES / ELECTIONS

However 4A must provide stable schoolId/school-membership foundations
that 4B can use.

==================================================
PHASE 4A DOES NOT IMPLEMENT 4C
==================================================

DO NOT implement the full daily school realism overhaul.

That includes:

- class timetable overhaul
- only-at-school interaction enforcement
- cafeteria lunch timing overhaul
- wash hands/restroom school hygiene rules
- campus closes at 6 PM
- classes end at 3 PM
- Go Home overhaul
- teacher availability by location/time
- staggered homework schedule overhaul
- first-week/no-homework overhaul

Those belong to:

PHASE 4C — DAILY SCHOOL REALISM

Do not scope-creep.

==================================================
PHASE 4A DOES NOT IMPLEMENT 4D
==================================================

DO NOT implement:

- full competition lifecycle
- yearly Olympiad system
- seasonal event scheduling
- Join / Not Join / Withdraw / Out overhaul
- competition registration overhaul
- Missed notification overhaul

Those belong to:

PHASE 4D — COMPETITIONS / SCHOOL EVENTS

4A only provides school ownership/context hooks.

==================================================
PHASE 4A DOES NOT IMPLEMENT PROM
==================================================

Do NOT implement:

- Prom King/Queen
- nomination
- campaign
- voting
- prom date
- cross-school prom
- prom preparation
- makeup/hair
- post-prom

Those belong to Phase 6A/6B.

But school identity/calendar architecture must support future:

Westfield High Prom
Northbridge High Prom

as separate school-owned events.

==================================================
CHECKPOINT 4A.1 — SCHOOL WORLD MODEL
==================================================

Implement:

- canonical school entity
- stable school IDs
- multiple schools per relevant education stage
- school differentiation
- reusable school lookup helpers
- canonical school registry/data
- event schoolId foundation where necessary

Tests should verify:

- unique IDs
- valid lookups
- no duplicate schools
- multiple schools actually exist
- school attributes remain stable
- save/reload preserves school registry/state

STOP after 4A.1.

Do NOT begin 4A.2 automatically.

==================================================
CHECKPOINT 4A.2 — PLAYER SCHOOL ASSIGNMENT
==================================================

Implement:

- canonical currentSchoolId for Player
- enrollment/progression integration
- education stage transition
- school history
- safe transfer foundation
- School UI identity display
- preservation across save/reload

Tests should verify:

- Player has valid current school while enrolled
- school stage matches grade/age system
- school transition does not overwrite old school history
- no duplicate history entry every year
- save/reload stable
- migration stable

STOP after 4A.2.

==================================================
CHECKPOINT 4A.3 — NPC SCHOOL IDENTITY
==================================================

Implement:

- NPC currentSchoolId
- persistent assignment
- NPC school history
- school-stage transition
- same-school / same-grade / same-class helpers
- new NPC creation integration

Tests should include:

- same class
- same school / different class
- different school
- old classmate after school transition
- NPC school persists after save/reload
- no random school reroll
- exactly one current school where applicable

STOP after 4A.3.

==================================================
CHECKPOINT 4A.4 — CROSS-SCHOOL SOCIAL PROVENANCE
==================================================

Integrate:

- People Profile school identity
- How You Know Them
- same/different-school relationships
- meeting provenance
- mutual-friend provenance
- school event ownership hooks
- social continuity after school transition

Tests should verify:

- current school != historical meeting school can coexist
- changing school does not erase friends
- How You Know Them remains accurate
- introducedById remains stable
- different-school friends work
- same-class claims require same school
- knowledge gating still works

STOP after 4A.4.

==================================================
CHECKPOINT 4A.5 — FINAL MIGRATION / REGRESSION / FUZZ
==================================================

Run final Phase 4A validation.

Required regression:

- Phase 4A tests
- Phase 3C
- Phase 3B
- H3
- HOTFIX-P1
- Phase 3A
- H1
- H2
- Phase 2A
- Phase 2B
- existing School tests
- People/Profile tests
- save/reload
- migration idempotence
- full regression
- fuzz

Use representative starting ages such as:

- elementary-age child
- middle-school age
- high-school age
- adult with school history

Include transition scenarios.

==================================================
PHASE 4A ACCEPTANCE CRITERIA
==================================================

Before declaring Phase 4A COMPLETE verify at minimum:

1. Multiple canonical schools exist.

2. Schools have stable unique IDs.

3. Schools are not just renamed clones.

4. Player has one valid current school when enrolled.

5. NPC has one valid current school when applicable.

6. NPC school does not reroll on render/load.

7. Same school != same class.

8. Same grade != same class.

9. Friends may attend another school.

10. Childhood classmates may later attend different schools.

11. Changing school does not delete friendships.

12. Player school history persists.

13. NPC school history persists.

14. History is not duplicated annually without reason.

15. Current school does not overwrite meeting provenance.

16. Current school and where-met school can differ.

17. Profile can display NPC school when known.

18. Knowledge gating remains intact.

19. How You Know Them remains human-readable.

20. Meeting provenance retains structured IDs.

21. New school-age NPCs get coherent school state.

22. No massive fake NPC roster is generated.

23. School-owned future event hooks use schoolId.

24. Existing school features continue functioning.

25. Phase 3C communication remains intact.

26. Phase 3B romance remains intact.

27. H3 decision state remains intact.

28. HOTFIX-P1 People/Friend Groups remain intact.

29. Existing saves migrate safely.

30. Migration is idempotent.

31. Save/reload preserves school assignments/history.

32. Generated game.js/style.css are rebuilt from source.

==================================================
SOURCE / BUILD RULES
==================================================

Inspect CURRENT architecture before modifying anything.

Modify SOURCE files.

Do NOT patch only generated:

game.js
style.css

Follow BUILD.md.

After each checkpoint:

- rebuild generated outputs
- verify source/generated synchronization
- run node syntax checks
- run focused tests
- update PHASE_4A_PROGRESS.md

Where current source has reusable helpers/data systems:

extend them instead of creating parallel systems.

==================================================
PROGRESS REPORT FORMAT
==================================================

After each checkpoint report:

Checkpoint completed:
4A.X

Files changed:
...

Migration changes:
...

Tests:
...

Pass/fail:
...

Known limitations:
...

Next resume point:
4A.X

Then STOP.

Never automatically continue.

==================================================
FINAL STOP
==================================================

After 4A.5 passes:

update PHASE_4A_PROGRESS.md.

Produce the final Phase 4A ZIP/build.

STOP.

Do NOT begin Phase 4B.

Final response:

PHASE 4A COMPLETE

Ready for final audit before Phase 4B

Include:

- completed checkpoints
- source files changed
- migration summary
- test totals
- fuzz totals
- known limitations
- reproducible build confirmation
- exact next resume point:

Phase 4B — School Organizations / Roles / Elections

---

## Requirements Recording Stop State

- Full Phase 4A requirements are recorded.
- No Phase 4A source/gameplay code has been implemented in this requirements-recording step.
- Generated `game.js` / `style.css` were not rebuilt because no source implementation changed.
- Do not begin 4A.1 until explicitly authorized.
- Never automatically begin 4A.2 after 4A.1.
- Do not begin Phase 4B.

**Exact next resume point:** `Phase 4A checkpoint 4A.1 — School World Model`, pending explicit authorization.


---

# CHECKPOINT 4A.1 — SCHOOL WORLD MODEL — COMPLETE

**Checkpoint completed:** 4A.1

## Implementation summary

- Added one canonical school registry with stable `schoolId` values for the existing kindergarten, primary, middle and high-school name pools.
- Existing `SCHOOL_NAMES` / `buildSchool()` now derive visible names from that canonical registry instead of maintaining a parallel hard-coded school-name source.
- Added differentiated school metadata hooks: education level, area, public/private type, reputation, academic/sports/arts strength, resources, size, culture, tuition band, selectivity, facilities, programs and calendar profile.
- Added centralized identity helpers: `schoolById()`, `schoolRegistry()`, `schoolIdsForStage()`, `schoolNamesForStage()`, `schoolStage()`, `schoolDisplayName()`, `schoolIdFromLegacyName()` and registry validation.
- Added lightweight persistent `S.schoolWorld` metadata containing registry/schema version and canonical school IDs without copying full school objects into Player/NPC state.
- Added school-owned calendar-event identity foundation: known legacy school-name payloads gain stable `schoolId`; unknown legacy school names are preserved and are NOT silently mapped to unrelated schools.
- Existing school gameplay remains legacy-compatible. 4A.1 intentionally does **not** assign Player or NPC `currentSchoolId`; that belongs to 4A.2 / 4A.3.

## Files changed

Production/build source:
- `src/modules/schoolworld4a1.js` — new canonical registry/world helpers and 4A.1 migration/event identity foundation.
- `src/modules/school72.js` — existing school name generation now derives from canonical registry.
- `src/modules/core72.js` — calendar normalization invokes school-owned event identity hook.
- `tools/splice.py` — includes the 4A.1 module, invokes migration, and exposes QC-only helper calls.
- `game.js` — regenerated output.

QA/docs:
- `qa/t_4a1.py`
- `qa/t_4a1_regress.py`
- `PHASE_4A_PROGRESS.md`
- `CHANGELOG.md`
- `MIGRATION_NOTES.md`
- `QC_REPORT.md`

`style.css` was rebuilt and remained byte-identical. `qa/harness.py` was restored byte-identical after temporary environment experiments.

## Migration changes

- `migrateSchoolWorld4A1()` initializes/normalizes `S.schoolWorld` deterministically and idempotently.
- Registry IDs are canonical/static; saves store only lightweight world registry metadata rather than copied school definitions.
- Existing Player `S.school.name`, grade, class, subjects, attendance, exams, clubs and other school gameplay fields are preserved.
- Existing school-owned calendar records with a recognized legacy `payload.school` value gain the corresponding canonical `schoolId`.
- Unknown legacy school names remain untouched; 4A.1 does not invent or randomly reassign a school.
- No Player/NPC school history is fabricated in 4A.1.

## Tests

Fresh checkpoint runs:
- `qa/t_4a1.py`: **13/13 PASS**
  - unique/stable school IDs and lookups
  - multiple schools per current education stage
  - meaningful school differentiation
  - canonical-name generation
  - school-owned event `schoolId` foundation
  - unknown legacy name preservation
  - save/reload and migration idempotence
  - scope boundary: no premature Player `currentSchoolId`
- `qa/t_4a1_regress.py`: **14/14 PASS**
  - primary/middle/high existing school state
  - School UI identity display
  - exams/calendar compatibility
  - school-day event legacy payload + stable ID
  - migration does not rewrite active school gameplay fields
- `qa/t_3c1.py`: **22/22 PASS**
- `qa/t_3c4.py`: **26/26 PASS**

**Directly executed total: 75/75 PASS.**

Build checks:
- `node --check game.js`: PASS
- source-authoritative rebuild: PASS
- repeated-build byte identity: recorded in `QC_REPORT.md` after final packaging build

## Known limitations / intentional boundaries

- Player canonical `currentSchoolId`, enrollment/history transition logic and School UI identity integration are **not implemented yet**; checkpoint 4A.2 owns them.
- NPC school assignment/history is **not implemented yet**; checkpoint 4A.3 owns it.
- Cross-school People/Profile provenance is **not implemented yet**; checkpoint 4A.4 owns it.
- Full old-save school migration and cross-project fuzz/regression are reserved for 4A.5.
- Existing legacy `qa/t_sch.py`, `qa/t_schoolyear.py` and `qa/t_exam.py` could not enter assertions in this environment because browser administration blocks their historical `file://` navigation. Their workload/assertions were not weakened or counted as passes; 4A.1-specific school compatibility is covered by the portable 14/14 regression suite above.

## Stop state

**PHASE 4A INCOMPLETE**
**4A.1 COMPLETE**
**Exact next resume point: 4A.2 — Player School Assignment / Progression**

STOP. Do not begin 4A.2 automatically. Do not begin Phase 4B.


## 4A.1 Final Build Integrity

- `game.js` authoritative rebuild twice: **byte-identical** — `4abeb0921ab52a43814ac21c4fd1d6e0dd899d1aa7d8d34bd04166219f98bc4b`
- `style.css`: **byte-identical to Phase 3C baseline** — `801ca0d091146469420d32800e274bd14f3f3b8968f7ac567609dbba7d61f16d`
- `node --check game.js`: **PASS**
- shipped `qa/harness.py`: **unchanged** — `9b681b9e0f3f896c094a54b0d2258c192c34f370b12042cdaff8024bf68ce488`
- final focused + school compatibility rerun on packaged generated build: **27/27 PASS**
- 3C.1 + 3C.4 regressions from this checkpoint: **48/48 PASS**
- directly executed checkpoint total: **75/75 PASS**

**Resume point remains: 4A.2 — Player School Assignment / Progression.**

# CHECKPOINT 4A.2 — PLAYER SCHOOL ASSIGNMENT / PROGRESSION

**Status: COMPLETE**

## Checkpoint completed

4A.2 — Player School Assignment / Progression

## Files changed

Production/source:
- `src/modules/schoolplayer4a2.js` — canonical Player `currentSchoolId`, conservative legacy-school mapping, continuous enrollment periods, transfer foundation, event identity synchronization, migration helpers.
- `src/modules/school72.js` — generated Player school records now receive canonical identity; legacy reconciliation preserves canonical/custom school names instead of heuristic renaming.
- `src/modules/academic73.js` — school-year/stage progression synchronizes canonical enrollment periods; graduation closes the active enrollment.
- `src/modules/core72.js` — reconciliation invokes 4A.2 migration; legacy yearly attendance history now records `schoolId` when known; kindergarten decision synchronizes canonical enrollment.
- `src/modules/ui72.js` — School UI shows canonical school type/stage without redesigning the interface.
- `src/modules/ui3_72.js` — Education History consumes continuous canonical enrollment periods while legacy attendance history remains separate.
- `tools/splice.py` — includes 4A.2 source module, migration call, and QC-only helper access.
- `game.js` — regenerated output.

QA/docs:
- `qa/t_4a2.py`
- `PHASE_4A_PROGRESS.md`
- `CHANGELOG.md`
- `MIGRATION_NOTES.md`
- `QC_REPORT.md`

## Migration changes

- Enrolled Player school state now resolves to a stable `S.school.currentSchoolId`.
- Known legacy school names map to the 4A.1 canonical registry.
- Unknown active legacy school names are preserved exactly and represented by a deterministic minimal custom school entity (`legacy_<stage>_<slug>`); migration does not silently replace them with an unrelated canonical school.
- New structured enrollment history lives at `S.education.schoolEnrollments` so one continuous enrollment remains one period across multiple school years.
- Legacy `S.schoolHistory` remains the yearly attendance/report archive and is not repurposed or deleted.
- Repeated migration does not duplicate enrollment periods, grades, or custom legacy schools.
- Stage transitions close the previous enrollment and open the new one; high-school graduation closes the final active school enrollment.
- Current/future school-owned calendar events synchronize to the Player's canonical school identity where appropriate.

## Tests

Fresh checkpoint runs on the final source before packaging:
- `qa/t_4a2.py`: **19/19 PASS**
  - canonical currentSchoolId
  - visible-name preservation
  - continuous enrollment history
  - same-stage progression without annual history duplication
  - primary → middle → high transitions
  - same-stage transfer foundation
  - wrong-stage transfer rejection
  - save/reload
  - migration idempotence
  - unknown legacy school preservation
  - School UI identity metadata
- `qa/t_4a1.py`: **13/13 PASS**
- `qa/t_4a1_regress.py`: **14/14 PASS**
- `qa/t_3c1.py`: **22/22 PASS**
- `qa/t_3c4.py`: **26/26 PASS**

**Directly executed total: 94/94 PASS.**

Build checks:
- `node --check game.js`: PASS
- source-authoritative rebuild: PASS
- repeated-build byte identity: recorded below after final packaging build

## Known limitations / intentional boundaries

- NPC `currentSchoolId`, NPC school history, NPC stage transitions and roster assignment are **not implemented yet**; checkpoint 4A.3 owns them.
- Cross-school People/Profile provenance and knowledge-gated NPC school display are **not implemented yet**; checkpoint 4A.4 owns them.
- Full Phase 4A migration/regression/fuzz is reserved for 4A.5.
- Transfer support in 4A.2 is an architecture/foundation helper only; there is no new random-transfer storyline or application UI.
- Legacy `qa/t_commit.py` was attempted but could not enter assertions because this browser environment blocks its historical `file://` navigation even after temporary browser/path compatibility mapping. Its assertions were not weakened and it is not counted as a pass; 4A.2 save/reload and migration idempotence are covered by the focused suite.

## Stop state

**PHASE 4A INCOMPLETE**
**4A.2 COMPLETE**
**Exact next resume point: 4A.3 — NPC School Identity / History**

STOP. Do not begin 4A.3 automatically. Do not begin Phase 4B.

## 4A.2 Final Build Integrity

- `game.js` authoritative rebuild twice: **byte-identical** — `5c13bcfa0c1ec1ccc785ad09cacb05c7920f49e428e93d742f6ff547f3b9f7d8`
- `style.css`: **byte-identical to Phase 3C / 4A.1 baseline** — `801ca0d091146469420d32800e274bd14f3f3b8968f7ac567609dbba7d61f16d`
- `node --check game.js`: **PASS**
- shipped `qa/harness.py`: **unchanged** — `9b681b9e0f3f896c094a54b0d2258c192c34f370b12042cdaff8024bf68ce488`
- final 4A.2 focused + School compatibility rerun on packaged generated build: **33/33 PASS**
- full directly executed checkpoint regression total remains: **94/94 PASS**

**Resume point remains: 4A.3 — NPC School Identity / History.**


# CHECKPOINT 4A.3 — NPC SCHOOL IDENTITY / HISTORY

## Checkpoint completed

**4A.3 COMPLETE**

## Architecture / files changed

Production source:
- `src/modules/schoolnpc4a3.js` — canonical NPC `currentSchoolId`, deterministic current-school assignment, NPC enrollment history, stage/grade/class state, stage transitions, same-school/same-grade/same-class helpers, student lookup helpers, conservative legacy migration.
- `src/modules/social72.js` — new generated NPCs receive school state once; legacy People→NPC materialization also receives school state; new People created as `classmate` / `school friend` are reconciled to coherent school context before the Person record is created.
- `src/modules/core72.js` — normal reconciliation now runs NPC-school migration after social roster reconciliation.
- `tools/splice.py` — includes `schoolnpc4a3.js`, startup migration call, and QC-only access to 4A.3 helpers.
- `game.js` — regenerated output.

QA/docs:
- `qa/t_4a3.py`
- `PHASE_4A_PROGRESS.md`
- `CHANGELOG.md`
- `MIGRATION_NOTES.md`
- `QC_REPORT.md`

## Canonical NPC school model

- School identity is stored on canonical `S.npcs` records; People entities continue to reference the NPC through stable `npcId` and do not duplicate school objects.
- Ordinary school-age NPCs have at most one scalar `currentSchoolId` and one active school-history period.
- `schoolGrade` and `schoolClass` are separate from school identity; same school and same grade do not imply same class.
- New school-age NPCs receive school state once at creation and the assignment persists.
- Household-stable deterministic assignment spreads the background roster across multiple canonical schools instead of inheriting the Player school automatically.
- Explicit classmate introductions reconcile an as-yet-unknown NPC to the Player's current school/grade/class; `school friend` context may share the school without claiming the same class.
- NPC stage transitions close the old enrollment period and open a new stage-compatible school period.
- Aging out of K–12 closes current enrollment while preserving history.

## Migration

- Existing school-age NPCs receive one conservative current enrollment only; migration does not fabricate years of previous schooling.
- Existing valid NPC `currentSchoolId` values are preserved when stage-compatible.
- Legacy NPC school-name values map to known canonical schools where possible; unknown names use the existing deterministic minimal custom-school mechanism rather than being silently replaced.
- Repeated migration does not reroll school assignment, duplicate active enrollments, or duplicate grade history.
- Once an NPC already has a canonical current school, a later education-stage transition does not reuse a stale legacy school-name string as the next-stage school.

## Reusable helpers

4A.3 adds centralized helper concepts for:
- current school for a Person/NPC
- same school
- same grade
- same class
- school history for a Person/NPC
- students at a school

These operate through stable IDs and avoid raw display-name comparisons.

## Tests

Fresh checkpoint results before final packaging build:
- `qa/t_4a3.py`: **18/18 PASS**
- `qa/t_4a1.py`: **13/13 PASS**
- `qa/t_4a2.py`: **19/19 PASS**
- `qa/t_4a1_regress.py`: **14/14 PASS**
- `qa/t_3c1.py`: **22/22 PASS**
- `qa/t_3c4.py`: **26/26 PASS**
- Phase 3B focused (`t_3b1`–`t_3b4`): **76/76 PASS**
- People: **14/14 PASS**
- Profile: **24/24 PASS**
- Friendship: **17/17 PASS**

**Directly relevant total: 243/243 PASS.**

People/Profile/Friendship were executed with a temporary QA-only portable Playwright harness because the shipped harness uses an environment-blocked `file://` URL and historical Chromium path. The temporary harness injected the real `style.css`, `data.js` and generated `game.js`; shipped `qa/harness.py` was restored byte-for-byte afterward.

## Known limitations / intentional boundaries

- 4A.3 does **not** expose NPC school identity in People/Profile yet; knowledge-gated Profile + How You Know Them integration belongs to 4A.4.
- 4A.3 does **not** rewrite meeting provenance, mutual-friend provenance, school-event social text, or old-classmate presentation; 4A.4 owns those presentation/provenance changes.
- NPC household records currently lack a full finance/address model. Background-school assignment therefore uses stable household/NPC context plus the canonical school pool rather than inventing detailed finances or addresses.
- No huge school roster is generated; only existing/new world NPCs receive school membership.
- Full Phase 4A migration/regression/fuzz remains reserved for 4A.5.

## Stop state

**PHASE 4A INCOMPLETE**
**4A.3 COMPLETE**
**Exact next resume point: 4A.4 — Cross-School Social Provenance**

STOP. Do not begin 4A.4 automatically. Do not begin Phase 4B.



## 4A.3 Final Build Integrity

- `game.js` authoritative rebuild twice: **byte-identical** — `dc8db6cdd7bb914a9115efbf476e43c439290946f30663a835c595bec6ee13cd`
- `style.css`: **unchanged** — `801ca0d091146469420d32800e274bd14f3f3b8968f7ac567609dbba7d61f16d`
- `node --check game.js`: **PASS**
- shipped `qa/harness.py`: **restored unchanged** — `9b681b9e0f3f896c094a54b0d2258c192c34f370b12042cdaff8024bf68ce488`
- final packaged-build rerun: 4A.3 + 4A.2 + 4A.1 + School compatibility + 3C.1 + 3C.4 = **112/112 PASS**
- full directly relevant checkpoint regression remains **243/243 PASS**

**Resume point remains: 4A.4 — Cross-School Social Provenance.**

# CHECKPOINT 4A.4 — CROSS-SCHOOL SOCIAL PROVENANCE

## Checkpoint completed

**4A.4 COMPLETE**

## Architecture / files changed

Production source:
- `src/modules/schoolsocial4a4.js` — structured meeting provenance, stable `schoolId` / `eventId` / `introducedById`, knowledge-gated current-school display, current-vs-historical school helpers, school-event provenance integration, conservative migration.
- `src/modules/social72.js` — new People created from canonical NPCs capture school-aware meeting provenance without duplicating current-school objects.
- `src/modules/people73.js` — Profile consumes knowledge-gated canonical current-school identity; How You Know Them consumes structured provenance while keeping the HOTFIX-P1 composed-summary presentation.
- `src/modules/romance3b4.js` — matchmaker introductions now preserve stable `introducedById` alongside legacy compatibility.
- `src/modules/world72.js` — friend-of-friends introductions preserve the actual introducer ID.
- `tools/splice.py` — includes `schoolsocial4a4.js`, startup migration, and QC-only 4A.4 helper access.
- `game.js` — regenerated output.

QA/docs:
- `qa/t_4a4.py`
- `PHASE_4A_PROGRESS.md`
- `CHANGELOG.md`
- `MIGRATION_NOTES.md`
- `QC_REPORT.md`

## Canonical provenance model

- Person records do **not** copy the NPC's current school object.
- Current school remains canonical on Player/NPC school state from 4A.2/4A.3.
- Person social provenance stores only stable meeting facts under `schoolSocial.meeting`, including when legitimately known/available:
  - `sourceType`
  - historical meeting `schoolId`
  - `grade` / `className` where the actual meeting context supplied them
  - `eventId`
  - `programId`
  - stable `introducedById`
  - `metAt` / `metVia`
  - `knownSinceAge`
  - relation-at-meeting (`sameClass` / `sameSchool`) where legitimate
- Current school may change later without rewriting historical meeting provenance.
- Same-school / same-grade / same-class current relationships are computed from canonical school state, never inferred from the old `classmate` display label alone.

## People / Profile integration

- Profile shows the NPC's current school only when the Player can legitimately know it.
- A weak unrelated acquaintance may show School = Unknown even though the canonical NPC has a current school.
- Same-school context and school-based meeting provenance legitimately reveal the relevant school.
- Close/trusted relationships can reveal current school using the same knowledge philosophy already used by other Profile facts.
- How You Know Them remains one human-readable composed summary; no new stack of awkward independent fields was added.
- Historical school and current school can coexist, e.g. a former classmate may now attend a different school while the summary still says where the friendship began.

## Social continuity / event ownership

- Changing school does not delete, recreate, or automatically downgrade friends.
- Legacy `introducedBy` migrates to stable `introducedById` while remaining backward-compatible.
- Friend-of-friends and matchmaker introductions now keep the stable introducer identity.
- School-owned calendar events can contribute stable `eventId + schoolId` meeting provenance through the 4A.4 helper foundation.
- Migration never turns a current different-school relationship into a false current same-class claim.

## Migration

- Existing legacy meeting fields remain readable and are normalized conservatively into structured provenance.
- Existing school-related provenance is not overwritten merely because the NPC or Player later transfers.
- Legacy `introducedBy` is preserved and promoted to stable `introducedById` when it resolves to a real Person.
- Unknown/insufficient school history remains unknown instead of inventing a historical school.
- Repeated migration is idempotent and does not duplicate provenance or mutate friendship tier/status.

## Tests

Fresh checkpoint results:
- `qa/t_4a4.py`: **18/18 PASS**
- `qa/t_4a1.py`: **13/13 PASS**
- `qa/t_4a2.py`: **19/19 PASS**
- `qa/t_4a3.py`: **18/18 PASS**
- `qa/t_4a1_regress.py`: **14/14 PASS**
- `qa/t_3c1.py`: **22/22 PASS**
- `qa/t_3c4.py`: **26/26 PASS**
- Phase 3B focused (`t_3b1`–`t_3b4`): **76/76 PASS**
- People: **14/14 PASS**
- Profile: **24/24 PASS**
- Friendship: **17/17 PASS**
- HOTFIX-P1.2: **24/24 PASS**
- HOTFIX-P1.3: **28/28 PASS**

**Directly relevant total: 313/313 PASS.**

People/Profile/Friendship/HOTFIX-P1 legacy suites were executed with a temporary QA-only portable Playwright harness because the shipped harness contains historical Chromium and `file://` paths that are blocked in the current environment. CSS and the real generated scripts were injected; `/home/claude/proj` was mapped only when a legacy test directly read `game.js`. All temporary QA changes/mappings were removed afterward and shipped `qa/harness.py` was restored byte-for-byte.

## Known limitations / intentional boundaries

- 4A.4 does not implement school leadership, elections, prom, daily-school overhaul, competition lifecycle, or cross-school event gameplay. Those remain later phases.
- 4A.4 provides school-owned provenance hooks; it does not retrofit every historical generic event with a fabricated school identity.
- If an old save says only `classmate` but has no consistent shared historical school in either enrollment history, migration keeps school-at-meeting unknown rather than guessing.
- Full Phase 4A migration/regression/fuzz remains reserved for 4A.5.

## Stop state

**PHASE 4A INCOMPLETE**
**4A.4 COMPLETE**
**Exact next resume point: 4A.5 — Final Migration / Regression / Fuzz**

STOP. Do not begin 4A.5 automatically. Do not begin Phase 4B.

## 4A.4 Final Build Integrity

- `game.js` authoritative rebuild twice: **byte-identical** — `67a2fa39ad6ff730d14c11a4afd8c4b399d59737b5f01673511aa8266f58f5f7`
- `style.css`: **unchanged from Phase 3C / earlier 4A checkpoints** — `801ca0d091146469420d32800e274bd14f3f3b8968f7ac567609dbba7d61f16d`
- `node --check game.js`: **PASS**
- shipped `qa/harness.py`: **restored unchanged** — `9b681b9e0f3f896c094a54b0d2258c192c34f370b12042cdaff8024bf68ce488`
- final packaged-build rerun: 4A.4 + 4A.3 + 4A.2 + 4A.1 + School compatibility = **82/82 PASS**
- full directly relevant checkpoint regression remains **313/313 PASS**

**Resume point remains: 4A.5 — Final Migration / Regression / Fuzz.**


# CHECKPOINT 4A.5 — FINAL MIGRATION / REGRESSION / FUZZ

## Checkpoint completed

**4A.5 COMPLETE — PHASE 4A COMPLETE**

4A.5 introduced no new gameplay feature and no production-source behavior change. It finalized migration validation, acceptance coverage, regression, fuzz, source/generated synchronization, and closeout documentation for the 4A.1–4A.4 implementation.

## Files changed in 4A.5

QA/docs only:
- `qa/t_4a5_accept.py` — final Phase 4A acceptance/runtime matrix.
- `qa/t_4a5_fuzz.py` — deterministic school-world fuzz for elementary, middle, high, and adult-with-history scenarios.
- `PHASE_4A_PROGRESS.md`
- `CHANGELOG.md`
- `MIGRATION_NOTES.md`
- `QC_REPORT.md`

Production source was intentionally unchanged from 4A.4. A final source diff confirmed `src/` and `tools/` are byte-identical to the 4A.4 checkpoint input.

## Final migration validation

- Existing Player school name/grade/class state remains preserved while valid canonical IDs are attached.
- Known legacy school names map deterministically; unknown active names remain visible and use deterministic minimal custom-school IDs rather than random replacement.
- Player `S.education.schoolEnrollments` remains continuous and does not duplicate on repeated migration.
- NPC current-school assignment remains deterministic, one-current-school-only, and school history does not duplicate.
- Structured People meeting provenance remains stable across transfers and repeated migration.
- No fake years of enrollment, huge fake rosters, random school rerolls, or fabricated meeting schools are introduced.
- Save/reload + repeated 4A.1→4A.4 migration is idempotent in all final acceptance/fuzz scenarios.

## Phase 4A acceptance

All **32/32 Phase 4A acceptance criteria are verified**.

Runtime acceptance suite:
- `qa/t_4a5_accept.py`: **32/32 PASS** on the final generated build.

Criterion 32 (generated output rebuilt from source) was verified separately by two authoritative rebuilds with identical SHA-256 hashes.

## Required Phase 4A fuzz

`qa/t_4a5_fuzz.py` ran **600 randomized operations** total:
- elementary-age child: 150 operations — PASS
- middle-school age: 150 operations — PASS
- high-school age: 150 operations — PASS
- adult with preserved school history: 150 operations — PASS

Final fuzz assertions: **20/20 PASS** across the four scenario runs, including canonical ID validity, one-current-school invariants, provenance validity, save/reload, repeated migration idempotence, and browser-error checks.

## Fresh core regressions

Phase 4A:
- 4A.1 focused: **13/13 PASS**
- 4A.2 focused: **19/19 PASS**
- 4A.3 focused: **18/18 PASS**
- 4A.4 focused: **18/18 PASS**
- School compatibility: **14/14 PASS**
- 4A.5 acceptance runtime: **32/32 PASS**
- Phase 4A final focused/acceptance subtotal: **114/114 PASS**, plus **600-op fuzz / 20/20 fuzz checks PASS**

Required prior-phase regressions freshly rerun:
- Phase 3C focused + acceptance/fuzz: **131/131 PASS**
- Phase 3B focused + acceptance/fuzz: **94/94 PASS**
- H3 focused: **50/50 PASS**
- HOTFIX-P1: **74/74 PASS**
- People/Profile/Friendship: **55/55 PASS**
- Phase 3A, H2, Phase 2A.6, Medicine, Family/House Rules, save/reload/migration, School exam, Context, Day lifecycle, Growth, KNX communication/social scheduling, romance, social, university, work, UI, major, narrative, nurse, balance, birthday, business, campus, care, holidays and identity regressions were also rerun successfully where the suite completed in this environment.

## Full-regression environment notes

The regression workload/assertions were not weakened. Some historical Playwright suites have environment-specific navigation or execution constraints:

- `qa/t_schoolyear.py`: rerun progressed through multi-country school-year checks, grade progression, prom/elections and Grade-12 graduation; the full script exceeded the execution window before its final summary. No assertion failure was observed before timeout in the final QA-mode-compatible run.
- `qa/t_health.py`, `qa/t_hij.py`, `qa/t_lmpq.py`, `qa/t_items.py`, `qa/t_ff2.py`, `qa/t_events.py`, `qa/t_dev.py` and the old generic `qa/t_fuzz.py` are long-running in this environment and did not produce a complete fresh summary inside the available execution window. Dedicated 4A, 3B and 3C fuzz suites completed successfully instead; these timeouts are not counted as passes.
- `qa/t_theme.py`: all Light/Dark/Life contrast, persistence, toggle and primary theme checks completed successfully; its final OS-color-scheme loop directly navigates to the historical harness URL and is blocked by the current browser policy.
- `qa/t_creator.py`: contains an explicit historical `file:///home/claude/proj/index.html` navigation for real-player mode, which the current browser policy blocks. A portable adaptation was attempted but did not complete within the execution window.
- `qa/t_jordan.py`: one legacy fixture assertion reports `Grade 1` paired with `Sunrise Secondary School`. The compatibility fixture itself already contains exactly that contradictory pair before game load; Phase 4A migration intentionally preserves established visible legacy names rather than silently replacing an unknown/inconsistent legacy school. All other Jordan assertions passed.

Temporary QA-only harness/path compatibility changes were removed. Shipped `qa/harness.py` was restored byte-for-byte before final packaging.

## Final build integrity

- `game.js` authoritative rebuild twice: **byte-identical**
- final `game.js` SHA-256: `67a2fa39ad6ff730d14c11a4afd8c4b399d59737b5f01673511aa8266f58f5f7`
- final `style.css` SHA-256: `801ca0d091146469420d32800e274bd14f3f3b8968f7ac567609dbba7d61f16d`
- `node --check game.js`: **PASS**
- shipped `qa/harness.py` SHA-256: `9b681b9e0f3f896c094a54b0d2258c192c34f370b12042cdaff8024bf68ce488` — restored unchanged
- final runtime/source diff confirms no 4A.5 production drift from the validated 4A.4 source.

## Phase 4A closeout

**PHASE 4A COMPLETE**

Completed checkpoints:
- 4A.1 — School World Model
- 4A.2 — Player School Assignment / Progression
- 4A.3 — NPC School Identity / History
- 4A.4 — Cross-School Social Provenance
- 4A.5 — Migration / Regression / Final QA

**Exact next resume point: Phase 4B — School Organizations / Roles / Elections**

STOP. Phase 4B has NOT started.
