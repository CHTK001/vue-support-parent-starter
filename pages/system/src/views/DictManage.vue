<script setup lang="ts">
/**
 * 字典管理页面
 *
 * 双 Tab：字典分类 + 字典子项
 *   字典分类：分页 + 增删改查（/v2/dict/*）
 *   字典子项：按字典 ID 分页 + 增删改查（/v2/dict/item/*）
 */
import { onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Collection, Plus, Edit, Delete, Search, Refresh } from "@element-plus/icons-vue";
import {
  pageForDict,
  saveDict,
  updateDict,
  deleteDict,
  pageForDictItem,
  saveDictItem,
  updateDictItem,
  deleteDictItem,
} from "../api/systemApi";
import type { SysDict, SysDictItem } from "../api/types";

const activeTab = ref<"dict" | "item">("dict");

/* ===== 字典分类 ===== */
const dictQuery = reactive<{
  page: number;
  pageSize: number;
  sysDictName?: string;
  sysDictCode?: string;
}>({
  page: 1,
  pageSize: 10,
  sysDictName: undefined,
  sysDictCode: undefined,
});
const dictList = ref<SysDict[]>([]);
const dictTotal = ref(0);
const dictLoading = ref(false);
const dictDialogVisible = ref(false);
const dictSaving = ref(false);
const isEditDict = ref(false);
const dictForm = reactive<SysDict>({});

async function loadDict() {
  dictLoading.value = true;
  try {
    const res = await pageForDict(dictQuery);
    dictList.value = (res?.data?.data ?? res?.data?.records ?? []) as SysDict[];
    dictTotal.value = res?.data?.total ?? 0;
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "字典列表加载失败");
  } finally {
    dictLoading.value = false;
  }
}

function handleDictReset() {
  dictQuery.sysDictName = undefined;
  dictQuery.sysDictCode = undefined;
  dictQuery.page = 1;
  loadDict();
}

function handleDictAdd() {
  isEditDict.value = false;
  Object.keys(dictForm).forEach((k) => delete (dictForm as Record<string, unknown>)[k]);
  Object.assign(dictForm, { sysDictStatus: 1, sysDictSort: 0, sysDictInSystem: 0 });
  dictDialogVisible.value = true;
}

function handleDictEdit(row: SysDict) {
  isEditDict.value = true;
  Object.assign(dictForm, { ...row });
  dictDialogVisible.value = true;
}

async function handleDictSubmit() {
  if (!dictForm.sysDictName || !dictForm.sysDictCode) {
    ElMessage.warning("请输入字典名称和编码");
    return;
  }
  dictSaving.value = true;
  try {
    if (isEditDict.value) {
      await updateDict(dictForm);
      ElMessage.success("修改成功");
    } else {
      await saveDict(dictForm);
      ElMessage.success("新增成功");
    }
    dictDialogVisible.value = false;
    loadDict();
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "保存失败");
  } finally {
    dictSaving.value = false;
  }
}

async function handleDictDelete(row: SysDict) {
  await ElMessageBox.confirm(`确认删除字典「${row.sysDictName}」？子项将一并失效`, "提示", { type: "warning" });
  await deleteDict(row.sysDictId!);
  ElMessage.success("删除成功");
  loadDict();
}

function handleDictPage(p: number) {
  dictQuery.page = p;
  loadDict();
}

/* ===== 字典子项 ===== */
const itemQuery = reactive<{
  page: number;
  pageSize: number;
  sysDictId?: number;
  sysDictItemLabel?: string;
}>({
  page: 1,
  pageSize: 10,
  sysDictId: undefined,
  sysDictItemLabel: undefined,
});
const itemList = ref<SysDictItem[]>([]);
const itemTotal = ref(0);
const itemLoading = ref(false);
const itemDialogVisible = ref(false);
const itemSaving = ref(false);
const isEditItem = ref(false);
const itemForm = reactive<SysDictItem>({});

async function loadItem() {
  if (!itemQuery.sysDictId) {
    itemList.value = [];
    itemTotal.value = 0;
    return;
  }
  itemLoading.value = true;
  try {
    const res = await pageForDictItem(itemQuery);
    itemList.value = (res?.data?.data ?? res?.data?.records ?? []) as SysDictItem[];
    itemTotal.value = res?.data?.total ?? 0;
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "字典项加载失败");
  } finally {
    itemLoading.value = false;
  }
}

