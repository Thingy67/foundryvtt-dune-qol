import {
  appendCreatedComplicationTrait,
  summarizeComplicationResolution
} from "../domain/complication-resolution.mjs";
import { format, localize } from "../localization.mjs";

const MODULE_ID = "dune-qol";
const SOCKET_NAME = `module.${MODULE_ID}`;
const CREATE_ACTION = "create-complication-trait";
const activeCreations = new Set();

export function registerComplicationTraitHooks() {
  Hooks.once("ready", () => {
    game.socket.on(SOCKET_NAME, handleSocketMessage);
  });

  Hooks.on("renderChatMessage", (message, html) => {
    void configureComplicationSection(message, html);
  });
}

async function configureComplicationSection(message, html) {
  const root = getHtmlRoot(html);
  const card = root?.querySelector(".dune-qol-test-card");
  if (!card) return;

  const guidedTest = message.getFlag(MODULE_ID, "guidedTest");
  const complications = Number(guidedTest?.complications ?? 0);
  if (!Number.isInteger(complications) || complications < 1) return;

  const existing = card.querySelector(".dune-qol-complication-resolution");
  existing?.remove();

  const createdTraits = guidedTest?.complicationResolution?.createdTraits ?? [];
  const summary = summarizeComplicationResolution({ complications, createdTraits });
  const actor = guidedTest.actorUuid ? await fromUuid(guidedTest.actorUuid).catch(() => null) : null;
  const canCreate = Boolean(game.user.isGM || actor?.isOwner);

  const section = document.createElement("section");
  section.className = "dune-qol-complication-resolution";
  section.innerHTML = buildComplicationSectionHtml(summary, canCreate);
  card.append(section);

  const button = section.querySelector(`[data-dune-qol-action="${CREATE_ACTION}"]`);
  if (!(button instanceof HTMLButtonElement)) return;

  button.addEventListener("click", async (event) => {
    event.preventDefault();
    button.disabled = true;
    try {
      await openCreateTraitDialog(message.id);
    } finally {
      button.disabled = false;
    }
  });
}

