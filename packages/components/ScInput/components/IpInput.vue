<template>
  <div class="sc-ip-input-wrapper" :class="{ 'is-invalid': !validationResult.valid }">
    <div class="sc-ip-input-container" :class="{ 'is-disabled': disabled }">
      <div v-if="showPrefix && (prefixIcon || actualPrefixIcon)" class="sc-ip-input__prefix">
        <IconifyIconOnline :icon="prefixIcon || actualPrefixIcon" />
      </div>

      <ul class="sc-ip-adress">
        <li v-for="(item, index) in ipAddress" :key="index">
          <input
            ref="ipInput"
            v-model="item.value"
            type="text"
            class="sc-ip-input-class"
            :disabled="disabled"
            :placeholder="placeholder?.split('.')[index] || ''"
            @input="checkIpVal(item)"
            @keyup="turnIpPosition(item, index, $event)"
            @keydown.190.prevent="moveFocusToNext(index)"
            @focus="handleFocus"
            @blur="handleBlur"
          />
          <div @click="!disabled && moveFocusToNext(index)" :class="{ clickable: !disabled }" />
        </li>
      </ul>

      <div v-if="clearable && hasValue && !disabled" class="sc-ip-input__suffix" @click="handleClear">
        <IconifyIconOnline icon="ep:circle-close-filled" />
      </div>
    </div>

    <div v-if="!validationResult.valid && showValidationMsg" class="sc-ip-input__error">
      {{ validationResult.message }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { validate } from "../validation";
import { getDefaultIcon } from "../defaultIcons";
import { IconifyIconOnline } from "@repo/components/ReIcon";

interface IpSegment {
  value: string;
}

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
   * 输入框类型
   */
  type?: string;
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
   * 数据获取函数
   */
  fetchMethod?: () => Promise<string>;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: "",
  placeholder: "",
  disabled: false,
  prefixIcon: "",
  showPrefix: true,
  clearable: true,
  type: "ip",
  rules: () => ({}),
  showValidationMsg: true,
  fetchMethod: undefined
});

const emit = defineEmits(["update:modelValue", "change", "input", "focus", "blur", "clear"]);

const ipInput = ref<HTMLInputElement[]>([]);
const ipAddress = ref<IpSegment[]>([{ value: "" }, { value: "" }, { value: "" }, { value: "" }]);

const actualPrefixIcon = computed(() => getDefaultIcon("ip"));

const hasValue = computed(() => {
  return ipAddress.value.some(item => item.value !== "");
});

// 当前IP地址
const currentIp = computed(() => {
  return ipAddress.value.map(item => item.value).join(".");
});

// 数据校验结果
const validationResult = ref<{ valid: boolean; message: string }>({ valid: true, message: "" });

// 加载中状态
const loading = ref(false);

// 监听模型值变化
watch(
  () => props.modelValue,
  newVal => {
    if (newVal) {
      const arr = newVal.split(".");
      for (let i = 0; i < Math.min(arr.length, 4); i++) {
        ipAddress.value[i].value = arr[i];
      }
    } else {
      // 如果没有值，清空所有段
      ipAddress.value.forEach(item => (item.value = ""));
    }
    validateValue();
  },
  { immediate: true }
);

// 监听IP地址变化
watch(
  ipAddress,
  () => {
    if (!props.disabled) {
      updateModelValue();
    }
  },
  { deep: true }
);

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

// 获取数据
const fetchData = async () => {
  if (!props.fetchMethod) return;

  try {
    loading.value = true;
    const data = await props.fetchMethod();
    if (data) {
      const arr = data.split(".");
      for (let i = 0; i < Math.min(arr.length, 4); i++) {
        ipAddress.value[i].value = arr[i];
      }
      emit("update:modelValue", data);
      validateValue();
    }
  } catch (error) {
    console.error("Failed to fetch IP data:", error);
  } finally {
    loading.value = false;
  }
};

// 初始化
onMounted(() => {
  if (props.modelValue) {
    const arr = props.modelValue.split(".");
    for (let i = 0; i < Math.min(arr.length, 4); i++) {
      ipAddress.value[i].value = arr[i];
    }
  } else if (props.fetchMethod) {
    // 如果没有初始值但有获取数据的方法，则加载数据
    fetchData();
  }
  validateValue();
});

// 校验IP值
function checkIpVal(item: IpSegment) {
  if (props.disabled) return;

  let val = item.value;
  // 处理非数字
  val = val.toString().replace(/[^0-9]/g, "");
  const num = parseInt(val, 10);

  if (isNaN(num)) {
    val = "";
  } else {
    val = num < 0 ? "0" : String(num);
    val = num > 255 ? "255" : String(num);
  }

  item.value = val;
  updateModelValue();
}

