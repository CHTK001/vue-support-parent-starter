<script setup lang="ts">
/**
 * ReSelect —— 下拉选择组件
 *
 * 多种布局模式：
 *   - "default"：原生 el-select 文本选项
 *   - "card"：卡片式下拉弹窗（支持标签/高阶标记/消耗说明/分组，popover 自动上下适配）
 *   - "card-dropdown"：已合并至 "card"（历史别名，行为相同）
 *   - "table"：表格形式（多列），适合用户列表等场景
 *   - "modern"：现代化扁平选择器（异步加载，独立实现）
 *   - "pill"：药丸式选择器，直接展示所有选项
 *   - "square"：正方形图标选择器，直接展示所有选项
 *
 * 数据源（语义清晰，遵循 data=静态、url=远程、loader=函数 三分原则）：
 *   1) data   —— 静态数组（也可用 options 别名）
 *   2) url    —— 远程接口地址，自动请求 + 防抖 + 重试（getApiHttp）
 *   3) loader —— 自定义加载函数 (params) => Promise<ReOption[]>，用于复杂场景
 *
 * 用法：
 *   <ReSelect :data="[{label:'男',value:1}]" />
 *   <ReSelect url="/api/roles" v-model="id" />
 *   <ReSelect :loader="(p) => fetchRoles(p)" v-model="id" />
 */
import { computed, defineAsyncComponent, ref, watch } from "vue";
import { ElSelect, ElOption, ElCheckbox } from "element-plus";
import { getApiHttp, useDataSource, type ReDataSource } from "@repo/core";
import type { ReOption, ReSelectLayout } from "./types";
import { debounce } from "@repo/utils";

/** Modern 布局组件（按需异步加载） */
const ModernLayout = defineAsyncComponent(() => import("./layouts/Modern.vue"));
/** Pill 布局组件（按需异步加载） */
const PillLayout = defineAsyncComponent(() => import("./layouts/PillLayout.vue"));
/** 卡片下拉布局组件（按需异步加载） */
const CardDropdownLayout = defineAsyncComponent(() => import("./layouts/CardDropdown.vue"));
/** Square 布局组件（按需异步加载） */
const SquareLayout = defineAsyncComponent(() => import("./layouts/Square.vue"));

defineOptions({ name: "ReSelect", inheritAttrs: true });

const model = defineModel<string | number | (string | number)[] | null>({ default: "" });

const props = withDefaults(
  defineProps<{
    /** 静态选项数组（与 url/loader 三选一） */
    data?: ReOption[];
    /** 静态选项别名（与 data 等价，语义更明确） */
    options?: ReOption[];
    /** 远程 url（与 data/loader 三选一）；自动 GET + 防抖 + 重试 */
    url?: string;
    /** 自定义加载器（与 data/url 三选一），签名 (params: {keyword?:string}) => ReOption[] | Promise<ReOption[]> */
    loader?: (params?: Record<string, unknown>) => ReOption[] | Promise<ReOption[]>;
    /** 远程/loader 查询参数 */
    params?: Record<string, unknown>;
    /** 布局模式：default / card / table / modern */
    layout?: ReSelectLayout;
    /** placeholder */
    placeholder?: string;
    /** 是否可清空 */
    clearable?: boolean;
    /** 是否可搜索 */
    filterable?: boolean;
    /** 多选 */
    multiple?: boolean;
    /** 多选折叠 tag */
    collapseTags?: boolean;
    /** 禁用 */
    disabled?: boolean;
    /** loading（外部控制） */
    loading?: boolean;
    /** 尺寸 */
    size?: "large" | "default" | "small";
    /** 卡片 / 表格模式 popover 宽度 */
    popoverWidth?: number;
    /** 卡片模式：列数（瀑布流） */
    cardColumns?: number;
    /** 表格模式：表格列配置 { key, label, width? } */
    tableColumns?: Array<{ key: string; label: string; width?: string | number }>;
    /** 是否自动重新加载（当 params 变化时） */
    autoReload?: boolean;
    /** 卡片下拉模式：弹窗顶部分类标题 */
    title?: string;
    /** 卡片下拉模式：是否显示触发栏图标 */
    triggerIcon?: boolean;
  }>(),
  {
    data: undefined,
    options: undefined,
    url: "",
    loader: undefined,
    params: () => ({}),
    layout: "default",
    placeholder: "请选择",
    clearable: false,
    filterable: false,
    multiple: false,
    collapseTags: false,
    disabled: false,
    loading: false,
    size: "",
    popoverWidth: 280,
    cardColumns: 1,
    tableColumns: () => [],
    autoReload: true,
    title: "",
    triggerIcon: true,
  },
);

