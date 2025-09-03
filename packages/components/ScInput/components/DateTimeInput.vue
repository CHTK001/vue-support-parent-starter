<template>
  <div class="sc-datetime-input-wrapper" :class="{ 'is-invalid': !validationResult.valid }">
    <div v-if="prefixIcon && showPrefix" class="sc-datetime-input-prefix">
      <IconifyIconOnline :icon="prefixIcon || defaultPrefixIcon" />
    </div>

    <div class="sc-datetime-input-container">
      <el-date-picker
        ref="datePickerRef"
        v-model="currentValue"
        :type="datePickerType"
        :disabled="disabled"
        :placeholder="placeholder"
        :clearable="clearable"
        :format="displayFormat"
        :value-format="valueFormat"
        :size="size"
        :editable="editable"
        :readonly="readonly"
        :shortcuts="shortcuts"
        :disabledDate="disabledDate"
        :disabledTime="disabledTime"
        :range-separator="rangeSeparator"
        :start-placeholder="startPlaceholder"
        :end-placeholder="endPlaceholder"
        :default-time="defaultTime"
        @change="handleChange"
        @blur="handleBlur"
        @focus="handleFocus"
        @calendar-change="handleCalendarChange"
        @visible-change="handleVisibleChange"
      />
    </div>

    <div v-if="!validationResult.valid && showValidationMsg" class="sc-datetime-input__error">
      {{ validationResult.message }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { IconifyIconOnline } from "@repo/components/ReIcon";
import { getDefaultIcon } from "../defaultIcons";
import { validate } from "../validation";

interface Props {
  /**
   * 绑定值
   */
  modelValue?: string | number | Date | (string | number | Date)[];
  /**
   * 输入框类型
   */
  type?: "date" | "datetime" | "month" | "year" | "week" | "time" | "datetimerange" | "daterange" | "monthrange" | "weekrange" | "timerange";
  /**
   * 输入框占位文本
   */
  placeholder?: string;
  /**
   * 禁用状态
   */
  disabled?: boolean;
  /**
   * 是否可清空
   */
  clearable?: boolean;
  /**
   * 前缀图标
   */
  prefixIcon?: string;
  /**
   * 是否显示前缀图标
   */
  showPrefix?: boolean;
  /**
   * 日期格式
   */
  format?: string;
  /**
   * 值格式
   */
  valueFormat?: string;
  /**
   * 选择器尺寸
   */
  size?: "small" | "default" | "large";
  /**
   * 是否可编辑
   */
  editable?: boolean;
  /**
   * 是否只读
   */
  readonly?: boolean;
  /**
   * 快捷选项
   */
  shortcuts?: Array<{ text: string; value: Date | Function }>;
  /**
   * 禁用日期函数
   */
  disabledDate?: (date: Date) => boolean;
  /**
   * 禁用时间函数
   */
  disabledTime?: (date: Date) => { hours?: number[]; minutes?: number[]; seconds?: number[] };
  /**
   * 范围选择器分隔符
   */
  rangeSeparator?: string;
  /**
   * 范围选择器开始占位符
   */
  startPlaceholder?: string;
  /**
   * 范围选择器结束占位符
   */
  endPlaceholder?: string;
  /**
   * 默认时间
   */
  defaultTime?: string | string[];
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
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: "",
  type: "date",
  placeholder: "",
  disabled: false,
  clearable: true,
  prefixIcon: "",
  showPrefix: true,
  format: undefined,
  valueFormat: "", // 默认为空，使用datePicker默认值
  size: "default",
  editable: true,
  readonly: false,
  shortcuts: () => [],
  disabledDate: undefined,
  disabledTime: undefined,
  rangeSeparator: "-",
  startPlaceholder: "",
  endPlaceholder: "",
  defaultTime: undefined,
  rules: () => ({}),
  showValidationMsg: true
});

const emit = defineEmits(["update:modelValue", "change", "blur", "focus", "calendar-change", "visible-change"]);

const datePickerRef = ref();
const currentValue = ref(props.modelValue);
const validationResult = ref<{ valid: boolean; message: string }>({ valid: true, message: "" });

// 日期选择器类型映射
const datePickerType = computed(() => {
  switch (props.type) {
    case "date":
      return "date";
    case "datetime":
      return "datetime";
    case "month":
      return "month";
    case "year":
      return "year";
    case "week":
      return "week";
    case "time":
      return "time";
    case "datetimerange":
      return "datetimerange";
    case "daterange":
      return "daterange";
    case "monthrange":
      return "monthrange";
    case "weekrange":
      return "monthrange"; // El-date-picker不直接支持weekrange，使用monthrange代替
    case "timerange":
      return "timerange";
    default:
      return "date";
  }
});

// 默认前缀图标
const defaultPrefixIcon = computed(() => {
  return getDefaultIcon(props.type);
});

