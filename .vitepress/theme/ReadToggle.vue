<!-- The reading-mode switch (reading.ts): a round button in the corner, on every page, so it
     is still there to tap once the top bar has gone. -->
<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { readingOn, setReading } from "./reading.ts";

const on = ref(false);
const sync = () => { on.value = readingOn(); };
onMounted(() => { sync(); window.addEventListener("reading-change", sync); });
onUnmounted(() => window.removeEventListener("reading-change", sync));
</script>

<template>
  <button
    class="read-toggle"
    type="button"
    :aria-pressed="on"
    :title="on ? 'Show the menus (R)' : 'Reading mode: hide the menus (R)'"
    @click="setReading(!on)"
  >{{ on ? "☰" : "⤢" }}<span class="visually-hidden">{{ on ? "Show the menus" : "Reading mode" }}</span></button>
</template>
