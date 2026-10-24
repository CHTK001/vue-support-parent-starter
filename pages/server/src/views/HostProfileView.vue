<script setup lang="ts">
/**
 * 主机画像 —— master-detail 布局（数据全部来自目标机 Agent）
 * 左侧：主机列表（OS 图标 + 名称 + 地址 + 在线状态），点选切换
 * 右侧：概览条 + 资源仪表 + 分段区（概览 / 监听端口 / 进程 / 服务 / 磁盘 / 网络 / 环境变量）
 *
 * 约定：
 *  - 每一项远端数据都经 /ms/monitor/host/profile/** 由后端转发到主机上的 Agent，页面不再自己走 SSH/WinRM；
 *  - Agent 不可达时必须把原因显式呈现在页面上，不能留一片空白让人以为「这台机器没数据」。
 * @author CH
 * @since 4.0.0
 */
import { message } from "@repo/core";
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import { ElMessageBox } from "element-plus";
import {
  closeNetProcess,
  deleteHostEnvVar,
  fetchHostProfile,
  fetchHostProfileSection,
  killProcess,
  restartHostProcess,
  restartService,
  setHostEnvVar,
  startService,
  stopService,
} from "../api";
import { osIconSvg } from "../utils/osIcon";
import { processGlyph } from "../utils/processIcon";
import { processBrandIcon } from "../utils/processBrand";
import * as echarts from "echarts";
import HostFileManager from "../components/HostFileManager.vue";
import HostNetworkAdapters from "../components/HostNetworkAdapters.vue";
import type { Host, Group } from "./AssetsView.vue";
import ReDialog from "@repo/ui/re-dialog";

interface Props {
  hosts: Host[];
  groups: Group[];
  /** 实时延迟（hostId → delayMs） */
  liveDelay?: Record<number, number>;
  /** 实时在线（hostId → 1/0） */
  liveOnline?: Record<number, number>;
  /** 打开画像时预选主机 */
  initialHostId?: number | null;
  /** 打开画像时预选分区 */
  initialTab?: string | null;
  /** 父组件每打开一次画像自增，保证重复打开同一台主机也会重新定位刷新 */
  openSeq?: number;
  /**
   * 嵌入模式：作为多标签工作区的一个页签内容渲染。
   *
   * <p>嵌入时左侧主机列表由工作区外壳统一提供，这里只渲染右侧详情区，
   * 并隐藏「刷新主机 / 连接 / 监控 / 编辑」等跨页动作（它们已在主机右键菜单里）。
   * 非嵌入时保持原有 master-detail 完整布局，宿主老入口不受影响。</p>
   */
  embedded?: boolean;
  /**
   * 嵌入模式下锁定查看的主机。
   *
   * <p>工作区里每个页签都绑定一台主机，主机由页签自身持有；此时组件内的
   * 选中逻辑退化为只读，避免同一个页签里再切出第二台主机造成语义混乱。</p>
   */
  hostId?: number | null;
  /**
   * 嵌入模式下只渲染指定分区（画像被拆成「端口 / 进程 / 服务 / 磁盘 / 网络 /
   * 环境变量 / 防火墙」各自独立的页签，一个页签只负责一个分区）。
   */
  section?: string | null;
}
const props = withDefaults(defineProps<Props>(), {
  liveDelay: () => ({}),
  liveOnline: () => ({}),
  initialHostId: null,
  initialTab: null,
  openSeq: 0,
  embedded: false,
  hostId: null,
  section: null,
});

const emit = defineEmits<{
  (e: "connect", host: Host): void;
  (e: "edit", host: Host): void;
  (e: "detail", host: Host): void;
  (e: "deploy-agent", host: Host): void;
  (e: "refreshed"): void;
}>();

/** 画像分区（概要信息已移到左侧，右侧只保留明细分区，默认磁盘） */
type SectionKey = "ports" | "processes" | "services" | "disks" | "network" | "env" | "firewall";

/** 分区定义（各分区走对应采集端点） */
const sections: Array<{ name: SectionKey; label: string }> = [
  { name: "ports", label: "监听端口" },
  { name: "processes", label: "进程" },
  { name: "services", label: "服务" },
  { name: "disks", label: "磁盘" },
  { name: "network", label: "网络" },
  { name: "env", label: "环境变量" },
  { name: "firewall", label: "防火墙" },
];

/** 各分区的列定义 */
const COLUMNS: Record<SectionKey, Array<{ key: string; label: string; width?: string }>> = {
  ports: [
    { key: "protocol", label: "协议", width: "72px" },
    { key: "local", label: "监听地址", width: "170px" },
    { key: "port", label: "端口", width: "88px" },
    { key: "state", label: "状态", width: "120px" },
    { key: "pid", label: "PID", width: "88px" },
    { key: "process", label: "进程" },
  ],
  processes: [
    { key: "pid", label: "PID", width: "88px" },
    { key: "name", label: "进程名", width: "220px" },
    { key: "cpu", label: "CPU%", width: "88px" },
    { key: "memory", label: "内存(MB)", width: "110px" },
    { key: "threads", label: "线程", width: "88px" },
    { key: "command", label: "命令行" },
  ],
  services: [
    { key: "name", label: "服务名", width: "280px" },
    { key: "displayName", label: "显示名", width: "240px" },
    { key: "state", label: "状态", width: "140px" },
    { key: "startType", label: "启动类型", width: "120px" },
    { key: "pid", label: "PID", width: "100px" },
  ],
  disks: [
    { key: "mount", label: "挂载点", width: "170px" },
    { key: "name", label: "名称", width: "200px" },
    { key: "fsType", label: "类型", width: "110px" },
    { key: "totalGb", label: "容量(GB)", width: "110px" },
    { key: "usedGb", label: "已用(GB)", width: "110px" },
    { key: "availGb", label: "可用(GB)", width: "110px" },
    { key: "usage", label: "使用率%", width: "96px" },
  ],
  network: [
    { key: "name", label: "网卡", width: "150px" },
    { key: "status", label: "状态", width: "110px" },
    { key: "mac", label: "MAC", width: "170px" },
    { key: "ipv4", label: "IPv4" },
    { key: "ipv6", label: "IPv6" },
    { key: "mtu", label: "MTU", width: "90px" },
    { key: "speed", label: "速率", width: "110px" },
  ],
  env: [
    { key: "name", label: "变量", width: "260px" },
    { key: "value", label: "值" },
  ],
  firewall: [
    { key: "name", label: "规则名", width: "220px" },
    { key: "direction", label: "方向", width: "80px" },
    { key: "action", label: "动作", width: "80px" },
    { key: "protocol", label: "协议", width: "80px" },
    { key: "localPort", label: "端口", width: "88px" },
    { key: "profile", label: "配置", width: "120px" },
    { key: "chain", label: "链", width: "80px" },
  ],
};

/** 自动刷新周期（毫秒） */
const AUTO_REFRESH_MILLIS = 10000;

/** 左侧选中的主机 id */
const selectedId = ref<number | null>(props.embedded ? (props.hostId ?? null) : null);
/** 左侧视图：主机列表 / 选中主机的概要（嵌入模式下不渲染左侧，始终视为概要视图） */
const railView = ref<"list" | "summary">(props.embedded ? "summary" : "list");
function backToList(): void {
  railView.value = "list";
}
/** 左侧搜索关键词 */
const search = ref("");
/** 当前分区（嵌入模式下由页签固定，一个页签只承载一个分区） */
const active = ref<SectionKey>(props.embedded ? (mapTab(props.section) ?? "disks") : "disks");
/** 分页（仅进程/服务生效） */
const page = ref(1);
const pageSize = ref(10);
/** 进程/服务的检索关键字：后端跨页匹配 PID/名称/用户/命令行 */
const sectionKeyword = ref("");
/** 后端返回当前分区过滤后总行数（分页分区为 total，非分页分区为 rows.length） */
const sectionTotal = ref(0);
/** 后端是否因达到采集上限而截断（仅分页分区） */
const sectionTruncated = ref(false);

/** 进程/服务表头排序状态（key=列名，dir=asc/desc，null=不排序） */
const sortState = ref<{ key: string; dir: "asc" | "desc" } | null>(null);

/** 页码与关键字是同一套定位状态，切换主机/分区时必须一起归零 */
function resetPager(): void {
  page.value = 1;
  sectionKeyword.value = "";
  sortState.value = null;
  sectionTotal.value = 0;
  sectionTruncated.value = false;
}

/** 提交一次检索：回到第一页重新拉取 */
function applyKeyword(): void {
  page.value = 1;
  loadSection();
}

const info = ref<Record<string, any>>({});
const metrics = ref<Record<string, any>>({});
const snapshot = ref<Record<string, any>>({});
/**
 * 左侧概要的持久化快照：只在「手动刷新」或切换到新主机时更新，
 * 周期性自动刷新不覆盖（数据来源是主机表持久化列）。
 */
const persisted = ref<Record<string, any>>({});
const persistedHostId = ref<number | null>(null);
const agentPort = ref(0);
const osMismatch = ref("");
const rows = ref<Record<string, any>[]>([]);

const loadingProfile = ref(false);
const loadingSection = ref(false);
const profileError = ref("");
const sectionError = ref("");
const autoRefresh = ref(false);
let timer: number | undefined;
/** 异步加载请求代次：切换主机 / 分区 / 重开时 +1，迟到的旧响应据此丢弃，避免慢通道覆盖新数据 */
let profileReq = 0;
let sectionReq = 0;
/**
 * 嵌入模式是否已完成首次加载。
 *
 * <p>不能用「selectedId 与 props.hostId 是否相等」当触发条件：嵌入时 selectedId 的初值
 * 就是 props.hostId，两者天然相等，只判变化会让页签打开后一次请求都不发。</p>
 */
let embeddedLoaded = false;

const selectedHost = computed(() => props.hosts.find(h => h.id === selectedId.value) ?? null);
const agentReady = computed(() =>
  String(info.value.agentVersion || "").trim() !== ""
  || Number(snapshot.value.serverHostAgentInstalled ?? 0) === 1);
const agentVersion = computed(() => String(info.value.agentVersion || snapshot.value.serverHostAgentVersion || ""));
const isAgentMode = computed(() =>
  String(selectedHost.value?.serverHostCollectMode ?? "").toUpperCase() === "AGENT");
