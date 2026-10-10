<script setup lang="ts">
/**
 * 通道管理 —— 单台设备下的视频/告警通道维护。
 *
 * 数据来自 device-starter 的 `/api/device/channel/*`：list 需必填 deviceId，
 * 另有新增、修改、删除与启用/禁用（PUT /{id}/status），经 monitor 应用承载。
 *
 * 视觉与布局对齐「代理管理」（ProxyView）：无顶部 hero、4 张紧凑 ReStatCard、
 * 筛选与操作合并成一行（新增通道并入图标操作组）、表格卡吃满剩余高度、
 * 统一 --el-* 变量；弹窗用 ReDialog + ReFormItem。
 *
 * @author CH
 * @since 4.0.0.42
 */
import { message } from "@repo/core";
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessageBox } from "element-plus";
import { CircleCheck, Connection, Grid, Tickets } from "@element-plus/icons-vue";
import ReStatCard from "@repo/ui/re-stat-card";
import deviceApi from "@pages/device/src/api/deviceApi";
import type { DeviceChannel, DeviceInfo } from "@pages/device/src/types/device";

/** 通道状态取值（后端 deviceChannelStatus 为字符串） */
const STATUS_OPTIONS = [
  { label: "启用", value: "enabled" },
  { label: "禁用", value: "disabled" },
];

const devices = ref<DeviceInfo[]>([]);
const devicesLoading = ref(false);

/** 选中设备：通道接口必填 deviceId */
const filters = reactive({ deviceId: "" });

const channels = ref<DeviceChannel[]>([]);
const loading = ref(false);
const loadError = ref("");

/** 新增/编辑弹窗 */
const dialogVisible = ref(false);
const dialogSaving = ref(false);
const editingId = ref<string | null>(null);
const form = reactive({
  deviceChannelNo: 1,
  deviceChannelName: "",
  deviceChannelType: "main",
  deviceChannelStatus: "enabled",
  deviceChannelSort: 1,
});

const deviceOptions = computed(() =>
  devices.value.map((d) => ({
    value: d.deviceInfoId,
    label: `${d.deviceInfoName || d.deviceInfoId}（${d.deviceInfoIp || "无 IP"}）`,
  }))
);

const currentDeviceName = computed(
  () => devices.value.find((d) => d.deviceInfoId === filters.deviceId)?.deviceInfoName || "未选择设备"
);

/** 已被其他通道占用的通道号（编辑时排除自身） */
const usedNos = computed(
  () =>
    new Set(
      channels.value.filter((c) => c.deviceChannelId !== editingId.value).map((c) => c.deviceChannelNo)
    )
);

const enabledCount = computed(() => channels.value.filter((c) => c.deviceChannelStatus === "enabled").length);
const disabledCount = computed(() => channels.value.length - enabledCount.value);

const kpis = computed(() => [
  {
    key: "total",
    title: "通道总数",
    value: channels.value.length,
    desc: currentDeviceName.value,
    icon: Tickets,
    iconColor: "var(--el-color-primary)",
  },
  {
    key: "enabled",
    title: "已启用",
    value: enabledCount.value,
    desc: "可出流 / 可上报",
    icon: CircleCheck,
    iconColor: "var(--el-color-success)",
  },
  {
    key: "disabled",
    title: "已禁用",
    value: disabledCount.value,
    desc: "不占用采集资源",
    icon: Grid,
    iconColor: "var(--el-color-info)",
  },
  {
    key: "devices",
    title: "可选设备",
    value: devices.value.length,
    desc: "来自设备台账",
    icon: Connection,
    iconColor: "var(--metric-disk, var(--el-color-warning))",
  },
]);

/** 表单校验：通道号必填且不可重复 */
const noInvalid = computed(() => !form.deviceChannelNo || usedNos.value.has(form.deviceChannelNo));

function statusMeta(value?: string) {
  return value === "enabled" ? { label: "启用", tag: "success" } : { label: "禁用", tag: "info" };
}

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

/** 拉取选中设备的通道；未选设备时清空 */
async function fetchChannels(): Promise<void> {
  if (!filters.deviceId) {
    channels.value = [];
    return;
  }
  loading.value = true;
  loadError.value = "";
  try {
    channels.value = (await deviceApi.listChannels(filters.deviceId)) || [];
  } catch (e: unknown) {
    channels.value = [];
    loadError.value = (e as { msg?: string })?.msg || (e instanceof Error ? e.message : String(e));
    message.error(`通道加载失败：${loadError.value}`);
  } finally {
    loading.value = false;
  }
}

