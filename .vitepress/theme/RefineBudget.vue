<!-- JAM beside Aztec: refine's budget against one proof check. Pick a proof and a package
     size: how many checks fit, drawn as blocks across the package, or how many packages one
     check would need. Computed in refine-budget.ts. -->
<script setup lang="ts">
import { computed, ref } from "vue";
import type { Size } from "./refine-budget.ts";
import { fits, PACKAGES, packagesFor, PROOFS } from "./refine-budget.ts";

const size = ref<Size>("full");
const pick = ref(PROOFS[0].id);
const proof = computed(() => PROOFS.find((p) => p.id === pick.value)!);
const budget = computed(() => PACKAGES[size.value]);
const n = computed(() => fits(budget.value, proof.value.gas));
const width = computed(() => (proof.value.gas / budget.value) * 100);
const fmt = (x: number) => x.toLocaleString("en-US");
</script>

<template>
  <div class="widget refine-budget">
    <div class="readout" aria-live="polite">
      <div class="tile"><span class="tile-label">gas a check</span><span class="tile-value gas">{{ fmt(proof.gas) }}</span></div>
      <div class="tile"><span class="tile-label">checks a {{ size }} package</span><span class="tile-value">{{ n }}</span></div>
    </div>
    <p class="line">{{ proof.how }}. A {{ size }} package gives refine {{ fmt(budget) }} gas.</p>
    <div class="controls">
      <span class="muted">proof</span>
      <button v-for="p in PROOFS" :key="p.id" class="small" :class="{ chosen: pick === p.id }" :aria-pressed="pick === p.id" @click="pick = p.id">{{ p.name }}</button>
    </div>
    <div class="controls">
      <span class="muted">package</span>
      <button v-for="s in (['tiny', 'full'] as Size[])" :key="s" class="small" :class="{ chosen: size === s }" :aria-pressed="size === s" @click="size = s">{{ s }}</button>
    </div>
    <div class="package" role="img" :aria-label="n > 0 ? `${n} checks fill the package` : `one check needs ${packagesFor(budget, proof.gas)} packages`">
      <template v-if="n > 0">
        <span v-for="k in n" :key="k" class="check" :style="{ width: `${width}%` }"></span>
      </template>
      <span v-else class="over">one check needs {{ packagesFor(budget, proof.gas) }} {{ size }} packages</span>
    </div>
    <p class="sum">{{ n > 0 ? `${fmt(budget)} ÷ ${fmt(proof.gas)} = ${n}, rounded down` : `${fmt(proof.gas)} ÷ ${fmt(budget)} = ${packagesFor(budget, proof.gas)}: refine can't pay for one` }}</p>
  </div>
</template>

<style scoped>
.refine-budget .tile-value.gas { min-width: 15ch; }
.line { margin: 8px 0; font-size: 14px; line-height: 1.6; min-height: 3.2em; }
.controls { display: flex; flex-wrap: wrap; align-items: center; gap: 4px; margin: 0 0 6px; }
.controls button.small { min-height: 32px; }
.muted { font-size: 12px; color: var(--vp-c-text-2); min-width: 7ch; }
.package {
  display: flex; height: 36px; margin: 10px 0 4px; overflow: hidden;
  border: 2px solid var(--vp-c-text-2); border-radius: 4px; background: var(--vp-c-bg-soft);
}
.check { flex: none; height: 100%; box-sizing: border-box; border-right: 1px solid var(--vp-c-bg); background: var(--vp-c-brand-1); }
.over {
  flex: 1; display: flex; align-items: center; justify-content: center; padding: 0 8px;
  font-size: 13px; font-weight: 600; color: var(--vp-c-danger-1); background-color: var(--vp-c-danger-soft);
  background-image: repeating-linear-gradient(45deg, transparent 0 8px, var(--vp-c-danger-soft) 8px 16px);
}
.sum { margin: 4px 0; font-family: var(--vp-font-family-mono); font-size: 13px; overflow-wrap: anywhere; }
</style>
