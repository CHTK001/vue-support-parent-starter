<template>
  <div class="sc-captcha-input-wrapper" :class="{ 'is-invalid': !validationResult.valid }">
    <div class="sc-captcha-container">
      <el-input 
        v-model="currentValue"
        class="sc-captcha-input"
        v-bind="$attrs"
        :placeholder="placeholder"
        :disabled="disabled"
        :maxlength="maxlength"
        :size="size"
        :clearable="clearable"
        @update:modelValue="handleUpdate"
        @change="handleChange"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
        @clear="handleClear"
      >
        <template #prefix v-if="showPrefix && (prefixIcon || actualPrefixIcon)">
          <IconifyIconOnline :icon="prefixIcon || actualPrefixIcon" class="sc-captcha-input__prefix-icon" />
        </template>
        <template v-if="$slots.prefix" #prefix>
          <slot name="prefix" />
        </template>
      </el-input>
      
      <div class="sc-captcha-image" @click="refreshCaptcha">
        <img v-if="captchaImage" :src="captchaImage" alt="验证码" :class="{ 'is-loading': loading }" />
        <div v-else-if="loading" class="sc-captcha-loading">
          <IconifyIconOnline icon="ep:loading" class="loading-icon" />
        </div>
        <div v-else class="sc-captcha-placeholder" @click="refreshCaptcha">
          <IconifyIconOnline icon="ep:refresh" />
          <span>点击获取</span>
        </div>
      </div>
    </div>
    
    <div v-if="!validationResult.valid && showValidationMsg" class="sc-captcha-input__error">
      {{ validationResult.message }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { validate } from '../validation';
import { getDefaultIcon } from '../defaultIcons';
import { IconifyIconOnline } from '@repo/components/ReIcon';

interface Props {
  /**
   * 绑定值
   */
  modelValue?: string | number;
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
   * 是否可清空
   */
  clearable?: boolean;
  /**
   * 验证码图片源
   */
  captchaSource?: string;
  /**
   * 验证码请求参数
   */
  captchaParams?: Record<string, any>;
  /**
   * 自定义刷新验证码的函数
   */
  refreshFunction?: () => Promise<string>;
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
  modelValue: '',
  placeholder: '请输入验证码',
  disabled: false,
  maxlength: 6,
  size: 'default',
  prefixIcon: '',
  showPrefix: true,
  clearable: true,
  captchaSource: '',
  captchaParams: () => ({}),
  rules: () => ({}),
  showValidationMsg: true
});

const emit = defineEmits([
  'update:modelValue',
  'change',
  'input',
  'focus',
  'blur',
  'clear',
  'refresh'
]);

const currentValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});

const actualPrefixIcon = computed(() => getDefaultIcon('captcha'));

// 验证码图片
const captchaImage = ref<string>('');
const loading = ref(false);
const timestamp = ref(Date.now());

// 数据校验结果
const validationResult = ref<{ valid: boolean; message: string }>({ valid: true, message: '' });

onMounted(() => {
  loadCaptcha();
});

// 加载验证码
async function loadCaptcha() {
  if (loading.value) return;
  
  loading.value = true;
  try {
    if (props.refreshFunction) {
      captchaImage.value = await props.refreshFunction();
    } else if (props.captchaSource) {
      // 构建带时间戳参数的验证码URL，防止缓存
      const url = new URL(props.captchaSource);
      const params = new URLSearchParams(url.search);
      
      // 添加时间戳
      params.set('_t', timestamp.value.toString());
      
      // 添加自定义参数
      if (props.captchaParams) {
        Object.entries(props.captchaParams).forEach(([key, value]) => {
          params.set(key, String(value));
        });
      }
      
      url.search = params.toString();
      captchaImage.value = url.toString();
    }
  } catch (error) {
    console.error('加载验证码失败', error);
  } finally {
    loading.value = false;
  }
}

// 刷新验证码
function refreshCaptcha() {
  timestamp.value = Date.now();
  loadCaptcha();
  emit('refresh', timestamp.value);
}

// 处理值更新事件
function handleUpdate(value: string | number) {
  validationResult.value = validate(value, props.rules);
  emit('update:modelValue', value);
}

// 处理change事件
function handleChange(value: string | number) {
  validationResult.value = validate(value, props.rules);
  emit('change', value);
}

// 处理input事件
function handleInput(value: string | number) {
  emit('input', value);
}

// 处理focus事件
function handleFocus(event: FocusEvent) {
  emit('focus', event);
}

// 处理blur事件
function handleBlur(event: FocusEvent) {
  validationResult.value = validate(props.modelValue, props.rules);
  emit('blur', event);
}

// 处理clear事件
function handleClear() {
  validationResult.value = { valid: true, message: '' };
  emit('clear');
}
</script>

<style lang="scss" scoped>
.sc-captcha-input-wrapper {
  width: 100%;
  
  &.is-invalid {
    .sc-captcha-input :deep(.el-input__wrapper) {
      box-shadow: 0 0 0 1px var(--el-color-danger) inset;
    }
  }
}

.sc-captcha-container {
  display: flex;
  width: 100%;
  gap: 12px;
}

.sc-captcha-input {
  flex: 1;
}

.sc-captcha-image {
  height: 36px;
  min-width: 100px;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f7fa;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: opacity 0.3s;
    
    &.is-loading {
      opacity: 0.6;
    }
  }
}

.sc-captcha-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  gap: 4px;
  
  svg {
    font-size: 16px;
  }
}

.sc-captcha-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--el-color-primary);
  
  .loading-icon {
    animation: rotate 1s linear infinite;
  }
}

.sc-captcha-input__error {
  color: var(--el-color-danger);
  font-size: 12px;
  line-height: 1;
  padding-top: 4px;
  margin-left: 1px;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style> 