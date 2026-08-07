import { format, localize } from "../localization.mjs";

const MODULE_ID = "dune-qol";
const PARTY_TRAITS_CONTROL = "dune-qol-party-traits";
const PARTY_TRAITS_SELECTOR = ".dune-qol-party-traits-dialog";

export function registerGroupToolHooks() {
  Hooks.on("getSceneControlButtons", (controls) => {
    if (game.system.id !== "dune" || !game.user.isGM || !controls.tokens?.tools) return;

    controls.tokens.tools[PARTY_TRAITS_CONTROL] = {
      name: PARTY_TRAITS_CONTROL,
      title: localize("DUNEQOL.GroupTools.PartyTraits.Control"),
      icon: "fa-solid fa-tags",
      order: Object.keys(controls.tokens.tools).length,
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
