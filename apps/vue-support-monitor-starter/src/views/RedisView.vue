<script setup lang="ts">
/**
 * Redis 监控 + KV 管理
 * - 顶部：KPI 卡片 + 实时趋势图表（echarts，图表优先于表格）
 * - 下方：KV 管理（左侧 key 列表，右侧 value 显示/编辑，支持增删改查）
 * 数据来源：
 *   - INFO 指标：GET /ms/monitor/system/redis-info
 *   - KV 操作：/ms/monitor/system/redis/keys、/kv/{key}、/kv/{key}/detail 等
 * @author CH
 * @since 4.0.0
 */
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import * as echarts from "echarts";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  fetchSystemRedisInfo,
  scanSystemRedisKeys,
  getSystemRedisKeyDetail,
  setSystemRedisKey,
  deleteSystemRedisKeys,
  expireSystemRedisKey,
  type SystemRedisInfo,
  type RedisKeyDetail,
} from "../monitorApi";

const info = ref<SystemRedisInfo | null>(null);
const loading = ref(false);
const failed = ref(false);

/** 连接状态 */
const available = computed(() => !!(info.value && Object.keys(info.value).length > 0));

// ==================== KPI 卡片 ====================
const CHANNEL = [
  { key: "connected_clients", label: "连接数", icon: "Link", ic: "var(--metric-cpu)" },
  { key: "used_memory", label: "内存", icon: "Coin", ic: "var(--metric-mem)" },
  { key: "hit_rate", label: "命中率%", icon: "Aim", ic: "var(--metric-jvm)" },
  { key: "instantaneous_ops_per_sec", label: "QPS", icon: "Lightning", ic: "var(--metric-net)" },
];

const memValue = (v?: number): string => {
  if (v == null) return "—";
  if (v >= 1073741824) return `${(v / 1073741824).toFixed(1)}G`;
  if (v >= 1048576) return `${(v / 1048576).toFixed(1)}M`;
  return `${v}B`;
};

const hitRate = (): string => {
  const hits = Number(info.value?.keyspace_hits ?? 0);
  const misses = Number(info.value?.keyspace_misses ?? 0);
  if (hits + misses <= 0) return "—";
  return `${((hits * 100) / (hits + misses)).toFixed(1)}%`;
};

const num = (k: string, v?: number): string => {
  if (v == null) return "—";
  if (k === "used_memory" || k.includes("memory")) return memValue(v);
  return v.toLocaleString();
};

// ==================== 实时趋势图表（echarts，图表优先于表格） ====================
const chartRef = ref<HTMLDivElement | null>(null);
let chartInstance: echarts.ECharts | null = null;
const MAX_POINTS = 60; // 图表最多保留 60 个数据点（FIFO）
const historyData = ref<{ time: string; qps: number; clients: number; mem: number }[]>([]);
let refreshTimer: ReturnType<typeof setInterval> | null = null;

const initChart = () => {
  if (!chartRef.value) return;
  chartInstance = echarts.init(chartRef.value, undefined, { renderer: "canvas" });
  updateChart();
  window.addEventListener("resize", handleResize);
};

const handleResize = () => {
  chartInstance?.resize();
};

