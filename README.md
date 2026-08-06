# Dune: Adventures in the Imperium QoL

A companion module for Foundry Virtual Tabletop that improves comfort of play for the community **Dune: Adventures in the Imperium** game system.

> [!IMPORTANT]
> This project is public, pre-alpha and not ready for normal campaign use. Version `0.1.0` still requires manual validation in Foundry 13.

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
> Use the raw address above. Do not paste the GitHub page address containing `/blob/main/module.json`: that page returns HTML instead of the JSON manifest expected by Foundry.

This pre-alpha installation currently downloads the latest state of the `main` branch. Versioned release archives will replace this development setup when the module is ready for normal distribution.

## Manual installation for development

Alternatively, clone the repository into the Foundry user-data module directory:

```bash
cd /path/to/foundry-data/Data/modules
git clone https://github.com/Thingy67/foundryvtt-dune-qol.git dune-qol
```

To update it later:

```bash
cd /path/to/foundry-data/Data/modules/dune-qol
git pull
```

Restart Foundry after installing or updating, then enable **Dune: Adventures in the Imperium QoL** in a world using system `dune`.

## Current feature — guided test

Version `0.1.0` provides a first guided 2d20 test workflow:

- launch from the Token scene controls;
- use one selected token, or the user's assigned character as fallback;
- select a Skill and a Drive from the Actor;
- enter an optional Focus;
- set difficulty, total dice and complication range;
- display the progressive cost and source of extra dice;
- use and spend one point of Determination;
- calculate successes, complications, success or failure and generated Momentum;
- publish a localized, enriched result card in chat;
- retain structured test context in the ChatMessage flags.

Momentum and Threat pools are **not changed automatically** in this version. Shared-pool transactions will be implemented only after permissions, synchronization and history have been designed.

The complete scope, status, manual checklist and decision log are maintained in [`docs/PROJECT.md`](docs/PROJECT.md).

## Planned priorities

1. Momentum and Threat transactions with visible history.
2. Quick handling of Traits and Complications.
3. Game-master test requests.
4. An activation tracker adapted to Dune conflicts.
5. Supporting-character, HUD and campaign conveniences.

## Compatibility baseline

The current development target is:

- Foundry Virtual Tabletop 13;
- [`foundryvtt-dune-system`](https://gitlab.com/fvtt-modiphius/foundryvtt-dune-system), system id `dune`;
- Dune system version 13.0.2 as the compatibility reference.

Compatibility is not claimed until the relevant manual tests have been completed and recorded.

## Manual validation

From the repository root, with Node.js 20 or newer:

```bash
npm run check
```

This runs structural checks and dependency-free guided-test calculation checks. No GitHub Actions workflow is used; Foundry runtime and visual validation are performed manually.

The detailed Foundry checklist is kept in [`docs/PROJECT.md`](docs/PROJECT.md).

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
│   └── PROJECT.md
├── lang/
├── module.json
├── scripts/
│   ├── domain/
│   ├── features/
│   └── dune-qol.mjs
├── styles/
└── tools/
```

The project deliberately avoids separate roadmap, architecture, ADR and TODO document trees. Those subjects belong in `docs/PROJECT.md` unless a documented decision explicitly approves a split.

## Documentation workflow

Before making a significant change:

1. read `AGENTS.md`;
2. read only the relevant sections of `docs/PROJECT.md`;
3. inspect only the source files needed for the task;
4. implement and test the change;
5. update project status and the decision log when applicable.

## Licensing and status

The source repository is public, but no open-source license has been selected yet. Public visibility does not grant permission to redistribute or reuse the project beyond rights provided by applicable law.

## Disclaimer

This is an unofficial fan-made project. It is not affiliated with or endorsed by Foundry Virtual Tabletop, Modiphius Entertainment, Legendary Entertainment, the Herbert estate, or the maintainers of the upstream Foundry Dune system. Dune and all related names and marks belong to their respective owners.
