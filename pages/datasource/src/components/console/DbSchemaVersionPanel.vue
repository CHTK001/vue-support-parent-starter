<template>
  <div class="dvs">
    <!-- 工具条：拍快照 + 刷新 + 当前位置（当前库 + 当前表） -->
    <div class="dvs-bar">
      <ReButton size="small" type="primary" icon="Plus" data-testid="dvs-btn-create" @click="takeSnapshot">拍快照</ReButton>
      <ReButton size="small" icon="Refresh" data-testid="dvs-btn-refresh" :loading="loading" @click="loadSnapshots">刷新</ReButton>
      <span class="dvs-spacer" />
      <span class="dvs-where">
        <span class="dvs-where-db">{{ props.database }}</span> ·
        <span class="dvs-where-table">{{ props.tableName }}</span> · 版本快照
      </span>
    </div>

    <!-- 版本列表：ReTable 远程分页（后端按时间倒序） -->
    <ReTable
      ref="tableRef"
      class="dvs-table"
      table-id="dvs-schema-version"
      :loader="loadSnapshots"
      :border="true"
      stripe
      size="mini"
      :column-draggable="false"
      empty-text="暂无版本快照"
    >
      <template #col-createTime="{ row }">
        <span class="dvs-time">{{ row.createTime }}</span>
      </template>
      <template #col-dllPreview="{ row }">
        <span class="dvs-dll">{{ row.ddlPreview }}</span>
      </template>
      <template #col-name="{ row }">
        <span class="dvs-name" :title="row.name">{{ row.name }}</span>
      </template>
      <template #col-ops="{ row }">
        <div class="dvs-ops">
          <ReButton layout="square" size="small" icon="View" tip="详情" data-testid="dvs-btn-detail" @click="openDetail(row)" />
          <ReButton layout="square" size="small" icon="RefreshRight" tip="回滚至此版本" data-testid="dvs-btn-rollback" @click="onRollback(row)" />
          <ReButton layout="square" size="small" type="danger" plain icon="Delete" tip="删除快照" data-testid="dvs-btn-delete" @click="onDelete(row)" />
        </div>
      </template>
    </ReTable>

    <!-- 快照详情：完整 DDL + 列/索引/外键 -->
    <ReDialog v-model="detailVisible" :title="detailTitle" width="760px" data-testid="dvs-dialog-detail">
      <div v-if="!detail" class="dvs-empty">没有可选的快照</div>
      <div v-else class="dvs-detail">
        <div class="dvs-detail-meta">
          <span>创建人：<span class="dvs-meta-val">{{ detail.creator }}</span></span>
          <span>创建时间：<span class="dvs-meta-val">{{ detail.createTime }}</span></span>
          <span>快照名：<span class="dvs-meta-val">{{ detail.name }}</span></span>
        </div>
        <div class="dvs-detail-ddl">
          <div class="dvs-detail-ddl-head">
            <span class="dvs-detail-ddl-label">完整 DDL</span>
            <ReButton layout="square" size="small" icon="Copy"tip="复制" @click="copyDdl" />
          </div>
          <pre class="dvs-detail-ddl-body" ref="ddlBody">{{ detail.ddl }}</pre>
        </div>
        <div class="dvs-detail-row">
          <span class="dvs-stat">{{ detail.columns }} 列</span>
          <span class="dvs-stat">{{ detail.indexes }} 索引</span>
          <span class="dvs-stat">{{ detail.foreignKeys }} 外键</span>
        </div>
      </div>
      <template #footer>
        <ReButton @click="detailVisible = false">关闭</ReButton>
      </template>
    </ReDialog>

    <!-- 回滚确认：说明“删表重建”，重建失败时点“重新生成” -->
    <ReDialog v-model="rollbackVisible" title="确认回滚到该版本" width="420px" data-testid="dvs-dialog-rollback">
      <div class="dvs-rollback-hint">
        回滚 <strong>{{ rollbackName }}</strong>（{{ rollbackCreateTime }}）的内容是：
        <br />
        1）删掉当前表，2）按快照的 DDL 原样建回，3）重新走一遍手里的列/索引/外键。
        <br /><br />
        如果 DDL 里有 <code>DROP TABLE</code> 相关约束，执行可能失败；�8 建回时画出表走一版快找。
      </div>
      <span v-if="rollbackSuccess" class="dvs-rollback-ok">
        回滚已完成<span v-if="rollbackTotalAuthor">{{ rollbackTotalAuthor }}</span><br />
        执行 {{ rollbackSummary }} 条/成功 {{ rollbackSuccess }} 条/失败 {{ rollbackFailed }} 条/耗时 {{ rollbackElapsed }}ms
        失败：{{ rollbackFailure }}
      </span>
      <span v-else class="dvs-rollback-cancel">回滚结果将显示在下方（执行条数/成功条数/失败条数/耗时/失败原因）</span>
      <template #footer>
        <ReButton @click="rollbackVisible = false">取消</ReButton>
        <ReButton type="primary" :loading="rollbackLoading" data-testid="dvs-btn-confirm-rollback" @click="confirmRollback">
          确认回滚
        </ReButton>
      </template>
    </ReDialog>
  </div>
