<script setup lang="ts">
/**
 * 设备资产 —— 设备台账总览（只读）。
 *
 * 数据来自 device-starter 的 `GET /api/device/list`（DeviceInfo 列表），
 * 经 monitor 应用承载（monitor-starter 依赖 device-starter，vite 代理放行 /api/device）。
 *
 * ⚠ 不用 monitor 的 `/ms/monitor/asset/search?assetType=DEVICE`：该端点忽略 assetType，
 * 只检索主机台账（ms_server_host），会把主机当设备返回。
 *
 * 视觉与布局对齐「代理管理」（ProxyView）：
 *   - 不设顶部大标题 hero，页面标题由外壳面包屑承担；
 *   - 4 张 ReStatCard 紧凑档横排概览；
 *   - 筛选与全部操作合并成一行：ReInput + ReSelect ×2 + 查询 + 图标操作组（square + tip）；
 *   - 表格卡 flex:1 + min-height:0 吃满剩余高度，表体内部滚动、表头固定；
 *   - 统一用 --el-* / --el-radius-* / --metric-* 变量，不写死品牌色。
 *
 * @author CH
 * @since 4.0.0.42
 */
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import { CircleCheck, Connection, Tickets, VideoCamera } from "@element-plus/icons-vue";
import ReStatCard from "@repo/ui/re-stat-card";
import deviceApi from "@pages/device/src/api/deviceApi";
import type { DeviceInfo } from "@pages/device/src/types/device";

/** 设备大类 → 中文名与图标（后端 categoryLabel 缺失时的兜底） */
const CATEGORY_META: Record<string, { label: string; icon: string }> = {
  camera: { label: "网络摄像机", icon: "VideoCamera" },
  accessControl: { label: "门禁设备", icon: "Lock" },
  alarm: { label: "报警设备", icon: "AlarmClock" },
  intercom: { label: "对讲设备", icon: "ChatDotRound" },
};

/** 厂商 → 中文名 */
const VENDOR_LABELS: Record<string, string> = {
  hikvision: "海康威视",
  dahua: "大华",
};

/** 大类筛选项 */
const CATEGORY_OPTIONS = [
  { label: "网络摄像机", value: "camera" },
  { label: "门禁设备", value: "accessControl" },
  { label: "报警设备", value: "alarm" },
  { label: "对讲设备", value: "intercom" },
];

/** 在线状态筛选项 */
const STATUS_OPTIONS = [
  { label: "在线", value: "1" },
  { label: "离线", value: "0" },
];

const devices = ref<DeviceInfo[]>([]);
const loading = ref(false);
const loadError = ref("");

/** 筛选 + 视图模式（合并在一条操作行上，故用 reactive 而非 ReFilter） */
const filters = reactive({ keyword: "", status: "", category: "" });
const viewMode = ref<"card" | "table">("card");

/** 详情抽屉 */
const detailVisible = ref(false);
const detailLoading = ref(false);
const detail = ref<DeviceInfo | null>(null);

/** 客户端过滤：后端 list 不带关键字条件，这里做即时筛选 */
const filtered = computed<DeviceInfo[]>(() => {
  const kw = filters.keyword.trim().toLowerCase();
  return devices.value.filter((d) => {
    if (filters.status === "1" && !d.deviceInfoOnline) return false;
    if (filters.status === "0" && d.deviceInfoOnline) return false;
    if (filters.category && d.deviceInfoCategory !== filters.category) return false;
    if (!kw) return true;
    return [d.deviceInfoName, d.deviceInfoIp, d.deviceInfoSerial, d.deviceInfoAddress]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(kw));
  });
});

/** KPI：在线 / 离线 / 通道总数（设备总数取列表长度） */
const onlineCount = computed(() => devices.value.filter((d) => d.deviceInfoOnline).length);
const offlineCount = computed(() => devices.value.length - onlineCount.value);
const channelCount = computed(() =>
  devices.value.reduce((sum, d) => sum + (d.deviceInfoChannelCount || 0), 0)
);

