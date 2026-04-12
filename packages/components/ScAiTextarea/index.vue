<template>
  <div class="sc-ai-textarea" :class="{ 'is-disabled': disabled }">
    <div
      v-if="showToolbar && (showInstruction || templates.length || allowAppend)"
      class="sc-ai-textarea__toolbar"
    >
      <div class="sc-ai-textarea__toolbar-main">
        <div v-if="templates.length" class="sc-ai-textarea__templates">
          <el-button
            v-for="item in templates"
            :key="item.key"
            plain
            size="small"
            @click="applyTemplate(item)"
          >
            {{ item.label }}
          </el-button>
        </div>
        <ScInput
          v-if="showInstruction"
          v-model="instruction"
          class="sc-ai-textarea__instruction"
          :placeholder="instructionPlaceholder"
          clearable
        />
      </div>

      <div class="sc-ai-textarea__toolbar-actions">
        <span v-if="resolvedProviderLabel" class="sc-ai-textarea__chip">
          {{ resolvedProviderLabel }}
        </span>

        <el-tooltip :content="replaceTooltip">
          <el-button
            circle
            plain
            size="small"
            :loading="generating && generateMode === 'replace'"
            :disabled="!canUseAi"
            @click="runAi('replace')"
          >
            <IconifyIconOnline icon="ri:ai-generate-2" />
          </el-button>
        </el-tooltip>

        <el-tooltip v-if="allowAppend" content="让 AI 在当前内容后继续补充">
          <el-button
            circle
            plain
            size="small"
            :loading="generating && generateMode === 'append'"
            :disabled="!canUseAi"
            @click="runAi('append')"
          >
            <IconifyIconOnline icon="ri:add-line" />
          </el-button>
        </el-tooltip>
      </div>
    </div>

    <ScInput
      v-model="currentValue"
      type="textarea"
      class="sc-ai-textarea__editor"
      :disabled="disabled"
      :placeholder="placeholder"
      :rows="rows"
      :autosize="autosize"
      :maxlength="maxlength"
      :show-word-limit="showWordLimit"
    />

    <div
      v-if="statusLine"
      class="sc-ai-textarea__status"
      :class="{ 'is-error': Boolean(lastError) }"
    >
      {{ statusLine }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import { useGlobal } from "@pureadmin/utils";
import { taskCenterProvider } from "@layout/default";
import { getConfig } from "@repo/config";
import { aesDecrypt } from "@repo/utils";
import { IconifyIconOnline } from "../ReIcon";
import ScInput from "../ScInput/index.vue";

type GenerateMode = "replace" | "append";
type AiMode = "vendor" | "chrome" | "webllm";

export interface ScAiTextareaTemplate {
  key: string;
  label: string;
  content: string;
  mode?: GenerateMode;
}

export interface ScAiTextareaPayload {
  mode: GenerateMode;
  instruction: string;
  content: string;
  prompt: string;
  systemPrompt: string;
  language: string;
  context?: Record<string, unknown>;
}

interface Props {
  modelValue?: string;
  placeholder?: string;
  disabled?: boolean;
  rows?: number;
  autosize?: boolean | { minRows?: number; maxRows?: number };
  maxlength?: string | number;
  showWordLimit?: boolean;
  showToolbar?: boolean;
  showInstruction?: boolean;
  instructionPlaceholder?: string;
  defaultInstruction?: string;
  language?: string;
  context?: Record<string, unknown>;
  systemPrompt?: string;
  promptTemplate?: string;
  aiEnabled?: boolean;
  providerMode?: "auto" | "settings" | "url";
  providerLabel?: string;
  allowAppend?: boolean;
  clearInstructionOnSuccess?: boolean;
  aiTooltip?: string;
  taskTitle?: string;
  templates?: ScAiTextareaTemplate[];
  url?: (payload: ScAiTextareaPayload) => Promise<unknown>;
  requestParser?: (response: unknown) => string;
  buildPrompt?: (payload: ScAiTextareaPayload) => string;
}

interface ResolvedAiConfig {
  enabled: boolean;
  mode: AiMode;
  vendor: string;
  apiKey: string;
  apiUrl: string;
  model: string;
  reason: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: "",
  placeholder: "",
  disabled: false,
  rows: 8,
  autosize: false,
  maxlength: undefined,
  showWordLimit: false,
  showToolbar: true,
  showInstruction: true,
  instructionPlaceholder: "告诉 AI 你要生成、修复或补全什么",
  defaultInstruction: "",
  language: "shell",
  context: () => ({}),
  systemPrompt: "",
  promptTemplate: "",
  aiEnabled: undefined,
  providerMode: "auto",
  providerLabel: "",
  allowAppend: true,
  clearInstructionOnSuccess: false,
  aiTooltip: "",
  taskTitle: "AI 内容生成",
  templates: () => [],
  url: undefined,
  requestParser: undefined,
  buildPrompt: undefined,
});

