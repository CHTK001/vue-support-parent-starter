/**
 * 统一配置加载器 —— 按优先级合并多来源配置
 *
 * 优先级（后加载覆盖先加载）：
 *   ① 默认值 defaultAppConfig
 *   ② app.example.yaml（全局默认模板，项目根目录）
 *   ③ app.yaml（本地，apps/{appName}/app.yaml）
 *   ④ app.{env}.yaml（环境级，apps/{appName}/app.{env}.yaml，如 app.dev.yaml；
 *      仅当应用提供了该文件才请求，名单由 createVite 注入 VITE_APP_ENV_CONFIGS）
 *   ⑤ 远程配置（url.setting 拼接 http.baseUrl，远程为主，失败忽略）
 *   ⑥ 环境变量（import.meta.env 中的 VITE_* 映射，本地运行最高优先级）
 *
 * 环境名取 import.meta.env.MODE（development→dev / production→prod，
 * 其余原样使用，如 test），可通过 VITE_APP_ENV 显式覆盖。
 *
 * 任何来源加载失败都回退到已有配置，保证应用始终可启动。
 */
import { load as parseYaml } from "js-yaml";
import {
  defaultAppConfig,
  getConfig,
  normalizeTopKey,
  parseAppYaml,
  resetConfigSilent,
  applyConfig,
  type AppConfig,
  type DeepPartial,
} from "./config";
import { deepMerge } from "./shared";
import {
  REMOTE_INJECTABLE_PATH_PREFIXES,
  REMOTE_INJECTABLE_TOP_KEYS,
  safeAssignTopLevel,
  safeSetDotted,
} from "./safe-path";

/**
 * 远程配置被拒时的告警。
 *
 * <p>刻意用 console 而非 @repo/utils 的 log：本包不得静态依赖 @repo/utils
 * （config.ts 顶部有明确说明，避免模块加载期循环依赖 / TDZ 崩溃）。
 * 与 config.ts 里的 subscriber 错误处理保持同一风格。</p>
 *
 * @param path   被拒的配置路径
 * @param reason 原因
 */
function warnRejectedRemoteKey(path: string, reason: string): void {
  console.warn(`[config] 已拒绝远程配置项 "${path}"：${reason}`);
}

/** 环境变量（默认取 import.meta.env，便于测试注入） */
export type EnvLike = Record<string, string | undefined>;

/**
 * loadConfig 幂等去重：同一配置源（appName + configUrl）并发调用只执行一次，
 * 其余调用共享同一 in-flight promise，避免 App.tsx 与 Vue 登录 bootstrap 并发
 * 加载导致 applyConfig 多次触发订阅者（document.title 等 UI 二次跳动）。
 */
let inFlightConfig: Promise<AppConfig> | null = null;

/** 远程设置列表缓存（供 loadDefaultSetting 复用，避免重复请求） */
let remoteSettingList: Array<Record<string, unknown>> | null = null;

/** 远程设置是否已成功取回（200 且解析完成）；失败时保持 false，让 bootstrap 重试 */
let remoteSettingFetched = false;

/** 获取远程设置列表缓存（null = 未加载或不是 JSON 数组格式） */
export function getRemoteSettingList(): Array<Record<string, unknown>> | null {
  return remoteSettingList;
}

/**
 * 远程设置是否已成功取回。
 * 空列表也算成功：平台没有任何默认设置时，loader 与 loadDefaultSetting 各发一次
 * 同一请求纯属浪费；未登录 403 时该标记为 false，bootstrap 仍需重试。
 */
export function hasRemoteSettingFetched(): boolean {
  return remoteSettingFetched;
}

