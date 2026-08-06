# Project source of truth

Central living reference for **Dune: Adventures in the Imperium QoL**. Keep product scope, architecture, roadmap, status, testing notes, risks and decisions here instead of creating many separate documents.

Last updated: 2026-08-06

## 1. Project summary

`dune-qol` is a companion module for Foundry Virtual Tabletop. It adds optional comfort features to the community Dune system without modifying or replacing that system.

Current baseline:

- Foundry VTT: version 13, build 351;
- upstream system id: `dune`;
- supported upstream version: **13.0.1**;
- module id: `dune-qol`;
- module version: **0.3.0**;
- repository: public, pre-alpha.

## 2. Principles

1. Extend the existing system; do not fork it.
2. Keep automation visible and understandable.
3. Respect Foundry permissions and game-master authority.
4. Preserve normal play when the module is disabled.
5. Prefer small workflows over opaque automation.
6. Minimize runtime dependencies.
7. Support English and French for user-facing features.
8. Do not reproduce commercial rules text or copyrighted assets.
9. Record meaningful decisions, but keep documentation concentrated.
10. Disclose AI assistance and retain human responsibility for accepted changes.

## 3. Scope and priorities

### Phase 0 — Repository and loading scaffold

Status: **implemented; manual validation in progress**.

Implemented:

- Foundry module manifest and public installation URL;
- ES-module entry point, settings, localization and stylesheet;
- English and French resources;
- dependency-free local validation;
- concentrated project and user documentation.

Remaining:

- run `npm run check` from a real checkout;
- confirm clean installation and activation on Foundry 13.351 with Dune 13.0.1;
- confirm no console errors or unintended world-data changes.

### Phase 1 — Guided test workflow

Status: **implemented in 0.2.0; manual Foundry validation in progress**.

Implemented:

- Guided test treated as the preferred dice interface;
- launcher in supported Actor-sheet title bars by default;
- optional launcher in Token scene controls;
- optional hiding of native Dune roller controls;
- module-specific English or French selection;
- translated labels, hints and setting choices;
- selected-token or assigned-character fallback;
- Skill, Drive, optional Focus, difficulty, dice and complication range;
- progressive extra-die cost and declared source;
- Determination spending;
- successes, complications, outcome and generated Momentum;
- enriched localized chat result;
- visible notifications and console errors.

Remaining:

- validate Focus storage on real characters;
- validate all Actor-sheet variants and native-control detection;
- validate roll modes and Dice So Nice;
- fix issues found during manual testing.

### Phase 2 — Momentum and Threat transactions

Status: **initial MVP implemented in 0.3.0; upstream adapter and multiplayer validation required**.

Implemented:

- pure calculation of the resource plan produced by a Guided test;
- explicit result-card button instead of automatic mutation;
- Momentum purchase, Momentum generation and Threat purchase combined into one net plan;
- Momentum purchase validated against the pool available before the test;
- Momentum cap of 6 and discarded-excess reporting;
- active-GM authority for player requests through the module socket;
- permission checks for the message author and game master;
- feature-detected adapter around the upstream shared pools;
- preflight validation before writes;
- best-effort rollback if a multi-pool write partially fails;
- in-memory duplicate-processing lock;
- source-message state marking after successful application;
- separate chat-visible transaction history with before and after values;
- structured transaction metadata in module flags;
- diagnostic output when no supported upstream pool interface is detected.

Remaining:

- identify and confirm the exact Dune 13.0.1 pool interface during runtime testing;
- validate a GM applying their own result;
- validate a player request with one and several connected GMs;
- validate Momentum-only, Threat-only and combined changes;
- validate insufficient Momentum and Momentum-cap behavior;
- confirm the pool tracker refreshes immediately on every client;
- decide whether manual standalone pool controls and transaction reversal belong in the next increment.

### Phase 3 — Traits and Complications

Status: **planned**.

- create Actor Traits directly from test results;
- manage temporary Traits;
- game-master complication workflow;
- preserve links between a roll and created state where useful;
- design scene- or zone-level storage before implementing it.

### Phase 4 — Activation tracker

Status: **planned**.

