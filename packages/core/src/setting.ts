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
import { getConfig, setConfig, CONFIG_VERSION_CHANGE_EVENT, getRemoteSettingList, hasRemoteSettingFetched } from "@repo/config";
import { getDefaultSetting, type SettingItem } from "./api";
import { log } from "@repo/utils";

function shouldFetchRemoteSetting(): boolean {
  return getConfig()?.config?.enable !== false && !!getConfig()?.url?.setting;
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
      const keys = code.split(".");
      let cur = patch;
      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (typeof cur[key] !== "object" || cur[key] === null) cur[key] = {};
        cur = cur[key] as Record<string, unknown>;
      }
      cur[keys[keys.length - 1]] = val;
      return;
    }
    // ② 兼容旧数据：仅按名称白名单映射到 login.*
    const loginKey = SETTING_TO_LOGIN_MAP[item.sysSettingName];
    if (!loginKey) return;
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
    setConfig(patch as never);
  }
}

let bootstrapping = false;
let defaultSettingPromise: Promise<boolean> | null = null;

export function loadDefaultSetting(): Promise<boolean> {
  if (!shouldFetchRemoteSetting()) {
    return Promise.resolve(true);
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
  notifyHotReload();
  return ok;
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