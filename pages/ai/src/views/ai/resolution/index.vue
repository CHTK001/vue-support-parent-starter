<template>
  <AiTaskStudio
    title="Resolution Boost"
    description="围绕超分辨率、细节修复和清晰化重建增强页。"
    icon="✨"
    module-type="RESOLUTION"
    task-type="RESOLUTION"
    :prompt-items="promptItems"
  />
</template>

<script setup lang="ts">
import AiTaskStudio from "../rebuilt/AiTaskStudio.vue";

const promptItems = [
  { key: "portrait", label: "人物增强", description: "增强人物照片细节，保留皮肤与发丝层次。" },
  { key: "document", label: "文档修复", description: "提升文档图片清晰度，强调边缘和文字可读性。" },
  { key: "poster", label: "海报放大", description: "在放大海报的同时尽量保留字体与纹理细节。" },
];
</script>
