<script setup lang="ts">
/**
 * AI 对话设置分区（瘦身版）—— 经 src/koi/contribution.ts 注册进主题配置抽屉。
 *
 * <p>只保留三项用户可操作配置：</p>
 * <ul>
 *   <li><b>对话模型</b>：来自模型管理（GET /api/providers，capabilities[].task === 'chat'
 *       过滤）。选中后写入 localStorage（providerId + modelId + platform），
 *       供悬浮球经 chatModelResolver 读取并按 platform 分发本地 / 远端；
 *       会话页仍以模型管理的目录为唯一真相源。</li>
 *   <li><b>助手皮肤</b>：aiChatSkin（default / 预设渐变名 / http(s) 图片地址）。</li>
 *   <li><b>悬浮球开关</b>：aiChatEnabled（yaml other.aiChat.enable 已在注册表
 *       visible 里决定「允不允许」，这里只是用户开关）。</li>
 * </ul>
 *
 * <p>旧版分区里的 vendor / API Key / maxTokens / temperature / 上下文压缩等配置
 * 已全部移除：模型与凭据统一由模型管理维护，推理参数由各引擎取默认值
 * （配置字段在 @repo/config 保留并标记 @deprecated，旧 yaml 不报错）。</p>
 */
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { ChatDotRound } from "@element-plus/icons-vue";
import { getConfig, getStorageKey } from "@repo/config";
import { isFrontendModelPlatform, resolveModelPlatform } from "@/utils/modelPlatform";
import ReSelect from "@repo/ui/re-select";
import ReSwitch from "@repo/ui/re-switch";
import type { ReOption } from "@repo/ui/re-select";
import { apiService } from "@/services/ApiService";

const { t } = useI18n();

const appConfig = getConfig();
const aiChat = computed(() => appConfig.other.aiChat);

/** 与 contribution.ts 的 chatModelResolver 共用的持久化键 */
const SELECTED_MODEL_KEY = getStorageKey("ai-chat-selected-model");

/** 模型选项：在 ReOption 上携带分发所需的最小模型档案 */
interface ChatModelOption extends ReOption {
  /** 供应商 id */
  providerId: string;
  /** 裸模型名（发给后端 / webllm 引擎的 model 值；复合 id 里的后半段） */
  modelId: string;
  /** 平台：webllm 供应商 → webllm；其余取 provider.provider / protocol */
  platform: string;
}

const modelOptions = ref<ChatModelOption[]>([]);
const modelsLoading = ref(false);
const modelsLoadError = ref("");
/** 当前选中模型（复合键 providerId:modelId，与模型管理的 Model.id 同构） */
const selectedModelId = ref("");

/**
 * 判断模型是否可用于对话（与 ChatInput 同一口径）：
 * capabilities[].task === 'chat'；能力未声明的旧数据保守放行。
 */
function isChatCapableModel(model: any): boolean {
  const caps = model?.capabilities;
  if (Array.isArray(caps) && caps.length > 0) {
    return caps.some((c: any) => {
      if (c && typeof c === "object" && "task" in c) {
        return c.task === "chat";
      }
      return c === "chat";
    });
  }
  return true;
}

/**
 * 平台推导：统一走 @/utils/modelPlatform 的共享口径（前端本地平台、
 * provider.provider / protocol / platform 兜底），与会话页判定保持一致。
 */
function platformOf(providerId: string, provider: any): string {
  return resolveModelPlatform(providerId, provider);
}

/** 当前选中模型是否前端本地推理（浏览器内推理，MCP 等后端链路能力不可用） */
const selectedIsFrontend = computed(() => {
  const opt = modelOptions.value.find((o) => String(o.value) === String(selectedModelId.value));
  return !!(opt && isFrontendModelPlatform(String(opt.platform || "")));
});

/** 拉取模型管理里的可用对话模型（失败可重试：ReSelect 重新打开时再拉） */
async function loadModels() {
  if (modelsLoading.value) return;
  modelsLoading.value = true;
  modelsLoadError.value = "";
  try {
    const response = await apiService.fetchModels();
    const options: ChatModelOption[] = [];
    (response.items ?? []).forEach((provider: any) => {
      const providerId = String(provider?.id || provider?.provider_id || "");
      if (!providerId) return;
      const providerName = String(provider?.name || providerId);
      (provider?.models ?? [])
        .filter(isChatCapableModel)
        .forEach((model: any) => {
          const modelName = String(model?.modelName || model?.model || model?.id || "");
          if (!modelName) return;
          options.push({
            label: modelName,
            value: String(model?.id || `${providerId}:${modelName}`),
            description: providerName,
            group: providerName,
            image: provider?.avatarUrl,
            providerId,
            modelId: String(model?.model || modelName),
            platform: platformOf(providerId, provider),
          });
        });
    });
    modelOptions.value = options;
    // 回显已保存的选择（复合键能对上才回显，模型被删时静默清空由用户重选）
    if (!selectedModelId.value) {
      const saved = readSavedSelection();
      if (saved) {
        const hit = options.find(
          (o) => o.providerId === saved.providerId && o.modelId === saved.modelId,
        );
        if (hit) selectedModelId.value = String(hit.value);
      }
    }
  } catch (err) {
    modelsLoadError.value = err instanceof Error ? err.message : String(err);
  } finally {
    modelsLoading.value = false;
  }
}

