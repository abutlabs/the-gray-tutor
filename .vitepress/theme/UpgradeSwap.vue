<!-- Lesson 17.10: the swap, and the next run's trap. Service 0's record from the
     upgrade_service-1 vector; two paths to the upgrade (hasty, or solicit first), then
     "next run" finds the new code — or finds nothing and the service stalls until a block
     provides the preimage. Logic in upgrade-swap.ts. -->
<script setup lang="ts">
import { computed, ref } from "vue";
import { holdsItsCode, record, says, type Step, type Story } from "./upgrade-swap.ts";

const story = ref<Story>([]);
const has = (s: Step) => story.value.includes(s);
const rec = computed(() => record(story.value));
const stalled = computed(() => has("ranNext") && !holdsItsCode(story.value));
const take = (s: Step) => (story.value = [...story.value, s]);
</script>

<template>
  <div class="widget upgrade-swap">
    <div class="readout" aria-live="polite">
      <div class="tile"><span class="tile-label">service 0's code hash</span><span class="tile-value">{{ rec.codeHash }}</span></div>
      <div class="tile"><span class="tile-label">least gas, item · memo</span><span class="tile-value">{{ rec.gases[0] }} · {{ rec.gases[1] }}</span></div>
      <div class="tile"><span class="tile-label">code the next run finds</span><span class="tile-value" :class="holdsItsCode(story) ? 'ok' : 'bad'">{{ holdsItsCode(story) ? "✓ held" : "✗ missing" }}</span></div>
    </div>
    <div class="controls" role="group" aria-label="what service 0 does">
      <button class="small" :disabled="has('solicited') || has('upgraded')" @click="take('solicited')">solicit + provide the new code first</button>
      <button class="small" :disabled="has('upgraded')" @click="take('upgraded')">upgrade (call 20)</button>
      <button class="small" :disabled="!has('upgraded') || stalled" @click="take('ranNext')">next run</button>
      <button class="small" v-if="stalled && !has('provided')" @click="take('provided')">a block provides the preimage</button>
      <button class="small" :disabled="story.length === 0" @click="story = []">reset</button>
    </div>
    <p class="note" :class="{ bad: stalled && !has('provided') }">{{ says(story) }}</p>
  </div>
</template>

<style scoped>
.tile .tile-value { font-size: 16px; min-width: 11ch; }
.tile .tile-value.ok { color: var(--vp-c-green-1); }
.tile .tile-value.bad { color: var(--changed-line); }
.controls { display: flex; flex-wrap: wrap; gap: 6px; margin: 8px 0; }
.controls button.small { min-height: 32px; }
.note { margin: 0; font-size: 13px; color: var(--vp-c-text-2); line-height: 1.5; min-height: 4.5em; }
.note.bad { color: var(--changed-line); }
</style>
