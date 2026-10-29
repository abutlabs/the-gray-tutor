<!-- Part 8's Albert: the gambler, a fan of lottery tickets (albert.ts, drawGambler). Hover
     (or tap) and the fan spreads, the red-dotted winner popping out of it; reduced motion
     spreads it without the flourish. A tap goes to lesson 0.1, where Albert is introduced. -->
<script setup lang="ts">
import { drawGambler } from "./albert.ts";

const svg = drawGambler();
</script>

<template>
  <a class="albert-gambler" href="../00-start/01-what-you-will-build#albert" title="Lowest id wins. He likes his odds." v-html="svg"></a>
</template>

<style scoped>
.albert-gambler { float: right; width: 150px; margin: 4px 0 8px 16px; cursor: pointer; }
.albert-gambler :deep(svg) { width: 100%; height: auto; display: block; }
.albert-gambler :deep(.ticket) {
  transform-box: view-box;
  transform-origin: 71.5px 49px;
  transform: rotate(calc(var(--lean) * 0.35)); /* the fan, nearly closed */
  transition: transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.albert-gambler:hover :deep(.ticket),
.albert-gambler:active :deep(.ticket) { transform: rotate(var(--lean)); } /* spread */
.albert-gambler:hover :deep(.ticket.winner),
.albert-gambler:active :deep(.ticket.winner) { transform: rotate(var(--lean)) translateY(-6px); } /* the winner pops */
@media (prefers-reduced-motion: reduce) {
  .albert-gambler :deep(.ticket) { transition: none; }
}
@media (max-width: 640px) {
  .albert-gambler { width: 110px; margin-left: 10px; }
}
</style>
