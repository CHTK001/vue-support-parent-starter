<template>
  <div class="re-tree" :class="{ 're-tree--toolbar-visible': showToolbar }">
    <div v-if="showToolbar" class="re-tree__toolbar">
      <el-button v-if="enableAdd" plain @click="addRoot">添加根节点</el-button>
      <el-button v-if="enableExpandAll" plain @click="expandAll">展开全部</el-button>
      <el-button v-if="enableCollapseAll" plain @click="collapseAll">收起全部</el-button>
      <slot name="toolbar-extra" />
    </div>

    <el-tree
      ref="treeRef"
      :data="treeData"
      :props="resolvedProps"
      :node-key="nodeKey"
      :empty-text="emptyText"
      :render-after-expand="renderAfterExpand"
      :check-strictly="checkStrictly"
      :default-expand-all="defaultExpandAll"
      :expand-on-click-node="expandOnClickNode"
      :check-on-click-node="checkOnClickNode"
      :check-descendants="checkDescendants"
      :auto-expand-parent="autoExpandParent"
      :default-checked-keys="defaultCheckedKeys"
      :default-expanded-keys="defaultExpandedKeys"
      :current-node-key="currentNodeKey"
      :show-checkbox="showCheckbox"
      :draggable="draggableComputed"
      :allow-drag="allowDrag"
      :allow-drop="allowDrop"
      :lazy="lazyComputed"
      :highlight-current="highlightCurrent"
      :load="loadFunction"
      :filter-node-method="filterNodeMethod"
      :accordion="accordion"
      :indent="indent"
      :icon="icon"
      :highlight-class="highlightClass"
      @node-click="onNodeClick"
      @node-contextmenu="onNodeContextmenu"
      @check-change="onCheckChange"
      @check="onCheck"
      @current-change="onCurrentChange"
      @node-expand="onNodeExpand"
      @node-collapse="onNodeCollapse"
      @node-drag-start="onNodeDragStart"
      @node-drag-enter="onNodeDragEnter"
      @node-drag-leave="onNodeDragLeave"
      @node-drag-over="onNodeDragOver"
      @node-drag-end="onNodeDragEnd"
      @node-drop="onNodeDrop"
    >
      <template #default="{ node, data }">
        <div
          class="re-tree__custom-node"
          :style="data.bgColor ? { backgroundColor: data.bgColor } : undefined"
        >
          <span class="re-tree__node-label">
            <slot name="label" :node="data" :elNode="node">
              {{ node.label }}
            </slot>
          </span>

          <span v-if="editable || $slots.actions" class="re-tree__node-actions" @click.stop>
            <slot name="actions" :node="data" :elNode="node" :edit="() => handleEdit(node, data)" :remove="() => handleRemove(node, data)" :add="() => handleAdd(node, data)">
              <el-button v-if="enableAdd" link type="primary" @click.stop="handleAdd(node, data)">添加</el-button>
              <el-button v-if="enableEdit" link type="primary" @click.stop="handleEdit(node, data)">编辑</el-button>
              <el-button v-if="enableRemove" link type="danger" @click.stop="handleRemove(node, data)">删除</el-button>
            </slot>
          </span>
        </div>
      </template>
    </el-tree>

    <ReDialog v-model="dialogVisible" :title="dialogTitle" width="400px">
      <el-form :model="formData" label-width="80px">
        <el-form-item label="名称">
          <el-input v-model="labelInput" />
        </el-form-item>
        <slot name="dialog-form" :form="formData" :node="editingNodeData" />
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmDialog">确定</el-button>
      </template>
    </ReDialog>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  ref,
  nextTick,
  watch,
  inject,
  provide } from "vue";
import { ElTree,
  ElButton,
  ElForm,
  ElFormItem,
  ElInput,
} from "element-plus";
import type Node from "element-plus/es/components/tree/src/model/node";
import type { TreeNodeData } from "element-plus";
import type { ReTreeItem, ReTreeEmitParams, ReTreeDragEvent, ReTreeLoader } from "./types";
import { useDataSource, http } from "@repo/core";
import { yieldToMain } from "@repo/utils";
import ReDialog from "../ReDialog";

