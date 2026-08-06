# Project source of truth

Central living reference for **Dune: Adventures in the Imperium QoL**. Scope, architecture, status, tests, risks and decisions stay here instead of being distributed across many files.

Last updated: 2026-08-06

## 1. Baseline

- Foundry VTT 13, build 351;
- Dune system id `dune`, version 13.0.1;
- module id `dune-qol`, version 0.7.0;
- public pre-alpha repository;
- English and French interfaces;
- manual validation only, without GitHub Actions;
- substantial AI-assisted development with human review responsibility.

## 2. Principles

1. Extend the upstream system without modifying or forking it.
2. Keep automation explicit, visible and reversible where practical.
3. Respect Foundry permissions and use an active GM for authoritative multiplayer changes.
4. Preserve normal Dune play when the module is disabled.
5. Prefer small workflows, public APIs and minimal dependencies.
6. Do not reproduce commercial rules text or copyrighted assets.
7. Support English and French for every user-facing workflow.
8. Record meaningful decisions with the implementing change.
9. Never claim validation that was not performed.

## 3. Implemented workflows

### Guided tests

Status: **core workflow manually validated**.

- Actor-sheet launcher and optional Token-controls launcher;
- optional hiding of the native Dune roller;
- Skill, Drive, Focus, difficulty, dice, complication range and Determination;
- extra-die cost and source;
- success, failure, Momentum and complications;
- narrow-chat layout with one parameter per row;
- structured and versioned ChatMessage flags.

Remaining validation: all roll modes, Dice So Nice, dark/light themes and additional Actor-sheet variants.

### Momentum and Threat

Status: **GM path manually validated; player path still needs multiplayer validation**.

- explicit application from the result card;
- active-GM authority for player requests;
- pre-funded Momentum validation and cap of six;
- duplicate protection, preflight checks and best-effort rollback;
- public transaction history.

### Complication Traits

Status: **creation workflow manually validated**.

- one embedded upstream `trait` Item per complication;
- temporary by default, persistent when selected;
- active-GM authority for player requests;
- provenance stored on the Item and source result;
- rollback if source recording fails;
- public history message.

### Temporary Trait manager

Status: **manually validated in 0.6.0**.

- **Temporary Traits** button on Actor sheets for the GM or Actor owner;
- lists all embedded `trait` Items whose `system.temporary` is true;
- checkbox selection of one or several Traits;
- bulk **Make persistent** and **Delete** actions;
- player requests executed by the primary active GM;
- public history message;
- complication-generated Traits show their origin;
- promotion updates source-result provenance when available;
- deletion records provenance but does not reopen a resolved complication.

### Single-recipient test requests

Status: **implemented and manually validated through 0.5.4**.

- GM action on the target Actor sheet;
- one non-GM owner as recipient;
- optional context;
- Skill and Drive either imposed or left to the player;
- editable Focus proposal;
- private ChatMessage plus persistent User inbox;
- request completed only after a matching result exists and the active GM validates it;
- completed request no longer displays **Open test**.

### Group tools

Status: **implemented in 0.7.0; Foundry validation required**.

Two GM-only actions are added to Token scene controls.

**Request a group test**:

- lists every non-GM player with at least one compatible owned Actor;
- checkbox selection of one or several recipients;
- explicit Actor selector for every player;
- common difficulty, complication range, context and optional Focus;
- common Skill and Drive may be imposed only when available on all eligible Actors;
- creates one independent request, message, inbox entry and completion state per recipient;
- partial delivery keeps successful requests and reports failures.

**View party Traits**:

- gathers compatible Actors owned by non-GM players and deduplicates shared ownership;
- displays owners, portrait and all embedded Traits;
- distinguishes temporary, persistent and complication-generated Traits;
- supports text and state filters;
- opens the corresponding Actor sheet directly.

This Actor/owner roster is the first reusable data layer for the future Party Sheet.

## 4. Planned work

### Next functional block — Party Sheet MVP

