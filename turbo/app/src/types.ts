/**
 * @repo/app —— 双框架统一入口的共享类型
 *
 * createContextApp 是唯一对外入口，内部按 options.framework 分发：
 *   - "vue"（默认）：createVueApp —— 现有 Vue 装配逻辑
 *   - "react"：createReactApp —— React 装配（复用 core 配置/鉴权/存储逻辑）
 */

import type { AppConfig, DeepPartial } from "@repo/config";
import type { AppContext } from "@repo/core";

/** 应用形态（Vue 语义；React 侧仅 "single" 语义相关） */
export type AppMode = "router" | "single";

/** 目标框架：决定内部走 Vue 还是 React 装配实现 */
export type AppFramework = "vue" | "react";

/**
 * 框架无关的统一启动选项。
 *
 * 与框架相关的字段（pinia / i18n / install）按框架各自扩展，
 * 这里只保留两套实现都要消费的字段。
 */
export interface CreateAppOptions {
  /** 目标框架：缺省 "vue"（保持向后兼容，现有应用无需改动） */
  framework?: AppFramework;
  /** 应用名，对应 apps/{appName}/app.yaml；缺省读 vite 注入的 VITE_APP_NAME */
  appName?: string;
  /** app.yaml URL；缺省内部自动拼接 /apps/{appName}/app.yaml */
  configUrl?: string;
  /** 页面标题（可选，覆盖默认配置） */
  title?: string;
  /** 应用形态：router / single */
  mode?: AppMode;
  /**
   * 代码级默认配置（优先级最低的一层）。
   *
   * <p>让应用在 {@code main.ts} 里声明自身默认，例如分组导航：</p>
   *
   * <pre>{@code
   * await createContextApp({ appName: "xxx", defaults: { menu: { collapseSingleChild: true } } })
   * }</pre>
   *
   * <p>app.example.yaml / app.yaml / 远程配置 / 环境变量仍会覆盖它。
   * 本字段随「其余选项透传给 core createApp」下发到 core 的 {@code defaults}。</p>
   */
  defaults?: DeepPartial<AppConfig>;
  /** 其余选项透传给 core createApp */
  [key: string]: unknown;
}

/** createContextApp 挂载完成后返回的应用实例（框架无关的公共面） */
export interface AppInstance {
  /** core 装配的应用上下文（crypto/config/storage/token/http 等） */
  context: AppContext;
  /** 是否走 React 渲染 */
  isReact: boolean;
  /** 卸载函数：销毁框架实例 + core 副作用 */
  dispose: () => void;
}
