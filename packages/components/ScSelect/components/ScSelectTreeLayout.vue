<template>
  <div class="sc-select-tree-layout">
    <el-select v-model="searchValue" :placeholder="searchPlaceholder" clearable @input="handleSearch">
      <template #empty>
        <!-- 树形组件 -->
        <div class="tree-container" :style="{ height: containerHeight }">
          <ScTree
            ref="treeRef"
            :data="treeData"
            :props="treeProps"
            :node-key="nodeKey"
            :show-checkbox="multiple"
            :check-strictly="checkStrictly"
            :default-expand-all="defaultExpandAll"
            :expand-on-click-node="expandOnClickNode"
            :highlight-current="!multiple"
            :filter-node-method="filterNodeMethod"
            @node-click="handleNodeClick"
            @check="handleCheck"
            @current-change="handleCurrentChange"
          >
            <template #default="{ node, data }">
              <div class="tree-node-content">
                <!-- 节点图标 -->
                <el-icon v-if="data[iconProp]" class="node-icon">
                  <component :is="data[iconProp]" />
                </el-icon>

                <!-- 节点标签 -->
                <span class="node-label">{{ node.label }}</span>

                <!-- 节点描述 -->
                <span v-if="data[descProp]" class="node-desc">{{ data[descProp] }}</span>
              </div>
            </template>
          </ScTree>
        </div>

        <!-- 底部操作栏 -->
        <div v-if="showActions && multiple" class="tree-actions">
          <el-button size="small" @click="expandAll">展开全部</el-button>
          <el-button size="small" @click="collapseAll">收起全部</el-button>
          <el-button size="small" @click="clearSelection">清空选择</el-button>
          <div class="selected-count">已选择: {{ selectedCount }} 项</div>
        </div>
      </template>
    </el-select>
  </div>
</template>

<script setup lang="ts">
import { computed, defineOptions, nextTick, ref, watch, type PropType } from "vue";
import ScTree from "../../ScTree/index.vue";
import type { TreeKey, TreeNode, TreeNodeData } from "../../ScTree/types";

// 定义组件名称
defineOptions({
  name: "ScSelectTreeLayout"
});

// 定义接口
export interface TreeSelectOption extends TreeNodeData {
  value: TreeKey;
  label: string;
  children?: TreeSelectOption[];
  disabled?: boolean;
  [key: string]: any;
}

