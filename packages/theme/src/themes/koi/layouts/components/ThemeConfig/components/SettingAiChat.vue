<script setup lang="ts">
/**
 * AI 对话设置组件
 *
 * 集成 @repo/web-llm（浏览器本地大模型推理）与厂商 API 模式。
 * 设置项实时写入 appConfig.other.aiChat，由 config.ts 的 watch 自动持久化。
 */
import { ref, computed, watch, onScopeDispose } from "vue";
import { getConfig } from "@repo/config";
import type { AiChatConfig } from "@repo/config";
import { ElMessage } from "element-plus";
import ReSwitch from "@repo/ui/re-switch";
import { useWebLLM } from "@repo/web-llm";
import { Cpu, Loading, CircleCloseFilled, SuccessFilled } from "@element-plus/icons-vue";

const appConfig = getConfig();
const aiChat = computed(() => appConfig.other.aiChat as AiChatConfig);

/** 环境判断：仅 dev/test 显示分区 */
const isDevOrTest = computed(() => {
  const env = appConfig.env?.env ?? "dev";
  return env === "dev" || env === "test";
});

// ==================== WebLLM 集成 ====================
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

/** 加载进度文本 */
const progressText = ref("");
const offProgress = onProgress((p) => {
  progressText.value = p.text
    ? `${p.text}${p.progress != null ? ` (${Math.round(p.progress * 100)}%)` : ""}`
    : "";
});

onScopeDispose(() => offProgress?.());

// ==================== 模型选项 ====================
/** WebLLM 可用模型列表（与 @mlc-ai/web-llm 预置模型对齐） */
const webllmModels = [
  { label: "Qwen2.5-1.5B-Instruct (推荐·轻量)", value: "Qwen2.5-1.5B-Instruct-q4f16_1-MLC" },
  { label: "Qwen2.5-3B-Instruct (中量)", value: "Qwen2.5-3B-Instruct-q4f16_1-MLC" },
  { label: "Llama-3.2-1B-Instruct (超轻)", value: "Llama-3.2-1B-Instruct-q4f16_1-MLC" },
  { label: "Llama-3.2-3B-Instruct (中量)", value: "Llama-3.2-3B-Instruct-q4f16_1-MLC" },
  { label: "Phi-3.5-mini-instruct (中量)", value: "Phi-3.5-mini-instruct-q4f16_1-MLC" },
  { label: "gemma-2-2b-it (中量)", value: "gemma-2-2b-it-q4f16_1-MLC" },
];

/** 厂商选项 */
const vendorOptions = [
  { label: "OpenAI (GPT 系列)", value: "openai" },
  { label: "DeepSeek (深度求索)", value: "deepseek" },
  { label: "自定义 (兼容 OpenAI 格式)", value: "custom" },
];

// ==================== 操作方法 ====================
/** 模式切换 */
const handleModeChange = (val: string) => {
  aiChat.value.aiChatMode = val as "webllm" | "vendor";
};

/** 加载 / 卸载 WebLLM 模型 */
const handleLoadModel = async () => {
  try {
    await loadModel();
    ElMessage.success("模型加载完成，可以开始对话");
  } catch (err) {
    ElMessage.error(`模型加载失败：${err instanceof Error ? err.message : String(err)}`);
  }
};

/** 卸载模型释放显存 */
const handleUnloadModel = () => {
  unloadModel();
  progressText.value = "";
  ElMessage.info("模型已卸载，显存已释放");
};

/** 模型变更时更新 useWebLLM 配置 */
watch(
  () => aiChat.value.aiChatModel,
  (val) => {
    if (val) {
      // 模型变更后需要重新加载
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
      <!-- AI 显示总开关 -->
      <ReSwitch
        title="启用 AI 助手"
        tip="开启后页面右下角显示悬浮 AI 入口"
        v-model="aiChat.aiChatEnabled"
      />

      <template v-if="aiChat.aiChatEnabled">
        <!-- 模式选择 -->
        <div class="config-item">
          <div class="config-label">运行模式</div>
          <el-select
            :model-value="aiChat.aiChatMode"
            class="config-input"
            @change="handleModeChange"
          >
            <el-option label="浏览器本地推理 (WebLLM)" value="webllm" />
            <el-option label="厂商 API (在线)" value="vendor" />
          </el-select>
        </div>

        <!-- ====== WebLLM 模式 ====== -->
        <template v-if="aiChat.aiChatMode === 'webllm'">
          <div class="config-item">
            <div class="config-label">模型选择</div>
            <el-select
              v-model="aiChat.aiChatModel"
              class="config-input"
              placeholder="选择本地推理模型"
            >
              <el-option
                v-for="m in webllmModels"
                :key="m.value"
                :label="m.label"
                :value="m.value"
              />
            </el-select>
          </div>

          <!-- 加载状态 -->
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

        <!-- ====== Vendor 模式 ====== -->
        <template v-if="aiChat.aiChatMode === 'vendor'">
          <div class="config-item">
            <div class="config-label">服务厂商</div>
            <el-select
              v-model="aiChat.aiChatVendor"
              class="config-input"
              placeholder="选择服务厂商"
            >
              <el-option
                v-for="v in vendorOptions"
                :key="v.value"
                :label="v.label"
                :value="v.value"
              />
            </el-select>
          </div>

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
        </template>

        <!-- 高级参数（两种模式共用） -->
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
</style>
