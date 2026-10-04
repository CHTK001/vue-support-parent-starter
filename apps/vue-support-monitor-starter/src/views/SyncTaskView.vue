<template>
  <div class="dsm tel-page">
    <div class="dsm-toolbar">
      <div class="dsm-toolbar-left">
        <ReIcon name="Refresh" :size="18" class="dsm-title-icon" />
        <span class="dsm-title">数据同步</span>
      </div>
      <div class="dsm-toolbar-right">
        <ReButton :loading="loading" @click="refresh">
          <template #icon><ReIcon name="Refresh" /></template>刷新
        </ReButton>
        <ReButton type="primary" @click="openCreate">
          <template #icon><ReIcon name="Plus" /></template>新建任务
        </ReButton>
      </div>
    </div>

    <div class="st-body">
      <el-table v-loading="loading" :data="tasks" border stripe empty-text="还没有同步任务，点右上角「新建任务」">
        <el-table-column label="任务" min-width="190">
          <template #default="{ row }">
            <div class="st-name">{{ row.syncTaskName }}</div>
            <div class="st-sub">{{ dsName(row.syncTaskSourceDatasourceId) }} → {{ dsName(row.syncTaskTargetDatasourceId) }}.{{ row.syncTaskTargetTable }}</div>
          </template>
        </el-table-column>
        <el-table-column label="源 SQL" min-width="220" show-overflow-tooltip>
          <template #default="{ row }"><span class="mono st-sql">{{ row.syncTaskSourceSql }}</span></template>
        </el-table-column>
        <el-table-column label="写入模式" width="112" align="center">
          <template #default="{ row }">{{ modeLabel(row.syncTaskWriteMode) }}</template>
        </el-table-column>
        <el-table-column label="定时" width="150">
          <template #default="{ row }">
            <span v-if="row.syncTaskCron" class="mono st-cron">{{ row.syncTaskCron }}</span>
            <span v-else class="st-sub">仅手动</span>
          </template>
        </el-table-column>
        <el-table-column label="启用" width="78" align="center">
          <template #default="{ row }">
            <el-switch :model-value="row.syncTaskEnabled === 1" @change="(value: string | number | boolean) => toggle(row, !!value)" />
          </template>
        </el-table-column>
        <el-table-column label="最近执行" min-width="230">
          <template #default="{ row }">
            <template v-if="row.syncTaskLastStatus">
              <div class="st-last">
                <el-tag :type="row.syncTaskLastStatus === 'SUCCESS' ? 'success' : 'danger'">
                  {{ row.syncTaskLastStatus === 'SUCCESS' ? '成功' : '失败' }}
                </el-tag>
                <span class="st-sub">{{ row.syncTaskLastRunTime }}</span>
              </div>
              <div class="st-sub">读 {{ row.syncTaskLastReadCount ?? 0 }} / 写 {{ row.syncTaskLastWriteCount ?? 0 }} · {{ row.syncTaskLastCostMs ?? 0 }}ms</div>
              <div v-if="row.syncTaskLastMessage" class="st-msg" :title="row.syncTaskLastMessage">{{ row.syncTaskLastMessage }}</div>
            </template>
            <span v-else class="st-sub">尚未执行</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right" align="right">
          <template #default="{ row }">
            <ReButton :loading="runningId === row.id" @click="run(row)">
              <template #icon><ReIcon name="VideoPlay" /></template>立即执行
            </ReButton>
            <ReButton @click="openEdit(row)">
              <template #icon><ReIcon name="EditPen" /></template>编辑
            </ReButton>
            <ReButton type="danger" @click="remove(row)">
              <template #icon><ReIcon name="Delete" /></template>删除
            </ReButton>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑同步任务' : '新建同步任务'" width="920px" :close-on-click-modal="false">
      <el-steps :active="step" align-center finish-status="success" class="st-steps">
        <el-step title="设置输入" description="源数据源与取数方式" />
        <el-step title="设置输出" description="目标数据源与写入表" />
        <el-step title="设置配置" description="调度与运行参数" />
      </el-steps>

      <div class="st-form">
        <!-- ① 设置输入：数据源中心选 jdbc 数据源，选表或写 SQL -->
        <template v-if="step === 0">
          <div class="st-form-item">
            <label>源数据源（jdbc）</label>
            <el-select v-model="form.sourceDatasourceId" placeholder="从数据源中心选择源数据源" class="st-full" @change="onSourceChange">
              <el-option v-for="ds in jdbcSources" :key="ds.id" :label="ds.name" :value="ds.id" />
            </el-select>
            <div v-if="!jdbcSources.length" class="st-form-hint">数据源中心还没有 jdbc 数据源，请先到「数据源中心」新增。</div>
          </div>

          <div class="st-form-item">
            <label>取数方式</label>
            <el-radio-group v-model="sourceMode" @change="onSourceModeChange">
              <el-radio-button value="table">选择数据表</el-radio-button>
              <el-radio-button value="sql">自定义 SQL</el-radio-button>
            </el-radio-group>
          </div>

          <div v-if="sourceMode === 'table'" class="st-form-item">
            <label>数据表</label>
            <el-select v-model="pickedSourceTable" placeholder="选择源库数据表" filterable clearable class="st-full" @change="applySourceTable">
              <el-option v-for="t in sourceTables" :key="t" :label="t" :value="t" />
            </el-select>
            <div class="st-form-hint">选中后自动生成 SELECT（见下方 SQL，只读）；需要微调请切到「自定义 SQL」。</div>
          </div>

          <div class="st-form-item">
            <label>源读取 SQL（必须以 SELECT 开头）</label>
            <el-input v-model="form.sourceSql" type="textarea" :rows="4" class="mono" :readonly="sourceMode === 'table'" placeholder="SELECT id, name FROM t_order" />
            <div class="st-form-hint">只读源库：写语句会被后端挡下。</div>
          </div>
        </template>

        <!-- ② 设置输出：数据源中心选 jdbc 数据源，选目标表 + 字段映射 -->
        <template v-else-if="step === 1">
          <div class="st-form-item">
            <label>目标数据源（jdbc）</label>
            <el-select v-model="form.targetDatasourceId" placeholder="从数据源中心选择目标数据源" class="st-full" @change="onTargetChange">
              <el-option v-for="ds in jdbcSources" :key="ds.id" :label="ds.name" :value="ds.id" />
            </el-select>
          </div>

          <div class="st-grid">
            <div class="st-form-item">
              <label>目标数据表</label>
              <el-select v-model="form.targetTable" placeholder="选择或输入目标表名" filterable allow-create default-first-option class="st-full">
                <el-option v-for="t in targetTables" :key="t" :label="t" :value="t" />
              </el-select>
              <div class="st-form-hint">表清单取自目标数据源；不在清单中的表名可直接输入。</div>
            </div>
            <div class="st-form-item">
              <label>写入模式</label>
              <el-select v-model="form.writeMode" class="st-full">
                <el-option v-for="m in writeModes" :key="m.code" :label="m.label + '（' + m.code + '）'" :value="m.code" />
              </el-select>
            </div>
          </div>

          <div class="st-map">
            <div class="st-map-head">
              <span>字段映射（源 → 目标）</span>
              <div class="st-inline">
                <ReButton @click="doPreview">
                  <template #icon><ReIcon name="View" /></template>预览 / 自动配对
                </ReButton>
                <ReButton @click="addMappingRow">
                  <template #icon><ReIcon name="Plus" /></template>加一行
                </ReButton>
              </div>
            </div>
            <div v-for="(warning, index) in previewWarnings" :key="index" class="st-warn">{{ warning }}</div>
            <div v-for="(item, index) in form.mapping" :key="index" class="st-map-row">
              <el-select v-model="item.source" placeholder="源列" filterable class="st-map-col">
                <el-option v-for="c in sourceColumnOptions" :key="c.name" :label="c.name" :value="c.name" />
              </el-select>
              <span class="st-arrow">→</span>
              <el-select v-model="item.target" placeholder="目标列" filterable class="st-map-col">
                <el-option v-for="c in targetColumnOptions" :key="c.name" :label="c.name" :value="c.name" />
              </el-select>
              <ReButton type="danger" @click="form.mapping.splice(index, 1)">
                <template #icon><ReIcon name="Delete" /></template>
              </ReButton>
            </div>
            <div v-if="!form.mapping.length" class="st-form-hint">
              留空则按「同名（忽略大小写）」自动配对；建议先点「预览 / 自动配对」确认配对结果。
            </div>
          </div>
        </template>

        <!-- ③ 设置配置：任务名 / 批量 / 定时（ReCron） -->
        <template v-else>
          <div class="st-form-item">
            <label>任务名称</label>
            <el-input v-model="form.name" placeholder="例如：订单表 → 报表库" />
          </div>

          <div class="st-form-item">
            <label>定时表达式（Spring 6 段 cron，留空只手动执行）</label>
            <ReCron
              v-model="form.cron"
              :preview-count="5"
              placeholder="6 段表达式，例如 0 0/30 * * * ?"
              @change="onCronChange"
            />
            <div v-if="cronError" class="st-warn">{{ cronError }}</div>
          </div>

          <div class="st-grid">
            <div class="st-form-item">
              <label>批量提交条数</label>
              <el-input-number v-model="form.batchSize" :min="1" :max="100000" :step="100" controls-position="right" class="st-full" />
            </div>
            <div class="st-form-item st-switch-item">
              <label>启用定时</label>
              <el-switch v-model="form.enabled" :disabled="!form.cron.trim()" />
              <span class="st-form-hint">未填定时表达式时不能启用</span>
            </div>
          </div>
        </template>
      </div>

      <template #footer>
        <ReButton v-if="step > 0" @click="prevStep">上一步</ReButton>
        <ReButton @click="dialogVisible = false">取消</ReButton>
        <ReButton v-if="step < 2" type="primary" @click="nextStep">下一步</ReButton>
        <ReButton v-else type="primary" :loading="saving" @click="submit">保存</ReButton>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
