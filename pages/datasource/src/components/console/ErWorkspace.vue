<script setup lang="ts">
/**
 * ErWorkspace —— ER 图工作区（三栏 Inspector 布局）
 *
 * <p>渲染引擎仍然是 {@code ReRelationGraph}，本组件只重做它外面那层「视图外壳」：</p>
 * <ul>
 *   <li><b>顶部工具条</b>：表名过滤 + 重画 + 统计 + 布局 / 关系名 / 刷新 / 导出，全部单行不换行；</li>
 *   <li><b>左栏表清单</b>：按「缺失 / 有关系 / 孤立」分组，带本地筛选与关系数徽标。
 *       早先清单是页面底部一条 240px 的细条，100 张表时既滚不动也和白图抢垂直空间；</li>
 *   <li><b>中间画布</b>：撑满剩余空间；</li>
 *   <li><b>右栏检查器</b>：点节点或点清单即显示该表注释、主键、关系出/入与列清单，
 *       不必再为「看一眼列」弹一次对话框。双击节点才打开完整列清单弹窗。</li>
 * </ul>
 *
 * <p>为什么抽成组件：ER 图有两个入口（库页签 + 右键弹框），原先同一套 DOM 在
 * {@code DatabaseManagerView} 里复制了两份，任何视觉调整都要改两处、极易漏。
 * 现在图实例与选中态都归本组件所有，两个入口各持一个独立实例。</p>
 *
 * @author CH
 * @since 4.0.0.42
 */
import { computed, ref, watch } from "vue";
import ReButton from "@repo/ui/re-button";
import ReEmpty from "@repo/ui/re-empty";
import ReInput from "@repo/ui/re-input";
import ReSelect from "@repo/ui/re-select";
import ReRelationGraph from "@repo/ui/re-relation-graph";
import type { LayoutType, RelationEdge, RelationNode } from "@repo/ui/re-relation-graph";
import { ReOption } from "@repo/ui/re-kit";
import ErTableCard from "./ErTableCard.vue";
import type { DbColumnInfo, DbErRelation, DbErTable } from "../../api/manageConsoles";

const props = withDefaults(
  defineProps<{
    /** 表清单（含「被外键引用但不在库里」的占位表） */
    tables: DbErTable[];
    /** 全部外键 */
    relations: DbErRelation[];
    /** 表名 → 列清单缓存（reactive Map，随按需拉取自动更新） */
    cols: Map<string, DbColumnInfo[]>;
    /** 是否正在读取元数据 */
    loading?: boolean;
    /** 读取失败原因 */
    error?: string;
    /** 标题（库名 · ER 图） */
    qualified?: string;
    /** 表名过滤（LIKE 模式，触发后端重画） */
    filter?: string;
    /** 布局 */
    layout?: string;
    /** 边上是否显示关系名 */
    showLabels?: boolean;
    /** 布局可选项 */
    layoutChoices?: Array<{ value: string; label: string }>;
    /** 弹框内的紧凑模式（工具条更窄） */
    compact?: boolean;
  }>(),
  {
    loading: false,
    error: "",
    qualified: "",
    filter: "",
    layout: "dagre",
    showLabels: true,
    layoutChoices: () => [],
    compact: false,
  },
);

const emit = defineEmits<{
  (e: "update:filter", value: string): void;
  (e: "update:layout", value: string): void;
  (e: "update:showLabels", value: boolean): void;
  /** 按过滤条件重新读取元数据 */
  (e: "reload"): void;
  /** 导出 DOT */
  (e: "export"): void;
  /** 请求补拉某表的列（按需，幂等） */
  (e: "ensure-cols", name: string): void;
  /** 打开完整列清单弹窗 */
  (e: "open-cols", name: string): void;
}>();

/** 图实例只用来高亮 / 居中，暴露方法按需取用，故按 unknown 收再断言 */
const graphRef = ref<unknown>(null);

/** 左栏本地筛选（纯前端，不触发后端重画） */
const railFilter = ref("");

