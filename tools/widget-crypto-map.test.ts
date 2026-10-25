// The cryptography appendix (lessons/cryptography.md) and its widget (.vitepress/theme/
// crypto-map.ts): every field of Part 4's block that a borrowed algorithm made has its owner,
// the sizes are the encoding's, the hash examples are real, and the libraries' versions,
// licences and audits are what the lessons install and their own READMEs say.

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { blake2b } from "@noble/hashes/blake2.js";
import { keccak_256, sha3_256 } from "@noble/hashes/sha3.js";
import { BLOCK, BLOCK_JSON } from "../.vitepress/theme/block-parcel.ts";
import { encodeMapped, flatten, type Json } from "../.vitepress/theme/codec-map.ts";
import { ALGORITHMS, BLOCK_BYTES, FIELDS, inBlock, madeBy } from "../.vitepress/theme/crypto-map.ts";
import { clientPackages, lessonText, ROOT } from "./lessons.ts";

const PAGE = lessonText("cryptography.md");
const plain = PAGE.replace(/\s+/g, " ");
const hex4 = (b: Uint8Array) => Buffer.from(b.slice(0, 4)).toString("hex");
const text = (s: string) => new TextEncoder().encode(s);

test("every signature, VRF, ring proof and hash in the block has its algorithm, by its size", () => {
  const { root } = encodeMapped(BLOCK, BLOCK_JSON as Json);
  for (const n of flatten(root).filter((n) => !n.children.length)) {
    const path = n.path.replace(/\[\d+\]/g, "[]");
    const type = JSON.stringify(n.type);
    const want = type === '{"bytes":784}' ? "ring" : type === '{"bytes":96}' ? "vrf" : type === '{"bytes":64}' ? "ed25519"
      : type === '"hash"' ? (path.endsWith("beefy_root") ? "keccak" : "blake2b") : undefined;
    if (want) assert.equal(madeBy(path), want, path);
  }
  assert.equal(madeBy("header.epoch_mark.validators[].bandersnatch"), "vrf");
  assert.equal(madeBy("header.epoch_mark.validators[].ed25519"), "ed25519");
  assert.equal(madeBy("extrinsic.preimages[].blob"), null, "a preimage is data, not cryptography");
  assert.equal(madeBy("header.slot"), null);
});

test("what each algorithm made is the encoding's: 3 ring proofs of 784, two VRF signatures of 96, 17 Ed25519 signatures", () => {
  assert.equal(BLOCK_BYTES, 5150);
  assert.deepEqual(inBlock("ring"), { fields: [{ path: "extrinsic.tickets[].signature", size: 784, count: 3, algorithm: "ring" }], bytes: 2352 });
  assert.match(plain, /its three ring proofs alone are 2,352 of its 5,150 bytes/);
  assert.deepEqual(FIELDS.filter((f) => f.size === 96).map((f) => f.path), ["header.entropy_source", "header.seal"]);
  assert.equal(FIELDS.filter((f) => f.algorithm === "ed25519" && f.size === 64).reduce((n, f) => n + f.count, 0), 17);
  assert.deepEqual(inBlock("keccak").fields.map((f) => f.path), ["extrinsic.guarantees[].report.context.beefy_root"]);
  for (const id of ["sha512", "bls"] as const) assert.equal(inBlock(id).bytes, 0, `${id}: no field of a block`);
});

test("the hash examples are real: Blake2b-256 of JAM and JAN, Keccak-256 and SHA3-256 of JAM", () => {
  assert.match(plain, new RegExp(`"JAM" hashes to \`${hex4(blake2b(text("JAM"), { dkLen: 32 }))}…\` and "JAN" to \`${hex4(blake2b(text("JAN"), { dkLen: 32 }))}…\``));
  assert.match(plain, new RegExp(`"JAM" hashes to \`${hex4(keccak_256(text("JAM")))}…\``));
  assert.match(plain, new RegExp(`gives \`${hex4(sha3_256(text("JAM")))}…\``));
});

