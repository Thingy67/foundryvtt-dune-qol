import { readDunePools } from "../adapters/dune-pools.mjs";
import { safelyOpenGuidedTest } from "../features/guided-test.mjs";
import { format, localize } from "../localization.mjs";

const MODULE_ID = "dune-qol";
const PARTY_DATA_SETTING = "partyData";
const CONTROL_NAME = "dune-qol-party-sheet";
const APP_ID = "dune-qol-party-sheet";
const REQUEST_FLAG = "testRequest";
const INBOX_FLAG = "testRequestInbox";
const activeTraitOperations = new Set();
let partySheet = null;
let rerenderTimer = null;

export function registerPartySheetHooks() {
  Hooks.on("getSceneControlButtons", (controls) => {
    if (game.system.id !== "dune" || !controls.tokens?.tools) return;

    controls.tokens.tools[CONTROL_NAME] = {
      name: CONTROL_NAME,
      title: localize("DUNEQOL.PartySheet.Control"),
      icon: "fa-solid fa-people-group",
      order: Object.keys(controls.tokens.tools).length,
      button: true,
      visible: true,
      onChange: () => void openPartySheet()
    };
  });

  for (const hookName of [
    "createActor",
    "updateActor",
    "deleteActor",
    "createItem",
    "updateItem",
    "deleteItem",
    "createChatMessage",
    "updateChatMessage",
    "deleteChatMessage",
    "updateUser"
  ]) {
    Hooks.on(hookName, schedulePartySheetRender);
  }
}

export async function openPartySheet() {
  try {
    if (partySheet?.rendered) {
      partySheet.bringToFront();
      await partySheet.render({ force: false });
      return partySheet;
    }

    partySheet = new PartySheetApplication({
      window: {
        title: localize("DUNEQOL.PartySheet.Title")
      }
    });
    partySheet.addEventListener("close", () => {
      partySheet = null;
    });
    await partySheet.render({ force: true });
    return partySheet;
  } catch (error) {
    reportError("Dune QoL | Party Sheet failed to open.", error);
    return null;
  }
}

function schedulePartySheetRender() {
  if (!partySheet?.rendered) return;
  clearTimeout(rerenderTimer);
  rerenderTimer = setTimeout(() => {
    void partySheet?.render({ force: false });
  }, 100);
}

class PartySheetApplication extends foundry.applications.api.ApplicationV2 {
  static DEFAULT_OPTIONS = {
    id: APP_ID,
    classes: ["dune-qol-party-sheet-window"],
    tag: "section",
    window: {
      frame: true,
      positioned: true,
      minimizable: true,
      resizable: true
    },
    position: {
      width: 1050,
      height: 780
    }
  };

  activeTab = "overview";

  async _renderHTML() {
    const model = await buildPartyModel();
    return buildPartySheetHtml(model, this.activeTab);
  }

  _replaceHTML(result, content) {
    content.innerHTML = result;
  }

  async _onRender(context, options) {
    await super._onRender(context, options);
    configurePartySheet(this);
  }
}

async function buildPartyModel() {
  const data = normalizePartyData(game.settings.get(MODULE_ID, PARTY_DATA_SETTING));
  const roster = buildPartyRoster(data);
  const requests = buildRequestHistory();
  let pools = null;
  try {
    pools = await readDunePools();
  } catch (error) {
    console.warn("Dune QoL | Party Sheet could not read shared pools.", error);
  }

  return {
    canEdit: Boolean(game.user.isGM),
    data,
    roster,
    requests,
    pools
  };
}

