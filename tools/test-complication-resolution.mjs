import assert from "node:assert/strict";
import {
  appendCreatedComplicationTrait,
  summarizeComplicationResolution
} from "../scripts/domain/complication-resolution.mjs";

{
  const summary = summarizeComplicationResolution({
    complications: 2,
    createdTraits: [{ uuid: "Item.1" }]
  });

  assert.deepEqual(
    {
      total: summary.total,
      resolved: summary.resolved,
      remaining: summary.remaining,
      complete: summary.complete
    },
    { total: 2, resolved: 1, remaining: 1, complete: false }
  );
}

{
  const traits = appendCreatedComplicationTrait({
    complications: 2,
    createdTraits: [{ uuid: "Item.1", name: "First" }],
    trait: { uuid: "Item.2", name: "Second", temporary: true }
  });

  assert.equal(traits.length, 2);
  assert.equal(traits[1].uuid, "Item.2");
}

assert.throws(
  () => appendCreatedComplicationTrait({
    complications: 1,
    createdTraits: [{ uuid: "Item.1" }],
    trait: { uuid: "Item.2" }
  }),
  (error) => error.code === "COMPLICATIONS_ALREADY_RESOLVED"
);

console.log("Complication resolution checks passed.");