/** 读 localStorage 里已保存的选中模型（与 contribution.ts 同一形状） */
function readSavedSelection(): { providerId?: string; modelId?: string } | null {
  try {
    const raw = localStorage.getItem(SELECTED_MODEL_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

/** 选中模型：更新本地值并持久化（悬浮球经 chatModelResolver 读取） */
function handleModelChange(val: string | number | (string | number)[] | null) {
  // ReSelect 的 update:modelValue 是联合类型（含多选数组/null）；本分区是单选，
  // 非单值直接忽略，保证签名与组件 emit 兼容（TS2322）
  if (val === null || Array.isArray(val)) return;
  const option = modelOptions.value.find((o) => String(o.value) === String(val));
  if (!option) return;
  selectedModelId.value = String(val);
  try {
    localStorage.setItem(
      SELECTED_MODEL_KEY,
      JSON.stringify({
        providerId: option.providerId,
        modelId: option.modelId,
        platform: option.platform,
      }),
    );
  } catch {
    /* 隐私模式 / 配额满：不影响本次会话内使用 */
  }
}

/** 助手皮肤预设（与 ReAiCharacter 的 presets 同一套 key） */
const skinOptions = computed<ReOption[]>(() => [
  { label: t("aiChat.skin.default"), value: "default" },
  { label: t("aiChat.skin.cat"), value: "cat" },
  { label: t("aiChat.skin.ocean"), value: "ocean" },
  { label: t("aiChat.skin.forest"), value: "forest" },
  { label: t("aiChat.skin.sunset"), value: "sunset" },
  { label: t("aiChat.skin.night"), value: "night" },
]);

onMounted(loadModels);
</script>

<template>
  <div class="config-section ai-chat-section">
    <div class="section-header">
      <el-icon :size="18" class="section-icon"><ChatDotRound /></el-icon>
      <span class="section-title">{{ t("aiChat.title") }}</span>
    </div>

    <div class="section-card">
      <!-- 对话模型：来自模型管理，选中后供会话与悬浮球按平台分发 -->
      <ReSelect
        layout="card"
        :data="modelOptions"
        :model-value="selectedModelId"
        :placeholder="t('aiChat.model.selectPlaceholder')"
        :title="t('aiChat.model.selectTitle')"
        :loading="modelsLoading"
        @update:model-value="handleModelChange"
      />
      <div v-if="modelsLoadError" class="ai-chat-section__error">
        {{ t("aiChat.model.loadFailed") }}：{{ modelsLoadError }}
      </div>
      <!-- 前端本地模型（浏览器内推理）提示：MCP 等后端链路能力不可用 -->
      <div v-if="selectedIsFrontend" class="ai-chat-section__hint">
        {{ t("aiChat.model.frontendHint") }}
      </div>

      <!-- 助手皮肤：默认 / 预设渐变 / 自定义图片 -->
      <ReSelect
        layout="card"
        :data="skinOptions"
        v-model="aiChat.aiChatSkin"
        :placeholder="t('aiChat.skin.placeholder')"
        :title="t('aiChat.skin.title')"
      />

      <!-- 悬浮球开关：页面右下角 AI 助手入口 -->
      <ReSwitch
        layout="card"
        :title="t('aiChat.enable')"
        :tip="t('aiChat.enableTip')"
        v-model="aiChat.aiChatEnabled"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
/* 分区卡片：与 ThemeConfig 面板内其它分区同视觉（自带样式，不依赖父组件作用域） */
.section-card {
  padding: 14px;
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;

  :deep(.re-switch-card) {
    margin-top: 10px;
  }

  :deep(.re-card-select__trigger) {
    margin-top: 12px;
  }

  :deep(.re-card-select__trigger:first-child) {
    margin-top: 0;
  }
}

html.dark .section-card {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.08);
}

/* 模型列表加载失败提示 */
.ai-chat-section__error {
  margin-top: 10px;
  font-size: 12px;
  color: var(--el-color-danger);
}

/* 前端本地模型提示：MCP 等后端链路能力不可用 */
.ai-chat-section__hint {
  margin-top: 10px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>
