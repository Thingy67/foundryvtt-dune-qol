# Project source of truth

Central living reference for **Dune: Adventures in the Imperium QoL**.

Last updated: 2026-08-07

## 1. Baseline

- Foundry VTT 13, build 351;
- Dune system id `dune`, version 13.0.1;
- module id `dune-qol`, version 0.9.4;
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
10. Add complex workflows incrementally and keep them out of the module until their UX is clear enough to test usefully.

## 3. Implemented workflows

### Guided tests, pools and complications

Status: **core and GM paths manually validated; broader multiplayer validation remains**.

- guided tests from Actor sheets and optional Token controls;
- Skill, Drive, Focus, difficulty, dice, complication range and Determination;
- extra-die source/cost, successes, Momentum and complications;
- explicit Momentum/Threat transactions with history and duplicate protection;
- one upstream `trait` Item per resolved complication;
- temporary/persistent Traits, provenance and rollback.

### Traits and test requests

Status: **core request delivery manually validated through 0.7.0; unified request UI introduced in 0.9.4 and requires Foundry validation**.

- Actor-sheet temporary-Trait manager;
- one unified GM request form for Actor-sheet and Token-control launchers;
- every non-GM player is shown in the form;
- players with compatible owned Dune Actors can be checked individually or together;
- players without a compatible Actor remain visible but disabled;
- an Actor selector is provided per eligible player;
- Token controls start with no recipient selected;
- Actor-sheet launch preselects the most relevant owner and the opened Actor;
- if several users own the Actor, an assigned `user.character` owner is preferred, otherwise the first matching owner is used;
- imposed or free Skill/Drive, advisory Focus, difficulty, complication range and optional context;
- one independent request and completion state per recipient;
- persistent private delivery and offline inbox;
- global party Trait overview.

### Party Sheet

Status: **implemented through 0.9.4; Foundry validation required**.

Persistent ApplicationV2 accessible from Token controls to GMs and players.

- **Overview:** Momentum, Threat, House, global status, objectives and notes.
- **Characters:** primary/supporting classification, owners, roles, portraits, detected resources and quick Test/Traits/sheet/token actions.
- **Traits:** all Traits grouped by Actor; GM cross-Actor promotion and confirmed deletion with history and provenance.
- **Requests:** pending/completed/cancelled filters, request/result navigation and GM cancellation with inbox cleanup.
- world-setting changes refresh an open Party Sheet on connected clients;
- V13 Chat navigation uses `Sidebar.changeTab`, centers and briefly highlights the target message;
- cancelling a pending request requires explicit confirmation.

### Combat

Status: **not implemented**.

The experimental combat-management layer from 0.9.0–0.9.2 was removed completely in 0.9.3 after manual review showed that the workflow and interface were too complex to be useful in their current form.

Current versions contain no combat hooks, Combat Tracker injection, combat state domain, combat-specific settings, combat styles, combat translations or combat tests. Foundry and the Dune system handle combat normally.

A previously stored `dune-qol.combatState` world-setting value may remain in worlds that loaded an earlier experimental version. It is no longer registered, read or written by the module and is inert.

## 4. MVP scope and remaining work

The current MVP includes Guided Test, shared-pool transactions, complication Traits, temporary-Trait management, unified multi-recipient test requests and the Party Sheet.

Remaining work:

1. validate the unified request form from Token controls and Actor sheets, including preselection, multiple recipients, offline users and disabled users without compatible Actors;
2. validate Party Sheet as GM and player, including persistence and cross-client refresh;
3. validate Chat navigation, cancellation confirmation and inbox cleanup;
4. complete player-to-GM regressions for pools, Traits and requests;
5. verify public, private, blind and self roll modes;
6. validate Dice So Nice and light/dark themes;
7. correct narrow-layout issues;
8. create a versioned release artifact and stable manifest.

After MVP:

- supporting-character handoff and deeper controls;
- token HUD conveniences;
- conflict zones and Asset movement;
- House projects and campaign clocks;
- public API and flag migrations;
- guided character creation;
- combat QoL reconsidered later from a deliberately small first step rather than restoring the removed implementation wholesale.

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
    ├── unified-test-request-dialog.mjs
    ├── party-sheet.mjs
    ├── party-sheet-shortcuts.mjs
    ├── party-sheet-navigation.mjs
    └── live-updates.mjs
