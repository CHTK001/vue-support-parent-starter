<template>
  <!-- AI 设置区域 -->
  <div v-if="showAiChat !== false" class="setting-section">
    <div class="section-header">
      <IconifyIconOnline icon="ri:robot-line" class="section-icon" />
      <h3 class="section-title">{{ t("panel.aiChatSkin") }}</h3>
      <div class="section-description">
        {{ t("panel.aiChatSkinDesc") }}
      </div>
    </div>
    <div class="setting-content">
      <!-- 功能开关 -->
      <div class="setting-item">
        <div class="switch-card-grid">
          <ScSwitch
            v-model="settings.aiChatEnabled"
            layout="visual-card"
            label="AI 显示"
            description="控制页面悬浮 AI 助手入口是否显示"
            active-icon="ri:robot-2-line"
            inactive-icon="ri:robot-off-line"
            @change="aiChatEnabledChange"
          />
        </div>
      </div>

      <!-- 其余 AI 配置：仅在显示开启时展示 -->
      <template v-if="settings.aiChatEnabled">
        <!-- 模式选择 -->
        <div class="setting-item setting-item--row">
          <div class="setting-item-label">
            <span class="setting-item-desc">模式</span>
          </div>
          <div class="setting-item-control">
            <ScSelect
              v-model="settings.aiChatMode"
              layout="dropdown"
              :options="aiChatModeOptions"
              width="260px"
              height="200px"
              dropdown-title="选择运行模式"
              dropdown-placeholder="请选择模式"
              @change="handleModeChange"
            />
          </div>
        </div>

        <!-- 厂家选择（仅 vendor 模式） -->
        <div v-if="settings.aiChatMode === 'vendor'" class="setting-item setting-item--row">
          <div class="setting-item-label">
            <span class="setting-item-desc">服务厂商</span>
          </div>
          <div class="setting-item-control">
            <ScSelect
              v-model="settings.aiChatVendor"
              layout="dropdown"
              :options="aiChatVendorOptions"
              width="260px"
              height="300px"
              dropdown-title="选择服务厂商"
              dropdown-placeholder="请选择厂商"
              @change="handleVendorChange"
            />
          </div>
        </div>

        <!-- 模型选择（仅 webllm 模式） -->
        <div v-if="settings.aiChatMode === 'webllm'" class="setting-item setting-item--row">
          <div class="setting-item-label">
            <span class="setting-item-desc">模型</span>
          </div>
          <div class="setting-item-control">
            <ScSelect
              v-model="settings.aiChatModel"
              layout="dropdown"
              :options="aiChatModelOptions"
              dropdown-title="选择推理模型"
              dropdown-placeholder="请选择 WebLLM MLC 模型"
              width="260px"
              height="260px"
              @change="aiChatModelChange"
            />
          </div>
        </div>

        <!-- API Key（仅 vendor 模式） -->
        <div v-if="settings.aiChatMode === 'vendor'" class="setting-item setting-item--row">
          <div class="setting-item-label">
            <span>API Key</span>
          </div>
          <div class="setting-item-control">
            <ScInput
              v-model="settings.aiChatApiKey"
              type="password"
              show-password
              placeholder="请输入 API Key"
              @change="aiChatApiKeyChange"
              style="width: 260px"
            />
          </div>
        </div>

        <!-- API URL（仅 vendor 模式） -->
        <div v-if="settings.aiChatMode === 'vendor'" class="setting-item setting-item--row">
          <div class="setting-item-label">
            <span>API URL</span>
          </div>
          <div class="setting-item-control">
            <ScInput
              v-model="settings.aiChatApiUrl"
              :placeholder="isCustomVendor ? '填入自定义 API 地址' : '已自动填入厂商默认地址'"
              :readonly="!isCustomVendor"
              @change="aiChatApiUrlChange"
              style="width: 260px"
            />
          </div>
        </div>

        <!-- 外观样式 -->
        <div class="setting-item setting-item--row">
          <div class="setting-item-label">
            <span>外观</span>
            <span class="setting-item-desc">外观样式</span>
          </div>
          <div class="setting-item-control">
            <AiChatAppearanceSetting
              v-model="settings.aiChatSkin"
              :options="aiChatSkinOptions"
              @change="aiChatSkinChange"
            />
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { ScSwitch, ScInput } from "@repo/components";
import ScSelect from "@repo/components/ScSelect/index.vue";
import AiChatAppearanceSetting from "./AiChatAppearanceSetting.vue";
import { AI_APPEARANCE_OPTIONS } from "../../../lay-ai/appearance";

const { t } = useI18n();

interface SkinOptionsType {
  label: string;
  value: string | number | boolean;
  tip?: string;
}

interface AiDropdownOption {
  label: string;
  value: string | number;
  image: { width: string; height: string };
  description?: string;
}

const AI_IMG = { width: "24px", height: "24px" } as const;

const aiChatSkinOptions = computed(() => AI_APPEARANCE_OPTIONS);