/** 当前选中的表（驱动右栏检查器） */
const selected = ref("");

const filterModel = computed<string>({
  get: () => props.filter,
  set: v => emit("update:filter", v ?? ""),
});

const layoutModel = computed<string>({
  get: () => props.layout,
  set: v => emit("update:layout", v ?? "dagre"),
});

/** 表名 → 关系条数。预先聚合一次，避免清单渲染时反复扫外键 */
const degreeMap = computed(() => {
  const m = new Map<string, number>();
  for (const r of props.relations) {
    if (r.fromTable) m.set(r.fromTable, (m.get(r.fromTable) ?? 0) + 1);
    if (r.toTable) m.set(r.toTable, (m.get(r.toTable) ?? 0) + 1);
  }
  return m;
});

function degreeOf(name: string): number {
  return degreeMap.value.get(name) ?? 0;
}

/** 只被外键引用、却不在表清单里的表（加载时补的占位节点，注释以「（」开头） */
const missingSet = computed(() => new Set(
  props.tables.filter(t => t.comment?.startsWith("（")).map(t => t.name),
));

const visibleTables = computed(() => {
  const kw = railFilter.value.trim().toLowerCase();
  if (!kw) return props.tables;
  return props.tables.filter(t => t.name.toLowerCase().includes(kw));
});

/** 左栏分组：缺失 → 有关系 → 孤立（孤立表是设计问题，单独列出来才看得见） */
const groups = computed(() => [
  {
    key: "missing",
    label: "缺失",
    rows: visibleTables.value.filter(t => missingSet.value.has(t.name)),
  },
  {
    key: "related",
    label: "有关系",
    rows: visibleTables.value.filter(t => !missingSet.value.has(t.name) && degreeOf(t.name) > 0),
  },
  {
    key: "isolated",
    label: "孤立",
    rows: visibleTables.value.filter(t => !missingSet.value.has(t.name) && degreeOf(t.name) === 0),
  },
]);

/** 该表在外键里出现过的列名（无全列缓存时作列预览的退化线索） */
function relColumnsOf(name: string): string[] {
  const out = new Set<string>();
  for (const r of props.relations) {
    if (r.fromTable === name && r.fromColumn) out.add(r.fromColumn);
    if (r.toTable === name && r.toColumn) out.add(r.toColumn);
  }
  return [...out];
}

/**
 * 图节点：有关系的表展开为「表卡」（html 节点，列预览 + 关系数徽标），
 * 孤立表收敛为精简圆点 —— 画布只对有内容的表花钱。
 */
const nodes = computed<RelationNode[]>(() => props.tables.map(t => {
  const missing = missingSet.value.has(t.name);
  const degree = degreeOf(t.name);
  if (degree > 0) {
    return {
      id: t.name,
      label: t.name,
      type: "html",
      size: [210, 132] as [number, number],
      data: {
        tableName: t.name,
        comment: t.comment,
        degree,
        missing,
        relCols: relColumnsOf(t.name),
        cols: props.cols.get(t.name),
      },
    };
  }
  return {
    id: t.name,
    label: t.name,
    type: "circle",
    size: 30,
    style: {
      fill: missing ? "var(--el-color-warning-light-9)" : "var(--el-bg-color-overlay)",
      stroke: missing ? "var(--el-color-warning)" : "var(--el-border-color-lighter)",
      lineWidth: 1,
      labelFill: "var(--el-text-color-secondary)",
      labelFontSize: 10,
      cursor: "pointer",
    },
  };
}));

/** 外键规则码 → 中文（JDBC 规范：0=RESTRICT 1=CASCADE 2=SET NULL 3=NO ACTION 4=SET DEFAULT） */
function fkRuleText(code?: number): string {
  switch (code) {
    case 0: return "限制";
    case 1: return "级联";
    case 2: return "置空";
    case 3: return "无动作";
    case 4: return "设默认";
    default: return "";
  }
}

