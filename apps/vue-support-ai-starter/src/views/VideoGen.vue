<template>
  <div class="video-gen">
    <el-card shadow="never">
      <h2 class="page-title">文生视频</h2>
      <p class="page-sub">调用 /v2/ai/generate 视频生成接口（待后端接入）</p>
      <el-input v-model="prompt" type="textarea" :rows="4" placeholder="描述你想生成的视频..." />
      <div class="page-actions">
        <el-button type="primary" :loading="loading" @click="generate">生成视频</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { ElMessage } from "element-plus";

const prompt = ref("");
const loading = ref(false);

const generate = async () => {
  if (!prompt.value.trim()) {
    ElMessage.warning("请输入描述");
    return;
  }
  loading.value = true;
  try {
    await new Promise((r) => setTimeout(r, 500));
    ElMessage.success("视频生成任务已提交（mock）");
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.video-gen { display: flex; flex-direction: column; gap: 12px; }
.page-title { margin: 0; font-size: 16px; }
.page-sub { margin: 4px 0 12px; font-size: 12px; color: var(--el-text-color-secondary); }
.page-actions { margin-top: 12px; }
</style>
