<template>
  <div class="console" :style="gridStyle" @contextmenu.prevent>
    <!-- 左侧：搜索 + 树（与 JDBC 相同接口） -->
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
      ref="treeRef"
        class="tree"
        :data="treeData"
        :props="treeProps"
        :load="loadChildrenLazy"
        lazy
        node-key="path"
        :expand-on-click-node="false"
        @node-click="handleNodeClick"
        @node-contextmenu="handleNodeContextMenu"
      >
        <template #default="{ node, data }">
          <IconifyIconOnline
            :icon="getRedisNodeIcon(node, data)"
            class="mr-1"
          />
          <span class="flex justify-between w-full">
            <span>{{ data.name }}</span>
            <span v-if="data.type" class="el-form-item-msg ml-2 mt-[3px]">
              {{data.description}}
              {{data.type}}
            </span>
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

    <!-- 右侧：头部 + 内容区（按 key 类型渲染不同组件） -->
    <div class="right image-paper">
      <div class="right-header">
        <div class="path" :title="currentPath || '未选择'">
          <IconifyIconOnline icon="ri:route-line" class="mr-1" />
          <span class="ellipsis">{{ currentPath || "未选择" }}</span>
          <span v-if="currentType" class="comment"
            >• 类型：{{ currentType }}</span
          >
          <span>• TTL: {{nodeValue?.properties?.ttl}}</span>
          <!-- <span>{{nodeValue}}</span> -->
        </div>
        <div class="toolbar">
          <el-button
            size="small"
            :disabled="!currentPath"
            @click="refreshValue"
          >
            <IconifyIconOnline icon="ri:refresh-line" class="mr-1" /> 刷新
          </el-button>
        </div>
      </div>

      <div class="right-body">
        <template v-if="currentPath">
          <!-- STRING -->
          <div v-if="viewerType === 'string'" class="result-wrap">
            <el-input
              v-model="stringValue"
              type="textarea"
              :rows="14"
              readonly
            />
          </div>
          <!-- HASH -->
          <el-table
            v-else-if="viewerType === 'hash'"
            :data="hashRows"
            size="small"
            border
            height="580px"
          >
            <el-table-column prop="field" label="字段" :min-width="160" />
            <el-table-column prop="value" label="值" :min-width="240" />
          </el-table>
          <!-- LIST -->
          <el-table
            v-else-if="viewerType === 'list'"
            :data="listRows"
            size="small"
            border
            height="580px"
          >
            <el-table-column prop="index" label="#" width="70" />
            <el-table-column prop="value" label="值" :min-width="240" />
          </el-table>
          <!-- SET -->
          <el-table
            v-else-if="viewerType === 'set'"
            :data="setRows"
            size="small"
            border
            height="580px"
          >
            <el-table-column prop="value" label="成员" :min-width="240" />
          </el-table>
          <!-- ZSET -->
          <el-table
            v-else-if="viewerType === 'zset'"
            :data="zsetRows"
            size="small"
            border
            height="580px"
          >
            <el-table-column prop="member" label="成员" :min-width="200" />
            <el-table-column prop="score" label="分数" width="120" />
          </el-table>
          <!-- 其他类型：JSON 展示 -->
          <div v-else class="result-wrap">
            <pre>{{ pretty(nodeValue) }}</pre>
          </div>
        </template>
        <el-empty v-else description="请选择左侧 key" />
      </div>

      <div class="right-status">
        <span v-if="statusText">{{ statusText }}</span>
        <CommonContextMenu
          :visible="menuVisible"
          :x="menuX"
          :y="menuY"
          :items="menuItems"
          @select="onMenuSelect"
          @close="menuVisible = false"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, onBeforeUnmount } from "vue";
import CommonContextMenu, {
  type MenuItem,
} from "@/components/CommonContextMenu.vue";

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
const treeRef = ref<any>();

// 左侧树
const keyword = ref("");
const treeData = ref<any[]>([]);
const treeProps = { label: "name", children: "children", isLeaf: "leaf" };
// 针对大量 key 的分页参数
const page = ref(1);
const size = ref(200);

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
  const res = await getConsoleChildren(props.id, data.path, page.value, size.value);
  resolve(extractArrayFromApi(res?.data).map(normalizeTreeNode));
};

function getRedisNodeIcon(node: any, data: any): string {
  const type = (data?.type || "").toString().toLowerCase();
  if (type.includes("db")) return "ri:database-2-line";
  if (type.includes("key")) return "ri:key-2-line";
  const level = Number(node?.level || 0);
  if (level <= 1) return "ri:database-2-line";
  return data?.leaf ? "ri:file-2-line" : "ri:folder-2-line";
}

// 右侧视图
const currentPath = ref<string | undefined>(undefined);
const currentType = ref<string>("");
const nodeValue = ref<any>(null);
const statusText = ref("");

const viewerType = computed(() => {
  const t = (currentType.value || "").toLowerCase();
  if (t.includes("string")) return "string";
  if (t.includes("hash")) return "hash";
  if (t.includes("list")) return "list";
  if (t.includes("set") && !t.includes("zset")) return "set";
  if (t.includes("zset") || t.includes("sorted")) return "zset";
  return "raw";
});

// 各类型派生数据
const stringValue = ref("");
const hashRows = ref<Array<{ field: string; value: string }>>([]);
const listRows = ref<Array<{ index: number; value: string }>>([]);
const setRows = ref<Array<{ value: string }>>([]);
const zsetRows = ref<Array<{ member: string; score: number }>>([]);