interface ReTreeProps {
  // -- 数据源双模式 --
  /**
   * 静态数据（与 url/loader 互斥）。
   *
   * <p>传函数则等价于 {@link loader}，走远程加载（与 ReTable / ReSelect 的
   * 「data 传函数 = 加载器」约定一致）；根节点以 {@code null} 调用，
   * 子节点懒加载时以父节点数据调用。两者都传时以 data 的函数形态优先。</p>
   */
  data?: ReTreeItem[] | ReTreeLoader;
  /** 远程数据 url（便捷别名；统一口径为 data（数组｜函数）+ loader，同 ReTable / ReSelect） */
  url?: string;
  /** 远程数据加载器（与 data 传函数等价，url 为便捷别名） */
  loader?: ReTreeLoader;
  /** 远程默认展开的节点 id 列表（即初始展开级，影响懒加载） */
  defaultExpandedKeys?: (string | number)[];

  // -- el-tree 原生属性 --
  nodeKey?: string;
  emptyText?: string;
  renderAfterExpand?: boolean;
  checkStrictly?: boolean;
  defaultExpandAll?: boolean;
  expandOnClickNode?: boolean;
  checkOnClickNode?: boolean;
  checkDescendants?: boolean;
  autoExpandParent?: boolean;
  defaultCheckedKeys?: (string | number)[];
  currentNodeKey?: string | number;
  showCheckbox?: boolean;
  draggable?: boolean;
  allowDrag?: (node: Node) => boolean;
  allowDrop?: (draggingNode: Node, dropNode: Node, type: "inner" | "prev" | "next") => boolean;
  props?: { children?: string; label?: string; disabled?: string; isLeaf?: string; class?: string | ((data: TreeNodeData, node: Node) => string | Record<string, boolean>) };
  lazy?: boolean;
  highlightCurrent?: boolean;
  load?: (node: Node, resolve: (data: ReTreeItem[]) => void) => void;
  filterNodeMethod?: (value: string, data: TreeNodeData, node: Node) => boolean;
  accordion?: boolean;
  indent?: number;
  icon?: string | object;
  highlightClass?: string;

  // -- ReTree 自身扩展 --
  editable?: boolean;
  showToolbar?: boolean;
  enableAdd?: boolean;
  enableEdit?: boolean;
  enableRemove?: boolean;
  enableExpandAll?: boolean;
  enableCollapseAll?: boolean;
}

const props = withDefaults(defineProps<ReTreeProps>(), {
  data: undefined,
  url: undefined,
  loader: undefined,
  defaultExpandedKeys: () => [],

  nodeKey: "id",
  emptyText: "暂无数据",
  renderAfterExpand: true,
  checkStrictly: false,
  defaultExpandAll: false,
  expandOnClickNode: true,
  checkOnClickNode: false,
  checkDescendants: false,
  autoExpandParent: true,
  defaultCheckedKeys: () => [],
  showCheckbox: false,
  draggable: false,
  allowDrag: undefined,
  allowDrop: undefined,
  props: undefined,
  lazy: true, // 默认懒加载
  highlightCurrent: false,
  load: undefined,
  filterNodeMethod: undefined,
  accordion: false,
  indent: 16,
  icon: undefined,
  highlightClass: "",
  editable: false,
  showToolbar: false,
  enableAdd: false,
  enableEdit: false,
  enableRemove: false,
  enableExpandAll: false,
  enableCollapseAll: false,
});

