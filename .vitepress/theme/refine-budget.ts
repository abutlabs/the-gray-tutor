// JAM beside Aztec's widget: which proof checks refine can pay for. Each proof's gas is the
// page's: three measured on the PVM (our transfer proof in the privacy service, built for
// speed; a one-input UltraHonk proof and a Groth16 proof, both built for size), and Aztec's
// CHONK proof estimated from timing its verifier beside ours. tools/widget-refine-budget.test.ts
// checks them against the page.

export const PACKAGES = { tiny: 1_000_000_000, full: 5_000_000_000 } as const;
export type Size = keyof typeof PACKAGES;

export interface Proof {
  id: string;
  name: string;
  gas: number;
  how: string;
}

export const PROOFS: Proof[] = [
  { id: "ours", name: "our transfer", gas: 169_112_761, how: "UltraHonk, measured in the service, built for speed" },
  { id: "honk", name: "UltraHonk, size", gas: 286_136_021, how: "a one-input UltraHonk proof, measured, built for size" },
  { id: "groth16", name: "Groth16, size", gas: 246_884_255, how: "a Groth16 proof, measured, built for size" },
  { id: "chonk", name: "Aztec's CHONK", gas: 12_000_000_000, how: "Aztec's kernel proof, estimated: 70 to 79 times ours" },
];

/** How many checks of this proof one package pays for. */
export const fits = (budget: number, gas: number): number => Math.floor(budget / gas);

/** How many packages one check needs, to one decimal place. */
export const packagesFor = (budget: number, gas: number): number => Math.round((gas / budget) * 10) / 10;