/** 图上的边：一条外键一条边，指向被引用的表 */
const edges = computed<RelationEdge[]>(() => props.relations.map((r, i) => {
  const label = [
    r.fromColumn ? `${r.fromColumn} → ${r.toColumn ?? "?"}` : "",
    r.name ?? "",
    fkRuleText(r.deleteRule) ? `删除:${fkRuleText(r.deleteRule)}` : "",
  ].filter(Boolean).join("  ");
  return {
    // 复合外键会产生多条同名边，靠序号 + 列名区分，否则 G6 的边 id 冲突
    id: `fk-${i}-${r.fromTable}-${r.toTable}`,
    source: r.fromTable,
    target: r.toTable,
    label: props.showLabels ? label : undefined,
    type: "cubic-horizontal",
    directed: true,
    style: {
      stroke: "var(--el-color-primary-light-3)",
      lineWidth: 1.2,
      endArrow: true,
      labelFill: "var(--el-text-color-secondary)",
      labelFontSize: 10,
      labelBackground: true,
      labelBackgroundFill: "var(--el-bg-color-overlay)",
      labelBackgroundRadius: 2,
    },
    data: r,
  };
}));

/* ---------------- 右栏检查器 ---------------- */

const selectedTable = computed(() => props.tables.find(t => t.name === selected.value) ?? null);

const selectedCols = computed<DbColumnInfo[]>(() => props.cols.get(selected.value) ?? []);

/** 列预览：检查器里最多铺 60 行，再多就看「查看全部」 */
const inspectorCols = computed(() => selectedCols.value.slice(0, 60));

const selectedPk = computed(() => selectedCols.value
  .filter(c => c.isPrimaryKey === true)
  .map(c => c.name));

const outCount = computed(() => props.relations.filter(r => r.fromTable === selected.value).length);
const inCount = computed(() => props.relations.filter(r => r.toTable === selected.value).length);

const selectedMissing = computed(() => selectedTable.value != null
  && missingSet.value.has(selectedTable.value.name));

/**
 * 选中一张表：右栏出详情、图上高亮并居中，同时请父组件补拉列。
 *
 * @param name 表名
 */
function selectTable(name: string): void {
  if (!name) return;
  selected.value = name;
  emit("ensure-cols", name);
  const api = graphRef.value as {
    highlightElements?: (ids: string[]) => void;
    centerOn?: (id: string) => void;
  } | null;
  api?.highlightElements?.([name]);
  api?.centerOn?.(name);
}

/** 图上单击节点 → 选中 */
function onNodeClick(detail: { id?: string }): void {
  selectTable(String(detail?.id ?? ""));
}

/** 图上双击节点 → 打开完整列清单弹窗 */
function onNodeDblClick(detail: { id?: string }): void {
  const id = String(detail?.id ?? "");
  if (id) emit("open-cols", id);
}

/** 重画后选中的表可能已不在结果里，清掉避免右栏挂着一张不存在的表 */
watch(() => props.tables, (list) => {
  if (!selected.value) return;
  if (!list.some(t => t.name === selected.value)) selected.value = "";
});

const emptyText = computed(() => (props.filter ? "没有匹配的表" : "这个库里还没有表"));
</script>

