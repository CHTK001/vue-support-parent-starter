/**
 * main.js 的类型声明。
 *
 * 为什么需要它：src/index.ts 里 `export { mountAiApp } from "./main.js"`，
 * 而 main.js 是纯 JS 文件、既没有 JSDoc 也没有同名 .d.ts。
 * TS 对无声明的 .js 只能隐式推成 any，在 noImplicitAny 下直接报 TS7016。
 *
 * 这里只声明对外契约（index.ts 真正用到的那个导出），不给内部实现补类型 ——
 * 那属于把整个应用迁到 TS 的工程，不在本文件范围内。
 *
 * 签名依据：main.js:348 `export async function mountAiApp()`，
 * 内部 `await bootstrapAndMount()`，无参数、无返回值。
 */
export function mountAiApp(): Promise<void>;