<script setup lang="ts">
/**
 * 内网穿透页面（@pages/tunnel）
 *
 * <p><strong>一个页面、一套接口、一条链路。</strong>后端把 ngrok 与 Cloudflare
 * Tunnel 收敛成同一个 SPI（{@code TunnelProvider}）+ 同一个控制器
 * （{@code /ms/tunnel}），提供方只是映射记录上的一个字段。</p>
 *
 * <p>版式按「左栏 + 画布 + 详情」三段组织：左栏按提供方分组列出映射，右上画布
 * 把每条映射画成「本机端口 → 提供方 / 模式 → 公网入口」，右下是选中映射的详情
 * 与本实例最近事件。</p>
 *
 * <p>页面不画顶栏，标题、实例标识、计数与筛选收进一块与内容同宽的卡片。卡面
 * 与设备资产页（{@code @pages/device} 的 {@code .da-rail} / {@code .da-card}）
 * 同一档：页面是 {@code --bg-page} 灰底，卡片是 {@code --bg-container} 白面
 * 加 {@code --shadow-sm} 软阴影，靠「白面浮在灰底上」分块，不用重描边。颜色一律
 * 取 koi 令牌（{@code packages/theme/src/styles/tokens.css}），暗色主题下同样
 * 可读。</p>
 *
 * <p>新增与编辑仍是同一个弹窗，入口在顶部卡片与详情栏。</p>
 *
 * @author CH
 * @since 4.0.0.52
 */
import { computed, onMounted, onUnmounted, ref, toRef, watch } from "vue";
import { message, msgError, msgSuccess } from "@repo/core";
import { usePersistentFilters } from "@repo/utils";
import ReButton from "@repo/ui/re-button";
import ReDialog from "@repo/ui/re-dialog";
import ReIcon from "@repo/ui/re-icon";
import ReInput from "@repo/ui/re-input";
import ReSelect from "@repo/ui/re-select";
import ReSkeleton from "@repo/ui/re-skeleton";
import ReSwitch from "@repo/ui/re-switch";
import {
  createTunnel,
  deleteTunnel,
  listTunnelProviders,
  listTunnels,
  startTunnel,
  stopTunnel,
  subscribeTunnelStream,
  updateTunnel,
} from "../api/tunnelApi";
import type { TunnelMode, TunnelProvider, TunnelProviderInfo, TunnelRecord, TunnelView } from "../api/types";

/** 组件名固定：宿主 keep-alive 按组件名（不是路由名）登记缓存 */
defineOptions({ name: "TunnelPage" });

/** 模式中文名；后端只回模式标识，展示文案由页面统一给 */
const MODE_LABELS: Record<string, string> = {
  http: "HTTP 转发",
  tcp: "TCP 转发",
  tls: "TLS 隧道",
  quick: "Quick Tunnel（免账号）",
  named: "Named Tunnel（需 Token）",
};

/** 链路上的模式短名：画布中间那枚 pill 只有 152px，长文案会挤掉提供方名 */
const SHORT_MODE_LABELS: Record<string, string> = {
  http: "HTTP",
  tcp: "TCP",
  tls: "TLS",
  quick: "Quick",
  named: "Named",
};

/**
 * 模式展示名。
 *
 * @param mode 模式标识
 * @returns 展示文案，未登记的模式原样返回
 */
function modeLabel(mode: string): string {
  return MODE_LABELS[mode] ?? mode;
}

/**
 * 模式短名（链路画布用）。
 *
 * @param mode 模式标识
 * @returns 短名称，未登记的模式原样返回
 */
function shortMode(mode: string): string {
  return SHORT_MODE_LABELS[mode] ?? mode;
}

/* ==================== 列表与运行态 ==================== */

/**
 * 把异常转成可读文案。
 *
 * @param e 捕获到的异常
 * @returns 提示文案
 */
function errText(e: unknown): string {
  return e instanceof Error && e.message ? e.message : "请求失败";
}

/** 全部映射（不按提供方筛选：提供方已是链路上的一个节点） */
const rows = ref<TunnelView[]>([]);

/** 列表加载态 */
const loading = ref(false);

/** 列表加载失败原因；非空时左栏与画布都显示「加载失败 + 重试」，不谎报「还没有映射」 */
const loadError = ref("");

/**
 * 页面时基。
 *
 * <p>「已运行 2h14m」这类文案若直接用 {@code Date.now()} 渲染，会冻结在挂载那一刻，
 * 之后不再变。由 10s 心跳推进本值，模板依赖它重算，同时不产生任何请求。</p>
 */
const now = ref(Date.now());

/** 后端已注册的提供方（下拉与模式选项的唯一来源） */
const providers = ref<TunnelProviderInfo[]>([]);

/** 链路状态：异常优先于运行中，未运行且无错误为已停止 */
type TunnelState = "running" | "error" | "stopped";

/** 状态文案（颜色之外再给一次文字，色弱也能读） */
const STATE_LABELS: Record<TunnelState, string> = {
  running: "运行中",
  error: "异常",
  stopped: "已停止",
};

/**
 * 推导一条映射的展示状态。
 *
 * @param row 映射行
 * @returns 链路状态
 */
function stateOf(row: TunnelView): TunnelState {
  if (row.running) return "running";
  if (row.error) return "error";
  return "stopped";
}

const runningCount = computed(() => rows.value.filter((row) => stateOf(row) === "running").length);
const errorCount = computed(() => rows.value.filter((row) => stateOf(row) === "error").length);
const stoppedCount = computed(() => rows.value.filter((row) => stateOf(row) === "stopped").length);

/**
 * 左栏筛选（状态 + 搜索词）持久化：localStorage 记忆 + 路由 query 同步。
 *
 * <p>切走再切回来筛选不丢；带 {@code ?state=error&search=xxx} 的链接可直接分享定位。
 * query 里的脏值（不在状态枚举内）回落后立即归位为「全部」。</p>
 */
const { filters: listFilters } = usePersistentFilters({
  key: "tunnel.list",
  defaults: { state: "all" as "all" | TunnelState, search: "" },
  queryKeys: ["state", "search"],
});
if (!["all", "running", "error", "stopped"].includes(listFilters.state)) {
  listFilters.state = "all";
}

const filters = computed(() => [
  { value: "all" as const, label: "全部", count: rows.value.length },
  { value: "running" as const, label: "在线", count: runningCount.value },
  { value: "error" as const, label: "异常", count: errorCount.value },
  { value: "stopped" as const, label: "已停止", count: stoppedCount.value },
]);

/** 状态筛选（与 listFilters.state 双向同步，保留原模板变量名） */
const filter = toRef(listFilters, "state");

/** 左栏搜索词：名称 / 端口 / 域名 / 公网地址都能命中（与 listFilters.search 双向同步） */
const search = toRef(listFilters, "search");

