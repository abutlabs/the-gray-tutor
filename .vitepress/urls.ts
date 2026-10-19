// The website's addresses, kept working. A page's address is its path under lessons/
// without ".md" ("02-codec/03-writer-and-reader"; a part's index is "02-codec/"; the start
// page is ""). Once published, an address must keep working, as the Rust Book keeps its
// old chapters (book.toml redirects): tools/urls.test.ts checks both lists below.

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

/** Every address the site has ever published. A new page goes here when it's published. */
export const PUBLISHED: string[] = [
  "00-start/01-what-you-will-build",
  "00-start/02-set-up-the-project",
  "00-start/03-watch-your-client",
  "00-start/04-the-jam-clock",
  "00-start/",
  "01-bytes-and-numbers/01-bytes-and-hex",
  "01-bytes-and-numbers/02-numbers",
  "01-bytes-and-numbers/",
  "02-codec/01-fixed-width-integers",
  "02-codec/02-compact-naturals",
  "02-codec/03-writer-and-reader",
  "02-codec/04-codecs",
  "02-codec/05-sequences-and-records",
  "02-codec/06-the-first-test-vectors",
  "02-codec/07-watch-a-decode",
  "02-codec/",
  "03-work-and-reports/01-a-work-package",
  "03-work-and-reports/02-work-digests",
  "03-work-and-reports/03-a-work-report",
  "03-work-and-reports/",
  "04-blocks/01-tickets-and-preimages",
  "04-blocks/02-tiny-and-full",
  "04-blocks/03-guarantees",
  "04-blocks/04-disputes",
  "04-blocks/05-maybe-and-exactly-n",
  "04-blocks/06-the-header",
  "04-blocks/07-the-block",
  "04-blocks/",
  "05-hashing-and-signatures/01-hashes",
  "05-hashing-and-signatures/02-the-extrinsic-hash",
  "05-hashing-and-signatures/03-signatures",
  "05-hashing-and-signatures/",
  "06-state-and-merklization/01-the-state-trie",
  "06-state-and-merklization/02-state-keys",
  "06-state-and-merklization/03-reading-the-state",
  "06-state-and-merklization/",
  "07-time-and-shuffling/01-epochs",
  "07-time-and-shuffling/02-the-shuffle",
  "07-time-and-shuffling/",
  "08-safrole/01-stirring-the-entropy",
  "08-safrole/02-rotating-the-validators",
  "08-safrole/03-the-fallback-sealers",
  "08-safrole/04-the-lotterys-winners",
  "08-safrole/05-one-step-of-safrole",
  "08-safrole/06-the-vrf-output",
  "08-safrole/07-entering-tickets",
  "08-safrole/08-the-ring-root",
  "08-safrole/09-seals",
  "08-safrole/",
  "09-recent-history/01-the-mountain-belt",
  "09-recent-history/02-recent-blocks",
  "09-recent-history/",
  "10-disputes/01-votes-and-verdicts",
  "10-disputes/02-culprits-and-faults",
  "10-disputes/03-clearing-the-cores",
  "10-disputes/04-bad-verdicts",
  "10-disputes/05-bad-culprits-and-faults",
  "10-disputes/",
  "11-assurances/01-available",
  "11-assurances/02-timeouts",
  "11-assurances/03-bad-assurances",
  "11-assurances/",
  "12-guarantees/01-who-guarantees-what",
  "12-guarantees/02-signed-and-counted",
  "12-guarantees/03-onto-the-cores",
  "12-guarantees/04-bad-guarantees",
  "12-guarantees/05-bad-reports",
  "12-guarantees/",
  "13-authorization/01-the-authorizer-pools",
  "13-authorization/",
  "14-services/01-providing-preimages",
  "14-services/02-the-service-account",
  "14-services/",
  "15-the-pvm/01-the-program-blob",
  "15-the-pvm/02-instructions",
  "15-the-pvm/03-the-machine",
  "15-the-pvm/04-memory",
  "15-the-pvm/05-arithmetic",
  "15-the-pvm/06-branches-and-calls",
  "15-the-pvm/07-bits-and-bytes",
  "15-the-pvm/08-a-real-program",
  "15-the-pvm/09-what-instructions-cost",
  "15-the-pvm/10-the-pipeline",
  "15-the-pvm/11-the-gas-meter",
  "15-the-pvm/",
  "16-host-calls/01-calling-the-host",
  "16-host-calls/02-fetch",
  "16-host-calls/03-growing-the-heap",
  "16-host-calls/04-info",
  "16-host-calls/05-storage",
  "16-host-calls/06-checkpoints",
  "16-host-calls/07-a-services-inputs",
  "16-host-calls/08-lookup",
  "16-host-calls/09-asking-for-preimages",
  "16-host-calls/",
  "17-accumulation/01-a-blocks-accumulation",
  "17-accumulation/02-waiting-reports",
  "17-accumulation/03-sending-a-transfer",
  "17-accumulation/04-rounds",
  "17-accumulation/05-privileges",
  "17-accumulation/06-who-wins",
  "17-accumulation/07-ejecting-a-service",
  "17-accumulation/08-creating-a-service",
  "17-accumulation/09-the-blocks-gas-budget",
  "17-accumulation/10-upgrading-a-service",
  "17-accumulation/11-what-a-service-yields",
  "17-accumulation/12-providing-a-preimage",
  "17-accumulation/13-blessing-and-designating",
  "17-accumulation/",
  "18-statistics/01-who-did-what",
  "18-statistics/02-what-cores-and-services-did",
  "18-statistics/",
  "19-block-import/01-the-order-of-things",
  "19-block-import/02-the-whole-state",
  "19-block-import/03-accounts-from-the-state",
  "19-block-import/04-importing-a-block",
  "19-block-import/05-work-on-the-chain",
  "19-block-import/06-blocks-to-refuse",
  "20-facing-the-fuzzer/",
  "20-facing-the-fuzzer/01-speaking-the-protocol",
  "20-facing-the-fuzzer/02-a-target",
  "20-facing-the-fuzzer/03-a-session",
  "20-facing-the-fuzzer/04-ready-to-be-fuzzed",
  "19-block-import/",
  "glossary",
  "symbols",
  "cryptography",
  "jam-at-a-glance",
  "gray-paper",
  "",
  "scoreboard",
  "demo",
];

/** Pages that moved: old address to new. The build leaves a page at the old address that
 * sends the reader on, to the same section (#...) if the link named one. */
export const MOVED: Record<string, string> = {};

/** 0.1's list of labels, where every snippet label links (.vitepress/config.ts). */
export const LEGEND = "/00-start/01-what-you-will-build.md#how-a-lesson-works";

/** Writes a small redirect page for each moved address into the built site. */
export function writeRedirects(outDir: string, base: string): void {
  for (const [from, to] of Object.entries(MOVED)) {
    const target = base + to;
    const file = join(outDir, from.endsWith("/") || from === "" ? `${from}index.html` : `${from}.html`);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, `<!doctype html>
<meta charset="utf-8">
<title>Moved</title>
<meta name="robots" content="noindex">
<link rel="canonical" href="${target}">
<meta http-equiv="refresh" content="0; url=${target}">
<script>location.replace(${JSON.stringify(target)} + location.hash)</script>
<p>This page moved to <a href="${target}">${target}</a>.</p>
`);
  }
}
