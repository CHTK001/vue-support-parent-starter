<script setup lang="ts">
/**
 * ReSelect —— 下拉选择组件
 *
 * 多种布局模式：
 *   - "default"：原生 el-select 文本选项
 *   - "card"：卡片式下拉弹窗（支持标签/高阶标记/消耗说明/分组，popover 自动上下适配）
 *   - "card-dropdown"：已合并至 "card"（历史别名，行为相同）
 *   - "table"：表格形式（多列），适合用户列表等场景
 *   - "square"：正方形图标选择器，支持纯图标（默认）/ 图标+文字，直接展示所有选项；传 vertical 改为竖向档位菜单（一行一档）
 *
 * 尺寸：type="small | default | large" 对五种布局统一生效（size 为旧名，兼容保留）。
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
import { computed, defineAsyncComponent, ref, useAttrs, watch } from "vue";
import { ElSelect, ElOption, ElCheckbox } from "element-plus";
import { getApiHttp, useDataSource, type ReDataSource } from "@repo/core";
import type { ReOption, ReSelectLayout, ReSelectSize } from "./types";
import { debounce } from "@repo/utils";
import "../shared/modern-vars.css";

/** 卡片下拉布局组件（按需异步加载） */
const CardDropdownLayout = defineAsyncComponent(() => import("./layouts/CardDropdown.vue"));
/** Square 布局组件（按需异步加载） */
const SquareLayout = defineAsyncComponent(() => import("./layouts/Square.vue"));
/** Modern 扁平布局组件（按需异步加载） */
const ModernLayout = defineAsyncComponent(() => import("./layouts/Modern.vue"));

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
    /** 布局模式：default / card / table / square */
    layout?: ReSelectLayout;
    /** placeholder */
    placeholder?: string;
    /** 是否可清空 */
    clearable?: boolean;
    /** 是否可搜索 */
    filterable?: boolean;
    /**
     * 允许把「输入框里敲的、选项里没有的文本」直接当作一个新选项选中。
     *
     * <p>用于「选项是白名单但用户可能要填白名单外的值」的场景：典型是 JDBC 额外
     * 连接参数 —— 下拉列的是各驱动常用参数名，但任何驱动都能带自己独有的参数，
     * 白名单永远列不全，所以必须留这个口子。</p>
     *
     * <p>只对 default 布局（ElSelect）生效，且需要同时开 {@link filterable}：
     * Element Plus 的 {@code allow-create} 依赖 filterable 提供的输入过滤行为，
     * 单独开它不会出现「创建新选项」行。</p>
     */
    allowCreate?: boolean;
    /** 多选 */
    multiple?: boolean;
    /** 多选折叠 tag */
    collapseTags?: boolean;
    /** 禁用 */
    disabled?: boolean;
    /** loading（外部控制） */
    loading?: boolean;
    /**
     * 控件尺寸：small / default / large，对五种布局统一生效。
     *
     * 与 size 是同一个语义，size 保留为兼容别名（历史调用点大量在用），
     * 两者都传时以 type 为准。
     */
    type?: ReSelectSize;
    /** @deprecated 尺寸的旧名，请改用 type；与 type 同时传时以 type 为准 */
    size?: ReSelectSize;
    /** 卡片 / 表格模式 popover 宽度 */
    popoverWidth?: number;
    /** 表格模式：表格列配置 { key, label, width? } */
    tableColumns?: Array<{ key: string; label: string; width?: string | number }>;
    /** 是否自动重新加载（当 params 变化时） */
    autoReload?: boolean;
    /** 卡片下拉模式：弹窗顶部分类标题 */
    title?: string;
    /** 卡片下拉模式：是否显示触发栏图标 */
    triggerIcon?: boolean;
    /** square 布局：仅显示图标（默认 true），false 时图标+文字 */
    iconOnly?: boolean;
    /** square 布局：竖向档位列表（一行一档，整行高亮 + 右侧对勾），用于浮层里选间隔等场景 */
    vertical?: boolean;
    /** 紧凑模式：square/card 布局下拉框宽度自适应文字，默认 false */
    compact?: boolean;
    /** 卡片多选时：是否显示全选 / 反选（默认 false） */
    bulkActions?: boolean;
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
    allowCreate: false,
    multiple: false,
    collapseTags: false,
    disabled: false,
    loading: false,
    type: undefined,
    size: undefined,
    popoverWidth: 280,
    tableColumns: () => [],
    autoReload: true,
    title: "",
    triggerIcon: true,
    iconOnly: true,
    vertical: false,
    compact: undefined,
    bulkActions: false,
  },
);

/** 是否为远程模式（url / loader） */
const isRemote = computed<boolean>(() => Boolean(props.url) || typeof props.loader === "function");

