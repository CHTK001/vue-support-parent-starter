<template>
  <div class="sc-table-select">
    <div class="sc-table-select__trigger">
      <ElInput
        :model-value="displayText"
        :placeholder="placeholder"
        readonly
        clearable
        @click="openDialog"
        @clear="clearSelection"
      >
        <template #append>
          <ElButton @click.stop="openDialog">选择</ElButton>
        </template>
      </ElInput>
    </div>

    <ElDialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="min(960px, 92vw)"
      destroy-on-close
      @opened="syncTableSelection"
    >
      <div class="sc-table-select__toolbar">
        <slot name="header" />
        <div class="sc-table-select__toolbar-main">
          <slot name="toolbar" />
          <ElInput
            v-if="showSearch"
            v-model="keyword"
            class="sc-table-select__search"
            clearable
            :placeholder="searchPlaceholder"
            @input="handleKeywordChange"
            @clear="handleKeywordChange"
          />
        </div>
      </div>

      <div v-if="loading" class="sc-table-select__loading">加载中...</div>

      <ElTable
        ref="tableRef"
        :data="rows"
        :border="border"
        :max-height="resolvedMaxHeight"
        highlight-current-row
        @selection-change="handleMultiSelectionChange"
        @row-click="handleRowClick"
      >
        <ElTableColumn v-if="multiple" type="selection" width="48" />
        <ElTableColumn v-else label="选择" width="72" align="center">
          <template #default="{ row }">
            <ElButton
              link
              type="primary"
              @click.stop="selectSingle(row)"
            >
              {{ isPendingSelected(row) ? "已选" : "选择" }}
            </ElButton>
          </template>
        </ElTableColumn>

        <ElTableColumn
          v-for="column in normalizedColumns"
          :key="column.prop"
          :prop="column.prop"
          :label="column.label"
          :min-width="column.minWidth || column.width || 120"
          :width="column.width"
          show-overflow-tooltip
        >
          <template #default="scope">
            <slot :name="column.prop" v-bind="scope">
              {{ scope.row[column.prop] ?? "--" }}
            </slot>
          </template>
        </ElTableColumn>

        <template #empty>
          <slot name="empty">
            <ElEmpty description="暂无数据" :image-size="60" />
          </slot>
        </template>
      </ElTable>

      <div class="sc-table-select__footer">
        <slot name="footer" />
        <div class="sc-table-select__footer-meta">
          <span class="sc-table-select__summary">{{ selectionSummary }}</span>
          <ElPagination
            v-if="showPagination"
            background
            layout="prev, pager, next"
            :current-page="currentPage"
            :page-size="currentPageSize"
            :total="total"
            @current-change="handlePageChange"
          />
        </div>
      </div>

      <template #footer>
        <div class="sc-table-select__actions">
          <ElButton @click="closeDialog">取消</ElButton>
          <ElButton type="primary" @click="confirmSelection">确定</ElButton>
        </div>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
import { ElButton, ElDialog, ElEmpty, ElInput, ElPagination, ElTable, ElTableColumn } from "element-plus";
import type { TableInstance } from "element-plus";
import { computed, nextTick, reactive, ref, watch } from "vue";
import config from "./setting";

type TableRow = Record<string, any>;
type TableColumnConfig = {
  label?: string;
  prop: string;
  width?: number | string;
  minWidth?: number | string;
};

const props = withDefaults(
  defineProps<{
    modelValue?: unknown;
    data?: TableRow[];
    options?: TableRow[];
    url?: ((params: Record<string, any>) => Promise<any>) | null;
    params?: Record<string, any>;
    urlParams?: Record<string, any>;
    keywords?: Record<string, string>;
    columns?: TableColumnConfig[];
    multiple?: boolean;
    placeholder?: string;
    maxHeight?: number | string;
    height?: number | string;
    filterable?: boolean;
    remote?: boolean;
    remoteSearch?: boolean;
    isRemote?: boolean;
    remoteParameterName?: string;
    border?: boolean;
    pageSize?: number;
    limit?: number;
    title?: string;
  }>(),
  {
    modelValue: "",
    data: () => [],
    options: () => [],
    url: null,
    params: () => ({}),
    urlParams: () => ({}),
    keywords: () => ({ label: "label", value: "value" }),
    columns: () => [],
    multiple: false,
    placeholder: "请选择",
    maxHeight: 420,
    height: 420,
    filterable: true,
    remote: false,
    remoteSearch: false,
    isRemote: false,
    remoteParameterName: "keywords",
    border: true,
    pageSize: 10,
    limit: 0,
    title: "",
  },
);

const emit = defineEmits<{
  (e: "update:modelValue", value: unknown): void;
  (e: "selectionChange", rows: unknown, value: unknown): void;
  (e: "success", value?: unknown): void;
  (e: "failure", error: unknown): void;
}>();

const dialogVisible = ref(false);
const keyword = ref("");
const loading = ref(false);
const rows = ref<TableRow[]>([]);
const total = ref(0);
const currentPage = ref(1);
const currentPageSize = ref(props.pageSize);
const selectedKeys = ref<any[]>([]);
const pendingKeys = ref<any[]>([]);
const extraParams = ref<Record<string, any>>({});
const tableRef = ref<TableInstance>();
const selectionCache = reactive(new Map<any, TableRow>());

