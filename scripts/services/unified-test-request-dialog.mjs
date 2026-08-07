import { format, localize } from "../localization.mjs";

const MODULE_ID = "dune-qol";
const SOCKET_NAME = `module.${MODULE_ID}`;
const INBOX_FLAG = "testRequestInbox";
const REQUEST_ACTION = "request-guided-test";
const GROUP_REQUEST_CONTROL = "dune-qol-group-test-request";

export function registerUnifiedTestRequestDialogHooks() {
  Hooks.on("getSceneControlButtons", (controls) => {
    if (game.system.id !== "dune" || !game.user.isGM || !controls.tokens?.tools) return;

    controls.tokens.tools[GROUP_REQUEST_CONTROL] = {
      name: GROUP_REQUEST_CONTROL,
      title: localize("DUNEQOL.GroupTools.GroupRequest.Control"),
      icon: "fa-solid fa-users-rays",
      order: Object.keys(controls.tokens.tools).length,
      button: true,
      visible: true,
      onChange: () => void openUnifiedTestRequestDialog({ source: "token-controls" })
    };
  });

  Hooks.on("renderActorSheet", (application, html) => {
    if (game.system.id !== "dune" || !game.user.isGM) return;

    const actor = application.actor ?? application.document;
    if (!isSupportedActor(actor)) return;

    const root = getHtmlRoot(html);
    const header = root?.querySelector(".window-header");
    if (!header || header.querySelector(`[data-dune-qol-action="${REQUEST_ACTION}"]`)) return;

    const button = document.createElement("a");
    button.className = "header-button dune-qol-sheet-launcher";
    button.dataset.duneQolAction = REQUEST_ACTION;
    button.setAttribute("role", "button");
    button.title = localize("DUNEQOL.TestRequests.SheetButtonTitle");
    button.innerHTML = `<i class="fa-solid fa-paper-plane"></i> ${escapeHtml(localize("DUNEQOL.TestRequests.SheetButton"))}`;
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      void openUnifiedTestRequestDialog({
        initialActor: actor,
        source: "actor-sheet"
      });
    }, { capture: true });

    const guidedButton = header.querySelector('[data-dune-qol-action="dune-qol-guided-test"]');
    const closeButton = header.querySelector(".close");
    header.insertBefore(button, guidedButton ?? closeButton ?? null);
  });
}

