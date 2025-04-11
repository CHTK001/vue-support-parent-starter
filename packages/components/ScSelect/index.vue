<template>
  <div class="card-selector-container">
    <!-- 原生select布局 -->
    <div v-if="layout === 'select'" class="selector-native-wrapper">
      <el-select 
        v-model="selectValue"
        :multiple="multiple"
        class="selector-native-select"
        @change="handleNativeSelectChange"
        collapse-tags
        collapse-tags-tooltip
        :max-collapse-tags="maxCollapseTags"
        filterable
        :reserve-keyword="false"
        :multiple-limit="multiple ? limit : 0"
      >
        <!-- 多选模式下显示批量操作按钮作为第一个选项 -->
        <el-option v-if="multiple && options.length > 1 && showBatchActions" :value="'__actions__'" :disabled="true" class="select-actions-option">
          <div class="select-actions-container" @click.stop>
            <div class="select-action-title">
              <el-button type="primary" plain size="small" @click.stop="selectAll">
                <IconifyIconOnline icon="ep:select" class="action-icon" />
                <span>全选</span>
              </el-button>
              <el-button type="info" plain size="small" @click.stop="invertSelection">
                <IconifyIconOnline icon="ep:refresh-right" class="action-icon" />
                <span>反选</span>
              </el-button>
              <el-button type="danger" plain size="small" @click.stop="clearSelection">
                <IconifyIconOnline icon="ep:delete" class="action-icon" />
                <span>清空</span>
              </el-button>
            </div>
          </div>
        </el-option>
        
        <!-- 选项列表 -->
        <el-option
          v-for="item in options"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        >
          <div class="select-option-content select-flex">
              <IconifyIconOnline v-if="item.icon" :icon="item.icon" class="select-option-icon" />
              <span>{{ item.label }}</span>
          </div>
        </el-option>
      </el-select>
    </div>

    <!-- 卡片选择器布局 -->
    <div 
      v-else
      class="card-selector-grid" 
      :class="[`layout-${layout}`]"
      :style="gridStyle"
    >
      <!-- 批量操作按钮（非select布局下） -->
      <div v-if="multiple && options.length > 1 && showBatchActions" class="card-batch-actions">
        <el-button-group>
          <el-button type="primary" size="small" @click="selectAll">
            <IconifyIconOnline icon="ep:select" class="action-icon" />
            <span>全选</span>
          </el-button>
          <el-button type="info" size="small" @click="invertSelection">
            <IconifyIconOnline icon="ep:refresh-right" class="action-icon" />
            <span>反选</span>
          </el-button>
          <el-button type="danger" size="small" @click="clearSelection">
            <IconifyIconOnline icon="ep:delete" class="action-icon" />
            <span>清空</span>
          </el-button>
        </el-button-group>
      </div>
      
      <div
        v-for="item in options"
        :key="item.value"
        class="card-selector-item"
        :class="{ 
          active: isSelected(item.value),
          disabled: isItemDisabled(item.value)
        }"
        @click="handleSelect(item.value)"
      >
        <div class="card-icon">
          <IconifyIconOnline :icon="item.icon" />
        </div>
        <div class="card-label">{{ item.label }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineProps, defineEmits, ref, watch } from "vue";
import { IconifyIconOnline } from "../ReIcon";

interface CardOption {
  label: string;
  value: string | number;
  icon: string;
}