function buildPartyRoster(data) {
  const entries = new Map();

  for (const user of game.users.filter((candidate) => !candidate.isGM)) {
    for (const actor of game.actors.filter((candidate) =>
      isSupportedActor(candidate) && candidate.testUserPermission(user, "OWNER")
    )) {
      const entry = entries.get(actor.uuid) ?? {
        actor,
        owners: [],
        primaryFor: []
      };
      if (!entry.owners.some((owner) => owner.id === user.id)) entry.owners.push(user);
      if (user.character?.id === actor.id) entry.primaryFor.push(user);
      entries.set(actor.uuid, entry);
    }
  }

  return [...entries.values()]
    .map((entry) => {
      const actorMeta = data.actorMeta[entry.actor.uuid] ?? {};
      const automaticKind = entry.primaryFor.length > 0 ? "primary" : "secondary";
      const traits = entry.actor.items
        .filter((item) => item.type === "trait")
        .sort((left, right) => left.name.localeCompare(right.name));

      return {
        ...entry,
        owners: entry.owners.sort((left, right) => left.name.localeCompare(right.name)),
        kind: actorMeta.kind === "primary" || actorMeta.kind === "secondary"
          ? actorMeta.kind
          : automaticKind,
        role: String(actorMeta.role ?? ""),
        resources: extractActorResources(entry.actor),
        traits
      };
    })
    .sort((left, right) => {
      if (left.kind !== right.kind) return left.kind === "primary" ? -1 : 1;
      return left.actor.name.localeCompare(right.actor.name);
    });
}

function buildRequestHistory() {
  return game.messages
    .map((message) => ({
      message,
      request: message.getFlag(MODULE_ID, REQUEST_FLAG)
    }))
    .filter((entry) => Boolean(entry.request))
    .filter(({ request }) => game.user.isGM || request.recipientUserId === game.user.id)
    .map(({ message, request }) => ({
      message,
      request,
      recipient: game.users.get(request.recipientUserId) ?? null,
      actor: request.actorUuid ? fromUuidSync(request.actorUuid) : null,
      result: request.resultMessageId ? game.messages.get(request.resultMessageId) ?? null : null
    }))
    .sort((left, right) => String(right.request.createdAt ?? "").localeCompare(String(left.request.createdAt ?? "")));
}

function configurePartySheet(application) {
  const root = application.element.querySelector(".dune-qol-party-sheet");
  if (!root) return;

  for (const button of root.querySelectorAll("[data-party-tab]")) {
    button.addEventListener("click", () => {
      application.activeTab = button.dataset.partyTab;
      void application.render({ force: false });
    });
  }

  root.querySelector("[data-party-action='refresh']")?.addEventListener("click", () => {
    void application.render({ force: false });
  });

  root.querySelector("[data-party-action='save']")?.addEventListener("click", () => {
    void savePartyData(root, application);
  });

  for (const button of root.querySelectorAll("[data-open-actor]")) {
    button.addEventListener("click", async () => {
      const actor = await fromUuid(button.dataset.openActor).catch(() => null);
      actor?.sheet?.render(true);
    });
  }

  for (const button of root.querySelectorAll("[data-roll-actor]")) {
    button.addEventListener("click", async () => {
      const actor = await fromUuid(button.dataset.rollActor).catch(() => null);
      if (actor) await safelyOpenGuidedTest(actor);
    });
  }

  for (const button of root.querySelectorAll("[data-select-actor-token]")) {
    button.addEventListener("click", async () => {
      await selectActorToken(button.dataset.selectActorToken);
    });
  }

  root.querySelector("[data-party-action='promote-traits']")?.addEventListener("click", () => {
    void executeSelectedTraitAction(root, application, "promote");
  });

  root.querySelector("[data-party-action='delete-traits']")?.addEventListener("click", () => {
    void confirmAndDeleteSelectedTraits(root, application);
  });

  for (const button of root.querySelectorAll("[data-open-chat-message]")) {
    button.addEventListener("click", () => revealChatMessage(button.dataset.openChatMessage));
  }

  for (const button of root.querySelectorAll("[data-cancel-request]")) {
    button.addEventListener("click", () => {
      void cancelRequest(button.dataset.cancelRequest, application);
    });
  }

  const requestFilter = root.querySelector("[name='requestStatusFilter']");
  requestFilter?.addEventListener("change", () => filterRequestRows(root, requestFilter.value));
}