/** 当前分区的列定义 */
const columns = computed(() => COLUMNS[active.value] ?? []);
/** 监听端口 / 进程 / 服务 / 环境变量 分区带写动作 */
const hasActions = computed(() =>
  active.value === "ports" || active.value === "processes" || active.value === "services"
  || active.value === "env");
/** 进程 / 服务 / 监听端口 均由后端分页（后台只返回当前页） */
const pagedSection = computed(() =>
  active.value === "processes" || active.value === "services"
  || active.value === "ports" || active.value === "firewall");

/** 各分区检索框的命中字段提示 */
const KEYWORD_HINTS: Record<string, string> = {
  processes: "PID / 进程名 / 用户 / 命令行",
  services: "服务名 / 显示名 / 状态",
  ports: "端口 / 地址 / 状态 / 进程名",
  disks: "盘符 / 卷标 / 文件系统",
  firewall: "规则名 / 链 / 方向 / 动作 / 协议 / 端口"
};
const keywordPlaceholder = computed(() => KEYWORD_HINTS[active.value] ?? "关键字过滤");

/** 后端不分页的分区在前端过滤：任一字段的值命中关键字即保留 */
const visibleRows = computed(() => {
  const kw = sectionKeyword.value.trim().toLowerCase();
  if (!kw || pagedSection.value) return rows.value;
  return rows.value.filter(r => Object.values(r).some(v =>
    v !== null && v !== undefined && String(v).toLowerCase().includes(kw)));
});

/** 已标记 sortable 的列在前端排序：数值列按数值大小，其余按 localeCompare */
const tableRows = computed(() => {
  const s = sortState.value;
  const base = visibleRows.value;
  if (!s) return base;
  const key = s.key;
  const dir = s.dir === "asc" ? 1 : -1;
  return [...base].sort((a, b) => {
    const av = a?.[key], bv = b?.[key];
    if (av == null || av === "") return dir;
    if (bv == null || bv === "") return -dir;
    const an = Number(av), bn = Number(bv);
    if (!Number.isNaN(an) && !Number.isNaN(bn) && typeof av !== "string") return (an - bn) * dir;
    return String(av).localeCompare(String(bv), "zh-Hans-CN") * dir;
  });
});

/** 当前分区可排序的列（服务 cpu/内存恒不采集，仅 PID 有意义） */
function sortableColumns(): string[] {
  if (active.value === "processes") return ["pid", "cpu", "memory"];
  if (active.value === "services") return ["pid"];
  if (active.value === "firewall") return ["name", "direction", "action"];
  return [];
}
function isSortable(key: string): boolean {
  return sortableColumns().includes(key);
}
/** 点击表头切换排序：未排→降序→升序→取消 */
function onHeaderSort(key: string): void {
  const cur = sortState.value;
  if (!cur || cur.key !== key) {
    sortState.value = { key, dir: "desc" };
  } else if (cur.dir === "desc") {
    sortState.value = { key, dir: "asc" };
  } else {
    sortState.value = null;
  }
}

const visibleHosts = computed(() => {
  const kw = search.value.toLowerCase();
  if (!kw) return props.hosts;
  return props.hosts.filter(h =>
    h.serverHostName.toLowerCase().includes(kw) || h.serverHostAddress.toLowerCase().includes(kw));
});

/* ================== 选择与切换 ================== */

function selectHost(id: number): void {
  if (selectedId.value === id) {
    railView.value = "summary";
    return;
  }
  selectedId.value = id;
  railView.value = "summary";
  rows.value = [];
  sectionError.value = "";
  resetPager();
  // 切机属于「进入」：只读台账快照，不触发实时采集
  loadProfile();
  loadSection();
}

function pickSection(name: SectionKey): void {
  active.value = name;
  resetPager();
  sortState.value = null;
  // 切换分区先清空旧行，避免新分区拉取期间仍展示上一个分区的行
  rows.value = [];
  loadSection();
}

watch(visibleHosts, (list) => {
  if (!list.length) return;
  // 嵌入模式：主机由所属页签固定，列表变化不得改写选中项（否则一台主机开多个页签会互相抢选中）
  if (props.embedded) {
    // 不能只判断「选中项变没变」：selectedId 初值就等于 props.hostId，
    // 首次挂载时两者相等，只按变化判断会导致页签打开后一次请求都不发（空表）。
    if (props.hostId != null && (!embeddedLoaded || selectedId.value !== props.hostId)) {
      selectedId.value = props.hostId;
      rows.value = [];
      sectionError.value = "";
      resetPager();
      embeddedLoaded = true;
      loadProfile();
      loadSection();
    }
    return;
  }
  // 抽屉懒挂载时 openSeq/initialHostId 的初值不会触发下方非即时 watcher，这里优先定位父组件指定主机
  const requested = props.initialHostId;
  if (requested != null && list.some(h => h.id === requested)) {
    if (selectedId.value !== requested) focusRequested();
    return;
  }
  if (!list.some(h => h.id === selectedId.value)) {
    selectHost(list[0].id);
  }
}, { immediate: true });

watch([() => props.openSeq, () => props.initialHostId], () => {
  if (!props.embedded) focusRequested();
});

/** 嵌入模式：父级切换锁定主机 / 分区时重新加载 */
watch([() => props.hostId, () => props.section], ([hid, sec]) => {
  if (!props.embedded) return;
  if (hid == null) return;
  const next = mapTab(sec) ?? active.value;
  const hostChanged = selectedId.value !== hid;
  const sectionChanged = active.value !== next;
  if (!hostChanged && !sectionChanged) return;
  selectedId.value = hid;
  active.value = next;
  if (hostChanged) {
    rows.value = [];
    sectionError.value = "";
  }
  resetPager();
  loadProfile();
  loadSection();
});

/** 父组件请求定位到某台主机（重复打开同一台也要重新拉数据） */
function focusRequested(): void {
  const id = props.initialHostId;
  if (id == null || !props.hosts.some(h => h.id === id)) return;
  const target = mapTab(props.initialTab) ?? "disks";
  selectedId.value = id;
  railView.value = "summary";
  active.value = target;
  resetPager();
  rows.value = [];
  sectionError.value = "";
  loadProfile();
  loadSection();
  if (autoRefresh.value && !timer) restartTimer();
}

/** 兼容旧入口传来的分区名（原「系统管理」那套 key） */
function mapTab(tab?: string | null): SectionKey | null {
  if (!tab) return null;
  const key = tab.trim().toLowerCase();
  if (key.startsWith("network-interface") || key.startsWith("network-connection")) return "network";
  if (key === "partition" || key === "disk") return "disks";
  if (key === "process") return "processes";
  if (key === "service" || key === "system-service") return "services";
  if (key === "online" || key === "delay" || key === "metric") return "disks";
  return sections.some(s => s.name === key) ? (key as SectionKey) : "disks";
}

/* ================== 数据加载 ================== */

/**
 * 拉取概览与实时指标。
 *
 * @param manual 是否用户主动刷新（只有主动刷新才回通知父组件重载列表，避免自动刷新把整表反复拉下来）
 */
async function loadProfile(manual = false): Promise<void> {
  const host = selectedHost.value;
  if (!host) return;
  const req = ++profileReq;
  const hid = host.id;
  // 切换到新主机时先清空旧快照（含左侧持久化概要），避免 SSH 慢加载（含重连重试）期间仍展示上一台数据
  if (persistedHostId.value !== hid) {
    info.value = {};
    metrics.value = {};
    snapshot.value = {};
    persisted.value = {};
  }
  loadingProfile.value = true;
  profileError.value = "";
  try {
    // 进入/切机（manual=false）只读台账快照；只有「刷新主机」（manual=true）才实时采集并回写
    const data = await fetchHostProfile(hid, { live: manual, persist: true });
    // 期间已切到别的主机 / 重开：丢弃这份迟到响应，避免覆盖新主机数据
    if (req !== profileReq || selectedId.value !== hid) return;
    info.value = data?.info ?? {};
    metrics.value = data?.metrics ?? {};
    snapshot.value = data?.host ?? {};
    // 概要只在手动刷新或切换到新主机时更新，周期自动刷新不覆盖
    if (manual || persistedHostId.value !== hid) {
      persisted.value = (data?.host ?? {}) as Record<string, any>;
      persistedHostId.value = hid;
    }
    agentPort.value = Number(data?.port) || 0;
    osMismatch.value = data?.osMismatch ?? "";
    if (manual) emit("refreshed");
  } catch (e) {
    if (req !== profileReq || selectedId.value !== hid) return;
    profileError.value = String((e as Error)?.message ?? e);
    info.value = {};
    metrics.value = {};
  } finally {
    if (req === profileReq) loadingProfile.value = false;
  }
}

async function loadSection(): Promise<void> {
  const host = selectedHost.value;
  if (!host) return;
  const req = ++sectionReq;
  const hid = host.id;
  const sec = active.value;
  loadingSection.value = true;
  sectionError.value = "";
  try {
    // 分页分区传 page/size；后端返回 SectionPage（含 total），非分页分区返回数组
    const paged = sec === "processes" || sec === "services" || sec === "ports" || sec === "firewall";
    const res = await fetchHostProfileSection(hid, sec,
      paged ? page.value : undefined, paged ? pageSize.value : undefined,
      paged ? sectionKeyword.value.trim() : undefined);
    // 期间已切主机 / 分区 / 翻页 / 重开：丢弃这份迟到响应
    if (req !== sectionReq || selectedId.value !== hid || active.value !== sec) return;
    // 兼容两种返回：新后端为 { rows, total, truncated }，旧后端为裸数组
    const arr = Array.isArray(res) ? res : (Array.isArray(res?.rows) ? res.rows : []);
    rows.value = arr;
    sectionTotal.value = Array.isArray(res) ? arr.length
      : (typeof res.total === "number" ? res.total : arr.length);
    sectionTruncated.value = !Array.isArray(res) && !!res.truncated;
    // total 比页码小时回退到最后一页，避免显示“空页”
    if (paged && page.value > 1 && pageSize.value * (page.value - 1) >= sectionTotal.value) {
      page.value = Math.max(1, Math.ceil(sectionTotal.value / pageSize.value));
    }
  } catch (e) {
    if (req !== sectionReq || selectedId.value !== hid || active.value !== sec) return;
    // 同分区刷新失败时保留已渲染行（rows 已在切换分区/主机时被清空），
    // 避免通道瞬时抖动把已展示的端口/进程清空成一片空白
    sectionError.value = String((e as Error)?.message ?? e);
  } finally {
    if (req === sectionReq) loadingSection.value = false;
  }
}

