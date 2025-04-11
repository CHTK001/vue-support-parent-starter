<template>
  <div class="sc-tree-container" :class="{ 'is-draggable': draggable }">
    <el-tree
      ref="treeRef"
      v-bind="$attrs"
      :data="treeData"
      :props="props"
      :highlight-current="highlightCurrent"
      :default-expand-all="defaultExpandAll"
      :expand-on-click-node="expandOnClickNode"
      :check-on-click-node="checkOnClickNode"
      :auto-expand-parent="autoExpandParent"
      :default-expanded-keys="defaultExpandedKeys"
      :default-checked-keys="defaultCheckedKeys"
      :current-node-key="currentNodeKey"
      :filter-node-method="filterNodeMethod"
      :accordion="accordion"
      :indent="indent"
      :icon="icon"
      :lazy="lazy"
      :load="load"
      :draggable="draggable"
      :allow-drag="allowDrag"
      :allow-drop="allowDrop"
      :node-key="nodeKey"
      :check-strictly="checkStrictly"
      :show-checkbox="showCheckbox"
      :render-after-expand="renderAfterExpand"
      :empty-text="emptyText"
      @node-click="handleNodeClick"
      @node-contextmenu="handleNodeContextmenu"
      @check-change="handleCheckChange"
      @check="handleCheck"
      @current-change="handleCurrentChange"
      @node-expand="handleNodeExpand"
      @node-collapse="handleNodeCollapse"
      @node-drag-start="handleNodeDragStart"
      @node-drag-enter="handleNodeDragEnter"
      @node-drag-leave="handleNodeDragLeave"
      @node-drag-over="handleNodeDragOver"
      @node-drag-end="handleNodeDragEnd"
      @node-drop="handleNodeDrop"
    >
      <template #default="{ node, data }">
        <slot :node="node" :data="data">
          <span class="sc-tree-node" :class="{ 'is-leaf': node.isLeaf }">
            <slot name="prefix" :node="node" :data="data"></slot>
            <span class="sc-tree-node__label">{{ node.label }}</span>
            <slot name="suffix" :node="node" :data="data"></slot>
          </span>
        </slot>
      </template>
      <template v-if="$slots.empty" #empty>
        <slot name="empty"></slot>
      </template>
    </el-tree>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, nextTick, onMounted, defineOptions } from 'vue';
import type { TreeProps, TreeNodeData, TreeKey, TreeFilterValue, TreeNode, TreeComponentInstance } from './types';

// 定义组件名称
defineOptions({
  name: 'ScTree'
});

const props = defineProps({
  // 数据
  data: {
    type: Array as () => TreeNodeData[],
    default: () => []
  },
  // 树节点配置选项
  props: {
    type: Object as () => TreeProps,
    default: () => ({
      children: 'children',
      label: 'label',
      disabled: 'disabled'
    })
  },
  // 是否高亮当前选中节点
  highlightCurrent: {
    type: Boolean,
    default: false
  },
  // 是否默认展开所有节点
  defaultExpandAll: {
    type: Boolean,
    default: false
  },
  // 是否在点击节点的时候展开或者收缩节点
  expandOnClickNode: {
    type: Boolean,
    default: true
  },
  // 是否在点击节点的时候选中节点
  checkOnClickNode: {
    type: Boolean,
    default: false
  },
  // 展开子节点的时候是否自动展开父节点
  autoExpandParent: {
    type: Boolean,
    default: true
  },
  // 默认展开的节点的 key 的数组
  defaultExpandedKeys: {
    type: Array as () => TreeKey[],
    default: () => []
  },
  // 默认勾选的节点的 key 的数组
  defaultCheckedKeys: {
    type: Array as () => TreeKey[],
    default: () => []
  },
  // 当前选中的节点
  currentNodeKey: {
    type: [String, Number],
    default: ''
  },
  // 对树节点进行筛选时执行的方法
  filterNodeMethod: {
    type: Function,
    default: null
  },
  // 是否每次只打开一个同级树节点展开
  accordion: {
    type: Boolean,
    default: false
  },
  // 相邻级节点间的水平缩进，单位为像素
  indent: {
    type: Number,
    default: 18
  },
  // 自定义树节点图标
  icon: {
    type: String,
    default: ''
  },
  // 是否懒加载子节点数据
  lazy: {
    type: Boolean,
    default: false
  },
  // 加载子节点数据的方法
  load: {
    type: Function,
    default: null
  },
  // 是否开启拖拽节点功能
  draggable: {
    type: Boolean,
    default: false
  },
  // 判断节点能否被拖拽
  allowDrag: {
    type: Function,
    default: null
  },
  // 拖拽时判定目标节点能否被放置
  allowDrop: {
    type: Function,
    default: null
  },
  // 每个树节点用来作为唯一标识的属性
  nodeKey: {
    type: String,
    default: ''
  },
  // 在显示复选框的情况下，是否严格的遵循父子不互相关联的做法
  checkStrictly: {
    type: Boolean,
    default: false
  },
  // 节点是否可被选择
  showCheckbox: {
    type: Boolean,
    default: false
  },
  // 是否在第一次展开某个树节点后才渲染其子节点
  renderAfterExpand: {
    type: Boolean,
    default: true
  },
  // 内容为空的时候展示的文本
  emptyText: {
    type: String,
    default: ''
  }
});

