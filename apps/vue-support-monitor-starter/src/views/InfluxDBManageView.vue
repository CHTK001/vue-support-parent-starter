<template>
  <div class="dsm tel-page">
    <!-- 顶部工具栏 -->
    <div class="dsm-toolbar">
      <div class="dsm-toolbar-left">
        <ReIcon name="DataAnalysis" :size="18" class="dsm-title-icon" />
        <span class="dsm-title">InfluxDB 时序数据库管理</span>
      </div>
      <div class="dsm-toolbar-right">
        <ReButton :disabled="!source" @click="testConnection">
          <template #icon><ReIcon name="Connection" /></template>测试连接
        </ReButton>
        <ReButton @click="refresh">
          <template #icon><ReIcon name="Refresh" /></template>刷新
        </ReButton>
        <ReButton type="primary" @click="openQuery">
          <template #icon><ReIcon name="Search" /></template>Flux 查询
        </ReButton>
        <ReButton type="primary" :disabled="!source" :loading="bucketSaving" @click="openCreateBucket">
          <template #icon><ReIcon name="Plus" /></template>新建 Bucket
        </ReButton>
        <ReButton :disabled="!source" :loading="writeSaving" @click="openWritePoint">
          <template #icon><ReIcon name="EditPen" /></template>写入数据
        </ReButton>
      </div>
    </div>

    <MiddlewareGap :text="gap" @retry="refresh" />

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
              <span class="dsm-tree-count">{{ measurements.length }}</span>
            </div>
            <div v-if="expandedNodes.has('measurements')" class="dsm-tree-children">
              <div
                v-for="m in measurements"
                :key="m.name"
                class="dsm-tree-node dsm-leaf-node"
                @click="selectMeasurement(m.name)"
              >
                <ReIcon name="DataLine" size="14" class="dsm-tree-icon" />
                <span class="dsm-tree-label">{{ m.name }}</span>
              </div>
              <div v-if="measurements.length === 0" class="dsm-tree-node dsm-leaf-node">
                <span class="dsm-tree-label">暂无测量</span>
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
            <span class="dsm-info-label">数据源</span>
            <span class="dsm-info-value">{{ source ? source.name : "未选择" }}</span>
          </div>
          <div class="dsm-info-row">
            <span class="dsm-info-label">连接地址</span>
            <span class="dsm-info-value mono">{{ source ? `${source.host}:${source.port || 8086}` : "—" }}</span>
          </div>
          <div class="dsm-info-row">
            <span class="dsm-info-label">组织 (Org)</span>
            <span class="dsm-info-value mono">{{ orgInfo.orgName || source?.username || "自动探测" }}</span>
          </div>
          <div class="dsm-info-row">
            <span class="dsm-info-label">Org ID</span>
            <span class="dsm-info-value mono">{{ orgInfo.orgId || "—" }}</span>
          </div>
          <div class="dsm-info-row">
            <span class="dsm-info-label">状态</span>
            <div class="dsm-info-status">
              <ReTag :type="gap ? 'danger' : 'success'" >{{ gap ? "读取失败" : "正常" }}</ReTag>
              <span class="dsm-info-sub">服务版本 {{ influxVersion || "未探测" }}</span>
            </div>
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
          >
            <template #action="{ row }">
              <div class="dsm-row-ops">
                <ReButton icon="EditPen" layout="square" title="编辑保留期" @click="openEditRetention(row)" />
                <ReButton icon="Delete" layout="square" type="danger" title="删除" @click="confirmDeleteBucket(row)" />
              </div>
            </template>
          </ReTable>
        </div>

        <!-- 测量列表 -->
        <div class="dsm-section" v-if="activeBucket">
          <div class="dsm-section-title">
            {{ activeBucket }} - 测量列表
            <ReButton text @click="loadMeasurements">
              <template #icon><ReIcon name="Refresh" size="12" /></template>刷新
            </ReButton>
            <span class="dsm-section-hint">点击行按该度量生成 Flux 查询</span>
          </div>
          <ReTable
            :data="measurements"
            :columns="measurementColumns"
            :loading="loading"
            stripe
            border
            height="220px"
            @row-click="onMeasurementRowClick"
          />
        </div>

        <!-- 最近数据 -->
        <div class="dsm-section" v-if="activeBucket">
          <div class="dsm-section-title">
            {{ activeBucket }} - 最近数据
            <ReButton text @click="loadBucketData">
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
          <p>{{ gap ? "未读取到真实存储桶" : "暂无存储桶，点击「刷新」重新加载" }}</p>
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
          <div class="dsm-query-header">
            查询结果
            <span v-if="queryResult.rows.length > 0" class="dsm-query-meta">
              {{ queryResult.rows.length }} 行 · {{ queryElapsed }} ms
              <span v-if="queryTruncated" class="dsm-query-warn">已截断，服务端共 {{ queryTotalRows }} 行，请加 limit 或收窄时间窗</span>
            </span>
          </div>
          <ReTable
            v-if="queryResult.columns.length > 0"
            :data="queryResult.rows"
            :columns="queryResult.columns"
            stripe
            border
            height="200px"
          />
          <ReEmpty v-else description="执行查询后显示结果" />
        </div>
      </div>
      <template #footer>
        <ReButton @click="queryVisible = false">取消</ReButton>
        <ReButton type="primary" :loading="queryExecuting" @click="executeQuery">
          <template #icon><ReIcon name="VideoPlay" /></template>执行查询
        </ReButton>
      </template>
    </ReDialog>

    <!-- 新建 / 编辑 Bucket 弹窗 -->
    <ReDialog v-model="bucketDialogVisible" :title="bucketForm.id ? '编辑保留期' : '新建 Bucket'" width="460px">
      <ReForm label-width="110px">
        <ReFormItem label="Bucket 名称" required>
          <ReInput v-model="bucketForm.name" :disabled="!!bucketForm.id" placeholder="如 telemetry" />
        </ReFormItem>
        <ReFormItem label="保留时长(小时)">
          <ReInputNumber v-model="bucketForm.retentionHours" :min="0" :step="24" placeholder="0 = 永久保留" />
          <span class="dsm-form-hint">0 表示永久保留</span>
        </ReFormItem>
        <ReFormItem v-if="!bucketForm.id" label="描述">
          <ReInput v-model="bucketForm.description" type="textarea" :rows="2" placeholder="可选" />
        </ReFormItem>
      </ReForm>
      <template #footer>
        <ReButton @click="bucketDialogVisible = false">取消</ReButton>
        <ReButton type="primary" :loading="bucketSaving" @click="submitBucket">
          <template #icon><ReIcon name="Check" /></template>确定
        </ReButton>
      </template>
    </ReDialog>

    <!-- 数据浏览弹窗 -->
    <ReDialog v-model="browserVisible" :title="`数据浏览 · ${browserMeasurement}`" width="860px">
      <div class="dsm-browser-bar">
        <ReSelect v-model="browserRange" style="width: 130px" @change="runBrowserQuery">
          <ReOption label="最近 1 小时" value="-1h" />
          <ReOption label="最近 6 小时" value="-6h" />
          <ReOption label="最近 24 小时" value="-24h" />
          <ReOption label="最近 7 天" value="-7d" />
        </ReSelect>
        <ReSelect v-model="browserField" clearable placeholder="按 field 过滤" style="width: 160px" @change="runBrowserQuery">
          <ReOption v-for="f in browserFields" :key="f" :label="f" :value="f" />
        </ReSelect>
        <span class="dsm-browser-meta">{{ browserRows.length }} 行</span>
        <ReButton text @click="runBrowserQuery">
          <template #icon><ReIcon name="Refresh" size="12" /></template>刷新
        </ReButton>
      </div>
      <ReTable
        :data="browserRows"
        :columns="browserColumns"
        :loading="browserLoading"
        stripe
        border
        height="360px"
      />
      <template #footer>
        <ReButton @click="browserVisible = false">关闭</ReButton>
      </template>
    </ReDialog>

    <!-- 写入数据弹窗 -->
    <ReDialog v-model="writeVisible" title="写入数据点" width="560px">
      <ReForm label-width="110px">
        <ReFormItem label="Bucket" required>
          <ReInput v-model="writeForm.bucket" :disabled="!!activeBucket" placeholder="Bucket 名" />
        </ReFormItem>
        <ReFormItem label="Measurement" required>
          <ReInput v-model="writeForm.measurement" placeholder="如 cpu" />
        </ReFormItem>
        <ReFormItem label="Tags">
          <ReInput v-model="writeForm.tags" type="textarea" :rows="2" placeholder="key=value 每行一个，如：&#10;host=server01&#10;region=cn" />
        </ReFormItem>
        <ReFormItem label="Fields" required>
          <ReInput v-model="writeForm.fields" type="textarea" :rows="3" placeholder="key=value 每行一个，值自动识别数字/字符串，如：&#10;usage=82.5&#10;unit=percent" />
        </ReFormItem>
        <ReFormItem label="时间戳">
          <ReInput v-model="writeForm.timestamp" placeholder="留空 = 当前时间" />
        </ReFormItem>
      </ReForm>
      <template #footer>
        <ReButton @click="writeVisible = false">取消</ReButton>
        <ReButton type="primary" :loading="writeSaving" @click="submitWrite">
          <template #icon><ReIcon name="Check" /></template>写入
        </ReButton>
      </template>
    </ReDialog>
  </div>
