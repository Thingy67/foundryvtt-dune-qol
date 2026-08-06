# Dune: Adventures in the Imperium QoL

A companion module for Foundry Virtual Tabletop that improves comfort of play for the community **Dune: Adventures in the Imperium** game system.

> [!IMPORTANT]
> This project is public, pre-alpha and not ready for normal campaign use. Version `0.2.0` still requires manual validation in Foundry 13.

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

This pre-alpha installation downloads the latest state of the `main` branch. Restart or reload Foundry after an update.

## User guide

The single user-facing manual is [`docs/USER-GUIDE.md`](docs/USER-GUIDE.md). It explains:

- the difference between the native **Dune Dice Roller** and the QoL **Guided test**;
- where the Guided test button appears;
- every field in the test dialog;
- language and launcher settings;
- troubleshooting and update steps.

## Current feature — guided test

Version `0.2.0` treats **Guided test** as the preferred dice interface:

- launcher on supported Actor sheets by default, so no active Scene is required;
- optional launcher in Token scene controls;
- optional hiding of the native Dune roller buttons to avoid duplicate interfaces;
- user-selectable English or French interface;
- Skill, Drive, Focus, difficulty, dice and complication-range selection;
- progressive extra-die cost and source display;
- Determination spending;
- automatic calculation of successes, failure or success, complications and generated Momentum;
- localized enriched chat card and structured ChatMessage flags;
- explicit notification and console error if the window cannot open.

The upstream Dune roller remains part of the game system. Dune QoL does not modify its code; it only hides detected launcher buttons when that setting is enabled.

Momentum and Threat pools are **not changed automatically** yet.

## Settings

Open:

**Game Settings → Configure Settings → Dune: Adventures in the Imperium QoL**

Available settings:

- **Module language**: English or Français;
- **Guided test launcher**: Actor sheet, Token controls, or both;
- **Hide the native Dune dice roller**: enabled by default to reduce duplicated interfaces.

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

- Foundry Virtual Tabletop 13, verified target build 351;
- Dune system id `dune`;
- published Dune system version **13.0.1**.

Compatibility is not claimed until the relevant manual tests have been completed and recorded.

## Manual validation

From the repository root, with Node.js 20 or newer:

```bash
npm run check
```

No GitHub Actions workflow is used. Foundry runtime and visual validation are performed manually. The detailed checklist and development decisions are maintained in [`docs/PROJECT.md`](docs/PROJECT.md).

## Planned priorities

1. Momentum and Threat transactions with visible history.
2. Quick handling of Traits and Complications.
3. Game-master test requests.
4. An activation tracker adapted to Dune conflicts.
5. Supporting-character, HUD and campaign conveniences.

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
│   ├── domain/
│   ├── features/
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