/**
 * 数据同步页
 *
 * <p>任务是「源 jdbc 数据源按 SQL 读 → 字段映射 → 目标 jdbc 数据源的某张表」，执行由后端
 * 复用 datasync 引擎完成（源读取 / 字段映射转换 / Sink 契约）。</p>
 *
 * <p>执行结果**不弹通用错误提示**：后端把「读了几行、写了几行、失败原因」放在返回体里，
 * 这里按 status 分色展示，失败时把原因原文贴出来，避免只剩一句「同步失败」。</p>
 *
 * @author CH
 * @since 4.0.0.43
 */
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { fetchDataSources, fetchDatasourceTables, type DataSourceInfo } from "@pages/datasource";
import ReCron from "@repo/ui/re-cron";
import {
  createSyncTask,
  deleteSyncTask,
  enableSyncTask,
  disableSyncTask,
  fetchSyncTasks,
  fetchSyncWriteModes,
  previewSyncMapping,
  runSyncTask,
  updateSyncTask,
  type SyncColumn,
  type SyncFieldMapping,
  type SyncTask,
  type SyncTaskPayload,
  type SyncTaskRunResult,
  type SyncWriteMode,
} from "../syncTaskApi";

defineOptions({ name: "SyncTaskView" });

/** 任务列表 */
const tasks = ref<SyncTask[]>([]);
/** 列表加载中 */
const loading = ref(false);
/** 正在执行的任务 ID */
const runningId = ref<number | null>(null);
/** 数据源台账（仅取 jdbc） */
const datasources = ref<DataSourceInfo[]>([]);
/** 写入模式字典 */
const writeModes = ref<SyncWriteMode[]>([]);
/** 源库可选表 */
const sourceTables = ref<string[]>([]);
/** 目标库可选表 */
const targetTables = ref<string[]>([]);
/** 源库选表用的临时值 */
const pickedSourceTable = ref<string | null>(null);
/** 弹窗可见 */
const dialogVisible = ref(false);
/** 保存中 */
const saving = ref(false);
/** 正在编辑的任务 ID，空表示新建 */
const editingId = ref<number | null>(null);
/** 预览得到的源列 */
const previewSourceColumns = ref<SyncColumn[]>([]);
/** 预览得到的目标列 */
const previewTargetColumns = ref<SyncColumn[]>([]);
/** 预览提示 */
const previewWarnings = ref<string[]>([]);
/** 当前向导步骤：0 设置输入 / 1 设置输出 / 2 设置配置 */
const step = ref(0);
/** 输入取数方式：table 选数据表（自动生成 SELECT）/ sql 自定义 SQL */
const sourceMode = ref<"table" | "sql">("table");
/** cron 非法提示（留空视为「只手动执行」，不算错） */
const cronError = ref("");