const kpis = computed(() => [
  {
    key: "total",
    title: "已注册设备",
    value: devices.value.length,
    desc: `当前筛选 ${filtered.value.length} 台`,
    icon: VideoCamera,
    iconColor: "var(--el-color-primary)",
  },
  {
    key: "online",
    title: "当前在线",
    value: onlineCount.value,
    desc: `在线率 ${devices.value.length ? Math.round((onlineCount.value / devices.value.length) * 100) : 0}%`,
    icon: CircleCheck,
    iconColor: "var(--el-color-success)",
  },
  {
    key: "offline",
    title: "离线待处理",
    value: offlineCount.value,
    desc: "含阈值内未上报的设备",
    icon: Tickets,
    iconColor: "var(--metric-disk, var(--el-color-warning))",
  },
  {
    key: "channel",
    title: "通道总数",
    value: channelCount.value,
    desc: "各设备已登记通道之和",
    icon: Connection,
    iconColor: "var(--el-color-info)",
  },
]);

/** 大类展示名：本地映射兜底 */
function categoryLabel(d: DeviceInfo): string {
  return CATEGORY_META[d.deviceInfoCategory || ""]?.label || d.deviceInfoCategory || "—";
}

function vendorLabel(vendor?: string): string {
  return vendor ? VENDOR_LABELS[vendor] || vendor : "—";
}

/** 状态胶囊类名（koi 语义色） */
function statusClass(d: DeviceInfo): string {
  return d.deviceInfoOnline ? "is-ok" : "is-error";
}

function statusText(d: DeviceInfo): string {
  return d.deviceInfoOnline ? "在线" : "离线";
}

/** 拉取设备列表 */
async function fetchList(): Promise<void> {
  loading.value = true;
  loadError.value = "";
  try {
    devices.value = (await deviceApi.list()) || [];
  } catch (e: unknown) {
    devices.value = [];
    loadError.value = (e as { msg?: string })?.msg || (e instanceof Error ? e.message : String(e));
    ElMessage.error(`设备资产加载失败：${loadError.value}`);
  } finally {
    loading.value = false;
  }
}

function onReset(): void {
  filters.keyword = "";
  filters.status = "";
  filters.category = "";
}

/** 打开详情抽屉 */
async function openDetail(row: DeviceInfo): Promise<void> {
  detail.value = null;
  detailVisible.value = true;
  detailLoading.value = true;
  try {
    detail.value = await deviceApi.get(row.deviceInfoId);
  } catch (e: unknown) {
    ElMessage.error((e as { msg?: string })?.msg || "设备详情加载失败");
  } finally {
    detailLoading.value = false;
  }
}

/** 最近上报时间 */
function fmtTime(v?: string): string {
  if (!v) return "—";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? v : d.toLocaleString("zh-CN", { hour12: false });
}

onMounted(fetchList);
</script>

