import { readDunePools, writeDunePool } from "../adapters/dune-pools.mjs";
import { format, localize } from "../localization.mjs";

const MODULE_ID = "dune-qol";
const COMBAT_STATE_SETTING = "combatState";
const CONTROL_NAME = "dune-qol-combat-manager";
const PANEL_SELECTOR = ".dune-qol-combat-panel";
const activeCommands = new Set();
let suppressRoundSynchronization = false;

export function registerCombatManagerHooks() {
  Hooks.on("getSceneControlButtons", (controls) => {
    if (game.system.id !== "dune" || !controls.tokens?.tools) return;
    controls.tokens.tools[CONTROL_NAME] = {
      name: CONTROL_NAME,
      title: localize("DUNEQOL.Combat.Control"),
      icon: "fa-solid fa-shield-halved",
      order: Object.keys(controls.tokens.tools).length,
      button: true,
      visible: true,
      onChange: () => {
        ui.sidebar?.activateTab?.("combat");
        ui.combat?.render?.({ force: false });
      }
    };
  });

  Hooks.on("renderCombatTracker", (_application, html) => {
    void renderCombatTrackerPanel(html);
  });

  Hooks.on("updateCombat", (combat, changes) => {
    if (game.user.isGM && !suppressRoundSynchronization && Object.hasOwn(changes, "round")) {
      void synchronizeRound(combat);
    }
    notifyCombatStateChanged();
  });

  for (const hookName of ["createCombat", "deleteCombat", "createCombatant", "updateCombatant", "deleteCombatant"]) {
    Hooks.on(hookName, notifyCombatStateChanged);
  }
}

export async function getCombatModel() {
  const combat = game.combat ?? null;
  const state = normalizeCombatState(
    game.settings.get(MODULE_ID, COMBAT_STATE_SETTING),
    combat
  );
  const combatants = combat
    ? [...combat.combatants].map((combatant) => buildCombatantModel(combatant, state))
      .sort((left, right) => {
        if (left.side !== right.side) return left.side === "players" ? -1 : 1;
        return left.name.localeCompare(right.name);
      })
    : [];

  let pools = null;
  try {
    pools = await readDunePools();
  } catch (error) {
    console.warn("Dune QoL | Combat manager could not read shared pools.", error);
  }

  return {
    combat,
    state,
    combatants,
    pools,
    canEdit: Boolean(game.user.isGM)
  };
}

