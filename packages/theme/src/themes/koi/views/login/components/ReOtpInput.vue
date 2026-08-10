<template>
  <div class="otp-input" :class="{ 'otp-input--disabled': disabled }">
    <div class="otp-input-cells">
      <template v-for="(_, index) in length" :key="index">
        <input
          ref="cellRefs"
          v-model="cells[index]"
          class="otp-cell"
          type="text"
          inputmode="numeric"
          autocomplete="one-time-code"
          :maxlength="1"
          :disabled="disabled"
          :class="{ 'otp-cell--filled': !!cells[index], 'otp-cell--focused': focusedIndex === index }"
          @input="handleInput(index, $event)"
          @keydown="handleKeydown(index, $event)"
          @paste="handlePaste"
          @focus="focusedIndex = index"
          @blur="focusedIndex = -1"
        />
      </template>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, onMounted } from "vue";

const props = withDefaults(
  defineProps<{
    /** OTP 位数（默认 6） */
    length?: number;
    /** 是否禁用 */
    disabled?: boolean;
  }>(),
  {
    length: 6,
    disabled: false,
  },
);

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "complete", value: string): void;
}>();

const model = defineModel<string>({ default: "" });

/** 各格输入值 */
const cells = ref<string[]>([]);
const cellRefs = ref<HTMLInputElement[]>([]);
const focusedIndex = ref(-1);

// 初始化格子；外部 modelValue 变化时同步
watch(
  () => props.length,
  () => {
    initCells();
  },
);
watch(
  model,
  (val) => {
    const str = (val ?? "").replace(/\D/g, "").slice(0, props.length);
    cells.value = Array.from({ length: props.length }, (_, i) => str[i] ?? "");
  },
  { immediate: true },
);

onMounted(() => {
  initCells();
});

/** 初始化空格子 */
function initCells(): void {
  cells.value = Array.from({ length: props.length }, () => "");
}

/** 合并各格值为完整字符串 */
function mergeValue(): string {
  return cells.value.join("");
}

/** 输入处理：只允许数字，并自动跳到下一格 */
function handleInput(index: number, event: Event): void {
  const input = event.target as HTMLInputElement;
  const raw = input.value.replace(/\D/g, "").slice(-1);
  cells.value[index] = raw;
  const value = mergeValue();
  model.value = value;
  // 有值且未到最后一位时聚焦下一格
  if (raw && index < props.length - 1) {
    cellRefs.value[index + 1]?.focus();
    cellRefs.value[index + 1]?.select();
  }
  if (value.length === props.length) {
    emit("complete", value);
  }
}

/** 键盘处理：退格清空并回退到上一格；方向键左右移动 */
function handleKeydown(index: number, event: KeyboardEvent): void {
  if (event.key === "Backspace") {
    if (cells.value[index]) {
      cells.value[index] = "";
      model.value = mergeValue();
    } else if (index > 0) {
      cellRefs.value[index - 1]?.focus();
      cellRefs.value[index - 1]?.select();
    }
  } else if (event.key === "ArrowLeft" && index > 0) {
    event.preventDefault();
    cellRefs.value[index - 1]?.focus();
  } else if (event.key === "ArrowRight" && index < props.length - 1) {
    event.preventDefault();
    cellRefs.value[index + 1]?.focus();
  } else if (!/^\d$/.test(event.key) && event.key.length === 1) {
    event.preventDefault();
  }
}

/** 粘贴支持：一次性填充所有格子 */
function handlePaste(event: ClipboardEvent): void {
  const text = (event.clipboardData?.getData("text") ?? "").replace(/\D/g, "").slice(0, props.length);
  if (!text) return;
  event.preventDefault();
  cells.value = Array.from({ length: props.length }, (_, i) => text[i] ?? "");
  model.value = mergeValue();
  const target = Math.min(text.length, props.length) - 1;
  cellRefs.value[target]?.focus();
  if (text.length === props.length) {
    emit("complete", text);
  }
}

defineExpose({
  /** 聚焦到首个空位 */
  focus: () => {
    const firstEmpty = cells.value.findIndex((c) => !c);
    cellRefs.value[firstEmpty === -1 ? 0 : firstEmpty]?.focus();
  },
});
</script>

<style lang="scss" scoped>
.otp-input {
  width: 100%;

  &--disabled {
    opacity: 0.6;
  }
}

.otp-input-cells {
  display: flex;
  gap: 10px;
}

.otp-cell {
  flex: 1;
  min-width: 0;
  height: 44px;
  padding: 0;
  font-size: 20px;
  font-weight: 600;
  text-align: center;
  color: var(--el-text-color-primary);
  background: var(--el-fill-color-blank);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  outline: none;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;

  &--filled {
    border-color: var(--el-border-color);
  }

  &--focused {
    border-color: var(--el-color-primary);
    box-shadow: 0 0 0 3px rgba(var(--el-color-primary-rgb), 0.12);
  }

  &::placeholder {
    color: var(--el-text-color-placeholder);
  }
}
</style>
