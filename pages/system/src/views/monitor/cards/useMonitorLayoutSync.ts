/**
 * 监控卡片布局的用户级远端同步
 *
 * <p>把「这台浏览器上的卡片布局」变成「这个账号的卡片布局」：走框架统一的用户配置出口
 * {@code getConfig().url.layout}（默认 {@code /v2/user/layout}），接口返回的是后端
 * {@code UserLayout} 实体，<b>每个用户只有一行</b>：</p>
 *
 * <table border="1">
 *   <caption>同一行里各字段的归属（务必别撞车）</caption>
 *   <tr><th>字段</th><th>谁在用</th></tr>
 *   <tr><td>{@code layout}</td><td>首页仪表板（{@code useHomeLayout}）</td></tr>
 *   <tr><td>{@code preference}</td><td>个人设置（{@code PersonalSettings.vue}）</td></tr>
 *   <tr><td>{@code grid}</td><td><b>监控大屏卡片（本模块）</b> —— 后端没占用的空字段</td></tr>
 *   <tr><td>{@code component}</td><td>首页存的是 {@code "home"}</td></tr>
 * </table>
 *
 * <p><b>为什么占 {@code grid} 而不是也写 {@code layout}</b>：后端 {@code PUT /v2/user/layout}
 * 的 {@code component} 参数并未参与查询（一个用户只有一行，按 userId 取），
 * 如果两个模块都写 {@code layout}，谁后保存谁覆盖，首页布局和监控布局会互相吃掉。
 * {@code grid} 目前无人使用，正好可以当一个独立槽位。</p>
 *
 * <p><b>为什么每次都要「先读整行、改一个字段、再整行写回」</b>：后端
 * {@code SysUserServiceImpl.saveUserLayout} 会把请求体里的
 * {@code layout / grid / component / preference} 全部覆盖到实体上（缺省的写 null）。
 * 只发 {@code {grid}} 会把首页布局和个人设置一起清空。整行回写是目前唯一不需要改后端的
 * 安全写法；后端若改成「null 即保留」的合并语义，这里的回读可以省掉。</p>
 *
 * <p><b>接口不可用时怎么办</b>：静默降级为纯本地（本地 storage 已存了一份完整布局），
 * 只在控制台留一次可诊断的告警。不做重试风暴 —— 为了一个不可用的接口每秒重试，
 * 比不保存更糟。</p>
 */
import { getConfig } from "@repo/config";
import { http, log } from "@repo/utils";

/** 后端用户配置实体（每个用户一行，字段归属见文件头） */
interface RemoteUserLayout {
  layout?: string | null;
  grid?: string | null;
  component?: string | null;
  preference?: string | null;
}

/** 接口返回体（与 {@code @repo/core} 的 ApiResult 同形，这里只关心 data） */
interface RemoteResult<T> {
  code?: string;
  data?: T | null;
  success?: boolean;
}

/** 远端能力状态：unknown 未探测 / ok 可用 / unsupported 不可用 */
let remoteState: "unknown" | "ok" | "unsupported" = "unknown";

/** 只告警一次，避免每次保存都刷屏 */
let warned = false;

/** 上报去抖句柄（拖拽时网格变化很密集，不能每动一像素就发一次请求） */
let flushTimer: ReturnType<typeof setTimeout> | null = null;

/** 待上报的最新布局（去抖窗口内只保留最后一份） */
let pendingLayout: unknown = null;

/** 串行化：读改写是竞态敏感操作，同时发两个就会互相覆盖 */
let pushChain: Promise<void> = Promise.resolve();

/** 用户配置接口地址（app.yaml 可覆盖） */
function layoutUrl(): string {
  return getConfig()?.url?.layout || "/v2/user/layout";
}

/** 一次性告警 */
function warnOnce(text: string): void {
  if (warned) return;
  warned = true;
  log.warn(text);
}