export async function openUnifiedTestRequestDialog({ initialActor = null, source = "token-controls" } = {}) {
  try {
    const roster = buildPlayerRoster();
    const compatibleActors = roster.flatMap((entry) => entry.actors);
    if (compatibleActors.length === 0) {
      ui.notifications.warn(localize("DUNEQOL.GroupTools.Errors.NoPlayers"));
      return;
    }

    const commonSkills = commonStatKeys(compatibleActors, "Skills");
    const commonDrives = commonStatKeys(compatibleActors, "Drives");
    const initialTarget = initialActor ? resolveInitialTarget(roster, initialActor) : null;
    const DialogV2 = foundry.applications.api.DialogV2;
    if (!DialogV2) throw new Error(localize("DUNEQOL.GuidedTest.Errors.DialogUnavailable"));

    const dialog = new DialogV2({
      window: {
        title: localize("DUNEQOL.GroupTools.GroupRequest.Title")
      },
      position: {
        width: 680
      },
      content: buildRequestContent({ roster, commonSkills, commonDrives, initialTarget }),
      buttons: [
        {
          action: "send",
          label: localize("DUNEQOL.GroupTools.GroupRequest.Send"),
          icon: "fa-solid fa-paper-plane",
          default: true,
          callback: async (_event, button) => {
            if (!button.form.reportValidity()) return false;
            try {
              const sent = await sendRequests(new FormData(button.form), roster, source);
              return sent > 0;
            } catch (error) {
              reportError("Dune QoL | Unified test-request send failed.", error);
              return false;
            }
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
    reportError("Dune QoL | Unified test-request dialog failed.", error);
  }
}

async function sendRequests(formData, roster, source) {
  const selectedUserIds = [...new Set(formData.getAll("recipientIds").map(String).filter(Boolean))];
  if (selectedUserIds.length === 0) {
    ui.notifications.warn(localize("DUNEQOL.GroupTools.Errors.NoSelection"));
    return 0;
  }

  const batchId = foundry.utils.randomID();
  const sharedPreset = {
    skill: String(formData.get("skill") ?? "") || null,
    drive: String(formData.get("drive") ?? "") || null,
    focus: String(formData.get("focus") ?? "").trim().slice(0, 120) || null,
    difficulty: boundedInteger(formData.get("difficulty"), 0, 5, 1),
    complicationRange: boundedInteger(formData.get("complicationRange"), 15, 20, 20),
    context: String(formData.get("context") ?? "").trim().slice(0, 240) || null
  };

  let sent = 0;
  const failures = [];

  for (const userId of selectedUserIds) {
    try {
      const entry = roster.find((candidate) => candidate.user.id === userId);
      const actorUuid = String(formData.get(`actorUuid__${userId}`) ?? "");
      const actor = entry?.actors.find((candidate) => candidate.uuid === actorUuid) ?? null;
      if (!entry || !actor) {
        throw new Error(localize("DUNEQOL.GroupTools.Errors.InvalidActor"));
      }

      await createRequestForRecipient({
        actor,
        recipient: entry.user,
        preset: normalizePresetForActor(sharedPreset, actor),
        batchId,
        source
      });
      sent += 1;
    } catch (error) {
      failures.push({
        userId,
        message: error instanceof Error ? error.message : String(error)
      });
    }
  }

  if (sent > 0) {
    ui.notifications.info(format("DUNEQOL.GroupTools.GroupRequest.Sent", { count: sent }));
  }

  if (failures.length > 0) {
    console.error("Dune QoL | Some unified test requests failed.", failures);
    ui.notifications.warn(format("DUNEQOL.GroupTools.GroupRequest.Partial", {
      sent,
      failed: failures.length
    }));
  }

  return sent;
}

async function createRequestForRecipient({ actor, recipient, preset, batchId, source }) {
  if (!game.user.isGM) throw new Error(localize("DUNEQOL.TestRequests.Errors.GmOnly"));
  if (recipient.isGM || !actor.testUserPermission(recipient, "OWNER")) {
    throw new Error(localize("DUNEQOL.TestRequests.Errors.InvalidRecipient"));
  }

  const requestId = foundry.utils.randomID();
  const createdAt = new Date().toISOString();
  const request = {
    version: 3,
    requestId,
    batchId,
    source,
    status: "pending",
    actorUuid: actor.uuid,
    actorName: actor.name,
    recipientUserId: recipient.id,
    requestedBy: game.user.id,
    requestedByName: game.user.name,
    createdAt,
    preset
  };

  const message = await ChatMessage.create({
    user: game.user.id,
    speaker: ChatMessage.getSpeaker({ actor }),
    whisper: [...new Set([recipient.id, game.user.id])],
    content: buildRequestCard({ actor, recipient, request }),
    flags: {
      [MODULE_ID]: {
        testRequest: request
      }
    }
  });

  const existing = recipient.getFlag(MODULE_ID, INBOX_FLAG);
  const inbox = existing && typeof existing === "object"
    ? foundry.utils.deepClone(existing)
    : {};
  inbox[requestId] = {
    version: 1,
    messageId: message.id,
    createdAt,
    request
  };
  await recipient.setFlag(MODULE_ID, INBOX_FLAG, inbox);

  game.socket.emit(SOCKET_NAME, {
    type: "refresh-test-request-inbox",
    recipientUserId: recipient.id,
    requestId
  });

  console.info("Dune QoL | Unified test request queued.", {
    source,
    batchId,
    requestId,
    messageId: message.id,
    recipientUserId: recipient.id,
    actorUuid: actor.uuid
  });
}

function buildPlayerRoster() {
  return game.users
    .filter((user) => !user.isGM)
    .map((user) => ({
      user,
      actors: ownedSupportedActors(user)
    }))
    .sort((left, right) => left.user.name.localeCompare(right.user.name));
}

function ownedSupportedActors(user) {
  const owned = game.actors
    .filter((actor) => isSupportedActor(actor) && actor.testUserPermission(user, "OWNER"));
  const assigned = user.character;

  return owned.sort((left, right) => {
    if (assigned?.id === left.id) return -1;
    if (assigned?.id === right.id) return 1;
    return left.name.localeCompare(right.name);
  });
}

function resolveInitialTarget(roster, actor) {
  const owners = roster.filter((entry) => entry.actors.some((candidate) => candidate.uuid === actor.uuid));
  if (owners.length === 0) return null;

  const preferred = owners.find((entry) => entry.user.character?.id === actor.id) ?? owners[0];
  return {
    userId: preferred.user.id,
    actorUuid: actor.uuid
  };
}

function commonStatKeys(actors, property) {
  if (actors.length === 0) return [];
  const keySets = actors.map((actor) => new Set(getStatOptions(actor.system?.[property]).map((entry) => entry.key)));
  return [...keySets[0]]
    .filter((key) => keySets.every((set) => set.has(key)))
    .sort((left, right) => left.localeCompare(right));
}

function normalizePresetForActor(preset, actor) {
  const skills = getStatOptions(actor.system?.Skills);
  const drives = getStatOptions(actor.system?.Drives);
  const skill = normalizeSuggestion(preset.skill, skills);
  const drive = normalizeSuggestion(preset.drive, drives);

  if (preset.skill && !skill) throw new Error(localize("DUNEQOL.GuidedTest.Errors.InvalidStats"));
  if (preset.drive && !drive) throw new Error(localize("DUNEQOL.GuidedTest.Errors.InvalidStats"));

  return {
    ...preset,
    skill,
    drive
  };
}

function buildRequestContent({ roster, commonSkills, commonDrives, initialTarget }) {
  const playerRows = roster.map(({ user, actors }) => {
    const hasActors = actors.length > 0;
    const checked = hasActors && initialTarget?.userId === user.id;
    const selectedActorUuid = checked ? initialTarget.actorUuid : actors[0]?.uuid ?? "";
    const actorOptions = hasActors
      ? actors.map((actor) => `<option value="${escapeHtml(actor.uuid)}" ${actor.uuid === selectedActorUuid ? "selected" : ""}>${escapeHtml(actor.name)}</option>`).join("")
      : `<option value="">${escapeHtml(localize("DUNEQOL.GroupTools.GroupRequest.NoCompatibleActor"))}</option>`;

    return `
      <div class="dune-qol-group-player-row">
        <label class="dune-qol-group-player-row__player">
          <input type="checkbox" name="recipientIds" value="${escapeHtml(user.id)}" ${checked ? "checked" : ""} ${hasActors ? "" : "disabled"}>
          <span>${escapeHtml(user.name)}</span>
          ${user.active ? "" : `<small>${escapeHtml(localize("DUNEQOL.TestRequests.Offline"))}</small>`}
        </label>
        <label>
          <span>${escapeHtml(localize("DUNEQOL.GroupTools.GroupRequest.Actor"))}</span>
          <select name="actorUuid__${escapeHtml(user.id)}" ${hasActors ? "" : "disabled"}>${actorOptions}</select>
        </label>
      </div>
    `;
  }).join("");

  return `
    <div class="dune-qol-group-request-dialog">
      <p class="hint">${escapeHtml(localize("DUNEQOL.GroupTools.GroupRequest.Hint"))}</p>
      <div class="dune-qol-group-player-list">${playerRows}</div>
      <div class="dune-qol-form-grid">
        <label>
          <span>${escapeHtml(localize("DUNEQOL.TestRequests.SuggestedSkill"))}</span>
          <select name="skill">${buildKeyOptions(commonSkills)}</select>
        </label>
        <label>
          <span>${escapeHtml(localize("DUNEQOL.TestRequests.SuggestedDrive"))}</span>
          <select name="drive">${buildKeyOptions(commonDrives)}</select>
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
          <input name="context" type="text" maxlength="240">
        </label>
      </div>
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
      <button type="button" data-dune-qol-action="open-requested-test">
        <i class="fa-solid fa-dice-d20"></i>
        ${escapeHtml(localize("DUNEQOL.TestRequests.Open"))}
      </button>
    </section>
  `;
}

function buildKeyOptions(keys) {
  return [
    `<option value="">${escapeHtml(localize("DUNEQOL.TestRequests.PlayerChooses"))}</option>`,
    ...keys.map((key) => `<option value="${escapeHtml(key)}">${escapeHtml(key)}</option>`)
  ].join("");
}

function getStatOptions(stats) {
  if (!stats || typeof stats !== "object") return [];
  return Object.entries(stats)
    .map(([key, data]) => ({ key, value: Number(data?.value ?? data) }))
    .filter((entry) => Number.isInteger(entry.value));
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

function reportError(prefix, error) {
  console.error(prefix, error);
  ui.notifications.error(format("DUNEQOL.GroupTools.Errors.Failed", {
    message: error instanceof Error ? error.message : String(error)
  }));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
