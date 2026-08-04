<script setup lang="ts">
/**
 * ReTable —— 表格组件
 *
 * 三种数据源模式：
 *   1) 静态数组：:data="[...]"
 *   2) 远程 url：url="/api/users" + :params="{...}" + 分页会自动带上 page/pageSize
 *   3) 自定义函数：:data="(p) => fetchUsers(p)"
 *
 * 暴露方法：
 *   - reload()  重新加载（带 resetPage 选项）
 *   - goto(p?, s?)  跳转页 / 每页条数（参数缺省保持原值）
 *   - resetColumns()  重置列配置（清除持久化）
 *
 * 工具栏（分页上方右侧）：
 *   - 刷新：触发 reload()
 *   - 列设置：popover 中可排序 / 隐藏 / 显示
 *   - 表格设置：popover 中切换斑马纹 / 边框 / 紧凑 / 高亮当前行
 *
 * 列配置持久化：
 *   - 传 tableId 后，会按 "re-table:<tableId>" 持久化到 storage（默认 localStorage）
 *   - 可通过 :storage="myAdapter" 注入自定义存储
 */
import { computed, inject, ref, useSlots, watch } from "vue";
import { ElTable, ElTableColumn, ElPagination, ElButton, ElPopover, ElCheckbox, ElCheckboxGroup, ElRadioGroup, ElRadio, ElTooltip, ElIcon } from "element-plus";
import { Refresh, Setting, Menu } from "@element-plus/icons-vue";
import { useDataSource, type ReDataSource } from "@repo/core";
import ReTableVirtualView from "./ReTableVirtualView.vue";
import ReTableCardView from "./ReTableCardView.vue";
import ReSwitch from "../ReSwitch/ReSwitch.vue";
import type {
  ReCardLayoutProps,
  RePageResult,
  ReTableColumn,
  ReTableColumnState,
  ReTableLayout,
  ReTableLoader,
  ReTableSettings,
  ReVirtualLayoutProps,
} from "./types";
import type { ReTableColumnStorage } from "./columnStorage";
import { localColumnStorage } from "./columnStorage";

defineOptions({ name: "ReTable", inheritAttrs: true });

/** 父组件传入的具名插槽（兼容 `#col-actions` 与 `#actions` 两种命名） */
const parentSlots = useSlots();
function resolveColSlotName(col: ReTableColumn): string | undefined {
  const candidates = [col.slot || `col-${col.prop}`];
  if (col.slot) {
    candidates.push(`col-${col.slot}`);
    candidates.push(col.slot);
  }
  for (const name of candidates) {
    if (parentSlots[name]) return name;
  }
  return candidates[0];
}
function hasColSlot(col: ReTableColumn): boolean {
  return Boolean(parentSlots[col.slot || `col-${col.prop}`] || (col.slot && (parentSlots[`col-${col.slot}`] || parentSlots[col.slot])));
}

/** 全局可注入 storage（key 与 columnStorage 一致，方便业务注入） */
const RE_TABLE_STORAGE_KEY = Symbol("ReTableStorage") as unknown as import("vue").InjectionKey<ReTableColumnStorage>;

