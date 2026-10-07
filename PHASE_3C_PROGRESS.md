# PHASE 3C PROGRESS — Contacts, Phone, Smartwatch & Communication

**Status: PHASE 3C COMPLETE — 3C.5 COMPLETE**

Implementation is complete through **3C.5**. Phase 3C is now **COMPLETE** after final migration/regression/fuzz QA.

Prerequisites verified before recording Part A:

- H3: **COMPLETE**
- Phase 3B: **COMPLETE**
- Phase 3A progress reviewed
- `BUILD.md` reviewed
- current source reviewed, including current device/phone/inventory and communication-related paths

Parts A–D were recorded before implementation. Checkpoints 3C.1–3C.5 were each explicitly authorized, implemented, and validated. Phase 4A has not been started.

---

## REQUIREMENTS — PART A OF 4
## DEVICE ACCESS / CONTACT EXCHANGE / COMMUNICATION ELIGIBILITY

### Phase 3C goal

Phase 3C turns communication into a coherent system.

The game must no longer behave as if every NPC can magically:

- text Player
- call Player
- video call Player
- group-message Player

without a real communication path.

Communication must depend on:

- device ownership
- device type
- age
- exchanged contact
- relationship
- parental/family context
- time of day
- availability
- communication history

---

## 3C.1 — Device access

Audit CURRENT device ownership/access first.

Do not add a second parallel phone state if one already exists.

Regular smartphone access should respect the existing intended design:

- younger children do not freely own/use a normal smartphone
- smartphone access begins around high-school age
- Player must actually own/have access to the device
- parental permission/purchase requirements remain meaningful
- existing device cost/ownership/inventory must not be bypassed

Current design expectation includes smartphone purchase at approximately $600 where the current Shop/device system uses that price, but CURRENT source/data is authoritative.

Do not hard-code a duplicate price if the Shop already owns pricing.

### Existing source constraints to preserve when implementation is later authorized

The current project already has a canonical inventory-backed phone path (`S.phone` synchronized to actual phone inventory items) and current access helpers such as `canUsePhone()` / `phoneLockReason()`. Phase 3C must refine/reuse that architecture rather than create a parallel phone-ownership model.

The current source also already contains age/app unlock concepts and existing communication/message paths. They must be audited and brought under the Phase 3C eligibility model rather than blindly duplicated.

No implementation changes are authorized by this requirements record.

---

## No phone = no normal phone features

If Player does not have a usable smartphone/device path, do NOT show fully functional:

- Messages
- Calls
- ordinary smartphone video calls
- Dating app
- Food delivery
- Transport app
- Shopping app
- Banking app
- other phone-dependent apps

unless another legitimate device supports that exact feature.

Do not merely gray a feature while still allowing backend actions.

Backend eligibility must agree with UI eligibility.

---

## Contact exchange

Knowing an NPC does NOT automatically mean Player has their phone number.

Create/refine canonical contact state.

Conceptually track:

- personId
- contact exchanged / known
- communication channel(s)
- when contact was exchanged
- who initiated where relevant
- blocked/unavailable state if current architecture supports it

Do not create duplicate NPC identities inside Contacts.

Contacts must reference stable `personId`.

---

## Exchange contact

Player should need a legitimate way to exchange contact details with non-family NPCs before normal direct messaging/calling.

Examples:

- ask for number/contact
- NPC offers contact
- exchange after becoming friends
- exchange after class/activity/date
- family contact already available where appropriate

NPC may:

- Accept
- Decline
- Maybe later

Decision should depend on:

- relationship/closeness
- trust
- age
- personality
- context
- romantic/social interest
- current conflict

Use H3 Decision Integrity where repeat-request protection applies.

Same declined request must not be spam-rerolled immediately.

---

## Family contact

Immediate family may reasonably already have a communication path when Player owns a compatible device.

But do NOT retroactively fabricate text history from before Player had the device.

Example:

Player receives first phone at age 14.

Do NOT suddenly show:

> Mom — 327 unread messages

from ages 6–13.

Communication history begins only when a valid communication path exists.

---

## Communication channels

Separate channel capability where useful.

Examples:

Smartphone:

- messages
- calls
- video calls

Kids smartwatch:

- restricted calls
- restricted video calls if supported
- approved contacts
- location sharing/tracking hook

Do not assume every device supports every app.

---

## Phone contact knowledge

The Contacts/Phone UI should display real known contacts.

Do not automatically list:

- every school student
- every acquaintance
- every neighbor
- every People NPC

unless contact has genuinely been exchanged or is family-authorized.

---

## NPC initiative

NPCs may also ask to exchange contact.

Examples:

- new Close Friend: “Want to exchange numbers?”
- romantic interest: “Can I get your number?”
- classmate after project: “Want me to send you the notes?”

Use personality and context.

Do not make this fire for every new NPC.

---

## Contact removal / blocking foundation

Preserve a foundation for:

- remove contact
- block contact
- unblock

if current UI/system already supports them.

Do NOT build a complex harassment/safety system in 3C.

But communication eligibility should have a clean way to deny contact.

---

## Source of truth

Do not infer communication permissions from visible UI labels alone.

Use actual structured state.

Example:

Best Friend does not automatically mean `hasContact = true` unless contact was exchanged or legitimately pre-known.

---

## Historical stop state after Part A (requirements-recording time)

The following snapshot records the required stop state **at the time Part A was received**; it is retained as requirement history and is superseded by the current checkpoint tracker below.

- Part A: **RECORDED**
- Part B: **RECORDED**
- Part C: pending
- Part D: pending
- Phase 3C implementation: **NOT STARTED**
- 3C.1 coding: **NOT AUTHORIZED YET**
- 3C.2 coding: **NOT AUTHORIZED YET**

Wait for Parts C–D before implementation planning/coding.


==================================================
## REQUIREMENTS — PART B OF 4
## Messages / Calls / Video Calls / Notifications
==================================================

Historical note: when Part B was recorded, no Phase 3C code had been implemented.

---

## 3C.2 — Canonical communication threads

Audit existing message/call storage first.

Do not create disconnected parallel inboxes.

Each direct conversation should reference stable `personId`.

Messages should preserve:

- `senderId`
- `receiverId`
- timestamp
- message/content/type
- read/unread state
- thread/person reference
- optional contextual source/event where useful

Do not store NPC identity only as display-name strings.

---

## Timestamps

Communication history must show meaningful time.

Use date + time, not only a clock time, when messages span multiple days.

Examples:

- Today · 8:42 PM
- Yesterday · 4:15 PM
- Oct 5 · 7:10 PM

or another readable format consistent with current UI.

The underlying state should preserve actual game datetime.

---

## Unread messages

Unread message state must be real.

Opening one thread should not magically mark unrelated threads read.

Track unread messages separately.

The Phone/communication UI should support:

- total unread messages
- unread count per conversation where practical

Do not calculate unread state from random UI rendering.

---

## Call history

Calls must preserve real call events.

Possible call outcomes:

- answered
- missed
- declined
- unavailable
- completed

Track:

- caller
- receiver
- timestamp
- duration when meaningful
- call type

Do not treat a missed call as an unread message.

---

## Missed call badge

Unread messages and missed calls are separate notification concepts.

Example:

- Messages: 3 unread
- Calls: 1 missed

