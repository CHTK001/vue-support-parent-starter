<template>
  <div class="sc-password-input-wrapper">
    <div class="sc-password-input-container">
      <el-input
        v-model="currentValue"
        class="sc-password-input"
        type="password"
        show-password
        v-bind="$attrs"
        @update:modelValue="handleUpdate"
        @change="handleChange"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
        @clear="handleClear"
      >
        <template v-if="showPrefix && (prefixIcon || defaultPrefixIcon)" #prefix>
          <IconifyIconOnline :icon="prefixIcon || defaultPrefixIcon" class="sc-password-input__prefix-icon" />
        </template>
        <template v-if="tip && tipPosition === 'right'" #suffix>
          <el-tooltip :content="tip" placement="top">
            <IconifyIconOnline icon="ri:question-line" class="sc-password-input__tip-icon" />
          </el-tooltip>
        </template>
        <template v-for="(_, name) in $slots" #[name]="slotData" :key="name">
          <slot :name="name" v-bind="slotData || {}" />
        </template>
      </el-input>
    </div>
    <div v-if="tip && tipPosition === 'bottom'" class="sc-password-input__tip-bottom">
      {{ tip }}
    </div>
    <div v-if="passwdStrong !== 'none' && showStrengthMeter && currentValue" class="sc-password-strength">
      <div class="sc-password-strength__label">
        密码强度:
        <span>{{ strengthText }}</span>
      </div>
      <div class="sc-password-strength__meter">
        <div class="sc-password-strength__meter-bar" :style="{ width: `${strength * 25}%` }" :class="`sc-password-strength__meter-bar--${strengthLevel}`" />
      </div>
      <div v-if="showStrengthTips" class="sc-password-strength__tips">
        <p>强密码应包含：</p>
        <ul>
          <li :class="{ 'is-valid': hasLowerCase }">小写字母</li>
          <li :class="{ 'is-valid': hasUpperCase }">大写字母</li>
          <li :class="{ 'is-valid': hasNumber }">数字</li>
          <li :class="{ 'is-valid': hasSpecialChar }">特殊字符</li>
          <li :class="{ 'is-valid': hasMinLength }">至少8个字符</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { IconifyIconOnline } from "@repo/components/ReIcon";
import { getDefaultIcon } from "../defaultIcons";

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
   * 最大输入长度
   */
  maxlength?: string | number;
  /**
   * 是否显示输入字数统计
   */
  showWordLimit?: boolean;
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
   * 输入框后缀图标
   */
  suffixIcon?: string;
  /**
   * 是否可清空
   */
  clearable?: boolean;
  /**
   * 自动获取焦点
   */
  autofocus?: boolean;
  /**
   * 是否显示密码强度计
   */
  showStrengthMeter?: boolean;
  /**
   * 是否显示密码强度提示
   */
  showStrengthTips?: boolean;
  /**
   * 最小密码长度
   */
  minLength?: number;
  /**
   * 提示文本
   */
  tip?: string;
  /**
   * 提示位置，right: 右侧图标，bottom: 底部文字
   */
  tipPosition?: "right" | "bottom";
  /**
   * 密码强度检测，passwd-strong开启，none不开启
   */
  passwdStrong?: "passwd-strong" | "none";
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: "",
  placeholder: "",
  disabled: false,
  maxlength: undefined,
  showWordLimit: false,
  size: "default",
  prefixIcon: "",
  showPrefix: true,
  suffixIcon: "",
  clearable: true,
  autofocus: false,
  showStrengthMeter: true,
  showStrengthTips: true,
  minLength: 8,
  tip: "",
  tipPosition: "right",
  passwdStrong: "passwd-strong"
});

const emit = defineEmits(["update:modelValue", "change", "input", "focus", "blur", "clear", "strength-change"]);

const currentValue = computed({
  get: () => props.modelValue,
  set: val => emit("update:modelValue", val)
});

// 密码强度计算
const hasLowerCase = computed(() => /[a-z]/.test(props.modelValue || ""));
const hasUpperCase = computed(() => /[A-Z]/.test(props.modelValue || ""));
const hasNumber = computed(() => /[0-9]/.test(props.modelValue || ""));
const hasSpecialChar = computed(() => /[^A-Za-z0-9]/.test(props.modelValue || ""));
const hasMinLength = computed(() => (props.modelValue || "").length >= props.minLength);

// 计算总体强度 (0-4)
const strength = computed(() => {
  if (!props.modelValue || props.passwdStrong === "none") return 0;

  let score = 0;
  if (hasLowerCase.value) score++;
  if (hasUpperCase.value) score++;
  if (hasNumber.value) score++;
  if (hasSpecialChar.value) score++;
  if (!hasMinLength.value) score = Math.min(score, 1); // 长度不够，最多为弱密码

  return score;
});

// 强度等级
const strengthLevel = computed(() => {
  switch (strength.value) {
    case 0:
      return "none";
    case 1:
      return "weak";
    case 2:
      return "medium";
    case 3:
      return "strong";
    case 4:
      return "very-strong";
    default:
      return "none";
  }
});

// 强度文字描述
const strengthText = computed(() => {
  switch (strength.value) {
    case 0:
      return "无";
    case 1:
      return "弱";
    case 2:
      return "中";
    case 3:
      return "强";
    case 4:
      return "非常强";
    default:
      return "无";
  }
});

// 默认前缀图标
const defaultPrefixIcon = computed(() => getDefaultIcon("password"));

/**
 * 处理值更新事件
 */
