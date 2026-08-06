# Dune: Adventures in the Imperium QoL

A companion module for Foundry Virtual Tabletop that adds optional quality-of-life workflows to the community **Dune: Adventures in the Imperium** system.

> [!IMPORTANT]
> This project is public and pre-alpha. Version `0.7.0` targets Foundry `13.351` and Dune `13.0.1`; runtime validation remains manual.

## Installation through Foundry

In the Foundry setup screen:

1. open **Add-on Modules**;
2. click **Install Module**;
3. paste this address into **Manifest URL**;
4. click **Install**.

```text
https://raw.githubusercontent.com/Thingy67/foundryvtt-dune-qol/main/module.json
```

Do not use a GitHub page URL containing `/blob/main/module.json`; it returns HTML rather than the JSON manifest expected by Foundry.

This pre-alpha installation downloads the current `main` branch. Restart or reload Foundry after updating.

## User guide

The single user-facing manual is [`docs/USER-GUIDE.md`](docs/USER-GUIDE.md).

## Current features

### Guided tests

- Actor-sheet launcher and optional Token-controls launcher;
- optional hiding of the native Dune roller;
- English or French module interface;
- Skill, Drive, Focus, difficulty, dice and complication-range selection;
- extra-die cost and declared source;
- Determination spending;
- successes, failure or success, complications and generated Momentum;
- readable chat cards and structured flags.

### Momentum, Threat and complications

- explicit Momentum/Threat application from the result card;
- active-GM authority for player requests;
- transaction history and duplicate protection;
- one upstream `trait` Item per resolved complication;
- temporary or persistent complication Traits with provenance and history.

### Temporary Trait manager

The **Temporary Traits** Actor-sheet action can select one or several temporary Traits and either make them persistent or delete them. Player actions are executed by the active GM.

### Game-master test requests

From an Actor sheet, a GM can send one owner a test request with:

- optional context;
- imposed or player-selected Skill and Drive;
- editable proposed Focus;
- difficulty and complication range;
- persistent private delivery, including offline recipients;
- automatic completion only after the matching result exists.

### Group tools

Version `0.7.0` adds two GM-only actions to Token scene controls.

**Request a group test**:

- select one or several players using checkboxes;
- verify or change the Actor used by each player;
- send common test parameters;
- create an independent request and completion state for each recipient.

**View party Traits**:

- display every compatible player-owned Actor once;
- show owners, portrait and all Traits;
- distinguish temporary, persistent and complication-generated Traits;
- filter by player, Actor, Trait name or state;
- open the relevant Actor sheet directly.

This roster is the first foundation for the planned Dune Party Sheet.

## Settings

Open:

**Game Settings → Configure Settings → Dune: Adventures in the Imperium QoL**

Available settings:

- **Module language**: English or Français;
- **Guided test launcher**: Actor sheet, Token controls, or both;
- **Hide the native Dune dice roller**: enabled by default.

Reload after changing these settings.

## Compatibility baseline

- Foundry Virtual Tabletop 13, target build 351;
- Dune system id `dune`;
- Dune system version 13.0.1.

## Manual validation

From a repository checkout with Node.js 20 or newer:

```bash
npm run check
```

Foundry runtime and visual validation remain manual. The checklist and development decisions are maintained in [`docs/PROJECT.md`](docs/PROJECT.md).

## Planned priorities

1. Validate group requests and the party Trait overview in Foundry.
2. Build the first Dune Party Sheet.
3. Add supporting-character and campaign conveniences.
4. Later: combat and initiative management.
5. Last major workflow: guided character creation.

## AI-assisted development disclosure

Development of this project is performed with substantial assistance from artificial-intelligence tools. AI may be used to analyze the upstream system, propose architecture, write or refactor code, produce tests, review changes and maintain documentation.

AI-generated output is **not treated as correct by default**. The human maintainer remains responsible for reviewing, testing and accepting every change. Important product and technical decisions are recorded in [`docs/PROJECT.md`](docs/PROJECT.md).

See [`AGENTS.md`](AGENTS.md) for contributor and coding-agent rules.

## Project principles

- Extend the existing Dune system instead of modifying it in place.
- Prefer Foundry public APIs and hooks over fragile monkey patches.
- Keep automation optional, visible and understandable.
- Do not reproduce copyrighted rules text or commercial sourcebook content.
- Keep documentation concentrated.
- Report tests accurately.

## Licensing and disclaimer

No open-source license has been selected yet. This is an unofficial fan-made project and is not affiliated with or endorsed by Foundry Virtual Tabletop, Modiphius Entertainment, Legendary Entertainment, the Herbert estate, or the upstream system maintainers.
