# PHASE 3B — ROMANCE, DATING & RECIPROCAL SOCIAL LIFE

**Status: PHASE 3B INCOMPLETE — CHECKPOINT 3B.1 COMPLETE**

Prerequisite confirmed before recording Part A:

- `H3_PROGRESS.md` states **H3 is COMPLETE**.
- `PHASE_3A_PROGRESS.md` states **PHASE 3A COMPLETE** and explicitly reserves the full romance system for Phase 3B.
- `BUILD.md` confirms `game.js` / `style.css` are generated outputs and source modules/build tools are authoritative.
- Current source was inspected before recording these requirements, including the existing romance, identity/profile, People/friendship, milestone, decision-ledger, and migration hooks.

No Phase 3B gameplay code has been implemented in this requirements-recording step.
Do not begin implementation until Parts A–D have all been recorded and implementation is explicitly authorized.

## Requirements Checklist

- [x] Part A — Romance State / Reciprocity / Compatibility — RECORDED ONLY
- [x] Part B — Asking Out / NPC Initiative / Date Lifecycle — RECORDED ONLY
- [x] Part C — Romantic Interactions / Relationship Progression / Exes — RECORDED ONLY
- [x] Part D — Matchmaking / Multiple Prospects / Checkpoint Plan — RECORDED ONLY
- [x] 3B.1 — Canonical Romance State + Reciprocity — COMPLETE
- [ ] 3B.2 — Ask Out / NPC Initiation / Scheduling / Date Lifecycle
- [ ] 3B.3 — Romantic Interactions / Official Relationship / Breakup / Exes
- [ ] 3B.4 — Matchmaking / Blind Dates / Multiple Prospects
- [ ] 3B.5 — Final Migration / Regression / Fuzz

---

# PART A OF 4 — ROMANCE STATE / RECIPROCITY / COMPATIBILITY

## 3B Goal

Phase 3B must turn romance from a mostly Player-initiated/stat-oriented system into a reciprocal life-simulation system.

Romance must support:

- mutuality
- attraction
- compatibility
- NPC initiative
- real decisions
- calendar-aware dates
- rejection
- acceptance
- progression
- first romantic milestones
- relationship formation
- breakup
- persistent ex-partner history/state

Friendship tiers and romance stages must remain separate systems.

Canonical friendship remains:

- Stranger
- Acquaintance
- Casual Friend
- Close Friend
- Best Friend

Romance must use its own canonical state.

## 3B.1 — Canonical Romance State

Before implementation, audit all existing romance-related state, including current/equivalent fields such as:

- `romanceStage`
- crush state
- dating state
- boyfriend/girlfriend/partner descriptor state
- Player love interest / attraction settings
- NPC love-interest/orientation data
- global relationship status / `S.romance`
- existing partner IDs
- existing romance history and dates

Do not blindly add a second parallel romance system.

Create/refine ONE canonical romance-state model that fits the current architecture.

Conceptually it must be capable of representing states such as:

- no romantic development
- Player has a crush
- NPC has a crush
- mutual attraction
- talking / getting to know each other romantically
- dating / seeing each other
- exclusive relationship
- boyfriend / girlfriend / partner
- former partner / ex

Exact field names/labels should follow current architecture where appropriate.

Not every romantic relationship must pass through every possible state.

Valid examples include:

- friendship gradually becoming mutual attraction
- a future blind date beginning directly as romantic exploration
- NPC confessing interest before the Player develops a crush

## One-Sided vs Mutual Feelings

Player attraction and NPC attraction must be distinct.

The Player having a crush must NOT automatically mean the NPC reciprocates.

NPC attraction/interest needs its own canonical state/evidence.

Conceptual example:

- Player crush: true
- NPC attraction: low or unknown
- Result: asking them out may still be rejected

Do not use a single `romanceStage='crush'` value in a way that falsely implies mutual interest.

## Romantic Availability / Profile Knowledge

Use the Profile knowledge hooks created in Phase 3A.

Actual internal NPC romantic availability/status may include states such as:

- Single
- Talking to someone
- Seeing someone
- In a relationship
- Engaged
- Married

What the Player KNOWS may still be:

- Unknown

Do not expose hidden NPC romantic information automatically.

If the NPC is the Player's own current partner, their relationship status is legitimately known.

## Love Interest / Orientation Compatibility

NPC love-interest/orientation data must affect romance outcomes.

