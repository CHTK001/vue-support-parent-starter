<template>
  <div class="dsm tel-page" :class="{ resizing }">
    <div class="dsm-toolbar re-surface">
      <div class="dsm-toolbar-left">
        <ReIcon name="Coin" :size="18" class="dsm-title-icon dsm-mongo-icon" />
        <span class="dsm-title">MongoDB 文档管理</span>
      </div>
      <div class="dsm-toolbar-right">
        <div class="dsm-db-select" data-testid="dsm-db-select">
          <ReSelect
            v-model="activeDatabase"
            :options="dbOptions"
            :disabled="databases.length === 0"
            :placeholder="databases.length ? '选择逻辑库' : (gap ? '未读取到库' : '—')"
            filterable
            @change="onDbChange"
          />
        </div>
        <ReButton layout="square" icon="Connection" tip="测试连接" data-testid="dsm-btn-test" :disabled="!source" :loading="testing" @click="testConnection" />
        <ReButton layout="square" icon="Refresh" tip="刷新" data-testid="dsm-btn-refresh" :loading="loading" @click="refresh" />
      </div>
    </div>

    <MiddlewareGap :text="gap" @retry="refresh" />

    <div class="dsm-body">
      <div class="dsm-sidebar" :style="{ width: leftWidth + 'px' }">
        <!-- 集合名过滤 -->
        <div class="dsm-search-section">
          <ReInput v-model="collectionFilter" placeholder="集合名过滤" @keyup.enter="loadCollections" />
          <ReButton type="primary" :loading="loading" @click="loadCollections"><template #icon><ReIcon name="Search" size="12" /></template>查询</ReButton>
        </div>

        <div class="dsm-view-bar">
          <span class="dsm-view-count">{{ filteredCollections.length }} 集合</span>
        </div>

        <!-- 集合列表；顶部细扫描条 = 加载中（切库/刷新时自动重读） -->
        <div class="dsm-key-list">
          <div class="dsm-scan-bar" :class="{ 'is-active': loading }" data-testid="dsm-scan-bar"><span /></div>
          <div
            v-for="row in filteredCollections"
            :key="row.name"
            class="dsm-tree-node"
            :class="{ active: activeCollection === row.name }"
            :title="row.name"
            data-testid="dsm-collection-node"
            @click="selectCollection(row.name)"
          >
            <ReIcon name="Document" size="13" class="dsm-tree-icon" />
            <span class="dsm-tree-label">{{ row.name }}</span>
            <span class="dsm-tree-count">{{ row.estimatedCount == null ? "—" : row.estimatedCount }}</span>
          </div>
          <div v-if="filteredCollections.length === 0" class="dsm-tree-node">
            <span class="dsm-tree-label">{{ gap ? "未读取到集合" : "该库暂无集合" }}</span>
          </div>
        </div>
      </div>

      <!-- 拖拽调节左右宽度 -->
      <div class="dsm-split" :class="{ active: resizing }" title="拖拽调节宽度" @mousedown.prevent="startResize" />

      <div class="dsm-content">
        <!-- 顶部信息带：视觉（圆角/透明边框/双层投影）由模板上的 re-surface 类统一提供，这里只留布局 -->
        <div class="dsm-info-card re-surface">
          <div class="dsm-info-row"><span class="dsm-info-label">数据源</span><span class="dsm-info-value">{{ source ? source.name : "未选择" }}</span></div>
          <div class="dsm-info-row"><span class="dsm-info-label">连接地址</span><span class="dsm-info-value mono">{{ source ? `${source.host || "127.0.0.1"}:${source.port || 27017}` : "—" }}</span></div>
          <div class="dsm-info-row"><span class="dsm-info-label">当前库</span><span class="dsm-info-value mono" data-testid="dsm-active-database">{{ activeDatabase || "—" }}</span></div>
          <div class="dsm-info-row"><span class="dsm-info-label">集合数</span><span class="dsm-info-value mono">{{ collections.length }}</span></div>
          <div class="dsm-info-row">
            <span class="dsm-info-label">状态</span>
            <ReTag :type="gap ? 'danger' : 'success'">{{ gap ? "读取失败" : "正常" }}</ReTag>
          </div>
          <div class="dsm-info-row"><span class="dsm-info-label">服务端版本</span><span class="dsm-info-value mono">{{ version || "未探测" }}</span></div>
        </div>

        <!-- 只读查询面板：Mongo Shell 表达式（find/findOne/count/countDocuments/aggregate） -->
        <div class="dsm-query-panel">
          <div class="dsm-query-toolbar">
            <ReButton layout="square" type="primary" icon="VideoPlay" tip="执行（Ctrl+Enter）" data-testid="dsm-btn-exec" :disabled="!source || !queryText.trim()" :loading="queryRunning" @click="executeQuery" />
            <ReButton layout="square" icon="Delete" tip="清空编辑器" data-testid="dsm-btn-clear" :disabled="!queryText" @click="clearQuery" />
            <span class="dsm-spacer" />
            <span class="dsm-query-hint">集合名与只读方法输入即提示；仅支持 find/findOne/count/countDocuments/aggregate</span>
          </div>
          <DbSqlEditor
            v-model="queryText"
            language="mongo"
            :keywords="collectionNames"
            data-testid="dsm-mongo-editor"
            @execute="executeQuery"
          />
          <!-- 服务端拒绝 / 网络错误 -->
          <div v-if="queryError" class="dsm-query-error" data-testid="dsm-query-error">{{ queryError }}</div>
          <div class="dsm-query-result" data-testid="dsm-query-result">
            <div class="dsm-query-header">
              查询结果
              <span v-if="queryResult.rowCount > 0" class="dsm-query-meta">
                {{ queryResult.rowCount }} 行 · {{ queryResult.executionTimeMs }} ms
                <span v-if="queryResult.truncated" class="dsm-query-warn">已截断，服务端共 {{ queryResult.totalRows }} 行，请加 .limit(n) 收窄结果</span>
              </span>
            </div>
            <ReTable v-if="queryResult.columns.length > 0" :data="queryResult.rows" :columns="queryResult.columns" stripe border height="280px" @row-click="onRowClick" :config="{ pagination: { enable: false } }"/>
            <ReEmpty v-else description="点击左侧集合或输入 db.<集合>.find() 执行查询；点击结果行可查看完整文档" />
          </div>
        </div>
      </div>
    </div>

    <!-- 文档查看弹窗：按 _id 拉完整文档 -->
    <ReDialog v-model="docVisible" :title="`文档 - ${activeCollection}`" width="720px">
      <pre v-if="docText" class="dsm-doc-json" data-testid="dsm-doc-json">{{ docText }}</pre>
      <div v-else class="dsm-empty-inline">正在读取…</div>
    </ReDialog>
  </div>
