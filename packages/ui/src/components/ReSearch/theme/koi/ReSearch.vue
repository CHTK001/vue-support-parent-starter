<script setup lang="ts">
/**
 * ReSearch koi 主题 —— 横向搜索条（按截图重排版）
 *
 *   ┌────────────────────────────────────────────────────────────┐
 *   │ [🔍 搜索]                          展开 ∨                   │   ← topbar
 *   ├────────────────────────────────────────────────────────────┤
 *   │ 登录账号 [____]   用户名称 [____]   手机号 [____]   [搜索][重置] │   ← body
 *   └────────────────────────────────────────────────────────────┘
 *
 * 设计要点：
 *   - 顶部条：徽标（搜索图标 + 标题）在左，字段超宽时的「展开/收起」在右上
 *   - 内容行：字段左对齐（label 叠在 input 上方）、搜索/重置右对齐
 *   - 右上折叠按钮：仅当 hasOverflow（max>0 && item>max）时显示，
 *     控制 localExpanded（点击显示被 max 隐藏的多余字段）
 *   - 工具栏不渲染 新增/刷新/隐藏过滤区 三个按钮（已从组件移除）
 */
import { ref, watch, computed, useSlots, defineAsyncComponent, onMounted, onBeforeUnmount, type CSSProperties, nextTick } from "vue";
import { ElInput, ElSelect, ElOption, ElDatePicker, ElTreeSelect } from "element-plus";
import ReButton from "../../../ReButton/ReButton.vue";
import ReSelect from "../../../ReSelect/ReSelect.vue";
import type { ReSelectLoader } from "../../../ReSelect/types";
import ReSearchToolbar from "../../ReSearchToolbar.vue";
import "../../shared/research-vars.css";

const ModernLayout = defineAsyncComponent(() => import("../../layouts/Modern.vue"));

defineOptions({ name: "ReSearch", inheritAttrs: true });

const slots = useSlots();
const hasDefaultSlot = computed(() => slots.default && slots.default().length > 0);

/** 过滤项配置类型 */
export interface SearchFilter {
  /** 字段 key（v-model 绑定键名） */
  key: string;
  /** 标签文案（form 模式下显示） */
  label?: string;
  /** 组件类型：input / select / square（ReSelect 按钮式，全部选项直接铺开） / date / daterange / treeselect（默认 input） */
  type?: "input" | "select" | "square" | "date" | "daterange" | "treeselect";
  /** 占位文案 */
  placeholder?: string;
  /** select / treeselect 选项数据 */
  options?: Array<{ label: string; value: string | number; children?: any[] }>;
  /**
   * 远端数据源（与 options 二选一）：url 字符串或加载函数。
   *
   * <p>提供后 select 改走 ReSelect 远端加载（同 ReTable / ReSelect 约定）：
   * 字符串视为 {@link url}，函数视为 {@link loader}。也可分别用 url / loader 显式声明。</p>
   */
  dataSource?: string | ReSelectLoader;
  /** 远端 url（与 options/dataSource 二选一） */
  url?: string;
  /** 远端加载函数（与 options/dataSource 二选一，等价于 url） */
  loader?: ReSelectLoader;
  /** 其他透传给子组件的属性 */
  attrs?: Record<string, unknown>;
  /**
   * 是否修剪该过滤项的输入值（默认 true）。
   *
   * <p>只修剪字符串值。关闭时原样写入搜索参数（适合需要保留空格的查询条件，如 IP / 路径）。</p>
   */
  trim?: boolean;
}