function openCreate(): void {
  editingId.value = null;
  Object.assign(form, {
    deviceChannelNo: 1,
    deviceChannelName: "",
    deviceChannelType: "main",
    deviceChannelStatus: "enabled",
    deviceChannelSort: 1,
  });
  dialogVisible.value = true;
}

function openEdit(row: DeviceChannel): void {
  editingId.value = row.deviceChannelId;
  Object.assign(form, {
    deviceChannelNo: row.deviceChannelNo,
    deviceChannelName: row.deviceChannelName,
    deviceChannelType: row.deviceChannelType,
    deviceChannelStatus: row.deviceChannelStatus,
    deviceChannelSort: row.deviceChannelSort,
  });
  dialogVisible.value = true;
}

async function onSubmit(): Promise<void> {
  if (noInvalid.value) {
    message.warning("请填写未占用的通道号");
    return;
  }
  dialogSaving.value = true;
  try {
    const payload = { ...form, deviceChannelDeviceId: filters.deviceId } as DeviceChannel;
    if (editingId.value) {
      await deviceApi.updateChannel(editingId.value, payload);
      message.success("通道已更新");
    } else {
      await deviceApi.addChannel(payload);
      message.success("通道已新增");
    }
    dialogVisible.value = false;
    await fetchChannels();
  } catch (e: unknown) {
    message.error(`保存失败：${(e as { msg?: string })?.msg || e}`);
  } finally {
    dialogSaving.value = false;
  }
}

async function onToggle(row: DeviceChannel): Promise<void> {
  const next = row.deviceChannelStatus === "enabled" ? "disabled" : "enabled";
  try {
    await deviceApi.toggleChannelStatus(row.deviceChannelId, next);
    message.success(next === "enabled" ? "已启用" : "已禁用");
    await fetchChannels();
  } catch (e: unknown) {
    message.error(`操作失败：${(e as { msg?: string })?.msg || e}`);
  }
}

async function onDelete(row: DeviceChannel): Promise<void> {
  try {
    await ElMessageBox.confirm(
      `确认删除通道「${row.deviceChannelName || row.deviceChannelNo}」？`,
      "删除确认",
      { type: "warning" }
    );
  } catch {
    return;
  }
  try {
    await deviceApi.deleteChannel(row.deviceChannelId);
    message.success("通道已删除");
    await fetchChannels();
  } catch (e: unknown) {
    message.error(`删除失败：${(e as { msg?: string })?.msg || e}`);
  }
}

onMounted(fetchDevices);
</script>

