<template>
  <ReDialog
    v-model="visible"
    title="导出向导"
    :subtitle="subtitle"
    :icon="Download"
    width="720px"
    :close-on-click-modal="false"
    :close-on-press-escape="!exporting"
  >
    <!-- 步骤条：4 步（对齐导入向导的圆形序号 + 连接线 + 标题/摘要形态） -->
    <div class="ew-steps">
      <div
        v-for="(item, index) in STEPS"
        :key="item.title"
        class="ew-step"
        :class="{ 'is-on': index === step, 'is-done': index < step }"
      >
        <span class="ew-step-dot">
          <ReIcon v-if="index < step" name="Select" :size="13" />
          <template v-else>{{ index + 1 }}</template>
        </span>
        <span v-if="index < STEPS.length - 1" class="ew-step-line" />
        <span class="ew-step-labels">
          <span class="ew-step-title">{{ item.title }}</span>
          <span v-if="index < step" class="ew-step-desc is-summary">{{ summaryOf(index) }}</span>
          <span v-else class="ew-step-desc">{{ item.description }}</span>
        </span>
      </div>
    </div>

    <!-- ========== 第 1 步：导出范围 ========== -->
    <section v-if="step === 0" class="ew-pane">
      <p class="ew-lead">请选择要导出的数据范围。</p>
      <div class="ew-scopes">
        <label
          v-for="s in SCOPES"
          :key="s.value"
          class="ew-scope"
          :class="{ 'is-on': scope === s.value }"
          @click="scope = s.value"
        >
          <input v-model="scope" type="radio" :value="s.value" :disabled="exporting" />
          <span class="ew-scope-body">
            <span class="ew-scope-name">{{ s.label }}</span>
            <span class="ew-scope-hint">{{ s.hint }}</span>
          </span>
        </label>
      </div>
      <div v-if="scope === 'current'" class="ew-current-summary">
        <span class="iw-label">当前条件</span>
        <span class="ew-current-text">
          {{
            currentText || "当前没有生效的筛选 / 排序，等同于全量导出"
          }}
        </span>
      </div>
      <p v-if="scope === 'current' && currentText" class="ew-hint">
        「当前查询结果」会带上当前 WHERE 条件与排序；筛选详情的每一步都在第 3 步
        可复查与修改。
      </p>
    </section>

    <!-- ========== 第 2 步：文件格式 ========== -->
    <section v-else-if="step === 1" class="ew-pane">
      <p class="ew-lead">选择导出文件的格式与内容。</p>
      <div class="ew-field-grid">
        <label class="ew-field">
          <span class="ew-field-label">文件格式</span>
          <ReSelect v-model="format" style="width: 100%">
            <ReOption label="CSV（逗号分隔，Excel 友好）" value="csv" />
            <ReOption label="TSV（制表符分隔）" value="tsv" />
            <ReOption label="JSON 数组" value="json" />
            <ReOption label="XML" value="xml" />
            <ReOption label="SQL 脚本（可回灌）" value="sql" />
          </ReSelect>
        </label>
        <label class="ew-field">
          <span class="ew-field-label">导出内容</span>
          <ReSelect v-model="contentScope" style="width: 100%">
            <ReOption label="仅数据" value="data" />
            <ReOption label="仅结构（建表语句）" value="structure" />
            <ReOption label="结构 + 数据" value="all" />
          </ReSelect>
        </label>
      </div>
      <p v-if="format !== 'sql' && contentScope === 'structure'" class="ew-note is-warn">
        结构只有建表语句，请选 SQL 格式
      </p>
      <p class="ew-hint">
        导出内容为「仅结构 / 结构+数据」时，SQL 脚本格式最完整；非 SQL 格式对结构
        导出只输出列清单，可读但不可回灌。
      </p>
    </section>

    <!-- ========== 第 3 步：列与排序 ========== -->
    <section v-else-if="step === 2" class="ew-pane">
      <p class="ew-lead">
        {{
          contentScope === "structure"
            ? "结构导出不涉及数据列过滤；仅结构时下方选项不生效。"
            : "设置导出范围与排序（可选）。"
        }}
      </p>

      <!-- 行数上限：全量导出语义下的硬性护栏（后端上限 200000） -->
      <div v-if="contentScope !== 'structure'" class="ew-field">
        <span class="ew-field-label">行数上限</span>
        <ReInputNumber v-model="limit" :min="1" :max="200000" controls-position="right" class="ew-limit" />
        <span class="ew-hint">后端硬上限 200000</span>
      </div>

      <div v-if="contentScope !== 'structure'" class="ew-field">
        <span class="ew-field-label">WHERE 过滤</span>
        <ReInput v-model="where" class="ew-mono ew-full" placeholder="留空导出全部；例：status = 1" clearable />
      </div>

      <div v-if="contentScope !== 'structure'" class="ew-field">
        <span class="ew-field-label">排序</span>
        <div class="ew-inline">
          <ReSelect v-model="orderBy" filterable clearable placeholder="不排序" class="ew-order-by">
            <ReOption v-for="c in orderColumns" :key="c" :label="c" :value="c" />
          </ReSelect>
          <ReSelect v-model="orderDir" class="ew-order-dir">
            <ReOption label="升序" value="ASC" />
            <ReOption label="降序" value="DESC" />
          </ReSelect>
        </div>
      </div>

      <p v-if="scope === 'current'" class="ew-note">
        「当前查询结果」的 WHERE / 排序已按当前生效条件预填，可在此修改；
        修改后按修改后的条件导出。
      </p>
    </section>

    <!-- ========== 第 4 步：执行 ========== -->
    <section v-else class="ew-pane">
      <p class="ew-lead">
        我们已收集导出所需的所有信息。点击 [开始] 按钮导出并下载。
      </p>
      <div class="ew-summary-list">
        <div class="ew-summary-item"><span>表</span><b class="ew-mono">{{ tableLabel }}</b></div>
        <div class="ew-summary-item"><span>范围</span><b>{{ scope === "full" ? "全量数据" : "当前查询结果" }}</b></div>
        <div class="ew-summary-item"><span>格式</span><b>{{ formatLabel }}</b></div>
        <div class="ew-summary-item"><span>内容</span><b>{{ contentScopeLabel }}</b></div>
        <div v-if="contentScope !== 'structure'" class="ew-summary-item">
          <span>行数上限</span><b>{{ limit.toLocaleString() }} 行</b>
        </div>
        <div v-if="contentScope !== 'structure' && where" class="ew-summary-item">
          <span>WHERE</span><b class="ew-mono">{{ where }}</b>
        </div>
      </div>
      <div v-if="result" class="ew-result">
        <p class="ew-result-line">已导出 <b>{{ result.rowCount.toLocaleString() }}</b> 行</p>
        <p v-if="result.truncated" class="ew-result-hint">
          达到行数上限 {{ limit.toLocaleString() }}，已截断（可用「全量」并放宽上限重试）
        </p>
        <ReButton size="small" icon="Check" @click="visible = false">完成</ReButton>
      </div>
    </section>

    <template #footer>
      <div class="ew-footer">
        <ReButton :disabled="exporting" @click="cancel">关闭</ReButton>
        <span class="ew-spacer" />
        <ReButton :disabled="step === 0 || exporting" @click="prev">上一步</ReButton>
        <ReButton
          v-if="step < STEPS.length - 1"
          type="primary"
          :disabled="!canGoNext"
          @click="next"
        >下一步</ReButton>
        <ReButton
          v-else
          type="primary"
          :loading="exporting"
          :disabled="exporting || !!result"
          @click="startExport"
        >{{ result ? "已完成" : "开始" }}</ReButton>
      </div>
    </template>
  </ReDialog>
