/**
 * 默认配置加载（core）
 *
 * 进入页面（登录 / 首页）时调用，从后端拉取默认配置（/v2/setting/default）
 * 合并进 getConfig，主要控制：
 *   - OpenVerifyCode 是否开启图形验证码
 *   - CheckTotpOpen 是否开启 TOTP 双因素
 *   - OpenVcode 是否开启滑动验证
 *   - OpenThirdPartyLogin / SsoSetting 第三方登录
 *   - 登录页品牌展示项（SystemName / LoginLogo / BeiAn 等）
 *
 * 调用方只需调 loadDefaultSetting()，无需关心接口与合并细节。
 */
import { getConfig, setConfig } from "@repo/config";
import { getDefaultSetting, type SettingItem } from "./api";

/** 是否从后端拉取默认配置（app.yaml 可配，默认 true） */
function shouldFetchRemoteSetting(): boolean {
  return getConfig()?.config?.remoteSettingUrl !== undefined;
}

/** 把一条 setting 映射为 config 顶层键（true/false 布尔，其余原值） */
function mapSettingToConfig(key: string, value: string, result: Record<string, unknown>): void {
  const v = value;
  if (v === "true") result[key] = true;
  else if (v === "false") result[key] = false;
  else result[key] = v;
}

/** 从默认配置组提取配置并合并进 getConfig */
export function mergeDefaultSetting(items: SettingItem[]): void {
  if (!Array.isArray(items)) return;
  const patch: Record<string, unknown> = {};
  items.forEach((item) => {
    if (!item?.sysSettingName || item.sysSettingValue == null) return;
    mapSettingToConfig(item.sysSettingName, String(item.sysSettingValue), patch);
  });
  if (Object.keys(patch).length > 0) {
    setConfig(patch as never);
  }
}

/**
 * 加载默认配置并合并到 getConfig。
 * 接口异常时保留 app.yaml 默认值，不打断页面展示。
 */
export async function loadDefaultSetting(): Promise<void> {
  if (!shouldFetchRemoteSetting()) {
    return;
  }
  try {
    const { data } = await getDefaultSetting();
    if (Array.isArray(data)) {
      mergeDefaultSetting(data);
    }
  } catch {
    // 配置加载失败时保留默认值
  }
}