If an NPC's romantic preference does not include the Player's gender, romantic advances must not succeed.

Use respectful rejection language/consequences.

Conceptually:

> “I really like you, but not in that way.”

Orientation incompatibility must not behave like a stat deficit that can be overcome by repeated clicking or raising relationship numbers.

Do not change an NPC's orientation because the Player repeatedly interacts with them.

Friendship may continue after romantic incompatibility/rejection.
Future systems may also allow non-romantic friend participation in events such as prom where appropriate.

## Attraction / Interest Model

Romance should depend on more than one generic number.

Use appropriate combinations of existing/canonical signals such as:

- friendship/closeness
- trust
- mutual attraction
- Looks where appropriate
- Personality compatibility
- shared interests
- shared history
- romantic orientation compatibility
- current availability
- recent behavior
- conflict
- reputation/context where relevant

Looks may influence attention and attraction, but must never guarantee romance.

High Looks must not override:

- incompatible orientation
- an existing committed relationship
- major conflict
- a direct rejection/current decision state
- age restrictions

## Personality Effects

Use actual Personality hooks/data established by Phase 3A rather than inventing a parallel trait system.

Conceptual effects may include:

- Shy NPC: may take longer to initiate
- Bold NPC: may initiate sooner
- Busy NPC: may prefer scheduled dates / counter-propose viable times
- Romantic or sentimental NPC: may value thoughtful dates
- Practical NPC: may prefer simpler activities
- Social NPC: may enjoy group/public activities

These examples are behavioral direction, not mandatory hard-coded trait names.
Implementation must use the actual current trait vocabulary and centralized personality architecture.

## Age Safety / Age-Appropriate Romance

Romance must remain age appropriate.

Below the Teen threshold:

- no romantic date system
- no kiss system
- no intimacy system

From Teen age, age-appropriate crushes and romance may exist.

Minor characters must NEVER receive adult sexual content.

Age-appropriate Teen romantic interactions may later include:

- holding hands
- hugging
- cheek kiss
- first kiss
- goodbye kiss
- romantic date
- confession

Adult 18+ relationships may support more mature relationship progression, but intimate scenes must remain non-explicit / fade-to-black.

Do not create explicit sexual content.

## Relationship Descriptor vs Romance Stage

The People Profile header must continue supporting human-readable relationship descriptors such as:

- Boyfriend
- Girlfriend
- Partner

These descriptors are not numeric romance-stage labels.

Friendship tier and romantic descriptor/state remain separate.

Example:

An NPC may simultaneously be internally:

- Best Friend
- Girlfriend

The UI may prioritize the romantic descriptor where appropriate while retaining friendship state internally.

## Canonical Romance Milestones

Prepare canonical milestone support for later Phase 3B checkpoints.

Examples:

- First crush
- Mutual attraction discovered
- First date
- First hand holding
- First cheek kiss
- First kiss
- Became official
- Anniversary start date created
- Breakup
- Reconciled later

Do not duplicate milestones when state oscillates or thresholds are crossed repeatedly.

Do not turn every flirt/small interaction into a milestone.

## Save / Migration Requirements

Existing saves must preserve, where present:

- crushes
- partners
- existing romance history
- existing relationship dates

Migration must NOT:

- randomly create attraction
- randomly delete partners
- convert one-sided crushes into mutual romance
- duplicate milestones

Migration must follow existing project invariants: idempotent, non-destructive, stable-ID preserving, and version-aware.

---

# Current Source Audit Notes — Before Phase 3B Implementation

These notes record the CURRENT architecture observed while collecting Part A. They are not implementation changes.

1. `src/modules/romance72.js` currently owns much of the existing romance flow.
   - `eligibleRomance()` already enforces teen/adult age boundaries and family exclusion.
   - `adultRomance()` gates adult-only relationship content.
   - `ensureRomanceProfile()` currently initializes fields including `attraction`, `romanceStage`, `romanceOpen`, orientation mismatch, and boundaries.
   - `setPartner()` currently sets global `S.romance.partnerId`, partner display name/status, and per-person `romanceStage`.
   - `endRelationship()` currently persists an `ex` state and romance history rather than deleting the person.
   - H3.2 already routes existing `askOut` repeat-decision integrity through the central Decision Ledger.

