# HOTFIX-SCHOOL-UI-INTEGRATION — School UI Wiring + Consolidation

**Status:** COMPLETE — verified on authoritative source and generated production assets (2026-10-08).
**Baseline:** `life-sim-HOTFIX-school-nav-complete.zip` (Phase 5C COMPLETE, Phase 6 NOT STARTED).
**Scope:** Correct 4C.2/4C.3 DOM dataset mappings; organize the existing School-tab contexts as one primary Today at school card; keep canonical game handlers and all eligibility/time rules unchanged.

## Verified before editing

- Read `BUILD.md`; only `src/` is authoritative for generated `game.js` and `style.css`.
- Inspected `src/modules/schoolday4c1.js`, `schoolclasses4c2.js`, `schoolfacilities4c3.js`, `school72.js`, `schoolafter4c4.js`, `ui72.js` and `qa/t_hotfix_school_nav.py`.
- SchoolDay 4C.1 travel attributes were already fixed and must stay unchanged.
- Nine remaining malformed HTML names end in `-4c2`/`-4c3`, but handlers access camelCase keys ending in `4c2`/`4c3` (no hyphen).
- `schoolSessionHtml()` separately emits a `data-act="school"` travel button, duplicating `schoolDayContextHtml4C1()`; the UI stacks separate session-card/mini-meta groups.
- Planned changes: markup in schoolclasses4c2, schoolfacilities4c3, compact layout integration in school72, ui72; focused browser regression + docs; generated game.js from build.

## Checkpoint acceptance

Real DOM click on each visible applicable action, no duplicate primary School travel CTA, attendance/travel/calendar/time unaffected, 4C focused and release regression, browser errors zero, byte-identical two-pass build, complete verified ZIP. Pending.

## Confirmed root causes and exact data attributes

The previous Go to School / Go Home wiring hotfix in `schoolday4c1.js` was already correct; preserved it. HTML attributes ending `-4c2` or `-4c3` expose dataset keys containing an internal hyphen and **do not** match the actual handlers' `.dataset.someName4cN` properties. Because HTML names are case-insensitive, use lowercase hyphenated `data-school-sick4c2`, **not** `data-schoolSick4c2` (HTML would lowercase the S).

| Authoritative file | Before | After / matching dataset key |
|---|---|---|
| schoolclasses4c2.js | `data-school-sick-4c2` | `data-school-sick4c2` → `schoolSick4c2` |
| schoolclasses4c2.js | `data-ask-teacher-4c2` | `data-ask-teacher4c2` → `askTeacher4c2` |
| schoolfacilities4c3.js | `data-school-cafeteria-4c3` | `data-school-cafeteria4c3` → `schoolCafeteria4c3` |
| schoolfacilities4c3.js | `data-school-packed-4c3` | `data-school-packed4c3` → `schoolPacked4c3` |
| schoolfacilities4c3.js | `data-school-social-4c3` | `data-school-social4c3` → `schoolSocial4c3` |
| schoolfacilities4c3.js | `data-school-restroom-4c3` | `data-school-restroom4c3` → `schoolRestroom4c3` |
| schoolfacilities4c3.js | `data-school-wash-4c3` | `data-school-wash4c3` → `schoolWash4c3` |
| schoolfacilities4c3.js | `data-school-rest-4c3` | `data-school-rest4c3` → `schoolRest4c3` |
| schoolfacilities4c3.js | `data-school-vending-4c3` | `data-school-vending4c3` → `schoolVending4c3` |

All existing click handlers and canonical underlying action helpers remain unchanged. No unrelated dataset handler was modified.

## Consolidation

- `schoolday4c1.js` offers an **embedded presentation mode** that supplies the school name/grade/class/location/time/status, campus hours, and a **single** canonical Go Home / Go to School button.
- `schoolclasses4c2.js` shows Current / Next / Attendance summary and a separately labeled Teacher & attendance action row.
- `schoolfacilities4c3.js` groups campus actions with status, device rule and packed-lunch availability.
- `school72.js` preserves the existing timetable and session-action event attributes but supports an embedded presentation with no nested `session-card`; it does not render obsolete Skip/Leave-Early actions after dismissal. Before attendance, `data-act="school"` is only offered as a separate check-in when already physically at School; the normal trip to School uses the canonical 4C.1 CTA.
- `ui72.js` renders exactly one primary `Today at school` card and a compact after-school/homework note in that same card instead of stacking five independent subcards. Duplicate hero school CTA is suppressed **only while active on the School tab**; shortcuts on other tabs are preserved.
- `src/style_before_theme.css` introduces **scoped** `.school-today-*` styles using existing tokens and responsive layout; no global redesign.

The School-tab overview continues to expose the timetable and keeps existing school identity, academic, clubs, assessments and other major panels untouched. All eligibility/time/cost/location/attendance rules and H3/Phase 5C mechanics remain unchanged.

## Files changed

**Authoritative:** `src/modules/schoolday4c1.js` (embedded rendering only), `src/modules/schoolclasses4c2.js` (two wiring fixes and embedded summary), `src/modules/schoolfacilities4c3.js` (seven wiring fixes and embedded facilities), `src/modules/school72.js` (embedded timetable/session rendering and duplicate CTA suppression), `src/modules/ui72.js` (unified School overview and School-tab hero CTA suppression), `src/style_before_theme.css` (scoped CSS).

