/**
 * 登录页默认配置加载（core）
 *
 * 登录页挂载时调用一次，从后端拉取 /v2/setting/default 并合并进 getConfig 的 login 子配置。
 * 后端 /v2/setting/default 只返回 default/sso/default-1 分组，全部是登录页相关字段：
 *   - CheckCodeOpen    图形验证码开关
 *   - SlidingBlockOpen 滑块验证开关
 *   - CheckTotpOpen    OTP 动态口令开关
 *   - OpenSmsLogin     短信登录开关（前端未实现，透传）
 *   - SystemName / BrandName / Welcome / Description / LogoUrl / ImageUrl / AvatarUrl / BeiAnHao / FeatureTags
 *
 * 热重载：bindConfigHotReload() 监听 CONFIG_VERSION_CHANGE_EVENT（由
 * http 响应头 x-response-version 触发），版本变化后重新拉取设置，
 * 并执行已注册的 onConfigHotReload 回调。
 */
import { getConfig, applyConfig, CONFIG_VERSION_CHANGE_EVENT, getRemoteSettingList, hasRemoteSettingFetched, normalizeTopKey, REMOTE_INJECTABLE_TOP_KEYS, REMOTE_INJECTABLE_PATH_PREFIXES, safeSetDotted } from "@repo/config";
import { getApiHttp, getDefaultSetting, type SettingItem } from "./api";
import { applyHttpCodecSettings } from "./httpCodecRuntime";
import { log, getAccessToken } from "@repo/utils";

function shouldFetchRemoteSetting(): boolean {
  return getConfig()?.config?.enable !== false && !!getConfig()?.url?.setting;
}

/**
 * 登录页是否允许发起远程配置请求。
 *
 * <p>{@code /v2/setting/default} 受鉴权保护，**未登录时必然失败**：后端以
 * HTTP 200 返回错误信封 {@code {"code":"A0403S0000","success":false,
 * "msg":"用户信息不存在/请重新登录!"}}。此时拉取既拿不到任何配置，又只能靠
 * 回落代码内置默认值（{@code shared.ts} 的 {@code login.captcha: true}），
 * 覆盖掉 app.yaml 里显式声明的 {@code login.captcha: false}，
 * 还会让登录页凭空多出一个必填的验证码字段、把用户挡在门外。</p>
 *
 * <p>因此未登录直接不发这个请求，沿用本地 app.yaml；登录成功后由
 * {@link refreshDefaultSetting} 再拉一次并广播热重载。</p>
 */
function isLoggedIn(): boolean {
  return !!getAccessToken();
}

const SETTING_TO_LOGIN_MAP: Record<string, string> = {
  CheckCodeOpen: "captcha",
  CheckTotpOpen: "otp",
  SlidingBlockOpen: "slider",
  OpenSmsLogin: "smsLogin",
  SystemName: "title",
  BrandName: "brandName",
  Welcome: "welcome",
  Description: "description",
  LogoUrl: "logoUrl",
  ImageUrl: "imageUrl",
  AvatarUrl: "avatarUrl",
  BeiAnHao: "beiAnHao",
  FeatureTags: "featureTags",
};

/**
 * 不在 {@code login} 子树上的旧式设置名到 AppConfig 点号路径的映射。
 *
 * <p>水印的旧名是 {@code Watermark*}（WatermarkOpen/WatermarkColor/WatermarkAlpha/
 * WatermarkRotate），前端读的是 {@code getConfig().security.watermark}（见
 * {@code directives/waterMarker.ts} 的读数路径），它不在 {@code login} 子树上，
 * 只能落到 {@code security.watermark} 里。而 {@code SETTING_TO_LOGIN_MAP} 只负责
 * {@code login.*}。</p>
 *
 * <p>它只在白名单允许时才能落盘（{@code security_watermark} 加入
 * {@code @repo/config} 的 {@code REMOTE_INJECTABLE_PATH_PREFIXES}），
 * 与 {@code loadConfig} 里 {@code flattenSettingToConfig} 的 {@code LEGACY_NAME_TO_PATH}
 * 互补/对齐 —— 两端同一份数据落到相同路径，水印配置才真正连通。</p>
 */
const SETTING_NAME_TO_CONFIG_PATH: Record<string, string> = {
  WatermarkOpen: "security.watermark.enable",
  WatermarkColor: "security.watermark.color",
  WatermarkAlpha: "security.watermark.alpha",
  WatermarkRotate: "security.watermark.rotate",
};

