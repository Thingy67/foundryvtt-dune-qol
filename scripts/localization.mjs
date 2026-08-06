import { getModuleLanguage } from "./settings.mjs";

const MODULE_ID = "dune-qol";
const SUPPLEMENTAL_DICTIONARIES = [
  "temporary-traits",
  "group-tools",
  "party-sheet",
  "combat"
];
let translations = {};
let activeLanguage = "en";

export async function initializeLocalization() {
  const configuredLanguage = getModuleLanguage();
  activeLanguage = configuredLanguage === "fr" ? "fr" : "en";

  try {
    const base = await fetchTranslationFile(`${activeLanguage}.json`);
    const supplementalFiles = await Promise.all(
      SUPPLEMENTAL_DICTIONARIES.map((name) =>
        fetchTranslationFile(`${activeLanguage}-${name}.json`, { optional: true })
      )
    );
    translations = Object.assign({}, base, ...supplementalFiles);
  } catch (error) {
    translations = {};
    console.error(
      `Dune QoL | Could not load ${activeLanguage} module translations.`,
      error
    );
    ui.notifications?.warn(
      `Dune QoL: could not load ${activeLanguage} translations; Foundry language fallback is used.`
    );
  }
}

async function fetchTranslationFile(fileName, { optional = false } = {}) {
  try {
    const response = await fetch(`/modules/${MODULE_ID}/lang/${fileName}`, {
      cache: "no-store"
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    if (!optional) throw error;
    console.warn(`Dune QoL | Optional translation file '${fileName}' was not loaded.`, error);
    return {};
  }
}

export function localize(key) {
  const translated = translations[key];
  if (typeof translated === "string") return translated;
  return game.i18n.localize(key);
}

export function format(key, data = {}) {
  const template = localize(key);
  return template.replace(/\{([^}]+)\}/g, (match, name) => {
    return Object.hasOwn(data, name) ? String(data[name]) : match;
  });
}

export function getActiveLanguage() {
  return activeLanguage;
}
