# Project source of truth

This document is the central living reference for **Dune: Adventures in the Imperium QoL**.

It intentionally combines product scope, architecture, roadmap, status, risks, testing notes and the decision log. Do not split those subjects into separate documents without an explicit recorded decision.

Last updated: 2026-08-06

## 1. Project summary

`dune-qol` is a companion module for Foundry Virtual Tabletop that adds optional quality-of-life workflows to the community Dune game system.

The project should improve comfort and traceability at the virtual table while preserving the upstream system as the authoritative data model and basic rules implementation.

### Initial compatibility baseline

- Foundry Virtual Tabletop: version 13.
- Upstream system id: `dune`.
- Upstream reference version: 13.0.2.
- Module id: `dune-qol`.
- Repository status: private and pre-alpha.

## 2. Product principles

1. **Companion, not fork.** Extend the existing system without modifying its installed files.
2. **Assist, do not obscure.** Automation must expose what it changed and why.
3. **Respect table authority.** Shared-state mutations must follow Foundry permissions and game-master authority.
4. **Progressive enhancement.** The upstream system must remain usable when this module is disabled.
5. **Small, understandable features.** Prefer narrow workflows over a large opaque automation engine.
6. **Minimal dependencies.** Add dependencies only when they clearly reduce long-term cost or risk.
7. **Localization ready.** User-facing features should support English and French from their first usable release.
8. **No copyrighted rule content.** Implement workflows and calculations without reproducing commercial rules text or sourcebook content.
9. **Document decisions, not noise.** Capture meaningful choices and consequences while keeping documentation concentrated.
10. **Human accountability for AI output.** AI assistance is disclosed and every accepted change remains the maintainer's responsibility.

## 3. Goals and non-goals

### Goals

- Reduce repetitive steps during common Dune 2d20 tests.
- Make Momentum and Threat changes understandable and auditable.
- Improve handling of Traits and Complications.
- Provide an activation workflow that better matches Dune conflicts than a numeric initiative order.
- Offer useful supporting-character and campaign conveniences after the core workflows are stable.
- Remain maintainable across upstream system releases.

### Non-goals

- Reimplement the complete Dune ruleset.
- Replace the upstream character, House, Asset or Item sheets without a specific demonstrated need.
- Become a generic 2d20 framework.
- Distribute rulebook text, proprietary artwork or commercial compendium data.
- Guarantee compatibility with Foundry versions or upstream system versions that have not been tested.
- Automate subjective game-master rulings.

## 4. Planned functional scope

### Phase 0 — Repository and loading scaffold

Status: **In progress**

- Foundry module manifest.
- Minimal ES-module entry point.
- Repository validation command.
- English and French localization scaffold.
- Centralized documentation and decision log.
- Initial continuous-integration validation.

Exit condition: Foundry 13 recognizes and loads the module in a world using system `dune`, and repository checks pass.

### Phase 1 — Guided test workflow

Status: **Planned**

- Select or confirm Skill and Drive.
- Select applicable Focus.
- Set difficulty and complication range.
- Choose base dice and extra-die purchases.
- Handle Determination input.
- Roll through a clearly defined adapter around the upstream system.
- Display Skill, Drive, Focus, difficulty, dice, successes, complications and generated Momentum in the chat result.
- Avoid automatically spending or generating shared resources until the transaction model is established.

Exit condition: a normal player test can be completed from one guided dialog and produces an understandable chat record.

### Phase 2 — Momentum and Threat transactions

Status: **Planned**

- Central transaction service around upstream pools.
- Permission checks and game-master authority.
- Reason and actor attribution.
- Chat-visible history for relevant transactions.
- Configurable confirmations where useful.
- Integration with the guided test workflow.
- Safe multiplayer synchronization.

Exit condition: purchases and generated Momentum can update pools without silent or ambiguous state changes.

### Phase 3 — Traits and Complications

Status: **Planned**

- Quick creation of actor Traits from a result.
- Management of temporary Traits.
- Game-master workflow for Complications.
- Links between a roll result and created state when practical.
- Deliberate design for scene-level or zone-level Traits before adding persistent custom storage.

