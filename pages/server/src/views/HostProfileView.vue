<script setup lang="ts">
/**
 * 主机画像 —— 概览 + 7 个分区（数据全部来自目标机的采集通道）。
 *
 * <p>左侧：主机列表（OS 图标 + 名称 + 地址 + 在线状态），点选切换；
 * 右侧：概览条 + 资源仪表 + 分区（监听端口 / 进程 / 服务 / 磁盘 / 网络 / 环境变量 / 防火墙）。</p>
 *
 * <p>每个分区的呈现形态由自己的组件负责（见 {@code components/profile/}），
 * 本组件只负责取数、分页、写操作与页签状态，不再内联任何表格布局。</p>
 *
 * <p>约定：</p>
 * <ul>
 *   <li>每一项远端数据都经 /ms/monitor/host/profile/** 由后端转发到主机上的 Agent / SSH / WinRM；</li>
 *   <li>通道不可达时必须把原因显式呈现在页面上，不能留一片空白让人以为「这台机器没数据」。</li>
 * </ul>
 *
 * @author CH
 * @since 4.0.0
 */
import { message } from "@repo/core";
import { computed, defineAsyncComponent, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { ElMessageBox } from "element-plus";
import {
  applySystemConfig,
  closeNetProcess,
  deleteHostEnvVar,
  fetchDeletedFiles,
  fetchHostProfile,
  fetchHostProfileSection,
  fetchMounts,
  fetchSystemConfigs,
  killProcess,
  mountDevice,
  releaseDeletedFile,
  restartHostProcess,
  restartService,
  setHostEnvVar,
  startService,
  stopService,
  unmountDevice,
} from "../api";
import { osIconSvg } from "../utils/osIcon";
import { privateIpTextOf } from "../utils/hostProfileUi";
import * as echarts from "echarts";
import HostFileManager from "../components/HostFileManager.vue";

/**
 * 画像分区全部异步化。
 *
 * <p>一个工作区页签只承载一个分区，若同步导入全部分区，打开「进程」也会把磁盘、
 * 端口、网络、防火墙的代码一并下载并实例化。异步组件让每个页签只加载自己那份。</p>
 */
const ProfileDisks = defineAsyncComponent(() => import("../components/profile/ProfileDisks.vue"));
const ProfileProcesses = defineAsyncComponent(() => import("../components/profile/ProfileProcesses.vue"));
const ProfileServices = defineAsyncComponent(() => import("../components/profile/ProfileServices.vue"));
const ProfilePorts = defineAsyncComponent(() => import("../components/profile/ProfilePorts.vue"));
const ProfileNetwork = defineAsyncComponent(() => import("../components/profile/ProfileNetwork.vue"));
const ProfileEnv = defineAsyncComponent(() => import("../components/profile/ProfileEnv.vue"));
const ProfileFirewall = defineAsyncComponent(() => import("../components/profile/ProfileFirewall.vue"));
const ProfileMounts = defineAsyncComponent(() => import("../components/profile/ProfileMounts.vue"));
const ProfileSystemConfig = defineAsyncComponent(() => import("../components/profile/ProfileSystemConfig.vue"));
const ProfileDeletedFiles = defineAsyncComponent(() => import("../components/profile/ProfileDeletedFiles.vue"));
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
type SectionKey =
  | "ports"
  | "processes"
  | "services"
  | "disks"
  | "network"
  | "env"
  | "firewall"
  | "mounts"
  | "sysconfig"
  | "deleted";

/** 分区定义（各分区走对应采集端点） */
const sections: Array<{ name: SectionKey; label: string }> = [
  { name: "ports", label: "监听端口" },
  { name: "processes", label: "进程" },
  { name: "services", label: "服务" },
  { name: "disks", label: "磁盘" },
  { name: "mounts", label: "挂载盘" },
  { name: "network", label: "网络" },
  { name: "env", label: "环境变量" },
  { name: "firewall", label: "防火墙" },
  { name: "sysconfig", label: "主机配置" },
  { name: "deleted", label: "已删除文件" },
];

/** 每页条数在 localStorage 里的键（与主机资产「画像偏好」共用） */
const IPROF_PAGE_SIZE_KEY = "monitor:host-profile:page-size";
const IPROF_AUTO_REFRESH_KEY = "monitor:host-profile:auto-refresh";
const IPROF_REFRESH_SEC_KEY = "monitor:host-profile:refresh-seconds";
/** 自动刷新间隔（秒，画像偏好可配，默认 10） */
const autoRefreshSeconds = ref(Number(localStorage.getItem(IPROF_REFRESH_SEC_KEY)) || 10);
/** 自动刷新周期（毫秒，跟随画像偏好） */
const AUTO_REFRESH_MILLIS = computed(() => Math.max(5, autoRefreshSeconds.value) * 1000);
/** 自动刷新默认开关（画像偏好可配，默认关） */
const autoRefresh = ref(localStorage.getItem(IPROF_AUTO_REFRESH_KEY) === "true");
/** 每页条数（localStorage 记忆，默认 50） */
const pageSize = ref(Number(localStorage.getItem(IPROF_PAGE_SIZE_KEY)) || 50);
/** 自动刷新剩余秒（倒计时显示，0 时刷新并复位） */
const countdown = ref(0);

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
/** 分页（仅进程 / 服务 / 端口 / 防火墙生效） */
const page = ref(1);
/** 检索关键字：后端分页分区由后端跨页匹配，非分页分区在前端过滤 */
const sectionKeyword = ref("");
/** 后端返回当前分区过滤后总行数（分页分区为 total，非分页分区为 rows.length） */
const sectionTotal = ref(0);
/** 后端是否因达到采集上限而截断（仅分页分区） */
const sectionTruncated = ref(false);

/** 页码与关键字是同一套定位状态，切换主机 / 分区时必须一起归零 */
function resetPager(): void {
  page.value = 1;
  sectionKeyword.value = "";
  sectionTotal.value = 0;
  sectionTruncated.value = false;
}

/** 提交一次检索：回到第一页重新拉取（仅后端分页分区需要） */
function applyKeyword(): void {
  page.value = 1;
  loadSection();
}

/**
 * 偏好读回：画像页面「自动刷新开关 / 刷新间隔 / 每页条数」现在只由右键菜单的「系统设置」弹窗设置，
 * 画像页签本身只负责展示并实时跟随弹窗写回的 localStorage（`monitor:host-profile:*`）。
 */
function syncPrefs(): void {
  const ar = localStorage.getItem(IPROF_AUTO_REFRESH_KEY) === "true";
  if (ar !== autoRefresh.value) autoRefresh.value = ar;
  const sec = Number(localStorage.getItem(IPROF_REFRESH_SEC_KEY)) || 10;
  if (sec !== autoRefreshSeconds.value) autoRefreshSeconds.value = sec;
  const size = Number(localStorage.getItem(IPROF_PAGE_SIZE_KEY)) || 50;
  if (size !== pageSize.value) pageSize.value = size;
}

/**
 * 偏好同步循环（2 秒轮询一次 localStorage）：只读回、不写回（每页条数的写回归弹窗）；
 * 偏好变更时通过 watcher 自动重启动自动刷新并更新每页条数。
 */
let syncTicker: number | undefined;
function startPrefSync(): void {
  if (syncTicker) return;
  syncTicker = window.setInterval(syncPrefs, 2000);
}

/**
 * 检索框输入回调。
 *
 * <p>输入过程只更新本地关键字：非分页分区立刻在前端过滤，分页分区也先在当前页内过滤，
 * 不打后端 —— 每敲一个字符就发一次 SSH 采集是不可接受的。</p>
 */
function onSearch(keyword: string): void {
  sectionKeyword.value = keyword;
}

/**
 * 用户确认检索（回车 / 点搜索 / 清空）。
 *
 * <p>只有后端分页的分区需要重新请求，因为关键字参与后端过滤；
 * 非分页分区（磁盘 / 环境变量）数据已全量在本地，改关键字即生效。</p>
 */
function onCommit(keyword: string): void {
  sectionKeyword.value = keyword;
  if (pagedSection.value) applyKeyword();
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
/** 已删除文件采集：平台是否支持 + 不支持原因（如 Windows 通道未接入） */
const deletedSupported = ref(true);
const deletedReason = ref("");
let timer: number | undefined;
let ticker: number | undefined;
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
/**
 * Agent 是否就绪。
 *
 * <p>嵌入模式不再拉整份画像（那是「打开一个分区却发全部分区请求」的根因），
 * 手头没有 info/snapshot，就退回主机台账上的安装标记，不再显示成「未就绪」。</p>
 */
const agentReady = computed(() =>
  String(info.value.agentVersion || "").trim() !== ""
  || Number(snapshot.value.serverHostAgentInstalled ?? 0) === 1
  || (props.embedded && Number(selectedHost.value?.serverHostAgentInstalled ?? 0) === 1));
const agentVersion = computed(() => String(info.value.agentVersion
  || snapshot.value.serverHostAgentVersion
  || (props.embedded ? selectedHost.value?.serverHostAgentVersion : "")
  || ""));
const isAgentMode = computed(() =>
  String(selectedHost.value?.serverHostCollectMode ?? "").toUpperCase() === "AGENT");
/** 进程 / 服务 / 监听端口 / 防火墙 均由后端分页（后台只返回当前页） */
const pagedSection = computed(() =>
  active.value === "processes" || active.value === "services"
  || active.value === "ports" || active.value === "firewall");

/** 各分区检索框的命中字段提示 */
const KEYWORD_HINTS: Record<string, string> = {
  processes: "PID / 进程名 / 用户 / 命令行",
  services: "服务名 / 显示名 / 状态",
  ports: "端口 / 地址 / 状态 / 进程名",
  disks: "盘符 / 卷标 / 文件系统",
  env: "变量名 / 变量值",
  firewall: "规则名 / 链 / 方向 / 动作 / 协议 / 端口",
  mounts: "设备 / 挂载点 / 文件系统",
  sysconfig: "配置键 / 说明",
  deleted: "路径 / 进程名 / PID",
};
const keywordPlaceholder = computed(() => KEYWORD_HINTS[active.value] ?? "关键字过滤");

/**
 * 交给分区组件的行。
 *
 * <p>后端分页分区拿到的已是过滤后的当前页，原样下发；
 * 非分页分区（磁盘 / 环境变量）在后端不分页，这里在前端按任一字段命中过滤。</p>
 */
const clientRows = computed<Record<string, any>[]>(() => {
  if (pagedSection.value) return rows.value;
  const kw = sectionKeyword.value.trim().toLowerCase();
  if (!kw) return rows.value;
  return rows.value.filter(r => Object.values(r).some(v =>
    v !== null && v !== undefined && String(v).toLowerCase().includes(kw)));
});

/** 非分页分区的「总数」口径是过滤后的行数 */
const sectionCount = computed(() =>
  pagedSection.value ? sectionTotal.value : clientRows.value.length);

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
      // 嵌入模式只拉本分区：打开「进程」不该顺带把概要 / 磁盘 / 端口等请求都打到后台
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
  // 嵌入模式不拉整份画像：分区页签只请求自己这一块
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
    // 三个新分区走各自的专用端点，不混进画像分区的分页协议
    if (sec === "mounts") {
      const res = await fetchMounts(hid);
      if (req !== sectionReq || selectedId.value !== hid || active.value !== sec) return;
      rows.value = Array.isArray(res) ? res : [];
      sectionTotal.value = rows.value.length;
      return;
    }
    if (sec === "sysconfig") {
      const res = await fetchSystemConfigs(hid);
      if (req !== sectionReq || selectedId.value !== hid || active.value !== sec) return;
      rows.value = Array.isArray(res) ? res : [];
      sectionTotal.value = rows.value.length;
      return;
    }
    if (sec === "deleted") {
      const res = await fetchDeletedFiles(hid);
      if (req !== sectionReq || selectedId.value !== hid || active.value !== sec) return;
      deletedSupported.value = res?.supported !== false;
      deletedReason.value = String(res?.reason ?? "");
      rows.value = Array.isArray(res?.rows) ? res.rows : [];
      sectionTotal.value = rows.value.length;
      return;
    }
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
  if (!props.embedded) loadProfile(true);
  loadSection();
}

/**
 * 刷新当前视图。
 *
 * <p>嵌入模式只有本分区这一份数据，刷新它即可；非嵌入模式还要更新左侧概要，
 * 所以两处按钮都走这里，避免在模板里重复判断。</p>
 */
function refreshCurrent(): void {
  if (!props.embedded) loadProfile(true);
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

/* ================== 挂载盘 ================== */

/** 挂载：后端先建目录再挂载，并用 mountpoint 回查确认 */
async function onMountDevice(payload: { source: string; target: string; fsType: string }): Promise<void> {
  const hid = actionHostId();
  if (hid == null) return;
  const fs = payload.fsType ? `（${payload.fsType}）` : "";
  if (!await confirmAction(`确定把 ${payload.source}${fs} 挂载到 ${payload.target}？`)) return;
  await runAction(`mount-${payload.target}`, mountDevice(hid, payload.source, payload.target, payload.fsType));
}

/** 卸载：后端 umount 后回查挂载点是否消失 */
async function onUnmountDevice(row: Record<string, any>): Promise<void> {
  const target = String(row.target ?? "");
  if (!target) return;
  const hid = actionHostId();
  if (hid == null) return;
  if (!await confirmAction(`确定卸载 ${target}？正在使用该目录的进程会开始报错。`)) return;
  await runAction(`umount-${target}`, unmountDevice(hid, target));
}

/* ================== 系统配置（热更新） ================== */

/**
 * 应用一项系统配置。
 *
 * <p>所有改动都先弹一次 MessageBox 说明「生效时机 + 风险」；标记为重要项（requiresConfirm）
 * 的再弹第二次，避免用户把回车当成确认把句柄上限改小。后端写后会回读，失败原因原样返回。</p>
 */
async function onApplyConfig(payload: {
  key: string;
  value: string;
  label: string;
  tip: string;
  hot: boolean;
  requiresConfirm: boolean;
}): Promise<void> {
  const hid = actionHostId();
  if (hid == null) return;
  const timing = payload.hot ? "立即生效：写入后直接对后续行为生效" : "需重启 / 新登录：已运行进程不变";
  const first = `配置项：${payload.label}（${payload.key}）\n新值：${payload.value}\n${timing}\n\n${payload.tip}`;
  if (!await confirmAction(first)) return;
  if (payload.requiresConfirm) {
    if (!await confirmAction(`重要配置项二次确认：确定修改「${payload.label}」为 ${payload.value}？\n\n${payload.tip}`)) return;
  }
  await runAction(`cfg-${payload.key}`, applySystemConfig(hid, payload.key, payload.value));
}

/* ================== 已删除但仍被占用的文件 ================== */

/** 释放已删除文件：只截断 deleted 的 fd，进程继续运行 */
async function onReleaseDeleted(row: Record<string, any>): Promise<void> {
  const pid = Number(row.pid);
  const fd = Number(row.fd);
  const hid = actionHostId();
  if (hid == null || !Number.isFinite(pid) || !Number.isFinite(fd)) return;
  const name = String(row.path ?? "");
  if (!await confirmAction(
    `确定释放 ${row.sizeText || row.sizeBytes || ""}？\n${name}\n持有进程：${row.process ?? "?"}（PID ${pid} / PPID ${row.ppid ?? "?"}），fd ${fd}\n\n`
    + "释放方式是把该句柄截断为 0，进程不会中断，但它在读这个文件时会拿到空内容。")) return;
  await runAction(`deleted-${pid}-${fd}`, releaseDeletedFile(hid, pid, fd));
}

/** 复制文本：优先剪贴板 API，非安全上下文回退到临时 textarea */
async function copyText(text: string, label: string): Promise<void> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      const el = document.createElement("textarea");
      el.value = text;
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    message.success(`${label || "内容"}已复制`);
  } catch {
    message.warning("复制失败，请手动选择文本");
  }
}