const props = defineProps({
  // v-model绑定值
  modelValue: {
    type: [String, Number, Array] as PropType<TreeKey | TreeKey[]>,
    default: () => []
  },
  // 树形数据
  options: {
    type: Array as PropType<TreeSelectOption[]>,
    default: () => []
  },
  // 是否多选
  multiple: {
    type: Boolean,
    default: false
  },
  // 树节点配置
  props: {
    type: Object,
    default: () => ({
      children: "children",
      label: "label",
      disabled: "disabled"
    })
  },
  // 节点唯一标识字段
  nodeKey: {
    type: String,
    default: "value"
  },
  // 图标字段
  iconProp: {
    type: String,
    default: "icon"
  },
  // 描述字段
  descProp: {
    type: String,
    default: "desc"
  },
  // 是否显示搜索框
  showSearch: {
    type: Boolean,
    default: true
  },
  // 搜索框占位符
  searchPlaceholder: {
    type: String,
    default: "请输入关键词搜索"
  },
  // 是否显示操作栏
  showActions: {
    type: Boolean,
    default: true
  },
  // 容器高度
  height: {
    type: [String, Number],
    default: "300px"
  },
  // 是否默认展开所有节点
  defaultExpandAll: {
    type: Boolean,
    default: false
  },
  // 是否在点击节点时展开/收起节点
  expandOnClickNode: {
    type: Boolean,
    default: false
  },
  // 在显示复选框的情况下，是否严格的遵循父子不互相关联的做法
  checkStrictly: {
    type: Boolean,
    default: false
  },
  // 是否只能选择叶子节点
  leafOnly: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(["update:modelValue", "change", "node-click", "check", "current-change"]);

// 引用
const treeRef = ref();
const searchValue = ref("");

// 计算属性
const treeData = computed(() => props.options);

const treeProps = computed(() => ({
  children: props.props.children || "children",
  label: props.props.label || "label",
  disabled: props.props.disabled || "disabled"
}));

const containerHeight = computed(() => {
  if (typeof props.height === "number") {
    return `${props.height}px`;
  }
  return props.height;
});

const selectedCount = computed(() => {
  if (props.multiple && Array.isArray(props.modelValue)) {
    return props.modelValue.length;
  }
  return props.modelValue ? 1 : 0;
});

// 搜索过滤方法
const filterNodeMethod = (value: string, data: TreeNodeData) => {
  if (!value) return true;
  const label = data[treeProps.value.label] || "";
  return label.toLowerCase().includes(value.toLowerCase());
};

// 处理搜索
const handleSearch = (value: string) => {
  if (treeRef.value) {
    treeRef.value.filter(value);
  }
};

// 处理节点点击
const handleNodeClick = (data: TreeNodeData, node: TreeNode) => {
  // 如果是多选模式，不处理点击事件
  if (props.multiple) {
    return;
  }

  // 如果只能选择叶子节点且当前节点不是叶子节点，则不处理
  if (props.leafOnly && !node.isLeaf) {
    return;
  }

  // 如果节点被禁用，不处理
  if (data[treeProps.value.disabled]) {
    return;
  }

  const value = data[props.nodeKey];
  emit("update:modelValue", value);
  emit("change", value, data, node);
  emit("node-click", data, node);
};

// 处理复选框变化
const handleCheck = (data: TreeNodeData, params: any) => {
  if (!props.multiple) return;

  let checkedKeys = params.checkedKeys;

  // 如果只能选择叶子节点，过滤出叶子节点
  if (props.leafOnly) {
    const checkedNodes = params.checkedNodes;
    checkedKeys = checkedNodes.filter((node: any) => !node.children || node.children.length === 0).map((node: any) => node[props.nodeKey]);
  }

  emit("update:modelValue", checkedKeys);
  emit("change", checkedKeys, data, params);
  emit("check", data, params);
};

// 处理当前节点变化
const handleCurrentChange = (data: TreeNodeData, node: TreeNode) => {
  emit("current-change", data, node);
};

// 展开所有节点
const expandAll = () => {
  if (treeRef.value) {
    treeRef.value.expandAll();
  }
};

// 收起所有节点
const collapseAll = () => {
  if (treeRef.value) {
    treeRef.value.collapseAll();
  }
};

// 清空选择
const clearSelection = () => {
  if (props.multiple) {
    emit("update:modelValue", []);
    emit("change", [], null, null);
  } else {
    emit("update:modelValue", "");
    emit("change", "", null, null);
  }
};

// 设置选中的节点
const setCheckedKeys = (keys: TreeKey[]) => {
  if (treeRef.value && props.multiple) {
    treeRef.value.setCheckedKeys(keys);
  }
};

// 设置当前选中的节点
const setCurrentKey = (key: TreeKey) => {
  if (treeRef.value && !props.multiple) {
    treeRef.value.setCurrentKey(key);
  }
};

// 监听modelValue变化，同步到树组件
watch(
  () => props.modelValue,
  newValue => {
    nextTick(() => {
      if (props.multiple && Array.isArray(newValue)) {
        setCheckedKeys(newValue);
      } else if (!props.multiple && newValue) {
        setCurrentKey(newValue as TreeKey);
      }
    });
  },
  { immediate: true }
);

// 暴露方法
defineExpose({
  expandAll,
  collapseAll,
  clearSelection,
  setCheckedKeys,
  setCurrentKey,
  treeRef
});
</script>

<style lang="scss" scoped>
.sc-select-tree-layout {
  display: flex;
  flex-direction: column;
  width: 100%;
  background: var(--el-bg-color-overlay);
  border-radius: 6px;

  .tree-search-container {
    margin-bottom: 12px;

    .el-input {
      width: 100%;

      :deep(.el-input__wrapper) {
        border-radius: 6px;
        transition: all 0.3s ease;

        &:hover {
          box-shadow: 0 0 0 1px var(--el-color-primary-light-7);
        }

        &.is-focus {
          box-shadow: 0 0 0 1px var(--el-color-primary);
        }
      }
    }
  }

  .tree-container {
    flex: 1;
    overflow: auto;
    border: 1px solid var(--el-border-color-light);
    border-radius: 6px;
    padding: 8px;
    background: var(--el-bg-color-page);
    transition: border-color 0.3s ease;

    &:hover {
      border-color: var(--el-color-primary-light-7);
    }

    .tree-node-content {
      display: flex;
      align-items: center;
      width: 100%;
      padding: 2px 0;
      transition: all 0.3s ease;

      .node-icon {
        margin-right: 8px;
        color: var(--el-color-primary);
        font-size: 16px;
        transition: color 0.3s ease;
      }

      .node-label {
        flex: 1;
        font-size: 14px;
        color: var(--el-text-color-primary);
        font-weight: 500;
        transition: color 0.3s ease;
      }

      .node-desc {
        margin-left: 8px;
        font-size: 12px;
        color: var(--el-text-color-secondary);
        opacity: 0.8;
        transition: opacity 0.3s ease;
      }
    }
  }

  .tree-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid var(--el-border-color-lighter);

    .el-button {
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }
    }

    .selected-count {
      font-size: 12px;
      color: var(--el-text-color-secondary);
      font-weight: 500;
      padding: 4px 8px;
      background: var(--el-color-primary-light-9);
      border-radius: 4px;
      transition: all 0.3s ease;
    }
  }
}

