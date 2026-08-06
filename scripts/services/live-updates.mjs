const MODULE_ID = "dune-qol";
const PARTY_DATA_KEY = `${MODULE_ID}.partyData`;
const COMBAT_STATE_KEY = `${MODULE_ID}.combatState`;

export function registerLiveUpdateHooks() {
  Hooks.on("updateSetting", (setting) => {
    const key = String(setting?.key ?? setting?.id ?? "");
    if (key !== PARTY_DATA_KEY && key !== COMBAT_STATE_KEY) return;

    const refresh = document.querySelector(
      ".dune-qol-party-sheet [data-party-action='refresh']"
    );
    if (refresh instanceof HTMLButtonElement) refresh.click();

    if (key === COMBAT_STATE_KEY) {
      Hooks.callAll("duneQolCombatStateChanged");
      void ui.combat?.render?.({ force: false });
    }
  });
}