/**
 * 最终生效的尺寸档位：type 优先，size 作为兼容别名兜底。
 *
 * 抽成 computed 而不是各处写 props.type ?? props.size，是因为五种布局都要用，
 * 而 size 会被 v-bind="$attrs" / modernProps 透传到子布局，各处重复兜底容易漏。
 */
const controlSize = computed<ReSelectSize>(() => props.type ?? props.size ?? "default");

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

/** 根据单个选中值查找对应 label（multiple 模式下每个 tag 只显示自己的 label） */
function labelFor(value: unknown): string {
  const list = dataList.value ?? [];
  const hit = list.find((o) => o.value === value);
  if (hit) return hit.label;
  // 远程/选项未加载完成时，兜底从当前模型值回显
  const v = model.value;
  const values = Array.isArray(v) ? v : [v];
  return values.includes(value as string | number) ? String(value) : "";
}

/** 是否为富文本布局（table） */
const isRichLayout = computed<boolean>(() => props.layout === "table");

/** 紧凑模式：square 布局默认开启，card/table/default 默认关闭（显式开关） */
const isCompact = computed<boolean>(() => props.compact ?? props.layout === "square");

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

/** 透传给 Modern 布局的 props（排除 layout，避免循环分发） */
const modernProps = computed(() => {
  const { layout: _, ...rest } = props;
  return rest;
});
const attrs = useAttrs();
const modernBind = computed(() => ({ ...modernProps.value, ...attrs }));

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
  <!-- Modern 扁平布局（异步加载）。type/size 已含在 modernBind 里，随 $attrs 透传给内层 default 布局 -->
  <ModernLayout
    v-if="layout === 'modern'"
    v-model="model"
    v-bind="modernBind"
  />

  <!-- 卡片下拉布局（card 与 card-dropdown 合并，异步加载；点击触发栏才显示弹窗） -->
  <CardDropdownLayout
    v-if="layout === 'card' || layout === 'card-dropdown'"
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
    :compact="isCompact"
    :bulk-actions="bulkActions"
    :control-size="controlSize"
    v-bind="$attrs"
  >
    <template v-if="$slots.option" #option="slotProps">
      <slot name="option" v-bind="slotProps" />
    </template>
  </CardDropdownLayout>

  <!-- Square 正方形图标布局（异步加载）。图标尺寸走 :icon-size，避免与控件尺寸 type 同名串味 -->
  <SquareLayout
    v-else-if="layout === 'square'"
    :model-value="(model ?? '') as string | number | (string | number)[]"
    @update:model-value="(v: any) => model = v"
    :options="(dataList ?? []) as any"
    :multiple="multiple"
    :disabled="disabled"
    :icon-only="iconOnly"
    :vertical="vertical"
    :compact="isCompact"
    :control-size="controlSize"
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
    :allow-create="allowCreate"
    :default-first-option="allowCreate"
    :multiple="multiple"
    :collapse-tags="collapseTags"
    :disabled="disabled"
    :loading="loading || dataLoading"
    :size="controlSize"
    :filter-method="onInput"
    :popper-class="isRichLayout ? 're-select__popper--rich' : ''"
    :teleported="true"
    class="re-select"
    :class="[`re-select--${layout}`, `re-select--${controlSize}`, { 're-select--compact': isCompact }]"
  >
    <!-- 自定义选中态回显：仅当使用者显式提供 #selected 插槽时才覆盖 el-select 原生 label 渲染；
         否则交给 el-select 根据已注册的 el-option 原生回显 label（默认插槽/数据源选项均能正确解析）。
         multiple 模式走 el-select 默认 tag 渲染。 -->
    <template v-if="!multiple && $slots.selected" #label="slotProps">
      <slot name="selected" :value="slotProps.value" :labels="selectedLabels">
        <span>{{ slotProps.value !== '' && slotProps.value != null ? (slotProps.label ?? labelFor(slotProps.value)) : placeholder }}</span>
      </slot>
    </template>

    <!-- default 布局：透传使用方子选项（el-option 等）+ 数据源选项 -->
    <template v-if="layout === 'default'">
      <slot />
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
/* ==================== 默认布局：现代化扁平（el-select 视觉重塑） ==================== */
.re-select {
  display: block;
}
/* 这里只放视觉（底色 / 描边 / 阴影 / 过渡），**不写 min-height 与 padding**。
   尺寸统一在下方「尺寸分档」按 .re-select--{尺寸} 三档写：
   - EP 的 .el-select--small / .el-select--large 只有 0,2,0 特异性，而本文件编译后
     带 [data-v-*]（0,3,0），直接压不过基础规则里的 min-height，size 会静默失效；
   - el-select--small 与 .re-select 挂在**同一元素**上，纯后代选择器（.re-select .el-select--small）
     永远匹配不到，必须写成同元素复合类。
   共享样式 shared/re-inputs.css 只在页面显式 import 时才加载，未引入的应用
   （如采集调度）拿不到，所以组件自身必须自成一套。 */
