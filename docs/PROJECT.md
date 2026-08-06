# Project source of truth

This document is the central living reference for **Dune: Adventures in the Imperium QoL**.

It intentionally combines product scope, architecture, roadmap, current status, risks, testing notes and the decision log. Do not split those subjects into separate documents without an explicit recorded decision.

Last updated: 2026-08-06

## 1. Project summary

`dune-qol` is a companion module for Foundry Virtual Tabletop that adds optional quality-of-life workflows to the community Dune game system.

The project should improve comfort and traceability at the virtual table while preserving the upstream system as the authoritative data model and basic rules implementation.

### Initial compatibility baseline

- Foundry Virtual Tabletop: version 13.
- Upstream system id: `dune`.
- Upstream reference version: 13.0.2.
- Module id: `dune-qol`.
- Current module version: 0.1.0.
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
- Guarantee compatibility with Foundry or upstream versions that have not been tested.
- Automate subjective game-master rulings.

## 4. Planned functional scope

### Phase 0 — Repository and loading scaffold

Status: **Implemented; manual Foundry validation pending**

Implemented:

- Foundry module manifest;
- ES-module entry point;
- dependency-free repository validation command;
- English and French localization;
- centralized documentation and decision log;
- editor and ignore rules.

Remaining exit checks:

- `npm run check` passes from a repository checkout;
- Foundry 13 recognizes and loads the module in a world using system `dune`;
- the module initializes without console errors;
- enabling or disabling it does not alter existing world data.

### Phase 1 — Guided test workflow

Status: **Implemented in 0.1.0; manual Foundry validation pending**

Implemented:

- a button in the Token scene controls;
- actor resolution from one selected token, with the user's assigned character as fallback;
- ownership and supported-actor checks;
- Skill and Drive selection from the actor data;
- optional Focus entry with suggestions from the actor sheet data;
- difficulty from 0 to 5;
- total dice from 2 to 5;
- complication range from 15 to 20;
- progressive extra-die cost display and source recording;
- Determination availability check, automatic result of 1 and Actor resource decrement;
- calculation of target, successes, complications, success or failure and generated Momentum;
- an enriched localized chat card;
- versioned test metadata in ChatMessage flags;
- no automatic Momentum or Threat pool mutation.

Remaining exit checks:

- complete the manual Foundry checklist in section 7;
- confirm the current Dune Actor focus representation works with real existing characters;
- confirm the custom card and core roll display behave correctly with each roll mode and Dice So Nice.

Exit condition: a normal player test can be completed from one guided dialog and produces an understandable and correct chat record.

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
- macro compendium exposing a future module API;
- import/export helpers;
- optional integrations with third-party modules.

## 5. Architecture baseline

### Package boundary

The project is a Foundry module, not a system. It declares compatibility with system `dune` and loads only as an extension of a Dune world.

### Current source organization

```text
scripts/
├── dune-qol.mjs
├── domain/
│   └── dune-test.mjs      # Pure calculation and validation logic
└── features/
    └── guided-test.mjs    # Foundry UI, actor access, rolling and chat output
```

Create new directories only when an implemented feature requires them.

### Upstream integration

The upstream system currently exposes a `DuneRoll` implementation and pool management under `game.dune`, but these are internal integration points rather than assumed stable public APIs.

The first guided-test implementation deliberately reads the upstream Actor data model but uses Foundry's core `Roll` and `Roll.toMessage` APIs. The module performs its own small, tested result calculation because the upstream roller does not accept difficulty or retain the full test context needed by the QoL card.

Before using any other upstream object:

1. inspect the current upstream implementation;
2. isolate access behind a local boundary;
3. feature-detect before calling it;
4. fail clearly when unsupported;
5. record compatibility-sensitive decisions here.

### Data storage

No custom persistent world data model exists yet.

The guided test stores versioned metadata only on its resulting ChatMessage under:

```text
flags.dune-qol.guidedTest
```

Preferred order for future persistent data:

1. existing upstream Actor, Item or pool data;
2. Foundry flags scoped to `dune-qol`;
3. world settings for small shared configuration;
4. custom Documents or collections only if earlier options are insufficient.

Any persistent schema requires a version, migration strategy and decision entry before release.

### Multiplayer and authority

Phase 1 changes only the rolling user's owned Actor when Determination is spent. Shared Momentum and Threat pools are not mutated.

Future shared state should be mutated by an authoritative game-master client unless Foundry already provides a safe permissioned document update path. Socket use must not be introduced until a concrete workflow requires it; message validation, permissions and duplicate handling must then be documented.

### Public module API

No public module API exists yet. A small API may later be exposed at:

```js
game.modules.get("dune-qol")?.api
```

