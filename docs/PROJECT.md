# Project source of truth

Central living reference for **Dune: Adventures in the Imperium QoL**. Scope, architecture, status, tests, risks and decisions stay here instead of being distributed across many files.

Last updated: 2026-08-06

## 1. Baseline

- Foundry VTT 13, build 351;
- Dune system id `dune`, version 13.0.1;
- module id `dune-qol`, version 0.8.0;
- public pre-alpha repository;
- English and French interfaces;
- manual validation only, without GitHub Actions;
- substantial AI-assisted development with human review responsibility.

## 2. Principles

1. Extend the upstream system without modifying or forking it.
2. Keep automation explicit, visible and reversible where practical.
3. Use an active GM for authoritative multiplayer changes.
4. Preserve normal Dune play when the module is disabled.
5. Prefer small workflows, public APIs and minimal dependencies.
6. Do not reproduce commercial rules text or copyrighted assets.
7. Support English and French for every user-facing workflow.
8. Record meaningful decisions with the implementing change.
9. Never claim validation that was not performed.

## 3. Implemented workflows

### Guided tests

Status: **core workflow manually validated**.

- Actor-sheet and optional Token-controls launchers;
- optional hiding of the native Dune roller;
- Skill, Drive, Focus, difficulty, dice, complication range and Determination;
- extra-die source and cost;
- success, failure, Momentum and complications;
- readable structured ChatMessage results.

### Momentum, Threat and Complications

Status: **GM paths manually validated; player paths still need broader multiplayer validation**.

- explicit shared-pool application with history, duplicate protection and Momentum cap;
- one upstream `trait` Item per resolved complication;
- temporary by default, persistent when chosen;
- provenance and rollback when source recording fails.

### Temporary Trait manager

Status: **manually validated in 0.6.0**.

- Actor-sheet manager for temporary Traits;
- checkbox-based promotion or deletion;
- active-GM authority for player actions;
- history and preserved complication provenance.

### Test requests

Status: **individual and group workflows manually validated through 0.7.0**.

- individual requests from Actor sheets;
- group requests from Token controls;
- Skill and Drive may be imposed or left free;
- private ChatMessage plus persistent User inbox;
- independent completion state per recipient;
- request completes only after a matching result exists;
- completed or cancelled requests no longer display **Open test**.

### Group tools

Status: **manually validated in 0.7.0**.

- group request dialog with player checkboxes and explicit Actor selection;
- global read-only Trait overview with filters and sheet navigation.

### Party Sheet

Status: **implemented in 0.8.0; Foundry validation required**.

Accessible to GM and players from Token controls. It is a persistent ApplicationV2 window with four tabs.

**Overview**:

- Momentum and Threat when the upstream pool adapter is available;
- House name and information;
- overall party status;
- shared objectives and notes;
- world-persistent GM editing.

**Characters**:

- all compatible Actors owned by non-GM users;
- automatic primary/supporting classification from assigned characters, overridable by the GM;
- owner list, portrait, group role and individual resources;
- direct sheet opening, Guided test launch and token selection.

**Traits**:

- all Traits grouped by Actor;
- GM checkbox selection across multiple Actors;
- bulk promotion of temporary Traits;
- confirmed bulk deletion of temporary or persistent Traits;
- aggregate chat history and complication provenance updates;
- deletion never reopens a resolved complication.

**Requests**:

- history and current table of visible test requests;
- pending/completed/cancelled filters;
- navigation to request and result messages;
- GM cancellation of pending requests with inbox cleanup.

The Party Sheet is now the central UI for future combat, supporting-character and campaign workflows.

## 4. MVP scope and planned work

The MVP now explicitly includes:

1. Party Sheet validation and visual fixes;
2. request history and pending-request tracking;
3. cross-Actor Trait actions;
4. combat and initiative management integrated with Foundry Combat Tracker;
5. final multiplayer, roll-mode, Dice So Nice and theme validation;
6. versioned GitHub release and installation manifest cleanup.

### Next functional block — combat manager

- active side;
- Actors that already acted;
- pass or retain initiative;
- side change;
- round reset;
- optional Momentum or Threat cost;
- action history;
- token and Combat Tracker integration;
- Party Sheet combat tab.

