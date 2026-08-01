/**
 * pinia 从 @repo/config 初始化
 *
 * 应用启动（createApp 加载 app.yaml 后）调用 initPiniaFromConfig()，
 * 把 config 中的值写入各 store，保证主题 / 语言等初始状态来自统一配置，
 * 而不是每个 theme 自己写死一套。
 */
import { getConfig } from "@repo/config";
import useGlobalStore from "./modules/global";

/** 把 "zh-CN" 之类语言码归一化为 "zh" / "en" */
function normalizeLocale(locale: string): string {
  const lang = locale.toLowerCase().split("-")[0];
  return ["zh", "cn"].includes(lang) ? "zh" : "en";
}

/** 从 @repo/config 初始化全部 store */
export function initPiniaFromConfig(): void {
  const config = getConfig();
  const globalStore = useGlobalStore();

  // 语言：app.yaml i18n.defaultLocale（如 "zh-CN"）→ store language
  const locale = config.i18n?.defaultLocale;
  if (locale) {
    globalStore.setGlobalState("language", normalizeLocale(locale));
  }
}