</template>

<script setup lang="ts">
/**
 * InfluxDB 管理页
 *
 * <p>基于「数据源管理」登记的 influxdb 数据源，通过 /ms/monitor/influxdb/** 读取真实 Bucket、
 * 度量与 Flux 查询结果；接口缺失或连接失败时只展示失败原因，不回落任何演示数据。</p>
 * @author CH
 * @since 4.0.0
 */
import { computed, onMounted, ref, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import MiddlewareGap from "../components/MiddlewareGap.vue";
import { useMiddlewareSource } from "../utils/middlewareSource";
import { extraText } from "../utils/externalDatasource";
import {
  executeInfluxdbQuery,
  fetchInfluxdbBuckets,
  fetchInfluxdbMeasurements,
  testInfluxdbConnection,
  type InfluxdbBucket,
  type InfluxdbMeasurement,
} from "../monitorApi";
import {
  createInfluxdbBucket,
  deleteInfluxdbBucket,
  fetchInfluxdbOrg,
  updateInfluxdbBucketRetention,
  writeInfluxdbPoints,
  type InfluxdbOrg,
} from "../influxdbNginxApi";

/** ReTable 列定义 */
type Column = { prop: string; label: string; width?: number; minWidth?: number; slot?: string; fixed?: string; align?: string };

const { datasourceId, source, gap, bind, fail, ready } = useMiddlewareSource();

/** 侧栏根节点名称：真实数据源名 */
const connectionName = computed(() => (source.value ? source.value.name : "InfluxDB 时序数据库"));

// 树状态
const expandedNodes = ref(new Set(["root", "buckets", "measurements"]));
const activeBucket = ref("");

// 数据
const loading = ref(false);
const dataLoading = ref(false);
const testing = ref(false);
const influxVersion = ref("");
const buckets = ref<InfluxdbBucket[]>([]);
const measurements = ref<InfluxdbMeasurement[]>([]);

/**
 * 连接信息（地址/端口/组织/版本）。
 *
 * <p>由 {@code applyConnectionInfo()} 写入。当前模板不直接读取它，
 * 但保留写入行为以便后续展示，故此处补上声明（此前迁移遗漏导致引用悬空）。</p>
 */
const connectionInfo = { host: "-", port: 0, organization: "-", version: "-" };

/** 连通状态。同上：脚本内写入，模板暂未读取，保留写入行为 */
const connected = ref(false);
const recentData = ref<Record<string, unknown>[]>([]);

/**
 * 由返回行的键推导表格列，避免写死后端字段
 * @param rows 查询返回的行
 * @returns 表格列定义
 */
function toColumns(rows: Record<string, unknown>[]): Column[] {
  return (rows.length > 0 ? Object.keys(rows[0]) : []).map(key => ({ prop: key, label: key, minWidth: 140 }));
}

// 列定义
const bucketColumns: Column[] = [
  { prop: "name", label: "存储桶名称", minWidth: 180 },
  { prop: "retentionHours", label: "保留时长(h)", width: 120 },
  { prop: "createdAt", label: "创建时间", minWidth: 170 },
  { prop: "action", label: "操作", width: 130, slot: "action", fixed: "right", align: "center" },
];
const measurementColumns: Column[] = [
  { prop: "name", label: "度量名称", minWidth: 160 },
  { prop: "fieldCount", label: "字段数", width: 90 },
  { prop: "tagCount", label: "标签数", width: 90 },
  { prop: "lastWriteTime", label: "最后写入", minWidth: 170 },
];
const dataColumns = computed<Column[]>(() => toColumns(recentData.value));

// Flux 查询
const queryVisible = ref(false);
const queryExecuting = ref(false);
const queryElapsed = ref(0);
const queryTruncated = ref(false);
const queryTotalRows = ref(0);
const fluxQuery = ref("");
const queryResult = ref<{ columns: Column[]; rows: Record<string, unknown>[] }>({ columns: [], rows: [] });

// Org 信息
const orgInfo = ref<InfluxdbOrg>({ orgId: "", orgName: "" });

// Bucket 新建/编辑
const bucketDialogVisible = ref(false);
const bucketSaving = ref(false);
const bucketForm = ref<{ id: string; name: string; retentionHours: number; description: string }>({
  id: "",
  name: "",
  retentionHours: 0,
  description: "",
});

// 数据浏览
const browserVisible = ref(false);
const browserLoading = ref(false);
const browserMeasurement = ref("");
const browserRange = ref("-1h");
const browserField = ref("");
const browserFields = ref<string[]>([]);
const browserRows = ref<Record<string, unknown>[]>([]);
const browserColumns = ref<Column[]>([]);

// 写入数据点
const writeVisible = ref(false);
const writeSaving = ref(false);
const writeForm = ref({
  bucket: "",
  measurement: "",
  tags: "",
  fields: "",
  timestamp: "",
});

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
  const info = source.value;
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
 * 选中 Bucket 后加载度量与最近数据
 * @param name Bucket 名
 */
function selectBucket(name: string) {
  activeBucket.value = name;
  loadMeasurements();
  loadBucketData();
}

/**
 * 选中度量，生成对应的 Flux 查询
 * @param name 度量名
 */
function selectMeasurement(name: string) {
  fluxQuery.value =
    `from(bucket: "${activeBucket.value}")\n  |> range(start: -1h)\n` +
    `  |> filter(fn: (r) => r._measurement == "${name}")\n  |> limit(n: 50)`;
  queryVisible.value = true;
}

/**
 * 加载当前 Bucket 下的度量列表
 */
async function loadMeasurements() {
  try {
    measurements.value = (await fetchInfluxdbMeasurements(datasourceId.value, activeBucket.value)) || [];
    ready();
  } catch (e) {
    measurements.value = [];
    fail(e, "/ms/monitor/influxdb/measurements");
  }
}

/**
 * 点击度量行打开数据浏览弹窗（时间范围 + 表格 + field 过滤）
 * @param row 度量行
 */
function onMeasurementRowClick(row: Record<string, unknown>) {
  const name = String(row?.name ?? "");
  if (name) {
    openBrowser(name);
  }
}

/**
 * 探测当前数据源的 InfluxDB 连通性并显示版本
 */
async function testConnection() {
  testing.value = true;
  try {
    const result = await testInfluxdbConnection({ datasourceId: datasourceId.value });
    if (result?.connected) {
      influxVersion.value = result.version || "";
      ready();
      ElMessage.success(result.version ? `连接成功 · InfluxDB ${result.version}` : "连接成功");
    } else {
      ElMessage.error(result?.message || "连接失败");
    }
  } catch (e) {
    fail(e, "/ms/monitor/influxdb/test");
  } finally {
    testing.value = false;
  }
}

/**
 * 刷新 Bucket 列表，并在已选中 Bucket 时级联刷新度量
 */
async function refresh() {
  if (!source.value) {
    await bind("influxdb");
    if (!source.value) return;
  }
  loading.value = true;
  try {
    buckets.value = (await fetchInfluxdbBuckets(datasourceId.value)) || [];
    ready();
    await loadOrg();
    if (buckets.value.length > 0 && !buckets.value.some(b => b.name === activeBucket.value)) {
      selectBucket(buckets.value[0].name);
    }
  } catch (e) {
    buckets.value = [];
    fail(e, "/ms/monitor/influxdb/buckets");
  } finally {
    loading.value = false;
  }
}

/**
 * 用 Flux 查询读取当前 Bucket 的最近数据
 */
async function loadBucketData() {
  if (!activeBucket.value) {
    recentData.value = [];
    return;
  }
  dataLoading.value = true;
  try {
    const rows = await runFlux(
      `from(bucket: "${activeBucket.value}")\n  |> range(start: -1h)\n  |> limit(n: 50)`
    );
    recentData.value = rows;
    ready();
  } catch (e) {
    recentData.value = [];
    fail(e, "/ms/monitor/influxdb/query");
  } finally {
    dataLoading.value = false;
  }
}

/**
 * 把行内嵌套结构转成 JSON 文本，避免表格里显示成 [object Object]
 * @param rows 查询返回的行
 * @returns 可直读的行
 */
function displayRows(rows: Record<string, unknown>[]): Record<string, unknown>[] {
  return rows.map(row => {
    const flat: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(row)) {
      flat[key] = value !== null && typeof value === "object" ? JSON.stringify(value) : value;
    }
    return flat;
  });
}

