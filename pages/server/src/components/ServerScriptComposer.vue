<template>
  <article class="server-script-composer">
    <header class="server-script-composer__header">
      <div class="server-script-composer__title">
        <strong>{{ title }}</strong>
        <p v-if="description">{{ description }}</p>
      </div>
      <div class="server-script-composer__meta">
        <span v-if="spiLabel" class="server-script-composer__chip">
          {{ spiLabel }}
        </span>
        <el-tooltip :content="aiTooltipText">
          <el-button
            circle
            plain
            :disabled="!canGenerateAi"
            @click="emit('generate-ai')"
          >
            <IconifyIconOnline icon="ri:ai-generate-2" />
          </el-button>
        </el-tooltip>
      </div>
    </header>

    <div v-if="shortcuts.length" class="server-script-composer__toolbar">
      <span class="server-script-composer__toolbar-label">快捷片段</span>
      <el-button
        v-for="item in shortcuts"
        :key="item.key"
        plain
        size="small"
        @click="applyShortcut(item)"
      >
        {{ item.label }}
      </el-button>
    </div>

    <ScAiTextarea
      :model-value="modelValue"
      :rows="rows"
      :placeholder="placeholder"
      :ai-enabled="aiEnabled"
      :provider-label="spiLabel"
      :ai-tooltip="aiTooltipText"
      :task-title="`AI 脚本生成 · ${title}`"
      :language="language"
      :context="aiContext"
      :build-prompt="buildPrompt"
      :system-prompt="systemPrompt"
      @update:model-value="emit('update:modelValue', $event)"
    />
  </article>
</template>

<script setup lang="ts">
import { computed } from "vue";
import ScAiTextarea, {
  type ScAiTextareaPayload,
} from "@repo/components/ScAiTextarea";

export interface ServerScriptShortcut {
  key: string;
  label: string;
  snippet: string;
  mode?: "append" | "replace";
}

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    title: string;
    description?: string;
    placeholder?: string;
    rows?: number;
    shortcuts?: ServerScriptShortcut[];
    spiLabel?: string;
    canGenerateAi?: boolean;
    aiEnabled?: boolean;
    aiUnavailableReason?: string;
    aiTooltip?: string;
    aiContext?: Record<string, unknown>;
    language?: string;
  }>(),
  {
    modelValue: "",
    description: "",
    placeholder: "",
    rows: 6,
    shortcuts: () => [],
    spiLabel: "",
    canGenerateAi: false,
    aiEnabled: false,
    aiUnavailableReason: "",
    aiTooltip: "",
    aiContext: () => ({}),
    language: "shell",
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: string];
  "generate-ai": [];
}>();

const aiTooltipText = computed(() => {
  if (props.aiTooltip) {
    return props.aiTooltip;
  }
  if (props.canGenerateAi) {
    return "使用 AI 生成或补全当前脚本";
  }
  if (!props.aiEnabled) {
    return props.aiUnavailableReason || "AI 能力未激活";
  }
  return "请先保存服务，再调用 AI 生成脚本";
});

const systemPrompt = computed(
  () =>
    `你是一个专业的中文运维与发布工程师，擅长编写 ${props.language} 脚本、服务脚本和项目运维脚本。输出必须可直接写入编辑器，不要返回 Markdown 代码块。`,
);

const buildPrompt = (payload: ScAiTextareaPayload) => {
  const scope = `${props.title}${props.description ? `，${props.description}` : ""}`;
  return [
    `请为“${scope}”生成 ${props.language} 内容。`,
    `执行通道：${props.spiLabel || "SPI 自动路由（本机 / SSH / WinRM）"}`,
    payload.instruction
      ? `额外要求：${payload.instruction}`
      : "额外要求：请优先使用稳妥的运维命令，并保留必要注释。",
    payload.context
      ? `上下文：\n${JSON.stringify(payload.context, null, 2)}`
      : "",
    payload.content ? `当前脚本：\n${payload.content}` : "当前脚本为空。",
    payload.mode === "append"
      ? "输出要求：仅返回需要追加的新片段，不要重复已有内容。"
      : "输出要求：返回完整脚本，用于直接覆盖当前编辑器内容。",
    "请结合服务启动、停止、初始化、配置、日志等真实场景处理路径、权限、进程与错误输出。",
  ]
    .filter(Boolean)
    .join("\n\n");
};

const applyShortcut = (shortcut: ServerScriptShortcut) => {
  const current = String(props.modelValue || "");
  const snippet = shortcut.snippet.trim();
  if (!snippet) {
    return;
  }
  if (shortcut.mode === "replace") {
    emit("update:modelValue", snippet);
    return;
  }
  const next = [current.trim(), snippet].filter(Boolean).join("\n");
  emit("update:modelValue", next);
};
</script>

<style scoped lang="scss">
.server-script-composer {
  display: grid;
  gap: 10px;
  padding: 14px;
  border-radius: 18px;
  background: color-mix(in srgb, var(--el-bg-color-page) 84%, white);
  border: 1px solid color-mix(in srgb, var(--el-border-color) 72%, transparent);
}

.server-script-composer__header,
.server-script-composer__meta,
.server-script-composer__toolbar {
  display: flex;
  align-items: center;
}

.server-script-composer__header {
  justify-content: space-between;
  gap: 10px;
}

.server-script-composer__title {
  min-width: 0;
}

.server-script-composer__title strong {
  display: block;
  color: var(--el-text-color-primary);
}

.server-script-composer__title p {
  margin: 4px 0 0;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.55;
}

.server-script-composer__meta {
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.server-script-composer__toolbar {
  gap: 8px;
  flex-wrap: wrap;
}

.server-script-composer__toolbar-label,
.server-script-composer__chip {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--el-fill-color-light) 88%, white);
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
</style>
