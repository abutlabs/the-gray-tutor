<!-- Lesson 16.8: lookup's three questions. Pick whose preimages (φ₇), which hash (φ₈),
     and the window (from φ₁₀, at most φ₁₁); the readout answers with φ₇ after, the bytes
     copied out (slice marked), and the gas — charged before the hash is even read, so
     NONE and panic pay it too. Computed in lookup-call.ts. -->
<script setup lang="ts">
import { computed, ref } from "vue";
import { BUDGET, call, gasFor, HASHES, WHOSE } from "./lookup-call.ts";

const whose = ref(0); // 2^64 − 1: my own
const hash = ref(0); // "hello, JAM"
const from = ref(0);
const atMost = ref(100);
const readable = ref(true);
const FROMS = [0, 4, 100];
const AT_MOSTS = [0, 10, 100, 4096];

const answer = computed(() => call({ whose: whose.value, hash: hash.value, from: from.value, atMost: atMost.value, readable: readable.value }));
const bytes = computed(() => HASHES[hash.value].bytes);
const fmt = (x: number) => x.toLocaleString("en-US");
const hex = (xs: number[]) => xs.map((x) => x.toString(16).padStart(2, "0")).join(" ");
const ascii = (xs: number[]) => xs.map((x) => (x >= 32 && x < 127 ? String.fromCharCode(x) : "·")).join("");

const note = computed(() => {
  if (answer.value.exit === "panic") return `The 32-byte hash at φ₈ isn't readable, so the machine panics — after paying: the ${fmt(answer.value.gas)} gas is charged first.`;
  if (answer.value.r7 === "NONE") return `No such service, or no such preimage there: φ₇ = NONE and the run carries on — ${fmt(answer.value.gas)} gas poorer, since the price is set before the preimage is even found.`;
  const v = bytes.value;
  return `Found: φ₇ becomes the full length, ${v.length}. The window clamps as fetch's does — f = min(${from.value}, ${v.length}) = ${answer.value.f}, l = min(${fmt(atMost.value)}, ${v.length - answer.value.f}) = ${answer.value.l} — and the gas is 600 + ⌈248 × ${fmt(atMost.value)} / 1,024⌉ = ${fmt(answer.value.gas)}, for the ${fmt(atMost.value)} asked for, not the ${answer.value.l} copied.`;
});
</script>

<template>
  <div class="widget lookup-call">
    <div class="readout" aria-live="polite">
      <div class="tile"><span class="tile-label">φ₇ after</span><span class="tile-value">{{ answer.exit === "panic" ? "panic" : answer.r7 }}</span></div>
      <div class="tile"><span class="tile-label">gas</span><span class="tile-value">{{ fmt(answer.gas) }} of {{ fmt(BUDGET) }}</span></div>
    </div>
    <div class="ask">
      <p class="q">φ₇, whose preimages:</p>
      <div class="controls" role="group" aria-label="whose preimages">
        <button v-for="(w, i) in WHOSE" :key="w.phi7" class="small" :class="{ chosen: whose === i }" :aria-pressed="whose === i" @click="whose = i">{{ w.says }}</button>
      </div>
      <p class="q">φ₈, the hash in memory:</p>
      <div class="controls" role="group" aria-label="which hash">
        <button v-for="(h, i) in HASHES" :key="h.hash" class="small" :class="{ chosen: hash === i && readable }" :aria-pressed="hash === i && readable" @click="hash = i; readable = true">{{ h.says }}</button>
        <button class="small" :class="{ chosen: !readable }" :aria-pressed="!readable" @click="readable = false">an unreadable address</button>
      </div>
      <p class="q">the window — from byte φ₁₀, at most φ₁₁ bytes:</p>
      <div class="controls" role="group" aria-label="the window">
        <span class="half">from <button v-for="f in FROMS" :key="f" class="small" :class="{ chosen: from === f }" :aria-pressed="from === f" @click="from = f">{{ f }}</button></span>
        <span class="half">at most <button v-for="z in AT_MOSTS" :key="z" class="small" :class="{ chosen: atMost === z }" :aria-pressed="atMost === z" @click="atMost = z">{{ fmt(z) }}</button></span>
      </div>
    </div>
    <div v-if="answer.exit === 'continue' && answer.r7 !== 'NONE'" class="found">
      <p class="q">the preimage, with the copied slice marked:</p>
      <code class="hex"><span>{{ hex(bytes.slice(0, answer.f)) }}</span><mark>{{ hex(answer.landed) }}</mark><span>{{ hex(bytes.slice(answer.f + answer.l)) }}</span></code>
      <code class="hex ascii"><span>{{ ascii(bytes.slice(0, answer.f)) }}</span><mark>{{ ascii(answer.landed) }}</mark><span>{{ ascii(bytes.slice(answer.f + answer.l)) }}</span></code>
    </div>
    <p class="note">{{ note }}</p>
  </div>
</template>

<style scoped>
.tile .tile-value { font-size: 18px; min-width: 9ch; }
.ask { margin: 8px 0 0; }
.q { margin: 6px 0 4px; font-size: 13px; color: var(--vp-c-text-2); }
.controls { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
.controls button.small { min-height: 32px; }
.half { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; color: var(--vp-c-text-2); margin-right: 10px; }
.found { margin: 8px 0 0; }
.hex { display: block; font-size: 12px; line-height: 1.6; overflow-wrap: anywhere; color: var(--vp-c-text-3); background: none; padding: 0; }
.hex mark { background: var(--bit-top); color: var(--vp-c-text-1); border-radius: 2px; }
.hex.ascii { letter-spacing: 0.25em; }
.note { margin: 8px 0 0; font-size: 13px; color: var(--vp-c-text-2); line-height: 1.5; min-height: 4.5em; }
</style>
