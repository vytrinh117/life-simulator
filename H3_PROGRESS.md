# H3 — Decision & Repeat-Action Integrity

## Status

H3 COMPLETE — H3.0 through H3.5 COMPLETE. Phase 3B has NOT been started.

- HOTFIX-P1 is COMPLETE.
- Read CURRENT source before implementation.
- Wait for all H3 requirement parts before coding.
- Do NOT begin Phase 3B.

## Requirements Part A — RECORDED

### H3.0 — Small UI Copy Cleanup

Current stale user-facing copy still refers to:

`Family & Relationships`

even though that sidebar destination was removed by HOTFIX-P1.

Update stale user-facing copy to refer to:

`People`

Do not change romance behavior in H3.0.

### H3.1 — Decision Authority

The current game incorrectly allows older siblings/caregivers to become the approval authority for requests such as buying a phone.

Separate these concepts:

1. caregiver / household helper
2. parent / guardian decision authority

A caregiver may help with:

- supervision
- meals
- transport
- routine care
- household support

but this does NOT automatically grant authority to approve major requests.

For a minor Player, final authority should normally come from:

- Mother
- Father
- actual guardian

Only use another adult guardian when real family state requires it.

Older siblings must NOT automatically gain purchase/permission authority merely because they are old enough to act as caregivers.

This applies to decisions such as:

- phone
- tablet
- computer
- expensive purchases
- major outings
- overnight permission
- travel permission
- school permission
- other parent/guardian decisions

Do not remove older siblings from caregiving/support systems.

### Decision Maker Identity

A decision must know WHO made it.

Store stable identity where appropriate, e.g.:

- `decisionMakerId`
- `decisionMakerIds`

Do not decide the result first and randomly choose a caregiver name afterward.

If Mom made the decision, logs/UI must consistently show Mom.

Do not allow:

`Mom says No`  
then immediate retry shows `Older Brother says Yes`

because a different random caregiver was selected.

## Implementation Gate

STOP after recording Part A.

DO NOT CODE.

Wait for all remaining H3 requirement parts before implementation.

## Requirements Part B — RECORDED

### Central Decision Memory / Request Ledger

Build one reusable decision-memory architecture.

Do not create unrelated one-off cooldown fixes for every feature.

A decision record should conceptually preserve:

- decision/request ID
- actor/requester
- decision maker personId
- request type
- target/item/context
- date/time created
- outcome
- reason
- requirements/counter-condition
- reconsideration rule/date where applicable
- resolved/expired state
- context signature

Match current architecture rather than copying these exact field names if better equivalents already exist.

### Same Request Must Not Reroll

If the Player repeats materially the same request in the same context, the game must NOT call RNG again just because the button was clicked again.

Example:

`Ask Mom to buy phone`  
`→ No: too expensive`

Click again immediately:

must remain the same decision.

Save/reload:

must remain the same decision.

### "No" Is Not Always Permanent

A request may become eligible for genuine reconsideration when the real context changes.

Examples:

- next valid reconsideration date
- Player saved enough money
- required grades improved
- required chore completed
- birthday/Christmas arrived
- explicit parent counterproposal completed
- material family financial situation changed
- previous decision expired

A legitimate changed context may create a new decision.

Repeated clicking is NOT a changed context.

### Preserve Rich Request Outcomes

Do not reduce all existing request states to simple Yes / No.

Preserve meanings such as:

- Yes
- No
- Maybe
- Considering
- Ask later
- Birthday
- Christmas
- partial payment
- save money first
- chores requirement
- grades requirement

If current source has equivalent states, preserve them.

### Persistence

Decision memory must:

- survive save/reload
- migrate safely
- remain idempotent
- not duplicate on repeated load
- expire/resolve deliberately
- avoid unbounded garbage growth

Do not randomize old decisions during migration.

### Future Reuse

Design the ledger so later systems can consume it.

H3.2 romance request integrity should use the same foundation.

Future systems may also use it.

Do NOT implement future Phase 3B features now.

## Implementation Gate — Part B

STOP after recording Part B.

DO NOT CODE.

Wait for all remaining H3 requirement parts before implementation.

## Requirements Part C — RECORDED

### H3.2 — Romance Ask Integrity

