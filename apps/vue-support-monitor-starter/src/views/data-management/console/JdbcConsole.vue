<template>
  <div class="console" :style="gridStyle">
    <div class="left overflow-auto thin-scrollbar" @contextmenu.prevent>
      <el-input v-model="keyword" placeholder="搜索..." size="small" clearable @change="loadRoot">
        <template #append>
          <IconifyIconOnline icon="ri:search-line" />
        </template>
      </el-input>
      <el-tree class="tree" :data="treeData" :props="treeProps" :load="loadChildrenLazy" lazy node-key="path" @node-click="handleNodeClick" @node-contextmenu="handleNodeContextMenu">
        <template #default="{ node, data }">
          <IconifyIconOnline :icon="getJdbcNodeIcon(node, data)" class="mr-1" />
          <span class="flex justify-between w-full">
            <span>{{ data.name }}</span>
            <span class="el-form-item-msg ml-2 mt-[3px]">{{ data.properties?.comment }}</span>
          </span>
        </template>
      </el-tree>
    </div>
    <div class="splitter cursor-col-resize" @mousedown="onDragStart" @dblclick="resetWidth" />
    <div class="right image-paper">
      <div class="right-header">
        <div class="path" :title="currentPath || '未选择'">
          <IconifyIconOnline icon="ri:route-line" class="mr-1" />
          <span class="ellipsis">{{ currentPath || "未选择" }}</span>
          <span v-if="currentComment" class="comment" :title="currentComment">• 注释：{{ currentComment }}</span>
        </div>
        <div class="toolbar">
          <el-button type="primary" size="small" @click="execute">执行</el-button>
          <el-button size="small" @click="formatSql">格式化</el-button>
          <el-button size="small" :disabled="!currentPath" @click="openStructureTab">结构</el-button>
        </div>
      </div>
      <div class="right-body">
        <CodeEditor v-model:content="sql" :showTool="false" :height="'200px'" :options="{ mode: 'sql' }" />
        <el-tabs v-model="activeTab" class="result-tabs" type="border-card" tab-position="top">
          <el-tab-pane name="result" label="结果">
            <div class="result">
              <el-table v-if="rows.length" :data="rows" size="small" height="220">
                <el-table-column v-for="col in columns" :key="col" :prop="col" :label="col" :min-width="120" />
              </el-table>
              <el-empty v-else description="无结果" />
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
      <div class="right-status">
        <span v-if="statusText">{{ statusText }}</span>
      </div>
    </div>
    <CommonContextMenu :visible="menuVisible" :x="menuX" :y="menuY" :items="menuItems" @select="onMenuSelect" @close="menuVisible = false" />
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, computed, onBeforeUnmount } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import CodeEditor from "@/components/codeEditor/index.vue";
import request from "@/api/config";
import { extractArrayFromApi, normalizeTreeNode } from "@/views/data-management/utils/dataTree";
import CommonContextMenu, { type MenuItem } from "@/components/CommonContextMenu.vue";
import { getConsoleConfig, getFieldComment, saveFieldComment } from "@/api/system-data";

const props = defineProps<{ id: number }>();

const treeData = ref<any[]>([]);
const treeProps = { label: "name", children: "children", isLeaf: "leaf" };
const keyword = ref("");
const currentPath = ref<string | undefined>(undefined);

const sql = ref("select 1");
const columns = ref<string[]>([]);
const rows = ref<any[]>([]);
const activeTab = ref<"result" | "structure">("result");
const structureContent = ref("");
const statusText = ref("");
const currentNodeData = ref<any | null>(null);
const currentComment = ref("");

// 左右可拖拽分栏
const leftWidth = ref(300);
const isDragging = ref(false);
const gridStyle = computed(() => ({ gridTemplateColumns: `${leftWidth.value}px 6px 1fr` }));
let startX = 0;
let startW = 300;
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
  const next = Math.min(800, Math.max(220, startW + dx));
  leftWidth.value = next;
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

onBeforeUnmount(() => {
  onDragEnd();
});

// console config
const consoleConfig = ref<{ jdbc?: { viewTableStructure?: boolean; copyTableName?: boolean; copyCreateTable?: boolean; addFieldComment?: boolean } }>({});