/** IPv4 配置下发后：重新采集并刷新概要与网卡列表 */
function onNetworkApplied(): void {
  loadProfile(true);
  loadSection();
}
function changePage(delta: number): void {
  const next = page.value + delta;
  if (next < 1) return;
  page.value = next;
  loadSection();
}

/* ================== 分区动作 ================== */

/** 正在执行动作的行键，用于禁用同行按钮（同一时刻只允许一个远端写操作） */
const busyRow = ref("");

/** 当前主机 ID：动作端点据此路由通道，undefined 表示管控机本机 */
function actionHostId(): number | undefined {
  const id = selectedHost.value?.id;
  return typeof id === "number" ? id : undefined;
}

/**
 * 执行一次远端写操作：成功回显后端文案并重拉分区；失败提示由传输层统一负责，这里只返回 false。
 *
 * @param key  行键，用于 loading
 * @param task 后端调用
 * @returns 是否成功
 */
async function runAction(key: string, task: Promise<string>): Promise<boolean> {
  busyRow.value = key;
  try {
    const msg = await task;
    message.success(String(msg || "操作已完成"));
    await loadSection();
    return true;
  } catch {
    // 传输层已按后端 msg 弹过一次提示，这里再弹就是同义重复
    return false;
  } finally {
    busyRow.value = "";
  }
}

/**
 * 破坏性动作前的确认。用户取消返回 false。
 *
 * @param message 确认文案
 * @returns 是否继续
 */
async function confirmAction(message: string): Promise<boolean> {
  try {
    await ElMessageBox.confirm(message, "操作确认", {
      type: "warning", confirmButtonText: "确定", cancelButtonText: "取消",
    });
    return true;
  } catch {
    return false;
  }
}

/** 结束进程 */
async function onKillProcess(row: Record<string, any>): Promise<void> {
  if (!await confirmAction(`确定结束进程 ${row.name ?? ""}（PID ${row.pid}）？该操作不可恢复。`)) return;
  await runAction(`kill-${row.pid}`, killProcess(Number(row.pid), actionHostId()));
}

/** 重启进程（后端读取原命令行与工作目录后重新拉起） */
async function onRestartProcess(row: Record<string, any>): Promise<void> {
  if (!await confirmAction(`确定重启进程 ${row.name ?? ""}（PID ${row.pid}）？`)) return;
  await runAction(`restart-${row.pid}`, restartHostProcess(Number(row.pid), actionHostId()));
}

/** 服务是否处于未运行态（决定给「启动」还是「停止/重启」） */
function isStoppedService(row: Record<string, any>): boolean {
  const s = String(row.state ?? "").trim().toLowerCase();
  return !s || s === "stopped" || s === "inactive" || s === "failed" || s === "unknown";
}

/** 服务启停 */
async function onServiceAction(row: Record<string, any>, action: "start" | "stop" | "restart"): Promise<void> {
  const label = action === "start" ? "启动" : action === "stop" ? "停止" : "重启";
  if (action !== "start" && !await confirmAction(`确定${label}服务 ${row.displayName || row.name}？`)) return;
  const call = action === "start" ? startService : action === "stop" ? stopService : restartService;
  await runAction(`service-${action}-${row.name}`, call(String(row.name), actionHostId()));
}

/** 关闭占用端口的进程 */
async function onClosePortProcess(row: Record<string, any>): Promise<void> {
  if (!await confirmAction(`确定结束 PID ${row.pid}？它正占用 ${row.protocol ?? ""} ${row.port}。`)) return;
  await runAction(`netproc-${row.pid}-${row.port}`,
    closeNetProcess(Number(row.pid), Number(row.port) || undefined, actionHostId()));
}

/* ================== 环境变量 增删 ================== */

/** 环境变量新增弹窗 */
const envDialog = ref(false);
const envForm = ref<{ name: string; value: string }>({ name: "", value: "" });

function openEnvDialog(): void {
  envForm.value = { name: "", value: "" };
  envDialog.value = true;
}
/** 提交环境变量 */
async function submitEnv(): Promise<void> {
  const name = envForm.value.name.trim();
  if (!name) { message.warning("请填写变量名"); return; }
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) {
    message.warning("变量名只能包含字母、数字、下划线，且不能以数字开头"); return;
  }
  const hid = actionHostId();
  if (hid == null) return;
  const ok = await runAction(`env-set-${name}`,
    setHostEnvVar(hid, name, envForm.value.value));
  if (ok) envDialog.value = false;
}
/** 删除环境变量 */
async function onDeleteEnv(row: Record<string, any>): Promise<void> {
  const name = String(row.name ?? "");
  if (!await confirmAction(`确定删除系统级环境变量 ${name}？`)) return;
  const hid = actionHostId();
  if (hid == null) return;
  await runAction(`env-del-${name}`, deleteHostEnvVar(hid, name));
}

/* ================== 进程内存分析（矩形树图） ================== */

const analyzeVisible = ref(false);
const treemapRef = ref<HTMLElement | null>(null);
let treemap: echarts.ECharts | null = null;
let resizeObserver: ResizeObserver | null = null;

/** 仅进程分区可分析；切换分区时 showAnalyze 变 false 自动销毁图表 */
const showAnalyze = computed(() => active.value === "processes" && analyzeVisible.value);

