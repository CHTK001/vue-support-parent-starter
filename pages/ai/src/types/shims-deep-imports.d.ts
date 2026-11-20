/**
 * 深路径模块的类型垫片（ambient module declarations）。
 *
 * <p>背景：pages/ai 的全量 vue-tsc 有约 3GB 内存红线（ops/port-watchdog 对构建类
 * 进程按 BUILD-OVER-MEMORY 击杀）。若经 tsconfig paths 直读 {@code @repo/theme} /
 * {@code @repo/languages} 的源码，会把整棵主题/语言包源码拖进类型程序导致内存爆掉。
 * 因此这些深路径在<b>运行时</b>由 vite alias（turbo/vite/createVite.ts 的
 * repoSubPathAliases / REPO_ALIAS）解析，<b>类型侧</b>用这里的最小签名垫片，
 * 不加载真实源码。</p>
 *
 * <p>注意：本文件必须保持「全局脚本」形态（顶层不得出现 import / export），
 * 否则 declare module 会退化为模块增强、对解析失败的模块不生效。
 * 依赖的类型一律在 declare module 块内 import。</p>
 *
 * <p>维护约定：垫片签名必须与真实模块保持一致（真实模块改动时同步更新这里）；
 * 若未来宿主拆分/内存预算放宽，可改回 tsconfig paths 直读并删除本文件。</p>
 */

/** ThemeConfig/registry.ts —— 主题配置抽屉分区注册表 */
declare module "@repo/theme/koi/layouts/components/ThemeConfig/registry" {
  import type { Component } from "vue";

  export type ThemeConfigTab = "appearance" | "interface" | "extension" | "advanced";

  /** 组件加载器：同步 / {default} / 动态 import */
  export type ThemeConfigSectionLoader = () =>
    | Component
    | { default: Component }
    | Promise<Component | { default: Component }>;

  /** 一个可注册进主题配置抽屉的分区 */
  export interface ThemeConfigSectionRegistration {
    readonly id: string;
    readonly tab: ThemeConfigTab;
    readonly order?: number;
    readonly visible?: () => boolean;
    readonly component: ThemeConfigSectionLoader;
  }

  export function registerThemeConfigSection(
    registration: ThemeConfigSectionRegistration,
  ): () => void;
  export function getThemeConfigSections(): readonly ThemeConfigSectionRegistration[];
  export function sectionsForTab(tab: ThemeConfigTab): ThemeConfigSectionRegistration[];
  export function resolveSectionComponent(
    registration: ThemeConfigSectionRegistration,
  ): Component;
}

/** floatingWidgets.ts —— koi 主布局浮动组件注册表 */
declare module "@repo/theme/koi/layouts/floatingWidgets" {
  import type { Component } from "vue";

  /** 组件加载器：同步 / {default} / 动态 import */
  export type FloatingWidgetLoader = () =>
    | Component
    | { default: Component }
    | Promise<Component | { default: Component }>;

  /** 一个可注册进 koi 主布局的浮动组件 */
  export interface FloatingWidgetRegistration {
    readonly id: string;
    readonly order?: number;
    readonly visible?: () => boolean;
    readonly component: FloatingWidgetLoader;
  }

  export function registerFloatingWidget(
    registration: FloatingWidgetRegistration,
  ): () => void;
  export function getFloatingWidgets(): readonly FloatingWidgetRegistration[];
  export function visibleFloatingWidgets(): FloatingWidgetRegistration[];
  export function resolveFloatingComponent(
    registration: FloatingWidgetRegistration,
  ): Component;
}

/** 语言包模块子路径（locales/index.ts 合并框架文案用） */
declare module "@repo/languages/modules/zh" {
  const messages: Record<string, any>;
  export default messages;
}
declare module "@repo/languages/modules/en" {
  const messages: Record<string, any>;
  export default messages;
}
