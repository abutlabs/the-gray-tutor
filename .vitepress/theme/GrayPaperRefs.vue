<!-- The Gray Paper sections a lesson (or a part) covers, at its top: one line, each section
     linking to its row on the Gray Paper map. From .vitepress/gray-paper.ts, via config.ts. -->
<script setup lang="ts">
import { computed } from "vue";
import { useData, withBase } from "vitepress";

type Section = { id: string; title: string; anchor: string };
const { theme, page } = useData();
const sections = computed<Section[]>(() => {
  const gp = theme.value.grayPaper as { sections: Section[]; byPage: Record<string, string[]> } | undefined;
  const ids = gp?.byPage[page.value.relativePath] ?? [];
  return ids.flatMap((id) => gp!.sections.filter((s) => s.id === id));
});
const label = (id: string) => id.replace("App ", "App. ");
</script>

<template>
  <p v-if="sections.length" class="gp-refs">
    <span class="gp-label">Gray Paper</span>
    <template v-for="(s, i) in sections" :key="s.id">
      <a :href="withBase(`/gray-paper#${s.anchor}`)"><b>{{ label(s.id) }}</b> {{ s.title }}</a><span v-if="i < sections.length - 1" class="sep"> · </span>
    </template>
  </p>
</template>

<style scoped>
.gp-refs { margin: 0 0 16px; font-size: 13px; line-height: 1.6; color: var(--vp-c-text-2); }
.gp-label { margin-right: 6px; padding: 1px 6px; border-radius: 4px; background: var(--vp-c-default-soft); font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; }
.gp-refs a { color: var(--vp-c-text-2); text-decoration: none; }
.gp-refs a:hover { color: var(--vp-c-brand-1); text-decoration: underline; }
.sep { color: var(--vp-c-text-3); }
</style>