const emit = defineEmits<{
  (e: "node-click", data: ReTreeItem, node: Node, event: MouseEvent): void;
  (e: "node-contextmenu", event: Event, data: ReTreeItem, node: Node): void;
  (e: "check-change", data: ReTreeItem, checked: boolean, indeterminate: boolean): void;
  (e: "check", data: ReTreeItem, checkedInfo: { checkedKeys: (string | number)[]; checkedNodes: ReTreeItem[]; halfCheckedKeys: (string | number)[]; halfCheckedNodes: ReTreeItem[] }): void;
  (e: "current-change", data: ReTreeItem | null, node: Node | null): void;
  (e: "node-expand", data: ReTreeItem, node: Node): void;
  (e: "node-collapse", data: ReTreeItem, node: Node): void;
  (e: "node-drag-start", node: Node, event: DragEvent): void;
  (e: "node-drag-enter", draggingNode: Node, dropNode: Node, event: DragEvent): void;
  (e: "node-drag-leave", draggingNode: Node, dropNode: Node, event: DragEvent): void;
  (e: "node-drag-over", draggingNode: Node, dropNode: Node, event: DragEvent): void;
  (e: "node-drag-end", draggingNode: Node, dropNode: Node | null, dropType: string | null, event: DragEvent): void;
  (e: "node-drop", draggingNode: Node, dropNode: Node, dropType: string, event: DragEvent): void;
  (e: "re-edit", payload: ReTreeEmitParams): void;
  (e: "re-remove", payload: ReTreeEmitParams): void;
  (e: "re-add", payload: ReTreeEmitParams): void;
  (e: "update:data", data: ReTreeItem[]): void;
}>();

/** el-tree 公开方法类型契约（本地宽松声明，规避官方类型与 ReTreeItem 的差异） */
interface ElTreeMethods {
  filter(value: string): void;
  getCheckedNodes(leafOnly?: boolean): TreeNodeData[];
  getCheckedKeys(leafOnly?: boolean): Array<string | number>;
  setCheckedKeys(keys: Array<string | number>, leafOnly?: boolean): void;
  setChecked(data: TreeNodeData | string | number, checked: boolean, deep?: boolean): void;
  getHalfCheckedNodes(): TreeNodeData[];
  getHalfCheckedKeys(): Array<string | number>;
  getCurrentKey(): string | number | null;
  getCurrentNode(): TreeNodeData | null;
  setCurrentKey(key: string | number): void;
  setCurrentNode(node: TreeNodeData): void;
  getNode(data: TreeNodeData | string | number): Node | undefined;
  remove(data: TreeNodeData | string | number): void;
  append(data: TreeNodeData, parent: TreeNodeData): void;
  insertBefore(data: TreeNodeData, ref: TreeNodeData): void;
  insertAfter(data: TreeNodeData, ref: TreeNodeData): void;
  updateKeyChildren(key: string | number, data: TreeNodeData[]): void;
  expandAll(): void;
  collapseAll(): void;
}

/** 使用宽松的公开方法接口，匹配 el-tree 实例（官方类型不全，尤其是 expandAll/collapseAll） */
const treeRef = ref<ElTreeMethods | null>(null);

// ---- 数据源处理 ----
/**
 * 数据源类型：data 传数组 = local；data 传函数等价于 loader；url = url；loader = loader。
 * 优先级 data(函数) &gt; loader &gt; url，与 ReSelect / ReTable 的 data+loader 口径一致。
 */
const sourceType = computed<"local" | "url" | "loader">(() => {
  if (typeof props.data === "function") return "loader";
  if (Array.isArray(props.data)) return "local";
  if (typeof props.loader === "function") return "loader";
  if (props.url !== undefined) return "url";
  return "local";
});

/** 生效的远程加载器：data 传函数优先，其次 loader */
const activeLoader = computed<ReTreeLoader | undefined>(() =>
  typeof props.data === "function" ? props.data : props.loader,
);

const treeData = ref<ReTreeItem[]>(Array.isArray(props.data) ? props.data : []);