- active side;
- Actors already activated;
- pass or retain initiative;
- Momentum or Threat cost integration;
- round reset and history;
- supporting-character and NPC compatibility.

Later candidates require explicit decisions: supporting-character handoff, conflict zones, Asset movement, House projects, campaign clocks, token HUD, macro compendium, imports and third-party integrations.

## 4. Architecture

Current source organization:

```text
scripts/
├── dune-qol.mjs
├── settings.mjs
├── localization.mjs
├── adapters/
│   └── dune-pools.mjs
├── domain/
│   ├── dune-test.mjs
│   └── pool-plan.mjs
├── features/
│   └── guided-test.mjs
└── services/
    └── pool-transactions.mjs
```

### Guided tests

The guided test reads upstream Actor data but uses Foundry core `Roll` and `Roll.toMessage`. Calculation logic remains pure and independent from Foundry.

Guided-test flag schema version 2 stores the test context, the proposed pool plan and an application status under:

```text
flags.dune-qol.guidedTest
```

### Localization and settings

The selected module dictionary is loaded directly, independently of Foundry's global language. The settings configuration is amended at render time so its labels, hints and choices use that selected dictionary.

### Shared pools

`domain/pool-plan.mjs` calculates and validates desired changes without accessing Foundry.

`adapters/dune-pools.mjs` is the only boundary that probes upstream pool storage and mutation methods. It tries known registered Dune settings and feature-detects likely `game.dune.pools` accessors. Unsupported interfaces must fail clearly with diagnostics rather than mutate guessed properties directly.

`services/pool-transactions.mjs` owns authority, permissions, socket requests, duplicate protection, writes, rollback and chat history. A non-GM client never writes shared pools directly.

The first active GM ordered by user id acts as the authoritative receiver when several GMs are connected. The lock preventing simultaneous application is local to that GM client; persistent source-message state provides the durable duplicate check after a completed transaction.

Successful history messages store structured metadata under:

```text
flags.dune-qol.poolTransaction
```

### Persistent data

No custom world-data model exists. Storage preference remains:

1. existing upstream documents and pools;
2. `dune-qol` flags;
3. world settings;
4. custom documents only when necessary.

No public module API exists yet.

## 5. Documentation policy

Primary Markdown documents:

- `README.md`: public overview and installation entry point;
- `AGENTS.md`: working rules for humans and AI agents;
- `docs/PROJECT.md`: technical and product source of truth;
- `docs/USER-GUIDE.md`: single bilingual user manual and troubleshooting guide.

The user guide is the only approved documentation split. Do not create separate roadmap, architecture, ADR, decision, TODO, release-note or per-feature manual files without a new recorded decision.

## 6. Testing

Run manually from a repository checkout:

```bash
npm run check
```

This performs JavaScript syntax checks, required-file and JSON checks, manifest validation, documentation-policy checks, guided-test calculations and pool-plan calculations. No GitHub Actions workflow is used.

### Foundry checklist

Loading and settings:

- [ ] Foundry 13.351 installs module 0.3.0 from the raw manifest URL.
- [ ] Dune 13.0.1 satisfies the module relationship.
- [ ] The module activates without console errors.
- [ ] Activation alone does not alter world data.
- [ ] Configure Settings is fully translated in English and French.

Guided test:

- [ ] Actor-sheet and optional Token-control launchers work.
- [ ] Skills, Drives, Focuses and Determination are read correctly.
- [ ] Difficulty, successes, complications and generated Momentum are correct.
- [ ] Extra-die costs are 0, 1, 3 and 6.
- [ ] Public, private, blind and self rolls work.
- [ ] Dice So Nice remains compatible.

Pool transactions — GM:

- [ ] A result with no resource change contains no application button.
- [ ] Generated Momentum produces the correct proposed delta.
- [ ] Momentum and Threat purchases produce the correct proposed deltas.
- [ ] Applying changes updates the upstream tracker and creates history.
- [ ] The source result becomes disabled or marked applied.
- [ ] A second application is rejected.
- [ ] Insufficient Momentum makes no change.
- [ ] Momentum cannot be paid with Momentum generated by the same test.
- [ ] Momentum caps at 6 and excess is reported.
- [ ] A failed adapter probe changes no state and logs diagnostics.