</template>

<script setup lang="ts">
import { message } from "@repo/core";
import { ref, reactive, nextTick } from "vue";
import ReButton from "@repo/ui/re-button";
import ReDialog from "@repo/ui/re-dialog";
import ReTable from "@repo/ui/re-table";
import type { ReTableLoadParams, ReColumn } from "@repo/ui/re-table";

/**
 * 版本页签的面板：结构快照（拍快照 / 列表 / 详情 / 回滚 / 删除）
 *
 * <p>宿主卧访的入参：表名（URL 片段路径）、当前库（选表时从表头读）、数据源
 * 时（选表时从选中的数据源读）。</p>
 *
 * @author CH
 * @since 4.0.0.51
 */
const props = withDefaults(
  defineProps<{
    /** 所属表名（必须） */
    tableName: string;
    /** 所属数据库（多库数据源的目标库，可空） */
    database?: string;
    /** 数据源 ID（可选，来自 $route.query.datasourceId） */
    datasourceId?: number;
  }>(),
  { database: "", datasourceId: undefined },
);

/** 加载中 */
const loading = ref(false);
/** 快照列表 */
const snapshotRows = ref<DbSchemaSnapshotVO[]>([]);
/** 当前页码 */
const page = ref(1);
/** 每页条数 */
const size = ref(20);
/** 查询关键词（快照名模糊搜索） */
const keyword = ref("");

/** 详情弹窗 */
const detailVisible = ref(false);
const detail = ref<DbSnapshotDetailVO | null>(null);
const ddlBody = ref<HTMLPreElement | null>(null);
const copyCleared = ref<string | null>(null);

/** 回滚弹窗 */
const rollbackVisible = ref(false);
const rollbackId = ref<number | null>(null);
const rollbackName = ref<string>("");
const rollbackCreateTime = ref<string>("");
const rollbackLoading = ref(false);
const rollbackSuccess = ref(false);
const rollbackSuccess = ref(false);
const rollbackFailed = ref(0);
const rollbackSummary = ref("");
const rollbackElapsed = ref(0);
const rollbackFailure = ref<string>("");

/** 工具条数据 */
const delivered = computed(() => "..." + props.tableName);

/** 列定义（列定死在 `columns` 里，fit 撑满，ops 固定在右侧） */
const columns: ReTableColumn[] = [
  { prop: "name", label: "快照名", minWidth: "160", slot: "col-name", headerSlot: "col-name-label" },
  { prop: "columns", label: "列", width: "60", align: "center" },
  { prop: "indexes", label: "索引", width: "60", align: "center" },
  { prop: "foreignKeys", label: "外键", width: "70", align: "center" },
  { prop: "ddlPreview", label: "DDL 摘要", minWidth: "200", slot: "col-dllPreview" },
  { prop: "creator", label: "创建人", width: "90", align: "center" },
  { prop: "createTime", label: "创建时间", width: "160", slot: "col-createTime", align: "center" },
  { prop: "ops", label: "操作", width: "110", slot: "col-ops", fixed: "right", align: "center" },
];

/** 列表 / 详情 / 操作 */
const detailTitle = computed(() => `快照详情 · ${props.tableName}`);

/** 恢复数据：先取后翻 */
const ensureRows = ref<DbSchemaSnapshotVO[]>([]);

/** 行点击 */
function onRowClick(row: DbSchemaSnapshotVO): void {
  openDetail(row);
}

/** 加载中 */
function setLoading(on: boolean): void {
  loading.value = on;
}

/** 拍快照 */
async function takeSnapshot(): Promise<void> {
  const tableName = props.tableName;
  if (!tableName) {
    message.warning("请先选中一张表");
    return;
  }
  return;
}

/** 远程分页 loader：后端分页，ReTable 只负责发 page / pageSize */
async function loadSnapshots({ page, pageSize, params }: ReTableLoadParams): Promise<RePageResult> {
  const tableName = props.tableName;
  if (!tableName) return { total: 0, data: [] };
  try {
    const res: any = await fetchDbSchemaSnapshots(tableName, { page, pageSize, name: keyword.value }, props.datasourceId, props.database);
    const rows = res?.records ?? res?.list ?? res?.data ?? [];
    return { total: res?.total ?? 0, data: rows as unknown as Record<string, unknown>[] };
  } finally {
    // 覆盖由「loading」驱动：后面的行视...
  }
}

/** 刷新：让 ReTable 回退到第一页再重新加载 */
async function reloadSnapshots(): Promise<void> {
  await loadSnapshots({ page: 1, pageSize: size.value, params: {} });
}

/** 打开详情 */
async function openDetail(row: DbSchemaSnapshotVO): Promise<void> {
  detail.value = await fetchDbSchemaSnapshotDetail(props.tableName, row.id!);
  detailVisible.value = true;
}