/* ================== 进程内存分析（矩形树图，弹窗） ================== */

const analyzeVisible = ref(false);
const treemapRef = ref<HTMLElement | null>(null);
let treemap: echarts.ECharts | null = null;
let resizeObserver: ResizeObserver | null = null;

/** 仅进程分区可分析；切换分区时自动销毁图表 */
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
  return rows.value
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
  } else {
    if (resizeObserver) { resizeObserver.disconnect(); resizeObserver = null; }
    if (treemap) { treemap.dispose(); treemap = null; }
  }
});

/** 进程数据刷新后同步矩形树图 */
watch(rows, () => {
  if (showAnalyze.value && treemap) treemap.setOption(buildTreemapOption(), true);
});

onBeforeUnmount(() => {
  if (resizeObserver) resizeObserver.disconnect();
  if (treemap) treemap.dispose();
});

/* ================== 自动刷新（默认关；开启后数字倒计时） ================== */

function restartTimer(): void {
  // 偏好可能在「系统设置」弹窗里被改写：先读回再启动（自动刷新 / 间隔立即生效）
  syncPrefs();
  startPrefSync();
  if (timer) {
    window.clearInterval(timer);
    timer = undefined;
  }
  if (ticker) {
    window.clearInterval(ticker);
    ticker = undefined;
  }
  countdown.value = 0;
  if (!autoRefresh.value) return;
  countdown.value = autoRefreshSeconds.value;
  // 秒级记时：倒数到 0 → 执行一次刷新并复位
  ticker = window.setInterval(() => {
    countdown.value -= 1;
    if (countdown.value <= 0) {
      countdown.value = autoRefreshSeconds.value;
      if (!selectedHost.value || document.hidden) return;
      if (!props.embedded) loadProfile();
      loadSection();
    }
  }, 1000);
  // 兜底周期刷新（与倒计时同频，避免页面 hidden 期间倒计时空跑导致刷新漂移）
  timer = window.setInterval(() => {
    if (document.hidden) return;
    if (countdown.value === autoRefreshSeconds.value) {
      if (selectedHost.value) {
        if (!props.embedded) loadProfile();
        loadSection();
      }
    }
  }, AUTO_REFRESH_MILLIS.value);
}
watch(autoRefresh, restartTimer);
watch(selectedId, () => { if (autoRefresh.value && !timer) restartTimer(); });
/** 自动刷新间隔（画像偏好变更时重算倒计时与周期） */
watch(autoRefreshSeconds, () => {
  if (autoRefresh.value) restartTimer();
});
/**
 * 偏好变更在 2 秒内读回（系统设置弹窗是 `monitor:host-profile:*` 的唯一写入口），
 * 同时启动已开启的自动刷新定时器（watcher 不响应初始值）。
 */
