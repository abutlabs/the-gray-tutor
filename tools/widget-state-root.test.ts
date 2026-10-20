// Lesson 6.2's state root (.vitepress/theme/state-root.ts, fallback-state.ts, StateRoot.vue):
// the state `npm run state-fallback` reads, read again from the trace, named by 6.2's key
// recipes, and hashed by lesson 6.1's trie to the root the block's header promises.

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { toHex } from "../.vitepress/theme/bytes.ts";
import { ENTRIES, PROMISED } from "../.vitepress/theme/fallback-state.ts";
import { H } from "../.vitepress/theme/hash.ts";
import { branchSays, bytesOf, leafSays, nameOf, stateRoot } from "../.vitepress/theme/state-root.ts";
import { accountKey, bytesOf as cellBytes, componentKey, wovenKey } from "../.vitepress/theme/state-keys.ts";
import { build, hashesOf, leafFirstByte, leavesOf, nodesOf, rootOf } from "../.vitepress/theme/trie.ts";
import { lessonText, ROOT } from "./lessons.ts";

const FILE = join(ROOT, "vectors/traces/fallback/00000001.json");
const PAGE = lessonText("06-state-and-merklization/02-state-keys.md");
const le4 = (x: number) => [0, 1, 2, 3].map((i) => (x >>> (8 * i)) & 0xff);
const TIME = ENTRIES.find((e) => nameOf(e).title.startsWith("C(11)"))!.key;

test("the data is the fallback trace's first state, read again, and the root its header promises", { skip: !existsSync(FILE) && "no vectors/" }, () => {
  const trace = JSON.parse(readFileSync(FILE, "utf8"));
  assert.equal(PROMISED, trace.block.header.parent_state_root);
  assert.equal(PROMISED, trace.pre_state.state_root);
  const kv: { key: string; value: string }[] = trace.pre_state.keyvals;
  assert.equal(ENTRIES.length, kv.length);
  kv.forEach(({ key, value }, i) => {
    const bytes = bytesOf(value);
    assert.equal(ENTRIES[i].key, key);
    assert.equal(ENTRIES[i].size, bytes.length);
    if (bytes.length <= 32) assert.equal(ENTRIES[i].value, value);
    else assert.equal(ENTRIES[i].hash, toHex(H(bytes)), "a big value's hash, all the trie needs of it");
  });
  // the hashes stand in for the values faithfully: the same root from the whole values
  const whole = kv.map(({ key, value }) => ({ key: bytesOf(key), size: bytesOf(value).length, value: bytesOf(value) }));
  assert.equal(toHex(rootOf(build(whole))), PROMISED);
  // and with τ set to slot 1, the same root either way
  const timeOne = whole.map((e) => (toHex(e.key) === TIME ? { ...e, value: le4(1) } : e));
  assert.equal(stateRoot(new Map([[TIME, "0x01000000"]])).root, toHex(rootOf(build(timeOne))));
  // the preimage called the code is the one the account's code hash (its bytes 1 to 32) names
  const account = bytesOf(kv.find(({ key }) => key === toHex(cellBytes(accountKey(0))))!.value);
  assert.equal(ENTRIES.find((e) => e.of?.[0] === "code")!.hash, toHex(account.slice(1, 33)));
});

test("every key named by 6.2's recipes: 16 components, the account, service 0's code, a preimage, their requests", () => {
  for (const e of ENTRIES) {
    const key = bytesOf(e.key);
    const { title } = nameOf(e);
    const i = Number(/^C\((\d+)\):/.exec(title)?.[1]);
    if (i) assert.deepEqual(key, cellBytes(componentKey(i)), title);
    else if (title.startsWith("C(255, 0)")) assert.deepEqual(key, cellBytes(accountKey(0)), title);
    else {
      const [what, of] = e.of!;
      // a request's h is ℰ₄(l) ⌢ H(p); a preimage's is ℰ₄(2^32 − 2) ⌢ H(p), and we hold H(p)
      const preimage = ENTRIES.find((x) => x.of?.[0] !== "request" && x.of?.[1] === of)!;
      const hp = bytesOf(preimage.hash!);
      const h = what === "request" ? [...le4(of), ...hp] : [...le4(2 ** 32 - 2), ...hp];
      assert.deepEqual(key, cellBytes(wovenKey(0, H(h))), title);
    }
  }
  assert.deepEqual(ENTRIES.map((e) => e.of?.[0] ?? "component").filter((w) => w !== "component").sort(), ["code", "preimage", "request", "request"]);
});

