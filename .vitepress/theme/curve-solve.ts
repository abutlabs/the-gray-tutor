// Lesson 3.3's curve, worked by hand: how three letters become y = a + bx + cx², how the
// curve gives the other shards, and how any three shards give the curve back. Every sum is
// exact (fractions, no rounding) and every step is shown with its numbers, so the reader
// checks the math instead of trusting it. The numbers are plain, not wrapped round JAM's
// clock (shards.ts does that for the plot); for letters whose shards stay below 257 the two
// agree. tools/widget-curve-solve.test.ts checks every step against shards.ts and the lesson.

/** An exact fraction n/d, d > 0, in lowest terms. */
export interface Frac { n: number; d: number }
const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b));
export function frac(n: number, d = 1): Frac {
  if (d === 0) throw new RangeError("divide by 0");
  const g = gcd(n, d) || 1;
  const s = d < 0 ? -1 : 1;
  return { n: (s * n) / g, d: (s * d) / g };
}
export const add = (a: Frac, b: Frac) => frac(a.n * b.d + b.n * a.d, a.d * b.d);
export const sub = (a: Frac, b: Frac) => frac(a.n * b.d - b.n * a.d, a.d * b.d);
export const mul = (a: Frac, b: Frac) => frac(a.n * b.n, a.d * b.d);
export const div = (a: Frac, b: Frac) => frac(a.n * b.d, a.d * b.n);
export const eq = (a: Frac, b: Frac) => a.n === b.n && a.d === b.d;

/** A fraction as a reader writes it: 74, −19.5, 1/3; a minus sign, not a hyphen. */
export function show(f: Frac): string {
  const sign = f.n < 0 ? "−" : "";
  const n = Math.abs(f.n);
  if (f.d === 1) return `${sign}${n}`;
  if (f.d === 2) return `${sign}${(n / 2).toFixed(1)}`;
  return `${sign}${n}/${f.d}`;
}
/** A number in a sum: in brackets when negative, "× (−19.5)". */
const inSum = (f: Frac) => (f.n < 0 ? `(${show(f)})` : show(f));

export interface Curve { a: Frac; b: Frac; c: Frac }
export const at = ({ a, b, c }: Curve, x: number): Frac => add(add(a, mul(b, frac(x))), mul(c, frac(x * x)));

/** The curve as written: "y = 74 − 19.5x + 10.5x²", "y = 49 + 2x". */
export function curveText({ a, b, c }: Curve): string {
  let out = `y = ${show(a)}`;
  for (const [k, p] of [[b, "x"], [c, "x²"]] as const) {
    if (k.n === 0) continue;
    const size = Math.abs(k.n) === k.d ? "" : show(frac(Math.abs(k.n), k.d));
    out += ` ${k.n < 0 ? "−" : "+"} ${size}${p}`;
  }
  return out.replace("y = 0 + ", "y = ").replace("y = 0 − ", "y = −");
}

/** A point: a shard's x (which validator) and its y (its value). */
export interface Point { x: number; y: number }

/** One step of working: what it finds, and the sum with its numbers. */
export interface Step { finds: string; sum: string }

/** How much the curve climbs per step from p to q: b + c·(p.x + q.x) for y = a + bx + cx². */
export const slope = (p: Point, q: Point): Frac => div(frac(q.y - p.y), frac(q.x - p.x));

/** The curve through any three points, by the steps a reader can follow:
 *  between two points p and q the curve climbs (y_q − y_p) / (q − p) = b + c·(p + q) a step
 *  (since c·q² − c·p² = c·(q − p)·(q + p)); two such slopes differ only by c's share, which
 *  gives c, then b, then a. */
export function solve([p, q, r]: Point[]): { curve: Curve; steps: Step[] } {
  const s1 = slope(p, q);
  const s2 = slope(q, r);
  const c = div(sub(s2, s1), frac(r.x - p.x));
  const b = sub(s1, mul(c, frac(p.x + q.x)));
  const a = sub(sub(frac(p.y), mul(b, frac(p.x))), mul(c, frac(p.x * p.x)));
  const steps: Step[] = [
    { finds: `slope from x = ${p.x} to ${q.x}`, sum: `(${show(frac(q.y))} − ${inSum(frac(p.y))}) ÷ (${q.x} − ${p.x}) = ${show(s1)}, which is b + c × ${p.x + q.x}` },
    { finds: `slope from x = ${q.x} to ${r.x}`, sum: `(${show(frac(r.y))} − ${inSum(frac(q.y))}) ÷ (${r.x} − ${q.x}) = ${show(s2)}, which is b + c × ${q.x + r.x}` },
    { finds: "c", sum: `the slopes differ by c × (${q.x + r.x} − ${p.x + q.x}): c = (${show(s2)} − ${inSum(s1)}) ÷ ${r.x - p.x} = ${show(c)}` },
    { finds: "b", sum: `b = ${show(s1)} − ${inSum(c)} × ${p.x + q.x} = ${show(b)}` },
    { finds: "a", sum: `a = ${show(frac(p.y))} − ${inSum(b)} × ${p.x} − ${inSum(c)} × ${p.x * p.x} = ${show(a)}` },
  ];
  return { curve: { a, b, c }, steps };
}

/** The curve's value at x, worked: "74 − 19.5 × 3 + 10.5 × 9 = 74 − 58.5 + 94.5 = 110". */
export function reading({ a, b, c }: Curve, x: number): string {
  const bx = mul(b, frac(x)), cx = mul(c, frac(x * x));
  const term = (f: Frac) => `${f.n < 0 ? "−" : "+"} ${show(frac(Math.abs(f.n), f.d))}`;
  return `${show(a)} ${term(b)} × ${x} ${term(c)} × ${x * x} = ${show(a)} ${term(bx)} ${term(cx)} = ${show(at({ a, b, c }, x))}`;
}

/** A message's points: its three letters at x = 0, 1 and 2. */
export const pointsOf = (codes: number[]): Point[] => codes.map((y, x) => ({ x, y }));

/** The six shards of a three-letter message, as plain numbers: the curve at x = 0 to 5. */
export function shardsOf(codes: number[]): number[] {
  const { curve } = solve(pointsOf(codes));
  return [0, 1, 2, 3, 4, 5].map((x) => {
    const y = at(curve, x);
    if (y.d !== 1) throw new Error("a shard is always whole");
    return y.n;
  });
}

export const PRESETS = ["JAM", "Hey"];
