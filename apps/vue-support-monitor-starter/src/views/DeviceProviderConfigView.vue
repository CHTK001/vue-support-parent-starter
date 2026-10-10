<script setup lang="ts">
/**
 * 提供商配置 —— 各厂商的离线检测阈值。
 *
 * 数据来自 device-starter 的 `GET /api/device/provider-config`，返回
 * `Map<vendor, threshold>`（阈值为秒）；`PUT /api/device/provider-config/{vendor}`
 * 按厂商更新，经 monitor 应用承载。
 *
 * 后端只有「按厂商整体设一个阈值」的粒度，没有单设备级配置
 * （单设备是 `PUT /api/device/{id}/offline-threshold`），本页只做厂商级。
 *
 * 视觉与布局对齐「代理管理」（ProxyView）：无顶部 hero、4 张紧凑 ReStatCard、
 * 筛选与操作合并成一行、行内保存/还原用图标按钮、统一 --el-* 变量。
 *
 * @author CH
 * @since 4.0.0.42
 */
import { message } from "@repo/core";
import { computed, onMounted, ref } from "vue";

import { Bell, Clock, Grid, Operation } from "@element-plus/icons-vue";
import ReStatCard from "@repo/ui/re-stat-card";
import deviceApi from "@pages/device/src/api/deviceApi";

/** 厂商码 → 中文名（与设备资产页的 VENDOR_LABELS 保持一致口径） */
const VENDOR_LABELS: Record<string, string> = {
  hikvision: "海康威视",
  dahua: "大华",
};

interface VendorRow {
  vendor: string;
  label: string;
  /** 当前生效阈值（秒） */
  threshold: number;
  /** 编辑中的阈值 */
  draft: number;
  saving: boolean;
  dirty: boolean;
}

const rows = ref<VendorRow[]>([]);
const loading = ref(false);
const loadError = ref("");

/** 关键字过滤（厂商名或厂商码） */
const keyword = ref("");

/** 未做厂商名映射时直接展示原码，不隐藏数据 */
function vendorLabel(vendor: string): string {
  return VENDOR_LABELS[vendor] ? `${VENDOR_LABELS[vendor]}（${vendor}）` : vendor;
}

const filteredRows = computed(() => {
  const kw = keyword.value.trim().toLowerCase();
  if (!kw) return rows.value;
  return rows.value.filter(
    (r) => r.vendor.toLowerCase().includes(kw) || r.label.toLowerCase().includes(kw)
  );
});

const dirtyCount = computed(() => rows.value.filter((r) => r.dirty).length);

const avgThreshold = computed(() => {
  if (!rows.value.length) return 0;
  return Math.round(rows.value.reduce((s, r) => s + r.threshold, 0) / rows.value.length);
});

const thresholdRange = computed(() => {
  if (!rows.value.length) return "—";
  const list = rows.value.map((r) => r.threshold);
  return `${Math.min(...list)} ~ ${Math.max(...list)}`;
});

const kpis = computed(() => [
  {
    key: "vendors",
    title: "接入厂商",
    value: rows.value.length,
    desc: `当前筛选 ${filteredRows.value.length} 个`,
    icon: Grid,
    iconColor: "var(--el-color-primary)",
  },
  {
    key: "dirty",
    title: "待保存",
    value: dirtyCount.value,
    desc: dirtyCount.value ? "有未保存的阈值改动" : "配置均已保存",
    icon: Bell,
    iconColor: dirtyCount.value ? "var(--el-color-warning)" : "var(--el-color-success)",
  },
  {
    key: "avg",
    title: "平均阈值",
    value: avgThreshold.value,
    desc: "单位：秒",
    icon: Operation,
    iconColor: "var(--el-color-info)",
  },
  {
    key: "range",
    title: "阈值区间",
    value: thresholdRange.value,
    desc: "最小 ~ 最大（秒）",
    icon: Clock,
    iconColor: "var(--metric-disk, var(--el-color-warning))",
  },
]);

