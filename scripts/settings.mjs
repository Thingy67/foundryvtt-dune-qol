const MODULE_ID = "dune-qol";

export const SETTING_KEYS = Object.freeze({
  language: "language",
  launcherLocation: "launcherLocation"
});

export const LAUNCHER_LOCATIONS = Object.freeze({
  actorSheet: "actor-sheet",
  tokenControls: "token-controls",
  both: "both"
});

export function registerSettings() {
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
    default: "fr",
    requiresReload: true
  });

  game.settings.register(MODULE_ID, SETTING_KEYS.launcherLocation, {
    name: "DUNEQOL.Settings.Launcher.Name",
    hint: "DUNEQOL.Settings.Launcher.Hint",
    scope: "user",
    config: true,
    type: String,
    choices: {
      [LAUNCHER_LOCATIONS.actorSheet]: "DUNEQOL.Settings.Launcher.ActorSheet",
      [LAUNCHER_LOCATIONS.tokenControls]: "DUNEQOL.Settings.Launcher.TokenControls",
      [LAUNCHER_LOCATIONS.both]: "DUNEQOL.Settings.Launcher.Both"
    },
    default: LAUNCHER_LOCATIONS.actorSheet,
    requiresReload: true
  });
}

export function getModuleLanguage() {
  return game.settings.get(MODULE_ID, SETTING_KEYS.language);
}

export function getLauncherLocation() {
  return game.settings.get(MODULE_ID, SETTING_KEYS.launcherLocation);
}
