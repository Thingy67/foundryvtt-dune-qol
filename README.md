# Dune: Adventures in the Imperium QoL

A companion module for Foundry Virtual Tabletop that adds optional quality-of-life workflows to the community **Dune: Adventures in the Imperium** system.

> [!IMPORTANT]
> This project is public and pre-alpha. Version `0.9.4` targets Foundry `13.351` and Dune `13.0.1`; runtime validation remains manual.

## Installation through Foundry

In the Foundry setup screen:

1. open **Add-on Modules**;
2. click **Install Module**;
3. paste this address into **Manifest URL**;
4. click **Install**.

```text
https://raw.githubusercontent.com/Thingy67/foundryvtt-dune-qol/main/module.json
```

Do not use a GitHub page URL containing `/blob/main/module.json`; it returns HTML instead of the JSON manifest expected by Foundry.

This pre-alpha installation downloads the current `main` branch. Restart or reload Foundry after updating.

## User guide

The single user-facing manual is [`docs/USER-GUIDE.md`](docs/USER-GUIDE.md).

## Current features

### Guided tests and shared resources

- Actor-sheet launcher and optional Token-controls launcher;
- optional hiding of the native Dune roller;
- English or French interface;
- Skill, Drive, Focus, difficulty, dice, complication range and Determination;
- extra-die cost and source;
- readable result cards;
- explicit Momentum and Threat application with history and duplicate protection.

### Complications and Traits

- one upstream `trait` Item per resolved complication;
- temporary or persistent Traits with provenance;
- Actor-sheet manager for temporary Traits;
- multi-Actor promotion or deletion from the Party Sheet;
- explicit confirmation before deleting persistent Traits.

Deleting a generated Trait never reopens the original complication.

### Test requests

All GM test-request launchers use the same form:

- the form lists every non-GM player with a checkbox;
- each eligible player has an explicit Actor selector;
- one or several players can be selected in the same request batch;
- opening the form from an Actor sheet preselects the most relevant owner and that Actor;
- opening it from Token controls starts with no recipient selected;
- players without a compatible Dune Actor remain visible but cannot be selected;
- Skill and Drive may be imposed or left to the player;
- delivery remains persistent for online or offline recipients;
- each recipient keeps an independent request and completion state;
- history, filters, request/result links and cancellation are available from the Party Sheet.

### Party Sheet

The persistent Party Sheet is accessible to GMs and players from Token controls. It includes:

- House information, overall party status, shared notes and objectives;
- Momentum and Threat display;
- primary and supporting characters;
- owners, roles, portraits and individual resources;
- quick Test, Traits, sheet-opening and token-selection actions;
- all Traits grouped by Actor;
- test-request tracking;
- GM-only world-persistent editing and group Trait actions.

## Combat

Combat-management features introduced experimentally in earlier pre-alpha versions have been removed in `0.9.3`.

The module currently does not add anything to Foundry's Combat Tracker and does not manage initiative, activations, sides or combat rounds. Combat will be reconsidered later as a separate, incremental design rather than carried forward from the removed implementation.

## Settings

Open:

**Game Settings → Configure Settings → Dune: Adventures in the Imperium QoL**

Available settings:

- **Module language**: English or Français;
- **Guided test launcher**: Actor sheet, Token controls, or both;
- **Hide the native Dune dice roller**: enabled by default.

Party Sheet data is stored in a hidden world setting managed through its interface.

## Compatibility baseline

- Foundry Virtual Tabletop 13, target build 351;
- Dune system id `dune`;
- Dune system version 13.0.1.

## Manual validation

From a repository checkout with Node.js 20 or newer:

```bash
npm run check
```

Foundry runtime and visual validation remain manual. The checklist and decisions are maintained in [`docs/PROJECT.md`](docs/PROJECT.md).

## Remaining MVP work

1. Validate and correct the Party Sheet and unified request form in Foundry as GM and player.
2. Complete multiplayer, roll-mode, Dice So Nice and light/dark-theme validation.
3. Create a versioned GitHub release and stable release manifest.

Post-MVP work includes deeper supporting-character controls, token HUD tools, conflict zones, Assets, House projects, campaign clocks, a public API, guided character creation and a later incremental reconsideration of combat QoL.

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
