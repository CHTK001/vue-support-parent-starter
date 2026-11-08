/**
 * 独立文件存储服务器 API 封装
 *
 * 对应后端文件存储服务暴露的 REST 接口：
 *   1) 路径规则 /{bucket}/{key}，bucket 为注册的存储名（如 local）
 *   2) GET  /{bucket}          — 根目录对象列表（JSON）
 *   3) GET  /{bucket}/{dir}    — 子目录浏览（目录 Key 自动回退列表 JSON）
 *   4) PUT  /{bucket}/{key}    — 上传（body 为原始文件内容）
 *   5) GET  /{bucket}/{key}    — 下载/预览（?download=true 强制附件下载）
 *   6) HEAD /{bucket}/{key}    — 存在性检查（200 存在 / 404 不存在）
 *   7) DELETE /{bucket}/{key}  — 删除（目录递归删除）
 *   8) POST /{bucket}?action=mkdir|mkfile|rename|copy|move|unzip — 文件管理动作
 *   9) GET  /{bucket}?action=zip&sources= — 打包下载 ZIP
 *  10) POST /{bucket}?action=setConfig&token= — 管理员动态修改行为配置（实时生效）
 *
 * 该服务为独立 HTTP 服务（非网关代理），通过 createHttp 指定 baseUrl，
 * 与业务接口共用统一链式请求封装。
 */
import { AxiosError, createHttp, getAccessToken, getUserInfo } from "@repo/utils";
import type { Http } from "@repo/utils";
import { getConfig } from "@repo/config";
import { createObjectTicketResolver } from "./objectTicket";
import type { ResolveOptions } from "./objectTicket";

/**
 * 当前协同用户标识（协同接口的统一身份来源）。
 *
 * <p>口径与终端共享一致：从框架 storage 的登录用户信息里取
 * {@code sysUserId} → {@code userId} → {@code id}，缺省 {@code "anonymous"}。
 * 协同接口用它判定 {@code canWrite} / {@code isOwner}，各调用点若不显式传
 * {@code userId} 就落到这里，避免「有的地方传、有的地方漏」导致权限判定失效。</p>
 *
 * @return 当前用户标识
 */
export function collabCurrentUserId(): string {
  const info = getUserInfo<Record<string, unknown>>() ?? {};
  const id = info.sysUserId ?? info.userId ?? info.id;
  return id == null || id === "" ? "anonymous" : String(id);
}

/**
 * 当前登录用户的显示名（协同光标 / 在线成员列表用）。
 *
 * <p>取值顺序与账号域一致：昵称 → 用户名 → 姓名 → 标识；都没有时退回
 * {@code 用户 <id>}，保证协同里不会出现空白名字。</p>
 *
 * @return 显示名
 */
export function collabCurrentUserName(): string {
  const info = getUserInfo<Record<string, unknown>>() ?? {};
  const name =
    info.sysUserNickname ?? info.nickName ?? info.nickname ??
    info.sysUserUsername ?? info.userName ?? info.username ??
    info.realName ?? info.name;
  return name == null || name === "" ? `用户 ${collabCurrentUserId()}` : String(name);
}

/** localStorage 中服务器地址的键名 */
const SERVER_KEY = "filestorage.server";

/** localStorage 中默认存储桶的键名 */
const BUCKET_KEY = "filestorage.bucket";

/** localStorage 中存储配额（GB）的键名 */
const QUOTA_KEY = "filestorage.quotaGb";

/**
 * 默认服务器地址（app.yaml otherConfig.filestorage.server 未配置时兜底）。
 *
 * <p>文件存储服务器 FileStorageServerFilter 独立 HTTP 服务，默认监听 18082。
 * 后端 CorsFilter 默认开启 CORS（allowedOrigins=*, allowCredentials=true），
 * 前端直接发起跨域请求，无需 Vite 代理。</p>
 */
export const DEFAULT_SERVER = "http://127.0.0.1:18082";

/** 默认存储桶名称（app.yaml otherConfig.filestorage.bucket 未配置时兜底） */
export const DEFAULT_BUCKET = "local";

/** 默认存储配额 GB（app.yaml otherConfig.filestorage.quotaGb 未配置时兜底） */
export const DEFAULT_QUOTA_GB = 5;

/** app.yaml 中文件服务器配置节（otherConfig.filestorage） */
interface FileStorageAppConfig {
  /** 文件服务器地址（standalone=绝对 URL；embedded=应用内相对路径，如 /fs 或 /system/api/fs） */
  server?: string;
  /** 部署形态：embedded（默认）/ standalone */
  mode?: string;
  /** 默认存储桶（provider 名） */
  bucket?: string;
  /** 存储配额（GB），用于"存储用量"进度展示 */
  quotaGb?: number;
}

/**
 * 读取 app.yaml 中 otherConfig.filestorage 配置（未配置或加载失败返回空对象）
 *
 * @return 文件服务器配置
 */
function appFileStorageConfig(): FileStorageAppConfig {
  try {
    const cfg = getConfig() as unknown as { other?: { filestorage?: FileStorageAppConfig } };
    return cfg?.other?.filestorage ?? {};
  } catch {
    return {};
  }
}

/**
 * 对象元数据（列表项）
 */
export interface StorageObject {
  /** 对象名称 */
  name: string;
  /** 字节大小 */
  size: number;
  /** 是否为目录 */
  directory: boolean;
  /** 最后修改时间（毫秒时间戳） */
  lastModified?: number;
}

/**
 * 存储桶公开配置（?format=config 返回结构，不含敏感字段）
 */
export interface BucketConfig {
  /** 存储桶名 */
  bucket: string;
  /** 存储实现类简称 */
  storage: string;
  /** 开关 */
  openPreview: boolean;
  /** 开关 */
  openDownload: boolean;
  /** 开关 */
  openRange: boolean;
  /** 开关 */
  openWatermark: boolean;
  /** 开关 */
  openWebjars: boolean;
  /** 开关 */
  openRemoteFile: boolean;
  /**
   * 三方 URL 预览能力（FileStorageUrlPreviewProvider SPI 实现名，NONE 表示关闭）
   *
   * <p>不是布尔开关：可选实现由后台 SPI 枚举并下发给前端，管理员显式选择后才生效；
   * 只有声明 supported=true 的实现（内置为 SERVER，即后台拉取）才真正放行 ?url=。</p>
   */
  thirdUrlPreview: string;
  /** 水印文字（可能为空） */
  watermark: string | null;
  /** 布局开关 */
  layout: boolean;
  /** 布局类型 */
  layoutType: string;
  /** 详情视图是否显示"类型"列 */
  showFormat: boolean;
  /** 详情视图是否显示"大小"列 */
  showSize: boolean;
  /** 详情视图是否显示"修改时间"列 */
  showTime: boolean;
  /** 图片滤镜（ImageFilter SPI 扩展名，NONE 表示原图） */
  imageFilter: string;
  /**
   * URL 参数能力实现（FileStorageFileSetting SPI 扩展名，默认 jdk）
   *
   * <p>决定 ?size=100x100&format=webp 这类文件级参数由哪个后台 SPI 解析；
   * 可选值来自能力接口的 fileSettingCapabilities，前端不硬编码。</p>
   */
  fileSettingKey?: string;
  /** 是否启用路径穿透防护（默认开启） */
  openPathGuard: boolean;
  /** 是否启用全局图片滤镜链（默认关闭） */
  imageFilterEnabled: boolean;
  /** 全局图片滤镜链（紧凑串 id:key=value;id2；可空） */
  filterChain: string | null;
  /** 是否私有桶（私有桶请求需携带访问令牌，由 OAuthServerFilter 鉴权） */
  private?: boolean;
  /** 全部私有桶（provider 名） */
  privateBuckets?: string[];
  /** 一次性链接默认有效期（毫秒） */
  oneTimeTtlMs: number;
}

/**
 * 目录列表响应结构
 */
interface ListResponse {
  bucket?: string;
  path?: string;
  count?: number;
  total?: number;
  items?: StorageObject[];
}

/**
 * 运行时文件服务器配置（进入页面先请求 /v2/file/server-config 获得）。
 *
 * <p>优先级高于 localStorage：后端配置接口是当前部署的权威来源，
 * 避免本地残留的独立端口地址把嵌入式部署带偏。</p>
 */
let runtimeFileServer: { mode?: string; server?: string; pathPrefix?: string; bucket?: string } | null = null;
/** 配置接口请求结果：null=尚未请求；true=成功取得运行时配置；false=失败（可回退旧配置） */
let configDiscoveryOk: boolean | null = null;

/** 配置接口请求失败详情（供页面提示/日志） */
export interface FileServerConfigError {
  /** HTTP 状态码；无响应时为 0 */
  status?: number;
  /** 后端 msg（如有） */
  message?: string;
}

let configDiscoveryError: FileServerConfigError | null = null;

/**
 * 文件服务器运行期配置（GET /v2/file/server-config 返回体）
 */
export interface FileServerConfig {
  /** 部署形态：embedded / standalone */
  mode: string;
  /** embedded=相对路径（如 /fs）；standalone=http://host:port */
  server: string;
  /** 内置形态路径前缀 */
  pathPrefix?: string;
  /** 默认存储桶 */
  bucket?: string;
}

/**
 * 请求文件服务器当前配置（进入 #/files 前必须调用）。
 *
 * <p>这是「先问后端再连文件服务」的入口：成功后运行时配置生效，
 * 后续 {@link #getServerBase()} / {@link #getDefaultBucket()} 都以它为第一优先级；
 * 请求失败时回退到 localStorage / app.yaml，并对外暴露失败状态，页面据此提示降级。</p>
 *
 * @return 配置结果；失败返回 null
 */
export async function loadFileServerConfig(): Promise<FileServerConfig | null> {
  configDiscoveryOk = false;
  configDiscoveryError = null;
  try {
    // createHttp() 的 then 回调拿到的是 AxiosResponse（.data=业务体 {code,data,msg}），
    // 但宿主若已注入剥层拦截器，then 回调拿到的就是业务体本身。两者都要兼容：
    // 逐层剥开 data，直到出现带 mode/server 的配置对象为止。
    const res = await createHttp({ headers: authHeaders() }).get("/v2/file/server-config");
    const config = unwrapFileServerConfig(res);
    if (!config?.mode || !config?.server) {
      configDiscoveryError = { message: "配置接口返回内容不完整" };
      return null;
    }
    runtimeFileServer = {
      mode: config.mode,
      server: config.server,
      pathPrefix: config.pathPrefix,
      bucket: config.bucket,
    };
    configDiscoveryOk = true;
    return config;
  } catch (e) {
    if (e instanceof AxiosError) {
      configDiscoveryError = {
        status: e.response?.status ?? 0,
        message: e.response?.data?.msg ?? e.message,
      };
    } else {
      configDiscoveryError = { message: (e as Error)?.message ?? "配置请求失败" };
    }
    return null;
  }
}

/**
 * 从响应里剥出文件服务器配置对象。
 *
 * <p>兼容三种形态：</p>
 * <ul>
 *   <li>AxiosResponse → {@code res.data} 是 {@code {code,data,msg}} 业务体；</li>
 *   <li>剥层后业务体 → {@code res} 就是 {@code {code,data,msg}}；</li>
 *   <li>直接配置体 → {@code res} 或 {@code res.data} 就是 {@code {mode,server,...}}。</li>
 * </ul>
 *
 * @param res 请求响应（可能是 AxiosResponse / 业务体 / 配置体）
 * @return 配置对象；无法剥出时返回 null
 */
function unwrapFileServerConfig(res: unknown): FileServerConfig | null {
  let cur: unknown = res;
  for (let i = 0; i < 3; i++) {
    if (cur == null || typeof cur !== "object") break;
    const obj = cur as Record<string, unknown>;
    // 已剥到配置体：有 mode/server 即止
    if (typeof obj.mode === "string" && typeof obj.server === "string") {
      return obj as unknown as FileServerConfig;
    }
    const next = obj.data;
    if (next == null || next === cur) break;
    cur = next;
  }
  return null;
}

/**
 * 返回配置接口是否成功取得运行时配置。
 *
 * @return true=运行时配置生效；false=失败；null=尚未请求/未指定
 */
