<template>
  <TaskWorkbench
    eyebrow="AI Face"
    title="人脸检测工作台"
    description="输入图片地址或内容描述，提交最小人脸检测任务。"
    module-type="FACE"
    task-type="FACE"
    primary-label="检测目标"
    primary-placeholder="例如：多人会议照片中的人脸位置"
    secondary-label="补充说明"
    secondary-placeholder="例如：是否需要年龄、性别、表情等信息"
  />
</template>

<script setup lang="ts">
import TaskWorkbench from "../components/TaskWorkbench.vue";
</script>