async function savePartyData(root, application) {
  if (!game.user.isGM) return;

  const current = normalizePartyData(game.settings.get(MODULE_ID, PARTY_DATA_SETTING));
  const actorMeta = { ...current.actorMeta };

  for (const card of root.querySelectorAll("[data-party-actor-meta]")) {
    const actorUuid = card.dataset.partyActorMeta;
    const kind = card.querySelector("[name='actorKind']")?.value;
    const role = String(card.querySelector("[name='actorRole']")?.value ?? "").trim().slice(0, 120);
    actorMeta[actorUuid] = {
      kind: kind === "secondary" ? "secondary" : "primary",
      role
    };
  }

  const updated = {
    version: 1,
    houseName: fieldValue(root, "houseName", 120),
    houseInfo: fieldValue(root, "houseInfo", 2000),
    globalStatus: fieldValue(root, "globalStatus", 500),
    groupNotes: fieldValue(root, "groupNotes", 4000),
    objectives: fieldValue(root, "objectives", 4000),
    actorMeta
  };

  await game.settings.set(MODULE_ID, PARTY_DATA_SETTING, updated);
  ui.notifications.info(localize("DUNEQOL.PartySheet.Saved"));
  await application.render({ force: false });
}

async function executeSelectedTraitAction(root, application, action) {
  if (!game.user.isGM) return;
  const selected = selectedTraits(root);
  if (selected.length === 0) {
    ui.notifications.warn(localize("DUNEQOL.PartySheet.Traits.NoSelection"));
    return;
  }

  const eligible = action === "promote"
    ? selected.filter((entry) => entry.temporary)
    : selected;
  if (eligible.length === 0) {
    ui.notifications.warn(localize("DUNEQOL.PartySheet.Traits.NoTemporarySelection"));
    return;
  }

  const operationId = `${action}:${eligible.map((entry) => `${entry.actorUuid}.${entry.itemId}`).sort().join(",")}`;
  if (activeTraitOperations.has(operationId)) return;
  activeTraitOperations.add(operationId);

  try {
    const grouped = new Map();
    for (const entry of eligible) {
      const entries = grouped.get(entry.actorUuid) ?? [];
      entries.push(entry);
      grouped.set(entry.actorUuid, entries);
    }
    const history = [];

    for (const [actorUuid, entries] of grouped) {
      const actor = await fromUuid(actorUuid).catch(() => null);
      if (!actor) continue;
      const items = entries.map((entry) => actor.items.get(entry.itemId)).filter((item) => item?.type === "trait");
      if (items.length === 0) continue;

      if (action === "promote") {
        await actor.updateEmbeddedDocuments("Item", items
          .filter((item) => item.system?.temporary === true)
          .map((item) => ({ _id: item.id, "system.temporary": false })));
      } else {
        await actor.deleteEmbeddedDocuments("Item", items.map((item) => item.id));
      }

      await updateTraitProvenance(items, action);
      history.push({ actor, items });
    }

    await createPartyTraitHistory(history, action);
    ui.notifications.info(format(
      action === "promote"
        ? "DUNEQOL.PartySheet.Traits.Promoted"
        : "DUNEQOL.PartySheet.Traits.Deleted",
      { count: eligible.length }
    ));
    await application.render({ force: false });
  } catch (error) {
    reportError("Dune QoL | Party Trait batch action failed.", error);
  } finally {
    activeTraitOperations.delete(operationId);
  }
}