export function isFileServerConfigDiscovered(): boolean | null {
  return configDiscoveryOk;
}

/**
 * 返回最近一次配置接口失败详情；成功或尚未请求时为 null。
 */
export function getFileServerConfigError(): FileServerConfigError | null {
  return configDiscoveryError;
}

/**
 * 清空运行时配置与失败状态（重置后应按旧逻辑重新发现）。
 */
export function clearRuntimeFileServerConfig(): void {
  runtimeFileServer = null;
  configDiscoveryOk = null;
  configDiscoveryError = null;
}

/**
 * 读取文件服务器地址
 *
 * <p>优先级：运行时配置（{@link #loadFileServerConfig()} 请求成功）＞
 * localStorage（页面级覆盖）＞ spring starter 下发
 * {@code other.filestorage.mode + server}＞ 当前地址（window.location.origin）。</p>
 *
 * <p><b>嵌入/独立分流</b>：后端配置接口返回
 * {@code mode=embedded|standalone} 与 {@code server}；
 * embedded 的 server 是相对路径（如 /fs 或 /system/api/fs），
 * 必须用当前 origin 拼出完整地址；standalone 的 server 是完整 http://host:port，
 * 直接使用，不再落到 window.location.origin。</p>
 *
 * @return 文件服务器地址（已去除尾部斜杠）
 */
export function getServerBase(): string {
  const runtime = runtimeFileServer?.server?.trim();
  if (runtime) {
    return embbedResolve(runtime, runtimeFileServer?.mode || "embedded");
  }
  const stored = localStorage.getItem(SERVER_KEY);
  if (stored) {
    return stored.replace(/\/+$/, "");
  }
  const cfg = appFileStorageConfig();
  const configured = cfg.server?.trim();
  const mode = (cfg.mode || "embedded").toLowerCase();
  if (!configured) {
    return typeof window !== "undefined" ? window.location.origin : DEFAULT_SERVER;
  }
  return embbedResolve(configured, mode);
}

/**
 * 按 embedded/standalone 语义把后端下发的 server 归一成完整请求地址。
 */
function embbedResolve(configured: string, mode: string): string {
  if (mode === "standalone" || /^https?:\/\//i.test(configured)) {
    return configured.replace(/\/+$/, "");
  }
  // 嵌入：相对路径（/fs 或 /system/api/fs），由前端拼当前页面 origin。
  const origin = typeof window !== "undefined" ? window.location.origin : DEFAULT_SERVER;
  const relative = configured.startsWith("/") ? configured.slice(1) : configured;
  if (!relative) return origin;
  return `${origin}/${relative}`.replace(/\/+$/, "");
}

/**
 * 保存服务器地址
 *
 * @param value 服务器地址
 */
export function setServerBase(value: string): void {
  localStorage.setItem(SERVER_KEY, value.replace(/\/+$/, ""));
}

/**
 * 读取默认存储桶
 *
 * @return 存储桶名称
 */
export function getDefaultBucket(): string {
  return runtimeFileServer?.bucket?.trim()
    || localStorage.getItem(BUCKET_KEY)
    || appFileStorageConfig().bucket
    || DEFAULT_BUCKET;
}

/**
 * 读取存储配额（字节）
 *
 * <p>优先级：localStorage（页面级覆盖）＞ app.yaml otherConfig.filestorage.quotaGb ＞ 默认 5GB。</p>
 *
 * @return 配额字节数
 */
export function getQuotaBytes(): number {
  const rawLocal = localStorage.getItem(QUOTA_KEY);
  const gb = Number(rawLocal || appFileStorageConfig().quotaGb || DEFAULT_QUOTA_GB);
  const safe = Number.isFinite(gb) && gb > 0 ? gb : DEFAULT_QUOTA_GB;
  return safe * 1024 * 1024 * 1024;
}

/**
 * 保存默认存储桶
 *
 * @param value 存储桶名称
 */
export function setDefaultBucket(value: string): void {
  localStorage.setItem(BUCKET_KEY, value);
}

/**
 * 文件服务器识别登录令牌的请求头名
 *
 * <p>与服务端 {@code OAuthServerFilter.DEFAULT_TOKEN_NAME} 必须一致。
 * 服务端的解析顺序是 自定义头 -> Authorization Bearer -> 查询参数 -> Cookie，
 * 因此程序化请求（axios / XHR）走这个头即可。</p>
 */
const TOKEN_HEADER = "x-oauth-token";

/**
 * 构造带令牌的请求头
 *
 * <p><b>只发一个头</b>：服务端（{@code OAuthServerFilter}）的解析顺序是
 * 自定义头 -> Authorization Bearer -> 查询参数 -> Cookie，**任一命中即通过**，
 * 因此同时发 {@code x-oauth-token} 与 {@code Authorization: Bearer} 属于
 * **把同一份令牌重复传输两遍**：请求头更大、CORS 预检的
 * {@code Access-Control-Request-Headers} 列表更长，且两处不一致时排查困难。
 * 这里只发文件服务器**文档化的默认入口** {@code x-oauth-token}。</p>
 *
 * <p>服务端仍然**同时支持**两者（未做改动），换回 {@code Authorization} 只需改这一处。</p>
 *
 * <p>无法自定义请求头的场景（{@code img src} / iframe / 下载直链）改走
 * {@link resolveObjectUrl} 的短时一次性票据；查询参数形式**不再**用于携带访问令牌
 * （令牌进 URL 会留在访问日志、浏览器历史里，还会经 Referer 外泄给第三方）。</p>
 *
 * @returns 请求头；未登录返回 undefined
 */
function tokenHeaders(): Record<string, string> | undefined {
  const token = getAccessToken();
  if (!token) {
    return undefined;
  }
  return { [TOKEN_HEADER]: token };
}

/**
 * 供组件内程序化 {@code fetch} 使用的鉴权头。
 *
 * <p>能自定义请求头的场景（fetch / XHR）一律走这里，令牌只出现在请求头里。
 * 令牌进 URL 会留在浏览器历史、网关访问日志并经 Referer 外泄。</p>
 *
 * @returns 请求头；未登录返回空对象（便于无条件下发）
 */
export function authHeaders(): Record<string, string> {
  return tokenHeaders() ?? {};
}

/**
 * 创建指向文件服务器的请求实例
 *
 * 每次调用按最新配置创建，保证地址修改后即时生效。
 * 显式附带应用登录令牌（Authorization: Bearer &lt;accessToken&gt;），
 * 供文件服务器私有桶（OAuthServerFilter）鉴权；未登录时保持匿名，公共桶不受影响。
 *
 * @return Http 实例
 */
function storageHttp(): Http {
  return createHttp({
    baseUrl: getServerBase(),
    useAppConfig: false,
    timeout: 30_000,
    headers: tokenHeaders(),
  });
}

/**
 * 构建对象访问 URL 路径
 *
 * @param bucket   存储桶名
 * @param key      对象 Key（空表示桶根路径）
 * @return 相对路径，如 /local/docs/a.txt
 */
function objectPath(bucket: string, key = ""): string {
  const encodedKey = key
    ? `/${key.split("/").map(encodeURIComponent).join("/")}`
    : "";
  return `/${encodeURIComponent(bucket)}${encodedKey}`;
}

/**
 * 构建对象完整访问 URL（用于 window.open / img / iframe 直链）
 *
 * <p><b>不再拼接访问令牌。</b>此前登录态下把令牌塞进 {@code ?x-oauth-token=}，
 * 而令牌进 URL 会被复制到浏览器历史、网关访问日志、被 Referer 带给第三方，
 * 以及用户的截图里。需要直链的场景请改用 {@link resolveObjectUrl}：
 * 它先向网关换一张短时一次性票据，再返回不含令牌的票据 URL。</p>
 *
 * <p>保留本函数是为了让「不持有令牌」的调用方（公共桶、登出态）仍能同步拼出直链，
 * 行为与修复前对公共桶完全一致。</p>
 *
 * @param bucket   存储桶名
 * @param key      对象 Key
 * @param download 是否强制附件下载
 * @return 完整 URL（不含任何凭据）
 */
export function objectUrl(bucket: string, key: string, download = false): string {
  const params = new URLSearchParams();
  if (download) {
    params.set("download", "true");
  }
  const suffix = params.toString();
  return `${getServerBase().replace(/\/+$/, "")}${objectPath(bucket, key)}${suffix ? `?${suffix}` : ""}`;
}

/**
 * 解析可直接放进 {@code <img src>} / iframe / {@code window.open} 的对象地址。
 *
 * <p>登录态下先签发一张短时一次性票据，返回的 URL 里<b>不含访问令牌</b>；
 * 未登录或签发失败时退化为 {@link objectUrl} 的无凭据直链。
 * 详见 {@link objectTicket.ts}。</p>
 *
 * @param bucket   存储桶名
 * @param key      对象 Key
 * @param options  附加参数 / 票据有效期
 * @return 可直连的 URL
 */
export function resolveObjectUrl(
  bucket: string,
  key: string,
  options?: ResolveOptions,
): Promise<string> {
  return objectTicketResolver(bucket, key, options);
}

/**
 * 票据解析器单例。
 *
 * <p>签发一律用 {@code type=expiry}（限时可多次访问）而不是 {@code once}（阅后即焚）：
 * {@code once} 票据被浏览器读一次就销毁，而 {@code <img>} 在缩放、切换标签、
 * 重新布局时都会重发请求，{@code once} 会渲染成一片破碎图。
 * 相比之下「一次性链接」比这里的语义更接近「短时票据」。</p>
 */
const objectTicketResolver = createObjectTicketResolver({
  hasToken: () => Boolean(getAccessToken()),
  mint: async (bucket, key, ttlSeconds) => {
    const { url } = await createOneTimeLink(bucket, key, ttlSeconds, "expiry");
    return { token: "", url: `${getServerBase().replace(/\/+$/, "")}${url}` };
  },
  directUrl: (bucket, key) => objectUrl(bucket, key),
  onWarn: (message, error) => {
    console.warn(`[filestorage] ${message}`, error);
  },
});

/**
 * 将异常转换为可读错误消息
 *
 * @param e      捕获的异常
 * @param action 操作描述
 * @return 错误消息
 */
function toErrorMessage(e: unknown, action: string): string {
  const err = e as { response?: { status?: number; data?: unknown } } | null;
  const status = err?.response?.status;
  if (status != null) {
    // 服务端的错误正文几乎总是可读的纯文本（Forbidden: invalid admin token、
    // Directory Not Found: 1/1），只报 HTTP 状态码等于把最有用的线索丢掉；
    // 正文取不到时才退回状态码
    const body = serverErrorBody(err?.response?.data);
    return body ? `${action}失败：${body}` : `${action}失败（HTTP ${status}）`;
  }
  return (e as Error)?.message ?? `${action}失败`;
}

/**
 * 存储请求错误
 *
 * <p>{@link toErrorMessage} 只保留可读文案，会把 HTTP 状态码丢掉，于是上层
 * 分不清「桶名在服务端不存在（404/410，可自愈）」和「网络断了 / 权限不足
 * （不可自愈）」两种完全不同的故障。这里把状态码挂回错误对象。</p>
 */
export interface StorageRequestError extends Error {
  /** HTTP 状态码；响应根本没拿到时为 undefined */
  status?: number;
}

/**
 * 构造携带状态码的存储错误
 *
 * <p>供各查询通道复用：CAD / 压缩包条目等通道拿到 404 时，
 * 上层面板要靠 {@code status} 区分「对象不存在（可自愈提示）」
 * 与「网络 / 权限故障」，只报文案会丢掉这个判别依据。</p>
 *
 * @param action 出错动作（如「列表查询」）
 * @param e      原始异常
 * @returns 带 status 的错误
 */
export function storageError(action: string, e: unknown): StorageRequestError {
  const err = new Error(toErrorMessage(e, action)) as StorageRequestError;
  const status = (e as { response?: { status?: number } })?.response?.status;
  if (typeof status === "number") err.status = status;
  return err;
}

