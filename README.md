# Dune: Adventures in the Imperium QoL

A companion module for Foundry Virtual Tabletop that improves comfort of play for the community **Dune: Adventures in the Imperium** game system.

> [!IMPORTANT]
> This project is public and pre-alpha. Version `0.6.0` requires manual validation in Foundry 13, especially for multiplayer workflows and the new temporary-Trait manager.

## Installation through Foundry

In the Foundry setup screen:

1. open **Add-on Modules**;
2. click **Install Module**;
3. paste the following address into **Manifest URL**;
4. click **Install**.

```text
https://raw.githubusercontent.com/Thingy67/foundryvtt-dune-qol/main/module.json
```

> [!WARNING]
> Use the raw address above. Do not paste a GitHub page address containing `/blob/main/module.json`: that page returns HTML instead of the JSON manifest expected by Foundry.

This pre-alpha installation downloads the latest state of the `main` branch. Restart or reload Foundry after an update.

## User guide

The single user-facing manual is [`docs/USER-GUIDE.md`](docs/USER-GUIDE.md). It explains Guided tests, shared resources, Traits, game-master test requests, settings, troubleshooting and update steps.

## Current features

### Guided test

Dune QoL treats **Guided test** as its preferred dice interface:

- launcher on supported Actor sheets, without requiring an active Scene;
- optional launcher in Token scene controls;
- optional hiding of the native Dune roller;
- English or French interface;
- Skill, Drive, Focus, difficulty, dice and complication range;
- progressive extra-die cost and declared source;
- Determination spending;
- calculation of successes, outcome, Momentum and complications;
- localized enriched chat card and structured flags;
- one-line-per-parameter layout for the narrow chat column.

### Momentum and Threat transactions

The result card proposes shared-pool changes:

- no mutation until **Apply resource changes** is clicked;
- player requests are executed by one active game master;
- duplicate application is blocked;
- a separate message records before and after values;
- generated Momentum cannot retroactively fund extra dice;
- final Momentum is capped at six.

The GM path has been manually validated against Foundry `13.351` and Dune `13.0.1`. The player path still needs broader validation.

### Complication Traits

A result with complications can create one upstream `trait` Item per complication:

- temporary by default;
- persistent when explicitly selected;
- player requests executed by the active GM;
- provenance stored on the Item and result;
- separate history message;
- rollback if source-result recording fails.

### Temporary Trait manager

Version `0.6.0` adds **Temporary Traits** to Actor-sheet title bars for the GM and Actor owner:

- lists all temporary upstream Traits;
- selects one or several Traits with checkboxes;
- makes the selection persistent in one action;
- deletes the selection in one action;
- sends player actions through the active GM;
- records the action in chat;
- identifies Traits generated from complications;
- preserves historical complication resolution when a generated Trait is deleted.

### Game-master test requests

From an Actor sheet, a GM can request one test from one owner of that Actor:

- optional context;
- Skill and Drive either imposed or left to the player;
- editable Focus proposal;
- private ChatMessage plus persistent User inbox;
- support for offline recipients;
- completion only after a matching result is created and validated;
- **Open test** removed after completion.

## Settings

Open:

**Game Settings → Configure Settings → Dune: Adventures in the Imperium QoL**

Available settings:

- **Module language**: English or Français;
- **Guided test launcher**: Actor sheet, Token controls, or both;
- **Hide the native Dune dice roller**: enabled by default.

A reload is required after changing these settings.

## Manual installation for development

```bash
cd /path/to/foundry-data/Data/modules
git clone https://github.com/Thingy67/foundryvtt-dune-qol.git dune-qol
```

To update it later:

```bash
cd /path/to/foundry-data/Data/modules/dune-qol
git pull
```

## Compatibility baseline

- Foundry Virtual Tabletop 13, target build 351;
- Dune system id `dune`;
- published Dune system version **13.0.1**.

## Manual validation

From the repository root, with Node.js 20 or newer:

```bash
npm run check
```

This checks JavaScript syntax, repository structure, JSON files and pure domain calculations. No GitHub Actions workflow is used. Foundry runtime and visual validation are manual. The detailed checklist and decisions are maintained in [`docs/PROJECT.md`](docs/PROJECT.md).

## Planned priorities

1. Validate version `0.6.0` with GM and player clients.
2. Add group test requests from Token controls with player checkboxes.
3. Add supporting-character control conveniences.
4. Add HUD and campaign conveniences.
5. Low priority near the end: combat and initiative management.
6. Low priority last: guided character creation.

## AI-assisted development disclosure

Development of this project is performed with substantial assistance from artificial-intelligence tools. AI may be used to analyze the upstream system, propose architecture, write or refactor code, produce tests, review changes and maintain documentation.

AI-generated output is **not treated as correct by default**. The human maintainer remains responsible for reviewing, testing and accepting every change. Important technical and product decisions must be recorded in [`docs/PROJECT.md`](docs/PROJECT.md), including decisions proposed or influenced by AI.

See [`AGENTS.md`](AGENTS.md) for the rules that apply to both human contributors and coding agents.

## Project principles

- Extend the existing Dune system instead of modifying it in place.
- Prefer Foundry public APIs and hooks over fragile monkey patches.
- Keep automation optional, visible and understandable.
- Do not reproduce copyrighted rules text or commercial sourcebook content.
- Keep documentation complete but concentrated.
- Record meaningful decisions with the implementing change.
- Report tests accurately.

## Repository structure

```text
.
├── AGENTS.md
├── README.md
├── docs/
│   ├── PROJECT.md
│   └── USER-GUIDE.md
├── lang/
├── module.json
├── scripts/
│   ├── adapters/
│   ├── domain/
│   ├── features/
│   ├── services/
│   ├── dune-qol.mjs
│   ├── localization.mjs
│   └── settings.mjs
├── styles/
└── tools/
```

## Licensing and status

No open-source license has been selected yet. Do not redistribute third-party material without the maintainer's explicit permission.

## Disclaimer

This is an unofficial fan-made project. It is not affiliated with or endorsed by Foundry Virtual Tabletop, Modiphius Entertainment, Legendary Entertainment, the Herbert estate, or the maintainers of the upstream Foundry Dune system. Dune and all related names and marks belong to their respective owners.
