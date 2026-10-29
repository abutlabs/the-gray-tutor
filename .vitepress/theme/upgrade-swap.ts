// Lesson 17.10's widget: upgrade swaps the hash, not the code. Service 0's record from the
// upgrade_service-1 vector (code hash 0xdd0eb77dee… and least gases 10, 10) takes the call
// for 1,028 gas and becomes 0xc0f2ef8d43…, 123, 456 — but the next run finds code by its
// hash among the service's own preimages, so upgrading before soliciting the new code
// leaves a service that can't run at all until someone provides it.
// tools/widget-upgrade-swap.test.ts checks every value against the lesson and the vector.

export const OLD_HASH = "0xdd0eb77dee…";
export const NEW_HASH = "0xc0f2ef8d43…";
export const OLD_GASES: [number, number] = [10, 10];
export const NEW_GASES: [number, number] = [123, 456];
export const UPGRADE_COST = 1028;
export const VECTOR_RUN_GAS = 139_939; // what service 0's whole run uses in the vector

export type Step = "solicited" | "upgraded" | "ranNext" | "provided";

/** Service 0 as the reader has built it: which steps were taken, in which order. */
export type Story = Step[];

/** The record after the steps so far. */
export function record(story: Story): { codeHash: string; gases: [number, number] } {
  return story.includes("upgraded") ? { codeHash: NEW_HASH, gases: NEW_GASES } : { codeHash: OLD_HASH, gases: OLD_GASES };
}

/** Whether the service holds the preimage its code hash names. */
export function holdsItsCode(story: Story): boolean {
  if (!story.includes("upgraded")) return true; // the old code was always there
  return story.includes("solicited") || story.includes("provided");
}

/** What the last step did, in a sentence of real values. */
export function says(story: Story): string {
  const last = story[story.length - 1];
  if (last === undefined) return `Service 0 runs code ${OLD_HASH}, least gases ${OLD_GASES.join(" and ")}. Upgrade now, or ask for the new code first.`;
  if (last === "solicited")
    return `Solicited and provided: the preimage of ${NEW_HASH} now sits among service 0's own preimages, ready before anything names it.`;
  if (last === "upgraded")
    return `Call 20, ${UPGRADE_COST.toLocaleString("en-US")} gas, φ₇ = OK — never refused, no privilege asked. The record now names ${NEW_HASH} with least gases ${NEW_GASES.join(" and ")}. This run carries on with the old code already loaded.`;
  if (last === "provided")
    return `A block provided the preimage of ${NEW_HASH}. The stalled service has code again.`;
  return holdsItsCode(story)
    ? `The next run looks ${NEW_HASH} up among service 0's preimages, finds it, and runs the new code — the vector's run uses exactly ${VECTOR_RUN_GAS.toLocaleString("en-US")} gas.`
    : `The next run looks ${NEW_HASH} up among service 0's preimages and finds nothing: no preimage under the code hash means no code. The service can't run at all until someone provides it.`;
}
