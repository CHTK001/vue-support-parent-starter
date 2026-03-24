<template>
  <div class="sc-password-input">
    <ScInput v-model="innerValue" :type="showPassword ? 'text' : 'password'" :disabled="disabled" :placeholder="placeholder" :show-password="!showPassword" class="password-field">
      <template #prefix>
        <IconifyIconOnline icon="ep:lock" />
      </template>
      <template #suffix v-if="showPassword">
        <ScIcon class="el-input__icon" @click="showPassword = false">
          <IconifyIconOnline icon="ep:view" />
        </ScIcon>
      </template>
    </ScInput>

    <div class="password-strength" v-if="showStrength && !disabled">
      <div class="strength-label">密码强度:</div>
      <div class="strength-meter">
        <div class="strength-bar" :style="{ width: `${strengthPercentage}%` }" :class="strengthClass"></div>
      </div>
      <div class="strength-text" :class="strengthClass">{{ strengthText }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

/**
 * 组件属性定义
 */
interface Props {
  modelValue: string; // 绑定值
  disabled?: boolean; // 是否禁用
  placeholder?: string; // 占位文本
  showStrength?: boolean; // 是否显示密码强度
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: "",
  disabled: false,
  placeholder: "请输入密码",
  showStrength: true,
});

/**
 * 组件事件定义
 */
const emit = defineEmits(["update:modelValue"]);

/**
 * 内部值，用于双向绑定
 */
const innerValue = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

/**
 * 是否显示密码
 */
const showPassword = ref(false);

/**
 * 计算密码强度
 * @returns {number} 密码强度分数 (0-100)
 */
const calculateStrength = () => {
  const password = innerValue.value;
  if (!password) return 0;

  let score = 0;

  // 长度得分
  score += Math.min(password.length * 4, 25);

  // 包含小写字母
  if (/[a-z]/.test(password)) score += 10;

  // 包含大写字母
  if (/[A-Z]/.test(password)) score += 15;

  // 包含数字
  if (/[0-9]/.test(password)) score += 10;

  // 包含特殊字符
  if (/[^a-zA-Z0-9]/.test(password)) score += 15;

  // 字符多样性
  const uniqueChars = new Set(password.split("")).size;
  score += Math.min(uniqueChars * 2, 15);

  // 最高100分
  return Math.min(score, 100);
};

/**
 * 密码强度百分比
 */
const strengthPercentage = computed(() => calculateStrength());

/**
 * 密码强度文本
 */
const strengthText = computed(() => {
  const score = strengthPercentage.value;
  if (score < 30) return "弱";
  if (score < 60) return "中";
  if (score < 80) return "强";
  return "非常强";
});

/**
 * 密码强度样式类
 */
const strengthClass = computed(() => {
  const score = strengthPercentage.value;
  if (score < 30) return "strength-weak";
  if (score < 60) return "strength-medium";
  if (score < 80) return "strength-strong";
  return "strength-very-strong";
});
</script>

<style lang="scss">
.sc-password-input {
  .password-field {
    .el-input__wrapper {
      transition: all 0.3s;

      &:hover {
        box-shadow: 0 0 0 1px var(--el-color-primary-light-5);
      }

      &.is-focus {
        box-shadow: 0 0 0 1px var(--el-color-primary);
      }
    }
  }

  .password-strength {
    margin-top: 8px;
    display: flex;
    align-items: center;
    gap: 10px;

    .strength-label {
      font-size: 12px;
      color: var(--el-text-color-secondary);
      white-space: nowrap;
    }

    .strength-meter {
      flex: 1;
      height: 4px;
      background-color: var(--el-fill-color-darker);
      border-radius: 2px;
      overflow: hidden;

      .strength-bar {
        height: 100%;
        transition:
          width 0.3s,
          background-color 0.3s;

        &.strength-weak {
          background-color: var(--el-color-danger);
        }

        &.strength-medium {
          background-color: var(--el-color-warning);
        }

        &.strength-strong {
          background-color: var(--el-color-success);
        }

        &.strength-very-strong {
          background-color: var(--el-color-success);
        }
      }
    }

    .strength-text {
      font-size: 12px;
      font-weight: 500;

      &.strength-weak {
        color: var(--el-color-danger);
      }

      &.strength-medium {
        color: var(--el-color-warning);
      }

      &.strength-strong {
        color: var(--el-color-success);
      }

      &.strength-very-strong {
        color: var(--el-color-success);
      }
    }
  }
}
</style>