function handleItemAdd() {
  if (!itemQuery.sysDictId) {
    ElMessage.warning("请先选择字典分类");
    return;
  }
  isEditItem.value = false;
  Object.keys(itemForm).forEach((k) => delete (itemForm as Record<string, unknown>)[k]);
  Object.assign(itemForm, {
    sysDictId: itemQuery.sysDictId,
    sysDictItemStatus: 1,
    sysDictItemSort: 0,
  });
  itemDialogVisible.value = true;
}

function handleItemEdit(row: SysDictItem) {
  isEditItem.value = true;
  Object.assign(itemForm, { ...row });
  itemDialogVisible.value = true;
}

async function handleItemSubmit() {
  if (!itemForm.sysDictItemLabel || !itemForm.sysDictItemValue) {
    ElMessage.warning("请输入字典项标签和值");
    return;
  }
  itemSaving.value = true;
  try {
    if (isEditItem.value) {
      await updateDictItem(itemForm);
      ElMessage.success("修改成功");
    } else {
      await saveDictItem(itemForm);
      ElMessage.success("新增成功");
    }
    itemDialogVisible.value = false;
    loadItem();
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "保存失败");
  } finally {
    itemSaving.value = false;
  }
}

async function handleItemDelete(row: SysDictItem) {
  await ElMessageBox.confirm(`确认删除字典项「${row.sysDictItemLabel}」？`, "提示", { type: "warning" });
  await deleteDictItem(row.sysDictItemId!);
  ElMessage.success("删除成功");
  loadItem();
}

function handleItemPage(p: number) {
  itemQuery.page = p;
  loadItem();
}

function switchToItem(dict: SysDict) {
  activeTab.value = "item";
  itemQuery.sysDictId = dict.sysDictId;
  loadItem();
}

onMounted(() => {
  loadDict();
});
</script>

