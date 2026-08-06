import { format, localize } from "../localization.mjs";

const MODULE_ID = "dune-qol";
const SOCKET_NAME = `module.${MODULE_ID}`;
const SHEET_ACTION = "manage-temporary-traits";
const REQUEST_TYPE = "manage-temporary-traits";
const RESULT_TYPE = "temporary-traits-result";
const ACTIONS = new Set(["promote", "delete"]);
const activeOperations = new Set();

export function registerTemporaryTraitHooks() {
  Hooks.once("ready", () => {
    game.socket.on(SOCKET_NAME, handleSocketMessage);
  });

  Hooks.on("renderActorSheet", (application, html) => {
    if (game.system.id !== "dune") return;

    const actor = application.actor ?? application.document;
    if (!actor?.items || !(game.user.isGM || actor.isOwner)) return;

    addTemporaryTraitButton(application, html, actor);
  });
}

function addTemporaryTraitButton(application, html, actor) {
  const root = getHtmlRoot(html);
  const header = root?.querySelector(".window-header");
  if (!header || header.querySelector(`[data-dune-qol-action="${SHEET_ACTION}"]`)) return;

  const button = document.createElement("a");
  button.className = "header-button dune-qol-sheet-launcher";
  button.dataset.duneQolAction = SHEET_ACTION;
  button.setAttribute("role", "button");
  button.title = localize("DUNEQOL.TemporaryTraits.SheetButtonTitle");
  button.innerHTML = `<i class="fa-solid fa-tags"></i> ${escapeHtml(localize("DUNEQOL.TemporaryTraits.SheetButton"))}`;
  button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    void openTemporaryTraitManager(actor);
  }, { capture: true });

  const requestButton = header.querySelector('[data-dune-qol-action="request-guided-test"]');
  const guidedButton = header.querySelector('[data-dune-qol-action="dune-qol-guided-test"]');
  const closeButton = header.querySelector(".close");
  header.insertBefore(button, requestButton ?? guidedButton ?? closeButton ?? null);

  console.debug(
    `Dune QoL | Added temporary-Trait manager to Actor sheet '${application.id ?? actor.name}'.`
  );
}

async function openTemporaryTraitManager(actor) {
  try {
    if (!(game.user.isGM || actor.isOwner)) {
      ui.notifications.error(localize("DUNEQOL.TemporaryTraits.Errors.NotAllowed"));
      return;
    }

    const traits = getTemporaryTraits(actor);
    const DialogV2 = foundry.applications.api.DialogV2;
    if (!DialogV2) {
      throw new Error(localize("DUNEQOL.GuidedTest.Errors.DialogUnavailable"));
    }

    const buttons = traits.length > 0
      ? [
          {
            action: "promote",
            label: localize("DUNEQOL.TemporaryTraits.Promote"),
            icon: "fa-solid fa-thumbtack",
            default: true,
            callback: async (_event, button) => {
              const ids = selectedTraitIds(new FormData(button.form));
              if (ids.length === 0) {
                ui.notifications.warn(localize("DUNEQOL.TemporaryTraits.Errors.NoSelection"));
                return false;
              }
              await requestTemporaryTraitAction({ actorUuid: actor.uuid, itemIds: ids, action: "promote" });
              return true;
            }
          },
          {
            action: "delete",
            label: localize("DUNEQOL.TemporaryTraits.Delete"),
            icon: "fa-solid fa-trash",
            callback: async (_event, button) => {
              const ids = selectedTraitIds(new FormData(button.form));
              if (ids.length === 0) {
                ui.notifications.warn(localize("DUNEQOL.TemporaryTraits.Errors.NoSelection"));
                return false;
              }
              await requestTemporaryTraitAction({ actorUuid: actor.uuid, itemIds: ids, action: "delete" });
              return true;
            }
          },
          {
            action: "cancel",
            label: localize("DUNEQOL.Cancel"),
            icon: "fa-solid fa-xmark"
          }
        ]
      : [
          {
            action: "close",
            label: localize("DUNEQOL.Close"),
            icon: "fa-solid fa-xmark",
            default: true
          }
        ];

    const dialog = new DialogV2({
      window: {
        title: format("DUNEQOL.TemporaryTraits.Title", { actor: actor.name })
      },
      position: {
        width: 560
      },
      content: buildManagerContent(actor, traits),
      buttons
    });

    await dialog.render({ force: true });
  } catch (error) {
    reportActionError(error);
  }
}

