<!-- Lesson 8.8: γ′_Z pressed from six real keys. The staging set the tiny vector
     enact-epoch-change-with-padding-1.json rotates in, starting as the vector has it (the
     offender's key already zeroed). Tap a seat to zero or restore its key and the real
     144-byte root answers: almost every byte changes, except the last 48, which come from
     the fixed setup — and except for validator 3, whose key was never a point on the
     curve, so its seat held the padding point all along. Roots precomputed in ring-root.ts. -->
<script setup lang="ts">
import { computed, ref } from "vue";
import { bytesChanged, describeRing, rootFor, SEATS, VECTOR_ROOT } from "./ring-root.ts";

const zeroed = ref<boolean[]>(SEATS.map((s) => s.offender)); // as the vector rotates it in
const before = ref<string | null>(null); // the root before the last tap
const root = computed(() => rootFor(zeroed.value));
const isVectors = computed(() => root.value === VECTOR_ROOT);
const short = (hex: string) => `${hex.slice(0, 10)}…`;
const seatKey = (i: number) => (zeroed.value[i] ? "0x00000000…" : short(SEATS[i].key));
const isPadding = (i: number) => zeroed.value[i] || !SEATS[i].onCurve;

function toggle(i: number) {
  before.value = root.value;
  zeroed.value = zeroed.value.map((z, k) => (k === i ? !z : z));
}

const moved = computed(() => (before.value === null ? null : bytesChanged(before.value, root.value)));
const note = computed(() => {
  if (moved.value === null)
    return "The ring as the vector rotates it in: the offender's key already zeroed. Tap a seat to zero or restore its key.";
  if (moved.value === 0)
    return "The root didn't move. Validator 3's key isn't a point on the curve, so its seat held the padding point before you tapped — zeros change nothing.";
  return `One key changed, and ${moved.value} of the root's 144 bytes moved. Only the last 48 sat still: that point comes from the fixed setup, the same for every ring of six.`;
});

// the root's three 48-byte points, as hex without the 0x
const parts = computed(() => [0, 1, 2].map((p) => root.value.slice(2 + p * 96, 2 + (p + 1) * 96)));
</script>

<template>
  <div class="widget ring-root">
    <div class="readout" aria-live="polite">
      <div class="tile">
        <span class="tile-label">γ′_Z of this ring</span>
        <span class="tile-value">{{ short(root) }}</span>
      </div>
      <p class="check" :class="{ ok: isVectors }">
        {{ isVectors ? "✓ the vector's γ′_Z, byte for byte" : "a root the vector never made — restore the ring to find its γ′_Z again" }}
      </p>
    </div>
    <div class="seats" role="group" aria-label="the ring's six seats">
      <button v-for="s in SEATS" :key="s.index" class="seat" :aria-pressed="zeroed[s.index]" @click="toggle(s.index)">
        <span class="who">validator {{ s.index }}</span>
        <code class="key" :class="{ gone: zeroed[s.index] }">{{ seatKey(s.index) }}</code>
        <span class="tag" :class="{ pad: isPadding(s.index) }">{{ isPadding(s.index) ? "padding point" : "on the curve" }}</span>
      </button>
    </div>
    <p class="ring-says">{{ describeRing(zeroed) }}</p>
    <div class="root">
      <p class="what">The root, 144 bytes: three points of 48, the first two pressed from the keys.</p>
      <code class="hex"><mark>{{ parts[0] }}</mark><mark class="second">{{ parts[1] }}</mark><span class="fixed">{{ parts[2] }}</span></code>
    </div>
    <p class="note">{{ note }}</p>
  </div>
</template>

<style scoped>
.tile .tile-value { font-size: 18px; min-width: 13ch; }
.check { margin: 0; font-size: 13px; color: var(--vp-c-text-2); }
.check.ok { color: var(--vp-c-green-1); }
.seats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin: 8px 0; }
@media (max-width: 480px) { .seats { grid-template-columns: repeat(2, 1fr); } }
.seat { display: flex; flex-direction: column; align-items: flex-start; gap: 2px; padding: 6px 8px; min-height: 44px; border: 1px solid var(--vp-c-divider); border-radius: 4px; background: var(--vp-c-bg-soft); cursor: pointer; text-align: left; }
.seat[aria-pressed="true"] { border-color: var(--vp-c-text-3); }
.who { font-size: 12px; color: var(--vp-c-text-2); }
.key { font-size: 12px; background: none; padding: 0; }
.key.gone { color: var(--vp-c-text-3); text-decoration: line-through; }
.tag { font-size: 11px; color: var(--vp-c-green-1); }
.tag.pad { color: var(--vp-c-text-3); }
.ring-says { margin: 0 0 8px; font-size: 13px; color: var(--vp-c-text-2); }
.what { margin: 0 0 4px; font-size: 13px; line-height: 1.5; }
.hex { display: block; font-size: 12px; line-height: 1.5; overflow-wrap: anywhere; word-break: break-all; color: var(--vp-c-text-3); background: none; padding: 0; }
.hex mark { background: var(--bit-top); color: var(--vp-c-text-1); border-radius: 2px; }
.hex mark.second { background: var(--bit-mark); }
.hex .fixed { opacity: 0.6; }
.note { margin: 8px 0 0; font-size: 13px; color: var(--vp-c-text-2); line-height: 1.5; min-height: 3em; }
</style>
