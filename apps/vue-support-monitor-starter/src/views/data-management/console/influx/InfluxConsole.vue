<template>
  <div class="console" :style="gridStyle">
    <div class="left overflow-auto thin-scrollbar" @contextmenu.prevent>
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
        :key="treeVersion"
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
          <IconifyIconOnline :icon="getJdbcNodeIcon(node, data)" class="mr-1" />
          <span class="flex justify-between w-full !max-w-[120px]" >
            <span>
              <span>{{ data.name }}</span>
              <span class="el-form-item-msg ml-2 mt-[3px]">{{
                data.properties?.columnType
              }}</span>
              <span
                v-if="data.properties?.columnSize"
                class="el-form-item-msg ml-2 mt-[3px]"
                >({{ data.properties?.columnSize }})</span
              >
            </span>
            <span class="el-form-item-msg ml-2 mt-[3px]">{{
              data.properties?.comment
            }}</span>
          </span>
        </template>
      </el-tree>
    </div>
    <div
      class="splitter cursor-col-resize"
      @mousedown="onDragStart"
      @dblclick="resetWidth"
    />
    <div class="right image-paper">
      <div class="right-header">
        <div class="path" :title="currentPath || '未选择'">
          <IconifyIconOnline icon="ri:route-line" class="mr-1" />
          <span class="ellipsis">{{ currentPath || "未选择" }}</span>
          <span v-if="currentComment" class="comment" :title="currentComment"
            >• 注释：{{ currentComment }}</span
          >
        </div>
        <div class="toolbar">
          <el-button
            v-if="showEditor"
            type="primary"
            size="small"
            @click="execute"
          >
            <IconifyIconOnline :icon="icons.execute" class="mr-1" />
            执行
          </el-button>
          <el-button v-if="showEditor" size="small" @click="formatSql">
            <IconifyIconOnline :icon="formatIcon" class="mr-1" />
            格式化
          </el-button>
          <el-button size="small" @click="onRefreshTree">
            <IconifyIconOnline icon="ri:refresh-line" class="mr-1" /> 刷新
          </el-button>
          <el-button
            size="small"
            v-if="currentPath"
            @click="handleQueryPolicy"
          >
            <IconifyIconOnline :icon="icons.structure" class="mr-1" />
            查询策略
          </el-button>
          <el-button-group>
            <el-button
              size="small"
              :type="showTableComment ? 'primary' : 'default'"
              :disabled="!searched"
              @click="showTableComment = !showTableComment"
              >表头注释</el-button
            >
            <el-button
              size="small"
              :type="showFieldComments ? 'primary' : 'default'"
              :disabled="!searched"
              @click="showFieldComments = !showFieldComments"
              >字段注释</el-button
            >
          </el-button-group>
        </div>
      </div>
      <div class="right-body">
        <CodeEditor
          v-if="showEditor"
          v-model:content="sql"
          :showTool="false"
          :height="'200px'"
          :options="{ mode: 'sql' }"
        />
        <el-tabs
          v-model="activeTab"
          class="result-tabs"
          type="border-card"
          tab-position="top"
        >
          <el-tab-pane name="result" class="!h-full" label="结果">
            <div class="result" v-if="columns.length">
              <el-popover
                v-model:visible="columnFilterVisible"
                trigger="click"
                placement="bottom-end"
                width="260"
              >
                <template #reference>
                  <el-button
                    size="small"
                    text
                    @click.stop="columnFilterVisible = !columnFilterVisible"
                  >
                    <IconifyIconOnline
                      icon="ri:menu-unfold-line"
                      class="mr-1"
                    />
                    筛选列
                  </el-button>
                </template>
                <div class="col-filter">
                  <div class="ops">
                    <el-link
                      type="primary"
                      :underline="false"
                      @click="selectedColumnNames = [...columns]"
                      >全选</el-link
                    >
                    <el-link
                      type="danger"
                      :underline="false"
                      @click="selectedColumnNames = []"
                      >清空</el-link
                    >
                  </div>
                  <el-scrollbar height="220px">
                    <el-checkbox-group v-model="selectedColumnNames">
                      <el-checkbox
                        v-for="col in columns"
                        :key="col.name"
                        :label="col.name"
                        >{{ col.name }}</el-checkbox
                      >
                    </el-checkbox-group>
                  </el-scrollbar>
                </div>
              </el-popover>
            </div>
            <el-table
              border
              v-if="columns.length"
              :data="rows"
              size="small"
              height="580px"
              :row-class-name="rowClassName"
            >
              <el-table-column
                v-for="col in visibleColumns"
                :key="col"
                :prop="col.name"
                :label="col.name"
                :min-width="120"
              >
                <template #header>
                  <div
                    class="col-header flex flex-col justify-start items-start"
                  >
                    <div>
                      {{ col.name }}
                    </div>
                    <div
                      v-if="showTableComment"
                      class="hidden-note el-form-item-msg"
                      :title="col.comment"
                    >
                      ({{ col.comment }})
                    </div>

                    <div
                      v-if="analyzing && analysisData[col.name]?.length"
                      class="chart mini-bar"
                    >
                      <div
                        v-for="b in analysisData[col.name]"
                        :key="b.value"
                        class="bar-wrap"
                      >
                        <el-tooltip
                          :content="barTooltip(col.name, b)"
                          placement="top"
                          :show-after="200"
                        >
                          <div
                            class="bar"
                            :style="barStyle(col.name, b)"
                            @click.stop="toggleFilter(col.name, b.value)"
                          ></div>
                        </el-tooltip>
                      </div>
                    </div>
                  </div>
                </template>
                <template #default="{ row }">
                  <div class="flex flex-row">
                    <div
                      v-if="showFieldComments"
                      class="comment-text el-form-item-msg"
                      :title="col.name"
                    >
                      <span v-if="col.comment ">（{{ col.comment }}）</span>
                    </div>
                    <div>{{ row[col.name] }}</div>
                  </div>
                </template>
              </el-table-column>
            </el-table>
            <el-empty v-else description="无结果" />
          </el-tab-pane>
        </el-tabs>
      </div>
      <div class="right-status">
        <span v-if="statusText">{{ statusText }}</span>
      </div>
    </div>
    <CommonContextMenu
      :visible="menuVisible"
      :x="menuX"
      :y="menuY"
      :items="menuItems"
      @select="onMenuSelect"
      @close="menuVisible = false"
    />
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, computed, onBeforeUnmount, nextTick } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import CodeEditor from "@/components/codeEditor/index.vue";
// request不再直接使用，统一在system-data.ts封装
import {
  extractArrayFromApi,
  normalizeTreeNode,
} from "@/views/data-management/utils/dataTree";
import CommonContextMenu, {
  type MenuItem,
} from "@/components/CommonContextMenu.vue";
import {
  getConsoleConfig,
  getFieldComment,
  saveFieldComment,
  openTable,
  analyzeTable,
  getConsoleRoot,
  getConsoleChildren,
  getConsoleNode,
  executeConsole,
  getStructureCapabilities,
  renameTable,
  backupTable,
} from "@/api/system-data";