const updateChart = () => {
  if (!chartInstance) return;
  const times = historyData.value.map(d => d.time);
  const qpsData = historyData.value.map(d => d.qps);
  const clientsData = historyData.value.map(d => d.clients);
  const memData = historyData.value.map(d => d.mem);

  chartInstance.setOption({
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis",
      backgroundColor: "rgba(15, 23, 47, 0.95)",
      borderColor: "rgba(148, 163, 184, 0.2)",
      textStyle: { color: "#e2e8f0", fontSize: 12 },
    },
    legend: {
      data: ["QPS", "连接数", "内存(MB)"],
      textStyle: { color: "#94a3b8", fontSize: 12 },
      top: 0,
    },
    grid: { left: "3%", right: "4%", bottom: "3%", top: "15%", containLabel: true },
    xAxis: {
      type: "category",
      data: times,
      axisLine: { lineStyle: { color: "rgba(148, 163, 184, 0.2)" } },
      axisLabel: { color: "#64748b", fontSize: 11 },
    },
    yAxis: [
      {
        type: "value",
        name: "QPS/连接",
        axisLine: { show: false },
        axisLabel: { color: "#64748b", fontSize: 11 },
        splitLine: { lineStyle: { color: "rgba(148, 163, 184, 0.08)" } },
      },
      {
        type: "value",
        name: "内存(MB)",
        axisLine: { show: false },
        axisLabel: { color: "#64748b", fontSize: 11 },
        splitLine: { show: false },
      },
    ],
    series: [
      {
        name: "QPS",
        type: "line",
        smooth: true,
        data: qpsData,
        lineStyle: { color: "#38bdf8", width: 2 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: "rgba(56, 189, 248, 0.25)" },
            { offset: 1, color: "rgba(56, 189, 248, 0)" },
          ]),
        },
        symbol: "none",
      },
      {
        name: "连接数",
        type: "line",
        smooth: true,
        data: clientsData,
        lineStyle: { color: "#a78bfa", width: 2 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: "rgba(167, 139, 250, 0.2)" },
            { offset: 1, color: "rgba(167, 139, 250, 0)" },
          ]),
        },
        symbol: "none",
      },
      {
        name: "内存(MB)",
        type: "line",
        smooth: true,
        yAxisIndex: 1,
        data: memData,
        lineStyle: { color: "#34d399", width: 2 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: "rgba(52, 211, 153, 0.2)" },
            { offset: 1, color: "rgba(52, 211, 153, 0)" },
          ]),
        },
        symbol: "none",
      },
    ],
  });
};

const pushHistoryPoint = () => {
  if (!info.value) return;
  const now = new Date();
  const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
  historyData.value.push({
    time,
    qps: Number(info.value.instantaneous_ops_per_sec ?? 0),
    clients: Number(info.value.connected_clients ?? 0),
    mem: Number(info.value.used_memory ?? 0) / 1048576,
  });
  // FIFO：超过 MAX_POINTS 则移除最旧的数据
  if (historyData.value.length > MAX_POINTS) {
    historyData.value = historyData.value.slice(-MAX_POINTS);
  }
  updateChart();
};

// ==================== KV 管理 ====================
const kvTab = ref<"monitor" | "kv">("monitor"); // monitor=监控图表, kv=KV管理
const keys = ref<string[]>([]);
const keysLoading = ref(false);
const searchPattern = ref("*");
const selectedKey = ref<string | null>(null);
const keyDetail = ref<RedisKeyDetail | null>(null);
const detailLoading = ref(false);
const editValue = ref("");
const editTtl = ref(-1);
const saving = ref(false);
const newKeyDialog = ref(false);
const newKeyName = ref("");
const newKeyValue = ref("");
const newKeyTtl = ref(-1);

// ==================== 批量操作 ====================
const selectedKeys = ref<Set<string>>(new Set());

const toggleKeySelection = (key: string) => {
  if (selectedKeys.value.has(key)) {
    selectedKeys.value.delete(key);
  } else {
    selectedKeys.value.add(key);
  }
};

const selectAllKeys = () => {
  if (selectedKeys.value.size === keys.value.length) {
    selectedKeys.value.clear();
  } else {
    selectedKeys.value = new Set(keys.value);
  }
};

const batchDeleteKeys = async () => {
  if (selectedKeys.value.size === 0) return;
  try {
    await ElMessageBox.confirm(`确定删除选中的 ${selectedKeys.value.size} 个 Key 吗？`, "批量删除确认", { type: "warning" });
  } catch {
    return;
  }
  try {
    await deleteSystemRedisKeys(Array.from(selectedKeys.value));
    ElMessage.success(`成功删除 ${selectedKeys.value.size} 个 Key`);
    selectedKeys.value.clear();
    await loadKeys();
  } catch (e) {
    ElMessage.error(`批量删除失败: ${String((e as Error)?.message ?? e)}`);
  }
};

