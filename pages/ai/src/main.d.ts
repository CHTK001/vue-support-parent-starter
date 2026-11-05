/**
 * main.js 的类型声明。
 *
 * <p><strong>为什么需要它</strong>：AI 独立应用壳（apps/vue-support-ai-starter/src/main.js）
 * 深导入 {@code @pages/ai/main.js} 的 {@code mountAiApp}，而 main.js 是纯 JS 文件、
 * 既没有 JSDoc 也没有同名 .d.ts。TS 对无声明的 .js 只能隐式推成 any，
 * 在 noImplicitAny 下直接报 TS7016。</p>
 *
 * <p>这里只声明对外契约（应用壳真正用到的那个导出），不给内部实现补类型 ——
 * 那属于把整个应用迁到 TS 的工程，不在本文件范围内。</p>
 *
 * <p>签名依据：main.js `export function mountAiApp()`，返回
 * `bootstrapAndMount()` 的单飞 promise（重复调用复用同一个，不会二次挂载），
 * 无参数、不 reject（失败在内部记录 console.error）。</p>
 */
export function mountAiApp(): Promise<void>;