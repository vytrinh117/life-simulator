# PHASE 6B — Prom Night Experience

**Checkpoint policy:** One checkpoint per execution. Phase 6B.1–6B.7 COMPLETE and verified. Phase 6C NOT started.

## Tracker

- [x] **6B.1** — Recovery / Prom Night Foundation / Attendance (2026-10-08)
- [x] **6B.2 — Getting Ready / Outfit / Makeup / Family Help (2026-10-08)**
- [x] **6B.3 — Arrival / Social Encounters / Date Dynamics (2026-10-08)**
- [x] 6B.4 — Dancing / Activities / Interactive Moments
- [x] 6B.5 — Prom Court Ceremony / Awards / Photos
- [x] 6B.6 — After-Prom / Relationships / UI
- [x] 6B.7 — Migration / Regression / Fuzz / Release

**Last verified checkpoint:** 6B.7. **Current checkpoint:** STOP. **Next resume point:** Phase 6C only when explicitly requested.

## Preflight / authoritative recovery

- Started from `life-sim-PHASE6A7-complete.zip` supplied in the Simulator Game project. Inspected its `PHASE_6A_PROGRESS.md`, `BUILD.md`, `src/`, generated `game.js`, `data.js`, `index.html`, Prom/People/Calendar/School/NPC/Inventory/romance modules, and QA harness. Reviewed historical phase progress and relevant project conversation requirements. Source, not prior chat, is proof of implemented features.
- `PHASE_6A_PROGRESS.md` confirms **6A.1–6A.7 COMPLETE** with 504/504 accepted assertions, including Prom Court ballot results and 300-operation regional fuzz. Existing RSVP and registration preserve save/reload. This checkpoint preserves those Phase 6A records.
- Existing source contracts: `S.school.prom`, `foundation6A1.eventId`, `promIdentity6A1`, `promRegistered6A1`, `date6A3`/`partnerId`, `court6A4`, `promCourtSchoolPeer6A4`, `S.calendar` (`type:'prom'`, 19:00–23:00, 20:30 admission cutoff), `schoolDay4C1` location, `S.npcs`, `S.people`, canonical clock, `setCalendarStatus` and `processCalendar`. Existing `attendProm` previously launched the entire legacy scene and fabricated Prom interactions, so 6B.1 replaces its entry path without adding those later scenes.

## Implementation — 6B.1 ONLY

1. Added event-scoped `S.school.prom.night6B1` record (`schemaVersion`, same 6A event ID, enrolled school, academic year, grade, date, school-approved venue, calendar time window, status, actual entrance/departure timestamps, real attendee NPC IDs and companion reference). No parallel Calendar, People or romance engine.
2. Explicit `promNightEntryGate6B1` enforces current enrollment/grade/school/cohort, Phase 6A registration/attendance intent, existing ticket or waiver, date/start/cutoff, valid home or current-school location, travel time, calendar conflicts, and terminal-status/duplicate-entry guards. Both backend `attendProm` and actual rendered entry buttons use the same gate.
3. Entry moves the player to the authorized school at the existing approved Hall (school campus context), advances the canonical clock by 20 minutes when traveling from Home, and marks the existing Prom Calendar event `Attending`. For Prom only, the regular campus-after-hours normalization allows legitimate Hall admission; all other school travel checks remain unchanged. Existing School `Go Home` action exits active Prom instead of sidestepping its lifecycle.
4. The roster derives from **existing enrolled same-cohort NPC IDs**, excludes absent/unavailable/moved pupils, includes documented accepted companions only if verifiably enrolled/available, and chooses other pupils using an event-and-NPC stable hash. It creates zero unrelated permanent NPCs, and merely going with a date does not generate romance or automatic partner attendance.
5. `scheduled` → `preparation_available` → `entry_open` → `attending` → `completed`; missed/declined attendance becomes `missed`/`cancelled` after cutoff. Calendar statuses are synchronized. Exiting or reaching 23:00 completes verified physical attendance once and returns player Home. No repeat entry, repeated completion or post-expiry check-in. Direct premature missed-event resolution is denied.
6. The old single-click scene runner is gated off for Prom in this checkpoint; no dance, photos, awards, romances or fictional memory records occur on entry. The existing 6A Court ballots/results, companions, People, Inventory and prior milestones are preserved, and future 6B stages may extend the saved event-scoped night record.
7. Idempotent conservative migration/reconcile does not backfill `night6B1` into old `Done`/`Skipped` Prom saves. On school transfer, the existing Phase 6A archive now carries only the actually recorded night state; no historical attendance is invented.
8. One small live status/entry/exit panel is added within the existing Education and Home Prom panel, with no new top-level navigation. It uses existing UI patterns.

## Actual source/build/test changes

- **Added:** `src/modules/promnight6b1.js`, `qa/t_6b1.py`, `PHASE_6B_PROGRESS.md`.
- **Modified authoritative code:** `src/modules/prom72.js`, `src/modules/promseason6a1.js`, `src/modules/core72.js`, `src/modules/schoolday4c1.js`, `src/modules/romance72.js`, `src/modules/promui6a6.js`, `tools/splice.py`.
- **Regenerated from BUILD.md only:** root `game.js`, `style.css`.
- **Documentation:** `CHANGELOG.md`, `MIGRATION_NOTES.md`, `QC_REPORT.md`, `README.md`.
- **Preserved:** `data.js`, `index.html`, Phase 6A and all older progress trackers, `.github/workflows/pages.yml`, `.nojekyll`, existing asset hierarchy.

## Actually executed QA

