const MODULE_ID = "dune-qol";

export const SETTING_KEYS = Object.freeze({
  language: "language",
  launcherLocation: "launcherLocation",
  hideNativeRoller: "hideNativeRoller",
  partyData: "partyData"
});

export const LAUNCHER_LOCATIONS = Object.freeze({
  actorSheet: "actor-sheet",
  tokenControls: "token-controls",
  both: "both"
});

const SETTINGS_UI = Object.freeze([
  {
    key: SETTING_KEYS.language,
    name: "DUNEQOL.Settings.Language.Name",
    hint: "DUNEQOL.Settings.Language.Hint",
    choices: {
      en: "DUNEQOL.Settings.Language.English",
      fr: "DUNEQOL.Settings.Language.French"
    }
  },
  {
    key: SETTING_KEYS.launcherLocation,
    name: "DUNEQOL.Settings.Launcher.Name",
    hint: "DUNEQOL.Settings.Launcher.Hint",
    choices: {
      [LAUNCHER_LOCATIONS.actorSheet]: "DUNEQOL.Settings.Launcher.ActorSheet",
      [LAUNCHER_LOCATIONS.tokenControls]: "DUNEQOL.Settings.Launcher.TokenControls",
      [LAUNCHER_LOCATIONS.both]: "DUNEQOL.Settings.Launcher.Both"
    }
  },
  {
    key: SETTING_KEYS.hideNativeRoller,
    name: "DUNEQOL.Settings.HideNativeRoller.Name",
    hint: "DUNEQOL.Settings.HideNativeRoller.Hint"
  }
]);

export function registerSettings() {
  const foundryLanguage = game.i18n?.lang;
  const defaultLanguage = foundryLanguage === "fr" ? "fr" : "en";

  game.settings.register(MODULE_ID, SETTING_KEYS.language, {
    name: "DUNEQOL.Settings.Language.Name",
    hint: "DUNEQOL.Settings.Language.Hint",
    scope: "user",
    config: true,
    type: String,
    choices: {
      en: "English",
      fr: "Français"
    },
    default: defaultLanguage,
    requiresReload: true
  });

  game.settings.register(MODULE_ID, SETTING_KEYS.launcherLocation, {
    name: "DUNEQOL.Settings.Launcher.Name",
    hint: "DUNEQOL.Settings.Launcher.Hint",
    scope: "user",
    config: true,
    type: String,
    choices: {
      [LAUNCHER_LOCATIONS.actorSheet]: "Actor sheet / Fiche de personnage",
      [LAUNCHER_LOCATIONS.tokenControls]: "Token controls / Contrôles de token",
      [LAUNCHER_LOCATIONS.both]: "Both / Les deux"
    },
    default: LAUNCHER_LOCATIONS.actorSheet,
    requiresReload: true
  });

  game.settings.register(MODULE_ID, SETTING_KEYS.hideNativeRoller, {
    name: "DUNEQOL.Settings.HideNativeRoller.Name",
    hint: "DUNEQOL.Settings.HideNativeRoller.Hint",
    scope: "user",
    config: true,
    type: Boolean,
    default: true,
    requiresReload: true
  });

  game.settings.register(MODULE_ID, SETTING_KEYS.partyData, {
    name: "Dune QoL Party data",
    scope: "world",
    config: false,
    type: Object,
    default: {
      version: 1,
      houseName: "",
      houseInfo: "",
      globalStatus: "",
      groupNotes: "",
      objectives: "",
      actorMeta: {}
    }
  });

  Hooks.on("renderSettingsConfig", async (_application, html) => {
    await localizeSettingsConfig(html);
  });
}

export function getModuleLanguage() {
  return game.settings.get(MODULE_ID, SETTING_KEYS.language);
}

export function getLauncherLocation() {
  return game.settings.get(MODULE_ID, SETTING_KEYS.launcherLocation);
}

export function shouldHideNativeRoller() {
  return game.settings.get(MODULE_ID, SETTING_KEYS.hideNativeRoller);
}

async function localizeSettingsConfig(html) {
  const root = getHtmlRoot(html);
  if (!root) return;

  const { localize } = await import("./localization.mjs");

  for (const setting of SETTINGS_UI) {
    const input = root.querySelector(`[name="${MODULE_ID}.${setting.key}"]`);
    const group = input?.closest(".form-group");
    if (!input || !group) continue;

    const label = group.querySelector("label");
    if (label) label.textContent = localize(setting.name);

    const hint = group.querySelector(".hint, p.notes");
    if (hint) hint.textContent = localize(setting.hint);

    if (input instanceof HTMLSelectElement && setting.choices) {
      for (const option of input.options) {
        const key = setting.choices[option.value];
        if (key) option.textContent = localize(key);
      }
    }
  }
}

function getHtmlRoot(html) {
  if (html instanceof HTMLElement) return html;
  if (html?.[0] instanceof HTMLElement) return html[0];
  return null;
}
