<template>
  <div class="script-inline-editor">
    <ElTooltip
      placement="top-start"
      :show-after="200"
      :content="tooltipContent"
      :disabled="!tooltipContent"
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
      <div class="script-inline-editor__toolbar">
        <span>脚本语言</span>
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
        :rows="14"
        :placeholder="placeholder"
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
  width: var(--el-input-width, 538px);
}

.script-inline-editor__preview {
  width: 100%;
  min-height: 40px;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(203, 213, 225, 0.9);
  background: rgba(248, 250, 252, 0.92);
  color: #334155;
  cursor: pointer;
  transition: all 0.2s ease;
}

.script-inline-editor__preview:hover {
  border-color: rgba(59, 130, 246, 0.55);
  background: rgba(239, 246, 255, 0.75);
}

.script-inline-editor__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
  color: #475569;
  font-size: 13px;
  font-weight: 600;
}
</style>