const props = withDefaults(
  defineProps<{
    /** 静态行数据 */
    data?: Array<Record<string, unknown>>;
    /** 远程 url（与 data/loader 二选一） */
    url?: string;
    /** 自定义加载器（与 url 二选一），签名见 types.ts */
    loader?: ReTableLoader;
    /** 远程查询参数 */
    params?: Record<string, unknown>;
    /** 列定义 */
    columns?: ReTableColumn[];
    /** 加载状态（外部控制） */
    loading?: boolean;
    /** 表格外观设置（受控，可被工具栏修改） */
    settings?: ReTableSettings;
    /** 行 key 字段 */
    rowKey?: string;
    /** 空数据文案 */
    emptyText?: string;
    /** 是否显示分页 */
    pagination?: boolean;
    /** 分页总条数（静态模式下生效） */
    total?: number;
    /** 分页当前页 */
    page?: number;
    /** 分页每页条数 */
    pageSize?: number;
    /** 每页条数选项 */
    pageSizes?: number[];
    /** 远程模式：自动随 params / page / pageSize 重新加载 */
    autoReload?: boolean;
    /** 表格唯一标识；传入后列配置（顺序 / 隐藏）会持久化 */
    tableId?: string;
    /** 自定义 storage（默认 localStorage），可通过 app.provide 注入全局 */
    storage?: ReTableColumnStorage;
    /** 是否显示工具栏（刷新 / 列设置 / 表格设置） */
    toolbar?: boolean;
    /** 列设置 popover 触发文案 */
    columnsTriggerText?: string;
    /** 表格设置 popover 触发文案 */
    settingsTriggerText?: string;
    /** 布局模式：默认表格 / 虚拟表格 / 卡片（瀑布流） */
    layout?: ReTableLayout;
    /** 卡片模式专属属性（layout-card-*） */
    layoutCard?: ReCardLayoutProps;
    /** 虚拟表格模式专属属性（layout-virtual-*） */
    layoutVirtual?: ReVirtualLayoutProps;
    /** 默认表格模式专属属性（layout-table-*） */
    layoutTable?: {
      /** 是否显示表头 */
      showHeader?: boolean;
      /** 表格高度 */
      height?: string | number;
      /** 最大高度 */
      maxHeight?: string | number;
    };
  }>(),
  {
    data: () => [],
    url: "",
    loader: undefined,
    params: () => ({}),
    columns: () => [],
    loading: false,
    settings: () => ({}),
    rowKey: "id",
    emptyText: "暂无数据",
    pagination: false,
    total: 0,
    page: 1,
    pageSize: 10,
    pageSizes: () => [10, 20, 50, 100],
    autoReload: true,
    tableId: "",
    storage: undefined,
    toolbar: true,
    columnsTriggerText: "列设置",
    settingsTriggerText: "表格设置",
    layout: "table",
    layoutCard: () => ({}),
    layoutVirtual: () => ({}),
    layoutTable: () => ({}),
  },
);

const emit = defineEmits<{
  (e: "update:page", page: number): void;
  (e: "update:pageSize", size: number): void;
  (e: "update:total", total: number): void;
  (e: "update:settings", settings: ReTableSettings): void;
  (e: "row-click", row: Record<string, unknown>): void;
  (e: "selection-change", rows: Record<string, unknown>[]): void;
  (e: "load", payload: RePageResult): void;
  (e: "load-error", err: Error): void;
}>();

/** 是否使用远程模式 */
const isRemote = computed<boolean>(() => Boolean(props.url) || typeof props.loader === "function");

/** 远程模式：总条数由接口返回 */
const remoteTotal = ref<number>(0);
const totalToShow = computed<number>(() => (isRemote.value ? remoteTotal.value : props.total));

/** 实际生效的 storage：props 注入 → provide 注入 → localStorage 默认 */
const injectedStorage = inject<ReTableColumnStorage | undefined>(RE_TABLE_STORAGE_KEY, undefined);
const effectiveStorage = computed<ReTableColumnStorage>(() => props.storage ?? injectedStorage ?? localColumnStorage);

/** 列持久化状态（顺序 + 隐藏） */
const columnState = ref<ReTableColumnState>({ order: [], hidden: [] });

/** 初始化列顺序：props.columns 决定默认顺序，持久化存在时覆盖 */
function defaultOrderFromColumns(): string[] {
  return props.columns.filter((c) => !c.hidden).map((c) => c.prop);
}

function loadColumnState(): void {
  if (!props.tableId) {
    columnState.value = { order: defaultOrderFromColumns(), hidden: [] };
    return;
  }
  const saved = effectiveStorage.value.get(props.tableId);
  if (saved) {
    // 过滤掉已不存在的列 prop
    const propsList = props.columns.map((c) => c.prop);
    const validOrder = saved.order.filter((p) => propsList.includes(p));
    // 把新出现的列追加到末尾
    for (const p of propsList) {
      if (!validOrder.includes(p) && !saved.hidden.includes(p)) validOrder.push(p);
    }
    columnState.value = {
      order: validOrder,
      hidden: saved.hidden.filter((p) => propsList.includes(p)),
    };
    return;
  }
  columnState.value = { order: defaultOrderFromColumns(), hidden: [] };
}

