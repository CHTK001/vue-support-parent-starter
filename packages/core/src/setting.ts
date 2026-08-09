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
import { getConfig, setConfig, CONFIG_VERSION_CHANGE_EVENT } from "@repo/config";
import { getDefaultSetting, type SettingItem } from "./api";

function shouldFetchRemoteSetting(): boolean {
  return getConfig()?.config?.enable !== false && !!getConfig()?.url?.setting;
}

const SETTING_TO_LOGIN_MAP: Record<string, string> = {
  CheckCodeOpen: "captcha",
  CheckTotpOpen: "otp",
  SlidingBlockOpen: "slider",
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
    const loginKey = SETTING_TO_LOGIN_MAP[item.sysSettingName];
    if (!loginKey) return;
    const raw = String(item.sysSettingValue);
    const boolVal = raw === "true" ? true : raw === "false" ? false : undefined;
    patch.login = patch.login ?? {};
    let val: unknown = boolVal ?? raw;
    if (loginKey === "featureTags") {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) val = parsed;
      } catch {
        val = raw;
      }
    }
    (patch.login as Record<string, unknown>)[loginKey] = val;
  });
  if (Object.keys(patch).length > 0) {
    setConfig(patch as never);
  }
}

let defaultSettingPromise: Promise<boolean> | null = null;

export function loadDefaultSetting(): Promise<boolean> {
  if (!shouldFetchRemoteSetting()) {
    return Promise.resolve(true);
  }
  if (defaultSettingPromise) {
    return defaultSettingPromise;
  }
  defaultSettingPromise = doLoadDefaultSetting();
  return defaultSettingPromise;
}

async function doLoadDefaultSetting(): Promise<boolean> {
  try {
    const { data } = await getDefaultSetting();
    if (Array.isArray(data)) {
      mergeDefaultSetting(data);
    }
    return true;
  } catch (error) {
    console.warn("[setting] 远程登录页配置拉取失败，已降级使用本地配置", error);
    return false;
  }
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
    if (!version) return;
    window.setTimeout(() => {
      void (async () => {
        try {
          defaultSettingPromise = null;
          await loadDefaultSetting();
          hotReloadCallbacks.forEach((cb) => {
            try { cb(); } catch (error) {
              console.warn("[setting] 配置热重载回调失败", error);
            }
          });
        } catch (error) {
          console.warn("[setting] 配置热重载失败", error);
        }
      })();
    }, 500);
  });
}