<script setup lang="ts">
/**
 * 运维台外壳 —— 四个档位共用一套页头、筛选、空态与操作
 *
 * <p>会话审计 / 批量作业 / 片段管理 / 维护计划这四页此前各写一套页壳（手搓卡片 +
 * 统计 + 分段 + 筛选、带投影的卡片、自定义 filter-bar）。四页的活儿其实一样：
 * <b>筛选 → 找一条 → 看详情 → 操作</b>。所以外壳只做一次，页面只提供数据与动作。</p>
 *
 * <p>四个档位不是配色差异，而是<b>对页面用途的不同判断</b>：</p>
 * <ul>
 *   <li><b>三栏指挥台</b>：分面栏 + 密集列表 + 常驻详情，选中即看详情，零翻页。</li>
 *   <li><b>泳道时间墙</b>：一条泳道一台主机，横轴是时间，撞车与空档一眼可见。</li>
 *   <li><b>矩阵热力台</b>：行是主机、列是时段，格子颜色就是「哪台最忙」。</li>
 *   <li><b>状态看板</b>：按状态分列，失败项自己冒出来，值班时不用先筛「失败」。</li>
 * </ul>
 *
 * <p>档位由页面按数据形状开放：片段管理没有时间语义，就不给泳道与矩阵。</p>
 *
 * @author CH
 * @since 4.0.0.43
 */
import { computed, ref, watch } from "vue";
import ReSelect from "@repo/ui/re-select";
import type { OpsFacetGroup, OpsFilterField, OpsItem, OpsMode, OpsModeMeta, OpsTone } from "./types";

const props = withDefaults(
  defineProps<{
    /** 页面标题 */
    title: string;
    /** 一句话说明 */
    desc?: string;
    /** 当前档位（v-model:mode） */
    mode: OpsMode;
    /** 该页开放的档位 */
    modes?: OpsModeMeta[];
    /** 条目 */
    items?: OpsItem[];
    /** 分面栏分组（三栏档位用；为空则不显示分面栏） */
    facets?: OpsFacetGroup[];
    /** 当前筛选模型（键对应 facets[].key） */
    facetModel?: Record<string, string>;
    /** 状态分段 */
    tabs?: Array<{ label: string; value: string; count?: number }>;
    /** 当前分段值 */
    tabValue?: string;
    /** 控制栏筛选项定义 */
    filters?: OpsFilterField[];
    /** 筛选模型（键与 filters[].key 对应） */
    filterModel?: Record<string, string>;
    /** 看板列定义（键对应 item.column） */
    columns?: Array<{ key: string; label: string; tone?: OpsTone }>;
    /** 泳道档位的分组名 */
    laneLabel?: string;
    /** 泳道档位头部说明（条长代表什么） */
    laneHint?: string;
    /** 右侧计数文案 */
    countText?: string;
    /** 加载态 */
    loading?: boolean;
    /** 错误文案 */
    error?: string;
    /** 空态文案 */
    emptyText?: string;
    /** 空态补充说明 */
    emptyHint?: string;
    /** 详情栏标题（三栏档位用；默认取选中项标题） */
    detailTitle?: string;
    /** 矩阵档位的时间桶数量（默认 6 桶 = 每桶 4 小时） */
    matrixBuckets?: number;
  }>(),
  {
    desc: "",
    modes: () => [],
    items: () => [],
    facets: () => [],
    facetModel: () => ({}),
    tabs: () => [],
    tabValue: "",
    filters: () => [],
    filterModel: () => ({}),
    columns: () => [],
    laneLabel: "主机",
    laneHint: "条长 = 持续时长 · 点击查看",
    countText: "",
    loading: false,
    error: "",
    emptyText: "没有数据",
    emptyHint: "",
    detailTitle: "",
    matrixBuckets: 6,
  },
);

