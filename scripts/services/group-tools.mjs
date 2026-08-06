import { format, localize } from "../localization.mjs";

const MODULE_ID = "dune-qol";
const SOCKET_NAME = `module.${MODULE_ID}`;
const INBOX_FLAG = "testRequestInbox";
const GROUP_REQUEST_CONTROL = "dune-qol-group-test-request";
const PARTY_TRAITS_CONTROL = "dune-qol-party-traits";
const PARTY_TRAITS_SELECTOR = ".dune-qol-party-traits-dialog";

export function registerGroupToolHooks() {
  Hooks.on("getSceneControlButtons", (controls) => {
    if (game.system.id !== "dune" || !game.user.isGM || !controls.tokens?.tools) return;

    const nextOrder = () => Object.keys(controls.tokens.tools).length;

    controls.tokens.tools[GROUP_REQUEST_CONTROL] = {
      name: GROUP_REQUEST_CONTROL,
      title: localize("DUNEQOL.GroupTools.GroupRequest.Control"),
      icon: "fa-solid fa-users-rays",
      order: nextOrder(),
      button: true,
      visible: true,
      onChange: () => void openGroupRequestDialog()
    };

    controls.tokens.tools[PARTY_TRAITS_CONTROL] = {
      name: PARTY_TRAITS_CONTROL,
      title: localize("DUNEQOL.GroupTools.PartyTraits.Control"),
      icon: "fa-solid fa-tags",
      order: nextOrder(),
      button: true,
      visible: true,
      onChange: () => void openPartyTraitsDialog()
    };
  });

  Hooks.on("renderApplicationV2", (_application, element) => {
    const root = getHtmlRoot(element);
    const dialog = root?.querySelector(PARTY_TRAITS_SELECTOR);
    if (dialog) configurePartyTraitsDialog(dialog);
  });
}