const props = defineProps<{ id: number }>();

const treeData = ref<any[]>([]);
const treeRef = ref<any>();
const treeVersion = ref(0);
const treeProps = { label: "name", children: "children", isLeaf: "leaf" };

// 工具栏图标（格式化图标由 JS 生成选择）
const icons = {
  execute: "ri:play-circle-line",
  structure: "ri:table-2",
} as const;
const formatIcon = computed(() => {
  // 简单随机切换书写笔/魔棒两种风格（可改为基于主题/偏好）
  return Math.random() > 0.5 ? "ri:magic-line" : "ri:pencil-ruler-2-line";
});

const searched = ref(false);
const keyword = ref("");
const currentPath = ref<string | undefined>(undefined);

const sql = ref("select * from file_system");
const columns = ref<string[]>([]);
const rows = ref<any[]>([]);
const tableComment = ref("");
const analyzing = ref(false);
const analysisData = ref<
  Record<string, Array<{ value: string; count: number }>>
>({});
const showEditor = ref(true);
const showTableComment = ref(false);
const showFieldComments = ref(false);
const columnFilterVisible = ref(false);
const selectedColumnNames = ref<string[]>([]);
const visibleColumns = computed(() => {
  if (!selectedColumnNames.value.length) return columns.value;
  return columns.value.filter((col) => selectedColumnNames.value.includes(col));
}) as any;
const activeTab = ref<"result" | "structure">("result");
const structureContent = ref("");
const statusText = ref("");
const currentNodeData = ref<any | null>(null);
const currentComment = ref("");

// 左右可拖拽分栏
const leftWidth = ref(300);
const isDragging = ref(false);
const gridStyle = computed(() => ({
  gridTemplateColumns: `${leftWidth.value}px 6px 1fr`,
}));
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

