<!-- Lesson 10.5's Albert: the jailbird, stripes and all, fists on the bars (albert.ts,
     drawJailbird). Hover (or tap) and he rattles the cell; reduced motion leaves it shut
     and still. His keys went into ψ_O. A tap goes to lesson 0.1, where Albert is
     introduced. -->
<script setup lang="ts">
import { drawJailbird } from "./albert.ts";

const svg = drawJailbird();
</script>

<template>
  <a class="albert-jailbird" href="../00-start/01-what-you-will-build#albert" title="His keys went into ψ_O." v-html="svg"></a>
</template>

<style scoped>
.albert-jailbird { float: right; width: 120px; margin: 4px 0 8px 16px; cursor: pointer; }
.albert-jailbird :deep(svg) { width: 100%; height: auto; display: block; }
.albert-jailbird :deep(.cell) { transform-box: view-box; }
.albert-jailbird:hover :deep(.cell),
.albert-jailbird:active :deep(.cell) { animation: rattle 0.6s ease-in-out; }
@keyframes rattle {
  0%, 100% { transform: translateX(0); }
  15% { transform: translateX(-1.6px); }
  35% { transform: translateX(1.6px); }
  55% { transform: translateX(-1px); }
  75% { transform: translateX(1px); }
}
@media (prefers-reduced-motion: reduce) {
  .albert-jailbird:hover :deep(.cell),
  .albert-jailbird:active :deep(.cell) { animation: none; }
}
@media (max-width: 640px) {
  .albert-jailbird { width: 90px; margin-left: 10px; }
}
</style>
