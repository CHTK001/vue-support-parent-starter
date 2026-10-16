<script setup lang="ts">
/**
 * 提供商配置 —— 厂商自定义的 AK/SK 等接入参数。
 *
 * 数据来自 device-starter 的 `/api/device/provider-credential/*`，落库表
 * `device_provider_credential`。同一 (厂商, 平台类型) 可登记**多套**凭据
 * （如多个海康账号分属不同区域），每厂商至多一套标记为默认，
 * 厂商级离线阈值取默认套的阈值。
 *
 * 可选平台类型直接对应后台 SPI 的实现：
 *   - hikvision：cloud-yao 云耀 / cloud-eye 云眸 / secure-platform 安防平台（另有 SDK 局域网直连）
 *   - dahua   ：dahua-cloud 云睿 / lechange 乐橙（另有 SDK 局域网直连）
 * SDK 直连走 IP+账号密码，不需要 AK/SK，故平台类型留空。
 *
 * 视觉与布局对齐「代理管理」（ProxyView）：无顶部 hero、4 张紧凑 ReStatCard、
 * 筛选与操作合并成一行、表格卡吃满剩余高度、行内操作用 square 图标按钮、
 * 统一 --el-* 变量。
 *
 * @author CH
 * @since 4.0.0.42
 */
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Bell, CircleCheck, Grid, Share } from "@element-plus/icons-vue";
import ReStatCard from "@repo/ui/re-stat-card";
import deviceApi from "@pages/device/src/api/deviceApi";
import type { ProviderCredential } from "@pages/device/src/types/device";

/** 厂商码 → 中文名 */
const VENDOR_LABELS: Record<string, string> = {
  hikvision: "海康威视",
  dahua: "大华",
};

/** 各厂商支持的平台类型（取自后台 SPI：HikvisionProvider / DahuaProvider 的 connect 分支） */
const VENDOR_PLATFORMS: Record<string, { value: string; label: string }[]> = {
  hikvision: [
    { value: "cloud-yao", label: "云耀" },
    { value: "cloud-eye", label: "云眸" },
    { value: "secure-platform", label: "安防平台" },
  ],
  dahua: [
    { value: "dahua-cloud", label: "云睿" },
    { value: "lechange", label: "乐橙" },
  ],
};

/** 平台类型留空 = SDK 局域网直连（IP + 账号密码，不需要 AK/SK） */
const SDK_PLATFORM = { value: "", label: "SDK 直连" };

const rows = ref<ProviderCredential[]>([]);
const loading = ref(false);
const loadError = ref("");

/** 筛选 */
const filters = reactive({ vendor: "", platform: "", keyword: "" });

/** 已展开明文的 SK 行 id 集合 */
const revealed = ref<Set<string>>(new Set());

/** 新增/编辑弹窗 */
const dialogVisible = ref(false);
const dialogSaving = ref(false);
const editingId = ref<string | null>(null);
const form = reactive({
  deviceCredentialVendor: "hikvision",
  deviceCredentialPlatformType: "cloud-yao",
  deviceCredentialName: "",
  deviceCredentialAppKey: "",
  deviceCredentialAppSecret: "",
  deviceCredentialBaseUrl: "",
  deviceCredentialOfflineThreshold: 60,
  deviceCredentialIsDefault: false,
  deviceCredentialEnabled: true,
  deviceCredentialRemark: "",
});

const vendorOptions = Object.entries(VENDOR_LABELS).map(([value, label]) => ({ value, label }));

/** 当前所选厂商支持的平台类型 */
const platformOptions = computed(() => VENDOR_PLATFORMS[form.deviceCredentialVendor] ?? []);

/** 凭据名称必填；平台模式下 AK/SK 必填 */
const nameInvalid = computed(() => !form.deviceCredentialName.trim());
const isPlatformMode = computed(() => !!form.deviceCredentialPlatformType);
const akSkInvalid = computed(
  () => isPlatformMode.value && (!form.deviceCredentialAppKey.trim() || !form.deviceCredentialAppSecret.trim())
);
const formInvalid = computed(() => nameInvalid.value || akSkInvalid.value || form.deviceCredentialOfflineThreshold <= 0);