Publishing that API requires a decision defining its stability, versioning and compatibility expectations.

## 6. Documentation policy

The project has three primary Markdown documents:

- `README.md` for a stable public overview;
- `AGENTS.md` for working rules;
- `docs/PROJECT.md` for all evolving project knowledge.

This document is authoritative for current scope, roadmap, status, architecture, risks, testing expectations and decisions. GitHub issues may hold actionable tasks and discussions, but accepted outcomes must be reflected here when they affect project direction.

## 7. Testing strategy

### Manual repository checks

Run `npm run check` manually before accepting a change. It currently performs:

- required-file checks;
- JSON parsing;
- manifest id, package type and Foundry compatibility checks;
- validation of the relationship with system `dune`;
- referenced ES module, stylesheet and localization-file checks;
- package and manifest version comparison;
- AI-disclosure and documentation-policy checks;
- pure domain checks for extra-die costs, Focus successes, Determination, failure, Momentum and overlapping success/complication results.

No GitHub Actions workflow is used.

### Manual Foundry checklist

Initial loading:

- [ ] `npm run check` passes from a repository checkout.
- [ ] Foundry 13 lists module version 0.1.0.
- [ ] A world using system `dune` can enable the module.
- [ ] The module initializes without console errors.
- [ ] Enabling or disabling it does not alter existing world data.

Guided test:

- [ ] The guided-test button appears in the Token scene controls.
- [ ] One selected token is used as the Actor.
- [ ] With no selected token, the user's assigned character is used.
- [ ] No Actor, multiple selected tokens and insufficient ownership produce clear warnings.
- [ ] Skill and Drive values are read correctly from a real Player Character.
- [ ] Focus suggestions appear and using a Focus sets the critical threshold to the Skill value.
- [ ] Without a Focus, only a result of 1 produces two successes.
- [ ] Difficulty correctly determines success, failure and generated Momentum.
- [ ] A die inside the complication range can also count as a success.
- [ ] Total dice 2, 3, 4 and 5 report extra-die costs 0, 1, 3 and 6.
- [ ] Extra-die source is recorded but Momentum and Threat pools remain unchanged.
- [ ] Determination is unavailable at 0, spends exactly 1 point when used and adds an automatic result of 1.
- [ ] Public, private, blind and self roll modes are respected.
- [ ] Dice So Nice remains compatible when enabled.
- [ ] English and French labels display correctly.

## 8. Known risks

### Upstream data-model changes

The upstream system may change Actor Skills, Drives, Focuses, resources or other data without maintaining compatibility for external modules.

Mitigation: narrow data access, explicit actor validation and manual testing against each supported upstream version.

### Foundry API evolution

Foundry major versions can significantly change DialogV2, Scene controls, chat messages and document APIs.

Mitigation: target one major version at a time and avoid claiming compatibility without testing.

### Duplicate roll logic

The module now contains a small result-calculation implementation alongside the upstream roller.

Mitigation: keep the calculation pure and covered by local checks; compare behavior with upstream and rules when compatibility changes.

### Multiplayer consistency

Momentum, Threat and activation state can be changed concurrently by multiple clients once those features are implemented.

Mitigation: establish authority and transaction rules before implementing shared-state automation.

### Excessive automation

Too much automatic behavior can hide rules, surprise the game master or make house rules difficult.

Mitigation: visible transactions, configurable behavior and progressive feature design.

### Documentation sprawl

AI-assisted work can generate many overlapping notes and design documents.

Mitigation: enforce the three-document policy and keep this file as the source of truth.

## 9. Current status

- Repository is private and pre-alpha.
- AI-assisted development disclosure and agent rules are present.
- Documentation remains concentrated in three Markdown files.
- Local validation is manual; GitHub Actions are disabled.
- Module version 0.1.0 implements the first guided-test workflow.
- Pure calculation checks pass in a local Node environment.
- Full `npm run check` from a repository checkout has not yet been performed in this development session.
- No Foundry runtime validation has yet been performed.
- Shared Momentum and Threat automation is not implemented.

Next expected step: install or update the module in Foundry 13, execute the manual checklist above and fix any runtime or visual issue before beginning Phase 2.

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
- Decision: Establish Foundry 13 and upstream Dune system 13.0.2 as the initial compatibility baseline.
- Rationale: The current upstream manifest targets Foundry 13 and identifies version 13.0.2.
- Consequences: Other major versions are unsupported until deliberately tested and recorded.

### D-0004 — Keep evolving project knowledge in one central document