Exit condition: a complication can be resolved into a documented, visible game state without manual navigation across several sheets.

### Phase 4 — Activation tracker

Status: **Planned**

- Side holding the initiative.
- Actors already activated in the current round.
- Pass or retain initiative workflow.
- Resource cost integration.
- Round reset and history.
- Compatibility with supporting characters and NPCs.

Exit condition: a conflict round can be run without relying on numeric initiative values.

### Later candidates

These are not committed scope and require separate decisions before implementation:

- supporting-character control handoff;
- conflict zones and Asset movement;
- House-project and campaign clocks;
- token HUD or Token Action HUD adapter;
- macro compendium exposing the module API;
- import/export helpers;
- optional integrations with third-party modules.

## 5. Architecture baseline

### Package boundary

The project is a Foundry module, not a system. It declares compatibility with system `dune` and loads only as an extension of a Dune world.

### Upstream integration

The upstream system currently exposes runtime objects under `game.dune`, including a `DuneRoll` implementation and pool management. These are potentially useful integration points, but they are not assumed to be stable public APIs.

Before using an upstream object:

1. inspect the current upstream implementation;
2. isolate access behind a local adapter;
3. feature-detect before calling it;
4. fail clearly when unsupported;
5. record compatibility-sensitive decisions here.

### Proposed source organization

The source tree should grow by feature only when needed:

```text
scripts/
├── dune-qol.mjs
├── adapters/       # Boundaries around upstream or Foundry APIs
├── applications/   # Dialogs and persistent UI applications
├── features/       # Test, pool, trait and activation workflows
├── services/       # Shared state mutation and domain services
└── utils/          # Small generic helpers only
```

Do not create empty directories merely to match this plan.

### Data storage

No custom persistent data model has been accepted yet.

Preferred order of consideration:

1. existing upstream Actor, Item or pool data;
2. Foundry flags scoped to `dune-qol`;
3. dedicated world settings for small shared configuration;
4. custom Documents or collections only if earlier options are insufficient.

Any persistent schema requires a version, migration strategy and decision entry before release.

### Multiplayer and authority

Shared state should be mutated by an authoritative game-master client unless Foundry already provides a safe permissioned document update path.

Socket use must not be introduced until a concrete workflow requires it. When introduced, message validation, permissions and duplicate handling must be documented.

### Public module API

A small API may eventually be exposed at:

```js
game.modules.get("dune-qol")?.api
```

No public API contract exists yet. Once published, breaking changes require versioning and migration notes.

## 6. Documentation policy

The project has three primary Markdown documents:

- `README.md` for a stable public overview;
- `AGENTS.md` for working rules;
- `docs/PROJECT.md` for all evolving project knowledge.

This document is authoritative for:

- current scope;
- roadmap and status;
- architecture;
- risks;
- manual test expectations;
- project decisions.

GitHub issues may hold actionable tasks and discussions, but accepted outcomes must be reflected here when they affect the project direction.

## 7. Testing strategy

### Automated repository checks

The initial check command should verify at minimum:

- required files exist;
- JSON files parse;
- `module.json` has the expected id and compatibility relationship;
- referenced local entry-point files exist.

Later checks may add linting, formatting and unit tests when the codebase justifies the tooling.

### Manual Foundry checklist

For the initial scaffold:

- [ ] Foundry 13 lists the module.
- [ ] A world using system `dune` can enable the module.
- [ ] The module initializes without console errors.
- [ ] The initialization message identifies the module version.
- [ ] Enabling or disabling the module does not modify world data.

Each user-facing feature must add its own concise manual checks here or replace them with automated coverage.

## 8. Known risks

### Upstream internal API changes

The upstream system may change `game.dune`, sheet implementations, pool behavior or roll internals without maintaining compatibility for external modules.

Mitigation: local adapters, feature detection, a narrow compatibility baseline and manual validation against each supported upstream version.

### Foundry API evolution

Foundry major versions can significantly change Applications, sheets, document APIs and scene controls.

Mitigation: target one major version at a time and avoid claiming compatibility without testing.