const emit = defineEmits<{
  "update:modelValue": [value: string];
  "ai-start": [payload: ScAiTextareaPayload];
  "ai-result": [
    result: {
      payload: ScAiTextareaPayload;
      text: string;
      response: unknown;
    },
  ];
  "ai-error": [error: Error];
}>();

const { $storage } = useGlobal<GlobalPropertiesApi>();

const instruction = ref(props.defaultInstruction);
const generating = ref(false);
const generateMode = ref<GenerateMode>("replace");
const lastError = ref("");
const lastSuccess = ref("");
const lastProviderInfo = ref("");

watch(
  () => props.defaultInstruction,
  (value) => {
    instruction.value = value || "";
  },
);

const currentValue = computed({
  get: () => props.modelValue || "",
  set: (value: string) => emit("update:modelValue", value),
});

const decryptSensitive = (value: unknown) =>
  aesDecrypt(String(value || ""), getConfig().StorageKey);

const resolveStoredAiConfig = (): ResolvedAiConfig => {
  const config = (($storage?.configure || {}) as Record<string, unknown>) || {};
  const aiEnabled =
    typeof props.aiEnabled === "boolean"
      ? props.aiEnabled
      : config.aiChatEnabled !== false;
  const rawMode = String(config.aiChatMode || "").trim();
  const mode: AiMode =
    rawMode === "chrome"
      ? "chrome"
      : rawMode === "webllm"
        ? "webllm"
        : "vendor";
  const vendor = String(config.aiChatVendor || "custom").trim() || "custom";
  const apiKey = decryptSensitive(config.aiChatApiKey);
  const apiUrl = decryptSensitive(config.aiChatApiUrl);
  const model = String(config.aiChatModel || "").trim() || "gpt-4o-mini";

  if (!aiEnabled) {
    return {
      enabled: false,
      mode,
      vendor,
      apiKey,
      apiUrl,
      model,
      reason: "系统设置中的 AI 能力未开启",
    };
  }

  if (mode === "vendor" && !apiUrl) {
    return {
      enabled: false,
      mode,
      vendor,
      apiKey,
      apiUrl,
      model,
      reason: "系统设置未配置 AI API URL",
    };
  }

  return {
    enabled: true,
    mode,
    vendor,
    apiKey,
    apiUrl,
    model,
    reason: "",
  };
};

const resolvedProviderMode = computed(() => {
  if (props.providerMode === "url") {
    return "url";
  }
  if (props.providerMode === "settings") {
    return "settings";
  }
  return typeof props.url === "function" ? "url" : "settings";
});

const resolvedSettings = computed(() => resolveStoredAiConfig());

const canUseAi = computed(() => {
  if (props.disabled || generating.value) {
    return false;
  }
  if (resolvedProviderMode.value === "url") {
    return typeof props.url === "function";
  }
  return resolvedSettings.value.enabled;
});

const resolvedProviderLabel = computed(() => {
  if (props.providerLabel) {
    return props.providerLabel;
  }
  if (resolvedProviderMode.value === "url") {
    return "接口 AI";
  }
  const settings = resolvedSettings.value;
  if (!settings.enabled) {
    return "系统 AI";
  }
  if (settings.mode === "chrome") {
    return "Chrome AI";
  }
  if (settings.mode === "webllm") {
    return `WebLLM · ${settings.model}`;
  }
  return `${settings.vendor || "custom"} · ${settings.model}`;
});

