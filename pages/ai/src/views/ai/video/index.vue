<template>
  <TaskWorkbench
    eyebrow="AI Video"
    title="视频工作台"
    description="输入镜头描述，提交最小视频生成任务。"
    module-type="VIDEO"
    task-type="VIDEO"
    primary-label="视频描述"
    primary-placeholder="例如：镜头穿过霓虹雨巷，最后停在红色招牌前"
    secondary-label="节奏与风格"
    secondary-placeholder="例如：赛博、写实、镜头运动、时长"
  />
</template>

<script setup lang="ts">
import TaskWorkbench from "../components/TaskWorkbench.vue";
</script>
