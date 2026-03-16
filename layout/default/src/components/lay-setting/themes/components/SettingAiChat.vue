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
        <!-- 厂商设置 -->
        <div class="setting-item">
          <div class="setting-item-label">
            <span class="setting-item-desc">服务厂商</span>
          </div>
          <div class="setting-item-control">
            <ScSelect
              v-model="settings.aiChatVendor"
              layout="dropdown"
              :options="aiChatVendorOptions"
              width="260px"
              height="220px"
              dropdown-title="选择服务厂商"
              dropdown-placeholder="请选择厂商"
              @change="aiChatVendorChange"
            />
          </div>
        </div>

        <!-- 模型选择（仅 HF / hf-mirror 时显示） -->
        <div v-if="settings.aiChatVendor === 'hf'" class="setting-item">
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
              width="420px"
              height="260px"
              @change="aiChatModelChange"
            />
          </div>
        </div>

        <!-- API Key 设置 -->
        <div
          v-if="settings.aiChatVendor !== 'chrome'"
          class="setting-item"
        >
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
              style="max-width: 260px"
            />
          </div>
        </div>

        <!-- API URL 设置（Chrome 模式下不需要） -->
        <div
          v-if="settings.aiChatVendor !== 'chrome'"
          class="setting-item"
        >
          <div class="setting-item-label">
            <span>API URL</span>
          </div>
          <div class="setting-item-control">
            <ScInput
              v-model="settings.aiChatApiUrl"
              :placeholder="
                settings.aiChatVendor === 'hf'
                  ? '留空使用模型默认地址'
                  : '填模型提供的地址'
              "
              @change="aiChatApiUrlChange"
              style="max-width: 260px"
            />
          </div>
        </div>

        <!-- 机器人外观样式设置（含实时预览） -->
        <div class="setting-item">
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

/** AiChatAppearanceSetting 的 change 事件可能传入完整选项对象 */
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

/** AI 皮肤选项 */
const aiChatSkinOptions = computed(() => AI_APPEARANCE_OPTIONS);

/** AI 厂商选项 */
const aiChatVendorOptions = computed<Array<AiDropdownOption>>(() => [
  { label: "WebLLM（本地）", value: "hf", description: "使用 @mlc-ai/web-llm 在浏览器端本地运行大模型，无需服务器", image: AI_IMG },
  { label: "Chrome", value: "chrome", description: "使用 Chrome 浏览器内置 AI 能力（实验性）", image: AI_IMG },
  { label: "其它厂商", value: "other", description: "自定义第三方厂商，需要手动配置 API 信息", image: AI_IMG },
]);

/** WebLLM MLC 模型选项（浏览器端本地推理） */
const aiChatModelOptions = computed<Array<AiDropdownOption>>(() => [
  { label: "Qwen2.5-1.5B-Instruct（推荐）", value: "Qwen2.5-1.5B-Instruct-q4f16_1-MLC", description: "阿里 Qwen 1.5B MLC 量化版，体积小、加载快，适合入门", image: AI_IMG },
  { label: "Qwen2.5-3B-Instruct", value: "Qwen2.5-3B-Instruct-q4f16_1-MLC", description: "阿里 Qwen 3B MLC 量化版，能力更强，需要更多内存", image: AI_IMG },
  { label: "Llama-3.2-1B-Instruct", value: "Llama-3.2-1B-Instruct-q4f16_1-MLC", description: "Meta Llama 3.2 1B MLC 量化版，轻量场景适用", image: AI_IMG },
  { label: "Llama-3.2-3B-Instruct", value: "Llama-3.2-3B-Instruct-q4f16_1-MLC", description: "Meta Llama 3.2 3B MLC 量化版，综合能力较强", image: AI_IMG },
]);

interface Props {
  /** 全局 settings reactive 对象 */
  settings: Record<string, any>;
  /** 是否显示 AI 设置区域（来自 getConfig().ShowAiChat） */
  showAiChat?: boolean;
  /** AI 启用状态变更 */
  aiChatEnabledChange: (value: boolean) => void;
  /** AI API Key 变更 */
  aiChatApiKeyChange: (value: string) => void;
  /** AI API URL 变更 */
  aiChatApiUrlChange: (value: string) => void;
  /** AI 厂商变更 */
  aiChatVendorChange: (value: string | number | boolean) => void;
  /** AI 模型变更 */
  aiChatModelChange: (value: string | number | boolean) => void;
  /** AI 皮肤变更 */
  aiChatSkinChange: (value: string | number | boolean | SkinOptionsType) => void;
}

defineProps<Props>();
</script>
