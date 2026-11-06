<template>
  <div class="oplog">
    <!-- 筛选条 -->
    <div class="oplog-bar">
      <ReInput
        v-model="keyword"
        placeholder="搜索项目名称"
        clearable
        prefix-icon="Search"
        class="oplog-search"
        @keyup.enter="reload"
        @clear="reload"
      />
      <el-select v-model="operation" placeholder="全部操作" clearable class="oplog-sel" @change="reload">
        <el-option v-for="o in OPERATIONS" :key="o.value" :label="o.label" :value="o.value" />
      </el-select>
      <el-select v-model="status" placeholder="全部状态" clearable class="oplog-sel" @change="reload">
        <el-option label="进行中" value="RUNNING" />
        <el-option label="成功" value="SUCCESS" />
        <el-option label="失败" value="FAILED" />
      </el-select>
      <ReButton icon="Refresh" :show-text="true" :loading="loading" @click="reload">刷新</ReButton>
      <span class="oplog-live" :class="{ 'is-on': online }">
        <i class="oplog-dot"></i>
        {{ online ? '实时同步中' : '实时通道未连接' }}
      </span>
    </div>

    <!-- 列表 -->
    <div v-if="!rows.length && !loading" class="oplog-empty">
      <ReIcon name="Tickets" :size="26" />
      <span>{{ emptyText }}</span>
    </div>
    <div v-else class="oplog-table-wrap">
      <table class="oplog-table">
        <thead>
          <tr>
            <th class="col-time">开始时间</th>
            <th class="col-project">项目</th>
            <th class="col-op">操作</th>
            <th class="col-status">状态</th>
            <th class="col-duration">耗时</th>
            <th class="col-operator">操作人</th>
            <th class="col-message">结果 / 失败原因</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.id" :class="`is-${(row.status || '').toLowerCase()}`">
            <td class="col-time mono">{{ formatTime(row.startTime) }}</td>
            <td class="col-project" :title="row.projectName || ''">{{ row.projectName || '—' }}</td>
            <td class="col-op">{{ row.operationLabel || row.operation || '—' }}</td>
            <td class="col-status">
              <span class="oplog-tag" :class="`is-${(row.status || '').toLowerCase()}`">{{ statusLabel(row.status) }}</span>
            </td>
            <td class="col-duration mono">{{ formatDuration(row.durationMs) }}</td>
            <td class="col-operator">{{ row.operatorName || '—' }}</td>
            <td class="col-message" :title="row.message || ''">{{ row.message || '—' }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 分页 -->
    <div v-if="total > pageSize" class="oplog-page">
      <el-pagination
        :current-page="page"
        :page-size="pageSize"
        :total="total"
        layout="prev, pager, next, total"
        background
        @current-change="onPageChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 项目操作日志面板（发布管理「日志管理」）。
 *
 * <p>所有项目操作（增删改、启动/停止/重启、升级、备份、回滚、Git 发布、挂载服务）
 * 都由后端落库，这里按项目/操作/状态检索。新增记录经发布管理全局 SSE 的
 * {@code op-log} 事件即时刷新第一页，不做定时轮询。</p>
 *
 * @author CH
 * @since 4.0.0.52
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { http, unwrapResult } from '@repo/utils';
import { errorText, toastError } from '../utils/errors';
import { releaseSse } from '../services/releaseRealtime';

const props = defineProps<{
  /** 只看某个发布（可空：全部发布） */
  releaseId?: number;
  /** 只看某个项目（可空） */
  projectId?: number;
}>();

const BASE = '/ms/server/release';

/** 操作类型筛选项（与后端 ProjectOperationLabels 对应） */
const OPERATIONS = [
  { value: 'create', label: '创建项目' },
  { value: 'update', label: '修改项目' },
  { value: 'delete', label: '删除项目' },
  { value: 'toggle', label: '启用/禁用' },
  { value: 'start', label: '启动' },
  { value: 'stop', label: '停止' },
  { value: 'restart', label: '重启' },
  { value: 'upgrade', label: '升级' },
  { value: 'backup', label: '备份' },
  { value: 'rollback', label: '回滚' },
  { value: 'deploy', label: 'Git发布' },
  { value: 'install-service', label: '挂载系统服务' },
  { value: 'uninstall-service', label: '卸载系统服务' },
  { value: 'update-lib', label: '更新依赖包' },
];

interface OpLogRow {
  id: number;
  projectId?: number;
  projectName?: string;
  releaseId?: number;
  operation?: string;
  operationLabel?: string;
  status?: string;
  message?: string;
  taskId?: string;
  operatorName?: string;
  startTime?: string;
  endTime?: string;
  durationMs?: number;
}

const keyword = ref('');
const operation = ref('');
const status = ref('');
const rows = ref<OpLogRow[]>([]);
const loading = ref(false);
const page = ref(1);
const pageSize = ref(20);
const total = ref(0);
/** 实时通道是否在线（显示在筛选条右侧） */
const online = ref(releaseSse.online);

const emptyText = computed(() =>
  keyword.value || operation.value || status.value
    ? '没有符合筛选条件的操作记录'
    : '暂无操作记录：项目的每次操作都会自动记录在这里',
);

/**
 * 时间格式化（后端 LocalDateTime → 展示用文本）。
 *
 * @param value 时间值
 * @returns 展示文本
 */
function formatTime(value?: string) {
  if (!value) return '—';
  const text = String(value).replace('T', ' ');
  return text.length > 19 ? text.slice(0, 19) : text;
}

/**
 * 耗时格式化。
 *
 * @param ms 毫秒
 * @returns 展示文本
 */
function formatDuration(ms?: number) {
  if (ms == null) return '—';
  if (ms < 1000) return `${ms} ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)} s`;
  const m = Math.floor(ms / 60_000);
  const s = Math.round((ms % 60_000) / 1000);
  return `${m}m${s}s`;
}

/**
 * 状态中文名。
 *
 * @param value 状态
 * @returns 中文名
 */
function statusLabel(value?: string) {
  return ({ RUNNING: '进行中', SUCCESS: '成功', FAILED: '失败' } as Record<string, string>)[value || ''] || value || '—';
}

/**
 * 拉取一页操作日志。
 *
 * @param silent 静默刷新：失败不弹 toast（SSE 触发的刷新用）
 */
async function load(silent = false) {
  loading.value = true;
  try {
    let request = http()
      .get(`${BASE}/op-log/page`)
      .query({ page: page.value, pageSize: pageSize.value });
    if (props.releaseId) request = request.query({ releaseId: props.releaseId });
    if (props.projectId) request = request.query({ projectId: props.projectId });
    if (keyword.value.trim()) request = request.query({ keyword: keyword.value.trim() });
    if (operation.value) request = request.query({ operation: operation.value });
    if (status.value) request = request.query({ status: status.value });
    const res = await request;
    const data = unwrapResult<any>(res);
    rows.value = Array.isArray(data?.records) ? data.records : [];
    total.value = Number(data?.total ?? rows.value.length);
  } catch (e) {
    if (!silent) toastError(e, '加载操作日志失败');
    if (!silent) rows.value = [];
  } finally {
    loading.value = false;
  }
}

/** 回到第一页并刷新 */
function reload() {
  page.value = 1;
  void load();
}

/**
 * 翻页。
 *
 * @param next 目标页
 */
function onPageChange(next: number) {
  page.value = next;
  void load();
}

/** 这条记录是否属于当前筛选范围 */
function inScope(row: { releaseId?: number; projectId?: number }) {
  if (props.projectId) return row.projectId === props.projectId;
  if (props.releaseId) return row.releaseId === props.releaseId;
  return true;
}

// op-log 事件：只刷新第一页（新记录总在顶部），避免打断用户翻页
const unsubOpLog = releaseSse.onOpLog((row) => {
  if (!inScope(row)) return;
  if (page.value !== 1) return;
  void load(true);
});

const unsubStatus = releaseSse.onStatus((s) => {
  online.value = s === 'connected';
});

onMounted(() => {
  releaseSse.open();
  void load();
});

onBeforeUnmount(() => {
  unsubOpLog();
  unsubStatus();
  releaseSse.close();
});
</script>

<style scoped>
.oplog {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
}

.oplog-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.oplog-search {
  width: 220px;
}

.oplog-sel {
  width: 148px;
}

.oplog-live {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.oplog-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--el-text-color-placeholder);
}