// 远程数据加载（首次加载根节点）——source 恒返回 ReTreeItem[]，避免混合 url 字符串破坏类型
const { loading: rootLoading, data: rootData, reload: rootReload } = useDataSource<ReTreeItem[]>(
  () => {
    if (sourceType.value === "url") {
      // url 模式：直接发请求拿根节点
      return http()
        .get(props.url!)
        .then(r => {
          const data = r.data;
          const arr = Array.isArray(data) ? data : (data as Record<string, unknown>).data ?? [];
          return arr as ReTreeItem[];
        })
        .catch(() => [] as ReTreeItem[]);
    }
    if (sourceType.value === "loader") {
      // loader / data 传函数：需要由外部提供根节点数据，根节点以 null 调用
      if (typeof activeLoader.value === "function") {
        return activeLoader.value(null as unknown as ReTreeItem) ?? [];
      }
      return [] as ReTreeItem[];
    }
    return Array.isArray(props.data) ? props.data : [];
  }
);

watch(rootData, (v) => {
  if (v) {
    treeData.value = v;
    emit("update:data", v);
  }
}, { immediate: true });

/**
 * 显式重新加载根节点。
 *
 * <p>先让一帧再取数：让树上的 loading 态先画出来，而不是「按下去没反应、
 * 过一会儿整棵树一起刷新」把主线程堵住（与 ReTable / ReSelect 同一口径）。</p>
 */
async function reloadTree(): Promise<void> {
  await yieldToMain();
  await rootReload();
}

// 本地模式下，外部 props.data 异步加载完成后需要同步到内部 treeData
watch(() => props.data, (v) => {
  if (sourceType.value === "local" && Array.isArray(v)) {
    treeData.value = v;
  }
});

// 懒加载函数（由 el-tree 的 load prop 触发）
const loadFunction = (node: Node, resolve: (data: ReTreeItem[]) => void) => {
  // 本地模式：children 已在 data 中提前给出，无需再走 load
  if (sourceType.value === "local") {
    const nodeData = node.data as ReTreeItem;
    const children = nodeData.children;
    resolve(children ?? []);
    return;
  }

  // 远程模式：调用 loader 或基于 url 拉取
  const parentId = node.key;
  if (props.url && parentId) {
    // url 模式：拼接 url + query?parentId=xxx
    const fullUrl = `${props.url}${props.url.includes("?") ? "&" : "?"}parentId=${encodeURIComponent(parentId)}`;
    http()
      .get(fullUrl)
      .then(r => {
        const data = r.data;
        const arr = Array.isArray(data) ? data : (data as Record<string, unknown>).data ?? [];
        resolve(arr as ReTreeItem[]);
      })
      .catch(() => resolve([]));
    return;
  }

  if (activeLoader.value && parentId) {
    Promise.resolve(activeLoader.value(node.data as ReTreeItem))
      .then(resolve)
      .catch(() => resolve([]));
    return;
  }

  resolve([]);
};

const lazyComputed = computed(() => sourceType.value !== "local" && !!props.lazy);

const options = computed(() => props.props || { children: "children", label: "label", disabled: "disabled" });

/** 当前 label 字段名（供表单 v-model 使用） */
const labelKey = computed(() => getLabelKey());

/**
 * 弹窗「名称」输入框的绑定值。
 *
 * <p>原来这里写的是 {@code v-model="(formData[labelKey] as string)"} —— 用 `as` 把类型
 * 直接糊过去。本仓对同一处问题（`ReTree/index.vue`）采用的是可写 computed 收口，
 * 这里与之一致：读时把非字符串按显示需要转成字符串，写时只改 {@link labelKey} 这一个字段，
 * 读写落在同一处，运行时行为和原先完全一致，同时不再靠 `as` 绕过类型检查。</p>
 *
 * <p>与 `CytoscapeGraph.vue` 里「宁可删掉调了不存在 API 的那行、也不用 `as any` 糊」
 * 是同一口径：`as` 只让检查闭嘴，不会让代码变对。</p>
 */
const labelInput = computed<string>({
  get() {
    const v = formData.value[labelKey.value];
    if (typeof v === "string") return v;
    return v === undefined || v === null ? "" : String(v);
  },
  set(v: string) {
    /* 用整体替换而不是就地写字段：formData 是 ref，替换同样触发响应式刷新，
       且不会与 `formData.value = { ...data }`（编辑时整体复制节点）那套写法冲突。 */
    formData.value = { ...formData.value, [labelKey.value]: v };
  },
});

