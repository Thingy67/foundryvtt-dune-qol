import { format, localize } from "../localization.mjs";

const PARTY_ROOT = ".dune-qol-party-sheet";
const CONFIRMED_CANCEL = "duneQolConfirmedCancel";

export function registerPartySheetNavigationHooks() {
  Hooks.on("renderApplicationV2", (_application, element) => {
    const host = getHtmlRoot(element);
    const root = host?.matches?.(PARTY_ROOT) ? host : host?.querySelector(PARTY_ROOT);
    if (!root) return;

    configureChatNavigation(root);
    configureCancellationConfirmation(root);
  });
}

function configureChatNavigation(root) {
  for (const button of root.querySelectorAll("[data-open-chat-message]")) {
    if (button.dataset.duneQolNavigationConfigured === "true") continue;
    button.dataset.duneQolNavigationConfigured = "true";

    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      openChatMessage(button.dataset.openChatMessage);
    }, { capture: true });
  }
}

function configureCancellationConfirmation(root) {
  for (const button of root.querySelectorAll("[data-cancel-request]")) {
    if (button.dataset.duneQolCancelConfigured === "true") continue;
    button.dataset.duneQolCancelConfigured = "true";

    button.addEventListener("click", async (event) => {
      if (button.dataset[CONFIRMED_CANCEL] === "true") {
        delete button.dataset[CONFIRMED_CANCEL];
        return;
      }

      event.preventDefault();
      event.stopImmediatePropagation();

      const confirmed = await foundry.applications.api.DialogV2.confirm({
        window: {
          title: localize("DUNEQOL.PartySheet.Requests.CancelTitle")
        },
        content: `<p>${escapeHtml(format("DUNEQOL.PartySheet.Requests.CancelConfirm", {
          actor: button.dataset.actorName ?? localize("DUNEQOL.PartySheet.Requests.UnknownActor")
        }))}</p>`,
        yes: {
          label: localize("DUNEQOL.PartySheet.Requests.Cancel"),
          icon: "fa-solid fa-ban"
        },
        no: {
          label: localize("DUNEQOL.Cancel"),
          icon: "fa-solid fa-xmark"
        }
      });

      if (!confirmed) return;
      button.dataset[CONFIRMED_CANCEL] = "true";
      button.click();
    }, { capture: true });
  }
}

function openChatMessage(messageId) {
  if (!messageId) return;

  if (typeof ui.sidebar?.changeTab === "function") {
    ui.sidebar.changeTab("chat", "primary", { force: true });
  } else {
    ui.sidebar?.activateTab?.("chat");
  }

  const escapedId = globalThis.CSS?.escape
    ? CSS.escape(messageId)
    : String(messageId).replaceAll('"', '\\"');

  let attempts = 0;
  const findAndScroll = () => {
    const message = document.querySelector(`[data-message-id="${escapedId}"]`);
    if (message) {
      message.scrollIntoView({ behavior: "smooth", block: "center" });
      message.classList.add("dune-qol-chat-message-highlight");
      setTimeout(() => message.classList.remove("dune-qol-chat-message-highlight"), 1800);
      return;
    }

    attempts += 1;
    if (attempts < 10) setTimeout(findAndScroll, 100);
  };
  setTimeout(findAndScroll, 50);
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