/** 加载配置的输入 */
export interface LoadConfigOptions {
  /** 应用名，对应 apps/{appName}/app.yaml；缺省 "default" */
  appName?: string;
  /** 资源基础路径（部署到子路径时用），缺省 "" */
  baseUrl?: string;
  /** app.yaml 完整 URL（缺省自动拼接 apps/{appName}/app.yaml） */
  configUrl?: string;
  /** 环境变量（缺省 import.meta.env） */
  env?: EnvLike;
  /** 是否禁用远程配置拉取（测试用，默认 false） */
  disableRemote?: boolean;
  /** HTTP 请求超时（毫秒），缺省 5000（loader 阶段要快） */
  timeout?: number;
  /**
   * 代码级默认值（优先级最低的一层）。
   *
   * <p>用于在 {@code main.ts} 里声明本应用的默认配置，例如分组导航：</p>
   *
   * <pre>{@code
   * await createContextApp({
   *   appName: "xxx",
   *   defaults: { menu: { collapseSingleChild: true } },
   * })
   * }</pre>
   *
   * <p>合并顺序上排在 app.example.yaml / app.yaml / app.{env}.yaml / 远程配置 /
   * 环境变量之前，即「代码给默认、配置文件与远程仍可覆盖」——避免把可运营的配置
   * 写死在代码里。</p>
   */
  defaults?: DeepPartial<AppConfig>;
}

/**
 * 拉取并解析一个 yaml 文件的文本内容。
 *
 * 设计要点：
 *   - 不走 @repo/utils/http()（会反向依赖 @repo/config，造成循环）
 *   - 用原生 fetch 统一处理：超时、404/非 yaml 响应（防 SPA fallback 把 HTML 当 yaml）、
 *     解析失败 → 全部静默返回 undefined，让上层沿用已有配置
 *   - Content-Type 只用于**拦 HTML**（SPA fallback 返回 text/html 时识别出来，
 *     避免污染解析结果）；**不要求「含 yaml」**，因为静态服务器常把 .yaml 发成
 *     application/octet-stream（nginx mime.types 无 yaml 条目时落到 default_type），
 *     那样会把整份 app.yaml 静默丢弃、让登录页回落 shared.ts 的代码默认值
 *
 * @returns 解析后的 partial 配置；任意环节失败均返回 undefined
 */
async function safeFetchYaml(
  url: string,
  timeout: number,
): Promise<Partial<AppConfig> | undefined> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return undefined;
    // 这里的 Content-Type 判定**只为拦 SPA fallback**：不存在的路径被回退成
    // index.html（text/html）后，会把 HTML 当 yaml 解析，污染出垃圾配置。
    //
    // 刻意**不再**要求「必须含 yaml」：静态服务器对 .yaml 常返回
    // application/octet-stream（nginx 的 mime.types 无 yaml 条目时落到
    // default_type），按「含 yaml」判定会让整份 app.yaml 被静默丢弃，
    // 登录页只能回落 shared.ts 的代码默认值（login.captcha: true），
    // 与 app.yaml 里显式声明的 login.captcha: false 直接冲突。
    // 因此改为只黑名单 HTML/XHTML，其余类型一律放行，交给下面的内容检查兜底。
    const ct = String(res.headers.get("content-type") ?? "").toLowerCase();
    const isHtml = ct.includes("text/html") || ct.includes("application/xhtml");
    if (isHtml) return undefined;
    const text = await res.text();
    // 内容兜底：以 '<' 开头的是 HTML/XML 文档，绝不能当 yaml 解析
    // （覆盖「服务器用 octet-stream 投递 SPA fallback 页面」的情况）。
    if (/^\s*</.test(text)) return undefined;
    const partial = parseAppYaml(text);
    // parseAppYaml 在解析失败时返回 {}，无法与"文件不存在"区分。
    // 通过检查 text 是否真的含 yaml 标记简单兜底：含 "key:" 或 "---" 才视为有效。
    if (!text || (!text.includes(":") && !text.includes("---"))) return undefined;
    return partial;
  } catch {
    return undefined;
  }
}

/**
 * 加载并合并统一配置（内部会重置并写入 getConfig 缓存）
 * @returns 合并后的最终配置（reactive 单例，调用方后续修改可直接走 applyConfig）
 *
 * 所有来源（example / app / env / remote / envvars）先收集为 partial，
 * 链式合并成一个后只调用一次 applyConfig，避免加载中间态（reset/example
 * 阶段的默认 title）触发订阅者反复更新 document.title 等 UI。
 */
