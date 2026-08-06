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
    plan: { deltas: { momentum: 3, threat: 2 } }
  });

  assert.deepEqual(targets.after, { momentum: 6, threat: 3 });
  assert.equal(targets.discardedMomentum, 2);
  assert.deepEqual(targets.changedPools, ["momentum", "threat"]);
}

assert.throws(
  () => calculatePoolTargets({
    current: { momentum: 1, threat: 0 },
    plan: { deltas: { momentum: -3, threat: 0 } }
  }),
  (error) => error.code === "INSUFFICIENT_MOMENTUM"
);

console.log("Pool plan checks passed.");