function saveColumnState(): void {
  if (!props.tableId) return;
  effectiveStorage.value.set(props.tableId, columnState.value);
}

/** 监听 tableId / columns 变化时重载列配置 */
watch(
  () => [props.tableId, props.columns] as const,
  () => {
    loadColumnState();
  },
  { immediate: true, deep: true },
);

/** 应用列顺序与隐藏后的最终列数组 */
const visibleColumns = computed<ReTableColumn[]>(() => {
  const baseList = props.columns;
  const order = columnState.value.order;
  const hidden = new Set(columnState.value.hidden);
  const byProp = new Map(baseList.map((c) => [c.prop, c] as const));
  // 先按 order 排，再追加 order 中没有的列
  const ordered: ReTableColumn[] = [];
  const seen = new Set<string>();
  for (const prop of order) {
    const col = byProp.get(prop);
    if (col) {
      ordered.push(col);
      seen.add(prop);
    }
  }
  for (const col of baseList) {
    if (!seen.has(col.prop)) ordered.push(col);
  }
  return ordered.filter((c) => !hidden.has(c.prop) && !c.hidden);
});

/** 列设置面板使用：含所有列（隐藏列也展示） */
const allColumnsForSettings = computed<ReTableColumn[]>(() => {
  const order = columnState.value.order;
  const byProp = new Map(props.columns.map((c) => [c.prop, c] as const));
  const ordered: ReTableColumn[] = [];
  const seen = new Set<string>();
  for (const prop of order) {
    const col = byProp.get(prop);
    if (col) {
      ordered.push(col);
      seen.add(prop);
    }
  }
  for (const col of props.columns) {
    if (!seen.has(col.prop)) ordered.push(col);
  }
  return ordered;
});

/** 列设置面板：可见列的 prop（未隐藏 = 选中） */
const visiblePropList = computed<string[]>(() =>
  allColumnsForSettings.value
    .map((c) => c.prop)
    .filter((p) => !columnState.value.hidden.includes(p)),
);

function onColumnCheckChange(propsList: string[]): void {
  const all = allColumnsForSettings.value.map((c) => c.prop);
  const visible = new Set(propsList);
  const hidden = all.filter((p) => !visible.has(p));
  columnState.value = { ...columnState.value, hidden };
  saveColumnState();
}

/** 列设置面板拖拽排序 */
const dragIndex = ref<number>(-1);

function onDragStart(index: number, event: DragEvent): void {
  dragIndex.value = index;
  if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
}

function onDragOver(event: DragEvent): void {
  event.preventDefault();
  if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
}

function onDrop(index: number): void {
  if (dragIndex.value === -1 || dragIndex.value === index) return;
  const list = [...columnState.value.order];
  const [moved] = list.splice(dragIndex.value, 1);
  list.splice(index, 0, moved);
  columnState.value = { ...columnState.value, order: list };
  dragIndex.value = -1;
  saveColumnState();
}

function onDragEnd(): void {
  dragIndex.value = -1;
}

function moveColumn(index: number, delta: number): void {
  const list = [...columnState.value.order];
  const target = index + delta;
  if (target < 0 || target >= list.length) return;
  [list[index], list[target]] = [list[target], list[index]];
  columnState.value = { ...columnState.value, order: list };
  saveColumnState();
}

function resetColumns(): void {
  if (props.tableId) effectiveStorage.value.remove(props.tableId);
  loadColumnState();
}

/** 表格外观设置：受控（v-model:settings），并写入 props.settings 响应 */
const localSettings = ref<ReTableSettings>({ ...props.settings });
watch(
  () => props.settings,
  (v) => {
    localSettings.value = { ...v };
  },
  { deep: true, immediate: true },
);

function emitSettings(): void {
  emit("update:settings", { ...localSettings.value });
}

function onSettingChange<K extends keyof ReTableSettings>(key: K, value: ReTableSettings[K]): void {
  localSettings.value = { ...localSettings.value, [key]: value };
  emitSettings();
}