// 处理光标位置
function turnIpPosition(item: IpSegment, index: number, event: KeyboardEvent) {
  if (props.disabled) return;

  if (event.key === ".") {
    moveFocusToNext(index);
    return false;
  }

  if (event.key === "ArrowLeft") {
    // 左箭头向左跳转
    const target = event.target as HTMLInputElement;
    if (index !== 0 && target.selectionStart === 0) {
      ipInput.value[index - 1]?.focus();
    }
  } else if (event.key === "ArrowRight") {
    // 右箭头向右跳转
    const target = event.target as HTMLInputElement;
    if (index !== 3 && target.selectionStart === item.value.length) {
      ipInput.value[index + 1]?.focus();
    }
  } else if (event.key === "Backspace") {
    // 删除键跳转
    if (index !== 0 && item.value === "") {
      ipInput.value[index - 1]?.focus();
    }
  } else if (event.key === "Enter" || event.key === " " || event.key === ".") {
    // 回车键、空格键、点号均向右跳转
    moveFocusToNext(index);
  } else if (item.value.length === 3) {
    // 满3位，光标自动向下一个文本框
    moveFocusToNext(index);
  }
}

// 点击小数点或输入小数点时移动到下一个输入框
function moveFocusToNext(index: number) {
  if (props.disabled) return;

  if (index < 3) {
    ipInput.value[index + 1]?.focus();
  }
}

// 更新模型值
function updateModelValue() {
  if (props.disabled) return;

  const ip = ipAddress.value.map(item => item.value).join(".");
  emit("update:modelValue", ip);
  emit("change", ip);
  emit("input", ip);
  validateValue();
}

// 校验值
function validateValue() {
  if (props.disabled) return;

  if (props.rules) {
    validationResult.value = validate(currentIp.value, {
      ...props.rules,
      type: "ip"
    });
  }
}

// 处理焦点事件
function handleFocus(event: FocusEvent) {
  if (!props.disabled) {
    emit("focus", event);
  }
}

// 处理失焦事件
function handleBlur(event: FocusEvent) {
  if (!props.disabled) {
    validateValue();
    emit("blur", event);
  }
}

// 处理清空事件
function handleClear() {
  if (props.disabled) return;

  ipAddress.value.forEach(item => (item.value = ""));
  emit("update:modelValue", "");
  emit("change", "");
  emit("clear");
  validationResult.value = { valid: true, message: "" };
  ipInput.value[0]?.focus();
}
</script>

<style lang="scss" scoped>
.sc-ip-input-wrapper {
  width: 100%;

  &.is-invalid {
    .sc-ip-adress {
      border-color: var(--el-color-danger);
    }
  }
}

.sc-ip-input-container {
  display: flex;
  align-items: center;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background-color: var(--el-fill-color-blank, #fff);
  transition: all 0.2s;

  &:hover:not(.is-disabled) {
    border-color: var(--el-border-color-hover);
  }

  &:focus-within:not(.is-disabled) {
    border-color: var(--el-color-primary);
  }

  &.is-disabled {
    background-color: var(--el-disabled-bg-color);
    border-color: var(--el-disabled-border-color);
    color: var(--el-disabled-text-color);
    cursor: not-allowed;

    .sc-ip-input__prefix,
    .sc-ip-input__suffix {
      color: var(--el-disabled-text-color);
    }
  }
}

.sc-ip-input__prefix,
.sc-ip-input__suffix {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 8px;
  color: var(--el-text-color-placeholder);
}

.sc-ip-input__suffix {
  cursor: pointer;

  &:hover {
    color: var(--el-text-color-secondary);
  }
}

.sc-ip-adress {
  display: flex;
  border: none;
  width: auto;
  height: 36px;
  flex: 1;
  padding: 0;
  margin: 0;
}

.sc-ip-adress li {
  position: relative;
  height: 36px;
  margin: 0;
  padding: 0;
  list-style-type: none;
  display: flex;
  align-items: center;
}

.sc-ip-input-class {
  border: none;
  width: 49px;
  height: 100%;
  text-align: center;
  background: transparent;
  font-size: 14px;
  color: var(--el-text-color-regular);

  &:disabled {
    background-color: transparent;
    color: var(--el-disabled-text-color);
    cursor: not-allowed;
  }

  &::placeholder {
    color: var(--el-text-color-placeholder);
  }
}

.sc-ip-adress li div {
  position: absolute;
  bottom: 15px;
  right: 0;
  border-radius: 50%;
  background: var(--el-text-color-secondary);
  width: 3px;
  height: 3px;

  &.clickable {
    cursor: pointer;
  }
}

.sc-ip-adress li:last-child div {
  display: none;
}

.sc-ip-input-class:focus {
  outline: none;
}

.sc-ip-input__error {
  color: var(--el-color-danger);
  font-size: 12px;
  line-height: 1;
  padding-top: 4px;
  margin-left: 1px;
}
</style>
