const MODULE_ID = "dune-qol";
const PARTY_DATA_KEY = `${MODULE_ID}.partyData`;
const COMBAT_STATE_KEY = `${MODULE_ID}.combatState`;
const COMBAT_CONTROL = "dune-qol-combat-manager";

export function registerLiveUpdateHooks() {
  Hooks.on("getSceneControlButtons", (controls) => {
    const tool = controls.tokens?.tools?.[COMBAT_CONTROL];
    if (!tool) return;
    tool.onChange = openCombatTracker;
  });

  Hooks.on("updateSetting", (setting) => {
    const key = String(setting?.key ?? setting?.id ?? "");
    if (key !== PARTY_DATA_KEY && key !== COMBAT_STATE_KEY) return;

    const refresh = document.querySelector(
      ".dune-qol-party-sheet [data-party-action='refresh']"
    );
    if (refresh instanceof HTMLButtonElement) refresh.click();

    if (key === COMBAT_STATE_KEY) {
      Hooks.callAll("duneQolCombatStateChanged");
      renderCombatTracker();
    }
  });

  Hooks.on("duneQolCombatStateChanged", renderCombatTracker);
}

function openCombatTracker() {
  if (typeof ui.sidebar?.changeTab === "function") {
    ui.sidebar.changeTab("combat", "primary", { force: true });
  } else {
    ui.sidebar?.activateTab?.("combat");
  }
  renderCombatTracker();
}

function renderCombatTracker() {
  const tracker = ui.combat ?? game.combats?.directory ?? null;
  void tracker?.render?.({ force: false });
}