export function buildCombatPanelHtml(model, { embedded = false } = {}) {
  if (!model.combat) {
    return `<section class="dune-qol-combat-panel ${embedded ? "dune-qol-combat-panel--embedded" : ""}">
      <p>${escapeHtml(localize("DUNEQOL.Combat.NoCombat"))}</p>
    </section>`;
  }

  const state = model.state;
  const activeLabel = state.activeSide === "players"
    ? localize("DUNEQOL.Combat.Side.Players")
    : localize("DUNEQOL.Combat.Side.Opposition");
  const costPool = state.activeSide === "players" ? "Momentum" : localize("DUNEQOL.Pools.Threat");
  const combatants = model.combatants.map((combatant) => `
    <label class="dune-qol-combatant-row ${combatant.acted ? "acted" : ""}">
      ${model.canEdit ? `<input type="checkbox" name="combatantIds" value="${escapeHtml(combatant.id)}">` : ""}
      <img src="${escapeHtml(combatant.img)}" alt="">
      <span class="dune-qol-combatant-row__name">${escapeHtml(combatant.name)}</span>
      <small>${escapeHtml(combatant.side === "players" ? localize("DUNEQOL.Combat.Side.Players") : localize("DUNEQOL.Combat.Side.Opposition"))}</small>
      <small>${escapeHtml(combatant.acted ? localize("DUNEQOL.Combat.Acted") : localize("DUNEQOL.Combat.NotActed"))}</small>
      <button type="button" data-combat-select-token="${escapeHtml(combatant.id)}" title="${escapeHtml(localize("DUNEQOL.Combat.SelectToken"))}"><i class="fa-solid fa-crosshairs"></i></button>
    </label>
  `).join("");

  const history = [...state.history].reverse().slice(0, 20).map((entry) => `
    <li><time>${escapeHtml(new Date(entry.at).toLocaleTimeString())}</time> ${escapeHtml(entry.label)}</li>
  `).join("");

  return `<section class="dune-qol-combat-panel ${embedded ? "dune-qol-combat-panel--embedded" : ""}">
    <header>
      <div>
        <strong>${escapeHtml(format("DUNEQOL.Combat.Round", { round: model.combat.round ?? 0 }))}</strong>
        <span>${escapeHtml(format("DUNEQOL.Combat.ActiveSide", { side: activeLabel }))}</span>
      </div>
      ${model.pools ? `<div class="dune-qol-combat-panel__pools"><span>Momentum ${model.pools.momentum}</span><span>${escapeHtml(localize("DUNEQOL.Pools.Threat"))} ${model.pools.threat}</span></div>` : ""}
    </header>
    ${model.canEdit ? `<div class="dune-qol-combat-controls">
      <button type="button" data-combat-action="set-players">${escapeHtml(localize("DUNEQOL.Combat.SetPlayers"))}</button>
      <button type="button" data-combat-action="set-opposition">${escapeHtml(localize("DUNEQOL.Combat.SetOpposition"))}</button>
      <button type="button" data-combat-action="mark-acted"><i class="fa-solid fa-check"></i> ${escapeHtml(localize("DUNEQOL.Combat.MarkActed"))}</button>
      <button type="button" data-combat-action="mark-unacted"><i class="fa-solid fa-rotate-left"></i> ${escapeHtml(localize("DUNEQOL.Combat.MarkUnacted"))}</button>
      <button type="button" data-combat-action="pass"><i class="fa-solid fa-right-left"></i> ${escapeHtml(localize("DUNEQOL.Combat.Pass"))}</button>
      <label><span>${escapeHtml(format("DUNEQOL.Combat.RetainCost", { pool: costPool }))}</span><input name="retainCost" type="number" min="0" max="6" step="1" value="0"></label>
      <button type="button" data-combat-action="retain"><i class="fa-solid fa-hand"></i> ${escapeHtml(localize("DUNEQOL.Combat.Retain"))}</button>
      <button type="button" data-combat-action="reset-round"><i class="fa-solid fa-arrow-rotate-left"></i> ${escapeHtml(localize("DUNEQOL.Combat.ResetRound"))}</button>
      <button type="button" data-combat-action="new-round"><i class="fa-solid fa-forward-step"></i> ${escapeHtml(localize("DUNEQOL.Combat.NewRound"))}</button>
    </div>` : ""}
    <div class="dune-qol-combatant-list">${combatants || `<p>${escapeHtml(localize("DUNEQOL.Combat.NoCombatants"))}</p>`}</div>
    <details class="dune-qol-combat-history"><summary>${escapeHtml(localize("DUNEQOL.Combat.History"))}</summary><ol>${history || `<li>${escapeHtml(localize("DUNEQOL.Combat.NoHistory"))}</li>`}</ol></details>
  </section>`;
}

export function configureCombatPanel(root, { rerender = null } = {}) {
  const panel = root.matches?.(PANEL_SELECTOR) ? root : root.querySelector(PANEL_SELECTOR);
  if (!panel || panel.dataset.duneQolConfigured === "true") return;
  panel.dataset.duneQolConfigured = "true";

  for (const button of panel.querySelectorAll("[data-combat-action]")) {
    button.addEventListener("click", async () => {
      const action = button.dataset.combatAction;
      const selected = [...panel.querySelectorAll("input[name='combatantIds']:checked")].map((input) => input.value);
      const cost = Number(panel.querySelector("input[name='retainCost']")?.value ?? 0);
      button.disabled = true;
      try {
        await applyCombatCommand(action, { combatantIds: selected, cost });
        if (typeof rerender === "function") await rerender();
      } finally {
        button.disabled = false;
      }
    });
  }

  for (const button of panel.querySelectorAll("[data-combat-select-token]")) {
    button.addEventListener("click", () => selectCombatantToken(button.dataset.combatSelectToken));
  }
}