const props = withDefaults(
  defineProps<{
    isExpanded?: boolean;
    showSearch?: boolean;
    layout?: "default" | "modern";
    mode?: 1 | 2;
    /** 过滤模式：form=标签+组件，data=仅组件 */
    filterMode?: "form" | "data";
    bordered?: boolean;
    showLabel?: boolean;
    tooltipText?: string;
    padding?: string;
    /** 顶部徽标文案（默认"搜索"） */
    title?: string;
    /** 过滤区当前是否可见（v-model 双向绑定） */
    filterVisible?: boolean;
    /** 工具栏按钮模式：icon=图标+tooltip，text=图标+文字 */
    btnMode?: "icon" | "text";
    /** ReSearchToolbar：搜索按钮 */
    showSearchBtn?: boolean;
    searchText?: string;
    /** ReSearchToolbar：重置按钮 */
    showResetBtn?: boolean;
    resetText?: string;
    /** ReSearchToolbar：批量删除按钮 */
    showBatchDeleteBtn?: boolean;
    batchDeleteText?: string;
    batchDeleteDisabled?: boolean;
    /** ReSearchToolbar：批量勾选按钮 */
    showBatchSelectBtn?: boolean;
    batchSelectText?: string;
    batchSelectActive?: boolean;
    batchSelectTextActive?: string;
    /** 搜索按钮 loading */
    loading?: boolean;
    /** 默认展开的最大表项数（0=不限，配合右上角"展开/收起"按钮使用） */
    max?: number;
    /** 过滤项配置（prop 驱动模式，与 default slot 二选一） */
    filters?: SearchFilter[];
    /** 过滤值对象（v-model 双向绑定，与 filters 配合使用） */
    modelValue?: Record<string, unknown>;
  }>(),
  {
    isExpanded: false,
    showSearch: true,
    layout: "default",
    mode: 2,
    filterMode: "form",
    bordered: false,
    showLabel: false,
    tooltipText: "搜索",
    padding: "12px 16px",
    title: "搜索",
    filterVisible: true,
    btnMode: "icon",
    showSearchBtn: true,
    searchText: "搜索",
    showResetBtn: true,
    resetText: "重置",
    showBatchDeleteBtn: false,
    batchDeleteText: "批量删除",
    batchDeleteDisabled: false,
    showBatchSelectBtn: false,
    batchSelectText: "批量勾选",
    batchSelectActive: false,
    batchSelectTextActive: "取消勾选",
    loading: false,
    max: 0,
    filters: () => [],
    modelValue: () => ({}),
  },
);

const emit = defineEmits<{
  (e: "update:filterVisible", visible: boolean): void;
  (e: "search"): void;
  (e: "reset"): void;
  (e: "batch-delete"): void;
  (e: "batch-select"): void;
  (e: "update:modelValue", value: Record<string, unknown>): void;
}>();

/** 内部过滤值（支持 v-model 双向绑定，未受控时内部维护） */
const filterValues = ref<Record<string, any>>({ ...props.modelValue });

/**
 * 上一次的过滤值快照。
 *
 * <p>用来识别「值由非空变空」这一次**清除动作**（点输入框的 X、清空下拉）。
 * 没有它就分不清「用户把条件清掉了」和「用户一直在输入」，也就无法在清空时
 * 立即重查 —— 表现为「输入框清干净了，表格却还停在旧条件上」。</p>
 */
let lastSeen: Record<string, any> = { ...filterValues.value };

/** 空值判定：undefined / null / 空串 / 空数组都算「没有这个筛选条件」 */
const isBlank = (v: unknown): boolean =>
  v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0);

watch(
  () => props.modelValue,
  (v) => { filterValues.value = { ...v }; lastSeen = { ...v }; },
  { deep: true },
);
function onFilterInput(key: string, val: unknown): void {
  const prev = lastSeen[key];
  const filter = props.filters?.find((f) => f.key === key);
  // trim：只改 string 值（日期 / 数字 / 数组不走 trim），默认开启，
  // 字段级 trim: false 可以关（IP 段、带空格的查询条件不允许丢字符）。
  if (typeof val === "string" && (filter?.trim ?? true)) {
    val = val.trim();
  }
  filterValues.value[key] = val;
  lastSeen = { ...lastSeen, [key]: val };
  // 必须先把新值推给父级，再 emit search —— 父级的搜索处理读的就是这份新值，
  // 顺序反了就会拿旧条件查一遍（用户看到「清空了却没恢复」）。
  emit("update:modelValue", { ...filterValues.value });
  if (isBlank(val) && !isBlank(prev)) {
    emit("search");
  }
}