Fix only repeat-decision integrity for EXISTING romance asks.

Current problem:

`Ask someone out`  
`→ rejected`  
`→ immediately ask again`  
`→ fresh RNG may approve`

The same proposal/context must not reroll immediately.

Use the central Decision Ledger where appropriate.

Allow reconsideration only after a legitimate context/cooldown change.

Do NOT implement:

- NPC date invitations
- full dating lifecycle
- matchmaking
- blind dates
- exclusivity overhaul
- new teen romance content
- payment negotiation
- sneak-out system

Those belong to Phase 3B.

### H3.3 — Contest Preparation Integrity

Current generic Prepare action can be repeatedly farmed.

Target behavior:

maximum 3 progression-granting preparation sessions per contest/day.

Use diminishing return.

Conceptually:

1. 1st session = strongest
2. 2nd = reduced
3. 3rd = further reduced
4. 4th+ = no additional contest preparation progression that day

Do not necessarily use exact numeric multipliers if current balancing suggests better values.

Time/Energy consequences should still apply only if the action is actually allowed/executed appropriately.

Where current contest data already supports meaningful preparation types, allow richer labels/actions.

Do NOT build the future Competition overhaul.

Do not create fake contest-specific options unsupported by current data.

### H3.4 — Birthday Acknowledgment

If Player genuinely attends someone's birthday celebration/party, that must count as acknowledging their birthday.

The game must not later penalize Player for:

`forgot birthday`

solely because a separate Happy Birthday interaction/message was not performed.

Possible valid acknowledgment sources may include existing:

- attended birthday event
- birthday wish
- other explicit birthday acknowledgment

Use one coherent helper/state where practical.

Do not implement the Universal Occasion/Gift system here.

### H3.4 — Medicine Regression / Correctness

Inspect CURRENT Health implementation before changing anything.

Do NOT rewrite the medicine system if current behavior is already correct.

Preserve the current principle:

- medicine must match an appropriate symptom/category
- wrong medicine must not cure the illness
- medicine should not magically remove the underlying disease unless current disease design explicitly supports that behavior

Add regression coverage.

Avoid real-world medical dosing/detail.

## Implementation Gate — Part C

STOP after recording Part C.

DO NOT CODE.

Wait for all remaining H3 requirement parts before implementation.

## Requirements Part D — RECORDED

### Checkpoint Order

H3.0  
Tiny stale UI-copy cleanup

STOP

H3.1  
Parent/Guardian Authority  
+  
Central Decision Ledger

STOP

H3.2  
Existing Romance Ask Integrity

STOP

H3.3  
Contest Preparation Integrity

STOP

H3.4  
Birthday Acknowledgment  
+  
Medicine Correctness Regression

STOP

H3.5  
Final Migration / Regression / Fuzz

STOP

Never automatically begin the next checkpoint.

### H3.1 Required Tests

At minimum verify:

1. Mother/Father/guardian can be valid decision authority.
2. Ordinary older sibling is not automatically purchase authority.
3. Older sibling can still remain caregiver/support where appropriate.
4. Same phone request/context/day does not reroll.
5. Same result keeps same `decisionMakerId`.
6. Save/reload preserves pending/recent decision.
7. Repeated migration does not duplicate decisions.
8. Genuine changed condition allows reconsideration.
9. Clicking repeatedly does not count as changed condition.
10. Maybe/Considering/Ask Later/etc. semantics survive.
11. Existing request outcomes still work.

### Final H3.5

After H3.0–H3.4 complete, run:

- all focused H3 suites
- HOTFIX-P1 regression
- Phase 3A regression
- H1/H2
- Phase 2A Health
- Phase 2B Family
- full project regression
- save/reload
- migration idempotence
- required fuzz

Do not weaken tests merely to pass.

If a failure belongs to Phase 3B or later and does not violate H3 correctness, document it instead of scope-creeping.

### Progress File Tracking

Track:

- [x] H3.0
- [x] H3.1
- [x] H3.2
- [x] H3.3
- [x] H3.4
- [x] H3.5

Record after every checkpoint:

- implementation
- actual files changed
- migration
- tests
- pass/fail totals
- known limitations
- exact resume point

## Requirements Collection Status

H3 REQUIREMENTS PARTS A–D RECORDED.