- New focused Chromium test `qa/t_6b1.py`: **39/39 PASS** on final source (`qa_6b1_focused.log`): event identity, age/grade, registration, venue, windows, ticket, calendar conflict, travel, location, actual Education enter and Home leave clicks, NPC roster, duplicate protection, save/reload, migration, Court preservation, missed/skip handling, automatic closure and browser exceptions.
- Accepted previous-phase regressions, completed before the final two narrow guards: `qa/t_6a7.py` 45/45; `qa/t_6a7_fuzz.py` 17/17 (300 seeded actions); `qa/t_6a6.py` 39/39; `qa/t_6a5.py` 51/51; `qa/t_6a5_rival.py` 20/20; `qa/t_6a4.py` 54/54; `qa/t_6a3.py` 60/60; `qa/t_6a2.py` 50/50; `qa/t_6a1.py` 43/43; `qa/t_5d7.py` 44/44 (300 finance fuzz operations); `qa/t_4d5_accept.py` 23/23; `qa/t_4b5_accept.py` 23/23; `qa/t_5c55_release.py` 24/24. 6B focused + completed selected prior suites: **532/532** accepted assertions. Their files are `qa_6b1_reg_*.log`.
- After final guards, reran `qa/t_6b1.py` 39/39, `qa/t_6a7.py` 45/45, `qa/t_6a6.py` 39/39, `qa/t_6a7_fuzz.py` 17/17 and `qa/t_5c55_release.py` 24/24, all PASS (`qa_6b1_final_*.log`). The earlier complete regressions were on the same implementation before those two narrow safety guards, not represented as rerun after the final guard edits.
- A combined regression command was interrupted by execution timeout during 6A.3 (29 assertions at that time); the later complete standalone 6A.3 rerun passed 60/60. The earlier 6A.7 static-deploy command was interrupted after five successful HTTP/structure checks; it is **not** claimed as 11/11 or live remote deployment.

## Reproducible build verification

Followed `BUILD.md` twice: `python3 tools/splice.py`, `cp src/style_before_theme.css style.css && python3 tools/theme.py`, `node --check game.js`. Both SHA-256 manifests (`qa_6b1_build_pass1.sha256`, `qa_6b1_build_pass2.sha256`) are identical:

- `game.js`: `81390d511db7b6704251de54966fb69de8da685ea8cfa0244b378f5a56b6d1ab`
- `style.css`: `b2a439321aefa311b2a35a2f792ecc84eccdee18b5dc5edd20603c55f8af9461`
- `data.js`: `2f93e17b19d272f78a1d5c76b1becc0b2db33dfd3a4bc47064153ab07f2d3bca`

Syntax `node --check game.js`: PASS. GitHub Pages static project files retained. No actual GitHub Pages remote deployment tested.

## Known limits / 6B.2 handoff

- This is only entry/attendance/roster infrastructure. Legacy Prom outfit/prep user interface remains from earlier gameplay but is NOT the Phase 6B.2 inventory-enforced outfit/makeup system; 6B.2 should replace/validate that compatibility path. The old generic Prom scene is intentionally inaccessible until incremental 6B.3–6B.6 handlers are implemented; no automatic award/romance/movie/photo history.
- NPC attendance is based on already existing eligible NPC state and stable hashes, not a separate RSVP registry for every school student. Accepted companion records without a verifiable same-school NPC stay `unverified`; 6B.3 can expand legitimate attendance confirmation/no-show causes without inventing actors.
- The `20 minute` Home-to-Hall admission represents the **initial foundation** school-event transport hook. 6B.3 should adopt the established player commute/transport choices, permission and timing if those are applicable to Prom, without reintroducing ordinary daytime campus gates.
- Current school-night check-in is a specific exception to closed campus after hours; leaving Prom early currently returns Home immediately (detailed post-prom transport/family rules belong to 6B.6).
- Prom Night awards, interactive activities, photos, relationships and occasions are not 6B.1. No remote GitHub Pages publication verification.

**6B.1 COMPLETE — Ready to resume from 6B.2. STOP.**


---

## Checkpoint 6B.2 — Getting Ready / Outfit / Makeup / Family Help (COMPLETE)

**Starting authority:** `life-sim-PHASE6B1-complete.zip` with `PHASE_6B_PROGRESS.md` confirming 6B.1 COMPLETE and Phase 6A COMPLETE. Read `BUILD.md`, preceding progress files, authoritative `src/`, `data.js`, `index.html`, Inventory, People/family, Prom, Calendar and Playwright QA. No Phase 6B.3 or later scenes developed.

### Actual source changes

- **New:** `src/modules/promprep6b2.js`, `qa/t_6b2.py`.
- **Modified:** `data.js` (formal dress/suit as genuine Store/Inventory wearables), `src/modules/prom72.js` (retire unsupported instant-purchase/borrow/hair/makeup UI; route preparation clicks), `src/modules/promnight6b1.js` (Prom Night prep panel), `src/style_before_theme.css` (responsive theme-token styles), `tools/splice.py` (module and QA harness wiring).
- **Regenerated only by documented pipeline:** `game.js`, `style.css`.
- **Documentation:** `PHASE_6B_PROGRESS.md`, `CHANGELOG.md`, `MIGRATION_NOTES.md`, `QC_REPORT.md`, `README.md`.
- **Preserved:** canonical `S.school.prom.night6B1` and Phase 6A event ID, Calendar, Court ballots/results, invitations, People, H3, existing Inventory/Store, `index.html`, GitHub Pages files, all earlier checkpoints.

### Implementation

1. **Actual Inventory outfit:** A player may choose an already-owned usable clothing item (including new Store formal dress or suit). Selection persists its stable inventory item ID, equips the real item, gives bounded suitability, costs 12 canonical minutes, and allows legitimate outfit changes. Invalid/removed/unequipped clothing is reflected in the current outfit summary. There is no phantom paid outfit or invented borrowed garment.
2. **Store-backed formalwear:** `promDress` ($95) and `promSuit` ($110) use the existing `D.catalog` purchasing, permission, inventory, equipment, and wear systems. No parallel Store or outfit registry.
3. **Day-of independent makeup:** Only on Prom day, at Home, for age 13+, with an owned non-stored makeup set containing at least 3.3% finite supplies. The existing opened item and remaining supplies are modified exactly once, and 25 canonical minutes pass. No free kit creation, unearned reward, or repeated application.
4. **Family help:** Existing mother, eligible older sister, or aunt with verified household residence/availability may assist for 30 minutes. The actual `personId`, acceptance/refusal and quality are stored. Recorded helper ability is used if available; otherwise a restrained fallback, without inventing a new skill. An absent, away, too-young or previously declining helper cannot help. No borrowed cosmetics are added to player Inventory.
5. **Hair:** One at-home Prom-day hairstyle (20 minutes) with bounded quality, no fabricated salon purchase.
6. **Event authority:** Preparation lives only inside `night6B1.gettingReady6B2` for the exact Phase 6A Prom ID. Home, event window, registration, eligible school/grade, terminal status, event calendar and time budget guard all actions. The UI extends existing Home/Education Prom panel, uses current style tokens, and does not start the Prom Night scene or generate photos/awards/dances/romance.
7. **Migration:** Lazy creation on deliberate action, never inferred from old `pr.prep` fields or completed historic Proms. Save/reload, transfer archiving through existing `night6B1` snapshot, and repeated reconcile preserve actual records without fabricating activities.

