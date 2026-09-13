<script setup lang="ts">
/**
 * 字典管理页面
 *
 * 双 Tab：字典分类 + 字典子项
 *   字典分类：分页 + 增删改查（/v2/dict/*）
 *   字典子项：按字典 ID 分页 + 增删改查（/v2/dict/item/*）
 * 全部使用 ReXxx modern 组件渲染。
 */
import { onMounted, ref, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Collection, Plus, Edit, Delete, Search, Refresh, Upload, Download, ArrowUp, ArrowDown } from "@element-plus/icons-vue";
import * as XLSX from "xlsx";
import {
  pageForDict,
  saveDict,
  updateDict,
  deleteDict,
  pageForDictItem,
  saveDictItem,
  updateDictItem,
  deleteDictItem,
  listForDict,
  listDictItemByCode,
  refreshDictCache,
} from "../api/systemApi";
import type { SysDict, SysDictItem } from "../api/types";
import type { ReTableColumn, ReTableLoadParams, RePageResult } from "@repo/ui/re-table";

const activeTab = ref<"dict" | "item">("dict");

/* 刷新字典缓存 */
const cacheRefreshing = ref(false);
async function handleRefreshCache() {
  cacheRefreshing.value = true;
  try {
    await refreshDictCache();
    ElMessage.success("字典缓存已刷新");
    dictTableRef.value?.reload();
    itemTableRef.value?.reload();
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "刷新缓存失败");
  } finally {
    cacheRefreshing.value = false;
  }
}

const dictStatusOptions = [
  { label: "启用", value: 1 },
  { label: "禁用", value: 0 },
];

/* ===== 字典分类 ===== */
const dictQuery = ref<{
  page: number;
  pageSize: number;
  sysDictName?: string;
  sysDictCode?: string;
}>({
  page: 1,
  pageSize: 10,
});

async function loadDicts({ page, pageSize, params }: ReTableLoadParams): Promise<RePageResult> {
  const res = await pageForDict({
    page,
    pageSize,
    sysDictName: (params.sysDictName as string) || undefined,
    sysDictCode: (params.sysDictCode as string) || undefined,
  });
  return { total: res?.data?.total ?? 0, data: (res?.data?.data ?? []) as Record<string, unknown>[] };
}

const dictTableRef = ref();
const dictList = ref<SysDict[]>([]);

async function refreshDictOptions() {
  try {
    const res = await listForDict();
    dictList.value = (res?.data ?? []) as SysDict[];
  } catch (e) {
    console.warn("[dict] 字典选项加载失败", e);
  }
}

/** 隐藏 file input 触发导入 */
const importInput = ref<HTMLInputElement>();

function triggerImport() {
  importInput.value?.click();
}

/** 导出全部字典（分类 + 子项）为 Excel */
async function handleExport() {
  try {
    const dictRes = await listForDict();
    const dicts = (dictRes?.data ?? []) as SysDict[];
    const dictRows = dicts.map((d) => ({
      字典名称: d.sysDictName ?? "",
      字典编码: d.sysDictCode ?? "",
      排序: d.sysDictSort ?? 0,
      状态: d.sysDictStatus === 1 ? "显示" : "隐藏",
      备注: d.sysDictRemark ?? "",
    }));
    const itemRows: Record<string, string | number>[] = [];
    for (const d of dicts) {
      if (!d.sysDictCode) continue;
      const itemRes = await listDictItemByCode(d.sysDictCode);
      const items = (itemRes?.data ?? []) as SysDictItem[];
      items.forEach((it) => {
        itemRows.push({
          字典编码: d.sysDictCode ?? "",
          标签: it.sysDictItemLabel ?? "",
          值: it.sysDictItemValue ?? "",
          编码: it.sysDictItemCode ?? "",
          排序: it.sysDictItemSort ?? 0,
          状态: it.sysDictItemStatus === 1 ? "启用" : "禁用",
          备注: it.sysDictItemRemark ?? "",
        });
      });
    }
    const wb = XLSX.utils.book_new();
    const dictSheet = XLSX.utils.json_to_sheet(dictRows);
    const itemSheet = XLSX.utils.json_to_sheet(itemRows);
    XLSX.utils.book_append_sheet(wb, dictSheet, "字典分类");
    XLSX.utils.book_append_sheet(wb, itemSheet, "字典子项");
    XLSX.writeFile(wb, `字典数据_${new Date().toISOString().slice(0, 10)}.xlsx`);
    ElMessage.success(`已导出 ${dicts.length} 个字典`);
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "导出失败");
  }
}

