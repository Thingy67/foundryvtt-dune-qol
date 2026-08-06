# Project source of truth

Central living reference for **Dune: Adventures in the Imperium QoL**. Keep product scope, architecture, roadmap, status, testing notes, risks and decisions here instead of creating many separate documents.

Last updated: 2026-08-06

## 1. Project summary

`dune-qol` is a companion module for Foundry Virtual Tabletop. It adds optional comfort features to the community Dune system without modifying or replacing that system.

Current baseline:

- Foundry VTT: version 13, build 351;
- upstream system id: `dune`;
- supported upstream version: **13.0.1**, currently published in the Foundry catalog;
- module id: `dune-qol`;
- module version: **0.1.1**;
- repository: public, pre-alpha.

The upstream development branch currently identifies itself as 13.0.2, but that version is not yet the catalog release. The module must target the version users can actually install unless a newer version is genuinely required.

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

Status: **implemented; manual validation pending**.

Implemented:

- Foundry module manifest;
- public manifest installation URL and development ZIP download;
- ES-module entry point and stylesheet;
- English and French localization;
- dependency-free local validation;
- centralized documentation and decision log.

Remaining:

- run `npm run check` from a real checkout;
- confirm installation and activation on Foundry 13.351 with Dune 13.0.1;
- confirm no console errors or unintended world-data changes.

### Phase 1 — Guided test workflow

Status: **implemented in 0.1.1; manual Foundry validation pending**.

Implemented:

- launch from Token scene controls;
- use one selected token, or the user's assigned character as fallback;
- validate Actor ownership and supported data;
- select Skill and Drive;
- enter an optional Focus with Actor-derived suggestions;
- set difficulty from 0 to 5;
- roll 2 to 5 dice;
- set complication range from 15 to 20;
- show progressive extra-die costs of 0, 1, 3 and 6;
- record the declared extra-die source;
- spend Determination and add its automatic result of 1;
- calculate successes, complications, success or failure and generated Momentum;
- post an enriched localized chat result;
- store versioned metadata under `flags.dune-qol.guidedTest`;
- leave shared Momentum and Threat pools unchanged.

Remaining:

- validate the real 13.0.1 Actor data structure, particularly Focus storage;
- validate public, private, blind and self rolls;
- validate Dice So Nice compatibility and visual presentation;
- fix runtime issues found during the first manual session.

### Phase 2 — Momentum and Threat transactions

Status: **planned**.

- authoritative transaction service;
- permissions and multiplayer synchronization;
- actor, user, amount and reason attribution;
- visible chat history;
- integration with guided tests;
- safeguards against silent or duplicate changes.

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
├── domain/
│   └── dune-test.mjs
└── features/
    └── guided-test.mjs