/**
 * 从后端实体里取出监控布局：存在 {@code grid} 字段里的 JSON 字符串。
 *
 * <p>兼容两种历史形状：{@code grid} 是 JSON 字符串（当前写法），或直接是对象
 * （某些后端/网关会把 JSON 列反序列化）。</p>
 *
 * @param data 接口 data
 * @returns 布局对象；没有 / 解析失败返回 null
 */
function extractMonitorLayout(data: RemoteUserLayout | null | undefined): unknown | null {
  if (!data) return null;
  const raw = data.grid;
  if (typeof raw === "string" && raw.trim()) {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (raw && typeof raw === "object") return raw;
  return null;
}

/**
 * 拉取当前用户的监控卡片布局。
 *
 * @returns 布局对象；接口不可用 / 无数据 / 解析失败均返回 null（调用方回退到本地）
 */
export async function fetchMonitorLayout(): Promise<unknown | null> {
  if (remoteState === "unsupported") return null;
  try {
    const res = await http()
      .get(layoutUrl())
      .then<RemoteResult<RemoteUserLayout>>((r) => r.data);
    remoteState = "ok";
    return extractMonitorLayout(res?.data);
  } catch (err) {
    remoteState = "unsupported";
    warnOnce(
      `[monitor-cards] 用户配置接口 ${layoutUrl()} 不可用（${String(err)}），` +
        "卡片布局已降级为**本浏览器本地保存**：换设备 / 换浏览器不会同步，但不会丢。",
    );
    return null;
  }
}

/**
 * 整行回写：先取最新一行，只替换 {@code grid}，其余字段原样带上。
 *
 * <p>少了这次回读，后端会把 {@code layout}（首页布局）与 {@code preference}（个人设置）
 * 覆盖成 null —— 那是「保存监控卡片顺手清空用户其它配置」，比不同步更糟糕。</p>
 */
async function writeGrid(payload: unknown): Promise<void> {
  const client = http();
  const current = await client
    .get(layoutUrl())
    .then<RemoteResult<RemoteUserLayout>>((r) => r.data);
  const row = current?.data ?? {};
  // 请求体按 http 的 RequestBody（Record<string, unknown>）字面量构造：
  // 直接标 RemoteUserLayout 会因缺索引签名报 TS2345。
  const body: Record<string, unknown> = {
    layout: row.layout ?? null,
    component: row.component ?? null,
    preference: row.preference ?? null,
    grid: JSON.stringify(payload),
  };
  await client.put(layoutUrl()).data(body).then<RemoteResult<RemoteUserLayout>>((r) => r.data);
}

/**
 * 上报当前用户的监控卡片布局（异步、去抖、失败不影响本地保存）。
 *
 * @param layout 完整布局（cards + grid）
 */
export function pushMonitorLayout(layout: unknown): void {
  if (remoteState === "unsupported") return;
  pendingLayout = layout;
  if (flushTimer) clearTimeout(flushTimer);
  // 500ms 静默：拖拽/缩放期间每帧都会触发保存，攒成一次请求
  flushTimer = setTimeout(() => {
    flushTimer = null;
    const payload = pendingLayout;
    pendingLayout = null;
    if (!payload) return;
    pushChain = pushChain.then(async () => {
      try {
        await writeGrid(payload);
        remoteState = "ok";
      } catch (err) {
        remoteState = "unsupported";
        warnOnce(
          `[monitor-cards] 卡片布局上报失败（${String(err)}）。` +
            "本地存档仍然有效；如需跨设备同步，请确认后端用户配置接口可用。",
        );
      }
    });
  }, 500);
}

/**
 * 立即冲刷待上报的布局（页面卸载前调用，避免最后一笔改动只留在本地）。
 */
export function flushMonitorLayout(): void {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  const payload = pendingLayout;
  pendingLayout = null;
  if (!payload) return;
  pushChain = pushChain.then(async () => {
    try {
      await writeGrid(payload);
    } catch (err) {
      warnOnce(`[monitor-cards] 卡片布局上报失败（${String(err)}）`);
    }
  });
}

/** 远端同步当前是否可用（调试 / 测试用） */
export function isMonitorLayoutRemoteAvailable(): boolean {
  return remoteState === "ok";
}
