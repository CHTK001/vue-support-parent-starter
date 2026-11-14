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
 * 数据源（语义清晰，遵循 data=静态/函数、url=远程地址、loader=函数 三分原则）：
 *   1) data   —— 静态数组（也可用 options 别名）；**传函数则等价于 loader**，见下
 *   2) url    —— 远程接口地址，自动请求 + 防抖 + 重试（getApiHttp）
 *   3) loader —— 自定义加载函数 (params) => Promise<ReOption[]>，用于复杂场景
 *
 * 其中「传函数走远程」与 ReTable 的约定一致：:data 传函数即后端加载器，
 * 与 :loader 二选一；两者都传时以 data 的函数形态优先（同 ReTable）。
 *
 * 用法：
 *   <ReSelect :data="[{label:'男',value:1}]" />
 *   <ReSelect url="/api/roles" v-model="id" />
 *   <ReSelect :data="(p) => fetchRoles(p)" v-model="id" />
 *   <ReSelect :loader="(p) => fetchRoles(p)" v-model="id" />
 *
 * 远程结果缓存（cache=true 时生效，与 ReTable 同一套 cache / cacheTtl / cacheKey / cacheStorage）：
 *   同一「查询条件（params + keyword）」在 cacheTtl 内再次出现时直接读存档，不再请求；
 *   显式 reload() 绕过缓存一次并顺手写回，暴露 clearCache() 供增删改后主动失效。
 */
import { computed, onMounted, ref, useAttrs, watch } from "vue";
import { ElSelect, ElOption, ElCheckbox } from "element-plus";
import { getApiHttp, useDataSource, type ReDataSource } from "@repo/core";
import type { ReOption, ReSelectCacheStorage, ReSelectLayout, ReSelectLoader, ReSelectSize } from "./types";
import { debounce, createStorage, browserLocalStorage, browserSessionStorage, yieldToMain, type StorageWrapper } from "@repo/utils";
import { getStorageKey } from "@repo/config";
import "../shared/modern-vars.css";
import CardDropdownLayout from "./layouts/CardDropdown.vue";
import SquareLayout from "./layouts/Square.vue";
import ModernLayout from "./layouts/Modern.vue";

defineOptions({ name: "ReSelect", inheritAttrs: true });

const model = defineModel<string | number | (string | number)[] | null>({ default: "" });

/** 内层 el-select 实例：只为对外暴露 focus()（default 布局），不参与其它逻辑 */
const elSelectRef = ref<InstanceType<typeof ElSelect> | null>(null);

const props = withDefaults(
  defineProps<{
    /** 静态选项数组；传函数则等价于 loader，走远程加载（与 ReTree / ReTable 同一口径） */
    data?: ReOption[] | ReSelectLoader;
    /** 静态选项别名（与 data 传数组等价） */
    options?: ReOption[];
    /**
     * 远程 url。
     *
     * <p>统一口径为 {@link data}（数组｜函数）+ {@link loader}（函数）；本项是等价的便捷别名，
     * 内部与 loader 同一条远程加载路径（自动 GET + 防抖 + 重试）。</p>
     */
    url?: string;
    /** 远程加载器（与 data 传函数等价），签名 (params: {keyword?:string}) => ReOption[] | Promise<ReOption[]> */
    loader?: ReSelectLoader;
    /** 远程/loader 查询参数 */
    params?: Record<string, unknown>;
    /**
     * 远程结果缓存（默认 false，仅远程模式生效），语义与 ReTable 的 cache 一致。
     *
     * <p>开启后，同一「查询条件（params + filterable 关键词）」在 {@link cacheTtl} 内
     * 再次出现时直接读存档、不再请求 data / loader / url。典型场景是「打开下拉 → 关闭 →
     * 再打开」或同一选项在多处复用，省掉重复请求与 loading 闪烁。</p>
     *
     * <p>显式 {@code reload()}（含外部调用与工具栏刷新）必定绕过缓存并顺手写回存档；
     * 增删改后可用暴露的 {@code clearCache()} 主动失效。</p>
     *
     * <p><b>前提</b>：能定位到缓存命名空间 —— 传了 {@link cacheKey}，或使用了 {@link url}
     * （缺省用 url 作命名空间）。仅用 loader 函数时务必显式传 {@link cacheKey}，
     * 否则缓存不生效，dev 下告警一次。</p>
     */
    cache?: boolean;
    /** 缓存有效期（毫秒），默认 300000（5 分钟）；传 0 表示不过期 */
    cacheTtl?: number;
    /** 缓存命名空间；缺省用 url。同一 url 被多个下拉共用且需各自独立缓存时必须显式区分 */
    cacheKey?: string;
    /** 缓存载体：session（默认，关标签页即失效）/ local（跨会话保留） */
    cacheStorage?: ReSelectCacheStorage;
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
    /** square 布局：选中项图标名（缺省回退到选项自身的 activeIcon / icon） */
    activeIcon?: string;
    /** square 布局：未选中项图标名（缺省回退到选项自身的 inactiveIcon / icon） */
    inactiveIcon?: string;
    /** square 布局：内置图标集名（sunmoon / check / star / bell / arrow / anim）；"none" 关闭内置回落 */
    preset?: string;
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
    cache: false,
    cacheTtl: 300000,
    cacheKey: "",
    cacheStorage: "session",
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
    activeIcon: "",
    inactiveIcon: "",
    preset: undefined,
    compact: undefined,
    bulkActions: false,
  },
);