async function requestTemporaryTraitAction({ actorUuid, itemIds, action }) {
  if (!ACTIONS.has(action)) {
    throw new Error(localize("DUNEQOL.TemporaryTraits.Errors.InvalidAction"));
  }

  if (game.user.isGM) {
    const result = await executeTemporaryTraitAction({
      actorUuid,
      itemIds,
      action,
      requestedBy: game.user.id
    });
    notifySuccess(result);
    return;
  }

  const gm = primaryActiveGM();
  if (!gm) {
    throw new Error(localize("DUNEQOL.TemporaryTraits.Errors.NoActiveGM"));
  }

  game.socket.emit(SOCKET_NAME, {
    type: REQUEST_TYPE,
    requestId: foundry.utils.randomID(),
    actorUuid,
    itemIds,
    action,
    requestedBy: game.user.id
  });
  ui.notifications.info(localize("DUNEQOL.TemporaryTraits.RequestSent"));
}

async function handleSocketMessage(payload) {
  if (!payload || typeof payload !== "object") return;

  if (payload.type === REQUEST_TYPE) {
    const gm = primaryActiveGM();
    if (!game.user.isGM || gm?.id !== game.user.id) return;

    let response;
    try {
      const result = await executeTemporaryTraitAction({
        actorUuid: payload.actorUuid,
        itemIds: Array.isArray(payload.itemIds) ? payload.itemIds : [],
        action: payload.action,
        requestedBy: payload.requestedBy
      });
      response = {
        type: RESULT_TYPE,
        requestId: payload.requestId,
        requestedBy: payload.requestedBy,
        success: true,
        action: result.action,
        count: result.count
      };
    } catch (error) {
      console.error("Dune QoL | Temporary-Trait request failed.", error, payload);
      response = {
        type: RESULT_TYPE,
        requestId: payload.requestId,
        requestedBy: payload.requestedBy,
        success: false,
        message: error instanceof Error ? error.message : String(error)
      };
    }

    game.socket.emit(SOCKET_NAME, response);
    return;
  }

  if (payload.type === RESULT_TYPE && payload.requestedBy === game.user.id) {
    if (payload.success) {
      notifySuccess(payload);
    } else {
      ui.notifications.error(
        format("DUNEQOL.TemporaryTraits.Errors.ActionFailed", {
          message: payload.message ?? localize("DUNEQOL.TemporaryTraits.Errors.Unknown")
        })
      );
    }
  }
}

async function executeTemporaryTraitAction({ actorUuid, itemIds, action, requestedBy }) {
  if (!ACTIONS.has(action)) {
    throw new Error(localize("DUNEQOL.TemporaryTraits.Errors.InvalidAction"));
  }

  const uniqueIds = [...new Set(itemIds.map(String).filter(Boolean))];
  if (uniqueIds.length === 0) {
    throw new Error(localize("DUNEQOL.TemporaryTraits.Errors.NoSelection"));
  }

  const operationKey = `${actorUuid}:${action}`;
  if (activeOperations.has(operationKey)) {
    throw new Error(localize("DUNEQOL.TemporaryTraits.Errors.AlreadyProcessing"));
  }

  activeOperations.add(operationKey);
  try {
    const actor = actorUuid ? await fromUuid(actorUuid).catch(() => null) : null;
    const requester = game.users.get(requestedBy);
    if (!actor || !requester) {
      throw new Error(localize("DUNEQOL.TemporaryTraits.Errors.ActorUnavailable"));
    }

    if (!(requester.isGM || actor.testUserPermission(requester, "OWNER"))) {
      throw new Error(localize("DUNEQOL.TemporaryTraits.Errors.NotAllowed"));
    }

    const traits = uniqueIds.map((id) => actor.items.get(id));
    const valid = traits.every((item) =>
      item?.type === "trait" && item.system?.temporary === true
    );
    if (!valid) {
      throw new Error(localize("DUNEQOL.TemporaryTraits.Errors.InvalidItems"));
    }

    const snapshots = traits.map((item) => ({
      id: item.id,
      uuid: item.uuid,
      name: item.name,
      source: item.getFlag(MODULE_ID, "complicationTrait") ?? null
    }));
    const changedAt = new Date().toISOString();

    if (action === "promote") {
      await actor.updateEmbeddedDocuments(
        "Item",
        snapshots.map((item) => ({
          _id: item.id,
          "system.temporary": false
        }))
      );
    } else {
      await actor.deleteEmbeddedDocuments("Item", snapshots.map((item) => item.id));
    }

    await updateSourceRecords({ snapshots, action, requestedBy, changedAt });

    try {
      await createHistoryMessage({
        actor,
        requester,
        snapshots,
        action,
        changedAt
      });
    } catch (historyError) {
      console.error("Dune QoL | Temporary Traits changed, but history creation failed.", historyError);
    }

    return {
      action,
      count: snapshots.length
    };
  } finally {
    activeOperations.delete(operationKey);
  }
}

