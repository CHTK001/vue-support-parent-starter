<template>
  <div class="markdown-body" v-html="processedContent"></div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import useMarkdownIt from "../../hooks/useMarkdownIt";

// 接收 content 属性
const props = defineProps({
  content: {
    type: String,
    required: true,
  },
});

// 使用 Markdown 渲染器
const md = useMarkdownIt();

// 渲染 Markdown 内容
const processedContent = computed(() => {
  return md.render(props.content);
});
</script>

<style>
/* 自定义样式 */
.markdown-body {
  color: var(--ld-color-text);
  line-height: 2.2;
}

.markdown-body p:first-of-type {
  margin-block-start: 0;
}
.markdown-body p:last-of-type {
  margin-block-end: 0;
}

.markdown-body pre {
  padding: 10px;
  border-radius: 5px;
  background-color: var(--ld-color-code-bg);
  overflow-x: auto;
}

.markdown-body code {
  font-family:
    Fira Code,
    Fira Mono,
    Menlo,
    Consolas,
    DejaVu Sans Mono,
    monospace;
  transition: all var(--ld-transition-duration);
}

.markdown-body p {
  transition: color var(--ld-transition-duration);
}

th {
  text-align: center;
}
th,
td {
  --el-border-color-lighter: #ebeef5;
  --el-table-border-color: var(--el-border-color-lighter);
  --el-table-border: 1px solid var(--el-table-border-color);
  border-right: var(--el-table-border);
  border-bottom: var(--el-table-border);
  transition: background-color 0.25s ease;
  padding: 8px 0;
  min-width: 0;
  box-sizing: border-box;
  text-overflow: ellipsis;
  vertical-align: middle;
  position: relative;
  text-align: left;
  z-index: var(--el-table-index);
}
</style>
