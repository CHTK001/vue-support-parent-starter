<template>
  <div class="selector-native-wrapper">
    <component
      :is="currentSelectComponent || ElSelect"
      v-model="modelValue"
      :multiple="multiple"
      class="selector-native-select"
      collapse-tags
      collapse-tags-tooltip
      :max-collapse-tags="maxCollapseTags"
      filterable
      :reserve-keyword="false"
      :multiple-limit="multiple ? limit : 0"
      @change="handleNativeSelectChange"
    >
      <!-- 多选模式下显示批量操作按钮作为第一个选项 -->
      <component :is="currentOptionComponent || ElOption" v-if="multiple && options.length > 1 && showBatchActions" :value="'__actions__'" :disabled="true" class="select-actions-option">
        <div class="select-actions-container" @click.stop>
          <div class="select-action-title">
            <ScButton type="primary" plain size="small" @click.stop="handleSelectAll">
              <IconifyIconOnline icon="ep:select" class="action-icon" />
              <span>全选</span>
            </ScButton>
            <ScButton type="info" plain size="small" @click.stop="handleInvertSelection">
              <IconifyIconOnline icon="ep:refresh-right" class="action-icon" />
              <span>反选</span>
            </ScButton>
            <ScButton type="danger" plain size="small" @click.stop="handleClearSelection">
              <IconifyIconOnline icon="ep:delete" class="action-icon" />
              <span>清空</span>
            </ScButton>
          </div>
        </div>
      </component>

      <!-- 选项列表 -->
      <component :is="currentOptionComponent || ElOption" v-for="item in options" :key="item.value" :label="item.label" :value="item.value">
        <div class="select-option-content select-flex">
          <div v-if="item.icon" class="select-option-icon">
            <IconRenderer :icon="item.icon" />
          </div>
          <span>{{ item.label }}</span>
        </div>
      </component>
    </component>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { ElSelect, ElOption } from "element-plus";
import { IconifyIconOnline } from "../../ReIcon";
import { ScButton } from "../../ScButton";
import { ScOption } from "../../ScOption";
import { useThemeComponent } from "../../hooks/useThemeComponent";

// 使用主题组件系统
const { currentComponent: currentSelectComponent } = useThemeComponent("ElSelect");
const { currentComponent: currentOptionComponent } = useThemeComponent("ElOption");
import { useThemeComponent } from "../../hooks/useThemeComponent";
import IconRenderer from "./IconRenderer.vue";

export interface CardOption {
  label: string;
  value: string | number;
  icon?: string; // 图标现在是可选的，支持ri:xx格式和http链接
}

const props = defineProps({
  modelValue: {
    type: [String, Number, Array],
    default: ""
  },
  options: {
    type: Array as () => CardOption[],
    required: true
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

// 使用主题组件系统 V2.0
const { currentComponent: currentSelectComponent } = useThemeComponent("ElSelect");
// Note: ElOption 通常不需要单独主题化，因为它是 ElSelect 的子组件
// 但为了完整性，我们也提供主题支持
const currentOptionComponent = ref(ElOption);

// 本地绑定值
const modelValue = ref(props.modelValue);

// 监听modelValue变化同步到本地
watch(
  () => props.modelValue,
  newValue => {
    modelValue.value = newValue;
  }
);

// 处理原生select变化
const handleNativeSelectChange = (value: string | number | Array<string | number>) => {
  // 过滤掉可能的__actions__值
  if (Array.isArray(value)) {
    const filteredValue = value.filter(v => v !== "__actions__");
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
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
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
