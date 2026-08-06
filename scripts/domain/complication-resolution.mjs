function nonNegativeInteger(value, name) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new RangeError(`${name} must be a non-negative integer.`);
  }
  return parsed;
}

export function summarizeComplicationResolution({
  complications = 0,
  createdTraits = []
} = {}) {
  const total = nonNegativeInteger(complications, "complications");
  const traits = Array.isArray(createdTraits) ? createdTraits : [];
  const resolved = Math.min(total, traits.length);

  return {
    total,
    resolved,
    remaining: Math.max(0, total - resolved),
    complete: total > 0 && resolved >= total,
    createdTraits: traits
  };
}

export function appendCreatedComplicationTrait({
  complications,
  createdTraits = [],
  trait
}) {
  const summary = summarizeComplicationResolution({ complications, createdTraits });
  if (summary.remaining < 1) {
    const error = new RangeError("All complications have already been resolved.");
    error.code = "COMPLICATIONS_ALREADY_RESOLVED";
    throw error;
  }

  if (!trait || typeof trait !== "object" || !String(trait.uuid ?? "").trim()) {
    throw new TypeError("A created Trait record with a UUID is required.");
  }

  return [...summary.createdTraits, { ...trait }];
}
