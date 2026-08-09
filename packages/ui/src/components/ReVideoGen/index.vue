<template>
  <div class="re-video-gen">
    <ReCardTextarea v-model="prompt" placeholder="输入视频描述..." :rows="3" />
    <div class="re-video-gen__options">
      <el-select v-model="model" placeholder="模型" size="small" style="width: 160px">
        <el-option value="sora" label="Sora" />
        <el-option value="gen-2" label="Gen-2" />
      </el-select>
      <el-select v-model="duration" placeholder="时长" size="small" style="width: 120px">
        <el-option value="5" label="5s" />
        <el-option value="10" label="10s" />
      </el-select>
      <el-button type="primary" :loading="generating" :disabled="!prompt.trim()" @click="handleGenerate">
        <el-icon><VideoCamera /></el-icon>
        生成
      </el-button>
    </div>
    <div v-if="generating" class="re-video-gen__loading"><el-icon class="is-loading"><Loading /></el-icon><span>生成中...</span></div>
    <div v-if="result" class="re-video-gen__result">
      <video :src="result" controls style="max-width:100%;max-height:400px;border-radius:var(--el-border-radius-base);" />
      <div class="re-video-gen__actions">
        <el-button size="small" @click="handleDownload"><el-icon><Download /></el-icon>下载</el-button>
        <el-button size="small" @click="result = ''"><el-icon><Delete /></el-icon>清除</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { http } from "@repo/core";
import { ElSelect, ElOption, ElButton, ElIcon, ElMessage } from "element-plus";
import ReCardTextarea from "../ReCardTextarea/index.vue";
import { VideoCamera, Loading, Download, Delete } from "@element-plus/icons-vue";

interface Props { baseUrl?: string; headers?: Record<string, string>; }
const props = withDefaults(defineProps<Props>(), { baseUrl: "/v2/generate" });
const prompt = ref("");
const model = ref("sora");
const duration = ref("5");
const generating = ref(false);
const result = ref("");

const handleGenerate = async () => {
  if (!prompt.value.trim() || generating.value) return;
  generating.value = true;
  try {
    const { data } = await http()
      .post(`${props.baseUrl}/video`)
      .headers(props.headers ?? {})
      .data({ prompt: prompt.value, model: model.value, duration: parseInt(duration.value) });
    if (data.code !== 200) throw new Error(data.message || "生成失败");
    result.value = data.data.url;
  } catch (e) { ElMessage.error((e as Error).message); } finally { generating.value = false; }
};

const handleDownload = () => { if (!result.value) return; const a = document.createElement("a"); a.href = result.value; a.download = "generated-video.mp4"; document.body.appendChild(a); a.click(); document.body.removeChild(a); };
</script>

<style scoped>
.re-video-gen { display: flex; flex-direction: column; gap: 16px; }
.re-video-gen__options { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
.re-video-gen__loading { display: flex; align-items: center; gap: 8px; color: var(--el-text-color-secondary); }
.re-video-gen__result { display: flex; flex-direction: column; align-items: center; gap: 12px; }
.re-video-gen__actions { display: flex; gap: 8px; }
</style>
