import { safelyOpenGuidedTest } from "../features/guided-test.mjs";
import { queueGuidedTestPreset } from "../features/guided-test-ui.mjs";
import { format, localize } from "../localization.mjs";

const MODULE_ID = "dune-qol";
const SOCKET_NAME = `module.${MODULE_ID}`;
const REQUEST_ACTION = "request-guided-test";
const OPEN_ACTION = "open-requested-test";

export function registerTestRequestHooks() {
  Hooks.once("ready", () => {
    game.socket.on(SOCKET_NAME, handleSocketMessage);
  });

  Hooks.on("renderActorSheet", (application, html) => {
    if (game.system.id !== "dune" || !game.user.isGM) return;

    const actor = application.actor ?? application.document;
    if (!isSupportedActor(actor)) return;

    addRequestButton(application, html, actor);
  });

  Hooks.on("renderChatMessage", (message, html) => {
    configureRequestCard(message, html);
  });
}

function addRequestButton(application, html, actor) {
  const root = getHtmlRoot(html);
  const header = root?.querySelector(".window-header");
  if (!header || header.querySelector(`[data-dune-qol-action="${REQUEST_ACTION}"]`)) return;

  const button = document.createElement("a");
  button.className = "header-button control dune-qol-sheet-launcher";
  button.dataset.duneQolAction = REQUEST_ACTION;
  button.title = localize("DUNEQOL.TestRequests.SheetButtonTitle");
  button.innerHTML = `<i class="fa-solid fa-paper-plane"></i> ${escapeHtml(localize("DUNEQOL.TestRequests.SheetButton"))}`;
  button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    void openRequestDialog(actor);
  });

  const guidedButton = header.querySelector('[data-dune-qol-action="dune-qol-guided-test"]');
  const closeButton = header.querySelector(".close");
  header.insertBefore(button, guidedButton ?? closeButton ?? null);

  console.debug(
    `Dune QoL | Added test-request launcher to Actor sheet '${application.id ?? actor.name}'.`
  );
}

async function openRequestDialog(actor) {
  try {
    const recipients = getEligibleRecipients(actor);
    if (recipients.length === 0) {
      ui.notifications.warn(localize("DUNEQOL.TestRequests.Errors.NoOwner"));
      return;
    }

    const skills = getStatOptions(actor.system?.Skills);
    const drives = getStatOptions(actor.system?.Drives);
    const DialogV2 = foundry.applications.api.DialogV2;
    if (!DialogV2) throw new Error(localize("DUNEQOL.GuidedTest.Errors.DialogUnavailable"));

    const dialog = new DialogV2({
      window: {
        title: format("DUNEQOL.TestRequests.DialogTitle", { actor: actor.name })
      },
      position: {
        width: 520
      },
      content: buildRequestDialogContent({ actor, recipients, skills, drives }),
      buttons: [
        {
          action: "send",
          label: localize("DUNEQOL.TestRequests.Send"),
          icon: "fa-solid fa-paper-plane",
          default: true,
          callback: async (_event, button) => {
            if (!button.form.reportValidity()) return false;
            await createTestRequest(actor, new FormData(button.form));
            return true;
          }
        },
        {
          action: "cancel",
          label: localize("DUNEQOL.Cancel"),
          icon: "fa-solid fa-xmark"
        }
      ]
    });

    await dialog.render({ force: true });
  } catch (error) {
    console.error("Dune QoL | Test-request dialog failed.", error);
    ui.notifications.error(
      format("DUNEQOL.TestRequests.Errors.SendFailed", {
        message: error instanceof Error ? error.message : String(error)
      })
    );
  }
}