/** 通过筛选与搜索并排序后的链路：异常 → 在线 → 已停止，稳定排序 */
const visibleRows = computed(() => {
  const rank: Record<TunnelState, number> = { error: 0, running: 1, stopped: 2 };
  const keyword = search.value.trim().toLowerCase();
  return rows.value
    .filter((row) => {
      if (filter.value !== "all" && stateOf(row) !== filter.value) {
        return false;
      }
      if (!keyword) {
        return true;
      }
      const haystack = [
        row.name,
        String(row.localPort ?? ""),
        row.domain,
        row.remoteAddress,
        row.mode,
        row.provider,
        row.remark,
        ...(row.publicUrls ?? []),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(keyword);
    })
    .slice()
    .sort((a, b) => rank[stateOf(a)] - rank[stateOf(b)]);
});

/* ==================== 展示层：分组 / 选中 / 文案 ==================== */

/** 左栏组头小方块里的两个字母 */
const PROVIDER_MARKS: Record<string, string> = { ngrok: "ng", cloudflared: "cf", tailscale: "ts" };

/** 组头小方块的配色档（ngrok 墨黑 / Cloudflare 橙 / Tailscale 深蓝） */
const PROVIDER_MARK_CLASS: Record<string, string> = { ngrok: "ngrok", cloudflared: "cf", tailscale: "ts" };

/**
 * 提供方徽标字母。
 *
 * @param name 提供方标识
 * @returns 两个字母
 */
function providerMark(name: string): string {
  return PROVIDER_MARKS[name] ?? (name || "?").slice(0, 2);
}

/**
 * 提供方徽标配色档。
 *
 * @param name 提供方标识
 * @returns 徽标档名，未登记的回退到 plain
 */
function providerMarkClass(name: string): string {
  return PROVIDER_MARK_CLASS[name] ?? "plain";
}

/**
 * 画布中间的提供方短名。
 *
 * @param name 提供方标识
 * @returns 短名
 */
function providerShort(name: string): string {
  if (name === "cloudflared") return "CF";
  if (name === "tailscale") return "TS";
  return name || "?";
}

/** 分组结构：左栏的组头要显示「N 条 · M 在线」与可用性 */
interface ProviderGroup {
  provider: string;
  label: string;
  mark: string;
  markClass: string;
  total: number;
  running: number;
  /** true 可用 / false 不可用 / null 未知（拿不到该提供方的元数据） */
  available: boolean | null;
  /** 组头可用性 chip 文案：可用 / 不可用 / 未安装… / 未知 */
  chipText: string;
  /** 组头可用性 chip 配色档 */
  chipClass: string;
  /** chip 悬停说明：不可用给后端探测到的原因，未知给解释 */
  chipTitle: string;
  rows: TunnelView[];
}

/**
 * 不可用原因（读后端能力探测结果，前端只做展示映射，不自行判定可用性）。
 *
 * @param info 提供方描述；清单加载失败或提供方未注册时拿不到
 * @returns 分号分隔的原因；无探测依据时返回空串（chip 回退笼统「不可用」）
 */
function unavailableReason(info: TunnelProviderInfo | undefined): string {
  if (!info || info.available !== false) {
    return "";
  }
  const caps = info.capabilities ?? {};
  const reasons: string[] = [];
  if (caps.binaryAvailable === false) {
    reasons.push("未安装客户端");
  }
  // 凭据字段各提供方不同：cloudflared=tokenConfigured / ngrok=authtokenConfigured / tailscale=authKeyConfigured
  const credLabels: Record<string, string> = {
    tokenConfigured: "未配置 Token",
    authtokenConfigured: "未配置 Authtoken",
    authKeyConfigured: "未配置 AuthKey",
  };
  for (const [field, label] of Object.entries(credLabels)) {
    if (caps[field] === false) {
      reasons.push(label);
    }
  }
  return reasons.join("；");
}

/** chip 上的短原因（title 里给全因） */
function shortUnavailable(hint: string): string {
  if (hint.includes("未安装")) {
    return "未安装";
  }
  if (hint.includes("未配置")) {
    return "未配置";
  }
  return "不可用";
}

/**
 * 提供方不可用的原因（空串表示可用或未知）。
 *
 * <p>只在后端明确回 {@code available === false} 时拦截启动；元数据缺失（清单加载失败）
 * 时保持可点，把判定权留在后端，不拿「未知」当「不可用」。</p>
 *
 * @param row 映射行
 * @returns 原因文案；可用 / 未知时为空串
 */
function providerBlocked(row: TunnelView): string {
  const info = providers.value.find((item) => item.name === row.provider);
  if (!info || info.available !== false) {
    return "";
  }
  return unavailableReason(info) || "运行环境不具备执行条件";
}

/**
 * 启动按钮是否禁用（提供方不可用或映射已禁用）。
 *
 * @param row 映射行
 * @returns 禁用则 true
 */
function cannotStart(row: TunnelView): boolean {
  return row.enabled === false || Boolean(providerBlocked(row));
}

/**
 * 启动按钮禁用时的原因（可用时为空串，交给按钮原提示）。
 *
 * @param row 映射行
 * @returns 提示文案
 */
function startBlockedTitle(row: TunnelView): string {
  if (row.enabled === false) {
    return "映射已禁用：先编辑并打开「启用」";
  }
  const blocked = providerBlocked(row);
  return blocked ? `提供方不可用：${blocked}` : "";
}

/** 左栏分组：已注册提供方的顺序优先，未注册的排在后面 */
const groups = computed<ProviderGroup[]>(() => {
  const buckets = new Map<string, TunnelView[]>();
  for (const row of visibleRows.value) {
    const key = String(row.provider ?? "");
    const list = buckets.get(key);
    if (list) {
      list.push(row);
    } else {
      buckets.set(key, [row]);
    }
  }
  const registered = providers.value.map((item) => String(item.name));
  const extra = [...buckets.keys()].filter((key) => !registered.includes(key));
  // 「全部 + 无搜索词」时，注册了却没有映射的提供方也要露头（虚线占位 + 组内新增），
  // 否则用户看不出这台机器支持哪些提供方；一旦按状态筛选或搜索，就只保留有命中的组。
  const showEmptyGroups = filter.value === "all" && !search.value.trim();
  return [...registered, ...extra]
    .filter((key) => buckets.has(key) || showEmptyGroups)
    .map((key) => {
      const list = buckets.get(key) ?? [];
      const info = providers.value.find((item) => String(item.name) === key);
      // 元数据拿不到（清单加载失败 / 提供方未注册）时是「未知」，不能谎报「不可用」
      const available = info ? info.available : null;
      const hint = unavailableReason(info);
      return {
        provider: key,
        label: info?.displayName ?? key,
        mark: providerMark(key),
        markClass: providerMarkClass(key),
        total: list.length,
        running: list.filter((row) => stateOf(row) === "running").length,
        available,
        chipText: available === null ? "未知" : available ? "可用" : shortUnavailable(hint),
        chipClass: available === null ? "chip--muted" : available ? "chip--success" : "chip--warn",
        chipTitle: available === null
          ? "未获取到该提供方的能力信息"
          : available
            ? ""
            : hint || "运行环境不具备执行条件",
        rows: list,
      };
    });
});

/** 当前选中：用户点过就用点过的那条，否则取列表第一条 */
const selectedId = ref<string | null>(null);
const selected = computed<TunnelView | null>(() => {
  const list = visibleRows.value;
  if (!list.length) {
    return null;
  }
  return list.find((row) => row.id === selectedId.value) ?? list[0];
});

watch(
  visibleRows,
  (list) => {
    if (!list.length) {
      selectedId.value = null;
      return;
    }
    if (!list.some((row) => row.id === selectedId.value)) {
      selectedId.value = list[0].id;
    }
  },
  { immediate: true },
);

/**
 * 提供方展示名。
 *
 * @param name 提供方标识
 * @returns 展示名，未注册时退回标识本身
 */
function providerLabel(name: string): string {
  return providers.value.find((item) => item.name === name)?.displayName ?? name;
}

/**
 * 公网入口（取第一条；多入口时在 title 里给全）。
 *
 * @param row 映射行
 * @returns 公网地址，未启动时为空串
 */
function primaryUrl(row: TunnelView): string {
  return row.publicUrls?.[0] ?? "";
}

/** 供 hover 查看全部公网地址 */
function allUrls(row: TunnelView): string {
  return row.publicUrls?.length ? row.publicUrls.join("\n") : "";
}

/**
 * 去掉协议头后的地址（画布与左栏只放得下主机名）。
 *
 * @param url 完整地址
 * @returns 不含协议头的地址
 */
function urlHost(url: string): string {
  return url.replace(/^[a-z][a-z0-9+.-]*:\/\//i, "");
}

/**
 * 画布右端那只盒子的抬头。
 *
 * @param row 映射行
 * @returns HTTPS / HTTP / TCP / 未运行 / 启动失败 / 已禁用
 */
function publicCap(row: TunnelView): string {
  if (stateOf(row) === "error") {
    return "启动失败";
  }
  const url = primaryUrl(row);
  if (url) {
    if (/^https:/i.test(url)) return "HTTPS";
    if (/^http:/i.test(url)) return "HTTP";
    if (/^tcp:/i.test(url)) return "TCP";
    return shortMode(row.mode);
  }
  return row.enabled === false ? "已禁用" : "未运行";
}

/**
 * 没有公网地址时的占位文案。
 *
 * @param row 映射行
 * @returns 占位文案
 */
function publicHint(row: TunnelView): string {
  if (row.enabled === false) {
    return "启用后才能启动";
  }
  const blocked = providerBlocked(row);
  if (blocked) {
    return `提供方不可用（${blocked}）`;
  }
  return row.domain || row.remoteAddress || "启动后由提供方分配";
}

/**
 * 左栏第二行：运行中给主机名，异常给错误原文，其余给域名 / 远程地址。
 *
 * @param row 映射行
 * @returns 一行说明
 */
function navSub(row: TunnelView): string {
  if (stateOf(row) === "error") {
    return row.error || "启动失败";
  }
  const url = primaryUrl(row);
  if (url) {
    return urlHost(url);
  }
  if (row.enabled === false) {
    return "已禁用";
  }
  return row.domain || row.remoteAddress || "未启动";
}

/**
 * 状态点样式。
 *
 * @param row 映射行
 * @returns dot 修饰类
 */
function dotClass(row: TunnelView): string {
  const state = stateOf(row);
  return state === "running" ? "dot--run" : state === "error" ? "dot--err" : "dot--idle";
}

/**
 * 状态胶囊样式。
 *
 * @param row 映射行
 * @returns chip 修饰类
 */
function chipClass(row: TunnelView): string {
  const state = stateOf(row);
  return state === "running" ? "chip--success" : state === "error" ? "chip--error" : "chip--muted";
}

/**
 * 链路虚线的动效档。
 *
 * @param row 映射行
 * @returns wire 修饰类
 */
function wireClass(row: TunnelView): string {
  const state = stateOf(row);
  return state === "running" ? "wire--run" : state === "error" ? "wire--err" : "wire--off";
}

/**
 * 链路两端盒子的描边档。
 *
 * @param row 映射行
 * @returns nbox 修饰类
 */
function boxClass(row: TunnelView): string {
  const state = stateOf(row);
  return state === "running" ? "nbox--run" : state === "error" ? "nbox--err" : "";
}

/**
 * 补零。
 *
 * @param value 数字
 * @returns 两位字符串
 */
function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

/**
 * 时刻（HH:mm）。
 *
 * @param ts 毫秒时间戳
 * @returns 时刻文案
 */
function clockText(ts: number): string {
  const date = new Date(ts);
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

/**
 * 日期 + 时刻（MM-DD HH:mm）。
 *
 * @param ts 毫秒时间戳
 * @returns 日期时刻文案
 */
function dateText(ts: number): string {
  const date = new Date(ts);
  return `${pad2(date.getMonth() + 1)}-${pad2(date.getDate())} ${clockText(ts)}`;
}

/**
 * 已运行时长。
 *
 * @param from 起始毫秒时间戳
 * @returns 形如 2h14m
 */
function durationText(from: number): string {
  // 依赖 now：10s 心跳推进它，文案才会跟着走，而不是停在挂载那一刻
  const seconds = Math.max(0, Math.floor((now.value - from) / 1000));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h${minutes}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${seconds}s`;
}

/**
 * 启动时间文案。
 *
 * @param row 映射行
 * @returns 未运行给破折号
 */
function startedText(row: TunnelView): string {
  if (!row.running) return "—";
  if (!row.startedAt) return "运行中";
  return `${dateText(Number(row.startedAt))} · 已运行 ${durationText(Number(row.startedAt))}`;
}

/**
 * 更新时间文案。
 *
 * @param row 映射行
 * @returns 日期时刻
 */
function updatedText(row: TunnelView): string {
  return row.updatedAt ? dateText(Number(row.updatedAt)) : "—";
}

/**
 * 记录 id 的短形式（详情栏底部只放得下 8 位）。
 *
 * @param id 记录 id
 * @returns 短 id
 */
function shortId(id: string): string {
  return id ? `${id.slice(0, 8)}…` : "—";
}

/** 当前页面所在实例的端口：owner 是完整控制地址，比对端口即可判断「本实例持有」 */
const selfPort = typeof window === "undefined" ? "" : window.location.port;

/** 顶部卡片里的实例标识 */
const selfLabel = selfPort ? `:${selfPort}` : typeof window === "undefined" ? "" : window.location.host;

/**
 * 记录是否由本实例持有。
 *
 * @param row 映射行
 * @returns 是则 true
 */
function isSelfOwner(row: TunnelView): boolean {
  return Boolean(selfPort && row.owner && new RegExp(`:${selfPort}$`).test(row.owner));
}

/**
 * owner 的展示形式（去掉协议与 127.0.0.1，只留 :port）。
 *
 * @param row 映射行
 * @returns 展示文案，无 owner 给破折号
 */
function ownerLabel(row: TunnelView): string {
  if (!row.owner) return "—";
  return row.owner.replace(/^https?:\/\//i, "").replace(/^127\.0\.0\.1/, "");
}

/** 本实例当前持有的链路数 */
const heldCount = computed(() => rows.value.filter((row) => isSelfOwner(row)).length);

/**
 * 新窗口打开公网地址。
 *
 * @param url 公网地址
 */
function openUrl(url: string) {
  if (!url) return;
  window.open(url, "_blank", "noopener,noreferrer");
}

/** 本实例最近事件（内存态：只记录本站点发起的动作与首次加载结果） */
interface TunnelEvent {
  time: string;
  text: string;
  tone: "ok" | "err" | "plain";
}

const events = ref<TunnelEvent[]>([]);

/**
 * 追加一条本实例事件，最多保留 30 条。
 *
 * @param text 事件文案
 * @param tone 语义色
 */
function pushEvent(text: string, tone: TunnelEvent["tone"] = "plain") {
  events.value.unshift({ time: clockText(Date.now()), text, tone });
  if (events.value.length > 30) {
    events.value.length = 30;
  }
}

/** 首次加载后用当前运行态兜底：接口没有事件流，这里只补「运行中的链路」 */
function seedEvents() {
  const running = rows.value
    .filter((row) => row.running && row.startedAt)
    .sort((a, b) => Number(b.startedAt) - Number(a.startedAt))
    .slice(0, 5);
  for (const row of running.slice().reverse()) {
    pushEvent(`${row.name || row.id} 运行中 · 启动于 ${clockText(Number(row.startedAt))}`, "ok");
  }
  if (!running.length && rows.value.length) {
    pushEvent(`已加载 ${rows.value.length} 条映射`, "plain");
  }
}

/**
 * 复制公网地址（HTTP 场景允许没有 Clipboard API）。
 *
 * @param text 待复制文本
 */
async function copyText(text: string) {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    msgSuccess("已复制公网地址");
    return;
  } catch {
    // 退化到 execCommand
  }
  try {
    const area = document.createElement("textarea");
    area.value = text;
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    document.execCommand("copy");
    document.body.removeChild(area);
    msgSuccess("已复制公网地址");
  } catch {
    msgError("复制失败，请手动选择地址");
  }
}

/**
 * 真正拉一次列表。
 *
 * @param silent 失败时是否弹提示（轮询 / 回到前台用 true，手动刷新用 false）
 */
async function pull(silent: boolean) {
  loading.value = true;
  try {
    rows.value = await listTunnels();
    loadError.value = "";
  } catch (e) {
    // 失败不清空列表：保留上一帧数据，只在左栏与画布挂「加载失败 + 重试」。
    // 清空会伪装成「还没有映射」，让人以为记录被删了。
    loadError.value = errText(e);
    if (!silent) {
      msgError(errText(e));
    }
  } finally {
    loading.value = false;
  }
}

/** 手动刷新（刷新按钮 / 重试按钮） */
async function reload() {
  await pull(false);
}

/** 提供方清单加载状态：区分「加载中 / 成功 / 失败」，失败时组头可用性回退「未知」 */
const providersState = ref<"loading" | "ready" | "failed">("loading");

/** 拉提供方清单（失败时列表照常展示，左栏给出可重试的短提示） */
async function reloadProviders() {
  providersState.value = "loading";
  try {
    providers.value = await listTunnelProviders();
    providersState.value = "ready";
  } catch (e) {
    providers.value = [];
    providersState.value = "failed";
    msgError(`提供方加载失败：${errText(e)}`);
  }
}

/* ==================== 实时状态流 ==================== */

/** SSE 连接状态：事件面板角标据此显示「实时 / 重连中 / 离线」 */
const streamState = ref<"idle" | "live" | "retrying">("idle");

/** 当前订阅句柄；null 表示未订阅 */
let stream: { close: () => void } | null = null;

/** 首帧只做基线，不补事件（否则一进页面就刷出一屏「已上线」） */
let streamSeeded = false;

/** 订阅代次：close 后旧连接迟到的回调必须作废，不能把新连接的状态改回「离线」 */
let streamGen = 0;

/** 连续失败次数：共享客户端重试耗尽后不会再重连，角标要落回「离线」而不是永远「重连中」 */
let streamFails = 0;

/**
 * 用前后两帧的差异补事件：只记运行态 / 错误文案的变化与增删。
 *
 * <p>服务端推的是完整快照，没有事件本身；差异在页面侧算，只补「变了的那几条」，
 * 不把每帧都写进面板。</p>
 *
 * @param prev 上一帧
 * @param next 新快照
 */
function diffEvents(prev: TunnelView[], next: TunnelView[]) {
  const before = new Map(prev.map((row) => [row.id, row]));
  for (const row of next) {
    const old = before.get(row.id);
    if (!old) {
      pushEvent(`发现映射「${row.name || row.id}」`, "plain");
      continue;
    }
    if (old.running !== row.running) {
      pushEvent(`${row.name || row.id} ${row.running ? "已上线" : "已停止"}`, row.running ? "ok" : "plain");
      continue;
    }
    if (row.error && row.error !== old.error) {
      pushEvent(`${row.name || row.id} 异常：${row.error}`, "err");
    }
  }
  const nextIds = new Set(next.map((row) => row.id));
  for (const old of prev) {
    if (!nextIds.has(old.id)) {
      pushEvent(`映射「${old.name || old.id}」已移除`, "plain");
    }
  }
}

/** 订阅实时状态流（幂等：已订阅时直接返回） */
function startStream() {
  if (stream) {
    return;
  }
  streamState.value = "retrying";
  streamFails = 0;
  const gen = ++streamGen;
  stream = subscribeTunnelStream({
    onSnapshot: (snapshot) => {
      if (gen !== streamGen) {
        return;
      }
      if (streamSeeded) {
        diffEvents(rows.value, snapshot);
      }
      streamSeeded = true;
      // 快照即完整状态：整体替换，SSE 成功也说明列表接口是通的
      rows.value = snapshot;
      loadError.value = "";
    },
    onOpen: () => {
      if (gen !== streamGen) {
        return;
      }
      streamState.value = "live";
    },
    onError: () => {
      if (gen !== streamGen) {
        return;
      }
      streamFails += 1;
      // 客户端重试耗尽会抛错收场（不再有 onOpen），角标落「离线」，
      // 等页面可见 / 用户刷新再重建；一直挂「重连中」是谎报
      streamState.value = streamFails > 10 ? "idle" : "retrying";
    },
    onClose: () => {
      if (gen !== streamGen) {
        return;
      }
      streamState.value = "idle";
    },
  });
}

/** 主动断开实时状态流 */
function stopStream() {
  if (!stream) {
    return;
  }
  // 先推进代次再 close：close 触发的 onClose 回调看到代次不匹配，直接作废
  streamGen += 1;
  stream.close();
  stream = null;
  streamState.value = "idle";
}

/* ==================== 定时器与可见性 ==================== */

/** 10s 心跳：只推进时基（运行时长文案），不发请求 */
let tickTimer: ReturnType<typeof setInterval> | undefined;

/** 30s 兜底刷新：SSE 断连时列表仍能自愈；页面隐藏时跳过，省一次请求 */
let pollTimer: ReturnType<typeof setInterval> | undefined;

function startTimers() {
  stopTimers();
  tickTimer = setInterval(() => {
    now.value = Date.now();
  }, 10_000);
  pollTimer = setInterval(() => {
    if (document.visibilityState === "visible") {
      void pull(true);
    }
  }, 30_000);
}

function stopTimers() {
  if (tickTimer !== undefined) {
    clearInterval(tickTimer);
    tickTimer = undefined;
  }
  if (pollTimer !== undefined) {
    clearInterval(pollTimer);
    pollTimer = undefined;
  }
}

/**
 * 回到前台：补齐时基、拉一次全量、重建 SSE。
 *
 * <p>浏览器在后台可能掐掉长连接，回来时重建一次比等共享客户端把重试次数耗尽更可靠。</p>
 */
function onVisibilityChange() {
  if (document.visibilityState !== "visible") {
    return;
  }
  now.value = Date.now();
  void pull(true);
  stopStream();
  startStream();
}

onMounted(() => {
  void reloadProviders();
  void reload().then(seedEvents);
  startStream();
  startTimers();
  document.addEventListener("visibilitychange", onVisibilityChange);
});

onUnmounted(() => {
  stopTimers();
  stopStream();
  document.removeEventListener("visibilitychange", onVisibilityChange);
});

/* ==================== 启停 / 删除 ==================== */

/**
 * 启停切换：运行中则停止，否则启动。
 *
 * @param row 链路行
 */
async function onToggle(row: TunnelView) {
  const action = row.running ? "停止" : "启动";
  pendingId.value = row.id;
  try {
    if (row.running) {
      await stopTunnel(row.id);
    } else {
      await startTunnel(row.id);
    }
    msgSuccess(`${action}成功`);
    pushEvent(`${row.name || row.id} ${action}成功`, "ok");
  } catch (e) {
    msgError(`${action}失败：${errText(e)}`);
    pushEvent(`${row.name || row.id} ${action}失败：${errText(e)}`, "err");
  } finally {
    pendingId.value = null;
    await reload();
  }
}

/**
 * 删除映射（先确认）。
 *
 * @param row 链路行
 */
async function onDelete(row: TunnelView) {
  try {
    await message.confirm(`删除后该映射的配置会随之移除，确定删除「${row.name || row.id}」？`, "删除映射", "删除");
  } catch {
    return;
  }
  try {
    await deleteTunnel(row.id);
    msgSuccess("已删除");
    pushEvent(`删除映射「${row.name || row.id}」`, "plain");
    await reload();
  } catch (e) {
    msgError(`删除失败：${errText(e)}`);
  }
}

/* ==================== 新增 / 编辑弹窗 ==================== */

/** 表单模型：端口用字符串承载，避免输入中途被 Number 化后丢字 */
interface TunnelForm {
  provider: string;
  name: string;
  localPort: string;
  mode: string;
  domain: string;
  remoteAddress: string;
  basicAuth: string;
  authtoken: string;
  token: string;
  autoStart: boolean;
  enabled: boolean;
  remark: string;
}

/**
 * 空白表单。
 *
 * <p>默认选中第一个「可用」的提供方，没有可用的就退到第一个 —— 让用户至少
 * 看到后端注册了什么，而不是面对一个空下拉。</p>
 *
 * @returns 表单初值
 */
function emptyForm(): TunnelForm {
  const first = providers.value.find((item) => item.available) ?? providers.value[0];
  return {
    provider: first?.name ?? "",
    name: "",
    localPort: "8080",
    mode: first?.defaultMode ?? "",
    domain: "",
    remoteAddress: "",
    basicAuth: "",
    authtoken: "",
    token: "",
    autoStart: false,
    enabled: true,
    remark: "",
  };
}

/** 弹窗显隐 */
const visible = ref(false);

/** 编辑目标；为空表示新增 */
const editing = ref<TunnelView | null>(null);

/** 保存中 */
const saving = ref(false);

/** 正在启停的映射 id：请求期间对应按钮进入等待态 */
const pendingId = ref<string | null>(null);

/** 表单 */
const form = ref<TunnelForm>(emptyForm());

/** 当前表单选中的提供方描述 */
const activeProvider = computed<TunnelProviderInfo | undefined>(() =>
  providers.value.find((item) => item.name === form.value.provider),
);

/** 提供方下拉选项：不可用的标注出来并禁用，避免点下去才失败 */
const providerOptions = computed(() =>
  providers.value.map((item) => ({
    label: item.available ? item.displayName : `${item.displayName}（当前环境不可用）`,
    value: item.name,
    disabled: !item.available,
  })),
);

/** 模式下拉选项：随提供方联动（ngrok 是 http/tcp/tls，cloudflared 是 quick/named） */
const modeOptions = computed(() =>
  (activeProvider.value?.modes ?? []).map((mode) => ({ label: modeLabel(mode), value: mode })),
);

/** 切提供方时把模式拉回该提供方的默认值（原模式不属于新提供方时） */
watch(
  () => form.value.provider,
  () => {
    const info = activeProvider.value;
    if (!info) return;
    if (!info.modes.includes(form.value.mode)) {
      form.value.mode = info.defaultMode;
    }
  },
);

/** 域名只对 http / tls / named 有意义（quick、tcp 由提供方自行分配） */
const showDomain = computed(() => ["http", "tls", "named"].includes(form.value.mode));

/** 远程地址是 ngrok tcp 模式的目标（形如 1.tcp.ngrok.io:20000） */
const showRemoteAddress = computed(() => form.value.provider === "ngrok" && form.value.mode === "tcp");

/** Basic 认证只作用于 ngrok 的 http 隧道 */
const showBasicAuth = computed(() => form.value.provider === "ngrok" && form.value.mode === "http");

/** ngrok authtoken（缺省时后端还会读全局配置与环境变量） */
const showAuthtoken = computed(() => form.value.provider === "ngrok");

/** Cloudflare 命名隧道 Token */
const showToken = computed(() => form.value.provider === "cloudflared" && form.value.mode === "named");

/** Tailscale 设备就绪状态（来自提供方 capabilities） */
const tailscaleCaps = computed(() => {
  const caps = activeProvider.value?.capabilities ?? {};
  return {
    binary: Boolean(caps.binaryAvailable),
    authKey: Boolean(caps.authKeyConfigured),
  };
});

/** 打开「新增」 */
function openCreate() {
  editing.value = null;
  form.value = emptyForm();
  visible.value = true;
}

/**
 * 从某个提供方分组里直接新增：预选该提供方与其默认模式。
 *
 * @param provider 提供方标识
 */
function openCreateFor(provider: string) {
  editing.value = null;
  form.value = emptyForm();
  form.value.provider = provider;
  const info = providers.value.find((item) => item.name === provider);
  if (info) {
    // 默认模式优先取后端给的 defaultMode；没有就给该提供方的第一个模式，
    // 免得弹窗开出来「模式」是空的，用户还得自己翻下拉
    form.value.mode = info.defaultMode || info.modes[0] || "";
  }
  visible.value = true;
}

/**
 * 打开「编辑」。
 *
 * <p>提供方不可变更：映射归属哪个提供方决定它会被哪个实现加载，
 * 后端 {@code update} 也会强制沿用原提供方。</p>
 *
 * @param row 链路行
 */
function openEdit(row: TunnelView) {
  editing.value = row;
  form.value = {
    provider: row.provider,
    name: row.name ?? "",
    localPort: String(row.localPort ?? 8080),
    mode: row.mode ?? "",
    domain: row.domain ?? "",
    remoteAddress: row.remoteAddress ?? "",
    basicAuth: row.basicAuth ?? "",
    authtoken: row.authtoken ?? "",
    token: row.token ?? "",
    autoStart: Boolean(row.autoStart),
    enabled: row.enabled !== false,
    remark: row.remark ?? "",
  };
  visible.value = true;
}

/**
 * 提交前的前端校验（与后端 {@code TunnelInputs} 同口径，先挡一遍省一次往返）。
 *
 * @returns 通过时返回 null，否则返回提示文案
 */
function validate(): string | null {
  if (!form.value.provider) {
    return "请选择提供方";
  }
  const port = Number(form.value.localPort);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    return "本地端口必须是 1 - 65535 之间的整数";
  }
  if (!form.value.mode) {
    return "请选择隧道模式";
  }
  if (showRemoteAddress.value && !form.value.remoteAddress.trim()) {
    return "tcp 模式必须填写远程地址";
  }
  if (showToken.value && !form.value.token.trim()) {
    return "named 模式必须填写 Cloudflare 隧道 Token";
  }
  if (showBasicAuth.value && form.value.basicAuth.trim()) {
    const value = form.value.basicAuth.trim();
    const sep = value.indexOf(":");
    const password = sep > -1 ? value.slice(sep + 1) : "";
    if (sep < 1 || !password) {
      return "Basic 认证格式应为 用户名:密码，如 ops:password123";
    }
    if (password.length < 8 || password.length > 128) {
      return `Basic 认证的密码长度必须是 8 - 128 位，当前 ${password.length} 位`;
    }
  }
  return null;
}

/** 保存（新增或更新） */
async function save() {
  const invalid = validate();
  if (invalid) {
    msgError(invalid);
    return;
  }
  const payload: TunnelRecord = {
    id: editing.value?.id ?? "",
    provider: form.value.provider as TunnelProvider,
    name: form.value.name.trim(),
    localPort: Number(form.value.localPort),
    mode: form.value.mode as TunnelMode,
    domain: form.value.domain.trim(),
    remoteAddress: form.value.remoteAddress.trim(),
    basicAuth: form.value.basicAuth.trim(),
    authtoken: form.value.authtoken.trim(),
    token: form.value.token.trim(),
    metadata: editing.value?.metadata ?? "",
    autoStart: form.value.autoStart,
    enabled: form.value.enabled,
    remark: form.value.remark.trim(),
    createdAt: editing.value?.createdAt ?? 0,
    updatedAt: editing.value?.updatedAt ?? 0,
  };
  saving.value = true;
  try {
    if (editing.value) {
      await updateTunnel(editing.value.id, payload);
      msgSuccess("已保存");
      pushEvent(`保存映射「${payload.name || payload.localPort}」`, "plain");
    } else {
      await createTunnel(payload);
      msgSuccess("已新增");
      pushEvent(`新增映射「${payload.name || payload.localPort}」`, "plain");
    }
    visible.value = false;
    await reload();
  } catch (e) {
    msgError(`保存失败：${errText(e)}`);
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="tunnel-page">
    <div class="tunnel-page__bar">
      <h2 class="tunnel-page__title">内网穿透</h2>
      <span class="chip chip--brand">
        <ReIcon name="Link" :size="11" />本实例 {{ selfLabel }} · 持有 {{ heldCount }} 条
      </span>
      <span class="tunnel-page__bar-sep" aria-hidden="true"></span>
      <div class="tunnel-page__stats">
        <span><b>{{ rows.length }}</b>条映射</span>
        <span><i class="dot dot--run"></i>在线 <b>{{ runningCount }}</b></span>
        <span><i class="dot dot--err"></i>异常 <b>{{ errorCount }}</b></span>
        <span><i class="dot dot--idle"></i>停止 <b>{{ stoppedCount }}</b></span>
      </div>
      <span class="tunnel-page__bar-grow"></span>
      <div class="seg" role="group" aria-label="按状态筛选">
        <button
          v-for="item in filters"
          :key="item.value"
          type="button"
          :aria-pressed="filter === item.value"
          @click="filter = item.value"
        >
          {{ item.label }}<span class="seg__n">{{ item.count }}</span>
        </button>
      </div>
      <ReButton layout="square" icon="Refresh" :loading="loading" title="刷新" @click="reload" />
      <ReButton type="primary" icon="Plus" @click="openCreate">新增映射</ReButton>
    </div>

    <div class="tunnel-page__split">
      <nav class="pane nav" aria-label="隧道映射">
        <div class="nav__top">
          <label class="input">
            <ReIcon name="Search" :size="13" />
            <input v-model="search" type="search" placeholder="搜索名称 / 端口 / 域名" />
          </label>
        </div>

        <div class="nav__list">
          <p v-if="loadError" class="nav__note nav__note--warn">
            隧道列表加载失败：{{ loadError }}<template v-if="rows.length">（下面保留的是上一次结果，可能已过期）</template>
            <button type="button" class="nav__retry" @click="reload">重试</button>
          </p>
          <p v-if="providersState === 'failed'" class="nav__note nav__note--warn">
            提供方信息加载失败，组头可用性暂以「未知」显示。
            <button type="button" class="nav__retry" @click="reloadProviders">重试</button>
          </p>
          <div v-else-if="providersState === 'loading'" class="nav__note">
            <ReSkeleton :rows="2" animated loading/>
          </div>
          <p v-else-if="!providers.length" class="nav__note">
            监控服务未注册内网穿透提供方。
            <button type="button" class="nav__retry" @click="reloadProviders">重新检测</button>
          </p>
          <div v-else-if="loading && !rows.length" class="nav__note">
            <ReSkeleton :rows="5" animated loading/>
          </div>
          <p v-else-if="!groups.length && !loadError" class="nav__note">
            {{ rows.length ? "当前筛选或搜索下没有链路" : "还没有映射：点右上角「新增映射」" }}
          </p>

          <div v-for="group in groups" :key="group.provider" class="grp">
            <div class="grp__head">
              <span class="pmark" :class="`pmark--${group.markClass}`">{{ group.mark }}</span>
              <span class="grp__name">{{ group.label }}</span>
              <span class="grp__n">{{ group.total }} 条 · {{ group.running }} 在线</span>
              <span class="chip grp__chip" :class="group.chipClass" :title="group.chipTitle">
                {{ group.chipText }}
              </span>
            </div>

            <div class="grp__body">
              <div v-if="!group.rows.length" class="grp__empty">
                <span class="grp__empty-text">该提供方还没有映射</span>
                <button type="button" class="grp__add" @click="openCreateFor(group.provider)">
                  <ReIcon name="Plus" :size="10" />新增
                </button>
              </div>
              <button
                v-for="row in group.rows"
                :key="row.id"
                type="button"
                class="nr"
                :class="{ 'is-active': selected?.id === row.id }"
                @click="selectedId = row.id"
              >
                <i class="dot" :class="dotClass(row)" aria-hidden="true"></i>
                <span class="nr__body">
                  <span class="nr__name">
                    <span class="nr__name-text">{{ row.name || row.id }}</span>
                    <span v-if="row.autoStart" class="chip chip--brand nr__chip">自动</span>
                    <span v-if="row.enabled === false" class="chip chip--muted nr__chip">已禁用</span>
                  </span>
                  <span class="nr__s" :class="{ 'nr__s--err': stateOf(row) === 'error' }">
                    {{ shortMode(row.mode) }} · {{ navSub(row) }}
                  </span>
                </span>
                <span class="nr__port">{{ row.localPort }}</span>
              </button>
            </div>
          </div>
        </div>

        <div class="nav__foot">
          <ReIcon name="Connection" :size="11" />
          <span>别的实例持有的链路可查看；启动会把链路接管过来</span>
        </div>
      </nav>

      <div class="tunnel-page__right">
        <section class="pane canvas" aria-label="链路画布">
          <div class="canvas__head">
            <b>链路</b>
            <span class="canvas__hint">点任意一排看详情</span>
            <span class="canvas__grow"></span>
            <div class="legend">
              <span><i class="lg-line"></i>在线</span>
              <span><i class="lg-line lg-line--err"></i>异常</span>
              <span><i class="lg-line lg-line--off"></i>未启动</span>
            </div>
          </div>

          <div class="cols">
            <span>本机端口</span>
            <span>隧道 / 提供方</span>
            <span>公网入口</span>
          </div>

          <div class="lanes">
            <div
              v-for="row in visibleRows"
              :key="row.id"
              class="lane"
              :class="{ 'is-sel': selected?.id === row.id }"
              role="button"
              :tabindex="0"
              :aria-pressed="selected?.id === row.id"
              @click="selectedId = row.id"
              @keydown.enter.prevent="selectedId = row.id"
              @keydown.space.prevent="selectedId = row.id"
            >
              <div class="node">
                <div class="nbox nbox--local" :class="boxClass(row)">
                  <span class="nbox__body">
                    <span class="nname">
                      <i class="dot" :class="dotClass(row)" aria-hidden="true"></i>
                      <span>{{ row.name || row.id }}</span>
                    </span>
                    <span class="nsub">127.0.0.1 · {{ row.localPort }}</span>
                  </span>
                </div>
              </div>

              <div class="wire" :class="wireClass(row)">
                <span class="wire__pill">
                  <i class="wire__dot"></i><b>{{ providerShort(row.provider) }}</b> {{ shortMode(row.mode) }}
                </span>
              </div>

              <div class="node node--public">
                <div class="nbox nbox--public" :class="boxClass(row)">
                  <span class="nbox__body">
                    <span class="nbox__cap" :class="{ 'nbox__cap--err': stateOf(row) === 'error' }">
                      {{ publicCap(row) }}
                    </span>
                    <span v-if="stateOf(row) === 'error'" class="nbox__err" :title="row.error">{{ row.error }}</span>
                    <span v-else class="nbox__url" :class="{ 'is-muted': !primaryUrl(row) }" :title="allUrls(row)">
                      {{ primaryUrl(row) || publicHint(row) }}
                    </span>
                  </span>
                  <ReButton
                    v-if="primaryUrl(row)"
                    layout="square"
                    icon="CopyDocument"
                    title="复制公网地址"
                    @click.stop="copyText(primaryUrl(row))"
                  />
                  <ReButton
                    v-else-if="row.enabled === false"
                    layout="square"
                    icon="Edit"
                    title="编辑映射"
                    @click.stop="openEdit(row)"
                  />
                  <span
                    v-else
                    class="nbox__act"
                    :title="providerBlocked(row) ? startBlockedTitle(row) : '启动'"
                  >
                    <ReButton
                      layout="square"
                      icon="VideoPlay"
                      aria-label="启动"
                      :loading="pendingId === row.id"
                      :disabled="Boolean(providerBlocked(row))"
                      @click.stop="onToggle(row)"
                    />
                  </span>
                </div>
              </div>
            </div>
            <p v-if="loadError && !visibleRows.length" class="lanes__empty">
              隧道列表加载失败：{{ loadError }}
              <button type="button" class="nav__retry" @click="reload">重试</button>
            </p>
            <p v-else-if="!loading && !visibleRows.length" class="lanes__empty">
              {{ rows.length ? "当前筛选或搜索下没有链路，换一个条件看看" : "还没有映射：点顶部「新增映射」开始" }}
            </p>
          </div>
        </section>

        <div class="tunnel-page__bottom">
          <section class="pane det" aria-label="映射详情">
            <template v-if="selected">
              <div class="det__head">
                <i class="dot" :class="dotClass(selected)" aria-hidden="true"></i>
                <span class="det__name">{{ selected.name || selected.id }}</span>
                <span class="chip" :class="chipClass(selected)">{{ STATE_LABELS[stateOf(selected)] }}</span>
                <span v-if="selected.autoStart" class="chip chip--brand">自动启动</span>
                <span v-if="selected.enabled === false" class="chip chip--muted">已禁用</span>
                <span class="det__grow"></span>
                <ReButton
                  v-if="primaryUrl(selected)"
                  size="mini"
                  plain
                  icon="Link"
                  @click="openUrl(primaryUrl(selected))"
                >
                  打开
                </ReButton>
                <ReButton size="mini" plain icon="Edit" @click="openEdit(selected)">编辑</ReButton>
              </div>

              <div class="det__body">
                <div v-if="primaryUrl(selected)" class="det__url">
                  <ReIcon name="Link" :size="13" class="det__url-icon" />
                  <span class="url"><span>{{ primaryUrl(selected) }}</span></span>
                  <ReButton size="mini" plain icon="CopyDocument" @click="copyText(primaryUrl(selected))">复制</ReButton>
                </div>
                <div v-else class="det__url det__url--empty">
                  <ReIcon name="Link" :size="13" class="det__url-icon" />
                  <span class="url url--muted"><span>{{ publicHint(selected) }}</span></span>
                </div>

                <div class="facts">
                  <div>
                    <div class="fact__k">本地</div>
                    <div class="fact__v mono">127.0.0.1:{{ selected.localPort }}</div>
                  </div>
                  <div>
                    <div class="fact__k">提供方 / 模式</div>
                    <div class="fact__v">{{ providerLabel(selected.provider) }} · {{ modeLabel(selected.mode) }}</div>
                  </div>
                  <div>
                    <div class="fact__k">owner</div>
                    <div
                      class="fact__v mono"
                      :class="{ 'is-self': isSelfOwner(selected) }"
                      :title="selected.owner || '当前没有实例持有这条链路'"
                    >
                      {{ ownerLabel(selected) }}
                    </div>
                  </div>
                  <div>
                    <div class="fact__k">启动于</div>
                    <div class="fact__v">{{ startedText(selected) }}</div>
                  </div>
                  <div>
                    <div class="fact__k">域名</div>
                    <div class="fact__v mono" :title="selected.domain">{{ selected.domain || "—" }}</div>
                  </div>
                  <div>
                    <div class="fact__k">备注</div>
                    <div class="fact__v" :title="selected.remark">{{ selected.remark || "—" }}</div>
                  </div>
                </div>

                <p v-if="selected.error" class="det__error">
                  <ReIcon name="Warning" :size="12" />{{ selected.error }}
                </p>
              </div>

              <div class="det__foot">
                <span class="dim">记录 {{ shortId(selected.id) }} · 更新 {{ updatedText(selected) }}</span>
                <span class="det__grow"></span>
                <span
                  v-if="!selected.running && startBlockedTitle(selected)"
                  class="det__block"
                  :title="startBlockedTitle(selected)"
                >
                  {{ startBlockedTitle(selected) }}
                </span>
                <ReButton
                  v-if="!selected.running"
                  size="small"
                  plain
                  type="success"
                  icon="VideoPlay"
                  :disabled="cannotStart(selected)"
                  :loading="pendingId === selected.id"
                  @click="onToggle(selected)"
                >
                  {{ selected.error ? "重试" : "启动" }}
                </ReButton>
                <ReButton
                  v-else
                  size="small"
                  plain
                  type="warning"
                  icon="VideoPause"
                  :loading="pendingId === selected.id"
                  @click="onToggle(selected)"
                >
                  停止
                </ReButton>
                <ReButton
                  v-if="primaryUrl(selected)"
                  size="small"
                  plain
                  icon="CopyDocument"
                  @click="copyText(primaryUrl(selected))"
                >
                  复制地址
                </ReButton>
                <ReButton size="small" plain type="danger" icon="Delete" @click="onDelete(selected)">删除</ReButton>
              </div>
            </template>
            <p v-else class="empty">左边选一条链路，这里显示它的地址、owner 与操作</p>
          </section>
          <section class="pane ev" aria-label="本实例最近事件">
            <div class="ev__head">
              <ReIcon name="Clock" :size="12" />最近事件
              <span
                class="ev__live"
                :class="`is-${streamState}`"
                :title="
                  streamState === 'live'
                    ? '已连上 /ms/tunnel/stream：链路状态实时同步'
                    : streamState === 'retrying'
                      ? '实时流连接中；断开后按 3s 间隔重试'
                      : '实时流未连接，列表由 30s 轮询兜底'
                "
              >
                <i class="ev__live-dot" aria-hidden="true"></i>
                {{ streamState === "live" ? "实时" : streamState === "retrying" ? "重连中" : "离线" }}
              </span>
              <span class="dim">本实例</span>
            </div>
            <div class="ev__body">
              <div
                v-for="(item, index) in events"
                :key="`${item.time}-${index}`"
                class="ev__i"
                :class="{ 'is-ok': item.tone === 'ok', 'is-err': item.tone === 'err' }"
              >
                <div class="ev__t">{{ item.time }}</div>
                <div class="ev__x">{{ item.text }}</div>
              </div>
              <p v-if="!events.length" class="ev__empty">本实例暂无事件</p>
            </div>
          </section>
        </div>
      </div>
    </div>

    <ReDialog
      v-model="visible"
      :title="editing ? '编辑映射' : '新增映射'"
      :width="560"
      :close-on-click-modal="false"
    >
      <div class="tunnel-form">
        <p v-if="!providers.length" class="tunnel-form__warn">
          后端没有返回任何提供方：请确认已经部署 <code>/ms/tunnel</code>，并引入了
          spring-support-ngrok-starter 或 spring-support-cloudflared-starter。
        </p>

        <div class="tunnel-form__section">基本</div>

        <div class="tunnel-form__item">
          <span class="tunnel-form__label"><i class="req">*</i>提供方</span>
          <el-segmented
            v-model="form.provider"
            :options="providerOptions"
            :disabled="Boolean(editing)"
            block
          />
          <span class="tunnel-form__hint">
            {{ editing ? "提供方不可变更：它决定这条记录由哪个实现加载" : "引入哪个提供方 starter，这里就有哪一项" }}
          </span>
        </div>

        <div class="tunnel-form__item">
          <span class="tunnel-form__label">名称</span>
          <ReInput v-model="form.name" maxlength="64" :placeholder="`留空自动命名（${form.provider}-${form.localPort}）`" />
        </div>

        <div class="tunnel-form__row">
          <div class="tunnel-form__item">
            <span class="tunnel-form__label"><i class="req">*</i>本地端口</span>
            <ReInput v-model="form.localPort" type="number" placeholder="如 8080" />
            <span class="tunnel-form__hint">映射到 127.0.0.1 的这个端口</span>
          </div>

          <div class="tunnel-form__item">
            <span class="tunnel-form__label"><i class="req">*</i>模式</span>
            <ReSelect v-model="form.mode" :data="modeOptions" :clearable="false" placeholder="选择模式" />
            <span class="tunnel-form__hint">模式决定下面要填哪些参数</span>
          </div>
        </div>

        <div v-if="showDomain || showRemoteAddress || showBasicAuth || showAuthtoken || showToken || form.provider === 'tailscale'" class="tunnel-form__section">
          连接
        </div>

        <div v-if="showDomain" class="tunnel-form__item">
          <span class="tunnel-form__label">域名</span>
          <ReInput v-model="form.domain" placeholder="可选，留空由提供方分配" />
        </div>

        <div v-if="showRemoteAddress" class="tunnel-form__item">
          <span class="tunnel-form__label"><i class="req">*</i>远程地址</span>
          <ReInput v-model="form.remoteAddress" placeholder="如 1.tcp.ngrok.io:20000" />
        </div>

        <div v-if="showBasicAuth" class="tunnel-form__item">
          <span class="tunnel-form__label">Basic 认证</span>
          <ReInput v-model="form.basicAuth" placeholder="user:password123（密码至少 8 位，可选）" />
        </div>

        <div v-if="showAuthtoken" class="tunnel-form__item">
          <span class="tunnel-form__label">authtoken</span>
          <ReInput v-model="form.authtoken" type="password" show-password autocomplete="new-password" placeholder="留空则用 plugin.ngrok.authtoken 或环境变量" />
        </div>

        <div v-if="showToken" class="tunnel-form__item">
          <span class="tunnel-form__label"><i class="req">*</i>隧道 Token</span>
          <ReInput v-model="form.token" placeholder="Cloudflare Zero Trust 隧道 Token" />
        </div>

        <div v-if="form.provider === 'tailscale'" class="tunnel-form__item tunnel-form__item--stack">
          <span class="tunnel-form__label">设备就绪</span>
          <p class="tunnel-form__hint">
            Tailscale 无需 Token：设备已加入 Tailnet（<code>tailscale up</code>）即可建隧道，
            或配置 <code>plugin.tailscale.auth-key</code> / 环境变量 <code>TS_AUTHKEY</code>。
            <span class="tunnel-form__state">
              二进制 {{ tailscaleCaps.binary ? "已找到" : "未找到" }} ·
              认证 {{ tailscaleCaps.authKey ? "已配置" : "未配置" }}
            </span>
          </p>
        </div>

        <div class="tunnel-form__section">运行</div>

        <div class="tunnel-form__row">
          <div class="tunnel-form__item tunnel-form__item--inline">
            <span class="tunnel-form__label">自动启动</span>
            <ReSwitch v-model="form.autoStart" />
            <span class="tunnel-form__hint">应用启动时自动拉起</span>
          </div>

          <div class="tunnel-form__item tunnel-form__item--inline">
            <span class="tunnel-form__label">启用</span>
            <ReSwitch v-model="form.enabled" />
            <span class="tunnel-form__hint">关闭后不允许启动</span>
          </div>
        </div>

        <div class="tunnel-form__item tunnel-form__item--stack">
          <span class="tunnel-form__label">备注</span>
          <ReInput v-model="form.remark" type="textarea" :rows="2" maxlength="200" placeholder="可选" />
        </div>
      </div>

      <template #footer="{ cancel }">
        <ReButton @click="cancel">取消</ReButton>
        <ReButton type="primary" :loading="saving" @click="save">保存</ReButton>
      </template>
    </ReDialog>
  </div>
</template>

<style scoped>
.tunnel-page {
  --tp-mono: ui-monospace, "Cascadia Mono", Consolas, "JetBrains Mono", monospace;

  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
  min-height: 0;
  box-sizing: border-box;
  color: var(--text-primary);
  font-size: 13px;
}

/* ==================== 顶部卡片（取代顶栏） ==================== */
.tunnel-page__bar {
  flex: none;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  padding: 9px 12px;
  /* 与设备资产同一档卡面：灰页底 + 白面 + 1px 细边 + 软阴影 */
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  background: var(--bg-container);
  box-shadow: var(--shadow-sm);
}

.tunnel-page__title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.01em;
  color: var(--text-primary);
}

.tunnel-page__bar-sep {
  width: 1px;
  height: 18px;
  background: var(--border-subtle);
}

.tunnel-page__bar-grow {
  flex: 1;
  min-width: 8px;
}

.tunnel-page__stats {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 11px;
  font-size: 11.5px;
  color: var(--text-tertiary);
}

.tunnel-page__stats span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.tunnel-page__stats b {
  font-family: var(--tp-mono);
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text-primary);
}

/* ==================== 基础小件 ==================== */
.chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 20px;
  padding: 0 7px;
  border-radius: 4px;
  background: var(--bg-fill);
  color: var(--text-secondary);
  font-size: 11.5px;
  line-height: 1;
  white-space: nowrap;
}

.chip--brand {
  background: var(--brand-50);
  color: var(--brand-600);
}

.chip--success {
  background: color-mix(in srgb, var(--pulse-online) 14%, transparent);
  color: color-mix(in srgb, var(--pulse-online) 76%, var(--text-primary));
}

.chip--warn {
  background: color-mix(in srgb, var(--pulse-unknown) 16%, transparent);
  color: color-mix(in srgb, var(--pulse-unknown) 70%, var(--text-primary));
}

.chip--error {
  background: var(--status-error-bg);
  color: var(--status-error-text);
}

.chip--muted {
  background: var(--bg-fill);
  color: var(--text-tertiary);
}

.dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex: none;
  background: var(--pulse-offline);
}

.dot--run {
  background: var(--pulse-online);
  animation: tp-breathe 1.8s ease-in-out infinite;
}

.dot--err {
  background: var(--pulse-alarm);
  animation: tp-blink 0.9s step-start infinite;
}

.dot--idle {
  background: var(--pulse-offline);
}

.seg {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  background: var(--bg-fill);
}

.seg button {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 24px;
  padding: 0 9px;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: var(--text-secondary);
  font: inherit;
  font-size: 12px;
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  transition: color 0.15s, background-color 0.15s;
}

.seg button:hover {
  color: var(--brand-600);
}

.seg button[aria-pressed="true"] {
  background: var(--bg-container);
  color: var(--brand-600);
  font-weight: 600;
  box-shadow: var(--shadow-sm);
}

.seg__n {
  min-width: 15px;
  padding: 0 4px;
  border-radius: 7px;
  background: color-mix(in srgb, var(--text-primary) 6%, transparent);
  color: var(--text-tertiary);
  font-size: 10.5px;
  font-weight: 400;
  line-height: 14px;
  text-align: center;
}

.seg button[aria-pressed="true"] .seg__n {
  background: var(--brand-100);
  color: var(--brand-600);
}

/* ==================== 骨架 ==================== */
.pane {
  min-width: 0;
  min-height: 0;
  /* 卡面：白底 + 细边 + 软阴影，与设备资产的 .da-rail / .da-card 同口径 */
  background: var(--bg-container);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.tunnel-page__split {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 268px minmax(0, 1fr);
  gap: 10px;
}

.tunnel-page__right {
  display: grid;
  grid-template-rows: minmax(0, 1.12fr) minmax(0, 0.88fr);
  gap: 10px;
  min-width: 0;
  min-height: 0;
}

/* ==================== 左栏：按提供方分组 ==================== */
.nav {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.nav__top {
  flex: none;
  display: flex;
  gap: 6px;
  padding: 8px;
  border-bottom: 1px solid var(--border-subtle);
}

.input {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  height: 28px;
  padding: 0 9px;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-tertiary);
  font-size: 12.5px;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.input:focus-within {
  border-color: var(--brand-400);
  box-shadow: var(--focus-ring);
}

.input input {
  flex: 1;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--text-primary);
  font: inherit;
}

.input input::placeholder {
  color: var(--text-tertiary);
}

.input input::-webkit-search-cancel-button {
  display: none;
}

.nav__list {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 2px 6px 6px;
}

.nav__note {
  margin: 8px 6px;
  font-size: 11.5px;
  line-height: 1.6;
  color: var(--text-tertiary);
}

.nav__note--warn {
  color: color-mix(in srgb, var(--pulse-unknown) 68%, var(--text-primary));
}

.nav__note code {
  font-family: var(--tp-mono);
  font-size: 11px;
}

/* 失败重试：提示行内的小号按钮，不把用户赶出列表 */
.nav__retry {
  margin-left: 6px;
  padding: 1px 7px;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  background: var(--bg-container);
  color: var(--text-secondary);
  font: inherit;
  font-size: 10.5px;
  line-height: 1.5;
  cursor: pointer;
  vertical-align: 1px;
}

.nav__retry:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.grp {
  margin-top: 10px;
}

.grp:first-child {
  margin-top: 4px;
}

/* 父级：整行浅底带 + 上圆角，让「提供方」读起来是分组标题，而不是又一个条目 */
.grp__head {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 5px 8px 5px 6px;
  border-radius: var(--radius-sm) var(--radius-sm) 0 0;
  background: var(--bg-fill);
}

.pmark {
  width: 18px;
  height: 18px;
  border-radius: 5px;
  flex: none;
  display: grid;
  place-items: center;
  color: var(--text-inverse);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.02em;
  background: var(--brand-500);
}

/* 提供方品牌标识色（ngrok 墨黑 / Cloudflare 橙 / Tailscale 深蓝）：等同 logo 的固定品牌色，
   不随明暗主题切换；两种主题下白字均可读，故不接入主题令牌。 */
.pmark--ngrok {
  background: #1f2430;
}

.pmark--cf {
  background: linear-gradient(135deg, #f6821f, #faae40);
}

.pmark--ts {
  background: #1e2b3c;
}

.grp__name {
  font-size: 11.5px;
  font-weight: 700;
  color: var(--text-primary);
}

/* 计数用等宽字贴右，和条目里的端口列同一竖线上，扫读时不会串行 */
.grp__n {
  margin-left: auto;
  font-family: var(--tp-mono);
  font-size: 10.5px;
  color: var(--text-tertiary);
}

.grp__chip {
  flex: none;
  height: 16px;
  padding: 0 4px;
  font-size: 9.5px;
}

/* 子级容器：左侧一条导轨竖线，条目挂在这根线上 */
.grp__body {
  position: relative;
  padding: 2px 0 2px 13px;
}

.grp__body::before {
  content: "";
  position: absolute;
  left: 6px;
  top: 6px;
  bottom: 6px;
  width: 1px;
  border-radius: 1px;
  background: var(--border-subtle);
}

/* 注册了提供方但还没有映射：虚线占位挂在导轨上，右侧直接给「新增」，
   用户不必先回顶部按钮再在弹窗里挑提供方 */
.grp__empty {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 2px 0;
  padding: 5px 8px;
  border: 1px dashed var(--border-subtle);
  border-radius: var(--radius-sm);
  color: var(--text-tertiary);
  font-size: 11px;
}

.grp__empty-text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.grp__add {
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 1px 7px;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  background: var(--bg-container);
  color: var(--text-secondary);
  font: inherit;
  font-size: 10.5px;
  line-height: 1.5;
  cursor: pointer;
}

.grp__add:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.nr {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 6px 8px 6px 9px;
  border: 0;
  border-radius: var(--radius-sm);
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

/* 每条子级在导轨上补一小段横勾，层级一眼看得出是「属于上面那个提供方」 */
.nr::after {
  content: "";
  position: absolute;
  left: -7px;
  top: 50%;
  width: 6px;
  height: 1px;
  background: var(--border-subtle);
}

/* 选中用底色 + 贴边品牌色条，悬停只给极浅底，两者不抢 */
.nr:hover {
  background: var(--bg-hover);
}

.nr.is-active {
  background: color-mix(in srgb, var(--brand-500) 8%, transparent);
}

.nr.is-active::before {
  content: "";
  position: absolute;
  left: 0;
  top: 5px;
  bottom: 5px;
  width: 2.5px;
  border-radius: 2px;
  background: var(--brand-500);
}

.nr:focus-visible {
  outline: 2px solid var(--brand-500);
  outline-offset: -2px;
}

.nr__body {
  display: block;
  flex: 1;
  min-width: 0;
}

.nr__name {
  display: flex;
  align-items: center;
  gap: 5px;
  min-width: 0;
  font-size: 12.5px;
  color: var(--text-primary);
}

.nr__name-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nr__chip {
  height: 15px;
  padding: 0 3px;
  font-size: 9px;
  font-weight: 400;
}

.nr__s {
  display: block;
  margin-top: 1px;
  font-size: 10px;
  color: var(--text-tertiary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.nr.is-active .nr__name {
  color: var(--brand-600);
  font-weight: 600;
}

.nr__s--err {
  color: var(--status-error-text);
}

.nr__port {
  flex: none;
  align-self: flex-start;
  padding-top: 1px;
  font-family: var(--tp-mono);
  font-size: 11px;
  color: var(--text-tertiary);
}

.nr.is-active .nr__port {
  color: var(--brand-600);
}

.nav__foot {
  flex: none;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 10px;
  border-top: 1px solid var(--border-subtle);
  color: var(--text-tertiary);
  font-size: 10px;
  line-height: 1.4;
}
/* ==================== 右上：链路画布 ==================== */
.canvas {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.canvas__head {
  flex: none;
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 8px 14px;
  border-bottom: 1px solid var(--border-subtle);
}

.canvas__head b {
  font-size: 11.5px;
  font-weight: 600;
  color: var(--text-primary);
}

.canvas__hint {
  font-size: 10.5px;
  color: var(--text-tertiary);
}

.canvas__grow {
  flex: 1;
}

.legend {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 10.5px;
  color: var(--text-tertiary);
}

.legend span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.lg-line {
  width: 15px;
  height: 2px;
  border-radius: 2px;
  background: var(--pulse-online);
}

.lg-line--err {
  background: color-mix(in srgb, var(--pulse-alarm) 42%, var(--bg-container));
}

.lg-line--off {
  background: color-mix(in srgb, var(--pulse-offline) 45%, var(--bg-container));
}

.cols,
.lane {
  display: grid;
  grid-template-columns: minmax(150px, 0.92fr) 152px minmax(170px, 1.08fr);
  align-items: center;
}

.cols {
  flex: none;
  height: 24px;
  padding: 0 14px;
  border-bottom: 1px solid var(--border-subtle);
  color: var(--text-tertiary);
  font-size: 9.5px;
  font-weight: 600;
  letter-spacing: 0.08em;
}

.cols span:nth-child(2) {
  text-align: center;
}

.cols span:last-child {
  text-align: right;
}

.lanes {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 2px 14px 8px;
}

.lane {
  position: relative;
  height: 58px;
  padding: 0 4px;
  border-radius: 6px;
  cursor: pointer;
}

.lane + .lane::before {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  border-top: 1px dashed var(--border-subtle);
}

.lane:hover {
  outline: 1px solid var(--border-subtle);
}

.lane.is-sel {
  outline: 1px solid var(--brand-100);
}

.lane.is-sel::after {
  content: "";
  position: absolute;
  left: -14px;
  top: 8px;
  bottom: 8px;
  width: 2.5px;
  border-radius: 0 2px 2px 0;
  background: var(--brand-500);
}

.lanes__empty {
  margin: 28px 0;
  color: var(--text-tertiary);
  font-size: 12px;
  text-align: center;
}

/* ---------- 节点 ---------- */
.node {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.node--public {
  justify-content: flex-end;
}

.nbox {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  padding: 6px 10px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
}

.nbox--local {
  width: 100%;
  max-width: 168px;
}

.nbox--public {
  width: 100%;
  max-width: 320px;
}

.nbox--run {
  border-color: color-mix(in srgb, var(--pulse-online) 34%, var(--bg-container));
}

.nbox--err {
  border-color: var(--status-error-border);
}

.nbox__body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}

.nbox__cap {
  color: var(--text-tertiary);
  font-size: 9px;
  letter-spacing: 0.06em;
}

.nbox__cap--err {
  color: var(--status-error-text);
}

.nbox__url {
  overflow: hidden;
  color: var(--brand-600);
  font-family: var(--tp-mono);
  font-size: 10.5px;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.nbox__url.is-muted {
  color: var(--text-tertiary);
}

/* 画布上的启动按钮：禁用时按钮本体收不到鼠标事件（pointer-events: none），
   提示语挂在这层包裹上，悬停仍有原生 tooltip 讲清「为什么不能启动」 */
.nbox__act {
  flex: none;
  display: inline-flex;
  align-items: center;
}

.nbox__err {
  overflow: hidden;
  color: var(--status-error-text);
  font-size: 10.5px;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.nname {
  display: flex;
  align-items: center;
  gap: 5px;
  min-width: 0;
  color: var(--text-primary);
  font-size: 11.5px;
  font-weight: 600;
}

.nname span {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.nsub {
  color: var(--text-tertiary);
  font-family: var(--tp-mono);
  font-size: 9.5px;
}

/* ---------- 连线 ---------- */
.wire {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.wire::before {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  height: 2px;
  transform: translateY(-1px);
  background-image: linear-gradient(
    to right,
    color-mix(in srgb, var(--pulse-offline) 45%, var(--bg-container)) 0 5px,
    transparent 5px 10px
  );
  background-size: 10px 2px;
}

.wire--run::before {
  background-image: linear-gradient(to right, var(--pulse-online) 0 5px, transparent 5px 10px);
  animation: tp-dashflow 0.9s linear infinite;
}

.wire--err::before {
  background-image: linear-gradient(
    to right,
    color-mix(in srgb, var(--pulse-alarm) 42%, var(--bg-container)) 0 5px,
    transparent 5px 10px
  );
}

.wire__pill {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  background: var(--bg-container);
  color: var(--text-secondary);
  font-size: 10px;
  white-space: nowrap;
}

.wire__pill b {
  color: var(--text-primary);
  font-weight: 600;
}

.wire--run .wire__pill {
  border-color: color-mix(in srgb, var(--pulse-online) 34%, var(--bg-container));
}

.wire--run .wire__pill b {
  color: color-mix(in srgb, var(--pulse-online) 72%, var(--text-primary));
}

.wire--err .wire__pill {
  border-color: var(--status-error-border);
}

.wire--err .wire__pill b {
  color: var(--status-error-text);
}

.wire__dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--pulse-online);
}

.wire--err .wire__dot {
  background: var(--pulse-alarm);
}

.wire--off .wire__dot {
  background: var(--pulse-offline);
}

@keyframes tp-dashflow {
  from {
    background-position: 0 0;
  }

  to {
    background-position: 10px 0;
  }
}
/* ==================== 右下：详情 + 事件 ==================== */
.tunnel-page__bottom {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 244px;
  gap: 10px;
  min-height: 0;
}

.det {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.det__head {
  flex: none;
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 9px 14px;
  border-bottom: 1px solid var(--border-subtle);
}

.det__name {
  overflow: hidden;
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.det__head .chip {
  height: 17px;
  padding: 0 5px;
  font-size: 10px;
}

.det__grow {
  flex: 1;
}

.det__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 9px;
  min-height: 0;
  overflow: auto;
  padding: 9px 14px 11px;
}

.det__url {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border: 1px solid var(--brand-100);
  border-radius: var(--radius-sm);
}

.det__url--empty {
  border-color: var(--border-subtle);
  border-style: dashed;
}

.det__url-icon {
  flex: none;
  color: var(--brand-500);
}

.det__url--empty .det__url-icon {
  color: var(--text-tertiary);
}

.det__url .url {
  flex: 1;
  min-width: 0;
  font-size: 11.5px;
}

.url > span {
  display: block;
  overflow: hidden;
  font-family: var(--tp-mono);
  white-space: nowrap;
  text-overflow: ellipsis;
}

.url--muted > span {
  color: var(--text-tertiary);
  font-family: inherit;
}

.facts {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px 10px;
}

.fact__k {
  color: var(--text-tertiary);
  font-size: 9.5px;
  letter-spacing: 0.04em;
}

.fact__v {
  margin-top: 2px;
  overflow: hidden;
  color: var(--text-primary);
  font-size: 11.5px;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.fact__v.mono {
  font-family: var(--tp-mono);
  font-size: 11px;
}

.fact__v.is-self {
  color: var(--brand-600);
  font-weight: 600;
}

.det__error {
  display: flex;
  align-items: flex-start;
  gap: 5px;
  margin: 0;
  padding: 6px 8px;
  border: 1px solid var(--status-error-border);
  border-radius: var(--radius-sm);
  background: var(--status-error-bg);
  color: var(--status-error-text);
  font-size: 11px;
  line-height: 1.5;
  word-break: break-all;
}

.det__foot {
  flex: none;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-top: 1px solid var(--border-subtle);
}

.det__foot .dim {
  overflow: hidden;
  font-size: 10px;
  white-space: nowrap;
  text-overflow: ellipsis;
}

/* 启动被挡住时把原因摆在按钮左边：禁用按钮本身给不出 tooltip，
   单靠 hover 说明会让「为什么点不动」变成猜谜 */
.det__block {
  max-width: 240px;
  overflow: hidden;
  color: color-mix(in srgb, var(--pulse-unknown) 68%, var(--text-primary));
  font-size: 10.5px;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.dim {
  color: var(--text-tertiary);
}

.empty {
  margin: auto;
  padding: 0 14px;
  color: var(--text-tertiary);
  font-size: 12px;
  text-align: center;
}

/* ==================== 事件 ==================== */
.ev {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.ev__head {
  flex: none;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 9px 12px;
  border-bottom: 1px solid var(--border-subtle);
  color: var(--text-primary);
  font-size: 11.5px;
  font-weight: 600;
}

.ev__head .dim {
  margin-left: auto;
  font-size: 10px;
  font-weight: 400;
}

/* 实时流角标：绿色=已连上、琥珀=重连中、灰=离线靠轮询兜底。
   颜色只是第二层信息，文字本身已把状态说清楚。 */
.ev__live {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 1px 5px;
  border-radius: 999px;
  background: var(--bg-fill);
  color: var(--text-tertiary);
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.ev__live-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--pulse-offline);
}

.ev__live.is-live {
  color: color-mix(in srgb, var(--pulse-online) 72%, var(--text-primary));
}

.ev__live.is-live .ev__live-dot {
  background: var(--pulse-online);
}

.ev__live.is-retrying {
  color: color-mix(in srgb, var(--pulse-unknown) 68%, var(--text-primary));
}

.ev__live.is-retrying .ev__live-dot {
  background: var(--pulse-unknown);
  animation: ev-live-pulse 1.2s ease-in-out infinite;
}

@keyframes ev-live-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.35;
  }
}

@media (prefers-reduced-motion: reduce) {
  .ev__live.is-retrying .ev__live-dot {
    animation: none;
  }
}

.ev__body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 8px 12px 10px;
}

.ev__i {
  position: relative;
  padding: 6px 0 6px 14px;
}

.ev__i::before {
  content: "";
  position: absolute;
  left: 2px;
  top: 11px;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--pulse-offline) 55%, var(--bg-container));
}

.ev__i::after {
  content: "";
  position: absolute;
  left: 4px;
  top: 18px;
  bottom: -4px;
  width: 1px;
  background: var(--border-subtle);
}

.ev__i:last-child::after {
  display: none;
}

.ev__i.is-ok::before {
  background: var(--pulse-online);
}

.ev__i.is-err::before {
  background: var(--pulse-alarm);
}

.ev__t {
  color: var(--text-tertiary);
  font-family: var(--tp-mono);
  font-size: 10px;
}

.ev__x {
  color: var(--text-secondary);
  font-size: 11px;
  line-height: 1.45;
}

.ev__empty {
  margin: 16px 0;
  color: var(--text-tertiary);
  font-size: 11px;
  text-align: center;
}
/* ==================== 弹窗表单（沿用原有样式） ==================== */
.tunnel-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tunnel-form__section {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 2px;
  color: var(--el-text-color-secondary);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.6px;
}

.tunnel-form__section::after {
  content: "";
  flex: 1;
  height: 1px;
  background: var(--el-border-color-lighter);
}

.tunnel-form__row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.tunnel-form__item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.tunnel-form__item--inline {
  flex-direction: row;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.tunnel-form__item--inline .tunnel-form__label {
  min-width: 68px;
}

.tunnel-form__item--stack {
  align-items: stretch;
}

.tunnel-form__label {
  font-size: 13px;
  color: var(--el-text-color-regular);
}

.tunnel-form__label .req {
  margin-right: 2px;
  font-style: normal;
  color: var(--el-color-danger);
}

.tunnel-form__hint {
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}

.tunnel-form__state {
  display: block;
  margin-top: 2px;
  font-family: var(--tp-mono);
  font-size: 11px;
}

.tunnel-form__warn {
  margin: 0;
  padding: 8px 10px;
  font-size: 12px;
  line-height: 1.6;
  border-radius: 6px;
  color: var(--el-color-warning);
  background: var(--el-color-warning-light-9);
}

/* ==================== 降级 ==================== */
@media (max-width: 1180px) {
  .tunnel-page__split {
    grid-template-columns: 232px minmax(0, 1fr);
  }

  .tunnel-page__bottom {
    grid-template-columns: minmax(0, 1fr) 208px;
  }
}

@media (max-width: 1024px) {
  .tunnel-page {
    height: auto;
  }

  .tunnel-page__split,
  .tunnel-page__right {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .nav {
    max-height: 320px;
  }

  .canvas {
    min-height: 320px;
  }

  .tunnel-page__bottom {
    display: flex;
    flex-direction: column;
  }

  .ev {
    max-height: 220px;
  }
}

@media (max-width: 720px) {
  .tunnel-page__bar {
    row-gap: 8px;
  }

  .tunnel-page__bar-sep {
    display: none;
  }

  .tunnel-page__stats {
    order: 3;
    width: 100%;
  }

  .cols {
    grid-template-columns: minmax(0, 1fr) 96px minmax(0, 1fr);
  }

  .lane {
    grid-template-columns: minmax(0, 1fr) 96px minmax(0, 1fr);
    height: 54px;
  }

  .wire__pill {
    padding: 2px 4px;
    font-size: 9px;
  }

  .facts {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .tunnel-form__row {
    grid-template-columns: 1fr;
  }
}
</style>
