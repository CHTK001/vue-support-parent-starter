<script setup lang="ts">
/**
 * 设备日志 —— 设备侧的时间序事件记录。
 *
 * 数据来自 device-starter 的 `GET /api/device/events`，返回 `DeviceEventRecord` 列表
 * （deviceId / channelNo / eventType / detail / occurredAt）。
 *
 * ⚠ 后端该端点的 `deviceId` 是**必填**参数，没有「列出全部设备日志」的形态，
 * 因此本页先加载设备清单、再按选中设备查询，不做跨设备聚合。
 *
 * 与「设备资产」的区别：设备资产是台账快照（当前有多少台、在线几何），
 * 本页是单台设备的历史事件流水。
 *
 * @author CH
 * @since 4.0.0.42
 */
import { computed, onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import deviceApi from "@pages/device/src/api/deviceApi";
import type { DeviceEvent, DeviceInfo } from "@pages/device/src/types/device";

/** 事件类型枚举（对应后端 spi.model.EventType），仅用于筛选项与中文展示 */
const EVENT_TYPES: { value: string; label: string; tag: string }[] = [
  { value: "MOTION", label: "移动侦测", tag: "primary" },
  { value: "IO_ALARM", label: "IO 报警", tag: "danger" },
  { value: "ACCESS", label: "门禁事件", tag: "warning" },
  { value: "TEMP", label: "温度报警", tag: "danger" },
  { value: "NETWORK", label: "网络异常", tag: "warning" },
  { value: "OTHER", label: "其他", tag: "info" },
];

const EVENT_TYPE_MAP = new Map(EVENT_TYPES.map((t) => [t.value, t]));

/** 设备清单（用于选择查询对象） */
const devices = ref<DeviceInfo[]>([]);
const devicesLoading = ref(false);

/** 选中的设备 id；后端必填，故初始为空并禁用查询 */
const deviceId = ref("");

/** 过滤条件 */
const typeFilter = ref("");
const range = ref<[string, string] | null>(null);

/** 事件列表 */
const events = ref<DeviceEvent[]>([]);
const loading = ref(false);
const loadError = ref("");

/** 设备下拉选项 */
const deviceOptions = computed(() =>
  devices.value.map((d) => ({
    value: d.deviceInfoId,
    label: `${d.deviceInfoName || d.deviceInfoId}（${d.deviceInfoIp || "无 IP"}）`,
  }))
);

/** 当前选中设备名，用于结果区标题 */
const currentDeviceName = computed(
  () => devices.value.find((d) => d.deviceInfoId === deviceId.value)?.deviceInfoName || ""
);

/** 未选设备时禁止查询 */
const canQuery = computed(() => !!deviceId.value);

/** 把 ISO 时刻格式化为「MM-DD HH:mm:ss」，跨天也能一眼定位 */
function formatTime(value?: string): string {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

/** 事件类型 → 展示名与标签色 */
function typeMeta(value?: string) {
  return EVENT_TYPE_MAP.get(value || "") || { label: value || "-", tag: "info" };
}

/** 加载设备清单 */
async function fetchDevices() {
  devicesLoading.value = true;
  try {
    devices.value = (await deviceApi.list()) || [];
  } catch (e) {
    devices.value = [];
    ElMessage.error(`设备清单加载失败：${e instanceof Error ? e.message : e}`);
  } finally {
    devicesLoading.value = false;
  }
}

/** 按选中设备查询事件 */
async function fetchEvents() {
  if (!deviceId.value) {
    ElMessage.warning("请先选择设备");
    return;
  }
  loading.value = true;
  loadError.value = "";
  try {
    const params: { deviceId: string; type?: string; start?: string; end?: string } = {
      deviceId: deviceId.value,
    };
    if (typeFilter.value) params.type = typeFilter.value;
    if (range.value?.[0]) params.start = range.value[0];
    if (range.value?.[1]) params.end = range.value[1];
    events.value = (await deviceApi.queryEvents(params)) || [];
  } catch (e) {
    events.value = [];
    loadError.value = e instanceof Error ? e.message : String(e);
    ElMessage.error(`事件加载失败：${loadError.value}`);
  } finally {
    loading.value = false;
  }
}

/** 重置过滤条件（保留设备选择） */
function onReset() {
  typeFilter.value = "";
  range.value = null;
  fetchEvents();
}

onMounted(fetchDevices);
</script>

<template>
  <div class="del">
    <div class="page-header">
      <div>
        <h1 class="page-title">设备日志</h1>
        <p class="page-desc">
          设备侧事件流水 · 按设备查询{{ currentDeviceName ? ` · 当前：${currentDeviceName}` : "" }}
        </p>
      </div>
    </div>

    <div class="as-panel as-filter">
      <div class="filter">
        <div class="fld fld-grow">
          <label>设备</label>
          <el-select
            v-model="deviceId"
            filterable
            placeholder="选择设备（必选）"
            :loading="devicesLoading"
            style="width: 100%"
          >
            <el-option
              v-for="o in deviceOptions"
              :key="o.value"
              :label="o.label"
              :value="o.value"
            />
          </el-select>
        </div>
        <div class="fld">
          <label>事件类型</label>
          <el-select v-model="typeFilter" placeholder="全部" clearable style="width: 140px">
            <el-option
              v-for="t in EVENT_TYPES"
              :key="t.value"
              :label="t.label"
              :value="t.value"
            />
          </el-select>
        </div>
        <div class="fld fld-wide">
          <label>发生时间</label>
          <el-date-picker
            v-model="range"
            type="datetimerange"
            range-separator="→"
            start-placeholder="开始"
            end-placeholder="结束"
            value-format="YYYY-MM-DDTHH:mm:ss"
            style="width: 100%"
          />
        </div>
        <div class="fld fld-btns">
          <el-button type="primary" :disabled="!canQuery" :loading="loading" @click="fetchEvents">
            查询
          </el-button>
          <el-button :disabled="!canQuery" @click="onReset">重置</el-button>
        </div>
      </div>
    </div>

    <div v-if="loadError" class="as-error">
      <span>加载失败：{{ loadError }}</span>
      <el-button size="small" @click="fetchEvents">重试</el-button>
    </div>

    <div class="as-panel">
      <el-table
        :data="events"
        v-loading="loading"
        border
        stripe
        max-height="560"
        empty-text="暂无事件记录"
      >
        <el-table-column label="发生时间" width="150">
          <template #default="{ row }">{{ formatTime(row.deviceEventRecordOccurredAt) }}</template>
        </el-table-column>
        <el-table-column label="通道" width="80" align="center">
          <template #default="{ row }">
            {{ row.deviceEventRecordChannelNo ?? "-" }}
          </template>
        </el-table-column>
        <el-table-column label="事件类型" width="120">
          <template #default="{ row }">
            <el-tag :type="typeMeta(row.deviceEventRecordEventType).tag as never">
              {{ typeMeta(row.deviceEventRecordEventType).label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="详情" min-width="260" show-overflow-tooltip>
          <template #default="{ row }">{{ row.deviceEventRecordDetail || "-" }}</template>
        </el-table-column>
        <el-table-column label="设备 ID" width="220" show-overflow-tooltip>
          <template #default="{ row }">{{ row.deviceEventRecordDeviceId || "-" }}</template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<style scoped lang="scss">
.del {
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

.filter {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  flex-wrap: wrap;
}

.fld {
  display: flex;
  flex-direction: column;
  gap: 6px;

  label {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
}

.fld-grow {
  flex: 1 1 260px;
  min-width: 220px;
}

.fld-wide {
  flex: 1 1 340px;
  min-width: 300px;
}

.fld-btns {
  flex-direction: row;
  align-items: center;
  gap: 8px;
  padding-bottom: 1px;
}
</style>