### QA executed

- `qa/t_6b2.py`: **54/54 PASS** final browser checks including real outfit/helper button clicks, genuine Store wallet debit, consumable makeup, refusals, age, household restrictions, school identity, no double use, time, save/reload, Court integrity and zero browser errors (`qa_6b2_focused_final.log`). First fixture/test setup pass was 48/50; corrected test assumptions and re-executed to 54/54 without relaxing real eligibility checks.
- Regression `qa/t_6b1.py` **39/39**, `qa/t_6a7.py` **45/45**, `qa/t_6a7_fuzz.py` **17/17** (300 seeded Prom actions), `qa/t_6a6.py` **39/39**, `qa/t_6a5.py` **51/51**, `qa/t_6a4.py` **54/54**, `qa/t_6a3.py` **60/60**, `qa/t_6a2.py` **50/50**, `qa/t_5d7.py` **44/44** (300 finance fuzz operations), `qa/t_5c55_release.py` **24/24**. **477/477 distinct completed accepted checks** across these selected suites. Logs `qa_6b2_reg_*.log`. A wrapper batch command timed out after the already-completed 5D.7 suite; its standalone log contains `44/44 PASS`; never count the unfinished wrapper as another pass.
- `node --check game.js`: PASS. `BUILD.md` clean build run twice: `game.js`, `style.css`, and `data.js` byte-identical; `qa_6b2_build_pass1.sha256` matches `qa_6b2_build_pass2.sha256`.
  - `game.js`: `57d9cb7746146b79025aeb4ab587167c829739a785ea08283bae36501428649a`
  - `style.css`: `78296f49dbc0d667acfdc26760769aac5b232b78ffad6b75e649e07f44f1d275`
  - `data.js`: `1640e4ac438c2895144cd723f855d50bd387b432b71fe86e83ddabebc5f2f6f3`

### Known limits and handoff

- Clothing and makeup *readiness quality* is recorded but not applied to dialogue, encounters, attractiveness, romance or Court results yet. That belongs to 6B.3+; no votes/results are altered.
- Formalwear is bought through the **existing Store**, not a new Prom store. Ordinary clothing remains usable with lower suitability. Makeup is optional, and family helper must actually be eligible and co-resident (remote visits need later schedule/permission support).
- Legacy instant outfit borrowing, phantom outfit purchase and unsupported hairstyle salon shortcuts are removed/disabled, rather than inventing items or charges.
- No Prom Night arrival scenes, interactions, dancing, ceremony, photos or post-Prom story; no remote GitHub Pages deployment attempted.
- **Exact next resume:** 6B.3 — Arrival / Venue / Social Encounters / Date Dynamics, only on explicit request. Do not begin 6B.3 automatically.

**6B.2 COMPLETE — Ready to resume from 6B.3. STOP.**


---

## Checkpoint 6B.3 — Arrival / Venue / Social Encounters / Date Dynamics (COMPLETE)

**Authority and scope:** Started from the uploaded `life-sim-PHASE6B2-complete.zip`, checked `PHASE_6B_PROGRESS.md`, `BUILD.md`, prior Phase 6A acceptance and source modules. Existing `S.school.prom.foundation6A1.eventId`, `S.school.prom.night6B1`, `S.calendar`, `S.npcs`, `S.people` and `date6A3.partnerId` remain authoritative. Only 6B.3 developed; 6B.4–6B.7 and Phase 6C untouched.

### Actual source and build changes

- Added `src/modules/promarrival6b3.js`: the event-scoped `night6B1.arrivals6B3` arrival snapshot (schema 1), real same-school pupil roster, confirmed-companion status, factual absence/late schedule, idempotent arrival reconciliation, direct-backend greeting gates, one-time introductions and factual People provenance.
- Changed `src/modules/promnight6b1.js`: initializes 6B.3 only after valid 6B.1 check-in; conservatively upgrades a genuinely attending legacy 6B.1 record on reconcile, never historical missed/completed Prom; exposes arrival panel inside existing Education/Home Prom card.
- Changed `src/modules/prom72.js`: routes actual greeting buttons through the existing central Prom click handler.
- Changed `src/style_before_theme.css`: responsive, design-token-only school-hall roster and button layout.
- Changed `tools/splice.py`: builds the 6B.3 authoritative module and exposes focused QA functions to the current test harness.
- Added `qa/t_6b3.py`, QA evidence and release notes. Rebuilt root `game.js`/`style.css` **only via BUILD.md**. `data.js`, `index.html`, all 6A ballots, family, shop/inventory, relationship systems and GitHub Pages files are preserved.

### Verified behavior

1. Only real check-in at the exact existing Phase 6A approved School Hall can instantiate `arrivals6B3`. Attendance and check-in windows, registered intent, required ticket, school and calendar authority remain enforced by 6B.1. No separate event, calendar, People directory, ticket, or travel engine was created.
2. Actual `attendeeIds` reference only currently eligible, enrolled NPC IDs. Existing specific absence/unavailability facts exclude attendees; explicit NPC `promArrivalMinute` may establish a later expected arrival. No randomly fabricated date no-shows, people or off-campus venues. Original roster is snapped to save, not regenerated on UI rerender.
3. The accepted companion is only classified **present** after actual roster presence, **expected later** when a verified schedule says so, **no-show** when there is a recorded school/family conflict or unavailability, **unverified** without a linked eligible school NPC, or **none** when going alone. A no-show does not erase the original consent or imply a breakup.
4. The player can deliberately greet a real present student via the existing Prom panel; a genuinely new student is added exactly once through the existing People/NPC creation flow, with actual School Hall/Prom event provenance. Existing acquaintances are reused and retain historical first-meeting provenance. Each NPC can be greeted once per Prom, consumes five canonical minutes, and gains at most +1 friendship. No dances, kisses, relationship promotion, photos, award outcome, nominations or ballots are generated or rerolled.
5. A real owned/prepared outfit can influence an **arrival description or greeting flavor only**, not win a Court election or force approval/attraction. Night snapshot, greeting IDs and time survive save/reload and school-year archiving; old active check-ins are upgraded only from real attendance records, never by inventing historical encounters.
6. Existing 6B.1 Home → School Hall 20-minute admission remains the supported travel foundation; adding detailed transport selection is deferred rather than inventing a second transport system. After-Prom travel and safe after-event alternatives belong to 6B.6.

