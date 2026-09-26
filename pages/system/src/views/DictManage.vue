<script setup lang="ts">
/**
 * 字典管理 - 左右分栏布局
 * 左侧：字典分类列表，支持搜索、新增
 * 右侧上下：上方字典详情，下方 ReTable 字典项（支持拖拽排序、图标、扩展配置）
 */
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import Sortable from "sortablejs";
import { ElMessage, ElMessageBox } from "element-plus";
import { Search, Collection } from "@element-plus/icons-vue";
import type { ReTableColumn } from "@repo/ui/re-table";
import {
  listForDict,
  saveDict,
  updateDict,
  deleteDict,
  listDictItem,
  saveDictItem,
  updateDictItem,
  deleteDictItem,
  updateDictItemSortBatch,
  updateDictSortBatch,
} from "../api/systemApi";
import type { SysDict, SysDictItem, SysDictItemProperty } from "../api/types";

const statusOptions = [
  { label: "启用", value: 1 },
  { label: "禁用", value: 0 },
];

/* ================== 左侧字典分类 ================== */
const dictList = ref<SysDict[]>([]);
const dictLoading = ref(false);
const filterText = ref("");
const currentDict = ref<SysDict | null>(null);
const dictDialogVisible = ref(false);
const dictSaving = ref(false);
const isEditDict = ref(false);
const dictForm = ref<SysDict>({});
const dictListBodyRef = ref<HTMLElement | null>(null);
let dictSortable: ReturnType<typeof Sortable.create> | null = null;

const filteredDictList = computed(() => {
  if (!filterText.value) return dictList.value;
  const kw = filterText.value.toLowerCase();
  return dictList.value.filter(
    (d) =>
      d.sysDictName?.toLowerCase().includes(kw) ||
      d.sysDictCode?.toLowerCase().includes(kw)
  );
});

async function loadDictList() {
  dictLoading.value = true;
  try {
    const res = await listForDict();
    dictList.value = (res?.data ?? []) as SysDict[];
    if (dictList.value.length && !currentDict.value) {
      currentDict.value = dictList.value[0];
      await nextTickReload();
    }
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "字典列表加载失败");
  } finally {
    dictLoading.value = false;
    await nextTick();
    initDictSortable();
  }
}

function nextTickReload() {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      itemTableRef.value?.reload();
      resolve();
    }, 50);
  });
}

/** 初始化左侧字典分类拖拽 */
function initDictSortable() {
  if (!dictListBodyRef.value) return;
  // 已存在先销毁
  dictSortable?.destroy();
  dictSortable = Sortable.create(dictListBodyRef.value, {
    handle: ".dict-drag-handle",
    animation: 150,
    ghostClass: "dict-sort-ghost",
    chosenClass: "dict-sort-chosen",
    dragClass: "dict-sort-drag",
    disabled: !!filterText.value,
    onEnd: async (evt) => {
      const { oldIndex, newIndex } = evt;
      // 位置未变化直接返回
      if (oldIndex === undefined || newIndex === undefined || oldIndex === newIndex) return;
      // 还原DOM移动，交给Vue响应式更新
      const nodes = Array.from(dictListBodyRef.value!.children);
      const movedNode = nodes[newIndex];
      if (oldIndex < newIndex) {
        nodes[newIndex + 1]?.before(movedNode);
      } else {
        nodes[oldIndex]?.after(movedNode);
      }
      // 更新数组顺序
      const list = [...dictList.value];
      const [moved] = list.splice(oldIndex, 1);
      list.splice(newIndex, 0, moved);
      // 重算排序字段
      const sortPayload = list.map((item, idx) => ({
        sysDictId: item.sysDictId!,
        sysDictSort: idx + 1,
      }));
      list.forEach((item, idx) => item.sysDictSort = idx + 1);
      dictList.value = list;
      try {
        await updateDictSortBatch(sortPayload);
        ElMessage.success("字典排序已更新");
      } catch (e) {
        ElMessage.error((e as Error)?.message ?? "排序保存失败，正在刷新");
        await loadDictList();
      }
    },
  });
}

async function handleSelectDict(dict: SysDict) {
  currentDict.value = dict;
  itemSearch.value = {};
  await nextTickReload();
}

