<!-- The Gray Paper map page: every section of the Gray Paper 0.8.0, and the lessons that cite
     it; a section no lesson cites says why a block importer leaves it out. From
     .vitepress/gray-paper.ts, via config.ts. -->
<script setup lang="ts">
import { computed } from "vue";
import { useData, withBase } from "vitepress";

type Section = { id: string; title: string; anchor: string };
type Lesson = { id: string; title: string; link: string };
const { theme } = useData();
const gp = computed(() => theme.value.grayPaper as { sections: Section[]; byPage: Record<string, string[]>; lessons: Lesson[]; beside: Record<string, string> });
const lessonsFor = (id: string) => gp.value.lessons.filter((l) => (gp.value.byPage[`${l.link.slice(1)}.md`] ?? []).includes(id));
const label = (id: string) => id.replace("App ", "App. ");
</script>

<template>
  <table class="gp-map">
    <thead><tr><th>Section</th><th>In the tutorial</th></tr></thead>
    <tbody>
      <tr v-for="s in gp.sections" :id="s.anchor" :key="s.id" :class="{ beside: !lessonsFor(s.id).length }">
        <td><b>{{ label(s.id) }}</b> {{ s.title }}</td>
        <td>
          <template v-if="lessonsFor(s.id).length">
            <template v-for="(l, i) in lessonsFor(s.id)" :key="l.id"><a :href="withBase(l.link)" :title="l.title">{{ l.id }}</a><span v-if="i < lessonsFor(s.id).length - 1">, </span></template>
          </template>
          <em v-else>not a lesson: {{ gp.beside[s.id] }}</em>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<style scoped>
.gp-map td:first-child { min-width: 9em; }
.gp-map tr.beside td { color: var(--vp-c-text-3); }
.gp-map tr:target td { background: var(--vp-c-brand-soft); }
</style>