<template>
  <div class="erw" :class="{ 'erw--compact': compact }">
    <!-- ========== 顶部工具条：单行，不换行 ========== -->
    <div class="erw-bar">
      <span class="erw-title" :title="qualified">{{ qualified }}</span>
      <ReInput
        v-model="filterModel"
        class="erw-filter erw-mono"
        placeholder="只画匹配这些表的图（支持 % 与 _，留空为全部）"
        clearable
        @keyup.enter="emit('reload')"
      />
      <ReButton layout="square" type="primary" icon="Search" tip="按过滤条件重画" @click="emit('reload')" />
      <span class="erw-stat">{{ loading ? "" : `${tables.length} 表 / ${relations.length} 关系` }}</span>
      <span class="erw-spacer" />
      <ReSelect v-model="layoutModel" class="erw-layout" placeholder="布局">
        <ReOption v-for="l in layoutChoices" :key="l.value" :label="l.label" :value="l.value" />
      </ReSelect>
      <ReButton
        layout="square"
        :type="showLabels ? 'primary' : ''"
        icon="Label"
        tip="显示 / 隐藏关系名"
        @click="emit('update:showLabels', !showLabels)"
      />
      <ReButton layout="square" icon="Refresh" tip="重新读取元数据" @click="emit('reload')" />
      <ReButton layout="square" icon="Download" tip="导出为 DOT（Graphviz）" @click="emit('export')" />
    </div>

    <!-- ========== 三栏：清单 · 画布 · 检查器 ========== -->
    <div class="erw-body">
      <!-- 左栏：表清单 -->
      <aside class="erw-rail">
        <div class="erw-rail-head">
          <span>表清单</span>
          <span class="erw-rail-count">{{ visibleTables.length }}</span>
        </div>
        <div class="erw-rail-search">
          <ReInput v-model="railFilter" placeholder="筛选表名" clearable size="small" />
        </div>
        <div class="erw-rail-body">
          <template v-for="g in groups" :key="g.key">
            <template v-if="g.rows.length > 0">
              <div class="erw-grp" :class="`erw-grp--${g.key}`">{{ g.label }} · {{ g.rows.length }}</div>
              <button
                v-for="t in g.rows"
                :key="t.name"
                type="button"
                class="erw-row"
                :class="{
                  'is-on': selected === t.name,
                  'is-missing': g.key === 'missing',
                  'is-zero': degreeOf(t.name) === 0,
                }"
                :title="t.comment || t.name"
                @click="selectTable(t.name)"
                @dblclick="emit('open-cols', t.name)"
              >
                <span class="erw-row-name">{{ t.name }}</span>
                <span class="erw-deg">{{ degreeOf(t.name) }}</span>
              </button>
            </template>
          </template>
          <div v-if="visibleTables.length === 0" class="erw-rail-empty">没有匹配的表</div>
        </div>
      </aside>

      <!-- 中间：画布 -->
      <div class="erw-canvas">
        <div v-if="loading" class="erw-mask">正在读取表与外键…</div>
        <ReEmpty v-else-if="error" class="erw-mask" :description="error" />
        <ReEmpty v-else-if="tables.length === 0" class="erw-mask" :description="emptyText" />
        <ReRelationGraph
          v-else
          ref="graphRef"
          class="erw-graph"
          :nodes="nodes"
          :edges="edges"
          :layout="layout as LayoutType"
          :toolbar="true"
          :minimap="true"
          @node-click="onNodeClick"
          @node-dblclick="onNodeDblClick"
        >
          <template #node-content="{ node }">
            <ErTableCard :node="node" @open-cols="selectTable" />
          </template>
        </ReRelationGraph>
      </div>

      <!-- 右栏：检查器 -->
      <aside class="erw-insp">
        <template v-if="selectedTable">
          <div class="erw-insp-head">
            <span class="erw-insp-name" :title="selectedTable.name">{{ selectedTable.name }}</span>
            <span v-if="selectedMissing" class="erw-tag erw-tag--warn">缺失</span>
            <span v-else-if="degreeOf(selectedTable.name) === 0" class="erw-tag">孤立</span>
          </div>
          <div v-if="selectedTable.comment && !selectedMissing" class="erw-insp-cmt" :title="selectedTable.comment">
            {{ selectedTable.comment }}
          </div>
          <div class="erw-kv">
            <span class="erw-kv-k">主键</span>
            <span class="erw-kv-v">{{ selectedPk.length ? selectedPk.join(", ") : "—" }}</span>
          </div>
          <div class="erw-kv">
            <span class="erw-kv-k">关系</span>
            <span class="erw-kv-v">{{ outCount }} 出 / {{ inCount }} 入</span>
          </div>
          <div class="erw-kv">
            <span class="erw-kv-k">列数</span>
            <span class="erw-kv-v">{{ selectedCols.length || "—" }}</span>
          </div>
          <div class="erw-insp-sep" />
          <div class="erw-cols">
            <div
              v-for="c in inspectorCols"
              :key="c.name"
              class="erw-col"
              :class="{ 'is-pk': c.isPrimaryKey === true }"
              :title="`${c.name} ${c.type}${c.nullable ? ' · 可空' : ''}`"
            >
              <span class="erw-col-name">{{ c.name }}</span>
              <span v-if="c.nullable" class="erw-col-null">NULL</span>
              <span class="erw-col-type">{{ c.type }}</span>
            </div>
            <div v-if="selectedCols.length === 0" class="erw-cols-empty">正在读取列…</div>
            <div v-else-if="selectedCols.length > inspectorCols.length" class="erw-cols-more">
              … 共 {{ selectedCols.length }} 列
            </div>
          </div>
          <button type="button" class="erw-insp-more" @click="emit('open-cols', selectedTable.name)">
            查看全部 {{ selectedCols.length || "" }} 列 →
          </button>
        </template>
        <div v-else class="erw-insp-empty">
          <div class="erw-insp-empty-t">未选中表</div>
          <div class="erw-insp-empty-d">在左侧清单或图上点一张表，这里显示它的注释、主键、关系与列清单。</div>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