/** 是否有过滤内容（filters prop 或 default slot） */
const hasFilterContent = computed(() => hasDefaultSlot.value || (props.filters && props.filters.length > 0));

/** 过滤区可见状态（支持 v-model:filterVisible，未受控时内部维护） */
const localFilterVisible = ref(props.filterVisible);
watch(
  () => props.filterVisible,
  (v) => { localFilterVisible.value = v; },
);

/** 右上角"展开/收起"折叠（仅作用于被 max 隐藏的多余字段） */
const localExpanded = ref(false);
const itemSlots = computed(() => slots.default?.() ?? []);
/** 项数：优先取 filters prop 的长度，否则数 default slot 的子节点 */
const itemCount = computed(() => {
  const filterCount = props.filters?.length ?? 0;
  return filterCount > 0 ? filterCount : itemSlots.value.length;
});
/** 是否有字段被收纳（max 超限 或 容器宽度不足以一行放下全部字段） */
const hasOverflow = computed(
  () => (props.max > 0 && itemCount.value > props.max) || (fitCount.value > 0 && itemCount.value > fitCount.value),
);
/** 折叠态显示的字段数：受 max 与容器实际可容纳数（fitCount）双重限制 */
const collapsedLimit = computed(() => {
  if (!hasOverflow.value) return itemCount.value;
  const byMax = props.max > 0 ? props.max : itemCount.value;
  const byFit = fitCount.value > 0 ? fitCount.value : byMax;
  return Math.max(1, Math.min(byMax, byFit));
});
/** 折叠态下第 index 个字段是否被隐藏（测量期间全部可见） */
function isFieldHidden(index: number): boolean {
  if (measuring.value || !hasOverflow.value || localExpanded.value) return false;
  return index >= collapsedLimit.value;
}
function toggleExpand(): void {
  localExpanded.value = !localExpanded.value;
  // 展开/收起会改变字段区高度（可能连带影响滚动条与可用宽度），
  // 强制按当前宽度重测一次，保证「收起后只留首行」始终按现状成立
  lastWidth = -1;
  nextTick(() => measureFit());
}

const contentEl = ref<HTMLElement | null>(null);

/** ========== 响应式收纳：测量首行可容纳的字段数 ========== */
/** 测量看门狗超时（ms）：超时强制复位 measuring，避免字段被永久隐藏 */
const MEASURE_WATCHDOG_MS = 300;
const fitCount = ref(0);
const measuring = ref(false);
let resizeObserver: ResizeObserver | null = null;
let measureWatchdog: ReturnType<typeof setTimeout> | undefined;
let lastWidth = -1;

function measureFit(): void {
  const el = contentEl.value;
  if (!el || !localFilterVisible.value || measuring.value) return;
  const w = el.clientWidth;
  // 只在宽度变化时重测：显隐切换引起的高度变化会再次触发 RO，若不忽略会造成测量死循环
  // fitCount 仍为 0 时不能跳过：否则首次测量失败会把「从未测量」状态锁死
  if (w === lastWidth && fitCount.value > 0) return;
  // 先置 measuring=true：isFieldHidden 会让整行字段全部参与布局，
  // 且该状态引发的重渲染（含 slot 模式的 applySlotCollapse）会排在下面
  // nextTick 回调之前，所以测量时拿到的一定是「全部字段都排开」的真实布局
  measuring.value = true;
  // 看门狗兜底（防御性冗余）：nextTick 是微任务不会丢，finally 也已保证复位，
  // 这里再兜一层——万一后续改动引入异常，也不会让展开/收纳永久失效。
  if (measureWatchdog) clearTimeout(measureWatchdog);
  measureWatchdog = setTimeout(() => {
    measureWatchdog = undefined;
    measuring.value = false;
  }, MEASURE_WATCHDOG_MS);
  // 用 nextTick 而非 requestAnimationFrame：rAF 在隐藏/后台文档（后台标签页、
  // 不可见 iframe、keep-alive 缓存页）中不会触发，测量会被推迟甚至丢弃。
  // nextTick 是微任务不会丢帧，且同样在浏览器绘制前完成测量，不会闪一下全部字段。
  // 复位放在 finally：测量中途抛异常也必须复位 measuring，否则 measureFit
  // 入口会永久早退，展开/收纳彻底失效。
  void nextTick(() => {
    try {
      const items = Array.from(el.children) as HTMLElement[];
      // 空容器（filters 尚未加载、slot 子节点被 v-if 隐藏）：items[0] 不存在，
      // 直接读 offsetTop 会抛异常并中断本次测量，所以必须提前返回
      if (items.length === 0) {
        fitCount.value = 0;
        return;
      }
      const top0 = items[0].offsetTop;
      let count = 0;
      for (const it of items) {
        if (it.offsetParent !== null && it.offsetTop <= top0 + 1) count += 1;
        else break;
      }
      fitCount.value = count;
      lastWidth = w;
    } finally {
      if (measureWatchdog) {
        clearTimeout(measureWatchdog);
        measureWatchdog = undefined;
      }
      measuring.value = false;
    }
  });
}

