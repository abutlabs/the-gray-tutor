// Lesson 6.1's widget: the shape of the state trie (Gray Paper, Appendix D). Entries sort by
// their key's bits, most significant first: no entries is 32 zero bytes, one is a leaf, more
// split into a branch on the next bit. tools/widget-trie.test.ts checks it against the depths
// lesson 6.1 prints for a real state.

/** A state key is 31 bytes. */
export const KEY_BYTES = 31;

/** One entry of the state: its key, and how many bytes its value has. */
export type Entry = { key: number[]; size: number };

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
export const SLOT = { leaf: 76, empty: 26 } as const; // a leaf fits its key's bits, 0b00000001, with room

export type Placed = { node: Node; x: number; depth: number };
export type Edge = { from: Placed; to: Placed; bit: string };

/** Where each node goes: x across, its depth down; and the edges between them. */
export function layout(root: Node): { placed: Placed[]; edges: Edge[]; width: number; depth: number } {
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
      const w = SLOT[node.kind];
      here = { node, x: at + w / 2, depth: node.path.length };
      at += w;
    }
    placed.push(here);
    return here;
  };
  place(root);
  return { placed, edges, width: at, depth: Math.max(...placed.map((p) => p.depth)) };
}