### Executed focused QA and selected regressions

| Test | Verified result |
|---|---|
| `qa/t_6b3.py` | **47/47 PASS** (`qa_6b3_focused_final.log`) |
| `qa/t_6b2.py` | **54/54 PASS** (rerun on final source) |
| `qa/t_6b1.py` | **39/39 PASS** (rerun on final source) |
| `qa/t_6a7.py` + `qa/t_6a7_fuzz.py` | **45/45 + 17/17 PASS**, 300 regional fuzz operations |
| `qa/t_6a6.py`, `qa/t_6a5.py`, `qa/t_6a4.py` | **39/39, 51/51, 54/54 PASS** |
| `qa/t_6a3.py`, `qa/t_6a2.py`, `qa/t_6a1.py` | **60/60, 50/50, 43/43 PASS** |
| `qa/t_5d7.py`, `qa/t_5c55_release.py` | **44/44, 24/24 PASS**; 300 existing finance fuzz operations |

**Total distinct completed passing checks: 567/567 across 13 selected suites.** A separate optional historical `qa/t_6a5_rival.py` run failed/stalled because its randomized fixture did not nominate the player, so its button was absent; a QA-only attempt to stabilize that old fixture also encountered an undersized opponent shortlist. These **failed runs are not counted as passes**, their `qa_6b3_reg_t_6a5_rival*.log` records are retained, and the upstream test file was restored unchanged. The standard Phase 6A.5 focused suite passed 51/51. This older rival-fixture issue remains for future QA stabilization.

### Build, hashes and release

- `python3 tools/splice.py`, `cp src/style_before_theme.css style.css && python3 tools/theme.py`, `node --check game.js`, `node --check data.js`: PASS.
- Two complete clean builds identical (`qa_6b3_build_pass1.sha256` == `qa_6b3_build_pass2.sha256`):
  - `game.js`: `af2e10b2ceefaa3a422f346ec993e1671801395011f60a29629a4b0a707016c1`
  - `style.css`: `7e720f0a5de60fde03e678d690788aa413c7f4566d033eaed7f84fa04bc6ddf6`
  - `data.js`: `1640e4ac438c2895144cd723f855d50bd387b432b71fe86e83ddabebc5f2f6f3`
- GitHub Pages `.github/workflows/pages.yml` and `.nojekyll` retained; live remote deployment **not performed**.
- Expected ZIP: `life-sim-PHASE6B3-complete.zip`. Detailed dance, activities, Court ceremony, photographs, after-Prom rewards and relationship consequences remain **unimplemented**.

**6B.3 COMPLETE — Ready to resume from 6B.4. STOP.**

---

## Checkpoint 6B.4 — Dancing / Activities / Interactive Prom Moments (COMPLETE)

**Starting authority:** `life-sim-PHASE6B3-complete.zip` and its verified Phase 6B progress. Phase 6A and Phase 6B.1–6B.3 remained intact. 6B.5–6B.7 and Phase 6C were not started.

### Source changes and architecture

- **New:** `src/modules/prommoments6b4.js`, `qa/t_6b4.py`.
- **Modified authoritative source:** `src/modules/promnight6b1.js` (embedded activity panel only during actual Hall attendance); `src/modules/prom72.js` (central Prom click routing); `src/style_before_theme.css` (responsive token-based activity panel); `tools/splice.py` (module build and QA-only test functions).
- **Regenerated via `BUILD.md`:** `game.js`, `style.css`. **Unchanged:** `data.js`, `index.html`, `.github/workflows/pages.yml`, `.nojekyll`, Phase 6A ballots, Phase 6B.1–6B.3 data schema, existing People/romance/Inventory/Calendar systems.
- Documentation: `PHASE_6B_PROGRESS.md`, `CHANGELOG.md`, `MIGRATION_NOTES.md`, `QC_REPORT.md`, `README.md`.

### Implemented behavior

1. Saved `S.school.prom.night6B1.moments6B4` ledger (schema 1), keyed by **exact existing 6A eventId, schoolId and approved venue**. Created only during real B1 check-in/B3 arrival; its activity list starts empty, including for legitimately attending older B1–B3 saves. No fabricated past dance, photo, first kiss, romance, Court victory or global milestone.
2. Activities: solo dancing (15 min, at most 2), ask a greeted real attendee to dance (15 min, at most one request/student), schoolmate conversation (10 min, at most one/person), rest (10 min, at most 2), school-supplied water/snack (8 min, at most 2), and small school-hall moments (12 min, at most 2). All times use canonical `advanceTime` and existing needs meters; contextual changes are bounded using `clamp`.
3. **NPC autonomy:** people must genuinely be present and have been greeted before a dance/conversation; dance requests return an event-stable acceptance or respectful refusal influenced by existing `People.rel`, `People.trust`, real NPC traits, and present-companion status. Explicit NPC refusal/absence overrides closeness. Every attempted dance, including a decline, is recorded and cannot be repeatedly farmed. No implied romance consent, automatic love status, new NPCs or vote rerolls.
4. Successful dances/conversations make small bounded relationship changes and only factual `People.history` entries. Solo dancing/refreshments and ambient moments do not invent interaction partners. The 6A Court and `S.milestones` are untouched.
5. Direct backend and rendered buttons use `promArrivalGate6B3`: exact active event, School Hall location and current school, time before 23:00, actual roster, attendance recorded and current calendar status. Completed/missed/transferred/remote Prom actions are rejected. An explicit anti-farming ledger survives save/reload and school-year archival.
6. Activity panel lives in existing Prom School/Home contexts, not a second route or minigame; buttons disabled when unavailable. Style uses the existing CSS theme tokens and responsive layout.