/**
 * 报错是否意味着「桶名在服务端不存在」
 *
 * <p>文件服务器按**注册的存储名**提供路由，桶名写错就是 404/410。
 * 这是唯一一类**可以自动回落**的故障：多半是浏览器里残留了历史桶名
 * （改过 app.yaml 的 filestorage.bucket 之后旧值不会自己消失，
 * 且 {@link FileStorageManage} 只在列表加载**成功**时才写回桶名，
 * 于是桶名错 → 列表必失败 → 永远不写回 → 永远错，形成死锁）。</p>
 *
 * @param e 捕获到的错误
 * @returns 是「桶名不存在」返回 true
 */
export function isBucketMissingError(e: unknown): boolean {
  const status = (e as StorageRequestError)?.status;
  return status === 404 || status === 410;
}

/**
 * app.yaml 配置的桶名（**不含** localStorage 覆盖）
 *
 * @return app.yaml 的桶名，未配置时返回代码默认值
 */
export function getAppDefaultBucket(): string {
  return appFileStorageConfig().bucket || DEFAULT_BUCKET;
}

/**
 * 当前桶名是否来自 localStorage 覆盖
 *
 * @returns localStorage 里存过桶名返回 true
 */
export function hasBucketOverride(): boolean {
  return typeof localStorage !== "undefined" && !!localStorage.getItem(BUCKET_KEY);
}

/**
 * 清掉 localStorage 里的桶名覆盖，让读取回落到 app.yaml
 */
export function clearBucketOverride(): void {
  if (typeof localStorage !== "undefined") localStorage.removeItem(BUCKET_KEY);
}

/**
 * 提取服务端错误正文
 *
 * <p>兼容两种形态：纯文本（文件服务器的错误基本都是），以及统一响应体
 * {@code {code,msg,data}}（经网关包装时）。取不到返回空串。</p>
 *
 * @param data 响应体
 * @return 可读错误文本；无可读内容时返回空串
 */
function serverErrorBody(data: unknown): string {
  if (typeof data === "string") {
    return data.trim().slice(0, 200);
  }
  if (data && typeof data === "object") {
    const obj = data as { msg?: unknown; message?: unknown; error?: unknown };
    const raw = obj.msg ?? obj.message ?? obj.error;
    if (typeof raw === "string" && raw.trim()) {
      return raw.trim().slice(0, 200);
    }
  }
  return "";
}

/**
 * 查询对象列表（支持子目录）
 *
 * @param bucket 存储桶名
 * @param path   子目录路径（空表示根目录）
 * @return 对象元数据列表
 */
export async function listObjects(bucket: string, path = ""): Promise<StorageObject[]> {
  try {
    const res = await storageHttp()
      .get(objectPath(bucket, path))
      .query({ format: "json" })
      .then<ListResponse>((r) => r.data);
    return res.items ?? [];
  } catch (e) {
    throw storageError("列表查询", e);
  }
}

/**
 * 分页查询对象列表
 *
 * @param bucket 存储桶名
 * @param path   子目录路径（空表示根目录）
 * @param options 分页参数（limit/offset 均可选）
 * @return 对象元数据列表与本页对应的目录总数
 */
export async function listObjectsPaged(
  bucket: string,
  path = "",
  options: { limit?: number; offset?: number } = {}
): Promise<{ items: StorageObject[]; total: number }> {
  try {
    const query: Record<string, string | number> = { format: "json" };
    if (options.limit != null && options.limit > 0) query.limit = options.limit;
    if (options.offset != null && options.offset > 0) query.offset = options.offset;
    const res = await storageHttp()
      .get(objectPath(bucket, path))
      .query(query)
      .then<ListResponse>((r) => r.data);
    const items = res.items ?? [];
    return { items, total: res.total ?? items.length };
  } catch (e) {
    throw storageError("列表查询", e);
  }
}

/**
 * 获取存储桶公开配置
 *
 * @param bucket 存储桶名
 * @return 配置对象
 */
export async function getBucketConfig(bucket: string): Promise<BucketConfig> {
  try {
    const res = await storageHttp()
      .get(objectPath(bucket))
      .query({ config: "true" })
      .then<BucketConfig>((r) => r.data);
    return res;
  } catch (e) {
    throw storageError("配置获取", e);
  }
}

/**
 * SPI 能力项（滤镜实现）
 */
export interface SpiCapability {
  /** SPI 名称 */
  name: string;
  /** 人类可读标签 */
  label: string;
  /** 前端预览用 CSS filter 值（来自 FileStorageImageFilterProvider#getCssFilter，可能为空） */
  css?: string;
  /**
   * 图片路径参数（来自 FileStorageImageFilterProvider#getPathParam）
   *
   * <p>非空时前端把它拼进图片地址，图片渲染因此先经过该滤镜（后台处理）；</p>
   *
   * <p>为空表示后台图片管线不执行该滤镜（原图，或反色/怀旧/鲜艳这类
   * 后台不支持的效果），此时前端回退到 css 做即时预览。</p>
   */
  path?: string;
  /** 该滤镜是否由后台图片管线真正执行（true 时前端不再叠加 CSS，避免同一滤镜作用两次） */
  server?: boolean;
}

/**
 * 三方 URL 预览能力项（FileStorageUrlPreviewProvider SPI 实现）
 */
export interface SpiUrlPreviewer {
  /** 实现名（写入配置，如 NONE / SERVER） */
  name: string;
  /** 展示名（如「关闭」「后台」） */
  label: string;
  /** 实现说明（作为选项描述下发展示） */
  description?: string;
  /** 是否真正支持 ?url=（只有 true 的实现被选中时才放行） */
  supported?: boolean;
}

/**
 * 远程文件读取器 SPI 实现（FileStorageRemoteReader SPI）
 */
export interface SpiRemoteReader {
  /** 实现名（如 SSH） */
  name: string;
  /** 展示名（如「SSH 远程」） */
  label: string;
  /** 实现说明 */
  description?: string;
  /** 支持的 URL 协议前缀（如 ssh://） */
  protocol: string;
  /** 是否支持远程读取 */
  supported?: boolean;
}

/**
 * SPI 能力分组（某一 SPI 接口的能力列表）
 */
export interface SpiCapabilityGroup {
  /** SPI 实现名（写入配置） */
  spi: string;
  /** 展示名（来自后台 SPI，如「JDK 内置」；缺失时回退到 spi） */
  label?: string;
  /** 实现说明（下拉选项描述） */
  description?: string;
  /** 支持的能力标识列表 */
  capabilities: string[];
}

/**
 * SPI 能力响应结构
 */
export interface CapabilitiesResponse {
  /** URL 参数能力（FileStorageFileSetting SPI） */
  fileSettingCapabilities: SpiCapabilityGroup[];
  /** 全局滤镜能力（FileStorageFilterSetting SPI） */
  filterSettingCapabilities: SpiCapabilityGroup[];
  /** 图片滤镜实现列表（ImageFilter SPI，含 name + label + 图片路径参数） */
  imageFilters: SpiCapability[];
  /** 三方 URL 预览能力实现列表（FileStorageUrlPreviewProvider SPI） */
  urlPreviewers: SpiUrlPreviewer[];
  /** 远程文件读取器实现列表（FileStorageRemoteReader SPI） */
  remoteReaders: SpiRemoteReader[];
}

/**
 * 获取 SPI 真实支持的能力列表（滤镜、URL参数等，供前端动态渲染配置项）
 *
 * @param bucket 存储桶名
 * @return 能力列表
 */
export async function getCapabilities(bucket: string): Promise<CapabilitiesResponse> {
  try {
    const res = await storageHttp()
      .get(objectPath(bucket))
      .query({ format: "capabilities" })
      .then<CapabilitiesResponse>((r) => r.data);
    return res;
  } catch (e) {
    throw new Error(toErrorMessage(e, "能力列表获取"));
  }
}

/**
 * 压缩包条目（?format=archive 返回）
 */
export interface ArchiveEntry {
  /** 包内完整路径（不含压缩包自身文件名） */
  path: string;
  /** 末段名称 */
  name: string;
  /** 是否为目录 */
  directory: boolean;
  /** 解压后大小（字节；目录为 0） */
  size: number;
  /** 压缩后大小（字节）；归档未记录时为 -1，表示未知 */
  compressedSize: number;
  /** 最后修改时间（epoch 毫秒；无时间戳时为 0） */
  modified: number;
}

/**
 * 压缩包结构响应（?format=archive）
 */
export interface ArchiveScanResponse {
  /** 压缩包文件名 */
  name: string;
  /** 压缩包扩展名（小写） */
  extension: string;
  /** 压缩包自身体积（字节） */
  archiveSize: number;
  /** 文件数 */
  fileCount: number;
  /** 目录数 */
  dirCount: number;
  /** 解压后总体积（字节） */
  totalSize: number;
  /** 压缩率（%）：archiveSize / totalSize，空包为 0 */
  compressRate: number;
  /** 扁平条目清单（已去重并补全隐式目录） */
  entries: ArchiveEntry[];
}

/**
 * 查询压缩包条目清单（WASM + 后台降级）
 *
 * 优先使用浏览器 WASM (archive-wasm/libarchive) 扫描压缩包结构，
 * 避免一次服务器往返；扫描失败时自动降级到 {@link getArchiveEntries}。
 *
 * @param bucket   存储桶名
 * @param key      压缩包对象 Key
 * @param fileName 文件名（用于扩展名判断）
 * @return 压缩包结构
 */
export async function getArchiveEntriesWithWasm(
  bucket: string,
  key: string,
  fileName: string,
): Promise<ArchiveScanResponse> {
  // 获取文件名后缀用于判断是否支持WASM扫描
  const ext = getFileNameExtension(fileName);
  const archiveExts = [
    "zip", "rar", "tar", "gz", "tgz", "tar.gz",
    "bz2", "tbz2", "tar.bz2", "xz", "txz", "tar.xz",
    "7z", "zst", "tzst", "tar.zst", "lz4", "tar.lz4",
    "lzma", "tar.lzma", "jar", "war", "ear", "apk", "ipa",
  ];

  // If not a supported archive type, skip WASM and go straight to backend
  if (!archiveExts.includes(ext.toLowerCase())) {
    return getArchiveEntries(bucket, key);
  }

  try {
    // Fetch archive data as ArrayBuffer
    const res = await storageHttp()
      .get(objectPath(bucket, key))
      .query({ format: "archive" })
      .responseType("arraybuffer")
      .then<{ data: ArrayBuffer; headers: Record<string, string> }>(
        (r) => ({ data: r.data as ArrayBuffer, headers: r.headers as Record<string, string> }),
      );

    // Check if backend returned JSON (already scanned by backend)
    const contentType = res.headers["content-type"] || "";
    if (contentType.includes("application/json")) {
      // Backend returned JSON structure - parse and return
      const decoder = new TextDecoder("utf-8");
      const jsonStr = decoder.decode(new Uint8Array(res.data));
      const data = JSON.parse(jsonStr) as (ArchiveScanResponse | { error?: string });

      // Check for backend error
      const errText = (data as { error?: string })?.error;
      if (typeof errText === "string") {
        throw new Error(errText);
      }

      if (!data || typeof data !== "object" || !Array.isArray((data as ArchiveScanResponse).entries)) {
        throw new Error("服务端未返回压缩包条目结构（?format=archive 未生效），请更新文件服务器后重试");
      }

      return data as ArchiveScanResponse;
    }

    // Backend returned raw archive bytes - try WASM scanning
    // Lazy-load archive-wasm
    const archiveWasm = await import("archive-wasm");

    const entries = archiveWasm.extractAll(new Uint8Array(res.data), {
      recursive: false,
      normalize: true,
      ignoreDotDir: true,
      sizeLimit: 128n * 1024n * 1024n, // 128MB limit, matches backend
    });

    if (!entries || entries.length === 0) {
      return {
        name: fileName,
        extension: ext.toLowerCase(),
        archiveSize: res.data.byteLength,
        fileCount: 0,
        dirCount: 0,
        totalSize: 0,
        compressRate: 0,
        entries: [],
      };
    }

    // Convert entries to our format
    const archiveEntries: ArchiveEntry[] = [];
    for (const entry of entries) {
      const path = entry.path ?? "";
      if (!path || path === ".") continue;

      const isDir = entry.type === "DIR";
      const name = path.split("/").pop() || path;
      const size = entry.size ? Number(entry.size) : 0;

      let modified = 0;
      if (entry.mtime && typeof entry.mtime === "bigint" && entry.mtime > 0n) {
        modified = Number(entry.mtime / 1000000n);
      }

      archiveEntries.push({
        path,
        name,
        directory: isDir,
        size: isDir ? 0 : size,
        compressedSize: -1,
        modified,
      });
    }

    // Fill implicit directories
    const allEntries = fillImplicitDirs(archiveEntries);

    const fileEntries = allEntries.filter((e) => !e.directory);
    const dirEntries = allEntries.filter((e) => e.directory);
    const totalSize = fileEntries.reduce((sum, e) => sum + e.size, 0);

    const compressRate = totalSize > 0 ? Math.round((res.data.byteLength * 100) / totalSize) : 0;

    return {
      name: fileName,
      extension: ext.toLowerCase(),
      archiveSize: res.data.byteLength,
      fileCount: fileEntries.length,
      dirCount: dirEntries.length,
      totalSize,
      compressRate,
      entries: allEntries.sort((a, b) => {
        if (a.directory !== b.directory) {
          return a.directory ? -1 : 1;
        }
        return a.name.localeCompare(b.name, "zh-Hans-CN");
      }),
    };
  } catch (e) {
    // WASM failed - fall back to backend ?format=archive JSON endpoint
    console.warn("[archive] WASM scanning failed, falling back to backend:", (e as Error)?.message ?? e);
    return getArchiveEntries(bucket, key);
  }
}