const filteredRows = computed(() => {
  const kw = filters.keyword.trim().toLowerCase();
  return rows.value.filter((r) => {
    if (filters.vendor && r.deviceCredentialVendor !== filters.vendor) return false;
    if (filters.platform && (r.deviceCredentialPlatformType || "") !== filters.platform) return false;
    if (!kw) return true;
    return [r.deviceCredentialName, r.deviceCredentialAppKey, r.deviceCredentialRemark]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(kw));
  });
});

const enabledCount = computed(() => rows.value.filter((r) => r.deviceCredentialEnabled).length);
const defaultCount = computed(() => rows.value.filter((r) => r.deviceCredentialIsDefault).length);

const kpis = computed(() => [
  {
    key: "vendors",
    title: "接入厂商",
    value: new Set(rows.value.map((r) => r.deviceCredentialVendor)).size,
    desc: `当前筛选 ${filteredRows.value.length} 套`,
    icon: Share,
    iconColor: "var(--el-color-primary)",
  },
  {
    key: "total",
    title: "凭据套数",
    value: rows.value.length,
    desc: "同厂商可登记多套",
    icon: Grid,
    iconColor: "var(--el-color-info)",
  },
  {
    key: "enabled",
    title: "已启用",
    value: enabledCount.value,
    desc: "停用的套不参与建连",
    icon: CircleCheck,
    iconColor: "var(--el-color-success)",
  },
  {
    key: "default",
    title: "默认套",
    value: defaultCount.value,
    desc: "每厂商至多一套，离线阈值取自它",
    icon: Bell,
    iconColor: "var(--metric-disk, var(--el-color-warning))",
  },
]);

function vendorLabel(vendor?: string): string {
  if (!vendor) return "—";
  return VENDOR_LABELS[vendor] ? `${VENDOR_LABELS[vendor]}（${vendor}）` : vendor;
}

function platformLabel(platform?: string): string {
  if (!platform) return "SDK 直连";
  const hit = Object.values(VENDOR_PLATFORMS)
    .flat()
    .find((p) => p.value === platform);
  return hit ? `${hit.label}（${platform}）` : platform;
}

/** SK 默认掩码展示，点一下明文/掩码切换 */
function secretOf(row: ProviderCredential): string {
  const id = row.deviceCredentialId || "";
  const raw = row.deviceCredentialAppSecret || "";
  if (!raw) return "—";
  if (revealed.value.has(id)) return raw;
  return `${raw.slice(0, 2)}${"*".repeat(Math.max(4, Math.min(10, raw.length - 2)))}${raw.slice(-2)}`;
}

function toggleSecret(row: ProviderCredential): void {
  const id = row.deviceCredentialId || "";
  const next = new Set(revealed.value);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  revealed.value = next;
}

async function fetchList(): Promise<void> {
  loading.value = true;
  loadError.value = "";
  try {
    rows.value = (await deviceApi.listCredentials()) || [];
  } catch (e: unknown) {
    rows.value = [];
    loadError.value = (e as { msg?: string })?.msg || (e instanceof Error ? e.message : String(e));
    ElMessage.error(`凭据加载失败：${loadError.value}`);
  } finally {
    loading.value = false;
  }
}

function openCreate(): void {
  editingId.value = null;
  Object.assign(form, {
    deviceCredentialVendor: "hikvision",
    deviceCredentialPlatformType: "cloud-yao",
    deviceCredentialName: "",
    deviceCredentialAppKey: "",
    deviceCredentialAppSecret: "",
    deviceCredentialBaseUrl: "",
    deviceCredentialOfflineThreshold: 60,
    deviceCredentialIsDefault: false,
    deviceCredentialEnabled: true,
    deviceCredentialRemark: "",
  });
  dialogVisible.value = true;
}

function openEdit(row: ProviderCredential): void {
  editingId.value = row.deviceCredentialId ?? null;
  Object.assign(form, {
    deviceCredentialVendor: row.deviceCredentialVendor,
    deviceCredentialPlatformType: row.deviceCredentialPlatformType || "",
    deviceCredentialName: row.deviceCredentialName || "",
    deviceCredentialAppKey: row.deviceCredentialAppKey || "",
    deviceCredentialAppSecret: row.deviceCredentialAppSecret || "",
    deviceCredentialBaseUrl: row.deviceCredentialBaseUrl || "",
    deviceCredentialOfflineThreshold: row.deviceCredentialOfflineThreshold ?? 60,
    deviceCredentialIsDefault: !!row.deviceCredentialIsDefault,
    deviceCredentialEnabled: row.deviceCredentialEnabled ?? true,
    deviceCredentialRemark: row.deviceCredentialRemark || "",
  });
  dialogVisible.value = true;
}