- persistent group window accessible to GM and players;
- player and Actor roster based on explicit ownership and assigned characters;
- portraits, owners and direct sheet access;
- Traits and key resources;
- future extension points for supporting characters, House information and campaign tools.

### Medium priority

- cancelled or expired test-request states and result backlinks;
- supporting-character handoff and control conveniences;
- token HUD conveniences;
- conflict zones and Asset movement;
- House projects and campaign clocks.

### Low-priority end of roadmap

1. Combat and initiative management: active side, activated Actors, pass/retain initiative, round reset, history and resource costs.
2. Guided character creation: assist creation of a valid Dune character without replacing the upstream sheet or reproducing protected rules text.

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
    └── group-tools.mjs
```

- `domain/`: pure calculations with no Foundry access.
- `adapters/`: unstable upstream integration points.
- `services/`: permissions, sockets, persistence and coordinated workflows.
- `features/`: user-facing test behavior and render-time UI.

Current flag namespaces:

```text
flags.dune-qol.guidedTest
flags.dune-qol.poolTransaction
flags.dune-qol.complicationTrait
flags.dune-qol.temporaryTraitManagement
flags.dune-qol.testRequest
flags.dune-qol.testRequestInbox
flags.dune-qol.testRequestResult
```

Supplemental feature translations are loaded by `scripts/localization.mjs` and merged with the base language file.

## 6. Documentation policy

Approved Markdown documents:

- `README.md` — public overview and installation;
- `AGENTS.md` — working rules;
- `docs/PROJECT.md` — source of truth;
- `docs/USER-GUIDE.md` — single bilingual user manual.

Do not create separate roadmap, architecture, ADR, TODO, release-note or per-feature manuals without a recorded decision.

## 7. Validation

Run manually from a checkout:

```bash
npm run check
```

This checks JavaScript syntax, JSON, manifest consistency, required files, documentation policy and pure domain regressions.

### Foundry checklist — 0.7.0

Loading:

- [ ] Foundry displays version 0.7.0 after full reload.
- [ ] No initialization error appears.
- [ ] English and French group-tool translations load.
- [ ] Both new buttons appear only for a GM in Token controls.

Group request:

- [ ] Every eligible player appears with a checkbox and Actor selector.
- [ ] Assigned characters appear first when available.
- [ ] No selected player keeps the dialog open with a warning.
- [ ] One selected player receives one normal request.
- [ ] Several selected players each receive an independent request.
- [ ] Different Actors may be selected for different players.
- [ ] Imposed Skill and Drive remain locked in every recipient dialog.
- [ ] One completed result removes only that player's **Open test** button.
- [ ] An offline recipient receives the queued request after connecting.
- [ ] A failure for one recipient does not erase successful deliveries.

Party Traits:

- [ ] All compatible player-owned Actors appear once.
- [ ] Multiple owners are displayed without duplicating the Actor.
- [ ] Temporary, persistent and complication-generated Traits are identified.
- [ ] Text search filters by player, Actor or Trait name.
- [ ] State filters show Actors with temporary or persistent Traits.
- [ ] The sheet button opens the correct Actor.

Regression:

- [ ] Guided tests still work.
- [ ] Temporary Trait management still works.
- [ ] Individual test requests still work and complete correctly.
- [ ] Momentum/Threat and complication workflows still work.

## 8. Known risks

- Multiplayer workflows require every client to load the same module version.
- User-flag delivery and authoritative changes depend on an active GM.
- Shared-state operations cannot be fully atomic across distributed clients.
- Group delivery writes one User inbox at a time; partial success is intentional and reported.
- Actors jointly owned by several players appear once in the Trait overview but separately in each player's group-request row.
- The Party Trait overview is read-only; mutation remains on individual Actor sheets.
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
- **D-0008 — Amended by D-0043:** prioritize Guided test, pools, complications and requests; combat tracking is not the immediate next workflow.
- **D-0009 — Superseded by D-0010:** use dependency-free validation locally and in GitHub Actions.
- **D-0010 — Accepted:** keep local validation but disable GitHub Actions.
- **D-0011 — Accepted:** use Foundry core `Roll` plus isolated local result calculations.
- **D-0012 — Superseded by D-0023:** initially defer shared-pool mutation.
- **D-0013 — Accepted:** count complications independently from successes.
- **D-0014 — Amended by D-0026 and D-0031:** store versioned Guided-test metadata in ChatMessage flags.
- **D-0015 — Superseded by D-0019:** initially launch Guided test only from Token controls.
- **D-0016 — Accepted:** support public development installation from the raw manifest and `main` ZIP.
- **D-0017 — Accepted:** target published Dune 13.0.1.
- **D-0018 — Accepted:** allow one dedicated bilingual user guide as the only documentation split.
- **D-0019 — Accepted:** make the Actor sheet the default Guided-test launcher.
- **D-0020 — Accepted:** provide a module-specific English/French setting.
- **D-0021 — Accepted:** hide detected native Dune roller controls by default without modifying upstream code.
- **D-0022 — Accepted:** opening or rolling failures must never fail silently.
- **D-0023 — Accepted:** require explicit confirmation before shared-pool changes.
- **D-0024 — Accepted:** use the first active GM as authoritative writer for player requests.
- **D-0025 — Accepted:** isolate and feature-detect the upstream pool API.
- **D-0026 — Accepted:** version pool plans and application state in Guided-test flags.
- **D-0027 — Accepted:** enforce pre-funded Momentum purchases and cap Momentum at six.
- **D-0028 — Accepted:** record each successful pool transaction in chat.
- **D-0029 — Accepted:** allow one Actor Trait per complication.
- **D-0030 — Accepted:** use the upstream `trait` Item and `system.temporary` field.
- **D-0031 — Accepted:** record complication resolution on the source message and roll back on failure.
- **D-0032 — Accepted:** execute player Trait requests through the active GM.
- **D-0033 — Accepted:** inject complication controls at chat render time.
- **D-0034 — Accepted:** start GM test requests from the target Actor sheet.
- **D-0035 — Amended by D-0037 and D-0039:** persist requests in private chat and optionally open them live.
- **D-0036 — Superseded by D-0040:** initially keep all GM-selected Skill, Drive and Focus values editable.
- **D-0037 — Superseded by D-0039:** make private ChatMessage the primary delivery event and retain sockets as an accelerator.
- **D-0038 — Accepted:** injected sheet links must not use Foundry's native `control` class.
- **D-0039 — Accepted:** use a persistent request inbox on the recipient User document as authoritative delivery; keep private chat as visible fallback and sockets for refresh/acknowledgement.
- **D-0040 — Accepted:** a Skill or Drive selected by the GM is imposed and locked; **Player chooses** leaves it editable, while Focus remains advisory.
- **D-0041 — Accepted:** request context is optional and an empty value must not block or silently close sending.
- **D-0042 — Accepted:** complete a request only after a matching Guided-test result exists and the active GM validates it.
- **D-0043 — Accepted:** place combat/initiative near the end and guided character creation last.
- **D-0044 — Implemented in 0.7.0:** keep Actor-sheet requests single-recipient and add a Token-controls group workflow with per-recipient Actors and independent request states.
- **D-0045 — Accepted:** manage temporary Traits from the Actor sheet with checkbox-based bulk promotion or deletion; player actions use active-GM authority, provenance is preserved, and deletion never reopens resolved complications.
- **D-0046 — Accepted:** allow isolated workflows to add supplemental per-language JSON dictionaries merged by the module localization service.
- **D-0047 — Implemented in 0.7.0:** add a GM Token-controls action presenting all player-character Traits together, grouped by Actor and owners, with state filters and safe sheet navigation.
- **D-0048 — Accepted:** build a Dune Party Sheet inspired by PF2e as the central group interface for characters, owners, Traits, resources and campaign conveniences.
- **D-0049 — Accepted:** group request delivery is independent per recipient and may partially succeed; every request stores its own Actor, message, inbox entry and completion state.
