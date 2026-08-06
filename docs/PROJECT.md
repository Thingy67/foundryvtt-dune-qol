# Project source of truth

Central living reference for **Dune: Adventures in the Imperium QoL**.

Last updated: 2026-08-06

## 1. Baseline

- Foundry VTT 13, build 351;
- Dune system id `dune`, version 13.0.1;
- module id `dune-qol`, version 0.9.2;
- public pre-alpha repository;
- English and French interfaces;
- manual Foundry validation, without GitHub Actions;
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

### Guided tests, pools and complications

Status: **core and GM paths manually validated; broader multiplayer validation remains**.

- guided tests from Actor sheets and optional Token controls;
- Skill, Drive, Focus, difficulty, dice, complication range and Determination;
- extra-die source/cost, successes, Momentum and complications;
- explicit Momentum/Threat transactions with history and duplicate protection;
- one upstream `trait` Item per resolved complication;
- temporary/persistent Traits, provenance and rollback.

### Traits and requests

Status: **manually validated through 0.7.0**.

- Actor-sheet temporary-Trait manager;
- individual and group test requests;
- imposed or free Skill/Drive;
- persistent private delivery and offline inbox;
- independent completion per recipient;
- global party Trait overview.

### Party Sheet

Status: **implemented through 0.9.2; Foundry validation required**.

Persistent ApplicationV2 accessible from Token controls to GMs and players.

- **Overview:** Momentum, Threat, House, global status, objectives and notes.
- **Characters:** primary/supporting classification, owners, roles, portraits, detected resources and quick Test/Traits/sheet/token actions.
- **Traits:** all Traits grouped by Actor; GM cross-Actor promotion and confirmed deletion with history and provenance.
- **Requests:** pending/completed/cancelled filters, request/result navigation and GM cancellation with inbox cleanup.
- **Combat:** shared combat panel also used by the native Combat Tracker.
- world-setting changes refresh open Party and combat views on connected clients;
- V13 Chat navigation uses `Sidebar.changeTab`, centers and briefly highlights the target message;
- cancelling a pending request requires explicit confirmation.

### Combat manager

Status: **implemented through 0.9.2; Foundry validation required**.

Dune side-based activation layered over the active native Foundry Combat.

- active player or opposition side;
- acted and available combatants;
- initial side inference from player ownership or positive disposition;
- manual side changes;
- multi-selection mark acted/available;
- pass or retain initiative;
- default retention cost 2, editable from 0 to 6;
- player retention may spend Momentum or add Threat;
- opposition retention spends Threat;
- a side cannot retain twice before an opposing combatant acts;
- retention lock clears after an opposing activation, reset, or new round;
- activation reset preserves the current side;
- new round resets activations and starts with the player side;
- native `nextRound()` and manual round synchronization;
- persistent history and token selection;
- interface in Token controls, Combat Tracker and Party Sheet.

Critical combat transitions and retention payments are isolated in `scripts/domain/combat-state.mjs` and covered by dependency-free Node tests.

## 4. MVP scope and remaining work

The MVP includes Party Sheet, request tracking, cross-Actor Trait actions and combat management.

Remaining work:

1. validate Party Sheet as GM and player, including persistence and cross-client refresh;
2. validate Chat navigation, cancellation confirmation and inbox cleanup;
3. validate Combat Tracker injection, Party Sheet Combat tab and token actions;
4. verify neutral/allied/hostile classification and manual correction needs;
5. verify rounds, both player retention payments, opposition payment and retention lock;
6. correct narrow-layout and light/dark-theme issues;
7. complete player-to-GM, roll-mode and Dice So Nice regressions;
8. run the full `npm run check` from a complete checkout;
9. create a versioned release artifact and stable manifest.

After MVP:

- supporting-character handoff and deeper controls;
- token HUD conveniences;
- conflict zones and Asset movement;
- House projects and campaign clocks;
- public API and flag migrations;
- guided character creation as the final major workflow.

## 5. Architecture

