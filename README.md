## Phase 6A — Prom Season (COMPLETE; 6A.7 accepted 2026-10-08)
School-approved Prom registration, committee applications and preparation, real date RSVPs, school Court nominations and ballots, peer campaigns, notification/calendar integration and scoped save history. Final 6A.7 verifies 48 projected regional/year calendar cases, 300 seeded Prom action operations, 504 passing acceptance/regression checks and reproducible static builds. Source-based build procedure: `BUILD.md`; full tracker: `PHASE_6A_PROGRESS.md`. Phase 6B Prom Night is NOT included; no remote GitHub Pages publication was performed.

# Life Simulator — Living World v7.2

A static browser life simulator with age-aware everyday actions, real simulation time, calendar/deadlines, family permission and delayed decisions, school/exams/clubs, relationships/memories, shopping/inventory, phone ownership, weather, small business, work and aging.

## Run locally
Open `index.html` in a browser. For best storage behavior, serve the folder with any basic static server.

## GitHub Pages
Upload the **contents of this folder to the repository root** so `index.html`, `style.css`, `data.js` and `game.js` sit beside `.nojekyll`.

This build includes:

```text
index.html
data.js
game.js
style.css
.nojekyll
.github/
  workflows/
    pages.yml
```

In GitHub repository settings, set **Pages → Source = GitHub Actions**. Push to `main`; the included workflow publishes the repository root.

All runtime asset paths are relative, so project-site URLs such as `https://username.github.io/repository/` do not require hard-coded root paths.

## Saves
- Autosave uses browser `localStorage`.
- Manual Save writes immediately.
- Export creates a portable JSON save.
- Import accepts JSON saves.
- v7 attempts to migrate prior v6.x Life Simulator autosaves.
- Restart removes known Life Simulator save keys only after confirmation.

## Documentation
- `CHANGELOG.md` — feature/fix log
- `AUDIT.md` — findings from the v6.3 audit
- `AGE_ACTION_RULES.md` — life-stage eligibility design
- `MIGRATION_NOTES.md` — legacy save handling
- `QC_REPORT.md` — tests and known limitations


## v7.1 focused fixes
Daily Life now uses developmental activity sets for infants/toddlers/children, minors require caregiver permission for household electronics and stove use, radio provides a non-screen music/news option, the duplicate World-panel log was removed, and the desktop sidebar now scrolls/sticks as one unit without overlapping Identity.


## v7.2 (phases 1–5b)
State-lifecycle overhaul: pending decisions, assessments, homework, school days, club sessions, contests, events and notifications all reach a final state, and related UI/state always agree. Adds **Next Day** (separate from Age Up), sleep-into-morning, bedtimes, missed-obligation consequences with delayed follow-ups, and an Age Up year summary. Phase 2 adds item lifecycles (portions, supplies, containers, condition/aging, devices with battery, progress items, perishables), stacks and multiple ownership, equipment slots, practice skills with diminishing returns, a canonical phone record, and a redesigned inventory and shop. See `CHANGELOG.md`, `MIGRATION_NOTES.md` and `QC_REPORT.md`. The automated QC scripts and v7.1 bug fixtures are in `qa/` (not needed for deployment).

Phase 3 adds the interactive school day (check in, then period-by-period choices), graduation milestones, numbered sub-tabs (keys 1–4, N = next day), a month calendar with a Life Planner, and a region-aware holiday engine with real activities.

Phase 4 adds Light (default) / Dark / Auto / Life themes built on semantic CSS tokens, and a local SVG icon set for navigation, needs and top-bar controls.

Phase 5a gives NPCs unique, culturally-appropriate full names, households, schedules and goals; adds invitations/RSVP with deadlines and consequences, house rules (curfew, permission, trust), club tryouts/auditions with reasons and recovery, position ladders, elections against NPCs, multi-dimensional school reputation, story threads and outcome history.