<template>
  <div class="da">
    <!-- KPI 卡：已注册 / 在线 / 离线 / 通道总数。用 ReStatCard 紧凑档，
         四张并排只占一行，把纵向空间让给下面的表格。 -->
    <section class="da-kpis">
      <ReStatCard
        v-for="k in kpis"
        :key="k.key"
        size="compact"
        :title="k.title"
        :value="k.value"
        :desc="k.desc"
        :icon="k.icon"
        :icon-color="k.iconColor"
      />
    </section>

    <!-- 筛选与全部操作合并成一行：关键字 / 在线状态 / 设备大类 + 查询 + 图标操作组。
         不设顶部 hero，标题由外壳面包屑承担；刷新与视图切换以图标 + tip 呈现。 -->
    <section class="da-panel da-filter">
      <div class="da-field da-field--search">
        <ReInput
          v-model="filters.keyword"
          placeholder="搜索名称 / IP / 序列号..."
          clearable
          prefix-icon="Search"
          @keyup.enter="fetchList"
        />
      </div>
      <div class="da-field">
        <ReSelect v-model="filters.status" placeholder="全部状态" clearable :options="STATUS_OPTIONS" />
      </div>
      <div class="da-field">
        <ReSelect v-model="filters.category" placeholder="全部大类" clearable :options="CATEGORY_OPTIONS" />
      </div>
      <span class="da-filter__meta">{{ filtered.length }} / {{ devices.length }} 台</span>
      <ReButton icon="Search" :show-text="true" type="primary" :loading="loading" @click="fetchList">
        查询
      </ReButton>
      <div class="da-toolbar-ops">
        <ReButton icon="RefreshRight" layout="square" tip="刷新设备列表" :loading="loading" @click="fetchList" />
        <ReButton
          :icon="viewMode === 'card' ? 'Menu' : 'Grid'"
          layout="square"
          :tip="viewMode === 'card' ? '切换为列表视图' : '切换为卡片视图'"
          @click="viewMode = viewMode === 'card' ? 'table' : 'card'"
        />
        <ReButton icon="Delete" layout="square" tip="重置筛选条件" @click="onReset" />
      </div>
    </section>

    <div v-if="loadError" class="da-error">
      <span>{{ loadError }}</span>
      <ReButton icon="RefreshRight" layout="square" tip="重试" :loading="loading" @click="fetchList" />
    </div>

    <!-- 表格卡：flex:1 + min-height:0 吃满剩余高度，表体内部滚动、表头固定 -->
    <section class="da-panel da-table-card">
      <div v-if="viewMode === 'card' && !loading && !filtered.length" class="da-empty">
        <ReEmpty description="暂无设备资产，点击「查询」或「刷新」重新加载" :image-size="80" />
      </div>

      <div v-else-if="viewMode === 'card'" class="da-cards">
        <article
          v-for="d in filtered"
          :key="d.deviceInfoId"
          class="da-card"
          role="button"
          tabindex="0"
          @click="openDetail(d)"
          @keyup.enter="openDetail(d)"
        >
          <header class="da-card__head">
            <span class="da-card__name">{{ d.deviceInfoName || d.deviceInfoId }}</span>
            <span class="da-status">
              <span class="da-status__dot" :class="statusClass(d)"></span>
              <span class="da-status__text">{{ statusText(d) }}</span>
            </span>
          </header>
          <dl class="da-card__meta">
            <div><dt>IP</dt><dd class="mono">{{ d.deviceInfoIp || "—" }}</dd></div>
            <div><dt>大类</dt><dd>{{ categoryLabel(d) }}</dd></div>
            <div><dt>厂商</dt><dd>{{ vendorLabel(d.deviceInfoVendor) }}</dd></div>
            <div><dt>通道</dt><dd>{{ d.deviceInfoChannelCount ?? 0 }} 路</dd></div>
          </dl>
        </article>
      </div>

      <ReTable
        v-else
        :data="filtered"
        :loading="loading"
        :columns="[
          { prop: 'deviceInfoName', label: '设备名称', minWidth: 180, slot: 'name' },
          { prop: 'deviceInfoIp', label: 'IP / 地址', minWidth: 180, slot: 'addr' },
          { prop: 'deviceInfoCategory', label: '大类', width: 120, slot: 'category' },
          { prop: 'deviceInfoVendor', label: '厂商', width: 120 },
          { prop: 'deviceInfoOnline', label: '状态', width: 110, slot: 'status' },
          { prop: 'deviceInfoChannelCount', label: '通道', width: 90, align: 'center' },
          { prop: 'deviceInfoCreatedAt', label: '接入时间', width: 180, slot: 'createdAt' },
          { prop: 'actions', label: '操作', width: 90, slot: 'actions' },
        ]"
        size="default"
        :border="false"
        :stripe="false"
        table-id="device-asset-list"
        class="device-table"
      >
        <template #col-name="{ row }">
          <span class="da-name">{{ row.deviceInfoName || row.deviceInfoId }}</span>
        </template>
        <template #col-addr="{ row }">
          <span class="mono">{{ row.deviceInfoIp || "—" }}</span>
          <span v-if="row.deviceInfoAddress" class="da-sub">{{ row.deviceInfoAddress }}</span>
        </template>
        <template #col-category="{ row }">{{ categoryLabel(row) }}</template>
        <template #col-status="{ row }">
          <span class="da-status">
            <span class="da-status__dot" :class="statusClass(row)"></span>
            <span class="da-status__text">{{ statusText(row) }}</span>
          </span>
        </template>
        <template #col-createdAt="{ row }">{{ fmtTime(row.deviceInfoCreatedAt) }}</template>
        <template #col-actions="{ row }">
          <ReButton icon="View" layout="square" title="详情" @click="openDetail(row)" />
        </template>
      </ReTable>
    </section>

    <ReDrawer v-model="detailVisible" :title="`设备资产 · ${detail?.deviceInfoName || ''}`" size="560px">
      <div v-loading="detailLoading" class="dd-body">
        <dl v-if="detail" class="dd-grid">
          <div><dt>设备 ID</dt><dd class="mono">{{ detail.deviceInfoId }}</dd></div>
          <div><dt>名称</dt><dd>{{ detail.deviceInfoName || "—" }}</dd></div>
          <div><dt>大类</dt><dd>{{ categoryLabel(detail) }}</dd></div>
          <div><dt>厂商</dt><dd>{{ vendorLabel(detail.deviceInfoVendor) }}</dd></div>
          <div><dt>型号</dt><dd>{{ detail.deviceInfoModel || "—" }}</dd></div>
          <div><dt>IP:端口</dt><dd class="mono">{{ detail.deviceInfoIp || "—" }}:{{ detail.deviceInfoPort ?? "—" }}</dd></div>
          <div><dt>序列号</dt><dd class="mono">{{ detail.deviceInfoSerial || "—" }}</dd></div>
          <div><dt>固件</dt><dd>{{ detail.deviceInfoFirmware || "—" }}</dd></div>
          <div><dt>经纬度</dt><dd class="mono">
            {{ detail.deviceInfoLatitude ?? "—" }}, {{ detail.deviceInfoLongitude ?? "—" }}
          </dd></div>
          <div><dt>离线阈值</dt><dd>{{ detail.deviceInfoOfflineThreshold ?? "—" }} 秒</dd></div>
        </dl>

        <template v-if="detail?.channels?.length">
          <h4 class="dd-h">通道（{{ detail.channels.length }}）</h4>
          <ul class="dd-channels">
            <li v-for="c in detail.channels" :key="c.deviceChannelId">
              <span class="mono">#{{ c.deviceChannelNo }}</span>
              <span>{{ c.deviceChannelName || "未命名" }}</span>
              <ReTag :type="c.deviceChannelStatus === 'enabled' ? 'success' : 'info'" size="small">
                {{ c.deviceChannelStatus === 'enabled' ? "启用" : "禁用" }}
              </ReTag>
            </li>
          </ul>
        </template>
      </div>
    </ReDrawer>
  </div>