test("the trie the page describes: the account alone at depth 1, service 0's keys deepest, τ redoes 9 hashes", () => {
  const { trie, root, matches } = stateRoot();
  assert.equal(root, PROMISED);
  assert.ok(matches);
  const depth = new Map(leavesOf(trie).map((l) => [toHex(l.entry.key), l.path.length]));
  const of = (pick: (e: (typeof ENTRIES)[number]) => boolean) => ENTRIES.filter(pick).map((e) => depth.get(e.key)!);
  assert.deepEqual(of((e) => e.key.startsWith("0xff")), [1]);
  const woven = of((e) => e.of !== null), components = of((e) => e.of === null && !e.key.startsWith("0xff"));
  assert.ok(ENTRIES.filter((e) => e.of).every((e) => e.key.startsWith("0x00")), "service 0's keys start with its id's first byte");
  assert.ok(Math.min(...woven) > Math.max(...components), "service 0's keys sit deepest");
  assert.equal(depth.get(TIME), 8); // so a change to τ redoes 8 branches and its leaf
  const changed = stateRoot(new Map([[TIME, "0x01000000"]]));
  assert.ok(!changed.matches);
  // three validator sets, one 2,017-byte value: the same hash
  assert.equal(new Set(ENTRIES.filter((e) => /^C\((7|8|9)\)/.test(nameOf(e).title)).map((e) => e.hash)).size, 1);
  const text = PAGE.replace(/\s+/g, " ");
  assert.match(text, /one file, `fallback\/00000001\.json`, whose 21 entries the script builds into the trie and hashes up to one root, then checks against the `parent_state_root` in the same file's block header/);
  assert.ok(PAGE.indexOf("<StateRoot />") > 0 && PAGE.indexOf("<StateRoot />") < PAGE.indexOf("## The tests"));
});

test("every branch and leaf is a hash, and each says how it was made: the root's is the state root", () => {
  for (const changed of [new Map<string, string>(), new Map([[TIME, "0x01000000"]])]) {
    const { trie, root } = stateRoot(changed);
    const hashes = hashesOf(trie);
    for (const n of nodesOf(trie)) {
      if (n.kind === "branch") {
        const b = branchSays(trie, n.path);
        const node = bytesOf(b.node);
        assert.equal(node.length, 64);
        assert.deepEqual(b.sides.map((x) => x.hash), [toHex(hashes.get(n.left.path)!), toHex(hashes.get(n.right.path)!)]);
        assert.equal(b.first.after, b.first.before & 0x7f, "the first bit cleared, to say branch");
        assert.equal(toHex(node.slice(1, 32)), b.sides[0].hash.replace(/^0x../, "0x"));
        assert.equal(toHex(node.slice(32)), b.sides[1].hash);
        assert.equal(b.hash, toHex(H(node)));
        assert.equal(b.hash, toHex(hashes.get(n.path)!));
        assert.equal(b.leaves, leavesOf(n).length);
      } else if (n.kind === "leaf") {
        const l = leafSays(trie, toHex(n.entry.key));
        assert.equal(l.first, leafFirstByte(n.entry.size));
        assert.equal(toHex(bytesOf(l.node).slice(1, 32)), toHex(n.entry.key));
        assert.equal(l.hash, toHex(hashes.get(n.path)!));
      }
    }
    assert.equal(branchSays(trie, "").hash, root);
  }
  assert.equal(branchSays(stateRoot().trie, "").hash, PROMISED);
  assert.deepEqual(branchSays(stateRoot().trie, "0000000000").first, { before: 0xe2, after: 0x62 }); // a first bit that is cleared
});
