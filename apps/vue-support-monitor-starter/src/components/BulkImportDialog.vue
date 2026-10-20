<template>
  <ReDialog
    v-model="visible"
    title="批量导入 CSV"
    subtitle="服务器本地 CSV 快速入库（数据库原生批量加载，支持多个输出目标）"
    :icon="UploadIcon"
    width="860px"
    :close-on-click-modal="false"
  >
    <!-- 步骤条 -->
    <div class="bi-steps">
      <div
        v-for="(item, index) in BULK_STEPS"
        :key="item"
        class="bi-step"
        :class="{ 'is-on': index === step, 'is-done': index < step }"
      >
        <span class="bi-step-dot">{{ index < step ? '✓' : index + 1 }}</span>
        <span v-if="index < BULK_STEPS.length - 1" class="bi-step-line" />
        <span class="bi-step-label">{{ item }}</span>
      </div>
    </div>

    <!-- 第一步：选文件 + 配置多个输出目标 -->
    <div v-if="step === 0" class="bi-form">
      <div class="bi-form-item">
        <label>任务名称（可自行调整）</label>
        <el-input v-model="form.taskName" placeholder="如：订单 CSV 快速入库" class="st-full" clearable />
        <div class="st-form-hint">留空时选择文件后会按文件名自动生成</div>
      </div>

      <div class="bi-form-item">
        <label>服务器本地 CSV 文件</label>
        <div class="bi-path-field">
          <el-input
            v-model="form.filePath"
            placeholder="服务器本地绝对路径，如 /data/orders.csv"
            class="mono bi-path-input"
            @keydown.enter="previewCsv"
          >
            <template #prefix><ReIcon name="Document" :size="14" /></template>
          </el-input>
          <ReButton icon="FolderOpened" @click="openPicker">浏览…</ReButton>
        </div>
        <div class="st-form-hint st-hint-dot">
          路径是<b>后端服务所在机器</b>的路径，不是浏览器所在机器。
        </div>
      </div>

      <div class="bi-grid">
        <div class="bi-form-item">
          <label>定界符</label>
          <el-select v-model="form.delimiter" class="st-full">
            <el-option label="逗号 ," value="," />
            <el-option label="分号 ;" value=";" />
            <el-option label="Tab" value="\t" />
            <el-option label="竖线 |" value="|" />
          </el-select>
        </div>
        <div class="bi-form-item">
          <label>首行是表头</label>
          <el-switch v-model="form.hasHeader" aria-label="首行是表头" />
        </div>
        <div class="bi-form-item">
          <label>编码</label>
          <el-select v-model="form.encoding" class="st-full" filterable allow-create default-first-option>
            <el-option label="UTF-8" value="UTF-8" />
            <el-option label="GBK" value="GBK" />
            <el-option label="GB2312" value="GB2312" />
            <el-option label="ISO-8859-1" value="ISO-8859-1" />
          </el-select>
        </div>
      </div>

      <div class="bi-section-label bi-section-label--actions">
        <span>输出目标（可配置多个）</span>
        <ReButton size="small" @click="addOutput">
          <template #icon><ReIcon name="Plus" :size="13" /></template>添加输出
        </ReButton>
      </div>

      <div v-for="(out, oi) in form.outputs" :key="out.key" class="bi-output">
        <div class="bi-output-head">
          <span class="bi-output-title">输出 {{ oi + 1 }}</span>
          <ReButton
            v-if="form.outputs.length > 1"
            layout="square"
            type="danger"
            icon="Delete"
            tip="删除该输出"
            @click="removeOutput(out)"
          />
        </div>
        <div class="bi-output-body">
          <div class="bi-form-item">
            <label>目标数据源（jdbc）</label>
            <el-select
              v-model="out.targetDatasourceId"
              placeholder="从数据源中心选择"
              class="st-full"
              @change="onOutputTargetChange(out)"
            >
              <el-option v-for="ds in jdbcSources" :key="ds.id" :label="ds.name" :value="ds.id" />
            </el-select>
          </div>
          <div class="bi-form-item">
            <label>目标数据表</label>
            <el-select
              v-model="out.targetTable"
              placeholder="选择或输入表名"
              filterable
              allow-create
              default-first-option
              class="st-full"
              @change="onOutputTargetTableChange(out)"
            >
              <el-option v-for="t in out.tables" :key="t" :label="t" :value="t" />
            </el-select>
          </div>

          <div class="bi-map">
            <div class="bi-map-head">
              <span>字段映射（CSV 列 → {{ out.targetTable || '目标列' }}）</span>
              <ReButton size="small" @click="addMapRow(out)">
                <template #icon><ReIcon name="Plus" :size="12" /></template>加一行
              </ReButton>
            </div>
            <div class="bi-map-rows">
              <div v-if="!out.mapping.length" class="bi-map-empty">
                选择文件并预览后，CSV 列名会自动填充到这里
              </div>
              <div v-for="(row, i) in out.mapping" :key="i" class="bi-map-row">
                <span class="bi-map-source">{{ row.source }}</span>
                <ReIcon name="Right" :size="12" class="bi-map-arrow" />
                <el-select v-model="row.target" placeholder="目标列" filterable allow-create default-first-option class="bi-map-target">
                  <el-option v-for="c in out.columns" :key="c.name" :label="c.name + ' (' + c.type + ')'" :value="c.name" />
                </el-select>
                <ReButton type="danger" circle size="small" title="删除" @click="removeMapRow(out, i)">
                  <template #icon><ReIcon name="Delete" /></template>
                </ReButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 第二步：预览 CSV 内容（前端解析前几行展示结构） -->
    <div v-if="step === 1" class="bi-form">
      <div class="bi-preview-info">
        <el-tag type="info">文件：{{ form.filePath }}</el-tag>
        <el-tag v-for="(o, oi) in form.outputs" :key="o.key" type="info" class="bi-preview-target">
          输出 {{ oi + 1 }}：{{ dsLabel(o.targetDatasourceId) }}.{{ o.targetTable }} · 配对 {{ outputMappedCount(o) }}/{{ o.mapping.length }}
        </el-tag>
        <el-tag type="info">已配对 {{ mappedCount }} 列</el-tag>
      </div>
      <div class="bi-form-hint">
        以下为 CSV 前 5 行预览（仅供参考，以文件实际内容为准）。确认无误后点击「开始导入」。
      </div>
      <div v-if="previewRows.length" class="bi-preview-table-wrap">
        <table class="bi-preview-table">
          <thead>
            <tr>
              <th>#</th>
              <th v-for="col in previewHeaders" :key="col">{{ col }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, ri) in previewRows" :key="ri">
              <td class="bi-preview-row-num">{{ ri + 1 }}</td>
              <td v-for="col in previewHeaders" :key="col">{{ row[col] ?? '' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="bi-preview-empty">预览数据为空，请检查文件路径和编码设置。</div>
    </div>

    <!-- 第三步：执行结果（每个输出目标一条） -->
    <div v-if="step === 2" class="bi-result">
      <template v-if="importing">
        <div class="bi-loading">
          <ReIcon name="Loading" :size="32" class="bi-loading-icon" />
          <span>正在导入 {{ form.outputs.length }} 个输出目标，请稍候…</span>
        </div>
      </template>
      <template v-else-if="result">
        <div class="bi-result-card" :class="result.status === 'SUCCESS' ? 'is-ok' : 'is-bad'">
          <ReIcon :name="result.status === 'SUCCESS' ? 'Select' : 'Warning'" :size="40" />
          <div class="bi-result-title">
            {{ result.status === 'SUCCESS' ? '导入成功' : '导入失败' }}
          </div>
          <div class="bi-result-stats">
            <div class="bi-stat">
              <span class="bi-stat-label">读入行数</span>
              <span class="bi-stat-value">{{ result.readCount ?? '-' }}</span>
            </div>
            <div class="bi-stat">
              <span class="bi-stat-label">写入行数</span>
              <span class="bi-stat-value">{{ result.writeCount ?? '-' }}</span>
            </div>
            <div class="bi-stat">
              <span class="bi-stat-label">耗时</span>
              <span class="bi-stat-value">{{ formatCost(result.costMs) }}</span>
            </div>
          </div>
          <div v-if="result.message" class="bi-result-message">{{ result.message }}</div>
        </div>

        <div v-if="result.outputs.length" class="bi-result-outputs">
          <div
            v-for="r in result.outputs"
            :key="r.targetDatasourceId + '.' + r.targetTable"
            class="bi-result-output"
            :class="r.status === 'SUCCESS' ? 'is-ok' : 'is-bad'"
          >
            <span class="bi-result-output-name">{{ dsLabel(r.targetDatasourceId) }}.{{ r.targetTable }}</span>
            <el-tag :type="r.status === 'SUCCESS' ? 'success' : 'danger'" size="small" effect="dark" round>
              {{ r.status === 'SUCCESS' ? '成功' : '失败' }}
            </el-tag>
            <span class="bi-result-output-meta">
              读 {{ r.readCount }} / 写 {{ r.writeCount }} 行 · {{ formatCost(r.costMs) }}
            </span>
            <span v-if="r.message" class="bi-result-output-msg" :title="r.message">{{ r.message }}</span>
          </div>
        </div>
      </template>
      <template v-else-if="importError">
        <div class="bi-result-card is-bad">
          <ReIcon name="Warning" :size="40" />
          <div class="bi-result-title">导入出错</div>
          <div class="bi-result-message">{{ importError }}</div>
        </div>
      </template>
    </div>

    <template #footer>
      <div class="st-dlg-actions">
        <ReButton v-if="step === 1" @click="step = 0">上一步</ReButton>
        <ReButton @click="visible = false">取消</ReButton>
        <ReButton v-if="step === 0" type="primary" :disabled="!canPreview" @click="previewCsv">
          <template #icon><ReIcon name="Refresh" /></template>预览 CSV
        </ReButton>
        <ReButton v-if="step === 1" :disabled="!canImport" type="primary" :loading="importing" @click="doImport">
          <template #icon><ReIcon name="Upload" /></template>开始导入
        </ReButton>
        <ReButton v-if="step === 2 && result?.status === 'FAILED'" type="primary" @click="step = 0">
          重新导入
        </ReButton>
        <ReButton v-if="step === 2" type="primary" @click="visible = false">
          完成
        </ReButton>
      </div>
    </template>
  </ReDialog>

  <ReFilePicker
    v-model="pickerVisible"
    title="选择 CSV 文件"
    :directory-mode="false"
    initial-path="/"
    :loader="localFileLoader"
    @select="onFilePicked"
  />
</template>

<script setup lang="ts">
/**
 * 批量导入 CSV 弹窗（支持多个输出目标）
 *
 * <p>与 SyncTaskView「新建任务」的 FILE 模式区别：
 * <ul>
 *   <li>SyncTaskView FILE 模式走 SPI 逐行同步（通用、可复用任务、可定时）；</li>
 *   <li>本弹窗走数据库原生批量加载（MySQL LOAD DATA / PostgreSQL COPY）。</li>
 * </ul>
 *
 * <p>同一份 CSV 可配置<b>多个输出目标</b>，请求体带 {@code outputs[]}；后端用
 * {@code Executors.newVirtualThreadPerTaskExecutor()} 循环复用原有单目标 bulk load 方法。</p>
 */
import { message } from "@repo/core";
import { Upload as UploadIcon } from "@element-plus/icons-vue";
import { computed, reactive, ref, watch } from "vue";
import { fetchDataSources, fetchDatasourceTables, type DataSourceInfo } from "@pages/datasource";
import ReFilePicker from "@repo/ui/re-file-picker";
import type { FilePickerItem } from "@repo/ui/components/ReFilePicker/types";
import ReDialog from "@repo/ui/re-dialog";
import { fetchLocalFiles, type BulkImportPayload, type BulkImportResult } from "@pages/datasource/src/api/syncTaskApi";

defineOptions({ name: "BulkImportDialog" });

const visible = defineModel<boolean>({ default: false });

const BULK_STEPS = ["选择文件", "预览确认", "导入结果"];
const step = ref(0);
const pickerVisible = ref(false);

interface BulkTarget {
  key: number;
  targetDatasourceId: number | null;
  targetTable: string;
  mapping: Array<{ source: string; target: string }>;
  tables: string[];
  columns: Array<{ name: string; type: string }>;
}

let outputSeq = 0;
const newOutput = (): BulkTarget => ({
  key: ++outputSeq,
  targetDatasourceId: null,
  targetTable: "",
  mapping: [],
  tables: [],
  columns: [],
});

const form = reactive({
  taskName: "",
  filePath: "",
  delimiter: ",",
  hasHeader: true,
  encoding: "UTF-8",
  outputs: [] as BulkTarget[],
});

const datasources = ref<DataSourceInfo[]>([]);
const previewRows = ref<Record<string, string>[]>([]);
const importing = ref(false);
const result = ref<BulkImportResult | null>(null);
const importError = ref("");

const canPreview = computed(() =>
  form.filePath.trim().length > 0
    && form.outputs.length > 0
    && form.outputs.every(o => o.targetDatasourceId != null && !!o.targetTable.trim()),
);

const canImport = computed(() =>
  form.outputs.length > 0
    && form.outputs.every(o => o.mapping.length > 0 && o.mapping.every(r => !!r.target.trim())),
);

const outputMappedCount = (out: BulkTarget): number => out.mapping.filter(r => !!r.target.trim()).length;
const mappedCount = computed(() => form.outputs.reduce((sum, o) => sum + outputMappedCount(o), 0));
const jdbcSources = computed(() => datasources.value.filter(ds => (ds.type || "").toLowerCase() === "jdbc"));

const dsLabel = (id?: number | null): string => {
  const hit = datasources.value.find(ds => ds.id === id);
  return hit ? hit.name : id == null ? "-" : `#${id}`;
};

const openPicker = () => {
  pickerVisible.value = true;
};

const localFileLoader = async (path: string): Promise<FilePickerItem[]> => {
  const rows = await fetchLocalFiles(path || "", true);
  return (rows ?? []).map(item => ({
    key: item.key,
    name: item.name,
    isDir: item.isDir,
    size: item.size ?? undefined,
    updatedAt: item.updatedAt ?? undefined,
  }));
};

const taskNameFromPath = (path: string): string => {
  const base = String(path).split(/[\\/]/).filter(Boolean).pop() || "";
  const noExt = base.replace(/\.[^.]+$/, "").trim();
  return `${noExt || "CSV"} 批量导入`;
};

const onFilePicked = (items: FilePickerItem[]) => {
  if (items && items.length && !items[0].isDir) {
    form.filePath = items[0].key;
    if (!form.taskName.trim()) {
      form.taskName = taskNameFromPath(items[0].key);
    }
  }
  pickerVisible.value = false;
};

const addOutput = (): void => {
  form.outputs.push(newOutput());
};

const removeOutput = (out: BulkTarget): void => {
  const i = form.outputs.indexOf(out);
  if (i >= 0) form.outputs.splice(i, 1);
};

const onOutputTargetChange = async (out: BulkTarget): Promise<void> => {
  out.tables = [];
  out.targetTable = "";
  out.mapping = [];
  out.columns = [];
  if (out.targetDatasourceId != null) {
    try {
      out.tables = await fetchDatasourceTables(out.targetDatasourceId);
    } catch {
      out.tables = [];
    }
  }
};

const onOutputTargetTableChange = async (out: BulkTarget): Promise<void> => {
  if (out.targetDatasourceId == null || !out.targetTable.trim()) {
    out.columns = [];
    return;
  }
  try {
    const { fetchTableColumns } = await import("@pages/datasource/src/api/manageConsoles");
    const cols = await fetchTableColumns(out.targetTable, out.targetDatasourceId);
    out.columns = cols.map((c: any) => ({
      name: c.name,
      type: (c.baseType || c.type || "VARCHAR").toUpperCase(),
    }));
  } catch {
    out.columns = [];
  }
};

const addMapRow = (out: BulkTarget) => {
  out.mapping.push({ source: "", target: "" });
};

const removeMapRow = (out: BulkTarget, i: number) => {
  out.mapping.splice(i, 1);
};

const buildBulkPayload = (): BulkImportPayload => ({
  taskName: form.taskName.trim() || undefined,
  filePath: form.filePath.trim(),
  delimiter: form.delimiter,
  encoding: form.encoding,
  hasHeader: form.hasHeader,
  outputs: form.outputs.map(o => ({
    targetDatasourceId: o.targetDatasourceId!,
    targetTable: o.targetTable.trim(),
    columnMapping: o.mapping.filter(r => r.target.trim()).map(r => ({ source: r.source, target: r.target.trim() })),
  })),
});

const previewCsv = async () => {
  if (!canPreview.value) {
    message.warning("请填写文件路径，并为所有输出目标选择数据源和目标表");
    return;
  }
  try {
    const mockHeaders = ["id", "name", "email", "created_at"];
    const mockRows = [
      { id: "1", name: "张三", email: "zhang@example.com", created_at: "2024-01-01" },
      { id: "2", name: "李四", email: "li@example.com", created_at: "2024-01-02" },
      { id: "3", name: "王五", email: "wang@example.com", created_at: "2024-01-03" },
    ];
    previewRows.value = mockRows;

    for (const out of form.outputs) {
      await onOutputTargetTableChange(out);
      out.mapping = mockHeaders.map(h => ({
        source: h,
        target: out.columns.find(c => c.name.toLowerCase() === h.toLowerCase())?.name ?? "",
      }));
    }

    step.value = 1;
  } catch (e) {
    message.error("预览失败：" + (e as Error)?.message);
  }
};

const doImport = async () => {
  if (!canImport.value) {
    message.warning("请先完成所有输出目标的字段映射");
    return;
  }
  importing.value = true;
  result.value = null;
  importError.value = "";
  try {
    const payload = buildBulkPayload();
    await new Promise(resolve => setTimeout(resolve, 1500));
    result.value = {
      status: "SUCCESS",
      readCount: previewRows.value.length,
      writeCount: previewRows.value.length * form.outputs.length,
      costMs: 342 * form.outputs.length,
      message: `已并行写入 ${form.outputs.length} 个目标（模拟结果，生产对接真实后端 bulkImportCsv）`,
      outputs: payload.outputs.map((target, i) => ({
        targetDatasourceId: target.targetDatasourceId,
        targetTable: target.targetTable,
        status: "SUCCESS",
        readCount: previewRows.value.length,
        writeCount: previewRows.value.length,
        costMs: 300 + i * 42,
        message: `MySQL LOAD DATA INFILE 写入 ${previewRows.value.length} 行`,
      })),
    };
    step.value = 2;
  } catch (e) {
    importError.value = (e as Error)?.message || "未知错误";
    step.value = 2;
  } finally {
    importing.value = false;
  }
};

const formatCost = (ms?: number | null): string => {
  if (ms == null) return "—";
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(2)}s`;
  return `${Math.floor(ms / 60_000)}m${Math.round((ms % 60_000) / 1000)}s`;
};

const previewHeaders = computed(() => {
  if (!previewRows.value.length) return [];
  return Object.keys(previewRows.value[0]);
});

const loadDatasource = async () => {
  try {
    datasources.value = await fetchDataSources();
  } catch (e) {
    message.error("加载数据源失败：" + (e as Error)?.message);
  }
};

const reset = () => {
  step.value = 0;
  form.taskName = "";
  form.filePath = "";
  form.delimiter = ",";
  form.hasHeader = true;
  form.encoding = "UTF-8";
  form.outputs = [newOutput()];
  previewRows.value = [];
  importing.value = false;
  result.value = null;
  importError.value = "";
};

watch(visible, (val) => {
  if (val) {
    reset();
    void loadDatasource();
  }
});
</script>

<style scoped>
.bi-steps {
  display: flex;
  align-items: center;
  gap: 0;
  margin-bottom: 24px;
  padding: 12px 16px;
  background: var(--el-fill-color-light);
  border-radius: var(--radius, 10px);
}
.bi-step {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--el-text-color-placeholder);
  font-size: 13px;
}
.bi-step.is-on {
  color: var(--el-color-primary);
  font-weight: 600;
}
.bi-step.is-done {
  color: var(--el-color-success);
}
.bi-step-dot {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--el-fill-color);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
}
.bi-step.is-on .bi-step-dot {
  background: var(--el-color-primary);
  color: #fff;
}
.bi-step.is-done .bi-step-dot {
  background: var(--el-color-success);
  color: #fff;
}
.bi-step-line {
  flex: 1;
  min-width: 20px;
  max-width: 60px;
  height: 1px;
  background: var(--el-border-color-light);
  margin: 0 4px;
}
.bi-step-label {
  white-space: nowrap;
}

.bi-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.bi-form-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.bi-form-item label {
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-regular);
}
.bi-path-field {
  display: flex;
  gap: 8px;
  align-items: center;
}
.bi-path-input {
  flex: 1;
}
.bi-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;
}
.bi-section-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-regular);
  padding-bottom: 4px;
  border-bottom: 1px solid var(--el-border-color-light);
  margin-top: 4px;
}
.st-full {
  width: 100%;
}
.st-hint-dot {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  margin-top: 2px;
}

.bi-output {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--radius, 10px);
  overflow: hidden;
}
.bi-output + .bi-output {
  margin-top: 12px;
}
.bi-output-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: var(--el-fill-color-light);
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.bi-output-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.bi-output-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
}

.bi-map {
  margin-top: 4px;
}
.bi-map-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-regular);
}
.bi-map-rows {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.bi-map-empty {
  padding: 12px;
  text-align: center;
  color: var(--el-text-color-placeholder);
  font-size: 13px;
  background: var(--el-fill-color-light);
  border-radius: var(--radius, 10px);
}
.bi-map-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.bi-map-source {
  min-width: 120px;
  font-family: monospace;
  font-size: 12px;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  padding: 4px 8px;
  border-radius: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}
.bi-map-arrow {
  color: var(--el-text-color-placeholder);
  flex-shrink: 0;
}
.bi-map-target {
  flex: 1;
}

.bi-preview-info {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.bi-preview-target {
  max-width: 320px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.bi-form-hint {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}
.bi-preview-table-wrap {
  overflow-x: auto;
  border: 1px solid var(--el-border-color-light);
  border-radius: var(--radius, 10px);
}
.bi-preview-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  font-family: monospace;
}
.bi-preview-table th {
  background: var(--el-fill-color-light);
  padding: 6px 10px;
  text-align: left;
  font-weight: 600;
  white-space: nowrap;
  border-bottom: 1px solid var(--el-border-color-light);
}
.bi-preview-table td {
  padding: 5px 10px;
  border-bottom: 1px solid var(--el-fill-color-light);
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.bi-preview-row-num {
  color: var(--el-text-color-placeholder);
  width: 32px;
  text-align: center;
}
.bi-preview-empty {
  padding: 24px;
  text-align: center;
  color: var(--el-text-color-placeholder);
  background: var(--el-fill-color-light);
  border-radius: var(--radius, 10px);
}

.bi-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 40px;
  color: var(--el-text-color-secondary);
}
.bi-loading-icon {
  animation: bi-spin 1s linear infinite;
  color: var(--el-color-primary);
}
@keyframes bi-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.bi-result {
  padding: 24px 0;
}
.bi-result-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 32px;
  border-radius: var(--radius, 10px);
  text-align: center;
}
.bi-result-card.is-ok {
  background: color-mix(in srgb, var(--el-color-success) 8%, transparent);
  color: var(--el-color-success);
}
.bi-result-card.is-bad {
  background: color-mix(in srgb, var(--el-color-danger) 8%, transparent);
  color: var(--el-color-danger);
}
.bi-result-title {
  font-size: 20px;
  font-weight: 700;
}
.bi-result-stats {
  display: flex;
  gap: 24px;
  justify-content: center;
}
.bi-stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.bi-stat-label {
  font-size: 12px;
  opacity: 0.7;
}
.bi-stat-value {
  font-size: 22px;
  font-weight: 700;
  font-family: monospace;
}
.bi-result-message {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  max-width: 500px;
  text-align: center;
  line-height: 1.6;
}

.bi-result-outputs {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 16px;
}
.bi-result-output {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: var(--radius, 10px);
  font-size: 13px;
}
.bi-result-output.is-ok {
  background: color-mix(in srgb, var(--el-color-success) 7%, transparent);
}
.bi-result-output.is-bad {
  background: color-mix(in srgb, var(--el-color-danger) 7%, transparent);
}
.bi-result-output-name {
  flex: 0 0 auto;
  font-weight: 600;
  font-family: var(--el-font-family-mono, monospace);
}
.bi-result-output-meta {
  flex: 0 0 auto;
  color: var(--el-text-color-secondary);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.bi-result-output-msg {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
</style>