<script setup lang="ts">
// @ts-nocheck

// @ts-nocheck
import { ref, computed, watch, onScopeDispose } from "vue";
import { getConfig } from "@repo/config";
import type { AiChatConfig } from "@repo/config";

import ReSwitch from "@repo/ui/re-switch";
import ReSelect from "@repo/ui/re-select";
import ReInputNumber from "@repo/ui/re-input-number";
import ReRemoteSelect from "@repo/ui/re-remote-select";
import type { ReOption } from "@repo/ui/re-select";
import { useWebLLM } from "@repo/web-llm";
import { Cpu, Loading, CircleCloseFilled, SuccessFilled } from "@element-plus/icons-vue";
import { useI18n } from "vue-i18n";
import {http, message} from "@repo/core";

const { t } = useI18n();

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

/** WebLLM 可选模型列表：优先取 yaml 配置（aiChat.webllmModels），未配置时回退内置默认 */
const webllmModels = computed(() => {
  const configured = aiChat.value.webllmModels;
  if (Array.isArray(configured) && configured.length > 0) {
    return configured.map((m) => ({ label: m.label, value: m.value, image: m.image }));
  }
  return [
    { label: `Qwen2.5-1.5B-Instruct ${t("aiChat.webllmModelRecommend")}·${t("aiChat.modelLight")}`, value: "Qwen2.5-1.5B-Instruct-q4f16_1-MLC", image: "/assets/models/qwen-color.svg" },
    { label: `Qwen2.5-3B-Instruct (${t('aiChat.modelMedium')})`, value: "Qwen2.5-3B-Instruct-q4f16_1-MLC", image: "/assets/models/qwen-color.svg" },
    { label: `Llama-3.2-1B-Instruct (${t('aiChat.modelLight')})`, value: "Llama-3.2-1B-Instruct-q4f16_1-MLC", image: "/assets/models/meta-color.svg" },
    { label: `Llama-3.2-3B-Instruct (${t('aiChat.modelMedium')})`, value: "Llama-3.2-3B-Instruct-q4f16_1-MLC", image: "/assets/models/meta-color.svg" },
    { label: `Phi-3.5-mini-instruct (${t('aiChat.modelMedium')})`, value: "Phi-3.5-mini-instruct-q4f16_1-MLC", image: "/assets/models/microsoft-color.svg" },
    { label: `gemma-2-2b-it (${t('aiChat.modelMedium')})`, value: "gemma-2-2b-it-q4f16_1-MLC", image: "/assets/models/gemini-color.svg" },
  ];
});

const vendorOptions = computed(() => [
  { label: t("aiChat.vendorOptions.openai"), value: "openai", image: "/assets/models/openai.png" },
  { label: t("aiChat.vendorOptions.deepseek"), value: "deepseek", image: "/assets/models/deepseek-color.svg" },
  { label: t("aiChat.vendorOptions.custom"), value: "custom" },
]);

const modeOptions = computed(() => [
  { label: t("aiChat.modeOptions.webllm"), value: "webllm" },
  { label: t("aiChat.modeOptions.vendor"), value: "vendor" },
]);

const handleModeChange = (val: string) => {
  aiChat.value.aiChatMode = val as "webllm" | "vendor";
};

const handleLoadModel = async () => {
  try {
    await loadModel();
    message.success(t("aiChat.toast.loaded"));
  } catch (err) {
    message.error(`${t("aiChat.toast.loadFailed")}：${err instanceof Error ? err.message : String(err)}`);
  }
};

const handleUnloadModel = () => {
  unloadModel();
  progressText.value = "";
  message.info(t("aiChat.toast.unloaded"));
};