async function createTestRequest(actor, formData) {
  if (!game.user.isGM) {
    throw new Error(localize("DUNEQOL.TestRequests.Errors.GmOnly"));
  }

  const recipientId = String(formData.get("recipient") ?? "");
  const recipient = game.users.get(recipientId);
  if (!recipient || recipient.isGM || !actor.testUserPermission(recipient, "OWNER")) {
    throw new Error(localize("DUNEQOL.TestRequests.Errors.InvalidRecipient"));
  }

  const skills = getStatOptions(actor.system?.Skills);
  const drives = getStatOptions(actor.system?.Drives);
  const skill = normalizeSuggestion(formData.get("skill"), skills);
  const drive = normalizeSuggestion(formData.get("drive"), drives);
  const difficulty = boundedInteger(formData.get("difficulty"), 0, 5, 1);
  const complicationRange = boundedInteger(formData.get("complicationRange"), 15, 20, 20);
  const focus = String(formData.get("focus") ?? "").trim().slice(0, 120);
  const context = String(formData.get("context") ?? "").trim().slice(0, 240);
  const requestId = foundry.utils.randomID();
  const createdAt = new Date().toISOString();

  const request = {
    version: 1,
    requestId,
    status: "pending",
    actorUuid: actor.uuid,
    actorName: actor.name,
    recipientUserId: recipient.id,
    requestedBy: game.user.id,
    requestedByName: game.user.name,
    createdAt,
    preset: {
      skill,
      drive,
      focus: focus || null,
      difficulty,
      complicationRange,
      context: context || null
    }
  };

  const message = await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    whisper: [...new Set([recipient.id, game.user.id])],
    content: buildRequestCard({ actor, recipient, request }),
    flags: {
      [MODULE_ID]: {
        testRequest: request
      }
    }
  });

  if (recipient.active) {
    game.socket.emit(SOCKET_NAME, {
      type: "open-guided-test-request",
      messageId: message.id,
      recipientUserId: recipient.id,
      request
    });
  }

  ui.notifications.info(
    format("DUNEQOL.TestRequests.Sent", {
      user: recipient.name,
      actor: actor.name
    })
  );
}

async function handleSocketMessage(payload) {
  if (!payload || typeof payload !== "object") return;
  if (payload.type !== "open-guided-test-request") return;
  if (payload.recipientUserId !== game.user.id) return;

  const request = payload.request;
  const actor = request?.actorUuid ? await fromUuid(request.actorUuid).catch(() => null) : null;
  if (!actor || !actor.isOwner) {
    ui.notifications.error(localize("DUNEQOL.TestRequests.Errors.ActorUnavailable"));
    return;
  }

  ui.notifications.info(
    format("DUNEQOL.TestRequests.Received", {
      user: request.requestedByName ?? localize("DUNEQOL.TestRequests.UnknownGm"),
      actor: actor.name
    })
  );

  queueGuidedTestPreset({
    actorUuid: actor.uuid,
    requestMessageId: payload.messageId,
    requestedBy: request.requestedBy,
    requestedByName: request.requestedByName,
    preset: request.preset
  });
  await safelyOpenGuidedTest(actor);
}

async function configureRequestCard(message, html) {
  const request = message.getFlag(MODULE_ID, "testRequest");
  if (!request) return;

  const root = getHtmlRoot(html);
  const button = root?.querySelector(`[data-dune-qol-action="${OPEN_ACTION}"]`);
  if (!(button instanceof HTMLButtonElement)) return;

  if (request.recipientUserId !== game.user.id) {
    button.hidden = true;
    return;
  }

  button.addEventListener("click", async (event) => {
    event.preventDefault();
    button.disabled = true;
    try {
      const actor = await fromUuid(request.actorUuid).catch(() => null);
      if (!actor || !actor.isOwner) {
        ui.notifications.error(localize("DUNEQOL.TestRequests.Errors.ActorUnavailable"));
        return;
      }

      queueGuidedTestPreset({
        actorUuid: actor.uuid,
        requestMessageId: message.id,
        requestedBy: request.requestedBy,
        requestedByName: request.requestedByName,
        preset: request.preset
      });
      await safelyOpenGuidedTest(actor);
    } finally {
      button.disabled = false;
    }
  });
}

