<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import Delete from "@iconify-icons/ep/delete";
import EditPen from "@iconify-icons/ep/edit-pen";
import Minus from "@iconify-icons/line-md/minus";
import Plus from "@iconify-icons/line-md/plus";
import SaveDialog from "./SaveDict.vue";
import { useRenderIcon } from "@repo/components/ReIcon";
import { fetchDeleteDict, fetchPageDict } from "@repo/core";
import { message } from "@repo/utils";

type DictRecord = Record<string, any>;

const props = defineProps({
  nodeClick: {
    type: Function,
    default: () => {},
  },
});

const icon = {
  Delete: useRenderIcon(Delete),
  EditPen: useRenderIcon(EditPen),
  Plus: useRenderIcon(Plus),
  Minus: useRenderIcon(Minus),
};

const dicFilterText = ref("");
const tableData = ref<DictRecord[]>([]);
const selectedDictId = ref<number | null>(null);
const total = ref(0);
const pendingSelection = ref<DictRecord | null>(null);

const visible = reactive({
  save: false,
});

const loading = reactive({
  query: false,
  more: false,
});

const saveDialogParams = reactive({
  mode: "save" as "save" | "edit",
  data: {} as DictRecord,
});

const params = reactive({
  page: 1,
  pageSize: 20,
});

const filteredDicts = computed(() => {
  const keyword = String(dicFilterText.value || "")
    .trim()
    .toLowerCase();
  if (!keyword) {
    return tableData.value;
  }
  return tableData.value.filter((item) => {
    const targetText =
      `${item?.sysDictName || ""}${item?.sysDictCode || ""}`.toLowerCase();
    return targetText.includes(keyword);
  });
});

const normalizeRows = (response: any) => {
  const payload = response?.data;
  if (Array.isArray(payload)) {
    return payload;
  }
  if (Array.isArray(payload?.data)) {
    return payload.data;
  }
  if (Array.isArray(payload?.records)) {
    return payload.records;
  }
  if (Array.isArray(payload?.rows)) {
    return payload.rows;
  }
  if (Array.isArray(payload?.list)) {
    return payload.list;
  }
  return [];
};

const resolveTotal = (response: any, rows: DictRecord[]) =>
  Number(
    response?.data?.total ??
      response?.data?.recordsTotal ??
      response?.data?.count ??
      rows.length,
  );

const matchesPendingTarget = (row: DictRecord, target?: DictRecord | null) => {
  if (!target) {
    return false;
  }
  if (target.sysDictId && row.sysDictId === target.sysDictId) {
    return true;
  }
  return (
    !!target.sysDictCode &&
    row.sysDictCode === target.sysDictCode &&
    row.sysDictName === target.sysDictName
  );
};

const onClick = async (node?: DictRecord | null) => {
  if (!node?.sysDictId) {
    return;
  }
  selectedDictId.value = node.sysDictId;
  await Promise.resolve(props.nodeClick(node));
};

const applySelection = async () => {
  const nextSelected =
    tableData.value.find((item) =>
      matchesPendingTarget(item, pendingSelection.value),
    ) ||
    tableData.value.find((item) => item.sysDictId === selectedDictId.value) ||
    tableData.value[0];

  pendingSelection.value = null;
  if (!nextSelected) {
    selectedDictId.value = null;
    return;
  }
  if (nextSelected.sysDictId !== selectedDictId.value) {
    await onClick(nextSelected);
  }
};

const onSearch = async (reset = true, target?: DictRecord | null) => {
  if (loading.query || loading.more) {
    return;
  }
  if (reset) {
    params.page = 1;
  }
  if (target) {
    pendingSelection.value = target;
  }

  loading.query = reset;
  loading.more = !reset;
  try {
    const response = await fetchPageDict({
      page: params.page,
      pageSize: params.pageSize,
    });
    const rows = normalizeRows(response).map((row: DictRecord) => ({
      ...row,
      sysDictPid: Number(row?.sysDictPid ?? 0) || 0,
    }));
    tableData.value = reset
      ? rows
      : [
          ...tableData.value,
          ...rows.filter(
            (row) =>
              !tableData.value.some((item) => item.sysDictId === row.sysDictId),
          ),
        ];
    total.value = resolveTotal(response, rows);
    await applySelection();
  } catch {
    if (reset) {
      tableData.value = [];
      total.value = 0;
      selectedDictId.value = null;
    }
    message.error("加载字典分类失败");
  } finally {
    loading.query = false;
    loading.more = false;
  }
};

const handleScroll = async (event: Event) => {
  const target = event.target as HTMLElement;
  if (!target || loading.query || loading.more) {
    return;
  }
  const reachedBottom =
    target.scrollHeight - target.scrollTop - target.clientHeight <= 12;
  if (!reachedBottom || tableData.value.length >= total.value) {
    return;
  }
  params.page += 1;
  await onSearch(false);
};

const onDelete = async (row: DictRecord) => {
  try {
    const res = await fetchDeleteDict(row.sysDictId);
    if (res?.code !== "00000") {
      message.error(res?.msg || "删除失败");
      return;
    }
    if (selectedDictId.value === row.sysDictId) {
      selectedDictId.value = null;
    }
    message.success("删除成功");
    await onSearch(true);
  } catch {
    message.error("删除失败");
  }
};

const dialogClose = () => {
  visible.save = false;
  saveDialogParams.mode = "save";
  saveDialogParams.data = {};
};

