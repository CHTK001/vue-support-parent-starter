<script setup lang="ts">
/**
 * 会话审计 —— 终端连接流水
 *
 * <p>这一页的数据形状是<b>区间</b>（连接 → 关闭），因此开放四个档位：</p>
 * <ul>
 *   <li><b>三栏指挥台</b>（默认）：分面栏筛协议/状态，中间密集列表，右侧常驻详情。
 *       审计最常做的事是「找到那一条、看它怎么结束的」，不该为了看一个关闭原因翻页。</li>
 *   <li><b>泳道时间墙</b>：一条泳道一台主机，横轴是连接时刻。回答「今天什么时候在连」。</li>
 *   <li><b>矩阵热力台</b>：主机 × 时段，回答「哪台机器在哪个时段被登得最多」。</li>
 *   <li><b>状态看板</b>：进行中 / 已结束两列，正在连的会话自己浮到最上面。</li>
 * </ul>
 *
 * <p>算的部分全在 {@link sessionView} 的纯函数里，页面只负责映射成外壳认的条目形状。
 * 四个档位因此显示同一个时长、同一个状态文案、同一套空值兜底。</p>
 *
 * @author CH
 * @since 4.0.0
 */
import { computed, onMounted, onUnmounted, reactive, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { message } from "@repo/core";
import OpsDesk from "../components/opsdesk/OpsDesk.vue";
import type { OpsFacetGroup, OpsFilterField, OpsItem, OpsMode, OpsModeMeta, OpsTone } from "../components/opsdesk/types";
import { closeSession, getSessions, queryHosts } from "../api";
import {
  EMPTY_SESSION_FILTERS,
  SESSION_BUCKET_HOURS,
  countByStatus,
  filterSessions,
  toSessionViews,
  type SessionFilters,
  type SessionRow,
  type SessionView,
} from "./session/sessionView";

/* ==================== 档位 ==================== */

const MODES: OpsModeMeta[] = [
  { id: "deck", label: "三栏指挥台", thesis: "分面栏 + 密集列表 + 常驻详情，选中即看完" },
  { id: "lanes", label: "泳道时间墙", thesis: "一台主机一条泳道，横轴是连接时刻" },
  { id: "matrix", label: "矩阵热力台", thesis: "主机 × 时段，哪台在哪个时段被登得最多" },
  { id: "kanban", label: "状态看板", thesis: "进行中 / 已结束两列，正在连的自己浮上来" },
];

/** 档位记忆键（按页持久化） */
const MODE_KEY = "ops-mode:server.session-audit";

/**
 * 读取已存档位。
 *
 * <p>存的旧值可能已不在开放集里（页面改版收窄档位），这里收敛而不是直接信任 ——
 * 否则会渲染一个不存在的档位，页面一片空白。</p>
 */
function readMode(): OpsMode {
  try {
    const raw = localStorage.getItem(MODE_KEY);
    return MODES.some(m => m.id === raw) ? (raw as OpsMode) : "deck";
  } catch {
    return "deck";
  }
}

const mode = ref<OpsMode>(readMode());
watch(mode, v => {
  try {
    localStorage.setItem(MODE_KEY, v);
  } catch { /* 无痕模式忽略 */ }
});

/** 嵌入模式：由工作区页签绑定主机（hostId 覆盖 route query 过滤） */
const props = defineProps<{ hostId?: number }>();

/* ==================== 数据 ==================== */

/** 会话列表（后端原样） */
const sessions = ref<SessionRow[]>([]);

/** 加载态 */
const loading = ref(false);

/** 错误文案 */
const error = ref("");

/** 主机台账：id → 主机名；后端没填主机名时兜底 */
const hostMap = ref<Record<number, string>>({});

/** 筛选条件：唯一状态源，四个档位共用 */
const filters = reactive<SessionFilters>({ ...EMPTY_SESSION_FILTERS });

/** 当前时刻：让「进行中」的时长跟着走 */
const now = ref(new Date());

const route = useRoute();

/* ==================== 派生 ==================== */

/** 全量统计（页签数字口径，不随筛选缩） */
const stats = computed(() => countByStatus(sessions.value));

/** 已筛选的展示行 */
const views = computed(() =>
  toSessionViews(filterSessions(sessions.value, filters, hostMap.value), hostMap.value, now.value),
);

/** 页签 */
const tabs = computed(() => [
  { label: "全部", value: "", count: stats.value.total },
  { label: "进行中", value: "OPEN", count: stats.value.open },
  { label: "已结束", value: "CLOSED", count: stats.value.closed },
]);

/** 控制栏筛选项 */
const FILTER_FIELDS: OpsFilterField[] = [
  { key: "keyword", kind: "search", placeholder: "搜索主机 / 用户", width: 190 },
  { key: "ip", kind: "search", placeholder: "客户端 IP", width: 132 },
];

/** 控制栏筛选模型 */
const filterModel = computed<Record<string, string>>(() => ({
  keyword: filters.keyword,
  ip: filters.ip,
}));

/** 今日 0 点的时间戳：把「当天的第几小时」还原成绝对时刻，泳道与矩阵都要它 */
function startOfToday(): number {
  const d = now.value;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/**
 * 协议 → 泳道色档。
 *
 * <p>会话审计的 89 条里绝大多数是已结束，若泳道按状态上色，整面墙一片灰，
 * 读不出任何信息。按协议上色之后，「这台机器今天在用什么方式被登」才成立。</p>
 *
 * @param protocol 协议代码
 */
function protocolTone(protocol: string): OpsTone {
  switch (protocol.toUpperCase()) {
    case "SSH":
      return "info";
    case "RDP":
      return "warn";
    case "VNC":
      return "brand";
    default:
      return "mute";
  }
}

/**
 * 展示行 → 外壳条目。
 *
 * <p>「进行中」用 ok 色（绿）而不是警告色：这是正常状态，用黄会让人以为出了问题。
 * 已结束用 mute，关闭原因放进副标题 —— 审计要看的正是「为什么结束」。</p>
 *
 * @param v 展示行
 */
function toItem(v: SessionView): OpsItem {
  const dayStart = startOfToday();
  return {
    id: v.id,
    title: v.host,
    sub: v.closeReason ? `${v.user} · ${v.closeReason}` : `${v.user} · ${v.ip}`,
    tone: v.isOpen ? "ok" : "mute",
    blockTone: protocolTone(v.protocol),
    statusText: v.statusText,
    badge: v.protocol,
    column: v.isOpen ? "open" : "closed",
    lane: v.host,
    startMs: v.startHour === null ? null : dayStart + v.startHour * 3_600_000,
    endMs: v.endHour === null ? null : dayStart + v.endHour * 3_600_000,
    startText: v.connectText,
    endText: v.isOpen ? "进行中" : v.closeText,
    durationText: v.durationText,
    meta: [
      { label: "主机", value: v.host },
      { label: "协议", value: v.protocol },
      { label: "用户", value: v.user },
      { label: "客户端", value: v.ip },
      { label: "连接", value: v.connectText },
      { label: "关闭", value: v.isOpen ? "进行中" : v.closeText },
      { label: "时长", value: v.durationText },
      { label: "状态", value: v.statusText },
      { label: "原因", value: v.closeReason || "未记录" },
    ],
    searchText: `${v.host} ${v.user} ${v.ip} ${v.protocol} ${v.closeReason}`,
  };
}

/** 条目 */
const items = computed<OpsItem[]>(() => views.value.map(toItem));

/* ==================== 分面栏 ==================== */

/**
 * 分面栏：状态 + 协议。
 *
 * <p>计数一律用全量口径（不受自身筛选影响），否则点进「SSH」后其它协议的
 * 数字全变 0，用户再也点不回去。</p>
 */
const facets = computed<OpsFacetGroup[]>(() => {
  const all = toSessionViews(sessions.value, hostMap.value, now.value);
  const protocolCount = (code: string): number =>
    all.filter(v => v.protocol.toUpperCase() === code).length;
  return [
    {
      key: "status",
      label: "状态",
      options: [
        { value: "", label: "全部", count: all.length },
        { value: "OPEN", label: "进行中", count: stats.value.open, tone: "ok" as OpsTone },
        { value: "CLOSED", label: "已结束", count: stats.value.closed, tone: "mute" as OpsTone },
      ],
    },
    {
      key: "protocol",
      label: "协议",
      options: [
        { value: "", label: "全部协议", count: all.length },
        { value: "SSH", label: "SSH", count: protocolCount("SSH"), tone: "info" as OpsTone },
        { value: "RDP", label: "RDP", count: protocolCount("RDP"), tone: "warn" as OpsTone },
        { value: "VNC", label: "VNC", count: protocolCount("VNC"), tone: "brand" as OpsTone },
      ],
    },
  ];
});

/** 分面模型：status 与 filters.status 同一个字段，避免两套状态 */
const facetModel = computed<Record<string, string>>(() => ({
  status: filters.status,
  protocol: filters.protocol,
}));

/** 看板列 */
const columns = [
  { key: "open", label: "进行中", tone: "ok" as OpsTone },
  { key: "closed", label: "已结束", tone: "mute" as OpsTone },
];

/* ==================== 交互 ==================== */

/**
 * 分面筛选变化。
 *
 * @param key   字段（status / protocol）
 * @param value 值
 */
function onFacet(key: string, value: string): void {
  if (key === "status") filters.status = value as SessionFilters["status"];
  else if (key === "protocol") filters.protocol = value;
}

/**
 * 状态分段切换。
 *
 * @param value 状态代码
 */
function onTab(value: string): void {
  filters.status = value as SessionFilters["status"];
}

/**
 * 控制栏筛选变化。
 *
 * @param key   字段
 * @param value 值
 */
function onFilterField(key: string, value: string): void {
  if (key === "keyword") filters.keyword = value;
  else if (key === "ip") filters.ip = value;
}

/**
 * 矩阵格子点击：按「主机 + 时段」筛选。
 *
 * <p>矩阵只给得出主机名与时段起点，无法表达「主机 id + 时段」这个组合条件，
 * 所以这里退化成「按主机名 + 时段」两个条件同时生效 —— 效果与用户点格子时的
 * 预期一致（那一格里的记录）。</p>
 *
 * @param lane     主机名
 * @param fromHour 时段起点小时
 */
function onCell(lane: string, fromHour: number): void {
  filters.keyword = lane;
  filters.hourBucket = fromHour;
  message.info(`已按「${lane}」+ ${String(fromHour).padStart(2, "0")}:00 时段筛选`);
}

/** 清除全部条件 */
function clearFilters(): void {
  Object.assign(filters, EMPTY_SESSION_FILTERS);
}

/** 刷新会话记录 */
async function refresh(): Promise<void> {
  loading.value = true;
  error.value = "";
  try {
    const audit = await getSessions();
    sessions.value = audit ?? [];
    now.value = new Date();
  } catch (e) {
    error.value = (e as Error).message;
  } finally {
    loading.value = false;
  }
}

/**
 * 强制关闭会话。
 *
 * @param item 条目
 */
async function onForceClose(item: OpsItem): Promise<void> {
  try {
    await message.confirm(`确认强制关闭「${item.title}」的会话？`, "强制关闭");
  } catch {
    return;
  }
  try {
    await closeSession(Number(item.id));
    message.success("已关闭");
    await refresh();
  } catch (e) {
    message.error((e as Error).message);
  }
}

/**
 * 时钟：30 秒一跳。
 *
 * <p>进行中会话的时长与泳道上的「现在」都在动，常驻一个 30 秒定时器的成本
 * 远低于「有没有开着的会话」这个判断本身。</p>
 */
let clock: ReturnType<typeof setInterval> | null = null;

onMounted(async () => {
  const hosts = await queryHosts().catch(() => []);
  for (const h of hosts ?? []) hostMap.value[h.id] = h.serverHostName;
  // 从主机资产右键「运维台 → 会话审计」进来时带 hostId，落地就聚焦这台机器
  const hostId = Number(props.hostId ?? 0) || Number(route.query.hostId ?? 0);
  if (hostId) {
    const name = hostMap.value[hostId];
    if (name) filters.keyword = name;
  }
  await refresh();
  clock = setInterval(() => {
    now.value = new Date();
  }, 30_000);
});

onUnmounted(() => {
  if (clock) clearInterval(clock);
  clock = null;
});
</script>

<template>
  <OpsDesk
    v-model:mode="mode"
    title="会话审计"
    desc="终端连接流水：谁在什么时候登过哪台主机、开了多久、怎么结束的。"
    :modes="MODES"
    :items="items"
    :facets="facets"
    :facet-model="facetModel"
    :tabs="tabs"
    :tab-value="filters.status"
    :filters="FILTER_FIELDS"
    :filter-model="filterModel"
    :columns="columns"
    lane-label="主机"
    :count-text="items.length === stats.total ? `共 ${stats.total} 条会话` : `筛选出 ${items.length} / ${stats.total} 条`"
    :loading="loading"
    :error="error"
    empty-text="还没有会话记录"
    empty-hint="终端连接过之后，这里会按连接时刻列出。"
    :matrix-buckets="Math.round(24 / SESSION_BUCKET_HOURS)"
    @update:tab-value="onTab"
    @facet="onFacet"
    @filter="onFilterField"
    @cell="onCell"
    @refresh="refresh"
  >
    <template #actions>
      <button
        v-if="filters.hourBucket !== null"
        type="button"
        class="op-btn"
        title="清除时段条件"
        @click="filters.hourBucket = null"
      >
        时段 {{ String(filters.hourBucket).padStart(2, "0") }}:00 ×
      </button>
      <button
        v-if="filters.keyword || filters.protocol || filters.status || filters.ip"
        type="button"
        class="op-btn"
        @click="clearFilters"
      >
        清除筛选
      </button>
    </template>

    <template #detail="{ item }">
      <button
        v-if="item.column === 'open'"
        type="button"
        class="op-btn is-bad"
        @click="onForceClose(item)"
      >
        强制关闭
      </button>
      <span class="op-dim" style="font-size: 11px">会话 #{{ item.id }}</span>
    </template>
  </OpsDesk>
</template>
