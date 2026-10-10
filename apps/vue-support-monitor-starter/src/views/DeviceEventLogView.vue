<script setup lang="ts">
/**
 * 设备日志 —— 设备侧的时间序事件记录。
 *
 * 数据来自 device-starter 的 `GET /api/device/events`，返回 `DeviceEventRecord` 列表
 * （deviceId / channelNo / eventType / detail / occurredAt），经 monitor 应用承载。
 *
 * ⚠ 后端该端点的 `deviceId` 是**必填**参数，没有「列出全部设备日志」的形态，
 * 因此本页先加载设备清单、再按选中设备查询，不做跨设备聚合。
 *
 * 视觉与布局对齐「代理管理」（ProxyView）：无顶部 hero、4 张紧凑 ReStatCard、
 * 筛选与操作合并成一行、表格卡吃满剩余高度、统一 --el-* 变量。
 *
 * @author CH
 * @since 4.0.0.42
 */
import { message } from "@repo/core";
import { computed, onMounted, reactive, ref } from "vue";

import { Bell, Connection, OfficeBuilding, Tickets } from "@element-plus/icons-vue";
import ReStatCard from "@repo/ui/re-stat-card";
import deviceApi from "@pages/device/src/api/deviceApi";
import type { DeviceEvent, DeviceInfo } from "@pages/device/src/types/device";

/** 事件类型（对应后端 spi.model.EventType），用于筛选项与展示 */
const EVENT_TYPES = [
  { label: "移动侦测", value: "MOTION" },
  { label: "IO 报警", value: "IO_ALARM" },
  { label: "门禁事件", value: "ACCESS" },
  { label: "温度报警", value: "TEMP" },
  { label: "网络异常", value: "NETWORK" },
  { label: "其他", value: "OTHER" },
];

const EVENT_TYPE_MAP = new Map<string, { label: string; tag: string }>(EVENT_TYPES.map((t) => [
  t.value,
  { label: t.label, tag: "info" },
]));
EVENT_TYPE_MAP.set("MOTION", { label: "移动侦测", tag: "primary" });
EVENT_TYPE_MAP.set("IO_ALARM", { label: "IO 报警", tag: "danger" });
EVENT_TYPE_MAP.set("ACCESS", { label: "门禁事件", tag: "warning" });
EVENT_TYPE_MAP.set("TEMP", { label: "温度报警", tag: "danger" });
EVENT_TYPE_MAP.set("NETWORK", { label: "网络异常", tag: "warning" });

/** 计入「告警事件」的类型（其余为普通/其他） */
const ALARM_TYPES = new Set(["IO_ALARM", "TEMP", "NETWORK"]);

const devices = ref<DeviceInfo[]>([]);
const devicesLoading = ref(false);

/** 选中设备：后端必填，故初始为空并禁用查询 */
const filters = reactive({ deviceId: "", type: "", range: null as [string, string] | null });

const events = ref<DeviceEvent[]>([]);
const loading = ref(false);
const loadError = ref("");

const deviceOptions = computed(() =>
  devices.value.map((d) => ({
    value: d.deviceInfoId,
    label: `${d.deviceInfoName || d.deviceInfoId}（${d.deviceInfoIp || "无 IP"}）`,
  }))
);

const currentDeviceName = computed(
  () => devices.value.find((d) => d.deviceInfoId === filters.deviceId)?.deviceInfoName || "未选择设备"
);

/** 告警类事件数 */
const alarmCount = computed(
  () => events.value.filter((e) => ALARM_TYPES.has(e.deviceEventRecordEventType || "")).length
);

/** 涉及通道数（去重） */
const channelCount = computed(
  () =>
    new Set(
      events.value
        .map((e) => e.deviceEventRecordChannelNo)
        .filter((n): n is number => typeof n === "number")
    ).size
);

/** 最新事件时刻 */
const latestAt = computed(() => {
  const times = events.value
    .map((e) => e.deviceEventRecordOccurredAt)
    .filter((v): v is string => !!v)
    .map((v) => new Date(v).getTime())
    .filter((t) => !Number.isNaN(t));
  return times.length ? new Date(Math.max(...times)) : null;
});

