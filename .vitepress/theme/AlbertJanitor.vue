<!-- Lesson 10.3's Albert: the janitor, "yuk" on his face, plunging a blocked toilet (albert.ts,
     drawJanitor) — a core with a bad report stuck on it. Hover (or tap) and he pumps three times, and on the last the
     clog pops loose and rises; reduced motion keeps him still. A tap goes to lesson 0.1, where
     Albert is introduced. -->
<script setup lang="ts">
import { drawJanitor } from "./albert.ts";

const svg = drawJanitor();
</script>

<template>
  <a class="albert-janitor" href="../00-start/01-what-you-will-build#albert" title="Out it goes. The core is free for honest work." v-html="svg"></a>
</template>

<style scoped>
.albert-janitor { float: right; width: 150px; margin: 4px 0 8px 16px; cursor: pointer; }
.albert-janitor :deep(svg) { width: 100%; height: auto; display: block; }
.albert-janitor :deep(.plunger), .albert-janitor :deep(.clog), .albert-janitor :deep(.stink) { transform-box: view-box; }
.albert-janitor :deep(.clog) { opacity: 0; }
.albert-janitor:hover :deep(.plunger),
.albert-janitor:active :deep(.plunger) { animation: pump 1.2s ease-in-out; }
.albert-janitor:hover :deep(.clog),
.albert-janitor:active :deep(.clog) { animation: pop 1.2s ease-out; }
.albert-janitor:hover :deep(.stink),
.albert-janitor:active :deep(.stink) { animation: reek 1.2s ease-in-out; }
@keyframes pump {
  0%, 100% { transform: translateY(0); }
  12%, 52% { transform: translateY(5px); } /* down onto the clog */
  27%, 67% { transform: translateY(-3px); } /* and back up */
  82% { transform: translateY(6px); } /* the last, hard pump */
}
@keyframes pop {
  0%, 80% { opacity: 0; transform: translateY(0); }
  86% { opacity: 1; transform: translateY(-2px); } /* it comes loose */
  100% { opacity: 0; transform: translateY(-16px); } /* and rises out */
}
@keyframes reek {
  0%, 100% { transform: translateY(0); opacity: 1; }
  50% { transform: translateY(-3px); opacity: 0.55; } /* it wafts up as the clog moves */
}
@media (prefers-reduced-motion: reduce) {
  .albert-janitor:hover :deep(.plunger),
  .albert-janitor:active :deep(.plunger),
  .albert-janitor:hover :deep(.clog),
  .albert-janitor:active :deep(.clog),
  .albert-janitor:hover :deep(.stink),
  .albert-janitor:active :deep(.stink) { animation: none; }
}
@media (max-width: 640px) {
  .albert-janitor { width: 110px; margin-left: 10px; }
}
</style>