### QA executed

- `qa/t_6b4.py`: **54/54 PASS** (`qa_6b4_focused_final.log`). Real UI clicks, solo and paired dancing, a positive consenting NPC, an explicit refusal, repeat protection, conversation, needs/time, exhausted limits, event/venue gates, school-matched roster, unchanged Court/romance milestones, conservative active-record migration, completed/missed guards, real save/reload, idempotence, no browser exceptions.
- Selected completed regressions (`qa_6b4_reg_master.log`): `t_6b3` 47/47, `t_6b2` 54/54, `t_6b1` 39/39, `t_6a7` 45/45, `t_6a7_fuzz` 17/17 (300 deterministic regional actions), `t_6a6` 39/39, `t_6a5` 51/51, `t_6a4` 54/54, `t_6a3` 60/60, `t_6a2` 50/50, `t_6a1` 43/43, `t_5d7` 44/44 (300 finance fuzz actions), `t_5c55_release` 24/24. **567/567 selected regression checks passed**, 13 suites. Total **621/621** focused and selected checks accepted. The historical optional `t_6a5_rival.py` randomized fixture remains a known earlier source of instability and was not represented as run/passing for 6B.4.
- The initial 6B.4 acceptance run had 2 failed fixture assertions that assumed an empty activity ledger was absent; empty activity ledger is created during genuine check-in and is intentional. An additional seeded positive-consent QA fixture initially had too few attending schoolmates. Tests were corrected by marking *existing enrolled school NPCs* as attendees in that fixture, without changing gameplay or creating fictional people. Final full run 54/54 PASS; preceding logs retained.

### Reproducible clean build verification

Documented commands `python3 tools/splice.py`, `cp src/style_before_theme.css style.css && python3 tools/theme.py`, `node --check game.js`, `node --check data.js`. Two complete clean builds and SHA-256 manifests are byte-identical (`qa_6b4_build_pass1.sha256`, `qa_6b4_build_pass2.sha256`):

- `game.js` — `8b3fc45a32b5498ff7ecaa08a50ffec05a9e5fc8a9d0fe4f08f187a7b3fbbe3d`
- `style.css` — `f5c5fe2ff4cec074a4bc12bdb8f35ba0ac686804d1c4bc8b19b9a6c374bb34ce`
- `data.js` — `1640e4ac438c2895144cd723f855d50bd387b432b71fe86e83ddabebc5f2f6f3`

**Known limits:** Court ceremony and photos are intentionally not executed in 6B.4. After-Prom outings, final family/relationship outcomes and complete 6B release fuzz belong to 6B.5–6B.7. School refreshments are modest event-provided water/snacks, not Shop inventory transactions; no new inventory system. Remote GitHub Pages deployment not attempted. Detailed transportation mode remains deferred as in 6B.3.

**Last verified checkpoint:** 6B.4. **Current checkpoint:** STOP. **Exact next resume:** 6B.5 — Prom Court Ceremony / Awards / Photos, only on explicit request.

**6B.4 COMPLETE — Ready to resume from 6B.5. STOP.**


---

## Checkpoint 6B.5 — Prom Court Ceremony / Awards / Photos (COMPLETE; 2026-10-08)

**Starting authority:** `life-sim-PHASE6B4-complete.zip`, supplied `PHASE_6B_PROGRESS.md`, and current authoritative `src/`, `BUILD.md`, `PHASE_6A_PROGRESS.md`. Prior 6A final release confirmed. No 6B.6/6B.7 implementation.

### Actual code and architecture

- **New authoritative module:** `src/modules/promceremony6b5.js`; **new live-browser acceptance:** `qa/t_6b5.py`; new QA logs and reproducible-build manifests in `qa/results_6b5/`.
- **Modified:** `src/modules/promnight6b1.js` (in-Hall School/Home ceremony/photo panel), `src/modules/prom72.js` (central click routing), `src/style_before_theme.css` (responsive styling with existing theme variables), `tools/splice.py` (authoritative module assembly and focused-test callable hooks).
- **Generated only by `BUILD.md`:** `game.js`, `style.css`. **Unchanged:** `data.js`, `index.html`, `.github/workflows/pages.yml`, `.nojekyll`, canonical Court/Calendar/People/NPC/romance/Inventory source modules.
- **Documentation:** `PHASE_6B_PROGRESS.md`, `CHANGELOG.md`, `MIGRATION_NOTES.md`, `QC_REPORT.md`, `README.md`.

### Verified gameplay behavior

1. A minimal `night6B1.ceremony6B5` schema-1 ledger is created **only during verified live Hall attendance**, keyed by the **exact Phase 6A event ID, existing school ID and venue**. It begins with no ceremony, photos, award or photograph milestones; old missed/completed saves are not backfilled.
2. A **school ceremony at 21:00** is an explicit, 20-minute action, only during live checked-in Prom before the canonical 23:00 close. The ceremony is once per event, retains a factual event-specific presentation record, and uses `promCourtRecord6A4(pr).results.winners` **only when the preexisting Phase 6A ballot is locked**. It never calls `promCourtTally6A4`, casts votes, edits results or rerolls winners. Attendance alone never awards a crown. If a winning NPC is not at the venue, the presentation records the absence rather than fabricating an in-person award receipt.
3. A player Court award and single global award milestone are recorded **only when the actual ceremony occurred and a persisted Phase 6A winner ID equals `player`**. Losing players applaud. No parallel awards system, prestige farming or other unsupported awards.
4. **Solo, paired and group photographs** require an active approved Hall check-in, sufficient canonical minutes, and real present eligible NPC IDs. Paired/group attendees must be real existing acquainted students with actual Hall greetings or an acknowledged present companion. No background NPCs are spawned. Each photograph records date/minute/event/school/venue/NPC and Person IDs; actual People photo memories use the established `rememberPerson` mechanism.
5. Photographs consume 8/10/12 minutes (solo/paired/group), max four per Prom, and each composition can be taken once; one milestone on the **first actually taken photograph only**, no repeat-photo global milestone spam. Records are saved under the existing Prom Night object so `archiveProm6A1` already copies them into history.
6. Direct backend and actual School/Home buttons share the same `promArrivalGate6B3`, school/venue/Calendar checks, and event-specific anti-replay ledger. No automatic kissing, romance, partner attendance, invented purchases, dancing or post-Prom outcomes. Existing 6B.1–6B.4 save state remains untouched.

