const MODULE_ID = "dune-qol";
const PARTY_DATA_KEY = `${MODULE_ID}.partyData`;

export function registerLiveUpdateHooks() {
  Hooks.on("updateSetting", (setting) => {
    const key = String(setting?.key ?? setting?.id ?? "");
    if (key === PARTY_DATA_KEY) refreshOpenPartySheet();
  });
}

function refreshOpenPartySheet() {
  const refresh = document.querySelector(
    ".dune-qol-party-sheet [data-party-action='refresh']"
  );
  if (refresh instanceof HTMLButtonElement) refresh.click();
}
