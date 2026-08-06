import assert from "node:assert/strict";
import {
  buildRetentionPlan,
  lockInitiativeRetention,
  markCombatantsActed,
  normalizeCombatState,
  oppositeCombatSide,
  resetCombatRoundState
} from "../scripts/domain/combat-state.mjs";

const fresh = normalizeCombatState({
  state: null,
  combatId: "combat-1",
  round: 1,
  combatantIds: ["p1", "e1"]
});
assert.equal(fresh.activeSide, "players");
assert.deepEqual(fresh.actedCombatantIds, []);
assert.equal(fresh.retainLockedSide, null);

const firstLock = lockInitiativeRetention(fresh);
assert.equal(firstLock.ok, true);
assert.equal(firstLock.state.retainLockedSide, "players");
assert.equal(lockInitiativeRetention(firstLock.state).reason, "retain-locked");

const playerActed = markCombatantsActed({
  state: firstLock.state,
  combatantIds: ["p1"],
  sideByCombatantId: { p1: "players", e1: "opposition" }
});
assert.equal(playerActed.retainLockedSide, "players");

const enemyActed = markCombatantsActed({
  state: playerActed,
  combatantIds: ["e1"],
  sideByCombatantId: { p1: "players", e1: "opposition" }
});
assert.equal(enemyActed.retainLockedSide, null);
assert.deepEqual(enemyActed.actedCombatantIds, ["p1", "e1"]);

const reset = resetCombatRoundState(enemyActed, { round: 2 });
assert.equal(reset.round, 2);
assert.equal(reset.activeSide, "players");
assert.deepEqual(reset.actedCombatantIds, []);
assert.equal(reset.retainLockedSide, null);
assert.equal(oppositeCombatSide("players"), "opposition");

const momentum = buildRetentionPlan({
  side: "players",
  payment: "momentum",
  cost: 2,
  momentum: 4,
  threat: 3
});
assert.equal(momentum.ok, true);
assert.equal(momentum.paymentKind, "momentum-spent");
assert.equal(momentum.momentumAfter, 2);
assert.equal(momentum.threatAfter, 3);

const addThreat = buildRetentionPlan({
  side: "players",
  payment: "threat",
  cost: 2,
  momentum: 0,
  threat: 3
});
assert.equal(addThreat.ok, true);
assert.equal(addThreat.paymentKind, "threat-added");
assert.equal(addThreat.threatAfter, 5);

const opposition = buildRetentionPlan({
  side: "opposition",
  payment: "threat",
  cost: 2,
  momentum: 4,
  threat: 3
});
assert.equal(opposition.ok, true);
assert.equal(opposition.paymentKind, "threat-spent");
assert.equal(opposition.threatAfter, 1);

const insufficient = buildRetentionPlan({
  side: "players",
  payment: "momentum",
  cost: 2,
  momentum: 1,
  threat: 3
});
assert.equal(insufficient.ok, false);
assert.equal(insufficient.reason, "insufficient-pool");
assert.equal(insufficient.available, 1);

assert.equal(buildRetentionPlan({
  side: "players",
  payment: "momentum",
  cost: 7,
  momentum: 10,
  threat: 0
}).reason, "invalid-cost");

assert.equal(buildRetentionPlan({
  side: "players",
  payment: "invalid",
  cost: 2,
  momentum: 10,
  threat: 0
}).reason, "invalid-payment");

console.log("Combat state checks passed.");
