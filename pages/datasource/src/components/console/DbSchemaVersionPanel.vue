<template>
  <div class="dvs">
    <!-- 工具条：拍快照 + 刷新 + 当前位置（库 + 表） -->
    <div class="dvs-bar">
      <ReButton size="small" type="primary" icon="Plus" data-testid="dvs-btn-create" @click="takeSnapshot">
        拍快照
      </ReButton>
      <ReButton size="small" icon="Refresh" data-testid="dvs-btn-refresh" :loading="loading" @click="refreshTable">
        刷新
      </ReButton>
      <span class="dvs-spacer" />
      <span class="dvs-where">
        <span class="dvs-where-db">{{ props.database }}</span>
        <span class="dvs-where-dot">·</span>
        <span class="dvs-where-table">{{ props.tableName }}</span>
        <span class="dvs-where-suffix">版本快照</span>
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
      empty-text="暂无版本快照"
      @row-click="onRowClick"
    >
      <template #col-createTime="{ row }">
        <span class="dvs-time">{{ row.createTime }}</span>
      </template>
      <template #col-dllPreview="{ row }">
        <span class="dvs-ddl">{{ row.ddlPreview }}</span>
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
            <ReButton layout="square" size="small" icon="Copy" tip="复制" @click="copyDdl" />
          </div>
          <pre class="dvs-detail-ddl-body" ref="ddlBody">{{ detail.ddl }}</pre>
        </div>
        <div class="dvs-detail-row">
          <span class="dvs-stat">{{ detail.columns ?? 0 }} 列</span>
          <span class="dvs-stat">{{ detail.indexes ?? 0 }} 索引</span>
          <span class="dvs-stat">{{ detail.foreignKeys ?? 0 }} 外键</span>
        </div>
      </div>
      <template #footer>
        <ReButton @click="detailVisible = false">关闭</ReButton>
      </template>
    </ReDialog>

    <!-- 回滚确认：说明“删表重建”再回落 -->
    <ReDialog v-model="rollbackVisible" :title="`确认回滚 · ${props.tableName}`" width="420px" data-testid="dvs-dialog-rollback">
      <div class="dvs-rollback-hint">
        回滚 <strong>{{ rollbackTarget?.name }}</strong>（{{ rollbackTarget?.createTime }}）的内容是：
        <br />
        1）删掉当前表，2）按快照的 DDL 原样建回，3）重新走进一遍修饰的列/索引/外键。
        <br /><br />
        如果 DDL 内有没法原样执行的约束（比如级联或超长的注释），执行会暂停在错误处。
      </div>
      <div v-if="rollbackResult" class="dvs-rollback-result">
        <div>执行 {{ rollbackResult.totalStatements ?? 0 }} 条 / 成功 {{ rollbackResult.successStatements ?? 0 }} 条 / 失败 {{ rollbackResult.failedStatements ?? 0 }} 条 / 耗时 {{ rollbackResult.elapsed }}ms</div>
        <div v-if="rollbackResult.failure" class="dvs-rollback-failure">失败：{{ rollbackResult.failure }}</div>
        <div v-if="rollbackResult.success" class="dvs-rollback-success">回滚完成，表结构已回到该快照时的样子</div>
      </div>
      <div v-else-if="rollbackLoading" class="dvs-rollback-loading">
        回滚执行中...
      </div>
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
import { computed, nextTick, ref } from "vue";
import type { ReTableLoadParams, RePageResult, ReTableColumn } from "@repo/ui/re-table";
import ReButton from "@repo/ui/re-button";
import ReDialog from "@repo/ui/re-dialog";
import ReTable from "@repo/ui/re-table";
import {
  createDbSchemaSnapshot,
  fetchDbSchemaSnapshotDetail,
  fetchDbSchemaSnapshots,
  fetchDbSchemaDdl,
  rollbackDbSchemaSnapshot,
  type DbSchemaSnapshotVO,
  type DbSnapshotDetailVO,
  type DbSchemaRollbackResultVO,
} from "../api/dbSchemaVersionApi";
/**
 * 版本页签的面板：结构快照（拍快照 / 列表 / 详情 / 回滚 / 删除）
 *
 * <p>荷说名：当前表名 + 当前库名（选表时从表头读）+ 数据源 ID（选表时从选中的数据源读）。<br />
 * 交互在页面级列轮廓上：<br />
 * 拍快照 → 确认弹窗？（不确认；直接保存）<br />
 * 回滚 → 已读确认后完成，失败时画表就标准。</p>
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

/** 数据入口页面的实例 */
const tableRef = ref<typeof ReTable>();

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
/** 每页条数 */
const size20 = ref(20);

/** 详情弹窗 */
const detailVisible = ref(false);
const detail = ref<DbSnapshotDetailVO | null>(null);
const ddlBody = ref<HTMLPreElement | null>(null);
const copyDdl = () => {
  return;
};