/** 表单 */
const form = reactive({
  name: "",
  sourceDatasourceId: null as number | null,
  sourceSql: "",
  targetDatasourceId: null as number | null,
  targetTable: "",
  writeMode: "INSERT",
  batchSize: 500,
  cron: "",
  enabled: false,
  mapping: [] as SyncFieldMapping[],
});

/** 仅 jdbc 类型数据源 */
const jdbcSources = computed(() => datasources.value.filter(ds => (ds.type || "").toLowerCase() === "jdbc"));

/** 源列下拉项（优先用预览结果，未预览时给一个占位以支持手填） */
const sourceColumnOptions = computed<SyncColumn[]>(() => previewSourceColumns.value);

/** 目标列下拉项 */
const targetColumnOptions = computed<SyncColumn[]>(() => previewTargetColumns.value);

/**
 * 数据源名称
 * @param id 数据源 ID
 */
const dsName = (id?: number | null): string => {
  const hit = datasources.value.find(ds => ds.id === id);
  return hit ? hit.name : id == null ? "-" : `#${id}`;
};

/**
 * 写入模式中文
 * @param code 模式编码
 */
const modeLabel = (code?: string | null): string => {
  const hit = writeModes.value.find(m => m.code === code);
  return hit ? hit.label : code || "-";
};

