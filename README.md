# Dune: Adventures in the Imperium QoL

A companion module for Foundry Virtual Tabletop that improves comfort of play for the community **Dune: Adventures in the Imperium** game system.

> [!IMPORTANT]
> This project is public and pre-alpha. Version `0.5.2` requires manual validation in Foundry 13, especially for game-master test requests between two clients.

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

The single user-facing manual is [`docs/USER-GUIDE.md`](docs/USER-GUIDE.md). It explains Guided tests, settings, shared-resource transactions, complication Traits, game-master test requests, troubleshooting and update steps.

## Current features

### Guided test

Dune QoL treats **Guided test** as its preferred dice interface:

- launcher on supported Actor sheets by default, without requiring an active Scene;
- optional launcher in Token scene controls;
- optional hiding of the native Dune roller buttons;
- user-selectable English or French interface;
- Skill, Drive, Focus, difficulty, dice and complication-range selection;
- progressive extra-die cost and declared source;
- Determination spending;
- calculation of successes, failure or success, complications and generated Momentum;
- localized enriched chat card and structured ChatMessage flags;
- visible notification and console error when opening or rolling fails.

The upstream Dune roller remains part of the game system. Dune QoL does not modify its files or methods.

### Momentum and Threat transactions

The result card proposes the net changes to Momentum and Threat:

- no shared pool change until **Apply resource changes** is clicked;
- a player request is executed by one active game master;
- the original result is marked as applied to prevent normal duplicate use;
- a separate chat message records the before and after values;
- insufficient Momentum is rejected;
- generated Momentum cannot retroactively pay for dice bought before the roll;
- generated Momentum is capped at 6 and discarded excess is recorded.

The game-master path has been manually validated against Foundry `13.351` and Dune `13.0.1`. The multiplayer player-request path still requires broader validation.

### Complication Traits

A Guided-test result with complications provides a **Create a complication Trait** workflow:

- one embedded upstream `trait` Item can be created for each complication rolled;
- Traits are temporary by default but can be made persistent;
- players request creation through the active game master;
- the source result tracks created Traits and unresolved complications;
- a separate chat message records each creation;
- failure to record the source state rolls back the newly created Item.

This workflow also applies to older Guided-test messages that already contain complications and a valid Actor reference.

### Game-master test requests

A game master can prepare requests from an Actor sheet:

- use **Request test** in the Actor-sheet title bar;
- select a receiving player among users who own that Actor;
- provide difficulty, complication range and context;
- optionally suggest Skill, Drive and Focus without locking them;
- preserve the request as a private chat card with **Open test**;
- prefill the receiving player's Guided-test dialog;
- allow an offline recipient to receive the request after connecting.

Version `0.5.2` uses three complementary delivery paths:

- a private ChatMessage for a visible and durable request card;
- a persistent queue in the recipient User flags under `flags.dune-qol.testRequestInbox`;
- a module socket used only to ask an online client to inspect its queue immediately.

The player client also checks its inbox on connection and whenever its User document changes. After successful opening, it sends an acknowledgement so an active game master can remove the queued entry. This prevents delivery from depending on the chat tab, one specific hook, or the order in which socket and ChatMessage events arrive.

The first version does not mark a request as completed or link it automatically to the resulting roll. The player may reopen the request card when needed.

## Settings

Open:

**Game Settings → Configure Settings → Dune: Adventures in the Imperium QoL**

Available settings:

- **Module language**: English or Français;
- **Guided test launcher**: Actor sheet, Token controls, or both;
- **Hide the native Dune dice roller**: enabled by default.

The settings screen is translated using the module language. A reload is required after changing these settings.

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

Compatibility is not claimed until the relevant manual tests have been completed and recorded.

## Manual validation

From the repository root, with Node.js 20 or newer:

```bash
npm run check
```

This checks JavaScript syntax, repository structure, JSON files, Guided-test calculations, pool calculations and complication-resolution calculations. No GitHub Actions workflow is used. Foundry runtime and visual validation are performed manually. The detailed checklist and development decisions are maintained in [`docs/PROJECT.md`](docs/PROJECT.md).

## Planned priorities

1. Validate game-master test requests in a two-client session.
2. Add quick management of temporary Traits.
3. Add an activation tracker adapted to Dune conflicts.
4. Add supporting-character control conveniences.
5. Add HUD and campaign conveniences.

## AI-assisted development disclosure

Development of this project is performed with substantial assistance from artificial-intelligence tools. AI may be used to analyze the upstream system, propose architecture, write or refactor code, produce tests, review changes and maintain documentation.

AI-generated output is **not treated as correct by default**. The human maintainer remains responsible for reviewing, testing and accepting every change. Important technical and product decisions must be recorded in [`docs/PROJECT.md`](docs/PROJECT.md), including decisions proposed or influenced by AI.

See [`AGENTS.md`](AGENTS.md) for the rules that apply to both human contributors and coding agents.

## Project principles

- Extend the existing Dune system instead of modifying it in place.
- Prefer Foundry public APIs and hooks over fragile monkey patches.
- Keep automation optional, visible and understandable.
- Do not reproduce copyrighted rules text or commercial sourcebook content.
- Keep documentation complete but concentrated in as few files as practical.
- Record meaningful decisions in the same change that implements them.
- Report tests accurately; never present unperformed validation as successful.

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

The project deliberately avoids separate roadmap, architecture, ADR, TODO and per-feature documentation trees.

## Licensing and status

No open-source license has been selected yet. Do not redistribute third-party material without the maintainer's explicit permission.

## Disclaimer

This is an unofficial fan-made project. It is not affiliated with or endorsed by Foundry Virtual Tabletop, Modiphius Entertainment, Legendary Entertainment, the Herbert estate, or the maintainers of the upstream Foundry Dune system. Dune and all related names and marks belong to their respective owners.