</template>

<script setup lang="ts">
/**
 * 导出向导（对齐 Navicat 的导入向导形态，4 步流程）。
 *
 * <p>步骤：导出范围 → 文件格式 → 列与排序 → 执行下载。</p>
 *
 * <p><b>为什么第 1 步先选范围</b>：「全量数据」与「当前查询结果」是两种不同语义 ——
 * 全量不带任何条件（但受行数上限护栏），当前查询结果带上当前 WHERE / 高级筛选 / 排序。
 * 范围在前避免「已经填好格式才发现范围不对」的返工。</p>
 *
 * <p><b>为什么分步而非单页</b>：导出与导入是同一条 Navicat 心智 —— 用户对「先选范围 /
 * 再选格式 / 再确认条件 / 最后执行」的四段式有预期；单页对话框把 6 个控件堆一起，
 * 长参数表的可读性差，且无法在最后一步做「执行前的总览确认」。</p>
 *
 * <p><b>为什么不再受「当前页」限制</b>：执行走后端 {@code /db/export}（同导入向导的后端
 * 管线），导出的是一整张表或当前查询结果，不是前端拼 CSV 时「只有当前页 1000 行」的残缺导出。
 * 行数上限是护栏不是分页：上限内全量导出，超上限截断并明确提示。</p>
 */