const emit = defineEmits<{
  (e: "update:mode", value: OpsMode): void;
  (e: "update:tabValue", value: string): void;
  /** 分面筛选变化 */
  (e: "facet", key: string, value: string): void;
  /** 控制栏筛选项变化 */
  (e: "filter", key: string, value: string): void;
  /** 选中某个条目 */
  (e: "select", item: OpsItem | null): void;
  /** 矩阵格子点击：主机 + 时段起点小时 */
  (e: "cell", lane: string, fromHour: number): void;
  (e: "refresh"): void;
}>();

/* ==================== 选中态 ==================== */

/** 当前选中条目 id */
const pickedId = ref<number | string | null>(null);

/** 当前选中条目 */
const picked = computed<OpsItem | null>(
  () => props.items.find(it => it.id === pickedId.value) ?? null,
);

/**
 * 选一条。
 *
 * <p>三栏与泳道都要「点一下看到详情」，但选中态归外壳管：页面切筛选条件后
 * 若选中项被筛掉，外壳自动落到第一条，不会留一个指向不存在条目的详情栏。</p>
 *
 * @param item 目标条目
 */
function pick(item: OpsItem): void {
  // 不做「再点一次取消选中」：三栏的右栏是常驻详情，取消后右栏只剩一句空话，
  // 用户想换的是另一条，不是把详情关掉。
  pickedId.value = item.id;
  emit("select", picked.value);
}

// 列表变化后校正选中项：被筛掉就退到第一条，一条都没选时落到第一条
watch(
  () => props.items,
  list => {
    if (!list.length) {
      if (pickedId.value !== null) {
        pickedId.value = null;
        emit("select", null);
      }
      return;
    }
    if (pickedId.value === null || !list.some(it => it.id === pickedId.value)) {
      pickedId.value = list[0]!.id;
      emit("select", picked.value);
    }
  },
  { immediate: true },
);

/* ==================== 分面栏 ==================== */

/**
 * 点击分面项。
 *
 * <p>再点一次取消：用户点「SSH 97」是想只看 SSH，再点一下就该回到全部，
 * 不必回头找「全部」那一项。</p>
 *
 * @param key   筛选键
 * @param value 选项值
 */
function toggleFacet(key: string, value: string): void {
  emit("facet", key, props.facetModel[key] === value ? "" : value);
}

/**
 * 控制栏筛选项变化。
 *
 * <p>入参放宽到 unknown：ReSelect 清空时给 null，ReInput 给字符串。
 * 边界处统一收敛成字符串，页面不必各自处理这几种形状。</p>
 *
 * @param key   字段
 * @param value 值
 */
function onFilter(key: string, value: unknown): void {
  emit("filter", key, value === null || value === undefined ? "" : String(value));
}

/* ==================== 泳道 ==================== */

/**
 * 泳道分组。
 *
 * <p>没有区间数据的条目不进泳道（画不出来），它们的数量在空态提示里说明。</p>
 */
const lanes = computed(() => {
  const map = new Map<string, OpsItem[]>();
  for (const it of props.items) {
    if (it.startMs == null || it.endMs == null) continue;
    const key = it.lane || it.title;
    const list = map.get(key) ?? [];
    list.push(it);
    map.set(key, list);
  }
  return [...map.entries()].map(([name, list]) => ({ name, list }));
});

/** 泳道里没有区间的条目数 */
const timelessCount = computed(
  () => props.items.filter(it => it.startMs == null || it.endMs == null).length,
);

/**
 * 时间窗：所有区间的最小起点到最大终点。
 *
 * <p>不强行按「当天 0~24 点」切：维护计划常常跨天，把 3 天窗口压进 24 小时轴
 * 会让条块全部叠在右端。这里按数据自身的范围铺满，轴标签随之给日期。</p>
 */