/** 读取 CSS 变量颜色（带兜底），矩形树图随主题着色，不硬编码 */
function themeColor(name: string, fallback: string): string {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

/** 矩形树图数据：当前页进程按内存(MB)，按占用分档着色（与进程行阈值口径接近） */
function treemapData(): Array<Record<string, any>> {
  const primary = themeColor("--el-color-primary", "#6d5dfc");
  const warning = themeColor("--el-color-warning", "#e6a23c");
  const danger = themeColor("--el-color-danger", "#e5534b");
  return tableRows.value
    .map(r => {
      const mem = Number(r.memory);
      const value = Number.isFinite(mem) && mem > 0 ? mem : 0;
      const color = value >= 500 ? danger : value >= 150 ? warning : primary;
      return { name: String(r.name ?? "?"), pid: Number(r.pid), value, itemStyle: { color } };
    })
    .filter(d => d.value > 0);
}

function buildTreemapOption(): echarts.EChartsOption {
  const border = themeColor("--el-bg-color", "#ffffff");
  const labelColor = themeColor("--el-color-white", "#ffffff");
  return {
    tooltip: {
      formatter: (p: any) => `${p.data.name}（PID ${p.data.pid}）<br/>内存：${p.value} MB`,
    },
    series: [
      {
        type: "treemap",
        roam: false,
        nodeClick: false,
        breadcrumb: { show: false },
        width: "100%",
        height: "100%",
        label: {
          show: true,
          color: labelColor,
          fontSize: 11,
          formatter: (p: any) => {
            const n = String(p.data.name ?? "");
            return n.length > 14 ? `${n.slice(0, 13)}…` : n;
          },
        },
        upperLabel: { show: false },
        itemStyle: { borderColor: border, borderWidth: 2, gapWidth: 2 },
        data: treemapData(),
      },
    ],
  };
}

function renderTreemap(): void {
  if (!treemapRef.value) return;
  if (!treemap) {
    treemap = echarts.init(treemapRef.value);
    resizeObserver = new ResizeObserver(() => treemap && treemap.resize());
    resizeObserver.observe(treemapRef.value);
  }
  treemap.setOption(buildTreemapOption(), true);
}

function toggleAnalyze(): void {
  analyzeVisible.value = !analyzeVisible.value;
}

watch(showAnalyze, async on => {
  if (on) {
    await nextTick();
    renderTreemap();
    // 分栏可能位于弹窗折叠下方，自动带入可视区，避免看起来「空白」
    await nextTick();
    treemapRef.value?.scrollIntoView({ block: "nearest" });
  } else {
    if (resizeObserver) { resizeObserver.disconnect(); resizeObserver = null; }
    if (treemap) { treemap.dispose(); treemap = null; }
  }
});

/* 进程数据刷新后同步矩形树图 */
watch(tableRows, () => {
  if (showAnalyze.value && treemap) treemap.setOption(buildTreemapOption(), true);
});

onBeforeUnmount(() => {
  if (resizeObserver) resizeObserver.disconnect();
  if (treemap) treemap.dispose();
});

/* ================== 自动刷新 ================== */

function restartTimer(): void {
  if (timer) {
    window.clearInterval(timer);
    timer = undefined;
  }
  if (!autoRefresh.value) return;
  timer = window.setInterval(() => {
    if (!selectedHost.value || document.hidden) return;
    loadProfile();
    loadSection();
  }, AUTO_REFRESH_MILLIS);
}
watch(autoRefresh, restartTimer);
watch(selectedId, () => { if (autoRefresh.value && !timer) restartTimer(); });
onBeforeUnmount(() => {
  if (timer) window.clearInterval(timer);
});

/* ================== 展示辅助 ================== */

/** 常见进程品牌色（关键字命中即取，未命中按名称哈希兜底色） */
const PROCESS_BRAND: Array<[RegExp, string]> = [
  [/java|javaw|corretto|graal/i, "#b07219"],
  [/chrome/i, "#4285f4"],
  [/msedge|^edge/i, "#0ea5e9"],
  [/firefox/i, "#e64a19"],
  [/feishu|lark/i, "#3370ff"],
  [/doubao/i, "#4f46e5"],
  [/powershell|pwsh|cmd|conhost|windowsterminal/i, "#2b6cb0"],
  [/nginx/i, "#2e9d54"],
  [/node|npm|pnpm|yarn/i, "#3c873a"],
  [/python|py/i, "#3776ab"],
  [/mysqld|mariadb/i, "#00758f"],
  [/redis/i, "#d82c20"],
  [/postgres/i, "#336791"],
  [/explorer/i, "#f0a020"],
  [/docker|containerd/i, "#0db7ed"],
  [/sshd|ssh/i, "#5f6b7a"],
  [/system|svchost|services|smss|csrss|wininit/i, "#7a869a"],
];
/** 名称 → 头像（首字母 + 品牌色） */
function logoOf(name: unknown): { letter: string; color: string } {
  const n = String(name ?? "");
  for (const [re, color] of PROCESS_BRAND) {
    if (re.test(n)) return { letter: n.charAt(0).toUpperCase() || "?", color };
  }
  let h = 0;
  for (let i = 0; i < n.length; i++) h = (h * 31 + n.charCodeAt(i)) >>> 0;
  return { letter: n.charAt(0).toUpperCase() || "?", color: `hsl(${h % 360} 48% 46%)` };
}
/** 服务头像：运行中取品牌色，已停止置灰 */
function serviceLogo(r: Record<string, any>): { letter: string; color: string } {
  const base = logoOf(r?.name);
  const running = String(r?.state ?? "").trim().toUpperCase() === "RUNNING";
  return running ? base : { letter: base.letter, color: "#b6bcc7" };
}

/**
 * 前置图标列的统一渲染：
 *  1) 进程 / 运行中的服务 命中官方品牌 → 彩色 Logo（衬白色块）；
 *  2) 否则回退到「品牌色块 + 单色线性图形」；
 *  3) 再否则「品牌色块 + 首字母」。已停止的服务不显示彩色 Logo。
 */
function leadTile(section: string, r: Record<string, any>) {
  const running = section === "services"
    ? String(r?.state ?? "").trim().toUpperCase() === "RUNNING" : true;
  const brand = running ? processBrandIcon(r?.name) : "";
  if (brand) return { brand, bg: "", glyph: "", letter: "" };
  const logo = section === "processes" ? logoOf(r?.name) : serviceLogo(r);
  return { brand: "", bg: logo.color, glyph: processGlyph(r?.name), letter: logo.letter };
}
/** 进程行阈值级别：CPU/内存超阈值整行变黄/红（Idle pid=0 排除） */
function procLevel(r: Record<string, any>): "" | "row-warn" | "row-danger" {
  if (Number(r?.pid) === 0) return "";
  const cpu = Number(r?.cpu) || 0;
  const mem = Number(r?.memory) || 0;
  if (cpu >= 85 || mem >= 4096) return "row-danger";
  if (cpu >= 50 || mem >= 1024) return "row-warn";
  return "";
}

/** 端口状态 → OPEN/CLOSED 标记：监听/运行中视为 OPEN（绿点），其余视为 CLOSED（红点），空值不标记 */
function portStatus(state: unknown): { open: boolean | null; text: string } {
  const raw = String(state ?? "").trim();
  const s = raw.toLowerCase();
  if (!s || s === "-" || s === "—") return { open: null, text: "" };
  const openWords = ["listen", "listening", "open", "running", "active", "established"];
  if (openWords.some(w => s === w || s.includes(w))) return { open: true, text: "OPEN" };
  return { open: false, text: "CLOSED" };
}

/** 服务/端口状态 → 图标（颜色 + 小图形），原始状态词交给 el-tooltip 展示 */
function stateMeta(state: unknown): { svg: string; tip: string } {
  const raw = String(state ?? "").trim();
  const s = raw.toLowerCase();
  let kind = "square";
  let c = "var(--el-text-color-secondary)";
  if (s === "running" || s === "active" || s === "listen" || s === "listening") {
    kind = "dot"; c = "var(--el-color-success)";
  } else if (s === "failed" || s === "error") {
    kind = "warn"; c = "var(--el-color-danger)";
  } else if (s === "stopped" || s === "inactive" || s === "dead" || s === "paused") {
    kind = "square"; c = "var(--el-text-color-secondary)";
  } else if (s.includes("pending") || s === "activating" || s === "deactivating") {
    kind = "dot"; c = "var(--el-color-warning)";
  } else if (s === "unconn") {
    kind = "hollow"; c = "var(--el-text-color-secondary)";
  }
  const shapes: Record<string, string> = {
    dot: '<circle cx="8" cy="8" r="4.4" fill="currentColor"/>',
    hollow: '<circle cx="8" cy="8" r="4.4" fill="none" stroke="currentColor" stroke-width="1.7"/>',
    square: '<rect x="3.6" y="3.6" width="8.8" height="8.8" rx="2" fill="currentColor"/>',
    warn: '<path d="M8 2.6 L13.6 12.2 H2.4 Z" fill="currentColor"/><rect x="7.3" y="5.8" width="1.4" height="3.2" rx=".7" fill="#fff"/><circle cx="8" cy="10.5" r=".8" fill="#fff"/>',
  };
  return {
    svg: `<svg viewBox="0 0 16 16" width="15" height="15" style="color:${c}">${shapes[kind]}</svg>`,
    tip: raw || "—",
  };
}

function onlineState(h: Host): number {
  return props.liveOnline[h.id] ?? h.serverHostOnline;
}
function delayOf(h: Host): number | null {
  const v = props.liveDelay[h.id];
  if (v != null) return v;
  return h.serverHostDelayMs ?? null;
}
function delayText(ms: number | null): string {
  if (ms == null) return "—";
  if (ms < 0) return "不可达";
  return ms + " ms";
}
function delayBad(ms: number | null): boolean {
  return ms != null && (ms < 0 || ms > 200);
}
function protocolOf(h: Host): string {
  const configured = (h.serverHostRemoteProtocol ?? "").toUpperCase();
  if (configured === "SSH" || configured === "RDP" || configured === "VNC") return configured.toLowerCase();
  const s = (h.serverHostOsType ?? "").toUpperCase();
  if (s.includes("WIN")) return "rdp";
  if (s.includes("MAC")) return "vnc";
  return "ssh";
}
function groupName(id?: number | null): string {
  if (!id) return "—";
  return props.groups.find(g => g.id === id)?.msServerGroupName ?? "组#" + id;
}
function show(v: unknown, fallback = "—"): string {
  if (v === null || v === undefined) return fallback;
  const text = String(v).trim();
  return text === "" ? fallback : text;
}
function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n * 10) / 10 : 0;
}
function fmtNum(v: unknown): string {
  const n = Number(v);
  return Number.isFinite(n) ? String(Math.round(n * 10) / 10) : "—";
}
function humanUptime(sec: number): string {
  if (!sec || sec <= 0) return "—";
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (d > 0) return `${d} 天 ${h} 小时`;
  if (h > 0) return `${h} 小时 ${m} 分`;
  return `${m} 分`;
}

const uptimeText = computed(() => humanUptime(Number(metrics.value.uptimeSec ?? info.value.uptimeSec ?? 0)));

interface Gauge { label: string; percent: number; detail: string; bad: boolean; }
/** 网络速率格式化：KB/s 自动换算 MB/s */
const fmtRate = (v: any): string => {
  const n = num(v);
  if (n >= 1024) return `${(n / 1024).toFixed(1)} MB/s`;
  return `${n.toFixed(0)} KB/s`;
};
const gauges = computed<Gauge[]>(() => {
  const m = metrics.value;
  const cpu = num(m.cpuPercent);
  const memPct = num(m.memoryPercent);
  const diskPct = num(m.diskPercent);
  const netPct = num(m.networkPercent);
  return [
    { label: "CPU", percent: cpu, detail: `${m.processCount ?? "—"} 进程 · ${m.threadCount ?? "—"} 线程`, bad: cpu >= 85 },
    { label: "内存", percent: memPct, detail: `${fmtNum(m.memoryUsedMb)} / ${fmtNum(m.memoryTotalMb)} MB`, bad: memPct >= 90 },
    { label: "磁盘", percent: diskPct, detail: `${fmtNum(m.diskUsedGb)} / ${fmtNum(m.diskTotalGb)} GB`, bad: diskPct >= 90 },
    { label: "网络", percent: netPct, detail: `↓ ${fmtRate(m.networkRxKb)} / ↑ ${fmtRate(m.networkTxKb)}`, bad: netPct >= 85 },
  ];
});
/** Windows 驱动器磁贴辅助 */
const driveLetter = (d: any): string => {
  const n = String(d.name || d.mount || '');
  // 盘符可能在名称中间（如「本地固定磁盘 (C:)」），需任意位置匹配，不能锚定开头
  const m = n.match(/([A-Za-z]):/);
  return m ? m[1].toUpperCase() + ':' : n.slice(0, 2);
};
const driveUsedPct = (d: any): number => {
  const total = Number(d.totalGb ?? 0);
  if (total > 0) return Math.max(0, Math.min(100, Number(d.usedGb ?? 0) / total * 100));
  return Math.max(0, Math.min(100, Number(d.usage ?? 0)));
};
const driveLow = (d: any): boolean => {
  const total = Number(d.totalGb ?? 0);
  if (total <= 0) return false;
  return Number(d.availGb ?? 0) / total < 0.1;
};
/** 驱动器根路径：Windows 为盘符根（C:\），Linux 为挂载点 */
const driveRoot = (d: any): string => {
  const letter = driveLetter(d);
  if (/^[A-Za-z]:$/.test(letter)) return letter + "\\";
  return String(d.mount || d.name || "/");
};
/** 文件管理器弹窗 */
const fileManagerVisible = ref(false);
const fileManagerPath = ref("");
const fileManagerPlatform = computed(() => String(selectedHost.value?.serverHostOsType || "LINUX"));
function openFileManager(d: any): void {
  fileManagerPath.value = driveRoot(d);
  fileManagerVisible.value = true;
}
/** 任一通道（Agent / SSH / 本机）拿到真实指标即展示明细，不再仅以 agent 就绪为准 */
const hasMetrics = computed(() => !profileError.value &&
  (Number(metrics.value.memoryTotalMb ?? 0) > 0 || Number(metrics.value.diskTotalGb ?? 0) > 0));