Phase 5b adds prom (multi-stage, with reasons, second chances and NPC agency), dates as scenes, age-gated romance with boundaries and consent (adult intimacy fades to black), sneaking out (friends only for minors), neighborhood households and events, friend groups, rivals, end-of-year awards, personality-aware gift reactions and narrated relationship actions.

## v7.3 complete
All v7.3 items are implemented: creator fixes, real school years with semesters and regional calendars, talents/levels/study rules/mood/anti-farming, school–home communication, climate weather and school closures, Fast Forward, scheduling with real answers and relationship tiers, birthdays, chats and calls, teen autonomy, summer programs and jobs, baking/wrapping/Valentine, family outings and trips, the full love progression, real NPC couples and families, the two-column person window, UI reorganization, small businesses, housing, university applications and funding, and adult careers. See CHANGELOG.md and QC_REPORT.md.

## Source layout
`game.js` and `style.css` are generated. The sources are in `src/` (`src/base/game.js` + `src/modules/*.js` + `src/style_before_theme.css`) and the build tools in `tools/`; see `BUILD.md` to rebuild. Phase progress files (`PHASE_2A_PROGRESS.md`, `PHASE_2B_PROGRESS.md`, `PHASE_3A_PROGRESS.md`) refer to module files under `src/modules/`.

## Phase 4C — Daily School Realism
Phase 4C is complete. Daily school behavior now uses canonical physical location + game time + school calendar: real campus hours and travel, class/teacher/attendance context, lunch/facilities/needs and school-aware device rules, realistic homework pacing, after-school scheduling/conflict rules, campus closing, Go Home and family-dinner timing hooks. See `PHASE_4C_PROGRESS.md` for the final 4C.5 migration/regression/fuzz report. Exact next development point: **Phase 4D — Competitions / School Events**.

## Phase 5B — Summer Programs / Tutoring / Summer Jobs
Phase 5B is in progress. Checkpoint 5B.1 is complete: the existing summer-program system now has canonical stable program offerings, formal-vs-casual separation, age/season discovery, H3 parent/guardian enrollment decisions, fees, full-schedule conflict checks, real Calendar sessions and conservative save migration. See `PHASE_5B_PROGRESS.md`. Exact next development point: **5B.2 — Formal Programs / Coaches / Attendance / Skills**.

### Phase 5B checkpoint status
Phase 5B.2 is complete. Formal programs now have stable instructors, explicit attendance states, 10-consecutive-absence removal, relevant skill/talent progression, persistent participant provenance, tryout hooks, and completion records. Exact resume point: **5B.3 — Tutoring / Summer Academics / Social Integration**.

## Phase 5B checkpoint status

Phase 5B.4 — Summer Jobs / Shifts / Pay / Work-School Compatibility is complete. Standard summer employment now starts at age 16, uses four canonical job options, real Calendar shifts, completed-shift pay, late/missed consequences, stable workplace hooks, schedule conflict validation, save-safe wage de-duplication and end-of-summer completion. See `PHASE_5B_PROGRESS.md` for details. Exact next checkpoint: **5B.5 — Migration / Regression / Fuzz / Final QA**.

## Phase 5B — COMPLETE
Phase 5B is complete. Summer/after-school programs now use canonical scheduled enrollment, instructor/attendance/progression and social provenance; Summer academics/tutoring use subject-specific real schedules with a three-subject formal Summer cap; standard Summer employment begins at age 16 with four canonical job options, real shifts and pay-by-completed-shift; Fast Forward respects required program/tutoring/job obligations. Final 5B.5 acceptance is 26/26 and dedicated fuzz is 17/17 across 200 randomized operations. See `PHASE_5B_PROGRESS.md` for the full 50/50 acceptance closeout. Exact next development point: **Phase 5C — Seasonal Activities / Functional Store**.

## Phase 5C — Seasonal Activities / Functional Store
Phase 5C is **COMPLETE** after 5C.5.5 final release audit. Its canonical seasonal activity foundation, Summer/Winter activities, Autumn camping/hiking and group RSVP, and functional seasonal Store/gear are implemented and verified with existing H3, People, Calendar, Inventory and save migration. See `PHASE_5C_PROGRESS.md` and `QC_REPORT.md`. Phase 6 has **not** been started.

