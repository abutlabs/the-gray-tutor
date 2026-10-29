<!-- Part 2's Albert: the chemist, test tube over the flask (albert.ts, drawChemist). Hover
     (or tap) and he pours — the tube tips on the fist, three drops fall — unless the reader
     asked for reduced motion. The vector says what must come out. A tap goes to lesson 0.1,
     where Albert is introduced. -->
<script setup lang="ts">
import { drawChemist } from "./albert.ts";

const svg = drawChemist();
</script>

<template>
  <a class="albert-chemist" href="../00-start/01-what-you-will-build#albert" title="For science. The vector says what comes out." v-html="svg"></a>
</template>

<style scoped>
.albert-chemist { float: right; width: 150px; margin: 4px 0 8px 16px; cursor: pointer; }
.albert-chemist :deep(svg) { width: 100%; height: auto; display: block; }
.albert-chemist :deep(.tube) { transform-box: view-box; transform-origin: 69px 42px; }
.albert-chemist :deep(.drops) { opacity: 0; }
.albert-chemist:hover :deep(.tube),
.albert-chemist:active :deep(.tube) { animation: pour 1.3s ease-in-out; }
.albert-chemist:hover :deep(.drops),
.albert-chemist:active :deep(.drops) { animation: drip 1.3s linear; }
@keyframes pour {
  0% { transform: rotate(0deg); }
  28% { transform: rotate(50deg); } /* tipped over the flask */
  72% { transform: rotate(50deg); } /* held while it drips */
  100% { transform: rotate(0deg); }
}
@keyframes drip {
  0%, 26% { opacity: 0; }
  32%, 72% { opacity: 1; } /* the drops, while the tube is tipped */
  82%, 100% { opacity: 0; }
}
@media (prefers-reduced-motion: reduce) {
  .albert-chemist:hover :deep(.tube),
  .albert-chemist:active :deep(.tube),
  .albert-chemist:hover :deep(.drops),
  .albert-chemist:active :deep(.drops) { animation: none; }
}
@media (max-width: 640px) {
  .albert-chemist { width: 110px; margin-left: 10px; }
}
</style>