const overviewRows = computed<Array<{ label: string; value: string; mono?: boolean }>>(() => {
  const i = info.value;
  const h = selectedHost.value;
  const p: any = persisted.value || {};
  const upSec = Number(p.serverHostUptimeSec ?? i.uptimeSec ?? 0);
  return [
    { label: "主机名", value: show(p.serverHostOsHostname ?? p.serverHostName ?? i.hostname) },
    { label: "操作系统", value: show(p.serverHostOsType ?? i.osName ?? i.os) },
    { label: "主机版本", value: show(p.serverHostOsVersion ?? i.osVersion) },
    { label: "架构", value: show(p.serverHostOsArch ?? i.arch) },
    { label: "CPU 核数", value: show(p.serverHostCpuCores ?? i.cpuCores) },
    { label: "显卡", value: show(i.gpu) },
    { label: "内存", value: p.serverHostMemoryMb ? `${fmtNum(p.serverHostMemoryMb)} MB` : (i.memoryMb ? `${fmtNum(i.memoryMb)} MB` : "—") },
    { label: "磁盘总量", value: p.serverHostDiskGb ? `${fmtNum(p.serverHostDiskGb)} GB` : (i.diskTotalGb ? `${fmtNum(i.diskTotalGb)} GB` : "—") },
    { label: "内网 IP", value: show(p.serverHostPrivateIp ?? i.privateIp), mono: true },
    { label: "公网 IP", value: show(p.serverHostPublicIp ?? i.publicIp), mono: true },
    { label: "网卡 MAC", value: show(p.serverHostMac ?? i.mac), mono: true },
    { label: "运行时长", value: humanUptime(upSec) },
    { label: "Java 版本", value: show(p.serverHostJavaVersion ?? i.javaVersion) },
    { label: "主机编码", value: show(h?.serverHostCode ?? p.serverHostCode), mono: true },
    { label: "最后采集", value: show(p.serverHostLastCollectTime) },
    { label: "分组", value: groupName(h?.msServerGroupId ?? p.msServerGroupId) },
    { label: "备注", value: show(h?.serverHostDescription ?? p.serverHostDescription) },
  ];
});
</script>