.re-select :deep(.el-select__wrapper) {
  background: color-mix(in srgb, var(--rm-bg) 92%, transparent);
  border: 1px solid var(--rm-border);
  border-radius: var(--rm-radius);
  box-shadow:
    inset 0 1px 0 color-mix(in srgb, var(--rm-bg) 60%, transparent),
    0 1px 2px rgba(15, 23, 42, 0.04) !important;
  transition:
    border-color var(--rm-transition),
    box-shadow var(--rm-transition-slow),
    background var(--rm-transition);
}
.re-select :deep(.el-select__wrapper:hover) {
  border-color: color-mix(in srgb, var(--rm-primary) 30%, var(--rm-border));
  box-shadow:
    inset 0 1px 0 color-mix(in srgb, var(--rm-bg) 60%, transparent),
    0 2px 8px color-mix(in srgb, var(--rm-primary) 10%, transparent) !important;
}
.re-select :deep(.el-select__wrapper.is-focused) {
  border-color: var(--rm-primary);
  box-shadow:
    inset 0 1px 0 color-mix(in srgb, var(--rm-bg) 60%, transparent),
    0 0 0 4px color-mix(in srgb, var(--rm-primary) 12%, transparent),
    0 4px 14px color-mix(in srgb, var(--rm-primary) 18%, transparent) !important;
}
.re-select :deep(.el-select__placeholder) {
  color: var(--rm-text-disabled);
  font-weight: 400;
}
.re-select :deep(.el-select__selected-item) {
  font-weight: 500;
  color: var(--rm-text);
}
.re-select :deep(.el-select__suffix) {
  color: var(--rm-text-secondary);
}

/* Popper dropdown 扁平卡片 */
.re-select :deep(.el-select-dropdown) {
  border: 1px solid var(--rm-border);
  border-radius: var(--rm-radius);
  box-shadow:
    0 2px 8px rgba(15, 23, 42, 0.06);
  overflow: hidden;
}
.re-select :deep(.el-select-dropdown__item) {
  border-radius: var(--rm-radius-sm);
  margin: 2px 6px;
  padding: 0 10px;
  min-height: 32px;
  font-size: var(--rm-font-md);
  font-weight: 500;
  color: var(--rm-text);
  transition: background var(--rm-transition), color var(--rm-transition);
}
.re-select :deep(.el-select-dropdown__item:hover) {
  background: var(--rm-bg-hover);
  color: var(--rm-primary);
}
.re-select :deep(.el-select-dropdown__item.is-hovering:not(.is-disabled)) {
  background: var(--rm-bg-hover);
  color: var(--rm-primary);
}
.re-select :deep(.el-select-dropdown__item.selected) {
  color: var(--rm-primary);
  font-weight: 600;
  background: var(--rm-primary-light-9);
}
.re-select :deep(.el-select-dropdown__item.is-disabled) {
  color: var(--rm-text-disabled);
  cursor: not-allowed;
}

/* 紧凑模式：下拉框宽度自适应选中文字，不撑满容器 */
.re-select--compact {
  display: inline-flex;
  width: auto;
  max-width: 100%;
  vertical-align: middle;
}
.re-select--compact :deep(.el-select__wrapper) {
  width: auto;
  flex: 0 0 auto;
}

/* 尺寸三档：default / small / large。
 *
 * 与根节点上的 re-select--{尺寸} 同元素复合，特异性 0,4,0，稳定压过上面的基础规则
 * 与 Element Plus 自带的尺寸规则；数值走 --rm-height* 令牌，default 保持历史值 34px
 * （modern-vars 里 --rm-height 是 36px，是其它组件的口径，直接换会让默认高度跳变）。
 * card / square 布局的触发栏由各自布局文件按 controlSize 处理，不受这里影响。 */
.re-select.re-select--default :deep(.el-select__wrapper) {
  min-height: 34px;
  padding: 4px 12px;
}
.re-select.re-select--small :deep(.el-select__wrapper) {
  min-height: var(--rm-height-sm);
  padding: 2px 10px;
  font-size: var(--rm-font-sm);
}
.re-select.re-select--large :deep(.el-select__wrapper) {
  min-height: var(--rm-height-lg);
  padding: 6px 14px;
  font-size: var(--rm-font-lg);
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

/* 减少动画兜底 */
@media (prefers-reduced-motion: reduce) {
  .re-select :deep(.el-select__wrapper),
  .re-select :deep(.el-select-dropdown__item) {
    transition: none;
  }
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