const window = computed(() => {
  let from = Number.POSITIVE_INFINITY;
  let to = Number.NEGATIVE_INFINITY;
  for (const lane of lanes.value) {
    for (const it of lane.list) {
      from = Math.min(from, it.startMs as number);
      to = Math.max(to, it.endMs as number);
    }
  }
  if (!Number.isFinite(from) || !Number.isFinite(to) || to <= from) {
    const now = Date.now();
    return { from: now - 3_600_000, to: now + 3_600_000 };
  }
  // 两端各留 2% 余量，贴边的条块才不会被裁掉圆角
  const pad = (to - from) * 0.02;
  return { from: from - pad, to: to + pad };
});

/**
 * 一个条目在泳道里的几何。
 *
 * @param item 条目
 */
function blockStyle(item: OpsItem): Record<string, string> {
  const from = window.value.from;
  const span = window.value.to - from;
  const start = ((item.startMs as number) - from) / span;
  const end = ((item.endMs as number) - from) / span;
  const left = Math.max(0, Math.min(1, start)) * 100;
  // 下限：真实区间按比例画，但一个 5 分钟的重启窗口在三天轴上不到 0.2%，
  // 按真实比例会细到看不见，所以给 0.5%。起止同点的条目（如「从未运行过的任务
  // 只有下次触发时刻」）不是区间而是标记，给 1.1% 才看得出是一个点。
  const isMark = (item.endMs as number) <= (item.startMs as number);
  const width = Math.max((Math.min(1, end) - Math.min(1, start)) * 100, isMark ? 1.1 : 0.5);
  return {
    left: `${Math.min(left, 99.5)}%`,
    width: `${Math.min(width, 100 - left)}%`,
    "--tone": toneColor(item.blockTone ?? item.tone),
  };
}

/** 轴刻度：5 个等分点 */
const axisTicks = computed(() => {
  const from = window.value.from;
  const span = window.value.to - from;
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(from + (span * i) / 4);
    const sameDay = new Date(from).toDateString() === new Date(window.value.to).toDateString();
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return sameDay ? `${hh}:${mm}` : `${d.getMonth() + 1}-${d.getDate()} ${hh}:${mm}`;
  });
});

/* ==================== 矩阵 ==================== */

/** 矩阵的行：泳道名（没有泳道的条目按标题归一行） */
const matrixRows = computed(() => {
  const map = new Map<string, OpsItem[]>();
  for (const it of props.items) {
    const key = it.lane || it.title;
    const list = map.get(key) ?? [];
    list.push(it);
    map.set(key, list);
  }
  return [...map.entries()].map(([name, list]) => ({ name, list }));
});

/** 桶宽度（小时） */
const bucketHours = computed(() => 24 / props.matrixBuckets);

/** 矩阵列：一天内的等分时段 */
const matrixCols = computed(() =>
  Array.from({ length: props.matrixBuckets }, (_, i) => {
    const from = i * bucketHours.value;
    const to = from + bucketHours.value;
    return {
      fromHour: from,
      label: `${String(from).padStart(2, "0")}-${String(to).padStart(2, "0")}`,
    };
  }),
);

/**
 * 一个条目落在哪个时段桶。
 *
 * <p>按起点归桶（与「按开始时刻统计」的口径一致）：跨时段的条目只计入它开始的那一格，
 * 否则同一份数据在矩阵里会被算两次，格子加起来大于总数。</p>
 *
 * @param item 条目
 */
function bucketOf(item: OpsItem): number | null {
  if (item.startMs == null) return null;
  const d = new Date(item.startMs);
  const hour = d.getHours() + d.getMinutes() / 60;
  return Math.min(props.matrixBuckets - 1, Math.floor(hour / bucketHours.value));
}

/** 矩阵数据：行 × 列 的计数与最大值 */
const matrix = computed(() => {
  const rows = matrixRows.value.map(row => {
    const cells = Array.from({ length: props.matrixBuckets }, () => 0);
    for (const it of row.list) {
      const b = bucketOf(it);
      if (b !== null) cells[b] = (cells[b] ?? 0) + 1;
    }
    return { name: row.name, cells, total: row.list.length };
  });
  const peak = rows.reduce((m, r) => Math.max(m, ...r.cells), 0);
  return { rows, peak };
});