/** 是否为远程模式（url / loader） */
const isRemote = computed<boolean>(() => Boolean(props.url) || typeof props.loader === "function");

/** 静态模式下的最终数据（data 优先，否则 options） */
const staticData = computed<ReOption[]>(() => props.data ?? props.options ?? []);

/** 远程搜索关键词（当 filterable 时自动收集） */
const keyword = ref("");

/** 内置远程加载参数对象（合并 keyword + props.params） */
const remoteParams = computed(() => {
  const base = { ...(props.params ?? {}) };
  if (props.filterable && keyword.value) {
    base.keyword = keyword.value;
  }
  return base;
});

/**
 * 远程加载函数：url 模式用 getApiHttp（拦截器含加密/签名/重试），
 * loader 模式直接调用用户函数。
 */
function buildRemoteSource(): ReDataSource<ReOption[]> {
  const run = async (): Promise<ReOption[]> => {
    const paramObj = { ...(props.params ?? {}) };
    if (props.filterable && keyword.value) {
      paramObj.keyword = keyword.value;
    }
    try {
      if (typeof props.loader === "function") {
        return await props.loader(paramObj);
      }
      // url 模式
      const qs = new URLSearchParams();
      for (const [k, v] of Object.entries(paramObj)) {
        if (v === undefined || v === null || v === "") continue;
        qs.set(k, String(v));
      }
      const sep = props.url.includes("?") ? "&" : "?";
      const fullUrl = `${props.url}${qs.toString() ? sep + qs.toString() : ""}`;
      const res = await getApiHttp()
        .get(fullUrl)
        .then((r) => r.data as ReOption[] | { data: ReOption[]; records?: ReOption[]; rows?: ReOption[]; list?: ReOption[]; items?: ReOption[] });
      const body = res;
      if (Array.isArray(body)) return body;
      if (body && typeof body === "object") {
        const obj = body as Record<string, unknown>;
        for (const key of ["records", "rows", "list", "items", "content", "data"]) {
          if (Array.isArray(obj[key])) return obj[key] as ReOption[];
        }
      }
      return [];
    } catch (e) {
      console.error("[ReSelect] 数据加载失败", e);
      return [];
    }
  };
  return run;
}

/** useDataSource 接受的 source */
const sourceRef = computed<ReDataSource<ReOption[]>>(() => {
  if (isRemote.value) return buildRemoteSource();
  return staticData.value;
});

const { loading: dataLoading, data: dataList, reload: dsReload } = useDataSource<ReOption[]>(sourceRef);

// 自动重新加载：当 params 或 keyword 变化时（防抖 300ms，替代原 fetch 版 GET 防抖）
const debouncedReload = debounce(() => {
  if (isRemote.value) dsReload();
}, 300);

if (props.autoReload) {
  watch([remoteParams], () => {
    debouncedReload();
  }, { deep: true });
}

/** 当前选中项的标签拼接（用于回显） */
const selectedLabels = computed<string>(() => {
  const list = dataList.value ?? [];
  const v = model.value;
  if (v === null || v === undefined || v === "") return "";
  const values = Array.isArray(v) ? v : [v];
  return list
    .filter((o) => values.includes(o.value as string | number))
    .map((o) => o.label)
    .join(", ");
});

/** 是否为富文本布局（table） */
const isRichLayout = computed<boolean>(() => props.layout === "table");