<template>
  <div class="profile" :class="{ 'is-embedded': embedded }">
    <!-- 左侧：主机列表（嵌入到工作区页签时由外壳统一提供，这里不再渲染） -->
    <aside v-if="!embedded" class="profile-rail">
      <!-- 列表视图 -->
      <template v-if="railView === 'list'">
        <div class="rail-head">
          <span class="rail-title">主机画像</span>
          <span class="rail-count">{{ hosts.length }}</span>
        </div>
        <ReInput v-model="search" placeholder="搜索名称 / IP" clearable class="rail-search" />
        <ReScrollbar class="rail-list">
          <div
            v-for="h in visibleHosts"
            :key="h.id"
            :class="['rail-item', { active: selectedId === h.id }]"
            @click="selectHost(h.id)"
          >
            <span class="ri-os"><span v-html="osIconSvg(h.serverHostOsType)"></span></span>
            <div class="ri-meta">
              <b class="ri-name">{{ h.serverHostName }}</b>
              <span class="ri-addr mono">{{ h.serverHostAddress }}</span>
            </div>
            <ReStatusIndicator :type="onlineState(h) === 1 ? 'success' : 'danger'" />
          </div>
          <div v-if="visibleHosts.length === 0" class="rail-empty">无匹配主机</div>
        </ReScrollbar>
      </template>

      <!-- 概要视图：上方平台图标，下方概要信息 -->
      <div v-else class="rail-summary">
        <button class="rs-back" @click="backToList">
          <span class="rs-back-arrow">←</span> 主机列表
        </button>
        <ReScrollbar v-if="selectedHost" class="rs-scroll">
          <div class="rs-hero">
            <span class="rs-os"><span v-html="osIconSvg(selectedHost?.serverHostOsType)"></span></span>
            <b class="rs-name">{{ selectedHost?.serverHostName }}</b>
            <span class="rs-addr mono">{{ selectedHost?.serverHostAddress }}:{{ selectedHost?.serverHostPort }}</span>
            <div class="rs-pills">
              <span :class="['pill', onlineState(selectedHost) === 1 ? 'pill-ok' : 'pill-bad']">
                {{ onlineState(selectedHost) === 1 ? '在线' : '离线' }}
              </span>
              <span :class="['pill', delayBad(delayOf(selectedHost)) ? 'pill-warn' : 'pill-mute']">
                {{ delayText(delayOf(selectedHost)) }}
              </span>
            </div>
          </div>
          <div class="rs-section-title">概要信息</div>
          <div class="rs-rows">
            <div v-for="row in overviewRows" :key="row.label" class="rs-row">
              <span class="rs-label">{{ row.label }}</span>
              <span :class="['rs-val', { mono: row.mono, dim: row.value === '—' }]">{{ row.value }}</span>
            </div>
          </div>
        </ReScrollbar>
        <div v-else class="rs-gone">主机不可用，请返回列表重选</div>
      </div>
    </aside>

    <!-- 右侧：画像详情 -->
    <section class="profile-detail">
      <div v-if="!selectedHost" class="detail-empty">
        <ReEmpty description="从左侧选择一台主机查看画像" />
      </div>
      <template v-else>
        <!-- 主机头：嵌入模式由工作区页签与底部状态条承担，这里不再重复一遍主机名 -->
        <div v-if="!embedded" class="profile-head">
          <span class="ph-os"><span v-html="osIconSvg(selectedHost.serverHostOsType)"></span></span>
          <div class="ph-name-wrap">
            <b class="ph-name">{{ selectedHost.serverHostName }}</b>
            <span class="ph-addr mono">
              {{ selectedHost.serverHostAddress }}:{{ selectedHost.serverHostPort }} ·
              {{ protocolOf(selectedHost).toUpperCase() }} · Agent :{{ agentPort || '—' }}
            </span>
          </div>
          <div class="ph-pills">
            <span :class="['pill', onlineState(selectedHost) === 1 ? 'pill-ok' : 'pill-bad']">
              {{ onlineState(selectedHost) === 1 ? '在线' : '离线' }}
            </span>
            <span :class="['pill', delayBad(delayOf(selectedHost)) ? 'pill-warn' : 'pill-mute']">
              {{ delayText(delayOf(selectedHost)) }}
            </span>
            <template v-if="isAgentMode">
              <span v-if="agentReady" class="pill pill-agent">Agent v{{ agentVersion || '?' }}</span>
              <span v-else class="pill pill-bad">Agent 未就绪</span>
            </template>
          </div>
          <div class="ph-actions">
            <ReButton icon="Refresh" layout="square" type="primary" :loading="loadingProfile"
              @click="loadProfile(true)">刷新主机</ReButton>
            <ReButton v-if="isAgentMode && !agentReady" icon="Download" layout="square" type="success"
              @click="emit('deploy-agent', selectedHost)">安装 Agent</ReButton>
            <ReButton icon="Connection" layout="square" @click="emit('connect', selectedHost)">连接</ReButton>
            <ReButton icon="TrendCharts" layout="square" @click="emit('detail', selectedHost)">监控详情</ReButton>
            <ReButton icon="EditPen" layout="square" @click="emit('edit', selectedHost)">编辑</ReButton>
            <label class="auto-switch">
              <ReSwitch v-model="autoRefresh" />
              <span>10s 自动刷新</span>
            </label>
          </div>
        </div>

        <!-- 嵌入模式：页签内的紧凑工具条（只留刷新与自动刷新，主机级动作在左侧右键菜单） -->
        <div v-else class="profile-head profile-head--embedded">
          <div class="ph-pills">
            <span :class="['pill', onlineState(selectedHost) === 1 ? 'pill-ok' : 'pill-bad']">
              {{ onlineState(selectedHost) === 1 ? '在线' : '离线' }}
            </span>
            <span :class="['pill', delayBad(delayOf(selectedHost)) ? 'pill-warn' : 'pill-mute']">
              {{ delayText(delayOf(selectedHost)) }}
            </span>
            <template v-if="isAgentMode">
              <span v-if="agentReady" class="pill pill-agent">Agent v{{ agentVersion || '?' }}</span>
              <span v-else class="pill pill-bad">Agent 未就绪</span>
            </template>
          </div>
          <div class="ph-actions">
            <ReButton icon="Refresh" layout="square" type="primary" :loading="loadingProfile"
              @click="loadProfile(true)">刷新</ReButton>
            <ReButton v-if="isAgentMode && !agentReady" icon="Download" layout="square" type="success"
              @click="emit('deploy-agent', selectedHost)">安装 Agent</ReButton>
            <label class="auto-switch">
              <ReSwitch v-model="autoRefresh" />
              <span>10s 自动刷新</span>
            </label>
          </div>
        </div>

        <div v-if="profileError" class="alert alert-error">
          <b>通道读取失败：</b>{{ profileError }}
          <div class="dim">
            画像各分区都依赖采集通道（Agent / SSH / WinRM / 本机）。主机台账记录的最近错误：{{ show(snapshot.serverHostAgentError, '无') }}；
            未安装时可点右上「安装 Agent」。
          </div>
        </div>
        <div v-else-if="osMismatch" class="alert alert-warn">{{ osMismatch }}</div>

        <!-- 资源仪表：嵌入模式已移到工作区底部常驻状态条，这里不再重复 -->
        <div v-if="!embedded" class="gauges">
          <div v-for="g in gauges" :key="g.label" class="gauge">
            <div class="gauge-top">
              <span class="gauge-label">{{ g.label }}</span>
              <span :class="['gauge-val', { bad: g.bad }]">{{ g.percent }}%</span>
            </div>
            <div class="gauge-bar"><i :class="{ bad: g.bad }" :style="{ width: Math.min(100, g.percent) + '%' }" /></div>
            <div class="gauge-sub mono">{{ hasMetrics ? g.detail : '等待通道数据' }}</div>
          </div>

        </div>

        <!-- 分段切换：嵌入模式下每个分区已是独立页签，不再需要二级切换 -->
        <div v-if="!embedded" class="seg">
          <button
            v-for="s in sections"
            :key="s.name"
            :class="['seg-item', { active: active === s.name }]"
            @click="pickSection(s.name)"
          >{{ s.label }}</button>
        </div>

        <div class="seg-body">
          <div v-if="active !== 'network'" class="sec-bar">
            <span class="dim">
              <template v-if="pagedSection">
                {{ sectionKeyword.trim() ? `命中 ${sectionTotal} 条` : (active === 'disks' ? `共 ${sectionTotal} 个驱动器` : `共 ${sectionTotal} 条`) }}
                <template v-if="sectionTruncated">，已达采集上限，仅显示前 500 条</template>
              </template>
              <template v-else>
                {{ sectionKeyword.trim() ? `命中 ${visibleRows.length} 条` : (active === 'disks' ? `共 ${visibleRows.length} 个驱动器` : `共 ${visibleRows.length} 条`) }}
              </template>
              <template v-if="pagedSection && page > 1">（第 {{ page }} 页）</template>
            </span>
            <div class="sec-pager">
              <ReInput
                v-model="sectionKeyword"

                class="sec-search"
                :placeholder="keywordPlaceholder"
                clearable
                @keyup.enter="pagedSection && applyKeyword()"
                @clear="pagedSection && applyKeyword()"
              />
              <template v-if="pagedSection">
                <ReButton :disabled="loadingSection" @click="applyKeyword">搜索</ReButton>
                <ReButton :disabled="page <= 1 || loadingSection" @click="changePage(-1)">上一页</ReButton>
                <span class="mono page-no">{{ page }}</span>
                <ReButton :disabled="loadingSection || page * pageSize >= sectionTotal" @click="changePage(1)">下一页</ReButton>
              </template>
              <ReButton type="primary" layout="square" icon="Refresh" :loading="loadingSection" @click="loadSection">刷新</ReButton>
              <ReButton v-if="active === 'processes'" layout="square" icon="DataAnalysis" :type="analyzeVisible ? 'primary' : ''"
                @click="toggleAnalyze">{{ analyzeVisible ? '收起分析' : '分析' }}</ReButton>
            </div>
          </div>
          <div v-if="sectionError" class="alert alert-error">{{ sectionError }}</div>
          <div v-else-if="loadingSection && !rows.length" class="dim sec-loading">正在拉取…</div>
          <div v-else-if="!visibleRows.length" class="dim sec-loading">
            {{ sectionKeyword.trim() ? "关键字未命中任何一行" : "该分区无数据" }}
          </div>
          <!-- 磁盘：Windows「此电脑」驱动器样式 -->
          <div v-else-if="active === 'disks'" class="win-drives">
            <div
              v-for="(d, idx) in visibleRows"
              :key="idx"
              class="drive"
              @click="openFileManager(d)"
              @dblclick="openFileManager(d)"
            >
              <div class="drive-ico">
                <svg viewBox="0 0 48 48" width="46" height="46">
                  <defs>
                    <linearGradient id="driveBody" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0" stop-color="#fcfdff" />
                      <stop offset="0.55" stop-color="#edf0f5" />
                      <stop offset="1" stop-color="#d6dbe4" />
                    </linearGradient>
                    <linearGradient id="driveTop" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0" stop-color="#ffffff" />
                      <stop offset="1" stop-color="#e6eaf1" />
                    </linearGradient>
                    <clipPath id="driveClip">
                      <rect x="4" y="15" width="40" height="20" rx="4.5" />
                    </clipPath>
                  </defs>
                  <!-- 盘体 -->
                  <rect x="4" y="15" width="40" height="20" rx="4.5" fill="url(#driveBody)" stroke="#b4bac7" stroke-width="1" />
                  <!-- 顶部面 -->
                  <rect x="4" y="15" width="40" height="7.6" fill="url(#driveTop)" clip-path="url(#driveClip)" />
                  <!-- 分隔槽 -->
                  <line x1="4.5" y1="22.6" x2="43.5" y2="22.6" stroke="#c4cad4" stroke-width="0.9" />
                  <!-- LED 光晕 + 灯点 -->
                  <circle cx="39.4" cy="18.8" r="2.7" fill="#7ed957" opacity="0.28" />
                  <circle cx="39.4" cy="18.8" r="1.5" fill="#57b834" />
                  <!-- 底部细节槽 -->
                  <line x1="9" y1="30.4" x2="25" y2="30.4" stroke="#c0c6d1" stroke-width="0.9" stroke-linecap="round" />
                </svg>
                <span class="drive-badge">{{ driveLetter(d) }}</span>
              </div>
              <div class="drive-info">
                <b class="drive-name">{{ d.name || d.mount }}<span v-if="d.fsType" class="drive-fs dim"> · {{ d.fsType }}</span></b>
                <div class="drive-track"><i :class="{ low: driveLow(d) }" :style="{ width: driveUsedPct(d) + '%' }" /></div>
                <span class="drive-hint dim">已用 {{ fmtNum(d.usedGb) }} GB · 共 {{ fmtNum(d.totalGb) }} GB</span>
              </div>
            </div>
          </div>
          <!-- 网络：网卡磁贴（Windows）/ 通用表格（其它） -->
          <div v-else-if="active === 'network'" class="net-wrap">
            <HostNetworkAdapters
              :host-id="selectedHost.id"
              :rows="rows"
              :platform="selectedHost.serverHostOsType"
              @applied="onNetworkApplied"
            />
          </div>
          <!-- 其余分区：通用表格（进程分析时左右分栏） -->
          <div v-else :class="['tbl-wrap', { 'analyze-split': showAnalyze }]">
            <!-- 环境变量：新增工具条 -->
            <div v-if="active === 'env'" class="tbl-toolbar">
              <ReButton type="primary" layout="square" icon="Plus" @click="openEnvDialog()">
                新增变量
              </ReButton>
            </div>
            <div class="tbl-scroll">
            <table class="tbl">
              <thead>
                <tr>
                  <th
                    v-if="active === 'processes' || active === 'services'"
                    class="th-lead" style="width: 46px"
                  ></th>
                  <th
                    v-for="col in columns" :key="col.key"
                    :style="col.width ? { width: col.width } : {}"
                    :class="{ sortable: isSortable(col.key), 'sort-on': sortState?.key === col.key }"
                    @click="isSortable(col.key) && onHeaderSort(col.key)"
                  >
                    <span class="th-label">{{ col.label }}</span>
                    <span v-if="isSortable(col.key)" class="th-sort">
                      <span v-if="sortState?.key === col.key" class="sort-arrow">{{ sortState.dir === 'desc' ? '▼' : '▲' }}</span>
                      <span v-else class="sort-idle">⇅</span>
                    </span>
                  </th>
                  <th v-if="hasActions" class="th-act">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(r, idx) in tableRows" :key="idx"
                  :class="active === 'processes' ? procLevel(r) : ''"
                >
                  <!-- 前置图标列：进程/服务的可识别图标（最左侧） -->
                  <td
                    v-if="active === 'processes' || active === 'services'"
                    class="td-lead"
                  >
                    <!-- 命中官方品牌：白色圆角块衬彩色 Logo -->
                    <span
                      v-if="leadTile(active, r).brand"
                      class="cell-brand cell-brand--lead"
                      v-html="leadTile(active, r).brand"
                    ></span>
                    <!-- 未命中：品牌色块 + 单色图形 / 首字母 -->
                    <span
                      v-else
                      class="cell-logo cell-logo--lead"
                      :style="{ background: leadTile(active, r).bg }"
                    >
                      <span
                        v-if="leadTile(active, r).glyph"
                        class="lead-glyph" v-html="leadTile(active, r).glyph"
                      ></span>
                      <template v-else>{{ leadTile(active, r).letter }}</template>
                    </span>
                  </td>
                  <td v-for="col in columns" :key="col.key">
                    <!-- 名称列：单行省略 + tip -->
                    <template v-if="col.key === 'name'">
                      <el-tooltip :content="String(r.name ?? '')" placement="top" :show-after="200">
                        <span class="cell-ellipsis">{{ r.name }}</span>
                      </el-tooltip>
                    </template>
                    <!-- 命令行：单行省略 + tip -->
                    <template v-else-if="col.key === 'command'">
                      <el-tooltip
                        v-if="String(r.command ?? '').trim()"
                        :content="String(r.command)" placement="top-start"
                        :show-after="200" popper-class="cmd-tip"
                      >
                        <span class="cell-ellipsis">{{ r.command }}</span>
                      </el-tooltip>
                      <span v-else class="dim">—</span>
                    </template>
                    <!-- 状态列：监听端口分区用 OPEN/CLOSED 标记，其余分区保留状态图标 + tip -->
                    <template v-else-if="col.key === 'state'">
                      <template v-if="active === 'ports'">
                        <span v-if="portStatus(r.state).open !== null" class="port-status" :class="portStatus(r.state).open ? 'ps-open' : 'ps-closed'">
                          <i class="ps-dot"></i>{{ portStatus(r.state).text }}
                        </span>
                        <span v-else class="dim">—</span>
                      </template>
                      <el-tooltip v-else :content="stateMeta(r.state).tip" placement="top" :show-after="150">
                        <span class="state-ico" v-html="stateMeta(r.state).svg"></span>
                      </el-tooltip>
                    </template>
                    <!-- 其余列：一律单行省略 + tip -->
                    <template v-else>
                      <el-tooltip
                        v-if="String(r[col.key] ?? '').trim()"
                        :content="String(r[col.key])" placement="top" :show-after="200"
                      >
                        <span class="cell-ellipsis">{{ show(r[col.key], '') }}</span>
                      </el-tooltip>
                      <span v-else class="dim">—</span>
                    </template>
                  </td>
                  <td v-if="hasActions" class="td-act"><div class="td-act-in">
                    <template v-if="active === 'processes'">
                      <ReButton
 layout="square" icon="RefreshRight"
                        :loading="busyRow === `restart-${r.pid}`"
                        :disabled="!Number(r.pid) || !String(r.command ?? '').trim()"
                        :title="String(r.command ?? '').trim() ? '' : '该进程读不到命令行，无法按原样重启'"
                        @click="onRestartProcess(r)"
                      >重启</ReButton>
                      <ReButton
 type="danger" layout="square" icon="CircleClose"
                        :loading="busyRow === `kill-${r.pid}`"
                        :disabled="!Number(r.pid)" @click="onKillProcess(r)"
                      >结束</ReButton>
                    </template>
                    <template v-else-if="active === 'services'">
                      <ReButton
                        v-if="isStoppedService(r)" type="primary" layout="square" icon="VideoPlay"
                        :loading="busyRow === `service-start-${r.name}`"
                        @click="onServiceAction(r, 'start')"
                      >启动</ReButton>
                      <ReButton
                        v-else layout="square" icon="RefreshRight"
                        :loading="busyRow === `service-restart-${r.name}`"
                        @click="onServiceAction(r, 'restart')"
                      >重启</ReButton>
                      <ReButton
                        v-if="!isStoppedService(r)" type="danger" layout="square" icon="VideoPause"
                        :loading="busyRow === `service-stop-${r.name}`"
                        @click="onServiceAction(r, 'stop')"
                      >停止</ReButton>
                    </template>
                    <template v-else-if="active === 'env'">
                      <ReButton
 type="danger" layout="square" icon="Delete"
                        :loading="busyRow === `env-del-${r.name}`"
                        @click="onDeleteEnv(r)"
                      >删除</ReButton>
                    </template>
                    <template v-else>
                      <ReButton
 type="danger" layout="square" icon="CircleClose"
                        :loading="busyRow === `netproc-${r.pid}-${r.port}`"
                        :disabled="!Number(r.pid)"
                        :title="Number(r.pid) ? '' : '该端口无归属进程，无法结束'"
                        @click="onClosePortProcess(r)"
                      >结束</ReButton>
                    </template>
                  </div></td>
                </tr>
              </tbody>
            </table>
            </div>
            <!-- 进程内存分析：矩形树图 -->
            <div v-if="showAnalyze" class="analyze-pane">
              <div class="analyze-head">
                <span>内存占用矩形树图</span>
                <small class="dim">单位 MB · 随当前页数据刷新</small>
              </div>
              <div ref="treemapRef" class="analyze-chart"></div>
            </div>
          </div>
        </div>
      </template>
    </section>

    <!-- 文件管理器弹窗 -->
    <ReDialog
      v-model="fileManagerVisible"
      :title="'文件管理 - ' + (selectedHost?.serverHostName || '')"
      width="86%"
      top="6vh"
      append-to-body
      destroy-on-close
      class="host-fm-dialog"
    >
      <HostFileManager
        v-if="selectedHost"
        :host-id="selectedHost.id"
        :initial-path="fileManagerPath"
        :platform="fileManagerPlatform"
      />
    </ReDialog>

    <!-- 新增环境变量弹窗 -->
    <ReDialog
      v-model="envDialog" title="新增系统级环境变量" width="520px" append-to-body
      class="host-sub-dialog"
    >
      <div class="sub-form">
        <label class="sub-label">变量名</label>
        <el-input v-model="envForm.name" placeholder="如 JAVA_HOME，字母/数字/下划线" spellcheck="false" />
        <label class="sub-label">变量值</label>
        <el-input
          v-model="envForm.value" type="textarea" :rows="4"
          placeholder="系统级持久化：Windows 写入 Machine，Linux 写入 /etc/environment" spellcheck="false"
        />
      </div>
      <template #footer>
        <ReButton @click="envDialog = false">取消</ReButton>
        <ReButton type="primary" :loading="busyRow.startsWith('env-set')" @click="submitEnv">保存</ReButton>
      </template>
    </ReDialog>
  </div>