// ==================== 多数据类型编辑 ====================
const listItems = ref<string[]>([]);
const newListItem = ref("");
const setItems = ref<string[]>([]);
const newSetItem = ref("");
const hashItems = ref<{ field: string; value: string }[]>([]);
const newHashField = ref("");
const newHashValue = ref("");
const zsetItems = ref<{ member: string; score: number }[]>([]);
const newZsetMember = ref("");
const newZsetScore = ref(0);

// ==================== Stream 类型 ====================
const streamMessages = ref<any[]>([]);
const streamDialogVisible = ref(false);
const newStreamId = ref("");
const newStreamBody = ref("{}");

const loadStreamMessages = () => {
  // Stream 消息已在 selectKey 中加载
  ElMessage.info("Stream 消息已刷新");
};

const addStreamMessage = () => {
  newStreamId.value = "";
  newStreamBody.value = "{}";
  streamDialogVisible.value = true;
};

const saveStreamMessage = () => {
  try {
    const body = JSON.parse(newStreamBody.value);
    streamMessages.value.unshift({
      id: newStreamId.value || `${Date.now()}-0`,
      body,
    });
    streamDialogVisible.value = false;
    ElMessage.success("消息添加成功");
  } catch {
    ElMessage.error("JSON 格式错误");
  }
};

const addListItem = () => {
  if (newListItem.value.trim()) {
    listItems.value.push(newListItem.value.trim());
    newListItem.value = "";
  }
};
const removeListItem = (idx: number) => listItems.value.splice(idx, 1);

const addSetItem = () => {
  if (newSetItem.value.trim()) {
    setItems.value.push(newSetItem.value.trim());
    newSetItem.value = "";
  }
};
const removeSetItem = (idx: number) => setItems.value.splice(idx, 1);

const addHashItem = () => {
  if (newHashField.value.trim()) {
    hashItems.value.push({ field: newHashField.value.trim(), value: newHashValue.value });
    newHashField.value = "";
    newHashValue.value = "";
  }
};
const removeHashItem = (idx: number) => hashItems.value.splice(idx, 1);

const addZsetItem = () => {
  if (newZsetMember.value.trim()) {
    zsetItems.value.push({ member: newZsetMember.value.trim(), score: newZsetScore.value });
    newZsetMember.value = "";
    newZsetScore.value = 0;
  }
};
const removeZsetItem = (idx: number) => zsetItems.value.splice(idx, 1);

/** 加载 key 列表 */
const loadKeys = async () => {
  keysLoading.value = true;
  try {
    const result = await scanSystemRedisKeys(searchPattern.value || "*", "0", 200);
    keys.value = result?.keys ?? [];
  } catch (e) {
    ElMessage.error(`加载 Keys 失败: ${String((e as Error)?.message ?? e)}`);
  } finally {
    keysLoading.value = false;
  }
};

/** 选中 key，加载详情 */
const selectKey = async (key: string) => {
  selectedKey.value = key;
  detailLoading.value = true;
  try {
    const detail = await getSystemRedisKeyDetail(key);
    keyDetail.value = detail;
    editValue.value = detail?.value ?? "";
    editTtl.value = detail?.ttl ?? -1;
    // 初始化多数据类型
    const type = detail?.type;
    if (type === "LIST") {
      listItems.value = Array.isArray(detail?.value) ? [...detail.value] : [];
    } else if (type === "SET") {
      setItems.value = Array.isArray(detail?.value) ? [...detail.value] : [];
    } else if (type === "HASH") {
      const hashVal = detail?.value;
      hashItems.value = hashVal && typeof hashVal === "object"
        ? Object.entries(hashVal).map(([field, value]) => ({ field, value: String(value) }))
        : [];
    } else if (type === "ZSET") {
      zsetItems.value = Array.isArray(detail?.value) ? detail.value.map((item: any) => ({ member: String(item.member), score: Number(item.score) })) : [];
    } else if (type === "STREAM") {
      streamMessages.value = Array.isArray(detail?.value) ? detail.value : [];
    }
  } catch (e) {
    ElMessage.error(`加载 Key 详情失败: ${String((e as Error)?.message ?? e)}`);
  } finally {
    detailLoading.value = false;
  }
};

