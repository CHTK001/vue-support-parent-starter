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
/** 状态筛选：all = 不限，1 = 启用，0 = 禁用（与 SysDict.sysDictStatus 同值域） */
const statusFilter = ref<"all" | 0 | 1>("all");
const currentDict = ref<SysDict | null>(null);
const dictDialogVisible = ref(false);
const dictSaving = ref(false);
const isEditDict = ref(false);
const dictForm = ref<SysDict>({});
const dictListBodyRef = ref<HTMLElement | null>(null);
let dictSortable: ReturnType<typeof Sortable.create> | null = null;

const filteredDictList = computed(() => {
  const kw = filterText.value.trim().toLowerCase();
  return dictList.value.filter((d) => {
    // 状态筛选：非「全部」时按启用 / 禁用过滤
    if (statusFilter.value !== "all" && d.sysDictStatus !== statusFilter.value) {
      return false;
    }
    if (!kw) return true;
    return (
      d.sysDictName?.toLowerCase().includes(kw) ||
      d.sysDictCode?.toLowerCase().includes(kw)
    );
  });
});

/** 启用 / 禁用数量，用于筛选器上的计数 */
const dictStat = computed(() => ({
  all: dictList.value.length,
  enabled: dictList.value.filter((d) => d.sysDictStatus === 1).length,
  disabled: dictList.value.filter((d) => d.sysDictStatus === 0).length,
}));

/** 状态筛选项（带计数，值为字符串 / 数字混合，el-segmented 走全等比较） */
const statusFilterOptions = computed(() => [
  { label: `全部 ${dictStat.value.all}`, value: "all" },
  { label: `启用 ${dictStat.value.enabled}`, value: 1 },
  { label: `禁用 ${dictStat.value.disabled}`, value: 0 },
]);

/** 搜索或状态筛选生效时锁定拖拽排序：此时可见索引与全量列表不对应 */
const sortLocked = computed(
  () => filterText.value.trim().length > 0 || statusFilter.value !== "all"
);

/** 清空搜索与状态筛选 */
function resetFilter() {
  filterText.value = "";
  statusFilter.value = "all";
}

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
    disabled: sortLocked.value,
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

/** 当前字典是否为选中项 */
function isDictActive(dict: SysDict) {
  return currentDict.value?.sysDictId === dict.sysDictId;
}

/** 列表项键盘操作：上下键切换字典，回车 / 空格选中（roving tabindex） */
function onDictKeydown(evt: KeyboardEvent, dict: SysDict) {
  if (evt.key === "Enter" || evt.key === " ") {
    evt.preventDefault();
    handleSelectDict(dict);
    return;
  }
  if (evt.key !== "ArrowDown" && evt.key !== "ArrowUp") return;
  evt.preventDefault();
  const list = filteredDictList.value;
  const idx = list.findIndex((d) => d.sysDictId === dict.sysDictId);
  const next = evt.key === "ArrowDown" ? idx + 1 : idx - 1;
  const target = list[Math.min(Math.max(next, 0), list.length - 1)];
  if (!target) return;
  handleSelectDict(target);
  focusDictNode(target.sysDictId);
}