/** 厂商预设 URL */
const VENDOR_DEFAULT_URLS: Record<string, string> = {
  openai: "https://api.openai.com/v1/chat/completions",
  deepseek: "https://api.deepseek.com/v1/chat/completions",
  qwen: "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
  siliconflow: "https://api.siliconflow.cn/v1/chat/completions",
  zhipu: "https://open.bigmodel.cn/api/paas/v4/chat/completions",
  moonshot: "https://api.moonshot.cn/v1/chat/completions",
  custom: "",
};

/** 模式选项 */
const aiChatModeOptions = computed<Array<AiDropdownOption>>(() => [
  { label: "WebLLM（本地）", value: "webllm", description: "使用 @mlc-ai/web-llm 在浏览器端本地运行大模型，无需服务器", image: AI_IMG },
  { label: "Chrome AI", value: "chrome", description: "使用 Chrome 浏览器内置 AI 能力（实验性）", image: AI_IMG },
  { label: "厂家 API", value: "vendor", description: "调用第三方 AI 厂商 API，需要 API Key", image: AI_IMG },
]);

/** 厂商选项（仅 vendor 模式使用） */
const aiChatVendorOptions = computed<Array<AiDropdownOption>>(() => [
  { label: "OpenAI", value: "openai", description: "OpenAI GPT 系列，需要 API Key", image: AI_IMG },
  { label: "DeepSeek", value: "deepseek", description: "DeepSeek 大模型，国内访问友好", image: AI_IMG },
  { label: "通义千问", value: "qwen", description: "阿里云通义千问，兼容 OpenAI 接口", image: AI_IMG },
  { label: "硅基流动", value: "siliconflow", description: "硅基流动，支持多种开源模型", image: AI_IMG },
  { label: "智谱 AI", value: "zhipu", description: "智谱 GLM 系列模型", image: AI_IMG },
  { label: "Moonshot（Kimi）", value: "moonshot", description: "月之暗面 Kimi 大模型", image: AI_IMG },
  { label: "自定义", value: "custom", description: "手动填写 API URL 和 Key", image: AI_IMG },
]);

/** WebLLM 模型选项 */
const aiChatModelOptions = computed<Array<AiDropdownOption>>(() => [
  { label: "Qwen2.5-1.5B-Instruct（推荐）", value: "Qwen2.5-1.5B-Instruct-q4f16_1-MLC", description: "阿里 Qwen 1.5B MLC 量化版，体积小、加载快，适合入门", image: AI_IMG },
  { label: "Qwen2.5-3B-Instruct", value: "Qwen2.5-3B-Instruct-q4f16_1-MLC", description: "阿里 Qwen 3B MLC 量化版，能力更强，需要更多内存", image: AI_IMG },
  { label: "Llama-3.2-1B-Instruct", value: "Llama-3.2-1B-Instruct-q4f16_1-MLC", description: "Meta Llama 3.2 1B MLC 量化版，轻量场景适用", image: AI_IMG },
  { label: "Llama-3.2-3B-Instruct", value: "Llama-3.2-3B-Instruct-q4f16_1-MLC", description: "Meta Llama 3.2 3B MLC 量化版，综合能力较强", image: AI_IMG },
]);

interface Props {
  settings: Record<string, any>;
  showAiChat?: boolean;
  aiChatEnabledChange: (value: boolean) => void;
  aiChatApiKeyChange: (value: string) => void;
  aiChatApiUrlChange: (value: string) => void;
  aiChatModeChange: (value: string | number | boolean) => void;
  aiChatVendorChange: (value: string | number | boolean) => void;
  aiChatModelChange: (value: string | number | boolean) => void;
  aiChatSkinChange: (value: string | number | boolean | SkinOptionsType) => void;
}

const props = defineProps<Props>();

/** 模式变更：切换到 vendor 时确保 aiChatVendor 有合法值 */
function handleModeChange(value: string | number | boolean) {
  const mode = String(value) as "webllm" | "chrome" | "vendor";
  // 切换到 vendor 且当前 vendor 是旧的 hf/chrome，重置为 openai
  if (mode === "vendor") {
    const v = props.settings.aiChatVendor;
    if (!v || v === "hf" || v === "chrome") {
      props.settings.aiChatVendor = "openai";
      const defaultUrl = VENDOR_DEFAULT_URLS["openai"];
      props.settings.aiChatApiUrl = defaultUrl;
      props.aiChatApiUrlChange(defaultUrl);
      props.aiChatVendorChange("openai");
    }
  }
  props.aiChatModeChange(value);
}

/** 厂商变更时自动填充预设 URL */
function handleVendorChange(value: string | number | boolean) {
  const vendor = String(value);
  if (vendor in VENDOR_DEFAULT_URLS) {
    const defaultUrl = VENDOR_DEFAULT_URLS[vendor];
    props.settings.aiChatApiUrl = defaultUrl;
    props.aiChatApiUrlChange(defaultUrl);
  }
  props.aiChatVendorChange(value);
}

/** 当前厂商是否为自定义 */
const isCustomVendor = computed(() => props.settings.aiChatVendor === "custom");
</script>

<style scoped lang="scss">
.lay-setting .setting-item--row,
.setting-item--row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>
