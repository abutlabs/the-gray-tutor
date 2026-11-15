// What reading mode (reading.ts) needs before the page draws: config.ts puts READ_HEAD in
// every page's head. Apart from reading.ts, so the site's config loads none of the browser code.

export const READ_CLASS = "reading";
export const READ_KEY = "the-gray-tutor:reading";
export const READ_PARAM = "read";

/** Run in the page's head, before it draws, so the menus never flash on: the address, then
 *  the saved choice, then an installed app (standalone) reads by default. */
export const READ_HEAD = `try{var d=document.documentElement,q=new URLSearchParams(location.search).get("${READ_PARAM}"),on=null;`
  + `if(q!==null)on=q!=="0"&&q!=="off";`
  + `try{if(on===null){var v=localStorage.getItem("${READ_KEY}");if(v)on=v==="on"}else localStorage.setItem("${READ_KEY}",on?"on":"off")}catch(e){}`
  + `if(on===null)on=matchMedia("(display-mode: standalone)").matches;`
  + `if(on)d.classList.add("${READ_CLASS}")}catch(e){}`;