</template>

<script setup lang="ts">
/**
 * MongoDB 数据源管理页（datasourceId 版控制台）。
 *
 * <p>只读取与操作「数据源管理」里登记的 mongodb 数据源，后端走
 * {@code /ms/monitor/mongodb}（官方同步驱动，每次请求临时建连、客户端按连接串缓存）。
 * 页面定位是「最小闭环」：逻辑库/集合浏览 + Mongo Shell 只读查询 + 文档查看；
 * CRUD、索引与 runCommand 不在本版范围内。</p>
 *
 * <p>查询口径与后端白名单一致：仅 find/findOne/count/countDocuments/aggregate
 * （可链 .limit/.skip/.sort），写方法与 $out/$merge 阶段由服务端拒绝。</p>
 *
 * @author CH
 * @since 4.0.0.43
 */
import "@repo/ui/surface";
import { message } from "@repo/core";
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import ReButton from "@repo/ui/re-button";
import ReDialog from "@repo/ui/re-dialog";
import ReEmpty from "@repo/ui/re-empty";
import ReIcon from "@repo/ui/re-icon";
import ReInput from "@repo/ui/re-input";
import ReSelect from "@repo/ui/re-select";
import ReTable from "@repo/ui/re-table";
import ReTag from "@repo/ui/re-tag";
import MiddlewareGap from "../../components/console/MiddlewareGap.vue";
import DbSqlEditor from "../../components/console/DbSqlEditor.vue";
import { useMiddlewareSource } from "../../utils/middlewareSource";
import {
  executeMongoQuery,
  fetchMongoCollections,
  fetchMongoDatabases,
  fetchMongoDocument,
  testMongoConnection,
  type MongoCollection,
  type MongoDatabase,
  type MongoQueryResult as MongoQueryResultShape,
  type MongoRow,
} from "../../api/mongoManageApi";

