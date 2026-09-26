<template>
  <div class="dsm tel-page">
    <!-- 顶部工具栏 -->
    <div class="dsm-toolbar">
      <div class="dsm-toolbar-left">
        <ReIcon name="DataAnalysis" :size="18" class="dsm-title-icon" />
        <span class="dsm-title">InfluxDB 时序数据库管理</span>
      </div>
      <div class="dsm-toolbar-right">
        <ReButton size="small" @click="refresh">
          <template #icon><ReIcon name="Refresh" /></template>刷新
        </ReButton>
        <ReButton size="small" type="primary" @click="openQuery">
          <template #icon><ReIcon name="Search" /></template>Flux 查询
        </ReButton>
      </div>
    </div>

    <div class="dsm-body">
      <!-- 左侧连接树 -->
      <div class="dsm-sidebar">
        <div class="dsm-tree">
          <div class="dsm-tree-node dsm-tree-root" @click="toggleNode('root')">
            <ReIcon :name="expandedNodes.has('root') ? 'ArrowDown' : 'ArrowRight'" size="12" />
            <ReIcon name="Coin" size="14" class="dsm-tree-icon dsm-influx-icon" />
            <span class="dsm-tree-label">{{ connectionName }}</span>
          </div>

          <div v-if="expandedNodes.has('root')" class="dsm-tree-children">
            <div class="dsm-tree-node" @click="toggleNode('buckets')">
              <ReIcon :name="expandedNodes.has('buckets') ? 'ArrowDown' : 'ArrowRight'" size="12" />
              <ReIcon name="FolderOpened" size="14" class="dsm-tree-icon" />
              <span class="dsm-tree-label">存储桶 (Buckets)</span>
              <span class="dsm-tree-count">{{ buckets.length }}</span>
            </div>
            <div v-if="expandedNodes.has('buckets')" class="dsm-tree-children">
              <div
                v-for="bucket in buckets"
                :key="bucket.name"
                class="dsm-tree-node dsm-leaf-node"
                :class="{ active: activeBucket === bucket.name }"
                @click="selectBucket(bucket.name)"
              >
                <ReIcon name="Collection" size="14" class="dsm-tree-icon" />
                <span class="dsm-tree-label">{{ bucket.name }}</span>
              </div>
            </div>

            <div class="dsm-tree-node" @click="toggleNode('measurements')">
              <ReIcon :name="expandedNodes.has('measurements') ? 'ArrowDown' : 'ArrowRight'" size="12" />
              <ReIcon name="TrendCharts" size="14" class="dsm-tree-icon" />
              <span class="dsm-tree-label">测量 (Measurements)</span>
            </div>
            <div v-if="expandedNodes.has('measurements')" class="dsm-tree-children">
              <div
                v-for="m in measurements"
                :key="m"
                class="dsm-tree-node dsm-leaf-node"
                @click="selectMeasurement(m)"
              >
                <ReIcon name="DataLine" size="14" class="dsm-tree-icon" />
                <span class="dsm-tree-label">{{ m }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧内容区 -->
      <div class="dsm-content">
        <!-- 连接信息 -->
        <div class="dsm-info-card">
          <div class="dsm-info-row">
            <span class="dsm-info-label">连接地址</span>
            <span class="dsm-info-value">{{ connectionInfo.host }}:{{ connectionInfo.port }}</span>
          </div>
          <div class="dsm-info-row">
            <span class="dsm-info-label">组织 (Org)</span>
            <span class="dsm-info-value">{{ connectionInfo.organization }}</span>
          </div>
          <div class="dsm-info-row">
            <span class="dsm-info-label">版本</span>
            <span class="dsm-info-value">InfluxDB {{ connectionInfo.version }}</span>
          </div>
          <div class="dsm-info-row">
            <span class="dsm-info-label">状态</span>
            <ReTag :type="connected ? 'success' : 'danger'" size="small">{{
              connected ? "已连接" : "未连接"
            }}</ReTag>
          </div>
        </div>

        <!-- 存储桶列表 -->
        <div class="dsm-section">
          <div class="dsm-section-title">存储桶列表</div>
          <ReTable
            :data="buckets"
            :columns="bucketColumns"
            :loading="loading"
            stripe
            border
            height="300px"
          />
        </div>

        <!-- 最近数据 -->
        <div class="dsm-section" v-if="activeBucket">
          <div class="dsm-section-title">
            {{ activeBucket }} - 最近数据
            <ReButton size="small" text @click="loadBucketData">
              <template #icon><ReIcon name="Refresh" size="12" /></template>刷新
            </ReButton>
          </div>
          <ReTable
            :data="recentData"
            :columns="dataColumns"
            :loading="dataLoading"
            stripe
            border
            height="250px"
          />
        </div>

        <!-- 空状态 -->
        <div v-if="!activeBucket && buckets.length === 0" class="dsm-empty">
          <ReIcon name="Collection" size="48" class="dsm-empty-icon" />
          <p>{{ emptyText }}</p>
        </div>
      </div>
    </div>

    <!-- Flux 查询弹窗 -->
    <ReDialog v-model="queryVisible" title="Flux 查询" width="700px">
      <div class="dsm-query-area">
        <textarea
          v-model="fluxQuery"
          class="dsm-query-editor"
          placeholder="输入 Flux 查询语句，例如：&#10;from(bucket: &quot;my-bucket&quot;)&#10;  |&gt; range(start: -1h)&#10;  |&gt; filter(fn: (r) =&gt; r._measurement == &quot;cpu&quot;)"
          rows="8"
        ></textarea>
        <div class="dsm-query-result">
          <div class="dsm-query-header">查询结果</div>
          <ReTable
            v-if="queryResult.columns.length > 0"
            :data="queryResult.rows"
            :columns="queryResult.columns.map(c => ({ prop: c, label: c, minWidth: 120 }))"
            stripe
            border
            height="200px"
          />
          <ReEmpty v-else description="执行查询后显示结果" />
        </div>
      </div>
      <template #footer>
        <ReButton @click="queryVisible = false">取消</ReButton>
        <ReButton type="primary" @click="executeQuery">
          <template #icon><ReIcon name="VideoPlay" /></template>执行查询
        </ReButton>
      </template>
    </ReDialog>
  </div>
</template>

<script setup lang="ts">
/**
 * InfluxDB 管理页
 *
 * 提供 InfluxDB 时序库的 Bucket/度量浏览、连接测试与 Flux 查询执行。
 * 数据全部来自后端 `/ms/monitor/influxdb/*`，数据源由路由 `datasourceId` 指定。
 * @author CH
 * @since 4.0.0
 */
import { computed, reactive, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { ElMessage } from "element-plus";
import {
  executeInfluxdbQuery,
  fetchInfluxdbBuckets,
  fetchInfluxdbMeasurements,
  testInfluxdbConnection,
  type InfluxdbBucket,
  type InfluxdbMeasurement
} from "../monitorApi";
import { extraText, useExternalDatasource } from "../utils/externalDatasource";

const route = useRoute();
const { datasourceId, datasource, error: datasourceError } = useExternalDatasource(
  () => route.query,
  "influxdb",
  "InfluxDB"
);

// 连接信息（由数据源配置 + 连通性测试回填）
const connectionName = computed(() => datasource.value?.name ?? "InfluxDB 时序数据库");
const connectionInfo = reactive({
  host: "-",
  port: 0,
  organization: "-",
  version: "-"
});
const connected = ref(false);

/** 侧栏树中度量的展示名（后端返回对象，树里只展示名称） */
const measurements = computed(() => measurementList.value.map(m => m.name));

const emptyText = computed(() =>
  datasourceError.value ? datasourceError.value : "暂无存储桶，点击刷新加载数据"
);

// 树状态
const expandedNodes = ref(new Set(["root", "buckets"]));
const activeBucket = ref("");

// 数据
const loading = ref(false);
const dataLoading = ref(false);
const buckets = ref<InfluxdbBucket[]>([]);
const measurementList = ref<InfluxdbMeasurement[]>([]);
const recentData = ref<Record<string, unknown>[]>([]);

// 列定义
const bucketColumns = [
  { prop: "name", label: "存储桶名称", minWidth: 180 },
  { prop: "retention", label: "保留策略", width: 120 },
  { prop: "series", label: "序列数", width: 100 },
  { prop: "description", label: "创建时间", minWidth: 200 }
];
const dataColumns = [
  { prop: "_time", label: "时间", width: 180 },
  { prop: "_measurement", label: "测量", width: 120 },
  { prop: "_field", label: "字段", width: 120 },
  { prop: "_value", label: "值", width: 100 },
  { prop: "host", label: "主机", width: 140 }
];

// 查询
const queryVisible = ref(false);
const queryLoading = ref(false);
const fluxQuery = ref(
  'from(bucket: "monitor_metrics")\n  |> range(start: -1h)\n  |> filter(fn: (r) => r._measurement == "cpu")'
);
const queryResult = reactive({ columns: [] as string[], rows: [] as Record<string, unknown>[] });

/**
 * 收集结果行的全部列（按首次出现顺序）
 * @param rows 结果行
 * @returns 列名数组
 */
function columnsOf(rows: Record<string, unknown>[]): string[] {
  const columns: string[] = [];
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      if (!columns.includes(key)) columns.push(key);
    }
  }
  return columns;
}