/** 焦点跟随键盘选中项 */
function focusDictNode(id?: number) {
  if (id == null) return;
  nextTick(() => {
    dictListBodyRef.value?.querySelector<HTMLElement>(`[data-id="${id}"]`)?.focus();
  });
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
/** 当前字典下的子项数量，用于区块标题计数 */
const itemCount = ref(0);

const itemColumns: ReTableColumn[] = [
  { prop: "sysDictItemName", label: "名称", minWidth: 160 },
  { prop: "sysDictItemCode", label: "值", minWidth: 120 },
  { prop: "sysDictItemSort", label: "排序", width: 80, align: "center" },
  { prop: "sysDictItemStatus", label: "状态", width: 90, align: "center" },
  { prop: "action", label: "操作", width: 110, align: "center", fixed: "right" },
];

async function loadDictItems(params: Record<string, unknown>) {
  if (!currentDict.value?.sysDictId) {
    itemCount.value = 0;
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
    itemCount.value = list.length;
    return { total: list.length, data: list };
  } catch {
    itemCount.value = 0;
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

// 搜索 / 状态筛选时禁用拖拽，避免可见索引与全量列表错位
watch(sortLocked, (val) => {
  dictSortable?.option("disabled", val);
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
  <div class="dict-page system-page">
    <!-- 左侧：字典分类列表 -->
    <section class="dict-tree-card" aria-label="字典分类">
      <div class="dict-tree-header">
        <div class="dict-tree-title">
          <span class="dict-tree-title__icon" aria-hidden="true">
            <el-icon><Collection /></el-icon>
          </span>
          <span>字典分类</span>
          <span class="dict-tree-count" :title="`共 ${dictStat.all} 个字典`">{{ dictStat.all }}</span>
        </div>
        <div class="dict-tree-actions">
          <ReButton
            layout="square"
            icon="Refresh"
            tip="刷新列表"
            :loading="dictLoading"
            @click="loadDictList"
          />
          <ReButton
            layout="square"
            icon="Plus"
            type="primary"
            tip="新增字典"
            @click="handleDictAdd"
          />
        </div>
      </div>
      <div class="dict-tree-search">
        <el-input
          v-model="filterText"
          placeholder="搜索字典名称 / 编码"
          clearable
          :prefix-icon="Search"
        />
        <el-segmented
          v-model="statusFilter"
          :options="statusFilterOptions"
          size="small"
          class="dict-status-filter"
        />
        <p v-if="sortLocked" class="dict-sort-lock">
          <ReIcon name="InfoFilled" size="12" />
          <span>筛选状态下已锁定排序，清空筛选后可拖拽</span>
        </p>
      </div>
      <div
        v-loading="dictLoading"
        class="dict-tree-body"
        :class="{ 'is-locked': sortLocked }"
        ref="dictListBodyRef"
        role="group"
        aria-label="字典分类列表"
      >
        <div
          v-for="dict in filteredDictList"
          :key="dict.sysDictId"
          class="dict-tree-node"
          :class="{ 'is-active': isDictActive(dict), 'is-off': dict.sysDictStatus !== 1 }"
          :aria-current="isDictActive(dict) ? 'true' : undefined"
          :tabindex="isDictActive(dict) ? 0 : -1"
          :data-id="dict.sysDictId"
          role="button"
          @click="handleSelectDict(dict)"
          @keydown="onDictKeydown($event, dict)"
        >
          <span class="dict-node-accent" aria-hidden="true" />
          <ReIcon name="Rank" size="14" class="dict-drag-handle" />
          <span class="dict-node-icon" aria-hidden="true">
            <ReIcon name="Collection" size="15" />
          </span>
          <span class="dict-node-body">
            <span class="dict-node-name" :title="dict.sysDictName">{{ dict.sysDictName }}</span>
            <span class="dict-node-sub">
              <span class="dict-node-code" :title="dict.sysDictCode">{{ dict.sysDictCode || "-" }}</span>
              <span v-if="dict.sysDictInSystem === 1" class="dict-node-badge" title="内置字典">内置</span>
              <span class="dict-node-id">#{{ dict.sysDictId }}</span>
            </span>
          </span>
          <ReTag
            class="dict-node-status"
            size="small"
            :type="dict.sysDictStatus === 1 ? 'success' : 'danger'"
            effect="plain"
            dot
          >
            {{ dict.sysDictStatus === 1 ? "启用" : "禁用" }}
          </ReTag>
        </div>

        <!-- 筛选无结果 / 尚无字典：居中浮层，不参与列表语义 -->
        <div v-if="!filteredDictList.length && !dictLoading" class="dict-tree-empty">
          <el-empty v-if="sortLocked" description="没有匹配的字典" :image-size="60">
            <el-button text type="primary" icon="RefreshLeft" @click="resetFilter">清除筛选条件</el-button>
          </el-empty>
          <el-empty v-else description="暂无字典分类" :image-size="60">
            <el-button type="primary" icon="Plus" @click="handleDictAdd">新增字典</el-button>
          </el-empty>
        </div>
      </div>
    </section>

    <!-- 右侧：上下结构 -->
    <section class="dict-detail-card" aria-label="字典详情">
      <template v-if="currentDict">
        <!-- 上方：字典详情 -->
        <div class="dict-detail-header">
          <div class="dict-detail-title">
            <span class="dict-detail-icon" aria-hidden="true">
              <ReIcon name="Collection" size="20" />
            </span>
            <div class="dict-detail-text">
              <h3>
                {{ currentDict.sysDictName }}
                <ReTag
                  size="small"
                  :type="currentDict.sysDictStatus === 1 ? 'success' : 'danger'"
                  effect="plain"
                  dot
                >
                  {{ currentDict.sysDictStatus === 1 ? "启用" : "禁用" }}
                </ReTag>
                <ReTag v-if="currentDict.sysDictInSystem === 1" size="small" type="info" effect="plain">
                  内置
                </ReTag>
              </h3>
              <p>字典编码：{{ currentDict.sysDictCode || '-' }}</p>
            </div>
          </div>
          <div class="dict-detail-actions">
            <ReButton
              layout="square"
              icon="Edit"
              type="primary"
              tip="编辑字典"
              @click="handleDictEdit"
            />
            <ReButton
              layout="square"
              icon="Delete"
              type="danger"
              tip="删除字典"
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
              <ReTag
                size="small"
                :type="currentDict.sysDictStatus === 1 ? 'success' : 'danger'"
                effect="plain"
                dot
              >
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
              <div class="dict-items-bar">
                <span class="dict-items-bar-title">
                  <ReIcon name="List" size="15" color="var(--el-color-primary)" />
                  <span>字典项（{{ itemCount }}）</span>
                </span>
                <el-button type="primary" icon="Plus" @click="handleItemAdd" text>新增子项</el-button>
              </div>
            </template>
            <template #col-sysDictItemName="{ row }">
              <span class="dict-item-name-cell">
                <span class="dict-item-name-icon" aria-hidden="true">
                  <ReIcon v-if="row.sysDictItemIcon" :name="row.sysDictItemIcon" size="15" />
                  <ReIcon v-else name="Menu" size="15" />
                </span>
                <span class="dict-item-name-body">
                  <span class="dict-item-name">{{ row.sysDictItemName }}</span>
                  <span v-if="row.sysDictItemI18n" class="dict-item-i18n">{{ row.sysDictItemI18n }}</span>
                </span>
                <span class="dict-item-id">#{{ row.sysDictItemId }}</span>
              </span>
            </template>
            <template #col-sysDictItemStatus="{ row }">
              <ReTag
                size="small"
                :type="row.sysDictItemStatus === 1 ? 'success' : 'danger'"
                effect="plain"
                dot
              >
                {{ row.sysDictItemStatus === 1 ? "启用" : "禁用" }}
              </ReTag>
            </template>
            <template #col-action="{ row }">
              <ReButton layout="square" type="primary" icon="Edit" tip="编辑" @click="handleItemEdit(row)" />
              <ReButton layout="square" type="danger" icon="Delete" tip="删除" @click="handleItemDelete(row)" />
            </template>
          </ReTable>
        </div>
      </template>
      <el-empty v-else description="请选择左侧字典查看详情" class="dict-empty" />
    </section>

    <!-- 字典新增/编辑弹窗 -->
    <ReDialog
      v-model="dictDialogVisible"
      :title="isEditDict ? '编辑字典' : '新增字典'"
      width="520"
      :close-on-click-modal="false"
      destroy-on-close
      layout="modern"
      compact
      :confirm-loading="dictSaving"
      @ok="handleDictSubmit"
    >
      <el-form label-width="90px" :model="dictForm">
        <el-form-item label="字典名称" required>
          <ReInput v-model="dictForm.sysDictName" layout="modern" placeholder="如：用户性别" maxlength="100" show-word-limit />
        </el-form-item>
        <el-form-item label="字典编码" required>
          <ReInput
            v-model="dictForm.sysDictCode"
            layout="modern"
            placeholder="如：sys_user_sex"
            maxlength="100"
            :disabled="isEditDict"
          />
        </el-form-item>
        <el-form-item label="排序">
          <ReInputNumber layout="modern" v-model="dictForm.sysDictSort" :min="0" class="!w-full" />
        </el-form-item>
        <el-form-item label="状态">
          <el-segmented v-model="dictForm.sysDictStatus" :options="statusOptions" />
        </el-form-item>
        <el-form-item label="备注">
          <ReInput
            v-model="dictForm.sysDictRemark"
            layout="modern"
            type="textarea"
            :rows="2"
            maxlength="255"
            show-word-limit
          />
        </el-form-item>
      </el-form>
    </ReDialog>

    <!-- 字典项新增/编辑弹窗 -->
    <ReDialog
      v-model="itemDialogVisible"
      :title="isEditItem ? '编辑字典项' : '新增字典项'"
      width="640"
      :close-on-click-modal="false"
      destroy-on-close
      layout="modern"
      compact
      :confirm-loading="itemSaving"
      @ok="handleItemSubmit"
    >
      <el-form label-width="90px" :model="itemForm">
        <el-form-item label="名称" required>
          <ReInput v-model="itemForm.sysDictItemName" layout="modern" placeholder="如：男" maxlength="100" show-word-limit />
        </el-form-item>
        <el-form-item label="值" required>
          <ReInput v-model="itemForm.sysDictItemCode" layout="modern" placeholder="如：1" maxlength="100" show-word-limit />
        </el-form-item>
        <el-form-item label="图标">
          <ReIconSelect v-model="itemForm.sysDictItemIcon" placeholder="选择子项图标" class="w-full" />
        </el-form-item>
        <el-form-item label="国际化Key">
          <ReInput v-model="itemForm.sysDictItemI18n" layout="modern" placeholder="如：dict.male" maxlength="100" />
        </el-form-item>
        <el-form-item label="排序">
          <ReInputNumber layout="modern" v-model="itemForm.sysDictItemSort" :min="0" class="!w-full" />
        </el-form-item>
        <el-form-item label="状态">
          <el-segmented v-model="itemForm.sysDictItemStatus" :options="statusOptions" />
        </el-form-item>
        <el-form-item label="备注">
          <ReInput
            v-model="itemForm.sysDictItemRemark"
            layout="modern"
            type="textarea"
            :rows="2"
            maxlength="255"
            show-word-limit
          />
        </el-form-item>

        <!-- 扩展配置 -->
        <el-form-item label="扩展配置">
          <div class="dict-property">
            <div v-for="(p, idx) in itemForm.property" :key="idx" class="dict-property-row">
              <ReInput
                v-model="p.sysDictItemPropertyGroup"
                layout="modern"
                placeholder="分组"
                size="small"
                class="dict-property-group"
              />
              <ReInput
                v-model="p.sysDictItemPropertyName"
                layout="modern"
                placeholder="配置名"
                size="small"
                class="min-w-0 flex-1"
              />
              <ReInput
                v-model="p.sysDictItemPropertyValue"
                layout="modern"
                placeholder="配置值"
                size="small"
                class="min-w-0 flex-1"
              />
              <ReButton
                layout="square"
                type="danger"
                icon="Delete"
                size="small"
                tip="删除该配置"
                @click="removeProperty(idx)"
              />
            </div>
            <p v-if="!itemForm.property?.length" class="dict-property-empty">暂无扩展配置</p>
            <el-button size="small" icon="Plus" @click="addProperty">添加配置</el-button>
          </div>
        </el-form-item>
      </el-form>
    </ReDialog>
  </div>
</template>

<style scoped lang="scss">
/* ============ 页面骨架：左右分栏 ============ */
.dict-page {
  /* 全局 .system-page 是 column 纵向布局，本页需要横向，故这两条必须压过全局值 */
  display: flex !important;
  flex-direction: row !important;
  gap: 8px;
  padding: 0;
  width: 100%;
  height: calc(100vh - 100px);
  box-sizing: border-box;
  min-width: 0;
}

/* ============ 左侧：字典分类 ============ */
.dict-tree-card {
  display: flex;
  flex-direction: column;
  width: 320px;
  flex-shrink: 0;
  min-height: 0;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-md, 8px);
  overflow: hidden;
  transition: border-color var(--el-transition-duration-fast, 0.2s) ease;
}
.dict-tree-card:focus-within {
  border-color: var(--el-color-primary-light-5);
}
.dict-tree-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.dict-tree-title {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.dict-tree-title__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  flex: none;
  border-radius: var(--el-radius-sm, 6px);
  background: color-mix(in srgb, var(--el-color-primary) 12%, transparent);
  color: var(--el-color-primary);
}
.dict-tree-count {
  flex: none;
  height: 18px;
  padding: 0 7px;
  border-radius: var(--el-radius-full, 9999px);
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  font-size: 12px;
  font-weight: 500;
  line-height: 18px;
  font-variant-numeric: tabular-nums;
}
.dict-tree-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: none;
}
.dict-tree-search {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.dict-status-filter {
  width: 100%;
}
.dict-sort-lock {
  display: flex;
  align-items: center;
  gap: 4px;
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}
.dict-tree-body {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 8px;
}

/* 字典项：两行卡片（名称 / 编码），命中 44px 最小可点区域 */
.dict-tree-node {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  margin-bottom: 6px;
  padding: 8px 10px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-md, 8px);
  background: var(--el-bg-color);
  cursor: pointer;
  outline: none;
  transition:
    border-color var(--el-transition-duration-fast, 0.2s) ease,
    background-color var(--el-transition-duration-fast, 0.2s) ease;
  &:hover {
    border-color: var(--el-color-primary-light-5);
    background: var(--el-color-primary-light-9);
  }
  &:focus-visible {
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
  }
  &.is-active {
    border-color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
  }
  /* 禁用字典：名称降级为次级色，状态点仍是唯一可靠信号 */
  &.is-off .dict-node-name {
    color: var(--el-text-color-secondary);
  }
  &.is-active .dict-node-name {
    color: var(--el-color-primary);
    font-weight: 600;
  }
}
/* 选中态左侧强调条 */
.dict-node-accent {
  position: absolute;
  top: 12px;
  bottom: 12px;
  left: 0;
  width: 3px;
  border-radius: var(--el-radius-full, 9999px);
  background: transparent;
  transition: background-color var(--el-transition-duration-fast, 0.2s) ease;
}
.dict-tree-node.is-active .dict-node-accent {
  background: var(--el-color-primary);
}
/* 拖拽把手：默认隐藏，hover / 键盘聚焦时出现 */
.dict-drag-handle {
  flex: none;
  cursor: grab;
  color: var(--el-text-color-placeholder);
  opacity: 0;
  transition: opacity var(--el-transition-duration-fast, 0.2s) ease;
}
.dict-tree-node:hover .dict-drag-handle,
.dict-tree-node:focus-visible .dict-drag-handle {
  opacity: 1;
}
/* 筛选态锁定排序，把手彻底隐藏并禁用拖拽光标 */
.dict-tree-body.is-locked .dict-tree-node .dict-drag-handle {
  opacity: 0;
  cursor: not-allowed;
}
.dict-sort-drag .dict-drag-handle {
  cursor: grabbing;
}
.dict-node-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  flex: none;
  border-radius: var(--el-radius-sm, 6px);
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  transition:
    background-color var(--el-transition-duration-fast, 0.2s) ease,
    color var(--el-transition-duration-fast, 0.2s) ease;
}
.dict-tree-node:hover .dict-node-icon {
  color: var(--el-color-primary);
}
.dict-tree-node.is-active .dict-node-icon {
  background: color-mix(in srgb, var(--el-color-primary) 14%, transparent);
  color: var(--el-color-primary);
}
.dict-node-body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.dict-node-name {
  overflow: hidden;
  font-size: 14px;
  line-height: 1.3;
  color: var(--el-text-color-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dict-node-sub {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  font-size: 12px;
  line-height: 1.3;
  color: var(--el-text-color-placeholder);
}
.dict-node-code {
  min-width: 0;
  overflow: hidden;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dict-node-badge {
  flex: none;
  padding: 0 5px;
  border-radius: var(--el-radius-xs, 4px);
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  line-height: 16px;
}
.dict-tree-node.is-active .dict-node-badge {
  background: color-mix(in srgb, var(--el-color-primary) 14%, transparent);
  color: var(--el-color-primary);
}
.dict-node-id {
  flex: none;
  margin-left: auto;
  font-variant-numeric: tabular-nums;
}
/* ReTag 渲染的是 el-tag 根元素，拿不到本页 scoped 属性，只能走 :deep */
.dict-tree-node :deep(.dict-node-status) {
  flex: none;
}
/* 空态：盖在列表区上的居中浮层（列表为空时才存在） */
.dict-tree-empty {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  background: var(--el-bg-color);
}

/* ============ 右侧：字典详情 + 字典项 ============ */
.dict-detail-card {
  display: flex;
  flex: 1 1 0%;
  flex-direction: column;
  min-width: 0;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-md, 8px);
  overflow: auto;
}
.dict-detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.dict-detail-title {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}
.dict-detail-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  flex: none;
  border-radius: var(--el-radius-lg, 12px);
  background: color-mix(in srgb, var(--el-color-primary) 12%, transparent);
  color: var(--el-color-primary);
}
.dict-detail-text {
  min-width: 0;
  h3 {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }
  p {
    margin: 2px 0 0;
    overflow: hidden;
    font-size: 13px;
    color: var(--el-text-color-secondary);
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
.dict-detail-actions {
  display: flex;
  gap: 4px;
  flex: none;
}
.dict-detail-top {
  padding: 16px 16px 0;
}
.dict-empty {
  padding-top: 100px;
}
.dict-items-section {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  margin: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--el-border-color-lighter);
}
.dict-items-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
}
.dict-items-bar-title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  font-variant-numeric: tabular-nums;
}

/* 字典项表格：名称 + 国际化 Key 两行 */
.dict-item-name-cell {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.dict-item-name-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  flex: none;
  border-radius: var(--el-radius-sm, 6px);
  background: color-mix(in srgb, var(--el-color-primary) 12%, transparent);
  color: var(--el-color-primary);
}
.dict-item-name-body {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.dict-item-name {
  overflow: hidden;
  color: var(--el-text-color-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dict-item-i18n {
  overflow: hidden;
  font-size: 12px;
  line-height: 1.3;
  color: var(--el-text-color-placeholder);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dict-item-id {
  flex: none;
  margin-left: auto;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  font-variant-numeric: tabular-nums;
}
:deep(.el-table) {
  user-select: none;
}

/* 扩展配置行 */
.dict-property {
  width: 100%;
}
.dict-property-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}
/* ReInput modern 布局的根节点自带 width:100%（0,2,0），
   工具类压不过去，这里用三级选择器固定分组列宽 */
.dict-property-row :deep(.dict-property-group) {
  flex: none;
  width: 92px;
}
.dict-property-empty {
  margin: 0 0 6px;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

/* 拖拽排序反馈 */
.dict-sort-ghost {
  opacity: 0.45;
  background: var(--el-color-primary-light-8) !important;
  border-color: var(--el-color-primary-light-5);
}
.dict-sort-chosen {
  border-color: var(--el-color-primary);
  box-shadow: 0 6px 16px color-mix(in srgb, var(--el-color-primary) 22%, transparent);
}
.dict-sort-drag {
  cursor: grabbing !important;
}

/* 尊重系统「减少动态效果」偏好 */
@media (prefers-reduced-motion: reduce) {
  .dict-tree-card,
  .dict-tree-node,
  .dict-node-accent,
  .dict-node-icon,
  .dict-drag-handle {
    transition: none;
  }
}
</style>