/** 保存修改的 value */
const saveValue = async () => {
  if (!selectedKey.value) return;
  saving.value = true;
  try {
    await setSystemRedisKey(selectedKey.value, editValue.value, editTtl.value);
    ElMessage.success("保存成功");
    await selectKey(selectedKey.value);
  } catch (e) {
    ElMessage.error(`保存失败: ${String((e as Error)?.message ?? e)}`);
  } finally {
    saving.value = false;
  }
};

/** 删除选中的 key */
const deleteKey = async (key: string) => {
  try {
    await ElMessageBox.confirm(`确定删除 Key "${key}" 吗？`, "删除确认", { type: "warning" });
  } catch {
    return;
  }
  try {
    await deleteSystemRedisKeys([key]);
    ElMessage.success("删除成功");
    if (selectedKey.value === key) {
      selectedKey.value = null;
      keyDetail.value = null;
    }
    await loadKeys();
  } catch (e) {
    ElMessage.error(`删除失败: ${String((e as Error)?.message ?? e)}`);
  }
};

/** 新增 key */
const createKey = async () => {
  if (!newKeyName.value.trim()) {
    ElMessage.warning("请输入 Key 名称");
    return;
  }
  saving.value = true;
  try {
    await setSystemRedisKey(newKeyName.value.trim(), newKeyValue.value, newKeyTtl.value);
    ElMessage.success("创建成功");
    newKeyDialog.value = false;
    newKeyName.value = "";
    newKeyValue.value = "";
    newKeyTtl.value = -1;
    await loadKeys();
    await selectKey(newKeyName.value.trim());
  } catch (e) {
    ElMessage.error(`创建失败: ${String((e as Error)?.message ?? e)}`);
  } finally {
    saving.value = false;
  }
};

/** 设置过期时间 */
const setExpire = async () => {
  if (!selectedKey.value) return;
  try {
    await expireSystemRedisKey(selectedKey.value, editTtl.value);
    ElMessage.success("过期时间设置成功");
    await selectKey(selectedKey.value);
  } catch (e) {
    ElMessage.error(`设置失败: ${String((e as Error)?.message ?? e)}`);
  }
};

// ==================== 加载 INFO 指标 ====================
async function load(): Promise<void> {
  loading.value = true;
  failed.value = false;
  try {
    info.value = await fetchSystemRedisInfo();
    if (!info.value) failed.value = true;
    else pushHistoryPoint();
  } catch {
    failed.value = true;
    info.value = null;
  } finally {
    loading.value = false;
  }
}

/** 指标快照（排除非数值字段） */
const snapshotEntries = computed(() => {
  const src = info.value ?? {};
  return Object.entries(src)
    .filter(([k]) => !["os", "redis_version", "role", "config_file", "used_memory_human"].includes(k))
    .map(([k, v]) => ({ key: k, value: String(v ?? "") }));
});

const snapshotColumns = computed(() => [
  { prop: "key", label: "指标名", minWidth: 240, slot: "key" },
  { prop: "value", label: "值", slot: "value" },
]);

onMounted(() => {
  load();
  // 每 5 秒刷新一次 INFO 指标，更新图表
  refreshTimer = setInterval(load, 5000);
  // 延迟初始化图表（等待 DOM 渲染）
  setTimeout(initChart, 100);
});

onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer);
  window.removeEventListener("resize", handleResize);
  chartInstance?.dispose();
});

// 切换到 KV 管理 tab 时加载 keys
watch(kvTab, (val) => {
  if (val === "kv" && keys.value.length === 0) {
    loadKeys();
  }
});
</script>

