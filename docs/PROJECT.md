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
- module version: **0.2.0**;
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

Status: **implemented in 0.2.0; manual Foundry validation required**.

Implemented:

- Guided test treated as the preferred dice interface;
- launcher in supported Actor-sheet title bars by default;
- optional launcher in Token scene controls;
- optional detection and hiding of native Dune roller controls, enabled by default;
- user setting for module language: English or French;
- user setting for launcher location: Actor sheet, Token controls or both;
- selected-token or assigned-character fallback for Token-control launch;
- Actor ownership and supported-data validation;
- Skill, Drive, optional Focus, difficulty, total dice and complication range;
- progressive extra-die cost and declared source;
- Determination spending and automatic result of 1;
- successes, complications, success or failure and generated Momentum;
- enriched localized chat result;
- versioned metadata under `flags.dune-qol.guidedTest`;
- visible notification and console error when opening or rolling fails;
- no automatic shared Momentum or Threat mutation.

Remaining:

- validate Actor-sheet injection against all Dune Actor-sheet variants;
- validate native-roller detection against Dune 13.0.1 controls;
- validate Focus storage on real characters;
- validate roll modes, Dice So Nice and both languages;
- fix issues found during manual testing.

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
├── settings.mjs
├── localization.mjs
├── domain/
│   └── dune-test.mjs
└── features/
    └── guided-test.mjs
```

The guided test reads upstream Actor data but uses Foundry core `Roll` and `Roll.toMessage`. Calculation logic is isolated in a pure domain module because the upstream roller does not accept difficulty or retain all context needed by the QoL card.

User-language selection is implemented by loading the chosen module dictionary directly. This changes Dune QoL strings only and does not change Foundry's global language.

The module uses public hooks to add Actor-sheet and Scene-control launchers. Native roller buttons are hidden only by filtering exposed Scene-control configuration; upstream files and methods are not modified.

No custom world-data model exists. Guided-test metadata is stored only on its ChatMessage. Future storage preference:

1. existing upstream documents and pools;
2. `dune-qol` flags;
3. world settings;
4. custom documents only when necessary.

Shared-state features must establish authority, permissions, validation and duplicate handling before sockets are introduced. No public module API exists yet.

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

This verifies required files, JSON validity, manifest relationships and references, matching package versions, documentation policy and pure guided-test calculations. No GitHub Actions workflow is used.

### Foundry checklist

Loading and settings:

- [ ] Foundry 13.351 installs module 0.2.0 from the raw manifest URL.
- [ ] Dune 13.0.1 satisfies the module relationship.
- [ ] The module activates without console errors.
- [ ] Activation does not alter existing world data.
- [ ] Configure Settings shows language, launcher location and native-roller visibility.
- [ ] Setting changes request or require a reload as expected.

Launchers:

- [ ] A supported Actor sheet shows the Guided test button in its title bar.
- [ ] The Actor-sheet button works without an active Scene.
- [ ] Token controls appear only when selected in settings and a Scene is active.
- [ ] Token and assigned-character Actor resolution work.
- [ ] Native Dune roller controls are hidden when the setting is enabled.
- [ ] Native controls return when the setting is disabled.
- [ ] Any opening failure produces a notification and console error.

Guided test:

- [ ] Skills, Drives, Focuses and Determination are read correctly.
- [ ] Focus and non-Focus critical successes are correct.
- [ ] Difficulty and generated Momentum are correct.
- [ ] Success and complication can occur on the same die.
- [ ] Extra-die costs are 0, 1, 3 and 6.
- [ ] Shared pools remain unchanged.
- [ ] Determination spends exactly one point.
- [ ] Public, private, blind and self rolls work.
- [ ] Dice So Nice remains compatible.
- [ ] Switching the module language changes Guided test between English and French.

## 7. Risks

- **Actor-sheet hook variance:** validate every upstream sheet variant and retain a Token-control fallback.
- **Native-control detection:** upstream names or callbacks may change; hiding must fail safely and remain optional.
- **Upstream data changes:** isolate access and retest each supported version.
- **Foundry API changes:** support one major Foundry version at a time.
- **Duplicated result logic:** keep it small, pure and tested.
- **Multiplayer consistency:** design authority before shared-state automation.
- **Excessive automation:** expose changes and preserve game-master control.
- **Documentation sprawl:** keep only the approved project and user documents.

## 8. Current status

- Repository is public and pre-alpha.
- Module 0.2.0 declares compatibility with Foundry 13 and Dune 13.0.1.
- Manifest installation is available from the raw `module.json` URL.
- Guided test has Actor-sheet and optional Scene launchers.
- Module-specific English/French selection is implemented.
- Native roller hiding is configurable and enabled by default.
- A single bilingual user guide is present.
- GitHub Actions are disabled.
- Full local and Foundry runtime validation remains pending for 0.2.0.
- Shared Momentum and Threat automation is not implemented.

Next step: update the module in Foundry, reload the world, validate the 0.2.0 settings and Actor-sheet button, then report any console error or control that remains duplicated.

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
- Status: Accepted
- Decision: Record extra-die source and cost without changing Momentum or Threat. Determination may update the owned Actor.

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
- Status: Superseded by D-0019
- Decision: Initially open guided tests from Token scene controls.

### D-0016 — Public development installation

- Date: 2026-08-06
- Status: Accepted
- Decision: Support installation through a raw manifest URL with a development ZIP from `main`.

### D-0017 — Target the published Dune version

- Date: 2026-08-06
- Status: Accepted
- Decision: Support Dune 13.0.1, the current Foundry catalog release, rather than unreleased 13.0.2.

### D-0018 — Add one dedicated user guide

- Date: 2026-08-06
- Status: Accepted
- Decision: Add `docs/USER-GUIDE.md` as the only user-facing manual, while keeping all development decisions and architecture in `docs/PROJECT.md`.
- Rationale: Users need operational documentation that is not mixed with implementation history, but documentation must still remain concentrated.
- Consequence: No per-feature guide files are allowed by default.

### D-0019 — Make the Actor sheet the default launcher

- Date: 2026-08-06
- Status: Accepted
- Decision: Add the Guided test button to supported Actor-sheet title bars by default and make Token controls optional through a user setting.
- Rationale: Actor sheets work without an active Scene and identify the intended Actor unambiguously.
- Consequence: Token controls remain available as an optional fallback.

### D-0020 — Provide module-specific language selection

- Date: 2026-08-06
- Status: Accepted
- Decision: Let each user choose English or French for Dune QoL independently of Foundry's global language.
- Rationale: Tables may use a Foundry interface language different from the preferred terminology for Dune.
- Consequence: The selected dictionary is loaded directly and a reload is required after changes.

### D-0021 — Prefer Guided test over the native roller

- Date: 2026-08-06
- Status: Accepted
- Decision: Add an enabled-by-default setting that hides detected native Dune roller controls while leaving upstream code untouched.
- Rationale: The native generic, native Actor-aware and QoL dialogs solve overlapping problems and create avoidable confusion.
- Consequence: Detection must fail safely, remain optional and be retested when upstream controls change.

### D-0022 — Never fail silently when opening Guided test

- Date: 2026-08-06
- Status: Accepted
- Decision: Wrap launcher actions so an opening failure always creates a visible notification and a detailed console error.
- Rationale: A non-responsive button is difficult to diagnose during manual testing.
