// A formula wider than its column is drawn smaller, so it fits (fit-formulas.ts does the
// measuring and the drawing). The rule itself needs no browser: tools/fit.test.ts runs it.

/** How much to shrink something `natural` px wide to fit `available` px: 1 if it fits as it
 *  is (within a pixel of rounding), never more than 1, and 1 where there is nothing to
 *  measure yet (a formula in a closed fold is 0 wide). */
export function fitScale(natural: number, available: number): number {
  if (!(natural > 0) || !(available > 0)) return 1;
  if (natural <= available + 1) return 1;
  return Math.floor((available / natural) * 1000) / 1000;
}
