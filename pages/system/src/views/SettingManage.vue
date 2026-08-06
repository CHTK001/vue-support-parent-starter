<script setup lang="ts">
/**
 * 系统设置管理页面
 *
 * 维护 sys_setting 表的所有配置项，支持按分组过滤、批量保存。
 * 设置项类型：STRING / NUMBER / BOOLEAN / JSON。
 */
import { onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Tools, Plus, Edit, Delete, Search, Refresh } from "@element-plus/icons-vue";
import {
  pageForSetting,
  saveSetting,
  updateSetting,
  deleteSetting,
  listForSetting,
  updateBatchSetting,
} from "../api/systemApi";
import type { SysSetting } from "../api/types";

const query = reactive<{
  page: number;
  pageSize: number;
  sysSettingName?: string;
  sysSettingCode?: string;
  sysSettingGroup?: string;
}>({
  page: 1,
  pageSize: 20,
  sysSettingName: undefined,
  sysSettingCode: undefined,
  sysSettingGroup: undefined,
});
const list = ref<SysSetting[]>([]);
const total = ref(0);
const loading = ref(false);

const dialogVisible = ref(false);
const saving = ref(false);
const isEdit = ref(false);
const form = reactive<SysSetting>({});

const allGroups = ref<string[]>([]);

async function loadList() {
  loading.value = true;
  try {
    const res = await pageForSetting(query);
    list.value = (res?.data?.data ?? res?.data?.records ?? []) as SysSetting[];
    total.value = res?.data?.total ?? 0;
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "设置列表加载失败");
  } finally {
    loading.value = false;
  }
}

async function loadGroups() {
  try {
    // 用 sysSettingGroup 字段聚合（前端不写 SQL）
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
  query.sysSettingName = undefined;
  query.sysSettingCode = undefined;
  query.sysSettingGroup = undefined;
  query.page = 1;
  loadList();
}

function handleAdd() {
  isEdit.value = false;
  Object.keys(form).forEach((k) => delete (form as Record<string, unknown>)[k]);
  Object.assign(form, {
    sysSettingValueType: "STRING",
    sysSettingSort: 0,
    sysSettingInSystem: 0,
  });
  dialogVisible.value = true;
}

function handleEdit(row: SysSetting) {
  isEdit.value = true;
  Object.assign(form, { ...row });
  dialogVisible.value = true;
}

async function handleSubmit() {
  if (!form.sysSettingName || !form.sysSettingCode) {
    ElMessage.warning("请填写名称和编码");
    return;
  }
  saving.value = true;
  try {
    if (isEdit.value) {
      await updateSetting(form);
      ElMessage.success("修改成功");
    } else {
      await saveSetting(form);
      ElMessage.success("新增成功");
    }
    dialogVisible.value = false;
    loadList();
    loadGroups();
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "保存失败");
  } finally {
    saving.value = false;
  }
}

async function handleDelete(row: SysSetting) {
  await ElMessageBox.confirm(`确认删除设置「${row.sysSettingName}」？`, "提示", { type: "warning" });
  await deleteSetting(row.sysSettingId!);
  ElMessage.success("删除成功");
  loadList();
}

/** 单行快速保存（值变化即保存） */
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

/** 批量保存（按当前过滤结果批量提交） */
async function handleBatchSave() {
  if (!list.value.length) {
    ElMessage.warning("没有可保存的设置");
    return;
  }
  await ElMessageBox.confirm(`确认批量保存 ${list.value.length} 条设置？`, "提示", { type: "info" });
  await updateBatchSetting(list.value);
  ElMessage.success("批量保存成功");
  loadList();
}

