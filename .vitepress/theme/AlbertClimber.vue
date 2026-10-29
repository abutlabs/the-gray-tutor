<!-- Lesson 9.1's Albert: the climber, roped to the biggest of three mountains — of 1, 2
     and 4, like the belt's (albert.ts, drawClimber). Hover (or tap) and the flag plants on
     the summit and waves: M_R, one flag over all the peaks. Reduced motion keeps the range
     still. A tap goes to lesson 0.1, where Albert is introduced. -->
<script setup lang="ts">
import { drawClimber } from "./albert.ts";

const svg = drawClimber();
</script>

<template>
  <a class="albert-climber" href="../00-start/01-what-you-will-build#albert" title="Mountains of 1, 2 and 4. The flag goes over all of them." v-html="svg"></a>
</template>

<style scoped>
.albert-climber { float: right; width: 200px; margin: 4px 0 8px 16px; cursor: pointer; }
.albert-climber :deep(svg) { width: 100%; height: auto; display: block; }
.albert-climber :deep(.flag) { transform-box: view-box; transform-origin: 108px 16px; opacity: 0; }
.albert-climber:hover :deep(.flag),
.albert-climber:active :deep(.flag) { animation: plant 1.4s ease-in-out; }
@keyframes plant {
  0% { opacity: 0; transform: translateY(9px); } /* still in the pack */
  25% { opacity: 1; transform: translateY(0); } /* planted on the summit */
  45% { transform: translateY(0) rotate(3deg); } /* and it waves */
  65% { transform: translateY(0) rotate(-3deg); }
  85%, 100% { opacity: 1; transform: translateY(0) rotate(0deg); }
}
@media (prefers-reduced-motion: reduce) {
  .albert-climber:hover :deep(.flag),
  .albert-climber:active :deep(.flag) { animation: none; opacity: 1; }
}
@media (max-width: 640px) {
  .albert-climber { width: 150px; margin-left: 10px; }
}
</style>
