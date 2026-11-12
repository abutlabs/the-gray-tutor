# The scoreboard

**In one sentence:** the scoreboard runs every official test vector through your client
and counts the ones it gets wholly right.

Every JAM team checks its client against the same official test vectors, 1,428 of them in
`vectors/`. From [lesson 2.6](./02-codec/06-the-first-test-vectors.md#the-scoreboard) on, your client keeps a tally of them too:

```sh
npm run scoreboard
```

It runs every vector **whole**. Your client's answer must be all of the vector's answer:
the state after the block and what the rule says back, or the same refusal for the same
reason. The lessons build with tests that check one piece of a vector. On the board, a
vector counts only once nothing in it differs.

The vectors come in families, a folder each. A family your client can't run yet is *not
run yet*. A vector that fails says why: the first part of it that differs.

Grafana keeps the board as well, on the *8 · Official vectors* dashboard: the latest board,
the climb from run to run, and every vector the board ran, passed or failed, and why.

## Milestones

Each lesson below ends with the scoreboard, at the moment a family crosses the line. Its
*The scoreboard* section shows what to add and the board you should see.

| Lesson | What crosses the line | Board |
| --- | --- | --- |
| [2.6](./02-codec/06-the-first-test-vectors.md#the-scoreboard) | `codec`: the first two structures, at both sizes | 4 |
| [4.7](./04-blocks/07-the-block.md#the-scoreboard) | `codec`: every structure, all 30 | 30 |
| [6.1](./06-state-and-merklization/01-the-state-trie.md#the-scoreboard) | `trie` | 31 |
| [7.2](./07-time-and-shuffling/02-the-shuffle.md#the-scoreboard) | `shuffle` | 32 |
| [8.8](./08-safrole/08-the-ring-root.md#the-scoreboard) | `stf/safrole`: all 46, ticket proofs included | 78 |
| [9.2](./09-recent-history/02-recent-blocks.md#the-scoreboard) | `stf/history`: all 8 | 86 |
| [10.5](./10-disputes/05-bad-culprits-and-faults.md#the-scoreboard) | `stf/disputes`: all 60 | 146 |
| [11.3](./11-assurances/03-bad-assurances.md#the-scoreboard) | `stf/assurances`: all 22 | 168 |
| [12.5](./12-guarantees/05-bad-reports.md#the-scoreboard) | `stf/reports`: the 62 refusals; the accepted 30 wait for statistics | 230 |
| [13.1](./13-authorization/01-the-authorizer-pools.md#the-scoreboard) | `stf/authorizations`: all 6 | 236 |
| [14.1](./14-services/01-providing-preimages.md#the-scoreboard) | `stf/preimages`: 2 of 16; four wait for statistics | 238 |
| [17.13](./17-accumulation/13-blessing-and-designating.md#the-scoreboard) | `stf/accumulate`: all 126 | 364 |
| [18.1](./18-statistics/01-who-did-what.md#the-scoreboard) | `stf/statistics`: all 8 | 372 |
| [18.2](./18-statistics/02-what-cores-and-services-did.md#the-scoreboard) | `stf/reports`, all 92, and `stf/preimages`, 6 of 16, with statistics | 406 |
| [19.4](./19-block-import/04-importing-a-block.md#the-scoreboard) | `traces/fallback` and `traces/safrole`: 200 blocks | 606 |
| [19.6](./19-block-import/06-blocks-to-refuse.md#the-scoreboard) | all eight traces: 1,000 blocks | 1,406 |
| [20.4](./20-facing-the-fuzzer/04-ready-to-be-fuzzed.md#the-scoreboard) | the finished board | 1,406 |

## What stays red

The finished board passes 1,406 of 1,428. The 22 left, and why:

- **Ten preimages vectors**, five at each size: blocks that carry a preimage nobody is
  waiting for (`preimage_unneeded`), or preimages out of order (`preimages_not_sorted_unique`).
  The Gray Paper says to refuse them. [Lesson 14.1](./14-services/01-providing-preimages.md) takes the simple road and accepts them,
  and the [hardening pass](https://github.com/abutlabs/the-gray-tutor/blob/main/HARDENING.md) adds the refusals.
- **Twelve erasure-coding vectors**: the code validators use to split a work-package's data
  among themselves (Gray Paper Appendix H). A block importer never needs it, so the tutorial
  doesn't build it, and the board says *not run yet*.

## Starting partway

The scoreboard needs only what the lessons before it built. Catch your client up to any
milestone with `npm run catch-up --` and that lesson's number, in the tutorial's folder,
then run the board from `client/`.
