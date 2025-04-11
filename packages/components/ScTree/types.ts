import type { Component } from 'vue';
import type { ElTree } from 'element-plus';

// 节点数据类型
export interface TreeNodeData {
  [key: string]: any;
}

// 节点key类型
export type TreeKey = string | number;

// 过滤值类型
export type TreeFilterValue = string | number | undefined | null;

// 树组件配置项
export interface TreeProps {
  children?: string;
  label?: string;
  disabled?: string;
  isLeaf?: string;
  class?: string | ((data: TreeNodeData, node: TreeNode) => string | { [key: string]: boolean });
}

// 树节点类型
export interface TreeNode {
  checked: boolean;
  childNodes: TreeNode[];
  data: TreeNodeData;
  expanded: boolean;
  id: number;
  indeterminate: boolean;
  isLeaf: boolean;
  level: number;
  loaded: boolean;
  loading: boolean;
  label: string;
  key: TreeKey;
  disabled: boolean;
  parent: TreeNode | null;
  isCurrent: boolean;
  store: any;
  isVisibleInTree: boolean;
}

// 树组件实例类型
export type TreeComponentInstance = InstanceType<typeof ElTree>;

// 加载节点方法类型
export type LoadFunction = (node: TreeNode, resolve: (data: TreeNodeData[]) => void) => void;

// 节点过滤方法类型
export type FilterNodeMethodFunction = (value: string, data: TreeNodeData, node: TreeNode) => boolean;

// 是否允许拖拽方法类型
export type AllowDragFunction = (node: TreeNode) => boolean;

// 是否允许放置方法类型
export type AllowDropFunction = (draggingNode: TreeNode, dropNode: TreeNode, type: 'before' | 'after' | 'inner') => boolean;

// 拖拽类型
export type DropType = 'before' | 'after' | 'inner' | undefined;

// 自定义渲染函数类型
export type RenderContentFunction = (h: Function, { node, data, store }: { node: TreeNode; data: TreeNodeData; store: any }) => Component; 