export function mergeDefaultSetting(items: SettingItem[]): void {
  if (!Array.isArray(items)) return;
  const patch: Record<string, unknown> = {};
  items.forEach((item) => {
    if (!item?.sysSettingName || item.sysSettingValue == null) return;
    const raw = String(item.sysSettingValue);
    const boolVal = raw === "true" ? true : raw === "false" ? false : undefined;
    const numeric = Number(raw);
    const val: unknown = boolVal ?? (String(raw).trim() !== "" && !Number.isNaN(numeric) ? numeric : raw);
    // ① sysSettingCode 即点号配置路径（如 other.avatarFrame.enable），前端零改动即可接入新开关
    const code = String((item as Record<string, unknown>).sysSettingCode ?? "");
    if (code.includes(".")) {
      // <b>修复原型链污染</b>：原实现按点号逐层下钻，下钻读的是继承链属性，
      // 于是 sysSettingCode="__proto__.isAdmin" 会把游标指向 Object.prototype，
      // 最后一行直接写到<b>全局原型</b>上 —— 之后所有对象都凭空多出 isAdmin，
      // 权限判断里的 if (obj.isAdmin) 恒真。详见 @repo/config 的 safe-path.ts。
      // 顶层白名单同时挡掉 http.baseURL / token.*Key / crypto.* 这类
      // 「改了就不只是改观感」的键：远程设置的定位是品牌与展示，不是安全基线。
      safeSetDotted(patch, code, val, {
        topKeyAllowlist: REMOTE_INJECTABLE_TOP_KEYS,
        pathPrefixAllowlist: REMOTE_INJECTABLE_PATH_PREFIXES,
        normalizeTopKey: normalizeTopKey,
        onReject: (path, reason) => {
          log.warn(`[setting] 已拒绝远程配置项 "${path}"：${reason}`);
        },
      });
      return;
    }
    // ② 兼容旧数据：仅按名称白名单映射到 login.*（旧式登录页名）与
    //     security.watermark.*（旧式 Watermark* 名）
    const loginKey = SETTING_TO_LOGIN_MAP[item.sysSettingName];
    const configPath = SETTING_NAME_TO_CONFIG_PATH[item.sysSettingName];
    if (!loginKey && !configPath) return;
    if (configPath) {
      // 修复：水印旧名（WatermarkOpen/WatermarkColor/WatermarkAlpha/WatermarkRotate）
      // 不在 login 子树上，必须落到 security.watermark（waterMarker 的读数路径），
      // 否则后端的水印配置在前端永远不生效。
      safeSetDotted(patch, configPath, val, {
        topKeyAllowlist: REMOTE_INJECTABLE_TOP_KEYS,
        pathPrefixAllowlist: REMOTE_INJECTABLE_PATH_PREFIXES,
        normalizeTopKey: normalizeTopKey,
        onReject: (path, reason) => {
          log.warn(`[setting] 已拒绝远程配置项 "${path}"：${reason}`);
        },
      });
      return;
    }
    patch.login = patch.login ?? {};
    let loginVal: unknown = boolVal ?? raw;
    if (loginKey === "featureTags") {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) loginVal = parsed;
      } catch {
        loginVal = raw;
      }
    }
    (patch.login as Record<string, unknown>)[loginKey] = loginVal;
  });
  if (Object.keys(patch).length > 0) {
    // mergeDefaultSetting：远程设置经 safe-path 白名单后写回
    applyConfig(patch as never);
  }
}

let bootstrapping = false;
let defaultSettingPromise: Promise<boolean> | null = null;

export function loadDefaultSetting(): Promise<boolean> {
  if (!shouldFetchRemoteSetting() || !isLoggedIn()) {
    return Promise.resolve(false);
  }
  if (defaultSettingPromise) {
    return defaultSettingPromise;
  }
  bootstrapping = true;
  defaultSettingPromise = doLoadDefaultSetting().finally(() => {
    bootstrapping = false;
  });
  return defaultSettingPromise;
}

async function doLoadDefaultSetting(): Promise<boolean> {
  try {
    // 复用 loadConfig 阶段缓存的原生 fetch 远程设置，避免再次请求同一接口
    // （判定依据是"loader 确实取回了响应"而非"列表非空"：平台没有默认设置时
    //   空列表也是有效结果，重复请求纯属浪费；未登录 403 仍会重拉，
    //   登录成功后另有 refreshDefaultSetting 兜底）
    const cached = getRemoteSettingList();
    if (hasRemoteSettingFetched()) {
      if (Array.isArray(cached) && cached.length) {
        mergeDefaultSetting(cached as SettingItem[]);
      }
      return true;
    }
    const { data } = await getDefaultSetting();
    if (Array.isArray(data)) {
      mergeDefaultSetting(data);
    }
    return true;
  } catch (error) {
    log.warn(`[setting] 远程登录页配置拉取失败，已降级使用本地配置`, error);
    return false;
  }
}