const kpis = computed(() => [
  {
    key: "total",
    title: "事件记录",
    value: events.value.length,
    desc: currentDeviceName.value,
    icon: Tickets,
    iconColor: "var(--el-color-primary)",
  },
  {
    key: "alarm",
    title: "告警事件",
    value: alarmCount.value,
    desc: "IO / 温度 / 网络",
    icon: Bell,
    iconColor: "var(--el-color-danger)",
  },
  {
    key: "channel",
    title: "涉及通道",
    value: channelCount.value,
    desc: "去重后的通道数",
    icon: Connection,
    iconColor: "var(--metric-disk, var(--el-color-warning))",
  },
  {
    key: "latest",
    title: "最新事件",
    value: latestAt.value ? latestAt.value.toLocaleDateString("zh-CN") : "—",
    desc: latestAt.value ? latestAt.value.toLocaleTimeString("zh-CN", { hour12: false }) : "暂无记录",
    icon: OfficeBuilding,
    iconColor: "var(--el-color-info)",
  },
]);

function typeMeta(value?: string) {
  return EVENT_TYPE_MAP.get(value || "") || { label: value || "—", tag: "info" };
}

function fmtTime(v?: string): string {
  if (!v) return "—";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? v : d.toLocaleString("zh-CN", { hour12: false });
}

/** 加载设备清单（查询对象） */
async function fetchDevices(): Promise<void> {
  devicesLoading.value = true;
  try {
    devices.value = (await deviceApi.list()) || [];
  } catch (e: unknown) {
    devices.value = [];
    message.error(`设备清单加载失败：${(e as { msg?: string })?.msg || e}`);
  } finally {
    devicesLoading.value = false;
  }
}

/** 按选中设备查询事件 */
async function fetchEvents(): Promise<void> {
  if (!filters.deviceId) {
    message.warning("请先选择设备");
    return;
  }
  loading.value = true;
  loadError.value = "";
  try {
    const params: { deviceId: string; type?: string; start?: string; end?: string } = {
      deviceId: filters.deviceId,
    };
    if (filters.type) params.type = filters.type;
    if (filters.range?.[0]) params.start = filters.range[0];
    if (filters.range?.[1]) params.end = filters.range[1];
    events.value = (await deviceApi.queryEvents(params)) || [];
  } catch (e: unknown) {
    events.value = [];
    loadError.value = (e as { msg?: string })?.msg || (e instanceof Error ? e.message : String(e));
    message.error(`事件加载失败：${loadError.value}`);
  } finally {
    loading.value = false;
  }
}

function onReset(): void {
  filters.type = "";
  filters.range = null;
  fetchEvents();
}

onMounted(fetchDevices);
</script>