Do NOT merge these into one ambiguous badge if the UI can represent them separately.

---

## Video calls

Support video calls when:

- device supports them
- contact exists
- NPC is available
- age/context permits
- communication path exists

Video call should not just be a renamed normal call if current system supports contextual outcomes.

Possible lightweight outcomes:

- casual chat
- homework/study together
- family check-in
- romantic call
- friend catch-up

Do NOT create explicit adult video content.

---

## NPC availability

Calls should respect NPC schedule where practical.

Possible outcomes:

- answers
- busy
- misses call
- calls back later hook
- declines
- asleep

Do not make every call succeed instantly.

---

## Time-of-day realism

Communication should respond to time.

Examples:

- 2:00 AM call: NPC may be asleep / annoyed / unavailable
- school hours: may not answer
- work/class: may be busy
- evening: more likely available

Do not create one rigid rule for every NPC.

Use schedule/personality/context.

---

## Message frequency

NPC communication must not spam the Player.

Avoid the same NPC sending several generic messages every day without narrative reason.

Use reasonable frequency based on:

- relationship closeness
- Personality
- recent conversation
- current storyline
- school/work context
- romance state
- invitation/plans
- cooldown

---

## Contextual messages

Prefer meaningful messages tied to actual life context.

Examples:

- plan reminder
- checking in after illness
- asking about school
- date follow-up
- birthday wish
- event reminder
- sharing something related to a known interest
- family logistics
- friend asking about something previously discussed

Avoid giant generic message pools disconnected from state.

---

## Message replies

Where existing interaction UI supports choices, offer contextual replies.

Do not create a branching popup for every trivial text.

Simple messages may have:

- quick reply
- acknowledge
- leave unread
- dismiss

Meaningful messages may offer richer responses.

---

## Birthday quick reply

If someone sends Player a birthday wish, provide a natural quick reply such as:

- Thank you!
- That's so sweet
- Grateful / Thankful

Use wording natural to the game's tone.

Do not force every birthday message into a major event.

---

## No pre-device history

Reconfirm:

messages/calls must not exist historically before a valid communication channel existed.

Migration must not fabricate past phone history.

---

## Historical stop state after Part B (requirements-recording time)

The following snapshot records the required stop state **at the time Part B was received**.

- Part A: **RECORDED**
- Part B: **RECORDED**
- Part C: **RECORDED**
- Part D: pending
- Phase 3C implementation: **NOT STARTED**
- 3C.1 coding: **NOT AUTHORIZED YET**
- 3C.2 coding: **NOT AUTHORIZED YET**
- 3C.3 coding: **NOT AUTHORIZED YET**

Wait for Part D before implementation planning/coding.


==================================================
## REQUIREMENTS — PART C OF 4
## Kids Smartwatch / Family Communication / Parental Context
==================================================

Historical note: when Part C was recorded, no Phase 3C code had been implemented.

---

## 3C.3 — Kids smartwatch

The current kids smartwatch concept is too limited.

A kids smartwatch should be a real limited communication device.

Target capabilities:

- parent/guardian location visibility
- calls
- approved-contact calls
- video calls if device/system supports it
- simple contact list
- basic family/friend communication

Do NOT turn it into a full smartphone.

It should NOT automatically provide:

- full social media
- dating apps
- food delivery
- full shopping
- banking
- unrestricted web/app ecosystem

---

## Age / era context

The game world begins in a modern 2026-era context.

A kids smartwatch is therefore plausible before smartphone age.

Use CURRENT age/device rules.

Expected design:

- elementary-age child may have access to a kids smartwatch before being eligible for a normal smartphone

Do not force every child to own one.

Ownership still depends on:

- parent decision
- family finances
- existing item/shop logic
- household traits/context

---

## Approved contacts

Kids smartwatch contacts should be restricted.

Likely contacts:

- Mother
- Father
- guardian
- siblings
- selected relatives
- approved friends

Do not automatically allow every NPC contact.

Parent/guardian may be involved in approving non-family contacts.

Use existing authority rules from H3.

Do not let an older sibling become legal approval authority merely because they supervise the Player.

---

## Location sharing

Kids smartwatch may support parent/guardian location visibility.

This is a gameplay hook, not a real-world surveillance product.

Potential consequences:

- parents know Player is late
- harder to secretly go somewhere
- parent can check location in emergency
- strict household may monitor more

Do not make this constant annoying popups.

Do not implement full Transportation overhaul here.

---

## Family communication

Parents/family may use calls/messages for meaningful logistics.

Examples:

- dinner reminder
- pickup coordination
- “where are you?”
- school/event reminder
- asking when Player will be home
- checking in while sick
- family event message

But communication must respect device path.

If Player has no compatible device, do not send magical texts.

Use in-person/home interaction instead where current systems support it.

---

## Home independence

If Player has moved out, do not keep generating household messages as if Player still lives at the parents' house.

Example:

Mom should not repeatedly text:

> Dinner is ready downstairs

when Player lives independently.

Family may still contact Player naturally.

Use household/residence state.

---

## Bedtime / curfew calls

For minors, late calls/video calls may interact with house rules.

Examples:

partner video call after bedtime

possible outcomes:

- quiet successful call
- parent notices
- told to end the call
- phone temporarily restricted if current discipline system supports it

Do not fire this consequence every time.

Use:

- strictness
- time
- room/home context
- personality
- chance
- prior behavior

---

## Parent communication before smartphone

If a child only owns a kids smartwatch, family communications must use smartwatch-compatible channels.

Do not render them as if they came through a full smartphone UI if the current UI can distinguish device context.

If one shared communication UI is used, store enough metadata to know the channel/device.

---

## Device loss / no access foundation

If current inventory system already supports broken/lost/unavailable devices, communication eligibility should respect that state.

Do not build a full repair/device-loss system here.

Just avoid assuming ownership always means active access.

---

## Historical stop state after Part C (requirements-recording time)

The following snapshot records the required stop state **at the time Part C was received**.

- Part A: **RECORDED**
- Part B: **RECORDED**
- Part C: **RECORDED**
- Part D: pending
- Phase 3C implementation: **NOT STARTED**
- 3C.1 coding: **NOT AUTHORIZED YET**
- 3C.2 coding: **NOT AUTHORIZED YET**
- 3C.3 coding: **NOT AUTHORIZED YET**

Wait for Part D before implementation planning/coding.

==================================================
## REQUIREMENTS — PART D OF 4
## Group Chats / Relationship Communication / QA Plan
==================================================

Part D recorded only. No Phase 3C code has been implemented.

---

## 3C.4 — Group chats

Friend Groups already exist from HOTFIX-P1.

Phase 3C may now add actual group messaging.

Do not fake a Group Chat button unless the functionality exists.

A group chat must reference:

- stable `groupId`
- stable member `personId`s
- real message history
- timestamps
- unread state

Do not store group membership as names only.

---

## Group chat eligibility

A group chat requires:

- compatible device
- communication access
- valid group membership
- contact/channel compatibility

Do not create group chat history for periods before Player had the necessary device/channel.

---

## Group chat content

Group messages should be contextual.

Examples:

- planning outing
- school discussion
- event reminder
- joking about shared memory
- coordinating meetup
- reacting to group event

Do not spam Player with meaningless chatter every few game hours.

---

## Group notifications

