# Writing a lesson

## How a part is made

1. **Build it in `reference/` first** (the reference client, a repository of its own):
   plain, simple code that keeps the Gray Paper's structure, tested against the official
   vectors, every step reporting through a `Trace` or a `Run`, with `OBS_CLIENT=reference`.
2. **Write the lessons from it**, in the shape below, snippets copied from the reference.
3. **Check**: `npm run verify` (the lessons rebuild a working client from nothing, with
   the stack up) and `npm run compare -- <last lesson> --dir reference` (the lessons give
   exactly the reference's code).

**A new package is an offline question.** Readers work on flights, and `npm run offline`
(`tools/offline.ts`, explained in the appendix `lessons/offline.md`) fetches everything
before they board. A package a lesson adds to the client comes with it for free: the tool
reads every lesson's `package.json` steps, so pin one version of a package across the
whole tutorial (checked). A package of the tutorial's own (the root `package.json`: the
website, the tools) comes with the root `npm install` the tool runs. Anything that needs
more than that (a download, a cache, an image) goes into the tool and the appendix in the
same change. *Why:* a package found missing in the air can't be fetched.

## Observability in every lesson

Every step a lesson builds also reports what it did: test runs through `test/grafana.ts`,
programs through `Run`, codec and later STF steps through a `Trace`. A **Run** block that
reports says so (`# prints: reported`, or the `reported ...` line in its Output block), so
verify checks the run reached the stack. When a step needs a new panel, it goes in the
same change onto the theme dashboard for its Part
(`observability/dashboards/the-gray-tutor-*.json`; the title names its Parts), in that
Part's row, in lesson order. Test results and everything reported stay on the overview,
`the-gray-tutor.json`, where the run links land. A new Part joins a theme by widening that
theme's title. The scoreboard has a dashboard of its own, `the-gray-tutor-vectors.json`
(*8 · Official vectors*), which every Part fills. `tools/dashboards.test.ts` checks that
every panel a lesson names is on its Part's dashboard, the overview or the scoreboard's,
and that all of them share one link bar and one pair of menus.

## Programs run through npm

Every program in `bin/` runs through a script of the same name: `bin/decode.ts` is
`npm run decode`, its words after the name (`npm run decode work_item x.bin`). The lesson
that writes a program gives it its script in the first Run block that runs it, with
`npm pkg set scripts.decode="node bin/decode.ts"` (0.3 explains it, with `hello`); a
`package.json` Rewrite keeps every script given so far. A Run block never runs
`node bin/` itself. A run of a program on a file (any word with a `/`) or a long value
gets a script of its own, named for what it shows, the program's name first
(`npm pkg set scripts.decode-work-item="node bin/decode.ts work_item ../vectors/…"`, then
`npm run decode-work-item`), so a reader can show it again, or demo it, without retyping;
the same run later is just `npm run decode-work-item`. An Output block may leave out npm's echo of the script (`> decode`,
`> node bin/decode.ts ...`); verify skips it. `tools/lessons.test.ts` checks all of this.

## The scoreboard

`npm run scoreboard` (lesson 2.6) runs every official vector **whole** and counts what
passes: a vector passes only if the client's answer is all of the vector's (the state after
and the output, or the same refusal), never because one piece of it matches. A family of
vectors (a folder: `codec`, `stf/safrole`, `traces/fuzzy`) gets on the board through
`FAMILIES` in `test/families.ts`, with a check that throws, naming the first part that
differs (`psi differs`, `statistics changed`), when the client's answer isn't the vector's.

- **A milestone ends the lesson where a family crosses the line**: a section *The
  scoreboard*, before lasair, that wires the family in and runs the board, its Output block
  the whole real board; then a `> [!TIP] Milestone` note (the site titles the box
  *Milestone*; `[!TIP]` is kept for these) saying what passes now. Major
  milestones only: a family's first appearance and the lesson it's whole, not every step
  between.