2. Current `romanceStage` usage is not yet a complete mutual-romance model.
   - Existing source can set `romanceStage='crush'` after a successful romantic response.
   - Phase 3A documentation already notes a prior test issue where one-sided crush state could be misread as mutual.
   - Part A therefore requires the implementation checkpoint to separate Player feelings from NPC feelings instead of assuming `crush` means mutuality.

3. Orientation/profile knowledge hooks already exist in `src/modules/ident73.js`.
   - `loveInterestKnown()` supports knowledge gating.
   - `askLoveLife()` can reveal orientation through interaction.
   - `identityTick()` may reveal it after closeness when appropriate.
   - `migrateIdentity()` already marks incompatible existing romance-open state without changing orientation.
   - These hooks should be reused rather than replaced.

4. People/Profile and friendship architecture from Phase 3A must remain authoritative.
   - Relationship descriptors are already display hooks and are explicitly separate from romance-stage redesign.
   - Friendship tiers/milestones remain their own system.
   - Phase 3B must not collapse friendship tier into romantic stage.

5. Existing breakup/ex persistence should be preserved/refined rather than replaced casually.
   - `endRelationship()` currently sets `romanceStage='ex'`, appends history, and retains the Person record.
   - This aligns with Part A's ex-partner persistence requirement.

6. Current safety behavior already includes important constraints that Phase 3B must preserve.
   - Teen/adult age gating exists.
   - Adult-only intimate action is gated to adults and is fade-to-black.
   - Orientation mismatch prevents romantic success in existing flows.
   - Phase 3B must refine reciprocal simulation without weakening these safeguards.

7. `BUILD.md` remains authoritative for implementation later.
   - Modify source modules/build tools, not generated `game.js` directly.
   - Rebuild generated outputs after future authorized source changes.

---

# PART B OF 4 — ASKING OUT / NPC INITIATIVE / DATE LIFECYCLE

## 3B.2 — Romance Must Be Reciprocal

Current romance gameplay is too Player-driven. Phase 3B must allow NPCs, when eligible and contextually appropriate, to:

- show romantic interest
- ask the Player to spend time together
- ask the Player on a date
- confess feelings
- suggest another time
- decline plans
- change their mind only after legitimate future context changes

NPC initiative must consider appropriate existing/canonical state such as:

- attraction
- closeness / trust
- Personality
- schedule
- current relationship state
- age
- orientation compatibility
- recent interactions
- cooldown / invitation history

NPC invitations must not happen constantly.

## Invitation Frequency / Anti-Spam

The same NPC must not repeatedly send date, picnic, sleepover, park, or similar invitations every 2–3 days without context.

Invitation frequency should be context-sensitive and consider:

- relationship closeness
- NPC Personality
- school/work schedule and workload
- last invitation
- recent accepted/declined plans
- other commitments
- recent hangouts / dates
- event category where current architecture supports separate cadence

Do not impose one identical universal cooldown for every social-event type if current systems can represent more appropriate contextual cooldowns.

## Asking Out

The Player may ask an eligible NPC on a date. The NPC may:

- Accept
- Reject
- Suggest another time
- Maybe later

Use the H3 central Decision Ledger / request-integrity foundation where appropriate.

The same rejected proposal/context must not reroll because the Player spam-clicked.

Meaningful rejection/counterproposal reasons may include, where legitimately knowable or appropriate to surface:

- not romantically interested
- not ready
- incompatible orientation
- already committed
- recent conflict
- low trust
- schedule conflict
- parent/age limitation
- high current workload

Do not expose secret internal formulas or raw scoring in the UI.

## “Find a Time We're Both Free”

Finding calendar availability and obtaining consent/willingness are separate concepts.

“Find a time we're both free” may locate a viable candidate slot, but must NOT force the NPC to accept a date or plan.

After a viable slot is found, the NPC may still:

- accept the proposed time
- decline
- counter-propose another time
- say maybe later

## No Schedule Overlap

Committed plans must respect the real calendar.

A new plan must not overlap another committed event requiring the Player's presence, even by one minute.

When a conflict exists, the UI should provide a useful warning containing known details such as:

- existing person/event
- date
- time
- location, where known

The Player must choose another slot. Do not silently overwrite an existing plan.

## Date Planning Record

A scheduled date should preserve appropriate planning data, including:

- person / stable person identity
- date
- start time
- expected duration
- location / activity
- inviter
- acceptance state
- payment expectation where relevant
- transport hook where current systems already support it

Use only actual accessible locations/activities from the current world architecture. Potential existing-compatible categories may include:

