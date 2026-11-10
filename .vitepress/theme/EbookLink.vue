<!-- The concepts e-book, for a Kindle or any e-reader: a link to the one this build made
     (.vitepress/epub.ts writes it beside the site), with the day and commit it was made
     from. Every deploy builds it again (.github/workflows/pages.yml), so the link is always
     the newest book; a build without the book (npm run site) shows nothing. -->
<script setup lang="ts">
import { computed } from "vue";
import { useData, withBase } from "vitepress";

type Ebook = { file: string; built: string; commit: string };
const { theme } = useData();
const ebook = computed(() => theme.value.ebook as Ebook | undefined);
</script>

<template>
  <p v-if="ebook" class="ebook">
    <a :href="withBase(`/${ebook.file}`)" download><b>The concepts e-book</b> (EPUB)</a>:
    every lesson's ideas, diagrams and formulas, the code folded away, for an e-reader.
    Version {{ ebook.built }}, from <code>{{ ebook.commit }}</code>. On a Kindle, send it
    with Send to Kindle.
  </p>
</template>

<style scoped>
.ebook { padding: 10px 14px; border: 1px solid var(--vp-c-divider); border-radius: 8px; background: var(--vp-c-bg-soft); }
</style>