export async function loadConfig(
  options: LoadConfigOptions = {},
): Promise<AppConfig> {
  const baseUrl = options.baseUrl ?? "";
  const appName = options.appName ?? "default";
  const env = options.env ?? getImportMetaEnv();
  const timeout = options.timeout ?? 5000;

  // 幂等去重：相同配置源（appName + configUrl + baseUrl）并发调用共享同一结果
  const dedupeKey = `${baseUrl}|${appName}|${options.configUrl ?? ""}`;
  if (inFlightConfig) {
    return inFlightConfig;
  }
  const run = (async () => {
    // ① 加载 app.example.yaml（全局默认模板）
    const examplePartial = await loadExampleYamlPartial({ baseUrl, timeout });

    // ② 加载本地 app.yaml（应用级覆盖）
    const appPartial = await loadAppYamlPartial({ appName, baseUrl, configUrl: options.configUrl, timeout });

    // ③ 加载环境级 app.{env}.yaml（如 app.dev.yaml，覆盖 app.yaml）
    //    只有应用确实提供了该文件才请求：可选文件靠 404 探测回退，会让每一页启动时
    //    都在浏览器控制台留下一条网络错误（fetch 捕获不掉）
    let envPartial: Partial<AppConfig> | undefined;
    const envName = getEnvName(env);
    if (envName && hasEnvYaml(env, envName)) {
      envPartial = await loadEnvYamlPartial({ appName, baseUrl, envName, timeout });
    }

    // 一次性提交：先重置为默认值（不通知），再把本地来源（example/app/env）链式合并成
    // 一个纯对象，用于计算远程配置地址（依赖合并后的 http.baseUrl / url.setting），
    // 最后连同远程 + 环境变量一起只 applyConfig 一次，避免中间态 title 闪烁
    resetConfigSilent();
    const sourceList: Partial<AppConfig>[] = [
      examplePartial,
      appPartial,
      envPartial,
    ].filter(Boolean) as Partial<AppConfig>[];
    const localMerged = sourceList.reduce<Record<string, unknown>>(
      (acc, partial) => deepMerge(acc, partial as unknown as Record<string, unknown>),
      defaultAppConfig as unknown as Record<string, unknown>,
    );

    // ④ 远程配置（远程为主，失败忽略；地址基于合并后的本地配置）
    const remotePartial = await loadRemoteConfigPartial(localMerged as unknown as AppConfig, timeout, options.disableRemote);

    // ⑤ 环境变量覆盖（VITE_* → AppConfig 字段映射）
    const envConfig = envToConfig(env);

    const allSources: Partial<AppConfig>[] = [
      // 代码级默认值排在最前：优先级最低，后面的 app.example/app/env/remote/环境变量
      // 都能覆盖它，保证「main.ts 给默认、配置文件可覆盖」
      options.defaults,
      examplePartial,
      appPartial,
      envPartial,
      remotePartial,
      envConfig,
    ].filter(Boolean) as Partial<AppConfig>[];
    const merged = allSources.reduce<Record<string, unknown>>(
      (acc, partial) => deepMerge(acc, partial as unknown as Record<string, unknown>),
      defaultAppConfig as unknown as Record<string, unknown>,
    );
    applyConfig(merged as unknown as Partial<AppConfig>);

    return getConfig();
  })().finally(() => {
    // 仅清理本次 in-flight；若期间有新的相同 key 调用入队，允许其重新执行
    if (inFlightConfig === run) inFlightConfig = null;
  });
  inFlightConfig = run;
  return run;
}

/**
 * 加载 app.example.yaml 作为全局默认配置。
 * 加载失败（含非 yaml 响应，如 SPA fallback 返回 HTML）时返回 undefined。
 */
async function loadExampleYamlPartial(options: { baseUrl: string; timeout: number }): Promise<Partial<AppConfig> | undefined> {
  return safeFetchYaml(
    `${options.baseUrl}/app.example.yaml`,
    options.timeout,
  );
}

/**
 * 加载本地 app.yaml；失败回退 apps/default/app.yaml。
 * 返回 partial，由 loadConfig 统一合并提交。
 */
async function loadAppYamlPartial(options: {
  appName: string;
  baseUrl: string;
  configUrl?: string;
  timeout: number;
}): Promise<Partial<AppConfig> | undefined> {
  const url =
    options.configUrl ?? `${options.baseUrl}/apps/${options.appName}/app.yaml`;
  const partial = await safeFetchYaml(url, options.timeout);
  if (partial) return partial;
  // 目标不存在时尝试 apps/default/app.yaml 兜底
  return safeFetchYaml(
    `${options.baseUrl}/apps/default/app.yaml`,
    options.timeout,
  );
}