.oplog-live.is-on .oplog-dot {
  background: var(--el-color-success);
  box-shadow: 0 0 0 3px var(--el-color-success-light-9);
}

.oplog-table-wrap {
  overflow-x: auto;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
}

.oplog-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12.5px;
}

.oplog-table th {
  position: sticky;
  top: 0;
  padding: 9px 12px;
  font-weight: 600;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  text-align: left;
  white-space: nowrap;
  background: var(--bg-fill, #f7f8fa);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.oplog-table td {
  padding: 9px 12px;
  color: var(--el-text-color-regular);
  border-bottom: 1px solid var(--el-border-color-extra-light, #f2f3f5);
  vertical-align: top;
}

.oplog-table tbody tr:last-child td {
  border-bottom: none;
}

.oplog-table tbody tr:hover td {
  background: var(--el-fill-color-lighter, #fafafa);
}

.oplog-table tr.is-failed td.col-message {
  color: var(--el-color-danger);
}

.mono {
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.col-time {
  width: 148px;
  white-space: nowrap;
}

.col-project {
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 600;
}

.col-op,
.col-status,
.col-operator {
  width: 96px;
  white-space: nowrap;
}

.col-duration {
  width: 78px;
}

.col-message {
  max-width: 320px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.oplog-tag {
  display: inline-block;
  padding: 1px 8px;
  font-size: 11.5px;
  border-radius: 999px;
  background: var(--el-fill-color);
  color: var(--el-text-color-secondary);
}

.oplog-tag.is-running {
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.oplog-tag.is-success {
  color: var(--el-color-success);
  background: var(--el-color-success-light-9);
}

.oplog-tag.is-failed {
  color: var(--el-color-danger);
  background: var(--el-color-danger-light-9);
}

.oplog-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 44px 0;
  font-size: 12.5px;
  color: var(--el-text-color-secondary);
}

.oplog-page {
  display: flex;
  justify-content: flex-end;
}
</style>
