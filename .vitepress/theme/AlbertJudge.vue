<!-- Part 10's Albert: the judge, gavel raised over its block (albert.ts, drawJudge). Hover
     (or tap) and he slams it — the gavel swings on the fist, the bang flashes at the block —
     unless the reader asked for reduced motion. A tap goes to lesson 0.1, where Albert is
     introduced, as every Albert does. -->
<script setup lang="ts">
import { drawJudge } from "./albert.ts";

const svg = drawJudge();
</script>

<template>
  <a class="albert-judge" href="../00-start/01-what-you-will-build#albert" title="Order! Order in the chain!" v-html="svg"></a>
</template>

<style scoped>
.albert-judge { float: right; width: 150px; margin: 4px 0 8px 16px; cursor: pointer; }
.albert-judge :deep(svg) { width: 100%; height: auto; display: block; }
.albert-judge :deep(.gavel) { transform-box: view-box; transform-origin: 69px 40px; }
.albert-judge :deep(.bang) { opacity: 0; }
.albert-judge:hover :deep(.gavel),
.albert-judge:active :deep(.gavel) { animation: slam 0.9s ease-in-out; }
.albert-judge:hover :deep(.bang),
.albert-judge:active :deep(.bang) { animation: bang 0.9s linear; }
@keyframes slam {
  0% { transform: rotate(0deg); }
  30% { transform: rotate(-25deg); } /* the wind-up */
  52% { transform: rotate(78deg); } /* the slam, onto the block */
  62% { transform: rotate(66deg); } /* a small bounce */
  100% { transform: rotate(0deg); }
}
@keyframes bang {
  0%, 50% { opacity: 0; }
  54%, 74% { opacity: 1; }
  100% { opacity: 0; }
}
@media (prefers-reduced-motion: reduce) {
  .albert-judge:hover :deep(.gavel),
  .albert-judge:active :deep(.gavel),
  .albert-judge:hover :deep(.bang),
  .albert-judge:active :deep(.bang) { animation: none; }
}
@media (max-width: 640px) {
  .albert-judge { width: 110px; margin-left: 10px; }
}
</style>