/** 远程数据加载 */
function buildRemoteSource(): ReDataSource<Array<Record<string, unknown>>> {
  const run = async (): Promise<Array<Record<string, unknown>>> => {
    const paramObj = props.params ?? {};
    const loadParams = {
      page: props.page,
      pageSize: props.pageSize,
      params: { ...paramObj, page: props.page, pageSize: props.pageSize },
    };
    let result: RePageResult | undefined;
    try {
      if (typeof props.loader === "function") {
        result = await props.loader(loadParams);
      } else if (props.url) {
        const qs = new URLSearchParams();
        qs.set("page", String(loadParams.page));
        qs.set("pageSize", String(loadParams.pageSize));
        for (const [k, v] of Object.entries(paramObj)) {
          if (v === undefined || v === null || v === "") continue;
          qs.set(k, String(v));
        }
        const sep = props.url.includes("?") ? "&" : "?";
        const fullUrl = `${props.url}${sep}${qs.toString()}`;
        const res = await fetch(fullUrl, { headers: { Accept: "application/json" } });
        if (!res.ok) throw new Error(`数据请求失败: ${props.url} (${res.status})`);
        const json = (await res.json()) as unknown;
        result = extractPageResult(json);
      }
      if (!result) throw new Error("未获取到分页数据");
      remoteTotal.value = Number(result.total ?? 0);
      emit("update:total", remoteTotal.value);
      emit("load", result);
      return extractRecords(result);
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      emit("load-error", err);
      throw err;
    }
  };
  return run;
}

function extractPageResult(payload: unknown): RePageResult | undefined {
  if (payload == null || typeof payload !== "object") return undefined;
  const obj = payload as Record<string, unknown>;
  if (typeof obj.total === "number") return obj as RePageResult;
  const inner = (typeof obj.data === "object" && obj.data !== null ? obj.data : obj) as Record<
    string,
    unknown
  >;
  if (typeof inner.total === "number") return inner as RePageResult;
  return undefined;
}

function extractRecords(result: RePageResult): Array<Record<string, unknown>> {
  for (const key of ["records", "rows", "list", "items", "content", "data"] as const) {
    if (Array.isArray(result[key])) return result[key] as Array<Record<string, unknown>>;
  }
  return [];
}

const sourceRef = computed<ReDataSource<Array<Record<string, unknown>>>>(() => {
  if (isRemote.value) return buildRemoteSource();
  return props.data ?? [];
});

const { loading: dataLoading, data: dataList, reload: dsReload } = useDataSource<Array<Record<string, unknown>>>(
  sourceRef,
);

/** params 变化 → 重置回第 1 页 */
const internalParamsKey = computed<string>(() => JSON.stringify(props.params ?? {}));
const lastParamsKey = ref<string>(internalParamsKey.value);

watch(internalParamsKey, (key) => {
  if (!isRemote.value || !props.autoReload) return;
  if (key === lastParamsKey.value) return;
  lastParamsKey.value = key;
  if (props.page !== 1) {
    emit("update:page", 1);
    void dsReload();
  }
});

function formatCell(row: Record<string, unknown>, column: ReTableColumn): string {
  const value = row[column.prop];
  if (column.formatter) {
    return column.formatter(row, column, value);
  }
  if (value == null) return "-";
  return String(value);
}

function onPageChange(p: number): void {
  emit("update:page", p);
}
function onSizeChange(s: number): void {
  emit("update:pageSize", s);
  if (props.page !== 1) emit("update:page", 1);
}

async function reload(): Promise<void> {
  await dsReload();
}
async function goto(page?: number, size?: number): Promise<void> {
  if (typeof page === "number" && page > 0) emit("update:page", page);
  if (typeof size === "number" && size > 0) emit("update:pageSize", size);
  await dsReload();
}

/** 表格尺寸：紧凑模式 → small */
const tableSize = computed<"default" | "small">(() =>
  localSettings.value.compact ? "small" : "default",
);

/** 空数据状态（用于添加 body 最小高度，避免无行时表格塌陷） */
const isEmpty = computed(() => !dataList.value || dataList.value.length === 0);

defineExpose({
  reload,
  goto,
  resetColumns,
  get loading(): boolean {
    return dataLoading.value;
  },
  get data(): Array<Record<string, unknown>> | null {
    return dataList.value;
  },
});

