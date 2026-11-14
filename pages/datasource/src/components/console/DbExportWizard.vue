<template>
  <ReDialog
    v-model="visible"
    title="导出向导"
    :subtitle="subtitle"
    :icon="Download"
    width="760px"
    :close-on-click-modal="false"
    :close-on-press-escape="!exporting"
  >
    <WizardSteps :steps="stepItems" :current="step" direction="horizontal" />

    <div class="ew-body">
      <!-- ========== 第 1 步：格式与范围 ========== -->
      <section v-if="step === 0" class="wz-pane">
        <WizardStepHead title="格式与范围" desc="先定文件长什么样：格式决定能不能回灌，范围决定导出数据、建表语句，还是两者都要。">
          <template #meta>步骤 1 / 3</template>
        </WizardStepHead>

        <div class="ew-formats">
          <div
            v-for="f in FORMATS"
            :key="f.value"
            class="ew-format"
            :class="{ 'is-on': format === f.value }"
            @click="format = f.value"
          >
            <el-radio :model-value="format" :value="f.value">{{ f.label }}</el-radio>
            <span class="ew-format-hint">{{ f.hint }}</span>
          </div>
        </div>

        <el-form-item label="导出内容" label-width="76px">
          <ReSelect v-model="contentScope" style="width: 240px">
            <ReOption label="仅数据（数据行）" value="data" />
            <ReOption label="仅结构（建表语句）" value="structure" />
            <ReOption label="结构 + 数据" value="all" />
          </ReSelect>
        </el-form-item>

        <p v-if="format !== 'sql' && contentScope === 'structure'" class="wz-note is-warn">
          结构只有建表语句，请选 SQL 格式；其它格式对结构导出只输出列清单，可读但不能回灌。
        </p>
        <p class="wz-hint">导出走后端 /db/export，导的是整张表或过滤结果，不受网格当前页限制。</p>
      </section>

      <!-- ========== 第 2 步：过滤与排序 ========== -->
      <section v-else-if="step === 1" class="wz-pane">
        <WizardStepHead
          title="过滤与排序"
          desc="这一步可留空：不填 WHERE、不排序、用默认上限，就是把整张表导出去。"
        >
          <template #meta>步骤 2 / 3</template>
        </WizardStepHead>

        <p v-if="contentScope === 'structure'" class="wz-note is-info">
          仅结构导出不涉及数据行，这一步的过滤与排序不生效，可以直接下一步。
        </p>

        <template v-else>
          <el-form-item label="WHERE" label-width="76px">
            <ReInput v-model="where" clearable placeholder="留空导出全部；例：status = 1" />
          </el-form-item>
          <el-form-item label="行数上限" label-width="76px">
            <ReInputNumber v-model="limit" :min="1" :max="200000" controls-position="right" style="width: 150px" />
            <span class="wz-hint wz-hint--inline">后端硬上限 200000，超上限截断并提示</span>
          </el-form-item>
          <el-form-item label="排序" label-width="76px">
            <ReSelect v-model="orderBy" filterable clearable placeholder="不排序（按库内顺序）" style="width: 200px">
              <ReOption v-for="c in orderColumns" :key="c" :label="c" :value="c" />
            </ReSelect>
            <ReSelect v-model="orderDir" style="width: 104px">
              <ReOption label="升序" value="ASC" />
              <ReOption label="降序" value="DESC" />
            </ReSelect>
          </el-form-item>
          <p class="wz-hint">WHERE 里的字符串要用单引号，例：<code>status = 'PAID' AND amount &gt; 100</code>。</p>
        </template>
      </section>

      <!-- ========== 第 3 步：下载 ========== -->
      <section v-else class="wz-pane">
        <WizardStepHead title="下载" desc="核对这次导出的参数，点「导出并下载」生成文件。">
          <template #meta>步骤 3 / 3</template>
        </WizardStepHead>

        <div class="ew-summary">
          <div><span class="ew-k">目标表</span><span class="ew-v ew-mono">{{ tableLabel }}</span></div>
          <div><span class="ew-k">格式</span><span class="ew-v">{{ formatLabel }}</span></div>
          <div><span class="ew-k">内容</span><span class="ew-v">{{ contentScopeLabel }}</span></div>
          <div v-if="contentScope !== 'structure'">
            <span class="ew-k">上限</span><span class="ew-v">{{ limit.toLocaleString() }} 行</span>
          </div>
          <div v-if="contentScope !== 'structure' && where">
            <span class="ew-k">WHERE</span><span class="ew-v ew-mono">{{ where }}</span>
          </div>
          <div v-if="contentScope !== 'structure' && orderBy">
            <span class="ew-k">排序</span>
            <span class="ew-v">{{ orderBy }} {{ orderDir === 'DESC' ? '降序' : '升序' }}</span>
          </div>
        </div>

        <div v-if="result" class="ew-result">
          <div class="ew-result-line">
            已导出 <b>{{ result.rowCount.toLocaleString() }}</b> 行
            <el-tag size="small" effect="plain" type="success">{{ result.fileName || fileNameFallback }}</el-tag>
          </div>
          <p v-if="result.truncated" class="wz-note is-warn">
            达到上限 {{ limit.toLocaleString() }} 行，已截断；放宽上限或加 WHERE 再导一次。
          </p>
        </div>
        <p v-else class="wz-hint">点底部的「导出并下载」，文件会直接落到浏览器的下载目录。</p>
      </section>
    </div>

    <template #footer>
      <div class="ew-footer">
        <ReButton :disabled="exporting" @click="close">{{ result ? "关闭" : "取消" }}</ReButton>
        <span class="ew-spacer" />
        <ReButton :disabled="step === 0 || exporting" @click="prev">上一步</ReButton>
        <ReButton v-if="step < 2" type="primary" @click="step += 1">下一步</ReButton>
        <ReButton
          v-else
          type="primary"
          :loading="exporting"
          :disabled="exporting || !!result"
          @click="startExport"
        >
          {{ result ? "已完成" : "导出并下载" }}
        </ReButton>
      </div>
    </template>
  </ReDialog>