/* ============ 外壳 ============ */
.erw {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  container-type: inline-size;
  gap: 8px;
}

/* ============ 工具条 ============ */
.erw-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  /* 空间不足时横向滚动，绝不把按钮挤到第二行 */
  flex-wrap: nowrap;
  overflow-x: auto;
  overflow-y: hidden;
  padding-bottom: 2px;
}

.erw-title {
  flex: none;
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.erw-filter {
  width: 280px;
  flex: 0 1 auto;
  min-width: 150px;
}

.erw-layout {
  width: 148px;
  flex: none;
}

.erw-stat {
  flex: none;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.erw-spacer { flex: 1 1 auto; min-width: 4px; }

.erw-mono { font-family: var(--el-font-family-mono, monospace); }

/* 弹框内：工具条更窄 */
.erw--compact .erw-filter { width: 210px; flex: none; }
.erw--compact .erw-layout { width: 126px; }
.erw--compact .erw-title { max-width: 150px; }

/* ============ 三栏 ============ */
.erw-body {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 196px minmax(0, 1fr) 236px;
  gap: 8px;
}

/* ---- 左栏 ---- */
.erw-rail {
  display: flex;
  flex-direction: column;
  min-height: 0;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
  background: var(--el-bg-color-overlay);
  overflow: hidden;
}

.erw-rail-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-regular);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.erw-rail-count {
  font-size: 11px;
  font-weight: 600;
  line-height: 16px;
  padding: 0 6px;
  border-radius: var(--el-radius-full, 9999px);
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
  font-variant-numeric: tabular-nums;
}

.erw-rail-search {
  padding: 6px 8px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.erw-rail-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-bottom: 4px;
}

.erw-grp {
  position: sticky;
  top: 0;
  z-index: 1;
  padding: 3px 10px;
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
  backdrop-filter: blur(4px);
}

.erw-grp--missing {
  color: var(--el-color-warning);
  background: var(--el-color-warning-light-9, var(--el-fill-color-light));
}

.erw-row {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 4px 10px;
  border: none;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: transparent;
  text-align: left;
  cursor: pointer;
  color: var(--el-text-color-primary);
  font-size: 12px;
  transition: background var(--el-transition-duration-fast, 0.2s);
}

.erw-row:hover { background: var(--el-fill-color-light); }

.erw-row.is-on {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  box-shadow: inset 2px 0 0 var(--el-color-primary);
}

.erw-row.is-missing { color: var(--el-color-warning); }

.erw-row.is-zero .erw-row-name { color: var(--el-text-color-secondary); }

.erw-row-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--el-font-family-mono, monospace);
}