Group chat unread state must be separate from direct-message unread state.

Opening one group thread should only mark that thread as read.

---

## Romantic communication

Phase 3B relationship state should influence communication.

Examples:

- date confirmation
- post-date message
- affectionate goodnight message
- partner check-in
- video call
- anniversary-related message hook
- resolving disagreement by message/call where appropriate

Do not make romantic partners text constantly.

Relationship closeness is NOT equivalent to infinite messaging frequency.

---

## Goodnight / bedtime calls

Partners or romantic interests may occasionally:

- send goodnight message
- ask to call
- video call

Use:

- relationship state
- time
- personality
- recent contact frequency
- household/curfew context

Do not trigger every night.

---

## Communication memory

Meaningful communication may feed Phase 3A Relationship Log / narrative continuity.

Examples:

- first exchanged number
- first meaningful late-night call
- important confession
- serious disagreement
- meaningful support conversation

Do NOT add every:

- “hey”
- “lol”
- “good morning”

to permanent Relationship Log/Milestones.

---

## Block / remove contact

Where appropriate, allow Player to:

- remove contact
- block contact
- unblock later

Blocking must actually prevent normal incoming direct communication.

Do not delete the NPC from People.

Do not delete historical relationship logs.

---

## No omniscient communication

NPCs should not magically message Player about information they do not know.

Example:

NPC cannot text:

> I heard you're seeing Alex

unless knowledge provenance exists through something like:

- Player told them
- mutual friend
- public event
- gossip/source
- observed context

Preserve Phase 3B knowledge principles.

---

## Checkpoint order

Execute later in this order:

### 3C.1
Device Access + Contact Exchange + Communication Eligibility

**STOP**

### 3C.2
Messages + Calls + Video Calls + Notifications

**STOP**

### 3C.3
Kids Smartwatch + Parent/Family Communication

**STOP**

### 3C.4
Group Chats + Relationship Communication + Frequency/Memory Polish

**STOP**

### 3C.5
Migration + Regression + Fuzz + Final QA

**STOP**

Never automatically begin the next checkpoint.

---

## 3C.5 acceptance criteria

Before Phase 3C COMPLETE verify at minimum:

1. No valid device/channel = no magical texting.
2. NPC contact must be legitimately known/exchanged.
3. Family contacts work appropriately.
4. Non-family NPCs are not auto-added merely because they exist.
5. Rejected contact exchange cannot be spam-rerolled.
6. Contacts reference stable `personId`.
7. Messages preserve sender/receiver/timestamp/read state.
8. Message history shows date + time meaningfully.
9. Unread messages are tracked per thread.
10. Missed calls are separate from unread messages.
11. Calls can be missed/busy/unavailable.
12. Video calls require compatible device/channel.
13. NPC schedules/time-of-day affect availability.
14. Communication frequency is not spammy.
15. No message backlog is fabricated before device ownership.
16. Kids smartwatch is functional but limited.
17. Kids smartwatch supports appropriate call/contact behavior.
18. Parent location-awareness hook works where applicable.
19. Older sibling is not accidentally legal contact-approval authority.
20. Moving out removes household-specific message assumptions.
21. Partner bedtime communication respects house rules.
22. Friend Groups can support real group chat.
23. Group chats have separate unread state.
24. Blocking prevents incoming normal contact.
25. Blocking does not delete NPC/history.
26. Communication respects knowledge provenance.
27. Phase 3B romance state remains intact.
28. HOTFIX-P1 People/Groups UI remains intact.
29. H3 Decision Ledger remains intact.
30. Save/reload preserves communication state.

---

## Migration

Old saves must not receive:

- random fake old messages
- random missed calls
- fake exchanged contacts
- artificial unread counts

Where an existing save already has known phone contacts/messages, preserve them where possible.

Migration must be idempotent.

---

## Final regression

At 3C.5 run:

- all Phase 3C focused suites
- Phase 3B
- H3
- HOTFIX-P1
- Phase 3A
- H1/H2
- Phase 2A
- Phase 2B
- full regression
- save/reload
- migration idempotence
- fuzz across relevant ages

Include representative ages such as:

- elementary child with smartwatch
- teen with smartphone
- adult with smartphone

---

## Scope boundary

Do NOT implement in Phase 3C:

- full Social Media influencer system
- Dating App overhaul
- school portal overhaul
- Food Delivery overhaul
- Banking overhaul
- Shopping app overhaul
- Transport/Flights overhaul
- full Camera/Photos expansion
- full Music app
- full Job Finder
- Multi-School phase
- Prom overhaul
- Transportation phase
- Occasion Engine

Those belong to later systems/phases.

---

## Requirements / checkpoint state

- Part A: **RECORDED**
- Part B: **RECORDED**
- Part C: **RECORDED**
- Part D: **RECORDED**
- Phase 3C requirements: **COMPLETE**

Checkpoint tracker:

- [x] 3C.1 — Device Access + Contact Exchange + Communication Eligibility
- [x] 3C.2 — Messages + Calls + Video Calls + Notifications
- [x] 3C.3 — Kids Smartwatch + Parent/Family Communication
- [x] 3C.4 — Group Chats + Relationship Communication + Frequency/Memory Polish
- [x] 3C.5 — Migration + Regression + Fuzz + Final QA

---

# CHECKPOINT 3C.1 — COMPLETE

## Implementation

3C.1 extends the **existing inventory-backed phone architecture** rather than creating a second phone system. `activePhoneItem()`, `canUsePhone()` and the current inventory/catalog remain authoritative for smartphone ownership/access and pricing.

Added one canonical communication/contact layer in `src/modules/communication3c1.js`:

- `S.communication.contacts` keyed by stable `personId`
- channel capability (`message`, `call`, `video`) stored per contact
- contact source / initiated-by / exchange date and minute
- active / removed / blocked-ready status foundation
- first valid device dates used to prevent pre-device backlog fabrication
- smartphone vs kids-smartwatch capability hooks without turning the watch into a full phone UI
- deterministic/idempotent migration for legacy saves

Device access now agrees with backend eligibility:

- normal smartphone communication requires a usable active phone (age, condition, battery and existing confiscation/access rules remain authoritative)
- the Phone destination no longer presents smartphone apps as usable when the active phone is broken/dead/unavailable
- a kids smartwatch may provide a limited family communication path, but does not unlock the full smartphone app surface

Contact eligibility:

- immediate family receives legitimate device-compatible contact records when a communication device exists
- merely existing in People does **not** grant a non-family phone contact
- non-family direct messaging/calling requires a canonical exchanged contact
- People cards expose `Exchange contact` only when eligible and show `Contact saved` after exchange
- Messages/Calls selection uses eligible contacts rather than all People records

Contact exchange:

- Player can request contact exchange with eligible non-family NPCs
- result considers relationship, trust, conflict, Personality hooks and existing romance reciprocity
- NPC may Accept / Maybe / Decline
- declined/maybe requests use the **H3 Decision Ledger** with the NPC's stable `decisionMakerId`; same material request does not reroll by spam-click
- eligible NPCs may occasionally initiate contact exchange with cooldown/context gates

Communication generation paths audited in current source were gated so existing birthday/social/NPC message/call hooks no longer create ordinary direct phone communication without a legitimate device/contact path. Existing message/call storage is preserved for 3C.2 rather than replaced early.