import { computed, ref, watch } from "vue";
import { Download } from "@element-plus/icons-vue";
import ReButton from "@repo/ui/re-button";
import ReDialog from "@repo/ui/re-dialog";
import ReIcon from "@repo/ui/re-icon";
import ReInput from "@repo/ui/re-input";
import ReInputNumber from "@repo/ui/re-input-number";
import ReSelect from "@repo/ui/re-select";
import { ReOption } from "@repo/ui/re-kit";
import { exportDbTable, type DbExportResult } from "../../api/dbManageApi";
import { fetchTableColumns, type DbFilterCondition } from "../../api/manageConsoles";
import { dbFilterTakesNoValue, dbFilterTakesMultipleValues } from "../../api/manageConsoles";

defineOptions({ name: "DbExportWizard" });

interface DbExportWizardProps {
  /** 是否显示（v-model） */
  modelValue: boolean;
  /** 当前数据源 ID */
  datasourceId?: number;
  /** 导出目标表所属库 */
  database?: string;
  /** 导出目标表 */
  tableName?: string;
  /**
   * 当前查询上下文（「当前查询结果」范围使用）。
   *
   * <p>由父视图在打开向导时快照传入 —— 不直接引用父视图的响应式状态，
   * 否则导出期间用户改了筛选，向导里已经展开的「范围/条件」会对不上。</p>
   */
  current?: {
    /** 自由文本 WHERE（已应用） */
    where?: string;
    /** 高级筛选条件（已应用） */
    filters: DbFilterCondition[];
    /** 当前排序列 */
    orderBy?: string;
    /** 当前排序方向 */
    orderDir?: "ASC" | "DESC";
  };
}

const props = defineProps<DbExportWizardProps>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
}>();

/** 步骤定义（4 步） */
const STEPS = [
  { title: "导出范围", description: "全量或当前查询结果" },
  { title: "文件格式", description: "格式与内容" },
  { title: "列与排序", description: "条件与排序" },
  { title: "执行", description: "开始导出并下载" },
];

/** 范围候选（第 1 步：全量 / 当前查询结果） */
const SCOPES = [
  {
    value: "full" as const,
    label: "全量数据",
    hint: "整张表的数据，不带当前筛选 / 排序（受行数上限护栏）",
  },
  {
    value: "current" as const,
    label: "当前查询结果",
    hint: "带上当前 WHERE / 高级筛选 / 排序，导出的正是当前网格看到的数据",
  },
];

const visible = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit("update:modelValue", v),
});