const replaceTooltip = computed(() => {
  if (props.aiTooltip) {
    return props.aiTooltip;
  }
  if (!canUseAi.value) {
    return resolvedProviderMode.value === "url"
      ? "未提供可用的 AI 请求函数"
      : resolvedSettings.value.reason || "AI 当前不可用";
  }
  return "使用 AI 覆盖当前内容";
});

const statusLine = computed(() => {
  if (lastError.value) {
    return lastError.value;
  }
  if (lastSuccess.value) {
    return lastSuccess.value;
  }
  return resolvedProviderMode.value === "settings" &&
    !resolvedSettings.value.enabled
    ? resolvedSettings.value.reason
    : "";
});

const stringifyContext = (context?: Record<string, unknown>) => {
  if (!context || !Object.keys(context).length) {
    return "";
  }
  try {
    return JSON.stringify(context, null, 2);
  } catch {
    return String(context);
  }
};

const buildDefaultPrompt = (payload: ScAiTextareaPayload) => {
  const contextText = stringifyContext(payload.context);
  return [
    props.promptTemplate ||
      `你是专业的服务器运维与自动化工程师，请生成可直接写入编辑器的 ${payload.language} 内容。`,
    payload.instruction
      ? `用户要求：${payload.instruction}`
      : "用户要求：请基于上下文生成一份稳妥、可执行、可维护的内容。",
    contextText ? `上下文：\n${contextText}` : "",
    payload.content ? `当前内容：\n${payload.content}` : "当前内容为空。",
    payload.mode === "append"
      ? "输出要求：请仅返回需要追加的新内容，不要重复已有内容。"
      : "输出要求：请返回完整内容，直接覆盖当前编辑器内容。",
    "不要返回 Markdown 代码块，不要解释过程，只返回最终可写入内容。",
  ]
    .filter(Boolean)
    .join("\n\n");
};

const buildPayload = (mode: GenerateMode): ScAiTextareaPayload => {
  const payload: ScAiTextareaPayload = {
    mode,
    instruction: instruction.value.trim(),
    content: currentValue.value,
    prompt: "",
    systemPrompt:
      props.systemPrompt ||
      "你是一个严谨的中文运维与脚本生成助手，输出必须可直接执行或直接写入。",
    language: props.language,
    context: props.context,
  };
  payload.prompt = props.buildPrompt
    ? props.buildPrompt(payload)
    : buildDefaultPrompt(payload);
  return payload;
};

const normalizeAiText = (response: unknown) => {
  if (props.requestParser) {
    return props.requestParser(response).trim();
  }
  if (typeof response === "string") {
    return response.trim();
  }
  if (!response || typeof response !== "object") {
    return "";
  }
  const objectResponse = response as Record<string, any>;
  const dataResponse =
    objectResponse.data && typeof objectResponse.data === "object"
      ? (objectResponse.data as Record<string, any>)
      : undefined;
  const asyncAccepted =
    objectResponse.taskId ||
    objectResponse.requestId ||
    dataResponse?.taskId ||
    dataResponse?.requestId;
  const directTextCandidates = [
    objectResponse.content,
    objectResponse.text,
    objectResponse.result,
    objectResponse.answer,
    dataResponse?.content,
    dataResponse?.text,
    dataResponse?.result,
    dataResponse?.answer,
  ];
  if (
    asyncAccepted &&
    !directTextCandidates.some(
      (item) => typeof item === "string" && item.trim(),
    )
  ) {
    return "";
  }
  const candidates = [
    objectResponse.content,
    objectResponse.text,
    objectResponse.result,
    objectResponse.answer,
    dataResponse?.content,
    dataResponse?.text,
    dataResponse?.message,
    dataResponse?.result,
    dataResponse?.answer,
  ];
  const hit = candidates.find(
    (item) => typeof item === "string" && item.trim(),
  );
  return typeof hit === "string" ? hit.trim() : "";
};