// 默认显示格式
const displayFormat = computed(() => {
  if (props.format) return props.format;

  switch (props.type) {
    case "date":
      return "YYYY-MM-DD";
    case "datetime":
      return "YYYY-MM-DD HH:mm:ss";
    case "month":
      return "YYYY-MM";
    case "year":
      return "YYYY";
    case "week":
      return "YYYY 第 WW 周";
    case "time":
      return "HH:mm:ss";
    case "datetimerange":
      return "YYYY-MM-DD HH:mm:ss";
    case "daterange":
      return "YYYY-MM-DD";
    case "monthrange":
      return "YYYY-MM";
    case "weekrange":
      return "YYYY 第 WW 周";
    case "timerange":
      return "HH:mm:ss";
    default:
      return "YYYY-MM-DD";
  }
});

// 默认错误信息
const defaultErrorMessage = computed(() => {
  switch (props.type) {
    case "date":
      return "请选择有效的日期";
    case "datetime":
      return "请选择有效的日期时间";
    case "month":
      return "请选择有效的月份";
    case "year":
      return "请选择有效的年份";
    case "week":
      return "请选择有效的周";
    case "time":
      return "请选择有效的时间";
    case "datetimerange":
    case "daterange":
    case "monthrange":
    case "weekrange":
    case "timerange":
      return "请选择有效的日期/时间范围";
    default:
      return "请选择有效的日期";
  }
});

// 监听modelValue变化
watch(
  () => props.modelValue,
  newVal => {
    currentValue.value = newVal;
    validateValue();
  },
  { immediate: true }
);

// 监听currentValue变化
watch(currentValue, newVal => {
  if (!props.disabled) {
    emit("update:modelValue", newVal);
    validateValue();
  }
});

// 监听禁用状态变化
watch(
  () => props.disabled,
  newVal => {
    if (newVal && validationResult.value.valid === false) {
      // 如果禁用状态，则不显示错误
      validationResult.value = { valid: true, message: "" };
    } else if (!newVal) {
      // 恢复启用状态时，重新校验
      validateValue();
    }
  }
);

onMounted(() => {
  validateValue();
});

// 处理值变更
const handleChange = (value: any) => {
  emit("change", value);
};

// 处理失焦
const handleBlur = (event: FocusEvent) => {
  validateValue();
  emit("blur", event);
};

// 处理聚焦
const handleFocus = (event: FocusEvent) => {
  emit("focus", event);
};

// 处理日历变化
const handleCalendarChange = (val: any) => {
  emit("calendar-change", val);
};

// 处理弹出状态变化
const handleVisibleChange = (visible: boolean) => {
  emit("visible-change", visible);
};

// 校验值
const validateValue = () => {
  if (props.disabled) return;

  if (props.rules) {
    const rules = {
      ...props.rules,
      message: props.rules.message || defaultErrorMessage.value
    };
    validationResult.value = validate(currentValue.value, rules);
  }
};

defineExpose({
  focus: () => datePickerRef.value?.focus(),
  blur: () => datePickerRef.value?.blur(),
  validateValue
});
</script>

<style lang="scss" scoped>
.sc-datetime-input-wrapper {
  display: flex;
  flex-direction: column;
  width: 100%;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &.is-invalid {
    animation: shake 0.5s ease-in-out;

    :deep(.el-input__wrapper) {
      box-shadow: 0 0 0 2px var(--el-color-danger) inset !important;
      border-color: var(--el-color-danger) !important;
    }
  }

  // 悬停效果
  &:hover {
    transform: translateY(-1px);

    :deep(.el-input__wrapper) {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }
  }

  // 聚焦状态
  &:focus-within {
    transform: translateY(-2px);

    :deep(.el-input__wrapper) {
      box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.2);
    }
  }
}

.sc-datetime-input-prefix {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px;
  color: var(--el-text-color-placeholder);
  font-size: 16px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    color: var(--el-color-primary);
    transform: scale(1.1);
  }
}

.sc-datetime-input-container {
  flex: 1;

  :deep(.el-date-editor) {
    width: 100%;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    .el-input__wrapper {
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

      &:hover {
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        transform: translateY(-1px);
      }

      &.is-focus {
        box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.2);
        transform: translateY(-2px);
      }
    }

    // 日期选择器图标美化
    .el-input__suffix {
      .el-input__suffix-inner {
        .el-icon {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

          &:hover {
            color: var(--el-color-primary);
            transform: scale(1.2);
          }
        }
      }
    }

    // 范围选择器分隔符美化
    .el-range-separator {
      color: var(--el-text-color-placeholder);
      font-weight: 500;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
  }

  // 禁用状态
  &.is-disabled {
    :deep(.el-date-editor) {
      opacity: 0.6;

      .el-input__wrapper {
        box-shadow: none !important;
        transform: none !important;
      }
    }
  }
}

.sc-datetime-input__error {
  color: var(--el-color-danger);
  font-size: 12px;
  line-height: 1;
  padding-top: 4px;
  margin-left: 1px;
  animation: fadeInUp 0.3s ease-out;
  font-weight: 500;
}

// 动画定义
@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-5px);
  }
  75% {
    transform: translateX(5px);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// 响应式设计
@media (max-width: 768px) {
  .sc-datetime-input-wrapper {
    &:hover,
    &:focus-within {
      transform: none;
    }
  }

  .sc-datetime-input-container {
    :deep(.el-date-editor) {
      .el-input__wrapper {
        &:hover,
        &.is-focus {
          transform: none;
        }
      }
    }
  }
}
</style>