const dialogOpen = (item: DictRecord = {}, mode: "save" | "edit" = "save") => {
  saveDialogParams.mode = mode;
  saveDialogParams.data = { ...item };
  visible.save = true;
};

const onSuccess = async (_mode: "save" | "edit", form: DictRecord) => {
  dialogClose();
  await onSearch(true, form);
};

onMounted(() => {
  onSearch(true);
});
</script>

<template>
  <div class="dict-layout-shell h-full">
    <SaveDialog
      v-model:visible="visible.save"
      :mode="saveDialogParams.mode"
      :dict-data="saveDialogParams.data"
      @success="onSuccess"
    />
    <div class="main h-full">
      <el-container>
        <el-header class="header-height">
          <ScInput
            v-model="dicFilterText"
            placeholder="搜索字典分类"
            clearable
          />
        </el-header>
        <el-main class="dict-main-panel">
          <el-skeleton v-if="loading.query" animated :count="6" />
          <div
            v-else
            class="dict-list thin-scroller"
            @scroll.passive="handleScroll"
          >
            <button
              v-for="item in filteredDicts"
              :key="item.sysDictId"
              type="button"
              class="dict-list-item"
              :class="{ active: selectedDictId === item.sysDictId }"
              @click="onClick(item)"
            >
              <div class="dict-list-main">
                <div class="dict-list-title">
                  <ScTag size="small">{{ item.sysDictId }}</ScTag>
                  <span>{{ item.sysDictName }}</span>
                </div>
                <div class="dict-list-code">{{ item.sysDictCode }}</div>
              </div>
              <div class="dict-list-actions">
                <ScButton
                  :icon="icon.EditPen"
                  size="small"
                  title="编辑字典分类"
                  aria-label="编辑字典分类"
                  @click.stop="dialogOpen(item, 'edit')"
                />
                <ScPopconfirm
                  v-if="item.sysDictInSystem != 1"
                  :title="$t('message.confimDelete')"
                  @confirm="onDelete(item)"
                >
                  <template #reference>
                    <ScButton
                      :icon="icon.Delete"
                      size="small"
                      title="删除字典分类"
                      aria-label="删除字典分类"
                    />
                  </template>
                </ScPopconfirm>
              </div>
            </button>
            <ScEmpty v-if="!filteredDicts.length" description="暂无字典分类" />
          </div>
        </el-main>
        <el-footer class="footer-height">
          <ScButton
            type="primary"
            size="small"
            icon="el-icon-plus"
            class="full-width"
            @click="dialogOpen({}, 'save')"
          >
            新增字典
          </ScButton>
        </el-footer>
      </el-container>
    </div>
  </div>
</template>

<style scoped lang="scss">
:deep(.el-dropdown-menu__item i) {
  margin: 0;
}

.dict-layout-shell,
.main,
:deep(.el-container.is-vertical) {
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

:deep(.el-container.is-vertical) {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
}

:deep(.el-main) {
  min-height: 0;
  overflow: hidden;
}

.dict-main-panel {
  display: flex;
  flex: 1 1 0;
  flex-direction: column;
  min-height: 0;
  padding: 0;
  overflow: hidden;
}

.header-height {
  height: auto;
  padding: 16px 20px;
  background: var(--el-bg-color-overlay);
  border-bottom: 1px solid var(--el-border-color-lighter);
  position: relative;
  z-index: 2;

  :deep(.el-input__wrapper) {
    border-radius: 10px;
    background: var(--el-bg-color);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    transition: all 0.3s ease;

    &:hover,
    &:focus-within {
      box-shadow: 0 4px 16px rgba(var(--el-color-primary-rgb), 0.12);
      border-color: var(--el-color-primary-light-5);
    }
  }
}

.footer-height {
  height: auto;
  padding: 16px 20px;
  background: var(--el-bg-color-overlay);
  border-top: 1px solid var(--el-border-color-lighter);
  position: relative;
  z-index: 2;
}

.full-width {
  width: 100%;
  border-radius: 10px;
  height: 40px;
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(var(--el-color-primary-rgb), 0.3);
  }
}

.dict-list {
  display: flex;
  flex: 1 1 0;
  flex-direction: column;
  gap: 10px;
  min-height: 0;
  height: auto;
  padding: 12px;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.dict-list-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  width: 100%;
  padding: 12px 14px;
  text-align: left;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  transition: all 0.2s ease;

  &:hover {
    border-color: rgba(var(--el-color-primary-rgb), 0.28);
    box-shadow: 0 8px 18px rgba(0, 0, 0, 0.06);
    transform: translateY(-1px);
  }

  &.active {
    background: linear-gradient(
      135deg,
      var(--el-color-primary-light-9) 0%,
      var(--el-bg-color) 100%
    );
    border-color: rgba(var(--el-color-primary-rgb), 0.36);
    box-shadow: 0 10px 22px rgba(var(--el-color-primary-rgb), 0.12);
  }
}

.dict-list-main {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.dict-list-title {
  display: flex;
  gap: 8px;
  align-items: center;
  min-width: 0;
  font-weight: 600;
  color: var(--el-text-color-primary);

  span:last-child {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.dict-list-code {
  overflow: hidden;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dict-list-actions {
  display: flex;
  gap: 6px;
  align-items: center;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.dict-list-item:hover .dict-list-actions,
.dict-list-item.active .dict-list-actions {
  opacity: 1;
}

:deep(.el-skeleton) {
  padding: 16px;

  .el-skeleton__item {
    border-radius: 8px;
  }
}
</style>