const createTaskRequestId = () =>
  `sc-ai-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const resolveResponseTaskMeta = (response: unknown) => {
  if (!response || typeof response !== "object") {
    return {
      requestId: undefined as string | number | undefined,
      message: "",
    };
  }
  const objectResponse = response as Record<string, any>;
  const dataResponse =
    objectResponse.data && typeof objectResponse.data === "object"
      ? (objectResponse.data as Record<string, any>)
      : undefined;
  const requestId =
    objectResponse.taskId ||
    objectResponse.requestId ||
    dataResponse?.taskId ||
    dataResponse?.requestId;
  const message = [
    objectResponse.msg,
    objectResponse.message,
    dataResponse?.msg,
    dataResponse?.message,
  ].find((item) => typeof item === "string" && item.trim());
  return {
    requestId:
      typeof requestId === "string" || typeof requestId === "number"
        ? requestId
        : undefined,
    message: typeof message === "string" ? message.trim() : "",
  };
};

const normalizeWebLlmModel = (model: string) => {
  const normalized = model.trim();
  if (!normalized || normalized.includes("-MLC")) {
    return "Qwen/Qwen2.5-1.5B-Instruct";
  }
  return normalized;
};

const requestByChrome = async (payload: ScAiTextareaPayload) => {
  const chromeAi = (window as any).ai;
  if (!chromeAi?.languageModel) {
    throw new Error("当前浏览器未提供 Chrome AI 能力");
  }
  const session = await chromeAi.languageModel.create({
    systemPrompt: payload.systemPrompt,
  });
  const reply = await session.prompt(payload.prompt);
  return String(reply || "").trim();
};

const requestByOpenAiCompat = async (
  payload: ScAiTextareaPayload,
  config: ResolvedAiConfig,
) => {
  const response = await fetch(config.apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
    },
    body: JSON.stringify({
      model: config.model || "gpt-4o-mini",
      messages: [
        { role: "system", content: payload.systemPrompt },
        { role: "user", content: payload.prompt },
      ],
      temperature: 0.2,
      max_tokens: 2048,
      stream: false,
    }),
  });
  if (!response.ok) {
    const errorPayload = await response.json().catch(() => ({}));
    throw new Error(
      String(
        errorPayload?.error?.message ||
          errorPayload?.message ||
          `AI 请求失败: ${response.status}`,
      ),
    );
  }
  const data = await response.json().catch(() => ({}));
  return String(data?.choices?.[0]?.message?.content || "").trim();
};

const requestByHuggingFace = async (
  payload: ScAiTextareaPayload,
  config: ResolvedAiConfig,
) => {
  const targetModel = normalizeWebLlmModel(config.model);
  const url =
    config.apiUrl ||
    `https://api-inference.huggingface.co/models/${targetModel}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
    },
    body: JSON.stringify({
      inputs: payload.prompt,
      parameters: {
        max_new_tokens: 1024,
        temperature: 0.2,
        return_full_text: false,
      },
    }),
  });
  if (!response.ok) {
    const errorPayload = await response.json().catch(() => ({}));
    throw new Error(
      String(
        errorPayload?.error || errorPayload?.message || "WebLLM/HF 请求失败",
      ),
    );
  }
  const data = await response.json().catch(() => ({}));
  if (Array.isArray(data)) {
    return String(data[0]?.generated_text || data[0]?.text || "").trim();
  }
  return String(data?.generated_text || data?.text || "").trim();
};

const requestFromSettings = async (payload: ScAiTextareaPayload) => {
  const config = resolvedSettings.value;
  if (!config.enabled) {
    throw new Error(config.reason || "AI 当前不可用");
  }
  if (config.mode === "chrome") {
    return requestByChrome(payload);
  }
  if (config.mode === "webllm") {
    return requestByHuggingFace(payload, config);
  }
  return requestByOpenAiCompat(payload, config);
};

const applyTemplate = (item: ScAiTextareaTemplate) => {
  const content = item.content.trim();
  if (!content) {
    return;
  }
  currentValue.value =
    item.mode === "append" && currentValue.value.trim()
      ? `${currentValue.value.trimEnd()}\n${content}`
      : content;
};

