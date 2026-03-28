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
        <div class="setting-item ai-field-item">
          <div class="ai-field-label">模式</div>
          <ScSelect
            v-model="settings.aiChatMode"
            layout="dropdown"
            :options="aiChatModeOptions"
            :z-index="41000"
            width="100%"
            height="200px"
            dropdown-title="选择运行模式"
            dropdown-placeholder="请选择模式"
            @change="handleModeChange"
          />
        </div>

        <!-- webllm 模式：模型选择 -->
        <div v-if="settings.aiChatMode === 'webllm'" class="setting-item ai-field-item">
          <div class="ai-field-label">模型</div>
          <ScSelect
            v-model="settings.aiChatModel"
            layout="dropdown"
            :options="aiChatModelOptions"
            :z-index="41000"
            dropdown-title="选择推理模型"
            dropdown-placeholder="请选择 WebLLM MLC 模型"
            width="100%"
            height="260px"
            @change="aiChatModelChange"
          />
        </div>

        <!-- vendor 模式：厂商 + 模型 + APIKey + URL 分组卡片 -->
        <div v-if="settings.aiChatMode === 'vendor'" class="ai-vendor-card">
          <!-- 厂商选择 -->
          <div class="ai-field-item">
            <div class="ai-field-label">服务厂商</div>
            <ScSelect
              v-model="settings.aiChatVendor"
              layout="dropdown"
              :options="aiChatVendorOptions"
              :z-index="41000"
              width="100%"
              height="300px"
              dropdown-title="选择服务厂商"
              dropdown-placeholder="请选择厂商"
              @change="handleVendorChange"
            />
          </div>

          <!-- 模型选择（非 custom：带价格信息） -->
          <div v-if="!isCustomVendor && currentVendorModels.length > 0" class="ai-field-item">
            <div class="ai-field-label">模型</div>
            <ScSelect
              v-model="settings.aiChatModel"
              layout="dropdown"
              :options="currentVendorModels"
              :z-index="41000"
              dropdown-title="选择模型"
              dropdown-placeholder="请选择模型"
              width="100%"
              height="320px"
              @change="aiChatModelChange"
            >
              <!-- 自定义选项：模型名 + 价格，tooltip 显示上下文和描述 -->
              <template #content="{ option }">
                <ScTooltip
                  :content="`上下文：${formatContext(option.contextLength)} token｜${option.description}`"
                  placement="left"
                  effect="light"
                  :z-index="41000"
                >
                  <div class="vendor-model-option">
                    <span class="vendor-model-name">{{ option.label }}</span>
                    <span class="vendor-model-price">
                      输入 {{ formatPrice(option.inputPrice) }} · 输出 {{ formatPrice(option.outputPrice) }}
                    </span>
                  </div>
                </ScTooltip>
              </template>
            </ScSelect>
          </div>

          <!-- 模型 ID 输入（custom 模式） -->
          <div v-if="isCustomVendor" class="ai-field-item">
            <div class="ai-field-label">
              模型 ID
              <span class="ai-field-hint">填写模型标识符，如 gpt-4o</span>
            </div>
            <ScInput
              v-model="settings.aiChatModel"
              placeholder="如 gpt-4o / deepseek-chat"
              @change="aiChatModelChange"
              style="width: 100%"
            />
          </div>

          <!-- API Key -->
          <div class="ai-field-item">
            <div class="ai-field-label">API Key</div>
            <ScInput
              v-model="settings.aiChatApiKey"
              type="password"
              show-password
              passwd-strong="none"
              placeholder="请输入 API Key"
              @change="aiChatApiKeyChange"
              style="width: 100%"
            />
          </div>

          <!-- API URL（仅 custom 模式） -->
          <div v-if="isCustomVendor" class="ai-field-item">
            <div class="ai-field-label">API URL</div>
            <ScInput
              v-model="settings.aiChatApiUrl"
              placeholder="填入自定义 API 地址"
              @change="aiChatApiUrlChange"
              style="width: 100%"
            />
          </div>
        </div>

        <!-- 外观样式 -->
        <div class="setting-item ai-field-item">
          <div class="ai-field-label">
            外观
            <span class="ai-field-hint">聊天窗口外观样式</span>
          </div>
          <AiChatAppearanceSetting
            v-model="settings.aiChatSkin"
            :options="aiChatSkinOptions"
            @change="aiChatSkinChange"
          />
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import ScSwitch from "@repo/components/ScSwitch/index.vue";
import ScInput from "@repo/components/ScInput/index";
import ScTooltip from "@repo/components/ScTooltip/index";
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