<template>
  <div class="rd tel-page">
    <ReSectionHead :description="available ? '当前应用连接中的 Redis · INFO 实时指标 + KV 管理' : '当前系统未配置 Redis'" :loading="loading">
      <template #title>Redis 监控</template>
      <template #actions>
        <ReButton icon="RefreshRight" :show-text="true" size="small" :loading="loading" @click="load">刷新</ReButton>
      </template>
    </ReSectionHead>

    <ReEmpty v-if="failed || !available" description="当前系统未连接 Redis（或后端未就绪），无指标可展示" style="padding: 48px 0">
      <ReButton icon="RefreshRight" :show-text="true" size="small" :loading="loading" @click="load">刷新</ReButton>
    </ReEmpty>

    <template v-else>
      <!-- Tab 切换：监控图表 / KV 管理 -->
      <div class="tabs">
        <button class="tab-btn" :class="{ active: kvTab === 'monitor' }" @click="kvTab = 'monitor'">
          监控图表
        </button>
        <button class="tab-btn" :class="{ active: kvTab === 'kv' }" @click="kvTab = 'kv'">
          KV 管理
        </button>
      </div>

      <!-- ==================== 监控图表（图表优先于表格） ==================== -->
      <template v-if="kvTab === 'monitor'">
        <!-- KPI -->
        <section class="kpi-row cols-4">
          <ReStatCard
            v-for="c in CHANNEL"
            :key="c.key"
            :title="c.label"
            :icon="c.icon"
            :icon-color="c.ic"
            :value="c.key === 'hit_rate' ? hitRate() : num(c.key, Number((info as any)?.[c.key] ?? 0))"
          />
        </section>

        <!-- 实时趋势图表（echarts，图表优先于表格） -->
        <ReCard :radius="12" shadow="never" class="chart-card">
          <template #header>
            <span class="card-h">实时趋势（最近 {{ historyData.length }} 个数据点，每 5 秒刷新）</span>
          </template>
          <div ref="chartRef" class="redis-chart"></div>
        </ReCard>

        <!-- 指标快照（表格在图表之后） -->
        <ReCard :radius="12" shadow="never">
          <template #header><span class="card-h">指标快照</span></template>
          <ReTable :data="snapshotEntries" :columns="snapshotColumns" size="small" empty-text="暂无指标数据" table-id="monitor-redis">
            <template #col-key="{ row }"><span class="mono">{{ row.key }}</span></template>
            <template #col-value="{ row }"><span class="mono strong">{{ row.value }}</span></template>
          </ReTable>
        </ReCard>
      </template>

      <!-- ==================== KV 管理（左侧 key，右侧 value） ==================== -->
      <template v-else>
        <div class="kv-container">
          <!-- 左侧：key 列表 -->
          <div class="kv-left">
            <div class="kv-toolbar">
              <ReInput
                v-model="searchPattern"
                placeholder="搜索 pattern（如 *、user:*）"
                size="small"
                clearable
                @keyup.enter="loadKeys"
              />
              <ReButton icon="Search" size="small" @click="loadKeys">搜索</ReButton>
              <ReButton icon="Plus" type="primary" size="small" @click="newKeyDialog = true">新增</ReButton>
              <ReButton v-if="selectedKeys.size > 0" icon="Delete" type="danger" size="small" @click="batchDeleteKeys">
                批量删除({{ selectedKeys.size }})
              </ReButton>
            </div>
            <div class="kv-list" :class="{ loading: keysLoading }">
              <ReEmpty v-if="!keysLoading && keys.length === 0" description="暂无 Keys，点击搜索或新增" :image-size="60" />
              <div
                v-for="key in keys"
                :key="key"
                class="kv-key-item"
                :class="{ active: selectedKey === key }"
                @click="selectKey(key)"
              >
                <span class="kv-key-name" :title="key">{{ key }}</span>
                <ReButton
                  icon="Delete"
                  size="small"
                  text
                  class="kv-delete-btn"
                  @click.stop="deleteKey(key)"
                />
              </div>
            </div>
            <div class="kv-count">共 {{ keys.length }} 个 Keys</div>
          </div>

          <!-- 右侧：value 显示/编辑 -->
          <div class="kv-right">
            <ReEmpty v-if="!selectedKey" description="点击左侧 Key 查看和编辑 Value" :image-size="80" />
            <template v-else>
              <div class="kv-detail-header">
                <span class="kv-detail-key" :title="selectedKey">{{ selectedKey }}</span>
                <ReTag v-if="keyDetail" :type="keyDetail.type === 'STRING' ? 'success' : 'info'" size="small">
                  {{ keyDetail.type }}
                </ReTag>
              </div>
              <div v-if="detailLoading" class="kv-loading">加载中...</div>
              <template v-else-if="keyDetail">
                <div class="kv-meta">
                  <div class="kv-meta-item">
                    <span class="kv-meta-label">类型：</span>
                    <span class="kv-meta-value">{{ keyDetail.type }}</span>
                  </div>
                  <div class="kv-meta-item">
                    <span class="kv-meta-label">TTL：</span>
                    <span class="kv-meta-value">{{ keyDetail.ttl < 0 ? '永不过期' : keyDetail.ttl + ' 秒' }}</span>
                  </div>
                </div>
                <!-- STRING 类型 -->
                <template v-if="keyDetail.type === 'STRING'">
                  <div class="kv-value-label">Value：</div>
                  <ReTextarea
                    v-model="editValue"
                    :rows="8"
                    placeholder="STRING 类型的值"
                    class="kv-value-editor"
                  />
                </template>

                <!-- LIST 类型 -->
                <template v-else-if="keyDetail.type === 'LIST'">
                  <div class="kv-value-label">列表元素（共 {{ keyDetail.size }} 个）：</div>
                  <div class="kv-list-editor">
                    <div v-for="(item, idx) in listItems" :key="idx" class="kv-list-item">
                      <span class="kv-list-index">{{ idx }}</span>
                      <ReInput v-model="listItems[idx]" size="small" class="kv-list-input" />
                      <ReButton icon="Delete" size="small" text @click="removeListItem(idx)" />
                    </div>
                    <div class="kv-list-add">
                      <ReInput v-model="newListItem" size="small" placeholder="新元素值" @keyup.enter="addListItem" />
                      <ReButton icon="Plus" size="small" @click="addListItem">添加</ReButton>
                    </div>
                  </div>
                </template>

                <!-- SET 类型 -->
                <template v-else-if="keyDetail.type === 'SET'">
                  <div class="kv-value-label">集合元素（共 {{ keyDetail.size }} 个）：</div>
                  <div class="kv-list-editor">
                    <div v-for="(item, idx) in setItems" :key="idx" class="kv-list-item">
                      <ReInput v-model="setItems[idx]" size="small" class="kv-list-input" />
                      <ReButton icon="Delete" size="small" text @click="removeSetItem(idx)" />
                    </div>
                    <div class="kv-list-add">
                      <ReInput v-model="newSetItem" size="small" placeholder="新元素值" @keyup.enter="addSetItem" />
                      <ReButton icon="Plus" size="small" @click="addSetItem">添加</ReButton>
                    </div>
                  </div>
                </template>

                <!-- HASH 类型 -->
                <template v-else-if="keyDetail.type === 'HASH'">
                  <div class="kv-value-label">哈希字段（共 {{ keyDetail.size }} 个）：</div>
                  <div class="kv-hash-editor">
                    <div class="kv-hash-header">
                      <span class="kv-hash-field">字段</span>
                      <span class="kv-hash-value">值</span>
                      <span class="kv-hash-action">操作</span>
                    </div>
                    <div v-for="(item, idx) in hashItems" :key="idx" class="kv-hash-row">
                      <ReInput v-model="hashItems[idx].field" size="small" class="kv-hash-field" />
                      <ReInput v-model="hashItems[idx].value" size="small" class="kv-hash-value" />
                      <ReButton icon="Delete" size="small" text @click="removeHashItem(idx)" />
                    </div>
                    <div class="kv-hash-add">
                      <ReInput v-model="newHashField" size="small" placeholder="字段名" class="kv-hash-field" />
                      <ReInput v-model="newHashValue" size="small" placeholder="字段值" class="kv-hash-value" />
                      <ReButton icon="Plus" size="small" @click="addHashItem">添加</ReButton>
                    </div>
                  </div>
                </template>

                <!-- STREAM 类型 -->
                <template v-else-if="keyDetail.type === 'STREAM'">
                  <div class="kv-value-label">流消息（共 {{ keyDetail.size }} 条）：</div>
                  <div class="kv-stream-view">
                    <div class="kvs-toolbar">
                      <ReButton size="small" type="primary" @click="addStreamMessage">
                        <template #icon><ReIcon name="Plus" /></template>添加消息
                      </ReButton>
                      <ReButton size="small" @click="loadStreamMessages">
                        <template #icon><ReIcon name="Refresh" /></template>刷新
                      </ReButton>
                    </div>
                    <div class="kvs-list">
                      <div v-for="(msg, idx) in streamMessages" :key="idx" class="kvs-message">
                        <div class="kvs-msg-id">{{ msg.id }}</div>
                        <div class="kvs-msg-body">
                          <div v-for="(val, field) in msg.body" :key="field" class="kvs-msg-field">
                            <span class="kvs-field-name">{{ field }}</span>
                            <span class="kvs-field-value">{{ val }}</span>
                          </div>
                        </div>
                      </div>
                      <ReEmpty v-if="streamMessages.length === 0" description="暂无消息" :image-size="40" />
                    </div>
                  </div>
                </template>

                <!-- ZSET 类型 -->
                <template v-else-if="keyDetail.type === 'ZSET'">
                  <div class="kv-value-label">有序集合（共 {{ keyDetail.size }} 个）：</div>
                  <div class="kv-hash-editor">
                    <div class="kv-hash-header">
                      <span class="kv-hash-field">成员</span>
                      <span class="kv-hash-value">分数</span>
                      <span class="kv-hash-action">操作</span>
                    </div>
                    <div v-for="(item, idx) in zsetItems" :key="idx" class="kv-hash-row">
                      <ReInput v-model="zsetItems[idx].member" size="small" class="kv-hash-field" />
                      <ReInputNumber v-model="zsetItems[idx].score" size="small" class="kv-hash-value" style="width: 100%" />
                      <ReButton icon="Delete" size="small" text @click="removeZsetItem(idx)" />
                    </div>
                    <div class="kv-hash-add">
                      <ReInput v-model="newZsetMember" size="small" placeholder="成员" class="kv-hash-field" />
                      <ReInputNumber v-model="newZsetScore" size="small" placeholder="分数" class="kv-hash-value" style="width: 100%" />
                      <ReButton icon="Plus" size="small" @click="addZsetItem">添加</ReButton>
                    </div>
                  </div>
                </template>

                <!-- 其他类型 -->
                <template v-else>
                  <div class="kv-value-label">Value（{{ keyDetail.type }} 类型，暂不支持编辑）：</div>
                  <pre class="kv-raw-value">{{ JSON.stringify(keyDetail.value, null, 2) }}</pre>
                </template>

                <div class="kv-actions">
                  <div class="kv-ttl">
                    <span>过期时间(秒，-1=永不过期)：</span>
                    <ReInputNumber v-model="editTtl" :min="-1" size="small" style="width: 140px" />
                    <ReButton size="small" @click="setExpire">设置 TTL</ReButton>
                  </div>
                  <ReButton type="primary" :loading="saving" @click="saveValue">保存修改</ReButton>
                </div>
              </template>
            </template>
          </div>
        </div>
      </template>
    </template>

    <!-- 新增 Key 弹窗 -->
    <ReDialog v-model="newKeyDialog" title="新增 Redis Key" width="500px">
      <ReForm label-width="100px">
        <ReFormItem label="Key 名称" required>
          <ReInput v-model="newKeyName" placeholder="例如：user:1001" />
        </ReFormItem>
        <ReFormItem label="Value">
          <ReTextarea v-model="newKeyValue" :rows="4" placeholder="STRING 类型的值" />
        </ReFormItem>
        <ReFormItem label="过期时间(秒)">
          <ReInputNumber v-model="newKeyTtl" :min="-1" size="small" style="width: 140px" />
          <span style="margin-left: 8px; color: var(--text-tertiary); font-size: 12px">-1 表示永不过期</span>
        </ReFormItem>
      </ReForm>
      <template #footer>
        <ReButton @click="newKeyDialog = false">取消</ReButton>
        <ReButton type="primary" :loading="saving" @click="createKey">创建</ReButton>
      </template>
    </ReDialog>
  </div>

  <!-- Stream 消息弹窗 -->
  <ReDialog v-model="streamDialogVisible" title="添加 Stream 消息" width="500px">
    <ReForm label-width="100px">
      <ReFormItem label="消息ID">
        <ReInput v-model="newStreamId" placeholder="留空自动生成，格式：时间戳-序号" />
      </ReFormItem>
      <ReFormItem label="消息体(JSON)">
        <ReTextarea v-model="newStreamBody" :rows="6" placeholder='{"field1": "value1", "field2": "value2"}' />
      </ReFormItem>
    </ReForm>
    <template #footer>
      <ReButton @click="streamDialogVisible = false">取消</ReButton>
      <ReButton type="primary" @click="saveStreamMessage">添加</ReButton>
    </template>
  </ReDialog>