/** 阈值合理性提示：过小会频繁误报，过大则离线发现滞后 */
function thresholdHint(t: number): string {
  if (!Number.isFinite(t) || t <= 0) return "必须大于 0";
  if (t < 30) return "偏小，网络抖动易误判离线";
  if (t > 3600) return "偏大，离线发现会明显滞后";
  return "";
}

async function fetchConfig(): Promise<void> {
  loading.value = true;
  loadError.value = "";
  try {
    const map = (await deviceApi.listProviderConfigs()) || {};
    rows.value = Object.entries(map).map(([vendor, threshold]) => ({
      vendor,
      label: vendorLabel(vendor),
      threshold: Number(threshold),
      draft: Number(threshold),
      saving: false,
      dirty: false,
    }));
  } catch (e: unknown) {
    rows.value = [];
    loadError.value = (e as { msg?: string })?.msg || (e instanceof Error ? e.message : String(e));
    message.error(`提供商配置加载失败：${loadError.value}`);
  } finally {
    loading.value = false;
  }
}

async function onSave(r: VendorRow): Promise<void> {
  if (!Number.isFinite(r.draft) || r.draft <= 0) {
    message.warning("阈值必须大于 0");
    return;
  }
  r.saving = true;
  try {
    await deviceApi.updateProviderConfig(r.vendor, r.draft);
    r.threshold = r.draft;
    r.dirty = false;
    message.success(`${r.label} 的离线阈值已更新为 ${r.draft} 秒`);
  } catch (e: unknown) {
    message.error(`保存失败：${(e as { msg?: string })?.msg || e}`);
  } finally {
    r.saving = false;
  }
}

function onReset(r: VendorRow): void {
  r.draft = r.threshold;
}

/** 一键保存全部已改动项 */
async function onSaveAll(): Promise<void> {
  const dirty = rows.value.filter((r) => r.dirty && Number.isFinite(r.draft) && r.draft > 0);
  if (!dirty.length) {
    message.info("没有待保存的改动");
    return;
  }
  for (const r of dirty) await onSave(r);
}

function onResetAll(): void {
  rows.value.forEach((r) => {
    r.draft = r.threshold;
  });
}

onMounted(fetchConfig);
</script>

<template>
  <div class="dpc">
    <!-- KPI 卡：接入厂商 / 待保存 / 平均阈值 / 阈值区间 -->
    <section class="dpc-kpis">
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

    <!-- 筛选与操作合并成一行：厂商搜索 + 查询 + 图标操作组（全部保存/全部还原/刷新） -->
    <section class="dpc-panel dpc-filter">
      <div class="dpc-field dpc-field--search">
        <ReInput v-model="keyword" placeholder="搜索厂商名称或厂商码..." clearable prefix-icon="Search" />
      </div>
      <span class="dpc-filter__meta">{{ filteredRows.length }} / {{ rows.length }} 个厂商</span>
      <ReButton icon="Search" :show-text="true" type="primary" :loading="loading" @click="fetchConfig">
        查询
      </ReButton>
      <div class="dpc-toolbar-ops">
        <ReButton
          icon="Check"
          layout="square"
          type="primary"
          tip="保存全部改动"
          :disabled="!dirtyCount"
          @click="onSaveAll"
        />
        <ReButton icon="RefreshLeft" layout="square" tip="还原全部改动" :disabled="!dirtyCount" @click="onResetAll" />
        <ReButton icon="RefreshRight" layout="square" tip="重新加载" :loading="loading" @click="fetchConfig" />
      </div>
    </section>

    <div v-if="loadError" class="dpc-error">
      <span>{{ loadError }}</span>
      <ReButton icon="RefreshRight" layout="square" tip="重试" :loading="loading" @click="fetchConfig" />
    </div>

    <!-- 表格卡：flex:1 + min-height:0 吃满剩余高度 -->
    <section class="dpc-panel dpc-table-card">
      <div v-if="!loading && !filteredRows.length" class="dpc-empty">
        <ReEmpty description="暂无提供商配置" :image-size="80" />
      </div>
      <ReTable
        v-else
        :data="filteredRows"
        :loading="loading"
        :columns="[
          { prop: 'label', label: '厂商', minWidth: 200 },
          { prop: 'vendor', label: '厂商码', width: 160, slot: 'vendor' },
          { prop: 'draft', label: '离线阈值（秒）', width: 200, slot: 'threshold' },
          { prop: 'hint', label: '提示', minWidth: 220, slot: 'hint' },
          { prop: 'actions', label: '操作', width: 110, slot: 'actions', align: 'right' },
        ]"
        size="default"
        :border="false"
        :stripe="false"
        table-id="device-provider-list"
        class="device-provider-table"
      >
        <template #col-vendor="{ row }">
          <span class="mono">{{ row.vendor }}</span>
        </template>
        <template #col-threshold="{ row }">
          <div class="dpc-th">
            <ReInputNumber
              v-model="row.draft"
              :min="1"
              :max="86400"
              :disabled="row.saving"
              style="width: 130px"
              @change="row.dirty = row.draft !== row.threshold"
            />
            <span v-if="row.dirty" class="dpc-dirty">已改</span>
          </div>
        </template>
        <template #col-hint="{ row }">
          <span :class="{ 'is-warn': !!thresholdHint(row.draft) }">
            {{ thresholdHint(row.draft) || "—" }}
          </span>
        </template>
        <template #col-actions="{ row }">
          <div class="dpc-ops">
            <ReButton
              icon="Check"
              layout="square"
              title="保存"
              :disabled="!row.dirty || row.draft <= 0"
              :loading="row.saving"
              @click="onSave(row)"
            />
            <ReButton icon="RefreshLeft" layout="square" title="还原" :disabled="!row.dirty" @click="onReset(row)" />
          </div>
        </template>
      </ReTable>
    </section>
  </div>
