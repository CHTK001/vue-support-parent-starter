<template>
  <div class="re-colorize">
    <div class="re-colorize__upload">
      <el-upload
        :action="uploadUrl"
        :headers="headers"
        :on-success="handleUploadSuccess"
        :on-error="handleUploadError"
        :show-file-list="false"
        accept="image/*"
        drag
      >
        <el-icon><Upload /></el-icon>
        <div>点击或拖拽上传图片</div>
      </el-upload>
    </div>
    <div v-if="generating" class="re-colorize__loading"><el-icon class="is-loading"><Loading /></el-icon><span>上色中...</span></div>
    <div v-if="result" class="re-colorize__result">
      <div class="re-colorize__compare">
        <div><img :src="originalImage" alt="原图" /><span>原图</span></div>
        <div><img :src="result" alt="上色结果" /><span>结果</span></div>
      </div>
      <div class="re-colorize__actions">
        <el-button @click="handleDownload"><el-icon><Download /></el-icon>下载</el-button>
        <el-button @click="reset"><el-icon><Delete /></el-icon>清除</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { message } from "@repo/core";
import { ref, computed } from "vue";
import { ElUpload, ElButton, ElIcon } from "element-plus";
import { Upload, Loading, Download, Delete } from "@element-plus/icons-vue";


interface Props { baseUrl?: string; headers?: Record<string, string>; }
const props = withDefaults(defineProps<Props>(), { baseUrl: "/v2/ai/colorize" });
const generating = ref(false);
const originalImage = ref("");
const result = ref("");
const uploadUrl = computed(() => `${props.baseUrl}/upload`);

const handleUploadSuccess = (response: any) => {
  if (response.code === 200) {
    originalImage.value = response.data.original;
    result.value = response.data.result;
  } else {
    message.error(response.message || "上色失败");
  }
};
const handleUploadError = () => message.error("上传失败");
const handleDownload = () => { if (!result.value) return; const a = document.createElement("a"); a.href = result.value; a.download = "colorized.png"; document.body.appendChild(a); a.click(); document.body.removeChild(a); };
const reset = () => { originalImage.value = ""; result.value = ""; };
</script>

<style scoped>
.re-colorize { display: flex; flex-direction: column; gap: 16px; }
.re-colorize__loading { display: flex; align-items: center; gap: 8px; color: var(--el-text-color-secondary); }
.re-colorize__result { display: flex; flex-direction: column; align-items: center; gap: 12px; }
.re-colorize__compare { display: flex; gap: 24px; flex-wrap: wrap; justify-content: center; }
.re-colorize__compare > div { text-align: center; }
.re-colorize__compare img { max-width: 300px; max-height: 300px; border-radius: var(--el-border-radius-base); border: 1px solid var(--el-border-color-lighter); }
.re-colorize__compare span { display: block; margin-top: 4px; font-size: 12px; color: var(--el-text-color-secondary); }
.re-colorize__actions { display: flex; gap: 8px; }
</style>