const runAi = async (mode: GenerateMode) => {
  if (!canUseAi.value) {
    return;
  }
  generating.value = true;
  generateMode.value = mode;
  lastError.value = "";
  const localRequestId = createTaskRequestId();
  const task = taskCenterProvider.addTask({
    requestId: localRequestId,
    title:
      props.taskTitle || (mode === "append" ? "AI 追加内容" : "AI 生成内容"),
    description: resolvedProviderLabel.value || undefined,
    mode: "stream",
    status: "running",
    progress: 20,
    message: mode === "append" ? "正在请求 AI 追加内容" : "正在请求 AI 生成内容",
  });
  try {
    const payload = buildPayload(mode);
    emit("ai-start", payload);
    const response =
      resolvedProviderMode.value === "url" && typeof props.url === "function"
        ? await props.url(payload)
        : await requestFromSettings(payload);
    const responseTaskMeta = resolveResponseTaskMeta(response);
    if (
      responseTaskMeta.requestId &&
      String(responseTaskMeta.requestId) !== String(localRequestId)
    ) {
      task.update({
        requestId: responseTaskMeta.requestId,
        title:
          props.taskTitle ||
          (mode === "append" ? "AI 追加内容" : "AI 生成内容"),
      });
    }
    const text = normalizeAiText(response);
    if (!text) {
      if (responseTaskMeta.requestId || responseTaskMeta.message) {
        const acceptedMessage =
          responseTaskMeta.message || "AI 任务已提交，等待后台处理";
        lastProviderInfo.value = resolvedProviderLabel.value;
        lastSuccess.value = `${acceptedMessage}${
          lastProviderInfo.value ? ` · ${lastProviderInfo.value}` : ""
        }`;
        task.progress(45, {
          message: acceptedMessage,
        });
        ElMessage.success(acceptedMessage);
        emit("ai-result", { payload, text: "", response });
        return;
      }
      throw new Error("AI 未返回可写入内容");
    }

    currentValue.value =
      mode === "append" && currentValue.value.trim()
        ? `${currentValue.value.trimEnd()}\n${text}`
        : text;

    if (props.clearInstructionOnSuccess) {
      instruction.value = "";
    }

    lastProviderInfo.value = resolvedProviderLabel.value;
    lastSuccess.value = `${mode === "append" ? "AI 已追加内容" : "AI 已更新内容"}${
      lastProviderInfo.value ? ` · ${lastProviderInfo.value}` : ""
    }`;
    task.success({
      progress: 100,
      message: mode === "append" ? "AI 已追加内容" : "AI 已生成内容",
    });
    ElMessage.success(mode === "append" ? "AI 已追加内容" : "AI 已生成内容");
    emit("ai-result", { payload, text, response });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    lastSuccess.value = "";
    lastError.value = err.message;
    task.error({
      message: err.message,
    });
    emit("ai-error", err);
    ElMessage.error(err.message);
  } finally {
    generating.value = false;
  }
};
</script>

<style scoped lang="scss">
.sc-ai-textarea {
  display: grid;
  gap: 10px;
}

.sc-ai-textarea__toolbar,
.sc-ai-textarea__toolbar-main,
.sc-ai-textarea__toolbar-actions,
.sc-ai-textarea__templates {
  display: flex;
  align-items: center;
}

.sc-ai-textarea__toolbar {
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.sc-ai-textarea__toolbar-main {
  gap: 10px;
  flex: 1 1 420px;
  min-width: 0;
  flex-wrap: wrap;
}

.sc-ai-textarea__templates {
  gap: 8px;
  flex-wrap: wrap;
}

.sc-ai-textarea__toolbar-actions {
  gap: 8px;
  flex-wrap: wrap;
}

.sc-ai-textarea__instruction {
  min-width: min(100%, 280px);
  flex: 1 1 260px;
}

.sc-ai-textarea__chip {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--el-fill-color-light) 88%, white);
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.sc-ai-textarea__status {
  padding: 0 2px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.5;
}

.sc-ai-textarea__status.is-error {
  color: var(--el-color-danger);
}

@media (max-width: 768px) {
  .sc-ai-textarea__toolbar {
    align-items: stretch;
  }

  .sc-ai-textarea__toolbar-main,
  .sc-ai-textarea__toolbar-actions {
    width: 100%;
  }

  .sc-ai-textarea__toolbar-actions {
    justify-content: flex-end;
  }
}
</style>