onMounted(() => {
  syncPrefs();
  startPrefSync();
  if (autoRefresh.value && !timer) restartTimer();
});
onBeforeUnmount(() => {
  if (ticker) window.clearInterval(ticker);
  if (timer) window.clearInterval(timer);
  if (syncTicker) window.clearInterval(syncTicker);
  syncTicker = undefined;
});

/* ================== 展示辅助 ================== */

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
  if (configured === "SSH" || configured === "TELNET" || configured === "RDP" || configured === "VNC") return configured.toLowerCase();
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

/** 文件管理器弹窗 */
const fileManagerVisible = ref(false);
const fileManagerPath = ref("");
const fileManagerPlatform = computed(() => String(selectedHost.value?.serverHostOsType || "LINUX"));
/** 打开某块磁盘的根目录（路径口径由 ProfileDisks 算好后传入，这里只负责开窗） */
function openFileManager(root: string): void {
  fileManagerPath.value = root || "/";
  fileManagerVisible.value = true;
}

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
    { label: "内网 IP", value: show(privateIpTextOf(p.serverHostPrivateIp ?? i.privateIp), "—"), mono: true },
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
              @click="refreshCurrent">刷新主机</ReButton>
            <ReButton v-if="isAgentMode && !agentReady && selectedHost?.serverHostSshEnabled === 1" icon="Download" layout="square" type="success"
              @click="emit('deploy-agent', selectedHost)">安装 Agent</ReButton>
            <ReButton v-if="selectedHost?.serverHostRemoteEnabled === 1" :disabled="selectedHost?.serverHostStatus !== 1" :title="selectedHost?.serverHostStatus !== 1 ? '主机已禁用，启用后才能远控' : '连接'" icon="Connection" layout="square" @click="emit('connect', selectedHost)">连接</ReButton>
            <ReButton icon="TrendCharts" layout="square" @click="emit('detail', selectedHost)">监控详情</ReButton>
            <ReButton icon="EditPen" layout="square" @click="emit('edit', selectedHost)">编辑</ReButton>
            <label class="auto-switch" :title="autoRefresh ? '自动刷新中；可在右键菜单 → 系统 → 系统设置中调整间隔' : '自动刷新已关闭；可在右键菜单 → 系统 → 系统设置中开启'">
              <span>{{ autoRefresh ? `自动刷新 ${countdown}s` : '自动刷新已关闭' }}</span>
            </label>
            <span v-if="pagedSection" class="ph-pagesize" title="由「系统设置」弹窗设定">每页 {{ pageSize }} 条</span>
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
              @click="refreshCurrent">刷新</ReButton>
            <ReButton v-if="isAgentMode && !agentReady && selectedHost?.serverHostSshEnabled === 1" icon="Download" layout="square" type="success"
              @click="emit('deploy-agent', selectedHost)">安装 Agent</ReButton>
            <label class="auto-switch" :title="autoRefresh ? '自动刷新中；可在右键菜单 → 系统 → 系统设置中调整间隔' : '自动刷新已关闭；可在右键菜单 → 系统 → 系统设置中开启'">
              <span>{{ autoRefresh ? `自动刷新 ${countdown}s` : '自动刷新已关闭' }}</span>
            </label>
            <span v-if="pagedSection" class="ph-pagesize" title="由「系统设置」弹窗设定">每页 {{ pageSize }} 条</span>
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

        <!-- 资源仪表已移除，概览条与分区数据足以反映主机状态 -->

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
          <!-- 磁盘：进程磁盘活动表（缺活动字段时降级为分区容量表） -->
          <ProfileDisks
            v-if="active === 'disks'"
            :rows="clientRows"
            :keyword="sectionKeyword"
            :loading="loadingSection"
            :error="sectionError"
            :total="sectionCount"
            @search="onSearch"
            @commit="onCommit"
            @refresh="loadSection"
            @open="openFileManager"
          />

          <!-- 进程：排名条 + 展开详情 -->
          <ProfileProcesses
            v-else-if="active === 'processes'"
            :rows="clientRows"
            :keyword="sectionKeyword"
            :loading="loadingSection"
            :error="sectionError"
            :host-id="selectedHost.id"
            paged
            :page="page"
            :page-size="pageSize"
            :total="sectionTotal"
            :truncated="sectionTruncated"
            :busy-key="busyRow"
            @search="onSearch"
            @commit="onCommit"
            @page="changePage"
            @refresh="loadSection"
            @restart="onRestartProcess"
            @kill="onKillProcess"
            @analyze="toggleAnalyze"
          />

          <!-- 服务：运行中 / 已停止 双列 -->
          <ProfileServices
            v-else-if="active === 'services'"
            :rows="clientRows"
            :keyword="sectionKeyword"
            :loading="loadingSection"
            :error="sectionError"
            paged
            :page="page"
            :page-size="pageSize"
            :total="sectionTotal"
            :truncated="sectionTruncated"
            :busy-key="busyRow"
            @search="onSearch"
            @commit="onCommit"
            @page="changePage"
            @refresh="loadSection"
            @start="(r: Record<string, any>) => onServiceAction(r, 'start')"
            @stop="(r: Record<string, any>) => onServiceAction(r, 'stop')"
            @restart="(r: Record<string, any>) => onServiceAction(r, 'restart')"
          />

          <!-- 监听端口：按协议分组的端口块 -->
          <ProfilePorts
            v-else-if="active === 'ports'"
            :rows="clientRows"
            :keyword="sectionKeyword"
            :loading="loadingSection"
            :error="sectionError"
            paged
            :page="page"
            :page-size="pageSize"
            :total="sectionTotal"
            :truncated="sectionTruncated"
            :busy-key="busyRow"
            @search="onSearch"
            @commit="onCommit"
            @page="changePage"
            @refresh="loadSection"
            @close="onClosePortProcess"
          />

          <!-- 挂载盘：设备 / 挂载点 / 容量，支持挂载与卸载（后端动作后回查） -->
          <ProfileMounts
            v-else-if="active === 'mounts'"
            :rows="clientRows"
            :keyword="sectionKeyword"
            :loading="loadingSection"
            :error="sectionError"
            :busy-key="busyRow"
            @search="onSearch"
            @commit="onCommit"
            @refresh="loadSection"
            @mount="onMountDevice"
            @unmount="onUnmountDevice"
          />

          <!-- 网络：网卡总览卡 + 原有配置能力 -->
          <ProfileNetwork
            v-else-if="active === 'network'"
            :host-id="selectedHost.id"
            :rows="rows"
            :platform="selectedHost.serverHostOsType"
            :loading="loadingSection"
            :error="sectionError"
            @refresh="loadSection"
            @applied="onNetworkApplied"
          />

          <!-- 环境变量：键值台账 -->
          <ProfileEnv
            v-else-if="active === 'env'"
            :rows="clientRows"
            :keyword="sectionKeyword"
            :loading="loadingSection"
            :error="sectionError"
            :busy-key="busyRow"
            @search="onSearch"
            @commit="onCommit"
            @refresh="loadSection"
            @add="openEnvDialog"
            @remove="onDeleteEnv"
            @copy="copyText"
          />

          <!-- 防火墙：方向优先的规则行 -->
          <ProfileFirewall
            v-else-if="active === 'firewall'"
            :rows="clientRows"
            :keyword="sectionKeyword"
            :loading="loadingSection"
            :error="sectionError"
            paged
            :page="page"
            :page-size="pageSize"
            :total="sectionTotal"
            :truncated="sectionTruncated"
            @search="onSearch"
            @commit="onCommit"
            @page="changePage"
            @refresh="loadSection"
          />

          <!-- 系统配置：句柄上限 / 用户限制 / 全局权限，支持热更新与二次确认 -->
          <ProfileSystemConfig
            v-else-if="active === 'sysconfig'"
            :rows="clientRows"
            :keyword="sectionKeyword"
            :loading="loadingSection"
            :error="sectionError"
            :busy-key="busyRow"
            @search="onSearch"
            @commit="onCommit"
            @refresh="loadSection"
            @apply="onApplyConfig"
          />

          <!-- 已删除文件：被进程占用但已 unlink 的文件，可截断释放空间 -->
          <ProfileDeletedFiles
            v-else
            :rows="clientRows"
            :keyword="sectionKeyword"
            :loading="loadingSection"
            :error="sectionError"
            :supported="deletedSupported"
            :reason="deletedReason"
            :busy-key="busyRow"
            @search="onSearch"
            @commit="onCommit"
            @refresh="loadSection"
            @release="onReleaseDeleted"
          />
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

    <!-- 进程内存分析弹窗 -->
    <ReDialog
      v-model="analyzeVisible"
      title="进程内存占用"
      width="880px"
      top="8vh"
      append-to-body
      destroy-on-close
      class="host-analyze-dialog"
    >
      <div class="analyze-hint dim">按当前页进程内存（MB）绘制矩形树图，色深表示占用档位。</div>
      <div ref="treemapRef" class="analyze-chart"></div>
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
   再补一条 flex 让面板高度被吃满，避免内容只占半屏、下方留白 */
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
/* 嵌入到工作区页签：整页只有一个滚动条 —— 由内层内容自己滚，
   外层只负责纵向 flex 分配高度，避免内外双滚动条抢滚轮 */