/** 多选切换 */
function onToggleSelect(option: ReOption): void {
  if (props.disabled || option.disabled) return;
  const v = option.value;
  if (!props.multiple) {
    model.value = v as string | number;
    return;
  }
  const cur = Array.isArray(model.value) ? [...(model.value as Array<string | number>)] : [];
  const idx = cur.indexOf(v as string | number);
  if (idx >= 0) {
    cur.splice(idx, 1);
  } else {
    cur.push(v as string | number);
  }
  model.value = cur;
}

/** 是否已选中 */
function isChecked(option: ReOption): boolean {
  const v = option.value;
  if (Array.isArray(model.value)) return model.value.includes(v as string | number);
  return model.value === v;
}

/** 全选（多选模式） */
function selectAll(): void {
  if (props.disabled || !props.multiple) return;
  const all = (dataList.value ?? []).filter((o) => !o.disabled).map((o) => o.value);
  model.value = all;
}

/** 反选（多选模式） */
function invertSelection(): void {
  if (props.disabled || !props.multiple) return;
  const cur = Array.isArray(model.value) ? [...model.value] : [];
  const curSet = new Set(cur);
  const result: (string | number)[] = [];
  for (const opt of dataList.value ?? []) {
    if (opt.disabled) {
      if (curSet.has(opt.value)) result.push(opt.value);
    } else {
      if (!curSet.has(opt.value)) result.push(opt.value);
    }
  }
  model.value = result;
}

// 处理搜索输入
function onInput(value: string): void {
  keyword.value = value;
}

defineExpose({
  reload: dsReload,
  get loading(): boolean {
    return dataLoading.value;
  },
  get data(): ReOption[] | null {
    return dataList.value;
  },
});
</script>