const emit = defineEmits([
  'node-click',
  'node-contextmenu',
  'check-change',
  'check',
  'current-change',
  'node-expand',
  'node-collapse',
  'node-drag-start',
  'node-drag-enter',
  'node-drag-leave',
  'node-drag-over',
  'node-drag-end',
  'node-drop',
  'update:data'
]);

// 引用el-tree实例
const treeRef = ref<TreeComponentInstance | null>(null);
// 树形数据
const treeData = ref<TreeNodeData[]>([...props.data]);

// 监听data变化，更新内部数据
watch(() => props.data, (val) => {
  treeData.value = [...val];
}, { deep: true });

// 过滤树节点
const filter = (value: TreeFilterValue) => {
  if (treeRef.value) {
    treeRef.value.filter(value);
  }
};

// 更新节点
const updateKeyChildren = (key: TreeKey, data: TreeNodeData[]) => {
  if (treeRef.value) {
    treeRef.value.updateKeyChildren(key, data);
  }
};

// 获取节点
const getNode = (key: TreeKey) => {
  if (treeRef.value) {
    return treeRef.value.getNode(key);
  }
  return null;
};

// 设置节点是否被选中
const setChecked = (key: TreeKey, checked: boolean, deep: boolean = true) => {
  if (treeRef.value) {
    treeRef.value.setChecked(key, checked, deep);
  }
};

// 设置节点是否被选中，使用node模式
const setCheckedNodes = (nodes: TreeNodeData[], checked: boolean = true) => {
  if (treeRef.value) {
    // @ts-ignore - Element Plus类型定义与实际不符
    treeRef.value.setCheckedNodes(nodes, checked);
  }
};

// 设置选中的keys
const setCheckedKeys = (keys: TreeKey[], leafOnly: boolean = false) => {
  if (treeRef.value) {
    treeRef.value.setCheckedKeys(keys, leafOnly);
  }
};

// 获取当前选中的节点数据
const getCheckedNodes = (leafOnly: boolean = false, includeHalfChecked: boolean = false) => {
  if (treeRef.value) {
    return treeRef.value.getCheckedNodes(leafOnly, includeHalfChecked);
  }
  return [];
};

// 获取当前选中的节点的key
const getCheckedKeys = (leafOnly: boolean = false) => {
  if (treeRef.value) {
    return treeRef.value.getCheckedKeys(leafOnly);
  }
  return [];
};

// 获取半选中的节点
const getHalfCheckedNodes = () => {
  if (treeRef.value) {
    return treeRef.value.getHalfCheckedNodes();
  }
  return [];
};

// 获取半选中的节点的key
const getHalfCheckedKeys = () => {
  if (treeRef.value) {
    return treeRef.value.getHalfCheckedKeys();
  }
  return [];
};

// 设置当前选中的节点
const setCurrentKey = (key: TreeKey | null, shouldAutoExpandParent: boolean = true) => {
  if (treeRef.value) {
    treeRef.value.setCurrentKey(key, shouldAutoExpandParent);
  }
};