/**
 * Get file extension from filename.
 */
function getFileNameExtension(fileName: string): string {
  const parts = fileName.toLowerCase().split(".");
  return parts.length > 1 ? parts[parts.length - 1] : "";
}

/**
 * Fill implicit directories (directories not explicitly listed in the archive).
 */
function fillImplicitDirs(entries: ArchiveEntry[]): ArchiveEntry[] {
  const byPath = new Map<string, ArchiveEntry>();

  for (const entry of entries) {
    byPath.set(entry.path, entry);
  }

  // Add implicit directories from file paths
  for (const entry of Array.from(byPath.values())) {
    if (entry.directory) continue;

    const parts = entry.path.split("/");
    for (let i = 0; i < parts.length - 1; i++) {
      const dirPath = parts.slice(0, i + 1).join("/");
      if (!byPath.has(dirPath)) {
        const dirName = parts[i];
        byPath.set(dirPath, {
          path: dirPath,
          name: dirName,
          directory: true,
          size: 0,
          compressedSize: -1,
          modified: 0,
        });
      }
    }
  }

  return Array.from(byPath.values());
}

/**
 * 查询压缩包条目清单
 *
 * 走 {@code ?format=archive} 纯数据通道，而非 {@code ?preview=true} 的
 * 服务端 HTML 渲染：后者渲染在 iframe 独立文档里，读不到主应用的
 * Element Plus / koi 主题变量，无法跟随系统主题与暗色模式。
 *
 * @param bucket 存储桶名
 * @param key    压缩包对象 Key
 * @return 压缩包结构
 */
export async function getArchiveEntries(bucket: string, key: string): Promise<ArchiveScanResponse> {
  try {
    const res = await storageHttp()
      .get(objectPath(bucket, key))
      .query({ format: "archive" })
      .then<ArchiveScanResponse>((r) => r.data);
    // 服务端解析失败时回的是 422 + {"error": "...", "entries": []}（见
    // FileStorageServerFilter.writeArchiveEntries）。先看 error 字段，
    // 否则下面那句「未生效」会把「文件本身坏了」误报成「服务器版本旧」。
    // 先经 unknown 再断言：ArchiveScanResponse 与 { error: string } 无足够重叠
    // （后者缺 entries），直接 as 会被 TS2352 拒。这里的判定只用 error 字段，
    // 语义与注释一致。
    const errText = (res as unknown as { error?: string } | null)?.error;
    if (typeof errText === "string") {
      throw new Error(errText);
    }
    // 服务端未识别 ?format=archive 时，请求会落到 inline/download 兜底通道并
    // 回吐压缩包原始字节，形状对不上却在调用方渲染期才炸，定位成本很高。
    // 在此提前拦下并给出可操作的错误信息。
    if (!res || typeof res !== "object" || !Array.isArray(res.entries)) {
      throw new Error("服务端未返回压缩包条目结构（?format=archive 未生效），请更新文件服务器后重试");
    }
    return res;
  } catch (e) {
    throw new Error(toErrorMessage(e, "压缩包条目查询"));
  }
}

/**
 * CAD 图纸响应（?format=cad）
 *
 * DXF 与 DWG 结构不同：`renderable` 明确告知能否出图形——
 * DXF 可渲染（svg 有值），DWG 不可渲染（仅头部信息）。
 */
export interface CadInfoResponse {
  /** 文件名 */
  name: string;
  /** 扩展名（小写） */
  extension: string;
  /** 文件字节数 */
  size: number;
  /** 是否能渲染图形（DXF=true；DWG=false） */
  renderable: boolean;
  /**
   * DWG 专用：内容根本不是 DWG（版本码读不出来）
   *
   * <p>与「真 DWG 但几何需外部转换器」是两回事——前者是**文件损坏**，
   * 要重新上传；后者是**格式能力**限制。混为一谈会让人白折腾格式转换。</p>
   */
  notDwg?: boolean;
  /** 内联 SVG（仅 renderable=true 时有值），描边用 currentColor 继承主题色 */
  svg?: string;
  /** DXF 版本声明（$ACADVER） */
  acadVersion?: string;
  /** DXF 图纸单位 */
  units?: string;
  /** 图元总数 */
  entityCount?: number;
  /** 图层数 */
  layerCount?: number;
  /** 图层名 → 该层图元数 */
  layers?: Record<string, number>;
  /** 图形宽度（图纸单位） */
  width?: number;
  /** 图形高度（图纸单位） */
  height?: number;
  /** 解析器跳过的实体类型，如实告知用户哪些内容没画出来 */
  unsupported?: string[];
  /** DWG 版本名称 */
  versionLabel?: string;
  /** DWG 版本代码 */
  versionCode?: string;
  /** DWG AutoCAD 发行号（R15/R32 等） */
  acadRelease?: string;
  /** DWG 维护版本号（-1 表示无） */
  maintenanceVersion?: number;
  /** 不支持时的错误说明 */
  error?: string;
}

/**
 * 查询 CAD 图纸信息
 *
 * 走 {@code ?format=cad} 纯数据通道，而非 {@code ?preview=true} 的服务端渲染：
 * 后者渲染在 iframe 独立文档里，读不到主应用的 Element Plus / koi 主题变量。
 *
 * <p>传 {@code inner} 时解析的是压缩包内的条目（{@code ?format=cad&inner=包内路径}），
 * 于是包内 DXF 与顶层 DXF 走同一套面板；不传则解析对象本身。</p>
 *
 * @param bucket 存储桶名
 * @param key    图纸对象 Key（传 inner 时为压缩包自身的 Key）
 * @param inner  压缩包内条目路径，不传表示不按下钻处理
 * @return CAD 图纸信息
 */
export async function getCadInfo(
  bucket: string,
  key: string,
  inner?: string,
): Promise<CadInfoResponse> {
  try {
    const res = await storageHttp()
      .get(objectPath(bucket, key))
      .query(inner ? { format: "cad", inner } : { format: "cad" })
      .then<CadInfoResponse>((r) => r.data);
    if (!res || typeof res !== "object" || typeof res.renderable !== "boolean") {
      throw new Error("服务端未返回 CAD 图纸结构（?format=cad 未生效），请更新文件服务器后重试");
    }
    return res;
  } catch (e) {
    // 保留 HTTP status：面板据此把「对象不存在（404/410）」
    // 与网络 / 权限故障分开提示，而不是一律显示原始错误正文
    throw storageError("CAD 图纸查询", e);
  }
}

/**
 * 目录树节点
 */
export interface TreeItem {
  /** 目录名 */
  name: string;
  /** 相对路径 */
  path: string;
  /** 子目录 */
  children?: TreeItem[];
}

/** 回收站目录（服务端约定的桶内隐藏目录，列表与目录树都不应出现） */
const RECYCLE_DIR = ".recycle";

/** 递归剔除回收站目录及其子树（目录树用） */
function stripRecycleDir(nodes: TreeItem[]): TreeItem[] {
  return nodes
    .filter((n) => n.name !== RECYCLE_DIR)
    .map((n) => (n.children?.length ? { ...n, children: stripRecycleDir(n.children) } : n));
}

/**
 * 获取目录树（仅目录，KodExplorer 式左侧文件树）
 *
 * <p>已剔除回收站目录 {@code .recycle}：它是服务端约定的桶内隐藏目录，
 * 正常对象列表同样会过滤掉它；若留在树里，用户选中后把文件传进去，
 * 那些文件在列表页就再也看不到、只会出现在回收站里。</p>
 *
 * @param bucket 存储桶名
 * @return 树节点数组
 */
export async function getBucketTree(bucket: string): Promise<TreeItem[]> {
  try {
    const res = await storageHttp()
      .get(objectPath(bucket))
      .query({ tree: "true" })
      .then<TreeItem[]>((r) => r.data);
    return stripRecycleDir(res ?? []);
  } catch (e) {
    throw new Error(toErrorMessage(e, "目录树获取"));
  }
}

/** 上传默认超时（毫秒）：10 分钟 */
const UPLOAD_TIMEOUT_MS = 600_000;

/** 上传被中断时的错误标记，供调用方区分「用户暂停」与「真的失败」 */
const UPLOAD_ABORT_FLAG = "__uploadAborted";

/** 上传进度回调 */
export type UploadProgressHandler = (percent: number, loaded: number, total: number) => void;

/** 上传可选项 */
export interface UploadOptions {
  /** 进度回调（0-100） */
  onProgress?: UploadProgressHandler;
  /** 中断信号：置为 aborted 后本函数 reject，且错误带 {@link UPLOAD_ABORT_FLAG} 标记 */
  signal?: AbortSignal;
  /** 超时毫秒数，默认 {@link UPLOAD_TIMEOUT_MS} */
  timeoutMs?: number;
}

/**
 * 判断一个异常是否为「用户主动中断」
 *
 * @param e 捕获的异常
 * @return 是中断返回 true
 */
export function isUploadAborted(e: unknown): boolean {
  return (e as { [UPLOAD_ABORT_FLAG]?: boolean } | null)?.[UPLOAD_ABORT_FLAG] === true;
}

/**
 * 上传对象（原始内容直传，支持进度与中断）
 *
 * <p>刻意不走共享的 {@link Http} 客户端：那个客户端**没有** AbortSignal 支持
 * （`packages/utils/src/http.ts` 里搜不到 signal / abort / CancelToken），
 * 既给不出真实进度也无法中断，而上传框两样都要；而它是全站共用文件，
 * 不应为单个页面的上传框去改动。这里用 {@link XMLHttpRequest} 自行实现，
 * 只复用本模块已有的 URL 拼装与鉴权头。</p>
 *
 * @param bucket  存储桶名
 * @param key     对象 Key（支持子目录）
 * @param content 文件内容
 * @param options 进度 / 中断 / 超时
 */