/** slot 模式：无法用 class 绑定，直接操作子节点显隐 */
function applySlotCollapse(): void {
  if (props.filters && props.filters.length > 0) return;
  const el = contentEl.value;
  if (!el) return;
  Array.from(el.children).forEach((child, i) => {
    const hidden = isFieldHidden(i);
    (child as HTMLElement).style.display = hidden ? "none" : "";
  });
}
watch([collapsedLimit, hasOverflow, localExpanded, measuring, itemCount], applySlotCollapse, { flush: "post" });
watch([itemCount, () => props.max], () => {
  // 字段数量变化时即使宽度未变也需强制重测
  lastWidth = -1;
  nextTick(() => measureFit());
});
watch(localFilterVisible, () => {
  nextTick(() => measureFit());
});
onMounted(() => {
  if (typeof ResizeObserver === "undefined") return;
  resizeObserver = new ResizeObserver(() => measureFit());
  if (contentEl.value) resizeObserver.observe(contentEl.value);
  nextTick(() => measureFit());
});
onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  resizeObserver = null;
  if (measureWatchdog) {
    clearTimeout(measureWatchdog);
    measureWatchdog = undefined;
  }
  measuring.value = false;
});
function resetForm(): void {
  // 清空 filters prop 驱动的值
  if (props.filters && props.filters.length > 0) {
    const cleared: Record<string, unknown> = {};
    props.filters.forEach((f) => { cleared[f.key] = undefined as unknown; });
    filterValues.value = cleared;
    lastSeen = { ...cleared };
    emit("update:modelValue", { ...cleared });
  }
  // 清空 slot 中的 el-form
  nextTick(() => {
    const el = contentEl.value?.querySelector(".el-form");
    if (!el) return;
    const comp = (el as any).__vueParentComponent;
    comp?.exposed?.resetFields?.();
  });
  emit("reset");
}

const containerStyle = computed<CSSProperties>(() => ({ padding: props.padding }));

/**
 * 过滤项控件的可访问名称。
 *
 * <p>为什么需要：过滤项的标签是**兄弟节点** {@code <span class="koi-search__field-label">}，
 * 既没有 {@code <label for>}，控件上也没有 {@code aria-label} /
 * {@code aria-labelledby}。视觉上看得见标签，读屏却读不到 ——
 * 浏览器实测这些 input 的 {@code missingAccessibleName} 全是 {@code true}，
 * 读屏用户只能听出「编辑框」，不知道该填什么。</p>
 *
 * <p>取 filter.label，取不到就退回 placeholder，保证任何配置下都有名字。
 * Element Plus 的 {@code ElInput} 等把 {@code aria-label} 声明成了正式 prop
 * （{@code useAriaProps} 的 {@code ariaLabel}），会落到内层真正的 input 上，
 * 而不是只停在包裹 div 上。</p>
 */
function ariaOf(filter: { label?: string; placeholder?: string }): string | undefined {
  return filter.label || filter.placeholder || undefined;
}