</template>

<style scoped lang="scss">
/* 根容器：撑满外壳主区，表格卡的 flex:1 才有高度基准 */
.da {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 10px 12px 12px;
  height: 100%;
  min-height: 0;
  color: var(--el-text-color-primary);
}

/* ---------- KPI 卡（ReStatCard 紧凑档横排，外壳规格由组件基线提供） ---------- */
.da-kpis {
  flex: none;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

/* ---------- 通用面板 ---------- */
.da-panel {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xl, 16px);
  box-shadow: var(--el-box-shadow-light, var(--shadow-1));
}

/* 筛选条与操作区合并成一行 */
.da-filter {
  flex: none;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  padding: 12px 16px;
}
/* 操作图标组：与「查询」之间用竖线区分「筛选」与「操作」 */
.da-toolbar-ops {
  display: flex;
  align-items: center;
  gap: 6px;
  padding-left: 10px;
  border-left: 1px solid var(--el-border-color-lighter);
}
.da-field {
  width: 160px;
}
.da-field--search {
  width: 280px;
}
.da-field :deep(.el-input),
.da-field :deep(.el-select) {
  width: 100%;
}
.da-filter__meta {
  margin-left: auto;
  font-size: 12.5px;
  color: var(--el-text-color-secondary);
}
@media (max-width: 900px) {
  .da-field,
  .da-field--search {
    width: 100%;
  }
  .da-filter__meta {
    margin-left: 0;
  }
  .da-toolbar-ops {
    padding-left: 0;
    border-left: none;
  }
}

