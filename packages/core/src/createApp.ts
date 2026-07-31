/**
 * createApp —— 链式创建应用的主入口
 *
 * 严格顺序的三步链路，前一步成功才进入下一步：
 *   ① 异步加载 wasm 加密模块（aes / sm2 / sm3 / sm4）—— 失败抛 SystemException
 *   ② 异步加载 apps/{appName}/app.yaml 并写入 @repo/config 统一配置 —— 失败用默认值
 *   ③ 异步加载主题等系统配置 —— 失败抛 SystemException
 *
 * 用法：
 *   const app = await createApp({ appName: "demo" });
 *   app.crypto.sm3(...);  app.config.title;  app.theme;
 */
import { loadCrypto, SystemException, type CryptoModule } from "./crypto";
import {
  defaultAppConfig,
  mergeAppConfig,
  parseAppYaml,
  setConfig,
  type AppConfig,
} from "@repo/config";
import { applyTheme, getTheme, type ThemeDefinition } from "@repo/theme";

export interface CreateAppOptions {
  /** 应用名，对应 apps/{appName}/app.yaml；缺省 "default" */
  appName?: string;
  /** app.yaml 的完整 URL；缺省自动拼接 apps/{appName}/app.yaml */
  configUrl?: string;
  /** wasm 加密模块 URL；缺省走默认路径 */
  cryptoUrl?: string;
  /** 自定义加密模块加载器（测试或自定义集成时传入） */
  cryptoLoader?: () => Promise<CryptoModule>;
  /** 资源基础路径（部署到子路径时用），缺省 "" */
  baseUrl?: string;
}

/** createApp 完成后的应用上下文 */
export interface AppContext {
  appName: string;
  /** 加密模块（wasm） */
  crypto: CryptoModule;
  /** 统一配置（app.yaml 合并默认值后的结果） */
  config: AppConfig;
  /** 当前主题 */
  theme: ThemeDefinition;
}

/**
 * 链式创建应用
 * @throws SystemException 第①/③步失败时
 */
export async function createApp(options: CreateAppOptions = {}): Promise<AppContext> {
  const baseUrl = options.baseUrl ?? "";
  const appName = options.appName ?? "default";

  // ── ① 加载 wasm 加密模块（失败 → 抛系统异常，链路中断）──
  const crypto = await loadCrypto({
    url: options.cryptoUrl,
    loader: options.cryptoLoader,
  });

  // ── ② 加载 app.yaml 写入统一配置（失败 → 默认值，链路继续）──
  const config = await loadAppConfig({
    appName,
    configUrl: options.configUrl,
    baseUrl,
  });

  // ── ③ 加载主题等系统配置（失败 → 抛系统异常）──
  const theme = await loadSystemConfig(config);

  return { appName, crypto, config, theme };
}

/** ② 加载 app.yaml：先重置为默认值，再合并 yaml 内容；任何失败都回退默认值 */
async function loadAppConfig(options: {
  appName: string;
  configUrl?: string;
  baseUrl: string;
}): Promise<AppConfig> {
  const fallback = (): AppConfig => {
    setConfig({ ...defaultAppConfig });
    return { ...defaultAppConfig };
  };

  try {
    const url =
      options.configUrl ?? `${options.baseUrl}/apps/${options.appName}/app.yaml`;
    const res = await fetch(url);
    if (!res.ok) {
      return fallback();
    }
    const partial = parseAppYaml(await res.text());
    const merged = mergeAppConfig(partial);
    setConfig(merged);
    return merged;
  } catch {
    return fallback();
  }
}

/** ③ 加载主题等系统配置：依据 config.themeId 取主题并应用 */
async function loadSystemConfig(config: AppConfig): Promise<ThemeDefinition> {
  try {
    const theme = getTheme(config.themeId);
    applyTheme(theme.light);
    return theme;
  } catch (e) {
    throw new SystemException(`加载主题失败: ${config.themeId}`, e);
  }
}