function buildRequestDialogContent({ actor, recipients, skills, drives }) {
  const recipientOptions = recipients
    .map((user) => `<option value="${escapeHtml(user.id)}">${escapeHtml(user.name)}${user.active ? "" : ` — ${escapeHtml(localize("DUNEQOL.TestRequests.Offline"))}`}</option>`)
    .join("");
  const skillOptions = buildSuggestionOptions(skills, "DUNEQOL.TestRequests.PlayerChooses");
  const driveOptions = buildSuggestionOptions(drives, "DUNEQOL.TestRequests.PlayerChooses");

  return `
    <div class="dune-qol-test-request-dialog">
      <p><strong>${escapeHtml(actor.name)}</strong></p>
      <div class="dune-qol-form-grid">
        <label class="dune-qol-form-grid__wide">
          <span>${escapeHtml(localize("DUNEQOL.TestRequests.Recipient"))}</span>
          <select name="recipient" required>${recipientOptions}</select>
        </label>
        <label>
          <span>${escapeHtml(localize("DUNEQOL.TestRequests.SuggestedSkill"))}</span>
          <select name="skill">${skillOptions}</select>
        </label>
        <label>
          <span>${escapeHtml(localize("DUNEQOL.TestRequests.SuggestedDrive"))}</span>
          <select name="drive">${driveOptions}</select>
        </label>
        <label class="dune-qol-form-grid__wide">
          <span>${escapeHtml(localize("DUNEQOL.TestRequests.SuggestedFocus"))}</span>
          <input name="focus" type="text" maxlength="120">
        </label>
        <label>
          <span>${escapeHtml(localize("DUNEQOL.GuidedTest.Difficulty"))}</span>
          <input name="difficulty" type="number" min="0" max="5" step="1" value="1" required>
        </label>
        <label>
          <span>${escapeHtml(localize("DUNEQOL.GuidedTest.ComplicationRange"))}</span>
          <input name="complicationRange" type="number" min="15" max="20" step="1" value="20" required>
        </label>
        <label class="dune-qol-form-grid__wide">
          <span>${escapeHtml(localize("DUNEQOL.GuidedTest.Context"))}</span>
          <input name="context" type="text" maxlength="240" required>
        </label>
      </div>
      <p class="hint">${escapeHtml(localize("DUNEQOL.TestRequests.SuggestionsHint"))}</p>
    </div>
  `;
}

function buildRequestCard({ actor, recipient, request }) {
  const skill = request.preset.skill ?? localize("DUNEQOL.TestRequests.PlayerChooses");
  const drive = request.preset.drive ?? localize("DUNEQOL.TestRequests.PlayerChooses");
  const focus = request.preset.focus ?? "—";
  const context = request.preset.context ?? "—";

  return `
    <section class="dune-qol-test-request-card">
      <header><strong>${escapeHtml(localize("DUNEQOL.TestRequests.CardTitle"))}</strong></header>
      <p>${escapeHtml(format("DUNEQOL.TestRequests.CardContext", {
        gm: game.user.name,
        user: recipient.name,
        actor: actor.name
      }))}</p>
      <p class="dune-qol-test-request-card__context">${escapeHtml(context)}</p>
      <dl>
        <div><dt>${escapeHtml(localize("DUNEQOL.GuidedTest.Difficulty"))}</dt><dd>${request.preset.difficulty}</dd></div>
        <div><dt>${escapeHtml(localize("DUNEQOL.GuidedTest.ComplicationRange"))}</dt><dd>${request.preset.complicationRange}–20</dd></div>
        <div><dt>${escapeHtml(localize("DUNEQOL.TestRequests.SuggestedSkill"))}</dt><dd>${escapeHtml(skill)}</dd></div>
        <div><dt>${escapeHtml(localize("DUNEQOL.TestRequests.SuggestedDrive"))}</dt><dd>${escapeHtml(drive)}</dd></div>
        <div><dt>${escapeHtml(localize("DUNEQOL.TestRequests.SuggestedFocus"))}</dt><dd>${escapeHtml(focus)}</dd></div>
      </dl>
      <button type="button" data-dune-qol-action="${OPEN_ACTION}">
        <i class="fa-solid fa-dice-d20"></i>
        ${escapeHtml(localize("DUNEQOL.TestRequests.Open"))}
      </button>
    </section>
  `;
}

function getEligibleRecipients(actor) {
  return game.users
    .filter((user) => !user.isGM && actor.testUserPermission(user, "OWNER"))
    .sort((left, right) => {
      if (left.active !== right.active) return left.active ? -1 : 1;
      return left.name.localeCompare(right.name);
    });
}

function getStatOptions(stats) {
  if (!stats || typeof stats !== "object") return [];
  return Object.entries(stats)
    .map(([key, data]) => ({ key, value: Number(data?.value ?? data) }))
    .filter((entry) => Number.isInteger(entry.value));
}

function buildSuggestionOptions(entries, emptyKey) {
  return [
    `<option value="">${escapeHtml(localize(emptyKey))}</option>`,
    ...entries.map((entry) => `<option value="${escapeHtml(entry.key)}">${escapeHtml(entry.key)} (${entry.value})</option>`)
  ].join("");
}

function normalizeSuggestion(value, entries) {
  const key = String(value ?? "");
  return entries.some((entry) => entry.key === key) ? key : null;
}

function boundedInteger(value, minimum, maximum, fallback) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < minimum || parsed > maximum) return fallback;
  return parsed;
}

function isSupportedActor(actor) {
  return Boolean(actor?.system?.Skills && actor?.system?.Drives);
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