/** 当前步骤下标 */
const step = ref(0);
/** 导出范围（full / current） */
const scope = ref<"full" | "current">("full");
/** 文件格式 */
const format = ref<"csv" | "tsv" | "json" | "xml" | "sql">("csv");
/** 导出内容（仅数据 / 仅结构 / 结构+数据） */
const contentScope = ref<"data" | "structure" | "all">("data");
/** 行数上限（后端 200000 护栏内） */
const limit = ref(10000);
/** WHERE 过滤（全量=用户填的；当前结果=预填当前条件） */
const where = ref("");
/** 排序列 */
const orderBy = ref("");
/** 排序方向 */
const orderDir = ref<"ASC" | "DESC">("ASC");
/** 排序列候选 */
const orderColumns = ref<string[]>([]);
/** 导出中（第 4 步按钮 loading） */
const exporting = ref(false);
/** 执行完成后的结果（成功后停在第 4 步展示摘要） */
const result = ref<DbExportResult | null>(null);

const subtitle = computed(() =>
  props.database && props.tableName ? `${props.database}.${props.tableName}` : "导出表数据 / 结构",
);

/** 目标表全名（摘要区展示） */
const tableLabel = computed(() =>
  props.database && props.tableName ? `${props.database}.${props.tableName}` : props.tableName || "—",
);

/** 第 1 步「当前查询结果」的条件摘要（人类可读） */
const currentText = computed(() => {
  const parts: string[] = [];
  const w = props.current?.where?.trim();
  if (w) parts.push(`WHERE ${w}`);
  const f = props.current?.filters ?? [];
  if (f.length) parts.push(`${f.length} 个高级筛选条件`);
  const ob = props.current?.orderBy;
  if (ob) parts.push(`按 ${ob} ${props.current?.orderDir === "DESC" ? "降序" : "升序"}`);
  return parts.join("；");
});

/** 第 2 步摘要 */
const formatLabel = computed(() => {
  const map: Record<string, string> = {
    csv: "CSV",
    tsv: "TSV",
    json: "JSON 数组",
    xml: "XML",
    sql: "SQL 脚本",
  };
  return map[format.value] ?? format.value;
});
const contentScopeLabel = computed(() => {
  const map: Record<string, string> = { data: "仅数据", structure: "仅结构", all: "结构 + 数据" };
  return map[contentScope.value] ?? contentScope.value;
});

/** 每步是否可以继续 */
const canGoNext = computed(() => {
  if (step.value === 0) return true;
  if (step.value === 1) {
    // 结构导出仅 SQL 格式可回灌：非 SQL 格式给警示但不拦（保留可读输出）
    return true;
  }
  return true;
});

/** 已完成的步骤的摘要（步骤条上的小字） */
function summaryOf(index: number): string {
  switch (index) {
    case 0: return scope.value === "full" ? "全量数据" : "当前查询结果";
    case 1: return formatLabel.value + " · " + contentScopeLabel.value;
    case 2: return contentScope.value === "structure" ? "仅结构" : `上限 ${limit.value.toLocaleString()} 行`;
    default: return "";
  }
}

/** 打开向导时重置状态（避免上次的格式 / 条件残留） */
watch(visible, open => {
  if (!open) return;
  step.value = 0;
  scope.value = "full";
  format.value = "csv";
  contentScope.value = "data";
  limit.value = 10000;
  where.value = "";
  orderBy.value = "";
  orderDir.value = "ASC";
  orderColumns.value = [];
  exporting.value = false;
  result.value = null;
  void loadOrderColumns();
});

/** 进入某步的准备工作（第 3 步需要排序列候选） */
function next(): void {
  if (!canGoNext.value) return;
  if (step.value === 1) {
    // 离开「文件格式」前把当前查询结果的 WHERE / 排序预填进第 3 步
    if (scope.value === "current") {
      prefillFromCurrent();
    }
  }
  step.value += 1;
}

function prev(): void {
  if (step.value > 0) {
    step.value -= 1;
    if (result.value) result.value = null;
  }
}

function cancel(): void {
  if (exporting.value) return;
  visible.value = false;
}

/** 把当前查询上下文预填为第 3 步的 WHERE / 排序初始值 */
function prefillFromCurrent(): void {
  const parts: string[] = [];
  const w = props.current?.where?.trim();
  if (w) parts.push(w);
  const filters = props.current?.filters ?? [];
  if (filters.length) {
    const sql = filtersToWhere(filters);
    if (sql) parts.push(sql);
  }
  where.value = parts.join(" AND ");
  orderBy.value = props.current?.orderBy ?? "";
  orderDir.value = props.current?.orderDir ?? "ASC";
}