/**
 * 矩阵格子底色：计数越多越深。
 *
 * <p>用 color-mix 叠品牌色而不是写死 6 档色值：主题换色时热力跟着换，
 * 不必再维护一张色阶表。</p>
 *
 * @param count 格子计数
 */
function cellStyle(count: number): Record<string, string> {
  const peak = matrix.value.peak || 1;
  if (count === 0) return {};
  const ratio = count / peak;
  const pct = Math.round(12 + ratio * 76);
  return {
    background: `color-mix(in srgb, var(--el-color-primary, #6d5dfc) ${pct}%, transparent)`,
    color: ratio > 0.55 ? "#fff" : "var(--el-color-primary, #5a4bd9)",
  };
}

/* ==================== 看板 ==================== */

/**
 * 看板分列。
 *
 * <p>列来自页面给的 columns；没匹配到列的条目进「其它」，保证看板里的卡片总数
 * 与列表一致 —— 少一张卡片比多一列「其它」更容易被当成丢数据。</p>
 */
const kanban = computed(() => {
  const cols = props.columns.length
    ? props.columns
    : [{ key: "all", label: "全部", tone: "brand" as OpsTone }];
  const known = new Set(cols.map(c => c.key));
  const buckets = cols.map(c => ({
    ...c,
    items: props.items.filter(it => (it.column ?? "all") === c.key),
  }));
  const rest = props.items.filter(it => it.column != null && !known.has(it.column));
  if (rest.length) {
    buckets.push({ key: "__rest", label: "其它", tone: "mute" as OpsTone, items: rest });
  }
  return buckets;
});

/* ==================== 工具 ==================== */

/**
 * 色档 → CSS 颜色变量。
 *
 * <p>矩阵与泳道要往 inline style 里写颜色，这里统一取语义变量，
 * 保证与胶囊、状态点的颜色是同一套。</p>
 *
 * @param tone 色档
 */
function toneColor(tone?: OpsTone): string {
  switch (tone) {
    case "ok":
      return "var(--el-color-success, #2fbf71)";
    case "warn":
      return "var(--el-color-warning, #f59e0b)";
    case "bad":
      return "var(--el-color-danger, #e5534b)";
    case "info":
      // 不用 --el-color-info：Element Plus 把它定义成灰色 (#909399)，
      // 当作「进行中 / 待执行」的语义色会和 mute 撞在一起。
      return "#3b82f6";
    case "brand":
      return "var(--el-color-primary, #6d5dfc)";
    default:
      return "var(--el-text-color-placeholder, #a8abb2)";
  }
}

/**
 * 色档 → class 名。
 *
 * @param tone 色档
 */
function toneClass(tone?: OpsTone): string {
  return tone ? `t-${tone}` : "t-mute";
}

/** 详情栏展示的键值对 */
const detailMeta = computed(() => picked.value?.meta ?? []);
</script>

