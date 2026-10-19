<template>
  <div class="re-tree">
    <div class="re-tree__toolbar" v-if="toolbar">
      <el-button plain @click="handleAddRoot" v-if="enableAdd">添加根节点</el-button>
      <slot name="toolbar-extra" />
    </div>

    <div class="re-tree__list" ref="listRef">
      <div
        v-for="(node, index) in flatList"
        :key="nodeKeyOf(node, index)"
        class="re-tree__node"
        :class="{
          're-tree__node--dragover': dragOverKey === node[keyField],
          're-tree__node--drag-source': dragKey === node[keyField],
          're-tree__node--selected': selectedKey === node[keyField],
        }"
        :style="node.style || {}"
        :draggable="draggable"
        @dragstart="onDragStart($event, node)"
        @dragover="onDragOver($event, node)"
        @dragleave="onDragLeave(node)"
        @drop="onDrop($event, node)"
        @dragend="onDragEnd"
        @click="onNodeClick(node)"
      >
        <div class="re-tree__node-indent" :style="{ width: `${(node.__depth ?? 0) * indent}px` }" />
        <span class="re-tree__node-toggle" v-if="node.children?.length" @click.stop="handleToggle(node)">
          <svg :class="{ 're-tree__node-toggle--expanded': node.__expanded }" width="10" height="10" viewBox="0 0 10 10">
            <path d="M3,1 L7,5 L3,9" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
          </svg>
        </span>
        <span class="re-tree__node-toggle re-tree__node-toggle--spacer" v-else />

        <slot name="icon" :node="node">
          <span v-if="getIcon(node)" class="re-tree__node-icon" v-html="getIcon(node)"></span>
        </slot>

        <slot name="label" :node="node">
          <span class="re-tree__node-label">{{ node[labelField] }}</span>
        </slot>

        <div class="re-tree__node-actions" v-if="toolbar || $slots.actions">
          <slot name="actions" :node="node" :edit="() => handleEdit(node)" :remove="() => handleRemove(node)" :add="() => handleAddChild(node)">
            <el-button v-if="enableAdd" link type="primary" @click.stop="handleAddChild(node)">添加</el-button>
            <el-button v-if="enableEdit" link type="primary" @click.stop="handleEdit(node)">编辑</el-button>
            <el-button v-if="enableRemove" link type="danger" @click.stop="handleRemove(node)">删除</el-button>
          </slot>
        </div>
      </div>
    </div>

    <ReDialog v-model="dialogVisible" :title="dialogTitle" width="400px">
      <el-form :model="formData" label-width="80px">
        <el-form-item label="名称">
          <el-input v-model="labelInput" />
        </el-form-item>
        <slot name="dialog-form" :form="formData" :node="editingNode" />
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
  ref,
  computed,
  watch,
  nextTick } from "vue";
import { ElButton,
  ElForm,
  ElFormItem,
  ElInput,
} from "element-plus";
import ReDialog from "../ReDialog";

export interface ReTreeNode {
  [key: string]: unknown;
  children?: ReTreeNode[];
  style?: Record<string, string>;
  __depth?: number;
  __expanded?: boolean;
}

interface Props {
  data: ReTreeNode[];
  keyField?: string;
  labelField?: string;
  iconField?: string;
  indent?: number;
  defaultExpandAll?: boolean;
  draggable?: boolean;
  toolbar?: boolean;
  enableAdd?: boolean;
  enableEdit?: boolean;
  enableRemove?: boolean;
  nodeKey?: string;
}

const props = withDefaults(defineProps<Props>(), {
  data: () => [],
  keyField: "id",
  labelField: "label",
  iconField: "",
  indent: 20,
  defaultExpandAll: false,
  draggable: false,
  toolbar: false,
  enableAdd: false,
  enableEdit: false,
  enableRemove: false,
  nodeKey: "",
});

const emit = defineEmits<{
  (e: "node-click", node: ReTreeNode): void;
  (e: "add", parent: ReTreeNode | null, data: Record<string, unknown>): void;
  (e: "edit", node: ReTreeNode, data: Record<string, unknown>): void;
  (e: "remove", node: ReTreeNode): void;
  (e: "drop", node: ReTreeNode, targetParent: ReTreeNode | null, index: number): void;
  (e: "update:data", data: ReTreeNode[]): void;
}>();

