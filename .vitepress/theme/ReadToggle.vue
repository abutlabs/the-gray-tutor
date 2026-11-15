<!-- Reading mode's buttons (reading.ts), in the corner of every page, still there once the
     top bar has gone: ✎ lists your pen notes (NotesPanel.vue), ⤢ goes full screen, and in full screen ☰ opens the contents over the
     page and ⤡ brings the menus back. Beside them, while the app saves the site for reading
     with no network (public/sw.js), how far it has got, and then that it's done. -->
<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from "vue";
import { useRoute } from "vitepress";
import { revealActiveLesson } from "./keys.ts";
import NotesPanel from "./NotesPanel.vue";
import { contentsOpen, type OfflineStatus, readingOn, setContents, setReading } from "./reading.ts";

const on = ref(false);
const contents = ref(false);
const note = ref("");
const notes = ref<InstanceType<typeof NotesPanel> | null>(null);
let hide: ReturnType<typeof setTimeout> | undefined;
let saving = false;

const sync = () => { on.value = readingOn(); contents.value = contentsOpen(); };
function status(e: Event) {
  const { offline, done = 0, total = 0 } = (e as CustomEvent<OfflineStatus>).detail ?? {};
  clearTimeout(hide);
  if (offline === "saving") {
    saving = true;
    note.value = `Saving for offline… ${done} / ${total}`;
  } else if (offline === "ready" && saving) {
    // only after a save this visit: an app already saved stays quiet
    saving = false;
    note.value = "Ready offline ✓";
    hide = setTimeout(() => { note.value = ""; }, 8000);
  } else if (offline === "failed" && saving) {
    saving = false;
    note.value = "Offline copy incomplete: it carries on next time the app opens online";
    hide = setTimeout(() => { note.value = ""; }, 8000);
  }
}
function openContents() {
  setContents(true);
  revealActiveLesson();
}
// a lesson chosen from the contents: the page that opens is the one to read
const route = useRoute();
watch(() => route.path, () => { if (contentsOpen()) setContents(false); });

onMounted(() => {
  sync();
  window.addEventListener("reading-change", sync);
  window.addEventListener("offline-status", status);
});
onUnmounted(() => {
  window.removeEventListener("reading-change", sync);
  window.removeEventListener("offline-status", status);
});
</script>

<template>
  <div v-if="contents" class="contents-backdrop" @click="setContents(false)" />
  <p v-if="note" class="offline-note" role="status">{{ note }}</p>
  <NotesPanel ref="notes" />
  <div class="read-buttons">
    <button class="read-toggle" type="button" title="Your notes" @click="notes?.show()"
    >✎<span class="visually-hidden">Your notes</span></button>
    <button
      v-if="on"
      class="read-toggle"
      type="button"
      :aria-expanded="contents"
      title="Contents"
      @click="contents ? setContents(false) : openContents()"
    >{{ contents ? "✕" : "☰" }}<span class="visually-hidden">{{ contents ? "Close the contents" : "Contents" }}</span></button>
    <button
      class="read-toggle"
      type="button"
      :aria-pressed="on"
      :title="on ? 'Leave full screen: show the menus (R)' : 'Full screen: hide the menus (R)'"
      @click="setReading(!on)"
    >{{ on ? "⤡" : "⤢" }}<span class="visually-hidden">{{ on ? "Leave full screen" : "Full screen" }}</span></button>
  </div>
</template>