function handleDictAdd() {
  isEditDict.value = false;
  dictForm.value = {
    sysDictStatus: 1,
    sysDictSort: dictList.value.length,
  };
  dictDialogVisible.value = true;
}

function handleDictEdit() {
  if (!currentDict.value) return;
  isEditDict.value = true;
  dictForm.value = { ...currentDict.value };
  dictDialogVisible.value = true;
}

async function handleDictSubmit() {
  if (!dictForm.value.sysDictName) {
    ElMessage.warning("请输入字典名称");
    return;
  }
  if (!dictForm.value.sysDictCode) {
    ElMessage.warning("请输入字典编码");
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
    await loadDictList();
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "保存失败");
  } finally {
    dictSaving.value = false;
  }
}

async function handleDictDelete() {
  if (!currentDict.value) return;
  if (currentDict.value.sysDictInSystem === 1) {
    ElMessage.warning("内置字典不允许删除");
    return;
  }
  try {
    await ElMessageBox.confirm(
      `确定删除字典「${currentDict.value.sysDictName}」吗？字典下所有子项也会被删除。`,
      "删除确认",
      { type: "warning" }
    );
    await deleteDict(currentDict.value.sysDictId!);
    ElMessage.success("删除成功");
    currentDict.value = null;
    await loadDictList();
    if (dictList.value.length) {
      currentDict.value = dictList.value[0];
      await nextTickReload();
    }
  } catch (error: unknown) {
    if (error !== "cancel") ElMessage.error(error instanceof Error ? error.message : "删除失败");
  }
}

/* ================== 右侧下方 ReTable 字典项 ================== */
const itemTableRef = ref();
const itemDialogVisible = ref(false);
const itemSaving = ref(false);
const isEditItem = ref(false);
const itemForm = ref<SysDictItem>({});
const itemSearch = ref<Record<string, unknown>>({});

const itemColumns: ReTableColumn[] = [
  { prop: "sysDictItemName", label: "名称", minWidth: 160 },
  { prop: "sysDictItemCode", label: "值", minWidth: 120 },
  { prop: "sysDictItemSort", label: "排序", width: 80, align: "center" },
  { prop: "sysDictItemStatus", label: "状态", width: 90, align: "center" },
  { prop: "action", label: "操作", width: 110, align: "center", fixed: "right" },
];

async function loadDictItems(params: Record<string, unknown>) {
  if (!currentDict.value?.sysDictId) {
    return { total: 0, data: [] };
  }
  try {
    const res = await listDictItem(currentDict.value.sysDictId);
    let list = (res?.data ?? []) as SysDictItem[];
    // 前端关键字过滤
    const kw = (params?.sysDictItemName as string) || "";
    if (kw) {
      const k = kw.toLowerCase();
      list = list.filter(
        (i) =>
          i.sysDictItemName?.toLowerCase().includes(k) ||
          i.sysDictItemCode?.toLowerCase().includes(k)
      );
    }
    return { total: list.length, data: list };
  } catch {
    return { total: 0, data: [] };
  }
}

function handleItemAdd() {
  if (!currentDict.value) return;
  isEditItem.value = false;
  itemForm.value = {
    sysDictId: currentDict.value.sysDictId,
    sysDictItemStatus: 1,
    sysDictItemSort: 0,
    property: [],
  };
  itemDialogVisible.value = true;
}

function handleItemEdit(row: Record<string, unknown>) {
  isEditItem.value = true;
  const item = row as unknown as SysDictItem;
  itemForm.value = {
    ...item,
    property: item.property ? JSON.parse(JSON.stringify(item.property)) : [],
  };
  itemDialogVisible.value = true;
}

