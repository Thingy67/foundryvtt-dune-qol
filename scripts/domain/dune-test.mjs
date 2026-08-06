const MIN_DICE = 2;
const MAX_DICE = 5;
const MIN_DIFFICULTY = 0;
const MAX_DIFFICULTY = 5;
const MIN_COMPLICATION_RANGE = 15;
const MAX_COMPLICATION_RANGE = 20;

/**
 * Clamp and validate an integer used by the guided Dune test workflow.
 */
export function boundedInteger(value, { name, minimum, maximum }) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < minimum || parsed > maximum) {
    throw new RangeError(`${name} must be an integer between ${minimum} and ${maximum}.`);
  }
  return parsed;
}

/**
 * Return the cumulative Momentum/Threat cost for dice beyond the two base dice.
 * This function reports the cost only; shared pools are not changed here.
 */
export function extraDiceCost(totalDice) {
  const dice = boundedInteger(totalDice, {
    name: "totalDice",
    minimum: MIN_DICE,
    maximum: MAX_DICE
  });
  const extraDice = dice - MIN_DICE;
  return (extraDice * (extraDice + 1)) / 2;
}

/**
 * Evaluate already-rolled d20 results according to the values supplied by the
 * guided test. Complications are independent from success, so one die can
 * contribute a success and a complication at the same time.
 */
export function evaluateDuneTest({
  results,
  target,
  focusThreshold = 1,
  complicationRange = 20,
  difficulty = 1,
  determination = false
}) {
  if (!Array.isArray(results)) {
    throw new TypeError("results must be an array.");
  }

  const validatedTarget = boundedInteger(target, {
    name: "target",
    minimum: 1,
    maximum: 20
  });
  const validatedFocus = boundedInteger(focusThreshold, {
    name: "focusThreshold",
    minimum: 1,
    maximum: 20
  });
  const validatedComplicationRange = boundedInteger(complicationRange, {
    name: "complicationRange",
    minimum: MIN_COMPLICATION_RANGE,
    maximum: MAX_COMPLICATION_RANGE
  });
  const validatedDifficulty = boundedInteger(difficulty, {
    name: "difficulty",
    minimum: MIN_DIFFICULTY,
    maximum: MAX_DIFFICULTY
  });

  const dice = results.map((value) => {
    const result = boundedInteger(value, {
      name: "die result",
      minimum: 1,
      maximum: 20
    });
    const successes = result <= validatedFocus ? 2 : result <= validatedTarget ? 1 : 0;
    const complication = result >= validatedComplicationRange;

    return {
      result,
      successes,
      complication,
      determination: false
    };
  });

  if (determination) {
    dice.push({
      result: 1,
      successes: 2,
      complication: false,
      determination: true
    });
  }

  const successes = dice.reduce((total, die) => total + die.successes, 0);
  const complications = dice.filter((die) => die.complication).length;
  const succeeded = successes >= validatedDifficulty;
  const momentum = succeeded ? successes - validatedDifficulty : 0;

  return {
    dice,
    successes,
    complications,
    difficulty: validatedDifficulty,
    succeeded,
    momentum
  };
}

export const TEST_LIMITS = Object.freeze({
  minimumDice: MIN_DICE,
  maximumDice: MAX_DICE,
  minimumDifficulty: MIN_DIFFICULTY,
  maximumDifficulty: MAX_DIFFICULTY,
  minimumComplicationRange: MIN_COMPLICATION_RANGE,
  maximumComplicationRange: MAX_COMPLICATION_RANGE
});
