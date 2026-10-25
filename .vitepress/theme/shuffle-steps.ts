// Lesson 7.2's widget: F, the Fisher-Yates shuffle, one pick at a time. Pick the item at
// number mod l, move the last item into its gap, drop the last place, go again. The two
// decks are the lesson's: a b c d with 1, 1, 0, 0, and 0…7 with the eight numbers the
// shuffle-eight run draws from the all-ff hash. tools/widget-shuffle-steps.test.ts checks
// every pick against the lesson's table, test and Output.

export type Deck = { name: string; items: string[]; numbers: number[]; from: string };
export const DECKS: Deck[] = [
  { name: "a b c d, with 1, 1, 0, 0", items: ["a", "b", "c", "d"], numbers: [1, 1, 0, 0], from: "the lesson's table" },
  {
    name: "0 to 7, with the all-ff hash's numbers",
    items: ["0", "1", "2", "3", "4", "5", "6", "7"],
    numbers: [3180133873, 2874123541, 1702679006, 3779386820, 313342713, 1075366959, 2867850673, 573291173],
    from: "npm run shuffle-eight",
  },
];

/** One pick: what was left, the number, l, the quotient and remainder of number ÷ l (the
 *  remainder is the index), the item picked, what filled the gap, and what's left after. */
export type Pick = { left: string[]; number: number; l: number; quotient: number; index: number; picked: string; filler: string | null; after: string[] };

/** Every pick of a deck, in order: JAM's way (the last item fills the gap), or the obvious
 *  way (splice: close the gap up), which the lesson's Break it on purpose tries. */
export function picks(deck: Deck, splice = false): Pick[] {
  const left = [...deck.items];
  const out: Pick[] = [];
  for (const number of deck.numbers.slice(0, deck.items.length)) {
    const l = left.length;
    const index = number % l;
    const picked = left[index];
    const before = [...left];
    let filler: string | null = null;
    if (splice) left.splice(index, 1);
    else {
      filler = index === l - 1 ? null : left[l - 1];
      left[index] = left[l - 1];
      left.pop();
    }
    out.push({ left: before, number, l, quotient: Math.floor(number / l), index, picked, filler, after: [...left] });
  }
  return out;
}
/** The shuffled sequence: the picks in order. */
export const shuffled = (deck: Deck, splice = false): string[] => picks(deck, splice).map((p) => p.picked);
