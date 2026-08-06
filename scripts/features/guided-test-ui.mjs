import {
  TEST_LIMITS,
  extraDiceCost
} from "../domain/dune-test.mjs";
import { format, localize } from "../localization.mjs";

const GUIDED_TEST_SELECTOR = ".dune-qol-guided-test";
const BOUND_ATTRIBUTE = "duneQolExtraDiceBound";
let pendingPreset = null;

/**
 * Queue a one-shot preset for the next Guided-test dialog rendered on this
 * client. Test requests call this immediately before opening the dialog.
 */
export function queueGuidedTestPreset(request) {
  pendingPreset = request && typeof request === "object"
    ? foundry.utils.deepClone(request)
    : null;
}

/**
 * Configure dynamic Guided-test form controls through Foundry's documented
 * ApplicationV2 render hook. The hook receives the pending HTMLElement, so it
 * does not depend on DialogV2.form being available during the render event.
 */
Hooks.on("renderApplicationV2", (_application, element) => {
  if (!(element instanceof HTMLElement)) return;

  const roots = element.matches(GUIDED_TEST_SELECTOR)
    ? [element]
    : [...element.querySelectorAll(GUIDED_TEST_SELECTOR)];

  for (const root of roots) {
    applyPendingPreset(root);
    configureExtraDiceControls(root);
  }
});

function applyPendingPreset(root) {
  if (!pendingPreset) return;

  const request = pendingPreset;
  pendingPreset = null;
  const preset = request.preset ?? {};

  setSelectValue(root, "skill", preset.skill);
  setSelectValue(root, "drive", preset.drive);
  setInputValue(root, "focus", preset.focus);
  setInputValue(root, "difficulty", preset.difficulty);
  setInputValue(root, "complicationRange", preset.complicationRange);
  setInputValue(root, "context", preset.context);

  root.dataset.duneQolRequestMessageId = request.requestMessageId ?? "";
  root.dataset.duneQolRequestedBy = request.requestedBy ?? "";

  const banner = document.createElement("aside");
  banner.className = "dune-qol-test-request-banner";
  banner.innerHTML = `
    <i class="fa-solid fa-paper-plane"></i>
    <span>${escapeHtml(format("DUNEQOL.TestRequests.DialogBanner", {
      user: request.requestedByName ?? localize("DUNEQOL.TestRequests.UnknownGm")
    }))}</span>
  `;
  root.prepend(banner);
}

function setSelectValue(root, name, value) {
  if (!value) return;
  const select = root.querySelector(`select[name="${name}"]`);
  if (!(select instanceof HTMLSelectElement)) return;
  if (![...select.options].some((option) => option.value === String(value))) return;
  select.value = String(value);
  select.dispatchEvent(new Event("change", { bubbles: true }));
}

function setInputValue(root, name, value) {
  if (value === null || value === undefined || value === "") return;
  const input = root.querySelector(`input[name="${name}"]`);
  if (!(input instanceof HTMLInputElement)) return;
  input.value = String(value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

function configureExtraDiceControls(root) {
  const diceInput = root.querySelector('input[name="totalDice"]');
  const sourceSelect = root.querySelector('select[name="extraDiceSource"]');
  const costOutput = root.querySelector("[data-extra-dice-cost]");

  if (!(diceInput instanceof HTMLInputElement)) return;
  if (!(sourceSelect instanceof HTMLSelectElement)) return;
  if (diceInput.dataset[BOUND_ATTRIBUTE] === "true") return;

  const updateExtraDice = () => {
    const totalDice = diceInput.valueAsNumber;
    const validDice = Number.isInteger(totalDice)
      && totalDice >= TEST_LIMITS.minimumDice
      && totalDice <= TEST_LIMITS.maximumDice;

    if (!validDice) {
      sourceSelect.disabled = true;
      if (costOutput) costOutput.textContent = "";
      return;
    }

    const extraDice = totalDice - TEST_LIMITS.minimumDice;
    const cost = extraDiceCost(totalDice);

    sourceSelect.disabled = extraDice === 0;
    if (extraDice === 0) {
      sourceSelect.value = "none";
    } else if (sourceSelect.value === "none") {
      sourceSelect.value = "unrecorded";
    }

    if (costOutput) {
      costOutput.textContent = format("DUNEQOL.GuidedTest.ExtraDiceSummary", {
        dice: extraDice,
        cost
      });
    }
  };

  diceInput.dataset[BOUND_ATTRIBUTE] = "true";
  diceInput.addEventListener("input", updateExtraDice);
  diceInput.addEventListener("change", updateExtraDice);
  updateExtraDice();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
