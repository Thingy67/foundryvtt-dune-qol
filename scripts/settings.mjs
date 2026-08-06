const MODULE_ID = "dune-qol";

export const SETTING_KEYS = Object.freeze({
  language: "language",
  launcherLocation: "launcherLocation",
  hideNativeRoller: "hideNativeRoller"
});

export const LAUNCHER_LOCATIONS = Object.freeze({
  actorSheet: "actor-sheet",
  tokenControls: "token-controls",
  both: "both"
});

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