/**
 * 执行 Flux 查询并返回行数据
 * @param flux Flux 语句
 * @returns 行数据
 */
async function runFlux(flux: string): Promise<Record<string, unknown>[]> {
  const result = await executeInfluxdbQuery(flux, datasourceId.value);
  queryElapsed.value = result?.executionTimeMs ?? 0;
  queryTruncated.value = !!result?.truncated;
  queryTotalRows.value = result?.totalRows ?? (result?.rows?.length || 0);
  return displayRows(result?.rows || []);
}

/**
 * 打开 Flux 查询面板，未编辑过语句时按当前 Bucket 预填
 */
function openQuery() {
  if (!fluxQuery.value && activeBucket.value) {
    fluxQuery.value = `from(bucket: "${activeBucket.value}")\n  |> range(start: -1h)\n  |> limit(n: 50)`;
  }
  queryVisible.value = true;
}

/**
 * 执行面板里的 Flux 查询
 */
async function executeQuery() {
  if (!fluxQuery.value.trim()) {
    ElMessage.warning("请输入 Flux 查询语句");
    return;
  }
  queryExecuting.value = true;
  try {
    const rows = await runFlux(fluxQuery.value);
    queryResult.value = { columns: toColumns(rows), rows };
    ready();
  } catch (e) {
    queryResult.value = { columns: [], rows: [] };
    fail(e, "/ms/monitor/influxdb/query");
  } finally {
    queryExecuting.value = false;
  }
}