/** 从 Excel 导入字典分类 + 子项 */
async function handleImportFile(evt: Event) {
  const input = evt.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (!file) return;
  try {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf);
    const dictSheet = wb.Sheets["字典分类"];
    const itemSheet = wb.Sheets["字典子项"];
    if (!dictSheet) {
      ElMessage.warning("Excel 缺少「字典分类」工作表");
      return;
    }
    const dictRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(dictSheet);
    const itemRows = itemSheet
      ? (XLSX.utils.sheet_to_json<Record<string, unknown>>(itemSheet) as Record<string, unknown>[])
      : [];
    if (!dictRows.length) {
      ElMessage.warning("Excel 无字典分类数据");
      return;
    }
    let dictCount = 0;
    let itemCount = 0;
    for (const row of dictRows) {
      const name = String(row["字典名称"] ?? "").trim();
      const code = String(row["字典编码"] ?? "").trim();
      if (!name || !code) continue;
      const sort = Number(row["排序"]) || 0;
      const status = String(row["状态"]).includes("显示") ? 1 : 0;
      const remark = String(row["备注"] ?? "");
      let existing = dictList.value.find((d) => d.sysDictCode === code);
      let dictId: number;
      if (existing) {
        await updateDict({ ...existing, sysDictName: name, sysDictSort: sort, sysDictStatus: status, sysDictRemark: remark });
        dictId = existing.sysDictId!;
      } else {
        const res = await saveDict({ sysDictName: name, sysDictCode: code, sysDictSort: sort, sysDictStatus: status, sysDictRemark: remark });
        dictId = (res?.data as SysDict)?.sysDictId ?? 0;
      }
      dictCount++;
      // 导入子项：按编码匹配当前分类
      const dictItems = itemRows.filter((r) => String(r["字典编码"] ?? "") === code);
      for (const it of dictItems) {
        const label = String(it["标签"] ?? "").trim();
        const value = String(it["值"] ?? "").trim();
        if (!label || !value) continue;
        const itemSort = Number(it["排序"]) || 0;
        const itemStatus = String(it["状态"]).includes("启用") ? 1 : 0;
        const itemCode = String(it["编码"] ?? "");
        const itemRemark = String(it["备注"] ?? "");
        await saveDictItem({ sysDictId: dictId, sysDictItemLabel: label, sysDictItemValue: value, sysDictItemCode: itemCode, sysDictItemSort: itemSort, sysDictItemStatus: itemStatus, sysDictItemRemark: itemRemark });
        itemCount++;
      }
    }
    ElMessage.success(`导入完成：${dictCount} 个字典，${itemCount} 个字典项`);
    dictTableRef.value?.reload();
    refreshDictOptions();
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "导入失败");
  }
}

function handleDictReset() {
  dictQuery.value = { page: 1, pageSize: 10 };
  dictTableRef.value?.reload();
}

const dictDialogVisible = ref(false);
const dictSaving = ref(false);
const isEditDict = ref(false);
const dictForm = ref<SysDict>({});

function handleDictAdd() {
  isEditDict.value = false;
  dictForm.value = { sysDictStatus: 1, sysDictSort: 0, sysDictInSystem: 0 };
  dictDialogVisible.value = true;
}