const resolvedProps = computed(() => ({
  children: options.value.children || "children",
  label: options.value.label || "label",
  disabled: options.value.disabled || "disabled",
  isLeaf: options.value.isLeaf,
  class: options.value.class,
} as Record<string, unknown>));

const draggableComputed = computed(() => props.draggable);

// Dialog
const dialogVisible = ref(false);
const dialogTitle = ref("");
const editingNode = ref<Node | null>(null);
const editingNodeData = ref<ReTreeItem | null>(null);
const editingParentNode = ref<Node | null>(null);
const isEditing = ref(false);
const formData = ref<Record<string, unknown>>({});

function getNodeData(node: Node | null): ReTreeItem | null {
  return node?.data ?? null;
}

function getLabelKey(): string {
  return (options.value.label as string) || "label";
}

function findParent(tree: ReTreeItem[], target: ReTreeItem): ReTreeItem | null {
  for (const item of tree) {
    if (item.children?.includes(target)) return item;
    if (item.children) {
      const found = findParent(item.children, target);
      if (found) return found;
    }
  }
  return null;
}

function onNodeClick(data: ReTreeItem, node: Node, ..._rest: unknown[]): void {
  emit("node-click", data, node, _rest[0] as MouseEvent);
}

function onNodeContextmenu(event: Event, data: ReTreeItem, node: Node): void {
  emit("node-contextmenu", event, data, node);
}

function onCheckChange(data: ReTreeItem, checked: boolean, indeterminate: boolean): void {
  emit("check-change", data, checked, indeterminate);
}

function onCheck(data: ReTreeItem, checkedInfo: { checkedKeys: (string | number)[]; checkedNodes: ReTreeItem[]; halfCheckedKeys: (string | number)[]; halfCheckedNodes: ReTreeItem[] }): void {
  emit("check", data, checkedInfo);
}

function onCurrentChange(data: ReTreeItem | null, node: Node | null): void {
  emit("current-change", data, node);
}

function onNodeExpand(data: ReTreeItem, node: Node): void {
  emit("node-expand", data, node);
}

function onNodeCollapse(data: ReTreeItem, node: Node): void {
  emit("node-collapse", data, node);
}

function onNodeDragStart(node: Node, event: DragEvent): void {
  emit("node-drag-start", node, event);
}

function onNodeDragEnter(draggingNode: Node, dropNode: Node, event: DragEvent): void {
  emit("node-drag-enter", draggingNode, dropNode, event);
}

function onNodeDragLeave(draggingNode: Node, dropNode: Node, event: DragEvent): void {
  emit("node-drag-leave", draggingNode, dropNode, event);
}

function onNodeDragOver(draggingNode: Node, dropNode: Node, event: DragEvent): void {
  emit("node-drag-over", draggingNode, dropNode, event);
}

function onNodeDragEnd(draggingNode: Node, dropNode: Node | null, dropType: string | null, event: DragEvent): void {
  emit("node-drag-end", draggingNode, dropNode, dropType, event);
}

function onNodeDrop(draggingNode: Node, dropNode: Node, dropType: string, event: DragEvent): void {
  emit("node-drop", draggingNode, dropNode, dropType, event);
}

// Custom actions
function handleAdd(node: Node, data: ReTreeItem): void {
  dialogTitle.value = `添加子节点到 "${node.label}"`;
  editingNode.value = node;
  editingNodeData.value = data;
  editingParentNode.value = node;
  isEditing.value = false;
  const labelKey = getLabelKey();
  formData.value = { [labelKey]: "" };
  dialogVisible.value = true;
}

function handleEdit(node: Node, data: ReTreeItem): void {
  dialogTitle.value = `编辑 "${node.label}"`;
  editingNode.value = node;
  editingNodeData.value = data;
  editingParentNode.value = node.parent;
  isEditing.value = true;
  formData.value = { ...data };
  dialogVisible.value = true;
}

