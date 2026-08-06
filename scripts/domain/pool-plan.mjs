export const POOL_NAMES = Object.freeze({
  momentum: "momentum",
  threat: "threat"
});

export const DEFAULT_MOMENTUM_MAXIMUM = 6;

function nonNegativeInteger(value, name) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new RangeError(`${name} must be a non-negative integer.`);
  }
  return parsed;
}

function normalizePoolValues(values, name) {
  return {
    momentum: nonNegativeInteger(values?.momentum ?? 0, `${name}.momentum`),
    threat: nonNegativeInteger(values?.threat ?? 0, `${name}.threat`)
  };
}

/**
 * Build the shared-resource changes proposed by a guided test.
 *
 * The plan remains data only. It does not mutate Foundry or upstream state.
 */
export function buildGuidedTestPoolPlan({
  extraDiceSource = "none",
  extraDiceCost = 0,
  momentumGenerated = 0
} = {}) {
  const cost = nonNegativeInteger(extraDiceCost, "extraDiceCost");
  const generated = nonNegativeInteger(momentumGenerated, "momentumGenerated");

  const deltas = {
    momentum: generated,
    threat: 0
  };

  if (cost > 0 && extraDiceSource === "momentum") {
    deltas.momentum -= cost;
  } else if (cost > 0 && extraDiceSource === "threat") {
    deltas.threat += cost;
  }

  return {
    version: 1,
    source: String(extraDiceSource),
    cost,
    generated,
    deltas,
    hasChanges: deltas.momentum !== 0 || deltas.threat !== 0
  };
}

/**
 * Calculate target pool values before any persistent write is attempted.
 *
 * Momentum is capped at the configured maximum. Insufficient resources fail
 * before an adapter is called, which prevents a partial spend.
 */
export function calculatePoolTargets({
  current,
  plan,
  momentumMaximum = DEFAULT_MOMENTUM_MAXIMUM
}) {
  const before = normalizePoolValues(current, "current");
  const maximum = nonNegativeInteger(momentumMaximum, "momentumMaximum");
  const deltas = {
    momentum: Number(plan?.deltas?.momentum ?? 0),
    threat: Number(plan?.deltas?.threat ?? 0)
  };

  if (!Number.isInteger(deltas.momentum) || !Number.isInteger(deltas.threat)) {
    throw new TypeError("Pool deltas must be integers.");
  }

  const requestedMomentum = before.momentum + deltas.momentum;
  const requestedThreat = before.threat + deltas.threat;

  if (requestedMomentum < 0) {
    const error = new RangeError("Not enough Momentum for this transaction.");
    error.code = "INSUFFICIENT_MOMENTUM";
    error.available = before.momentum;
    error.required = Math.abs(Math.min(0, deltas.momentum));
    throw error;
  }

  if (requestedThreat < 0) {
    const error = new RangeError("Not enough Threat for this transaction.");
    error.code = "INSUFFICIENT_THREAT";
    error.available = before.threat;
    error.required = Math.abs(Math.min(0, deltas.threat));
    throw error;
  }

  const after = {
    momentum: Math.min(maximum, requestedMomentum),
    threat: requestedThreat
  };

  return {
    before,
    after,
    deltas: {
      momentum: after.momentum - before.momentum,
      threat: after.threat - before.threat
    },
    discardedMomentum: Math.max(0, requestedMomentum - after.momentum),
    changedPools: Object.values(POOL_NAMES).filter((pool) => before[pool] !== after[pool])
  };
}