async function handleQueryPolicy() {
  const _currentPath =  currentPath.value.split('/');
  sql.value = "SHOW RETENTION POLICIES ON " + _currentPath[1];
  await execute();
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
const consoleConfig = ref<{
  jdbc?: {
    viewTableStructure?: boolean;
    copyTableName?: boolean;
    copyCreateTable?: boolean;
    addFieldComment?: boolean;
  };
}>({});

async function loadConsoleConfig() {
  if (!props.id) return;
  const res = await getConsoleConfig(props.id);
  const text = res?.data as string | undefined;
  if (text) {
    try {
      const parsed = JSON.parse(text) || {};
      // defaults when persisted config missing fields
      parsed.jdbc = Object.assign(
        {
          viewTableStructure: true,
          copyTableName: true,
          copyCreateTable: false,
          addFieldComment: true,
        },
        parsed.jdbc || {}
      );
      consoleConfig.value = parsed;
    } catch (_) {
      consoleConfig.value = {
        jdbc: {
          viewTableStructure: true,
          copyTableName: true,
          copyCreateTable: false,
          addFieldComment: true,
        },
      };
    }
  } else {
    // fallback defaults to avoid empty context menu
    consoleConfig.value = {
      jdbc: {
        viewTableStructure: true,
        copyTableName: true,
        copyCreateTable: false,
        addFieldComment: true,
      },
    };
  }
}

async function loadRoot() {
  const res = await getConsoleRoot(props.id, keyword.value);
  const records = extractArrayFromApi(res?.data);
  treeData.value = records.map(normalizeTreeNode);
  // 强制重建树，清理已加载/展开状态，避免重复追加
  await nextTick();
  treeVersion.value++;
}

function onRefreshTree() {
  loadRoot();
}

async function handleNodeClick(node: any) {
  currentNodeData.value = node;
  currentPath.value = node?.path;
  // 若为表节点，打开表（查询+注释）
  const type = (node?.type || "").toString().toUpperCase();
  const databaseName = node.parentPath.replace('/', '');
  if (type.includes("TABLE")) {
    sql.value = `select * from ${node.name} limit 100`;
    await execute();
    //   const resp = await openTable(props.id, node.path, 100);
    //   columns.value = resp?.data?.data?.columns || [];
    //   rows.value = [];
    //   await Promise.resolve();
    //   rows.value = resp?.data?.data?.rows || [];
    //   columnComments.value = resp?.data?.data?.columnComments || {};
    //   tableComment.value = resp?.data?.data?.tableComment || '';
    //   activeTab.value = 'result';
  }
}

// 懒加载子节点（结合 hasChildren 展示展开图标）
const loadChildrenLazy = async (
  node: any,
  resolve: (children: any[]) => void
) => {
  // 根节点（node.level === 0）直接返回已有 children
  if (!node || node.level === 0) {
    return resolve(treeData.value || []);
  }
  const data = node.data || {};
  if (data.leaf === true) {
    return resolve([]);
  }
  const parentPath = data.path;
  const res = await getConsoleChildren(props.id, parentPath);
  const records = extractArrayFromApi(res?.data).map(normalizeTreeNode);
  resolve(records);
};

// 根据类型/层级返回 JDBC 树节点图标
/**
 * 根据节点元信息返回合适的图标
 */
function getJdbcNodeIcon(node: any, data: any): string {
  try {
    
    const type = (data?.type || "").toString().toLowerCase();
    if (type) {
      if (
        type.includes("db") ||
        type.includes("database") ||
        type.includes("schema") ||
        type.includes("catalog")
      )
        return "ri:database-2-line";
      if (type.includes("table")) return "ri:table-2";
      if (type.includes("column") || type.includes("field"))
        return "ri:braces-line";
      if (type.includes("view")) return "ri:layout-2-line";
      if (type.includes("index")) return "ri:hashtag";
    }
    // 按层级兜底：1-库 2-表 3-列 其他-文件
    const level = Number(node?.level || 0);
    if (level <= 1) return "ri:database-2-line";
    if (level === 2) return "ri:table-2";
    if (level === 3) return "ri:braces-line";
    return data?.leaf ? "ri:file-2-line" : "ri:folder-2-line";
  } catch (error) {
    return "ri:table-2";
  }
}

async function execute() {
  const start = performance.now();
  searched.value = false;
  const res = await executeConsole(props.id, sql.value, "sql", currentPath.value);
  const data = res?.data;
  const dataData = data?.data || {};
  columns.value = dataData?.columns || [];
  await Promise.resolve();
  rows.value = dataData?.rows || [];
  searched.value = true;
  const ms = Math.round(performance.now() - start);
  statusText.value = `已返回 ${rows.value.length} 行，用时 ${ms} ms, ${data?.errorMessage || ""}`;
  activeTab.value = "result";
}

function formatSql() {
  const src = sql.value || "";
  if (!src.trim()) return;
  try {
    const formatted = simpleSqlFormat(src);
    sql.value = formatted;
    statusText.value = "已格式化 SQL";
  } catch (e) {
    statusText.value = "格式化失败";
  }
}

function simpleSqlFormat(input: string): string {
  let s = (input || "").replace(/\r\n/g, "\n").trim();
  // 先统一多空格为单空格（注意：简单处理，可能影响字符串字面量）
  s = s.replace(/\s+/g, " ");

  // 关键词大写
  const KEYWORDS = [
    "SELECT",
    "FROM",
    "WHERE",
    "GROUP BY",
    "ORDER BY",
    "HAVING",
    "LIMIT",
    "OFFSET",
    "JOIN",
    "LEFT JOIN",
    "RIGHT JOIN",
    "INNER JOIN",
    "OUTER JOIN",
    "CROSS JOIN",
    "ON",
    "AND",
    "OR",
    "UNION",
    "UNION ALL",
    "WITH",
    "VALUES",
    "INSERT",
    "UPDATE",
    "DELETE",
    "SET",
  ];
  // 先按长度降序，避免短词先匹配
  KEYWORDS.sort((a, b) => b.length - a.length);
  for (const kw of KEYWORDS) {
    const pattern = kw.replace(/\s+/g, "\\s+");
    const re = new RegExp(`\\b${pattern}\\b`, "gi");
    s = s.replace(re, kw);
  }

  // 在主要关键词前断行
  const BREAK_BEFORE = [
    "SELECT",
    "FROM",
    "WHERE",
    "GROUP BY",
    "ORDER BY",
    "HAVING",
    "LIMIT",
    "OFFSET",
    "UNION ALL",
    "UNION",
    "LEFT JOIN",
    "RIGHT JOIN",
    "INNER JOIN",
    "OUTER JOIN",
    "CROSS JOIN",
    "JOIN",
    "ON",
    "AND",
    "OR",
  ];
  for (const token of BREAK_BEFORE) {
    const pattern = token.replace(/\s+/g, "\\s+");
    const re = new RegExp(`\\s*\\b${pattern}\\b`, "g");
    s = s.replace(re, `\n${token}`);
  }

  // 逗号后换行，提升可读性
  s = s.replace(/,\s*/g, ",\n  ");
  // 多余空行压缩
  s = s.replace(/\n{2,}/g, "\n");

  // 简单缩进：根据括号层级
  const lines = s.split("\n").map((l) => l.trim());
  const out: string[] = [];
  let level = 0;
  for (let line of lines) {
    if (!line) continue;
    // 关闭括号在前，先减级
    const leadingClose = line.match(/^\)+/);
    if (leadingClose) {
      level = Math.max(0, level - leadingClose[0].length);
    }
    out.push("  ".repeat(level) + line);
    // 行内括号调整层级
    const open = (line.match(/\(/g) || []).length;
    const close = (line.match(/\)/g) || []).length;
    level = Math.max(0, level + open - close);
  }
  return out.join("\n");
}

