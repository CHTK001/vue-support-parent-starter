/**
 * @repo/app/platform —— 平台适配层（类型 + 契约）
 *
 * <p><b>设计口径：平台的差异用「实现」表达，不用 if/else 表达。</b>
 * 每个平台提供一个 {@link AppPlatformAdapter} 实现（web / wechat-miniapp），
 * 统一入口只按 {@code platform} 查表拿到实现，分发逻辑只有一行。</p>
 *
 * <p>本文件只有类型，编译期擦除：小程序入口引用它不会带入任何 Web 依赖。</p>
 */

/** 平台标识（缺省 "web"） */
export type AppPlatform = "web" | "wechat-miniapp";

/**
 * 平台适配器契约。
 *
 * <p>实现方只负责「按本平台的运行时装配出构建器」；不做业务判断，
 * 也不感知其它平台的存在。</p>
 *
 * @typeParam Options 该平台接受的启动选项
 * @typeParam Builder 该平台返回的链式构建器
 */
export interface AppPlatformAdapter<Options, Builder> {
  /** 本实现对应的平台标识 */
  readonly platform: AppPlatform;
  /** 装配并返回构建器（同步，uni 入口要求同步返回） */
  create(options: Options): Builder;
}