// 深度选择器，自定义树组件样式
:deep(.el-tree) {
  .el-tree-node {
    .el-tree-node__content {
      height: 36px;
      border-radius: 4px;
      margin: 1px 0;
      transition: all 0.3s ease;

      &:hover {
        background-color: var(--el-color-primary-light-9);
        transform: translateX(2px);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      }
    }

    .el-tree-node__label {
      font-size: 14px;
      transition: color 0.3s ease;
    }

    .el-tree-node__expand-icon {
      transition: all 0.3s ease;

      &.expanded {
        transform: rotate(90deg);
      }
    }

    // 复选框样式优化
    .el-checkbox {
      .el-checkbox__input {
        .el-checkbox__inner {
          border-radius: 4px;
          transition: all 0.3s ease;

          &:hover {
            border-color: var(--el-color-primary);
            transform: scale(1.1);
          }
        }

        &.is-checked .el-checkbox__inner {
          background-color: var(--el-color-primary);
          border-color: var(--el-color-primary);
          transform: scale(1.1);
        }

        &.is-indeterminate .el-checkbox__inner {
          background-color: var(--el-color-primary);
          border-color: var(--el-color-primary);
        }
      }
    }
  }

  .el-tree-node.is-current > .el-tree-node__content {
    background-color: var(--el-color-primary-light-8);
    color: var(--el-color-primary);
    border-left: 3px solid var(--el-color-primary);
    font-weight: 600;

    .tree-node-content {
      .node-icon {
        color: var(--el-color-primary);
        transform: scale(1.1);
      }

      .node-label {
        color: var(--el-color-primary);
      }

      .node-desc {
        opacity: 1;
      }
    }
  }

  // 空状态样式
  .el-tree__empty-block {
    padding: 40px 0;

    .el-tree__empty-text {
      color: var(--el-text-color-secondary);
      font-size: 14px;
    }
  }

  // 加载状态样式
  .el-tree-node.is-loading {
    .el-tree-node__loading-icon {
      color: var(--el-color-primary);
      animation: rotate 1s linear infinite;
    }
  }
}

// 动画定义
@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

// 响应式设计
@media (max-width: 768px) {
  .sc-select-tree-layout {
    .tree-actions {
      flex-direction: column;
      gap: 8px;
      align-items: stretch;

      .selected-count {
        text-align: center;
      }
    }
  }

  :deep(.el-tree) {
    .el-tree-node {
      .el-tree-node__content {
        height: 40px;

        &:hover {
          transform: none;
        }
      }
    }
  }
}
</style>
