<script setup lang="ts">
import { ref, computed, watch, onScopeDispose } from "vue";
import { getConfig } from "@repo/config";
import type { AiChatConfig } from "@repo/config";
import { ElMessage } from "element-plus";
import ReSwitch from "@repo/ui/re-switch";
import ReSelect from "@repo/ui/re-select";
import ReInputNumber from "@repo/ui/re-input-number";
import ReRemoteSelect from "@repo/ui/re-remote-select";
import type { ReOption } from "@repo/ui/re-select";
import { useWebLLM } from "@repo/web-llm";
import { Cpu, Loading, CircleCloseFilled, SuccessFilled } from "@element-plus/icons-vue";

const appConfig = getConfig();
const aiChat = computed(() => appConfig.other.aiChat as AiChatConfig);

const {
  loading: modelLoading,
  generating,
  error: modelError,
  onProgress,
  loadModel,
  unloadModel,
} = useWebLLM({
  model: aiChat.value.aiChatModel,
  maxTokens: aiChat.value.aiChatMaxTokens,
  temperature: aiChat.value.aiChatTemperature,
});

const progressText = ref("");
const offProgress = onProgress((p) => {
  progressText.value = p.text
    ? `${p.text}${p.progress != null ? ` (${Math.round(p.progress * 100)}%)` : ""}`
    : "";
});

onScopeDispose(() => offProgress?.());

const webllmModels = [
  { label: "Qwen2.5-1.5B-Instruct (推荐·轻量)", value: "Qwen2.5-1.5B-Instruct-q4f16_1-MLC" },
  { label: "Qwen2.5-3B-Instruct (中量)", value: "Qwen2.5-3B-Instruct-q4f16_1-MLC" },
  { label: "Llama-3.2-1B-Instruct (超轻)", value: "Llama-3.2-1B-Instruct-q4f16_1-MLC" },
  { label: "Llama-3.2-3B-Instruct (中量)", value: "Llama-3.2-3B-Instruct-q4f16_1-MLC" },
  { label: "Phi-3.5-mini-instruct (中量)", value: "Phi-3.5-mini-instruct-q4f16_1-MLC" },
  { label: "gemma-2-2b-it (中量)", value: "gemma-2-2b-it-q4f16_1-MLC" },
];

const vendorOptions = [
  { label: "OpenAI (GPT 系列)", value: "openai" },
  { label: "DeepSeek (深度求索)", value: "deepseek" },
  { label: "自定义 (兼容 OpenAI 格式)", value: "custom" },
];

const modeOptions = [
  { label: "浏览器本地推理 (WebLLM)", value: "webllm" },
  { label: "厂商 API (在线)", value: "vendor" },
];

const handleModeChange = (val: string) => {
  aiChat.value.aiChatMode = val as "webllm" | "vendor";
};

const handleLoadModel = async () => {
  try {
    await loadModel();
    ElMessage.success("模型加载完成，可以开始对话");
  } catch (err) {
    ElMessage.error(`模型加载失败：${err instanceof Error ? err.message : String(err)}`);
  }
};

const handleUnloadModel = () => {
  unloadModel();
  progressText.value = "";
  ElMessage.info("模型已卸载，显存已释放");
};

