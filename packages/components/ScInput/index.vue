<template>
  <div class="sc-input">
    <component
      :is="componentMap[type]"
      v-bind="$attrs"
      :model-value="modelValue"
      :type="type"
      :prefix-icon="prefixIcon || defaultIcon"
      :show-prefix="showPrefix"
      :rules="rules"
      :show-validation-msg="showValidationMsg"
      :options="options"
      :fetch-method="fetchMethod"
      :params="params"
      :loading="loading"
      @update:model-value="handleUpdate"
      @change="handleChange"
      @input="handleInput"
      @focus="handleFocus"
      @blur="handleBlur"
      @clear="handleClear"
    >
      <template v-if="$slots.default" #default>
        <slot />
      </template>
      <template v-if="$slots.prefix" #prefix>
        <slot name="prefix" />
      </template>
      <template v-if="$slots.suffix" #suffix>
        <slot name="suffix" />
      </template>
      <template v-if="$slots.prepend" #prepend>
        <slot name="prepend" />
      </template>
      <template v-if="$slots.append" #append>
        <slot name="append" />
      </template>
    </component>
  </div>
</template>

<script setup lang="ts">
import { computed, markRaw, defineAsyncComponent, ref, onMounted, watch } from 'vue';
import { InputType } from './types';
import { getDefaultIcon } from './defaultIcons';

// 使用异步组件导入各种类型的输入组件
const TextInput = defineAsyncComponent(() => import('./components/TextInput.vue'));
const TextareaInput = defineAsyncComponent(() => import('./components/TextareaInput.vue'));
const NumberInput = defineAsyncComponent(() => import('./components/NumberInput.vue'));
const PasswordInput = defineAsyncComponent(() => import('./components/PasswordInput.vue'));
const SearchInput = defineAsyncComponent(() => import('./components/SearchInput.vue'));
const EmailInput = defineAsyncComponent(() => import('./components/EmailInput.vue'));
const ColorInput = defineAsyncComponent(() => import('./components/ColorInput.vue'));
const BooleanInput = defineAsyncComponent(() => import('./components/BooleanInput.vue'));
const DictInput = defineAsyncComponent(() => import('./components/DictInput.vue'));
const IpInput = defineAsyncComponent(() => import('./components/IpInput.vue'));
const CaptchaInput = defineAsyncComponent(() => import('./components/CaptchaInput.vue'));
const SelectInput = defineAsyncComponent(() => import('./components/SelectInput.vue'));
const TotpInput = defineAsyncComponent(() => import('./components/TotpInput.vue'));

// 标记为原始类型以提高性能
const Components = {
  [InputType.TEXT]: markRaw(TextInput),
  [InputType.TEXTAREA]: markRaw(TextareaInput),
  [InputType.NUMBER]: markRaw(NumberInput),
  [InputType.PASSWORD]: markRaw(PasswordInput),
  [InputType.SEARCH]: markRaw(SearchInput),
  [InputType.EMAIL]: markRaw(EmailInput),
  [InputType.TEL]: markRaw(TextInput),
  [InputType.URL]: markRaw(TextInput),
  [InputType.DATE]: markRaw(TextInput),
  [InputType.DATETIME]: markRaw(TextInput),
  [InputType.MONTH]: markRaw(TextInput),
  [InputType.WEEK]: markRaw(TextInput),
  [InputType.TIME]: markRaw(TextInput),
  [InputType.YEAR]: markRaw(TextInput),
  [InputType.DATETIME_RANGE]: markRaw(TextInput),
  [InputType.DATE_RANGE]: markRaw(TextInput),
  [InputType.MONTH_RANGE]: markRaw(TextInput),
  [InputType.WEEK_RANGE]: markRaw(TextInput),
  [InputType.TIME_RANGE]: markRaw(TextInput),
  [InputType.COLOR]: markRaw(ColorInput),
  [InputType.IP]: markRaw(IpInput),
  [InputType.BOOLEAN]: markRaw(BooleanInput),
  [InputType.DICT]: markRaw(DictInput),
  [InputType.CARD]: markRaw(TextInput),
  [InputType.CAPTCHA]: markRaw(CaptchaInput),
  [InputType.SELECT]: markRaw(SelectInput),
  [InputType.TOTP]: markRaw(TotpInput)
};

export type OptionItem = {
  label: string;
  value: string | number | boolean;
  disabled?: boolean;
  [key: string]: any;
};

interface Props {
  /**
   * 输入框类型
   */
  type?: string;
  /**
   * 绑定值
   */
  modelValue?: string | number | boolean;
  /**
   * 输入框前缀图标
   */
  prefixIcon?: string;
  /**
   * 是否显示前缀图标
   */
  showPrefix?: boolean;
  /**
   * 校验规则
   */
  rules?: {
    required?: boolean;
    type?: string;
    message?: string;
    validator?: (value: any) => boolean | { valid: boolean; message: string };
    min?: number;
    max?: number;
    pattern?: RegExp;
  };
  /**
   * 是否显示校验消息
   */
  showValidationMsg?: boolean;
  /**
   * 选项数据
   */
  options?: OptionItem[];
  /**
   * 获取数据的方法
   */
  fetchMethod?: (params?: Record<string, any>) => Promise<any>;
  /**
   * 是否自动加载数据
   */
  autoLoad?: boolean;
  /**
   * 加载参数
   */
  fetchParams?: Record<string, any>;
  /**
   * 远程查询参数
   */
  params?: Record<string, any>;
}