/**
 * 强制重新拉取后端 /v2/setting/default 并合并到 getConfig。
 *
 * 与 loadDefaultSetting 的区别：本函数**总是发起真实请求**（不复用 loader 的启动缓存），
 * 因此后端配置变更后能拿到新值；loadDefaultSetting 会复用启动期缓存，
 * 只适合首屏 bootstrap，不能用于热重载。
 *
 * 未登录时 /v2/setting/default 受鉴权保护，启动阶段拉取可能失败，
 * 因此登录成功后用本函数再拉一次并广播热重载。
 */
export async function refreshDefaultSetting(): Promise<boolean> {
  if (!shouldFetchRemoteSetting()) {
    return false;
  }
  const ok = await fetchAndMergeDefaultSetting();
  // 默认设置接口只返回 default/sso 分组，codec 开关在 config 分组，需要单独拉。
  // 失败不阻塞登录页/首页，保持上一次运行时状态。
  await refreshHttpCodecSetting();
  notifyHotReload();
  return ok;
}

/**
 * 拉取系统配置里的 codec 开关并写入前端运行时。
 *
 * <p>成功登录后调用；系统配置页保存后也会调用，使 UI 开关无需刷新整页即可生效。</p>
 */
export async function refreshHttpCodecSetting(): Promise<boolean> {
  if (!isLoggedIn()) {
    return false;
  }
  try {
    const response = await getApiHttp()
      .get("/v2/setting/list")
      .query({ sysSettingGroup: "config" })
      .then((r) => r.data as { data?: unknown } | unknown[]);
    const payload = Array.isArray(response)
      ? response
      : (response as { data?: unknown })?.data;
    const rows = Array.isArray(payload)
      ? payload
      : Array.isArray((payload as { data?: unknown })?.data)
        ? ((payload as { data: unknown[] }).data)
        : [];
    applyHttpCodecSettings(rows as SettingItem[]);
    return rows.length > 0;
  } catch (error) {
    log.warn("[setting] codec 开关拉取失败，保持当前运行时配置", error);
    return false;
  }
}

/** 真实请求 + 合并（失败静默，返回是否成功） */
async function fetchAndMergeDefaultSetting(): Promise<boolean> {
  try {
    const { data } = await getDefaultSetting();
    if (!Array.isArray(data)) {
      return false;
    }
    mergeDefaultSetting(data);
    return true;
  } catch (error) {
    log.warn(`[setting] 远程配置刷新失败，继续使用当前配置`, error);
    return false;
  }
}

/** 广播热重载（各注册方重新应用依赖配置的能力，如 socket / 水印 / 反调试） */
function notifyHotReload(): void {
  hotReloadCallbacks.forEach((cb) => {
    try {
      cb();
    } catch (error) {
      log.warn(`[setting] 配置热重载回调失败`, error);
    }
  });
}

// ==================== 配置热重载 ====================

const hotReloadCallbacks = new Set<() => void>();
let hotReloadBound = false;

export function onConfigHotReload(cb: () => void): () => void {
  hotReloadCallbacks.add(cb);
  return () => hotReloadCallbacks.delete(cb);
}

export function bindConfigHotReload(): void {
  if (hotReloadBound || typeof window === "undefined") {
    return;
  }
  hotReloadBound = true;

  window.addEventListener(CONFIG_VERSION_CHANGE_EVENT, (event) => {
    const version = (event as CustomEvent<{ version?: string }>)?.detail?.version;
    if (!version || bootstrapping) return;
    window.setTimeout(() => {
      void (async () => {
        try {
          // 关键：必须强制重新拉取（refreshDefaultSetting → 真实请求）。
          // 旧实现调用 loadDefaultSetting()，会复用启动期缓存 remoteSettingList，
          // 导致后端改配置后热更新仍拿到旧值，等于热重载失效。
          defaultSettingPromise = null;
          if (shouldFetchRemoteSetting()) {
            await refreshDefaultSetting();
          } else {
            notifyHotReload();
          }
        } catch (error) {
          log.warn(`[setting] 配置热重载失败`, error);
          notifyHotReload();
        }
      })();
    }, 500);
  });
}