/** 是否为远程模式（url / loader / data 传函数） */
const isRemote = computed<boolean>(
  () => Boolean(props.url) || typeof props.loader === "function" || typeof props.data === "function",
);

/**
 * 最终生效的尺寸档位：type 优先，size 作为兼容别名兜底。
 *
 * 抽成 computed 而不是各处写 props.type ?? props.size，是因为五种布局都要用，
 * 而 size 会被 v-bind="$attrs" / modernProps 透传到子布局，各处重复兜底容易漏。
 */
const controlSize = computed<ReSelectSize>(() => props.type ?? props.size ?? "default");

/** el-select 能吃下的档位：element 原生只有 large/default/small，mini 归一为 small + CSS 压薄 */
const elSelectSize = computed<"large" | "default" | "small">(() =>
  controlSize.value === "mini" ? "small" : controlSize.value,
);

/** 静态模式下的最终数据（data 传数组优先，否则 options） */
const staticData = computed<ReOption[]>(() =>
  Array.isArray(props.data) ? props.data : (props.options ?? []),
);

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

/* ========== 远程结果缓存（仅远程模式，语义对齐 ReTable） ========== */

/**
 * 缓存命名空间：显式 {@code cacheKey} 优先，缺省回落到 {@link url}。
 *
 * <p>空串 = 不缓存：既没传 cacheKey 又不是 url 模式（即仅有 loader 函数）时，
 * 无法定位这份缓存属于谁，硬存只会让不同下拉互相覆盖。此时 dev 下告警一次。</p>
 */
const cacheNamespace = computed<string>(() => {
  if (!props.cache) return "";
  return props.cacheKey || props.url || "";
});

/**
 * 缓存载体：按 {@code cacheStorage} 选 session / local，并以命名空间为前缀建独立实例。
 *
 * <p>用带前缀的独立实例而不是裸的 localStore / sessionStore，是为了 {@link clearCache}
 * 的 {@code clear()} 只清本下拉这一份 —— 裸实例前缀为空，clear 会把同 storage 里的
 * 列配置、token 一起端掉。</p>
 */
const cacheStore = computed<StorageWrapper | null>(() => {
  const ns = cacheNamespace.value;
  if (!ns) return null;
  return createStorage(props.cacheStorage === "local" ? browserLocalStorage : browserSessionStorage, {
    prefix: getStorageKey(`re-select-cache:${ns}`),
  });
});

/** 缓存是否生效：开关打开 + 命名空间定位得到 */
const cacheEnabled = computed<boolean>(() => cacheStore.value !== null);

/**
 * 下一次取数强制走网络（显式 reload 用）。
 *
 * <p>「显式刷新」的语义就是「我要最新的」：绕过读缓存，拿到响应后照常写回。
 * 标志在 {@link buildRemoteSource} 的 run 里读一次即清零 —— 只影响紧接着的这一次取数。</p>
 */
let bypassCacheOnce = false;

/** 条目 key = 查询指纹（params + keyword 全量参与，任一不同即另一批选项） */
function buildCacheEntryKey(paramObj: Record<string, unknown>): string {
  return JSON.stringify(paramObj);
}

/** 读缓存：命中且形状是数组才返回，否则一律当作未命中 */
function readCachedOptions(entryKey: string): ReOption[] | null {
  const store = cacheStore.value;
  if (!store) return null;
  const cached = store.get<unknown>(entryKey);
  return Array.isArray(cached) ? (cached as ReOption[]) : null;
}

/** 写缓存；失败（隐私模式 / 配额满）由 StorageWrapper 内部吞掉，不影响本次取数 */
function writeCachedOptions(entryKey: string, options: ReOption[]): void {
  const store = cacheStore.value;
  if (!store) return;
  // 0 / 负数 / NaN 一律按不过期处理（StorageWrapper 对 falsy 的 expires 即不写过期元数据）
  const ttl = Number(props.cacheTtl);
  store.set(entryKey, options, Number.isFinite(ttl) && ttl > 0 ? Math.round(ttl) : 0);
}

/** 清空本下拉全部缓存条目（所有查询条件），供页面在增删改后主动失效 */
function clearCache(): void {
  cacheStore.value?.clear();
}

onMounted(() => {
  if (props.cache && !cacheNamespace.value && import.meta.env.DEV) {
    console.warn(
      "[ReSelect] cache 已开启但既未传 cacheKey 也无 url，无法定位缓存命名空间，本次不生效。仅用 loader 时请显式传 cacheKey。",
    );
  }
});