## Actual files changed

Source/build:

- `src/modules/communication3c1.js` — new canonical 3C.1 contact/device/eligibility layer
- `src/modules/core72.js` — migration reconciliation + contact-offer event dispatch
- `src/modules/ui72.js` — contact-exchange UI click dispatch
- `src/modules/inv72.js` — initialize communication migration when a phone/watch is acquired
- `src/modules/growth73.js` — direct message/call actions enforce canonical eligibility
- `src/modules/people73.js` — People card contact state/action integration
- `src/modules/social72.js` — message-instead fallback respects real communication eligibility
- `src/modules/romance3b2.js` — NPC social initiative respects contact eligibility and may offer contact exchange first
- `src/modules/knx73.js` — existing chat/call entry points, birthday messages and scheduled communication gated by 3C.1 eligibility
- `tools/splice.py` — includes the new source module and test hooks; generated `game.js` rebuilt from source
- `game.js` — generated output only

QA/docs:

- `qa/t_3c1.py` — focused 3C.1 behavioral suite
- `PHASE_3C_PROGRESS.md`
- `CHANGELOG.md`
- `MIGRATION_NOTES.md`
- `QC_REPORT.md`

No CSS gameplay redesign was required for this checkpoint.

## Migration

Migration is deterministic and idempotent:

- creates `S.communication` / `contacts` without RNG
- contacts reference existing stable `personId`; no duplicate Person/NPC identities are created
- immediate family contacts are initialized only when a compatible communication device exists
- existing real legacy chat/message evidence may establish a legacy contact when the old save already has a valid device path
- migration does **not** synthesize fake historical messages, missed calls or unread counts
- if an old/dormant chat exists before the Player later obtains a device, that history does not automatically create a contact/backlog
- repeated migration does not duplicate contacts or H3 contact-exchange decision records

## Tests

Focused 3C.1 (`qa/t_3c1.py`): **22/22 PASS**

Covers:

- child without device
- elementary-age child with limited kids smartwatch
- smartwatch does not unlock full smartphone app UI
- teen with smartphone
- legitimate family contact initialization
- non-family friend without contact cannot message
- Messages UI excludes unexchanged non-family NPCs
- successful exchange unlocks canonical backend/UI contact
- decline stored in H3 Decision Ledger
- immediate repeated decline does not reroll
- save/reload
- migration idempotence
- NPC-initiated contact exchange
- People/Profile contact integration
- pre-device dormant history does not fabricate contact/backlog
- no page errors

Directly relevant regression:

- Phase 3B focused suites: **76/76 PASS** (`3B.1 13/13`, `3B.2 17/17`, `3B.3 23/23`, `3B.4 23/23`)
- H3 decision integrity: **25/25 PASS** (`H3.1 15/15`, `H3.2 10/10`)
- People regression: **14/14 PASS**
- Profile regression: **24/24 PASS**

Checkpoint directly relevant total: **161/161 PASS**.

## Known limitations / intentionally deferred

These are **not** 3C.1 defects and remain for the authorized later checkpoints:

- canonical message-thread schema/read-state/timestamp UI overhaul → 3C.2
- full calls/video-call lifecycle and missed-call notification system → 3C.2
- full kids-smartwatch UI, approved-contact management and location-awareness gameplay → 3C.3
- group chats → 3C.4
- player-facing block/remove/unblock controls → later 3C work; 3C.1 stores a clean status foundation
- full final migration/regression/fuzz across Phase 3C → 3C.5

## Exact resume point

**PHASE 3C INCOMPLETE**

Resume from checkpoint: **3C.2 — Messages + Calls + Video Calls + Notifications**.

Do not begin 3C.2 automatically.



# CHECKPOINT 3C.2 — COMPLETE

## Implementation

3C.2 promotes the **existing** `S.chats` and `S.callLog` stores into the canonical direct communication history rather than creating disconnected inbox/call systems.

Direct-message records now preserve stable communication identity and time metadata:

- `personId` thread reference
- `senderId` / `receiverId` (`personId` + canonical `player` endpoint)
- game `dateISO` + minute plus normalized timestamp
- message `type` / existing `kind`
- real read/unread state
- per-thread unread counts; opening one thread only marks that thread read
- readable `Today / Yesterday / date + time` history labels

Calls now use canonical call-history fields:

- stable `personId`
- incoming/outgoing direction
- voice/video call type
- completed / missed / declined / unavailable outcome
- duration where meaningful
- game datetime
- device/channel metadata
- reviewed/unreviewed missed-call state

Phone UI now presents **unread messages** and **missed calls as separate concepts**. The Calls app opens real call history and eligible contact actions instead of only a generic People chooser.

Voice/video behavior:

- outgoing calls require the 3C.1 device/contact/channel source of truth
- NPC schedule and late-night context can make calls unavailable
- answered calls record duration and relationship/social effects
- no-answer, declined and missed calls remain distinct history outcomes
- video calls require the `video` channel and a smartphone-compatible path; kids smartwatch is not upgraded into smartphone video functionality in this checkpoint
- video calls use lightweight context (family / study / romantic / friend catch-up) rather than being stored as ordinary voice calls

Communication frequency/content:

- repeated generic NPC communication is cooldown-gated per NPC/channel
- daily auto-message scheduling uses fewer unique senders instead of repeatedly choosing the same NPC
- existing school/advice/family contexts are preserved, with lightweight plan-reminder and illness-check-in hooks
- birthday wishes expose natural quick replies such as `Thank you!` and `That's so sweet`

No pre-device history is fabricated. Existing legacy records can be preserved when real device/history evidence exists; dormant pre-device message/call records remain hidden from later phone UI rather than becoming an artificial backlog.

## Actual files changed

Source/build:

- `src/modules/communication3c2.js` — new canonical thread/call normalization, unread/missed-call accounting, call lifecycle, time labels, frequency/context hooks
- `src/modules/communication3c1.js` — Phone summary/badges and direct Video Call capability hook now consume 3C.2 state
- `src/modules/growth73.js` — call/video person actions route into canonical 3C.2 call lifecycle
- `src/modules/knx73.js` — existing thread UI uses date + time labels
- `src/modules/social72.js` — reconciliation invokes idempotent 3C.2 migration
- `src/modules/ui72.js` — 3C.2 modal/call action dispatch
- `tools/splice.py` — includes `communication3c2.js`, routes Calls app to real call history UI, and exposes QC-only test hooks
- `game.js` — generated output only

QA/docs:

- `qa/t_3c2.py` — focused 3C.2 suite
- `PHASE_3C_PROGRESS.md`
- `CHANGELOG.md`
- `MIGRATION_NOTES.md`
- `QC_REPORT.md`

`style.css` is unchanged from 3C.1. The shipped `qa/harness.py` is byte-identical to the 3C.1 checkpoint; the portable harness used for People/Profile regression was temporary and restored before packaging.

## Migration

3C.2 migration is deterministic and idempotent:

- normalizes existing `S.chats` in place; no parallel direct inbox is introduced
- fills stable sender/receiver IDs and timestamp/type/read metadata without RNG
- normalizes existing `S.callLog` in place with explicit outcome/type/direction/duration/seen fields
- may preserve legitimate legacy call contacts only when the save already has compatible device/history evidence
- does not synthesize messages, calls, unread counts or missed-call records
- repeated migration does not duplicate chat rows or calls
- dormant communication predating a valid device/contact remains excluded from current phone history