<template>
  <div class="dch">
    <!-- KPI 卡：通道总数 / 已启用 / 已禁用 / 可选设备 -->
    <section class="dch-kpis">
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

    <!-- 筛选与操作合并成一行：设备选择 + 查询 + 图标操作组（新增/刷新） -->
    <section class="dch-panel dch-filter">
      <div class="dch-field dch-field--device">
        <ReSelect
          v-model="filters.deviceId"
          placeholder="选择设备（必选）"
          filterable
          :options="deviceOptions"
          @change="fetchChannels"
        />
      </div>
      <span class="dch-filter__meta">{{ channels.length }} 路通道</span>
      <ReButton
        icon="Search"
        :show-text="true"
        type="primary"
        :disabled="!filters.deviceId"
        :loading="loading"
        @click="fetchChannels"
      >
        查询
      </ReButton>
      <div class="dch-toolbar-ops">
        <ReButton icon="Plus" layout="square" type="primary" tip="新增通道" :disabled="!filters.deviceId" @click="openCreate" />
        <ReButton icon="RefreshRight" layout="square" tip="重新加载" :disabled="!filters.deviceId" :loading="loading" @click="fetchChannels" />
      </div>
    </section>

    <div v-if="loadError" class="dch-error">
      <span>{{ loadError }}</span>
      <ReButton icon="RefreshRight" layout="square" tip="重试" :loading="loading" @click="fetchChannels" />
    </div>

    <!-- 表格卡：flex:1 + min-height:0 吃满剩余高度 -->
    <section class="dch-panel dch-table-card">
      <div v-if="!loading && !channels.length" class="dch-empty">
        <ReEmpty description="暂无通道，请选择设备后点击「查询」，或新增通道" :image-size="80" />
      </div>
      <ReTable
        v-else
        :data="channels"
        :loading="loading"
        :columns="[
          { prop: 'deviceChannelNo', label: '通道号', width: 90, align: 'center' },
          { prop: 'deviceChannelName', label: '通道名称', minWidth: 160 },
          { prop: 'deviceChannelType', label: '类型', width: 110 },
          { prop: 'deviceChannelStatus', label: '状态', width: 100, slot: 'status' },
          { prop: 'deviceChannelSort', label: '排序', width: 80, align: 'center' },
          { prop: 'actions', label: '操作', width: 170, slot: 'actions' },
        ]"
        size="default"
        :border="false"
        :stripe="false"
        table-id="device-channel-list"
        class="device-channel-table"
      >
        <template #col-status="{ row }">
          <ReTag :type="statusMeta(row.deviceChannelStatus).tag as never" size="small">
            {{ statusMeta(row.deviceChannelStatus).label }}
          </ReTag>
        </template>
        <template #col-actions="{ row }">
          <div class="dch-ops">
            <ReButton icon="EditPen" layout="square" title="编辑" @click="openEdit(row)" />
            <ReButton
              :icon="row.deviceChannelStatus === 'enabled' ? 'VideoPause' : 'VideoPlay'"
              layout="square"
              :title="row.deviceChannelStatus === 'enabled' ? '禁用' : '启用'"
              @click="onToggle(row)"
            />
            <ReButton icon="Delete" layout="square" title="删除" @click="onDelete(row)" />
          </div>
        </template>
      </ReTable>
    </section>

    <ReDialog
      v-model="dialogVisible"
      :title="editingId ? '编辑通道' : '新增通道'"
      width="480px"
      :close-on-click-modal="false"
    >
      <div class="dch-form">
        <ReFormItem label="通道号" required>
          <ReInputNumber v-model="form.deviceChannelNo" :min="1" :max="999" style="width: 100%" />
          <span v-if="noInvalid" class="dch-hint">通道号必填且不可与其他通道重复</span>
        </ReFormItem>
        <ReFormItem label="通道名称">
          <ReInput v-model="form.deviceChannelName" placeholder="如：主码流" />
        </ReFormItem>
        <ReFormItem label="类型">
          <ReInput v-model="form.deviceChannelType" placeholder="如：main / sub" />
        </ReFormItem>
        <ReFormItem label="状态">
          <ReSelect v-model="form.deviceChannelStatus" :options="STATUS_OPTIONS" style="width: 100%" />
        </ReFormItem>
        <ReFormItem label="排序">
          <ReInputNumber v-model="form.deviceChannelSort" :min="1" :max="999" style="width: 100%" />
        </ReFormItem>
      </div>
      <template #footer>
        <ReButton @click="dialogVisible = false">取消</ReButton>
        <ReButton type="primary" :loading="dialogSaving" :disabled="noInvalid" @click="onSubmit">
          保存
        </ReButton>
      </template>
    </ReDialog>
  </div>
</template>

<style scoped lang="scss">
.dch {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 10px 12px 12px;
  height: 100%;
  min-height: 0;
  color: var(--el-text-color-primary);
}

.dch-kpis {
  flex: none;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.dch-panel {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xl, 16px);
  box-shadow: var(--el-box-shadow-light, var(--shadow-1));
}

.dch-filter {
  flex: none;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  padding: 12px 16px;
}
.dch-toolbar-ops {
  display: flex;
  align-items: center;
  gap: 6px;
  padding-left: 10px;
  border-left: 1px solid var(--el-border-color-lighter);
}
.dch-field--device {
  width: 260px;
}
.dch-field--device :deep(.el-select) {
  width: 100%;
}
.dch-filter__meta {
  margin-left: auto;
  font-size: 12.5px;
  color: var(--el-text-color-secondary);
}
@media (max-width: 900px) {
  .dch-field--device {
    width: 100%;
  }
  .dch-filter__meta {
    margin-left: 0;
  }
  .dch-toolbar-ops {
    padding-left: 0;
    border-left: none;
  }
}

.dch-error {
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

.dch-table-card {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 6px 8px 8px;
}
.dch-empty {
  flex: 1;
  display: grid;
  place-items: center;
}

/* 表格外观对齐 UI 稿 */
.dch-table-card :deep(.re-table) {
  padding: 0;
  background: transparent;
}
.dch-table-card :deep(.el-table) {
  --el-table-header-bg-color: var(--el-bg-color) !important;
}
.dch-table-card :deep(.el-table th.el-table__cell) {
  padding: 14px 12px !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  text-transform: none !important;
  letter-spacing: 0 !important;
  color: var(--el-text-color-secondary);
  background: transparent !important;
}
.dch-table-card :deep(.el-table td.el-table__cell) {
  padding: 15px 12px !important;
  font-size: 14px !important;
}

.dch-ops {
  display: flex;
  align-items: center;
  gap: 6px;
  justify-content: flex-end;
}

.dch-hint {
  margin-left: 10px;
  font-size: 12px;
  color: var(--el-color-danger);
}
</style>