### Autumn outdoors (Phase 5C.3.5)

Open **Daily Life → Activities → Autumn outdoors** to plan a camping weekend or day hike. Select the date, company, and gear access; planned outings remain in the existing Calendar/Plans lifecycle. Under-13 campers need a legitimate adult supervisor and overnight minors require H3 caregiver permission. Rentals are temporary outing access, never Inventory ownership.


### Phase 5C.3 — Autumn outdoors COMPLETE (5C.3.6 final sign-off)

Autumn camping and hiking use the existing Daily Life → Activities → Autumn outdoors interface, real Plans/Calendar, age/supervision/H3 decisions, equipment access/rental, weather, Friend Group RSVP, family/NPC invitations and bounded contextual memories. Source modules `src/modules/seasonal5c3_1.js` through `seasonal5c3_5.js` integrate with existing foundation; generated `game.js` remains authoritative only as build output.

**Final QA:** `python3 qa/t_5c36_accept.py` (21/21), `python3 qa/t_5c36_fuzz.py` (21/21; 200 operations) plus full upstream/focused regression (**513/513 PASS** over 30 suites). See `PHASE_5C_PROGRESS.md`, `QC_REPORT.md`, and `qa/results_5c36/` for the final handoff and evidence. Build instructions remain in `BUILD.md`.

**Phase 5C.4 and Phase 5C.5 final audit are both COMPLETE.**


## Phase 5C.4 — Functional Store / Gear / Consumables / Equipment COMPLETE

The existing Shop and Inventory now support functional winter/summer/camping/hiking gear: 20 seasonal SKUs, paid ownership/quantity caps, five-use sunscreen, actual wear on completed outings, honest broken-equipment eligibility, temporary rental/provider access, repairs/replacement, H3 guardian decisions, gear benefits and save-safe seasonal UI. No additional Store tab or alternate equipment state machine was introduced.

**Final checkpoint 5C.4.6:** `python3 qa/t_5c46_accept.py` (24/24), `python3 qa/t_5c46_fuzz.py` (25/25 with 200 operations), `python3 qa/t_5c46_release.py` (10/10), plus independently rerun focused/upstream acceptance and fuzz: 37 suites / 686 accepted checks; total 38 suites / 696 accepted checks. Initial stochastic 5B.5 soft-event test failures are preserved alongside a clean rerun; see `QC_REPORT.md`. Rebuild sources with the unchanged `BUILD.md` procedure. Live hosting was not part of acceptance.

**Historical handoff:** 5C.4.6 preceded Phase 5C.5; final global audit was subsequently completed at 5C.5.5.


## Phase 5C — Final release (5C.5.5 COMPLETE; 2026-10-08)

All 5C.1–5C.5 checkpoints have passed their recorded gates. The final freshly rerun 73-suite production regression passed **1,476/1,476 checks**, and the added static/isolated-Chromium release audit passed **24/24** (combined **74 suites / 1,500 PASS**). Build and release logs are in `qa/results_5c55/`; `BUILD.md` explains how to regenerate root assets from `src/`. The `game.js` and `style.css` builds are byte-identical across two passes.

The archive is structured for GitHub Pages, but the hosted website has not been tested live from this environment: Chromium blocks direct URL navigation. Production runtime behavior was exercised by loading the actual generated JS/CSS bytes in an isolated browser and checking asset paths/workflow statically. Known legacy `t_items.py` and historical 4A/5B intermittent test caveats are in `QC_REPORT.md`.

**Phase 5C COMPLETE. Next development phase: only on separate user authorization.**

## School UI post-hotfix deployment verification

The latest School UI verification bundle uses content-hash query strings in `index.html` for runtime assets so that refreshing an updated HTML page fetches the matching code rather than a cached older `game.js`. Deploy all root files together, not just `index.html`. Details and browser validation commands are in `HOTFIX_SCHOOL_DEPLOY_VERIFY_PROGRESS.md`. This does not establish that your hosted Pages site has been updated: verify the live marker and workflow success after deploying.