/** 过滤项是否声明了远端数据源（dataSource / url / loader） */
function isRemoteSelectFilter(filter: SearchFilter): boolean {
  return Boolean(filter.url) || typeof filter.loader === "function"
    || typeof filter.dataSource === "string" || typeof filter.dataSource === "function";
}

/** 过滤项生效的远端 url：显式 url 优先，dataSource 为字符串时兜底 */
function filterUrl(filter: SearchFilter): string {
  return filter.url || (typeof filter.dataSource === "string" ? filter.dataSource : "");
}

/** 过滤项生效的远端加载器：显式 loader 优先，dataSource 为函数时兜底 */
function filterLoader(filter: SearchFilter): ReSelectLoader | undefined {
  return filter.loader || (typeof filter.dataSource === "function" ? filter.dataSource : undefined);
}
</script>

<template>
  <!-- Modern 布局（原样保留） -->
  <ModernLayout
    v-if="layout === 'modern'"
    :is-expanded="isExpanded"
    :show-search="showSearch"
    :bordered="bordered"
    :mode="mode"
    :show-label="showLabel"
    :tooltip-text="tooltipText"
    :padding="padding"
  >
    <slot />
    <template #footer>
      <slot name="footer" />
    </template>
    <template #action>
      <slot name="action" />
    </template>
  </ModernLayout>

  <!-- Default 布局：横向搜索条（根卡片常驻，隐藏过滤区时至少留下工具栏可以还原） -->
  <div
    v-else
    class="koi-search"
    :class="{ 'koi-search--bordered': bordered }"
    :style="containerStyle"
  >
    <!-- 顶部条：左侧（导航 slot + 徽标）+ 右上折叠切换 -->
    <div class="koi-search__topbar">
      <div class="koi-search__topbar-left">
        <!-- 左侧导航插槽：调用方把页签 / 切换菜单放进来，与「搜索」徽标并排 -->
        <slot name="nav" />
        <div class="koi-search__badge">
          <span class="koi-search__badge-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.5" y2="16.5" />
            </svg>
          </span>
          <span>{{ title }}</span>
        </div>
      </div>
      <button
        v-if="hasOverflow"
        type="button"
        class="koi-search__expand"
        :class="{ 'koi-search__expand--expanded': localExpanded }"
        @click="toggleExpand"
      >
        <span>{{ localExpanded ? "收起" : "展开" }}</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
    </div>

    <!-- 内容行：字段（左）随过滤区收放，操作按钮（右）常驻，否则隐藏后没有还原入口 -->
    <div v-show="hasFilterContent" class="koi-search__body">
      <transition name="re-search-collapse">
        <div
          v-show="localFilterVisible"
          ref="contentEl"
          class="koi-search__fields"
          :class="{
            'koi-search__fields--data': filterMode === 'data',
          }"
        >
          <!-- filters prop 驱动的过滤项（响应式收纳：放不下的字段折叠隐藏） -->
          <template v-if="filters && filters.length > 0">
            <div
              v-for="(filter, index) in filters"
              :key="filter.key"
              class="koi-search__field"
              :class="{ 'koi-search__field--hidden': isFieldHidden(index) }"
            >
              <span
                v-if="filterMode === 'form' && filter.label"
                class="koi-search__field-label"
              >{{ filter.label }}</span>
              <ElInput
                v-if="!filter.type || filter.type === 'input'"
                v-model="filterValues[filter.key]"
                :placeholder="filter.placeholder || (filterMode === 'form' ? '请输入' : filter.label || '请输入')"
                :aria-label="ariaOf(filter)"
                clearable
                v-bind="filter.attrs || {}"
                @input="(val: string) => onFilterInput(filter.key, val)"
                @keyup.enter="emit('search')"
              />
              <!-- 远端 select：声明了 dataSource / url / loader 时走 ReSelect 远端加载 -->
              <ReSelect
                v-else-if="filter.type === 'select' && isRemoteSelectFilter(filter)"
                :model-value="(filterValues[filter.key] as any)"
                :data="filter.options || []"
                :url="filterUrl(filter)"
                :loader="filterLoader(filter)"
                :placeholder="filter.placeholder || (filterMode === 'form' ? '请选择' : filter.label || '请选择')"
                :aria-label="ariaOf(filter)"
                clearable
                v-bind="filter.attrs || {}"
                @update:model-value="(val: any) => onFilterInput(filter.key, val)"
              />
              <ElSelect
                v-else-if="filter.type === 'select'"
                v-model="filterValues[filter.key]"
                :placeholder="filter.placeholder || (filterMode === 'form' ? '请选择' : filter.label || '请选择')"
                :aria-label="ariaOf(filter)"
                clearable
                v-bind="filter.attrs || {}"
                @change="(val: any) => onFilterInput(filter.key, val)"
              >
                <ElOption
                  v-for="opt in (filter.options || [])"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </ElSelect>
              <!-- 按钮式：选项全部铺成按钮，直点直筛。默认走 ReSelect 的纯图标档（含义靠字段标签 + tooltip），
                   要图标+文字胶囊在 attrs 里传 { iconOnly: false } -->
              <ReSelect
                v-else-if="filter.type === 'square'"
                :model-value="filterValues[filter.key]"
                layout="square"
                :data="filter.options || []"
                :aria-label="ariaOf(filter)"
                v-bind="filter.attrs || {}"
                @update:model-value="(val: any) => onFilterInput(filter.key, val)"
              />
              <ElDatePicker
                v-else-if="filter.type === 'date'"
                v-model="filterValues[filter.key]"
                :placeholder="filter.placeholder || (filterMode === 'form' ? '请选择日期' : filter.label || '请选择日期')"
                :aria-label="ariaOf(filter)"
                type="date"
                value-format="YYYY-MM-DD"
                clearable
                v-bind="filter.attrs || {}"
                @change="(val: any) => onFilterInput(filter.key, val)"
              />
              <ElDatePicker
                v-else-if="filter.type === 'daterange'"
                v-model="filterValues[filter.key]"
                :start-placeholder="filter.placeholder || '开始日期'"
                end-placeholder="结束日期"
                :aria-label="ariaOf(filter)"
                type="daterange"
                value-format="YYYY-MM-DD"
                clearable
                v-bind="filter.attrs || {}"
                @change="(val: any) => onFilterInput(filter.key, val)"
              />
              <ElTreeSelect
                v-else-if="filter.type === 'treeselect'"
                v-model="filterValues[filter.key]"
                :data="filter.options || []"
                :placeholder="filter.placeholder || (filterMode === 'form' ? '请选择' : filter.label || '请选择')"
                :aria-label="ariaOf(filter)"
                clearable
                check-strictly
                v-bind="filter.attrs || {}"
                @change="(val: any) => onFilterInput(filter.key, val)"
              />
            </div>
          </template>
          <!-- slot 自定义过滤项 -->
          <slot />
        </div>
      </transition>

      <!-- 操作按钮（常驻，隐藏过滤区时它是唯一的还原入口） -->
      <div class="koi-search__actions">
        <!-- 动画图标：hover 播上游动效；loading 态保留图标并整体旋转 -->
        <ReButton
          v-if="showSearchBtn"
          v-show="localFilterVisible"
          type="primary"
          icon="anim:tabler:search"
          :anim-icon-size="16"
          show-text
          :loading="loading"
          @click="emit('search')"
        >{{ searchText }}</ReButton>
        <ReButton
          v-if="showResetBtn"
          v-show="localFilterVisible"
          icon="anim:tabler:refresh"
          :anim-icon-size="16"
          show-text
          @click="resetForm"
        >{{ resetText }}</ReButton>
        <span v-show="!localFilterVisible" class="koi-search__hint">{{ title }}已收起</span>
        <!-- 批量按钮 / footer 插槽走 ReSearchToolbar（无 新增/刷新/隐藏） -->
        <ReSearchToolbar
          v-if="showBatchDeleteBtn || showBatchSelectBtn || !!slots.footer"
          :filter-visible="localFilterVisible"
          :btn-mode="btnMode"
          :show-toggle="false"
          :show-search="false"
          :show-reset="false"
          :show-refresh="false"
          :show-add="false"
          :show-batch-delete="showBatchDeleteBtn"
          :batch-delete-text="batchDeleteText"
          :batch-delete-disabled="batchDeleteDisabled"
          :show-batch-select="showBatchSelectBtn"
          :batch-select-text="batchSelectText"
          :batch-select-active="batchSelectActive"
          :batch-select-text-active="batchSelectTextActive"
          @batch-delete="emit('batch-delete')"
          @batch-select="emit('batch-select')"
        >
          <template #toolbar>
            <slot name="footer" />
          </template>
        </ReSearchToolbar>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.koi-search {
  margin: 4px 4px 0;
  background: var(--rs-bg-card);
  border: 1px solid transparent;
  border-radius: var(--rs-radius-lg);
  color: var(--rs-text);
  box-sizing: border-box;
}
.koi-search--bordered {
  border-color: var(--rs-border);
}