- café
- restaurant
- park
- picnic
- mall
- movie
- arcade
- school event
- walk
- casual meal
- other valid current-world locations

Do not expose inaccessible location choices. Do not implement the future Travel/Transportation expansion in Phase 3B.

## Location Variety

Avoid mechanically repeating the same date location when suitable alternatives exist.

NPC preferences and recent date history should influence location selection. Repeat locations may still occur naturally; they must not be hard-banned forever.

Avoid patterns such as repeated Restaurant → Restaurant → Restaurant → Restaurant when other appropriate options exist.

## Date Lifecycle

A date must not collapse into:

Accept → instant stat gain → finished.

Phase 3B should support a real lifecycle:

Invitation
→ acceptance / counterproposal / decline
→ scheduled plan
→ pre-date preparation where applicable
→ travel / meet-up hook
→ date scene(s) / interactions
→ outcome
→ post-date reaction / follow-up

Not every date needs a large event tree, but each completed date should contain at least one meaningful state-aware situation/outcome.

## Date Story Situations

Contextual situations may include:

- easy conversation
- awkward silence
- discovering a shared interest
- disagreement
- NPC arrives late
- Player arrives late
- compliment
- embarrassing moment
- unexpectedly good conversation
- location problem
- activity performing better/worse than expected

Outcomes must respond to relevant Personality, relationship state, history, and Player choices rather than drawing blindly from one giant disconnected text pool.

## After the Date

A date outcome may affect appropriate systems such as:

- attraction
- closeness
- trust
- fun
- respect
- conflict
- romance progression
- structured narrative memory

NPCs may later reference meaningful dates through existing/future narrative-memory hooks. Significant dates may create canonical milestones; ordinary small moments should not all become milestones.

## Payment

For paid date activities, do not assume either:

- the Player always pays, or
- the inviter always pays.

Possible outcomes may include:

- inviter offers
- split bill
- other person offers
- one person treats the other

The decision may consider:

- inviter
- finances
- Personality
- generosity
- relationship closeness
- age
- context / occasion

Payment should not become a repetitive negotiation popup on every date. Use contextual defaults/choices intelligently.

## Device / Contact Boundary

Phase 3B must respect current communication/device/contact restrictions.

Do not bypass legitimate requirements for contact/device access where the current game already enforces them.

Do NOT implement the full Exchange Number / Phone overhaul in Phase 3B; that remains Phase 3C.

Date invitations may use whatever legitimate interaction channels the current architecture currently supports.

---

# PART C OF 4 — ROMANTIC INTERACTIONS / RELATIONSHIP PROGRESSION / EXES

## 3B.3 — Romantic Interaction Menu

Romance interactions must expand naturally according to:

- age
- relationship state
- consent / willingness
- closeness
- context

Do not show every romantic option at all times.

## Age-Appropriate Teen Romance

For eligible Teen characters, possible interactions may include:

- compliment
- flirt
- confess crush
- ask on date
- hold hands
- hug
- cheek kiss
- first kiss
- kiss
- goodbye kiss

Availability must depend on context and current romance state.

Once a first-only milestone/action has occurred, it must no longer remain available as a special first-time action. For example, `First Kiss` must not remain a repeatable special action after the first kiss has already happened.

Repeated clicking must not farm major relationship progression.

## Older Teen Context

For older teens, existing age/curfew/house-rule systems may support context-sensitive situations such as:

- evening dates
- asking to stay out later
- sneaking out after curfew
- sneaking someone in

These must appear only when the current situation genuinely permits them.

Examples:

- `Sneak out` only during a restricted/late period when the Player is expected to be home.
- `Sneak them in` only when the Player's current location/home context actually allows it.

Both should carry appropriate consequences such as:

- discovery risk
- family / house-rule consequences
- relationship consequences

They must not become permanent always-visible Romance buttons.

No sexual content for minors.

## Adult Relationships

For characters age 18+, romance may support more mature relationship development, but intimate content must remain non-explicit.

Use:

- fade-to-black handling
- relationship / mood consequences
- consent and context

rather than graphic sexual scenes.

## Consent / Reciprocity

Physical affection requires current willingness.

An NPC may:

- accept
- hesitate
- decline

A previous successful kiss or other affection does not create permanent automatic consent.

Repeated rejected physical-affection actions must use H3-style decision integrity/cooldown so the Player cannot spam until RNG changes.

## Becoming Official

A romantic relationship must not automatically become official after a fixed number of clicks.