async function confirmAndDeleteSelectedTraits(root, application) {
  const selected = selectedTraits(root);
  if (selected.length === 0) {
    ui.notifications.warn(localize("DUNEQOL.PartySheet.Traits.NoSelection"));
    return;
  }

  const confirmed = await foundry.applications.api.DialogV2.confirm({
    window: { title: localize("DUNEQOL.PartySheet.Traits.DeleteTitle") },
    content: `<p>${escapeHtml(format("DUNEQOL.PartySheet.Traits.DeleteConfirm", { count: selected.length }))}</p>`,
    yes: { label: localize("DUNEQOL.TemporaryTraits.Delete"), icon: "fa-solid fa-trash" },
    no: { label: localize("DUNEQOL.Cancel"), icon: "fa-solid fa-xmark" }
  });
  if (!confirmed) return;
  await executeSelectedTraitAction(root, application, "delete");
}

async function updateTraitProvenance(items, action) {
  const changedAt = new Date().toISOString();
  const grouped = new Map();

  for (const item of items) {
    const source = item.getFlag(MODULE_ID, "complicationTrait");
    if (!source?.sourceMessageUuid) continue;
    const list = grouped.get(source.sourceMessageUuid) ?? [];
    list.push(item);
    grouped.set(source.sourceMessageUuid, list);
  }

  for (const [sourceMessageUuid, sourceItems] of grouped) {
    try {
      const message = await fromUuid(sourceMessageUuid).catch(() => null);
      const guidedTest = message?.getFlag?.(MODULE_ID, "guidedTest");
      const records = guidedTest?.complicationResolution?.createdTraits;
      if (!message || !guidedTest || !Array.isArray(records)) continue;

      const updated = foundry.utils.deepClone(guidedTest);
      updated.complicationResolution = {
        ...(updated.complicationResolution ?? {}),
        createdTraits: records.map((record) => {
          const item = sourceItems.find((candidate) => candidate.uuid === record.uuid || candidate.id === record.id);
          if (!item) return record;
          return action === "promote"
            ? { ...record, temporary: false, promotedAt: changedAt, promotedBy: game.user.id }
            : { ...record, deletedAt: changedAt, deletedBy: game.user.id };
        })
      };
      await message.setFlag(MODULE_ID, "guidedTest", updated);
    } catch (error) {
      console.error("Dune QoL | Party Trait provenance update failed.", error);
    }
  }
}

async function createPartyTraitHistory(groups, action) {
  if (groups.length === 0) return;
  const rows = groups.map(({ actor, items }) => `
    <li><strong>${escapeHtml(actor.name)}</strong>: ${items.map((item) => escapeHtml(item.name)).join(", ")}</li>
  `).join("");

  await ChatMessage.create({
    content: `
      <section class="dune-qol-party-trait-history">
        <header><strong>${escapeHtml(localize("DUNEQOL.PartySheet.Traits.HistoryTitle"))}</strong></header>
        <p>${escapeHtml(action === "promote"
          ? localize("DUNEQOL.PartySheet.Traits.HistoryPromoted")
          : localize("DUNEQOL.PartySheet.Traits.HistoryDeleted"))}</p>
        <ul>${rows}</ul>
      </section>
    `,
    flags: {
      [MODULE_ID]: {
        partyTraitManagement: {
          version: 1,
          action,
          changedAt: new Date().toISOString(),
          changedBy: game.user.id,
          actors: groups.map(({ actor, items }) => ({
            actorUuid: actor.uuid,
            items: items.map((item) => ({ id: item.id, uuid: item.uuid, name: item.name }))
          }))
        }
      }
    }
  });
}

async function cancelRequest(messageId, application) {
  if (!game.user.isGM) return;
  const message = game.messages.get(messageId);
  const request = message?.getFlag(MODULE_ID, REQUEST_FLAG);
  if (!message || !request || request.status !== "pending") return;

  const canceledAt = new Date().toISOString();
  await message.setFlag(MODULE_ID, REQUEST_FLAG, {
    ...request,
    version: Math.max(Number(request.version) || 1, 3),
    status: "cancelled",
    cancelledAt: canceledAt,
    cancelledBy: game.user.id
  });

  const recipient = game.users.get(request.recipientUserId);
  const inbox = recipient?.getFlag(MODULE_ID, INBOX_FLAG);
  if (recipient && inbox && typeof inbox === "object" && Object.hasOwn(inbox, request.requestId)) {
    const updatedInbox = foundry.utils.deepClone(inbox);
    delete updatedInbox[request.requestId];
    if (Object.keys(updatedInbox).length === 0) await recipient.unsetFlag(MODULE_ID, INBOX_FLAG);
    else await recipient.setFlag(MODULE_ID, INBOX_FLAG, updatedInbox);
  }

  ui.notifications.info(localize("DUNEQOL.PartySheet.Requests.Cancelled"));
  await application.render({ force: false });
}

