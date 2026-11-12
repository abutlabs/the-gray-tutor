# The site-wide refactor: how one run works

Every lesson is being rewritten the way Part 6 reads. The work is tracked in GitHub issues
(milestone "Site-wide refactor", tracking issue #116). Each run of this playbook takes a
small piece, finishes it, and leaves the repo and the issues saying exactly what is done.
A run starts with no memory of the last one: everything it needs is here, in `WRITING.md`
(read **Shape** in full), and in the issues.

## The model

Read these three before writing a word. They are the standard.

- `lessons/06-state-and-merklization/01-the-state-trie.md`
- `lessons/06-state-and-merklization/02-state-keys.md`
- `lessons/06-state-and-merklization/03-reading-the-state.md`

## What a rewritten lesson has

1. `# Title`, then **In one sentence:** in bold. What the thing is. No symbol, no jargon.
2. Two short sentences inviting the reader to try the widget, then `<a id="try-it"></a>`
   and the lesson's main widget (move it up; a widget is placed once). A lesson with no
   widget skips this.
3. `## The idea`: 100 to 200 plain words. Start from the question the thing answers, as
   Richard Feynman would: the problem first, then the trick that solves it, on one
   example, with a picture from ordinary life where one fits. No Gray Paper symbols, no
   byte layouts, no code. End by saying what the lesson builds.
4. `## What the Gray Paper says`: every `::: gray-paper` block exactly as it is. What we
   say after each quote is short and ties it to the idea. Never "In plain words".
5. The build sections (The tests, The code, Watch it, The scoreboard): code, commands and
   outputs untouched. Cut the prose between them to what the reader needs for the step.
6. `## Check your understanding`: 3 to 5 questions a Polkadot Fellowship interviewer would
   ask: what is it, why is it built this way, what breaks without it, who runs it and
   where. None whose answer is a value read off the page. Every option has a reason;
   wrong options are beliefs people really hold; the right answer moves around.
7. `## What you have`, the last section, ending with the link to the next lesson.

No `## New words` section. Each word that section listed is linked, in italics, where the
body first uses it: `[*trie*](../glossary.md#trie)`. The id is the word, lower case,
spaces as dashes; an entry "Trie, leaf and branch" gives `#trie`, `#leaf`, `#branch`.
Every word the old list had must be linked somewhere in the lesson (a test checks the
glossary against it). Leave the glossary entry itself alone unless it is wrong.

## Rules that are not negotiable

- **Add no facts.** Every number, name and claim in the old lesson was checked against
  the Gray Paper 0.8.0, the test vectors or the code. Reword and cut; do not invent. If
  you want to say something the old lesson, its quotes or its tests don't support, don't.
- **Never touch** the inside of a `::: gray-paper` block, a code fence, an output block,
  a snippet label (`**Add to** ...`), a lasair `<details>` fold, or an image.
- **Tests pin sentences.** `grep -n "<part folder>" tools/*.test.ts`, then grep for any
  sentence you change. Where a test matches the old wording, change the test's pattern to
  the new wording in the same commit, keeping every number it checks. Never delete an
  assertion about a value: re-point it to where the value now is.
- **Spelling is tested** (in CI only): use dictionary words, or words already in
  `tools/words.txt`. No coinages ("Merklizing"). No em-dashes.
- **Every mention of a Part or lesson is a link** ("[Part 2](../02-codec/index.md)").
- Bits are written `0b...`, bytes `0x...` or hex pairs.
- Do not add mentions of lasair. Leave the ones in folds; reword prose that leans on them
  only if it reads wrongly without the fold.
- Short sentences. One idea each. If five words carry the point, don't write fifty.

## One run, step by step

1. `git pull`, then `bash refactor/setup.sh` and `bash refactor/check.sh base`.
   (This environment usually cannot `npm install`. About 25 tests fail for missing
   packages before you touch anything: that is the baseline, not your problem. The build,
   the type check and the spelling test run only in CI.)
2. Pick the work. Use the REST API (`gh api repos/abutlabs/the-gray-tutor/...`; GraphQL is
   blocked, so `gh issue list` fails). List the open issues of milestone 1, lowest number
   first, among #95 to #115. Skip one labelled `in-progress` unless its `updated_at` is
   more than 3 hours old. Take the first, add the label `in-progress`, and comment
   "Run started: <which lessons>". Several runs are at work at once, each on its own
   Part, so always `git fetch` and rebase before a push, and touch only your Part's files
   and the tests that read them.
3. Work through that issue's unticked lessons in order, in batches of **three** (one, if
   a lesson is over 2,500 words): rewrite a batch, do steps 4 to 8 for it, then take the
   next batch. Go on until the issue is closed or you have done four batches, whichever
   comes first; never start a second issue in the same run. The Part's own page
   (`index.md`) and its appendix (`gray-paper.md`) count as lessons, done last: the page
   gets one sentence and a tighter big picture; the appendix gets shorter sentences in our own
   prose, quotes untouched. Leave the appendix's step labels (`**In plain words.**`) and
   the generated "Its symbols, in plain words" as they are: tests and a generator own
   them, and issue #88 changes them everywhere at once.
4. Rewrite each. Then `bash refactor/check.sh`: fix until it says "no new failures".
   Read its output before you commit: never chain the commit after a pipe that hides its
   exit status. A sentence a test matches must stay on one line where the test's pattern
   has a plain space.
5. Commit as abutlabs, with no co-author or session trailer:
   `git -c user.name=abutlabs -c user.email=abutlabs@gmx.com commit -m "<what changed, one sentence>"`,
   then `git fetch origin main && git rebase origin/main && git push origin HEAD:main`.
6. Wait for the `pages` workflow on your commit
   (`gh run list --limit 5 --json status,conclusion,headSha`). Other runs push too, a
   few minutes apart: if a newer commit's workflow replaced yours, wait for that one, and
   its success covers your commit. If a workflow fails, read
   `gh run view <id> --log-failed`: if the failure is in files you changed, fix forward
   and push again; if it is another run's, leave it to that run unless main is still red
   20 minutes later, then fix it. Do not leave main red.
7. Open one of the pages on https://abutlabs.github.io/the-gray-tutor/ and confirm the new
   text is there.
8. Update the issue: tick the lessons you did (PATCH the body), comment with the commit
   and one line per lesson, remove `in-progress`. If every box is ticked, close the issue
   and tick it in #116.
9. When #95 to #115 are all closed, do #88, then #89, the same way. Leave #90 to #94:
   they wait for the owner's decision. When nothing is left, comment on #116 that the
   refactor is complete, and stop.

If a run cannot finish (a test you can't make pass, a deploy you can't fix), revert your
commit so main is green, remove the label, and say what happened in a comment on the
issue. A half-done lesson is never pushed.