/**
 * 加载环境级 app.{env}.yaml（如 app.dev.yaml）。
 * 存在则返回 partial；不存在或失败时返回 undefined。
 */
async function loadEnvYamlPartial(options: {
  appName: string;
  baseUrl: string;
  envName: string;
  timeout: number;
}): Promise<Partial<AppConfig> | undefined> {
  return safeFetchYaml(
    `${options.baseUrl}/apps/${options.appName}/app.${options.envName}.yaml`,
    options.timeout,
  );
}

/**
 * 拉取远程配置（JSON/YAML 均可），失败或非 yaml/JSON 时返回 undefined。
 */
async function loadRemoteConfigPartial(
  localMerged: AppConfig,
  timeout: number,
  disableRemote: boolean | undefined,
): Promise<Partial<AppConfig> | undefined> {
  // 由 config.enable 开关控制，默认开启；禁用时跳过
  if (disableRemote) return undefined;
  if (localMerged.config?.enable === false) return undefined;
  const remoteUrl = buildRemoteConfigUrl(localMerged);
  if (!remoteUrl) return undefined;
  return loadRemoteConfig(remoteUrl, timeout);
}

/**
 * 解析环境名：
 * ① VITE_APP_ENV 显式覆盖（如 test / prod）
 * ② import.meta.env.MODE 映射（development→dev / production→prod，其余原样）
 * ③ 两者均无时返回 ""（不加载环境级 yaml）
 */
function getEnvName(env: EnvLike): string {
  const explicit = env.VITE_APP_ENV;
  if (explicit) return explicit;
  const mode = env.MODE;
  if (!mode) return "";
  if (mode === "development") return "dev";
  if (mode === "production") return "prod";
  return mode;
}

/**
 * 应用是否提供了 `app.{envName}.yaml`。
 *
 * 名单由 createVite 按 app 根目录的真实文件注入（逗号分隔的环境名，如 `"dev"`）；
 * 未注入时（非 vite 环境、外部托管的构建）无从判断，按"存在"处理，保持原有探测行为。
 */
function hasEnvYaml(env: EnvLike, envName: string): boolean {
  const manifest = env.VITE_APP_ENV_CONFIGS;
  if (manifest === undefined) return true;
  return manifest
    .split(",")
    .map((s) => s.trim())
    .includes(envName);
}

/**
 * 拼接远程配置地址：http.baseUrl + url.setting。
 * 两者均为空时返回 ""（此时不拉取远程配置）。
 */
function buildRemoteConfigUrl(cfg: AppConfig): string {
  const setting = cfg?.url?.setting;
  const base = cfg?.http?.baseUrl;
  if (!setting) return "";
  if (!base) return setting;
  return `${base.replace(/\/+$/, "")}/${setting.replace(/^\/+/, "")}`;
}

/**
 * 判断响应体是否为后端统一「错误信封」而非配置内容。
 *
 * <p>{@code /v2/setting/default} 受鉴权保护，但后端对未登录请求仍返回
 * **HTTP 200** + 错误信封：
 * {@code {"code":"A0403S0000","data":null,"msg":"用户信息不存在/请重新登录!","success":false,"ok":false}}。
 * 它不是列表（{@code data} 为 null），若继续走「裸对象即配置」分支，
 * {@code normalizeTopLevelKeys} 会把 code/data/msg/success/ok/temp 这些
 * **信封字段深合并进 AppConfig 根节点**，同时把 {@code remoteSettingFetched}
 * 误置为 true —— bootstrap 随即误判「远程配置已取回」而不再重试，
 * 登录页最终落回代码内置默认值（{@code login.captcha: true}），
 * 与 app.yaml 里显式写的 {@code captcha: false} 冲突。</p>
 *
 * <p>成功码集合与 {@code packages/core/src/httpCrypto.ts} 的 {@code isApiError} 保持一致。</p>
 *
 * @param body 已解析的 JSON 响应体
 * @returns true 表示这是错误信封，绝不能当配置深合并
 */
function isApiErrorEnvelope(body: unknown): boolean {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return false;
  }
  const d = body as Record<string, unknown>;
  if (d.success === false || d.ok === false) {
    return true;
  }
  const SUCCESS_CODES = new Set(["00000", "200", "0", "success", "ok", "true", "1"]);
  const code = d.code;
  return code != null && !SUCCESS_CODES.has(String(code).toLowerCase());
}

