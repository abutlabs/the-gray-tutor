// Lesson 6.1's widget: the state trie (Gray Paper, Appendix D). Entries sort by their key's
// bits, most significant first: no entries is 32 zero bytes, one is a leaf, more split into a
// branch on the next bit. Each node is hashed as lesson 6.1's merkle hashes it.
// tools/widget-trie.test.ts checks the shape against the depths lesson 6.1 prints for a real
// state, and the hashes against the official trie vectors.

import { H } from "./hash.ts";

/** A state key is 31 bytes. */
export const KEY_BYTES = 31;

/** One entry of the state: its key, how many bytes its value has, and (to hash it) the value,
 *  or, for a value too big for its leaf, just the value's hash: all the trie needs of it. */
export type Entry = { key: number[]; size: number; value?: number[]; hash?: number[] };

/** A node of the trie, named by its path: the key bits that lead to it from the root, so a
 *  node's depth is its path's length, and a branch splits on bit `path.length`. */
export type Node =
  | { kind: "empty"; path: string }
  | { kind: "leaf"; path: string; entry: Entry }
  | { kind: "branch"; path: string; left: Node; right: Node };

/** Bit i of a key, counting from the most significant bit of its first byte. 6.1's `bit`. */
export const bitOf = (key: number[], i: number): number => (key[Math.floor(i / 8)] >> (7 - (i % 8))) & 1;

/** The key whose first byte is `first`, and the other 30 bytes zero, as the widget's are. */
export const keyOf = (first: number): number[] => [first, ...Array<number>(KEY_BYTES - 1).fill(0)];

/** The trie of these entries, as 6.1's `merkle` walks it: none, one, or split on the next bit. */
export function build(entries: Entry[], path = ""): Node {
  if (entries.length === 0) return { kind: "empty", path };
  if (entries.length === 1) return { kind: "leaf", path, entry: entries[0] };
  if (path.length === 8 * KEY_BYTES) throw new Error("two entries share a key: a state holds one value per key");
  const side = (b: number) => entries.filter((e) => bitOf(e.key, path.length) === b);
  return { kind: "branch", path, left: build(side(0), `${path}0`), right: build(side(1), `${path}1`) };
}

/** Every node, parents before children, 0 side before 1 side. */
export function nodesOf(node: Node): Node[] {
  return node.kind === "branch" ? [node, ...nodesOf(node.left), ...nodesOf(node.right)] : [node];
}

/** The leaves, left to right: the entries in key order. */
export const leavesOf = (node: Node): Leaf[] => nodesOf(node).filter((n): n is Leaf => n.kind === "leaf");
export type Leaf = Extract<Node, { kind: "leaf" }>;

/** The hashes M takes on the way back up: one per leaf and per branch, plus one for each
 *  value too big for its leaf, hashed first. An empty side is 32 zeros, no hash. */
export const hashesTaken = (root: Node): number =>
  nodesOf(root).filter((n) => n.kind !== "empty").length + leavesOf(root).filter((l) => !fitsInLeaf(l.entry.size)).length;

/** What the root is the hash of, or the 32 zero bytes of no entries at all (GP App. D's M). */
export function rootIs(node: Node): "zeros" | "H(leaf)" | "H(branch)" {
  return node.kind === "empty" ? "zeros" : node.kind === "leaf" ? "H(leaf)" : "H(branch)";
}

/** A value fits in its leaf when it is at most 32 bytes; a bigger one is replaced by its hash. */
export const fitsInLeaf = (size: number): boolean => size <= 32;

/** A leaf's first byte: 1, 0 and six bits of the value's length when it fits; 1, 1 when the
 *  leaf holds the value's hash instead. 6.1's `leaf`. */
export const leafFirstByte = (size: number): number => (fitsInLeaf(size) ? 0b10000000 | size : 0b11000000);

/** The hashes a change to the value at the leaf with this path redoes: the leaf's own, and one
 *  for each branch above it, up to the root. */
export const hashesRedone = (leafPath: string): number => leafPath.length + 1;

// Drawing the trie top-down, as the lesson's picture is: each node at its depth's row, the
// leaves and empty sides side by side along the bottom, each branch above the middle of its two.

/** How wide a leaf's and an empty side's place is, in the drawing's units. */
export const SLOT = { leaf: 150, empty: 40 } as const; // a leaf fits its key, its bits and its value, with room

export type Placed = { node: Node; x: number; depth: number };
export type Edge = { from: Placed; to: Placed; bit: string };

/** Where each node goes: x across, its depth down; and the edges between them. A leaf and an
 *  empty side take `slot`'s room across. */
export function layout(root: Node, slot: { leaf: number; empty: number } = SLOT): { placed: Placed[]; edges: Edge[]; width: number; depth: number } {
  const placed: Placed[] = [];
  const edges: Edge[] = [];
  let at = 0;
  const place = (node: Node): Placed => {
    let here: Placed;
    if (node.kind === "branch") {
      const left = place(node.left), right = place(node.right);
      here = { node, x: (left.x + right.x) / 2, depth: node.path.length };
      edges.push({ from: here, to: left, bit: "0" }, { from: here, to: right, bit: "1" });
    } else {
      const w = slot[node.kind];
      here = { node, x: at + w / 2, depth: node.path.length };
      at += w;
    }
    placed.push(here);
    return here;
  };
  place(root);
  return { placed, edges, width: at, depth: Math.max(...placed.map((p) => p.depth)) };
}

// Hashing, as lesson 6.1's leaf, branch and merkle do.

/** A leaf node, 64 bytes: its first byte says leaf (1) and value inside (0, then its length)
 *  or value hashed (1); then the key's 31 bytes; then the value, or its hash. A big value's
 *  hash, when known, stands in for the value. */
export function leafNode(key: number[], value: number[], hash?: number[]): number[] {
  const node = Array<number>(64).fill(0);
  const inside = !hash && value.length <= 32;
  node[0] = inside ? 0b10000000 | value.length : 0b11000000;
  key.slice(0, KEY_BYTES).forEach((b, i) => { node[1 + i] = b; });
  (inside ? value : hash ?? H(value)).forEach((b, i) => { node[32 + i] = b; });
  return node;
}

/** A branch node, 64 bytes: the two sides' hashes, its first bit cleared to say branch. */
export function branchNode(left: number[], right: number[]): number[] {
  const node = [...left, ...right];
  node[0] &= 0b01111111;
  return node;
}

/** Every node's hash by its path (an empty side is 32 zero bytes): M of each subtrie. */
export function hashesOf(root: Node): Map<string, number[]> {
  const out = new Map<string, number[]>();
  const walk = (n: Node): number[] => {
    const h = n.kind === "empty" ? Array<number>(32).fill(0)
      : n.kind === "leaf" ? H(leafNode(n.entry.key, n.entry.value ?? [], n.entry.hash))
      : H(branchNode(walk(n.left), walk(n.right)));
    out.set(n.path, h);
    return h;
  };
  walk(root);
  return out;
}

/** The root of the trie: its top node's hash. */
export const rootOf = (root: Node): number[] => hashesOf(root).get("")!;

/** What the reader typed, as bytes: hex if it starts 0x and is whole bytes, else its text's
 *  UTF-8 bytes (one a letter, for plain letters). */
export function valueBytes(text: string): { bytes: number[]; as: "hex" | "text" } {
  if (/^0x([0-9a-fA-F]{2})*$/.test(text)) return { bytes: (text.slice(2).match(/../g) ?? []).map((b) => parseInt(b, 16)), as: "hex" };
  return { bytes: [...new TextEncoder().encode(text)], as: "text" };
}