watch(
  () => (isRemote.value ? `${props.page}-${props.pageSize}` : ""),
  (key) => {
    if (!isRemote.value || !props.autoReload || key === "") return;
    void dsReload();
  },
);

/** 工具栏按钮图标（来自 @element-plus/icons-vue） */
const iconRefresh = Refresh;
const iconColumns = Menu;
const iconSettings = Setting;
</script>

<template>
  <div class="re-table" :class="{ 're-table--empty': isEmpty }">
    <!-- 默认表格模式 -->
    <ElTable
      v-if="layout === 'table'"
      v-bind="$attrs"
      :data="dataList ?? []"
      :loading="loading || dataLoading"
      :highlight-current-row="localSettings.highlightCurrentRow ?? false"
      :stripe="localSettings.stripe ?? false"
      :border="localSettings.border ?? false"
      :size="tableSize"
      :row-key="rowKey"
      :empty-text="emptyText"
      :show-header="layoutTable?.showHeader ?? true"
      :height="layoutTable?.height"
      :max-height="layoutTable?.maxHeight"
      @row-click="(row: Record<string, unknown>) => emit('row-click', row)"
      @selection-change="(rows: Record<string, unknown>[]) => emit('selection-change', rows)"
    >
      <template v-for="col in visibleColumns" :key="col.prop || col.label">
        <ElTableColumn
          v-if="hasColSlot(col)"
          :label="col.label"
          :width="col.width"
          :min-width="col.minWidth"
          :fixed="col.fixed"
          :align="col.align"
          :sortable="col.sortable"
        >
          <template #default="{ row }">
            <slot :name="resolveColSlotName(col)" :row="row" :value="row[col.prop]" />
          </template>
        </ElTableColumn>
        <ElTableColumn
          v-else
          :prop="col.prop"
          :label="col.label"
          :width="col.width"
          :min-width="col.minWidth"
          :fixed="col.fixed"
          :align="col.align"
          :sortable="col.sortable"
        >
          <template #default="{ row }">
            {{ formatCell(row, col) }}
          </template>
        </ElTableColumn>
      </template>
      <slot />
    </ElTable>

    <!-- 虚拟表格模式 -->
    <ReTableVirtualView
      v-else-if="layout === 'virtual'"
      :rows="dataList ?? []"
      :columns="visibleColumns"
      :layout="layoutVirtual ?? {}"
      @row-click="(row: Record<string, unknown>) => emit('row-click', row)"
    />

    <!-- 卡片模式（瀑布流） -->
    <ReTableCardView
      v-else-if="layout === 'card'"
      :rows="dataList ?? []"
      :columns="visibleColumns"
      :layout="layoutCard ?? {}"
      @row-click="(row: Record<string, unknown>) => emit('row-click', row)"
    />

    <div v-if="pagination || toolbar" class="re-table__footer">
      <div class="re-table__toolbar" v-if="toolbar">
        <!-- 列设置 -->
        <ElPopover
          v-if="props.columns.length > 0"
          placement="bottom-end"
          :width="280"
          trigger="click"
          popper-class="re-table__popover"
        >
          <template #reference>
            <ElButton :size="tableSize" plain :title="columnsTriggerText">
              <ElIcon><component :is="iconColumns" /></ElIcon>
            </ElButton>
          </template>
          <div class="re-table__columns-panel">
            <div class="re-table__columns-header">
              <span>列设置</span>
              <ElButton
                link
                type="primary"
                :size="tableSize"
                @click="resetColumns"
              >重置</ElButton>
            </div>
            <ElCheckboxGroup
              :model-value="visiblePropList"
              @change="(v: string[]) => onColumnCheckChange(v)"
            >
              <ul class="re-table__columns-list">
                <li
                  v-for="(col, idx) in allColumnsForSettings"
                  :key="col.prop"
                  class="re-table__columns-item"
                  draggable="true"
                  @dragstart="(e: DragEvent) => onDragStart(idx, e)"
                  @dragover="onDragOver"
                  @drop="onDrop(idx)"
                  @dragend="onDragEnd"
                >
                  <span class="re-table__drag-handle">⋮⋮</span>
                  <ElCheckbox :value="col.prop" :label="col.prop">
                    {{ col.label }}
                  </ElCheckbox>
                  <span class="re-table__columns-actions">
                    <ElButton link :size="tableSize" :disabled="idx === 0" @click="moveColumn(idx, -1)">↑</ElButton>
                    <ElButton link :size="tableSize" :disabled="idx === allColumnsForSettings.length - 1" @click="moveColumn(idx, 1)">↓</ElButton>
                  </span>
                </li>
              </ul>
            </ElCheckboxGroup>
            <div v-if="!tableId" class="re-table__columns-hint">
              设置 tableId 后列顺序 / 隐藏将自动持久化
            </div>
          </div>
        </ElPopover>

        <!-- 表格设置 -->
        <ElPopover
          placement="bottom-end"
          :width="280"
          trigger="click"
          popper-class="re-table__popover"
        >
          <template #reference>
            <ElButton :size="tableSize" plain :title="settingsTriggerText">
              <ElIcon><component :is="iconSettings" /></ElIcon>
            </ElButton>
          </template>
          <div class="re-table__settings-panel">
            <ReSwitch
              card
              title="斑马纹"
              :model-value="localSettings.stripe ?? false"
              @update:model-value="(v: boolean | string | number) => onSettingChange('stripe', Boolean(v))"
            />
            <ReSwitch
              card
              title="边框"
              :model-value="localSettings.border ?? false"
              @update:model-value="(v: boolean | string | number) => onSettingChange('border', Boolean(v))"
            />
            <ReSwitch
              card
              title="紧凑"
              :model-value="localSettings.compact ?? false"
              @update:model-value="(v: boolean | string | number) => onSettingChange('compact', Boolean(v))"
            />
            <ReSwitch
              card
              title="高亮当前行"
              :model-value="localSettings.highlightCurrentRow ?? false"
              @update:model-value="(v: boolean | string | number) => onSettingChange('highlightCurrentRow', Boolean(v))"
            />
          </div>
        </ElPopover>

        <!-- 刷新 -->
        <ElTooltip content="刷新" placement="top">
          <ElButton :size="tableSize" plain :loading="dataLoading || loading" @click="reload">
            <ElIcon><component :is="iconRefresh" /></ElIcon>
          </ElButton>
        </ElTooltip>
      </div>

      <div v-if="pagination" class="re-table__pagination">
        <ElPagination
          :current-page="page"
          :page-size="pageSize"
          :total="totalToShow"
          :page-sizes="pageSizes"
          :size="tableSize"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @current-change="(p: number) => onPageChange(p)"
          @size-change="(s: number) => onSizeChange(s)"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.re-table__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
  gap: 12px;
  flex-wrap: wrap;
}
.re-table__toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  order: 2;
}
.re-table__pagination {
  display: flex;
  justify-content: flex-end;
  flex: 1 1 auto;
  order: 1;
  border-right: none;
}
/* 空数据时 body 保持最小高度，避免表格塌陷 */
.re-table--empty :deep(.el-table__body-wrapper) {
  min-height: 160px;
}
.re-table--empty :deep(.el-table__empty-block) {
  min-height: 160px;
}
.re-table__icon {
  display: inline-block;
  font-size: 14px;
  line-height: 1;
  margin-right: 4px;
  vertical-align: middle;
}
.re-table__columns-panel {
  max-height: 360px;
  overflow-y: auto;
}
.re-table__columns-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 4px 8px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.re-table__columns-list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.re-table__columns-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 6px;
  border-radius: 4px;
  cursor: grab;
  user-select: none;
}
.re-table__columns-item:hover {
  background: var(--el-fill-color-light);
}
.re-table__columns-item:active {
  cursor: grabbing;
}
.re-table__drag-handle {
  color: var(--el-text-color-placeholder);
  font-size: 12px;
  cursor: grab;
}
.re-table__columns-actions {
  margin-left: auto;
  display: inline-flex;
  gap: 2px;
}
.re-table__columns-hint {
  margin-top: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.re-table__settings-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
</style>