/**
 * 加载当前数据源 Org 信息
 */
async function loadOrg() {
  if (!datasourceId.value) return;
  try {
    orgInfo.value = (await fetchInfluxdbOrg(datasourceId.value)) || { orgId: "", orgName: "" };
  } catch {
    // Org 信息读取失败不阻断主流程
  }
}

/**
 * 打开新建 Bucket 弹窗
 */
function openCreateBucket() {
  bucketForm.value = { id: "", name: "", retentionHours: 0, description: "" };
  bucketDialogVisible.value = true;
}

/**
 * 打开编辑保留期弹窗
 * @param row Bucket 行
 */
function openEditRetention(row: InfluxdbBucket) {
  bucketForm.value = {
    id: row.id,
    name: row.name,
    retentionHours: row.retentionHours ?? 0,
    description: "",
  };
  bucketDialogVisible.value = true;
}

/**
 * 提交新建或编辑保留期
 */
async function submitBucket() {
  if (!bucketForm.value.name.trim()) {
    ElMessage.warning("请输入 Bucket 名称");
    return;
  }
  bucketSaving.value = true;
  try {
    if (bucketForm.value.id) {
      await updateInfluxdbBucketRetention(bucketForm.value.id, bucketForm.value.retentionHours, datasourceId.value);
      ElMessage.success("保留期已更新");
    } else {
      await createInfluxdbBucket({
        datasourceId: datasourceId.value,
        name: bucketForm.value.name.trim(),
        retentionHours: bucketForm.value.retentionHours,
        description: bucketForm.value.description,
      });
      ElMessage.success("Bucket 创建成功");
    }
    bucketDialogVisible.value = false;
    await refresh();
  } catch (e) {
    fail(e, "/ms/monitor/influxdb/bucket");
  } finally {
    bucketSaving.value = false;
  }
}