/**
 * 删除一个节点。
 *
 * <p>踩过的坑：不能只用 {@code node.parent} 判断「有没有父节点」。el-tree 会给
 * **根层节点**也挂一个 parent —— 那是它内部的**虚拟根**，`level` 为 0，且它的 `data`
 * 是**整棵树的数组**而不是某个节点对象（见 element-plus `model/node.mjs` 里
 * `if (this.level === 0 && isArray(this.data)) children = this.data`）。
 * 于是 `parent.data[childrenKey]` 会算出 `undefined`，紧接着 `siblings.indexOf(data)`
 * 抛 `TypeError: Cannot read properties of undefined (reading 'indexOf')`；
 * 该异常被 Vue 的事件错误处理吞进 console，外层只表现为「点删除毫无反应」。
 *
 * <p>所以真正的判别式是 **{@code parent.level === 0}**（虚拟根），而不是 parent 是否存在：
 * 根层节点要落到 {@code treeData} 上删，其余节点删它真实的同级列表。
 */
function handleRemove(node: Node, data: ReTreeItem): void {
  const parent = node.parent;
  const childrenKey = options.value.children || "children";

  /* level 为 0 的是内部虚拟根：它的 data 是整棵树的数组，必须回到 treeData 上定位。
     另外 `siblings` 可能不是数组（自定义 children 键、或懒加载未展开），
     必须判类型后再 indexOf —— 否则同样会抛错并静默失败。 */
  const rawSiblings =
    parent && parent.level > 0
      ? ((parent.data as Record<string, unknown>)[childrenKey] as ReTreeItem[] | undefined)
      : treeData.value;
  const siblings = Array.isArray(rawSiblings) ? rawSiblings : undefined;
  if (siblings) {
    const idx = siblings.indexOf(data);
    if (idx > -1) siblings.splice(idx, 1);
  }

  treeData.value = [...treeData.value];
  emit("re-remove", { item: data, tree: treeData.value });
  emit("update:data", treeData.value);
}

function addRoot(): void {
  dialogTitle.value = "添加根节点";
  editingNode.value = null;
  editingNodeData.value = null;
  editingParentNode.value = null;
  isEditing.value = false;
  const labelKey = getLabelKey();
  formData.value = { [labelKey]: "" };
  dialogVisible.value = true;
}

function confirmDialog(): void {
  const childrenKey = options.value.children || "children";
  const labelKey = getLabelKey();

  if (isEditing.value && editingNodeData.value) {
    Object.assign(editingNodeData.value, formData.value);
    emit("re-edit", { item: editingNodeData.value, tree: treeData.value });
  } else if (editingParentNode.value) {
    const newNode: ReTreeItem = { ...formData.value, [childrenKey]: [] };
    const parentData = editingParentNode.value.data as Record<string, unknown>;
    const siblings = (parentData[childrenKey] as ReTreeItem[]) || [];
    siblings.push(newNode);
    parentData[childrenKey] = siblings;
    if (editingParentNode.value) {
      editingParentNode.value.expand();
    }
    emit("re-add", { item: newNode, tree: treeData.value });
  } else {
    const newNode: ReTreeItem = { ...formData.value, [childrenKey]: [] };
    treeData.value.push(newNode);
    treeData.value = [...treeData.value];
    emit("re-add", { item: newNode, tree: treeData.value });
  }
  emit("update:data", treeData.value);
  dialogVisible.value = false;
}

function filter(value: string): void {
  treeRef.value?.filter(value);
}

/** 展开全部节点（工具栏按钮调用） */
function expandAll(): void {
  treeRef.value?.expandAll();
}

/** 收起全部节点（工具栏按钮调用） */
function collapseAll(): void {
  treeRef.value?.collapseAll();
}

function getCheckedNodes(leafOnly?: boolean): ReTreeItem[] {
  return (treeRef.value?.getCheckedNodes(leafOnly) ?? []) as ReTreeItem[];
}

