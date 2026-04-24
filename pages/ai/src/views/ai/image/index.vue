<template>
  <AiTaskStudio
    title="Image Studio"
    description="基于 EditorSender 与 BubbleList 的新生图工作台。"
    icon="🖼"
    module-type="IMAGE"
    task-type="IMAGE"
    :prompt-items="promptItems"
  />
</template>

<script setup lang="ts">
import AiTaskStudio from "../rebuilt/AiTaskStudio.vue";

const promptItems = [
  { key: "poster", label: "电商海报", description: "设计一张高质感电商海报，主体突出，背景简洁。" },
  { key: "portrait", label: "人物写真", description: "生成人物写真，电影感光影，细节清晰，肤质自然。" },
  { key: "concept", label: "概念场景", description: "生成未来感概念场景，层次丰富，构图大胆。" },
];
</script>
