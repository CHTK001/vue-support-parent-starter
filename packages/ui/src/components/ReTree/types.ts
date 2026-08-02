import type { TreeNodeData } from "element-plus";

export interface ReTreeItem extends TreeNodeData {
  id?: string | number;
  label?: string;
  children?: ReTreeItem[];
  disabled?: boolean;
  bgColor?: string;
  [key: string]: unknown;
}

export interface ReTreeEmitParams {
  item: ReTreeItem;
  tree: ReTreeItem[];
}

export interface ReTreeDragEvent {
  dragNode: ReTreeItem;
  dropNode: ReTreeItem;
  dragParent: ReTreeItem | null;
  dropParent: ReTreeItem | null;
  tree: ReTreeItem[];
}

export type ReTreeLoader = (node: ReTreeItem) => Promise<ReTreeItem[]> | ReTreeItem[];