Pool transactions — multiplayer:

- [ ] A player sees the application button only on their own result.
- [ ] A player without an active GM receives a clear error.
- [ ] A player request is applied by the active GM.
- [ ] With several active GMs, only the selected authoritative GM writes.
- [ ] The player receives success or failure feedback.
- [ ] Every client sees the updated pools, source message and history.

## 7. Risks

- **Upstream pool API uncertainty:** the 13.0.1 runtime interface must be confirmed; the adapter must fail without mutation when unsupported.
- **Concurrent requests:** the local GM lock and message state reduce duplicate application, but true distributed atomic transactions are unavailable.
- **Partial writes:** rollback is best effort and must be tested when both pools change.
- **Actor-sheet hook variance:** validate every upstream sheet variant and retain a Token-control fallback.
- **Native-control detection:** upstream names or callbacks may change; hiding remains optional.
- **Foundry API changes:** support one major Foundry version at a time.
- **Duplicated result logic:** keep it small, pure and tested.
- **Documentation sprawl:** keep only the approved project and user documents.

## 8. Current status

- Repository is public and pre-alpha.
- Module 0.3.0 targets Foundry 13.351 and Dune 13.0.1.
- Guided test and module-specific language selection are operational in initial manual testing.
- Settings labels are now translated using the module language.
- Explicit Momentum and Threat transaction code is implemented.
- Pure pool-plan tests and JavaScript syntax checks are included in `npm run check`.
- GitHub Actions are disabled.
- The exact upstream pool adapter and multiplayer workflow remain unverified in Foundry.

Next step: update to 0.3.0, first test a simple generated-Momentum application as GM, then test a Threat-funded extra die. Capture the complete `Dune QoL` console diagnostic if the upstream adapter cannot find the pools.

## 9. Decision log

### D-0001 — Separate companion module

- Date: 2026-08-06
- Status: Accepted
- Decision: Build `dune-qol` as a separate module rather than modifying or forking the Dune system.

### D-0002 — Project identifiers

- Date: 2026-08-06
- Status: Accepted
- Decision: Use `foundryvtt-dune-qol` for the repository and `dune-qol` for the module id.

### D-0003 — Initial 13.0.2 baseline

- Date: 2026-08-06
- Status: Superseded by D-0017
- Decision: Initially use Dune 13.0.2 because that version appears in upstream development.

### D-0004 — One central project document

- Date: 2026-08-06
- Status: Amended by D-0018
- Decision: Keep scope, architecture, roadmap, status, risks, testing and decisions in `docs/PROJECT.md`.

### D-0005 — Record meaningful decisions with changes

- Date: 2026-08-06
- Status: Accepted
- Decision: Lasting product and technical choices must be recorded when implemented.

### D-0006 — Disclose AI assistance

- Date: 2026-08-06
- Status: Accepted
- Decision: Prominently disclose substantial AI assistance while retaining human review responsibility.

### D-0007 — No initial runtime dependencies

- Date: 2026-08-06
- Status: Accepted
- Decision: Depend only on Foundry and the Dune system initially.

### D-0008 — Workflow-value priority order

- Date: 2026-08-06
- Status: Accepted
- Decision: Implement guided tests, then pool transactions, Traits and Complications, then activation tracking.

### D-0009 — Dependency-free validation with CI

- Date: 2026-08-06
- Status: Superseded by D-0010
- Decision: Use a small standard-library Node script locally and in GitHub Actions.

### D-0010 — Manual validation only

- Date: 2026-08-06
- Status: Accepted
- Decision: Keep `npm run check`, but remove GitHub Actions to avoid recurring credit consumption.

### D-0011 — Use Foundry core Roll

- Date: 2026-08-06
- Status: Accepted
- Decision: Use core `Roll` and `Roll.toMessage` with a local result calculator instead of upstream `DuneRoll.performTest`.

### D-0012 — Defer shared-pool mutations

- Date: 2026-08-06
- Status: Superseded by D-0023
- Decision: Initially record extra-die source and cost without changing Momentum or Threat.

### D-0013 — Complications independent of success

- Date: 2026-08-06
- Status: Accepted
- Decision: One die may produce both success and complication.

### D-0014 — Versioned ChatMessage metadata