const listRef = ref<HTMLElement>();
const selectedKey = ref<string>("");
const dragKey = ref<string>("");
const dragOverKey = ref<string>("");
const dialogVisible = ref(false);
const dialogTitle = ref("");
const editingNode = ref<ReTreeNode | null>(null);
const editingParent = ref<ReTreeNode | null>(null);
const isEditing = ref(false);

const formData = ref<Record<string, unknown>>({});

/**
 * 弹窗「名称」输入框的绑定值。
 *
 * <p>{@code formData} 是 `Record<string, unknown>` —— 编辑节点时是整个节点复制进来的
 * （`formData.value = { ...node }`），里面既有 `children` / `style` 这类非字符串字段，
 * 也有任意扩展字段，所以不能简单收窄成 `Record<string, string>`（那样会与
 * `handleEdit` 的赋值冲突，实测就是这么把 6 个错误修成 6 个的）。
 * 这里用可写 computed 只把**标签字段**收口给 el-input：读时非字符串按显示需要转成字符串，
 * 写时只改这一个字段，读写落在同一处，运行时与原先一致。</p>
 */
const labelInput = computed<string>({
  get() {
    const v = formData.value[props.labelField];
    if (typeof v === "string") return v;
    return v === undefined || v === null ? "" : String(v);
  },
  set(v: string) {
    formData.value = { ...formData.value, [props.labelField]: v };
  },
});

/**
 * 取节点在 `:key` 上用的值。
 *
 * <p>{@code keyField} 是动态字段名，而 {@code ReTreeNode} 带 `[key: string]: unknown`
 * 索引签名，直接写 {@code :key="node[keyField]"} 推出来的是 `unknown`，
 * 与 `:key` 要求的 {@code PropertyKey | undefined} 不符（vue-tsc 报 TS2322）。
 * 这里把索引结果收敛成字符串；取不到时退回行下标，保证 key 始终有值。
 * 纯取值、无副作用，运行时与原先读同一个字段。</p>
 */
const nodeKeyOf = (node: ReTreeNode, index: number): string => {
  const raw = node[props.keyField];
  return raw === undefined || raw === null ? `__idx_${index}` : String(raw);
};

const treeData = ref<ReTreeNode[]>(props.data);

watch(() => props.data, (v) => {
  treeData.value = v;
}, { deep: true });

function flatten(tree: ReTreeNode[], depth = 0): ReTreeNode[] {
  const result: ReTreeNode[] = [];
  for (const node of tree) {
    node.__depth = depth;
    node.__expanded = node.__expanded ?? props.defaultExpandAll;
    result.push(node);
    if (node.children && node.__expanded) {
      result.push(...flatten(node.children, depth + 1));
    }
  }
  return result;
}

const flatList = computed(() => flatten(treeData.value));

function findParent(tree: ReTreeNode[], target: ReTreeNode): ReTreeNode | null {
  for (const node of tree) {
    if (node.children?.includes(target)) return node;
    if (node.children) {
      const found = findParent(node.children, target);
      if (found) return found;
    }
  }
  return null;
}

function handleToggle(node: ReTreeNode) {
  node.__expanded = !node.__expanded;
}

function getIcon(node: ReTreeNode): string {
  if (props.iconField && node[props.iconField]) return String(node[props.iconField]);
  return "";
}

function onNodeClick(node: ReTreeNode) {
  selectedKey.value = String(node[props.keyField]);
  emit("node-click", node);
}

const dragNode = ref<ReTreeNode | null>(null);

function onDragStart(e: DragEvent, node: ReTreeNode) {
  if (!props.draggable) return;
  dragNode.value = node;
  dragKey.value = String(node[props.keyField]);
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(node[props.keyField]));
  }
}

function onDragOver(e: DragEvent, node: ReTreeNode) {
  if (!props.draggable || !dragNode.value || dragNode.value === node) return;
  e.preventDefault();
  dragOverKey.value = String(node[props.keyField]);
  if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
}

