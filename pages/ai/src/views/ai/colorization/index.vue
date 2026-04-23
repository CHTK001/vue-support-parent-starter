<template>
  <TaskWorkbench
    eyebrow="AI Colorization"
    title="图像上色工作台"
    description="输入原图地址或上色目标说明，提交最小图像上色任务。"
    module-type="COLORIZATION"
    task-type="COLORIZATION"
    primary-label="上色目标"
    primary-placeholder="例如：为老照片恢复柔和肤色与暖色环境"
    secondary-label="风格偏好"
    secondary-placeholder="例如：写实、复古、低饱和"
  />
</template>

<script setup lang="ts">
import TaskWorkbench from "../components/TaskWorkbench.vue";
</script>