async function loadConsoleConfig() {
  if (!props.id) return;
  const res = await getConsoleConfig(props.id);
  const text = res?.data as string | undefined;
  if (text) {
    try {
      const parsed = JSON.parse(text) || {};
      // defaults when persisted config missing fields
      parsed.jdbc = Object.assign({ viewTableStructure: true, copyTableName: true, copyCreateTable: false, addFieldComment: true }, parsed.jdbc || {});
      consoleConfig.value = parsed;
    } catch (_) {
      consoleConfig.value = { jdbc: { viewTableStructure: true, copyTableName: true, copyCreateTable: false, addFieldComment: true } };
    }
  } else {
    // fallback defaults to avoid empty context menu
    consoleConfig.value = { jdbc: { viewTableStructure: true, copyTableName: true, copyCreateTable: false, addFieldComment: true } };
  }
}

async function loadRoot() {
  const res = await request({ url: `/system/data/console/${props.id}/root`, method: "get", params: { keyword: keyword.value } });
  const records = extractArrayFromApi(res?.data);
  treeData.value = records.map(normalizeTreeNode);
}

async function handleNodeClick(node: any) {
  currentNodeData.value = node;
  currentPath.value = node?.path;
  await loadCurrentComment();
  const res = await request({ url: `/system/data/console/${props.id}/children`, method: "get", params: { parentPath: currentPath.value } });
  const records = extractArrayFromApi(res?.data);
  node.children = records.map(normalizeTreeNode);
}

// 懒加载子节点（结合 hasChildren 展示展开图标）
const loadChildrenLazy = async (node: any, resolve: (children: any[]) => void) => {
  // 根节点（node.level === 0）直接返回已有 children
  if (!node || node.level === 0) {
    return resolve(treeData.value || []);
  }
  const data = node.data || {};
  if (data.leaf === true) {
    return resolve([]);
  }
  const parentPath = data.path;
  const res = await request({ url: `/system/data/console/${props.id}/children`, method: "get", params: { parentPath } });
  const records = extractArrayFromApi(res?.data).map(normalizeTreeNode);
  resolve(records);
};

// 根据类型/层级返回 JDBC 树节点图标
/**
 * 根据节点元信息返回合适的图标
 */
function getJdbcNodeIcon(node: any, data: any): string {
  const type = (data?.type || "").toString().toLowerCase();
  if (type) {
    if (type.includes("db") || type.includes("database") || type.includes("schema") || type.includes("catalog")) return "ri:database-2-line";
    if (type.includes("table")) return "ri:table-2";
    if (type.includes("column") || type.includes("field")) return "ri:braces-line";
    if (type.includes("view")) return "ri:layout-2-line";
    if (type.includes("index")) return "ri:hashtag";
  }
  // 按层级兜底：1-库 2-表 3-列 其他-文件
  const level = Number(node?.level || 0);
  if (level <= 1) return "ri:database-2-line";
  if (level === 2) return "ri:table-2";
  if (level === 3) return "ri:braces-line";
  return data?.leaf ? "ri:file-2-line" : "ri:folder-2-line";
}

async function execute() {
  const start = performance.now();
  const res = await request({ url: `/system/data/console/${props.id}/execute`, method: "post", params: { type: "sql" }, data: sql.value });
  const data = res?.data;
  columns.value = data?.columns || [];
  rows.value = data?.rows || [];
  const ms = Math.round(performance.now() - start);
  statusText.value = `已返回 ${rows.value.length} 行，用时 ${ms} ms`;
  activeTab.value = "result";
}

function formatSql() {
  // 预留：格式化
}

async function openStructureTab() {
  if (!currentPath.value) return;
  structureContent.value = await fetchStructure(currentPath.value);
  activeTab.value = "structure";
}

async function fetchStructure(nodePath: string): Promise<string> {
  const res = await request({ url: `/system/data/console/${props.id}/node`, method: "get", params: { nodePath, action: "structure" } });
  const detail = res?.data?.data || "";
  return typeof detail === "string" ? detail : JSON.stringify(detail, null, 2);
}

async function loadCurrentComment() {
  currentComment.value = "";
  try {
    if (currentPath.value) {
      const res = await getFieldComment(props.id, currentPath.value);
      currentComment.value = res?.data?.data?.systemDataFieldCommentComment || "";
    }
  } catch (_) {}
}

/**
 * 右键菜单状态管理
 */
const menuVisible = ref(false);
const menuX = ref(0);
const menuY = ref(0);
const contextNode = ref<any | null>(null);

/**
 * 判断是否为列/字段类型的叶子节点
 */
function isColumnLeaf(data: any): boolean {
  const type = (data?.type || "").toString().toLowerCase();
  if (type.includes("column") || type.includes("field")) return true;
  // level 3 usually column, also rely on leaf flag
  return Boolean(data?.leaf) && (data?.level === 3 || /\.(\w+)$/.test(data?.path || ""));
}

