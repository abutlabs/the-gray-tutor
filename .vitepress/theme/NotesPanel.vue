<!-- Your notes (ink.ts): ✎ in the corner opens the list of every lesson you've written on,
     newest first, each a link to its page; and the buttons that clear this page's ink, save
     all of them to a file, or bring a saved file back. The notes live in this browser, on
     this tablet; the file is the copy to keep elsewhere. -->
<script setup lang="ts">
import { ref } from "vue";
import { allNotes, clearPage, exportNotes, importNotes, type NotesFile, type PageNotes, pageHasInk } from "./ink.ts";

const dialog = ref<HTMLDialogElement | null>(null);
const picker = ref<HTMLInputElement | null>(null);
const pages = ref<PageNotes[]>([]);
const here = ref(false);
const message = ref("");

async function show() {
  message.value = "";
  here.value = pageHasInk();
  try {
    pages.value = (await allNotes()).sort((a, b) => b.updated - a.updated);
  } catch {
    pages.value = [];
    message.value = "This browser isn't keeping notes (a private window?): they last until the page closes.";
  }
  dialog.value?.showModal();
}
defineExpose({ show });

const when = (t: number) => new Date(t).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
const strokes = (n: number) => `${n} stroke${n === 1 ? "" : "s"}`;

async function clearHere() {
  await clearPage();
  await show();
  message.value = "This page's notes are cleared.";
}

async function save() {
  const file = await exportNotes();
  const blob = new Blob([JSON.stringify(file)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `gray-tutor-notes-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
  message.value = `Saved ${file.pages.length} page${file.pages.length === 1 ? "" : "s"} of notes to your Downloads folder.`;
}

async function load(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  try {
    const taken = await importNotes(JSON.parse(await file.text()) as NotesFile);
    await show();
    message.value = `Brought in ${taken} page${taken === 1 ? "" : "s"} of notes (where a page has both, the newer copy is kept).`;
  } catch {
    message.value = "That file isn't a Gray Tutor notes file.";
  }
  (event.target as HTMLInputElement).value = "";
}
</script>

<template>
  <dialog ref="dialog" class="notes-panel" @click="(e) => e.target === dialog && dialog?.close()">
    <h2>Your notes</h2>
    <p class="notes-where">
      Write on any lesson with the pen; a finger still scrolls. The pen's side button rubs
      ink out. Notes are kept in this app on this tablet, and work offline. Save them to a
      file to keep a copy anywhere else.
    </p>
    <ul v-if="pages.length" class="notes-list">
      <li v-for="p in pages" :key="p.path">
        <a :href="p.path" @click="dialog?.close()">{{ p.title || p.path }}</a>
        <span>{{ strokes(p.strokes.length) }} · {{ when(p.updated) }}</span>
      </li>
    </ul>
    <p v-else class="notes-none">No notes yet.</p>
    <p v-if="message" class="notes-message" role="status">{{ message }}</p>
    <div class="notes-actions">
      <button v-if="here" type="button" @click="clearHere">Clear this page</button>
      <button type="button" :disabled="!pages.length" @click="save">Save to a file</button>
      <button type="button" @click="picker?.click()">Bring in a file</button>
      <button type="button" @click="dialog?.close()">Close</button>
    </div>
    <input ref="picker" type="file" accept="application/json,.json" hidden @change="load" />
  </dialog>
</template>