/**
 * 保留时长格式化
 * @param hours 保留小时数，0 或负数表示永久
 * @returns 可读文本
 */
function formatRetention(hours: number): string {
  if (!hours || hours <= 0) return "永久";
  if (hours % 24 === 0) return `${hours / 24}d`;
  if (hours % 60 === 0) return `${hours / 60}h`;
  return `${hours}h`;
}

/**
 * ISO 时间转为本地可读时间
 * @param value ISO 时间文本
 * @returns 本地时间文本
 */
function formatTime(value: unknown): string {
  const text = String(value ?? "");
  if (!text) return "-";
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? text : date.toLocaleString();
}

/**
 * 回填连接信息（地址、组织）
 */
function applyConnectionInfo() {
  const info = datasource.value;
  connectionInfo.host = info?.host ?? "-";
  connectionInfo.port = info?.port ?? 0;
  connectionInfo.organization = extraText(info, ["organization", "org"], info?.database ?? "-");
}

/**
 * 展开/收起侧栏树节点
 * @param key 节点键
 */
function toggleNode(key: string) {
  if (expandedNodes.value.has(key)) {
    expandedNodes.value.delete(key);
  } else {
    expandedNodes.value.add(key);
  }
}

/**
 * 选中 Bucket 加载度量
 * @param name Bucket 名
 */