<template>
  <div class="p-6">
    <div class="mb-6">
      <h2 class="text-xl font-semibold tracking-tight text-[--el-text-color-primary]">
        字典管理
      </h2>
      <p class="mt-1 text-sm text-[--el-text-color-secondary]">
        维护字典分类与字典子项，供业务下拉选项使用
      </p>
    </div>

    <el-tabs v-model="activeTab" type="border-card" class="rounded-xl">
      <!-- 字典分类 -->
      <el-tab-pane label="字典分类" name="dict">
        <el-card shadow="never" class="rounded-xl border border-solid border-[--el-border-color-lighter]">
          <div class="mb-4 flex flex-wrap items-center gap-3">
            <el-input v-model="dictQuery.sysDictName" placeholder="字典名称" clearable class="!w-44" @keyup.enter="handleDictReset" />
            <el-input v-model="dictQuery.sysDictCode" placeholder="字典编码" clearable class="!w-44" @keyup.enter="handleDictReset" />
            <div class="flex-1" />
            <el-button type="primary" :icon="Search" @click="handleDictReset">查询</el-button>
            <el-button type="primary" :icon="Plus" @click="handleDictAdd">新增字典</el-button>
            <el-button :icon="Refresh" @click="loadDict">刷新</el-button>
          </div>
          <el-table v-loading="dictLoading" :data="dictList" stripe class="w-full">
            <el-table-column prop="sysDictName" label="字典名称" min-width="160">
              <template #default="{ row }">
                <div class="flex items-center gap-2">
                  <el-icon :size="16" color="var(--el-color-primary)"><Collection /></el-icon>
                  <span>{{ row.sysDictName }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="sysDictCode" label="字典编码" min-width="160" />
            <el-table-column prop="sysDictSort" label="排序" width="80" />
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag
                  :type="row.sysDictStatus === 1 ? 'success' : 'info'"
                  size="small"
                  effect="plain"
                >
                  {{ row.sysDictStatus === 1 ? "显示" : "隐藏" }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="系统内置" width="100">
              <template #default="{ row }">
                <el-tag v-if="row.sysDictInSystem === 1" type="warning" size="small" effect="plain">内置</el-tag>
                <span v-else class="text-xs text-[--el-text-color-secondary]">-</span>
              </template>
            </el-table-column>
            <el-table-column prop="sysDictRemark" label="备注" min-width="180" show-overflow-tooltip />
            <el-table-column prop="createTime" label="创建时间" width="170" />
            <el-table-column label="操作" width="260" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" @click="switchToItem(row)">字典项</el-button>
                <el-button link type="primary" :icon="Edit" @click="handleDictEdit(row)">编辑</el-button>
                <el-button link type="danger" :icon="Delete" @click="handleDictDelete(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="mt-4 flex justify-end">
            <el-pagination
              :total="dictTotal"
              :current-page="dictQuery.page"
              :page-size="dictQuery.pageSize"
              layout="total, prev, pager, next"
              @current-change="handleDictPage"
            />
          </div>
        </el-card>
      </el-tab-pane>

      <!-- 字典子项 -->
      <el-tab-pane label="字典子项" name="item">
        <el-card shadow="never" class="rounded-xl border border-solid border-[--el-border-color-lighter]">
          <div class="mb-4 flex flex-wrap items-center gap-3">
            <el-select
              v-model="itemQuery.sysDictId"
              placeholder="选择字典分类"
              class="!w-56"
              @change="loadItem"
            >
              <el-option
                v-for="d in dictList"
                :key="d.sysDictId"
                :label="`${d.sysDictName} (${d.sysDictCode})`"
                :value="d.sysDictId"
              />
            </el-select>
            <el-input v-model="itemQuery.sysDictItemLabel" placeholder="标签" clearable class="!w-44" @keyup.enter="loadItem" />
            <div class="flex-1" />
            <el-button type="primary" :icon="Search" @click="loadItem">查询</el-button>
            <el-button type="primary" :icon="Plus" @click="handleItemAdd">新增字典项</el-button>
          </div>
          <el-table v-loading="itemLoading" :data="itemList" stripe class="w-full">
            <el-table-column prop="sysDictItemLabel" label="标签" min-width="160" />
            <el-table-column prop="sysDictItemValue" label="值" min-width="160" />
            <el-table-column prop="sysDictItemCode" label="编码" min-width="120" />
            <el-table-column prop="sysDictItemSort" label="排序" width="80" />
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag
                  :type="row.sysDictItemStatus === 1 ? 'success' : 'info'"
                  size="small"
                  effect="plain"
                >
                  {{ row.sysDictItemStatus === 1 ? "启用" : "禁用" }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="sysDictItemRemark" label="备注" min-width="160" show-overflow-tooltip />
            <el-table-column label="操作" width="180" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" :icon="Edit" @click="handleItemEdit(row)">编辑</el-button>
                <el-button link type="danger" :icon="Delete" @click="handleItemDelete(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="mt-4 flex justify-end">
            <el-pagination
              :total="itemTotal"
              :current-page="itemQuery.page"
              :page-size="itemQuery.pageSize"
              layout="total, prev, pager, next"
              @current-change="handleItemPage"
            />
          </div>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <!-- 字典分类弹窗 -->
    <el-dialog
      v-model="dictDialogVisible"
      :title="isEditDict ? '编辑字典' : '新增字典'"
      width="520"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form label-width="100px" :model="dictForm">
        <el-form-item label="字典名称" required>
          <el-input v-model="dictForm.sysDictName" placeholder="如：用户性别" />
        </el-form-item>
        <el-form-item label="字典编码" required>
          <el-input v-model="dictForm.sysDictCode" placeholder="如：user_sex" :disabled="isEditDict" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="dictForm.sysDictSort" :min="0" class="!w-full" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="dictForm.sysDictStatus">
            <el-radio :value="1">显示</el-radio>
            <el-radio :value="0">隐藏</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="dictForm.sysDictRemark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dictDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="dictSaving" @click="handleDictSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 字典子项弹窗 -->
    <el-dialog
      v-model="itemDialogVisible"
      :title="isEditItem ? '编辑字典项' : '新增字典项'"
      width="520"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form label-width="100px" :model="itemForm">
        <el-form-item label="标签" required>
          <el-input v-model="itemForm.sysDictItemLabel" placeholder="显示文本" />
        </el-form-item>
        <el-form-item label="值" required>
          <el-input v-model="itemForm.sysDictItemValue" placeholder="存储值" />
        </el-form-item>
        <el-form-item label="编码">
          <el-input v-model="itemForm.sysDictItemCode" placeholder="业务编码（可选）" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="itemForm.sysDictItemSort" :min="0" class="!w-full" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="itemForm.sysDictItemStatus">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="itemForm.sysDictItemRemark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="itemDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="itemSaving" @click="handleItemSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>