/* 错误条 */
.da-error {
  flex: none;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  border-radius: var(--el-radius-base, 8px);
  background: var(--el-color-danger-light-9);
  color: var(--el-color-danger);
  font-size: 13px;
}

/* 表格卡：flex:1 + min-height:0 才能吃满剩余高度，表体内部滚动 */
.da-table-card {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 6px 8px 8px;
}

.da-empty {
  flex: 1;
  display: grid;
  place-items: center;
}

/* 卡片视图 */
.da-cards {
  flex: 1;
  min-height: 0;
  overflow: auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
  padding: 8px;
  align-content: start;
}
.da-card {
  padding: 14px 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
  background: var(--el-fill-color-blank);
  cursor: pointer;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;

  &:hover,
  &:focus-visible {
    border-color: var(--el-color-primary-light-5);
    box-shadow: var(--el-box-shadow-light);
    outline: none;
  }
}
.da-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}
.da-card__name {
  font-size: 14.5px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.da-card__meta {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px 12px;
  margin: 0;

  > div {
    display: flex;
    gap: 6px;
    min-width: 0;
  }
  dt {
    flex: none;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
  dd {
    margin: 0;
    font-size: 12.5px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

/* 表格外观对齐 UI 稿：表头无底色、去大写、行距更松 */
.da-table-card :deep(.re-table) {
  padding: 0;
  background: transparent;
}
.da-table-card :deep(.el-table) {
  --el-table-header-bg-color: var(--el-bg-color) !important;
}
.da-table-card :deep(.el-table th.el-table__cell) {
  padding: 14px 12px !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  text-transform: none !important;
  letter-spacing: 0 !important;
  color: var(--el-text-color-secondary);
  background: transparent !important;
}
.da-table-card :deep(.el-table td.el-table__cell) {
  padding: 15px 12px !important;
  font-size: 14px !important;
}

/* 列内容 */
.mono {
  font-family: var(--el-font-family-mono, ui-monospace, SFMono-Regular, Consolas, monospace);
  font-variant-numeric: tabular-nums;
}
.da-name {
  font-size: 13.5px;
  color: var(--el-text-color-primary);
}
.da-sub {
  display: block;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

/* 状态点（koi 语义色） */
.da-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.da-status__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--el-color-info);

  &.is-ok {
    background: var(--el-color-success);
  }
  &.is-error {
    background: var(--el-color-danger);
  }
}
.da-status__text {
  font-size: 12.5px;
  color: var(--el-text-color-regular);
}

/* 详情抽屉 */
.dd-body {
  min-height: 120px;
}
.dd-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px 16px;
  margin: 0 0 16px;

  > div {
    min-width: 0;
  }
  dt {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
  dd {
    margin: 2px 0 0;
    font-size: 13.5px;
    word-break: break-all;
  }
}
.dd-h {
  margin: 0 0 8px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.dd-channels {
  margin: 0;
  padding: 0;
  list-style: none;

  li {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 7px 0;
    border-bottom: 1px solid var(--el-border-color-lighter);
    font-size: 13px;
  }
}
</style>