<template>
  <div class="del">
    <!-- KPI 卡：事件记录 / 告警事件 / 涉及通道 / 最新事件 -->
    <section class="del-kpis">
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

    <!-- 筛选与操作合并成一行：设备 / 事件类型 / 时间范围 + 查询 + 图标操作组。
         设备为后端必填项，故未选时查询按钮禁用。 -->
    <section class="del-panel del-filter">
      <div class="del-field del-field--device">
        <ReSelect
          v-model="filters.deviceId"
          placeholder="选择设备（必选）"
          filterable
          :options="deviceOptions"
          @change="fetchEvents"
        />
      </div>
      <div class="del-field">
        <ReSelect v-model="filters.type" placeholder="全部类型" clearable :options="EVENT_TYPES" />
      </div>
      <div class="del-field del-field--range">
        <el-date-picker
          v-model="filters.range"
          type="datetimerange"
          range-separator="→"
          start-placeholder="开始"
          end-placeholder="结束"
          value-format="YYYY-MM-DDTHH:mm:ss"
          style="width: 100%"
        />
      </div>
      <span class="del-filter__meta">{{ events.length }} 条事件</span>
      <ReButton
        icon="Search"
        :show-text="true"
        type="primary"
        :disabled="!filters.deviceId"
        :loading="loading"
        @click="fetchEvents"
      >
        查询
      </ReButton>
      <div class="del-toolbar-ops">
        <ReButton icon="RefreshRight" layout="square" tip="重新查询" :loading="loading" @click="fetchEvents" />
        <ReButton icon="Delete" layout="square" tip="重置筛选条件" @click="onReset" />
      </div>
    </section>

    <div v-if="loadError" class="del-error">
      <span>{{ loadError }}</span>
      <ReButton icon="RefreshRight" layout="square" tip="重试" :loading="loading" @click="fetchEvents" />
    </div>

    <!-- 表格卡：flex:1 + min-height:0 吃满剩余高度 -->
    <section class="del-panel del-table-card">
      <div v-if="!loading && !events.length" class="del-empty">
        <ReEmpty description="暂无事件记录，请选择设备后点击「查询」" :image-size="80" />
      </div>
      <ReTable
        v-else
        :data="events"
        :loading="loading"
        :columns="[
          { prop: 'deviceEventRecordOccurredAt', label: '发生时间', width: 180, slot: 'time' },
          { prop: 'deviceEventRecordChannelNo', label: '通道', width: 80, align: 'center' },
          { prop: 'deviceEventRecordEventType', label: '事件类型', width: 120, slot: 'type' },
          { prop: 'deviceEventRecordDetail', label: '详情', minWidth: 260, slot: 'detail' },
          { prop: 'deviceEventRecordDeviceId', label: '设备 ID', minWidth: 200, slot: 'deviceId' },
        ]"
        size="default"
        :border="false"
        :stripe="false"
        table-id="device-event-list"
        class="device-event-table"
      >
        <template #col-time="{ row }">{{ fmtTime(row.deviceEventRecordOccurredAt) }}</template>
        <template #col-type="{ row }">
          <ReTag :type="typeMeta(row.deviceEventRecordEventType).tag as never" size="small">
            {{ typeMeta(row.deviceEventRecordEventType).label }}
          </ReTag>
        </template>
        <template #col-detail="{ row }">
          <span class="del-detail">{{ row.deviceEventRecordDetail || "—" }}</span>
        </template>
        <template #col-deviceId="{ row }">
          <span class="mono">{{ row.deviceEventRecordDeviceId || "—" }}</span>
        </template>
      </ReTable>
    </section>
  </div>
</template>

<style scoped lang="scss">
.del {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 10px 12px 12px;
  height: 100%;
  min-height: 0;
  color: var(--el-text-color-primary);
}

.del-kpis {
  flex: none;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.del-panel {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xl, 16px);
  box-shadow: var(--el-box-shadow-light, var(--shadow-1));
}

.del-filter {
  flex: none;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  padding: 12px 16px;
}
.del-toolbar-ops {
  display: flex;
  align-items: center;
  gap: 6px;
  padding-left: 10px;
  border-left: 1px solid var(--el-border-color-lighter);
}
.del-field {
  width: 160px;
}
.del-field--device {
  width: 240px;
}
.del-field--range {
  width: 320px;
}
.del-field :deep(.el-select) {
  width: 100%;
}
.del-filter__meta {
  margin-left: auto;
  font-size: 12.5px;
  color: var(--el-text-color-secondary);
}
@media (max-width: 900px) {
  .del-field,
  .del-field--device,
  .del-field--range {
    width: 100%;
  }
  .del-filter__meta {
    margin-left: 0;
  }
  .del-toolbar-ops {
    padding-left: 0;
    border-left: none;
  }
}

.del-error {
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

.del-table-card {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 6px 8px 8px;
}
.del-empty {
  flex: 1;
  display: grid;
  place-items: center;
}

/* 表格外观对齐 UI 稿 */
.del-table-card :deep(.re-table) {
  padding: 0;
  background: transparent;
}
.del-table-card :deep(.el-table) {
  --el-table-header-bg-color: var(--el-bg-color) !important;
}
.del-table-card :deep(.el-table th.el-table__cell) {
  padding: 14px 12px !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  text-transform: none !important;
  letter-spacing: 0 !important;
  color: var(--el-text-color-secondary);
  background: transparent !important;
}
.del-table-card :deep(.el-table td.el-table__cell) {
  padding: 15px 12px !important;
  font-size: 14px !important;
}

.mono {
  font-family: var(--el-font-family-mono, ui-monospace, SFMono-Regular, Consolas, monospace);
  font-variant-numeric: tabular-nums;
}
.del-detail {
  font-size: 13.5px;
  color: var(--el-text-color-primary);
}
</style>