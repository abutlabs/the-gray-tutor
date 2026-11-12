// The Code switch and the client picker, the rules that need no browser (code.ts does the
// rest): which clients there are, a link's choice, the <head> script that applies both before
// the page draws, and the address that shares them. tools/code.test.ts runs them.
//
// Code is off by default: a lesson opens on its ideas, its examples and the Gray Paper's own
// words, and every snippet is folded to its label, which a tap opens. The switch in the
// header shows all the code. The choice is kept on this browser (localStorage), so a reader
// building a client turns it on once.
//
// The picker says whose code that is. Today the lessons build one client, in TypeScript, and
// quote a second, lasair, in OCaml, beside it. A client in another language is one more row
// in CLIENTS and its snippets in `::: client <id>` blocks (../clients.ts; WRITING.md, Clients).

/** A client whose code the lessons can show. */
export interface Client {
  /** In links (?client=lasair), in storage, and on a `::: client` block. Never renamed. */
  id: string;
  /** Its language, as the picker lists it. */
  language: string;
  /** Its own name, where it has one. */
  name?: string;
  /** What the lessons do with it, for the picker's tooltip. */
  about: string;
}

/** Every client, the default first: the one the lessons build, snippet by snippet. */
export const CLIENTS: Client[] = [
  { id: "tutor", language: "TypeScript", about: "the client the lessons build, step by step" },
  { id: "lasair", language: "OCaml", name: "lasair", about: "another client, quoted beside ours where a lesson compares the two" },
];
export const DEFAULT_CLIENT = CLIENTS[0].id;

/** A client as the picker lists it: "TypeScript", "OCaml · lasair". */
export const clientLabel = (c: Client): string => (c.name ? `${c.language} · ${c.name}` : c.language);

/** The client with this id, or the default for an id nobody has (a stale link, a typo). */
export const clientOr = (id: string | null | undefined): string => (CLIENTS.some((c) => c.id === id) ? id! : DEFAULT_CLIENT);

export const KEY = "the-gray-tutor:code";
export const CLIENT_KEY = "the-gray-tutor:client";
export const PARAM = "code";
export const CLIENT_PARAM = "client";
/** The switch's old name, when folded was the exception: ?concepts still opens a page folded. */
export const OLD_PARAM = "concepts";
/** On <html> while the code is folded. Without a script nothing sets it, and the code shows. */
export const CLASS = "code-folded";
/** On <html> while the picker is on a client other than the one the lessons build. */
export const OTHER_CLASS = "other-client";
/** On <html>: the chosen client's id. */
export const CLIENT_ATTR = "data-client";

const OFF = ["off", "0", "false"];

/** A link's choice of code: ?code (or =on, =1) shows it, ?code=off (or =0, =false) folds it.
 *  An old link's ?concepts folds it, and its ?concepts=off shows it. None is null. */
export function fromLink(search: string): boolean | null {
  const params = new URLSearchParams(search);
  const code = params.get(PARAM);
  if (code !== null) return !OFF.includes(code);
  const old = params.get(OLD_PARAM);
  return old === null ? null : OFF.includes(old);
}

/** A link's choice of client, ?client=lasair: null for none, or for one nobody has. */
export function clientFromLink(search: string): string | null {
  const id = new URLSearchParams(search).get(CLIENT_PARAM);
  return CLIENTS.some((c) => c.id === id) ? id : null;
}

/** Before the page draws: the link's choices, else the saved ones, else folded and the
 *  default client. Plain ES5, as it runs inline in <head>; fromLink and clientFromLink are
 *  the same rules, and tools/code.test.ts runs both. A link's choice is for that page: it
 *  leaves the saved one alone. */
export const HEAD = `try{var d=document.documentElement,s=new URLSearchParams(location.search),`
  + `off=${JSON.stringify(OFF)},ids=${JSON.stringify(CLIENTS.map((c) => c.id))},`
  + `q=s.get("${PARAM}"),o=s.get("${OLD_PARAM}"),k=s.get("${CLIENT_PARAM}"),`
  + `on=q!==null?off.indexOf(q)<0:o!==null?off.indexOf(o)>=0:null;`
  + `try{if(on===null)on=localStorage.getItem("${KEY}")==="on";`
  + `if(ids.indexOf(k)<0)k=localStorage.getItem("${CLIENT_KEY}")}catch(e){}`
  + `if(ids.indexOf(k)<0)k=ids[0];`
  + `if(!on)d.classList.add("${CLASS}");`
  + `if(k!==ids[0])d.classList.add("${OTHER_CLASS}");`
  + `d.setAttribute("${CLIENT_ATTR}",k)}catch(e){}`;

/** The address that shares the page as it is: ?code while the code shows, ?client=… while
 *  another client is chosen, neither at the defaults. Keeps the other parameters and the
 *  #anchor, and drops the old ?concepts. */
export function linkFor(href: string, on: boolean, client: string = DEFAULT_CLIENT): string {
  const url = new URL(href);
  url.searchParams.delete(OLD_PARAM);
  if (on) url.searchParams.set(PARAM, "");
  else url.searchParams.delete(PARAM);
  if (client !== DEFAULT_CLIENT) url.searchParams.set(CLIENT_PARAM, client);
  else url.searchParams.delete(CLIENT_PARAM);
  return url.toString().replace(new RegExp(`([?&])${PARAM}=(?=&|#|$)`), `$1${PARAM}`).replace(/\?(#|$)/, "$1");
}

/** The rules that show another client's blocks while it is chosen and the code is on; one
 *  per client, so a new row in CLIENTS needs no stylesheet change. config.ts puts them in
 *  every page's <head>. */
export const CLIENT_CSS = CLIENTS.slice(1)
  .map((c) => `html[${CLIENT_ATTR}="${c.id}"]:not(.${CLASS}) .vp-doc .client-code[${CLIENT_ATTR}="${c.id}"]{display:block}`)
  .join("");
