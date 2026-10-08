
## Phase 4D.4 event calendar migration

- Existing school-event records are enriched in place with 4D.4 notification/archive runtime metadata.
- Migration does **not** publish new annual event instances merely because a save is loaded. Annual recurrence is driven by the daily school-event lifecycle.
- Existing stable event IDs, preparation, results, lifecycle state and event history are preserved.
- Repeated migration does not duplicate event instances, result history or missed-event notices.
- Orphaned stale school assessment notifications may be expired conservatively; no replacement assessment/event history is fabricated.

# Phase 3C.1 migration — Communication contacts/device access

- Adds `S.communication` with versioned `contacts`, `firstDeviceAt`, and NPC contact-offer cooldown state.
- Contact keys are existing stable `personId`; migration never creates duplicate People/NPC identities.
- No RNG is used by migration.
- Immediate family contacts are initialized only when a compatible device path exists.
- Existing legacy chat/message evidence is preserved as a contact only when the save already has a valid communication device; migration does not invent old conversations, missed calls, or unread counts.
- A dormant/pre-device chat does not become a contact merely because the Player later receives a phone.
- Repeated migration normalizes records in place and does not duplicate contacts or H3 decision records.

# Save Migration Notes


## Phase 3B COMPLETE — final migration validation (3B.5)

- Final 3B.5 does not add a new randomizing migration layer. It validates the existing deterministic 3B.1–3B.4 migration chain and fixes only a People/Profile descriptor fallback outside save semantics.
- Save/reload and repeated migration preserve canonical `p.love` state, one-sided Player crush vs NPC attraction, mutual/official/ex history, relationship start/end dates, romance milestones, H3 Decision Ledger records, scheduled date plans, matchmaking offers, and stable introduced-candidate identities.
- Repeated migration remains idempotent: no duplicate decision/matchmaking records, no randomly created attraction, no random partner creation/deletion, and no conversion of one-sided crushes into mutual romance.
- Final representative fuzz covered ages 14, 17, and 25 with 600 randomized romance/migration/initiative operations and passed save/load + repeated-migration invariants.
- Existing saves remain on the current `lifeSim_v7_world` storage architecture; Phase 3B finalization does not change the save key.

## Phase 3B.2 — Scheduled Romance Dates

- Adds deterministic `migrateRomance3B2()` normalization for date/invite history and any existing romantic plan records.
- Existing saves are not given random dates, attraction, or relationship progression. Existing romantic plans keep their IDs/times/status and receive only missing safe metadata such as inviter/acceptance/activity/movement hook.
- Per-person date/invite histories are bounded and migration is idempotent. H3 Decision Ledger records remain authoritative and are not rerolled during migration.
- Existing `p.love` from 3B.1 remains canonical; 3B.2 adds history/cooldown fields to that record rather than introducing a parallel romance state.

## v6.x → v7

The game first looks for the v7 autosave key and then checks legacy Life Simulator keys. A loaded legacy save is migrated in memory and saved back as v7.

Migration adds safe defaults for:
- simulation `clock` (date + minute),
- calendar and pending decisions,
- event cooldowns and notifications,
- emotional state and milestones,
- structured inventory items,
- parent-managed savings,
- richer NPC fields,
- phone app unlocks,
- richer career/health/social fields,
- school teachers/homework/exam calendar dates.

Legacy possession arrays and weather-gear counters are converted to structured inventory records. Legacy school `Considering` contest entries are converted to actionable `Open` entries with v7 decision/event dates. Existing people, relationships, money, needs, school scores, phone ownership and history are retained wherever the old data is usable.

The original legacy browser key is not silently deleted during migration. Restart/New Life removes only known Life Simulator keys after confirmation.


## v7 → v7.1
- Save key remains `lifeSim_v7_world`; existing v7 saves migrate in place.
- `version` becomes 7.1.
- `homeAmenities` gains safe defaults for `tv`, `radio`, and `sharedComputer`.
- `permissions.dailyAccess` is added with per-day flags for TV, shared electronics, phone, and stove. Old saves without these fields receive safe defaults.
- No existing inventory, relationships, school, money, calendar, pending decisions, or life history are discarded.


