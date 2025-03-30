<template>
  <div class="markdown-body" v-html="processedContent" />
</template>

<script setup lang="ts">
import { computed } from "vue";
import useMarkdownIt from "../../hooks/useMarkdownIt";

// 接收 content 属性
const props = defineProps({
  content: {
    type: String,
    required: true
  }
});

// 使用 Markdown 渲染器
const md = useMarkdownIt();

// 渲染 Markdown 内容
const processedContent = computed(() => {
  return md.render(props.content);
});
</script>

<style lang="scss">
/* 自定义样式 */
.markdown-body {
  --table-header-bg: #e5e7ed;
  --text-tertiary: #b5b5b5;
  --table-border-color: #c6c6d0;
  color: var(--ld-color-text);
  line-height: 2.2;
  table {
    max-width: 100%;
    overflow: auto;
    font-size: 14px;
    border-spacing: 0;
    border-collapse: collapse;
    display: block;
    width: -webkit-max-content;
    width: -moz-max-content;
    width: max-content;
    overflow: auto;
    border: 1px solid var(--table-border-color);
    border-radius: 12px;
    overflow-x: auto;
    margin: 0.859em 0 calc(2px + 0.859em);
    thead {
      font-size: 14px;
      margin-bottom: 4px;
      display: table-header-group;
      vertical-align: middle;
      border-color: inherit;
      th:first-child {
        border-top-left-radius: 12px;
        border-left: 0;
      }
    }
    tbody {
      display: table-row-group;
      vertical-align: middle;
      border-color: inherit;
    }
    tr {
      display: table-row;
      vertical-align: inherit;
      border-color: inherit;
    }
    th {
      border-left: 1px solid var(--table-border-color);
      letter-spacing: 0.5px;
      font-weight: 700;
    }
    td {
      border-top: 1px solid var(--table-border-color);
      letter-spacing: 0.25px;
    }
    th,
    td {
      font-size: 14px;
      line-height: 24px;
      padding: 12px 16px;
      max-width: 448px;
      text-align: left;
    }
  }
  p {
    font-size: 14px;
    line-height: 24px;
    margin: 0;
    letter-spacing: 0.25px;
    max-width: 100%;
    white-space: pre-wrap !important;
    word-break: break-word !important;
    overflow: auto;
    margin-bottom: 0.859em;
    overflow-y: hidden;
  }
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