const handleUpdate = (value: string) => {
  emit("update:modelValue", value);
  // 当密码变化时发出强度变化事件，只有在开启密码强度校验时才发出
  if (props.passwdStrong !== "none") {
    emit("strength-change", {
      value,
      strength: strength.value,
      strengthLevel: strengthLevel.value,
      valid: strength.value >= 2 // 中等及以上强度认为有效
    });
  }
};

/**
 * 处理change事件
 */
const handleChange = (value: string) => {
  emit("change", value);
};

/**
 * 处理input事件
 */
const handleInput = (value: string) => {
  emit("input", value);
};

/**
 * 处理focus事件
 */
const handleFocus = (event: FocusEvent) => {
  emit("focus", event);
};

/**
 * 处理blur事件
 */
const handleBlur = (event: FocusEvent) => {
  emit("blur", event);
};

/**
 * 处理clear事件
 */
const handleClear = () => {
  emit("clear");
};
</script>

<style lang="scss" scoped>
.sc-password-input-wrapper {
  display: flex;
  flex-direction: column;
  width: 100%;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  // 悬停效果
  &:hover {
    transform: translateY(-1px);
  }

  // 聚焦状态
  &:focus-within {
    transform: translateY(-2px);
  }
}

.sc-password-input-container {
  position: relative;
  width: 100%;
  flex: 1;
}

.sc-password-input {
  width: 100%;

  // 现代化的密码输入框样式
  :deep(.el-input__wrapper) {
    border-radius: 8px;
    box-shadow: var(--el-box-shadow-lighter);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
      box-shadow: var(--el-box-shadow-light);
      transform: translateY(-1px);
    }

    &.is-focus {
      box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.2);
      transform: translateY(-2px);
    }
  }

  // 密码显示/隐藏按钮美化
  :deep(.el-input__suffix) {
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

  &__prefix-icon {
    color: var(--el-text-color-placeholder);
    font-size: 16px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
      color: var(--el-color-primary);
      transform: scale(1.1);
    }
  }

  &__tip-icon {
    margin-right: 8px;
    color: var(--el-text-color-secondary);
    font-size: 16px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
      color: var(--el-color-primary);
      transform: scale(1.2);
    }
  }

  &__tip-bottom {
    margin-top: 4px;
    font-size: 12px;
    line-height: 1.4;
    color: var(--el-text-color-secondary);
    animation: fadeInUp 0.3s ease-out;
    padding: 8px 12px;
    background: linear-gradient(135deg, var(--el-fill-color-extra-light), var(--el-fill-color-light));
    border-radius: 6px;
    border-left: 3px solid var(--el-color-primary);
  }
}

.sc-password-strength {
  margin-top: 12px;
  font-size: 12px;
  padding: 12px;
  background: linear-gradient(135deg, var(--el-fill-color-extra-light), var(--el-fill-color-light));
  border-radius: 8px;
  border: 1px solid var(--el-border-color-lighter);
  animation: fadeInUp 0.3s ease-out;

  &__label {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    color: var(--el-text-color-secondary);
    font-size: 13px;
    font-weight: 500;

    span {
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 4px;
      background: var(--el-fill-color);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
  }

  &__meter {
    width: 100%;
    height: 6px;
    background-color: var(--el-fill-color);
    border-radius: 3px;
    overflow: hidden;
    position: relative;
    box-shadow: inset 0 1px 2px var(--el-border-color-lighter);
  }

  &__meter-bar {
    height: 100%;
    border-radius: 3px;
    transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;

    &::after {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
      animation: shimmer 2s ease-in-out infinite;
    }

    &--none {
      background-color: transparent;
    }

    &--weak {
      background: linear-gradient(135deg, #f56c6c, #f78989);
    }

    &--medium {
      background: linear-gradient(135deg, #e6a23c, #eebe77);
    }

    &--strong {
      background: linear-gradient(135deg, #67c23a, #85ce61);
    }

    &--very-strong {
      background: linear-gradient(135deg, #409eff, #66b1ff);
    }
  }

  &__tips {
    margin-top: 12px;
    padding: 12px;
    background-color: var(--el-fill-color-extra-light);
    border-radius: 6px;
    border: 1px solid var(--el-border-color-lighter);

    p {
      margin: 0 0 8px;
      color: var(--el-text-color-secondary);
      font-weight: 500;
      font-size: 13px;
    }

    ul {
      margin: 0;
      padding-left: 0;
      list-style: none;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 6px;

      li {
        display: flex;
        align-items: center;
        padding: 4px 8px;
        border-radius: 4px;
        color: var(--el-text-color-secondary);
        font-size: 12px;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        background: var(--el-fill-color);

        &::before {
          content: "✗";
          margin-right: 6px;
          color: var(--el-color-danger);
          font-weight: bold;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        &.is-valid {
          color: var(--el-color-success);
          font-weight: 500;
          background: linear-gradient(135deg, var(--el-color-success-light-9), var(--el-color-success-light-8));
          border: 1px solid var(--el-color-success-light-7);
          transform: scale(1.02);

          &::before {
            content: "✓";
            color: var(--el-color-success);
          }
        }
      }
    }
  }
}

// 动画定义
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

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

// 响应式设计
@media (max-width: 768px) {
  .sc-password-input-wrapper {
    &:hover,
    &:focus-within {
      transform: none;
    }
  }

  .sc-password-input {
    :deep(.el-input__wrapper) {
      &:hover,
      &.is-focus {
        transform: none;
      }
    }
  }

  .sc-password-strength {
    &__tips {
      ul {
        grid-template-columns: 1fr;
      }
    }
  }
}
</style>