defineOptions({ name: "MongoManageView" });

/** ReTable 列定义 */
type Column = { prop: string; label: string; width?: number | string; minWidth?: number };

const { datasourceId, source, gap, bind, fail, ready } = useMiddlewareSource();

/** 逻辑库列表 */
const databases = ref<MongoDatabase[]>([]);
/** 当前逻辑库（shell 里的 db 所指） */
const activeDatabase = ref("");
/** 集合列表 */
const collections = ref<MongoCollection[]>([]);
/** 集合名过滤（侧栏） */
const collectionFilter = ref("");
/** 当前选中集合（查询面板按它补全） */
const activeCollection = ref("");
/** 服务端版本（测试连接后回填） */
const version = ref("");

/** 库/集合读取中 */
const loading = ref(false);
/** 测试连接中 */
const testing = ref(false);

/** 侧栏宽度持久化键 */
const LEFT_WIDTH_KEY = "mongo-left-width";
/** 侧栏宽度（拖拽调节，记录到 localStorage） */
const leftWidth = ref<number>(Number(localStorage.getItem(LEFT_WIDTH_KEY)) || 320);
/** 是否正在拖拽（拖拽中禁用文本选择） */
const resizing = ref(false);
/** 拖拽中的 window 监听器；中途卸载时要在 onBeforeUnmount 摘掉 */
let dragHandlers: { move: (ev: MouseEvent) => void; up: () => void } | null = null;

/**
 * 开始拖拽调节左侧宽度。
 *
 * @param e 鼠标按下事件
 */
function startResize(e: MouseEvent): void {
  resizing.value = true;
  const startX = e.clientX;
  const startWidth = leftWidth.value;
  const onMove = (ev: MouseEvent): void => {
    leftWidth.value = Math.min(560, Math.max(260, startWidth + ev.clientX - startX));
  };
  const onUp = (): void => {
    resizing.value = false;
    localStorage.setItem(LEFT_WIDTH_KEY, String(leftWidth.value));
    detachDrag();
  };
  const detachDrag = (): void => {
    window.removeEventListener("mousemove", onMove);
    window.removeEventListener("mouseup", onUp);
    dragHandlers = null;
  };
  dragHandlers = { move: onMove, up: onUp };
  window.addEventListener("mousemove", onMove);
  window.addEventListener("mouseup", onUp);
}

/** 逻辑库下拉选项（空库带标记） */
const dbOptions = computed(() => databases.value.map(d => ({
  label: d.empty ? `${d.name}（空库）` : d.name,
  value: d.name,
})));

/** 集合名补全候选（编辑器输入即提示） */
const collectionNames = computed(() => collections.value.map(c => c.name));

/** 按过滤词筛集合（大小写不敏感） */
const filteredCollections = computed(() => {
  const kw = collectionFilter.value.trim().toLowerCase();
  if (!kw) return collections.value;
  return collections.value.filter(c => c.name.toLowerCase().includes(kw));
});

// ==================== 查询面板 ====================

/** 查询编辑器文本（Mongo Shell 表达式） */
const queryText = ref("");
/** 查询执行中 */
const queryRunning = ref(false);
/** 最近一次查询错误（服务端拒绝/网络错误） */
const queryError = ref("");
/** 最近一次查询结果（列由行键并集推导） */
const queryResult = ref<{
  columns: Column[];
  rows: Record<string, unknown>[];
  rowCount: number;
  totalRows: number;
  truncated: boolean;
  executionTimeMs: number;
}>({ columns: [], rows: [], rowCount: 0, totalRows: 0, truncated: false, executionTimeMs: 0 });

/** 文档查看弹窗状态 */
const docVisible = ref(false);
/** 文档 JSON 文本 */
const docText = ref("");

/**
 * 把返回行里的对象/数组值转成 JSON 文本，便于表格展示
 * @param rows 原始行
 * @returns 展示行
 */
function stringifyRows(rows: MongoRow[]): Record<string, unknown>[] {
  return (rows || []).map(row => {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(row)) {
      out[key] = value !== null && typeof value === "object" ? JSON.stringify(value) : value;
    }
    return out;
  });
}