</template>

<style scoped lang="scss">
.card-h { font-size: 15px; font-weight: 600; }
.mono { font-family: monospace; font-size: 12px; }
.strong { font-weight: 600; font-size: 13px; }

/* Tab 切换 */
.tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 14px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.14);
}
.tab-btn {
  padding: 8px 16px;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.tab-btn:hover { color: var(--text-primary); }
.tab-btn.active {
  color: #c7c3ff;
  border-bottom-color: #8f83fd;
  font-weight: 600;
}

/* 图表卡片 */
.chart-card { margin-bottom: 14px; }
.redis-chart {
  width: 100%;
  height: 320px;
}

/* KV 管理容器 */
.kv-container {
  display: flex;
  gap: 14px;
  height: calc(100vh - 280px);
  min-height: 500px;
}

/* 左侧 key 列表 */
.kv-left {
  width: 320px;
  display: flex;
  flex-direction: column;
  background: rgba(148, 163, 184, 0.03);
  border: 1px solid rgba(148, 163, 184, 0.14);
  border-radius: 12px;
  overflow: hidden;
}
.kv-toolbar {
  display: flex;
  gap: 6px;
  padding: 10px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
}
.kv-toolbar :deep(.el-input) { flex: 1; }
.kv-list {
  flex: 1;
  overflow-y: auto;
  padding: 6px;
}
.kv-list.loading { opacity: 0.6; }
.kv-key-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s ease;
}
.kv-key-item:hover { background: rgba(148, 163, 184, 0.08); }
.kv-key-item.active {
  background: rgba(109, 93, 252, 0.12);
  border-left: 3px solid #8f83fd;
}
.kv-key-name {
  flex: 1;
  font-size: 12px;
  font-family: monospace;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.kv-delete-btn { opacity: 0; }
.kv-key-item:hover .kv-delete-btn { opacity: 1; }
.kv-count {
  padding: 8px 12px;
  border-top: 1px solid rgba(148, 163, 184, 0.1);
  font-size: 12px;
  color: var(--text-tertiary);
}

/* 右侧 value 编辑 */
.kv-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: rgba(148, 163, 184, 0.03);
  border: 1px solid rgba(148, 163, 184, 0.14);
  border-radius: 12px;
  padding: 14px;
  overflow: hidden;
}
.kv-detail-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
}
.kv-detail-key {
  font-size: 14px;
  font-weight: 600;
  font-family: monospace;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.kv-loading {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-tertiary);
}
.kv-meta {
  display: flex;
  gap: 24px;
  margin-bottom: 12px;
}
.kv-meta-item { font-size: 13px; }
.kv-meta-label { color: var(--text-tertiary); }
.kv-meta-value { color: var(--text-primary); font-weight: 500; }
.kv-value-label {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}
.kv-value-editor { flex: 1; margin-bottom: 12px; }
.kv-value-editor :deep(.el-textarea__inner) {
  height: 100% !important;
  font-family: monospace;
  font-size: 12px;
}
.kv-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.kv-ttl {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text-secondary);
}
</style>
