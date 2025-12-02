<template>
  <div class="sc-totp-input-wrapper" :class="{ 'is-invalid': !validationResult.valid }">
    <div class="sc-totp-input-container" :class="{ 'is-disabled': disabled }">
      <div v-if="showPrefix && (prefixIcon || defaultPrefixIcon)" class="sc-totp-input__prefix">
        <IconifyIconOnline :icon="prefixIcon || defaultPrefixIcon" class="sc-totp-input__prefix-icon" />
      </div>

      <div class="sc-totp-segments">
        <div v-for="(segment, index) in segments" :key="index" class="sc-totp-segment" :class="{ 'is-focused': focusedIndex === index, 'is-filled': !!segment }">
          <input
            ref="inputRefs"
            v-model="segments[index]"
            type="text"
            :disabled="disabled"
            :size="1"
            :maxlength="1"
            :autocomplete="index === 0 ? 'one-time-code' : 'off'"
            @input="handleSegmentInput(index)"
            @keydown="handleKeyDown($event, index)"
            @focus="handleSegmentFocus(index)"
            @paste="handlePaste($event)"
          />
        </div>
      </div>

      <div v-if="count" class="sc-totp-input__count">{{ filledCount }}/{{ props.length }}</div>

      <div v-if="clearable && hasValue && !disabled" class="sc-totp-input__suffix" @click="handleClear">
        <IconifyIconOnline icon="ep:circle-close-filled" />
      </div>
    </div>

    <div v-if="!validationResult.valid && showValidationMsg" class="sc-totp-input__error">
      {{ validationResult.message }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from "vue";
import { validate } from "../validation";
import { getDefaultIcon } from "../defaultIcons";
import { IconifyIconOnline } from "@repo/components/ReIcon";

interface Props {
  /**
   * 绑定值
   */
  modelValue?: string;
  /**
   * 输入框占位文本
   */
  placeholder?: string;
  /**
   * 禁用状态
   */
  disabled?: boolean;
  /**
   * 输入框长度
   */
  length?: number;
  /**
   * 输入框尺寸
   */
  size?: "large" | "default" | "small";
  /**
   * 输入框前缀图标
   */
  prefixIcon?: string;
  /**
   * 是否显示前缀图标
   */
  showPrefix?: boolean;
  /**
   * 是否可清空
   */
  clearable?: boolean;
  /**
   * totp值类型
   */
  totpValueType?: "number" | "letter" | "any";
  /**
   * 校验规则
   */
  rules?: {
    required?: boolean;
    type?: string;
    message?: string;
    validator?: (value: any) => boolean | { valid: boolean; message: string };
  };
  /**
   * 是否显示校验消息
   */
  showValidationMsg?: boolean;
  /**
   * 自动获取焦点
   */
  autofocus?: boolean;
  /**
   * 显示数量
   */
  count?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: "",
  placeholder: "",
  disabled: false,
  length: 6,
  size: "default",
  prefixIcon: "",
  showPrefix: true,
  clearable: true,
  totpValueType: "number",
  rules: () => ({}),
  showValidationMsg: true,
  autofocus: false,
  count: true
});

const emit = defineEmits(["update:modelValue", "change", "input", "focus", "blur", "clear"]);

// 输入框引用数组
const inputRefs = ref<HTMLInputElement[]>([]);
// 每个段落的值
const segments = ref<string[]>(Array(props.length).fill(""));
// 当前聚焦的索引
const focusedIndex = ref(-1);
// 数据校验结果
const validationResult = ref<{ valid: boolean; message: string }>({ valid: true, message: "" });

// 默认前缀图标
const defaultPrefixIcon = computed(() => getDefaultIcon("totp"));

// 是否有值
const hasValue = computed(() => segments.value.some(segment => segment));

// 当前完整值
const currentValue = computed(() => {
  return segments.value.join("");
});

// 计算已填充的数量
const filledCount = computed(() => segments.value.filter(segment => segment.length > 0).length);

// 根据类型验证输入有效性
const isValidInput = (value: string): boolean => {
  if (!value) return true;

  switch (props.totpValueType) {
    case "number":
      return /^\d*$/.test(value);
    case "letter":
      return /^[a-zA-Z]*$/.test(value);
    case "any":
    default:
      return true;
  }
};

// 处理单个输入框输入
const handleSegmentInput = (index: number) => {
  const value = segments.value[index];

  // 检查输入是否符合值类型要求
  if (!isValidInput(value)) {
    segments.value[index] = "";
    return;
  }

  // 如果当前输入框有值，并且不是最后一个输入框，则焦点移到下一个
  if (value && index < props.length - 1) {
    nextTick(() => {
      focusSegment(index + 1);
    });
  }

  updateModelValue();
  emit("input", currentValue.value);
};

// 聚焦到指定索引的输入框
const focusSegment = (index: number) => {
  if (index >= 0 && index < props.length && inputRefs.value[index]) {
    inputRefs.value[index].focus();
  }
};

// 处理键盘事件
const handleKeyDown = (event: KeyboardEvent, index: number) => {
  // 处理退格键
  if (event.key === "Backspace" || event.key === "Delete") {
    if (!segments.value[index] && index > 0) {
      event.preventDefault();
      segments.value[index - 1] = "";
      focusSegment(index - 1);
      updateModelValue();
    }
  }
  // 处理左箭头
  else if (event.key === "ArrowLeft" && index > 0) {
    event.preventDefault();
    focusSegment(index - 1);
  }
  // 处理右箭头
  else if (event.key === "ArrowRight" && index < props.length - 1) {
    event.preventDefault();
    focusSegment(index + 1);
  }
  // 处理数字限制
  else if (props.totpValueType === "number" && !/^\d$/.test(event.key) && !event.ctrlKey && !event.metaKey && event.key.length === 1) {
    event.preventDefault();
  }
  // 处理字母限制
  else if (props.totpValueType === "letter" && !/^[a-zA-Z]$/.test(event.key) && !event.ctrlKey && !event.metaKey && event.key.length === 1) {
    event.preventDefault();
  }
};