DO NOT CODE until the relevant checkpoint is explicitly authorized.

Do NOT begin Phase 3B.

Never automatically begin the next checkpoint.

Exact resume point: H3.1 — Parent/Guardian Authority + Central Decision Ledger.

Do NOT begin H3.1 until explicitly authorized.


## Checkpoint Record — H3.0 COMPLETE

### Implementation

- Updated the stale user-facing romance opt-out guidance from the removed `Family & Relationships` sidebar destination to `People`.
- No romance behavior, state transitions, eligibility, or event logic was changed.
- No H3.1 decision-authority or Decision Ledger implementation was started.

### Actual Files Changed

- `src/modules/o73.js` — copy-only change in `toggleRomance()`.
- `game.js` — regenerated from current authoritative source via `python3 tools/splice.py`.
- `qa/t_h30.py` — focused static H3.0 regression coverage.
- `H3_PROGRESS.md` — checkpoint status/results.

### Migration

- None required.
- No save schema or state shape changed.

### Tests / Verification

- `python3 tools/splice.py` — PASS; generated runtime rebuilt from source.
- `node --check game.js` — PASS.
- `python3 qa/t_h30.py` — PASS, 3/3 checks.
- Focused runtime/source search confirms `Family & Relationships` is absent from `game.js` and `src/modules/o73.js`.
- Remaining repository occurrences are historical documentation, removal-test wording, build-tool comments/replacement source, or superseded base source that is explicitly removed by the build; they are not current user-facing runtime copy.

### Pass / Fail Totals

- H3.0 focused suite: 3 passed / 0 failed.
- JavaScript syntax check: passed.

### Known Limitations

- H3.1 through H3.5 remain unimplemented by design.
- Historical docs still contain the old destination name where necessary to describe prior behavior/removal; H3.0 does not rewrite project history.

### Exact Resume Point

H3.1 — Parent/Guardian Authority + Central Decision Ledger.

STOP. Do not automatically begin H3.1.


## Checkpoint Record — H3.1 COMPLETE

### Implementation

- Added a reusable central Decision Ledger in `src/modules/decision73.js`.
- Added explicit parent/guardian decision-authority resolution that prioritizes Mother, then Father, then an actual guardian.
- Kept `householdCaregivers()` unchanged as a caregiving/support concept; ordinary older siblings remain eligible caregivers but are not automatically decision authorities.
- Major purchase/request decisions now retain stable `decisionMakerId`, request/context signature, outcome/reason, requirements, reconsideration state, resolution state, and migration linkage.
- Repeating the same phone/purchase request in the same material context reuses the existing ledger record rather than invoking fresh RNG.
- Genuine reconsideration is enabled when a requirement is met or a reconsideration date is reached; repeated clicking alone does not alter context.
- Preserved rich request semantics including `Yes`, `No`, `Considering`, Birthday/Christmas deferral, partial-payment/save-first, chores, and grades conditions.
- Existing pending purchase/school approval records are linked deterministically to ledger records during normalization without rerolling old decisions.
- Added bounded ledger pruning so resolved historical decisions do not grow without limit.
- No H3.2 romance ask behavior was changed.

### Actual Files Changed

- `src/modules/decision73.js` — new H3.1 authority + Decision Ledger implementation and purchase/request integration.
- `src/modules/core72.js` — lifecycle container, pending normalization, and ledger normalization hooks.
- `tools/splice.py` — adds `decision73.js` to authoritative module build order and exposes focused QA hooks only.
- `game.js` — regenerated from authoritative source.
- `qa/t_h31.py` — focused H3.1 behavioral suite.
- `H3_PROGRESS.md` — checkpoint status/results.

### Migration

- `S.decisionLedger` is initialized safely for old/current saves.
- Existing eligible unresolved pending decisions are linked using deterministic `decision:<pendingId>` IDs.
- Repeated normalization/migration deduplicates by decision ID and does not reroll outcomes.
- Stable person IDs are reused for `decisionMakerId`; no family/person regeneration occurs.

### Tests / Verification