### Multiplayer consistency

Momentum, Threat and activation state can be changed concurrently by multiple clients.

Mitigation: establish authority and transaction rules before implementing shared-state automation.

### Excessive automation

Too much automatic behavior can hide rules, surprise the game master or make house rules difficult.

Mitigation: visible transactions, configurable behavior and a progressive feature design.

### Documentation sprawl

AI-assisted work can generate many overlapping notes and design documents.

Mitigation: enforce the three-document policy and keep this file as the source of truth.

## 9. Current status

- Repository created as private.
- Project name and ids selected.
- Initial goals discussed.
- No user-facing functionality implemented yet.
- Foundation files are being added.

Next expected step: complete Phase 0, validate loading in Foundry 13 and then design the Phase 1 test adapter against the current upstream implementation.

## 10. Decision log

### D-0001 — Implement a separate companion module

- Date: 2026-08-06
- Status: Accepted
- Decision: Build `dune-qol` as a separate Foundry module instead of forking or modifying `foundryvtt-dune-system`.
- Rationale: This preserves upstream updates, allows features to be enabled independently and reduces maintenance conflicts.
- Consequences: Integration must be isolated from upstream internals and compatibility must be tested explicitly.

### D-0002 — Use `foundryvtt-dune-qol` and `dune-qol` as identifiers

- Date: 2026-08-06
- Status: Accepted
- Decision: Use `foundryvtt-dune-qol` for the repository and `dune-qol` for the Foundry module id.
- Rationale: The repository name is clear and consistent with the upstream project, while the module id is short and unambiguous.
- Consequences: The installed module directory must be named `dune-qol`.

### D-0003 — Target Foundry 13 and Dune system 13.0.2 initially

- Date: 2026-08-06
- Status: Accepted
- Decision: Establish Foundry 13 and upstream Dune system 13.0.2 as the initial development and compatibility baseline.
- Rationale: The current upstream manifest targets Foundry 13 and identifies version 13.0.2.
- Consequences: Other major versions are unsupported until deliberately tested and recorded.

### D-0004 — Keep evolving project knowledge in one central document

- Date: 2026-08-06
- Status: Accepted
- Decision: Keep scope, roadmap, architecture, status, risks, testing notes and decisions together in `docs/PROJECT.md`.
- Rationale: The project needs durable context for human and AI contributors without requiring consultation of dozens of small files.
- Consequences: Separate architecture, roadmap, TODO and ADR documents are prohibited by default. A future split requires a new decision.

### D-0005 — Record every meaningful decision in the same change

- Date: 2026-08-06
- Status: Accepted
- Decision: Product and technical decisions with lasting consequences must be appended to this decision log in the commit or pull request that implements them.
- Rationale: Development conversations, especially AI-assisted ones, are not a durable project record.
- Consequences: A change that introduces an undocumented meaningful decision is incomplete.

### D-0006 — Disclose substantial AI assistance

- Date: 2026-08-06
- Status: Accepted
- Decision: State prominently that AI tools substantially assist analysis, design, implementation, testing and documentation.
- Rationale: The development process should be transparent, and generated output must not be mistaken for independently verified work.
- Consequences: Human review remains mandatory and the disclosure must remain present unless the maintainer explicitly changes this policy.

### D-0007 — Start without runtime dependencies

- Date: 2026-08-06
- Status: Accepted
- Decision: Do not require third-party Foundry modules or JavaScript runtime libraries in the initial scaffold.
- Rationale: The first workflows can be evaluated against Foundry and the upstream Dune system directly, reducing compatibility and support cost.
- Consequences: Any dependency added later requires a recorded decision and a clear fallback or installation story.

### D-0008 — Implement features in workflow-value order

- Date: 2026-08-06
- Status: Accepted
- Decision: Prioritize the guided test workflow, then pool transactions, Traits and Complications, and finally the activation tracker.
- Rationale: The guided test and resource workflows are expected to remove the most frequent table friction and establish reusable foundations.
- Consequences: Later campaign and HUD conveniences remain candidates rather than committed scope.