</template>

<script setup lang="ts">
/**
 * 导出向导（三步：格式与范围 → 过滤与排序 → 下载）。
 *
 * <p><b>为什么先定格式再定条件</b>：格式与内容范围决定了「这一步之后还有没有条件可填」——
 * 仅结构导出根本不涉及数据行，先问 WHERE 只会让用户填一堆不生效的东西。</p>
 *
 * <p><b>为什么走 {@code /db/export}</b>：导出的是一整张表或过滤结果，不是前端把当前页
 * 拼成 CSV；早期实现右键导出的其实只有第一页 1000 行。行数上限是护栏不是分页：
 * 上限内全量导出，超上限截断并明确提示。</p>
 *
 * <p><b>为什么壳和导入向导长得一样</b>：同一个模块里的两个向导，步骤条、标题、
 * 底部操作条必须是同一套；这里复用 {@code wizard/WizardSteps} 与 {@code WizardStepHead}。</p>
 */
import { computed, ref, watch } from "vue";
import { Download } from "@element-plus/icons-vue";
import { message } from "@repo/core";
import ReButton from "@repo/ui/re-button";
import ReDialog from "@repo/ui/re-dialog";
import ReInput from "@repo/ui/re-input";
import ReInputNumber from "@repo/ui/re-input-number";
import ReSelect from "@repo/ui/re-select";
import { ReOption } from "@repo/ui/re-kit";
import WizardSteps from "./wizard/WizardSteps.vue";
import WizardStepHead from "./wizard/WizardStepHead.vue";
import { exportDbTable, type DbExportResult } from "../../api/dbManageApi";
import { fetchTableColumns } from "../../api/manageConsoles";

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
}

const props = defineProps<DbExportWizardProps>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
}>();

/** 导出格式 */
type ExportFormat = "csv" | "tsv" | "json" | "xml" | "sql";

/** 导出格式候选 */
const FORMATS: { value: ExportFormat; label: string; hint: string }[] = [
  { value: "csv", label: "CSV（逗号分隔，Excel 友好）", hint: "最通用；中文带 BOM，双击不乱码" },
  { value: "tsv", label: "TSV（制表符分隔）", hint: "字段里逗号多、制表符少时更安全" },
  { value: "json", label: "JSON 数组", hint: "每行一个对象，便于程序再加工" },
  { value: "xml", label: "XML", hint: "对接只认 XML 的老系统" },
  { value: "sql", label: "SQL 脚本（可回灌）", hint: "含建表语句与 INSERT，能整表搬库" },
];

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit("update:modelValue", value),
});

/** 当前步骤下标 */
const step = ref(0);
/** 文件格式 */
const format = ref<ExportFormat>("csv");
/** 导出内容范围 */
const contentScope = ref<"data" | "structure" | "all">("data");
/** 行数上限（后端 200000 护栏内） */
const limit = ref(10000);
/** WHERE 过滤 */
const where = ref("");
/** 排序列 */
const orderBy = ref("");
/** 排序方向 */
const orderDir = ref<"ASC" | "DESC">("ASC");
/** 排序列候选 */
const orderColumns = ref<string[]>([]);
/** 导出中 */
const exporting = ref(false);
/** 执行结果 */
const result = ref<DbExportResult | null>(null);

const subtitle = computed(() =>
  props.database && props.tableName ? `${props.database}.${props.tableName}` : "导出表数据 / 结构",
);

/** 目标表全名 */
const tableLabel = computed(() =>
  props.database && props.tableName ? `${props.database}.${props.tableName}` : props.tableName || "—",
);

const formatLabel = computed(() => FORMATS.find(f => f.value === format.value)?.label ?? format.value);