// 设置当前选中的节点
const setCurrentNode = (node: TreeNodeData | null, shouldAutoExpandParent: boolean = true) => {
  if (treeRef.value) {
    // @ts-ignore - Element Plus类型定义与实际不符
    treeRef.value.setCurrentNode(node, shouldAutoExpandParent);
  }
};

// 获取当前选中的节点的数据
const getCurrentKey = () => {
  if (treeRef.value) {
    return treeRef.value.getCurrentKey();
  }
  return null;
};

// 获取当前选中的节点
const getCurrentNode = () => {
  if (treeRef.value) {
    return treeRef.value.getCurrentNode();
  }
  return null;
};

// 设置节点是否展开
const setExpandedKeys = (keys: TreeKey[]) => {
  if (treeRef.value) {
    // 使用treeRef.value提供的方法来设置展开的节点
    // @ts-ignore - Element Plus的类型定义可能没有包含这个方法
    treeRef.value.setExpandedKeys?.(keys);
  }
};

// 展开所有节点
const expandAll = () => {
  if (!treeRef.value || !props.nodeKey) return;

  try {
    // 首先获取所有节点的数据
    const expandAllNodes = (data: TreeNodeData[]) => {
      for (const item of data) {
        // 找到当前节点
        const node = treeRef.value?.getNode(item[props.nodeKey]);
        if (node && !node.isLeaf) {
          // 展开当前节点
          node.expanded = true;
          
          // 如果有子节点，递归展开子节点
          if (item.children && Array.isArray(item.children) && item.children.length > 0) {
            expandAllNodes(item.children);
          }
        }
      }
    };
    
    // 开始展开所有节点
    expandAllNodes(JSON.parse(JSON.stringify(treeData.value)));
  } catch (e) {
    console.error('展开所有节点失败:', e);
  }
};

// 收起所有节点
const collapseAll = () => {
  if (!treeRef.value || !props.nodeKey) return;

  try {
    // 获取所有节点
    const allNodes = getAllNodes();
    
    // 将所有非叶子节点折叠
    allNodes.forEach(node => {
      if (!node.isLeaf) {
        node.expanded = false;
      }
    });
  } catch (e) {
    console.error('折叠所有节点失败:', e);
  }
};

// 将 tree 的某一节点的某一父节点展开
const expandNode = (node: TreeNode) => {
  if (treeRef.value) {
    const nodes = [node];
    const parent = node.parent;

    if (parent && parent !== (treeRef.value as any).root) {
      expandNode(parent);
    }

    if (props.nodeKey && node.data[props.nodeKey]) {
      const keyValue = node.data[props.nodeKey];
      // @ts-ignore - Element Plus内部store结构可能不一致
      treeRef.value.store?.expandedKeys?.add?.(keyValue);
    }

    nextTick(() => {
      // @ts-ignore - Element Plus内部store结构可能不一致
      if (treeRef.value?.store) {
        // @ts-ignore - Element Plus内部store结构可能不一致
        treeRef.value.store._expandedKeys = undefined;
      }
      nodes.forEach((node) => {
        node.expanded = true;
      });
    });
  }
};

// 删除节点
const remove = (data: TreeNodeData) => {
  if (treeRef.value) {
    treeRef.value.remove(data);
  }
};

// 添加节点
const append = (data: TreeNodeData, parentNode: TreeNodeData | TreeNode | null) => {
  if (treeRef.value) {
    treeRef.value.append(data, parentNode);
  }
};

// 在某节点之前插入节点
const insertBefore = (data: TreeNodeData, refNode: TreeNodeData | TreeNode) => {
  if (treeRef.value) {
    treeRef.value.insertBefore(data, refNode);
  }
};

// 在某节点之后插入节点
const insertAfter = (data: TreeNodeData, refNode: TreeNodeData | TreeNode) => {
  if (treeRef.value) {
    treeRef.value.insertAfter(data, refNode);
  }
};

// 获取所有节点数据（包括拖拽排序后的数据）
const getAllData = () => {
  return JSON.parse(JSON.stringify(treeData.value));
};