function handleDictEdit(row: Record<string, unknown>) {
  isEditDict.value = true;
  dictForm.value = { ...(row as unknown as SysDict) };
  dictDialogVisible.value = true;
}

async function handleDictSubmit() {
  if (!dictForm.value.sysDictName || !dictForm.value.sysDictCode) {
    ElMessage.warning("请输入字典名称和编码");
    return;
  }
  dictSaving.value = true;
  try {
    if (isEditDict.value) {
      await updateDict(dictForm.value);
      ElMessage.success("修改成功");
    } else {
      await saveDict(dictForm.value);
      ElMessage.success("新增成功");
    }
    dictDialogVisible.value = false;
    dictTableRef.value?.reload();
    refreshDictOptions();
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "保存失败");
  } finally {
    dictSaving.value = false;
  }
}

async function handleDictDelete(row: Record<string, unknown>) {
  const dict = row as unknown as SysDict;
  await ElMessageBox.confirm(`确认删除字典「${dict.sysDictName}」？子项将一并失效`, "提示", { type: "warning" });
  await deleteDict(dict.sysDictId!);
  ElMessage.success("删除成功");
  dictTableRef.value?.reload();
  refreshDictOptions();
}

const dictColumns: ReTableColumn[] = [
  { prop: "sysDictName", label: "字典名称", minWidth: 160, slot: "dictName" },
  { prop: "sysDictCode", label: "字典编码", minWidth: 160 },
  { prop: "sysDictSort", label: "排序", width: 80, align: "center" },
  { prop: "sysDictStatus", label: "状态", width: 100, slot: "status", align: "center" },
  { prop: "sysDictInSystem", label: "系统内置", width: 100, slot: "system", align: "center" },
  { prop: "sysDictRemark", label: "备注", minWidth: 180, showOverflowTooltip: true },
  { prop: "createTime", label: "创建时间", width: 170 },
  { prop: "action", label: "操作", width: 260, slot: "action", fixed: "right" },
];

/* ===== 字典子项 ===== */
const itemQuery = ref<{
  page: number;
  pageSize: number;
  sysDictId?: number;
  sysDictItemLabel?: string;
}>({
  page: 1,
  pageSize: 10,
});

async function loadItems({ page, pageSize, params }: ReTableLoadParams): Promise<RePageResult> {
  if (!params.sysDictId) {
    return { total: 0, data: [] };
  }
  const res = await pageForDictItem({
    page,
    pageSize,
    sysDictId: (params.sysDictId as number) || undefined,
    sysDictItemLabel: (params.sysDictItemLabel as string) || undefined,
  });
  return { total: res?.data?.total ?? 0, data: (res?.data?.data ?? []) as Record<string, unknown>[] };
}

const itemTableRef = ref();

const itemDialogVisible = ref(false);
const itemSaving = ref(false);
const isEditItem = ref(false);
const itemForm = ref<SysDictItem>({});

function handleItemAdd() {
  if (!itemQuery.value.sysDictId) {
    ElMessage.warning("请先选择字典分类");
    return;
  }
  isEditItem.value = false;
  itemForm.value = {
    sysDictId: itemQuery.value.sysDictId,
    sysDictItemStatus: 1,
    sysDictItemSort: 0,
  };
  itemDialogVisible.value = true;
}

function handleItemEdit(row: Record<string, unknown>) {
  isEditItem.value = true;
  itemForm.value = { ...(row as unknown as SysDictItem) };
  itemDialogVisible.value = true;
}

async function handleItemSubmit() {
  if (!itemForm.value.sysDictItemLabel || !itemForm.value.sysDictItemValue) {
    ElMessage.warning("请输入字典项标签和值");
    return;
  }
  itemSaving.value = true;
  try {
    if (isEditItem.value) {
      await updateDictItem(itemForm.value);
      ElMessage.success("修改成功");
    } else {
      await saveDictItem(itemForm.value);
      ElMessage.success("新增成功");
    }
    itemDialogVisible.value = false;
    itemTableRef.value?.reload();
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "保存失败");
  } finally {
    itemSaving.value = false;
  }
}