const contentScopeLabel = computed(
  () => ({ data: "仅数据", structure: "仅结构", all: "结构 + 数据" })[contentScope.value],
);

/** 兜底文件名 */
const fileNameFallback = computed(() => `${props.tableName || "export"}.${format.value}`);

/** 步骤轨 */
const stepItems = computed(() => [
  { title: "格式与范围", summary: `${format.value.toUpperCase()} · ${contentScopeLabel.value}` },
  { title: "过滤与排序", summary: contentScope.value === "structure" ? "不适用" : `上限 ${limit.value.toLocaleString()} 行` },
  { title: "下载", summary: result.value ? `已导出 ${result.value.rowCount} 行` : "" },
]);

/** 上一步 */
function prev(): void {
  if (step.value <= 0) return;
  step.value -= 1;
  // 回退说明要改参数重导：清掉结果，否则底部按钮停在「已完成」的禁用态
  if (result.value) result.value = null;
}

/** 关闭 */
function close(): void {
  if (exporting.value) return;
  visible.value = false;
}

/** 打开时重置并补拉排序列 */
watch(visible, open => {
  if (!open) return;
  step.value = 0;
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

/** 拉取导出表的列，供排序列下拉使用 */
async function loadOrderColumns(): Promise<void> {
  const table = props.tableName;
  const db = props.database;
  if (!table || !db) {
    orderColumns.value = [];
    return;
  }
  try {
    const cols = await fetchTableColumns(table, props.datasourceId, db);
    // 请求回来时用户可能已关闭向导 / 换表，丢弃过期结果
    if (props.tableName === table && props.database === db) {
      orderColumns.value = (cols || []).map(c => c.name);
    }
  } catch {
    // 拿不到列不影响导出本身，排序列留空即可
    orderColumns.value = [];
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

/** 执行导出并下载 */
async function startExport(): Promise<void> {
  if (!props.tableName || exporting.value) return;
  exporting.value = true;
  try {
    const structure = contentScope.value === "structure";
    const res = await exportDbTable({
      tableName: props.tableName,
      format: format.value,
      scope: contentScope.value,
      database: props.database,
      datasourceId: props.datasourceId,
      limit: structure ? undefined : limit.value,
      where: structure ? undefined : where.value || undefined,
      orderBy: structure ? undefined : orderBy.value || undefined,
      orderDir: structure ? undefined : orderDir.value,
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
    link.download = res.fileName || fileNameFallback.value;
    link.click();
    URL.revokeObjectURL(link.href);
    result.value = res;
  } catch (e) {
    message.error(`导出失败：${String((e as Error)?.message ?? e)}`);
  } finally {
    exporting.value = false;
  }
}
</script>

<style scoped>
.ew-body {
  min-height: 300px;
  max-height: 56vh;
  overflow-y: auto;
  padding: 16px 2px 6px;
}
.wz-pane {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.wz-pane :deep(.el-form-item) {
  margin-bottom: 12px;
}
.wz-hint {
  margin: 0;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-placeholder);
}
.wz-hint--inline {
  margin-left: 10px;
}
.wz-hint code {
  font-family: var(--el-font-family-mono, monospace);
  font-size: 11px;
  padding: 1px 4px;
  border-radius: var(--el-radius-xs);
  background: var(--el-fill-color-light);
  color: var(--el-text-color-regular);
}
.wz-note {
  margin: 0;
  padding: 8px 10px;
  border-radius: var(--el-radius-md);
  font-size: 12px;
  line-height: 1.6;
}
.wz-note.is-warn {
  background: var(--el-color-warning-light-9);
  color: var(--el-color-warning-dark-2);
}
.wz-note.is-info {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

/* 格式卡片 */
.ew-formats {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.ew-format {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 12px;
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-radius-md);
  background: var(--el-bg-color);
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;
}
.ew-format:hover {
  border-color: var(--el-color-primary-light-5);
}
.ew-format.is-on {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}
.ew-format :deep(.el-radio) {
  height: auto;
  margin-right: 0;
}
.ew-format :deep(.el-radio__label) {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.ew-format-hint {
  display: block;
  padding-left: 22px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}

/* 摘要 */
.ew-summary {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-md);
  overflow: hidden;
}
.ew-summary > div {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  min-width: 0;
}
.ew-summary > div:last-child {
  border-bottom: 0;
}
.ew-k {
  flex: none;
  width: 64px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.ew-v {
  font-size: 12px;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ew-mono {
  font-family: var(--el-font-family-mono, monospace);
}

.ew-result {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px;
  border: 1px solid var(--el-color-success);
  border-radius: var(--el-radius-md);
  background: var(--el-color-success-light-9);
}
.ew-result-line {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 12px;
  color: var(--el-text-color-primary);
}

.ew-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}
.ew-spacer {
  flex: 1;
}
</style>