- Date: 2026-08-06
- Status: Amended by D-0026
- Decision: Store guided-test metadata under `flags.dune-qol.guidedTest`.

### D-0015 — Token controls entry point

- Date: 2026-08-06
- Status: Superseded by D-0019
- Decision: Initially open guided tests from Token scene controls.

### D-0016 — Public development installation

- Date: 2026-08-06
- Status: Accepted
- Decision: Support installation through a raw manifest URL with a development ZIP from `main`.

### D-0017 — Target the published Dune version

- Date: 2026-08-06
- Status: Accepted
- Decision: Support Dune 13.0.1 rather than unreleased 13.0.2.

### D-0018 — Add one dedicated user guide

- Date: 2026-08-06
- Status: Accepted
- Decision: Add `docs/USER-GUIDE.md` as the only user-facing manual.

### D-0019 — Make the Actor sheet the default launcher

- Date: 2026-08-06
- Status: Accepted
- Decision: Add the Guided test button to supported Actor-sheet title bars by default and make Token controls optional.

### D-0020 — Provide module-specific language selection

- Date: 2026-08-06
- Status: Accepted
- Decision: Let each user choose English or French for Dune QoL independently of Foundry's global language.

### D-0021 — Prefer Guided test over the native roller

- Date: 2026-08-06
- Status: Accepted
- Decision: Add an enabled-by-default setting that hides detected native Dune roller controls while leaving upstream code untouched.

### D-0022 — Never fail silently when opening Guided test

- Date: 2026-08-06
- Status: Accepted
- Decision: An opening failure always creates a visible notification and a detailed console error.

### D-0023 — Require explicit confirmation for shared-pool changes

- Date: 2026-08-06
- Status: Accepted
- Decision: Guided tests may propose Momentum and Threat changes, but those changes are applied only after a user clicks the result-card action.
- Rationale: Shared-resource automation must remain visible, understandable and reversible through normal table decisions.
- Consequence: Rolling never silently changes a shared pool.

### D-0024 — Use an active GM as transaction authority

- Date: 2026-08-06
- Status: Accepted
- Decision: A player request is sent through the module socket and executed by the first active GM ordered by user id; a GM may execute their own request locally.
- Rationale: Shared pools require a single authoritative writer and normal players may lack permission to update upstream storage.
- Consequence: Player application requires an active GM. The socket payload is treated as a request and permissions are rechecked by the GM.

### D-0025 — Isolate and feature-detect the upstream pool API

- Date: 2026-08-06
- Status: Accepted
- Decision: Access Dune pools only through `adapters/dune-pools.mjs`, probing registered settings and known method shapes without directly assigning guessed properties.
- Rationale: The upstream system does not expose a documented stable external pool API.
- Consequence: Unsupported versions fail with diagnostics and no intended mutation; every supported version requires runtime validation.

### D-0026 — Version pool plans and applications in ChatMessage flags

- Date: 2026-08-06
- Status: Accepted
- Decision: Guided-test flag schema version 2 stores a versioned pool plan and application state; successful transaction history uses `flags.dune-qol.poolTransaction` version 1.
- Rationale: The chat result is the durable source context for permission checks, duplicate detection and history.
- Consequence: Incompatible schema changes require version increments and compatibility handling.

### D-0027 — Enforce pre-funded purchases and a Momentum cap of six

- Date: 2026-08-06
- Status: Accepted
- Decision: Momentum used for extra dice must be present before the test, generated Momentum cannot fund that purchase retroactively, and the final shared Momentum pool is capped at 6.
- Rationale: Cost and generation occur at different stages of the test, and excess Momentum must not silently exceed the shared-pool limit.
- Consequence: An otherwise non-negative net delta can still fail when the initial pool cannot pay the declared cost; discarded excess is recorded in chat history.

### D-0028 — Record every successful pool transaction in chat

- Date: 2026-08-06
- Status: Accepted
- Decision: After a successful application, create a separate public chat card containing requester, Actor, before and after values, and discarded Momentum.
- Rationale: Shared state should be auditable without inspecting hidden flags or the browser console.
- Consequence: Pool applications add one additional chat message and do not currently provide an automatic reversal action.
