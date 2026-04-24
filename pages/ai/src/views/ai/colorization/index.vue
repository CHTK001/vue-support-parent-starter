<template>
  <AiTaskStudio
    title="Colorization"
    description="围绕老照片上色、插画上色等场景重建图像上色页。"
    icon="🎨"
    module-type="COLORIZATION"
    task-type="COLORIZATION"
    :prompt-items="promptItems"
  />
</template>

<script setup lang="ts">
import AiTaskStudio from "../rebuilt/AiTaskStudio.vue";

const promptItems = [
  { key: "photo", label: "老照片上色", description: "为老照片做自然上色，保留年代感和人物肤色层次。" },
  { key: "comic", label: "漫画上色", description: "为线稿插画填充清晰明快的配色。" },
  { key: "cinema", label: "电影感调色", description: "做低饱和电影感上色，强调氛围和对比。" },
];
</script>
