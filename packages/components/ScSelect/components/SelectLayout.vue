<template>
  <div class="selector-native-wrapper">
    <el-select 
      v-model="modelValue"
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
            <el-button type="primary" plain size="small" @click.stop="handleSelectAll">
              <IconifyIconOnline icon="ep:select" class="action-icon" />
              <span>全选</span>
            </el-button>
            <el-button type="info" plain size="small" @click.stop="handleInvertSelection">
              <IconifyIconOnline icon="ep:refresh-right" class="action-icon" />
              <span>反选</span>
            </el-button>
            <el-button type="danger" plain size="small" @click.stop="handleClearSelection">
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
</template>

<script setup lang="ts">
import { defineProps, defineEmits, ref, watch } from "vue";
import { IconifyIconOnline } from "../../ReIcon";

interface CardOption {
  label: string;
  value: string | number;
  icon: string;
}

const props = defineProps({
  modelValue: {
    type: [String, Number, Array],
    default: "",
  },
  options: {
    type: Array as () => CardOption[],
    required: true,
  },
  multiple: {
    type: Boolean,
    default: false
  },
  limit: {
    type: Number,
    default: 0 // 0表示不限制
  },
  maxCollapseTags: {
    type: Number,
    default: 1
  },
  showBatchActions: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(["update:modelValue", "change", "selectAll", "invertSelection", "clearSelection"]);

// 本地绑定值
const modelValue = ref(props.modelValue);

// 监听modelValue变化同步到本地
watch(() => props.modelValue, (newValue) => {
  modelValue.value = newValue;
});

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
const handleSelectAll = () => {
  emit("selectAll");
};

// 反选
const handleInvertSelection = () => {
  emit("invertSelection");
};

// 清空选择
const handleClearSelection = () => {
  emit("clearSelection");
};
</script>

<style lang="scss" scoped>
.select-flex {
  display: flex;
  justify-content: flex-start;
  > svg {
    margin-top: -8px;
    margin-right: 4px;
  }
}

.selector-native-wrapper {
  width: 100%;
  
  .selector-native-select {
    width: 100%;
  }
}

.action-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  margin-right: 4px;
  vertical-align: middle;
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

// 暗黑模式样式适配
:deep(.el-dark) {
  .select-actions-option {
    background-color: var(--el-bg-color-overlay);
    
    &:hover {
      background-color: var(--el-bg-color-overlay);
    }
  }
  
  .select-option-content {
    .select-option-icon {
      color: var(--el-color-primary);
    }
  }
  
  .select-actions-container {
    border-bottom: 1px solid var(--el-border-color-darker);
  }
}
</style> 