export async function putObject(
  bucket: string,
  key: string,
  content: Blob | ArrayBuffer,
  options: UploadOptions = {}
): Promise<void> {
  const { onProgress, signal, timeoutMs = UPLOAD_TIMEOUT_MS } = options;
  const token = getAccessToken();
  // 上传走 XHR，**能自定义请求头**，故令牌只放请求头、不再同时塞进 URL 查询串：
  // 同一份令牌发两遍没有收益，而进 URL 会留在访问日志与浏览器历史里。
  // （无法带头的场景改用一次性票据，见 resolveObjectUrl。）
  const url = `${getServerBase().replace(/\/+$/, "")}${objectPath(bucket, key)}`;

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    let settled = false;

    const finish = (fn: () => void): void => {
      if (settled) {
        return;
      }
      settled = true;
      signal?.removeEventListener("abort", onAbort);
      fn();
    };

    function onAbort(): void {
      // 先置 settled 再 abort：否则 xhr.onerror 会先于 reject 触发，错误标记就丢了
      settled = true;
      signal?.removeEventListener("abort", onAbort);
      xhr.abort();
      const err = new Error("上传已暂停") as Error & { [UPLOAD_ABORT_FLAG]?: boolean };
      err[UPLOAD_ABORT_FLAG] = true;
      reject(err);
    }

    xhr.open("PUT", url, true);
    xhr.timeout = timeoutMs;
    xhr.setRequestHeader("Content-Type", "application/octet-stream");
    if (token) {
      // 只发一个头：服务端解析顺序是「自定义头 -> Authorization -> 查询参数 -> Cookie」，
      // 任一命中即通过，双发等于把同一份令牌重复传输。
      xhr.setRequestHeader("x-oauth-token", token);
    }
    xhr.upload.onprogress = (ev) => {
      // total 可能是 0（分块传输时不带总量），此时不给百分比，避免出现 NaN
      if (!onProgress || !ev.lengthComputable || ev.total <= 0) {
        return;
      }
      onProgress(Math.min(100, Math.round((ev.loaded / ev.total) * 100)), ev.loaded, ev.total);
    };
    xhr.onload = () => {
      finish(() => {
        if (xhr.status >= 200 && xhr.status < 300) {
          // 服务端不回 Content-Length，最后一段补满 100%，否则进度条永远停在 99%
          const total = content instanceof Blob ? content.size : content.byteLength;
          onProgress?.(100, total, total);
          resolve();
        } else {
          reject(new Error(`上传失败（HTTP ${xhr.status}）`));
        }
      });
    };
    xhr.onerror = () => finish(() => reject(new Error("上传失败（网络错误）")));
    xhr.ontimeout = () => finish(() => reject(new Error("上传超时")));
    xhr.onabort = () => finish(() => reject(new Error("上传已取消")));

    if (signal?.aborted) {
      onAbort();
      return;
    }
    signal?.addEventListener("abort", onAbort);
    xhr.send(content as XMLHttpRequestBodyInit);
  }).catch((e: unknown) => {
    // 中断不是错误：调用方据 isUploadAborted 区分「暂停」与「失败」，此处原样抛出
    throw isUploadAborted(e) ? e : new Error((e as Error)?.message ?? "上传失败");
  });
}

/**
 * 删除对象
 *
 * @param bucket 存储桶名
 * @param key    对象 Key
 */
export async function deleteObject(bucket: string, key: string): Promise<void> {
  try {
    await storageHttp().delete(objectPath(bucket, key));
  } catch (e) {
    throw new Error(toErrorMessage(e, "删除"));
  }
}

/**
 * 存在性检查
 *
 * @param bucket 存储桶名
 * @param key    对象 Key
 * @return true 表示存在
 */
export async function existObject(bucket: string, key: string): Promise<boolean> {
  try {
    const res = await storageHttp().head(objectPath(bucket, key));
    return res.status === 200;
  } catch (e) {
    // 404 表示不存在，属于正常业务结果；其余异常向上抛出
    if (e instanceof AxiosError && e.response?.status === 404) {
      return false;
    }
    throw new Error(toErrorMessage(e, "存在性检查"));
  }
}

/**
 * 创建访问链接
 *
 * @param bucket  存储桶名
 * @param key     对象 Key
 * @param type    链接类型：once=一次性（访问即销毁）/ expiry=限时（有效期内多次访问）
 * @param expires 过期时间（秒），如 60（1分钟）、600（10分钟）、3600（1小时）、86400（1天）
 * @return 链接信息
 */
export async function createOneTimeLink(
  bucket: string,
  key: string,
  expires?: number,
  type: "once" | "expiry" = "once",
): Promise<{ token: string; url: string; type: string; expires: string }> {
  try {
    const params: Record<string, string> = { bucket, key, type };
    if (expires != null && expires > 0) params.expires = String(expires);
    const url = "/ot?" + new URLSearchParams(params).toString();
    const res = await storageHttp()
      .post(url)
      .timeout(10000)
      .then<{ token: string; url: string; type: string; expires: string }>((r) => r.data);
    return res;
  } catch (e) {
    throw new Error(toErrorMessage(e, "创建访问链接"));
  }
}

/** 链接管理里的一条访问链接 */
export interface OneTimeLinkItem {
  /** 令牌，用于吊销 */
  token: string;
  /** 文件名（Key 的最后一段） */
  name: string;
  /** 对象 Key */
  key: string;
  /** 存储桶 */
  bucket: string;
  /** once=一次性 / expiry=限时 */
  type: "once" | "expiry";
  /** 是否访问即销毁 */
  once: boolean;
  /** 创建时间（毫秒时间戳） */
  createTime: number;
  /** 过期时间（毫秒时间戳） */
  expiresAt: number;
  /** 剩余有效毫秒数 */
  remainingMs: number;
  /** 相对预览地址（/ot/{token}?preview=true） */
  url: string;
}

/**
 * 列出当前有效的分享链接（一次性 / 限时，不含系统内部预览令牌）。
 *
 * @return 链接列表，按创建时间倒序
 */
export async function listOneTimeLinks(): Promise<OneTimeLinkItem[]> {
  try {
    return await storageHttp()
      .get("/ot")
      .timeout(10000)
      .then<OneTimeLinkItem[]>((r) => (Array.isArray(r.data) ? r.data : []));
  } catch (e) {
    throw new Error(toErrorMessage(e, "读取链接列表"));
  }
}

/**
 * 吊销指定分享链接（关闭后原地址立即失效）。
 *
 * @param token 链接令牌
 */
export async function revokeOneTimeLink(token: string): Promise<void> {
  try {
    await storageHttp().delete(`/ot/${encodeURIComponent(token)}`).timeout(10000);
  } catch (e) {
    throw new Error(toErrorMessage(e, "关闭访问链接"));
  }
}

/* ================== 文件管理动作（KodExplorer 风格） ================== */

/**
 * 文件管理动作统一 POST 封装
 *
 * @param bucket 存储桶名
 * @param action 动作名（mkdir/mkfile/rename/copy/move/unzip）
 * @param params 查询参数
 * @return 动作结果 JSON
 */
async function postAction(
  bucket: string,
  action: string,
  params: Record<string, string>,
): Promise<Record<string, unknown>> {
  try {
    const query = new URLSearchParams({ action, ...params }).toString();
    return await storageHttp()
      .post(`${objectPath(bucket)}?${query}`)
      .then<Record<string, unknown>>((r) => r.data);
  } catch (e) {
    throw new Error(toErrorMessage(e, action));
  }
}

/**
 * 管理员动态修改存储桶行为配置（setConfig，实时生效）
 *
 * @param bucket 存储桶名
 * @param token  管理员令牌（后端每次启动随机生成，getToken() / /config 页可查）
 * @param config 待修改的配置项（部分更新，缺省字段保持原值）
 * @return 动作结果
 */
export async function setBucketConfig(
  bucket: string,
  token: string,
  config: Partial<BucketConfig>,
): Promise<Record<string, unknown>> {
  try {
    const query = new URLSearchParams({ action: "setConfig", token }).toString();
    // 服务端 doSetConfig 用 extractString 解析 privateBuckets（逗号分隔），
    // 而 BucketConfig 里它是 string[]（GET 返回的形态）。这里在出口处拉平成字符串，
    // 免得调用方为了发一个 POST 还要自己拼一次逗号串。
    const { privateBuckets, ...rest } = config;
    const payload: Record<string, unknown> = { ...rest };
    if (Array.isArray(privateBuckets)) {
      payload.privateBuckets = privateBuckets.filter(Boolean).join(",");
    } else if (typeof privateBuckets === "string") {
      payload.privateBuckets = privateBuckets;
    }
    return await storageHttp()
      .post(`${objectPath(bucket)}?${query}`)
      .headers({ "Content-Type": "application/json;charset=UTF-8" })
      .data(JSON.stringify(payload))
      .then<Record<string, unknown>>((r) => r.data);
  } catch (e) {
    const status = (e as { response?: { status?: number } } | null)?.response?.status;
    if (status === 403) {
      // 403 只可能是令牌不匹配。服务端令牌每次启动随机生成，而前端把上次成功的
      // 令牌存在 localStorage，服务端一重启旧值就必然失效——不点破这一点，
      // 用户只看到「Forbidden」，根本不知道该去哪里取新令牌。
      throw new Error(
        "配置保存失败：管理员令牌无效。该令牌由文件服务器每次启动随机生成，"
        + "服务端重启后旧令牌立即失效。请从服务端启动日志「文件服务器管理员令牌」"
        + "一行复制当前值，重新粘贴到「管理员令牌」后再保存。",
      );
    }
    throw new Error(toErrorMessage(e, "配置保存"));
  }
}

/**
 * 新建目录
 *
 * @param bucket 存储桶名
 * @param path   父目录路径（空表示根目录）
 * @param name   新目录名
 */
export async function createDirectory(bucket: string, path: string, name: string): Promise<void> {
  await postAction(bucket, "mkdir", { path, name });
}

/**
 * 新建空文件
 *
 * @param bucket 存储桶名
 * @param path   父目录路径（空表示根目录）
 * @param name   新文件名
 */
export async function createFile(bucket: string, path: string, name: string): Promise<void> {
  await postAction(bucket, "mkfile", { path, name });
}

/**
 * 重命名（同目录改名，目录递归搬运）
 *
 * @param bucket  存储桶名
 * @param path    所在目录路径
 * @param name    原名称
 * @param newName 新名称
 */
export async function renameObject(bucket: string, path: string, name: string, newName: string): Promise<void> {
  await postAction(bucket, "rename", { path, name, newName });
}

/**
 * 复制对象到目标目录（同名自动生成" - 副本"）
 *
 * @param bucket  存储桶名
 * @param sources 源对象 Key 列表
 * @param target  目标目录（空表示根目录）
 * @return 动作结果（含生成的目标键）
 */
export async function copyObjects(
  bucket: string,
  sources: string[],
  target: string,
): Promise<Record<string, unknown>> {
  return postAction(bucket, "copy", { sources: sources.join("\n"), target });
}

/**
 * 移动（剪切粘贴）对象到目标目录
 *
 * @param bucket  存储桶名
 * @param sources 源对象 Key 列表
 * @param target  目标目录（空表示根目录）
 * @return 动作结果（含生成的目标键）
 */
export async function moveObjects(
  bucket: string,
  sources: string[],
  target: string,
): Promise<Record<string, unknown>> {
  return postAction(bucket, "move", { sources: sources.join("\n"), target });
}

/**
 * 解压 ZIP 到目标目录
 *
 * @param bucket 存储桶名
 * @param path   压缩包所在目录
 * @param name   压缩包名称
 * @param target 解压目标目录（空表示压缩包所在目录）
 * @return 动作结果（含解压条目数）
 */
export async function unzipObject(
  bucket: string,
  path: string,
  name: string,
  target = "",
): Promise<Record<string, unknown>> {
  return postAction(bucket, "unzip", { path, name, target });
}

/**
 * 计算打包下载默认压缩包名（与后端规则一致：单对象去扩展名加 .zip，多个为 download.zip）
 *
 * @param sources 源对象 Key 列表
 * @return 压缩包文件名
 */
export function zipArchiveName(sources: string[]): string {
  if (sources.length === 1) {
    const single = sources[0].slice(sources[0].lastIndexOf("/") + 1);
    const dot = single.lastIndexOf(".");
    return (dot > 0 ? single.slice(0, dot) : single) + ".zip";
  }
  return "download.zip";
}

/**
 * 打包下载：将一个或多个对象打包为 ZIP，返回二进制内容
 *
 * @param bucket  存储桶名
 * @param sources 源对象 Key 列表
 * @return ZIP 文件 Blob
 */
export async function downloadZip(bucket: string, sources: string[]): Promise<Blob> {
  try {
    const query = new URLSearchParams({
      action: "zip",
      sources: sources.join("\n"),
    }).toString();
    return await storageHttp()
      .get(`${objectPath(bucket)}?${query}`)
      .responseType("blob")
      .then<Blob>((r) => r.data as Blob);
  } catch (e) {
    throw new Error(toErrorMessage(e, "打包下载"));
  }
}