```text
scripts/
├── dune-qol.mjs
├── settings.mjs
├── localization.mjs
├── adapters/dune-pools.mjs
├── domain/
│   ├── dune-test.mjs
│   ├── pool-plan.mjs
│   ├── complication-resolution.mjs
│   └── combat-state.mjs
├── features/
└── services/
    ├── pool-transactions.mjs
    ├── complication-traits.mjs
    ├── temporary-traits.mjs
    ├── test-requests.mjs
    ├── test-request-completion.mjs
    ├── group-tools.mjs
    ├── party-sheet.mjs
    ├── party-sheet-shortcuts.mjs
    ├── party-sheet-navigation.mjs
    ├── party-sheet-combat.mjs
    ├── combat-manager.mjs
    └── live-updates.mjs
```

- `domain/`: pure calculations and state transitions;
- `adapters/`: upstream integration points;
- `services/`: permissions, sockets, persistence and coordinated workflows;
- `features/`: test behavior and render-time UI.

Persistent namespaces:

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

Targeted checks genuinely completed for 0.9.2:

- `node --check` on the combat domain, combat test and combat manager;
- `tools/test-combat-state.mjs`: **Combat state checks passed**.

The full repository command has not yet been run in this environment because a complete checkout could not be materialized.

### Foundry checklist — 0.9.2

Party Sheet:

- [ ] GM edits persist; connected players refresh and see read-only data.
- [ ] primary/supporting classification and roles persist.
- [ ] Test, Traits, sheet and token actions target the correct Actor.
- [ ] cross-Actor Trait promotion/deletion and history work.
- [ ] request filters and request/result links open the Chat tab and target message.
- [ ] cancellation asks for confirmation, cleans the inbox and prevents later completion.

Combat:

- [ ] no active Combat shows a clear empty state.
- [ ] active native Combat populates Combat Tracker and Party Sheet panels.
- [ ] side inference is sensible for player, allied and hostile tokens.
- [ ] selected combatants can be marked acted or available.
- [ ] pass changes the active side.
- [ ] player retention defaults to 2 and can spend Momentum or add Threat.
- [ ] opposition retention spends Threat.
- [ ] invalid/insufficient payments leave state unchanged.
- [ ] the same side cannot retain again until an opposing combatant acts.
- [ ] reset preserves the active side; new round starts with players.
- [ ] manual round changes, token selection, history and player refresh work.

Regression:

- [ ] Guided tests, pools, complications, requests and group tools still work.
- [ ] player-to-GM pool and Trait requests work with two clients.
- [ ] public, private, blind and self rolls behave acceptably.
- [ ] Dice So Nice and both themes remain usable.

## 8. Known risks

- Every multiplayer client must load the same module version.
- Party and combat data are hidden world settings writable only by GMs.
- Shared-state operations are not fully atomic across clients.
- Group Trait history/provenance updates are best effort after Item changes.
- Request history depends on request ChatMessages remaining in the world.
- Side inference may require manual correction for neutral or allied NPCs.
- Retention unlocking depends on the GM marking an opposing combatant as acted.
- Combat Tracker and sidebar DOM/APIs may change in later Foundry versions.

## 9. Decision log

All decisions are dated 2026-08-06 unless stated otherwise. Superseded decisions remain recorded.

