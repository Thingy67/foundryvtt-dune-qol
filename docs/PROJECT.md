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
- module version: **0.4.0**;
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

Status: **implemented and manually validated on the current baseline**.

Implemented:

- Foundry module manifest and public installation URL;
- ES-module entry points, settings, localization and stylesheet;
- English and French resources;
- dependency-free local validation command;
- concentrated project and user documentation;
- no GitHub Actions workflow.

### Phase 1 — Guided test workflow

Status: **implemented; core workflow manually validated**.

Implemented:

- Guided test as the preferred dice interface;
- launcher in supported Actor-sheet title bars;
- optional launcher in Token scene controls;
- optional hiding of native Dune roller controls;
- module-specific English or French selection;
- selected-token or assigned-character fallback;
- Skill, Drive, optional Focus, difficulty, dice and complication range;
- dynamic extra-die source and progressive cost;
- Determination spending;
- successes, complications, outcome and generated Momentum;
- enriched localized chat result;
- visible notifications and console errors.

Remaining:

- validate all Actor and sheet variants;
- validate every roll-visibility mode and Dice So Nice in multiplayer;
- refine Focus selection after more real-character testing.

### Phase 2 — Momentum and Threat transactions

Status: **MVP implemented; game-master path manually validated**.

Implemented:

- pure calculation of the resource plan produced by a Guided test;
- explicit result-card confirmation instead of automatic mutation;
- Momentum purchase, generation and Threat purchase in one plan;
- pre-funded Momentum validation;
- Momentum cap of 6 and discarded-excess reporting;
- active-GM authority for player requests through the module socket;
- permission checks;
- feature-detected adapter around upstream shared pools;
- preflight validation, duplicate protection and best-effort rollback;
- source-message state marking;
- public transaction history with before and after values;
- diagnostic output when no supported upstream interface is detected.

Remaining:

- validate the player-request path with one and several active GMs;
- validate insufficient Momentum and cap behavior through the UI;
- validate pool refresh on every connected client;
- decide later whether standalone pool controls and transaction reversal are useful.

### Phase 3 — Traits and Complications

Status: **initial MVP implemented in 0.4.0; Foundry validation required**.

Implemented:

- dynamic complication-resolution section on Guided-test messages;
- support for existing Guided-test messages with complications;
- one Actor Trait creation for each complication;
- Trait name dialog;
- upstream `trait` Item type with `system.temporary` enabled by default;
- active-GM authority for player requests;
- requester and Actor permission checks;
- in-memory duplicate-processing protection;
- source-message record of created Traits and remaining complications;
- Item provenance under module flags;
- rollback of the new Item if source-message recording fails;
- separate public history message for each created Trait;
- pure resolution calculations and regression checks.

Remaining:

- validate Trait creation on every supported Actor type;
- validate the player-request path;
- confirm the upstream sheets refresh immediately and display the Trait correctly;
- add quick management of temporary Traits;
- decide later whether complications can also be converted to Threat or other table-defined outcomes.

### Phase 4 — Game-master test requests

Status: **planned**.

- game master prepares context and difficulty;
- one player or several players receive the request;
- the player selects the applicable Skill, Drive and Focus;
- the result remains linked to the request.

### Phase 5 — Activation tracker

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
│   ├── pool-plan.mjs
│   └── complication-resolution.mjs
├── features/
│   ├── guided-test.mjs
│   └── guided-test-ui.mjs
└── services/
    ├── pool-transactions.mjs
    └── complication-traits.mjs
