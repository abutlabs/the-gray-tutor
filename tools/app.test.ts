// The installable app (.vitepress/app.ts) and reading mode's head script
// (.vitepress/theme/reading-head.ts).

import assert from "node:assert/strict";
import { test } from "node:test";
import { iconSvg, manifest } from "../.vitepress/app.ts";
import { READ_CLASS, READ_HEAD } from "../.vitepress/theme/reading-head.ts";

test("the app opens on the site's start, in reading mode, and stays inside the site", () => {
  const m = manifest("/the-gray-tutor/") as Record<string, unknown>;
  assert.equal(m.start_url, "/the-gray-tutor/?read");
  assert.equal(m.scope, "/the-gray-tutor/");
  assert.equal(m.display, "standalone");
  const icons = m.icons as { src: string; sizes: string }[];
  assert.ok(icons.some((i) => i.sizes === "512x512" && i.src === "/the-gray-tutor/icons/icon-512.png"));
});

test("the icon leaves room around the logo for a launcher's mask", () => {
  assert.equal(iconSvg('<svg viewBox="0 0 64 64"><path/></svg>'), '<svg viewBox="-14 -14 92 92"><path/></svg>');
});

/** Runs the head script against a page at `search`, with what was saved and how it was opened. */
function headFor(search: string, saved: string | null, standalone = false): { on: boolean; saved: string | null } {
  const classes = new Set<string>();
  let store = saved;
  const page = {
    document: { documentElement: { classList: { add: (c: string) => classes.add(c) } } },
    location: { search },
    URLSearchParams,
    localStorage: { getItem: () => store, setItem: (_: string, v: string) => { store = v; } },
    matchMedia: () => ({ matches: standalone }),
  };
  new Function(...Object.keys(page), READ_HEAD)(...Object.values(page));
  return { on: classes.has(READ_CLASS), saved: store };
}

test("reading mode: the address first, then the saved choice, then an installed app reads", () => {
  assert.deepEqual(headFor("?read", null), { on: true, saved: "on" });
  assert.deepEqual(headFor("?read=0", "on"), { on: false, saved: "off" });
  assert.equal(headFor("", "on").on, true);
  assert.equal(headFor("", "off", true).on, false);
  assert.equal(headFor("", null, true).on, true);
  assert.equal(headFor("", null).on, false);
});