### Executed QA (real Chromium; final authoritative generated build)

- `qa/t_6b5.py`: **45/45 PASS**, including ceremony/photo button clicks, 6A event identity, early/late/away/absent gating, real participant IDs, consent-free factual photos, Court ballot non-mutation, sealed winner projection, real player-win milestone and losing outcome, time costs, photo duplicate rules, real save/reload, idempotent reconciliation, after-exit blocking, missed-event conservative migration and no browser exceptions.
- Selected regression complete passing runs: `t_6b4.py` **54/54**; `t_6b3.py` **47/47**; `t_6b2.py` **54/54**; `t_6b1.py` **39/39**; `t_6a7.py` **45/45**; `t_6a7_fuzz.py` **17/17** (300 seeded actions); `t_6a6.py` **39/39**; `t_6a5.py` **51/51**; `t_6a4.py` **54/54 on unchanged rerun**; `t_6a3.py` **60/60**; `t_6a2.py` **50/50**; `t_6a1.py` **43/43 on unchanged rerun**; `t_5d7.py` **44/44** (300 finance fuzz operations); `t_5c55_release.py` **24/24**. **666/666 distinct accepted focused + selected regression checks; 15 suites**. Each counted suite has a completed passing log.
- Earlier *nonpassing* attempts: first `t_6a4.py` fixture generated an undersized king category and ended with `IndexError`; first `t_6a1.py` fixture projected a next-year Prom outside its valid school calendar and ended in `TypeError`. Both unchanged suites subsequently had complete passing runs. Both original failing logs retained; **not** counted as passes. Initial new `t_6b5.py` attempt found a missing group-photo control due to fixture setup; follow-up complete 45/45 run passed. No automatic `t_6a5_rival.py` pass claimed.

### Reproducible build

`python3 tools/splice.py`; `cp src/style_before_theme.css style.css && python3 tools/theme.py`; `node --check game.js`; `node --check data.js`; repeated twice with identical hashes (`qa/results_6b5/build_pass1.sha256`, `build_pass2.sha256`):

- `game.js`: `08fad34b881099b0e6acf4beeecfda2594f264069e700089f129646f0c51eb2b`
- `style.css`: `191b6419e0de2f7ef5d66526eeb1c800ae1cb4084edc98cd4196a45a3b5130ba`
- `data.js`: `1640e4ac438c2895144cd723f855d50bd387b432b71fe86e83ddabebc5f2f6f3`

**Known limitations:** This is a saved **in-game photo ledger**, not rendered bitmap/photo capture; no generic global photo album existed in the source. Full post-Prom farewells/relationship outcomes/afterparty belong to 6B.6. Comprehensive 6B fuzz and final Phase 6B sign-off belong to 6B.7. No remote GitHub Pages deployment was attempted.

**Last verified checkpoint: 6B.5. Current checkpoint: STOP. Resume exactly at 6B.6.**

**6B.5 COMPLETE — Ready to resume from 6B.6. STOP.**


---

## Checkpoint 6B.6 — After-Prom / Relationship Outcomes / UI (COMPLETE; 2026-10-08)

**Authoritative recovery:** Started from `life-sim-PHASE6B5-complete.zip` plus `PHASE_6B_PROGRESS.md`. Checked `BUILD.md` and the actual `src/` modules for 6A Court, 6B.1 attendance, 6B.2 inventory preparation, 6B.3 arrival, 6B.4 activities, 6B.5 ceremony/photos, existing Family/People/curfew/Calendar, and test harness. All 6B.1–6B.5 verified changes retained. No 6B.7 or 6C implementation.

### Source changes

- **Added:** `src/modules/promafter6b6.js` (event-scoped one-time goodbye/checkout/home debrief ledger); `qa/t_6b6.py` (40 focused live-Chromium checks); `qa/results_6b6/` (regression logs, initial failures/reruns, build hashes).
- **Modified authoritative modules:** `src/modules/promnight6b1.js` (one-time factual checkout hook, canonical return-home transit, completed-event post-Prom card); `src/modules/promui6a6.js` (show short-lived Home recap after the old season UI goes terminal); `src/modules/prom72.js` (live button routing); `src/style_before_theme.css` (responsive existing-theme UI); `tools/splice.py` (build registration and QA-call hooks).
- **Regenerated exclusively with BUILD.md:** `game.js`, `style.css`. The old source/base and `data.js` remain intact. `index.html`, `.github/workflows/pages.yml`, and `.nojekyll` retained.
- **Documentation:** this tracker, `CHANGELOG.md`, `MIGRATION_NOTES.md`, `QC_REPORT.md`, `README.md`.

### Implemented gameplay and boundaries