const valueKey = computed(() => props.keywords?.value || "value");
const labelKey = computed(() => props.keywords?.label || "label");
const sourceRows = computed(() => {
  const source = props.data.length ? props.data : props.options;
  return props.limit > 0 ? source.slice(0, props.limit) : source;
});
const shouldRequestRemote = computed(
  () =>
    typeof props.url === "function" &&
    (props.isRemote || props.remote || props.remoteSearch || !sourceRows.value.length),
);
const resolvedMaxHeight = computed(() => props.maxHeight || props.height || 420);
const dialogTitle = computed(() => props.title || props.placeholder || "请选择");
const showSearch = computed(
  () => props.filterable || props.remoteSearch || props.remote || shouldRequestRemote.value,
);
const showPagination = computed(
  () => total.value > currentPageSize.value || shouldRequestRemote.value,
);
const normalizedColumns = computed<TableColumnConfig[]>(() => {
  if (props.columns.length) {
    return props.columns;
  }

  const sample = sourceRows.value[0] || rows.value[0];
  if (!sample) {
    return [
      { label: "名称", prop: labelKey.value },
      { label: "值", prop: valueKey.value },
    ];
  }

  return Object.keys(sample)
    .slice(0, 4)
    .map((prop) => ({
      prop,
      label: prop,
    }));
});
const searchPlaceholder = computed(() =>
  props.remoteSearch || shouldRequestRemote.value ? "输入关键字后检索" : "输入关键字后过滤",
);
const selectionSummary = computed(() =>
  props.multiple
    ? `已选择 ${selectedKeys.value.length} 项`
    : selectedKeys.value.length
      ? "已选择 1 项"
      : "未选择",
);
const displayText = computed(() => {
  if (!selectedKeys.value.length) {
    return "";
  }

  const labels = selectedKeys.value
    .map((key) => getLabelByKey(key))
    .filter((value) => value !== "");

  return props.multiple ? labels.join("、") : labels[0] || "";
});

const cacheRow = (row: TableRow | undefined | null) => {
  if (!row || typeof row !== "object") {
    return;
  }

  const key = row[valueKey.value];
  if (key === undefined || key === null || key === "") {
    return;
  }
  selectionCache.set(key, row);
};

const cacheModelValue = (value: unknown) => {
  if (Array.isArray(value)) {
    value.forEach((item) => cacheModelValue(item));
    return;
  }

  if (value && typeof value === "object") {
    cacheRow(value as TableRow);
  }
};

const normalizeToKeys = (value: unknown): any[] => {
  if (value === undefined || value === null || value === "") {
    return [];
  }

  if (Array.isArray(value)) {
    return value
      .map((item) =>
        item && typeof item === "object" ? item[valueKey.value] : item,
      )
      .filter((item) => item !== undefined && item !== null && item !== "");
  }

  if (value && typeof value === "object") {
    const key = (value as TableRow)[valueKey.value];
    return key === undefined || key === null || key === "" ? [] : [key];
  }

  return [value];
};

const getLabelByKey = (key: any) => {
  if (key === undefined || key === null || key === "") {
    return "";
  }

  const cachedRow = selectionCache.get(key);
  if (cachedRow) {
    return String(
      cachedRow[labelKey.value] ?? cachedRow.name ?? cachedRow.label ?? key,
    );
  }

  const model = props.modelValue;
  if (model && typeof model === "object" && !Array.isArray(model)) {
    const modelRow = model as TableRow;
    if (modelRow[valueKey.value] === key) {
      return String(
        modelRow[labelKey.value] ?? modelRow.name ?? modelRow.label ?? key,
      );
    }
  }

  return String(key);
};

const matchesKeyword = (row: TableRow, searchValue: string) => {
  if (!searchValue) {
    return true;
  }

  const lowered = searchValue.trim().toLowerCase();
  if (!lowered) {
    return true;
  }

  return normalizedColumns.value.some((column) =>
    String(row[column.prop] ?? "").toLowerCase().includes(lowered),
  );
};

const buildRequestParams = () => {
  const requestParams = {
    ...props.params,
    ...props.urlParams,
    ...extraParams.value,
    page: currentPage.value,
    pageSize: currentPageSize.value,
  };

  if (keyword.value.trim()) {
    requestParams[props.remoteParameterName] = keyword.value.trim();
  }

  return requestParams;
};

const loadLocalRows = () => {
  const filteredRows =
    props.filterable && keyword.value.trim()
      ? sourceRows.value.filter((row) => matchesKeyword(row, keyword.value))
      : sourceRows.value;

  total.value = filteredRows.length;
  const startIndex = (currentPage.value - 1) * currentPageSize.value;
  rows.value = filteredRows.slice(startIndex, startIndex + currentPageSize.value);
  rows.value.forEach(cacheRow);
  emit("success");
};

