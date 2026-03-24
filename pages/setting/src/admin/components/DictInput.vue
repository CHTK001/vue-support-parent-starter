<template>
  <div class="sc-dict-input">
    <div class="dict-header">
      <ScInput 
        v-model="jsonString"
        type="textarea"
        :rows="3"
        :disabled="disabled"
        :placeholder="placeholder"
        @blur="validateAndUpdate"
        class="dict-textarea"
      />
      
      <div class="dict-error" v-if="error">
        {{ error }}
      </div>
    </div>
    
    <div class="dict-items" v-if="isValidDict && showItems">
      <div 
        v-for="(item, index) in dictItems" 
        :key="index"
        class="dict-item"
      >
        <div class="item-key">{{ item.key }}</div>
        <div class="item-value">{{ item.value }}</div>
      </div>
      
      <div class="dict-empty" v-if="dictItems.length === 0">
        字典为空，请添加键值对
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';

/**
 * 组件属性定义
 */
interface Props {
  modelValue: string;            // 绑定值
  disabled?: boolean;            // 是否禁用
  placeholder?: string;          // 占位文本
  showItems?: boolean;           // 是否显示字典项
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '{}',
  disabled: false,
  placeholder: '请输入字典数据，如: {"key1": "value1", "key2": "value2"}',
  showItems: true
});

/**
 * 组件事件定义
 */
const emit = defineEmits(['update:modelValue']);

/**
 * 错误信息
 */
const error = ref('');

/**
 * JSON字符串，用于编辑
 */
const jsonString = ref(props.modelValue);

/**
 * 监听modelValue变化，更新jsonString
 */
watch(() => props.modelValue, (val) => {
  jsonString.value = val;
  validateJson(val);
});

/**
 * 解析后的字典
 */
const parsedDict = computed(() => {
  try {
    return JSON.parse(jsonString.value);
  } catch (e) {
    return {};
  }
});

/**
 * 字典项列表
 */
const dictItems = computed(() => {
  const dict = parsedDict.value;
  return Object.keys(dict).map(key => ({
    key,
    value: dict[key]
  }));
});

/**
 * 是否为有效的字典
 */
const isValidDict = computed(() => {
  try {
    const parsed = JSON.parse(jsonString.value);
    return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed);
  } catch (e) {
    return false;
  }
});

/**
 * 验证JSON格式
 */
const validateJson = (value: string) => {
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed) || typeof parsed !== 'object' || parsed === null) {
      error.value = '输入内容必须是有效的对象格式';
      return false;
    }
    error.value = '';
    return true;
  } catch (e) {
    error.value = '输入内容不是有效的JSON格式';
    return false;
  }
};

/**
 * 验证并更新值
 */
const validateAndUpdate = () => {
  if (validateJson(jsonString.value)) {
    // 格式化JSON字符串
    try {
      const formatted = JSON.stringify(JSON.parse(jsonString.value), null, 2);
      jsonString.value = formatted;
      emit('update:modelValue', formatted);
    } catch (e) {
      // 保持原样
      emit('update:modelValue', jsonString.value);
    }
  }
};
</script>

<style lang="scss">
.sc-dict-input {
  .dict-textarea {
    font-family: monospace;
    
    .el-textarea__inner {
      transition: all 0.3s;
      
      &:hover {
        box-shadow: 0 0 0 1px var(--el-color-primary-light-5);
      }
      
      &:focus {
        box-shadow: 0 0 0 1px var(--el-color-primary);
      }
    }
  }
  
  .dict-error {
    margin-top: 8px;
    color: var(--el-color-danger);
    font-size: 12px;
  }
  
  .dict-items {
    margin-top: 10px;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;
    overflow: hidden;
    
    .dict-item {
      display: flex;
      padding: 10px 12px;
      border-bottom: 1px solid var(--el-border-color-lighter);
      
      &:last-child {
        border-bottom: none;
      }
      
      &:nth-child(odd) {
        background-color: var(--el-fill-color-light);
      }
      
      .item-key {
        flex: 0 0 40%;
        font-weight: 500;
        color: var(--el-color-primary);
        padding-right: 10px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      
      .item-value {
        flex: 0 0 60%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
    
    .dict-empty {
      padding: 15px;
      text-align: center;
      color: var(--el-text-color-secondary);
      font-style: italic;
    }
  }
}
</style> 