async function selectActorToken(actorUuid) {
  const actor = await fromUuid(actorUuid).catch(() => null);
  const placeables = globalThis.canvas?.tokens?.placeables ?? [];
  const token = actor ? placeables.find((candidate) => candidate.actor?.id === actor.id) : null;
  if (!token) {
    ui.notifications.warn(localize("DUNEQOL.PartySheet.Characters.NoToken"));
    return;
  }

  token.control({ releaseOthers: true });
  await globalThis.canvas.animatePan({ x: token.center.x, y: token.center.y, duration: 250 });
}

function revealChatMessage(messageId) {
  if (!messageId) return;
  ui.sidebar?.activateTab?.("chat");
  setTimeout(() => {
    document.querySelector(`[data-message-id="${CSS.escape(messageId)}"]`)?.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  }, 100);
}

function filterRequestRows(root, status) {
  for (const row of root.querySelectorAll("[data-request-status]")) {
    row.hidden = status !== "all" && row.dataset.requestStatus !== status;
  }
}

function selectedTraits(root) {
  return [...root.querySelectorAll("input[name='partyTrait']:checked")]
    .map((input) => ({
      actorUuid: input.dataset.actorUuid,
      itemId: input.dataset.itemId,
      temporary: input.dataset.temporary === "true"
    }))
    .filter((entry) => entry.actorUuid && entry.itemId);
}

function normalizePartyData(value) {
  const source = value && typeof value === "object" ? value : {};
  return {
    version: 1,
    houseName: String(source.houseName ?? ""),
    houseInfo: String(source.houseInfo ?? ""),
    globalStatus: String(source.globalStatus ?? ""),
    groupNotes: String(source.groupNotes ?? ""),
    objectives: String(source.objectives ?? ""),
    actorMeta: source.actorMeta && typeof source.actorMeta === "object" ? source.actorMeta : {}
  };
}

function extractActorResources(actor) {
  const resources = actor.system?.resources;
  if (!resources || typeof resources !== "object") return [];

  return Object.entries(resources)
    .map(([key, value]) => {
      if (Number.isFinite(Number(value))) return { key, value: Number(value), max: null };
      if (!value || typeof value !== "object" || !Number.isFinite(Number(value.value))) return null;
      return {
        key,
        value: Number(value.value),
        max: Number.isFinite(Number(value.max)) ? Number(value.max) : null
      };
    })
    .filter(Boolean)
    .sort((left, right) => left.key.localeCompare(right.key));
}

function buildPartySheetHtml(model, activeTab) {
  const tabs = ["overview", "characters", "traits", "requests"];
  const nav = tabs.map((tab) => `
    <button type="button" data-party-tab="${tab}" class="${activeTab === tab ? "active" : ""}">
      ${escapeHtml(localize(`DUNEQOL.PartySheet.Tabs.${capitalize(tab)}`))}
    </button>
  `).join("");

  return `
    <div class="dune-qol-party-sheet">
      <nav class="dune-qol-party-sheet__tabs">${nav}</nav>
      <div class="dune-qol-party-sheet__toolbar">
        ${model.canEdit ? `<button type="button" data-party-action="save"><i class="fa-solid fa-floppy-disk"></i> ${escapeHtml(localize("DUNEQOL.PartySheet.Save"))}</button>` : ""}
        <button type="button" data-party-action="refresh"><i class="fa-solid fa-rotate"></i> ${escapeHtml(localize("DUNEQOL.PartySheet.Refresh"))}</button>
      </div>
      <main>
        ${buildOverviewTab(model, activeTab)}
        ${buildCharactersTab(model, activeTab)}
        ${buildTraitsTab(model, activeTab)}
        ${buildRequestsTab(model, activeTab)}
      </main>
    </div>
  `;
}