/**
 * 高级筛选条件 → SQL WHERE 段（列名加反引号 + 值字面量转义）。
 *
 * <p>与后端 {@code DbFilter} 同口径的运算符映射：支持 = / <> / 比较 / LIKE /
 * IS [NOT] NULL / IN / BETWEEN。值统一走字面量转义，避免拼接注入。</p>
 */
function filtersToWhere(filters: DbFilterCondition[]): string {
  return filters
    .filter(f => f.column.trim() && f.op.trim())
    .map(f => {
      const col = `\`${f.column}\``;
      const op = f.op;
      if (dbFilterTakesNoValue(op)) {
        return `${col} ${op}`;
      }
      if (op === "BETWEEN") {
        return `${col} BETWEEN ${literal(f.value ?? "")} AND ${literal(f.value2 ?? "")}`;
      }
      if (dbFilterTakesMultipleValues(op)) {
        const items = (f.value ?? "").split(",").map(v => v.trim()).filter(Boolean);
        const list = items.length ? items.map(literal).join(", ") : "''";
        return `${col} ${op} (${list})`;
      }
      return `${col} ${op} ${literal(f.value ?? "")}`;
    })
    .join(" AND ");
}

/** SQL 字面量（NULL / 数字 / 布尔原样，字符串单引号转义） */
function literal(v: unknown): string {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return `'${String(v).replace(/'/g, "''")}'`;
}

/** 拉取导出表的列，供第 3 步排序列下拉使用 */
async function loadOrderColumns(): Promise<void> {
  const table = props.tableName;
  const db = props.database;
  if (!table || !db) {
    orderColumns.value = [];
    return;
  }
  try {
    const cols = await fetchTableColumns(table, props.datasourceId, db);
    // 请求回来时用户可能已关闭向导/换表，丢弃过期结果
    if (props.tableName === table && props.database === db) {
      orderColumns.value = (cols || []).map(c => c.name);
    }
  } catch {
    // 拿不到列不影响导出本身，排序列留空即可
    orderColumns.value = [];
  }
}

/** 执行导出并下载 */
async function startExport(): Promise<void> {
  if (!props.tableName) return;
  exporting.value = true;
  try {
    const res = await exportDbTable({
      tableName: props.tableName,
      format: format.value,
      scope: contentScope.value,
      database: props.database,
      datasourceId: props.datasourceId,
      limit: contentScope.value === "structure" ? undefined : limit.value,
      where: contentScope.value === "structure" ? undefined : where.value || undefined,
      orderBy: contentScope.value === "structure" ? undefined : orderBy.value || undefined,
      orderDir: contentScope.value === "structure" ? undefined : orderDir.value,
    });
    if (!res.content) {
      result.value = { ...res, rowCount: 0, truncated: false };
      return;
    }
    // CSV 带 BOM，Excel 打开中文才不乱码
    const needsBom = res.format.includes("csv");
    const blob = new Blob([needsBom ? "\ufeff" : "", res.content], { type: `${mimeOf(format.value)};charset=utf-8;` });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = res.fileName || `${props.tableName}.${format.value}`;
    link.click();
    URL.revokeObjectURL(link.href);
    result.value = res;
  } finally {
    exporting.value = false;
  }
}

/** 导出格式 → MIME */
function mimeOf(fmt: string): string {
  const map: Record<string, string> = {
    csv: "text/csv",
    tsv: "text/tab-separated-values",
    json: "application/json",
    xml: "application/xml",
    sql: "application/sql",
  };
  return map[fmt] ?? "text/plain";
}
</script>