async function openStructureTab() {
  if (!currentPath.value) return;
  structureContent.value = await fetchStructure(currentPath.value);
  activeTab.value = "structure";
}

function barStyle(col: string, b: { value: string; count: number }) {
  const list = analysisData.value[col] || [];
  const max = Math.max(1, ...list.map((i) => i.count));
  const h = Math.max(4, Math.round((b.count / max) * 40));
  return { height: `${h}px` };
}

function barTooltip(col: string, b: { value: string; count: number }) {
  const v =
    b.value === null || b.value === undefined || b.value === "null"
      ? "(空)"
      : String(b.value);
  return `${col}: ${v}（${b.count}）`;
}

const filters = ref<Record<string, Set<string>>>({});
const hasActiveFilters = computed(() =>
  Object.values(filters.value).some((s) => s && s.size > 0)
);
function toggleFilter(col: string, value: string) {
  if (!filters.value[col]) filters.value[col] = new Set();
  const set = filters.value[col];
  const v = String(value);
  if (set.has(v)) set.delete(v);
  else set.add(v);
}
function clearAllFilters() {
  filters.value = {} as any;
}
function removeFilterGroup(col: string) {
  delete filters.value[col];
}

function rowClassName({ row }) {
  // 当配置了某列的筛选值，则不在所选值集合中的行置灰
  for (const col of Object.keys(filters.value)) {
    const set = filters.value[col];
    if (set && set.size > 0) {
      const v = String(row[col]);
      if (!set.has(v)) return "row-dim";
    }
  }
  return "";
}

