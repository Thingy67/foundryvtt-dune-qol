# AGENTS.md

This file defines the working rules for every contributor to this repository, including human developers, AI coding agents and automated tools.

## 1. Read the minimum necessary context

Before changing the project, read only:

1. `README.md` for the stable project overview;
2. this `AGENTS.md` file for working rules;
3. the relevant sections of `docs/PROJECT.md` for current scope, architecture, status and decisions;
4. the source files directly related to the task.

Do not scan the whole repository by default. Expand the reading scope only when the task genuinely requires it.

## 2. Keep documentation concentrated

The project must be documented thoroughly, but not through a proliferation of Markdown files.

The expected documentation set is deliberately small:

- `README.md`: stable public overview and setup instructions;
- `AGENTS.md`: contributor and agent operating rules;
- `docs/PROJECT.md`: the single living source of truth for scope, architecture, roadmap, current status, risks and decisions.

Do **not** create separate `TODO.md`, `ROADMAP.md`, `ARCHITECTURE.md`, `DECISIONS.md`, ADR folders, feature notes or meeting-note files unless the maintainer explicitly approves the split and the reason is recorded in `docs/PROJECT.md`.

When new information fits an existing section, update that section instead of creating another document.

## 3. Record every meaningful decision

Every meaningful product or technical decision made during development must be recorded in the **Decision log** section of `docs/PROJECT.md` in the same commit or pull request that applies it.

A decision is meaningful when it affects one or more of the following:

- user-visible behavior;
- scope or priorities;
- Foundry or Dune-system compatibility;
- data storage or migration;
- architecture, public API or module boundaries;
- dependencies;
- permissions, sockets or multiplayer synchronization;
- localization;
- testing strategy;
- release or packaging strategy;
- legal, licensing or copyrighted-content handling;
- a deliberate trade-off or rejected alternative that future work might revisit.

Use sequential identifiers in the form `D-0001`, `D-0002`, and so on. Each entry must include:

- date;
- status: `Accepted`, `Superseded` or `Reversed`;
- decision;
- short rationale;
- consequences or follow-up when useful.

Do not erase old decisions. Mark them as superseded or reversed and reference the replacement.

Minor implementation details that are obvious from the code do not require a decision entry.

## 4. Keep project status current

When a change affects implementation progress, update the relevant roadmap or current-status section of `docs/PROJECT.md`.

Do not leave completed work listed as pending. Do not introduce undocumented future work hidden only in source-code comments.

Use GitHub issues for actionable work items once issue tracking is adopted. Keep only the high-level plan and current state in `docs/PROJECT.md`; do not duplicate entire issue backlogs in documentation.

## 5. AI-assisted development rules

This project openly uses AI-assisted development.

AI agents may help with analysis, design, coding, tests, review and documentation, but they must:

- never claim that generated code has been tested when it has not;
- distinguish verified facts from assumptions;
- inspect the relevant upstream Dune-system code before relying on internal APIs;
- prefer official Foundry documentation for Foundry APIs;
- avoid inventing API names, hooks, document schemas or compatibility claims;
- record AI-influenced architectural and product decisions just like human decisions;
- keep the AI disclosure in `README.md` intact unless the maintainer explicitly changes the policy;
- leave the repository in a state that a human can understand and maintain without access to prior chat history.

The human maintainer is the final reviewer and decision-maker.

## 6. Technical boundaries

- This project is a separate Foundry module with id `dune-qol`.
- It extends the upstream system with id `dune`; it must not modify upstream files in place.
- Prefer documented Foundry APIs, hooks and document flags.
- Avoid monkey patching and method replacement. When unavoidable, document the reason, compatibility risk and removal path in `docs/PROJECT.md`.
- Avoid runtime dependencies unless they provide clear value. Any new dependency requires a decision entry.
- Keep features independently disableable when practical.
- Preserve normal play when the module is disabled.
- Do not include copyrighted rulebook text, commercial compendium content or copied upstream assets.
- Do not silently change Momentum, Threat, Traits, Complications or other shared state. Player-relevant mutations should be visible and auditable whenever the feature design calls for it.

## 7. Coding expectations

- Use modern JavaScript ES modules.
- Keep modules small and organized by feature once the codebase grows.
- Prefer explicit names over abbreviations.
- Add comments for intent, compatibility constraints and non-obvious trade-offs, not for restating code.
- Keep localization-ready user-facing strings out of JavaScript once user interfaces are introduced.
- Validate inputs and permissions at the point where state changes occur.
- Treat the game master as authoritative for shared-state mutations unless a documented design says otherwise.
- Avoid premature frameworks or abstractions.

## 8. Testing and validation

Before considering a change complete:

- run `npm run check`;
- perform the relevant manual Foundry test when runtime behavior changed;
- document any test that could not be performed;
- update the manual test checklist in `docs/PROJECT.md` when a new workflow requires one.

Bug fixes should include a reproducible scenario or regression check whenever practical.

## 9. Change workflow

For each substantial change:

1. identify the smallest coherent scope;
2. read the minimum relevant context;
3. update or add the decision entry when the direction is chosen;
4. implement the change;
5. validate it;
6. update project status and architecture notes where applicable;
7. keep commits focused and messages descriptive.

A pull request should explain:

- what changed;
- why it changed;
- how it was tested;
- which decision entries were added or affected;
- known limitations or follow-up work.

## 10. When documentation may be split

A new document is justified only when `docs/PROJECT.md` has become materially difficult to use, or when a tool requires a dedicated file. Before splitting:

1. record the decision in `docs/PROJECT.md`;
2. define which document remains authoritative for the moved subject;
3. link both directions;
4. avoid duplicating the same information.

The default remains: **write everything important down, but keep it in very few places**.
