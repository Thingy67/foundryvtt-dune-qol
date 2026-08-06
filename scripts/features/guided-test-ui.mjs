import {
  TEST_LIMITS,
  extraDiceCost
} from "../domain/dune-test.mjs";
import { format } from "../localization.mjs";

const GUIDED_TEST_SELECTOR = ".dune-qol-guided-test";
const BOUND_ATTRIBUTE = "duneQolExtraDiceBound";

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
    configureExtraDiceControls(root);
  }
});

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
