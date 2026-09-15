<template>
  <div class="p-4">
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-xl font-bold text-gray-800">昆虫识图</h3>
      <el-button @click="$emit('close')">返回</el-button>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <iframe
        :src="insectWorldUrl"
        width="100%"
        :height="iframeHeight"
        frameborder="0"
        class="w-full"
        allowfullscreen
      />
    </div>

    <div class="mt-4 text-center text-sm text-gray-500">
      <p>数据来源：<a href="https://github.com/xr843/insect-world" target="_blank" class="text-primary hover:underline">insect-world</a></p>
      <p class="mt-1">可交互的 3D 昆虫图鉴 —— 旋转、缩放、点击标注点，认识 63 种昆虫的身体构造、生活史与生态角色。</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { eduaiApi } from "../api/eduaiApi";

defineEmits(["close"]);

const insectWorldUrl = ref("https://insect-world.pages.dev");
const iframeHeight = ref(800);

onMounted(async () => {
  try {
    const config = await eduaiApi.getFunConfig("INSECT");
    if (config?.configJson) {
      const parsed = JSON.parse(config.configJson);
      if (parsed.url) insectWorldUrl.value = parsed.url;
      if (parsed.height) iframeHeight.value = parseInt(parsed.height);
    }
  } catch (e) {
    console.error("加载昆虫识图配置失败", e);
  }
});
</script>