```

The guided test reads the upstream Actor data model but uses Foundry core `Roll` and `Roll.toMessage` APIs. Calculation logic is isolated in a pure domain module because the upstream roller does not accept difficulty or retain all context needed by the QoL card.

No custom world-data model exists. Guided-test metadata is stored only on its ChatMessage. Future storage preference:

1. existing upstream documents and pools;
2. `dune-qol` flags;
3. world settings;
4. custom documents only when necessary.

Shared-state features must establish authority, permissions, validation and duplicate handling before sockets are introduced.

No public module API exists yet.

## 5. Documentation policy

Primary Markdown documents:

- `README.md`: public overview, installation and current feature;
- `AGENTS.md`: working rules for humans and AI agents;
- `docs/PROJECT.md`: this source of truth.

Do not create separate roadmap, architecture, ADR, decision or TODO files without an explicit recorded decision.

## 6. Testing

Run manually from a repository checkout:

```bash
npm run check
```

This verifies required files, JSON validity, manifest relationships and references, matching package versions, documentation policy and pure guided-test calculations.

No GitHub Actions workflow is used.

### Foundry checklist

Loading:

- [ ] Foundry 13.351 installs module 0.1.1 from the raw manifest URL.
- [ ] Dune 13.0.1 satisfies the module relationship.
- [ ] The module activates without console errors.
- [ ] Activation does not alter existing world data.

Guided test:

- [ ] The d20 button appears in Token controls.
- [ ] Token and assigned-character Actor selection work.
- [ ] Error cases produce clear warnings.
- [ ] Skills, Drives, Focuses and Determination are read correctly.
- [ ] Focus and non-Focus critical successes are correct.
- [ ] Difficulty and generated Momentum are correct.
- [ ] Success and complication can occur on the same die.
- [ ] Extra-die costs are 0, 1, 3 and 6.
- [ ] Shared pools remain unchanged.
- [ ] Determination spends exactly one point.
- [ ] All roll modes work.
- [ ] Dice So Nice remains compatible.
- [ ] English and French display correctly.

## 7. Risks

- **Upstream data changes:** isolate access and retest each supported version.
- **Foundry API changes:** support one major Foundry version at a time.
- **Duplicated result logic:** keep it small, pure and tested.
- **Multiplayer consistency:** design authority before shared-state automation.
- **Excessive automation:** expose changes and preserve game-master control.
- **Documentation sprawl:** keep this file authoritative.

## 8. Current status

- Repository is public and pre-alpha.
- Module 0.1.1 declares compatibility with Foundry 13 and Dune 13.0.1.
- Manifest installation is available from the raw `module.json` URL.
- Guided-test code and pure calculation checks are present.
- GitHub Actions are disabled.
- Full local and Foundry runtime validation remains pending.
- Shared Momentum and Threat automation is not implemented.

Next step: reinstall or refresh the module in Foundry 13.351, test it with Dune 13.0.1, and fix the first runtime issues before Phase 2.

## 9. Decision log

### D-0001 — Separate companion module

- Date: 2026-08-06
- Status: Accepted
- Decision: Build `dune-qol` as a separate module rather than modifying or forking the Dune system.
- Consequence: Integration must tolerate upstream changes.

### D-0002 — Project identifiers

- Date: 2026-08-06
- Status: Accepted
- Decision: Use `foundryvtt-dune-qol` for the repository and `dune-qol` for the module id.

### D-0003 — Initial 13.0.2 baseline

- Date: 2026-08-06
- Status: Superseded by D-0017
- Decision: Initially use Dune 13.0.2 because that version appears in the upstream development manifest.
- Consequence: This incorrectly required an unreleased version and was corrected.

### D-0004 — One central project document

- Date: 2026-08-06
- Status: Accepted
- Decision: Keep scope, architecture, roadmap, status, risks, testing and decisions together in `docs/PROJECT.md`.

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
- Rationale: The upstream method lacks difficulty and the complete QoL context.

### D-0012 — Defer shared-pool mutations

- Date: 2026-08-06
- Status: Accepted
- Decision: Phase 1 records extra-die source and cost but does not change Momentum or Threat. Determination may update the owned Actor.

### D-0013 — Complications independent of success

- Date: 2026-08-06
- Status: Accepted
- Decision: One die may produce both success and complication.

### D-0014 — Versioned ChatMessage metadata

- Date: 2026-08-06
- Status: Accepted
- Decision: Store guided-test metadata under `flags.dune-qol.guidedTest` with schema version 1.

### D-0015 — Token controls entry point

- Date: 2026-08-06
- Status: Accepted
- Decision: Open guided tests from Token scene controls using one selected token or the assigned character.

### D-0016 — Public development installation

- Date: 2026-08-06
- Status: Accepted
- Decision: Make the repository public and support installation through a raw manifest URL with a development ZIP from `main`.
- Consequence: This is convenient for pre-alpha testing but is not a stable release channel.

### D-0017 — Target the published Dune version

- Date: 2026-08-06
- Status: Accepted
- Decision: Set the minimum and verified Dune system version to 13.0.1 and release the correction as module 0.1.1.
- Rationale: 13.0.1 is the current Foundry catalog release; 13.0.2 exists only in upstream development, and the module uses no 13.0.2-specific API.
- Consequence: Foundry 13.351 with Dune 13.0.1 can install and enable the module for manual testing.