```

### Guided tests

The Guided test reads upstream Actor data but uses Foundry core `Roll` and `Roll.toMessage`. Calculation logic is isolated from Foundry.

Guided-test data is stored under:

```text
flags.dune-qol.guidedTest
```

Existing schema version 2 messages remain readable. A message is upgraded to at least version 3 when a complication Trait is recorded.

### Localization and settings

The selected module dictionary is loaded independently of Foundry's global language. The settings configuration is amended at render time so its labels, hints and choices use that dictionary.

### Shared pools

`domain/pool-plan.mjs` calculates desired changes without accessing Foundry.

`adapters/dune-pools.mjs` is the only boundary that probes upstream pool storage and mutation methods.

`services/pool-transactions.mjs` owns authority, permissions, socket requests, duplicate protection, writes, rollback and chat history. A non-GM client never writes shared pools directly.

Successful history messages use:

```text
flags.dune-qol.poolTransaction
```

### Complication Traits

`domain/complication-resolution.mjs` calculates total, resolved and remaining complications and prevents recording more Traits than the roll produced.

`services/complication-traits.mjs` injects the result-card UI at render time. This avoids rewriting old chat content and lets compatible older Guided-test messages receive the new action.

A player request is sent through the module socket and executed by the first active GM ordered by user id. The service creates an upstream embedded Item:

```js
{
  type: "trait",
  system: { temporary: true }
}
```

Created Items store provenance under:

```text
flags.dune-qol.complicationTrait
```

The source Guided-test message stores created Trait records under:

```text
flags.dune-qol.guidedTest.complicationResolution
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

Do not create separate roadmap, architecture, ADR, decision, TODO, release-note or per-feature manual files without a new recorded decision.

## 6. Testing

Run manually from a repository checkout:

```bash
npm run check
```

The command performs JavaScript syntax checks, required-file and JSON checks, manifest validation, documentation-policy checks and pure regression checks for tests, pools and complication resolution. No GitHub Actions workflow is used.

### Foundry checklist — 0.4.0

Loading:

- [ ] Foundry 13.351 installs and displays module 0.4.0.
- [ ] Dune 13.0.1 satisfies the system relationship.
- [ ] The module activates without console errors.

Guided test and pools:

- [x] Actor-sheet Guided-test launcher works.
- [x] Module language and launcher settings work.
- [x] Extra-die source activates from 3 dice onward.
- [x] A GM can apply generated Momentum and receive history.
- [ ] A player can request a pool transaction from an active GM.

Complication Traits — GM:

- [ ] A result with zero complications has no complication section.
- [ ] A result with one complication offers one Trait creation.
- [ ] A temporary Trait appears on the correct Actor.
- [ ] Clearing the checkbox creates a persistent Trait.
- [ ] The result shows the created Trait and zero remaining.
- [ ] A second Trait cannot be created for the same single complication.
- [ ] Two complications allow exactly two Trait creations.
- [ ] A separate history message is created for each Trait.
- [ ] An older compatible Guided-test message also receives the action.

Complication Traits — multiplayer:

- [ ] A player owning the Actor can open the creation dialog.
- [ ] Without an active GM, the player receives a clear error.
- [ ] With an active GM, the Trait is created once.
- [ ] The source message updates on every client.
- [ ] Unauthorized users do not receive an actionable button.

## 7. Risks

- **Upstream Item schema changes:** the current system defines `trait` with a `temporary` boolean; retest each supported release.
- **Concurrent requests:** local locks and source-message state reduce duplicates, but Foundry does not provide distributed atomic transactions.
- **Deleted Traits:** deleting a created Trait does not automatically reopen the original complication.
- **Partial operations:** Item creation is rolled back if source-message recording fails; history creation remains non-blocking.
- **Actor-sheet variants:** embedded Traits may render differently across Actor types.
- **Foundry API changes:** support one major Foundry version at a time.
- **Documentation sprawl:** keep only the approved project and user documents.

## 8. Current status

- Repository is public and pre-alpha.
- Module 0.4.0 targets Foundry 13.351 and Dune 13.0.1.
- Guided test, language selection, launcher placement and GM pool transactions have passed initial manual testing.
- Complication-Trait code, localization, styles and pure calculations are implemented.
- GitHub Actions are disabled.
- Foundry runtime validation of complication Traits remains pending.

Next step: update to 0.4.0, produce a Guided test with a complication, create a temporary Trait and confirm that the Actor sheet, source result and history message all update.

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
- Decision: Implement Guided tests, pool transactions, Traits and Complications, then request and activation workflows.

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
- Status: Amended by D-0026 and D-0031
- Decision: Store Guided-test metadata under `flags.dune-qol.guidedTest`.