</template>

<style scoped lang="scss">
.profile { display: flex; height: 100%; min-height: 0; }
/* 嵌进页签时父级是 flex 列：height:100% 在百分比高度不可解析时会退化成内容高度，
   再补一条 flex 让面板高度被吃满，避免表格只占半屏、下方留白 */
.profile.is-embedded { flex: 1 1 auto; }
/* 左侧列表 */
.profile-rail {
  width: 300px; flex-shrink: 0; display: flex; flex-direction: column;
  border-right: 1px solid var(--border-subtle); background: var(--bg-container);
}
.rail-head { display: flex; align-items: center; gap: 8px; padding: 14px 14px 8px; }
.rail-title { font-size: 15px; font-weight: 600; }
.rail-count {
  font-size: 11px; color: var(--brand-600, #6d5ce7); background: var(--brand-50, #f3f1ff);
  border: 1px solid var(--brand-200, #d5ccff); border-radius: 999px; padding: 0 7px; line-height: 18px;
}
.rail-search { padding: 0 14px 8px; }
.rail-list { flex: 1; min-height: 0; padding: 0 10px; }
.rail-item {
  display: flex; align-items: center; gap: 10px; padding: 9px 10px; border-radius: 8px; cursor: pointer;
  border: 1px solid transparent; transition: all .15s;
  &:hover { background: var(--brand-50, #f3f1ff); }
  &.active { background: var(--brand-100, #e8e4ff); border-color: var(--brand-200, #d5ccff); }
}
.ri-os {
  display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 8px;
  font-size: 18px; color: var(--brand-500); background: var(--bg-fill, #f5f6fa); flex-shrink: 0;
}
.ri-os :deep(svg) { display: block; }
.ri-meta { flex: 1; min-width: 0; }
.ri-name { display: block; font-size: 13px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ri-addr { font-size: 11px; color: var(--text-tertiary, #a0a4b0); }
.rail-empty { text-align: center; padding: 30px; color: var(--text-tertiary); font-size: 13px; }

/* 右侧 */
.profile-detail { flex: 1; min-width: 0; display: flex; flex-direction: column; overflow-y: auto; padding: 16px 20px; }
/* 嵌入到工作区页签：整页只有一个滚动条 —— 由内层表格自己滚，
   外层只负责纵向 flex 分配高度，避免内外双滚动条抢滚轮 */
.profile.is-embedded .profile-detail { overflow: hidden; min-height: 0; padding: 12px 14px; }
.detail-empty { height: 100%; display: flex; align-items: center; justify-content: center; }
.profile-head { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; padding-bottom: 14px; border-bottom: 1px solid var(--border-subtle); }
/* 嵌入模式的紧凑工具条：只有状态胶囊与刷新，压缩高度把空间让给数据表 */
.profile-head--embedded { padding-bottom: 10px; }
.profile-head--embedded .ph-actions { margin-left: auto; }
.ph-os {
  display: inline-flex; align-items: center; justify-content: center; width: 46px; height: 46px; border-radius: 12px;
  font-size: 24px; color: var(--brand-500); background: var(--bg-fill, #f5f6fa); flex-shrink: 0;
}
.ph-os :deep(svg) { display: block; }
.ph-name-wrap { flex: 1; min-width: 220px; }
.ph-name { display: block; font-size: 17px; font-weight: 700; }
.ph-addr { font-size: 12px; color: var(--text-tertiary, #a0a4b0); margin-top: 3px; }
.ph-pills { display: flex; gap: 6px; flex-wrap: wrap; }
.pill {
  font-size: 12px; padding: 3px 10px; border-radius: 999px; border: 1px solid var(--border-subtle);
  background: var(--bg-fill, #f5f6fa); white-space: nowrap;
}
.pill-ok { color: var(--status-success-text, #34c759); border-color: rgba(52, 199, 89, .35); }
.pill-bad { color: var(--status-error-text, #f56c6c); border-color: rgba(245, 108, 108, .35); }
.pill-warn { color: var(--status-warning-text, #e6a23c); border-color: rgba(230, 162, 60, .35); }
.pill-mute { color: var(--text-tertiary, #a0a4b0); }
.pill-agent { color: var(--brand-600, #6d5ce7); border-color: var(--brand-200, #d5ccff); background: var(--brand-50, #f3f1ff); }
.ph-actions { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.auto-switch { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-tertiary); margin-left: 4px; }

.alert { margin: 12px 0 0; padding: 10px 12px; border-radius: 8px; font-size: 12.5px; line-height: 1.7; }
.alert-error { background: rgba(245, 108, 108, .1); border: 1px solid rgba(245, 108, 108, .3); color: var(--status-error-text, #d9484b); }
.alert-warn { background: rgba(230, 162, 60, .1); border: 1px solid rgba(230, 162, 60, .3); color: var(--status-warning-text, #b8741a); }

.gauges { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 12px; margin: 14px 0 4px; }
.gauge { padding: 12px 14px; border: 1px solid var(--border-subtle); border-radius: 10px; background: var(--bg-fill, #f8f9fc); }
.gauge-top { display: flex; align-items: baseline; justify-content: space-between; }
.gauge-label { font-size: 11px; letter-spacing: .4px; text-transform: uppercase; color: var(--text-tertiary); }
.gauge-val { font-size: 18px; font-weight: 600; &.bad { color: var(--danger, #f56c6c); } }
.gauge-bar {
  height: 6px; border-radius: 999px; background: var(--border-subtle); overflow: hidden; margin: 8px 0 6px;
  i { display: block; height: 100%; background: var(--brand-500, #6d5ce7); transition: width .3s; &.bad { background: var(--danger, #f56c6c); } }
}
.gauge-sub { font-size: 11px; color: var(--text-tertiary); }
/* Windows「此电脑」驱动器磁贴 */
.win-drives {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(215px, 1fr));
  gap: 12px; padding: 6px 0;
}
.drive {
  display: flex; align-items: center; gap: 12px; padding: 12px; min-width: 0;
  border: 1px solid var(--border-subtle); border-radius: 12px; background: var(--bg-container, #fff);
  transition: box-shadow .15s, border-color .15s; cursor: pointer;
  &:hover { border-color: var(--brand-100, #e6e2ff); box-shadow: 0 4px 14px rgba(30,30,60,.06); }
}
.drive-ico { position: relative; flex-shrink: 0; display: flex; color: var(--text-secondary, #6a7080); }
.drive-badge {
  position: absolute; right: -2px; bottom: 1px; font-size: 9px; font-weight: 700;
  color: var(--brand-600, #5a4bd9); line-height: 1; background: var(--bg-container, #fff); padding: 0 1px;
}
.drive-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 5px; }
.drive-name { font-size: 13.5px; font-weight: 600; color: var(--text-primary, #222); }
.drive-fs { font-weight: 400; }
.drive-track { height: 8px; border-radius: 5px; background: var(--bg-fill, #eef0f5); overflow: hidden; }
.drive-track i { display: block; height: 100%; border-radius: 5px; background: var(--el-color-primary, #6d5dfc); transition: width .3s; }
.drive-track i.low { background: var(--el-color-danger, #e5534b); }
.drive-hint { font-size: 11.5px; }

.seg { display: flex; gap: 4px; flex-wrap: wrap; margin: 16px 0 0; padding: 4px; border-radius: 10px; background: var(--bg-fill, #f5f6fa); }
.seg-item {
  border: 0; background: transparent; color: var(--text-secondary, #5c6070); font-size: 13px; padding: 6px 14px;
  border-radius: 8px; cursor: pointer; transition: all .15s;
  &:hover { color: var(--brand-600, #6d5ce7); }
  &.active { background: var(--bg-container, #fff); color: var(--brand-600, #6d5ce7); font-weight: 600; box-shadow: 0 1px 4px rgba(20, 20, 40, .08); }
}
.seg-body { padding: 6px 0 20px; }
.tab-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px 24px; padding: 14px 0; }
.tab-item { display: flex; flex-direction: column; gap: 4px; }
.tab-label { font-size: 12px; color: var(--text-tertiary, #a0a4b0); }
.tab-value { font-size: 14px; word-break: break-all; }
.tab-value.mono { font-family: var(--font-mono, monospace); }
.tab-value.dim { color: var(--text-tertiary); }

.sec-bar { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin: 12px 0 10px; }
.sec-pager { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-left: auto; }
.sec-search { width: 232px; }
.page-no { font-size: 12px; color: var(--text-tertiary); min-width: 22px; text-align: center; }
.sec-loading { padding: 24px; text-align: center; font-size: 13px; }
.tbl-wrap { display: flex; flex-direction: column; overflow: hidden; border: 1px solid var(--border-subtle); border-radius: 10px; max-height: calc(100vh - 420px); }
/* 嵌入模式：页签内容区自己撑满可用高度，表格内部滚动，不再按视口硬算高度 */
.profile.is-embedded .tbl-wrap { flex: 1 1 auto; max-height: none; min-height: 0; }
.profile.is-embedded .seg-body { display: flex; flex: 1 1 auto; flex-direction: column; min-height: 0; padding-bottom: 0; }
.tbl-scroll { flex: 1; min-height: 0; overflow: auto; }
/* 进程分析：左右分栏，左侧表格、右侧矩形树图 */
.tbl-wrap.analyze-split { flex-direction: row; }
.tbl-wrap.analyze-split .tbl-scroll { flex: 1 1 54%; min-width: 0; }
.analyze-pane {
  flex: 1 1 46%; min-width: 0; display: flex; flex-direction: column;
  border-left: 1px solid var(--border-subtle); background: var(--bg-fill, #f8f9fc);
}
.analyze-head {
  display: flex; align-items: baseline; justify-content: space-between; gap: 8px;
  padding: 10px 14px; border-bottom: 1px solid var(--border-subtle);
  span { font-size: 13px; font-weight: 600; }
  small { font-size: 11px; }
}
.analyze-chart { flex: 1; min-height: 260px; width: 100%; }
.tbl { width: 100%; border-collapse: collapse; font-size: 12.5px; }
.tbl th, .tbl td { text-align: left; padding: 8px 12px; border-bottom: 1px solid var(--border-subtle); white-space: nowrap; }
.tbl td { font-family: var(--font-mono, monospace); overflow: hidden; }
.tbl th { position: sticky; top: 0; background: var(--bg-fill, #f8f9fc); font-weight: 600; color: var(--text-tertiary); z-index: 1; }
.tbl tbody tr:hover td { background: var(--brand-50, #f3f1ff); }
/* 通用单元格：单行省略（tip 由 el-tooltip 提供） */
.cell-ellipsis {
  display: block; min-width: 0; max-width: 100%;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.state-ico { display: inline-flex; align-items: center; justify-content: center; line-height: 0; }
/* 端口开放情况：浅灰底圆角块 + 圆点 + 同色大写半粗文字（图片 1 的标记样式） */
.port-status {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 2px 10px; border-radius: 999px;
  background: var(--el-fill-color-light, #f3f4f6);
  border: 1px solid var(--el-border-color-lighter, #e4e7ed);
  font-size: 12px; font-weight: 600; letter-spacing: 0.4px;
  line-height: 1.5;
  font-family: var(--font-mono, monospace);
}
.ps-dot {
  width: 8px; height: 8px; border-radius: 50%;
  box-shadow: inset 0 0 0 1.5px rgba(255, 255, 255, 0.4);
}
.ps-open { color: var(--el-color-success, #67c23a); }
.ps-open .ps-dot { background: var(--el-color-success, #67c23a); box-shadow: 0 0 0 1.5px rgba(103, 194, 58, 0.45); }
.ps-closed { color: var(--el-color-danger, #f56c6c); }
.ps-closed .ps-dot { background: var(--el-color-danger, #f56c6c); box-shadow: 0 0 0 1.5px rgba(245, 108, 108, 0.45); }
/* 进程阈值行底色 */
.tbl tbody tr.row-warn td { background: var(--el-color-warning-light-9, #fdf6ec); }
.tbl tbody tr.row-danger td { background: var(--el-color-danger-light-9, #fef0f0); }
.tbl tbody tr.row-warn:hover td { background: var(--el-color-warning-light-8, #faecd8); }
.tbl tbody tr.row-danger:hover td { background: var(--el-color-danger-light-8, #fde2e2); }
/* 名称列头像 */
.cell-logo {
  display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px;
  border-radius: 6px; color: #fff; font-size: 11px; font-weight: 700; margin-right: 8px;
  vertical-align: middle; font-family: var(--font-base, inherit);
}
/* 前置图标列：居中、无右边距，图标略大 */
.th-lead { padding: 0; }
.td-lead { text-align: center; padding-left: 10px; padding-right: 6px; }
.cell-logo--lead { width: 28px; height: 28px; margin-right: 0; border-radius: 8px; }
/* 官方品牌彩色 Logo：中性白块衬底 + 细边框 */
.cell-brand {
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 8px; background: var(--el-bg-color, #fff);
  border: 1px solid var(--border-subtle, #e6e8ee);
}
.cell-brand--lead { width: 30px; height: 30px; }
.cell-brand :deep(svg) { display: block; }
.lead-glyph { display: inline-flex; align-items: center; justify-content: center; line-height: 0; }
.lead-glyph :deep(svg) { display: block; }
/* 命令行省略 */
.cmd-ellipsis {
  display: block; max-width: 340px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
/* 可排序表头 */
.tbl th.sortable { cursor: pointer; user-select: none; white-space: nowrap; }
.tbl th.sortable:hover { color: var(--el-color-primary, #6d5dfc); }
.tbl th.sort-on { color: var(--el-color-primary, #6d5dfc); }
.th-label { vertical-align: middle; }
.th-sort { margin-left: 4px; display: inline-flex; vertical-align: middle; }
.sort-arrow { font-size: 9px; }
.sort-idle { font-size: 11px; opacity: .4; }
/* 表格内新增工具条 */
.tbl-toolbar {
  display: flex; justify-content: flex-end; padding: 8px 12px;
  border-bottom: 1px solid var(--border-subtle); position: sticky; left: 0;
}
/* 子弹窗表单 */
.sub-form { display: grid; grid-template-columns: 84px 1fr; align-items: center; gap: 12px 14px; }
.sub-label { font-size: 12.5px; color: var(--text-tertiary); }
.tbl th.th-act {
  width: 150px; text-align: right;
  /* 同时钉住顶部与右侧：特异性 (0,2,1) 高于 .tbl th，z-index 高于操作单元格(2)，
     否则纵向滚动时钉右的操作单元格(z-index:2)会盖过操作表头导致“操作”表头消失 */
  position: sticky; top: 0; right: 0; z-index: 4;
  background: var(--bg-fill, #f8f9fc); box-shadow: -10px 0 10px -10px rgba(20,24,40,.25);
}
.td-act {
  position: sticky; right: 0; z-index: 2; padding: 6px 12px; white-space: nowrap;
  background: var(--el-bg-color, #fff); box-shadow: -10px 0 10px -10px rgba(20,24,40,.2);
}
.td-act-in { display: flex; gap: 6px; justify-content: flex-end; align-items: center; }
.tbl tbody tr:hover .td-act { background: var(--brand-50, #f3f1ff); }
.tbl tbody tr.row-warn .td-act { background: var(--el-color-warning-light-9, #fdf6ec); }
.tbl tbody tr.row-danger .td-act { background: var(--el-color-danger-light-9, #fef0f0); }
.tbl tbody tr.row-warn:hover .td-act { background: var(--el-color-warning-light-8, #faecd8); }
.tbl tbody tr.row-danger:hover .td-act { background: var(--el-color-danger-light-8, #fde2e2); }
.mono { font-family: var(--font-mono, monospace); }
.dim { color: var(--text-tertiary, #a0a4b0); }

/* 左侧概要视图 */
.rail-summary { display: flex; flex-direction: column; flex: 1; min-height: 0; }
.rs-back {
  display: inline-flex; align-items: center; gap: 6px; margin: 12px 14px 6px;
  border: 1px solid var(--border-subtle); background: var(--bg-container); color: var(--text-secondary);
  border-radius: 8px; padding: 6px 10px; font-size: 12.5px; cursor: pointer; align-self: flex-start;
  &:hover { color: var(--brand-600); border-color: var(--brand-200); background: var(--brand-50); }
}
.rs-back-arrow { font-size: 14px; line-height: 1; }
.rs-scroll { flex: 1; min-height: 0; padding: 0 14px 14px; }
.rs-hero {
  display: flex; flex-direction: column; align-items: center; text-align: center; gap: 7px;
  padding: 16px 10px 14px; border: 1px solid var(--border-subtle); border-radius: 12px; background: var(--bg-fill);
}
.rs-os {
  display: inline-flex; align-items: center; justify-content: center; width: 58px; height: 58px; border-radius: 14px;
  font-size: 30px; color: var(--brand-500); background: var(--bg-container);
}
.rs-os :deep(svg) { display: block; }
.rs-name { font-size: 16px; font-weight: 700; word-break: break-all; }
.rs-addr { font-size: 11.5px; color: var(--text-tertiary); }
.rs-pills { display: flex; gap: 6px; flex-wrap: wrap; justify-content: center; margin-top: 2px; }
.rs-section-title {
  font-size: 12px; font-weight: 600; color: var(--text-tertiary); letter-spacing: .4px;
  text-transform: uppercase; margin: 16px 2px 8px;
}
.rs-rows { display: flex; flex-direction: column; }
.rs-row {
  display: flex; align-items: baseline; justify-content: space-between; gap: 12px;
  padding: 7px 2px; border-bottom: 1px solid var(--border-subtle);
}
.rs-label { font-size: 12px; color: var(--text-tertiary); flex-shrink: 0; }
.rs-val { font-size: 12.5px; text-align: right; word-break: break-all; }
.rs-val.mono { font-family: var(--font-mono, monospace); }
.rs-val.dim { color: var(--text-tertiary); }
.rs-gone { padding: 30px 20px; text-align: center; font-size: 13px; color: var(--text-tertiary); }
</style>

<style lang="scss">
/* 命令行 tooltip：超长命令允许换行，限制最大宽度 */
.cmd-tip.el-popper {
  max-width: 560px;
}
.cmd-tip .el-tooltip__content {
  white-space: pre-wrap;
  word-break: break-all;
  line-height: 1.6;
}
/* 文件管理器弹窗：固定内容高度，保证内部 flex 布局撑满 */
.host-fm-dialog .el-dialog__body {
  height: 74vh;
  padding: 8px 12px 12px;
}
.host-fm-dialog .el-dialog__header {
  padding-bottom: 8px;
}
</style>
