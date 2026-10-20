// Lesson 6.2's state root: lesson 6.1's trie (trie.ts) over a real state, the 21 entries
// before the fallback trace's first block, each named as 6.2's `describe` names its key. Its
// root is the one the block's header promises; change a value that sits in its leaf and it
// isn't any more. tools/widget-state-root.test.ts checks it against the trace and lesson 6.2.

import { toHex } from "./bytes.ts";
import { ENTRIES, PROMISED, type StateEntry } from "./fallback-state.ts";
import { COMPONENTS } from "./state-keys.ts";
import { H } from "./hash.ts";
import { branchNode, build, type Entry, fitsInLeaf, hashesOf, leafNode, leavesOf, type Node, nodesOf, rootOf } from "./trie.ts";

export const bytesOf = (hex: string): number[] => (hex.slice(2).match(/../g) ?? []).map((b) => parseInt(b, 16));
const size = (n: number) => n.toLocaleString("en-US");

/** What a key is, as 6.2's `describe` reads it back and its table names it; a few words to
 *  label its leaf; and fewer, for a phone. */
export function nameOf(e: StateEntry): { title: string; label: string; tag: string } {
  const key = bytesOf(e.key);
  if (key[0] === 255 && key.slice(8).every((b) => b === 0)) return { title: "C(255, 0): service 0's account", label: "C(255, 0) account", tag: "account" };
  if (key.slice(1).every((b) => b === 0)) {
    const label = `C(${key[0]}) ${COMPONENTS[key[0]].split(",")[0]}`; // C(8) κ
    return { title: `C(${key[0]}): ${COMPONENTS[key[0]]}`, label, tag: label };
  }
  const [what, of] = e.of!;
  if (what === "request") return { title: `C(0, h): service 0's request for its ${size(of)}-byte preimage`, label: "C(0, h) request", tag: "request" };
  return what === "code"
    ? { title: `C(0, h): a preimage service 0 keeps, ${size(of)} bytes: its code`, label: "C(0, h) code", tag: "code" }
    : { title: `C(0, h): a preimage service 0 keeps, ${size(of)} bytes`, label: "C(0, h) preimage", tag: "preimage" };
}

/** The trie's entries, with any values the reader has changed (by key). */
export function entriesWith(changed: Map<string, string>): Entry[] {
  return ENTRIES.map((e) => {
    const value = changed.get(e.key) ?? e.value;
    return value === undefined
      ? { key: bytesOf(e.key), size: e.size, hash: bytesOf(e.hash!) }
      : { key: bytesOf(e.key), size: bytesOf(value).length, value: bytesOf(value) };
  });
}

/** The state's trie and root, with those changes, and whether the root is the promised one. */
export function stateRoot(changed = new Map<string, string>()): { trie: Node; root: string; matches: boolean } {
  const trie = build(entriesWith(changed));
  const root = toHex(rootOf(trie));
  return { trie, root, matches: root === PROMISED };
}

export { ENTRIES, PROMISED };

/** A side of a branch in a few words: a leaf by its name, a branch by its bits, or empty. */
function sideName(n: Node): string {
  if (n.kind === "empty") return "an empty side: no hash, 32 zero bytes";
  if (n.kind === "branch") return `the branch at ${n.path}`;
  return `${nameOf(ENTRIES.find((e) => e.key === toHex(n.entry.key))!).label}'s leaf`;
}

/** How a branch's hash is made, on real bytes: its two sides' hashes, the 64-byte node they
 *  make (the first bit cleared, to say branch), and the hash of that. */
export function branchSays(trie: Node, path: string) {
  const node = nodesOf(trie).find((n) => n.path === path);
  if (!node || node.kind !== "branch") throw new Error(`no branch at ${path}`);
  const hashes = hashesOf(trie);
  const [left, right] = [hashes.get(node.left.path)!, hashes.get(node.right.path)!];
  const bytes = branchNode(left, right);
  return {
    depth: path.length,
    leaves: leavesOf(node).length,
    sides: [node.left, node.right].map((n, bit) => ({ bit, name: sideName(n), hash: toHex(bit ? right : left) })),
    first: { before: left[0], after: bytes[0] },
    node: toHex(bytes),
    hash: toHex(H(bytes)),
  };
}

/** How a leaf's hash is made: its 64-byte node (a first byte saying leaf and how its value is
 *  held, the key's 31 bytes, the value padded to 32 or its hash), and the hash of that. */
export function leafSays(trie: Node, key: string) {
  const leaf = leavesOf(trie).find((l) => toHex(l.entry.key) === key)!;
  const bytes = leafNode(leaf.entry.key, leaf.entry.value ?? [], leaf.entry.hash);
  return { first: bytes[0], inside: fitsInLeaf(leaf.entry.size), node: toHex(bytes), hash: toHex(H(bytes)) };
}