const loadRemoteRows = async () => {
  if (typeof props.url !== "function") {
    rows.value = [];
    total.value = 0;
    return;
  }

  loading.value = true;
  try {
    const result = await props.url(buildRequestParams());
    const parsed = config.parseData(result);
    rows.value = Array.isArray(parsed.data) ? parsed.data : [];
    total.value = Number(parsed.total ?? rows.value.length);
    rows.value.forEach(cacheRow);
    emit("success", result);
  } catch (error) {
    rows.value = [];
    total.value = 0;
    emit("failure", error);
  } finally {
    loading.value = false;
  }
};

const refreshRows = async () => {
  if (shouldRequestRemote.value) {
    await loadRemoteRows();
  } else {
    loadLocalRows();
  }
};

const syncTableSelection = async () => {
  await nextTick();
  if (!tableRef.value) {
    return;
  }

  if (props.multiple) {
    tableRef.value.clearSelection();
    rows.value.forEach((row) => {
      if (pendingKeys.value.includes(row[valueKey.value])) {
        tableRef.value?.toggleRowSelection(row, true);
      }
    });
  } else {
    const currentRow = rows.value.find(
      (row) => row[valueKey.value] === pendingKeys.value[0],
    );
    tableRef.value.setCurrentRow?.(currentRow || null);
  }
};

const openDialog = async () => {
  dialogVisible.value = true;
  pendingKeys.value = [...selectedKeys.value];
  await refreshRows();
  await syncTableSelection();
};

const closeDialog = () => {
  dialogVisible.value = false;
  pendingKeys.value = [...selectedKeys.value];
};

const handleKeywordChange = async () => {
  currentPage.value = 1;
  await refreshRows();
  await syncTableSelection();
};

const handlePageChange = async (page: number) => {
  currentPage.value = page;
  await refreshRows();
  await syncTableSelection();
};

const handleMultiSelectionChange = (selection: TableRow[]) => {
  if (!props.multiple) {
    return;
  }

  selection.forEach(cacheRow);
  pendingKeys.value = selection
    .map((row) => row[valueKey.value])
    .filter((item) => item !== undefined && item !== null && item !== "");
};

const selectSingle = (row: TableRow) => {
  cacheRow(row);
  pendingKeys.value = [row[valueKey.value]];
  tableRef.value?.setCurrentRow?.(row);
};

const handleRowClick = (row: TableRow) => {
  if (props.multiple) {
    tableRef.value?.toggleRowSelection(row);
    return;
  }

  selectSingle(row);
};

const resolveSelectionRows = (keys: any[]) =>
  keys
    .map((key) => selectionCache.get(key))
    .filter((row): row is TableRow => Boolean(row));

const confirmSelection = () => {
  const nextKeys = [...pendingKeys.value];
  const nextRows = resolveSelectionRows(nextKeys);
  const emittedValue = props.multiple ? nextKeys : (nextKeys[0] ?? "");
  const emittedRows = props.multiple ? nextRows : (nextRows[0] ?? null);

  selectedKeys.value = nextKeys;
  emit("update:modelValue", emittedValue);
  emit("selectionChange", emittedRows, emittedValue);
  dialogVisible.value = false;
};

const clearSelection = () => {
  selectedKeys.value = [];
  pendingKeys.value = [];
  emit("update:modelValue", props.multiple ? [] : "");
  emit("selectionChange", props.multiple ? [] : null, props.multiple ? [] : "");
};

const reload = async (params: Record<string, any> = {}) => {
  extraParams.value = { ...params };
  currentPage.value = 1;
  await refreshRows();
};

const setValue = (value: unknown) => {
  cacheModelValue(value);
  const keys = normalizeToKeys(value);
  selectedKeys.value = keys;
  pendingKeys.value = [...keys];
};

const handleClose = () => {
  closeDialog();
};

const isPendingSelected = (row: TableRow) =>
  pendingKeys.value.includes(row[valueKey.value]);

watch(
  () => props.modelValue,
  (value) => {
    cacheModelValue(value);
    const keys = normalizeToKeys(value);
    selectedKeys.value = keys;
    pendingKeys.value = [...keys];
  },
  { deep: true, immediate: true },
);

watch(
  () => [props.data, props.options, props.params, props.urlParams],
  async () => {
    await refreshRows();
  },
  { deep: true, immediate: true },
);

defineExpose({
  reload,
  setValue,
  handleClose,
});
</script>

<style scoped lang="scss">
.sc-table-select {
  width: 100%;
}

.sc-table-select__trigger {
  width: 100%;
}

.sc-table-select__toolbar {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.sc-table-select__toolbar-main {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
}

.sc-table-select__search {
  width: min(320px, 100%);
}

.sc-table-select__loading {
  margin-bottom: 12px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.sc-table-select__footer {
  display: flex;
  gap: 12px;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  margin-top: 16px;
}

.sc-table-select__footer-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;
  flex-wrap: wrap;
}

.sc-table-select__summary {
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.sc-table-select__actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

@media (max-width: 768px) {
  .sc-table-select__footer,
  .sc-table-select__footer-meta,
  .sc-table-select__actions {
    width: 100%;
  }

  .sc-table-select__footer-meta,
  .sc-table-select__actions {
    justify-content: space-between;
  }
}
</style>