async function updateSourceRecords({ snapshots, action, requestedBy, changedAt }) {
  const grouped = new Map();

  for (const snapshot of snapshots) {
    const sourceMessageUuid = snapshot.source?.sourceMessageUuid;
    if (!sourceMessageUuid) continue;
    const group = grouped.get(sourceMessageUuid) ?? [];
    group.push(snapshot);
    grouped.set(sourceMessageUuid, group);
  }

  for (const [sourceMessageUuid, items] of grouped) {
    try {
      const message = await fromUuid(sourceMessageUuid).catch(() => null);
      const guidedTest = message?.getFlag?.(MODULE_ID, "guidedTest");
      const records = guidedTest?.complicationResolution?.createdTraits;
      if (!message || !guidedTest || !Array.isArray(records)) continue;

      const updated = foundry.utils.deepClone(guidedTest);
      updated.version = Math.max(Number(updated.version) || 0, 5);
      updated.complicationResolution = {
        ...(updated.complicationResolution ?? {}),
        createdTraits: records.map((record) => {
          const item = items.find((candidate) =>
            candidate.uuid === record.uuid || candidate.id === record.id
          );
          if (!item) return record;

          return action === "promote"
            ? {
                ...record,
                temporary: false,
                promotedAt: changedAt,
                promotedBy: requestedBy
              }
            : {
                ...record,
                deletedAt: changedAt,
                deletedBy: requestedBy
              };
        })
      };

      await message.setFlag(MODULE_ID, "guidedTest", updated);
    } catch (error) {
      console.error("Dune QoL | Failed to update complication-Trait provenance.", {
        error,
        sourceMessageUuid,
        action
      });
    }
  }
}

async function createHistoryMessage({ actor, requester, snapshots, action, changedAt }) {
  const actionLabel = action === "promote"
    ? localize("DUNEQOL.TemporaryTraits.HistoryPromoted")
    : localize("DUNEQOL.TemporaryTraits.HistoryDeleted");
  const names = snapshots
    .map((item) => `<li>${escapeHtml(item.name)}</li>`)
    .join("");

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: `
      <section class="dune-qol-temporary-trait-history">
        <header><strong>${escapeHtml(localize("DUNEQOL.TemporaryTraits.HistoryTitle"))}</strong></header>
        <p>${escapeHtml(format("DUNEQOL.TemporaryTraits.HistoryContext", {
          user: requester.name,
          actor: actor.name
        }))}</p>
        <p><strong>${escapeHtml(actionLabel)}</strong></p>
        <ul>${names}</ul>
      </section>
    `,
    flags: {
      [MODULE_ID]: {
        temporaryTraitManagement: {
          version: 1,
          actorUuid: actor.uuid,
          requestedBy: requester.id,
          executedBy: game.user.id,
          action,
          changedAt,
          items: snapshots.map((item) => ({
            id: item.id,
            uuid: item.uuid,
            name: item.name
          }))
        }
      }
    }
  });
}

function buildManagerContent(actor, traits) {
  if (traits.length === 0) {
    return `
      <div class="dune-qol-temporary-traits-dialog">
        <p><strong>${escapeHtml(actor.name)}</strong></p>
        <p>${escapeHtml(localize("DUNEQOL.TemporaryTraits.Empty"))}</p>
      </div>
    `;
  }

  const rows = traits.map((item) => {
    const generated = Boolean(item.getFlag(MODULE_ID, "complicationTrait"));
    return `
      <label class="dune-qol-temporary-trait-row">
        <input type="checkbox" name="traitIds" value="${escapeHtml(item.id)}">
        <span class="dune-qol-temporary-trait-row__name">${escapeHtml(item.name)}</span>
        ${generated
          ? `<span class="dune-qol-temporary-trait-row__source">${escapeHtml(localize("DUNEQOL.TemporaryTraits.FromComplication"))}</span>`
          : ""}
      </label>
    `;
  }).join("");

  return `
    <div class="dune-qol-temporary-traits-dialog">
      <p><strong>${escapeHtml(actor.name)}</strong></p>
      <p class="hint">${escapeHtml(localize("DUNEQOL.TemporaryTraits.Hint"))}</p>
      <div class="dune-qol-temporary-trait-list">${rows}</div>
      <p class="hint dune-qol-temporary-traits-dialog__warning">
        <i class="fa-solid fa-triangle-exclamation"></i>
        ${escapeHtml(localize("DUNEQOL.TemporaryTraits.DeleteHint"))}
      </p>
    </div>
  `;
}

function getTemporaryTraits(actor) {
  return actor.items
    .filter((item) => item.type === "trait" && item.system?.temporary === true)
    .sort((left, right) => left.name.localeCompare(right.name));
}

function selectedTraitIds(formData) {
  return formData.getAll("traitIds").map(String).filter(Boolean);
}

function notifySuccess(result) {
  const key = result.action === "promote"
    ? "DUNEQOL.TemporaryTraits.Promoted"
    : "DUNEQOL.TemporaryTraits.Deleted";
  ui.notifications.info(format(key, { count: result.count }));
}

function reportActionError(error) {
  console.error("Dune QoL | Temporary-Trait management failed.", error);
  ui.notifications.error(
    format("DUNEQOL.TemporaryTraits.Errors.ActionFailed", {
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