**Generated:** root `game.js` from `tools/splice.py`; root `style.css` from `tools/theme.py`.

**QA/Documentation:** `qa/t_hotfix_school_ui_integration.py` (new actual-DOM-click suite), `qa/results_hotfix_school_ui_integration/` (full logs/build hashes), this progress file, `CHANGELOG.md`, and `QC_REPORT.md`.

## Browser acceptance

The Playwright suite clicks actual rendered buttons in the production `index.html`+`data.js`+`game.js` environment (not direct calls to action helpers). Direct helper calls are used only to set up realistic School clock/location and inspect authoritative context. Coverage includes Go to School, Go Home, Ask Teacher, Call in sick, Cafeteria, Packed lunch, Lunch social, Restroom, Wash hands, Short rest, Vending, Skip to dismissal and Leave school early. Each action is tested in an eligible state, with a state/time/effect assertion and page error check. UI also asserts:

- one `data-school-today="1"` primary card, Current / Next / Attendance and timetable inside that card;
- no nested legacy `session-card`;
- exactly one School-tab travel CTA with the correct canonical dataset key;
- no duplicated School Day hero trip CTA while already in School tab;
- after dismissal, `Skip` and `Leave early` no longer appear as inert controls; Go Home remains.

The previous `qa/t_hotfix_school_nav.py` DOM-click regression and original 4C.1 backend travel assertion were preserved unmodified and passed.

An initial 4C.4 integration test failed (21/22) because the new compact note omitted the historical **“After school & homework”** label. Production markup was corrected to preserve that label and `Campus closes`; the unchanged 4C.4 regression then passed (22/22). Initial failed log retained for audit.

## Verified test matrix

| Suite | Result |
|---|---:|
| New DOM-click School UI integration | **58/58 PASS** |
| Previous DOM-click school-nav / backend regression | **17/17 PASS** |
| 4C.1 | **20/20 PASS** |
| 4C.2 | **21/21 PASS** |
| 4C.3 | **20/20 PASS** |
| 4C.4 | **22/22 PASS** |
| 4C.5 acceptance | **28/28 PASS** |
| 5C.1 seasonal | **18/18 PASS** |
| 5C.2 seasonal | **20/20 PASS** |
| 5C.5.1 migration | **30/30 PASS** |
| 5C.5.2 integration | **23/23 PASS** |
| 5C.5.5 release audit | **24/24 PASS** |
| 5A.1 Store/workbook UI | **23/23 PASS** |
| **4C.5 fuzz — 800 randomized operations** | **21/21 PASS** |
| **Total, all exit-verified suites** | **345/345 PASS — 14 suites** |

4C.5 fuzz was independently re-executed on the final updated UI source. `qa/results_hotfix_school_ui_integration/t_4c5_fuzz_final.log` reports **21/21 PASS • 800 randomized operations**, and `t_4c5_fuzz_final.exit` records **exit code 0**. An earlier tool operation timed out after printing 21/21 and was not counted; the verified rerun replaces that uncertainty.

No JavaScript browser page errors detected in focused DOM-click QA or the selected 5C release audit.

## Build and release

- Rebuilt only from authoritative `src/` using `BUILD.md` (`python3 tools/splice.py`, `cp src/style_before_theme.css style.css`, `python3 tools/theme.py`).
- `node --check game.js` and `node --check data.js` PASS.
- CSS theme audit: `remaining literal hex outside tokens: []`.
- Two consecutive rebuilds must produce byte-identical `game.js`, `style.css` and `qa/harness.py`; hashes recorded below after final verification.
- Final two-pass rebuild is byte-identical for `game.js`, `style.css` and `qa/harness.py`. `node --check game.js` and `data.js`: PASS; CSS theme check: `remaining literal hex outside tokens: []`.
- `game.js` SHA-256: `31320ef6c687c57b0dc0d202c45dbfb540be47a5a3af9e39a030a80c46d1f732`
- `style.css` SHA-256: `f3b7e5a1f4912b39c7e4714e2f47e320ce2a93ca7df00b2221f0cb735a0762f2`
- `qa/harness.py` SHA-256: `9b681b9e0f3f896c094a54b0d2258c192c34f370b12042cdaff8024bf68ce488`
- ZIP must contain source, QA, generated assets, `.github/workflows`, `.nojekyll`, index and progress; CRC checked at packaging.

## Known limits / strict scope

- Game is GitHub Pages-compatible as a static package but a live hosted deployment has **not** been separately tested by URL here; browser QA loads production assets into Chromium using the existing harness.
- Legacy unrelated QA issues noted in prior QC_REPORT remain out of scope. Not a claim that every possible School state or the entire game is bug-free.
- **Phase 5C remains COMPLETE. Phase 6 NOT STARTED.** No seasonal, school business-logic or unrelated gameplay change was authorized or made.

**HOTFIX-SCHOOL-UI-INTEGRATION COMPLETE — STOP.**