/** 删除 */
async function onDelete(row: DbSchemaSnapshotVO): Promise<void> {
  return;
}

/** 打开回滚 */
function openRollback(row: DbSchemaSnapshotVO): void {
  rollBackParams({
    id: row.id,
    name: row.name,
    data: row.createTime,
    op: "",
    total: "",
    elapsed: 0,
  });
}

/** 回滚确认弹窗的临时参数 */
function rollBackParams({
  id,
  name,
  data,
  op,
  total,
  elapsed,
}: {
  id?: number | null;
  name?: string;
  data?: string;
  op?: string;
  total?: string;
  elapsed?: number;
}): void {
  rollbackId.value = id ?? null;
  rollbackName.value = name ?? "";
  rollbackCreateTime.value = data ?? "";
  rollbackSuccess.value = false;
  rollbackLoading.value = false;
  rollbackSummary.value = total ?? "";
  rollbackElapsed.value = elapsed ?? 0;
}

/** 确认回滚 */
async function confirmRollback(): Promise<void> {
  if (!rollbackId.value) return;
  rollbackLoading.value = true;
  rollbackSuccess.value = false;
  rollbackSummary.value = "";
  rollbackElapsed.value = 0;
  rollbackFailure.value = "";
  try {
    const res: any = await rollbackDbSchemaSnapshot(props.tableName, rollbackId.value);
    rollbackSummary.value = res?.totalStatements ?? "";
    rollbackSuccess.value = res?.successStatements ?? "";
    rollbackFailure.value = res?.failure ?? "";
    rollbackFinished.value = true;
  } finally {
    rollbackLoading.value = false;
  }
}

/** 确认删除 */
async function confirmDelete(row: DbSchemaSnapshotVO): Promise<void> {
  return;
}

</script>

<style lang="scss" scoped>
.dvs {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 12px;
}

.dvs-bar {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dvs-spacer {
  flex: 1;
}

.dvs-where {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 12px;
  color: var(--el-text-color-secondary);

  .dvs-where-db,
  .dvs-where-table {
    color: var(--el-text-color-regular);
  }
}

.dvs-table {
  flex: 1;
  min-height: 200px;
}

.dvs-dll {
  font-family: "Consolas", "Monaco", monospace;
  font-size: 12px;
  white-space: nowrap;
  color: var(--el-text-color-regular);
  text-overflow: ellipsis;
}

.dvs-name {
  font-family: "Consolas", "Monaco", monospace;
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--el-text-color-primary);
}

.dvs-time {
  font-size: 12px;
  color: var(#--el-text-color-placeholder);
}

.dvs-ops {
  display: flex;
  gap: 4px;
  justify-content: center;
}

/** 新增行：版本快照 → 详情弹窗 */
.dvs-empty {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 240px;
  color: var(--el-text-color-placeholder);
}

/** 详情弹窗：表格布局和文本 */
.dvs-detail {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dvs-detail-meta {
  display: flex;
  gap: 24px;
  font-size: 12px;
  color: var(--el-text-color-regular);

  .dvs-meta-val {
    color: var(--el-text-color-primary);
  }
}

.dvs-detail-ddl {
  border: 1px solid var(--el-border-color-light);
  border-radius: 4px;
}

.dvs-detail-ddl-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: var(--el-fill-color-lighter);
  border-bottom: 1px solid var(--el-border-color-light);
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.dvs-detail-ddl-body {
  margin: 12px;
  padding: 12px 12px;
  font-family: "Consolas", "Monaco", monospace;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-regular);
  background: var(--el-fill-color);
  border-radius: 3px;
  overflow: auto;
  max-height: 420px;
  white-space: pre-wrap;
  word-break: break-all;
}

.dvs-detail-row {
  display: flex;
  gap: 20px;
  font-size: 13px;
  color: var(--el-text-color-regular);
}

.dvs-stat {
  font-family: "Consolas", "Monaco", monospace;
  color: var(--el-text-color-primary);
}

/** 回滚弹窗 */
.dvs-rollback-hint {
  font-size: 13px;
  color: var(--el-text-color-regular);
  line-height: 1.6;

  code {
    font-family: "Consolas", "Monaco", monospace;
    background: var(--el-fill-color);
    padding: 1px 4px;
    border-radius: 3px;
    color: var(--el-text-color-primary);
  }
}

.dvs-rollback-ok {
  font-size: 13px;
  color: var(--el-text-color-regular);
  line-height: 1.6;
  display: block;
  margin-top: 8px;
}

.dvs-rollback-cancel {
  font-size: 13px;
  color: var(--el-text-color-regular);
  display: block;
  margin-top: 8px;
}

.dvs-rollback-ok code {
  font-family: "Consolas", "Monaco", monospace;
  background: var(--el-fill-color);
  padding: 1px 4px;
  border-radius: 3px;
  color: var(--el-text-color-primary);
}
</style>