const props = defineProps({
  // v-model绑定值
  modelValue: {
    type: [String, Number, Array],
    default: "",
  },
  // 选项数组
  options: {
    type: Array as () => CardOption[],
    required: true,
  },
  // 每行显示的卡片数量
  columns: {
    type: Number,
    default: 3,
  },
  // 卡片间距
  gap: {
    type: Number,
    default: 12,
  },
  // 布局类型
  layout: {
    type: String,
    default: "platform",
    validator: (value: string) => {
      return ["card", "list", "compact", "grid", "platform", "select"].includes(value);
    }
  },
  // 是否多选
  multiple: {
    type: Boolean,
    default: false
  },
  // 多选模式下最多可选择的数量
  limit: {
    type: Number,
    default: 0 // 0表示不限制
  },
  // 多选模式下最多显示的标签数量
  maxCollapseTags: {
    type: Number,
    default: 1
  },
  // 是否显示批量操作按钮
  showBatchActions: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(["update:modelValue", "change"]);

// 原生select绑定值
const selectValue = ref(props.modelValue);

// 监听modelValue变化同步到selectValue
watch(() => props.modelValue, (newValue) => {
  selectValue.value = newValue;
});

// 检查是否已达到选择上限
const isReachedLimit = computed(() => {
  if (!props.multiple || props.limit <= 0) return false;
  return Array.isArray(props.modelValue) && props.modelValue.length >= props.limit;
});

// 判断选项是否应该被禁用（已达到限制且未被选中）
const isItemDisabled = (value: string | number) => {
  if (!props.multiple || props.limit <= 0) return false;
  
  // 如果已达到限制，且当前项未被选中，则禁用
  if (isReachedLimit.value && !isSelected(value)) {
    return true;
  }
  
  return false;
};

// 处理原生select变化
const handleNativeSelectChange = (value: string | number | Array<string | number>) => {
  // 过滤掉可能的__actions__值
  if (Array.isArray(value)) {
    const filteredValue = value.filter(v => v !== '__actions__');
    emit("update:modelValue", filteredValue);
    emit("change", filteredValue);
  } else {
    emit("update:modelValue", value);
    emit("change", value);
  }
};

// 全选
const selectAll = () => {
  if (!props.multiple) return;
  
  let allValues = props.options.map(item => item.value);
  
  // 如果有数量限制，截取到限制数量
  if (props.limit > 0 && allValues.length > props.limit) {
    allValues = allValues.slice(0, props.limit);
  }
  
  emit("update:modelValue", allValues);
  emit("change", allValues);
  selectValue.value = allValues;
};

// 反选
const invertSelection = () => {
  if (!props.multiple || !Array.isArray(props.modelValue)) return;
  
  const currentValues = props.modelValue as (string | number)[];
  let invertedValues = props.options
    .map(item => item.value)
    .filter(value => !currentValues.includes(value));
    
  // 如果有数量限制，截取到限制数量
  if (props.limit > 0 && invertedValues.length > props.limit) {
    invertedValues = invertedValues.slice(0, props.limit);
  }
  
  emit("update:modelValue", invertedValues);
  emit("change", invertedValues);
  selectValue.value = invertedValues;
};

// 清空选择
const clearSelection = () => {
  if (!props.multiple) return;
  
  const emptyArray: (string | number)[] = [];
  emit("update:modelValue", emptyArray);
  emit("change", emptyArray);
  selectValue.value = emptyArray;
};

// 计算网格样式
const gridStyle = computed(() => {
  return {
    gridTemplateColumns: `repeat(${props.columns}, 1fr)`,
    gap: `${props.gap}px`,
  };
});

// 判断选项是否被选中
const isSelected = (value: string | number) => {
  if (props.multiple) {
    // 多选模式下，检查值是否在数组中
    return Array.isArray(props.modelValue) && props.modelValue.includes(value);
  } else {
    // 单选模式下，直接比较值
    return props.modelValue === value;
  }
};

// 选择卡片
const handleSelect = (value: string | number) => {
  if (props.multiple) {
    // 多选模式
    let newValue: (string | number)[] = [];
    
    if (Array.isArray(props.modelValue)) {
      // 如果已经是数组，复制一份
      //@ts-ignore
      newValue = [...props.modelValue];
      
      // 切换选中状态：如果已选中则移除，否则添加
      const index = newValue.indexOf(value);
      if (index > -1) {
        // 移除已选中的项
        newValue.splice(index, 1);
      } else {
        // 添加新项，但需要检查是否已达到限制
        if (props.limit <= 0 || newValue.length < props.limit) {
          newValue.push(value);
        }
      }
    } else {
      // 如果不是数组，创建一个新数组并添加当前值
      newValue = [value];
    }
    
    emit("update:modelValue", newValue);
    emit("change", newValue);
  } else {
    // 单选模式
    emit("update:modelValue", value);
    emit("change", value);
  }
};
</script>

<style lang="scss" scoped>
.select-flex {
  display: flex;
  justify-content: flex-start;
  > svg {
    margin-top: 10px;
    margin-right: 4px;
  }
}
.card-selector-container {
  width: 100%;

  // 通用图标样式
  .action-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    margin-right: 4px;
    vertical-align: middle;
  }

  // 原生select样式
  .selector-native-wrapper {
    width: 100%;
    
    .selector-native-select {
      width: 100%;
    }
  }
  
  // 批量操作选项样式
  .select-actions-option {
    background-color: var(--el-fill-color-light);
    pointer-events: auto !important;
    
    &:hover {
      background-color: var(--el-fill-color-light);
    }
  }
  
  // 下拉框内的批量操作区域
  .select-actions-container {
    padding: 8px 12px;
    width: 100%;
    border-bottom: 1px solid var(--el-border-color-light);
    
    .select-action-title {
      font-size: 13px;
      color: var(--el-text-color-secondary);
      font-weight: bold;
      margin-bottom: 12px;
      
      .select-action-row {
        margin-top: 10px;
        display: flex;
        justify-content: space-between;
        gap: 8px;
        
        .el-button {
          flex: 1;
          font-size: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      }
    }
  }
  
  // 卡片布局下的批量操作按钮
  .card-batch-actions {
    grid-column: 1 / -1; // 占据整行
    display: flex;
    justify-content: flex-end;
    margin-bottom: 12px;
    
    .el-button-group {
      .el-button {
        display: flex;
        align-items: center;
      }
    }
  }
  
  .select-option-content {
    display: flex;
    align-items: center;
    white-space: nowrap;
    
    .select-option-icon {
      margin-right: 8px;
      padding-top: 8px;
      font-size: 24px;
      color: var(--el-color-primary);
    }
  }

  .card-selector-grid {
    display: grid;
    width: 100%;

    // 默认卡片布局（与layout-card相同）
    .card-selector-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 16px 8px;
      border-radius: 8px;
      border: 1px solid var(--el-border-color);
      cursor: pointer;
      transition: all 0.3s ease;
      background-color: var(--el-fill-color-blank);
      height: 90px;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        border-color: var(--el-color-primary-light-5);
      }

      &.active {
        border-top: 4px solid var(--el-color-primary);
        background-color: var(--el-color-primary-light-9);
        border-color: var(--el-color-primary);
        color: var(--el-color-primary);
        box-shadow: 0 0 0 2px var(--el-color-primary-light-8);
        font-weight: 500;

        .card-icon {
          transform: scale(1.1);
        }
      }
      
      &.disabled {
        opacity: 0.5;
        cursor: not-allowed;
        pointer-events: none;
        
        &:hover {
          transform: none;
          box-shadow: none;
          border-color: var(--el-border-color);
        }
      }

      .card-icon {
        font-size: 28px;
        margin-bottom: 12px;
        color: var(--el-color-primary);
        transition: transform 0.2s ease;
      }

      .card-label {
        font-size: 14px;
        text-align: center;
      }
    }

    // 列表布局
    &.layout-list {
      .card-selector-item {
        flex-direction: row;
        justify-content: flex-start;
        height: 60px;
        padding: 8px 16px;
        border-radius: 6px;
        margin-bottom: 8px;
        
        .card-icon {
          font-size: 24px;
          margin-right: 12px;
          margin-bottom: 0;
        }
        
        .card-label {
          font-size: 15px;
          text-align: left;
        }
      }
    }
    
    // 紧凑布局
    &.layout-compact {
      .card-selector-item {
        height: 70px;
        padding: 12px 6px;
        
        .card-icon {
          font-size: 22px;
          margin-bottom: 8px;
        }
        
        .card-label {
          font-size: 13px;
        }
      }
    }

    // 平台布局
    &.layout-platform {
      .card-selector-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        padding: 20px;
        background-color: white;
        border-radius: 16px;
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.06);
        transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        border: 1px solid rgba(var(--el-color-primary-rgb), 0.05);
        position: relative;
        overflow: hidden;
        cursor: pointer;
        height: auto;

        &::after {
          content: "";
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 3px;
          background: linear-gradient(90deg, var(--el-color-primary-light-5), var(--el-color-primary));
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.3s ease;
        }

        &:hover {
          transform: translateY(-8px) scale(1.05);
          box-shadow: 0 15px 30px rgba(0, 0, 0, 0.1);

          &::after {
            transform: scaleX(1);
          }
        }

        &.active {
          border-color: var(--el-color-primary);
          background-color: var(--el-color-primary-light-9);
          box-shadow: 0 8px 20px rgba(var(--el-color-primary-rgb), 0.2);

          &::after {
            transform: scaleX(1);
          }
        }

        .card-icon {
          color: var(--el-color-primary);
          background-color: var(--el-color-primary-light-9);
          padding: 12px;
          border-radius: 50%;
          transition: all 0.3s ease;
          font-size: 24px;
          margin-bottom: 0;

          &:hover {
            transform: rotate(10deg);
          }
        }

        .card-label {
          font-size: 15px;
          font-weight: 600;
          text-align: center;
        }
      }
    }
    
    // 网格布局
    &.layout-grid {
      .card-selector-item {
        border-radius: 4px;
        height: 100px;
        
        .card-icon {
          font-size: 32px;
          margin-bottom: 16px;
        }
        
        &.active {
          background-color: var(--el-color-primary);
          color: white;
          
          .card-icon {
            color: white;
          }
        }
      }
    }
  }

  /* 响应式布局 */
  @media screen and (max-width: 768px) {
    .card-selector-grid {
      grid-template-columns: repeat(2, 1fr) !important;
      
      &.layout-list {
        grid-template-columns: 1fr !important;
      }
    }
  }
}
</style>