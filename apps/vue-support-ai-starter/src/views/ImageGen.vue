<template>
  <div class="image-gen">
    <el-card shadow="never">
      <h2 class="page-title">文生图</h2>
      <p class="page-sub">调用 /v2/ai/generate 图片生成接口（待后端接入）</p>
      <el-input v-model="prompt" type="textarea" :rows="4" placeholder="描述你想生成的图片..." />
      <div class="page-actions">
        <el-button type="primary" :loading="loading" @click="generate">生成图片</el-button>
      </div>
    </el-card>
    <el-card v-if="imageUrl" shadow="never" class="preview-card">
      <img :src="imageUrl" class="preview-image" alt="generated" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { ElMessage } from "element-plus";

const prompt = ref("");
const imageUrl = ref("");
const loading = ref(false);

const generate = async () => {
  if (!prompt.value.trim()) {
    ElMessage.warning("请输入描述");
    return;
  }
  loading.value = true;
  try {
    await new Promise((r) => setTimeout(r, 800));
    imageUrl.value =
      "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='320' height='200'><rect fill='%23f5f7fa' width='100%25' height='100%25'/><text x='50%25' y='50%25' dy='.3em' text-anchor='middle' fill='%23999'>mock image</text></svg>";
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.image-gen { display: flex; flex-direction: column; gap: 12px; }
.page-title { margin: 0; font-size: 16px; }
.page-sub { margin: 4px 0 12px; font-size: 12px; color: var(--el-text-color-secondary); }
.page-actions { margin-top: 12px; }
.preview-card { padding: 8px; }
.preview-image { width: 100%; max-height: 360px; object-fit: contain; }
</style>