/** 拉数据源台账 */
const loadDatasources = async () => {
  try {
    datasources.value = await fetchDataSources();
  } catch (e) {
    ElMessage.error("加载数据源失败：" + (e as Error)?.message);
  }
};

/** 拉任务列表 */
const refresh = async () => {
  loading.value = true;
  try {
    tasks.value = await fetchSyncTasks();
  } catch (e) {
    ElMessage.error("加载同步任务失败：" + (e as Error)?.message);
  } finally {
    loading.value = false;
  }
};

/**
 * 加载某数据源的表清单
 *
 * <p>走数据源中心（{@code @pages/datasource}）而非直接调监控后端的 /db 接口：
 * 中心侧会按数据源登记的库名挑选实际库，避免「登记库不是目标库」时列出空清单。</p>
 *
 * @param id 数据源 ID
 * @param target 是否为目标侧
 */
const loadTables = async (id: number | null, target: boolean) => {
  if (id == null) {
    return;
  }
  try {
    const list = await fetchDatasourceTables(id);
    if (target) {
      targetTables.value = list;
    } else {
      sourceTables.value = list;
    }
  } catch {
    // 表清单只是辅助，取不到不影响手填 SQL / 表名
    if (target) {
      targetTables.value = [];
    } else {
      sourceTables.value = [];
    }
  }
};

/** 源数据源变更 */
const onSourceChange = async () => {
  pickedSourceTable.value = null;
  previewSourceColumns.value = [];
  await loadTables(form.sourceDatasourceId, false);
};

/** 目标数据源变更 */
const onTargetChange = async () => {
  previewTargetColumns.value = [];
  await loadTables(form.targetDatasourceId, true);
};

/** 由所选表生成源 SQL */
const applySourceTable = () => {
  if (pickedSourceTable.value) {
    form.sourceSql = `SELECT * FROM \`${pickedSourceTable.value}\``;
  }
};

