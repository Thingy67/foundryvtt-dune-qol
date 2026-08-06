import { readDunePools, writeDunePool } from "../adapters/dune-pools.mjs";
import {
  buildRetentionPlan,
  lockInitiativeRetention,
  markCombatantsActed,
  markCombatantsAvailable,
  normalizeCombatState,
  oppositeCombatSide,
  resetCombatRoundState
} from "../domain/combat-state.mjs";
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
      onChange: openCombatTracker
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
  const state = normalizeCombatState({
    state: game.settings.get(MODULE_ID, COMBAT_STATE_SETTING),
    combatId: combat?.id ?? null,
    round: combat?.round ?? 0,
    combatantIds: combat ? [...combat.combatants].map((combatant) => combatant.id) : []
  });
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
  const activeLabel = sideLabel(state.activeSide);
  const retainLocked = state.retainLockedSide === state.activeSide;
  const paymentControl = state.activeSide === "players"
    ? `<label><span>${escapeHtml(localize("DUNEQOL.Combat.RetainPayment"))}</span>
        <select name="retainPayment">
          <option value="momentum">Momentum</option>
          <option value="threat">${escapeHtml(localize("DUNEQOL.Combat.Payment.AddThreat"))}</option>
        </select>
      </label>`
    : `<input name="retainPayment" type="hidden" value="threat">
       <p class="hint">${escapeHtml(localize("DUNEQOL.Combat.Payment.OppositionThreat"))}</p>`;
  const combatants = model.combatants.map((combatant) => `
    <label class="dune-qol-combatant-row ${combatant.acted ? "acted" : ""}">
      ${model.canEdit ? `<input type="checkbox" name="combatantIds" value="${escapeHtml(combatant.id)}">` : ""}
      <img src="${escapeHtml(combatant.img)}" alt="">
      <span class="dune-qol-combatant-row__name">${escapeHtml(combatant.name)}</span>
      <small>${escapeHtml(sideLabel(combatant.side))}</small>
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
      ${paymentControl}
      <label><span>${escapeHtml(localize("DUNEQOL.Combat.RetainCost"))}</span><input name="retainCost" type="number" min="0" max="6" step="1" value="2"></label>
      <button type="button" data-combat-action="retain" ${retainLocked ? "disabled" : ""}><i class="fa-solid fa-hand"></i> ${escapeHtml(localize("DUNEQOL.Combat.Retain"))}</button>
      ${retainLocked ? `<p class="hint dune-qol-combat-retain-lock">${escapeHtml(localize("DUNEQOL.Combat.RetainLocked"))}</p>` : ""}
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
      const payment = String(panel.querySelector("[name='retainPayment']")?.value ?? "momentum");
      button.disabled = true;
      try {
        await applyCombatCommand(action, { combatantIds: selected, cost, payment });
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

export async function applyCombatCommand(action, { combatantIds = [], cost = 0, payment = "momentum" } = {}) {
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
    const current = normalizeCombatState({
      state: game.settings.get(MODULE_ID, COMBAT_STATE_SETTING),
      combatId: combat.id,
      round: combat.round ?? 0,
      combatantIds: [...combat.combatants].map((combatant) => combatant.id)
    });
    let next = foundry.utils.deepClone(current);
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
        next = markCombatantsActed({
          state: next,
          combatantIds: selectedIds,
          sideByCombatantId: Object.fromEntries(
            [...combat.combatants].map((combatant) => [combatant.id, combatantSide(combatant)])
          )
        });
        label = format("DUNEQOL.Combat.HistoryMarked", { names: combatantNames(combat, selectedIds) });
        break;
      case "mark-unacted":
        if (selectedIds.length === 0) throw new Error(localize("DUNEQOL.Combat.Errors.NoSelection"));
        next = markCombatantsAvailable({ state: next, combatantIds: selectedIds });
        label = format("DUNEQOL.Combat.HistoryUnmarked", { names: combatantNames(combat, selectedIds) });
        break;
      case "pass":
        next.activeSide = oppositeCombatSide(next.activeSide);
        label = format("DUNEQOL.Combat.HistoryPassed", { side: sideLabel(next.activeSide) });
        break;
      case "retain": {
        const locked = lockInitiativeRetention(next);
        if (!locked.ok) throw new Error(localize("DUNEQOL.Combat.Errors.RetainLocked"));
        const paymentResult = await applyRetentionPayment({
          side: next.activeSide,
          payment,
          cost
        });
        next = locked.state;
        label = format("DUNEQOL.Combat.HistoryRetained", {
          side: sideLabel(next.activeSide),
          payment: paymentResult
        });
        break;
      }
      case "reset-round":
        next = resetCombatRoundState(next, {
          round: next.round,
          activeSide: next.activeSide
        });
        label = localize("DUNEQOL.Combat.HistoryReset");
        break;
      case "new-round":
        suppressRoundSynchronization = true;
        try {
          await combat.nextRound();
        } finally {
          suppressRoundSynchronization = false;
        }
        next = resetCombatRoundState(next, {
          round: combat.round ?? ((current.round ?? 0) + 1)
        });
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
    console.error("Dune QoL | Combat command failed.", error, { action, combatantIds, cost, payment });
    ui.notifications.error(format("DUNEQOL.Combat.Errors.Failed", {
      message: error instanceof Error ? error.message : String(error)
    }));
  } finally {
    activeCommands.delete(commandKey);
  }
}

async function applyRetentionPayment({ side, payment, cost }) {
  const pools = await readDunePools();
  const plan = buildRetentionPlan({
    side,
    payment,
    cost,
    momentum: pools.momentum,
    threat: pools.threat
  });

  if (!plan.ok) {
    if (plan.reason === "invalid-cost") {
      throw new Error(localize("DUNEQOL.Combat.Errors.InvalidCost"));
    }
    if (plan.reason === "invalid-payment") {
      throw new Error(localize("DUNEQOL.Combat.Errors.InvalidPayment"));
    }
    if (plan.reason === "insufficient-pool") {
      throw new Error(format("DUNEQOL.Combat.Errors.InsufficientPool", {
        available: plan.available,
        cost: plan.required
      }));
    }
    throw new Error(localize("DUNEQOL.Combat.Errors.UnknownAction"));
  }

  if (plan.momentumAfter !== plan.momentumBefore) {
    await writeDunePool("momentum", plan.momentumAfter);
  }
  if (plan.threatAfter !== plan.threatBefore) {
    await writeDunePool("threat", plan.threatAfter);
  }

  const key = {
    "none": "DUNEQOL.Combat.Payment.None",
    "momentum-spent": "DUNEQOL.Combat.Payment.MomentumSpent",
    "threat-added": "DUNEQOL.Combat.Payment.ThreatAdded",
    "threat-spent": "DUNEQOL.Combat.Payment.ThreatSpent"
  }[plan.paymentKind];
  return format(key, { cost: plan.cost });
}

async function renderCombatTrackerPanel(html) {
  const root = getHtmlRoot(html);
  if (!root) return;
  root.querySelector(PANEL_SELECTOR)?.remove();

  const model = await getCombatModel();
  const wrapper = document.createElement("div");
  wrapper.innerHTML = buildCombatPanelHtml(model);
  const panel = wrapper.firstElementChild;
  if (!(panel instanceof HTMLElement)) return;

  const target = root.querySelector(".combat-tracker") ?? root;
  target.prepend(panel);
  configureCombatPanel(panel, {
    rerender: async () => renderCombatTrackerApplication()
  });
}

async function synchronizeRound(combat) {
  const current = normalizeCombatState({
    state: game.settings.get(MODULE_ID, COMBAT_STATE_SETTING),
    combatId: combat.id,
    round: combat.round ?? 0,
    combatantIds: [...combat.combatants].map((combatant) => combatant.id)
  });
  const round = Number(combat.round ?? 0);
  if (current.round === round) return;

  const next = resetCombatRoundState(current, { round });
  next.history = appendHistory(next.history, {
    at: new Date().toISOString(),
    userId: game.user.id,
    action: "round-sync",
    label: format("DUNEQOL.Combat.HistoryNewRound", { round })
  });
  await saveCombatState(next);
}

async function saveCombatState(state) {
  await game.settings.set(MODULE_ID, COMBAT_STATE_SETTING, state);
  notifyCombatStateChanged();
}

function buildCombatantModel(combatant, state) {
  return {
    id: combatant.id,
    name: combatant.name,
    img: combatant.img ?? combatant.actor?.img ?? "icons/svg/mystery-man.svg",
    side: combatantSide(combatant),
    acted: state.actedCombatantIds.includes(combatant.id)
  };
}

function combatantSide(combatant) {
  const actor = combatant?.actor;
  const hasPlayerOwner = actor
    ? game.users.some((user) => !user.isGM && actor.testUserPermission(user, "OWNER"))
    : false;
  const disposition = Number(combatant?.token?.disposition ?? 0);
  return hasPlayerOwner || disposition > 0 ? "players" : "opposition";
}

function sideLabel(side) {
  return side === "opposition"
    ? localize("DUNEQOL.Combat.Side.Opposition")
    : localize("DUNEQOL.Combat.Side.Players");
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

function openCombatTracker() {
  if (typeof ui.sidebar?.changeTab === "function") {
    ui.sidebar.changeTab("combat", "primary", { force: true });
  } else {
    ui.sidebar?.activateTab?.("combat");
  }
  renderCombatTrackerApplication();
}

function renderCombatTrackerApplication() {
  const tracker = ui.combat ?? game.combats?.directory ?? null;
  void tracker?.render?.({ force: false });
}

function notifyCombatStateChanged() {
  Hooks.callAll("duneQolCombatStateChanged");
  renderCombatTrackerApplication();
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
