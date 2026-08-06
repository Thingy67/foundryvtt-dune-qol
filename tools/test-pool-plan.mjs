import assert from "node:assert/strict";
import {
  buildGuidedTestPoolPlan,
  calculatePoolTargets
} from "../scripts/domain/pool-plan.mjs";

{
  const plan = buildGuidedTestPoolPlan({
    extraDiceSource: "momentum",
    extraDiceCost: 3,
    momentumGenerated: 2
  });

  assert.equal(plan.deltas.momentum, -1);
  assert.equal(plan.deltas.threat, 0);
  assert.equal(plan.hasChanges, true);
}

{
  const plan = buildGuidedTestPoolPlan({
    extraDiceSource: "threat",
    extraDiceCost: 3,
    momentumGenerated: 2
  });

  assert.equal(plan.deltas.momentum, 2);
  assert.equal(plan.deltas.threat, 3);
}

{
  const targets = calculatePoolTargets({
    current: { momentum: 5, threat: 1 },
    plan: {
      source: "other",
      cost: 0,
      deltas: { momentum: 3, threat: 2 }
    }
  });

  assert.deepEqual(targets.after, { momentum: 6, threat: 3 });
  assert.equal(targets.discardedMomentum, 2);
  assert.deepEqual(targets.changedPools, ["momentum", "threat"]);
}

assert.throws(
  () => calculatePoolTargets({
    current: { momentum: 1, threat: 0 },
    plan: {
      source: "momentum",
      cost: 3,
      generated: 3,
      deltas: { momentum: 0, threat: 0 }
    }
  }),
  (error) => error.code === "INSUFFICIENT_MOMENTUM"
    && error.available === 1
    && error.required === 3
);

assert.throws(
  () => calculatePoolTargets({
    current: { momentum: 1, threat: 0 },
    plan: {
      source: "other",
      cost: 0,
      deltas: { momentum: -3, threat: 0 }
    }
  }),
  (error) => error.code === "INSUFFICIENT_MOMENTUM"
);

console.log("Pool plan checks passed.");