async function openCreateTraitDialog(messageId) {
  const message = game.messages.get(messageId);
  const guidedTest = message?.getFlag(MODULE_ID, "guidedTest");
  const actor = guidedTest?.actorUuid ? await fromUuid(guidedTest.actorUuid).catch(() => null) : null;

  if (!message || !actor) {
    ui.notifications.error(localize("DUNEQOL.Complications.Errors.SourceMissing"));
    return;
  }

  if (!(game.user.isGM || actor.isOwner)) {
    ui.notifications.error(localize("DUNEQOL.Complications.Errors.NotAllowed"));
    return;
  }

  const summary = summarizeComplicationResolution({
    complications: guidedTest.complications,
    createdTraits: guidedTest.complicationResolution?.createdTraits
  });
  if (summary.remaining < 1) {
    ui.notifications.info(localize("DUNEQOL.Complications.Errors.AlreadyResolved"));
    return;
  }

  const DialogV2 = foundry.applications.api.DialogV2;
  const dialog = new DialogV2({
    window: {
      title: format("DUNEQOL.Complications.DialogTitle", { actor: actor.name })
    },
    position: {
      width: 460
    },
    content: `
      <div class="dune-qol-complication-dialog">
        <p>${escapeHtml(format("DUNEQOL.Complications.DialogContext", {
          remaining: summary.remaining,
          total: summary.total
        }))}</p>
        <label>
          <span>${escapeHtml(localize("DUNEQOL.Complications.TraitName"))}</span>
          <input name="traitName" type="text" maxlength="120" required autofocus>
        </label>
        <label class="dune-qol-checkbox">
          <input name="temporary" type="checkbox" checked>
          <span>${escapeHtml(localize("DUNEQOL.Complications.Temporary"))}</span>
        </label>
        <p class="hint">${escapeHtml(localize("DUNEQOL.Complications.TemporaryHint"))}</p>
      </div>
    `,
    buttons: [
      {
        action: "create",
        label: localize("DUNEQOL.Complications.Create"),
        icon: "fa-solid fa-triangle-exclamation",
        default: true,
        callback: async (_event, button) => {
          if (!button.form.reportValidity()) return false;
          const formData = new FormData(button.form);
          await requestTraitCreation({
            messageId,
            name: String(formData.get("traitName") ?? "").trim(),
            temporary: formData.has("temporary")
          });
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
}

async function requestTraitCreation({ messageId, name, temporary }) {
  if (!name) {
    ui.notifications.error(localize("DUNEQOL.Complications.Errors.NameRequired"));
    return;
  }

  if (game.user.isGM) {
    try {
      await createComplicationTrait({
        messageId,
        requestedBy: game.user.id,
        name,
        temporary
      });
    } catch (error) {
      reportCreationError(error);
    }
    return;
  }

  const gm = primaryActiveGM();
  if (!gm) {
    ui.notifications.error(localize("DUNEQOL.Complications.Errors.NoActiveGM"));
    return;
  }

  const requestId = foundry.utils.randomID();
  game.socket.emit(SOCKET_NAME, {
    type: "create-complication-trait",
    requestId,
    messageId,
    requestedBy: game.user.id,
    name,
    temporary: Boolean(temporary)
  });
  ui.notifications.info(localize("DUNEQOL.Complications.RequestSent"));
}

async function handleSocketMessage(payload) {
  if (!payload || typeof payload !== "object") return;

  if (payload.type === "create-complication-trait") {
    const gm = primaryActiveGM();
    if (!game.user.isGM || gm?.id !== game.user.id) return;

    let result;
    try {
      const created = await createComplicationTrait({
        messageId: payload.messageId,
        requestedBy: payload.requestedBy,
        name: String(payload.name ?? "").trim(),
        temporary: Boolean(payload.temporary)
      });
      result = {
        type: "complication-trait-result",
        requestId: payload.requestId,
        requestedBy: payload.requestedBy,
        success: true,
        traitName: created.name
      };
    } catch (error) {
      console.error("Dune QoL | Complication Trait request failed.", error);
      result = {
        type: "complication-trait-result",
        requestId: payload.requestId,
        requestedBy: payload.requestedBy,
        success: false,
        message: error instanceof Error ? error.message : String(error)
      };
    }

    game.socket.emit(SOCKET_NAME, result);
    return;
  }

  if (payload.type === "complication-trait-result" && payload.requestedBy === game.user.id) {
    if (payload.success) {
      ui.notifications.info(
        format("DUNEQOL.Complications.Created", { name: payload.traitName })
      );
    } else {
      ui.notifications.error(
        format("DUNEQOL.Complications.Errors.CreationFailed", {
          message: payload.message ?? localize("DUNEQOL.Complications.Errors.Unknown")
        })
      );
    }
  }
}

async function createComplicationTrait({ messageId, requestedBy, name, temporary }) {
  if (!name) throw new Error(localize("DUNEQOL.Complications.Errors.NameRequired"));
  if (activeCreations.has(messageId)) {
    throw new Error(localize("DUNEQOL.Complications.Errors.AlreadyProcessing"));
  }

  activeCreations.add(messageId);
  try {
    const message = game.messages.get(messageId);
    const guidedTest = message?.getFlag(MODULE_ID, "guidedTest");
    if (!message || !guidedTest?.actorUuid) {
      throw new Error(localize("DUNEQOL.Complications.Errors.SourceMissing"));
    }

    const actor = await fromUuid(guidedTest.actorUuid).catch(() => null);
    const requester = game.users.get(requestedBy);
    if (!actor || !requester) {
      throw new Error(localize("DUNEQOL.Complications.Errors.SourceMissing"));
    }

    if (!(requester.isGM || actor.testUserPermission(requester, "OWNER"))) {
      throw new Error(localize("DUNEQOL.Complications.Errors.NotAllowed"));
    }

    const currentTraits = guidedTest.complicationResolution?.createdTraits ?? [];
    const summary = summarizeComplicationResolution({
      complications: guidedTest.complications,
      createdTraits: currentTraits
    });
    if (summary.remaining < 1) {
      throw new Error(localize("DUNEQOL.Complications.Errors.AlreadyResolved"));
    }

    const createdAt = new Date().toISOString();
    const createdItems = await actor.createEmbeddedDocuments("Item", [
      {
        name,
        type: "trait",
        system: {
          temporary: Boolean(temporary)
        },
        flags: {
          [MODULE_ID]: {
            complicationTrait: {
              version: 1,
              sourceMessageUuid: message.uuid,
              createdBy: requestedBy,
              createdAt
            }
          }
        }
      }
    ]);

    const item = createdItems?.[0];
    if (!item) {
      throw new Error(localize("DUNEQOL.Complications.Errors.ItemNotCreated"));
    }

    const record = {
      uuid: item.uuid,
      id: item.id,
      name: item.name,
      temporary: Boolean(item.system?.temporary),
      createdBy: requestedBy,
      createdAt
    };

    try {
      const updatedGuidedTest = foundry.utils.deepClone(guidedTest);
      updatedGuidedTest.version = Math.max(Number(updatedGuidedTest.version ?? 0), 3);
      updatedGuidedTest.complicationResolution = {
        version: 1,
        createdTraits: appendCreatedComplicationTrait({
          complications: guidedTest.complications,
          createdTraits: currentTraits,
          trait: record
        })
      };
      await message.setFlag(MODULE_ID, "guidedTest", updatedGuidedTest);
    } catch (error) {
      await actor.deleteEmbeddedDocuments("Item", [item.id]).catch((rollbackError) => {
        console.error("Dune QoL | Failed to roll back complication Trait creation.", rollbackError);
      });
      throw error;
    }

    try {
      await createHistoryMessage({ message, actor, requester, item, temporary });
    } catch (historyError) {
      console.error("Dune QoL | Trait created, but history message failed.", historyError);
    }

    ui.notifications.info(format("DUNEQOL.Complications.Created", { name: item.name }));
    return item;
  } finally {
    activeCreations.delete(messageId);
  }
}

async function createHistoryMessage({ message, actor, requester, item, temporary }) {
  const content = `
    <section class="dune-qol-complication-history">
      <header><strong>${escapeHtml(localize("DUNEQOL.Complications.HistoryTitle"))}</strong></header>
      <p>${escapeHtml(format("DUNEQOL.Complications.HistoryContext", {
        user: requester.name,
        actor: actor.name
      }))}</p>
      <p><strong>${escapeHtml(item.name)}</strong></p>
      <p class="hint">${escapeHtml(temporary
        ? localize("DUNEQOL.Complications.Temporary")
        : localize("DUNEQOL.Complications.Persistent"))}</p>
    </section>
  `;

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content,
    flags: {
      [MODULE_ID]: {
        complicationTrait: {
          version: 1,
          sourceMessageUuid: message.uuid,
          actorUuid: actor.uuid,
          itemUuid: item.uuid,
          requestedBy: requester.id,
          createdBy: game.user.id,
          temporary: Boolean(temporary)
        }
      }
    }
  });
}

function buildComplicationSectionHtml(summary, canCreate) {
  const names = summary.createdTraits
    .map((trait) => `<li>${escapeHtml(trait.name ?? trait.uuid)}</li>`)
    .join("");

  return `
    <strong>${escapeHtml(localize("DUNEQOL.Complications.Title"))}</strong>
    <p>${escapeHtml(format("DUNEQOL.Complications.Progress", {
      resolved: summary.resolved,
      total: summary.total,
      remaining: summary.remaining
    }))}</p>
    ${names ? `<ul>${names}</ul>` : ""}
    ${summary.remaining > 0 && canCreate
      ? `<button type="button" data-dune-qol-action="${CREATE_ACTION}">
          <i class="fa-solid fa-triangle-exclamation"></i>
          ${escapeHtml(localize("DUNEQOL.Complications.Create"))}
        </button>`
      : ""}
    ${summary.complete
      ? `<p class="dune-qol-complication-resolution__complete">
          <i class="fa-solid fa-check"></i>
          ${escapeHtml(localize("DUNEQOL.Complications.Complete"))}
        </p>`
      : ""}
  `;
}

function reportCreationError(error) {
  console.error("Dune QoL | Complication Trait creation failed.", error);
  ui.notifications.error(
    format("DUNEQOL.Complications.Errors.CreationFailed", {
      message: error instanceof Error ? error.message : String(error)
    })
  );
}

function primaryActiveGM() {
  return game.users
    .filter((user) => user.active && user.isGM)
    .sort((left, right) => left.id.localeCompare(right.id))[0] ?? null;
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
