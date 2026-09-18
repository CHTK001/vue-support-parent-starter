<script setup lang="ts">
/**
 * 系统设置管理页面
 *
 * 维护 sys_setting 表的所有配置项，支持按分组过滤、批量保存。
 * 设置项类型：STRING / NUMBER / BOOLEAN / JSON。
 * 全部使用 ReXxx modern 组件渲染。
 */
import { computed, onMounted, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Plus, Edit, Delete, Search, Refresh, Clock, View, Hide } from "@element-plus/icons-vue";
import {
  pageForSetting,
  saveSetting,
  updateSetting,
  deleteSetting,
  updateBatchSetting,
  pageForSettingHistory,
  rollbackSettingHistorySingle,
  rollbackSettingHistoryBatch,
  listSettingHistoryByBatch,
  decryptSettingValue,
  exportSetting,
  importSetting,
} from "../api/systemApi";
import type { SysSetting, SysSettingHistory } from "../api/types";
import type { ReTableColumn, ReTableLoadParams, RePageResult } from "@repo/ui/re-table";

const settingTypeOptions = [
  { label: "字符串", value: "STRING" },
  { label: "数字", value: "NUMBER" },
  { label: "布尔", value: "BOOLEAN" },
  { label: "JSON", value: "JSON" },
];

const query = ref<{
  page: number;
  pageSize: number;
  sysSettingName?: string;
  sysSettingCode?: string;
  sysSettingGroup?: string;
}>({
  page: 1,
  pageSize: 20,
});

const searchFilters = computed(() => [
  { key: 'sysSettingName', label: '名称', type: 'input' as const, placeholder: '请输入' },
  { key: 'sysSettingCode', label: '编码', type: 'input' as const, placeholder: '请输入' },
  {
    key: 'sysSettingGroup', label: '分组', type: 'select' as const, placeholder: '请选择',
    options: allGroups.value.map((g) => ({ label: g, value: g })),
  },
]);

async function loadSettings({ page, pageSize, params }: ReTableLoadParams): Promise<RePageResult> {
  const res = await pageForSetting({
    page,
    pageSize,
    sysSettingName: (params.sysSettingName as string) || undefined,
    sysSettingCode: (params.sysSettingCode as string) || undefined,
    sysSettingGroup: (params.sysSettingGroup as string) || undefined,
  });
  return { total: res?.data?.total ?? 0, data: (res?.data?.data ?? []) as Record<string, unknown>[] };
}

const tableRef = ref();

const allGroups = ref<string[]>([]);

async function loadGroups() {
  try {
    const res = await pageForSetting({ page: 1, pageSize: 500 });
    const groups = new Set<string>();
    (res?.data?.data ?? []).forEach((item: SysSetting) => {
      if (item.sysSettingGroup) groups.add(item.sysSettingGroup);
    });
    allGroups.value = Array.from(groups).sort();
  } catch {
    allGroups.value = [];
  }
}

function handleReset() {
  query.value = { page: 1, pageSize: 20 };
  tableRef.value?.reload();
}

const dialogVisible = ref(false);
const saving = ref(false);
const isEdit = ref(false);
const form = ref<SysSetting>({});
/** 编辑弹窗中是否显示敏感配置明文 */
const editRevealSensitive = ref(false);

function handleAdd() {
  isEdit.value = false;
  editRevealSensitive.value = false;
  form.value = {
    sysSettingValueType: "STRING",
    sysSettingSort: 0,
    sysSettingInSystem: 0,
  };
  dialogVisible.value = true;
}

function handleEdit(row: Record<string, unknown>) {
  isEdit.value = true;
  editRevealSensitive.value = false;
  form.value = { ...(row as unknown as SysSetting) };
  dialogVisible.value = true;
}