async function handleItemSubmit() {
  if (!itemForm.value.sysDictItemName) {
    ElMessage.warning("请输入子项名称");
    return;
  }
  if (!itemForm.value.sysDictItemCode) {
    ElMessage.warning("请输入子项值");
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
  try {
    await ElMessageBox.confirm(
      `确定删除子项「${item.sysDictItemName}」吗？`,
      "删除确认",
      { type: "warning" }
    );
    await deleteDictItem(item.sysDictItemId!);
    ElMessage.success("删除成功");
    itemTableRef.value?.reload();
  } catch (error: unknown) {
    if (error !== "cancel") ElMessage.error(error instanceof Error ? error.message : "删除失败");
  }
}

/* ReTable 拖拽排序 */
async function handleItemDragSort({ newData }: { newData: SysDictItem[] }) {
  try {
    // 使用拖拽后各行自身排序值（两行交换，其他行不变）
    const list = newData.flatMap((row) =>
      row.sysDictItemId == null || row.sysDictItemSort == null
        ? []
        : [{
            sysDictItemId: row.sysDictItemId,
            sysDictItemSort: row.sysDictItemSort,
          }],
    );
    await updateDictItemSortBatch(list);
    ElMessage.success("排序已更新");
    itemTableRef.value?.reload();
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "排序更新失败");
  }
}

/* 扩展配置 property 动态增删 */
function addProperty() {
  if (!itemForm.value.property) itemForm.value.property = [];
  itemForm.value.property.push({
    sysDictItemPropertyGroup: "default",
    sysDictItemPropertyName: "",
    sysDictItemPropertyValue: "",
    sysDictItemPropertySelectedType: "input",
  } as SysDictItemProperty);
}
function removeProperty(idx: number) {
  itemForm.value.property?.splice(idx, 1);
}

// 搜索过滤时禁用拖拽，避免顺序错乱
watch(filterText, (val) => {
  if (dictSortable) dictSortable.option("disabled", !!val);
});

onMounted(() => {
  loadDictList();
});

onUnmounted(() => {
  dictSortable?.destroy();
  dictSortable = null;
});
</script>