<template>
  <div class="op-page">
    <!-- 页头：标题 + 说明 + 档位切换 + 页面自己的操作 -->
    <div class="op-head">
      <div class="op-head__titles">
        <h2 class="op-head__title">{{ title }}</h2>
        <p v-if="desc" class="op-head__desc">{{ desc }}</p>
      </div>
      <div v-if="modes.length > 1" class="op-modes" role="group" aria-label="布局档位">
        <button
          v-for="m in modes"
          :key="m.id"
          type="button"
          class="op-mode"
          :class="{ 'is-active': m.id === mode }"
          :aria-pressed="m.id === mode"
          :title="m.thesis"
          @click="emit('update:mode', m.id)"
        >
          {{ m.label }}
        </button>
      </div>
      <div v-if="$slots.actions" class="op-head__actions">
        <slot name="actions" />
      </div>
    </div>

    <!-- 控制栏：状态分段 + 页面筛选项 + 计数 + 刷新 -->
    <div class="op-bar">
      <div v-if="tabs.length" class="op-seg" role="group" aria-label="按状态筛选">
        <button
          v-for="tab in tabs"
          :key="tab.value"
          type="button"
          class="op-seg__btn"
          :class="{ 'is-active': tab.value === tabValue }"
          :aria-pressed="tab.value === tabValue"
          @click="emit('update:tabValue', tab.value)"
        >
          {{ tab.label }}<span v-if="tab.count !== undefined" class="op-seg__count">{{ tab.count }}</span>
        </button>
      </div>
      <slot name="filters" />
      <template v-for="field in filters" :key="field.key">
        <ReSelect
          v-if="field.kind === 'select'"
          :model-value="filterModel[field.key] ?? ''"
          :options="field.options ?? []"
          :placeholder="field.placeholder"
          :style="{ width: `${field.width ?? 108}px` }"
          @update:model-value="onFilter(field.key, $event)"
        />
        <input
          v-else
          :value="filterModel[field.key] ?? ''"
          class="op-input"
          type="search"
          :placeholder="field.placeholder ?? '搜索'"
          :aria-label="field.placeholder ?? field.key"
          :style="{ width: `${field.width ?? 190}px` }"
          @input="onFilter(field.key, ($event.target as HTMLInputElement).value)"
        />
      </template>
      <span class="op-bar__spacer" />
      <span v-if="countText" class="op-bar__count">{{ countText }}</span>
      <button type="button" class="op-btn" :disabled="loading" title="刷新" @click="emit('refresh')">
        刷新
      </button>
    </div>

    <div v-if="error" class="op-error">{{ error }}</div>

    <!-- 主体：按档位渲染 -->
    <div class="op-body">
      <div v-if="loading && !items.length" class="op-loading">正在读取…</div>

      <template v-else-if="!items.length">
        <div class="op-empty">
          {{ emptyText }}
          <template v-if="emptyHint"><br />{{ emptyHint }}</template>
        </div>
      </template>

      <!-- ==================== 三栏指挥台 ==================== -->
      <template v-else-if="mode === 'deck'">
        <aside v-if="facets.length" class="op-facets">
          <div class="op-facets__body">
            <template v-for="g in facets" :key="g.key">
              <div class="op-facet-group">{{ g.label }}</div>
              <button
                v-for="opt in g.options"
                :key="`${g.key}:${opt.value}`"
                type="button"
                class="op-facet"
                :class="{ 'is-active': (facetModel[g.key] ?? '') === opt.value }"
                @click="toggleFacet(g.key, opt.value)"
              >
                <span v-if="opt.tone" class="op-row__dot" :class="toneClass(opt.tone)" />
                <span class="op-facet__label">{{ opt.label }}</span>
                <span class="op-facet__n">{{ opt.count }}</span>
              </button>
            </template>
          </div>
        </aside>

        <section class="op-pane" style="flex: 1">
          <div class="op-pane__head">条目 · {{ items.length }}</div>
          <div class="op-pane__body">
            <div class="op-list">
              <button
                v-for="it in items"
                :key="it.id"
                type="button"
                class="op-row"
                :class="{ 'is-active': it.id === pickedId }"
                @click="pick(it)"
              >
                <span class="op-row__dot" :class="toneClass(it.tone)" />
                <span class="op-row__main">
                  <span class="op-row__title">{{ it.title }}</span>
                  <span v-if="it.sub" class="op-row__sub">{{ it.sub }}</span>
                </span>
                <span class="op-row__tail">
                  <span v-if="it.statusText" class="op-pill" :class="toneClass(it.tone)">{{ it.statusText }}</span>
                  <span v-if="it.durationText" class="op-num op-dim">{{ it.durationText }}</span>
                  <slot name="row-tail" :item="it" />
                </span>
              </button>
            </div>
          </div>
        </section>

        <aside class="op-detail">
          <template v-if="picked">
            <div class="op-detail__title">{{ detailTitle || picked.title }}</div>
            <dl v-if="detailMeta.length" class="op-kv">
              <template v-for="kv in detailMeta" :key="kv.label">
                <dt>{{ kv.label }}</dt>
                <dd>{{ kv.value }}</dd>
              </template>
            </dl>
            <div v-if="picked.code" class="op-code">{{ picked.code }}</div>
            <div v-if="$slots.detail" class="op-detail__foot">
              <slot name="detail" :item="picked" />
            </div>
          </template>
          <div v-else class="op-empty">左侧选中一条，这里显示详情</div>
        </aside>
      </template>

      <!-- ==================== 泳道时间墙 ==================== -->
      <template v-else-if="mode === 'lanes'">
        <section class="op-pane" style="flex: 1">
          <div class="op-pane__head">
            <span>{{ laneLabel }}泳道</span>
            <span class="op-dim" style="text-transform: none; letter-spacing: 0; font-weight: 400">
              {{ laneHint }}
            </span>
            <span style="flex: 1" />
            <span v-if="timelessCount" class="op-dim" style="text-transform: none">
              另有 {{ timelessCount }} 条没有时间区间，未画入
            </span>
          </div>
          <div class="op-pane__body">
            <div class="op-axis">
              <span v-for="(t, i) in axisTicks" :key="i">{{ t }}</span>
            </div>
            <div class="op-lanes">
              <div v-for="lane in lanes" :key="lane.name" class="op-lane">
                <span class="op-lane__name" :title="lane.name">{{ lane.name }}</span>
                <div class="op-lane__track">
                  <i
                    v-for="it in lane.list"
                    :key="it.id"
                    class="op-lane__blk"
                    :style="blockStyle(it)"
                    :title="`${it.title} · ${it.startText ?? ''} → ${it.endText ?? ''}`"
                    @click="pick(it)"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <aside class="op-detail">
          <template v-if="picked">
            <div class="op-detail__title">{{ picked.title }}</div>
            <dl v-if="detailMeta.length" class="op-kv">
              <template v-for="kv in detailMeta" :key="kv.label">
                <dt>{{ kv.label }}</dt>
                <dd>{{ kv.value }}</dd>
              </template>
            </dl>
            <div v-if="picked.code" class="op-code">{{ picked.code }}</div>
            <div v-if="$slots.detail" class="op-detail__foot">
              <slot name="detail" :item="picked" />
            </div>
          </template>
          <div v-else class="op-empty">点一条色块看详情</div>
        </aside>
      </template>

      <!-- ==================== 矩阵热力台 ==================== -->
      <template v-else-if="mode === 'matrix'">
        <section class="op-pane" style="flex: 1">
          <div class="op-pane__head">
            <span>{{ laneLabel }} × 时段</span>
            <span style="flex: 1" />
            <span class="op-dim" style="text-transform: none; letter-spacing: 0; font-weight: 400">
              点任一格按该主机该时段筛选
            </span>
          </div>
          <div class="op-pane__body">
            <div
              class="op-matrix"
              :style="{ gridTemplateColumns: `minmax(90px, 150px) repeat(${matrixBuckets}, minmax(38px, 1fr))` }"
            >
              <span />
              <span v-for="c in matrixCols" :key="c.label" class="op-matrix__hd">{{ c.label }}</span>
              <template v-for="row in matrix.rows" :key="row.name">
                <span class="op-matrix__rn" :title="row.name">{{ row.name }}</span>
                <button
                  v-for="(cell, ci) in row.cells"
                  :key="ci"
                  type="button"
                  class="op-cell"
                  :class="{ 'is-empty': cell === 0 }"
                  :style="cellStyle(cell)"
                  :disabled="cell === 0"
                  :title="`${row.name} · ${matrixCols[ci]?.label ?? ''} · ${cell} 条`"
                  @click="emit('cell', row.name, matrixCols[ci]?.fromHour ?? 0)"
                >
                  {{ cell || "" }}
                </button>
              </template>
            </div>
          </div>
        </section>

        <aside class="op-detail">
          <div class="op-detail__title">按主机 / 时段看</div>
          <dl class="op-kv">
            <dt>行</dt>
            <dd>{{ matrix.rows.length }} 台 / 组</dd>
            <dt>列</dt>
            <dd>{{ matrixBuckets }} 个时段 · 每段 {{ bucketHours }} 小时</dd>
            <dt>峰值</dt>
            <dd>{{ matrix.peak }} 条</dd>
            <dt>合计</dt>
            <dd>{{ items.length }} 条</dd>
          </dl>
          <p class="op-dim" style="font-size: 11.5px; line-height: 1.7; margin: 0">
            按开始时刻归桶，跨时段的条目只计入它开始的那一格 ——
            否则格子加起来会大于总数。
          </p>
          <div v-if="$slots.matrixFoot" class="op-detail__foot">
            <slot name="matrixFoot" />
          </div>
        </aside>
      </template>

      <!-- ==================== 状态看板 ==================== -->
      <template v-else>
        <div class="op-kanban">
          <div v-for="col in kanban" :key="col.key" class="op-kcol" :class="toneClass(col.tone)">
            <div class="op-kcol__head">
              <span>{{ col.label }}</span>
              <b>{{ col.items.length }}</b>
              <span style="flex: 1" />
              <slot name="column-extra" :column="col.key" />
            </div>
            <div class="op-kcol__body">
              <button
                v-for="it in col.items"
                :key="it.id"
                type="button"
                class="op-kcard"
                :class="toneClass(it.tone)"
                @click="pick(it)"
              >
                <span class="op-kcard__title">{{ it.title }}</span>
                <span v-if="it.sub" class="op-kcard__meta">{{ it.sub }}</span>
                <span v-if="it.badge" class="op-kcard__meta">{{ it.badge }}</span>
              </button>
              <div v-if="!col.items.length" class="op-empty" style="padding: 14px 8px">空</div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use "./_ops-kit.scss";