/** 回滚弹窗 */
const rollbackVisible = ref(false);
const rollbackTarget = ref<{ name: string; createTime: string } | null>(null);
const rollbackSkipping = ref(false);
const rollbackLoading = ref(false);
const rollbackResult = ref<DbSchemaRollbackResultVO | null>(null);

/** 统计标题 */
const detailTitle = computed(() => `快照详情 · ${props.tableName}`);

/** 回到首页 */
async function reloadSnapshots() {
  await tableRef.value?.goto(1, size.value);
  await loadSnapshots({ page: 1, pageSize: size.value, params: {} });
}

/** 刷新：回到第一页 */
function refreshTable() {
  reloadSnapshots();
}

/** 行点击 → 详情 */
async function onRowClick(row: DbSchemaSnapshotVO): Promise<void> {
  await openDetail(row);
}

/** 远程分页 loader：后端分页，ReTable 只发 page / pageSize */
async function loadSnapshots({ page, pageSize, params }: ReTableLoadParams): Promise<RePageResult> {
  const tableName = props.tableName;
  if (!tableName) return { total: 0, data: [] };
  try {
    loading.value = true;
    const res: any = await fetchDbSchemaSnapshots(
      tableName,
      { page, pageSize, name: keyword.value },
      props.datasourceId,
      props.database,
    );
    const rows = res?.records ?? res?.list ?? res?.data ?? [];
    return { total: res?.total ?? 0, data: rows as unknown as Record<string, unknown>[] };
  } finally {
    loading.value = false;
  }
}

/** 拍快照：让后端自己生成「保存于 2026-10-30 15:30」 */
async function takeSnapshot(): Promise<void> {
  const tableName = props.tableName;
  if (!tableName) {
    message.warning("请先选中一张表");
    return;
  }
  try {
    await createDbSchemaSnapshot(tableName, {}, props.datasourceId, props.database);
    message.success("已拍快照");
  } catch (e) {
    message.error(`拍快照失败: ${String((e as Error)?.message ?? e)}`);
  }
}

/** 打开详情 */
async function openDetail(row: DbSchemaSnapshotVO): Promise<void> {
  try {
    detail.value = await fetchDbSchemaSnapshotDetail(props.tableName, row.id!);
    detailVisible.value = true;
  } catch (e) {
    message.error(`打开详情失败: ${String((e as Error)?.message ?? e)}`);
  }
}

/** 拷备 DDL */
function copyDdl(): void {
  const ddl = detail.value?.ddl ?? "";
  if (!ddl) return;
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(ddl).catch(() => message.error("复制失败"));
  }
}

/** 删除：二次确认 */
async function onDelete(row: DbSchemaSnapshotVO): Promise<void> {
  if (row.id === undefined) return;
  try {
    await deleteDbSchemaSnapshot(props.tableName, row.id);
    message.success("已删除");
    refetchSnapshots();
  } catch (e) {
    message.error(`删除失败: ${String((e as Error)?.message ?? e)}`);
  }
}

/** 回滚：先上弹窗，再叫后端 */
function onRollback(row: DbSchemaSnapshotVO): void {
  rollbackVisible.value = true;
  rollbackTarget.value = { id: row.id, name: row.name, createTime: row.createTime };
  rollbackLoading.value = false;
  rollbackResult.value = null;
}

/** 确认回滚 */
async function confirmRollback(): Promise<void> {
  if (!props.tableName || !rollbackTarget.value?.id) return;
  try {
    rollbackLoading.value = true;
    rollbackResult.value = null;
    const res: any = await rollbackDbSchemaSnapshot(props.tableName, rollbackTarget.value.id);
    rollbackResult.value = res;
    message.success(`回滚完成`);
  } catch (e) {
    message.error(`回滚失败: ${String((e as Error)?.message ?? e)}`);
  } finally {
    rollbackLoading.value = false;
  }
}

/** 刷新列表（简单起见只刷一次） */
async function refetchSnapshots(): Promise<void> {
  await tableRef.value?.goto(1, size.value);
  await loadSnapshots({ page: 1, pageSize: size.value, params: {} });
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
  color: var(--el-text-color-regular);

  .dvs-where-db,
  .dvs-where-table {
    color: var(--el-text-color-primary);
  }
}

.dvs-table {
  flex: 1;
  min-height: 200px;
}

.dvs-ddl {
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
  color: var(--el-text-color-placeholder);
}

.dvs-ops {
  display: flex;
  gap: 4px;
  justify-content: center;
}

.dvs-empty {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 240px;
  color: var(--el-text-color-placeholder);
}

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

.dvs-rollback-result {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: var(--el-text-color-regular);
  margin-top: 10px;
}

.dvs-rollback-failure {
  color: var(--el-text-color-primary);
  background: var(--el-fill-color);
  padding: 6px 8px;
  border-radius: 3px;
}

.dvs-rollback-success {
  color: var(--el-text-success);
  font-weight: 600;
  line-height: 1.4;
}

.dvs-rollback-loading {
  font-size: 13px;
  color: var(--el-text-color-regular);
  display: block;
  margin-top: 8px;
}
</style>