// ==================== 上传任务（任务化分片上传） ====================

/** 上传任务接口前缀（Spring 侧，非文件服务器直连） */
const UPLOAD_TASK_BASE = "/v2/file/upload-task";

/** 上传任务状态（与后端 UploadTask.State 对应） */
export type UploadTaskState =
  | "UPLOADING"
  | "MERGING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

/** 上传任务快照（后端 /upload-task 接口的任务结构） */
export interface UploadTaskInfo {
  /** 任务号 */
  taskId: string;
  /** 原始文件名 */
  fileName: string;
  /** 文件总字节数（0 = 未知） */
  totalSize: number;
  /** 已收字节数 */
  receivedBytes: number;
  /** 分片大小（字节；0 = 不分片） */
  chunkSize: number;
  /** 分片总数 */
  totalChunks: number;
  /** 已收分片数 */
  receivedChunks: number;
  /** 存储提供者名（空 = 默认提供者） */
  provider: string;
  /** 存储桶/目录路径（空 = 提供者默认桶） */
  bucket: string;
  /** 任务状态 */
  state: UploadTaskState;
  /** 附加消息（失败原因等） */
  message: string;
  /** 存储侧对象键（合并成功后回填） */
  objectKey: string;
  /** 创建时间（毫秒时间戳） */
  createdAt: number;
  /** 文件扩展名（小写，无点） */
  ext?: string;
  /** MIME 类型 */
  mime?: string;
  /** 图片宽度（像素；非图片为 0） */
  width?: number;
  /** 图片高度（像素；非图片为 0） */
  height?: number;
}

/**
 * 请求上传任务接口（走应用登录态，与 server-config 同一通道）
 */
function uploadTaskHttp(): Http {
  return createHttp({ headers: authHeaders() });
}

/**
 * 解包 ReturnResult：code 非 200 抛错，成功返回 data
 */
function unwrapTask<T>(r: { data?: { code?: number; msg?: string; data?: T } }): T {
  const body = r.data;
  if (body && typeof body.code === "number" && body.code !== 200) {
    throw new Error(body.msg || `上传任务接口错误 (${body.code})`);
  }
  return (body?.data ?? (body as unknown)) as T;
}

/**
 * 列出后台已开启的存储桶（提供者名列表），供上传时选择 bucket。
 *
 * @return 提供者名列表（如 ["local", "minio"]）
 */
export async function listUploadBuckets(): Promise<string[]> {
  try {
    return await uploadTaskHttp()
      .get(`${UPLOAD_TASK_BASE}/buckets`)
      .then<string[]>((r) => unwrapTask<string[]>(r) ?? []);
  } catch (e) {
    throw new Error(toErrorMessage(e, "获取 bucket 列表"));
  }
}

/**
 * 创建上传任务（分片上传第一步：只建任务，立即返回任务号）。
 *
 * @param options 任务描述
 * @return 任务快照（含 taskId / totalChunks）
 */
export async function createUploadTask(options: {
  /** 文件名（必填） */
  fileName: string;
  /** 文件总字节数（0 = 未知） */
  totalSize?: number;
  /** 分片大小（字节；0 = 不分片） */
  chunkSize?: number;
  /** 存储提供者名（空 = 默认） */
  provider?: string;
  /** 存储桶/目录（空 = 提供者默认桶） */
  bucket?: string;
}): Promise<UploadTaskInfo> {
  try {
    return await uploadTaskHttp()
      .post(`${UPLOAD_TASK_BASE}/task`)
      .headers({ "Content-Type": "application/json;charset=UTF-8" })
      .data(JSON.stringify(options))
      .then<UploadTaskInfo>((r) => unwrapTask<UploadTaskInfo>(r));
  } catch (e) {
    throw new Error(toErrorMessage(e, "创建上传任务"));
  }
}

/**
 * 上传一个分片（body 为原始分片字节；同片重传幂等覆盖）。
 *
 * @param taskId 任务号
 * @param index  分片序号（0 起）
 * @param chunk  分片内容
 * @return 任务快照（含已收片数，供断点续传判断）
 */
export async function uploadTaskChunk(
  taskId: string,
  index: number,
  chunk: Blob | ArrayBuffer,
): Promise<UploadTaskInfo> {
  try {
    return await uploadTaskHttp()
      .put(`${UPLOAD_TASK_BASE}/task/${taskId}/chunk?index=${index}`)
      .headers({ "Content-Type": "application/octet-stream" })
      .data(chunk)
      .then<UploadTaskInfo>((r) => unwrapTask<UploadTaskInfo>(r));
  } catch (e) {
    throw new Error(toErrorMessage(e, `上传分片 #${index}`));
  }
}

/**
 * 标记分片上传完毕，触发后台合并（时间轮调度 + 虚拟线程执行）。
 *
 * @param taskId 任务号
 * @return 任务快照
 */
export async function completeUploadTask(taskId: string): Promise<UploadTaskInfo> {
  try {
    return await uploadTaskHttp()
      .post(`${UPLOAD_TASK_BASE}/task/${taskId}/complete`)
      .then<UploadTaskInfo>((r) => unwrapTask<UploadTaskInfo>(r));
  } catch (e) {
    throw new Error(toErrorMessage(e, "完成任务上传"));
  }
}

/**
 * 上传任务列表（按创建时间倒序，供「上传任务」页面展示）。
 *
 * @return 任务快照列表
 */
export async function listUploadTasks(): Promise<UploadTaskInfo[]> {
  try {
    return await uploadTaskHttp()
      .get(`${UPLOAD_TASK_BASE}/tasks`)
      .then<UploadTaskInfo[]>((r) => unwrapTask<UploadTaskInfo[]>(r) ?? []);
  } catch (e) {
    throw new Error(toErrorMessage(e, "获取上传任务列表"));
  }
}

/**
 * 取消上传任务（停止调度并清理分片）。
 *
 * @param taskId 任务号
 * @return 被取消的任务快照
 */
export async function cancelUploadTask(taskId: string): Promise<UploadTaskInfo> {
  try {
    return await uploadTaskHttp()
      .delete(`${UPLOAD_TASK_BASE}/task/${taskId}`)
      .then<UploadTaskInfo>((r) => unwrapTask<UploadTaskInfo>(r));
  } catch (e) {
    throw new Error(toErrorMessage(e, "取消上传任务"));
  }
}

/**
 * 删除上传任务：移除任务记录并删除已写入存储的对象。
 *
 * @param taskId 任务号
 * @return true = 已删除；false = 任务不存在
 */
export async function deleteUploadTask(taskId: string): Promise<boolean> {
  try {
    return await uploadTaskHttp()
      .delete(`${UPLOAD_TASK_BASE}/task/${taskId}/delete`)
      .then<boolean>((r) => unwrapTask<boolean>(r) ?? true);
  } catch (e) {
    throw new Error(toErrorMessage(e, "删除上传任务"));
  }
}

/**
 * 任务化上传一个文件：创建任务 → 按分片切片上传（顺序，失败即抛）→ complete。
 *
 * <p>进度通过 {@link UploadProgressHandler} 汇报（0-100）。
 * 文件小于分片大小时退化为单分片。</p>
 *
 * @param file    文件
 * @param options provider / bucket / chunkSize（默认 5MB）
 * @return 合并完成后的任务快照（complete 后任务仍在后台合并，需轮询 listUploadTasks 看最终状态）
 */
export async function uploadFileAsTask(
  file: File,
  options: { provider?: string; bucket?: string; chunkSize?: number; onProgress?: UploadProgressHandler } = {},
): Promise<UploadTaskInfo> {
  const chunkSize = options.chunkSize && options.chunkSize > 0 ? options.chunkSize : 5 * 1024 * 1024;
  const task = await createUploadTask({
    fileName: file.name,
    totalSize: file.size,
    chunkSize,
    provider: options.provider,
    bucket: options.bucket,
  });
  const totalChunks = Math.max(task.totalChunks, 1);
  for (let index = 0; index < totalChunks; index++) {
    const start = index * chunkSize;
    const chunk = file.slice(start, Math.min(start + chunkSize, file.size));
    await uploadTaskChunk(task.taskId, index, await chunk.arrayBuffer());
    if (options.onProgress) {
      const loaded = Math.min(start + chunkSize, file.size);
      options.onProgress(Math.round((loaded / Math.max(file.size, 1)) * 100), loaded, file.size);
    }
  }
  return completeUploadTask(task.taskId);
}

/**
 * 小文件同步直传阈值（MB）：与后端 plugin.filesystem.task-sync-max-mb 默认值一致，
 * 不超过该大小的文件走 {@link uploadFileSimple}（同步，立即完成），超过才走任务链路。
 */
export const SIMPLE_SYNC_MAX_MB = 5;

/**
 * 小文件同步直传：multipart 一次传给 /simple，后端同步写入存储并直接返回 COMPLETED。
 *
 * <p>不建任务、不经时间轮；后端按 task-sync-max-mb 复核，超过阈值仍会转任务链路
 * （返回 UPLOADING），调用方据此无需自行判断。</p>
 *
 * @param file    文件
 * @param options provider / bucket
 * @return 任务快照（小文件为 COMPLETED 且带 objectKey）
 */
export async function uploadFileSimple(
  file: File,
  options: { provider?: string; bucket?: string } = {},
): Promise<UploadTaskInfo> {
  try {
    const form = new FormData();
    form.append("file", file);
    if (options.bucket) {
      form.append("fileBucket", options.bucket);
    }
    if (options.provider) {
      form.append("ossType", options.provider);
    }
    return await uploadTaskHttp()
      .post(`${UPLOAD_TASK_BASE}/simple`)
      .data(form)
      .timeout(UPLOAD_TIMEOUT_MS)
      .then<UploadTaskInfo>((r) => unwrapTask<UploadTaskInfo>(r));
  } catch (e) {
    throw new Error(toErrorMessage(e, "上传文件"));
  }
}

/**
 * 订阅上传任务实时推送（SSE，复用 vue 体系 @repo/core 的统一 socket 模块）。
 *
 * <p>对应后端 {@code GET /v2/file/upload-task/events}，事件约定：</p>
 * <ul>
 *   <li>{@code init} —— 连接建立后的全量任务列表（UploadTaskInfo[]）；</li>
 *   <li>{@code task} —— 单个任务变化（分片进度 / 状态流转即时下发）。</li>
 * </ul>
 *
 * <p>令牌经 setSocketTokenProvider 注入，SSE 以 {@code Authorization: Bearer}
 * 请求头携带（fetch-event-source 支持自定义头，无需把令牌放进 URL）。
 * 自动重连（默认最多 5 次，间隔 3 秒）。</p>
 *
 * @param onInit   全量快照回调
 * @param onTask   单任务变化回调
 * @return 取消订阅函数（组件卸载时调用，关闭连接）
 */
export function subscribeUploadTasks(
  onInit: (tasks: UploadTaskInfo[]) => void,
  onTask: (task: UploadTaskInfo) => void,
): () => void {
  // 动态引入 @repo/core 的 socket 模块：保持本 API 与 socket 基础设施松耦合
  let dispose: (() => void) | null = null;
  let cancelled = false;
  void Promise.all([import("@repo/core"), import("@repo/utils")]).then(([core, utils]) => {
    if (cancelled) {
      return;
    }
    // 令牌提供者：SSE 握手把 accessToken 放进 Authorization 头
    try {
      core.setSocketTokenProvider(() => utils.getAccessToken() ?? "");
    } catch {
      // 令牌提供者设置失败不影响连接（公共接口匿名可用）
    }
    const sse = core.createSseService({
      urls: [window.location.origin],
      path: `${UPLOAD_TASK_BASE}/events`,
      reconnection: true,
      reconnectionDelay: 3000,
    });
    sse.on("init", (data) => {
      if (Array.isArray(data)) {
        onInit(data as UploadTaskInfo[]);
      }
    });
    sse.on("task", (data) => {
      if (data && typeof data === "object" && "taskId" in (data as object)) {
        onTask(data as UploadTaskInfo);
      }
    });
    sse.connect();
    dispose = () => sse.close();
  });
  return () => {
    cancelled = true;
    dispose?.();
  };
}

