<!-- The Code switch and the client picker, in the site's header beside the light/dark
     switch, and in the phone menu (code.ts). Off by default: a lesson opens on its ideas, and
     the switch shows its code. The picker says whose code: the client the lessons build, or
     another one they quote. Both ride along from lesson to lesson, like the theme. -->
<script lang="ts">
import { ref } from "vue";
import { DEFAULT_CLIENT } from "./code-link.ts";
// one state for every copy of the control: the header's and the phone menu's move together
const on = ref(false);
const client = ref(DEFAULT_CLIENT);
</script>

<script setup lang="ts">
import { onMounted, watch } from "vue";
import { useRoute } from "vitepress";
import { CLIENTS, clientLabel } from "./code-link.ts";
import { chosenClient, codeOn, openChosenFolds, setClient, setCode, showInAddress } from "./code.ts";

defineProps<{ screen?: boolean }>(); // true in the phone menu: room for the label's long form

const route = useRoute();
onMounted(() => {
  on.value = codeOn();
  client.value = chosenClient();
  openChosenFolds();
  showInAddress();
});
// moving to another page drops the address's ?code: put it back, so any page can be shared
// as it is read; and the new page's folds follow the picker
watch(() => route.path, () => { openChosenFolds(); showInAddress(); }, { flush: "post" });

function toggle() {
  on.value = !on.value;
  setCode(on.value);
}
function choose(event: Event) {
  client.value = (event.target as HTMLSelectElement).value;
  setClient(client.value);
  // choosing a client is asking to see its code
  if (!on.value) toggle();
}
const about = (id: string) => CLIENTS.find((c) => c.id === id)?.about ?? "";
</script>

<template>
  <div class="code-toggle" :class="{ screen }">
    <button
      type="button"
      role="switch"
      :aria-checked="on"
      :title="on ? 'The code is showing. Turn it off to fold it and read the ideas first.' : 'Show the lessons\' code. Folded, a snippet opens with a tap on its label.'"
      @click="toggle"
    >
      <span class="track" :class="{ on }"><span class="knob" /></span>
      <span class="label">Code<span v-if="screen">: show the lessons' code</span></span>
    </button>
    <select
      class="client"
      :value="client"
      aria-label="Whose code to show"
      :title="`Whose code to show: ${about(client)}.`"
      @change="choose"
    >
      <option v-for="c in CLIENTS" :key="c.id" :value="c.id">{{ clientLabel(c) }}</option>
    </select>
  </div>
</template>

<style scoped>
.code-toggle {
  display: flex; align-items: center; margin-right: 12px; min-height: 32px;
  border: 1px solid var(--vp-c-divider); border-radius: 16px;
}
.code-toggle:hover, .code-toggle:focus-within { border-color: var(--vp-c-brand-1); }
.code-toggle.screen { margin: 12px 0 0; min-height: 40px; border-radius: 8px; }
button {
  display: inline-flex; align-items: center; gap: 8px; min-height: 30px; padding: 2px 10px 2px 6px;
  font-size: 13px; font-weight: 600; color: var(--vp-c-text-1); white-space: nowrap;
}
.screen button { flex: 1; min-height: 38px; justify-content: flex-start; }
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
.client {
  min-height: 30px; max-width: 150px; padding: 2px 8px 2px 10px;
  border: 0; border-left: 1px solid var(--vp-c-divider); border-radius: 0 16px 16px 0;
  background: transparent; color: var(--vp-c-text-2); font: inherit; font-size: 13px; cursor: pointer;
}
.client:hover, .client:focus-visible { color: var(--vp-c-text-1); }
.screen .client { min-height: 38px; border-radius: 0 8px 8px 0; }
/* a phone's top bar has room for the switch alone: the picker is in its ☰ menu */
@media (max-width: 767px) {
  .code-toggle:not(.screen) .client { display: none; }
}
@media (prefers-reduced-motion: reduce) { .track, .knob { transition: none; } }
</style>