function handlePageChange(p: number) {
  query.page = p;
  loadList();
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

onMounted(() => {
  loadList();
  loadGroups();
});
</script>

<template>
  <div class="p-6">
    <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h2 class="text-xl font-semibold tracking-tight text-[--el-text-color-primary]">
          系统设置
        </h2>
        <p class="mt-1 text-sm text-[--el-text-color-secondary]">
          维护全局配置项（支持字符串 / 数字 / 布尔 / JSON 四种类型）
        </p>
      </div>
      <div class="flex gap-2">
        <el-button v-admin type="success" plain :icon="Tools" @click="handleBatchSave">批量保存</el-button>
        <el-button v-admin type="primary" :icon="Plus" @click="handleAdd">新增设置</el-button>
      </div>
    </div>

    <el-card shadow="never" class="rounded-xl border border-solid border-[--el-border-color-lighter]">
      <div class="mb-4 flex flex-wrap items-center gap-3">
        <el-input v-model="query.sysSettingName" placeholder="名称" clearable class="!w-44" @keyup.enter="handleReset" />
        <el-input v-model="query.sysSettingCode" placeholder="编码" clearable class="!w-44" @keyup.enter="handleReset" />
        <el-select v-model="query.sysSettingGroup" placeholder="分组" clearable class="!w-44">
          <el-option v-for="g in allGroups" :key="g" :label="g" :value="g" />
        </el-select>
        <div class="flex-1" />
        <el-button type="primary" :icon="Search" @click="handleReset">查询</el-button>
        <el-button :icon="Refresh" @click="loadList">刷新</el-button>
      </div>
      <el-table v-loading="loading" :data="list" stripe class="w-full">
        <el-table-column prop="sysSettingName" label="名称" min-width="160">
          <template #default="{ row }">
            <div class="flex items-center gap-2">
              <el-icon :size="16" color="var(--el-color-primary)"><Tools /></el-icon>
              <span>{{ row.sysSettingName }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="sysSettingCode" label="编码" min-width="160" />
        <el-table-column prop="sysSettingGroup" label="分组" width="120">
          <template #default="{ row }">
            <el-tag v-if="row.sysSettingGroup" size="small" effect="plain">{{ row.sysSettingGroup }}</el-tag>
            <span v-else class="text-xs text-[--el-text-color-secondary]">-</span>
          </template>
        </el-table-column>
        <el-table-column label="类型" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="(row.sysSettingValueType === 'BOOLEAN' ? 'warning' : row.sysSettingValueType === 'JSON' ? 'success' : 'primary') as never" effect="plain">
              {{ row.sysSettingValueType ?? "STRING" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="当前值" min-width="240">
          <template #default="{ row }">
            <template v-if="row.sysSettingValueType === 'BOOLEAN'">
              <el-switch
                :model-value="row.sysSettingValue === 'true' || row.sysSettingValue === '1'"
                @change="(v: boolean | string | number) => {
                  row.sysSettingValue = String(v);
                  handleQuickSave(row);
                }"
              />
            </template>
            <template v-else-if="row.sysSettingValueType === 'NUMBER'">
              <el-input-number
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
              <el-input
                v-model="row.sysSettingValue"
                type="textarea"
                :rows="2"
                placeholder="JSON 字符串"
                @blur="handleQuickSave(row)"
              />
            </template>
            <template v-else>
              <el-input
                v-model="row.sysSettingValue"
                placeholder="字符串值"
                @blur="handleQuickSave(row)"
              />
            </template>
          </template>
        </el-table-column>
        <el-table-column label="预览" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <code class="text-xs text-[--el-text-color-secondary]">{{ renderValue(row) }}</code>
          </template>
        </el-table-column>
        <el-table-column prop="sysSettingRemark" label="备注" min-width="160" show-overflow-tooltip />
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button v-admin link type="primary" :icon="Edit" @click="handleEdit(row)">编辑</el-button>
            <el-button v-admin link type="danger" :icon="Delete" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="mt-4 flex justify-end">
        <el-pagination
          :total="total"
          :current-page="query.page"
          :page-size="query.pageSize"
          layout="total, prev, pager, next"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑设置' : '新增设置'"
      width="560"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form label-width="100px" :model="form">
        <el-form-item label="名称" required>
          <el-input v-model="form.sysSettingName" placeholder="如：登录页标题" />
        </el-form-item>
        <el-form-item label="编码" required>
          <el-input v-model="form.sysSettingCode" placeholder="如：login.title" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="分组">
          <el-input v-model="form.sysSettingGroup" placeholder="如：login / upload" />
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
          <el-input v-model="form.sysSettingValue" type="textarea" :rows="3" placeholder="默认值" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sysSettingSort" :min="0" class="!w-full" />
        </el-form-item>
        <el-form-item label="系统内置">
          <el-switch
            :model-value="form.sysSettingInSystem === 1"
            @change="(v: boolean | string | number) => (form.sysSettingInSystem = v ? 1 : 0)"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.sysSettingRemark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>
