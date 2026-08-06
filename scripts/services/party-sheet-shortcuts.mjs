import { localize } from "../localization.mjs";

const PARTY_ROOT = ".dune-qol-party-sheet";

export function registerPartySheetShortcutHooks() {
  Hooks.on("renderApplicationV2", (_application, element) => {
    const root = getHtmlRoot(element)?.querySelector(PARTY_ROOT);
    if (root) configureCharacterShortcuts(root);
  });
}

function configureCharacterShortcuts(root) {
  for (const card of root.querySelectorAll("[data-party-actor-meta]")) {
    const footer = card.querySelector(":scope > footer");
    if (!footer || footer.querySelector("[data-party-show-traits]")) continue;

    const button = document.createElement("button");
    button.type = "button";
    button.dataset.partyShowTraits = card.dataset.partyActorMeta;
    button.innerHTML = `<i class="fa-solid fa-tags"></i> ${escapeHtml(localize("DUNEQOL.PartySheet.Actions.Traits"))}`;
    button.addEventListener("click", () => {
      root.querySelector('[data-party-tab="traits"]')?.click();
    });
    footer.append(button);
  }
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