/**
 * 删除 Bucket（二次确认）
 * @param row Bucket 行
 */
async function confirmDeleteBucket(row: InfluxdbBucket) {
  try {
    await ElMessageBox.confirm(
      `确认删除 Bucket「${row.name}」？该操作会删除桶内全部数据，不可恢复。`,
      "删除确认",
      { type: "warning", confirmButtonText: "删除", cancelButtonText: "取消" }
    );
  } catch {
    return;
  }
  try {
    await deleteInfluxdbBucket(row.id, datasourceId.value);
    ElMessage.success("Bucket 已删除");
    if (activeBucket.value === row.name) activeBucket.value = "";
    await refresh();
  } catch (e) {
    fail(e, "/ms/monitor/influxdb/bucket");
  }
}

/**
 * 打开数据浏览弹窗
 * @param measurement 度量名
 */
function openBrowser(measurement: string) {
  browserMeasurement.value = measurement;
  browserRange.value = "-1h";
  browserField.value = "";
  browserFields.value = [];
  browserRows.value = [];
  browserColumns.value = [];
  browserVisible.value = true;
  runBrowserQuery();
}

/**
 * 执行数据浏览 Flux 查询
 */
async function runBrowserQuery() {
  if (!activeBucket.value || !browserMeasurement.value) return;
  browserLoading.value = true;
  try {
    let flux = `from(bucket: "${activeBucket.value}")\n  |> range(start: ${browserRange.value})\n`
      + `  |> filter(fn: (r) => r._measurement == "${browserMeasurement.value}")`;
    if (browserField.value) {
      flux += `\n  |> filter(fn: (r) => r._field == "${browserField.value}")`;
    }
    flux += `\n  |> limit(n: 500)`;
    const result = await executeInfluxdbQuery(flux, datasourceId.value);
    const rows = displayRows(result?.rows || []);
    browserRows.value = rows;
    browserColumns.value = toColumns(rows);
    // 收集 field 选项
    const fields = new Set<string>();
    for (const row of rows) {
      const f = row._field;
      if (f != null) fields.add(String(f));
    }
    browserFields.value = [...fields];
    ready();
  } catch (e) {
    browserRows.value = [];
    browserColumns.value = [];
    fail(e, "/ms/monitor/influxdb/query");
  } finally {
    browserLoading.value = false;
  }
}

