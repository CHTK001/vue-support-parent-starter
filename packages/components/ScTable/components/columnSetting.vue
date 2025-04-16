<script setup>
import { ref, reactive, watch, onMounted } from 'vue';
import { Operation, DArrowDown, DArrowUp } from '@element-plus/icons-vue';
import Sortable from 'sortablejs';

const props = defineProps({
  // 表列配置
  columns: {
    type: Array,
    required: true
  },
  // 表格大小
  size: {
    type: String,
    default: "default"
  },
  // 是否实时更新（不需要点击保存）
  liveUpdate: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['save', 'reset', 'live-update']);

// 表单数据
const formColumns = ref([]);
const settingRef = ref(null);
const columnListRef = ref(null);
const sortableInstance = ref(null);

// 是否展示高级设置
const showAdvanced = ref(false);

// 初始化表单数据
const initForm = () => {
  formColumns.value = props.columns.map(col => ({
    ...col,
    key: col.prop || col.key,
    show: true
  }));
};

// 监听props变化
watch(() => props.columns, (val) => {
  if (val && val.length) {
    initForm();
  }
}, { immediate: true, deep: true });

// 列配置变更处理函数
const handleVisibilityChange = (index) => {
  formColumns.value[index].hide = !formColumns.value[index].hide;
  if (props.liveUpdate) {
    emit('live-update', formColumns.value);
  }
};

// 列宽变更处理
const handleWidthChange = (index, value) => {
  formColumns.value[index].width = value;
  if (props.liveUpdate) {
    emit('live-update', formColumns.value);
  }
};

// 可排序变更处理
const handleSortableChange = (index) => {
  formColumns.value[index].sortable = !formColumns.value[index].sortable;
  if (props.liveUpdate) {
    emit('live-update', formColumns.value);
  }
};

// 固定列变更处理
const handleFixedChange = (index, value) => {
  formColumns.value[index].fixed = value;
  if (props.liveUpdate) {
    emit('live-update', formColumns.value);
  }
};

// 保存列设置
const saveColumnSetting = () => {
  emit('save', formColumns.value);
};

// 重置列设置
const resetColumnSetting = () => {
  initForm();
  emit('reset');
  if (props.liveUpdate) {
    emit('live-update', formColumns.value);
  }
};

// 拖拽排序列
const initSortable = () => {
  if (!columnListRef.value) return;
  
  if (sortableInstance.value) {
    sortableInstance.value.destroy();
  }
  
  sortableInstance.value = Sortable.create(columnListRef.value, {
    handle: '.label-drag',
    animation: 300,
    ghostClass: 'ghost-item',
    onEnd({ newIndex, oldIndex }) {
      const currRow = formColumns.value.splice(oldIndex, 1)[0];
      formColumns.value.splice(newIndex, 0, currRow);
      
      if (props.liveUpdate) {
        emit('live-update', formColumns.value);
      }
    }
  });
};

// 全选/反选
const isAllSelected = ref(false);
const isIndeterminate = ref(false);

// 检查选择状态
const checkSelectionStatus = () => {
  const totalCount = formColumns.value.length;
  const hiddenCount = formColumns.value.filter(col => col.hide).length;
  
  isAllSelected.value = hiddenCount === 0;
  isIndeterminate.value = hiddenCount > 0 && hiddenCount < totalCount;
};

// 全选/取消全选
const handleSelectAll = (val) => {
  formColumns.value.forEach(col => {
    col.hide = !val;
  });
  
  if (props.liveUpdate) {
    emit('live-update', formColumns.value);
  }
};

// 监听列显示状态变化
watch(() => formColumns.value, () => {
  checkSelectionStatus();
}, { deep: true });

// 组件挂载后初始化拖拽
onMounted(() => {
  initSortable();
  checkSelectionStatus();
});

// 切换高级设置
const toggleAdvanced = () => {
  showAdvanced.value = !showAdvanced.value;
};
</script>

<template>
  <div class="column-setting" ref="settingRef">
    <div class="setting-header">
      <div class="setting-title">
        <span>{{ $t('列设置') }}</span>
        <el-tooltip :content="showAdvanced ? $t('隐藏高级设置') : $t('显示高级设置')" placement="top">
          <el-button type="text" class="advanced-toggle" @click="toggleAdvanced">
            <el-icon>
              <component :is="showAdvanced ? DArrowUp : DArrowDown" />
            </el-icon>
            {{ showAdvanced ? $t('收起') : $t('高级') }}
          </el-button>
        </el-tooltip>
      </div>
      <div class="selection-actions">
        <el-checkbox 
          v-model="isAllSelected"
          :indeterminate="isIndeterminate"
          @change="handleSelectAll"
        >
          {{ $t('全选') }}
        </el-checkbox>
      </div>
    </div>
    
    <div class="column-list" ref="columnListRef">
      <div 
        v-for="(column, index) in formColumns" 
        :key="column.key" 
        class="column-item"
        :class="{ 'column-item-hide': column.hide }"
      >
        <div class="item-main">
          <div class="item-drag">
            <el-icon class="label-drag" :size="16">
              <operation />
            </el-icon>
          </div>
          <div class="item-name">
            <el-checkbox 
              v-model="!column.hide" 
              @change="() => handleVisibilityChange(index)"
            >
              {{ column.label }}
            </el-checkbox>
          </div>
        </div>
        
        <div class="item-advanced" v-show="showAdvanced">
          <div class="advanced-item" v-if="column.resizable">
            <span class="advanced-label">{{ $t('宽度') }}</span>
            <el-input-number
              v-model="column.width"
              :min="80"
              :max="1200"
              :size="props.size"
              :step="10"
              controls-position="right"
              @change="(value) => handleWidthChange(index, value)"
            />
          </div>
          
          <div class="advanced-item">
            <span class="advanced-label">{{ $t('排序') }}</span>
            <el-switch 
              v-model="column.sortable" 
              @change="() => handleSortableChange(index)" 
              :size="props.size" 
              active-color="#409EFF"
            />
          </div>
          
          <div class="advanced-item">
            <span class="advanced-label">{{ $t('固定') }}</span>
            <el-select
              v-model="column.fixed"
              :size="props.size"
              clearable
              class="fixed-select"
              @change="(value) => handleFixedChange(index, value)"
            >
              <el-option value="left" :label="$t('左侧')" />
              <el-option value="right" :label="$t('右侧')" />
            </el-select>
          </div>
        </div>
      </div>
    </div>
    
    <div class="setting-footer">
      <el-button @click="resetColumnSetting" plain>{{ $t('重置') }}</el-button>
      <el-button type="primary" @click="saveColumnSetting">{{ $t('确认') }}</el-button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.column-setting {
  width: 100%;
  max-height: 500px;
  display: flex;
  flex-direction: column;
  font-family: var(--el-font-family);
  
  .setting-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 8px;
    margin-bottom: 12px;
    border-bottom: 1px solid var(--el-border-color-lighter);
    
    .setting-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      display: flex;
      align-items: center;
      
      .advanced-toggle {
        margin-left: 8px;
        font-size: 13px;
        display: flex;
        align-items: center;
        
        .el-icon {
          margin-right: 4px;
        }
      }
    }
    
    .selection-actions {
      display: flex;
      align-items: center;
    }
  }
  
  .column-list {
    flex: 1;
    overflow-y: auto;
    padding: 0 8px;
    
    &::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    
    &::-webkit-scrollbar-thumb {
      background: #d9d9d9;
      border-radius: 6px;
    }
    
    &::-webkit-scrollbar-track {
      background: #f5f5f5;
      border-radius: 6px;
    }
    
    .column-item {
      position: relative;
      padding: 10px 12px;
      margin-bottom: 8px;
      border-radius: 6px;
      transition: all 0.3s;
      background-color: var(--el-bg-color);
      border: 1px solid var(--el-border-color-lighter);
      
      &:hover {
        box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
        border-color: var(--el-border-color-dark);
      }
      
      &.column-item-hide {
        opacity: 0.7;
      }
      
      &.ghost-item {
        opacity: 0.5;
        background: var(--el-color-primary-light-9);
      }
      
      .item-main {
        display: flex;
        align-items: center;
        
        .item-drag {
          color: var(--el-text-color-secondary);
          cursor: move;
          padding: 4px;
          border-radius: 4px;
          margin-right: 8px;
          
          &:hover {
            background-color: var(--el-color-primary-light-9);
            color: var(--el-color-primary);
          }
        }
        
        .item-name {
          font-size: 14px;
          flex: 1;
        }
      }
      
      .item-advanced {
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px dashed var(--el-border-color-lighter);
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        
        .advanced-item {
          display: flex;
          align-items: center;
          min-width: 180px;
          
          .advanced-label {
            width: 45px;
            font-size: 13px;
            color: var(--el-text-color-secondary);
            margin-right: 6px;
          }
          
          .fixed-select {
            width: 120px;
          }
        }
      }
    }
  }
  
  .setting-footer {
    display: flex;
    justify-content: flex-end;
    padding: 15px 0 5px;
    margin-top: 10px;
    border-top: 1px solid var(--el-border-color-lighter);
    gap: 10px;
  }
}

:deep(.el-checkbox__label) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 180px;
}

:deep(.el-input-number) {
  width: 110px;
}
</style> 