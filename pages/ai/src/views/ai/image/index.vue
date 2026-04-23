<template>
  <TaskWorkbench
    eyebrow="AI Image"
    title="生图工作台"
    description="输入描述词，提交最小图像生成任务。"
    module-type="IMAGE"
    task-type="IMAGE"
    primary-label="提示词"
    primary-placeholder="例如：一间晨雾中的玻璃温室，电影级光影"
    secondary-label="补充说明"
    secondary-placeholder="例如：风格、尺寸、构图要求"
  />
</template>

<script setup lang="ts">
import TaskWorkbench from "../components/TaskWorkbench.vue";
</script>