/**
 * 打开写入数据点弹窗
 */
function openWritePoint() {
  writeForm.value = {
    bucket: activeBucket.value,
    measurement: browserMeasurement.value || "",
    tags: "",
    fields: "",
    timestamp: "",
  };
  writeVisible.value = true;
}

/**
 * 把多行 key=value 文本解析成有序字符串
 * @param text 多行文本
 * @param escapeValue 是否对值做 line protocol 转义
 * @returns 拼接好的 key=value 段
 */
function parseKv(text: string, escapeValue: boolean): string {
  const parts: string[] = [];
  for (const line of (text || "").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || !trimmed.includes("=")) continue;
    const idx = trimmed.indexOf("=");
    const k = trimmed.slice(0, idx).trim();
    let v = trimmed.slice(idx + 1).trim();
    if (!k) continue;
    // 去掉值两侧引号
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    // line protocol 中 tag key/value 和 field key 不能有逗号空格
    const safeKey = k.replace(/,/g, "\\,").replace(/ /g, "\\ ");
    if (escapeValue) {
      // field 值：数字直接写，字符串加引号
      if (/^-?\d+(\.\d+)?$/.test(v)) {
        parts.push(`${safeKey}=${v}`);
      } else {
        parts.push(`${safeKey}="${v.replace(/"/g, '\\"')}"`);
      }
    } else {
      parts.push(`${safeKey}=${v.replace(/,/g, "\\,").replace(/ /g, "\\ ")}`);
    }
  }
  return parts.join(",");
}

