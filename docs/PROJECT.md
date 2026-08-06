# Project source of truth

Central living reference for **Dune: Adventures in the Imperium QoL**. Scope, architecture, status, tests, risks and decisions stay here instead of being distributed across many files.

Last updated: 2026-08-06

## 1. Baseline

- Foundry VTT 13, build 351;
- Dune system id `dune`, version 13.0.1;
- module id `dune-qol`, version 0.9.0;
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

### Party Sheet

Status: **implemented in 0.8.0 and extended in 0.9.0; Foundry validation required**.

Accessible to GM and players from Token controls as a persistent ApplicationV2 window.

**Overview**:

- Momentum and Threat when the upstream pool adapter is available;
- House name and information;
- overall party status;
- shared objectives and notes;
- world-persistent GM editing.

**Characters**:

- compatible Actors owned by non-GM users;
- automatic primary/supporting classification from assigned characters, overridable by the GM;
- owner list, portrait, group role and detected individual resources;
- direct sheet, Guided test, Traits-tab and token-selection actions.

**Traits**:

- all Traits grouped by Actor;
- GM checkbox selection across multiple Actors;
- bulk promotion of temporary Traits;
- confirmed bulk deletion of temporary or persistent Traits;
- aggregate chat history and complication provenance updates;
- deletion never reopens a resolved complication.

**Requests**:

- visible test-request history and pending table;
- pending/completed/cancelled filters;
- navigation to request and result messages;
- GM cancellation with User-inbox cleanup.

**Combat**:

- embeds the same combat panel as the native Combat Tracker;
- refreshes when the active Combat or Dune combat state changes.

### Combat manager

Status: **implemented in 0.9.0; Foundry validation required**.

The module layers Dune side-based activation over a normal active Foundry Combat without replacing its Combatants or round counter.

- player or opposition active side;
- acted and available combatants;
- side inferred from player ownership or positive token disposition;
- manual side assignment;
- mark selected combatants acted or available;
- pass initiative;
- retain initiative with a GM-entered cost from 0 to 6;
- player-side retention spends Momentum; opposition retention spends Threat;
- pool preflight validation through the existing adapter;
- activation reset and native `nextRound()` integration;
- synchronization when the Foundry round changes manually;
- persistent combat history;
- token selection and camera pan;
- interface in the Combat Tracker, Token controls and Party Sheet.

The module deliberately does not hardcode a retention cost or replace Foundry initiative data.

## 4. MVP scope and planned work

The MVP now includes:

1. Party Sheet and combat-manager runtime validation and visual fixes;
2. request history and pending-request tracking;
3. cross-Actor Trait actions;
4. side-based combat and initiative management;
5. final multiplayer, roll-mode, Dice So Nice and theme validation;
6. versioned GitHub release and stable release manifest.

### Remaining MVP work

- test Party Sheet as GM and player, including persistence and live updates;
- test Combat Tracker injection and Party Sheet Combat tab;
- verify allied, neutral and hostile combatant side classification;
- verify native round transitions and manual round changes;
- verify Momentum/Threat retention costs and insufficient-pool errors;
- correct visual issues in narrow Combat Tracker and both themes;
- complete regression and multiplayer checks;
- create a versioned release artifact.

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
    ├── party-sheet.mjs
    ├── party-sheet-shortcuts.mjs
    ├── party-sheet-combat.mjs
    └── combat-manager.mjs
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
game.settings: dune-qol.combatState
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

### Foundry checklist — 0.9.0

Loading:

- [ ] Foundry displays 0.9.0 after full reload.
- [ ] No initialization error appears.
- [ ] Party Sheet and combat translations/styles load.
- [ ] Party Sheet and combat controls appear with an active Scene.

Party Sheet:

- [ ] GM edits persist after reload; players see read-only shared information.
- [ ] assigned Actors default to primary and other owned Actors to supporting;
- [ ] roles and classification overrides persist;
- [ ] Test, Traits, sheet and token actions work;
- [ ] multi-Actor Trait promotion and confirmed deletion work with history;
- [ ] request filters, links and cancellation work;
- [ ] cancelled requests disappear from inboxes and cannot complete later.

Combat setup:

- [ ] no active Combat shows a clear empty state;
- [ ] an active native Combat populates both panels;
- [ ] player-owned/allied tokens classify as players and hostile tokens as opposition;
- [ ] the GM can override the active side independently of Combat turns.

Combat actions:

- [ ] selected combatants can be marked acted or available;
- [ ] pass changes the active side;
- [ ] retain keeps the side and deducts the entered Momentum or Threat cost;
- [ ] insufficient reserves reject the action without changing state;
- [ ] reset clears activations;
- [ ] next round advances Foundry Combat, clears activations and gives players initiative;
- [ ] manual Foundry round changes synchronize the state;
- [ ] token selection centers the correct token;
- [ ] history persists and appears in both interfaces.

Regression:

- [ ] Guided tests, pools, complications, requests and earlier group tools still work.
- [ ] player-to-GM pool and Trait requests work with two clients.
- [ ] public, private, blind and self roll modes behave acceptably.
- [ ] Dice So Nice and light/dark themes remain usable.

## 8. Known risks

- Every multiplayer client must load the same module version.
- Party and combat data are hidden world settings and only GMs may write them.
- Shared-state operations are not fully atomic across clients.
- Group Trait history and provenance updates are best effort after Item changes.
- Persistent Trait deletion is GM-only and requires confirmation.
- Request history depends on request ChatMessages remaining in the world.
- Combat side inference may require manual correction for neutral or allied NPCs.
- The Combat Tracker DOM and upstream pool APIs may change in later Foundry or Dune versions.
- Native Combat round behavior must be validated against the supported Foundry build.

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
- **D-0050 — Accepted:** expand MVP scope to request tracking, cross-Actor Trait actions, the extended Party Sheet and combat management.
- **D-0051 — Accepted:** store House, status, notes, objectives and Actor metadata in hidden world setting `dune-qol.partyData`.
- **D-0052 — Accepted:** allow GM-confirmed deletion of persistent Traits from the Party Sheet; preserve provenance and never reopen complications.
- **D-0053 — Accepted:** derive request history from persistent request ChatMessages and let the GM cancel pending requests with User-inbox cleanup.
- **D-0054 — Accepted:** layer Dune combat state over the active native Foundry Combat rather than replacing Combat, Combatants or rounds.
- **D-0055 — Accepted:** store active side, acted Combatants and combat history in hidden world setting `dune-qol.combatState`, scoped to the active Combat id.
- **D-0056 — Accepted:** make retention cost an explicit GM-entered value from zero to six, spending Momentum for players or Threat for opposition after pool preflight.
- **D-0057 — Accepted:** expose one shared combat panel in the Combat Tracker and Party Sheet through separate services, with side inference based on ownership and token disposition.
