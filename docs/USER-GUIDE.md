# Dune QoL — User Guide

This is the single user-facing guide for the module. It will be expanded as features are added.

## Guided test

The guided test is the module's alternative to the Dune system's built-in dice roller. The two windows are intentionally different:

- **Dune Dice Roller** belongs to the upstream Dune system;
- **Guided test** belongs to Dune QoL and adds difficulty, generated Momentum, extra-die source, Determination handling and an enriched chat result.

The upstream roller can also look different depending on whether a token or Actor is selected. Dune QoL does not replace or modify those upstream windows.

## Opening the guided test

By default, open a supported character sheet and click the **Guided test** d20 button in its title bar.

The launch location can be changed under:

**Game Settings → Configure Settings → Dune: Adventures in the Imperium QoL → Guided test launcher**

Available choices:

- **Actor sheet** — default; works without an active Scene;
- **Token controls** — adds the launcher to the left Scene toolbar and therefore requires an active Scene;
- **Actor sheet and Token controls** — enables both entry points.

## Selecting the Actor

When launched from an Actor sheet, that Actor is always used.

When launched from Token controls:

1. one selected token is used;
2. with no selected token, the current user's assigned character is used;
3. multiple selected tokens produce a warning;
4. an Actor the user does not own cannot be used.

## Test fields

- **Skill** and **Drive** are read from the Actor.
- **Focus** is optional. Enter a Focus only when it applies to the test.
- **Difficulty** determines how many successes are required.
- **Total dice** accepts 2 to 5 d20.
- **Complication range** accepts 15 to 20.
- **Extra-die source** records how additional dice were obtained.
- **Determination** spends one point from the Actor and adds an automatic result of 1.
- **Test context** is optional text displayed with the chat result.

Extra-die costs are displayed as guidance, but version 0.1.x does not modify Momentum or Threat pools automatically.

## Result card

The chat card displays:

- Skill, Drive and target number;
- Focus, difficulty and complication range;
- individual die results;
- successes;
- success or failure;
- generated Momentum;
- complications;
- Determination use and extra-die source when applicable.

## Module language

Choose the module language under:

**Game Settings → Configure Settings → Dune: Adventures in the Imperium QoL → Module language**

The available values are **English** and **Français**. The setting affects Dune QoL only, not the rest of Foundry or the upstream Dune system. A reload is required after changing it.

## Troubleshooting

### Clicking the Token-controls button does nothing

Token controls only exist with an active Scene. Use the Actor-sheet launcher, or create and activate a Scene.

### The guided-test button is visible but no window opens

A launch failure now produces a Foundry notification and a `Dune QoL` error in the browser console. Open the console with **F12**, reproduce the issue and copy the complete error.

### I see several different dice windows

This is expected while the upstream Dune roller remains installed:

- the upstream system owns the windows titled **Dune Dice Roller**;
- this module owns the window titled **Guided test — …**.

Use the Guided test window for the QoL workflow.

### Updating the module

From Foundry Setup, use **Update** on the module. During pre-alpha development the manifest downloads the current `main` branch, so restart or reload Foundry after an update.