Becoming Boyfriend/Girlfriend/Partner should depend on meaningful state such as:

- mutual attraction
- successful romantic development
- trust / closeness
- sufficient shared history
- compatibility
- both people wanting commitment

Either the Player or the NPC may initiate a “what are we?” / official-relationship conversation.

Possible outcomes may include:

- become official
- not ready
- continue seeing each other
- decline relationship

## Relationship Start Date

When a relationship becomes official, store one canonical relationship start date.

This date must be usable later for:

- dating anniversaries
- the future Occasion Engine
- relationship milestones

Do not implement the full anniversary event system in Phase 3B.

## Relationship Progression / Maintenance

Once official, contextual partner interactions may include:

- date
- spend time together
- affectionate interaction
- emotional support
- discuss future
- resolve disagreement
- celebrate a relevant milestone

Do not make relationship maintenance depend on constant interaction spam.

## Conflict

Romance must be able to worsen as well as improve.

Possible context-backed causes include:

- broken plans
- dishonesty
- neglect
- repeated rejection of meaningful plans
- major arguments
- incompatible goals
- bad behavior
- jealousy where supported by real state/context

Do not generate jealousy randomly without a state-based reason.

## Breakup

A relationship may end. Breakup may be initiated by:

- Player
- NPC
- mutual conversation

Possible legitimate reasons may include:

- low trust
- prolonged conflict
- incompatibility
- neglect
- cheating later if that system is supported
- moving / life circumstances
- changed feelings

Do not force a breakup merely because one meter dipped slightly.

## Ex-Partners

After a breakup, the NPC must remain a persistent Person record.

Do NOT delete the NPC and do NOT reset them to Stranger.

Their descriptor/history may reflect:

- Ex
- Former Partner

depending on the existing UI architecture.

Preserve:

- relationship log
- romance milestones
- shared memories
- breakup event
- relationship start date
- relationship end date

Future reconnection may be possible.

## Reconciliation

Reconciliation must not be a simple immediate reroll button.

It should require context such as:

- enough time since breakup/rejection
- changed circumstances
- remaining compatibility
- conflict recovery
- mutual willingness

Use H3 decision integrity for repeated reconciliation requests where appropriate.

## Narrative Continuity

Phase 3A structured narrative memory should consume meaningful romance threads.

Examples:

- a friend asks about an upcoming date
- a partner remembers a meaningful conversation
- an NPC references a previous date
- a former partner references the breakup when contextually appropriate

Do not turn every tiny flirt into permanent narrative memory.

---

# STOP / Resume Point

Parts A, B, and C requirements are recorded only.

Do NOT implement Phase 3B yet.
Do NOT begin any Phase 3B checkpoint.
Wait for Part D.

**Exact resume point:** receive and record **PHASE 3B REQUIREMENTS — PART D OF 4**.

# PART D OF 4 — MATCHMAKING / MULTIPLE PROSPECTS / CHECKPOINT PLAN

## 3B.4 — Matchmaking

If the existing Matchmaking option exists, make it a real functioning system.

The Player may ask an eligible NPC to introduce them to someone.

NPCs may also offer to introduce the Player to someone.

Matchmaking must not be only Player-initiated.

## Matchmaker Eligibility

A matchmaker should realistically have enough connection to the Player.

Examples may include:

- Close Friend
- Best Friend
- sibling
- relative
- another appropriate close NPC

A random Acquaintance should not constantly arrange blind dates.

## Match Candidate Information

Before accepting a setup/blind date, the Player should be able to learn reasonable basic information that the matchmaker could legitimately know.

Examples:

- Full name
- Age
- Gender
- Love interest / compatibility when legitimately known
- School/work context
- Looks description/rating where appropriate
- how the matchmaker knows them

Do not reveal hidden private information the matchmaker could not realistically know.

## Match Compatibility

A proposed candidate must respect:

- age compatibility
- gender/love-interest compatibility
- current relationship status
- NPC availability

Do not match the Player with someone already in a committed relationship unless the actual state/story explicitly supports that situation.

## No Repeated Same Match

After a clear rejection, do not repeatedly offer the same blind-date candidate.

Exception:

- `Maybe Later` may keep the candidate eligible after an appropriate cooldown.

Track previous match offers so the same candidate is not endlessly recycled.

## Matchmaking Cooldown

NPCs must not offer blind dates constantly.

Use realistic cooldown/context.