/**
 * 拉取远程配置（JSON/YAML 均可），失败或非 yaml/JSON 时返回 undefined。
 */
async function loadRemoteConfig(
  url: string,
  timeout: number,
): Promise<Partial<AppConfig> | undefined> {
  // 预置空数组标记"已尝试加载远程配置"，避免 loadDefaultSetting 重复请求
  remoteSettingList = [];
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return undefined;
    const ct = String(res.headers.get("content-type") ?? "").toLowerCase();
    // 远程配置允许 JSON 或 yaml 两种格式
    const looksLikeConfig =
      ct.includes("json") || ct.includes("yaml") || ct.includes("yml") || ct === "";
    if (!looksLikeConfig) return undefined;
    const text = await res.text();
    const trimmed = text.trim();
    // 尝试 JSON
    try {
      const parsed = JSON.parse(trimmed);
      // 后端统一响应信封 {code,msg,data}：设置列表在 data 里，裸数组是旧格式
      const settingList = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed?.data)
          ? parsed.data
          : null;
      if (settingList) {
        // 缓存原始设置列表，供 loadDefaultSetting 复用（避免二次请求同一接口）
        remoteSettingList = settingList;
        // 拿到可用响应体即视为已取回（哪怕列表为空）：避免 loadDefaultSetting 重复请求同一接口
        remoteSettingFetched = true;
        return flattenSettingToConfig(settingList);
      }
      remoteSettingList = null;
      // 未登录时该接口以 HTTP 200 返回错误信封：既不能当配置深合并，
      // 也不能置 remoteSettingFetched（否则 bootstrap 误判已取回而不再重试）
      if (isApiErrorEnvelope(parsed)) {
        remoteSettingFetched = false;
        return undefined;
      }
      remoteSettingFetched = true;
      return normalizeTopLevelKeys(parsed) as Partial<AppConfig>;
    } catch {
      remoteSettingList = null;
      remoteSettingFetched = true;
      return parseAppYaml(text);
    }
  } catch {
    return undefined;
  }
}

/**
 * 旧式设置名 → AppConfig 点号路径（与 core/setting.ts 的 SETTING_TO_LOGIN_MAP 对齐，
 * 但补上不在 login 子树上的旧名：水印）。
 *
 * <p>后端设置表里的老数据只有 {@code sysSettingName}（如 {@code SystemName}、
 * {@code WatermarkColor}），没有点号的 {@code sysSettingCode}。core 把旧名映射到
 * {@code login.*}，但水印旧名 {@code WatermarkOpen/Color/Alpha/Rotate} 对应的是
 * {@code getConfig().security.watermark}（见 {@code packages/core/src/directives/waterMarker.ts}
 * 的读数路径），不能写进 {@code login} 子树。</p>
 *
 * <p>loader 与 core 按同一张表落盘，保证同一份
 * {@code /v2/setting/default} 里的旧名数据在两份代码里落到相同的 AppConfig 路径
 * （{@code login.title} {@code /slider} {@code /smsLogin}、
 * {@code security.watermark} {@code /enable} {@code /color} {@code /alpha} {@code /rotate}）；
 * 有映射就走映射路径，没有映射的旧名则保留原名，让白名单继续拦（
 * 如 {@code CodecRequestKey} 这类后端配置名与 {@code http.baseUrl}，不该让的不要让）。</p>
 */
const LEGACY_NAME_TO_PATH: Record<string, string> = {
  // 登录页旧名（与 core SETTING_TO_LOGIN_MAP 对齐）
  SystemName: "login.title",
  SlidingBlockOpen: "login.slider",
  OpenSmsLogin: "login.smsLogin",
  // 水印旧名（不落在 login 子树，落在 security.watermark）
  WatermarkOpen: "security.watermark.enable",
  WatermarkColor: "security.watermark.color",
  WatermarkAlpha: "security.watermark.alpha",
  WatermarkRotate: "security.watermark.rotate",
};

/**
 * 将后端设置列表转换为嵌套配置对象。
 * 支持点号层级 key（如 login.slider）与布尔/数字值转换。
 */