export async function applyCombatCommand(action, { combatantIds = [], cost = 0 } = {}) {
  if (!game.user.isGM) {
    ui.notifications.error(localize("DUNEQOL.Combat.Errors.GmOnly"));
    return;
  }

  const combat = game.combat;
  if (!combat) {
    ui.notifications.warn(localize("DUNEQOL.Combat.NoCombat"));
    return;
  }

  const commandKey = `${combat.id}:${action}`;
  if (activeCommands.has(commandKey)) return;
  activeCommands.add(commandKey);

  try {
    const current = normalizeCombatState(game.settings.get(MODULE_ID, COMBAT_STATE_SETTING), combat);
    const next = foundry.utils.deepClone(current);
    const validIds = new Set([...combat.combatants].map((combatant) => combatant.id));
    const selectedIds = [...new Set(combatantIds)].filter((id) => validIds.has(id));
    let label = "";

    switch (action) {
      case "set-players":
        next.activeSide = "players";
        label = localize("DUNEQOL.Combat.HistorySetPlayers");
        break;
      case "set-opposition":
        next.activeSide = "opposition";
        label = localize("DUNEQOL.Combat.HistorySetOpposition");
        break;
      case "mark-acted":
        if (selectedIds.length === 0) throw new Error(localize("DUNEQOL.Combat.Errors.NoSelection"));
        next.actedCombatantIds = [...new Set([...next.actedCombatantIds, ...selectedIds])];
        label = format("DUNEQOL.Combat.HistoryMarked", { names: combatantNames(combat, selectedIds) });
        break;
      case "mark-unacted":
        if (selectedIds.length === 0) throw new Error(localize("DUNEQOL.Combat.Errors.NoSelection"));
        next.actedCombatantIds = next.actedCombatantIds.filter((id) => !selectedIds.includes(id));
        label = format("DUNEQOL.Combat.HistoryUnmarked", { names: combatantNames(combat, selectedIds) });
        break;
      case "pass":
        next.activeSide = next.activeSide === "players" ? "opposition" : "players";
        label = format("DUNEQOL.Combat.HistoryPassed", {
          side: next.activeSide === "players" ? localize("DUNEQOL.Combat.Side.Players") : localize("DUNEQOL.Combat.Side.Opposition")
        });
        break;
      case "retain": {
        const normalizedCost = boundedInteger(cost, 0, 6, 0);
        const pool = next.activeSide === "players" ? "momentum" : "threat";
        if (normalizedCost > 0) {
          const pools = await readDunePools();
          if (pools[pool] < normalizedCost) {
            throw new Error(format("DUNEQOL.Combat.Errors.InsufficientPool", { available: pools[pool], cost: normalizedCost }));
          }
          await writeDunePool(pool, pools[pool] - normalizedCost);
        }
        label = format("DUNEQOL.Combat.HistoryRetained", {
          side: next.activeSide === "players" ? localize("DUNEQOL.Combat.Side.Players") : localize("DUNEQOL.Combat.Side.Opposition"),
          cost: normalizedCost
        });
        break;
      }
      case "reset-round":
        next.actedCombatantIds = [];
        label = localize("DUNEQOL.Combat.HistoryReset");
        break;
      case "new-round":
        suppressRoundSynchronization = true;
        try {
          await combat.nextRound();
        } finally {
          suppressRoundSynchronization = false;
        }
        next.round = combat.round ?? ((current.round ?? 0) + 1);
        next.actedCombatantIds = [];
        next.activeSide = "players";
        label = format("DUNEQOL.Combat.HistoryNewRound", { round: next.round });
        break;
      default:
        throw new Error(localize("DUNEQOL.Combat.Errors.UnknownAction"));
    }

    next.history = appendHistory(next.history, {
      at: new Date().toISOString(),
      userId: game.user.id,
      action,
      label
    });
    await saveCombatState(next);
    ui.notifications.info(label);
  } catch (error) {
    console.error("Dune QoL | Combat command failed.", error, { action, combatantIds, cost });
    ui.notifications.error(format("DUNEQOL.Combat.Errors.Failed", {
      message: error instanceof Error ? error.message : String(error)
    }));
  } finally {
    activeCommands.delete(commandKey);
  }
}

