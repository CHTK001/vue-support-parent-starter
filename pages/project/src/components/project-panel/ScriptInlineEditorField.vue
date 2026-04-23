<template>
  <div class="script-inline-editor">
    <ElTooltip
      placement="top-start"
      :show-after="200"
      :content="tooltipContent"
      :disabled="!tooltipContent"
      effect="light"
    >
      <ElText
        class="script-inline-editor__preview"
        truncated
        @click="openEditor"
      >
        {{ previewText }}
      </ElText>
    </ElTooltip>

    <ScDialog
      v-model="dialogVisible"
      :title="resolvedDialogTitle"
      width="960px"
      append-to-body
      destroy-on-close
      layout="simple"
    >
      <div v-if="showLanguageToolbar" class="script-inline-editor__toolbar">
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

      <el-input
        v-model="draftValue"
        type="textarea"
        :rows="16"
        :placeholder="placeholder"
        class="script-textarea"
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
import { computed, ref, watch } from "vue";
import ScSelect from "@repo/components/ScSelect/src/index.vue";

type ScriptLanguageOption = {
  label: string;
  value: string;
};

const DEFAULT_LANGUAGE_OPTIONS: ScriptLanguageOption[] = [
  { label: "Shell / Bash", value: "shell" },
  { label: "PowerShell", value: "powershell" },
  { label: "Batch / CMD", value: "bat" },
  { label: "Python", value: "python" },
  { label: "Node.js", value: "javascript" },
];

const props = defineProps<{
  modelValue?: string;
  label: string;
  placeholder?: string;
  language?: string;
  languageOptions?: ScriptLanguageOption[];
  emptyText?: string;
  dialogTitle?: string;
  showLanguageToolbar?: boolean;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "update:language", value: string): void;
}>();

const dialogVisible = ref(false);
const draftValue = ref("");
const draftLanguage = ref(props.language || "shell");

const resolvedLanguageOptions = computed(() =>
  props.languageOptions?.length
    ? props.languageOptions
    : DEFAULT_LANGUAGE_OPTIONS,
);

const previewText = computed(() => {
  const trimmed = String(props.modelValue || "").trim();
  if (!trimmed) {
    return props.emptyText || "点击编辑脚本内容";
  }
  return trimmed.split(/\r?\n/).filter(Boolean)[0] || trimmed;
});

const tooltipContent = computed(() => {
  const value = String(props.modelValue || "").trim();
  return value || "";
});

const resolvedDialogTitle = computed(
  () => props.dialogTitle || `${props.label}编辑`,
);
const showLanguageToolbar = computed(() => props.showLanguageToolbar !== false);

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
.script-inline-editor {
  --preview-radius: 12px;
  --preview-border: rgba(219, 226, 233, 1);
  --preview-hover-border: var(--el-color-primary);
  --preview-bg: rgba(252, 253, 255, 1);
  --preview-hover-bg: rgba(243, 248, 255, 0.9);
  width: 100%;
  max-width: var(--el-input-width, 540px);
}

.script-inline-editor__preview {
  width: 100%;
  min-height: 42px;
  padding: 10px 14px;
  border-radius: var(--preview-radius);
  border: 1px solid var(--preview-border);
  background: var(--preview-bg);
  color: var(--el-text-color-regular);
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  display: inline-block;
  line-height: 20px;

  &:hover {
    border-color: var(--preview-hover-border);
    background: var(--preview-hover-bg);
    color: var(--el-text-color-primary);
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.08);
  }
}

.script-inline-editor__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
  color: var(--el-text-color-regular);
  font-size: 13px;
  font-weight: 500;
}

.toolbar-label {
  color: var(--el-text-color-primary);
  font-weight: 500;
}

:deep(.el-textarea) {
  --el-input-border-radius: 10px;
}

:deep(.el-textarea__inner) {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace !important;
  font-size: 13px;
  line-height: 1.6;
  padding: 12px 14px;
  border-radius: 10px;
  transition: all 0.2s ease;
  resize: vertical;

  &:focus {
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
  }
}

@media (max-width: 768px) {
  .script-inline-editor {
    max-width: 100%;
  }

  .script-inline-editor__toolbar {
    flex-direction: column;
    align-items: stretch;

    :deep(.el-select) {
      width: 100% !important;
    }
  }
}
</style>