.erw-deg {
  flex: none;
  font-size: 10.5px;
  line-height: 16px;
  padding: 0 6px;
  border-radius: var(--el-radius-full, 9999px);
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
  font-variant-numeric: tabular-nums;
}

.erw-row.is-on .erw-deg {
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-8, var(--el-fill-color-light));
}

.erw-rail-empty {
  padding: 12px 10px;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

/* ---- 中间画布 ---- */
.erw-canvas {
  position: relative;
  display: flex;
  min-width: 0;
  min-height: 0;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
  background: var(--el-bg-color-overlay);
  overflow: hidden;
}

.erw-graph {
  flex: 1;
  min-height: 320px;
  min-width: 0;
}

.erw-mask {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

/* 节点 / 边文字跟随主题，暗色下不再是黑底黑字 */
.erw :deep(.g6-node .g6-node-label),
.erw :deep(.g6-edge .g6-edge-label) {
  fill: var(--el-text-color-primary);
  color: var(--el-text-color-primary);
}

/* ---- 右栏检查器 ---- */
.erw-insp {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-height: 0;
  padding: 8px 10px 10px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
  background: var(--el-bg-color-overlay);
  overflow: hidden;
}

.erw-insp-head {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.erw-insp-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12.5px;
  font-weight: 700;
  font-family: var(--el-font-family-mono, monospace);
  color: var(--el-text-color-primary);
}

.erw-tag {
  flex: none;
  font-size: 10px;
  line-height: 16px;
  padding: 0 6px;
  border-radius: var(--el-radius-full, 9999px);
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
}

.erw-tag--warn {
  color: var(--el-color-warning);
  background: var(--el-color-warning-light-9);
}

.erw-insp-cmt {
  font-size: 11.5px;
  line-height: 1.45;
  color: var(--el-text-color-secondary);
  max-height: 34px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.erw-kv {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  font-size: 11.5px;
}

.erw-kv-k { flex: none; color: var(--el-text-color-secondary); }

.erw-kv-v {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--el-text-color-primary);
  font-family: var(--el-font-family-mono, monospace);
  font-variant-numeric: tabular-nums;
}

.erw-insp-sep {
  height: 1px;
  margin: 4px 0;
  background: var(--el-border-color-lighter);
}

.erw-cols {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.erw-col {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 2px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
  font-size: 11px;
  line-height: 15px;
  min-width: 0;
}

.erw-col-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--el-font-family-mono, monospace);
  color: var(--el-text-color-primary);
}

.erw-col.is-pk .erw-col-name {
  color: var(--el-color-warning);
  font-weight: 600;
}

.erw-col-null {
  flex: none;
  font-size: 9.5px;
  color: var(--el-text-color-placeholder);
}

.erw-col-type {
  flex: none;
  max-width: 84px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 10px;
  color: var(--el-text-color-secondary);
}

.erw-cols-empty,
.erw-cols-more {
  padding: 4px 0;
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}

.erw-insp-more {
  flex: none;
  margin-top: 4px;
  padding: 3px 0;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
  font-size: 11.5px;
  color: var(--el-color-primary);
}

.erw-insp-more:hover { text-decoration: underline; }

.erw-insp-empty {
  margin: auto;
  padding: 8px 4px;
  text-align: center;
}

.erw-insp-empty-t {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--el-text-color-regular);
  margin-bottom: 4px;
}

.erw-insp-empty-d {
  font-size: 11.5px;
  line-height: 1.55;
  color: var(--el-text-color-placeholder);
}

/* ============ 窄容器降级：先收检查器，再收清单 ============ */
@container (max-width: 900px) {
  .erw-body { grid-template-columns: 176px minmax(0, 1fr); }
  .erw-insp { display: none; }
}

@container (max-width: 620px) {
  .erw-body { grid-template-columns: minmax(0, 1fr); }
  .erw-rail { display: none; }
}
</style>
