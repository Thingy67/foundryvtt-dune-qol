import {
  markCombatantsActed,
  normalizeCombatState,
  setCombatantSideOverride
} from "../domain/combat-state.mjs";
import { format, localize } from "../localization.mjs";

const MODULE_ID = "dune-qol";
const COMBAT_STATE_SETTING = "combatState";
const PANEL_SELECTOR = ".dune-qol-combat-panel";
let observer = null;

export function registerCombatSideOverrideHooks() {
  Hooks.once("ready", () => {
    observer = new MutationObserver(() => configureVisiblePanels());
    observer.observe(document.body, { childList: true, subtree: true });
    configureVisiblePanels();
  });

  Hooks.on("renderCombatTracker", () => scheduleConfiguration());
  Hooks.on("renderApplicationV2", () => scheduleConfiguration());
  Hooks.on("duneQolCombatStateChanged", () => scheduleConfiguration());
}

function scheduleConfiguration() {
  setTimeout(configureVisiblePanels, 0);
  setTimeout(configureVisiblePanels, 100);
}

function configureVisiblePanels() {
  for (const panel of document.querySelectorAll(PANEL_SELECTOR)) {
    configurePanel(panel);
  }
}

function configurePanel(panel) {
  const combat = game.combat;
  if (!combat) return;

  const state = currentCombatState(combat);
  for (const row of panel.querySelectorAll(".dune-qol-combatant-row")) {
    const combatantId = combatantIdFromRow(row);
    const combatant = combat.combatants.get(combatantId);
    if (!combatant) continue;

    const side = effectiveCombatantSide(combatant, state);
    const sideElement = row.querySelector("small");
    if (!sideElement) continue;

    if (!game.user.isGM) {
      sideElement.textContent = sideLabel(side);
      continue;
    }

    if (row.querySelector("[data-dune-qol-combatant-side]")) continue;
    const select = document.createElement("select");
    select.dataset.duneQolCombatantSide = combatantId;
    select.title = localize("DUNEQOL.Combat.OverrideSide");
    select.innerHTML = `
      <option value="players">${escapeHtml(localize("DUNEQOL.Combat.Side.Players"))}</option>
      <option value="opposition">${escapeHtml(localize("DUNEQOL.Combat.Side.Opposition"))}</option>
    `;
    select.value = side;
    select.addEventListener("change", () => {
      void updateCombatantSide(combatantId, select.value);
    });
    sideElement.replaceWith(select);
  }

  const markActed = panel.querySelector('[data-combat-action="mark-acted"]');
  if (
    game.user.isGM
    && markActed instanceof HTMLButtonElement
    && markActed.dataset.duneQolOverrideConfigured !== "true"
  ) {
    markActed.dataset.duneQolOverrideConfigured = "true";
    markActed.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      void markSelectedCombatantsActed(panel, markActed);
    }, { capture: true });
  }
}

async function updateCombatantSide(combatantId, side) {
  const combat = game.combat;
  const combatant = combat?.combatants.get(combatantId);
  if (!game.user.isGM || !combat || !combatant) return;

  const current = currentCombatState(combat);
  const result = setCombatantSideOverride({
    state: current,
    combatantId,
    side
  });
  if (!result.ok) {
    ui.notifications.error(localize("DUNEQOL.Combat.Errors.InvalidSide"));
    return;
  }

  const label = format("DUNEQOL.Combat.HistorySideOverride", {
    name: combatant.name,
    side: sideLabel(side)
  });
  result.state.history = appendHistory(result.state.history, {
    at: new Date().toISOString(),
    userId: game.user.id,
    action: "set-combatant-side",
    label
  });

  await game.settings.set(MODULE_ID, COMBAT_STATE_SETTING, result.state);
  ui.notifications.info(label);
}

async function markSelectedCombatantsActed(panel, button) {
  const combat = game.combat;
  if (!game.user.isGM || !combat) return;

  const selectedIds = [...panel.querySelectorAll("input[name='combatantIds']:checked")]
    .map((input) => String(input.value))
    .filter((id) => combat.combatants.has(id));
  if (selectedIds.length === 0) {
    ui.notifications.warn(localize("DUNEQOL.Combat.Errors.NoSelection"));
    return;
  }

  button.disabled = true;
  try {
    const current = currentCombatState(combat);
    const sideByCombatantId = Object.fromEntries(
      [...combat.combatants].map((combatant) => [
        combatant.id,
        effectiveCombatantSide(combatant, current)
      ])
    );
    const next = markCombatantsActed({
      state: current,
      combatantIds: selectedIds,
      sideByCombatantId
    });
    const label = format("DUNEQOL.Combat.HistoryMarked", {
      names: selectedIds
        .map((id) => combat.combatants.get(id)?.name ?? id)
        .join(", ")
    });
    next.history = appendHistory(next.history, {
      at: new Date().toISOString(),
      userId: game.user.id,
      action: "mark-acted",
      label
    });

    await game.settings.set(MODULE_ID, COMBAT_STATE_SETTING, next);
    ui.notifications.info(label);
  } catch (error) {
    console.error("Dune QoL | Combat side-aware activation failed.", error);
    ui.notifications.error(format("DUNEQOL.Combat.Errors.Failed", {
      message: error instanceof Error ? error.message : String(error)
    }));
  } finally {
    button.disabled = false;
  }
}

function currentCombatState(combat) {
  return normalizeCombatState({
    state: game.settings.get(MODULE_ID, COMBAT_STATE_SETTING),
    combatId: combat.id,
    round: combat.round ?? 0,
    combatantIds: [...combat.combatants].map((combatant) => combatant.id)
  });
}

function effectiveCombatantSide(combatant, state) {
  return state.sideOverrides?.[combatant.id] ?? inferCombatantSide(combatant);
}

function inferCombatantSide(combatant) {
  const actor = combatant.actor;
  const hasPlayerOwner = actor
    ? game.users.some((user) => !user.isGM && actor.testUserPermission(user, "OWNER"))
    : false;
  const disposition = Number(combatant.token?.disposition ?? 0);
  return hasPlayerOwner || disposition > 0 ? "players" : "opposition";
}

function combatantIdFromRow(row) {
  return String(
    row.querySelector("input[name='combatantIds']")?.value
    ?? row.querySelector("[data-combat-select-token]")?.dataset.combatSelectToken
    ?? ""
  );
}

function sideLabel(side) {
  return side === "opposition"
    ? localize("DUNEQOL.Combat.Side.Opposition")
    : localize("DUNEQOL.Combat.Side.Players");
}

function appendHistory(history, entry) {
  return [...(Array.isArray(history) ? history : []), entry].slice(-100);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