/** 获取厂商模型列表（OpenAI 兼容 /v1/models），给 ReRemoteSelect loader 使用 */
async function fetchVendorModels(params?: Record<string, unknown>): Promise<{ label: string; value: string }[]> {
  if (!aiChat.value.aiChatApiUrl || !aiChat.value.aiChatApiKey) {
    return [];
  }
  const baseUrl = aiChat.value.aiChatApiUrl.replace(/\/+$/, "");
  try {
    const { data } = await http().get(`${baseUrl}/models`).headers({
      Authorization: `Bearer ${aiChat.value.aiChatApiKey}`,
    });
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
      <span class="section-title">{{ t("aiChat.title") }}</span>
    </div>

    <div class="section-card">
      <ReSwitch layout="card"
        :title="t('aiChat.enable')"
        :tip="t('aiChat.enableTip')"
        v-model="aiChat.aiChatEnabled"
      />

      <template v-if="aiChat.aiChatEnabled">
        <ReSelect
          layout="card"
          :data="modeOptions"
          :model-value="aiChat.aiChatMode"
          :placeholder="t('aiChat.modePlaceholder')"
          @update:model-value="handleModeChange"
        />

        <template v-if="aiChat.aiChatMode === 'webllm'">
          <ReSelect
            layout="card"
            :data="webllmModels"
            v-model="aiChat.aiChatModel"
            :placeholder="t('aiChat.modelPlaceholder')"
          />

          <div class="ai-model-status">
            <div v-if="modelLoading" class="ai-model-status__loading">
              <el-icon class="is-loading"><Loading /></el-icon>
              <span>{{ progressText || t("aiChat.status.loading") }}</span>
            </div>
            <div v-else-if="modelError" class="ai-model-status__error">
              <el-icon><CircleCloseFilled /></el-icon>
              <span>{{ modelError }}</span>
            </div>
            <div v-else-if="generating" class="ai-model-status__loading">
              <el-icon class="is-loading"><Loading /></el-icon>
              <span>{{ t("aiChat.status.generating") }}</span>
            </div>
            <div v-else class="ai-model-status__idle">
              <el-icon><SuccessFilled /></el-icon>
              <span>{{ t("aiChat.status.idle") }}</span>
            </div>

            <div class="ai-model-actions">
              <el-button

                type="primary"
                plain
                :loading="modelLoading"
                @click="handleLoadModel"
              >
                {{ modelLoading ? t("aiChat.actions.loading") : t("aiChat.actions.loadModel") }}
              </el-button>
              <el-button

                plain
                :disabled="modelLoading"
                @click="handleUnloadModel"
              >
                {{ t("aiChat.actions.unload") }}
              </el-button>
            </div>
          </div>
        </template>

        <template v-if="aiChat.aiChatMode === 'vendor'">
          <ReSelect
            layout="card"
            :data="vendorOptions"
            v-model="aiChat.aiChatVendor"
            :placeholder="t('aiChat.vendorPlaceholder')"
          />

          <div class="config-item">
            <div class="config-label">{{ t("aiChat.apiUrl") }}</div>
            <el-input
              v-model="aiChat.aiChatApiUrl"
              class="config-input"
              :placeholder="t('aiChat.apiUrlPlaceholder')"
              clearable
            />
          </div>

          <div class="config-item">
            <div class="config-label">{{ t("aiChat.apiKey") }}</div>
            <el-input
              v-model="aiChat.aiChatApiKey"
              class="config-input"
              type="password"
              show-password
              :placeholder="t('aiChat.apiKeyPlaceholder')"
              clearable
            />
          </div>

          <div class="config-item">
            <div class="config-label">{{ t("aiChat.modelId") }}</div>
            <ReRemoteSelect
              v-model="aiChat.aiChatModel"
              :loader="fetchVendorModels"
              enable-input
              :placeholder="t('aiChat.modelIdPlaceholder')"
              :input-placeholder="t('aiChat.modelIdInputPlaceholder')"
              :sync-tooltip="t('aiChat.syncTooltip')"
              clearable
            />
          </div>
        </template>

        <div class="ai-advanced">
          <div class="ai-advanced__title">{{ t("aiChat.advanced.title") }}</div>
          <div class="ai-advanced__grid">
            <ReInputNumber layout="card" v-model="aiChat.aiChatMaxTokens" :min="64" :max="8192" :step="64" :title="t('aiChat.advanced.maxTokens')" :sub="t('aiChat.advanced.maxTokensSub')" />
            <ReInputNumber layout="card" v-model="aiChat.aiChatTemperature" :min="0" :max="2" :step="0.1" :precision="1" :title="t('aiChat.advanced.temperature')" :sub="t('aiChat.advanced.temperatureSub')" />
          </div>
        </div>

        <div class="ai-advanced">
          <div class="ai-advanced__title">{{ t("aiChat.context.title") }}</div>
          <div class="ai-advanced__grid">
            <ReInputNumber layout="card" v-model="aiChat.aiChatContextLimit" :min="10" :max="500" :step="10" :title="t('aiChat.context.limit')" :sub="t('aiChat.context.limitSub')" />
            <ReInputNumber layout="card" v-model="aiChat.aiChatSummaryThreshold" :min="50" :max="100" :step="5" :title="t('aiChat.context.summaryThreshold')" :sub="t('aiChat.context.summaryThresholdSub')" />
            <ReSwitch
              layout="card"
              v-model="aiChat.aiChatSummaryEnabled"
              :title="t('aiChat.context.summaryEnabled')"
              :sub="t('aiChat.context.summaryEnabledSub')"
            />
            <ReInputNumber layout="card" v-model="aiChat.aiChatSummaryRetainRounds" :min="1" :max="50" :step="1" :title="t('aiChat.context.retainRounds')" :sub="t('aiChat.context.retainRoundsSub')" />
          </div>
        </div>

        <div class="ai-advanced">
          <div class="ai-advanced__title">{{ t("aiChat.character.title") }}</div>
          <div class="ai-advanced__grid">
            <ReSelect
              layout="card"
              :data="[
                { label: t('aiChat.character.model3d'), value: '3d' },
                { label: t('aiChat.character.model2d'), value: '2d' },
              ]"
              v-model="aiChat.aiChatCharacter"
              :placeholder="t('aiChat.character.placeholder')"
            />
            <el-input
              v-if="aiChat.aiChatCharacter === '3d'"
              v-model="aiChat.aiChatModelUrl"
              class="config-input"
              :placeholder="t('aiChat.character.glbPlaceholder')"
            />
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