```

- `domain/`: pure calculations and state transitions;
- `adapters/`: upstream integration points;
- `services/`: permissions, sockets, persistence and coordinated workflows;
- `features/`: test behavior and render-time UI.

Persistent namespaces currently used:

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

Validation status for 0.9.4 in this development session:

- `module.json` and `package.json` are versioned together at 0.9.4;
- the new unified request service is included in `check:syntax` and in the required project file list;
- French and English group-tool dictionaries include the unified request labels;
- a complete `npm run check` has not yet been executed on the final public 0.9.4 tree in this session;
- Foundry runtime validation is required for the new launcher interception and preselection behavior.

### Foundry checklist — 0.9.4

Unified requests:

- [ ] Token controls show **Demander un test / Request a test** and open the unified form with no player preselected.
- [ ] every non-GM player is visible in the form.
- [ ] players without compatible Actors are visible but disabled.
- [ ] one or several eligible players can be checked and receive independent requests.
- [ ] every checked player uses the Actor selected on that row.
- [ ] opening from an Actor sheet opens the same form.
- [ ] the most relevant owner is prechecked and the opened Actor is preselected.
- [ ] the GM can change the preselection before sending.
- [ ] Skill/Drive imposed values remain locked for recipients; free values remain editable.
- [ ] optional Focus and context, difficulty and complication range are transmitted correctly.
- [ ] offline delivery and later reconnect still work.

Cleanup and Party Sheet:

- [ ] Token controls contain no Dune QoL combat button.
- [ ] native Combat Tracker contains no Dune QoL combat panel or controls.
- [ ] Party Sheet contains no Combat tab.
- [ ] GM Party edits persist and connected players refresh.
- [ ] request filters, request/result links and cancellation work.
- [ ] cross-Actor Trait promotion/deletion and history work.

Regression:

- [ ] Guided tests, pools, complications and Trait tools still work.
- [ ] player-to-GM pool and Trait requests work with two clients.
- [ ] public, private, blind and self rolls behave acceptably.
- [ ] Dice So Nice and both themes remain usable.

## 8. Known risks

- Every multiplayer client must load the same module version.
- Party data is a hidden world setting writable only by GMs.
- Shared-state operations are not fully atomic across clients.
- Group Trait history/provenance updates are best effort after Item changes.
- Request history depends on request ChatMessages remaining in the world.
- The unified launcher currently supersedes the older request-dialog listeners at render/control-hook time; runtime validation must confirm that Foundry hook ordering remains stable on the supported build.
- Worlds that used 0.9.0–0.9.2 may retain an inert legacy `dune-qol.combatState` value in storage.

## 9. Decision log

Superseded and reversed decisions remain recorded for history.

- **D-0001 — Accepted (2026-08-06):** build a separate companion module rather than modifying or forking Dune.
- **D-0002 — Accepted (2026-08-06):** use repository `foundryvtt-dune-qol` and module id `dune-qol`.
- **D-0003 — Superseded by D-0017 (2026-08-06):** initially target unreleased Dune 13.0.2.
- **D-0004 — Amended by D-0018 (2026-08-06):** keep evolving project knowledge in one central document.
- **D-0005 — Accepted (2026-08-06):** record lasting decisions with the implementing change.
- **D-0006 — Accepted (2026-08-06):** disclose substantial AI assistance and retain human responsibility.
- **D-0007 — Accepted (2026-08-06):** start without third-party runtime dependencies.
- **D-0008 — Amended by D-0050, then D-0062 (2026-08-06):** Guided tests, pools, complications and requests are core MVP scope; Party Sheet was later added; combat was later removed again.
- **D-0009 — Superseded by D-0010 (2026-08-06):** initially use GitHub Actions.
- **D-0010 — Accepted (2026-08-06):** keep local validation but disable GitHub Actions.
- **D-0011 — Accepted (2026-08-06):** use Foundry core `Roll` plus isolated calculations.
- **D-0012 — Superseded by D-0023 (2026-08-06):** initially defer shared-pool mutation.
- **D-0013 — Accepted (2026-08-06):** count complications independently from successes.
- **D-0014 — Accepted (2026-08-06):** store versioned workflow metadata in ChatMessage flags.
- **D-0015 — Superseded by D-0019 (2026-08-06):** initially launch Guided test only from Token controls.
- **D-0016 — Accepted (2026-08-06):** support public development installation from raw manifest and `main` ZIP.
- **D-0017 — Accepted (2026-08-06):** target published Dune 13.0.1.
- **D-0018 — Accepted (2026-08-06):** allow one bilingual user guide as the only documentation split.
- **D-0019 — Accepted (2026-08-06):** make Actor sheet the default Guided-test launcher.
- **D-0020 — Accepted (2026-08-06):** provide module-specific English/French selection.
- **D-0021 — Accepted (2026-08-06):** hide detected native Dune roller controls by default.
- **D-0022 — Accepted (2026-08-06):** opening or rolling failures must never fail silently.
- **D-0023 — Accepted (2026-08-06):** require explicit confirmation before shared-pool changes.
- **D-0024 — Accepted (2026-08-06):** use the first active GM as authoritative writer.
- **D-0025 — Accepted (2026-08-06):** isolate and feature-detect upstream pool API.
- **D-0026 — Accepted (2026-08-06):** version pool plans and application state.
- **D-0027 — Accepted (2026-08-06):** enforce pre-funded Momentum purchases and cap at six.
- **D-0028 — Accepted (2026-08-06):** record successful pool transactions in chat.
- **D-0029 — Accepted (2026-08-06):** allow one Actor Trait per complication.
- **D-0030 — Accepted (2026-08-06):** use upstream `trait` Item and `system.temporary`.
- **D-0031 — Accepted (2026-08-06):** record complication resolution and roll back on failure.
- **D-0032 — Accepted (2026-08-06):** execute player Trait requests through active GM.
- **D-0033 — Accepted (2026-08-06):** inject complication controls at chat render time.
- **D-0034 — Amended by D-0063 (2026-08-06):** Actor sheets remain a request launcher, but no longer use a separate individual-only form.
- **D-0035 — Amended by D-0039 (2026-08-06):** persist requests in chat and User inbox.
- **D-0036 — Superseded by D-0040 (2026-08-06):** initially keep GM-selected values editable.
- **D-0037 — Superseded by D-0039 (2026-08-06):** initially make ChatMessage primary delivery event.
- **D-0038 — Accepted (2026-08-06):** injected links must not use Foundry native `control` class.
- **D-0039 — Accepted (2026-08-06):** use persistent User inbox as authoritative request delivery.
- **D-0040 — Accepted (2026-08-06):** GM-selected Skill/Drive is imposed; Focus remains advisory.
- **D-0041 — Accepted (2026-08-06):** request context is optional.
- **D-0042 — Accepted (2026-08-06):** complete request only after matching result exists.
- **D-0043 — Superseded by D-0050, then D-0062 (2026-08-06):** combat was initially planned near roadmap end, briefly moved into MVP, then removed from current scope.
- **D-0044 — Amended by D-0063 (2026-08-06):** requests may target several users with one independent request per recipient; the same form now also handles single-recipient launches.
- **D-0045 — Accepted (2026-08-06):** manage temporary Traits with bulk actions and provenance.
- **D-0046 — Accepted (2026-08-06):** isolated workflows may add supplemental language dictionaries.
- **D-0047 — Accepted (2026-08-06):** provide GM global Trait overview.
- **D-0048 — Accepted (2026-08-06):** use a PF2e-inspired Party Sheet as central group UI.
- **D-0049 — Accepted (2026-08-06):** group delivery may partially succeed and reports failures.
- **D-0050 — Amended by D-0062 (2026-08-06):** expand MVP to request tracking, cross-Actor Traits and Party Sheet; the combat portion is reversed.
- **D-0051 — Accepted (2026-08-06):** store House, status, notes, objectives and Actor metadata in `dune-qol.partyData`.
- **D-0052 — Accepted (2026-08-06):** allow GM-confirmed persistent Trait deletion without reopening complications.
- **D-0053 — Accepted (2026-08-06):** derive request history from ChatMessages and allow GM cancellation with inbox cleanup.
- **D-0054 — Reversed by D-0062 (2026-08-06):** layer Dune combat state over native active Combat.
- **D-0055 — Reversed by D-0062 (2026-08-06):** store side, acted Combatants and history in `dune-qol.combatState`.
- **D-0056 — Reversed by D-0062 (2026-08-06):** use explicit retention costs paid from Momentum or Threat.
- **D-0057 — Reversed by D-0062 (2026-08-06):** share one combat model between Combat Tracker and Party Sheet.
- **D-0058 — Partially reversed by D-0062 (2026-08-06):** keep Party Sheet world-setting refresh and V13 sidebar navigation; remove combat refresh behavior.
- **D-0059 — Reversed by D-0062 (2026-08-06):** implement Dune initiative-retention payment and lock rules.
- **D-0060 — Reversed by D-0062 (2026-08-06):** maintain a pure combat-state domain and combat regression tests.
- **D-0061 — Accepted (2026-08-06):** route Party Sheet request/result navigation through V13 `Sidebar.changeTab`, highlight the target ChatMessage, and require confirmation before cancelling a pending request.
- **D-0062 — Accepted (2026-08-07):** remove the experimental combat feature completely from runtime, UI, settings, localization, styles, tests and current MVP scope. Rationale: the first integrated design became too dense and confusing in actual Foundry use. Consequence: 0.9.3 leaves native Foundry/Dune combat untouched; combat QoL may return later only through a smaller incremental design. Legacy stored combat-state data is intentionally ignored rather than migrated.
- **D-0063 — Accepted (2026-08-07):** use one unified GM test-request form from every launcher. The form always lists all non-GM players with checkboxes and per-player Actor selection; incompatible players remain visible but disabled. Token controls start unselected. Actor-sheet launch prechecks the most relevant owner and the opened Actor, while still allowing the GM to change recipients before sending. Each selected player receives an independent persistent request.
