<script setup lang="ts">
import { ref, computed, watch, onScopeDispose } from "vue";
import { getConfig } from "@repo/config";
import type { AiChatConfig } from "@repo/config";
import { ElMessage } from "element-plus";
import ReSwitch from "@repo/ui/re-switch";
import ReSelect from "@repo/ui/re-select";
import type { ReOption } from "@repo/ui/re-select";
import { useWebLLM } from "@repo/web-llm";
import { Cpu, Loading, CircleCloseFilled, SuccessFilled, Refresh } from "@element-plus/icons-vue";

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

// ==================== 模型 ID 显示组件 ====================
/** 手动输入模式 */
const isManualInput = ref(false);
/** 已获取的模型选项 */
const modelIdOptions = ref<ReOption[]>([]);
/** 正在获取模型 */
const isFetchingModels = ref(false);

/** 获取厂商模型列表（OpenAI 兼容 /v1/models） */
async function fetchVendorModels() {
  if (!aiChat.value.aiChatApiUrl || !aiChat.value.aiChatApiKey) {
    ElMessage.warning("请先填写 API URL 和 API Key");
    return;
  }
  const baseUrl = aiChat.value.aiChatApiUrl.replace(/\/+$/, "");
  try {
    isFetchingModels.value = true;
    const res = await fetch(`${baseUrl}/models`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${aiChat.value.aiChatApiKey}`,
        "Content-Type": "application/json",
      },
    });
    if (!res.ok) {
      ElMessage.error(`获取模型失败：HTTP ${res.status}`);
      return;
    }
    const data = await res.json();
    if (data.data && Array.isArray(data.data)) {
      modelIdOptions.value = data.data.map((m: any) => ({ label: m.id, value: m.id }));
      isManualInput.value = false;
      ElMessage.success(`已获取 ${modelIdOptions.value.length} 个模型`);
    } else {
      ElMessage.error("模型数据格式不正确");
    }
  } catch (err) {
    ElMessage.error(`获取模型失败：${err instanceof Error ? err.message : String(err)}`);
  } finally {
    isFetchingModels.value = false;
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
          v-model="aiChat.aiChatMode"
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

          <div class="ai-model-id-section">
            <div class="ai-model-id-label">模型 ID</div>
            <div class="ai-model-id-row">
              <ReSwitch
                layout="default"
                v-if="!isManualInput"
                title="手动输入"
                v-model="isManualInput"
              />
              <el-input
                v-if="isManualInput"
                v-model="aiChat.aiChatModel"
                class="ai-model-id-input"
                placeholder="手动输入模型 ID"
                clearable
              />
              <ReSelect
                v-else
                :data="modelIdOptions"
                v-model="aiChat.aiChatModel"
                placeholder="点击右侧获取模型"
                class="ai-model-id-select"
                :disabled="modelIdOptions.length === 0"
              />
              <el-button
                size="small"
                type="primary"
                plain
                :icon="Refresh"
                :loading="isFetchingModels"
                @click="fetchVendorModels"
              >
                获取模型
              </el-button>
            </div>
          </div>
        </template>

        <div class="ai-advanced">
          <div class="ai-advanced__title">高级参数</div>
          <div class="ai-advanced__grid">
            <div class="config-item">
              <div class="config-label">最大 Token</div>
              <el-input-number
                v-model="aiChat.aiChatMaxTokens"
                :min="64"
                :max="8192"
                :step="64"
                class="config-input"
              />
            </div>
            <div class="config-item">
              <div class="config-label">温度</div>
              <el-input-number
                v-model="aiChat.aiChatTemperature"
                :min="0"
                :max="2"
                :step="0.1"
                :precision="1"
                class="config-input"
              />
            </div>
          </div>
        </div>

        <div class="ai-advanced">
          <div class="ai-advanced__title">上下文管理</div>
          <div class="ai-advanced__grid">
            <div class="config-item">
              <div class="config-label">上下文上限</div>
              <el-input-number
                v-model="aiChat.aiChatContextLimit"
                :min="10"
                :max="500"
                :step="10"
                class="config-input"
              />
            </div>
            <div class="config-item">
              <div class="config-label">自动总结阈值</div>
              <el-input-number
                v-model="aiChat.aiChatSummaryThreshold"
                :min="50"
                :max="100"
                :step="5"
                class="config-input"
              />
            </div>
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
}

.ai-model-id-section {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.ai-model-id-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-secondary);
  margin-bottom: 8px;
}

.ai-model-id-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ai-model-id-input {
  flex: 1;
}

.ai-model-id-select {
  flex: 1;
  width: 100%;
}
</style>