<!-- The reading-mode switch (reading.ts): a round button in the corner, on every page, so it
     is still there to tap once the top bar has gone. Beside it, while the app saves the site
     for reading with no network (public/sw.js), how far it has got, and then that it's done. -->
<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { type OfflineStatus, readingOn, setReading } from "./reading.ts";

const on = ref(false);
const note = ref("");
let hide: ReturnType<typeof setTimeout> | undefined;
let saving = false;

const sync = () => { on.value = readingOn(); };
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
  <p v-if="note" class="offline-note" role="status">{{ note }}</p>
  <button
    class="read-toggle"
    type="button"
    :aria-pressed="on"
    :title="on ? 'Show the menus (R)' : 'Reading mode: hide the menus (R)'"
    @click="setReading(!on)"
  >{{ on ? "☰" : "⤢" }}<span class="visually-hidden">{{ on ? "Show the menus" : "Reading mode" }}</span></button>
</template>
