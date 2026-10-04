<script setup lang="ts">
/**
 * 提供商配置 —— 各厂商的离线检测阈值。
 *
 * 数据来自 device-starter 的 `GET /api/device/provider-config`，返回
 * `Map<vendor, threshold>`（阈值为秒）；`PUT /api/device/provider-config/{vendor}`
 * 按厂商更新。
 *
 * 后端只有「按厂商整体设一个阈值」的粒度，没有单设备级配置
 * （单设备是 `PUT /api/device/{id}/offline-threshold`），本页只做厂商级。
 *
 * @author CH
 * @since 4.0.0.42
 */
import { computed, onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
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

/** 未做厂商名映射时直接展示原码，不隐藏数据 */
function vendorLabel(vendor: string): string {
  return VENDOR_LABELS[vendor] ? `${VENDOR_LABELS[vendor]}（${vendor}）` : vendor;
}

/** 阈值合理性提示：过小会频繁误报，过大则离线发现滞后 */
const thresholdHint = (t: number): string => {
  if (!Number.isFinite(t) || t <= 0) return "必须大于 0";
  if (t < 30) return "偏小，网络抖动易误判离线";
  if (t > 3600) return "偏大，离线发现会明显滞后";
  return "";
};

const invalidRows = computed(() => rows.value.filter((r) => !Number.isFinite(r.draft) || r.draft <= 0));

function markDirty(r: VendorRow) {
  r.dirty = r.draft !== r.threshold;
}

async function fetchConfig() {
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
  } catch (e) {
    rows.value = [];
    loadError.value = e instanceof Error ? e.message : String(e);
    ElMessage.error(`提供商配置加载失败：${loadError.value}`);
  } finally {
    loading.value = false;
  }
}

async function onSave(r: VendorRow) {
  if (!Number.isFinite(r.draft) || r.draft <= 0) {
    ElMessage.warning("阈值必须大于 0");
    return;
  }
  r.saving = true;
  try {
    await deviceApi.updateProviderConfig(r.vendor, r.draft);
    r.threshold = r.draft;
    r.dirty = false;
    ElMessage.success(`${r.label} 的离线阈值已更新为 ${r.draft} 秒`);
  } catch (e) {
    ElMessage.error(`保存失败：${e instanceof Error ? e.message : e}`);
  } finally {
    r.saving = false;
  }
}

function onReset(r: VendorRow) {
  r.draft = r.threshold;
}

onMounted(fetchConfig);
</script>

<template>
  <div class="dpc">
    <div class="page-header">
      <div>
        <h1 class="page-title">提供商配置</h1>
        <p class="page-desc">
          厂商级离线检测阈值 · 共 {{ rows.length }} 个厂商 · 单位：秒
        </p>
      </div>
      <div class="page-actions">
        <el-button :loading="loading" @click="fetchConfig">刷新</el-button>
      </div>
    </div>

    <div v-if="loadError" class="as-error">
      <span>加载失败：{{ loadError }}</span>
      <el-button size="small" @click="fetchConfig">重试</el-button>
    </div>

    <div class="as-panel">
      <el-table :data="rows" v-loading="loading" border stripe empty-text="暂无提供商配置">
        <el-table-column label="厂商" min-width="200">
          <template #default="{ row }">{{ row.label }}</template>
        </el-table-column>
        <el-table-column label="厂商码" width="160">
          <template #default="{ row }">{{ row.vendor }}</template>
        </el-table-column>
        <el-table-column label="离线阈值（秒）" width="220">
          <template #default="{ row }">
            <el-input-number
              v-model="row.draft"
              :min="1"
              :max="86400"
              :disabled="row.saving"
              @change="markDirty(row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="提示" min-width="220">
          <template #default="{ row }">
            <span :class="{ warn: thresholdHint(row.draft) }">
              {{ thresholdHint(row.draft) || "—" }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" align="right">
          <template #default="{ row }">
            <el-button
              link
              type="primary"
              :disabled="!row.dirty || row.draft <= 0"
              :loading="row.saving"
              @click="onSave(row)"
            >
              保存
            </el-button>
            <el-button link :disabled="!row.dirty || row.saving" @click="onReset(row)">
              还原
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <p v-if="invalidRows.length" class="foot-note">
        有 {{ invalidRows.length }} 项阈值不合法（需大于 0），保存前请先修正。
      </p>
    </div>
  </div>
</template>

<style scoped lang="scss">
.dpc {
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

.warn {
  color: var(--el-color-warning);
}

.foot-note {
  margin: 12px 0 0;
  font-size: 12px;
  color: var(--el-color-danger);
}
</style>