/** 切换厂商时把平台类型重置为该厂商的首个平台，避免留下不匹配的组合 */
function onVendorChange(): void {
  const opts = VENDOR_PLATFORMS[form.deviceCredentialVendor] ?? [];
  const stillValid = opts.some((o) => o.value === form.deviceCredentialPlatformType);
  if (!stillValid) form.deviceCredentialPlatformType = opts[0]?.value ?? "";
}

async function onSubmit(): Promise<void> {
  if (formInvalid.value) {
    ElMessage.warning("请补全凭据名称、AK/SK 与合法阈值");
    return;
  }
  dialogSaving.value = true;
  try {
    const payload: ProviderCredential = { ...form };
    if (editingId.value) {
      await deviceApi.updateCredential(editingId.value, payload);
      ElMessage.success("凭据已更新");
    } else {
      await deviceApi.createCredential(payload);
      ElMessage.success("凭据已新增");
    }
    dialogVisible.value = false;
    await fetchList();
  } catch (e: unknown) {
    ElMessage.error(`保存失败：${(e as { msg?: string })?.msg || e}`);
  } finally {
    dialogSaving.value = false;
  }
}

async function onDelete(row: ProviderCredential): Promise<void> {
  try {
    await ElMessageBox.confirm(
      `确认删除凭据「${row.deviceCredentialName}」？删除后该套不再参与建连。`,
      "删除确认",
      { type: "warning" }
    );
  } catch {
    return;
  }
  try {
    await deviceApi.deleteCredential(row.deviceCredentialId!);
    ElMessage.success("凭据已删除");
    await fetchList();
  } catch (e: unknown) {
    ElMessage.error(`删除失败：${(e as { msg?: string })?.msg || e}`);
  }
}

/** 设为/取消默认套 */
async function onToggleDefault(row: ProviderCredential): Promise<void> {
  try {
    await deviceApi.updateCredential(row.deviceCredentialId!, {
      ...row,
      deviceCredentialIsDefault: !row.deviceCredentialIsDefault,
    });
    ElMessage.success(row.deviceCredentialIsDefault ? "已取消默认" : "已设为该厂商默认套");
    await fetchList();
  } catch (e: unknown) {
    ElMessage.error(`操作失败：${(e as { msg?: string })?.msg || e}`);
  }
}

/** 启用/停用 */
async function onToggleEnabled(row: ProviderCredential): Promise<void> {
  try {
    await deviceApi.updateCredential(row.deviceCredentialId!, {
      ...row,
      deviceCredentialEnabled: !row.deviceCredentialEnabled,
    });
    await fetchList();
  } catch (e: unknown) {
    ElMessage.error(`操作失败：${(e as { msg?: string })?.msg || e}`);
  }
}

function onResetFilters(): void {
  filters.vendor = "";
  filters.platform = "";
  filters.keyword = "";
}

onMounted(fetchList);
</script>

