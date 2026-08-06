import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];

function fail(message) {
  errors.push(message);
}

async function exists(relativePath) {
  try {
    await access(path.join(root, relativePath));
    return true;
  } catch {
    return false;
  }
}

async function readText(relativePath) {
  return readFile(path.join(root, relativePath), "utf8");
}

async function readJson(relativePath) {
  try {
    return JSON.parse(await readText(relativePath));
  } catch (error) {
    fail(`${relativePath} is not valid JSON: ${error.message}`);
    return null;
  }
}

const requiredFiles = [
  "README.md",
  "AGENTS.md",
  "docs/PROJECT.md",
  "docs/USER-GUIDE.md",
  "module.json",
  "package.json",
  "scripts/dune-qol.mjs",
  "scripts/settings.mjs",
  "scripts/localization.mjs",
  "scripts/adapters/dune-pools.mjs",
  "scripts/domain/dune-test.mjs",
  "scripts/domain/pool-plan.mjs",
  "scripts/domain/complication-resolution.mjs",
  "scripts/features/guided-test.mjs",
  "scripts/features/guided-test-ui.mjs",
  "scripts/services/pool-transactions.mjs",
  "scripts/services/complication-traits.mjs",
  "styles/dune-qol.css",
  "tools/test-dune-test.mjs",
  "tools/test-pool-plan.mjs",
  "tools/test-complication-resolution.mjs",
  "lang/en.json",
  "lang/fr.json"
];

for (const relativePath of requiredFiles) {
  if (!(await exists(relativePath))) {
    fail(`Missing required file: ${relativePath}`);
  }
}

const manifest = await readJson("module.json");
const packageJson = await readJson("package.json");
await readJson("lang/en.json");
await readJson("lang/fr.json");

if (manifest) {
  if (manifest.id !== "dune-qol") {
    fail(`module.json id must be 'dune-qol', found '${manifest.id}'.`);
  }

  if (manifest.type !== "module") {
    fail(`module.json type must be 'module', found '${manifest.type}'.`);
  }

  if (manifest.compatibility?.minimum !== "13" || manifest.compatibility?.maximum !== "13") {
    fail("module.json must currently target Foundry major version 13 only.");
  }

  if (manifest.socket !== true) {
    fail("module.json must enable the module socket for authoritative shared-state transactions.");
  }

  const duneSystem = manifest.relationships?.systems?.find(
    (relationship) => relationship.id === "dune" && relationship.type === "system"
  );

  if (!duneSystem) {
    fail("module.json must declare a system relationship with system id 'dune'.");
  } else if (
    duneSystem.compatibility?.minimum !== "13.0.1"
    || duneSystem.compatibility?.verified !== "13.0.1"
  ) {
    fail("module.json must currently target the published Dune system version 13.0.1.");
  }

  for (const entryPoint of manifest.esmodules ?? []) {
    if (!(await exists(entryPoint))) {
      fail(`module.json references a missing ES module: ${entryPoint}`);
    }
  }

  for (const style of manifest.styles ?? []) {
    if (!(await exists(style))) {
      fail(`module.json references a missing stylesheet: ${style}`);
    }
  }

  for (const language of manifest.languages ?? []) {
    if (!language.path || !(await exists(language.path))) {
      fail(`module.json references a missing localization file: ${language.path ?? "<undefined>"}`);
    }
  }
}

if (manifest && packageJson && manifest.version !== packageJson.version) {
  fail(
    `Version mismatch: module.json=${manifest.version}, package.json=${packageJson.version}.`
  );
}

if (await exists("README.md")) {
  const readme = await readText("README.md");
  if (!readme.includes("AI-assisted development disclosure")) {
    fail("README.md must retain the AI-assisted development disclosure.");
  }
  if (!readme.includes("docs/USER-GUIDE.md")) {
    fail("README.md must link to the user guide.");
  }
}

if (await exists("AGENTS.md")) {
  const agents = await readText("AGENTS.md");
  if (!agents.includes("docs/PROJECT.md")) {
    fail("AGENTS.md must identify docs/PROJECT.md as the central project document.");
  }
}

if (await exists("docs/PROJECT.md")) {
  const project = await readText("docs/PROJECT.md");
  if (!/^## \d+\. Decision log$/m.test(project)) {
    fail("docs/PROJECT.md must contain the central decision log.");
  }

  const allowedMarkdown = new Set(["PROJECT.md", "USER-GUIDE.md"]);
  const docsEntries = await readdir(path.join(root, "docs"), { withFileTypes: true });
  const extraMarkdown = docsEntries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md") && !allowedMarkdown.has(entry.name))
    .map((entry) => entry.name);

  if (extraMarkdown.length > 0) {
    fail(
      `Unexpected Markdown files in docs/: ${extraMarkdown.join(", ")}. ` +
        "Record and approve documentation splits in docs/PROJECT.md first."
    );
  }
}

if (errors.length > 0) {
  console.error("Project validation failed:\n");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exitCode = 1;
} else {
  console.log("Project validation passed.");
}