/* 顶部条：左侧簇（导航 slot + 徽标）+ 折叠切换（右上角） */
.koi-search__topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 12px;
  min-height: 26px;
}
.koi-search__topbar-left {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  flex: 1 1 auto;
}
.koi-search__topbar-left :deep(.re-tab) {
  flex-shrink: 0;
  max-width: 100%;
}
.koi-search__badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  font-size: 13px;
  font-weight: 600;
  color: rgb(57, 134, 255);
  background: rgb(235, 243, 255);
  border: 1px solid rgb(156, 195, 255);
  border-radius: 6px;
  user-select: none;
  line-height: 18px;
}
.koi-search__badge-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.koi-search__expand {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  font-size: 12px;
  color: var(--el-text-color-regular);
  background: transparent;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: color var(--rs-transition), background var(--rs-transition);
}
.koi-search__expand:hover {
  color: var(--rs-text);
  background: var(--rs-bg-hover);
}
.koi-search__expand svg {
  transition: transform 0.25s ease;
}
.koi-search__expand--expanded svg {
  transform: rotate(180deg);
}

/* 内容行：字段（左）+ 操作按钮（右），同一行 */
.koi-search__body {
  display: flex;
  align-items: flex-end;
  gap: 12px 16px;
  flex-wrap: wrap;
}