## v7.1 → v7.2
- Save key stays `lifeSim_v7_world`; `version` becomes 7.2. v6.x and v7/v7.1 saves remain loadable.
- `migrate()` ends with `reconcileState('migrate')`, which repairs:
  - **Stale kindergarten decisions** at age 6+ → `Superseded` (reason "Primary school age reached"), with a journal entry. Unanswered records at ages 3–5 get an `autoDecideDate`.
  - **Exam/calendar mismatches** → the calendar follows the exam record; duplicate exam events are removed; open exams in the past are closed as Missed (silently, without a retroactive popup); future open exams on weekends move to the next school day.
  - **Orphaned calendar events** (exams wiped by the old year rollover, sessions for clubs you left, contests no longer registered) → `Cancelled`. Past active events older than yesterday → `Expired`.
  - **Legacy `S.current`** text banners → replaced by a validated context object.
  - **Events** without `expiresAt` get a response window; **notifications** get status and source fields; old exam notices expire.
  - **Homework** `Done` → `Submitted`, `Archived` → `None`. **Clubs** get attendance, leader, warnings and position fields, plus a scheduled session if missing.
  - Mis-typed conditional purchase answers → `conditionalPurchase` with a 180-day expiry.
- New containers: `S.archive` (pending / calendar / events / exams), `S.followUps`, `S.school.record`, `S.schoolHistory` and `S.family.restrictions`. Nothing in existing history is deleted. Resolved records older than ~3–4 weeks move to `S.archive`, and finished school-day records are summarized into `S.school.record`.


## v7.2 phase 2 — inventory records
`normalizeInventory()` upgrades old item records in place, deriving defaults from `data.js`:
- Adds `lifecycleType`, `quantity`, `opened`, `remaining`, `slot`, `battery`, `capacity`/`contents`, `progress`/`completions`, `freshUntil`, `timesUsed`, `useLog` and `origin` where relevant.
- Finite items that used "condition" as an amount (e.g. makeup) keep that number as `remaining`; their condition is reset to 100.
- Separate legacy records of stackable items (e.g. three snack packs) merge into one stack.
- Only one equipped item per slot is kept (the old category-based rule could leave two tops equipped).
- **Phone:** the phone inventory item becomes canonical; `S.phone.condition/model/owned/battery` are re-derived from it, and an active phone is chosen (`S.phone.activeItemId`). An owned phone with no item record gets one.
- The stale stored `currentValue` field is removed; value is computed live.
- `S.skills` and `S.practiceLog` are added with zeros. Nothing is deleted from ownership history.


## v7.2 phase 3
- `S.education.graduations` is added. Saves aged 6+ that attended kindergarten get a kindergarten graduation (year of the 6th birthday) as a milestone.
- School names that do not match the current stage are renamed (e.g. a primary pupil at "Sunrise Secondary School" → "Sunrise Primary School"). Clubs and teachers carry over only within the same school.
- Open future assessments that share a date are spread to separate school days.
- Registered school-day contests still at the old 10:00 slot move to the 13:00 in-school slot before they start.
- `S.calendarProfile` (region + per-holiday overrides) and `S.holidayLog` are added. Old `holiday-*` flags still prevent re-triggering.
- UI preferences (sub-tab per screen, log drawer open) live under a separate localStorage key `lifeSim_ui`, not in the save.


## v7.2 phase 4
- No save changes. The appearance preference lives in `lifeSim_ui.theme` (`light` | `dark` | `auto` | `life`; default `light`). Existing players without a stored preference start in Light and can switch back to Dark in one click.


## v7.2 phase 5a
- People: `firstName`, `surname`, `fullName`, `nickname`, `roleLabel`, `npcId`, `goals` are added. Legacy names like "Mia • neighbor" keep the given name (Mia) and gain a surname; `name` becomes the full name. Mom/Dad/Grandmother keep their `name` (used for address) and gain a gender-appropriate full name.
- New containers: `S.npcs` (school roster), `S.households`, `S.plans`, `S.elections`, `S.threads`, `S.outcomes`, `S.schoolRep`, `S.family.trust` (default 60), `S.school.tryouts`, `S.familyName`.
- Existing friends count as filled social slots (no duplicate "classmate" is added on load). Existing club positions not on the new ladders are mapped on the next promotion check.


## v7.2 phase 5b
- People gain romance fields lazily (`attraction`, `romanceStage`, `romanceOpen`, `boundaries`), plus `promWith`, `datingNpc`, `giftsReceived` and `movedAway` as they come up. `S.romance.partnerId` is added; the legacy `S.romance.partner` name string is kept for display.
- New containers: `S.neighborhood` (households and reputation, created on load for ages 3+), `S.groups`, `S.rivals`, `S.awards`, `S.scene` (a date or prom night in progress; resumable from the hero), `S.school.prom`, and `S.family.ruleBreaks`.
- The old romance action (which had no partner-age check) is replaced; any existing `S.romance.status` text is preserved.


