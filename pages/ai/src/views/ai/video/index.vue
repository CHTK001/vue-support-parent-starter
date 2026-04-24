<template>
  <AiTaskStudio
    title="Video Studio"
    description="用统一的 AI 任务工作台提交文生视频和镜头描述任务。"
    icon="🎬"
    module-type="VIDEO"
    task-type="VIDEO"
    :prompt-items="promptItems"
  />
</template>

<script setup lang="ts">
import AiTaskStudio from "../rebuilt/AiTaskStudio.vue";

const promptItems = [
  { key: "trailer", label: "预告片镜头", description: "生成电影预告片风格镜头，节奏紧凑，光影强烈。" },
  { key: "product", label: "产品短片", description: "生成产品展示短片，镜头平稳，突出材质和细节。" },
  { key: "city", label: "城市延时", description: "生成未来城市延时镜头，霓虹感和动态灯光明显。" },
];
</script>