/**
 * 由返回行的键推导表格列。
 *
 * <p>与 Neo4j 控制台取首行键不同，这里取<b>全部行的键并集</b>：MongoDB 同一集合
 * 的文档结构可以不同（动态 schema），只按首行推导会让后续行的字段在表里消失。</p>
 *
 * @param rows 行数据
 * @returns 列定义
 */
function toColumns(rows: Record<string, unknown>[]): Column[] {
  const keys: string[] = [];
  for (const row of rows || []) {
    for (const key of Object.keys(row)) {
      if (!keys.includes(key)) keys.push(key);
    }
  }
  return keys.map(key => ({ prop: key, label: key, minWidth: 140 }));
}

/**
 * 执行查询面板里的只读 shell 表达式。
 */
async function executeQuery(): Promise<void> {
  const expression = queryText.value.trim();
  if (!expression) {
    message.warning("请输入查询语句");
    return;
  }
  queryRunning.value = true;
  queryError.value = "";
  try {
    const result: MongoQueryResultShape = await executeMongoQuery({
      datasourceId: datasourceId.value,
      database: activeDatabase.value || undefined,
      expression,
    });
    const rows = stringifyRows(result?.rows || []);
    queryResult.value = {
      columns: toColumns(rows),
      rows,
      rowCount: result?.rowCount ?? rows.length,
      totalRows: result?.totalRows ?? rows.length,
      truncated: !!result?.truncated,
      executionTimeMs: result?.executionTimeMs ?? 0,
    };
    ready();
  } catch (e) {
    queryResult.value = { columns: [], rows: [], rowCount: 0, totalRows: 0, truncated: false, executionTimeMs: 0 };
    queryError.value = String((e as Error)?.message ?? e);
  } finally {
    queryRunning.value = false;
  }
}

/** 清空查询编辑器与结果 */
function clearQuery(): void {
  queryText.value = "";
  queryError.value = "";
  queryResult.value = { columns: [], rows: [], rowCount: 0, totalRows: 0, truncated: false, executionTimeMs: 0 };
}

/**
 * 点击结果行查看完整文档（按 _id 拉取）。
 *
 * @param row 结果行
 */
async function onRowClick(row: Record<string, unknown>): Promise<void> {
  const id = String(row._id ?? "");
  if (!id || id === "undefined") {
    message.warning("该行没有 _id，无法查看完整文档");
    return;
  }
  docText.value = "";
  docVisible.value = true;
  try {
    const doc = await fetchMongoDocument({
      datasourceId: datasourceId.value,
      database: activeDatabase.value || undefined,
      collection: activeCollection.value,
      id,
    });
    docText.value = JSON.stringify(doc ?? {}, null, 2);
    ready();
  } catch (e) {
    docVisible.value = false;
    fail(e, "/ms/monitor/mongodb/document");
  }
}

// ==================== 数据加载 ====================

/** 系统库（默认不进业务视角） */
const SYSTEM_DATABASES = new Set(["admin", "config", "local"]);

/**
 * 读取逻辑库列表并挑选默认库。
 *
 * <p>默认库优先取数据源行配置的库（{@code source.database}），否则取第一个非系统库，
 * 全部都是系统库时用第一个。挑选结果会带上当前库的集合。</p>
 */
async function loadDatabases(): Promise<void> {
  if (!datasourceId.value) return;
  try {
    databases.value = (await fetchMongoDatabases(datasourceId.value)) || [];
  } catch (e) {
    databases.value = [];
    fail(e, "/ms/monitor/mongodb/databases");
    return;
  }
  ready();
  const names = databases.value.map(d => d.name);
  if (names.length === 0) return;
  // MongoDB 数据源的 database 字段是**鉴权库**（建连时 authSource），通常是 admin，
  // 不是业务视角的库。若照搬「配置库优先」，控制台每次都会开在 admin 的系统集合上，
  // 下面「避开系统库」的意图反而成了死代码。口径：配置库是**非系统库**才优先，
  // 否则取第一个业务库，全是系统库时退回第一个。
  const configured = (source.value?.database || "").trim();
  const pick = configured && names.includes(configured) && !SYSTEM_DATABASES.has(configured)
    ? configured
    : (names.find(n => !SYSTEM_DATABASES.has(n)) || names[0]);
  activeDatabase.value = pick;
  await loadCollections();
}

