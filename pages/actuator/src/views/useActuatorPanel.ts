/**
 * 页签面板的数据源 composable。
 *
 * <p>11 个页签的数据形态差别很大（键值 / 分组 / 表格 / 左右分栏），但取数这一段
 * 完全一样：读一个 actuator 端点、维护 loading / error / 关键字、页面切回来时静默刷新。
 * 把它抽成 composable，视图里只剩「把 JSON 变成行」这一件事。</p>
 *
 * <p>错误口径与监控大屏卡片一致（见 {@code cards/useCardResource}）：</p>
 * <ul>
 *   <li>端点没暴露（404 / 405 / 501）→ 给「怎么开启」的接入指引，而不是「重试」；</li>
 *   <li>其它失败（网络 / 500 / 解析）→ 原样给出可读文案。</li>
 * </ul>
 *
 * @since 4.0.0.51
 */
import { onBeforeUnmount, onMounted, ref, watch, type Ref } from "vue";
import { getActuatorEndpoint } from "../api/actuatorApi";
import { isUnavailableError, unavailableHint } from "../cards/useCardResource";
import { ACTUATOR_ENDPOINTS, type ActuatorTab } from "../endpoints";
import { ACTUATOR_TAB_ACTIVATED_EVENT } from "../tabs";

/**
 * 面板错误分型。
 *
 * <p>外壳（TabShell）据此决定错误框长什么样：</p>
 * <ul>
 *   <li>{@code unavailable} —— 端点没暴露（404/405/501），重试永远不会成功，
 *       显示「怎么开启」的接入指引，不给重试按钮；</li>
 *   <li>{@code retriable} —— 网络 / 后端 500 / 解析失败，真故障，给重试按钮；
 *       用户不用为「是不是自己点错了」猜半天（2026-11-19 configprops 500 即此类）。</li>
 * </ul>
 */
export type PanelErrorKind = "" | "unavailable" | "retriable";

/** 面板 composable 返回 */
export interface ActuatorPanel {
  /** 端点原始 JSON（未取到时为 null） */
  data: Ref<Record<string, unknown> | null>;
  /** 是否正在加载（首次进入 / 手动刷新 / 静默刷新时为 true） */
  loading: Ref<boolean>;
  /** 错误文案（端点未暴露时是接入指引） */
  error: Ref<string>;
  /** 错误分型（error 非空时有效）：外壳据此决定给「接入指引」还是「重试按钮」 */
  errorKind: Ref<PanelErrorKind>;
  /** 关键字过滤词（页签自己决定要不要用） */
  keyword: Ref<string>;
  /** 最近一次成功拉取的时间戳（ms） */
  updatedAt: Ref<number>;
  /**
   * 重新拉取。
   *
   * @param silent 静默刷新：不闪加载态；失败时保留已有数据，只更新错误文案
   */
  reload: (silent?: boolean) => Promise<void>;
  /** 关键字是否命中这些字段中的任意一个（关键字为空时恒为 true） */
  hit: (...fields: unknown[]) => boolean;
  /** 对象 → 键值列表（info 页签用） */
  entries: (obj?: Record<string, unknown> | null) => { k: string; v: string }[];
}

/**
 * 从任意错误对象里挖出可读文案。
 *
 * <p>与 {@code cards/useCardResource} 里的同名私有函数保持同一口径：优先取
 * 响应体里的中文 message，其次 HTTP 状态，最后退回 {@code Error.message}。</p>
 */
function errorText(err: unknown): string {
  if (!err) return "未知错误";
  const e = err as {
    message?: string;
    status?: number;
    response?: { status?: number; data?: unknown };
  };
  const status = e.response?.status ?? e.status;
  const data = e.response?.data;
  if (typeof data === "string" && data.trim()) return `${status ? `[${status}] ` : ""}${data.slice(0, 200)}`;
  if (data && typeof data === "object") {
    // 统一响应 advice 的错误信封用的是 msg 字段（如 {"code":"S9999C0000","msg":"系统繁忙，请稍后重试"}），
    // 与 message / error 一起兜，别让 500 只剩一句干巴巴的 "Request failed with status code 500"
    const body = data as { message?: string; error?: string; msg?: string };
    const msg = body.message ?? body.msg ?? body.error;
    if (msg) return `${status ? `[${status}] ` : ""}${msg}`;
  }
  if (e.message) return e.message;
  return String(err);
}

/**
 * 页签数据源。
 *
 * @param tab 页签标识（端点路径由 {@code endpoints.ts} 查表得到，不在视图里另写一遍）
 * @returns 数据、状态与关键字过滤入口
 */