### After MVP

- supporting-character handoff and deeper control conveniences;
- token HUD conveniences;
- conflict zones and Asset movement;
- House projects and campaign clocks;
- public module API and flag migrations;
- guided character creation as the final major workflow.

## 5. Architecture

```text
scripts/
├── dune-qol.mjs
├── settings.mjs
├── localization.mjs
├── adapters/
│   └── dune-pools.mjs
├── domain/
│   ├── dune-test.mjs
│   ├── pool-plan.mjs
│   └── complication-resolution.mjs
├── features/
│   ├── guided-test.mjs
│   └── guided-test-ui.mjs
└── services/
    ├── pool-transactions.mjs
    ├── complication-traits.mjs
    ├── temporary-traits.mjs
    ├── test-requests.mjs
    ├── test-request-completion.mjs
    ├── group-tools.mjs
    └── party-sheet.mjs
```

- `domain/`: pure calculations;
- `adapters/`: upstream integration points;
- `services/`: permissions, sockets, persistence and coordinated workflows;
- `features/`: test behavior and render-time UI.

Current persistent namespaces:

```text
flags.dune-qol.guidedTest
flags.dune-qol.poolTransaction
flags.dune-qol.complicationTrait
flags.dune-qol.temporaryTraitManagement
flags.dune-qol.partyTraitManagement
flags.dune-qol.testRequest
flags.dune-qol.testRequestInbox
flags.dune-qol.testRequestResult
game.settings: dune-qol.partyData
```

## 6. Documentation policy

Approved Markdown documents:

- `README.md`;
- `AGENTS.md`;
- `docs/PROJECT.md`;
- `docs/USER-GUIDE.md`.

Do not create separate roadmap, architecture, ADR, TODO, release-note or per-feature manuals without a recorded decision.

## 7. Validation

Run from a complete checkout:

```bash
npm run check
```

### Foundry checklist — 0.8.0

Loading:

- [ ] Foundry displays 0.8.0 after full reload.
- [ ] No initialization error appears.
- [ ] Party Sheet translations and stylesheet load.
- [ ] Party Sheet control appears for GM and players.

Overview and persistence:

- [ ] GM can edit House, status, objectives and notes.
- [ ] Save persists after reload and players see the same values read-only.
- [ ] Momentum and Threat display when available.

Characters:

- [ ] Assigned Actors default to primary and other owned Actors to supporting.
- [ ] GM overrides and roles persist.
- [ ] Resources, owners and portraits display correctly.
- [ ] Open sheet, Test and Select token actions target the correct Actor.

Traits:

- [ ] Traits are grouped by Actor.
- [ ] Promotion works across several Actors.
- [ ] Delete requires confirmation and works across several Actors.
- [ ] History lists affected Actors and Traits.
- [ ] Complication provenance is updated without reopening complications.

Requests:

- [ ] Pending, completed and cancelled requests appear with correct filters.
- [ ] Request/result navigation scrolls to the correct chat message.
- [ ] Cancelling removes **Open test** and cleans an offline recipient inbox.
- [ ] A cancelled request cannot later be completed by a result.

Regression:

- [ ] Guided tests, pools, complications and existing group tools still work.

## 8. Known risks

- Every multiplayer client must load the same module version.
- Party data is a hidden world setting and only GMs may write it.
- Shared-state operations are not fully atomic across clients.
- Group Trait history and source provenance updates are best effort after Item changes.
- Persistent Trait deletion is intentionally available only to the GM and requires confirmation.
- Chat-message history depends on the messages remaining in the world collection.
- Foundry or upstream schema changes require explicit compatibility testing.

## 9. Decision log

All decisions are dated 2026-08-06 unless stated otherwise. Superseded decisions remain recorded.

