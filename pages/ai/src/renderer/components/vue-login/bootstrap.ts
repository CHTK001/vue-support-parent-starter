import { createHttp } from '@repo/utils';
import { setApiHttp } from '@repo/core';
import { loadConfig, getConfig } from '@repo/config';
import { registerThemeContext } from '@repo/theme';
import useGlobalStore from '@repo/pinia/modules/global';

// 嵌入登录不走 koi/framework 顶层装配（刻意绕开 createApp 整条链），
// 但登录页组件（ReThemeColor 等）的 useTheme() 依赖主题上下文。
// 这里在 bootstrap 模块加载时注入 useGlobalStore，保证 useTheme() 不抛
// "useGlobalStore 未注册"。registerThemeContext 为合并式幂等，与主应用重复注册无副作用。
registerThemeContext({
  useGlobalStore: useGlobalStore as never,
});

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
 * 刻意不调用 @repo/core 的 createApp()：那会拉入 crypto/socket/monitor/
 * antiDebug 等登录页用不到的整条装配链。登录页只依赖 http + config + pinia。
 */
export async function bootstrapVueLogin(options: VueLoginBootstrapOptions = {}): Promise<void> {
  await loadConfig({
    appName: options.appName ?? 'ai',
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