## Phase 5D.1 development checkpoint (2026-10-08)
The source now contains the conservative microbusiness session/transaction foundation; current Lemonade, Cookie/Cupcake, Crafts/Beads and Yard Sale UI remains the older aggregate implementation. See `PHASE_5D_PROGRESS.md`. Phase 5D.2–5D.7 remain pending; customer gameplay, true batch ingredient consumption and yard-item per-sale receipts are **not complete**. The root assets are generated per `BUILD.md`; deploy the contents of this ZIP to the repository root, not the ZIP file itself. The versioned `game.js` URL was refreshed for this checkpoint.
**Checkpoint status:** 5D.1 complete; resume from **5D.2 only**. Reproducible build and accepted QA evidence in `PHASE_5D_PROGRESS.md` and `qa/results_5d1/`.

### Phase 5D.2 checkpoint handoff
Phase 5D.2 canonical product preparation, stock, expense receipts, pricing and yard-sale ownership validation are implemented as **backend APIs only**, compiled from `src/modules/microbusiness5d2.js`; legacy stand actions remain playable. See `PHASE_5D_PROGRESS.md` for verified 20-suite QA, limitations and the exclusive next checkpoint **5D.3**. Rebuild using `BUILD.md`; GitHub Pages still uses generated root `game.js`/`style.css`.


### Phase 5D.3 — canonical customer encounter backend
Built on 5D.1 sessions and 5D.2 real product batches. Anonymous bounded customers ask questions, bargain, buy/refuse, tip occasionally and make grounded complaints. Sales and resolutions use canonical idempotent receipts. These APIs are not in the live game UI yet (5D.6); see PHASE_5D_PROGRESS.md and qa/t_5d3.py. Next resume checkpoint is 5D.4 only.


### Phase 5D.4 verified — Neighborhood regulars and reputation
New `src/modules/microbusiness5d4.js` extends 5D.3 customer encounters with occasional stable NPC-backed neighborhood regulars (routine traffic stays anonymous), positive/negative reputation, realistic repeat contact acquisition and strictly bounded acquaintanceship. Repeated purchases alone never grant friendship; receipt-backed outcomes update per-business reputation without duplicating finance. Phase 5D.4 is backend-focused. The player-facing sales UI and legacy auto-sale integration will be addressed in 5D.6. See `PHASE_5D_PROGRESS.md`; resume only from **5D.5**.


### Phase 5D.5 checkpoint (backend only)
Existing microbusiness sessions now support paid special orders from real established neighborhood customers with Calendar pickup deadlines, stock/pricing integrity, bounded local competition, H3-family-help commitments and Phase 5A evidence linked to real sales. Existing wallet, Inventory, NPC IDs, official job shifts and save authority remain unchanged. **There is no complete player-facing 5D business UI yet**; 5D.6 will integrate the backend and legacy business actions. Verify with `python3 qa/t_5d5.py`; follow `BUILD.md`.

## Phase 5D.6 — interactive small businesses
Open **Money & Items → Selling**. Choose Lemonade, Cookies, Cupcakes, Beads, Crafts, or Yard Sale, select a location, then create a stand. Prepare real paid supplies or transfer eligible owned Inventory baked goods/yard items; price them and open to handle individual customers. Choices, bargaining, complaints, real sales and Calendar orders update the existing state. Close to preserve or discard unsold stock. Prior classic businesses can opt in without replaying old money; you may return to classic selling for earlier stock only after finishing the interactive session. No new top-level tabs.

### Phase 5D — Release acceptance
Phase 5D.1–5D.7 complete. Modern interactive microbusiness includes real stock, expenses, customer responses, receipts, neighborhood reputation, calendar pickup orders and compact Money & Items → Selling UI. Under-12 modern selling is guarded by H3-approved adult supervision at both UI and backend execution. See `PHASE_5D_PROGRESS.md`, `qa/t_5d7.py`, `qa/results_5d7/accepted_final.tsv` for evidence and legacy-mode scope. Rebuild with `BUILD.md`. Static GitHub Pages support locally verified; remote deploy not tested.