- `python3 tools/splice.py` — PASS.
- `node --check game.js` — PASS.
- `python3 qa/t_h31.py` — PASS, 15/15 checks.
- Verified Mother authority, Father fallback, and actual guardian fallback.
- Verified ordinary older sibling is excluded from decision authority while remaining a caregiver/support person.
- Verified same phone request/context/day does not reroll and keeps the same `decisionMakerId`.
- Verified save/reload persistence and repeated migration idempotence.
- Verified a genuine changed requirement permits reconsideration while repeated clicking does not.
- Verified rich request outcome semantics survive normalization/migration and existing request outcomes remain functional.
- Attempted legacy `qa/t_family.py` regression in this environment; the legacy harness is blocked from navigating its hard-coded `file:///home/claude/proj/...` URL (`ERR_BLOCKED_BY_ADMINISTRATOR`). This is an environment/harness limitation, not a gameplay assertion failure. Full legacy regression remains scheduled for H3.5.

### Pass / Fail Totals

- H3.1 focused suite: 15 passed / 0 failed.
- JavaScript syntax check: passed.
- Legacy family regression: not executed due environment navigation restriction; no test assertions ran.

### Known Limitations

- H3.2 through H3.5 remain incomplete by design.
- H3.1 does not implement Phase 3B romance/date systems.
- The project still contains older generic caregiver approval calls in unrelated routine/support flows; H3.1 establishes the canonical authority/ledger foundation and fixes the required repeatable purchase/request integrity without reclassifying every routine caregiver action as a parent/guardian decision.
- Full deterministic/regression/fuzz validation is reserved for H3.5 per the approved checkpoint plan.

### Exact Resume Point

H3.2 — Existing Romance Ask Integrity.

STOP. Do not automatically begin H3.2.


## Checkpoint Record — H3.2 COMPLETE

### Implementation

- Integrated the EXISTING `Ask Out` romance action with the H3 central Decision Ledger; no separate one-off RNG cooldown store was introduced.
- A romance ask decision uses the target NPC's stable person ID as both `targetKey` and `decisionMakerId`, so the remembered answer belongs to the person who actually answered.
- Repeating the same proposal in the same material romance context now replays the existing answer instead of calling romance acceptance RNG again.
- Replayed rejections do not increment `romanceAsks` again and do not stack the original rejection relationship penalty merely because the Player clicked repeatedly.
- Rejections receive an explicit reconsideration cooldown: 21 days when the existing `needsTime` boundary applies, 14 days when the NPC is currently closed to romance, otherwise 7 days. After the valid cooldown expires, the old record becomes non-reusable and the existing ask logic may evaluate a new decision.
- The decision context intentionally does not include volatile closeness/trust/attraction values, preventing trivial stat movement or the rejection's own `rel -1` side effect from masquerading as a new proposal context.
- Existing orientation mismatch, already-dating-NPC, existing-partner, boundary, acceptance, and rejection story logic remains in the existing romance system. H3.2 did not add Phase 3B systems.
- No NPC-initiated dates, full dating lifecycle, matchmaking/blind dates, exclusivity overhaul, new teen romance content, payment negotiation, or sneak-out system was implemented.

### Actual Files Changed

- `src/modules/romance72.js` — existing `askOut` path now records/reuses central Decision Ledger decisions and applies explicit reconsideration cooldowns.
- `game.js` — regenerated from authoritative source via `python3 tools/splice.py`.
- `qa/t_h32.py` — focused H3.2 behavioral regression suite.
- `H3_PROGRESS.md` — checkpoint status/results.

### Migration

- No new save container or migration routine was required; H3.2 reuses the `S.decisionLedger` schema introduced in H3.1.
- New romance ask records persist through the existing save/load + ledger normalization path.
- Existing pre-H3.2 romance history is not retroactively randomized or fabricated into decisions; the ledger begins remembering eligible asks when they are actually made after this checkpoint.

### Tests / Verification

