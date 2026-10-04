<script setup lang="ts">
/**
 * 设备资产 —— 监控视角的设备台账。
 *
 * 与「主机资产」并列的独立页面：主机资产管的是可远控服务器台账（增删改查），
 * 本页是只读的设备资产总览，数据来自监控后端资产聚合接口
 * `GET /ms/monitor/asset/search?assetType=DEVICE` 与
 * `GET /ms/monitor/asset/device/{deviceId}`，叠加该设备的监控项与告警。
 *
 * 设备的运维操作（通道配置 / 云台 / 地图）在本页之外，由设备管理工作台承担。
 *
 * @author CH
 * @since 4.0.0.42
 */
import { computed, onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import type { ReFilterItem } from "@repo/ui/components/ReFilter/types";
import { searchAssets, getDeviceAssetDetail, type DeviceAssetDetail } from "@pages/monitor/src/api";

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

const devices = ref<DeviceAssetDetail[]>([]);
const loading = ref(false);
const loadError = ref("");

/** ReFilter 过滤状态 */
const filterState = ref<Record<string, unknown>>({ keyword: "", status: "", category: "" });

/** 视图模式：card（默认）/ table */
const viewMode = ref<"card" | "table">("card");

/** 详情弹窗 */
const detailVisible = ref(false);
const detailLoading = ref(false);
const detail = ref<DeviceAssetDetail | null>(null);

/**
 * 过滤项配置
 */
const filterItems = computed<ReFilterItem[]>(() => [
  { prop: "keyword", label: "关键字", type: "input", placeholder: "名称 / 地址 / 序列号" },
  {
    prop: "status",
    label: "在线状态",
    type: "select",
    options: [
      { label: "在线", value: "1" },
      { label: "离线", value: "0" },
    ],
  },
  {
    prop: "category",
    label: "设备大类",
    type: "select",
    options: Object.entries(CATEGORY_META).map(([value, meta]) => ({ label: meta.label, value })),
  },
]);

/**
 * ReFilter 过滤项变更
 * @param prop 过滤属性名
 * @param value 过滤值
 */
function onFilterChange(prop: string, value: unknown): void {
  filterState.value[prop] = value;
}

/**
 * ReFilter 重置
 */
function onFilterReset(): void {
  filterState.value = { keyword: "", status: "", category: "" };
}

/** 客户端过滤：后端已按关键字模糊，这里补状态与大类的即时筛选 */
const filtered = computed<DeviceAssetDetail[]>(() => {
  const kw = String(filterState.value.keyword || "").trim().toLowerCase();
  const status = String(filterState.value.status || "");
  const category = String(filterState.value.category || "");
  return devices.value.filter((d) => {
    if (status === "1" && !d.online) return false;
    if (status === "0" && d.online) return false;
    if (category && d.category !== category) return false;
    if (!kw) return true;
    return (
      (d.name || "").toLowerCase().includes(kw) ||
      (d.address || "").toLowerCase().includes(kw) ||
      (d.serial || "").toLowerCase().includes(kw)
    );
  });
});

/**
 * 大类展示名：后端中文名优先，缺失时用本地映射兜底
 * @param d 设备
 * @returns 大类名
 */
function categoryLabel(d: DeviceAssetDetail): string {
  return d.categoryLabel || CATEGORY_META[d.category || ""]?.label || d.category || "—";
}

/**
 * 大类图标名
 * @param d 设备
 * @returns 图标名
 */
function categoryIcon(d: DeviceAssetDetail): string {
  return CATEGORY_META[d.category || ""]?.icon || "VideoCamera";
}

/**
 * 厂商展示名
 * @param vendor 厂商原值
 * @returns 厂商中文名
 */
function vendorLabel(vendor?: string): string {
  if (!vendor) return "—";
  return VENDOR_LABELS[vendor] || vendor;
}

/**
 * 拉取设备列表
 */
async function fetchList(): Promise<void> {
  loading.value = true;
  loadError.value = "";
  try {
    const kw = String(filterState.value.keyword || "").trim();
    // 列表接口返回简表字段，通道/位置等详情字段需逐条补齐；
    // 这里只取简表渲染列表，点开详情时再拉完整视图。
    const briefs = await searchAssets(kw || undefined, "DEVICE");
    devices.value = (briefs || []).map((b) => ({
      assetType: "DEVICE",
      assetId: b.assetId,
      name: b.name,
      address: b.address,
      port: b.port,
      category: b.category,
      categoryLabel: b.categoryLabel,
      vendor: b.vendor,
      online: b.online,
    }));
  } catch (e: unknown) {
    loadError.value = e instanceof Error ? e.message : String(e);
    ElMessage.error(`设备资产加载失败：${loadError.value}`);
  } finally {
    loading.value = false;
  }
}

/**
 * 打开设备详情
 * @param row 设备简表行
 */
async function openDetail(row: DeviceAssetDetail): Promise<void> {
  detail.value = null;
  detailVisible.value = true;
  detailLoading.value = true;
  try {
    detail.value = await getDeviceAssetDetail(row.assetId);
  } catch (e: unknown) {
    ElMessage.error(e instanceof Error ? e.message : "设备资产详情加载失败");
  } finally {
    detailLoading.value = false;
  }
}

onMounted(fetchList);
</script>

<template>
  <div class="da">
    <div class="page-header">
      <div>
        <h1 class="page-title">设备资产</h1>
        <p class="page-desc">监控视角的设备台账 · 共 {{ devices.length }} 台 · 只读总览</p>
      </div>
    </div>

    <div v-if="loadError" class="as-error">
      <span>数据加载失败：{{ loadError }}</span>
      <ReButton icon="RefreshRight" type="primary" :show-text="true" @click="fetchList">重试</ReButton>
    </div>

    <!-- 筛选条 -->
    <div class="as-panel as-filter">
      <div class="filter">
        <ReFilter
          :items="filterItems"
          :columns="3"
          :collapsible="false"
          :show-actions="false"
          @change="onFilterChange"
          @reset="onFilterReset"
          style="flex:1;min-width:0"
        />
        <span v-if="filtered.length !== devices.length" class="muted">{{ filtered.length }} / {{ devices.length }}</span>
        <div class="view-toggle">
          <button class="vt-btn" :class="{ active: viewMode === 'card' }" @click="viewMode = 'card'">
            <ReIcon name="Grid" :size="14" />卡片
          </button>
          <button class="vt-btn" :class="{ active: viewMode === 'table' }" @click="viewMode = 'table'">
            <ReIcon name="Menu" :size="14" />列表
          </button>
        </div>
      </div>
    </div>

    <!-- 卡片视图 -->
    <div v-if="viewMode === 'card'" class="da-card-grid">
      <ReCard v-for="d in filtered" :key="d.assetId" :body-style="{ paddingTop: '10px', paddingBottom: '10px' }">
        <template #header>
          <div class="dc-head">
            <span class="dc-cat">
              <ReIcon :name="categoryIcon(d)" :size="18" />
            </span>
            <div class="dc-name-wrap">
              <div class="dc-title-row">
                <b class="dc-name">{{ d.name || d.assetId }}</b>
                <span class="dc-cat-tag">{{ categoryLabel(d) }}</span>
                <span class="dc-online" :class="d.online ? 'is-on' : 'is-off'">
                  <i class="dc-dot" />{{ d.online ? "在线" : "离线" }}
                </span>
              </div>
              <div class="dc-addr mono">{{ d.address || "—" }}<template v-if="d.port">:{{ d.port }}</template></div>
            </div>
          </div>
        </template>
        <div class="dc-meta">
          <span><i class="k">厂商</i>{{ vendorLabel(d.vendor) }}</span>
        </div>
        <template #footer>
          <el-button text type="primary" @click="openDetail(d)">详情</el-button>
        </template>
      </ReCard>
      <el-empty v-if="!filtered.length && !loading" description="暂无设备资产" />
    </div>

    <!-- 表格视图 -->
    <div v-else class="as-panel">
      <el-table :data="filtered" v-loading="loading" border stripe empty-text="暂无设备资产">
        <el-table-column prop="name" label="设备名称" min-width="170" />
        <el-table-column prop="address" label="设备地址" min-width="140" />
        <el-table-column prop="port" label="端口" width="80" align="center" />
        <el-table-column label="设备大类" width="110" align="center">
          <template #default="{ row }">{{ categoryLabel(row) }}</template>
        </el-table-column>
        <el-table-column label="厂商" width="100" align="center">
          <template #default="{ row }">{{ vendorLabel(row.vendor) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <span class="dc-online" :class="row.online ? 'is-on' : 'is-off'">
              <i class="dc-dot" />{{ row.online ? "在线" : "离线" }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="90" align="right" fixed="right">
          <template #default="{ row }">
            <el-button text type="primary" @click="openDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 详情抽屉 -->
    <ReDrawer v-model="detailVisible" :title="`设备资产 · ${detail?.name || ''}`" size="640px">
      <div v-loading="detailLoading" class="dd-body">
        <template v-if="detail">
          <section class="dd-section">
            <h4 class="dd-title">基础信息</h4>
            <div class="dd-grid">
              <div class="dd-kv"><span class="k">名称</span><span class="v">{{ detail.name || "—" }}</span></div>
              <div class="dd-kv"><span class="k">地址</span><span class="v">{{ detail.address || "—" }}</span></div>
              <div class="dd-kv"><span class="k">端口</span><span class="v">{{ detail.port ?? "—" }}</span></div>
              <div class="dd-kv"><span class="k">设备大类</span><span class="v">{{ categoryLabel(detail) }}</span></div>
              <div class="dd-kv"><span class="k">厂商</span><span class="v">{{ vendorLabel(detail.vendor) }}</span></div>
              <div class="dd-kv"><span class="k">型号</span><span class="v">{{ detail.model || "—" }}</span></div>
              <div class="dd-kv"><span class="k">序列号</span><span class="v">{{ detail.serial || "—" }}</span></div>
              <div class="dd-kv"><span class="k">固件</span><span class="v">{{ detail.firmware || "—" }}</span></div>
            </div>
          </section>

          <section class="dd-section">
            <h4 class="dd-title">运行状态</h4>
            <div class="dd-flags">
              <span class="dd-flag" :class="detail.online ? 'on' : 'off'">探测 {{ detail.online ? "在线" : "离线" }}</span>
              <span class="dd-flag" :class="detail.sessionOnline ? 'on' : 'off'">
                会话 {{ detail.sessionOnline ? "在线" : "离线" }}
              </span>
              <span class="dd-flag plain">离线阈值 {{ detail.offlineThreshold ?? "—" }} 秒</span>
            </div>
          </section>

          <section v-if="detail.geo?.located" class="dd-section">
            <h4 class="dd-title">位置</h4>
            <div class="dd-kv"><span class="k">坐标</span><span class="v">{{ detail.geo.latitude }}, {{ detail.geo.longitude }}</span></div>
            <div v-if="detail.geo.address" class="dd-kv"><span class="k">地址</span><span class="v">{{ detail.geo.address }}</span></div>
          </section>

          <section class="dd-section">
            <h4 class="dd-title">
              通道
              <span class="dd-extra">已启用 {{ detail.enabledChannelCount ?? 0 }} / {{ detail.channelCount ?? 0 }}</span>
            </h4>
            <el-table :data="detail.channels || []" border empty-text="无通道">
              <el-table-column prop="channelNo" label="通道号" width="80" align="center" />
              <el-table-column prop="channelName" label="通道名称" min-width="140" />
              <el-table-column prop="channelType" label="类型" width="100" align="center" />
              <el-table-column prop="channelStatus" label="状态" width="90" align="center" />
            </el-table>
          </section>

          <section class="dd-section">
            <h4 class="dd-title">
              监控项
              <span class="dd-extra">共 {{ detail.monitors?.length || 0 }} 项 · 活跃告警 {{ detail.activeAlarmCount || 0 }} 条</span>
            </h4>
            <el-table :data="detail.monitors || []" border empty-text="该设备暂无关联监控项">
              <el-table-column prop="name" label="监控项" min-width="140" />
              <el-table-column prop="host" label="地址" min-width="130" />
              <el-table-column prop="serviceType" label="服务类型" width="100" align="center" />
              <el-table-column label="告警" width="100" align="center">
                <template #default="{ row }">{{ row.activeAlarmCount || 0 }} 条</template>
              </el-table-column>
            </el-table>
          </section>
        </template>
      </div>
    </ReDrawer>
  </div>
</template>

<style scoped lang="scss">
.da {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.page-title {
  margin: 0 0 4px;
  font-size: 20px;
  font-weight: 600;
}

.page-desc {
  margin: 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.as-error {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 8px;
  background: var(--el-color-danger-light-9);
  color: var(--el-color-danger);
  font-size: 13px;
}

.as-panel {
  padding: 14px 16px;
  background: var(--el-bg-color);
  border-radius: 12px;
  box-shadow: var(--el-box-shadow-light);
}

.filter {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.muted {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.view-toggle {
  display: inline-flex;
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  overflow: hidden;
}

.vt-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  border: none;
  background: transparent;
  color: var(--el-text-color-regular);
  font-size: 12px;
  cursor: pointer;
}

.vt-btn.active {
  background: var(--el-color-primary);
  color: #fff;
}

.da-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 14px;
}

.dc-head {
  display: flex;
  align-items: center;
  gap: 12px;
}

.dc-cat {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: color-mix(in srgb, var(--el-color-primary) 12%, transparent);
  color: var(--el-color-primary);
  flex-shrink: 0;
}

.dc-name-wrap { min-width: 0; }

.dc-title-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.dc-name {
  font-size: 14px;
  font-weight: 600;
}

.dc-cat-tag {
  padding: 1px 6px;
  border-radius: 3px;
  font-size: 11px;
  color: var(--el-color-primary);
  background: color-mix(in srgb, var(--el-color-primary) 10%, transparent);
}

.dc-online {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 600;
}

.dc-online.is-on { color: var(--el-color-success); }
.dc-online.is-off { color: var(--el-text-color-secondary); }

.dc-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.dc-addr {
  margin-top: 3px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.dc-meta {
  display: flex;
  gap: 14px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.dc-meta .k {
  margin-right: 4px;
  color: var(--el-text-color-placeholder);
}

.mono { font-family: "SF Mono", "Cascadia Code", monospace; }

.dd-body { min-height: 200px; }
.dd-section { margin-bottom: 20px; }

.dd-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 10px;
  padding-left: 8px;
  border-left: 3px solid var(--el-color-primary);
  font-size: 13px;
  font-weight: 600;
  line-height: 1.2;
}

.dd-extra {
  font-size: 11px;
  font-weight: 400;
  color: var(--el-text-color-secondary);
}

.dd-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px 16px;
}

.dd-kv {
  display: flex;
  gap: 8px;
  padding: 4px 0;
  font-size: 12.5px;
}

.dd-kv .k {
  width: 62px;
  flex-shrink: 0;
  color: var(--el-text-color-secondary);
}

.dd-kv .v {
  color: var(--el-text-color-primary);
  word-break: break-all;
}

.dd-flags { display: flex; gap: 10px; flex-wrap: wrap; }

.dd-flag {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-regular);
}

.dd-flag.on {
  color: var(--el-color-success);
  background: color-mix(in srgb, var(--el-color-success) 10%, transparent);
}

.dd-flag.off { color: var(--el-text-color-secondary); }
.dd-flag.plain { color: var(--el-text-color-regular); }
</style>