<template>
  <!-- Modern 布局（异步加载，独立实现不依赖 el-select） -->
  <ModernLayout
    v-if="layout === 'modern'"
    :model-value="model"
    @update:model-value="(v: any) => model = v"
    :options="(dataList ?? []) as any"
    :placeholder="placeholder"
    :clearable="clearable"
    :filterable="filterable"
    :multiple="multiple"
    :disabled="disabled"
    :loading="loading || dataLoading"
    :size="size"
    v-bind="$attrs"
  />

  <!-- Pill 布局（药丸式，直接展示所有选项，异步加载） -->
  <PillLayout
    v-else-if="layout === 'pill'"
    :model-value="model"
    @update:model-value="(v: any) => model = v"
    :options="(dataList ?? []) as any"
    :multiple="multiple"
    :disabled="disabled"
    v-bind="$attrs"
  />

  <!-- 卡片下拉布局（card 与 card-dropdown 合并，异步加载） -->
  <CardDropdownLayout
    v-else-if="layout === 'card' || layout === 'card-dropdown'"
    :model-value="model"
    @update:model-value="(v: any) => model = v"
    :options="(dataList ?? []) as any"
    :multiple="multiple"
    :disabled="disabled"
    :loading="loading || dataLoading"
    :filterable="filterable"
    :placeholder="placeholder"
    :title="title"
    :trigger-icon="triggerIcon"
    :popover-width="popoverWidth"
    v-bind="$attrs"
  />

  <!-- Square 正方形图标布局（异步加载） -->
  <SquareLayout
    v-else-if="layout === 'square'"
    :model-value="(model ?? '') as string | number | (string | number)[]"
    @update:model-value="(v: any) => model = v"
    :options="(dataList ?? []) as any"
    :multiple="multiple"
    :disabled="disabled"
    v-bind="$attrs"
  />

  <!-- 默认 / card / table 布局 -->
  <ElSelect
    v-else
    v-model="model"
    v-bind="$attrs"
    :placeholder="placeholder"
    :clearable="clearable"
    :filterable="filterable"
    :multiple="multiple"
    :collapse-tags="collapseTags"
    :disabled="disabled"
    :loading="loading || dataLoading"
    :size="size"
    :filter-method="onInput"
    :popper-class="isRichLayout ? 're-select__popper--rich' : ''"
    :teleported="true"
    class="re-select"
    :class="`re-select--${layout}`"
  >
    <!-- 自定义选中态回显 -->
    <template #label="{ value: v }">
      <slot name="selected" :value="v" :labels="selectedLabels">
        <span v-if="Array.isArray(v)">{{ v.length ? selectedLabels : placeholder }}</span>
        <span v-else>{{ v !== '' && v != null ? selectedLabels : placeholder }}</span>
      </slot>
    </template>

    <!-- default 布局：标准 el-option -->
    <template v-if="layout === 'default'">
      <ElOption
        v-for="opt in dataList ?? []"
        :key="String(opt.value)"
        :label="opt.label"
        :value="opt.value"
        :disabled="opt.disabled"
      />
    </template>

    <!-- table 布局 -->
    <template v-else-if="layout === 'table'">
      <div v-if="multiple" class="re-select__bulk-actions">
        <span class="re-select__bulk-btn" @click.stop="selectAll">全选</span>
        <span class="re-select__bulk-btn" @click.stop="invertSelection">反选</span>
      </div>
      <div class="re-select__table-head">
        <span
          v-for="col in tableColumns"
          :key="col.key"
          :style="{ flex: col.width ? `0 0 ${typeof col.width === 'number' ? col.width + 'px' : col.width}` : '1' }"
        >{{ col.label }}</span>
        <span v-if="multiple" class="re-select__table-check">{{ '已选' }}</span>
      </div>
      <ElOption
        v-for="opt in dataList ?? []"
        :key="String(opt.value)"
        :label="opt.label"
        :value="opt.value"
        :disabled="opt.disabled"
        class="re-select__option-table"
      >
        <div
          class="re-select__table-row"
          :class="{ 're-select__table-row--checked': isChecked(opt) }"
          @click.stop="onToggleSelect(opt)"
        >
          <span
            v-for="col in tableColumns"
            :key="col.key"
            :style="{ flex: col.width ? `0 0 ${typeof col.width === 'number' ? col.width + 'px' : col.width}` : '1' }"
          >{{ opt[col.key] ?? '-' }}</span>
          <span v-if="multiple" class="re-select__table-check" @click.stop="onToggleSelect(opt)">
            <ElCheckbox :model-value="isChecked(opt)" />
          </span>
        </div>
      </ElOption>
    </template>
  </ElSelect>
</template>

<style scoped>
.re-select :deep(.el-select__wrapper) {
  min-height: 32px;
}

/* table 模式 */
.re-select__table-head {
  display: flex;
  padding: 6px 12px;
  background: var(--el-fill-color-light);
  font-size: 12px;
  color: var(--el-text-color-secondary);
  font-weight: 600;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.re-select__table-row {
  display: flex;
  padding: 6px 12px;
  cursor: pointer;
  transition: background 0.15s;
}
.re-select__table-row:hover {
  background: var(--el-fill-color-light);
}
.re-select__table-row--checked {
  background: var(--el-color-primary-light-9);
}
.re-select__table-check {
  flex: 0 0 60px;
  text-align: right;
}

/* 批量操作栏 */
.re-select__bulk-actions {
  display: flex;
  gap: 12px;
  padding: 6px 12px;
  border-bottom: 1px solid var(--el-border-color-lighter, #e4e7ed);
}
.re-select__bulk-btn {
  font-size: 12px;
  color: var(--el-color-primary, #409eff);
  cursor: pointer;
  transition: opacity 0.15s;
  user-select: none;
}
.re-select__bulk-btn:hover {
  opacity: 0.7;
}
</style>

<style>
/* popper 内的 option 默认样式重置 */
.re-select__popper--rich .el-select-dropdown__item {
  padding: 0 !important;
  height: auto !important;
  background: transparent !important;
}
.re-select__popper--rich .el-select-dropdown__item:hover {
  background: transparent !important;
}
.re-select__popper--rich .el-select-dropdown__item.selected {
  font-weight: normal;
  color: inherit;
}
</style>