/** 厂商模型条目 */
interface VendorModelOption {
  label: string;
  value: string;
  /** 输入价格，单位：元/百万 token */
  inputPrice: number;
  /** 输出价格，单位：元/百万 token */
  outputPrice: number;
  /** 上下文长度（token） */
  contextLength: number;
  description: string;
  image: { width: string; height: string };
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

/** 各厂商模型数据表（输入/输出价格单位：元/百万 token，$1 ≈ ¥7.2，免费模型排前面） */
const VENDOR_MODELS: Record<string, VendorModelOption[]> = {
  openai: [
    // 按价格从低到高排列
    { label: "GPT-4.1 Nano", value: "gpt-4.1-nano", inputPrice: 0.72, outputPrice: 2.88, contextLength: 128000, description: "最轻量最便宜，适合高频简单任务", image: AI_IMG },
    { label: "GPT-4.1 Mini", value: "gpt-4.1-mini", inputPrice: 2.88, outputPrice: 11.52, contextLength: 128000, description: "均衡性价比，能力与速度兼顾", image: AI_IMG },
    { label: "GPT-4o Mini", value: "gpt-4o-mini", inputPrice: 1.08, outputPrice: 4.32, contextLength: 128000, description: "轻量版 GPT-4o，日常任务首选", image: AI_IMG },
    { label: "GPT-4o", value: "gpt-4o", inputPrice: 18, outputPrice: 72, contextLength: 128000, description: "旗舰多模态模型，支持图文理解", image: AI_IMG },
    { label: "GPT-5", value: "gpt-5", inputPrice: 9, outputPrice: 72, contextLength: 128000, description: "最新旗舰模型，综合能力最强", image: AI_IMG },
    { label: "o4-mini", value: "o4-mini", inputPrice: 7.92, outputPrice: 31.68, contextLength: 128000, description: "推理增强模型，适合复杂逻辑和数学", image: AI_IMG },
  ],
  deepseek: [
    // DeepSeek-V3.2 官方价格：输入 $0.28/M，输出 $0.42/M（cache miss）
    { label: "DeepSeek-V3.2（Chat）", value: "deepseek-chat", inputPrice: 2.02, outputPrice: 3.02, contextLength: 128000, description: "DeepSeek 最新旗舰 V3.2，综合能力强，国内访问友好", image: AI_IMG },
    { label: "DeepSeek-V3.2（Reasoner）", value: "deepseek-reasoner", inputPrice: 2.02, outputPrice: 3.02, contextLength: 128000, description: "V3.2 深度思考模式，擅长数学、代码、逻辑推理", image: AI_IMG },
  ],
  qwen: [
    // 通义千问：每天 2000 次免费调用，超出后按量计费
    { label: "Qwen-Turbo（每日免费）", value: "qwen-turbo", inputPrice: 0.3, outputPrice: 0.6, contextLength: 131072, description: "轻量快速版，每日 2000 次免费，适合简单任务", image: AI_IMG },
    { label: "Qwen-Plus", value: "qwen-plus", inputPrice: 0.8, outputPrice: 2, contextLength: 131072, description: "均衡性价比，长上下文支持，适合大多数场景", image: AI_IMG },
    { label: "Qwen-Max", value: "qwen-max", inputPrice: 2.4, outputPrice: 9.6, contextLength: 32000, description: "通义千问旗舰模型，综合能力最强", image: AI_IMG },
    { label: "Qwen3-235B-A22B", value: "qwen3-235b-a22b", inputPrice: 3.6, outputPrice: 14.4, contextLength: 131072, description: "Qwen3 最强 MoE 旗舰，235B 参数 22B 激活", image: AI_IMG },
  ],
  siliconflow: [
    // 硅基流动：小参数量开源模型免费，大模型按量计费
    { label: "Qwen2.5-7B-Instruct（免费）", value: "Qwen/Qwen2.5-7B-Instruct", inputPrice: 0, outputPrice: 0, contextLength: 131072, description: "阿里 Qwen2.5 7B，硅基流动免费托管", image: AI_IMG },
    { label: "GLM-4-9B-Chat（免费）", value: "THUDM/glm-4-9b-chat", inputPrice: 0, outputPrice: 0, contextLength: 128000, description: "智谱 GLM-4 9B，硅基流动免费托管", image: AI_IMG },
    { label: "DeepSeek-V3.2", value: "deepseek-ai/DeepSeek-V3", inputPrice: 2.09, outputPrice: 8.28, contextLength: 64000, description: "DeepSeek V3.2，硅基流动托管", image: AI_IMG },
    { label: "DeepSeek-R1", value: "deepseek-ai/DeepSeek-R1", inputPrice: 4.32, outputPrice: 21.6, contextLength: 64000, description: "DeepSeek R1 推理模型，硅基流动托管", image: AI_IMG },
    { label: "Qwen3-235B-A22B", value: "Qwen/Qwen3-235B-A22B", inputPrice: 3.6, outputPrice: 14.4, contextLength: 131072, description: "Qwen3 最强 MoE 旗舰，硅基流动托管", image: AI_IMG },
  ],
  zhipu: [
    // 免费模型排前面（Z.AI 官方定价，2026/03）
    { label: "GLM-4.7-Flash（免费）", value: "glm-4.7-flash", inputPrice: 0, outputPrice: 0, contextLength: 128000, description: "完全免费，最新 Flash 极速版，适合日常问答", image: AI_IMG },
    { label: "GLM-4.5-Flash（免费）", value: "glm-4.5-flash", inputPrice: 0, outputPrice: 0, contextLength: 128000, description: "完全免费，高性价比 Flash 版", image: AI_IMG },
    { label: "GLM-4.5-Air", value: "glm-4.5-air", inputPrice: 1.44, outputPrice: 7.92, contextLength: 128000, description: "轻量高效版，性价比高", image: AI_IMG },
    { label: "GLM-4.7", value: "glm-4.7", inputPrice: 4.32, outputPrice: 15.84, contextLength: 128000, description: "新一代旗舰，综合能力强", image: AI_IMG },
    { label: "GLM-4.5", value: "glm-4.5", inputPrice: 4.32, outputPrice: 15.84, contextLength: 128000, description: "均衡旗舰，长上下文支持", image: AI_IMG },
    { label: "GLM-5", value: "glm-5", inputPrice: 7.2, outputPrice: 23.04, contextLength: 128000, description: "最新超级旗舰，综合能力最强", image: AI_IMG },
  ],
  moonshot: [
    // Kimi 最新模型排前面（2026/03）
    { label: "Kimi-K2.5（旗舰）", value: "kimi-k2.5", inputPrice: 4.32, outputPrice: 21.6, contextLength: 256000, description: "Kimi 最新旗舰，256k 超长上下文，综合能力最强", image: AI_IMG },
    { label: "Kimi-K2-Thinking", value: "kimi-k2-thinking", inputPrice: 4.32, outputPrice: 18, contextLength: 128000, description: "Kimi 推理增强版，深度思考模式", image: AI_IMG },
    { label: "moonshot-v1-8k", value: "moonshot-v1-8k", inputPrice: 0.86, outputPrice: 0.86, contextLength: 8000, description: "Kimi 标准版，8k 上下文，适合短文本任务", image: AI_IMG },
    { label: "moonshot-v1-32k", value: "moonshot-v1-32k", inputPrice: 1.73, outputPrice: 1.73, contextLength: 32000, description: "Kimi 长文版，32k 上下文，适合长文档处理", image: AI_IMG },
    { label: "moonshot-v1-128k", value: "moonshot-v1-128k", inputPrice: 4.32, outputPrice: 4.32, contextLength: 128000, description: "Kimi 超长版，128k 上下文，支持超长文档", image: AI_IMG },
  ],
};

/** 根据当前厂商返回对应模型列表 */
const currentVendorModels = computed<VendorModelOption[]>(() => {
  const vendor = props.settings.aiChatVendor as string;
  return VENDOR_MODELS[vendor] ?? [];
});

/** 格式化价格显示（0 显示"免费"） */
function formatPrice(price: number): string {
  return price === 0 ? "免费" : `¥${price}`;
}

/** 格式化上下文长度 */
function formatContext(len: number): string {
  return len >= 1000 ? `${(len / 1000).toFixed(0)}k` : `${len}`;
}

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
// vendor 配置分组卡片：圆角背景包裹厂商/模型/APIKey/URL
.ai-vendor-card {
  margin: 4px 0 6px;
  padding: 16px;
  background: var(--el-fill-color-light);
  border-radius: 12px;
  border: 1px solid var(--el-border-color-extra-light);
  display: flex;
  flex-direction: column;
  gap: 14px;

  .dark & {
    background: rgba(0, 0, 0, 0.2);
    border-color: var(--el-border-color);
  }
}

// 字段行：label 在上，控件在下（全宽自适应）
.ai-field-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  border-bottom: 1px solid var(--el-border-color-extra-light);
  transition: background 0.2s ease;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: var(--el-color-primary-light-9);
  }

  .dark & {
    background: rgba(0, 0, 0, 0.15);

    &:hover {
      background: var(--el-color-primary-light-8);
    }
  }
}

// 字段标签行
.ai-field-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  line-height: 1.4;
}

// 字段辅助说明
.ai-field-hint {
  font-size: 11px;
  font-weight: 400;
  color: var(--el-text-color-placeholder);
}

// 厂商模型下拉选项：名称 + 价格两行布局
.vendor-model-option {
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 100%;

  .vendor-model-name {
    font-size: 13px;
    font-weight: 500;
    color: var(--el-text-color-primary);
    line-height: 1.4;
  }

  .vendor-model-price {
    font-size: 11px;
    color: var(--el-text-color-placeholder);
    line-height: 1.3;
  }
}
</style>
