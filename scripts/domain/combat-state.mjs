export const COMBAT_SIDES = Object.freeze({
  players: "players",
  opposition: "opposition"
});

export const RETENTION_PAYMENTS = Object.freeze({
  momentum: "momentum",
  threat: "threat"
});

export function oppositeCombatSide(side) {
  return side === COMBAT_SIDES.opposition
    ? COMBAT_SIDES.players
    : COMBAT_SIDES.opposition;
}

export function normalizeCombatState({
  state,
  combatId,
  round = 0,
  combatantIds = []
}) {
  const source = state && typeof state === "object" ? state : {};
  const validIds = new Set(combatantIds.map(String));
  const sameCombat = Boolean(combatId) && source.combatId === combatId;

  if (!sameCombat) {
    return {
      version: 2,
      combatId: combatId ?? null,
      round: integerOr(round, 0),
      activeSide: COMBAT_SIDES.players,
      actedCombatantIds: [],
      retainLockedSide: null,
      history: []
    };
  }

  return {
    version: 2,
    combatId,
    round: integerOr(source.round, integerOr(round, 0)),
    activeSide: source.activeSide === COMBAT_SIDES.opposition
      ? COMBAT_SIDES.opposition
      : COMBAT_SIDES.players,
    actedCombatantIds: Array.isArray(source.actedCombatantIds)
      ? [...new Set(source.actedCombatantIds.map(String).filter((id) => validIds.has(id)))]
      : [],
    retainLockedSide: isCombatSide(source.retainLockedSide)
      ? source.retainLockedSide
      : null,
    history: Array.isArray(source.history) ? source.history.slice(-100) : []
  };
}

export function markCombatantsActed({ state, combatantIds, sideByCombatantId }) {
  const ids = [...new Set((combatantIds ?? []).map(String).filter(Boolean))];
  const next = cloneState(state);
  next.actedCombatantIds = [...new Set([...next.actedCombatantIds, ...ids])];

  if (
    next.retainLockedSide
    && ids.some((id) => sideByCombatantId?.[id] !== next.retainLockedSide)
  ) {
    next.retainLockedSide = null;
  }

  return next;
}

export function markCombatantsAvailable({ state, combatantIds }) {
  const ids = new Set((combatantIds ?? []).map(String));
  const next = cloneState(state);
  next.actedCombatantIds = next.actedCombatantIds.filter((id) => !ids.has(id));
  return next;
}

export function lockInitiativeRetention(state) {
  const next = cloneState(state);
  if (next.retainLockedSide === next.activeSide) {
    return { ok: false, reason: "retain-locked", state: next };
  }
  next.retainLockedSide = next.activeSide;
  return { ok: true, state: next };
}

export function resetCombatRoundState(
  state,
  { round = state?.round ?? 0, activeSide = COMBAT_SIDES.players } = {}
) {
  const next = cloneState(state);
  next.round = integerOr(round, 0);
  next.activeSide = isCombatSide(activeSide) ? activeSide : COMBAT_SIDES.players;
  next.actedCombatantIds = [];
  next.retainLockedSide = null;
  return next;
}

export function buildRetentionPlan({
  side,
  payment = RETENTION_PAYMENTS.momentum,
  cost,
  momentum,
  threat
}) {
  if (!isCombatSide(side)) {
    return { ok: false, reason: "invalid-side" };
  }

  const normalizedCost = Number(cost);
  if (!Number.isInteger(normalizedCost) || normalizedCost < 0 || normalizedCost > 6) {
    return { ok: false, reason: "invalid-cost" };
  }

  const currentMomentum = nonNegativeInteger(momentum);
  const currentThreat = nonNegativeInteger(threat);
  if (currentMomentum === null || currentThreat === null) {
    return { ok: false, reason: "invalid-pools" };
  }

  if (normalizedCost === 0) {
    return {
      ok: true,
      cost: 0,
      paymentKind: "none",
      momentumBefore: currentMomentum,
      momentumAfter: currentMomentum,
      threatBefore: currentThreat,
      threatAfter: currentThreat
    };
  }

  if (side === COMBAT_SIDES.players && payment === RETENTION_PAYMENTS.threat) {
    return {
      ok: true,
      cost: normalizedCost,
      paymentKind: "threat-added",
      momentumBefore: currentMomentum,
      momentumAfter: currentMomentum,
      threatBefore: currentThreat,
      threatAfter: currentThreat + normalizedCost
    };
  }

  if (
    side === COMBAT_SIDES.players
    && payment !== RETENTION_PAYMENTS.momentum
  ) {
    return { ok: false, reason: "invalid-payment" };
  }

  const pool = side === COMBAT_SIDES.opposition ? "threat" : "momentum";
  const available = pool === "momentum" ? currentMomentum : currentThreat;
  if (available < normalizedCost) {
    return {
      ok: false,
      reason: "insufficient-pool",
      pool,
      available,
      required: normalizedCost
    };
  }

  return {
    ok: true,
    cost: normalizedCost,
    paymentKind: pool === "momentum" ? "momentum-spent" : "threat-spent",
    momentumBefore: currentMomentum,
    momentumAfter: pool === "momentum" ? currentMomentum - normalizedCost : currentMomentum,
    threatBefore: currentThreat,
    threatAfter: pool === "threat" ? currentThreat - normalizedCost : currentThreat
  };
}

function cloneState(state) {
  const source = state && typeof state === "object" ? state : {};
  return {
    ...source,
    actedCombatantIds: Array.isArray(source.actedCombatantIds)
      ? [...source.actedCombatantIds]
      : [],
    history: Array.isArray(source.history) ? [...source.history] : []
  };
}

function isCombatSide(value) {
  return value === COMBAT_SIDES.players || value === COMBAT_SIDES.opposition;
}

function integerOr(value, fallback) {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : fallback;
}

function nonNegativeInteger(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
}