- `python3 qa/t_h32.py` — PASS, 11/11 checks.
- Verified an existing romance-eligible target can be asked out through the unchanged action entry point.
- Verified first rejection creates one central `romanceAsk` decision with the responding NPC's stable `decisionMakerId`.
- Verified immediate repeat does not create a second decision or reroll the outcome.
- Verified immediate replay does not increment `romanceAsks` or stack the original rejection relationship penalty.
- Verified save/reload preserves the exact decision and continues blocking a same-context reroll.
- Verified valid cooldown expiry permits a new decision/reconsideration.
- Verified decisions are isolated by NPC identity.
- Verified focused H3.2 execution did not introduce Phase 3B state/system containers.
- `python3 qa/t_h31.py` — PASS, 15/15 checks.
- `python3 qa/t_h30.py` — PASS, 3/3 checks.
- `node --check game.js` — PASS.
- Re-running `python3 tools/splice.py` produced byte-identical `game.js` and `style.css` — PASS.
- Attempted legacy `qa/t_romance.py`; its old shared harness is blocked at the hard-coded `file:///home/claude/proj/index.html?qa=1` navigation with `ERR_BLOCKED_BY_ADMINISTRATOR`, before any romance assertion executes. This is the same environment/harness limitation already documented for legacy suites and is reserved for H3.5 remediation/execution rather than changing old tests in H3.2.

### Pass / Fail Totals

- H3.2 focused suite: 11 passed / 0 failed.
- H3.1 focused regression: 15 passed / 0 failed.
- H3.0 focused regression: 3 passed / 0 failed.
- JavaScript syntax check: passed.
- Reproducible source build check: passed.
- Legacy `t_romance.py`: assertions not executed because the legacy harness could not navigate its environment-specific file URL.

### Known Limitations

- H3.3 through H3.5 remain incomplete by design.
- H3.2 fixes repeat-decision integrity only for the existing Player `Ask Out` action. It intentionally does not implement the Phase 3B romance/dating expansion.
- Existing pre-H3.2 romance asks cannot be reconstructed reliably into ledger records because their original RNG outcome/context was not historically persisted; no synthetic migration is attempted.
- Full legacy romance regression, full project regression, save/migration matrix, and fuzz remain scheduled for H3.5.

### Exact Resume Point

H3.3 — Contest Preparation Integrity.

STOP. Do not automatically begin H3.3.


## Checkpoint Record — H3.3 COMPLETE

### Implementation

- Added per-contest, per-day preparation integrity for the existing generic `Prepare` action.
- A registered contest now grants preparation progression at most three times per calendar day.
- Daily progression uses diminishing returns: first session +10 preparation, second +6, third +3.
- A fourth or later same-day preparation attempt is blocked before progression, Energy/Stress changes, or time advancement.
- Fully prepared contests (`prep >= 100`) also block redundant preparation before costs are applied.
- The daily counter is stored as one rolling `prepDaily { dateISO, count }` bucket on each contest, so save/reload preserves the cap without creating an unbounded daily history.
- A new calendar day lazily resets the usable preparation count for that contest. Different contests maintain independent daily counters.
- Existing contest data does not currently provide enough structured preparation-type metadata to support honest contest-specific preparation actions, so H3.3 intentionally retains the existing generic Prepare action rather than inventing unsupported options.
- The School event UI now shows current daily usage (`0/3` through `3/3`) and disables Prepare when the daily cap or full preparation is reached.
- No future Competition overhaul behavior was implemented.

### Actual Files Changed

- `src/modules/events73.js` — H3.3 preparation counter/helpers and authoritative `contestAction()` override for diminishing returns/daily cap.
- `src/modules/ui72.js` — displays daily preparation usage and disables unavailable Prepare action.
- `game.js` — regenerated from authoritative source via `python tools/splice.py`.
- `qa/t_h33.py` — focused H3.3 behavioral regression suite.
- `H3_PROGRESS.md` — checkpoint status/results.

### Migration

- No dedicated migration routine is required. Existing contests without `prepDaily` initialize the rolling day bucket lazily on their first preparation action.
- Existing `prep` values are preserved; no contest preparation is rerolled or rewritten during load/migration.
- `prepDaily` is ordinary serialized contest state, so same-day caps survive save/reload.
- Only the current day's bucket is retained, avoiding unbounded preparation-history growth.

### Tests / Verification