- **D-0001 — Accepted:** build a separate companion module rather than modifying or forking Dune.
- **D-0002 — Accepted:** use repository `foundryvtt-dune-qol` and module id `dune-qol`.
- **D-0003 — Superseded by D-0017:** initially target unreleased Dune 13.0.2.
- **D-0004 — Amended by D-0018:** keep evolving project knowledge in one central document.
- **D-0005 — Accepted:** record lasting product and technical decisions with the implementing change.
- **D-0006 — Accepted:** disclose substantial AI assistance and retain human responsibility.
- **D-0007 — Accepted:** start without third-party runtime dependencies.
- **D-0008 — Amended by D-0050:** Guided tests, pools, complications, requests, Party Sheet and combat are MVP scope.
- **D-0009 — Superseded by D-0010:** initially use GitHub Actions.
- **D-0010 — Accepted:** keep local validation but disable GitHub Actions.
- **D-0011 — Accepted:** use Foundry core `Roll` plus isolated result calculations.
- **D-0012 — Superseded by D-0023:** initially defer shared-pool mutation.
- **D-0013 — Accepted:** count complications independently from successes.
- **D-0014 — Amended:** store versioned workflow metadata in ChatMessage flags.
- **D-0015 — Superseded by D-0019:** initially launch Guided test only from Token controls.
- **D-0016 — Accepted:** support public development installation from the raw manifest and `main` ZIP.
- **D-0017 — Accepted:** target published Dune 13.0.1.
- **D-0018 — Accepted:** allow one bilingual user guide as the only documentation split.
- **D-0019 — Accepted:** make the Actor sheet the default Guided-test launcher.
- **D-0020 — Accepted:** provide a module-specific English/French setting.
- **D-0021 — Accepted:** hide detected native Dune roller controls by default.
- **D-0022 — Accepted:** opening or rolling failures must never fail silently.
- **D-0023 — Accepted:** require explicit confirmation before shared-pool changes.
- **D-0024 — Accepted:** use the first active GM as authoritative writer for player requests.
- **D-0025 — Accepted:** isolate and feature-detect the upstream pool API.
- **D-0026 — Accepted:** version pool plans and application state in Guided-test flags.
- **D-0027 — Accepted:** enforce pre-funded Momentum purchases and cap Momentum at six.
- **D-0028 — Accepted:** record each successful pool transaction in chat.
- **D-0029 — Accepted:** allow one Actor Trait per complication.
- **D-0030 — Accepted:** use the upstream `trait` Item and `system.temporary` field.
- **D-0031 — Accepted:** record complication resolution and roll back on failure.
- **D-0032 — Accepted:** execute player Trait requests through the active GM.
- **D-0033 — Accepted:** inject complication controls at chat render time.
- **D-0034 — Accepted:** start individual GM requests from the target Actor sheet.
- **D-0035 — Amended by D-0039:** persist requests in chat and a User inbox.
- **D-0036 — Superseded by D-0040:** initially keep GM-selected values editable.
- **D-0037 — Superseded by D-0039:** initially make ChatMessage the primary delivery event.
- **D-0038 — Accepted:** injected sheet links must not use Foundry's native `control` class.
- **D-0039 — Accepted:** use a persistent User inbox as authoritative request delivery.
- **D-0040 — Accepted:** GM-selected Skill or Drive is imposed; Focus remains advisory.
- **D-0041 — Accepted:** request context is optional.
- **D-0042 — Accepted:** complete a request only after a matching result exists.
- **D-0043 — Superseded by D-0050:** combat was initially placed near the end of the roadmap.
- **D-0044 — Implemented in 0.7.0:** group requests use per-recipient Actors and independent states.
- **D-0045 — Accepted:** manage temporary Traits with checkbox-based bulk actions and provenance.
- **D-0046 — Accepted:** isolated workflows may add supplemental language dictionaries.
- **D-0047 — Implemented in 0.7.0:** provide a GM global Trait overview.
- **D-0048 — Implemented initially in 0.8.0:** use a PF2e-inspired Party Sheet as central group UI.
- **D-0049 — Accepted:** group delivery may partially succeed and reports failures.
- **D-0050 — Accepted:** expand MVP scope to include request tracking, cross-Actor Trait actions, the extended Party Sheet and combat management.
- **D-0051 — Accepted:** store editable House, status, notes, objectives and Actor classification/roles in hidden world setting `dune-qol.partyData`.
- **D-0052 — Accepted:** allow GM-confirmed deletion of persistent Traits from the Party Sheet; preserve provenance and never reopen complications.
- **D-0053 — Accepted:** derive request history from persistent request ChatMessages and let the GM cancel pending requests with User-inbox cleanup.