// 辅助函数，递归获取所有节点
const getAllNodes = () => {
  if (!treeRef.value) return [];
  
  const nodes: TreeNode[] = [];
  const traverse = (node: TreeNode) => {
    nodes.push(node);
    if (node.childNodes && node.childNodes.length) {
      node.childNodes.forEach(child => traverse(child));
    }
  };
  
  if (treeRef.value.store.root.childNodes) {
    treeRef.value.store.root.childNodes.forEach(rootNode => {
      traverse(rootNode);
    });
  }
  
  return nodes;
};

// 事件处理器
const handleNodeClick = (data: TreeNodeData, node: TreeNode, e: MouseEvent) => {
  emit('node-click', data, node, e);
};

const handleNodeContextmenu = (e: Event, data: TreeNodeData, node: TreeNode) => {
  emit('node-contextmenu', e, data, node);
};

const handleCheckChange = (data: TreeNodeData, checked: boolean, indeterminate: boolean) => {
  emit('check-change', data, checked, indeterminate);
};

const handleCheck = (data: TreeNodeData, params: { checkedNodes: TreeNodeData[], checkedKeys: TreeKey[], halfCheckedNodes: TreeNodeData[], halfCheckedKeys: TreeKey[] }) => {
  emit('check', data, params);
};

const handleCurrentChange = (data: TreeNodeData, node: TreeNode) => {
  emit('current-change', data, node);
};

const handleNodeExpand = (data: TreeNodeData, node: TreeNode, e: MouseEvent) => {
  emit('node-expand', data, node, e);
};

const handleNodeCollapse = (data: TreeNodeData, node: TreeNode, e: MouseEvent) => {
  emit('node-collapse', data, node, e);
};

const handleNodeDragStart = (node: TreeNode, e: DragEvent) => {
  emit('node-drag-start', node, e);
};

const handleNodeDragEnter = (draggingNode: TreeNode, dropNode: TreeNode, e: DragEvent) => {
  emit('node-drag-enter', draggingNode, dropNode, e);
};

const handleNodeDragLeave = (draggingNode: TreeNode, dropNode: TreeNode, e: DragEvent) => {
  emit('node-drag-leave', draggingNode, dropNode, e);
};

const handleNodeDragOver = (draggingNode: TreeNode, dropNode: TreeNode, e: DragEvent) => {
  emit('node-drag-over', draggingNode, dropNode, e);
};

const handleNodeDragEnd = (draggingNode: TreeNode, dropNode: TreeNode | null, dropType: 'before' | 'after' | 'inner' | undefined, e: DragEvent) => {
  emit('node-drag-end', draggingNode, dropNode, dropType, e);
};

const handleNodeDrop = (draggingNode: TreeNode, dropNode: TreeNode | null, dropType: 'before' | 'after' | 'inner' | undefined, e: DragEvent) => {
  emit('node-drop', draggingNode, dropNode, dropType, e);
  
  // 发出更新事件，通知父组件数据已经更新
  nextTick(() => {
    const updatedData = getAllData();
    emit('update:data', updatedData);
  });
};

// 暴露组件方法
defineExpose({
  filter,
  updateKeyChildren,
  getNode,
  setChecked,
  setCheckedNodes,
  setCheckedKeys,
  getCheckedNodes,
  getCheckedKeys,
  getHalfCheckedNodes,
  getHalfCheckedKeys,
  setCurrentKey,
  setCurrentNode,
  getCurrentKey,
  getCurrentNode,
  setExpandedKeys,
  expandAll,
  collapseAll,
  expandNode,
  remove,
  append,
  insertBefore,
  insertAfter,
  getAllData,
  getAllNodes,
  // 暴露原始el-tree实例
  treeRef
});
</script>

<style lang="scss" scoped>
.sc-tree-container {
  width: 100%;
  
  &.is-draggable {
    .el-tree-node__content {
      cursor: grab;
      
      &:active {
        cursor: grabbing;
      }
    }
  }
  
  .sc-tree-node {
    display: flex;
    align-items: center;
    
    &__label {
      margin: 0 4px;
    }
    
    &.is-leaf {
      // 叶子节点可以添加特殊样式
    }
  }
}
</style> 