If the Player is already in an official committed relationship, ordinary blind-date or matchmaking offers must not be available.

## Talking to Multiple People

Before exclusivity, the Player may be getting to know more than one romantic prospect at the same time.

Examples:

- Talking to Alex
- Talking to Jordan

This should be valid when no exclusivity/commitment exists.

It may create:

- uncertainty
- choice
- eventual preference
- occasional jealousy only when supported by real context

Do not automatically classify this as cheating.

Once exclusivity or an official relationship is established, other romantic progression must respect that commitment.

## Blind Date Lifecycle

Blind dates must use the normal Date Lifecycle defined in 3B.2.

Do not create a separate lower-quality date engine.

Lifecycle:

Matchmaker intro
→ Player reviews basic information
→ accept / decline / maybe later
→ schedule
→ actual date
→ outcome
→ potential further romantic development

## Checkpoint Plan

Execute Phase 3B later in this exact checkpoint order:

- [ ] **3B.1 — Canonical Romance State + Reciprocity**
  - STOP after checkpoint.

- [ ] **3B.2 — Ask Out / NPC Initiation / Scheduling / Date Lifecycle**
  - STOP after checkpoint.

- [ ] **3B.3 — Romantic Interactions / Official Relationship / Breakup / Exes**
  - STOP after checkpoint.

- [ ] **3B.4 — Matchmaking / Blind Dates / Multiple Prospects**
  - STOP after checkpoint.

- [ ] **3B.5 — Final Migration / Regression / Fuzz**
  - STOP after checkpoint.

Never automatically begin the next checkpoint.

## Final Regression — 3B.5

At 3B.5 run:

- all Phase 3B focused tests
- H3 regression
- HOTFIX-P1 regression
- Phase 3A regression
- H1/H2
- Phase 2A
- Phase 2B
- full project regression
- save/reload
- migration idempotence
- required fuzz

Representative life stages must include:

- teen
- older teen
- adult

Do not weaken tests merely to obtain a green result.

If a failure belongs to a later approved phase and does not violate Phase 3B correctness, document it rather than scope-creeping Phase 3B.

## Core Acceptance Criteria Before Phase 3B COMPLETE

Verify all of the following:

1. One-sided crush != mutual attraction.
2. NPC can initiate romance/date appropriately.
3. NPC can reject Player.
4. Find-free-time does not force acceptance.
5. Same rejected ask cannot be spam-rerolled.
6. Dates are calendar objects/plans, not instant stat buttons.
7. Date scenes have contextual outcomes.
8. Repeated same location is discouraged.
9. Paid dates support contextual payment responsibility.
10. Romantic physical interactions require reciprocal willingness.
11. Minor romance remains age appropriate.
12. Adult intimacy remains non-explicit.
13. Relationship can become official through mutual decision.
14. Relationship start date is preserved.
15. Breakup does not delete NPC.
16. Ex remains in People/history.
17. Matchmaking works both directions where applicable.
18. Match candidate compatibility is validated.
19. Same rejected match is not endlessly reoffered.
20. Official partner disables ordinary blind-date offers.
21. Multiple Talking stages can coexist before exclusivity.
22. Existing friendship tiers remain intact.
23. Profile knowledge gating remains intact.
24. H3 Decision Ledger remains intact.

## Scope Boundary

Do NOT implement the following in Phase 3B:

- full Phone/Messaging overhaul
- Exchange Number overhaul
- Smartwatch overhaul
- Multi-School expansion
- Prom overhaul
- cross-school Prom
- Universal Occasion Engine
- Birthday Gift overhaul
- Side Hustle overhaul
- Transportation overhaul

These belong to later phases.

---

# STOP / Resume Point

Parts A, B, C, and D requirements are fully recorded.

## Checkpoint Record — 3B.1 COMPLETE

### Implementation