.koi-search__fields {
  /* flex-basis 必须是 0：若取内容宽度（auto），字段区会被 grid 的内在宽度撑开，
     把操作按钮挤到下一行；且测量出的可用宽度就不再等于「去掉按钮后」的宽度 */
  flex: 1 1 0;
  display: grid;
  /* min(220px, 100%) 保证容器过窄时列宽跟着缩，而不是溢出到按钮下面 */
  grid-template-columns: repeat(auto-fill, minmax(min(220px, 100%), 1fr));
  gap: 10px 12px;
  min-width: 0;
}

.koi-search__field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.koi-search__field-label {
  font-size: 13px;
  color: var(--el-text-color-regular);
  white-space: nowrap;
  text-align: left;
}

/* data 模式：标签隐藏，仅组件 */
.koi-search__fields--data .koi-search__field {
  display: block;
}

/* 响应式收纳：折叠态隐藏放不下的字段 */
.koi-search__field--hidden {
  display: none;
}

/* 过滤区收起时的占位提示 */
.koi-search__hint {
  font-size: 12px;
  color: var(--rs-text-secondary, #909399);
  white-space: nowrap;
}

/* 操作按钮：与字段同行右对齐 */
.koi-search__actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  margin-left: auto;
  align-self: flex-end;
}

/* 折叠动画（filterVisible 切换时整行淡入淡出） */
.re-search-collapse-enter-from,
.re-search-collapse-leave-to {
  transform: translateY(-4px);
  opacity: 0;
}
.re-search-collapse-enter-active,
.re-search-collapse-leave-active {
  transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1),
              opacity 0.2s ease;
}

@media (max-width: 768px) {
  .koi-search__fields {
    grid-template-columns: repeat(auto-fill, minmax(min(180px, 100%), 1fr));
  }
  .koi-search__actions {
    width: 100%;
    justify-content: flex-end;
    margin-left: 0;
  }
}
</style>