/**
 * 读取当前库的集合列表。
 */
async function loadCollections(): Promise<void> {
  if (!datasourceId.value || !activeDatabase.value) return;
  try {
    collections.value = (await fetchMongoCollections(datasourceId.value, activeDatabase.value)) || [];
    ready();
  } catch (e) {
    collections.value = [];
    fail(e, "/ms/monitor/mongodb/collections");
  }
}

/** 逻辑库下拉切换：重置选中与结果，重读集合 */
function onDbChange(value: string | number | null | undefined): void {
  if (value === "" || value == null) return;
  activeDatabase.value = String(value);
  activeCollection.value = "";
  collectionFilter.value = "";
  clearQuery();
  void loadCollections();
}

/**
 * 点击集合：填入 {@code db.<集合>.find()} 并立即执行（最小闭环：点一下就能看到文档）。
 *
 * @param name 集合名
 */
function selectCollection(name: string): void {
  activeCollection.value = name;
  queryText.value = `db.${name}.find()`;
  void executeQuery();
}

/**
 * 测试连接（走 MongoDB 管理探测：ping + buildInfo）。
 */
async function testConnection(): Promise<void> {
  if (!datasourceId.value) return;
  testing.value = true;
  try {
    const result = await testMongoConnection({ datasourceId: datasourceId.value });
    if (result?.connected) {
      version.value = result.version || "";
      message.success(result.version ? `连接成功 · MongoDB ${result.version}` : "连接成功");
      ready();
    } else {
      message.error(result?.message || "连接失败");
    }
  } catch (e) {
    fail(e, "/ms/monitor/mongodb/test");
  } finally {
    testing.value = false;
  }
}

/**
 * 全量刷新：重新绑定数据源并重读库与集合。
 */
async function refresh(): Promise<void> {
  loading.value = true;
  try {
    await bind("mongodb");
    if (!source.value) return;
    await loadDatabases();
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  void refresh();
});

onBeforeUnmount(() => {
  // 拖拽中的 window 监听挂在组件外，中途卸载（路由切换）必须摘掉，防止泄漏到下一个页面
  if (dragHandlers) {
    window.removeEventListener("mousemove", dragHandlers.move);
    window.removeEventListener("mouseup", dragHandlers.up);
    dragHandlers = null;
  }
});
</script>

<style scoped>
.dsm { display: flex; flex-direction: column; height: 100%; min-height: 100%; background: var(--bg-fill); }
/* 顶部工具条：视觉（圆角/边框/投影/底色/内距）由模板上的 re-surface 类统一提供
   （16px 圆角、透明边框 + 双层柔光投影），这里只留布局——不再自写一套卡片壳防漂移 */