- **D-0001 — Accepted:** build a separate companion module rather than modifying or forking Dune.
- **D-0002 — Accepted:** use repository `foundryvtt-dune-qol` and module id `dune-qol`.
- **D-0003 — Superseded by D-0017:** initially target unreleased Dune 13.0.2.
- **D-0004 — Amended by D-0018:** keep evolving project knowledge in one central document.
- **D-0005 — Accepted:** record lasting decisions with the implementing change.
- **D-0006 — Accepted:** disclose substantial AI assistance and retain human responsibility.
- **D-0007 — Accepted:** start without third-party runtime dependencies.
- **D-0008 — Amended by D-0050:** Guided tests, pools, complications, requests, Party Sheet and combat are MVP scope.
- **D-0009 — Superseded by D-0010:** initially use GitHub Actions.
- **D-0010 — Accepted:** keep local validation but disable GitHub Actions.
- **D-0011 — Accepted:** use Foundry core `Roll` plus isolated calculations.
- **D-0012 — Superseded by D-0023:** initially defer shared-pool mutation.
- **D-0013 — Accepted:** count complications independently from successes.
- **D-0014 — Amended:** store versioned workflow metadata in ChatMessage flags.
- **D-0015 — Superseded by D-0019:** initially launch Guided test only from Token controls.
- **D-0016 — Accepted:** support public development installation from raw manifest and `main` ZIP.
- **D-0017 — Accepted:** target published Dune 13.0.1.
- **D-0018 — Accepted:** allow one bilingual user guide as the only documentation split.
- **D-0019 — Accepted:** make Actor sheet the default Guided-test launcher.
- **D-0020 — Accepted:** provide module-specific English/French selection.
- **D-0021 — Accepted:** hide detected native Dune roller controls by default.
- **D-0022 — Accepted:** opening or rolling failures must never fail silently.
- **D-0023 — Accepted:** require explicit confirmation before shared-pool changes.
- **D-0024 — Accepted:** use the first active GM as authoritative writer.
- **D-0025 — Accepted:** isolate and feature-detect upstream pool API.
- **D-0026 — Accepted:** version pool plans and application state.
- **D-0027 — Accepted:** enforce pre-funded Momentum purchases and cap at six.
- **D-0028 — Accepted:** record successful pool transactions in chat.
- **D-0029 — Accepted:** allow one Actor Trait per complication.
- **D-0030 — Accepted:** use upstream `trait` Item and `system.temporary`.
- **D-0031 — Accepted:** record complication resolution and roll back on failure.
- **D-0032 — Accepted:** execute player Trait requests through active GM.
- **D-0033 — Accepted:** inject complication controls at chat render time.
- **D-0034 — Accepted:** start individual requests from target Actor sheet.
- **D-0035 — Amended by D-0039:** persist requests in chat and User inbox.
- **D-0036 — Superseded by D-0040:** initially keep GM-selected values editable.
- **D-0037 — Superseded by D-0039:** initially make ChatMessage primary delivery event.
- **D-0038 — Accepted:** injected links must not use Foundry native `control` class.
- **D-0039 — Accepted:** use persistent User inbox as authoritative request delivery.
- **D-0040 — Accepted:** GM-selected Skill/Drive is imposed; Focus remains advisory.
- **D-0041 — Accepted:** request context is optional.
- **D-0042 — Accepted:** complete request only after matching result exists.
- **D-0043 — Superseded by D-0050:** combat was initially near roadmap end.
- **D-0044 — Implemented in 0.7.0:** group requests use per-recipient Actors and states.
- **D-0045 — Accepted:** manage temporary Traits with bulk actions and provenance.
- **D-0046 — Accepted:** isolated workflows may add supplemental language dictionaries.
- **D-0047 — Implemented in 0.7.0:** provide GM global Trait overview.
- **D-0048 — Implemented initially in 0.8.0:** use PF2e-inspired Party Sheet as central group UI.
- **D-0049 — Accepted:** group delivery may partially succeed and reports failures.
- **D-0050 — Accepted:** expand MVP to request tracking, cross-Actor Traits, Party Sheet and combat.
- **D-0051 — Accepted:** store House, status, notes, objectives and Actor metadata in `dune-qol.partyData`.
- **D-0052 — Accepted:** allow GM-confirmed persistent Trait deletion without reopening complications.
- **D-0053 — Accepted:** derive request history from ChatMessages and allow GM cancellation with inbox cleanup.
- **D-0054 — Accepted:** layer Dune combat state over native active Combat.
- **D-0055 — Accepted:** store side, acted Combatants and history in `dune-qol.combatState`, scoped to Combat id.
- **D-0056 — Amended by D-0059:** initially use an explicit GM-entered retention cost paid from Momentum or Threat.
- **D-0057 — Accepted:** share one combat model between Combat Tracker and Party Sheet, with ownership/disposition inference.
- **D-0058 — Accepted:** synchronize open Party/combat views through world-setting hooks and use V13 `Sidebar.changeTab` with fallback.
- **D-0059 — Accepted:** default retention to cost 2; players may spend Momentum or add Threat, opposition spends Threat, and the same side cannot retain again until an opponent acts.
- **D-0060 — Accepted:** extract combat state transitions and retention planning into a pure domain module covered by dependency-free regression tests included in `npm run check`.
- **D-0061 — Accepted:** route Party Sheet request/result navigation through V13 `Sidebar.changeTab`, highlight the target ChatMessage, and require confirmation before cancelling a pending request.