async function renderCombatTrackerPanel(html) {
  const root = getHtmlRoot(html);
  if (!root) return;
  root.querySelector(PANEL_SELECTOR)?.remove();

  const model = await getCombatModel();
  const wrapper = document.createElement("div");
  wrapper.innerHTML = buildCombatPanelHtml(model);
  const panel = wrapper.firstElementChild;
  const target = root.querySelector(".combat-tracker") ?? root;
  target.prepend(panel);
  configureCombatPanel(panel, {
    rerender: async () => ui.combat?.render?.({ force: false })
  });
}

async function synchronizeRound(combat) {
  const current = normalizeCombatState(game.settings.get(MODULE_ID, COMBAT_STATE_SETTING), combat);
  const round = Number(combat.round ?? 0);
  if (current.round === round) return;

  current.round = round;
  current.actedCombatantIds = [];
  current.activeSide = "players";
  current.history = appendHistory(current.history, {
    at: new Date().toISOString(),
    userId: game.user.id,
    action: "round-sync",
    label: format("DUNEQOL.Combat.HistoryNewRound", { round })
  });
  await saveCombatState(current);
}

async function saveCombatState(state) {
  await game.settings.set(MODULE_ID, COMBAT_STATE_SETTING, state);
  notifyCombatStateChanged();
}

function normalizeCombatState(value, combat) {
  const source = value && typeof value === "object" ? value : {};
  if (!combat || source.combatId !== combat.id) {
    return {
      version: 1,
      combatId: combat?.id ?? null,
      round: Number(combat?.round ?? 0),
      activeSide: "players",
      actedCombatantIds: [],
      history: []
    };
  }

  const validIds = new Set([...combat.combatants].map((combatant) => combatant.id));
  return {
    version: 1,
    combatId: combat.id,
    round: Number(source.round ?? combat.round ?? 0),
    activeSide: source.activeSide === "opposition" ? "opposition" : "players",
    actedCombatantIds: Array.isArray(source.actedCombatantIds)
      ? [...new Set(source.actedCombatantIds.map(String).filter((id) => validIds.has(id)))]
      : [],
    history: Array.isArray(source.history) ? source.history.slice(-100) : []
  };
}

function buildCombatantModel(combatant, state) {
  const actor = combatant.actor;
  const hasPlayerOwner = actor
    ? game.users.some((user) => !user.isGM && actor.testUserPermission(user, "OWNER"))
    : false;
  const disposition = Number(combatant.token?.disposition ?? 0);
  const side = hasPlayerOwner || disposition > 0 ? "players" : "opposition";

  return {
    id: combatant.id,
    name: combatant.name,
    img: combatant.img ?? actor?.img ?? "icons/svg/mystery-man.svg",
    side,
    acted: state.actedCombatantIds.includes(combatant.id)
  };
}

function appendHistory(history, entry) {
  return [...(Array.isArray(history) ? history : []), entry].slice(-100);
}

function combatantNames(combat, ids) {
  return ids.map((id) => combat.combatants.get(id)?.name ?? id).join(", ");
}

function selectCombatantToken(combatantId) {
  const combatant = game.combat?.combatants.get(combatantId);
  const token = combatant?.token?.object ?? globalThis.canvas?.tokens?.get(combatant?.tokenId);
  if (!token) {
    ui.notifications.warn(localize("DUNEQOL.Combat.Errors.TokenUnavailable"));
    return;
  }
  token.control({ releaseOthers: true });
  void globalThis.canvas.animatePan({ x: token.center.x, y: token.center.y, duration: 250 });
}

function notifyCombatStateChanged() {
  Hooks.callAll("duneQolCombatStateChanged");
  ui.combat?.render?.({ force: false });
}

function boundedInteger(value, minimum, maximum, fallback) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < minimum || parsed > maximum) return fallback;
  return parsed;
}

function getHtmlRoot(html) {
  if (html instanceof HTMLElement) return html;
  if (html?.[0] instanceof HTMLElement) return html[0];
  return null;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