<template>
  <div class="dpc">
    <!-- KPI 卡：接入厂商 / 凭据套数 / 已启用 / 默认套 -->
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

    <!-- 筛选与操作合并成一行：厂商 / 平台 / 关键字 + 查询 + 图标操作组（新增/刷新/重置） -->
    <section class="dpc-panel dpc-filter">
      <div class="dpc-field dpc-field--vendor">
        <ReSelect v-model="filters.vendor" placeholder="全部厂商" clearable :options="vendorOptions" />
      </div>
      <div class="dpc-field">
        <ReSelect
          v-model="filters.platform"
          placeholder="全部平台"
          clearable
          :options="[...Object.values(VENDOR_PLATFORMS).flat(), SDK_PLATFORM]"
        />
      </div>
      <div class="dpc-field dpc-field--search">
        <ReInput v-model="filters.keyword" placeholder="搜索名称 / AK / 备注..." clearable prefix-icon="Search" />
      </div>
      <span class="dpc-filter__meta">{{ filteredRows.length }} / {{ rows.length }} 套</span>
      <ReButton icon="Search" :show-text="true" type="primary" :loading="loading" @click="fetchList">
        查询
      </ReButton>
      <div class="dpc-toolbar-ops">
        <ReButton icon="Plus" layout="square" type="primary" tip="新增凭据套" @click="openCreate" />
        <ReButton icon="RefreshRight" layout="square" tip="重新加载" :loading="loading" @click="fetchList" />
        <ReButton icon="Delete" layout="square" tip="重置筛选条件" @click="onResetFilters" />
      </div>
    </section>

    <div v-if="loadError" class="dpc-error">
      <span>{{ loadError }}</span>
      <ReButton icon="RefreshRight" layout="square" tip="重试" :loading="loading" @click="fetchList" />
    </div>

    <!-- 表格卡：flex:1 + min-height:0 吃满剩余高度 -->
    <section class="dpc-panel dpc-table-card">
      <div v-if="!loading && !filteredRows.length" class="dpc-empty">
        <ReEmpty description="暂无凭据，点击「新增凭据套」登记厂商的 AK/SK" :image-size="80" />
      </div>
      <ReTable
        v-else
        :data="filteredRows"
        :loading="loading"
        :columns="[
          { prop: 'deviceCredentialVendor', label: '厂商', width: 150, slot: 'vendor' },
          { prop: 'deviceCredentialPlatformType', label: '平台', width: 170, slot: 'platform' },
          { prop: 'deviceCredentialName', label: '凭据名称', minWidth: 160 },
          { prop: 'deviceCredentialAppKey', label: 'AppKey (AK)', width: 190, slot: 'ak' },
          { prop: 'deviceCredentialAppSecret', label: 'AppSecret (SK)', width: 210, slot: 'sk' },
          { prop: 'deviceCredentialOfflineThreshold', label: '离线阈值', width: 110, align: 'center' },
          { prop: 'deviceCredentialIsDefault', label: '默认', width: 90, align: 'center', slot: 'isDefault' },
          { prop: 'deviceCredentialEnabled', label: '启用', width: 90, align: 'center', slot: 'enabled' },
          { prop: 'actions', label: '操作', width: 170, slot: 'actions' },
        ]"
        size="default"
        :border="false"
        :stripe="false"
        table-id="device-credential-list"
        class="device-credential-table"
      >
        <template #col-vendor="{ row }">{{ vendorLabel(row.deviceCredentialVendor) }}</template>
        <template #col-platform="{ row }">
          <ReTag :type="row.deviceCredentialPlatformType ? 'primary' : 'info'" size="small">
            {{ platformLabel(row.deviceCredentialPlatformType) }}
          </ReTag>
        </template>
        <template #col-ak="{ row }">
          <span class="mono">{{ row.deviceCredentialAppKey || "—" }}</span>
        </template>
        <template #col-sk="{ row }">
          <span class="dpc-sk">
            <span class="mono">{{ secretOf(row) }}</span>
            <ReButton
              v-if="row.deviceCredentialAppSecret"
              :icon="revealed.has(row.deviceCredentialId || '') ? 'Hide' : 'View'"
              layout="square"
              :title="revealed.has(row.deviceCredentialId || '') ? '隐藏' : '显示'"
              @click="toggleSecret(row)"
            />
          </span>
        </template>
        <template #col-isDefault="{ row }">
          <ReTag v-if="row.deviceCredentialIsDefault" type="warning" size="small">默认</ReTag>
          <span v-else class="dpc-dash">—</span>
        </template>
        <template #col-enabled="{ row }">
          <ReTag :type="row.deviceCredentialEnabled ? 'success' : 'info'" size="small">
            {{ row.deviceCredentialEnabled ? "启用" : "停用" }}
          </ReTag>
        </template>
        <template #col-actions="{ row }">
          <div class="dpc-ops">
            <ReButton icon="EditPen" layout="square" title="编辑" @click="openEdit(row)" />
            <ReButton
              :icon="row.deviceCredentialIsDefault ? 'StarFilled' : 'Star'"
              layout="square"
              :title="row.deviceCredentialIsDefault ? '取消默认' : '设为该厂商默认套'"
              @click="onToggleDefault(row)"
            />
            <ReButton
              :icon="row.deviceCredentialEnabled ? 'VideoPause' : 'VideoPlay'"
              layout="square"
              :title="row.deviceCredentialEnabled ? '停用' : '启用'"
              @click="onToggleEnabled(row)"
            />
            <ReButton icon="Delete" layout="square" title="删除" @click="onDelete(row)" />
          </div>
        </template>
      </ReTable>
    </section>

    <ReDialog
      v-model="dialogVisible"
      :title="editingId ? '编辑凭据套' : '新增凭据套'"
      width="560px"
      :close-on-click-modal="false"
    >
      <div class="dpc-form">
        <ReFormItem label="厂商" required>
          <ReSelect
            v-model="form.deviceCredentialVendor"
            :options="vendorOptions"
            style="width: 100%"
            :disabled="!!editingId"
            @change="onVendorChange"
          />
        </ReFormItem>
        <ReFormItem label="平台类型" required>
          <ReSelect
            v-model="form.deviceCredentialPlatformType"
            :options="[...platformOptions, SDK_PLATFORM]"
            style="width: 100%"
            :disabled="!!editingId"
          />
        </ReFormItem>
        <ReFormItem label="凭据名称" required>
          <ReInput v-model="form.deviceCredentialName" placeholder="如「华东区账号」" />
        </ReFormItem>
        <template v-if="isPlatformMode">
          <ReFormItem label="AppKey (AK)" required>
            <ReInput v-model="form.deviceCredentialAppKey" placeholder="厂商开放平台分配的 AppKey" />
          </ReFormItem>
          <ReFormItem label="AppSecret (SK)" required>
            <ReInput
              v-model="form.deviceCredentialAppSecret"
              type="password"
              show-password
              placeholder="厂商开放平台分配的 AppSecret"
            />
          </ReFormItem>
        </template>
        <ReFormItem v-else label="说明">
          <span class="dpc-hint">SDK 局域网直连使用设备自身的 IP + 账号密码，无需 AK/SK</span>
        </ReFormItem>
        <ReFormItem label="Endpoint">
          <ReInput v-model="form.deviceCredentialBaseUrl" placeholder="留空使用内置默认地址" />
        </ReFormItem>
        <ReFormItem label="离线阈值" required>
          <ReInputNumber
            v-model="form.deviceCredentialOfflineThreshold"
            :min="1"
            :max="86400"
            style="width: 100%"
          />
          <span class="dpc-hint">单位：秒；厂商级阈值取默认套的值</span>
        </ReFormItem>
        <ReFormItem label="默认套">
          <ReSwitch v-model="form.deviceCredentialIsDefault" />
          <span class="dpc-hint">每厂商至多一套，建连与阈值都优先取它</span>
        </ReFormItem>
        <ReFormItem label="启用">
          <ReSwitch v-model="form.deviceCredentialEnabled" />
        </ReFormItem>
        <ReFormItem label="备注">
          <ReInput v-model="form.deviceCredentialRemark" placeholder="选填" />
        </ReFormItem>
      </div>
      <template #footer>
        <ReButton @click="dialogVisible = false">取消</ReButton>
        <ReButton type="primary" :loading="dialogSaving" :disabled="formInvalid" @click="onSubmit">
          保存
        </ReButton>
      </template>
    </ReDialog>
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
.dpc-field {
  width: 170px;
}
.dpc-field--vendor {
  width: 200px;
}
.dpc-field--search {
  width: 240px;
}
.dpc-field :deep(.el-input),
.dpc-field :deep(.el-select) {
  width: 100%;
}
.dpc-filter__meta {
  margin-left: auto;
  font-size: 12.5px;
  color: var(--el-text-color-secondary);
}
@media (max-width: 900px) {
  .dpc-field,
  .dpc-field--vendor,
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
.dpc-sk {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.dpc-dash {
  color: var(--el-text-color-placeholder);
}
.dpc-ops {
  display: flex;
  align-items: center;
  gap: 6px;
  justify-content: flex-end;
}
.dpc-hint {
  margin-left: 10px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>