- `python qa/t_h33.py` — PASS, 12/12 checks.
- Verified first three same-day sessions grant progression and gains strictly diminish (10 → 6 → 3).
- Verified the fourth same-day attempt grants no preparation and consumes no additional time/Energy/Stress.
- Verified daily counters are isolated per contest.
- Verified save/reload preserves an exhausted same-day cap.
- Verified a genuine new calendar day permits preparation again and restores the first-session gain.
- Verified a legacy contest with no H3.3 fields initializes safely on first use.
- Verified focused execution produced no page errors.
- `python qa/t_h31.py` — PASS, 15/15 checks.
- `python qa/t_h32.py` — PASS, 11/11 checks.
- `python qa/t_h30.py` — PASS, 3/3 checks.
- `node --check game.js` — PASS.
- Re-running `python tools/splice.py` produced byte-identical `game.js` (SHA-256 `08b81e1bba3c497ff6e6170938fdff45ccdb88d8abc85f39c70d452bdf38fa96`).
- `style.css` remained unchanged (SHA-256 `801ca0d091146469420d32800e274bd14f3f3b8968f7ac567609dbba7d61f16d`).
- Attempted legacy `qa/t_events.py`; its shared harness is blocked before assertions at the hard-coded `file:///home/claude/proj/index.html?qa=1` URL with `ERR_BLOCKED_BY_ADMINISTRATOR`. This is the existing environment-specific harness limitation already documented in earlier H3 checkpoints, not an H3.3 gameplay assertion failure.

### Pass / Fail Totals

- H3.3 focused suite: 12 passed / 0 failed.
- H3.2 focused regression: 11 passed / 0 failed.
- H3.1 focused regression: 15 passed / 0 failed.
- H3.0 focused regression: 3 passed / 0 failed.
- JavaScript syntax check: passed.
- Reproducible `game.js` source build check: passed.
- Legacy `t_events.py`: assertions not executed because the legacy harness could not navigate its environment-specific file URL.

### Known Limitations

- H3.4 and H3.5 remain incomplete by design.
- H3.3 intentionally does not add future contest registration, preparation-type, coaching, equipment, or competition-overhaul systems beyond what current contest data can support.
- The existing generic preparation label remains because current contest records lack structured preparation-mode metadata; richer preparation types belong to later work when backed by real data.
- Full project regression, migration matrix, and fuzz remain scheduled for H3.5.

### Exact Resume Point

H3.4 — Birthday Acknowledgment + Medicine Correctness Regression.

STOP. Do not automatically begin H3.4.

## Checkpoint Record — H3.4 COMPLETE

### Implementation

- Added one coherent birthday acknowledgment pathway around the existing persisted `bdayWished[year]` state rather than creating a parallel occasion system.
- Added `birthdayAcknowledged()` and `acknowledgeBirthday()` helpers in the existing birthday module.
- Existing explicit `wishBirthday()` now records acknowledgment through the shared helper while retaining its existing relationship, message, time, and log behavior.
- The existing forgot-birthday check now reads through the same acknowledgment helper.
- When `attendPlan()` genuinely completes a plan carrying `birthdayOf`, that person's birthday is acknowledged for the plan year. The attendance must actually reach `Attended`; merely accepting/inviting/scheduling does not count.
- This prevents a Player who attended the real birthday party from later receiving the separate "forgot birthday" penalty solely because they did not also click Happy Birthday.
- Inspected the CURRENT medicine implementation before modification. `medicineHelps()` already matches medicine categories to current symptoms, `applyMedicine()` rejects non-matching medicine, active relief is temporary, and successful medicine does not remove the underlying condition.
- No medicine gameplay logic was rewritten in H3.4; correctness was preserved and covered with focused regression tests.
- No Universal Occasion/Gift work or other later-phase features were implemented.

### Actual Files Changed

- `src/modules/knx73.js` — shared birthday acknowledgment helpers; existing wish/forget logic now uses the coherent acknowledgment state.
- `src/modules/plans72.js` — completed birthday-party attendance acknowledges the actual `birthdayOf` person.
- `game.js` — regenerated from authoritative source using `tools/splice.py`.
- `qa/t_h34.py` — focused H3.4 birthday + medicine correctness regression suite.
- `H3_PROGRESS.md` — checkpoint status/results.

### Migration

- No new migration container is required.
- H3.4 deliberately reuses the existing serialized `p.bdayWished[year]` state, so old/current saves remain compatible.
- Existing birthday wishes retain their meaning and are not rerolled or rewritten.
- Birthday-party attendance begins contributing to that same canonical state when the attendance actually occurs after this checkpoint.
- Medicine state/schema is unchanged.