- Added `src/modules/romance3b1.js` as the canonical romance-state layer.
- `p.love` is now the canonical per-person romance record. Existing `p.romanceStage` and `p.attraction` remain compatibility mirrors so older systems continue to function while later Phase 3B checkpoints migrate onto the canonical API.
- Split Player-side crush state from NPC-side attraction/interest: `playerCrush`, `npcAttraction`, `npcInterest`, and derived `mutual` no longer imply each other. A legacy `romanceStage='crush'` migrates as a one-sided Player crush unless an explicit mutual/established state already exists.
- Added reusable compatibility/availability hooks that incorporate age rules, NPC orientation/love-interest compatibility, commitment availability, closeness, trust, Looks, shared interests, Personality hooks, conflict, and NPC attraction without exposing formulas in UI.
- Orientation incompatibility now blocks romantic compatibility while leaving friendship/closeness/trust intact.
- Added knowledge-gated romantic availability helper: actual status can remain internal while Profile-visible status remains `Unknown` until Phase 3A knowledge rules allow it.
- Preserved People/Profile relationship descriptors; current partner continues to surface as Boyfriend / Girlfriend / Partner, with engaged/married-compatible descriptors available without merging friendship tier into romance stage.
- Added canonical milestone types/foundation for first crush, mutual attraction, and breakup; existing milestone de-duplication remains authoritative.
- Existing partner records are preserved and promoted into a reciprocal canonical state during migration; ex/former-partner state remains persistent rather than deleting the Person.
- No date lifecycle, NPC date initiation, scheduling overhaul, matchmaking, breakup flow, or Phase 3B.2+ feature was implemented.

### Migration

- Added `migrateRomance3B1()` and invoked it from the existing social reconciliation path after identity migration.
- Migration is deterministic/idempotent: it does not RNG-create attraction, does not delete partners, and does not convert an ordinary legacy one-sided crush into mutual attraction.
- Existing explicit `crushMutual` / established partner states are preserved.
- Legacy live writers to `p.romanceStage` / `p.attraction` are still honored as compatibility inputs until later checkpoints fully migrate those callers.

### Actual Files Changed

- `src/modules/romance3b1.js` — new canonical 3B.1 romance state/compatibility/migration layer.
- `src/modules/social72.js` — calls `migrateRomance3B1()` during reconciliation.
- `tools/splice.py` — includes `romance3b1.js` in the generated build and exposes focused test hooks.
- `src/base/game.js` — focused QA hook additions only; no user-facing gameplay logic added there.
- `game.js` — regenerated from source.
- `qa/t_3b1.py` — new focused 3B.1 suite.
- `qa/t_h32.py` — fixture now explicitly declares orientation compatibility because 3B.1 makes orientation a hard romance gate; H3 decision assertions are unchanged.
- `qa/t_romance.py` — legacy willing-romance/prom fixtures now explicitly declare compatible orientation for the same reason; behavior assertions are otherwise unchanged.
- `PHASE_3B_PROGRESS.md` — this checkpoint record.
- `MIGRATION_NOTES.md`, `CHANGELOG.md` — checkpoint documentation.

### Tests / Validation

- `qa/t_3b1.py`: **13/13 PASS**.
- `qa/t_h31.py`: **15/15 PASS**.
- `qa/t_h32.py`: **11/11 PASS** after making the test NPC orientation explicitly compatible; repeat-decision integrity remains intact.
- `qa/t_people.py`: PASS under the temporary portable QA harness.
- `qa/t_profile.py`: PASS under the temporary portable QA harness, including Profile knowledge gating and partner descriptor checks.
- `qa/t_friend.py`: PASS under the temporary portable QA harness; friendship progression remains independent from romance state.
- `qa/t_romance.py`: all directly 3B.1-relevant safety/compatibility/partner/prom assertions pass after explicit compatible-orientation fixtures. Two Valentine/date-scene assertions still fail exactly the same way on the H3 baseline under the same harness; they are pre-existing and belong to 3B.2 date-lifecycle scope, so they were documented rather than scope-crept here.
- `node --check game.js`: PASS.
- Re-running `tools/splice.py` + theme build reproduces `game.js` / `style.css` byte-identically.
- Temporary QA harness override used only to bypass the environment's blocked hard-coded `file://` path; shipped `qa/harness.py` was restored unchanged.

### Known Limitations / Deliberate Scope Boundaries

- Existing date lifecycle remains the current pre-3B.2 implementation.
- NPC romantic initiative is not implemented yet.
- `romanceStage` / `attraction` compatibility mirrors remain because many pre-existing systems still write them; removing those mirrors belongs to later controlled migration, not 3B.1.
- The two baseline Valentine/date-scene failures are not new 3B.1 regressions.

### Exact Resume Point

**PHASE 3B INCOMPLETE**

**3B.1 COMPLETE**

Resume from checkpoint: **3B.2 — Ask Out / NPC Initiation / Scheduling / Date Lifecycle**.

Do not begin 3B.2 automatically.