### D-0015 — Token controls entry point
- Date: 2026-08-06
- Status: Superseded by D-0019
- Decision: Initially open Guided tests from Token scene controls.

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
- Decision: Add the Guided-test button to supported Actor-sheet title bars by default and make Token controls optional.

### D-0020 — Provide module-specific language selection
- Date: 2026-08-06
- Status: Accepted
- Decision: Let each user choose English or French for Dune QoL independently of Foundry's global language.

### D-0021 — Prefer Guided test over the native roller
- Date: 2026-08-06
- Status: Accepted
- Decision: Hide detected native Dune roller controls by default while leaving upstream code untouched.

### D-0022 — Never fail silently when opening Guided test
- Date: 2026-08-06
- Status: Accepted
- Decision: An opening failure always creates a visible notification and detailed console error.

### D-0023 — Require explicit confirmation for shared-pool changes
- Date: 2026-08-06
- Status: Accepted
- Decision: Guided tests propose Momentum and Threat changes, applied only after a result-card action.

### D-0024 — Use an active GM as transaction authority
- Date: 2026-08-06
- Status: Accepted
- Decision: Player shared-state requests are executed by the first active GM ordered by user id.

### D-0025 — Isolate and feature-detect the upstream pool API
- Date: 2026-08-06
- Status: Accepted
- Decision: Access Dune pools only through `adapters/dune-pools.mjs` and fail clearly when unsupported.

### D-0026 — Version pool plans and applications in ChatMessage flags
- Date: 2026-08-06
- Status: Accepted
- Decision: Guided-test schema version 2 stores pool plans and application state; transaction history uses `flags.dune-qol.poolTransaction` version 1.

### D-0027 — Enforce pre-funded purchases and a Momentum cap of six
- Date: 2026-08-06
- Status: Accepted
- Decision: Momentum purchases require pre-existing Momentum, and final Momentum is capped at 6.

### D-0028 — Record every successful pool transaction in chat
- Date: 2026-08-06
- Status: Accepted
- Decision: Create a separate public chat card with requester, Actor, before and after values and discarded Momentum.

### D-0029 — Create one Actor Trait per complication
- Date: 2026-08-06
- Status: Accepted
- Decision: Each complication on a Guided-test result may resolve into exactly one embedded Actor Trait.
- Rationale: This maps the result to visible game state without hiding the game master's choice of Trait name.
- Consequence: Deleting the Trait later does not automatically reopen the original complication.

### D-0030 — Use the upstream trait Item and temporary field
- Date: 2026-08-06
- Status: Accepted
- Decision: Create upstream Items with `type: "trait"` and set `system.temporary` from the creation dialog, defaulting to true.
- Rationale: Reusing the system data model keeps Traits visible on normal Dune sheets and avoids custom persistent documents.
- Consequence: Compatibility depends on the upstream Trait schema and must be retested per release.

### D-0031 — Record complication resolution on the source message
- Date: 2026-08-06
- Status: Accepted
- Decision: Store created Trait records under `flags.dune-qol.guidedTest.complicationResolution` and upgrade the message schema to at least version 3 when first used.
- Rationale: The source result must track remaining complications and prevent normal over-creation.
- Consequence: Failure to record the source state triggers rollback of the newly created Item.

### D-0032 — Execute player Trait requests through the active GM
- Date: 2026-08-06
- Status: Accepted
- Decision: A player may open the dialog for an owned Actor, but the active GM performs Item creation and source-message updates.
- Rationale: This gives one authoritative writer and consistent permissions for embedded Items and chat messages.
- Consequence: Player creation requires an active GM; GM creation remains local.

### D-0033 — Inject complication controls at chat render time
- Date: 2026-08-06
- Status: Accepted
- Decision: Add the complication-resolution section through `renderChatMessage` instead of permanently rewriting the original HTML content.
- Rationale: Dynamic rendering supports compatible existing Guided-test messages and reflects current flag state and language.
- Consequence: The source message must contain complications and a valid Actor UUID; unsupported old messages remain unchanged.