function buildOverviewTab(model, activeTab) {
  const readonly = model.canEdit ? "" : "readonly";
  const pools = model.pools
    ? `<div class="dune-qol-party-pools">
        <span>${escapeHtml(localize("DUNEQOL.Pools.ProposedTitle"))}</span>
        <strong>Momentum: ${model.pools.momentum}</strong>
        <strong>${escapeHtml(localize("DUNEQOL.Pools.Threat"))}: ${model.pools.threat}</strong>
      </div>`
    : `<p class="hint">${escapeHtml(localize("DUNEQOL.PartySheet.PoolsUnavailable"))}</p>`;

  return `
    <section class="dune-qol-party-tab ${activeTab === "overview" ? "active" : ""}" data-party-tab-panel="overview">
      ${pools}
      <div class="dune-qol-party-overview-grid">
        <label><span>${escapeHtml(localize("DUNEQOL.PartySheet.HouseName"))}</span><input name="houseName" value="${escapeHtml(model.data.houseName)}" maxlength="120" ${readonly}></label>
        <label><span>${escapeHtml(localize("DUNEQOL.PartySheet.GlobalStatus"))}</span><input name="globalStatus" value="${escapeHtml(model.data.globalStatus)}" maxlength="500" ${readonly}></label>
        <label class="wide"><span>${escapeHtml(localize("DUNEQOL.PartySheet.HouseInfo"))}</span><textarea name="houseInfo" maxlength="2000" ${readonly}>${escapeHtml(model.data.houseInfo)}</textarea></label>
        <label class="wide"><span>${escapeHtml(localize("DUNEQOL.PartySheet.Objectives"))}</span><textarea name="objectives" maxlength="4000" ${readonly}>${escapeHtml(model.data.objectives)}</textarea></label>
        <label class="wide"><span>${escapeHtml(localize("DUNEQOL.PartySheet.Notes"))}</span><textarea name="groupNotes" maxlength="4000" ${readonly}>${escapeHtml(model.data.groupNotes)}</textarea></label>
      </div>
    </section>
  `;
}

