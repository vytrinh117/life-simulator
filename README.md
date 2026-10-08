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