/**
 * 构建右键菜单项
 * - 根据控制台配置和节点类型动态生成
 */
function buildMenuItems(): MenuItem[] {
  const allow = (p?: boolean) => Boolean(p);
  const items: MenuItem[] = [];
  if (allow(consoleConfig.value.jdbc?.viewTableStructure)) items.push({ key: "view-structure", label: "查看表结构", icon: "ri:table-2" });
  if (allow(consoleConfig.value.jdbc?.copyTableName)) items.push({ key: "copy-table-name", label: "复制表名", icon: "ri:file-copy-line" });
  if (allow(consoleConfig.value.jdbc?.copyCreateTable)) items.push({ key: "copy-create-sql", label: "复制建表语句", icon: "ri:article-line" });
  // 添加注释：仅在字段（叶子列）上显示
  if (allow(consoleConfig.value.jdbc?.addFieldComment) && contextNode.value && isColumnLeaf(contextNode.value)) {
    items.push({ key: "add-comment", label: "添加注释", icon: "ri:chat-new-line" });
  }
  return items;
}

const menuItems = ref<MenuItem[]>([]);

/**
 * 处理树节点右键事件，展示上下文菜单
 */
function handleNodeContextMenu(event: MouseEvent, data: any) {
  contextNode.value = data;
  menuItems.value = buildMenuItems();
  menuX.value = event.clientX;
  menuY.value = event.clientY;
  menuVisible.value = true;
  const hide = () => {
    menuVisible.value = false;
    document.removeEventListener("click", hide);
  };
  document.addEventListener("click", hide);
}

/**
 * 处理右键菜单点击
 */
async function onMenuSelect(key: string) {
  if (!contextNode.value) return;
  switch (key) {
    case "view-structure":
      await viewTableStructure(contextNode.value);
      break;
    case "copy-table-name":
      await copyTableName(contextNode.value);
      break;
    case "copy-create-sql":
      await copyCreateSql(contextNode.value);
      break;
    case "add-comment":
      await addFieldComment(contextNode.value);
      break;
  }
}

/**
 * 查看表结构（将返回内容放置到 SQL 编辑器中展示）
 */
async function viewTableStructure(node: any) {
  if (!node?.path) return;
  const res = await request({ url: `/system/data/console/${props.id}/node`, method: "get", params: { nodePath: node.path, action: "structure" } });
  const detail = res?.data?.data || "";
  // 简单展示：放到 editor 中
  sql.value = typeof detail === "string" ? detail : JSON.stringify(detail, null, 2);
}

/**
 * 复制树节点名称（通常为表名或列名）
 */
async function copyTableName(node: any) {
  const name = node?.name || "";
  if (!name) return;
  await navigator.clipboard.writeText(name);
}

/**
 * 复制建表语句
 */
async function copyCreateSql(node: any) {
  if (!node?.path) return;
  const res = await request({ url: `/system/data/console/${props.id}/node`, method: "get", params: { nodePath: node.path, action: "ddl" } });
  const ddl = res?.data?.data || "";
  await navigator.clipboard.writeText(typeof ddl === "string" ? ddl : JSON.stringify(ddl));
}

/**
 * 为指定字段节点添加注释
 * - 弹出输入框
 * - 提交到后端保存
 */
async function addFieldComment(node: any) {
  if (!node?.path) return;
  try {
    const { value } = await ElMessageBox.prompt("请输入要添加的注释内容：", "添加注释", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      inputType: "textarea",
      inputPlaceholder: "请输入注释...",
      inputValue: node?.properties?.comment || ""
    });
    if (!value || !value.trim()) return;
    await saveFieldComment(props.id, { nodePath: node.path, comment: value.trim() });
    ElMessage.success("已保存注释");
  } catch (_) {
    // canceled
  }
}

onMounted(async () => {
  await Promise.all([loadConsoleConfig(), loadRoot()]);
});
</script>
<style scoped>
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
  /* 拖拽分割条 */
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
  white-space: nowrap;
  text-overflow: ellipsis;
}
.right-body {
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: hidden;
}
.result {
  flex: 1;
  overflow: auto;
}
.result-tabs {
  flex: 1;
}
.result-tabs :deep(.el-tabs__content) {
  padding: 0;
}
.image-paper {
  background:
    linear-gradient(transparent 39px, rgba(0, 0, 0, 0.035) 40px) 0 0 / 100% 40px,
    linear-gradient(90deg, transparent 39px, rgba(0, 0, 0, 0.035) 40px) 0 0 / 40px 100%,
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