async function handleItemDelete(row: Record<string, unknown>) {
  const item = row as unknown as SysDictItem;
  await ElMessageBox.confirm(`确认删除字典项「${item.sysDictItemLabel}」？`, "提示", { type: "warning" });
  await deleteDictItem(item.sysDictItemId!);
  ElMessage.success("删除成功");
  itemTableRef.value?.reload();
}

/** 字典子项上移/下移：与相邻行交换 sysDictItemSort */
async function handleItemMove(row: Record<string, unknown>, dir: "up" | "down") {
  const item = row as unknown as SysDictItem;
  if (!itemQuery.value.sysDictId) return;
  try {
    const res = await pageForDictItem({ page: 1, pageSize: 999, sysDictId: itemQuery.value.sysDictId });
    const all = ((res?.data?.data ?? res?.data?.records ?? []) as SysDictItem[])
      .slice()
      .sort((a, b) => (a.sysDictItemSort ?? 0) - (b.sysDictItemSort ?? 0));
    const idx = all.findIndex((it) => it.sysDictItemId === item.sysDictItemId);
    const target = dir === "up" ? all[idx - 1] : all[idx + 1];
    if (idx < 0 || !target) {
      ElMessage.warning(dir === "up" ? "已是第一项" : "已是最后一项");
      return;
    }
    const mySort = item.sysDictItemSort ?? 0;
    const targetSort = target.sysDictItemSort ?? 0;
    await updateDictItem({ ...item, sysDictItemSort: targetSort });
    await updateDictItem({ ...target, sysDictItemSort: mySort });
    ElMessage.success(dir === "up" ? "已上移" : "已下移");
    itemTableRef.value?.reload();
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "排序调整失败");
  }
}

function switchToItem(dict: SysDict) {
  activeTab.value = "item";
  itemQuery.value.sysDictId = dict.sysDictId;
  itemQuery.value.page = 1;
  itemTableRef.value?.reload();
}

watch(activeTab, (tab) => {
  if (tab === "item" && itemQuery.value.sysDictId) {
    itemTableRef.value?.reload();
  }
});

const itemColumns: ReTableColumn[] = [
  { prop: "sysDictItemLabel", label: "标签", minWidth: 160 },
  { prop: "sysDictItemValue", label: "值", minWidth: 160 },
  { prop: "preview", label: "翻译预览", minWidth: 160, slot: "preview" },
  { prop: "sysDictItemCode", label: "编码", minWidth: 120 },
  { prop: "sysDictItemSort", label: "排序", width: 80, align: "center" },
  { prop: "sysDictItemStatus", label: "状态", width: 100, slot: "status", align: "center" },
  { prop: "sysDictItemRemark", label: "备注", minWidth: 160, showOverflowTooltip: true },
  { prop: "action", label: "操作", width: 240, slot: "action", fixed: "right" },
];

onMounted(() => {
  refreshDictOptions();
});
</script>