async function toggleAnalyze() {
  analyzing.value = !analyzing.value;
  if (!analyzing.value) {
    analysisData.value = {};
    filters.value = {} as any;
    return;
  }
  if (!currentPath.value) return;
  const resp = await analyzeTable(props.id, currentPath.value, 1000);
  analysisData.value = resp?.data || {};
}

async function fetchStructure(nodePath: string): Promise<string> {
  const res = await getConsoleNode(props.id, nodePath, "structure");
  const detail = res?.data?.data || "";
  return typeof detail === "string" ? detail : JSON.stringify(detail, null, 2);
}

async function loadCurrentComment() {
  currentComment.value = "";
  try {
    if (currentPath.value) {
      const res = await getFieldComment(props.id, currentPath.value);
      currentComment.value =
        res?.data?.data?.systemDataFieldCommentComment || "";
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
  return (
    Boolean(data?.leaf) &&
    (data?.level === 3 || /\.(\w+)$/.test(data?.path || ""))
  );
}

/**
 * 构建右键菜单项
 * - 根据控制台配置和节点类型动态生成
 */
function buildMenuItems(type): MenuItem[] {
  const allow = (p?: boolean) => Boolean(p);
  const items: MenuItem[] = [];
  // 刷新当前节点（仅非叶子节点显示）
  if (contextNode.value && contextNode.value.leaf !== true) {
    items.push({ key: "refresh-node", label: "刷新", icon: "ri:refresh-line" });
  }
  if (type?.includes("TABLE")) {
    items.push({ key: "open-table", label: "打开表", icon: "ri:table-2" });
  }
  if (
    allow(consoleConfig.value.jdbc?.copyTableName) &&
    type.includes("TABLE")
  ) {
    items.push({
      key: "copy-table-name",
      label: "复制表名",
      icon: "ri:file-copy-line",
    });
  }

  if (
    allow(consoleConfig.value.jdbc?.copyTableName) &&
    type.includes("FIELD")
  ) {
    items.push({
      key: "copy-column-name",
      label: "复制字段名",
      icon: "ri:file-copy-line",
    });
  }
  // 添加注释：仅在字段（叶子列）上显示
  if (
    allow(consoleConfig.value.jdbc?.addFieldComment) &&
    contextNode.value &&
    isColumnLeaf(contextNode.value) &&
    type.includes("FIELD")
  ) {
    items.push({
      key: "add-comment",
      label: "添加注释",
      icon: "ri:chat-new-line",
    });
  }
  return items;
}

const menuItems = ref<MenuItem[]>([]);

/**
 * 处理树节点右键事件，展示上下文菜单
 */
function handleNodeContextMenu(event: MouseEvent, data: any) {
  contextNode.value = data;
  menuItems.value = buildMenuItems(data.type);
  if (!menuItems.value.length) {
    return;
  }
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
    case "refresh-node":
      await refreshContextNodeChildren();
      break;
    case "open-table":
      await openTableAndRender(true);
      break;
    case "view-structure":
      await viewTableStructure(contextNode.value);
      break;
    case "copy-table-name":
      await copyTableName(contextNode.value);
      break;
    case "copy-column-name":
      await copyTableName(contextNode.value);
      break;
    case "copy-create-sql":
      await copyCreateSql(contextNode.value);
      break;
    case "add-comment":
      await addFieldComment(contextNode.value);
      break;
    case "rename-table": {
      if (!contextNode.value?.path) return;
      try {
        const { value } = await ElMessageBox.prompt(
          "请输入新表名：",
          "重命名表",
          { confirmButtonText: "确定", cancelButtonText: "取消",inputValue: contextNode.value.name }
        );
        if (!value || !value.trim()) return;
        await renameTable(props.id, {
          nodePath: contextNode.value.path,
          newName: value.trim(),
        });
        ElMessage.success("已重命名");
        contextNode.value.name = value.trim();
        refreshNodeChildren({
          path: contextNode.value.parentPath
        });
        // await refreshContextNodeChildren();
      } catch (_) {}
      break;
    }
    case "backup-table": {
      if (!contextNode.value?.path) return;
      try {
        const now = new Date();
        const yyyy = String(now.getFullYear());
        const mm = String(now.getMonth() + 1).padStart(2, "0");
        const dd = String(now.getDate()).padStart(2, "0");
        const defaultName = `${contextNode.value.name}${yyyy}${mm}${dd}`;
        const { value } = await ElMessageBox.prompt(
          "请输入备份表名：",
          "备份表",
          { confirmButtonText: "确定", cancelButtonText: "取消", inputValue: defaultName }
        );
        if (!value || !value.trim()) return;
        await backupTable(props.id, {
          nodePath: contextNode.value.path,
          backupName: value.trim(),
        });
        ElMessage.success("已发起备份");
        refreshNodeChildren({
          path: contextNode.value.parentPath
        });
      } catch (_) {}
      break;
    }
  }
}

async function openTableAndRender(hideEditor: boolean) {
  const node = contextNode.value;
  if (!node?.path) return;
  const resp = await openTable(props.id, node.path, 100);
  columns.value = resp?.data?.data?.columns || [];
  rows.value = [];
  await Promise.resolve();
  rows.value = resp?.data?.data?.rows || [];
  tableComment.value = resp?.data?.data?.tableComment || "";
  activeTab.value = "result";
  showEditor.value = !hideEditor ? true : false;
}

/**
 * 刷新当前节点的子节点
 */
async function refreshNodeChildren(node: any) {
  if (!node?.path) return;
  try {
    const res = await getConsoleChildren(props.id, node?.path);
    const records = extractArrayFromApi(res?.data).map(normalizeTreeNode);
    if (treeRef.value && typeof treeRef.value.updateKeyChildren === "function") {
      // 用 API 覆盖子节点，避免越刷越多
      treeRef.value.updateKeyChildren(node?.path, records);
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

/**
 * 查看表结构（将返回内容放置到 SQL 编辑器中展示）
 */
async function viewTableStructure(node: any) {
  if (!node?.path) return;
  const res = await getConsoleNode(props.id, node.path, "structure");
  const detail = res?.data?.data || "";
  // 简单展示：放到 editor 中
  sql.value =
    typeof detail === "string" ? detail : JSON.stringify(detail, null, 2);
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
  const res = await getConsoleNode(props.id, node.path, "ddl");
  const ddl = res?.data?.data || "";
  await navigator.clipboard.writeText(
    typeof ddl === "string" ? ddl : JSON.stringify(ddl)
  );
}

/**
 * 为指定字段节点添加注释
 * - 弹出输入框
 * - 提交到后端保存
 */
async function addFieldComment(node: any) {
  if (!node?.path) return;
  try {
    const { value } = await ElMessageBox.prompt(
      "请输入要添加的注释内容：",
      "添加注释",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        inputType: "textarea",
        inputPlaceholder: "请输入注释...",
        inputValue: node?.properties?.comment || "",
      }
    );
    if (!value || !value.trim()) return;
    await saveFieldComment(props.id, {
      nodePath: node.path,
      comment: value.trim(),
      dataType: node.properties?.dataType,
      nullable: node.properties?.nullable,
    });
    ElMessage.success("已保存注释");
    node.properties.comment = value.trim();
  } catch (_) {
    // canceled
  }
}

onMounted(async () => {
  await Promise.all([loadConsoleConfig(), loadRoot()]);
});
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

.left-toolbar {
  margin-top: 6px;
  display: flex;
  gap: 6px;
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
  flex: 1;
  flex-direction: column;
  gap: 8px;
  overflow: hidden;
}

.result {
  flex: 1;
  overflow: auto;
  display: flex;
  flex-direction: row;
  align-content: end;

  .result-content-toolbar {
    width: 100%;
    line-height: 32px;
    display: flex;
    align-items: center;
    justify-content: end;
    padding: 0px 10px 0px 10px;

    &:hover {
      background-color: #f0f2f5;
    }

    .item {
      cursor: pointer;
    }
  }
}

.result-tabs {
  flex: 1 !important;
}

.result-tabs :deep(.el-tabs__content) {
  padding: 0;
}

.col-header {
  display: flex;
  align-items: flex-start;
  gap: 6px;
}

.mini-bar {
  display: inline-flex;
  align-items: flex-end;
  gap: 2px;
  height: 42px;
  margin-left: 6px;
}

.mini-bar .bar {
  width: 6px;
  background: var(--el-color-primary);
  border-radius: 2px;
  cursor: pointer;
  opacity: 0.8;
}

.row-dim {
  opacity: 0.4;
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
