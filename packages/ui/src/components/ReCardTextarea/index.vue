<template>
  <div class="re-card-textarea">
    <div class="re-card-textarea__card">
      <textarea
        class="re-card-textarea__input"
        :value="modelValue"
        :placeholder="placeholder"
        :rows="rows"
        :disabled="disabled"
        :readonly="readonly"
        :maxlength="maxlength"
        @input="onInput"
        @keydown="onKeydown"
      />
    </div>
    <div v-if="description || $slots.description" class="re-card-textarea__desc">
      <slot name="description">{{ description }}</slot>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * ReCardTextarea —— 卡片式多行文本输入框
 *
 * 视觉与 ReSelect 的 CardDropdown 卡片完全统一：
 *   - 圆角弧度一致（10px）
 *   - 边框粗细、浅灰底色、内缩阴影一致
 *   - 去掉右下角拉伸控件（resize: none）
 *   - 内外边距与下拉框卡片一致
 *
 * 用法：
 *   <ReCardTextarea v-model="prompt" placeholder="输入描述..." :rows="3"
 *     description="下方为卡片描述" />
 */

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    placeholder?: string;
    /** 行数（默认 3） */
    rows?: number;
    disabled?: boolean;
    readonly?: boolean;
    maxlength?: number;
    /** 卡片下方的描述文字 */
    description?: string;
    /** 是否允许 Ctrl/Cmd + Enter 快捷提交（由父组件监听 submit） */
    submitOnKeydown?: boolean;
  }>(),
  {
    modelValue: "",
    placeholder: "",
    rows: 3,
    disabled: false,
    readonly: false,
    maxlength: undefined,
    description: "",
    submitOnKeydown: false,
  },
);

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "submit"): void;
}>();

function onInput(e: Event) {
  emit("update:modelValue", (e.target as HTMLTextAreaElement).value);
}

function onKeydown(e: KeyboardEvent) {
  if (props.submitOnKeydown && (e.ctrlKey || e.metaKey) && e.key === "Enter") {
    e.preventDefault();
    emit("submit");
  }
}
</script>

<style scoped>
/* ===== 卡片式多行文本输入框 ===== */
.re-card-textarea {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* 卡片主体：与 ReSelect CardDropdown 卡片视觉统一 */
.re-card-textarea__card {
  border-radius: 10px;
  border: 1px solid var(--rm-border, var(--el-border-color-light));
  background: var(--rm-bg-subtle, var(--el-fill-color-light));
  padding: 10px 14px;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    background 0.2s ease;
}

.re-card-textarea__card:hover {
  border-color: color-mix(in srgb, var(--rm-primary, var(--el-color-primary)) 30%, var(--rm-border, var(--el-border-color-light)));
  background: var(--rm-bg, var(--el-bg-color));
}

.re-card-textarea__card:focus-within {
  border-color: var(--rm-primary, var(--el-color-primary));
  background: var(--rm-bg, var(--el-bg-color));
  box-shadow:
    0 0 0 3px color-mix(in srgb, var(--rm-primary, var(--el-color-primary)) 12%, transparent),
    0 4px 14px color-mix(in srgb, var(--rm-primary, var(--el-color-primary)) 12%, transparent);
}

.re-card-textarea__input {
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  resize: none;
  border: none;
  outline: none;
  background: transparent;
  color: var(--rm-text, var(--el-text-color-primary));
  font-size: 13px;
  font-family: inherit;
  line-height: 1.6;
  padding: 0;
}

.re-card-textarea__input::placeholder {
  color: var(--rm-text-disabled, var(--el-text-color-placeholder));
}

.re-card-textarea__input:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

/* 描述文字：位于卡片下方 */
.re-card-textarea__desc {
  font-size: 12px;
  color: var(--rm-text-secondary, var(--el-text-color-secondary));
  line-height: 1.5;
  padding: 0 2px;
}
</style>