/** 获取厂商模型列表（OpenAI 兼容 /v1/models），给 ReRemoteSelect loader 使用 */
async function fetchVendorModels(params?: Record<string, unknown>): Promise<{ label: string; value: string }[]> {
  if (!aiChat.value.aiChatApiUrl || !aiChat.value.aiChatApiKey) {
    return [];
  }
  const baseUrl = aiChat.value.aiChatApiUrl.replace(/\/+$/, "");
  try {
    const res = await fetch(`${baseUrl}/models`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${aiChat.value.aiChatApiKey}`,
        "Content-Type": "application/json",
      },
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (data.data && Array.isArray(data.data)) {
      return data.data.map((m: any) => ({ label: m.id, value: m.id }));
    }
    return [];
  } catch {
    return [];
  }
}

watch(
  () => aiChat.value.aiChatModel,
  (val) => {
    if (val) {
      unloadModel();
      progressText.value = "";
    }
  },
);
</script>

<template>
  <div v-if="aiChat.enable" class="config-section">
    <div class="section-header">
      <el-icon :size="18" class="section-icon"><Cpu /></el-icon>
      <span class="section-title">AI 对话</span>
    </div>

    <div class="section-card">
      <ReSwitch layout="card"
        title="启用 AI 助手"
        tip="开启后页面右下角显示悬浮 AI 入口"
        v-model="aiChat.aiChatEnabled"
      />

      <template v-if="aiChat.aiChatEnabled">
        <ReSelect
          layout="card"
          :data="modeOptions"
          :model-value="aiChat.aiChatMode"
          placeholder="运行模式"
          @update:model-value="handleModeChange"
        />

        <template v-if="aiChat.aiChatMode === 'webllm'">
          <ReSelect
            layout="card"
            :data="webllmModels"
            v-model="aiChat.aiChatModel"
            placeholder="选择本地推理模型"
          />

          <div class="ai-model-status">
            <div v-if="modelLoading" class="ai-model-status__loading">
              <el-icon class="is-loading"><Loading /></el-icon>
              <span>{{ progressText || "正在加载模型..." }}</span>
            </div>
            <div v-else-if="modelError" class="ai-model-status__error">
              <el-icon><CircleCloseFilled /></el-icon>
              <span>{{ modelError }}</span>
            </div>
            <div v-else-if="generating" class="ai-model-status__loading">
              <el-icon class="is-loading"><Loading /></el-icon>
              <span>正在生成回复...</span>
            </div>
            <div v-else class="ai-model-status__idle">
              <el-icon><SuccessFilled /></el-icon>
              <span>模型就绪，可正常对话</span>
            </div>

            <div class="ai-model-actions">
              <el-button
                size="small"
                type="primary"
                plain
                :loading="modelLoading"
                @click="handleLoadModel"
              >
                {{ modelLoading ? "加载中" : "加载模型" }}
              </el-button>
              <el-button
                size="small"
                plain
                :disabled="modelLoading"
                @click="handleUnloadModel"
              >
                卸载
              </el-button>
            </div>
          </div>
        </template>

        <template v-if="aiChat.aiChatMode === 'vendor'">
          <ReSelect
            layout="card"
            :data="vendorOptions"
            v-model="aiChat.aiChatVendor"
            placeholder="选择服务厂商"
          />

          <div class="config-item">
            <div class="config-label">API URL</div>
            <el-input
              v-model="aiChat.aiChatApiUrl"
              class="config-input"
              placeholder="https://api.openai.com/v1/chat/completions"
              clearable
            />
          </div>

          <div class="config-item">
            <div class="config-label">API Key</div>
            <el-input
              v-model="aiChat.aiChatApiKey"
              class="config-input"
              type="password"
              show-password
              placeholder="sk-..."
              clearable
            />
          </div>

          <div class="config-item">
            <div class="config-label">模型 ID</div>
            <ReRemoteSelect
              v-model="aiChat.aiChatModel"
              :loader="fetchVendorModels"
              enable-input
              placeholder="选择或输入模型 ID"
              input-placeholder="手动输入模型 ID"
              sync-tooltip="获取模型列表"
              clearable
            />
          </div>
        </template>

        <div class="ai-advanced">
          <div class="ai-advanced__title">高级参数</div>
          <div class="ai-advanced__grid">
            <ReInputNumber layout="card" v-model="aiChat.aiChatMaxTokens" :min="64" :max="8192" :step="64" title="最大 Token" sub="限制" />
            <ReInputNumber layout="card" v-model="aiChat.aiChatTemperature" :min="0" :max="2" :step="0.1" :precision="1" title="温度" sub="随机性" />
          </div>
        </div>

        <div class="ai-advanced">
          <div class="ai-advanced__title">上下文管理</div>
          <div class="ai-advanced__grid">
            <ReInputNumber layout="card" v-model="aiChat.aiChatContextLimit" :min="10" :max="500" :step="10" title="上下文上限" sub="条数" />
            <ReInputNumber layout="card" v-model="aiChat.aiChatSummaryThreshold" :min="50" :max="100" :step="5" title="自动总结阈值" sub="百分比" />
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.ai-model-status {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  margin: 8px 0;
  border-radius: 8px;
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);

  &__loading,
  &__error,
  &__idle {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: var(--el-text-color-regular);
  }

  &__error { color: var(--el-color-danger); }
  &__idle { color: var(--el-color-success); }
}

.ai-model-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.ai-advanced {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--el-border-color-lighter);

  &__title {
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-secondary);
    margin-bottom: 10px;
  }

  &__grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
}

/**
 * AI 助手区相邻元素之间的呼吸距离
 */
.section-card {
  :deep(.re-card-select__trigger) {
    margin-top: 12px;
  }

  :deep(.re-card-select__trigger:first-child) {
    margin-top: 0;
  }
}

.section-card > .config-item,
.section-card > .ai-advanced,
.section-card > .ai-model-status {
  margin-top: 12px;
}
</style>