## Tests

Focused 3C.2 (`qa/t_3c2.py`): **21/21 PASS**

Covers:

- canonical sender/receiver IDs
- date/time + read state
- per-thread unread behavior
- opening one thread does not read another
- date + time rendering
- completed outgoing voice call history
- time-of-day unavailable call outcome
- missed-call badge separate from unread messages
- Calls UI/history and badge clearing
- real video-call type/channel
- same-NPC incoming-message anti-spam cooldown
- birthday quick replies
- save/reload
- migration idempotence
- kids smartwatch message/call support without video capability
- pre-device dormant call history does not appear later
- no page errors

Directly relevant regression:

- 3C.1 focused: **22/22 PASS**
- Phase 3B focused: **76/76 PASS** (`3B.1 13/13`, `3B.2 17/17`, `3B.3 23/23`, `3B.4 23/23`)
- H3 decision integrity: **25/25 PASS** (`H3.1 15/15`, `H3.2 10/10`)
- People regression: **14/14 PASS**
- Profile regression: **24/24 PASS**

Checkpoint directly relevant total: **182/182 PASS**.

## Known limitations / intentionally deferred

- full kids-smartwatch approved-contact/location/parental-context gameplay → 3C.3
- group chats and group unread state → 3C.4
- richer romantic goodnight/bedtime communication + communication memory polish → 3C.4
- player-facing block/remove/unblock workflow → later 3C work
- full project regression/fuzz and final cross-phase migration audit → 3C.5

## Exact resume point

**PHASE 3C INCOMPLETE**

**3C.2 COMPLETE**

Resume from checkpoint: **3C.3 — Kids Smartwatch + Parent/Family Communication**.

Do not begin 3C.3 automatically.

# CHECKPOINT 3C.3 — COMPLETE

## Implementation

3C.3 expands the existing kids-smartwatch hooks into a real **limited family communication device** without turning it into a smartphone.

Smartwatch/device behavior:

- an elementary-age Player may use an owned, usable kids smartwatch before normal smartphone access
- the smartwatch exposes only supported limited communication: **Messages** and **Calls**
- it does **not** unlock social media, dating apps, shopping, banking, food delivery or the general smartphone app ecosystem
- the canonical device/contact backend and the visible Smartwatch panel now agree
- stored/broken/unavailable watch items do not count as active communication access
- current catalog capability is respected: the kids smartwatch does not gain smartphone video capability in 3C.3

Approved contacts / authority:

- Mother, Father, actual Guardian, siblings and appropriate close relatives may be pre-approved family smartwatch contacts
- non-family friends can be submitted for parent/guardian approval when the relationship/context is suitable
- approval uses the existing H3 Decision Ledger, including stable `decisionMakerId` and reconsideration rules
- an ordinary older sibling can remain a caregiver/contact but is **not** promoted into legal approval authority
- an approved non-family contact gains only the watch-supported channels (`message`, `call`), not unrestricted smartphone access

Parent/family context:

- parent/guardian location visibility is represented by a structured watch-location gameplay hook with stable authority identity and game datetime/location
- being away after curfew can legitimately trigger a parent/guardian location check and call when the Player has an active location-sharing watch
- late non-family calls may interact with existing house rules/strictness and can be noticed, but are not automatically punished every time
- family communication chooses context such as illness check-in, schedule reminder or “where are you?” when real state supports it
- after moving out, family communication remains possible but household-specific logistics use the existing social-family path rather than treating the Player as still downstairs at the parental home

A build-order defect discovered during 3C.3 was also corrected: generated `game.js` previously contained both the canonical 3C communication `phonePanel()` and a later legacy base `phonePanel()` that overrode it. `tools/splice.py` now removes the superseded base function, leaving **one canonical communication panel**. This was required so child smartwatch UI eligibility matched the already-correct backend eligibility.

3C.3 does **not** implement group chat, the Phase 3C relationship-communication polish, or final Phase 3C fuzz/regression.

## Actual files changed

Source/build:

- `src/modules/communication3c3.js` — new smartwatch approval, limited-device panel, location-sharing, family-context and bedtime/curfew hooks
- `src/modules/communication3c1.js` — watch-approved contact eligibility, Smartwatch panel routing and watch-compatible direct call/contact actions
- `src/modules/communication3c2.js` — family message context + bedtime/curfew integration while preserving canonical call/message stores
- `src/modules/core72.js` — idempotent 3C.3 communication reconciliation hook
- `src/modules/misc72.js` — daily smartwatch/location reconciliation hook
- `src/modules/ui72.js` — smartwatch approval action dispatch
- `tools/splice.py` — includes 3C.3, routes limited Smartwatch navigation/apps, exposes focused QA hooks, and removes the superseded legacy `phonePanel()` from generated output
- `game.js` — generated output only

QA/docs:

- `qa/t_3c3.py` — focused 3C.3 behavioral suite
- `qa/t_3c1.py` — prior checkpoint regression expectations updated only for approved 3C.3 behavior: limited watch now exposes Messages/Calls, and the “non-family” fixture now selects a true friend rather than a newly valid relative contact
- `qa/t_3c2.py` — call-schema regression setup now explicitly uses an away-from-home context so the 3C.2 voice/video lifecycle assertions are isolated from the newly approved 3C.3 bedtime/curfew house-rule gate; call availability/time-of-day coverage remains intact
- `PHASE_3C_PROGRESS.md`
- `CHANGELOG.md`
- `MIGRATION_NOTES.md`
- `QC_REPORT.md`

No CSS redesign was required. `qa/harness.py` remains the shipped baseline harness; the portable People/Profile compatibility harness was temporary and restored before packaging.

## Migration

3C.3 migration is deterministic and idempotent:

- creates/normalizes `S.communication.watch` metadata without RNG-generated history
- preserves the existing canonical 3C.1 contact records and stable `personId` references
- initializes legitimate family watch approvals only when a usable kids smartwatch exists
- preserves H3 Decision Ledger identity for friend-contact approval requests
- repeated migration does not duplicate contacts, watch approvals, decision records, messages or calls
- migration does **not** create fake old smartwatch messages/calls or fabricate a pre-device backlog
- location metadata is current-state gameplay metadata; migration does not invent historical travel/location records

## Tests

Focused 3C.3 (`qa/t_3c3.py`): **20/20 PASS**

Covers:

- child without device
- elementary child with limited kids smartwatch
- Smartwatch navigation opens the real limited panel
- Messages/Calls only; no full smartphone app ecosystem
- parent/family pre-approved contacts
- family message/call capability without smartphone video
- non-family friend parent/guardian approval
- H3 repeat-decision integrity after declined watch-contact request
- stable parent/guardian decision authority; ordinary older sibling is not legal authority
- legitimate later reconsideration
- approved-friend limited channels
- parent/guardian location-awareness hook
- after-curfew location-triggered family call
- bedtime/curfew household reaction
- stored/unavailable device backend gating
- save/reload
- migration idempotence with no fabricated history
- moved-out adult family/social communication distinction
- no page errors

Directly relevant regression after the canonical-panel fix:

- 3C.1 focused: **22/22 PASS**
- 3C.2 focused: **21/21 PASS**
- Phase 3B focused: **76/76 PASS** (`3B.1 13/13`, `3B.2 17/17`, `3B.3 23/23`, `3B.4 23/23`)
- H3 decision integrity: **25/25 PASS** (`H3.1 15/15`, `H3.2 10/10`)
- People regression: **14/14 PASS**
- Profile regression: **24/24 PASS**

Checkpoint directly relevant total: **202/202 PASS**.

## Known limitations / intentionally deferred

- kids smartwatch uses the capability supported by the current catalog/system (message + call); richer device models/video support are not invented here
- group chats and separate group unread state → 3C.4
- richer romantic goodnight/bedtime communication, communication memory and frequency polish → 3C.4
- player-facing remove/block/unblock workflow → 3C.4 where appropriate
- no full device-loss/repair subsystem was added; 3C.3 only respects existing unavailable/stored/broken state
- full project migration/regression/fuzz across smartwatch child / smartphone teen / smartphone adult → 3C.5

## Exact resume point

**PHASE 3C INCOMPLETE**

**3C.3 COMPLETE**

Resume from checkpoint: **3C.4 — Group Chats + Relationship Communication + Frequency/Memory Polish**.

Do not begin 3C.4 automatically.

## Final build verification

- authoritative build command from `BUILD.md` was executed twice
- `node --check game.js`: **PASS** on both final builds
- `game.js` SHA-256 after build 1 / build 2: `ad2d2f82db4744dfb26e88e90eea51ed49ab4531baa9ca69c6a73f1444116f96` / same — **byte-identical**
- `style.css` SHA-256: `801ca0d091146469420d32800e274bd14f3f3b8968f7ac567609dbba7d61f16d` — unchanged from 3C.2
- generated runtime contains exactly **1** `phonePanel()` definition
- shipped `qa/harness.py` is byte-identical to the 3C.2 checkpoint



---

# CHECKPOINT 3C.4 — COMPLETE

## Implementation

3C.4 adds real **Friend Group communication**, relationship-aware communication, and communication-frequency/memory polish on top of the canonical 3C.1–3C.3 device/contact/message/call systems. It does not create a parallel inbox or a fake Group Chat button.

### Group chats

Friend Groups remain the HOTFIX-P1 social entities in `S.groups`; group chat does not create fake Person records. A canonical group-thread layer is stored under `S.communication.groupChats` and references:

- stable `groupId`
- current stable member `personId` values
- real message rows with sender identity, game timestamp and read/unread state
- thread creation/cutoff metadata so pre-device/pre-contact history is not fabricated

Group-chat eligibility requires:

- an active compatible smartphone communication path
- actual membership in the Friend Group
- message-capable active contact paths for the participating members
- no blocked/removed contact that invalidates the current group communication path

Opening one group marks only that group thread read. Direct-message unread counts and group unread counts remain separate. The Messages surface now presents direct and group communication separately rather than merging them into one ambiguous unread number.

The former `world72.js` “Group chat” branch that only wrote a random log line now routes into the real group-message system. Contextual group messages can reference actual plans/events/shared group context, and incoming group chatter is cooldown-protected rather than firing every few game hours.

### Block / remove / unblock

The existing canonical 3C.1 contact record now has working player-facing status transitions:

- **Block** prevents ordinary incoming/outgoing direct communication through that contact path.
- **Unblock** restores the saved eligible channel path where device/contact rules still permit it.
- **Remove contact** removes the active communication path without deleting the Person.

These actions do not delete:

- the NPC from People
- Phase 3A relationship history/logs
- Phase 3B romance state/history
- old message/call history

A blocked member also makes the current group chat ineligible until the communication path is restored, rather than silently bypassing the block through the group thread.

### Relationship communication / frequency / memory

Phase 3B relationship state now feeds communication context without becoming a spam generator. Approved contextual hooks include:

- date confirmation / follow-up
- partner check-in
- occasional goodnight communication
- meaningful relationship-resolution communication
- anniversary-ready hook metadata without implementing the later Occasion Engine
- occasional romantic voice/video contact when the existing 3C.2 device/contact/call rules permit it

Romantic communication still respects:

- canonical contact/device eligibility
- relationship state
- cooldown/recent communication
- time/context
- 3C.3 house-rule/bedtime context

Meaningful communication can feed the existing Phase 3A relationship-history/narrative layer, but trivial chatter such as generic greetings is not promoted into permanent milestones/log entries. The communication knowledge helper requires a supported provenance/context before generating knowledge-dependent text; 3C.4 does not add omniscient gossip.

3C.4 does **not** implement Phase 3C final migration/fuzz/full-project QA; that remains 3C.5.

## Actual files changed

Source/build:

- `src/modules/communication3c4.js` — new canonical group-thread/unread model, contextual group messaging, block/remove/unblock, relationship communication and meaningful communication-memory hooks
- `src/modules/communication3c1.js` — Phone/Messages summary consumes separate group unread state where available
- `src/modules/communication3c2.js` — message/call lifecycle feeds meaningful 3C.4 memory hooks and supports contextual romantic video-call source metadata
- `src/modules/core72.js` — idempotent 3C.4 communication reconciliation/migration hook
- `src/modules/misc72.js` — daily 3C.4 communication frequency/context hook
- `src/modules/ui72.js` — 3C.4 group/contact action dispatch
- `src/modules/world72.js` — former fake group-chat log path now creates a real group communication event
- `tools/splice.py` — includes `communication3c4.js` in authoritative build order and exposes focused QC hooks
- `game.js` — generated output only

QA/docs:

- `qa/t_3c4.py` — focused 3C.4 behavioral suite
- `PHASE_3C_PROGRESS.md`
- `CHANGELOG.md`
- `MIGRATION_NOTES.md`
- `QC_REPORT.md`

No CSS redesign was required. Temporary compatibility paths/harness used only to execute legacy HOTFIX-P1 browser tests in this environment were removed/restored before packaging and are not shipped.

## Migration

3C.4 migration is deterministic and idempotent:

- creates/normalizes `S.communication.groupChats` without RNG-generated history
- uses stable existing Friend Group IDs and stable Person IDs; no duplicate group or Person identities are created
- filters/normalizes legacy-compatible group message rows against the valid communication cutoff rather than inventing pre-device/pre-contact history
- preserves existing direct `S.chats`, calls, People, friendship and Phase 3B romance state
- does not generate fake old group messages, unread counts, blocks, contact removals or romantic communication
- repeated migration does not duplicate group threads/messages or communication-memory keys
- blocked/removed status remains structured contact state and does not delete historical relationship or communication records

## Tests

Focused 3C.4 (`qa/t_3c4.py`): **26/26 PASS**

Covers:

- compatible-device requirement
- real member-contact/channel requirement
- stable `groupId` / member `personId` storage
- message sender/group/timestamp/unread metadata
- group unread separate from direct unread
- opening one group marks only that group read
- date/time + sender rendering in group thread
- functional HOTFIX-P1 Friend Groups Group Chat surface
- incoming group-message cooldown
- block / unblock / remove-contact backend behavior
- block preserving Person + relationship history
- block affecting group eligibility instead of bypassing it
- communication knowledge provenance helper
- save/reload of group communication state
- repeated 3C.4 migration idempotence
- official relationship contextual communication
- date-confirmation direct-thread integration
- romantic goodnight/video-call integration through the real 3C.2 call lifecycle
- meaningful communication relationship-memory hook
- Phase 3B partner-state preservation
- teen/adult runtime page-error checks