// 处理粘贴事件
const handlePaste = (event: ClipboardEvent) => {
  event.preventDefault();
  const pasteData = event.clipboardData?.getData("text/plain") || "";
  let filteredData = pasteData;

  // 根据类型过滤粘贴内容
  if (props.totpValueType === "number") {
    filteredData = pasteData.replace(/[^\d]/g, "");
  } else if (props.totpValueType === "letter") {
    filteredData = pasteData.replace(/[^a-zA-Z]/g, "");
  }

  // 填充到各个输入框
  for (let i = 0; i < Math.min(props.length, filteredData.length); i++) {
    segments.value[i] = filteredData[i];
  }

  // 如果粘贴数据填满了所有输入框，则聚焦到最后一个
  if (filteredData.length >= props.length) {
    focusSegment(props.length - 1);
  } else if (filteredData.length > 0) {
    // 否则聚焦到粘贴数据之后的第一个空输入框
    focusSegment(Math.min(props.length - 1, filteredData.length));
  }

  updateModelValue();
  emit("input", currentValue.value);
};

// 处理输入框聚焦
const handleSegmentFocus = (index: number) => {
  focusedIndex.value = index;
  emit("focus", { index, segments: segments.value });
};

// 更新绑定值
const updateModelValue = () => {
  const value = currentValue.value;
  validationResult.value = validate(value, props.rules);
  emit("update:modelValue", value);
};

// 处理清空
const handleClear = () => {
  segments.value = Array(props.length).fill("");
  updateModelValue();
  emit("clear");
  // 清空后聚焦到第一个输入框
  nextTick(() => {
    focusSegment(0);
  });
};

// 外部值变化时更新内部状态
watch(
  () => props.modelValue,
  newValue => {
    if (newValue !== currentValue.value) {
      const chars = (newValue || "").split("");
      segments.value = Array(props.length)
        .fill("")
        .map((_, i) => chars[i] || "");
    }
  },
  { immediate: true }
);

// 长度变化时重设内部状态
watch(
  () => props.length,
  newLength => {
    const currentSegments = [...segments.value];
    segments.value = Array(newLength)
      .fill("")
      .map((_, i) => currentSegments[i] || "");
  },
  { immediate: true }
);

// 自动聚焦
onMounted(() => {
  if (props.autofocus && !props.disabled) {
    nextTick(() => {
      focusSegment(0);
    });
  }
});
</script>

<style lang="scss" scoped>
.sc-totp-input-wrapper {
  width: 100%;

  &.is-invalid {
    .sc-totp-segment {
      border-color: var(--el-color-danger);
    }
  }
}

.sc-totp-input-container {
  display: flex;
  align-items: center;
  width: 100%;

  &.is-disabled {
    opacity: 0.6;
    cursor: not-allowed;

    .sc-totp-segment {
      background-color: var(--el-disabled-bg-color);
      border-color: var(--el-disabled-border-color);
      color: var(--el-text-color-placeholder);
      cursor: not-allowed;
    }
  }
}

.sc-totp-input__prefix {
  display: flex;
  align-items: center;
  margin-right: 12px;
  color: var(--el-text-color-secondary);

  &-icon {
    font-size: 20px;
  }
}

.sc-totp-input__suffix {
  display: flex;
  align-items: center;
  margin-left: 8px;
  color: var(--el-text-color-placeholder);
  cursor: pointer;

  &:hover {
    color: var(--el-text-color-secondary);
  }
}

.sc-totp-input__count {
  display: flex;
  align-items: center;
  margin-left: 12px;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 500;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  border-radius: 20px;
}

.sc-totp-segments {
  display: flex;
  gap: 10px;
  flex: 1;
  justify-content: center;
}

.sc-totp-segment {
  position: relative;
  width: 44px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--el-border-color-light);
  border-radius: 12px;
  background: linear-gradient(180deg, var(--el-fill-color-blank, #fff) 0%, var(--el-fill-color-lighter, #fafafa) 100%);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);

  &:hover:not(.is-focused) {
    border-color: var(--el-border-color);
  }

  &.is-focused {
    border-color: var(--el-color-primary);
    box-shadow:
      0 0 0 3px rgba(var(--el-color-primary-rgb), 0.15),
      0 4px 12px rgba(0, 0, 0, 0.08);
    transform: translateY(-2px);
    background: var(--el-fill-color-blank);
  }

  &.is-filled {
    border-color: var(--el-color-success-light-5);
    background: linear-gradient(180deg, rgba(var(--el-color-success-rgb), 0.05) 0%, var(--el-fill-color-blank) 100%);
    animation: totp-fill-pulse 0.3s ease-out;

    &.is-focused {
      border-color: var(--el-color-primary);
    }
  }

  input {
    width: 100%;
    height: 100%;
    text-align: center;
    font-size: 22px;
    font-weight: 600;
    font-family: "Monaco", "Menlo", "Consolas", monospace;
    border: none;
    background: transparent;
    outline: none;
    color: var(--el-text-color-primary);
    caret-color: var(--el-color-primary);
    letter-spacing: 2px;
  }
}

.sc-totp-input__error {
  margin-top: 6px;
  font-size: 12px;
  color: var(--el-color-danger);
  line-height: 1.2;
}

// 填充脉冲动画
@keyframes totp-fill-pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.08);
  }
  100% {
    transform: scale(1);
  }
}
</style>
