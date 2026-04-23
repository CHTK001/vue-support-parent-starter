<template>
  <TaskWorkbench
    eyebrow="AI Resolution"
    title="分辨率增强工作台"
    description="输入源图地址或增强需求，提交最小超分辨率任务。"
    module-type="RESOLUTION"
    task-type="RESOLUTION"
    primary-label="增强需求"
    primary-placeholder="例如：提升旧海报的清晰度与边缘细节"
    secondary-label="结果要求"
    secondary-placeholder="例如：适配大屏展示、保留文字清晰度"
  />
</template>

<script setup lang="ts">
import TaskWorkbench from "../components/TaskWorkbench.vue";
</script>