function selectBucket(name: string) {
  activeBucket.value = name;
  loadBucketData();
}

/**
 * 选中度量
 * @param name 度量名
 */
function selectMeasurement(name: string) {
  fluxQuery.value = `from(bucket: "${activeBucket.value}")\n  |> range(start: -1h)\n  |> filter(fn: (r) => r._measurement == "${name}")`;
  queryVisible.value = true;
}

/**
 * 按后端 `InfluxdbAdminService#newClient` 的优先级拼装连接表单
 *
 * <p>token 依次取 `config.token` → `password` → `username`，
 * organization 依次取 `config.organization`/`config.org` → `database`。
 * 与后端保持一致，避免「测试通过但列表 401」这类不一致。</p>
 */
function buildProbeForm(): Record<string, unknown> {
  const info = datasource.value;
  return {
    host: info?.host,
    port: info?.port,
    token: extraText(info, ["token"], String(info?.password ?? info?.username ?? "")),
    organization: extraText(info, ["organization", "org"], String(info?.database ?? ""))
  };
}

/**
 * 探测连通性并回填版本号
 */
async function probeConnection() {
  const info = datasource.value;
  if (!info) {
    connected.value = false;
    connectionInfo.version = "-";
    return;
  }
  try {
    const result = await testInfluxdbConnection(buildProbeForm());
    connected.value = !!result?.connected;
    connectionInfo.version = result?.version || "-";
  } catch (e) {
    connected.value = false;
    connectionInfo.version = "-";
    ElMessage.error(`连接测试失败：${(e as Error)?.message ?? String(e)}`);
  }
}