function onDragLeave(node: ReTreeNode) {
  if (dragOverKey.value === String(node[props.keyField])) {
    dragOverKey.value = "";
  }
}

function onDrop(e: DragEvent, target: ReTreeNode) {
  e.preventDefault();
  if (!dragNode.value || dragNode.value === target) return;
  const parent = findParent(treeData.value, dragNode.value);
  const targetParent = findParent(treeData.value, target);

  const sourceParent = parent ? parent.children! : treeData.value;
  const sourceIndex = sourceParent.indexOf(dragNode.value);

  if (sourceIndex > -1) sourceParent.splice(sourceIndex, 1);

  const targetChildren = targetParent ? targetParent.children! : treeData.value;
  const targetIndex = targetChildren.indexOf(target);
  targetChildren.splice(targetIndex + 1, 0, dragNode.value);

  const dn = dragNode.value;
  emit("drop", dn, targetParent, targetIndex + 1);
  emit("update:data", [...treeData.value]);

  dragKey.value = "";
  dragOverKey.value = "";
  dragNode.value = null;
}

function onDragEnd() {
  dragKey.value = "";
  dragOverKey.value = "";
  dragNode.value = null;
}

function handleAddRoot() {
  dialogTitle.value = "添加根节点";
  editingNode.value = null;
  editingParent.value = null;
  isEditing.value = false;
  formData.value = { [props.labelField]: "" };
  dialogVisible.value = true;
}

function handleAddChild(node: ReTreeNode) {
  dialogTitle.value = "添加子节点";
  editingNode.value = null;
  editingParent.value = node;
  isEditing.value = false;
  formData.value = { [props.labelField]: "" };
  if (!node.children) node.children = [];
  dialogVisible.value = true;
}

function handleEdit(node: ReTreeNode) {
  dialogTitle.value = "编辑节点";
  editingNode.value = node;
  editingParent.value = findParent(treeData.value, node);
  isEditing.value = true;
  formData.value = { ...node };
  dialogVisible.value = true;
}

function handleRemove(node: ReTreeNode) {
  const parent = findParent(treeData.value, node);
  const list = parent ? parent.children! : treeData.value;
  const idx = list.indexOf(node);
  if (idx > -1) list.splice(idx, 1);
  emit("remove", node);
  emit("update:data", [...treeData.value]);
}

function confirmDialog() {
  if (isEditing.value && editingNode.value) {
    Object.assign(editingNode.value, formData.value);
    emit("edit", editingNode.value, formData.value);
  } else if (editingParent.value) {
    const newNode: ReTreeNode = { ...formData.value, children: [] };
    editingParent.value.children!.push(newNode);
    emit("add", editingParent.value, formData.value);
  } else {
    const newNode: ReTreeNode = { ...formData.value, children: [] };
    treeData.value.push(newNode);
    emit("add", null, formData.value);
  }
  emit("update:data", [...treeData.value]);
  dialogVisible.value = false;
}
</script>

<style scoped>
.re-tree {
  font-size: 14px;
  color: var(--el-text-color-primary);
}
.re-tree__toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  margin-bottom: 4px;
}
.re-tree__node {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s;
  user-select: none;
}
.re-tree__node:hover {
  background: var(--el-fill-color-light);
}
.re-tree__node--selected {
  background: var(--el-color-primary-light-9);
}
.re-tree__node--dragover {
  background: var(--el-color-primary-light-8);
  outline: 1px dashed var(--el-color-primary);
}
.re-tree__node--drag-source {
  opacity: 0.5;
}
.re-tree__node-indent {
  flex-shrink: 0;
}
.re-tree__node-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  color: var(--el-text-color-secondary);
  transition: transform 0.15s;
}
.re-tree__node-toggle svg {
  transition: transform 0.15s;
}
.re-tree__node-toggle--expanded svg {
  transform: rotate(90deg);
}
.re-tree__node-toggle--spacer {
  visibility: hidden;
}
.re-tree__node-icon {
  display: inline-flex;
  align-items: center;
  font-size: 16px;
  color: var(--el-text-color-secondary);
}
.re-tree__node-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
}
.re-tree__node-actions {
  display: none;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}
.re-tree__node:hover .re-tree__node-actions {
  display: flex;
}
</style>
