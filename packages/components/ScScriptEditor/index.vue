<template>
  <div class="sc-script-editor">
    <button
      v-if="!titleVisible"
      class="sc-script-editor__preview"
      type="button"
      @click="openEditor"
    >
      <span class="sc-script-editor__preview-head">
        <slot name="label">
          <span class="sc-script-editor__label">{{ label }}</span>
        </slot>
        <span v-if="showLanguageToolbar" class="sc-script-editor__lang">{{ resolvedLanguageLabel }}</span>
      </span>
      <pre class="sc-script-editor__code"><code v-html="highlightedPreviewHtml" /></pre>
    </button>

    <div v-if="titleVisible" class="sc-script-editor__title-bar">
      <slot name="title">
        <span class="sc-script-editor__title-text">{{ label }}</span>
      </slot>
      <ScButton size="small" @click="openEditor">编辑</ScButton>
    </div>

    <ScDialog
      v-model="dialogVisible"
      :title="resolvedDialogTitle"
      width="1080px"
      append-to-body
      destroy-on-close
      @opened="refreshEditor"
    >
      <div class="sc-script-editor__toolbar">
        <div v-if="showLanguageToolbar" class="sc-script-editor__toolbar-item">
          <span class="toolbar-label">脚本语言</span>
          <ScSelect v-model="draftLanguage" style="width: 220px">
            <ElOption
              v-for="option in resolvedLanguageOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </ScSelect>
        </div>
        <div class="sc-script-editor__toolbar-item sc-script-editor__toolbar-item--search">
          <span class="toolbar-label">关键词高亮</span>
          <el-input
            v-model="localKeywordText"
            clearable
            placeholder="输入关键词，多个用空格或逗号分隔"
          />
        </div>
      </div>

      <ScCodeEditor
        ref="codeEditorRef"
        v-model="draftValue"
        :mode="resolvedMirrorMode"
        :theme="theme"
        :height="editorHeight"
        :keyword-highlights="resolvedKeywordHighlights"
        :options="editorOptions"
        class="sc-script-editor__mirror"
      />

      <template #footer>
        <ScButton @click="dialogVisible = false">取消</ScButton>
        <ScButton type="primary" @click="confirmEdit">保存</ScButton>
      </template>
    </ScDialog>
  </div>
</template>

<script setup lang="ts">
import { ElOption } from "element-plus";
import { computed, nextTick, ref, watch } from "vue";
import ScCodeEditor from "@repo/components/ScCodeEditor/index.vue";
import ScSelect from "@repo/components/ScSelect/src/index.vue";

type ScriptLanguageOption = {
  label: string;
  value: string;
  mode?: string;
};

const DEFAULT_LANGUAGE_OPTIONS: ScriptLanguageOption[] = [
  { label: "Shell / Bash", value: "shell", mode: "shell" },
  { label: "PowerShell", value: "powershell", mode: "shell" },
  { label: "Batch / CMD", value: "bat", mode: "shell" },
  { label: "Python", value: "python", mode: "python" },
  { label: "Node.js", value: "javascript", mode: "javascript" },
  { label: "SQL", value: "sql", mode: "sql" },
  { label: "YAML", value: "yaml", mode: "yaml" },
  { label: "Properties", value: "properties", mode: "properties" },
];

const props = withDefaults(defineProps<{
  modelValue?: string;
  label?: string;
  placeholder?: string;
  language?: string;
  languageOptions?: ScriptLanguageOption[];
  emptyText?: string;
  dialogTitle?: string;
  showLanguageToolbar?: boolean;
  previewLines?: number;
  keywordHighlights?: string[];
  keywordText?: string;
  theme?: string;
  editorHeight?: number | string;
  titleVisible?: boolean;
}>(), {
  modelValue: "",
  label: "脚本",
  placeholder: "",
  language: "shell",
  emptyText: "点击编辑脚本内容",
  dialogTitle: "",
  showLanguageToolbar: true,
  previewLines: 8,
  keywordText: "",
  theme: "darcula",
  editorHeight: 520,
  titleVisible: false,
});

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "update:language", value: string): void;
}>();

const dialogVisible = ref(false);
const draftValue = ref("");
const draftLanguage = ref(props.language || "shell");
const localKeywordText = ref(props.keywordText || "");
const codeEditorRef = ref<any>(null);

const resolvedLanguageOptions = computed(() =>
  props.languageOptions?.length ? props.languageOptions : DEFAULT_LANGUAGE_OPTIONS,
);

const currentLanguageOption = computed(() =>
  resolvedLanguageOptions.value.find((option) => option.value === draftLanguage.value) ||
  resolvedLanguageOptions.value.find((option) => option.value === props.language) ||
  resolvedLanguageOptions.value[0],
);

const resolvedLanguageLabel = computed(() => currentLanguageOption.value?.label || props.language || "Text");
const resolvedMirrorMode = computed(() => currentLanguageOption.value?.mode || currentLanguageOption.value?.value || "shell");
const resolvedDialogTitle = computed(() => props.dialogTitle || `${props.label}编辑`);

