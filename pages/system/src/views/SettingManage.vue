<script setup lang="ts">
/**
 * 系统设置管理页面
 *
 * 维护 sys_setting 表的所有配置项，支持按分组过滤、批量保存。
 * 设置项类型：STRING / NUMBER / BOOLEAN / JSON。
 * 全部使用 ReXxx modern 组件渲染。
 */
import { onMounted, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Tools, Plus, Edit, Delete, Search, Refresh } from "@element-plus/icons-vue";
import {
  pageForSetting,
  saveSetting,
  updateSetting,
  deleteSetting,
  updateBatchSetting,
} from "../api/systemApi";
import type { SysSetting } from "../api/types";
import type { ReTableColumn, ReTableLoadParams, RePageResult } from "@repo/ui/re-table";

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

function handleAdd() {
  isEdit.value = false;
  form.value = {
    sysSettingValueType: "STRING",
    sysSettingSort: 0,
    sysSettingInSystem: 0,
  };
  dialogVisible.value = true;
}

function handleEdit(row: Record<string, unknown>) {
  isEdit.value = true;
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
    <div class="system-page__header">
      <div>
        <h2 class="system-page__title">系统设置</h2>
        <p class="system-page__subtitle">维护全局配置项（支持字符串 / 数字 / 布尔 / JSON 四种类型）</p>
      </div>
      <div class="flex gap-2">
        <ReButton layout="modern" type="success" plain :icon="Tools" v-admin @click="handleBatchSave">批量保存</ReButton>
        <ReButton layout="modern" type="primary" icon="Plus" v-admin @click="handleAdd">新增设置</ReButton>
      </div>
    </div>

    <el-card shadow="never" class="system-page__card">
      <ReSearch :is-expanded="true">
        <div class="system-page__search">
          <ReInput
            layout="modern"
            v-model="query.sysSettingName"
            placeholder="名称"
            clearable
            class="!w-44"
            @keyup.enter="tableRef?.reload()"
          />
          <ReInput
            layout="modern"
            v-model="query.sysSettingCode"
            placeholder="编码"
            clearable
            class="!w-44"
            @keyup.enter="tableRef?.reload()"
          />
          <ReSelect
            v-model="query.sysSettingGroup"
            placeholder="分组"
            clearable
            class="!w-44"
            :data="allGroups.map((g) => ({ label: g, value: g }))"
          />
          <div class="flex-1" />
          <ReButton layout="modern" type="primary" icon="Search" @click="tableRef?.reload()">查询</ReButton>
          <ReButton layout="modern" icon="Refresh" @click="handleReset">重置</ReButton>
          <ReButton layout="modern" icon="Refresh" @click="tableRef?.reload()">刷新</ReButton>
        </div>
      </ReSearch>

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
      >
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
        </template>
        <template #preview="{ row }">
          <code class="text-xs text-[--el-text-color-secondary]">{{ renderValue(row) }}</code>
        </template>
        <template #action="{ row }">
          <ReButton layout="modern" link type="primary" icon="Edit" v-admin @click="handleEdit(row)">编辑</ReButton>
          <ReButton layout="modern" link type="danger" icon="Delete" v-admin @click="handleDelete(row)">删除</ReButton>
        </template>
      </ReTable>
    </el-card>

    <ReDialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑设置' : '新增设置'"
      width="560"
      :close-on-click-modal="false"
      destroy-on-close
      layout="modern"
      :confirm-loading="saving"
      @ok="handleSubmit"
    >
      <el-form label-width="100px" :model="form">
        <el-form-item label="名称" required>
          <ReInput layout="modern" v-model="form.sysSettingName" placeholder="如：登录页标题" />
        </el-form-item>
        <el-form-item label="编码" required>
          <ReInput layout="modern" v-model="form.sysSettingCode" placeholder="如：login.title" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="分组">
          <ReInput layout="modern" v-model="form.sysSettingGroup" placeholder="如：login / upload" />
        </el-form-item>
        <el-form-item label="类型">
          <el-radio-group v-model="form.sysSettingValueType">
            <el-radio value="STRING">字符串</el-radio>
            <el-radio value="NUMBER">数字</el-radio>
            <el-radio value="BOOLEAN">布尔</el-radio>
            <el-radio value="JSON">JSON</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="默认值">
          <ReInput layout="modern" v-model="form.sysSettingValue" type="textarea" :rows="3" placeholder="默认值" />
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
          <ReInput layout="modern" v-model="form.sysSettingRemark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
    </ReDialog>
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
.system-page__card {
  border-radius: 12px;
  border: 1px solid var(--el-border-color-lighter);
}
.system-page__search {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  padding-bottom: 12px;
}
</style>