### Tests / Verification

- `python qa/t_h34.py` — PASS, 10/10 checks.
- Verified genuine birthday-party attendance reaches `Attended` and marks the birthday acknowledged.
- Verified the shared acknowledgment state is the same state consumed by existing wish/forgot logic.
- Verified next-day `birthdayTick()` does not apply the "forgot birthday" relationship penalty after genuine attendance.
- Verified explicit in-person birthday wishes still record acknowledgment.
- Verified wrong/non-matching medicine is rejected and does not activate relief.
- Verified wrong medicine does not cure, remove, or replace the underlying illness.
- Verified matching medicine activates temporary relief while the underlying illness remains present.
- `python qa/t_h30.py` — PASS, 3/3 checks.
- `python qa/t_h31.py` — PASS, 15/15 checks.
- `python qa/t_h32.py` — PASS, 11/11 checks.
- `python qa/t_h33.py` — PASS, 12/12 checks.
- `node --check game.js` — PASS.
- Re-running `python tools/splice.py` kept generated `game.js` byte-identical (SHA-256 `a8aa56f04df0dd5bab36f334609573f2266f2b9f32f937801969ddb8537c6b63`) — PASS.
- Attempted legacy `qa/t_med.py` and `qa/t_knx.py`; their shared legacy harness is blocked before assertions by the hard-coded `file:///home/claude/proj/index.html?qa=1` URL with `ERR_BLOCKED_BY_ADMINISTRATOR`. This is the pre-existing environment/harness limitation, not a gameplay assertion failure. Legacy/full execution remains part of H3.5.

### Pass / Fail Totals

- H3.4 focused suite: 10 passed / 0 failed.
- H3.3 focused regression: 12 passed / 0 failed.
- H3.2 focused regression: 11 passed / 0 failed.
- H3.1 focused regression: 15 passed / 0 failed.
- H3.0 focused regression: 3 passed / 0 failed.
- Combined H3 focused checks executed at this checkpoint: 51 passed / 0 failed.
- JavaScript syntax check: passed.
- Reproducible generated `game.js` check: passed.
- Legacy `t_med.py` / `t_knx.py`: assertions not executed because the legacy harness could not navigate its environment-specific file URL.

### Known Limitations

- H3.5 remains incomplete by design.
- Birthday acknowledgment remains intentionally lightweight and reuses the existing birthday state; H3.4 does not implement gifts, universal occasions, or richer birthday lifecycle expansion.
- Medicine remains the existing game abstraction based on symptom/category matching; no real-world dosing or treatment detail was added.
- Full project regression, HOTFIX-P1/Phase 3A/H1/H2/2A/2B matrix, save/reload matrix, migration idempotence matrix, and required fuzz are reserved for H3.5.

### Exact Resume Point

H3.5 — Final Migration / Regression / Fuzz.

STOP. Do not automatically begin H3.5.



## Checkpoint Record — H3.5 COMPLETE

### Implementation

- No new gameplay feature work was added in H3.5. This checkpoint is final migration/regression/fuzz validation for H3.0–H3.4.
- H3 remains scoped to decision/repeat-action integrity, contest preparation integrity, birthday acknowledgment, and medicine regression. Phase 3B was not started.
- Final validation confirms the central Decision Ledger remains persistent/idempotent, stable decision-maker identity survives reload/migration, romance asks reuse the same foundation, contest prep caps persist per contest/day, and birthday attendance uses the existing acknowledgment state.

### Actual Files Changed

- `H3_PROGRESS.md` — final H3.5 validation record and H3 COMPLETE status.
- `QC_REPORT.md` — H3 final QA summary.
- `CHANGELOG.md` — H3 completion entry.
- No gameplay source module was changed in H3.5.
- Generated `game.js` / `style.css` were not manually edited.

### Migration / Save Validation

- H3.1 focused regression verifies same-request decisions survive save/reload and repeated migration without duplication.
- H3.2 focused regression verifies romance ask decisions survive save/reload and only become reconsiderable after valid cooldown/context change.
- Phase 3A `t_3a7.py` passed under the QA compatibility harness, including repeated reload/migration idempotence checks.
- Legacy stale-save migration regression (`t_regress.py`) passed its migration assertions before reaching a browser-navigation-only `page.reload()` limitation of the temporary non-navigation harness.
- No old H3 decision was randomized during migration.