const props = withDefaults(defineProps<Props>(), {
  type: InputType.TEXT,
  modelValue: '',
  prefixIcon: '',
  showPrefix: true,
  rules: () => ({}),
  showValidationMsg: true,
  options: () => [],
  fetchMethod: undefined,
  autoLoad: true,
  fetchParams: () => ({}),
  params: () => ({})
});

const emit = defineEmits(['update:modelValue', 'change', 'input', 'focus', 'blur', 'clear', 'options-loaded']);

// 加载状态
const loading = ref(false);
// 实际使用的选项数据
const optionsData = ref<OptionItem[]>([]);

// 组件映射，将输入类型映射到对应的组件
const componentMap = {
  [InputType.TEXT]: Components[InputType.TEXT],
  [InputType.TEXTAREA]: Components[InputType.TEXTAREA],
  [InputType.NUMBER]: Components[InputType.NUMBER],
  [InputType.PASSWORD]: Components[InputType.PASSWORD],
  [InputType.SEARCH]: Components[InputType.SEARCH],
  [InputType.EMAIL]: Components[InputType.EMAIL],
  [InputType.TEL]: Components[InputType.TEL],
  [InputType.URL]: Components[InputType.URL],
  [InputType.DATE]: Components[InputType.DATE],
  [InputType.DATETIME]: Components[InputType.DATETIME],
  [InputType.MONTH]: Components[InputType.MONTH],
  [InputType.WEEK]: Components[InputType.WEEK],
  [InputType.TIME]: Components[InputType.TIME],
  [InputType.YEAR]: Components[InputType.YEAR],
  [InputType.DATETIME_RANGE]: Components[InputType.DATETIME_RANGE],
  [InputType.DATE_RANGE]: Components[InputType.DATE_RANGE],
  [InputType.MONTH_RANGE]: Components[InputType.MONTH_RANGE],
  [InputType.WEEK_RANGE]: Components[InputType.WEEK_RANGE],
  [InputType.TIME_RANGE]: Components[InputType.TIME_RANGE],
  [InputType.COLOR]: Components[InputType.COLOR],
  [InputType.IP]: Components[InputType.IP],
  [InputType.BOOLEAN]: Components[InputType.BOOLEAN],
  [InputType.DICT]: Components[InputType.DICT],
  [InputType.CARD]: Components[InputType.CARD],
  [InputType.CAPTCHA]: Components[InputType.CAPTCHA],
  [InputType.SELECT]: Components[InputType.SELECT],
  [InputType.TOTP]: Components[InputType.TOTP]
};

/**
 * 获取默认图标
 */
const defaultIcon = computed(() => getDefaultIcon(props.type));

/**
 * 加载数据
 */
const loadData = async () => {
  if (!props.fetchMethod) {
    optionsData.value = props.options || [];
    return;
  }
  
  try {
    loading.value = true;
    const result = await props.fetchMethod(props.params);
    
    if (Array.isArray(result)) {
      optionsData.value = result;
    } else if (result && typeof result === 'object') {
      // 处理返回对象的情况，通常是接口返回的标准格式
      if (Array.isArray(result.data)) {
        optionsData.value = result.data;
      } else if (result.data && typeof result.data === 'object') {
        optionsData.value = Object.entries(result.data).map(([key, value]) => ({
          label: String(value),
          value: key
        }));
      }
    }
    
    emit('options-loaded', optionsData.value);
  } catch (error) {
    console.error('Failed to fetch options:', error);
    optionsData.value = props.options || [];
  } finally {
    loading.value = false;
  }
};

// 监听选项变化
watch(() => props.options, (newVal) => {
  if (!props.fetchMethod || !optionsData.value.length) {
    optionsData.value = newVal || [];
  }
}, { deep: true });

// 监听fetchMethod变化
watch(() => props.fetchMethod, () => {
  if (props.autoLoad) {
    loadData();
  }
});

// 监听fetchParams变化
watch(() => props.fetchParams, () => {
  if (props.autoLoad && props.fetchMethod) {
    loadData();
  }
}, { deep: true });

// 监听params变化
watch(() => props.params, () => {
  if (props.autoLoad && props.fetchMethod) {
    loadData();
  }
}, { deep: true });

onMounted(() => {
  if (props.autoLoad && props.fetchMethod) {
    loadData();
  } else {
    optionsData.value = props.options || [];
  }
});

/**
 * 处理值更新事件
 */
const handleUpdate = (value: string | number) => {
  emit('update:modelValue', value);
};

/**
 * 处理change事件
 */
const handleChange = (value: string | number) => {
  emit('change', value);
};

/**
 * 处理input事件
 */
const handleInput = (value: string | number) => {
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

// 对外暴露方法
defineExpose({
  loadData
});
</script>

<style lang="scss" scoped>
.sc-input {
  width: 100%;
  display: inline-block;
}
</style>