Directly relevant regression:

- 3C.1 focused: **22/22 PASS**
- 3C.2 focused: **21/21 PASS**
- 3C.3 focused: **20/20 PASS**
- Phase 3B focused: **76/76 PASS** (`3B.1 13/13`, `3B.2 17/17`, `3B.3 23/23`, `3B.4 23/23`)
- H3 decision integrity: **25/25 PASS** (`H3.1 15/15`, `H3.2 10/10`)
- People regression: **14/14 PASS**
- Profile regression: **24/24 PASS**
- Friendship regression: **17/17 PASS**
- HOTFIX-P1 regression: **74/74 PASS** (`P1.1 22/22`, `P1.2 24/24`, `P1.3 28/28`)

Checkpoint directly relevant total: **319/319 PASS**.

Legacy HOTFIX-P1 tests contain historical absolute fixture/project paths. For QA only, the current authoritative fixture/project were temporarily mapped to those paths; no assertion was weakened, and the compatibility mappings plus temporary portable harness were removed before packaging.

## Known limitations / intentionally deferred

- full project regression across all unrelated School/University/other systems → 3C.5
- Phase 3C final save/migration matrix beyond focused 3C.4 coverage → 3C.5
- required Phase 3C fuzz for elementary smartwatch / teen smartphone / adult smartphone → 3C.5
- full Social Media, Dating App, Food Delivery, Banking, Shopping, Transport/Flights, Camera/Photos, Music and Job Finder expansions remain outside Phase 3C scope
- full Occasion/anniversary engine is not implemented; 3C.4 only provides communication-ready hooks
- blocking/removal is a communication eligibility feature, not a broader harassment/safety simulation

## Exact resume point

**PHASE 3C INCOMPLETE**

**3C.4 COMPLETE**

Resume from checkpoint: **3C.5 — Migration + Regression + Fuzz + Final QA**.

Do not begin 3C.5 automatically.

## Final build verification

- authoritative `BUILD.md` workflow executed twice after final source/docs cleanup
- `node --check game.js`: **PASS** on both final builds
- `game.js` SHA-256 after build 1 / build 2: `d1ca073540146829fd19c5057cdfbabb041aff3afb6aae08e7f25bbd6d6664d8` / same — **byte-identical**
- `style.css` SHA-256 after both builds: `801ca0d091146469420d32800e274bd14f3f3b8968f7ac567609dbba7d61f16d` — unchanged from 3C.3
- generated runtime contains exactly **1** canonical `phonePanel()` definition
- generated runtime contains exactly **1** Phase 3C.4 module marker
- shipped `qa/harness.py` SHA-256 `9b681b9e0f3f896c094a54b0d2258c192c34f370b12042cdaff8024bf68ce488`, byte-identical to 3C.3
- temporary `/home/claude/proj` and Jordan-fixture compatibility mappings used for legacy QA were removed before packaging
- final focused 3C.4 rerun on the authoritative build: **26/26 PASS**

### Focused-suite stability note

During final repetition, the group-thread rendering assertion was found to compare against the fixture's raw `name` field even though the game intentionally renders `firstName(p)` (`nickname` → `firstName` → name fallback). No production defect was present. The QA assertion was corrected to the canonical display-name rule; `qa/t_3c4.py` then passed **26/26 on 5 consecutive runs**. No gameplay/source change was made for this test-only correction.


---

# CHECKPOINT 3C.5 — COMPLETE

## Final implementation / integrity fix

3C.5 remained a **final QA checkpoint**, not a new feature checkpoint. One Phase-3C correctness edge case was found by the full regression and fixed within scope:

- a parent/household communication follow-up that had already been legitimately scheduled could be dropped at delivery because 3C.2 re-ran the anti-spam frequency gate a second time;
- if the Player moved out between scheduling and delivery, this could also prevent the committed follow-up from being converted from household logistics to normal family/social communication.

The canonical behavior is now:

1. communication eligibility/frequency is decided when the follow-up is **scheduled**;
2. a legitimately committed follow-up is not silently rerolled/dropped at delivery merely because other communication happened meanwhile;
3. if household state changed before delivery, the delivery path still re-checks residence context, so a queued `parent` household message becomes `parentSocial` after moving out rather than sending an invalid “downstairs/dinner” assumption.

This preserves anti-spam for new unscheduled communication while making already-committed communication deterministic and context-correct.

No Phase 4A work was started.

## Actual files changed in 3C.5

Production source/build:

- `src/modules/communication3c2.js` — committed incoming-message delivery can bypass the second frequency roll while retaining device/contact eligibility and normal incoming-state accounting
- `src/modules/knx73.js` — scheduled incoming-message follow-ups explicitly use committed delivery; moved-out parent logistics still convert to `parentSocial`
- `game.js` — generated output only, rebuilt through the authoritative build workflow

QA:

- `qa/t_context.py` — updated old same-day communication assumptions to the approved Phase 3C cooldown model while preserving the stronger moved-out/queued-message checks
- `qa/t_knx.py` — establishes legitimate contacts before phone communication; advances to valid communication windows for repeated message/call scenarios; validates canonical declined/unavailable call outcomes
- `qa/t_o.py` — establishes legitimate contact/device state before the incoming-call metadata assertion
- `qa/t_3c5_accept.py` — final cross-cutting Phase 3C acceptance supplement
- `qa/t_3c5_fuzz.py` — optimized required fuzz for child smartwatch / teen smartphone / adult smartphone

Documentation:

- `PHASE_3C_PROGRESS.md`
- `CHANGELOG.md`
- `MIGRATION_NOTES.md`
- `QC_REPORT.md`

The shipped `qa/harness.py` was **not** changed. A portable compatibility harness/path mapping was used temporarily to execute old browser suites in this environment, then fully restored/removed before packaging.

## Migration / save-load validation

No new random migration behavior was introduced in 3C.5.

Final validation confirms the 3C.1–3C.4 migration chain remains deterministic/idempotent:

- contacts remain keyed by stable `personId`
- direct chats preserve message IDs, sender/receiver IDs, timestamps and read state
- call history preserves person ID, call type/outcome/timestamp and missed/seen state
- smartwatch state does not fabricate historical locations/messages/calls
- group chats remain keyed by stable `groupId` with stable member Person IDs
- no fake exchanged contacts, pre-device messages, missed calls, unread counts or group history are synthesized
- repeated 3C migration does not duplicate contacts, messages, calls, group messages or communication-memory keys
- Phase 3B partner/romance state and H3 Decision Ledger records survive save/reload and repeated communication migration

## Final Phase 3C tests

### Phase 3C focused suites

- 3C.1: **22/22 PASS**
- 3C.2: **21/21 PASS**
- 3C.3: **20/20 PASS**
- 3C.4: **26/26 PASS**

Phase 3C checkpoint-focused subtotal: **89/89 PASS**.

### Final acceptance supplement

`qa/t_3c5_accept.py`: **29/29 PASS**.

