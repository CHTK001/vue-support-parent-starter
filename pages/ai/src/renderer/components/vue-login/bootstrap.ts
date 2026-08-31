import { createHttp } from '@repo/utils';
import { setApiHttp } from '@repo/core';
import { loadConfig, getConfig } from '@repo/config';
import { registerThemeContext } from '@repo/theme';
import useGlobalStore from '@repo/pinia/modules/global';

export interface VueLoginBootstrapOptions {
  appName?: string;
  baseUrl?: string;
  configUrl?: string;
}

/**
 * 登录子应用的最小初始化：
 *  - loadConfig 加载 app.yaml + 远程 setting（不依赖 vue reactive 即可读）
 *  - setApiHttp 注入裸 http（encrypt/sign 默认 false，不依赖 wasm crypto）
 *
 *  刻意不调用 @repo/core 的 createApp()：那会拉入 crypto/socket/monitor/
 * antiDebug 等登录页用不到的整条装配链。登录页只依赖 http + config + pinia。
 *
 *  appName 默认取 VITE_APP_NAME（由宿主 vite.config.ts 的 createVite
 *  options.appName 注入），让登录子应用自动跟随宿主应用配置；缺失时
 *  兜底 'ai' 保持向后兼容。
 */
export async function bootstrapVueLogin(options: VueLoginBootstrapOptions = {}): Promise<void> {
  // 主题上下文：koi 登录页内 useTheme() 依赖全局 store（layout/isDark/themeColor），
  // 此处显式注册，避免拉入整套 koi/framework（element-plus/router/axios/menu glob）。
  registerThemeContext({
    useGlobalStore: useGlobalStore as never,
  });
  const env =
    typeof import.meta !== 'undefined' && (import.meta as { env?: Record<string, string> }).env
      ? (import.meta as { env: Record<string, string> }).env
      : ({} as Record<string, string>);
  const appName = options.appName ?? env.VITE_APP_NAME ?? 'ai';
  await loadConfig({
    appName,
    baseUrl: options.baseUrl ?? '',
    configUrl: options.configUrl,
  });
  const http = createHttp();
  setApiHttp(http);
  if (typeof window !== 'undefined') {
    (window as unknown as Record<string, unknown>).__vueLoginBootstrapped = true;
  }
}

export { getConfig };