function buildCharactersTab(model, activeTab) {
  const cards = model.roster.map((entry) => {
    const owners = entry.owners.map((owner) => owner.name).join(", ");
    const resources = entry.resources.length > 0
      ? entry.resources.map((resource) => `<span>${escapeHtml(resource.key)}: <strong>${resource.value}${resource.max === null ? "" : `/${resource.max}`}</strong></span>`).join("")
      : `<span class="hint">${escapeHtml(localize("DUNEQOL.PartySheet.Characters.NoResources"))}</span>`;
    const traitSummary = entry.traits.slice(0, 5).map((item) => `<li>${escapeHtml(item.name)}</li>`).join("");

    return `
      <article class="dune-qol-party-character" data-party-actor-meta="${escapeHtml(entry.actor.uuid)}">
        <header>
          <img src="${escapeHtml(entry.actor.img ?? "icons/svg/mystery-man.svg")}" alt="">
          <div><strong>${escapeHtml(entry.actor.name)}</strong><small>${escapeHtml(owners)}</small></div>
        </header>
        <div class="dune-qol-party-character__meta">
          <label><span>${escapeHtml(localize("DUNEQOL.PartySheet.Characters.Kind"))}</span>
            <select name="actorKind" ${model.canEdit ? "" : "disabled"}>
              <option value="primary" ${entry.kind === "primary" ? "selected" : ""}>${escapeHtml(localize("DUNEQOL.PartySheet.Characters.Primary"))}</option>
              <option value="secondary" ${entry.kind === "secondary" ? "selected" : ""}>${escapeHtml(localize("DUNEQOL.PartySheet.Characters.Secondary"))}</option>
            </select>
          </label>
          <label><span>${escapeHtml(localize("DUNEQOL.PartySheet.Characters.Role"))}</span><input name="actorRole" value="${escapeHtml(entry.role)}" maxlength="120" ${model.canEdit ? "" : "readonly"}></label>
        </div>
        <div class="dune-qol-party-character__resources">${resources}</div>
        <ul class="dune-qol-party-character__traits">${traitSummary || `<li class="hint">${escapeHtml(localize("DUNEQOL.GroupTools.PartyTraits.NoTraits"))}</li>`}</ul>
        <footer>
          <button type="button" data-open-actor="${escapeHtml(entry.actor.uuid)}"><i class="fa-solid fa-address-card"></i> ${escapeHtml(localize("DUNEQOL.PartySheet.Actions.OpenSheet"))}</button>
          ${(game.user.isGM || entry.actor.isOwner) ? `<button type="button" data-roll-actor="${escapeHtml(entry.actor.uuid)}"><i class="fa-solid fa-dice-d20"></i> ${escapeHtml(localize("DUNEQOL.PartySheet.Actions.Test"))}</button>` : ""}
          <button type="button" data-select-actor-token="${escapeHtml(entry.actor.uuid)}"><i class="fa-solid fa-crosshairs"></i> ${escapeHtml(localize("DUNEQOL.PartySheet.Actions.SelectToken"))}</button>
        </footer>
      </article>
    `;
  }).join("");

  return `<section class="dune-qol-party-tab ${activeTab === "characters" ? "active" : ""}" data-party-tab-panel="characters"><div class="dune-qol-party-character-grid">${cards || `<p>${escapeHtml(localize("DUNEQOL.PartySheet.Characters.Empty"))}</p>`}</div></section>`;
}

function buildTraitsTab(model, activeTab) {
  const groups = model.roster.map((entry) => {
    const rows = entry.traits.map((item) => {
      const temporary = item.system?.temporary === true;
      return `<label class="dune-qol-party-trait-row">
        ${model.canEdit ? `<input type="checkbox" name="partyTrait" data-actor-uuid="${escapeHtml(entry.actor.uuid)}" data-item-id="${escapeHtml(item.id)}" data-temporary="${temporary}">` : ""}
        <span>${escapeHtml(item.name)}</span>
        <small>${escapeHtml(temporary ? localize("DUNEQOL.GroupTools.PartyTraits.Temporary") : localize("DUNEQOL.GroupTools.PartyTraits.Persistent"))}</small>
      </label>`;
    }).join("");
    return `<section class="dune-qol-party-trait-group"><h3>${escapeHtml(entry.actor.name)}</h3>${rows || `<p class="hint">${escapeHtml(localize("DUNEQOL.GroupTools.PartyTraits.NoTraits"))}</p>`}</section>`;
  }).join("");

  return `
    <section class="dune-qol-party-tab ${activeTab === "traits" ? "active" : ""}" data-party-tab-panel="traits">
      ${model.canEdit ? `<div class="dune-qol-party-trait-actions">
        <button type="button" data-party-action="promote-traits"><i class="fa-solid fa-thumbtack"></i> ${escapeHtml(localize("DUNEQOL.PartySheet.Traits.Promote"))}</button>
        <button type="button" data-party-action="delete-traits"><i class="fa-solid fa-trash"></i> ${escapeHtml(localize("DUNEQOL.PartySheet.Traits.Delete"))}</button>
      </div>` : ""}
      <div class="dune-qol-party-trait-groups">${groups}</div>
    </section>
  `;
}

