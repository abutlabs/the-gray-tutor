// Lesson 21.1's widget: the blocks a node keeps, as a tree. A block is kept under its
// header's hash and hangs from the block its parent hash names; two blocks on one parent
// are a fork; a block with no child is a tip; a block whose parent hasn't come is an
// orphan and is not kept; the same block twice is one block. The blocks are real: the
// traces' shared genesis and block 1, then `fallback`'s blocks 2 and 3 on one side and
// `storage`'s on the other. tools/widget-block-tree.test.ts checks them.

export type Piece = { id: string; label: string; slot: number; hash: string; parent: string | null; carries: string };

export const GENESIS: Piece = { id: "g", label: "genesis", slot: 0, hash: "0x245becfe7f091e38", parent: null, carries: "the state every trace starts from" };
export const BLOCKS: Piece[] = [
  { id: "b1", label: "block 1", slot: 1, hash: "0x5592b088d8760232", parent: GENESIS.hash, carries: "empty" },
  { id: "b2", label: "block 2", slot: 2, hash: "0x3d27225ddf67aba7", parent: "0x5592b088d8760232", carries: "empty" },
  { id: "b2x", label: "block 2′", slot: 2, hash: "0x88502d3d3a62d26c", parent: "0x5592b088d8760232", carries: "one guarantee" },
  { id: "b3", label: "block 3", slot: 3, hash: "0xa8c292a99c86a343", parent: "0x3d27225ddf67aba7", carries: "empty" },
  { id: "b3x", label: "block 3′", slot: 3, hash: "0x9a9cac195d0bd7b6", parent: "0x88502d3d3a62d26c", carries: "one guarantee, four assurances" },
];

/** The tree: the blocks kept, in the order they came. It starts with genesis. */
export type Tree = Piece[];
export const start = (): Tree => [GENESIS];

/** The node's answer to one block, and the tree after. */
export function add(tree: Tree, id: string): { tree: Tree; reply: string } {
  const b = BLOCKS.find((x) => x.id === id)!;
  if (tree.some((k) => k.hash === b.hash)) return { tree, reply: `${b.label} is already kept: the same block twice is one block` };
  const parent = tree.find((k) => k.hash === b.parent);
  if (!parent) return { tree, reply: `${b.label} is an orphan: its parent ${b.parent}… hasn't come, so there is no state to import it onto. Nothing kept` };
  const fork = tree.some((k) => k.parent === parent.hash);
  return { tree: [...tree, b], reply: `${b.label} imported onto the state after ${parent.label}${fork ? `: a fork, ${parent.label} has two children now` : ""}` };
}

/** The tips: the kept blocks with no child yet. */
export const tips = (tree: Tree): Piece[] => tree.filter((k) => !tree.some((c) => c.parent === k.hash));

/** A block's ancestors (GP 5.3): itself, its parent, and so on, newest first. */
export function ancestors(tree: Tree, hash: string): Piece[] {
  const line: Piece[] = [];
  for (let at = tree.find((k) => k.hash === hash); at; at = tree.find((k) => k.hash === at!.parent)) line.push(at);
  return line;
}

/** The tree as rows to draw: each block under its parent, indented by how deep it is. */
export function rows(tree: Tree): { block: Piece; depth: number }[] {
  const out: { block: Piece; depth: number }[] = [];
  const walk = (b: Piece, depth: number) => {
    out.push({ block: b, depth });
    for (const c of tree.filter((k) => k.parent === b.hash)) walk(c, depth + 1);
  };
  walk(tree[0], 0);
  return out;
}
