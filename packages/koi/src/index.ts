/**
 * @repo/koi —— koi 主题/框架适配包
 *
 * 基于 Element Plus，实现 @repo/ui 抽象契约的一套适配实现。
 * 换框架时，业务代码只依赖 @repo/ui 抽象层，切换本包即可整体替换视觉体系。
 */

/** 本适配包的框架标识，供 store 持久化与启动选择使用 */
export const KOI_FRAMEWORK_ID = "koi";
