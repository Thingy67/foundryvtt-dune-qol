import {
  buildCombatPanelHtml,
  configureCombatPanel,
  getCombatModel
} from "./combat-manager.mjs";
import { localize } from "../localization.mjs";

const PARTY_ROOT = ".dune-qol-party-sheet";
const COMBAT_TAB = "combat";

export function registerPartySheetCombatHooks() {
  Hooks.on("renderApplicationV2", (_application, element) => {
    const root = getHtmlRoot(element)?.querySelector(PARTY_ROOT);
    if (root) void injectCombatTab(root);
  });

  Hooks.on("duneQolCombatStateChanged", () => {
    const root = document.querySelector(PARTY_ROOT);
    if (root) void refreshCombatPanel(root);
  });
}

async function injectCombatTab(root) {
  const navigation = root.querySelector(".dune-qol-party-sheet__tabs");
  const main = root.querySelector(":scope > main");
  if (!navigation || !main) return;

  let button = navigation.querySelector(`[data-party-extension-tab="${COMBAT_TAB}"]`);
  if (!button) {
    button = document.createElement("button");
    button.type = "button";
    button.dataset.partyExtensionTab = COMBAT_TAB;
    button.textContent = localize("DUNEQOL.PartySheet.Tabs.Combat");
    navigation.append(button);
    button.addEventListener("click", () => activateCombatTab(root, button));
  }

  let section = main.querySelector(`[data-party-extension-panel="${COMBAT_TAB}"]`);
  if (!section) {
    section = document.createElement("section");
    section.className = "dune-qol-party-tab";
    section.dataset.partyExtensionPanel = COMBAT_TAB;
    main.append(section);
  }

  await refreshCombatPanel(root);
}

async function refreshCombatPanel(root) {
  const section = root.querySelector(`[data-party-extension-panel="${COMBAT_TAB}"]`);
  if (!section) return;

  const wasActive = section.classList.contains("active");
  const model = await getCombatModel();
  section.innerHTML = buildCombatPanelHtml(model, { embedded: true });
  if (wasActive) section.classList.add("active");
  configureCombatPanel(section, {
    rerender: async () => refreshCombatPanel(root)
  });
}

function activateCombatTab(root, button) {
  for (const tabButton of root.querySelectorAll(".dune-qol-party-sheet__tabs button")) {
    tabButton.classList.toggle("active", tabButton === button);
  }
  for (const panel of root.querySelectorAll(".dune-qol-party-tab")) {
    panel.classList.remove("active");
  }
  root.querySelector(`[data-party-extension-panel="${COMBAT_TAB}"]`)?.classList.add("active");
}

function getHtmlRoot(html) {
  if (html instanceof HTMLElement) return html;
  if (html?.[0] instanceof HTMLElement) return html[0];
  return null;
}