## v7.3 batch A
- `S.version` → 7.3. `S.zodiac` is recalculated from `S.dob` on load, because the old calculation was wrong for many dates and the sign is now always automatic.
- Messages gain `fromId`. Older messages are linked to the sender by name and role, preferring non-family people; their `from` becomes the person's full name.
- Existing characters keep their birth year. Only new lives start in the current year.


## v7.3 batch A2
- Saves aged 18+ that are still enrolled close the school year on load: awards, a high-school graduation, and `S.school = null`.
- A prom record (`S.school.prom`) is created for the current school year on load for Grades 8–12, if its late-April date is still ahead.


## v7.3 batch G
- The school record gains `yearKey` (the academic year), `reports`, and `semExams`. A save without `yearKey` is tagged with the current academic year and keeps its grade; `S.education.gradeOffset` is stored so the next school year is exactly one grade higher.
- `S.education.highSchoolDone` marks graduation; no school is created afterwards.
- Prom pairings are stored on the NPC records as well as on people, and existing one-way pairings are kept as they are.


## v7.3 batch B–F
- New fields: `S.farm` (today's per-target action counts, reset daily), mood bookkeeping (`S.moodClock` and related), and per-subject study/advanced-exercise day markers. Existing skill and reputation values (0–100) are kept and simply displayed as levels (10 points per level).
- Grades become one-decimal numbers as soon as you study; older integer grades are unchanged.


## v7.3 batch H + I + J
- `S.weather` gains `severity` and a real 5-day `forecast`; old saves get a new forecast at the next day change. New: `S.closures` (closure dates with reasons).
- The school record gains `lateReasons`, `stayHomeAsks`, `expulsionHearing` and `probation`; the school gains `behaviorCalls`, `conf` (conference per semester) and `stayHome`.
- Per-absence caregiver talks now follow the threshold schedule (1 notice, 4 and 7 talks, 10 call, 20 meeting, 35 warning, 45 hearing) instead of a talk after every absence.


## v7.3 batch K + N + X
- People gain `tier`, `battery`, `invites`, `reliability`, `bday` (NPCs get `bday` too), `bdayWished` and `giftsReceived` lazily. New: `S.chats`, `S.callLog`, `S.whiteLies`, `S.outings`.
- Old `S.messages` are copied once into `S.chats` (`S.chatsMigrated`), after being linked to their senders.


## v7.3 batch L + M + P + Q
- New: `S.programs`, `S.trip`, `S.tripOffer`, `S.family.anniversary` and `lastTripOffer`, item `wrapped`, skill `baking`. Catalog additions: bakedCookies, cupcakes, heartCookies (not sold in the store) and heartWrap (Valentine's seasonal).
- The teen curfew changes on load (22:30–24:00 by strictness). Existing plans are unchanged.


## v7.3 batch R + S + T
- People gain `love` ({stage, progress, since}). It is derived from the existing `romanceStage` on first use: crush → one-sided/mutual by attraction, dating → Going out, partner → Boyfriend/girlfriend.
- New: `S.npcCouples` (old `datingNpc` name strings are converted when both NPCs exist and fit the age rules; otherwise cleared), `S.romance.promiseRing / spareRing / livingTogether / married`, `S.housing` (when living together), and child people from starting a family.
- The person history cap is raised from 30 to 60. The UI preference for the removed "development" tab still renders safely.


## v7.3 phase U
- New: `S.businesses` (up to 3 active). An existing `S.stall` stand is converted once (`S.stallMigrated`) and the old stall is switched off so it never sells twice.


## v7.3 phase V1
- New: `S.housing` (default: parents), `S.uniApps` (list, applied, decisions, essay, loan, choice, year), `S.uni` (enrolled, school, year, gpa), `S.finance.uniDebt`, `S.education.degree`. A save in the middle of senior year keeps any list it builds: the application record is tied to the current school year from the start.


## v7.3 phase V2
- An adult's existing simple job (from the adult job list) becomes a career job on the next day (`S.career.job.career = true` with company, level, points, salary, boss and coworker person ids, sick/leave allowances, and a month log). Teen jobs are unchanged.


## v7.3 phase V3
- `S.uniApps` gains `schEssay`, `schApplied` and `scholarship` ({pct, why}). `S.education` gains `honors`, `rankAwardAtGrad` and `tierAidEligible`, stored at high-school graduation (class rank cannot be computed after school ends).
- `S.uni` gains `semKey`, `semGpas`, `semStudy`, `lastSemGpa`, `awardWindow`, `nextSemAid`, `club`, `rankAward` and `tierAid`. A university year already in progress continues: the first semester change closes the current semester.


## v7.3 phase B1
- University data gains brochure fields and new prices. Students already enrolled keep the tuition stored when they enrolled (`S.uni.tuition`). New: `S.uni.concerts` (one annual concert per school year).


## v7.3 phase B2
- `S.uni.major` and `majorChanged`; `S.education.degree.major`. Students already enrolled are asked to declare a major on the University panel. Older degrees without a major get no career bonus.


## v7.3 phase P3
- NPCs and people gain `gender` and `orientation` (derived from the name, plus a stable per-person roll); people gain `loveKnown`. On first load (`S.identityMigrated`), people who are not into the player's gender become not romantically open (not the current partner), and incompatible NPC couples split up.


## v7.3+ Phase 1A
- No new saved fields. The household is derived from the existing `S.housing` (no housing record = living with parents). Messages already in chats keep their kind; only new messages follow the current household.


## v7.3+ Phase 1B part 1
- Contests gain `annual`, `openDate`, `closedDate`, `closedNotified`, `closedNoticeCleared`, `withdrawnDate`; new status values "Upcoming", "Registration Closed", "Withdrawn". `S.school.annual` records which annual events were published per school year. `S.inviteLog` (last 40 days).
- An unregistered contest previously marked "Missed" becomes "Registration Closed" on the next daily tick.


## v7.3+ Phase 1B part 2
- New: `S.ffSession` (kind, label, target, start, status running/paused/done, pause info, days, start snapshot, routine stats, interrupts, background, autoSoft) and `S.routine` (defaults: normal/balanced/mixed). Old saves start with no session and the default routine.


## v7.3+ Phase 2A (checkpoint 2A.2)
- Player: `looks`, `smart` (stable seeded values, generated once), `surname`/`firstName` (from `familyName`/`name`). NPCs: `looks`, `smart` (seeded, once). `S.healthState` gains `condition`, `history`, `lastRecovered` lazily; the legacy `illness` string mirrors whether you are sick.


## v7.3+ Phase 2A (complete)
- No destructive migration. New data is created lazily and once: player `looks`/`smart`/`surname`/`firstName`; NPC `looks`/`smart`; `S.healthState.condition/history/lastRecovered/lastCheckup`; school `nurse`, `nursePasses`, school-day `nurse` records and `'excused'` periods; `S.finance.medicalDebt`; calendar type `medicalFollowUp`; Pharmacy catalog items use the existing finite `remaining` (%) model. Existing `S.health` is preserved. The legacy `healthState.illness` string mirrors whether you are sick ("Unwell"/injury label) for older code paths (work call-in-sick).


## v7.3+ Phase 2B (checkpoint 2B.2)
- Relatives gain `residence` ('home'/'elsewhere'), new ones also `branch` and `roleLabel`; siblings gain `gender` once. Defaults for old saves: parents, siblings and grandparents 'home' (preserving the old implied household), aunts/uncles 'elsewhere'. New role value `younger sibling`. `S.family.sizePref`. Maternal-branch surnames are applied once (`S.familyBranchNamed`) and only to newly generated maternal relatives.


## v7.3+ Phase 2B (complete)
- `S.family.expecting` ({due, announced}), `S.family.lastBaby`, `S.family.lastSibReq`, `S.family.sibChoreHelp`; siblings gain a personality trait lazily; items gain `loanedTo` while lent. No destructive change.


## v7.3+ Phase 3A (checkpoint 3A.2)
- NPCs gain `interests`/`dislikes` (seeded once). People gain `milestones` (typed) — old saves get their importance-3 history moments copied once (`milestonesMigrated`). No other data changes.


## v7.3+ Phase 3A (checkpoint 3A.3)
- Stored tiers Friend / Good Friend → Casual Friend; `respect` defaults to 50; new people met during play get `metDate`/`metVia`/`metAt`; `friendStatus` (Old Friend / Former Friend / Contact) with `statusSince`. Existing people keep no `metDate` (no time gates for them).


## v7.3+ Phase 3A (checkpoint 3A.4)
- People gain `convThreads` (lazy) and `supportEvidence`; `S.threadAskedOn`. No migration needed.


## v7.3+ Phase 3A (checkpoint 3A.5)
- People gain lazily: `observedTraits`, `counterSeen`, `goalsKnown`/`goalsAsked`, `relStatusKnown`, `parentsKnown`, `separatedSince`. New milestone types: acquaintances, casualFriends, closeAgain, faded, reconnected (old types unchanged). No migration needed.


## v7.3+ Phase 3A (checkpoint 3A.6)
- New `S.dev` (origin, evidence, developing, emerging, histories). On every load `migrateDev` de-duplicates `S.personality`/`S.talents` and marks existing entries core / initial **only if unmarked** — idempotent; nothing is added, removed or rerolled.


## Hotfix P1.1
- Family members gain `relation` (and `gender` where implied): set at generation; for older saves converted once from the v7.1 generator's exact labels stored in `name` ("Mom", "Dad", "Grandmother", "Grandfather"). Player children get `relation:'child'`. Idempotent.


## Phase 3B.1 — Canonical Romance State + Reciprocity
- Added deterministic/idempotent `migrateRomance3B1()`. `p.love` is canonical; legacy `p.romanceStage` / `p.attraction` remain compatibility mirrors.
- A legacy plain crush migrates as Player-side one-sided interest unless an explicit mutual or established relationship already exists.
- Existing partner IDs/history are preserved; migration does not randomly create attraction or delete partners.


## Phase 3B.3 migration
- `migrateRomance3B3()` initializes bounded romance interaction-day/commitment-history state and recovers relationship start/end dates from existing canonical/global romance history where available.
- Migration is deterministic and idempotent; it does not create affection, consent, commitment, breakups, reconciliations, or milestones via RNG.
- `formerPartner` remains a historical flag. It no longer overrides a valid reconciled/current canonical romance stage; truly legacy ex records can still infer Ex when no active canonical state exists.
- Existing partner IDs, friendship state, People records, milestones, memories, relationship history, and Decision Ledger records are preserved.

## Phase 3B.4 migration
- Added deterministic/idempotent `migrateRomance3B4()` chained after 3B.3 migration.
- `S.romance.matchmaking` preserves bounded offer/history data, statuses, candidate/matchmaker IDs, reconsideration dates, and normal-date plan links across save/reload.
- Duplicate offer IDs are removed deterministically and dangling `matchmakingOfferId` pointers are cleared; migration does not roll new candidates, attraction, or relationship outcomes.
- Introduced candidates are stable People records. Clear rejection remains remembered; Maybe Later remains eligible only after its recorded reconsideration date.
- NPC orientation compatibility now uses stable `npcId || personId`, preventing a wrapper-ID change during introduction from changing seeded compatibility.



## Phase 3C.2
- `S.chats` remains the canonical direct-message store. Existing message rows are normalized in place with stable `personId`, `senderId`, `receiverId`, game datetime/timestamp, type/kind and read state. No parallel inbox is created.
- `S.callLog` remains the canonical call-history store and is normalized in place with stable person ID, direction, voice/video type, completed/missed/declined/unavailable outcome, duration, datetime and reviewed state.
- Migration is deterministic/idempotent and does not create fake messages, calls, missed-call badges or unread counts. Legacy call evidence may preserve a contact only when a compatible device/history path already existed.
- Dormant pre-device message/call records stay outside current visible communication history after a later device purchase.

## Phase 3C.3 — Kids Smartwatch / family communication migration

- `migrateCommunication3C3()` extends the existing canonical `S.communication` state; it does not create a parallel device/contact store.
- Watch metadata is normalized deterministically and idempotently. No random old locations, messages, calls or unread counts are generated.
- Legitimate family watch contacts retain stable `personId` identity and are initialized only with a usable kids smartwatch path.
- Non-family smartwatch approval remains an H3 Decision Ledger request; repeated migration preserves the same decision/contact identity and does not duplicate records.
- A watch that is stored/broken/unavailable does not become usable merely because an inventory ownership flag exists.
- Historical communication is not backfilled for ages before a valid device/channel existed.
- Existing family/relationship/romance state is not rerolled or rewritten by 3C.3 migration.


## Phase 3C.4 — Group communication state

3C.4 extends the existing `S.communication` state rather than creating a parallel communication store.

Migration behavior:

- normalizes `S.communication.groupChats` keyed by stable existing Friend Group IDs
- stores/normalizes stable member Person IDs and canonical group-message timestamp/read metadata
- derives valid group communication cutoffs from real group/device/contact state rather than fabricating older chat history
- creates no random historical group messages, unread counts, blocked contacts, removed contacts or romantic calls/messages
- preserves `S.chats`, `S.callLog`, People IDs, friendship state, Phase 3B romance state and historical relationship logs
- repeated migration is idempotent and does not duplicate group messages/threads or communication-memory keys
- block/remove status changes communication eligibility only; they do not delete the Person or historical relationship/communication data

Focused save/reload and repeated-migration checks are covered by `qa/t_3c4.py`; the cross-project migration matrix remains reserved for 3C.5.


## Phase 3C.5 — Final migration validation
- No new random migration data is introduced at Phase 3C closeout.
- Repeated `migrateCommunication3C1/2/3/4` remains idempotent across elementary smartwatch, teen smartphone and adult smartphone saves.
- Save/reload preserves stable contact Person IDs, canonical direct-message metadata/read state, call history/missed state, group IDs/member Person IDs, block/remove state, Phase 3B partner state and H3 Decision Ledger records.
- Migration does not synthesize pre-device message/call/group history, fake exchanged contacts, fake unread counts or fake missed calls.
- 3C.5's committed-message delivery fix changes runtime delivery semantics only; it does not create or reroll migration data.


## Phase 4A.1 — School world migration foundation
- `migrateSchoolWorld4A1()` creates deterministic/idempotent `S.schoolWorld` registry metadata (`schemaVersion`, `registryVersion`, canonical `schoolIds`, custom-school hook, school-owned-event capability).
- Canonical school definitions remain source data and are not copied into every save/person record.
- Existing active `S.school` gameplay data is preserved exactly at this checkpoint; no `currentSchoolId` is assigned to Player/NPCs yet.
- Recognized legacy school-name strings on school-owned calendar events can be mapped to stable IDs while retaining the visible legacy name.
- Unknown legacy school names are preserved and never silently substituted with an unrelated canonical school.
- Repeated migration replaces the registry-ID list deterministically and cannot duplicate schools or invent enrollment history.

## Phase 4A.2
- Player current school now migrates to `S.school.currentSchoolId`.
- Known names map to canonical 4A.1 IDs; unknown active names create deterministic minimal custom entities and keep the visible legacy name unchanged.
- `S.education.schoolEnrollments` is initialized conservatively from the current enrollment only; no years of fake historical schooling are fabricated.
- Repeated migration is idempotent: no duplicate enrollment periods, grade entries, or custom schools.
- Existing `S.schoolHistory` remains the legacy yearly attendance/report archive.


## Phase 4A.3 — NPC school migration
- Canonical NPC school identity now lives on `S.npcs[*].currentSchoolId`; People references remain via stable `npcId`.
- Existing school-age NPCs receive one current enrollment only. No fake historical years are synthesized.
- Known legacy school names map to canonical IDs; unknown names use the existing deterministic custom-school identity mechanism.
- Repeated migration preserves the same school assignment and one active history period; it does not duplicate grade/history entries.
- Stage changes close the prior NPC enrollment and open a stage-compatible current school. A stale legacy display name is not reused after a canonical stage transition.
- Adults aging out of K–12 retain closed school history but no impossible current K–12 school.

## Phase 4A.4
- Existing People meeting fields are conservatively normalized into `schoolSocial.meeting`.
- Legacy `introducedBy` is promoted to `introducedById` only when it resolves to a real Person; the legacy field remains compatible.
- Existing historical meeting `schoolId` is preserved across later Player/NPC school transfers.
- School-at-meeting is inferred only when enrollment/current-class evidence supports it; inconsistent legacy `classmate` labels remain school-unknown rather than being guessed.
- Repeated 4A.4 migration is idempotent and does not change friendship tier/status.


## Phase 4A.5 — Final migration validation
- Repeated 4A.1–4A.4 migration is idempotent across elementary, middle, high and adult-with-history saves.
- Player current-school identity/history, NPC current-school identity/history, school-owned event IDs, and structured meeting provenance survive save/reload without duplication or reroll.
- Unknown legacy Player school names keep their visible legacy name and deterministic custom ID; migration does not silently replace them with an unrelated canonical school.
- NPC migration does not create fake years of history or huge school rosters.
- Meeting school provenance remains historical and is not overwritten by later Player/NPC transfers.
- 4A.5 adds no new migration schema or production mutation; it validates the 4A.1–4A.4 migration stack.


## Phase 4B.5 — Final migration validation

- The complete 4B migration chain (`migrateSchoolOrganizations4B1`, `migrateSchoolElections4B2`, `migrateClubLeadership4B3`, `migrateSchoolRecognition4B4`) reaches a stable fixed point across elementary, middle, high and adult-with-history saves.
- Repeated migration does not duplicate organizations, structured role definitions, current holders, role history, canonical elections, club/team leadership selections, Ambassador considerations or role-memory keys.
- Decided election/leadership/Ambassador results remain locked and are never rerolled on load or repeated migration.
- Unique-role conflicts remain deterministic; valid established legacy Player roles are preserved when supported, and ambiguous legacy text does not fabricate an election/appointment history.
- Transfer and school-age exit/graduation close incompatible current school offices while preserving historical role records.
- Class-specific roles retain correct school + grade + class ownership; school-wide roles never migrate across school IDs.
- Save/reload followed by repeated full migration is idempotent in all 4B.5 acceptance and fuzz scenarios.
- 4B.5 adds no new production migration schema; it validates the cumulative 4B.1–4B.4 migration stack.

## Phase 4C final migration validation

Phase 4C migrations remain conservative and current-state focused. Final 4C.5 validation repeatedly ran `migrateSchoolDay4C1`, `migrateSchoolClasses4C2`, `migrateSchoolFacilities4C3`, and `migrateSchoolAfter4C4` and confirmed an idempotent fixed point.

No historical attendance, absence, timetable, or homework records are fabricated. Existing current homework may receive only safe missing metadata already authorized by 4C.4. Save/reload preserves semantic daily-school state; volatile reconciliation timestamps/transitions may refresh on load without changing gameplay state.


## Phase 4D final migration closeout

The complete 4D migration chain (4D.1 canonical event identity, 4D.2 discovery/registration, 4D.3 participation/results and 4D.4 calendar/notification lifecycle) reaches a stable fixed point. Repeated migration does not duplicate canonical events, annual instances, Calendar references or result history and does not fabricate legacy event outcomes.

## Phase 5A.1 — Workbook migration foundation

- Canonical workbook definitions are deterministic catalog data and are not copied wholesale into saves.
- Ownership remains `S.inventoryItems`; no parallel workbook-ownership boolean system is created.
- Existing generic `workbook` items are preserved as legacy items, including any old generic progress, but are not guessed into a subject/grade/level workbook.
- Unknown legacy Inventory records are mapped only when their visible name exactly matches one canonical workbook definition.
- Repeated 5A.1 migration enriches metadata and collapses accidental duplicate physical copies of the same canonical durable workbook without fabricating completion/progress.
- Existing academic stats and prior Advanced Exercise gains are preserved; future Advanced Exercise access follows canonical ownership rules.

## Phase 5A.2 workbook learning migration
`migrateWorkbooks5A2()` preserves explicit canonical workbook progress/completion, keeps learning history independent of physical copies, deduplicates completion history by stable workbook ID, and does not fabricate progress/completion from the legacy generic workbook. Repeated migration is idempotent.


## Phase 5A.3 workbook session migration
`migrateWorkbooks5A3()` adds only canonical per-game-date Advanced Study session state. It preserves 5A.1 ownership and 5A.2 learning records, does not infer historical sessions from legacy exercise counters, does not fabricate progress/results, and normalizes only explicit valid canonical workbook session records. Repeated migration is idempotent and preserves the saved daily-limit date/result.


## Phase 5A.4 workbook integration migration
`migrateWorkbooks5A4()` initializes only integration metadata for teacher recommendations and subject-study evidence. It does not fabricate recommendations, ownership, purchases, exam/competition bonuses, historical sessions, traits or talents. 5A.1 ownership, 5A.2 learning progress/completion and 5A.3 session history remain authoritative and unchanged. Repeated 5A.4 migration is idempotent.

## Phase 5A.5 final workbook migration verification

- Full migration chain `5A.1 → 5A.2 → 5A.3 → 5A.4` reaches a stable fixed point.
- Legacy generic workbook items/progress are preserved without invented subject/grade/level ownership or completion.
- Repeated migration does not duplicate Inventory workbooks, completion history, daily sessions, or recommendations.
- Selling/removing a physical canonical workbook does not erase learned progress/completion.
- No historical session, recommendation, exam support, competition support, trait, or talent evidence is fabricated.


## Phase 5B.1 program migration foundation

`migratePrograms5B1()` enriches the existing `S.programs` records in place. Existing explicit program template, dates, attendance/miss counts, teammates, coach state and lifecycle status are preserved. Stable `programId` values are derived only from explicit legacy template/start/scope evidence. Migration does not invent historical enrollment, instructors, certificates, job history, attendance or skill progress. Existing Calendar `program` events are linked by their current `recId`/program identity rather than recreated as fake history. Accidental duplicate live enrollment for the same canonical offering is marked `Superseded`; repeated migration is idempotent and does not duplicate enrollment or Calendar sessions.


## Phase 5B.2 formal-program attendance migration

`migratePrograms5B2()` enriches existing canonical 5B.1 enrollments in place. It preserves explicit attendance/miss totals and maps the legacy consecutive miss streak without fabricating old session records. Stable lightweight instructor IDs are deterministic from an existing `programId`; existing teammate/participant IDs are preserved and deduplicated. Migration does not invent historical attendance, tryout results, participants, skill gains, completion results or certificates. Repeated migration is idempotent and does not reset the 10-absence streak or duplicate instructor/participant state.


## Phase 5B.3 tutoring / summer-academic migration

`migratePrograms5B3()` enriches only explicit subject-specific 5B.3 academic program records already present in `S.programs`. Subject, format, provider and location metadata are reconstructed from stable academic program IDs. Existing 5B.1/5B.2 enrollment, Calendar, attendance, instructor, completion and participant state is preserved. Migration does not fabricate summer-school/tutoring enrollment, academic gains, peers, Phone contacts, romance history or subject assignments for legacy generic `summerSchool` records. Repeated migration is idempotent.


## Phase 5B.4 summer-employment migration

`migratePrograms5B4()` only normalizes explicit canonical 5B.4 employment records and tags legacy summer-job program records conservatively. It preserves paid-shift IDs, attendance, performance, manager/coworker lightweight identity, dates and Calendar links. It does not fabricate applications, jobs, shifts, wages or workplace history, does not repay completed shifts, and does not rewrite younger legacy side-hustle history into standard age-16 employment. Summer-end completion is intentionally handled by the real daily lifecycle rather than migration, so loading a save cannot itself fabricate an employment ending. Repeated migration is idempotent.

## Phase 5B final migration closeout

The cumulative Phase 5B migration chain (`migratePrograms5B1`, `migratePrograms5B2`, `migratePrograms5B3`, `migratePrograms5B4`) reaches a semantic fixed point across elementary, middle-school, Summer-academic teen and working-teen saves.

Repeated migration does not duplicate canonical enrollments, Calendar sessions/shifts, instructors, participants, completion records or paid-shift IDs; it does not reset attendance/consecutive absences, repay wages, reroll resolved eligibility/permission/tryout/employment results, or fabricate program/job/social history. Useful legacy activity and skill state remains preserved conservatively. Daily lifecycle transitions such as end-of-summer employment closure remain owned by the real game-day tick rather than migration/load.

5B.5 adds no new migration schema; it validates the 5B.1–5B.4 migration stack after the final Fast Forward integration fix.

## Phase 5C.1 — Seasonal Activity Foundation

`migrateSeasonalActivities5C1()` initializes and normalizes only explicit Phase 5C seasonal state.

Migration does not infer ordinary legacy outings into canonical seasonal activity history. It does not fabricate old invitations, RSVP results, parent permission outcomes, romantic memories, equipment ownership or activity skill history.

Existing `S.plans`, Calendar events, People relationships, Inventory and family-trip state remain authoritative. Plans are only marked as Phase 5C seasonal plans when they already contain a valid explicit `seasonalActivityId`.

Repeated migration deduplicates explicit RSVP/history records deterministically and reaches a fixed point.

## Phase 5C.2 migration
`migrateSeasonalActivities5C2()` initializes only explicit 5C.2 runtime state (`rentals`, `sunLog`) and registers the canonical sunscreen catalog entry. It does not fabricate prior outings, sunburns, rentals, skills, permission outcomes, romantic memories, or permanent equipment ownership. Repeated migration deduplicates temporary rental records and reaches a fixed point.