- **Partial is honest.** A family wired before the client makes all of its state shows its
  count and why the rest fail (12.5: the accepted reports wait for Part 18's statistics).
  Never narrow a check, or skip a vector, to make a row green.
- **One copy of each check.** A test that already checks a vector whole calls the family's
  check instead of repeating it (6.1, 9.2, 13.1, 18.1); a helper both need goes in
  `test/families.ts` or `test/vectors.ts`.
- **`lessons/scoreboard.md`** lists every milestone with the count its board shows, and
  what stays red, and why. `tools/lessons.test.ts` checks the list against every lesson
  that runs the board, the counts against their Output blocks, and that a lesson that
  changes `FAMILIES` runs it.
- **What you have** says what passes whole on the board, and nothing more: a claim about
  the official vectors is the board's number.

## Visual tutorial verification

A picture of what the reader's screen should show after a step: Grafana after a run, a
terminal, the website. Use one wherever a step's result is something to look at, and at
least for every new panel a lesson sends the reader to.

- **Just the picture**, right after the step it shows: no label and no words around it.
  The name is ours, for writing; the reader only sees a screenshot.
- **File** `lessons/NN-part/images/NN-what.png`, the first `NN` being the lesson's own
  number: `00-start/images/03-its-alive.png` is lesson 0.3's.
- **Taken** by `npm run screenshots`, from a real run of the lesson's own code: it
  follows the tutorial to the lesson (verify), runs it, and photographs one panel filtered
  to that lesson's run. A new picture is one line in `SHOTS` in `tools/screenshots.ts`
  (lesson, panel, and which of the lesson's runs if not its last), then the image line in
  the lesson. Rerun it when a panel or a lesson's output changes.
- **By hand** only for what the tool can't take, such as a whole dashboard (0.3's): cropped
  to what matters, the thing to look at outlined, nothing private (no home-folder paths,
  no tokens).
- **Alt text** says what the picture shows, for anyone who can't see it.
- **Under 1 MB.** `tools/lessons.test.ts` checks that every image a lesson shows exists,
  sits in its part's `images/`, has alt text and fits; and that every image is shown by
  some lesson.

## Bits and bytes

0 and 1 are digits in binary, hex and decimal alike, so `10000000` could be 128, four bytes,
or ten million. A reader must never have to guess which. In prose, write bits as JavaScript
does, `0b10000000` (`0b0000_0101` in groups); bytes in hex, `0x0102ff` or pairs with a space
between, `10 00 00 00`; and decimal as plain digits. `tools/units.test.ts` refuses a bare run
of 0s and 1s, except byte pairs and all zeros (zero in any base). The site colours each
(`.vitepress/units.ts`): bits copper, bytes teal, with a tooltip saying how many. A lone pair
is coloured as a byte only when it can't be decimal (`02`, `c7`, not `12`): write `0x12`
where it matters.

A widget does the same with classes from `custom.css`: `unit-bit` on every bit cell and
`unit-byte` on every byte cell (a bar under the cell, whatever the cell's own colour means
there), a `unit-tag` naming a row's unit, and the class `bits` or `bytes` on a value it
writes out (a tile, an answer, a hash in a sentence). Its goals and explanations go through
`<UnitText :text="…" />`, which finds their bits and bytes itself (`unitParts`). Bit strings
it writes start `0b`, and so do ids or keys in a sentence that could read as decimal
(`0x12`). The names `bits` and `bytes` are the units': a widget never styles them itself. A cell's own colour says what it is for:
amber is structure, whatever tells a decoder how to read what follows (a compact
natural's marker, a length, a count, a tag); red (`--changed`) is what a tap changed; a
plain 1 bit is copper. Diagrams in `tools/diagrams.ts` use the same colours. *Why:* Aodh read a dump's `10 00 00 00` as
the bits `10000000`, beside a widget that only ever showed bits.

## Diagrams

Where an idea is a shape (bytes in a row, a trie, a queue), draw it, as the Rust Book draws
its hardest ideas. A diagram is an SVG drawn by `tools/diagrams.ts` from data checked
against the source, never an image file made by hand: code can be redrawn when the
lesson changes, a picture can't (a vector's real bytes, the Gray Paper's rule): add a function and its
path to `DIAGRAMS`, then `npm run diagrams`. `tools/diagrams.test.ts` checks every
committed SVG is what the code draws, so the two never drift. Monospace text, light and
dark colours in the SVG's own style, no wider than about 880 units so it shows at full
size; in the lesson, the picture alone with real alt text, like a screenshot. A narrow one
(well under 880 units) gets a `width` on its `<svg>`, so a wide screen shows it at a
readable size instead of blowing it up; a phone still shrinks it to fit.

**Interactive.** Where trying values teaches more than a picture (flip a bit, step x across
127 and 128), a lesson can hold a widget: a Vue component in `.vitepress/theme/`,
registered in its `index.ts` and placed in the lesson as `<BitPlaces />`. Its answers
(the number, its hex, ℰ(x)) sit in a readout at the top that never moves or resizes, and
a line says what its bits can hold (one byte: 0 to 255). What it shows
is computed in a plain `.ts` module beside it, which a `tools/widget*.test.ts` checks
against values the lesson's own code is checked against, as diagrams are. The prose must
stand without it: VS Code's preview shows nothing there, and print.html only its first
state. *Why:* a reader stuck on a step can poke at it until it clicks (Aodh, on 127 being
`01111111`). A widget works on a phone: 375 px wide with no sideways scroll, nothing
behind a hover, buttons at least 32 px. Concept widgets teach a Gray Paper idea, not the
code: a reader can learn Parts 2 to 19 on a phone with *Concepts only* on (the switch at
the top of every lesson folds the code away, `theme/concepts.ts`; a link ending `?concepts`
opens a lesson that way), so a lesson's idea must come across in its prose, its diagrams and
its widgets alone.

## Formulas

A Gray Paper rule is quoted whole, type line and all, in LaTeX between `$$` lines: the site
draws it as maths when it's built (MathJax), and VS Code's preview draws it too. Spell the
Gray Paper's macros out in plain LaTeX (`\mathcal{E}`, `\frown`, `\left\lfloor`), checked
against the 0.8.0 tex. In a sentence, `$...$` only where Unicode can't say it
($\mathbb{N}_{2^{8l}}$); ℰ₄ and ⌢ stay plain text.

Right under the formula comes its key: a table `| Symbol | Say it | Here |`, a row for each
symbol in it, linked to its entry in `lessons/symbols.md`, with how to read it aloud and
what it means in this formula (checked). Then work the formula through on a real value.
A symbol with no entry yet gets one: **Say it**, **Means**, **Example**, **Gray Paper**
(where it's defined, quoted), and where they apply **In code**, **Built from**, **Used
for** and **Built in**. Its heading names its id (`### ⌢: concatenate {#concat}`), and the
page's tables link to it (checked). *Why:* a reader who can't say a symbol can't search for
it, and one who can't read it can't follow the rule.

## Where

`lessons/NN-part-name/NN-lesson-name.md`. The numbers give the order and the lesson's id
(`02-codec/03-...` is lesson 2.3). Each part folder has an `index.md` whose `# ` title is
the part's name and which links its lessons. `lessons/index.md` links every part and
lesson. `npm test` checks those links, and that each lesson ends with a link to the next.
A part's page also says where you'll be at its end (*By the end of this part...*), what it
builds on (**Builds on**: the earlier parts that added the names its code imports from
`src/`, test helpers aside, besides Parts 0 to 2), and how to start there (**Starting here?**: `npm run catch-up --` the lesson before
it). `npm test` checks the last two against the code, so they stay true.

**Addresses stay.** The site is public, so a page's address keeps working once it's
published, as the Rust Book keeps its old chapters' addresses. A new page: add its address
to `PUBLISHED` in `.vitepress/urls.ts`. A page that moves or is renumbered: add `"old":
"new"` to `MOVED`, and the build leaves a page at the old address that sends the reader on,
to the same section. A renamed heading: put `<a id="old-id"></a>` on the line above it.
`tools/urls.test.ts` checks all three, and that every `#section` link lands on a heading.

**Debug configurations stop at 1.2.** `.vscode/launch.json` has three for any lesson (all
the tests, the open test file, the open program) and one for each program up to 1.2, none
for single test files. 0.4 teaches the debugger and 1.2 hands it over; later lessons
don't add configurations or mention them: the reader makes their own, a habit 1.2
recommends.

## Shape

0. **New words**: right under the opening paragraph, every term the lesson uses for the
   first time (a JAM word, a Gray Paper symbol, a programming word a newcomer may not
   know), each with a one-line plain-English definition and a tiny concrete example. Add
   each one to `lessons/glossary.md` too (plain English, example, the symbol, the lesson
   that builds it). A word used before it's defined is a bug. `npm test` checks the two
   lists agree: every new word has a glossary entry, and every glossary word is in some
   lesson's New words, at or before the lesson its entry links.
1. **What the Gray Paper says**: the rule, quoted or paraphrased, with its section
   (§11, *Refinement Context*; Appendix C). Check every quote against the 0.8.0 tex. A
   formula is drawn as maths, with its key (see *Formulas*).
2. **The code**: test-driven development where it helps (the test, then the code), each
   in a labelled snippet.
3. **Run**: the tests pass, the types check.
4. **lasair**, folded in `<details>`: the same rule in lasair's OCaml, quoted from the
   source (say when comments are trimmed), with a sentence on reading it.
5. **Check your understanding**, the section before last: three to five questions in a
   `::: check` block (`.vitepress/checks.ts` has the format), each with 2 to 5 options,
   exactly one right, and a reason under every option, wrong ones too: a wrong answer
   teaches most when it says why it's wrong. Ask about the lesson's idea, not its
   TypeScript, on its own values (why `04 03 02 01`, not what `w.fixed` is called). Make
   the wrong options the mistakes a reader really makes (52 as the size of every item),
   never silly ones, and move the right answer around. A question may only use what this
   lesson or an earlier one taught. `tools/checks.test.ts` checks the shape. *Why:* a
   reader who can explain the idea back has it; one who can't finds out here, not three
   lessons later (Aodh, on what `hexdump … 48` meant).
6. **What you have**, the last section: what works now and which vectors pass (on the
   scoreboard, where a milestone ran it), then one sentence on why the next lesson comes
   next, then the link to it.

**Foundations before complexity.** A beginner should never meet the hard parts first.
Inside a lesson: plain English and a concrete example first, the Gray Paper's notation
second, code third, and at most about three new ideas. Across the tutorial: the base rules
of every part through block import come first; cryptography, hardening and rare cases come
after, in parts marked as later.

**ELI5-proof.** Write for a reader who can't ask. Show every mechanism working on a real
value, at the level where it happens: bits for a bit rule, bytes for a byte rule, one
step at a time. Pick examples that use every part of the rule. One whose interesting
part is zero hides the rule: 128's top bits are all zero, so `0x8080` looks like 128
written twice. Pair it with one that doesn't (300, `0x812c`). Where you'd sketch it on
paper to explain it, draw it (see *Diagrams*). Then cut: a sentence that doesn't help the
reader understand or do the next step goes. *Why:* fewer words, and more of them
teaching. A reader left to guess the step between two sentences has been failed.

**The first pass teaches the base rule.** A lesson shows the rule working in its simplest
form; edge cases, hostile input and fuzzer-level defences wait for the hardening pass,
listed in `HARDENING.md` (what, where, why, which case needs it). Don't confuse a learner
for the sake of 100% fuzz compatibility.

**Fun.** Friendly, playful, curious: short sentences, vivid analogies, the odd joke, a
little drama when a test goes red. Never at the cost of accuracy, never padding.

**Honest, not flattering.** Never praise the Gray Paper or JAM ("it thinks of
everything"). The Gray Paper is still being improved, and new versions change rules:
explain why a rule exists, and when one looks odd or likely to change, say so plainly.
Use the common software-engineering name for a practice (test-driven development), never
a coined one such as "test first" (`npm test` checks the lessons for it).

Plain words, no em-dashes. Explain why, not only what. Every claim about lasair, the
vectors or the Gray Paper is checked against the source before it is written.

## Lessons from the Rust Book

*The Rust Programming Language* (the Book, doc.rust-lang.org/book) is our model for
teaching. What we take from it, each with its reason. "Checked" means a test enforces it.

- **Say where the lesson goes.** The opening paragraph says what the reader will have at
  the end, and why it's worth having. *Why:* knowing the destination tells you which details
  matter.
- **Close the loop.** *What you have* is the last section, and it ends with one sentence on
  why the next lesson comes next (checked). *Why:* a summary fixes what was learned, and the
  bridge makes the order feel earned.
- **Show the real output.** After a **Run**, show what the terminal prints, trimmed to what
  matters, and say what changes from run to run (ids, times, durations). The first time a
  tool's output appears, walk through it line by line. *Why:* readers compare their screen
  with the page, and a description of output can't be compared.
- **Every byte example is broken down.** Bytes a lesson shows (in prose, or a value its
  test checks) get a small `text` block, one line per part: the part's bytes, then what
  it is, its type and its width ("`01 00 00 00`  slot 1 as a u32: 4 bytes"), and the total
  when it adds up ("4 + 8 = 12 bytes"). *Why:* a reader on a phone skips the TypeScript,
  and `2a 00 00 00 07 00 00 00 00 00 00 00` with no breakdown is a wall (Aodh, on 2.5).
- **Read the red together.** When a test fails on purpose, show the failure and point at
  the line to read: which test, expected, actual. *Why:* reading errors is a skill to teach,
  not to assume.
- **Red for the right reason.** Where the rule is the point of the lesson, give a stub first
  (the function exists and answers wrongly), so the first red is the rule failing, not a
  missing file. *Why:* "Cannot find module" proves only that a file is missing; a failed
  assertion proves the test tests the rule.
- **A missing import is never the red.** A test failing because what it imports isn't
  written yet (`Cannot find module`, or `does not provide an export named`) proves only
  that a file is missing, so no lesson shows one: a test that needs new code goes straight
  to the code, no Run between them. Where the Run is red for another reason too (a vector
  the new code fixes), keep it, drop the import error from its output, and say in a clause
  which failure it was (checked). *Why:* a red that teaches nothing, shown again and again,
  is noise (Aodh).
- **Tests show their steps.** In a test, every value the code under test produces gets a
  `const` with a name and a type (`const hex: string = toHex(encode(u16, 4807));`), and an
  assertion compares names with expected values (`assert.equal(hex, "0xc712");`). An
  expected value that is computed, such as one read from a vector, gets a name too; a
  literal one stays in the assertion, and so do literal inputs. Each step goes on the line
  above the first assertion that needs it, so the test runs in the same order as before
  and the same assertion fails first. Names say what the value is (`decoded`, `root`), and
  types use the client's names (`Bytes`, `Header`); where the client has no name for a
  type (a helper's inferred return, a value read from a vector's JSON), the type is left
  to TypeScript. Bytes the test compares as hex are named as their hex (`u16Hex`), so the
  debugger shows `"0xc712"`, not an array. A type a test names before a later lesson
  imports it needs its import in the snippet that first uses it.
  `assert.throws(() => ...)` stays as it is: there is no value to name. *Why:* this is a tutorial, not production code. With a
  breakpoint on an assertion, the debugger's *Variables* list shows every step so far,
  and the reader sees what the test compares instead of decoding one dense line
  (1.2's `test/js-numbers.test.ts` is the model).
- **Steps in words before code.** When a rule has several steps, number them in plain
  English between *What the Gray Paper says* and the code. *Why:* the reader holds the plan
  while reading the code.
- **Quote what you explain.** After a long snippet, quote again the two to four lines the
  text explains, where it explains them. *Why:* nobody has to scroll back to find "the line
  with `#at`".
- **Link every reference.** "lesson 2.3", "Part 8", "the next lesson" and "the hardening
  pass" are always links (checked). When a lesson uses something a later one explains,
  give the minimum ("for now, all you need to know is ...") and link forward. *Why:* the
  tutorial reads as one connected whole, and a promise never leaves the reader stuck.
- **Italics for a new word.** In the body, a term from *New words* is in italics where it's
  first used, never bold (checked; a bold step title is a label, and may hold one).
  *Why:* the reader can match the use to the definition.
- **Tangents in a note.** A side story (why `bigint`, how Node strips types) goes in a
  `> [!NOTE]` box. *Why:* the main line reads straight, and the curious still find it.
- **Name the simple road.** Where a lesson takes the simple way on purpose, say so, and link
  where it's revisited (`HARDENING.md`). *Why:* readers trust a tutorial that names its
  shortcuts.
- **Refactor in the open.** When the client's structure changes, name what hurts first, then
  change it in small *Replace in* steps, each followed by a **Run**. *Why:* the reader learns
  why the shape changes, and is never more than one step from green.
- **Rules of thumb.** Where judgement matters (a bad block is an error the code returns; a
  bug in our code throws), state the rule of thumb in a sentence. *Why:* the Book teaches
  when, not only how.
- **Words and code stay apart.** Two `bigint` values, never two `bigint`s (checked). A
  function is named without parentheses: "`slotAt` returns", not "`slotAt()` returns".
  *Why:* the code font means exactly this code, and `bigint`s isn't code.

## Labels

The line right above a code block, exactly one of:

```text
**New file** `src/x.ts`
**Add to** `src/x.ts`
**Replace in** `src/x.ts`
**Rewrite** `package.json`
**Run**
**Run, expect it to fail**
```

On the website every file snippet (the first four labels) is numbered in its lesson, and
its tab links to itself: point at the second with `[snippet 2](#snippet-2)`, as the Book
cites "Listing 2-1". The numbers follow the lesson's order, so a new snippet renumbers the
ones after it: check the links then. `tools/urls.test.ts` catches a link that lands
nowhere, not one that lands on the wrong snippet.

Paths are relative to `client/`. A Run block is ```` ```sh ````, runs in `client/`, and may
hold `# prints: text` or `# fails with: text` lines: the output must contain that text.

**Output.** A ```` ```text ```` block right after a Run block is that run's output, as the
Rust Book shows every run's; the website gives it an *Output* tab. verify checks it
against the real run (`tools/output.ts`): its lines in order and one after another; a
line `...` marks a cut (at the start and end too, if the output goes on); `…` inside a
line stands for anything; times, durations, run ids and paths into the client are masked
on both sides. Paste real output from `.verify-output/<lesson>/line-<n>.txt`, which verify
writes for every run. A Run with an Output block needs no `# prints:` lines, so its block
is pure commands.

## Albert

Albert, the professor in the logo, perches on code blocks as Ferris does in the Rust Book.
Nobody places him by hand: the website does (`.vitepress/albert.ts`), from what a lesson
already has.

- **Tongue out** on a **Run** block that runs `bin/scoreboard.ts`.
- **A mix of his other faces** on every **Run, expect it to fail** block, on the last code
  block of a section whose heading starts *Break it*, and in the corner of every check.
  The face depends on the page and the place, so it is the same every build, and never
  the same twice in a row on a page.

So writing a lesson the usual way places him. He is for fun: the words never lean on him,
since VS Code's preview and the e-book don't show him. An **Add to** or **Replace in** block
is shown the same way as the whole file after the step, its lines highlighted and long
unchanged runs folded, with an eye beside the copy button for the step's lines alone
(`.vitepress/whole.ts`). A new face is drawn in `.vitepress/theme/albert.ts` from the logo's own parts, then
`npm run diagrams`, and lesson 0.1's *Meet Albert* shows it (`tools/albert.test.ts`
checks all of this). *Why:* a reader who sees the tongue knows the board climbed before
reading a word, and a tutorial with a few jokes in it is easier to keep going with.

## Code style the tools rely on

- One import per line, at the top. A snippet's leading imports are merged into the
  file's (`tools/tangle.ts`).
- Top-level declarations start at column 0 with their comment directly above; their
  bodies are indented. **Replace in** swaps declarations by name; a type and a value of
  the same name are two declarations.
- No multi-line template literals that put text at column 0.
- Erasable TypeScript only (no `enum`, `namespace`, parameter properties): Node runs the
  files by stripping types.
- Field names as in the test vectors (`anchor_slot`).

## Before publishing a lesson

`verify` follows every lesson from an empty client; `check` typechecks and tests the
tools and builds the website (which finds dead links). Its tests also spellcheck the lessons'
prose (`tools/spelling.ts`): English, American or British, plus the JAM words in
`tools/words.txt`. A new JAM word goes there, in lower case; a typo gets fixed.

```sh
npm run verify
npm run check
```

Then read the lesson rendered in VS Code's preview and on the website.