async function openGroupRequestDialog() {
  try {
    const roster = buildPlayerRoster();
    if (roster.length === 0) {
      ui.notifications.warn(localize("DUNEQOL.GroupTools.Errors.NoPlayers"));
      return;
    }

    const actors = roster.flatMap((entry) => entry.actors);
    const commonSkills = commonStatKeys(actors, "Skills");
    const commonDrives = commonStatKeys(actors, "Drives");
    const DialogV2 = foundry.applications.api.DialogV2;
    if (!DialogV2) throw new Error(localize("DUNEQOL.GuidedTest.Errors.DialogUnavailable"));

    const dialog = new DialogV2({
      window: {
        title: localize("DUNEQOL.GroupTools.GroupRequest.Title")
      },
      position: {
        width: 680
      },
      content: buildGroupRequestContent({ roster, commonSkills, commonDrives }),
      buttons: [
        {
          action: "send",
          label: localize("DUNEQOL.GroupTools.GroupRequest.Send"),
          icon: "fa-solid fa-paper-plane",
          default: true,
          callback: async (_event, button) => {
            if (!button.form.reportValidity()) return false;
            const sent = await sendGroupRequests(new FormData(button.form), roster);
            return sent > 0;
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
    reportError("Dune QoL | Group test-request dialog failed.", error);
  }
}

async function sendGroupRequests(formData, roster) {
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
        batchId
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
    ui.notifications.info(
      format("DUNEQOL.GroupTools.GroupRequest.Sent", { count: sent })
    );
  }

  if (failures.length > 0) {
    console.error("Dune QoL | Some group test requests failed.", failures);
    ui.notifications.warn(
      format("DUNEQOL.GroupTools.GroupRequest.Partial", {
        sent,
        failed: failures.length
      })
    );
  }

  return sent;
}

async function createRequestForRecipient({ actor, recipient, preset, batchId }) {
  if (!game.user.isGM) throw new Error(localize("DUNEQOL.TestRequests.Errors.GmOnly"));
  if (recipient.isGM || !actor.testUserPermission(recipient, "OWNER")) {
    throw new Error(localize("DUNEQOL.TestRequests.Errors.InvalidRecipient"));
  }

  const requestId = foundry.utils.randomID();
  const createdAt = new Date().toISOString();
  const request = {
    version: 2,
    requestId,
    batchId,
    source: "group",
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

  console.info("Dune QoL | Group test request queued.", {
    batchId,
    requestId,
    messageId: message.id,
    recipientUserId: recipient.id,
    actorUuid: actor.uuid
  });
}

async function openPartyTraitsDialog() {
  try {
    const actors = buildPartyActorRoster();
    const DialogV2 = foundry.applications.api.DialogV2;
    if (!DialogV2) throw new Error(localize("DUNEQOL.GuidedTest.Errors.DialogUnavailable"));

    const dialog = new DialogV2({
      window: {
        title: localize("DUNEQOL.GroupTools.PartyTraits.Title")
      },
      position: {
        width: 760,
        height: 700
      },
      content: buildPartyTraitsContent(actors),
      buttons: [
        {
          action: "close",
          label: localize("DUNEQOL.Close"),
          icon: "fa-solid fa-xmark",
          default: true
        }
      ]
    });

    await dialog.render({ force: true });
  } catch (error) {
    reportError("Dune QoL | Party Trait overview failed.", error);
  }
}

function configurePartyTraitsDialog(root) {
  if (root.dataset.duneQolConfigured === "true") return;
  root.dataset.duneQolConfigured = "true";

  const search = root.querySelector('input[name="traitSearch"]');
  const filter = root.querySelector('select[name="traitStatus"]');
  const cards = [...root.querySelectorAll("[data-dune-qol-party-actor]")];

  const applyFilters = () => {
    const query = String(search?.value ?? "").trim().toLocaleLowerCase();
    const status = String(filter?.value ?? "all");

    for (const card of cards) {
      const haystack = String(card.dataset.searchText ?? "").toLocaleLowerCase();
      const temporary = Number(card.dataset.temporaryCount ?? 0);
      const persistent = Number(card.dataset.persistentCount ?? 0);
      const matchesText = !query || haystack.includes(query);
      const matchesStatus = status === "all"
        || (status === "temporary" && temporary > 0)
        || (status === "persistent" && persistent > 0);
      card.hidden = !(matchesText && matchesStatus);
    }
  };

  search?.addEventListener("input", applyFilters);
  filter?.addEventListener("change", applyFilters);

  for (const button of root.querySelectorAll("[data-dune-qol-open-actor]")) {
    button.addEventListener("click", async (event) => {
      event.preventDefault();
      const actor = await fromUuid(button.dataset.duneQolOpenActor).catch(() => null);
      actor?.sheet?.render(true);
    });
  }
}

function buildPlayerRoster() {
  return game.users
    .filter((user) => !user.isGM)
    .map((user) => ({
      user,
      actors: ownedSupportedActors(user)
    }))
    .filter((entry) => entry.actors.length > 0)
    .sort((left, right) => left.user.name.localeCompare(right.user.name));
}

function buildPartyActorRoster() {
  const actors = new Map();

  for (const user of game.users.filter((candidate) => !candidate.isGM)) {
    for (const actor of ownedSupportedActors(user)) {
      const entry = actors.get(actor.uuid) ?? {
        actor,
        owners: []
      };
      if (!entry.owners.some((owner) => owner.id === user.id)) entry.owners.push(user);
      actors.set(actor.uuid, entry);
    }
  }

  return [...actors.values()]
    .map((entry) => ({
      ...entry,
      owners: entry.owners.sort((left, right) => left.name.localeCompare(right.name)),
      traits: entry.actor.items
        .filter((item) => item.type === "trait")
        .sort((left, right) => left.name.localeCompare(right.name))
    }))
    .sort((left, right) => left.actor.name.localeCompare(right.actor.name));
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

function buildGroupRequestContent({ roster, commonSkills, commonDrives }) {
  const playerRows = roster.map(({ user, actors }) => {
    const actorOptions = actors
      .map((actor) => `<option value="${escapeHtml(actor.uuid)}">${escapeHtml(actor.name)}</option>`)
      .join("");

    return `
      <div class="dune-qol-group-player-row">
        <label class="dune-qol-group-player-row__player">
          <input type="checkbox" name="recipientIds" value="${escapeHtml(user.id)}">
          <span>${escapeHtml(user.name)}</span>
          ${user.active ? "" : `<small>${escapeHtml(localize("DUNEQOL.TestRequests.Offline"))}</small>`}
        </label>
        <label>
          <span>${escapeHtml(localize("DUNEQOL.GroupTools.GroupRequest.Actor"))}</span>
          <select name="actorUuid__${escapeHtml(user.id)}">${actorOptions}</select>
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

function buildPartyTraitsContent(entries) {
  const cards = entries.map(({ actor, owners, traits }) => {
    const temporaryCount = traits.filter((item) => item.system?.temporary === true).length;
    const persistentCount = traits.length - temporaryCount;
    const ownersText = owners.map((owner) => owner.name).join(", ");
    const traitRows = traits.length > 0
      ? traits.map((item) => {
          const temporary = item.system?.temporary === true;
          const generated = Boolean(item.getFlag(MODULE_ID, "complicationTrait"));
          return `
            <li>
              <span>${escapeHtml(item.name)}</span>
              <small>${escapeHtml(temporary
                ? localize("DUNEQOL.GroupTools.PartyTraits.Temporary")
                : localize("DUNEQOL.GroupTools.PartyTraits.Persistent"))}</small>
              ${generated ? `<small>${escapeHtml(localize("DUNEQOL.GroupTools.PartyTraits.FromComplication"))}</small>` : ""}
            </li>
          `;
        }).join("")
      : `<li class="dune-qol-party-traits-card__empty">${escapeHtml(localize("DUNEQOL.GroupTools.PartyTraits.NoTraits"))}</li>`;
    const searchText = [actor.name, ownersText, ...traits.map((item) => item.name)].join(" ");

    return `
      <article class="dune-qol-party-traits-card"
        data-dune-qol-party-actor="${escapeHtml(actor.uuid)}"
        data-search-text="${escapeHtml(searchText)}"
        data-temporary-count="${temporaryCount}"
        data-persistent-count="${persistentCount}">
        <header>
          <img src="${escapeHtml(actor.img ?? "icons/svg/mystery-man.svg")}" alt="">
          <div>
            <strong>${escapeHtml(actor.name)}</strong>
            <small>${escapeHtml(format("DUNEQOL.GroupTools.PartyTraits.Owners", { owners: ownersText }))}</small>
          </div>
          <button type="button" data-dune-qol-open-actor="${escapeHtml(actor.uuid)}" title="${escapeHtml(localize("DUNEQOL.GroupTools.PartyTraits.OpenSheet"))}">
            <i class="fa-solid fa-address-card"></i>
          </button>
        </header>
        <ul>${traitRows}</ul>
      </article>
    `;
  }).join("");

  return `
    <div class="dune-qol-party-traits-dialog">
      <div class="dune-qol-party-traits-filters">
        <input name="traitSearch" type="search" placeholder="${escapeHtml(localize("DUNEQOL.GroupTools.PartyTraits.Search"))}">
        <select name="traitStatus">
          <option value="all">${escapeHtml(localize("DUNEQOL.GroupTools.PartyTraits.All"))}</option>
          <option value="temporary">${escapeHtml(localize("DUNEQOL.GroupTools.PartyTraits.TemporaryOnly"))}</option>
          <option value="persistent">${escapeHtml(localize("DUNEQOL.GroupTools.PartyTraits.PersistentOnly"))}</option>
        </select>
      </div>
      <div class="dune-qol-party-traits-grid">
        ${cards || `<p>${escapeHtml(localize("DUNEQOL.GroupTools.PartyTraits.NoActors"))}</p>`}
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
  ui.notifications.error(
    format("DUNEQOL.GroupTools.Errors.Failed", {
      message: error instanceof Error ? error.message : String(error)
    })
  );
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