### Phase 6A.1 — Prom Season foundation

Prom uses the current school, academic-year calendar, school Hall and one stable school/year/cohort event ID. Eligible Grades 8–12 see an advance Prom registration announcement; the Home Prom card now requires **Register for prom** or **Do not participate** before the deadline (one week before Prom). Not registering is distinct from declining and eventually closes non-actionable notices. Buying a ticket or viewing Prom does not register the player. Existing dated scenes, invitations and committee activity remain legacy until later Phase 6A/6B checkpoints; no full Prom Court voting was added in 6A.1. See `PHASE_6A_PROGRESS.md` for scope and QA.

### Prom Season — Phase 6A.2
Prom remains part of canonical School + Calendar (eligible Grades 8–12). Committee signup is separate from attending Prom: applications open 28 days before Prom, close 18 days before, and are reviewed by a faculty adviser 17 days before. A current council role improves an application but does **not** let a student automatically organize. Approved members can complete one on-campus after-school committee responsibility per school day, propose an approved theme and decoration plan, and use the committee's fixed discretionary budget. Work stops two days before Prom. Optional attendance/date invitations and Court voting will be expanded in later checkpoints.


### Prom Season — Phase 6A.3
Register for your Grade 8–12 Prom before the 6A.1 deadline, then use **Home → Prom → Ask someone** to invite an eligible classmate or known school-age neighbor. Choose a private, casual, text (only with phone access), or other appropriate approach. NPCs may agree, decline with a specific reason, offer friendship or ask for time; repeatedly asking the same person does not reroll their choice. Schoolmates can also invite you through the normal event inbox: accept only with mutual romantic compatibility, suggest going as friends, ask for time, or decline respectfully. Confirmed dates appear in Prom RSVP, where **Cancel this date respectfully / change plans** can free up going with friends, solo or choosing someone else. A date is not required for attendance. Invitations are tied to the current school/cohort/year; transfer, expiry and save/reload do not revive a prior Prom answer. The full formal Court vote and expanded Prom Night experience remain later work, not Phase 6A.3.


## Phase 6A.4 — Prom Court checkpoint
During an eligible middle/high-school Prom season, the existing Home Prom card supports a voluntary nomination request, student ballots and official Prom Court awards. Nomination is not automatic, attendance registration does not guarantee candidacy, peers vote once per award, and awards are determined from persisted ballots rather than rerolled during Prom Night. The school calendar shows the ballot deadline. See `PHASE_6A_PROGRESS.md`. Prom social consequences, consolidated UI and expanded Prom Night are separate future checkpoints (6A.5+, 6B).
## Phase 6A.5 — Social Dynamics / Campaign checkpoint

Prom Court has an optional event-scoped social season: request Court consideration, perform limited after-school, school-approved student campaigning, ask real school peers for voluntary support and (when nominated) choose respectful or rumor-driven rival interactions. Rivalry has bounded reputation/People consequences and cannot change ballots or guarantee awards. Results and genuine supporter reactions are not exposed until Prom Night. Full Prom Night expansion is a separate later phase. See `PHASE_6A_PROGRESS.md`.

### Phase 6A.6 Prom season UI (checkpoint complete)
Eligible students see one Prom season workspace in Education and Home, showing attendance, committee approval, RSVP, Prom Court and the next deadline. Calendar Month shows the same official school Prom and registration/nomination/ballot dates. Actions remain connected to the existing Prom records and remain optional; no automatic attendance or award. The historical or expired Prom notifications are retired without disturbing other school alerts. See `PHASE_6A_PROGRESS.md` for tests, limitations, and the **6A.7** resume point; Phase 6B Prom Night expansion is not started.

### Phase 6B.1 — Prom Night check-in foundation