/**
 * 真正取数：data 传函数 / loader 模式直接调用用户函数，
 * url 模式用 getApiHttp（拦截器含加密/签名/重试）。
 */
async function fetchRemoteOptions(paramObj: Record<string, unknown>): Promise<ReOption[]> {
  // data 传函数与 loader 等价，且 data 优先（同 ReTable 约定）
  if (typeof props.data === "function") {
    return await props.data(paramObj);
  }
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
}

/**
 * 远程加载函数（useDataSource 的 source）。
 *
 * <p>列表结果缓存也挂在这一层：先按查询指纹读档（显式 reload 的这次跳过），
 * 未命中才真正取数并写回。</p>
 */
function buildRemoteSource(): ReDataSource<ReOption[]> {
  const run = async (): Promise<ReOption[]> => {
    const paramObj = { ...(props.params ?? {}) };
    if (props.filterable && keyword.value) {
      paramObj.keyword = keyword.value;
    }

    /* 先取标志再清零 —— 顺序反了会在命中提前 return 时把标志漏给下一次取数 */
    const bypass = bypassCacheOnce;
    bypassCacheOnce = false;
    const entryKey = cacheEnabled.value ? buildCacheEntryKey(paramObj) : "";
    if (entryKey && !bypass) {
      const cached = readCachedOptions(entryKey);
      if (cached) return cached;
    }

    try {
      const options = await fetchRemoteOptions(paramObj);
      // 写回存档：reload 是绕过读缓存走过来的，照常写回，于是「显式刷新」既拿到新数据也顺手更新缓存
      if (entryKey) writeCachedOptions(entryKey, options);
      return options;
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

/**
 * 实际渲染给下拉的选项。
 *
 * <p>为什么需要：模板给 {@code ElSelect} 绑了 {@code :filter-method="onInput"}，
 * 而 Element Plus 的语义是「一旦提供 filter-method，内置过滤就不再生效，过滤完全交给该方法」。
 * 原先 {@code onInput} 只把关键词存进 {@code keyword}（那是给远程模式拼 keyword 参数用的），
 * 于是**本地静态选项的搜索框输入任何内容都不做过滤**——filterable 形同虚设。
 * 这里在本地模式下由组件自己按关键词过滤；远程模式维持原样（关键词交给数据源重新请求）。</p>
 */
const visibleList = computed<ReOption[]>(() => {
  const list = dataList.value ?? [];
  if (isRemote.value) return list;
  const kw = keyword.value.trim().toLowerCase();
  if (!kw) return list;
  return list.filter(o => String(o.label ?? o.value ?? "").toLowerCase().includes(kw));
});

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

/**
 * 显式重新加载：绕过缓存一次（拿到最新数据），拿到响应后照常写回存档。
 *
 * <p>与 ReTable 的 {@code reload()} 同一语义：默认的 params / keyword 变化重载仍走缓存，
 * 只有这里的显式刷新强制走网络。</p>
 */
async function reload(): Promise<void> {
  bypassCacheOnce = isRemote.value;
  // 先让一帧：让下拉的 loading 态（Element Plus 的 spinner）先画出来再取数。
  // 否则点击刷新后浏览器要等接口回来才开始处理后续任务，用户看到的是
  // 「按下去没反应，过一会儿整块冻住」—— 与 ReTable 的刷新是同一个问题。
  await yieldToMain();
  await dsReload();
}

defineExpose({
  /** 聚焦到内层 el-select（default 布局）；非 default 布局时无操作 */
  focus: () => elSelectRef.value?.focus?.(),
  reload,
  clearCache,
  get loading(): boolean {
    return dataLoading.value;
  },
  get cacheEnabled(): boolean {
    return cacheEnabled.value;
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
    :options="(visibleList ?? []) as any"
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
    :options="(visibleList ?? []) as any"
    :multiple="multiple"
    :disabled="disabled"
    :icon-only="iconOnly"
    :vertical="vertical"
    :compact="isCompact"
    :control-size="controlSize"
    :active-icon="activeIcon"
    :inactive-icon="inactiveIcon"
    :preset="preset"
    v-bind="$attrs"
  />

  <!-- 默认 / card / table 布局 -->
  <ElSelect
    v-else
    ref="elSelectRef"
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
    :size="elSelectSize"
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
        v-for="opt in visibleList ?? []"
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
        v-for="opt in visibleList ?? []"
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
/* mini 档：比 small 再压薄（element 原生无 mini，复用 small 的 :size + 这里压高度） */
.re-select.re-select--mini :deep(.el-select__wrapper) {
  min-height: 24px;
  padding: 0 8px;
  font-size: 12px;
}
.re-select.re-select--mini :deep(.el-select__placeholder),
.re-select.re-select--mini :deep(.el-select__selected-item) {
  font-size: 12px;
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
