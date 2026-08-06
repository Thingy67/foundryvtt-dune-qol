import assert from "node:assert/strict";
import {
  evaluateDuneTest,
  extraDiceCost
} from "../scripts/domain/dune-test.mjs";

assert.equal(extraDiceCost(2), 0);
assert.equal(extraDiceCost(3), 1);
assert.equal(extraDiceCost(4), 3);
assert.equal(extraDiceCost(5), 6);

{
  const outcome = evaluateDuneTest({
    results: [1, 8, 12, 20],
    target: 12,
    focusThreshold: 8,
    complicationRange: 20,
    difficulty: 2
  });

  assert.equal(outcome.successes, 5);
  assert.equal(outcome.complications, 1);
  assert.equal(outcome.succeeded, true);
  assert.equal(outcome.momentum, 3);
}

{
  const outcome = evaluateDuneTest({
    results: [16],
    target: 16,
    focusThreshold: 1,
    complicationRange: 16,
    difficulty: 1
  });

  assert.equal(outcome.successes, 1);
  assert.equal(outcome.complications, 1);
  assert.equal(outcome.succeeded, true);
  assert.equal(outcome.momentum, 0);
}

{
  const outcome = evaluateDuneTest({
    results: [10],
    target: 12,
    focusThreshold: 4,
    complicationRange: 20,
    difficulty: 2,
    determination: true
  });

  assert.equal(outcome.dice.length, 2);
  assert.equal(outcome.successes, 3);
  assert.equal(outcome.momentum, 1);
  assert.equal(outcome.dice.at(-1).determination, true);
}

{
  const outcome = evaluateDuneTest({
    results: [19, 20],
    target: 10,
    focusThreshold: 1,
    complicationRange: 20,
    difficulty: 1
  });

  assert.equal(outcome.successes, 0);
  assert.equal(outcome.complications, 1);
  assert.equal(outcome.succeeded, false);
  assert.equal(outcome.momentum, 0);
}

console.log("Dune test domain checks passed.");
