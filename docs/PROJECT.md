# Project source of truth

Central living reference for **Dune: Adventures in the Imperium QoL**. Scope, architecture, status, tests, risks and decisions stay in this document instead of being distributed across many files.

Last updated: 2026-08-06

## 1. Project summary

`dune-qol` is an optional companion module for the community Dune system. It extends the installed system without modifying or forking it.

Current baseline:

- Foundry VTT 13, build 351;
- Dune system id `dune`, version 13.0.1;
- module id `dune-qol`, version 0.5.2;
- public pre-alpha repository;
- English and French interfaces;
- substantial AI-assisted development with human review responsibility;
- manual validation only, without GitHub Actions.

## 2. Principles

1. Extend the upstream system; do not replace it.
2. Keep automation explicit, visible and reversible where practical.
3. Respect Foundry permissions and use a GM for authoritative shared-state changes.
4. Preserve normal Dune play when the module is disabled.
5. Prefer small understandable workflows and minimal dependencies.
6. Do not reproduce commercial rules text or copyrighted assets.
7. Support English and French from the first usable version of a feature.
8. Record meaningful decisions while keeping documentation concentrated.
9. Never claim a runtime validation that was not performed.
10. AI-generated work remains subject to human review and testing.

## 3. Scope and status

### Repository and loading scaffold

Status: **implemented and manually validated**.

- public raw manifest installation;
- Foundry and Dune compatibility declarations;
- localization, settings and stylesheet entry points;
- dependency-free `npm run check` command;
- no GitHub Actions workflow.

### Guided test

Status: **implemented and manually validated for the core GM workflow**.

- Actor-sheet launcher, with optional Token-control launcher;
- optional hiding of the native Dune roller;
- Skill, Drive, optional Focus, difficulty, dice and complication range;
- progressive extra-die cost and declared source;
- Determination spending;
- successes, complications, outcome and generated Momentum;
- enriched localized chat result and versioned flags.

Remaining: broader Actor-sheet, roll-mode, Dice So Nice and multiplayer validation.

### Momentum and Threat transactions

Status: **GM path manually validated; player path still requires multiplayer testing**.

- explicit confirmation from the result card;
- pre-funded Momentum validation and cap of 6;
- active-GM authority for player requests;
- isolated feature-detected upstream pool adapter;
- duplicate protection, preflight checks and best-effort rollback;
- source-message status and public transaction history.

### Traits and Complications

Status: **initial workflow manually validated**.

- one embedded upstream `trait` Item per complication;
- temporary by default, persistent when selected;
- active-GM authority for player requests;
- source-message resolution tracking and provenance flags;
- rollback if source-message recording fails;
- public history message.

Remaining: multiplayer player path and quick management of temporary Traits.

### Game-master test requests

Status: **delivery redesigned in 0.5.2; two-client validation required**.

- GM-only **Request test** action on supported Actor sheets;
- one non-GM Actor owner selected as recipient;
- required context, difficulty and complication range;
- optional editable Skill, Drive and Focus suggestions;
- private request ChatMessage with **Open test**;
- persistent recipient inbox under User flags;
- socket used only to prompt an online client to inspect its inbox;
- inbox checked on client ready and User-document updates;
- one-shot prefilled Guided-test dialog with requesting-GM banner;
- per-request duplicate protection;
- player acknowledgement followed by GM cleanup of the inbox entry.

Not yet implemented: completed/cancelled/expired request states, automatic link from the result to the request, group requests.

### Activation tracker

Status: **planned next major workflow**.

Expected scope: active side, activated Actors, pass/retain initiative, resource cost integration, round reset and history.

Later candidates: supporting-character handoff, conflict zones, Asset movement, House projects, campaign clocks, token HUD and macro compendium.

## 4. Architecture

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
    └── test-requests.mjs