/**
 * 协同文档变更事件
 *
 * <p>对应后端 {@code GET /v2/file/collab/{id}/events} 的 {@code changed} 事件。</p>
 */
export interface CollabChangeEvent {
  /** 协同文档号 */
  id: string;
  /** 变更后的版本号 */
  version: number;
  /** 变更时间戳 */
  updatedAt: number;
  /** 变更类型：snapshot / access / rename / create / delete */
  kind: string;
}

// ==================== 协同文档（在线表格协同） ====================

/** 协同文档接口前缀（Spring 侧，与上传任务同通道） */
const FILE_COLLAB_BASE = "/v2/file/collab";

/**
 * 订阅单个协同文档的变更推送（SSE）。
 *
 * <p>有了这条流，编辑器就不必靠 15s 轮询去发现「别人存过了」：别人一保存，
 * 这里立刻收到 {@code changed}，客户端再去拉最新快照重放。轮询保留作为兜底
 * （SSE 断连 / 被代理层掐断时）。</p>
 *
 * <p>复用 {@code @repo/core} 的 SSE 服务：令牌走 {@code Authorization} 头
 * （不落 URL），断线自动重连。</p>
 *
 * @param id      协同文档号
 * @param onChange 变更回调
 * @return 取消订阅函数（组件卸载时调用）
 */
export function subscribeFileCollab(
  id: string,
  onChange: (change: CollabChangeEvent) => void,
): () => void {
  let dispose: (() => void) | null = null;
  let cancelled = false;
  void Promise.all([import("@repo/core"), import("@repo/utils")]).then(([core, utils]) => {
    if (cancelled) {
      return;
    }
    try {
      core.setSocketTokenProvider(() => utils.getAccessToken() ?? "");
    } catch {
      // 令牌提供者设置失败不影响连接（公开文档匿名可看）
    }
    const sse = core.createSseService({
      urls: [window.location.origin],
      path: `${FILE_COLLAB_BASE}/${encodeURIComponent(id)}/events`,
      reconnection: true,
      reconnectionDelay: 3000,
    });
    sse.on("changed", (data) => {
      if (data && typeof data === "object" && "version" in (data as object)) {
        onChange(data as CollabChangeEvent);
      }
    });
    sse.connect();
    dispose = () => sse.close();
  });
  return () => {
    cancelled = true;
    dispose?.();
  };
}

/** 协同文档可见性 */
export type CollabVisibility = "PUBLIC" | "PRIVATE";

/** 协同文档类型 */
export type CollabDocType = "excel" | "word" | "text";

/** 协同文档（后端 FileCollabStore.FileCollab） */
export interface FileCollabInfo {
  /** 协同文档号 */
  id: string;
  /** 源文件所在桶 */
  bucket: string;
  /** 源文件对象键 */
  objectKey: string;
  /** 展示文件名（含扩展名） */
  fileName: string;
  /** 创建者用户标识 */
  owner: string;
  /** 可见性 */
  visibility: CollabVisibility;
  /** 私有时的授权用户集合 */
  allowedUserIds: string[];
  /** 创建时间戳 */
  createdAt: number;
  /** 最后更新时间戳 */
  updatedAt: number;
  /** 快照版本（乐观锁计数） */
  version: number;
  /**
   * 当前快照（Univer 工作簿 JSON / word 富文本 HTML / text 纯文本；空串 = 未保存）
   *
   * <p><b>列表与保存响应里没有这个字段。</b>它是「打开 / 预览 / 下载 / 历史」这些
   * 真需要内容的接口才下发的：列表带上内容会让打开协同管理页变成
   * 「把库里所有文档都下载一遍」，保存响应再回传一遍则等于保存流量翻倍。
   * 拿到摘要后要内容的场景，统一按 id 调 {@link getFileCollab} 取详情。</p>
   */
  snapshot?: string;
  /** 所在目录（空串 = 根目录；"x/y" = 层级目录） */
  path: string;
  /** 文档类型：excel / word / text */
  type: CollabDocType;
  /** 快照 UTF-8 字节数（文件大小展示） */
  size?: number;
  /**
   * 当前账号是否有写权限（可看即可编辑）
   *
   * <p>与终端共享同一字段口径：公开 = 全员可写，私有 = 仅创建者与被授权用户。
   * 后端按请求里的 {@code userId} 计算，前端据此决定编辑/重命名等入口。</p>
   */
  canWrite?: boolean;
  /** 当前账号是否是创建者（改权限 / 删除的归属判定） */
  isOwner?: boolean;
  /**
   * 归档时间戳（0 = 未归档）
   *
   * <p>常规列表里恒为 0；「归档」视图下非 0，用于显示「归档于 …」。</p>
   */
  archivedAt?: number;
  /**
   * 移入回收桶时间戳（0 = 不在回收桶）
   *
   * <p>常规列表与归档视图里恒为 0；「回收桶」视图下非 0。</p>
   */
  deletedAt?: number;
}

/** 协同历史版本条目 */
export interface CollabVersionEntry {
  /** 版本号 */
  version: number;
  /** 保存时间戳 */
  updatedAt: number;
  /** 快照内容（word/text 为内容，excel 为 Univer JSON） */
  snapshot?: string;
  /** 快照字节数 */
  size?: number;
}

/**
 * 创建协同文档（文件资产右键入口）。
 *
 * @param options 创建参数
 * @return 新创建的协同文档
 */
export async function createFileCollab(options: {
  userId?: string;
  bucket?: string;
  objectKey?: string;
  fileName: string;
  visibility?: CollabVisibility;
  userIds?: string[];
  path?: string;
  type?: CollabDocType;
}): Promise<FileCollabInfo> {
  try {
    const params = new URLSearchParams();
    params.set("userId", options.userId ?? collabCurrentUserId());
    if (options.bucket) params.set("bucket", options.bucket);
    if (options.objectKey) params.set("objectKey", options.objectKey);
    params.set("fileName", options.fileName);
    params.set("visibility", options.visibility ?? "PUBLIC");
    if (options.userIds?.length) params.set("userIds", options.userIds.join(","));
    if (options.path) params.set("path", options.path);
    if (options.type) params.set("type", options.type);
    const qs = params.toString();
    return await uploadTaskHttp()
      .post(`${FILE_COLLAB_BASE}/create${qs ? `?${qs}` : ""}`)
      .then<FileCollabInfo>((r) => unwrapTask<FileCollabInfo>(r));
  } catch (e) {
    throw new Error(toErrorMessage(e, "创建协同文档"));
  }
}

/**
 * 列出当前用户可见的协同文档（新→旧）。
 *
 * <p>支持目录过滤与关键字过滤：path 非空 = 只列该目录下（文件夹内部检索）；
 * path 为空 = 全部目录（外部 / 全局检索）。keyword 匹配文件名或目录路径。</p>
 *
 * @param userId   当前用户标识
 * @param path     目录过滤（null/空 = 全部目录）
 * @param keyword  关键字过滤（null/空 = 不过滤）
 * @return 协同文档列表
 */
export async function listFileCollabs(
  userId?: string,
  path?: string,
  keyword?: string,
): Promise<FileCollabInfo[]> {
  try {
    const params = new URLSearchParams();
    params.set("userId", userId ?? collabCurrentUserId());
    if (path) params.set("path", path);
    if (keyword) params.set("keyword", keyword);
    const qs = params.toString();
    return await uploadTaskHttp()
      .get(`${FILE_COLLAB_BASE}/list${qs ? `?${qs}` : ""}`)
      .then<FileCollabInfo[]>((r) => unwrapTask<FileCollabInfo[]>(r) ?? []);
  } catch (e) {
    throw new Error(toErrorMessage(e, "获取协同文档列表"));
  }
}

/**
 * 协同文档详情（含当前快照与版本）。
 *
 * @param id     协同文档号
 * @param userId 当前用户标识（后端据此回 canWrite / isOwner）
 * @return 协同文档
 */
export async function getFileCollab(id: string, userId?: string): Promise<FileCollabInfo> {
  try {
    const qs = `?userId=${encodeURIComponent(userId ?? collabCurrentUserId())}`;
    return await uploadTaskHttp()
      .get(`${FILE_COLLAB_BASE}/${id}${qs}`)
      .then<FileCollabInfo>((r) => unwrapTask<FileCollabInfo>(r));
  } catch (e) {
    throw new Error(toErrorMessage(e, "获取协同文档"));
  }
}

/** 协同文档版本探针结果 */
export interface FileCollabVersion {
  /** 协同文档号 */
  id: string;
  /** 当前版本号 */
  version: number;
  /** 最后更新时间戳 */
  updatedAt: number;
}

/**
 * 只取版本号（轮询专用）。
 *
 * <p>协同编辑器要判断「别人有没有存过」，此前只能调详情接口 —— 而详情每次都把
 * 整份快照传回来，编辑期间等于每 15s 白下载并解析一次全文，大文档上就是周期性卡顿。
 * 这个接口只回几十字节，版本真的变了再去取全文。</p>
 *
 * @param id 协同文档号
 * @return 版本与更新时间
 */
export async function getFileCollabVersion(id: string): Promise<FileCollabVersion> {
  try {
    return await uploadTaskHttp()
      .get(`${FILE_COLLAB_BASE}/${id}/version`)
      .then<FileCollabVersion>((r) => unwrapTask<FileCollabVersion>(r));
  } catch (e) {
    throw new Error(toErrorMessage(e, "获取协同文档版本"));
  }
}

/**
 * 实时协同房间状态。
 *
 * <p>新加入的客户端必须以 {@code snapshotSeq} 作为 {@code base}：它是「当前文档
 * 文件里已经包含到哪一批操作」。从 0 开始会重放整条历史，把已经写进文件的改动
 * 再应用一遍。</p>
 *
 * @param id 协同文档号
 * @return {@code {seq, snapshotSeq, start, logSize, peers, version}}
 */
export async function getFileCollabHubState(id: string): Promise<FileCollabHubState> {
  try {
    return await uploadTaskHttp()
      .get(`${FILE_COLLAB_BASE}/${id}/hub/state`)
      .then<FileCollabHubState>((r) => unwrapTask<FileCollabHubState>(r));
  } catch (e) {
    throw new Error(toErrorMessage(e, "获取协同房间状态"));
  }
}

/** 实时协同房间状态 */
export interface FileCollabHubState {
  /** 已定序到的最新 seq */
  seq: number;
  /** 文档内容对应的 seq（新客户端作为 base） */
  snapshotSeq: number;
  /** 日志起点：比它更早的 seq 已被裁掉 */
  start: number;
  /** 快照之后的日志条数 */
  logSize: number;
  /** 在线人数 */
  peers: number;
  /** 文件版本号 */
  version: number;
}

/**
 * 保存协同快照（版本乐观锁）。
 *
 * <p><b>必须显式声明 Content-Type 为 text/plain。</b>请求体是 Univer 工作簿快照的
 * JSON 字符串，但它是作为「原始字符串」发送的，HTTP 客户端对字符串 body 的缺省类型是
 * {@code application/x-www-form-urlencoded}。后端按 {@code request.getInputStream()}
 * 读原始字节，而 Servlet 容器在表单类型下会先把 body 当表单解析消费掉，导致读到的
 * 是空串——表现为「保存成功、版本 +1，但快照长度始终是 0」，刷新后内容全丢。
 * 实测同一份 541 字节快照：json/text/无类型均能存 541，form-urlencoded 存 0。</p>
 *
 * @param id              协同文档号
 * @param snapshot        Univer 工作簿快照 JSON
 * @param expectedVersion 期望的当前版本
 * @param userId          当前用户标识（后端据此校验写权限）
 * @param hubSeq          实时协同快照点（{@code session.rev}）；带上它，服务端才能把
 *                        「文档内容对应的 seq」与文件版本对齐，新加入者不会重放已经
 *                        写进文件的操作。上下文用 {@link registerFileCollabHubSnapshot}
 *                        单独提交——它是条目数组，塞进 URL 会撞网关的长度上限
 * @return 更新后的文档（含新版本）
 */
