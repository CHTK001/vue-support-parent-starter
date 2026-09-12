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
            <ReTag type="success" size="small">已连接</ReTag>
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
          <p>暂无存储桶，点击刷新加载数据</p>
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
import { ref, reactive, onMounted } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const datasourceId = route.query.datasourceId;

// 连接信息
const connectionName = ref("InfluxDB 时序数据库");
const connectionInfo = reactive({
  host: "127.0.0.1",
  port: 8086,
  organization: "monitor",
  version: "2.7",
});

// 树状态
const expandedNodes = ref(new Set(["root", "buckets"]));
const activeBucket = ref("");

// 数据
const loading = ref(false);
const dataLoading = ref(false);
const buckets = ref([
  { name: "monitor_metrics", retention: "30d", series: 1250, description: "监控指标数据" },
  { name: "system_metrics", retention: "7d", series: 860, description: "系统指标数据" },
  { name: "business_events", retention: "90d", series: 3200, description: "业务事件数据" },
]);
const measurements = ref(["cpu", "memory", "disk", "network", "process"]);
const recentData = ref<Record<string, unknown>[]>([]);

// 列定义
const bucketColumns = [
  { prop: "name", label: "存储桶名称", minWidth: 180 },
  { prop: "retention", label: "保留策略", width: 120 },
  { prop: "series", label: "序列数", width: 100 },
  { prop: "description", label: "描述", minWidth: 200 },
];
const dataColumns = [
  { prop: "_time", label: "时间", width: 180 },
  { prop: "_measurement", label: "测量", width: 120 },
  { prop: "_field", label: "字段", width: 120 },
  { prop: "_value", label: "值", width: 100 },
  { prop: "host", label: "主机", width: 140 },
];

// 查询
const queryVisible = ref(false);
const fluxQuery = ref('from(bucket: "monitor_metrics")\n  |> range(start: -1h)\n  |> filter(fn: (r) => r._measurement == "cpu")');
const queryResult = reactive({ columns: [] as string[], rows: [] as Record<string, unknown>[] });

function toggleNode(key: string) {
  if (expandedNodes.value.has(key)) {
    expandedNodes.value.delete(key);
  } else {
    expandedNodes.value.add(key);
  }
}

function selectBucket(name: string) {
  activeBucket.value = name;
  loadBucketData();
}

function selectMeasurement(name: string) {
  fluxQuery.value = `from(bucket: "${activeBucket.value || 'monitor_metrics'}")\n  |> range(start: -1h)\n  |> filter(fn: (r) => r._measurement == "${name}")`;
  queryVisible.value = true;
}

function refresh() {
  loading.value = true;
  setTimeout(() => {
    loading.value = false;
  }, 500);
}

function loadBucketData() {
  dataLoading.value = true;
  setTimeout(() => {
    recentData.value = [
      { _time: "2024-01-15T10:30:00Z", _measurement: "cpu", _field: "usage", _value: 45.2, host: "web-01" },
      { _time: "2024-01-15T10:30:10Z", _measurement: "cpu", _field: "usage", _value: 48.1, host: "web-01" },
      { _time: "2024-01-15T10:30:20Z", _measurement: "cpu", _field: "usage", _value: 52.3, host: "web-01" },
    ];
    dataLoading.value = false;
  }, 300);
}

function openQuery() {
  queryVisible.value = true;
}

function executeQuery() {
  queryResult.columns = ["_time", "_measurement", "_field", "_value", "host"];
  queryResult.rows = [
    { _time: "2024-01-15T10:00:00Z", _measurement: "cpu", _field: "usage", _value: 42.1, host: "web-01" },
    { _time: "2024-01-15T10:05:00Z", _measurement: "cpu", _field: "usage", _value: 45.8, host: "web-01" },
    { _time: "2024-01-15T10:10:00Z", _measurement: "cpu", _field: "usage", _value: 51.2, host: "web-01" },
  ];
}

onMounted(() => {
  if (buckets.value.length > 0) {
    activeBucket.value = buckets.value[0].name;
    loadBucketData();
  }
});
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
</style>
