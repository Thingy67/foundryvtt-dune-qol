import { registerGuidedTestHooks } from "./features/guided-test.mjs";
import { initializeLocalization } from "./localization.mjs";
import { registerSettings } from "./settings.mjs";

const MODULE_ID = "dune-qol";
const MODULE_TITLE = "Dune: Adventures in the Imperium QoL";

Hooks.once("init", () => {
  const module = game.modules.get(MODULE_ID);
  if (!module) {
    console.error(`${MODULE_TITLE} | Module registration was not found.`);
    return;
  }

  const version = module.version ?? module.manifest?.version ?? "unknown";
  console.info(`${MODULE_TITLE} | Initializing version ${version}.`);

  registerSettings();
  registerGuidedTestHooks();
});

Hooks.once("i18nInit", async () => {
  await initializeLocalization();
});

Hooks.once("ready", () => {
  if (game.system.id !== "dune") {
    console.error(
      `${MODULE_TITLE} | Unsupported system '${game.system.id}'. Expected 'dune'.`
    );
    return;
  }

  console.info(`${MODULE_TITLE} | Ready.`);
});