/**
 * 加载 Bucket 列表
 */
async function loadBuckets() {
  if (!datasourceId.value) return;
  loading.value = true;
  try {
    const list = await fetchInfluxdbBuckets(datasourceId.value);
    buckets.value = (list ?? []).map(item => ({
      ...item,
      retention: formatRetention(item.retentionHours),
      series: item.seriesCount ?? 0,
      description: formatTime(item.createdAt)
    }));
    if (buckets.value.length > 0 && !buckets.value.some(b => b.name === activeBucket.value)) {
      activeBucket.value = buckets.value[0].name;
    }
  } catch (e) {
    buckets.value = [];
    ElMessage.error(`加载存储桶失败：${(e as Error)?.message ?? String(e)}`);
  } finally {
    loading.value = false;
  }
}

/**
 * 加载当前 Bucket 下的度量
 */
async function loadMeasurements() {
  if (!datasourceId.value || !activeBucket.value) {
    measurementList.value = [];
    return;
  }
  try {
    measurementList.value =
      (await fetchInfluxdbMeasurements(datasourceId.value, activeBucket.value)) ?? [];
  } catch (e) {
    measurementList.value = [];
    ElMessage.error(`加载度量失败：${(e as Error)?.message ?? String(e)}`);
  }
}

/**
 * 加载 Bucket 最近数据（取近 24h 的一批点做预览）
 */
async function loadBucketData() {
  if (!datasourceId.value || !activeBucket.value) {
    recentData.value = [];
    return;
  }
  dataLoading.value = true;
  try {
    const flux = `from(bucket: "${activeBucket.value}")\n  |> range(start: -24h)\n  |> limit(n: 200)`;
    const result = await executeInfluxdbQuery(flux, datasourceId.value);
    recentData.value = (result?.rows ?? []).map(row => ({ ...row, _time: formatTime(row._time) }));
  } catch (e) {
    recentData.value = [];
    ElMessage.error(`加载数据失败：${(e as Error)?.message ?? String(e)}`);
  } finally {
    dataLoading.value = false;
  }
}

/**
 * 刷新当前连接下的树数据
 */
async function refresh() {
  await probeConnection();
  await loadBuckets();
  await loadMeasurements();
  await loadBucketData();
}

/**
 * 打开 Flux 查询面板
 */
function openQuery() {
  queryVisible.value = true;
}

/**
 * 执行 Flux 查询
 */
async function executeQuery() {
  if (!fluxQuery.value.trim()) {
    ElMessage.warning("请输入 Flux 查询语句");
    return;
  }
  if (!datasourceId.value) {
    ElMessage.warning(datasourceError.value || "请先选择数据源");
    return;
  }
  queryLoading.value = true;
  try {
    const result = await executeInfluxdbQuery(fluxQuery.value, datasourceId.value);
    queryResult.rows = result?.rows ?? [];
    queryResult.columns = columnsOf(queryResult.rows);
    ElMessage.success(`查询成功，返回 ${result?.rowCount ?? queryResult.rows.length} 行`);
  } catch (e) {
    queryResult.rows = [];
    queryResult.columns = [];
    ElMessage.error(`查询失败：${(e as Error)?.message ?? String(e)}`);
  } finally {
    queryLoading.value = false;
  }
}

// 切换 Bucket 后重新拉取度量与数据
watch(activeBucket, async () => {
  await loadMeasurements();
  await loadBucketData();
});

