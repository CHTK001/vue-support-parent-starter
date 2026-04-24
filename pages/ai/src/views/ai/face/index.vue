<template>
  <AiTaskStudio
    title="Face Analysis"
    description="保留最小输入面板，统一提交到 FACE 任务接口。"
    icon="🙂"
    module-type="FACE"
    task-type="FACE"
    :prompt-items="promptItems"
  />
</template>

<script setup lang="ts">
import AiTaskStudio from "../rebuilt/AiTaskStudio.vue";

const promptItems = [
  { key: "detect", label: "人脸检测", description: "检测图片中的人脸位置和数量。" },
  { key: "feature", label: "特征提取", description: "提取图片中的人脸特征信息。" },
  { key: "compare", label: "人脸比对", description: "对两张图片中的人脸进行相似度比对。" },
];
</script>
