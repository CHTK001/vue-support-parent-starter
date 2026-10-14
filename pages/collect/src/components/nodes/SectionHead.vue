<!--
  属性面板分节标题：标题 + 向右延伸的细线。

  <p>UI 稿的统一分节样式：属性停靠区用它分出「基础信息 / ${节点类型}配置」，
  节点表单内用它分出「循环迭代」。颜色全走 koi 体系的 --el-* 令牌，不写死色值；
  网格占满整行，直接放进 .pane-grid 就是标准分节头。</p>
-->
<script setup lang="ts">
defineProps<{
  /** 分节标题，如「基础信息」「抽取配置」「循环迭代」 */
  title: string;
  /** 标题右侧的补充说明（口径提示），可空 */
  hint?: string;
}>();
</script>

<template>
  <div class="section-head">
    <span class="section-title">{{ title }}</span>
    <span v-if="hint" class="section-hint">{{ hint }}</span>
    <span class="section-line" />
  </div>
</template>

<style scoped>
.section-head {
  display: flex;
  align-items: center;
  gap: 8px;
  grid-column: 1 / -1;
  margin: 2px 0 -2px;
}

.section-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  white-space: nowrap;
}

.section-hint {
  /* 长说明（如口径提示）必须能换行：nowrap 会把整行撑出横向滚动条 */
  font-size: 11px;
  color: var(--el-text-color-secondary);
  min-width: 0;
  overflow-wrap: anywhere;
  word-break: break-word;
}

/* 标题后延伸的细线：视觉上把分节头铺满整行，与 UI 稿一致 */
.section-line {
  flex: 1;
  height: 1px;
  background: var(--el-border-color-lighter);
}
</style>