<style scoped>
/* 步骤条：与导入向导（.iw-steps）同一套视觉 —— 圆形序号 + 连接线 + 标题/摘要 */
.ew-steps {
  display: flex;
  align-items: flex-start;
  padding: 4px 4px 16px;
}
.ew-step {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  gap: 6px;
}
.ew-step-line {
  position: absolute;
  top: 14px;
  left: calc(50% + 19px);
  right: calc(-50% + 19px);
  height: 2px;
  border-radius: 1px;
  background: var(--el-border-color-lighter);
}
.ew-step.is-done .ew-step-line { background: var(--el-color-primary); }
.ew-step-dot {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 2px solid var(--el-border-color);
  border-radius: 50%;
  background: var(--bg-container);
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 600;
  z-index: 1;
}
.ew-step.is-on .ew-step-dot {
  border-color: var(--el-color-primary);
  color: var(--el-color-primary);
}
.ew-step.is-done .ew-step-dot {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary);
  color: var(--el-color-white);
}
.ew-step-labels {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  text-align: center;
  min-width: 0;
}
.ew-step-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  white-space: nowrap;
}
.ew-step.is-on .ew-step-title { color: var(--el-color-primary); }
.ew-step-desc {
  font-size: 11px;
  color: var(--text-placeholder);
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ew-step-desc.is-summary { color: var(--text-secondary); }

/* ---------- 主体 ---------- */
.ew-pane {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 220px;
  padding: 8px 2px;
}
.ew-lead {
  margin: 0;
  font-size: 13px;
  color: var(--text-primary);
  line-height: 1.5;
}
.ew-hint {
  margin: 0;
  font-size: 12px;
  color: var(--text-placeholder);
  line-height: 1.5;
}
.ew-note {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  border-radius: 6px;
  padding: 8px 10px;
}
.ew-note.is-warn {
  color: var(--el-color-warning);
  background: var(--el-color-warning-light-9, rgba(230, 162, 60, 0.1));
}

/* 第 1 步：范围单选卡 */
.ew-scopes {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.ew-scope {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 12px 14px;
  border: 1px solid var(--el-border-color);
  border-radius: var(--radius, 8px);
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}
.ew-scope input[type="radio"] { margin-top: 3px; }
.ew-scope.is-on {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9, rgba(64, 158, 255, 0.08));
}
.ew-scope-body {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.ew-scope-name { font-size: 13px; font-weight: 600; color: var(--text-primary); }
.ew-scope-hint { font-size: 12px; color: var(--text-placeholder); line-height: 1.45; }

.ew-current-summary {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--text-secondary);
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
  padding: 8px 10px;
}
.ew-current-text { color: var(--text-primary); }

/* 字段网格（第 2 步） */
.ew-field-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px 16px;
}
.ew-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.ew-field-label { font-size: 12px; color: var(--text-secondary); }

/* 纵向字段组（第 3 步）：标签在上、控件在下 */
.ew-pane .ew-field { font-size: 12px; }
.ew-limit { width: 180px; }
.ew-full { width: 100%; }
.ew-inline {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
}
.ew-order-by { width: 190px; }
.ew-order-dir { width: 100px; }
.ew-mono {
  font-family: var(--font-mono, ui-monospace, SFMono-Regular, Consolas, monospace);
}

/* 第 4 步：执行摘要 */
.ew-summary-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  padding: 12px 14px;
  font-size: 13px;
}
.ew-summary-item {
  display: flex;
  gap: 10px;
  align-items: center;
}
.ew-summary-item > span {
  flex-shrink: 0;
  width: 72px;
  color: var(--text-secondary);
}
.ew-summary-item > b { font-weight: 600; color: var(--text-primary); }

.ew-result {
  display: flex;
  flex-direction: column;
  gap: 8px;
  border: 1px solid var(--el-color-success);
  border-radius: 8px;
  padding: 12px 14px;
  background: var(--el-color-success-light-9, rgba(103, 194, 58, 0.08));
}
.ew-result-line { margin: 0; font-size: 13px; color: var(--text-primary); }
.ew-result-hint { margin: 0; font-size: 12px; color: var(--text-placeholder); }

/* 底部 */
.ew-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}
.ew-spacer { flex: 1; }
</style>