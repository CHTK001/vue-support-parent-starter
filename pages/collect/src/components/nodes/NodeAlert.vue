<!--
  节点级提示条：说明（intro）与高危警示（danger）。

  <p>这两块文案此前在 sqlForm / scriptForm / extractForm / NodeParamForm 里各写一份
  （连 padding、2px 竖条、圆角都各抄一遍），改一处就要改五处。收敛成一个组件后，
  颜色只走 --el-* 令牌，任意主题自动跟随；新增节点要加说明或警示时只写一行。</p>

  <p>kind=intro：左侧主色竖条 + 浅底，用于「这个节点在流程里干什么」；
  kind=danger：左侧红色竖条 + 红浅底，用于「这个节点能干危险的事」（契约 §4.4）。</p>
-->
<script setup lang="ts">
withDefaults(
  defineProps<{
    /** 形态：说明（主色）/ 高危警示（红） */
    kind?: "intro" | "danger";
  }>(),
  { kind: "intro" },
);
</script>

<template>
  <div class="field field-wide node-alert" :class="kind === 'danger' ? 'node-danger' : 'node-intro'">
    <slot />
  </div>
</template>

<style scoped>
/* 整行占位：属性面板是网格布局，提示条必须自己撑满一行 */
.field {
  min-width: 0;
}

.field-wide {
  grid-column: 1 / -1;
}

/* 节点级说明：左侧 2px 主色竖条 + 浅底 */
.node-intro {
  padding: 8px 10px;
  font-size: 12px;
  line-height: 1.45;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-lighter);
  border-left: 2px solid var(--el-color-primary);
  border-radius: var(--el-radius-md, 8px);
  transition: border-color 200ms, background-color 200ms;
}

/* 高危警示：danger 文本 + danger-light-9 底 + 左侧 2px 竖条（契约 §4.4） */
.node-danger {
  padding: 8px 10px 8px 12px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-color-danger);
  background: var(--el-color-danger-light-9);
  border-left: 2px solid var(--el-color-danger);
  border-radius: 6px;
}

.node-danger strong {
  font-weight: 600;
}

.node-danger code {
  padding: 0 3px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  background: var(--el-fill-color-lighter);
  border-radius: 3px;
}

.node-intro code {
  padding: 0 3px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  border-radius: 3px;
}
</style>
