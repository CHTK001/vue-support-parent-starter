<script setup lang="ts">
/**
 * 通道管理 —— 单台设备下的视频/告警通道维护。
 *
 * 数据来自 device-starter 的 `/api/device/channel/*`：list 需必填 deviceId，
 * 另有新增、修改、删除与启用/禁用（PUT /{id}/status）。
 *
 * 与「设备资产」的边界：设备资产是只读台账，本页是通道的增删改。
 *
 * @author CH
 * @since 4.0.0.42
 */
import { computed, onMounted, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import deviceApi from "@pages/device/src/api/deviceApi";
import type { DeviceChannel, DeviceInfo } from "@pages/device/src/types/device";

/** 通道状态取值（后端 deviceChannelStatus 为字符串） */
const STATUS = [
  { value: "enabled", label: "启用", tag: "success" },
  { value: "disabled", label: "禁用", tag: "info" },
] as const;

/** 显式标注键为 string：STATUS 是 as const，不标注会把键收窄成字面量联合，
 *  导致 statusMeta(deviceChannelStatus: string) 传不进来 */
const STATUS_MAP = new Map<string, (typeof STATUS)[number]>(STATUS.map((s) => [s.value, s]));

const devices = ref<DeviceInfo[]>([]);
const devicesLoading = ref(false);

/** 选中的设备；通道接口必填 deviceId */
const deviceId = ref("");

const channels = ref<DeviceChannel[]>([]);
const loading = ref(false);
const loadError = ref("");

/** 新增/编辑弹窗 */
const dialogVisible = ref(false);
const dialogSaving = ref(false);
const editingId = ref<string | null>(null);
const form = ref<Partial<DeviceChannel>>({
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
  () => devices.value.find((d) => d.deviceInfoId === deviceId.value)?.deviceInfoName || ""
);

/** 已被其他通道占用的通道号（编辑时排除自身） */
const usedNos = computed(
  () =>
    new Set(
      channels.value
        .filter((c) => c.deviceChannelId !== editingId.value)
        .map((c) => c.deviceChannelNo)
    )
);

/** 表单校验：通道号必填且不可重复 */
const noInvalid = computed(
  () => !form.value.deviceChannelNo || usedNos.value.has(form.value.deviceChannelNo)
);

function statusMeta(value?: string) {
  return STATUS_MAP.get(value || "") || { label: value || "-", tag: "info" };
}

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

/** 拉取选中设备的通道；未选设备时清空并给出提示 */
async function fetchChannels() {
  if (!deviceId.value) {
    channels.value = [];
    return;
  }
  loading.value = true;
  loadError.value = "";
  try {
    channels.value = (await deviceApi.listChannels(deviceId.value)) || [];
  } catch (e) {
    channels.value = [];
    loadError.value = e instanceof Error ? e.message : String(e);
    ElMessage.error(`通道加载失败：${loadError.value}`);
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  editingId.value = null;
  form.value = {
    deviceChannelNo: 1,
    deviceChannelName: "",
    deviceChannelType: "main",
    deviceChannelStatus: "enabled",
    deviceChannelSort: 1,
  };
  dialogVisible.value = true;
}

function openEdit(row: DeviceChannel) {
  editingId.value = row.deviceChannelId;
  form.value = { ...row };
  dialogVisible.value = true;
}

async function onSubmit() {
  if (noInvalid.value) {
    ElMessage.warning("请填写未占用的通道号");
    return;
  }
  dialogSaving.value = true;
  try {
    const payload = { ...form.value, deviceChannelDeviceId: deviceId.value } as DeviceChannel;
    if (editingId.value) {
      await deviceApi.updateChannel(editingId.value, payload);
      ElMessage.success("通道已更新");
    } else {
      await deviceApi.addChannel(payload);
      ElMessage.success("通道已新增");
    }
    dialogVisible.value = false;
    await fetchChannels();
  } catch (e) {
    ElMessage.error(`保存失败：${e instanceof Error ? e.message : e}`);
  } finally {
    dialogSaving.value = false;
  }
}

async function onToggle(row: DeviceChannel) {
  const next = row.deviceChannelStatus === "enabled" ? "disabled" : "enabled";
  try {
    await deviceApi.toggleChannelStatus(row.deviceChannelId, next);
    ElMessage.success(next === "enabled" ? "已启用" : "已禁用");
    await fetchChannels();
  } catch (e) {
    ElMessage.error(`操作失败：${e instanceof Error ? e.message : e}`);
  }
}

async function onDelete(row: DeviceChannel) {
  try {
    await ElMessageBox.confirm(
      `确认删除通道「${row.deviceChannelName || row.deviceChannelNo}」？`,
      "删除通道",
      { type: "warning", confirmButtonText: "删除", cancelButtonText: "取消" }
    );
  } catch {
    return; // 用户取消
  }
  try {
    await deviceApi.deleteChannel(row.deviceChannelId);
    ElMessage.success("通道已删除");
    await fetchChannels();
  } catch (e) {
    ElMessage.error(`删除失败：${e instanceof Error ? e.message : e}`);
  }
}

onMounted(fetchDevices);
</script>

<template>
  <div class="dch">
    <div class="page-header">
      <div>
        <h1 class="page-title">通道管理</h1>
        <p class="page-desc">
          设备通道维护 ·
          {{ deviceId ? `${currentDeviceName} · ${channels.length} 路` : "请先选择设备" }}
        </p>
      </div>
      <div class="page-actions">
        <el-button type="primary" :disabled="!deviceId" @click="openCreate">新增通道</el-button>
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
            @change="fetchChannels"
          >
            <el-option
              v-for="o in deviceOptions"
              :key="o.value"
              :label="o.label"
              :value="o.value"
            />
          </el-select>
        </div>
        <div class="fld fld-btns">
          <el-button :loading="loading" :disabled="!deviceId" @click="fetchChannels">刷新</el-button>
        </div>
      </div>
    </div>

    <div v-if="loadError" class="as-error">
      <span>加载失败：{{ loadError }}</span>
      <el-button size="small" @click="fetchChannels">重试</el-button>
    </div>

    <div class="as-panel">
      <el-table
        :data="channels"
        v-loading="loading"
        border
        stripe
        empty-text="暂无通道"
      >
        <el-table-column label="通道号" width="90" align="center">
          <template #default="{ row }">{{ row.deviceChannelNo }}</template>
        </el-table-column>
        <el-table-column label="通道名称" min-width="160">
          <template #default="{ row }">{{ row.deviceChannelName || "-" }}</template>
        </el-table-column>
        <el-table-column label="类型" width="110">
          <template #default="{ row }">{{ row.deviceChannelType || "-" }}</template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusMeta(row.deviceChannelStatus).tag as never">
              {{ statusMeta(row.deviceChannelStatus).label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="排序" width="80" align="center">
          <template #default="{ row }">{{ row.deviceChannelSort ?? "-" }}</template>
        </el-table-column>
        <el-table-column label="操作" width="190" align="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button link type="primary" @click="onToggle(row)">
              {{ row.deviceChannelStatus === "enabled" ? "禁用" : "启用" }}
            </el-button>
            <el-button link type="danger" @click="onDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑通道' : '新增通道'" width="480px">
      <el-form label-width="90px">
        <el-form-item label="通道号" required>
          <el-input-number v-model="form.deviceChannelNo" :min="1" :max="999" />
          <span v-if="noInvalid" class="hint">通道号必填且不可与其他通道重复</span>
        </el-form-item>
        <el-form-item label="通道名称">
          <el-input v-model="form.deviceChannelName" placeholder="如：主码流" />
        </el-form-item>
        <el-form-item label="类型">
          <el-input v-model="form.deviceChannelType" placeholder="如：main / sub" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="form.deviceChannelStatus" style="width: 100%">
            <el-option
              v-for="s in STATUS"
              :key="s.value"
              :label="s.label"
              :value="s.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.deviceChannelSort" :min="1" :max="999" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="dialogSaving" :disabled="noInvalid" @click="onSubmit">
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.dch {
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
  flex: 1 1 300px;
  min-width: 240px;
}

.fld-btns {
  flex-direction: row;
  align-items: center;
  gap: 8px;
  padding-bottom: 1px;
}

.hint {
  margin-left: 10px;
  font-size: 12px;
  color: var(--el-color-danger);
}
</style>