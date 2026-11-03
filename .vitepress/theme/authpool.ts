// Lesson 13.1's widget: one core's authorizer pool (GP §8), fed from its queue. Each block a
// guarantee's authorizer leaves (its leftmost copy), the queue's entry for the slot joins on
// the right, and the pool keeps its newest O. Authorizers are letters here, not hashes.
// tools/widget-authorizer-pool.test.ts checks it against the lesson's own values.

/** O: the most authorizers a core's pool holds. */
export const POOL_SIZE = 8;

/** Q: the length of each core's queue, read like a wheel. */
export const QUEUE_SIZE = 80;

/** An authorizer in the pool, and the slot it joined at (the widget shows how old each is). */
export type Entry = { auth: string; joined: number };

/** One block's change to the pool: what left, what joined, what dropped off the front. */
export type Step = {
  slot: number; // τ′
  before: Entry[]; // α[c]
  after: Entry[]; // α′[c]
  used: string | null; // the authorizer this block's guarantee on the core used, if any
  usedAt: number | null; // where in `before` the copy that left stood: the leftmost
  index: number; // τ′ mod Q: the queue's entry that joined
  joined: string;
  droppedAt: number[]; // where in `before` the ones that fell off the front stood
};

/** The queue's entry a block at this slot reads: τ′ mod Q, going round every 80 slots. */
export const queueIndex = (slot: number): number => slot % QUEUE_SIZE;

/** Where entry i sits on the wheel before it turns, in degrees clockwise from the top. */
export const entryAngle = (i: number): number => (i * 360) / QUEUE_SIZE;

/**
 * How far the wheel has turned by slot τ′: one notch of 360/Q degrees per slot. It never
 * wraps back to 0, so past entry 79 the wheel keeps turning the same way.
 */
export const wheelTurn = (slot: number): number => (slot * 360) / QUEUE_SIZE;

/** The entry under the pointer at the top once the wheel has turned for slot τ′. */
export function atPointer(slot: number): number {
  const top = (i: number) => (((entryAngle(i) - wheelTurn(slot)) % 360) + 360) % 360 === 0;
  return [...Array(QUEUE_SIZE).keys()].find(top)!;
}

/** Where the leftmost copy of an authorizer stands in a pool, or -1 if it isn't there. */
export const leftmost = (pool: Entry[], auth: string): number => pool.findIndex((e) => e.auth === auth);

/**
 * α′[c] (GP §8), as lesson 13.1's nextPools makes it: the used authorizer's leftmost copy
 * leaves, ϕ′[c][τ′ mod Q] joins on the right, and the pool keeps its newest O.
 */
export function nextPool(before: Entry[], queue: string[], used: string | null, slot: number): Step {
  const left = [...before];
  const at = used === null ? -1 : leftmost(before, used);
  if (at >= 0) left.splice(at, 1); // the rest close up behind it
  const index = queueIndex(slot);
  const grown = [...left, { auth: queue[index], joined: slot }];
  const after = grown.slice(-POOL_SIZE);
  const dropped = grown.slice(0, grown.length - after.length);
  return {
    slot,
    before,
    after,
    used,
    usedAt: at >= 0 ? at : null,
    index,
    joined: queue[index],
    droppedAt: dropped.map((e) => before.indexOf(e)),
  };
}

/** The pool after blocks at slots 1 to `slot`, from an empty one, and the last block's step. */
export function replay(queue: string[], uses: Record<number, string>, slot: number): { pool: Entry[]; last: Step | null } {
  let pool: Entry[] = [];
  let last: Step | null = null;
  for (let s = 1; s <= slot; s++) {
    last = nextPool(pool, queue, uses[s] ?? null, s);
    pool = last.after;
  }
  return { pool, last };
}

/** A pool's authorizers, left (oldest) to right (newest). */
export const names = (pool: Entry[]): string[] => pool.map((e) => e.auth);

/** Each authorizer in a pool once, in the order they first appear. */
export const distinct = (pool: Entry[]): string[] => [...new Set(names(pool))];

/** A queue of 80 letters, A to H, mixed so the pool often holds a letter twice. */
export const MIXED: string[] = [..."EECDCDCCBDEAGCAECBEHGCEFDHGFGFBFEHCHHCEDCFEFHEEGCHDDDFCBGHGAGADCHHECGEFDFCDHDAAF"];

/** The queue the lesson's real trace has: one authorizer, 80 times over. */
export const SAME: string[] = Array.from({ length: QUEUE_SIZE }, () => "A");