// 数据源变化（含首次进入）时整体刷新
watch(
  [datasourceId, datasourceError],
  async ([id, err]) => {
    applyConnectionInfo();
    if (!id) {
      buckets.value = [];
      measurementList.value = [];
      recentData.value = [];
      activeBucket.value = "";
      connected.value = false;
      connectionInfo.version = "-";
      if (err) ElMessage.warning(err);
      return;
    }
    await refresh();
  },
  { immediate: true }
);

// 数据源信息变更时刷新连接信息展示
watch(datasource, applyConnectionInfo);
</script>

<style scoped>
.dsm {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 100%;
}

.dsm-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  border-bottom: 1px solid var(--border-subtle);
  margin-bottom: 16px;
}

.dsm-toolbar-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.dsm-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.dsm-title-icon {
  color: #34d399;
}

.dsm-toolbar-right {
  display: flex;
  gap: 8px;
}

.dsm-body {
  display: flex;
  flex: 1;
  gap: 16px;
  overflow: hidden;
}

.dsm-sidebar {
  width: 260px;
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  background: var(--bg-container);
  overflow-y: auto;
  flex-shrink: 0;
}

.dsm-tree {
  padding: 8px 0;
}

.dsm-tree-node {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  cursor: pointer;
  transition: background 0.15s;
}

.dsm-tree-node:hover {
  background: var(--bg-hover);
}

.dsm-tree-node.active {
  background: var(--brand-50);
  color: var(--brand-600);
}

.dsm-tree-root {
  font-weight: 600;
}

.dsm-tree-children {
  padding-left: 16px;
}

.dsm-tree-icon {
  flex-shrink: 0;
}

.dsm-influx-icon {
  color: #34d399;
}

.dsm-tree-label {
  flex: 1;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text-primary);
}

.dsm-tree-count {
  font-size: 11px;
  color: var(--text-tertiary);
  background: var(--bg-fill);
  padding: 1px 6px;
  border-radius: 10px;
}

.dsm-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
}

.dsm-info-card {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  padding: 14px 16px;
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  background: var(--bg-container);
}

.dsm-info-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.dsm-info-label {
  font-size: 12px;
  color: var(--text-tertiary);
}

.dsm-info-value {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.dsm-section {
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  background: var(--bg-container);
  overflow: hidden;
}

.dsm-section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-subtle);
}

.dsm-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--text-tertiary);
}

.dsm-empty-icon {
  opacity: 0.3;
}

.dsm-query-area {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dsm-query-editor {
  width: 100%;
  padding: 12px;
  font-family: "JetBrains Mono", "Consolas", monospace;
  font-size: 13px;
  border: 1px solid var(--border-default);
  border-radius: 6px;
  background: var(--bg-elevated);
  color: var(--text-primary);
  resize: vertical;
  outline: none;
}

.dsm-query-editor:focus {
  border-color: var(--brand-400);
  box-shadow: var(--focus-ring);
}

.dsm-query-result {
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  overflow: hidden;
}

.dsm-query-header {
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  background: var(--bg-fill);
  border-bottom: 1px solid var(--border-subtle);
}

/* 右键菜单 */
.influx-context-menu, .neo4j-context-menu {
  position: fixed;
  z-index: 9999;
  min-width: 160px;
  background: var(--bg-container, #ffffff);
  border: 1px solid var(--border-default, rgba(148, 163, 184, 0.3));
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.15);
  padding: 4px;
}
.icm-item, .n4j-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  font-size: 13px;
  color: var(--text-primary, #1e293b);
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.15s;
}
.icm-item:hover, .n4j-item:hover { background: var(--bg-hover, #f1f5f9); }
.icm-item.icm-danger, .n4j-item.n4j-danger { color: #ef4444; }
.icm-item.icm-danger:hover, .n4j-item.n4j-danger:hover { background: rgba(239, 68, 68, 0.1); }
.icm-divider, .n4j-divider {
  height: 1px;
  margin: 4px 8px;
  background: var(--border-subtle, rgba(148, 163, 184, 0.2));
}
</style>
