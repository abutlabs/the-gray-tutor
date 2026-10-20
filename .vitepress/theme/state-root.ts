// Lesson 6.2's state root: lesson 6.1's trie (trie.ts) over a real state, the 21 entries
// before the fallback trace's first block, each named as 6.2's `describe` names its key. Its
// root is the one the block's header promises; change a value that sits in its leaf and it
// isn't any more. tools/widget-state-root.test.ts checks it against the trace and lesson 6.2.

import { toHex } from "./bytes.ts";
import { ENTRIES, PROMISED, type StateEntry } from "./fallback-state.ts";
import { COMPONENTS } from "./state-keys.ts";
import { build, type Entry, type Node, rootOf } from "./trie.ts";

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
