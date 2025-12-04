<template>
  <div class="console" :style="gridStyle" @contextmenu.prevent>
    <!-- 左侧：搜索 + 树（参考 Redis 实现） -->
    <div class="left overflow-auto thin-scrollbar">
      <el-input
        v-model="keyword"
        placeholder="搜索..."
        size="small"
        clearable
        @change="loadRoot"
      >
        <template #append>
          <IconifyIconOnline icon="ri:search-line" />
        </template>
      </el-input>
      <el-tree
        class="tree"
        :data="treeData"
        :props="treeProps"
        :load="loadChildrenLazy"
        lazy
        node-key="path"
        :expand-on-click-node="false"
        @node-click="open"
      >
        <template #default="{ node, data }">
          <IconifyIconOnline :icon="getZkNodeIcon(node, data)" class="mr-1" />
          <span class="flex justify-between w-full">
            <span>{{ data.name }}</span>
          </span>
        </template>
      </el-tree>
    </div>

    <!-- 分割条 -->
    <div
      class="splitter cursor-col-resize"
      @mousedown="onDragStart"
      @dblclick="resetWidth"
    />

    <!-- 右侧：路径 + 工具栏 + 内容 -->
    <div class="right image-paper">
      <div class="right-header">
        <div class="path" :title="path || '未选择'">
          <IconifyIconOnline icon="ri:route-line" class="mr-1" />
          <span class="ellipsis">{{ path || "未选择" }}</span>
        </div>
        <div class="toolbar">
          <el-button size="small" :disabled="!path" @click="refreshNode">
            <IconifyIconOnline icon="ri:refresh-line" class="mr-1" /> 刷新
          </el-button>
        </div>
      </div>
      <div class="right-body">
        <template v-if="path">
          <el-input v-model="content" type="textarea" :rows="40" disabled readonly />
        </template>
        <el-empty v-else description="请选择左侧节点" />
      </div>
      <div class="right-status">
        <span v-if="statusText">{{ statusText }}</span>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, computed, onBeforeUnmount } from "vue";
import {
  extractArrayFromApi,
  normalizeTreeNode,
} from "@/views/data-management/utils/dataTree";
import {
  getConsoleRoot,
  getConsoleChildren,
  getConsoleNode,
} from "@/api/data-management/system-data";

const props = defineProps<{ id: number }>();
const keyword = ref("");
const treeData = ref<any[]>([]);
const treeProps = { label: "name", children: "children", isLeaf: "leaf" };
const path = ref<string | undefined>(undefined);
const content = ref("");
const statusText = ref("");

async function loadRoot() {
  const res = await getConsoleRoot(props.id, keyword.value);
  const records = extractArrayFromApi(res?.data);
  treeData.value = records.map(normalizeTreeNode);
}
const loadChildrenLazy = async (
  node: any,
  resolve: (children: any[]) => void
) => {
  if (!node || node.level === 0) return resolve(treeData.value || []);
  const data = node.data || {};
  if (data.leaf === true) return resolve([]);
  const res = await getConsoleChildren(props.id, data.path);
  resolve(extractArrayFromApi(res?.data).map(normalizeTreeNode));
};

function getZkNodeIcon(node: any, data: any): string {
  const level = Number(node?.level || 0);
  if (level === 1) return "ri:server-line";
  return data?.leaf ? "ri:file-2-line" : "ri:folder-2-line";
}

async function open(node: any) {
  path.value = node?.path;
  await refreshNode();
}

async function refreshNode() {
  if (!path.value) return;
  const start = performance.now();
  const res = await getConsoleNode(props.id, path.value);
  content.value = (res?.data?.properties?.data || "") as any;
  content.value = tryPrettyJsonString(content.value);
  const ms = Math.round(performance.now() - start);
  statusText.value = `加载完成，用时 ${ms} ms`;
}
function tryPrettyJsonString(src: string): string {
  const s = (src || "").trim();
  if (!s) return src;
  const first = s[0];
  const last = s[s.length - 1];
  // 粗略判断可能是 JSON 文本
  if ((first === "{" && last === "}") || (first === "[" && last === "]")) {
    try {
      const obj = JSON.parse(s);
      return JSON.stringify(obj, null, 2);
    } catch {
      return src; // 非合法 JSON，原样返回
    }
  }
  return src;
}
// 左右拖拽
const leftWidth = ref(300);
const isDragging = ref(false);
const gridStyle = computed(() => ({
  gridTemplateColumns: `${leftWidth.value}px 6px 1fr`,
}));
let startX = 0,
  startW = 300;
function onDragStart(e: MouseEvent) {
  isDragging.value = true;
  startX = e.clientX;
  startW = leftWidth.value;
  document.addEventListener("mousemove", onDragging);
  document.addEventListener("mouseup", onDragEnd);
  document.body.style.cursor = "col-resize";
}
function onDragging(e: MouseEvent) {
  if (!isDragging.value) return;
  const dx = e.clientX - startX;
  leftWidth.value = Math.min(800, Math.max(220, startW + dx));
}
function onDragEnd() {
  if (!isDragging.value) return;
  isDragging.value = false;
  document.removeEventListener("mousemove", onDragging);
  document.removeEventListener("mouseup", onDragEnd);
  document.body.style.cursor = "";
}
function resetWidth() {
  leftWidth.value = 300;
}

onBeforeUnmount(() => onDragEnd());

onMounted(loadRoot);
</script>
<style scoped lang="scss">
.console {
  display: grid;
  grid-template-columns: 300px 1fr;
  height: calc(100vh - 16px);
  overflow: hidden;
}
.left {
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 8px;
  display: flex;
  flex-direction: column;
}
.tree {
  margin-top: 8px;
  flex: 1;
  overflow: auto;
}
.right {
  border: 1px solid #eee;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.right-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 8px;
  border-bottom: 1px solid #eee;
  background: var(--el-fill-color-lighter);
}
.right-header .path {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--el-text-color-secondary);
}
.ellipsis {
  max-width: 520px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.splitter {
  width: 6px;
  cursor: col-resize;
  background: var(--el-border-color-lighter);
  border-left: 1px solid var(--el-border-color-lighter);
  border-right: 1px solid var(--el-border-color-lighter);
}
.splitter:hover {
  background: var(--el-border-color);
}
.right-body {
  padding: 8px;
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 8px;
  overflow: hidden;
}
.image-paper {
  background:
    linear-gradient(transparent 39px, rgba(0, 0, 0, 0.035) 40px) 0 0 / 100% 40px,
    linear-gradient(90deg, transparent 39px, rgba(0, 0, 0, 0.035) 40px) 0 0 /
      40px 100%,
    linear-gradient(#fff, #fff);
}
.right-status {
  height: 28px;
  border-top: 1px solid #eee;
  display: flex;
  align-items: center;
  padding: 0 8px;
  color: var(--el-text-color-secondary);
}
</style>