async function handleSubmit() {
  if (!form.value.sysSettingName || !form.value.sysSettingCode) {
    ElMessage.warning("请填写名称和编码");
    return;
  }
  saving.value = true;
  try {
    if (isEdit.value) {
      await updateSetting(form.value);
      ElMessage.success("修改成功");
    } else {
      await saveSetting(form.value);
      ElMessage.success("新增成功");
    }
    dialogVisible.value = false;
    tableRef.value?.reload();
    loadGroups();
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "保存失败");
  } finally {
    saving.value = false;
  }
}

async function handleDelete(row: Record<string, unknown>) {
  const setting = row as unknown as SysSetting;
  await ElMessageBox.confirm(`确认删除设置「${setting.sysSettingName}」？`, "提示", { type: "warning" });
  await deleteSetting(setting.sysSettingId!);
  ElMessage.success("删除成功");
  tableRef.value?.reload();
}

const savingMap = ref<Record<number, boolean>>({});
const detailDrawerVisible = ref(false);
const detailSetting = ref<SysSetting | null>(null);

function handleRowClick(row: Record<string, unknown>) {
  const r = row as unknown as SysSetting;
  if (!r.sysSettingId) return;
  detailSetting.value = r;
  detailDrawerVisible.value = true;
}

function handleCloseDrawer() {
  detailDrawerVisible.value = false;
  detailSetting.value = null;
}

async function handleQuickSave(row: SysSetting) {
  if (!row.sysSettingId) return;
  savingMap.value[row.sysSettingId] = true;
  try {
    await updateSetting(row);
    ElMessage.success("已保存");
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "保存失败");
  } finally {
    savingMap.value[row.sysSettingId] = false;
  }
}

async function handleBatchSave() {
  const data = tableRef.value?.data ?? [];
  if (!data.length) {
    ElMessage.warning("没有可保存的设置");
    return;
  }
  await ElMessageBox.confirm(`确认批量保存 ${data.length} 条设置？`, "提示", { type: "info" });
  await updateBatchSetting(data as SysSetting[]);
  ElMessage.success("批量保存成功");
  tableRef.value?.reload();
}

/* ================== 变更历史 ================== */

const historyDrawerVisible = ref(false);
const historyLoading = ref(false);
const historySetting = ref<SysSetting | null>(null);
const historyList = ref<SysSettingHistory[]>([]);
const historyPage = ref(1);
const historyPageSize = ref(10);
const historyTotal = ref(0);
const rollbackLoading = ref<number>(0);

/** 当前历史列表中最新一条记录的批次号（用于抽屉底部批次回滚按钮） */
const latestBatchNo = computed(() => historyList.value.find((h) => h.sysSettingBatchNo)?.sysSettingBatchNo ?? "");

const operationMap: Record<string, { label: string; type: string }> = {
  CREATE: { label: "新增", type: "success" },
  UPDATE: { label: "更新", type: "primary" },
  DELETE: { label: "删除", type: "danger" },
  IMPORT: { label: "导入", type: "warning" },
  ROLLBACK: { label: "回滚", type: "info" },
};

async function openHistory(row: Record<string, unknown>) {
  const setting = row as unknown as SysSetting;
  historySetting.value = setting;
  historyPage.value = 1;
  historyDrawerVisible.value = true;
  await loadHistory();
}

async function loadHistory() {
  if (!historySetting.value?.sysSettingId) return;
  historyLoading.value = true;
  try {
    const res = await pageForSettingHistory({
      page: historyPage.value,
      pageSize: historyPageSize.value,
      settingId: historySetting.value.sysSettingId,
    });
    historyList.value = (res?.data?.data ?? res?.data?.records ?? []) as SysSettingHistory[];
    historyTotal.value = res?.data?.total ?? 0;
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "历史记录加载失败");
  } finally {
    historyLoading.value = false;
  }
}

