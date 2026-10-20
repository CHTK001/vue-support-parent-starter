/**
 * `@pages/ai` 的类型桩（仅本应用使用）。
 *
 * <p><b>为什么需要桩，而不是在根 tsconfig 里加 paths。</b>pages/ai 的源码内部用 `@/…`
 * 指向它自己的 src（AI 控制台的既有约定，见 pages/ai/tsconfig.json）。若在本应用的
 * 类型检查里真的把 pages/ai 的 .ts/.vue 拉进程序，`@/framework/context`、
 * `@/services/ApiService` 这些导入就需要根 tsconfig 增加 `"@/*": ["pages/ai/src/*"]`，
 * 而根 tsconfig 是全仓共享的 —— geo / video 等应用也在用 `@/`，会一并被改写到 pages/ai，
 * 属于典型的「修一处坏一片」。</p>
 *
 * <p>这里用「精确 + 通配」的 ambient 声明：类型检查只看到组件/函数的形状，不跟进
 * pages/ai 的内部实现；运行时解析由 vite.config.ts 的别名负责
 * （`@pages/ai` → pages/ai/src、`@` → pages/ai/src）。</p>
 */

/** 宿主嵌入装配入口（pages/ai/src/embed.ts） */
declare module "@pages/ai/embed" {
  /**
   * 采用宿主已装配的框架上下文。
   *
   * @param ctx 宿主 createApp 返回的上下文
   */
  export function adoptHostFramework(ctx: unknown): void;
}

/** pages/ai 的组件（本应用只嵌入模型管理与默认模型两个页面） */
declare module "@pages/ai/*" {
  import type { DefineComponent } from "vue";

  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>;
  export default component;
}