During an eligible Grade 8–12 Prom season, register by the existing deadline and arrange the existing Prom ticket or waiver. On the Prom date, **Education → Prom** or **Home → Prom** shows the school-approved Hall, 7:00 PM opening, 8:30 PM check-in cutoff and 11:00 PM closing. If your schedule and location allow, choose **Enter School Hall** to check in; attending from Home uses the canonical in-game clock, and the player moves to the approved School Hall context. **Leave Prom / Go Home** records actual departure without inventing dances, photos, awards or relationships. Late/missed/declined events close safely. The attendee list uses existing enrolled NPC IDs and accepted invitations remain stored. Full preparations, venue encounters, activities, ceremony and after-Prom stories are reserved for 6B.2–6B.6. See `PHASE_6B_PROGRESS.md` for verified QA and limitations.

### Phase 6B.2 — Prom preparation
Eligible registered players can select clothing already owned (or buy a formal dress/suit in the existing Store), apply a **real owned makeup set** on Prom day, ask an available mother/sister/aunt at home for makeup help, or style their hair. Preparation uses actual game time and is saved under the current Prom Night event ID. Makeup is optional, and preparation does not grant awards, dates, dance/photos, or modify Court votes. See `PHASE_6B_PROGRESS.md`; Phase 6B.3 and later are pending.


### Phase 6B.3 — Arrival at the School Hall
After a valid 6B.1 check-in, the existing Education/Home Prom panel shows real present classmates, an accurate date/companion status, and optional **Say hello / Introduce yourself** buttons. Students who are late under an explicit NPC schedule appear only once they arrive. Known conflicts may prevent a date from attending without revoking the original accepted invitation. A greeting uses five in-game minutes, is only available for a genuinely present, enrolled pupil, and cannot be repeated for the same Prom. New People introductions record the real Prom event as the place of first meeting; previously known classmates retain their original provenance. No full dancing, ceremony, photos or final relationship scenes yet — these are Phase 6B.4–6B.6. See `PHASE_6B_PROGRESS.md` for verification.


### Phase 6B.4 — Prom Night interactive activities
Inside the approved School Hall, after checking in, use the Prom panel to dance solo, invite a real greeted classmate to dance, talk, take short breaks, have school-provided water/snacks or experience a brief ambient moment. NPCs can politely decline; requests and activities are capped per night. Activities consume canonical in-game time and save to `night6B1.moments6B4`. Phase 6B.5 ceremony/photos and 6B.6 after-Prom outcomes are not yet implemented. See `PHASE_6B_PROGRESS.md`.


## Phase 6B.5 — Prom Court night and photographs
During a genuine registered Prom Night check-in at the approved school hall, the School/Home Prom section offers photo opportunities with actual attending students. At 9:00 PM the school can present its previously counted Prom Court winners. Court awards are never rerolled or granted on check-in, and photos preserve factual participant identities and are capped per event. The Prom Night save includes an optional event-scoped photo history; the application does not generate actual image files. The full post-Prom and final release flows are scheduled for later checkpoints. See `PHASE_6B_PROGRESS.md`.


### Prom Night — Phase 6B.6
When attending an approved School Hall Prom, greet actual classmates before using the **Say goodbye** controls. **Leave Prom / Go Home** now closes verified attendance once and spends in-game travel time; the Home card briefly offers a one-time quiet reflection or conversation with a real available household caregiver. Only activities actually played can generate the first-Prom memory. Memories, photos, Court and relationships retain existing consent and factual-event boundaries. Phase 6B.7 final acceptance is still pending.


### Phase 6B — Prom Night Experience: Complete (6B.7)
All 6B checkpoints are verified: event-scoped attendance, genuine Inventory/beauty preparation, School Hall arrival, real People greetings and date presence, consent-aware dancing, bounded activities, locked Court award ceremony, verified attendee photos, farewells, return home, family reflection and factual milestones. All attendance/Calendar/School/romance/Inventory systems remain authoritative. Final release QA: 818/818 accepted checks, including six-region 360-action fuzz. Build via `BUILD.md`; GitHub Pages files and relative static assets retained. Remote deployment not verified. Phase 6C (Universal Occasion Engine) has **not** begun.