function normalizeValueForView(val: any) {
  stringValue.value = "";
  hashRows.value = [];
  listRows.value = [];
  setRows.value = [];
  zsetRows.value = [];

  switch (viewerType.value) {
    case "string": {
      if (typeof val === "string") {
        stringValue.value = tryPrettyJsonString(val);
      } else {
        stringValue.value = JSON.stringify(val, null, 2);
      }
      break;
    }
    case "hash": {
      if (Array.isArray(val)) {
        // [[field, value], ...] 或 [{field,value}]
        hashRows.value = val.map((it: any) =>
          Array.isArray(it)
            ? { field: String(it[0]), value: String(it[1]) }
            : { field: String(it.field), value: String(it.value) }
        );
      } else if (val && typeof val === "object") {
        hashRows.value = Object.keys(val).map((k) => ({
          field: k,
          value: String(val[k]),
        }));
      }
      break;
    }
    case "list": {
      const arr = Array.isArray(val) ? val : [];
      listRows.value = arr.map((v, i) => ({ index: i, value: String(v) }));
      break;
    }
    case "set": {
      const arr = Array.isArray(val) ? val : Object.values(val || {});
      setRows.value = arr.map((v) => ({ value: String(v) }));
      break;
    }
    case "zset": {
      const arr = Array.isArray(val) ? val : [];
      zsetRows.value = arr.map((it: any) =>
        Array.isArray(it)
          ? { member: String(it[0]), score: Number(it[1]) }
          : { member: String(it.member), score: Number(it.score) }
      );
      break;
    }
    default:
      // raw
      break;
  }
}

async function handleNodeClick(node: any) {
  currentPath.value = node?.path;
  currentType.value = node?.type || "";
  await refreshValue();
}

async function refreshValue() {
  if (!currentPath.value) return;
  const start = performance.now();
  const res = await getConsoleNode(props.id, currentPath.value);
  const val = res?.data?.type;
  nodeValue.value = res?.data;
  normalizeValueForView(val);
  const ms = Math.round(performance.now() - start);
  statusText.value = `加载完成，用时 ${ms} ms`;
}

function pretty(val: any) {
  try {
    if (typeof val === "string") {
      return tryPrettyJsonString(val);
    }
    return JSON.stringify(val, null, 2);
  } catch {
    return String(val);
  }
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
// 右键菜单状态
const menuVisible = ref(false);
const menuX = ref(0);
const menuY = ref(0);
const contextNode = ref<any | null>(null);
const menuItems = ref<MenuItem[]>([]);

function buildMenuItems(data: any): MenuItem[] {
  const items: MenuItem[] = [];
  if (data && data.leaf !== true) {
    items.push({ key: "refresh-node", label: "刷新", icon: "ri:refresh-line" });
  }
  items.push({
    key: "open",
    label: "打开",
    icon: "ri:folder-open-line",
    disabled: !data?.path,
  });
  items.push({
    key: "copy-key",
    label: "复制 Key 名称",
    icon: "ri:file-copy-line",
    disabled: !data?.name,
  });
  // 删除 Key：若不需要可移除此项
  items.push({
    key: "delete-key",
    label: "删除 Key",
    icon: "ri:delete-bin-line",
    disabled: !data?.path,
  });
  return items;
}

function handleNodeContextMenu(event: MouseEvent, data: any) {
  contextNode.value = data;
  menuItems.value = buildMenuItems(data);
  if (!menuItems.value.length) return;
  menuX.value = event.clientX;
  menuY.value = event.clientY;
  menuVisible.value = true;
  const hide = () => {
    menuVisible.value = false;
    document.removeEventListener("click", hide);
  };
  document.addEventListener("click", hide);
}

async function onMenuSelect(key: string) {
  const node = contextNode.value;
  if (!node) return;
  switch (key) {
    case "refresh-node":
      await refreshContextNodeChildren();
      break;
    case "open":
      await handleNodeClick(node);
      break;
    case "copy-key":
      await copyKeyName(node);
      break;
    case "delete-key":
      await deleteKey(node);
      break;
  }
}


/**
 * 刷新当前右键节点的子节点
 */
 async function refreshContextNodeChildren() {
  const node = contextNode.value;
  if (!node?.path) return;
  try {
    const res = await getConsoleChildren(props.id, node.path);
    const records = extractArrayFromApi(res?.data).map(normalizeTreeNode);
    if (treeRef.value && typeof treeRef.value.updateKeyChildren === "function") {
      // 用 API 覆盖子节点，避免越刷越多
      treeRef.value.updateKeyChildren(node.path, records);
    } else {
      // 兜底：直接覆盖数据
      node.children = records;
    }
    node.leaf = records.length === 0;
  } catch (e) {
    // ignore
  } finally {
    menuVisible.value = false;
  }
}

async function copyKeyName(node: any) {
  const name = node?.name || "";
  if (!name) return;
  await navigator.clipboard.writeText(name);
}

async function deleteKey(node: any) {
  if (!node?.path) return;
  try {
    const ok = window.confirm(`确认删除 Key：${node.name} ?`);
    if (!ok) return;
    const { executeConsole } = await import("@/api/data-management/system-data");
    await executeConsole(props.id, `DEL ${node.path}`, "redis");
    await refreshContextNodeChildren();
    if (currentPath.value === node.path) {
      currentPath.value = undefined;
      nodeValue.value = null;
      statusText.value = "当前 Key 已删除";
    }
  } catch (_) {}
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
.right-header .comment {
  margin-left: 8px;
  color: var(--el-text-color-regular);
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
.result-wrap {
  flex: 1;
  overflow: auto;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 8px;
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