async function handleRollbackSingle(record: SysSettingHistory) {
  if (!record.sysSettingHistoryId) return;
  await ElMessageBox.confirm(
    `确认将「${record.sysSettingName}」回滚到 ${record.createTime} 的版本？当前值将被覆盖。`,
    "回滚确认",
    { type: "warning" },
  );
  rollbackLoading.value = record.sysSettingHistoryId;
  try {
    await rollbackSettingHistorySingle(record.sysSettingHistoryId);
    ElMessage.success("回滚成功");
    tableRef.value?.reload();
    loadHistory();
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "回滚失败");
  } finally {
    rollbackLoading.value = 0;
  }
}

async function handleRollbackBatch(batchNo: string) {
  if (!batchNo) return;
  await ElMessageBox.confirm(`确认按批次「${batchNo}」回滚所有相关配置？`, "批次回滚确认", {
    type: "warning",
  });
  try {
    await rollbackSettingHistoryBatch(batchNo);
    ElMessage.success("批次回滚成功");
    tableRef.value?.reload();
    loadHistory();
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "回滚失败");
  }
}

function formatValue(val?: string): string {
  if (val == null || val === "") return "-";
  if (val.length > 80) return val.slice(0, 80) + "...";
  return val;
}

/* ================== 敏感配置掩码 ================== */

function isSensitive(row: SysSetting): boolean {
  return Number((row as unknown as Record<string, unknown>).sysSettingIsSensitive) === 1;
}

/** 已临时解密展示的配置 id -> 明文（10s 后自动恢复掩码） */
const revealedMap = ref<Record<number, string>>({});
const revealTimers: Record<number, ReturnType<typeof setTimeout>> = {};

async function toggleSensitive(row: SysSetting): Promise<void> {
  if (!row.sysSettingId) return;
  const id = row.sysSettingId;
  // 再次点击：隐藏
  if (revealedMap.value[id]) {
    delete revealedMap.value[id];
    if (revealTimers[id]) clearTimeout(revealTimers[id]);
    return;
  }
  try {
    const res = await decryptSettingValue(id);
    revealedMap.value[id] = res?.data ?? row.sysSettingValue ?? "";
    if (revealTimers[id]) clearTimeout(revealTimers[id]);
    revealTimers[id] = setTimeout(() => {
      delete revealedMap.value[id];
    }, 10000);
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "获取明文失败");
  }
}

/* ================== 按批次查询历史 ================== */

const batchNoInput = ref("");
const batchMode = ref(false);
const batchList = ref<SysSettingHistory[]>([]);
const batchLoading = ref(false);

async function handleViewBatch(): Promise<void> {
  const no = batchNoInput.value.trim();
  if (!no) {
    ElMessage.warning("请输入批次号");
    return;
  }
  batchLoading.value = true;
  try {
    const res = await listSettingHistoryByBatch(no);
    batchList.value = (res?.data ?? []) as SysSettingHistory[];
    batchMode.value = true;
    if (!batchList.value.length) ElMessage.info("该批次无记录");
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "批次查询失败");
  } finally {
    batchLoading.value = false;
  }
}

function exitBatchMode(): void {
  batchMode.value = false;
  batchList.value = [];
  batchNoInput.value = "";
}

/* ================== 设置导入导出 ================== */

const exporting = ref(false);
const importing = ref(false);
const settingImportInput = ref<HTMLInputElement>();