1. `S.school.prom.night6B1.after6B6` is strictly bound to the **existing** 6A event ID, school ID, approved School Hall venue, and real 6B.1 physical attendance. Created only during actual active check-in/checkout, never on a missed/completed legacy save or merely by viewing an expired calendar event.
2. At the School Hall, the player may say goodbye once to each verified present and already greeted classmate (or confirmed present companion). One action costs five canonical minutes, records real existing NPC/Person IDs and a factual People memory, with a bounded +1 friendship only for existing sufficiently positive ties. No first kiss, date, award, group member or invented romance inferred.
3. Existing `leavePromNight6B1` and the actual `Leave Prom / Go Home` and School `Go Home` routes share one finalization hook. The existing Calendar becomes `Attended` and attendance becomes `completed` once. It snapshots only actual greetings, activity list, photos, ceremony attendance, companion presence and goodbye IDs. Returning Home consumes 20 canonical travel minutes; no parallel transport system or fake after-party.
4. Real school-approved Prom end-time plus travel has a sensible curfew allowance. An exceptional overrun (if possible through the real calendar) gives at most one mild family-concern outcome linked to a **real in-household caregiver**, never a generic punitive reward/punishment or duplicated note. No bonus for merely appearing at Prom.
5. After a verified visit, the short-lived existing Home Prom card allows exactly one optional 10-minute reflection or (if actually resident, awake and available) a conversation with a real household caregiver. Conversation can increase family closeness by just one. Independent households, sleeping/absent caregivers and expired windows cannot fabricate a family conversation. No unsupported after-party or NPC travel.
6. One lifetime first-Prom milestone can be recorded at checkout **only if a real greeting, school activity, photo, ceremony, or farewell occurred**, not for bare check-in. Saved People, Court ballot/result, registration, Inventory, RSVP, photographs and existing 6B.4/6B.5 ledgers remain authoritative and unchanged.
7. Reconciliation, rerender, save/reload, duplicate leave/response clicks and school-year archiving do not replay benefits. Old historical records are preserved without fabricated attendance or relationship memories.

### Actually executed QA

- `qa/t_6b6.py` — **40/40 PASS** on final Chromium build (`qa_6b6_focused.log`). Real School/Home clicks; attendee/People IDs; opt-in goodbye; venue and time costs; checkout, Calendar and travel; factual memory; family/quiet debrief; one-time gates; school eligibility; migration/no-fabrication; save/reload; no JS exceptions.
- Preceding regression completed PASS runs: `t_6b5.py` **45/45** (on unchanged rerun), `t_6b4.py` **54/54** (unchanged rerun), `t_6b3.py` **47/47**, `t_6b2.py` **54/54**, `t_6b1.py` **39/39**, `t_6a7.py` **45/45**, `t_6a7_fuzz.py` **17/17** (300 seeded regional operations), `t_6a6.py` **39/39**, `t_6a5.py` **51/51**, `t_6a4.py` **54/54**, `t_6a3.py` **60/60**, `t_6a2.py` **50/50**, `t_6a1.py` **43/43** (unchanged rerun), `t_5d7.py` **44/44** (300 financial fuzz operations), `t_5c55_release.py` **24/24**. Total **706/706 distinct accepted checks** across 16 suites.
- Honest failure log: first `t_6b5.py` result **43/45**, due to random peer/group-photo roster fixture; unchanged rerun **45/45**. First `t_6b4.py` **51/54**, due to random seeded positive dance partner not present; unchanged rerun **54/54**. First `t_6a1.py` **42/43**, due to randomized initial-registration fixture; unchanged rerun **43/43**. Combined 6A.2 shell command timed out after writing a completed **50/50 PASS** test log. Historical failed/timed-out runs were not counted. Earlier first 6B.6 implementation had a completed-card UI visibility issue; fixed in `promui6a6.js` before the **40/40** final run.
- QA evidence is in `qa/results_6b6/`, alongside earlier checkpoint QA. Optional randomized historical `t_6a5_rival.py` was not rerun; Phase 6B.7 remains responsible for broader fuzz and final release acceptance.

### Reproducible build

Ran `python3 tools/splice.py`, `cp src/style_before_theme.css style.css && python3 tools/theme.py`, `node --check game.js`, `node --check data.js` **twice**, with identical SHA-256 manifests (`qa/results_6b6/build_pass1.sha256`, `build_pass2.sha256`):

- `game.js` — `4e2d7a94d59eef8988627a2055339cc3fbf2c096acfa3eb409f836a7fbcd375f`
- `style.css` — `726c58f56893b39af8f9df787e372ec5b80771167cc566e3ac44ce51695e88f0`
- `data.js` — `1640e4ac438c2895144cd723f855d50bd387b432b71fe86e83ddabebc5f2f6f3`

**Known limitations:** 6B.7 randomized full-flow/release acceptance has not run, and remote GitHub Pages deployment has not been tested. The short-lived home debrief is not a new permanent social calendar event. Detailed transport-mode selection and optional external after-parties are deliberately deferred until supported by authoritative transport/guardian/occasion scheduling; the implementation does not fabricate unsupported plans.

**Last verified checkpoint:** 6B.6. **Current checkpoint:** STOP. **Exact resume point:** 6B.7 — Migration / Regression / Fuzz / Release, only on explicit request.

**6B.6 COMPLETE — Ready to resume from 6B.7. STOP.**


---

## Checkpoint 6B.7 — Final Acceptance / Migration / Regression / Fuzz / Release (COMPLETE; 2026-10-08)

**Authoritative input:** `life-sim-PHASE6B6-complete.zip`, the current `PHASE_6B_PROGRESS.md`, `BUILD.md`, existing `src/`, full Stage 6A history, calendar/People/Inventory/romance/guardian, canonical school state and the existing Playwright QA system. Verified 6B.1–6B.6 checkpoints before modifying any code. Phase 6C was **not** started.

### Actual edits and release repair

- **Fixed release-blocking historical-save crash** in authoritative `src/modules/promui6a6.js`: `promUiNoticeCleanup6A6(pr)` previously dereferenced `f.registrationStatus` when a legitimately completed **legacy Prom** lacked the Phase 6A foundation. Notification cleanup now guards absent Prom/foundation records. Old `Done`/`Skipped` memories are preserved; no fabricated attendance/registration is created. The unchanged historical `qa/t_6a1.py` now passes its previously crashing case (43/43).
- **Added** `src/modules/promqa6b7.js`: QA-only 6B full lifecycle deterministic fuzz runner; not a new gameplay system, permanent state, event/calendar or UI. Exposed through the preexisting `__LIFE_SIM_TEST__.call` map in `tools/splice.py`.
- **Added** `qa/t_6b7.py` (63 Chromium cross-stage acceptance checks), `qa/t_6b7_fuzz.py` (360 seeded production action opportunities in six school regions), `qa/t_6b7_static.py` (12 GitHub Pages/static contract checks) and `qa/results_6b7/` run logs and clean-build hashes.
- **Updated** directly editable `index.html` query-string asset versions to the actual final `game.js`, `style.css`, `data.js` SHA-256 prefixes, preventing stale browser-cache references after deployment. No structural/index redesign.
- **Regenerated** root `game.js` and `style.css` **only** using `BUILD.md`; preserved `data.js`, source/build separation, historical phase files, existing People, H3 guardian decisions, Inventory, official ballots, attendance, UI actions and calendar.
- **Documentation:** `PHASE_6B_PROGRESS.md`, `CHANGELOG.md`, `MIGRATION_NOTES.md`, `QC_REPORT.md`, `README.md`.

