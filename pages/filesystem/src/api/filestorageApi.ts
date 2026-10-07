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
import { AxiosError, createHttp, getAccessToken } from "@repo/utils";
import type { Http } from "@repo/utils";
import { getConfig } from "@repo/config";
import { createObjectTicketResolver } from "./objectTicket";
import type { ResolveOptions } from "./objectTicket";

/** localStorage 中服务器地址的键名 */
const SERVER_KEY = "filestorage.server";

/** localStorage 中默认存储桶的键名 */
const BUCKET_KEY = "filestorage.bucket";

/** localStorage 中存储配额（GB）的键名 */
const QUOTA_KEY = "filestorage.quotaGb";

/** 默认服务器地址（app.yaml otherConfig.filestorage.server 未配置时兜底） */
export const DEFAULT_SERVER = "http://127.0.0.1:18080";

/** 默认存储桶名称（app.yaml otherConfig.filestorage.bucket 未配置时兜底） */
export const DEFAULT_BUCKET = "local";

/** 默认存储配额 GB（app.yaml otherConfig.filestorage.quotaGb 未配置时兜底） */
export const DEFAULT_QUOTA_GB = 5;

/** app.yaml 中文件服务器配置节（otherConfig.filestorage） */
interface FileStorageAppConfig {
  /** 文件服务器地址 */
  server?: string;
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
  /** 图片滤镜（NONE/GRAYSCALE/SEPIA/INVERT/BLUR/SATURATE） */
  imageFilter: string;
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
  items?: StorageObject[];
}

/**
 * 读取文件服务器地址
 *
 * <p>优先级：localStorage（页面级覆盖）＞ getConfig（app.yaml / `/v2/setting/default` 下发的
 * {@code other.filestorage.server}）＞ 当前地址（window.location.origin）。</p>
 *
 * @return 文件服务器地址（已去除尾部斜杠）
 */
export function getServerBase(): string {
  const stored = localStorage.getItem(SERVER_KEY);
  if (stored) {
    return stored.replace(/\/+$/, "");
  }
  const configured = appFileStorageConfig().server;
  if (configured) {
    return configured.replace(/\/+$/, "");
  }
  return typeof window !== "undefined" ? window.location.origin : DEFAULT_SERVER;
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
  return localStorage.getItem(BUCKET_KEY) || appFileStorageConfig().bucket || DEFAULT_BUCKET;
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
    throw new Error(toErrorMessage(e, "列表查询"));
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
    throw new Error(toErrorMessage(e, "配置获取"));
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
}

/**
 * SPI 能力分组（某一 SPI 接口的能力列表）
 */
export interface SpiCapabilityGroup {
  /** SPI 实现名 */
  spi: string;
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
  /** 图片滤镜实现列表（ImageFilter SPI，含 name + label） */
  imageFilters: SpiCapability[];
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
    throw new Error(toErrorMessage(e, "CAD 图纸查询"));
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


