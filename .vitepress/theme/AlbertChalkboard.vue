<!-- The symbols page's Albert: at the chalkboard, mid-proof (albert.ts, drawChalkboard).
     Hover (or tap) and he draws the bottom line, the chalk hand sliding along it; reduced
     motion keeps the board still. A tap goes to lesson 0.1, where Albert is introduced. -->
<script setup lang="ts">
import { drawChalkboard } from "./albert.ts";

const svg = drawChalkboard();
</script>

<template>
  <a class="albert-chalkboard" href="./00-start/01-what-you-will-build#albert" title="It stops being mysterious after one go." v-html="svg"></a>
</template>

<style scoped>
.albert-chalkboard { float: right; width: 200px; margin: 4px 0 8px 16px; cursor: pointer; }
.albert-chalkboard :deep(svg) { width: 100%; height: auto; display: block; }
.albert-chalkboard :deep(.chalk) { transform-box: view-box; }
.albert-chalkboard:hover :deep(.chalk-line),
.albert-chalkboard:active :deep(.chalk-line) { animation: chalk-draw 1.4s ease-in-out; }
.albert-chalkboard:hover :deep(.chalk),
.albert-chalkboard:active :deep(.chalk) { animation: chalk-along 1.4s ease-in-out; }
@keyframes chalk-draw {
  0%, 12% { stroke-dasharray: 44; stroke-dashoffset: 44; } /* wiped */
  88% { stroke-dasharray: 44; stroke-dashoffset: 0; } /* drawn, left to right */
  100% { stroke-dasharray: 44; stroke-dashoffset: 0; }
}
@keyframes chalk-along {
  0%, 12% { transform: translate(2px, -2px); }
  88% { transform: translate(44px, -2px); } /* the hand keeps up with the line */
  100% { transform: translate(0, 0); }
}
@media (prefers-reduced-motion: reduce) {
  .albert-chalkboard:hover :deep(.chalk-line),
  .albert-chalkboard:active :deep(.chalk-line),
  .albert-chalkboard:hover :deep(.chalk),
  .albert-chalkboard:active :deep(.chalk) { animation: none; }
}
@media (max-width: 640px) {
  .albert-chalkboard { width: 150px; margin-left: 10px; }
}
</style>