### Acceptance and integrity

1. **Complete actual evening:** Phase 6A registration → existing Store/Inventory outfit and cosmetic supply → real School Hall entry → known student greeting → factual paired photo → consent-aware dance + refreshments → locked-Court ceremony → real farewell → canonical checkout, travel and home debrief. Live Chromium real entry/checkout clicks verified.
2. **Immutable once locked:** ceremony reads Phase 6A ballot/result; no result reroll, duplicate award, fabricated companion, romance or photo. Correctly permits the legitimate earlier Court lifecycle to advance at scheduled dates.
3. **Save + migration:** event-scoped records persist through actual save/load and repeated reconciliation; older completed/terminal Prom saves never gain fictitious night or registration state. Direct-backend gates reject unauthorized, duplicate and expired actions.
4. **Seeded fuzz:** 360 real function calls across US, CA, VN, AU, JP and KR. Every action followed by checks for event/school/venue ID consistency, existing roster NPCs, action quotas, unique invitations/photos/farewells, no duplicate lifetime first-Prom milestones, valid terminal Calendar/location state and preserved save/load. No invented NPCs; fuzz artifacts aren't persisted to player saves.
5. **Static Pages:** index, scripts, stylesheet, data, Pages workflow and `.nojekyll` exist. Asset URLs are relative and cache-bust versions match content hashes. Local HTTP GET for HTML/JS/CSS/data returns byte-identical assets. **Remote deployed GitHub Pages and Chromium localhost navigation were not verified.**

### Actually executed QA — accepted completed runs only

| Suite | Completed PASS |
|---|---:|
| `qa/t_6b7.py` new browser acceptance | **63/63** |
| `qa/t_6b7_fuzz.py` six-region/360-operation fuzz | **37/37** |
| `qa/t_6b7_static.py` static hosting smoke | **12/12** |
| `qa/t_6b6.py` | **40/40** |
| `qa/t_6b5.py` | **45/45** |
| `qa/t_6b4.py` | **54/54** |
| `qa/t_6b3.py` | **47/47** |
| `qa/t_6b2.py` | **54/54** |
| `qa/t_6b1.py` | **39/39** |
| `qa/t_6a7.py` | **45/45** |
| `qa/t_6a7_fuzz.py` | **17/17**, 300 operations |
| `qa/t_6a6.py` | **39/39** |
| `qa/t_6a5.py` | **51/51** |
| `qa/t_6a4.py` | **54/54** |
| `qa/t_6a3.py` | **60/60** |
| `qa/t_6a2.py` | **50/50** |
| `qa/t_6a1.py` | **43/43** on fixed source |
| `qa/t_5d7.py` | **44/44**, 300 financial fuzz operations |
| `qa/t_5c55_release.py` | **24/24** |
| **Total distinct accepted checks** | **818/818** |

- `qa/t_6b7.py` originally had 58/62 because a fixture compared the entire *unlocked* Court before and after scheduled voting progression. Updated assertions to test legitimate identity before ballots lock and immutable results after locking; then **62/62**, expanded to **63/63** with legacy save crash regression.
- The first fuzz harness used an external JavaScript scope that could not access closure-scoped runtime functions; it ran 360 attempted actions with ReferenceErrors and was **not accepted**. Replaced it with a QA-only runner invoked through the existing test bridge; **37/37** in 360 actual production calls passed.
- Initial pre-hotfix `qa/t_6a1.py` failed on a real `TypeError` in historical Prom notice cleanup. Corrected source and reran the unchanged suite **43/43**.
- A long batched test shell was interrupted **after** complete 6B.3 and later old-regression logs had been written. Only individual completed PASS logs are counted. After the narrow source repair, `t_6b6.py` 40/40, `t_6a6.py` 39/39, `t_6a7.py` 45/45, and `t_6a1.py` 43/43 were rerun and passed on the final source; other completed regressions were from the same gameplay implementation before that null-safe UI cleanup repair. All initial nonpassing logs are kept.
- Browser no-runtime-exception checks passed in the new acceptance and fuzz; the QA result count is checks, not number of simulated game nights. Remote deployment not executed.

### Reproducible BUILD.md build

Both builds ran `python3 tools/splice.py`, `cp src/style_before_theme.css style.css`, `python3 tools/theme.py`, `node --check game.js`, `node --check data.js`. SHA-256 results in `qa/results_6b7/build_pass1.sha256` and `build_pass2.sha256` are identical:

- `game.js`: `53247d6358c08003bec100bd4ce8d19a1ac965452916a66e1d7b7a5dc38d53d2`
- `style.css`: `726c58f56893b39af8f9df787e372ec5b80771167cc566e3ac44ce51695e88f0`
- `data.js`: `1640e4ac438c2895144cd723f855d50bd387b432b71fe86e83ddabebc5f2f6f3`

### Known limits / handoff

- Existing Prom photographs are truthful in-game event records, **not bitmap photo capture**. Detailed transport modes and unsupported external after-parties are not generated or fabricated.
- Local HTTP static assets pass; real remote GitHub Pages publication has not been checked. Intermittent historical randomized QA fixtures from older checkpoints may still vary; complete PASS runs and any nonpassing logs remain available.
- Phase 6C **UNSTARTED**. Any Universal Occasion Engine development must begin on an explicit subsequent instruction using this authoritative 6B.7 archive.

**Last verified checkpoint:** 6B.7. **Current checkpoint:** STOP. **Exact next resume point:** Phase 6C only when explicitly requested.

**6B.7 COMPLETE — PHASE 6B COMPLETE. STOP before Phase 6C.**