export function useActuatorPanel(tab: ActuatorTab): ActuatorPanel {
  const path = ACTUATOR_ENDPOINTS.find((endpoint) => endpoint.key === tab)?.path ?? tab;

  const data = ref<Record<string, unknown> | null>(null);
  const loading = ref(false);
  const error = ref("");
  const errorKind = ref<PanelErrorKind>("");
  const keyword = ref("");
  const updatedAt = ref(0);

  /** 请求序号：切页签 / 连点刷新时只认最后一次响应 */
  let ticker = 0;
  /** 是否成功拉到过数据（决定切回页签时要不要顺带刷新） */
  let loaded = false;

  async function reload(silent = false): Promise<void> {
    const tag = ++ticker;
    if (!silent) {
      loading.value = true;
    }
    try {
      const res = await getActuatorEndpoint(path);
      if (tag !== ticker) return;
      data.value = (res as Record<string, unknown>) ?? null;
      updatedAt.value = Date.now();
      error.value = "";
      errorKind.value = "";
      loaded = true;
    } catch (err) {
      if (tag !== ticker) return;
      const unavailable = isUnavailableError(err);
      errorKind.value = unavailable ? "unavailable" : "retriable";
      error.value = unavailable ? unavailableHint(path) : errorText(err);
      if (!silent) {
        data.value = null;
      }
    } finally {
      if (tag === ticker) {
        loading.value = false;
      }
    }
  }

  /* ---------- 过滤词深链（?tab=xxx&q=...） ---------- */

  /** 本页签是否处于前台：只有前台页签有资格读写地址里的 q（面板按需挂载，挂载即在前台） */
  let active = true;

  /** 从地址 hash 的 query 里读深链过滤词 */
  function readKeywordFromUrl(): string {
    const mark = location.hash.indexOf("?");
    if (mark < 0) return "";
    return new URLSearchParams(location.hash.slice(mark + 1)).get("q") ?? "";
  }

  /**
   * 把本页签的过滤词写回地址（{@code replaceState}：不触发宿主路由重建、不进历史栈）。
   *
   * <p>hash 的路径段直接取当前地址（{@code location.hash.split("?")[0]}），
   * 不引用路由前缀常量，避免 views → routes → views 的模块循环。</p>
   */
  function writeKeywordToUrl(): void {
    const mark = location.hash.indexOf("?");
    const search = new URLSearchParams(mark >= 0 ? location.hash.slice(mark + 1) : "");
    const kw = keyword.value.trim();
    if (kw) {
      search.set("q", kw);
    } else {
      search.delete("q");
    }
    const hash = `${location.hash.split("?")[0]}?${search.toString()}`;
    if (location.hash === hash) return;
    try {
      window.history.replaceState(window.history.state, "", `${location.pathname}${location.search}${hash}`);
    } catch {
      // 地址栏被宿主限制改写（极少数嵌入式环境）：记不住过滤词不影响使用
    }
  }

  // 过滤词变化 → 同步地址；深链初始化原样写回时 hash 不变，自动跳过
  watch(keyword, () => {
    if (active) writeKeywordToUrl();
  });

  /**
   * 切回本页签时静默刷新一次，并把本页签的过滤词写回地址。
   *
   * <p>端点数据会变（例如别处刚调过日志级别），而页签面板是常驻的 v-show，
   * 不会重新挂载。静默刷新失败不打断视图：用户看到的是旧数据 + 一行错误提示，
   * 比整页清空更接近事实。</p>
   */
  function onActivated(event: Event): void {
    const name = (event as CustomEvent<{ tab?: string }>).detail?.tab;
    active = name === tab;
    if (!active) return;
    writeKeywordToUrl();
    if (!loaded || loading.value) return;
    void reload(true);
  }

  onMounted(() => {
    // 深链恢复：地址里带 q（如 #/actuator?tab=mappings&q=/api）且属于本页签时，挂载即还原过滤词
    const mark = location.hash.indexOf("?");
    const urlTab = mark >= 0 ? new URLSearchParams(location.hash.slice(mark + 1)).get("tab") : null;
    if (!urlTab || urlTab === tab) {
      const deep = readKeywordFromUrl();
      if (deep) keyword.value = deep;
    }
    void reload();
    window.addEventListener(ACTUATOR_TAB_ACTIVATED_EVENT, onActivated);
  });

  onBeforeUnmount(() => {
    window.removeEventListener(ACTUATOR_TAB_ACTIVATED_EVENT, onActivated);
  });

  /** 关键字是否命中（空关键字恒命中） */
  function hit(...fields: unknown[]): boolean {
    const kw = keyword.value.trim().toLowerCase();
    if (!kw) return true;
    return fields.some((field) => String(field ?? "").toLowerCase().includes(kw));
  }

  /** 对象 → 键值列表；嵌套值压成 JSON 文本 */
  function entries(obj?: Record<string, unknown> | null): { k: string; v: string }[] {
    if (!obj) return [];
    return Object.entries(obj).map(([k, v]) => ({
      k,
      v: v !== null && typeof v === "object" ? JSON.stringify(v) : String(v ?? ""),
    }));
  }

  return { data, loading, error, errorKind, keyword, updatedAt, reload, hit, entries };
}