test("each algorithm's library is the one its lesson installs, and the page says so", () => {
  const pins = clientPackages();
  for (const name of ["@noble/hashes", "@noble/curves", "@typeberry/native"]) {
    const short = pins[name].replace(/-.*/, "");
    assert.ok(PAGE.includes(`- **\`${name}\` ${short}**`), `${name} ${short}`);
  }
  const lessons: Record<string, string> = { "5.1": "05-hashing-and-signatures/01-hashes.md", "9.1": "09-recent-history/01-the-mountain-belt.md", "8.6": "08-safrole/06-the-vrf-output.md", "5.3": "05-hashing-and-signatures/03-signatures.md", "8.9": "08-safrole/09-seals.md", "8.8": "08-safrole/08-the-ring-root.md" };
  for (const a of ALGORITHMS) {
    if (!a.lesson) { assert.equal(a.id, "bls"); continue; }
    const library = a.library.replace(/ \(.*/, "");
    // 8.9 calls the library 8.8 wraps in src/bandersnatch.ts: library.verifySeal
    const uses = a.lesson === "8.9" ? /library\.verifySeal\(/.test(lessonText(lessons["8.9"])) && lessonText(lessons["8.8"]).includes(library)
      : lessonText(lessons[a.lesson]).includes(library);
    assert.ok(uses, `${a.name}: lesson ${a.lesson} uses ${library}`);
    assert.ok(plain.includes(`\`${library}\`, from [lesson ${a.lesson}](./${lessons[a.lesson]})`), `${a.name}: the page names ${library} and lesson ${a.lesson}`);
  }
});

const NOBLE = join(ROOT, "node_modules/@noble");
test("noble's licences and audits are what its own package and README say", { skip: !existsSync(NOBLE) && "no node_modules" }, () => {
  for (const name of ["hashes", "curves"]) {
    const pkg = JSON.parse(readFileSync(join(NOBLE, name, "package.json"), "utf8"));
    assert.equal(pkg.license, "MIT");
    assert.match(pkg.author, /^Paul Miller/);
    assert.ok(PAGE.includes(`- **\`@noble/${name}\` ${pkg.version}**, by Paul Miller, MIT licence.`), name);
  }
  const hashes = readFileSync(join(NOBLE, "hashes/README.md"), "utf8");
  assert.match(hashes, /at version 1\.0\.0, in Jan 2022, independently, by \[Cure53\]/);
  assert.match(hashes, /Scope: everything, besides `blake3`, `sha3-addons`, `sha1` and `argon2`/);
  const curves = readFileSync(join(NOBLE, "curves/README.md"), "utf8");
  assert.match(curves, /at version 2\.3\.0, in Aug 2026, by \[Trail of Bits\][\s\S]*?Scope: everything/);
  assert.match(curves, /at version 1\.6\.0, in Sep 2024, independently, by \[Cure53\][\s\S]*?Scope: ed25519/);
  assert.equal((curves.match(/^- at version /gm) ?? []).length, 4, "two audits before those, as the page says");
  assert.match(plain, /by Trail of Bits in August 2026, at 2\.3\.0, everything; by Cure53 in September 2024, at 1\.6\.0, with Ed25519 in scope; and twice before that/);
  assert.match(plain, /Audited by Cure53 in January 2022, at 1\.0\.0, with Blake2b, Keccak and SHA-512 in scope/);
});

test("the appendix is linked from the start page and 4.1, published, and holds its widget once", () => {
  assert.match(lessonText("index.md"), /Every line is yours except the cryptography[\s\S]*?\[cryptography appendix\]\(\.\/cryptography\.md\)/);
  assert.match(lessonText("04-blocks/01-tickets-and-preimages.md"), /\[Cryptography we use\]\(\.\.\/cryptography\.md#bandersnatch-ring-vrf\)/);
  assert.match(PAGE, /^### Bandersnatch ring VRF$/m);
  assert.equal(PAGE.split("<CryptoMap />").length, 2);
  assert.match(readFileSync(join(ROOT, ".vitepress/urls.ts"), "utf8"), /^ {2}"cryptography",$/m);
});