function flattenSettingToConfig(list: Array<Record<string, unknown>>): Partial<AppConfig> {
  const partial: Record<string, unknown> = {};
  for (const item of list) {
    const code = String(item.sysSettingCode ?? item.code ?? "");
    const name = String(item.sysSettingName ?? item.name ?? "");
    const rawValue = item.sysSettingValue ?? item.value;
    // 与 core/setting.ts 对齐：优先按「编码」点号路径（如 login.brandName）；
    // 编码为空的旧数据才回退按名称
    let pathKey = code.includes(".") ? code : name || code;
    if (!pathKey) continue;
    // 旧式名字补全到 AppConfig 路径：有映射的旧名走白名单内的路径，
    // 避免 `SystemName`/`WatermarkOpen` 这类被误当成顶级键（= reject）而留噪音
    const legacyPath = LEGACY_NAME_TO_PATH[pathKey];
    if (legacyPath) pathKey = legacyPath;
    let value: unknown = rawValue;
    const lower = String(rawValue).toLowerCase();
    if (lower === "true") value = true;
    else if (lower === "false") value = false;
    else if (!Number.isNaN(Number(rawValue)) && String(rawValue).trim() !== "") value = Number(rawValue);
    // <b>修复原型链污染</b>：原实现按点号逐层下钻，下钻读的是继承链属性，
    // 于是 sysSettingCode="__proto__.xxx" 会把 cur 指向 Object.prototype，
    // 最后一行直接写到全局原型上（详见 safe-path.ts 顶部注释）。
    // 同时用顶层白名单挡住 http.baseURL / token.*Key / crypto.* 这类
    // 「改了就不只是改观感」的键 —— 远程设置接口只该管品牌与展示。
    // 带 legacy map 的旧名已落到白名单内路径（login.* / security.watermark.*）；
    // 没有 legacy map 的旧名（CodecRequestKey / Version / 16 个 SSO 开关名）
    // 仍由白名单拦截并告警（后台有表项但前端不消费，告知比遗漏好）。
    safeSetDotted(partial, pathKey, value, {
      topKeyAllowlist: REMOTE_INJECTABLE_TOP_KEYS,
      pathPrefixAllowlist: REMOTE_INJECTABLE_PATH_PREFIXES,
      normalizeTopKey: normalizeTopKey,
      onReject: warnRejectedRemoteKey,
    });
  }
  return partial as Partial<AppConfig>;
}

/** 对 JSON 对象/数组返回的顶层键做归一化（appConfig → app） */
function normalizeTopLevelKeys(data: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  // <b>修复</b>：原实现 result[key] = data[key]，key 为 __proto__ 时会改写
  // result 自身的原型（配置对象被塞成一个诡异实例）。改走安全写入 + 顶层白名单。
  safeAssignTopLevel(result, data, {
    topKeyAllowlist: REMOTE_INJECTABLE_TOP_KEYS,
    pathPrefixAllowlist: REMOTE_INJECTABLE_PATH_PREFIXES,
    normalizeTopKey: normalizeTopKey,
    onReject: warnRejectedRemoteKey,
  });
  return result;
}

/** ⑤ VITE_* 环境变量 → AppConfig 部分字段映射 */
function envToConfig(env: EnvLike): Partial<AppConfig> {
  const partial: Partial<AppConfig> = {};

  const title = env.VITE_WEB_TITLE ?? env.VITE_APP_TITLE;
  if (title) {
    partial.app = { ...(partial.app || {}), title } as AppConfig["app"];
  }

  const baseUrl = env.VITE_WEB_BASE_API ?? env.VITE_BASE_API;
  if (baseUrl) {
    partial.http = { ...(partial.http || {}), baseUrl } as AppConfig["http"];
  }

  const themeId = env.VITE_THEME_ID;
  if (themeId) {
    partial.other = { ...(partial.other || {}), themeId } as AppConfig["other"];
  }

  const apiVersion = env.VITE_API_VERSION;
  if (apiVersion) {
    partial.http = { ...(partial.http || {}), apiVersion } as AppConfig["http"];
  }

  return partial;
}

/** 安全读取 import.meta.env（SSR/Node 下为空对象） */
function getImportMetaEnv(): EnvLike {
  const meta = (import.meta as unknown as { env?: EnvLike }).env;
  return meta ?? {};
}

export { parseYaml };