/** 切换取数方式：回到「选择数据表」时按所选表重建 SQL */
const onSourceModeChange = () => {
  if (sourceMode.value === "table") {
    applySourceTable();
  }
};

/**
 * ReCron 变更：只在明确判定非法（第二参 false）且表达式非空时提示
 * @param expression 当前表达式
 * @param valid      组件给出的合法性
 */
const onCronChange = (expression: string, valid: boolean) => {
  cronError.value = expression.trim() && !valid ? "cron 表达式不合法，请检查后再保存" : "";
};

/**
 * 校验某一步能否进入下一步
 * @param index 步骤下标
 */
const validateStep = (index: number): boolean => {
  if (index === 0) {
    if (form.sourceDatasourceId == null) {
      ElMessage.warning("请先选择源数据源");
      return false;
    }
    if (!form.sourceSql.trim()) {
      ElMessage.warning("请选择数据表或填写源读取 SQL");
      return false;
    }
    if (!/^\s*select/i.test(form.sourceSql)) {
      ElMessage.warning("源读取 SQL 必须以 SELECT 开头");
      return false;
    }
    return true;
  }
  if (index === 1) {
    if (form.targetDatasourceId == null) {
      ElMessage.warning("请先选择目标数据源");
      return false;
    }
    if (!form.targetTable.trim()) {
      ElMessage.warning("请选择或输入目标数据表");
      return false;
    }
    return true;
  }
  return true;
};

/** 下一步 */
const nextStep = () => {
  if (!validateStep(step.value)) {
    return;
  }
  step.value = Math.min(2, step.value + 1);
};

/** 上一步 */
const prevStep = () => {
  step.value = Math.max(0, step.value - 1);
};

/** 打开新建弹窗 */
const openCreate = () => {
  editingId.value = null;
  form.name = "";
  // DataSourceInfo.id 在类型上是可选值，赋给 number|null 的表单字段前先归一成 null
  const defaultSource = jdbcSources.value[0];
  const defaultTarget = jdbcSources.value[1] ?? jdbcSources.value[0];
  form.sourceDatasourceId = defaultSource ? (defaultSource.id ?? null) : null;
  form.sourceSql = "";
  form.targetDatasourceId = defaultTarget ? (defaultTarget.id ?? null) : null;
  form.targetTable = "";
  form.writeMode = "INSERT";
  form.batchSize = 500;
  form.cron = "";
  form.enabled = false;
  form.mapping = [];
  previewSourceColumns.value = [];
  previewTargetColumns.value = [];
  previewWarnings.value = [];
  pickedSourceTable.value = null;
  sourceTables.value = [];
  targetTables.value = [];
  step.value = 0;
  sourceMode.value = "table";
  cronError.value = "";
  dialogVisible.value = true;
  void loadTables(form.sourceDatasourceId, false);
  void loadTables(form.targetDatasourceId, true);
};

/**
 * 打开编辑弹窗
 * @param row 任务
 */