.dsm-toolbar { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 16px; }
.dsm-toolbar-left { display: flex; align-items: center; gap: 10px; }
.dsm-title { font-size: 16px; font-weight: 600; color: var(--text-primary); }
.dsm-mongo-icon { color: #4db33d; }
.dsm-toolbar-right { display: flex; align-items: center; gap: 8px; }
.dsm-toolbar-right :deep(.rs-btn) { margin: 0; }
.dsm-db-select { width: 220px; flex-shrink: 0; }
.dsm-body { display: flex; flex: 1; gap: 0; overflow: hidden; }
.dsm.resizing { user-select: none; }
.dsm-split { position: relative; width: 16px; flex-shrink: 0; cursor: col-resize; }
.dsm-split::after { content: ""; position: absolute; top: 0; bottom: 0; left: 6px; width: 4px; border-radius: 2px; background: transparent; transition: background 0.15s; }
.dsm-split:hover::after, .dsm-split.active::after { background: var(--brand-400); }
.dsm-sidebar { border: 1px solid var(--border-subtle); border-radius: 8px; background: var(--bg-container); overflow: hidden; flex-shrink: 0; display: flex; flex-direction: column; }
.dsm-search-section { display: flex; gap: 6px; padding: 10px 12px; border-bottom: 1px solid var(--border-subtle); }
.dsm-search-section > *:first-child { flex: 1; }
.dsm-view-bar { display: flex; align-items: center; gap: 4px; padding: 8px 12px; border-bottom: 1px solid var(--border-subtle); }
.dsm-view-count { font-size: 12px; color: var(--text-tertiary); }
.dsm-key-list { flex: 1; padding: 6px 0; min-height: 80px; overflow-y: auto; }
.dsm-tree-node { position: relative; display: flex; align-items: center; gap: 6px; padding: 6px 12px; cursor: pointer; transition: background 0.15s; background: var(--bg-container); }
.dsm-tree-node:hover { background: var(--bg-hover); }
.dsm-tree-node.active { background: var(--brand-50); color: var(--brand-600); }
.dsm-tree-icon { flex-shrink: 0; }
.dsm-tree-label { flex: 1; font-size: 13px; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dsm-tree-count { font-size: 11px; color: var(--text-tertiary); background: var(--bg-fill); padding: 1px 6px; border-radius: 10px; }
/* 列表顶部扫描条：加载中走动画（切库/刷新集合时） */
.dsm-scan-bar { position: sticky; top: 0; z-index: 2; height: 2px; overflow: hidden; background: transparent; opacity: 0; transition: opacity 0.15s; }
.dsm-scan-bar.is-active { opacity: 1; }
.dsm-scan-bar span { display: block; width: 40%; height: 100%; background: linear-gradient(90deg, transparent, var(--brand-500, #409eff), transparent); transform: translateX(-100%); }
.dsm-scan-bar.is-active span { animation: dsm-scan-slide 1s linear infinite; }
@keyframes dsm-scan-slide { to { transform: translateX(350%); } }
.dsm-content { flex: 1; display: flex; flex-direction: column; gap: 16px; overflow-y: auto; }
/* 顶部信息带：视觉（圆角/边框/投影/底色）由模板上的 re-surface 类统一提供，这里只留网格布局 */
.dsm-info-card { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; flex-shrink: 0; }
.dsm-info-row { display: flex; flex-direction: column; gap: 4px; }
.dsm-info-label { font-size: 12px; color: var(--text-tertiary); }
.dsm-info-value { font-size: 14px; font-weight: 500; color: var(--text-primary); }
/* 查询面板：编辑器 + 操作行 + 结果区纵向排列，结果区吃掉剩余高度 */
.dsm-query-panel { flex: 1; display: flex; flex-direction: column; gap: 12px; min-height: 0; }
.dsm-query-toolbar { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.dsm-query-toolbar :deep(.rs-btn) { margin: 0; }
.dsm-spacer { flex: 1; }
.dsm-query-hint { font-size: 12px; color: var(--text-secondary, var(--el-text-color-secondary)); }
.dsm-query-error { padding: 10px 14px; font-size: 13px; color: var(--danger, #f56c6c); background: color-mix(in srgb, var(--danger, #f56c6c) 8%, transparent); border: 1px solid color-mix(in srgb, var(--danger, #f56c6c) 30%, transparent); border-radius: 6px; word-break: break-all; flex-shrink: 0; }
.dsm-query-result { flex: 1; display: flex; flex-direction: column; min-height: 260px; border: 1px solid var(--border-subtle); border-radius: 8px; background: var(--bg-container); overflow: hidden; }
.dsm-query-result :deep(.dsm-table-wrap) { flex: 1; min-height: 0; }
.dsm-query-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 8px 12px; font-size: 13px; font-weight: 500; color: var(--text-secondary); background: var(--bg-fill); border-bottom: 1px solid var(--border-subtle); flex-shrink: 0; }
.dsm-query-meta { font-size: 12px; font-weight: 400; color: var(--text-tertiary); }
.dsm-query-warn { margin-left: 8px; color: var(--el-color-warning, #e6a23c); }
/* 文档查看：美化 JSON */
.dsm-doc-json { margin: 0; padding: 12px; background: var(--bg-fill); border-radius: 6px; font-family: "JetBrains Mono", "Consolas", monospace; font-size: 12.5px; line-height: 1.6; color: var(--text-primary); white-space: pre-wrap; word-break: break-all; overflow: auto; max-height: 60vh; }
.dsm-empty-inline { padding: 16px; color: var(--text-tertiary); font-size: 13px; }
.mono { font-family: "JetBrains Mono", "Consolas", monospace; }
</style>
