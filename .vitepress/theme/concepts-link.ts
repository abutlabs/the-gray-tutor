// Concepts only's rules that need no browser (concepts.ts does the rest): a link's choice,
// the <head> script that applies it before the page draws, and the address that shares it.
// A link's choice lasts the visit and leaves the reader's own saved choice alone. The
// choice is kept for the visit only (sessionStorage): every fresh visit starts with the
// code shown. tools/concepts.test.ts runs them.

export const KEY = "the-gray-tutor:concepts";
export const PARAM = "concepts";
export const CLASS = "concepts";

/** A link's choice: ?concepts (or =on, =1) is on, ?concepts=off (or =0) is off, none is null. */
export function fromLink(search: string): boolean | null {
  const value = new URLSearchParams(search).get(PARAM);
  return value === null ? null : !["off", "0", "false"].includes(value);
}

/** Before the page draws: the link's choice, else the saved one. Plain ES5, as it runs inline
 *  in <head>; fromLink is the same rule, and tools/concepts.test.ts runs both. */
export const HEAD = `try{var q=new URLSearchParams(location.search).get("${PARAM}");`
  + `var on=q!==null?["off","0","false"].indexOf(q)<0:null;`
  + `try{if(on===null)on=sessionStorage.getItem("${KEY}")==="on"}catch(e){}`
  + `if(on)document.documentElement.classList.add("${CLASS}")}catch(e){}`;

/** The address with ?concepts while the mode is on, without it while off: keeps the
 *  other parameters and the #anchor. */
export function linkFor(href: string, on: boolean): string {
  const url = new URL(href);
  if (on) url.searchParams.set(PARAM, "");
  else url.searchParams.delete(PARAM);
  return url.toString().replace(`${PARAM}=`, PARAM).replace(/\?(#|$)/, "$1");
}
