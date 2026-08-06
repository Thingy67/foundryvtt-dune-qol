# Dune: Adventures in the Imperium QoL

A companion module for Foundry Virtual Tabletop that aims to improve the table experience for the community **Dune: Adventures in the Imperium** game system.

> [!IMPORTANT]
> This project is in very early development and is not ready for normal play.

## Purpose

The module is intended to reduce repetitive bookkeeping and make the existing `dune` system more comfortable to use without replacing or forking it.

Planned areas include:

- a guided 2d20 test workflow with difficulty, Focus, Determination and extra-die purchases;
- automatic calculation of generated Momentum;
- traceable Momentum and Threat transactions;
- easier creation and management of Traits and Complications;
- an activation tracker adapted to Dune conflicts;
- quality-of-life tools for supporting characters and other recurring campaign workflows.

The exact scope and implementation order are maintained in [`docs/PROJECT.md`](docs/PROJECT.md).

## Compatibility baseline

The initial development target is:

- Foundry Virtual Tabletop 13;
- [`foundryvtt-dune-system`](https://gitlab.com/fvtt-modiphius/foundryvtt-dune-system), system id `dune`;
- Dune system version 13.0.2 as the initial compatibility reference.

Compatibility may evolve. Any change to the baseline must be recorded in the project decision log.

## AI-assisted development disclosure

Development of this project is performed with substantial assistance from artificial-intelligence tools. AI may be used to help analyze the upstream system, propose architecture, write or refactor code, produce tests, review changes and maintain documentation.

AI-generated output is **not treated as correct by default**. The human maintainer remains responsible for reviewing, testing and accepting every change. Important technical and product decisions must be recorded in [`docs/PROJECT.md`](docs/PROJECT.md), including decisions proposed or influenced by AI.

See [`AGENTS.md`](AGENTS.md) for the rules that apply to both human contributors and coding agents.

## Project principles

- Extend the existing Dune system instead of modifying it in place.
- Prefer Foundry public APIs and hooks over fragile monkey patches.
- Keep automation optional and understandable to players and game masters.
- Do not reproduce copyrighted rules text or commercial sourcebook content.
- Keep documentation complete but concentrated in as few files as practical.
- Record meaningful decisions in the same change that implements them.

## Current repository structure

```text
.
├── AGENTS.md             # Working rules for humans and AI agents
├── README.md             # Stable project overview
├── docs/
│   └── PROJECT.md        # Scope, architecture, roadmap, status and decision log
├── module.json           # Foundry module manifest
├── scripts/              # Runtime module code
└── tools/                # Repository validation utilities
```

The project deliberately avoids separate roadmap, architecture, ADR and TODO document trees. Those subjects belong in `docs/PROJECT.md` unless there is a demonstrated need to split them later.

## Development setup

1. Clone the repository into the Foundry user-data module directory as `Data/modules/dune-qol`.
2. Install and enable the Dune system.
3. Start a world using the Dune system.
4. Enable **Dune: Adventures in the Imperium QoL** in the world module settings.
5. Run `npm run check` before committing changes.

The initial scaffold only verifies that the module loads. User-facing features will be added incrementally.

## Documentation workflow

Before making a significant change:

1. read `AGENTS.md`;
2. read the relevant sections of `docs/PROJECT.md`;
3. inspect only the source files needed for the task;
4. implement and test the change;
5. update the status, architecture and decision log in `docs/PROJECT.md` when applicable.

## Licensing and status

No open-source license has been selected yet. The repository is currently private. Do not redistribute the project or third-party material without the maintainer's explicit permission.

## Disclaimer

This is an unofficial fan-made project. It is not affiliated with or endorsed by Foundry Gaming, Modiphius Entertainment, Legendary Entertainment, the Herbert estate, or the maintainers of the upstream Foundry Dune system. Dune and all related names and marks belong to their respective owners.