const openEdit = (row: SyncTask) => {
  editingId.value = row.id;
  form.name = row.syncTaskName;
  form.sourceDatasourceId = row.syncTaskSourceDatasourceId;
  form.sourceSql = row.syncTaskSourceSql;
  form.targetDatasourceId = row.syncTaskTargetDatasourceId;
  form.targetTable = row.syncTaskTargetTable;
  form.writeMode = row.syncTaskWriteMode || "INSERT";
  form.batchSize = row.syncTaskBatchSize || 500;
  form.cron = row.syncTaskCron || "";
  form.enabled = row.syncTaskEnabled === 1;
  form.mapping = parseMapping(row.syncTaskColumnMapping);
  previewSourceColumns.value = [];
  previewTargetColumns.value = [];
  previewWarnings.value = [];
  pickedSourceTable.value = null;
  sourceTables.value = [];
  targetTables.value = [];
  cronError.value = "";
  step.value = 0;
  // 存量 SQL 若正是「选表生成」的形状，则回到选表模式并回填表名；否则进 SQL 模式（可编辑），
  // 否则 readonly 的 SQL 框会让存量自定义 SQL 无法修改。
  const tableHit = /^\s*select\s+\*\s+from\s+`([^`]+)`\s*;?\s*$/i.exec(row.syncTaskSourceSql || "");
  sourceMode.value = tableHit ? "table" : "sql";
  pickedSourceTable.value = tableHit ? tableHit[1] : null;
  dialogVisible.value = true;
  void loadTables(form.sourceDatasourceId, false);
  void loadTables(form.targetDatasourceId, true);
};

/**
 * 解析字段映射 JSON
 * @param json 存储值
 */
const parseMapping = (json?: string | null): SyncFieldMapping[] => {
  if (!json) {
    return [];
  }
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

/** 加一行空白映射 */
const addMappingRow = () => {
  form.mapping.push({ source: "", target: "" });
};

/** 预览并自动配对 */
const doPreview = async () => {
  if (form.sourceDatasourceId == null || form.targetDatasourceId == null) {
    ElMessage.warning("请先选择源与目标数据源");
    return;
  }
  if (!form.sourceSql.trim()) {
    ElMessage.warning("请先填写源读取 SQL");
    return;
  }
  if (!form.targetTable.trim()) {
    ElMessage.warning("请先填写目标表名");
    return;
  }
  try {
    const preview = await previewSyncMapping({
      sourceDatasourceId: form.sourceDatasourceId,
      sourceSql: form.sourceSql,
      targetDatasourceId: form.targetDatasourceId,
      targetTable: form.targetTable,
      mapping: form.mapping.filter(item => item.source && item.target),
    });
    previewSourceColumns.value = preview.sourceColumns;
    previewTargetColumns.value = preview.targetColumns;
    previewWarnings.value = preview.warnings;
    form.mapping = preview.mapping.map(item => ({ ...item }));
    ElMessage.success(`源 ${preview.sourceColumns.length} 列 / 目标 ${preview.targetColumns.length} 列，已配对 ${preview.mapping.length} 项`);
  } catch (e) {
    previewWarnings.value = [];
    ElMessage.error("预览失败：" + (e as Error)?.message);
  }
};

/** 保存任务 */
const submit = async () => {
  // 兜底再校验前置步骤，并把向导跳回出问题的那一步
  if (!validateStep(0)) {
    step.value = 0;
    return;
  }
  if (!validateStep(1)) {
    step.value = 1;
    return;
  }
  if (cronError.value) {
    ElMessage.warning(cronError.value);
    return;
  }
  if (!form.name.trim()) {
    ElMessage.warning("任务名称不能为空");
    return;
  }
  if (form.enabled && !form.cron.trim()) {
    ElMessage.warning("启用定时前请先填写定时表达式");
    return;
  }
  const mapping = form.mapping.filter(item => item.source && item.target);
  // validateStep 已在运行时保证非空，这里再收窄一次类型（number|null → number）
  const sourceId = form.sourceDatasourceId;
  const targetId = form.targetDatasourceId;
  if (sourceId == null || targetId == null) {
    return;
  }
  saving.value = true;
  try {
    const payload: SyncTaskPayload = {
      name: form.name.trim(),
      sourceDatasourceId: sourceId,
      sourceSql: form.sourceSql.trim(),
      targetDatasourceId: targetId,
      targetTable: form.targetTable.trim(),
      columnMapping: mapping.length ? JSON.stringify(mapping) : null,
      writeMode: form.writeMode,
      batchSize: form.batchSize,
      cron: form.cron.trim() ? form.cron.trim() : null,
      enabled: form.enabled ? 1 : 0,
    };
    if (editingId.value) {
      await updateSyncTask(editingId.value, payload);
    } else {
      await createSyncTask(payload);
    }
    ElMessage.success("已保存");
    dialogVisible.value = false;
    await refresh();
  } catch (e) {
    ElMessage.error("保存失败：" + (e as Error)?.message);
  } finally {
    saving.value = false;
  }
};

/**
 * 立即执行
 * @param row 任务
 */
const run = async (row: SyncTask) => {
  runningId.value = row.id;
  try {
    const result: SyncTaskRunResult = await runSyncTask(row.id);
    if (result.status === "SUCCESS") {
      ElMessage.success(`执行成功：读 ${result.readCount} 行，写 ${result.writeCount} 行，${result.costMs}ms`);
    } else {
      ElMessage.error(`执行失败：${result.message}`);
    }
  } catch (e) {
    ElMessage.error("执行失败：" + (e as Error)?.message);
  } finally {
    runningId.value = null;
    await refresh();
  }
};

/**
 * 启停定时
 * @param row 任务
 * @param enabled 目标状态
 */
const toggle = async (row: SyncTask, enabled: boolean) => {
  try {
    if (enabled) {
      if (!row.syncTaskCron) {
        ElMessage.warning("该任务没有定时表达式，请先编辑任务填写 cron");
        return;
      }
      await enableSyncTask(row.id);
      ElMessage.success("已启用定时");
    } else {
      await disableSyncTask(row.id);
      ElMessage.success("已停用定时");
    }
    await refresh();
  } catch (e) {
    ElMessage.error("切换失败：" + (e as Error)?.message);
    await refresh();
  }
};

/**
 * 删除任务
 * @param row 任务
 */
const remove = async (row: SyncTask) => {
  try {
    await ElMessageBox.confirm(`确认删除同步任务「${row.syncTaskName}」？`, "删除确认", { type: "warning" });
  } catch {
    return;
  }
  try {
    await deleteSyncTask(row.id);
    ElMessage.success("已删除");
    await refresh();
  } catch (e) {
    ElMessage.error("删除失败：" + (e as Error)?.message);
  }
};

onMounted(async () => {
  await loadDatasources();
  try {
    writeModes.value = await fetchSyncWriteModes();
  } catch {
    writeModes.value = [
      { code: "INSERT", label: "追加插入" },
      { code: "REPLACE", label: "存在即替换" },
      { code: "UPSERT", label: "存在即更新" },
      { code: "OVERWRITE", label: "先清空再插入" },
    ];
  }
  await refresh();
});
</script>

<style scoped>
.st-body { padding: 0 16px 16px; }
/* 三步向导头部：与表单区留出呼吸感 */
.st-steps { margin-bottom: 20px; }
.st-steps :deep(.el-step__title) { font-size: 13px; }
.st-steps :deep(.el-step__description) { font-size: 12px; }
.st-name { font-size: 13px; font-weight: 600; color: var(--text-primary); }
.st-sub { font-size: 12px; color: var(--text-tertiary); }
.st-sql { font-size: 12px; color: var(--text-secondary); }
.st-cron { font-size: 12px; color: var(--brand-600); }
.st-last { display: flex; align-items: center; gap: 6px; margin-bottom: 2px; }
.st-msg { margin-top: 2px; font-size: 12px; color: var(--text-tertiary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.st-form { display: flex; flex-direction: column; gap: 14px; max-height: 62vh; overflow-y: auto; padding-right: 6px; }
.st-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.st-form-item { display: flex; flex-direction: column; gap: 6px; }
.st-form-item label { font-size: 13px; font-weight: 500; color: var(--text-primary); }
.st-form-hint { font-size: 12px; line-height: 1.5; color: var(--text-tertiary); }
.st-full { width: 100%; }
.st-inline { display: flex; align-items: center; gap: 8px; }
.st-pick { width: 260px; }
.st-switch-item { flex-direction: row; align-items: center; gap: 10px; }
.st-map { border: 1px solid var(--border-subtle); border-radius: 8px; padding: 12px; background: var(--bg-container); }
.st-map-head { display: flex; justify-content: space-between; align-items: center; font-size: 13px; font-weight: 600; color: var(--text-primary); margin-bottom: 8px; }
.st-map-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.st-map-col { flex: 1; }
.st-arrow { color: var(--text-tertiary); }
.st-warn { font-size: 12px; color: #f59e0b; background: rgba(245, 158, 11, 0.12); border-radius: 6px; padding: 4px 8px; margin-bottom: 6px; }
.mono { font-family: "JetBrains Mono", "Consolas", monospace; }
</style>