function getCheckedKeys(leafOnly?: boolean): (string | number)[] {
  return treeRef.value?.getCheckedKeys(leafOnly) ?? [];
}

function setCheckedKeys(keys: (string | number)[], leafOnly?: boolean): void {
  treeRef.value?.setCheckedKeys(keys, leafOnly);
}

function setChecked(data: ReTreeItem | (string | number), checked: boolean, deep?: boolean): void {
  treeRef.value?.setChecked(data, checked, deep);
}

function getHalfCheckedNodes(): ReTreeItem[] {
  return (treeRef.value?.getHalfCheckedNodes() ?? []) as ReTreeItem[];
}

function getHalfCheckedKeys(): (string | number)[] {
  return treeRef.value?.getHalfCheckedKeys() ?? [];
}

function getCurrentKey(): string | number | undefined {
  const key = treeRef.value?.getCurrentKey();
  return key == null ? undefined : (key as string | number);
}

function getCurrentNode(): ReTreeItem | undefined {
  return treeRef.value?.getCurrentNode() as ReTreeItem | undefined;
}

function setCurrentKey(key: string | number): void {
  treeRef.value?.setCurrentKey(key);
}

function setCurrentNode(node: ReTreeItem): void {
  treeRef.value?.setCurrentNode(node as TreeNodeData);
}

function getNode(data: ReTreeItem | (string | number)): Node | undefined {
  return treeRef.value?.getNode(data as TreeNodeData | string | number);
}

function remove(data: ReTreeItem | (string | number)): void {
  treeRef.value?.remove(data as TreeNodeData | string | number);
}

function append(data: ReTreeItem, parent: ReTreeItem | (string | number)): void {
  const parentData = typeof parent === "object" ? parent : undefined;
  treeRef.value?.append(data as TreeNodeData, parentData as TreeNodeData);
}

function insertBefore(data: ReTreeItem, ref: ReTreeItem | (string | number)): void {
  const refData = typeof ref === "object" ? ref : undefined;
  treeRef.value?.insertBefore(data as TreeNodeData, refData as TreeNodeData);
}

function insertAfter(data: ReTreeItem, ref: ReTreeItem | (string | number)): void {
  const refData = typeof ref === "object" ? ref : undefined;
  treeRef.value?.insertAfter(data as TreeNodeData, refData as TreeNodeData);
}

function updateKey(oldKey: string | number, newKey: string | number): void {
  treeRef.value?.updateKeyChildren(oldKey, []);
}

function updateKeyChildren(key: string | number, data: ReTreeItem[]): void {
  treeRef.value?.updateKeyChildren(key, data);
}

function filterNodeMethodWrapper(value: string, data: TreeNodeData, node: Node): boolean {
  if (props.filterNodeMethod) {
    return props.filterNodeMethod(value, data, node);
  }
  return true;
}

defineExpose({
  filter,
  getCheckedNodes,
  getCheckedKeys,
  setCheckedKeys,
  setChecked,
  getHalfCheckedNodes,
  getHalfCheckedKeys,
  getCurrentKey,
  getCurrentNode,
  setCurrentKey,
  setCurrentNode,
  getNode,
  remove,
  append,
  insertBefore,
  insertAfter,
  updateKey,
  updateKeyChildren,
  filterNodeMethod: filterNodeMethodWrapper,
  reload: reloadTree,
});
</script>

<style scoped>
.re-tree {
  font-size: 14px;
  color: var(--el-text-color-primary);
  user-select: none;
}

.re-tree__toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  margin-bottom: 4px;
}

.re-tree__custom-node {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
  gap: 4px;
  padding: 2px 0;
  border-radius: 4px;
}

.re-tree__node-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
  line-height: 1.4;
}

.re-tree__node-actions {
  display: none;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}

.re-tree__custom-node:hover .re-tree__node-actions {
  display: flex;
}

.re-tree :deep(.el-tree-node__content) {
  height: auto;
  min-height: 32px;
  padding: 2px 0;
  border-radius: 6px;
}
</style>