function buildRequestsTab(model, activeTab) {
  const rows = model.requests.map(({ message, request, recipient, actor, result }) => {
    const status = request.status ?? "pending";
    return `<tr data-request-status="${escapeHtml(status)}">
      <td>${escapeHtml(new Date(request.createdAt).toLocaleString())}</td>
      <td>${escapeHtml(recipient?.name ?? request.recipientUserId)}</td>
      <td>${escapeHtml(actor?.name ?? request.actorName ?? "—")}</td>
      <td><span class="dune-qol-request-status dune-qol-request-status--${escapeHtml(status)}">${escapeHtml(localize(`DUNEQOL.PartySheet.Requests.Status.${capitalize(status)}`))}</span></td>
      <td>${escapeHtml(request.preset?.context ?? "—")}</td>
      <td class="dune-qol-party-request-actions">
        <button type="button" data-open-chat-message="${escapeHtml(message.id)}" title="${escapeHtml(localize("DUNEQOL.PartySheet.Requests.OpenRequest"))}"><i class="fa-solid fa-message"></i></button>
        ${result ? `<button type="button" data-open-chat-message="${escapeHtml(result.id)}" title="${escapeHtml(localize("DUNEQOL.PartySheet.Requests.OpenResult"))}"><i class="fa-solid fa-square-poll-vertical"></i></button>` : ""}
        ${model.canEdit && status === "pending" ? `<button type="button" data-cancel-request="${escapeHtml(message.id)}" title="${escapeHtml(localize("DUNEQOL.PartySheet.Requests.Cancel"))}"><i class="fa-solid fa-ban"></i></button>` : ""}
      </td>
    </tr>`;
  }).join("");

  return `
    <section class="dune-qol-party-tab ${activeTab === "requests" ? "active" : ""}" data-party-tab-panel="requests">
      <div class="dune-qol-party-request-toolbar">
        <label>${escapeHtml(localize("DUNEQOL.PartySheet.Requests.Filter"))}
          <select name="requestStatusFilter">
            <option value="all">${escapeHtml(localize("DUNEQOL.PartySheet.Requests.All"))}</option>
            <option value="pending">${escapeHtml(localize("DUNEQOL.PartySheet.Requests.Status.Pending"))}</option>
            <option value="completed">${escapeHtml(localize("DUNEQOL.PartySheet.Requests.Status.Completed"))}</option>
            <option value="cancelled">${escapeHtml(localize("DUNEQOL.PartySheet.Requests.Status.Cancelled"))}</option>
          </select>
        </label>
      </div>
      <div class="dune-qol-party-request-table-wrap"><table><thead><tr>
        <th>${escapeHtml(localize("DUNEQOL.PartySheet.Requests.Date"))}</th>
        <th>${escapeHtml(localize("DUNEQOL.PartySheet.Requests.Player"))}</th>
        <th>${escapeHtml(localize("DUNEQOL.PartySheet.Requests.Actor"))}</th>
        <th>${escapeHtml(localize("DUNEQOL.PartySheet.Requests.StatusLabel"))}</th>
        <th>${escapeHtml(localize("DUNEQOL.GuidedTest.Context"))}</th>
        <th>${escapeHtml(localize("DUNEQOL.PartySheet.Requests.Actions"))}</th>
      </tr></thead><tbody>${rows || `<tr><td colspan="6">${escapeHtml(localize("DUNEQOL.PartySheet.Requests.Empty"))}</td></tr>`}</tbody></table></div>
    </section>
  `;
}

function fieldValue(root, name, maximum) {
  return String(root.querySelector(`[name='${name}']`)?.value ?? "").trim().slice(0, maximum);
}

function isSupportedActor(actor) {
  return Boolean(actor?.system?.Skills && actor?.system?.Drives);
}

function capitalize(value) {
  const text = String(value);
  return `${text.charAt(0).toUpperCase()}${text.slice(1)}`;
}

function reportError(prefix, error) {
  console.error(prefix, error);
  ui.notifications.error(format("DUNEQOL.PartySheet.Errors.Failed", {
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