<template>
  <div class="system-page">
    <el-tabs v-model="activeTab" type="border-card" class="rounded-xl">
      <!-- 字典分类 -->
      <el-tab-pane label="字典分类" name="dict">
        <el-card shadow="never" class="system-page__card">
          <ReSearch :is-expanded="true">
            <div class="system-page__search">
              <ReInput
                layout="modern"
                v-model="dictQuery.sysDictName"
                placeholder="字典名称"
                clearable
                class="!w-44"
                @keyup.enter="dictTableRef?.reload()"
              />
              <ReInput
                layout="modern"
                v-model="dictQuery.sysDictCode"
                placeholder="字典编码"
                clearable
                class="!w-44"
                @keyup.enter="dictTableRef?.reload()"
              />
              <div class="flex-1" />
              <ReButton layout="modern" type="primary" icon="Search" @click="dictTableRef?.reload()">查询</ReButton>
              <ReButton layout="modern" icon="Refresh" @click="handleDictReset">重置</ReButton>
              <ReButton layout="modern" type="warning" icon="Refresh" :loading="cacheRefreshing" @click="handleRefreshCache">刷新缓存</ReButton>
              <ReButton layout="modern" icon="Download" @click="handleExport">导出</ReButton>
              <ReButton layout="modern" icon="Upload" @click="triggerImport">导入</ReButton>
              <ReButton layout="modern" type="primary" v-admin icon="Plus" @click="handleDictAdd">新增字典</ReButton>
              <input
                ref="importInput"
                type="file"
                accept=".xlsx,.xls"
                class="hidden"
                @change="handleImportFile"
              />
            </div>
          </ReSearch>

          <ReTable
            ref="dictTableRef"
            table-id="system-dict"
            :loader="loadDicts"
            :columns="dictColumns"
            :pagination="true"
            :params="dictQuery"
            row-key="sysDictId"
            v-model:page="dictQuery.page"
            v-model:page-size="dictQuery.pageSize"
          >
            <template #dictName="{ row }">
              <div class="flex items-center gap-2">
                <el-icon :size="16" color="var(--el-color-primary)"><Collection /></el-icon>
                <span>{{ row.sysDictName }}</span>
                <ReTag v-if="row.sysDictInSystem === 1" type="warning" effect="plain" size="small">内置</ReTag>
              </div>
            </template>
            <template #status="{ row }">
              <ReTag :type="row.sysDictStatus === 1 ? 'success' : 'info'" effect="plain" size="small">
                {{ row.sysDictStatus === 1 ? "显示" : "隐藏" }}
              </ReTag>
            </template>
            <template #system="{ row }">
              <ReTag v-if="row.sysDictInSystem === 1" type="warning" effect="plain" size="small">内置</ReTag>
              <span v-else class="text-xs text-[--el-text-color-secondary]">-</span>
            </template>
            <template #action="{ row }">
              <ReButton layout="square" type="primary" @click="switchToItem(row)">字典项</ReButton>
              <ReButton layout="square" type="primary" icon="Edit" v-admin @click="handleDictEdit(row)">编辑</ReButton>
              <ReButton v-if="row.sysDictInSystem !== 1" layout="square" type="danger" icon="Delete" v-admin @click="handleDictDelete(row)">删除</ReButton>
            </template>
          </ReTable>
        </el-card>
      </el-tab-pane>

      <!-- 字典子项 -->
      <el-tab-pane label="字典子项" name="item">
        <el-card shadow="never" class="system-page__card">
          <ReSearch :is-expanded="true">
            <div class="system-page__search">
              <ReSelect
                v-model="itemQuery.sysDictId"
                placeholder="选择字典分类"
                class="!w-56"
                :data="dictList.map((d) => ({ label: `${d.sysDictName} (${d.sysDictCode})`, value: d.sysDictId }))"
                @change="itemTableRef?.reload()"
              />
              <ReInput
                layout="modern"
                v-model="itemQuery.sysDictItemLabel"
                placeholder="标签"
                clearable
                class="!w-44"
                @keyup.enter="itemTableRef?.reload()"
              />
              <div class="flex-1" />
              <ReButton layout="modern" type="primary" icon="Search" @click="itemTableRef?.reload()">查询</ReButton>
              <ReButton layout="modern" type="primary" v-admin icon="Plus" @click="handleItemAdd">新增字典项</ReButton>
            </div>
          </ReSearch>

          <ReTable
            ref="itemTableRef"
            table-id="system-dict-item"
            :loader="loadItems"
            :columns="itemColumns"
            :pagination="true"
            :params="itemQuery"
            row-key="sysDictItemId"
            v-model:page="itemQuery.page"
            v-model:page-size="itemQuery.pageSize"
          >
            <template #preview="{ row }">
              <ReTag type="primary" effect="plain" size="small">
                {{ row.sysDictItemLabel }}({{ row.sysDictItemValue }})
              </ReTag>
            </template>
            <template #status="{ row }">
              <ReTag :type="row.sysDictItemStatus === 1 ? 'success' : 'info'" effect="plain" size="small">
                {{ row.sysDictItemStatus === 1 ? "启用" : "禁用" }}
              </ReTag>
            </template>
            <template #action="{ row }">
              <ReButton layout="square" type="warning" icon="ArrowUp" @click="handleItemMove(row, 'up')">上移</ReButton>
              <ReButton layout="square" type="warning" icon="ArrowDown" @click="handleItemMove(row, 'down')">下移</ReButton>
              <ReButton layout="square" type="primary" icon="Edit" v-admin @click="handleItemEdit(row)">编辑</ReButton>
              <ReButton layout="square" type="danger" icon="Delete" v-admin @click="handleItemDelete(row)">删除</ReButton>
            </template>
          </ReTable>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <!-- 字典分类弹窗 -->
    <ReDialog
      v-model="dictDialogVisible"
      :title="isEditDict ? '编辑字典' : '新增字典'"
      width="560"
      :close-on-click-modal="false"
      destroy-on-close
      layout="modern"
      :confirm-loading="dictSaving"
      @ok="handleDictSubmit"
    >
      <el-form label-width="100px" :model="dictForm">
        <el-form-item label="字典名称" required>
          <ReInput layout="modern" v-model="dictForm.sysDictName" placeholder="如：用户性别" maxlength="255" show-word-limit />
        </el-form-item>
        <el-form-item label="字典编码" required>
          <ReInput layout="modern" v-model="dictForm.sysDictCode" placeholder="如：user_sex" :disabled="isEditDict" maxlength="255" show-word-limit />
        </el-form-item>
        <el-form-item label="排序">
          <ReInputNumber layout="modern" v-model="dictForm.sysDictSort" :min="0" class="!w-full" />
        </el-form-item>
        <el-form-item label="状态">
          <el-segmented v-model="dictForm.sysDictStatus" :options="dictStatusOptions" />
        </el-form-item>
        <el-form-item label="备注">
          <ReInput layout="modern" v-model="dictForm.sysDictRemark" type="textarea" :rows="2" maxlength="255" show-word-limit />
        </el-form-item>
      </el-form>
    </ReDialog>

    <!-- 字典子项弹窗 -->
    <ReDialog
      v-model="itemDialogVisible"
      :title="isEditItem ? '编辑字典项' : '新增字典项'"
      width="560"
      :close-on-click-modal="false"
      destroy-on-close
      layout="modern"
      :confirm-loading="itemSaving"
      @ok="handleItemSubmit"
    >
      <el-form label-width="100px" :model="itemForm">
        <el-form-item label="标签" required>
          <ReInput layout="modern" v-model="itemForm.sysDictItemLabel" placeholder="显示文本" maxlength="255" show-word-limit />
        </el-form-item>
        <el-form-item label="值" required>
          <ReInput layout="modern" v-model="itemForm.sysDictItemValue" placeholder="存储值" maxlength="255" show-word-limit />
        </el-form-item>
        <el-form-item label="编码">
          <ReInput layout="modern" v-model="itemForm.sysDictItemCode" placeholder="业务编码（可选）" maxlength="255" show-word-limit />
        </el-form-item>
        <el-form-item label="排序">
          <ReInputNumber layout="modern" v-model="itemForm.sysDictItemSort" :min="0" class="!w-full" />
        </el-form-item>
        <el-form-item label="状态">
          <el-segmented v-model="itemForm.sysDictItemStatus" :options="dictStatusOptions" />
        </el-form-item>
        <el-form-item label="备注">
          <ReInput layout="modern" v-model="itemForm.sysDictItemRemark" type="textarea" :rows="2" maxlength="255" show-word-limit />
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