</template>

<style scoped lang="scss">
.dpc {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 10px 12px 12px;
  height: 100%;
  min-height: 0;
  color: var(--el-text-color-primary);
}

.dpc-kpis {
  flex: none;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.dpc-panel {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xl, 16px);
  box-shadow: var(--el-box-shadow-light, var(--shadow-1));
}

.dpc-filter {
  flex: none;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  padding: 12px 16px;
}
.dpc-toolbar-ops {
  display: flex;
  align-items: center;
  gap: 6px;
  padding-left: 10px;
  border-left: 1px solid var(--el-border-color-lighter);
}
.dpc-field--search {
  width: 280px;
}
.dpc-field--search :deep(.el-input) {
  width: 100%;
}
.dpc-filter__meta {
  margin-left: auto;
  font-size: 12.5px;
  color: var(--el-text-color-secondary);
}
@media (max-width: 900px) {
  .dpc-field--search {
    width: 100%;
  }
  .dpc-filter__meta {
    margin-left: 0;
  }
  .dpc-toolbar-ops {
    padding-left: 0;
    border-left: none;
  }
}

.dpc-error {
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

.dpc-table-card {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 6px 8px 8px;
}
.dpc-empty {
  flex: 1;
  display: grid;
  place-items: center;
}

/* 表格外观对齐 UI 稿 */
.dpc-table-card :deep(.re-table) {
  padding: 0;
  background: transparent;
}
.dpc-table-card :deep(.el-table) {
  --el-table-header-bg-color: var(--el-bg-color) !important;
}
.dpc-table-card :deep(.el-table th.el-table__cell) {
  padding: 14px 12px !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  text-transform: none !important;
  letter-spacing: 0 !important;
  color: var(--el-text-color-secondary);
  background: transparent !important;
}
.dpc-table-card :deep(.el-table td.el-table__cell) {
  padding: 15px 12px !important;
  font-size: 14px !important;
}

.mono {
  font-family: var(--el-font-family-mono, ui-monospace, SFMono-Regular, Consolas, monospace);
  font-variant-numeric: tabular-nums;
}

.dpc-th {
  display: flex;
  align-items: center;
  gap: 8px;
}
.dpc-dirty {
  font-size: 12px;
  color: var(--el-color-warning);
}
.is-warn {
  color: var(--el-color-warning);
}
.dpc-ops {
  display: flex;
  align-items: center;
  gap: 6px;
  justify-content: flex-end;
}
</style>