/**
 * 提交写入数据点
 */
async function submitWrite() {
  if (!writeForm.value.bucket.trim()) {
    ElMessage.warning("请选择 Bucket");
    return;
  }
  if (!writeForm.value.measurement.trim()) {
    ElMessage.warning("请输入 Measurement");
    return;
  }
  if (!writeForm.value.fields.trim()) {
    ElMessage.warning("请至少填写一个 Field");
    return;
  }
  // measurement 转义
  const measurement = writeForm.value.measurement.trim().replace(/,/g, "\\,").replace(/ /g, "\\ ");
  const tags = parseKv(writeForm.value.tags, false);
  const fields = parseKv(writeForm.value.fields, true);
  if (!fields) {
    ElMessage.warning("Field 格式无效，应为 key=value");
    return;
  }
  let line = measurement;
  if (tags) line += "," + tags;
  line += " " + fields;
  if (writeForm.value.timestamp.trim()) {
    line += " " + writeForm.value.timestamp.trim();
  }
  writeSaving.value = true;
  try {
    await writeInfluxdbPoints({
      datasourceId: datasourceId.value,
      bucket: writeForm.value.bucket.trim(),
      precision: "ns",
      lines: line,
    });
    ElMessage.success("写入成功");
    writeVisible.value = false;
    if (activeBucket.value) await loadBucketData();
  } catch (e) {
    fail(e, "/ms/monitor/influxdb/write");
  } finally {
    writeSaving.value = false;
  }
}

onMounted(async () => {
  await bind("influxdb");
  if (source.value) {
    await refresh();
  }
});

// 数据源变化（含首次进入）时整体刷新
watch(
  [datasourceId, gap],
  async ([id, err]) => {
    applyConnectionInfo();
    if (!id) {
      buckets.value = [];
      measurements.value = [];
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
watch(source, applyConnectionInfo);
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

.dsm-info-status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dsm-info-sub {
  font-size: 12px;
  color: var(--text-tertiary);
}

.dsm-section-hint {
  font-size: 12px;
  font-weight: 400;
  color: var(--text-tertiary);
}

.dsm-query-warn {
  margin-left: 8px;
  color: var(--el-color-warning, #e6a23c);
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
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  background: var(--bg-fill);
  border-bottom: 1px solid var(--border-subtle);
}

.dsm-query-meta {
  font-size: 12px;
  font-weight: 400;
  color: var(--text-tertiary);
}

.dsm-row-ops {
  display: flex;
  gap: 4px;
  justify-content: center;
}

.dsm-form-hint {
  margin-left: 8px;
  font-size: 12px;
  color: var(--text-tertiary);
}

.dsm-browser-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.dsm-browser-meta {
  font-size: 12px;
  color: var(--text-tertiary);
}
</style>