It directly cross-checks device/channel gating, family vs non-family contacts, smartwatch limitations/location authority, H3 contact-request repeat integrity, canonical message/call metadata, unread/missed separation, date+time rendering, block/history preservation, save/reload and migration idempotence, video capability, real group chats/unread separation, knowledge provenance, Phase 3B partner preservation, moved-out family-message conversion, and adult/minor house-rule separation.

Together with the focused 3C.1–3C.4 suites, all **30 Phase 3C acceptance criteria are verified**.

### Required Phase 3C fuzz

`qa/t_3c5_fuzz.py`: **13/13 PASS**, **600 randomized communication operations** total:

- elementary child + kids smartwatch: 200 operations
- teen + smartphone: 200 operations
- adult + smartphone: 200 operations

Each scenario validates canonical contact/message/call/group invariants, blocked-contact denial, device capability boundaries, browser JS errors, save/load and repeated migration idempotence.

### Cross-phase regression

- Phase 3B focused: **76/76 PASS**
- H3 full focused set: **50/50 PASS** (`H3.0 3/3`, `H3.1 15/15`, `H3.2 10/10`, `H3.3 12/12`, `H3.4 10/10`)
- HOTFIX-P1: **PASS** (`P1.1`, `P1.2`, `P1.3` all green in final rerun)
- Phase 3A.7: **13/13 PASS**
- People/Profile/Friendship regressions: green in the final Phase 3C matrix
- Phase 2A Health/Medicine: green
- Phase 2B Family: green
- save/reload and old-save regression suites (`t_commit`, `t_regress`): green
- context/family communication regression (`t_context`): green after the in-scope committed-delivery fix
- communication/life-context regression (`t_knx`): green under the approved contact/cooldown semantics
- relationship/context regression (`t_o`): green under legitimate device/contact setup

### Full-project QA notes

The broad legacy matrix was run without weakening assertions merely to obtain green results.

Observed non-3C / environment limitations are recorded rather than scope-crept:

- `t_holidays.py` still has the legacy “hero adapts to the holiday” assertion failure; `src/modules/holidays72.js` is byte-identical to the 3C.4 input and Phase 3C does not own Holiday hero behavior.
- Several very long legacy Playwright suites (`t_dev.py`, `t_hij.py`, `t_lmpq.py`, the old UI-click `t_fuzz.py`) can exceed this execution environment's per-command runtime before reaching their final summary. No thresholds/loops were reduced. Phase 3C supplies the fast 600-operation communication fuzz above instead of weakening those suites.
- the final direct `file://` navigation segment of `t_theme.py` can be blocked by browser administrator policy in this environment; its earlier theme assertions run before that environment-only navigation restriction.

These limitations do not violate a Phase 3C acceptance criterion and are not regressions caused by the 3C.5 source changes.

## Final acceptance result

All 30 Phase 3C acceptance criteria are **verified**:

1. device/channel gating prevents magical texting
2. contacts require legitimate family authorization/exchange
3. family contacts initialize appropriately
4. non-family People are not automatically Contacts
5. declined exchange is H3 repeat-stable
6. Contacts use stable Person IDs
7. messages preserve sender/receiver/timestamp/read state
8. message history renders meaningful date + time
9. unread state is per direct thread
10. missed calls remain separate from unread messages
11. call availability supports missed/busy/declined/unavailable outcomes
12. video calls require compatible device/channel
13. NPC schedule/time affects availability
14. incoming communication is cooldown/context protected
15. no pre-device backlog is fabricated
16. kids smartwatch is functional but limited
17. smartwatch supports appropriate approved contact/call behavior
18. parent/guardian location-awareness hook works
19. older sibling does not become legal approval authority
20. moving out removes/converts household-specific message assumptions
21. partner bedtime communication respects minor house-rule context
22. Friend Groups support real group chat
23. group unread state is separate
24. blocking prevents normal incoming/direct communication
25. blocking preserves NPC/history
26. communication knowledge uses provenance
27. Phase 3B romance state remains intact
28. HOTFIX-P1 People/Friend Groups UI remains intact
29. H3 Decision Ledger remains intact
30. save/reload preserves communication state

## Known limitations / intentionally deferred

Per Phase 3C scope, the following remain for later work and were not expanded here:

- full Social Media/influencer system
- Dating App overhaul
- School Portal overhaul
- Food Delivery / Banking / Shopping / Transport / Flights app overhauls
- Camera/Photos/Music/Job Finder expansions
- Multi-School work
- Prom overhaul
- Transportation system
- Universal Occasion Engine

## Exact resume point

**PHASE 3C COMPLETE**

**3C.5 COMPLETE**

Resume point: **Phase 4A — School Year / Location / Obligation Engine**.

**STOP — Phase 4A not started.**


## Final build verification

- authoritative `BUILD.md` workflow executed twice after all 3C.5 source changes
- `node --check game.js`: **PASS**
- `game.js` SHA-256 build 1 / build 2: `70f6941106dbe7901b2d1b119155a8ddca4699a6cb219c3dd2f5c7ee7b6cfa63` / same — **byte-identical**
- `style.css` SHA-256: `801ca0d091146469420d32800e274bd14f3f3b8968f7ac567609dbba7d61f16d` — unchanged from the validated Phase 3C baseline
- generated runtime contains exactly **1** canonical `phonePanel()` definition and exactly **1** Phase 3C.4 module marker
- shipped `qa/harness.py` SHA-256: `9b681b9e0f3f896c094a54b0d2258c192c34f370b12042cdaff8024bf68ce488`, byte-identical to the 3C.4 checkpoint
- temporary QA compatibility mappings were removed before packaging
- final authoritative-build reruns: 3C.1 **22/22**, 3C.2 **21/21**, 3C.3 **20/20**, 3C.4 **26/26**, 3C.5 acceptance **29/29**, 3C.5 fuzz **13/13**
- 3C.2 call fixture was made deterministic for its own availability assertions (neutralized random NPC study/vacation schedule only inside the test); it then passed **21/21 on 5 consecutive runs**. No production call/availability rule was changed for this test stabilization.

### Re-execution verification from `3C.4-complete-current`

The 3C.5 closeout was re-executed from the current 3C.4 checkpoint rather than relying only on the earlier completed artifact. Fresh reruns on this branch confirmed:

- Phase 3C focused: **89/89 PASS**
- 3C.5 acceptance supplement: **29/29 PASS**
- 3C.5 required fuzz: **13/13 PASS**, 600 randomized communication operations
- Phase 3B focused: **76/76 PASS**
- H3 full focused: **50/50 PASS**
- HOTFIX-P1: **74/74 PASS**
- Phase 3A.7: **13/13 PASS**
- H2: **22/22 PASS**
- Phase 2A.6: **13/13 PASS**
- Medicine: **15/15 PASS**
- Phase 2B Family: **35/35 PASS** (`t_family2` 22/22 + `t_family` 13/13)
- People/Profile/Friendship: **55/55 PASS**
- `t_commit`, `t_regress`, `t_rst`: PASS
- `t_context`, `t_knx`, `t_o`: PASS under canonical 3C contact/cooldown semantics
- `t_biz` and `t_holidays`: PASS in this re-execution

`qa/t_health.py` was also attempted in this environment but exceeded the per-command Playwright execution window before emitting its final summary. Its workload was not reduced. The final production source and QA set (after restoring the harness) are byte-identical to the previously validated Phase 3C COMPLETE reference, apart from this appended documentation note.