const previewText = computed(() => {
  const value = String(props.modelValue || "").trim();
  if (!value) return props.emptyText || props.placeholder || "点击编辑";
  return value.split(/\r?\n/).slice(0, Math.max(Number(props.previewLines || 8), 1)).join("\n");
});

const editorOptions = computed(() => ({
  completeSingle: false,
  extraKeys: {
    "Ctrl-S": confirmEdit,
    "Cmd-S": confirmEdit,
  },
}));

const splitKeywords = (text?: string) =>
  String(text || "")
    .split(/[\s,，;；]+/)
    .map((item) => item.trim())
    .filter(Boolean);

const resolvedKeywordHighlights = computed(() => {
  const keywords = [
    ...(props.keywordHighlights || []),
    ...splitKeywords(localKeywordText.value),
  ];
  return [...new Set(keywords.map((item) => String(item || "").trim()).filter(Boolean))];
});

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const highlightedPreviewHtml = computed(() => {
  const html = escapeHtml(previewText.value || "");
  const keywords = resolvedKeywordHighlights.value;
  if (!keywords.length) return html;
  const pattern = new RegExp(`(${keywords.map(escapeRegExp).join("|")})`, "gi");
  return html.replace(pattern, '<mark class="sc-script-editor__keyword">$1</mark>');
});

watch(
  () => props.language,
  (value) => {
    if (!dialogVisible.value) {
      draftLanguage.value = value || "shell";
    }
  },
  { immediate: true },
);

watch(
  () => props.modelValue,
  (value) => {
    if (!dialogVisible.value) {
      draftValue.value = String(value || "");
    }
  },
  { immediate: true },
);

watch(
  () => props.keywordText,
  (value) => {
    localKeywordText.value = value || "";
  },
);

const refreshEditor = async () => {
  await nextTick();
  codeEditorRef.value?.refresh?.();
};

const openEditor = () => {
  draftValue.value = String(props.modelValue || "");
  draftLanguage.value = props.language || "shell";
  dialogVisible.value = true;
};

const confirmEdit = () => {
  emit("update:modelValue", draftValue.value);
  emit("update:language", draftLanguage.value || "shell");
  dialogVisible.value = false;
};
</script>

<style scoped lang="scss">
.sc-script-editor {
  width: 100%;
  max-width: var(--el-input-width, 100%);
}

.sc-script-editor__preview {
  width: 100%;
  min-height: 42px;
  padding: 0;
  border: 1px solid rgba(219, 226, 233, 1);
  border-radius: 8px;
  background: #fff;
  color: var(--el-text-color-regular);
  cursor: pointer;
  display: block;
  overflow: hidden;
  text-align: left;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    border-color: var(--el-color-primary);
    box-shadow: 0 2px 10px rgba(59, 130, 246, 0.1);
  }
}

.sc-script-editor__preview-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 10px;
  border-bottom: 1px solid rgba(226, 232, 240, 0.9);
  background: rgba(248, 250, 252, 0.94);
}

.sc-script-editor__label {
  color: var(--el-text-color-primary);
  font-size: 12px;
  font-weight: 600;
}

.sc-script-editor__lang {
  flex: none;
  color: #64748b;
  font-size: 11px;
}

.sc-script-editor__code {
  max-height: 168px;
  margin: 0;
  padding: 10px 12px;
  overflow: hidden;
  color: #1f2937;
  font-family: Consolas, Monaco, "Courier New", monospace;
  font-size: 12px;
  line-height: 1.55;
  white-space: pre-wrap;
  word-break: break-all;
}

.sc-script-editor__title-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border: 1px solid rgba(219, 226, 233, 1);
  border-radius: 8px;
  background: rgba(248, 250, 252, 0.94);
}

.sc-script-editor__title-text {
  color: var(--el-text-color-primary);
  font-size: 13px;
  font-weight: 600;
}

.sc-script-editor__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 14px;
}

.sc-script-editor__toolbar-item {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.sc-script-editor__toolbar-item--search {
  flex: 1;
  justify-content: flex-end;
}

.sc-script-editor__toolbar-item--search :deep(.el-input) {
  max-width: 420px;
}

.toolbar-label {
  flex: none;
  color: var(--el-text-color-primary);
  font-size: 13px;
  font-weight: 600;
}

.sc-script-editor__mirror {
  border-radius: 8px;
  overflow: hidden;
}

:deep(.sc-script-editor__keyword) {
  padding: 0 2px;
  border-radius: 2px;
  color: #111827;
  background: rgba(250, 204, 21, 0.5);
}

@media (max-width: 768px) {
  .sc-script-editor__toolbar {
    align-items: stretch;
    flex-direction: column;
  }

  .sc-script-editor__toolbar-item,
  .sc-script-editor__toolbar-item--search {
    width: 100%;
    align-items: stretch;
    flex-direction: column;
    justify-content: flex-start;
  }

  .sc-script-editor__toolbar-item--search :deep(.el-input) {
    max-width: 100%;
  }
}
</style>