export async function saveFileCollabSnapshot(
  id: string,
  snapshot: string,
  expectedVersion: number,
  userId?: string,
  hubSeq?: number,
): Promise<FileCollabInfo> {
  try {
    const params = new URLSearchParams();
    params.set("expectedVersion", String(expectedVersion));
    params.set("userId", userId ?? collabCurrentUserId());
    if (hubSeq != null && hubSeq > 0) {
      params.set("hubSeq", String(hubSeq));
    }
    return await uploadTaskHttp()
      .put(`${FILE_COLLAB_BASE}/${id}/snapshot?${params.toString()}`)
      // 不能省：省掉就会是 application/x-www-form-urlencoded，后端读到空 body
      .headers({ "Content-Type": "text/plain;charset=UTF-8" })
      .data(snapshot)
      .then<FileCollabInfo>((r) => unwrapTask<FileCollabInfo>(r));
  } catch (e) {
    throw new Error(toErrorMessage(e, "保存协同快照"));
  }
}

/**
 * 登记实时协同快照上下文。
 *
 * <p>快照文件保存成功后调用：{@code seq} 必须与 {@link saveFileCollabSnapshot} 里
 * 的 {@code hubSeq} 一致。hub 用这条登记把「文件内容是到第几批操作为止」钉住，
 * 此后新加入的客户端从这个 seq 起 {@code base}，既不会漏也不会重放。</p>
 *
 * <p>上下文必须是 canonical ops 数组：客户端把它 {@code JSON.stringify} 后作为
 * 请求体，服务端原样存储，不做二次编码。</p>
 *
 * @param id  协同文档号
 * @param seq 快照对应的 seq
 * @param ctx 该 seq 之前的操作日志（{@code session.context()}）
 */
export async function registerFileCollabHubSnapshot(
  id: string,
  seq: number,
  ctx: unknown[],
): Promise<void> {
  try {
    await uploadTaskHttp()
      .post(`${FILE_COLLAB_BASE}/${id}/hub/snapshot`)
      .headers({ "Content-Type": "application/json;charset=UTF-8" })
      .data(JSON.stringify({ seq, ctx: ctx ?? [] }))
      .then((r) => unwrapTask<unknown>(r));
  } catch (e) {
    throw new Error(toErrorMessage(e, "登记协同快照上下文"));
  }
}

/**
 * 更新协同可见性与授权用户（仅创建者可调用）。
 *
 * @param id         协同文档号
 * @param visibility 可见性
 * @param userIds    私有时的授权用户
 * @param userId     操作者用户标识
 * @return 更新后的文档
 */
export async function updateFileCollabAccess(
  id: string,
  visibility: CollabVisibility,
  userIds?: string[],
  userId?: string,
): Promise<FileCollabInfo> {
  try {
    const params = new URLSearchParams();
    params.set("visibility", visibility);
    if (userIds?.length) params.set("userIds", userIds.join(","));
    params.set("userId", userId ?? collabCurrentUserId());
    return await uploadTaskHttp()
      .put(`${FILE_COLLAB_BASE}/${id}/access?${params.toString()}`)
      .then<FileCollabInfo>((r) => unwrapTask<FileCollabInfo>(r));
  } catch (e) {
    throw new Error(toErrorMessage(e, "更新协同权限"));
  }
}

/**
 * 删除协同文档（默认移入回收桶，可恢复）。
 *
 * <p>{@code permanent=true} 才是「彻底删除」：清掉内容与历史，不可恢复。
 * 默认走回收桶，是为了把误删从不可逆操作降级成可恢复操作。</p>
 *
 * @param id        协同文档号
 * @param userId    操作者用户标识
 * @param permanent 是否彻底删除（默认 false = 移入回收桶）
 * @return 是否生效
 */
export async function deleteFileCollab(
  id: string,
  userId?: string,
  permanent = false,
): Promise<boolean> {
  try {
    const params = new URLSearchParams();
    params.set("userId", userId ?? collabCurrentUserId());
    if (permanent) params.set("permanent", "true");
    return await uploadTaskHttp()
      .delete(`${FILE_COLLAB_BASE}/${id}?${params.toString()}`)
      .then<boolean>((r) => unwrapTask<boolean>(r) ?? false);
  } catch (e) {
    throw new Error(toErrorMessage(e, "删除协同文档"));
  }
}

/**
 * 列出显式创建的协同目录（空目录也返回）。
 *
 * <p>左侧目录树此前完全从文档 path 聚合：没有文档的目录根本不存在，
 * 于是「新建目录」后空目录立刻消失。这个接口把目录本身也作为一等数据取回来。</p>
 *
 * @return 目录路径列表（升序）
 */
export async function listFileCollabDirs(): Promise<string[]> {
  try {
    return await uploadTaskHttp()
      .get(`${FILE_COLLAB_BASE}/dirs`)
      .then<string[]>((r) => unwrapTask<string[]>(r) ?? []);
  } catch (e) {
    throw new Error(toErrorMessage(e, "获取协同目录"));
  }
}

/**
 * 新建协同目录（父级路径一并创建）。
 *
 * @param path 目录路径（如 {@code 项目A/台账}）
 * @return true = 新增成功；false = 目录已存在
 */
export async function createFileCollabDir(path: string): Promise<boolean> {
  try {
    const params = new URLSearchParams();
    params.set("path", path);
    return await uploadTaskHttp()
      .post(`${FILE_COLLAB_BASE}/dirs?${params.toString()}`)
      .then<boolean>((r) => unwrapTask<boolean>(r) ?? false);
  } catch (e) {
    throw new Error(toErrorMessage(e, "新建协同目录"));
  }
}

/**
 * 删除协同目录（仅空目录可删）。
 *
 * @param path 目录路径
 * @return true = 已删除
 */
export async function deleteFileCollabDir(path: string): Promise<boolean> {
  try {
    const params = new URLSearchParams();
    params.set("path", path);
    return await uploadTaskHttp()
      .delete(`${FILE_COLLAB_BASE}/dirs?${params.toString()}`)
      .then<boolean>((r) => unwrapTask<boolean>(r) ?? false);
  } catch (e) {
    throw new Error(toErrorMessage(e, "删除协同目录"));
  }
}

/**
 * 归档协同文档（从常规列表收起，内容与权限保留）。
 *
 * @param id     协同文档号
 * @param userId 操作者用户标识
 * @return true = 已归档
 */
export async function archiveFileCollab(id: string, userId?: string): Promise<boolean> {
  try {
    const qs = `?userId=${encodeURIComponent(userId ?? collabCurrentUserId())}`;
    return await uploadTaskHttp()
      .post(`${FILE_COLLAB_BASE}/${id}/archive${qs}`)
      .then<boolean>((r) => unwrapTask<boolean>(r) ?? false);
  } catch (e) {
    throw new Error(toErrorMessage(e, "归档协同文档"));
  }
}

/**
 * 取消归档（回到常规列表）。
 *
 * @param id     协同文档号
 * @param userId 操作者用户标识
 * @return true = 已取消归档
 */
export async function unarchiveFileCollab(id: string, userId?: string): Promise<boolean> {
  try {
    const qs = `?userId=${encodeURIComponent(userId ?? collabCurrentUserId())}`;
    return await uploadTaskHttp()
      .post(`${FILE_COLLAB_BASE}/${id}/unarchive${qs}`)
      .then<boolean>((r) => unwrapTask<boolean>(r) ?? false);
  } catch (e) {
    throw new Error(toErrorMessage(e, "取消归档"));
  }
}

/**
 * 从回收桶恢复。
 *
 * @param id     协同文档号
 * @param userId 操作者用户标识
 * @return true = 已恢复
 */
export async function restoreFileCollab(id: string, userId?: string): Promise<boolean> {
  try {
    const qs = `?userId=${encodeURIComponent(userId ?? collabCurrentUserId())}`;
    return await uploadTaskHttp()
      .post(`${FILE_COLLAB_BASE}/${id}/restore${qs}`)
      .then<boolean>((r) => unwrapTask<boolean>(r) ?? false);
  } catch (e) {
    throw new Error(toErrorMessage(e, "恢复协同文档"));
  }
}

/**
 * 归档视图列表。
 *
 * @param userId  当前用户标识
 * @param keyword 关键字过滤
 * @return 已归档文档
 */
export async function listArchivedFileCollabs(
  userId?: string,
  keyword?: string,
): Promise<FileCollabInfo[]> {
  try {
    const params = new URLSearchParams();
    params.set("userId", userId ?? collabCurrentUserId());
    if (keyword) params.set("keyword", keyword);
    return await uploadTaskHttp()
      .get(`${FILE_COLLAB_BASE}/archived?${params.toString()}`)
      .then<FileCollabInfo[]>((r) => unwrapTask<FileCollabInfo[]>(r) ?? []);
  } catch (e) {
    throw new Error(toErrorMessage(e, "获取归档列表"));
  }
}

/**
 * 回收桶视图列表。
 *
 * @param userId  当前用户标识
 * @param keyword 关键字过滤
 * @return 回收桶文档
 */
export async function listTrashedFileCollabs(
  userId?: string,
  keyword?: string,
): Promise<FileCollabInfo[]> {
  try {
    const params = new URLSearchParams();
    params.set("userId", userId ?? collabCurrentUserId());
    if (keyword) params.set("keyword", keyword);
    return await uploadTaskHttp()
      .get(`${FILE_COLLAB_BASE}/trash?${params.toString()}`)
      .then<FileCollabInfo[]>((r) => unwrapTask<FileCollabInfo[]>(r) ?? []);
  } catch (e) {
    throw new Error(toErrorMessage(e, "获取回收桶列表"));
  }
}

/**
 * 重命名协同文档。
 *
 * @param id        协同文档号
 * @param fileName  新展示文件名（含扩展名）
 * @param userId    当前用户标识（后端据此校验写权限）
 * @return 更新后的文档
 */
export async function renameFileCollab(id: string, fileName: string, userId?: string): Promise<FileCollabInfo> {
  try {
    const params = new URLSearchParams();
    params.set("fileName", fileName);
    params.set("userId", userId ?? collabCurrentUserId());
    return await uploadTaskHttp()
      .put(`${FILE_COLLAB_BASE}/${id}/rename?${params.toString()}`)
      .then<FileCollabInfo>((r) => unwrapTask<FileCollabInfo>(r));
  } catch (e) {
    throw new Error(toErrorMessage(e, "重命名协同文档"));
  }
}

/**
 * 复制协同文档（新文档，文件名追加「 副本」）。
 *
 * @param id     源协同文档号
 * @param userId 新文档创建者
 * @return 新文档
 */
export async function copyFileCollab(id: string, userId?: string): Promise<FileCollabInfo> {
  try {
    const params = new URLSearchParams();
    params.set("userId", userId ?? collabCurrentUserId());
    const qs = params.toString();
    return await uploadTaskHttp()
      .post(`${FILE_COLLAB_BASE}/${id}/copy${qs ? `?${qs}` : ""}`)
      .then<FileCollabInfo>((r) => unwrapTask<FileCollabInfo>(r));
  } catch (e) {
    throw new Error(toErrorMessage(e, "复制协同文档"));
  }
}

/**
 * 协同文档历史记录（版本快照列表，新→旧）。
 *
 * @param id 协同文档号
 * @return 历史条目列表
 */
export async function listCollabHistory(id: string): Promise<CollabVersionEntry[]> {
  try {
    return await uploadTaskHttp()
      .get(`${FILE_COLLAB_BASE}/${id}/history`)
      .then<CollabVersionEntry[]>((r) => unwrapTask<CollabVersionEntry[]>(r) ?? []);
  } catch (e) {
    throw new Error(toErrorMessage(e, "获取协同历史记录"));
  }
}

/**
 * 取指定版本的历史快照（管理员「回退」= 复制该版本出来成为一个新文件）。
 *
 * @param id      协同文档号
 * @param version 版本号
 * @return 该版本快照内容
 */
export async function getCollabHistoryVersion(id: string, version: number): Promise<CollabVersionEntry> {
  try {
    return await uploadTaskHttp()
      .get(`${FILE_COLLAB_BASE}/${id}/history/${version}`)
      .then<CollabVersionEntry>((r) => unwrapTask<CollabVersionEntry>(r));
  } catch (e) {
    throw new Error(toErrorMessage(e, "获取历史版本"));
  }
}


