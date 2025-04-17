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
        <template #prefix v-if="showPrefix && (prefixIcon || defaultPrefixIcon)">
          <IconifyIconOnline :icon="prefixIcon || defaultPrefixIcon" class="sc-password-input__prefix-icon" />
        </template>
        <template #suffix v-if="tip && tipPosition === 'right'">
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
      <div class="sc-password-strength__label">密码强度: <span>{{ strengthText }}</span></div>
      <div class="sc-password-strength__meter">
        <div
          class="sc-password-strength__meter-bar"
          :style="{ width: `${strength * 25}%` }"
          :class="`sc-password-strength__meter-bar--${strengthLevel}`"
        ></div>
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
import { computed, ref } from 'vue';
import { IconifyIconOnline } from '@repo/components/ReIcon';
import { getDefaultIcon } from '../defaultIcons';

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
  size?: 'large' | 'default' | 'small';
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
  tipPosition?: 'right' | 'bottom';
  /**
   * 密码强度检测，passwd-strong开启，none不开启
   */
  passwdStrong?: 'passwd-strong' | 'none';
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: '',
  disabled: false,
  maxlength: undefined,
  showWordLimit: false,
  size: 'default',
  prefixIcon: '',
  showPrefix: true,
  suffixIcon: '',
  clearable: true,
  autofocus: false,
  showStrengthMeter: true,
  showStrengthTips: true,
  minLength: 8,
  tip: '',
  tipPosition: 'right',
  passwdStrong: 'passwd-strong'
});

const emit = defineEmits([
  'update:modelValue',
  'change',
  'input',
  'focus',
  'blur',
  'clear',
  'strength-change'
]);

const currentValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});

// 密码强度计算
const hasLowerCase = computed(() => /[a-z]/.test(props.modelValue || ''));
const hasUpperCase = computed(() => /[A-Z]/.test(props.modelValue || ''));
const hasNumber = computed(() => /[0-9]/.test(props.modelValue || ''));
const hasSpecialChar = computed(() => /[^A-Za-z0-9]/.test(props.modelValue || ''));
const hasMinLength = computed(() => (props.modelValue || '').length >= props.minLength);

// 计算总体强度 (0-4)
const strength = computed(() => {
  if (!props.modelValue || props.passwdStrong === 'none') return 0;
  
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
    case 0: return 'none';
    case 1: return 'weak';
    case 2: return 'medium';
    case 3: return 'strong';
    case 4: return 'very-strong';
    default: return 'none';
  }
});

// 强度文字描述
const strengthText = computed(() => {
  switch (strength.value) {
    case 0: return '无';
    case 1: return '弱';
    case 2: return '中';
    case 3: return '强';
    case 4: return '非常强';
    default: return '无';
  }
});

// 默认前缀图标
const defaultPrefixIcon = computed(() => getDefaultIcon('password'));

/**
 * 处理值更新事件
 */
const handleUpdate = (value: string) => {
  emit('update:modelValue', value);
  // 当密码变化时发出强度变化事件，只有在开启密码强度校验时才发出
  if (props.passwdStrong !== 'none') {
    emit('strength-change', {
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
  emit('change', value);
};

/**
 * 处理input事件
 */
const handleInput = (value: string) => {
  emit('input', value);
};

/**
 * 处理focus事件
 */
const handleFocus = (event: FocusEvent) => {
  emit('focus', event);
};

/**
 * 处理blur事件
 */
const handleBlur = (event: FocusEvent) => {
  emit('blur', event);
};

/**
 * 处理clear事件
 */
const handleClear = () => {
  emit('clear');
};
</script>

<style lang="scss" scoped>
.sc-password-input-wrapper {
  width: 100%;
}

.sc-password-input-container {
  position: relative;
  width: 100%;
}

.sc-password-input {
  width: 100%;
  
  &__prefix-icon {
    color: var(--el-text-color-placeholder);
    font-size: 16px;
  }
  
  &__tip-icon {
    margin-right: 8px;
    color: var(--el-text-color-secondary);
    font-size: 16px;
    cursor: pointer;
    
    &:hover {
      color: var(--el-color-primary);
    }
  }
  
  &__tip-bottom {
    margin-top: 4px;
    font-size: 12px;
    line-height: 1.4;
    color: var(--el-text-color-secondary);
  }
}

.sc-password-strength {
  margin-top: 5px;
  font-size: 12px;
  
  &__label {
    display: flex;
    justify-content: space-between;
    margin-bottom: 4px;
    color: var(--el-text-color-secondary);
    
    span {
      font-weight: 500;
    }
  }
  
  &__meter {
    width: 100%;
    height: 4px;
    background-color: var(--el-border-color-lighter);
    border-radius: 2px;
    overflow: hidden;
  }
  
  &__meter-bar {
    height: 100%;
    border-radius: 2px;
    transition: width 0.3s ease;
    
    &--none {
      background-color: transparent;
    }
    
    &--weak {
      background-color: #f56c6c;
    }
    
    &--medium {
      background-color: #e6a23c;
    }
    
    &--strong {
      background-color: #67c23a;
    }
    
    &--very-strong {
      background-color: #409eff;
    }
  }
  
  &__tips {
    margin-top: 8px;
    padding: 8px;
    background-color: var(--el-fill-color-light);
    border-radius: 4px;
    
    p {
      margin: 0 0 4px;
      color: var(--el-text-color-secondary);
    }
    
    ul {
      margin: 0;
      padding-left: 16px;
      list-style-type: circle;
      
      li {
        margin-bottom: 2px;
        color: var(--el-text-color-secondary);
        
        &.is-valid {
          color: var(--el-color-success);
          font-weight: 500;
        }
      }
    }
  }
}
</style>