/* 控制栏里的输入框由页面通过 #filters 插槽塞进来，它们带的是页面的作用域，
   所以这里用 :slotted 兜住样式 —— 否则四个页面各抄一份 20 行的输入框样式。 */
:slotted(.op-input) {
  width: 190px;
  height: 26px;
  padding: 0 9px;
  font: inherit;
  font-size: 12px;
  color: var(--el-text-color-regular, #4a5162);
  background: var(--el-bg-color, #fff);
  border: 1px solid var(--el-border-color-light, #e3e6ef);
  border-radius: 6px;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}

:slotted(.op-input--sm) {
  width: 132px;
}

:slotted(.op-input:focus) {
  border-color: var(--el-color-primary, #6d5dfc);
  box-shadow: 0 0 0 2px var(--el-color-primary-light-8, rgba(109, 93, 252, 0.16));
}

:slotted(.op-input::placeholder) {
  color: var(--el-text-color-placeholder, #a8abb2);
}

/* 外壳自己渲染的输入框（filters 属性那条路径）不在插槽里，用普通选择器 */
.op-input {
  width: 190px;
  height: 26px;
  padding: 0 9px;
  font: inherit;
  font-size: 12px;
  color: var(--el-text-color-regular, #4a5162);
  background: var(--el-bg-color, #fff);
  border: 1px solid var(--el-border-color-light, #e3e6ef);
  border-radius: 6px;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.op-input:focus {
  border-color: var(--el-color-primary, #6d5dfc);
  box-shadow: 0 0 0 2px var(--el-color-primary-light-8, rgba(109, 93, 252, 0.16));
}

.op-input::placeholder {
  color: var(--el-text-color-placeholder, #a8abb2);
}
</style>