.profile.is-embedded .profile-detail { overflow: hidden; min-height: 0; padding: 12px 14px; }
.detail-empty { height: 100%; display: flex; align-items: center; justify-content: center; }
.profile-head { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; padding-bottom: 14px; border-bottom: 1px solid var(--border-subtle); }
/* 嵌入模式的紧凑工具条：只有状态胶囊与刷新，压缩高度把空间让给数据区 */
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
.ph-pagesize { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-tertiary);
  padding: 4px 10px; border-radius: 999px; border: 1px solid var(--border-subtle); background: var(--bg-fill, #f5f6fa); }

.alert { margin: 12px 0 0; padding: 10px 12px; border-radius: 8px; font-size: 12.5px; line-height: 1.7; }
.alert-error { background: rgba(245, 108, 108, .1); border: 1px solid rgba(245, 108, 108, .3); color: var(--status-error-text, #d9484b); }
.alert-warn { background: rgba(230, 162, 60, .1); border: 1px solid rgba(230, 162, 60, .3); color: var(--status-warning-text, #b8741a); }

.seg { display: flex; gap: 4px; flex-wrap: wrap; margin: 16px 0 0; padding: 4px; border-radius: 10px; background: var(--bg-fill, #f5f6fa); }
.seg-item {
  border: 0; background: transparent; color: var(--text-secondary, #5c6070); font-size: 13px; padding: 6px 14px;
  border-radius: 8px; cursor: pointer; transition: all .15s;
  &:hover { color: var(--brand-600, #6d5ce7); }
  &.active { background: var(--bg-container, #fff); color: var(--brand-600, #6d5ce7); font-weight: 600; box-shadow: 0 1px 4px rgba(20, 20, 40, .08); }
}
.seg-body { display: flex; flex: 1 1 auto; flex-direction: column; min-height: 0; padding: 12px 0 20px; }
.profile.is-embedded .seg-body { padding-bottom: 0; }
.mono { font-family: var(--font-mono, monospace); }
.dim { color: var(--text-tertiary, #a0a4b0); }

/* 进程内存分析弹窗 */
.analyze-hint { margin-bottom: 8px; font-size: 12px; }
.analyze-chart { width: 100%; height: 460px; }

/* 子弹窗表单 */
.sub-form { display: grid; grid-template-columns: 84px 1fr; align-items: center; gap: 12px 14px; }
.sub-label { font-size: 12.5px; color: var(--text-tertiary); }

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
  display: flex; align-items: baseline; gap: 10px; padding: 6px 2px;
  border-bottom: 1px dashed var(--border-subtle);
}
.rs-label { flex: none; width: 76px; font-size: 11.5px; color: var(--text-tertiary); }
.rs-val { flex: 1; min-width: 0; font-size: 12.5px; word-break: break-all; text-align: right; }
.rs-gone { padding: 30px 14px; text-align: center; font-size: 13px; color: var(--text-tertiary); }
</style>