async function handleSettingExport(): Promise<void> {
  exporting.value = true;
  try {
    const res = await exportSetting(query.value.sysSettingGroup);
    const json = res?.data ?? "{}";
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `系统设置_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    ElMessage.success("导出成功");
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "导出失败");
  } finally {
    exporting.value = false;
  }
}

function triggerSettingImport(): void {
  settingImportInput.value?.click();
}

async function onSettingImportChange(e: Event): Promise<void> {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  importing.value = true;
  try {
    const json = await file.text();
    const res = await importSetting(json, false);
    if (res?.code === 200 || res?.status === 200) {
      ElMessage.success(res?.data ?? "导入成功");
      tableRef.value?.reload();
      loadGroups();
    } else {
      ElMessage.error(res?.msg ?? "导入失败");
    }
  } catch (err) {
    ElMessage.error((err as Error)?.message ?? "导入失败");
  } finally {
    importing.value = false;
    input.value = "";
  }
}

function renderValue(row: SysSetting) {
  const v = row.sysSettingValue;
  const t = row.sysSettingValueType;
  if (v == null || v === "") return "";
  if (t === "BOOLEAN") return v === "true" || v === "1" ? "✓ 启用" : "✗ 禁用";
  if (t === "JSON") {
    try {
      return JSON.stringify(JSON.parse(v), null, 2);
    } catch {
      return v;
    }
  }
  return v;
}

const columns: ReTableColumn[] = [
  { prop: "sysSettingName", label: "名称", minWidth: 160, slot: "name" },
  { prop: "sysSettingCode", label: "编码", minWidth: 160 },
  { prop: "sysSettingGroup", label: "分组", width: 120, slot: "group", align: "center" },
  { prop: "sysSettingValueType", label: "类型", width: 100, slot: "type", align: "center" },
  { prop: "sysSettingValue", label: "当前值", minWidth: 260, slot: "value" },
  { prop: "preview", label: "预览", minWidth: 200, slot: "preview", showOverflowTooltip: true },
  { prop: "sysSettingRemark", label: "备注", minWidth: 160, showOverflowTooltip: true },
  { prop: "action", label: "操作", width: 140, slot: "action", fixed: "right", align: "center" },
];

onMounted(() => {
  tableRef.value?.reload();
  loadGroups();
});
</script>

<template>
  <div class="system-page">
    <input
      ref="settingImportInput"
      type="file"
      accept=".json,.xlsx,.xls"
      style="display: none"
      @change="onSettingImportChange"
    />

<ReTable
         ref="tableRef"
         table-id="system-setting"
         :loader="loadSettings"
         :columns="columns"
         :pagination="true"
         :params="query"
         row-key="sysSettingId"
         v-model:page="query.page"
         v-model:page-size="query.pageSize"
         @row-click="handleRowClick"
         :search="{ filters: searchFilters, title: '搜索', btnMode: 'text' }"
         :search-gap="16"
         v-model:search-model="query"
         @search-reset="handleReset"
       >
        <template #toolbar>
          <ReButton layout="modern" type="primary" icon="Plus" @click="handleAdd">新增设置</ReButton>
          <ReButton layout="modern" icon="Refresh" @click="tableRef?.reload()">刷新</ReButton>
          <ReButton layout="modern" icon="Download" type="success" :loading="exporting" @click="handleSettingExport">导出</ReButton>
          <ReButton layout="modern" icon="Upload" :loading="importing" @click="triggerSettingImport">导入</ReButton>
        </template>
        <template #name="{ row }">
          <div class="flex items-center gap-2">
            <el-icon :size="16" color="var(--el-color-primary)"><Tools /></el-icon>
            <span>{{ row.sysSettingName }}</span>
          </div>
        </template>
        <template #group="{ row }">
          <ReTag v-if="row.sysSettingGroup" effect="plain" size="small">{{ row.sysSettingGroup }}</ReTag>
          <span v-else class="text-xs text-[--el-text-color-secondary]">-</span>
        </template>
        <template #type="{ row }">
          <ReTag
            effect="plain"
            size="small"
            :type="(row.sysSettingValueType === 'BOOLEAN' ? 'warning' : row.sysSettingValueType === 'JSON' ? 'success' : 'primary') as never"
          >
            {{ row.sysSettingValueType ?? "STRING" }}
          </ReTag>
        </template>
<template #value="{ row }">
           <div @click.stop>
             <template v-if="row.sysSettingValueType === 'BOOLEAN'">
               <ReSwitch
                 layout="modern"
                 :model-value="row.sysSettingValue === 'true' || row.sysSettingValue === '1'"
                 @update:model-value="(v: boolean) => {
                   row.sysSettingValue = String(v);
                   handleQuickSave(row);
                 }"
               />
             </template>
             <template v-else-if="row.sysSettingValueType === 'NUMBER'">
               <ReInputNumber
                 layout="modern"
                 :model-value="Number(row.sysSettingValue ?? 0)"
                 :controls="false"
                 class="!w-40"
                 @change="(v: number | undefined) => {
                   row.sysSettingValue = String(v ?? 0);
                   handleQuickSave(row);
                 }"
               />
             </template>
             <template v-else-if="row.sysSettingValueType === 'JSON'">
               <ReInput
                 layout="modern"
                 v-model="row.sysSettingValue"
                 type="textarea"
                 :rows="2"
                 placeholder="JSON 字符串"
                 @blur="handleQuickSave(row)"
               />
             </template>
             <template v-else>
               <ReInput
                 layout="modern"
                 v-model="row.sysSettingValue"
                 placeholder="字符串值"
                 @blur="handleQuickSave(row)"
               />
             </template>
           </div>
         </template>
        <template #preview="{ row }">
          <div v-if="isSensitive(row)" class="flex items-center gap-1">
            <code class="text-xs font-mono">
              {{ revealedMap[row.sysSettingId] ?? "••••••••" }}
            </code>
            <el-button link type="primary" size="small" @click.stop="toggleSensitive(row)">
              <el-icon><component :is="revealedMap[row.sysSettingId] ? Hide : View" /></el-icon>
            </el-button>
          </div>
          <code v-else class="text-xs text-[--el-text-color-secondary]">{{ renderValue(row) }}</code>
        </template>
<template #action="{ row }">
           <ReButton layout="square" type="primary" icon="Edit" v-admin @click.stop="handleEdit(row)">编辑</ReButton>
           <ReButton layout="square" type="info" icon="Clock" v-admin @click.stop="openHistory(row)">历史</ReButton>
           <ReButton layout="square" type="danger" icon="Delete" v-admin @click.stop="handleDelete(row)">删除</ReButton>
         </template>
      </ReTable>

    <ReDialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑设置' : '新增设置'"
      width="600"
      :close-on-click-modal="false"
      destroy-on-close
      layout="modern"
      compact
      :confirm-loading="saving"
      @ok="handleSubmit"
    >
      <el-form label-width="100px" :model="form">
        <el-form-item label="名称" required>
          <ReInput layout="modern" v-model="form.sysSettingName" placeholder="如：登录页标题" maxlength="255" show-word-limit />
        </el-form-item>
        <el-form-item label="编码" required>
          <ReInput layout="modern" v-model="form.sysSettingCode" placeholder="如：login.title" :disabled="isEdit" maxlength="255" show-word-limit />
        </el-form-item>
        <el-form-item label="分组">
          <ReInput layout="modern" v-model="form.sysSettingGroup" placeholder="如：login / upload" maxlength="255" show-word-limit />
        </el-form-item>
        <el-form-item label="类型">
          <el-segmented v-model="form.sysSettingValueType" :options="settingTypeOptions" class="w-full" />
        </el-form-item>
        <el-form-item label="默认值">
          <ReInput
            layout="modern"
            v-model="form.sysSettingValue"
            :type="isSensitive(form) && !editRevealSensitive ? 'password' : 'textarea'"
            :rows="isSensitive(form) && !editRevealSensitive ? 1 : 3"
            placeholder="默认值"
            maxlength="255"
            show-word-limit
          />
        </el-form-item>
        <el-form-item v-if="isEdit && isSensitive(form)" label="显示明文">
          <ReSwitch layout="modern" v-model="editRevealSensitive" />
        </el-form-item>
        <el-form-item label="排序">
          <ReInputNumber layout="modern" v-model="form.sysSettingSort" :min="0" class="!w-full" />
        </el-form-item>
        <el-form-item label="系统内置">
          <ReSwitch
            layout="modern"
            :model-value="form.sysSettingInSystem === 1"
            @update:model-value="(v: boolean) => (form.sysSettingInSystem = v ? 1 : 0)"
          />
        </el-form-item>
        <el-form-item label="备注">
          <ReInput layout="modern" v-model="form.sysSettingRemark" type="textarea" :rows="2" maxlength="255" show-word-limit />
        </el-form-item>
      </el-form>
    </ReDialog>

    <ReDrawer
      v-model="detailDrawerVisible"
      title="设置详情"
      size="480"
      :show-window-shell="false"
      :close-on-click-modal="true"
      :footer-hidden="true"
      @cancel="handleCloseDrawer"
    >
      <template #content v-if="detailSetting">
        <el-descriptions
          :column="1"
          border
          :label-style="{ width: '110px', fontWeight: 600 }"
          :content-style="{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }"
        >
          <el-descriptions-item label="名称">
            {{ detailSetting.sysSettingName }}
          </el-descriptions-item>
          <el-descriptions-item label="编码">
            <code class="text-xs">{{ detailSetting.sysSettingCode }}</code>
          </el-descriptions-item>
          <el-descriptions-item label="分组">
            <ReTag v-if="detailSetting.sysSettingGroup" effect="plain" size="small">
              {{ detailSetting.sysSettingGroup }}
            </ReTag>
            <span v-else class="text-xs text-[--el-text-color-secondary]">-</span>
          </el-descriptions-item>
          <el-descriptions-item label="类型">
            <ReTag
              effect="plain"
              size="small"
              :type="(detailSetting.sysSettingValueType === 'BOOLEAN' ? 'warning' : detailSetting.sysSettingValueType === 'JSON' ? 'success' : 'primary') as never"
            >
              {{ detailSetting.sysSettingValueType ?? "STRING" }}
            </ReTag>
          </el-descriptions-item>
          <el-descriptions-item label="当前值">
            <template v-if="detailSetting.sysSettingValueType === 'BOOLEAN'">
              <ReTag :effect="detailSetting.sysSettingValue === 'true' || detailSetting.sysSettingValue === '1' ? 'dark' : 'plain'" size="small">
                {{ detailSetting.sysSettingValue === 'true' || detailSetting.sysSettingValue === '1' ? '✓ 启用' : '✗ 禁用' }}
              </ReTag>
            </template>
            <template v-else-if="detailSetting.sysSettingValueType === 'JSON'">
              <pre class="text-xs bg-[--el-fill-color-light] rounded p-2 overflow-auto">{{ renderValue(detailSetting) }}</pre>
            </template>
            <template v-else>
              <span class="font-mono text-sm">{{ detailSetting.sysSettingValue ?? "-" }}</span>
            </template>
          </el-descriptions-item>
          <el-descriptions-item label="排序">
            {{ detailSetting.sysSettingSort ?? 0 }}
          </el-descriptions-item>
          <el-descriptions-item label="系统内置">
            <ReTag :type="detailSetting.sysSettingInSystem === 1 ? 'success' : 'info'" effect="plain" size="small">
              {{ detailSetting.sysSettingInSystem === 1 ? "是" : "否" }}
            </ReTag>
          </el-descriptions-item>
          <el-descriptions-item label="备注">
            {{ detailSetting.sysSettingRemark || "-" }}
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">
            {{ detailSetting.createTime || "-" }}
          </el-descriptions-item>
          <el-descriptions-item label="更新时间">
            {{ detailSetting.updateTime || "-" }}
          </el-descriptions-item>
        </el-descriptions>
      </template>
    </ReDrawer>

    <!-- 变更历史抽屉 -->
    <ReDrawer
      v-model="historyDrawerVisible"
      :title="`变更历史 - ${historySetting?.sysSettingName ?? ''}`"
      size="640"
      :show-window-shell="false"
      :close-on-click-modal="true"
      :footer-hidden="true"
    >
      <template #content>
        <div v-loading="historyLoading" class="setting-history">
          <el-alert
            v-if="historySetting"
            :title="`配置编码：${historySetting.sysSettingCode}`"
            type="info"
            :closable="false"
            class="mb-3"
            show-icon
          />
          <!-- 按批次查询 -->
          <div class="batch-bar mb-3">
            <el-input
              v-model="batchNoInput"
              placeholder="输入批次号，按批次查看全部变更"
              clearable
              class="!w-72"
              @keyup.enter="handleViewBatch"
            />
            <el-button type="primary" :loading="batchLoading" @click="handleViewBatch">查看批次</el-button>
            <el-button v-if="batchMode" link type="info" @click="exitBatchMode">返回普通查看</el-button>
          </div>
          <el-table :data="batchMode ? batchList : historyList" border stripe style="width: 100%" size="small">
            <el-table-column prop="sysSettingOperation" label="操作" width="80" align="center">
              <template #default="{ row }">
                <el-tag
                  :type="(operationMap[row.sysSettingOperation ?? '']?.type ?? 'info') as never"
                  size="small"
                  effect="plain"
                >
                  {{ operationMap[row.sysSettingOperation ?? '']?.label ?? row.sysSettingOperation }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="sysSettingOldValue" label="变更前" minWidth="140" show-overflow-tooltip>
              <template #default="{ row }">
                <code class="text-xs text-[--el-color-danger]">{{ formatValue(row.sysSettingOldValue) }}</code>
              </template>
            </el-table-column>
            <el-table-column prop="sysSettingNewValue" label="变更后" minWidth="140" show-overflow-tooltip>
              <template #default="{ row }">
                <code class="text-xs text-[--el-color-success]">{{ formatValue(row.sysSettingNewValue) }}</code>
              </template>
            </el-table-column>
            <el-table-column prop="sysSettingOperatorName" label="操作人" width="100" />
            <el-table-column prop="sysSettingBatchNo" label="批次号" width="140" show-overflow-tooltip>
              <template #default="{ row }">
                <span v-if="row.sysSettingBatchNo" class="text-xs font-mono cursor-pointer text-[--el-color-primary]" @click="handleRollbackBatch(row.sysSettingBatchNo!)">
                  {{ row.sysSettingBatchNo }}
                </span>
                <span v-else class="text-xs text-[--el-text-color-secondary]">-</span>
              </template>
            </el-table-column>
            <el-table-column prop="createTime" label="时间" width="170" />
            <el-table-column label="操作" width="90" fixed="right" align="center">
              <template #default="{ row }">
                <el-button
                  type="primary"
                  link
                  size="small"
                  :loading="rollbackLoading === row.sysSettingHistoryId"
                  @click="handleRollbackSingle(row)"
                >
                  回滚
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="flex justify-end items-center mt-3 gap-2">
            <template v-if="batchMode">
              <el-button
                type="danger"
                size="small"
                @click="handleRollbackBatch(batchNoInput.trim())"
              >
                整批回滚（{{ batchNoInput.trim() }}）
              </el-button>
              <span class="text-xs text-[--el-text-color-secondary]">共 {{ batchList.length }} 条记录</span>
            </template>
            <template v-else>
              <el-button
                type="warning"
                size="small"
                :disabled="!latestBatchNo"
                @click="handleRollbackBatch(latestBatchNo!)"
              >
                批次回滚（{{ latestBatchNo || '无批次' }}）
              </el-button>
              <el-pagination
                v-model:current-page="historyPage"
                v-model:page-size="historyPageSize"
                :total="historyTotal"
                :page-sizes="[10, 20, 50]"
                layout="total, sizes, prev, pager, next"
                @size-change="loadHistory"
                @current-change="loadHistory"
              />
            </template>
          </div>
        </div>
      </template>
    </ReDrawer>
  </div>
</template>

<style scoped lang="scss">
.system-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  height: 100%;
}
.system-page__header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.system-page__title {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.system-page__subtitle {
  margin-top: 4px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.setting-history .batch-bar {
  display: flex;
  align-items: center;
  gap: 8px;
}
.mb-3 { margin-bottom: 12px; }
</style>