### Tests / Verification

Focused H3 suites:

- `t_h30.py` — 3/3 PASS.
- `t_h31.py` — 15/15 PASS.
- `t_h32.py` — 11/11 PASS.
- `t_h33.py` — 12/12 PASS.
- `t_h34.py` — 10/10 PASS.
- Combined H3 focused checks: **51 passed / 0 failed**.

Required regression coverage executed successfully:

- Phase 3A: `t_3a7.py` PASS.
- H2: `t_h2.py` PASS.
- Phase 2A Health: `t_2a6.py` PASS and `t_health.py` PASS.
- Phase 2B Family: `t_family2.py` PASS; `t_family.py` retains one pre-existing stochastic assertion (`grandparents live at home in only some families`) that also fails on the H3.0 baseline under the same compatibility harness, so it is not an H3 regression. All other Family assertions pass, including old-save grandmother preservation and caregiver identity.
- HOTFIX-P1: `t_p1.py` PASS, `t_p12.py` PASS, `t_p13.py` PASS after the temporary QA harness injected the shipped `style.css` (required because `set_content` does not resolve the original stylesheet link).
- Medicine: `t_med.py` PASS.
- Birthday/social/phone regression: `t_knx.py` PASS.
- Additional regressions observed passing: `t_balance.py`, `t_bday.py`, `t_biz.py`, `t_campus.py`, `t_care.py`, `t_context.py`.
- Required fuzz: representative start ages 3, 6, 8, 11, 14, 17 all reported no JS errors; invariants held across 840 random player steps.

### Legacy QA Environment Notes

- The shipped legacy harness uses a hard-coded `file:///home/claude/proj/index.html?qa=1` URL and an old Chromium path. This environment blocks browser navigation to both that file URL and localhost with `ERR_BLOCKED_BY_ADMINISTRATOR`.
- For H3.5 only, a temporary QA compatibility harness loaded `index.html` with Playwright `set_content`, injected shipped `style.css`, `data.js`, and `game.js`, and mocked web storage. This temporary harness is NOT shipped; the original `qa/harness.py` is restored in the checkpoint ZIP.
- Suites that explicitly call `page.reload()` (`t_commit.py`, later part of `t_regress.py`, and potentially reload branches in long fuzz) cannot fully exercise browser navigation under the `set_content` compatibility harness. Assertions reached before reload passed; H3 save/reload/idempotence is independently covered by the H3 focused suites and `t_3a7.py`.
- `t_creator.py` directly hard-codes its own `file:///home/claude/proj/index.html` navigation and is therefore blocked by this environment before assertions. No creator code was changed by H3.
- These environment limitations were documented rather than weakening tests or changing unrelated gameplay.

### Pass / Fail Summary

- H3 focused correctness: **51 / 51 passed**.
- Required H3 migration/save-reload assertions: passed in focused suites and Phase 3A idempotence regression.
- HOTFIX-P1 P1/P1.2/P1.3 regression: passed under compatibility harness with shipped CSS injected.
- Phase 3A, H2, 2A Health, 2B Family core coverage: passed except the one documented pre-existing H3.0-baseline stochastic grandparent assertion.
- Fuzz: six representative life stages, 840 random steps, no reported invariant/JS failure.
- No test was weakened to obtain a pass.

### Known Limitations / Out-of-Scope Findings

- `t_family.py`'s stochastic expectation that some newly generated families have a co-resident grandparent reports `0/30`; the exact same result reproduces on the untouched H3.0 checkpoint under the same QA harness, so this is pre-existing/non-H3 and was not scope-crept into H3.
- Some legacy browser-navigation tests cannot complete in this execution environment because file/localhost navigation is blocked. Their limitation is infrastructural, not an H3 gameplay assertion failure.
- Future romance/dating expansion remains Phase 3B and was not implemented.

### Exact Resume Point

H3 is COMPLETE.

Resume from the next authorized phase only: **Phase 3B — Romance, Dating & Reciprocal Social Life**.

STOP. Do not automatically begin Phase 3B.