- Date: 2026-08-06
- Status: Accepted
- Decision: Keep scope, roadmap, architecture, status, risks, testing notes and decisions together in `docs/PROJECT.md`.
- Rationale: The project needs durable context for human and AI contributors without requiring consultation of dozens of small files.
- Consequences: Separate architecture, roadmap, TODO and ADR documents are prohibited by default.

### D-0005 — Record every meaningful decision in the same change

- Date: 2026-08-06
- Status: Accepted
- Decision: Product and technical decisions with lasting consequences must be appended to this decision log in the change that implements them.
- Rationale: Development conversations, especially AI-assisted ones, are not a durable project record.
- Consequences: A change that introduces an undocumented meaningful decision is incomplete.

### D-0006 — Disclose substantial AI assistance

- Date: 2026-08-06
- Status: Accepted
- Decision: State prominently that AI tools substantially assist analysis, design, implementation, testing and documentation.
- Rationale: The development process should be transparent, and generated output must not be mistaken for independently verified work.
- Consequences: Human review remains mandatory and the disclosure must remain present unless explicitly changed.

### D-0007 — Start without runtime dependencies

- Date: 2026-08-06
- Status: Accepted
- Decision: Do not require third-party Foundry modules or JavaScript runtime libraries in the initial implementation.
- Rationale: The first workflows can use Foundry and the upstream Dune system directly, reducing compatibility and support cost.
- Consequences: Any dependency added later requires a recorded decision and a clear installation story.

### D-0008 — Implement features in workflow-value order

- Date: 2026-08-06
- Status: Accepted
- Decision: Prioritize the guided test workflow, then pool transactions, Traits and Complications, and finally the activation tracker.
- Rationale: The guided test and resource workflows remove the most frequent table friction and establish reusable foundations.
- Consequences: Later campaign and HUD conveniences remain candidates rather than committed scope.

### D-0009 — Use dependency-free validation for the initial scaffold

- Date: 2026-08-06
- Status: Superseded by D-0010
- Decision: Validate the initial repository with a small Node.js script using only standard-library APIs, executed locally and by GitHub Actions.
- Rationale: The scaffold needed reliable structural checks without premature tooling.
- Consequences: The dependency-free local validation remains; the GitHub Actions portion was removed.

### D-0010 — Keep validation manual

- Date: 2026-08-06
- Status: Accepted
- Decision: Do not use GitHub Actions for routine validation. Run `npm run check` and Foundry runtime checks manually.
- Rationale: The repository has limited GitHub Actions credits, and continuous validation is not worth the recurring cost at this stage.
- Consequences: Contributors and AI agents must report which checks were run.

### D-0011 — Use Foundry core Roll for the guided test

- Date: 2026-08-06
- Status: Accepted
- Decision: Implement Phase 1 with Foundry's core `Roll` and `Roll.toMessage` APIs plus a local result calculator instead of calling the upstream `DuneRoll.performTest` method.
- Rationale: The upstream method does not accept difficulty or preserve Skill, Drive, Focus and generated Momentum in a form suitable for the QoL result card, and it is not treated as a stable public API.
- Consequences: The module owns a small amount of duplicated rules logic that must remain isolated and tested.

### D-0012 — Defer shared pool mutation to Phase 2

- Date: 2026-08-06
- Status: Accepted
- Decision: Phase 1 displays and records the progressive cost and source of extra dice but does not change Momentum or Threat pools. Determination is spent directly on an owned Actor because that behavior is local and already modeled by the upstream system.
- Rationale: Shared-pool mutation requires explicit authority, synchronization, history and rollback design.
- Consequences: Players must update shared pools manually during 0.1.0.

### D-0013 — Count complications independently from successes

- Date: 2026-08-06
- Status: Accepted
- Decision: Evaluate the complication range independently from the success threshold, allowing one die to produce both a success and a complication.
- Rationale: The two outcomes represent separate properties of the die result and should not be mutually exclusive.
- Consequences: This intentionally differs from the upstream implementation's current `else if` sequence and is covered by a local regression check.

### D-0014 — Store versioned guided-test metadata on ChatMessages

- Date: 2026-08-06
- Status: Accepted
- Decision: Store the selected values and computed outcome under `flags.dune-qol.guidedTest` with schema version 1.
- Rationale: Chat output should remain inspectable and later buttons or transaction workflows need structured context.
- Consequences: Any incompatible flag-schema change requires a version increment and compatibility handling.

### D-0015 — Use the Token scene controls as the first entry point

- Date: 2026-08-06
- Status: Accepted
- Decision: Open the guided test from a button in the Token scene controls, using one selected token or the user's assigned character as fallback.
- Rationale: This entry point is available during normal scene play and does not require patching upstream Actor sheets.
- Consequences: Sheet buttons or macro API access may be added later, but are not part of 0.1.0.
