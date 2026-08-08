<template>
  <div class="re-image-gen">
    <div class="re-image-gen__input">
      <ReCardTextarea
        v-model="prompt"
        placeholder="输入图像描述..."
        :rows="3"
      />
      <div class="re-image-gen__options">
        <el-select v-model="model" placeholder="模型" size="small" style="width: 140px">
          <el-option value="stable-diffusion" label="Stable Diffusion" />
          <el-option value="dall-e" label="DALL-E" />
        </el-select>
        <el-select v-model="size" placeholder="尺寸" size="small" style="width: 120px">
          <el-option value="512x512" label="512x512" />
          <el-option value="1024x1024" label="1024x1024" />
        </el-select>
        <el-button type="primary" :loading="generating" :disabled="!prompt.trim()" @click="handleGenerate">
          <el-icon><MagicStick /></el-icon>
          生成
        </el-button>
      </div>
    </div>

    <div v-if="generating" class="re-image-gen__loading">
      <el-icon class="is-loading"><Loading /></el-icon>
      <span>生成中...</span>
    </div>

    <div v-if="result" class="re-image-gen__result">
      <img :src="result" alt="生成图像" />
      <div class="re-image-gen__actions">
        <el-button size="small" @click="handleDownload">
          <el-icon><Download /></el-icon>
          下载
        </el-button>
        <el-button size="small" @click="result = ''">
          <el-icon><Delete /></el-icon>
          清除
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { http } from "@repo/core";
import { ElSelect, ElOption, ElButton, ElIcon, ElMessage } from "element-plus";
import ReCardTextarea from "../ReCardTextarea/index.vue";
import { MagicStick, Loading, Download, Delete } from "@element-plus/icons-vue";

interface Props {
  baseUrl?: string;
  headers?: Record<string, string>;
}

const props = withDefaults(defineProps<Props>(), {
  baseUrl: "/v2/ai/generate",
});

const prompt = ref("");
const model = ref("stable-diffusion");
const size = ref("1024x1024");
const generating = ref(false);
const result = ref("");

const handleGenerate = async () => {
  if (!prompt.value.trim() || generating.value) return;
  generating.value = true;
  try {
    const { data } = await http()
      .post(`${props.baseUrl}/image`)
      .headers(props.headers ?? {})
      .data({ prompt: prompt.value, model: model.value, size: size.value });
    if (data.code !== 200) throw new Error(data.message || "生成失败");
    result.value = data.data.url;
  } catch (e) {
    result.value = "";
    ElMessage.error((e as Error).message);
  } finally {
    generating.value = false;
  }
};

const handleDownload = () => {
  if (!result.value) return;
  const link = document.createElement("a");
  link.href = result.value;
  link.download = "generated-image.png";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
</script>

<style scoped>
.re-image-gen {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.re-image-gen__options {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  align-items: center;
  flex-wrap: wrap;
}
.re-image-gen__loading {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--el-text-color-secondary);
}
.re-image-gen__result {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.re-image-gen__result img {
  max-width: 100%;
  max-height: 512px;
  border-radius: var(--el-border-radius-base);
  border: 1px solid var(--el-border-color-lighter);
}
.re-image-gen__actions {
  display: flex;
  gap: 8px;
}
</style>
