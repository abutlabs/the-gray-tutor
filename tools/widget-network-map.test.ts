// JAM at a glance's network widget (.vitepress/theme/network-map.ts): lesson 7.2's Q and F,
// lesson 12.1's P, and the reports vector report_prev_rotation-1, whose own guarantee is
// signed by the validators this shuffle seats on its core, on tiny and on full.

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ETA2 as TINY_ETA2 } from "../.vitepress/theme/guarantors.ts";
import { coresAt, enough, epochOf, ETA2, ETA3, guarantorsOf, NETWORKS, numbersFromHash, rotationOf, SIGNED, type Size } from "../.vitepress/theme/network-map.ts";
import { DECKS } from "../.vitepress/theme/shuffle-steps.ts";
import { lessonCode, lessonText, ROOT } from "./lessons.ts";

const fromHex = (hex: string) => (hex.slice(2).match(/../g) ?? []).map((b) => parseInt(b, 16));
const SIZES: Size[] = ["tiny", "full"];

test("Q draws lesson 7.2's numbers: the all-ff hash's eight, and 12.1's tiny η′₂ six", () => {
  assert.deepEqual(numbersFromHash(Array(32).fill(0xff), 8), DECKS[1].numbers);
  assert.deepEqual(numbersFromHash(fromHex(ETA2), 6), TINY_ETA2.numbers);
  assert.ok(ETA2.startsWith(TINY_ETA2.hex.replace("…", "")), "the same η′₂ as 12.1's widget");
  assert.match(lessonCode("7.2"), /const block = blake2b256\(concatBytes\(h, encodeFixed\(BigInt\(Math\.floor\(i \/ 8\)\), 4\)\)\);/);
});

test("P seats three validators on every core, and every R slots each one moves on one core", () => {
  assert.match(lessonCode("12.1"), /return shuffled\.map\(\(core\) => \(core \+ turns\) % activeCores\);/);
  for (const size of SIZES) {
    const { validators, cores, R } = NETWORKS[size];
    const { first, last } = epochOf(size);
    for (let slot = first; slot <= last; slot += R) {
      const seats = coresAt(size, slot);
      for (let c = 0; c < cores; c++) assert.equal(guarantorsOf(seats, c).length, 3, `${size} slot ${slot} core ${c}`);
      if (slot + R <= last) {
        const next = coresAt(size, slot + R);
        seats.forEach((c, v) => assert.equal(next[v], (c + 1) % cores, `${size}: validator ${v} moves on`));
      }
      assert.equal(new Set(seats).size, cores);
      assert.equal(seats.length, validators);
    }
  }
  assert.deepEqual([rotationOf("full", 605), rotationOf("full", 609), rotationOf("full", 610)], [0, 0, 1]);
  assert.deepEqual([enough(6), enough(1023)], [5, 683]);
});

test("the vector's entropy, slot and guarantee: its signers are the ones η′₃ seats on core 0", { skip: !existsSync(join(ROOT, "vectors/stf/reports")) && "no vectors/" }, () => {
  for (const size of SIZES) {
    const v = JSON.parse(readFileSync(join(ROOT, `vectors/stf/reports/${size}/report_prev_rotation-1.json`), "utf8"));
    assert.equal(v.pre_state.entropy[2], ETA2);
    assert.equal(v.pre_state.entropy[3], ETA3);
    assert.equal(v.input.slot, NETWORKS[size].slot);
    assert.equal(v.pre_state.curr_validators.length, NETWORKS[size].validators);
    const [g] = v.input.guarantees;
    const s = SIGNED[size];
    assert.deepEqual([g.report.core_index, g.slot, g.signatures.map((x: { validator_index: number }) => x.validator_index)], [s.core, s.slot, s.signers]);
    // made in the rotation before the block's, and the epoch before it: λ′ and η′₃ seat it
    const { E, R, slot } = NETWORKS[size];
    assert.notEqual(Math.floor(s.slot / R), Math.floor(slot / R));
    assert.notEqual(Math.floor(s.slot / E), Math.floor(slot / E));
    assert.deepEqual(guarantorsOf(coresAt(size, s.slot, ETA3), s.core), s.signers);
  }
});

test("JAM at a glance shows tiny alone, the start page only links it, and lesson 4.2, where full is met, shows both", () => {
  const page = lessonText("jam-at-a-glance.md");
  assert.equal(page.split('<JamNetwork only="tiny" />').length, 2);
  const plain = page.replace(/\s+/g, " ");
  assert.match(plain, /Here it is in miniature: \*tiny\*, the small configuration your client tests on, with 6 validators and 2 cores, whose guarantors switch every 4 slots \(24 seconds\)\./);
  assert.equal(NETWORKS.tiny.R * 6, 24, "4 slots of 6 seconds");
  assert.doesNotMatch(page, /1,023|341/, "no full-size numbers before 4.2");
  assert.match(page, /The real network works the same way, only bigger: \[lesson 4\.2\]\(\.\/04-blocks\/02-tiny-and-full\.md\) shows it\./);
  const start = lessonText("index.md");
  assert.doesNotMatch(start, /<JamNetwork|<SlotPlayer/, "the start page scares no one: the network widgets live on their own page");
  assert.match(start.replace(/\s+/g, " "), /\[JAM at a glance\]\(\.\/jam-at-a-glance\.md\) plays a real one in slow motion\. It's optional/);
  assert.equal(lessonText("04-blocks/02-tiny-and-full.md").split("<JamNetwork />").length, 2);
});