<template>
  <div class="dict-page system-page" style="display:flex !important;flex-direction:row !important;gap:8px;padding:0;width:100%;height:calc(100vh - 100px);box-sizing:border-box;">
    <!-- 左侧：字典分类列表 -->
    <div class="dict-tree-card" style="width:320px;flex-shrink:0;background:var(--el-bg-color);border-radius:8px;border:1px solid var(--el-border-color-lighter);display:flex;flex-direction:column;overflow:hidden;">
      <div class="dict-tree-header">
        <div class="dict-tree-title">
          <el-icon><Collection /></el-icon>
          <span>字典分类</span>
        </div>
        <ReButton
          layout="square"
          icon="Plus"
          type="primary"
          title="新增字典"
          @click="handleDictAdd"
        />
      </div>
      <div class="dict-tree-search">
        <el-input
          v-model="filterText"
          placeholder="搜索字典名称/编码"
          clearable
          :prefix-icon="Search"
        />
      </div>
      <div v-loading="dictLoading" class="dict-tree-body" ref="dictListBodyRef">
        <div
          v-for="dict in filteredDictList"
          :key="dict.sysDictId"
          class="dict-tree-node"
          :class="{ active: currentDict?.sysDictId === dict.sysDictId }"
          @click="handleSelectDict(dict)"
          :data-id="dict.sysDictId"
        >
          <ReIcon name="Rank" size="14" class="dict-drag-handle" />
          <ReIcon name="Collection" size="14" color="var(--el-color-primary)" />
          <span class="node-label">{{ dict.sysDictName }}</span>
          <span class="node-id">#{{ dict.sysDictId }}</span>
          <ReTag
            size="small"
            :type="dict.sysDictStatus === 1 ? 'success' : 'danger'"
            effect="plain"
          >
            {{ dict.sysDictStatus === 1 ? "启用" : "禁用" }}
          </ReTag>
        </div>
        <el-empty v-if="!filteredDictList.length" description="暂无字典" :image-size="60" />
      </div>
    </div>

    <!-- 右侧：上下结构 -->
    <div class="dict-detail-card" style="flex:1 1 0%;min-width:0;background:var(--el-bg-color);border-radius:8px;border:1px solid var(--el-border-color-lighter);overflow:auto;display:flex;flex-direction:column;">
      <template v-if="currentDict">
        <!-- 上方：字典详情 -->
        <div class="dict-detail-header">
          <div class="dict-detail-title">
            <ReIcon name="Collection" size="20" color="var(--el-color-primary)" />
            <div>
              <h3>{{ currentDict.sysDictName }}</h3>
              <p>字典编码：{{ currentDict.sysDictCode || '-' }}</p>
            </div>
          </div>
          <div class="dict-detail-actions">
            <ReButton
              layout="square"
              icon="Edit"
              type="primary"
              title="编辑字典"
              @click="handleDictEdit"
            />
            <ReButton
              layout="square"
              icon="Delete"
              type="danger"
              title="删除字典"
              @click="handleDictDelete"
            />
          </div>
        </div>
        <div class="dict-detail-top">
          <el-descriptions :column="2" border size="default">
            <el-descriptions-item label="字典名称">{{ currentDict.sysDictName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="字典编码">{{ currentDict.sysDictCode || '-' }}</el-descriptions-item>
            <el-descriptions-item label="排序">{{ currentDict.sysDictSort ?? 0 }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <ReTag :type="currentDict.sysDictStatus === 1 ? 'success' : 'danger'" size="small">
                {{ currentDict.sysDictStatus === 1 ? "启用" : "禁用" }}
              </ReTag>
            </el-descriptions-item>
            <el-descriptions-item label="内置字典">
              {{ currentDict.sysDictInSystem === 1 ? "是" : "否" }}
            </el-descriptions-item>
            <el-descriptions-item label="备注">{{ currentDict.sysDictRemark || '-' }}</el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- 下方：ReTable 字典子项 -->
        <div class="dict-items-section">
          <ReTable
            ref="itemTableRef"
            table-id="system-dict-item"
            :loader="loadDictItems"
            :columns="itemColumns"
            :params="itemSearch"
            row-key="sysDictItemId"
            row-draggable
            sort-field="sysDictItemSort"
            @row-sort="handleItemDragSort"
          >
            <template #toolbar>
              <el-button type="primary" icon="Plus" @click="handleItemAdd" text>新增子项</el-button>
            </template>
            <template #col-sysDictItemName="{ row }">
              <span class="dict-item-name-cell">
                <ReIcon v-if="row.sysDictItemIcon" :name="row.sysDictItemIcon" size="16" class="dict-item-name-icon" />
                <span>{{ row.sysDictItemName }}</span>
                <span class="dict-item-id">#{{ row.sysDictItemId }}</span>
              </span>
            </template>
            <template #col-sysDictItemStatus="{ row }">
              <ReTag :type="row.sysDictItemStatus === 1 ? 'success' : 'danger'" size="small">
                {{ row.sysDictItemStatus === 1 ? "启用" : "禁用" }}
              </ReTag>
            </template>
            <template #col-action="{ row }">
              <ReButton layout="square" type="primary" icon="Edit" title="编辑" @click="handleItemEdit(row)" />
              <ReButton layout="square" type="danger" icon="Delete" title="删除" @click="handleItemDelete(row)" />
            </template>
          </ReTable>
        </div>
      </template>
      <el-empty v-else description="请选择左侧字典查看详情" class="dict-empty" />
    </div>

    <!-- 字典新增/编辑弹窗 -->
    <el-dialog
      v-model="dictDialogVisible"
      :title="isEditDict ? '编辑字典' : '新增字典'"
      width="500px"
      destroy-on-close
    >
      <el-form label-width="90px" :model="dictForm">
        <el-form-item label="字典名称" required>
          <el-input v-model="dictForm.sysDictName" placeholder="如：用户性别" maxlength="100" />
        </el-form-item>
        <el-form-item label="字典编码" required>
          <el-input v-model="dictForm.sysDictCode" placeholder="如：sys_user_sex" maxlength="100" :disabled="isEditDict" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="dictForm.sysDictSort" :min="0" />
        </el-form-item>
        <el-form-item label="状态">
          <el-segmented v-model="dictForm.sysDictStatus" :options="statusOptions" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="dictForm.sysDictRemark" type="textarea" :rows="2" maxlength="255" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dictDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="dictSaving" @click="handleDictSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 字典项新增/编辑弹窗 -->
    <el-dialog
      v-model="itemDialogVisible"
      :title="isEditItem ? '编辑字典项' : '新增字典项'"
      width="600px"
      destroy-on-close
    >
      <el-form label-width="90px" :model="itemForm">
        <el-form-item label="名称" required>
          <el-input v-model="itemForm.sysDictItemName" placeholder="如：男" maxlength="100" />
        </el-form-item>
        <el-form-item label="值" required>
          <el-input v-model="itemForm.sysDictItemCode" placeholder="如：1" maxlength="100" />
        </el-form-item>
        <el-form-item label="图标">
          <ReIconSelect v-model="itemForm.sysDictItemIcon" placeholder="选择子项图标" class="w-full" />
        </el-form-item>
        <el-form-item label="国际化Key">
          <el-input v-model="itemForm.sysDictItemI18n" placeholder="如：dict.male" maxlength="100" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="itemForm.sysDictItemSort" :min="0" />
        </el-form-item>
        <el-form-item label="状态">
          <el-segmented v-model="itemForm.sysDictItemStatus" :options="statusOptions" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="itemForm.sysDictItemRemark" type="textarea" :rows="2" maxlength="255" />
        </el-form-item>

        <!-- 扩展配置 -->
        <el-form-item label="扩展配置">
          <div style="width:100%">
            <div
              v-for="(p, idx) in itemForm.property"
              :key="idx"
              style="display:flex;gap:6px;margin-bottom:6px;align-items:center;"
            >
              <el-input v-model="p.sysDictItemPropertyGroup" placeholder="分组" style="width:90px" size="small" />
              <el-input v-model="p.sysDictItemPropertyName" placeholder="配置名" style="flex:1" size="small" />
              <el-input v-model="p.sysDictItemPropertyValue" placeholder="配置值" style="flex:1" size="small" />
              <ReButton layout="square" type="danger" icon="Delete" size="small" title="删除" @click="removeProperty(idx)" />
            </div>
            <el-button size="small" icon="Plus" @click="addProperty">添加配置</el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="itemDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="itemSaving" @click="handleItemSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.dict-tree-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.dict-tree-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  font-size: 15px;
}
.dict-tree-search {
  padding: 8px 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.dict-tree-body {
  flex: 1;
  overflow: auto;
  padding: 8px;
}
.dict-drag-handle { cursor: grab; color: var(--el-text-color-placeholder); opacity:0; transition:opacity .2s; } .dict-tree-node:hover .dict-drag-handle { opacity:1; } .dict-tree-node {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  border-radius: 4px;
  cursor: pointer;
  margin-bottom: 2px;
  &:hover {
    background: var(--el-fill-color-light);
  }
  &.active {
    background: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
  }
  .node-id {
    font-size: 12px;
    color: var(--el-text-color-placeholder);
    font-weight: 400;
    margin-left: 2px;
    font-variant-numeric: tabular-nums;
  }
  .node-label {
    flex: 1;
    font-size: 14px;
  }
}
.dict-detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.dict-detail-title {
  display: flex;
  align-items: center;
  gap: 10px;
  h3 { margin:0; font-size: 18px; }
  p { margin:2px 0 0; font-size: 13px; color: var(--el-text-color-secondary); }
}
.dict-detail-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}
.dict-detail-top {
  padding: 16px;
}
.dict-empty {
  padding-top: 100px;
}
.dict-items-section {
  flex: 1;
  margin: 0 16px 16px;
  border-top: 1px solid var(--el-border-color-lighter);
  padding-top: 12px;
  display:flex;
  flex-direction:column;
}
.dict-items-bar {
  display:flex;
  align-items:center;
  justify-content:space-between;
  margin-bottom:8px;
}
.dict-item-name-cell { display:inline-flex; align-items:center; gap:6px; } .dict-item-id { font-size:12px; color:var(--el-text-color-placeholder); font-weight:400; font-variant-numeric:tabular-nums; } .dict-item-name-icon { color:var(--el-color-primary); } .dict-items-bar-title {
  font-weight:600;
  font-size:14px;
}
:deep(.el-table) {
  user-select: none;
}
.dict-sort-ghost {
  opacity: 0.4;
  background: var(--el-color-primary-light-8) !important;
}
.dict-sort-chosen {
  box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.2);
}
.dict-sort-drag {
  cursor: grabbing !important;
}
</style>