```

### Boundaries

- `domain/` contains pure calculations with no Foundry access.
- `adapters/` isolates unstable upstream integration points.
- `services/` owns permissions, sockets, persistence and coordinated workflows.
- `features/` owns user-facing test behavior and render-time UI.

### Persistent data

Preferred storage order:

1. existing upstream Actors, Items and shared pools;
2. `dune-qol` flags on existing Foundry Documents;
3. world or client settings for small configuration;
4. custom Documents only if earlier options are insufficient.

Current flag namespaces:

```text
flags.dune-qol.guidedTest
flags.dune-qol.poolTransaction
flags.dune-qol.complicationTrait
flags.dune-qol.testRequest
flags.dune-qol.testRequestInbox
```

The test-request inbox is stored on the receiving `User` document as a request-id keyed object. The active GM removes an entry after the player acknowledges successful opening.

No public module API exists yet.

## 5. Documentation policy

Approved Markdown documents:

- `README.md`: public overview and installation;
- `AGENTS.md`: working rules for humans and AI agents;
- `docs/PROJECT.md`: project source of truth;
- `docs/USER-GUIDE.md`: single bilingual user manual.

Do not create separate roadmap, architecture, ADR, TODO, release-note or per-feature manual files without a recorded decision.

## 6. Testing

Run manually from a checkout:

```bash
npm run check
```

This checks JavaScript syntax, JSON, manifest consistency, required files, documentation policy and pure domain regressions. Foundry runtime tests remain manual.

### Foundry checklist — 0.5.2

Loading:

- [ ] Both clients display 0.5.2 and fully reload.
- [ ] No console error appears during module initialization.

Request preparation:

- [ ] Clicking **Request test** opens one dialog without the native `onclick` error.
- [ ] Only non-GM Actor owners are listed.
- [ ] Sending displays `Test request queued for user delivery` in the GM console.
- [ ] The private request card is visible to the GM.
- [ ] The selected User contains `flags.dune-qol.testRequestInbox` until acknowledgement.

Online player:

- [ ] The User-document update reaches the player.
- [ ] The player receives a notification and one prefilled dialog.
- [ ] The player console displays `Test request received from user inbox`.
- [ ] Suggested Skill, Drive and Focus remain editable.
- [ ] The private card is visible and **Open test** works.
- [ ] The active GM clears the acknowledged inbox entry.

Offline player:

- [ ] The request may be sent while the owner is offline.
- [ ] The inbox is processed when the player later connects.
- [ ] The private card remains a manual fallback.

Existing workflows:

- [x] Core Guided test works.
- [x] GM can apply generated Momentum and receive history.
- [x] A complication can create the expected Trait.
- [ ] Player-to-GM pool and Trait requests remain to be tested.

## 7. Known risks

- A player client that has not actually loaded the updated module cannot process the new inbox hook.
- User-flag delivery depends on a GM being allowed to update the recipient User document.
- Acknowledgement uses the module socket; if missed, the entry may reopen after a later reload, although session duplicate protection prevents immediate repetition.
- Requests do not yet track completion and their private cards remain reusable.
- The Guided-test preset is client-local and consumed once.
- Foundry and upstream schema changes require explicit compatibility testing.
- Shared-state operations cannot be fully atomic across distributed clients.
- Deleting a generated Trait does not reopen the original complication.

## 8. Current status

- Guided tests, language selection, launcher placement, GM pool transactions and complication Traits passed initial manual testing.
- Version 0.5.0 opened the GM dialog but produced a native header-control error and no player opening.
- Version 0.5.1 removed the header collision but ChatMessage/socket delivery still did not reach the tested player client.
- Version 0.5.2 adds a persistent User-document inbox as the authoritative delivery path.
- GitHub Actions remain disabled.

Next step: update and reload both clients to 0.5.2, send one request, then inspect the GM and player console messages and the recipient User flag if it still fails.

## 9. Decision log

All decisions are dated 2026-08-06 unless stated otherwise. Superseded decisions remain recorded.

- **D-0001 — Accepted:** build a separate companion module rather than modifying or forking Dune.
- **D-0002 — Accepted:** use repository `foundryvtt-dune-qol` and module id `dune-qol`.
- **D-0003 — Superseded by D-0017:** initially target unreleased Dune 13.0.2.
- **D-0004 — Amended by D-0018:** keep evolving project knowledge in one central document.
- **D-0005 — Accepted:** record lasting product and technical decisions with the implementing change.
- **D-0006 — Accepted:** disclose substantial AI assistance and retain human responsibility.
- **D-0007 — Accepted:** start without third-party runtime dependencies.
- **D-0008 — Accepted:** prioritize Guided test, pools, complications, requests, then activation tracking.
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
- **D-0036 — Accepted:** keep GM suggestions editable by the player.
- **D-0037 — Superseded by D-0039:** make the private ChatMessage the primary request-delivery event and retain sockets as an accelerator.
- **D-0038 — Accepted:** injected sheet links must not use Foundry's native `control` class.
- **D-0039 — Accepted:** use a persistent request inbox on the recipient `User` document as the authoritative delivery path; keep private chat as the visible fallback and sockets only as refresh/acknowledgement signals.
