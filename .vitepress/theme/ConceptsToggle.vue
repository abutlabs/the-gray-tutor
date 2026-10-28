<!-- The concepts-only switch, in the site's header beside the light/dark switch, and in the
     phone menu (concepts.ts). The choice rides along from lesson to lesson, like the theme. -->
<script lang="ts">
import { ref } from "vue";
// one state for every copy of the switch: the header's and the phone menu's move together
const on = ref(false);
</script>

<script setup lang="ts">
import { onMounted, watch } from "vue";
import { useRoute } from "vitepress";
import { conceptsOn, setConcepts, showInAddress } from "./concepts.ts";

defineProps<{ screen?: boolean }>(); // true in the phone menu: room for the label's long form

const route = useRoute();
onMounted(() => { on.value = conceptsOn(); showInAddress(on.value); });
// moving to another page drops the address's ?concepts: put it back, so any page can be shared folded
watch(() => route.path, () => showInAddress(conceptsOn()), { flush: "post" });

function toggle() {
  on.value = !on.value;
  setConcepts(on.value);
}
</script>

<template>
  <div class="concepts-toggle" :class="{ screen }">
    <button
      type="button"
      role="switch"
      :aria-checked="on"
      :title="on ? 'Code is folded: tap a snippet\'s label to open it. Copy the address to share it this way.' : 'Fold the lessons\' code, and read the ideas first.'"
      @click="toggle"
    >
      <span class="track" :class="{ on }"><span class="knob" /></span>
      <span class="label">Concepts<span v-if="screen"> only: fold the lessons' code</span></span>
    </button>
  </div>
</template>

<style scoped>
.concepts-toggle { display: flex; align-items: center; margin-right: 12px; }
.concepts-toggle.screen { margin: 12px 0 0; }
button {
  display: inline-flex; align-items: center; gap: 8px; min-height: 32px; padding: 2px 12px 2px 6px;
  border: 1px solid var(--vp-c-divider); border-radius: 16px;
  font-size: 13px; font-weight: 600; color: var(--vp-c-text-1); white-space: nowrap;
}
.screen button { width: 100%; min-height: 40px; justify-content: flex-start; border-radius: 8px; }
button:hover { border-color: var(--vp-c-brand-1); }
.track {
  position: relative; flex: none; width: 30px; height: 18px; border-radius: 9px;
  background: var(--vp-c-default-3); transition: background 0.2s;
}
.track.on { background: var(--vp-c-brand-1); }
.knob {
  position: absolute; top: 2px; left: 2px; width: 14px; height: 14px; border-radius: 50%;
  background: var(--vp-c-white); transition: left 0.2s;
}
.track.on .knob { left: 14px; }
</style>
